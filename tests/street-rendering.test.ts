import { expect, it } from "vitest";
import { pathArt } from "../src/world/v3/path-art";
import { streetMaterial } from "../src/content/settlements/streets";
import { rasterHabitatTile } from "../src/render/habitat-raster";
import { rasterStreetTile } from "../src/render/street-raster";
import { carriagewayPixel } from "../src/render/carriageway";
import { roadMarkings } from "../src/content/settlements/streets/markings";
import type { WorldSetting } from "../src/content/geography/types";
import type { TopographySample } from "../src/core/topography";
import { resolveJunctions } from "../src/world/v3/junctions";
import { cellKey, type SettlementPlan } from "../src/world/v3/types";
import { composeStreetGeometry, streetDistance, streetUnionDistance } from "../src/world/v3/street-geometry";
import { enclosed, kerbed, roadwayMaterial } from "../src/render/paving-edge";

it("keeps diagonal asphalt, curb and sidewalk continuous across tile boundaries", () => {
  const stroke = { a: [-10.5, -10.5] as [number, number], b: [20.5, 20.5] as [number, number], radius: 2.5 };
  expect(streetDistance(stroke, 5.5, 5.5)).toBe(-2.5);
  const sample = (() => ({ height: 0, surface: "grass", feature: "paving", streetMaterial: "asphalt", streetGeometry: { strokes: [stroke], infill: false } })) as TopographySample;
  const a = rasterStreetTile(sample, 0, 0, 0, 0);
  const b = rasterStreetTile(sample, -8, -8, 8, 8);
  expect(a!.pixels).toEqual(b!.pixels);
  const sidewalk = rasterStreetTile(sample, 4, 0, 0, 0);
  expect(sidewalk!.pixels).not.toEqual(a!.pixels);
  const lawnEdge = (() => ({ ...sample(7, 0)!, habitat: {
    ecology: "grassland", kind: "meadow", wet: 0.4, cover: 0.5, exposed: 0, season: "spring",
  } })) as TopographySample;
  const clipped = rasterStreetTile(lawnEdge, 7, 0, 0, 0).pixels;
  const composed = rasterHabitatTile(lawnEdge, 7, 0, 0, 0).pixels;
  expect([...clipped].filter((_, i) => i % 4 === 3)).toContain(0);
  expect([...composed].filter((_, i) => i % 4 === 3).every((v) => v === 255)).toBe(true);
});

it("rounds intersecting streets without widening straight runs or bridging parallel streets", () => {
  const horizontal = { a: [-12, 0] as [number, number], b: [12, 0] as [number, number], radius: 2.5 };
  const vertical = { a: [0, -12] as [number, number], b: [0, 12] as [number, number], radius: 2.5 };
  expect(streetUnionDistance([horizontal], 3, 3)).toBe(streetDistance(horizontal, 3, 3));
  expect(streetUnionDistance([horizontal, vertical], 2.7, 2.7)).toBeLessThan(0);
  expect(streetUnionDistance([horizontal, vertical], 4, 4)).toBeGreaterThan(0);
  const parallel = { ...horizontal, a: [-12, 6] as [number, number], b: [12, 6] as [number, number] };
  expect(streetUnionDistance([horizontal, parallel], 0, 3)).toBe(0.5);
});

it("joins historic streets in their selected stone while protecting planted and occupied parcels", () => {
  const p = { roads: [
    { id: "town-street-0-0", kind: "street", width: 2, span: 5, points: [{ x: -12, y: 0 }, { x: 12, y: 0 }] },
    { id: "town-street-1-1", kind: "street", width: 2, span: 5, points: [{ x: 0, y: -12 }, { x: 0, y: 12 }] },
  ], pavement: new Map([["3,3", "garden"], ["4,3", "court"], ["-12,3", "footway"]]),
    surface: new Map([["-12,0", "paving"], ["0,-12", "paving"], ["3,3", "grass"], ["4,3", "dirt"]]),
    streetSurfaces: new Map([["-12,0", "basalt"], ["0,-12", "basalt"], ["-12,3", "slab"]]),
    solid: new Set(), reserved: new Set(), traffic: new Set(), lanes: new Map() } as SettlementPlan;
  composeStreetGeometry(p, [{ x: -4, y: -4, w: 2, h: 2 }]);
  expect(p.streetGeometry?.size).toBeGreaterThan(0);
  expect(p.streetSurfaces!.get("0,0")).toBe("basalt");
  expect(p.streetSurfaces!.get("9,3")).toBe("slab");
  expect(p.pavement!.get("3,3")).toBe("garden");
  expect(p.surface.get("3,3")).toBe("grass");
  expect(p.surface.get("4,3")).toBe("dirt");
  expect(p.streetGeometry!.has("-3,-3")).toBe(false);
  expect([...p.streetSurfaces!.values()]).not.toContain("asphalt");
  const earth = { ...p, streetGeometry: undefined,
    streetSurfaces: new Map([["-12,0", "earth"], ["0,-12", "earth"]]) } as SettlementPlan;
  composeStreetGeometry(earth);
  expect(earth.streetGeometry).toBeUndefined();
  expect(earth.streetSurfaces!.get("-12,0")).toBe("earth");
});

