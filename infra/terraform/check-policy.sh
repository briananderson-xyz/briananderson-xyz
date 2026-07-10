#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
workflows="$root/.github/workflows"
legacy_import="import""-resources.sh"
legacy_identity="github""-ci-deployer"
legacy_writer="google_project_iam_member.ci_""artifact_writer"
legacy_run_admin="google_project_iam_member.ci_""run_admin"

grep_fallback() {
  local options="$1"
  local pattern="$2"
  shift 2

  local matched=1
  local path
  local file
  local file_list
  local status

  for path in "$@"; do
    if [ -d "$path" ]; then
      if file_list="$(mktemp)"; then
        :
      else
        status=$?
        echo "Unable to create a temporary policy search file." >&2
        return "$status"
      fi
      if find "$path" -type d -name '.*' -prune -o -type f -print0 >"$file_list"; then
        :
      else
        status=$?
        rm -f "$file_list"
        return "$status"
      fi

      while IFS= read -r -d '' file; do
        if grep "$options" -- "$pattern" "$file"; then
          matched=0
        else
          status=$?
          if [ "$status" -gt 1 ]; then
            rm -f "$file_list"
            return "$status"
          fi
        fi
      done <"$file_list"
      rm -f "$file_list"
    elif grep "$options" -- "$pattern" "$path"; then
      matched=0
    else
      status=$?
      if [ "$status" -gt 1 ]; then
        return "$status"
      fi
    fi
  done

  return "$matched"
}

contains_fixed() {
  local status

  if command -v rg >/dev/null 2>&1; then
    if rg -Fq -- "$1" "${@:2}"; then
      return 0
    else
      status=$?
    fi
  else
    if grep_fallback -Fq "$@"; then
      return 0
    else
      status=$?
    fi
  fi

  if [ "$status" -gt 1 ]; then
    echo "Policy search failed while checking for required text." >&2
    exit "$status"
  fi
  return "$status"
}

contains_regex() {
  local status

  if command -v rg >/dev/null 2>&1; then
    if rg -q -- "$1" "${@:2}"; then
      return 0
    else
      status=$?
    fi
  else
    if grep_fallback -Eq "$@"; then
      return 0
    else
      status=$?
    fi
  fi

  if [ "$status" -gt 1 ]; then
    echo "Policy search failed while checking for required text." >&2
    exit "$status"
  fi
  return "$status"
}

report_regex() {
  local status

  if command -v rg >/dev/null 2>&1; then
    if rg -n -- "$1" "${@:2}"; then
      return 0
    else
      status=$?
    fi
  else
    if grep_fallback -En "$@"; then
      return 0
    else
      status=$?
    fi
  fi

  if [ "$status" -gt 1 ]; then
    echo "Policy search failed while checking for forbidden text." >&2
    exit "$status"
  fi
  return "$status"
}

