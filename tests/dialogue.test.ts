import { smallSession } from "./fixtures";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { dialogue } from "../server/dialogue";
import { strictSchema } from "../server/json-schema";
import { narrator } from "../server/narrator";
import { Runtime } from "../src/runtime/session";
import { resolveSetting } from "../src/content/geography/resolve";
import { commitDialogue, dialogueTurn, type DialogueLine, dialogueContext } from "../src/narrator/dialogue";
import { languageBrief, languageWindow } from "../src/content/history/languages";
import { sceneDigest, worldCard } from "../src/narrator/prompt";
import { outlookOf } from "../src/core/outlook";
import { beliefOf, beliefsFor } from "../src/content/beliefs";
import { infect } from "../src/core/health";
import { statsOf } from "../src/core/stats";

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
  it("grounds a practitioner's response in visible symptoms and actual supplies without revealing exposure", () => {
    const resolved = resolveSetting("Doctor in London 1980", "health-dialogue");
    if ("error" in resolved) throw Error(resolved.error);
    const e = smallSession(resolved.setting, "health-dialogue");
    const actor = e.state.actors[0];
    actor.role = "Doctor";
    actor.medicalStock = { antibiotic: 2, rehydration: 0 };
    const ail = infect(e.state, "cough", e.state.player, resolved.setting, e.state.clock, "secret-exposure", "air");
    e.state.ailments = [ail];
    const runtime = new Runtime(e, { cacheTerrain: false });
    try {
      expect(dialogueContext(runtime, actor)).toContain("Visible symptoms in the player: none");
      ail.since = e.state.clock - 86400;
      const context = dialogueContext(runtime, actor);
      expect(context).toContain("Visible symptoms in the player: cough, feverishness, tiredness");
      expect(context).toContain("2 antibiotic courses");
      expect(context).not.toMatch(/secret-exposure|mortality|disease-outcome/);
    } finally { runtime.dispose(); }
  });
  it("explains the selected line and its language without creating a new dialogue turn", async () => {
    let sent: Record<string, any> | undefined;
    const request = new Request("http://localhost/api/dialogue", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.70" },
      body: JSON.stringify({ user: "Setting: prehistoric Britain.\nOn their mind: food.", realLanguage: true, explain: { dialogue: "Come eat.", original: "An invented reconstruction." } }),
    });
    const response = await dialogue(request, { OPENAI_API_KEY: "test", OPENROUTER_API_KEY: "test" }, async (_url, init) => {
      sent = JSON.parse(String((init as RequestInit).body));
      return reply({ explanation: "The invitation reflects their concern with food. The language is hypothetical, because no local text survives." });
    });
    expect(await response.json()).toEqual({ explanation: "The invitation reflects their concern with food. The language is hypothetical, because no local text survives." });
    expect(sent?.model).toBe("anthropic/claude-haiku-5.5");
    expect(sent?.response_format.json_schema.name).toBe("npc_explanation");
    expect(sent?.messages[1].content).toContain("Original-language line (language unnamed): An invented reconstruction.");
  });
  it("limits one caller without touching another", async () => {
    const env = { OPENAI_API_KEY: "test", OPENROUTER_API_KEY: "test" };
    const model = async () => reply({ dialogue: "Good day.", regard: 1 });
    const codes: number[] = [];
    for (let i = 0; i < 25; i++)
      codes.push((await dialogue(post("203.0.113.9"), env, model)).status);
    expect(codes.filter((c) => c === 200)).toHaveLength(20);
    expect(codes.filter((c) => c === 429)).toHaveLength(5);
    expect((await dialogue(post("203.0.113.10"), env, model)).status).toBe(200);
  });
  it("passes the model's regard through and refuses an out-of-range one", async () => {
    const env = { OPENAI_API_KEY: "test", OPENROUTER_API_KEY: "test" };
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
    const env = { OPENAI_API_KEY: "test", OPENROUTER_API_KEY: "test" };
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
    const env = { OPENAI_API_KEY: "test", OPENROUTER_API_KEY: "test" };
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
      "trespass",
      "action",
      "dialogue",
      "language",
      "original",
      "leave",
      "ask",
      "trade",
      "favour",
      "receive",
    ]);
  });
  it("generates the English meaning before translating it in real language mode", async () => {
    let sent: Record<string, any> | undefined;
    const request = new Request("http://localhost/api/dialogue", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.71" },
      body: JSON.stringify({ user: "Setting: Paris, 1200 CE.", realLanguage: true }),
    });
    await dialogue(request, { OPENAI_API_KEY: "test", OPENROUTER_API_KEY: "test" }, async (_url, init) => {
      sent = JSON.parse(String((init as RequestInit).body));
      return reply({ dialogue: "Where are you going?", original: "Où vas-tu?", regard: 0 });
    });
    const properties = sent?.response_format.json_schema.schema.properties;
    expect(Object.keys(properties)).toEqual(["mood", "regard", "trespass", "action", "dialogue", "language", "original", "leave", "ask", "trade", "favour", "receive"]);
    expect(sent?.messages[0].content).toContain("translate that exact line");
    expect(sent?.reasoning).toEqual({ effort: "low" });
  });
  it("offers the mood as a nullable enum, which is what strict mode accepts", () => {
    // Anthropic rejects an enum typed ["string", "null"], so null travels
    // as a separate branch.
    const schema = strictSchema(
      z.object({ mood: z.enum(["angry", "happy"]).optional() }),
    );
    const mood = (schema.properties as Record<string, Record<string, unknown>>)
      .mood;
    expect(mood.anyOf).toEqual([
      { type: "string", enum: ["angry", "happy"] },
      { type: "null" },
    ]);
  });
});

