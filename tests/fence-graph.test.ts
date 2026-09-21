import { describe, expect, it } from "vitest";
import { boundaryGraph, type FieldAt } from "../src/render/fence-pass";
import {
  boundaryStyles,
  pickBoundary,
  yardBoundaries,
} from "../src/content/settlements/boundaries";
import type { TopographyCell } from "../src/core/topography";

type Field = NonNullable<TopographyCell["field"]>;

/** A yard whose interior is x 3..8, y 3..6, ringed at x 2/9, y 2/7, with a
 * gate in the south run at x 5. */
function yard(kind: Field["boundary"] = "fence"): FieldAt {
  const inside = (x: number, y: number) => x > 2 && x < 9 && y > 2 && y < 7;
  const gate = (x: number, y: number) => x === 5 && y === 7;
  const ring = (x: number, y: number) =>
    x >= 2 && x <= 9 && y >= 2 && y <= 7 && !inside(x, y) && !gate(x, y);
  return (x, y) => {
    if (!inside(x, y) && !gate(x, y)) return;
    let bits = 0;
    if (ring(x, y - 1)) bits |= 1;
    if (ring(x + 1, y)) bits |= 2;
    if (ring(x, y + 1)) bits |= 4;
    if (ring(x - 1, y)) bits |= 8;
    return {
      parcel: 1, crop: "pasture", axis: "x", edges: bits, fence: bits,
      boundary: kind, wet: false, stage: "green", yard: true,
    };
  };
}
const links = (g: ReturnType<typeof boundaryGraph>, x: number, y: number) =>
  [...g.values()].find((n) => n.cx === x && n.cy === y)?.links ?? 0;

describe("boundary graph", () => {
  it("runs through the ring cells with square corners", () => {
    const g = boundaryGraph(yard(), 0, 0, 12, 10);
    expect(links(g, 2, 2)).toBe(2 | 4);
    expect(links(g, 9, 2)).toBe(8 | 4);
    expect(links(g, 9, 7)).toBe(1 | 8);
    expect(links(g, 5, 2)).toBe(2 | 8);
    expect(links(g, 2, 5)).toBe(1 | 4);
  });
  it("leaves a gate as two run ends and draws nothing across it", () => {
    const g = boundaryGraph(yard(), 0, 0, 12, 10);
    expect(links(g, 4, 7)).toBe(8);
    expect(links(g, 6, 7)).toBe(2);
    expect(links(g, 5, 7)).toBe(0);
    // No stub runs out through the gate cell's sides.
    expect(links(g, 4, 8)).toBe(0);
    expect(links(g, 6, 8)).toBe(0);
  });
  it("shares one run between fields facing across a two-cell lane", () => {
    const f = (x: number, y: number): Field | undefined => {
      const north = y >= 0 && y <= 2,
        south = y >= 5 && y <= 7;
      if (x < 0 || x > 4 || (!north && !south)) return;
      let bits = 0;
      if (y === 0 || y === 5) bits |= 1;
      if (y === 2 || y === 7) bits |= 4;
      if (x === 0) bits |= 8;
      if (x === 4) bits |= 2;
      return {
        parcel: north ? 1 : 2, crop: "wheat", axis: "x", edges: bits, fence: bits,
        boundary: "hedge", wet: false, stage: "green",
      };
    };
    const g = boundaryGraph(f, -2, -2, 8, 10);
    // The lane is rows 3 and 4: one hedge in row 3, none in row 4.
    expect(links(g, 2, 3)).toBe(2 | 8);
    expect(links(g, 2, 4)).toBe(0);
    // The south field's side runs climb to meet it.
    expect(links(g, -1, 4) & 1).toBe(1);
  });
});

describe("yard boundaries", () => {
  it("offers only drawable styles, weighted to one", () => {
    for (const culture of [
      "european", "north-african-west-asian", "east-asian", "andean",
      "west-central-african", "mesoamerican",
    ] as const)
      for (const year of [-7000, -1500, 900, 1650, 1950]) {
        const options = yardBoundaries({ culture, climate: "temperate", year } as never);
        for (const [b] of options) expect(boundaryStyles[b], `${culture} ${year} ${b}`).toBeDefined();
        expect(options.reduce((s, [, w]) => s + w, 0)).toBeCloseTo(1);
        expect(options.map(([b]) => b)).toContain(pickBoundary(options, 0.999));
      }
  });
});
