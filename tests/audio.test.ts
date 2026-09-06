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
import { effectNotes, effects } from "../src/audio/synth";

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
  it("provides six finite, bounded SFX cues", () => {
    for (const effect of effects)
      for (const note of effectNotes(effect.id)) {
        expect(note.beat).toBeLessThan(1);
        expect(note.velocity).toBeLessThanOrEqual(0.5);
      }
  });
});
