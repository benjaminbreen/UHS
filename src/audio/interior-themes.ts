import type { PalaceStyle } from "../content/palaces/styles";
import type { LayeredTheme } from "./layered-themes";
import { homePlayTheme, innTheme } from "./home-theme";

export type InteriorMusic =
  | "chant"
  | "temple"
  | "tavern"
  | "inn"
  | "home"
  | "home-play"
  | "workshop"
  | "hall"
  | "cave"
  | "sewer"
  | "mine"
  | "court-baroque"
  | "court-china"
  | "court-roman"
  | "court-islamic"
  | "court-hall"
  | "opera"
  | "broadway"
  | "playhouse"
  | "stage-japan"
  | "cinema-silent"
  | "cinema-classic"
  | "cinema-modern";

const everywhere = {
  culture: [],
  years: [-13000, 10001] as [number, number],
  place: "Indoors, any place",
};

const chantA = "D4:1 F4:1 G4:1 A4:2 A4:1 G4:1 A4:1 C5:2 A4:1 G4:1 F4:1 G4:1 A4:3 -:1";
const chantB = "A4:1 C5:1 D5:2 C5:1 A4:1 G4:1 A4:1 F4:1 G4:1 E4:1 D4:3 -:2";
const chantC = "F4:1 G4:1 A4:1 A4:1 A4:1 G4:1 F4:1 E4:1 F4:2 G4:1 F4:1 E4:1 D4:4 -:2";

const jig = [
  "A4:2 F#4:1 A4:2 D5:1", "C5:2 A4:1 G4:3",
  "F#4:2 G4:1 A4:2 B4:1", "A4:3 F#4:2 E4:1",
  "D4:2 F#4:1 A4:2 D5:1", "E5:2 D5:1 C5:2 A4:1",
  "G4:1 A4:1 G4:1 F#4:2 E4:1", "D4:5 -:1",
].join(" ");

// A minuet: two eight-bar strains, the first played again after the second.
const minuetA = "D5:1 G5:1 F#5:1 E5:1 D5:2 C5:1 B4:1 A4:1 B4:2 G4:1 A4:1 B4:1 C5:1 D5:1 E5:.5 D5:.5 C5:1 B4:1 A4:1.5 G4:.5 G4:3";
const minuetB = "B4:1 E5:1 D#5:1 E5:1 B4:2 C5:1 A4:1 F#4:1 G4:2 E4:1 A4:1 D5:1 C#5:1 D5:1 A4:1 F#4:1 G4:.5 A4:.5 B4:1 A4:1 D5:3";
const minuetBassA = "G2:2 B2:1 C3:2 D3:1 E3:1 D3:1 C3:1 G2:2 B2:1 C3:2 A2:1 B2:1 C3:1 A2:1 D3:2 D2:1 G2:3";
const minuetBassB = "E3:2 B2:1 E3:2 G3:1 A2:2 B2:1 E3:2 E2:1 F#2:2 A2:1 D3:2 F#2:1 G2:1 E2:1 A2:1 D3:2 D2:1";
const minuetKeysA = [
  "G3:.5 B3:.5 D4:.5 G4:.5 D4:.5 B3:.5", "C4:.5 E4:.5 G4:.5 E4:.5 D4:.5 F#4:.5", "E4:.5 G4:.5 B4:.5 G4:.5 C4:.5 E4:.5", "G3:.5 B3:.5 D4:.5 G4:.5 D4:.5 B3:.5",
  "C4:.5 E4:.5 G4:.5 E4:.5 A3:.5 C4:.5", "B3:.5 D4:.5 G4:.5 E4:.5 C4:.5 A3:.5", "D4:.5 F#4:.5 A4:.5 F#4:.5 D4:.5 C4:.5", "G3:.5 B3:.5 D4:.5 G4:1.5",
].join(" ");
const minuetKeysB = [
  "E3:.5 G3:.5 B3:.5 E4:.5 B3:.5 G3:.5", "E3:.5 G3:.5 B3:.5 G4:.5 E4:.5 B3:.5", "A3:.5 C4:.5 E4:.5 C4:.5 B3:.5 D#4:.5", "E3:.5 G3:.5 B3:.5 E4:.5 B3:.5 G3:.5",
  "F#3:.5 A3:.5 D4:.5 A3:.5 F#3:.5 A3:.5", "D4:.5 F#4:.5 A4:.5 F#4:.5 D4:.5 A3:.5", "G3:.5 B3:.5 E3:.5 G3:.5 A3:.5 C#4:.5", "D3:.5 A3:.5 D4:.5 F#4:1.5",
].join(" ");

// A tune on five notes, in two halves of eight bars.
const audienceA = "A4:1 B4:.5 D5:.5 E5:2 D5:1 B4:1 A4:2 F#4:1 A4:.5 B4:.5 A4:1 F#4:1 E4:3 -:1 D4:1 E4:.5 F#4:.5 A4:2 B4:1 D5:1 B4:1 A4:1 F#4:1 E4:1 D4:1.5 E4:.5 D4:4";
const audienceB = "D5:1 E5:.5 F#5:.5 E5:2 D5:1 B4:1 D5:2 A4:1 B4:.5 A4:.5 F#4:1 E4:1 F#4:3 -:1 A4:1 F#4:.5 E4:.5 D4:2 E4:1 F#4:1 A4:1 B4:1 A4:1 F#4:1 E4:1.5 D4:.5 D4:4";

const romanA = "E4:1 F4:1 G4:2 A4:2 G4:1 F4:1 E4:2 D4:1 E4:1 F4:3 -:1 A4:1 B4:1 C5:2 B4:1 A4:1 G4:2 F4:1 G4:1 F4:1 E4:1 E4:4";
const romanB = "C5:2 D5:1 C5:1 B4:2 A4:2 G4:1 A4:1 B4:1 C5:1 A4:3 -:1 A4:1 G4:1 F4:2 G4:1 F4:1 E4:2 D4:1 E4:1 F4:1 D4:1 E4:4";

