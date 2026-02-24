import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { generateCitation } from "../src/cite/citation.js";
import { generateStructureClaim } from "../src/cite/claim.js";
import { verifyWorkspace } from "../src/verify/workspace.js";

async function withTempDir<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "vcc-test-"));
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

describe("vericontext primitives", () => {
  it("generates citation and verifies successfully", async () => {
    await withTempDir(async (root) => {
      const file = path.join(root, "src", "index.ts");
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, "line1\nline2\nline3\n", "utf8");

      const cite = await generateCitation({ root, path: "src/index.ts", startLine: 1, endLine: 2 });
      expect(cite.ok).toBe(true);
      if (!cite.ok) {
        return;
      }

      const doc = `${cite.citation}\n[[vctx-exists-file:src/index.ts]]\n`;
      const verify = await verifyWorkspace({ root, text: doc });
      expect(verify.ok).toBe(true);
      if (!verify.ok) {
        return;
      }
      expect(verify.fail_count).toBe(0);
    });
  });

  it("fails closed on hash mismatch after edit", async () => {
    await withTempDir(async (root) => {
      const file = path.join(root, "src", "core.ts");
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, "a\nb\nc\n", "utf8");

      const cite = await generateCitation({ root, path: "src/core.ts", startLine: 1, endLine: 2 });
      expect(cite.ok).toBe(true);
      if (!cite.ok) {
        return;
      }

      await fs.writeFile(file, "a\nB\nc\n", "utf8");
      const verify = await verifyWorkspace({ root, text: cite.citation });
      expect(verify.ok).toBe(false);
      if (verify.ok || !("results" in verify)) {
        return;
      }
      expect(verify.results[0]?.reason).toBe("hash_mismatch");
    });
  });

  it("rejects path escape in cite", async () => {
    await withTempDir(async (root) => {
      const cite = await generateCitation({ root, path: "../etc/passwd", startLine: 1, endLine: 1 });
      expect(cite.ok).toBe(false);
      if (!cite.ok) {
        expect(cite.reason).toBe("path_escape");
      }
    });
  });

  it("generates structure claim kinds", async () => {
    await withTempDir(async (root) => {
      const claim = generateStructureClaim({ root, kind: "exists-dir", path: "src/tools/" });
      expect(claim.ok).toBe(true);
      if (!claim.ok) {
        return;
      }
      expect(claim.claim).toContain("[[vctx-exists-dir:src/tools/");
    });
  });
});
