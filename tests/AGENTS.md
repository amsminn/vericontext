# TESTS KNOWLEDGE BASE

## OVERVIEW
`tests/` validates deterministic behavior at two levels: module-level primitives and real CLI execution.

## STRUCTURE
```text
tests/
├── core.test.ts        # module-level verification for cite/claim/verify
└── e2e.test.ts         # process-level verification via built CLI
```
<!-- [[vctx-exists-file:tests/core.test.ts]] -->
<!-- [[vctx-exists-file:tests/e2e.test.ts]] -->

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Core logic regression | `tests/core.test.ts` | direct calls into cite/claim/verify modules | <!-- [[vctx:tests/core.test.ts#L20-L85@922b2ee6]] --> |
| Real CLI behavior | `tests/e2e.test.ts` | builds `dist/cli.js`, spawns process, checks exit codes/JSON | <!-- [[vctx:tests/e2e.test.ts#L59-L108@3389456a]] --> |

## TEST FLOW
1. Build artifact when needed (e2e requires `dist/cli.js`).
2. Create isolated temp workspace.
3. Execute operation (`cite`, `verify`, or direct function call).
4. Assert output contract (`ok`, `reason`, counts) and exit status.
5. Cleanup workspace.

## CONVENTIONS
- Test files use `*.test.ts` under `tests/` (per `vitest.config.ts`).
<!-- [[vctx:vitest.config.ts#L1-L8@d56db7e2]] -->
- Use temp directories for filesystem isolation; cleanup is mandatory.
- Validate both semantic result (`ok`, `reason`) and process-level outcome (exit code).
<!-- [[vctx:package.json#L13-L19@a6c8a9fe]] -->
- Keep e2e assertions on user-visible behavior, not internal implementation details.
<!-- [[vctx-missing:tmp-output/]] -->

## COMMANDS
```bash
npm test
npm run typecheck
npm run build && npm test
```

## ANTI-PATTERNS
- Do not mock away root-jail or hashing behavior in tests that should exercise real paths.
- Do not assert brittle string formatting when JSON contract fields are the invariant.
- Do not add tests that depend on repository-local mutable state.
