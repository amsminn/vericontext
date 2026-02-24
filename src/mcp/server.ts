import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { generateCitation } from "../cite/citation.js";
import { generateStructureClaim } from "../cite/claim.js";
import { verifyWorkspace } from "../verify/workspace.js";

function textJson(value: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [{ type: "text", text: JSON.stringify(value) }],
  };
}

export async function runMcpServer(): Promise<void> {
  const server = new McpServer({
    name: "vericontext",
    version: "0.1.0",
  });

  server.registerTool(
    "vctx_cite",
    {
      description: "Generate a verifiable citation for a file line-span.",
      inputSchema: {
        root: z.string(),
        path: z.string(),
        start_line: z.number().int().positive(),
        end_line: z.number().int().positive(),
      },
    },
    async ({ root, path, start_line, end_line }) => {
      const result = await generateCitation({ root, path, startLine: start_line, endLine: end_line });
      return textJson(result);
    },
  );

  server.registerTool(
    "vctx_claim",
    {
      description: "Generate a structure claim string for a path.",
      inputSchema: {
        root: z.string(),
        kind: z.enum(["exists", "exists-file", "exists-dir", "missing"]),
        path: z.string(),
      },
    },
    async ({ root, kind, path }) => {
      const result = generateStructureClaim({ root, kind, path });
      return textJson(result);
    },
  );

  server.registerTool(
    "vctx_verify_workspace",
    {
      description: "Verify all in-document VCC claims against current workspace.",
      inputSchema: {
        root: z.string(),
        in_path: z.string().optional(),
        text: z.string().optional(),
      },
    },
    async ({ root, in_path, text }) => {
      const result = await verifyWorkspace({ root, inPath: in_path, text });
      return textJson(result);
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
