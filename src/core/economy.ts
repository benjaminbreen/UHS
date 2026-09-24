import { goods, standsIn } from "../content/economy/goods";
import type { Economy, Household } from "./types";

/**
 * Per good: units a working adult makes a day, and units each member uses a
 * day. Gameplay scale; what matters is the ratio, roughly how many people one
 * worker supplies. Durables are needed rarely.
 */
const rates: Record<string, { make: number; need?: number }> = {
  bread: { make: 30, need: 1 },
  drink: { make: 30, need: 0.5 },
  grain: { make: 10 },
  meat: { make: 4 },
  fish: { make: 6 },
  oil: { make: 6 },
  cloth: { make: 1, need: 0.02 },
  pots: { make: 3, need: 0.03 },
  ironwork: { make: 1, need: 0.01 },
  leather: { make: 1 },
  timber: { make: 2 },
  light: { make: 8, need: 0.1 },
};
/** A household stops making once it has three days' making in hand. */
const cap = (good: string) => (rates[good]?.make ?? 1) * 3;
/** Longest absence a map catches up on; a longer one is treated as this. */
export const CATCH_UP_HOURS = 24 * 14;
/** What a trade uses up, one for one, when someone in town makes it. */
const inputs: Record<string, string> = { bread: "grain", drink: "grain" };
const needed = goods.filter((g) => g.need).map((g) => g.id);

/**
 * Advance every household's stock by whole hours up to `hour`. Hourly steps
 * whether in play or catching up, so a map left for three days ends where it
 * would have after three days in view.
 */

export function runEconomy(
  households: Household[],
  economy: Economy,
  hour: number,
  workers: (h: Household) => number,
) {
  const start = Math.max(economy.hour, hour - CATCH_UP_HOURS);
  economy.hour = Math.max(economy.hour, hour);
  if (hour <= start) return;
  const take = (from: Household, good: string, n: number) => {
    const stock = economy.stock[from.id];
    const have = stock?.[good] ?? 0;
    if (stock) stock[good] = Math.max(0, have - n);
    return have >= n;
  };
  const byId = new Map(households.map((h) => [h.id, h]));
  const nearest = new Map<string, Household>();
  const wanted = new Set([...Object.values(inputs), ...Object.values(standsIn)]);
  for (const h of households)
    for (const good of wanted) {
      let best: Household | undefined, d = Infinity;
      for (const s of households) {
        if (s === h || !s.makes?.includes(good)) continue;
        const e = Math.hypot(s.home.x - h.home.x, s.home.y - h.home.y);
        if (e < d) [best, d] = [s, e];
      }
      if (best) nearest.set(h.id + good, best);
    }
  const hands = new Map(households.map((h) => [h.id, workers(h)]));

  for (let t = start; t < hour; t++)
    for (const h of households) {
      const stock = (economy.stock[h.id] ??= Object.fromEntries(
        (h.makes ?? []).map((g) => [g, rates[g]?.make ?? 1]),
      ));
      const share = (hands.get(h.id) ?? 0) / 24 / (h.makes?.length || 1);
      for (const good of h.makes ?? []) {
        let n = Math.min(
          (rates[good]?.make ?? 1) * share,
          cap(good) - (stock[good] ?? 0),
        );
        const from = inputs[good] && nearest.get(h.id + inputs[good]);
        if (from) {
          n = Math.min(n, economy.stock[from.id]?.[inputs[good]] ?? 0);
          if (n > 0) economy.stock[from.id][inputs[good]] -= n;
        }
        if (n > 0) stock[good] = (stock[good] ?? 0) + n;
      }
      const short: string[] = [];
      for (const need of needed) {
        const buy = h.buys?.find(
          (b) => b.good === need || b.good === standsIn[need],
        );
        const good = buy?.good ?? need;
        const seller = h.makes?.includes(good) ? h : buy && byId.get(buy.from);
        if (!seller) continue;
        const want = ((rates[need]?.need ?? 0) * h.members.length) / 24;
        if (take(seller, good, want)) continue;
        // Short of bread, a household buys grain from its nearest farm.
        const plain = standsIn[good] && nearest.get(h.id + standsIn[good]);
        if (!plain || !take(plain, standsIn[good], want)) short.push(need);
      }
      if (short.length) economy.short[h.id] = short;
      else delete economy.short[h.id];
    }
}
