import type { CultureId } from "../content/history/types";
import type { Layer, LayeredTheme } from "./layered-themes";
import type { Voice } from "./score";

/** Music for what is happening, not where: each tune is written once and
 * played on the instruments, scale and tuning of the place it is heard in. */
export type Situation = "arrival" | "passing" | "timeslip" | "work" | "workdone";

interface Tune {
  id: string;
  situation: Situation;
  title: string;
  subtitle: string;
  mode: "major" | "minor";
  /** Pitch class of the tonic, 0 = C. */
  tonic: number;
  bpm: number;
  meter: number;
  bars: number;
  reverb?: [number, number];
  /** Whole-piece lines in "pitch:beats" tokens; each must fill bars × meter exactly. */
  lead?: string;
  counter?: string;
  arp?: string;
  pad?: string;
  bass?: string;
  glint?: string;
  /** A fast repeating figure for the dressing's bright struck or plucked voice. */
  ostinato?: string;
  /** Bars between which the dressing's drum marks each downbeat. */
  pulse?: [number, number];
  /** Bars between which the dressing's own drum groove plays. */
  kit?: [number, number];
  /** A dance, not a song: the lively lead, and the plucked voice takes the bass line where there is no bass. */
  busy?: boolean;
  /** Layers heard the same in every dressing. */
  fixed?: Layer[];
  /** Nothing but the fixed layers: one piece for every time and place. */
  everywhere?: boolean;
}

const rep = (n: number, s: string) => Array(n).fill(s).join(" ");
const bars = (...s: string[]) => s.join(" ");

// Broken chords and held chords for "What the river keeps", one bar of three each.
const arp = {
  Dm: "D3:1 A3:1 F4:1",
  Bb: "Bb2:1 F3:1 D4:1",
  F: "F3:1 C4:1 A4:1",
  C: "C3:1 G3:1 E4:1",
  Gm: "G2:1 D3:1 Bb3:1",
  A: "A2:1 E3:1 A3:1",
};
const held = {
  Dm: "D3+A3+F4:3",
  Bb: "D3+Bb3+F4:3",
  F: "C3+A3+F4:3",
  C: "C3+G3+E4:3",
  Gm: "D3+Bb3+G4:3",
  A: "E3+A3+E4:3",
};
type Chord = keyof typeof arp;
const verse: Chord[] = ["Dm", "Bb", "F", "C", "Dm", "Gm", "C", "Dm"];
const middle: Chord[] = ["F", "C", "Bb", "C", "Dm", "Bb", "Gm", "A"];
const riverA = "A4:1 D5:2 F5:2 E5:1 D5:1 C5:1 A4:1 C5:3 A4:1 D5:2 G5:2 F5:1 E5:1.5 D5:.5 C5:1 D5:3";

// "Many hands": one bar of each chord for the off-beat chords, the bouncing bass and the mallet figure.
const stab = { G: "B3+D4+G4", C: "C4+E4+G4", D: "A3+D4+F#4", Em: "B3+E4+G4" };
const off = (c: keyof typeof stab, n = 4) => rep(n, `-:.5 ${stab[c]}:.5`);
const bounce = {
  G: "G2:1 -:.5 D3:.5 G3:1 D3:.5 B2:.5",
  C: "C3:1 -:.5 G3:.5 C3:1 E3:.5 C#3:.5",
  D: "D3:1 -:.5 A3:.5 D3:1 F#3:.5 D3:.5",
  Em: "E2:1 -:.5 B2:.5 E3:1 B2:.5 D3:.5",
};
const three = { G: "D5 B4 G4", C: "E5 C5 G4", D: "F#5 D5 A4", Em: "E5 B4 G4", Bm: "F#5 D5 B4", Am: "E5 C5 A4", F: "F5 C5 A4" };
// Three notes cycling in sixteenths, so the figure's accent walks across the beat.
const half = (c: keyof typeof three) => {
  const n = three[c].split(" ");
  return [0, 1, 2, 0, 1, 2, 0, 1].map((i) => `${n[i]}:.25`).join(" ");
};
const fig = (c: keyof typeof three) => `${half(c)} ${half(c)}`;
const handsStabs = bars(off("G"), off("G"), off("C"), off("D"), off("G"), off("Em"), off("C", 2), off("D", 2), off("G"));
const handsBass = bars(bounce.G, bounce.G, bounce.C, bounce.D, bounce.G, bounce.Em, "C3:1 E3:.5 G3:.5 D3:1 F#3:.5 A3:.5", "G2:1 -:.5 D3:.5 G2:.5 A2:.5 B2:.5 D3:.5");
const handsA = [
  "D5:.75 G5:.75 B5:.5 A5:.5 G5:.5 E5:.5 D5:.5",
  "E5:.5 G5:1 E5:.5 D5:1.5 B4:.5",
  "C5:.75 E5:.75 G5:.5 A5:.5 G5:.5 E5:.5 C5:.5",
  "D5:.5 F#5:1 A5:.5 F#5:.5 E5:.5 D5:1",
  "D5:.75 G5:.75 B5:.5 A5:.5 G5:.5 E5:.5 D5:.5",
  "E5:.5 G5:1 B5:.5 A5:1 G5:.5 E5:.5",
  "C5:.5 E5:.5 G5:.5 E5:.5 D5:.5 F#5:.5 A5:.5 C6:.5",
];
const handsSecond = "B4:3 D5:1 B4:2 G4:2 G4:3 C5:1 A4:2 -:1 D5:.25 E5:.25 F#5:.25 A5:.25 B4:3 D5:1 B4:2 G4:2 G4:2 A4:2 G4:2 -:2";
const eighths = "C4:.5:1 C4:.5:.5 C4:.5:.8 C4:.5:.5";

