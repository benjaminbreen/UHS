import type { LayeredTheme } from "./layered-themes";

const seq = (table: Record<string, string>, chords: string) => chords.split(" ").map((c) => table[c]).join(" ");

// One bar of each chord: fingerpicked guitar (thumb on one and three), the bass, and the held strings.
const picked: Record<string, string> = {
  E: "E3:.5 B3:.5 G#3:.5 E4:.5 B2:.5 B3:.5 G#3:.5 E4:.5",
  "E/G#": "G#2:.5 B3:.5 E3:.5 E4:.5 B2:.5 B3:.5 E3:.5 E4:.5",
  A: "A2:.5 C#4:.5 A3:.5 E4:.5 E3:.5 C#4:.5 A3:.5 E4:.5",
  B: "B2:.5 B3:.5 F#3:.5 D#4:.5 F#3:.5 B3:.5 A3:.5 D#4:.5",
  "C#m7": "C#3:.5 B3:.5 G#3:.5 E4:.5 G#2:.5 B3:.5 G#3:.5 E4:.5",
  "F#m7-B": "F#2:.5 A3:.5 C#4:.5 E4:.5 B2:.5 A3:.5 B3:.5 D#4:.5",
  Eend: "E3:.5 B3:.5 A3:.5 E4:.5 E3:.5 B3:.5 G#3:.5 E4:.5",
  "C#m": "C#3:.5 G#3:.5 E3:.5 C#4:.5 G#2:.5 G#3:.5 E3:.5 C#4:.5",
  "G#m7": "G#2:.5 B3:.5 F#3:.5 D#4:.5 D#3:.5 B3:.5 F#3:.5 D#4:.5",
  Bsus: "B2:.5 B3:.5 F#3:.5 E4:.5 F#3:.5 B3:.5 F#3:.5 D#4:.5",
  D: "D3:.5 A3:.5 F#3:.5 D4:.5 A2:.5 A3:.5 F#3:.5 D4:.5",
};
const low: Record<string, string> = {
  E: "E2:1.5 E2:.5 B2:2",
  "E/G#": "G#2:1.5 G#2:.5 B2:2",
  A: "A2:1.5 A2:.5 E2:2",
  B: "B2:1.5 B2:.5 F#2:2",
  "C#m7": "C#2:1.5 C#2:.5 G#2:2",
  "F#m7-B": "F#2:2 B2:2",
  Eend: "E2:1.5 B2:.5 E2:2",
  "C#m": "C#2:1.5 C#2:.5 G#2:2",
  "G#m7": "G#2:1.5 G#2:.5 D#2:2",
  Bsus: "B2:1.5 B2:.5 F#2:2",
  D: "D2:1.5 D2:.5 A2:2",
};
const hold: Record<string, string> = {
  E: "G#3+B3+E4:4",
  "E/G#": "G#3+B3+E4:4",
  A: "A3+C#4+E4:4",
  B: "F#3+B3+D#4:4",
  "C#m7": "G#3+B3+E4:4",
  "F#m7-B": "A3+C#4+E4:2 A3+B3+D#4:2",
  Eend: "A3+B3+E4:2 G#3+B3+E4:2",
  "C#m": "G#3+C#4+E4:4",
  "G#m7": "F#3+B3+D#4:4",
  Bsus: "F#3+B3+E4:2 F#3+B3+D#4:2",
  D: "F#3+A3+D4:4",
};

const verse = "E E/G# A B C#m7 A F#m7-B Eend",
  shade = "C#m G#m7 A E C#m G#m7 A Bsus",
  sun = "D A E E D A B B",
  body = `E A E B ${verse} ${verse} ${shade} ${verse} ${sun} ${verse}`;

