import type { LayeredTheme } from "./layered-themes";

const changes = [
  [
    "D2 F3 A3 C4 E4",
    "Bb1 F3 A3 D4",
    "G2 F3 A3 Bb3 D4",
    "A1 G3 A3 C#4 E4",
    "D2 F3 A3 C4 E4",
    "F2 A3 C4 E4",
    "G2 F3 Bb3 D4",
    "A1 G3 C#4 E4",
  ],
  [
    "D2 F3 A3 C4 E4",
    "Bb1 F3 A3 D4",
    "G2 F3 Bb3 D4",
    "A1 G3 C#4 E4",
    "D2 F3 A3 C4 E4",
    "F2 A3 C4 E4",
    "Bb1 A3 C4 D4 F4",
    "A1 G3 C#4 E4",
  ],
  [
    "D2 F3 A3 C4 E4",
    "F2 A3 C4 E4",
    "G2 F3 Bb3 D4",
    "A1 G3 C#4 E4",
    "Bb1 F3 A3 D4",
    "F2 A3 C4 E4",
    "G2 F3 Bb3 D4",
    "A1 G3 C#4 E4",
  ],
  [
    "F2 A3 C4 E4 G4",
    "E2 G3 C4 E4",
    "D2 F3 A3 C4 E4",
    "Bb1 F3 A3 D4",
    "G2 F3 Bb3 D4",
    "C2 G3 Bb3 E4",
    "D2 F3 A3 C4",
    "F2 A3 C4 E4",
  ],
  [
    "D2 F3 A3 C4 E4",
    "F2 A3 C4 E4",
    "Bb1 F3 A3 D4",
    "G2 F3 Bb3 D4",
    "C2 G3 C4 E4",
    "A1 G3 C4 E4",
    "Bb1 F3 A3 D4",
    "A1 G3 C#4 E4",
  ],
  [
    "D2 F3 A3 C4 E4",
    "F2 A3 C4 E4",
    "Bb1 F3 A3 D4",
    "A1 G3 C#4 E4",
    "F2 A3 C4 E4 G4",
    "C2 G3 Bb3 E4",
    "Bb1 F3 A3 D4",
    "A1 G3 C#4 E4",
  ],
  [
    "D2 F3 A3 C4 E4",
    "F2 A3 C4 E4",
    "Bb1 F3 A3 D4",
    "G2 F3 Bb3 D4",
    "F2 A3 C4 E4",
    "C2 G3 C4 E4",
    "D2 F3 A3 C4 E4",
    "D2 F3 A3 D4",
  ],
];

