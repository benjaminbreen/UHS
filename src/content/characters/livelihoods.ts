import type { Livelihood } from "./context-types";
import { commonLivelihoods } from "./livelihoods.generated";
import { outlawLivelihoods } from "./outlaws";
import { cityLivelihoods } from "./city-work";

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
export const callingItems = ["walking-cane", "fan", "beads", "alms-bowl", "censer", "ledger", "water-pole", "carrying-pole", "lamp-pole", "sweep-brush", "lute", "drum", "flute", "harpoon", "paddle", "scales", "briefcase", "doctor-bag"];
const index = new Map(
  [...livelihoods, ...commonLivelihoods, ...outlawLivelihoods, ...cityLivelihoods, ...notableLivelihoods].map((l) => [l.id, l]),
);
/** Every work id a start brief may name. */
export const livelihoodIds = [...index.keys()];
/** Lookup across both lists, for display of an origin already generated. */
export function livelihoodById(id: string) {
  return index.get(id);
}

export const gathersPlants = (kit?: Livelihood) => kit?.activity === "Gathering plants" && kit.id !== "shellfish-gatherer";
