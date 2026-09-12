import type { Livelihood } from "./context-types";
import { commonLivelihoods } from "./livelihoods.generated";

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
  {
    id: "gatherer",
    weight: 14,
    label: "Gatherer",
    activity: "Gathering supplies",
    inventory: { water: 2, fruit: 2 },
  },
  {
    id: "hunter",
    weight: 8,
    label: "Hunter",
    activity: "Looking for game",
    inventory: { water: 2, tool: 1 },
  },
  {
    id: "fisher",
    weight: 8,
    label: "Fisher",
    activity: "Working near water",
    needs: ["water"],
    inventory: { water: 2, fish: 2, tool: 1 },
  },
  {
    id: "farmer",
    weight: 24,
    label: "Farmer",
    activity: "Tending cultivation",
    needs: ["cultivation"],
    capabilities: ["settled_agriculture"],
    inventory: { water: 2, grain: 3, tool: 1 },
  },
  {
    id: "herder",
    weight: 10,
    label: "Herder",
    activity: "Tending animals",
    needs: ["settled"],
    inventory: { water: 2, wool: 2 },
  },
  {
    id: "craftsperson",
    weight: 6,
    label: "Craftsperson",
    activity: "Household craft work",
    inventory: { water: 2, wood: 2, tool: 1 },
  },
  {
    id: "trader",
    weight: 3,
    label: "Trader",
    activity: "Exchanging supplies",
    needs: ["settled"],
    capabilities: ["market_exchange"],
    inventory: { water: 2, fruit: 2 },
  },
  {
    id: "traveler",
    weight: 1,
    label: "Traveler",
    activity: "Traveling",
    inventory: { water: 2, fruit: 1 },
  },
];
const index = new Map(
  [...livelihoods, ...commonLivelihoods].map((l) => [l.id, l]),
);
/** Lookup across both lists, for display of an origin already generated. */
export function livelihoodById(id: string) {
  return index.get(id);
}
