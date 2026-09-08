import type { Ecology } from "../content/ecology/profiles";
import type { TopographyCell, TopographySample } from "../core/topography";

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
  depths: ["#83b6ad", "#559da6", "#358394", "#246a83", "#205670"],
  texture: ["#9bc6b9", "#6aabb2", "#43909f", "#30778d", "#28627b"],
  bank: ["#8b8970", "#b4ad86", "#d0c59f"],
  stone: ["#5c6865", "#89938a", "#bcc1a7"],
  submerged: ["#3f777e", "#5e9699"],
  glint: "#a1d5d4",
  foam: "#e1eee0",
  rockTint: 0xd9e2d4,
};
const desert: WaterPalette = {
  depths: ["#adae7d", "#7aab94", "#4c989a", "#337e8b", "#2a687a"],
  texture: ["#c0bb8e", "#8db8a1", "#5ba5a5", "#408e96", "#357785"],
  bank: ["#ae8655", "#cfab70", "#e8c78d"],
  stone: ["#877156", "#b09a75", "#d9c298"],
  submerged: ["#678e82", "#94ab8f"],
  glint: "#bfddd0",
  foam: "#efe9d1",
  rockTint: 0xffdaa4,
};
const tropical: WaterPalette = {
  depths: ["#91b391", "#579e8c", "#337f7b", "#246866", "#205355"],
  texture: ["#a1c0a0", "#69ae9c", "#428d86", "#2d7774", "#29605f"],
  bank: ["#655d42", "#91845a", "#b4a472"],
  stone: ["#434f48", "#677b68", "#95a38a"],
  submerged: ["#386960", "#5a8b77"],
  glint: "#9ed1b8",
  foam: "#dcebdd",
  rockTint: 0xb1c9a3,
};
const tropicalSea: WaterPalette = {
  ...tropical,
  depths: ["#b0d5bc", "#79c4b9", "#40a9b2", "#27879e", "#206781"],
  texture: ["#c2ddc9", "#8dcfc4", "#57b7bf", "#3698aa", "#2b758f"],
  bank: ["#a9a27b", "#d1c79d", "#ece0b8"],
  submerged: ["#4a9394", "#73b3ad"],
  glint: "#bbe9de",
  foam: "#f0f4df",
};
const northern: WaterPalette = {
  depths: ["#acbfc0", "#7d9faa", "#557f94", "#3b627d", "#2a4c69"],
  texture: ["#bfced0", "#91afb9", "#668fa3", "#49728e", "#355b78"],
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
  kind: "river" | "sea" | "lake",
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
/** Integer world-coordinate noise: no per-frame random draws or chunk-local seeds. */
export function waterHash(x: number, y: number, salt = 0) {
  let n =
    Math.imul(x | 0, 374761393) ^
    Math.imul(y | 0, 668265263) ^
    Math.imul(salt, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
/** Bilinear reconstruction of the continuous bed at native-pixel centers. */
export function waterDistance(sample: TopographySample, x: number, y: number) {
  const ix = Math.floor(x - 0.5),
    iy = Math.floor(y - 0.5);
  const fx = x - 0.5 - ix,
    fy = y - 0.5 - iy;
  const d = (a: number, b: number) => {
    const c = sample(a, b);
    return (
      c?.waterVisual?.distance ??
      (c?.surface === "water" || c?.bridge
        ? c.waterDepth === "deep"
          ? -4
          : -1
        : 1)
    );
  };
  return (
    (d(ix, iy) * (1 - fx) + d(ix + 1, iy) * fx) * (1 - fy) +
    (d(ix, iy + 1) * (1 - fx) + d(ix + 1, iy + 1) * fx) * fy
  );
}
export function waterBand(
  distance: number,
  kind: "river" | "sea" | "lake",
  shoreWidth: number,
  gx: number,
  gy: number,
) {
  const shelf = kind === "sea" ? 1.1 + shoreWidth * 0.35 : 1;
  const wobble =
    Math.sin(gx / 33 + Math.sin(gy / 51)) * 0.16 +
    Math.sin(gy / 27 + gx / 53) * 0.11;
  const depth = Math.max(
    0,
    -distance / shelf +
      wobble +
      (waterHash(Math.floor(gx / 2), Math.floor(gy / 2)) - 0.5) * 0.1,
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
