import type { LayeredTheme } from "./layered-themes";

const seq = (table: Record<string, string>, chords: string) =>
  chords
    .split(" ")
    .map((c) => table[c])
    .join(" ");

// Eight-section overworld dawn form (88 bars, 4/4 at 100 BPM = 3:31).
const mist = "Em9 Dadd9/F# Cmaj7 Bsus4 Em9 Cmaj7 Am9 B7",
  roadA1 = "Em D/F# G Cmaj7 Am7 Em/G F#m7b5 B7",
  roadA2 = "Em D/F# G Bm7 Cmaj7 Bm7 Am7 D7",
  ridge = "G D/F# Em7 Bm7 Cmaj7 G/B Am7 D Cmaj7 Bm7 Am7 Fadd9",
  hills = "Gm9 EbMaj7 Fadd9 Dm7 EbMaj7 Fadd9 Gm9 Bb/D Cm9 AbMaj7 Am7b5 B7",
  waking = `${roadA1} Em D/F# G Bm7 Cmaj7 D Eadd9 Eadd9`,
  eaves = "Eadd9 B/D# C#m7 G#m7 Amaj7 E/G# F#m7 Bsus4 Amaj7 G#m7 Cmaj7 D",
  dew = "Em9 Dadd9/F# Cmaj7 Bsus4 Em9 Cmaj7 Am9 B7 Cmaj7 D Em9 Em9";

const harpArp: Record<string, string> = {
  Em9: "E3:.5 B3:.5 F#4:.5 G4:.5 B4:.5 G4:.5 F#4:.5 B3:.5",
  "Dadd9/F#": "F#3:.5 A3:.5 D4:.5 E4:.5 A4:.5 E4:.5 D4:.5 A3:.5",
  Cmaj7: "C3:.5 G3:.5 B3:.5 E4:.5 G4:.5 E4:.5 B3:.5 G3:.5",
  Bsus4: "B2:.5 F#3:.5 B3:.5 E4:.5 F#4:.5 E4:.5 B3:.5 F#3:.5",
  Am9: "A2:.5 E3:.5 B3:.5 C4:.5 E4:.5 C4:.5 B3:.5 E3:.5",
  B7: "B2:.5 F#3:.5 A3:.5 D#4:.5 F#4:.5 D#4:.5 A3:.5 F#3:.5",
  Em: "E3:.5 B3:.5 E4:.5 G4:.5 B4:.5 G4:.5 E4:.5 B3:.5",
  "D/F#": "F#3:.5 A3:.5 D4:.5 F#4:.5 A4:.5 F#4:.5 D4:.5 A3:.5",
  G: "G3:.5 B3:.5 D4:.5 G4:.5 B4:.5 G4:.5 D4:.5 B3:.5",
  Am7: "A2:.5 E3:.5 G3:.5 C4:.5 E4:.5 C4:.5 G3:.5 E3:.5",
  "Em/G": "G2:.5 B3:.5 E4:.5 G4:.5 B4:.5 G4:.5 E4:.5 B3:.5",
  "F#m7b5": "F#2:.5 C3:.5 E3:.5 A3:.5 C4:.5 A3:.5 E3:.5 C3:.5",
  Bm7: "B2:.5 F#3:.5 A3:.5 D4:.5 F#4:.5 D4:.5 A3:.5 F#3:.5",
  D7: "D3:.5 A3:.5 C4:.5 F#4:.5 A4:.5 F#4:.5 C4:.5 A3:.5",
  D: "D3:.5 A3:.5 D4:.5 F#4:.5 A4:.5 F#4:.5 D4:.5 A3:.5",
  Gm9: "G2:.5 D3:.5 A3:.5 Bb3:.5 D4:.5 Bb3:.5 A3:.5 D3:.5",
  EbMaj7: "Eb3:.5 Bb3:.5 D4:.5 G4:.5 Bb4:.5 G4:.5 D4:.5 Bb3:.5",
  Fadd9: "F3:.5 C4:.5 G4:.5 A4:.5 C5:.5 A4:.5 G4:.5 C4:.5",
  Dm7: "D3:.5 A3:.5 C4:.5 F4:.5 A4:.5 F4:.5 C4:.5 A3:.5",
  "Bb/D": "D3:.5 F3:.5 Bb3:.5 D4:.5 F4:.5 D4:.5 Bb3:.5 F3:.5",
  Cm9: "C3:.5 G3:.5 D4:.5 Eb4:.5 G4:.5 Eb4:.5 D4:.5 G3:.5",
  AbMaj7: "Ab2:.5 Eb3:.5 G3:.5 C4:.5 Eb4:.5 C4:.5 G3:.5 Eb3:.5",
  Am7b5: "A2:.5 Eb3:.5 G3:.5 C4:.5 Eb4:.5 C4:.5 G3:.5 Eb3:.5",
  Eadd9: "E3:.5 B3:.5 F#4:.5 G#4:.5 B4:.5 G#4:.5 F#4:.5 B3:.5",
};

// Quarter-note harp for the fading close.
const harpSlow: Record<string, string> = {
  Cmaj7: "C3:1 G3:1 B3:1 E4:1",
  D: "D3:1 A3:1 D4:1 F#4:1",
  Em9: "E3:1 B3:1 F#4:1 G4:1",
};

