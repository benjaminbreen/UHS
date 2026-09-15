import type { Engine } from "../core/engine";
import { describeStats, statsOf } from "../core/stats";
import { weatherAt } from "../core/weather";
import { seasonAt } from "../core/livelihood";
import { distance, type Actor, type Position } from "../core/types";
const RULES = `You narrate one turn of a historical simulation. The player types what they try to do; you tell them what happens, in the second person and present tense, in two to four plain sentences. No headers, no lists, no options, no questions about what they want to do next.

Truth comes from the WORLD and SCENE sections. Never contradict them and never invent named people, buildings or goods that are not listed; unnamed passers-by are fine. Refuse the anachronistic or impossible inside the story, briefly, without breaking character. People here have their own work and standing; they can be busy, wary, or unimpressed.

You do not change the world yourself. You propose intents and the engine resolves them; your narration must not assume an outcome the engine has not yet decided:
- attempt: physical or mental risk (climb, swim, lift, sneak, persuade, recall). Give check (strength|agility|wit), difficulty 1-5, and two short outcome sentences: success and failure. Your narration is only the lead-in.
- forage: any digging, picking, gathering or searching of the ground, water's edge or plants. Always forage for that, never attempt. Optional item id from the catalog.
- invent: a new object the player makes or ends up with (burnt, crushed, cut, mixed). Give name, one-line description, value (in the same scale as the catalog, most things 0-3), edible (hunger relieved 0-30) and health (-40..20) if it can be eaten, flammable, floats, and a look: rock|plant|food|wood|cloth|tool|vessel|creature. List what it consumes from the inventory. Whenever the player crushes, burns, cuts, cooks, mixes or otherwise changes something they carry, the result is an invent that consumes the original, alongside an attempt if the act could fail.
- climb: the player goes up something in reach — a tree, a wall, a house, a rock face. Name the target with the SCENE id when it has one, otherwise in your own words. Use it instead of attempt when the climb is plainly within reach; keep attempt for a climb that could fail badly.
- pass: minutes of time passing (max 1440) for rest, work, waiting.
- travel: north|south|east|west, walking until tired or blocked. Use for "go as far as I can".
- converse: a listed person answers the player in their own voice. Give with (their SCENE id), said (their reply, under 120 characters) and delta -2..2 for how the exchange leaves them disposed. Use it whenever a named person speaks back.
- receive: a listed person hands the player something. Give from (their SCENE id) and the item as invent describes one. Only when they have reason to part with it.
- regard: how onlookers now see the player, -3..3, with a short reason. Use for anything shameful, generous, frightening or absurd done in view of others.
- fact: one short standing fact worth remembering (a debt, a promise, a name learned, an injury). Rarely.
Also, when the player plainly asks for a listed action on a listed target, put it in command with the target id, exactly as the SCENE offers it. Use at most one command per turn and only the affordances listed. Leave intents empty when nothing changes.

Reply with JSON only: {"narration": string, "intents": [...], "command"?: {...}}.`;
const compass = (from: Position, to: Position) => {
  const dx = to.x - from.x,
    dy = to.y - from.y,
    d = Math.round(Math.hypot(dx, dy));
  if (!d) return "here";
  const dir =
    Math.abs(dx) > 2 * Math.abs(dy)
      ? dx > 0
        ? "E"
        : "W"
      : Math.abs(dy) > 2 * Math.abs(dx)
        ? dy > 0
          ? "S"
          : "N"
        : `${dy > 0 ? "S" : "N"}${dx > 0 ? "E" : "W"}`;
  return `${d} paces ${dir}`;
};
const hourWord = (clock: number) => {
  const h = Math.floor(clock / 3600) % 24,
    m = Math.floor(clock / 60) % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};
