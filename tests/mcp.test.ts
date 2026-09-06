import { it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
it("an actual MCP client observes, inspects, acts, and retries safely", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      "--import",
      "tsx",
      "scripts/mcp-server.ts",
      "--pack",
      "roman",
      "--seed",
      "mcp-check",
    ],
    cwd: process.cwd(),
    stderr: "pipe",
  });
  const client = new Client({ name: "uhs-test-client", version: "1.0" });
  try {
    await client.connect(transport);
    const listed = await client.listTools();
    expect(listed.tools.map((t) => t.name).sort()).toEqual([
      "act",
      "inspect",
      "observe",
    ]);
    const parse = (r: unknown) =>
      JSON.parse((r as { content: { text: string }[] }).content[0].text);
    const before = parse(
      await client.callTool({ name: "observe", arguments: {} }),
    );
    const input = {
      actionId: "mcp-once",
      expectedRevision: before.revision,
      command: { type: "wait", seconds: 60 },
    };
    const result = parse(
      await client.callTool({ name: "act", arguments: input }),
    );
    expect(result.status).toBe("completed");
    expect(result.observation.clock).toBe(before.clock + 60);
    const retry = parse(
      await client.callTool({ name: "act", arguments: input }),
    );
    expect(retry.revision).toBe(result.revision);
    expect(retry.observation.clock).toBe(result.observation.clock);
    const hidden = parse(
      await client.callTool({
        name: "inspect",
        arguments: { targetId: "s3-person-1" },
      }),
    );
    expect(hidden.error).toBeTruthy();
    const rejected = await client.callTool({
      name: "act",
      arguments: {
        ...input,
        actionId: "bad",
        command: { type: "transfer_everything" },
      },
    });
    expect(rejected.isError).toBe(true);
  } finally {
    await client.close();
  }
}, 15000);
