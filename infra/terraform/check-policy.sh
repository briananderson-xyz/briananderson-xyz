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

if report_regex 'terraform apply[[:space:]]+-auto-approve' "$root/infra/terraform/README.md"; then
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

assert_plan_project_iam_binding() {
  local resource_name="$1"
  local expected_role="$2"
  local block

  block="$(awk -v resource_name="$resource_name" '
    $0 == "resource \"google_project_iam_member\" \"" resource_name "\" {" { capture = 1 }
    capture { print }
    /^}/ && capture { exit }
  ' "$root/infra/terraform/main.tf")"
  contains_fixed 'project = var.project_id' <(printf '%s\n' "$block")
  contains_fixed "role    = \"$expected_role\"" <(printf '%s\n' "$block")
  contains_fixed 'member  = "serviceAccount:${google_service_account.plan.email}"' <(printf '%s\n' "$block")
}

assert_plan_project_iam_binding plan_viewer roles/viewer
assert_plan_project_iam_binding plan_secret_viewer roles/secretmanager.viewer

contains_fixed 'variable "terraform_state_bucket"' "$root/infra/terraform/variables.tf"
contains_fixed 'default     = "briananderson-xyz-tf-state"' "$root/infra/terraform/variables.tf"
state_reader_block="$(awk '
  /^resource "google_storage_bucket_iam_member" "plan_state_reader"/ { capture = 1 }
  capture { print }
  /^}/ && capture { exit }
' "$root/infra/terraform/main.tf")"
contains_fixed 'bucket = var.terraform_state_bucket' <(printf '%s\n' "$state_reader_block")
contains_fixed 'role   = "roles/storage.objectViewer"' <(printf '%s\n' "$state_reader_block")
contains_fixed 'member = "serviceAccount:${google_service_account.plan.email}"' <(printf '%s\n' "$state_reader_block")

bucket_iam_role_block="$(awk '
  /^resource "google_project_iam_custom_role" "plan_bucket_iam_reader"/ { capture = 1 }
  capture { print }
  /^}/ && capture { exit }
' "$root/infra/terraform/main.tf")"
contains_fixed 'permissions = ["storage.buckets.getIamPolicy"]' <(printf '%s\n' "$bucket_iam_role_block")
if report_regex 'storage\.buckets\.setIamPolicy|storage\.objects\.|roles/storage\.(admin|objectAdmin)' \
  <(printf '%s\n' "$bucket_iam_role_block"); then
  echo "The planner bucket-IAM custom role must remain read-only and object-blind." >&2
  exit 1
fi

assert_plan_bucket_iam_binding() {
  local resource_name="$1"
  local expected_bucket="$2"
  local block

  block="$(awk -v resource_name="$resource_name" '
    $0 == "resource \"google_storage_bucket_iam_member\" \"" resource_name "\" {" { capture = 1 }
    capture { print }
    /^}/ && capture { exit }
  ' "$root/infra/terraform/main.tf")"
  contains_fixed "bucket = $expected_bucket" <(printf '%s\n' "$block")
  contains_fixed 'role   = google_project_iam_custom_role.plan_bucket_iam_reader.name' <(printf '%s\n' "$block")
  contains_fixed 'member = "serviceAccount:${google_service_account.plan.email}"' <(printf '%s\n' "$block")
}

assert_plan_bucket_iam_binding plan_site_bucket_iam_reader google_storage_bucket.site.name
assert_plan_bucket_iam_binding plan_site_dev_bucket_iam_reader google_storage_bucket.site_dev.name
assert_plan_bucket_iam_binding plan_state_bucket_iam_reader var.terraform_state_bucket

if [ "$(awk '/role[[:space:]]*= google_project_iam_custom_role\.plan_bucket_iam_reader\.name/ { count++ } END { print count + 0 }' "$root/infra/terraform/main.tf")" -ne 3 ]; then
  echo "The planner bucket-IAM role must be bound to exactly the site, dev-site, and state buckets." >&2
  exit 1
fi

# Inventory every Terraform resource block across every .tf file that grants
# authority to the planner. Header allowlisting prevents an additive role,
# resource type, bucket, or second custom-role binding from bypassing the
# named-block assertions above.
planner_iam_inventory="$(awk '
  function brace_delta(line, copy, opens, closes) {
    copy = line
    opens = gsub(/{/, "{", copy)
    copy = line
    closes = gsub(/}/, "}", copy)
    return opens - closes
  }
  function finish_block() {
    if (block ~ /google_service_account\.plan\.email/) {
      print header
    }
    capture = 0
    depth = 0
    header = ""
    block = ""
  }
  /^resource "/ {
    if (capture) finish_block()
    capture = 1
    header = $0
    block = $0 ORS
    depth = brace_delta($0)
    if (depth == 0) finish_block()
    next
  }
  capture {
    block = block $0 ORS
    depth += brace_delta($0)
    if (depth == 0) finish_block()
  }
  END {
    if (capture) finish_block()
  }
