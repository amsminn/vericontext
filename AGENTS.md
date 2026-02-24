# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-23T00:00:00-08:00
**Commit:** N/A (not a git repo)
**Branch:** N/A (not a git repo)

## OVERVIEW
VeriContext is a TypeScript CLI + MCP server for deterministic, fail-closed verification of context claims.
Core behavior: generate citations/structure claims, then verify them against a workspace without fuzzy recovery.

## STRUCTURE
```text
vericontext/
├── src/                # production logic (core, cite, verify, mcp)
├── tests/              # unit + e2e (real dist CLI execution)
├── scripts/            # smoke/ops scripts (MCP stdio hygiene)
└── README.md           # quickstart + self-verifiable claims
```
<!-- [[vctx-exists-dir:src/]] -->
<!-- [[vctx-exists-dir:tests/]] -->
<!-- [[vctx-exists-dir:scripts/]] -->
<!-- [[vctx-exists-file:scripts/mcp-smoke.ts]] -->
<!-- [[vctx-missing:tmp-output/]] -->

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| CLI command behavior | `src/cli.ts` | `cite`, `claim`, `verify workspace`, `mcp` wiring | <!-- [[vctx:src/cli.ts#L36-L103@4db34b59]] --> |
| Path jail logic | `src/core/pathing.ts` | `resolveUnderRoot`; rejects escapes |
| Canonical file reading/hash | `src/core/file.ts` | UTF-8 only, binary/symlink checks, span SHA-256 |
| Citation grammar/parsing | `src/cite/citation.ts` | `[[vctx:path#Lx-Ly@hash8]]` |
| Structure claims | `src/cite/claim.ts` | exists/exists-file/exists-dir/missing |
| Workspace verification | `src/verify/workspace.ts` | aggregates per-claim result and summary counts | <!-- [[vctx:src/verify/workspace.ts#L46-L109@39dad95f]] --> |
| MCP tool surface | `src/mcp/server.ts` | `vctx_cite`, `vctx_claim`, `vctx_verify_workspace` | <!-- [[vctx:src/mcp/server.ts#L21-L68@e7a273fd]] --> |
| Type/result contracts | `src/types.ts` | canonical `ErrorReason` and result shapes | <!-- [[vctx:src/types.ts#L1-L53@ed5222ec]] --> |

## CODE MAP
LSP was unavailable in this environment; use file-level map above as the active codemap.

## CONVENTIONS
- Node >=20, ESM (`type: module`), TypeScript strict mode (`tsconfig.json`).
- Output contracts are machine-first JSON with stable `reason` values.
- Verification is fail-closed: one failed claim makes overall `ok=false`.
- Path handling is root-scoped only; absolute paths are invalid for claims/citations.
- README keeps examples escaped so tutorial tokens do not pollute self-verification.

## DOCUMENT VERIFICATION (vericontext-enforcer)

이 프로젝트의 문서를 작성·수정할 때 반드시 따라야 할 규칙:

1. **코드 참조 시 citation 필수**: 코드를 언급하면 `vericontext cite --root . --path <file> --start-line <N> --end-line <M> --json`으로 citation 토큰을 생성하고 문서에 삽입한다.
2. **구조 참조 시 claim 필수**: 파일/디렉토리 존재를 언급하면 `vericontext claim --root . --kind <kind> --path <path> --json`으로 claim을 생성한다.
3. **커밋 전 검증 필수**: `vericontext verify workspace --root . --in-path <doc.md> --json` 실행 → `ok: true`여야 커밋 가능.
4. **코드 수정 시 문서 갱신 필수**: 코드를 변경하면, 해당 코드를 참조하는 문서의 citation을 재생성한다.
5. **수동 토큰 작성 금지**: hash 값을 추측하거나 복사하지 않는다. 반드시 도구로 생성한다.

상세 가이드: `.agents/skills/vericontext-enforcer/SKILL.md`

## ANTI-PATTERNS (THIS PROJECT)
- Do not add fuzzy relocation or auto-fix behavior in verifier.
- Do not bypass root jail with path normalization shortcuts.
- Do not print non-protocol logs to stdout in MCP mode.
- Do not add prompt/LLM summarization behaviors to core primitives.
- Do not introduce nondeterministic hashing inputs (encoding or EOL drift).

## UNIQUE STYLES
- Claims are explicit, compact, and ASCII-only grammar-driven.
- Result schemas use small deterministic enums (`hash_mismatch`, `path_escape`, etc.).
- CLI and MCP share the same core functions; adapters stay thin.

## COMMANDS
```bash
npm install
npm run build
npm run typecheck
npm test
npm run mcp:smoke
npx . verify workspace --json --root . --in-path README.md
```

## NOTES
- `dist/` exists in the working directory; treat it as build output, not source of truth.
<!-- [[vctx-exists-dir:dist/]] -->
