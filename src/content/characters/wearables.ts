import {
  beltStyles,
  footwear,
  garments,
  headwear,
  leggings,
  type CharacterAppearance,
} from "../../core/character";
import type { ItemDef, ItemId } from "../../core/types";

/** Generic wearables, one per look the renderers already draw. Colours stay
 * the wearer's own; wardrobe kits will add specific garments on top. */
const label: Record<CharacterAppearance["wearing"]["garment"], string> = {
  none: "Nothing",
  tunic: "Tunic",
  "long-tunic": "Long tunic",
  skirt: "Skirt",
  robe: "Robe",
  dress: "Dress",
  shirt: "Shirt",
  coat: "Coat",
  wrap: "Wrapped cloth",
  "open-robe": "Open robe",
  poncho: "Poncho",
  loincloth: "Loincloth",
  gown: "Court gown",
  suit: "Pressure suit",
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
  bowler: "Bowler hat",
  "flat-cap": "Flat cap",
  "ball-cap": "Peaked cap",
  brimmed: "Broad-brimmed hat",
  conical: "Conical hat",
  turban: "Turban",
  headscarf: "Headscarf",
  fez: "Fez",
  veil: "Veil",
  fillet: "Circlet",
  plume: "Plumed headdress",
  wig: "Powdered wig",
  helmet: "Helmet",
  visor: "Sealed helmet",
};
const legLabel: Record<Exclude<(typeof leggings)[number], "none">, string> = {
  hose: "Hose",
  trousers: "Trousers",
  wrapped: "Leg wrappings",
  sarong: "Sarong",
  wide: "Wide trousers",
};
const footLabel: Record<Exclude<(typeof footwear)[number], "none">, string> = {
  sandals: "Sandals",
  shoes: "Shoes",
  boots: "Boots",
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
  ...garments
    .filter((g): g is Exclude<typeof g, "none"> => g !== "none")
    .map((garment) => [
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
  ...leggings
    .filter((l): l is Exclude<typeof l, "none"> => l !== "none")
    .map((l) => [
      `leggings-${l}`,
      {
        id: `leggings-${l}`,
        name: legLabel[l],
        sprite: "wool",
        value: 2,
        wear: { slot: "legs", look: { leggings: l } },
      },
    ]),
  ...footwear
    .filter((f): f is Exclude<typeof f, "none"> => f !== "none")
    .map((f) => [
      `footwear-${f}`,
      {
        id: `footwear-${f}`,
        name: footLabel[f],
        sprite: "wool",
        value: f === "boots" ? 5 : 3,
        wear: { slot: "feet", look: { footwear: f } },
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
        sprite: "wool",
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
