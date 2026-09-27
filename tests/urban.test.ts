import { expect, it } from "vitest";
import { resolveSetting } from "../src/content/geography/resolve";
import { integratedSetting } from "../src/content/geography/defaults";
import { packForSetting } from "../src/content/geography/pack";
import { settlementProfile } from "../src/content/settlements/profiles";
import { planSettlement } from "../src/world/v3/plan";
import { route } from "../src/core/routing";
import { civicProfile } from "../src/content/settlements/civic";
import { inside } from "../src/world/v3/types";
import { roadCells } from "../src/world/v3/roads";
import { modernBuildingSince } from "../src/content/settlements/modern-buildings";
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
        // Bounded to the territory: a household's field lies out past the
        // built edge, along a track from the gate.
        route(p.spawn, goal, (q) =>
          p.solid.has(`${q.x},${q.y}`) ||
          Math.abs(q.x) > 200 ||
          Math.abs(q.y) > 200
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
it("zones an industrial-age city into a downtown, factories and the housing of each ring's date", () => {
  const plan = (query: string) => {
    const r = resolveSetting(query);
    if ("error" in r) throw Error(r.error);
    const s = integratedSetting(r.setting);
    return planSettlement(
      {
        id: "city",
        cx: 0,
        cy: 0,
        home: true,
        center: { x: 0, y: 0 },
        profile: { ...settlementProfile(s), radius: 90 },
      },
      packForSetting(s),
      "zoning",
      flat,
      [],
    );
  };
  const uses = (p: ReturnType<typeof plan>) =>
    new Set(p.places.map((q) => q.landUse).filter(Boolean));
  const richmond = plan("Richmond 2014");
  expect([...uses(richmond)]).toEqual(
    expect.arrayContaining(["downtown", "industrial", "suburb"]),
  );
  // Downtown is the rebuilt centre; the suburbs are the last ring.
  const distance = (use: string) => {
    const at = richmond.places.filter((q) => q.landUse === use);
    return at.reduce((d, q) => d + Math.hypot(q.x, q.y), 0) / at.length;
  };
  expect(distance("downtown")).toBeLessThan(distance("suburb"));
  // The modern gold masters: sheds by the works, blocks on the shopping
  // streets, curtain-wall towers downtown once the date allows them.
  const built = (use: string, name: string) =>
    richmond.places.some((q) => q.landUse === use && q.sprite.startsWith(name));
  expect(richmond.places.some((q) => q.landUse === "industrial" && /^modern-(works|sawtooth-shed)/.test(q.sprite))).toBe(true);
  expect(built("commercial", "modern-brickshop")).toBe(true);
  expect(built("downtown", "modern-curtain-tower")).toBe(true);
  expect(
    plan("Richmond 1935").places.some((q) => q.sprite.startsWith("modern-curtain-tower")),
  ).toBe(false);
  expect(uses(plan("Moscow 1975")).has("estate")).toBe(true);
  // Before the industrial onset there is no zoning at all.
  expect(uses(plan("Richmond 1790")).size).toBe(0);
  // Open-air market pitches give way to shops once cars come.
  expect(
    richmond.objects.filter((o) => o.id.includes("-pitch-")),
  ).toHaveLength(0);
  // Its streets are wide enough to park on, cross at junctions and are
  // marked for crossing on the approach.
  const lanes = [...richmond.lanes!.values()];
  // A city this size lays its arterials as boulevards with planted medians.
  expect(Math.max(...lanes.map((l) => l.span))).toBe(12);
  expect(lanes.some((l) => l.boulevard)).toBe(true);
  expect(lanes.some((l) => l.junction)).toBe(true);
  expect(lanes.some((l) => l.toJunction === 1 || l.toJunction === -1)).toBe(true);
  for (const l of lanes) expect(l.at).toBeGreaterThanOrEqual(0);
  for (const l of lanes) expect(l.at).toBeLessThan(l.span);
  // Cars of the date park along the kerb, facing the way their side drives,
  // standing on cells nobody can walk through.
  const cars = richmond.objects.filter((o) => o.sprite.startsWith("vehicle-"));
  expect(cars.length).toBeGreaterThan(20);
  for (const car of cars) {
    expect(richmond.solid.has(`${car.pos.x},${car.pos.y}`)).toBe(true);
    expect(car.sprite).not.toMatch(/tourer|1935|1948/);
  }
  expect(new Set(cars.map((c) => c.sprite.at(-1)))).toEqual(
    new Set(["e", "w", "n", "s"]),
  );
  expect(
    plan("Richmond 1790").objects.some((o) => o.sprite.startsWith("vehicle-")),
  ).toBe(false);
  expect(richmond.objects.some((o) => o.sprite.includes("traffic-signal-2"))).toBe(true);

  // Between the wars: trams on the arterials, concrete side streets, the
  // railway through town with its station, and the first signals.
  const interwar = plan("Richmond 1935");
  const lanes35 = [...interwar.lanes!.values()];
  expect(lanes35.some((l) => l.tram)).toBe(true);
  expect(new Set(interwar.streetSurfaces!.values())).toContain("concrete");
  expect([...interwar.pavement!.values()]).toContain("rail");
  expect(interwar.places.some((p) => p.name === "Railway station")).toBe(true);
  expect([...interwar.pavement!.values()]).toContain("platform");
  expect(interwar.objects.some((o) => o.sprite.includes("traffic-signal-0"))).toBe(true);
});

it("keeps urban geometry deterministic and the old selection opt-in", () => {
  expect(city("same").places).toEqual(city("same").places);
  const old = { ...setting, urbanRevision: undefined };
  expect(settlementProfile(old).pattern).toBe("planned");
  expect(settlementProfile(setting).pattern).toBe("dense");
});

it("frames modern civic squares without roads, market stalls or a shared fire", () => {
  const r = resolveSetting("Moscow 1975");
  if ("error" in r) throw Error(r.error);
  const s = integratedSetting(r.setting);
  for (const seed of ["modern-square-review", "another-square"]) {
    const p = planSettlement({ id: "city", cx: 0, cy: 0, home: true, center: { x: 0, y: 0 },
      profile: { ...settlementProfile(s), radius: 90 } }, packForSetting(s), seed, flat, []);
    const square = p.plots.find((p) => p.id.startsWith("city-square-"))!;
    expect(square.w).toBeLessThanOrEqual(21);
    expect(p.objects.some((o) => o.id === "city-hearth")).toBe(false);
    expect(p.objects.filter((o) => inside(square, o.pos.x, o.pos.y)).some((o) =>
      o.kind === "fire" || o.prop === "marketCounter")).toBe(false);
    expect(p.places.some((p) => p.id === "city-civic" && p.sprite.startsWith("modern-civic-hall"))).toBe(true);
    const road = new Set<string>();
    for (const r of p.roads.filter((r) => /-(street-\d|avenue-)/.test(r.id)))
      roadCells(r, (x, y) => road.add(`${x},${y}`));
    const queue = [road.values().next().value!];
    road.delete(queue[0]);
    for (let i = 0; i < queue.length; i++) {
      const [x, y] = queue[i].split(",").map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = `${x + dx},${y + dy}`;
        if (road.delete(k)) queue.push(k);
      }
    }
    expect(road.size, "laid streets remain connected after terrain clipping").toBe(0);
    for (const park of p.plots.filter((p) => p.id.startsWith("city-park-"))) {
      expect(p.solid.has(`${park.access.x},${park.access.y}`)).toBe(false);
      expect(p.places.some((b) => b.x < park.x + park.w && b.x + b.w > park.x &&
        b.y < park.y + park.h && b.y + b.h > park.y)).toBe(false);
    }
    for (const enclosure of p.enclosures.filter((e) => e.parts?.some((part) => part.frame.includes("works-fence"))))
      expect(p.solid.has(`${enclosure.gate.x},${enclosure.gate.y}`)).toBe(false);
    for (const b of p.places.filter((b) => b.landUse === "industrial"))
      expect(route(p.spawn, b.entrance, (q) => p.solid.has(`${q.x},${q.y}`) ||
        Math.abs(q.x) > 160 || Math.abs(q.y) > 160 ? Infinity : 1).status, b.id).toBe("found");
    expect(p.loadingBays!.size).toBeGreaterThan(0);
    for (const k of p.loadingBays!.keys()) expect(p.solid.has(k), `loading access ${k}`).toBe(false);
    for (const b of p.places) {
      const since = modernBuildingSince(b.sprite);
      if (since && b.structure) expect(b.structure.built).toBeGreaterThanOrEqual(since);
    }
    for (let y = square.y; y < square.y + square.h; y++)
      for (let x = square.x; x < square.x + square.w; x++) expect(p.lanes!.has(`${x},${y}`)).toBe(false);
    expect(p.objects.filter((o) => o.id.startsWith("city-square-bench-") && o.sprite.startsWith("study-propb-street-bench-"))).toHaveLength(4);
    for (const o of p.objects.filter((o) => o.id.includes("-quarter-well"))) {
      expect(o.sprite).toBe("study-propb-pump-0");
      expect(p.pavement!.get(`${o.pos.x},${o.pos.y}`)).toBe("footway");
    }
    expect(p.junctions!.some((j) => j.approaches.some((a) => a.crossing))).toBe(true);
    for (const j of p.junctions!)
      for (const a of j.approaches.filter((a) => a.crossing))
        for (const landing of a.landings) {
          const k = `${landing.x},${landing.y}`;
          expect(p.solid.has(k), k).toBe(false);
          expect(["footway", "square"]).toContain(p.pavement!.get(k));
        }
    const hall = p.places.find((p) => p.id === "city-civic")!;
    expect(route(p.spawn, hall.entrance, (q) =>
      p.solid.has(`${q.x},${q.y}`) || Math.abs(q.x) > 150 || Math.abs(q.y) > 150 ? Infinity : 1).status).toBe("found");
  }
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
