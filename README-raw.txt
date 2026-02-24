# README Raw Samples

This file is a source-level sample index for README-style authoring with hidden verification claims.

## Project README files to reference

- Root user guide: `README.md`
<!-- [[vctx-exists-file:README.md]] -->
- Source module guide: `src/README.md`
<!-- [[vctx-exists-file:src/README.md]] -->
- Core internals guide: `src/core/README.md`
<!-- [[vctx-exists-file:src/core/README.md]] -->
- Cite internals guide: `src/cite/README.md`
<!-- [[vctx-exists-file:src/cite/README.md]] -->
- Verify internals guide: `src/verify/README.md`
<!-- [[vctx-exists-file:src/verify/README.md]] -->
- MCP adapter guide: `src/mcp/README.md`
<!-- [[vctx-exists-file:src/mcp/README.md]] -->
- Test strategy guide: `tests/README.md`
<!-- [[vctx-exists-file:tests/README.md]] -->
- Script guide: `scripts/README.md`
<!-- [[vctx-exists-file:scripts/README.md]] -->

## Global example list (synced with README)

- `README-raw.txt`: raw sample index for README-style source authoring.
<!-- [[vctx-exists-file:README-raw.txt]] -->
- `AGENTS-raw.txt`: raw sample index for AGENTS-style source authoring.
<!-- [[vctx-exists-file:AGENTS-raw.txt]] -->
- `README.md`: human-facing style with hidden inline evidence comments.
<!-- [[vctx-exists-file:README.md]] -->
- `AGENTS.md`: project-level machine-verifiable knowledge-base style.
<!-- [[vctx-exists-file:AGENTS.md]] -->
- `src/AGENTS.md`: module-level AGENTS style with structure and location evidence.
<!-- [[vctx-exists-file:src/AGENTS.md]] -->
- `tests/AGENTS.md`: test-focused AGENTS style with structure evidence.
<!-- [[vctx-exists-file:tests/AGENTS.md]] -->

## Raw authoring pattern

Use visible statements followed by hidden comment claims.

- CLI command wiring lives in `src/cli.ts`.
<!-- [[vctx:src/cli.ts#L36-L103@4db34b59]] -->

- Workspace verification lives in `src/verify/workspace.ts`.
<!-- [[vctx:src/verify/workspace.ts#L46-L109@39dad95f]] -->

- Root-jail enforcement lives in `src/core/pathing.ts`.
<!-- [[vctx:src/core/pathing.ts#L26-L49@0121c3fd]] -->

- Source directory exists.
<!-- [[vctx-exists-dir:src/]] -->

- Temporary output directory is absent by default.
<!-- [[vctx-missing:tmp-output/]] -->

Verify this sample:

```bash
npx . verify workspace --json --root . --in-path README-raw.txt
```
