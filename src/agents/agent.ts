import { bodyState, healthResearch } from "../core/health";
import { z } from "zod";
import type { Engine } from "../core/engine";
import type { CommandResult, Inspection } from "../core/types";
import { TimeTravel } from "../core/time/travel";
import { playerCommandSchema, commandSchema } from "../runtime/schema";
import { Runtime } from "../runtime/session";
import { planOf } from "../runtime/autopilot";
import { prepareConnectedStart } from "../runtime/map-travel";
import { releaseTerrainWorker } from "../runtime/terrain-worker-owner";
import { resolveSetting } from "../content/geography/resolve";
import type { WorldSetting } from "../content/geography/types";
import { randomStart, randomStartFromDraws } from "../content/geography/random-start";
import { hash } from "../core/random";
import { worldFacts, sceneDigest, compass } from "../narrator/prompt";
import { dialogueTurn, commitDialogue, type DialogueLine } from "../narrator/dialogue";
import { trimScene } from "../chronicle/chronicle";
import { RunRecord, type Rationale } from "./record";

/** Bumped when a tool's name, input or meaning changes. */
export const PROTOCOL = 6;

const rationale = z
  .object({
    intent: z.string().max(200).optional(),
    reasoning: z.string().max(2000).optional(),
    expectation: z.string().max(400).optional(),
  })
  .strict()
  .optional()
  .describe("Why you are doing this. Recorded; it changes nothing in the world.");

/** Every tool an agent has. MCP and the built-in loop both read this list. */
export const tools = {
  look: {
    description:
      "See where you are: the time, your state, who and what is in reach and what each allows, anything waiting for your answer, and the ways out. Takes no time.",
    input: { rationale },
  },
  inspect: {
    description: "Look closely at one person, thing or building from the scene. Takes no time.",
    input: { target: z.string().describe("An id or name from the scene."), rationale },
  },
  goto: {
    description:
      "Walk to a person, thing or building by id, or to x and y. One call covers the whole walk.",
    input: {
      target: z.string().optional(),
      x: z.number().int().optional(),
      y: z.number().int().optional(),
      rationale,
    },
  },
  act: {
    description:
      "Do one thing. Most often {type:'interact', target, action} with an action listed in [brackets] beside that id; also trade, give, {type:'use', item:foodId} to eat, wear, wait, {type:'sleep', seconds:28800} to sleep eight hours, {type:'care', target:'player' or patientId, treatment:ID} using a listed care option, {type:'choose', card, choice} to answer something waiting for you, and {type:'become', heir} to go on as one of your household after death.",
    input: { command: playerCommandSchema, rationale },
  },
  say: {
    description: "Ask the narrator a question, or describe what you want to attempt, using the same narration panel as a person playing. The narrator decides what happens; attempts may take time.",
    input: { text: z.string().trim().min(1).max(600), rationale },
  },
  talk: {
    description: "Speak freely to any human NPC in reach, by id. Omit text to hear their opening line. Send text to speak or answer; the conversation continues until you do something else. They may refuse, ask favours, trade, or leave.",
    input: { target: z.string(), text: z.string().trim().max(400).optional(), rationale },
  },
  errand: {
    description:
      "Set about something that takes a while and carry on until it is done or something needs you: 'workday' (the day's work), 'forage' (optionally for an item), 'seek' (a person by id or name), 'go' (a building by id, or a direction), 'roam'.",
    input: {
      kind: z.enum(["workday", "forage", "seek", "go", "roam"]),
      target: z.string().optional(),
      item: z.string().optional(),
      direction: z.enum(["north", "south", "east", "west"]).optional(),
      rationale,
    },
  },
  travel: {
    description:
      "Leave this place. Give a way out from look to cross into the next country on foot, or the name of a distant place to make the whole journey; the days on the road pass.",
    input: { to: z.string(), rationale },
  },
  time_travel: {
    description: "Move to another year in this place's history, as a relative of your line.",
    input: { year: z.number().int(), rationale },
  },
} as const;
export type ToolName = keyof typeof tools;

