#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
policy="$root/infra/terraform/check-policy.sh"
standard_path="/usr/bin:/bin"

# Exercise the preferred search implementation when ripgrep is installed.
"$policy"

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
echo "Terraform policy search portability tests passed."