/** Drum grooves, each a few loops of [voice, loop, loudness]. */
const kits: Record<string, [Voice, string, number][]> = {
  village: [["frame", "D3:.75 D3:.75 D3:.5 -:.5 D3:.5 D3:1", 0.3], ["clap", "-:1 C4:1", 0.14], ["shaker", eighths, 0.1]],
  parlour: [["kick", "C2:1 -:1 C2:.5 C2:.5 -:1", 0.4], ["snare", "-:1 C4:1", 0.16], ["hat", "C4:.5:1 C4:.5:.5", 0.1]],
  // Maqsum: dum tek - tek dum - tek -.
  maqsum: [["frame", "D3:.5 A3:.5 -:.5 A3:.5 D3:.5 -:.5 A3:.5 -:.5", 0.32], ["sistrum", "C4:.5:.5 C4:.5:1", 0.08]],
  gallop: [["frame", "D3:.5 D3:.25:.6 D3:.25:.8", 0.26], ["wood", "-:1 A#4:1", 0.1]],
  keherwa: [["mridanga", "D3:.5 D3:.5:.6 A3:.5 A3:.5:.6 A3:.5 A3:.5:.5 D3:.5 A3:.5", 0.3], ["shaker", eighths, 0.07]],
  clapper: [["wood", "A#4:1 -:1 A#4:.5 A#4:.5 -:1", 0.14], ["frame", "-:1 D3:1", 0.2]],
  gongs: [["gong", "G2:16", 0.12], ["mridanga", "D3:.75 A3:.75 D3:.5 A3:.5 A3:.5 D3:1", 0.26]],
  bell: [["agogo", "E5:.75 E5:.75 B4:1 E5:.5 B4:1", 0.12], ["shaker", eighths, 0.1], ["udu", "G2:1.5 G2:.5 D3:1 -:1", 0.3]],
  heartbeat: [["footdrum", "D2:1 D2:.5:.6 -:.5", 0.34], ["shaker", "C4:.5:1 C4:.5:.5", 0.09]],
  sticks: [["wood", "A#4:1:1 A#4:1:.6", 0.14], ["udu", "G2:1 -:.5 G2:.5 D3:1 -:1", 0.26]],
};