/** Stable for a whole session, so the provider's prefix cache covers it. */
export function worldCard(engine: Engine): string {
  const { pack } = engine.world,
    s = engine.state,
    p = s.player,
    setting = pack.setting;
  const household = s.households?.find((h) => h.members.includes("player"));
  const kin = (p.relations ?? [])
    .map((r) => {
      const a = s.actors.find((a) => a.id === r.other);
      return a
        ? `${a.name} (${r.kind}${a.age ? `, ${a.age}` : ""})`
        : undefined;
    })
    .filter(Boolean);
  const evidence = pack.evidence
    .filter((e) => e.status !== "fictional")
    .slice(0, 8)
    .map((e) => `- ${e.statement}`);
  const catalog = Object.keys(engine.items).join(", ");
  return [
    RULES,
    "",
    "WORLD",
    `${pack.name}. ${pack.region}, ${pack.date}. ${pack.subtitle}.`,
    pack.description,
    setting
      ? `Place: ${setting.location}. Culture: ${setting.culture}. Climate: ${setting.climate}, ${setting.water}, ${setting.settlement} settlement, ${setting.architecture} building. Community: ${setting.community}.`
      : "",
    evidence.length ? `Grounding:\n${evidence.join("\n")}` : "",
    "",
    "PLAYER",
    `${p.name}, ${p.age ?? "adult"}, ${p.role}${p.origin ? ` (${p.origin.livelihood}, ${p.origin.community})` : ""}. ${p.stats ? `Traits: ${describeStats(p.stats).join(", ") || "unremarkable"}.` : ""}`,
    `Concern: ${pack.concern}`,
    household
      ? `Household of ${household.members.length}${kin.length ? `: ${kin.join(", ")}` : ""}.`
      : "Lives alone.",
    "",
    `Item catalog ids: ${catalog}.`,
  ]
    .filter((l) => l !== undefined)
    .join("\n");
}
export function sceneDigest(engine: Engine, input: string): string {
  const s = engine.state,
    p = s.player,
    { pack } = engine.world,
    setting = pack.setting,
    seed = s.manifest.seed;
  const weather = weatherAt(
    seed,
    setting?.climate ?? "temperate",
    setting?.season ?? "spring",
    s.clock,
  );
  const season = seasonAt(setting?.season ?? "spring", s.clock);
  const inside =
    p.pos.space !== "outside" ? engine.world.place(p.pos.space) : undefined;
  const terrain = inside ? "indoors" : engine.world.terrain(p.pos.x, p.pos.y);
  const near = <T extends { pos: Position }>(xs: T[], r: number, n: number) =>
    xs
      .map((x) => ({ x, d: distance(x.pos, p.pos) }))
      .filter((e) => e.d <= r && engine.visible(e.x.pos))
      .sort((a, b) => a.d - b.d)
      .slice(0, n)
      .map((e) => e.x);
  const affordances = (id: string) =>
    (engine.inspect(id)?.affordances ?? [])
      .filter((a) => a.enabled && a.command.type === "interact")
      .map((a) => (a.command as { action: string }).action)
      .join("/");
  const people = near(s.actors, 10, 8).map((a: Actor) => {
    const traits =
      a.kind === "human" ? describeStats(statsOf(seed, a)).slice(0, 3) : [];
    const rel = (p.relations ?? []).find((r) => r.other === a.id)?.kind;
    const mood = a.trust < 0 ? "wary of you" : a.trust > 2 ? "friendly" : "";
    return `- ${a.id} "${a.name}", ${a.role}${a.age ? `, ${a.age}` : ""}${rel ? `, your ${rel}` : ""}, ${compass(p.pos, a.pos)}: ${a.activity.toLowerCase()}${a.held ? `, holding ${a.held}` : ""}${traits.length ? `; ${traits.join(", ")}` : ""}${mood ? `; ${mood}` : ""}${affordances(a.id) ? ` [${affordances(a.id)}]` : ""}`;
  });
  const things = near(
    s.objects.filter((o) => !o.carriedBy && o.kind !== "exit"),
    6,
    8,
  ).map(
    (o) =>
      `- ${o.id} "${o.name}"${o.owner && o.owner !== "player" ? " (someone's)" : ""}, ${compass(p.pos, o.pos)}${affordances(o.id) ? ` [${affordances(o.id)}]` : ""}`,
  );
  const places = engine.world.places
    .map((b) => ({
      b,
      d: distance({ ...b.entrance, space: "outside" }, p.pos),
    }))
    .filter((e) => e.d <= 12)
    .sort((a, b) => a.d - b.d)
    .slice(0, 6)
    .map(
      (e) =>
        `- ${e.b.id} "${e.b.name}", ${compass(p.pos, { ...e.b.entrance, space: "outside" })}${affordances(e.b.id) ? ` [${affordances(e.b.id)}]` : ""}`,
    );
  const inventory = Object.entries(p.inventory)
    .filter(([, n]) => n)
    .map(([id, n]) => `${engine.item(id)?.name ?? id} x${n}`)
    .join(", ");
  const held = p.held
    ? s.objects.find((o) => o.id === p.held)?.name
    : undefined;
  const condition = [
    p.hunger > 70 ? "hungry" : p.hunger > 45 ? "peckish" : "fed",
    p.fatigue > 65 ? "tired" : p.fatigue > 35 ? "a little worn" : "rested",
    (p.health ?? 100) < 40 ? "unwell" : "",
  ]
    .filter(Boolean)
    .join(", ");
  const lastTurn = s.narration?.at(-1)?.clock ?? -1;
  const events = s.events
    .filter((e) => e.time > lastTurn && e.kind !== "system")
    .slice(-5)
    .map((e) => `- ${e.text}`);
  const recent = (s.narration ?? [])
    .slice(-3)
    .map((t) => `> ${t.input}\n${t.text.slice(0, 240)}`);
  return [
    "SCENE",
    `Day ${Math.floor(s.clock / 86400) + 1}, ${hourWord(s.clock)}, ${season}. ${weather.label}, ${Math.round(weather.tempC)}°C${weather.night ? ", dark" : ""}.`,
    `You are ${inside ? `inside ${inside.name}` : `outdoors on ${terrain}`}${held ? `, carrying ${held.toLowerCase()}` : ""}. You feel ${condition}.`,
    `Inventory: ${inventory || "nothing"}.`,
    people.length ? `People nearby:\n${people.join("\n")}` : "Nobody in sight.",
    things.length ? `Things nearby:\n${things.join("\n")}` : "",
    places.length ? `Buildings nearby:\n${places.join("\n")}` : "",
    s.ledger?.length
      ? `Standing facts:\n${s.ledger.map((f) => `- ${f}`).join("\n")}`
      : "",
    events.length ? `Since last turn:\n${events.join("\n")}` : "",
    recent.length ? `Recent turns:\n${recent.join("\n")}` : "",
    "",
    `PLAYER SAYS: ${input}`,
  ]
    .filter(Boolean)
    .join("\n");
}
