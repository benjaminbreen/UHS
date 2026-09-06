import type { Note, Stem, Voice, Score } from "./score";
import { stems } from "./score";

type Context = AudioContext | OfflineAudioContext;
const caches = new WeakMap<Context, Map<string, AudioBuffer>>();
function noiseGenerator(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2147483648 - 1;
  };
}
/** Small original instrument bank, synthesized locally; no recordings or external assets. */
function instrument(ctx: Context, voice: Voice, midi: number): AudioBuffer {
  let cache = caches.get(ctx);
  if (!cache) {
    cache = new Map();
    caches.set(ctx, cache);
  }
  const key = `${voice}:${midi}`;
  const existing = cache.get(key);
  if (existing) return existing;
  const duration =
    voice === "brush"
      ? 0.25
      : voice === "kick"
        ? 0.5
        : voice === "strings" || voice === "flute" || voice === "bass"
          ? 6
          : 4;
  const buffer = ctx.createBuffer(
    1,
    Math.ceil(duration * ctx.sampleRate),
    ctx.sampleRate,
  );
  const data = buffer.getChannelData(0),
    frequency = 440 * 2 ** ((midi - 69) / 12);
  const random = noiseGenerator(midi * 9277 + 13);
  let breath = 0;
  for (let i = 0; i < data.length; i++) {
    const t = i / ctx.sampleRate,
      phase = 2 * Math.PI * frequency * t;
    breath = breath * 0.72 + random() * 0.28;
    let sample = 0;
    if (voice === "flute") {
      const vibrato =
        0.018 * Math.sin(2 * Math.PI * 4.7 * t) * Math.min(1, t * 2);
      sample =
        0.65 * Math.sin(phase + vibrato) +
        0.12 * Math.sin(2 * phase + vibrato) +
        0.035 * Math.sin(3 * phase) +
        breath * 0.065;
    } else if (voice === "strings") {
      for (let harmonic = 1; harmonic <= 6; harmonic++) {
        if (frequency * harmonic > ctx.sampleRate * 0.45) continue;
        sample +=
          ((Math.sin(phase * harmonic * 0.9985) +
            Math.sin(phase * harmonic * 1.0015)) *
            0.24) /
          harmonic ** 1.6;
      }
    } else if (voice === "harp") {
      for (let harmonic = 1; harmonic <= 7; harmonic++) {
        if (frequency * harmonic > ctx.sampleRate * 0.45) continue;
        sample +=
          (0.58 / harmonic ** 1.7) *
          Math.sin(phase * harmonic) *
          Math.exp(-t * (1.3 + harmonic * 0.5));
      }
    } else if (voice === "bell") {
      sample =
        0.6 * Math.sin(phase) * Math.exp(-t * 1.1) +
        0.2 * Math.sin(phase * 2.003) * Math.exp(-t * 2.6) +
        0.055 * Math.sin(phase * 4.01) * Math.exp(-t * 4);
    } else if (voice === "keys") {
      sample =
        0.6 *
          Math.sin(phase + 0.8 * Math.sin(phase * 2) * Math.exp(-t * 3)) *
          Math.exp(-t * 0.95) +
        0.1 * Math.sin(phase * 0.999) * Math.exp(-t * 1.2);
    } else if (voice === "bass") {
      sample =
        (0.72 * Math.sin(phase) + 0.16 * Math.sin(phase * 2)) *
        Math.exp(-t * 0.7);
    } else if (voice === "kick") {
      sample =
        0.8 *
          Math.sin(2 * Math.PI * (47 * t + 6 * (1 - Math.exp(-t * 24)))) *
          Math.exp(-t * 13) +
        breath * 0.13 * Math.exp(-t * 50);
    } else sample = (random() * 0.5 + breath * 0.3) * Math.exp(-t * 32);
    data[i] = sample;
  }
  cache.set(key, buffer);
  // Keep long listening sessions bounded as the player auditions different scores.
  if (cache.size > 128) cache.delete(cache.keys().next().value!);
  return buffer;
}

