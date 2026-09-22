import { describe, expect, it } from "vitest";
import {
  emblemFor,
  signFor,
  signStyles,
  signLabels,
} from "../src/content/props/signage";
import { propDefs } from "../src/content/props/catalog";
import { resolveSetting } from "../src/content/geography/resolve";
import { integratedSetting } from "../src/content/geography/defaults";
import { packs } from "../src/content/packs";
import type { Pack } from "../src/core/types";
import atlas from "../src/render/generated/props.json";
import shadows from "../src/render/generated/prop-shadows.json";

function settingFor(query: string) {
  const result = resolveSetting(query);
  if ("error" in result) throw new Error(result.error);
  return result.setting;
}

function pack(query: string): Pack {
  const setting = settingFor(query);
  return { ...packs.roman, setting, year: setting.year };
}

describe("compact historical signage", () => {
  it("selects frames by place and date without exporting signs into camps or antiquity", () => {
    expect(signFor(pack("London 1308"))?.key).toBe("signpost-oak");
    expect(signFor(pack("London 1650"))?.key).toBe("signpost-painted");
    expect(signFor(pack("London 1880"))?.key).toBe("signpost-iron");
    expect(signFor(pack("Beijing 1880"))?.key).toBe("signpost-lacquer");
    expect(signFor(pack("Kyoto 1700"))?.key).toBe("signpost-split");
    expect(signFor(pack("Cairo 1200"))?.key).toBe("signpost-bazaar");
    expect(signFor(pack("Delhi 1500"))?.key).toBe("signpost-pennant");
    expect(signFor(pack("Rome 100 BCE"))).toBeUndefined();
    const camp = pack("Beijing 1880");
    camp.setting = { ...camp.setting!, settlement: "camp" };
    expect(signFor(camp)).toBeUndefined();
  });

  it("identifies actual trades and civic functions without a generic sacred glyph", () => {
    expect(emblemFor(undefined, "fishmonger")).toBe(7);
    expect(emblemFor(undefined, "tailor")).toBe(1);
    expect(emblemFor(undefined, "weaver")).toBe(12);
    expect(emblemFor(undefined, "apothecary")).toBe(10);
    expect(emblemFor(undefined, "bookseller")).toBe(8);
    expect(emblemFor(undefined, "swineherd")).toBeUndefined();
    expect(emblemFor(undefined, "resident", "The baker's shop")).toBe(3);
    expect(emblemFor("school", "baker")).toBe(8);
    expect(emblemFor("assembly")).toBe(11);
    expect(emblemFor("temple-yard")).toBeUndefined();
    expect(emblemFor("shrine")).toBeUndefined();
  });

  it("pins the new placement only on fresh settings", () => {
    const old = {
      ...settingFor("London 1308"),
      geographyRevision: 1 as const,
    };
    delete old.signageRevision;
    expect(integratedSetting(old).signageRevision).toBeUndefined();
    const fresh = settingFor("London 1308");
    delete fresh.geographyRevision;
    expect(integratedSetting(fresh).signageRevision).toBe(1);
  });

  it("ships every glyph and directional shadow within the compact budget, anchored at the post", () => {
    const frames = atlas.frames as Record<
      string,
      { frame: { w: number; h: number }; pivot: { x: number; y: number } }
    >;
    const masks = shadows.frames as Record<string, unknown>;
    for (const style of signStyles) {
      expect(propDefs[`signpost-${style}`].variants).toBe(signLabels.length);
      for (let i = 0; i < signLabels.length; i++) {
        const key = `study-propb-signpost-${style}-${i}`;
        const frame = frames[key];
        expect(frame, key).toBeDefined();
        expect(frame.frame.w).toBeLessThanOrEqual(23);
        expect(frame.frame.h).toBeLessThanOrEqual(37);
        expect(frame.pivot.x).toBeLessThan(0.25);
        for (const phase of ["morning", "midday", "afternoon", "night"])
          expect(masks[`${phase}:${key}`], `${phase}:${key}`).toBeDefined();
      }
    }
    expect(frames["study-propb-sign-hanging-1"]).toBeDefined();
  });
});
