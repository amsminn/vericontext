# src/verify/

`verify/` validates all claims found in a document against a workspace.
<!-- [[vctx-exists-dir:src/verify/]] -->

## Files

- `workspace.ts`
  <!-- [[vctx-exists-file:src/verify/workspace.ts]] -->
  - `readVerifyText(input)`: enforces exactly one of `--in-path` or `--text`.
  - `verifyWorkspace(input)`: parses and validates citation and structure claims, then returns summary counts.
  <!-- [[vctx:src/verify/workspace.ts#L46-L109@39dad95f]] -->

## Verification sequence

1. Load document text (`inPath` or `text`).
2. Parse citation and structure claim tokens.
3. Recompute citation hashes from canonical line spans.
4. Check structure claims against filesystem state.
5. Return `total/ok_count/fail_count/results`.

## Fail-closed behavior

- Ambiguous input returns `invalid_input`.
- Any hash mismatch returns `hash_mismatch`.
- Any failed claim yields overall `ok=false`.

## Boundaries

- Claim grammar is owned by `src/cite/`.
- File canonicalization and hashing are delegated to `src/core/`.
