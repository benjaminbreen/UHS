import { describe, expect, it } from "vitest";
import {
  colorways,
  ecologies,
  paletteKey,
  variantPaletteKeys,
} from "../src/content/ecology/profiles";
import {
  colorwayLabels,
  colorwaysFor,
  habitatLayout,
  regionalEcology,
} from "../src/content/ecology/variants";
import { defaultGrassArt } from "../src/content/graphics/grass-art";
import { banks, soils } from "../src/render/habitat-raster";
import { treeMix } from "../src/content/ecology/vegetation";
import { habitatAt } from "../src/world/v3/habitats";
import nature from "../public/nature/atlas.json";
import atlas from "../public/packs/atlas.json";
import type { WorldSetting } from "../src/content/geography/types";

describe("regional biome variants", () => {
  it("defines a grass, soil and bank ramp for every variant palette key", () => {
    for (const key of [...ecologies, ...variantPaletteKeys]) {
      expect(defaultGrassArt.palettes[key], key).toHaveLength(9);
      expect(soils[key], key).toHaveLength(5);
      expect(banks[key], key).toHaveLength(5);
    }
  });
  it("labels every colourway and lists it under one envelope", () => {
    for (const c of colorways) {
      expect(colorwayLabels[c]).toBeTruthy();
      expect(ecologies.some((e) => colorwaysFor[e].includes(c)), c).toBe(true);
    }
    expect(paletteKey("desert", "sahara")).toBe("desert:sahara");
    expect(paletteKey("desert", "highland")).toBe("desert");
    expect(paletteKey("grassland", "sahara")).toBe("grassland");
  });
  it("reads distinct envelopes and colourways off the Earth biome map", () => {
    const at = (lon: number, lat: number, climate: WorldSetting["climate"] = "temperate") =>
      regionalEcology(lon, lat, climate);
    expect(at(10, 25, "arid")).toEqual({ ecology: "desert", colorway: "sahara" });
    expect(at(-112, 33, "arid")).toEqual({ ecology: "desert", colorway: "sonoran" });
    expect(at(134, -24, "arid")).toEqual({ ecology: "desert", colorway: "red-earth" });
    expect(at(36.8, -1.3)).toEqual({ ecology: "savanna", colorway: "acacia" });
    expect(at(-98, 39)).toEqual({ ecology: "grassland", colorway: "prairie" });
    expect(at(106.9, 47.9)).toEqual({ ecology: "grassland", colorway: "steppe" });
    expect(at(129.7, 62)).toEqual({ ecology: "boreal-woodland", colorway: "larch" });
    expect(at(-84, 38)).toEqual({ ecology: "temperate-woodland", colorway: "oak-hickory" });
    expect(at(-0.1, 51.5)).toEqual({ ecology: "temperate-woodland", colorway: undefined });
    expect(at(23.7, 38)).toEqual({ ecology: "dry-scrub", colorway: "maquis" });
    expect(at(-118.2, 34.1)).toEqual({ ecology: "dry-scrub", colorway: "chaparral" });
    expect(at(-57, -17)).toEqual({ ecology: "wetland", colorway: "pantanal" });
    expect(at(-80.9, 25.4)).toEqual({ ecology: "wetland", colorway: "mangrove" });
    // Deep prehistory keeps its ice-age override.
    expect(at(-0.1, 51.5, "tundra")).toEqual({ ecology: "tundra", colorway: "polar" });
    // Open ocean falls back to the climate rule.
    expect(at(-40, 30, "mediterranean")).toEqual({ ecology: "dry-scrub" });
  });
  it("gives every regional tree mix sprites that exist in an atlas", () => {
    const frames = new Set([...Object.keys(nature.frames), ...Object.keys(atlas.frames)]);
    const base: WorldSetting = {
      lon: 0,
      lat: 30,
      vegetationRevision: 6,
      environment: { ecology: "grassland", landform: "plain", population: "none", start: "wanderer", household: "mixed" },
    } as WorldSetting;
    for (const ecology of ecologies)
      for (const colorway of colorwaysFor[ecology]) {
        const s = { ...base, environment: { ...base.environment!, ecology, colorway } };
        for (const [sprite] of treeMix(s)) expect(frames.has(sprite), `${ecology}:${colorway} ${sprite}`).toBe(true);
      }
  });
  it("lays a sand sea out in bands and a monsoon wetland in threads", () => {
    const land = { water: 80, shoreWidth: 3, elevation: 0, moisture: 0.5, kind: "river" as const, snow: false };
    const stats = (colorway?: Parameters<typeof habitatAt>[6]) => {
      let wet = 0, exposed = 0, n = 0;
      for (let y = 0; y < 96; y += 2)
        for (let x = 0; x < 96; x += 2) {
          const h = habitatAt("wetland", "summer", "review", x, y, land, colorway);
          wet += h.wet; exposed += h.exposed; n++;
        }
      return { wet: wet / n, exposed: exposed / n };
    };
    expect(stats("monsoon").wet).toBeGreaterThan(stats().wet);
    expect(stats("bog").wet).toBeGreaterThan(stats().wet);
    expect(habitatLayout("sahara").banded).toBe(true);
    expect(habitatLayout("papyrus").braided).toBe(true);
    expect(habitatLayout(undefined)).toEqual({ wet: 1, exposed: 1, cover: 1 });
  });
});
