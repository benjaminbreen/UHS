import { CONDITIONS, type ConditionDef, type HealthPerson } from "../content/health/conditions";
import { AILMENTS, type AilmentDef, type Season } from "../content/health/ailments";
import { matchesCharacterScope } from "../content/characters/resolve";
import { sexOf } from "./brief";
import { seasonAt } from "./livelihood";
import { random } from "./random";
import type { Actor, Snapshot } from "./types";
import type { CharacterScope } from "../content/characters/context-types";
import type { WorldSetting } from "../content/geography/types";

/** An illness or hurt under way. How it ends is fixed when it starts, and
 * sitting with the sick can turn a death into a recovery. */
export type Ailment = {
  id: string;
  who: string;
  since: number;
  days: number;
  course: "mend" | "linger" | "die";
  /** Someone sat with them while it was at its worst; checked once. */
  tended?: boolean;
};

const DAY = 86400;

export const healthPerson = (a: Actor, setting?: WorldSetting): HealthPerson => ({
  age: a.age ?? 30,
  sex: sexOf(a),
  setting,
  role: a.role.toLowerCase(),
});

/** What something was called here and now. */
export function nameFor(def: { names: readonly { scope?: CharacterScope; name: string }[] }, setting?: WorldSetting) {
  return (setting && def.names.find((n) => n.scope && matchesCharacterScope(n.scope, setting)))?.name ?? def.names.at(-1)!.name;
}

/** Lasting conditions, from the seed as stats are, most marking first. */
export function conditionsOf(seed: string, a: Actor, setting?: WorldSetting): ConditionDef[] {
  if (a.kind !== "human") return [];
  const p = healthPerson(a, setting);
  return CONDITIONS.filter((c) => random(seed, "condition", a.id, c.id) < c.rate(p))
    .sort((x, y) => y.salience - x.salience);
}

export const ailmentDef = (id: string) => AILMENTS.find((d) => d.id === id)!;

/** How ill, 0 to 1, by how far through its course it is. */
export function severity(ail: Ailment, clock: number) {
  const t = (clock - ail.since) / (ail.days * DAY);
  if (t < 0 || t >= 1) return 0;
  if (ail.course === "die") return Math.min(1, 0.35 + t * 0.7);
  if (ail.course === "linger") return Math.min(0.6, 0.35 + t);
  return 0.15 + 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.3));
}

/** "since yesterday", "for three days", "for a week". */
export function forHowLong(ail: Ailment, clock: number, words: (n: number) => string) {
  const n = Math.floor((clock - ail.since) / DAY);
  return n < 1 ? "since last night" : n === 1 ? "since yesterday" : n < 7 ? `for ${words(n)} days`
    : n < 11 ? "for a week" : n < 18 ? "for more than a week" : "for weeks";
}

function start(seed: string, def: AilmentDef, a: Actor, p: HealthPerson, clock: number, underway: boolean, mortal: boolean): Ailment {
  const r = (k: string) => random(seed, "ailment", k, a.id, def.id, Math.floor(clock / 3600));
  const days = def.days[0] + Math.floor(r("days") * (def.days[1] - def.days[0] + 1));
  const deadly = mortal ? def.deadly(p) : 0;
  const roll = r("course");
  const course = roll < deadly ? "die" : roll < deadly + 0.2 ? "linger" : "mend";
  // Already under way when a life begins, at most halfway through its course.
  const since = underway ? clock - Math.floor((0.5 + r("since") * days * 0.5) * DAY) : clock;
  return { id: def.id, who: a.id, since, days, course };
}

const seasonOf = (setting: WorldSetting | undefined, clock: number) =>
  seasonAt(setting?.season ?? "spring", clock) as Season;

/** Who is ill as the life begins: each person by the day's rates, and some
 * mothers of this year's babies still lying in. The player can be ill but
 * not mortally, and nobody the plot needs is ill at all. */
export function seedAilments(s: Snapshot, setting: WorldSetting | undefined, spare: ReadonlySet<string>): Ailment[] {
  const seed = s.manifest.seed, season = seasonOf(setting, s.clock);
  const out: Ailment[] = [];
  for (const a of s.actors) {
    if (a.kind !== "human" || a.dead || spare.has(a.id)) continue;
    const p = { ...healthPerson(a, setting), season };
    const def = AILMENTS.find((d) => random(seed, "ill", a.id, d.id) < d.rate(p));
    if (def) out.push(start(seed, def, a, p, s.clock, true, a.id !== s.player.id));
  }
  const childbed = ailmentDef("childbed");
  for (const h of s.households ?? []) {
    if (!setting || !h.history?.some((e) => e.kind === "born" && e.year === setting.year)) continue;
    const mother = s.actors.find((a) => h.members.includes(a.id) && sexOf(a) === "female" &&
      (a.age ?? 0) >= 16 && (a.age ?? 99) <= 45 && a.relations?.some((r) => r.kind === "partner"));
    if (mother && !spare.has(mother.id) && !out.some((x) => x.who === mother.id) && random(seed, "childbed", mother.id) < 0.4)
      out.push(start(seed, childbed, mother, healthPerson(mother, setting), s.clock, true, mother.id !== s.player.id));
  }
  return out;
}

/** New cases this hour: a day's prevalence spread over the course's length. */
export function onsets(s: Snapshot, setting: WorldSetting | undefined, spare: ReadonlySet<string>): Ailment[] {
  const seed = s.manifest.seed, season = seasonOf(setting, s.clock), hour = Math.floor(s.clock / 3600);
  const ill = new Set((s.ailments ?? []).map((x) => x.who));
  const out: Ailment[] = [];
  for (const a of s.actors) {
    if (a.kind !== "human" || a.dead || ill.has(a.id) || spare.has(a.id)) continue;
    const p = { ...healthPerson(a, setting), season };
    for (const def of AILMENTS) {
      const perHour = def.rate(p) / ((def.days[0] + def.days[1]) / 2) / 24;
      if (perHour > 0 && random(seed, "onset", a.id, def.id, hour) < perHour) {
        out.push(start(seed, def, a, p, s.clock, false, a.id !== s.player.id));
        break;
      }
    }
  }
  return out;
}
