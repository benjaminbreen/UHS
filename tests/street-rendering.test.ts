import { expect, it } from "vitest";
import { pathArt } from "../src/world/v3/path-art";
import { streetMaterial } from "../src/content/settlements/streets";
import { rasterStreetTile } from "../src/render/street-raster";
import { carriagewayPixel } from "../src/render/carriageway";
import { roadMarkings } from "../src/content/settlements/streets/markings";
import type { WorldSetting } from "../src/content/geography/types";
import type { TopographySample } from "../src/core/topography";
it("simplifies staircase footpaths into continuous diagonals without changing routes", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 3, y: 3 },
  ];
  const before = JSON.stringify(points);
  const art = pathArt([{ id: "p", points, width: 0, kind: "path", cost: 1 }]);
  expect(art.get("1,1")).toEqual([
    { a: [0.5, 0.5], b: [3.5, 3.5], radius: 0.66 },
  ]);
  expect(JSON.stringify(points)).toBe(before);
  expect(
    pathArt([{ id: "b", points, width: 0, kind: "bridge", cost: 1 }]).size,
  ).toBe(0);
});
it("paints road markings in the style of the place and date", () => {
  const at = (lon: number, lat: number, year: number) =>
    roadMarkings({ lon, lat, year } as WorldSetting);
  expect(at(-77.4, 37.5, 2014)).toMatchObject({
    centre: "yellow-double",
    drive: "right",
    crossing: "ladder",
  });
  expect(at(-77.4, 37.5, 1955).centre).toBe("white-dashed");
  expect(at(-1.5, 52.5, 1990)).toMatchObject({ drive: "left", crossing: "zebra" });
  expect(at(139.7, 35.7, 1990).drive).toBe("left");
  expect(at(2.3, 48.8, 1975).gutter).toBe("sett");
  expect(at(-77.4, 37.5, 1905).centre).toBe("none");
  // Parking lanes arrive with the motor age, not with paint.
  expect(at(2.3, 48.8, 1940).parking).toBe(false);

  // Double yellow at the centre, a crossing's bars before a junction, and
  // nothing painted inside the junction itself.
  const marks = at(-77.4, 37.5, 2014);
  const base = [60, 60, 60];
  const lane = { axis: "x" as const, at: 0, span: 10, marks };
  const kerbs = { low: true, high: true };
  const yellow = (c: readonly number[]) => c[0] > c[2] + 60;
  const light = (c: readonly number[]) => c[0] > 140 && c[2] > 140;
  const run = (u: number) =>
    Array.from({ length: 40 }, (_, v) =>
      yellow(carriagewayPixel(base, lane, u, v, 0, kerbs)),
    ).filter(Boolean).length;
  expect(run(78)).toBeGreaterThan(24);
  expect(run(70)).toBe(0);
  const bars = Array.from({ length: 40 }, (_, u) =>
    light(carriagewayPixel(base, { ...lane, toJunction: 1 }, 40 + u, 8, 0, kerbs)),
  );
  expect(bars.filter(Boolean).length).toBeGreaterThan(12);
  expect(bars.filter((b) => !b).length).toBeGreaterThan(12);
  expect(
    carriagewayPixel(base, { ...lane, junction: true }, 78, 5, 0, kerbs),
  ).toBe(base);
});
it("selects regional paving by date and location", () => {
  const s = {
    lon: 12.5,
    lat: 41.9,
    year: 100,
    culture: "european",
  } as WorldSetting;
  expect(streetMaterial(s)).toBe("basalt");
  expect(streetMaterial({ ...s, year: 1600 })).toBe("cobble");
  expect(streetMaterial({ ...s, lon: 5, lat: 52, year: 1700 })).toBe("brick");
});
it("paving keeps world-coordinate joints identical across chunk origins", () => {
  const sample: TopographySample = () => ({
    height: 0,
    surface: "gravel",
    feature: "paving",
    streetMaterial: "basalt",
  });
  expect(rasterStreetTile(sample, 0, 0, -16, 32).pixels).toEqual(
    rasterStreetTile(sample, -16, 32, 0, 0).pixels,
  );
  expect(rasterStreetTile(sample, 0, 0, 0, 0).pixels).not.toEqual(
    rasterStreetTile(sample, 1, 0, 0, 0).pixels,
  );
});

it("uses dated NYC mixes without spreading them to other places or periods", async () => {
  const { streetPalette, chooseStreetSurface } = await import(
    "../src/content/settlements/streets/palettes"
  );
  const ny = {
    lon: -74,
    lat: 40.7,
    year: 1850,
    culture: "european",
  } as WorldSetting;
  const p = streetPalette(ny);
  expect(p.main).toContain("sett");
  expect(p.footway).toContain("brick");
  expect(p.lane).toContain("earth");
  expect(streetPalette({ ...ny, year: 1700 }).main).not.toContain("sett");
  expect(streetPalette({ ...ny, lon: 12.5, lat: 41.9 }).main).not.toContain(
    "sett",
  );
  expect(chooseStreetSurface(p, "lane", 0.4)).toBe("earth");
});

it("renders each material distinctly and preserves selected square materials", () => {
  const signatures = new Set<string>();
  for (const material of [
    "slab",
    "basalt",
    "cobble",
    "sett",
    "brick",
  ] as const) {
    const sample: TopographySample = () => ({
      height: 0,
      surface: "gravel",
      feature: "paving",
      streetMaterial: material,
      pavement: "square",
    });
    const pixels = rasterStreetTile(sample, 0, 0, 0, 0).pixels;
    signatures.add(Array.from(pixels).join(","));
    expect(rasterStreetTile(sample, 0, 0, -16, 32).pixels).toEqual(
      rasterStreetTile(sample, -16, 32, 0, 0).pixels,
    );
  }
  expect(signatures.size).toBe(5);
});
