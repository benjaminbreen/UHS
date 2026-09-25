import type { ItemDef } from "../../core/types";

/**
 * How an animal's dung lies, which is also what people did with it. A pat is
 * the fuel cake of India, Tibet and the steppe, and the floor and wall
 * plaster of much of Africa and Asia. Horse dung was swept off town streets
 * and sold to market gardens. Pellets were gathered off fold floors for the
 * fields; llama pellets were the Andean fuel. Fowl droppings were scraped from
 * roosts and dovecotes in bulk for tanning and saltpetre, never picked up a
 * dropping at a time.
 */
export type DungKind = "pat" | "pile" | "pellets" | "droppings";

export const dungOf: Partial<Record<string, DungKind>> = {
  cattle: "pat",
  "water-buffalo": "pat",
  aurochs: "pat",
  horse: "pile",
  foal: "pile",
  donkey: "pile",
  sheep: "pellets",
  goat: "pellets",
  camel: "pellets",
  llama: "pellets",
  "red-deer": "pellets",
  wapiti: "pellets",
  chicken: "droppings",
  turkey: "droppings",
  "rock-dove": "droppings",
  // Dried bison pats, "buffalo chips", were the fuel of the treeless plains.
  "american-bison": "pat",
  "steppe-bison": "pat",
  wisent: "pat",
  "wild-horse": "pile",
  "woolly-mammoth": "pile",
  "columbian-mammoth": "pile",
  "american-mastodon": "pile",
  "woolly-rhinoceros": "pile",
  "irish-elk": "pellets",
  reindeer: "pellets",
};

/** Droppings per animal per day, from husbandry figures: a cow passes a dozen
 * pats, a sheep a few dozen pellet groups. */
export const dungPerDay: Record<DungKind, number> = {
  pat: 12,
  pile: 9,
  pellets: 8,
  droppings: 14,
};

/** The item a kind leaves, fresh and once dry. Droppings leave none. */
export const dungItem: Record<Exclude<DungKind, "droppings">, [string, string]> = {
  pat: ["cow-dung", "dung-cake"],
  pile: ["horse-dung", "dry-horse-dung"],
  pellets: ["dung-pellets", "dung-pellets"],
};

/** Hours a dropping stays fresh, then crusted, before it is dry through. */
export const DUNG_FRESH_HOURS = 24;
export const DUNG_DRY_HOURS = 72;

const def = (
  id: string,
  name: string,
  sprite: string,
  description: string,
  flammable = false,
): ItemDef => ({ id, name, sprite, value: 0, description, flammable });

export const dungItems: Record<string, ItemDef> = {
  "cow-dung": def(
    "cow-dung",
    "Cow dung",
    "nature-dung-pat",
    "A fresh pat, still soft: for the fields, or for plastering a floor.",
  ),
  "dung-cake": def(
    "dung-cake",
    "Dung cake",
    "nature-dung-pat-dry",
    "Dried hard through. It burns slow and smoky.",
    true,
  ),
  "horse-dung": def(
    "horse-dung",
    "Horse dung",
    "nature-dung-pile",
    "Road dung, worth sweeping up for a garden.",
  ),
  "dry-horse-dung": def(
    "dry-horse-dung",
    "Dry horse dung",
    "nature-dung-pile-dry",
    "Dried out and light. It will burn, after a fashion.",
    true,
  ),
  "dung-pellets": def(
    "dung-pellets",
    "Dung pellets",
    "nature-dung-pellets",
    "A handful of pellets from a fold, for the fields or the fire.",
    true,
  ),
};