export type StartOptions = {
  /** A place and year in plain words. Omitted, the start is random. */
  setting?: string | WorldSetting;
  seed?: string;
  timeTravel?: boolean;
  /** No narrator or dialogue model: people speak only the engine's own lines. */
  offline?: boolean;
  modelFetch?: typeof fetch;
};

/** One person in one world, driven by tool calls. It plays through the same
 * `Runtime` the browser drives, so it keeps the same rules. */
export class Agent {
  private serial = 0;
  private pending = Promise.resolve();
  private seenWorld = "";
  /** Cards still waiting for an answer, by card id. */
  private open = new Map<string, string>();
  private news: string[] = [];
  private lastLook = "";
  /** Scene ids run to forty characters; the agent sees and types short ones. */
  private short = new Map<string, { alias: string; name?: string }>();
  private long = new Map<string, string>();
  private conversation?: { engine: Engine; actorId: string; history: DialogueLine[]; situation: string; left: boolean };
  readonly names: ToolName[];

  constructor(
    readonly runtime: Runtime,
    readonly record: RunRecord,
    private options: { timeTravel?: boolean; offline?: boolean } = {},
  ) {
    // Model thinking time must not become unrecorded simulation time.
    runtime.ambientRate = 0;
    const onRecord = runtime.onRecord;
    runtime.onRecord = (kind, data) => {
      onRecord?.(kind, data);
      record.trace({ kind: `engine-${kind}`, response: { ...data, clock: runtime.engine.state.clock, state: this.state() } });
    };
    this.names = (Object.keys(tools) as ToolName[]).filter(
      (n) => (n !== "time_travel" || options.timeTravel) && (n !== "say" || !options.offline),
    );
  }

  get engine(): Engine {
    return this.runtime.engine;
  }

  /** Runs one tool by name, checks its input, and records the call. */
  call(name: string, input: unknown = {}): Promise<string> {
    const result = this.pending.then(() => this.execute(name, input));
    this.pending = result.then(() => {}, () => {});
    return result;
  }

  private async execute(name: string, input: unknown): Promise<string> {
    const clock = this.engine.state.clock, beforeState = this.state();
    this.record.trace({ kind: "action", request: { tool: name, input } });
    const tool = this.names.includes(name as ToolName) ? tools[name as ToolName] : undefined;
    const parsed = tool ? z.object(tool.input).strict().safeParse(this.resolve(input ?? {})) : undefined;
    const args = parsed?.success ? parsed.data as Record<string, unknown> & { rationale?: Rationale } : undefined;
    let out;
    if (!tool) out = { status: "invalid", text: `There is no tool called ${name}.` };
    else if (!parsed?.success) out = { status: "invalid", text: `That input is not usable: ${parsed?.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}.` };
    else if (this.engine.state.encounter && name !== "look" && name !== "inspect" && name !== "say" && !(name === "act" && (args?.command as { type?: string; card?: string })?.type === "choose"))
      out = this.outcome("interrupted", ["Answer the encounter before doing anything else."]);
    else {
      if (name !== "talk" && name !== "look" && name !== "inspect") this.conversation = undefined;
      out = await this.run(name as ToolName, args!);
    }
    out.text = this.abbreviate(out.text);
    this.record.entry({
      tool: name,
      input: args ? Object.fromEntries(Object.entries(args).filter(([k]) => k !== "rationale")) : input,
      rationale: args?.rationale,
      status: out.status,
      text: out.text,
      clock,
      beforeState,
      state: this.state(),
      after: this.engine.state.clock,
      hash: this.engine.hash(),
      place: this.engine.world.pack.setting?.location ?? this.engine.world.pack.name,
      year: this.engine.world.pack.setting?.year,
    });
    return out.text;
  }

  private state() {
    const p = this.engine.state.player;
    return { ...bodyState(this.engine.state, this.engine.world.pack.setting), pos: { ...p.pos }, inventory: { ...p.inventory }, dead: p.dead, danger: this.engine.danger(), researchHealth: healthResearch(this.engine.state) };
  }

