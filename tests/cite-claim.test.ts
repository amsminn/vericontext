import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseStructureClaims, renderStructureClaim, generateStructureClaim, verifyStructureKind } from "../src/cite/claim.js";

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "vcc-claim-test-"));
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

describe("renderStructureClaim", () => {
  it("renders exists-dir claim", () => {
    expect(renderStructureClaim("exists-dir", "src/")).toBe("[[vctx-exists-dir:src/]]");
  });

  it("renders missing claim", () => {
    expect(renderStructureClaim("missing", "tmp/")).toBe("[[vctx-missing:tmp/]]");
  });
});

describe("parseStructureClaims", () => {
  it("parses exists-dir", () => {
    const results = parseStructureClaims("<!-- [[vctx-exists-dir:src/]] -->");
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ kind: "exists-dir", path: "src/", raw: "[[vctx-exists-dir:src/]]" });
  });

  it("parses exists-file", () => {
    const results = parseStructureClaims("[[vctx-exists-file:src/cli.ts]]");
    expect(results).toHaveLength(1);
    expect(results[0].kind).toBe("exists-file");
  });

  it("parses exists", () => {
    const results = parseStructureClaims("[[vctx-exists:src/]]");
    expect(results).toHaveLength(1);
    expect(results[0].kind).toBe("exists");
  });

  it("parses missing", () => {
    const results = parseStructureClaims("[[vctx-missing:dist/]]");
    expect(results).toHaveLength(1);
    expect(results[0].kind).toBe("missing");
  });

  it("parses multiple claims", () => {
    const text = "[[vctx-exists-dir:src/]]\n[[vctx-missing:tmp/]]";
    const results = parseStructureClaims(text);
    expect(results).toHaveLength(2);
  });

  it("returns empty for no claims", () => {
    expect(parseStructureClaims("no claims here")).toEqual([]);
  });

  it("returns empty for empty string", () => {
    expect(parseStructureClaims("")).toEqual([]);
  });
});

describe("generateStructureClaim", () => {
  it("generates exists claim", () => {
    const result = generateStructureClaim({ root: "/tmp", kind: "exists", path: "src" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.claim).toBe("[[vctx-exists:src]]");
      expect(result.kind).toBe("exists");
    }
  });

  it("generates exists-file claim", () => {
    const result = generateStructureClaim({ root: "/tmp", kind: "exists-file", path: "src/file.ts" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.claim).toBe("[[vctx-exists-file:src/file.ts]]");
    }
  });

  it("generates missing claim", () => {
    const result = generateStructureClaim({ root: "/tmp", kind: "missing", path: "dist" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.claim).toBe("[[vctx-missing:dist]]");
    }
  });

  it("rejects path escape", () => {
    const result = generateStructureClaim({ root: "/tmp", kind: "exists", path: "../etc" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("path_escape");
    }
  });
});

describe("verifyStructureKind", () => {
  it("exists-dir passes for directory", async () => {
    await withTempDir(async (dir) => {
      await fs.mkdir(path.join(dir, "src"), { recursive: true });
      const result = await verifyStructureKind({ root: dir, kind: "exists-dir", path: "src" });
      expect(result).toEqual({ ok: true });
    });
  });

  it("exists-dir fails for file", async () => {
    await withTempDir(async (dir) => {
      await fs.writeFile(path.join(dir, "file.ts"), "x", "utf8");
      const result = await verifyStructureKind({ root: dir, kind: "exists-dir", path: "file.ts" });
      expect(result).toEqual({ ok: false, reason: "not_dir" });
    });
  });

  it("exists-file passes for file", async () => {
    await withTempDir(async (dir) => {
      await fs.writeFile(path.join(dir, "file.ts"), "x", "utf8");
      const result = await verifyStructureKind({ root: dir, kind: "exists-file", path: "file.ts" });
      expect(result).toEqual({ ok: true });
    });
  });

  it("exists-file fails for directory", async () => {
    await withTempDir(async (dir) => {
      await fs.mkdir(path.join(dir, "src"), { recursive: true });
      const result = await verifyStructureKind({ root: dir, kind: "exists-file", path: "src" });
      expect(result).toEqual({ ok: false, reason: "not_file" });
    });
  });

  it("exists passes for file", async () => {
    await withTempDir(async (dir) => {
      await fs.writeFile(path.join(dir, "file.ts"), "x", "utf8");
      const result = await verifyStructureKind({ root: dir, kind: "exists", path: "file.ts" });
      expect(result).toEqual({ ok: true });
    });
  });

  it("exists passes for directory", async () => {
    await withTempDir(async (dir) => {
      await fs.mkdir(path.join(dir, "src"), { recursive: true });
      const result = await verifyStructureKind({ root: dir, kind: "exists", path: "src" });
      expect(result).toEqual({ ok: true });
    });
  });

  it("missing passes when not present", async () => {
    await withTempDir(async (dir) => {
      const result = await verifyStructureKind({ root: dir, kind: "missing", path: "does-not-exist" });
      expect(result).toEqual({ ok: true });
    });
  });

  it("missing fails when present", async () => {
    await withTempDir(async (dir) => {
      await fs.writeFile(path.join(dir, "exists.txt"), "x", "utf8");
      const result = await verifyStructureKind({ root: dir, kind: "missing", path: "exists.txt" });
      expect(result).toEqual({ ok: false, reason: "exists" });
    });
  });
});
