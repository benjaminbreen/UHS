/**
 * An agent in a UHS world. See docs/AGENTS.md.
 *
 *   npm run agent:serve -- [--setting "Clerk in Lagos, 1925"] [--seed s] [--time-travel]
 *   npm run agent:run -- [--setting ...] [--days 3] [--model m] [--base-url url] [--briefing file.md] [--repeat N]
 *
 * Every run writes runs/<id>/: manifest.json, trajectory.jsonl, chronicle.md.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { basename } from "node:path";
import { startAgent, tools, type Agent } from "../src/agents/agent";
import { RunRecord, type Manifest } from "../src/agents/record";
import { live } from "../src/agents/loop";
import { anthropic, openaiCompatible } from "../src/agents/providers";
import { loadEnv } from "vite";
import { narrator } from "../server/narrator";
import { dialogue } from "../server/dialogue";
import { jevRoute } from "../server/jev";
import { runViewer } from "../src/agents/viewer";

const [mode, ...args] = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i < 0 ? undefined : args[i + 1];
};
const has = (name: string) => args.includes(name);
if (mode !== "serve" && mode !== "run") {
  console.error("Usage: scripts/agent.ts serve|run [options]; see docs/AGENTS.md.");
  process.exit(1);
}

const out = flag("--out") ?? "runs";
const env = { ...loadEnv("development", process.cwd(), ""), ...process.env };
const source = { patch: "", files: {} as Record<string, string> };

const game = (() => {
  const version = JSON.parse(readFileSync("package.json", "utf8")).version;
  let commit = "unknown";
  try {
    commit = execFileSync("git", ["rev-parse", "HEAD"], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    const paths = ["src", "server", "scripts", "package.json", "package-lock.json", "vite.config.ts", "tsconfig.json"];
    source.patch = execFileSync("git", ["diff", "--binary", "HEAD", "--", ...paths], { maxBuffer: 20 * 1024 * 1024 }).toString();
    for (const path of execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z", "--", ...paths]).toString().split("\0").filter(Boolean))
      source.files[path] = readFileSync(path, "utf8");
  } catch {
    // Not a checkout.
  }
  return { version, commit, sourceSha256: createHash("sha256").update(commit + JSON.stringify(source)).digest("hex") };
})();

/** A record that writes itself to disk as it grows, so an interrupted run
 * still leaves something readable. */
function fileRecord(base: Partial<Manifest> & Pick<Manifest, "mode">) {
  let dir = "";
  const open = (r: RunRecord) => {
    if (dir) return;
    dir = `${out}/${r.manifest.id}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/manifest.json`, JSON.stringify(r.manifest, null, 2) + "\n");
    writeFileSync(`${dir}/source.patch`, source.patch);
    writeFileSync(`${dir}/source-files.json`, JSON.stringify(source.files));
  };
  const render = (r: RunRecord) => {
    writeFileSync(`${dir}/chronicle.md`, r.chronicle());
    writeFileSync(`${dir}/review.html`, runViewer(r));
  };
  const record = new RunRecord({ environment: { narrator: env.UHS_NARRATOR_OPENAI_MODEL ?? "gpt-6-luna", dialogue: "gpt-6-luna" }, ...base, game }, (entry, r) => {
    open(r);
    appendFileSync(`${dir}/trajectory.jsonl`, JSON.stringify(entry) + "\n");
    render(r);
  }, (trace, r) => {
    open(r);
    appendFileSync(`${dir}/inferences.jsonl`, JSON.stringify(trace) + "\n");
  });
  return { record, dir: () => dir, finish: (extra: Partial<Manifest>) => {
    record.start(extra);
    open(record);
    writeFileSync(`${dir}/manifest.json`, JSON.stringify(record.manifest, null, 2) + "\n");
    render(record);
  } };
}

