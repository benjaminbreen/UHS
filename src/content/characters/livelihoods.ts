import type { Livelihood } from "./context-types";

/** Shared playable activity kits. Quantities are gameplay choices, not historical statistics. */
export const livelihoods: readonly Livelihood[] = [
  {
    id: "gatherer",
    label: "Gatherer",
    activity: "Gathering supplies",
    inventory: { water: 2, fruit: 2 },
  },
  {
    id: "hunter",
    label: "Hunter",
    activity: "Looking for game",
    inventory: { water: 2, tool: 1 },
  },
  {
    id: "fisher",
    label: "Fisher",
    activity: "Working near water",
    needs: ["water"],
    inventory: { water: 2, fish: 2, tool: 1 },
  },
  {
    id: "farmer",
    label: "Farmer",
    activity: "Tending cultivation",
    needs: ["cultivation"],
    capabilities: ["settled_agriculture"],
    inventory: { water: 2, grain: 3, tool: 1 },
  },
  {
    id: "herder",
    label: "Herder",
    activity: "Tending animals",
    needs: ["settled"],
    inventory: { water: 2, wool: 2 },
  },
  {
    id: "craftsperson",
    label: "Craftsperson",
    activity: "Household craft work",
    inventory: { water: 2, wood: 2, tool: 1 },
  },
  {
    id: "trader",
    label: "Trader",
    activity: "Exchanging supplies",
    needs: ["settled"],
    capabilities: ["market_exchange"],
    inventory: { water: 2, fruit: 2 },
  },
  {
    id: "traveler",
    label: "Traveler",
    activity: "Traveling",
    inventory: { water: 2, fruit: 1 },
  },
];