// Syncopated 3+3+2 eighth-note kora ripple for the sunlit ridge and climax.
const koraSync: Record<string, string> = {
  G: "G4:.5 B4:.5 D5:.5 G4:.5 B4:.5 E5:.5 D5:.5 B4:.5",
  "D/F#": "F#4:.5 A4:.5 D5:.5 F#4:.5 A4:.5 E5:.5 D5:.5 A4:.5",
  Em7: "E4:.5 G4:.5 B4:.5 E4:.5 G4:.5 D5:.5 B4:.5 G4:.5",
  Bm7: "F#4:.5 A4:.5 D5:.5 F#4:.5 A4:.5 B4:.5 D5:.5 A4:.5",
  Cmaj7: "E4:.5 G4:.5 B4:.5 E4:.5 G4:.5 D5:.5 B4:.5 G4:.5",
  "G/B": "D4:.5 G4:.5 B4:.5 D4:.5 G4:.5 D5:.5 B4:.5 G4:.5",
  Am7: "E4:.5 G4:.5 C5:.5 E4:.5 G4:.5 B4:.5 C5:.5 G4:.5",
  D: "F#4:.5 A4:.5 D5:.5 F#4:.5 A4:.5 E5:.5 D5:.5 A4:.5",
  Fadd9: "F4:.5 A4:.5 C5:.5 F4:.5 G4:.5 C5:.5 A4:.5 G4:.5",
  Em: "E4:.5 G4:.5 B4:.5 E4:.5 F#4:.5 B4:.5 G4:.5 B4:.5",
  "Em/G": "G4:.5 B4:.5 E5:.5 G4:.5 B4:.5 D5:.5 B4:.5 G4:.5",
  "F#m7b5": "E4:.5 A4:.5 C5:.5 E4:.5 A4:.5 B4:.5 A4:.5 E4:.5",
  B7: "D#4:.5 F#4:.5 A4:.5 D#4:.5 F#4:.5 B4:.5 A4:.5 F#4:.5",
  Eadd9: "E4:.5 G#4:.5 B4:.5 E4:.5 F#4:.5 B4:.5 G#4:.5 F#4:.5",
};

// Fingerpicked acoustic guitar with thumb on 1 and 3 and syncopated upper voices.
const guitarPick: Record<string, string> = {
  G: "G2:.5 D4:.5 B3:.5 G4:.5 D3:.5 D4:.5 B3:.5 G4:.5",
  "D/F#": "F#2:.5 D4:.5 A3:.5 F#4:.5 A2:.5 D4:.5 A3:.5 F#4:.5",
  Em7: "E2:.5 B3:.5 G3:.5 D4:.5 B2:.5 B3:.5 G3:.5 D4:.5",
  Bm7: "B2:.5 A3:.5 F#3:.5 D4:.5 F#3:.5 A3:.5 F#3:.5 D4:.5",
  Cmaj7: "C3:.5 B3:.5 G3:.5 E4:.5 G2:.5 B3:.5 G3:.5 E4:.5",
  "G/B": "B2:.5 D4:.5 G3:.5 B3:.5 D3:.5 D4:.5 G3:.5 B3:.5",
  Am7: "A2:.5 C4:.5 G3:.5 E4:.5 E3:.5 C4:.5 G3:.5 E4:.5",
  D: "D3:.5 A3:.5 F#3:.5 D4:.5 A2:.5 A3:.5 F#3:.5 D4:.5",
  Fadd9: "F2:.5 C4:.5 A3:.5 G4:.5 C3:.5 C4:.5 A3:.5 G4:.5",
  Eadd9: "E2:.5 B3:.5 G#3:.5 F#4:.5 B2:.5 B3:.5 G#3:.5 E4:.5",
  "B/D#": "D#3:.5 B3:.5 F#3:.5 D#4:.5 F#3:.5 B3:.5 F#3:.5 D#4:.5",
  "C#m7": "C#3:.5 B3:.5 G#3:.5 E4:.5 G#2:.5 B3:.5 G#3:.5 E4:.5",
  "G#m7": "G#2:.5 B3:.5 F#3:.5 D#4:.5 D#3:.5 B3:.5 F#3:.5 D#4:.5",
  Amaj7: "A2:.5 C#4:.5 G#3:.5 E4:.5 E3:.5 C#4:.5 G#3:.5 E4:.5",
  "E/G#": "G#2:.5 B3:.5 E3:.5 E4:.5 B2:.5 B3:.5 E3:.5 E4:.5",
  "F#m7": "F#2:.5 A3:.5 E3:.5 C#4:.5 C#3:.5 A3:.5 E3:.5 C#4:.5",
  Bsus4: "B2:.5 B3:.5 F#3:.5 E4:.5 F#3:.5 B3:.5 F#3:.5 D#4:.5",
};

const pianoRoll: Record<string, string> = {
  Eadd9: "E3+G#3+B3:1.5 F#4:.5 G#4:1 B4:1",
  "B/D#": "D#3+F#3+B3:1.5 D#4:.5 F#4:1 B4:1",
  "C#m7": "C#3+G#3+B3:1.5 E4:.5 G#4:1 B4:1",
  "G#m7": "G#3+B3+D#4:1.5 F#4:.5 B4:1 D#4:1",
  Amaj7: "A3+C#4+E4:1.5 G#4:.5 E4:1 C#4:1",
  "E/G#": "G#3+B3+E4:1.5 F#4:.5 G#4:1 E4:1",
  "F#m7": "F#3+A3+C#4:1.5 E4:.5 C#4:1 A3:1",
  Bsus4: "F#3+B3+E4:2 F#3+B3+D#4:2",
  Cmaj7: "C3+G3+B3:1.5 E4:.5 G4:1 B4:1",
  D: "D3+A3+D4:1.5 F#4:.5 A4:1 F#4:1",
};

