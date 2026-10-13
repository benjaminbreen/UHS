import type { Actor, Ask, Snapshot, Word } from "./types";

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
  list.length = Math.min(list.length, 6);
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
      if (!w.hops) continue;
      const t = told.get(w.what) ?? { what: w.what, tone: 0, people: 0 };
      t.people++;
      t.tone = Math.sign(w.tone) || t.tone;
      told.set(w.what, t);
    }
  return [...told.values()].sort((x, y) => y.people - x.people);
}

export const askLines: Record<Ask["kind"], (what: string) => string> = {
  fetch: (what) => `We have gone short of ${what}. If you could bring some, I would not forget it.`,
  food: () => "I have not eaten since yesterday. Have you anything to spare?",
  message: (what) => `Will you carry word to ${what} for me? Tell them I asked after them.`,
};
