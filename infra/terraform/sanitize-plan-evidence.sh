#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 INPUT_PLAN_JSON OUTPUT_EVIDENCE" >&2
  exit 64
fi

input="$1"
output="$2"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to sanitize Terraform plan evidence." >&2
  exit 69
fi
if [ ! -f "$input" ]; then
  echo "Input plan JSON must be a regular file." >&2
  exit 66
fi

output_dir="$(dirname "$output")"
if [ ! -d "$output_dir" ]; then
  echo "Output directory does not exist." >&2
  exit 73
fi

input_path="$(cd "$(dirname "$input")" && pwd -P)/$(basename "$input")"
output_path="$(cd "$output_dir" && pwd -P)/$(basename "$output")"
if [ "$input_path" = "$output_path" ] || { [ -e "$output" ] && [ "$input" -ef "$output" ]; }; then
  echo "Input and output paths must not alias." >&2
  exit 65
fi

temporary="$(mktemp "${output_path}.tmp.XXXXXX")"
trap 'rm -f "$temporary"' EXIT

jq -er '
  if type != "object" or (.resource_changes | type) != "array" then
    error("resource_changes must be an array")
  else
    [.resource_changes[] | {address, actions: .change.actions}]
  end
  | if any(.[]; (.address | type) != "string") then
      error("every resource address must be a string")
    elif (map(.address) | length) != (map(.address) | unique | length) then
      error("resource addresses must be unique")
    elif any(.[]; (.address | test("^[A-Za-z0-9_.\\[\\]\\\"/-]+$") | not)) then
      error("resource address contains forbidden characters")
    elif any(.[]; (.actions | type) != "array" or (.actions | length) == 0) then
      error("every action set must be a non-empty array")
    elif any(.[]; any(.actions[]; type != "string" or (IN("no-op", "create", "read", "update", "delete") | not))) then
      error("action is not allowlisted")
    else
      .
    end
  | "add=" + ([.[] | select(.actions | index("create"))] | length | tostring)
      + " change=" + ([.[] | select(.actions | index("update"))] | length | tostring)
      + " destroy=" + ([.[] | select(.actions | index("delete"))] | length | tostring),
    (sort_by(.address)[] | [.address, (.actions | join("+"))] | @tsv)
' "$input" >"$temporary"

mv -f "$temporary" "$output_path"
trap - EXIT
