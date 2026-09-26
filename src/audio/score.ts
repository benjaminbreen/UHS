/** Original compositions. Notes and harmony remain independent of instrumentation. */
import { culturalThemes, type CulturalTheme } from "./cultural-themes";
import { layeredThemes, type LayeredTheme } from "./layered-themes";
export const seasons = ["spring", "summer", "autumn", "winter"] as const;
export const periods = ["dawn", "day", "dusk", "night"] as const;
export type Season = (typeof seasons)[number];
export type Period = (typeof periods)[number];
export type Era = "pastoral" | "chamber" | "electronic";
export const stems = ["melody", "harmony", "bass", "percussion"] as const;
export type Stem = (typeof stems)[number];
export type Voice =
  | "flute"
  | "harp"
  | "strings"
  | "bell"
  | "keys"
  | "bass"
  | "kick"
  | "brush"
  | "pluck"
  | "oud"
  | "reed"
  | "ney"
  | "drone"
  | "balafon"
  | "gong"
  | "frame"
  | "wood"
  | "shaker"
  | "saron"
  | "bonang"
  | "bronze"
  | "chime"
  | "sho"
  | "mridanga"
  | "tanpura"
  | "sub"
  | "udu"
  | "kalimba"
  | "throat"
  | "whistle"
  | "sistrum"
  | "harpsichord"
  | "horn"
  | "agogo"
  | "clap"
  | "piano"
  | "snare"
  | "accordion"
  | "steam"
  | "guiro"
  | "steel"
  | "uke"
  | "guitar"
  | "erhu"
  | "vib"
  | "organ"
  | "rhodes"
  | "eguitar"
  | "fuzz"
  | "ebass"
  | "hat"
  | "saw"
  | "pad"
  | "crackle"
  | "carillon"
  | "theremin"
  | "beep"
  | "rockgong"
  | "xun"
  | "crack"
  | "khene"
  | "panpipe"
  | "footdrum"
  | "tanbur"
  | "muted"
  | "clarinet"
  | "choir"
  | "singer";
