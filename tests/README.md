# tests/

`tests/` is the verification suite for vericontext.
<!-- [[vctx-exists-dir:tests/]] -->

## Files

- `core.test.ts`
  <!-- [[vctx-exists-file:tests/core.test.ts]] -->
  - Unit and integration-level tests for core primitives.
  - Covers citation success, fail-closed hash mismatch, path escape rejection, and structure claim generation.
  <!-- [[vctx:tests/core.test.ts#L20-L85@922b2ee6]] -->
- `e2e.test.ts`
  <!-- [[vctx-exists-file:tests/e2e.test.ts]] -->
  - End-to-end test that executes built `dist/cli.js` as a real process.
  - Verifies `cite -> verify pass -> edit file -> verify fail` flow and exit codes.
  <!-- [[vctx:tests/e2e.test.ts#L59-L108@3389456a]] -->

## Test principles

- Use per-test temporary directories for isolation.
- Validate both JSON response shape and process exit code (`0` success, `1` failure).

## Extension guidance

- When a new failure reason is added, update both unit and e2e coverage.
- Keep e2e focused on user-visible workflows; keep implementation detail checks in unit tests.
