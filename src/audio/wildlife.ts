/** Wild voices written sample by sample, so each note has a pitch contour, a
 * soft edge and overtones. A bare oscillator blip reads as a synth squeak. */

const rand = (a: number, b: number) => a + Math.random() * (b - a);

type Note = {
  at: number;
  dur: number;
  /** Pitch along the note, 0 to 1. */
  hz: (u: number) => number;
  amp?: number;
  /** Overtone levels from the second up; a bird's whistle has very little. */
  over?: number[];
  /** Pitch jitter, which makes a caw or a chirp hoarse. */
  rough?: number;
  wobble?: [rate: number, depth: number];
};
const glide = (a: number, b: number) => (u: number) => a * (b / a) ** u;
const arch = (a: number, peak: number) => (u: number) => a + (peak - a) * Math.sin(Math.PI * u);

function sing(sr: number, notes: Note[]) {
  const out = new Float32Array(Math.ceil((Math.max(...notes.map((n) => n.at + n.dur)) + 0.02) * sr));
  for (const { at, dur, hz, amp = 1, over = [0.1, 0.04], rough = 0, wobble } of notes) {
    const len = Math.floor(dur * sr),
      start = Math.floor(at * sr),
      // Never under 6 ms: a harder onset is a click.
      edge = Math.min(0.5, Math.max(0.006 / dur, 0.2)),
      scale = amp / (1 + over.reduce((a, b) => a + b, 0));
    let phase = 0,
      drift = 0;
    for (let k = 0; k < len; k++) {
      const u = k / len;
      drift = drift * 0.97 + rough * (Math.random() * 2 - 1);
      phase += (2 * Math.PI * hz(u) * (1 + drift + (wobble ? wobble[1] * Math.sin((2 * Math.PI * wobble[0] * k) / sr) : 0))) / sr;
      let v = Math.sin(phase);
      for (let h = 0; h < over.length; h++) v += over[h] * Math.sin((h + 2) * phase);
      out[start + k] += scale * v * Math.sin((Math.PI / 2) * Math.min(1, u / edge, (1 - u) / edge)) ** 2;
    }
  }
  return out;
}

export type Voice =
  | "warbler" | "thrush" | "tit" | "trill" | "sparrow" | "dove" | "cuckoo" | "whistler" | "crow" | "gull"
  | "owl" | "treefrog" | "croaker" | "ribbit" | "chitter"
  | "hen" | "duck" | "goose" | "sheep" | "goat" | "cow" | "pig" | "horse" | "donkey" | "cat" | "growl";

/** `rest` is the seconds between one individual's calls; `gain` evens out how
 * loud each register sounds, since the ear is dull to an owl and sharp to a tit. */
