# src/cite/

<!-- [[vctx-exists-dir:src/cite/]] -->

Token generation and parsing for VeriContext's two claim types: **content citations** (SHA-256-pinned line ranges) and **structure claims** (filesystem existence assertions). This module sits between the low-level `src/core/` <!-- [[vctx-exists-dir:src/core/]] --> primitives and the higher-level verification and CLI layers.

## Module overview

| File | Purpose |
|------|---------|
| `citation.ts` <!-- [[vctx-exists-file:src/cite/citation.ts]] --> | Generate, render, and parse content citations of the form `[[vctx:<path>#L<start>-L<end>@<hash8>]]` |
| `claim.ts` <!-- [[vctx-exists-file:src/cite/claim.ts]] --> | Generate, render, parse, and verify structure claims of the form `[[vctx-<kind>:<path>]]` |

Both files depend on `resolveUnderRoot` from `src/core/pathing.ts` <!-- [[vctx-exists-file:src/core/pathing.ts]] --> for root-jail path resolution. `citation.ts` additionally depends on `readCanonicalText` and `hashLineSpan` from `src/core/file.ts` <!-- [[vctx-exists-file:src/core/file.ts]] -->.

Shared type definitions (`CiteSuccess`, `ClaimSuccess`, `ErrorReason`, `StructureKind`) live in `src/types.ts` <!-- [[vctx-exists-file:src/types.ts]] -->.

## citation.ts

<!-- [[vctx:src/cite/citation.ts#L1-L64@2bd83842]] -->

Handles content citations -- tokens that pin a specific line range of a file to a truncated SHA-256 hash.

### Token format

```
[[vctx:<path>#L<startLine>-L<endLine>@<hash8>]]
```

Where `<hash8>` is the first 8 hex characters of the full SHA-256 digest computed over the canonicalized text of the specified line range.

### `CITATION_REGEX`

<!-- [[vctx:src/cite/citation.ts#L18-L18@0ce3115e]] -->

Global regex that matches citation tokens in arbitrary text. Captures four groups: path, start line, end line, and the 8-character hash prefix.

### `renderCitation(path, startLine, endLine, sha256Full): string`

<!-- [[vctx:src/cite/citation.ts#L20-L23@4e14a7c8]] -->

Formats a citation token string. Accepts the full 64-character SHA-256 hex digest and truncates it to the first 8 characters for embedding.

### `parseCitations(text: string): CitationParts[]`

<!-- [[vctx:src/cite/citation.ts#L25-L35@15286183]] -->

Scans input text with `CITATION_REGEX` and returns an array of parsed `CitationParts` objects, each containing `path`, `startLine`, `endLine`, `hash8`, and the `raw` matched string.

### `generateCitation(input): Promise<CiteSuccess | CitationError>`

<!-- [[vctx:src/cite/citation.ts#L37-L64@012d6e59]] -->

End-to-end citation generator. Performs three steps in sequence:

1. **Path resolution** -- calls `resolveUnderRoot` to validate and normalize the path under the project root. Rejects absolute paths (`invalid_path`) and escape attempts (`path_escape`).
2. **File reading** -- calls `readCanonicalText` to load and canonicalize the file content. Can fail with `file_missing`, `symlink_skipped`, `not_a_file`, `binary_file`, or `invalid_utf8`.
3. **Span hashing** -- calls `hashLineSpan` to compute the SHA-256 of the requested line range. Fails with `range_invalid` if the line numbers are out of bounds.

On success, returns `{ ok: true, citation, sha256_full }` where `citation` is the rendered token string ready for embedding.

## claim.ts

<!-- [[vctx:src/cite/claim.ts#L1-L87@ff481fd7]] -->

Handles structure claims -- tokens that assert the existence (or absence) of filesystem entries without content hashing.

### Token format

```
[[vctx-<kind>:<path>]]
```

Where `<kind>` is one of: `exists`, `exists-file`, `exists-dir`, or `missing`.

### `STRUCTURE_REGEX`

<!-- [[vctx:src/cite/claim.ts#L11-L11@b024f0a6]] -->

Global regex that matches structure-claim tokens. Captures two groups: the kind and the path.

### `parseStructureClaims(text: string): StructureToken[]`

<!-- [[vctx:src/cite/claim.ts#L19-L25@ae218199]] -->

Scans input text with `STRUCTURE_REGEX` and returns an array of `StructureToken` objects, each containing `kind`, `path`, and the `raw` matched string.

### `renderStructureClaim(kind, normalizedPath): string`

<!-- [[vctx:src/cite/claim.ts#L27-L29@cf7e3c65]] -->

Formats a structure-claim token string from a `StructureKind` and a normalized path.

### `generateStructureClaim(input): ClaimSuccess | ClaimError`

<!-- [[vctx:src/cite/claim.ts#L31-L52@46a7abfb]] -->

Synchronous claim generator. Resolves the input path under root via `resolveUnderRoot`, then renders the claim token. For `exists-dir` claims, if the input path ends with `/`, the trailing slash is preserved in the normalized output to maintain directory semantics.

Returns `{ ok: true, claim, kind, normalized_path }` on success.

### `verifyStructureKind(input): Promise<{ ok: true } | { ok: false; reason: ErrorReason }>`

<!-- [[vctx:src/cite/claim.ts#L54-L86@6f2e199a]] -->

Validates a structure claim against the actual filesystem state. The verification logic varies by kind:

| Kind | Pass condition | Fail reason |
|------|---------------|-------------|
| `missing` | `lstat` throws (path does not exist) | `exists` |
| `exists` | `lstat` succeeds (any type) | `missing` |
| `exists-file` | `lstat` succeeds and `isFile()` is true | `missing` or `not_file` |
| `exists-dir` | `lstat` succeeds and `isDirectory()` is true | `missing` or `not_dir` |

## Error handling

Both `citation.ts` and `claim.ts` return discriminated unions with `ok: true` for success and `ok: false` with a `reason` string for failure. They never throw exceptions during normal operation; all error paths are expressed as return values.

## Boundaries

- **Upstream dependency**: `src/core/` provides path resolution, file reading, and hashing.
- **Downstream consumers**: `src/verify/` uses the parse functions (`parseCitations`, `parseStructureClaims`) to extract tokens from documents and verify them in bulk.
- **Not in scope**: CLI argument parsing, MCP transport, and output formatting do not belong in this module.
