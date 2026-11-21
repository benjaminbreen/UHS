import type { LayeredTheme } from "./layered-themes";

const seq = (table: Record<string, string>, chords: string) =>
  chords
    .split(" ")
    .map((c) => table[c])
    .join(" ");

// --- Tranquil default home theme: "Hearth and window" (60 bars, 3/4 at 84 BPM = 2:09) ---

const hIntro = "Dadd9 Gmaj7/D Dadd9 Gmaj7/D",
  hRoomA = "Dadd9 A/C# Bm7 F#m7 Gmaj7 D/F# Em7 Asus4",
  hRoomB = "Dadd9 A/C# Bm7 F#m7 Gmaj7 Em7 Asus4 Dadd9",
  hWindow = "Bm7 F#m7 Gmaj7 Dadd9 Em7 Bm7 Cmaj7 Asus4 Gmaj7 F#m7 Em7 D/F# Gmaj7 Asus4 Dadd9 Dadd9",
  hClose = "Gmaj7 Dadd9 Gmaj7 Dadd9 Em7 Asus4 Dadd9";

// Warm fingerpicked 3/4 acoustic guitar: thumb on 1, gentle treble roll on 2 & 3.
const hGuitar: Record<string, string> = {
  Dadd9: "D3:.5 A3:.5 E4:.5 F#4:.5 A3:.5 E4:.5",
  "Gmaj7/D": "D3:.5 B3:.5 F#4:.5 G4:.5 B3:.5 F#4:.5",
  "A/C#": "C#3:.5 A3:.5 E4:.5 A4:.5 E4:.5 A3:.5",
  Bm7: "B2:.5 F#3:.5 A3:.5 D4:.5 A3:.5 F#3:.5",
  "F#m7": "F#2:.5 C#3:.5 E3:.5 A3:.5 E3:.5 C#3:.5",
  Gmaj7: "G2:.5 D3:.5 F#3:.5 B3:.5 F#3:.5 D3:.5",
  "D/F#": "F#2:.5 D3:.5 A3:.5 D4:.5 A3:.5 D3:.5",
  Em7: "E2:.5 B2:.5 D3:.5 G3:.5 D3:.5 B2:.5",
  Asus4: "A2:.5 E3:.5 A3:.5 D4:.5 C#4:.5 A3:.5",
  Cmaj7: "C3:.5 G3:.5 B3:.5 E4:.5 B3:.5 G3:.5",
};

const hBass: Record<string, string> = {
  Dadd9: "D2:2 -:1",
  "Gmaj7/D": "D2:2 -:1",
  "A/C#": "C#2:2 -:1",
  Bm7: "B1:2 -:1",
  "F#m7": "F#2:2 -:1",
  Gmaj7: "G2:2 -:1",
  "D/F#": "F#2:2 -:1",
  Em7: "E2:2 -:1",
  Asus4: "A1:2 -:1",
  Cmaj7: "C2:2 -:1",
};

// Sparse, tender right-hand piano melody (16 bars = 48 beats) with generous rests.
const hPianoRoom =
  "F#4:2:.9 E4:1:.85 E4:2:.9 C#4:1:.8 D4:2:.9 F#4:1:.85 E4:2.5:.8 -:.5 " +
  "B4:2:.95 A4:1:.85 F#4:2:.85 D4:1:.8 E4:2:.85 G4:1:.85 E4:2.5:.8 -:.5 " +
  "F#4:2:.9 A4:1:.95 E4:2:.85 A4:1:.9 B4:2:.95 F#4:1:.85 A4:2:.85 -:1 " +
  "B4:1.5:.95 A4:.5:.85 G4:1:.85 F#4:1.5:.9 E4:.5:.85 D4:1:.8 E4:2:.85 F#4:1:.85 D4:3:.85";

// Soft piano comping under the cello in "By the window" (16 bars = 48 beats).
const hPianoWindow =
  "-:1 D4+F#4:2 -:1 C#4+E4:2 -:1 B3+F#4:2 -:1 A3+E4:2 " +
  "-:1 B3+G4:2 -:1 D4+F#4:2 -:1 B3+E4:2 -:1 C#4+E4:2 " +
  "-:1 B3+F#4:2 -:1 A3+E4:2 -:1 B3+G4:2 -:1 A3+F#4:2 " +
  "-:1 B3+F#4:2 -:1 C#4+E4:2 -:1 A3+E4:2 -:3";

