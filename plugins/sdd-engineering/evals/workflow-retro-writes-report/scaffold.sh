#!/usr/bin/env bash
# A tiny recorded multi-agent run: the orchestrator spawns implementer twice
# (the first hits the turn limit) and plan-verifier once.
set -euo pipefail
SID=11111111-2222-3333-4444-555555555555
P=fixtures/projects/-eval-repo
mkdir -p "$P/$SID/subagents"
cat > "$P/$SID.jsonl" <<'JSONL'
{"type":"user","timestamp":"2026-01-01T10:00:00.000Z","message":{"role":"user","content":"/sdd-engineering:run-plan plan: specs/plans/slugify.md"}}
{"type":"assistant","timestamp":"2026-01-01T10:00:10.000Z","message":{"id":"m1","usage":{"input_tokens":10,"cache_read_input_tokens":20000,"cache_creation_input_tokens":3000,"output_tokens":400},"content":[{"type":"tool_use","id":"tu1","name":"Agent","input":{"subagent_type":"sdd-engineering:implementer","description":"T1 slugify basics","prompt":"plan: specs/plans/slugify.md\ntask: T1"}}]}}
{"type":"user","timestamp":"2026-01-01T10:05:00.000Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"tu1","content":"<task-id>aaa111</task-id> <summary>Agent stopped: turn limit reached</summary>"}]}}
{"type":"assistant","timestamp":"2026-01-01T10:05:10.000Z","message":{"id":"m2","usage":{"input_tokens":10,"cache_read_input_tokens":24000,"cache_creation_input_tokens":2000,"output_tokens":300},"content":[{"type":"tool_use","id":"tu2","name":"Agent","input":{"subagent_type":"sdd-engineering:implementer","description":"T1 slugify basics retry","prompt":"plan: specs/plans/slugify.md\ntask: T1\nnote: previous attempt hit the turn limit"}}]}}
{"type":"assistant","timestamp":"2026-01-01T10:09:00.000Z","message":{"id":"m3","usage":{"input_tokens":10,"cache_read_input_tokens":26000,"cache_creation_input_tokens":1000,"output_tokens":200},"content":[{"type":"tool_use","id":"tu3","name":"Agent","input":{"subagent_type":"sdd-engineering:plan-verifier","description":"verify slugify","prompt":"plan: specs/plans/slugify.md"}}]}}
JSONL
sub() { # id type desc toolUseId start reads...
  local id=$1 type=$2 desc=$3 tu=$4 t=$5; shift 5
  printf '{"agentType":"%s","description":"%s","toolUseId":"%s","spawnDepth":1}\n' "$type" "$desc" "$tu" > "$P/$SID/subagents/agent-$id.meta.json"
  : > "$P/$SID/subagents/agent-$id.jsonl"
  local n=0
  for f in "$@"; do n=$((n+1))
    printf '{"type":"assistant","timestamp":"2026-01-01T%s:%02d.000Z","message":{"id":"%s-%d","usage":{"input_tokens":5,"cache_read_input_tokens":15000,"cache_creation_input_tokens":800,"output_tokens":150},"content":[{"type":"tool_use","id":"r%d","name":"Read","input":{"file_path":"%s"}}]}}\n' "$t" "$n" "$id" "$n" "$n" "$f" >> "$P/$SID/subagents/agent-$id.jsonl"
  done
}
sub aaa111 sdd-engineering:implementer "T1 slugify basics" tu1 10:01 specs/plans/slugify.md specs/plans/slugify.md specs/plans/slugify.md src/slugify.js
sub bbb222 sdd-engineering:implementer "T1 slugify basics retry" tu2 10:06 specs/plans/slugify.md src/slugify.js
sub ccc333 sdd-engineering:plan-verifier "verify slugify" tu3 10:09 specs/plans/slugify.md src/slugify.js test/slugify.test.js