const hold: Record<string, string> = {
  Em9: "E3+G3+B3+F#4:4",
  "Dadd9/F#": "F#3+A3+D4+E4:4",
  Cmaj7: "E3+G3+B3+E4:4",
  Bsus4: "F#3+B3+E4:2 F#3+B3+D#4:2",
  Am9: "E3+A3+B3+C4:4",
  B7: "F#3+A3+B3+D#4:4",
  Em: "E3+G3+B3:4",
  "D/F#": "F#3+A3+D4:4",
  G: "G3+B3+D4:4",
  Am7: "E3+G3+A3+C4:4",
  "Em/G": "G3+B3+E4:4",
  "F#m7b5": "F#3+A3+C4+E4:4",
  Bm7: "F#3+A3+B3+D4:4",
  D7: "F#3+A3+C4+D4:4",
  D: "F#3+A3+D4:4",
  Em7: "E3+G3+B3+D4:4",
  "G/B": "D3+G3+B3:4",
  Fadd9: "F3+A3+C4+G4:4",
  Gm9: "G3+Bb3+D4+A4:4",
  EbMaj7: "G3+Bb3+D4+Eb4:4",
  Dm7: "F3+A3+C4+D4:4",
  "Bb/D": "F3+Bb3+D4:4",
  Cm9: "G3+C4+D4+Eb4:4",
  AbMaj7: "Ab3+C4+Eb4+G4:4",
  Am7b5: "A3+C4+Eb4+G4:4",
  Eadd9: "E3+G#3+B3+F#4:4",
  "B/D#": "F#3+B3+D#4:4",
  "C#m7": "G#3+B3+C#4+E4:4",
  "G#m7": "F#3+G#3+B3+D#4:4",
  Amaj7: "E3+G#3+A3+C#4:4",
  "E/G#": "G#3+B3+E4:4",
  "F#m7": "E3+F#3+A3+C#4:4",
};

const choirPad: Record<string, string> = {
  Em9: "B3+E4+F#4:4",
  "Dadd9/F#": "A3+D4+E4:4",
  Cmaj7: "G3+B3+E4:4",
  Bsus4: "B3+E4:2 B3+D#4:2",
  Am9: "A3+B3+E4:4",
  B7: "A3+B3+D#4:4",
  Em: "B3+E4+G4:4",
  "D/F#": "A3+D4+F#4:4",
  G: "B3+D4+G4:4",
  Am7: "C4+E4+G4:4",
  "Em/G": "B3+E4+G4:4",
  "F#m7b5": "C4+E4+A4:4",
  Bm7: "A3+D4+F#4:4",
  D: "A3+D4+F#4:4",
  Gm9: "Bb3+D4+A4:4",
  EbMaj7: "Bb3+D4+G4:4",
  Fadd9: "C4+F4+G4:4",
  Dm7: "A3+C4+F4:4",
  "Bb/D": "Bb3+D4+F4:4",
  Cm9: "C4+D4+G4:4",
  AbMaj7: "C4+Eb4+G4:4",
  Am7b5: "C4+Eb4+G4:4",
  Eadd9: "B3+E4+G#4:4",
};

const low: Record<string, string> = {
  Em9: "E2:3 B1:1",
  "Dadd9/F#": "F#2:3 D2:1",
  Cmaj7: "C2:3 G2:1",
  Bsus4: "B1:2 F#2:2",
  Am9: "A1:3 E2:1",
  B7: "B1:2 F#2:1 B2:1",
  Em: "E2:2.5 E2:.5 B2:1",
  "D/F#": "F#2:2.5 F#2:.5 D2:1",
  G: "G2:2.5 G2:.5 D2:1",
  Am7: "A2:2.5 A2:.5 E2:1",
  "Em/G": "G2:2.5 G2:.5 E2:1",
  "F#m7b5": "F#2:2.5 F#2:.5 C2:1",
  Bm7: "B1:2.5 B1:.5 F#2:1",
  D7: "D2:2.5 D2:.5 A2:1",
  D: "D2:2.5 D2:.5 A2:1",
  Em7: "E2:2.5 E2:.5 B1:1",
  "G/B": "B1:2.5 B1:.5 G2:1",
  Fadd9: "F2:2.5 F2:.5 C2:1",
  Gm9: "G2:2.5 G2:.5 D2:1",
  EbMaj7: "Eb2:2.5 Eb2:.5 Bb1:1",
  Dm7: "D2:2.5 D2:.5 A1:1",
  "Bb/D": "D2:2.5 D2:.5 Bb1:1",
  Cm9: "C2:2.5 C2:.5 G2:1",
  AbMaj7: "Ab1:2.5 Ab1:.5 Eb2:1",
  Am7b5: "A1:2.5 A1:.5 Eb2:1",
  Eadd9: "E2:2.5 E2:.5 B1:1",
  "B/D#": "D#2:2.5 D#2:.5 B1:1",
  "C#m7": "C#2:2.5 C#2:.5 G#2:1",
  "G#m7": "G#1:2.5 G#1:.5 D#2:1",
  Amaj7: "A1:2.5 A1:.5 E2:1",
  "E/G#": "G#1:2.5 G#1:.5 E2:1",
  "F#m7": "F#1:2.5 F#1:.5 C#2:1",
};

