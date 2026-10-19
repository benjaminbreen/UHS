import { it, expect, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Agent, startAgent, tools } from "../src/agents/agent";
import { RunRecord, type Trace } from "../src/agents/record";
import { live, extractJson, instructions, type Complete } from "../src/agents/loop";
import { Runtime, createSession } from "../src/runtime/session";

import { smallSession } from "./fixtures";
import { resolveSetting } from "../src/content/geography/resolve";
import { narrator } from "../server/narrator";
import { dialogue } from "../server/dialogue";
import { dialogueTurn, commitDialogue } from "../src/narrator/dialogue";
import { openaiCompatible } from "../src/agents/providers";
import { runViewer } from "../src/agents/viewer";
import { z } from "zod";
import { infect } from "../src/core/health";

const setting = "Weaver in Oaxaca 1650";
// Connected worlds take seconds each; tests that use one run under FULL.
const agent = () => startAgent({ setting, seed: "agent-check" }, new RunRecord({ mode: "run" }));

it("shows symptoms and actionable care while keeping infection truth in research records", async () => {
  const resolved = resolveSetting(setting, "disease-agent");
  if ("error" in resolved) throw Error(resolved.error);
  const e = smallSession(resolved.setting, "disease-agent");
  e.state.ailments = [];
  delete e.state.plot;
  const ail = infect(e.state, "cough", e.state.player, resolved.setting, e.state.clock, "secret-contact-source", "air");
  e.state.ailments.push(ail);
  const runtime = new Runtime(e, { cacheTerrain: false }), record = new RunRecord({ mode: "run" }), a = new Agent(runtime, record);
  try {
    const silent = await a.call("look");
    expect(silent).not.toContain("secret-contact-source");
    expect(record.entries[0].state?.illnesses).toEqual([]);
    expect(record.entries[0].state?.researchHealth?.illnesses[0].infection?.source).toBe("secret-contact-source");
    e.state.clock = ail.since + 60;
    ail.infection!.mortality = 0;
    const seen = await a.call("look");
    expect(seen).toContain("cough, feverishness");
    expect(seen).toContain("treatment:ID");
    expect(seen).not.toMatch(/secret-contact-source|disease-outcome|mortality/);
    const result = await a.call("act", { command: { type: "care", target: "player", treatment: "rest" } });
    expect(result).toMatch(/^COMPLETED/);
    expect(record.entries.at(-1)?.state?.researchHealth?.events.some((x) => x.treatment === "rest")).toBe(true);
    expect(runViewer(record)).toContain("Research health (hidden from player)");
  } finally { runtime.dispose(); }
});

it.runIf(!!process.env.FULL)("shows the world once and keeps thinking time out of the game clock", async () => {
  const a = await agent();
  const first = await a.call("look");
  expect(first).toContain("WORLD");
  expect(first).toContain("SCENE");
  expect(first).toContain("WAYS OUT");
  expect(first).not.toMatch(/Grounding|Item catalog|simulat/i);
  expect(await a.call("look")).not.toContain("WORLD");
  expect(await a.call("look")).toMatch(/^Nothing has changed since you last looked/);
  const clock = a.engine.state.clock, pos = a.engine.state.player.pos;
  const now = vi.spyOn(performance, "now").mockReturnValue(performance.now() + 60000);
  try {
    await a.call("goto", { x: pos.x, y: pos.y });
    expect(a.engine.state.clock).toBe(clock);
  } finally {
    now.mockRestore();
    a.runtime.dispose();
  }
});

it.runIf(!!process.env.FULL)("acts through the runtime and records each call with its reasons", async () => {
  const a = await agent();
  const clock = a.engine.state.clock;
  const text = await a.call("act", { command: { type: "wait", seconds: 120 }, rationale: { intent: "Catch my breath" } });
  expect(text).toMatch(/^COMPLETED/);
  expect(a.engine.state.clock).toBe(clock + 120);
  expect(await a.call("act", { command: { type: "fly" } })).toMatch(/not usable/);
  expect(await a.call("goto", { target: "no-such-thing" })).toMatch(/cannot see/);
  expect(await a.call("time_travel", { year: 1700 })).toMatch(/no tool/);
  const entries = a.record.entries;
  expect(entries.map((e) => e.tool)).toEqual(["act", "act", "goto", "time_travel"]);
  expect(entries[0].rationale?.intent).toBe("Catch my breath");
  expect(a.record.chronicle()).toContain("Catch my breath");
});

