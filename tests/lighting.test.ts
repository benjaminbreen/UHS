import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  lightingAt,
  lightingPresets,
  parseLighting,
  shadowFrame,
  tintAt,
  washAt,
} from "../src/render/lighting";

it("changes lighting only at six local-time boundaries, including midnight rollover", () => {
  for (const [hour, id] of [
    [0, "night"],
    [5.999, "night"],
    [6, "early-morning"],
    [8, "morning"],
    [11, "midday"],
    [14, "afternoon"],
    [17, "dusk"],
    [20, "night"],
    [24, "night"],
    [30, "early-morning"],
  ] as const)
    expect(lightingAt(hour * 3600).id).toBe(id);
  expect(lightingAt(9 * 3600)).toBe(lightingAt(10 * 3600 + 59 * 60));
  expect(parseLighting("day")).toBe("midday");
  expect(parseLighting("warm")).toBe("afternoon");
});
it("pales toward dawn from the small hours, ahead of the six o'clock phase", () => {
  const night = parseInt(lightingPresets[5].tint, 16);
  expect(tintAt(3 * 3600)).toBe(night);
  expect(washAt(3 * 3600).alpha).toBeCloseTo(lightingPresets[5].ambientAlpha);
  expect(washAt(5 * 3600).alpha).toBeLessThan(0.25);
  expect(tintAt(5 * 3600) >> 16).toBeGreaterThan(night >> 16);
  expect(tintAt(6 * 3600)).toBe(parseInt(lightingPresets[0].tint, 16));
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

it("pages every building sheet frame onto a phone-sized page", async () => {
  const { pagedSheets } = await import("../src/render/scene-assets");
  for (const sheet of pagedSheets) {
    const full = JSON.parse(readFileSync(`public/packs/${sheet}.json`, "utf8")).frames;
    const pages: object[] = JSON.parse(readFileSync(`public/packs/pages/${sheet}.json`, "utf8"));
    expect(pages.flatMap(Object.keys).sort()).toEqual(Object.keys(full).sort());
    pages.forEach((_, i) => {
      const png = readFileSync(`public/packs/pages/${sheet}-${i}.png`);
      // IHDR width and height; more than this and iOS Safari runs out of room.
      expect(png.readUInt32BE(16) * png.readUInt32BE(20)).toBeLessThanOrEqual(1024 * 1024);
    });
  }
});
