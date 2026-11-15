import type { ItemDef } from "../../core/types";

const def = (id: string, name: string, sprite: string, value: number, description: string, more: Partial<ItemDef> = {}): [string, ItemDef] =>
  [id, { id, name, sprite, value, description, ...more }];

/** What comes up out of a mine and is not already sold above it. */
export const mineItems: Record<string, ItemDef> = Object.fromEntries([
  def("coal", "Coal", "rock-2", 1, "Black lumps that burn hot and long. A pit family's fire comes out of the tubs."),
  def("cinnabar", "Cinnabar", "rock", 6, "Heavy red ore of mercury. Roasted, it gives up quicksilver, and poisons whoever breathes it."),
  def("galena", "Galena", "rock-1", 4, "Grey cubes of lead ore, often carrying silver."),
  def("fern-fossil", "Fossil fern", "rock", 8, "A fern frond pressed in black shale, older than any animal with a backbone on land."),
  def("pit-check", "Brass check", "coin", 1, "A numbered brass token that says its owner went down the pit."),
  def("pasty", "Pasty", "bread", 3, "Meat and turnip in a folded crust with a thick crimped edge to hold with dirty hands.", { edible: 30 }),
  def("self-rescuer", "Self-rescuer", "water-bottle", 6, "A steel tin on the belt holding a mouthpiece and a filter. Bitten on after an explosion, it turns the afterdamp's poison into air you can breathe, for about an hour."),
  def("canary", "Canary in a cage", "feathers", 8, "A canary in a small cage. It wilts in bad air long before you would."),
  def("gold-nugget", "Gold nugget", "coin", 60, "A rough lump of native gold, heavy for its size."),
]);

/** The item a mine's "ore" stands for, and its richer grade. */
export function oreItems(ore: string): { ore: string; rich: string } {
  const plain: Record<string, string> = { coal: "coal", salt: "salt", mercury: "cinnabar", lead: "galena", zinc: "galena", tin: "tin-ore", copper: "copper-ore", silver: "silver-ore", gold: "gold-ore", iron: "iron-ore" };
  const item = plain[ore] ?? "copper-ore";
  return { ore: item, rich: item.endsWith("-ore") ? `${item}-rich` : item };
}
