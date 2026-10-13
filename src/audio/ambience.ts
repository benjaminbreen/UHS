import type { Weather } from "../core/weather";
import { noise, playSound, railway, ring, tone, type Sound } from "./sfx";

/** What a settlement's street sounds like, by period and size. */
export type TownKind = "village" | "town" | "industrial" | "modern";
/** What marks the hours: church bells, a temple bell, the call to prayer, a
 * factory whistle. */
export type Bell = "church" | "temple" | "adhan" | "whistle";

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
  /** Size of the room the player stands in, 0 to 1; 0 outdoors. */
  room: number;
  /** How hard the room's surfaces are, 0 (hide, thatch) to 1 (plaster, tile). */
  hard: number;
  townKind: TownKind;
  bell?: Bell;
  /** 0 to 1: how well the bells carry this far from the town. */
  bells: number;
  hour: number;
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
  room: 0,
  hard: 0,
  townKind: "village",
  bells: 0,
  hour: 12,
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
  year?: number;
  /** The local faith, from the settlement's religious building. */
  faith?: string;
  /** The room underfoot: floor cells, and its finish 0 to 2. */
  room?: { area: number; finish: number };
}

export function townKindFor(year: number | undefined, size: number): TownKind {
  if (year === undefined || year < -2500 || size < 60) return "village";
  return year < 1830 ? "town" : year < 1920 ? "industrial" : "modern";
}
// Church bells spread through Latin Europe from about the sixth century; a
// factory whistle marks the hours of an industrial town where no faith does.
export function bellFor(faith: string | undefined, year = 0): Bell | undefined {
  if (faith === "Islam") return "adhan";
  if (faith === "Buddhism") return "temple";
  if ((faith === "Catholic" || faith === "Latin Christian") && year >= 600)
    return "church";
  if (year >= 1850) return "whistle";
  return undefined;
}
/** The hours each bell sounds. The adhan's five prayers are set to fixed
 * hours, not the sun. */
const bellHours: Record<Bell, number[]> = {
  church: [6, 9, 12, 15, 18, 21],
  temple: [6, 18],
  adhan: [5, 12, 15, 18, 20],
  whistle: [7, 12, 18],
};
/** Falls off from 1 at `near` to 0 at `far`. */
const near = (distance: number, near: number, far: number) =>
  Math.max(0, Math.min(1, (far - distance) / (far - near)));

