import { expect, it } from "vitest";
import {
  coastDistance,
  coastBeachWidth,
} from "../src/render/living-water/coast";
import { shorePolishDefaults } from "../src/render/living-water/polish";
import { rasterLivingWater } from "../src/render/living-water/mask";
import { rasterHabitatTile, beachTint } from "../src/render/habitat-raster";
import { puddlesAt } from "../src/render/puddles";
import type { TopographySample } from "../src/core/topography";
it("narrows a beach continuously beside a rise instead of cutting it at a tile boundary", () => {
  const sample: TopographySample = (x) => ({
    height: x >= 4 ? 1 : 0,
    surface: "grass",
    waterVisual: {
      distance: 4, kind: "sea", ecology: "grassland", shoreWidth: 3,
      flow: [0, 1], frozenMargin: false,
    },
  });
  const mask = rasterLivingWater(sample, 4, 4, undefined, {
    ...shorePolishDefaults, enabled: false, blend: 0, coastBeachWidth: 12,
    coastScallop: 0, beachVariation: 0,
  });
  for (let y = 0; y < 64; y++) {
    const left = ((y + 96) * mask.width + 31) * 4;
    const right = left + 4;
    expect(mask.pixels[left + 3]).toBe(255);
    expect(mask.pixels[right + 3]).toBe(255);
    expect(Math.abs(mask.pixels[left] - mask.pixels[right])).toBeLessThanOrEqual(2);
  }
});

it("coastal relief is bounded, tunable and absent offshore", () => {
  const s = shorePolishDefaults;
  const edge = Array.from({ length: 200 }, (_, x) => coastDistance(0, x, 0, s));
  expect(Math.max(...edge) - Math.min(...edge)).toBeGreaterThan(0.8);
  expect(edge.every((x) => Math.abs(x) <= s.coastScallop!)).toBe(true);
  expect(coastDistance(0, 17, 4, { ...s, coastScallop: 0 })).toBe(0);
  expect(coastDistance(-20, 17, 4, s)).toBe(-20);
  expect(coastBeachWidth(4, 17, 4, { ...s, beachVariation: 0 })).toBe(4);
  expect(coastBeachWidth(4, 17, 4, s)).not.toBe(coastBeachWidth(4, 60, 4, s));
});
it("scallops and beach edges match across independently prepared chunks", () => {
  const sample: TopographySample = (_x, y) => ({
    height: 0,
    surface: y < 4 ? "water" : "sand",
    waterVisual: {
      distance: y - 4,
      kind: "sea",
      ecology: "tropical-woodland",
      shoreWidth: 3,
      flow: [0, 1],
      frozenMargin: false,
    },
  });
  const full = rasterLivingWater(
    sample,
    32,
    12,
    undefined,
    shorePolishDefaults,
  );
  for (const offset of [0, 16]) {
    const patch = rasterLivingWater(
      (x, y) => sample(x + offset, y),
      16,
      12,
      { x: offset, y: 0, prefix: "test" },
      shorePolishDefaults,
    );
    for (let y = 0; y < patch.height; y++) {
      const start = (y * full.width + offset * 16) * 4;
      expect(
        patch.pixels.slice(y * patch.width * 4, (y + 1) * patch.width * 4),
      ).toEqual(full.pixels.slice(start, start + patch.width * 4));
    }
  }
});

it("keeps tropical shore sand off pure white and avoids turf lips on sand", () => {
  const sample: TopographySample = (x) => ({
    height: 0,
    surface: x < 0 ? "water" : "sand",
    rock: "laterite",
    habitat: {
      ecology: "tropical-woodland",
      colorway: "rainforest",
      kind: "open",
      wet: 0.3,
      cover: 0,
      exposed: 0.9,
      season: "autumn",
      site: {
        primary: "shore",
        weights: { shore: 1 },
        region: { ecology: "tropical-woodland", colorway: "rainforest" },
        conditions: { moisture: 0.5, saturation: 0.1, slope: 0, canopy: 0, exposure: 0.9, freshwater: false, inundated: false },
      },
    },
    waterVisual: {
      distance: x + 0.5,
      kind: "sea",
      ecology: "tropical-woodland",
      shoreWidth: 2,
      shelf: 4.6,
      tide: 0.3,
      flow: [0, 1],
      frozenMargin: false,
    },
  });
  const tile = rasterHabitatTile(sample, 2, 0, 0, 0);
  let pureWhite = 0, darkGreen = 0;
  for (let i = 0; i < tile.pixels.length; i += 4) {
    const r = tile.pixels[i], g = tile.pixels[i + 1], b = tile.pixels[i + 2];
    if (r === 255 && g === 255 && b === 255) pureWhite++;
    if (g > r + 15 && g < 130) darkGreen++;
  }
  expect(pureWhite).toBe(0);
  expect(darkGreen).toBe(0);
});