report_tf_regex() {
  local pattern="$1"
  local directory="$2"
  local status

  if command -v rg >/dev/null 2>&1; then
    if rg -n --glob '*.tf' -- "$pattern" "$directory"; then
      return 0
    else
      status=$?
    fi
  else
    if grep_fallback -En "$pattern" "$directory"/*.tf; then
      return 0
    else
      status=$?
    fi
  fi

  if [ "$status" -gt 1 ]; then
    echo "Policy search failed while checking Terraform files." >&2
    exit "$status"
  fi
  return "$status"
}

if report_regex 'principalSet://.*attribute\.repository' "$root/infra/terraform"; then
  echo "Repository-wide WIF principalSet bindings are forbidden." >&2
  exit 1
fi

for subject in \
  'repo:${var.github_org}/${var.github_repo}:pull_request' \
  'repo:${var.github_org}/${var.github_repo}:ref:refs/heads/${var.github_branch}' \
  'repo:${var.github_org}/${var.github_repo}:environment:dev' \
  'repo:${var.github_org}/${var.github_repo}:environment:prod' \
  'repo:${var.github_org}/${var.github_repo}:environment:terraform-apply'; do
  contains_fixed "$subject" "$root/infra/terraform/main.tf"
done

for identity in plan publisher dev prod apply; do
  contains_fixed "resource \"google_iam_workload_identity_pool\" \"${identity}\"" "$root/infra/terraform/main.tf"
  contains_fixed "resource \"google_iam_workload_identity_pool_provider\" \"${identity}\"" "$root/infra/terraform/main.tf"
  contains_fixed "resource \"google_service_account_iam_member\" \"wif_${identity}\"" "$root/infra/terraform/main.tf"
  contains_regex "attribute_condition.*local\\.wif_subjects\\.${identity}" "$root/infra/terraform/main.tf"
  contains_regex "member.*google_iam_workload_identity_pool\\.${identity}\\.name.*local\\.wif_subjects\\.${identity}" "$root/infra/terraform/main.tf"
done

if report_tf_regex 'github_ci' "$root/infra/terraform"; then
  echo "The legacy shared CI identity is forbidden." >&2
  exit 1
fi

if [ -e "$root/infra/terraform/$legacy_import" ]; then
  echo "The obsolete generic Terraform import helper is forbidden." >&2
  exit 1
fi

if report_regex "${legacy_identity}|${legacy_writer}|${legacy_run_admin}" \
  "$root/infra/terraform/README.md" "$root/infra/terraform"/*.tf; then
  echo "Active infrastructure guidance contains a retired CI identity or resource address." >&2
  exit 1
fi

if report_regex 'run .?terraform apply|terraform apply[[:space:]]+-auto-approve' \
  "$root/infra/terraform/README.md"; then
  echo "Bootstrap guidance cannot recommend an unreviewed direct apply." >&2
  exit 1
fi
contains_fixed 'apply that exact reviewed plan' "$root/infra/terraform/README.md"

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
  contains_fixed "$required" "$root/infra/terraform/README.md"
done

# Project-wide Cloud Run administration is reserved for the manual Terraform
# applier. Automatic publisher/dev/prod identities receive only narrow grants.
contains_fixed '"roles/run.admin"' "$root/infra/terraform/main.tf"
if report_regex 'roles/run\.admin' "$root/infra/terraform/cloud-run.tf"; then
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
  contains_fixed 'repository = google_artifact_registry_repository.functions.repository_id' <(printf '%s\n' "$block")
  contains_fixed 'role       = "roles/artifactregistry.reader"' <(printf '%s\n' "$block")
  contains_fixed "member     = \"serviceAccount:\${google_service_account.${identity}.email}\"" <(printf '%s\n' "$block")
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

if report_regex '--allow-unauthenticated' \
  "$workflows/build-and-deploy.yml" "$workflows/deploy-production.yml"; then
  echo "Developer-only deployers cannot mutate public Cloud Run invoker IAM." >&2
  exit 1
fi

contains_fixed 'roles/run.invoker' "$root/infra/terraform/README.md"
contains_fixed 'separately grant' "$root/infra/terraform/README.md"

if report_regex 'GCP_WIF_PROVIDER|GCP_WIF_SA_EMAIL' "$workflows"; then
  echo "Automatic workflows cannot fall back to the legacy shared GCP identity." >&2
  exit 1
fi

if report_regex '^    environment: publisher$' "$workflows/build-and-deploy.yml"; then
  echo "The publisher must retain the exact main-ref OIDC subject, not an environment subject." >&2
  exit 1
fi

contains_regex '^    environment: dev$' "$workflows/build-and-deploy.yml"
contains_regex '^    environment: prod$' "$workflows/deploy-production.yml"
contains_regex '^    environment: terraform-apply$' "$workflows/terraform-apply.yml"

if report_regex '^[[:space:]]+(push|pull_request|schedule):' "$workflows/terraform-apply.yml"; then
  echo "Terraform apply must remain workflow_dispatch-only." >&2
  exit 1
fi

if report_regex 'id-token|google-github-actions/auth|secrets\.' "$workflows/terraform-pr.yml"; then
  echo "Required Terraform PR validation must remain credential-free." >&2
  exit 1
fi

echo "Terraform trust-boundary policy passed."
