import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  lightingAt,
  lightingPresets,
  parseLighting,
  shadowFrame,
} from "../src/render/lighting";

it("changes lighting only at six local-time boundaries, including midnight rollover", () => {
  for (const [hour, id] of [
    [0, "night"],
    [4.999, "night"],
    [5, "early-morning"],
    [8, "morning"],
    [11, "midday"],
    [14, "afternoon"],
    [17, "dusk"],
    [20, "night"],
    [24, "night"],
    [29, "early-morning"],
  ] as const)
    expect(lightingAt(hour * 3600).id).toBe(id);
  expect(lightingAt(9 * 3600)).toBe(lightingAt(10 * 3600 + 59 * 60));
  expect(parseLighting("day")).toBe("midday");
  expect(parseLighting("warm")).toBe("afternoon");
});
it("all shadow casters have six pivoted masks; low sun reverses direction and night has no solar cast", () => {
  const atlas = JSON.parse(
    readFileSync("public/packs/lighting-shadows.json", "utf8"),
  );
  const casters = Object.keys(atlas.frames)
    .filter((f) => f.startsWith("midday:"))
    .map((f) => f.slice(7));
  expect(casters).toContain("house-mud-0");
  expect(casters).toContain("human-0-0-2-0");
  for (const frame of casters)
    for (const light of lightingPresets) {
      const f = atlas.frames[shadowFrame(light.id, frame)];
      expect(f, `${light.id}:${frame}`).toBeDefined();
      expect(Number.isFinite(f.pivot.x) && Number.isFinite(f.pivot.y)).toBe(
        true,
      );
      expect(f.frame.x + f.frame.w).toBeLessThanOrEqual(atlas.meta.size.w);
      expect(f.frame.y + f.frame.h).toBeLessThanOrEqual(atlas.meta.size.h);
    }
  const [early, morning, noon, afternoon, dusk, night] = lightingPresets;
  expect(early.cast[0]).toBeLessThan(morning.cast[0]);
  expect(morning.cast[0]).toBeLessThan(0);
  expect(afternoon.cast[0]).toBeGreaterThan(0);
  expect(dusk.cast[0]).toBeGreaterThan(afternoon.cast[0]);
  expect(Math.hypot(...noon.cast)).toBeLessThan(Math.hypot(...morning.cast));
  expect(night.opacity).toBe(0);
});