it.runIf(!!process.env.FULL)("gives long ids short aliases and takes aliases or names back", async () => {
  const a = await agent();
  try {
    const seen = await a.call("look");
    expect(seen).not.toContain("~");
    const [, alias, name] = /- (b\d+) "([^"]+)"/.exec(seen)!;
    const described = await a.call("inspect", { target: alias });
    expect(described.startsWith(`${alias} "${name}"`)).toBe(true);
    expect(described).not.toContain("{\n");
    expect(await a.call("inspect", { target: `the ${name.toLowerCase()}` })).toBe(described);
    expect(a.record.entries.at(-1)!.input).not.toEqual({ target: alias });
  } finally { a.runtime.dispose(); }
}, 60000);

it.runIf(!!process.env.FULL)("tells a dead player who can go on in their place, and goes on as them", async () => {
  const a = await agent();
  try {
    const heir = a.engine.heirs()[0];
    expect(heir).toBeDefined();
    a.engine.state.player.dead = "a fever";
    const reply = await a.call("act", { command: { type: "wait", seconds: 60 } });
    expect(reply).toContain(`${heir.id}: ${heir.name}`);
    expect(await a.call("act", { command: { type: "become", heir: heir.id } })).toMatch(/^COMPLETED/);
    expect(a.engine.state.player.dead).toBeUndefined();
    expect(a.engine.state.player.name).toBe(heir.name);
  } finally { a.runtime.dispose(); }
}, 60000);

it.runIf(!!process.env.FULL)("draws the same random start from the same seed", async () => {
  const start = async () => {
    const a = await startAgent({ seed: "random-start-check" }, new RunRecord({ mode: "run" }));
    a.runtime.dispose();
    return a.record.manifest.setting;
  };
  expect(await start()).toEqual(await start());
}, 120000);

it.runIf(!!process.env.FULL)("crosses into the next map by a way out", async () => {
  const a = await agent();
  const before = a.engine;
  const playerFacts = (text: string) => text.split("\nPLAYER\n")[1]?.split("\n\nSCENE\n")[0];
  const original = playerFacts(await a.call("look"));
  const exit = a.runtime.journey!.entrances.find((e) => e.walkable && e.point)!;
  expect(await a.call("travel", { to: exit.id })).toMatch(/^ARRIVED/);
  expect(a.engine).not.toBe(before);
  expect(playerFacts(await a.call("look"))).toBe(original);
  a.runtime.dispose();
}, 60000);

it.runIf(!!process.env.FULL)("lets a model live through its turns and keep a diary", async () => {
  const a = await agent();
  const model: Complete = async (_system, messages) =>
    messages.at(-1)!.content.includes("Write a short diary entry")
      ? '{"diary":"A quiet morning."}'
      : '{"intent":"Wait a while","tool":"act","input":{"command":{"type":"wait","seconds":600}}}';
  const result = await live(a, model, { maxTurns: 3 });
  expect(result.turns).toBe(3);
  expect(result.diary).toEqual(["Day 1: A quiet morning."]);
  expect(a.record.entries.filter((e) => e.tool === "act")).toHaveLength(3);
});

it.runIf(!!process.env.FULL)("serves MCP tools and replays a run from its recorded setting, rejecting changed state", async () => {
  const out = mkdtempSync(join(tmpdir(), "uhs-agent-"));
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["vite-node", "scripts/agent.ts", "--", "serve", "--setting", setting, "--seed", "agent-check", "--out", out],
    cwd: process.cwd(),
    stderr: "pipe",
  });
  const client = new Client({ name: "uhs-test", version: "1.0" });
  try {
    await client.connect(transport);
    const names = (await client.listTools()).tools.map((t) => t.name).sort();
    expect(names).toEqual(["act", "errand", "goto", "inspect", "look", "say", "talk", "travel"]);
    await client.callTool({ name: "look", arguments: {} });
    await client.callTool({ name: "act", arguments: { command: { type: "wait", seconds: 60 } } });
    const [run] = readdirSync(out);
    const dir = join(out, run), manifestPath = join(dir, "manifest.json"), trajectoryPath = join(dir, "trajectory.jsonl");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    expect(manifest.setting.place).toBe("Oaxaca");
    expect(manifest.initialSetting).toBeDefined();
    delete manifest.setting.asked;
    writeFileSync(manifestPath, JSON.stringify(manifest));
    const entries = readFileSync(trajectoryPath, "utf8").trim().split("\n").map((line) => JSON.parse(line));
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.hash)).toBe(true);
    const replay = (input = dir) => execFileSync(process.execPath, ["node_modules/vite-node/vite-node.mjs", "scripts/replay.ts", "--", input], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    expect(replay()).toContain("Agent replay verified: 2 tool calls");
    entries[1].hash = "changed";
    writeFileSync(trajectoryPath, entries.map((e) => JSON.stringify(e)).join("\n") + "\n");
    expect(replay).toThrow(/Agent replay diverged at entry 2 \(act\): hash/);
    const browser = createSession("roman", "browser-replay-check");
    browser.act({ actionId: "wait", expectedRevision: browser.state.revision, command: { type: "wait", seconds: 60 } });
    const browserPath = join(out, "browser.json");
    writeFileSync(browserPath, JSON.stringify({ manifest: browser.state.manifest, commands: browser.state.log, hash: browser.hash() }));
    expect(replay(browserPath)).toContain("Replay verified:");
  } finally {
    await client.close();
    rmSync(out, { recursive: true, force: true });
  }
}, 60000);