describe("narrator endpoint", () => {
  it("grounds a syncretist's outlook separately from their religious practice", () => {
    const start = resolveSetting("knoxville 1790");
    if ("error" in start) throw Error(start.error);
    const e = smallSession(start.setting, "narrator-belief");
    const actor = structuredClone(e.state.player);
    for (let i = 0; i < 1000; i++) {
      actor.id = `syncretist-${i}`;
      if (outlookOf(e.state.manifest.seed, actor, start.setting).stances[0]?.id === "temper.syncretist") break;
    }
    expect(outlookOf(e.state.manifest.seed, actor, start.setting).stances[0]?.id).toBe("temper.syncretist");
    actor.name = "Rukmini";
    actor.role = "Servant";
    actor.pos = { ...e.state.player.pos };
    e.state.actors = [actor];
    e.state.player.relations = [{ other: actor.id, kind: "servant" }];
    const scene = sceneDigest(e, "who is Rukmini");
    const belief = beliefOf(e.state.manifest.seed, actor, beliefsFor(start.setting, actor.origin?.community));
    expect(scene).toContain("your servant");
    expect(scene).not.toContain("your master");
    expect(scene).toContain("Outlook: Honours whatever power seems to answer.");
    expect(scene).toContain(`Religious practice: ${belief.system.label}; ${belief.observance} observance`);
    if (belief.keeps) expect(scene).toContain(belief.keeps);
    expect(worldCard(e)).toContain("Outlook describes attitudes, not a religious affiliation");
    expect(worldCard(e)).toContain("Religious practice:");
  });
  const turn = (ip: string) =>
    new Request("http://localhost/api/narrator", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ provider: "openai", system: "s", user: "u" }),
    });
  it("limits a caller, and keeps its budget separate from dialogue's", async () => {
    const env = { OPENAI_API_KEY: "test", OPENROUTER_API_KEY: "test" };
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
      smallSession(start.setting, "dialogue-test"),
      { cacheTerrain: false },
    );
    const state = runtime.engine.state;
    const actor = state.actors.find((a) => a.kind === "human");
    if (!actor) throw Error("No one to speak with.");
    // Stand next to them; the intent is refused at a distance like any other.
    state.player.pos = { ...actor.pos };
    const trust = actor.trust;
    expect(dialogueContext(runtime, actor)).not.toContain("remembers you saying");
    // How they know the player comes from where both live, not from talk alone.
    expect(dialogueContext(runtime, actor)).toMatch(/family|Neighbours|friend|trade|knows everyone|around the quarter|Has not met/);

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
      smallSession(start.setting, "dialogue-test"),
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
      smallSession(start.setting, "dialogue-test"),
      { cacheTerrain: false },
    );
    const state = runtime.engine.state;
    const actor = state.actors.find((a) => a.kind === "human" && a.pos.space === "outside");
    if (!actor) throw Error("No one to speak with.");
    state.player.pos = { ...actor.pos, x: actor.pos.x - 1 };
    actor.trust = 3;
    runtime.narrate([
      { type: "converse", with: actor.id, said: "fuck your hoop", delta: -3, leave: "away" },
    ]);
    expect(actor.errand?.label).toBe("Walking it off");
    expect(actor.trust).toBe(-3);
    // The conversation holds them; they go once it is over.
    runtime.engine.advance(60);
    expect(actor.activity).toBe("Walking it off");
    expect(Math.hypot(actor.pos.x - state.player.pos.x, actor.pos.y - state.player.pos.y)).toBeGreaterThan(3);
  });
  it("remembers being bumped a moment ago", () => {
    const start = resolveSetting("knoxville 1790");
    if ("error" in start) throw Error(start.error);
    const runtime = new Runtime(
      smallSession(start.setting, "dialogue-test"),
      { cacheTerrain: false },
    );
    const state = runtime.engine.state;
    const actor = state.actors.find((a) => a.kind === "human" && a.householdId !== state.player.householdId);
    if (!actor) throw Error("No one to speak with.");
    state.player.pos = { ...actor.pos, x: actor.pos.x - 1 };
    runtime.command({ type: "move", dx: 1, dy: 0 });
    expect(dialogueContext(runtime, actor)).toContain("bumped into you");
  });
  it("resolves a deep-time language from coordinates, not the modern place name", () => {
    // Karaganda, 2269 BCE: once answered in modern Kazakh.
    expect(languageWindow(73.1, 49.8, -2269)?.id).toBe("kazakh-pre-sintashta");
    expect(languageBrief(73.1, 49.8, -2269)).toMatch(/^Language: best guess Post-Botai/);
    expect(languageWindow(73.1, 49.8, -13000)?.id).toBe("paleo-north-asia");
    expect(languageWindow(-100, 40, -13000)?.id).toBe("paleo-anywhere");
    expect(languageWindow(2.35, 48.85, 1200)?.id).toBe("medieval-romance");
    expect(languageWindow(-0.1, 51.5, 100)?.id).toBe("eu-roman-britain");
    expect(languageWindow(2.35, 48.85, 1850)).toBeUndefined();
    // One box for the subcontinent once gave Kerala Old Indo-Aryan.
    expect(languageWindow(76.3, 10, -1000)?.id).toBe("sa-peninsula-early");
    expect(languageWindow(72.4, 34.8, -1500)?.id).toBe("sa-proto-indo-aryan");
  });
});


