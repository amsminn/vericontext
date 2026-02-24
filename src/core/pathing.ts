import path from "node:path";

import type { ErrorReason } from "../types.js";

export interface PathOk {
  ok: true;
  normalizedPath: string;
  absolutePath: string;
}

export interface PathErr {
  ok: false;
  reason: ErrorReason;
}

export const DEFAULT_EXCLUDES = [".git", "node_modules", "dist", "build"] as const;

export function normalizePathForClaim(inputPath: string): string {
  const normalized = inputPath.replaceAll("\\", "/").replace(/^\.\//, "");
  if (normalized.length > 0 && normalized.endsWith("/")) {
    return normalized;
  }
  return normalized;
}

export function resolveUnderRoot(root: string, inputPath: string): PathOk | PathErr {
  if (path.isAbsolute(inputPath)) {
    return { ok: false, reason: "invalid_path" };
  }

  const cleaned = normalizePathForClaim(inputPath);
  if (cleaned.length === 0 || cleaned === ".") {
    return { ok: false, reason: "invalid_path" };
  }

  const rootAbs = path.resolve(root);
  const absolutePath = path.resolve(rootAbs, cleaned);
  const rel = path.relative(rootAbs, absolutePath);

  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return { ok: false, reason: "path_escape" };
  }

  const normalizedPath = rel.split(path.sep).join("/");
  if (normalizedPath.length === 0 || normalizedPath.startsWith("../") || normalizedPath === "..") {
    return { ok: false, reason: "path_escape" };
  }

  return { ok: true, normalizedPath, absolutePath };
}

export function isExcludedPath(normalizedPath: string): boolean {
  return DEFAULT_EXCLUDES.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`));
}
