import { at } from "./regions";
import type { CaveFind } from "./types";

/** What the rock, the water and the animals put there, in any age. */
export const naturalFinds: CaveFind[] = [
  {
    // The generator swaps in the metal, its grade and its colour.
    id: "ore-vein", name: "Ore vein", art: "seam:ore", on: "wall", tier: "node", years: [-5000, 10000], kinds: ["fissure", "karst", "lava", "sandstone"], depth: [2, 9], weight: 3,
    verb: "Break out ore", time: 180, loot: { ore: [1, 2] },
    text: "You hammer at the vein until heavy pieces come away.",
    look: "A streak of coloured, heavy stone running through the wall.", basis: "documented",
  },
  {
    id: "flint", name: "Flint nodules", art: "flint", on: "floor", tier: "node", kinds: ["karst", "sea"], weight: 3,
    verb: "Prise out the flint", time: 90, loot: { flint: [2, 4] },
    text: "You work the nodules out of the soft rock. They are black inside and ring when knocked together.",
    look: "Dark lumps of flint weathering out of the chalky floor.", basis: "documented",
  },
  {
    id: "ochre-seam", name: "Ochre seam", art: "seam:ochre", on: "wall", tier: "node", kinds: ["sandstone", "karst", "fissure"], weight: 2,
    verb: "Dig out ochre", time: 120, loot: { ochre: [2, 5] },
    text: "The red earth comes away in greasy lumps and stains your hands to the wrist.",
    look: "A band of soft red and yellow earth in the wall. Somebody has dug here before.", basis: "documented",
  },
  {
    id: "salt-crust", name: "Salt crust", art: "salt", on: "floor", tier: "node", kinds: ["sandstone", "fissure", "sea"], weight: 1.5,
    verb: "Scrape up salt", time: 90, loot: { salt: [2, 4] },
    text: "You scrape the white crust into a heap and pick out the grit.",
    look: "A crust of salt where water has dried on the floor year after year.", basis: "inferred",
  },
  {
    id: "guano", name: "Guano heap", art: "guano", on: "floor", tier: "node", kinds: ["karst", "sandstone", "lava", "fissure"], weight: 2.5, flat: true,
    verb: "Shovel up guano", time: 120, loot: { guano: [3, 6] },
    text: "You fill what you can carry. The smell stays with you.",
    look: "A dark, dry heap under the roost, crawling with beetles.", basis: "documented",
  },
  {
    id: "saltpetre", name: "Saltpetre earth", art: "salt:grey", on: "floor", tier: "node", years: [800, 1950], kinds: ["karst", "sandstone", "fissure"], weight: 1.5, flat: true,
    verb: "Scrape up saltpetre", time: 150, loot: { saltpetre: [1, 3] },
    text: "White needles have grown on the dry earth. You gather them carefully.",
    look: "Cave earth frosted with white crystals. Powder makers pay for this.", basis: "documented",
  },
  {
    id: "rock-crystal", name: "Crystal pocket", art: "crystal", on: "floor", tier: "node", kinds: ["fissure", "karst", "lava"], depth: [2, 9], weight: 2, glow: "#bfe8ff",
    verb: "Break out crystals", time: 120, loot: { "rock-crystal": [1, 3] },
    text: "The points snap off at the root. Each one throws your light back at you.",
    look: "Clear crystals growing from a crack, each the length of a finger.", basis: "documented",
  },
  {
    id: "calcite", name: "Calcite spar", art: "crystal:honey", on: "floor", tier: "node", kinds: ["karst"], depth: [2, 9], weight: 1.5, glow: "#ffd98a",
    verb: "Break out spar", time: 100, loot: { calcite: [1, 3] },
    text: "The spar splits into clean slanted blocks.",
    look: "Honey-coloured crystals lining a hollow in the rock.", basis: "documented",
  },
  {
    id: "cave-pearls", name: "Cave pearls", art: "pearls", on: "floor", tier: "node", kinds: ["karst"], depth: [2, 9], weight: 1, flat: true,
    verb: "Gather the pearls", time: 40, loot: { "cave-pearl": [2, 5] },
    text: "You lift the round white stones out of their dripping nest.",
    look: "A shallow basin under a drip, full of round white stones like eggs.", basis: "documented",
  },
  {
    id: "sulphur", name: "Sulphur crust", art: "sulphur", on: "floor", tier: "node", kinds: ["lava"], weight: 2.5, glow: "#e8e060",
    verb: "Break off sulphur", time: 90, loot: { sulphur: [2, 4] },
    text: "The yellow crust crumbles into your hands. Your eyes water.",
    look: "Bright yellow crystals around a crack that breathes warm, foul air.", basis: "documented",
  },
  {
    id: "obsidian", name: "Obsidian", art: "obsidian", on: "floor", tier: "node", kinds: ["lava"], weight: 2,
    verb: "Knock off obsidian", time: 90, loot: { obsidian: [1, 3] },
    text: "The black glass breaks in curved flakes, each edge sharper than any knife.",
    look: "Black volcanic glass, shining where it has broken.", basis: "documented",
  },
  {
    id: "clay", name: "Cave clay", art: "clay", on: "floor", tier: "node", kinds: ["karst", "fissure"], weight: 1.5, flat: true,
    verb: "Dig clay", time: 90, loot: { clay: [2, 4] },
    text: "The clay is fine and cold and takes the print of your fingers.",
    look: "A bank of smooth grey clay left by old floods.", basis: "documented",
  },
  {
    id: "fossil", name: "Bones in the rock", art: "fossil", on: "wall", tier: "node", kinds: ["karst", "sandstone", "fissure"], weight: 1,
    verb: "Chip out the bones", time: 180, loot: { "old-bones": [1, 3] },
    text: "You chip the stone bones free. They are heavier than bone should be.",
    look: "The shapes of ribs and a jaw, turned to stone, standing out of the wall.", basis: "documented",
  },
  {
    id: "mushrooms", name: "Pale mushrooms", art: "mushrooms", on: "floor", tier: "node", kinds: ["karst", "fissure", "sandstone"], depth: [1, 2], weight: 1.5, flat: true,
    verb: "Pick the mushrooms", time: 30, loot: { mushroom: [2, 4] },
    text: "You pick the pale caps growing on old dung and rotted wood.",
    look: "White mushrooms growing where something organic washed in.", basis: "inferred",
  },
  {
    id: "spring", name: "Dripping basin", art: "spring", on: "floor", tier: "node", kinds: ["karst", "fissure", "sandstone", "lava"], weight: 1.5, keeps: true,
    verb: "Drink", time: 20, heal: 4, loot: { water: 1 },
    text: "The water is so cold it hurts your teeth, and clean.",
    look: "A stone basin the drip has filled to the brim.", basis: "documented",
  },
  {
    id: "swiftlet-nests", name: "Swiftlet nests", art: "nests", on: "wall", tier: "notable", where: [at.southeastAsia], kinds: ["karst", "sea"], weight: 4,
    verb: "Scrape off the nests", time: 240, loot: { "bird-nest": [2, 5] },
    text: "You climb as high as you dare and pry the small white cups off the rock.",
    look: "Pale cups glued high on the wall, a bird in some of them.", basis: "documented",
  },
  {
    id: "wild-hive", name: "Wild bees' nest", art: "hive", on: "wall", tier: "common", depth: [1, 1], kinds: ["sandstone", "karst", "fissure"], weight: 0.8,
    where: [at.africa, at.india, at.southeastAsia, at.mediterranean, at.mesoamerica, at.australia],
    verb: "Cut out the comb", time: 180, loot: { honeycomb: [1, 3] },
    text: "You smoke them as best you can and cut the comb out. You are stung anyway.",
    look: "Combs hanging in a cleft just inside the light, loud with bees.", basis: "documented",
  },
  {
    id: "ice", name: "Old ice", art: "ice", on: "floor", tier: "node", kinds: ["ice"], weight: 3,
    verb: "Cut ice", time: 90, loot: { "ice-block": [1, 3] },
    text: "You chop out a clear block. It smokes in the air.",
    look: "Blue ice, banded with the dust of old summers.", basis: "documented",
  },
  {
    id: "frozen-carcass", name: "Frozen carcass", art: "carcass", on: "floor", tier: "notable", kinds: ["ice"], weight: 2,
    verb: "Cut meat from it", time: 240, loot: { meat: [2, 4], hide: 1 },
    text: "The meat is hard as wood and still red. It fell in here a long time ago.",
    look: "An animal frozen whole in the ice, hair and all.", basis: "documented",
  },
  {
    id: "shells", name: "Shell bank", art: "shells", on: "floor", tier: "node", kinds: ["sea"], weight: 3, flat: true,
    verb: "Pick over the shells", time: 40, loot: { shell: [3, 6] },
    text: "You pick the whole ones out of the drift.",
    look: "Shells the tide has thrown to the back of the cave.", basis: "documented",
  },
  {
    id: "driftwood", name: "Driftwood", art: "driftwood", on: "floor", tier: "node", kinds: ["sea"], weight: 2,
    verb: "Gather driftwood", time: 40, loot: { wood: [2, 4] }, fuel: 300,
    text: "Dry, salt-white wood. Some of it goes on your light.",
    look: "Bleached timber wedged above the tide line.", basis: "documented",
  },
  {
    id: "ambergris", name: "Grey lump in the wrack", art: "ambergris", on: "floor", tier: "prize", kinds: ["sea"], weight: 0.6, flat: true,
    verb: "Take the lump", time: 20, loot: { ambergris: 1 },
    text: "It is waxy, grey and smells of the sea and something sweeter. You know what a perfumer would give for it.",
    look: "A grey, waxy lump the size of a loaf, half buried in weed.", basis: "documented",
  },
  {
    id: "oyster-pool", name: "Tide pool", art: "tidepool", on: "floor", tier: "common", kinds: ["sea"], weight: 2, keeps: true,
    verb: "Search the pool", time: 120, loot: { shell: [1, 3], fish: [0, 2], pearl: [0, 1] },
    text: "You turn the stones in the pool and take what is worth taking.",
    look: "A pool the tide left, with weed, limpets and something moving.", basis: "documented",
  },
  {
    id: "amber", name: "Amber in the clay", art: "crystal:amber", on: "floor", tier: "notable", where: [[8, 53, 30, 60]], weight: 2, glow: "#ffb040",
    verb: "Dig out the amber", time: 120, loot: { amber: [1, 3] },
    text: "You dig the warm yellow lumps out of the blue clay.",
    look: "Lumps of clouded gold in a seam of blue clay.", basis: "documented",
  },
  {
    id: "animal-bones", name: "Gnawed bones", art: "bones", on: "floor", tier: "common", weight: 2, flat: true, keeps: true,
    verb: "Look through the bones", time: 40,
    text: "Deer, mostly, and something smaller. The ends are chewed. Whatever dragged them here may still use the place.",
    look: "A scatter of bones, cracked for the marrow.", basis: "documented",
  },
];