// Hijaz on D: the step from E flat to F sharp is what makes it.
const courtyardA = "D4:1 Eb4:1 F#4:2 G4:1 A4:1 G4:1 F#4:1 Eb4:2 F#4:1 Eb4:1 D4:3 -:1 A4:1 Bb4:1 C5:2 Bb4:1 A4:1 G4:1 A4:1 F#4:1 G4:.5 F#4:.5 Eb4:1 F#4:1 D4:4";
const courtyardB = "D5:2 C5:1 Bb4:1 A4:2 Bb4:.5 A4:.5 G4:1 A4:1 Bb4:1 C5:1 D5:1 A4:3 -:1 G4:1 A4:1 Bb4:1 A4:1 G4:1 F#4:1 Eb4:2 F#4:1 G4:1 F#4:.5 Eb4:.5 F#4:1 D4:4";

const tableA = "D4:1 F4:1 A4:1 G4:2 F4:1 E4:1 G4:1 E4:1 D4:2 C4:1 D4:1 F4:1 A4:1 C5:2 A4:1 G4:1 F4:1 E4:1 D4:3";
const tableB = "A4:1 C5:1 D5:1 C5:2 A4:1 G4:1 A4:1 C5:1 A4:3 F4:1 G4:1 A4:1 G4:2 E4:1 F4:1 E4:1 C4:1 D4:3";

/** Music that replaces the outdoor score while the player is inside a building.
 * Original sketches; no culture or date claims beyond the choice of room. */
