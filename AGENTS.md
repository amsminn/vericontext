# VeriContext — Agent Knowledge Base

Deterministic, hash-based verification for docs that reference code. CLI + MCP server in TypeScript.

## Architecture

```
vericontext/
├── src/
│   ├── cli.ts              # CLI entry — cite, claim, verify workspace, mcp
│   ├── types.ts            # Shared types: ErrorReason, result shapes
│   ├── core/
│   │   ├── file.ts         # Canonical file reading, UTF-8 decode, SHA-256 hashing
│   │   └── pathing.ts      # Root jail: resolveUnderRoot, path normalization
│   ├── cite/
│   │   ├── citation.ts     # Citation generation, parsing, regex
│   │   └── claim.ts        # Structure claims: exists-dir, missing, verification
│   ├── verify/
│   │   └── workspace.ts    # Document verification: parse tokens → recompute → compare
│   └── mcp/
│       └── server.ts       # MCP stdio server: vctx_cite, vctx_claim, vctx_verify_workspace
├── tests/                  # Unit + e2e tests (real dist CLI execution)
├── scripts/
│   ├── mcp-smoke.ts        # MCP protocol smoke test
│   └── verify-docs.sh      # Batch verification for all .md files
└── skills/                 # Distributable agent skill (vericontext-enforcer)
```
<!-- [[vctx-exists-dir:src/]] -->
<!-- [[vctx-exists-dir:src/core/]] -->
<!-- [[vctx-exists-dir:src/cite/]] -->
<!-- [[vctx-exists-dir:src/verify/]] -->
<!-- [[vctx-exists-dir:src/mcp/]] -->
<!-- [[vctx-exists-dir:tests/]] -->
<!-- [[vctx-exists-dir:scripts/]] -->

## Module Map

| Module | File | Purpose |
|--------|------|---------|
| CLI entry | `src/cli.ts` | Commander-based CLI: `cite`, `claim`, `verify workspace`, `mcp` | <!-- [[vctx:src/cli.ts#L1-L111@d491e15a]] -->
| Type contracts | `src/types.ts` | `ErrorReason` enum, `VerifyWorkspaceResult`, `CiteSuccess`, `ClaimSuccess` | <!-- [[vctx:src/types.ts#L1-L53@ed5222ec]] -->
| File I/O + hash | `src/core/file.ts` | `readCanonicalText` (UTF-8, LF-normalized), `hashSha256Hex`, `hashLineSpan` | <!-- [[vctx:src/core/file.ts#L1-L83@45893a37]] -->
| Path jail | `src/core/pathing.ts` | `resolveUnderRoot` — rejects absolute paths, `../` traversal, normalizes separators | <!-- [[vctx:src/core/pathing.ts#L1-L54@74c23163]] -->
| Citation | `src/cite/citation.ts` | `generateCitation`, `parseCitations`, `CITATION_REGEX` | <!-- [[vctx:src/cite/citation.ts#L1-L64@2bd83842]] -->
| Structure claims | `src/cite/claim.ts` | `generateStructureClaim`, `parseStructureClaims`, `verifyStructureKind` | <!-- [[vctx:src/cite/claim.ts#L1-L86@767ec677]] -->
| Workspace verify | `src/verify/workspace.ts` | `verifyWorkspace` — parse all tokens, recompute hashes, aggregate results | <!-- [[vctx:src/verify/workspace.ts#L1-L109@14af277c]] -->
| MCP server | `src/mcp/server.ts` | `runMcpServer` — stdio transport, 3 tools registered | <!-- [[vctx:src/mcp/server.ts#L1-L72@c68412d1]] -->
| MCP smoke test | `scripts/mcp-smoke.ts` | Validates MCP stdio protocol hygiene | <!-- [[vctx:scripts/mcp-smoke.ts#L1-L46@ca099fc6]] -->
| Batch verify | `scripts/verify-docs.sh` | Finds all .md files with vctx tokens and verifies them | <!-- [[vctx:scripts/verify-docs.sh#L1-L53@ac1ecc5e]] -->

## Data Flow

```
                   ┌─────────────┐
  cite(path,L,L) → │ pathing.ts  │ → resolveUnderRoot
                   └──────┬──────┘
                          ↓
                   ┌─────────────┐
                   │  file.ts    │ → readCanonicalText → hashLineSpan
                   └──────┬──────┘
                          ↓
                   ┌──────────────┐
                   │ citation.ts  │ → renderCitation → [[vctx:path#L1-L10@hash8]]
                   └──────────────┘

  verify(doc) → parseCitations(doc) + parseStructureClaims(doc)
              → for each token: resolve → read → hash → compare
              → aggregate { ok, total, ok_count, fail_count, results }
```

## Conventions

- **Node >=20**, ESM (`"type": "module"`), TypeScript strict mode
- **JSON-first output** — all results are machine-readable with stable `reason` values
- **Fail-closed** — one broken claim makes `ok: false`; no fuzzy recovery
- **Root-scoped paths only** — absolute paths rejected; `../` traversal blocked
- **CLI and MCP share the same core** — adapters (`cli.ts`, `server.ts`) are thin wrappers
- **Deterministic hashing** — UTF-8 only, LF-normalized, symlinks and binaries skipped
- **No stdout pollution in MCP mode** — only JSON-RPC on stdout; logs go to stderr
<!-- [[vctx:package.json#L1-L55@d1931b22]] -->
<!-- [[vctx:tsconfig.json#L1-L15@2ad7d213]] -->

## Document Verification Rules

When writing or editing `.md` files in this project:

1. **Mention a file → hash it.** Use `vericontext cite --root . --path <file> --start-line 1 --end-line <last> --json`. Never use `exists-file` claims for files.
2. **Reference code lines → cite the range.** Use `vericontext cite` with specific `--start-line` / `--end-line`.
3. **Mention a directory → claim it.** Use `vericontext claim --root . --kind exists-dir --path <dir>/ --json`.
4. **Verify on task completion.** Run `vericontext verify workspace --root . --in-path <doc.md> --json` — must return `ok: true` before committing.
5. **Code change → update citations.** When code changes, regenerate citations in docs that reference it.
6. **Never hand-write tokens.** Always generate with the tool; never guess or copy hash values.

## Anti-Patterns

- Do not add fuzzy relocation or auto-fix behavior in the verifier
- Do not bypass root jail with path normalization shortcuts
- Do not print non-protocol logs to stdout in MCP mode
- Do not add prompt/LLM summarization behaviors to core primitives
- Do not introduce nondeterministic hashing inputs (encoding or EOL drift)
- Do not use `exists-file` claims — hash the file with `vctx_cite` instead

## Commands

```bash
npm install           # install dependencies
npm run build         # compile to dist/ (tsup)
npm run typecheck     # tsc --noEmit
npm test              # vitest run
npm run verify        # batch verify all docs
npm run mcp:smoke     # MCP protocol smoke test
```
<!-- [[vctx-exists-dir:dist/]] -->
<!-- [[vctx:vitest.config.ts#L1-L8@d56db7e2]] -->
<!-- [[vctx:tsup.config.ts#L1-L12@b0ef8813]] -->
