#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
policy="$root/infra/terraform/check-policy.sh"
workflow_policy="$root/site/scripts/validate-workflow-policy.mjs"
standard_path="/usr/bin:/bin"

# Exercise the preferred search implementation when ripgrep is installed.
"$policy"
node "$workflow_policy"
"$root/infra/terraform/test-sanitize-plan-evidence.sh"

# GitHub's Ubuntu runner does not guarantee ripgrep, so exercise the grep fallback too.
PATH="$standard_path" "$policy"

# A failed directory traversal must never be interpreted as an ordinary no-match.
test_dir="$(mktemp -d)"
trap 'rm -rf "$test_dir"' EXIT
printf '#!/bin/sh\nexit 73\n' >"$test_dir/find"
chmod +x "$test_dir/find"

set +e
PATH="$test_dir:$standard_path" "$policy" >"$test_dir/stdout" 2>"$test_dir/stderr"
status=$?
set -e

if [ "$status" -ne 73 ]; then
  echo "Expected a find traversal failure to exit 73; received $status." >&2
  cat "$test_dir/stdout" >&2
  cat "$test_dir/stderr" >&2
  exit 1
fi

grep -Fq 'Policy search failed while checking for forbidden text.' "$test_dir/stderr"

expect_policy_failure() {
  local label="$1"
  local mutation="$2"
  local fixture="$test_dir/$label"

  mkdir -p "$fixture/infra" "$fixture/.github"
  cp -R "$root/infra/terraform" "$fixture/infra/terraform"
  cp -R "$root/.github/workflows" "$fixture/.github/workflows"
  sh -c "$mutation" sh "$fixture"

  set +e
  "$fixture/infra/terraform/check-policy.sh" >"$fixture/stdout" 2>"$fixture/stderr"
  local status=$?
  set -e
  if [ "$status" -eq 0 ]; then
    echo "Expected policy-negative fixture '$label' to fail closed." >&2
    exit 1
  fi
}

expect_workflow_policy_failure() {
  local label="$1"
  local mutation="$2"
  local fixture="$test_dir/$label"

  mkdir -p "$fixture/.github"
  cp -R "$root/.github/workflows" "$fixture/.github/workflows"
  sh -c "$mutation" sh "$fixture"

  set +e
  node "$workflow_policy" "$fixture/.github/workflows" >"$fixture/stdout" 2>"$fixture/stderr"
  local status=$?
  set -e
  if [ "$status" -eq 0 ]; then
    echo "Expected workflow-policy fixture '$label' to fail closed." >&2
    exit 1
  fi
}

expect_workflow_policy_failure stale-setup-terraform-pin \
  "sed -i.bak 's/dfe3c3f87815947d99a8997f908cb6525fc44e9e/b9cd54a3c349d3f38e8881555d616ced269862dd/g' \"\$1/.github/workflows/terraform-pr.yml\""
expect_workflow_policy_failure floating-setup-terraform-tag \
  "sed -i.bak 's/dfe3c3f87815947d99a8997f908cb6525fc44e9e/v4/g' \"\$1/.github/workflows/terraform-pr.yml\""

expect_policy_failure state-write-role \
  "sed -i.bak 's/role   = \"roles\/storage.objectViewer\"/role   = \"roles\/storage.objectAdmin\"/' \"\$1/infra/terraform/main.tf\""
expect_policy_failure bucket-iam-write-permission \
  "sed -i.bak 's/storage.buckets.getIamPolicy/storage.buckets.setIamPolicy/' \"\$1/infra/terraform/main.tf\""
expect_policy_failure additive-object-admin-binding \
  "printf '\nresource \"google_storage_bucket_iam_member\" \"rogue_plan_object_admin\" {\n  bucket = google_storage_bucket.site.name\n  role = \"roles/storage.objectAdmin\"\n  member = \"serviceAccount:\${google_service_account.plan.email}\"\n}\n' >> \"\$1/infra/terraform/cloud-run.tf\""
