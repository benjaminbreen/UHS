import preferredC from "./presets/preferred-c.json";
import { bankStyle, type BankClimate, type BankMaterial } from "./banks";
import type { TopographyCell } from "../../core/topography";
import { waterDistance, waterHash } from "../../render/water-style";
import { lightingAt } from "../../render/lighting";

export const WIDTH = 384,
  HEIGHT = 256;
export type WaterKind = "river" | "pond" | "lake" | "coast";
export type System = "current" | "tiles" | "depth";
export const palettes = {
  tropical: {
    label: "Tropical · turquoise lagoon",
    colors: ["#b4efd1", "#52d5cf", "#139fc9", "#096cb0", "#103a77"],
    bed: "#e5d6a0",
    foam: "#f0fff0",
  },
  green: {
    label: "Temperate · ocean green",
    colors: ["#b4d6ab", "#72baa3", "#389f95", "#237c80", "#225564"],
    bed: "#c9bd8a",
    foam: "#e5f1d8",
  },
  blue: {
    label: "Temperate · sapphire",
    colors: ["#a6d6cf", "#63b9cd", "#348fb8", "#28639a", "#283f75"],
    bed: "#c8c9ae",
    foam: "#edf5e8",
  },
  polar: {
    label: "Polar · slate & ice",
    colors: ["#bdcfca", "#93b9bd", "#719aa9", "#507b92", "#3e586f"],
    bed: "#adbcb7",
    foam: "#f0f5ef",
  },
} as const;
export type Settings = {
  customBankColors: boolean;
  bankDryColor: string;
  bankWetColor: string;
  bankContactColor: string;
  bankTintOpacity: number;
  wetEdgeOpacity: number;
  bankGradient: boolean;
  bankGradientSteps: number;
  bankClimate: BankClimate | "auto";
  bankMaterial: BankMaterial;
  wetEdgeWidth: number;
  bankLapping: number;
  beachWidth: number;
  autoBeach: boolean;
  altitudeLevels: number;
  foamOpacity: number;
  foamWidth: number;
  foamBreakup: number;
  surfaceRipples: boolean;
  rippleAmount: number;
  rocks: number;
  rockSize: number;
  plants: number;
  plantType: "auto" | "reeds" | "lilies" | "seaweed";
  bankHeight: number;
  bankCover: number;
  boundaryColor: string;
  boundaryDarkness: number;
  boundaryOpacity: number;
  roughness: number;
  kind: WaterKind;
  palette: keyof typeof palettes;
  strength: number;
  direction: number;
  hour: number;
  clarity: number;
  fish: boolean;
  glitters: boolean;
  paused: boolean;
  speed: number;
};
export const defaults: Settings = {
  customBankColors: false,
  bankDryColor: "#e8c789",
  bankWetColor: "#bf9e68",
  bankContactColor: "#8c7856",
  bankTintOpacity: 1,
  wetEdgeOpacity: 0.75,
  bankGradient: true,
  bankGradientSteps: 5,
  bankClimate: "auto",
  bankMaterial: "auto",
  wetEdgeWidth: 0.22,
  bankLapping: 0.7,
  beachWidth: 0.7,
  autoBeach: false,
  altitudeLevels: 4,
  foamOpacity: 0.65,
  foamWidth: 0.35,
  foamBreakup: 0.6,
  surfaceRipples: false,
  rippleAmount: 0.5,
  rocks: 9,
  rockSize: 1,
  plants: 16,
  plantType: "auto",
  bankHeight: 10,
  bankCover: 0.65,
  boundaryColor: "#594329",
  boundaryDarkness: 0,
  boundaryOpacity: 1,
  roughness: 0.6,
  kind: "coast",
  palette: "tropical",
  strength: 1,
  direction: 90,
  hour: 15,
  clarity: 0.8,
  fish: true,
  glitters: true,
  paused: false,
  speed: 1,
  ...(preferredC.settings as Partial<Settings>),
};
export const mod = (n: number, d: number) => ((n % d) + d) % d;
export function beachExtent(s: Settings) {
  return s.autoBeach
    ? Math.max(0, (8 - s.altitudeLevels) / 6) * 3
    : s.beachWidth;
}
export function distance(kind: WaterKind, x: number, y: number) {
  if (kind === "coast")
    return (64 + 14 * Math.sin(x / 67) + 8 * Math.sin(x / 28) - y) / 16;
  if (kind === "river")
    return (Math.abs(x - 190 - 27 * Math.sin(y / 68)) - 79) / 16;
  const rx = kind === "pond" ? 128 : 170,
    ry = kind === "pond" ? 86 : 110;
  return (
    (Math.hypot((x - 192) / rx, (y - 134) / ry) - 1) * 5.5 +
    Math.sin(x / 25) * 0.12
  );
}
export function fixture(s: Settings) {
  return (x: number, y: number): TopographyCell => {
    const d =
      distance(s.kind, (x + 0.5) * 16, (y + 0.5) * 16) +
      s.roughness *
        (Math.sin(x * 1.7 + y * 0.8) * 0.22 +
          Math.sin(y * 1.8 - x * 0.4) * 0.17);
    return {
      height: 0,
      habitat: {
        ecology:
          s.palette === "tropical"
            ? "tropical-woodland"
            : s.palette === "polar"
              ? "tundra"
              : "temperate-woodland",
        kind: "open",
        wet: 0.4,
        cover: 0.2,
        exposed: 0,
        season: "summer",
      },
      surface: d < 0 ? "water" : "sand",
      waterDepth: d < -2 ? "deep" : "shallow",
      waterVisual: {
        distance: d,
        kind: s.kind === "coast" ? "sea" : s.kind === "pond" ? "lake" : s.kind,
        ecology:
          s.palette === "tropical"
            ? "tropical-woodland"
            : s.palette === "polar"
              ? "tundra"
              : "temperate-woodland",
        shoreWidth: beachExtent(s) * 4,
        flow: [
          Math.cos((s.direction * Math.PI) / 180),
          Math.sin((s.direction * Math.PI) / 180),
        ],
        frozenMargin: false,
      },
    };
  };
}
export function makeField(s: Settings) {
  const sample = fixture(s),
    depths = new Float32Array(WIDTH * HEIGHT);
  for (let y = 0; y < HEIGHT; y++)
    for (let x = 0; x < WIDTH; x++)
      depths[y * WIDTH + x] = -waterDistance(
        sample,
        (x + 0.5) / 16,
        (y + 0.5) / 16,
      );
  return depths;
}
export function landCanvas(field: Float32Array, s: Settings) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!,
    bank = bankStyle(s);
  for (let y = 0; y < HEIGHT; y++)
    for (let x = 0; x < WIDTH; x++) {
      const d = field[y * WIDTH + x],
        n = waterHash(x, y, 18);
      ctx.fillStyle =
        d > -beachExtent(s)
          ? bank.dry
          : d > -beachExtent(s) - 0.2
            ? bank.grass
            : n > 0.96
              ? bank.grass
              : bank.ground;
      ctx.fillRect(x, y, 1, 1);
    }
  for (let i = 0; i < 100; i++) {
    const x = Math.floor(waterHash(i, 4) * WIDTH),
      y = Math.floor(waterHash(i, 5) * HEIGHT);
    if (field[y * WIDTH + x] > -beachExtent(s) - 0.4) continue;
    ctx.fillStyle = "#3c6847";
    ctx.fillRect(x, y, 1, 4);
    ctx.fillRect(x - 2, y + 1, 1, 2);
    ctx.fillStyle = "#91ad65";
    ctx.fillRect(x + 1, y - 1, 1, 4);
  }
  return canvas;
}
export function light(s: Settings) {
  return lightingAt(s.hour * 3600);
}