export const tunes: Tune[] = [
  {
    id: "over-the-rise",
    situation: "arrival",
    title: "Over the rise",
    subtitle: "The travel theme's first four notes, climbing to a held note over a chord that does not close.",
    mode: "major",
    tonic: 0,
    bpm: 92,
    meter: 4,
    bars: 4,
    lead: "G4:.5 C5:.5 E5:1 D5:1.5 C5:.5 E5:.5 G5:.5 A5:1 G5:4 -:6",
    arp: "C3:.5 G3:.5 C4:.5 E4:.5 G4:2 F3:.5 C4:.5 F4:.5 A4:.5 C5:2 G3:.5 D4:.5 G4:.5 A4:.5 D5:2 -:4",
    pad: "C3+G3+E4:4 F3+C4+A4:4 G3+D4+A4:6 -:2",
    bass: "C2:4 F2:4 G2:6 -:2",
    glint: "-:10 D6:1 G6:1 -:4",
    pulse: [0, 1],
  },
  {
    id: "gate-left-open",
    situation: "arrival",
    title: "A gate left open",
    subtitle: "The quieter arrival: the travel theme's answer first, then a rise that stops on the second note of the scale.",
    mode: "major",
    tonic: 0,
    bpm: 80,
    meter: 4,
    bars: 4,
    lead: "E5:1.5 D5:.5 C5:1 G4:1 A4:.5 C5:.5 E5:1 D5:4 -:6",
    arp: "C3:1 G3:1 E4:2 A2:1 E3:1 C4:2 G2:1 D3:1 A3:1 D4:1 -:4",
    pad: "C3+G3+E4:4 A2+E3+C4:4 G2+D3+A3:6 -:2",
    bass: "C2:4 A1:4 G1:6 -:2",
    glint: "-:11 A5:1 D6:1 -:3",
  },
  {
    id: "what-the-river-keeps",
    situation: "passing",
    title: "What the river keeps",
    subtitle:
      "The travel theme turned minor and slowed to three: alone, then with a second voice, then a warmer middle that remembers, then alone again. It ends on the rising step, unanswered.",
    mode: "minor",
    tonic: 2,
    bpm: 72,
    meter: 3,
    bars: 40,
    reverb: [0.36, 3.6],
    lead: bars(
      "-:12",
      riverA,
      "A4:1 D5:2 F5:2 E5:1 D5:.5 E5:.5 C5:1 A4:1 C5:3 A4:1 D5:2 G5:2 F5:1 E5:1.5 D5:.5 C5:1 D5:2 -:1",
      "F5:1 A5:2 G5:1 F5:1 E5:1 D5:1 F5:2 E5:1 D5:1 C5:1 F5:1 A5:2 C6:2 A5:1 G5:1 F5:1 D5:1 E5:3",
      riverA,
      "A4:1 D5:2 -:3 A4:1 D5:5",
    ),
    counter: bars(
      "-:36",
      "F4:3 D4:3 F4:2 A4:1 G4:2 E4:1 F4:3 Bb4:2 A4:1 G4:3 F4:2 D4:1",
      "A4:3 G4:2 C5:1 Bb4:3 G4:3 A4:3 F5:2 D5:1 Bb4:2 A4:1 A4:3",
      "-:36",
    ),
    arp: bars(
      ...(["Dm", "Bb", "Dm", "C", ...verse, ...verse, ...middle, ...verse] as Chord[]).map((c) => arp[c]),
      "D3:1 A3:1 F4:1 Bb2:1 F3:1 D4:1 D3:1 A3:1 D4:4",
    ),
    pad: bars("-:36", ...[...verse, ...middle].map((c) => held[c]), "-:30 D3+A3+D4:6"),
    bass: bars(
      "-:12",
      rep(2, "D2:3 Bb1:3 F2:3 C2:3 D2:3 G1:3 C2:3 D2:3"),
      "F2:3 C2:3 Bb1:3 C2:3 D2:3 Bb1:3 G1:3 A1:3",
      "-:30 D2:6",
    ),
    glint: bars("-:84", rep(2, "-:1 D6:2 -:9"), "-:6 A5:1 D6:5"),
    pulse: [12, 28],
  },
  {
    id: "many-hands",
    situation: "work",
    title: "Many hands",
    subtitle:
      "A work dance in four. The tune leans on a three-three-two step over a bass that will not stand still and chords on every off-beat; a second voice answers in its gaps; the middle goes minor and soars over a mallet figure in threes, slips to a chord from outside the key, and comes home with everyone playing.",
    mode: "major",
    tonic: 7,
    bpm: 126,
    meter: 4,
    bars: 36,
    reverb: [0.14, 1.4],
    busy: true,
    kit: [0, 34],
    lead: bars(
      "-:7 A4:.5 B4:.5",
      ...handsA,
      "B5:.75 G5:.75 D5:.5 G5:1 -:1",
      handsA[0],
      "E5:.5 G5:1 E5:.5 D5:.5 E5:.5 G5:.5 A5:.5",
      ...handsA.slice(2),
      "B5:.75 G5:.75 D5:.5 G5:1 F#5:.5 G5:.5",
      "B5:1.5 A5:.5 G5:1 E5:1 F#5:1.5 E5:.5 D5:2 E5:.5 G5:1 C6:.5 B5:1 G5:1 A5:.5 B5:1 G5:.5 D5:2",
      "C6:1.5 B5:.5 A5:1 E5:1 G5:1.5 F#5:.5 E5:1 B4:1 A5:.75 C6:.75 F5:.5 A5:1 G5:.5 F5:.5 F#5:.5 A5:.5 D6:1 -:.5 A4:.5 B4:.5 C5:.5",
      ...handsA,
      "B5:.75 G5:.75 D5:.5 G5:2",
      "B5:.5 G5:.5 E5:.5 C5:.5 D5:.5 F#5:.5 A5:.5 C6:.5 B5:1 -:1 G5:1 -:1",
    ),
    counter: bars(
      "-:40",
      handsSecond,
      "-:6 A4:.5 B4:.5 D5:1 -:6 B4:.5 D5:.5 G5:1 -:7 G4:.5 A4:.5 C5:4 A4:2 C5:2",
      handsSecond,
      "-:4 D5:1 -:1 B4:1 -:1",
    ),
    arp: bars(off("G", 8), handsStabs, handsStabs, "-:32", handsStabs, "C4+E4+G4:.5 -:1.5 A3+D4+F#4:.5 -:1.5 B3+D4+G4:1 -:1 B3+D4+G4:1 -:1"),
    bass: bars(
      bounce.G,
      bounce.G,
      handsBass,
      handsBass,
      "E2:1.5 B2:.5 E3:1 B2:1 B1:1.5 F#2:.5 B2:1 F#2:1 C2:1.5 G2:.5 C3:1 G2:1 G2:1.5 D3:.5 G2:1 B2:1",
      "A2:1.5 E3:.5 A2:1 E2:1 E2:1.5 B2:.5 E2:1 G2:1 F2:1.5 C3:.5 F2:1 A2:1 D2:1 D3:.5 D2:.5 D3:.5 E3:.5 F#3:.5 A3:.5",
      handsBass,
      "C3:.5 -:1.5 D3:.5 -:1.5 G2:1 -:1 G2:1 -:1",
    ),
    ostinato: bars(
      "-:72",
      ...(["Em", "Bm", "C", "G", "Am", "Em", "F", "D", "G", "G", "C", "D", "G", "Em"] as (keyof typeof three)[]).map(fig),
      half("C"),
      half("D"),
      fig("G"),
      "-:8",
    ),
    fixed: [
      { voice: "wood", stem: "percussion", loop: "E5:.5 -:.25 E5:.25 -:.5 B4:.5 -:.5 E5:.5 B4:1", velocity: 0.12, pan: 0.45, exit: 2 },
      { voice: "wood", stem: "percussion", loop: "E5:.5 -:.25 E5:.25 -:.5 B4:.5 -:.5 E5:.5 B4:1", velocity: 0.1, pan: 0.45, enter: 26, exit: 34 },
    ],
  },
  {
    id: "tools-down",
    situation: "workdone",
    title: "Tools down",
    subtitle: "The last two bars of the work dance on their own: down the chord, up the next, and two stamps.",
    mode: "major",
    tonic: 7,
    bpm: 126,
    meter: 4,
    bars: 3,
    reverb: [0.14, 1.4],
    busy: true,
    lead: "B5:.5 G5:.5 E5:.5 C5:.5 D5:.5 F#5:.5 A5:.5 C6:.5 B5:1 -:1 G5:2 -:4",
    counter: "-:4 D5:1 -:1 B4:2 -:4",
    arp: "C4+E4+G4:.5 -:1.5 A3+D4+F#4:.5 -:1.5 B3+D4+G4:1 -:1 B3+D4+G4:2 -:4",
    bass: "C3:.5 -:1.5 D3:.5 -:1.5 G2:1 -:1 G2:2 -:4",
    pulse: [1, 2],
  },
  {
    id: "the-year-turns-over",
    situation: "timeslip",
    title: "The year turns over",
    subtitle:
      "A ladder of fifths goes up and comes back down; the travel theme's first four notes are heard backwards underneath. The same in every time and place.",
    mode: "major",
    tonic: 0,
    bpm: 100,
    meter: 4,
    bars: 3,
    reverb: [0.6, 5],
    everywhere: true,
    fixed: [
      { voice: "celesta", stem: "melody", loop: "C3:.25 G3:.25 D4:.25 A4:.25 E5:.25 B5:.25 F#6:1.5 -:1 F#6:.25 B5:.25 E5:.25 A4:.25 D4:.25 G3:.25 C3:2.5 -:4", velocity: 0.34, echo: [0.75, 3, 0.5] },
      { voice: "pad", stem: "harmony", loop: "C3+G3+D4:6 -:6", velocity: 0.12 },
      { voice: "sub", stem: "bass", loop: "C2:6 -:6", velocity: 0.2 },
      { voice: "bell", stem: "harmony", loop: "-:6 D5:.5 E5:.5 C5:.5 G4:2.5 -:2", velocity: 0.15, pan: 0.3, echo: [1, 2, 0.5] },
    ],
  },
];

