import { expect, it } from "vitest";
import { groundMotif, stoneMotifs } from "../src/render/ground-motifs";
import { rasterHabitatTile } from "../src/render/habitat-raster";
import type { TopographySample } from "../src/core/topography";
it("gives each stone a coherent face, highlight and shadow at a readable size", () => {
  for (const glyph of stoneMotifs) {
    const pixels = glyph.join("");
    for (const ink of ["1", "2", "3"]) expect(pixels).toContain(ink);
    expect([...pixels].filter((c) => c !== "0").length).toBeGreaterThan(12);
    expect(glyph[0].length).toBe(8);
  }
});
it("keeps empty ground between placed motifs rather than varying every pixel", () => {
  for (const kind of ["stone", "turf", "earth"] as const) {
    let marked = 0;
    for (let y = -128; y < 128; y++)
      for (let x = -128; x < 128; x++) {
        const ink = groundMotif(kind, x, y);
        expect(ink).toBeGreaterThanOrEqual(0);
        expect(ink).toBeLessThanOrEqual(3);
        if (ink) marked++;
      }
    expect(marked / 65536).toBeGreaterThan(0.005);
    // Turf tufts are drawn larger and on a denser grid than stones.
    expect(marked / 65536).toBeLessThan(kind === "turf" ? 0.26 : 0.16);
  }
});
