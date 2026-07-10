#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
workflows="$root/.github/workflows"
legacy_import="import""-resources.sh"
legacy_identity="github""-ci-deployer"
legacy_writer="google_project_iam_member.ci_""artifact_writer"
legacy_run_admin="google_project_iam_member.ci_""run_admin"

if rg -n 'principalSet://.*attribute\.repository' "$root/infra/terraform"; then
  echo "Repository-wide WIF principalSet bindings are forbidden." >&2
  exit 1
fi

for subject in \
  'repo:${var.github_org}/${var.github_repo}:pull_request' \
  'repo:${var.github_org}/${var.github_repo}:ref:refs/heads/${var.github_branch}' \
  'repo:${var.github_org}/${var.github_repo}:environment:dev' \
  'repo:${var.github_org}/${var.github_repo}:environment:prod' \
  'repo:${var.github_org}/${var.github_repo}:environment:terraform-apply'; do
  rg -Fq "$subject" "$root/infra/terraform/main.tf"
done

for identity in plan publisher dev prod apply; do
  rg -Fq "resource \"google_iam_workload_identity_pool\" \"${identity}\"" "$root/infra/terraform/main.tf"
  rg -Fq "resource \"google_iam_workload_identity_pool_provider\" \"${identity}\"" "$root/infra/terraform/main.tf"
  rg -Fq "resource \"google_service_account_iam_member\" \"wif_${identity}\"" "$root/infra/terraform/main.tf"
  rg -q "attribute_condition.*local\\.wif_subjects\\.${identity}" "$root/infra/terraform/main.tf"
  rg -q "member.*google_iam_workload_identity_pool\\.${identity}\\.name.*local\\.wif_subjects\\.${identity}" "$root/infra/terraform/main.tf"
done

if rg -n 'github_ci' "$root/infra/terraform" --glob '*.tf'; then
  echo "The legacy shared CI identity is forbidden." >&2
  exit 1
fi

if [ -e "$root/infra/terraform/$legacy_import" ]; then
  echo "The obsolete generic Terraform import helper is forbidden." >&2
  exit 1
fi

if rg -n "${legacy_identity}|${legacy_writer}|${legacy_run_admin}" \
  "$root/infra/terraform/README.md" "$root/infra/terraform"/*.tf; then
  echo "Active infrastructure guidance contains a retired CI identity or resource address." >&2
  exit 1
fi

if rg -n 'run .?terraform apply|terraform apply[[:space:]]+-auto-approve' \
  "$root/infra/terraform/README.md"; then
  echo "Bootstrap guidance cannot recommend an unreviewed direct apply." >&2
  exit 1
fi
rg -Fq 'apply that exact reviewed plan' "$root/infra/terraform/README.md"

if awk '
  /^resource "google_project_iam_(member|binding)"/ { capture = 1; block = $0 ORS; next }
  capture { block = block $0 ORS }
  /^}/ && capture {
    if (block ~ /roles\/storage\./ && block ~ /google_service_account\.plan\.email/) {
      print block
      found = 1
    }
    capture = 0
    block = ""
  }
  END { exit found ? 0 : 1 }
' "$root/infra/terraform"/*.tf; then
  echo "The plan service account cannot receive a project-level storage role." >&2
  exit 1
fi

for required in \
  'external bootstrap' \
  'roles/storage.objectViewer' \
  'At that bucket only' \
  'Terraform state can' \
  'contain secrets' \
  'externally `NOT_VERIFIED`'; do
  rg -Fq "$required" "$root/infra/terraform/README.md"
done

# Project-wide Cloud Run administration is reserved for the manual Terraform
# applier. Automatic publisher/dev/prod identities receive only narrow grants.
rg -Fq '"roles/run.admin"' "$root/infra/terraform/main.tf"
if rg -n 'roles/run\.admin' "$root/infra/terraform/cloud-run.tf"; then
  echo "Application delivery identities cannot receive project-wide Cloud Run admin." >&2
  exit 1
fi

artifact_reader_block() {
  local identity="$1"
  awk -v resource_name="$identity" '
    $0 == "resource \"google_artifact_registry_repository_iam_member\" \"" resource_name "_reader\" {" {
      capture = 1
    }
    capture { print }
    /^}/ && capture { exit }
  ' "$root/infra/terraform/cloud-run.tf"
}

for identity in dev prod; do
  block="$(artifact_reader_block "$identity")"
  printf '%s\n' "$block" | rg -Fq 'repository = google_artifact_registry_repository.functions.repository_id'
  printf '%s\n' "$block" | rg -Fq 'role       = "roles/artifactregistry.reader"'
  printf '%s\n' "$block" | rg -Fq "member     = \"serviceAccount:\${google_service_account.${identity}.email}\""
done

if awk '
  /^resource / { capture = 1; block = $0 ORS; header = $0; next }
  capture { block = block $0 ORS }
  /^}/ && capture {
    deployer = block ~ /google_service_account\.(dev|prod)\.email/
    project_artifact = header ~ /google_project_iam_(member|binding)/ && block ~ /roles\/artifactregistry\./
    elevated_repository = block ~ /roles\/artifactregistry\.(writer|repoAdmin|admin)/
    if (deployer && (project_artifact || elevated_repository)) {
      print block
      found = 1
    }
    capture = 0
    block = ""
    header = ""
  }
  END { exit found ? 0 : 1 }
' "$root/infra/terraform"/*.tf; then
  echo "Dev/prod deployers may only receive repository-level Artifact Registry reader access." >&2
  exit 1
fi

if rg -n -- '--allow-unauthenticated' \
  "$workflows/build-and-deploy.yml" "$workflows/deploy-production.yml"; then
  echo "Developer-only deployers cannot mutate public Cloud Run invoker IAM." >&2
  exit 1
fi

rg -Fq 'roles/run.invoker' "$root/infra/terraform/README.md"
rg -Fq 'separately grant' "$root/infra/terraform/README.md"

if rg -n 'GCP_WIF_PROVIDER|GCP_WIF_SA_EMAIL' "$workflows"; then
  echo "Automatic workflows cannot fall back to the legacy shared GCP identity." >&2
  exit 1
fi

if rg -n '^    environment: publisher$' "$workflows/build-and-deploy.yml"; then
  echo "The publisher must retain the exact main-ref OIDC subject, not an environment subject." >&2
  exit 1
fi

rg -q '^    environment: dev$' "$workflows/build-and-deploy.yml"
rg -q '^    environment: prod$' "$workflows/deploy-production.yml"
rg -q '^    environment: terraform-apply$' "$workflows/terraform-apply.yml"

if rg -n '^[[:space:]]+(push|pull_request|schedule):' "$workflows/terraform-apply.yml"; then
  echo "Terraform apply must remain workflow_dispatch-only." >&2
  exit 1
fi

if rg -n 'id-token|google-github-actions/auth|secrets\.' "$workflows/terraform-pr.yml"; then
  echo "Required Terraform PR validation must remain credential-free." >&2
  exit 1
fi

echo "Terraform trust-boundary policy passed."
