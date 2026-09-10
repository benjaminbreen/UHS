import { describe, expect, it } from "vitest";
import { rasterFieldTile } from "../src/render/field-raster";
import { rasterHabitatTile } from "../src/render/habitat-raster";
import { rasterWaterTile } from "../src/render/water-raster";
import { waterPalette } from "../src/render/water-style";
import { habitatAt } from "../src/world/v3/habitats";
import type { TopographyCell, TopographySample } from "../src/core/topography";
import type { LandSample } from "../src/world/v2/landscape";

const land: LandSample = {
  water: 80,
  shoreWidth: 3,
  elevation: 14,
  moisture: 0.52,
  kind: "river",
  snow: false,
};
type Field = NonNullable<TopographyCell["field"]>;
const field = (over: Partial<Field> = {}): Field => ({
  parcel: 1,
  crop: "wheat",
  axis: "x",
  fence: 0,
  edges: 0,
  boundary: "none",
  wet: false,
  stage: "ripe",
  ...over,
});
const world =
  (f: Field, ditches: Set<string> = new Set()): TopographySample =>
  (x, y) => ({
    height: 0,
    surface: "soil",
    feature: "field",
    habitat: habitatAt("grassland", "summer", "review", x, y, land),
    field: ditches.has(`${x},${y}`) ? { ...f, crop: "fallow", ditch: true } : f,
  });
const render = (f: Field, x = 3, y = 5, ox = 0, oy = 0, ditches?: Set<string>) =>
  rasterFieldTile(world(f, ditches), x, y, ox, oy).pixels;
const luma = (p: Uint8ClampedArray, x: number, y: number) => {
  const i = (y * 16 + x) * 4;
  return p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11;
};
const distinct = (p: Uint8ClampedArray) => {
  const set = new Set<string>();
  for (let i = 0; i < p.length; i += 4) set.add(`${p[i]},${p[i + 1]},${p[i + 2]}`);
  return set.size;
};
/** Lag with the strongest mean autocorrelation of luma across the given axis. */
function bestLag(p: Uint8ClampedArray, axis: "x" | "y") {
  let best = 0,
    bestLag = 0;
  for (let lag = 2; lag <= 6; lag++) {
    let sum = 0,
      n = 0;
    for (let line = 0; line < 16; line++) {
      const v = Array.from({ length: 16 }, (_, i) =>
        axis === "x" ? luma(p, line, i) : luma(p, i, line),
      );
      const mean = v.reduce((a, b) => a + b) / 16;
      let num = 0,
        den = 0;
      for (let i = 0; i < 16; i++) {
        den += (v[i] - mean) ** 2;
        if (i + lag < 16) num += (v[i] - mean) * (v[i + lag] - mean);
      }
      if (den > 0) {
        sum += num / den;
        n++;
      }
    }
    const r = n ? sum / n : 0;
    if (r > best) {
      best = r;
      bestLag = lag;
    }
  }
  return bestLag;
}

