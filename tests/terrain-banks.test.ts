import { describe, expect, it } from "vitest";
import { rasterTerrainContours } from "../src/render/terrain-contours";
import { defaultGroundStyle, setGroundStyle } from "../src/render/ground-style";
import type { TopographyCell } from "../src/core/topography";

/** North half raised, south half at zero: one long south-facing bank. */
const step =
  (tier: number) =>
  (_x: number, y: number): TopographyCell => ({
    height: y < 10 ? tier : 0,
    surface: "grass",
  });

const opaquePixels = (
  layers: { flat?: boolean; pixels: Uint8ClampedArray }[],
) =>
  layers
    .filter((l) => !l.flat)
    .reduce((n, l) => {
      let c = 0;
      for (let i = 3; i < l.pixels.length; i += 4) if (l.pixels[i]) c++;
      return n + c;
    }, 0);

describe("terrain banks", () => {
  it("draws a face in proportion to the drop, at any tier", () => {
    setGroundStyle(defaultGroundStyle());
    try {
      const one = opaquePixels(rasterTerrainContours(step(1), 20, 20));
      expect(one).toBeGreaterThan(200);
      for (const tier of [3, 7]) {
        const tall = opaquePixels(rasterTerrainContours(step(tier), 20, 20));
        // Within a tenth of linear: a seven-step cliff is seven faces tall.
        expect(tall / one).toBeGreaterThan(tier * 0.9);
        expect(tall / one).toBeLessThan(tier * 1.1);
      }
    } finally {
      setGroundStyle(undefined);
    }
  });
});
