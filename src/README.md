# src/

`src/` is the production code root for vericontext.
<!-- [[vctx-exists-dir:src/]] -->

## Directory roles

- `cli.ts`: CLI entrypoint. Registers `cite`, `claim`, `verify workspace`, and `mcp`, and sets exit codes.
<!-- [[vctx:src/cli.ts#L36-L103@4db34b59]] -->
- `types.ts`: Shared type contracts for error reasons and verify result shapes.
<!-- [[vctx:src/types.ts#L1-L53@ed5222ec]] -->
- `core/`: Deterministic path and file primitives.
<!-- [[vctx-exists-dir:src/core/]] -->
- `cite/`: Citation and structure-claim parsing/generation.
<!-- [[vctx-exists-dir:src/cite/]] -->
- `verify/`: Workspace claim verification pipeline.
<!-- [[vctx-exists-dir:src/verify/]] -->
- `mcp/`: MCP stdio adapter layer.
<!-- [[vctx-exists-dir:src/mcp/]] -->

## Data flow

1. `cli.ts` parses user input and calls feature modules.
<!-- [[vctx-exists-file:src/cli.ts]] -->
2. `cite/*` and `verify/*` share canonicalization and root-jail rules from `core/*`.
<!-- [[vctx:src/core/pathing.ts#L26-L49@0121c3fd]] -->
3. `mcp/server.ts` exposes the same primitives as MCP tools.
<!-- [[vctx:src/mcp/server.ts#L21-L68@e7a273fd]] -->

## Boundaries

- Put core logic in `core`/`cite`/`verify`; keep CLI and MCP thin adapters.
- Do not duplicate business logic across CLI and MCP paths.
