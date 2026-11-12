import type { LayeredTheme } from "./layered-themes";

const seq = (table: Record<string, string>, chords: string) => chords.split(" ").map((c) => table[c]).join(" ");

const v = {
  D: "A3+D4+F#4",
  "F#7": "A#3+C#4+E4",
  Bm: "B3+D4+F#4",
  D7: "A3+C4+F#4",
  G: "B3+D4+G4",
  "G#dim": "B3+D4+F4",
  A7: "A3+C#4+G4",
  E7: "G#3+B3+D4",
  A: "A3+C#4+E4",
  C: "C4+E4+G4",
  Am7: "A3+C4+G4",
  Gm: "A#3+D4+G4",
};
// Half a bar of oom-pah: the chord lands on the second beat.
const pah = (c: keyof typeof v) => `-:1 ${v[c]}:.5 -:.5`;
const bar = (a: keyof typeof v, b = a) => `${pah(a)} ${pah(b)}`;
const comp: Record<string, string> = {
  D: bar("D"),
  "F#7": bar("F#7"),
  Bm: bar("Bm"),
  D7: bar("D7"),
  G: bar("G"),
  "G#dim": bar("G#dim"),
  "D-A7": bar("D", "A7"),
  Dend: `-:1 ${v.D}:.5 -:.5 ${v.D}:1 -:1`,
  E7: bar("E7"),
  A: bar("A"),
  A7: bar("A7"),
  C: bar("C"),
  Am7: bar("Am7"),
  "G-E7": bar("G", "E7"),
  "Am7-D7": bar("Am7", "D7"),
  "G-C": bar("G", "C"),
  Gend: `-:1 ${v.G}:.5 -:.5 ${v.G}:1 -:1`,
};
const low: Record<string, string> = {
  D: "D2:1 -:1 A2:1 -:1",
  "F#7": "F#2:1 -:1 C#3:1 -:1",
  Bm: "B2:1 -:1 F#2:1 A2:1",
  D7: "D3:1 -:1 C3:1 A2:1",
  G: "G2:1 -:1 D3:1 -:1",
  "G#dim": "G#2:1 -:1 D3:1 -:1",
  "D-A7": "A2:1 -:1 A2:1 C#3:1",
  Dend: "D3:1 A2:1 D2:1 -:1",
  E7: "E2:1 -:1 B2:1 -:1",
  A: "A2:1 -:1 E2:1 -:1",
  A7: "A2:1 -:1 C#3:1 E3:1",
  C: "C3:1 -:1 G2:1 -:1",
  Am7: "A2:1 -:1 E2:1 -:1",
  "G-E7": "G2:1 -:1 E2:1 -:1",
  "Am7-D7": "A2:1 -:1 D3:1 -:1",
  "G-C": "G2:1 -:1 C3:1 -:1",
  Gend: "G2:1 D2:1 G2:1 -:1",
};

const strain = "D F#7 Bm D7 G G#dim D-A7 Dend",
  minor = "Bm F#7 Bm E7 A A E7 A7",
  trio = "G G C G Am7 D G-E7 Am7-D7",
  trioEnd = "G G C G Am7 D G-C Gend",
  body = `D D D A ${strain} ${strain} ${minor} ${strain} ${trio} ${trioEnd}`;

const tune =
  "A4:.5 D5:.5 F#5:1 A5:1 F#5:.5 D5:.5 C#5:1 E5:.5 F#5:.5 A#5:1 F#5:1 B5:1.5 A5:.5 F#5:1 D5:1 C5:.5 D5:.5 F#5:1 A5:1 C6:1 " +
  "B5:1 G5:.5 B5:.5 D6:1 B5:1 B5:.5 G#5:.5 F5:1 G#5:.5 B5:.5 D6:1 A5:1 F#5:.5 D5:.5 E5:.5 G5:.5 C#5:1 D5:1 F#5:.5 A5:.5 D6:1 -:1";
const under = "F#4:2 A4:2 A#4:4 B4:2 F#4:2 F#4:2 C5:2 B4:2 D5:2 B4:2 G#4:2 A4:2 G4:2 F#4:2 -:2";
const trioTune = "D5:1 B4:.5 D5:.5 G5:2 F#5:.5 G5:.5 A5:.5 G5:.5 E5:1 D5:1 E5:1 C5:.5 E5:.5 G5:2 F#5:.5 G5:.5 B5:.5 A5:.5 G5:1 D5:1 C6:1.5 B5:.5 A5:1 E5:1 F#5:.5 A5:.5 C6:1 B5:.5 A5:.5 F#5:1";
const trioUnder = "G4:2 B4:2 D4:2 G4:2 E4:2 G4:2 D4:2 B4:2 E4:2 A4:2 F#4:2 A4:2 D4:2 E4:2";
const swing8 = "C4:.5:1 C4:.5:.5";