// Warm, breathing low/mid cello melody for "By the window" (16 bars = 48 beats).
const hCelloWindow =
  "D4:2:.9 B3:1:.85 C#4:2:.9 A3:1:.8 B3:2:.95 D4:1:.9 A3:2.5:.85 -:.5 " +
  "G3:2:.85 B3:1:.9 F#3:2:.85 D4:1:.9 E4:2:.95 D4:1:.9 C#4:2.5:.85 -:.5 " +
  "B3:2:.9 D4:1:.95 C#4:2:.9 A3:1:.85 G3:2:.85 B3:1:.9 A3:2:.85 F#3:1:.8 " +
  "G3:2:.9 B3:1:.9 A3:2:.85 G3:1:.8 F#3:3:.85 -:3";

// Gentle cello counter-replies during the return (16 bars = 48 beats).
const hCelloReturn =
  "-:6 F#3:2:.85 A3:1:.85 A3:2:.8 -:1 " +
  "-:6 G3:2:.85 B3:1:.85 A3:2.5:.8 -:.5 " +
  "-:6 F#3:2:.85 D4:1:.9 C#4:2:.85 -:1 " +
  "G3:2:.85 B3:1:.85 G3:2:.85 B3:1:.85 A3:2:.85 G3:1:.8 F#3:3:.85";

/** A tranquil, understated piece for inns, caravanserais, and traveller lodgings. */
export const innTheme: LayeredTheme = {
  id: "inside-hearth-and-window",
  title: "Hearth and window",
  subtitle:
    "A quiet three-quarter sway for an inn or lodging house. Fingerpicked guitar keeps the room warm while sparse piano phrases leave room to breathe; a low cello looks out the window in the middle, and the room settles back onto a single open chord.",
  place: "Indoors, an inn or lodging house",
  culture: [],
  years: [-13000, 2026],
  evidence: "Fiction: an original tranquil domestic piece for any home.",
  bpm: 84,
  meter: 3,
  bars: 60,
  key: "D major, with a B minor middle",
  reverb: [0.2, 1.8],
  sections: [
    { bar: 0, label: "Opening the latch" },
    { bar: 4, label: "Warm room" },
    { bar: 20, label: "By the window" },
    { bar: 36, label: "Kettle on the coals" },
    { bar: 52, label: "Quiet evening" },
  ],
  layers: [
    {
      voice: "guitar",
      stem: "harmony",
      loop: seq(hGuitar, `${hIntro} ${hRoomA} ${hRoomB} ${hWindow} ${hRoomA} ${hRoomB}`),
      velocity: 0.165,
      enter: 0,
      exit: 52,
      pan: -0.22,
    },
    {
      voice: "guitar",
      stem: "harmony",
      loop: `${seq(hGuitar, hClose)} D3+A3+E4+F#4:3`,
      velocity: 0.15,
      enter: 52,
      exit: 60,
      pan: -0.22,
      fade: [1, 0.55],
    },
    {
      voice: "bass",
      stem: "bass",
      loop: seq(hBass, `${hRoomB} ${hWindow} ${hRoomA} ${hRoomB}`),
      velocity: 0.135,
      enter: 12,
      exit: 52,
    },
    {
      voice: "bass",
      stem: "bass",
      loop: `${seq(hBass, hClose)} D2:3`,
      velocity: 0.12,
      enter: 52,
      exit: 60,
      fade: [1, 0.45],
    },
    {
      voice: "piano",
      stem: "melody",
      loop: hPianoRoom,
      velocity: 0.175,
      enter: 4,
      exit: 20,
      pan: 0.18,
    },
    {
      voice: "piano",
      stem: "harmony",
      loop: hPianoWindow,
      velocity: 0.12,
      enter: 20,
      exit: 36,
      pan: 0.2,
    },
    {
      voice: "cello",
      stem: "melody",
      loop: hCelloWindow,
      velocity: 0.135,
      enter: 20,
      exit: 36,
      pan: -0.1,
    },
    {
      voice: "piano",
      stem: "melody",
      loop: hPianoRoom,
      velocity: 0.165,
      enter: 36,
      exit: 52,
      pan: 0.18,
    },
    {
      voice: "cello",
      stem: "harmony",
      loop: hCelloReturn,
      velocity: 0.11,
      enter: 36,
      exit: 52,
      pan: 0.26,
    },
    {
      voice: "celesta",
      stem: "harmony",
      loop: "-:21 A5:1.5 F#5:1.5 -:21 E5:1.5 D5:1.5",
      velocity: 0.085,
      enter: 4,
      exit: 20,
      pan: -0.32,
    },
    {
      voice: "celesta",
      stem: "harmony",
      loop: "-:21 A5:1.5 F#5:1.5 -:21 E5:1.5 D5:1.5",
      velocity: 0.085,
      enter: 36,
      exit: 52,
      pan: -0.32,
    },
    {
      voice: "celesta",
      stem: "harmony",
      loop: "-:6 A5:1.5 F#5:1.5 -:9 E5:1.5 D5:4.5",
      velocity: 0.085,
      enter: 52,
      exit: 60,
      pan: -0.32,
      fade: [1, 0.5],
    },
    {
      voice: "brush",
      stem: "percussion",
      loop: "-:1 C4:1 -:1",
      velocity: 0.045,
      enter: 20,
      exit: 48,
      pan: 0.3,
    },
  ],
};

