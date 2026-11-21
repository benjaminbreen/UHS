/**
 * An agent in a UHS world. See docs/AGENTS.md.
 *
 *   npm run agent:play -- [--setting ...] [--seed s] [--fast] [--record]
 *   npm run agent:serve -- [--setting "Clerk in Lagos, 1925"] [--seed s] [--time-travel] [--paid]
 *   npm run agent:run -- [--setting ...] [--days 3] [--model m] [--base-url url] [--paid] [--max-usd 1]
 *   npm run agent:batch -- experiment.json [--out runs] [--paid] [--max-usd 1]
 *
 * Offline by default. Paid LLM calls require --paid and are capped at $1.00 unless --max-usd is set.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { basename, dirname, resolve } from "node:path";
import { createInterface } from "node:readline";
import { z } from "zod";
import { availableTools, parsePlayLine, startAgent, tools, FRAMING, ASK_REASON, type Agent } from "../src/agents/agent";
import { BudgetExceededError, DEFAULT_MAX_USD, isLocalUrl, SpendBudget } from "../src/agents/budget";
import { RunRecord, type Entry, type Manifest } from "../src/agents/record";
import { live } from "../src/agents/loop";
import { anthropic, openaiCompatible } from "../src/agents/providers";
import { loadEnv } from "vite";
import { narrator } from "../server/narrator";
import { dialogue } from "../server/dialogue";
import { jevRoute } from "../server/jev";
import { craft } from "../server/craft";
import { runViewer } from "../src/agents/viewer";

const [mode, ...args] = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i < 0 ? undefined : args[i + 1];
};
const has = (name: string) => args.includes(name);
if (mode !== "serve" && mode !== "play" && mode !== "run" && mode !== "batch") {
  console.error("Usage: scripts/agent.ts serve|play|run|batch [options]; see docs/AGENTS.md.");
  process.exit(1);
}
if (has("--help")) {
  console.log(`See docs/AGENTS.md for options to agent:${mode}.`);
  if (mode === "play")
    console.log('Type a tool + JSON or shorthand per line (e.g. look, goto b1, enter b1, wait 600, talk p1 Hello). Type help for tools and quit to end.');
  process.exit(0);
}

const numberFlag = (name: string, min: number, max = Infinity, integer = false) => {
  const text = flag(name);
  if (text === undefined) return undefined;
  const value = Number(text);
  if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value)))
    throw Error(`Invalid ${name}: ${text}`);
  return value;
};

const outFlag = flag("--out");
const out = outFlag ?? "runs";
const paid = has("--paid") || process.env.UHS_ALLOW_PAID === "1";
const maxUsd = numberFlag("--max-usd", 0, 1000) ?? DEFAULT_MAX_USD;
// Let a killed server or interrupted run reach the exit handlers below.
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => process.exit(130));
const env: Record<string, string | undefined> = paid
  ? { ...loadEnv("development", process.cwd(), ""), ...process.env }
  : { ...process.env };

let cachedGame: { meta: { version: string; commit: string; sourceSha256: string }; patch: string; files: Record<string, string> } | undefined;
function gameMeta(captureSource = true) {
  if (cachedGame && (!captureSource || cachedGame.meta.commit !== "skipped")) return cachedGame;
  const version = JSON.parse(readFileSync("package.json", "utf8")).version;
  const files: Record<string, string> = {};
  let commit = captureSource ? "unknown" : "skipped", patch = "";
  if (captureSource) {
    try {
      commit = execFileSync("git", ["rev-parse", "HEAD"], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
      const paths = ["src", "server", "scripts", "package.json", "package-lock.json", "vite.config.ts", "tsconfig.json"];
      patch = execFileSync("git", ["diff", "--binary", "HEAD", "--", ...paths], { maxBuffer: 20 * 1024 * 1024 }).toString();
      for (const path of execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z", "--", ...paths]).toString().split("\0").filter(Boolean))
        files[path] = readFileSync(path, "utf8");
    } catch {
      // Not a checkout or diff exceeded buffer.
    }
  }
  const sourceSha256 = createHash("sha256").update(commit + JSON.stringify({ patch, files })).digest("hex");
  return (cachedGame = { meta: { version, commit, sourceSha256 }, patch, files });
}

function fileRecord(base: Partial<Manifest> & Pick<Manifest, "mode">, fixed?: string, persist = true) {
  if (!persist) {
    const record = new RunRecord({ ...base, game: gameMeta(false).meta });
    return { record, dir: () => "", finish: (_extra: Partial<Manifest>) => {} };
  }
  const source = gameMeta(true);
  let dir = "";
  const open = (r: RunRecord) => {
    if (dir) return;
    dir = fixed ?? `${out}/${r.manifest.id}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/manifest.json`, JSON.stringify(r.manifest, null, 2) + "\n");
    writeFileSync(`${dir}/source.patch`, source.patch);
    writeFileSync(`${dir}/source-files.json`, JSON.stringify(source.files));
  };
  // review.html embeds every prompt and reply so far; writing it on every call
  // grows with the square of the run. Once a minute, and when the run ends.
  let reviewed = 0;
  const render = (r: RunRecord, final = false) => {
    writeFileSync(`${dir}/chronicle.md`, r.chronicle());
    if (!final && Date.now() - reviewed < 60000) return;
    reviewed = Date.now();
    try {
      writeFileSync(`${dir}/review.html`, runViewer(r));
    } catch (error) {
      writeFileSync(`${dir}/review.html`, `<!doctype html><p>This run is too large to review here (${error}); its JSONL files are complete.</p>`);
    }
  };
  const close = () => {
    record.start({ metrics: record.metrics() });
    open(record);
    writeFileSync(`${dir}/manifest.json`, JSON.stringify(record.manifest, null, 2) + "\n");
    render(record, true);
  };
  const onExit = () => dir && close();
  process.on("exit", onExit);
  const record = new RunRecord(
    { environment: { narrator: env.UHS_NARRATOR_OPENAI_MODEL ?? "gpt-6-luna", dialogue: "gpt-6-luna", craft: "gpt-6-luna" }, ...base, game: source.meta },
    (entry, r) => {
      open(r);
      appendFileSync(`${dir}/trajectory.jsonl`, JSON.stringify(entry) + "\n");
      render(r);
    },
    (trace, r) => {
      open(r);
      appendFileSync(`${dir}/inferences.jsonl`, JSON.stringify(trace) + "\n");
    },
  );
  return {
    record,
    dir: () => dir,
    finish: (extra: Partial<Manifest>) => {
      record.start(extra);
      close();
      process.off("exit", onExit);
    },
  };
}

function environment(record: RunRecord, budget: SpendBudget): typeof fetch {
  const upstream = budget.wrap(record.fetch("environment-model", fetch));
  return async (url, init) => {
    const path = String(url);
    const route =
      path === "/api/narrator" ? narrator
      : path === "/api/dialogue" ? dialogue
      : path === "/api/jev" ? jevRoute
      : path === "/api/craft" ? craft
      : undefined;
    if (!route) throw Error(`Unknown game service: ${path}`);
    const headers = new Headers(init?.headers);
    if (env.UHS_NARRATOR_ACCESS_CODE) headers.set("X-Narrator-Code", env.UHS_NARRATOR_ACCESS_CODE);
    return route(new Request(`http://localhost${path}`, { ...init, headers }), env, upstream);
  };
}

const requirePaid = (why: string) => {
  throw Error(
    `${why} requires --paid (ask the user before spending API credits; default cap is $${DEFAULT_MAX_USD.toFixed(2)}, adjust with --max-usd). Use --base-url http://localhost:... for a local model or npm run agent:play for offline playtesting.`,
  );
};

const start = {
  setting: flag("--setting"),
  seed: flag("--seed"),
  timeTravel: has("--time-travel"),
  offline: has("--offline") || !paid,
  concern: has("--concern"),
  fast: has("--fast"),
};

const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const agentSchema = z.object({
  name: z.string().regex(/^[\w.-]+$/).default("agent"),
  model: z.string().optional(),
  baseUrl: z.string().url().optional(),
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  seed: z.number().int().nonnegative().optional(),
  structured: z.boolean().optional(),
}).strict();
const experimentSchema = z.object({
  name: z.string().regex(/^[\w.-]+$/),
  agents: z.array(agentSchema).min(1),
  settings: z.array(z.string().min(1)).min(1),
  seeds: z.array(z.string().regex(/^[\w.-]+$/)).min(1),
  days: z.number().int().positive().default(1),
  maxTurns: z.number().int().positive().optional(),
  /** A file, relative to the experiment file. */
  briefing: z.string().optional(),
  rationale: z.boolean().default(true),
  paid: z.boolean().default(false),
  offline: z.boolean().optional(),
  concern: z.boolean().default(false),
  timeTravel: z.boolean().default(false),
  /** Policy and environment spend cap; checked before every API call. */
  budget: z.object({ tokens: z.number().int().positive().optional(), usd: z.number().nonnegative().optional() }).strict().optional(),
}).strict();
type RunSpec = {
  agent: z.input<typeof agentSchema>;
  setting?: string; seed?: string; days: number; maxTurns?: number;
  briefing?: { file: string; text: string };
  rationale: boolean; offline: boolean; concern: boolean; timeTravel: boolean;
  paid: boolean; budget: SpendBudget;
  dir?: string; quiet?: boolean;
};