const MAJOR = [0, 2, 4, 5, 7, 9, 11],
  MINOR = [0, 2, 3, 5, 7, 8, 10],
  DORIAN = [0, 2, 3, 5, 7, 9, 10],
  FIVE_MAJOR = [0, 2, 4, 7, 9],
  FIVE_MINOR = [0, 3, 5, 7, 10];
const seven = { major: MAJOR, minor: MINOR },
  five = { major: FIVE_MAJOR, minor: FIVE_MINOR };

interface Dressing {
  id: string;
  label: string;
  culture: CultureId;
  /** Inclusive; the first dressing of a culture whose window holds the year is used. */
  years?: [number, number];
  /** Lead for a bright tune and for a dark one. */
  lead: [Voice, Voice];
  /** Lead for a dance, where it differs from the bright one. */
  lively?: Voice;
  kit?: keyof typeof kits;
  counter: Voice;
  arp?: Voice;
  /** Holds the written chords. A dressing has this or a drone, or neither. */
  pad?: Voice;
  /** Holds tonic and fifth under everything instead of following the chords. */
  drone?: Voice;
  bass?: Voice;
  glint?: Voice;
  /** Drum and the pitch it is struck at. */
  pulse?: [Voice, string];
  /** Semitones above the tonic that the tradition's scale allows; other notes move to the nearest. */
  scale: { major: number[]; minor: number[] };
  /** Cents by semitone above the tonic. */
  tuning?: { major?: Record<number, number>; minor?: Record<number, number> };
  /** Long lead notes are approached from the scale note above. */
  grace?: boolean;
  /** Long lead notes slide up into pitch. */
  scoop?: boolean;
  evidence: string;
}