// --- Zany home-with-happy-kids theme: "Kettle, broom, and crooked clock" (64 bars, 4/4 at 118 BPM) ---

const a1 = "G E7 Am7 D7 G G#dim7 Am7 D7",
  a2 = "G E7 Am7 D7 G B7 Em-A7 D7",
  sleuth = "Em Em/D# Em/D Em/C# C7 B7 Em B7",
  ebTrip = "EbMaj7 Cm7 Fm7 Bb7 EbMaj7 G7 Cm7 F7 Fm7 Bb7 Am7b5 D7",
  homeReturn = "G E7 Am7 D7 G G#dim7 Am7 D7",
  tag = "G-F E7-Eb7 D7 G";

const v: Record<string, string> = {
  G: "B3+D4+G4",
  E7: "G#3+B3+D4",
  Am7: "G3+C4+E4",
  D7: "F#3+C4+D4",
  "G#dim7": "G#3+B3+D4+F4",
  B7: "A3+B3+D#4",
  Em: "G3+B3+E4",
  A7: "G3+C#4+E4",
  C7: "G3+Bb3+E4",
  Bb7: "Ab3+Bb3+D4",
  EbMaj7: "G3+Bb3+D4+Eb4",
  Cm7: "G3+Bb3+C4+Eb4",
  Fm7: "Ab3+C4+Eb4",
  G7: "G3+B3+F4",
  F7: "A3+C4+Eb4",
  Am7b5: "G3+C4+Eb4",
  F: "A3+C4+F4",
  Eb7: "G3+Bb3+Db4",
};

const stab = (a: string, b = a) => `-:1 ${v[a]}:.5:.9 -:.5 -:1 ${v[b]}:.5:.8 -:.5`;
const comp: Record<string, string> = {
  G: stab("G"),
  E7: stab("E7"),
  Am7: stab("Am7"),
  D7: stab("D7"),
  "G#dim7": stab("G#dim7"),
  B7: stab("B7"),
  "Em-A7": stab("Em", "A7"),
  "G-F": stab("G", "F"),
  "E7-Eb7": stab("E7", "Eb7"),
  EbMaj7: `-:.5 ${v.EbMaj7}:.5:.85 -:1 ${v.EbMaj7}:.5:.75 -:1.5`,
  Cm7: `-:.5 ${v.Cm7}:.5:.85 -:1 ${v.Cm7}:.5:.75 -:1.5`,
  Fm7: `-:.5 ${v.Fm7}:.5:.85 -:1 ${v.Fm7}:.5:.75 -:1.5`,
  Bb7: `-:.5 ${v.Bb7}:.5:.85 -:1 ${v.Bb7}:.5:.75 -:1.5`,
  G7: `-:.5 ${v.G7}:.5:.85 -:1 ${v.G7}:.5:.75 -:1.5`,
  F7: `-:.5 ${v.F7}:.5:.85 -:1 ${v.F7}:.5:.75 -:1.5`,
  Am7b5: `-:.5 ${v.Am7b5}:.5:.85 -:1 ${v.Am7b5}:.5:.75 -:1.5`,
};

