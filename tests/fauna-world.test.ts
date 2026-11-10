import { describe, expect, it } from "vitest";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { faunaAt, faunaCoats, faunaProfile } from "../src/content/fauna";
import {
  advanceFauna,
  stepAllowed,
  type FaunaWorld,
} from "../src/core/fauna-sim";
import type { FaunaGroup } from "../src/core/fauna";
import { habitatTagsAt, spawnFauna } from "../src/world/v3/fauna";
import { remainsOf } from "../src/content/fauna/remains";
import { ageRemains, pruneRemains, remainsObject } from "../src/core/remains";
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
  it("an elephant keeps to its level, a pig scrambles one step, a deer clears two", () => {
    const tall = {
      ...world,
      topography: (x: number) => cell(x >= 2 ? 3 : 1),
    };
    const at = (id: string, w: typeof world) =>
      stepAllowed(w, faunaProfile(id)!, { x: 1, y: 0 }, { x: 2, y: 0 });
    expect(at("asian-elephant", world)).toBe(false);
    expect(at("pig", world)).toBe(true);
    expect(at("pig", tall)).toBe(false);
    expect(at("chital", tall)).toBe(true);
    // Down is a step further than up.
    expect(stepAllowed(tall, faunaProfile("pig")!, { x: 2, y: 0 }, { x: 1, y: 0 })).toBe(true);
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
    for (let t = 12; t <= 60 && deer.state !== "flee"; t += 6) advanceFauna([deer, sheep], world, t);
    expect(deer.state).toBe("flee");
    expect(deer.members[0].x).toBeGreaterThan(13);
    expect(sheep.state).toBe("idle");
    expect(
      Math.hypot(sheep.members[0].x - 10, sheep.members[0].y - 20),
    ).toBeLessThan(2);
  });
  it("a deer shows a question while it watches and a bang when it bolts", () => {
    const deer = group("red-deer", 10, 10);
    const cues: string[] = [];
    const world = sim({
      humans: [{ x: 5, y: 10, space: "outside" }],
      emit: (e) => {
        if (e.kind === "cue") cues.push(`${e.who}:${e.cue}`);
      },
    });
    for (let t = 6; t <= 60; t += 6) advanceFauna([deer], world, t);
    expect(cues[0]).toBe("g-red-deer-0:notice");
    expect(cues).toContain("g-red-deer-0:alarm");
  });
  it("a herd moves off from a pack lying up, though it is not hunting", () => {
    const deer = group("red-deer", 10, 10),
      wolf = group("gray-wolf", 13, 10);
    wolf.fedUntil = Infinity;
    wolf.state = "rest";
    for (let t = 6; t <= 30 && deer.state !== "flee"; t += 6) advanceFauna([deer, wolf], sim(), t);
    expect(deer.state).toBe("flee");
    expect(deer.members[0].x).toBeLessThan(10);
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
  it("a dog digs on soil and leaves a hole, and never on paving", () => {
    for (const soil of [true, false]) {
      const dog = group("dog", 0, 0);
      dog.nextDecisionAt = 0;
      const holes: string[] = [];
      const world = sim({
        canDig: () => soil,
        onDig: (_, at) => holes.push(`${at.x},${at.y}`),
      });
      const seen = new Set<string>();
      for (let t = 1; t <= 600; t++) {
        advanceFauna([dog], world, t * 6);
        seen.add(dog.state);
      }
      expect(seen.has("dig")).toBe(soil);
      expect(holes.length > 0).toBe(soil);
    }
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
  it("walks kept stock round a field to its pasture, not through it", () => {
    const herd = group("cattle", 10, 10);
    herd.gateId = "gate";
    herd.pasture = { x: 10, y: 30, space: "outside" };
    herd.nextDecisionAt = 0;
    // The field lies square across the way, with a lane round its east end.
    const crop = (x: number, y: number) => y >= 16 && y <= 24 && x >= 0 && x <= 20;
    const world = sim({ gateOpen: () => true, hour: 9, crop });
    for (let t = 6; t <= 1800; t += 6) {
      advanceFauna([herd], world, t);
      expect(crop(herd.members[0].x, herd.members[0].y)).toBe(false);
    }
    expect(herd.members[0].y).toBeGreaterThan(26);
  });
  it("takes buffalo to the mud through the heat, and they come out muddy", () => {
    const buffalo = group("water-buffalo", 10, 10);
    buffalo.nextDecisionAt = 0;
    const world = sim({
      hour: 12,
      topography: (x, y) => ({ height: 0, surface: x === 14 && y === 10 ? "damp" : "grass" }) as TopographyCell,
    });
    for (let t = 6; t <= 600; t += 6) advanceFauna([buffalo], world, t);
    expect(buffalo.members[0]).toMatchObject({ x: 14, y: 10 });
    expect(buffalo.members[0].muddy).toBeGreaterThan(600);
  });
  it("stands a herd bunched with its rumps to the rain", () => {
    const herd = group("cattle", 10, 10);
    herd.state = "graze";
    herd.members = [
      { x: 10, y: 10, direction: 3, n: 1 },
      { x: 17, y: 10, direction: 3, n: 2 },
      { x: 10, y: 16, direction: 3, n: 3 },
    ];
    const world = sim({ rain: true, wind: 0 });
    for (let t = 6; t <= 600; t += 6) advanceFauna([herd], world, t);
    for (const m of herd.members) {
      expect(Math.hypot(m.x - 10, m.y - 10)).toBeLessThanOrEqual(4.5);
      expect(m.direction).toBe(1);
    }
  });
  it("sends a goose at a stranger who comes onto its ground", () => {
    const geese = group("goose", 10, 10);
    const world = sim({ humans: [{ x: 12, y: 10, space: "outside" }] });
    advanceFauna([geese], world, 6);
    expect(geese.provoked).toBeGreaterThan(6);
    const far = group("goose", 10, 10);
    advanceFauna([far], sim({ humans: [{ x: 16, y: 10, space: "outside" }] }), 6);
    expect(far.provoked).toBeUndefined();
  });
  it("brings a jackal in to a carcass after dark, unless someone is by it", () => {
    const carrion = [{ x: 20, y: 10 }];
    const jackal = group("golden-jackal", 10, 10);
    jackal.homeRadius = 20;
    jackal.nextDecisionAt = 0;
    const night = sim({ hour: 21, carrion });
    for (let t = 6; t <= 120; t += 6) advanceFauna([jackal], night, t);
    expect(Math.hypot(jackal.pos.x - 20, jackal.pos.y - 10)).toBeLessThanOrEqual(1.5);
    const wary = group("golden-jackal", 10, 10);
    wary.nextDecisionAt = 0;
    advanceFauna([wary], sim({ hour: 21, carrion, humans: [{ x: 21, y: 10, space: "outside" }] }), 6);
    expect(wary.target).not.toEqual(expect.objectContaining(carrion[0]));
  });
  it("draws the new deer, jackals, coyotes and hares as themselves", () => {
    for (const [species, coat] of [["golden-jackal", "russet"], ["coyote", "tawny"], ["roe-deer", "winter"], ["red-deer", "winter"]])
      expect(faunaCoats(species, coat)?.size).toBeGreaterThan(0);
    for (const id of ["hare", "roe-deer", "white-tailed-deer", "chital", "golden-jackal", "coyote", "wapiti"])
      expect(faunaProfile(id)!.art.idle![0]).toMatch(new RegExp(`^faunaw-${id}-`));
    expect(faunaProfile("roe-deer")!.scale).toBeLessThan(1);
    expect(ids(1400, "konya")).toEqual(expect.arrayContaining(["hare", "golden-jackal", "roe-deer"]));
  });
  it("strings ducklings out in a line behind the duck", () => {
    const ducks = group("duck", 10, 10);
    ducks.state = "forage";
    ducks.homeRadius = 20;
    ducks.members = [
      { x: 10, y: 10, direction: 1, n: 1 },
      { x: 15, y: 13, direction: 1, n: 2, young: true, mother: 1 },
      { x: 6, y: 14, direction: 1, n: 3, young: true, mother: 2 },
      { x: 14, y: 6, direction: 1, n: 4, young: true, mother: 3 },
    ];
    for (let t = 6; t <= 600; t += 6) advanceFauna([ducks], sim(), t);
    for (const m of ducks.members.slice(1)) {
      const ahead = ducks.members.find((o) => o.n === m.mother)!;
      expect(Math.hypot(m.x - ahead.x, m.y - ahead.y)).toBeLessThanOrEqual(1.5);
    }
  });
  it("takes hens home to roost at dusk", () => {
    const hens = group("chicken", 18, 10);
    hens.home = { x: 10, y: 10, space: "outside" };
    hens.homeRadius = 12;
    hens.nextDecisionAt = 0;
    for (let t = 6; t <= 600; t += 6) advanceFauna([hens], sim({ hour: 19 }), t);
    expect(Math.hypot(hens.members[0].x - 10, hens.members[0].y - 10)).toBeLessThanOrEqual(1.5);
  });
  it("sends a frightened rabbit down its hole, out of sight a while", () => {
    const rabbits = group("rabbit", 13, 10);
    rabbits.home = { x: 10, y: 10, space: "outside" };
    const world = sim({ humans: [{ x: 16, y: 10, space: "outside" }] });
    let down = 0;
    for (let t = 6; t <= 120 && !down; t += 6) {
      advanceFauna([rabbits], world, t);
      if ((rabbits.burrowed ?? 0) > t) down = t;
    }
    expect(down).toBeGreaterThan(0);
    const at = { ...rabbits.members[0] };
    advanceFauna([rabbits], world, down + 6);
    expect(rabbits.members[0]).toEqual(at);
  });
  it("puts a grazing herd's heads up when something close by bolts", () => {
    const deer = group("red-deer", 10, 10);
    deer.state = "graze";
    const flushed = group("rabbit", 18, 10);
    flushed.id = "g-flushed";
    flushed.state = "flee";
    flushed.since = 0;
    advanceFauna([deer, flushed], sim(), 6);
    expect(deer.state).toBe("idle");
    expect(deer.members[0].direction).toBe(1);
  });
  it("a herd bolts when the herd beside it does, and they do not keep each other running", () => {
    const deer = group("chital", 10, 10);
    deer.state = "graze";
    const struck = group("chital", 18, 10);
    struck.id = "g-struck";
    struck.state = "flee";
    struck.fright = { x: 24, y: 10, space: "outside" };
    const world = sim();
    advanceFauna([deer, struck], world, 6);
    expect(deer.state).toBe("flee");
    expect(deer.members[0].x).toBeLessThan(6);
    for (let t = 12; t <= 120; t += 6) advanceFauna([deer, struck], world, t);
    expect(deer.state).not.toBe("flee");
    expect(struck.state).not.toBe("flee");
  });
  it("a person running in is gone from before they arrive, however quiet a hunter they are", () => {
    const deer = group("chital", 10, 10);
    const runner = { x: 0, y: 10, space: "outside" };
    const world = sim({ humans: [runner], noise: 1.3 * 0.4 });
    let gap = Infinity;
    for (let t = 6; t <= 120; t += 6) {
      runner.x += 6;
      advanceFauna([deer], world, t);
      gap = Math.min(gap, Math.hypot(deer.members[0].x - runner.x, deer.members[0].y - runner.y));
    }
    expect(gap).toBeGreaterThan(2);
  });
  it("elephants put down inside one another, and a deer inside them, step apart", () => {
    const herd = group("asian-elephant", 10, 10);
    herd.members.push({ x: 11, y: 10, direction: 1 });
    const deer = group("chital", 10, 9);
    const world = sim();
    for (let t = 6; t <= 120; t += 6) advanceFauna([herd, deer], world, t);
    const [rx, ry] = faunaProfile("asian-elephant")!.body!;
    const [a, b] = herd.members;
    expect(Math.abs(a.x - b.x) > 2 * rx || Math.abs(a.y - b.y) > ry).toBe(true);
    for (const e of herd.members) {
      const d = deer.members[0];
      expect(Math.abs(d.x - e.x) > rx || d.y > e.y + 1 || d.y < e.y - ry).toBe(true);
    }
  });
  it("keeps a calf at its mother's side", () => {
    const herd = group("cattle", 10, 10);
    herd.state = "graze";
    herd.homeRadius = 20;
    herd.members = [
      { x: 10, y: 10, direction: 1, n: 1 },
      { x: 16, y: 15, direction: 1, n: 2, young: true, mother: 1 },
    ];
    for (let t = 6; t <= 600; t += 6) advanceFauna([herd], sim(), t);
    const [mother, calf] = herd.members;
    expect(Math.hypot(calf.x - mother.x, calf.y - mother.y)).toBeLessThanOrEqual(2.3);
  });
  it("keeps buffalo out of the crop and out of each other's bodies", () => {
    const herds = [0, 1].map((k) => {
      const g = group("water-buffalo", 10 + k * 4, 10);
      g.id += k;
      g.members = [0, 1, 2].map((i) => ({ x: 10 + k * 4, y: 10 + i * 3, direction: 1 as const }));
      g.homeRadius = 15;
      g.nextDecisionAt = 0;
      return g;
    });
    const world = sim({ crop: (x) => x >= 18 });
    for (let t = 6; t <= 3600; t += 6) advanceFauna(herds, world, t);
    const all = herds.flatMap((g) => g.members);
    expect(all.every((m) => m.x < 18)).toBe(true);
    for (const a of all)
      for (const b of all)
        if (a !== b) expect(Math.abs(a.x - b.x) > 2 || Math.abs(a.y - b.y) > 1).toBe(true);
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
  /** A fox or a cat against small prey, over many seeds: what it did and
   * how often it came away with something. */
  const spring = (hunter: string, prey: string, gap: number) => {
    let caught = 0,
      missed = 0;
    const seen = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      const h = group(hunter, 0, 0);
      const q = herd(prey, gap, 2);
      let n = seed * 104729;
      const world = sim({
        rng: () => (n = (n * 1103515245 + 12345) % 2147483648) / 2147483648,
      });
      let kills = 0;
      world.onKill = () => kills++;
      for (let t = 1; t <= 60; t++) {
        advanceFauna([h, q], world, t * 6);
        seen.add(h.state);
        if (h.state === "pounce" && !h.catching && h.fedUntil) break;
        if (kills) break;
      }
      if (kills) caught++;
      else if (seen.has("pounce")) missed++;
    }
    return { caught, missed, seen };
  };
  it("a fox creeps up on rabbits and springs, and misses often", () => {
    const { caught, missed, seen } = spring("red-fox", "rabbit", 10);
    expect([...seen]).toEqual(expect.arrayContaining(["stalk", "pounce"]));
    expect(caught).toBeGreaterThan(3);
    expect(missed).toBeGreaterThan(3);
  });
  it("a cat pins a mouse, and the mouse is gone the tick after", () => {
    const cat = group("cat", 0, 0);
    const mice = herd("mouse", 5, 2);
    let n = 17;
    const world = sim({
      rng: () => (n = (n * 1103515245 + 12345) % 2147483648) / 2147483648,
    });
    const kills: string[] = [];
    world.onKill = (h, p) => kills.push(`${h.speciesId}>${p.speciesId}`);
    let pinned = -1;
    for (let t = 1; t <= 200 && !kills.length; t++) {
      advanceFauna([cat, mice], world, t * 6);
      if (cat.catching && pinned < 0) {
        pinned = t;
        expect(mice.members).toHaveLength(2);
      }
    }
    expect(pinned).toBeGreaterThan(0);
    expect(kills).toEqual(["cat>mouse"]);
    expect(mice.members).toHaveLength(1);
  });
  it("a fox carries its kill home and a pack eats where it fell", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const fox = group("red-fox", 0, 0);
      fox.home = { x: -8, y: 0, space: "outside" };
      const rabbits = herd("rabbit", 8, 2);
      let n = seed * 7717;
      const world = sim({
        rng: () => (n = (n * 1103515245 + 12345) % 2147483648) / 2147483648,
      });
      const dropped: string[] = [];
      world.onDrop = (_, prey, at) => dropped.push(`${prey}@${at.x}`);
      let carried = false;
      for (let t = 1; t <= 120 && !dropped.length; t++) {
        advanceFauna([fox, rabbits], world, t * 6);
        carried ||= fox.state === "carry" && fox.carrying === "rabbit";
      }
      if (!carried) continue;
      expect(dropped).toHaveLength(1);
      expect(dropped[0]).toMatch(/^rabbit@-[78]$/);
      expect(fox.carrying).toBeUndefined();
      return;
    }
    throw new Error("no fox caught a rabbit in thirty tries");
  });
  it("leaves feathers for a bird, fur for a rabbit, a carcass for a deer, nothing for a mouse", () => {
    expect(remainsOf("chicken")).toBe("feathers");
    expect(remainsOf("cattle-egret")).toBe("feathers");
    expect(remainsOf("rabbit")).toBe("fur");
    expect(remainsOf("red-deer")).toBe("carcass");
    expect(remainsOf("mouse")).toBeUndefined();
  });
  it("a carcass is picked over, then bone, and feathers blow away in two days", () => {
    const at = { x: 0, y: 0, space: "outside" as const };
    const deer = remainsObject("carcass", "red-deer", "gray-wolf", at, 0, "d");
    expect(deer.description).toMatch(/Wolves ate here/);
    const sprites = [30, 200, 1200].map((h) => {
      ageRemains(deer, h * 3600);
      return deer.sprite;
    });
    expect(sprites).toEqual([
      "nature-remains-carcass-picked",
      "nature-remains-bones",
      "nature-remains-bones-old",
    ]);
    const hen = remainsObject("feathers", "chicken", "red-fox", at, 0, "h");
    expect(pruneRemains([hen, deer], 49 * 3600)).toEqual([deer]);
  });
  it("two hunters after the last mouse: the one too late does not crash", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const a = group("cat", 0, 0),
        b = group("red-fox", 1, 2);
      const mice = herd("mouse", 3, 1);
      let n = seed * 131;
      const world = sim({
        rng: () => (n = (n * 1103515245 + 12345) % 2147483648) / 2147483648,
      });
      for (let t = 1; t <= 40; t++)
        expect(() => advanceFauna([a, b, mice], world, t * 6)).not.toThrow();
    }
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
