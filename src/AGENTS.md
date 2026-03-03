# Agent Guidelines for src/

<!-- [[vctx-exists-dir:src/]] -->

This file provides guidance for AI agents working within the `src/` directory of vericontext.

## Project Overview

Vericontext is a deterministic documentation verification tool. It generates SHA-256-based citation tokens that tie documentation to exact source code line spans, and structure claim tokens that assert the existence (or absence) of files and directories. These tokens can later be verified against the actual workspace to detect drift.

## Architecture

```
src/
  cli.ts              Command-line entry point (thin adapter)
  types.ts            Shared type definitions used everywhere
  core/               Deterministic file and path primitives
    file.ts           Canonical text reading, EOL normalization, hashing
    pathing.ts        Root-jailed path resolution
  cite/               Citation and structure claim logic
    citation.ts       Line-span citation token rendering/parsing/generation/verification
    claim.ts          Structure claim token rendering/parsing/generation/verification
  verify/             Document-level verification pipeline
    workspace.ts      Extracts all VCC tokens from a doc and verifies each
  mcp/                Model Context Protocol stdio server
    server.ts         Exposes cite/claim/verify as MCP tools
```

<!-- [[vctx-exists-file:src/cli.ts]] -->
<!-- [[vctx-exists-file:src/types.ts]] -->
<!-- [[vctx-exists-dir:src/core/]] -->
<!-- [[vctx-exists-dir:src/cite/]] -->
<!-- [[vctx-exists-dir:src/verify/]] -->
<!-- [[vctx-exists-dir:src/mcp/]] -->

## Where to Make Changes

