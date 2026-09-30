import { asDoing, festivalOf, type AgendaItem } from "../core/agenda";
import { dayPlan, itineraryAt, type StationActivity } from "../core/itinerary";
import { levelOf, SKILLS, type SkillId } from "../core/skills";
import { TILE_METRES, type Actor, type Point } from "../core/types";
import { beliefsFor, unscopedBeliefs } from "../content/beliefs";
import { cultures } from "../content/history/types";
import { eraAt } from "../content/history/dates";
import { skillContext } from "../content/skill-context";
import type { Source } from "../content/skill-context/sources";
import { faunaProfile } from "../content/fauna";
import type { Festival, PlaceWant } from "../content/days/types";
import type { Evidence } from "../content/history/types";
import { livelihoodOf } from "../world/v3/routines";
import { workplaceFor } from "../content/characters/workplace";
import type { Runtime } from "../runtime/session";
import { loreFor, type LoreTopic, type TaskLore } from "../content/task-lore";

/** A scene the task screen can draw: a figure, what they hold, what is round them. */
export const vignettes = [
  "craft", "tend", "haul", "water", "gather", "talk", "offer", "market",
  "gathering", "herd", "play", "cook", "warm", "hang", "rest", "walk",
] as const;
export type Vignette = (typeof vignettes)[number];
export type Part = "morning" | "midday" | "evening" | "night";

export type TaskSource =
  | { kind: "goal"; id: string }
  | { kind: "aim" }
  | { kind: "plan"; actorId: string; label: string; activity: StationActivity; minute: number };
export type Fact = { label: string; text: string };
export type TaskView = {
  key: string;
  kicker: string;
  title: string;
  who: { id: string; name: string; role: string; self: boolean };
  part: Part;
  vignette: Vignette;
  /** Someone else in the picture, at this size: a child watching is smaller. */
  companion?: number;
  where?: { label: string; pos?: Point };
  facts: Fact[];
  record?: {
    /** Accounts written for the game, most particular first. */
    lore?: TaskLore[];
    evidence?: Evidence["status"];
    note?: string;
    links: string[];
    wiki: string[];
    books: Source[];
  };
  /** What the task is about, for choosing its lore. */
  asked?: LoreTopic[];
  /** What the optional written account is asked to explain. */
  lore: { place: string; year: number; culture: string; role: string; task: string; note?: string };
  goalId?: string;
  done?: boolean;
};

