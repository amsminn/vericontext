# src/verify/

<!-- [[vctx-exists-dir:src/verify/]] -->

The `verify/` module is the document-level verification engine. It takes a document
(either from a file path or inline text), extracts all embedded VCC citation and
structure-claim tokens, re-validates each one against the current workspace state,
and returns an aggregate pass/fail summary.

## Files

### workspace.ts

<!-- [[vctx-exists-file:src/verify/workspace.ts]] -->
<!-- [[vctx:src/verify/workspace.ts#L1-L109@14af277c]] -->

The sole source file in this module. It exports two public functions:

#### `readVerifyText(input: VerifyInput)`

<!-- [[vctx:src/verify/workspace.ts#L16-L44@3eac890a]] -->

Resolves the document text that will be scanned for claims. The caller must provide
exactly one of `inPath` (a file path relative to the repository root) or `text`
(inline string). Providing both, or neither, returns an `invalid_input` error.

When `inPath` is used the function resolves the path under the repository root via
`resolveUnderRoot`, verifies the target is a regular file (rejecting missing paths
and non-files), reads it as UTF-8, and normalises line endings to `\n`.

#### `verifyWorkspace(input: VerifyInput)`

<!-- [[vctx:src/verify/workspace.ts#L46-L109@39dad95f]] -->

The main entry point for batch verification. It operates in three phases:

1. **Document loading** -- calls `readVerifyText` to obtain the full document string.

2. **Citation verification** -- extracts all `[[vctx:...]]` tokens via
   `parseCitations` from `src/cite/`
   <!-- [[vctx-exists-dir:src/cite/]] -->
   and, for each token:
   - Resolves the cited path under the root.
   - Reads the target file as canonical text.
   - Hashes the specified line span via `hashLineSpan` from `src/core/`.
     <!-- [[vctx-exists-dir:src/core/]] -->
   - Compares the first 8 hex characters of the SHA-256 against the token's
     embedded `hash8`. A mismatch produces `hash_mismatch`.
   <!-- [[vctx:src/verify/workspace.ts#L56-L82@e64af58b]] -->

3. **Structure-claim verification** -- extracts all `[[vctx-<kind>:...]]` tokens
   via `parseStructureClaims` and delegates each to `verifyStructureKind`, which
   checks the filesystem for existence, file-ness, or directory-ness as appropriate.
   <!-- [[vctx:src/verify/workspace.ts#L84-L96@00c9efaf]] -->

After processing every token the function aggregates results into a
`VerifyWorkspaceResult`:

<!-- [[vctx:src/verify/workspace.ts#L98-L108@fb6b18d2]] -->

| Field        | Meaning                                        |
| ------------ | ---------------------------------------------- |
| `ok`         | `true` only when every claim passed             |
| `total`      | Number of claims found in the document          |
| `ok_count`   | Number of claims that verified successfully     |
| `fail_count` | Number of claims that failed                    |
| `results`    | Per-claim detail array (`claim`, `kind`, `ok`, optional `reason`) |

#### `VerifyInput` interface

<!-- [[vctx:src/verify/workspace.ts#L10-L14@9a910450]] -->

```ts
interface VerifyInput {
  root: string;      // absolute path to the repository root
  inPath?: string;   // file path relative to root (mutually exclusive with text)
  text?: string;     // inline document text (mutually exclusive with inPath)
}
```

## Fail-closed design

- Ambiguous input (both or neither of `inPath`/`text`) returns `invalid_input`.
- Any single hash mismatch marks that claim as failed with `hash_mismatch`.
- A path that escapes the root is rejected with `path_escape`.
- If any claim fails, the overall result has `ok: false`.

## Module boundaries

- **Token grammar and parsing** are owned by `src/cite/`.
  <!-- [[vctx-exists-dir:src/cite/]] -->
- **File canonicalization and SHA-256 hashing** are delegated to `src/core/`.
  <!-- [[vctx-exists-dir:src/core/]] -->
- This module owns only the document-level scan-and-aggregate logic. It does not
  define token formats, perform hashing itself, or handle CLI / MCP serialization.