// Theme A1 (8 bars = 32 beats): rising fifth, lingering ninth, lamenting turn to B7.
const themeA1 =
  "B4:1:.85 E5:1.5:1 F#5:.5:.9 G5:1:1.05 " +
  "F#5:2:1 D5:1:.85 E5:1:.9 " +
  "G5:1.5:1.05 A5:.5:1 B5:1:1.1 G5:1:.9 " +
  "F#5:1.5:1 E5:.5:.9 D5:1:.85 B4:1:.8 " +
  "C5:1:.9 E5:1.5:1 G5:.5:.95 F#5:1:.9 " +
  "E5:1.5:.95 D5:.5:.85 B4:2:.8 " +
  "A4:1:.85 C5:1:.95 E5:1.5:1 D5:.5:.9 " +
  "D#5:2.5:1 -:1.5";

// Theme A2 (8 bars = 32 beats): climbs higher, then walks into G major.
const themeA2 =
  "B4:1:.85 E5:1.5:1 F#5:.5:.95 G5:1:1.05 " +
  "A5:1.5:1.1 G5:.5:1 F#5:1:.9 D5:1:.85 " +
  "B5:2:1.15 A5:1:1 G5:1:.9 " +
  "F#5:1.5:.95 D5:.5:.85 F#5:1:.9 A5:1:1 " +
  "G5:1.5:1.05 E5:.5:.9 C5:1:.85 E5:1:.95 " +
  "F#5:1.5:1 D5:.5:.9 B4:1:.85 D5:1:.9 " +
  "E5:1.5:1 G5:.5:.95 F#5:1:.9 E5:1:.85 " +
  "D5:2:.95 F#5:1:.9 A5:1:1";

// Climax Theme A2 (8 bars = 32 beats): lifts into a Picardy E-major sunrise.
const themeA2Sunrise =
  "B4:1:.85 E5:1.5:1 F#5:.5:.95 G5:1:1.05 " +
  "A5:1.5:1.1 G5:.5:1 F#5:1:.9 D5:1:.85 " +
  "B5:2:1.15 A5:1:1 G5:1:.9 " +
  "F#5:1.5:.95 D5:.5:.85 F#5:1:.9 A5:1:1 " +
  "G5:1.5:1.05 E5:.5:.9 G5:1:1 C6:1:1.15 " +
  "A5:1.5:1.1 F#5:.5:1 A5:1:1.05 D6:1:1.15 " +
  "B5:2:1.2 G#5:1:1.05 F#5:1:.95 " +
  "G#5:3:1.1 -:1";

// Cello countermelody under Theme A1 & A2 (16 bars = 64 beats).
const celloUnderA =
  "G3:2:.85 B3:2:.9 A3:2:.9 F#3:2:.85 B3:2:.95 D4:2:.9 C4:2:.9 B3:2:.85 " +
  "A3:2:.85 C4:2:.9 B3:2:.85 G3:2:.8 F#3:2:.85 A3:2:.9 B3:1.5:.95 F#3:1:.85 A3:.5:.9 B3:1:.95 " +
  "G3:2:.85 B3:2:.9 A3:2:.9 D4:2:.95 D4:2:1 B3:2:.9 A3:2:.9 F#3:2:.85 " +
  "G3:2:.9 C4:2:.95 F#3:2:.9 B3:2:.9 E3:2:.85 G3:2:.9 F#3:2:.9 A3:2:.95";

// Heroic horn countermelody during the full-orchestra climax (16 bars = 64 beats).
const hornClimax =
  "E4:2:.9 G4:2:.95 F#4:2:.95 A4:2:1 G4:2:1 B4:2:1.05 G4:2:.95 E4:2:.9 " +
  "E4:2:.9 A4:2:1 G4:2:.95 E4:2:.9 F#4:2:.95 A4:2:1 F#4:2.5:1 -:1.5 " +
  "E4:2:.9 G4:2:.95 F#4:2:1 A4:2:1.05 G4:2:1 D4:2:.9 F#4:2:.95 B4:2:1 " +
  "E4:2:1 G4:2:1.05 F#4:2:1 A4:2:1.1 G#4:2:1.15 B4:2:1.1 B4:3:1.05 -:1";

// Theme B (12 bars = 48 beats): G-major Stardew Valley sunrise.
const ridgeFlute =
  "B5:1.5:1.05 D6:.5:1 B5:1:.9 G5:1:.85 " +
  "A5:1.5:1 F#5:.5:.9 D5:1:.85 F#5:1:.9 " +
  "G5:1:.95 B5:1.5:1.05 A5:.5:.95 G5:1:.9 " +
  "F#5:2:.95 D5:1:.85 B4:1:.8 " +
  "E5:1:.9 G5:1.5:1 B5:.5:1 A5:1:.95 " +
  "G5:1.5:1 D5:.5:.85 G5:1:.9 B5:1:1 " +
  "C6:1.5:1.05 B5:.5:1 A5:1:.95 G5:1:.9 " +
  "A5:2.5:1 -:1.5 " +
  "E5:1:.9 G5:1:.95 B5:1.5:1.05 A5:.5:.95 " +
  "F#5:1.5:1 D5:.5:.9 F#5:1:.95 A5:1:1 " +
  "G5:1:.95 E5:1:.9 C5:1:.85 E5:1:.9 " +
  "G5:1.5:1 A5:.5:1 C6:2:1.1";