it("starts beach rain rivulets downhill toward the sea on east-west beaches", () => {
  // Cliff on the east (x >= 6), sea on the west (x < 0): downhill is due west (ax < 0).
  const sample: TopographySample = (x) => ({
    height: x >= 6 ? 2 : 0,
    surface: x < 0 ? "water" : x >= 6 ? "grass" : "sand",
    waterVisual: {
      distance: x + 0.5,
      kind: "sea",
      ecology: "tropical-woodland",
      shoreWidth: 5,
      flow: [0, 1],
      frozenMargin: false,
    },
  });
  let spots: ReturnType<typeof puddlesAt> = [];
  for (let y = 0; y < 30 && !spots.length; y++)
    spots = puddlesAt(sample, 5, y, 0, 0, y * 16);
  expect(spots.length).toBeGreaterThan(0);
  expect(spots[0].ax).toBeLessThan(-0.5);
});

it("tints shore-site soil cells like adjacent sand and lets worn earth show through living water", () => {
  const base = {
    height: 0,
    rock: "laterite" as const,
    habitat: {
      ecology: "tropical-woodland" as const,
      colorway: "rainforest" as const,
      kind: "open" as const,
      wet: 0.3,
      cover: 0,
      exposed: 0.9,
      season: "summer",
      site: {
        primary: "shore" as const,
        weights: { shore: 1 },
        region: { ecology: "tropical-woodland" as const, colorway: "rainforest" as const },
        conditions: { moisture: 0.5, saturation: 0.1, slope: 0, canopy: 0, exposure: 0.9, freshwater: false, inundated: false },
      },
    },
    waterVisual: {
      distance: 3,
      kind: "sea" as const,
      ecology: "tropical-woodland" as const,
      shoreWidth: 6,
      flow: [0, 1] as const,
      frozenMargin: false,
    },
  };
  expect(beachTint({ ...base, surface: "soil" })).toEqual(beachTint({ ...base, surface: "sand" }));
  const sample: TopographySample = (x, y) => ({
    ...base,
    surface: y < 2 ? "water" : "sand",
    groundWear: x === 4 && y === 4 ? 0.9 : 0,
    waterVisual: { ...base.waterVisual, distance: y - 1.5 },
  });
  const mask = rasterLivingWater(sample, 8, 8, undefined, shorePolishDefaults);
  // Center of the heavily worn spot yields to the ground raster; unworn sand nearby stays covered.
  expect(mask.pixels[((4 * 16 + 8 + 96) * mask.width + 4 * 16 + 8) * 4 + 3]).toBe(0);
  expect(mask.pixels[((4 * 16 + 8 + 96) * mask.width + 2 * 16 + 8) * 4 + 3]).toBe(255);
});

it("moves wall-owned flat pixels cleared for living water into an underLiving backdrop", async () => {
  const { handleTerrainRequest, useTerrainWorld } = await import("../src/render/terrain-worker");
  const base = {
    rock: "limestone" as const,
    habitat: {
      ecology: "tropical-woodland" as const,
      colorway: "rainforest" as const,
      kind: "open" as const,
      wet: 0.3,
      cover: 0,
      exposed: 0.9,
      season: "summer",
      site: {
        primary: "shore" as const,
        weights: { shore: 1 },
        region: { ecology: "tropical-woodland" as const, colorway: "rainforest" as const },
        conditions: { moisture: 0.5, saturation: 0.1, slope: 0, canopy: 0, exposure: 0.9, freshwater: false, inundated: false },
      },
    },
  };
  const topography = (x: number, y: number) => ({
    ...base,
    height: x < 6 && y >= 6 ? 1 : 0,
    surface: (y < 2 ? "water" : x < 6 && y >= 6 ? "grass" : "sand") as "water" | "grass" | "sand",
    waterVisual: {
      distance: y - 1.5,
      kind: "sea" as const,
      ecology: "tropical-woodland" as const,
      shoreWidth: 7,
      flow: [0, 1] as const,
      frozenMargin: false,
    },
  });
  const posted: unknown[] = [];
  const prevSelf = globalThis.self;
  (globalThis as unknown as { self: { postMessage: (m: unknown) => void } }).self = {
    postMessage: (m: unknown) => posted.push(m),
  };
  try {
    useTerrainWorld({
      topography,
      decoration: () => undefined,
    } as unknown as import("../src/core/types").WorldModel);
    handleTerrainRequest({
      style: (await import("../src/render/ground-style")).defaultGroundStyle(),
      living: true,
      polish: shorePolishDefaults,
    });
    handleTerrainRequest({ id: "t1", region: { x: 0, y: 0, prefix: "t1" } });
  } finally {
    (globalThis as unknown as { self: unknown }).self = prevSelf;
  }
  const resp = posted.at(-1) as { layers: import("../src/render/terrain-contours").ContourLayer[] };
  const backdrop = resp.layers.find((l) => l.underLiving);
  expect(backdrop).toBeDefined();
  let opaque = 0;
  for (let i = 3; i < backdrop!.pixels.length; i += 4) if (backdrop!.pixels[i] > 0) opaque++;
  expect(opaque).toBeGreaterThan(0);
});

