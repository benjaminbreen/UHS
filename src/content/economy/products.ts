import { goods } from "./goods";
import { matchesCharacterScope } from "../characters/resolve";
import { southAsianProducts } from "./south-asia";
import { westEurasianProducts } from "./west-eurasia";
import { eastAsianProducts } from "./east-asia";
import type { CharacterScope } from "../characters/context-types";
import type { WorldSetting } from "../geography/types";
import type { Actor, Household, HouseholdPurchase } from "../../core/types";

export type Product = {
  id: string;
  good: string;
  noun: string;
  input?: string;
  scope: CharacterScope;
  trades?: string[];
  sources: string[];
  note: string;
};
const products: Product[] = [...southAsianProducts, ...westEurasianProducts, ...eastAsianProducts];
export const productById = (id: string | undefined) => products.find((p) => p.id === id);

export function productFor(good: string, setting: WorldSetting, trade?: string) {
  return products.find((p) => p.good === good &&
    (!p.trades || (!!trade && p.trades.includes(trade))) && matchesCharacterScope(p.scope, setting))?.id ??
    (good === "drink" ? "fermented-drink" : good);
}

export function goodName(good: string, product?: string) {
  const resolved = productById(product);
  return (resolved?.good === good ? resolved.noun : undefined) ?? (good === "drink" && product === "fermented-drink" ? "fermented drink" :
    goods.find((g) => g.id === good)?.noun ?? good);
}

export function sellerOf(buy: HouseholdPurchase, households: Household[], actors: Actor[]) {
  const from = households.find((h) => h.id === buy.from);
  if (!from?.makes?.includes(buy.good)) return;
  if (buy.seller && from.producers?.[buy.good] && buy.seller !== from.producers[buy.good]) return;
  if (buy.product && from.products?.[buy.good] && buy.product !== from.products[buy.good]) return;
  const id = buy.seller ?? from.producers?.[buy.good] ?? from.members[0];
  return actors.find((a) => a.id === id && from.members.includes(a.id) &&
    a.kind === "human" && !a.dead && (a.age ?? 30) >= 18);
}
