import { occasions as allOccasions, festivals as allFestivals } from "../content/days";
import type { Festival, Occasion, PlaceWant, Trigger } from "../content/days/types";
import type { WorldSetting } from "../content/geography/types";
import { matchesCharacterScope } from "../content/characters/resolve";
import { beliefOf, beliefsFor, type PersonalBelief } from "../content/beliefs";
import type { PersonalAim } from "../content/goals/types";
import { sexOf } from "./brief";
import { outlookOf } from "./outlook";
import { random } from "./random";
import { standingOf } from "./standing";
import { statsOf } from "./stats";
import type { Actor, Household, SocialRelation, Stats } from "./types";
import type { StationActivity } from "./itinerary";

const DAY = 86400;
/** Four seasons of 28 days: the game's year. */
const YEAR_DAYS = 112;
/** Northern day of the year each astronomical season begins. */
const SEASON_START = { spring: 79, summer: 172, autumn: 265, winter: 355 };
const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
const FALLBACK = 1 / 4;
const AIM_TILT = 2.5;

/** Which stretch of the solar year a game day stands for. Each game day is
 * about three and a quarter real ones. */
export function calendarOf(setting: WorldSetting, clock: number) {
  const day = Math.floor(clock / DAY);
  const first = Math.max(0, SEASONS.indexOf(setting.season as (typeof SEASONS)[number]));
  const season = SEASONS[(first + Math.floor(day / 28)) % 4];
  const span = 365.25 / YEAR_DAYS;
  // The season ids are already flipped in the south; dates are not.
  const from = SEASON_START[season] + (day % 28) * span + (setting.lat < 0 ? 182.6 : 0);
  return { day, season, from: ((from - 1) % 365.25) + 1, span };
}
function covers(cal: ReturnType<typeof calendarOf>, dayOfYear: number) {
  const d = (dayOfYear - cal.from + 365.25) % 365.25;
  return d < cal.span;
}
// Game day 0 is a Wednesday: seven-day content puts Sunday on 4.
const inCycle = (day: number, every: number, on: number) =>
  ((day % every) + every) % every === on;

/**
 * The day the whole settlement keeps, if today is one. The arrival day never
 * rests: the player is told the morning's work is beginning.
 */
export function festivalOf(setting: WorldSetting | undefined, clock: number): Festival | undefined {
  if (!setting) return undefined;
  const cal = calendarOf(setting, clock);
  const found = allFestivals.find(
    (f) =>
      matchesCharacterScope(f.scope, setting, "*") &&
      ("dayOfYear" in f.date ? covers(cal, f.date.dayOfYear) : inCycle(cal.day, f.date.every, f.date.on)),
  );
  return found && { ...found, rest: found.rest && found.evidence === "documented" && cal.day > 0 };
}

/** What the picker knows about a person, independent of the day. */
export type Person = {
  actor: Actor;
  household?: Household;
  kin: { actor: Actor; kind: SocialRelation["kind"] }[];
  aim?: PersonalAim;
  /** Livelihood words, for the craft power and the work triggers. */
  work: string;
};
type Facts = {
  stats: Stats;
  belief: PersonalBelief;
  tags: Set<string>;
  rank?: string;
  craftPower?: string;
};
const facts = new WeakMap<Actor, Facts>();

/** Work words to the domain words of a power who would care about it. */
const CRAFTS: [RegExp, RegExp][] = [
  [/smith|metal|armou?r|bronze|forge|cutler|found|cast/i, /forg|metal|smith|craft/i],
  [/bak|mill|bread|oven|cook/i, /bread|grain|hearth|oven/i],
  [/farm|plough|field|crop|rice|vine|garden|cultivat|peasant/i, /harvest|crop|grain|field|agricult|plough/i],
  [/herd|shep|goat|cattle|horse|flock|swine|drover/i, /herd|flock|cattle|horse|livestock|pastur/i],
  [/fish|boat|sail|net|ferry/i, /sea|river|fish|voyag|sailor/i],
  [/trad|merchant|sell|shop|pedlar|market|carri|carter/i, /trade|merchant|commerce|profit|market|travel/i],
  [/weav|spin|tailor|cloth|dye|seam/i, /weav|spin|cloth/i],
  [/pott|clay|kiln/i, /potter|clay|craft/i],
  [/hunt|trap|fowl/i, /hunt|game|wild animal/i],
  [/heal|physic|midwi|doctor|barber/i, /heal|medicine|birth|health/i],
  [/scribe|clerk|teach|school|priest/i, /writ|wisdom|learn|scribe/i],
];

