import { goodsOf } from "../content/economy/goods";
import { wares } from "../content/economy/wares";
import { matchesCharacterScope } from "../content/characters/resolve";
import { livelihoodOf } from "../world/v3/routines";
import { isWayfarer } from "../world/v3/wayfarers";
import { random } from "./random";
import type { Actor, Inventory, ItemDef, ItemId, Pack } from "./types";

/** What each kind of good puts on a counter, from the items the game has. */
const SHELF: Record<string, ItemId[]> = {
  bread: ["bread", "grain"],
  grain: ["grain", "seeds", "straw"],
  meat: ["meat", "cooked-meat", "hide"],
  fish: ["fish"],
  milk: ["eggs"],
  cloth: ["wool", "flax", "cotton"],
  pots: [],
  ironwork: ["tool"],
  leather: ["hide", "footwear-shoes", "footwear-boots", "belt-leather"],
  timber: ["wood", "walking-cane"],
  light: [],
  drink: ["bread", "cooked-meat", "water"],
  oil: ["herbs"],
};
/** Goods whose makers also sell what they themselves wear. */
const DRESSED: Record<string, RegExp> = {
  cloth: /^(garment|leggings|headwear|mantle|cloak|shoulder)/,
  leather: /^(footwear|belt)/,
};
export const TRADER = /merchant|pedlar|peddler|trader|hawker|chapman|huckster|packman|bobusang|pochteca|caravan/i;

export type Shop = { day: number; stock: Inventory; purse: number };

/** Who keeps goods to sell: a craftsperson or shopkeeper at their work, or a
 * travelling merchant on the road. */
export function keepsShop(pack: Pack, actor: Actor) {
  if (actor.kind !== "human" || actor.dead || (actor.age ?? 30) < 14) return false;
  if (isWayfarer(actor.id)) return TRADER.test(actor.role);
  const kit = livelihoodOf(pack, actor);
  // Farmers and herders sell at market, not from the field; a porter dressed as a tailor is still a porter.
  if (!goodsOf(kit, pack.setting?.economyRevision).some((g) => g !== "grain" && (g !== "meat" || kit!.id === "butcher"))) return false;
  if ((actor.origin?.roleLabel ?? kit!.label).toLowerCase() !== actor.role.toLowerCase()) return false;
  return actor.pos.space === actor.work.space &&
    Math.abs(actor.pos.x - actor.work.x) + Math.abs(actor.pos.y - actor.work.y) <= 8;
}

/** The day's stock, the same for the same person on the same day. Someone
 * with no trade to stock from sells what they have about them. */
export function stockFor(
  pack: Pack,
  seed: string,
  actor: Actor,
  day: number,
  coined: boolean,
  item: (id: ItemId) => ItemDef | undefined,
): Shop {
  const roll = (...k: (string | number)[]) => random(seed, "shop", actor.id, day, ...k);
  const goods = goodsOf(livelihoodOf(pack, actor), pack.setting?.economyRevision);
  const ids = new Set<ItemId>(goods.flatMap((g) => SHELF[g] ?? []));
  const setting = pack.setting;
  for (const w of wares) if (goods.includes(w.good) && setting && matchesCharacterScope(w.scope, setting)) ids.add(w.id);
  const worn = Object.values(actor.worn ?? {}).filter((id): id is ItemId => !!id);
  for (const g of goods) for (const id of worn) if (DRESSED[g]?.test(id)) ids.add(id);
  // Helmets and arrowheads from the smith, until guns made them obsolete.
  if (goods.includes("ironwork") && pack.year < 1650) ids.add("headwear-helmet").add("arrow");
  if (isWayfarer(actor.id)) {
    for (const id of pack.commodities) if (roll("carry", id) < 0.6) ids.add(id);
    for (const id of worn) ids.add(id);
  }
  if (!ids.size) for (const [id, n] of Object.entries(actor.inventory)) if ((n ?? 0) > 0) ids.add(id);
  const stock: Inventory = {};
  for (const id of ids) {
    const def = item(id);
    if (!def || def.value <= 0 || id === "coin") continue;
    const many = def.edible || def.value <= 2 ? 6 : def.value <= 5 ? 3 : 2;
    stock[id] = 1 + Math.floor(roll("n", id) * many);
  }
  return { day, stock, purse: coined ? 15 + Math.floor(roll("purse") * 40) : 0 };
}
