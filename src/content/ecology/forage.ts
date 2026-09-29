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
    def("stone", "Stone", "rock", 1, { description: "A fist-sized stone: a hammer, a weight, a wall in the making." }),
    def("flint", "Flint", "rock-1", 2, {
      description: "Strikes sparks; flakes to a sharp edge.",
    }),
    def("granite", "Granite", "rock-2", 2, { description: "Hard, speckled and heavy; slow to work but good for querns, steps and foundations." }),
    def("limestone", "Limestone", "rock", 2, {
      description: "Soft stone; burns to lime.",
    }),
    def("pebble", "Pebble", "rock-1", 1, { description: "Small and smooth. Good for a sling, a game, or counting." }),
    def("river-rock", "River rock", "rock-2", 1, { description: "Rounded by the current; used for hearths, walls and hot stones dropped into a pot." }),
    def("clay", "Clay", "rock-1", 1, { description: "Wet, sticky earth that holds its shape; fired, it becomes pots, bricks and tiles." }),
    def("dirt", "Handful of dirt", "rock-2", 0, { description: "Loose soil scooped from the ground. Plain, but every garden and floor starts with it." }),
    def("sand", "Sand", "rock", 0, { description: "Fine grit from a shore or riverbed, for scouring pots, tempering clay and mortar." }),
    def("mud", "Mud", "rock-2", 0, { description: "Wet earth that clings; mixed with straw it daubs walls and seals a roof." }),
    def("shell", "Shell", "rock-1", 1, { description: "An empty shell from the shore, for scraping, beads, lime or just keeping." }),
    def("stick", "Stick", "ecology-branches", 1, { description: "A fallen branch: kindling, a digging stick, a stake, or something to lean on.",
      flammable: true,
      floats: true,
    }),
    def("bark", "Strip of bark", "log", 1, { description: "Peeled from a trunk in a long strip; it tans leather, roofs a shelter and lights a fire.", flammable: true, floats: true }),
    def("herbs", "Wild herbs", "flowers", 1, { description: "A few wild leaves pulled for the pot or for a remedy; they taste of where they grew.", edible: 4 }),
    def("mushroom", "Mushroom", "ecology-fruit-item", 1, { description: "Picked from damp ground under trees. Most are good in a stew; a few are not.", edible: 6 }),
    def("straw", "Straw", "grain", 1, { description: "Dry stalks left after threshing, for bedding, thatch, fodder and binding mud.", flammable: true, floats: true }),
    def("pinecone", "Pinecone", "ecology-branches", 1, { description: "Dry and resinous; it catches quickly in a fire and hides seeds between its scales.",
      flammable: true,
      floats: true,
    }),
    def("resin", "Pine resin", "obsidian", 2, { description: "Sticky sap from a wounded pine; it glues hafts, caulks boats and burns bright.", flammable: true }),
    def("acorn", "Acorns", "ecology-berries-item", 1, { description: "Bitter until leached in running water, then ground into meal; pigs eat them as they are.", edible: 3 }),
    def("frond", "Palm frond", "flax", 1, { description: "A long palm leaf, woven into mats, baskets, fans and roofs.", flammable: true, floats: true }),
    def("cane", "Bamboo cane", "reeds", 1, { description: "A light, hollow, jointed stem; it becomes pipes, poles, scaffolding and arrows.", flammable: true, floats: true }),
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