const unpitched = new Set<Voice>([
  "kick",
  "brush",
  "frame",
  "wood",
  "shaker",
  "mridanga",
  "sistrum",
  "clap",
  "crack",
  "snare",
  "steam",
  "guiro",
  "hat",
  "crackle",
]);
export interface Note {
  beat: number;
  duration: number;
  midi: number;
  velocity: number;
  stem: Stem;
  voice: Voice;
  pan: number;
  cents?: number;
  /** Semitones below the pitch that the note scoops up from. */
  bend?: number;
}
export interface Theme {
  id: string;
  title: string;
  subtitle: string;
  season?: Season;
  bpm: number;
  key: string;
  melody: string[];
  bridge: string[];
  chords: string[];
  bridgeChords: string[];
}
// Each phrase is one 4/4 bar. A dash is a rest; suffix is duration in quarter notes.
export const themes: Theme[] = [
  {
    id: "first-green",
    title: "The first green",
    subtitle: "Sun through new leaves; a small, hopeful beginning.",
    season: "spring",
    bpm: 88,
    key: "D major",
    melody: [
      "F#4:1 A4:.5 B4:.5 A4:1 E4:1",
      "F#4:1 E4:.5 D4:.5 E4:2",
      "F#4:.5 A4:.5 D5:1 C#5:1 A4:1",
      "B4:1 A4:.5 F#4:.5 E4:1 -:1",
      "F#4:1 A4:.5 B4:.5 D5:1 E5:1",
      "C#5:1 B4:.5 A4:.5 F#4:2",
      "G4:1 F#4:.5 E4:.5 F#4:1 A4:1",
      "E4:1 C#4:1 D4:1 -:1",
    ],
    bridge: [
      "B4:1 D5:1 F#5:1 E5:1",
      "D5:1 C#5:.5 B4:.5 A4:2",
      "G4:1 B4:.5 D5:.5 E5:1 D5:1",
      "C#5:1 A4:1 E5:1 -:1",
      "F#5:1 E5:.5 D5:.5 B4:1 A4:1",
      "D5:1 C#5:1 A4:1 F#4:1",
      "G4:1 B4:1 A4:1 E4:1",
      "F#4:1 E4:1 D4:1 -:1",
    ],
    chords: [
      "D3 F#3 A3 C#4",
      "A2 E3 A3 B3",
      "B2 F#3 A3 D4",
      "F#2 C#3 F#3 A3",
      "G2 D3 F#3 B3",
      "D3 F#3 A3 C#4",
      "E3 G3 B3 D4",
      "A2 E3 G3 C#4",
    ],
    bridgeChords: [
      "B2 F#3 A3 D4",
      "F#2 C#3 E3 A3",
      "G2 D3 A3 B3",
      "A2 E3 G3 C#4",
      "G2 D3 F#3 B3",
      "D3 F#3 A3 C#4",
      "E3 G3 B3 D4",
      "A2 E3 A3 C#4",
    ],
  },
  {
    id: "long-light",
    title: "Fields of long light",
    subtitle: "A wide horizon, warm stone, and nowhere to hurry.",
    season: "summer",
    bpm: 94,
    key: "G major",
    melody: [
      "D5:1 B4:.5 A4:.5 G4:1 A4:1",
      "B4:1 D5:1 E5:1 D5:1",
      "B4:1 A4:.5 G4:.5 E4:1 G4:1",
      "A4:2 D4:1 -:1",
      "D5:.5 E5:.5 G5:1 F#5:1 E5:1",
      "D5:1 B4:.5 A4:.5 B4:2",
      "C5:1 B4:1 A4:1 G4:1",
      "A4:1 F#4:1 G4:1 -:1",
    ],
    bridge: [
      "E5:1 G5:1 A5:1 G5:1",
      "F#5:1 E5:.5 D5:.5 B4:2",
      "E5:1 D5:1 B4:1 G4:1",
      "A4:1 B4:1 D5:1 -:1",
      "C5:1 E5:.5 G5:.5 E5:1 D5:1",
      "B4:1 D5:1 G5:1 F#5:1",
      "E5:1 C5:1 A4:1 B4:1",
      "A4:1 F#4:1 G4:1 -:1",
    ],
    chords: [
      "G2 D3 F#3 B3",
      "C3 G3 B3 E4",
      "E3 G3 B3 D4",
      "D3 F#3 A3 E4",
      "C3 G3 B3 E4",
      "G2 D3 G3 B3",
      "A2 E3 G3 C4",
      "D3 F#3 A3 C4",
    ],
    bridgeChords: [
      "C3 G3 B3 E4",
      "B2 F#3 A3 D4",
      "E3 G3 B3 D4",
      "D3 F#3 A3 C4",
      "C3 G3 B3 E4",
      "G2 D3 F#3 B3",
      "A2 E3 G3 C4",
      "D3 F#3 A3 C4",
    ],
  },
  {
    id: "amber-road",
    title: "The amber road",
    subtitle: "A wistful walking song for orchards and old places.",
    season: "autumn",
    bpm: 78,
    key: "E minor / Dorian color",
    melody: [
      "B4:1 G4:.5 F#4:.5 E4:1 F#4:1",
      "G4:1 B4:1 A4:1 G4:1",
      "F#4:1 A4:.5 B4:.5 D5:1 C#5:1",
      "B4:2 A4:1 -:1",
      "G4:.5 A4:.5 B4:1 E5:1 D5:1",
      "B4:1 A4:1 G4:1 E4:1",
      "F#4:1 G4:.5 A4:.5 F#4:1 D#4:1",
      "E4:3 -:1",
    ],
    bridge: [
      "E5:1 D5:1 B4:1 G4:1",
      "A4:1 C#5:1 E5:1 F#5:1",
      "G5:1 F#5:.5 E5:.5 D5:1 B4:1",
      "A4:2 F#4:1 -:1",
      "G4:1 B4:1 E5:1 D5:1",
      "C5:1 B4:.5 A4:.5 G4:2",
      "F#4:1 A4:1 B4:1 D#5:1",
      "E5:2 B4:1 -:1",
    ],
    chords: [
      "E3 G3 B3 F#4",
      "C3 G3 B3 E4",
      "D3 F#3 A3 E4",
      "A2 E3 G3 C#4",
      "E3 G3 B3 D4",
      "C3 E3 G3 B3",
      "B2 F#3 A3 D#4",
      "E3 G3 B3 F#4",
    ],
    bridgeChords: [
      "C3 G3 B3 E4",
      "A2 E3 G3 C#4",
      "G2 D3 F#3 B3",
      "D3 F#3 A3 C4",
      "E3 G3 B3 D4",
      "C3 G3 B3 E4",
      "B2 F#3 A3 D#4",
      "E3 G3 B3 F#4",
    ],
  },
  {
    id: "snow-lanterns",
    title: "Lanterns in the snow",
    subtitle: "A little light held against an enormous, quiet sky.",
    season: "winter",
    bpm: 68,
    key: "A major / F♯ minor",
    melody: [
      "C#5:1 E5:1 B4:2",
      "A4:1 G#4:1 F#4:1 -:1",
      "A4:1 C#5:.5 E5:.5 F#5:1 E5:1",
      "D5:2 C#5:1 -:1",
      "B4:1 C#5:1 E5:1 G#5:1",
      "F#5:1 E5:1 C#5:1 A4:1",
      "B4:1 A4:.5 G#4:.5 B4:1 E4:1",
      "A4:3 -:1",
    ],
    bridge: [
      "F#5:2 E5:1 C#5:1",
      "D5:1 F#5:1 A5:1 G#5:1",
      "E5:1 C#5:1 B4:1 A4:1",
      "G#4:2 E4:1 -:1",
      "F#4:1 A4:1 C#5:1 E5:1",
      "D5:1 C#5:.5 B4:.5 A4:2",
      "B4:1 E5:1 D5:1 B4:1",
      "C#5:2 A4:1 -:1",
    ],
    chords: [
      "A2 E3 G#3 C#4",
      "F#2 C#3 E3 A3",
      "D3 F#3 A3 E4",
      "D3 F#3 A3 C#4",
      "E3 G#3 B3 F#4",
      "F#2 C#3 E3 A3",
      "E3 G#3 B3 D4",
      "A2 E3 A3 C#4",
    ],
    bridgeChords: [
      "F#2 C#3 E3 A3",
      "D3 F#3 A3 C#4",
      "A2 E3 G#3 C#4",
      "E3 G#3 B3 D4",
      "F#2 C#3 E3 A3",
      "D3 F#3 A3 E4",
      "E3 G#3 B3 D4",
      "A2 E3 A3 C#4",
    ],
  },
  {
    id: "remembered-road",
    title: "The road remembers",
    subtitle:
      "The recurring travel theme: a rising fifth, an answering descent.",
    bpm: 82,
    key: "C major",
    melody: [
      "G4:1 C5:1 E5:1 D5:1",
      "C5:1 B4:.5 A4:.5 G4:2",
      "A4:1 C5:1 D5:1 E5:1",
      "B4:2 G4:1 -:1",
      "G4:1 C5:.5 E5:.5 G5:1 E5:1",
      "D5:1 C5:1 A4:1 G4:1",
      "F4:1 A4:1 G4:1 E4:1",
      "D4:1 B3:1 C4:1 -:1",
    ],
    bridge: [
      "E5:1 G5:1 A5:1 G5:1",
      "E5:1 D5:1 C5:2",
      "D5:1 F5:.5 E5:.5 D5:1 C5:1",
      "B4:2 G4:1 -:1",
      "A4:1 C5:1 E5:1 G5:1",
      "F5:1 E5:.5 D5:.5 C5:2",
      "A4:1 F4:1 D5:1 B4:1",
      "C5:2 G4:1 -:1",
    ],
    chords: [
      "C3 E3 G3 B3",
      "G2 D3 G3 B3",
      "A2 E3 G3 C4",
      "E3 G3 B3 D4",
      "F2 C3 E3 A3",
      "C3 E3 G3 B3",
      "D3 F3 A3 C4",
      "G2 D3 F3 B3",
    ],
    bridgeChords: [
      "A2 E3 G3 C4",
      "F2 C3 E3 A3",
      "D3 F3 A3 C4",
      "G2 D3 F3 B3",
      "A2 E3 G3 C4",
      "F2 C3 E3 A3",
      "D3 F3 A3 C4",
      "G2 D3 F3 B3",
    ],
  },
];
export interface Arrangement {
  season: Season;
  period: Period;
  era: Era;
  themeId: string;
}
export interface Score {
  notes: Note[];
  bpm: number;
  beats: number;
  theme: Theme | CulturalTheme | LayeredTheme;
  /** Reverb send and length in seconds, when a piece needs its own room. */
  reverb?: [number, number];
  arrangement: Arrangement;
}
export const defaultArrangement: Arrangement = {
  season: "spring",
  period: "day",
  era: "pastoral",
  themeId: "first-green",
};
export function midi(note: string): number {
  const match = /^([A-G])(#|b)?(-?\d)$/.exec(note);
  if (!match) throw Error(`Invalid score note: ${note}`);
  return (
    (Number(match[3]) + 1) * 12 +
    ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[match[1]] ?? 0) +
    (match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0)
  );
}
export function slotThemes(season: Season) {
  return themes.filter((t) => t.season === season || !t.season);
}
/** Temporary soundtrack calendar: four 28-day seasons, day 1 = spring. No simulation mutation. */
export function worldMusicSlot(clock: number): {
  season: Season;
  period: Period;
} {
  const days = Math.floor(Math.max(0, clock) / 86400),
    hour = (Math.max(0, clock) / 3600) % 24;
  return {
    season: seasons[Math.floor(days / 28) % 4],
    period:
      hour >= 5 && hour < 8
        ? "dawn"
        : hour >= 8 && hour < 17
          ? "day"
          : hour >= 17 && hour < 20
            ? "dusk"
            : "night",
  };
}
export function compose(arrangement: Arrangement): Score {
  const cultural = culturalThemes.find((t) => t.id === arrangement.themeId);
  if (cultural) return composeCultural(cultural, arrangement);
  const layered = layeredThemes.find((t) => t.id === arrangement.themeId);
  if (layered) return composeLayered(layered, arrangement);
  const theme = themes.find((t) => t.id === arrangement.themeId) ?? themes[0];
  const { period, era, season } = arrangement;
  const quiet = period === "night" || period === "dawn";
  const bpm = Math.round(
    theme.bpm *
      { dawn: 0.88, day: 1, dusk: 0.92, night: 0.78 }[period] *
      (era === "electronic" ? 1.12 : 1),
  );
  const notes: Note[] = [];
  const add = (
    beat: number,
    duration: number,
    pitch: number,
    velocity: number,
    stem: Stem,
    voice: Voice,
    pan = 0,
  ) =>
    notes.push({
      beat,
      duration: Math.min(duration, 128 - beat),
      midi: pitch,
      velocity,
      stem,
      voice,
      pan,
    });
  const lead: Voice =
    era === "chamber"
      ? "strings"
      : era === "electronic"
        ? "keys"
        : period === "night"
          ? "bell"
          : "flute";
  for (let bar = 0; bar < 32; bar++) {
    const section = Math.floor(bar / 8),
      index = bar % 8,
      bridge = section === 2;
    const chord = (bridge ? theme.bridgeChords : theme.chords)[index]
      .split(" ")
      .map(midi);
    // A / A′ / B / A″: accompaniment blooms after the first phrase, then settles.
    const bloom = section === 0 ? 0.78 : section === 2 ? 1 : 0.9;
    let beat = bar * 4;
    for (const token of (bridge ? theme.bridge : theme.melody)[index].split(
      " ",
    )) {
      const [pitch, length] = token.split(":"),
        duration = Number(length);
      if (pitch !== "-") {
        const n = midi(pitch);
        add(beat, duration * 0.92, n, 0.48 * bloom, "melody", lead, -0.08);
        // Only a few glints double the returning theme; leave air around the lead.
        if (section === 3 && index % 2 === 0 && beat % 2 === 0)
          add(
            beat + 0.025,
            duration * 0.7,
            n + 12,
            0.1,
            "harmony",
            "bell",
            0.4,
          );
      }
      beat += duration;
    }
    const pattern = quiet ? [0, 2, 1, 3] : [0, 2, 1, 3, 2, 1, 3, 2];
    pattern.forEach((tone, i) =>
      add(
        bar * 4 + (i * 4) / pattern.length + 0.018,
        quiet ? 1.6 : 0.85,
        chord[tone] + 12,
        (i % 2 === 0 ? 0.21 : 0.15) * bloom,
        "harmony",
        era === "electronic" ? "keys" : "harp",
        i % 2 ? 0.33 : -0.33,
      ),
    );
    if (section > 0 || period === "night")
      chord
        .slice(1)
        .forEach((n, i) =>
          add(
            bar * 4,
            3.85,
            n,
            (quiet ? 0.055 : 0.07) * bloom,
            "harmony",
            "strings",
            (i - 1) * 0.32,
          ),
        );
    add(
      bar * 4,
      quiet ? 3.7 : 1.8,
      chord[0] - 12,
      0.36,
      "bass",
      era === "chamber" ? "strings" : "bass",
      0,
    );
    if (!quiet) add(bar * 4 + 2, 1.7, chord[0] - 5, 0.23, "bass", "bass");
    if (!quiet || era === "electronic") {
      [0, 2].forEach((b) =>
        add(
          bar * 4 + b,
          0.24,
          36,
          period === "dusk" ? 0.2 : 0.3,
          "percussion",
          "kick",
        ),
      );
      [1, 3].forEach((b) =>
        add(bar * 4 + b, 0.14, 60, 0.13, "percussion", "brush", 0.2),
      );
      if (era === "electronic" || season === "summer")
        [0.5, 1.5, 2.5, 3.5].forEach((b) =>
          add(bar * 4 + b, 0.09, 72, 0.075, "percussion", "brush", -0.3),
        );
    }
    // A quiet countermelody appears in the second statement and bridge.
    if (section === 1 || bridge)
      [1.5, 3].forEach((b, i) =>
        add(
          bar * 4 + b,
          0.8,
          chord[i + 1] + 12,
          0.11,
          "harmony",
          era === "chamber" ? "flute" : "bell",
          0.48,
        ),
      );
  }
  return {
    notes: notes.sort((a, b) => a.beat - b.beat),
    bpm,
    beats: 128,
    theme,
    arrangement,
  };
}