it("keeps non-pier beach launches narrow and stamps wear beneath shore work stations", async () => {
  const { resolveSetting } = await import("../src/content/geography/resolve");
  const { packForSetting } = await import("../src/content/geography/pack");
  const { createSettlementWorld } = await import("../src/world/v3/generate");
  const resolved = resolveSetting("A fisher in Lagos, 1600");
  if (!("setting" in resolved)) throw new Error(resolved.error);
  const setting = {
    ...resolved.setting,
    settlement: "village" as const,
    environment: { ...resolved.setting.environment!, population: "sparse" as const },
  };
  const world = createSettlementWorld(packForSetting(setting), "coast-rev-2", undefined, false);
  const plan = world.planAt(0, 0)!;
  const member = plan.waterfront!.members[0];
  // Outer flanks of a 7-wide beach launch clearance stay local ground, not orphan dirt slabs.
  const dir = member.launch.direction;
  const tx = -dir.y, ty = dir.x;
  const outerFlank = member.launch.dry.filter((p) => {
    const k = `${p.x},${p.y}`;
    return (
      Math.abs((p.x - member.launch.origin.x) * tx + (p.y - member.launch.origin.y) * ty) >= 2 &&
      !plan.traffic.has(k) &&
      !plan.pavement?.has(k)
    );
  });
  expect(outerFlank.length).toBeGreaterThan(0);
  expect(outerFlank.every((p) => plan.surface.get(`${p.x},${p.y}`) !== "dirt")).toBe(true);
  // Outdoor sorting station stamps local groundWear beneath itself.
  const sortObj = plan.objects.find((o) => o.id === member.catchId)!;
  expect(world.topography!(sortObj.pos.x, sortObj.pos.y).groundWear ?? 0).toBeGreaterThan(0.5);
  // Beached non-pier household boat gets a dry-shore mooring stake.
  const boatObj = plan.objects.find((o) => o.id === member.boatId)!;
  expect(boatObj.mooring).toBeDefined();
  expect(world.topography!(boatObj.mooring!.x, boatObj.mooring!.y).surface).not.toBe("water");
});

it("adds bounded subtle wind-ripple and fleck grain across dry sea beach sand", async () => {
  const { dryBeachGrain } = await import("../src/render/material-edges");
  const base = [196, 188, 174];
  let minR = 255, maxR = 0;
  for (let y = 0; y < 48; y++)
    for (let x = 0; x < 48; x++) {
      const [r, g, b] = dryBeachGrain(base, x, y);
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      expect(Math.abs(r - base[0])).toBeLessThanOrEqual(16);
      expect(Math.abs(g - base[1])).toBeLessThanOrEqual(16);
      expect(Math.abs(b - base[2])).toBeLessThanOrEqual(16);
    }
  expect(maxR - minR).toBeGreaterThanOrEqual(6);
});

it("forms rain puddles along narrow village footpaths cut through grass", () => {
  // A 1-cell-wide north-south dirt footpath flanked by grass on east and west.
  const sample: TopographySample = (x) => ({
    height: 0,
    surface: x === 0 ? "soil" : "grass",
    pathArt: x === 0 ? [{ a: [0.5, -0.5], b: [0.5, 1.5], radius: 0.75 }] : undefined,
    groundWear: x === 0 ? 0.8 : 0,
  });
  let found = 0;
  for (let y = 0; y < 80; y++) found += puddlesAt(sample, 0, y, 0, 0, y * 16).length;
  expect(found).toBeGreaterThan(0);
});

it("blends sea-beach dirt patches into beach sand without dark turf trench borders", () => {
  const sample: TopographySample = (x, y) => ({
    height: 0,
    surface: x === 0 && y === 0 ? "soil" : "sand",
    pavement: x === 0 && y === 0 ? "yard" : undefined,
    rock: "laterite",
    habitat: {
      ecology: "tropical-woodland",
      colorway: "rainforest",
      kind: "open",
      wet: 0.3,
      cover: 0,
      exposed: 0.9,
      season: "summer",
      site: {
        primary: "shore",
        weights: { shore: 1 },
        region: { ecology: "tropical-woodland", colorway: "rainforest" },
        conditions: { moisture: 0.5, saturation: 0.1, slope: 0, canopy: 0, exposure: 0.9, freshwater: false, inundated: false },
      },
    },
    waterVisual: {
      distance: 2.5,
      kind: "sea",
      ecology: "tropical-woodland",
      shoreWidth: 4,
      flow: [0, 1],
      frozenMargin: false,
    },
  });
  const tile = rasterHabitatTile(sample, 0, 0, 0, 0);
  let darkTrench = 0;
  for (let i = 0; i < tile.pixels.length; i += 4) {
    const r = tile.pixels[i], g = tile.pixels[i + 1], b = tile.pixels[i + 2];
    if (r < 95 && g < 95 && b < 95) darkTrench++;
  }
  expect(darkTrench).toBe(0);
});