function funeralConversation(trust: number) {
  const start = resolveSetting("Central India 813 BCE", "funeral-dialogue");
  if ("error" in start) throw Error(start.error);
  const runtime = new Runtime(smallSession(start.setting, "funeral-dialogue"), { cacheTerrain: false });
  const state = runtime.engine.state;
  const actor = state.actors.find((a) => a.householdId !== state.player.householdId)!;
  actor.name = "Shatrughna";
  if (actor.origin) actor.origin.sex = "male";
  if (actor.appearance?.physique) actor.appearance.physique.sex = "male";
  actor.trust = trust;
  actor.memories = ["spoke:0:We met here before."];
  state.player.pos = { ...actor.pos };
  actor.relations = (actor.relations ?? []).filter((r) => r.other !== state.player.id);
  if (trust > 0) actor.relations = [{ other: state.player.id, kind: "friend" }];
  state.plot = {
    id: "feast", title: "A Neighbour's Feast", wording: 2,
    words: { host: actor.name, hostRole: actor.role, why: "has buried a parent", occasion: "funeral feast", amount: "four measures of rice", due: "by sundown" },
    cast: { host: actor.id }, began: state.clock, deadline: state.clock + 14400,
    owed: 4, total: 4, fired: [],
  };
  return { runtime, actor };
}