export const dressings: Dressing[] = [
  {
    id: "europe-early",
    lively: "reed",
    label: "Europe, pipes and lyre",
    culture: "european",
    years: [-13000, 1099],
    lead: ["whistle", "flute"],
    counter: "pluck",
    arp: "pluck",
    drone: "drone",
    scale: seven,
    evidence: "Inference: duct flutes, lyres and drone pipes are documented across ancient and early medieval Europe. The tunes are fiction.",
  },
  {
    id: "europe-medieval",
    label: "Europe, harp and viol",
    culture: "european",
    years: [1100, 1699],
    lead: ["whistle", "flute"],
    counter: "cello",
    arp: "harp",
    pad: "strings",
    glint: "chime",
    scale: seven,
    evidence: "Inference: harp, recorder and bowed viols are documented from the high Middle Ages; chordal accompaniment this plain is a later habit. The tunes are fiction.",
  },
  {
    id: "europe-modern",
    lively: "accordion",
    kit: "parlour",
    label: "Europe, piano and cello",
    culture: "european",
    lead: ["flute", "clarinet"],
    counter: "cello",
    arp: "piano",
    pad: "strings",
    bass: "bass",
    glint: "celesta",
    scale: seven,
    evidence: "Documented instruments: piano, cello, flute, clarinet, celesta (1886). The tunes are fiction.",
  },
  {
    id: "west-asia",
    lively: "reed",
    kit: "maqsum",
    label: "West Asia and North Africa, ney, duduk and oud",
    culture: "north-african-west-asian",
    lead: ["ney", "duduk"],
    counter: "oud",
    arp: "oud",
    drone: "drone",
    pulse: ["frame", "D3"],
    scale: seven,
    tuning: { major: { 4: -40, 11: -40 }, minor: { 2: -50 } },
    grace: true,
    evidence: "Inference: the neutral third of Rast and neutral second of Bayati follow maqam theory; ney, oud and frame drum are documented from the early Islamic period, the duduk's ancestors earlier. The tunes are fiction.",
  },
  {
    id: "steppe",
    kit: "gallop",
    label: "Inner Eurasia, fiddle and overtone drone",
    culture: "inner-eurasian",
    lead: ["erhu", "erhu"],
    counter: "flute",
    arp: "tanbur",
    drone: "throat",
    scale: five,
    scoop: true,
    evidence: "Inference: horsehair fiddles, long-necked lutes, end-blown flutes and overtone singing are documented in steppe traditions; their age is uncertain. The tunes are fiction.",
  },
  {
    id: "south-asia",
    kit: "keherwa",
    label: "South Asia, flute, bowed strings and tanpura",
    culture: "south-asian",
    lead: ["flute", "erhu"],
    counter: "singer",
    arp: "tanbur",
    drone: "tanpura",
    pulse: ["mridanga", "D3"],
    scale: { major: MAJOR, minor: DORIAN },
    grace: true,
    scoop: true,
    evidence: "Inference: bamboo flute, bowed and plucked lutes, a held tonic-and-fifth and barrel drums are documented; the tanpura itself is early modern. The tunes are fiction and follow no raga.",
  },
  {
    id: "east-asia",
    kit: "clapper",
    label: "East Asia, flute, fiddle and zither",
    culture: "east-asian",
    lead: ["flute", "xun"],
    counter: "erhu",
    arp: "koto",
    glint: "chime",
    scale: five,
    scoop: true,
    evidence: "Documented instruments: transverse flute, xun, long zithers, two-string fiddles (from the Tang), stone and bronze chimes. Five-note modes follow classical theory. The tunes are fiction.",
  },
  {
    id: "southeast-asia",
    kit: "gongs",
    label: "Southeast Asia, bronze keys and gong chimes",
    culture: "southeast-asian",
    lead: ["saron", "flute"],
    counter: "khene",
    arp: "bonang",
    glint: "saron",
    scale: five,
    tuning: { major: { 2: 20, 4: 40, 7: 10, 9: 30 }, minor: { 3: -30, 5: -10, 7: 10, 10: -20 } },
    evidence: "Inference: bronze keyed instruments, gong chimes, bamboo flutes and free-reed mouth organs are documented; the tuning leans toward slendro's even steps without reproducing any one gamelan. The tunes are fiction.",
  },
  {
    id: "west-africa",
    kit: "bell",
    label: "West and Central Africa, balafon, flute and harp-lute",
    culture: "west-central-african",
    lead: ["balafon", "flute"],
    counter: "singer",
    arp: "kora",
    pulse: ["shaker", "C4"],
    scale: { major: MAJOR, minor: [0, 2, 3, 5, 7, 10] },
    evidence: "Inference: the balafon is documented from the 14th century (Ibn Battuta), harp-lutes and flutes widely; the kora itself is early modern. The tunes are fiction.",
  },
  {
    id: "east-africa",
    label: "East and Southern Africa, mbira and voices",
    culture: "east-southern-african",
    lead: ["kalimba", "singer"],
    counter: "choir",
    arp: "kalimba",
    pulse: ["shaker", "C4"],
    scale: five,
    evidence: "Inference: lamellophones are archaeologically attested in the Zambezi valley from about 500 CE; sung parts answering an instrument are documented. The tunes are fiction.",
  },
  {
    id: "mesoamerica",
    kit: "sticks",
    label: "Mesoamerica, clay flutes and slit drum",
    culture: "mesoamerican",
    lead: ["whistle", "xun"],
    counter: "panpipe",
    arp: "balafon",
    pulse: ["footdrum", "D2"],
    scale: five,
    evidence: "Documented instruments: clay vessel flutes and whistles, cane flutes, the two-tongued teponaztli slit drum and the upright huehuetl. Scales are inferred from surviving flutes. The tunes are fiction.",
  },
  {
    id: "andes",
    kit: "heartbeat",
    label: "Andes, panpipes, notch flute and drum",
    culture: "andean",
    lead: ["panpipe", "panpipe"],
    counter: "whistle",
    arp: "uke",
    pulse: ["footdrum", "D2"],
    scale: five,
    evidence: "Documented instruments: panpipes, notch flutes and frame drums from antiquity; the small lute is the colonial-era charango. The tunes are fiction.",
  },
  {
    id: "north-america",
    kit: "heartbeat",
    label: "Indigenous Americas, flute, voice and drum",
    culture: "other-indigenous-american",
    lead: ["ney", "ney"],
    counter: "singer",
    pulse: ["footdrum", "D2"],
    scale: five,
    evidence: "Inference: end-blown and duct flutes, sung lines and a steady drum are widely documented; no nation's song is reproduced. The tunes are fiction.",
  },
  {
    id: "pacific-strings",
    kit: "sticks",
    label: "Pacific, steel guitar and ukulele",
    culture: "australian-pacific",
    years: [1880, 2026],
    lead: ["steel", "singer"],
    counter: "choir",
    arp: "uke",
    scale: seven,
    scoop: true,
    evidence: "Documented instruments: ukulele (1880s) and steel guitar (1890s) in Hawaiʻi, with sung harmony. The tunes are fiction.",
  },
  {
    id: "pacific-voices",
    kit: "sticks",
    label: "Australia and the Pacific, voices, drone and sticks",
    culture: "australian-pacific",
    lead: ["singer", "singer"],
    counter: "choir",
    drone: "throat",
    pulse: ["wood", "A#4"],
    scale: five,
    evidence: "Inference: unaccompanied song with clapsticks is documented across Australia and a lip-buzzed drone pipe in the north; no ceremony or song is reproduced. The tunes are fiction.",
  },
];

