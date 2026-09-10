import { settingFor } from "../../src/content/geography/resolve";
import { places } from "../../src/content/geography/places";
import { createSettingSession } from "../../src/runtime/session";

/** The fixed review set: two modern grids, two waterfront cities, two
 * pre-modern fabrics, and a walled Asian capital. */
export const PANEL = [
  { place: "city-miami", year: 2001 },
  { place: "city-new-york", year: 2000 },
  { place: "london", year: 1400 },
  { place: "london", year: 2000 },
  { place: "rome", year: 100 },
  { place: "alexandria", year: -244 },
  { place: "city-cairo", year: 900 },
  { place: "city-beijing", year: 1450 },
] as const;

export function panelSetting(place: string, year: number) {
  const base = settingFor(places.find((p) => p.id === place)!, year);
  return {
    ...base,
    terrainRevision: 2,
    vegetationRevision: 5,
    settlementPattern: "dense",
    environment: {
      ecology: "temperate-woodland",
      landform: "rolling",
      population: "settled",
      start: "resident",
      household: "mixed",
    },
  } as typeof base;
}

/** Builds one panel city in-process and measures it. */
export function panelCity(place: string, year: number, seed = "city-review") {
  const t0 = performance.now();
  const engine = createSettingSession(panelSetting(place, year), seed);
  const world = engine.world as typeof engine.world & {
    planAt(x: number, y: number): any;
  };
  const plan = world.planAt(world.spawn.x, world.spawn.y);
  const genMs = Math.round(performance.now() - t0);
  const r: number = plan.site.profile.radius;
  const c = plan.site.center as { x: number; y: number };
  let built = 0;
  for (const p of plan.places) built += p.w * p.h;
  // Built share of the core: the third of the extent nearest the square.
  const core = Math.max(20, Math.round(r / 3));
  let coreBuilt = 0;
  for (const p of plan.places)
    if (Math.abs(p.x + p.w / 2 - c.x) < core && Math.abs(p.y + p.h / 2 - c.y) < core)
      coreBuilt += p.w * p.h;
  return {
    place,
    year,
    genMs,
    radius: r,
    buildings: plan.places.length as number,
    humans: engine.state.actors.filter((a) => a.kind === "human").length,
    builtShare: built / (2 * r + 1) ** 2,
    coreShare: coreBuilt / (2 * core) ** 2,
    parks: plan.plots.filter((p: { id: string }) => p.id.includes("-park-")).length as number,
    routeFailures: plan.diagnostics.routeFailures as number,
    timing: (plan.diagnostics.timing ?? {}) as Record<string, number>,
    engine,
    plan,
  };
}
