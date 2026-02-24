import fs from "node:fs/promises";
import { createHash } from "node:crypto";

import type { ErrorReason } from "../types.js";

export interface FileTextOk {
  ok: true;
  text: string;
  lines: string[];
}

export interface FileTextErr {
  ok: false;
  reason: ErrorReason;
}

const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

export function normalizeEol(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

export async function readCanonicalText(absolutePath: string): Promise<FileTextOk | FileTextErr> {
  let stats;
  try {
    stats = await fs.lstat(absolutePath);
  } catch {
    return { ok: false, reason: "file_missing" };
  }

  if (stats.isSymbolicLink()) {
    return { ok: false, reason: "symlink_skipped" };
  }

  if (!stats.isFile()) {
    return { ok: false, reason: "not_a_file" };
  }

  const bytes = await fs.readFile(absolutePath);
  const probe = bytes.subarray(0, 8192);
  if (probe.includes(0)) {
    return { ok: false, reason: "binary_file" };
  }

  let decoded: string;
  try {
    decoded = UTF8_DECODER.decode(bytes);
  } catch {
    return { ok: false, reason: "invalid_utf8" };
  }

  const canonical = normalizeEol(decoded);
  const lines = canonical.split("\n");
  return { ok: true, text: canonical, lines };
}

export function hashSha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export interface SpanHashOk {
  ok: true;
  sha256_full: string;
}

export interface SpanHashErr {
  ok: false;
  reason: ErrorReason;
}

export function hashLineSpan(lines: string[], startLine: number, endLine: number): SpanHashOk | SpanHashErr {
  if (!Number.isInteger(startLine) || !Number.isInteger(endLine) || startLine < 1 || endLine < startLine) {
    return { ok: false, reason: "range_invalid" };
  }
  if (endLine > lines.length) {
    return { ok: false, reason: "range_invalid" };
  }

  const startIdx = startLine - 1;
  const endIdx = endLine;
  const span = lines.slice(startIdx, endIdx).join("\n");
  return { ok: true, sha256_full: hashSha256Hex(span) };
}
