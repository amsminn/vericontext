# src/mcp/

`mcp/` is the adapter layer that exposes core functions as MCP tools.
<!-- [[vctx-exists-dir:src/mcp/]] -->

## Files

- `server.ts`
  <!-- [[vctx-exists-file:src/mcp/server.ts]] -->
  - Initializes MCP server (`McpServer`, `StdioServerTransport`).
  - Registers tools:
    - `vctx_cite`
    - `vctx_claim`
    - `vctx_verify_workspace`
  <!-- [[vctx:src/mcp/server.ts#L21-L68@e7a273fd]] -->
  - Wraps results as `content: [{ type: "text", text: "{...json...}" }]`.

## Rules

- stdout is reserved for JSON-RPC protocol messages.
- Business logic is reused from `src/cite/*` and `src/verify/*`.
- This layer owns MCP schemas and protocol mapping only.

## Keep out of this directory

- File canonicalization logic
- Claim verification algorithm internals
- CLI argument parsing