export const interiorThemes: Record<InteriorMusic, LayeredTheme> = {
  "court-baroque": {
    culture: ["european"],
    years: [1650, 1789],
    place: "A palace of the Baroque",
    id: "the-kings-supper",
    title: "The King's Supper",
    subtitle:
      "A minuet for a room where people are watched while they eat: violins carry the tune, a harpsichord fills in under them, and a flute joins when the first strain comes round again.",
    evidence:
      "Inference: the minuet in two repeated strains over a harpsichord and bass viol is the commonest dance of the French court from the 1660s, and music was played at the king's public supper. This tune is original.",
    bpm: 104,
    meter: 3,
    bars: 32,
    key: "G major",
    reverb: [0.35, 2.4],
    sections: [{ bar: 0, label: "First strain" }, { bar: 8, label: "Again, with the flute" }, { bar: 16, label: "Second strain" }, { bar: 24, label: "First strain" }],
    layers: [
      { voice: "strings", stem: "melody", loop: `${minuetA} ${minuetA} ${minuetB} ${minuetA}`, velocity: 0.44, pan: -0.15 },
      { voice: "flute", stem: "melody", loop: `${minuetA} -:24 ${minuetA}`, velocity: 0.26, pan: 0.25, enter: 8, transpose: 12 },
      { voice: "harpsichord", stem: "harmony", loop: `${minuetKeysA} ${minuetKeysA} ${minuetKeysB} ${minuetKeysA}`, velocity: 0.29, pan: 0.1 },
      { voice: "cello", stem: "bass", loop: `${minuetBassA} ${minuetBassA} ${minuetBassB} ${minuetBassA}`, velocity: 0.44 },
    ],
  },
  "court-china": {
    culture: ["east-asian"],
    years: [1368, 1911],
    place: "A Chinese palace hall",
    id: "audience-at-dawn",
    title: "Audience at Dawn",
    subtitle:
      "A zither sets out a tune on five notes over slow bronze bells; a fiddle answers it in long slides, and a bamboo flute takes the tune up the second time through.",
    evidence:
      "Inference: court ceremony used sets of tuned bells and stone chimes with zithers and flutes, on five-note modes; the fiddle belongs to the later, lighter palace music. This tune is original and makes no claim to any surviving score.",
    bpm: 60,
    meter: 4,
    bars: 32,
    key: "D, five notes",
    reverb: [0.5, 3.5],
    sections: [{ bar: 0, label: "Zither and bells" }, { bar: 8, label: "The fiddle answers" }, { bar: 16, label: "With the flute" }],
    layers: [
      { voice: "pluck", stem: "melody", loop: `${audienceA} ${audienceB}`, velocity: 0.56, pan: -0.2 },
      { voice: "pluck", stem: "harmony", loop: "D3:1 A3:1 D4:2 D3:1 A3:1 B3:2 B2:1 F#3:1 B3:2 A2:1 E3:1 A3:2 D3:1 A3:1 D4:2 E3:1 B3:1 E4:2 A2:1 E3:1 A3:2 D3:1 A3:1 D4:2", velocity: 0.28, pan: 0.2, enter: 4 },
      { voice: "bronze", stem: "harmony", loop: "D4:1:.9 -:7 A3:1:.7 -:7 B3:1:.7 -:7 A3:1:.6 -:7", velocity: 0.28, pan: 0.35, echo: [2, 2, 0.4] },
      { voice: "erhu", stem: "melody", loop: "-:4 ~A4:3 B4:1 A4:2 F#4:2 ~E4:4 -:8 ~D5:3 B4:1 ~A4:4 -:4 F#4:2 E4:2 ~D4:6 -:2 -:16", velocity: 0.31, pan: 0.15, enter: 8 },
      { voice: "flute", stem: "melody", loop: `A5:1 B5:.5 D6:.5 E6:2 -:4 F#5:1 A5:.5 B5:.5 A5:1 F#5:1 -:4 D5:1 E5:.5 F#5:.5 A5:2 -:4 F#5:1 E5:1 D5:1.5 E5:.5 D5:4 ${audienceB}`, velocity: 0.25, pan: -0.05, enter: 16, transpose: -12 },
      { voice: "drone", stem: "bass", loop: "D2:16 A1:8 D2:8", velocity: 0.14 },
      { voice: "wood", stem: "percussion", loop: "-:15 C6:1:.4 -:15 C6:.5:.4 C6:.5:.3", velocity: 0.11, pan: 0.5 },
      { voice: "gong", stem: "percussion", loop: "D2:1 -:63", velocity: 0.22 },
    ],
  },
  "court-roman": {
    culture: ["european", "north-african-west-asian"],
    years: [-200, 400],
    place: "A Roman house",
    id: "after-the-third-course",
    title: "After the Third Course",
    subtitle:
      "A lyre plays for the couches while the dishes go round; a double pipe joins it, and a frame drum keeps the time.",
    evidence:
      "Inference: lyre and double pipe (aulos, tibia) players were hired to entertain at dinner, and Greek music, which Romans adopted, used modes like this one on E. The tune is original; almost no Roman music survives.",
    bpm: 80,
    meter: 4,
    bars: 32,
    key: "E, Phrygian",
    reverb: [0.4, 2],
    sections: [{ bar: 0, label: "The lyre" }, { bar: 8, label: "The pipe joins" }],
    layers: [
      { voice: "harp", stem: "melody", loop: `${romanA} ${romanB} ${romanA} ${romanB}`, velocity: 0.44, pan: -0.15 },
      { voice: "reed", stem: "melody", loop: `${romanB} ${romanA} ${romanB}`, velocity: 0.24, pan: 0.25, enter: 8 },
      { voice: "pluck", stem: "harmony", loop: "E3:1 B3:1 E4:1 B3:1 A2:1 E3:1 A3:1 E3:1", velocity: 0.2, pan: 0.2 },
      { voice: "drone", stem: "bass", loop: "E2:16 A1:8 E2:8", velocity: 0.12 },
      { voice: "frame", stem: "percussion", loop: "D3:1:.9 -:.5 D3:.5:.4 D3:1:.6 -:1", velocity: 0.14, pan: 0.4, enter: 4 },
    ],
  },
  "court-islamic": {
    culture: ["north-african-west-asian"],
    years: [700, 1800],
    place: "A palace of the Islamic world",
    id: "water-in-the-court",
    title: "Water in the Court",
    subtitle:
      "An oud plays a tune in Hijaz over a frame drum; a reed flute answers it in long slides, and a plucked zither fills in the second time through.",
    evidence:
      "Inference: oud, ney, qanun and frame drum are the instruments of court music from Baghdad to Granada, and Hijaz is one of the old modes. The tune is original.",
    bpm: 72,
    meter: 4,
    bars: 32,
    key: "D, Hijaz",
    reverb: [0.45, 2.6],
    sections: [{ bar: 0, label: "The oud" }, { bar: 8, label: "The ney answers" }, { bar: 16, label: "With the qanun" }],
    layers: [
      { voice: "oud", stem: "melody", loop: `${courtyardA} ${courtyardB} ${courtyardA} ${courtyardB}`, velocity: 0.7, pan: -0.15 },
      { voice: "ney", stem: "melody", loop: "~D5:4 C5:2 Bb4:2 ~A4:8 -:16 ~G4:4 F#4:2 Eb4:2 ~D4:8 -:16 ~A4:4 Bb4:2 A4:2 ~G4:4 F#4:4 D4:8 -:8", velocity: 0.4, pan: 0.2, enter: 8 },
      { voice: "pluck", stem: "harmony", loop: "D3:.5 A3:.5 D4:.5 A3:.5 D3:.5 A3:.5 D4:1 G2:.5 D3:.5 G3:.5 D3:.5 D3:.5 A3:.5 D4:1", velocity: 0.28, pan: 0.3, enter: 16 },
      { voice: "drone", stem: "bass", loop: "D2:16", velocity: 0.17 },
      { voice: "frame", stem: "percussion", loop: "D3:1:.9 D3:.5:.5 D3:.5:.5 -:.5 D3:.5:.6 D3:1:.8", velocity: 0.13, pan: 0.35, enter: 4 },
    ],
  },
  "court-hall": {
    culture: ["european"],
    years: [500, 1500],
    place: "A lord's hall",
    id: "at-the-high-table",
    title: "At the High Table",
    subtitle:
      "A harp plays a dance in three for the hall; a fiddle takes it up, then a recorder an octave above, over a drone and a tabor.",
    evidence:
      "Inference: harpers played in lords' halls from the early Middle Ages, and fiddle, recorder and tabor were the minstrel's band of the later ones; the dance is in the D mode most surviving tunes use. The tune is original.",
    bpm: 120,
    meter: 3,
    bars: 32,
    key: "D, Dorian",
    reverb: [0.35, 2.2],
    sections: [{ bar: 0, label: "The harp" }, { bar: 8, label: "The fiddle" }, { bar: 16, label: "The recorder" }],
    layers: [
      { voice: "harp", stem: "melody", loop: `${tableA} ${tableB} ${tableA} ${tableB}`, velocity: 0.42, pan: -0.2 },
      { voice: "strings", stem: "melody", loop: `${tableB} ${tableA} ${tableB}`, velocity: 0.3, pan: 0.15, enter: 8 },
      { voice: "flute", stem: "melody", loop: `${tableA} ${tableB}`, velocity: 0.2, pan: 0.3, enter: 16, transpose: 12 },
      { voice: "drone", stem: "bass", loop: "D2:12 A1:6 D2:6", velocity: 0.13 },
      { voice: "frame", stem: "percussion", loop: "D3:1:.9 D3:.5:.4 D3:.5:.5 D3:1:.6", velocity: 0.14, pan: 0.4, enter: 4 },
    ],
  },
  cave: {
    ...everywhere,
    years: [-1000000, 10000],
    place: "Underground, any place",
    id: "inside-the-rock",
    title: "Inside the rock",
    subtitle:
      "A struck stalactite rings three notes into a long room; a low breath holds under them, and now and then a clay flute tries the echo.",
    evidence:
      "Inference: stalactites and flowstone curtains worn by striking are documented in painted caves (Nerja, Les Fieux, Réseau Clastres), and bone flutes from Swabian cave sites. The notes and their order are original.",
    bpm: 44,
    meter: 4,
    bars: 32,
    key: "D, three stones",
    tuning: { "2": 14, "9": -20 },
    reverb: [0.7, 7],
    layers: [
      { voice: "drone", stem: "bass", loop: "D2:16 C2:16", velocity: 0.07 },
      { voice: "sub", stem: "bass", loop: "D1:8 -:24", velocity: 0.05, enter: 8 },
      { voice: "rockgong", stem: "harmony", loop: "D4:1:.9 -:6 A3:1:.6 -:9 E4:1:.7 -:14", velocity: 0.16, pan: -0.3, echo: [1.5, 3, 0.45] },
      { voice: "rockgong", stem: "harmony", loop: "-:11 A4:1:.5 -:17 D5:1:.4 -:8", velocity: 0.1, pan: 0.4, enter: 4, echo: [2, 3, 0.5], drift: 0.5 },
      { voice: "xun", stem: "harmony", loop: "-:16 A4:3 G4:1 E4:4 -:20 D4:2 E4:2 A4:6 -:10", velocity: 0.07, enter: 12, exit: 30, echo: [3, 2, 0.4] },
      { voice: "wood", stem: "percussion", loop: "-:23 C6:1:.3 -:19 C6:1:.2 -:9", velocity: 0.03, pan: 0.6, echo: [0.75, 4, 0.5] },
    ],
  },
  sewer: {
    ...everywhere,
    years: [1850, 10001],
    place: "Under a motor-age street",
    id: "under-the-street",
    title: "Under the street",
    subtitle:
      "Water drops tune themselves in the dark over a pipe's low hum; somewhere down the line iron knocks and the tunnel hands it back, and a muted horn wanders in looking for the way out.",
    evidence:
      "Fiction: an original piece for the sewers. The cup-muted horn nods to the brass of the street above; nothing here is drawn from a recorded tune.",
    bpm: 56,
    meter: 4,
    bars: 32,
    key: "E minor",
    reverb: [0.65, 6],
    layers: [
      { voice: "drone", stem: "bass", loop: "E2:16 E2:12 D2:4", velocity: 0.06 },
      { voice: "sub", stem: "bass", loop: "E1:8 -:24", velocity: 0.045, enter: 4 },
      { voice: "celesta", stem: "harmony", loop: "B5:.5:.8 -:3.5 G5:.5:.5 -:6 E6:.5:.4 -:5.5 F#5:.5:.6 -:4", velocity: 0.08, pan: -0.35, echo: [0.75, 3, 0.4] },
      { voice: "celesta", stem: "harmony", loop: "-:7 D6:.5:.5 -:9 A5:.5:.4 -:5.5", velocity: 0.06, pan: 0.45, enter: 2, echo: [1, 3, 0.45], drift: 0.5 },
      { voice: "bronze", stem: "percussion", loop: "-:14 E3:1:.6 -:9 E3:.5:.4 B2:1:.5 -:6.5", velocity: 0.05, pan: 0.55, enter: 6, echo: [2, 4, 0.5] },
      { voice: "pad", stem: "harmony", loop: "E3+B3:16 C3+G3:16 A2+E3:16 B2+F#3:16", velocity: 0.025, enter: 12, exit: 28 },
      { voice: "muted", stem: "harmony", loop: "-:8 B4:2 C5:1 B4:1 G4:3 -:1 A4:1 B4:1 E4:4 -:12 G4:1 A4:1 B4:2 D5:2 C5:1 B4:1 A4:4 -:4 F#4:1 G4:1 E4:6 -:10", velocity: 0.07, pan: -0.15, enter: 8, exit: 28, echo: [1.5, 2, 0.35] },
    ],
  },
  mine: {
    ...everywhere,
    years: [-3000, 10001],
    place: "Down a mine, any place",
    id: "at-the-face",
    title: "At the face",
    subtitle:
      "Two men drill by hand: one strikes, one turns the steel, and the beat never stops. A pump breathes far up the shaft, and the men's voices come in low and slow under it, with a band's horns behind them on the way home.",
    evidence:
      "Inference: hand drilling by a striker and a turner set a steady working beat in hard-rock mines, and male-voice choirs and colliery brass bands grew out of 19th-century mining towns in Wales, northern England and the Ruhr. The tune and its setting are original.",
    bpm: 76,
    meter: 4,
    bars: 32,
    key: "D minor",
    reverb: [0.6, 5],
    layers: [
      { voice: "drone", stem: "bass", loop: "D2:16 A1:8 C2:8", velocity: 0.07 },
      { voice: "crack", stem: "percussion", loop: "D4:1:.9 -:1 D4:1:.55 -:1", velocity: 0.05, pan: -0.25, echo: [0.5, 2, 0.35] },
      { voice: "wood", stem: "percussion", loop: "-:1 A5:.5:.4 -:1.5 A5:.5:.3 -:.5", velocity: 0.03, pan: -0.2, enter: 2 },
      { voice: "steam", stem: "percussion", loop: "D2:2 -:6", velocity: 0.03, pan: 0.5, enter: 4 },
      { voice: "choir", stem: "melody", loop: "-:16 D3:2 F3:2 A3:3 G3:1 F3:2 E3:2 D3:4 F3:2 G3:2 A3:2 C4:2 A3:6 -:2 A3:2 G3:2 F3:2 E3:2 D3:2 C3:2 D3:6 -:2", velocity: 0.16, enter: 8, exit: 28 },
      { voice: "choir", stem: "harmony", loop: "-:16 A2:4 D3:4 C3:4 A2:4 D3:4 F3:4 E3:8 F3:4 C3:4 A2:4 D3:8", velocity: 0.08, enter: 12, exit: 28 },
      { voice: "horn", stem: "harmony", loop: "D3+A3:8 F3+C4:8 C3+G3:8 A2+E3:8", velocity: 0.04, enter: 20, exit: 30, pan: 0.2 },
      { voice: "sub", stem: "bass", loop: "D1:4 -:28", velocity: 0.05, enter: 4 },
    ],
  },
  chant: {
    ...everywhere,
    id: "inside-stone-office",
    title: "Office in the stone",
    subtitle:
      "A unison chant in the Dorian mode; a fifth below joins it, and a high glass chime answers each phrase's last note.",
    evidence:
      "Inference: plainchant's unison line, its modes and parallel-fifth organum are documented from the 9th century (Musica enchiriadis). The melody is original; the echoing chime is fiction.",
    bpm: 66,
    meter: 4,
    bars: 32,
    key: "D Dorian",
    reverb: [0.55, 4.5],
    layers: [
      { voice: "choir", stem: "melody", loop: [chantA, chantB, chantA, chantC].join(" "), velocity: 0.24 },
      { voice: "choir", stem: "harmony", loop: [chantA, chantB, chantA, chantC].join(" "), transpose: -7, velocity: 0.12, enter: 8, exit: 28 },
      { voice: "drone", stem: "bass", loop: "D3:8 A2:8", velocity: 0.07, enter: 4 },
      { voice: "chime", stem: "harmony", loop: "-:13 A5:1 -:16 D6:1 -:1", velocity: 0.05, pan: 0.5, echo: [1.5, 3, 0.5] },
      { voice: "bell", stem: "percussion", loop: "D3:1 -:31", velocity: 0.06, pan: -0.4 },
    ],
  },
  temple: {
    ...everywhere,
    id: "inside-still-water",
    title: "Incense and still water",
    subtitle: "A bowl rings, a breath of flute drifts against it, and two bronze notes slowly fall out of step.",
    evidence: "Fiction: an original sketch for a quiet sacred room. No particular rite or tradition is reconstructed.",
    bpm: 52,
    meter: 4,
    bars: 24,
    key: "E pentatonic minor",
    reverb: [0.5, 5],
    layers: [
      { voice: "drone", stem: "bass", loop: "E2:16", velocity: 0.08 },
      { voice: "bronze", stem: "percussion", loop: "E4:1 -:11", velocity: 0.09, pan: -0.3 },
      { voice: "bronze", stem: "percussion", loop: "B4:1 -:10", velocity: 0.06, pan: 0.35, enter: 4, drift: 0.5 },
      { voice: "flute", stem: "melody", loop: "-:4 B4:3 A4:1 G4:2 E4:4 -:6 D5:2 B4:1 A4:1 B4:4 -:4 G4:1 A4:1 B4:2 D5:2 E5:4 -:8", velocity: 0.16, enter: 4, exit: 22, echo: [2, 2, 0.4] },
      { voice: "gong", stem: "percussion", loop: "E2:1 -:31", velocity: 0.05 },
    ],
  },
  tavern: {
    ...everywhere,
    id: "inside-warm-cups",
    title: "Low ceiling, warm cups",
    subtitle:
      "A lopsided jig: the strings keep six, the drum keeps six, and a reed's tune runs one beat long so it never lands in the same place twice.",
    evidence: "Fiction: an original dance tune in D Mixolydian for any public drinking room.",
    bpm: 210,
    meter: 6,
    beatUnit: 8,
    bars: 48,
    key: "D Mixolydian",
    reverb: [0.15, 1.2],
    layers: [
      { voice: "pluck", stem: "harmony", loop: "D3:2 A3:1 D4:2 A3:1 C3:2 G3:1 C4:2 G3:1", velocity: 0.14, pan: -0.3 },
      { voice: "frame", stem: "percussion", loop: "C4:2 -:1 C4:1 C4:1 -:1", velocity: 0.11, pan: 0.2, enter: 2 },
      { voice: "flute", stem: "melody", loop: jig, velocity: 0.22, enter: 4, exit: 44 },
      { voice: "reed", stem: "harmony", loop: "F#4:3 E4:2 D4:2 C4:3 D4:3 A3:4 -:2", velocity: 0.09, pan: 0.4, enter: 20, exit: 40 },
      { voice: "bass", stem: "bass", loop: "D2:3 A2:3 C2:3 G2:3", velocity: 0.12 },
      { voice: "clap", stem: "percussion", loop: "-:3 C4:3", velocity: 0.05, enter: 28, exit: 40, pan: -0.5 },
    ],
  },
  inn: innTheme,
  home: {
    ...everywhere,
    id: "inside-kettle-shutters",
    title: "Kettle and shutters",
    subtitle: "A music-box waltz under a slow clock; the tune keeps forgetting its last bar and starting over.",
    evidence: "Fiction: an original lullaby for a home.",
    bpm: 76,
    meter: 3,
    bars: 32,
    key: "F major",
    reverb: [0.2, 1.6],
    layers: [
      { voice: "wood", stem: "percussion", loop: "C5:1:.6 C5:1:.3", velocity: 0.03, pan: 0.5 },
      { voice: "harp", stem: "harmony", loop: "F3:1 C4:1 A4:1 Bb2:1 F3:1 D4:1 C3:1 G3:1 E4:1 F3:1 C4:1 A4:1", velocity: 0.1, pan: -0.2 },
      { voice: "kalimba", stem: "melody", loop: "C5:2 A4:1 F5:2 E5:1 D5:2 Bb4:1 G4:3 A4:1 C5:1 F5:1 E5:1 G5:1 E5:1 C5:3 A4:2 G4:1", velocity: 0.15, enter: 4, exit: 30 },
      { voice: "bass", stem: "bass", loop: "F2:3 Bb1:3 C2:3 F2:3", velocity: 0.08, enter: 8 },
    ],
  },
  "home-play": homePlayTheme,
  workshop: {
    ...everywhere,
    id: "inside-measure-twice",
    title: "Measure twice",
    subtitle: "Five beats to the bar: pizzicato counting, wood blocks marking, a reed humming something it half remembers.",
    evidence: "Fiction: an original working piece in 5/4.",
    bpm: 112,
    meter: 5,
    bars: 32,
    key: "A minor",
    reverb: [0.12, 1],
    layers: [
      { voice: "pluck", stem: "harmony", loop: "A3:1 E4:1 A3:1 C4:.5 D4:.5 E4:1 G3:1 D4:1 G3:1 B3:.5 C4:.5 D4:1", velocity: 0.13, pan: -0.25 },
      { voice: "wood", stem: "percussion", loop: "C5:1 -:1 G4:.5 G4:.5 C5:1 -:1", velocity: 0.08, pan: 0.35, enter: 2 },
      { voice: "bass", stem: "bass", loop: "A2:3 E2:2 G2:3 D2:2 F2:3 C2:2 E2:5", velocity: 0.11, enter: 4 },
      { voice: "reed", stem: "melody", loop: "-:5 E4:2 A4:1 C5:2 B4:1 A4:1 G4:3 -:5 A4:2 C5:1 E5:2 D5:1 C5:1 B4:3 C5:1 B4:1 A4:3 -:2", velocity: 0.16, enter: 8, exit: 28 },
      { voice: "shaker", stem: "percussion", loop: "C4:.5:1 C4:.5:.4", velocity: 0.03, enter: 16, exit: 24 },
    ],
  },
  hall: {
    ...everywhere,
    id: "inside-order-of-business",
    title: "Order of business",
    subtitle: "A self-important little march; the bass steps on its own feet, and the tune keeps clearing its throat.",
    evidence: "Fiction: an original processional for a hall, school or court.",
    bpm: 100,
    meter: 2,
    bars: 40,
    key: "G major",
    reverb: [0.3, 2.4],
    layers: [
      { voice: "frame", stem: "percussion", loop: "C4:.75 C4:.25 C4:1", velocity: 0.09 },
      { voice: "bass", stem: "bass", loop: "G2:1 D2:1 G2:1 D2:1 C2:1 G1:1 D2:1 F#2:.5 D2:.5", velocity: 0.12 },
      { voice: "reed", stem: "melody", loop: "G4:1 B4:1 D5:1.5 C5:.5 B4:1 A4:1 G4:2 -:1 A4:.5 A4:.5 B4:1 C5:1 E5:1 D5:.5 C5:.5 B4:1 A4:1 D5:2 G4:.5 G4:.5 -:1", velocity: 0.18, enter: 4, exit: 36 },
      { voice: "pluck", stem: "harmony", loop: "-:.5 B3+D4:.5 -:.5 B3+D4:.5 -:.5 C4+E4:.5 -:.5 A3+D4:.5", velocity: 0.08, pan: 0.3, enter: 8 },
    ],
  },
  opera: {
    ...everywhere,
    id: "inside-aria-of-ravenna",
    title: "Aria of Ravenna",
    subtitle: "A soaring soprano aria in 3/4 over sweeping harp arpeggios, cello, strings, French horn, and a chorus entering on the refrain.",
    evidence: "Fiction: an original operatic waltz-aria in D minor and F major for a grand opera house.",
    bpm: 84,
    meter: 3,
    bars: 32,
    key: "D minor",
    reverb: [0.55, 3.6],
    sections: [{ bar: 0, label: "Overture & harp" }, { bar: 4, label: "Soprano aria" }, { bar: 16, label: "Chorus & horn swell" }],
    layers: [
      { voice: "harp", stem: "harmony", loop: "D3:.5 A3:.5 D4:.5 F4:.5 D4:.5 A3:.5 Bb2:.5 F3:.5 Bb3:.5 D4:.5 Bb3:.5 F3:.5 G2:.5 D3:.5 G3:.5 Bb3:.5 G3:.5 D3:.5 A2:.5 E3:.5 A3:.5 C#4:.5 A3:.5 E3:.5", velocity: 0.24, pan: -0.25 },
      { voice: "cello", stem: "bass", loop: "D2:3 Bb1:3 G1:3 A1:3 F2:3 C2:3 G1:3 A1:3", velocity: 0.38 },
      { voice: "strings", stem: "harmony", loop: "F4:3 D4:3 Bb3:3 A3:2 C#4:1 A4:3 G4:3 D4:3 E4:3", velocity: 0.22, pan: 0.2 },
      { voice: "singer", stem: "melody", loop: "-:12 A4:2 Bb4:1 A4:1.5 G4:.5 F4:1 G4:2 A4:1 E4:3 F4:2 G4:1 A4:1.5 C5:.5 D5:1 C5:2 Bb4:1 A4:3 D5:2 C5:1 Bb4:1.5 A4:.5 G4:1 A4:2 F4:1 E4:2 D4:1", velocity: 0.34, enter: 4 },
      { voice: "horn", stem: "harmony", loop: "D4:3 F4:3 G4:3 E4:3 A4:3 G4:3 Bb4:3 A4:3", velocity: 0.16, pan: -0.35, enter: 12 },
      { voice: "choir", stem: "harmony", loop: "D4+F4:3 Bb3+D4:3 G3+Bb3:3 A3+C#4:3 F4+A4:3 E4+G4:3 D4+G4:3 E4+A4:3", velocity: 0.17, pan: 0.1, enter: 16 },
    ],
  },
  broadway: {
    ...everywhere,
    id: "inside-curtain-up-42nd",
    title: "Curtain Up on 42nd",
    subtitle: "A bright pit-orchestra overture with clarinet, brass horn, stride piano, walking bass, and brushed snare.",
    evidence: "Fiction: an original Broadway showtune overture in Bb major.",
    bpm: 122,
    meter: 4,
    bars: 32,
    key: "Bb major",
    reverb: [0.3, 1.8],
    layers: [
      { voice: "bass", stem: "bass", loop: "Bb1:1 D2:1 F2:1 G2:1 Eb2:1 G2:1 F2:1 D2:1 C2:1 E2:1 F2:1 A2:1 Bb1:1 F2:1 Bb2:1 F2:1", velocity: 0.28 },
      { voice: "piano", stem: "harmony", loop: "-:1 Bb3+D4:1 -:1 Bb3+D4:1 -:1 Eb4+G4:1 -:1 C4+F4:1 -:1 C4+Eb4:1 -:1 A3+F4:1 -:1 Bb3+D4:1 -:1 F3+C4:1", velocity: 0.2, pan: -0.25 },
      { voice: "brush", stem: "percussion", loop: "C4:1 C4:.5 C4:.5 C4:1 C4:.5 C4:.5", velocity: 0.08, pan: 0.35 },
      { voice: "snare", stem: "percussion", loop: "-:1 C4:.5 -:1.5 C4:.5 -:.5", velocity: 0.05, pan: 0.3, enter: 4 },
      { voice: "clarinet", stem: "melody", loop: "F4:.5 G4:.5 Bb4:1 D5:1 C5:1 Bb4:1.5 G4:.5 Eb4:2 F4:.5 G4:.5 A4:1 C5:1 Bb4:1 D5:2 -:2", velocity: 0.26, pan: 0.15 },
      { voice: "horn", stem: "melody", loop: "-:8 Bb4:1 D5:1 F5:1.5 D5:.5 Eb5:1 C5:1 A4:1 F4:1 Bb4:2 -:2", velocity: 0.2, pan: -0.2, enter: 8 },
      { voice: "strings", stem: "harmony", loop: "D5:4 Eb5:4 C5:4 D5:4", velocity: 0.14, enter: 12 },
    ],
  },
  playhouse: {
    ...everywhere,
    id: "inside-footlights-and-velvet",
    title: "Footlights and Velvet",
    subtitle: "Harpsichord, flute, lute and strings play an entr'acte between scenes of the play.",
    evidence: "Fiction: an original theatrical consort piece in G minor.",
    bpm: 96,
    meter: 3,
    bars: 32,
    key: "G minor",
    reverb: [0.28, 1.8],
    layers: [
      { voice: "harpsichord", stem: "harmony", loop: "G3:.5 Bb3:.5 D4:.5 G4:.5 D4:.5 Bb3:.5 F3:.5 A3:.5 C4:.5 F4:.5 C4:.5 A3:.5 Eb3:.5 G3:.5 Bb3:.5 Eb4:.5 Bb3:.5 G3:.5 D3:.5 F#3:.5 A3:.5 D4:.5 A3:.5 F#3:.5", velocity: 0.22, pan: -0.2 },
      { voice: "cello", stem: "bass", loop: "G2:3 F2:3 Eb2:3 D2:3 C2:3 Bb1:3 A1:3 D2:3", velocity: 0.28 },
      { voice: "flute", stem: "melody", loop: "D5:2 C5:1 Bb4:1.5 A4:.5 G4:1 A4:2 Bb4:1 A4:3 G4:2 A4:1 Bb4:1.5 C5:.5 D5:1 C5:2 Bb4:1 A4:3", velocity: 0.24, pan: 0.2, enter: 4 },
      { voice: "strings", stem: "harmony", loop: "G4:3 A4:3 G4:3 F#4:3", velocity: 0.16, enter: 8 },
      { voice: "frame", stem: "percussion", loop: "D3:1 -:1 D3:.5 D3:.5", velocity: 0.08, pan: 0.35, enter: 12 },
    ],
  },
  "stage-japan": {
    ...everywhere,
    id: "inside-pine-and-clapper",
    title: "Pine and Clapper",
    subtitle: "Bamboo flute, shamisen pluck, sho breath chords, tsuzumi drum and wooden hyoshigi clappers.",
    evidence: "Inference: noh and kabuki stages use flute, plucked lute, hand drums and wooden clappers on Japanese pentatonic scales; this piece is original.",
    bpm: 74,
    meter: 4,
    bars: 32,
    key: "E Hirajoshi",
    reverb: [0.38, 2.4],
    layers: [
      { voice: "sho", stem: "harmony", loop: "E4+B4:8 F4+C5:8 E4+B4:8 B3+E4:8", velocity: 0.14, pan: -0.2 },
      { voice: "pluck", stem: "harmony", loop: "E3:1 B3:1 C4:1 B3:1 E3:2 -:2 F3:1 B3:1 E4:1 C4:1 B3:2 -:2", velocity: 0.24, pan: 0.2 },
      { voice: "flute", stem: "melody", loop: "-:4 B4:2 C5:1 B4:1 E5:3 -:1 F5:1 E5:1 C5:2 B4:3 -:5 E5:2 F5:1 E5:1 C5:2 B4:2 E4:4 -:4", velocity: 0.24, pan: -0.1, enter: 4 },
      { voice: "wood", stem: "percussion", loop: "-:7 C6:.5 C6:.5 -:7 C6:.5 -:1.5", velocity: 0.14, pan: 0.4 },
      { voice: "frame", stem: "percussion", loop: "D3:1 -:2 D3:.5 D3:.5 -:3 D3:1", velocity: 0.13, pan: -0.35, enter: 2 },
    ],
  },
  "cinema-silent": {
    ...everywhere,
    id: "inside-silver-sheet-rag",
    title: "Flicker on the Silver Sheet",
    subtitle: "A jaunty upright pit piano accompanying the silent reel over the soft whisper of projector crackle.",
    evidence: "Inference: storefront nickelodeons from 1910 to 1924 relied on solo upright piano improvisation; this tune is original.",
    bpm: 118,
    meter: 4,
    bars: 32,
    key: "C major",
    reverb: [0.22, 1.3],
    layers: [
      { voice: "piano", stem: "harmony", loop: "C2:.5 E3+G3:.5 G2:.5 E3+G3:.5 C2:.5 E3+G3:.5 G2:.5 E3+G3:.5 F2:.5 A3+C4:.5 C3:.5 A3+C4:.5 G2:.5 B3+D4:.5 D3:.5 B3+D4:.5", velocity: 0.22, pan: -0.15 },
      { voice: "piano", stem: "melody", loop: "E4:.5 G4:.5 C5:.5 A4:.5 G4:1 E4:1 D4:.5 F4:.5 A4:.5 G4:.5 F4:1 D4:1 E4:.5 G4:.5 B4:.5 C5:.5 D5:1 B4:1 C5:2 -:2", velocity: 0.3, pan: 0.1 },
      { voice: "crackle", stem: "percussion", loop: "C4:4 C4:4", velocity: 0.08 },
    ],
  },
  "cinema-classic": {
    ...everywhere,
    id: "inside-matinee-technicolor",
    title: "Matinee in Technicolor",
    subtitle: "Sweeping golden-age studio strings, smoky clarinet, French horn, harp and vibraphone inside a picture palace.",
    evidence: "Fiction: an original classic Hollywood orchestral cinema score in Eb major.",
    bpm: 90,
    meter: 4,
    bars: 32,
    key: "Eb major",
    reverb: [0.42, 2.6],
    layers: [
      { voice: "cello", stem: "bass", loop: "Eb2:4 C2:4 Ab1:4 Bb1:4", velocity: 0.32 },
      { voice: "strings", stem: "harmony", loop: "G4:2 Bb4:2 Eb5:3 D5:1 C5:2 Ab4:2 Bb4:4 G4:2 F4:2 Eb4:2 G4:2 F4:4 -:4", velocity: 0.26, pan: -0.15 },
      { voice: "harp", stem: "harmony", loop: "Eb3:.5 G3:.5 Bb3:.5 Eb4:.5 Bb3:.5 G3:.5 Eb3:1 C3:.5 Eb3:.5 G3:.5 C4:.5 G3:.5 Eb3:.5 C3:1", velocity: 0.16, pan: 0.25 },
      { voice: "clarinet", stem: "melody", loop: "-:8 Bb4:1.5 C5:.5 Bb4:1 G4:1 Ab4:2 F4:2 G4:1.5 Ab4:.5 G4:1 Eb4:1 F4:4", velocity: 0.24, pan: 0.15, enter: 4 },
      { voice: "horn", stem: "harmony", loop: "Eb4:4 G4:4 Ab4:4 Bb4:4", velocity: 0.14, pan: -0.3, enter: 12 },
      { voice: "vib", stem: "harmony", loop: "Bb4:2 G5:2 Eb5:4 C5:2 Ab5:2 F5:4", velocity: 0.12, pan: 0.3, enter: 8 },
    ],
  },
  "cinema-modern": {
    ...everywhere,
    id: "inside-projector-beam",
    title: "Projector Beam",
    subtitle: "Warm widescreen analog synth pads, pulsing bassline, arpeggiated keys and sci-fi shimmer in a darkened multiplex.",
    evidence: "Fiction: an original 1980s widescreen cinema synthesizer score in C minor.",
    bpm: 108,
    meter: 4,
    bars: 32,
    key: "C minor",
    reverb: [0.44, 2.5],
    layers: [
      { voice: "pad", stem: "harmony", loop: "C3+G3+Eb4:8 Ab2+Eb3+C4:8 Bb2+F3+D4:8 G2+D3+B3:8", velocity: 0.22 },
      { voice: "ebass", stem: "bass", loop: "C2:.5 C2:.5 C2:.5 C2:.5 C2:.5 C2:.5 G1:.5 Bb1:.5 Ab1:.5 Ab1:.5 Ab1:.5 Ab1:.5 Bb1:.5 Bb1:.5 G1:.5 G1:.5", velocity: 0.24 },
      { voice: "keys", stem: "harmony", loop: "C4:.5 Eb4:.5 G4:.5 C5:.5 G4:.5 Eb4:.5 C4:.5 G4:.5 Ab3:.5 C4:.5 Eb4:.5 Ab4:.5 Eb4:.5 C4:.5 Bb3:.5 F4:.5", velocity: 0.16, pan: -0.25, enter: 4 },
      { voice: "saw", stem: "melody", loop: "-:8 G4:2 Bb4:1 C5:1 Eb5:3 D5:1 C5:2 Bb4:2 G4:4 F4:2 G4:1 Ab4:1 G4:2 F4:2 Eb4:4", velocity: 0.19, pan: 0.15, enter: 8 },
      { voice: "kick", stem: "percussion", loop: "C2:1 -:1 C2:1 -:1", velocity: 0.12, enter: 8 },
      { voice: "hat", stem: "percussion", loop: "-:.5 C5:.5 -:.5 C5:.5", velocity: 0.05, pan: 0.3, enter: 12 },
    ],
  },
};