/** Prepare timbres before the audio clock starts, so synthesis cannot delay attacks. */
export async function prepareScore(
  ctx: AudioContext,
  score: Score,
  current: () => boolean,
) {
  const prepared = new Set<string>();
  for (const note of score.notes) {
    if (!current()) return;
    const key = `${note.voice}:${note.midi}`;
    if (prepared.has(key)) continue;
    instrument(ctx, note.voice, note.midi);
    prepared.add(key);
    if (prepared.size % 4 === 0)
      await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

export interface MixBus {
  input: GainNode;
  stems: Record<Stem, GainNode>;
  disconnect: () => void;
}
export function createMix(
  ctx: Context,
  destination: AudioNode,
  bpm: number,
  levels: Record<Stem, number>,
): MixBus {
  const input = ctx.createGain(),
    dry = ctx.createGain(),
    wet = ctx.createGain();
  dry.gain.value = 0.8;
  wet.gain.value = 0.22;
  const convolver = ctx.createConvolver();
  const impulse = ctx.createBuffer(
    2,
    Math.floor(ctx.sampleRate * 2.6),
    ctx.sampleRate,
  );
  const random = noiseGenerator(541);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    let low = 0;
    for (let i = 0; i < data.length; i++) {
      low = low * 0.6 + random() * 0.4;
      data[i] =
        low *
        Math.exp((-i / ctx.sampleRate) * 2.8) *
        Math.min(1, i / (ctx.sampleRate * 0.035));
    }
  }
  convolver.buffer = impulse;
  const delay = ctx.createDelay(2),
    echo = ctx.createGain(),
    filter = ctx.createBiquadFilter();
  delay.delayTime.value = (60 / bpm) * 0.75;
  echo.gain.value = 0.13;
  filter.type = "lowpass";
  filter.frequency.value = 2400;
  input.connect(dry).connect(destination);
  input.connect(convolver).connect(wet).connect(destination);
  input.connect(delay).connect(filter).connect(echo).connect(destination);
  const channels = Object.fromEntries(
    stems.map((stem) => {
      const gain = ctx.createGain();
      gain.gain.value = levels[stem];
      gain.connect(input);
      return [stem, gain];
    }),
  ) as Record<Stem, GainNode>;
  return {
    input,
    stems: channels,
    disconnect: () => {
      Object.values(channels).forEach((n) => n.disconnect());
      [input, dry, wet, convolver, delay, filter, echo].forEach((n) =>
        n.disconnect(),
      );
    },
  };
}

export function scheduleNote(
  ctx: Context,
  target: AudioNode,
  note: Note,
  at: number,
  secondsPerBeat: number,
): AudioBufferSourceNode {
  const source = ctx.createBufferSource(),
    envelope = ctx.createGain(),
    pan = ctx.createStereoPanner();
  source.buffer = instrument(ctx, note.voice, note.midi);
  const sustained = note.voice === "flute" || note.voice === "strings";
  // Long, unlooped sustained samples avoid discontinuities in vibrato and breath.
  const duration = note.duration * secondsPerBeat;
  const attack = Math.min(
    duration * 0.3,
    note.voice === "strings" ? 0.16 : note.voice === "flute" ? 0.055 : 0.008,
  );
  const release = sustained
    ? 0.2
    : note.voice === "bell" || note.voice === "harp"
      ? 0.65
      : 0.12;
  envelope.gain.setValueAtTime(0, at);
  envelope.gain.linearRampToValueAtTime(note.velocity, at + attack);
  envelope.gain.setValueAtTime(note.velocity, at + Math.max(attack, duration));
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration + release);
  pan.pan.value = note.pan;
  source.connect(envelope).connect(pan).connect(target);
  source.start(at);
  source.stop(at + duration + release + 0.02);
  source.onended = () => {
    source.disconnect();
    envelope.disconnect();
    pan.disconnect();
  };
  return source;
}