export function ambienceFor(scene: Scene): AmbienceMix {
  const { weather, indoors, hour, season, climate } = scene;
  const rain = weather.condition === "rain" ? 1 : 0;
  // Falling snow deadens a place: fewer birds, fewer voices, no patter.
  const hush = weather.condition === "snow" ? 0.6 : 0;
  const wind = Math.max(0, (weather.wind.strength - 0.2) / 0.8);
  // Dawn chorus, then a quieter daytime; birds shelter from rain and hard wind.
  const chorus = hour > 4.5 && hour < 8 ? 1 : hour < 18 ? 0.45 : 0;
  const cold = climate === "tundra" || climate === "boreal";
  const birds =
    chorus *
    (1 - rain) *
    (1 - hush) *
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
    (1 - 0.5 * rain) *
    (1 - 0.5 * hush);
  const fire = near(scene.fireDistance, 1.5, 9);
  return {
    rain,
    wind: Math.min(1, wind * (1 - 0.4 * hush) + rain * 0.2),
    birds,
    insects,
    water,
    swell,
    town,
    fire,
    inside: indoors ? 1 : 0,
    room: scene.room ? Math.min(1, Math.max(0.1, (scene.room.area - 8) / 120)) : 0,
    hard: scene.room ? scene.room.finish / 2 : 0,
    townKind: townKindFor(scene.year, scene.townSize),
    bell: bellFor(scene.faith, scene.year),
    bells: near(scene.townDistance, 15, 90) * (1 - 0.6 * hush),
    hour,
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
  private lastHour?: number;
  constructor(
    private ctx: AudioContext,
    private out: AudioNode,
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
    const before = this.lastHour;
    this.level = mix;
    this.lastHour = mix.hour;
    const struck = Math.floor(mix.hour);
    // Only an hour walked through, not one slept or travelled past.
    const ahead = before === undefined ? 0 : (mix.hour - before + 24) % 24;
    if (mix.bell && mix.bells > 0.02 && ahead > 0 && ahead < 1.5 &&
        struck !== Math.floor(before!) && bellHours[mix.bell].includes(struck))
      this.ring(mix.bell, struck, mix.bells);
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
    const { town, townKind, inside, hard } = this.level;
    if (town > 0.05 && Math.random() < 0.035 * town)
      this.street(townKind, town);
    if (rain > 0.05 && inside && Math.random() < 0.5 * rain) this.roof(hard);
  }
  private oneShot(sound: Sound, into: AudioNode, pan = rand(-0.8, 0.8)) {
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = pan;
    panner.connect(into);
    playSound(this.ctx, panner, sound, this.ctx.currentTime + 0.05);
    const longest = Math.max(...sound.map((l) => l.at + l.dur));
    setTimeout(() => panner.disconnect(), (longest + 1) * 1000);
  }
  /** One sound off the street: who and what depends on the period. */
  private street(kind: TownKind, level: number) {
    const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
    const make = pick(streetSounds[kind]);
    this.oneShot(make(0.5 + 0.5 * level), this.outside);
  }
  /** Rain on the roof overhead: soft thuds on thatch, ticks on tile. */
  private roof(hard: number) {
    const sound =
      Math.random() < hard
        ? [tone(0, 0.025, 0.012, rand(2400, 4200), { to: 1600, wave: "triangle" })]
        : [noise(0, 0.05, 0.02, rand(300, 700), { q: 1.5 })];
    this.oneShot(sound, this.out, rand(-0.6, 0.6));
  }
  private ring(bell: Bell, hour: number, level: number) {
    const pan = rand(-0.5, 0.5);
    this.oneShot(bellSound(bell, hour, level), this.outside, pan);
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

type Maker = (g: number) => Sound;
const rep = (n: number, gap: number, make: (at: number, i: number) => Sound): Sound =>
  Array.from({ length: n }, (_, i) => make(i * gap * rand(0.85, 1.15), i)).flat();
const dog: Maker = (g) =>
  rep(Math.round(rand(1, 3)), 0.32, (at) => [
    tone(at, 0.12, 0.03 * g, rand(420, 560), { to: 300, wave: "sawtooth", attack: 0.01 }),
    noise(at, 0.08, 0.02 * g, 900, { q: 1.2 }),
  ]);
const hen: Maker = (g) =>
  rep(Math.round(rand(3, 6)), 0.11, (at) => [
    tone(at, 0.05, 0.015 * g, rand(700, 950), { to: 600, wave: "triangle" }),
  ]);
const call: Maker = (g) => {
  const base = rand(200, 380);
  return [
    tone(0, 0.35, 0.02 * g, base, { to: base * 1.18, wave: "triangle", attack: 0.05 }),
    tone(0.4, 0.5, 0.018 * g, base * 1.18, { to: base * 0.9, wave: "triangle", attack: 0.05 }),
  ];
};
const quern: Maker = (g) =>
  rep(3, 0.75, (at) => [noise(at, 0.6, 0.025 * g, 260, { q: 2, attack: 0.15 })]);
const chop: Maker = (g) =>
  rep(Math.round(rand(2, 4)), 0.7, (at) => [
    noise(at, 0.05, 0.035 * g, 1200, { q: 1.5 }),
    tone(at, 0.1, 0.02 * g, 180, { to: 120, wave: "triangle" }),
  ]);
const anvil: Maker = (g) =>
  rep(Math.round(rand(3, 6)), 0.38, (at) => ring(at, 1300, 0.6, 0.012 * g));
const hooves: Maker = (g) =>
  rep(8, 0.16, (at, i) => [noise(at + (i % 2) * 0.05, 0.03, 0.02 * g, 1600, { q: 2 })]);
const wheels: Maker = (g) => [
  noise(0, 2.2, 0.02 * g, 180, { filter: "lowpass", attack: 0.6 }),
  ...rep(14, 0.15, (at) => [noise(at + 0.2, 0.03, 0.012 * g, 900, { q: 1.5 })]),
];
const horn: Maker = (g) => [
  tone(0, 0.3, 0.012 * g, rand(380, 440), { wave: "sawtooth", attack: 0.02 }),
  tone(0, 0.3, 0.01 * g, 480, { wave: "sawtooth", attack: 0.02 }),
];
const engine: Maker = (g) => [
  noise(0, 3, 0.03 * g, 110, { to: 160, filter: "lowpass", attack: 1.4 }),
  tone(0, 3, 0.01 * g, 55, { to: 75, wave: "sawtooth", attack: 1.4 }),
];
const streetSounds: Record<TownKind, Maker[]> = {
  village: [dog, hen, call, quern, chop],
  town: [dog, hen, call, anvil, hooves, wheels],
  industrial: [dog, call, anvil, hooves, wheels, (g) => railway.whistle(0.15 * g)],
  modern: [dog, call, horn, engine, engine],
};

function bellSound(bell: Bell, hour: number, g: number): Sound {
  switch (bell) {
    case "church":
      return rep(((hour + 11) % 12) + 1, 1.7, (at) => ring(at, 440, 3.5, 0.03 * g));
    case "temple":
      return rep(3, 7, (at) => [...ring(at, 98, 7, 0.05 * g), tone(at, 7, 0.02 * g, 98.5)]);
    case "whistle":
      return [
        tone(0, 2.8, 0.02 * g, 380, { wave: "triangle", attack: 0.3, to: 372 }),
        tone(0, 2.8, 0.015 * g, 570, { wave: "triangle", attack: 0.3, to: 560 }),
      ];
    case "adhan": {
      // A sung phrase from afar: long held notes that turn at the end.
      const notes = [220, 247, 262, 247, 220, 196, 220];
      return notes.flatMap((f, i) =>
        tone(i * 0.9, i === notes.length - 1 ? 2.2 : 1, 0.02 * g, f, {
          to: f * (i % 2 ? 0.97 : 1.03),
          wave: "triangle",
          attack: 0.15,
        }),
      );
    }
  }
}

/** Sound effects pass through here: panned, then given the room's echo. */
export class Room {
  private dry: GainNode;
  private send: GainNode;
  private verb: ConvolverNode;
  private tone: BiquadFilterNode;
  private shape = "";
  constructor(
    private ctx: AudioContext,
    out: AudioNode,
  ) {
    this.dry = ctx.createGain();
    this.dry.connect(out);
    this.send = ctx.createGain();
    this.send.gain.value = 0;
    this.verb = ctx.createConvolver();
    this.tone = ctx.createBiquadFilter();
    this.tone.type = "lowpass";
    this.dry.connect(this.send).connect(this.verb).connect(this.tone).connect(out);
  }
  input(pan: number): AudioNode {
    if (!pan) return this.dry;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    panner.connect(this.dry);
    setTimeout(() => panner.disconnect(), 6000);
    return panner;
  }
  set(mix: AmbienceMix) {
    const now = this.ctx.currentTime;
    const shape = `${mix.room.toFixed(1)}:${mix.hard.toFixed(1)}`;
    if (mix.room && shape !== this.shape) {
      this.shape = shape;
      this.verb.buffer = impulse(this.ctx, 0.25 + mix.room * 1.3, 2 + 3 * (1 - mix.hard));
      this.tone.frequency.value = 2200 + 5000 * mix.hard;
    }
    // A hut of hides swallows a footstep; a plastered hall hands it back.
    const wet = mix.room ? 0.18 + 0.3 * mix.hard : 0;
    this.send.gain.setTargetAtTime(wet, now, 0.3);
  }
}
function impulse(ctx: BaseAudioContext, seconds: number, decay: number) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++)
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return buffer;
}
