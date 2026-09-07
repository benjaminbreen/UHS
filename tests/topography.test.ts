import { rasterTerrainContours } from "../src/render/terrain-contours";
import { describe, it, expect } from "vitest";
import { terrainFoot, pickTerrain } from "../src/render/terrain-projection";
import {
  directions,
  terrainStep,
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
