import { describe, expect, it } from "vitest";
import { z } from "zod";
import { dialogue } from "../server/dialogue";
import { strictSchema } from "../server/json-schema";
import { narrator } from "../server/narrator";
import { Runtime, createSettingSession } from "../src/runtime/session";
import { resolveSetting } from "../src/content/geography/resolve";
import { dialogueContext } from "../src/narrator/dialogue";

const reply = (body: unknown) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(body) } }],
    }),
    { status: 200 },
  );
const post = (ip: string) =>
  new Request("http://localhost/api/dialogue", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ user: "NPC: someone." }),
  });

describe("dialogue endpoint", () => {
  it("explains the selected line and its language without creating a new dialogue turn", async () => {
    let sent: Record<string, any> | undefined;
    const request = new Request("http://localhost/api/dialogue", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.70" },
      body: JSON.stringify({ user: "Setting: prehistoric Britain.\nOn their mind: food.", realLanguage: true, explain: { dialogue: "Come eat.", original: "An invented reconstruction." } }),
    });
    const response = await dialogue(request, { OPENAI_API_KEY: "test" }, async (_url, init) => {
      sent = JSON.parse(String((init as RequestInit).body));
      return reply({ explanation: "The invitation reflects their concern with food. The language is hypothetical, because no local text survives." });
    });
    expect(await response.json()).toEqual({ explanation: "The invitation reflects their concern with food. The language is hypothetical, because no local text survives." });
    expect(sent?.model).toBe("gpt-6-luna");
    expect(sent?.response_format.json_schema.name).toBe("npc_explanation");
    expect(sent?.messages[1].content).toContain("Original-language line: An invented reconstruction.");
  });
  it("limits one caller without touching another", async () => {
    const env = { OPENAI_API_KEY: "test" };
    const model = async () => reply({ dialogue: "Good day.", regard: 1 });
    const codes: number[] = [];
    for (let i = 0; i < 25; i++)
      codes.push((await dialogue(post("203.0.113.9"), env, model)).status);
    expect(codes.filter((c) => c === 200)).toHaveLength(20);
    expect(codes.filter((c) => c === 429)).toHaveLength(5);
    expect((await dialogue(post("203.0.113.10"), env, model)).status).toBe(200);
  });
  it("passes the model's regard through and refuses an out-of-range one", async () => {
    const env = { OPENAI_API_KEY: "test" };
    const warm = await dialogue(
      post("198.51.100.1"),
      env,
      async () => reply({ dialogue: "Sit with me.", regard: 1 }),
    );
    expect(await warm.json()).toMatchObject({ regard: 1 });
    const absurd = await dialogue(
      post("198.51.100.2"),
      env,
      async () => reply({ dialogue: "Sit with me.", regard: 99 }),
    );
    expect(absurd.status).toBe(502);
  });
  it("passes the face the NPC wears through, and refuses one it cannot draw", async () => {
    const env = { OPENAI_API_KEY: "test" };
    const cross = await dialogue(post("198.51.100.3"), env, async () =>
      reply({ dialogue: "Say that again.", regard: -1, mood: "angry" }),
    );
    expect(await cross.json()).toMatchObject({ mood: "angry", regard: -1 });
    // A line with no mood on it is a resting face, not an error.
    const quiet = await dialogue(post("198.51.100.4"), env, async () =>
      reply({ dialogue: "Mm.", regard: 0 }),
    );
    expect(await quiet.json()).not.toHaveProperty("mood");
    const invented = await dialogue(post("198.51.100.5"), env, async () =>
      reply({ dialogue: "Hm.", mood: "smouldering" }),
    );
    expect(invented.status).toBe(502);
  });
  it("asks for how the line is taken before the line itself", async () => {
    // Field order is generation order under strict mode, so the face and the
    // gauge arrive first. Streaming the text later depends on this holding.
    const env = { OPENAI_API_KEY: "test" };
    let sent: Record<string, unknown> | undefined;
    await dialogue(post("198.51.100.6"), env, async (_url, init) => {
      sent = JSON.parse(String((init as RequestInit).body));
      return reply({ dialogue: "Aye.", mood: "neutral" });
    });
    const schema = (
      sent as unknown as {
        response_format: { json_schema: { schema: { properties: object } } };
      }
    ).response_format.json_schema.schema.properties;
    expect(Object.keys(schema)).toEqual([
      "mood",
      "regard",
      "action",
      "original",
      "dialogue",
      "leave",
      "receive",
    ]);
  });
  it("offers the mood as a nullable enum, which is what strict mode accepts", () => {
    // Widening the type alone leaves null outside the permitted values and
    // the provider rejects the whole schema.
    const schema = strictSchema(
      z.object({ mood: z.enum(["angry", "happy"]).optional() }),
    );
    const mood = (schema.properties as Record<string, Record<string, unknown>>)
      .mood;
    expect(mood.type).toEqual(["string", "null"]);
    expect(mood.enum).toEqual(["angry", "happy", null]);
  });
});