const PART_WORDS: Record<Part, string> = {
  morning: "In the morning",
  midday: "Around midday",
  evening: "In the evening",
  night: "After dark",
};
const partAt = (minute: number): Part => {
  const h = (((minute / 60) % 24) + 24) % 24;
  return h < 5 ? "night" : h < 11 ? "morning" : h < 16 ? "midday" : h < 21 ? "evening" : "night";
};
const clockOf = (minute: number) => {
  const m = ((Math.round(minute) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

function vignetteFor(activity: StationActivity, place?: PlaceWant | Festival["place"]): Vignette {
  switch (activity) {
    case "work": return "craft";
    case "tend": return "tend";
    case "haul": return "haul";
    case "draw-water": return "water";
    case "gather": return "gather";
    case "graze": return "herd";
    case "play": return "play";
    case "cook": return "cook";
    case "warm": return "warm";
    case "haul-catch": return "hang";
    case "rest": return "rest";
    case "visit":
      if (place === "sanctuary") return "offer";
      if (place === "market") return "market";
      if (place === "edge" || place === "wild") return "walk";
      if (place === "gathering" || (typeof place === "object" && "venue" in place)) return "gathering";
      return "talk";
  }
}
const WORKPLACE: Record<string, [Vignette, SkillId, string]> = {
  field: ["tend", "farming", "in the fields"],
  pasture: ["herd", "animals", "out with the animals"],
  wild: ["gather", "foraging", "out beyond the houses"],
  water: ["hang", "foraging", "at the water"],
  extraction: ["craft", "stonework", "at the diggings"],
  market: ["market", "trade", "at the market"],
  civic: ["talk", "speech", "among the people in your charge"],
  carrying: ["haul", "wayfaring", "on the road"],
  workshop: ["craft", "crafting", "at your bench"],
  household: ["cook", "farming", "about the house"],
};
const TEMPLATE: Record<string, [Vignette, Part]> = {
  eat: ["cook", "midday"],
  sleep: ["rest", "night"],
  water: ["water", "morning"],
  firewood: ["haul", "evening"],
  "food-store": ["gather", "midday"],
  neighbour: ["talk", "evening"],
  news: ["gathering", "evening"],
  worship: ["offer", "morning"],
  barter: ["market", "midday"],
};
const AIM: Record<string, [Vignette, string[]]> = {
  mastery: ["craft", ["Apprenticeship"]],
  "child-future": ["talk", ["Apprenticeship", "Inheritance"]],
  "marriage-hope": ["talk", ["Arranged marriage", "Dowry"]],
  "elder-kin": ["warm", ["Old age"]],
  "new-settlement": ["craft", ["Human migration"]],
  "household-home": ["craft", ["Inheritance", "Vernacular architecture"]],
  "raise-kin": ["play", ["History of childhood"]],
  "restore-household": ["tend", ["Subsistence economy"]],
  "remember-dead": ["offer", ["Veneration of the dead"]],
  "widowed-household": ["warm", ["Widow"]],
  "shared-future": ["walk", ["History of marriage"]],
  "find-belonging": ["walk", ["Hospitality"]],
  "make-a-life": ["walk", ["Everyday life"]],
};
const COMPASS = ["east", "south-east", "south", "south-west", "west", "north-west", "north", "north-east"];
/** "about 120 m to the north-east", from where someone stands. */
export function bearing(from: Point, to: Point) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const d = Math.hypot(dx, dy) * TILE_METRES;
  if (d < 12) return "close by";
  const i = Math.round(((Math.atan2(dy, dx) / (Math.PI * 2)) * 8 + 8)) % 8;
  const m = d < 100 ? Math.round(d / 10) * 10 : Math.round(d / 50) * 50;
  return `about ${m} m to the ${COMPASS[i]}`;
}
const WHERE_WORDS: Record<string, string> = {
  home: "At home",
  hearth: "At the hearth",
  well: "At the well",
  sanctuary: "At the shrine",
  market: "At the market",
  gathering: "Where people gather",
  wild: "Out beyond the houses",
  edge: "On the road out of the settlement",
  work: "Where you work",
  door: "At a neighbour's door",
};
/** The same line said of someone else. */
const third = (s: string) =>
  s
    .replace(/\bYou are\b/g, "They are")
    .replace(/\bYou were\b/g, "They were")
    .replace(/\byou are\b/g, "they are")
    .replace(/\bYour\b/g, "Their")
    .replace(/\byour\b/g, "their")
    .replace(/\bYou\b/g, "They")
    .replace(/\byou\b/g, "them");

/** The task, with the written lore for its place and time put first. */
export function taskView(runtime: Runtime, source: TaskSource): TaskView | undefined {
  const view = baseView(runtime, source);
  if (!view?.asked) return view;
  const s = runtime.engine.state;
  const actor = view.who.self ? s.player : s.actors.find((a) => a.id === view.who.id);
  const kit = livelihoodOf(runtime.engine.world.pack, actor);
  const lore = loreFor(runtime.engine.world.pack.setting, actor?.origin?.community, view.asked, `${kit?.label ?? ""} ${kit?.activity ?? ""} ${actor?.role ?? ""}`);
  if (!lore.length) return view;
  const r = view.record ?? { links: [], wiki: [], books: [] };
  return {
    ...view,
    lore: { ...view.lore, note: view.lore.note ?? lore[0].text },
    record: {
      ...r,
      lore,
      evidence: r.evidence ?? lore[0].evidence,
      wiki: [...new Set([...lore.flatMap((l) => l.wiki), ...r.wiki])],
      links: [...new Set([...r.links, ...lore.flatMap((l) => l.sources ?? [])])],
    },
  };
}
const ANY_TRADE: LoreTopic = { trade: /./ };

function baseView(runtime: Runtime, source: TaskSource): TaskView | undefined {
  const engine = runtime.engine;
  const s = engine.state, world = engine.world, pack = world.pack;
  const setting = pack.setting;
  const year = setting?.year ?? pack.year;
  const cultureLabel = setting ? (cultures.find(([id]) => id === setting.culture)?.[1] ?? "") : "";
  const self = source.kind !== "plan" || source.actorId === s.player.id;
  const actor: Actor | undefined =
    source.kind === "plan" && !self ? s.actors.find((a) => a.id === source.actorId) : s.player;
  if (!actor) return undefined;
  const say = (line: string) => (self ? line : third(line));
  const who = { id: actor.id, name: actor.name, role: actor.role, self };
  const kit = livelihoodOf(pack, actor);
  const lore = (task: string, note?: string) => ({
    place: setting?.location ?? pack.name,
    year,
    culture: cultureLabel,
    role: actor.role,
    task,
    note,
  });
  const era = setting ? eraAt({ year }) : undefined;
  const household = s.households?.find((h) => h.members.includes(actor.id));
  const home = household
    ? (world.places.find((p) => p.id === household.residence)?.entrance ?? household.home)
    : actor.home;
  const here = s.player.pos.space === "outside" ? s.player.pos : world.place(s.player.pos.space)?.entrance ?? s.player.pos;
  const whereOf = (label: string, pos?: Point): TaskView["where"] => ({ label: pos ? `${label}, ${bearing(here, pos)}` : label, pos });
  const agenda = world.agenda?.(actor, s.clock);
  const occasionView = (
    item: AgendaItem & { pos?: Point },
    extra: { key: string; kicker: string; goalId?: string; done?: boolean; minute?: number },
  ): TaskView => {
    const subject = item.subject && s.actors.find((a) => a.id === item.subject);
    const facts: Fact[] = [];
    if (item.why.length) facts.push({ label: "Why today", text: item.why.map(say).join(" ") });
    if (subject) facts.push({ label: "Who", text: `${subject.name}, ${subject.role.toLowerCase()}${subject.age ? `, ${subject.age}` : ""}` });
    facts.push({ label: "When", text: extra.minute !== undefined ? `${PART_WORDS[item.part]}, about ${clockOf(extra.minute)}` : PART_WORDS[item.part] });
    const where = whereOf(typeof item.place === "string" ? WHERE_WORDS[item.place] : subject ? `At ${subject.name.split(" ")[0]}'s door` : "Nearby", item.pos);
    const vignette = vignetteFor(item.activity, item.place);
    return {
      ...extra,
      title: self ? item.text : asDoing(item.text, false),
      who,
      part: item.part,
      vignette,
      companion: subject ? companionOf(subject, vignette) : undefined,
      where,
      facts,
      record: { evidence: item.evidence, note: item.note, links: [...item.sources], wiki: [...item.sources.flatMap(wikiTitle), TOPIC[vignette]], books: [] },
      lore: lore(item.text, item.note),
      asked: [{ occasion: item.id }, { scene: vignette }],
    };
  };
  const festivalView = (f: Festival & { pos?: Point }, extra: { key: string; goalId?: string; done?: boolean }): TaskView => ({
    ...extra,
    kicker: "Holiday",
    title: f.text,
    who,
    part: "midday",
    vignette: f.place === "sanctuary" ? "offer" : f.place === "market" ? "market" : f.place === "edge" ? "walk" : f.place === "hearth" ? "warm" : "gathering",
    where: whereOf(WHERE_WORDS[f.place] ?? "In the settlement", f.pos),
    facts: [
      { label: "The day", text: `${f.label[0].toUpperCase()}${f.label.slice(1)}.` },
      ...(f.rest ? [{ label: "Work", text: "Nobody works today. The whole settlement keeps the day." }] : []),
    ],
    record: { evidence: f.evidence, note: f.note, links: [...f.sources], wiki: f.sources.flatMap(wikiTitle), books: [] },
    lore: lore(`Keeping ${f.label}`, f.note),
    asked: [{ occasion: f.id }, { scene: f.place === "sanctuary" ? "offer" : "gathering" }],
  });
  const workRecord = (skill: SkillId) => {
    const ctx = skillContext(skill, setting?.culture, era?.id);
    return { links: [], wiki: [...(kit ? [kit.label.replace(/^Apprentice /, "")] : []), ...ctx.wiki].slice(0, 3), books: ctx.sources };
  };

  if (source.kind === "goal") {
    const goal = engine.dailyGoals().find((g) => g.id === source.id);
    if (!goal) return undefined;
    const extra = { key: `goal:${goal.id}`, goalId: goal.id, done: goal.done };
    if (goal.slot === "own") {
      const f = agenda?.festival;
      if (f && f.id === goal.id) return festivalView(f, extra);
      const item = agenda?.items.find((i) => i.id === goal.id);
      if (item) return occasionView(item, { ...extra, kicker: "Errand" });
    }
    if (goal.slot === "work") {
      const [vignette, skill, where] = WORKPLACE[kit ? (kit.workplace ?? workplaceFor(kit.activity)) : "workshop"] ?? WORKPLACE.workshop;
      const plan = engine.workPlan();
      const station = plan?.station;
      const home = station && station.pos.space !== "outside" ? world.place(station.pos.space) : undefined;
      const facts: Fact[] = [
        { label: "Your trade", text: `${kit?.label ?? actor.role}: ${(kit?.activity ?? "the day's work").toLowerCase()}, ${where}.` },
        ...(plan ? [{ label: "Today's work", text: plan.stages.map((st, i) => (i < plan.done ? `${st} ✓` : st)).join(" › ") }] : []),
        { label: "Skill", text: `${SKILLS[skill].name}, level ${levelOf(engine.skills()[skill])}.` },
        {
          label: "How",
          text: !plan ? "Work at your workplace, a stage at a time."
            : plan.done >= plan.stages.length ? "Done for today."
            : station ? `Hold F at the ${station.name.toLowerCase()}${home ? ", inside the house," : ""} and the work goes on a stage at a time. Or leave it to the day and watch.`
            : "There is nowhere to hand to work today.",
        },
      ];
      return {
        ...extra,
        kicker: "Work",
        title: goal.text,
        who,
        part: "morning",
        vignette,
        where: home ? whereOf(`${station!.name}, inside the house`, home.entrance) : whereOf("Where you work", station?.pos ?? actor.work),
        facts,
        record: workRecord(skill),
        lore: lore(`A day's work as ${kit?.label ?? actor.role}: ${kit?.activity ?? ""}`),
        asked: [{ goal: goal.id }, ANY_TRADE, { workplace: kit ? (kit.workplace ?? workplaceFor(kit.activity)) : "workshop" }, { scene: vignette }],
      };
    }
    const [vignette, part] = TEMPLATE[goal.id] ?? ["talk", "midday"];
    const facts: Fact[] =
      goal.slot === "need"
        ? [{ label: "How you are", text: `${s.player.hunger > 60 ? "Hungry" : s.player.hunger > 35 ? "Could eat" : "Fed"}, and ${s.player.fatigue > 65 ? "tired" : "rested"}.` }]
        : [{ label: "Why", text: "An ordinary day has its company in it." }];
    return {
      ...extra,
      kicker: goal.slot === "need" ? "Need" : "Social",
      title: goal.text,
      who,
      part,
      vignette,
      facts,
      record: { links: [], wiki: [TOPIC[vignette]], books: [] },
      lore: lore(goal.text),
      asked: [{ goal: goal.id }, { scene: vignette }],
    };
  }

  if (source.kind === "aim") {
    const aim = s.lifeAim;
    if (!aim) return undefined;
    const [vignette, wiki] = AIM[aim.id] ?? ["walk", ["Everyday life"]];
    const facts: Fact[] = [];
    if (aim.step)
      facts.push({ label: "Next step", text: `${aim.step.text}${aim.step.type === "work" ? ` (${aim.step.progress} of ${aim.step.target})` : aim.step.done ? " (done)" : ""}` });
    const subjects = aim.subjects.map((id) => s.actors.find((a) => a.id === id)).filter((a): a is Actor => !!a);
    for (const other of subjects) {
      const it = world.itinerary?.(other.id);
      const now = it ? itineraryAt(it, s.clock) : undefined;
      facts.push({
        label: other.name.split(" ")[0],
        text: `${other.role}${other.age ? `, ${other.age}` : ""}.${now ? ` Now: ${now.label.toLowerCase()}, ${bearing(here, now)}.` : ""}`,
      });
    }
    const place = household && world.places.find((p) => p.id === household.residence);
    if (place && place.name !== "Household") facts.push({ label: "The house", text: `${place.name}, ${bearing(here, place.entrance)}.` });
    const history = household?.history ?? [];
    const told = history.filter((e) => e.kind !== "born" || aim.id === "raise-kin").slice(-5);
    if (told.length)
      facts.push({
        label: "The household's story",
        text: told.map((e) => EVENT[e.kind]?.(e.year, e.as, e.name) ?? "").filter(Boolean).join(" "),
      });
    if (household?.fortune !== undefined)
      facts.push({ label: "Means", text: household.fortune > 0.66 ? "The household is comfortable." : household.fortune > 0.33 ? "The household gets by." : "The household is struggling." });
    if (aim.id === "household-home" || aim.id === "new-settlement" || aim.id === "raise-kin") {
      const near = (s.fauna ?? [])
        .map((g) => ({ g, p: faunaProfile(g.speciesId) }))
        .filter(({ g, p }) => p?.category === "wild" && p.preyTags?.length && Math.hypot(g.pos.x - home.x, g.pos.y - home.y) < 90)
        .sort((a, b) => Math.hypot(a.g.pos.x - home.x, a.g.pos.y - home.y) - Math.hypot(b.g.pos.x - home.x, b.g.pos.y - home.y));
      facts.push({
        label: "Watch for",
        text: near.length
          ? near.slice(0, 2).map(({ g, p }) => `${g.members.length > 1 ? `${g.members.length} ${plural(p!.label)}` : `A ${p!.label.toLowerCase()}`} ${g.members.length > 1 ? "were" : "was"} seen ${bearing(home, g.pos)} of the house.`).join(" ")
          : "Nothing that hunts has been seen near the house lately.",
      });
    }
    const belief = setting ? beliefsFor(setting, actor.origin?.community) : unscopedBeliefs;
    const dead = aim.id === "remember-dead" || aim.id === "widowed-household";
    return {
      key: "aim",
      kicker: "Life aim",
      title: aim.text,
      who,
      part: "evening",
      vignette,
      companion: subjects[0] ? companionOf(subjects[0], vignette) : undefined,
      where: place ? whereOf("Home", place.entrance) : undefined,
      facts,
      record: {
        evidence: dead ? belief.evidence.status : undefined,
        note: dead ? belief.afterlife : undefined,
        links: dead && belief.wiki ? [belief.wiki] : [],
        wiki: [...wiki, ...(dead && belief.wiki ? wikiTitle(belief.wiki) : [])],
        books: [],
      },
      lore: lore(aim.text, dead ? belief.afterlife : undefined),
      asked: [{ aim: aim.id }, { scene: vignette }],
    };
  }

  const minute = source.minute;
  const key = `plan:${actor.id}:${source.label}`;
  const f = agenda?.festival;
  if (f && source.label === `Keeping ${f.label}`) return festivalView(f, { key });
  const item = agenda?.items.find((i) => asDoing(i.text, self) === source.label);
  if (item) return occasionView(item, { key, kicker: self ? "Your day" : `${actor.name.split(" ")[0]}'s day`, minute });
  const it = world.itinerary?.(actor.id);
  const pos = it?.segments.find((g) => !g.path && g.label === source.label)?.pos;
  const workish = ["work", "tend", "gather", "graze", "haul", "haul-catch"].includes(source.activity);
  const [, skill] = WORKPLACE[kit ? (kit.workplace ?? workplaceFor(kit.activity)) : "workshop"] ?? WORKPLACE.workshop;
  return {
    key,
    kicker: self ? "Your day" : `${actor.name.split(" ")[0]}'s day`,
    title: source.label,
    who,
    part: partAt(minute),
    vignette: vignetteFor(source.activity, source.activity === "visit" ? "door" : undefined),
    where: pos ? whereOf("There", pos) : undefined,
    facts: [
      { label: "When", text: `${PART_WORDS[partAt(minute)]}, about ${clockOf(minute)}` },
      { label: "Who", text: `${actor.name}, ${actor.role.toLowerCase()}${actor.age ? `, ${actor.age}` : ""}.` },
      ...(workish && kit ? [{ label: "Their trade", text: `${kit.label}: ${kit.activity.toLowerCase()}.` }] : []),
    ],
    record: workish ? workRecord(skill) : undefined,
    lore: lore(source.label),
    asked: workish
      ? [ANY_TRADE, { workplace: kit ? (kit.workplace ?? workplaceFor(kit.activity)) : "workshop" }, { scene: vignetteFor(source.activity) }]
      : [{ scene: vignetteFor(source.activity, source.activity === "visit" ? "door" : undefined) }],
  };
}

/** Scenes that already hold two people need no one added. */
const PAIRED_SCENES: Vignette[] = ["talk", "market", "gathering", "warm", "play"];
const companionOf = (other: Actor, vignette: Vignette) =>
  PAIRED_SCENES.includes(vignette) ? undefined : (other.age ?? 30) < 14 ? 0.62 : 1;
/** A reading for any scene, when nothing more particular is recorded. */
const TOPIC: Record<Vignette, string> = {
  craft: "Artisan",
  tend: "Hoe (tool)",
  haul: "Porter (carrier)",
  water: "Water well",
  gather: "Foraging",
  talk: "Neighbourhood",
  offer: "Votive offering",
  market: "Marketplace",
  gathering: "Town square",
  herd: "Pastoralism",
  play: "Traditional games",
  cook: "History of cooking",
  warm: "Hearth",
  hang: "Dried fish",
  rest: "Leisure",
  walk: "Walking",
};
const plural = (label: string) => (/s$/.test(label) ? label.toLowerCase() : `${label.toLowerCase()}s`.replace(/fs$/, "ves").replace(/ys$/, "ies"));
const EVENT: Partial<Record<string, (year: number, as?: string, name?: string) => string>> = {
  wed: (y) => `Married in ${fmt(y)}.`,
  died: (y, as, name) => (name ? `${name}, ${as ? `your ${as}, ` : ""}died in ${fmt(y)}.` : `${as ? `Your ${as}` : "One of the household"} died in ${fmt(y)}.`),
  built: (y) => `The house was built in ${fmt(y)}.`,
  inherited: (y) => `The house came down to you in ${fmt(y)}.`,
  moved: (y) => `The household moved here in ${fmt(y)}.`,
  fire: (y) => `A fire in ${fmt(y)}.`,
  robbed: (y) => `Robbed in ${fmt(y)}.`,
  "bad-year": (y) => `A bad year in ${fmt(y)}.`,
  "good-year": (y) => `A good year in ${fmt(y)}.`,
  left: (y, as, name) => `${name ?? (as ? `Your ${as}` : "One of the household")} left in ${fmt(y)}.`,
  joined: (y, as, name) => `${name ?? (as ? `Your ${as}` : "Someone")} joined the household in ${fmt(y)}.`,
  born: (y, as, name) => `${name ?? (as ? `Your ${as}` : "A child")} was born in ${fmt(y)}.`,
};
const fmt = (year: number) => (year > 0 ? `${year} CE` : `${1 - year} BCE`);
/** A Wikipedia title from one of its URLs. */
function wikiTitle(url: string) {
  const m = /en\.wikipedia\.org\/wiki\/([^#?]+)/.exec(url);
  return m ? [decodeURIComponent(m[1]).replace(/_/g, " ")] : [];
}

/** The tasks the strip along the bottom offers, in the order of the day. */
export function tasksOf(runtime: Runtime, actorId: string): { source: TaskSource; label: string }[] {
  const s = runtime.engine.state;
  if (actorId === s.player.id)
    return [
      ...(s.lifeAim ? [{ source: { kind: "aim" } as const, label: "Life aim" }] : []),
      ...runtime.engine.dailyGoals().map((g) => ({ source: { kind: "goal", id: g.id } as const, label: g.text })),
    ];
  const it = runtime.engine.world.itinerary?.(actorId);
  return it
    ? dayPlan(it, s.clock).map((e) => ({
        source: { kind: "plan", actorId, label: e.label, activity: e.activity, minute: e.minute } as const,
        label: e.label,
      }))
    : [];
}
export { festivalOf };