it("bakes and selects all 4 procedural variants for coastal fishing and craft worksites", async () => {
  const { worksiteVariantFrame } = await import("../src/render/prop-variety");
  const { default: worksites } = await import("../src/render/generated/worksites.json");
  const frames = new Set(Object.keys((worksites as { frames: Record<string, unknown> }).frames));
  for (const base of [
    "worksite-fish-mat",
    "worksite-fish-trays",
    "worksite-fish-table",
    "worksite-seine-pegs",
    "worksite-net-rail",
    "worksite-net-frame",
    "worksite-dye-racks",
    "worksite-pottery-rack",
    "worksite-tanner-rack",
    "worksite-loom-frame",
    "worksite-smith-bench",
    "worksite-carpenter-bench",
    "worksite-mason-bench",
    "worksite-press-yard",
    "worksite-paper-yard",
    "worksite-ropewalk",
    "worksite-foundry-yard",
    "worksite-soap-yard",
    "worksite-silk-yard",
    "worksite-charcoal-yard",
  ]) {
    expect(frames.has(base)).toBe(true);
    for (let v = 1; v < 4; v++) expect(frames.has(`${base}-${v}`)).toBe(true);
    expect(worksiteVariantFrame(base, 0.05, (f) => frames.has(f))).toBe(base);
    expect(worksiteVariantFrame(base, 0.35, (f) => frames.has(f))).toBe(`${base}-1`);
    expect(worksiteVariantFrame(base, 0.65, (f) => frames.has(f))).toBe(`${base}-2`);
    expect(worksiteVariantFrame(base, 0.95, (f) => frames.has(f))).toBe(`${base}-3`);
  }
});

it("places outdoor craft stations with trodden groundWear in non-fishing craft yards", async () => {
  const { resolveSetting } = await import("../src/content/geography/resolve");
  const { packForSetting } = await import("../src/content/geography/pack");
  const { createSettlementWorld } = await import("../src/world/v3/generate");
  const { worksitesFor } = await import("../src/content/settlements/worksites");
  // Regional craft profile coverage check (fast unit check).
  for (const [prompt, id] of [
    ["A weaver in Oaxaca, 1650", "mesoamerican-weavers-yard"],
    ["A weaver in Cusco, 1500", "andean-weavers-yard"],
    ["A smith in Damascus, 1300", "west-asian-smithy"],
    ["A carpenter in Florence, 1500", "european-carpentry-yard"],
    ["A mason in Florence, 1500", "european-masons-yard"],
    ["A brewer in London, 1650", "european-brewhouse"],
    ["A scribe in Kyoto, 1650", "east-asian-papermill"],
    ["A rope-maker in Venice, 1500", "european-ropewalk"],
    ["A bronze-caster in Benin City, 1600", "west-african-bronze-foundry"],
    ["A soap-boiler in Damascus, 1400", "levantine-soapworks"],
    ["A silk-farmer in Kyoto, 1650", "east-asian-sericulture"],
    ["A charcoal-burner in Florence, 1500", "european-charcoal-yard"],
  ] as const) {
    const r = resolveSetting(prompt);
    if (!("setting" in r)) throw new Error(r.error);
    expect(worksitesFor(r.setting).some((p) => p.id === id), `${prompt} -> ${id}`).toBe(true);
  }
  // Single sparse world build verifying craft station placement and trodden groundWear.
  const resolved = resolveSetting("A weaver in Oaxaca, 1650");
  if (!("setting" in resolved)) throw new Error(resolved.error);
  const setting = {
    ...resolved.setting,
    settlement: "village" as const,
    environment: { ...resolved.setting.environment!, population: "sparse" as const },
  };
  const world = createSettlementWorld(packForSetting(setting), "craft-stations-test", undefined, false);
  const plan = world.planAt(0, 0)!;
  const loom = plan.objects.find((o) => o.pos.space === "outside" && o.sprite === "worksite-loom-frame");
  expect(loom).toBeDefined();
  expect(world.topography!(Math.floor(loom!.pos.x), Math.floor(loom!.pos.y)).groundWear ?? 0).toBeGreaterThan(0.5);
}, 25000);
