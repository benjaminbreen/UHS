import type { Livelihood } from "./context-types";
import { commonLivelihoods } from "./livelihoods.generated";
import { outlawLivelihoods } from "./outlaws";
import { cityLivelihoods } from "./city-work";
import { futureLivelihoods } from "./future-work";
import { streetLivelihoods } from "./street-work";

/**
 * Shared playable activity kits. Quantities are gameplay choices, not
 * historical statistics.
 *
 * The weights are what keeps a settlement fed. Drawn evenly against the dozens
 * of specialist trades in the ported table, food production was a fiftieth of
 * the workforce. These are coarse Phase 1 placeholders on the eight kits;
 * Phase 2 replaces them with real cultivators weighted per subsistence base.
 */
export const livelihoods: readonly Livelihood[] = [
  { id: "hospital-attendant", label: "Hospital Attendant", activity: "Tending the sick", institution: "hospital", needs: ["settled"], rank: "labouring", weight: 4, inventory: { water: 2 } },
  {
    id: "gatherer",
    rank: "labouring",
    weight: 14,
    label: "Gatherer",
    activity: "Gathering plants",
    inventory: { water: 2, fruit: 2 },
  },
  {
    id: "hunter",
    rank: "labouring",
    weight: 8,
    label: "Hunter",
    activity: "Looking for game",
    // Mostly men, but never only: Agta women hunt, and Wilamaya Patjxa in the
    // Andes buried a woman with her big-game kit 9,000 years ago.
    sex: "male",
    sexUntil: -40000,
    sexShare: 0.1,
    inventory: { water: 2, tool: 1 },
  },
  {
    id: "fisher",
    rank: "labouring",
    weight: 8,
    label: "Fisher",
    activity: "Working near water",
    needs: ["water"],
    inventory: { water: 2, fish: 2, tool: 1 },
  },
  {
    id: "farmer",
    rank: "middling",
    weight: 24,
    label: "Farmer",
    activity: "Tending cultivation",
    needs: ["cultivation"],
    capabilities: ["settled_agriculture"],
    inventory: { water: 2, grain: 3, tool: 1 },
  },
  // Kept the birds and beasts off the standing crop: boys with clappers and
  // slings in England, watchmen on a raised machan in India, children on
  // platforms in the sorghum of the Sahel.
  {
    id: "crop-watcher",
    rank: "labouring",
    weight: 3,
    label: "Crop Watcher",
    activity: "Watching the crop",
    workplace: "field",
    needs: ["cultivation"],
    capabilities: ["settled_agriculture"],
    labels: [
      { scope: { years: [800, 1880], bounds: [-11, 42, 32, 62] }, label: "Bird-scarer" },
      { scope: { years: [1200, 1880], bounds: [-11, 49, 3, 61] }, label: "Crow-keeper" },
      { scope: { years: [-1500, 1950], bounds: [60, 5, 98, 36] }, label: "Field Watchman" },
      { scope: { years: [-500, 1950], bounds: [-18, 0, 50, 20] }, label: "Bird Scarer" },
    ],
    inventory: { water: 2, fruit: 1 },
  },
  {
    id: "herder",
    rank: "labouring",
    weight: 10,
    label: "Herder",
    activity: "Tending animals",
    needs: ["settled"],
    requires: ["herd-animal"],
    inventory: { water: 2, wool: 2 },
  },
  {
    id: "craftsperson",
    rank: "labouring",
    weight: 3,
    label: "Craftsperson",
    activity: "Household craft work",
    requires: ["handwork"],
    inventory: { water: 2, wood: 2, tool: 1 },
  },
  {
    id: "trader",
    rank: "middling",
    weight: 1,
    label: "Trader",
    activity: "Exchanging supplies",
    needs: ["settled"],
    capabilities: ["market_exchange"],
    inventory: { water: 2, fruit: 2 },
  },
  {
    id: "traveler",
    rank: "labouring",
    weight: 1,
    label: "Traveler",
    activity: "Traveling",
    inventory: { water: 2, fruit: 1 },
  },
];
/**
 * Running one's own household: the work most grown women in most settled
 * societies did, not a servant's place in someone else's. Its share of the
 * draw is set in `weighted`, not by `weight`. The title is what that place
 * called the woman who ran the house.
 */
