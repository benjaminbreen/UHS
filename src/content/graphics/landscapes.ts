import type { Terrain } from "../../core/types";
export type LandscapeStyle = {
  water: "water" | "water-teal";
  bank: "earth" | "masonry";
  bridge: "wood" | "stone";
  settlementSurface: "paths" | "paved";
  paving: Terrain;
  pavingReach: number;
  bankReach: number;
  reeds: number;
};
// Construction and landscape are independent: any building family can use any style.
export const landscapes = {
  riverTown: {
    water: "water-teal",
    bank: "masonry",
    bridge: "stone",
    settlementSurface: "paved",
    paving: "paving",
    pavingReach: 5,
    bankReach: 15,
    reeds: 0.025,
  },
  meadow: {
    water: "water",
    bank: "earth",
    bridge: "wood",
    settlementSurface: "paths",
    paving: "dirt",
    pavingReach: 0,
    bankReach: 0,
    reeds: 0.055,
  },
} satisfies Record<string, LandscapeStyle>;