const low: Record<string, string> = {
  G: "G2:.75 -:.25 D2:.5 -:.5 B2:.75 -:.25 D2:.5 -:.5",
  E7: "E2:.75 -:.25 B1:.5 -:.5 G#2:.75 -:.25 B1:.5 -:.5",
  Am7: "A2:.75 -:.25 E2:.5 -:.5 C3:.75 -:.25 E2:.5 -:.5",
  D7: "D2:.75 -:.25 A2:.5 -:.5 F#2:.75 -:.25 A2:.5 -:.5",
  "G#dim7": "G#2:.75 -:.25 D2:.5 -:.5 F2:.75 -:.25 B2:.5 -:.5",
  B7: "B1:.75 -:.25 F#2:.5 -:.5 D#2:.75 -:.25 F#2:.5 -:.5",
  "Em-A7": "E2:.75 -:.25 G2:.5 -:.5 A2:.75 -:.25 C#3:.5 -:.5",
  Em: "E2:.75 -:.25 B2:.5 -:.5 E2:.75 -:.25 G2:.5 -:.5",
  "Em/D#": "D#2:.75 -:.25 B2:.5 -:.5 D#2:.75 -:.25 F#2:.5 -:.5",
  "Em/D": "D2:.75 -:.25 B2:.5 -:.5 D2:.75 -:.25 G2:.5 -:.5",
  "Em/C#": "C#2:.75 -:.25 A2:.5 -:.5 C#2:.75 -:.25 G2:.5 -:.5",
  C7: "C2:.75 -:.25 G2:.5 -:.5 Bb2:.75 -:.25 G2:.5 -:.5",
  EbMaj7: "Eb2:1.5 Bb2:.5 G2:1 Bb2:1",
  Cm7: "C2:1.5 G2:.5 Eb2:1 G2:1",
  Fm7: "F2:1.5 C3:.5 Ab2:1 C3:1",
  Bb7: "Bb1:1.5 F2:.5 D2:1 F2:1",
  G7: "G2:1.5 D2:.5 B1:1 D2:1",
  F7: "F2:1.5 C2:.5 A1:1 C2:1",
  Am7b5: "A2:1.5 Eb2:.5 C2:1 Eb2:1",
  "G-F": "G2:.75 -:.25 D2:.5 -:.5 F2:.75 -:.25 C2:.5 -:.5",
  "E7-Eb7": "E2:.75 -:.25 B1:.5 -:.5 Eb2:.75 -:.25 Bb1:.5 -:.5",
};

const sleuthPluck =
  "E3:.5 G3:.5 B3:.5 -:.5 E4:.5 -:.5 B3:.5 -:.5 " +
  "D#3:.5 F#3:.5 B3:.5 -:.5 D#4:.5 -:.5 B3:.5 -:.5 " +
  "D3:.5 G3:.5 B3:.5 -:.5 D4:.5 -:.5 B3:.5 -:.5 " +
  "C#3:.5 G3:.5 Bb3:.5 -:.5 C#4:.5 -:.5 Bb3:.5 -:.5 " +
  "C3:.5 E3:.5 Bb3:.5 -:.5 C4:.5 -:.5 Bb3:.5 -:.5 " +
  "B2:.5 D#3:.5 A3:.5 -:.5 B3:.5 -:.5 A3:.5 -:.5 " +
  "E3:.5 G3:.5 B3:.5 -:.5 G3:.5 -:.5 E3:.5 -:.5 " +
  "B2:.5 F#3:.5 A3:.5 D#4:.5 -:.5 B3:.5 -:.5 -:.5";

const balafonA1 =
  "D5:.5 B4:.5 G4:.5 -:.5 C#5:.5 D5:.5 B4:.5 -:.5 " +
  "G#4:.5 B4:.5 D5:.5 E5:.5 -:.5 D5:.5 B4:.5 -:.5 " +
  "C5:.5 E5:.5 G5:.5 -:.5 E5:.5 C5:.5 A4:.5 -:.5 " +
  "F#4:.5 A4:.5 C5:.5 D5:.5 -:2 " +
  "D5:.5 B4:.5 G4:.5 -:.5 G5:.5 F#5:.5 D5:.5 -:.5 " +
  "F5:.5 D5:.5 B4:.5 G#4:.5 -:.5 B4:.5 D5:.5 -:.5 " +
  "E5:.5 C5:.5 A4:.5 G4:.5 F#4:.5 A4:.5 C5:.5 E5:.5 " +
  "D5:1 -:3";

