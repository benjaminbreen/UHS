import type { TopographySample } from "../core/topography";
import type { GroundTileData } from "./habitat-raster";
import { waterHash as hash } from "./water-style";
const mod = (n: number, d: number) => ((n % d) + d) % d;
/** Shared native-pixel paving materials. Place/date selection happens in content. */
export function rasterStreetTile(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
): GroundTileData {
  const c = sample(x, y)!,
    material = c.streetMaterial ?? "slab",
    pixels = new Uint8ClampedArray(1024);
  const edge = (dx: number, dy: number) => {
    const n = sample(x + dx, y + dy);
    return n?.feature !== "paving" && !n?.bridge;
  };
  const north = edge(0, -1),
    south = edge(0, 1),
    west = edge(-1, 0),
    east = edge(1, 0);
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const wx = (x + ox) * 16 + px,
        wy = (y + oy) * 16 + py;
      const border = Math.min(
        north ? py : 99,
        south ? 15 - py : 99,
        west ? px : 99,
        east ? 15 - px : 99,
      );
      let tone: number[];
      if (border < 4) {
        const joint = north || south ? mod(wx, 8) === 0 : mod(wy, 8) === 0;
        tone =
          border === 3
            ? [91, 95, 85]
            : joint
              ? [126, 126, 106]
              : border === 0
                ? [189, 182, 145]
                : [163, 160, 129];
      } else if (material === "brick" || material === "slab") {
        const w = material === "brick" ? 10 : 15,
          h = material === "brick" ? 5 : 10,
          row = Math.floor(wy / h);
        const a = mod(wx + (row % 2) * Math.floor(w / 2), w),
          b = mod(wy, h);
        const v = hash(Math.floor((wx + ((row % 2) * w) / 2) / w), row, 391);
        const base = material === "brick" ? [156, 98, 65] : [142, 141, 119];
        const light =
          a === 1 || b === 1
            ? 13
            : a === w - 1 || b === h - 1
              ? -15
              : Math.floor(v * 12) - 6;
        tone = a === 0 || b === 0 ? [95, 91, 76] : base.map((n) => n + light);
      } else {
        const sx = material === "basalt" ? 10 : 7,
          sy = material === "basalt" ? 9 : 6;
        const bx = Math.floor(wx / sx),
          by = Math.floor(wy / sy);
        let first = Infinity,
          second = Infinity,
          id = 0,
          dx = 0,
          dy = 0;
        for (let yy = by - 1; yy <= by + 1; yy++)
          for (let xx = bx - 1; xx <= bx + 1; xx++) {
            const cx = (xx + 0.5) * sx + (hash(xx, yy, 393) - 0.5) * sx * 0.55,
              cy = (yy + 0.5) * sy + (hash(xx, yy, 394) - 0.5) * sy * 0.5;
            const a = (wx - cx) / sx,
              b = (wy - cy) / sy,
              d = a * a + b * b;
            if (d < first) {
              second = first;
              first = d;
              id = hash(xx, yy, 395);
              dx = a;
              dy = b;
            } else if (d < second) second = d;
          }
        const seam = second - first < 0.1;
        const base = material === "basalt" ? [101, 111, 108] : [131, 130, 111];
        const light =
          Math.floor(id * 20) -
          10 +
          (dx + dy < -0.22 ? 9 : dx + dy > 0.4 ? -9 : 0);
        tone = seam ? [66, 76, 74] : base.map((n) => n + light);
      }
      const i = (py * 16 + px) * 4;
      pixels.set([...tone, 255], i);
    }
  return { x, y, pixels };
}
