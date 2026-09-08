import { expect, it } from "vitest";
import { resolveSetting } from "../src/content/geography/resolve";
import { integratedSetting } from "../src/content/geography/defaults";
import { packForSetting } from "../src/content/geography/pack";
import { settlementProfile } from "../src/content/settlements/profiles";
import { planSettlement } from "../src/world/v3/plan";
import { route } from "../src/core/routing";
import { civicProfile } from "../src/content/settlements/civic";
const resolved = resolveSetting("Rome 100 BCE");
if ("error" in resolved) throw Error(resolved.error);
const setting = integratedSetting(resolved.setting);
const flat = () => ({
  elevation: 0,
  moisture: 0.5,
  water: 100,
  kind: "river" as const,
  snow: false,
});
function city(seed: string, radius = 74) {
  return planSettlement(
    {
      id: "city",
      cx: 0,
      cy: 0,
      home: true,
      center: { x: 0, y: 0 },
      profile: { ...settlementProfile(setting), radius },
    },
    packForSetting(setting),
    seed,
    flat,
    [],
  );
}
it("encloses public squares and courts with varied, non-overlapping ranges and reachable entrances", () => {
  for (const [seed, radius] of [
    ["city-review", 74],
    ["rome", 74],
    ["compact", 27],
  ] as const) {
    const p = city(seed, radius),
      occupied = new Set<string>();
    expect(p.places.length).toBeGreaterThanOrEqual(radius < 40 ? 3 : 20);
    expect(p.places.some((b) => b.id.endsWith("-civic"))).toBe(true);
    expect(p.places.some((b) => b.owner === "player")).toBe(true);
    expect(p.plots.some((b) => b.id.includes("-square-"))).toBe(true);
    expect(
      new Set(p.places.map((b) => `${b.w},${b.h}`)).size,
    ).toBeGreaterThanOrEqual(radius < 40 ? 2 : 3);
    for (const b of p.places)
      for (let y = b.y; y < b.y + b.h; y++)
        for (let x = b.x; x < b.x + b.w; x++) {
          const k = `${x},${y}`;
          expect(occupied.has(k)).toBe(false);
          occupied.add(k);
        }
    for (const goal of [
      ...p.places.map((b) => b.entrance),
      ...p.plots.map((b) => b.access),
      ...p.work.values(),
    ].map((g: any) => g.work ?? g)) {
      expect(
        route(p.spawn, goal, (q) =>
          p.solid.has(`${q.x},${q.y}`) ||
          Math.abs(q.x) > 90 ||
          Math.abs(q.y) > 90
            ? Infinity
            : 1,
        ).status,
        JSON.stringify(goal),
      ).toBe("found");
    }
    // Access routes must not carve through accepted buildings.
    for (const road of p.roads.filter((r) => /door|yard-access/.test(r.id)))
      for (const q of road.points)
        expect(p.solid.has(`${q.x},${q.y}`)).toBe(false);
  }
}, 30000);
it("keeps urban geometry deterministic and the old selection opt-in", () => {
  expect(city("same").places).toEqual(city("same").places);
  const old = { ...setting, urbanRevision: undefined };
  expect(settlementProfile(old).pattern).toBe("planned");
  expect(settlementProfile(setting).pattern).toBe("dense");
});
it("selects civic institutions by local date, with an explicitly unresearched fallback", () => {
  expect(civicProfile(setting).label).toBe("Civic basilica");
  expect(civicProfile({ ...setting, year: 1500, lon: 0, lat: 52 }).label).toBe(
    "Market hall",
  );
  expect(civicProfile({ ...setting, year: -500 }).evidence.status).toBe(
    "fictional",
  );
  expect(
    civicProfile({ ...setting, culture: "east-asian", lon: 120, lat: 32 })
      .label,
  ).toBe("Public meeting hall");
});

it("assigns coherent, deterministic materials to civic squares and street lanes", () => {
  const p = city("surface-mix");
  expect(p.streetSurfaces).toEqual(city("surface-mix").streetSurfaces);
  expect(new Set(p.streetSurfaces!.values()).size).toBeGreaterThan(1);
  for (const plot of p.plots.filter((v) => v.id.includes("-square-"))) {
    const materials = new Set<string>();
    for (let y = plot.y; y < plot.y + plot.h; y++)
      for (let x = plot.x; x < plot.x + plot.w; x++)
        if (p.pavement?.get(`${x},${y}`) === "square")
          materials.add(p.streetSurfaces!.get(`${x},${y}`)!);
    expect(materials.size).toBe(1);
    expect(materials.has("earth")).toBe(false);
  }
});
