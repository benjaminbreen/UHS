import type { Voice } from "./score";

export type InstrumentId = "piano" | "lute" | "guitar";

export type TuneNote = { midi: number; dur: number };
export type InstrumentTune = {
  id: string;
  title: string;
  /** Beats per minute for demo playback. */
  bpm: number;
  notes: readonly TuneNote[];
};

export type ChordPreset = {
  label: string;
  /** Shortcut key (Digit1..Digit6) to strum this chord. */
  key: string;
  midis: readonly number[];
};

export type InstrumentSpec = {
  id: InstrumentId;
  name: string;
  subtitle: string;
  /** Voice in `src/audio/synth.ts` used to synthesize live notes. */
  voice: Voice;
  layout: "keys" | "strings";
  /** Lowest MIDI note of the default playable range. */
  baseMidi: number;
  /** Semitone shift bounds (e.g. -12..+12 for octave shifts). */
  minShift: number;
  maxShift: number;
  /** Accent colors for the wooden frame/soundboard. */
  wood: [string, string];
  /** For plucked string instruments: open string MIDI notes from bass to treble. */
  strings?: readonly { label: string; openMidi: number }[];
  chords?: readonly ChordPreset[];
  tunes: readonly InstrumentTune[];
};

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export function midiName(midi: number) {
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

/** Computer-keyboard layout for chromatic playing across 1.5 octaves (lower row white keys, upper row sharps/flats). */
export const KEYBOARD_MAP: readonly { code: string; label: string; offset: number }[] = [
  { code: "KeyA", label: "A", offset: 0 },   // C
  { code: "KeyW", label: "W", offset: 1 },   // C#
  { code: "KeyS", label: "S", offset: 2 },   // D
  { code: "KeyE", label: "E", offset: 3 },   // D#
  { code: "KeyD", label: "D", offset: 4 },   // E
  { code: "KeyF", label: "F", offset: 5 },   // F
  { code: "KeyT", label: "T", offset: 6 },   // F#
  { code: "KeyG", label: "G", offset: 7 },   // G
  { code: "KeyY", label: "Y", offset: 8 },   // G#
  { code: "KeyH", label: "H", offset: 9 },   // A
  { code: "KeyU", label: "U", offset: 10 },  // A#
  { code: "KeyJ", label: "J", offset: 11 },  // B
  { code: "KeyK", label: "K", offset: 12 },  // C+1
  { code: "KeyO", label: "O", offset: 13 },  // C#+1
  { code: "KeyL", label: "L", offset: 14 },  // D+1
  { code: "KeyP", label: "P", offset: 15 },  // D#+1
  { code: "Semicolon", label: ";", offset: 16 }, // E+1
  { code: "Quote", label: "'", offset: 17 }, // F+1
];

export const INSTRUMENTS: Record<InstrumentId, InstrumentSpec> = {
  piano: {
    id: "piano",
    name: "Upright Piano",
    subtitle: "Felt hammers on spruce soundboard",
    voice: "piano",
    layout: "keys",
    baseMidi: 60, // C4
    minShift: -12,
    maxShift: 12,
    wood: ["#4e2c1a", "#2a160c"],
    tunes: [
      {
        id: "minuet",
        title: "Parlour Minuet",
        bpm: 126,
        notes: [
          { midi: 74, dur: 1 }, { midi: 67, dur: 0.5 }, { midi: 69, dur: 0.5 }, { midi: 71, dur: 0.5 }, { midi: 72, dur: 0.5 },
          { midi: 74, dur: 1 }, { midi: 67, dur: 1 }, { midi: 67, dur: 1 },
          { midi: 76, dur: 1 }, { midi: 72, dur: 0.5 }, { midi: 74, dur: 0.5 }, { midi: 76, dur: 0.5 }, { midi: 78, dur: 0.5 },
          { midi: 79, dur: 1 }, { midi: 67, dur: 1 }, { midi: 67, dur: 1 },
        ],
      },
      {
        id: "ragtime",
        title: "Ragtime Stride",
        bpm: 138,
        notes: [
          { midi: 60, dur: 0.5 }, { midi: 64, dur: 0.5 }, { midi: 67, dur: 0.5 }, { midi: 69, dur: 0.5 },
          { midi: 72, dur: 0.5 }, { midi: 69, dur: 0.5 }, { midi: 67, dur: 1 },
          { midi: 62, dur: 0.5 }, { midi: 65, dur: 0.5 }, { midi: 69, dur: 0.5 }, { midi: 71, dur: 0.5 },
          { midi: 74, dur: 0.5 }, { midi: 71, dur: 0.5 }, { midi: 72, dur: 1.5 },
        ],
      },
      {
        id: "nocturne",
        title: "Evening Air",
        bpm: 86,
        notes: [
          { midi: 64, dur: 1 }, { midi: 71, dur: 1 }, { midi: 72, dur: 1.5 }, { midi: 71, dur: 0.5 },
          { midi: 69, dur: 1 }, { midi: 67, dur: 1 }, { midi: 64, dur: 2 },
          { midi: 62, dur: 1 }, { midi: 69, dur: 1 }, { midi: 71, dur: 1.5 }, { midi: 69, dur: 0.5 },
          { midi: 67, dur: 1 }, { midi: 66, dur: 1 }, { midi: 64, dur: 2 },
        ],
      },
    ],
  },
  lute: {
    id: "lute",
    name: "Renaissance Lute",
    subtitle: "Six gut courses over carved spruce",
    voice: "oud",
    layout: "strings",
    baseMidi: 57, // A3
    minShift: -12,
    maxShift: 12,
    wood: ["#7c4c26", "#3d2212"],
    strings: [
      { label: "G4", openMidi: 67 },
      { label: "D4", openMidi: 62 },
      { label: "A3", openMidi: 57 },
      { label: "F3", openMidi: 53 },
      { label: "C3", openMidi: 48 },
      { label: "G2", openMidi: 43 },
    ],
    chords: [
      { label: "Dm", key: "1", midis: [50, 57, 62, 65, 69] },
      { label: "C", key: "2", midis: [48, 55, 60, 64, 67] },
      { label: "F", key: "3", midis: [53, 57, 60, 65, 69] },
      { label: "Gm", key: "4", midis: [43, 50, 55, 58, 62] },
      { label: "A7", key: "5", midis: [45, 52, 57, 61, 67] },
      { label: "Bb", key: "6", midis: [46, 53, 58, 62, 65] },
    ],
    tunes: [
      {
        id: "greensleeves",
        title: "Greensleeves",
        bpm: 112,
        notes: [
          { midi: 57, dur: 1 }, { midi: 60, dur: 2 }, { midi: 62, dur: 1 }, { midi: 64, dur: 1.5 }, { midi: 65, dur: 0.5 }, { midi: 64, dur: 1 },
          { midi: 62, dur: 2 }, { midi: 59, dur: 1 }, { midi: 55, dur: 1.5 }, { midi: 57, dur: 0.5 }, { midi: 59, dur: 1 },
          { midi: 60, dur: 2 }, { midi: 57, dur: 1 }, { midi: 57, dur: 1.5 }, { midi: 56, dur: 0.5 }, { midi: 57, dur: 1 }, { midi: 59, dur: 2 },
        ],
      },
      {
        id: "pavane",
        title: "Court Pavane",
        bpm: 96,
        notes: [
          { midi: 62, dur: 1.5 }, { midi: 65, dur: 0.5 }, { midi: 64, dur: 1 }, { midi: 62, dur: 1 },
          { midi: 60, dur: 1.5 }, { midi: 62, dur: 0.5 }, { midi: 57, dur: 2 },
          { midi: 65, dur: 1 }, { midi: 67, dur: 1 }, { midi: 69, dur: 1.5 }, { midi: 67, dur: 0.5 },
          { midi: 65, dur: 1 }, { midi: 64, dur: 1 }, { midi: 62, dur: 2 },
        ],
      },
    ],
  },
  guitar: {
    id: "guitar",
    name: "Acoustic Guitar",
    subtitle: "Six strings over honey-spruce top",
    voice: "guitar",
    layout: "strings",
    baseMidi: 55, // G3
    minShift: -12,
    maxShift: 12,
    wood: ["#8d582c", "#422412"],
    strings: [
      { label: "E4", openMidi: 64 },
      { label: "B3", openMidi: 59 },
      { label: "G3", openMidi: 55 },
      { label: "D3", openMidi: 50 },
      { label: "A2", openMidi: 45 },
      { label: "E2", openMidi: 40 },
    ],
    chords: [
      { label: "Em", key: "1", midis: [40, 47, 52, 55, 59, 64] },
      { label: "G", key: "2", midis: [43, 47, 50, 55, 59, 67] },
      { label: "C", key: "3", midis: [48, 52, 55, 60, 64] },
      { label: "D", key: "4", midis: [50, 57, 62, 66] },
      { label: "Am", key: "5", midis: [45, 52, 57, 60, 64] },
      { label: "B7", key: "6", midis: [47, 51, 57, 59, 66] },
    ],
    tunes: [
      {
        id: "ballad",
        title: "Folk Ballad",
        bpm: 108,
        notes: [
          { midi: 55, dur: 1 }, { midi: 59, dur: 1 }, { midi: 62, dur: 1 }, { midi: 64, dur: 1.5 }, { midi: 62, dur: 0.5 },
          { midi: 59, dur: 1 }, { midi: 57, dur: 1 }, { midi: 55, dur: 2 },
          { midi: 60, dur: 1 }, { midi: 64, dur: 1 }, { midi: 62, dur: 1 }, { midi: 59, dur: 1 },
          { midi: 57, dur: 1 }, { midi: 59, dur: 1 }, { midi: 55, dur: 2 },
        ],
      },
      {
        id: "blues",
        title: "Porch Blues",
        bpm: 118,
        notes: [
          { midi: 52, dur: 0.75 }, { midi: 55, dur: 0.5 }, { midi: 57, dur: 0.75 }, { midi: 58, dur: 0.5 }, { midi: 59, dur: 1 },
          { midi: 62, dur: 0.75 }, { midi: 64, dur: 1.25 },
          { midi: 62, dur: 0.5 }, { midi: 59, dur: 0.5 }, { midi: 58, dur: 0.5 }, { midi: 57, dur: 0.5 }, { midi: 55, dur: 0.5 }, { midi: 52, dur: 1.5 },
        ],
      },
    ],
  },
};

export function instrumentForProp(prop?: string): InstrumentId | undefined {
  if (prop === "room-piano") return "piano";
  if (prop === "room-lute") return "lute";
  if (prop === "room-guitar") return "guitar";
  return undefined;
}