function localAgent(seed = "shared-dialogue", options: { offline?: boolean } = {}) {
  const resolved = resolveSetting(setting, seed);
  if ("error" in resolved) throw Error(resolved.error);
  const runtime = new Runtime(smallSession(resolved.setting, seed), { cacheTerrain: false });
  const record = new RunRecord({ mode: "run" });
  return new Agent(runtime, record, options);
}

it("offline, people answer with the engine's own words and nothing is sent to a model", async () => {
  const a = localAgent("shared-dialogue", { offline: true });
  try {
    a.runtime.modelFetch = async () => { throw Error("No model may be called offline."); };
    expect(a.names).not.toContain("say");
    const actor = a.engine.state.actors.find((x) => x.kind === "human")!;
    const p = a.engine.state.player;
    actor.pos = { ...p.pos, x: p.pos.x + 1 };
    actor.home = actor.work = { ...actor.pos };
    const clock = a.engine.state.clock;
    expect(await a.call("talk", { target: actor.id, text: "Good morning" })).toMatch(/^COMPLETED/);
    expect(a.engine.state.clock).toBeGreaterThan(clock);
    expect(a.record.entries.at(-1)!.deeds).toEqual([expect.objectContaining({ kind: "talk", target: actor.id, targetKind: "person", ok: true, by: "agent" })]);
    expect(a.record.metrics().deeds).toEqual({ talk: 1 });
  } finally { a.runtime.dispose(); }
});

it("uses the human conversation prompts and effects, retaining the exchange until another action", async () => {
  const a = localAgent(), human = localAgent();
  const debug = vi.spyOn(console, "debug");
  const actor = a.engine.state.actors.find((x) => x.kind === "human")!;
  for (const r of [a.runtime, human.runtime]) {
    const p = r.engine.state.player;
    actor.pos = { ...p.pos, x: p.pos.x + 1 };
    const npc = r.engine.state.actors.find((x) => x.id === actor.id)!;
    npc.pos = { ...actor.pos };
    npc.home = npc.work = { ...actor.pos };
  }
  const requests: Record<string, any>[] = [];
  const send: typeof fetch = async (url, init) => {
    const body = JSON.parse(String(init?.body));
    requests.push(body);
    expect(url).toBe("/api/dialogue");
    return dialogue(new Request("http://localhost/api/dialogue", { ...init, headers: { "x-forwarded-for": "192.0.2.103" } }), { OPENAI_API_KEY: "test" }, async (_url, upstream) => {
      const sent = JSON.parse(String(upstream?.body));
      expect(sent.model).toBe("gpt-6-luna");
      expect(sent.messages[0].content).toContain("historical NPC");
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ dialogue: body.user.includes("Player says:") ? "I can show you." : "Come closer.", regard: 1 }) } }] }));
    });
  };
  a.runtime.modelFetch = a.record.fetch("environment", send);
  human.runtime.modelFetch = send;
  try {
    const clock = a.engine.state.clock;
    expect(await a.call("talk", { target: "missing", text: "Hello" })).toMatch(/^REJECTED/);
    expect(requests).toHaveLength(0);
    const actual = await a.call("talk", { target: actor.id, text: "Where can I work?" });
    expect(actual).toContain("Come closer.");
    expect(actual).toContain("I can show you.");
    human.runtime.beginDialogue(actor.id);
    human.engine.conversing = actor.id;
    const opening = await dialogueTurn(human.runtime, actor.id, "", []);
    commitDialogue(human.runtime, actor.id, "", opening);
    const history = [{ speaker: "npc" as const, text: opening.text }, { speaker: "player" as const, text: "Where can I work?" }];
    const answer = await dialogueTurn(human.runtime, actor.id, "Where can I work?", history);
    commitDialogue(human.runtime, actor.id, "Where can I work?", answer);
    human.engine.conversing = undefined;
    expect(debug).not.toHaveBeenCalled();
    expect(requests[0]).toEqual(requests[2]);
    expect(requests[1]).toEqual(requests[3]);
    expect(a.engine.hash()).toBe(human.engine.hash());
    expect(a.engine.state.clock).toBe(clock + 150);
    await a.call("look");
    await a.call("talk", { target: actor.id, text: "Thank you." });
    expect(requests.at(-1)?.user).toContain("Player: Where can I work?");
    expect(a.record.traces.some((t) => t.kind === "engine-command")).toBe(true);
    expect(z.object(tools.act.input).safeParse({ command: { type: "narrate", intents: [] } }).success).toBe(false);
  } finally { debug.mockRestore(); a.runtime.dispose(); human.runtime.dispose(); }
});