expect_policy_failure additive-custom-iam-writer \
  "printf '\nresource \"google_project_iam_custom_role\" \"rogue_plan_iam_writer\" {\n  project = var.project_id\n  role_id = \"roguePlanIamWriter\"\n  title = \"Rogue planner IAM writer\"\n  permissions = [\"storage.buckets.setIamPolicy\"]\n}\nresource \"google_storage_bucket_iam_member\" \"rogue_plan_iam_writer\" {\n  bucket = google_storage_bucket.site.name\n  role = google_project_iam_custom_role.rogue_plan_iam_writer.name\n  member = \"serviceAccount:\${google_service_account.plan.email}\"\n}\n' >> \"\$1/infra/terraform/services.tf\""
expect_policy_failure missing-apply-role-admin \
  "sed -i.bak '/\"roles\/iam.roleAdmin\",/d' \"\$1/infra/terraform/main.tf\""
expect_policy_failure shared-apply-role-admin \
  "printf '\nresource \"google_project_iam_member\" \"rogue_dev_role_admin\" {\n  project = var.project_id\n  role = \"roles/iam.roleAdmin\"\n  member = \"serviceAccount:\${google_service_account.dev.email}\"\n}\n' >> \"\$1/infra/terraform/services.tf\""
expect_policy_failure relocated-apply-role-admin \
  "sed -i.bak '/\"roles\/iam.roleAdmin\",/d' \"\$1/infra/terraform/main.tf\"; printf '\nresource \"google_project_iam_member\" \"rogue_only_dev_role_admin\" {\n  project = var.project_id\n  role = \"roles/iam.roleAdmin\"\n  member = \"serviceAccount:\${google_service_account.dev.email}\"\n}\n' >> \"\$1/infra/terraform/services.tf\""
expect_policy_failure project-storage-role \
  "printf '\nresource \"google_project_iam_member\" \"bad_plan_storage\" {\n  project = var.project_id\n  role = \"roles/storage.objectViewer\"\n  member = \"serviceAccount:\${google_service_account.plan.email}\"\n}\n' >> \"\$1/infra/terraform/main.tf\""
expect_policy_failure repository-wide-pr-plan \
  "sed -i.bak 's/ && needs.changes.outputs.same_repository == '\"'\"'true'\"'\"'//' \"\$1/.github/workflows/terraform-pr.yml\""
expect_policy_failure plan-artifact-upload \
  "printf '\n# actions/upload-artifact@forbidden\n' >> \"\$1/.github/workflows/terraform-pr.yml\""
expect_policy_failure manual-apply-gate \
  "sed -i.bak 's/^  push:/  workflow_dispatch:/' \"\$1/.github/workflows/terraform-apply.yml\""
expect_policy_failure cancelling-apply \
  "sed -i.bak 's/cancel-in-progress: false/cancel-in-progress: true/' \"\$1/.github/workflows/terraform-apply.yml\""
expect_policy_failure implicit-service-iam \
  "sed -i.bak 's/manage_deployment_service_iam=true/manage_deployment_service_iam=false/g' \"\$1/.github/workflows/terraform-pr.yml\""
expect_policy_failure terraform-job-name-shadowed-by-step \
  "sed -i.bak 's/^    name: Terraform Validate$/    name: UI Validate/' \"\$1/.github/workflows/terraform-pr.yml\""
expect_policy_failure deployer-bucket-metadata-writer \
  "sed -i.bak 's/roles\/storage.legacyBucketReader/roles\/storage.legacyBucketOwner/g' \"\$1/infra/terraform/cloud-run.tf\""
expect_policy_failure additive-deployer-storage-role \
  "printf '\nresource \"google_storage_bucket_iam_member\" \"rogue_dev_bucket_reader\" {\n  bucket = google_storage_bucket.site.name\n  role = \"roles/storage.objectViewer\"\n  member = \"serviceAccount:\${google_service_account.dev.email}\"\n}\n' >> \"\$1/infra/terraform/services.tf\""

echo "Terraform policy search portability tests passed."
