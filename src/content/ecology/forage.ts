import type { ItemDef, ItemId, Terrain } from "../../core/types";
const def = (
  id: ItemId,
  name: string,
  sprite: string,
  value: number,
  extra: Partial<ItemDef> = {},
): ItemDef => ({ id, name, sprite, value, ...extra });
export const forageItems: Record<ItemId, ItemDef> = Object.fromEntries(
  [
    def("stone", "Stone", "rock", 1),
    def("flint", "Flint", "rock-1", 2, {
      description: "Strikes sparks; flakes to a sharp edge.",
    }),
    def("granite", "Granite", "rock-2", 2),
    def("limestone", "Limestone", "rock", 2, {
      description: "Soft stone; burns to lime.",
    }),
    def("pebble", "Pebble", "rock-1", 1),
    def("river-rock", "River rock", "rock-2", 1),
    def("clay", "Clay", "rock-1", 1),
    def("dirt", "Handful of dirt", "rock-2", 0),
    def("sand", "Sand", "rock", 0),
    def("mud", "Mud", "rock-2", 0),
    def("shell", "Shell", "rock-1", 1),
    def("stick", "Stick", "ecology-branches", 1, {
      flammable: true,
      floats: true,
    }),
    def("bark", "Strip of bark", "log", 1, { flammable: true, floats: true }),
    def("herbs", "Wild herbs", "flowers", 1, { edible: 4 }),
    def("mushroom", "Mushroom", "ecology-fruit-item", 1, { edible: 6 }),
    def("straw", "Straw", "grain", 1, { flammable: true, floats: true }),
    def("pinecone", "Pinecone", "ecology-branches", 1, {
      flammable: true,
      floats: true,
    }),
    def("resin", "Pine resin", "obsidian", 2, { flammable: true }),
    def("acorn", "Acorns", "ecology-berries-item", 1, { edible: 3 }),
    def("frond", "Palm frond", "flax", 1, { flammable: true, floats: true }),
    def("cane", "Bamboo cane", "reeds", 1, { flammable: true, floats: true }),
  ].map((d) => [d.id, d]),
);
type Table = [ItemId, number][];
export const forageByTerrain: Partial<Record<Terrain, Table>> = {
  rock: [
    ["stone", 5],
    ["flint", 3],
    ["granite", 2],
    ["limestone", 2],
  ],
  dirt: [
    ["dirt", 4],
    ["clay", 2],
    ["pebble", 2],
    ["stone", 1],
  ],
  sand: [
    ["sand", 4],
    ["shell", 2],
    ["pebble", 2],
  ],
  grass: [
    ["herbs", 3],
    ["stick", 3],
    ["pebble", 1],
    ["mushroom", 1],
  ],
  dry: [
    ["stick", 3],
    ["stone", 2],
    ["herbs", 1],
    ["flint", 1],
  ],
  field: [
    ["straw", 3],
    ["grain", 2],
  ],
  marsh: [
    ["reeds", 3],
    ["clay", 2],
    ["mud", 2],
  ],
  water: [
    ["river-rock", 3],
    ["pebble", 2],
    ["reeds", 1],
  ],
  snow: [
    ["stone", 2],
    ["stick", 1],
  ],
};
/** Nearby plant cover adds its own finds to the terrain's. */
export const forageByCover: [pattern: RegExp, table: Table][] = [
  [
    /pine|spruce/,
    [
      ["pinecone", 4],
      ["resin", 1],
      ["stick", 2],
    ],
  ],
  [
    /broadleaf|birch|willow|teak|oak/,
    [
      ["stick", 3],
      ["bark", 2],
      ["acorn", 1],
    ],
  ],
  [/palm/, [["frond", 3]]],
  [/bamboo/, [["cane", 3]]],
  [/berry|bush/, [["berries", 3]]],
  [/fruit/, [["fruit", 3]]],
];
export const lookSprites = {
  rock: "rock",
  plant: "flowers",
  food: "bread",
  wood: "log",
  cloth: "wool",
  tool: "tool",
  vessel: "jug",
  creature: "fish",
} as const;
