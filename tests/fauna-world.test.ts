import { describe, expect, it } from "vitest";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { faunaAt, faunaProfile } from "../src/content/fauna";
import {
  advanceFauna,
  stepAllowed,
  type FaunaWorld,
} from "../src/core/fauna-sim";
import type { FaunaGroup } from "../src/core/fauna";
import { habitatTagsAt, spawnFauna } from "../src/world/v3/fauna";
import type { WorldModel } from "../src/core/types";
import type { TopographyCell } from "../src/core/topography";

const at = (id: string, year: number) =>
  settingFor(places.find((p) => p.id === id)!, year);
const ids = (year: number, place: string) =>
  faunaAt(at(place, year)).map((p) => p.id);

describe("fauna presence", () => {
  it("dates and places each species", () => {
    expect(ids(-6499, "konya")).toEqual(
      expect.arrayContaining([
        "sheep",
        "red-deer",
        "gray-wolf",
        "house-sparrow",
      ]),
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
  it("brings the cat with grain and trade, not before", () => {
    expect(ids(-6499, "konya")).toContain("cat");
    const china = places.find((p) => p.lon > 110 && p.lat > 30 && p.lat < 42);
    if (china) {
      expect(ids(300, china.id)).not.toContain("cat");
      expect(ids(1400, china.id)).toContain("cat");
    }
    const mexico = places.find((p) => p.lon < -90 && p.lat > 15 && p.lat < 22);
    if (mexico) expect(ids(1400, mexico.id)).not.toContain("cat");
  });
  it("gives the Neolithic Near East its aurochs and boar, and takes the aurochs away again", () => {
    expect(ids(-6500, "konya")).toEqual(
      expect.arrayContaining(["aurochs", "wild-boar", "red-deer"]),
    );
    // The last of them died in Poland in 1627; the boar is still there.
    expect(ids(1700, "konya")).not.toContain("aurochs");
    expect(ids(1700, "konya")).toContain("wild-boar");
  });
  it("stocks the Americas before anyone sailed there", () => {
    const andes = places.find(
      (p) => p.lon > -76 && p.lon < -68 && p.lat < -10,
    )!;
    const mexico = places.find(
      (p) => p.lon > -102 && p.lon < -96 && p.lat > 17 && p.lat < 21,
    )!;
    expect(ids(1400, andes.id)).toEqual(
      expect.arrayContaining(["llama", "guinea-pig"]),
    );
    expect(ids(1400, andes.id)).not.toContain("sheep");
    expect(ids(1400, mexico.id)).toEqual(
      expect.arrayContaining(["turkey", "wild-turkey"]),
    );
    // Back the other way: a turkey is in a European farmyard within a
    // generation of the conquest.
    expect(ids(1400, "konya")).not.toContain("turkey");
    expect(ids(1700, "konya")).toContain("turkey");
  });
  it("puts a deer wherever there was one", () => {
    const deer = (year: number, place: string) =>
      ids(year, place).some((id) => id === "red-deer" || id === "wapiti");
    for (const id of ["konya", "london", "paris", "rome", "beijing", "kyoto"])
      if (places.some((p) => p.id === id))
        expect([id, deer(1400, id)]).toEqual([id, true]);
    const rockies = places.find(
      (p) => p.lon < -104 && p.lon > -120 && p.lat > 40,
    )!;
    expect(ids(1400, rockies.id)).toContain("wapiti");
    // Not in the deserts and not on the plateau: the old single box put red
    // deer across both.
    const arabia = places.find(
      (p) => p.lon > 40 && p.lon < 55 && p.lat > 18 && p.lat < 28,
    );
    if (arabia) expect(ids(1400, arabia.id)).not.toContain("red-deer");
  });
  it("loses the wolf from Britain after 1700", () => {
    const britain = places.find(
      (p) => p.lon > -6 && p.lon < 2 && p.lat > 50 && p.lat < 56,
    );
    if (!britain) return;
    expect(ids(1500, britain.id)).toContain("gray-wolf");
    expect(ids(1800, britain.id)).not.toContain("gray-wolf");
    expect(ids(1800, britain.id)).toContain("red-deer");
  });
});

function cell(
  height: number,
  extra: Partial<TopographyCell> = {},
): TopographyCell {
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
    expect(stepAllowed(world, sheep, { x: 0, y: 0 }, { x: 1, y: 0 })).toBe(
      true,
    );
    expect(stepAllowed(world, sheep, { x: 1, y: 0 }, { x: 2, y: 0 })).toBe(
      false,
    );
    expect(stepAllowed(world, wolf, { x: 1, y: 0 }, { x: 2, y: 0 })).toBe(true);
  });
  it("lets any animal use a slope", () => {
    const ramped = {
      ...world,
      topography: (x: number, y: number) =>
        cell(
          heights.get(`${x},${y}`) ?? 1,
          x === 1 ? { ramp: "e" as const } : {},
        ),
    };
    expect(
      stepAllowed(
        ramped,
        faunaProfile("sheep")!,
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ),
    ).toBe(true);
  });
});

