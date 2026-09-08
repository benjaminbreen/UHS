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
    expect(marked / 65536).toBeLessThan(0.16);
  }
});
it("paints mineral texture by visible band even when the habitat label is scrub", () => {
  const sample: TopographySample = () => ({
    height: 0,
    surface: "grass",
    habitat: {
      ecology: "dry-scrub",
      season: "summer",
      kind: "scrub",
      wet: 0.2,
      cover: 0.3,
      exposed: 0.8,
    },
  });
  const colors = new Set<string>();
  for (let y = -2; y < 2; y++)
    for (let x = -2; x < 2; x++) {
      const p = rasterHabitatTile(sample, x, y, 0, 0).pixels;
      for (let i = 0; i < p.length; i += 4)
        colors.add(`${p[i]},${p[i + 1]},${p[i + 2]}`);
    }
  // Warm mineral base plus the stone's three deliberate tones.
  expect(colors.has("189,177,143")).toBe(true);
  expect(colors.has("160,148,114")).toBe(true);
  expect(colors.has("211,199,165")).toBe(true);
});