const clarinetA2 =
  "B4:.5 D5:.5 G5:.5 -:.5 F#5:.5 E5:.5 D5:.5 -:.5 " +
  "D5:.5 B4:.5 G#4:.5 -:.5 -:2 " +
  "A4:.5 C5:.5 E5:.5 G5:.5 -:.5 F#5:.5 E5:.5 -:.5 " +
  "D5:.5 C5:.5 A4:.5 F#4:.5 -:2 " +
  "G4:.5 B4:.5 D5:.5 -:.5 A#4:.5 B4:.5 D5:.5 -:.5 " +
  "F#5:.5 D#5:.5 B4:.5 -:.5 -:2 " +
  "E5:.5 G5:.5 B5:.5 -:.5 G5:.5 E5:.5 C#5:.5 -:.5 " +
  "D5:.5 C5:.5 A4:.5 F#4:.5 G4:.5 -:1.5";

const mutedWinks =
  "-:6 D5:.5:.95 E5:.5:.9 F5:.5:1 E5:.5:.85 " +
  "-:6 A4:.5:.9 C5:.5:.95 D5:.5:1 -:.5 " +
  "-:6 B4:.5:.95 D#5:.5:1 F#5:.5:1.05 -:.5 " +
  "-:6 C5:.5:.95 B4:.5:.9 A4:.5:.85 -:.5";

const sleuthMuted =
  "B4:.5 G4:.5 E4:.5 -:.5 B4:.5 -:.5 G4:.5 -:.5 " +
  "B4:.5 F#4:.5 D#4:.5 -:.5 A4:.5 G4:.5 F#4:.5 -:.5 " +
  "B4:.5 G4:.5 D4:.5 -:.5 D5:.5 C5:.5 B4:.5 -:.5 " +
  "Bb4:.5 G4:.5 E4:.5 -:.5 C#5:.5 Bb4:.5 G4:.5 -:.5 " +
  "E5:1:.95 D5:.5:.9 C5:.5:.9 Bb4:.5:.85 G4:.5:.85 E4:.5:.8 -:.5 " +
  "F#4:.5 A4:.5 B4:.5 D#5:.5 -:2 " +
  "G4:.5 B4:.5 E5:.5 -:.5 F#5:.5 E5:.5 B4:.5 -:.5 " +
  "D#5:1:1 B4:.5:.85 -:.5 -:2";

const ebAccordion =
  "G4:1:.95 Bb4:.5:.9 D5:1:1 C5:.5:.9 Bb4:1:.85 " +
  "G4:1:.9 Eb4:.5:.85 G4:1:.95 Bb4:1.5:1 " +
  "Ab4:1:.95 C5:.5:.95 Eb5:1:1.05 D5:.5:.95 C5:1:.9 " +
  "Bb4:1.5:1 Ab4:.5:.9 G4:1:.85 F4:1:.85 " +
  "G4:1:.95 Bb4:.5:.95 D5:1:1.05 F5:.5:1 Eb5:1:.95 " +
  "D5:1.5:1 B4:.5:.95 G4:1:.9 B4:1:.95 " +
  "C5:1:.95 Eb5:.5:1 G5:1:1.05 F5:.5:1 Eb5:1:.95 " +
  "Eb5:1.5:1 C5:.5:.95 A4:2:.9 " +
  "Ab4:1:.95 C5:.5:.95 Eb5:1:1 C5:.5:.9 Ab4:1:.85 " +
  "Bb4:1:.95 D5:.5:.95 F5:1:1.05 D5:1.5:.95 " +
  "Eb5:1:1 C5:.5:.95 A4:1:.9 G4:.5:.85 Eb4:1:.85 " +
  "F#4:1:.95 A4:.5:.95 C5:1:1 D5:1:1.05 -:.5";

const returnClarinet =
  "B4:.5 D5:.5 G5:.5 -:.5 F#5:.5 E5:.5 D5:.5 -:.5 " +
  "G#4:.5 B4:.5 D5:.5 E5:.5 -:.5 D5:.5 B4:.5 -:.5 " +
  "-:8 " +
  "G4:.5 B4:.5 D5:.5 -:.5 G5:.5 F#5:.5 D5:.5 -:.5 " +
  "F5:.5 D5:.5 B4:.5 G#4:.5 -:.5 B4:.5 D5:.5 -:.5 " +
  "-:8";

