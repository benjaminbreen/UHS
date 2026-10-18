import { waterfrontFor } from "../src/content/settlements/waterfronts";
import { findPlace } from "../src/core/work-places";
import { route } from "../src/core/routing";
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

it("shows the world once and keeps thinking time out of the game clock", async () => {
  const a = await agent();
  const first = await a.call("look");
  expect(first).toContain("WORLD");
  expect(first).toContain("SCENE");
  expect(first).toContain("WAYS OUT");
  expect(first).not.toMatch(/Grounding|Item catalog|simulat/i);
  expect(await a.call("look")).not.toContain("WORLD");
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

it("acts through the runtime and records each call with its reasons", async () => {
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

it("crosses into the next map by a way out", async () => {
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

it("lets a model live through its turns and keep a diary", async () => {
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

it("serves MCP tools and replays a run from its recorded setting, rejecting changed state", async () => {
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

function localAgent(seed = "shared-dialogue") {
  const resolved = resolveSetting(setting, seed);
  if ("error" in resolved) throw Error(resolved.error);
  const runtime = new Runtime(smallSession(resolved.setting, seed), { cacheTerrain: false });
  const record = new RunRecord({ mode: "run" });
  return new Agent(runtime, record);
}

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
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ narration: "You pause to take it in.", intents: [], command: { type: "wait", seconds: 60 } }) } }] }));
    });
  };
  a.runtime.modelFetch = a.record.fetch("environment", send);
  try {
    const clock = a.engine.state.clock;
    const actual = await a.call("say", { text: "What sort of place is this?" });
    expect(actual).toContain("You pause to take it in.");
    expect(a.engine.state.clock).toBe(clock + 60);
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

import { institutionFor } from "../src/content/characters/workplace";
import { isVisitor } from "../src/world/v3/rail-travellers";
import { livelihoodById } from "../src/content/characters/livelihoods";

it.each(["Oaxaca 1650", "Kyoto 1700", "Manchester 1840", "Timbuktu 1550", "Rome 150"])(
  "grounds resident occupations in actual workplaces: %s", async query => {
    const a = await startAgent({ setting: query, seed: "local-work-review" }, new RunRecord({ mode: "run" }));
    try {
      const text = await a.call("look");
      expect(text).toContain("PLAYER");
      const e = a.engine;
      const schoolStaff = new Map<string, number>();
      let supported = 0;
      for (const person of [e.state.player, ...e.state.actors]) {
        if (person.kind !== "human" || person.role === "Child" || person.wayfarer || isVisitor(person.id)) continue;
        const site = e.world.activitySites?.(person.id);
        if (!site) continue; // Passers-by have their livelihood elsewhere.
        const kit = livelihoodById(person.origin?.specialty ?? person.origin?.livelihood ?? "");
        const kind = kit && institutionFor(kit);
        if (!kind) continue;
        expect(site.employment?.kind, `${query}: ${person.id} ${person.role}`).toBe(kind);
        expect(person.work, `${person.id} workplace`).toEqual({ ...site.work, space: "outside" });
        if (!["field", "pasture", "shore", "railway"].includes(kind))
          expect(e.world.places.some(p => p.id === site.employment!.id), site.employment!.label).toBe(true);
        if (kind === "school") schoolStaff.set(site.employment!.id, (schoolStaff.get(site.employment!.id) ?? 0) + 1);
        supported++;
      }
      expect(supported).toBeGreaterThan(0);
      for (const count of schoolStaff.values()) expect(count).toBeLessThanOrEqual(2);
      if (query === "Manchester 1840") {
        expect(e.world.places.some(p => p.landUse === "industrial")).toBe(true);
        expect(e.state.actors.some(p => e.world.activitySites?.(p.id)?.employment?.kind === "factory")).toBe(true);
      }
    } finally { a.runtime.dispose(); }
  }, 60000,
);

it.each([
  ["Miller in Rome 150",undefined,undefined,"mill",undefined],
  ["Miller in medieval Normandy 1350",undefined,undefined,"mill",undefined],
  ["London 1850",-5.23,50.23,"mine",undefined],
  ["Cusco 1650",-65.75,-19.58,"mine",undefined],
  ["Damascus 1250",undefined,undefined,"hospital",undefined],
  ["Tokyo 1800",undefined,undefined,"hospital",undefined],
  ["Rome 150",undefined,undefined,"fullery","Fuller"],
  ["Oaxaca 1650",undefined,undefined,"pottery","Potter"],
  ["Kyoto 1700",undefined,undefined,"pottery","Potter"],
  ["London 1650",undefined,undefined,"brickworks","Brickmaker"],
  ["London 1750",-1.8,53.2,"limeworks","Lime Burner"],
  ["London 1650",undefined,undefined,"dyehouse","Dyer"],
  ["London 1650",undefined,undefined,"tannery","Tanner"],
  ["London 1650",undefined,undefined,"fullery","Fuller"],
  ["London 1650",undefined,undefined,"boatyard","Boatwright"],
  ["London 1450",undefined,undefined,"boatyard","Boatwright"],
  ["Bergen 1500",undefined,undefined,"boatyard","Boatwright"],
  ["Bergen 1800",undefined,undefined,"boatyard","Boatwright"],
] as const)("builds reachable, staffed work compounds in %s (%s, %s), %s", async (query,lon,lat,kind,role) => {
  const resolved = resolveSetting(query,"local-work-review");
  if("error" in resolved) throw Error(resolved.error);
  const setting = lon === undefined ? {...resolved.setting,...(role ? {role,characterName:role} : {})} : {...resolved.setting,lon,lat:lat!,
    placeId:kind==="mine" && lon< -30 ? "review-potosi" : "review-redruth",
    location:kind==="limeworks" ? "Peak District" : lon< -30 ? "Potosí" : "Redruth",role:role ?? "Miner",characterName:role ?? "Miner"};
  const a = await startAgent({setting,seed:"local-work-review"},new RunRecord({mode:"run"}));
  try {
    const e=a.engine, workplace=e.world.activitySites?.("player")?.employment;
    const facilities=e.world.places.filter(p=>p.institution===kind && p.claim.startsWith("worksite-") && (!role || p.id===workplace?.id));
    expect(facilities.length).toBeGreaterThan(0);
    if(role) {
      expect(e.world.activitySites?.("player")?.employment?.kind).toBe(kind);
      expect(e.state.player.role).toBe(role);
    }
    for(const main of facilities) {
      if(kind==="boatyard") {
        const plan=(e.world as import("../src/world/v3/generate").SettlementWorld).planOf(main.id.split("-worksite-")[0])!;
        const launch=plan.launches![0],{origin,direction,water}=launch;
        const length=Math.abs(water.x-origin.x)+Math.abs(water.y-origin.y);
        for(let d=1;d<length;d++) {
          const from={x:origin.x+direction.x*(d-1),y:origin.y+direction.y*(d-1)};
          const to={x:origin.x+direction.x*d,y:origin.y+direction.y*d};
          expect(e.world.canCross?.(from,to),`launch step ${d}`).toBe(true);
          if(d>=launch.workingLength) expect(e.world.blocked(to.x,to.y,"outside"),`launch obstruction ${d}`).toBe(false);
        }
      }
      expect(e.world.places.some(p=>p.id===`${main.id}-store`)).toBe(true);
      expect(e.world.households?.some(h=>h.residence===main.id)).toBe(false);
      const staff=[e.state.player,...e.state.actors].filter(p=>e.world.activitySites?.(p.id)?.employment?.id===main.id);
      expect(staff.length).toBeGreaterThan(0);
      expect(staff.length).toBeLessThanOrEqual(main.workCapacity!);
      for(const worker of staff) {
        expect(worker.work).toEqual({...main.entrance,space:"outside"});
        const day=e.world.itinerary?.(worker.id);
        if(day) expect(day.segments.some(s=>s.placeId===main.id),worker.id).toBe(true);
      }
      const path=route(e.state.player.pos,main.entrance,(to,from)=>
        e.world.blocked(to.x,to.y,"outside") || !e.playerCanCross(from,to) ? Infinity : 1,
        {maxNodes:30000});
      expect(path.status,main.name).toBe("found");
      const room=e.interiorOf(main.id)!;
      expect(room).toBeDefined();
      if(kind==="hospital") expect(room.props.filter(p=>p.kind==="bed" || p.kind==="mat").length).toBeGreaterThanOrEqual(4);
    }
  } finally {a.runtime.dispose();}
},60000);


it("does not keep a requested processing profession when fresh water prevents its workplace", async () => {
  const a=await startAgent({setting:"Dyer in Kyoto 1700",seed:"local-work-review"},new RunRecord({mode:"run"}));
  try {
    expect(a.engine.world.places.some(p=>p.institution==="dyehouse")).toBe(false);
    expect(a.engine.state.player.role).not.toBe("Dyer");
    expect(a.engine.state.player.origin?.livelihood).not.toBe("dyer");
  } finally {a.runtime.dispose();}
},60000);

it.each(["Bergen 1500","Bergen 1700","London 1650","Tokyo 1800","Nile valley 2000 BCE"])("creates reachable fishing households in %s",async query=>{
  const a=await startAgent({setting:`Fisher in ${query}`,seed:"fishing-waterfront-review"},new RunRecord({mode:"run"}));
  try {
    const e=a.engine,home=e.world.places.find(p=>p.owner==="player" && p.claim==="waterfront-home");
    expect(home).toBeDefined();
    const plan=(e.world as import("../src/world/v3/generate").SettlementWorld).planOf(home!.id.split("-waterfront-")[0])!;
    expect(plan.waterfront!.members.length).toBeGreaterThanOrEqual(["Bergen 1500","Tokyo 1800"].includes(query) ? 1 : 2);
    expect(e.state.player.origin?.livelihood).toBe("fisher");
    const profile=waterfrontFor(e.world.pack.setting!)!;
    expect(plan.waterfront!.profile).toBe(profile.id);
    for(const member of plan.waterfront!.members) {
      expect(e.state.objects.find(o=>o.id===member.netsId)?.sprite).toBe(profile.nets);
      expect(e.state.objects.find(o=>o.id===member.catchId)?.sprite).toBe(profile.sorting);
      const household=e.world.households!.find(h=>h.members.includes(member.owner))!;
      expect(household.residence).toBe(member.homeId);
      expect(household.makes).toContain("fish");
      expect(household.storeId).toBe(member.catchId);
      const handling=member.handling!;
      expect(handling).toBeDefined();
      const neighbouringPlans=[...new Set(e.world.places.filter(p=>p.claim.startsWith("worksite-")).map(p=>p.id.split("-worksite-")[0]))]
        .filter(id=>id!==plan.site.id).map(id=>(e.world as import("../src/world/v3/generate").SettlementWorld).planOf(id)!);
      for(const other of neighbouringPlans)for(const launch of other?.launches??[]) {
        const a=handling.yard,b=launch.lane;
        expect(a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y,`${member.catchId} crosses ${other.site.id}'s launch`).toBe(false);
      }
      expect(e.state.objects.find(o=>o.id===handling.basketId)?.prop).toBe("basket");
      expect(Math.hypot(member.sorting.x-member.landing.x,member.sorting.y-member.landing.y)).toBeLessThan(22);
      const stations=plan.stations.get(member.owner)!;
      expect(stations.some(s=>s.placeId===member.gearId)).toBe(true);
      if(profile.practice) {
        expect(stations.some(s=>s.label===profile.practice!.prepare)).toBe(true);
        expect(stations.some(s=>s.label===profile.practice!.receive && s.activity===profile.practice!.landingActivity)).toBe(true);
        expect(stations.some(s=>s.label===profile.practice!.share)).toBe(true);
      }
      expect(stations.some(s=>s.activity==="haul" && s.carry?.startsWith("prop:basket@"))).toBe(true);
      if(member.owner!=="player") {
        const itinerary=e.world.itinerary?.(member.owner)!;
        const leg=itinerary.segments.find(s=>s.label===`Walking to the ${profile.practice?.catch.toLowerCase() ?? "catch-sorting table"}` && s.path?.length && s.carry?.startsWith("prop:basket@"));
        expect(leg).toBeDefined();
        const worker=e.state.actors.find(a=>a.id===member.owner)!;
        (e as any).followRoutine(worker,itinerary,(itinerary.start+(leg!.from+leg!.to)/2)*60);
        expect(worker.heldItem).toMatch(/^prop:basket@/);
        expect(worker.pos.space).toBe("outside");
      }
      const ask={state:e.state,world:e.world,household,day:1,client:()=>undefined,markets:true,inside:()=>undefined};
      expect(findPlace("shore",ask)?.pos).toEqual({...member.landing,space:"outside"});
      expect(findPlace("yard",ask)?.pos).toEqual({...member.sorting,space:"outside"});
      expect(e.world.activitySites?.(member.owner)?.employment?.id).toBe(member.boatId);
      expect(e.world.activitySites?.(member.owner)?.employment?.kind).toBe("fishery");
      const gear=e.world.places.find(p=>p.id===member.gearId)!;
      const residence=e.world.places.find(p=>p.id===member.homeId)!;
      for(const destination of [gear.entrance,member.landing,member.nets,member.sorting,handling.sale]) {
        expect(e.world.blocked(destination.x,destination.y,"outside"),JSON.stringify(destination)).toBe(false);
        expect(route(residence.entrance,destination,(to,from)=>e.world.blocked(to.x,to.y,"outside") || !e.playerCanCross(from,to) ? Infinity : 1,{maxNodes:30000}).status,JSON.stringify(destination)).toBe("found");
      }
      const room=e.interiorOf(gear.id)!;
      expect(room.props.some(p=>p.kind==="bed" || p.kind==="mat")).toBe(false);
      if(profile.gearInterior) {
        expect(room.params.wallPattern).toBe(profile.gearInterior.wall);
        expect(room.params.floorPattern).toBe(profile.gearInterior.floor);
        expect(room.params.door).toBe(profile.gearInterior.door);
      }
    }
    const member=plan.waterfront!.members.find(m=>m.owner==="player")!;
    expect(await a.call("goto",{...member.landing})).toMatch(/^ARRIVED/);
    expect(await a.call("goto",{target:member.catchId})).toMatch(/^ARRIVED/);
    expect(await a.call("inspect",{target:member.catchId})).toMatch(/fish/i);
    if(profile.revision===6) {
      process.stdout.write(`${query}: ${plan.waterfront!.members.length} fishing households; ${profile.id}; agent reached and inspected ${profile.practice!.catch.toLowerCase()}\n`);
      return;
    }
    const resolved=resolveSetting(`Fisher in ${query}`,"fishing-waterfront-review");
    if("error" in resolved)throw Error(resolved.error);
    const previous=await startAgent({setting:{...resolved.setting,worksiteRevision:4},seed:"fishing-waterfront-review"},new RunRecord({mode:"run"}));
    try {
      const oldHome=previous.engine.world.places.find(p=>p.owner==="player" && p.claim==="waterfront-home")!;
      const oldPlan=(previous.engine.world as import("../src/world/v3/generate").SettlementWorld).planOf(oldHome.id.split("-waterfront-")[0])!;
      const old=oldPlan.waterfront!.members.find(m=>m.owner==="player")!;
      expect(old.handling).toBeUndefined();
      const walk=(engine:typeof e,from:typeof member.landing,to:typeof member.sorting)=>
        route(from,to,(q,p)=>engine.world.blocked(q.x,q.y,"outside") || !engine.playerCanCross(p,q) ? Infinity : 1,{maxNodes:30000});
      const before=walk(previous.engine,old.landing,old.sorting),after=walk(e,member.landing,member.sorting);
      expect(before.status).toBe("found");
      expect(after.status).toBe("found");
      expect(after.path.length).toBeLessThan(before.path.length);
      process.stdout.write(`${query}: catch-carrying route ${before.path.length} → ${after.path.length} paces\n`);
    } finally {previous.runtime.dispose();}
  } finally {a.runtime.dispose();}
},60000);
