import type { LayeredTheme } from "./layered-themes";

const arrival = [
  "-:1 A4:1 D5:2 C5:1 A4:1",
  "G4:1 A4:1 C5:1 A4:2 G4:1",
  "F4:1 A4:1 D5:1 F5:2 E5:1",
  "D5:3 -:1 C5:1 A4:1",
  "G4:1 A4:1 C5:2 D5:1 C5:1",
  "A4:2 G4:1 F4:2 E4:1",
  "E4:1 F4:1 A4:1 C#5:2 E5:1",
  "D5:3 A4:1 -:2",
];
const unfolding = [
  "A4:1 D5:2 F5:1 E5:1 D5:1",
  "C5:1 A4:1 G4:1 A4:2 C5:1",
  "D5:1 F5:1 A5:2 G5:1 F5:1",
  "E5:1 D5:2 -:1 C5:1 A4:1",
  "G4:1 A4:1 C5:1 D5:1 E5:1 D5:1",
  "C5:2 A4:1 G4:1 F4:1 E4:1",
  "F4:1 E4:1 A4:1 C#5:1 E5:1 C#5:1",
  "D5:4 -:2",
];
const beyond = [
  "C5:1 F5:2 A5:1 G5:1 F5:1",
  "E5:2 D5:1 C5:2 G4:1",
  "A4:1 D5:2 F5:1 E5:1 D5:1",
  "C5:3 -:1 A4:1 C5:1",
  "D5:1 F5:1 A5:1 G5:2 F5:1",
  "E5:1 G5:1 A5:1 C6:2 A5:1",
  "G5:1 F5:1 E5:1 D5:2 C5:1",
  "C#5:2 E5:1 A4:2 -:1",
];
const homeward = [
  "A4:1 D5:2 C5:1 A4:1 F4:1",
  "G4:1 A4:1 C5:1 A4:2 G4:1",
  "F4:1 A4:1 D5:1 F5:2 E5:1",
  "D5:3 -:1 C5:1 A4:1",
  "G4:1 A4:1 C5:2 D5:1 F5:1",
  "E5:1 D5:1 C5:1 A4:2 G4:1",
  "F4:2 E4:1 C#4:2 E4:1",
  "D4:4 -:2",
];
const ground = [
  "D3 F3 A3 E4",
  "C3 G3 A3 E4",
  "A2 F3 A3 D4",
  "D3 F3 A3 C4",
  "G2 G3 C4 E4",
  "F2 F3 A3 C4",
  "A2 E3 A3 C#4",
  "D3 F3 A3 D4",
];
const horizon = [
  "F2 A3 C4 F4",
  "E2 G3 C4 E4",
  "D3 A3 D4 F4",
  "C3 G3 A3 E4",
  "A#2 F3 A#3 D4",
  "A2 A3 C4 F4",
  "G2 G3 A#3 D4",
  "A2 E3 A3 C#4",
];
const chords = [...ground, ...ground, ...horizon, ...ground];

