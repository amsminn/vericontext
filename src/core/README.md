# src/core/

`core/` contains low-level deterministic filesystem and hashing logic.
<!-- [[vctx-exists-dir:src/core/]] -->

## Files

- `pathing.ts`
  <!-- [[vctx-exists-file:src/core/pathing.ts]] -->
  - `resolveUnderRoot(root, inputPath)`: enforces root jail and rejects escapes.
  <!-- [[vctx:src/core/pathing.ts#L26-L49@0121c3fd]] -->
  - `normalizePathForClaim(inputPath)`: normalizes slash style and relative notation.
  - `DEFAULT_EXCLUDES`: default excluded directories (`.git`, `node_modules`, `dist`, `build`).
- `file.ts`
  <!-- [[vctx-exists-file:src/core/file.ts]] -->
  - `readCanonicalText(absolutePath)`: checks UTF-8, symlink/binary constraints, normalizes EOL to `\n`, and returns line arrays.
  <!-- [[vctx:src/core/file.ts#L23-L55@0d766eb6]] -->
  - `hashLineSpan(lines, startLine, endLine)`: computes SHA-256 for a line span.
  - `hashSha256Hex(value)` and `normalizeEol(text)` utilities.

## Invariants

- Paths must resolve under `--root`.
- Text decoding is UTF-8 only.
- Hashes are computed from canonicalized text.
- Invalid ranges return `range_invalid`.

## Keep out of this directory

- CLI option parsing
- MCP protocol transport code
- User-facing presentation formatting rules
