import { describe, expect, it } from "vitest";
import { dialogue } from "../server/dialogue";
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
      async () => reply({ dialogue: "Still here." }),
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
});