describe("field raster", () => {
  it("fills every pixel with more than one colour", () => {
    for (const f of [
      field(),
      field({ crop: "rice", wet: true, stage: "green" }),
      field({ edges: 9, boundary: "hedge" }),
      field({ stage: "bare" }),
      field({ crop: "pasture", stage: "green" }),
      field({ crop: "fallow", stage: "bare" }),
    ]) {
      const p = render(f);
      expect(p.length).toBe(1024);
      for (let i = 3; i < p.length; i += 4) expect(p[i]).toBe(255);
      expect(distinct(p)).toBeGreaterThan(3);
    }
  });
  it("runs furrows along the axis with a 4 px pitch", () => {
    // Furrows along x vary across y, so the periodic lag shows down columns.
    const along = render(field({ axis: "x" }), 3, 1);
    expect(bestLag(along, "x")).toBe(4);
    const down = render(field({ axis: "y" }), 1, 3);
    expect(bestLag(down, "y")).toBe(4);
  });
  it("draws the boundary on the outer pixels only", () => {
    const plain = render(field());
    for (const boundary of ["hedge", "wall", "fence", "bund", "ditch", "baulk"] as const) {
      const p = render(field({ edges: 9, fence: 9, boundary }));
      let outer = 0,
        inner = 0;
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          const i = (y * 16 + x) * 4;
          const same =
            p[i] === plain[i] && p[i + 1] === plain[i + 1] && p[i + 2] === plain[i + 2];
          if (x < 5 || y < 5) outer += same ? 0 : 1;
          else inner += same ? 0 : 1;
        }
      expect(outer, boundary).toBeGreaterThan(40);
      expect(inner, boundary).toBe(0);
    }
    expect(render(field({ edges: 9, fence: 9, boundary: "none" }))).toEqual(plain);
  });
  it("draws enclosure bits bolder than parcel-only edges", () => {
    const dark = (p: Uint8ClampedArray, rows: number) => {
      let n = 0;
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < 16; x++) if (luma(p, x, y) < 95) n++;
      return n;
    };
    for (const boundary of ["fence", "hedge", "wall"] as const) {
      const enclosed = render(field({ edges: 1, fence: 1, boundary }));
      const strip = render(field({ edges: 1, fence: 0, boundary }));
      expect(dark(enclosed, 4), boundary).toBeGreaterThan(dark(strip, 4) + 8);
      // The parcel-only edge is one line on the outer row.
      const plain = render(field({ boundary }));
      for (let y = 1; y < 16; y++)
        for (let x = 0; x < 16; x++)
          expect(luma(strip, x, y), `${boundary} ${x},${y}`).toBe(luma(plain, x, y));
    }
  });
  it("lines fence posts up on a world lattice across cells", () => {
    const a = render(field({ fence: 1, edges: 1, boundary: "fence" }), 3, 5);
    const b = render(field({ fence: 1, edges: 1, boundary: "fence" }), 4, 5);
    const posts = (p: Uint8ClampedArray) =>
      Array.from({ length: 16 }, (_, x) => luma(p, x, 1) < 60);
    expect(posts(a)).toEqual(posts(b));
    expect(posts(a).filter(Boolean).length).toBe(4);
  });
  it("floods a paddy bluer than dry ground", () => {
    const blue = (p: Uint8ClampedArray) => {
      let b = 0,
        r = 0;
      for (let i = 0; i < p.length; i += 4) {
        r += p[i];
        b += p[i + 2];
      }
      return b / r;
    };
    const dry = render(field({ crop: "wheat", stage: "green" }));
    const wet = render(field({ crop: "rice", wet: true, stage: "green" }));
    expect(blue(wet)).toBeGreaterThan(blue(dry) * 1.3);
  });
  it("cuts a water channel down a ditch cell along its ditch neighbours", () => {
    const ditches = new Set(["3,4", "3,5", "3,6"]);
    const p = render(field({ axis: "x" }), 3, 5, 0, 0, ditches);
    // Neighbours north and south: the channel runs down the middle columns.
    const centre = luma(p, 7, 2) + luma(p, 8, 9);
    const bank = luma(p, 0, 2) + luma(p, 15, 9);
    expect(centre).toBeLessThan(bank);
    const sideways = render(field({ axis: "x" }), 3, 5, 0, 0, new Set(["2,5", "3,5", "4,5"]));
    expect(luma(sideways, 2, 7) + luma(sideways, 9, 8)).toBeLessThan(
      luma(sideways, 2, 0) + luma(sideways, 9, 15),
    );
  });
  it("rasterizes a world cell identically from any chunk origin", () => {
    for (const f of [
      field(),
      field({ crop: "rice", wet: true, stage: "green", edges: 3, fence: 3, boundary: "bund" }),
      field({ edges: 12, fence: 12, boundary: "hedge", stage: "sown" }),
      field({ crop: "maize", axis: "y", stage: "green", edges: 2, fence: 2, boundary: "fence" }),
      field({ edges: 15, fence: 9, boundary: "wall" }),
    ]) {
      const a = render(f, 5, 7, 0, 0);
      const b = render(f, 5 - 16, 7 + 32, 16, -32);
      const c = render(f, 5 + 3, 7 - 40, -3, 40);
      expect(b).toEqual(a);
      expect(c).toEqual(a);
    }
  });
  it("dispatches farmed cells from the habitat raster and keeps stages apart", () => {
    const f = field();
    expect(rasterHabitatTile(world(f), 2, 2, 0, 0).pixels).toEqual(render(f, 2, 2));
    const stages = ["bare", "sown", "green", "ripe", "stubble"] as const;
    const looks = stages.map((stage) => Array.from(render(field({ stage }))).join(","));
    expect(new Set(looks).size).toBe(stages.length);
  });

  const canalWorld =
    (cells: Record<string, "x" | "y">): TopographySample =>
    (x, y) => {
      const axis = cells[`${x},${y}`];
      const habitat = habitatAt("grassland", "summer", "review", x, y, land);
      if (!axis) return { height: 0, surface: "soil", feature: "field", habitat, field: field() };
      return {
        height: 0,
        surface: "water",
        waterDepth: "shallow",
        habitat,
        waterVisual: {
          distance: -1,
          kind: "canal",
          ecology: "grassland",
          shoreWidth: 1,
          flow: axis === "x" ? [1, 0] : [0, 1],
          frozenMargin: false,
        },
      };
    };
  const pal = waterPalette("grassland", "canal");
  const hex = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const pixel = (p: Uint8ClampedArray, x: number, y: number) =>
    [p[(y * 16 + x) * 4], p[(y * 16 + x) * 4 + 1], p[(y * 16 + x) * 4 + 2]];
  it("renders a canal as lips, still water and a flow highlight", () => {
    const run = canalWorld({ "2,5": "x", "3,5": "x", "4,5": "x" });
    const p = rasterWaterTile(run, 3, 5, 0, 0).pixels;
    const water = new Set([pal.depths[2], pal.depths[3]].map((c) => hex(c).join()));
    const lip = new Set([pal.bank[0], pal.bank[1], pal.bank[2]].map((c) => hex(c).join()));
    for (let x = 0; x < 16; x++) {
      for (const y of [0, 1, 14, 15]) expect(lip.has(pixel(p, x, y).join()), `lip ${x},${y}`).toBe(true);
      expect(pixel(p, x, 2).join()).toBe(hex(pal.depths[3]).join());
      for (const y of [3, 6, 12, 13]) expect(water.has(pixel(p, x, y).join()), `water ${x},${y}`).toBe(true);
    }
    // The highlight sits on one row along the flow and nowhere else.
    const glint = Array.from({ length: 16 }, (_, x) => pixel(p, x, 9).join()).filter(
      (c) => !water.has(c),
    );
    expect(glint.length).toBeGreaterThan(8);
    for (const y of [8, 10]) for (let x = 0; x < 16; x++) expect(water.has(pixel(p, x, y).join())).toBe(true);
    // No shoreline and no motif effect: the effect has no edges to draw.
    expect(rasterWaterTile(run, 3, 5, 0, 0).effect.edges).toEqual([]);
  });
  it("closes a dead-end canal and opens a junction", () => {
    const dead = rasterWaterTile(canalWorld({ "2,5": "x", "3,5": "x" }), 3, 5, 0, 0).pixels;
    const lip = new Set([pal.bank[0], pal.bank[1], pal.bank[2]].map((c) => hex(c).join()));
    for (let y = 0; y < 16; y++) {
      expect(lip.has(pixel(dead, 15, y).join()), `end ${y}`).toBe(true);
      expect(lip.has(pixel(dead, 14, y).join()), `end ${y}`).toBe(true);
    }
    expect(lip.has(pixel(dead, 0, 7).join())).toBe(false);
    const tee = rasterWaterTile(
      canalWorld({ "2,5": "x", "3,5": "x", "4,5": "x", "3,6": "y", "3,7": "y" }),
      3, 5, 0, 0,
    ).pixels;
    for (let x = 2; x <= 13; x++) expect(lip.has(pixel(tee, x, 15).join()), `open ${x}`).toBe(false);
    for (const x of [0, 1, 14, 15]) expect(lip.has(pixel(tee, x, 15).join()), `closed ${x}`).toBe(true);
  });
  it("rasterizes a canal identically from any chunk origin", () => {
    const cells = { "2,5": "x", "3,5": "x", "3,6": "y" } as const;
    const a = rasterWaterTile(canalWorld(cells), 3, 5, 0, 0).pixels;
    const shifted = canalWorld(cells);
    const b = rasterWaterTile((x, y) => shifted(x + 16, y - 32), 3 - 16, 5 + 32, 16, -32).pixels;
    expect(b).toEqual(a);
  });
});