it("routes narrator questions through Runtime.say and reuses recorded environment replies", async () => {
  const a = localAgent("shared-narrator"), b = localAgent("shared-narrator");
  const send: typeof fetch = async (url, init) => {
    if (url === "/api/jev") return new Response("{}", { status: 503 });
    expect(url).toBe("/api/narrator");
    return narrator(new Request("http://localhost/api/narrator", { ...init, headers: { "x-forwarded-for": "192.0.2.104" } }), { OPENAI_API_KEY: "test" }, async (_url, upstream) => {
      const body = JSON.parse(String(upstream?.body));
      expect(body.model).toBe("gpt-6-luna");
      expect(body.messages[0].content).toContain("WORLD");
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ narration: "You pause to take it in.", intents: [], verdict: "allowed", command: { type: "wait", seconds: 60 } }) } }] }));
    });
  };
  a.runtime.modelFetch = a.record.fetch("environment", send);
  try {
    const clock = a.engine.state.clock;
    const actual = await a.call("say", { text: "What sort of place is this?" });
    expect(actual).toContain("You pause to take it in.");
    expect(a.engine.state.clock).toBe(clock + 60);
    expect(a.record.entries.at(-1)).toMatchObject({ verdict: "allowed" });
    const replies = a.record.traces.filter((t) => t.kind === "environment");
    let i = 0;
    b.runtime.modelFetch = async (url, init) => {
      const trace = replies[i++], request = trace.request as { url: string; body: string }, response = trace.response as { status: number; body: string };
      expect(String(url)).toBe(request.url);
      expect(String(init?.body)).toBe(request.body);
      return new Response(response.body, { status: response.status });
    };
    expect(await b.call("say", { text: "What sort of place is this?" })).toBe(actual);
    expect(b.engine.hash()).toBe(a.engine.hash());
    expect(i).toBe(2);
  } finally { a.runtime.dispose(); b.runtime.dispose(); }
});

it("records malformed replies, keeps world facts on later turns, and saves reasons before execution", async () => {
  const a = localAgent();
  let calls = 0;
  const model: Complete = async (system, messages) => {
    expect(system).toContain('"required":["text"]');
    expect(system).not.toContain('"const":"narrate"');
    expect(messages[0].content).toContain("PLAYER");
    if (messages[0].content.includes("Write a short diary entry")) return '{"diary":"A beginning."}';
    if (++calls === 1) return "malformed";
    expect(a.record.traces.some((t) => t.kind === "invalid-decision")).toBe(true);
    return '{"intent":"Look around","reasoning":"I want to find work","tool":"look"}';
  };
  try {
    const result = await live(a, model, { maxTurns: 2 });
    expect(result.turns).toBe(2);
    expect(a.record.entries[1].rationale?.reasoning).toBe("I want to find work");
    const decision = a.record.traces.findIndex((t) => t.kind === "repair"), action = a.record.traces.findIndex((t, i) => i > decision && t.kind === "action");
    expect(decision).toBeLessThan(action);
    expect(extractJson('<think>\n```json\n{"wrong":1}\n```\n</think> {"tool":"look"}')).toEqual({ tool: "look" });
    expect(instructions(a, undefined, false)).toContain("Do not include reasoning");
    const viewer = runViewer(a.record);
    expect(viewer).toContain("State before and after");
    a.record.trace({ kind: "test", response: "</script><img>" });
    expect(runViewer(a.record)).not.toContain("</script><img>");
  } finally { a.runtime.dispose(); }
});