/** A swung two-step for the middle of the day, kept for characters who would whistle it. */
export const noonTheme: LayeredTheme = {
  id: "sun-straight-overhead",
  title: "Sun straight overhead",
  subtitle:
    "A swung two-step for noon. An accordion tune struts over an oom-pah bass through chords that keep stepping outside the key; a clarinet takes it with a horn underneath; a minor strain has the piano ask and a muted trumpet answer twice; the trio drops to the key a fourth up and goes smooth; a woodblock is left alone for a bar, a clarinet climbs back by half steps, and the whole band plays it home over a bass walking down.",
  place: "All of history",
  culture: [],
  years: [0, 0],
  anywhere: true,
  hours: [11, 15],
  playful: true,
  evidence: "Original: a march-and-trio two-step in the manner of 16-bit town themes, with ragtime's borrowed dominants. It reconstructs no tradition.",
  bpm: 132,
  meter: 4,
  bars: 68,
  key: "D major, trio in G major",
  swing: [0.5, 0.1],
  reverb: [0.16, 1.6],
  sections: [
    { bar: 0, label: "Vamp" },
    { bar: 4, label: "Strut" },
    { bar: 12, label: "Strut, clarinet" },
    { bar: 20, label: "Minor strain" },
    { bar: 28, label: "Strut" },
    { bar: 36, label: "Trio" },
    { bar: 52, label: "Break" },
    { bar: 56, label: "Home" },
    { bar: 64, label: "Tag" },
  ],
  layers: [
    { voice: "uke", stem: "harmony", loop: seq(comp, body), velocity: 0.15, exit: 52, pan: 0.25 },
    { voice: "bass", stem: "bass", loop: seq(low, body), velocity: 0.2, exit: 52 },
    { voice: "kick", stem: "percussion", loop: "C2:1 -:1", velocity: 0.28, exit: 52 },
    { voice: "brush", stem: "percussion", loop: "-:1 C4:1", velocity: 0.11, enter: 2, exit: 52 },
    { voice: "hat", stem: "percussion", loop: swing8, velocity: 0.05, enter: 4, exit: 52, pan: 0.3, day: true },
    { voice: "wood", stem: "percussion", loop: "E5:1 B4:1 E5:.5 E5:.5 B4:1", velocity: 0.1, exit: 4, pan: -0.4 },
    { voice: "clarinet", stem: "melody", loop: "-:13 A5:.5 G5:.5 E5:.5 C#5:.5 B4:1", velocity: 0.18, exit: 4, pan: 0.1 },

    { voice: "accordion", stem: "melody", loop: tune, velocity: 0.26, enter: 4, exit: 12, pan: -0.1 },

    { voice: "clarinet", stem: "melody", loop: tune, velocity: 0.2, enter: 12, exit: 20, pan: 0.1 },
    { voice: "horn", stem: "harmony", loop: under, velocity: 0.1, enter: 12, exit: 20, pan: -0.3 },

    {
      voice: "piano",
      stem: "melody",
      loop:
        "F#5:.5 B5:.5 D6:.5 B5:.5 F#5:1 -:1 E5:.5 A#5:.5 C#6:.5 A#5:.5 F#5:1 -:1 F#5:.5 B5:.5 D6:.5 F#6:.5 E6:.5 D6:.5 B5:1 G#5:1 B5:.5 D6:.5 E6:1 -:1 " +
        "C#6:1.5 B5:.5 A5:1 E5:1 F#5:.5 A5:.5 C#6:1 A5:1 E5:1 D5:.5 E5:.5 G#5:.5 B5:.5 D6:1 B5:1 C#6:1 A5:1 G5:1 E5:1",
      velocity: 0.3,
      enter: 20,
      exit: 28,
      pan: -0.1,
    },
    { voice: "muted", stem: "harmony", loop: "-:3 B4:.5 B4:.5 -:3 A#4:.5 A#4:.5 -:7 E5:.5 E5:.5 -:16", velocity: 0.2, enter: 20, exit: 28, pan: 0.35 },

    { voice: "accordion", stem: "melody", loop: tune, velocity: 0.24, enter: 28, exit: 36, pan: -0.1 },
    { voice: "clarinet", stem: "harmony", loop: under, velocity: 0.1, enter: 28, exit: 36, pan: 0.3 },
    { voice: "celesta", stem: "harmony", loop: "-:14 D6:.5 F#6:.5 A6:1 -:14 D6:.5 F#6:.5 A6:1", velocity: 0.12, enter: 28, exit: 36, pan: 0.4 },

    { voice: "flute", stem: "melody", loop: `${trioTune} G5:1 B5:1 G#5:1 B5:1 A5:1 C6:.5 A5:.5 F#5:1 D5:1`, velocity: 0.16, enter: 36, exit: 44, pan: -0.1 },
    { voice: "accordion", stem: "harmony", loop: `${trioUnder} E4:2 F#4:2`, velocity: 0.11, enter: 36, exit: 44, pan: 0.25 },
    { voice: "flute", stem: "melody", loop: `${trioTune} G5:1 B5:1 C6:1 E6:1 D6:1 B5:.5 G5:.5 G5:1 -:1`, velocity: 0.14, enter: 44, exit: 52, pan: -0.1 },
    { voice: "clarinet", stem: "melody", loop: `${trioTune} G5:1 B5:1 C6:1 E6:1 D6:1 B5:.5 G5:.5 G5:1 -:1`, velocity: 0.12, enter: 44, exit: 52, pan: 0.15 },
    { voice: "accordion", stem: "harmony", loop: `${trioUnder} D4:2 -:2`, velocity: 0.11, enter: 44, exit: 52, pan: 0.25 },
    { voice: "celesta", stem: "harmony", loop: "-:.5 D6:.5 -:1 -:.5 B5:.5 -:1", velocity: 0.08, enter: 44, exit: 52, pan: 0.4 },

    { voice: "uke", stem: "harmony", loop: `${v.A7}:.5 -:7.5 ${v.A7}:.5 -:3.5 ${v.A7}:.5 -:.5 ${v.A7}:.5 -:.5 ${v.A7}:1 -:1`, velocity: 0.17, enter: 52, exit: 56, pan: 0.25 },
    { voice: "bass", stem: "bass", loop: "A2:1 -:7 A2:1 -:3 A2:.5 -:.5 A2:.5 -:.5 A2:1 -:1", velocity: 0.2, enter: 52, exit: 56 },
    { voice: "wood", stem: "percussion", loop: "-:1 E5:.5 E5:.5 B4:.5 E5:.5 -:.5 B4:.5 E5:1 B4:1 E5:1 B4:1 -:8", velocity: 0.14, enter: 52, exit: 56, pan: -0.4 },
    { voice: "clarinet", stem: "melody", loop: "-:4 E5:.5 F5:.5 F#5:.5 G5:.5 G#5:.5 A5:.5 A#5:.5 B5:.5 C#6:2 A5:2 G5:.5 E5:.5 C#5:.5 A4:.5 G4:1 -:1", velocity: 0.2, enter: 52, exit: 56, pan: 0.1 },

    { voice: "uke", stem: "harmony", loop: seq(comp, strain), velocity: 0.15, enter: 56, exit: 64, pan: 0.25 },
    { voice: "bass", stem: "bass", loop: seq(low, strain), velocity: 0.2, enter: 56, exit: 64 },
    { voice: "kick", stem: "percussion", loop: "C2:1 -:1", velocity: 0.3, enter: 56 },
    { voice: "brush", stem: "percussion", loop: "-:1 C4:1", velocity: 0.12, enter: 56, exit: 67 },
    { voice: "hat", stem: "percussion", loop: swing8, velocity: 0.055, enter: 56, exit: 64, pan: 0.3, day: true },
    { voice: "accordion", stem: "melody", loop: tune, velocity: 0.22, enter: 56, exit: 64, pan: -0.15 },
    { voice: "flute", stem: "melody", loop: tune, velocity: 0.12, enter: 56, exit: 64, pan: 0.15 },
    { voice: "horn", stem: "harmony", loop: under, velocity: 0.11, enter: 56, exit: 64, pan: -0.3 },
    { voice: "celesta", stem: "harmony", loop: tune, velocity: 0.07, enter: 56, exit: 64, pan: 0.4 },

    // Tag: the bass walks D, C, B, B-flat, A under the last four bars.
    { voice: "uke", stem: "harmony", loop: `${bar("D", "D7")} ${bar("G", "Gm")} ${bar("D", "A7")} ${v.D}:1 -:.5 ${v.A7}:.5 ${v.D}:1 -:1`, velocity: 0.16, enter: 64, pan: 0.25 },
    { voice: "bass", stem: "bass", loop: "D3:1 -:1 C3:1 -:1 B2:1 -:1 A#2:1 -:1 A2:1 -:1 A2:1 -:1 D2:1 -:.5 A2:.5 D2:1 -:1", velocity: 0.2, enter: 64 },
    {
      voice: "accordion",
      stem: "melody",
      loop: "D5:.5 F#5:.5 A5:1 C6:1 A5:1 B5:1 D6:1 A#5:1 D6:1 A5:1 F#5:1 E5:.5 G5:.5 C#6:1 D6:1 -:.5 A5:.5 D6:1 -:1",
      velocity: 0.24,
      enter: 64,
      pan: -0.1,
    },
    { voice: "clarinet", stem: "harmony", loop: "F#4:2 F#4:2 G4:2 G4:2 F#4:2 G4:2 F#4:1 -:.5 E4:.5 F#4:1 -:1", velocity: 0.12, enter: 64, pan: 0.2 },
  ],
};