  context() {
    return this.abbreviate(worldFacts(this.engine))
      .replace(/\nGrounding:\n(?:- .*\n?)*/, "\n")
      .replace(/\n*Item catalog ids: .*$/, "");
  }

  private async run(name: ToolName, a: Record<string, any>): Promise<{ status: string; text: string }> {
    switch (name) {
      case "look":
        return { status: "seen", text: this.look() };
      case "inspect": {
        const seen = this.engine.inspect(a.target);
        return seen
          ? { status: "seen", text: this.describe(seen) }
          : { status: "unknown", text: "You cannot see that from here." };
      }
      case "goto":
        return this.goto(a.target, a.x, a.y);
      case "act":
        return a.command.type === "interact" && a.command.action === "talk" && !this.options.offline ? this.talk(a.command.target, "") : this.act(a.command);
      case "say": {
        const turn = await this.runtime.say(a.text);
        const events = this.runtime.running ? await this.drive() : undefined;
        await this.settle();
        return this.outcome(turn.error ? "unavailable" : events?.interrupted ? "interrupted" : "completed", [turn.text, ...turn.outcomes, turn.error ?? "", ...(events?.lines ?? [])]);
      }
      case "talk":
        return this.options.offline ? this.act({ type: "interact", target: a.target, action: "talk" }) : this.talk(a.target, a.text ?? "");
      case "errand":
        return this.errand(a as { kind: string });
      case "travel":
        return this.travel(a.to);
      case "time_travel":
        return this.timeTravel(a.year);
    }
  }

  look(): string {
    this.collectCards();
    const s = this.engine.state;
    const world = this.context();
    const key = `${this.engine.world.pack.name}|${this.engine.world.pack.setting?.year}|${s.player.name}`;
    const parts: string[] = [];
    if (key !== this.seenWorld) {
      this.seenWorld = key;
      parts.push(world);
    }
    if (s.player.dead) parts.push(this.death());
    parts.push(this.scene());
    if (this.news.length) parts.push(`SINCE YOU LAST LOOKED\n${this.news.splice(0).join("\n")}`);
    if (this.open.size) parts.push(this.waiting());
    const exits = this.runtime.journey?.entrances.filter((e) => e.walkable && e.point) ?? [];
    if (exits.length)
      parts.push(
        `WAYS OUT\n${exits
          .map((e) => {
            const exit = this.runtime.journey!.exits.find((x) => x.id === e.id);
            return `- ${e.id}: toward ${exit?.name ?? e.to}, ${e.bearing}`;
          })
          .join("\n")}`,
      );
    const text = parts.join("\n\n");
    // Looking is free, so a model can look again and again at an unchanged scene.
    const same = text === this.lastLook;
    this.lastLook = text;
    return same ? `Nothing has changed since you last looked.\n\n${text}` : text;
  }

  /** Replaces every long id in the text with its short alias, learning the
   * names the scene gives them along the way. */
  private abbreviate(text: string) {
    // Way-out ids hold commas, so they are swapped whole before the general pattern.
    for (const e of this.runtime.journey?.entrances ?? [])
      if (text.includes(e.id)) text = text.split(e.id).join(this.alias(e.id, "w", text));
    return text.replace(/[\w:.-]*~[\w:.~-]*\w/g, (id) => {
      const s = this.engine.state;
      return this.alias(id, s.actors.some((a) => a.id === id) ? "p" : this.engine.world.places.some((p) => p.id === id) ? "b" : "t", text);
    });
  }

  private alias(id: string, kind: string, text: string) {
    let known = this.short.get(id);
    if (!known) {
      let n = 1;
      while (this.long.has(`${kind}${n}`)) n++;
      known = { alias: `${kind}${n}` };
      this.short.set(id, known);
      this.long.set(known.alias, id);
    }
    const named = new RegExp(`${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} "([^"]+)"`).exec(text);
    if (named) known.name = named[1];
    return known.alias;
  }

