import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { normalizeEol, readCanonicalText, hashLineSpan, hashSha256Hex } from "../src/core/file.js";

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "vcc-file-test-"));
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

describe("normalizeEol", () => {
  it("converts CRLF to LF", () => {
    expect(normalizeEol("a\r\nb\r\n")).toBe("a\nb\n");
  });

  it("converts CR to LF", () => {
    expect(normalizeEol("a\rb\r")).toBe("a\nb\n");
  });

  it("preserves LF", () => {
    expect(normalizeEol("a\nb\n")).toBe("a\nb\n");
  });

  it("handles mixed EOL", () => {
    expect(normalizeEol("a\r\nb\rc\n")).toBe("a\nb\nc\n");
  });
});

describe("hashLineSpan", () => {
  const lines = ["line1", "line2", "line3"];

  it("hashes single line", () => {
    const result = hashLineSpan(lines, 1, 1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sha256_full).toBe(hashSha256Hex("line1"));
    }
  });

  it("hashes multi-line span", () => {
    const result = hashLineSpan(lines, 1, 2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sha256_full).toBe(hashSha256Hex("line1\nline2"));
    }
  });

  it("hashes all lines", () => {
    const result = hashLineSpan(lines, 1, 3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sha256_full).toBe(hashSha256Hex("line1\nline2\nline3"));
    }
  });

  it("rejects startLine < 1", () => {
    expect(hashLineSpan(lines, 0, 2)).toEqual({ ok: false, reason: "range_invalid" });
  });

  it("rejects endLine < startLine", () => {
    expect(hashLineSpan(lines, 3, 1)).toEqual({ ok: false, reason: "range_invalid" });
  });

  it("rejects endLine > lines.length", () => {
    expect(hashLineSpan(lines, 1, 10)).toEqual({ ok: false, reason: "range_invalid" });
  });

  it("rejects float startLine", () => {
    expect(hashLineSpan(lines, 1.5, 2)).toEqual({ ok: false, reason: "range_invalid" });
  });
});

describe("readCanonicalText", () => {
  it("reads a valid text file", async () => {
    await withTempDir(async (dir) => {
      const filePath = path.join(dir, "test.txt");
      await fs.writeFile(filePath, "hello\nworld\n", "utf8");

      const result = await readCanonicalText(filePath);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.text).toBe("hello\nworld\n");
        expect(result.lines).toEqual(["hello", "world", ""]);
      }
    });
  });

  it("returns file_missing for nonexistent file", async () => {
    const result = await readCanonicalText("/tmp/does-not-exist-" + Date.now());
    expect(result).toEqual({ ok: false, reason: "file_missing" });
  });

  it("returns symlink_skipped for symlink", async () => {
    await withTempDir(async (dir) => {
      const realFile = path.join(dir, "real.txt");
      const linkFile = path.join(dir, "link.txt");
      await fs.writeFile(realFile, "content", "utf8");
      await fs.symlink(realFile, linkFile);

      const result = await readCanonicalText(linkFile);
      expect(result).toEqual({ ok: false, reason: "symlink_skipped" });
    });
  });

  it("returns not_a_file for directory", async () => {
    await withTempDir(async (dir) => {
      const result = await readCanonicalText(dir);
      expect(result).toEqual({ ok: false, reason: "not_a_file" });
    });
  });

  it("returns binary_file for file with null bytes", async () => {
    await withTempDir(async (dir) => {
      const filePath = path.join(dir, "binary.bin");
      await fs.writeFile(filePath, Buffer.from([0x48, 0x00, 0x65, 0x6c]));

      const result = await readCanonicalText(filePath);
      expect(result).toEqual({ ok: false, reason: "binary_file" });
    });
  });

  it("normalizes CRLF to LF", async () => {
    await withTempDir(async (dir) => {
      const filePath = path.join(dir, "crlf.txt");
      await fs.writeFile(filePath, "a\r\nb\r\n", "utf8");

      const result = await readCanonicalText(filePath);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.text).toBe("a\nb\n");
      }
    });
  });
});