const voices: Record<Voice, { rest: [number, number]; gain: number; song: () => Note[] }> = {
  // Robin or warbler: a run of quick, varied syllables, some said two or three times.
  warbler: {
    rest: [4, 10],
    gain: 1,
    song() {
      const notes: Note[] = [];
      let at = 0;
      for (let i = 0, n = Math.round(rand(4, 8)); i < n; i++) {
        const f = rand(2800, 5200),
          dur = rand(0.045, 0.11),
          hz = Math.random() < 0.4 ? arch(f, f * rand(0.8, 1.3)) : glide(f, f * rand(0.7, 1.4)),
          amp = rand(0.5, 1);
        for (let r = Math.random() < 0.35 ? Math.round(rand(2, 3)) : 1; r > 0; r--) {
          notes.push({ at, dur, hz, amp });
          at += dur + rand(0.025, 0.07);
        }
      }
      return notes;
    },
  },
  // Blackbird or thrush: a few slow fluted notes, then a quiet high twiddle.
  thrush: {
    rest: [5, 11],
    gain: 1.3,
    song() {
      const notes: Note[] = [];
      let at = 0;
      for (let i = 0, n = Math.round(rand(3, 5)); i < n; i++) {
        const f = rand(1700, 2900),
          dur = rand(0.14, 0.28);
        notes.push({ at, dur, hz: arch(f, f * rand(0.9, 1.12)), wobble: Math.random() < 0.4 ? [rand(22, 30), 0.02] : undefined });
        at += dur + rand(0.05, 0.12);
      }
      if (Math.random() < 0.6)
        for (let i = 0; i < 3; i++) {
          const f = rand(4500, 6500);
          notes.push({ at, dur: 0.04, hz: glide(f, f * rand(0.8, 1.2)), amp: 0.35 });
          at += 0.06;
        }
      return notes;
    },
  },
  // A tit's two notes, high then low, over and over.
  tit: {
    rest: [4, 9],
    gain: 0.9,
    song() {
      const hi = rand(3800, 4600),
        lo = hi * rand(0.72, 0.8);
      return Array.from({ length: Math.round(rand(3, 5)) }, (_, i) => [
        { at: i * 0.3, dur: 0.1, hz: glide(hi, hi * 0.98) },
        { at: i * 0.3 + 0.135, dur: 0.12, hz: glide(lo, lo * 0.97), amp: 0.85 },
      ]).flat();
    },
  },
  // Chaffinch or wren: one syllable rattled down the scale to a flourish.
  trill: {
    rest: [5, 12],
    gain: 0.9,
    song() {
      const n = Math.round(rand(9, 16)),
        gap = rand(0.06, 0.09),
        top = rand(3800, 5200);
      const notes: Note[] = Array.from({ length: n }, (_, i) => {
        const f = top * (1 - (0.25 * i) / n);
        return { at: i * gap, dur: gap * 0.7, hz: glide(f * 1.2, f * 0.85), amp: 0.5 + (0.5 * i) / n };
      });
      notes.push({ at: n * gap, dur: 0.13, hz: arch(top * 0.7, top * 0.95) });
      return notes;
    },
  },
  sparrow: {
    rest: [1.5, 5],
    gain: 0.7,
    song() {
      let at = 0;
      return Array.from({ length: Math.round(rand(1, 3)) }, () => {
        const f = rand(3000, 4200),
          note: Note = { at, dur: rand(0.05, 0.08), hz: arch(f * 0.85, f * 1.25), over: [0.45, 0.2], rough: 0.004 };
        at += rand(0.14, 0.3);
        return note;
      });
    },
  },
  dove: {
    rest: [6, 14],
    gain: 1.5,
    song() {
      const f = rand(430, 520);
      let at = 0;
      return [[0.2, 0.6], [0.42, 1], [0.2, 0.7], [0.2, 0.55]].slice(0, Math.round(rand(3, 4))).map(([dur, amp]) => {
        const note: Note = { at, dur, amp, hz: (u) => f * (1 + 0.05 * Math.sin(Math.PI * u) - 0.04 * u), over: [0.05], wobble: [rand(18, 24), 0.008] };
        at += dur + 0.12;
        return note;
      });
    },
  },
  cuckoo: {
    rest: [9, 20],
    gain: 1.2,
    song() {
      const f = rand(640, 690);
      return Array.from({ length: Math.round(rand(2, 4)) }, (_, i) => [
        { at: i, dur: 0.17, hz: () => f, over: [0.25, 0.1] },
        { at: i + 0.3, dur: 0.24, hz: glide(f * 0.8, f * 0.78), over: [0.25, 0.1] },
      ]).flat();
    },
  },
  // The slow falling whistles of a tropical forest.
  whistler: {
    rest: [7, 16],
    gain: 1.5,
    song() {
      let f = rand(1300, 1900),
        at = 0;
      return Array.from({ length: Math.round(rand(2, 3)) }, () => {
        const dur = rand(0.3, 0.5),
          note: Note = { at, dur, hz: glide(f, f * rand(0.8, 0.95)), over: [0.04] };
        at += dur + 0.2;
        f *= 0.9;
        return note;
      });
    },
  },
  crow: {
    rest: [10, 25],
    gain: 0.9,
    song() {
      const f = rand(480, 560);
      let at = 0;
      return Array.from({ length: Math.round(rand(2, 4)) }, () => {
        const dur = rand(0.2, 0.3),
          note: Note = { at, dur, hz: (u) => f * (1 + 0.08 * Math.sin(Math.PI * u) - 0.15 * u), over: [1.2, 1.4, 1, 0.6, 0.35, 0.2], rough: 0.012 };
        at += dur + 0.15;
        return note;
      });
    },
  },
  gull: {
    rest: [6, 15],
    gain: 0.9,
    song() {
      const f = rand(850, 1050);
      let at = 0;
      return Array.from({ length: Math.round(rand(3, 5)) }, (_, i) => {
        const dur = 0.34 - 0.04 * i,
          note: Note = { at, dur, hz: arch(f * 0.85, f * 1.35), over: [0.8, 0.6, 0.3, 0.15], rough: 0.003 };
        at += dur + 0.1;
        return note;
      });
    },
  },
  owl: {
    rest: [12, 30],
    gain: 2,
    song() {
      const f = rand(330, 400),
        over = [0.06];
      return [
        { at: 0, dur: 0.5, hz: arch(f, f * 1.03), over },
        { at: 1, dur: 0.1, hz: () => f, over, amp: 0.7 },
        { at: 1.22, dur: 0.75, hz: glide(f, f * 0.95), over, wobble: [9, 0.012] },
      ];
    },
  },
  // "Ko-kee": the two-note whistle of a tropical tree frog.
  treefrog: {
    rest: [1.5, 4],
    gain: 0.7,
    song() {
      const f = rand(1100, 1500);
      return [
        { at: 0, dur: 0.09, hz: glide(f, f * 1.05) },
        { at: 0.13, dur: 0.14, hz: glide(f * 1.45, f * 1.75) },
      ];
    },
  },
  // A pond frog's croak: a rattle of short pulses on one resonance.
  croaker: {
    rest: [3, 9],
    gain: 0.8,
    song() {
      const f = rand(480, 900),
        beat = 1 / rand(28, 40),
        n = Math.round(rand(8, 16));
      return Array.from({ length: n }, (_, i) => ({ at: i * beat, dur: beat * 0.7, hz: () => f, over: [0.5, 0.3], amp: 0.5 + (0.5 * i) / n }));
    },
  },
  // A frog startled into jumping: "rib-bit", two rattles, the second higher.
  ribbit: {
    rest: [3, 9],
    gain: 1,
    song() {
      const f = rand(380, 520),
        beat = 1 / rand(42, 52);
      return [0, 1].flatMap((half) =>
        Array.from({ length: half ? 6 : 4 }, (_, i) => ({
          at: half * (beat * 4 + 0.05) + i * beat,
          dur: beat * 0.75,
          hz: () => f * (half ? 1.4 : 1),
          over: [0.6, 0.4, 0.2],
          amp: half ? 1 : 0.7,
        })),
      );
    },
  },
  // A squirrel scolding from its tree: quick harsh barks that slow and fall.
  chitter: {
    rest: [6, 15],
    gain: 0.8,
    song() {
      const f = rand(2300, 2900),
        n = Math.round(rand(6, 10));
      let at = 0;
      return Array.from({ length: n }, (_, i) => {
        const note: Note = { at, dur: 0.035, hz: glide(f * (1 - 0.03 * i), f * 0.6), over: [0.6, 0.35, 0.2], rough: 0.02, amp: 1 - (0.5 * i) / n };
        at += 0.06 + 0.012 * i;
        return note;
      });
    },
  },
  // A hen put out: a run of clucks and one indignant squawk.
  hen: {
    rest: [4, 10],
    gain: 0.8,
    song() {
      const f = rand(620, 760);
      let at = 0;
      const notes: Note[] = Array.from({ length: Math.round(rand(3, 5)) }, () => {
        const note: Note = { at, dur: 0.05, hz: glide(f, f * 1.25), over: [0.9, 0.7, 0.4, 0.2], rough: 0.01 };
        at += rand(0.09, 0.14);
        return note;
      });
      return [...notes, { at, dur: 0.22, hz: arch(f * 1.3, f * 1.9), over: [1, 0.8, 0.5, 0.3], rough: 0.015 }];
    },
  },
  duck: {
    rest: [4, 10],
    gain: 0.8,
    song() {
      const f = rand(330, 400);
      return Array.from({ length: Math.round(rand(3, 5)) }, (_, i) => ({
        at: i * 0.2, dur: 0.14 - 0.01 * i, hz: glide(f * 1.08, f * 0.9), over: [1.3, 1.5, 1.1, 0.8, 0.5, 0.3], rough: 0.012, amp: 1 - 0.12 * i,
      }));
    },
  },
  goose: {
    rest: [5, 12],
    gain: 0.8,
    song() {
      const f = rand(420, 500);
      return [0, 0.34].map((at, i) => ({ at, dur: 0.26, hz: (u: number) => f * (u < 0.45 ? 1 : 1.5) * (1 - 0.05 * u), over: [1.2, 1, 0.8, 0.5, 0.3], rough: 0.008, amp: 1 - 0.2 * i }));
    },
  },
  // A bleat is one held note with a fast shake in it.
  sheep: {
    rest: [6, 15],
    gain: 0.9,
    song: () => {
      const f = rand(300, 380);
      return [{ at: 0, dur: rand(0.55, 0.8), hz: (u: number) => f * (1 + 0.06 * Math.sin(Math.PI * u)), over: [0.9, 0.8, 0.5, 0.3, 0.15], rough: 0.004, wobble: [rand(11, 14), 0.035] as [number, number] }];
    },
  },
  goat: {
    rest: [6, 15],
    gain: 0.85,
    song: () => {
      const f = rand(430, 520);
      return [{ at: 0, dur: rand(0.4, 0.6), hz: (u: number) => f * (1 + 0.05 * Math.sin(Math.PI * u) - 0.05 * u), over: [1, 0.9, 0.6, 0.35, 0.2], rough: 0.006, wobble: [rand(15, 19), 0.04] as [number, number] }];
    },
  },
  cow: {
    rest: [10, 25],
    gain: 1.6,
    song: () => {
      const f = rand(120, 150);
      return [{ at: 0, dur: rand(0.9, 1.3), hz: (u: number) => f * (1 + 0.28 * Math.sin(Math.PI * Math.min(1, u * 1.6)) - 0.1 * u), over: [1, 0.9, 0.7, 0.45, 0.25, 0.12], rough: 0.003 }];
    },
  },
  pig: {
    rest: [5, 12],
    gain: 1.3,
    song() {
      const f = rand(95, 125);
      let at = 0;
      return Array.from({ length: Math.round(rand(2, 4)) }, () => {
        const dur = rand(0.07, 0.13),
          note: Note = { at, dur, hz: glide(f, f * 0.85), over: [1.2, 1, 0.9, 0.7, 0.5, 0.3], rough: 0.03 };
        at += dur + rand(0.05, 0.1);
        return note;
      });
    },
  },
  // A whinny: high, shaking, and falling away.
  horse: {
    rest: [10, 25],
    gain: 0.9,
    song: () => {
      const f = rand(1000, 1250);
      return [{ at: 0, dur: rand(0.8, 1.1), hz: (u: number) => f * (1 + 0.25 * Math.sin(Math.PI * Math.min(1, u * 3))) * (1 - 0.55 * u), over: [0.7, 0.5, 0.3, 0.15], rough: 0.006, wobble: [rand(9, 12), 0.06] as [number, number] }];
    },
  },
  donkey: {
    rest: [10, 25],
    gain: 1,
    song() {
      const f = rand(300, 360);
      return [0, 1].flatMap((i) => [
        { at: i * 0.62, dur: 0.2, hz: glide(f * 1.9, f * 2.1), over: [0.8, 0.6, 0.4, 0.2], rough: 0.015, amp: 0.7 },
        { at: i * 0.62 + 0.24, dur: 0.32, hz: glide(f, f * 0.85), over: [1.2, 1, 0.8, 0.5, 0.3], rough: 0.02 },
      ]);
    },
  },
  cat: {
    rest: [6, 15],
    gain: 0.8,
    song: () => {
      const f = rand(560, 700);
      return [{ at: 0, dur: rand(0.4, 0.55), hz: (u: number) => f * (1 + 0.35 * Math.sin(Math.PI * Math.min(1, u * 1.4)) - 0.12 * u), over: [0.8, 0.6, 0.35, 0.15], rough: 0.003 }];
    },
  },
  // A dog deciding about you.
  growl: {
    rest: [4, 9],
    gain: 1.6,
    song: () => {
      const f = rand(85, 105);
      return [{ at: 0, dur: rand(0.7, 1), hz: (u: number) => f * (1 + 0.06 * Math.sin(2 * Math.PI * u)), over: [1.1, 1, 0.9, 0.7, 0.5, 0.35, 0.2], rough: 0.035, wobble: [rand(24, 30), 0.03] as [number, number] }];
    },
  },
};
export const sung = (voice: Voice, sr: number) => sing(sr, voices[voice].song());
export const voiceRest = (voice: Voice) => rand(...voices[voice].rest);
export const voiceGain = (voice: Voice) => voices[voice].gain;

