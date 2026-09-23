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
/** Karplus-Strong string; `brightness` 0–1 shapes the pluck, `nasal` adds a pluck-position comb. */
function pluckString(
  data: Float32Array,
  rate: number,
  frequency: number,
  random: () => number,
  brightness: number,
  decay: number,
  nasal: number,
) {
  const period = Math.max(2, Math.round(rate / frequency)),
    loss = Math.exp(-decay / frequency);
  let smooth = 0;
  for (let i = 0; i < Math.min(period, data.length); i++) {
    smooth += (random() - smooth) * brightness;
    data[i] = smooth;
  }
  for (let i = period; i < data.length; i++)
    data[i] =
      loss * 0.5 * (data[i - period] + data[Math.max(0, i - period - 1)]);
  const comb = Math.round(period / 5);
  let peak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    data[i] -= nasal * (i >= comb ? data[i - comb] : 0);
    peak = Math.max(peak, Math.abs(data[i]));
  }
  for (let i = 0; i < data.length; i++) data[i] *= 0.7 / (peak || 1);
}

function instrument(
  ctx: Context,
  voice: Voice,
  midi: number,
  cents = 0,
): AudioBuffer {
  let cache = caches.get(ctx);
  if (!cache) {
    cache = new Map();
    caches.set(ctx, cache);
  }
  const key = `${voice}:${midi}:${cents}`;
  const existing = cache.get(key);
  if (existing) return existing;
  const duration =
    voice === "brush" || voice === "shaker"
      ? 0.25
      : voice === "kick" || voice === "wood" || voice === "sistrum"
        ? 0.5
        : voice === "frame" || voice === "mridanga" || voice === "udu"
          ? 0.9
          : voice === "strings" ||
              voice === "flute" ||
              voice === "bass" ||
              voice === "reed" ||
              voice === "ney" ||
              voice === "drone" ||
              voice === "gong" ||
              voice === "sho" ||
              voice === "throat" ||
              voice === "whistle" ||
              voice === "bronze"
            ? 6
            : 4;
  const buffer = ctx.createBuffer(
    1,
    Math.ceil(duration * ctx.sampleRate),
    ctx.sampleRate,
  );
  const data = buffer.getChannelData(0),
    frequency = 440 * 2 ** ((midi + cents / 100 - 69) / 12);
  const random = noiseGenerator(midi * 9277 + 13);
  if (voice === "pluck" || voice === "oud" || voice === "tanpura") {
    const [brightness, decay, nasal] = {
      pluck: [0.45, 1.4, 0.15],
      oud: [0.8, 2.2, 0.45],
      // Long ring and a strong comb stand in for the jawari buzz.
      tanpura: [0.95, 0.45, 0.35],
    }[voice];
    pluckString(
      data,
      ctx.sampleRate,
      frequency,
      random,
      brightness,
      decay,
      nasal,
    );
    cache.set(key, buffer);
    if (cache.size > 128) cache.delete(cache.keys().next().value!);
    return buffer;
  }
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
    } else if (voice === "reed" || voice === "drone") {
      // Double reed: dense harmonics shaped by a nasal formant near 1.1 kHz.
      const vibrato =
        voice === "reed"
          ? 0.02 * Math.sin(2 * Math.PI * 5.2 * t) * Math.min(1, t * 1.5)
          : 0;
      for (let harmonic = 1; harmonic <= 12; harmonic++) {
        const f = frequency * harmonic;
        if (f > ctx.sampleRate * 0.45) continue;
        const formant = 1 / (1 + ((f - 1100) / 700) ** 2);
        sample +=
          ((voice === "reed" ? 0.25 + formant : 0.5 + formant * 0.3) *
            Math.sin(harmonic * (phase + vibrato))) /
          harmonic ** (voice === "reed" ? 0.9 : 1.4);
      }
      sample = sample * 0.32 + breath * 0.03;
    } else if (voice === "ney") {
      const vibrato =
        0.025 * Math.sin(2 * Math.PI * 4.6 * t) * Math.min(1, t * 0.8);
      sample =
        0.6 * Math.sin(phase + vibrato) +
        0.16 * Math.sin(2 * phase + vibrato) +
        0.05 * Math.sin(3 * phase) +
        breath * (0.16 + 0.2 * Math.exp(-t * 12));
    } else if (voice === "balafon") {
      const tone =
        0.6 * Math.sin(phase) * Math.exp(-t * 5) +
        0.22 * Math.sin(phase * 3.92) * Math.exp(-t * 18);
      // Gourd resonators carry a spider-silk buzz on the positive half-wave.
      sample = tone + (tone > 0 ? breath * 0.25 * Math.exp(-t * 6) : 0);
    } else if (voice === "gong") {
      const sag = 1 - 0.01 * Math.min(1, t * 2);
      sample =
        0.5 * Math.sin(phase * sag) * Math.exp(-t * 0.6) +
        0.22 * Math.sin(phase * 1.48) * Math.exp(-t * 1.1) +
        0.14 * Math.sin(phase * 2.13) * Math.exp(-t * 1.6) +
        0.08 * Math.sin(phase * 2.95) * Math.exp(-t * 2.4);
      sample *= Math.min(1, t * 60);
    } else if (voice === "frame") {
      sample =
        0.8 *
          Math.sin(
            2 * Math.PI * frequency * (t + 0.02 * (1 - Math.exp(-t * 30))),
          ) *
          Math.exp(-t * 7) +
        random() * 0.3 * Math.exp(-t * 45);
    } else if (voice === "wood") {
      sample =
        0.6 * Math.sin(phase) * Math.exp(-t * 22) +
        0.25 * Math.sin(phase * 2.71) * Math.exp(-t * 40) +
        random() * 0.15 * Math.exp(-t * 200);
    } else if (voice === "saron" || voice === "bonang") {
      // Paired instruments tuned a few hertz apart give gamelan its shimmer.
      const beat = 2 * Math.PI * (frequency + 3.5) * t;
      sample =
        voice === "saron"
          ? 0.4 * (Math.sin(phase) + Math.sin(beat)) * Math.exp(-t * 1.3) +
            0.14 * Math.sin(phase * 2.76) * Math.exp(-t * 6) +
            0.06 * Math.sin(phase * 5.4) * Math.exp(-t * 12)
          : 0.36 * (Math.sin(phase) + Math.sin(beat)) * Math.exp(-t * 1.8) +
            0.16 * Math.sin(phase * 2.53) * Math.exp(-t * 4) +
            0.07 * Math.sin(phase * 3.95) * Math.exp(-t * 7);
      sample += random() * 0.12 * Math.exp(-t * 90);
    } else if (voice === "bronze") {
      sample =
        0.45 * Math.sin(phase) * Math.exp(-t * 0.9) +
        0.22 * Math.sin(phase * 2.02) * Math.exp(-t * 1.8) +
        0.14 * Math.sin(phase * 2.95) * Math.exp(-t * 3) +
        0.08 * Math.sin(phase * 4.13) * Math.exp(-t * 5) +
        random() * 0.1 * Math.exp(-t * 60);
    } else if (voice === "chime") {
      sample =
        0.5 * Math.sin(phase) * Math.exp(-t * 3.5) +
        0.2 * Math.sin(phase * 2.32) * Math.exp(-t * 8) +
        0.1 * Math.sin(phase * 4.25) * Math.exp(-t * 14) +
        random() * 0.08 * Math.exp(-t * 150);
    } else if (voice === "sho") {
      for (let harmonic = 1; harmonic <= 8; harmonic++) {
        if (frequency * harmonic > ctx.sampleRate * 0.45) continue;
        sample +=
          ((harmonic % 2 ? 1 : 0.5) * Math.sin(phase * harmonic)) /
          harmonic ** 1.5;
      }
      sample *= 0.4 * (1 + 0.06 * Math.sin(2 * Math.PI * 0.7 * t));
    } else if (voice === "mridanga") {
      // Loaded drumheads ring with near-harmonic overtones.
      const bend = phase * (1 + 0.04 * Math.exp(-t * 20));
      sample =
        0.6 * Math.sin(bend) * Math.exp(-t * 4) +
        0.28 * Math.sin(bend * 2) * Math.exp(-t * 6) +
        0.16 * Math.sin(bend * 3) * Math.exp(-t * 9) +
        random() * 0.2 * Math.exp(-t * 70);
    } else if (voice === "sub") {
      sample = Math.tanh(
        1.4 * (0.7 * Math.sin(phase) + 0.15 * Math.sin(2 * phase)),
      );
      sample *= 0.6 * Math.exp(-t * 0.8);
    } else if (voice === "udu") {
      // Water drum: the pitch sags a few percent after the strike.
      const bend =
        2 * Math.PI * frequency * (t + 0.006 * (1 - Math.exp(-t * 25)));
      sample =
        0.7 * Math.sin(bend) * Math.exp(-t * 5) +
        0.12 * Math.sin(bend * 2) * Math.exp(-t * 9) +
        random() * 0.08 * Math.exp(-t * 80);
    } else if (voice === "kalimba") {
      const tone =
        0.6 * Math.sin(phase) * Math.exp(-t * 2.2) +
        0.12 * Math.sin(phase * 6.3) * Math.exp(-t * 14);
      // Shells or bottle caps on the soundboard rattle with the tine.
      sample = tone + (tone > 0 ? breath * 0.1 * Math.exp(-t * 3) : 0);
    } else if (voice === "throat") {
      for (let harmonic = 1; harmonic <= 24; harmonic++) {
        const f = frequency * harmonic;
        if (f > ctx.sampleRate * 0.45) continue;
        const formant =
          1 / (1 + ((f - 650) / 250) ** 2) +
          0.6 / (1 + ((f - 1600) / 120) ** 2);
        sample +=
          ((0.2 + formant) * Math.sin(phase * harmonic)) / harmonic ** 0.7;
      }
      sample *= 0.18;
    } else if (voice === "whistle") {
      const vibrato =
        0.012 * Math.sin(2 * Math.PI * 5.5 * t) * Math.min(1, t * 1.2);
      sample =
        0.55 * Math.sin(phase + vibrato) +
        0.05 * Math.sin(2 * phase) +
        breath * 0.03;
    } else if (voice === "sistrum") {
      sample =
        random() *
        (Math.sin(2 * Math.PI * 4700 * t) + Math.sin(2 * Math.PI * 6230 * t)) *
        0.3 *
        Math.min(1, t * 200) *
        Math.exp(-t * 14);
    } else if (voice === "shaker") {
      sample =
        (random() - breath) * 0.6 * Math.min(1, t * 120) * Math.exp(-t * 28);
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
    const key = `${note.voice}:${note.midi}:${note.cents ?? 0}`;
    if (prepared.has(key)) continue;
    instrument(ctx, note.voice, note.midi, note.cents);
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
  source.buffer = instrument(ctx, note.voice, note.midi, note.cents);
  const sustained =
    note.voice === "sho" ||
    note.voice === "throat" ||
    note.voice === "whistle" ||
    note.voice === "flute" ||
    note.voice === "strings" ||
    note.voice === "reed" ||
    note.voice === "ney" ||
    note.voice === "drone";
  // Long, unlooped sustained samples avoid discontinuities in vibrato and breath.
  const duration = note.duration * secondsPerBeat;
  const attack = Math.min(
    duration * 0.3,
    note.voice === "sho"
      ? 0.5
      : note.voice === "strings" || note.voice === "drone"
        ? 0.16
        : sustained
          ? 0.055
          : 0.008,
  );
  const release = sustained
    ? 0.2
    : note.voice === "bell" ||
        note.voice === "harp" ||
        note.voice === "pluck" ||
        note.voice === "oud" ||
        note.voice === "balafon" ||
        note.voice === "tanpura" ||
        note.voice === "saron" ||
        note.voice === "bonang" ||
        note.voice === "chime" ||
        note.voice === "kalimba" ||
        note.voice === "udu"
      ? 0.65
      : note.voice === "gong" || note.voice === "bronze"
        ? 2.5
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
