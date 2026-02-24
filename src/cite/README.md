# src/cite/

`cite/` is responsible for claim string generation and parsing.
<!-- [[vctx-exists-dir:src/cite/]] -->

## Files

- `citation.ts`
  <!-- [[vctx-exists-file:src/cite/citation.ts]] -->
  - `CITATION_REGEX`: parser for `[[vctx:<path>#L<start>-L<end>@<hash8>]]`.
  - `renderCitation(...)`: renders citation strings.
  - `parseCitations(text)`: extracts citation tokens from documents.
  - `generateCitation(...)`: combines root-jail resolution, canonical file reading, and span hashing.
  <!-- [[vctx:src/cite/citation.ts#L37-L64@012d6e59]] -->
- `claim.ts`
  <!-- [[vctx-exists-file:src/cite/claim.ts]] -->
  - `STRUCTURE_REGEX`: parser for structure claims.
  - `renderStructureClaim(...)`: renders structure claims.
  - `parseStructureClaims(text)`: extracts structure claim tokens.
  - `generateStructureClaim(...)`: builds `exists|exists-file|exists-dir|missing` claims.
  - `verifyStructureKind(...)`: validates structure claims against filesystem state.
  <!-- [[vctx:src/cite/claim.ts#L54-L86@6f2e199a]] -->

## Rules

- Citation and structure claims share the same path normalization and root-jail rules.
- Absolute paths are rejected (`invalid_path`).
- Root escapes are rejected (`path_escape`).

## Boundaries

- Document-wide aggregation and summary counts belong to `verify/`.
- CLI/MCP output wrapping and serialization do not belong here.