type Stereo = [Float32Array, Float32Array];
/** Lays `write` into a loop at a pan position, wrapping past the end. */
function into([l, r]: Stereo, pan: number, start: number, len: number, write: (k: number) => number) {
  const n = l.length,
    a = Math.sqrt(1 - pan),
    b = Math.sqrt(pan);
  for (let k = 0; k < len; k++) {
    const v = write(k),
      i = (((start + k) % n) + n) % n;
    l[i] += a * v;
    r[i] += b * v;
  }
}
const blank = (sr: number, seconds: number): Stereo => [new Float32Array(Math.floor(sr * seconds)), new Float32Array(Math.floor(sr * seconds))];

/** Field crickets on a warm night, as a loop: each keeps its own pitch and
 * its own steady chirp of three or four wing strokes, and some fall silent
 * for a spell. */
export function crickets(sr: number, seconds: number, singers = 7): Stereo {
  const out = blank(sr, seconds);
  for (let s = 0; s < singers; s++) {
    const f = rand(4100, 5100),
      chirps = Math.round(seconds / rand(0.33, 0.6)),
      strokes = Math.random() < 0.6 ? 3 : 4,
      beat = rand(0.028, 0.036),
      amp = 0.12 + 0.6 * Math.random() ** 2.5,
      pan = Math.random(),
      quiet = Math.random(),
      len = Math.floor(beat * 0.62 * sr);
    for (let c = 0; c < chirps; c++) {
      if ((c / chirps + quiet) % 1 < 0.22) continue;
      const t = ((c + rand(-0.04, 0.04)) * seconds) / chirps;
      for (let p = 0; p < strokes; p++)
        into(out, pan, Math.floor((t + p * beat) * sr), len, (k) => amp * Math.sin((Math.PI * k) / len) ** 2 * Math.sin((2 * Math.PI * f * k) / sr));
    }
  }
  return out;
}
/** Tree crickets on a hot night: unbroken trills that swell and sink. Every
 * rate is a whole number of cycles per loop, so there is no seam. */
