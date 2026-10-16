import type { LayeredTheme } from "./layered-themes";

const seq = (notes: string, span: number) =>
  notes
    .split(" ")
    .map((n) => `${n}:${span}`)
    .join(" ");
// Jhala: each melody note struck twice against the high Sa, four to a beat.
const jhala = (notes: string) =>
  notes
    .split(" ")
    .map((n) => `${n}:.25 C5:.25:.6 ${n}:.25:.8 C5:.25:.6`)
    .join(" ");

const alap = [
  "C4:6 -:1 B3:1 ~Db4:4 C4:3 -:1",
  "B3:2 Ab3:2 ~Db4:1 C4:5 E4:2 F4:2 -:2",
  "E4:3 F4:1 ~Ab4:4 G4:3 F4:1 E4:2 -:2",
  "F4:1 Ab4:1 B4:2 C5:6 B4:1 Db5:1 C5:2 -:2",
  "Ab4:3 G4:2 F4:1 E4:2 F4:1 E4:1 Db4:4 -:2",
  "Db4:1 E4:1 ~F4:2 E4:1 Db4:1 C4:8 -:2",
];
const sthayi = [
  "G4:2 Ab4:1 G4:1 F4:1 E4:1 F4:2 ~Ab4:3 G4:1 F4:1 E4:1 Db4:2",
  "E4:1 F4:1 G4:1 Ab4:1 B4:2 C5:2 Db5:1 C5:1 B4:1 Ab4:1 G4:4",
  "Ab4:1 B4:1 C5:2 B4:1 Ab4:1 G4:2 F4:1 Ab4:1 G4:1 F4:1 E4:2 F4:2",
  "E4:2 Db4:1 E4:1 F4:1 E4:1 Db4:1 B3:1 ~Db4:2 C4:4 -:2",
];
const sthayiOrnamented = [
  "G4:1 Ab4:.5 G4:.5 F4:1 E4:1 F4:1 G4:1 Ab4:2 B4:1 Ab4:1 G4:1 F4:1 E4:1 F4:.5 E4:.5 Db4:2",
  "E4:.5 F4:.5 G4:.5 Ab4:.5 B4:1 C5:1 Db5:2 E5:1 Db5:1 C5:1 B4:1 Ab4:1 B4:1 G4:3 -:1",
  "C5:1 B4:1 Ab4:1 B4:1 C5:2 Db5:1 C5:1 B4:.5 C5:.5 B4:.5 Ab4:.5 G4:2 F4:1 E4:1 F4:1 Ab4:1",
  "G4:2 F4:1 E4:1 Db4:1 E4:.5 F4:.5 E4:1 Db4:1 B3:1 Ab3:1 B3:1 ~Db4:1 C4:3 -:1",
];
const antara = [
  "F4:1 Ab4:1 B4:1 C5:1 C5:2 Db5:1 C5:1 B4:1 C5:1 Db5:1 E5:1 F5:2 E5:2",
  "E5:1 F5:1 ~Ab5:2 G5:1 F5:1 E5:2 F5:1 E5:1 Db5:1 C5:1 ~Db5:2 C5:2",
  "C5:1 Db5:1 E5:1 F5:1 E5:1 Db5:1 C5:1 B4:1 ~Ab4:2 B4:1 Ab4:1 G4:2 -:2",
  "Ab4:1 G4:1 F4:1 E4:1 F4:1 Ab4:1 G4:1 F4:1 E4:2 Db4:2 C4:2 -:2",
];
const tihai = (phrase: string, gap: number) =>
  [phrase, `-:${gap}`, phrase, `-:${gap}`, phrase].join(" ");
