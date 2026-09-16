import { random } from "./random";
import { livelihoodById } from "../content/characters/livelihoods";
import type { Rank } from "../content/characters/context-types";
import type { Actor } from "./types";

export type Standing = {
  /** Where the work placed them locally. */
  rank: Rank;
  /** False only for work held under compulsion; it cuts across the ranks. */
  free: boolean;
  /** 0-100, bounded by the rank. Two smiths differ; a smith and an earl do not
   * overlap. */
  wealth: number;
};
/** Each rank's slice of the 0-100 scale. The bands touch but do not overlap,
 * so wealth never contradicts the rank it came from. */
const bands: Record<Rank, [number, number]> = {
  destitute: [0, 12],
  labouring: [12, 38],
  middling: [38, 70],
  gentry: [70, 90],
  elite: [90, 100],
};
/** Sum of two draws, as `rollStats` does: the middle of a band is common. */
function within(seed: string, id: string, [low, high]: [number, number]) {
  const t =
    (random(seed, "standing", id, "wealth", 0) +
      random(seed, "standing", id, "wealth", 1)) /
    2;
  return Math.round(low + (high - low) * t);
}
/**
 * Class position, derived rather than stored: it follows from the work, and
 * the work already knows the century and the culture it was drawn for. An
 * unstratified society is level because the only livelihoods it offers are
 * `labouring`, not because of a rule here.
 */
export function standingOf(
  seed: string,
  actor: Pick<Actor, "id" | "origin">,
): Standing | undefined {
  const origin = actor.origin;
  if (!origin) return undefined;
  const work = livelihoodById(origin.livelihood);
  if (!work?.rank) return undefined;
  const free = (origin.standing ?? work.standing ?? "free") === "free";
  // Bondage does not make someone middling, whatever the trade was worth to
  // the household holding them, and it leaves them nothing of their own.
  const rank: Rank =
    free ? work.rank
    : work.rank === "destitute" ? "destitute"
    : "labouring";
  const band = free ? bands[rank] : bands.destitute;
  return { rank, free, wealth: within(seed, actor.id, band) };
}
/** One phrase for the panel and the dialogue prompt. */
export function describeStanding(s: Standing): string {
  return s.free ? s.rank : "held in bondage";
}