function environment(record: RunRecord): typeof fetch {
  const upstream = record.fetch("environment-model", fetch);
  return async (url, init) => {
    const path = String(url);
    const route = path === "/api/narrator" ? narrator : path === "/api/dialogue" ? dialogue : path === "/api/jev" ? jevRoute : undefined;
    if (!route) throw Error(`Unknown game service: ${path}`);
    const headers = new Headers(init?.headers);
    if (env.UHS_NARRATOR_ACCESS_CODE) headers.set("X-Narrator-Code", env.UHS_NARRATOR_ACCESS_CODE);
    return route(new Request(`http://localhost${path}`, { ...init, headers }), env, upstream);
  };
}

const start = { setting: flag("--setting"), seed: flag("--seed"), timeTravel: has("--time-travel") };

if (mode === "serve") {
  const { record } = fileRecord({ mode: "serve" });
  const agent: Agent = await startAgent({ ...start, modelFetch: environment(record) }, record);
  const server = new McpServer({ name: "world", version: String(game.version) });
  for (const name of agent.names)
    server.registerTool(
      name,
      {
        description: tools[name].description,
        inputSchema: tools[name].input,
        annotations: { readOnlyHint: name === "look" || name === "inspect" },
      },
      async (input: unknown) => ({ content: [{ type: "text" as const, text: await agent.call(name, input) }] }),
    );
  await server.connect(new StdioServerTransport());
} else {
  const baseUrl = flag("--base-url");
  const modelName = flag("--model") ?? (baseUrl ? "local-model" : "claude-sonnet-5-5");
  if (!baseUrl && !env.ANTHROPIC_API_KEY)
    throw Error("Set ANTHROPIC_API_KEY, or pass --base-url for an OpenAI-compatible model.");
  const number = (name: string, min: number, max = Infinity, integer = false) => {
    const text = flag(name);
    if (text === undefined) return undefined;
    const value = Number(text);
    if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw Error(`Invalid ${name}: ${text}`);
    return value;
  };
  const settings = { maxTokens: number("--max-tokens", 1, Infinity, true) ?? 2048, temperature: number("--temperature", 0, 2), topP: number("--top-p", 0, 1), seed: number("--model-seed", 0, Infinity, true), structured: has("--structured") };
  if (!baseUrl && (settings.structured || settings.seed !== undefined)) throw Error("--structured and --model-seed need an OpenAI-compatible --base-url.");
  const briefingPath = flag("--briefing");
  const briefing = briefingPath ? readFileSync(briefingPath, "utf8") : undefined;
  const days = number("--days", 1, Infinity, true) ?? 1;
  for (let n = 0, repeat = number("--repeat", 1, Infinity, true) ?? 1; n < repeat; n++) {
    const file = fileRecord({
      mode: "run",
      model: { name: modelName, endpoint: baseUrl ?? "anthropic", ...settings },
      rationale: !has("--no-rationale"),
      briefing: briefing
        ? { file: basename(briefingPath!), sha256: createHash("sha256").update(briefing).digest("hex"), text: briefing }
        : null,
      memory: "current world/player facts, diary, last 8 turns",
      days,
    });
    const send = file.record.fetch("policy-model", fetch);
    const model = baseUrl
      ? openaiCompatible({ baseUrl, apiKey: env.OPENAI_API_KEY, model: modelName, ...settings, fetch: send })
      : anthropic({ apiKey: env.ANTHROPIC_API_KEY!, model: modelName, ...settings, fetch: send });
    const agent = await startAgent({ ...start, modelFetch: environment(file.record) }, file.record);
    try {
      const result = await live(agent, model, {
        days,
        maxTurns: number("--max-turns", 1, Infinity, true),
        briefing,
        rationale: !has("--no-rationale"),
        onTurn: (line) => process.stderr.write(`${line}\n`),
      });
      file.finish({ result: { turns: result.turns, calls: result.calls, stopped: result.stopped }, endedAt: new Date().toISOString() });
      console.log(`${file.dir()} — ${result.turns} turns, stopped: ${result.stopped}`);
    } catch (error) {
      file.finish({ result: { error: String(error) }, endedAt: new Date().toISOString() });
      throw error;
    } finally {
      agent.runtime.dispose();
    }
  }
}