  /** Aliases back to ids, and a plain name ("the well") to the one thing that
   * goes by it. Spoken text is left alone. */
  private resolve(value: unknown, key = ""): unknown {
    if (typeof value === "string") {
      if (key === "text") return value;
      const id = this.long.get(value);
      if (id) return id;
      if (!["target", "heir"].includes(key) || this.engine.inspect(value)) return value;
      const plain = (t: string) => t.toLowerCase().replace(/^(the|my|a|an) /, "").trim();
      const wanted = plain(value);
      const matches = [...this.short].filter(([, k]) => k.name && plain(k.name) === wanted);
      return matches.length === 1 ? matches[0][0] : value;
    }
    if (Array.isArray(value)) return value.map((v) => this.resolve(v, key));
    if (value && typeof value === "object")
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, this.resolve(v, k)]));
    return value;
  }

  private describe(seen: Inspection) {
    const p = this.engine.state.player.pos;
    const where = seen.pos.space === p.space ? compass(p, seen.pos) : "not where you are";
    const brief = seen.brief && [seen.brief.identity, seen.brief.moment].map((line) => line.map((b) => b.text).join("")).join("\n");
    const goods = Object.entries(seen.inventory ?? {}).filter(([, n]) => n).map(([id, n]) => `${this.engine.item(id)?.name ?? id} [${id}] x${n}`);
    const acts = seen.affordances.map((a) => {
      const c = a.command as { type: string; action?: string };
      const how = c.type === "interact" ? `[${c.action}]` : `act ${JSON.stringify(a.command)}`;
      return `- ${a.label} ${how}${a.enabled ? "" : ` (not now: ${a.reason ?? "unavailable"})`}`;
    });
    return [
      `${seen.id} "${seen.name}"${seen.latin ? ` (${seen.latin})` : ""}, ${seen.kind}, ${where}.`,
      brief,
      seen.description,
      seen.claim ? `Claim: ${seen.claim}.` : "",
      goods.length ? `Has: ${goods.join(", ")}.` : "",
      acts.length ? `You can:\n${acts.join("\n")}` : "Nothing to do with it.",
    ].filter(Boolean).join("\n");
  }

  private waiting() {
    return `WAITING FOR YOUR ANSWER\n${[...this.open.values()].join("\n")}`;
  }

  private death() {
    const heirs = this.engine.heirs();
    return `You have died: ${this.engine.state.player.dead}\n${heirs.length
      ? `You may go on as one of your household, with act {type:'become', heir:ID}:\n${heirs.map((a) => `- ${a.id}: ${a.name}, ${a.age}, ${a.role}`).join("\n")}`
      : "No one of your household can go on in your place."}`;
  }

  private scene() {
    return trimScene(sceneDigest(this.engine, ""), true);
  }

  /** The browser shows each card once and takes it off the queue; so does this. */
  private collectCards() {
    if (!this.engine.state.care) this.open.delete("care-symptoms");
    for (const card of this.engine.cards.splice(0)) {
      const line = `${card.title}: ${card.text}`;
      if (card.choose)
        this.open.set(
          card.choose.card,
          `- ${line}\n  answer with act {type:'choose', card:'${card.choose.card}', choice:N}:\n${card.choose.choices
            .map((c) => `    ${c.index}. ${c.label}${c.note ? ` (${c.note})` : ""}${c.unavailable ? ` [not possible: ${c.unavailable}]` : ""}`)
            .join("\n")}`,
        );
      else this.news.push(line);
    }
  }

  private async act(command: z.infer<typeof commandSchema>) {
    let result: CommandResult;
    try {
      result = this.runtime.act({
        actionId: `a${this.serial++}`,
        expectedRevision: this.engine.state.revision,
        command,
      });
    } catch (e) {
      return { status: "rejected", text: String(e instanceof Error ? e.message : e) };
    }
    if (command.type === "choose" && (result.status === "completed" || result.reason === "There is nothing to answer."))
      this.open.delete(command.card);
    await this.settle();
    return this.outcome(result.status, [
      ...result.events.map((e) => e.text),
      ...(result.reason ? [result.reason] : []),
    ]);
  }

  private async talk(target: string, text: string) {
    const lines: string[] = [];
    let conversation = this.conversation;
    const continuing = conversation?.engine === this.engine && conversation.actorId === target;
    if (continuing && conversation?.left) return this.outcome("ended", ["They have ended the conversation."]);
    if (!continuing) {
      const { result, situation } = this.runtime.beginDialogue(target);
      if (result?.status !== "completed") return this.outcome("rejected", [result?.reason ?? "There is nobody here to speak to by that name."]);
      this.conversation = conversation = { engine: this.engine, actorId: target, history: [], situation: situation ?? "", left: false };
    }
    const c = conversation!;
    const actor = this.engine.state.actors.find((a) => a.id === target);
    if (!actor) return this.outcome("ended", ["That person is no longer here."]);
    if (actor.pos.space !== this.engine.state.player.pos.space || Math.hypot(actor.pos.x - this.engine.state.player.pos.x, actor.pos.y - this.engine.state.player.pos.y) > 2.5)
      return this.outcome("rejected", ["They are out of reach; walk closer first."]);
    this.engine.conversing = target;
    try {
      for (const said of c.history.length ? [text] : text ? ["", text] : [""]) {
        if (said) c.history.push({ speaker: "player", text: said });
        const reply = await dialogueTurn(this.runtime, target, said, c.history, undefined, false, c.situation);
        if (reply.error || reply.aborted) return this.outcome("unavailable", [...lines, reply.error ?? "The conversation ended."]);
        const effects = commitDialogue(this.runtime, target, said, reply);
        c.history.push({ speaker: "npc", text: reply.text, action: reply.action, context: reply.context });
        lines.push(`${actor.name}: ${reply.text}${reply.action ? ` (${reply.action})` : ""}`);
        if (effects.received?.result?.reason) lines.push(effects.received.result.reason);
        if (reply.trade) lines.push("They agree to trade. Inspect them to see their goods, then use act to trade.");
        if (reply.leave) { c.left = true; break; }
      }
      return this.outcome(c.left ? "ended" : "completed", lines);
    } finally {
      this.engine.conversing = undefined;
    }
  }

  private async goto(target?: string, x?: number, y?: number) {
    if (target) {
      const seen = this.engine.inspect(target);
      if (!seen) return { status: "unknown", text: "You cannot see that from here." };
      if (seen.pos.space !== this.engine.state.player.pos.space)
        return { status: "unreachable", text: "That is not where you are; go through a door first." };
      this.runtime.approach(target);
    } else if (x !== undefined && y !== undefined) this.runtime.walkTo({ x, y });
    else return { status: "rejected", text: "Name a target, or give x and y." };
    if (!this.runtime.running) return { status: "unreachable", text: this.runtime.notice || "There is no way there." };
    const events = await this.drive();
    return this.outcome(events.interrupted ? "interrupted" : "arrived", events.lines);
  }

  private async errand(a: { kind: string; target?: string; item?: string; direction?: "north" | "south" | "east" | "west" }) {
    const plan = planOf({ kind: a.kind, target: a.target, item: a.item, direction: a.direction } as Parameters<typeof planOf>[0], this.engine);
    if (!plan) return { status: "rejected", text: "That cannot be done from here." };
    this.runtime.setOff(plan);
    const events = await this.drive();
    return this.outcome(events.interrupted ? "interrupted" : "done", events.lines);
  }

  /** Steps the runtime's walk or errand to its end, as the browser's frame
   * loop would, stopping when someone needs an answer. */
  private async drive() {
    const from = this.engine.state.events.at(-1)?.id ?? 0;
    let interrupted = false,
      stuck = false,
      mark = { ...this.engine.state.player.pos, event: from };
    for (let i = 1; this.runtime.running && i < 20000; i++) {
      this.runtime.tick();
      await this.settle();
      if (this.engine.cards.some((c) => c.choose) || this.engine.state.player.dead) {
        this.runtime.stop(false);
        interrupted = true;
      }
      // An errand can pace between two cells forever; nothing new in 300 ticks ends it.
      if (i % 300 === 0) {
        const p = this.engine.state.player.pos,
          event = this.engine.state.events.at(-1)?.id ?? 0;
        if (p.space === mark.space && Math.hypot(p.x - mark.x, p.y - mark.y) < 3 && event === mark.event) {
          this.runtime.stop(false);
          interrupted = stuck = true;
        }
        mark = { ...p, event };
      }
    }
    const lines = this.engine.state.events.filter((e) => e.id > from).map((e) => e.text);
    if (stuck) lines.push("You make no headway and stop.");
    if (this.runtime.notice) lines.push(this.runtime.notice);
    return { interrupted, lines };
  }

  private async travel(to: string) {
    const journey = this.runtime.journey;
    if (!journey) return { status: "rejected", text: "There is no road out from here." };
    const exit = journey.entrances.find((e) => e.id === to);
    const before = this.engine;
    if (exit) await journey.cross(exit);
    else {
      const resolved = resolveSetting(to, this.engine.state.manifest.seed);
      if ("error" in resolved) return { status: "unknown", text: `Nobody here knows the way to ${to}.` };
      await journey.voyage({ lon: resolved.setting.lon, lat: resolved.setting.lat });
    }
    await this.settle();
    return this.outcome(this.engine === before ? "rejected" : "arrived", [this.runtime.notice]);
  }

  private async timeTravel(year: number) {
    const travel = (this.runtime.timeTravel ??= new TimeTravel(this.engine));
    try {
      const prepared = travel.prepare(year, this.engine);
      travel.commit(prepared);
      releaseTerrainWorker(prepared.source.world);
      this.runtime.replace(prepared.engine, false, true);
      this.open.clear();
      return this.outcome("arrived", [prepared.arrival.text]);
    } catch (e) {
      return { status: "rejected", text: String(e instanceof Error ? e.message : e) };
    }
  }

  /** Waits out map travel, which prepares the next world asynchronously. */
  private async settle() {
    while (this.runtime.journey?.busy) await new Promise((r) => setTimeout(r, 5));
  }

  private outcome(status: string, lines: string[]) {
    this.collectCards();
    const said = [...new Set(lines.filter(Boolean))].slice(-12).join("\n");
    const waiting = this.open.size ? `\n\n${this.waiting()}` : "";
    const death = this.engine.state.player.dead ? `\n\n${this.death()}` : "";
    return { status, text: `${status.toUpperCase()}${said ? `\n${said}` : ""}${waiting}${death}\n\n${this.scene()}` };
  }
}