function factsOf(seed: string, setting: WorldSetting, p: Person): Facts {
  let f = facts.get(p.actor);
  if (f) return f;
  const community = p.actor.origin?.community;
  const belief = beliefOf(seed, p.actor, beliefsFor(setting, community));
  const domain = CRAFTS.find(([work]) => work.test(p.work))?.[1];
  f = {
    stats: statsOf(seed, p.actor),
    belief,
    tags: outlookOf(seed, p.actor, setting).tags,
    rank: standingOf(seed, p.actor)?.rank,
    craftPower: domain && belief.system.powers.find((power) => domain.test(power.domain))?.name,
  };
  facts.set(p.actor, f);
  return f;
}

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};
const first = (a: Actor) => a.name.split(" ")[0];

/** One of the day's own doings, bound to this person. */
export type AgendaItem = {
  id: string;
  text: string;
  part: Occasion["part"];
  place: PlaceWant;
  activity: StationActivity;
  minutes: number;
  carry?: Occasion["carry"];
  evidence: Occasion["evidence"];
  note?: string;
  sources: readonly string[];
  /** The kin the occasion concerns, where it names one. */
  subject?: string;
};

/** Every trigger checked, and the words each one binds. Undefined if any fails. */
function bind(
  o: Occasion,
  seed: string,
  setting: WorldSetting,
  p: Person,
  f: Facts,
  cal: ReturnType<typeof calendarOf>,
) {
  const vars: Record<string, string> = {};
  let subject: string | undefined;
  const history = p.household?.history ?? [];
  const ok = (t: Trigger): boolean => {
    switch (t.type) {
      case "anniversary": {
        if (t.kind === "born-self") {
          const age = p.actor.age;
          if (!age || !covers(cal, 1 + random(seed, "birthday", p.actor.id) * 365)) return false;
          vars.nth = ordinal(age);
          return true;
        }
        // The history is told from the householder's side: "your wife".
        if (p.household?.members[0] !== p.actor.id) return false;
        const i = history.findIndex(
          (e, n) =>
            e.kind === t.kind &&
            (!t.as || t.as.includes(e.as ?? "")) &&
            setting.year - e.year >= 1 &&
            covers(cal, 1 + random(seed, "anniversary", p.household!.id, n) * 365),
        );
        if (i < 0) return false;
        const e = history[i];
        vars.years = String(setting.year - e.year);
        vars.nth = ordinal(setting.year - e.year);
        if (e.as) vars.dead = e.as;
        return t.kind !== "died" || !!e.as;
      }
      case "observance":
        return t.levels.includes(f.belief.observance);
      case "craft-power":
        if (!f.craftPower) return false;
        vars.craftPower = f.craftPower;
        return true;
      case "patron":
        if (!f.belief.patron) return false;
        vars.patron = f.belief.patron.name;
        return true;
      case "trait":
        return (t.above === undefined || f.stats[t.key] > t.above) &&
          (t.below === undefined || f.stats[t.key] < t.below);
      case "tag":
        return t.any.some((tag) => f.tags.has(tag));
      case "kin": {
        const found = p.kin.filter(
          (k) =>
            k.kind === t.kind &&
            (t.minAge === undefined || (k.actor.age ?? 0) >= t.minAge) &&
            (t.maxAge === undefined || (k.actor.age ?? 99) <= t.maxAge),
        );
        if (!found.length) return false;
        const k = found[Math.floor(random(seed, "agenda-kin", cal.day, p.actor.id, o.id) * found.length)];
        vars[t.kind] = first(k.actor);
        if (k.actor.age !== undefined) vars.age = String(k.actor.age);
        subject = k.actor.id;
        return true;
      }
      case "seek-match": {
        const plan = p.household?.familyPlans?.find((x) => x.kind === "seek-match");
        const child = plan && p.kin.find((k) => k.actor.id === plan.subject);
        if (!child) return false;
        vars.child = first(child.actor);
        subject = child.actor.id;
        return true;
      }
      case "fortune": {
        const v = p.household?.fortune ?? 0.5;
        return (t.above === undefined || v > t.above) && (t.below === undefined || v < t.below);
      }
      case "rank":
        return !!f.rank && t.any.includes(f.rank as never);
      case "season":
        return t.any.includes(cal.season);
      case "work":
        return t.match.test(p.work);
      case "chance":
        return random(seed, "agenda-chance", cal.day, p.actor.id, o.id) < t.p;
      case "cycle":
        return inCycle(cal.day, t.every, t.on);
      case "date":
        return covers(cal, t.dayOfYear);
      case "sex":
        return sexOf(p.actor) === t.is;
      case "adult":
        return (p.actor.age ?? 30) >= 16;
    }
  };
  if (!o.when.every(ok)) return undefined;
  const text = o.text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
  if (/\{\w+\}/.test(text)) return undefined;
  return { text, subject };
}

