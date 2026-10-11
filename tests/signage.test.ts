import { describe, expect, it } from "vitest";
import {
  emblemFor,
  signFor,
  signStyles,
  signLabels,
  wallSignFor,
  wallStyles,
} from "../src/content/props/signage";
import { propDefs } from "../src/content/props/catalog";
import { resolveSetting } from "../src/content/geography/resolve";
import { packs } from "../src/content/packs";
import type { Pack } from "../src/core/types";
import atlas from "../src/render/generated/props.json" with { type: "json" };
import shadows from "../src/render/generated/prop-shadows.json" with { type: "json" };

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
    expect(signFor(pack("London 1308"))?.key).toBe("wallsign-oak");
    expect(signFor(pack("London 1650"))?.key).toBe("wallsign-painted");
    expect(signFor(pack("London 1780"))?.key).toBe("wallsign-fascia");
    expect(signFor(pack("London 1880"))).toBeUndefined();
    expect(signFor(pack("Amsterdam 1650"))?.key).toBe("wallsign-cutout");
    expect(signFor(pack("Beijing 1700"))?.key).toBe("wallsign-lacquer");
    expect(signFor(pack("Beijing 1920"))).toBeUndefined();
    expect(signFor(pack("Kyoto 1400"))?.key).toBe("wallsign-split");
    expect(signFor(pack("Kyoto 1700"))?.key).toBe("wallsign-noren");
    expect(signFor(pack("Cairo 1200"))?.key).toBe("wallsign-bazaar");
    expect(signFor(pack("Delhi 1500"))?.key).toBe("wallsign-pennant");
    expect(signFor(pack("Rome 100 BCE"))).toBeUndefined();
    const camp = pack("Beijing 1700");
    camp.setting = { ...camp.setting!, settlement: "camp" };
    expect(signFor(camp)).toBeUndefined();
  });

  it("hangs the sign a trade and a place had at the door", () => {
    const hung = (query: string, emblem: number, venue?: string) => {
      const p = pack(query);
      return wallSignFor(p, signFor(p)!, emblem, venue);
    };
    expect(hung("London 1400", 0, "tavern").key).toBe("wallsign-bush");
    expect(hung("London 1700", 17).key).toBe("wallsign-barber");
    expect(hung("Kyoto 1700", 0).key).toBe("wallsign-sugidama");
    expect(hung("Beijing 1700", 0, "tavern").key).toBe("wallsign-wineflag");
    expect(hung("Vienna 1650", 3)).toEqual({ key: "wallsign-cutout", variant: 16 });
    expect(hung("London 1650", 3)).toEqual({ key: "wallsign-painted", variant: 3 });
    expect(emblemFor(undefined, "locksmith")).toBe(19);
    expect(emblemFor(undefined, "butcher")).toBe(22);
  });

  it("identifies actual trades and civic functions without a generic sacred glyph", () => {
    expect(emblemFor(undefined, "fishmonger")).toBe(7);
    expect(emblemFor(undefined, "tailor")).toBe(1);
    expect(emblemFor(undefined, "weaver")).toBe(12);
    expect(emblemFor(undefined, "apothecary")).toBe(10);
    expect(emblemFor(undefined, "bookseller")).toBe(8);
    expect(emblemFor(undefined, "swineherd")).toBeUndefined();
    expect(emblemFor(undefined, "shopkeeper", "Shop")).toBeUndefined();
    expect(emblemFor(undefined, "merchant", "Merchant's shop")).toBeUndefined();
    expect(emblemFor(undefined, "resident", "The baker's shop")).toBe(3);
    expect(emblemFor("school", "baker")).toBe(8);
    expect(emblemFor("assembly")).toBe(11);
    expect(emblemFor("temple-yard")).toBeUndefined();
    expect(emblemFor("shrine")).toBeUndefined();
  });

  it("ships every glyph and directional shadow within the compact budget", () => {
    const frames = atlas.frames as Record<
      string,
      { frame: { w: number; h: number }; pivot: { x: number; y: number } }
    >;
    const masks = shadows.frames as Record<string, unknown>;
    for (const style of wallStyles) {
      const def = propDefs[`wallsign-${style}`];
      for (let i = 0; i < (def.variants ?? 1); i++) {
        const key = `study-propb-wallsign-${style}-${i}`;
        expect(frames[key], key).toBeDefined();
        // It hangs on the wall: no shadow on the street.
        expect(masks[`midday:${key}`], key).toBeUndefined();
      }
    }
    for (const style of signStyles) {
      expect(propDefs[`signpost-${style}`].variants).toBe(16);
      for (let i = 0; i < 16; i++) {
        const key = `study-propb-signpost-${style}-${i}`;
        const frame = frames[key];
        expect(frame, key).toBeDefined();
        expect(frame.frame.w).toBeLessThanOrEqual(27);
        expect(frame.frame.h).toBeLessThanOrEqual(40);
        for (const phase of ["morning", "midday", "afternoon", "night"])
          expect(masks[`${phase}:${key}`], `${phase}:${key}`).toBeDefined();
      }
    }
    expect(frames["study-propb-sign-hanging-1"]).toBeDefined();
  });
});
