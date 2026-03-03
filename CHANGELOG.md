# Changelog

## [0.1.4] - 2026-03-03

### Bug Fixes

- **Version unification** — CLI and MCP server now read version from `package.json` at build time via tsup `define`, eliminating hardcoded version drift
- **readFile TOCTOU guard** — `readCanonicalText` now wraps `fs.readFile` in try/catch, returning `file_missing` if the file disappears between `lstat` and `readFile`
- **readVerifyText consistency** — `readVerifyText` now delegates to `readCanonicalText`, gaining strict UTF-8, symlink protection, and binary detection; removed `as string` type assertions

### Tests

- Add `tests/core-pathing.test.ts` — 12 tests for `normalizePathForClaim` and `resolveUnderRoot`
- Add `tests/core-file.test.ts` — 17 tests for `normalizeEol`, `hashLineSpan`, and `readCanonicalText`
- Add `tests/cite-citation.test.ts` — 10 tests for `renderCitation` and `parseCitations`
- Add `tests/cite-claim.test.ts` — 21 tests for `renderStructureClaim`, `parseStructureClaims`, `generateStructureClaim`, `verifyStructureKind`
- Add `tests/verify-workspace.test.ts` — 4 tests for `readVerifyText`
- Total test count: 5 → 69

### Refactoring

- **normalizePathForClaim** — removed no-op if/else branch (both returned same value)
- **Dead code removal** — removed unused `DEFAULT_EXCLUDES` and `isExcludedPath` from `pathing.ts`
- **verifyCitation extraction** — extracted 25-line citation verification loop from `workspace.ts` into `verifyCitation()` in `citation.ts`; workspace citation loop reduced to 5 lines

---

## [Released]

## [0.1.3] - 2026-03-01

### Skill (`vericontext-enforcer`)

- Add PreToolUse hook on `Task` tool — detects doc-related subagent tasks and outputs citation rules for the master agent to include in subagent prompts

### Docs

- Rewrite README.md, README-ko.md, AGENTS.md

## [0.1.2] - 2026-02-23

### Skill (`vericontext-enforcer`)

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