const tune = "B4:.5 E5:.5 G#5:1.5 F#5:.5 E5:1 F#5:.5 G#5:.5 B5:1.5 G#5:.5 E5:1 C#6:1.5 B5:.5 A5:1 E5:1 F#5:1.5 E5:.5 D#5:1 B4:1 B4:.5 E5:.5 G#5:1.5 F#5:.5 E5:1 F#5:.5 A5:.5 C#6:1.5 B5:.5 A5:1 G#5:1 F#5:.5 E5:.5 D#5:1 F#5:1 E5:3 -:1";
const tuneLow = "B3:.5 E4:.5 G#4:1.5 F#4:.5 E4:1 F#4:.5 G#4:.5 B4:1.5 G#4:.5 E4:1 C#5:1.5 B4:.5 A4:1 E4:1 F#4:1.5 E4:.5 D#4:1 B3:1 B3:.5 E4:.5 G#4:1.5 F#4:.5 E4:1 F#4:.5 A4:.5 C#5:1.5 B4:.5 A4:1 G#4:1 F#4:.5 E4:.5 D#4:1 F#4:1 E4:3 -:1";
const under = "E4:2 G#4:2 G#3:2 B3:2 A3:2 C#4:2 B3:2 D#4:1 F#4:1 C#4:2 E4:2 A3:2 E4:2 A3:2 B3:2 G#3:1 B3:1 E4:2";
const soar = "F#5:1.5 A5:.5 D6:2 C#6:1.5 B5:.5 A5:2 G#5:.5 B5:.5 E6:1.5 D#6:.5 B5:1 G#5:3 -:1 F#5:1.5 A5:.5 D6:2 E6:1.5 C#6:.5 A5:2 B5:1 D#6:1 F#6:1.5 E6:.5 D#6:2 B5:2";
const answer = "-:30 G#5:.5 B5:.5 E6:.5 G#6:.5";
const sway = "C4:.5:.5 C4:.5:1";

