#!/usr/bin/env node

import { Command } from "commander";

import { generateCitation } from "./cite/citation.js";
import { generateStructureClaim } from "./cite/claim.js";
import { runMcpServer } from "./mcp/server.js";
import { verifyWorkspace } from "./verify/workspace.js";

function printResult(jsonMode: boolean, result: unknown, fallbackText?: string): void {
  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  if (fallbackText) {
    process.stdout.write(`${fallbackText}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function withRootAndJson(command: Command): Command {
  return command
    .requiredOption("--root <root>", "Repository root")
    .option("--json", "Output as JSON", false);
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name("vericontext")
    .description("Verifiable Context Compactor")
    .version("0.1.0");

  withRootAndJson(
    program
      .command("cite")
      .description("Generate a verifiable citation for a file line span")
      .requiredOption("--path <path>", "File path under root")
      .requiredOption("--start-line <startLine>", "1-based start line", Number.parseInt)
      .requiredOption("--end-line <endLine>", "1-based end line", Number.parseInt),
  ).action(async (opts) => {
    const result = await generateCitation({
      root: opts.root,
      path: opts.path,
      startLine: opts.startLine,
      endLine: opts.endLine,
    });
    const text = result.ok ? result.citation : undefined;
    printResult(Boolean(opts.json), result, text);
    if (!result.ok) {
      process.exitCode = 1;
    }
  });

  withRootAndJson(
    program
      .command("claim")
      .description("Generate a structure claim")
      .requiredOption("--kind <kind>", "exists|exists-file|exists-dir|missing")
      .requiredOption("--path <path>", "Path under root"),
  ).action(async (opts) => {
    const kinds = new Set(["exists", "exists-file", "exists-dir", "missing"]);
    if (!kinds.has(opts.kind)) {
      const err = { ok: false, reason: "invalid_input" };
      printResult(Boolean(opts.json), err);
      process.exitCode = 1;
      return;
    }

    const result = generateStructureClaim({ root: opts.root, kind: opts.kind, path: opts.path });
    const text = result.ok ? result.claim : undefined;
    printResult(Boolean(opts.json), result, text);
    if (!result.ok) {
      process.exitCode = 1;
    }
  });

  const verify = program.command("verify").description("Verification commands");

  withRootAndJson(
    verify
      .command("workspace")
      .description("Verify all VCC claims from an input document or inline text")
      .option("--in-path <inPath>", "Input document path under root")
      .option("--text <text>", "Inline document text"),
  ).action(async (opts) => {
    const result = await verifyWorkspace({
      root: opts.root,
      inPath: opts.inPath,
      text: opts.text,
    });
    printResult(Boolean(opts.json), result);
    if (!result.ok) {
      process.exitCode = 1;
    }
  });

  program.command("mcp").description("Run MCP server over stdio").action(async () => {
    await runMcpServer();
  });

  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "unknown_error";
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