const returnBalafon =
  "-:8 " +
  "C5:.5 E5:.5 G5:.5 -:.5 E5:.5 C5:.5 A4:.5 -:.5 " +
  "F#4:.5 A4:.5 C5:.5 D5:.5 -:.5 C5:.5 A4:.5 -:.5 " +
  "-:8 " +
  "E5:.5 C5:.5 A4:.5 G4:.5 F#4:.5 A4:.5 C5:.5 E5:.5 " +
  "D5:.5 C5:.5 A4:.5 F#4:.5 G4:1 -:1";

const tagClarinet =
  "B4:.5 D5:.5 G5:1 A4:.5 C5:.5 F5:1 " +
  "G#4:.5 B4:.5 E5:1 G4:.5 Bb4:.5 Db5:1 " +
  "C5:.5 A4:.5 F#4:.5 A4:.5 C5:.5 D5:.5 F#5:.5 A5:.5 " +
  "G5:1 -:.5 D5:.5 G5:1 -:1";

const woodGroove = "G5:.5:.9 -:.5 E5:.5:.7 -:.5 G5:.5:.85 E5:.5:.6 -:.5 G5:.5:.8";
const uduGroove = "G2:.75:1 -:.75 D3:.5:.8 G2:.75:.9 -:.25 D3:.5:.75 -:.5";
const guiroGroove = "-:.5 C4:.5:.85 -:1 -:.5 C4:.5:.7 C4:.5:.9 -:.5";
const kickGroove = "C2:1:1 -:1 C2:.5:.85 -:.5 C2:1:.9";
const snareOff = "-:1 C4:.5:.9 -:.5 -:1 C4:.5:.85 -:.5";

