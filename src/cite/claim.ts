import fs from "node:fs/promises";

import { resolveUnderRoot } from "../core/pathing.js";
import type { ClaimSuccess, ErrorReason, StructureKind } from "../types.js";

export interface ClaimError {
  ok: false;
  reason: ErrorReason;
}

export const STRUCTURE_REGEX = /\[\[vctx-(exists|exists-file|exists-dir|missing):([^\]]+)\]\]/g;

export interface StructureToken {
  kind: StructureKind;
  path: string;
  raw: string;
}

export function parseStructureClaims(text: string): StructureToken[] {
  const output: StructureToken[] = [];
  for (const match of text.matchAll(STRUCTURE_REGEX)) {
    output.push({ kind: match[1] as StructureKind, path: match[2], raw: match[0] });
  }
  return output;
}

export function renderStructureClaim(kind: StructureKind, normalizedPath: string): string {
  return `[[vctx-${kind}:${normalizedPath}]]`;
}

export function generateStructureClaim(input: {
  root: string;
  kind: StructureKind;
  path: string;
}): ClaimSuccess | ClaimError {
  const resolved = resolveUnderRoot(input.root, input.path);
  if (!resolved.ok) {
    return { ok: false, reason: resolved.reason };
  }

  let normalizedPath = resolved.normalizedPath;
  if (input.kind === "exists-dir" && input.path.endsWith("/") && !normalizedPath.endsWith("/")) {
    normalizedPath = `${normalizedPath}/`;
  }

  return {
    ok: true,
    claim: renderStructureClaim(input.kind, normalizedPath),
    kind: input.kind,
    normalized_path: normalizedPath,
  };
}

export async function verifyStructureKind(input: {
  root: string;
  kind: StructureKind;
  path: string;
}): Promise<{ ok: true } | { ok: false; reason: ErrorReason }> {
  const resolved = resolveUnderRoot(input.root, input.path);
  if (!resolved.ok) {
    return { ok: false, reason: resolved.reason };
  }

  let stats: Awaited<ReturnType<typeof fs.lstat>> | null = null;
  try {
    stats = await fs.lstat(resolved.absolutePath);
  } catch {
    stats = null;
  }

  if (input.kind === "missing") {
    return stats ? { ok: false, reason: "exists" } : { ok: true };
  }

  if (!stats) {
    return { ok: false, reason: "missing" };
  }

  if (input.kind === "exists") {
    return { ok: true };
  }
  if (input.kind === "exists-file") {
    return stats.isFile() ? { ok: true } : { ok: false, reason: "not_file" };
  }
  return stats.isDirectory() ? { ok: true } : { ok: false, reason: "not_dir" };
}