export const homemaker: Livelihood = {
  id: "homemaker",
  label: "Mistress of the House",
  activity: "Looking after the household",
  needs: ["settled"],
  ages: [18, 90],
  sex: "female",
  sexUntil: 1970,
  rank: "middling",
  labels: [
    { scope: { years: [-1000, 500], bounds: [-10, 30, 40, 48] }, label: "Mother of the Household" },
    { scope: { years: [1300, 1750], bounds: [-11, 49, 2, 61] }, label: "Goodwife" },
    { scope: { years: [1600, 1750], bounds: [-80, 30, -60, 47] }, label: "Goodwife" },
    { scope: { years: [1750, 1970], bounds: [-11, 49, 2, 61] }, label: "Housewife" },
    { scope: { years: [1750, 1970], bounds: [-170, 14, -50, 72] }, label: "Housewife" },
    // Sitt al-bayt: what Arabic speakers called the woman who ran the house.
    { scope: { years: [630, 1970], bounds: [-17, 12, 60, 38] }, label: "Lady of the House" },
    // The Mexica midwife told a newborn girl she would be the hearthstones of the home.
    { scope: { years: [1200, 1600], bounds: [-106, 13, -86, 23] }, label: "Keeper of the Hearth" },
    // Nei, the inner quarters: the house was hers to run while the men worked outside it.
    { scope: { years: [-500, 1950], bounds: [100, 18, 125, 46] }, label: "Mistress of the Inner Rooms" },
    { scope: { years: [1890, 1970], bounds: [129, 30, 146, 46] }, label: "Housewife" },
    { scope: { years: [1970, 10001] }, label: "Homemaker" },
  ],
  inventory: { water: 2, bread: 2 },
};
/** Work no settlement draws at random: only a start brief that names it gets
 * it. One row per kind of eminence; the brief carries the local title, so a
 * pharaoh, a doge and a Soviet marshal need no row of their own. */
export const notableLivelihoods: readonly Livelihood[] = [
  { id: "ruler", label: "Ruler", activity: "Holding court", rank: "elite", inventory: { water: 2, bread: 2 } },
  { id: "commander", label: "Commander", activity: "Commanding", rank: "elite", inventory: { water: 2, bread: 2 } },
  { id: "courtier", label: "Courtier", activity: "Attending at court", rank: "gentry", inventory: { water: 2, bread: 1 } },
  { id: "statesman", label: "Statesman", activity: "Holding office", rank: "elite", inventory: { water: 2, bread: 1 } },
  { id: "envoy", label: "Envoy", activity: "Traveling", rank: "gentry", inventory: { water: 2, bread: 2 } },
  { id: "scholar", label: "Scholar", activity: "Keeping the record", rank: "gentry", inventory: { water: 2, bread: 1 } },
  { id: "high-priest", label: "High priest", activity: "At the rite", rank: "elite", inventory: { water: 2, bread: 1 } },
  { id: "aviator", label: "Aviator", activity: "Flying", rank: "middling", years: [1903, 10001], inventory: { water: 2, bread: 1 } },
  { id: "explorer", label: "Explorer", activity: "On expedition", rank: "middling", inventory: { water: 2, bread: 2, tool: 1 } },
  { id: "artist", label: "Artist", activity: "Making art", rank: "middling", inventory: { water: 2, tool: 1 } },
  { id: "performer", label: "Performer", activity: "Playing and telling", rank: "middling", inventory: { water: 2 } },
  { id: "rebel", label: "Rebel leader", activity: "Organizing", rank: "middling", inventory: { water: 2, bread: 2 } },
  { id: "magnate", label: "Magnate", activity: "Exchanging goods", rank: "elite", inventory: { water: 2, bread: 2 } },
];
/** The things a calling is known by and goes about with, whatever the land yields. */
export const callingItems = ["walking-cane", "fan", "beads", "alms-bowl", "censer", "ledger", "water-pole", "carrying-pole", "lamp-pole", "sweep-brush", "lute", "drum", "flute", "harpoon", "paddle", "scales", "briefcase", "doctor-bag",
  "hand-bell", "clappers", "lantern", "grinder-wheel", "grinder-bench", "fish-tubs", "juice-urn", "balloons", "barrel-organ", "water-skin", "haw-pole"];
/** What comes off the land by hand. In an industrial age only people who work the land carry it or ask for it. */
export const foraged = ["berries", "fruit", "greens", "roots", "acorn", "wood", "grain", "fodder", "reeds"];
const index = new Map(
  [...livelihoods, homemaker, ...commonLivelihoods, ...outlawLivelihoods, ...cityLivelihoods, ...futureLivelihoods, ...streetLivelihoods, ...notableLivelihoods].map((l) => [l.id, l]),
);
/** Every work id a start brief may name. */
export const livelihoodIds = [...index.keys()];
/** Lookup across both lists, for display of an origin already generated. */
export function livelihoodById(id: string) {
  return index.get(id);
}

export const gathersPlants = (kit?: Livelihood) => kit?.activity === "Gathering plants" && kit.id !== "shellfish-gatherer";
