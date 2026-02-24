import { readCanonicalText, hashLineSpan } from "../core/file.js";
import { resolveUnderRoot } from "../core/pathing.js";
import type { CiteSuccess, ErrorReason } from "../types.js";

export interface CitationParts {
  path: string;
  startLine: number;
  endLine: number;
  hash8: string;
  raw: string;
}

export interface CitationError {
  ok: false;
  reason: ErrorReason;
}

export const CITATION_REGEX = /\[\[vctx:([^#\]]+)#L([0-9]+)-L([0-9]+)@([a-f0-9]{8})\]\]/g;

export function renderCitation(path: string, startLine: number, endLine: number, sha256Full: string): string {
  const hash8 = sha256Full.slice(0, 8);
  return `[[vctx:${path}#L${startLine}-L${endLine}@${hash8}]]`;
}

export function parseCitations(text: string): CitationParts[] {
  const output: CitationParts[] = [];
  for (const match of text.matchAll(CITATION_REGEX)) {
    const path = match[1];
    const startLine = Number.parseInt(match[2], 10);
    const endLine = Number.parseInt(match[3], 10);
    const hash8 = match[4];
    output.push({ path, startLine, endLine, hash8, raw: match[0] });
  }
  return output;
}

export async function generateCitation(input: {
  root: string;
  path: string;
  startLine: number;
  endLine: number;
}): Promise<CiteSuccess | CitationError> {
  const resolved = resolveUnderRoot(input.root, input.path);
  if (!resolved.ok) {
    return { ok: false, reason: resolved.reason };
  }

  const file = await readCanonicalText(resolved.absolutePath);
  if (!file.ok) {
    return { ok: false, reason: file.reason };
  }

  const span = hashLineSpan(file.lines, input.startLine, input.endLine);
  if (!span.ok) {
    return { ok: false, reason: span.reason };
  }

  const citation = renderCitation(resolved.normalizedPath, input.startLine, input.endLine, span.sha256_full);
  return {
    ok: true,
    citation,
    sha256_full: span.sha256_full,
  };
}