function composeCultural(
  theme: CulturalTheme,
  arrangement: Arrangement,
): Score {
  const { period } = arrangement;
  const quiet = period === "night" || period === "dawn";
  const m = theme.meter,
    beats = 32 * m;
  const bpm = Math.round(
    theme.bpm * { dawn: 0.88, day: 1, dusk: 0.92, night: 0.8 }[period],
  );
  const notes: Note[] = [];
  const add = (
    beat: number,
    duration: number,
    pitch: number,
    velocity: number,
    stem: Stem,
    voice: Voice,
    pan = 0,
  ) =>
    notes.push({
      beat,
      duration: Math.min(duration, beats - beat),
      midi: pitch,
      velocity,
      stem,
      voice,
      pan,
      cents: unpitched.has(voice) ? 0 : (theme.tuning?.[pitch % 12] ?? 0),
    });
  const scale = [
    ...new Set(
      [...theme.melody, ...theme.bridge].flatMap((phrase) =>
        phrase
          .split(" ")
          .map((t) => t.split(":")[0])
          .filter((p) => p !== "-")
          .map(midi),
      ),
    ),
  ].sort((a, b) => a - b);
  const lead = (quiet && theme.nightLead) || theme.lead;
  for (let bar = 0; bar < 32; bar++) {
    const section = Math.floor(bar / 8),
      index = bar % 8,
      bridge = section === 2,
      start = bar * m;
    const chord = (bridge ? theme.bridgeChords : theme.chords)[index]
      .split(" ")
      .map(midi);
    const bloom = section === 0 ? 0.78 : section === 2 ? 1 : 0.9;
    let beat = start;
    const tacet =
      theme.melodySections && !theme.melodySections.includes(section);
    for (const token of tacet
      ? []
      : (bridge ? theme.bridge : theme.melody)[index].split(" ")) {
      const [pitch, length] = token.split(":"),
        duration = Number(length);
      if (pitch !== "-") {
        const n = midi(pitch),
          upper = scale.find((p) => p > n);
        if (theme.grace && section > 0 && duration >= 1 && upper) {
          add(beat, 0.12, upper, 0.3 * bloom, "melody", lead, -0.08);
          add(
            beat + 0.12,
            duration * 0.92 - 0.12,
            n,
            0.48 * bloom,
            "melody",
            lead,
            -0.08,
          );
        } else
          add(beat, duration * 0.92, n, 0.48 * bloom, "melody", lead, -0.08);
        if (theme.elaborate && section > 0)
          for (let i = 0; i < duration * 2; i++)
            add(
              beat + i / 2,
              0.45,
              (i % 2 && upper ? upper : n) + 12,
              0.16,
              "harmony",
              theme.answer,
              0.35,
            );
        // Heterophony: the answer shadows the tune, sparsely at first.
        else if (
          theme.heterophony &&
          section > 0 &&
          (section === 3 || beat % 1 === 0)
        )
          add(
            beat + 0.03,
            duration * 0.9,
            n + (theme.answerOctave ?? -12),
            0.2,
            "harmony",
            theme.answer,
            0.35,
          );
      }
      beat += duration;
    }
    if (!theme.heterophony && !theme.elaborate && (section === 1 || bridge))
      [m * 0.375, m * 0.75].forEach((b, i) =>
        add(
          start + b,
          m * 0.2,
          chord[i % chord.length] + 24,
          0.12,
          "harmony",
          theme.answer,
          0.45,
        ),
      );
    if (section > 0 || !quiet)
      for (const [b, tone] of theme.pattern)
        if (!quiet || b % 1 === 0)
          add(
            start + b,
            quiet ? 1.4 : 0.9,
            chord[tone % chord.length] + 12,
            (b % 1 === 0 ? 0.2 : 0.14) * bloom,
            "harmony",
            theme.accompany,
            b % 2 < 1 ? -0.3 : 0.3,
          );
    if (theme.drone)
      chord.forEach((n, i) =>
        add(
          start,
          m * 0.98,
          n + 12,
          quiet ? 0.06 : 0.08,
          "harmony",
          theme.droneVoice ?? "drone",
          i % 2 ? 0.25 : -0.25,
        ),
      );
    const previous = (bridge ? theme.bridgeChords : theme.chords)[index - 1];
    const groove = bridge ? (theme.bridgeGroove ?? theme.groove) : theme.groove;
    if (groove && theme.bass) {
      let at = start;
      for (const token of groove[index].split(" ")) {
        const [pitch, length] = token.split(":");
        if (pitch !== "-")
          add(
            at,
            Number(length) * 0.9,
            midi(pitch),
            quiet ? 0.24 : 0.34,
            "bass",
            theme.bass,
          );
        at += Number(length);
      }
    } else if (theme.steadyBass) {
      add(
        start,
        quiet ? m * 0.9 : m * 0.45,
        chord[0],
        0.34,
        "bass",
        theme.steadyBass,
      );
      if (!quiet && m % 2 === 0)
        add(start + m / 2, m * 0.4, chord[0], 0.22, "bass", theme.steadyBass);
    } else if (
      theme.bass &&
      (!previous || midi(previous.split(" ")[0]) !== chord[0])
    )
      add(start, m * 0.9, chord[0], 0.24, "bass", theme.bass);
    for (const [b, voice, pitch, velocity, every = 1] of theme.drums)
      if (
        bar % every === every - 1 &&
        (!quiet || (b === 0 && voice !== "shaker"))
      )
        add(
          start + b,
          0.25,
          pitch,
          velocity *
            (quiet ? 0.5 : 1) *
            (section === 0 ? 0.65 : 1) *
            (period === "dusk" ? 0.8 : 1),
          "percussion",
          voice,
          voice === "shaker" ? 0.3 : 0,
        );
    if (theme.mark && index === 0 && section > 0)
      add(
        start,
        m * 2,
        theme.mark[1],
        0.26,
        "percussion",
        theme.mark[0],
        -0.15,
      );
  }
  return {
    notes: notes.sort((a, b) => a.beat - b.beat),
    bpm,
    beats,
    theme,
    arrangement,
  };
}

