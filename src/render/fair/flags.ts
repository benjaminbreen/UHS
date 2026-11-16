import { Raster } from "../ship/raster";

type Flag = { stripes: string[]; vertical?: boolean; mark?: (R: Raster, x: number, y: number) => void };

const sun = (col: string) => (R: Raster, x: number, y: number) => { R.fill(x + 13, y + 8, 4, 4, col); R.fill(x + 14, y + 7, 2, 6, col); R.fill(x + 12, y + 9, 6, 2, col); };
const crescent = (R: Raster, x: number, y: number) => {
  for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) if (i * i + j * j <= 25 && (i - 2) ** 2 + j * j > 16) R.set(x + 14 + i, y + 10 + j, "#ffffff");
  R.fill(x + 19, y + 9, 2, 2, "#ffffff");
};
const TRICOLOUR: Flag = { stripes: ["#2a4a9c", "#f4f2ec", "#d43a34"], vertical: true };

/** The flags of 1889 that hung in the pavilions, by country. */
const FLAGS: Record<string, Flag> = {
  mexico: { stripes: ["#1e7a44", "#f4f2ec", "#c8302c"], vertical: true, mark: (R, x, y) => { R.fill(x + 13, y + 7, 4, 5, "#8a5a2a"); R.fill(x + 12, y + 12, 6, 1, "#3e8a3a"); } },
  argentina: { stripes: ["#74acdc", "#f4f2ec", "#74acdc"], mark: sun("#f0b828") },
  chile: { stripes: ["#f4f2ec", "#d42c2c"], mark: (R, x, y) => { R.fill(x, y, 10, 10, "#1c3c9c"); R.fill(x + 4, y + 3, 2, 4, "#ffffff"); R.fill(x + 3, y + 4, 4, 2, "#ffffff"); } },
  bolivia: { stripes: ["#d42c2c", "#f4d020", "#1e8a3c"] },
  brazil: { stripes: ["#1e8a3c"], mark: (R, x, y) => {
    for (let j = 0; j < 14; j++) { const half = 12 - Math.abs(j - 7) * 1.6; R.fill(x + 15 - half, y + 3 + j, half * 2, 1, "#f4d020"); }
    R.fill(x + 12, y + 7, 6, 6, "#2a4a9c"); R.fill(x + 12, y + 9, 6, 1, "#f4f2ec");
  } },
  ecuador: { stripes: ["#f4d020", "#f4d020", "#2a4a9c", "#d42c2c"] },
  venezuela: { stripes: ["#f4d020", "#2a4a9c", "#d42c2c"], mark: (R, x, y) => { for (let k = 0; k < 7; k++) R.set(x + 8 + k * 2, y + 9 - Math.round(Math.sin((k / 6) * Math.PI) * 2), "#ffffff"); } },
  paraguay: { stripes: ["#d42c2c", "#f4f2ec", "#2a4a9c"], mark: (R, x, y) => { R.fill(x + 13, y + 8, 4, 4, "#e8c040"); R.fill(x + 14, y + 9, 2, 2, "#2a6a3a"); } },
  "cairo-cafe": { stripes: ["#c8302c"], mark: crescent },
  "cairo-house": { stripes: ["#c8302c"], mark: crescent },
  "cairo-mosque": { stripes: ["#c8302c"], mark: crescent },
  tunisia: { stripes: ["#c8302c"], mark: (R, x, y) => { for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) if (i * i + j * j <= 36) R.set(x + 15 + i, y + 10 + j, "#ffffff"); crescent(R, x + 1, y); } },
};

/** A flag hung flat on a wall from a gilt rod, falling in a few soft folds. */
export function paintFlag(R: Raster, country: string, x: number, y: number, seed: number) {
  if (country.startsWith("house-")) return;
  const f = FLAGS[country] ?? TRICOLOUR, W = 30, H = 20;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = f.vertical ? Math.floor((i * f.stripes.length) / W) : Math.floor((j * f.stripes.length) / H);
    R.set(x + i, y + j, f.stripes[k]);
  }
  f.mark?.(R, x, y);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const fold = (i + Math.round(Math.sin(j * 0.3) * 1)) % 10;
    if (fold > 6) R.shade(x + i, y + j, 0.16);
    else if (fold < 2) R.shade(x + i, y + j, 0.12, [255, 250, 240]);
  }
  for (let i = 0; i < W; i += 2) R.set(x + i, y + H, "#d8b048");
  R.fill(x - 3, y - 2, W + 6, 2, "#d8b048"); R.fill(x - 3, y - 2, W + 6, 1, "#fff0a0");
  R.fill(x - 5, y - 3, 3, 4, "#b8862e"); R.fill(x + W + 2, y - 3, 3, 4, "#b8862e");
  void seed;
}
