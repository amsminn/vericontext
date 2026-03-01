# Changelog

## [Unreleased]

- Rewrite README.md and AGENTS.md

## [0.1.2] - 2026-02-23

### Skill (`vericontext-enforcer`)

- Add PreToolUse hook on `Task` tool for subagent citation propagation
- Add pre-commit / pre-push git hooks for automated doc verification
- Add `scripts/verify-modified-docs.sh` for batch verification
- Add evals: `citation-enforcement.json`, `verification-workflow.json`
- Add references: `citation-format-guide.md`, `cross-agent-setup.md`, `verification-playbook.md`

### CLI / Core

- Add `scripts/verify-docs.sh` for batch `.md` file verification
- Add `npm run verify` script and `.githooks/pre-commit` hook
- Add CI workflow step for doc verification

## [0.1.0] - 2026-02-23

### CLI / Core

- `cite` — generate SHA-256 content hash citations for file line ranges
- `claim` — generate structure claims (`exists-dir`, `missing`)
- `verify workspace` — fail-closed verification of all claims in a document
- `mcp` — MCP stdio server exposing `vctx_cite`, `vctx_claim`, `vctx_verify_workspace`
- Root jail path resolution (rejects `../` traversal and absolute paths)
- Deterministic hashing: UTF-8 only, LF-normalized, symlinks and binaries skipped

### Skill (`vericontext-enforcer`)

- Initial skill with 3-layer enforcement (write-time guidance, task-completion verify, git hook gate)
- Cross-agent support: Claude Code, Codex, Antigravity, Cursor, Windsurf, OpenCode
