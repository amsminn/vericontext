import { parseCitations, verifyCitation } from "../cite/citation.js";
import { parseStructureClaims, verifyStructureKind } from "../cite/claim.js";
import { normalizeEol, readCanonicalText } from "../core/file.js";
import { resolveUnderRoot } from "../core/pathing.js";
import type { VerifyWorkspaceResult } from "../types.js";
import type { ErrorReason } from "../types.js";

export interface VerifyInput {
  root: string;
  inPath?: string;
  text?: string;
}

export async function readVerifyText(input: VerifyInput): Promise<string | { reason: ErrorReason }> {
  if (input.text !== undefined && input.inPath !== undefined) {
    return { reason: "invalid_input" };
  }
  if (input.text !== undefined) {
    return normalizeEol(input.text);
  }
  if (input.inPath === undefined) {
    return { reason: "invalid_input" };
  }

  const resolved = resolveUnderRoot(input.root, input.inPath);
  if (!resolved.ok) {
    return { reason: resolved.reason };
  }

  const file = await readCanonicalText(resolved.absolutePath);
  if (!file.ok) {
    return { reason: file.reason };
  }
  return file.text;
}

export async function verifyWorkspace(input: VerifyInput): Promise<VerifyWorkspaceResult | { ok: false; reason: ErrorReason }> {
  const doc = await readVerifyText(input);
  if (typeof doc !== "string") {
    return { ok: false, reason: doc.reason };
  }

  const citationTokens = parseCitations(doc);
  const structureTokens = parseStructureClaims(doc);
  const results: VerifyWorkspaceResult["results"] = [];

  for (const token of citationTokens) {
    const result = await verifyCitation(input.root, token);
    results.push({
      claim: token.raw,
      kind: "citation",
      ok: result.ok,
      reason: result.ok ? undefined : result.reason,
    });
  }

  for (const token of structureTokens) {
    const structure = await verifyStructureKind({
      root: input.root,
      kind: token.kind,
      path: token.path,
    });

    if (!structure.ok) {
      results.push({ claim: token.raw, kind: "structure", ok: false, reason: structure.reason });
      continue;
    }
    results.push({ claim: token.raw, kind: "structure", ok: true });
  }

  const total = results.length;
  const ok_count = results.filter((r) => r.ok).length;
  const fail_count = total - ok_count;

  return {
    ok: fail_count === 0,
    total,
    ok_count,
    fail_count,
    results,
  };
}