/** Prepares a world the way the start screen does and puts an agent in it. */
export async function startAgent(options: StartOptions, record: RunRecord) {
  let setting, seed;
  if (options.setting) {
    seed = options.seed ?? `world-${crypto.randomUUID()}`;
    const resolved = typeof options.setting === "string"
      ? resolveSetting(options.setting, seed)
      : { setting: options.setting };
    if ("error" in resolved) throw Error(resolved.error);
    setting = resolved.setting;
  } else {
    const start = options.seed
      ? randomStartFromDraws(Uint32Array.from([0, 1, 2], (k) => hash(`${options.seed}:start:${k}`)), "any", options.seed)
      : randomStart();
    ({ seed, setting } = start);
  }
  const engine = await prepareConnectedStart(setting, seed);
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.modelFetch = options.offline
    ? async () => new Response(JSON.stringify({ error: "Offline." }), { status: 503 })
    : record.fetch("environment", options.modelFetch ?? runtime.modelFetch);
  // Map travel loads on demand; wait for it so the first look lists the ways out.
  if (engine.state.manifest.setting?.playableMap)
    for (let i = 0; i < 400 && !runtime.journey; i++) await new Promise((r) => setTimeout(r, 5));
  const s = engine.world.pack.setting!;
  record.start({
    protocol: PROTOCOL,
    setting: { asked: typeof options.setting === "string" ? options.setting : undefined, place: s.location, year: s.year, role: engine.state.player.role, seed },
    initialSetting: structuredClone(engine.state.manifest.setting),
    timeTravel: !!options.timeTravel,
    offline: !!options.offline,
  });
  return new Agent(runtime, record, options);
}
