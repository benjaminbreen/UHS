import { random } from "./random";
import { statsOf } from "./stats";
import { standingOf } from "./standing";
import { stances } from "../content/outlook";
import { matchesCharacterScope } from "../content/characters/resolve";
import {
  stanceKinds,
  type Stance,
  type StanceTag,
} from "../content/outlook/types";
import type { WorldSetting } from "../content/geography/types";
import type { Actor, Stats } from "./types";

export type Outlook = {
  /** Ordered most unusual first, so a caller that can only afford one line
   * takes the thing worth saying. */
  stances: Stance[];
  tags: Set<StanceTag>;
};
/** Chance of holding a stance of each kind beyond the temper, which everyone
 * has. Two or three positions reads as a person; five reads as a survey. */
const CARRIED = 0.5;
/** How far the personality moves a weight. A heterodox stance at weight 1
 * against an orthodox 20 stays rare in the most curious person alive. */
const LEAN = 0.6;
/**
 * Openness pushes toward the heterodox, conscientiousness toward the
 * orthodox. Read off the two traits only: a strong person is not a radical.
 */
function leaned(stance: Stance, stats: Stats) {
  if (!stance.lean) return stance.weight;
  const pull =
    stance.lean === "heterodox"
      ? (stats.openness - stats.conscientiousness) / 100
      : (stats.conscientiousness - stats.openness) / 100;
  return stance.weight * (1 + LEAN * pull);
}
/** How far an unnamed stand-in is discounted where the scope has named
 * traditions of the same kind. Without it the generals, whose weights are set
 * for a thin record, drown the content written for a thick one. */
const FALLBACK = 1 / 4;
function pick(pool: Stance[], stats: Stats, roll: number) {
  const named = pool.some((s) => !s.fallback);
  const weights = pool.map(
    (s) => leaned(s, stats) * (named && s.fallback ? FALLBACK : 1),
  );
  let n = roll * weights.reduce((a, b) => a + b, 0);
  return pool[weights.findIndex((weight) => (n -= weight) < 0)] ?? pool[0];
}
/**
 * What this person believes, beyond which powers they attend to. Derived and
 * seeded rather than stored, like `statsOf` and `standingOf`: a village costs
 * nothing to give convictions, and the same person believes the same things
 * every time the settlement is generated.
 *
 * A scope with no named tradition authored still returns a believing person,
 * because the generals cover every year the game runs over.
 */
export function outlookOf(
  seed: string,
  actor: Pick<Actor, "id" | "origin" | "age" | "appearance" | "stats">,
  setting: WorldSetting,
): Outlook {
  const stats = statsOf(seed, actor);
  const rank = standingOf(seed, actor)?.rank;
  const community = actor.origin?.community;
  const eligible = stances.filter(
    (s) =>
      matchesCharacterScope(s.scope, setting, community ?? "*") &&
      (!s.ranks || (rank !== undefined && s.ranks.includes(rank))),
  );
  const held: Stance[] = [];
  for (const kind of stanceKinds) {
    const pool = eligible.filter((s) => s.kind === kind);
    if (!pool.length) continue;
    if (
      kind !== "temper" &&
      random(seed, "outlook", actor.id, `${kind}-carried`) >= CARRIED
    )
      continue;
    held.push(pick(pool, stats, random(seed, "outlook", actor.id, kind)));
  }
  // Rarest first: what marks this person out from the street is the thing a
  // one-line summary should spend itself on.
  held.sort((a, b) => a.weight - b.weight);
  return {
    stances: held,
    tags: new Set(held.flatMap((s) => s.tags)),
  };
}
/** The one or two positions worth putting in a prompt line. */
export function describeOutlook(outlook: Outlook, n = 2): string {
  return outlook.stances
    .slice(0, n)
    .map((s) => s.label.toLowerCase())
    .join("; ");
}
/** Two words at most, for a panel line that cannot take a sentence. The full
 * label and the note belong on the character's own page. */
export const shortLabel = (stance: Stance) => stance.short ?? stance.label;

/** Tags that pull against each other. A sentence joining two of these wants
 * "yet" rather than "and", which is the whole of the grammar here. */
const opposed: [StanceTag, StanceTag][] = [
  ["egalitarian", "hierarchical"],
  ["sceptical", "devout"],
  ["ascetic", "worldly"],
  ["traditionalist", "reformist"],
  ["traditionalist", "revolutionary"],
  ["communal", "individualist"],
  ["universalist", "particularist"],
  ["rationalist", "mystical"],
  ["quietist", "martial"],
  ["mercantile", "agrarian"],
  ["restorationist", "reformist"],
];
const pulls = (a: Stance, b: Stance) =>
  opposed.some(
    ([x, y]) =>
      (a.tags.includes(x) && b.tags.includes(y)) ||
      (a.tags.includes(y) && b.tags.includes(x)),
  );
const capitalize = (line: string) => line[0].toUpperCase() + line.slice(1);
/**
 * The held positions as one sentence. `subject` is omitted in the panel, where
 * the heading already says whose outlook it is and the sentence reads as a
 * note in a ledger: "Values the judgement of the ancestors, yet doubts what
 * cannot be shown."
 */
export function outlookSentence(
  outlook: Outlook,
  subject?: string,
  most = 3,
): string {
  const held = outlook.stances.slice(0, most);
  if (!held.length) return "";
  const parts = held.map((s) => s.clause);
  // Two clauses take one connective; three take a comma and then the last
  // connective, which is where a contradiction reads best if there is one.
  const joint = (i: number) => (pulls(held[i - 1], held[i]) ? "yet" : "and");
  // A clause that already contains "and" needs a comma before the connective,
  // or the sentence reads as one long list: "keeps the forms and believes
  // little and owes a failed ruler nothing".
  const lead = (i: number) =>
    parts[i - 1].includes(" and ") || parts[i].includes(" and ") ? "," : "";
  const body =
    parts.length === 1
      ? parts[0]
      : parts.length === 2
        ? `${parts[0]}${lead(1)} ${joint(1)} ${parts[1]}`
        : `${parts[0]}, ${parts[1]}, ${joint(2)} ${parts[2]}`;
  return subject
    ? `${subject} ${body}.`
    : `${capitalize(body)}.`;
}
