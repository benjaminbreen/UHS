import type { LayeredTheme } from "./layered-themes";

const chords: Record<string, [string, string, string]> = {
  G: ["G2", "D3", "G3 D4 G4 B4"],
  D: ["D2", "A2", "D3 A3 D4 F#4"],
  Em: ["E2", "B2", "E3 B3 E4 G4"],
  C: ["C3", "G2", "C3 G3 C4 E4"],
  Bm: ["B2", "F#2", "B2 F#3 B3 D4"],
  Am: ["A2", "E2", "A2 E3 A3 C4"],
};
const verse = "G D Em C G C D G";
const bridge = "C D Bm Em C Am D D";
const changes = `G C D G ${verse} ${verse} ${bridge} ${verse} ${verse} ${bridge} ${verse} G D Am G`.split(" ");

const tuneA = [
  "D5:.75 B4:.25 G4:.5 B4:.5 D5:1 G5:1",
  "F#5:.5 E5:.5 D5:.5 E5:.5 F#5:1 A5:1",
  "G5:.75 F#5:.25 E5:.5 D5:.5 B4:1 E5:1",
  "C5:.5 D5:.5 E5:.5 G5:.5 E5:2",
  "D5:.75 B4:.25 G4:.5 B4:.5 D5:1 G5:.5 A5:.5",
  "B5:.5 A5:.5 G5:.5 E5:.5 G5:1 E5:1",
].join(" ");
const verseOpen = `${tuneA} D5:.5 E5:.5 F#5:.5 G5:.5 A5:1 F#5:1 G5:3 -:1`;
const verseClose = `${tuneA} E5:.5 F#5:.5 G5:.5 A5:.5 B5:1 A5:.5 F#5:.5 G5:2 -:2`;
const tuneB = [
  "E5:1 G5:.5 E5:.5 C5:1 E5:1",
  "F#5:1 A5:.5 F#5:.5 D5:1 F#5:1",
  "B5:.75 A5:.25 F#5:.5 D5:.5 B4:1 D5:1",
  "E5:2 G5:1 B5:1",
  "C6:.75 B5:.25 A5:.5 G5:.5 E5:1 G5:1",
  "A5:.5 G5:.5 E5:.5 C5:.5 E5:1 A5:1",
  "F#5:.5 G5:.5 A5:.5 B5:.5 A5:1 F#5:.5 E5:.5",
  "D5:2 -:1 D5:.5 E5:.5",
].join(" ");

export const europeanThemes: LayeredTheme[] = [
  {
    id: "bruges-carillon",
    title: "Market morning in Bruges",
    subtitle:
      "Recorder and lute over a bouncing bass while the belfry marks the hour: a tune to whistle crossing the Markt.",
    place: "Bruges, c. 1550",
    culture: "european",
    years: [1450, 2026],
    evidence:
      "Documented: Low Countries belfries sounded tunes on tuned bells from the 15th century, and recorders, lutes and dance tunes were everyday town music in 16th-century Flanders (Susato's dance books, Antwerp, 1551). The tune and arrangement are original.",
    bpm: 112,
    meter: 4,
    bars: 64,
    key: "G major",
    swing: [0.5, 0.06],
    reverb: [0.2, 1.6],
    sections: [
      { bar: 0, label: "Hour bell" },
      { bar: 4, label: "Tune" },
      { bar: 20, label: "Across the square" },
      { bar: 36, label: "Lute" },
      { bar: 44, label: "Together" },
      { bar: 60, label: "Home" },
    ],
    layers: [
      {
        voice: "carillon",
        stem: "percussion",
        loop: "G4:4 D4:4 G3:8",
        velocity: 0.07,
        exit: 4,
      },
      {
        voice: "bass",
        stem: "bass",
        loop: changes
          .map((c) => {
            const [root, fifth] = chords[c];
            return `${root}:1 ${fifth}:1 ${root}:1 ${fifth}:.5 ${root}:.5`;
          })
          .join(" "),
        velocity: 0.2,
      },
      {
        voice: "harp",
        stem: "harmony",
        loop: changes
          .map((c) => {
            const [a, b, d, e] = chords[c][2].split(" ");
            return [a, b, d, e, d, b, d, b].map((n) => `${n}:.5`).join(" ");
          })
          .join(" "),
        velocity: 0.1,
        pan: 0.25,
      },
      {
        voice: "flute",
        stem: "melody",
        loop: [
          "-:16",
          verseOpen,
          verseClose,
          tuneB,
          verseClose,
          "-:32",
          tuneB,
          verseClose,
          "B4:1 D5:1 G5:2 A5:1 F#5:1 D5:2 E5:1 C5:1 A4:1 F#4:1 G4:4",
        ].join(" "),
        velocity: 0.24,
        pan: -0.1,
      },
      {
        voice: "pluck",
        stem: "melody",
        loop: verseOpen,
        velocity: 0.2,
        enter: 36,
        exit: 44,
        transpose: -12,
        pan: -0.2,
      },
      {
        voice: "chime",
        stem: "harmony",
        loop: `${tuneB} ${verseClose}`,
        velocity: 0.05,
        enter: 44,
        exit: 60,
        pan: 0.3,
      },
      {
        voice: "wood",
        stem: "percussion",
        loop: "-:1 C5:1:.8 -:1 C5:.5 C5:.5:.6",
        velocity: 0.07,
        enter: 4,
        exit: 60,
        day: true,
        pan: 0.3,
      },
      {
        voice: "shaker",
        stem: "percussion",
        loop: "C5:.5:1 C5:.5:.5",
        velocity: 0.04,
        enter: 20,
        exit: 60,
        day: true,
        pan: -0.3,
      },
      {
        voice: "carillon",
        stem: "percussion",
        loop: "G4:4 G3:4",
        velocity: 0.06,
        enter: 62,
      },
    ],
  },
];
