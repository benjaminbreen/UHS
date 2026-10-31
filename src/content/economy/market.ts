import { endowmentFor, stapleName, tradeOf, type Endowment, type Ground } from "./endowments";
import { random } from "../../core/random";

/** What a market stall can sell: the trade its keeper dresses as, which
 * gives the stock; the mark on its sign (an index into `signLabels`); the
 * painted wares of a market kit that show it; and how much of it a place
 * has to sell, from what the country round gives and what it brings in. */
type StallGood = {
  dress: string;
  seller: string;
  noun: string;
  mark?: number;
  shows: string[];
  weight: (e: Endowment, lacks: string[]) => number;
};
const STALL: Record<string, StallGood> = {
  grain: { dress: "farmer", seller: "{staple} seller", noun: "{staple}", mark: 11, shows: ["grain", "rice", "maize", "potatoes", "yams", "greens", "dates"], weight: (e) => 1 + e.grain },
  bread: { dress: "baker", seller: "Baker", noun: "bread", mark: 3, shows: ["bread"], weight: () => 1 },
  fish: { dress: "fisher", seller: "Fish seller", noun: "fish", mark: 7, shows: ["fish"], weight: (e) => 1.5 * e.fish },
  salt: { dress: "salt-worker", seller: "Salt seller", noun: "salt", mark: 10, shows: ["salt"], weight: (e, lacks) => e.salt + (lacks.includes("salt") ? 1 : 0) },
  oil: { dress: "oil-presser", seller: "Oil seller", noun: "oil", mark: 5, shows: ["amphorae", "jugs", "shea"], weight: (e) => e.oil },
  meat: { dress: "butcher", seller: "Poulterer", noun: "poultry", shows: ["fowl"], weight: (e) => e.herds },
  milk: { dress: "dairymaid", seller: "Cheese seller", noun: "cheese", shows: ["cheese"], weight: (e) => 0.5 * e.herds },
  cloth: { dress: "weaver", seller: "Cloth seller", noun: "cloth", mark: 12, shows: ["cloth", "mantas", "silk", "rugs"], weight: () => 1.5 },
  pots: { dress: "potter", seller: "Pot seller", noun: "pots", mark: 5, shows: ["pottery", "porcelain", "calabashes"], weight: (e) => 0.75 * e.clay },
  leather: { dress: "leatherworker", seller: "Leather seller", noun: "leather goods", mark: 4, shows: ["leather"], weight: (e) => 0.5 * e.herds },
  ironwork: { dress: "smith", seller: "Ironmonger", noun: "ironware", mark: 2, shows: ["ironware", "brass"], weight: (e, lacks) => 0.5 * e.ore + (lacks.includes("ore") ? 0.5 : 0) },
};

/** One stall's good, the same for the same stall. Where the stall's art
 * paints its wares (`kitTrades`), only goods it can show are sold there, and
 * `trade` says which wares to paint. */
export function stallGood(g: Ground, seed: string, id: string, kitTrades?: readonly string[]) {
  const e = endowmentFor(g), lacks = tradeOf(g).lacks as string[];
  const options = Object.entries(STALL)
    .map(([good, s]) => {
      const shown = kitTrades ? kitTrades.flatMap((t, i) => (s.shows.includes(t) ? [i] : [])) : [];
      return { good, s, trade: shown.length ? shown[Math.floor(random(seed, "stall-ware", id) * shown.length)] : -1 };
    })
    .filter((o) => (!kitTrades || o.trade >= 0) && o.s.weight(e, lacks) > 0 && (o.good !== "ironwork" || g.year >= -1200));
  const total = options.reduce((n, o) => n + o.s.weight(e, lacks), 0);
  let x = random(seed, "stall-good", id) * total;
  const o = options.find((o) => (x -= o.s.weight(e, lacks)) < 0) ?? options.at(-1);
  if (!o) return;
  return { ...stallSeller(o.good, g)!, good: o.good, mark: o.s.mark, trade: o.trade >= 0 ? o.trade : undefined };
}

/** Who keeps a stall selling `good`: the trade to dress as, what to call them, and what they sell. */
export function stallSeller(good: string, g: Ground) {
  const s = STALL[good];
  if (!s) return;
  const staple = stapleName(g);
  return {
    dress: s.dress,
    seller: s.seller.replace("{staple}", staple.replace(/^./, (c) => c.toUpperCase())),
    noun: s.noun.replace("{staple}", staple),
  };
}
