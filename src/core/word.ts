import type { Actor, Ask, HouseholdEvent, Snapshot, Word } from "./types";

const same = (x: Word, y: Word) => x.act === y.act && x.object === y.object && x.victim === y.victim && x.about === y.about;

/** What a person carries and would pass on. Strongest and newest kept; the
 * same story is not held twice. */
export function hear(a: Actor, w: Word) {
  const list = (a.word ??= []);
  const had = list.find((x) => same(x, w));
  if (had) {
    if (w.hops < had.hops) Object.assign(had, w);
    return false;
  }
  list.push(w);
  list.sort((x, y) => Math.abs(y.tone) - Math.abs(x.tone) || y.at - x.at);
  list.length = Math.min(list.length, 8);
  return list.includes(w);
}

/** A story as this teller would put it, the player its unspoken subject.
 * Told on, it loses first whose it was, then what was done at all. */
export function telling(w: Word, name: (id: string) => string | undefined) {
  if (w.about || (!w.object && !w.victim)) return w.act;
  const whose = w.victim ? name(w.victim) : undefined;
  if (w.hops >= 3) return w.tone < 0 ? "made trouble for people" : "did people good turns";
  if (!w.object) return `${w.act} ${w.hops >= 2 || !whose ? "someone" : whose}`;
  return w.hops >= 2 || !whose ? `${w.act} a ${w.object}` : `${w.act} ${whose}'s ${w.object}`;
}

/** Second-hand stories about the player across everyone who carries them,
 * each as the best-informed teller has it. */
export function reputation(s: Snapshot) {
  const told: { w: Word; people: number }[] = [];
  for (const a of s.actors)
    for (const w of a.word ?? []) {
      if (!w.hops || w.about) continue;
      const t = told.find((x) => same(x.w, w));
      if (!t) told.push({ w, people: 1 });
      else {
        t.people++;
        if (w.hops < t.w.hops) t.w = w;
      }
    }
  const name = (id: string) => s.actors.find((a) => a.id === id)?.name;
  return told.sort((x, y) => y.people - x.people).map(({ w, people }) => ({ what: telling(w, name), tone: w.tone, people }));
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
