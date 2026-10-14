import type { Actor, Ask, HouseholdEvent, Snapshot, Word } from "./types";

/** What a person carries about the player and would pass on. Strongest and
 * newest kept; the same story is not held twice. */
export function hear(a: Actor, w: Word) {
  const list = (a.word ??= []);
  const had = list.find((x) => x.what === w.what);
  if (had) {
    if (w.hops < had.hops) Object.assign(had, w);
    return false;
  }
  list.push(w);
  list.sort((x, y) => Math.abs(y.tone) - Math.abs(x.tone) || y.at - x.at);
  list.length = Math.min(list.length, 8);
  return list.includes(w);
}

/** A "Saw player smash pot-3 at 4,5" memory as something that can be retold. */
const PAST: Record<string, string> = { break: "broke", smash: "smashed", take: "took", strike: "struck", kill: "killed", topple: "toppled", pick: "picked", cut: "cut" };
export const retold = (memory: string) =>
  memory
    .replace(/^Saw player /, "")
    .replace(/ at -?\d+,-?\d+$/, "")
    .replace(/^\w+/, (verb) => PAST[verb] ?? verb);

/** Second-hand stories about the player across everyone who carries them. */
export function reputation(s: Snapshot) {
  const told = new Map<string, { what: string; tone: number; people: number }>();
  for (const a of s.actors)
    for (const w of a.word ?? []) {
      if (!w.hops || w.about) continue;
      const t = told.get(w.what) ?? { what: w.what, tone: 0, people: 0 };
      t.people++;
      t.tone = Math.sign(w.tone) || t.tone;
      told.set(w.what, t);
    }
  return [...told.values()].sort((x, y) => y.people - x.people);
}

export const askLines: Record<Ask["kind"], (what: string) => string> = {
  bring: (what) => `Could you ${what}? I would not forget it.`,
  food: () => "I have not eaten since yesterday. Have you anything to spare?",
  "talk-to": (what) => `Will you ${what} for me?`,
  "go-to": (what) => `Would you ${what}? I can't get away.`,
};

/** What a household's recent years give its neighbours to talk about, and
 * how good or bad the news is. */
export const tidings: Partial<Record<HouseholdEvent["kind"], [(name: string, e: HouseholdEvent) => string, number]>> = {
  died: [(n, e) => `${n} buried ${e.as ? `their ${e.as}` : e.name ?? "one of their own"}`, -3],
  fire: [(n) => `${n}'s household lost their house to fire`, -4],
  "bad-year": [(n) => `${n}'s household had a hard year and are going without`, -3],
  "good-year": [(n) => `${n}'s household did well this year and are putting on airs`, 2],
  robbed: [(n) => `${n}'s household was robbed`, -3],
  wed: [(n, e) => `there was a wedding at ${n}'s${e.name ? `: ${e.name}` : ""}`, 3],
  born: [(n) => `${n}'s household has a new baby`, 3],
  left: [(n, e) => `${e.name ?? "someone"} walked out of ${n}'s household`, -3],
  joined: [(n, e) => `${e.name ?? "someone new"} has come to live at ${n}'s`, 2],
};