it("preserves compatible-model reasoning, usage and inference settings without recording credentials", async () => {
  const record = new RunRecord({ mode: "run" });
  const upstream: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({ model: "qwen-test", max_tokens: 4096, temperature: 0.6, top_p: 0.9, seed: 7, response_format: { type: "json_schema" } });
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"intent":"See","tool":"look"}', reasoning_content: "A native reasoning trace" }, finish_reason: "stop" }], usage: { completion_tokens: 12 } }));
  };
  const model = openaiCompatible({ baseUrl: "http://localhost:8000/v1", apiKey: "secret", model: "qwen-test", maxTokens: 4096, temperature: 0.6, topP: 0.9, seed: 7, structured: true, fetch: record.fetch("policy-model", upstream) });
  expect(await model("Rules", [{ role: "user", content: "Look" }])).toContain('"tool":"look"');
  expect(JSON.stringify(record.traces)).not.toContain("secret");
  const trace = record.traces[0] as Trace;
  expect(JSON.stringify(trace.response)).toContain("A native reasoning trace");
  expect(JSON.stringify(trace.response)).toContain("completion_tokens");
});

it("waits out a rate limit instead of ending the run", async () => {
  let calls = 0;
  const upstream: typeof fetch = async () =>
    ++calls === 1
      ? new Response("busy", { status: 429, headers: { "retry-after": "1" } })
      : new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }] }));
  const model = openaiCompatible({ baseUrl: "http://localhost:8000/v1", model: "m", fetch: upstream });
  expect(await model("Rules", [{ role: "user", content: "Look" }])).toBe("{}");
  expect(calls).toBe(2);
});

it("serializes concurrent tool calls while a narrator reply is pending", async () => {
  const a = localAgent();
  let release!: () => void, began!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  const started = new Promise<void>((resolve) => { began = resolve; });
  const say = vi.spyOn(a.runtime, "say").mockImplementation(async () => {
    began();
    await pending;
    a.runtime.command({ type: "wait", seconds: 60 });
    return { text: "A moment passes.", outcomes: [] };
  });
  try {
    const clock = a.engine.state.clock;
    const question = a.call("say", { text: "What do I see?" });
    const action = a.call("act", { command: { type: "wait", seconds: 120 } });
    await started;
    expect(a.engine.state.clock).toBe(clock);
    expect(a.record.entries).toHaveLength(0);
    release();
    await Promise.all([question, action]);
    expect(a.record.entries.map((e) => [e.tool, e.clock, e.after])).toEqual([["say", clock, clock + 60], ["act", clock + 60, clock + 180]]);
  } finally { release(); say.mockRestore(); a.runtime.dispose(); }
});

it("shows a waiting card in the reply that raised it", async () => {
  const a = localAgent();
  try {
    a.engine.cards.push({ title: "A neighbour calls", text: "She needs a hand.", choose: { card: "neighbour", choices: [{ index: 1, label: "Help" }] } } as never);
    const reply = await a.call("act", { command: { type: "wait", seconds: 60 } });
    expect(reply).toContain("WAITING FOR YOUR ANSWER");
    expect(reply).toContain("1. Help");
    await a.call("look");
    expect(a.record.metrics()).toMatchObject({ calls: 2, freeCalls: 1, refused: 0, tools: { act: 1, look: 1 } });
  } finally { a.runtime.dispose(); }
});

it("lets the agent ask the narrator about a pending encounter without bypassing its choice", async () => {
  const a = localAgent();
  a.engine.state.encounter = { card: "roadside-robbery", at: { ...a.engine.state.player.pos }, clock: a.engine.state.clock };
  let asked = false;
  a.runtime.modelFetch = async (url) => {
    if (url === "/api/jev") return new Response("{}", { status: 503 });
    asked = true;
    return new Response(JSON.stringify({ text: JSON.stringify({ narration: "They are watching you. Running would be risky.", intents: [] }) }));
  };
  const clock = a.engine.state.clock;
  try {
    expect(await a.call("say", { text: "What do I see the robbers doing?" })).toContain("Running would be risky");
    expect(asked).toBe(true);
    expect(a.engine.state.encounter?.card).toBe("roadside-robbery");
    expect(a.engine.state.clock).toBe(clock);
    expect(await a.call("act", { command: { type: "sleep", seconds: 3600 } })).toContain("Answer the encounter");
  } finally { a.runtime.dispose(); }
});
