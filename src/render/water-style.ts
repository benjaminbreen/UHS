import { waterHash, waterNoise } from "../core/water-field";
export { waterHash, waterNoise, waterDistance } from "../core/water-field";
import type { Ecology } from "../content/ecology/profiles";
import type { TopographyCell } from "../core/topography";

export type WaterPalette = {
  depths: readonly string[];
  texture: readonly string[];
  bank: readonly [string, string, string];
  stone: readonly [string, string, string];
  submerged: readonly [string, string];
  glint: string;
  foam: string;
  rockTint: number;
};
const temperate: WaterPalette = {
  depths: ["#91baa3", "#5ea59f", "#368794", "#286b86", "#2c5070"],
  texture: ["#9fc3af", "#6bafa8", "#42949c", "#34768e", "#365d7b"],
  bank: ["#8b8970", "#b4ad86", "#d0c59f"],
  stone: ["#5c6865", "#89938a", "#bcc1a7"],
  submerged: ["#3f777e", "#5e9699"],
  glint: "#a1d5d4",
  foam: "#e1eee0",
  rockTint: 0xd9e2d4,
};
const desert: WaterPalette = {
  depths: ["#bdb884", "#8ab49b", "#54a09f", "#368596", "#315e7e"],
  texture: ["#c7c191", "#99bea7", "#60aba8", "#42939d", "#3b6c89"],
  bank: ["#ae8655", "#cfab70", "#e8c78d"],
  stone: ["#877156", "#b09a75", "#d9c298"],
  submerged: ["#678e82", "#94ab8f"],
  glint: "#bfddd0",
  foam: "#efe9d1",
  rockTint: 0xffdaa4,
};
const tropical: WaterPalette = {
  depths: ["#98b887", "#5daa8e", "#348d80", "#276d70", "#2b505f"],
  texture: ["#a5c395", "#6ab59a", "#42998c", "#337b7b", "#375f6b"],
  bank: ["#655d42", "#91845a", "#b4a472"],
  stone: ["#434f48", "#677b68", "#95a38a"],
  submerged: ["#386960", "#5a8b77"],
  glint: "#9ed1b8",
  foam: "#dcebdd",
  rockTint: 0xb1c9a3,
};
const tropicalSea: WaterPalette = {
  ...tropical,
  depths: ["#a4d7b7", "#69c8b4", "#369fb0", "#277c9c", "#285b7e"],
  texture: ["#b4dfc5", "#78d0bf", "#44acb8", "#328aa6", "#336a89"],
  bank: ["#a9a27b", "#d1c79d", "#ece0b8"],
  submerged: ["#4a9394", "#73b3ad"],
  glint: "#bbe9de",
  foam: "#f0f4df",
};
const northern: WaterPalette = {
  depths: ["#b1c6c3", "#84aab3", "#5b8ca3", "#3f6f8d", "#354c70"],
  texture: ["#bed0ce", "#90b5bd", "#6899ad", "#4c7e97", "#415b7d"],
  bank: ["#777f7c", "#a0aaa3", "#c5cbbd"],
  stone: ["#555f68", "#7e9097", "#becbcd"],
  submerged: ["#516f80", "#78929b"],
  glint: "#c0dce0",
  foam: "#eff4eb",
  rockTint: 0xc3d9ee,
};
const wetland: WaterPalette = {
  ...tropical,
  depths: ["#8caa7c", "#6a947b", "#4c7c71", "#386661", "#2b5354"],
  texture: ["#9cb78c", "#7aa38b", "#5b8b80", "#44746c", "#36605e"],
  bank: ["#655d42", "#8c875b", "#aaa171"],
};
export function waterPalette(
  ecology: Ecology,
  kind: "river" | "sea" | "lake" | "canal",
): WaterPalette {
  switch (ecology) {
    case "desert":
      return desert;
    case "dry-scrub":
      return {
        ...desert,
        depths: temperate.depths,
        texture: temperate.texture,
      };
    case "tropical-woodland":
      return kind === "sea" ? tropicalSea : tropical;
    case "tundra":
      return northern;
    case "boreal-woodland":
      return { ...northern, bank: temperate.bank, rockTint: 0xccd4cf };
    case "wetland":
      return kind === "sea" ? temperate : wetland;
    default:
      return temperate;
  }
}
export function waterBand(
  distance: number,
  kind: "river" | "sea" | "lake" | "canal",
  shoreWidth: number,
  gx: number,
  gy: number,
) {
  const shelf = kind === "sea" ? 1.1 + shoreWidth * 0.35 : 1;
  const raw = Math.max(0, -distance / shelf);
  // Broad, asymmetrical shelves. Small clustered transitions replace pixel speckle.
  const shelves =
    (waterNoise(gx, gy, 83, 101) - 0.5) * 2.4 +
    (waterNoise(gx, gy, 37, 102) - 0.5) * 0.55;
  const depth = Math.max(
    0,
    raw +
      Math.min(1, raw * 0.6) * shelves +
      (waterHash(Math.floor(gx / 3), Math.floor(gy / 2), 103) - 0.5) * 0.12,
  );
  return depth < 0.35
    ? 0
    : depth < 1.1
      ? 1
      : depth < 2.4
        ? 2
        : depth < 4.2
          ? 3
          : 4;
}
export function waterStyle(c: TopographyCell) {
  return waterPalette(
    c.waterVisual?.ecology ?? "grassland",
    c.waterVisual?.kind ?? "river",
  );
}
