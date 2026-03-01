# src/ -- Source Directory Overview

<!-- [[vctx-exists-dir:src/]] -->

`src/` is the production source root for **vericontext**, a deterministic documentation verification tool that uses SHA-256 hashes to tie prose to exact source code spans.

## Directory Layout

```
src/
  cli.ts            CLI entry point (commander-based)
  types.ts          Shared type definitions
  core/             Deterministic file and path primitives
    file.ts         Canonical text reading, EOL normalization, SHA-256 hashing
    pathing.ts      Root-jailed path resolution and exclusion rules
  cite/             Citation and structure claim generation/parsing
    citation.ts     Line-span citation rendering, regex parsing, generation
    claim.ts        Structure claim rendering, regex parsing, generation, verification
  verify/           Workspace-level verification pipeline
    workspace.ts    Reads a document, extracts all VCC tokens, verifies each one
  mcp/              MCP (Model Context Protocol) stdio server adapter
    server.ts       Exposes cite/claim/verify as MCP tools over stdio
```

<!-- [[vctx-exists-dir:src/core/]] -->
<!-- [[vctx-exists-dir:src/cite/]] -->
<!-- [[vctx-exists-dir:src/verify/]] -->
<!-- [[vctx-exists-dir:src/mcp/]] -->

## Module Descriptions

### `cli.ts`