describe("narrator endpoint", () => {
  const turn = (ip: string) =>
    new Request("http://localhost/api/narrator", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ provider: "openai", system: "s", user: "u" }),
    });
  it("limits a caller, and keeps its budget separate from dialogue's", async () => {
    const env = { OPENAI_API_KEY: "test" };
    const model = async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ narration: "x" }) } }],
        }),
        { status: 200 },
      );
    const codes: number[] = [];
    for (let i = 0; i < 15; i++)
      codes.push((await narrator(turn("192.0.2.5"), env, model)).status);
    expect(codes.filter((c) => c === 429)).toHaveLength(3);
    // Spending the narrator budget must not close dialogue to the same player.
    const chat = await dialogue(
      post("192.0.2.5"),
      env,
      async () => reply({ dialogue: "Still here.", regard: 0 }),
    );
    expect(chat.status).toBe(200);
  });
});

describe("a conversation leaves a trace", () => {
  it("records what was said on the person spoken to, and reads it back", () => {
    const start = resolveSetting("knoxville 1790");
    if ("error" in start) throw Error(start.error);
    const runtime = new Runtime(
      createSettingSession(start.setting, "dialogue-test"),
      { cacheTerrain: false },
    );
    const state = runtime.engine.state;
    const actor = state.actors.find((a) => a.kind === "human");
    if (!actor) throw Error("No one to speak with.");
    // Stand next to them; the intent is refused at a distance like any other.
    state.player.pos = { ...actor.pos };
    const trust = actor.trust;
    expect(dialogueContext(runtime, actor)).toContain("Has not spoken");

    runtime.narrate([
      { type: "converse", with: actor.id, said: "I asked about the ford", delta: 1 },
    ]);
    expect(actor.trust).toBe(trust + 1);
    expect(actor.memories.at(-1)).toContain("I asked about the ford");
    expect(dialogueContext(runtime, actor)).toContain("I asked about the ford");
  });
  it("refuses an exchange with someone out of reach", () => {
    const start = resolveSetting("knoxville 1790");
    if ("error" in start) throw Error(start.error);
    const runtime = new Runtime(
      createSettingSession(start.setting, "dialogue-test"),
      { cacheTerrain: false },
    );
    const state = runtime.engine.state;
    const actor = state.actors.find((a) => a.kind === "human");
    if (!actor) throw Error("No one to speak with.");
    state.player.pos = { ...actor.pos, x: actor.pos.x + 40 };
    const before = actor.memories.length;
    runtime.narrate([
      { type: "converse", with: actor.id, said: "shouted across town", delta: 2 },
    ]);
    expect(actor.memories).toHaveLength(before);
  });
  it("walks off when they have had enough", () => {
    const start = resolveSetting("knoxville 1790");
    if ("error" in start) throw Error(start.error);
    const runtime = new Runtime(
      createSettingSession(start.setting, "dialogue-test"),
      { cacheTerrain: false },
    );
    const state = runtime.engine.state;
    const actor = state.actors.find((a) => a.kind === "human" && a.pos.space === "outside");
    if (!actor) throw Error("No one to speak with.");
    state.player.pos = { ...actor.pos, x: actor.pos.x - 1 };
    runtime.narrate([
      { type: "converse", with: actor.id, said: "fuck your hoop", delta: -1, leave: "away" },
    ]);
    expect(actor.errand?.label).toBe("Walking it off");
    // The conversation holds them; they go once it is over.
    runtime.engine.advance(60);
    expect(actor.activity).toBe("Walking it off");
    expect(Math.hypot(actor.pos.x - state.player.pos.x, actor.pos.y - state.player.pos.y)).toBeGreaterThan(3);
  });
  it("remembers being bumped a moment ago", () => {
    const start = resolveSetting("knoxville 1790");
    if ("error" in start) throw Error(start.error);
    const runtime = new Runtime(
      createSettingSession(start.setting, "dialogue-test"),
      { cacheTerrain: false },
    );
    const state = runtime.engine.state;
    const actor = state.actors.find((a) => a.kind === "human");
    if (!actor) throw Error("No one to speak with.");
    state.player.pos = { ...actor.pos, x: actor.pos.x - 1 };
    runtime.command({ type: "move", dx: 1, dy: 0 });
    expect(dialogueContext(runtime, actor)).toContain("bumped into you");
  });
});