async function runOnce(spec: RunSpec) {
  const { baseUrl } = spec.agent;
  const remotePolicy = !baseUrl || !isLocalUrl(baseUrl);
  if ((remotePolicy || !spec.offline) && !spec.paid)
    requirePaid(remotePolicy ? "Running a remote policy model" : "Live narrator/dialogue calls");
  const modelName = spec.agent.model ?? (baseUrl ? "local-model" : "claude-sonnet-5-5");
  if (!baseUrl && !env.ANTHROPIC_API_KEY) throw Error("Set ANTHROPIC_API_KEY, or pass --base-url for an OpenAI-compatible model.");
  const settings = { maxTokens: spec.agent.maxTokens ?? 2048, temperature: spec.agent.temperature, topP: spec.agent.topP, seed: spec.agent.seed, structured: !!spec.agent.structured };
  if (!baseUrl && (settings.structured || settings.seed !== undefined)) throw Error("--structured and --model-seed need an OpenAI-compatible --base-url.");
  const file = fileRecord({
    mode: "run",
    ...(spec.offline ? { environment: null } : {}),
    model: { name: modelName, endpoint: baseUrl ?? "anthropic", ...settings },
    budget: { maxUsd: spec.budget.maxUsd },
    rationale: spec.rationale,
    briefing: spec.briefing ? { ...spec.briefing, sha256: sha(spec.briefing.text) } : null,
    memory: "current world/player facts, diary, last 8 turns",
    days: spec.days,
  }, spec.dir);
  const send = spec.budget.wrap(file.record.fetch("policy-model", fetch), modelName);
  const model = baseUrl
    ? openaiCompatible({ baseUrl, apiKey: env.OPENAI_API_KEY, model: modelName, ...settings, fetch: send })
    : anthropic({ apiKey: env.ANTHROPIC_API_KEY!, model: modelName, ...settings, fetch: send });
  const agent = await startAgent(
    { setting: spec.setting, seed: spec.seed, timeTravel: spec.timeTravel, offline: spec.offline, concern: spec.concern, modelFetch: environment(file.record, spec.budget) },
    file.record,
  );
  try {
    const result = await live(agent, model, {
      days: spec.days,
      maxTurns: spec.maxTurns,
      briefing: spec.briefing?.text,
      rationale: spec.rationale,
      onTurn: spec.quiet ? undefined : (line) => process.stderr.write(`${line}\n`),
    });
    file.finish({ result: { turns: result.turns, calls: result.calls, stopped: result.stopped }, endedAt: new Date().toISOString() });
    return { dir: file.dir(), result };
  } catch (error) {
    file.finish({ result: { error: String(error) }, endedAt: new Date().toISOString() });
    throw error;
  } finally {
    agent.runtime.dispose();
  }
}