// Corrections toward equal loudness, from each voice's measured level.
const level: Partial<Record<Voice, number>> = {
  flute: 0.55,
  whistle: 0.65,
  clarinet: 0.7,
  ney: 0.55,
  duduk: 0.85,
  xun: 0.6,
  panpipe: 0.6,
  singer: 2.2,
  choir: 2.4,
  saron: 0.8,
  khene: 1.3,
  harp: 0.9,
  piano: 0.8,
  bonang: 0.8,
  drone: 1.4,
  throat: 1.6,
  bass: 0.7,
  bell: 0.8,
  accordion: 1.1,
  agogo: 1,
};
const breathes = new Set<Voice>(["drone", "throat", "khene", "choir", "accordion", "sho"]);

const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const steps: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function pitch(note: string) {
  return (Number(note.slice(-1)) + 1) * 12 + steps[note[0]] + (note[1] === "#" ? 1 : note[1] === "b" ? -1 : 0);
}
const name = (m: number) => `${names[m % 12]}${Math.floor(m / 12) - 1}`;

/** Moves a line into a scale: a note outside it goes to the nearest note inside
 * (down on a tie), and a repeat that this creates is tied into one longer note. */
function fit(line: string, tonic: number, scale: number[], ornament?: { grace?: boolean; scoop?: boolean }) {
  const snap = (m: number) => {
    for (const d of [0, -1, 1, -2, 2]) if (scale.includes((((m + d - tonic) % 12) + 12) % 12)) return m + d;
    return m;
  };
  const notes: { pitches: number[]; beats: number; moved: boolean }[] = [];
  for (const token of line.split(" ")) {
    const [p, span] = token.split(":"),
      written = p === "-" ? [] : p.split("+").map(pitch),
      pitches = [...new Set(written.map(snap))],
      moved = pitches.some((m, i) => m !== written[i]),
      last = notes[notes.length - 1];
    if (last && pitches.length === 1 && last.pitches.length === 1 && last.pitches[0] === pitches[0] && (moved || last.moved))
      last.beats += Number(span);
    else notes.push({ pitches, beats: Number(span), moved });
  }
  let long = 0;
  return notes
    .map(({ pitches, beats }) => {
      if (!pitches.length) return `-:${beats}`;
      if (ornament && pitches.length === 1 && beats >= 1.5) {
        const above = snap(pitches[0] + 1) > pitches[0] ? snap(pitches[0] + 1) : snap(pitches[0] + 2);
        // Every other long note, so the ornament stays an inflection and not a tic.
        const turn = long++ % 2 === 0;
        if (ornament.grace && turn && above > pitches[0])
          return `${name(above)}:.125 ${name(pitches[0])}:${beats - 0.125}`;
        if (ornament.scoop && beats >= 2 && turn !== !!ornament.grace) return `~${name(pitches[0])}:${beats}`;
      }
      return `${pitches.map(name).join("+")}:${beats}`;
    })
    .join(" ");
}

