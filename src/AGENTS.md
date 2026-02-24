# SRC KNOWLEDGE BASE

## OVERVIEW
`src/` contains all production behavior: CLI adapter, deterministic claim logic, verifier, and MCP adapter.

## STRUCTURE
```text
src/
├── cli.ts              # command wiring + exit codes
├── types.ts            # shared type contracts
├── core/               # root jail, canonical text, hashing
├── cite/               # citation/structure parsing + generation
├── verify/             # workspace verification orchestration
└── mcp/                # MCP stdio tool adapter
```
<!-- [[vctx-exists-dir:src/core/]] -->
<!-- [[vctx-exists-dir:src/cite/]] -->
<!-- [[vctx-exists-dir:src/verify/]] -->
<!-- [[vctx-exists-dir:src/mcp/]] -->
<!-- [[vctx-exists-file:src/cli.ts]] -->
<!-- [[vctx-exists-file:src/types.ts]] -->

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add CLI option/command | `src/cli.ts` | keep handlers thin; call core functions |
| Add error reason/type | `src/types.ts` | update unions and result interfaces first |
| Change path safety | `src/core/pathing.ts` | preserve escape rejection invariant | <!-- [[vctx:src/core/pathing.ts#L26-L49@0121c3fd]] --> |
| Change canonicalization/hash | `src/core/file.ts` | keep deterministic UTF-8 + LF behavior | <!-- [[vctx:src/core/file.ts#L23-L55@0d766eb6]] --> |
| Change citation grammar | `src/cite/citation.ts` | parser + renderer must stay aligned | <!-- [[vctx:src/cite/citation.ts#L37-L64@012d6e59]] --> |
| Change structure claims | `src/cite/claim.ts` | generation and verification both updated | <!-- [[vctx:src/cite/claim.ts#L54-L86@6f2e199a]] --> |
| Change verification policy | `src/verify/workspace.ts` | fail-closed and summary counts required | <!-- [[vctx:src/verify/workspace.ts#L46-L109@39dad95f]] --> |
| Change MCP contract | `src/mcp/server.ts` | output must stay JSON text payload | <!-- [[vctx:src/mcp/server.ts#L21-L68@e7a273fd]] --> |

## CONVENTIONS
- Reuse `resolveUnderRoot` for every path-facing operation.
- Prefer returning `{ ok:false, reason }` over thrown errors in domain logic.
- Keep hash comparison at `hash8` display while preserving `sha256_full` generation.
- Preserve one-source-of-truth logic shared by both CLI and MCP.

## ANTI-PATTERNS
- Do not duplicate business logic between `cli.ts` and `mcp/server.ts`.
- Do not read files directly in cite/verify without `core/file.ts` safeguards.
- Do not widen accepted path formats beyond current spec (absolute paths remain invalid).
- Do not silently ignore claim parse/verify failures.
