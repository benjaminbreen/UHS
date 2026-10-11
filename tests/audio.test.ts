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
import {
  anywhereThemes,
  culturalMusic,
  culturalThemes,
  MusicRotation,
} from "../src/audio/cultural-themes";
import { cultures } from "../src/content/history/types";
import { eras } from "../src/content/history/dates";
import { layeredThemes } from "../src/audio/layered-themes";
import { catalog } from "../src/audio/sfx";
import * as handling from "../src/audio/handling";

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
        expect(score.theme.id).toBe(theme.id);
        expect(score.beats).toBe(theme.bars * theme.meter);
        expect(score.notes.length).toBeGreaterThan(50);
        for (const n of score.notes) {
          expect(n.beat + n.duration).toBeLessThanOrEqual(score.beats + 0.1);
          expect(n.duration).toBeGreaterThan(0);
          expect(n.midi).toBeGreaterThanOrEqual(24);
          expect(n.midi).toBeLessThanOrEqual(108);
        }
      }
    expect(culturalMusic("european", 1660).direct.map((t) => t.id)).toContain(
      "herengracht-ground",
    );
    for (const theme of layeredThemes.filter((t) => t.sections)) {
      expect(theme.sections![0].bar).toBe(0);
      for (const [i, section] of theme.sections!.entries()) {
        expect(section.bar).toBeLessThan(theme.bars);
        if (i) expect(section.bar).toBeGreaterThan(theme.sections![i - 1].bar);
      }
      for (const layer of theme.layers) {
        expect(layer.enter ?? 0).toBeLessThan(layer.exit ?? theme.bars);
        expect(layer.exit ?? theme.bars).toBeLessThanOrEqual(theme.bars);
        expect(
          layer.loop
            .split(" ")
            .reduce((sum, token) => sum + Number(token.split(":")[1]), 0),
        ).toBeGreaterThan(0);
      }
      expect((theme.bars * theme.meter * 60) / theme.bpm).toBeGreaterThan(120);
    }
  });
  it("matches dated soundtracks and preserves the minimum candidate lengths", () => {
    for (const themeId of [
      "jeitun-clay-hearths",
      "guila-naquitz-seed-gatherers",
      "soro-mikaya-first-ridge",
      "kona-open-strings",
      "issyk-kul-three-strings",
      "hoabinh-canopy-light",
      "jenne-jeno-river-market",
      "turkana-cattle-dusk",
      "cairo-courtyard-lamps",
    ]) {
      for (const period of periods) {
        const score = compose({ ...defaultArrangement, themeId, period });
        expect((score.beats * 60) / score.bpm).toBeGreaterThanOrEqual(180);
      }
    }
    for (const [culture, year, id] of [
      ["inner-eurasian", -6000, "jeitun-clay-hearths"],
      ["mesoamerican", -7500, "guila-naquitz-seed-gatherers"],
      ["andean", -5500, "soro-mikaya-first-ridge"],
      ["australian-pacific", 1975, "kona-open-strings"],
      ["inner-eurasian", 1970, "issyk-kul-three-strings"],
      ["southeast-asian", -6500, "hoabinh-canopy-light"],
      ["west-central-african", 750, "jenne-jeno-river-market"],
      ["east-southern-african", -2000, "turkana-cattle-dusk"],
      ["north-african-west-asian", 1250, "cairo-courtyard-lamps"],
      ["southeast-asian", -2000, "ban-chiang-rain-path"],
      ["inner-eurasian", -2000, "sintashta-last-light"],
      ["other-indigenous-american", 100, "hopewell-wide-circle"],
    ] as const) {
      expect(culturalMusic(culture, year).direct.map((t) => t.id)).toContain(
        id,
      );
    }
    const java = culturalMusic("southeast-asian", 1450);
    expect(java.direct.map((t) => t.id)).toContain("gongs-of-trowulan");
    const later = culturalMusic("southeast-asian", 1970);
    expect(later.direct.map((t) => t.id)).toContain("bali-kotekan");
    expect(later.family.map((t) => t.id)).not.toContain("ban-chiang-rain-path");
    expect(later.family.map((t) => t.id)).toContain("gongs-of-trowulan");
    expect(culturalMusic("andean", 1680).direct.map((t) => t.id)).toEqual([
      "cusco-apricot-dusk",
    ]);
    expect(culturalMusic("andean", 1500).direct.map((t) => t.id)).not.toContain(
      "cusco-apricot-dusk",
    );
    expect(culturalMusic("european", -6200).direct.map((t) => t.id)).toEqual([
      "lepenski-river-hearths",
    ]);
    expect(
      culturalMusic("south-asian", -4500).direct.map((t) => t.id),
    ).toContain("mehrgarh-rain-jars");
  });
  it("makes every registered song reachable and respects both date boundaries", () => {
    const placeThemes = [...culturalThemes, ...layeredThemes];
    const all = [...themes, ...placeThemes];
    expect(new Set(all.map((t) => t.id)).size).toBe(all.length);
    for (const theme of placeThemes) {
      if ("anywhere" in theme && theme.anywhere) {
        expect(anywhereThemes).toContain(theme);
        continue;
      }
      expect(theme.years[1] - theme.years[0]).toBeGreaterThanOrEqual(100);
      for (const culture of [theme.culture].flat()) {
        for (const year of theme.years)
          expect(culturalMusic(culture, year).direct).toContain(theme);
        for (const year of [theme.years[0] - 1, theme.years[1] + 1])
          expect(culturalMusic(culture, year).family).not.toContain(theme);
      }
    }
    for (const [culture] of cultures) {
      expect(culturalMusic(culture, 2026).direct.length).toBeGreaterThanOrEqual(
        2,
      );
      for (const era of eras) {
        const { direct, family } = culturalMusic(culture, era.sample.year);
        expect(new Set(family.map((t) => t.id)).size).toBe(family.length);
        expect(family).toEqual([...direct, ...anywhereThemes]);
      }
    }
    expect(culturalMusic("european", 1969).direct.map((t) => t.id)).toContain(
      "houston-1969",
    );
    expect(
      culturalMusic("mesoamerican", 1975, {
        lon: -157.86,
        lat: 21.31,
      }).direct.map((t) => t.id),
    ).toContain("kona-open-strings");
    expect(
      culturalMusic("west-central-african", 1650, {
        lon: 37.47,
        lat: 12.6,
      }).direct.map((t) => t.id),
    ).toContain("gondar-rains");
    expect(
      culturalMusic("mesoamerican", 1975, {
        lon: -99.13,
        lat: 19.43,
      }).direct.map((t) => t.id),
    ).not.toContain("kona-open-strings");
  });
  it("rotates every eligible regional and shared song without repeats or starvation", () => {
    const local = culturalMusic("east-asian", 2026).direct;
    const shared = [...themes, ...anywhereThemes];
    const rotation = new MusicRotation(local, shared);
    const heardLocal: string[] = [],
      heardShared: string[] = [];
    let previous: string | undefined;
    for (let i = 0; i < 2 * Math.max(local.length, shared.length); i++) {
      const id = rotation.next(previous);
      expect(id).not.toBe(previous);
      (i % 2 === 0 ? heardLocal : heardShared).push(id);
      previous = id;
    }
    expect(new Set(heardLocal.slice(0, local.length))).toEqual(
      new Set(local.map((t) => t.id)),
    );
    expect(new Set(heardShared.slice(0, shared.length))).toEqual(
      new Set(shared.map((t) => t.id)),
    );
    const fallback = new MusicRotation([], shared);
    const heard = Array.from({ length: shared.length }, () => fallback.next());
    expect(new Set(heard)).toEqual(new Set(shared.map((t) => t.id)));
    const single = new MusicRotation([local[0]], shared);
    expect(single.next(local[0].id)).not.toBe(local[0].id);
    expect(single.next()).toBe(local[0].id);
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
  it("gives every material, food, coin and pen a short, finite sound", () => {
    const sounds = [
      ...(
        [
          "stone",
          "metal",
          "wood",
          "pottery",
          "earth",
          "shell",
          "food",
          "soft",
        ] as const
      ).map(handling.takeUp),
      ...(["crunch", "chew", "leafy"] as const).flatMap((b) => [
        handling.eat(b, false),
        handling.eat(b, true),
      ]),
      ...(["metal", "shell", "paper"] as const).map((money) =>
        handling.pay(money, 12),
      ),
      ...(["charcoal", "clay", "brush", "pen", "pencil", "tap"] as const).map(
        handling.writing,
      ),
      handling.drink(),
      handling.barter("stone", "food"),
      handling.pageTurn(),
    ];
    for (const sound of sounds) {
      expect(sound.length).toBeGreaterThan(0);
      for (const layer of sound) {
        expect(Number.isFinite(layer.freq) && Number.isFinite(layer.gain)).toBe(
          true,
        );
        expect(layer.at + layer.dur).toBeLessThan(1.6);
      }
    }
    expect(handling.writingTool(-2500, "north-african-west-asian")).toBe(
      "clay",
    );
    expect(handling.writingTool(1200, "east-asian")).toBe("brush");
    expect(handling.materialOf("flint")).toBe("stone");
    expect(handling.moneyOf("coin")).toBe("metal");
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
