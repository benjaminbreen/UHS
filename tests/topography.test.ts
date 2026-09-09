import { rasterTerrainContours } from "../src/render/terrain-contours";
import { describe, it, expect } from "vitest";
import { terrainFoot, pickTerrain } from "../src/render/terrain-projection";
import {
  directions,
  terrainStep,
  terrainLeap,
  contourMask,
  type Direction,
  type TopographyCell,
} from "../src/core/topography";
import { terrainFixture, studyRoute } from "../src/dev/terrain/fixture";

describe("stage-one terrain contract", () => {
  it("admits each ramp from both ends, rejects side entry and multi-tier drops", () => {
    for (const direction of Object.keys(directions) as Direction[]) {
      const d = directions[direction];
      const low: TopographyCell = {
        height: 1,
        surface: "soil",
        ramp: direction,
      };
      const high: TopographyCell = { height: 2, surface: "grass" };
      const sample = (x: number, y: number): TopographyCell =>
        x === 0 && y === 0
          ? low
          : x === d.x && y === d.y
            ? high
            : { height: 1, surface: "grass" };
      const a = { x: 0, y: 0 },
        b = { ...d };
      expect(terrainStep(sample, a, b).allowed).toBe(true);
      expect(terrainStep(sample, b, a).allowed).toBe(true);
      expect(terrainStep(sample, a, { x: -d.x, y: -d.y }).allowed).toBe(true);
      expect(terrainStep(sample, a, { x: d.y, y: d.x }).allowed).toBe(false);
      high.height = 3;
      expect(terrainStep(sample, a, b).allowed).toBe(false);
      high.height = 2;
      delete low.ramp;
      expect(terrainStep(sample, a, b).allowed).toBe(false);
    }
  });
  it("keeps corners, water and bridges explicit", () => {
    const f = terrainFixture("meadow");
    expect(
      terrainStep(f.sample, { x: 6, y: 13 }, { x: 6, y: 14 }).allowed,
    ).toBe(false);
    expect(
      terrainStep(f.sample, { x: 6, y: 14 }, { x: 7, y: 14 }).allowed,
    ).toBe(true);
    expect(
      terrainStep(f.sample, { x: 6, y: 14 }, { x: 7, y: 15 }).allowed,
    ).toBe(false);
    expect(terrainStep(f.sample, { x: 0, y: 0 }, { x: -1, y: 0 }).allowed).toBe(
      false,
    );
    const sample = (x: number, y: number): TopographyCell => ({
      height: x === 1 && y === -1 ? 2 : 1,
      surface: "grass",
    });
    expect(contourMask(sample, 0, 0, (c) => c.height > 1)).toBe(16);
  });
  it("connects both studies and all four tiers through actual legal edges", () => {
    for (const study of ["meadow", "contours"] as const) {
      const f = terrainFixture(study);
      expect(terrainFixture(study).cells).toEqual(f.cells);
      for (const target of Object.values(f.stops)) {
        const route = studyRoute(f, f.spawn, target);
        expect(route.length).toBeGreaterThan(0);
        let from = f.spawn;
        for (const to of route) {
          expect(terrainStep(f.sample, from, to).allowed).toBe(true);
          from = to;
        }
        expect(from).toEqual(target);
      }
      const reachable = new Set<number>();
      for (let y = 0; y < f.height; y++)
        for (let x = 0; x < f.width; x++) {
          const cell = f.sample(x, y)!;
          if (cell.ramp) {
            const d = directions[cell.ramp];
            expect(
              terrainStep(f.sample, { x, y }, { x: x + d.x, y: y + d.y })
                .allowed,
            ).toBe(true);
            expect(studyRoute(f, f.spawn, { x, y }).length).toBeGreaterThan(0);
          }
          if (
            !cell.solid &&
            (cell.surface !== "water" || cell.bridge) &&
            studyRoute(f, f.spawn, { x, y }).length
          )
            reachable.add(cell.height);
        }
      expect([...reachable].sort()).toEqual(
        study === "meadow" ? [0, 1, 2] : [0, 1, 2, 3],
      );
    }
  });
});

