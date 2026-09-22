import type { Weather } from "../core/weather";

/** How loud each ambient bed should be, 0 to 1. */
export interface AmbienceMix {
  rain: number;
  wind: number;
  birds: number;
  insects: number;
  water: number;
  /** Sea swell rather than running water: changes the water bed's colour. */
  swell: number;
  town: number;
  fire: number;
  /** 1 when the player is under a roof: the outdoor beds go muffled. */
  inside: number;
  /** What the music is multiplied by. Rain and interiors pull it down. */
  music: number;
}
export const silence: AmbienceMix = {
  rain: 0,
  wind: 0,
  birds: 0,
  insects: 0,
  water: 0,
  swell: 0,
  town: 0,
  fire: 0,
  inside: 0,
  music: 1,
};

export interface Scene {
  weather: Weather;
  indoors: boolean;
  /** Tiles to the nearest lit fire in the player's own space. */
  fireDistance: number;
  water?: { kind: "sea" | "river" | "lake" | "canal"; distance: number };
  /** Tiles to the nearest settlement centre, and its size. */
  townDistance: number;
  townSize: number;
  peopleNear: number;
  night: boolean;
  season: "spring" | "summer" | "autumn" | "winter";
  climate: string;
  /** Hour of the day, 0 to 24. */
  hour: number;
}
/** Falls off from 1 at `near` to 0 at `far`. */
const near = (distance: number, near: number, far: number) =>
  Math.max(0, Math.min(1, (far - distance) / (far - near)));

export function ambienceFor(scene: Scene): AmbienceMix {
  const { weather, indoors, hour, season, climate } = scene;
  const rain = weather.condition === "rain" ? 1 : 0;
  const wind = Math.max(0, (weather.wind.strength - 0.2) / 0.8);
  // Dawn chorus, then a quieter daytime; birds shelter from rain and hard wind.
  const chorus = hour > 4.5 && hour < 8 ? 1 : hour < 18 ? 0.45 : 0;
  const cold = climate === "tundra" || climate === "boreal";
  const birds =
    chorus *
    (1 - rain) *
    (1 - 0.6 * wind) *
    (season === "winter" ? (cold ? 0.15 : 0.4) : 1);
  // Crickets need a warm night. Cold places never get them.
  const warm = weather.tempC > 12;
  const insects = scene.night && warm && !rain && !cold ? 0.85 : 0;
  const water = scene.water ? near(scene.water.distance, 2, 22) : 0;
  const swell = scene.water?.kind === "sea" ? 1 : 0;
  const town =
    Math.min(1, near(scene.townDistance, 6, 40) * (0.4 + scene.townSize / 12) +
      Math.min(0.5, scene.peopleNear * 0.12)) *
    // People go quiet at night and under heavy rain.
    (scene.night ? 0.25 : 1) *
    (1 - 0.5 * rain);
  const fire = near(scene.fireDistance, 1.5, 9);
  return {
    rain,
    wind: Math.min(1, wind + rain * 0.2),
    birds,
    insects,
    water,
    swell,
    town,
    fire,
    inside: indoors ? 1 : 0,
    // Stardew hands rain the whole soundstage; a roof takes the edge off too.
    music: (rain ? 0.25 : 1) * (indoors ? 0.6 : 1),
  };
}