/** The afternoon piece, belonging to no place. */
export const afternoonTheme: LayeredTheme = {
  id: "a-good-day-for-it",
  title: "A good day for it",
  subtitle:
    "An easy afternoon in four. A guitar picks steadily; a flute tune rises a step at a time, lingers on its third note and comes down; a clarinet joins an octave under with a cello line; the middle goes into the shade of the relative minor; then three bright chords from just outside the key open it up for the strings, and the tune comes back with everyone.",
  place: "All of history",
  culture: [],
  years: [0, 0],
  anywhere: true,
  hours: [11, 16],
  evidence: "Original: a pastoral daytime piece in the manner of 16-bit farm and village themes. It reconstructs no tradition.",
  bpm: 108,
  meter: 4,
  bars: 56,
  key: "E major, borrowing D major",
  reverb: [0.26, 2.4],
  sections: [
    { bar: 0, label: "Guitar" },
    { bar: 4, label: "Tune" },
    { bar: 12, label: "Tune, with clarinet" },
    { bar: 20, label: "Shade" },
    { bar: 28, label: "Tune" },
    { bar: 36, label: "Sun" },
    { bar: 44, label: "Home" },
    { bar: 52, label: "Guitar" },
  ],
  layers: [
    { voice: "guitar", stem: "harmony", loop: seq(picked, body), velocity: 0.2, exit: 52, pan: -0.2 },
    { voice: "guitar", stem: "harmony", loop: `${seq(picked, "E A Eend")} E3+B3+E4+G#4:4`, velocity: 0.2, enter: 52, pan: -0.2 },
    { voice: "kalimba", stem: "harmony", loop: "-:14 B5:.5 G#5:.5 F#5:.5 E5:.5", velocity: 0.15, exit: 4, pan: 0.35 },
    { voice: "bass", stem: "bass", loop: seq(low, `${verse} ${shade} ${verse} ${sun} ${verse}`), velocity: 0.15, enter: 12, exit: 52 },
    { voice: "bass", stem: "bass", loop: "E2:4 A2:4 E2:8", velocity: 0.12, enter: 52 },
    { voice: "shaker", stem: "percussion", loop: sway, velocity: 0.035, enter: 4, exit: 52, pan: 0.3, day: true },

    { voice: "flute", stem: "melody", loop: tune, velocity: 0.15, enter: 4, exit: 12, pan: -0.08 },
    { voice: "kalimba", stem: "harmony", loop: answer, velocity: 0.15, enter: 4, exit: 20, pan: 0.35 },

    { voice: "flute", stem: "melody", loop: tune, velocity: 0.14, enter: 12, exit: 20, pan: -0.1 },
    { voice: "clarinet", stem: "melody", loop: tuneLow, velocity: 0.1, enter: 12, exit: 20, pan: 0.1 },
    { voice: "cello", stem: "harmony", loop: under, velocity: 0.12, enter: 12, exit: 20, pan: 0.3 },
    { voice: "brush", stem: "percussion", loop: "-:1 C4:1", velocity: 0.05, enter: 12, exit: 20, day: true },
    { voice: "kick", stem: "percussion", loop: "C2:1.5 C2:.5 -:2", velocity: 0.14, enter: 12, exit: 20, day: true },

    {
      voice: "clarinet",
      stem: "melody",
      loop: "E5:1.5 D#5:.5 C#5:2 D#5:1.5 C#5:.5 B4:2 C#5:.5 E5:.5 A5:1.5 G#5:.5 E5:1 G#5:1.5 F#5:.5 E5:2 E5:1.5 D#5:.5 C#5:1 G#5:1 F#5:1.5 E5:.5 D#5:1 B5:1 A5:.5 B5:.5 C#6:1.5 B5:.5 A5:1 B5:2 A5:1 F#5:1",
      velocity: 0.17,
      enter: 20,
      exit: 28,
      pan: -0.08,
    },
    { voice: "strings", stem: "harmony", loop: seq(hold, shade), velocity: 0.045, enter: 20, exit: 28, fade: [0.6, 1] },
    { voice: "cello", stem: "harmony", loop: "C#4:4 B3:4 A3:2 C#4:2 B3:4 C#4:4 D#4:4 E4:2 C#4:2 B3:2 D#4:2", velocity: 0.1, enter: 20, exit: 28, pan: 0.3 },

    { voice: "flute", stem: "melody", loop: tune, velocity: 0.14, enter: 28, exit: 36, pan: -0.1 },
    { voice: "celesta", stem: "melody", loop: tune, velocity: 0.09, enter: 28, exit: 36, pan: 0.35 },
    { voice: "horn", stem: "harmony", loop: under, velocity: 0.09, enter: 28, exit: 36, pan: 0.3 },
    { voice: "strings", stem: "harmony", loop: seq(hold, verse), velocity: 0.04, enter: 28, exit: 36 },
    { voice: "brush", stem: "percussion", loop: "-:1 C4:1", velocity: 0.055, enter: 28, exit: 52, day: true },
    { voice: "kick", stem: "percussion", loop: "C2:1.5 C2:.5 -:2", velocity: 0.15, enter: 28, exit: 52, day: true },

    { voice: "strings", stem: "melody", loop: soar, velocity: 0.15, enter: 36, exit: 44, pan: -0.08 },
    { voice: "flute", stem: "melody", loop: soar, velocity: 0.1, enter: 36, exit: 44, pan: 0.12 },
    { voice: "horn", stem: "harmony", loop: "F#4:4 E4:4 G#4:2 B4:2 B4:2 G#4:2 A4:4 C#5:2 A4:2 F#4:2 B4:2 A4:2 F#4:2", velocity: 0.11, enter: 36, exit: 44, pan: 0.3 },
    { voice: "strings", stem: "harmony", loop: seq(hold, sun), velocity: 0.045, enter: 36, exit: 44 },

    { voice: "flute", stem: "melody", loop: tune, velocity: 0.14, enter: 44, exit: 52, pan: -0.1 },
    { voice: "clarinet", stem: "melody", loop: tuneLow, velocity: 0.1, enter: 44, exit: 52, pan: 0.1 },
    { voice: "celesta", stem: "melody", loop: tune, velocity: 0.08, enter: 44, exit: 52, pan: 0.35 },
    { voice: "horn", stem: "harmony", loop: under, velocity: 0.1, enter: 44, exit: 52, pan: 0.3 },
    { voice: "strings", stem: "harmony", loop: seq(hold, verse), velocity: 0.045, enter: 44, exit: 52 },

    { voice: "flute", stem: "melody", loop: "B4:.5 E5:.5 G#5:1.5 F#5:.5 E5:1 -:12", velocity: 0.13, enter: 52, pan: -0.08 },
    { voice: "clarinet", stem: "melody", loop: "-:8 B3:.5 E4:.5 G#4:1.5 F#4:.5 E4:1 -:4", velocity: 0.12, enter: 52, pan: 0.1 },
    { voice: "celesta", stem: "harmony", loop: "-:12 G#5:.5 B5:.5 E6:3", velocity: 0.12, enter: 52, pan: 0.35 },
    { voice: "strings", stem: "harmony", loop: "G#3+B3+E4:4 A3+C#4+E4:4 A3+B3+E4:4 G#3+B3+E4:4", velocity: 0.035, enter: 52 },
  ],
};
