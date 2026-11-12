import type { LayeredTheme } from "./layered-themes";

const seq = (table: Record<string, string>, chords: string) => chords.split(" ").map((c) => table[c]).join(" ");

const home = "A Dmaj7 Bm7 E A/C# D Dm6 Aadd9",
  dance = "F#m D A E F#m D Bm7 E",
  away = "C G/B Am F Dm7 G Esus E7",
  body = `${home} ${home} ${dance} ${away} ${home}`,
  close = "A Dmaj7 A Dmaj7 A Dm6";

// One 6/8 bar of each chord: a rolling figure, a held chord, the bass, and the music box's high turn.
const roll = {
  A: "A2:1 E3:1 A3:1 C#4:1 E4:1 C#4:1",
  Dmaj7: "D3:1 A3:1 C#4:1 F#4:1 A4:1 F#4:1",
  Bm7: "B2:1 F#3:1 A3:1 D4:1 F#4:1 D4:1",
  E: "E2:1 B2:1 E3:1 G#3:1 B3:1 D4:1",
  "A/C#": "C#3:1 E3:1 A3:1 C#4:1 E4:1 C#4:1",
  D: "D3:1 A3:1 D4:1 F#4:1 A4:1 F#4:1",
  Dm6: "D3:1 A3:1 B3:1 F4:1 A4:1 F4:1",
  Aadd9: "A2:1 E3:1 B3:1 C#4:1 E4:1 C#4:1",
  "F#m": "F#2:1 C#3:1 F#3:1 A3:1 C#4:1 A3:1",
  C: "C3:1 G3:1 C4:1 E4:1 G4:1 E4:1",
  "G/B": "B2:1 G3:1 B3:1 D4:1 G4:1 D4:1",
  Am: "A2:1 E3:1 A3:1 C4:1 E4:1 C4:1",
  F: "F2:1 C3:1 F3:1 A3:1 C4:1 A3:1",
  Dm7: "D3:1 A3:1 C4:1 F4:1 A4:1 F4:1",
  G: "G2:1 D3:1 G3:1 B3:1 D4:1 B3:1",
  Esus: "E2:1 B2:1 E3:1 A3:1 B3:1 A3:1",
  E7: "E2:1 B2:1 D3:1 G#3:1 B3:1 D4:1",
};
const hold = {
  A: "E3+A3+C#4:6",
  Dmaj7: "F#3+A3+C#4:6",
  Bm7: "F#3+A3+D4:6",
  E: "G#3+B3+D4:6",
  "A/C#": "E3+A3+C#4:6",
  D: "F#3+A3+D4:6",
  Dm6: "F3+B3+D4:6",
  Aadd9: "E3+B3+C#4:6",
  "F#m": "F#3+A3+C#4:6",
  C: "E3+G3+C4:6",
  "G/B": "D3+G3+B3:6",
  Am: "E3+A3+C4:6",
  F: "F3+A3+C4:6",
  Dm7: "D3+F3+C4:6",
  G: "D3+G3+B3:6",
  Esus: "E3+A3+B3:6",
  E7: "E3+G#3+D4:6",
};
const low = {
  A: "A1:4 E2:2",
  Dmaj7: "D2:4 A2:2",
  Bm7: "B1:4 F#2:2",
  E: "E2:4 B1:2",
  "A/C#": "C#2:4 E2:2",
  D: "D2:4 F#2:2",
  Dm6: "D2:4 F2:2",
  Aadd9: "A1:4 E2:2",
  // Three even steps across the bar, against the two everyone else is rocking in.
  "F#m": "F#2:2 C#3:2 F#2:2",
  C: "C2:4 G2:2",
  "G/B": "B1:4 D2:2",
  Am: "A1:4 E2:2",
  F: "F2:4 C2:2",
  Dm7: "D2:4 A2:2",
  G: "G2:4 D2:2",
  Esus: "E2:4 B1:2",
  E7: "E2:6",
};
const box = {
  A: "E5:1 A5:1 B5:1 C#6:1 B5:1 A5:1",
  Dmaj7: "F#5:1 A5:1 C#6:1 E6:1 C#6:1 A5:1",
  Bm7: "F#5:1 A5:1 B5:1 D6:1 B5:1 A5:1",
  E: "E5:1 G#5:1 B5:1 D6:1 B5:1 G#5:1",
  "A/C#": "E5:1 A5:1 B5:1 C#6:1 B5:1 A5:1",
  D: "F#5:1 A5:1 D6:1 F#6:1 D6:1 A5:1",
  Dm6: "F5:1 A5:1 B5:1 D6:1 B5:1 A5:1",
  Aadd9: "E5:1 A5:1 B5:1 E6:1 B5:1 A5:1",
};
const turn = `${box.A} ${box.Aadd9}`;

