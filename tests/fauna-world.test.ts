import { describe, expect, it } from "vitest";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { faunaAt, faunaProfile } from "../src/content/fauna";
import { advanceFauna, stepAllowed, type FaunaWorld } from "../src/core/fauna-sim";
import type { FaunaGroup } from "../src/core/fauna";
import { habitatTagsAt, spawnFauna } from "../src/world/v3/fauna";
import type { WorldModel } from "../src/core/types";
import type { TopographyCell } from "../src/core/topography";

const at = (id: string, year: number) =>
  settingFor(places.find((p) => p.id === id)!, year);
const ids = (year: number, place: string) => faunaAt(at(place, year)).map((p) => p.id);

describe("fauna presence", () => {
  it("dates and places each species", () => {
    expect(ids(-6499, "konya")).toEqual(
      expect.arrayContaining(["sheep", "red-deer", "gray-wolf", "house-sparrow"]),
    );
    expect(ids(-6499, "konya")).not.toContain("chicken");
    expect(ids(1400, "konya")).toContain("chicken");
  });
  it("keeps sheep and chickens out of the pre-Columbian Americas", () => {
    const mexico = places.find((p) => p.lon < -90 && p.lat > 15 && p.lat < 22);
    if (!mexico) return;
    const before = ids(1400, mexico.id);
    expect(before).not.toContain("sheep");
    expect(before).not.toContain("chicken");
    expect(before).not.toContain("red-deer");
  });
  it("loses the wolf from Britain after 1700", () => {
    const britain = places.find((p) => p.lon > -6 && p.lon < 2 && p.lat > 50 && p.lat < 56);
    if (!britain) return;
    expect(ids(1500, britain.id)).toContain("gray-wolf");
    expect(ids(1800, britain.id)).not.toContain("gray-wolf");
    expect(ids(1800, britain.id)).toContain("red-deer");
  });
});

function cell(height: number, extra: Partial<TopographyCell> = {}): TopographyCell {
  return { height, ...extra } as TopographyCell;
}

describe("fauna movement rules", () => {
  const heights = new Map<string, number>([
    ["0,0", 1],
    ["1,0", 1],
    ["2,0", 2],
    ["3,0", 2],
  ]);
  const world = {
    blocked: () => false,
    topography: (x: number, y: number) => cell(heights.get(`${x},${y}`) ?? 1),
  };
  it("keeps a sheep on its level and lets a wolf scramble the step", () => {
    const sheep = faunaProfile("sheep")!,
      wolf = faunaProfile("gray-wolf")!;
    expect(stepAllowed(world, sheep, { x: 0, y: 0 }, { x: 1, y: 0 })).toBe(true);
    expect(stepAllowed(world, sheep, { x: 1, y: 0 }, { x: 2, y: 0 })).toBe(false);
    expect(stepAllowed(world, wolf, { x: 1, y: 0 }, { x: 2, y: 0 })).toBe(true);
  });
  it("lets any animal use a slope", () => {
    const ramped = {
      ...world,
      topography: (x: number, y: number) =>
        cell(heights.get(`${x},${y}`) ?? 1, x === 1 ? { ramp: "e" as const } : {}),
    };
    expect(stepAllowed(ramped, faunaProfile("sheep")!, { x: 1, y: 0 }, { x: 2, y: 0 })).toBe(true);
  });
});

function sim(over: Partial<FaunaWorld> = {}): FaunaWorld {
  let n = 0;
  return {
    blocked: () => false,
    occupied: () => false,
    gateOpen: () => false,
    humans: [],
    rng: () => ((n = (n * 1103515245 + 12345) % 2147483648) / 2147483648),
    hour: 10,
    ...over,
  };
}
function group(speciesId: string, x: number, y: number): FaunaGroup {
  return {
    id: `g-${speciesId}`,
    speciesId,
    members: [{ x, y, direction: 1 }],
    pos: { x, y, space: "outside" },
    home: { x, y, space: "outside" },
    homeRadius: 6,
    state: "idle",
    nextDecisionAt: Infinity,
    stride: 0,
    since: 0,
  };
}