describe("terrain relief presentation", () => {
  it("keeps the rise in one broad connected region and its two-lane slope reachable", () => {
    const f = terrainFixture("meadow");
    const high = [];
    for (let y = 0; y < f.height; y++)
      for (let x = 0; x < f.width; x++)
        if (f.sample(x, y)?.height === 2) high.push({ x, y });
    expect(high.length).toBeGreaterThan(80);
    const queue = [high[0]],
      seen = new Set([`${high[0].x},${high[0].y}`]);
    for (let i = 0; i < queue.length; i++)
      for (const d of Object.values(directions)) {
        const p = { x: queue[i].x + d.x, y: queue[i].y + d.y },
          key = `${p.x},${p.y}`;
        if (f.sample(p.x, p.y)?.height === 2 && !seen.has(key)) {
          seen.add(key);
          queue.push(p);
        }
      }
    expect(seen.size).toBe(high.length);
    for (const x of [30, 31])
      expect(studyRoute(f, f.spawn, { x, y: 16 }).length).toBeGreaterThan(0);
  });
  it("separates shallow and deep river water without elevating the shallow shelf", () => {
    const f = terrainFixture("meadow"),
      depths = new Set();
    for (let y = 0; y < f.height; y++)
      for (let x = 0; x < 16; x++) {
        const c = f.sample(x, y)!;
        if (c.surface === "water" && !c.bridge) {
          depths.add(c.waterDepth);
          expect(c.height).toBe(0);
        }
      }
    expect(depths).toEqual(new Set(["shallow", "deep"]));
  });
  it("projects feet continuously across either end of every slope and picks its visible top", () => {
    for (const direction of Object.keys(directions) as Direction[]) {
      const d = directions[direction];
      const sample = (x: number, y: number): TopographyCell | undefined =>
        x < 0 || y < 0 || x >= 5 || y >= 5
          ? undefined
          : x === 2 && y === 2
            ? { height: 1, surface: "soil", ramp: direction }
            : x === 2 + d.x && y === 2 + d.y
              ? { height: 2, surface: "grass" }
              : { height: 1, surface: "grass" };
      for (const edge of [-0.5, 0.5]) {
        const a = terrainFoot(sample, {
          x: 2 + d.x * (edge - 0.0001),
          y: 2 + d.y * (edge - 0.0001),
        });
        const b = terrainFoot(sample, {
          x: 2 + d.x * (edge + 0.0001),
          y: 2 + d.y * (edge + 0.0001),
        });
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(0.01);
      }
      const foot = terrainFoot(sample, { x: 2, y: 2 });
      expect(pickTerrain(sample, 5, 5, foot.x, foot.y)).toEqual({ x: 2, y: 2 });
    }
  });
});

it("joins the bank through a stepped corner without detached cap islands", () => {
  const sample = (x: number, y: number): TopographyCell | undefined =>
    x < 0 || y < 0 || x >= 8 || y >= 8
      ? undefined
      : {
          height: (x >= 3 && y <= 3) || (x >= 4 && y <= 6) ? 1 : 0,
          surface: "grass",
        };
  const layers = rasterTerrainContours(sample, 8, 8),
    pixels = new Set<string>();
  for (const layer of layers)
    for (let y = 0; y < layer.height; y++)
      for (let x = 0; x < layer.width; x++) {
        if (layer.pixels[(y * layer.width + x) * 4 + 3])
          pixels.add(`${x + layer.x},${y + layer.y}`);
      }
  expect(pixels.size).toBeGreaterThan(100);
  const start = [...pixels][0],
    queue = [start],
    seen = new Set([start]);
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i].split(",").map(Number);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const key = `${x + dx},${y + dy}`;
        if (pixels.has(key) && !seen.has(key)) {
          seen.add(key);
          queue.push(key);
        }
      }
  }
  expect(seen.size).toBe(pixels.size);
});

it("allows clear diagonals in all directions but validates both edges around every corner", () => {
  for (const dx of [-1, 1])
    for (const dy of [-1, 1]) {
      const from = { x: 0, y: 0 },
        to = { x: dx, y: dy };
      const cells = new Map<string, TopographyCell>();
      const sample = (x: number, y: number): TopographyCell =>
        cells.get(`${x},${y}`) ?? { height: 1, surface: "grass" };
      expect(terrainStep(sample, from, to).allowed).toBe(true);
      for (const point of [from, to, { x: dx, y: 0 }, { x: 0, y: dy }]) {
        for (const obstacle of [
          { height: 1, surface: "water" },
          { height: 1, surface: "grass", solid: true },
          { height: 2, surface: "grass" },
          { height: 1, surface: "soil", ramp: "n" },
        ] satisfies TopographyCell[]) {
          cells.set(`${point.x},${point.y}`, obstacle);
          expect(terrainStep(sample, from, to).allowed).toBe(false);
          expect(terrainStep(sample, to, from).allowed).toBe(false);
          cells.clear();
        }
      }
    }
});

