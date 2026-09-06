import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { existsSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { createSession, restoreSession } from "../src/runtime/session";
import { PlayerAdapter, requestSchema } from "../src/agents/player";
const args = process.argv.slice(2);
const arg = (name: string) => {
  const i = args.indexOf(name);
  return i < 0 ? undefined : args[i + 1];
};
const path = arg("--save");
const engine =
  path && existsSync(path)
    ? restoreSession(JSON.parse(readFileSync(path, "utf8")))
    : createSession(arg("--pack") ?? "roman", arg("--seed"));
const player = new PlayerAdapter(engine);
const server = new McpServer({
  name: "universal-history-simulator",
  version: "0.1.0",
});
const text = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value) }],
});
server.registerTool(
  "observe",
  {
    description:
      "Observe only what this playable character can see, with local tile semantics and contextual actions. Costs no simulated time.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => text(player.observe()),
);
server.registerTool(
  "inspect",
  {
    description:
      "Inspect a visible target and its possible actions. Private inventories and unseen targets stay hidden.",
    inputSchema: { targetId: z.string() },
    annotations: { readOnlyHint: true },
  },
  async ({ targetId }) => text(player.inspect(targetId)),
);
server.registerTool(
  "act",
  {
    description:
      "Execute one validated player command with an action ID and expected revision. Movement and actions advance simulation time.",
    inputSchema: requestSchema.shape,
  },
  async (request) => {
    const result = player.act(request);
    if (path) {
      writeFileSync(path + ".tmp", JSON.stringify(engine.snapshot()));
      renameSync(path + ".tmp", path);
    }
    return text(result);
  },
);
await server.connect(new StdioServerTransport());
