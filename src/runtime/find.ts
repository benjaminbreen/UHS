import type { Point, Snapshot } from "../core/types";
import { faunaProfile } from "../content/fauna";

/** Something in the loaded world the player can be walked to. `words` are what
 * a typed search is matched against; `rank` breaks ties between two equally
 * close targets, so "find animals" prefers an animal to a herder. */
export type FindTarget = {
  label: string;
  point: Point;
  space: string;
  words: string[];
  rank: number;
};

const VERBS =
  /^\s*(?:find|locate|go to|goto|walk to|head (?:to|for)|approach|hunt)\b/i;
const FILLER =
  /^(?:the|a|an|some|any|my|nearest|closest|nearby|first|me|to|for|of)$/;

/** Splits a name into lowercase words, dropping punctuation. */
function words(...parts: (string | undefined)[]) {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);
}

/** Every animal and person currently loaded, as search targets. The caller
 * syncs the snapshot's animals first: `world.fauna` hands out each block once
 * and a search must not consume one the engine has not taken. */
export function findTargets(state: Snapshot): FindTarget[] {
  const out: FindTarget[] = [];
  for (const group of state.fauna ?? []) {
    const profile = faunaProfile(group.speciesId);
    const kind = [
      "animal",
      profile?.category ?? "animal",
      ...(group.owner ? ["livestock", "kept", "tame"] : []),
      ...(profile?.locomotion === "ground-and-flight" ? ["bird"] : []),
      ...(profile?.category === "wild" ? ["game", "quarry"] : []),
    ];
    const name = profile?.label.replace(/ study$/, "") ?? group.speciesId;
    for (const m of group.members)
      out.push({
        label: name,
        point: { x: m.x, y: m.y },
        space: group.pos.space,
        words: [...words(group.speciesId, name), ...kind],
        rank: 0,
      });
  }
  for (const a of state.actors) {
    if (a.id === state.player.id) continue;
    // Non-human actors are the older generators' animals; they answer to the
    // same searches as a fauna group so "find animals" never misses one.
    const kind =
      a.kind === "human"
        ? ["person", "people", "someone", "somebody", "villager"]
        : ["animal", a.kind, "livestock"];
    out.push({
      label: a.name,
      point: { x: a.pos.x, y: a.pos.y },
      space: a.pos.space,
      words: [...words(a.name, a.role), ...kind],
      rank: a.kind === "human" ? 1 : 0,
    });
  }
  return out;
}

/** Parses a typed line into a search, or returns undefined if it is not one.
 * A bare "hunt" means the nearest wild animal. */
export function parseFind(input: string) {
  const verb = input.match(VERBS);
  if (!verb) return undefined;
  const terms = words(input.slice(verb[0].length)).filter(
    (w) => !FILLER.test(w),
  );
  const hunting = /hunt/i.test(verb[0]);
  if (!terms.length) return hunting ? ["wild"] : undefined;
  return hunting ? [...terms, "wild"] : terms;
}

/** A target word matches a search term on a whole word, allowing the plural a
 * player naturally types: "chickens" finds a chicken, "wolves" a wolf. */
function hits(word: string, term: string) {
  const stems = [term, term.replace(/ies$/, "y"), term.replace(/(?:es|s)$/, "")];
  return stems.includes(word);
}

/** The closest target matching every term, or undefined. Distance is measured
 * in the player's own space, so a search never walks through a wall into a
 * house it cannot reach. */
export function findNearest(
  state: Snapshot,
  terms: string[],
  targets = findTargets(state),
) {
  const from = state.player.pos;
  let best: FindTarget | undefined;
  let bestScore = Infinity;
  for (const t of targets) {
    if (t.space !== from.space) continue;
    if (!terms.every((term) => t.words.some((w) => hits(w, term)))) continue;
    const score =
      Math.hypot(t.point.x - from.x, t.point.y - from.y) + t.rank * 0.001;
    if (score < bestScore) (bestScore = score), (best = t);
  }
  return best;
}