const tune = "C#5:3 E5:2 A5:1 G#5:3 F#5:2 E5:1 F#5:2 D5:1 B4:2 D5:1 C#5:1 B4:5 C#5:3 E5:2 A5:1 B5:3 A5:2 F#5:1 F5:3 E5:2 D5:1";
const second = "A3:3 E4:3 F#4:3 A4:2 F#4:1 D4:3 F#4:3 G#4:2 A4:1 B4:1 G#4:1 E4:1 E4:3 A4:3 F#4:3 D4:3 D4:3 F4:2 A4:1 A4:1 G#4:1 F#4:1 E4:3";
const lilt = "C4:3:1 C4:2:.5 C4:1:.7";

/** The game's own theme, belonging to no place: the first piece of a morning, anywhere. */
export const mainTheme: LayeredTheme = {
  id: "every-life-there-is",
  title: "Every life there is",
  subtitle:
    "The main theme, in a rocking six. A music box turns over four notes; a clarinet sings a tune that leaps a sixth, falls, and on its last line borrows one dark chord from the minor; a plucked string answers in its rests. A flute takes it higher over a cello; a plucked dance in the relative minor steps three against the two; the key lifts a third for a horn; everyone comes home, and the music box is left turning.",
  place: "All of history",
  culture: [],
  years: [0, 0],
  anywhere: true,
  hours: [5, 10],
  evidence: "Original: a main theme in the manner of 16-bit role-playing scores. It reconstructs no tradition.",
  bpm: 152,
  meter: 6,
  beatUnit: 8,
  bars: 52,
  key: "A major, by way of F-sharp minor and C major",
  reverb: [0.3, 3],
  sections: [
    { bar: 0, label: "Music box" },
    { bar: 4, label: "Tune" },
    { bar: 12, label: "Tune, higher" },
    { bar: 20, label: "Dance" },
    { bar: 28, label: "Lift" },
    { bar: 36, label: "Home" },
    { bar: 44, label: "Music box" },
  ],
  layers: [
    { voice: "celesta", stem: "harmony", loop: turn, velocity: 0.16, exit: 6, pan: 0.3, fade: [1, 0.4] },
    { voice: "celesta", stem: "harmony", loop: seq(box, home), velocity: 0.1, enter: 36, exit: 44, pan: 0.4 },
    { voice: "celesta", stem: "harmony", loop: `${turn} ${turn} ${turn} E5:1 A5:1 B5:1 C#6:1 E6:2 -:6`, velocity: 0.16, enter: 44, pan: 0.3, fade: [1, 0.6] },

    { voice: "piano", stem: "harmony", loop: `${roll.A} ${roll.A} ${seq(roll, body)}`, velocity: 0.15, enter: 2, exit: 44, pan: -0.2 },
    { voice: "piano", stem: "harmony", loop: `${seq(roll, close)} A2:1 E3:1 B3:1 C#4:1 E4:2 -:6`, velocity: 0.12, enter: 44, pan: -0.2 },
    { voice: "bass", stem: "bass", loop: seq(low, body), velocity: 0.17, enter: 4, exit: 44 },
    { voice: "bass", stem: "bass", loop: "A1:6 D2:6 A1:6 D2:6 A1:6 D2:6 A1:12", velocity: 0.13, enter: 44 },

    { voice: "clarinet", stem: "melody", loop: `${tune} E5:1 C#5:5`, velocity: 0.23, enter: 4, exit: 12, pan: -0.08 },
    { voice: "pluck", stem: "harmony", loop: "-:20 E5:1 G#5:1 B5:1 E6:1 -:20 A5:1 E5:1 C#6:1 A5:1", velocity: 0.18, enter: 4, exit: 12, pan: 0.35 },

    {
      voice: "flute",
      stem: "melody",
      loop: "C#5:3 E5:2 A5:1 G#5:3 F#5:2 E5:1 F#5:1 E5:1 D5:1 B4:2 D5:1 C#5:1 B4:3 C#5:1 D5:1 E5:3 A5:2 C#6:1 B5:3 A5:2 F#5:1 F5:3 E5:2 D5:1 E5:1 C#5:2 E5:3",
      velocity: 0.17,
      enter: 12,
      exit: 20,
      pan: -0.08,
    },
    { voice: "cello", stem: "harmony", loop: second, velocity: 0.17, enter: 12, exit: 20, pan: 0.25 },
    { voice: "strings", stem: "harmony", loop: seq(hold, home), velocity: 0.045, enter: 12, exit: 20 },
    { voice: "brush", stem: "percussion", loop: lilt, velocity: 0.07, enter: 12, exit: 28, day: true },

    {
      voice: "clarinet",
      stem: "melody",
      loop: "F#5:2 A5:2 C#6:2 B5:3 A5:2 F#5:1 E5:2 A5:2 C#6:2 B5:3 G#5:2 E5:1 F#5:2 A5:2 C#6:2 D6:3 C#6:2 A5:1 B5:2 A5:2 F#5:2 G#5:3 E5:3",
      velocity: 0.19,
      enter: 20,
      exit: 28,
      pan: -0.08,
    },
    {
      voice: "pluck",
      stem: "harmony",
      loop: "F#4:2 A4:2 C#5:2 -:6 E4:2 A4:2 C#5:2 -:6 F#4:2 A4:2 C#5:2 -:6 B4:2 A4:2 F#4:2 -:2 E4:1 G#4:1 B4:1 E5:1",
      velocity: 0.2,
      enter: 20,
      exit: 28,
      pan: 0.35,
    },
    { voice: "wood", stem: "percussion", loop: "A#4:2:1 A#4:2:.6 A#4:2:.6", velocity: 0.07, enter: 20, exit: 28, pan: 0.4 },

    {
      voice: "horn",
      stem: "melody",
      loop: "E4:3 G4:3 D4:3 B3:2 D4:1 C4:3 E4:3 A4:3 G4:2 F4:1 F4:3 A4:3 G4:2 A4:1 B4:3 A4:3 B4:2 A4:1 G#4:5 -:1",
      velocity: 0.22,
      enter: 28,
      exit: 36,
      pan: -0.08,
    },
    { voice: "flute", stem: "harmony", loop: "F5:3 A5:3 G5:2 A5:1 B5:3 A5:3 B5:2 A5:1 G#5:5 -:1", velocity: 0.11, enter: 32, exit: 36, pan: 0.2 },
    { voice: "strings", stem: "harmony", loop: seq(hold, away), velocity: 0.08, enter: 28, exit: 36, fade: [0.6, 1] },
    { voice: "harp", stem: "harmony", loop: "E3:.5 G#3:.5 B3:.5 D4:.5 E4:.5 G#4:.5 B4:.5 D5:.5 E5:.5 G#5:.5 B5:.5 D6:.5", velocity: 0.15, enter: 35, exit: 36, pan: 0.3, fade: [0.5, 1.2] },

    { voice: "strings", stem: "melody", loop: `${tune} E5:1 C#5:1 A5:4`, velocity: 0.16, enter: 36, exit: 44, pan: -0.08 },
    { voice: "flute", stem: "melody", loop: `${tune} E5:1 C#5:1 A5:4`, velocity: 0.13, enter: 36, exit: 44, pan: 0.1 },
    { voice: "horn", stem: "harmony", loop: second, velocity: 0.13, enter: 36, exit: 44, pan: 0.25 },
    { voice: "strings", stem: "harmony", loop: seq(hold, home), velocity: 0.065, enter: 36, exit: 44 },
    { voice: "brush", stem: "percussion", loop: lilt, velocity: 0.08, enter: 36, exit: 44, day: true },
    { voice: "shaker", stem: "percussion", loop: "C4:1:1 C4:1:.4 C4:1:.6", velocity: 0.045, enter: 36, exit: 44, pan: 0.3, day: true },
    { voice: "kick", stem: "percussion", loop: "C2:6", velocity: 0.2, enter: 36, exit: 44, day: true },

    { voice: "clarinet", stem: "melody", loop: "-:12 C#4:3 E4:2 A4:1 G#4:3 F#4:2 E4:1 E4:6 F4:3 D4:3 C#4:6 -:6", velocity: 0.2, enter: 44, pan: -0.08 },
    { voice: "strings", stem: "harmony", loop: `${seq(hold, close)} E3+B3+C#4:12`, velocity: 0.05, enter: 44 },
  ],
};
