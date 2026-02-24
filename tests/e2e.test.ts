import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

function runCli(args: string[], cwd: string): Promise<CliResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.resolve(cwd, "dist/cli.js"), ...args], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

async function withTempDir<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "vcc-e2e-"));
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

describe("CLI e2e", () => {
  const testDir = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(testDir, "..");

  beforeAll(() => {
    execFileSync("npm", ["run", "build"], { cwd: projectRoot, stdio: "pipe" });
  });

  it("runs cite -> verify pass -> verify fail after edit", async () => {
    await withTempDir(async (workspaceRoot) => {
      const srcDir = path.join(workspaceRoot, "src", "tools");
      await fs.mkdir(srcDir, { recursive: true });
      const entryPath = path.join(workspaceRoot, "src", "index.ts");
      await fs.writeFile(entryPath, "alpha\nbeta\n", "utf8");

      const cite = await runCli(
        ["cite", "--json", "--root", workspaceRoot, "--path", "src/index.ts", "--start-line", "1", "--end-line", "2"],
        projectRoot,
      );
      expect(cite.code).toBe(0);

      const citeJson = JSON.parse(cite.stdout) as { ok: boolean; citation?: string };
      expect(citeJson.ok).toBe(true);
      expect(typeof citeJson.citation).toBe("string");

      const summaryPath = path.join(workspaceRoot, "summary.md");
      await fs.writeFile(
        summaryPath,
        `${citeJson.citation}\n[[vctx-exists-dir:src/tools/]]\n[[vctx-exists-file:src/index.ts]]\n[[vctx-missing:dist/]]\n`,
        "utf8",
      );

      const verifyOk = await runCli(
        ["verify", "workspace", "--json", "--root", workspaceRoot, "--in-path", "summary.md"],
        projectRoot,
      );
      expect(verifyOk.code).toBe(0);
      const verifyOkJson = JSON.parse(verifyOk.stdout) as { ok: boolean; fail_count: number };
      expect(verifyOkJson.ok).toBe(true);
      expect(verifyOkJson.fail_count).toBe(0);

      await fs.writeFile(entryPath, "ALPHA\nbeta\n", "utf8");

      const verifyFail = await runCli(
        ["verify", "workspace", "--json", "--root", workspaceRoot, "--in-path", "summary.md"],
        projectRoot,
      );
      expect(verifyFail.code).toBe(1);
      const verifyFailJson = JSON.parse(verifyFail.stdout) as {
        ok: boolean;
        results: Array<{ reason?: string }>;
      };
      expect(verifyFailJson.ok).toBe(false);
      expect(verifyFailJson.results.some((r) => r.reason === "hash_mismatch")).toBe(true);
      expect(verifyFail.stderr).toBe("");
    });
  });
});
