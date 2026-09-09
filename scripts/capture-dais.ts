/** Render a synthetic square with a dais straight from the street raster. */
import { rasterStreetTile } from "../src/render/street-raster";
import { writeFileSync } from "node:fs";
const W = 21,
  H = 19,
  out = process.argv[2] ?? "/tmp/dais.raw";
const cellAt = (x: number, y: number) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return undefined;
  const inSquare = x >= 3 && x < 18 && y >= 2 && y < 17;
  const inDais = x >= 7 && x < 14 && y >= 6 && y < 13;
  if (!inSquare) {
    if (y === 0 || y === H - 1 || x === 0)
      return { height: 0, surface: "soil" as const };
    if (x < 3)
      return {
        height: 0,
        surface: "gravel" as const,
        feature: "paving" as const,
        streetMaterial: "slab" as const,
      };
    return { height: 0, surface: "grass" as const };
  }
  return {
    height: 0,
    surface: "gravel" as const,
    feature: "paving" as const,
    streetMaterial: "slab" as const,
    pavement: inDais ? ("dais" as const) : ("square" as const),
  };
};
const sample = (x: number, y: number) => cellAt(x, y) as any;
const buf = Buffer.alloc(W * 16 * H * 16 * 3);
for (let cy = 0; cy < H; cy++)
  for (let cx = 0; cx < W; cx++) {
    const c = cellAt(cx, cy)!;
    let px: Uint8ClampedArray;
    if (c.feature === "paving")
      px = rasterStreetTile(sample, cx, cy, 0, 0).pixels;
    else {
      px = new Uint8ClampedArray(1024);
      const t = c.surface === "grass" ? [150, 165, 90] : [186, 168, 128];
      for (let i = 0; i < 256; i++) px.set([...t, 255], i * 4);
    }
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const i = ((cy * 16 + y) * W * 16 + cx * 16 + x) * 3,
          j = (y * 16 + x) * 4;
        buf[i] = px[j];
        buf[i + 1] = px[j + 1];
        buf[i + 2] = px[j + 2];
      }
  }
writeFileSync(out, buf);
console.log(W * 16, H * 16);
