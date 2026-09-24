import type { Livelihood } from "../characters/context-types";

/**
 * What a household makes for others, read off the words of its work. Coarse
 * on purpose: a town's ties come from who needs what from whom, and a dozen
 * goods is enough to give every household somewhere to buy. `need` marks what
 * every household buys unless it makes it.
 */
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
];
/** Bread can be bought as grain where no one bakes. */
export const standsIn: Record<string, string> = { bread: "grain" };

export function goodsOf(kit: Livelihood | undefined) {
  if (!kit) return [];
  const words = `${kit.id} ${kit.label} ${kit.activity}`.toLowerCase();
  return goods.filter((g) => g.match.test(words)).map((g) => g.id);
}