const calls = [
  "G4:.5 Ab4:.5 B4:.5 C5:.5 Db5:1 C5:1 B4:.5 Ab4:.5 G4:1 F4:.5 E4:.5 F4:1",
  "E4:.5 F4:.5 Ab4:.5 B4:.5 C5:1 Db5:.5 E5:.5 F5:1 E5:.5 Db5:.5 C5:2",
  "Ab4:1 B4:1 C5:.5 Db5:.5 C5:.5 B4:.5 Ab4:1 G4:1 F4:.5 G4:.5 Ab4:1",
  "C5:.5 Db5:.5 E5:.5 F5:.5 G5:1 F5:1 E5:.5 F5:.5 E5:.5 Db5:.5 C5:2",
];
const answers = [
  "F4:.5 E4:.5 F4:.5 Ab4:.5 G4:1 F4:1 E4:.5 F4:.5 E4:.5 Db4:.5 C4:2",
  "C5:.5 B4:.5 Ab4:.5 G4:.5 F4:1 Ab4:1 G4:.5 F4:.5 E4:.5 F4:.5 G4:2",
  "G4:.5 F4:.5 E4:.5 F4:.5 G4:1 E4:1 Db4:.5 E4:.5 Db4:.5 B3:.5 C4:2",
  "Db5:.5 C5:.5 B4:.5 Ab4:.5 G4:1 B4:1 Ab4:.5 G4:.5 F4:.5 E4:.5 F4:2",
];
const unison = [
  "C4:.5 Db4:.5 E4:.5 F4:.5 G4:.5 Ab4:.5 B4:.5 C5:.5 Db5:1 C5:1 B4:1 C5:1 Ab4:.5 B4:.5 G4:1 Ab4:.5 G4:.5 F4:1 E4:1 F4:3",
  "G4:1 Ab4:.5 G4:.5 F4:.5 E4:.5 F4:1 Ab4:.5 B4:.5 C5:1 Db5:.5 C5:.5 B4:.5 Ab4:.5 G4:2 F4:.5 E4:.5 Db4:.5 E4:.5 F4:1 E4:2 Db4:1",
  "C4:1 E4:1 F4:1 Ab4:1 B4:1 C5:1 Db5:1 C5:1 B4:.5 C5:.5 Ab4:.5 B4:.5 G4:.5 Ab4:.5 F4:.5 G4:.5 E4:1 F4:1 Db4:2",
  tihai("E4:.5 F4:.5 G4:.5 Ab4:.5 B4:1 Db5:.5 B4:.5 C5:1", 0.5),
];
const drutGat = [
  "C5:.5 G4:.5 Ab4:.5 G4:.5 F4:.5 G4:.5 E4:.5 F4:.5 Db4:.5 E4:.5 C4:1 E4:.5 F4:.5 G4:.5 Ab4:.5 B4:.5 C5:.5 Db5:.5 C5:.5 B4:1 Ab4:.5 G4:.5 F4:1 E4:1 F4:1 G4:1",
  "Ab4:.5 B4:.5 C5:1 Db5:.5 C5:.5 B4:.5 Ab4:.5 G4:1 Ab4:.5 G4:.5 F4:.5 E4:.5 F4:1 Ab4:1 G4:.5 F4:.5 E4:.5 Db4:.5 C4:2 B3:.5 Db4:.5 C4:2",
];
const taan = [
  `${seq("C4 Db4 E4 F4 G4 Ab4 B4 C5 Db5 C5 B4 Ab4 G4 F4 E4 Db4", 0.25)} ${seq("E4 F4 G4 Ab4 B4 C5 Db5 E5 F5 E5 Db5 C5 B4 Ab4 G4 F4", 0.25)} E4:1 F4:1 Ab4:1 G4:1 F4:.5 E4:.5 Db4:1 C4:2`,
  `${seq("C5 Db5 E5 F5 G5 Ab5 G5 F5 E5 F5 G5 Ab5 B5 C6 B5 Ab5", 0.25)} ${seq("G5 F5 E5 Db5 C5 B4 Ab4 G4", 0.5)} Ab4:1 B4:1 C5:2 Db5:1 C5:1 B4:1 C5:1`,
];
const jhalaBars = [
  jhala("E5 E5 F5 F5 G5 G5 Ab5 G5 F5 F5 E5 E5 Db5 Db5 C5 C5"),
  jhala("G4 Ab4 B4 B4 Db5 Db5 C5 C5 Ab4 G4 F4 F4 E4 Db4 B3 C4"),
];
const drut = [
  drutGat[0], drutGat[1], drutGat[0], drutGat[1],
  taan[0], drutGat[1],
  jhalaBars[0], jhalaBars[1], jhalaBars[0], jhalaBars[1],
  taan[1], drutGat[0], drutGat[1],
  "C5:1 Db5:1 C5:1 B4:1 C5:4 Ab4:1 B4:1 C5:1 Db5:1 E5:2 Db5:1 C5:1",
];
const finale = [
  tihai(`${seq("Ab4 B4 C5 Db5 C5 B4 Ab4 G4", 0.5)} F4:1 E4:1 Db4:1 B3:1 C4:2`, 1),
  "C5:10 B4:1 Db5:1 C5:4",
  "Ab4:2 G4:2 F4:1 E4:1 ~Db4:2 C4:8",
];