| Task | File(s) | Key Constraints |
|------|---------|-----------------|
| Add a CLI command or option | `src/cli.ts` | Keep the handler thin; delegate to a feature module. Use `withRootAndJson` for consistent `--root`/`--json` flags. | <!-- [[vctx:src/cli.ts#L30-L107@43ecadbb]] --> |
| Add or modify error reasons | `src/types.ts` | Add to the `ErrorReason` union. Update related result interfaces if needed. | <!-- [[vctx:src/types.ts#L1-L15@8c493a69]] --> |
| Add or modify result types | `src/types.ts` | Follow the `{ ok: true, ... } | { ok: false, reason }` discriminated union pattern. | <!-- [[vctx:src/types.ts#L36-L53@ef0400fb]] --> |
| Change path resolution or safety | `src/core/pathing.ts` | The `resolveUnderRoot` function is the security boundary. Never allow absolute paths or `..` escapes. | <!-- [[vctx:src/core/pathing.ts#L20-L44@1d752a72]] --> |
| Change file reading or hashing | `src/core/file.ts` | Must stay deterministic: strict UTF-8 decoding, `\r\n`/`\r` normalized to `\n`, SHA-256 on canonical text. | <!-- [[vctx:src/core/file.ts#L23-L59@0435973c]] --> |
| Change citation token format | `src/cite/citation.ts` | The `CITATION_REGEX`, `renderCitation`, and `parseCitations` must all stay in sync. | <!-- [[vctx:src/cite/citation.ts#L18-L35@1a54ae9a]] --> |
| Change citation generation | `src/cite/citation.ts` | `generateCitation` resolves path, reads file, hashes span, renders token. | <!-- [[vctx:src/cite/citation.ts#L37-L64@012d6e59]] --> |
| Change structure claim format | `src/cite/claim.ts` | The `STRUCTURE_REGEX`, `renderStructureClaim`, and `parseStructureClaims` must all stay in sync. | <!-- [[vctx:src/cite/claim.ts#L11-L29@6af214bc]] --> |
| Change structure claim generation | `src/cite/claim.ts` | `generateStructureClaim` resolves path and renders the token. Trailing slash is preserved for `exists-dir`. | <!-- [[vctx:src/cite/claim.ts#L31-L52@46a7abfb]] --> |
| Change structure verification | `src/cite/claim.ts` | `verifyStructureKind` checks the filesystem using `lstat`. Handles `exists`, `exists-file`, `exists-dir`, `missing`. | <!-- [[vctx:src/cite/claim.ts#L54-L86@6f2e199a]] --> |
| Change the verification pipeline | `src/verify/workspace.ts` | `verifyWorkspace` is fail-closed: `ok` is true only when all claims pass. Must produce summary counts. | <!-- [[vctx:src/verify/workspace.ts#L37-L82@bf6e3670]] --> |
| Change document reading for verify | `src/verify/workspace.ts` | `readVerifyText` accepts exactly one of `inPath` or `text`, never both, never neither. | <!-- [[vctx:src/verify/workspace.ts#L14-L35@af980e6f]] --> |
| Change MCP tool definitions | `src/mcp/server.ts` | Must register tools via `server.registerTool`. Input schemas use `zod`. Output is always JSON text via `textJson`. | <!-- [[vctx:src/mcp/server.ts#L17-L74@9d9bf659]] --> |

## Critical Invariants

These invariants must be preserved across all changes:

1. **Root jail** -- every path-bearing operation must call `resolveUnderRoot()` from `core/pathing.ts`. Absolute paths are rejected. Paths containing `..` that would escape the root are rejected.
   <!-- [[vctx:src/core/pathing.ts#L20-L44@1d752a72]] -->

2. **Deterministic hashing** -- files are read as strict UTF-8 (`fatal: true`), line endings are normalized to `\n`, and SHA-256 is computed on the canonical text. This ensures identical hashes on all platforms.
   <!-- [[vctx:src/core/file.ts#L17-L21@73baff6c]] -->

3. **Result-type error handling** -- domain functions return `{ ok: false, reason: ErrorReason }` rather than throwing exceptions. The `ErrorReason` type in `types.ts` is the single source of truth for all failure reasons.
   <!-- [[vctx:src/types.ts#L1-L15@8c493a69]] -->

4. **Hash8 display, full generation** -- citation tokens embed only the first 8 hex characters of the SHA-256 digest, but the full 64-character digest is always computed and available in the generation result.
   <!-- [[vctx:src/core/file.ts#L62-L88@bae49b2e]] -->

5. **Fail-closed verification** -- `verifyWorkspace` returns `ok: true` only when every single claim passes. A single failure makes the entire result `ok: false`.
   <!-- [[vctx:src/verify/workspace.ts#L37-L82@bf6e3670]] -->

6. **No business logic in adapters** -- `cli.ts` and `mcp/server.ts` are thin wiring layers. They parse input, delegate to feature modules, and format output. No hashing, file reading, or verification logic belongs in these files.
   <!-- [[vctx:src/cli.ts#L12-L28@71431e17]] -->
   <!-- [[vctx:src/mcp/server.ts#L11-L15@7642c05e]] -->

7. **Single source of truth** -- the CLI and MCP server call the same underlying functions (`generateCitation`, `generateStructureClaim`, `verifyWorkspace`). Logic must never be duplicated between the two adapter layers.
   <!-- [[vctx:src/mcp/server.ts#L1-L74@649772e7]] -->

## Token Formats

### Citation Token

Format: `[[vctx:path#Lstart-Lend@hash8]]`

- `path` -- forward-slash-separated, relative to root
- `Lstart` -- 1-based start line
- `Lend` -- 1-based end line (inclusive)
- `hash8` -- first 8 hex characters of the SHA-256 digest of the joined line span

Regex: `CITATION_REGEX` in `cite/citation.ts`
<!-- [[vctx:src/cite/citation.ts#L18-L35@1a54ae9a]] -->

### Structure Claim Token

Format: `[[vctx-kind:path]]`

- `kind` -- one of `exists`, `exists-file`, `exists-dir`, `missing`
- `path` -- forward-slash-separated, relative to root; may end with `/` for directory claims

Regex: `STRUCTURE_REGEX` in `cite/claim.ts`
<!-- [[vctx:src/cite/claim.ts#L11-L29@6af214bc]] -->

## Anti-Patterns to Avoid

- **Do not duplicate logic between `cli.ts` and `mcp/server.ts`.** Both must call the same functions from `cite/` and `verify/`.
- **Do not read files directly** in `cite/` or `verify/` without going through `core/file.ts` safeguards (symlink rejection, binary detection, strict UTF-8).
- **Do not accept absolute paths.** The `resolveUnderRoot` function rejects them, and this is by design.
- **Do not silently swallow verification failures.** Every parsed token must produce a result entry. The fail-closed design depends on this.
- **Do not widen the accepted path formats** beyond the current spec (no absolute paths, no unresolved symlinks).
- **Do not throw exceptions from domain logic.** Return `{ ok: false, reason }` result types instead.

## Running and Testing

- **Build:** `npm run build` (uses tsup)
- **Dev mode:** `npm run dev -- <command> <args>` (uses tsx)
- **Tests:** `npm run test` (uses vitest)
- **Type check:** `npm run typecheck`
- **Verify docs:** `npm run verify` (runs `scripts/verify-docs.sh`)
- **MCP smoke test:** `npm run mcp:smoke`

## File-by-File Reference

| File | Lines | Purpose |
|------|-------|---------|
| `src/cli.ts` | 113 | CLI entry point with `cite`, `claim`, `verify workspace`, `mcp` commands | <!-- [[vctx:src/cli.ts#L1-L113@4df585c3]] --> |
| `src/types.ts` | 53 | `ErrorReason`, `StructureKind`, `VerifyKind`, result interfaces | <!-- [[vctx:src/types.ts#L1-L53@ed5222ec]] --> |
| `src/core/file.ts` | 88 | `normalizeEol`, `readCanonicalText`, `hashSha256Hex`, `hashLineSpan` | <!-- [[vctx:src/core/file.ts#L1-L88@b703d4c1]] --> |
| `src/core/pathing.ts` | 44 | `normalizePathForClaim`, `resolveUnderRoot` | <!-- [[vctx:src/core/pathing.ts#L1-L44@67843fbe]] --> |
| `src/cite/citation.ts` | 91 | `CITATION_REGEX`, `renderCitation`, `parseCitations`, `generateCitation`, `verifyCitation` | <!-- [[vctx:src/cite/citation.ts#L1-L91@2f499224]] --> |
| `src/cite/claim.ts` | 86 | `STRUCTURE_REGEX`, `parseStructureClaims`, `renderStructureClaim`, `generateStructureClaim`, `verifyStructureKind` | <!-- [[vctx:src/cite/claim.ts#L1-L86@767ec677]] --> |
| `src/mcp/server.ts` | 74 | `textJson`, `runMcpServer` registering `vctx_cite`, `vctx_claim`, `vctx_verify_workspace` | <!-- [[vctx:src/mcp/server.ts#L1-L74@649772e7]] --> |
| `src/verify/workspace.ts` | 82 | `readVerifyText`, `verifyWorkspace` | <!-- [[vctx:src/verify/workspace.ts#L1-L82@147e0596]] --> |
