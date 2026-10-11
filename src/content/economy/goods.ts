import type { Livelihood } from "../characters/context-types";

/** `match` retains the old production inference for pinned generation inputs. */
export type Good = { id: string; noun: string; need?: boolean; match: RegExp };
export const goods: Good[] = [
  { id: "bread", noun: "bread", need: true, match: /bak|bread|mill|oven/ },
  {
    id: "grain",
    noun: "grain",
    match:
      /farm|villein|cottager|thresh|tenant|field|cultivat|husband|peasant|plough|reap|serf|irrigat/,
  },
  {
    id: "drink",
    noun: "ale",
    need: true,
    match: /brew|alewife|ale-|beer|wine|vint|vine|tavern|inn/,
  },
  {
    id: "meat",
    noun: "meat",
    match: /butcher|slaught|herd|shepherd|swine|goat|drover/,
  },
  { id: "fish", noun: "fish", match: /fish|boatman/ },
  { id: "oil", noun: "oil", match: /oil|olive|press/ },
  {
    id: "cloth",
    noun: "cloth",
    need: true,
    match: /weav|fuller|dyer|wool|spin|tailor|seam|flax|linen|draper|cloth|dressmak/,
  },
  {
    id: "pots",
    noun: "pots",
    need: true,
    match: /pott|basket|cooper|glazier/,
  },
  {
    id: "ironwork",
    noun: "ironwork",
    need: true,
    match: /smith|armour|farrier|cutler|nail/,
  },
  {
    id: "leather",
    noun: "shoes",
    match: /cobbl|shoe|leather|saddl|tann|cordwain/,
  },
  {
    id: "timber",
    noun: "timber",
    match: /carpent|wheelwright|joiner|thatch|sawyer|wood/,
  },
  { id: "light", noun: "candles", match: /candle|chandler|soap|tallow/ },
  { id: "milk", noun: "milk", match: /^$/ },
];
/** Bread can be bought as grain where no one bakes. */
export const standsIn: Record<string, string> = { bread: "grain" };

const byTrade: Record<string, string[]> = {
  baker: ["bread"], miller: ["grain"], butcher: ["meat"],
  dairymaid: ["milk"], milkmaid: ["milk"], "dairy-farmer": ["milk"], confectioner: [],
  innkeeper: ["drink"], publican: ["drink"],
  "basket-weaver": ["pots"], "basket-maker": ["pots"], cooper: ["pots"],
  "net-maker": [], "vine-dresser": [], "market-gardener": [],
  "tea-grower": [], "tea-picker": [], "cotton-grower": [], "jute-grower": [],
  "date-cultivator": [], "coca-grower": [], "coffee-picker": [], "palm-tapper": [],
  "irrigation-keeper": [], ostler: [],
};
const byActivity: Record<string, string[]> = {
  "Tending cultivation": ["grain"], "Watching the crop": ["grain"],
  "Bringing in the crop": ["grain"], "Working the smallholding": ["grain"],
  "Working the grain": ["grain"], "Tending animals": ["meat"],
  "Working near water": ["fish"], "Working the water": ["fish"],
  Brewing: ["drink"], "Pressing oil": ["oil"],
  "Working cloth": ["cloth"], "Making clothes": ["cloth"],
  "Working hides": ["leather"], "Working leather": ["leather"], "Making shoes": ["leather"],
  "Working wood": ["timber"], "Working timber": ["timber"], "Cutting timber": ["timber"],
  "Turning pots": ["pots"], "Working metal": ["ironwork"], "Making candles": ["light"],
};

export function goodsOf(kit: Livelihood | undefined, revision = 0) {
  if (!kit) return [];
  if (revision) return byTrade[kit.trade ?? kit.id] ?? byActivity[kit.activity] ?? [];
  const words = `${kit.id} ${kit.label} ${kit.activity}`.toLowerCase();
  return goods.filter((g) => g.match.test(words)).map((g) => g.id);
}