function dress(tune: Tune, d: Dressing): LayeredTheme {
  const scale = d.scale[tune.mode],
    lead = (tune.busy && d.lively) || d.lead[tune.mode === "major" ? 0 : 1],
    layers: Layer[] = [...(tune.fixed ?? [])];
  const add = (line: string | undefined, voice: Voice | undefined, stem: Layer["stem"], velocity: number, more: Partial<Layer> = {}) => {
    if (line && voice) layers.push({ voice, stem, loop: line, velocity: velocity * (level[voice] ?? 1), ...more });
  };
  const line = (s?: string, ornament?: { grace?: boolean; scoop?: boolean }) => s && fit(s, tune.tonic, scale, ornament);
  add(line(tune.lead, d), lead, "melody", 0.4, { pan: -0.08 });
  add(line(tune.counter), d.counter, "harmony", 0.2, { pan: 0.3 });
  add(line(tune.arp), d.arp, "harmony", 0.2, { pan: -0.25 });
  add(line(tune.pad), d.pad, "harmony", 0.09);
  add(line(tune.bass), d.bass ?? (tune.busy ? d.arp : undefined), "bass", 0.2);
  add(line(tune.ostinato), d.glint ?? d.arp, "harmony", 0.12, { pan: 0.35 });
  add(line(tune.glint), d.glint, "harmony", 0.14, { pan: 0.4 });
  if (d.drone && !tune.everywhere) {
    const low = 36 + tune.tonic,
      span = tune.meter * (breathes.has(d.drone) && tune.bars % 2 === 0 ? 2 : 1);
    add(`${name(low)}+${name(low + 7)}+${name(low + 12)}:${span}`, d.drone, "bass", tune.busy ? 0.06 : 0.1);
  }
  if (d.pulse && tune.pulse)
    add(`${d.pulse[1]}:${tune.meter}`, d.pulse[0], "percussion", 0.12, { enter: tune.pulse[0], exit: tune.pulse[1] });
  if (tune.kit)
    for (const [voice, loop, velocity] of kits[d.kit ?? "village"])
      layers.push({ voice, stem: "percussion", loop, velocity, enter: tune.kit[0], exit: tune.kit[1] });
  const tuning: Record<number, number> = {};
  for (const [degree, cents] of Object.entries(d.tuning?.[tune.mode] ?? {})) tuning[(tune.tonic + Number(degree)) % 12] = cents;
  return {
    id: `${tune.id}--${tune.everywhere ? "anywhere" : d.id}`,
    title: tune.title,
    subtitle: tune.subtitle,
    place: tune.everywhere ? "Any place" : d.label,
    culture: tune.everywhere ? [] : d.culture,
    years: d.years ?? [-13000, 2026],
    evidence: tune.everywhere ? "Fiction: an original cue." : d.evidence,
    bpm: tune.bpm,
    meter: tune.meter,
    bars: tune.bars,
    key: `${names[tune.tonic]} ${tune.mode}`,
    tuning,
    reverb: tune.reverb,
    layers,
  };
}

let all: LayeredTheme[] | undefined;
/** Every tune in every dressing; a tune that sounds the same everywhere appears once. */
export function situationThemes() {
  return (all ??= tunes.flatMap((t) => (t.everywhere ? [dress(t, dressings[0])] : dressings.map((d) => dress(t, d)))));
}

/** The piece for a situation in a setting. `pick` chooses among a situation's tunes. */
export function situationTheme(situation: Situation, culture: CultureId | undefined, year = 0, pick = 0) {
  const choices = tunes.filter((t) => t.situation === situation),
    tune = choices[pick % choices.length];
  if (tune.everywhere) return `${tune.id}--anywhere`;
  const d =
    dressings.find((d) => d.culture === culture && (!d.years || (year >= d.years[0] && year <= d.years[1]))) ??
    dressings.find((d) => d.id === "europe-modern")!;
  return `${tune.id}--${d.id}`;
}
