import type { Livelihood } from "../characters/context-types";
import { goodsOf } from "./goods";

/**
 * The shape of a day's work, read off a livelihood's activity like its
 * workplace is. Five families cover the catalogue: a regional kit changes the
 * nouns, not the loop.
 */
export const processFamilies = {
  /** A living stock that grows with care and declines without it. */
  tend: { stages: ["prepare", "tend", "take"], hours: 8 },
  /** Take from a patch that refills; taking hard slows the refill. */
  gather: { stages: ["find", "take", "bring home"], hours: 6 },
  /** Inputs, labour and time become an output. */
  transform: { stages: ["prepare", "work", "finish"], hours: 8 },
  /** Move goods from where they are to where they are needed. */
  carry: { stages: ["load", "carry", "deliver"], hours: 6 },
  /** Meet other people's needs for regard and pay. */
  serve: { stages: ["wait", "attend", "settle"], hours: 8 },
} as const;
export type ProcessFamily = keyof typeof processFamilies;

type Entry = [ProcessFamily, ...string[]];
/** Family, then the prop families where the work is done, if any has one. */
const byActivity: Record<string, Entry> = {
  "Tending cultivation": ["tend", "hoe", "rake"],
  "Bringing in the crop": ["tend", "sickle", "scythe", "sheaf"],
  "Working the smallholding": ["tend", "hoe", "chicken-coop"],
  "Tending animals": ["tend", "stock-pen", "trough", "milk-churn"],
  "Keeping the hives": ["tend", "beehive", "log-hive", "pipe-hive"],

  "Gathering plants": ["gather", "open-basket"],
  "Gathering supplies": ["gather", "open-basket"],
  "Looking for game": ["gather", "spear", "hide-frame"],
  "Cutting timber": ["gather", "woodpile"],
  "Gathering fuel": ["gather", "woodpile"],
  "Working near water": ["gather", "fish-weir", "drying-rack"],
  "Working the water": ["gather", "fish-weir", "drying-rack"],
  "Working underground": ["gather", "pick"],
  "Working stone": ["gather", "pick", "boulder"],
  "Working the salt": ["gather", "sack"],

  "Working the grain": ["transform", "grinder", "pounding-mortar"],
  "Preparing food": ["transform", "grinder", "pounding-mortar", "oven", "tannur", "earth-oven"],
  Cooking: ["transform", "cooking-pot", "hearth", "stove"],
  Brewing: ["transform", "barrel", "storage-jar"],
  "Pressing oil": ["transform", "amphora", "pithos"],
  "Working cloth": ["transform", "loom", "warp-loom"],
  Weaving: ["transform", "loom", "warp-loom"],
  "Twisting fibre": ["transform", "loom"],
  "Making clothes": ["transform"],
  "Household craft work": ["transform", "loom"],
  "Working hides": ["transform", "hide-frame"],
  "Working leather": ["transform", "hide-frame"],
  "Making shoes": ["transform"],
  "Working metal": ["transform", "anvil"],
  "Making tools": ["transform", "knapping-floor", "anvil"],
  "Working wood": ["transform", "woodpile"],
  "Working timber": ["transform", "woodpile"],
  "Raising a barrel": ["transform", "barrel"],
  "At the workbench": ["transform"],
  "Turning pots": ["transform", "earthen-pot"],
  "Working glass": ["transform"],
  "Making candles": ["transform"],
  "Boiling soap": ["transform", "cooking-pot"],
  "Making brick": ["transform"],
  "Burning charcoal": ["transform", "woodpile"],
  "Burning lime": ["transform"],
  "At the machine": ["transform"],
  "On the line": ["transform"],
  Building: ["transform"],
  "Working the roof": ["transform"],

  "Carrying a load": ["carry", "farm-cart", "wheelbarrow", "sack"],
  "Carrying water": ["carry", "well", "town-well", "framed-well", "pump", "water-jug"],
  Traveling: ["carry"],
  "Running errands": ["carry"],
  "Clearing waste": ["carry", "wheelbarrow"],
  "Working the wharf": ["carry", "crate-stack", "barrel"],

  "Exchanging goods": ["serve", "beam-scale"],
  "Exchanging supplies": ["serve"],
  "Minding the stall": ["serve", "beam-scale"],
  "Keeping the house": ["serve"],
  "Keeping the record": ["serve"],
  "Standing watch": ["serve"],
  "Tending the sick": ["serve"],
  "Attending on someone": ["serve"],
  "At the rite": ["serve", "wayside-shrine", "standing-stone"],
  "Playing and telling": ["serve", "council-fire"],
  "Household work": ["serve", "hearth"],
  "Looking after the household": ["serve", "hearth"],
  "Keeping the fire": ["serve", "hearth", "camp-hearth", "communal-hearth"],
  Cleaning: ["serve"],
  Washing: ["serve", "washing-line"],
};

export type Process = {
  family: ProcessFamily;
  stages: readonly string[];
  hours: number;
  stations: string[];
  makes: string[];
};

export function processFor(kit: Livelihood): Process | undefined {
  const entry = byActivity[kit.activity];
  if (!entry) return undefined;
  const [family, ...stations] = entry;
  return { family, ...processFamilies[family], stations, makes: goodsOf(kit) };
}
