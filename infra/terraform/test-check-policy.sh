#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
policy="$root/infra/terraform/check-policy.sh"
standard_path="/usr/bin:/bin"

# Exercise the preferred search implementation when ripgrep is installed.
"$policy"
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

expect_policy_failure state-write-role \
  "sed -i.bak 's/role   = \"roles\/storage.objectViewer\"/role   = \"roles\/storage.objectAdmin\"/' \"\$1/infra/terraform/main.tf\""
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

echo "Terraform policy search portability tests passed."