<!-- [[vctx:src/cli.ts#L1-L111@d491e15a]] -->

The CLI entry point. Uses the `commander` library to register four top-level commands:

- **`cite`** -- generates a `[[vctx:path#Lstart-Lend@hash8]]` citation token for a given file and line range.
- **`claim`** -- generates a `[[vctx-kind:path]]` structure claim token asserting a path exists, is a file, is a directory, or is missing.
- **`verify workspace`** -- reads a document (by file path or inline text), extracts all embedded VCC tokens, and verifies each one against the current workspace state.
- **`mcp`** -- starts the MCP stdio server.

Every command accepts `--root` (repository root) and `--json` (machine-readable output). The CLI is a thin adapter: it parses arguments, delegates to feature modules, and sets exit codes.
<!-- [[vctx:src/cli.ts#L28-L105@ba562a4b]] -->

### `types.ts`

<!-- [[vctx:src/types.ts#L1-L53@ed5222ec]] -->

Shared type contracts used across the entire codebase:

- **`ErrorReason`** -- a union of all possible failure reason strings (`path_escape`, `file_missing`, `hash_mismatch`, `invalid_input`, etc.).
  <!-- [[vctx:src/types.ts#L1-L15@8c493a69]] -->
- **`StructureKind`** -- `"exists" | "exists-file" | "exists-dir" | "missing"`.
- **`VerifyKind`** -- `"citation" | "structure"`.
- **`VerifyResultItem`** and **`VerifyWorkspaceResult`** -- the shape of verification output including per-claim results and summary counts.
  <!-- [[vctx:src/types.ts#L17-L34@bcfd04b7]] -->
- **`JsonError`**, **`CiteSuccess`**, **`ClaimSuccess`** -- typed result shapes for cite and claim operations.
  <!-- [[vctx:src/types.ts#L36-L53@ef0400fb]] -->

### `core/` -- Deterministic Primitives

<!-- [[vctx-exists-dir:src/core/]] -->

#### `core/file.ts`

<!-- [[vctx:src/core/file.ts#L1-L83@45893a37]] -->

Provides deterministic file reading and hashing:

- **`normalizeEol(text)`** -- replaces `\r\n` and `\r` with `\n` to ensure cross-platform consistency.
- **`readCanonicalText(absolutePath)`** -- reads a file, rejects symlinks and binary files, decodes as strict UTF-8, normalizes line endings, and returns the canonical text plus an array of lines.
  <!-- [[vctx:src/core/file.ts#L23-L55@0d766eb6]] -->
- **`hashSha256Hex(value)`** -- returns the hex-encoded SHA-256 digest of a UTF-8 string.
- **`hashLineSpan(lines, startLine, endLine)`** -- extracts a 1-based line range, joins with `\n`, and hashes the result. Returns the full 64-character hex digest.
  <!-- [[vctx:src/core/file.ts#L57-L83@bae49b2e]] -->

#### `core/pathing.ts`

<!-- [[vctx:src/core/pathing.ts#L1-L54@74c23163]] -->

Provides root-jailed path resolution:

- **`DEFAULT_EXCLUDES`** -- paths that are always skipped: `.git`, `node_modules`, `dist`, `build`.
  <!-- [[vctx:src/core/pathing.ts#L16-L24@265d2ab3]] -->
- **`normalizePathForClaim(inputPath)`** -- converts backslashes to forward slashes, strips leading `./`.
- **`resolveUnderRoot(root, inputPath)`** -- resolves a relative path under the given root, rejects absolute paths and any path that escapes the root via `..`. Returns both the normalized (forward-slash) path and the absolute filesystem path.
  <!-- [[vctx:src/core/pathing.ts#L26-L50@1d752a72]] -->
- **`isExcludedPath(normalizedPath)`** -- checks whether a normalized path falls under any excluded prefix.
  <!-- [[vctx:src/core/pathing.ts#L52-L54@27ee4218]] -->

### `cite/` -- Citation and Claim Logic

<!-- [[vctx-exists-dir:src/cite/]] -->

#### `cite/citation.ts`

<!-- [[vctx:src/cite/citation.ts#L1-L64@2bd83842]] -->

Handles line-span citation tokens of the form `[[vctx:path#Lstart-Lend@hash8]]`:

- **`CITATION_REGEX`** -- the regex used to find citation tokens in text.
- **`renderCitation(path, startLine, endLine, sha256Full)`** -- builds the token string, truncating the hash to 8 hex characters.
- **`parseCitations(text)`** -- extracts all citation tokens from a document, returning path, line range, and hash8 for each.
  <!-- [[vctx:src/cite/citation.ts#L18-L35@1a54ae9a]] -->
- **`generateCitation(input)`** -- the main entry point: resolves the path under root, reads the file canonically, hashes the requested line span, and returns the full citation token.
  <!-- [[vctx:src/cite/citation.ts#L37-L64@012d6e59]] -->

#### `cite/claim.ts`

<!-- [[vctx:src/cite/claim.ts#L1-L86@767ec677]] -->

Handles structure claim tokens of the form `[[vctx-kind:path]]`:

- **`STRUCTURE_REGEX`** -- the regex used to find structure claims in text.
- **`parseStructureClaims(text)`** -- extracts all structure tokens from a document.
  <!-- [[vctx:src/cite/claim.ts#L11-L29@6af214bc]] -->
- **`generateStructureClaim(input)`** -- resolves the path under root and builds the claim token. For `exists-dir` claims with a trailing slash in the input, the slash is preserved in the output.
  <!-- [[vctx:src/cite/claim.ts#L31-L52@46a7abfb]] -->
- **`verifyStructureKind(input)`** -- checks the filesystem to verify a structure claim: for `missing` it asserts the path does not exist; for `exists` it asserts it exists; for `exists-file` and `exists-dir` it additionally checks the entry type.
  <!-- [[vctx:src/cite/claim.ts#L54-L86@6f2e199a]] -->

### `verify/` -- Verification Pipeline

<!-- [[vctx-exists-dir:src/verify/]] -->

#### `verify/workspace.ts`

<!-- [[vctx:src/verify/workspace.ts#L1-L109@14af277c]] -->

Orchestrates end-to-end verification of a document against the workspace:

- **`readVerifyText(input)`** -- accepts either an `inPath` (file under root) or `text` (inline string), but not both. Reads and normalizes the document content.
  <!-- [[vctx:src/verify/workspace.ts#L16-L44@3eac890a]] -->
- **`verifyWorkspace(input)`** -- the main verification function. It parses all citation tokens and structure claims from the document, then verifies each one:
  - Citation tokens are verified by re-reading the referenced file, re-hashing the line span, and comparing the first 8 hex characters.
  - Structure claims are verified via `verifyStructureKind`.
  - Returns a `VerifyWorkspaceResult` with `ok` (true only if zero failures), `total`, `ok_count`, `fail_count`, and per-claim `results`.
  <!-- [[vctx:src/verify/workspace.ts#L46-L109@39dad95f]] -->

### `mcp/` -- MCP Server Adapter

<!-- [[vctx-exists-dir:src/mcp/]] -->

#### `mcp/server.ts`

<!-- [[vctx:src/mcp/server.ts#L1-L72@c68412d1]] -->

Exposes the same three operations as the CLI through the Model Context Protocol over stdio:

- **`vctx_cite`** -- calls `generateCitation` with `root`, `path`, `start_line`, `end_line`.
- **`vctx_claim`** -- calls `generateStructureClaim` with `root`, `kind`, `path`.
- **`vctx_verify_workspace`** -- calls `verifyWorkspace` with `root`, `in_path`, `text`.

All tool responses are returned as JSON text payloads via the `textJson` helper.
<!-- [[vctx:src/mcp/server.ts#L15-L72@f04e2724]] -->

## Data Flow

1. **User invokes CLI or MCP tool** -- `cli.ts` parses arguments; `mcp/server.ts` receives MCP requests. Both are thin adapters.
   <!-- [[vctx-exists-file:src/cli.ts]] -->
   <!-- [[vctx-exists-file:src/mcp/server.ts]] -->
2. **Path resolution** -- every path-bearing operation calls `resolveUnderRoot()` to normalize and jail the path under root.
   <!-- [[vctx:src/core/pathing.ts#L26-L50@1d752a72]] -->
3. **Cite** -- `generateCitation()` reads the file via `readCanonicalText()`, hashes the line span, and renders the token.
   <!-- [[vctx:src/cite/citation.ts#L37-L64@012d6e59]] -->
4. **Claim** -- `generateStructureClaim()` builds a structure token; `verifyStructureKind()` checks it against the filesystem.
   <!-- [[vctx:src/cite/claim.ts#L31-L52@46a7abfb]] -->
5. **Verify** -- `verifyWorkspace()` extracts all tokens from a document, verifies each one, and produces a summary result.
   <!-- [[vctx:src/verify/workspace.ts#L46-L109@39dad95f]] -->

## Design Principles

- **Thin adapters, rich core** -- CLI and MCP modules contain no business logic. All domain logic lives in `core/`, `cite/`, and `verify/`.
- **Result types over exceptions** -- domain functions return `{ ok: true, ... } | { ok: false, reason }` discriminated unions rather than throwing errors.
- **Deterministic hashing** -- files are always read as strict UTF-8 with line endings normalized to `\n` before hashing, ensuring identical hashes across platforms.
- **Root jail** -- all paths must be relative and must resolve within the given root directory. Absolute paths and `..` escapes are rejected.
