import { expect, it } from "vitest";
import { joinNetwork, type Sample } from "../src/world/v3/roads";
import { uniqueRoads } from "../src/world/v3/path-art";
import type { Road } from "../src/world/v3/types";
const dry: Sample = () => ({
  elevation: 0,
  moisture: 0.3,
  water: 50,
  kind: "river",
  snow: false,
});
const bounds = { x: -15, y: -15, w: 60, h: 60 };
it("joins the reachable network in one search, avoiding a nearer disconnected bank", () => {
  const network = new Set(["0,0", "10,5"]);
  const sample: Sample = (x, y) => ({ ...dry(x, y), water: x === 2 ? -1 : 50 });
  const r = joinNetwork(
    "join",
    { x: 4, y: 0 },
    sample,
    network,
    new Set(),
    new Set(),
    bounds,
  )!;
  expect(r.points.at(-1)).toEqual({ x: 10, y: 5 });
  expect(r.points.every((p) => p.x > 2)).toBe(true);
});
it("keeps wide spurs clear of obstacles and rejects unbridged water", () => {
  const network = new Set(["0,0"]);
  const sample: Sample = (x, y) => ({ ...dry(x, y), water: y === 2 ? -1 : 50 });
  expect(
    joinNetwork(
      "join",
      { x: 0, y: 5 },
      sample,
      network,
      new Set(),
      new Set(),
      bounds,
    ),
  ).toBeUndefined();
  const bridge = new Set(["0,2"]);
  expect(
    joinNetwork(
      "join",
      { x: 0, y: 5 },
      sample,
      network,
      bridge,
      new Set(),
      bounds,
    ),
  ).toBeDefined();
  expect(
    joinNetwork(
      "join",
      { x: 0, y: 5 },
      sample,
      network,
      bridge,
      new Set(),
      bounds,
      1,
    ),
  ).toBeUndefined();
});
it("unions shared edges, retains branches, and gives the widest road ownership", () => {
  const make = (id: string, points: Road["points"], width = 0): Road => ({
    id,
    points,
    width,
    kind: "path",
    cost: 0,
  });
  const roads = [
    make(
      "main",
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ],
      1,
    ),
    make("duplicate", [
      { x: 2, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 0 },
    ]),
    make("branch", [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ]),
  ];
  const result = uniqueRoads(roads);
  expect(result.reduce((n, r) => n + r.points.length - 1, 0)).toBe(3);
  expect(result.filter((r) => r.width === 1)).toHaveLength(2);
  expect(
    result.every((r) => r.points[0].x === 1 || r.points.at(-1)!.x === 1),
  ).toBe(true);
  expect(
    uniqueRoads([...roads].reverse()).reduce(
      (n, r) => n + r.points.length - 1,
      0,
    ),
  ).toBe(3);
});

it("keeps the worn center continuous through a shared wide junction", async () => {
  const { pathArt } = await import("../src/world/v3/path-art");
  const { pathCoverage } = await import("../src/render/material-edges");
  const roads: Road[] = [
    {
      id: "north",
      points: [
        { x: 0, y: -2 },
        { x: 0, y: -1 },
        { x: 0, y: 0 },
      ],
      width: 1,
      kind: "street",
      cost: 0,
    },
    {
      id: "south",
      points: [
        { x: 2, y: 3 },
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
        { x: 0, y: 0 },
      ],
      width: 1,
      kind: "street",
      cost: 0,
    },
  ];
  const index = pathArt(roads, true);
  const sample = (x: number, y: number) => ({
    height: 0 as const,
    surface: "soil" as const,
    pathArt: (index.get(`${x},${y}`) ?? []).map((s) => ({
      ...s,
      a: [s.a[0] - x, s.a[1] - y] as const,
      b: [s.b[0] - x, s.b[1] - y] as const,
    })),
  });
  for (let y = -1; y <= 1; y += 0.125)
    expect(pathCoverage(sample, 0.5, y + 0.5, 0, 0)).toBeGreaterThan(0.7);
});

it("attaches generated hamlet lanes to centerlines rather than painted shoulders", async () => {
  const { resolveSetting } = await import("../src/content/geography/resolve");
  const { packForSetting } = await import("../src/content/geography/pack");
  const { settlementProfile } = await import(
    "../src/content/settlements/profiles"
  );
  const { planSettlement } = await import("../src/world/v3/plan");
  const resolved = resolveSetting("medieval Normandy");
  if ("error" in resolved) throw Error(resolved.error);
  for (const pattern of ["farmstead", "clustered", "roadside"] as const) {
    const setting = {
      ...resolved.setting,
      roadRevision: 1 as const,
      terrainRevision: 2 as const,
      settlementPattern: pattern,
      environment: {
        ecology: "grassland" as const,
        landform: "plain" as const,
        population: "sparse" as const,
        start: "resident" as const,
        household: "mixed" as const,
      },
    };
    const p = planSettlement(
      {
        id: "centerline",
        cx: 0,
        cy: 0,
        center: { x: 0, y: 0 },
        home: true,
        profile: settlementProfile(setting),
      },
      packForSetting(setting),
      "junction",
      dry,
      [],
    );
    expect(p.places.length).toBeGreaterThan(0);
    const centers = new Set(["0,0"]);
    for (const road of p.roads) {
      expect(road.id).not.toContain("yard-access");
      expect(
        centers.has(`${road.points.at(-1)!.x},${road.points.at(-1)!.y}`),
        road.id,
      ).toBe(true);
      for (const point of road.points) centers.add(`${point.x},${point.y}`);
    }
  }
}, 30000);