' "$root/infra/terraform"/*.tf | LC_ALL=C sort)"
expected_planner_iam_inventory='resource "google_project_iam_member" "plan_secret_viewer" {
resource "google_project_iam_member" "plan_viewer" {
resource "google_storage_bucket_iam_member" "plan_site_bucket_iam_reader" {
resource "google_storage_bucket_iam_member" "plan_site_dev_bucket_iam_reader" {
resource "google_storage_bucket_iam_member" "plan_state_bucket_iam_reader" {
resource "google_storage_bucket_iam_member" "plan_state_reader" {'
if [ "$planner_iam_inventory" != "$expected_planner_iam_inventory" ]; then
  echo "Planner IAM inventory differs from the exact six-grant allowlist." >&2
  printf 'Observed planner IAM resources:\n%s\n' "$planner_iam_inventory" >&2
  exit 1
fi

for identity_event in \
  'plan:pull_request' \
  'publisher:push' \
  'dev:push' \
  'prod:workflow_dispatch' \
  'apply:push'; do
  identity="${identity_event%%:*}"
  event="${identity_event#*:}"
  contains_regex "attribute_condition.*local\\.wif_subjects\\.${identity}.*assertion\\.repository ==.*assertion\\.event_name == '${event}'" "$root/infra/terraform/main.tf"
done
for identity in publisher dev prod apply; do
  contains_regex "attribute_condition.*local\\.wif_subjects\\.${identity}.*assertion\\.ref == 'refs/heads/" "$root/infra/terraform/main.tf"
done

for required in \
  'create-only targeted saved plan' \
  'roles/storage.objectViewer' \
  'storage.buckets.getIamPolicy' \
  'three managed buckets' \
  'exact backend bucket only' \
  'Terraform state can contain secrets' \
  'sanitized evidence' \
  'automatic apply'; do
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

contains_fixed 'name: Terraform Gate' "$workflows/terraform-pr.yml"
contains_regex '^  pull_request:$' "$workflows/terraform-pr.yml"
if report_regex '^[[:space:]]+paths:' "$workflows/terraform-pr.yml"; then
  echo "The stable Terraform PR gate must run for every pull request to main." >&2
  exit 1
fi
contains_fixed 'same_repository: ${{ steps.diff.outputs.same_repository }}' "$workflows/terraform-pr.yml"
contains_fixed "HEAD_REPOSITORY: \${{ github.event.pull_request.head.repo.full_name }}" "$workflows/terraform-pr.yml"
contains_fixed "if: needs.changes.outputs.terraform == 'true' && needs.changes.outputs.same_repository == 'true'" "$workflows/terraform-pr.yml"
contains_fixed "test \"\$SAME_REPOSITORY\" = \"true\"" "$workflows/terraform-pr.yml"

validate_block="$(awk '
  /^  validate:/ { capture = 1 }
  /^  plan:/ { capture = 0 }
  capture { print }
' "$workflows/terraform-pr.yml")"
if report_regex 'id-token|google-github-actions/auth|secrets\.' <(printf '%s\n' "$validate_block"); then
  echo "The always-running Terraform PR validation job must remain credential-free." >&2
  exit 1
fi
contains_fixed '-lock=false' "$workflows/terraform-pr.yml"
contains_fixed '-var="manage_deployment_service_iam=true"' "$workflows/terraform-pr.yml"
contains_fixed '-var="manage_deployment_service_iam=true"' "$workflows/terraform-apply.yml"
contains_fixed 'terraform -chdir=infra/terraform show -json tfplan.out > infra/terraform/tfplan.json' "$workflows/terraform-pr.yml"
contains_fixed 'infra/terraform/sanitize-plan-evidence.sh' "$workflows/terraform-pr.yml"
if report_regex '\.resource_changes|\.change\.actions|sort_by\(\.address\)' "$workflows/terraform-pr.yml"; then
  echo "The PR workflow must use the behavior-tested sanitizer instead of an inline transformation." >&2
  exit 1
fi
for executable in \
  "$root/infra/terraform/check-policy.sh" \
  "$root/infra/terraform/test-check-policy.sh" \
  "$root/infra/terraform/sanitize-plan-evidence.sh" \
  "$root/infra/terraform/test-sanitize-plan-evidence.sh"; do
  if [ ! -x "$executable" ]; then
    echo "Terraform policy and sanitizer scripts must be executable: $executable" >&2
    exit 1
  fi
done
contains_fixed 'Resource address | Actions' "$workflows/terraform-pr.yml"
contains_fixed 'Source SHA:' "$workflows/terraform-pr.yml"
contains_fixed 'Backend prefix:' "$workflows/terraform-pr.yml"
contains_fixed 'Change counts:' "$workflows/terraform-pr.yml"
contains_fixed 'Delete all plan material' "$workflows/terraform-pr.yml" "$workflows/terraform-apply.yml"

if report_regex 'actions/(upload|download)-artifact|\.before|\.after|\.planned_values|\.prior_state' "$workflows/terraform-pr.yml"; then
  echo "PR planning cannot publish binary plans, raw values, or state-shaped JSON." >&2
  exit 1
fi

contains_regex '^  push:$' "$workflows/terraform-apply.yml"
if report_regex 'workflow_dispatch|inputs\.|APPLY_TERRAFORM|confirmation' "$workflows/terraform-apply.yml"; then
  echo "A reviewed main merge must be the only Terraform apply gate." >&2
  exit 1
fi
contains_fixed 'group: terraform-backend-gcp-infra' "$workflows/terraform-apply.yml"
contains_fixed 'cancel-in-progress: false' "$workflows/terraform-apply.yml"
contains_fixed 'SOURCE_SHA: ${{ github.sha }}' "$workflows/terraform-apply.yml"
contains_fixed 'refs/remotes/origin/main' "$workflows/terraform-apply.yml"
contains_fixed 'Create fresh locked plan for this main SHA' "$workflows/terraform-apply.yml"
contains_fixed 'Apply the same fresh saved plan' "$workflows/terraform-apply.yml"
if report_regex 'actions/(upload|download)-artifact|workflow_run' "$workflows/terraform-apply.yml"; then
  echo "Automatic apply must create and consume its own local saved plan." >&2
  exit 1
fi

contains_regex '^  workflow_dispatch:$' "$workflows/deploy-production.yml"
if report_regex '^[[:space:]]+(push|pull_request|schedule):' "$workflows/deploy-production.yml"; then
  echo "Production application deployment must remain manual-only." >&2
  exit 1
fi

echo "Terraform trust-boundary policy passed."