function composeLayered(theme: LayeredTheme, arrangement: Arrangement): Score {
  const quiet = arrangement.period === "night" || arrangement.period === "dawn";
  const beats = theme.bars * theme.meter;
  const notes: Note[] = [];
  for (const layer of theme.layers) {
    if (quiet && layer.day) continue;
    const events: [number, number, number, [number, number][]][] = [];
    let length = 0;
    // "pitch:beats", with an optional ":accent"; a leading ~ scoops up a whole step.
    for (const token of layer.loop.split(" ")) {
      const [pitch, span, accent = "1"] = token.split(":");
      events.push([
        length,
        Number(span),
        Number(accent),
        pitch === "-"
          ? []
          : pitch
              .split("+")
              .map((p) => [
                midi(p.replace("~", "")) + (layer.transpose ?? 0),
                p.startsWith("~") ? 2 : 0,
              ]),
      ]);
      length += Number(span);
    }
    const first = (layer.enter ?? 0) * theme.meter,
      end = (layer.exit ?? theme.bars) * theme.meter;
    const [fadeFrom, fadeTo] = layer.fade ?? [1, 1];
    for (let at = first; at < end; at += length - (layer.drift ?? 0))
      for (const [offset, span, accent, chord] of events)
        chord.forEach(([pitch, bend], i) => {
          let start = at + offset;
          const [unit, amount] = theme.swing ?? [0, 0];
          if (unit && Math.round(start / unit) % 2 === 1) start += amount;
          const [spacing, count, feedback] = layer.echo ?? [0, 0, 0];
          // A strummed chord: each string a few hundredths of a beat later.
          for (let repeat = 0; repeat <= count; repeat++) {
            const beat = start + i * 0.03 + repeat * spacing;
            if (beat < end || (repeat > 0 && beat < beats))
              notes.push({
                beat,
                duration: Math.min(span * 0.92, beats - beat),
                midi: pitch,
                velocity:
                  layer.velocity *
                  accent *
                  (fadeFrom +
                    ((fadeTo - fadeFrom) * (at + offset - first)) /
                      (end - first)) *
                  (quiet ? 0.75 : 1) *
                  feedback ** repeat,
                stem: layer.stem,
                voice: layer.voice,
                pan: layer.pan ?? 0,
                cents: unpitched.has(layer.voice)
                  ? 0
                  : (theme.tuning?.[pitch % 12] ?? 0),
                bend,
              });
          }
        });
  }
  return {
    notes: notes.sort((a, b) => a.beat - b.beat),
    bpm: Math.round(theme.bpm * (quiet ? 0.85 : 1)),
    beats,
    reverb: theme.reverb,
    theme,
    arrangement,
  };
}
