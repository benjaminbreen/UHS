import { describe, expect, it } from "vitest";
import { rasterFieldTile } from "../src/render/field-raster";
import { rasterHabitatTile } from "../src/render/habitat-raster";
import { rasterWaterTile } from "../src/render/water-raster";
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
const render = (
  f: Field,
  x = 3,
  y = 5,
  ox = 0,
  oy = 0,
  ditches?: Set<string>,
) => rasterFieldTile(world(f, ditches), x, y, ox, oy).pixels;
const luma = (p: Uint8ClampedArray, x: number, y: number) => {
  const i = (y * 16 + x) * 4;
  return p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11;
};
const distinct = (p: Uint8ClampedArray) => {
  const set = new Set<string>();
  for (let i = 0; i < p.length; i += 4)
    set.add(`${p[i]},${p[i + 1]},${p[i + 2]}`);
  return set.size;
};

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
  it("lines fence posts up on a world lattice across cells", () => {
    const a = render(field({ fence: 1, edges: 1, boundary: "fence" }), 3, 5);
    const b = render(field({ fence: 1, edges: 1, boundary: "fence" }), 4, 5);
    const posts = (p: Uint8ClampedArray) =>
      Array.from({ length: 16 }, (_, x) => luma(p, x, 1) < 60);
    expect(posts(a)).toEqual(posts(b));
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
    const sideways = render(
      field({ axis: "x" }),
      3,
      5,
      0,
      0,
      new Set(["2,5", "3,5", "4,5"]),
    );
    expect(luma(sideways, 2, 7) + luma(sideways, 9, 8)).toBeLessThan(
      luma(sideways, 2, 0) + luma(sideways, 9, 15),
    );
  });
  it("rasterizes a world cell identically from any chunk origin", () => {
    for (const f of [
      field(),
      field({
        crop: "rice",
        wet: true,
        stage: "green",
        edges: 3,
        fence: 3,
        boundary: "bund",
      }),
      field({ edges: 12, fence: 12, boundary: "hedge", stage: "sown" }),
      field({
        crop: "maize",
        axis: "y",
        stage: "green",
        edges: 2,
        fence: 2,
        boundary: "fence",
      }),
      field({ edges: 15, fence: 9, boundary: "wall" }),
    ]) {
      const a = render(f, 5, 7, 0, 0);
      const b = render(f, 5 - 16, 7 + 32, 16, -32);
      const c = render(f, 5 + 3, 7 - 40, -3, 40);
      expect(b).toEqual(a);
      expect(c).toEqual(a);
    }
  });
  it("dispatches farmed cells from the habitat raster", () => {
    const f = field();
    expect(rasterHabitatTile(world(f), 2, 2, 0, 0).pixels).toEqual(
      render(f, 2, 2),
    );
  });

  const canalWorld =
    (cells: Record<string, "x" | "y">, dry = false): TopographySample =>
    (x, y) => {
      const axis = cells[`${x},${y}`];
      const habitat = habitatAt("grassland", "summer", "review", x, y, land);
      if (!axis)
        return {
          height: 0,
          surface: "soil",
          feature: "field",
          habitat,
          field: field(),
        };
      return {
        height: 0,
        surface: dry ? "soil" : "water",
        waterDepth: dry ? undefined : "shallow",
        dryChannel: dry,
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
  const pixel = (p: Uint8ClampedArray, x: number, y: number) => {
    const i = (y * 16 + x) * 4;
    return p.subarray(i, i + 3).join();
  };
  const canal = (cells: Record<string, "x" | "y">) => {
    const wet = rasterWaterTile(canalWorld(cells), 3, 5, 0, 0);
    const dry = rasterWaterTile(canalWorld(cells, true), 3, 5, 0, 0);
    return { wet, isWater: (x: number, y: number) => pixel(wet.pixels, x, y) !== pixel(dry.pixels, x, y) };
  };
  it("renders a canal as lips, still water and a flow highlight", () => {
    const { wet, isWater } = canal({ "2,5": "x", "3,5": "x", "4,5": "x" });
    for (let x = 0; x < 16; x++) {
      for (const y of [0, 1, 2, 13, 14, 15])
        expect(isWater(x, y), `bank ${x},${y}`).toBe(false);
      for (let y = 3; y <= 12; y++)
        expect(isWater(x, y), `water ${x},${y}`).toBe(true);
      expect(pixel(wet.pixels, x, 3)).toBe(pixel(wet.pixels, 0, 3));
    }
    const row = Array.from({ length: 16 }, (_, x) => pixel(wet.pixels, x, 7));
    expect(new Set(row).size).toBeGreaterThan(1);
    expect(wet.effect.edges).toEqual([]);
  });
  it("closes a dead-end canal and opens a junction", () => {
    const dead = canal({ "2,5": "x", "3,5": "x" });
    for (let y = 0; y < 16; y++) {
      expect(dead.isWater(15, y), `end ${y}`).toBe(false);
      expect(dead.isWater(14, y), `end ${y}`).toBe(false);
    }
    expect(dead.isWater(0, 7)).toBe(true);
    const tee = canal({ "2,5": "x", "3,5": "x", "4,5": "x", "3,6": "y", "3,7": "y" });
    for (let x = 3; x <= 12; x++)
      expect(tee.isWater(x, 15), `open ${x}`).toBe(true);
    for (const x of [0, 1, 14, 15])
      expect(tee.isWater(x, 15), `closed ${x}`).toBe(false);
  });
  it("rasterizes a canal identically from any chunk origin", () => {
    const cells = { "2,5": "x", "3,5": "x", "3,6": "y" } as const;
    const a = rasterWaterTile(canalWorld(cells), 3, 5, 0, 0).pixels;
    const shifted = canalWorld(cells);
    const b = rasterWaterTile(
      (x, y) => shifted(x + 16, y - 32),
      3 - 16,
      5 + 32,
      16,
      -32,
    ).pixels;
    expect(b).toEqual(a);
  });
});
