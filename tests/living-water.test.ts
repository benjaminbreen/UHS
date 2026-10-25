import { describe, expect, it } from "vitest";
import type { TopographyCell, TopographySample } from "../src/core/topography";
import {
  ecologyOrder,
  livingBeachWidth,
  livingProfile,
} from "../src/render/living-water/profile";
import { rasterLivingWater } from "../src/render/living-water/mask";
import { shorePolishDefaults } from "../src/render/living-water/polish";
import defaults from "../src/render/living-water/defaults.json" with { type: "json" };
const cell = (distance = -2): TopographyCell => ({
  height: 0,
  surface: distance < 0 ? "water" : "sand",
  waterVisual: {
    distance,
    kind: "river",
    ecology: "tropical-woodland",
    shoreWidth: 3,
    flow: [1, 0],
    frozenMargin: false,
  },
});

describe("living water map presentation", () => {
  it("polished arctic shores never place plants, while tropical shallows do", () => {
    const options = {
      enabled: true,
      blend: 0.7,
      plants: 1,
      rocks: 0.5,
      ripples: 0.8,
    };
    const tropical = rasterLivingWater(
      () => cell(),
      16,
      16,
      undefined,
      options,
    );
    const polar = rasterLivingWater(
      () => ({
        ...cell(),
        waterVisual: {
          ...cell().waterVisual!,
          ecology: "tundra",
          frozenMargin: false,
        },
      }),
      16,
      16,
      undefined,
      options,
    );
    expect(tropical.items.some((o) => o.kind !== "rock")).toBe(true);
    expect(polar.items.every((o) => o.kind === "rock")).toBe(true);
  });
  it("retains the approved preset and chooses ecology palettes", () => {
    expect(defaults.settings.bankDryColor).toBe("#f8e4ce");
    expect(defaults.settings.wetEdgeOpacity).toBe(0.35);
    const colors = ecologyOrder.map(
      (ecology) =>
        livingProfile({
          ...cell(),
          waterVisual: { ...cell().waterVisual!, ecology },
        }).palette,
    );
    expect(colors).toEqual([
      "tropical",
      "blue",
      "blue",
      "tropical",
      "green",
      "tropical",
      "tropical",
      "polar",
    ]);
  });
  it("narrows beaches at steep banks without mutating map cells", () => {
    const flat = cell(1),
      snapshot = JSON.stringify(flat);
    const width = livingBeachWidth(() => flat, 0, 0);
    expect(width).toBeGreaterThanOrEqual(1.35);
    expect(width).toBeLessThanOrEqual(1.65);
    const steep: TopographySample = (x, y) =>
      Math.abs(x) + Math.abs(y) >= 2 ? { ...flat, height: 3 } : flat;
    expect(livingBeachWidth(steep, 0, 0)).toBeCloseTo(width * 0.12);
    expect(JSON.stringify(flat)).toBe(snapshot);
    expect(
      livingProfile({
        ...flat,
        waterVisual: { ...flat.waterVisual!, kind: "sea" },
      }).beachWidth,
    ).toBe(8);
    expect(
      livingProfile({
        ...flat,
        waterVisual: { ...flat.waterVisual!, kind: "lake" },
      }).beachWidth,
    ).toBe(1);
  });
  it("keeps masks and rock deflection continuous across chunk boundaries", () => {
    const sample: TopographySample = (x) => cell(Math.abs(x - 16) - 10);
    for (const polish of [undefined, shorePolishDefaults])
      for (const origin of [-32, 0]) {
        const all = rasterLivingWater(sample, 32, 8, { x: origin, y: -16, prefix: "test" }, polish);
        for (const offset of [0, 16]) {
          const chunk = rasterLivingWater((x, y) => sample(x + offset, y), 16, 8, {
            x: origin + offset,
            y: -16,
            prefix: "test",
          }, polish);
          for (let y = 0; y < chunk.height; y++) {
            const start = (y * all.width + offset * 16) * 4;
            expect(
              chunk.pixels.slice(y * chunk.width * 4, (y + 1) * chunk.width * 4),
            ).toEqual(all.pixels.slice(start, start + chunk.width * 4));
            expect(
              chunk.bends.slice(y * chunk.width * 4, (y + 1) * chunk.width * 4),
            ).toEqual(all.bends.slice(start, start + chunk.width * 4));
          }
        }
      }
  });
  it("groups shoreline stones with open stretches and varied companions", () => {
    const result = rasterLivingWater(x => cell(x - 8), 16, 64, undefined, shorePolishDefaults);
    const rocks = result.items.filter(o => o.kind === "rock" && o.y >= 96 && o.y < 1120);
    expect(rocks.length).toBeGreaterThan(5);
    const bins = Array.from({ length: 16 }, (_, i) => rocks.filter(o => Math.floor((o.y - 96) / 64) === i).length);
    expect(bins.some(n => n === 0)).toBe(true);
    expect(bins.some(n => n >= 4)).toBe(true);
    expect(new Set(rocks.filter(o => o.size < 6).map(o => o.size)).size).toBeGreaterThan(2);
  });
  it("keeps shoreline groups off bridges, ramps, paving and trodden soil", () => {
    const sample: TopographySample = (x, y) => ({ ...cell(x - 8),
      ...(y >= 16 && y < 20 ? { bridge: true } :
        y >= 24 && y < 28 ? { ramp: "n" as const } :
        y >= 32 && y < 36 ? { feature: "paving" as const } :
        y >= 40 && y < 44 ? { surface: "soil" as const } : {}),
    });
    const result = rasterLivingWater(sample, 16, 64, undefined, shorePolishDefaults);
    expect(result.items.some(o => o.kind === "rock" && o.size < 6)).toBe(true);
    for (const object of result.items) {
      const c = sample(Math.floor(object.x / 16), Math.floor((object.y - 96) / 16))!;
      expect(c.bridge || c.ramp || c.feature === "paving" || c.surface === "soil").toBeFalsy();
    }
  });
  it("leaves bridges, ramps and irrigation canals to their existing renderer", () => {
    for (const c of [
      { ...cell(), bridge: true },
      { ...cell(), ramp: "n" as const },
      {
        ...cell(),
        waterVisual: { ...cell().waterVisual!, kind: "canal" as const },
      },
    ]) {
      expect(rasterLivingWater(() => c, 1, 1).count).toBe(0);
    }
  });
});
