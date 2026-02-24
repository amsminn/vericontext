# Contributing

## Runtime and Tooling

- Node.js 20+
- npm

## Output Hygiene

For MCP stdio mode, protocol output and logs must be separated:

- stdout: JSON-RPC protocol only.
- stderr: logs, diagnostics, and debug messages.

Never print free-form logs to stdout in MCP server execution paths.
