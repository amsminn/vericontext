import fs from "node:fs/promises";

import { parseCitations } from "../cite/citation.js";
import { parseStructureClaims, verifyStructureKind } from "../cite/claim.js";
import { readCanonicalText, hashLineSpan } from "../core/file.js";
import { resolveUnderRoot } from "../core/pathing.js";
import type { VerifyWorkspaceResult } from "../types.js";
import type { ErrorReason } from "../types.js";

export interface VerifyInput {
  root: string;
  inPath?: string;
  text?: string;
}

export async function readVerifyText(input: VerifyInput): Promise<string | { reason: ErrorReason }> {
  const hasInPath = typeof input.inPath === "string";
  const hasText = typeof input.text === "string";
  if (hasInPath === hasText) {
    return { reason: "invalid_input" };
  }

  if (hasText) {
    return input.text as string;
  }

  const resolved = resolveUnderRoot(input.root, input.inPath as string);
  if (!resolved.ok) {
    return { reason: resolved.reason };
  }

  let stats;
  try {
    stats = await fs.lstat(resolved.absolutePath);
  } catch {
    return { reason: "file_missing" };
  }
  if (!stats.isFile()) {
    return { reason: "not_a_file" };
  }

  const raw = await fs.readFile(resolved.absolutePath, "utf8");
  return raw.replace(/\r\n?/g, "\n");
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
    const resolved = resolveUnderRoot(input.root, token.path);
    if (!resolved.ok) {
      results.push({ claim: token.raw, kind: "citation", ok: false, reason: resolved.reason });
      continue;
    }

    const file = await readCanonicalText(resolved.absolutePath);
    if (!file.ok) {
      results.push({ claim: token.raw, kind: "citation", ok: false, reason: file.reason });
      continue;
    }

    const span = hashLineSpan(file.lines, token.startLine, token.endLine);
    if (!span.ok) {
      results.push({ claim: token.raw, kind: "citation", ok: false, reason: span.reason });
      continue;
    }

    const hash8 = span.sha256_full.slice(0, 8);
    if (hash8 !== token.hash8) {
      results.push({ claim: token.raw, kind: "citation", ok: false, reason: "hash_mismatch" });
      continue;
    }

    results.push({ claim: token.raw, kind: "citation", ok: true });
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
