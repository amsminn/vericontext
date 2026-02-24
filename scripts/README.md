# scripts/

`scripts/` contains executable maintenance and QA scripts.
<!-- [[vctx-exists-dir:scripts/]] -->

## Files

- `mcp-smoke.ts`: smoke-checks MCP stdio hygiene by launching `dist/cli.js mcp` and asserting stdout remains protocol-safe.
<!-- [[vctx-exists-file:scripts/mcp-smoke.ts]] -->

## Usage

- Run via `npm run mcp:smoke`.
<!-- [[vctx:package.json#L33-L42@8a7a3c66]] -->
- Scripts should be deterministic and CI-safe.

## Boundaries

- Keep production business logic in `src/`.
- Keep scripts focused on verification, tooling, or repository automation.