/**
 * The day's own doings for one person, beside their work: none, one or two,
 * picked from what is true of them today. Deterministic for a seed, person
 * and day, and derived rather than stored, like `outlookOf`.
 */
export function agendaOf(
  seed: string,
  setting: WorldSetting | undefined,
  clock: number,
  person: Person,
  /** False where the settlement has nowhere to do it. */
  can: (place: PlaceWant) => boolean = () => true,
): AgendaItem[] {
  if (!setting) return [];
  const cal = calendarOf(setting, clock);
  const f = factsOf(seed, setting, person);
  const community = person.actor.origin?.community ?? "*";
  const bound = allOccasions.flatMap((o) => {
    if (!matchesCharacterScope(o.scope, setting, community) || !can(o.place)) return [];
    const b = bind(o, seed, setting, person, f, cal);
    return b ? [{ o, ...b }] : [];
  });
  const named = bound.some((b) => !b.o.fallback);
  const scored = bound
    .map((b) => ({
      ...b,
      score:
        b.o.weight *
        (named && b.o.fallback ? FALLBACK : 1) *
        (person.aim && b.o.serves?.includes(person.aim.id) ? AIM_TILT : 1) *
        (0.5 + random(seed, "agenda", cal.day, person.actor.id, b.o.id)),
    }))
    .sort((a, b) => b.score - a.score || a.o.id.localeCompare(b.o.id));
  const roll = random(seed, "agenda-count", cal.day, person.actor.id);
  const want = roll < 0.15 ? 0 : roll < 0.7 ? 1 : 2;
  const picked: typeof scored = [];
  for (const s of scored) {
    if (picked.length >= want) break;
    // Two in one part of the day crowd each other; the second waits.
    if (picked.some((p) => p.o.part === s.o.part)) continue;
    picked.push(s);
  }
  // Anything dated to today outranks the count: nobody skips their own birthday.
  for (const s of scored)
    if (!picked.includes(s) && s.o.when.some((t) => t.type === "anniversary" || t.type === "date"))
      picked.push(s);
  return picked.map(({ o, text, subject }) => ({
    id: o.id,
    text,
    part: o.part,
    place: o.place,
    activity: o.activity,
    minutes: o.minutes,
    carry: o.carry,
    evidence: o.evidence,
    note: o.note,
    sources: o.sources,
    subject,
  }));
}

/** "Bring an offering to Mercury." as a station label: "Bringing an
 * offering to Mercury", in the third person unless it is the player's. */
export function asDoing(text: string, own: boolean) {
  const clause = text.split(/[:.]/)[0].trim();
  const [verb, ...rest] = clause.split(" ");
  const v = verb.toLowerCase();
  const irregular: Record<string, string> = { lie: "lying", die: "dying", see: "seeing", be: "being" };
  const ing =
    irregular[v] ??
    (/^(sit|put|get|set|run|shop|stop|cut|hit|let)$/.test(v)
      ? v + v.at(-1) + "ing"
      : /[^e]e$/.test(v)
        ? v.slice(0, -1) + "ing"
        : v + "ing");
  let body = [ing[0].toUpperCase() + ing.slice(1), ...rest].join(" ");
  if (!own)
    body = body
      .replace(/\byourself\b/g, "themselves")
      .replace(/\byours\b/g, "theirs")
      .replace(/\byour\b/g, "their")
      .replace(/\byou\b/g, "them");
  return body;
}

/** A named client for the day's work at a bench or a stall, on most days. */
export function commissionFor(
  seed: string,
  day: number,
  self: Actor,
  actors: Actor[],
  good?: string,
) {
  if (random(seed, "commission", day) > 0.6) return undefined;
  const clients = actors.filter(
    (a) =>
      a.kind === "human" &&
      a.origin &&
      (a.age ?? 0) >= 18 &&
      a.householdId !== self.householdId,
  );
  if (!clients.length) return undefined;
  const client = first(clients[Math.floor(random(seed, "commission-client", day) * clients.length)]);
  return good
    ? `Finish the ${good} ${client} ordered.`
    : `Finish the order ${client} is waiting on.`;
}