export const effects = [
  {
    id: "step",
    name: "Footstep · earth",
    detail: "A soft, dry footfall",
    icon: "↟",
  },
  {
    id: "water",
    name: "Water · ripple",
    detail: "Small drops on a still pool",
    icon: "≈",
  },
  {
    id: "select",
    name: "Interface · select",
    detail: "A light wooden note",
    icon: "◇",
  },
  {
    id: "gather",
    name: "Gather · found",
    detail: "A warm rising chime",
    icon: "✧",
  },
  {
    id: "door",
    name: "Door · wood",
    detail: "Low timber and a latch",
    icon: "⌑",
  },
  {
    id: "hour",
    name: "Time · passing",
    detail: "A small, suspended cadence",
    icon: "◷",
  },
] as const;
export type EffectId = (typeof effects)[number]["id"];
export function effectNotes(id: EffectId): Note[] {
  const patterns: Record<EffectId, [Voice, number, number, number][]> = {
    step: [
      ["brush", 40, 0, 0.45],
      ["kick", 40, 0.035, 0.17],
    ],
    water: [
      ["bell", 81, 0, 0.24],
      ["bell", 88, 0.13, 0.18],
      ["bell", 84, 0.3, 0.12],
    ],
    select: [["harp", 76, 0, 0.4]],
    gather: [
      ["harp", 67, 0, 0.4],
      ["bell", 74, 0.12, 0.3],
      ["bell", 79, 0.24, 0.23],
    ],
    door: [
      ["kick", 32, 0, 0.4],
      ["brush", 45, 0.07, 0.25],
      ["harp", 40, 0.16, 0.26],
    ],
    hour: [
      ["bell", 72, 0, 0.25],
      ["bell", 79, 0.22, 0.2],
      ["bell", 83, 0.44, 0.17],
    ],
  };
  return patterns[id].map(([voice, pitch, beat, velocity]) => ({
    voice,
    midi: pitch,
    beat,
    velocity,
    duration: 0.18,
    stem: "percussion",
    pan: 0,
  }));
}

export async function renderWav(
  score: Score,
  levels: Record<Stem, number>,
): Promise<Blob> {
  const sampleRate = 44100,
    secondsPerBeat = 60 / score.bpm;
  const ctx = new OfflineAudioContext(
    2,
    Math.ceil((score.beats * secondsPerBeat + 4) * sampleRate),
    sampleRate,
  );
  const master = ctx.createGain();
  master.gain.value = 0.72;
  master.connect(ctx.destination);
  const mix = createMix(ctx, master, score.bpm, levels);
  score.notes.forEach((note) =>
    scheduleNote(
      ctx,
      mix.stems[note.stem],
      note,
      note.beat * secondsPerBeat,
      secondsPerBeat,
    ),
  );
  const rendered = await ctx.startRendering();
  const channels = [rendered.getChannelData(0), rendered.getChannelData(1)];
  let peak = 0;
  channels.forEach((data) => {
    for (const n of data) peak = Math.max(peak, Math.abs(n));
  });
  const normalization = peak > 0.92 ? 0.92 / peak : 1;
  const bytes = new ArrayBuffer(44 + rendered.length * 4),
    view = new DataView(bytes);
  const write = (offset: number, value: string) =>
    [...value].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  write(0, "RIFF");
  view.setUint32(4, bytes.byteLength - 8, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, rendered.length * 4, true);
  for (let i = 0; i < rendered.length; i++)
    for (let c = 0; c < 2; c++)
      view.setInt16(
        44 + i * 4 + c * 2,
        Math.max(-1, Math.min(1, channels[c][i] * normalization)) * 32767,
        true,
      );
  mix.disconnect();
  return new Blob([bytes], { type: "audio/wav" });
}