const ridgeClarinet =
  "G4:1.5:.9 B4:.5:.9 G4:1:.85 D4:1:.8 " +
  "F#4:1.5:.9 D4:.5:.85 A3:1:.8 D4:1:.85 " +
  "E4:1:.85 G4:1.5:.95 F#4:.5:.9 E4:1:.85 " +
  "D4:2:.9 B3:1:.8 F#3:1:.75 " +
  "C4:1:.85 E4:1.5:.95 G4:.5:.95 F#4:1:.9 " +
  "D4:1.5:.9 B3:.5:.8 D4:1:.85 G4:1:.9 " +
  "E4:1.5:.95 G4:.5:.9 F#4:1:.9 E4:1:.85 " +
  "F#4:2.5:.95 -:1.5 " +
  "C4:1:.85 E4:1:.9 G4:1.5:.95 F#4:.5:.9 " +
  "D4:1.5:.9 B3:.5:.85 D4:1:.9 F#4:1:.95 " +
  "E4:1:.9 C4:1:.85 A3:1:.8 C4:1:.85 " +
  "C4:1.5:.9 F4:.5:.95 G4:2:1";

// Development / Modulatory Bridge (12 bars = 48 beats): Gm9 -> Bb -> Cm9 -> AbMaj7 -> Am7b5 -> B7.
const hillsHorn =
  "D4:1:.9 G4:1.5:1.05 A4:.5:1 Bb4:1:1.1 " +
  "A4:1.5:1 G4:.5:.95 F4:1:.9 D4:1:.85 " +
  "C4:1:.9 F4:1.5:1 G4:.5:.95 A4:1:1.05 " +
  "A4:2:1 F4:1:.9 D4:1:.85 " +
  "G4:1.5:1 Bb4:.5:1 D5:1:1.1 C5:1:1 " +
  "A4:1.5:1 C5:.5:1.05 F5:1:1.15 C5:1:1 " +
  "D5:2:1.15 Bb4:1:1 G4:1:.9 " +
  "F4:1.5:.95 Bb4:.5:1 D5:2:1.1 " +
  "G4:1:.95 C5:1.5:1.05 D5:.5:1 Eb5:1:1.1 " +
  "C5:1.5:1.05 Bb4:.5:1 Ab4:1:.95 G4:1:.9 " +
  "A4:1:.95 C5:1.5:1.05 Eb5:.5:1.1 D5:1:1 " +
  "D#5:2:1.15 B4:1:1 F#4:1:.9";

// Sunlit Interlude (12 bars = 48 beats): E-major call and response between flute and clarinet.
const eavesFlute =
  "G#5:1:.95 B5:1:.95 F#5:.5:.9 G#5:.5:.95 E5:1:.85 " +
  "F#5:1.5:1 G#5:.5:.95 F#5:1:.9 D#5:1:.85 " +
  "-:8 " +
  "C#5:1:.9 E5:1.5:1 G#5:.5:1 F#5:1:.95 " +
  "E5:1.5:.95 B4:.5:.85 E5:2:.9 " +
  "A5:1.5:1 G#5:.5:.95 F#5:1:.9 E5:1:.85 " +
  "F#5:2:.95 B5:1:1 F#5:1:.9 " +
  "E5:1:.9 C#5:1:.85 E5:1:.95 A5:1:1 " +
  "G#5:2:.95 D#5:1:.85 G#5:1:.9 " +
  "G5:1.5:1 E5:.5:.9 C5:1:.85 E5:1:.9 " +
  "F#5:2.5:.95 -:1.5";

const eavesClarinet =
  "-:8 " +
  "E4:1:.95 G#4:1.5:1 B4:.5:.95 A4:1:.9 " +
  "G#4:1.5:.95 F#4:.5:.85 D#4:2:.8 " +
  "-:8 " +
  "F#4:1.5:.9 E4:.5:.85 C#4:1:.85 E4:1:.85 " +
  "D#4:2:.9 F#4:1:.9 D#4:1:.85 " +
  "C#4:2:.85 E4:2:.9 " +
  "D#4:2:.85 B3:2:.8 " +
  "E4:2:.9 G4:2:.9 " +
  "D4:2.5:.85 -:1.5";

// Coda memory of Theme A on duduk (6 bars = 24 beats, bars 78-84).
const codaDuduk =
  "B4:1:.85 ~E5:1.5:.95 F#5:.5:.9 G5:1:.95 " +
  "F#5:2.5:.9 -:1.5 " +
  "B4:1:.85 E5:1.5:.95 G5:.5:.95 F#5:1:.9 " +
  "E5:1.5:.9 D5:.5:.85 B4:2:.8 " +
  "C5:1:.85 E5:1.5:.9 D5:.5:.85 C5:1:.8 " +
  "B4:3:.85 -:1";

