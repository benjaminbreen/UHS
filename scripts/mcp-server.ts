import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  appendFileSync,
} from "node:fs";
import { createSession, restoreSession } from "../src/runtime/session";
import {
  PlayerAdapter,
  gotoSchema,
  requestSchema,
} from "../src/agents/player";
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
const runs = arg("--chronicle") ?? "runs";
mkdirSync(runs, { recursive: true });
const stem = `${runs}/${player.chronicle.header.id}`;
/** Append as we go, so an interrupted run still leaves a readable record. */
const flush = () => {
  if (!existsSync(`${stem}.jsonl`))
    writeFileSync(`${stem}.jsonl`, player.chronicle.headerLine() + "\n");
  const pending = player.chronicle.drain();
  if (pending.length)
    appendFileSync(
      `${stem}.jsonl`,
      pending.map((t) => JSON.stringify(t)).join("\n") + "\n",
    );
  writeFileSync(`${stem}.md`, player.chronicle.markdown());
};
const save = () => {
  if (!path) return;
  writeFileSync(path + ".tmp", JSON.stringify(engine.snapshot()));
  renameSync(path + ".tmp", path);
};
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
  "digest",
  {
    description:
      "Read the scene as prose: the world, this character and what the people, things and buildings in reach allow. Cheaper than observe; prefer it. Costs no simulated time.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => ({ content: [{ type: "text" as const, text: player.digest() }] }),
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
  "goto",
  {
    description:
      "Walk to a visible person, object or entrance, by id or by x and y. One call covers the whole walk; use it instead of stepping. Advances simulated time and stops early if the way closes.",
    inputSchema: gotoSchema.shape,
  },
  async (request) => {
    const result = player.goto(request);
    flush();
    save();
    return text(result);
  },
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
    flush();
    save();
    return text(result);
  },
);
await server.connect(new StdioServerTransport());