it("renders identical contour pixels and depths across positive and negative chunk seams", () => {
  const sample = (x: number, y: number): TopographyCell => ({
    height: x < -2 ? 0 : y < 2 ? 2 : 1,
    surface: x > 2 ? "dry" : "grass",
  });
  const render = (ox: number, oy: number, size: number) => {
    const layers = rasterTerrainContours(
      (x, y) => sample(x + ox, y + oy),
      size,
      size,
      [],
      { x: ox, y: oy, prefix: "test" },
    );
    const pixels = new Map<string, string>();
    for (const l of layers)
      for (let y = 0; y < l.height; y++)
        for (let x = 0; x < l.width; x++) {
          const i = (y * l.width + x) * 4;
          if (l.pixels[i + 3])
            pixels.set(
              `${l.row + oy}:${l.tier}:${x + l.x + ox * 16},${y + l.y + oy * 16}`,
              [...l.pixels.slice(i, i + 4)].join(","),
            );
        }
    return pixels;
  };
  const whole = render(-8, -8, 16),
    chunks = new Map<string, string>();
  for (const y of [-8, 0])
    for (const x of [-8, 0])
      for (const [key, value] of render(x, y, 8)) chunks.set(key, value);
  expect(chunks.size).toBeGreaterThan(100);
  expect(chunks).toEqual(whole);
});

it("discovers a single complete bridge span from either side of a chunk seam", async () => {
  const { bridgeSpans } = await import("../src/render/bridges");
  const sample = (x: number, y: number): TopographyCell => ({
    height: 0,
    surface: "water",
    bridge: x >= -3 && x <= 20 && y >= 7 && y <= 9,
  });
  const expected = [{ minX: -3, maxX: 20, minY: 7, maxY: 9, elevation: 0 }];
  expect(bridgeSpans(sample, 16, 16, true)).toEqual(expected);
  const right = bridgeSpans((x, y) => sample(x + 16, y), 16, 16, true);
  expect(
    right.map((s) => ({ ...s, minX: s.minX + 16, maxX: s.maxX + 16 })),
  ).toEqual(expected);
});

describe("opt-in traversal", () => {
  const world =
    (cells: Record<string, Partial<TopographyCell>>) =>
    (x: number, y: number): TopographyCell => ({
      height: 1,
      surface: "grass",
      ...cells[`${x},${y}`],
    });
  const here = { x: 0, y: 0 },
    east = { x: 1, y: 0 };

  it("hops on open ground and scrambles up a ledge with no ramp", () => {
    expect(terrainLeap(world({}), here, east).kind).toBe("hop");
    const ledge = world({ "1,0": { height: 2 } });
    expect(terrainStep(ledge, here, east).allowed).toBe(false);
    expect(terrainLeap(ledge, here, east).kind).toBe("climb");
    // Two tiers is still beyond reach.
    expect(terrainLeap(world({ "1,0": { height: 3 } }), here, east).kind).toBe(
      "blocked",
    );
  });

  it("drops off a ledge that cannot be walked down", () => {
    const step = world({ "1,0": { height: 0 } });
    expect(terrainStep(step, here, east).allowed).toBe(false);
    expect(terrainLeap(step, here, east).kind).toBe("drop");
  });

  it("clears one tile of water onto level ground, but not two", () => {
    const stream = world({ "1,0": { surface: "water" } });
    const leap = terrainLeap(stream, here, east);
    expect(leap.kind).toBe("leap");
    expect(leap.kind !== "blocked" && leap.distance).toBe(2);
    const wide = world({
      "1,0": { surface: "water" },
      "2,0": { surface: "water" },
    });
    expect(terrainLeap(wide, here, east).kind).toBe("blocked");
    // The far bank has to be level with the near one.
    const uneven = world({
      "1,0": { surface: "water" },
      "2,0": { height: 2 },
    });
    expect(terrainLeap(uneven, here, east).kind).toBe("blocked");
  });

  it("refuses buildings, diagonals into obstacles, and bridged water is walked", () => {
    expect(
      terrainLeap(world({ "1,0": { solid: true } }), here, east).kind,
    ).toBe("blocked");
    const corner = world({ "1,0": { height: 2 }, "1,1": { height: 2 } });
    expect(terrainLeap(corner, here, { x: 1, y: 1 }).kind).toBe("blocked");
    const bridge = world({ "1,0": { surface: "water", bridge: true } });
    expect(terrainLeap(bridge, here, east).kind).toBe("hop");
  });
});