// Quiet marching snare cadence (FF6 overworld stride, 2 bars = 8 beats).
const marchSnare =
  "C4:1:.75 -:1 C4:.75:.55 C4:.25:.45 C4:1:.8 -:1 C4:.5:.55 C4:.5:.45 C4:.75:.65 C4:.25:.45 -:1";

// Pitched timpani-like footdrum heartbeat (2 bars = 8 beats).
const dawnDrum = "E2:1.5:1 B1:.5:.65 E2:2:.85 E2:1.5:.9 B1:.5:.6 B1:2:.75";

/** A universal dawn overworld theme for early risers (3:00–5:59). */
export const dawnTheme: LayeredTheme = {
  id: "before-the-smoke-rises",
  title: "Before the smoke rises",
  subtitle:
    "An overworld dawn in eight parts. Harp and echoed celesta wake in the mist under a distant choir; panpipe and duduk trade a noble minor theme over a soft marching snare; the key opens to G major with kora and fingerpicked guitar; a French horn modulates through G minor and A-flat major to a full orchestral return that breaks into E major sunlight before settling back into the dew.",
  place: "All of history · early dawn",
  culture: [],
  years: [0, 0],
  anywhere: true,
  hours: [3, 6],
  evidence:
    "Original: a long-form overworld dawn score inspired by 16-bit orchestral RPG themes (Final Fantasy VI) and acoustic pastoral morning music (Stardew Valley). It reconstructs no local tradition.",
  bpm: 100,
  meter: 4,
  bars: 88,
  key: "E minor, opening to G major, G minor / A-flat major, and E major",
  reverb: [0.3, 3.1],
  sections: [
    { bar: 0, label: "Mist on the grass" },
    { bar: 8, label: "The road before sunrise" },
    { bar: 24, label: "First gold on the ridge" },
    { bar: 36, label: "Over the far hills" },
    { bar: 48, label: "The wide world waking" },
    { bar: 64, label: "Sun on the eaves" },
    { bar: 76, label: "Footsteps in the dew" },
  ],
  layers: [
    // --- Section 1: Mist on the grass (bars 0-8) ---
    {
      voice: "harp",
      stem: "harmony",
      loop: seq(harpArp, `${mist} ${roadA1} ${roadA2}`),
      velocity: 0.15,
      enter: 0,
      exit: 24,
      pan: -0.26,
    },
    {
      voice: "celesta",
      stem: "harmony",
      loop: "-:2 F#5:1 B5:1 -:4 -:2 E5:1 G5:1 -:4 -:2 B5:1 F#5:1 -:4 -:2 D#5:1 F#5:1 -:4",
      velocity: 0.11,
      enter: 0,
      exit: 8,
      pan: 0.36,
      echo: [0.75, 2, 0.45],
    },
    {
      voice: "choir",
      stem: "harmony",
      loop: seq(choirPad, mist),
      velocity: 0.048,
      enter: 0,
      exit: 8,
      fade: [0.55, 1],
    },
    {
      voice: "bass",
      stem: "bass",
      loop: seq(low, "Em9 Cmaj7 Am9 B7"),
      velocity: 0.13,
      enter: 4,
      exit: 8,
      fade: [0.6, 1],
    },

    // --- Section 2: The road before sunrise (bars 8-24) ---
    {
      voice: "bass",
      stem: "bass",
      loop: seq(low, `${roadA1} ${roadA2}`),
      velocity: 0.16,
      enter: 8,
      exit: 24,
    },
    {
      voice: "strings",
      stem: "harmony",
      loop: seq(hold, `${roadA1} ${roadA2}`),
      velocity: 0.042,
      enter: 8,
      exit: 24,
      fade: [0.65, 1],
    },
    {
      voice: "panpipe",
      stem: "melody",
      loop: themeA1,
      velocity: 0.17,
      enter: 8,
      exit: 16,
      pan: -0.08,
    },
    {
      voice: "duduk",
      stem: "melody",
      loop: themeA2,
      velocity: 0.17,
      enter: 16,
      exit: 24,
      pan: -0.06,
    },
    {
      voice: "cello",
      stem: "harmony",
      loop: celloUnderA,
      velocity: 0.12,
      enter: 8,
      exit: 24,
      pan: 0.26,
    },
    {
      voice: "footdrum",
      stem: "percussion",
      loop: dawnDrum,
      velocity: 0.13,
      enter: 12,
      exit: 24,
      pan: -0.1,
    },
    {
      voice: "snare",
      stem: "percussion",
      loop: marchSnare,
      velocity: 0.055,
      enter: 12,
      exit: 24,
      pan: -0.18,
    },
    {
      voice: "shaker",
      stem: "percussion",
      loop: "C4:.5:.8 C4:.5:.4",
      velocity: 0.03,
      enter: 16,
      exit: 24,
      pan: 0.3,
      day: true,
    },

    // --- Section 3: First gold on the ridge (bars 24-36, G major Stardew sunrise) ---
    {
      voice: "guitar",
      stem: "harmony",
      loop: seq(guitarPick, ridge),
      velocity: 0.17,
      enter: 24,
      exit: 36,
      pan: -0.22,
    },
    {
      voice: "kora",
      stem: "harmony",
      loop: seq(koraSync, ridge),
      velocity: 0.13,
      enter: 24,
      exit: 36,
      pan: 0.32,
    },
    {
      voice: "bass",
      stem: "bass",
      loop: seq(low, ridge),
      velocity: 0.16,
      enter: 24,
      exit: 36,
    },
    {
      voice: "strings",
      stem: "harmony",
      loop: seq(hold, "Cmaj7 G/B Am7 D Cmaj7 Bm7 Am7 Fadd9"),
      velocity: 0.04,
      enter: 28,
      exit: 36,
      fade: [0.6, 1],
    },
    {
      voice: "flute",
      stem: "melody",
      loop: ridgeFlute,
      velocity: 0.15,
      enter: 24,
      exit: 36,
      pan: -0.08,
    },
    {
      voice: "clarinet",
      stem: "harmony",
      loop: ridgeClarinet,
      velocity: 0.11,
      enter: 24,
      exit: 36,
      pan: 0.16,
    },
    {
      voice: "celesta",
      stem: "harmony",
      loop: "-:14 D6:.5 F#6:.5 A6:1 -:14 G5:.5 B5:.5 D6:1 -:14 C6:.5 A5:.5 F5:1",
      velocity: 0.1,
      enter: 24,
      exit: 36,
      pan: 0.38,
      echo: [0.5, 1, 0.4],
    },
    {
      voice: "brush",
      stem: "percussion",
      loop: "-:1 C4:1",
      velocity: 0.06,
      enter: 24,
      exit: 36,
      pan: 0.25,
    },
    {
      voice: "shaker",
      stem: "percussion",
      loop: "C4:.5:.9 C4:.5:.45 C4:.5:.75 C4:.5:.4",
      velocity: 0.032,
      enter: 24,
      exit: 36,
      pan: 0.3,
    },
    {
      voice: "wood",
      stem: "percussion",
      loop: "-:1.5 G5:.5:.7 -:1.5 E5:.5:.6",
      velocity: 0.055,
      enter: 24,
      exit: 36,
      pan: -0.35,
      day: true,
    },

    // --- Section 4: Over the far hills (bars 36-48, FF6 chromatic mediant modulation) ---
    {
      voice: "harp",
      stem: "harmony",
      loop: seq(harpArp, `${hills} ${waking}`),
      velocity: 0.15,
      enter: 36,
      exit: 64,
      pan: -0.26,
    },
    {
      voice: "bass",
      stem: "bass",
      loop: seq(low, `${hills} ${waking}`),
      velocity: 0.17,
      enter: 36,
      exit: 64,
    },
    {
      voice: "strings",
      stem: "harmony",
      loop: seq(hold, hills),
      velocity: 0.052,
      enter: 36,
      exit: 48,
      fade: [0.7, 1.1],
    },
    {
      voice: "choir",
      stem: "harmony",
      loop: seq(choirPad, hills),
      velocity: 0.055,
      enter: 36,
      exit: 48,
      fade: [0.7, 1.15],
    },
    {
      voice: "horn",
      stem: "melody",
      loop: hillsHorn,
      velocity: 0.19,
      enter: 36,
      exit: 48,
      pan: -0.06,
    },
    {
      voice: "flute",
      stem: "harmony",
      loop: "-:16 G5:1.5 Bb5:.5 D6:1 C6:1 A5:1.5 C6:.5 F6:1 C6:1 D6:2 Bb5:1 G5:1 F5:1.5 Bb5:.5 D6:2 -:16",
      velocity: 0.095,
      enter: 36,
      exit: 48,
      pan: 0.22,
    },
    {
      voice: "footdrum",
      stem: "percussion",
      loop: "G2:1.5:1 D2:.5:.65 G2:2:.85 Eb2:1.5:.9 Bb1:.5:.6 Bb1:2:.75",
      velocity: 0.15,
      enter: 36,
      exit: 48,
      pan: -0.1,
    },
    {
      voice: "snare",
      stem: "percussion",
      loop: marchSnare,
      velocity: 0.068,
      enter: 36,
      exit: 48,
      pan: -0.18,
    },

    // --- Section 5: The wide world waking (bars 48-64, full orchestral climax -> E major sunrise) ---
    {
      voice: "strings",
      stem: "melody",
      loop: `${themeA1} ${themeA2Sunrise}`,
      velocity: 0.145,
      enter: 48,
      exit: 64,
      pan: -0.08,
    },
    {
      voice: "flute",
      stem: "melody",
      loop: `${themeA1} ${themeA2Sunrise}`,
      velocity: 0.115,
      enter: 48,
      exit: 64,
      pan: 0.1,
    },
    {
      voice: "horn",
      stem: "harmony",
      loop: hornClimax,
      velocity: 0.11,
      enter: 48,
      exit: 64,
      pan: -0.28,
    },
    {
      voice: "cello",
      stem: "harmony",
      loop: `${celloUnderA.split(" ").slice(0, 26).join(" ")} E3:2:.95 G3:2:1 F#3:2:1 A3:2:1.05 G#3:2:1.1 B3:2:1.05 B3:3:1 -:1`,
      velocity: 0.11,
      enter: 48,
      exit: 64,
      pan: 0.26,
    },
    {
      voice: "kora",
      stem: "harmony",
      loop: seq(koraSync, waking),
      velocity: 0.11,
      enter: 48,
      exit: 64,
      pan: 0.34,
    },
    {
      voice: "strings",
      stem: "harmony",
      loop: seq(hold, waking),
      velocity: 0.05,
      enter: 48,
      exit: 64,
    },
    {
      voice: "choir",
      stem: "harmony",
      loop: seq(choirPad, "Am7 Em/G F#m7b5 B7 Em D/F# G Bm7 Cmaj7 D Eadd9 Eadd9"),
      velocity: 0.055,
      enter: 52,
      exit: 64,
      fade: [0.7, 1.15],
    },
    {
      voice: "footdrum",
      stem: "percussion",
      loop: dawnDrum,
      velocity: 0.15,
      enter: 48,
      exit: 64,
      pan: -0.1,
    },
    {
      voice: "snare",
      stem: "percussion",
      loop: marchSnare,
      velocity: 0.072,
      enter: 48,
      exit: 62,
      pan: -0.18,
    },
    {
      voice: "kick",
      stem: "percussion",
      loop: "C2:2 -:2",
      velocity: 0.16,
      enter: 48,
      exit: 62,
      day: true,
    },
    {
      voice: "shaker",
      stem: "percussion",
      loop: "C4:.5:.9 C4:.5:.45",
      velocity: 0.032,
      enter: 48,
      exit: 62,
      pan: 0.3,
    },
    {
      voice: "bell",
      stem: "harmony",
      loop: "E5:2 -:2 B5:4",
      velocity: 0.08,
      enter: 62,
      exit: 64,
      pan: 0.35,
    },

    // --- Section 6: Sun on the eaves (bars 64-76, intimate E-major Stardew interlude) ---
    {
      voice: "piano",
      stem: "harmony",
      loop: seq(pianoRoll, eaves),
      velocity: 0.135,
      enter: 64,
      exit: 76,
      pan: -0.18,
    },
    {
      voice: "guitar",
      stem: "harmony",
      loop: seq(guitarPick, eaves),
      velocity: 0.15,
      enter: 64,
      exit: 76,
      pan: 0.24,
    },
    {
      voice: "bass",
      stem: "bass",
      loop: seq(low, eaves),
      velocity: 0.14,
      enter: 64,
      exit: 76,
    },
    {
      voice: "flute",
      stem: "melody",
      loop: eavesFlute,
      velocity: 0.14,
      enter: 64,
      exit: 76,
      pan: -0.1,
    },
    {
      voice: "clarinet",
      stem: "melody",
      loop: eavesClarinet,
      velocity: 0.14,
      enter: 64,
      exit: 76,
      pan: 0.14,
    },
    // Three-beat polymetric kalimba sparkle against the 4/4 bar.
    {
      voice: "kalimba",
      stem: "harmony",
      loop: "B5:.5 E6:.5 G#5:.5 -:1.5",
      velocity: 0.105,
      enter: 64,
      exit: 74,
      pan: 0.38,
    },
    {
      voice: "celesta",
      stem: "harmony",
      loop: "-:6 G#5:.5 B5:.5 E6:1 -:6 F#5:.5 A5:.5 D6:1",
      velocity: 0.1,
      enter: 72,
      exit: 76,
      pan: -0.34,
      echo: [0.75, 2, 0.45],
    },
    {
      voice: "brush",
      stem: "percussion",
      loop: "-:1 C4:1",
      velocity: 0.048,
      enter: 64,
      exit: 74,
      pan: 0.26,
    },

    // --- Section 7: Footsteps in the dew (bars 76-88, quiet dawn coda) ---
    {
      voice: "harp",
      stem: "harmony",
      loop: seq(harpArp, mist),
      velocity: 0.14,
      enter: 76,
      exit: 84,
      pan: -0.26,
    },
    {
      voice: "harp",
      stem: "harmony",
      loop: `${seq(harpSlow, "Cmaj7 D Em9")} E3+B3+F#4+G4:4`,
      velocity: 0.13,
      enter: 84,
      exit: 88,
      pan: -0.26,
      fade: [1, 0.45],
    },
    {
      voice: "bass",
      stem: "bass",
      loop: `${seq(low, "Em9 Dadd9/F# Cmaj7 Bsus4 Em9 Cmaj7 Am9 B7 Cmaj7 D")} E2:8`,
      velocity: 0.13,
      enter: 76,
      exit: 88,
      fade: [1, 0.4],
    },
    {
      voice: "choir",
      stem: "harmony",
      loop: seq(choirPad, dew),
      velocity: 0.046,
      enter: 76,
      exit: 88,
      fade: [1, 0.3],
    },
    {
      voice: "duduk",
      stem: "melody",
      loop: codaDuduk,
      velocity: 0.155,
      enter: 78,
      exit: 84,
      pan: -0.06,
    },
    {
      voice: "celesta",
      stem: "harmony",
      loop: "-:2 F#5:1 B5:1 -:4 -:2 E5:1 G5:1 -:4",
      velocity: 0.1,
      enter: 76,
      exit: 84,
      pan: 0.36,
      echo: [0.75, 2, 0.45],
      fade: [1, 0.4],
    },
    {
      voice: "bell",
      stem: "harmony",
      loop: "E5:2 -:6 B5:4 -:4",
      velocity: 0.07,
      enter: 84,
      exit: 88,
      pan: 0.35,
      fade: [1, 0.5],
    },
  ],
};
