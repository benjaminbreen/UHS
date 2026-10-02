import { resolveCharacterContext } from "../content/characters/resolve";
import { statKeys, statsOf } from "./stats";
import type { Actor, Stats } from "./types";
import type { WorldSetting } from "../content/geography/types";

/** Something about a person that few others share, with the share of people
 * who would have it: 0.005 is one in two hundred. */
export type Unusual =
  | { kind: "stat"; stat: keyof Stats; high: boolean; rarity: number }
  | { kind: "trade"; rarity: number };

/** A stat is the mean of two uniform draws, so its tails are triangular. */
function tail(value: number) {
  const x = Math.min(1, Math.max(0, (value - 10) / 80));
  const t = Math.min(x, 1 - x);
  return 2 * t * t;
}

/** About one person in a hundred and fifty, at each end of each stat. */
const STAT_RARITY = 0.007;
/** A trade under one in fifty of the local workforce, held by nobody else here.
 * Only in a village: a town's residents are a sample, and a traveller has no trade. */
const TRADE_RARITY = 0.02;

/** What marks this person out, rarest first; empty for most people. */
export function unusualOf(
  seed: string,
  actor: Actor,
  setting: WorldSetting | undefined,
  neighbours: readonly Actor[],
): Unusual[] {
  const stats = statsOf(seed, actor);
  const found: Unusual[] = statKeys.flatMap((stat) => {
    const rarity = tail(stats[stat]);
    return rarity <= STAT_RARITY ? [{ kind: "stat" as const, stat, high: stats[stat] > 50, rarity }] : [];
  });
  const trade = actor.origin?.livelihood;
  const small = setting && (setting.settlement === "village" || setting.settlement === "farm" || setting.settlement === "camp");
  if (setting && small && trade && trade !== "traveler" && !neighbours.some((a) => a.id !== actor.id && a.kind === "human" && a.role === actor.role)) {
    const pool = resolveCharacterContext(setting).livelihoods;
    const total = pool.reduce((n, l) => n + (l.weight ?? 1), 0);
    const share = (pool.find((l) => l.id === trade)?.weight ?? 0) / (total || 1);
    if (share > 0 && share < TRADE_RARITY) found.push({ kind: "trade", rarity: share });
  }
  return found.sort((a, b) => a.rarity - b.rarity);
}