/** The court music of a palace, by how it is built; undefined where none is written yet, and the outdoor score plays on. */
export function courtMusic(style: PalaceStyle | undefined): InteriorMusic | undefined {
  if (!style) return undefined;
  if (style.columns === "lacquer") return "court-china";
  if (style.columns === "moorish") return "court-islamic";
  if (style.order === "roman") return "court-roman";
  if (style.order === "timber") return style.rude || style.walling === "ashlar" ? undefined : "court-hall";
  return (style.order ?? "classical") === "classical" && style.emblem === "sun" ? "court-baroque" : undefined;
}

export function stageMusic(style: string | undefined): InteriorMusic | undefined {
  if (!style?.startsWith("stage-")) return undefined;
  if (style === "stage-opera-grand" || style === "stage-opera") return "opera";
  if (style === "stage-broadway") return "broadway";
  if (style === "stage-noh" || style === "stage-kabuki") return "stage-japan";
  if (style === "stage-cinema-silent") return "cinema-silent";
  if (style === "stage-cinema") return "cinema-classic";
  if (style === "stage-cinema-wide") return "cinema-modern";
  return "playhouse";
}

/** Which piece a building's use calls for; undefined means the room is left quiet. */
export function interiorMusic(use: string | undefined, home: boolean): InteriorMusic | undefined {
  if (!use) return home ? "home" : "workshop";
  if (use.startsWith("religious.") || /mosque|masjid/.test(use)) return undefined;
  if (/church|chapel|parish|gothic|romanesque|cathedral|abbey|monaster/.test(use)) return "chant";
  if (/temple|wat|shrine|kiva|lodge|bath|hammam|sento|temazcal/.test(use)) return "temple";
  if (/caravanserai|\bhan\b|sarai|ryokan|hatago|kezhan|mansio|caupona|tambo|dharamshala|fondaco|funduq|posada|hotel|motel|hostel|guesthouse|lodging|zongo|\binn\b/.test(use)) return "inn";
  if (/tavern|alehouse|izakaya|kahve|coffee|gaming|pulqu|chich|tea|chaikhana/.test(use)) return "tavern";
  if (/opera-house|opera/.test(use)) return "opera";
  if (/grand-theatre|broadway/.test(use)) return "broadway";
  if (/noh-stage|kabuki/.test(use)) return "stage-japan";
  if (/playhouse|theatre|theater/.test(use)) return "playhouse";
  if (/cinema|nickelodeon|multiplex/.test(use)) return "cinema-classic";
  return "hall";
}
