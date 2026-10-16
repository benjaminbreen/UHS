import type { LayeredTheme } from "./layered-themes";

export type InteriorMusic =
  | "chant"
  | "temple"
  | "tavern"
  | "home"
  | "workshop"
  | "hall";

const everywhere = {
  culture: [],
  years: [-13000, 2026] as [number, number],
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

/** Music that replaces the outdoor score while the player is inside a building.
 * Original sketches; no culture or date claims beyond the choice of room. */
export const interiorThemes: Record<InteriorMusic, LayeredTheme> = {
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
};

/** Which piece a building's use calls for; undefined means the room is left quiet. */
export function interiorMusic(use: string | undefined, faith: string | undefined, home: boolean): InteriorMusic | undefined {
  if (!use) return home ? "home" : "workshop";
  // Mosques are left without music.
  if (/mosque|masjid/.test(use)) return undefined;
  if (/church|chapel|parish|gothic|romanesque|cathedral|abbey|monaster/.test(use)) return "chant";
  if (use.startsWith("religious")) return /Christian|Catholic/.test(faith ?? "") ? "chant" : "temple";
  if (/temple|wat|shrine|kiva|lodge|bath|hammam|sento|temazcal/.test(use)) return "temple";
  if (/tavern|alehouse|izakaya|kahve|coffee|gaming|pulqu|chich|tea|chaikhana|inn/.test(use)) return "tavern";
  return "hall";
}
