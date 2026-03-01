# src/core/

<!-- [[vctx-exists-dir:src/core/]] -->

Low-level, deterministic primitives for filesystem access, path resolution, and SHA-256 hashing. Every other module in VeriContext depends on `core/` for safe file reading and root-jailed path normalization.

## Module overview

This directory contains two source files and no sub-directories:

| File | Purpose |
|------|---------|
| `file.ts` <!-- [[vctx-exists-file:src/core/file.ts]] --> | Canonical text reading, EOL normalization, and SHA-256 hashing |
| `pathing.ts` <!-- [[vctx-exists-file:src/core/pathing.ts]] --> | Path normalization, root-jail enforcement, and default exclusion list |

Both files import `ErrorReason` from `src/types.ts` <!-- [[vctx-exists-file:src/types.ts]] --> for a shared union of error-reason string literals used across the project.

## file.ts

<!-- [[vctx:src/core/file.ts#L1-L83@45893a37]] -->

### `normalizeEol(text: string): string`

<!-- [[vctx:src/core/file.ts#L19-L21@9d6c8154]] -->

Replaces `\r\n` and bare `\r` sequences with `\n` so that all downstream hashing is performed against a single canonical line-ending format.

### `readCanonicalText(absolutePath: string): Promise<FileTextOk | FileTextErr>`

<!-- [[vctx:src/core/file.ts#L23-L55@0d766eb6]] -->

Reads a file from disk and returns its contents in canonical form. The function applies several safety checks before returning:

1. **Existence** -- returns `file_missing` if `lstat` fails.
2. **Symlink guard** -- returns `symlink_skipped` if the path is a symbolic link.
3. **Regular-file check** -- returns `not_a_file` for directories, devices, etc.
4. **Binary detection** -- scans the first 8 192 bytes for a null byte; returns `binary_file` if one is found.
5. **UTF-8 decoding** -- uses `TextDecoder("utf-8", { fatal: true })`; returns `invalid_utf8` on failure.
6. **EOL normalization** -- passes the decoded string through `normalizeEol`.

On success, returns `{ ok: true, text, lines }` where `lines` is the result of splitting the canonical text on `\n`.

### `hashSha256Hex(value: string): string`

<!-- [[vctx:src/core/file.ts#L57-L59@bea0cf0b]] -->

Thin wrapper around Node's `crypto.createHash("sha256")`. Accepts a UTF-8 string and returns its SHA-256 digest as a lowercase hex string.

### `hashLineSpan(lines: string[], startLine: number, endLine: number): SpanHashOk | SpanHashErr`

<!-- [[vctx:src/core/file.ts#L71-L83@a6f0dc13]] -->

Computes the SHA-256 hash of a contiguous range of lines. Lines are 1-indexed. The function validates that:

- Both `startLine` and `endLine` are positive integers.
- `endLine >= startLine`.
- `endLine` does not exceed the total line count.

If validation fails, the function returns `{ ok: false, reason: "range_invalid" }`. On success, the selected lines are joined with `\n` and passed to `hashSha256Hex`.

## pathing.ts

<!-- [[vctx:src/core/pathing.ts#L1-L55@c271822b]] -->

### `DEFAULT_EXCLUDES`

<!-- [[vctx:src/core/pathing.ts#L16-L16@157ad60f]] -->

A readonly tuple of directory names that are excluded from traversal by default: `.git`, `node_modules`, `dist`, and `build`.

### `normalizePathForClaim(inputPath: string): string`

<!-- [[vctx:src/core/pathing.ts#L18-L24@c6b106a3]] -->

Normalizes an input path by converting backslashes to forward slashes and stripping a leading `./` prefix. Trailing slashes (used by directory claims) are preserved.

### `resolveUnderRoot(root: string, inputPath: string): PathOk | PathErr`

<!-- [[vctx:src/core/pathing.ts#L26-L50@1d752a72]] -->

The root-jail function that all citation and claim generation passes through. It enforces the following constraints:

1. **No absolute paths** -- rejects immediately with `invalid_path`.
2. **Non-empty after normalization** -- rejects `.` and empty strings with `invalid_path`.
3. **No escape** -- after `path.resolve`, the relative path from root must not start with `..` or be absolute; otherwise returns `path_escape`.

On success, returns both the `normalizedPath` (forward-slash-separated, relative) and the `absolutePath` on disk.

### `isExcludedPath(normalizedPath: string): boolean`

<!-- [[vctx:src/core/pathing.ts#L52-L54@27ee4218]] -->

Returns `true` when the given normalized path equals or is nested under any entry in `DEFAULT_EXCLUDES`.

## Design invariants

- **All text is UTF-8 only.** Non-UTF-8 files are rejected rather than silently corrupted.
- **Symlinks are never followed.** This prevents hash confusion from symlinked content.
- **Hashes are always computed from EOL-normalized text.** This ensures cross-platform determinism.
- **Every path must resolve strictly under `--root`.** Absolute paths and `../` escapes are always rejected.
- **Line numbers are 1-indexed.** A span of `L1-L1` refers to the first line of the file.

## Out of scope for this module

- CLI option parsing and argument validation (handled by `src/cli.ts`).
- MCP protocol transport and JSON-RPC framing (handled by `src/mcp/`).
- Citation/claim string rendering and parsing (handled by `src/cite/`).
- Document-wide verification and aggregation (handled by `src/verify/`).