export const overworldTheme: LayeredTheme = {
  id: "where-the-horizon-leads",
  title: "Where the horizon leads",
  subtitle:
    "A long, gentle overworld journey: flowing harp, warm string harmonies, distant flute replies and a sunlit return.",
  place: "Every world · shared roaming theme",
  culture: [],
  years: [0, 0],
  anywhere: true,
  evidence:
    "An original orchestral game score inspired by the lyrical, wistful atmosphere of 1990s role-playing overworld music, including Final Fantasy VI. No existing melody, recording or sample is used. Its orchestra is a shared narrative voice for wandering through history, not a reconstruction of any setting's local music.",
  bpm: 88,
  meter: 4,
  bars: 112,
  key: "D minor / F major, added ninths and suspended light",
  reverb: [0.27, 2.8],
  sections: [
    { bar: 0, label: "A world waking" },
    { bar: 16, label: "Where the horizon leads" },
    { bar: 32, label: "Rivers and remembered roads" },
    { bar: 48, label: "The sunlit distance" },
    { bar: 64, label: "A quiet clearing" },
    { bar: 80, label: "The horizon opens" },
    { bar: 96, label: "Still farther to go" },
  ],
  layers: [
    ...changes.flatMap((section, i) => [
      {
        voice: "strings" as const,
        stem: "harmony" as const,
        loop: section
          .map((chord) => `${chord.split(" ").slice(1).join("+")}:8`)
          .join(" "),
        velocity: [0.045, 0.062, 0.055, 0.072, 0.035, 0.075, 0.045][i]!,
        enter: i * 16,
        exit: (i + 1) * 16,
        pan: -0.28,
        fade: i === 6 ? ([1, 0.5] as [number, number]) : undefined,
      },
      {
        voice: "harp" as const,
        stem: "harmony" as const,
        loop: section
          .map((chord) => {
            const notes = chord.split(" ").slice(1);
            if (notes.length === 3) notes.push(notes[0]!.replace("3", "4"));
            return i === 0 || i === 4 || i === 6
              ? [0, 1, 2, 3, 2, 1, 2, 1].map((n) => `${notes[n]}:1`).join(" ")
              : [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 1, 2, 1]
                  .map((n) => `${notes[n]}:.5`)
                  .join(" ");
          })
          .join(" "),
        velocity: [0.16, 0.15, 0.14, 0.17, 0.09, 0.17, 0.13][i]!,
        enter: i * 16,
        exit: (i + 1) * 16,
        pan: 0.3,
        fade: i === 6 ? ([1, 0.45] as [number, number]) : undefined,
      },
      {
        voice: "bass" as const,
        stem: "bass" as const,
        loop: section
          .map((chord) => {
            const root = chord.split(" ")[0];
            return `${root}:3.5 -:.5 ${root}:3 -:1`;
          })
          .join(" "),
        velocity: i === 4 ? 0.11 : 0.18,
        enter: i * 16,
        exit: (i + 1) * 16,
        fade: i === 6 ? ([1, 0.5] as [number, number]) : undefined,
      },
    ]),
    {
      voice: "horn",
      stem: "harmony",
      loop: "A3+C4:6 -:2 G3+C4:6 -:2 A3+C4:6 -:2 F3+A3:6 -:2 Bb3+D4:6 -:2 G3+C4:6 -:2 A3+C4:6 -:2 A3+C4:6 -:2",
      velocity: 0.055,
      enter: 48,
      exit: 64,
      pan: -0.4,
    },
    {
      voice: "flute",
      stem: "harmony",
      loop: "-:2 A4:1 C5:1 D5:2 -:2 -:2 C5:1 A4:1 G4:2 -:2 -:2 Bb4:1 D5:1 F5:2 -:2 -:2 E5:1 D5:1 C#5:2 -:2",
      velocity: 0.11,
      enter: 16,
      exit: 32,
      pan: 0.35,
    },
    {
      voice: "flute",
      stem: "harmony",
      loop: "-:2 A4:1 C5:1 D5:2 -:2 -:2 C5:1 E5:1 F5:2 -:2 -:2 D5:1 F5:1 Bb5:2 -:2 -:2 E5:1 G5:1 A5:2 -:2 -:2 C5:1 E5:1 G5:2 -:2 -:2 E5:1 G5:1 Bb5:2 -:2 -:2 D5:1 F5:1 A5:2 -:2 -:2 C#5:1 E5:1 D5:2 -:2",
      velocity: 0.1,
      enter: 80,
      exit: 96,
      pan: 0.35,
    },
    {
      voice: "brush",
      stem: "percussion",
      loop: "D3:1 -:1 D3:.5:.45 -:.5 D3:.5:.6 -:.5",
      velocity: 0.065,
      enter: 16,
      exit: 64,
      day: true,
    },
    {
      voice: "brush",
      stem: "percussion",
      loop: "D3:1 -:1 D3:.5:.45 -:.5 D3:.5:.6 -:.5",
      velocity: 0.07,
      enter: 80,
      exit: 96,
      day: true,
    },
    {
      voice: "bell",
      stem: "harmony",
      loop: "A5:2 -:6 E5:2 -:6 A5:2 -:6 D5:2 -:6",
      velocity: 0.065,
      enter: 96,
      exit: 112,
      pan: 0.4,
      fade: [1, 0.3],
    },
  ],
};