function sim(over: Partial<FaunaWorld> = {}): FaunaWorld {
  let n = 0;
  return {
    blocked: () => false,
    occupied: () => false,
    gateOpen: () => false,
    humans: [],
    rng: () => (n = (n * 1103515245 + 12345) % 2147483648) / 2147483648,
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
  it("a deer looks up before it runs, a sheep pays no attention", () => {
    const deer = group("red-deer", 10, 10),
      sheep = group("sheep", 10, 20);
    const world = sim({
      humans: [
        { x: 5, y: 10, space: "outside" },
        { x: 5, y: 20, space: "outside" },
      ],
    });
    advanceFauna([deer, sheep], world, 6);
    // Head up and turned on whoever it is, but still standing.
    expect(deer.state).not.toBe("flee");
    expect(deer.members[0]).toMatchObject({ x: 10, y: 10, direction: 3 });
    for (let t = 12; t <= 60; t += 6) advanceFauna([deer, sheep], world, t);
    expect(deer.state).toBe("flee");
    expect(deer.members[0].x).toBeGreaterThan(10);
    expect(sheep.state).toBe("idle");
    expect(
      Math.hypot(sheep.members[0].x - 10, sheep.members[0].y - 20),
    ).toBeLessThan(2);
  });
  it("a cornered deer stands its ground", () => {
    const deer = group("red-deer", 10, 10);
    // Wall on every side but the person's.
    const world = sim({
      blocked: (x, y) => !(x === 10 && y === 10) && !(x === 9 && y === 10),
      humans: [{ x: 8, y: 10, space: "outside" }],
    });
    for (let t = 6; t <= 60; t += 6) advanceFauna([deer], world, t);
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
    // It sits tight for a beat before it goes.
    let t = 6;
    for (; t <= 30 && bird.state === "perch"; t += 6)
      advanceFauna([bird], world, t);
    expect(bird.state).toBe("takeoff");
    const seen = new Set<string>();
    for (; t <= 180; t += 6) {
      advanceFauna([bird], world, t);
      seen.add(bird.state);
    }
    expect([...seen]).toEqual(
      expect.arrayContaining(["flight", "landing", "perch"]),
    );
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

describe("fauna hunting", () => {
  /** Members spread along a row so a pack has more than one animal to take. */
  const herd = (speciesId: string, x: number, n: number) => {
    const g = group(speciesId, x, 0);
    g.members = Array.from({ length: n }, (_, i) => ({
      x: x + i,
      y: i % 3,
      direction: 1 as const,
    }));
    return g;
  };
  const hunt = (prey: FaunaGroup, ticks: number, seed = 1) => {
    const wolves = herd("gray-wolf", 0, 3);
    let n = seed * 7919;
    const world = sim({
      rng: () => (n = (n * 1103515245 + 12345) % 2147483648) / 2147483648,
    });
    const kills: string[] = [];
    world.onKill = (h, p) => kills.push(`${h.speciesId}>${p.speciesId}`);
    for (let t = 1; t <= ticks; t++) advanceFauna([wolves, prey], world, t * 6);
    return { wolves, kills, prey };
  };
  /** Deer or rabbits taken over twenty separate hours with a pack alongside. */
  const rate = (species: string) => {
    let caught = 0;
    for (let s = 1; s <= 20; s++)
      caught += 4 - hunt(herd(species, 14, 4), 600, s).prey.members.length;
    return caught;
  };

  it("a pack stalks a deer herd, then runs it down", () => {
    const deer = herd("red-deer", 14, 4);
    const wolves = herd("gray-wolf", 0, 3);
    const world = sim();
    const seen = new Set<string>();
    for (let t = 1; t <= 200; t++) {
      advanceFauna([wolves, deer], world, t * 6);
      seen.add(`${wolves.state}/${deer.state}`);
      if (deer.members.length < 4) break;
    }
    expect([...seen]).toEqual(
      expect.arrayContaining(["stalk/idle", "chase/flee"]),
    );
    expect(deer.members).toHaveLength(3);
  });
  it("a kill feeds the pack for the day", () => {
    const deer = herd("red-deer", 14, 6);
    const { wolves, kills } = hunt(deer, 600, 3);
    expect(kills).toEqual(["gray-wolf>red-deer"]);
    expect(wolves.quarry).toBeUndefined();
    expect(wolves.fedUntil).toBeGreaterThan(400 * 6);
    // One kill, then the pack leaves the rest of the herd alone.
    expect(deer.members).toHaveLength(5);
  });
  it("most hunts fail, and a rabbit gets away far more often than a deer", () => {
    const deer = rate("red-deer"),
      rabbit = rate("rabbit");
    expect(deer).toBeGreaterThan(rabbit * 1.5);
    expect(rabbit).toBeLessThan(10);
  });
  it("nothing hunts a wolf, and a wolf ignores another pack", () => {
    const a = group("gray-wolf", 0, 0),
      b = group("gray-wolf", 6, 0);
    b.id = "g-gray-wolf-b";
    for (let t = 1; t <= 40; t++) advanceFauna([a, b], sim(), t * 6);
    expect(a.quarry).toBeUndefined();
    expect(b.state).not.toBe("flee");
  });
  it("a person nearby matters more than dinner", () => {
    const deer = herd("red-deer", 6, 3);
    const wolves = herd("gray-wolf", 0, 3);
    const world = sim({ humans: [{ x: 1, y: 1, space: "outside" }] });
    advanceFauna([wolves, deer], world, 6);
    expect(wolves.state).toBe("flee");
    expect(wolves.quarry).toBeUndefined();
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
      cell(1, {
        habitat: {
          kind: habitatKind(x),
          ecology: "grassland",
          wet: 0.2,
          cover: 0.5,
          exposed: 0,
          season: "summer",
        },
      } as never),
  } as unknown as WorldModel;
  it("reads habitat off the cell and its neighbours", () => {
    expect([...habitatTagsAt(world, 10, 10)]).toEqual(["woodland"]);
    expect([...habitatTagsAt(world, 31, 10)].sort()).toEqual([
      "forest-edge",
      "woodland",
    ]);
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
        expect(
          Math.hypot(g.pos.x - 200, g.pos.y - 200) - 20,
        ).toBeGreaterThanOrEqual(p.minimumSettlementDistance);
      expect(g.members.length).toBeGreaterThanOrEqual(p.groupSize[0]);
    }
    expect(spawnFauna(world, "seed", 100, 100)).toEqual([]);
  });
});
