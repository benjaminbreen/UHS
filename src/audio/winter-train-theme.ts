import type { LayeredTheme } from "./layered-themes";

const chord: Record<string, [bass: string, upper: string]> = {
  Dm: ["D3", "D4+F4+A4"],
  D: ["D3", "D4+F#4+A4"],
  Gm: ["G2", "D4+G4+Bb4"],
  G: ["G2", "D4+G4+B4"],
  A: ["A2", "C#4+E4+A4"],
  C: ["C3", "C4+E4+G4"],
  F: ["F2", "C4+F4+A4"],
  Bb: ["Bb2", "D4+F4+Bb4"],
  Am: ["A2", "C4+E4+A4"],
  E: ["E2", "B3+E4+G#4"],
};
/** Oom-pah-pah: bass on the downbeat, the chord on two and three. */
const pah = (bars: string[]) => bars.map((c) => `-:1 ${chord[c][1]}:1 ${chord[c][1]}:1`).join(" ");
const oom = (bars: string[]) => bars.map((c) => `${chord[c][0]}:3`).join(" ");
const swell = (bars: string[]) => bars.map((c) => `${chord[c][1]}:3`).join(" ");

const minorBars = "Dm Dm A Dm Gm Gm Gm A Dm Dm C F Gm Dm A Dm".split(" ");
const majorBars = "F F Bb F Gm C C F F F C Gm F Bb C A".split(" ");
const modalBars = "Dm Dm E Dm Am E Dm Dm Am Dm E Dm E Am E A".split(" ");
const codaBars = "Dm Gm Dm A Dm Gm A D".split(" ");

const tune = [
  "A4:2 D5:1", "F5:2 E5:1", "D5:1 C#5:1 D5:1", "A4:3",
  "Bb4:2 G4:1", "D5:2 C5:1", "Bb4:1 A4:1 G4:1", "A4:3",
  "A4:2 D5:1", "F5:2 A5:1", "G5:1 F5:1 E5:1", "F5:2 D5:1",
  "Bb4:1 D5:1 G5:1", "F5:1 E5:1 D5:1", "C#5:1 E5:1 A4:1", "D5:3",
].join(" ");
const counter = "F4:3 E4:3 E4:3 F4:3 Bb4:3 A4:3 G4:3 E4:3 F4:3 A4:3 G4:3 A4:3 Bb4:3 A4:3 E4:3 F4:3";
const dance = [
  "C5:2 A4:1", "F5:2 C5:1", "D5:1 E5:1 F5:1", "C5:3",
  "Bb4:2 G4:1", "E5:2 C5:1", "D5:1 C5:1 Bb4:1", "A4:3",
  "C5:2 A4:1", "F5:2 A5:1", "G5:1 F5:1 E5:1", "D5:2 Bb4:1",
  "A4:1 C5:1 F5:1", "E5:1 D5:1 C5:1", "G4:1 A4:1 Bb4:1", "A4:3",
].join(" ");
// The raised fourth (G#) over D minor: the "Ukrainian Dorian" of Yiddish and Slavic dance music.
const lament = [
  "D4:1 E4:1 F4:1", "G#4:2 A4:1", "B4:1 A4:1 G#4:1", "A4:3",
  "C5:1 B4:1 A4:1", "G#4:1 F4:1 E4:1", "F4:2 E4:1", "D4:3",
  "A4:1 B4:1 C5:1", "D5:2 C5:1", "B4:1 A4:1 G#4:1", "A4:2 F4:1",
  "E4:1 F4:1 G#4:1", "A4:1 B4:1 C5:1", "B4:2 G#4:1", "A4:3",
].join(" ");
const whistle = "A5:1 F5:1 D5:1 E5:3 -:3 -:3 A5:1 F5:1 D5:1 C#5:3 -:3 -:3";

