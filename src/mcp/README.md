# src/mcp/

<!-- [[vctx-exists-dir:src/mcp/]] -->

The `mcp/` module is the Model Context Protocol adapter layer. It exposes the
core VeriContext operations (citation generation, structure-claim generation, and
workspace verification) as MCP tools over a stdio JSON-RPC transport. No business
logic lives here; the module maps MCP tool schemas to existing functions in
`src/cite/`
<!-- [[vctx-exists-dir:src/cite/]] -->
and `src/verify/`.
<!-- [[vctx-exists-dir:src/verify/]] -->

## Files

### server.ts

<!-- [[vctx-exists-file:src/mcp/server.ts]] -->
<!-- [[vctx:src/mcp/server.ts#L1-L72@c68412d1]] -->

Single source file containing the full MCP server setup.

#### `textJson(value)`

<!-- [[vctx:src/mcp/server.ts#L9-L13@7642c05e]] -->

Private helper that wraps an arbitrary value into the MCP content envelope
`{ content: [{ type: "text", text: "<json>" }] }`. Every tool handler returns
its result through this wrapper so the MCP client receives well-formed
JSON-over-text responses.

#### `runMcpServer()`

<!-- [[vctx:src/mcp/server.ts#L15-L72@f04e2724]] -->

Exported async function called by the CLI `mcp` subcommand. It performs three
steps:

1. **Server initialisation** -- creates an `McpServer` instance with name
   `"vericontext"` and version `"0.1.0"`.

2. **Tool registration** -- registers the three tools described below.

3. **Transport binding** -- creates a `StdioServerTransport` and connects.
   <!-- [[vctx:src/mcp/server.ts#L70-L72@13a0f1b6]] -->

## Registered tools

### `vctx_cite`

<!-- [[vctx:src/mcp/server.ts#L21-L36@3aa3ce74]] -->

Generates a verifiable citation for a file line-span.

| Parameter    | Type              | Description                         |
| ------------ | ----------------- | ----------------------------------- |
| `root`       | `string`          | Absolute path to the repository root |
| `path`       | `string`          | File path relative to root           |
| `start_line` | `integer (> 0)`   | 1-based start line                   |
| `end_line`   | `integer (> 0)`   | 1-based end line                     |

Delegates to `generateCitation` from `src/cite/citation.ts`.

### `vctx_claim`

<!-- [[vctx:src/mcp/server.ts#L38-L52@47558dbf]] -->

Generates a structure-claim string for a filesystem path.

| Parameter | Type                                             | Description           |
| --------- | ------------------------------------------------ | --------------------- |
| `root`    | `string`                                         | Repository root        |
| `kind`    | `"exists" \| "exists-file" \| "exists-dir" \| "missing"` | Claim type  |
| `path`    | `string`                                         | Path relative to root  |

Delegates to `generateStructureClaim` from `src/cite/claim.ts`.

### `vctx_verify_workspace`

<!-- [[vctx:src/mcp/server.ts#L54-L68@ebec77b3]] -->

Verifies all in-document VCC claims against the current workspace.

| Parameter | Type               | Description                                 |
| --------- | ------------------ | ------------------------------------------- |
| `root`    | `string`           | Repository root                              |
| `in_path` | `string` (optional)| Document file path relative to root          |
| `text`    | `string` (optional)| Inline document text                         |

Exactly one of `in_path` or `text` must be provided. Delegates to
`verifyWorkspace` from `src/verify/workspace.ts`.

## Design constraints

- **stdout is reserved for JSON-RPC.** The MCP specification requires that the
  stdio transport uses stdout exclusively for protocol messages. Diagnostic or
  debug output must go to stderr.
- **No business logic.** All hashing, parsing, and verification logic is reused
  from `src/cite/`
  <!-- [[vctx-exists-dir:src/cite/]] -->
  and `src/verify/`.
  <!-- [[vctx-exists-dir:src/verify/]] -->
  This module owns only MCP schema definitions and the mapping between MCP
  parameter names (snake_case) and internal function signatures (camelCase).

## Keep out of this directory

- File canonicalization or hashing logic (belongs in `src/core/`).
  <!-- [[vctx-exists-dir:src/core/]] -->
- Claim token grammar or parsing (belongs in `src/cite/`).
  <!-- [[vctx-exists-dir:src/cite/]] -->
- CLI argument parsing (belongs in `src/cli.ts`).
