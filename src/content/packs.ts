import { landscapes } from "./graphics/landscapes";
import type { Pack, ItemDef, ItemId } from "../core/types";
import tiberGeography from "./generated/tiber-geography.json" with { type: "json" };
export const items: Record<ItemId, ItemDef> = {
  bread: { id: "bread", name: "Bread", sprite: "bread", value: 2, edible: 28 },
  grain: { id: "grain", name: "Grain", sprite: "grain", value: 1, edible: 12 },
  water: { id: "water", name: "Water", sprite: "jug", value: 1 },
  coin: { id: "coin", name: "Bronze coins", sprite: "coin", value: 1 },
  obsidian: {
    id: "obsidian",
    name: "Obsidian flakes",
    sprite: "obsidian",
    value: 3,
  },
  wool: { id: "wool", name: "Fleece", sprite: "wool", value: 4 },
  wood: { id: "wood", name: "Firewood", sprite: "log", value: 2 },
  fish: {
    id: "fish",
    name: "Dried fish",
    sprite: "fish",
    value: 3,
    edible: 24,
  },
  tool: { id: "tool", name: "Small knife", sprite: "tool", value: 6 },
  flax: { id: "flax", name: "Flax", sprite: "flax", value: 2 },
  lizard: {
    id: "lizard",
    name: "Captured lizard",
    sprite: "lizard0",
    value: 1,
  },
};
export const packs: Record<string, Pack> = {
  roman: {
    id: "roman",
    name: "A town by the Tiber",
    region: "Tiber lowlands",
    date: "100 CE",
    year: 100,
    subtitle: "Roman Italy",
    characterName: "Gaius",
    role: "Traveler",
    concern: "A place to stay, a little work, and a road still to follow.",
    ground: "grass",
    road: "paving",
    buildings: [
      "house-roman-0",
      "house-roman-1",
      "house-roman-2",
      "house-roman-3",
    ],
    buildingClaim: "roman-house",
    landscape: landscapes.riverTown,
    layout: "streets",
    trees: ["olive", "cypress", "oak"],
    buildingNames: [
      "Riverside storehouse",
      "Potter’s household",
      "Bread seller’s shop",
      "Weaver’s courtyard",
      "Roadside lodging",
      "Farmer’s household",
      "Oil merchant’s shop",
      "Communal hall",
    ],
    names: [
      "Livia",
      "Marcus",
      "Tertia",
      "Felix",
      "Sabina",
      "Lucius",
      "Dama",
      "Aelia",
      "Rufus",
      "Claudia",
      "Secundus",
      "Gaia",
    ],
    roles: ["Bread seller", "Potter", "Shepherd", "Weaver", "Farmer", "Fisher"],
    currency: "coin",
    startInventory: { coin: 12, bread: 2, water: 1, tool: 1 },
    trade: { give: "coin", take: "bread", cost: 2 },
    anchor: { lon: 12.291, lat: 41.755, label: "Ostia / Tiber lowlands" },
    settlementNames: [
      "Riverside quarter",
      "Olive hamlet",
      "Roadside village",
      "Upper fields",
    ],
    species: ["sheep", "lizard", "chicken"],
    greeting: "Salve, traveler.",
    commodities: ["bread", "grain", "fish", "wood", "wool"],
    entryLabel: "Enter",
    defaultSeed: "tiber-100",
    description: "Tiled roofs, busy streets, and a river road.",
    playerSprite: "human-0-1",
    geography: tiberGeography,
    evidence: [
      {
        id: "roman-town",
        title: "Ostia: history and urban development",
        statement:
          "The Tiber and its mouth connected settlement, transport, and commerce in the Roman landscape.",
        status: "documented",
        url: "https://www.ostiaantica.beniculturali.it/en/educational-panels/general-panels/ancient-ostia-history-and-urban-development/",
        limitation:
          "This generated town, its streets, residents, and household arrangements are invented. It is not a reconstruction of Ostia.",
      },
      {
        id: "roman-house",
        title: "Archaeological area of Ostia antica",
        statement:
          "Shops, domestic buildings, streets, and communal spaces inform this Roman town’s vocabulary.",
        status: "inferred",
        url: "https://www.ostiaantica.beniculturali.it/en/archaeological-sites-and-monuments/ostia-antica/",
        limitation:
          "The visual modules simplify varied Roman construction. Individual buildings and prices are game assumptions.",
      },
      {
        id: "landscape",
        title: "Landscape model",
        statement:
          "The main river centerline comes from Natural Earth’s modern Tiber geometry, projected to UTM 33N. Plots and roads are procedurally inferred.",
        status: "inferred",
        url: "https://www.naturalearthdata.com/about/terms-of-use/",
        limitation:
          "The source is at 1:10 million cartographic scale. Local river width, banks, and ancient channel position are inferred; no elevation model is included.",
      },
    ],
  },
  neolithic: {
    id: "neolithic",
    name: "A settlement on the plain",
    region: "Konya plain",
    date: "c. 6500 BCE",
    year: -6499,
    subtitle: "Neolithic Anatolia",
    characterName: "Early farmer",
    role: "Household member",
    concern:
      "The grain needs tending. There is time to explore beyond the houses.",
    ground: "dry",
    road: "dirt",
    buildings: ["house-mud-0", "house-mud-1", "house-mud-2", "house-mud-3"],
    buildingClaim: "neolithic-house",
    landscape: landscapes.meadow,
    layout: "clusters",
    trees: ["hackberry", "oak"],
    buildingNames: [
      "Plastered household",
      "Grain-storing household",
      "Hearth household",
      "Flint worker’s household",
      "Shared work yard",
      "Reed worker’s household",
      "Gathering household",
      "Communal work house",
    ],
    names: [
      "Reed",
      "Ochre",
      "Flint",
      "Willow",
      "Clay",
      "Ember",
      "Stone",
      "Ash",
      "Rush",
      "Amber",
      "Earth",
      "Sedge",
    ],
    roles: [
      "Grain grower",
      "Tool maker",
      "Herd keeper",
      "Basket maker",
      "Gatherer",
      "Hide worker",
    ],
    startInventory: { grain: 6, obsidian: 3, water: 1, tool: 1 },
    trade: { give: "obsidian", take: "grain", cost: 1 },
    anchor: { lon: 32.828, lat: 37.668, label: "Çatalhöyük / Konya plain" },
    settlementNames: [
      "Mound settlement",
      "Reed-bank households",
      "Outlying gardens",
      "Upland camp",
    ],
    species: ["sheep", "goat", "lizard"],
    greeting: "There is room beside the hearth.",
    commodities: ["grain", "wood", "flax", "obsidian"],
    entryLabel: "Climb inside",
    defaultSeed: "konya-6500",
    description: "Mudbrick households, grain fields, and shared work.",
    playerSprite: "human-1-4",
    evidence: [
      {
        id: "neolithic-house",
        title: "Çatalhöyük Research Project: architecture",
        statement:
          "Mudbrick walls, closely grouped houses, and access through roof openings inform these buildings.",
        status: "documented",
        url: "https://www.catalhoyuk.com/node/56",
        limitation:
          "This is an invented settlement inspired by regional archaeology, not an excavated plan. Exterior ladders and gaps simplify rooftop circulation for play.",
      },
      {
        id: "plants",
        title: "Çatalhöyük Research Project: botanical remains",
        statement:
          "Charcoal and other plant remains include hackberry and oak, alongside a wider range of wetland and dryland woody plants.",
        status: "documented",
        url: "https://www.catalhoyuk.com/newsletters/05/bots98.html",
        limitation:
          "Recovered plant material supports regional availability, not the precise position of trees. These simplified sprites and their placement are inferred.",
      },
      {
        id: "neolithic-town",
        title: "Çatalhöyük site management plan",
        statement:
          "Domestic spaces combined food preparation, storage, rest, and other household activities.",
        status: "documented",
        url: "https://www.catalhoyuk.com/sites/default/files/Catal_SMP_EN_Revised.pdf",
        limitation:
          "Resident names are explicitly invented English labels. Exact biographies, exchanges, and obligations are simulated assumptions.",
      },
      {
        id: "landscape",
        title: "Landscape model",
        statement:
          "The settlement is anchored to the Konya plain; local channels, fields, and paths are inferred.",
        status: "inferred",
        url: "https://www.catalhoyuk.com/node/56",
        limitation:
          "Watercourses and vegetation are illustrative procedural detail rather than a historical environmental reconstruction.",
      },
    ],
  },
};
export function resolvePrompt(
  input: string,
): { pack: Pack; seed: string } | { error: string } {
  const q = input.trim().toLowerCase();
  const date = /\b(\d+)\s*(bce|bc|ce|ad)\b/.exec(q);
  if (date) {
    const year = Number(date[1]),
      bce = date[2].startsWith("b");
    if (!((bce && year === 6500) || (!bce && year === 100)))
      return {
        error:
          "That date is outside this build’s supported periods: 100 CE and c. 6500 BCE. Your requested setting is preserved.",
      };
  }
  if (/roman|rome|tiber|ostia/.test(q) && /neolith|anatolia|konya|6500/.test(q))
    return {
      error:
        "This description combines the two supported settings. Choose Roman Italy or Neolithic Anatolia.",
    };
  const p = /neolith|anatolia|konya|6500|çatal|catal|early farmer/.test(q)
    ? packs.neolithic
    : /roman|rome|tiber|ostia|100\s*(ce|ad)|gaius/.test(q)
      ? packs.roman
      : undefined;
  return p
    ? { pack: p, seed: p.defaultSeed }
    : {
        error:
          "This build supports Roman Italy around 100 CE and Neolithic Anatolia around 6500 BCE. Your requested setting is preserved above; choose a supported world below.",
      };
}
