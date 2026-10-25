#!/usr/bin/env bash
# PreToolUse guard for the `sdd-engineering:implementation-planner` agent
# (registered in hooks/hooks.json, matcher: Write|Edit|MultiEdit).
# Plugin hooks fire in every session, so the script first checks `agent_type`
# from the hook input and lets every other agent (and the main session) pass.
#
# Allows writes only to a plan file: <plans_dir>/<name>.md (top level, not
# _template.md, not reports/**). plans_dir defaults to `specs/plans`; override
# with CLAUDE_PLUGIN_OPTION_PLANS_DIR. Specs, docs and code are always
# blocked — the planner reviews requirements, it never authors them.
# Input: hook JSON on stdin; reads agent_type and tool_input.file_path.
# Exit 0 = allow; exit 2 = block (reason on stderr is shown to the agent).
# bash 3.2 compatible (macOS). Uses jq, then python3, then sed.

AGENT="sdd-engineering:implementation-planner"
input=$(cat)

json_get() { # $1 = key path, e.g. .tool_input.file_path
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null
  elif command -v python3 >/dev/null 2>&1; then
    printf '%s' "$input" | python3 -c '
import json, sys
d = json.load(sys.stdin)
for k in sys.argv[1].lstrip(".").split("."):
    d = d.get(k) if isinstance(d, dict) else None
print("" if d is None else d)' "$1" 2>/dev/null
  else
    key="${1##*.}"
    printf '%s' "$input" | tr -d '\n' \
      | sed -n "s/.*\"$key\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p"
  fi
}

agent_type=$(json_get '.agent_type')
[ "$agent_type" = "$AGENT" ] || exit 0

file_path=$(json_get '.tool_input.file_path')

lower() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]'; }
trim_slashes() { local p="$1"; while [ "${p#./}" != "$p" ]; do p="${p#./}"; done; printf '%s' "${p%/}"; }

plans_dir=$(trim_slashes "${CLAUDE_PLUGIN_OPTION_PLANS_DIR:-specs/plans}")
lplans=$(lower "$plans_dir")

block() {
  echo "implementation-planner-guard: blocked write to '$file_path' — $1. implementation-planner may only write $plans_dir/<feature>.md; spec changes go into the plan's 'Spec updates needed' list for the spec owner." >&2
  exit 2
}

[ -n "$file_path" ] || block "could not read tool_input.file_path"

# Strip a project-root prefix (CLAUDE_PROJECT_DIR, then cwd). macOS paths are
# case-insensitive, so compare prefixes case-insensitively.
rel="$file_path"
for root in "${CLAUDE_PROJECT_DIR:-}" "$PWD"; do
  [ -n "$root" ] || continue
  root="${root%/}/"
  n=${#root}
  head_part="${rel:0:$n}"
  if [ "$(lower "$head_part")" = "$(lower "$root")" ]; then
    rel="${rel:$n}"
    break
  fi
done
while [ "${rel#./}" != "$rel" ]; do rel="${rel#./}"; done
case "$rel" in
  .claude/worktrees/*/*) rel="${rel#.claude/worktrees/}"; rel="${rel#*/}" ;;
esac

case "$rel" in
  /*) block "path is outside the project" ;;
  ../*|*/../*|*/..|..) block "path traversal ('..') is not allowed" ;;
esac

lrel=$(lower "$rel")

case "$lrel" in
  "$lplans"/_template.md) block "the plan template is maintained by humans" ;;
  "$lplans"/*/*)          block "subdirectories of $plans_dir/ (reports) belong to implementers/orchestrator" ;;
  "$lplans"/*.md)         exit 0 ;;
  specs/*|*/specs/*)      block "specs are not written or edited by the planner" ;;
  *)                      block "only plan files are writable" ;;
esac