export function nightTrill(sr: number, seconds: number, singers = 6): Stereo {
  const out = blank(sr, seconds),
    whole = (x: number) => Math.round(x * seconds) / seconds;
  for (let s = 0; s < singers; s++) {
    const f = whole(rand(2600, 3600)),
      rate = whole(rand(38, 58)),
      swell = Math.round(rand(1, 3)) / seconds,
      at = rand(0, 6.3),
      amp = 0.06 + 0.16 * Math.random();
    let hoarse = 0;
    into(out, Math.random(), 0, out[0].length, (k) => {
      const t = k / sr;
      // A dead-steady sine is a test tone; a wing is a little hoarse.
      hoarse = hoarse * 0.999 + 0.02 * (Math.random() - 0.5);
      return amp * (0.4 + 0.6 * Math.sin(2 * Math.PI * swell * t + at)) * Math.sin(Math.PI * ((t * rate) % 1)) ** 2 * Math.sin(2 * Math.PI * f * t + hoarse);
    });
  }
  return out;
}
/** Cicadas in the heat of the day: a hoarse buzz that each insect winds up,
 * holds and lets fall. */
export function cicadas(sr: number, seconds: number, singers = 3): Stereo {
  const out = blank(sr, seconds);
  for (let s = 0; s < singers; s++) {
    const f = rand(4500, 6500),
      buzz = Math.round(rand(120, 200) * seconds) / seconds,
      swell = Math.round(rand(1, 2)) / seconds,
      at = rand(0, 6.3),
      amp = 0.15 + 0.3 * Math.random();
    let phase = 0,
      drift = 0;
    into(out, Math.random(), 0, out[0].length, (k) => {
      const t = k / sr;
      // Pitch jitter spreads the buzz over a band a few hundred hertz wide.
      drift = drift * 0.97 + 0.04 * (Math.random() - 0.5);
      phase += (2 * Math.PI * f * (1 + drift)) / sr;
      return amp * Math.max(0, Math.sin(2 * Math.PI * swell * t + at)) ** 1.5 * (0.35 + 0.65 * Math.sin(Math.PI * ((t * buzz) % 1)) ** 2) * Math.sin(phase);
    });
  }
  return out;
}
