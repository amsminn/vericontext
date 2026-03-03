import { describe, expect, it } from "vitest";

import { normalizePathForClaim, resolveUnderRoot } from "../src/core/pathing.js";

describe("normalizePathForClaim", () => {
  it("converts backslash to forward slash", () => {
    expect(normalizePathForClaim("src\\core\\file.ts")).toBe("src/core/file.ts");
  });

  it("removes ./ prefix", () => {
    expect(normalizePathForClaim("./src/file.ts")).toBe("src/file.ts");
  });

  it("preserves trailing slash", () => {
    expect(normalizePathForClaim("src/core/")).toBe("src/core/");
  });

  it("handles empty string", () => {
    expect(normalizePathForClaim("")).toBe("");
  });

  it("handles plain filename", () => {
    expect(normalizePathForClaim("file.ts")).toBe("file.ts");
  });
});

describe("resolveUnderRoot", () => {
  const root = "/tmp/test-root";

  it("resolves valid relative path", () => {
    const result = resolveUnderRoot(root, "src/file.ts");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.normalizedPath).toBe("src/file.ts");
    }
  });

  it("rejects absolute path", () => {
    const result = resolveUnderRoot(root, "/etc/passwd");
    expect(result).toEqual({ ok: false, reason: "invalid_path" });
  });

  it("rejects empty string", () => {
    const result = resolveUnderRoot(root, "");
    expect(result).toEqual({ ok: false, reason: "invalid_path" });
  });

  it("rejects dot path", () => {
    const result = resolveUnderRoot(root, ".");
    expect(result).toEqual({ ok: false, reason: "invalid_path" });
  });

  it("rejects parent traversal", () => {
    const result = resolveUnderRoot(root, "../etc/passwd");
    expect(result).toEqual({ ok: false, reason: "path_escape" });
  });

  it("rejects embedded traversal", () => {
    const result = resolveUnderRoot(root, "src/../../etc/passwd");
    expect(result).toEqual({ ok: false, reason: "path_escape" });
  });

  it("normalizes backslash separators", () => {
    const result = resolveUnderRoot(root, "src\\core\\file.ts");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.normalizedPath).toBe("src/core/file.ts");
    }
  });
});