it("resolves a T-junction into complete crossings with two walkable landings", () => {
  const marks = roadMarkings({ lon: 37.6, lat: 55.7, year: 1975 } as WorldSetting);
  const p = { lanes: new Map(), pavement: new Map(), surface: new Map(),
    streetSurfaces: new Map(), solid: new Set(), reserved: new Set(), traffic: new Set() } as SettlementPlan;
  for (let y = -6; y <= 16; y++)
    for (let x = -16; x <= 16; x++) {
      const k = cellKey(x, y);
      const horizontal = y >= -2 && y <= 2;
      const vertical = x >= -2 && x <= 2 && y >= 0;
      p.surface.set(k, "paving");
      if (horizontal || vertical)
        p.lanes!.set(k, { axis: horizontal ? "x" : "y", at: horizontal ? y + 2 : x + 2,
          span: 5, junction: horizontal && vertical, marks });
      else p.pavement!.set(k, "footway");
    }
  const [j] = resolveJunctions(p);
  expect(j.approaches).toHaveLength(3);
  expect(j.approaches.every((a) => a.crossing)).toBe(true);
  for (const a of j.approaches) {
    for (const at of a.landings) expect(p.pavement!.get(cellKey(at.x, at.y))).toBe("footway");
    for (let i = 0; i < a.span; i++) {
      const k = a.axis === "x" ? cellKey(a.edge, a.start + i) : cellKey(a.start + i, a.edge);
      expect(p.lanes!.get(k)).toMatchObject({ toJunction: a.toward, crossing: true });
    }
  }
  const blocked = j.approaches[0].landings[0];
  p.solid.add(cellKey(blocked.x, blocked.y));
  expect(resolveJunctions(p)[0].approaches[0].crossing).toBe(false);
});
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

it("keeps courts and yards out of roadway detection and leaves planted gaps intact", () => {
  for (const role of ["court", "yard", "square"] as const) {
    const sample: TopographySample = (x) => ({ height: 0, surface: "gravel", feature: "paving",
      streetMaterial: "sett", pavement: x === 0 ? "footway" : role });
    expect(roadwayMaterial(sample, 0, 0)).toBeUndefined();
    expect(kerbed(sample, 0, 0)).toBe(false);
  }
  const street: TopographySample = (x) => ({ height: 0, surface: "gravel", feature: "paving",
    streetMaterial: "sett", pavement: x === 0 ? "footway" : undefined });
  expect(kerbed(street, 0, 0)).toBe(true);
  for (const role of ["garden", "park", "vacant", "yard"] as const) {
    const sample: TopographySample = (x) => x === 0
      ? { height: 0, surface: "grass", pavement: role }
      : { height: 0, surface: "gravel", feature: "paving", streetMaterial: "slab" };
    expect(enclosed(sample, 0, 0)).toBe(false);
  }
});

it("keeps all ground uses and materials seamless across negative chunk origins", () => {
  for (const material of ["slab", "basalt", "cobble", "sett", "brick", "plank", "macadam", "concrete", "asphalt"] as const)
    for (const pavement of [undefined, "footway", "court", "yard", "square"] as const) {
      const sample: TopographySample = () => ({ height: 0, surface: "gravel", feature: "paving", streetMaterial: material, pavement });
      expect(rasterStreetTile(sample, 0, 0, -17, -19).pixels).toEqual(rasterStreetTile(sample, -17, -19, 0, 0).pixels);
    }
});