export const andeanThemes: LayeredTheme[] = [
  {
    id: "cusco-apricot-dusk",
    title: "Apricot dusk in Cusco",
    subtitle:
      "A flute above garden walls; lilting harp and guitar, a brighter horizon, then the quiet walk home. A Stardew Valley / FF6-inspired candidate.",
    place: "Cusco, colonial Andes, c. 1680 · new candidate",
    culture: "andean",
    years: [1600, 1749],
    evidence:
      "Documented basis: colonial Peru adopted harp and guitar; seventeenth-century Cusco preserves a villancico tradition. The flute stands for a quena using the game's synth. This imagined secular ensemble, 6/8 with cadential hemiola, pentatonic-shaped tune and RPG harmony are fiction, not a reconstruction or a borrowed game melody. Sources: Library of Congress, Indigenous Peoples of the Andes; TCU, Five Christmas villancicos from Cusco (https://repository.tcu.edu/handle/116099117/10234).",
    bpm: 192,
    meter: 6,
    bars: 32,
    key: "D minor / F major",
    reverb: [0.24, 1.8],
    layers: [
      {
        voice: "flute",
        stem: "melody",
        loop: [...arrival, ...unfolding, ...beyond, ...homeward].join(" "),
        velocity: 0.34,
        pan: -0.1,
      },
      {
        voice: "harp",
        stem: "harmony",
        loop: chords
          .map((chord, bar) => {
            const tones = chord.split(" ");
            return (
              (bar === 31 ? [0, 2, 1, 3] : [0, 2, 1, 3, 2, 1])
                .map(
                  (tone, beat) =>
                    `${tones[tone]}:1:${beat % 3 === 0 ? 1 : 0.7}`,
                )
                .join(" ") + (bar === 31 ? " -:2" : "")
            );
          })
          .join(" "),
        velocity: 0.15,
        pan: -0.32,
      },
      {
        voice: "guitar",
        stem: "harmony",
        loop: chords
          .map((chord, bar) => {
            const voicing = chord.split(" ").slice(1, 3).join("+");
            if (bar === 31) return `${voicing}:2 -:4`;
            // Three duple accents at cadences cross the two dotted-quarter pulses.
            return bar % 8 === 6 || bar % 8 === 7
              ? `${voicing}:1 -:1 ${voicing}:1:.8 -:1 ${voicing}:1:.7 -:1`
              : `${voicing}:1 -:2 ${voicing}:1:.75 -:2`;
          })
          .join(" "),
        velocity: 0.1,
        pan: 0.3,
      },
      {
        voice: "harp",
        stem: "bass",
        loop: chords
          .map((chord, bar) => {
            const [root, , upper] = chord.split(" ");
            return bar === 31 ? `${root}:4 -:2` : `${root}:3 ${upper}:3:.55`;
          })
          .join(" "),
        velocity: 0.26,
        transpose: -12,
      },
      {
        voice: "strings",
        stem: "harmony",
        loop: horizon
          .map((chord) => `${chord.split(" ").slice(1).join("+")}:6`)
          .join(" "),
        velocity: 0.065,
        enter: 16,
        exit: 24,
        pan: 0.2,
        fade: [0.75, 1],
      },
      {
        voice: "harp",
        stem: "harmony",
        loop: [
          "-:3 A4:1 F4:1 E4:1",
          "-:3 E4:1 G4:1 A4:1",
          "-:3 A4:1 F4:1 E4:1",
          "F4:2 A4:1 -:3",
          "E4:2 G4:1 -:3",
          "A4:1 G4:1 F4:1 -:3",
          "-:3 E4:1 A4:1 C#5:1",
          "A4:2 F4:1 -:3",
        ].join(" "),
        velocity: 0.12,
        enter: 8,
        exit: 16,
        pan: 0.36,
      },
      {
        voice: "strings",
        stem: "harmony",
        loop: [
          "F4:3 E4:3",
          "E4:2 G4:1 E4:3",
          "A4:3 F4:3",
          "F4:3 A4:3",
          "E4:3 G4:3",
          "A4:3 C5:3",
          "A4:2 G4:1 E4:3",
          "F4:4 -:2",
        ].join(" "),
        velocity: 0.095,
        enter: 24,
        exit: 32,
        pan: 0.22,
        fade: [1, 0.55],
      },
      {
        voice: "frame",
        stem: "percussion",
        loop: "D3:1:.8 -:2 A3:1:.5 -:2",
        velocity: 0.09,
        enter: 8,
        exit: 30,
        day: true,
      },
      {
        voice: "shaker",
        stem: "percussion",
        loop: "C4:1:1 C4:1:.45 C4:1:.6 C4:1:.8 C4:1:.45 C4:1:.6",
        velocity: 0.035,
        enter: 16,
        exit: 24,
        pan: -0.4,
        day: true,
      },
    ],
  },
];