describe("plot conversation", () => {
  it.each([5, 0, -5])("keeps obligations separate from relationship and acknowledgment (trust %s)", async (trust) => {
    const { runtime, actor } = funeralConversation(trust);
    let context = "";
    runtime.modelFetch = async (_url, init) => {
      context = JSON.parse(String(init?.body)).user;
      return new Response(JSON.stringify({ text: "Thank you.", regard: 0 }));
    };
    try {
      const history: DialogueLine[] = [
        { speaker: "npc", text: "Bring four measures of rice by sundown." },
        { speaker: "player", text: "Of course, I'll bring it." },
        { speaker: "npc", text: "Thank you.", action: "takes your hand" },
        ...Array.from({ length: 8 }, (): DialogueLine => ({ speaker: "player", text: "I'm here." })),
      ];
      await dialogueTurn(runtime, actor.id, "I'm sorry about your parents.", history);
      expect(context).toContain("After agreement, let the subject rest");
      expect(context).toContain("Of course, I'll bring it.");
      expect(context).toContain("[takes your hand]");
      expect(context).not.toContain("Hold to your demand");
      expect(context).toContain("answer that alone");
      expect(context).not.toContain("On their mind: is ");
      expect(context).not.toContain("audible fart");
      if (trust > 0) {
        expect(context).toContain("The player is a friend of yours.");
        expect(context).not.toContain("family: your friend");
      }
      if (trust < 0) {
        expect(context).toContain("hostile toward");
        expect(context).not.toContain("Talk to them as a friend");
      }
      runtime.engine.state.plot!.deadline = runtime.engine.state.clock + 1800;
      expect(dialogueContext(runtime, actor)).toContain("within an hour");
      await dialogueTurn(runtime, actor.id, "I'm staying.", Array.from({ length: 24 }, (): DialogueLine => ({ speaker: "player", text: "x".repeat(400) })));
      expect(context.length).toBeLessThanOrEqual(7000);
      expect(context).toContain("Player says: I'm staying.");
      runtime.engine.state.plot!.owed = 0;
      expect(dialogueContext(runtime, actor)).toContain("It has been paid");
    } finally { runtime.dispose(); }
  });

  it.skipIf(!process.env.DIALOGUE_LIVE)("compares live friend, neutral and enemy funeral conversations", async () => {
    const { loadEnv } = await import("vite");
    const { mkdir, writeFile } = await import("node:fs/promises");
    const env = { ...loadEnv("development", process.cwd(), ""), ...process.env };
    const results = [];
    for (const [relationship, trust] of [["friend", 5], ["neutral", 0], ["enemy", -5]] as const) {
      const { runtime, actor } = funeralConversation(trust);
      const history: DialogueLine[] = [];
      runtime.modelFetch = async (_url, init) => dialogue(new Request("http://localhost/api/dialogue", {
        ...init, headers: { "Content-Type": "application/json", "x-forwarded-for": `live-${relationship}` },
      }), env);
      try {
        for (const input of ["", "Of course, I'll bring the rice by sundown.", "I love you, man.", "I'm sorry about your mom and dad.", "Would you like me to stay with you for a while?", "Actually, I can't bring the rice."]) {
          const response = await dialogueTurn(runtime, actor.id, input, history);
          expect(response.error).toBeUndefined();
          if (input) history.push({ speaker: "player", text: input });
          history.push({ speaker: "npc", text: response.text, action: response.action });
          if (response.leave) break;
        }
        results.push({ relationship, trust, history });
      } finally { runtime.dispose(); }
    }
    await mkdir("artifacts/dialogue", { recursive: true });
    await writeFile(`artifacts/dialogue/funeral-comparison${process.env.DIALOGUE_RUN ? `-${process.env.DIALOGUE_RUN}` : ""}.json`, JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  }, 180000);
});


function houseConversation(profile: "friend" | "timid" | "aggressive") {
  const start = resolveSetting("London 1600", "trespass-dialogue");
  if ("error" in start) throw Error(start.error);
  const runtime = new Runtime(smallSession(start.setting, "trespass-dialogue"), { cacheTerrain: false });
  const e = runtime.engine, s = e.state;
  const actor = s.actors.find((a) => a.householdId !== s.player.householdId)!;
  const house = e.world.place(s.households!.find((h) => h.id === actor.householdId)!.residence!)!;
  house.owner = actor.id;
  house.access = "household";
  s.actors = [actor];
  actor.age = 34;
  actor.health = 100;
  actor.trust = profile === "friend" ? 5 : 0;
  actor.stats = { ...statsOf(s.manifest.seed, actor),
    extraversion: profile === "timid" ? 10 : 90,
    agreeableness: profile === "timid" ? 90 : 10,
    neuroticism: profile === "timid" ? 90 : 10,
  };
  actor.pos = { x: 3, y: 3, space: house.id };
  s.player.pos = { x: 4, y: 3, space: house.id };
  s.player.health = 100;
  s.permissions = {};
  s.plot = undefined;
  e.world.blocked = () => false;
  e.world.canCross = undefined;
  e.world.topography = undefined;
  e.conversing = actor.id;
  return { runtime, e, actor, house };
}

describe("provoked householders", () => {
  it.each(["friend", "timid", "aggressive"] as const)("escalates a %s householder's warning and explicit refusal during dialogue", async (profile) => {
    const { runtime, e, actor } = houseConversation(profile);
    try {
      runtime.modelFetch = async () => new Response(JSON.stringify({ text: "Leave my house.", regard: 0, trespass: "warned" }));
      const warning = await dialogueTurn(runtime, actor.id, "", []);
      commitDialogue(runtime, actor.id, "", warning);
      expect(e.trespassContext(actor)).toContain("ALREADY told");
      expect(actor.terror).toBeUndefined();
      runtime.modelFetch = async () => new Response(JSON.stringify({ text: "Get out of my house.", regard: -1, trespass: "refused" }));
      const response = await dialogueTurn(runtime, actor.id, "No, I'm staying.", []);
      expect(response.text).toBe("GET OUT OF MY HOUSE!!");
      expect(response.mood).toBe("angry");
      commitDialogue(runtime, actor.id, "No, I'm staying.", response);
      expect(actor.memories).toContain("The player stayed in my home after being told to leave");
      expect(response.ended).toBe(true);
      if (profile === "timid") {
        expect(actor.pos.space).toBe("outside");
        expect(actor.errand).toBeDefined();
        expect(e.state.complaints?.some((c) => c.by === actor.id)).toBe(true);
      } else {
        expect(actor.terror?.fight).toBe(true);
        expect(actor.activity).toMatch(/Threatening|Attacking/);
        expect(response.action).toBe("raises a hand, ready to strike");
        const before = e.state.player.health!;
        e.advance(120);
        expect(e.state.player.health).toBeLessThan(before);
      }
    } finally { runtime.dispose(); }
  });

  it("confronts and escalates lingering even while a conversation is open", () => {
    const { runtime, e, actor } = houseConversation("aggressive");
    try {
      e.advance(18);
      expect(e.confronting).toBe(actor.id);
      expect(e.trespassContext(actor)).toContain("ALREADY told");
      e.advance(96);
      expect(actor.terror?.fight).toBe(true);
    } finally { runtime.dispose(); }
  });

  it.each(["invited", "own", "public", "outside"])("does not escalate a %s visit", (kind) => {
    const { runtime, e, actor, house } = houseConversation("aggressive");
    try {
      if (kind === "invited") e.state.permissions[house.owner] = e.state.clock + 3600;
      if (kind === "own") e.state.player.householdId = actor.householdId;
      if (kind === "public") house.access = "public";
      if (kind === "outside") e.state.player.pos.space = actor.pos.space = "outside";
      e.trespassReply(actor, "refused");
      e.advance(120);
      expect(actor.terror).toBeUndefined();
      expect(actor.errand).toBeUndefined();
    } finally { runtime.dispose(); }
  });

  it("lets someone agree to go and actually leave without punishment", () => {
    const { runtime, e, actor } = houseConversation("aggressive");
    try {
      commitDialogue(runtime, actor.id, "", { text: "Get out!", trespass: "warned" });
      commitDialogue(runtime, actor.id, "All right, I'm going.", { text: "Go, then.", trespass: "leaving", regard: 0 });
      expect(actor.terror).toBeUndefined();
      e.state.player.pos.space = "outside";
      e.advance(120);
      expect(actor.terror).toBeUndefined();
      expect(e.confronting).toBeUndefined();
    } finally { runtime.dispose(); }
  });

  it.each(["friend", "timid", "aggressive"] as const)("makes a %s act on serious insults, including insults to family", async (profile) => {
    for (const said of ["Fuck you.", "Your mother is a worthless fool."]) {
      const { runtime, e, actor } = houseConversation(profile);
      try {
        e.state.player.pos.space = actor.pos.space = "outside";
        runtime.modelFetch = async () => new Response(JSON.stringify({ text: "Don't speak to me like that.", regard: -3 }));
        const response = await dialogueTurn(runtime, actor.id, said, []);
        expect(response.text).toBe("DON'T SPEAK TO ME LIKE THAT!!");
        commitDialogue(runtime, actor.id, said, response);
        expect(actor.trust).toBeLessThanOrEqual(-3);
        if (profile === "timid") expect(e.state.complaints?.some((c) => c.by === actor.id)).toBe(true);
        else expect(actor.terror?.fight).toBe(true);
      } finally { runtime.dispose(); }
    }
  });

  it.each(["friend", "timid", "aggressive"] as const)("makes a %s act on breaking a witnessed object", (profile) => {
    const { runtime, e, actor } = houseConversation(profile);
    try {
      e.state.player.pos.space = actor.pos.space = "outside";
      e.state.objects = [{ id: "test-pot", name: "Cooking pot", kind: "container", prop: "pot", sprite: "study-prop-earthen-pot-0", pos: { ...e.state.player.pos, y: 4 }, inventory: { grain: 2 }, owner: actor.id }];
      const result = e.execute({ type: "interact", target: "test-pot", action: "strike" });
      expect(e.state.objects[0].broken, String(result)).toBe(true);
      expect(actor.memories.some((m) => m.includes("test-pot"))).toBe(true);
      if (profile === "timid") expect(e.state.complaints?.some((c) => c.by === actor.id)).toBe(true);
      else expect(actor.terror?.fight).toBe(true);
    } finally { runtime.dispose(); }
  });

  it.each(["friend", "timid", "aggressive"] as const)("makes a %s act on witnessed theft", (profile) => {
    const { runtime, e, actor } = houseConversation(profile);
    try {
      e.state.player.pos.space = actor.pos.space = "outside";
      e.state.objects = [{ id: "test-store", name: "Household store", kind: "container", sprite: "chest", pos: { ...e.state.player.pos, y: 4 }, inventory: { bread: 2 }, owner: actor.id }];
      e.execute({ type: "interact", target: "test-store", action: "take" });
      expect(actor.memories.some((m) => m.includes("take test-store"))).toBe(true);
      if (profile === "timid") expect(e.state.complaints?.some((c) => c.by === actor.id)).toBe(true);
      else expect(actor.terror?.fight).toBe(true);
    } finally { runtime.dispose(); }
  });
});