function noiseBuffer(ctx: BaseAudioContext, seconds: number) {
  const buffer = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Continuous environmental beds. Levels glide slowly, so weather, a doorway or
 * a passing crowd never arrives as a click. */
export class Ambience {
  private beds = {} as Record<
    "rain" | "wind" | "water" | "town" | "fire",
    GainNode
  >;
  private chirps: GainNode;
  private outside: BiquadFilterNode;
  private waterTone: BiquadFilterNode;
  private sources: AudioScheduledSourceNode[] = [];
  private ticker?: ReturnType<typeof setInterval>;
  private level: AmbienceMix = { ...silence };
  constructor(
    private ctx: AudioContext,
    out: AudioNode,
  ) {
    // Everything outdoors passes through one filter, so a roof muffles the lot.
    this.outside = ctx.createBiquadFilter();
    this.outside.type = "lowpass";
    this.outside.frequency.value = 20000;
    this.outside.connect(out);
    // Loop lengths are coprime-ish so the noise beds never line up audibly.
    const loop = (seconds: number) => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, seconds);
      src.loop = true;
      src.start();
      this.sources.push(src);
      return src;
    };
    const bed = (name: keyof Ambience["beds"], into: AudioNode) => {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(into);
      this.beds[name] = g;
      return g;
    };
    const lfo = (rate: number, depth: number, target: AudioParam) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = rate;
      const d = ctx.createGain();
      d.gain.value = depth;
      osc.connect(d).connect(target);
      osc.start();
      this.sources.push(osc);
    };

    // Rain: a low roar plus the brighter hiss of drops on leaves.
    const rain = bed("rain", this.outside);
    const rainSrc = loop(4.3);
    const roar = ctx.createBiquadFilter();
    roar.type = "lowpass";
    roar.frequency.value = 900;
    const roarGain = ctx.createGain();
    roarGain.gain.value = 0.22;
    const hiss = ctx.createBiquadFilter();
    hiss.type = "bandpass";
    hiss.frequency.value = 5200;
    hiss.Q.value = 0.6;
    const hissGain = ctx.createGain();
    hissGain.gain.value = 0.07;
    rainSrc.connect(roar).connect(roarGain).connect(rain);
    rainSrc.connect(hiss).connect(hissGain).connect(rain);

    // Wind: band-passed noise whose centre drifts, so it gusts and sighs.
    const wind = bed("wind", this.outside);
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 420;
    band.Q.value = 1.4;
    lfo(0.09, 220, band.frequency);
    const windGain = ctx.createGain();
    windGain.gain.value = 0.12;
    lfo(0.053, 0.06, windGain.gain);
    loop(5.7).connect(band).connect(windGain).connect(wind);

    // Water: the same noise reads as a stream when bright, as surf when the
    // filter closes and a slow swell breathes over it.
    const water = bed("water", this.outside);
    this.waterTone = ctx.createBiquadFilter();
    this.waterTone.type = "lowpass";
    this.waterTone.frequency.value = 3200;
    const waterGain = ctx.createGain();
    waterGain.gain.value = 0.16;
    lfo(0.11, 0.07, waterGain.gain);
    loop(6.7).connect(this.waterTone).connect(waterGain).connect(water);

    // Town: a formless murmur of voices and work, too far off to make out.
    const town = bed("town", this.outside);
    const murmur = ctx.createBiquadFilter();
    murmur.type = "bandpass";
    murmur.frequency.value = 520;
    murmur.Q.value = 2.2;
    lfo(0.19, 120, murmur.frequency);
    const townGain = ctx.createGain();
    townGain.gain.value = 0.085;
    lfo(0.13, 0.05, townGain.gain);
    loop(7.9).connect(murmur).connect(townGain).connect(town);

    // Birds and crickets are scheduled one call at a time, not looped.
    this.chirps = ctx.createGain();
    this.chirps.gain.value = 1;
    this.chirps.connect(this.outside);

    // Fire stays dry and close: it is in the room with you, so no muffling.
    const fire = bed("fire", out);
    const emberFilter = ctx.createBiquadFilter();
    emberFilter.type = "lowpass";
    emberFilter.frequency.value = 1100;
    const emberGain = ctx.createGain();
    emberGain.gain.value = 0.13;
    lfo(0.23, 0.05, emberGain.gain);
    loop(3.1).connect(emberFilter).connect(emberGain).connect(fire);

    this.ticker = setInterval(() => this.tick(), 120);
  }
  set(mix: AmbienceMix) {
    this.level = mix;
    const now = this.ctx.currentTime;
    const glide = (param: AudioParam, value: number, seconds: number) =>
      param.setTargetAtTime(value, now, seconds);
    glide(this.beds.rain.gain, mix.rain, 2.5);
    glide(this.beds.wind.gain, mix.wind, 3);
    glide(this.beds.water.gain, mix.water, 2);
    glide(this.beds.town.gain, mix.town, 3);
    glide(this.beds.fire.gain, mix.fire, 1.2);
    glide(this.waterTone.frequency, mix.swell ? 700 : 3200, 2);
    // A roof cuts the top off the outside world and drops its level.
    glide(this.outside.frequency, mix.inside ? 620 : 20000, 0.6);
    glide(this.chirps.gain, mix.inside ? 0.35 : 1, 0.6);
  }
  /** Sparse one-off voices: drips, birdsong, crickets and popping embers. */
  private tick() {
    const { rain, birds, insects, fire } = this.level;
    if (rain > 0.05 && Math.random() < 0.3 * rain) this.drip();
    if (birds > 0.02 && Math.random() < 0.09 * birds) this.birdcall(birds);
    // Crickets pulse in bursts rather than at even spacing.
    if (insects > 0.02 && Math.random() < 0.3 * insects) this.cricket(insects);
    if (fire > 0.05 && Math.random() < 0.12 * fire) this.pop(fire);
  }
  private blip(
    into: AudioNode,
    at: number,
    from: number,
    to: number,
    peak: number,
    dur: number,
    wave: OscillatorType = "sine",
  ) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(from, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + Math.min(0.02, dur * 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    const pan = ctx.createStereoPanner();
    pan.pan.value = rand(-0.8, 0.8);
    osc.connect(g).connect(pan).connect(into);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }
  private drip() {
    const at = this.ctx.currentTime + rand(0, 0.1);
    this.blip(this.beds.rain, at, rand(1800, 4200), 700, rand(0.012, 0.03), 0.05);
  }
  /** Two or three notes of a call, each a short whistle with a little bend. */
  private birdcall(level: number) {
    const at = this.ctx.currentTime + 0.05;
    const base = rand(1900, 3600),
      notes = Math.round(rand(2, 4));
    for (let i = 0; i < notes; i++)
      this.blip(
        this.chirps,
        at + i * rand(0.07, 0.14),
        base * rand(0.9, 1.15),
        base * rand(1.1, 1.5),
        0.02 * level,
        rand(0.04, 0.08),
        "triangle",
      );
  }
  /** A cricket's chirp is a fast buzz, so this is a short run of tight pulses. */
  private cricket(level: number) {
    const at = this.ctx.currentTime + 0.05;
    const pitch = rand(3800, 5200);
    for (let i = 0; i < 4; i++)
      this.blip(
        this.chirps,
        at + i * 0.045,
        pitch,
        pitch,
        0.008 * level,
        0.02,
        "square",
      );
  }
  private pop(level: number) {
    const at = this.ctx.currentTime + rand(0, 0.1);
    this.blip(
      this.beds.fire,
      at,
      rand(400, 1400),
      180,
      rand(0.01, 0.05) * level,
      rand(0.02, 0.06),
      "triangle",
    );
  }
  dispose() {
    clearInterval(this.ticker);
    for (const source of this.sources)
      try {
        source.stop();
      } catch {
        /* Already stopped. */
      }
    this.outside.disconnect();
    this.beds.fire.disconnect();
  }
}