/** A quirky, swung indoor piece for home when happy young children are near or you speak with them. */
export const homePlayTheme: LayeredTheme = {
  id: "inside-kettle-play",
  title: "Kettle, broom, and crooked clock",
  subtitle:
    "A zany, swung house groove for when young children are happy nearby. A clay pot drum, two woodblocks and a gourd scraper set a bouncy pocket; balafon and clarinet trade sly staccato lines with a cup-muted trumpet winking in the rests; a minor-key tiptoe breaks into a dead-stop percussion gag, slips sideways into an E-flat accordion detour, and peels back down to a single last pot-drum bloop.",
  place: "Indoors, home with young children",
  culture: [],
  years: [-13000, 2026],
  evidence:
    "Fiction: an original, eccentric indoor theme in the playful spirit of Stardew Valley and 16-bit town/house scores.",
  bpm: 118,
  meter: 4,
  bars: 64,
  key: "G major, with E minor and E-flat major detours",
  swing: [0.5, 0.09],
  reverb: [0.11, 0.9],
  sections: [
    { bar: 0, label: "Kettle & broom" },
    { bar: 4, label: "Puttering around" },
    { bar: 12, label: "Clarinet & winks" },
    { bar: 20, label: "Looking for the key" },
    { bar: 28, label: "Wait—found it!" },
    { bar: 32, label: "Crooked clock detour" },
    { bar: 44, label: "Everyone in the kitchen" },
    { bar: 56, label: "Putting the kettle back" },
  ],
  layers: [
    {
      voice: "bass",
      stem: "bass",
      loop: `${low.G} ${low.Am7} ${low.G} G2:.5 B2:.5 D3:.5 Eb3:.5 D3:.5 B2:.5 A2:.5 F#2:.5`,
      velocity: 0.23,
      enter: 0,
      exit: 4,
    },
    { voice: "udu", stem: "percussion", loop: uduGroove, velocity: 0.22, enter: 0, exit: 20, pan: -0.22 },
    { voice: "wood", stem: "percussion", loop: woodGroove, velocity: 0.15, enter: 0, exit: 28, pan: 0.34 },
    { voice: "guiro", stem: "percussion", loop: guiroGroove, velocity: 0.12, enter: 2, exit: 20, pan: -0.36 },
    { voice: "kick", stem: "percussion", loop: kickGroove, velocity: 0.28, enter: 2, exit: 20 },

    { voice: "bass", stem: "bass", loop: seq(low, `${a1} ${a2}`), velocity: 0.23, enter: 4, exit: 20 },
    { voice: "harpsichord", stem: "harmony", loop: seq(comp, a1), velocity: 0.145, enter: 4, exit: 12, pan: 0.28 },
    { voice: "balafon", stem: "melody", loop: balafonA1, velocity: 0.22, enter: 4, exit: 12, pan: -0.14 },
    { voice: "clap", stem: "percussion", loop: "-:1 C4:.5:.9 -:2.5", velocity: 0.11, enter: 8, exit: 20, pan: -0.32 },

    { voice: "accordion", stem: "harmony", loop: seq(comp, a2), velocity: 0.11, enter: 12, exit: 20, pan: 0.26 },
    { voice: "clarinet", stem: "melody", loop: clarinetA2, velocity: 0.19, enter: 12, exit: 20, pan: -0.12 },
    { voice: "muted", stem: "harmony", loop: mutedWinks, velocity: 0.2, enter: 12, exit: 20, pan: 0.32 },
    { voice: "snare", stem: "percussion", loop: snareOff, velocity: 0.12, enter: 12, exit: 20, pan: 0.18 },

    { voice: "bass", stem: "bass", loop: seq(low, sleuth), velocity: 0.22, enter: 20, exit: 28 },
    { voice: "pluck", stem: "harmony", loop: sleuthPluck, velocity: 0.18, enter: 20, exit: 28, pan: -0.26 },
    { voice: "muted", stem: "melody", loop: sleuthMuted, velocity: 0.21, enter: 20, exit: 28, pan: 0.12 },
    { voice: "balafon", stem: "harmony", loop: "-:3.5 E5:.5:.8 -:3.5 D#5:.5:.8 -:3.5 D5:.5:.8 -:3.5 C#5:.5:.8 -:7.5 B4:.5:.85 -:8", velocity: 0.17, enter: 20, exit: 28, pan: 0.36 },
    { voice: "shaker", stem: "percussion", loop: "C4:.5:.9 C4:.5:.45", velocity: 0.065, enter: 20, exit: 28, pan: -0.3 },
    { voice: "snare", stem: "percussion", loop: "-:2 C4:.5:.75 -:1.5", velocity: 0.1, enter: 20, exit: 28, pan: 0.2 },

    {
      voice: "accordion",
      stem: "harmony",
      loop: `${v.C7}:.5:1.1 -:3.5 ${v.B7}:.5:1.1 -:3.5 ${v.Bb7}:.5:1.1 -:3.5 ${v.A7}:.5:1.1 -:1.5 ${v.D7}:.5:1.1 -:1.5`,
      velocity: 0.18,
      enter: 28,
      exit: 32,
      pan: -0.15,
    },
    {
      voice: "bass",
      stem: "bass",
      loop: "C2:.75:1.1 -:3.25 B1:.75:1.1 -:3.25 Bb1:.75:1.1 -:3.25 A1:.75:1.1 -:1.25 D2:.75:1.1 -:1.25",
      velocity: 0.24,
      enter: 28,
      exit: 32,
    },
    {
      voice: "udu",
      stem: "percussion",
      loop: "-:1.5 G2:.5:.95 D3:.5:1 G2:.5:.9 -:.5 -:.5 -:1.5 A2:.5:.95 D3:.5:1 A2:.5:.9 -:.5 -:.5 -:1.5 G2:.5:.95 C3:.5:1 G2:.5:.9 -:.5 -:.5 -:1 G2:.5:1 -:.5 -:1 D3:.5:1 -:.5",
      velocity: 0.24,
      enter: 28,
      exit: 32,
      pan: -0.2,
    },
    {
      voice: "wood",
      stem: "percussion",
      loop: "-:1 G5:.5:.9 E5:.5:.8 -:2 -:1 A5:.5:.9 F#5:.5:.8 -:2 -:1 G5:.5:.9 E5:.5:.8 -:2 -:1 G5:.5:.9 E5:.5:.8 G5:.5:.95 -:1.5",
      velocity: 0.17,
      enter: 28,
      exit: 32,
      pan: 0.34,
    },
    {
      voice: "kalimba",
      stem: "melody",
      loop: "-:2 E5:.5 G5:.5 Bb5:.5 -:.5 -:2 D#5:.5 F#5:.5 A5:.5 -:.5 -:2 D5:.5 F5:.5 Ab5:.5 -:.5 -:2.5 C#5:.5 D5:.5 F#5:.5",
      velocity: 0.19,
      enter: 28,
      exit: 32,
      pan: 0.24,
    },

    { voice: "bass", stem: "bass", loop: seq(low, ebTrip), velocity: 0.22, enter: 32, exit: 44 },
    { voice: "harpsichord", stem: "harmony", loop: seq(comp, ebTrip), velocity: 0.115, enter: 32, exit: 44, pan: -0.28 },
    { voice: "accordion", stem: "melody", loop: ebAccordion, velocity: 0.2, enter: 32, exit: 44, pan: 0.08 },
    { voice: "kalimba", stem: "harmony", loop: "Bb5:.5:.9 G5:.5:.75 Eb5:.5:.85 -:1.5", velocity: 0.145, enter: 32, exit: 42, pan: 0.36 },
    { voice: "brush", stem: "percussion", loop: "-:1 C4:1", velocity: 0.12, enter: 32, exit: 44, pan: 0.24 },
    { voice: "kick", stem: "percussion", loop: "C2:1 -:1 C2:1 -:1", velocity: 0.24, enter: 32, exit: 44 },
    { voice: "wood", stem: "percussion", loop: "-:2.5 D5:.5:.75 -:1", velocity: 0.11, enter: 36, exit: 44, pan: -0.34 },

    { voice: "bass", stem: "bass", loop: seq(low, `${homeReturn} ${tag}`), velocity: 0.24, enter: 44, exit: 56 },
    { voice: "harpsichord", stem: "harmony", loop: seq(comp, `${homeReturn} ${tag}`), velocity: 0.135, enter: 44, exit: 56, pan: 0.3 },
    { voice: "accordion", stem: "harmony", loop: seq(comp, `${homeReturn} ${tag}`), velocity: 0.1, enter: 44, exit: 56, pan: -0.28 },
    { voice: "clarinet", stem: "melody", loop: `${returnClarinet} ${tagClarinet}`, velocity: 0.195, enter: 44, exit: 56, pan: -0.14 },
    { voice: "balafon", stem: "melody", loop: returnBalafon, velocity: 0.22, enter: 44, exit: 52, pan: 0.16 },
    { voice: "muted", stem: "harmony", loop: "-:14 D5:.5:1 F#5:.5:1 A5:1:1.05 -:14 D5:.5:1 F#5:.5:1 G5:1:1.05 -:12 G5:.5:1 -:.5 D5:.5:.9 G5:1:1.05 -:1.5", velocity: 0.2, enter: 44, exit: 56, pan: 0.32 },
    { voice: "kick", stem: "percussion", loop: kickGroove, velocity: 0.3, enter: 44, exit: 56 },
    { voice: "udu", stem: "percussion", loop: uduGroove, velocity: 0.22, enter: 44, exit: 56, pan: -0.22 },
    { voice: "wood", stem: "percussion", loop: woodGroove, velocity: 0.155, enter: 44, exit: 56, pan: 0.34 },
    { voice: "guiro", stem: "percussion", loop: guiroGroove, velocity: 0.125, enter: 44, exit: 55, pan: -0.36 },
    { voice: "snare", stem: "percussion", loop: snareOff, velocity: 0.13, enter: 44, exit: 55, pan: 0.18 },
    { voice: "clap", stem: "percussion", loop: "-:1 C4:.5:.95 -:2.5", velocity: 0.115, enter: 48, exit: 55, pan: -0.32 },

    { voice: "bass", stem: "bass", loop: `${seq(low, "G Am7 G Am7 G D7")} G2:1 -:3 -:4`, velocity: 0.2, enter: 56, exit: 64, fade: [1, 0.55] },
    { voice: "kalimba", stem: "melody", loop: "D5:.5 B4:.5 G4:1 -:2 C5:.5 A4:.5 E4:1 -:2 D5:.5 B4:.5 G4:1 -:2 A4:.5 F#4:.5 D4:1 -:2 G4:2 -:2 -:12", velocity: 0.17, enter: 56, exit: 64, pan: 0.22 },
    { voice: "clarinet", stem: "melody", loop: "-:8 B4:.5 D5:.5 G5:.5 -:.5 E5:.5 C5:.5 A4:1 -:20", velocity: 0.16, enter: 56, exit: 64, pan: -0.14 },
    { voice: "wood", stem: "percussion", loop: "G5:.5:.85 -:.5 E5:.5:.65 -:2.5", velocity: 0.13, enter: 56, exit: 62, pan: 0.34, fade: [1, 0.45] },
    { voice: "udu", stem: "percussion", loop: "-:28 G2:.5:.9 D3:.5:1 G2:1:1.05 -:2", velocity: 0.23, enter: 56, exit: 64, pan: -0.2 },
  ],
};
