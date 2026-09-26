import { describe, expect, it } from "vitest";
import {
  compose,
  defaultArrangement,
  midi,
  periods,
  seasons,
  slotThemes,
  themes,
  worldMusicSlot,
} from "../src/audio/score";
import { culturalMusic, culturalThemes } from "../src/audio/cultural-themes";
import { layeredThemes } from "../src/audio/layered-themes";
import { catalog } from "../src/audio/sfx";

describe("original soundtrack scores", () => {
  it("writes complete phrases and playable notes in every season, time and era", () => {
    for (const theme of themes) {
      for (const phrase of [...theme.melody, ...theme.bridge]) {
        expect(
          phrase
            .split(" ")
            .reduce((sum, token) => sum + Number(token.split(":")[1]), 0),
        ).toBe(4);
      }
    }
    for (const season of seasons)
      for (const period of periods)
        for (const era of ["pastoral", "chamber", "electronic"] as const) {
          expect(slotThemes(season)).toHaveLength(2);
          for (const theme of slotThemes(season)) {
            const score = compose({ season, period, era, themeId: theme.id });
            expect(score.bpm).toBeGreaterThanOrEqual(50);
            expect(score.notes.length).toBeGreaterThan(300);
            for (const n of score.notes) {
              expect(n.beat).toBeGreaterThanOrEqual(0);
              expect(n.beat + n.duration).toBeLessThanOrEqual(
                score.beats + 0.1,
              );
              expect(n.midi).toBeGreaterThanOrEqual(24);
              expect(n.midi).toBeLessThanOrEqual(108);
              expect(n.duration).toBeGreaterThan(0);
              expect(Number.isFinite(n.velocity)).toBe(true);
            }
          }
        }
  });
  it("preserves every melody note and rhythm across eras", () => {
    for (const theme of themes) {
      const melodies = (["pastoral", "chamber", "electronic"] as const).map(
        (era) =>
          compose({ ...defaultArrangement, themeId: theme.id, era })
            .notes.filter((n) => n.stem === "melody")
            .map((n) => [n.beat, n.duration, n.midi]),
      );
      expect(melodies[0]).toEqual(melodies[1]);
      expect(melodies[1]).toEqual(melodies[2]);
    }
  });
  it("fills every bar of the place and era themes in every time of day", () => {
    for (const theme of culturalThemes) {
      for (const phrase of [
        ...theme.melody,
        ...theme.bridge,
        ...(theme.groove ?? []),
        ...(theme.bridgeGroove ?? []),
      ])
        expect(
          phrase
            .split(" ")
            .reduce((sum, token) => sum + Number(token.split(":")[1]), 0),
        ).toBe(theme.meter);
      for (const period of periods) {
        const score = compose({
          ...defaultArrangement,
          period,
          themeId: theme.id,
        });
        expect(score.theme.id).toBe(theme.id);
        expect(score.beats).toBe(32 * theme.meter);
        for (const n of score.notes) {
          expect(n.beat + n.duration).toBeLessThanOrEqual(score.beats + 0.1);
          expect(n.duration).toBeGreaterThan(0);
          expect(n.midi).toBeGreaterThanOrEqual(24);
          expect(n.midi).toBeLessThanOrEqual(108);
        }
      }
    }
  });
  it("loops every layer of the layered pieces within the piece", () => {
    for (const theme of layeredThemes)
      for (const period of periods) {
        const score = compose({
          ...defaultArrangement,
          period,
          themeId: theme.id,
        });
        expect(score.beats).toBe(theme.bars * theme.meter);
        expect(score.notes.length).toBeGreaterThan(50);
        for (const n of score.notes) {
          expect(n.beat + n.duration).toBeLessThanOrEqual(score.beats + 0.1);
          expect(n.duration).toBeGreaterThan(0);
          expect(n.midi).toBeGreaterThanOrEqual(24);
          expect(n.midi).toBeLessThanOrEqual(108);
        }
      }
    expect(culturalMusic("european", 1660).direct.map((t) => t.id)).toEqual([
      "herengracht-ground",
    ]);
  });
  it("plays a culture's pieces across its eras and puts direct hits first", () => {
    const java = culturalMusic("southeast-asian", 1450);
    expect(java.direct.map((t) => t.id)).toEqual(["gongs-of-trowulan"]);
    const later = culturalMusic("southeast-asian", 1970);
    expect(later.direct).toEqual([]);
    expect(later.family.map((t) => t.id)).toContain("gongs-of-trowulan");
  });
  it("maps the provisional calendar at boundaries and wraps the year", () => {
    expect(worldMusicSlot(0)).toEqual({ season: "spring", period: "night" });
    for (const [hour, period] of [
      [5, "dawn"],
      [8, "day"],
      [17, "dusk"],
      [20, "night"],
    ] as const)
      expect(worldMusicSlot(hour * 3600).period).toBe(period);
    expect(worldMusicSlot(28 * 86400).season).toBe("summer");
    expect(worldMusicSlot(56 * 86400).season).toBe("autumn");
    expect(worldMusicSlot(84 * 86400).season).toBe("winter");
    expect(worldMusicSlot(112 * 86400).season).toBe("spring");
    expect(midi("C4")).toBe(60);
    expect(midi("F#4")).toBe(66);
    expect(() => midi("garbage")).toThrow();
  });
  it("provides finite, bounded SFX cues", () => {
    for (const entry of catalog) {
      const sound = entry.make();
      expect(sound.length).toBeGreaterThan(0);
      for (const layer of sound) {
        expect(layer.at + layer.dur).toBeLessThan(2.5);
        expect(layer.gain).toBeGreaterThan(0);
        expect(layer.gain).toBeLessThanOrEqual(0.5);
        expect(layer.freq).toBeGreaterThan(20);
      }
    }
  });
});