describe("fauna behaviour", () => {
  it("a deer runs from a person, a sheep does not", () => {
    const deer = group("red-deer", 10, 10),
      sheep = group("sheep", 10, 20);
    const world = sim({ humans: [{ x: 5, y: 10, space: "outside" }, { x: 5, y: 20, space: "outside" }] });
    advanceFauna([deer, sheep], world, 6);
    expect(deer.state).toBe("flee");
    expect(deer.members[0].x).toBeGreaterThan(10);
    expect(sheep.state).toBe("idle");
    expect(sheep.members[0]).toMatchObject({ x: 10, y: 20 });
  });
  it("a cornered deer stands its ground", () => {
    const deer = group("red-deer", 10, 10);
    // Wall on every side but the person's.
    const world = sim({
      blocked: (x, y) => !(x === 10 && y === 10) && !(x === 9 && y === 10),
      humans: [{ x: 8, y: 10, space: "outside" }],
    });
    advanceFauna([deer], world, 6);
    expect(deer.state).toBe("flee");
    expect(deer.members[0]).toMatchObject({ x: 10, y: 10, direction: 3 });
  });
  it("a wolf covers more ground than a sheep in the same time", () => {
    const wolf = group("gray-wolf", 0, 0),
      sheep = group("sheep", 0, 50);
    wolf.state = sheep.state = "wander";
    wolf.target = { x: 30, y: 0, space: "outside" };
    sheep.target = { x: 30, y: 50, space: "outside" };
    const world = sim();
    for (let t = 6; t <= 36; t += 6) advanceFauna([wolf, sheep], world, t);
    expect(wolf.members[0].x).toBeGreaterThan(sheep.members[0].x * 2);
  });
  it("a sparrow takes off, flies and lands", () => {
    const bird = group("house-sparrow", 10, 10);
    bird.state = "perch";
    const world = sim({ humans: [{ x: 9, y: 10, space: "outside" }] });
    advanceFauna([bird], world, 6);
    expect(bird.state).toBe("takeoff");
    const seen = new Set<string>();
    for (let t = 12; t <= 120; t += 6) {
      advanceFauna([bird], world, t);
      seen.add(bird.state);
    }
    expect([...seen]).toEqual(expect.arrayContaining(["flight", "landing", "perch"]));
  });
  it("a kept herd heads for the paddock when the gate is open by day", () => {
    const herd = group("sheep", 10, 10);
    herd.gateId = "gate";
    herd.pasture = { x: 10, y: 20, space: "outside" };
    herd.nextDecisionAt = 0;
    const world = sim({ gateOpen: () => true, hour: 10 });
    for (let t = 6; t <= 240; t += 6) advanceFauna([herd], world, t);
    expect(herd.members[0].y).toBeGreaterThan(16);
  });
});

describe("fauna spawning", () => {
  const habitatKind = (x: number) => (x % 64 < 32 ? "woodland" : "open");
  const world = {
    pack: { setting: at("konya", -6499) },
    settlements: [{ id: "s", name: "s", x: 200, y: 200, size: 20 }],
    blocked: () => false,
    terrain: () => "grass",
    topography: (x: number) =>
      cell(1, { habitat: { kind: habitatKind(x), ecology: "grassland", wet: 0.2, cover: 0.5, exposed: 0, season: "summer" } } as never),
  } as unknown as WorldModel;
  it("reads habitat off the cell and its neighbours", () => {
    expect([...habitatTagsAt(world, 10, 10)]).toEqual(["woodland"]);
    expect([...habitatTagsAt(world, 31, 10)].sort()).toEqual(["forest-edge", "woodland"]);
    expect([...habitatTagsAt(world, 210, 200)]).toContain("settlement");
  });
  it("spawns the same groups for the same seed and none near the town", () => {
    const a = spawnFauna(world, "seed", 100, 100);
    const b = spawnFauna({ ...world } as WorldModel, "seed", 100, 100);
    expect(a.map((g) => g.id)).toEqual(b.map((g) => g.id));
    expect(a.length).toBeGreaterThan(0);
    for (const g of a) {
      const p = faunaProfile(g.speciesId)!;
      if (p.category === "wild")
        expect(Math.hypot(g.pos.x - 200, g.pos.y - 200) - 20).toBeGreaterThanOrEqual(
          p.minimumSettlementDistance,
        );
      expect(g.members.length).toBeGreaterThanOrEqual(p.groupSize[0]);
    }
    expect(spawnFauna(world, "seed", 100, 100)).toEqual([]);
  });
});