export const lastWinterTrain: LayeredTheme = {
  id: "last-winter-train",
  title: "The last train before the snow",
  subtitle:
    "A station waltz in D minor: the clarinet's tune passes to the strings, an accordion turns it to F major, a horn bends it into the raised fourth of the borderlands, then the whole band brings it home.",
  place: "A railway town in central or eastern Europe, c. 1900",
  culture: "european",
  years: [1850, 1920],
  evidence:
    "Documented: the waltz across 19th-century Europe; the railway reaching provincial towns; café and town bands with clarinet, accordion, strings and brass; the raised-fourth minor mode in Jewish, Ukrainian and Romanian dance music. The melody, form and orchestration are original, written in the manner of a 1990s role-playing-game town theme.",
  bpm: 126,
  meter: 3,
  bars: 136,
  key: "D minor / F major, raised-fourth bridge",
  reverb: [0.3, 2.6],
  sections: [
    { bar: 0, label: "Platform" },
    { bar: 8, label: "Clarinet" },
    { bar: 24, label: "Strings" },
    { bar: 40, label: "Accordion" },
    { bar: 56, label: "Borderland" },
    { bar: 72, label: "All aboard" },
    { bar: 88, label: "Snowfall" },
    { bar: 96, label: "Dance again" },
    { bar: 112, label: "Clarinet home" },
    { bar: 128, label: "Departure" },
  ],
  layers: [
    { voice: "bell", stem: "melody", loop: whistle, velocity: 0.12, pan: 0.35, exit: 8, echo: [1.5, 2, 0.4] },
    { voice: "harp", stem: "harmony", loop: "D3:1 A3:1 F4:1 D3:1 A3:1 E4:1 G2:1 D3:1 Bb3:1 A2:1 E3:1 C#4:1", velocity: 0.12, exit: 8 },
    { voice: "drone", stem: "bass", loop: "D2:24", velocity: 0.06, exit: 8 },

    { voice: "bass", stem: "bass", loop: oom(minorBars), velocity: 0.14, enter: 8, exit: 40 },
    { voice: "strings", stem: "harmony", loop: pah(minorBars), velocity: 0.07, pan: -0.2, enter: 8, exit: 24 },
    { voice: "clarinet", stem: "melody", loop: tune, velocity: 0.26, pan: 0.1, enter: 8, exit: 24 },
    { voice: "pluck", stem: "harmony", loop: pah(minorBars), velocity: 0.08, pan: 0.3, enter: 24, exit: 40 },
    { voice: "strings", stem: "melody", loop: tune, velocity: 0.24, enter: 24, exit: 40 },
    { voice: "clarinet", stem: "harmony", loop: counter, velocity: 0.12, pan: 0.35, enter: 24, exit: 40 },

    { voice: "bass", stem: "bass", loop: oom(majorBars), velocity: 0.14, enter: 40, exit: 56 },
    { voice: "pluck", stem: "harmony", loop: pah(majorBars), velocity: 0.09, pan: -0.3, enter: 40, exit: 56 },
    { voice: "accordion", stem: "melody", loop: dance, velocity: 0.2, pan: 0.15, enter: 40, exit: 56 },
    { voice: "snare", stem: "percussion", loop: "-:1 C4:.5 C4:.5 C4:1", velocity: 0.04, pan: 0.4, enter: 48, exit: 56 },

    { voice: "bass", stem: "bass", loop: oom(modalBars), velocity: 0.15, enter: 56, exit: 72 },
    { voice: "strings", stem: "harmony", loop: swell(modalBars), velocity: 0.08, enter: 56, exit: 72 },
    { voice: "horn", stem: "melody", loop: lament, velocity: 0.24, enter: 56, exit: 72 },
    { voice: "kick", stem: "percussion", loop: "C2:1 -:2 -:3 C2:1 -:2 C2:1 C2:1 C2:1", velocity: 0.08, enter: 64, exit: 72 },
    { voice: "accordion", stem: "harmony", loop: lament, transpose: 12, velocity: 0.08, pan: 0.4, enter: 64, exit: 72 },

    { voice: "bass", stem: "bass", loop: oom(minorBars), velocity: 0.16, enter: 72, exit: 88 },
    { voice: "strings", stem: "harmony", loop: pah(minorBars), velocity: 0.09, pan: -0.25, enter: 72, exit: 88 },
    { voice: "strings", stem: "melody", loop: tune, velocity: 0.26, enter: 72, exit: 88 },
    { voice: "horn", stem: "melody", loop: tune, transpose: -12, velocity: 0.16, pan: -0.15, enter: 72, exit: 88 },
    { voice: "choir", stem: "harmony", loop: swell(minorBars), velocity: 0.06, enter: 72, exit: 88 },
    { voice: "snare", stem: "percussion", loop: "C4:1 C4:.5 C4:.5 C4:1", velocity: 0.05, pan: 0.4, enter: 72, exit: 88 },
    { voice: "kick", stem: "percussion", loop: "C2:3", velocity: 0.07, enter: 72, exit: 88 },

    { voice: "piano", stem: "harmony", loop: "D3:1 A3:1 F4:1 D3:1 A3:1 F4:1 Bb2:1 F3:1 D4:1 A2:1 E3:1 C#4:1", velocity: 0.1, enter: 88, exit: 96 },
    { voice: "bell", stem: "melody", loop: whistle, velocity: 0.1, pan: 0.35, enter: 88, exit: 96, echo: [1.5, 2, 0.4] },

    { voice: "bass", stem: "bass", loop: oom(majorBars), velocity: 0.14, enter: 96, exit: 112 },
    { voice: "strings", stem: "harmony", loop: pah(majorBars), velocity: 0.08, pan: -0.3, enter: 96, exit: 112 },
    { voice: "accordion", stem: "melody", loop: dance, velocity: 0.18, pan: 0.15, enter: 96, exit: 112 },
    { voice: "clarinet", stem: "harmony", loop: dance, transpose: -12, velocity: 0.1, pan: 0.4, enter: 104, exit: 112 },

    { voice: "bass", stem: "bass", loop: oom(minorBars), velocity: 0.13, enter: 112, exit: 128 },
    { voice: "harp", stem: "harmony", loop: pah(minorBars), velocity: 0.08, pan: -0.25, enter: 112, exit: 128 },
    { voice: "clarinet", stem: "melody", loop: tune, velocity: 0.24, enter: 112, exit: 128 },
    { voice: "strings", stem: "harmony", loop: counter, velocity: 0.08, pan: 0.3, enter: 120, exit: 128 },

    { voice: "strings", stem: "harmony", loop: swell(codaBars), velocity: 0.09, enter: 128, fade: [1, 0.2] },
    { voice: "bass", stem: "bass", loop: oom(codaBars), velocity: 0.12, enter: 128, fade: [1, 0.3] },
    { voice: "bell", stem: "melody", loop: whistle, velocity: 0.1, pan: 0.35, enter: 128, echo: [1.5, 3, 0.4], fade: [1, 0.4] },
  ],
};
