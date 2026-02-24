import { spawn } from "node:child_process";
import path from "node:path";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const cliPath = path.resolve("dist/cli.js");
  const child = spawn(process.execPath, [cliPath, "mcp"], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk: Buffer) => {
    stdout += chunk.toString("utf8");
  });
  child.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString("utf8");
  });

  await sleep(300);
  child.kill("SIGTERM");

  const code: number | null = await new Promise((resolve) => {
    child.on("close", (exitCode) => resolve(exitCode));
  });

  const report = {
    ok: code === 0 || code === null || code === 143,
    stdout_empty_or_protocol: stdout.length === 0,
    stderr,
    code,
  };

  process.stdout.write(`${JSON.stringify(report)}\n`);
  if (!report.ok || !report.stdout_empty_or_protocol) {
    process.exit(1);
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "unknown_error"}\n`);
  process.exit(1);
});