if (mode === "serve") {
  const budget = new SpendBudget(maxUsd);
  const { record } = fileRecord({
    mode: "serve",
    ...(start.offline ? { environment: null } : { budget: { maxUsd } }),
  });
  let agent: Promise<Agent> | undefined;
  const instructions = `${FRAMING}\n\n${ASK_REASON} Give them in each call's rationale.`;
  record.start({ instructions });
  const server = new McpServer({ name: "world", version: String(gameMeta(false).meta.version) }, { instructions });
  // The host's own prompt and scaffolding are part of the agent being run.
  server.server.oninitialized = () => record.start({ host: server.server.getClientVersion() });
  for (const name of availableTools(start))
    server.registerTool(
      name,
      {
        description: tools[name].description,
        inputSchema: tools[name].input,
        annotations: { readOnlyHint: name === "look" || name === "inspect" },
      },
      async (input: unknown) => {
        agent ??= startAgent({ ...start, modelFetch: environment(record, budget) }, record);
        return { content: [{ type: "text" as const, text: await (await agent).call(name, input) }] };
      },
    );
  await server.connect(new StdioServerTransport());
} else if (mode === "play") {
  const persist = has("--record") || outFlag !== undefined;
  const file = fileRecord({ mode: "play", environment: null }, undefined, persist);
  const interactive = !!process.stdin.isTTY && !!process.stdout.isTTY;
  const reply = (result: Pick<Entry, "tool" | "status" | "text"> & Partial<Pick<Entry, "clock" | "after" | "hash">>) =>
    console.log(interactive ? result.text : JSON.stringify(result));
  let error: string | undefined;
  try {
    if (interactive) console.error('Preparing the world. Type "look" to see it, or "help" for tools.');
    const agent = await startAgent({ ...start, offline: true }, file.record);
    const lines = createInterface({ input: process.stdin, output: interactive ? process.stdout : undefined, terminal: interactive, crlfDelay: Infinity });
    try {
      if (interactive) lines.prompt();
      for await (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          if (interactive) lines.prompt();
          continue;
        }
        const first = trimmed.split(/\s+/, 1)[0];
        if (first === "quit" || first === "q") break;
        if (first === "help") {
          reply({
            tool: "help",
            status: "ok",
            text: [
              ...agent.names.map((name) => `${name}  ${tools[name].description}`),
              "Shorthands: l, inspect <id>, goto <id|x y>, enter|exit|open|close|pickup|take|drink|climb|strike|follow|attend <id>, wait [s], sleep [s], use|wear <item>, choose <card> <n>, talk <id> [text], errand <kind> [arg], travel <to>, time <year>.",
            ].join("\n"),
          });
        } else {
          const parsed = parsePlayLine(trimmed);
          if (parsed && "error" in parsed) {
            reply({ tool: first, status: "invalid", text: parsed.error });
          } else if (parsed) {
            const text = await agent.call(parsed.tool, parsed.input);
            const { status, clock, after, hash } = file.record.entries.at(-1)!;
            reply({ tool: parsed.tool, status, text, clock, after, hash });
          }
        }
        if (interactive) lines.prompt();
      }
    } finally {
      lines.close();
      agent.runtime.dispose();
    }
  } catch (failure) {
    error = failure instanceof Error ? failure.message : String(failure);
    console.error(error);
    process.exitCode = 1;
  }
  if (file.dir()) {
    file.finish({ result: error ? { error } : { calls: file.record.entries.length }, endedAt: new Date().toISOString() });
    console.error(`Playtest saved to ${file.dir()}`);
  }
} else if (mode === "run") {
  const briefingPath = flag("--briefing");
  const budget = new SpendBudget(maxUsd);
  const spec: RunSpec = {
    ...start,
    paid,
    budget,
    agent: {
      baseUrl: flag("--base-url"),
      model: flag("--model"),
      maxTokens: numberFlag("--max-tokens", 1, Infinity, true),
      temperature: numberFlag("--temperature", 0, 2),
      topP: numberFlag("--top-p", 0, 1),
      seed: numberFlag("--model-seed", 0, Infinity, true),
      structured: has("--structured"),
    },
    days: numberFlag("--days", 1, Infinity, true) ?? 1,
    maxTurns: numberFlag("--max-turns", 1, Infinity, true),
    briefing: briefingPath ? { file: basename(briefingPath), text: readFileSync(briefingPath, "utf8") } : undefined,
    rationale: !has("--no-rationale"),
  };
  for (let n = 0, repeat = numberFlag("--repeat", 1, Infinity, true) ?? 1; n < repeat; n++) {
    try {
      const { dir, result } = await runOnce(spec);
      console.log(`${dir} — ${result.turns} turns, stopped: ${result.stopped} ($${budget.spentUsd.toFixed(4)} / $${budget.maxUsd.toFixed(2)})`);
    } catch (error) {
      // vite-node exits 0 on an uncaught error; a batch script needs to see it.
      process.exitCode = 1;
      throw error;
    }
  }
} else {
  const path = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
  if (!path) throw Error("Usage: npm run agent:batch -- experiment.json [--out runs] [--paid] [--max-usd 1]");
  const spec = experimentSchema.parse(JSON.parse(readFileSync(path, "utf8")));
  const allowPaid = spec.paid || paid;
  if (allowPaid && !paid) Object.assign(env, { ...loadEnv("development", process.cwd(), ""), ...process.env });
  const offline = has("--offline") ? true : spec.offline ?? !allowPaid;
  const batchMaxUsd = numberFlag("--max-usd", 0, 1000) ?? spec.budget?.usd ?? DEFAULT_MAX_USD;
  const needsPaid = !offline || spec.agents.some((a) => !a.baseUrl || !isLocalUrl(a.baseUrl));
  if (needsPaid && !allowPaid)
    requirePaid("Running a paid experiment batch");
  const budget = new SpendBudget(batchMaxUsd);
  const root = `${out}/${spec.name}`;
  const briefing = spec.briefing ? { file: basename(spec.briefing), text: readFileSync(resolve(dirname(path), spec.briefing), "utf8") } : undefined;
  mkdirSync(root, { recursive: true });
  writeFileSync(`${root}/experiment.json`, JSON.stringify({ ...spec, offline, maxUsd: batchMaxUsd, briefing: briefing ? { ...briefing, sha256: sha(briefing.text) } : null, game: gameMeta(true).meta }, null, 2) + "\n");
  const cells = spec.agents.flatMap((agent) => spec.settings.flatMap((setting) => spec.seeds.map((seed) => ({ agent, setting, seed, dir: `${root}/${agent.name}__${setting.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}__${seed}` }))));
  const manifest = (dir: string): Manifest | undefined => existsSync(`${dir}/manifest.json`) ? JSON.parse(readFileSync(`${dir}/manifest.json`, "utf8")) : undefined;
  const spent = () => cells.reduce((n, c) => {
    const t = (manifest(c.dir)?.metrics as { tokens?: Record<string, { in: number; out: number }> } | undefined)?.tokens;
    return n + Object.values(t ?? {}).reduce((m, x) => m + x.in + x.out, 0);
  }, 0);
  const summarise = () => {
    const rows = cells.map((c) => ({ ...c, m: manifest(c.dir) })).map(({ agent, setting, seed, dir, m }) => {
      const result = m?.result as { error?: string; stopped?: string; turns?: number } | undefined;
      const x = m?.metrics as ReturnType<RunRecord["metrics"]> | undefined;
      const flags = [
        !m ? "not-run" : !result ? "unfinished" : "",
        result?.error ? "error" : "",
        result?.stopped?.startsWith("the model's replies") ? "unusable-replies" : "",
        x?.problems.providerErrors ? "provider-errors" : "",
        x?.problems.stuck ? "stuck" : "",
        x?.end?.dead ? "died" : "",
      ].filter(Boolean);
      return {
        run: basename(dir), agent: agent.name, setting, seed,
        valid: !!result && !result.error && !flags.includes("unusable-replies"),
        flags: flags.join(" "), stopped: result?.error ?? result?.stopped ?? "",
        turns: result?.turns ?? "", calls: x?.calls ?? "", freeCalls: x?.freeCalls ?? "", refused: x?.refused ?? "", gameHours: x?.gameHours ?? "",
        deeds: x ? Object.values(x.deeds).reduce((n, v) => n + v, 0) : "", takenFromOthers: x?.takenFromOthers ?? "", violence: x?.violence ?? "",
        verdicts: x ? Object.entries(x.verdicts).map(([k, v]) => `${k}=${v}`).join(" ") : "",
        tokensIn: x ? x.tokens.policy.in + x.tokens.environment.in : "", tokensOut: x ? x.tokens.policy.out + x.tokens.environment.out : "",
        costUsd: x?.costUsd ?? "",
      };
    });
    writeFileSync(`${root}/summary.json`, JSON.stringify(rows, null, 2) + "\n");
    const cell = (v: unknown) => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
    writeFileSync(`${root}/summary.csv`, [Object.keys(rows[0]), ...rows.map(Object.values)].map((r) => r.map(cell).join(",")).join("\n") + "\n");
  };
  let failed = 0;
  for (const [n, c] of cells.entries()) {
    const done = manifest(c.dir);
    if ((done?.result as { error?: string } | undefined) && !(done!.result as { error?: string }).error) continue;
    // An interrupted or failed run is kept beside its retry, never overwritten.
    if (existsSync(c.dir)) renameSync(c.dir, `${c.dir}.failed-${Date.now()}`);
    if (spec.budget?.tokens && spent() >= spec.budget.tokens) {
      console.log(`Budget of ${spec.budget.tokens} tokens reached; ${cells.length - n} not started.`);
      break;
    }
    if (budget.spentUsd >= budget.maxUsd) {
      console.log(`Budget of $${budget.maxUsd.toFixed(2)} reached ($${budget.spentUsd.toFixed(4)} spent); ${cells.length - n} not started.`);
      break;
    }
    console.log(`[${n + 1}/${cells.length}] ${basename(c.dir)}`);
    try {
      const { result } = await runOnce({ ...spec, offline, paid: allowPaid, budget, agent: c.agent, setting: c.setting, seed: c.seed, briefing, dir: c.dir, quiet: true });
      console.log(`  ${result.turns} turns, stopped: ${result.stopped} ($${budget.spentUsd.toFixed(4)} / $${budget.maxUsd.toFixed(2)})`);
    } catch (error) {
      failed++;
      console.log(`  failed: ${error instanceof Error ? error.message : error}`);
      if (error instanceof BudgetExceededError) break;
    }
    summarise();
  }
  summarise();
  console.log(`${root}/summary.csv — ${spent()} tokens, $${budget.spentUsd.toFixed(4)}`);
  if (failed) process.exitCode = 1;
}