export const southAsianThemes: LayeredTheme[] = [
  {
    id: "sikri-naubat",
    title: "Naubat at Fatehpur Sikri",
    subtitle:
      "The gate-house wakes in raga Bhairav: a slow shehnai alap, the long trumpets, then kettledrums driving the tune from stately to blazing.",
    place: "Mughal Fatehpur Sikri, c. 1580",
    culture: "south-asian",
    years: [1500, 2026],
    evidence:
      "Documented: the Ain-i-Akbari describes Akbar's naqqarkhana of kettledrum pairs, karna trumpets, surna and cymbals, playing at set hours, beginning before dawn; shehnai and naqqara naubat with a drone shehnai continue at shrines today. Raga Bhairav, the alap-gat-jhala form and the sixteen-beat cycle are inference from later Hindustani practice; the melody is fiction.",
    bpm: 150,
    meter: 16,
    bars: 52,
    key: "C Bhairav",
    // Just intonation, with Bhairav's low komal re and dha.
    tuning: { 1: -22, 4: -14, 5: -2, 7: 2, 8: -14, 11: -12 },
    reverb: [0.3, 2.6],
    sections: [
      { bar: 0, label: "Alap" },
      { bar: 6, label: "Karna" },
      { bar: 8, label: "Gat" },
      { bar: 24, label: "Question and answer" },
      { bar: 32, label: "Drut" },
      { bar: 38, label: "Jhala" },
      { bar: 46, label: "Tihai" },
    ],
    layers: [
      {
        voice: "tanpura",
        stem: "harmony",
        loop: "G3:4 C4:4 C4:4 C3:4",
        velocity: 0.08,
        pan: 0.15,
      },
      {
        voice: "reed",
        stem: "harmony",
        loop: "C4:16",
        velocity: 0.05,
        enter: 8,
        exit: 50,
        pan: 0.3,
        fade: [0.6, 1.2],
      },
      {
        voice: "reed",
        stem: "melody",
        loop: [
          ...alap,
          "-:32",
          ...sthayi,
          ...sthayiOrnamented,
          ...antara,
          sthayi[0],
          sthayi[1],
          sthayi[2],
          tihai("Ab4:.5 G4:.5 F4:.5 E4:.5 Db4:1 C4:2", 0.5),
          ...calls.map((c) => `${c} -:8`),
          ...unison,
          ...drut,
          ...finale,
        ].join(" "),
        velocity: 0.28,
        exit: 50,
        pan: -0.15,
      },
      {
        voice: "reed",
        stem: "melody",
        loop: answers.map((a) => `-:8 ${a}`).join(" "),
        velocity: 0.22,
        enter: 24,
        exit: 28,
        pan: 0.35,
      },
      {
        voice: "reed",
        stem: "melody",
        loop: unison.join(" "),
        velocity: 0.16,
        enter: 28,
        exit: 32,
        pan: 0.35,
        transpose: -12,
      },
      {
        voice: "reed",
        stem: "melody",
        loop: drut.slice(8).join(" "),
        velocity: 0.15,
        enter: 40,
        exit: 46,
        pan: 0.35,
        transpose: -12,
      },
      {
        voice: "horn",
        stem: "harmony",
        loop: "C3:6 -:2 G3:6 -:2 C3:4 C3:2 G3:2 C4:6 -:2",
        velocity: 0.22,
        enter: 6,
        exit: 8,
        pan: -0.3,
      },
      {
        voice: "horn",
        stem: "bass",
        loop: "C2:14 -:2 C2:14 -:2",
        velocity: 0.18,
        enter: 6,
        exit: 8,
        pan: 0.3,
      },
      {
        voice: "horn",
        stem: "harmony",
        loop: "C3:4 -:60",
        velocity: 0.16,
        enter: 8,
        exit: 24,
        day: true,
        pan: -0.3,
      },
      {
        voice: "horn",
        stem: "harmony",
        loop: "C3:2 G3:2 -:28",
        velocity: 0.17,
        enter: 24,
        exit: 36,
        day: true,
        pan: -0.3,
      },
      {
        voice: "horn",
        stem: "harmony",
        loop: "C3:2 G3:2 C4:4 -:24",
        velocity: 0.19,
        enter: 36,
        exit: 46,
        day: true,
        pan: -0.3,
      },
      {
        voice: "horn",
        stem: "harmony",
        loop: "C3:6 G3:6 C4:12 -:8",
        velocity: 0.24,
        enter: 48,
        exit: 50,
        pan: -0.3,
      },
      {
        voice: "horn",
        stem: "bass",
        loop: "C2:28 -:4",
        velocity: 0.2,
        enter: 48,
        exit: 50,
        pan: 0.3,
      },
      {
        voice: "frame",
        stem: "bass",
        loop: "C2:2 -:2 C2:2 -:1 C2:1 C2:1 -:1 C2:1 C2:1 C2:.5 C2:.5 C2:.5 C2:.5 C2:.5 C2:.5 C2:.5 C2:.5 C2:.5:.6 C2:.5:.7 C2:.5:.8 C2:.5:.9 C2:.5 C2:.5:1.1 C2:.5:1.2 C2:.5:1.3 C2:4:1.5 -:8",
        velocity: 0.3,
        enter: 6,
        exit: 8,
      },
      {
        voice: "mridanga",
        stem: "percussion",
        loop: `-:16 ${seq("G3 G3 G3 G3 G3 G3 G3 G3 G3 G3 G3 G3 G3 G3 G3 G3", 0.25)} ${seq("G3 G3 G3 G3 G3 G3 G3 G3", 0.5)} G3:1:1.3 -:7`,
        velocity: 0.14,
        enter: 6,
        exit: 8,
        pan: -0.25,
      },
      {
        // Tintal: the bass drum drops out for the khali, the "empty" third quarter.
        voice: "frame",
        stem: "bass",
        loop: "C2:1:1.4 C2:1:.7 C2:1:.7 C2:1 C2:1 C2:1:.7 C2:1:.7 C2:1 -:5 C2:1:.7 C2:1:.7 C2:1",
        velocity: 0.3,
        enter: 8,
        exit: 24,
      },
      {
        voice: "mridanga",
        stem: "percussion",
        loop: "G3:1:1.1 G3:.5:.5 G3:.5:.6 G3:1:.8 G3:.5:.5 G3:.5:.6",
        velocity: 0.12,
        enter: 8,
        exit: 24,
        pan: -0.25,
      },
      {
        voice: "frame",
        stem: "bass",
        loop: "C2:1:1.5 C2:.5:.7 C2:.5:.7 C2:1 C2:1:.8 C2:1:1.2 C2:.5:.7 C2:.5:.7 C2:1 -:5 C2:1:.8 C2:1:.8 C2:1:1.1 C2:1:1.2",
        velocity: 0.32,
        enter: 24,
        exit: 46,
      },
      {
        voice: "mridanga",
        stem: "percussion",
        loop: "G3:.5:1.1 G3:.25:.5 G3:.25:.6 G3:.5:.8 G3:.5:.6",
        velocity: 0.12,
        enter: 24,
        exit: 32,
        pan: -0.25,
      },
      {
        voice: "mridanga",
        stem: "percussion",
        loop: "G3:.25:1.3 G3:.25:.5 G3:.25:.8 G3:.25:.5",
        velocity: 0.12,
        enter: 32,
        exit: 46,
        pan: -0.25,
        fade: [0.8, 1.3],
      },
      {
        voice: "frame",
        stem: "percussion",
        loop: "-:.5 G2:.5",
        velocity: 0.1,
        enter: 32,
        exit: 46,
        pan: 0.3,
      },
      {
        voice: "frame",
        stem: "bass",
        loop: "C2:1:1.6 -:15 C2:.5 C2:.5 C2:1:1.4 -:14 C2:2:1.8 -:30",
        velocity: 0.32,
        enter: 48,
        exit: 52,
      },
      {
        voice: "bronze",
        stem: "percussion",
        loop: "F#6:16",
        velocity: 0.04,
        enter: 2,
        exit: 8,
        pan: 0.35,
      },
      {
        voice: "bronze",
        stem: "percussion",
        loop: "F#6:4:1.4 F#6:4 F#6:4:.8 F#6:4",
        velocity: 0.045,
        enter: 8,
        exit: 46,
        pan: 0.35,
      },
      {
        voice: "bronze",
        stem: "percussion",
        loop: "A6:1:.7 A6:1:.5",
        velocity: 0.03,
        enter: 38,
        exit: 46,
        pan: -0.35,
      },
      {
        voice: "bronze",
        stem: "percussion",
        loop: "C6:16",
        velocity: 0.08,
        enter: 48,
        exit: 49,
      },
    ],
  },
];
