#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sanitizer="$root/sanitize-plan-evidence.sh"
test_dir="$(mktemp -d)"
trap 'rm -rf "$test_dir"' EXIT

cat >"$test_dir/plan.json" <<'JSON'
{
  "format_version": "SENTINEL_TOP_LEVEL",
  "provider_config": {"secret": "SENTINEL_PROVIDER"},
  "output_changes": {"token": {"after": "SENTINEL_OUTPUT"}},
  "diagnostics": ["SENTINEL_DIAGNOSTIC"],
  "resource_changes": [
    {
      "address": "module.site.google_storage_bucket.example[\"dev\"]",
      "private": "SENTINEL_PRIVATE",
      "change": {
        "actions": ["update"],
        "before": {"password": "SENTINEL_BEFORE"},
        "after": {"password": "SENTINEL_AFTER"},
        "before_sensitive": {"password": true},
        "after_sensitive": {"password": true},
        "unrelated": "SENTINEL_NESTED"
      }
    },
    {
      "address": "google_service_account.example",
      "change": {
        "actions": ["delete", "create"],
        "before": "SENTINEL_REPLACED_BEFORE",
        "after": "SENTINEL_REPLACED_AFTER"
      }
    }
  ],
  "arbitrary": "SENTINEL_ARBITRARY"
}
JSON

cat >"$test_dir/expected.txt" <<'TEXT'
add=1 change=1 destroy=1
google_service_account.example	delete+create
module.site.google_storage_bucket.example["dev"]	update
TEXT

"$sanitizer" "$test_dir/plan.json" "$test_dir/evidence.txt"
diff -u "$test_dir/expected.txt" "$test_dir/evidence.txt"

if grep -Eq 'SENTINEL_|before|after|sensitive|output_changes|diagnostics|provider_config|arbitrary|private' \
  "$test_dir/evidence.txt"; then
  echo "Sanitized evidence leaked a forbidden field or value." >&2
  exit 1
fi

cat >"$test_dir/invalid.json" <<'JSON'
{"resource_changes":[{"address":"safe.resource","change":{"actions":["execute"]}}]}
JSON
printf 'MUST_NOT_SURVIVE\n' >"$test_dir/invalid-output.txt"
if "$sanitizer" "$test_dir/invalid.json" "$test_dir/invalid-output.txt" >/dev/null 2>&1; then
  echo "Unknown Terraform actions must fail closed." >&2
  exit 1
fi
if [ -e "$test_dir/invalid-output.txt" ] && ! grep -Fxq 'MUST_NOT_SURVIVE' "$test_dir/invalid-output.txt"; then
  echo "A failed sanitization modified its output." >&2
  exit 1
fi

if "$sanitizer" "$test_dir/plan.json" "$test_dir/plan.json" >/dev/null 2>&1; then
  echo "Aliased input/output paths must fail closed." >&2
  exit 1
fi

echo "Terraform plan evidence sanitizer tests passed."
