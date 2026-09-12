import {
  beltStyles,
  garments,
  headwear,
  type CharacterAppearance,
} from "../../core/character";
import type { ItemDef, ItemId } from "../../core/types";

/** Generic wearables, one per look the renderers already draw. Colours stay
 * the wearer's own; wardrobe kits will add specific garments on top. */
const label: Record<CharacterAppearance["wearing"]["garment"], string> = {
  tunic: "Tunic",
  "long-tunic": "Long tunic",
  skirt: "Skirt",
  robe: "Robe",
  dress: "Dress",
  shirt: "Shirt",
  coat: "Coat",
  wrap: "Wrapped cloth",
};
const sleeves: Partial<
  Record<
    CharacterAppearance["wearing"]["garment"],
    NonNullable<CharacterAppearance["wearing"]["sleeves"]>
  >
> = { robe: "loose", coat: "long", wrap: "none" };
const headLabel: Record<Exclude<(typeof headwear)[number], "none">, string> = {
  band: "Headband",
  cap: "Cap",
  hood: "Hood",
  wrap: "Head wrap",
};
const beltLabel: Record<
  Exclude<(typeof beltStyles)[number], "none">,
  string
> = {
  cord: "Cord belt",
  sash: "Sash",
  leather: "Leather belt",
  wide: "Wide belt",
};

export const wearableItems: Record<ItemId, ItemDef> = Object.fromEntries([
  ...garments.map((garment) => [
    `garment-${garment}`,
    {
      id: `garment-${garment}`,
      name: label[garment],
      sprite: "wool",
      value: 3,
      wear: {
        slot: "body",
        look: {
          garment,
          ...(sleeves[garment] && { sleeves: sleeves[garment] }),
        },
      },
    },
  ]),
  ...headwear
    .filter((h): h is Exclude<typeof h, "none"> => h !== "none")
    .map((h) => [
      `headwear-${h}`,
      {
        id: `headwear-${h}`,
        name: headLabel[h],
        sprite: "flax",
        value: 1,
        wear: { slot: "head", look: { headwear: h } },
      },
    ]),
  ...beltStyles
    .filter((b): b is Exclude<typeof b, "none"> => b !== "none")
    .map((b) => [
      `belt-${b}`,
      {
        id: `belt-${b}`,
        name: beltLabel[b],
        sprite: "tool",
        value: 1,
        wear: { slot: "belt", look: { belt: b } },
      },
    ]),
  [
    "cloak",
    {
      id: "cloak",
      name: "Cloak",
      sprite: "wool",
      value: 4,
      wear: { slot: "over", look: { cloak: true } },
    },
  ],
  [
    "shoulder-cloth",
    {
      id: "shoulder-cloth",
      name: "Shoulder cloth",
      sprite: "wool",
      value: 2,
      wear: { slot: "over", look: { shoulderCloth: true } },
    },
  ],
  [
    "necklace",
    {
      id: "necklace",
      name: "Necklace",
      sprite: "coin",
      value: 5,
      wear: { slot: "neck", look: { necklace: true } },
    },
  ],
  [
    "earrings",
    {
      id: "earrings",
      name: "Earrings",
      sprite: "coin",
      value: 4,
      wear: { slot: "ears", look: { earrings: true } },
    },
  ],
] as [ItemId, ItemDef][]);
