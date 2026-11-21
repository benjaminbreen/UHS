import type { Weather } from "../core/weather";
import type { InteriorProfile, RoomRole, WorshipSound } from "../content/interiors/types";
import type { FloorPattern } from "../render/interiors/room";
import { handle, pageTurn, writing, writingTool, type Writing } from "./handling";
import { footstep, noise, playSound, railway, ring, tone, type Sound } from "./sfx";
import { cicadas, crickets, nightTrill, sung, voiceGain, voiceRest, type Voice } from "./wildlife";

type RoomCue = WorshipSound | "footsteps" | "cloth" | "cup" | "tray" | "wheels" | "writing" | "pages" | "wood" | "voices" | "inkstone";
type RoomActivity = { cues: RoomCue[]; tool: Writing; ground: "fiber" | "stone" | "timber" | "soil"; level: number };

/** What a settlement's street sounds like, by period and size. */
export type TownKind = "village" | "town" | "industrial" | "modern";
/** What marks the hours: church bells, a temple bell, the call to prayer, a
 * factory whistle. */
export type Bell = "church" | "semantron" | "temple" | "toki" | "adhan" | "whistle";

/** What the rain is falling on outdoors. */
export type Surface = "leaves" | "needles" | "grass" | "ground" | "paving";

/** How loud each ambient bed should be, 0 to 1. */
export interface AmbienceMix {
  /** How hard it is raining: under 0.25 a drizzle, over 0.75 a downpour. */
  rain: number;
  surface: Surface;
  /** How often thunder rolls in: only in a warm, heavy rain. */
  thunder: number;
  /** Frogs calling on a warm wet night. */
  frogs: number;
  wind: number;
  birds: number;
  /** Which birds sing here: woodland, town, coast and climate each bring their own. */
  cast: Voice[];
  owls: number;
  /** Chirping field crickets on a warm night. */
  insects: number;
  /** The unbroken tree-cricket trill of a hot night. */
  trill: number;
  /** Cicadas in the heat of the day. */
  cicadas: number;
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
  activity?: RoomActivity;
  townKind: TownKind;
  bell?: Bell;
  /** 0 to 1: how well the bells carry this far from the town. */
  bells: number;
  /** Game day: Sunday and Friday are kept differently. */
  day: number;
  hour: number;
  /** What the music is multiplied by. Rain and interiors pull it down. */
  music: number;
}
export const silence: AmbienceMix = {
  rain: 0,
  surface: "grass",
  thunder: 0,
  frogs: 0,
  wind: 0,
  birds: 0,
  cast: [],
  owls: 0,
  insects: 0,
  trill: 0,
  cicadas: 0,
  water: 0,
  swell: 0,
  town: 0,
  fire: 0,
  inside: 0,
  room: 0,
  hard: 0,
  townKind: "village",
  bells: 0,
  day: 0,
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
  /** Today is the town's market day. */
  market?: boolean;
  night: boolean;
  season: "spring" | "summer" | "autumn" | "winter";
  climate: string;
  ecology?: string;
  /** Hour of the day, 0 to 24, and the game day. */
  hour: number;
  day?: number;
  year?: number;
  culture?: string;
  lon?: number;
  lat?: number;
  /** The local faith, from the settlement's religious building. */
  faith?: string;
  /** The room underfoot: floor cells, and its finish 0 to 2. */
  room?: { area: number; finish: number; institution?: InteriorProfile["institution"]; role?: RoomRole; floor?: FloorPattern;
    stock?: string; clinical?: boolean; distance?: number; rite?: WorshipSound; openAir?: boolean };
}

export function townKindFor(year: number | undefined, size: number): TownKind {
  if (year === undefined || year < -2500 || size < 60) return "village";
  return year < 1830 ? "town" : year < 1920 ? "industrial" : "modern";
}
// Church bells spread through Latin Europe from about the sixth century; a
// factory whistle marks the hours of an industrial town where no faith does.
// Under the Ottomans, Orthodox churches were mostly allowed only the wooden
// semantron; bells came back with Greek independence and never left Russia.
// Edo's temple bells rang the hours for the town from the 1600s until the
// clock came in 1873.
export function bellFor(faith: string | undefined, year = 0, lon = 0, lat = 0): Bell | undefined {
  if (faith && /Islam|Muslim/.test(faith)) return "adhan";
  if (faith && /Buddhis/.test(faith))
    return lon >= 129 && lon <= 146 && lat >= 30 && year >= 1600 && year < 1873 ? "toki" : "temple";
  if (faith && /Orthodox|Armenian/.test(faith) && year >= 600)
    return year < 1830 && lat < 48 && year >= 1450 ? "semantron" : "church";
  if (faith && /Catholic|Christian|Protestant/.test(faith) && year >= 600) return "church";
  if (year >= 1850) return "whistle";
  return undefined;
}
// Game day 0 is a Wednesday (see agenda.ts).
const SUNDAY = 4,
  FRIDAY = 2;
/** The hours each bell sounds. The adhan's five prayers are set to fixed
 * hours, not the sun, and Edo's twelve temporal hours to every second hour. */
const bellHours: Record<Bell, number[]> = {
  church: [6, 9, 12, 15, 18, 21],
  semantron: [6, 18],
  temple: [6, 18],
  toki: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22],
  adhan: [5, 12, 15, 18, 20],
  whistle: [7, 12, 18],
};
/** Falls off from 1 at `near` to 0 at `far`. */
const near = (distance: number, near: number, far: number) =>
  Math.max(0, Math.min(1, (far - distance) / (far - near)));

/** Rain sounds of what it hits: leaves in woodland, needles in the boreal
 * forest, bare earth in the desert, stone and roofs in a sizeable town. */
export function surfaceFor(scene: Scene): Surface {
  const kind = townKindFor(scene.year, scene.townSize);
  if (kind !== "village" && scene.townDistance < 14) return "paving";
  switch (scene.ecology) {
    case "temperate-woodland":
    case "tropical-woodland":
    case "wetland":
      return "leaves";
    case "boreal-woodland":
      return "needles";
    case "desert":
    case "dry-scrub":
    case "tundra":
      return "ground";
  }
  if (scene.climate === "tropical" || scene.climate === "monsoon") return "leaves";
  return scene.climate === "arid" ? "ground" : "grass";
}
const ramp = (x: number, from: number, to: number) =>
  Math.max(0, Math.min(1, (x - from) / (to - from)));

const woods = (scene: Scene) => !!scene.ecology?.endsWith("woodland");
function birdCast(scene: Scene): Voice[] {
  const { climate, ecology, season } = scene;
  const cast: Voice[] =
    climate === "tropical" || climate === "monsoon" ? ["whistler", "dove", "warbler", "trill"]
    : climate === "arid" || ecology === "desert" || ecology === "dry-scrub" ? ["dove", "sparrow", "warbler"]
    : climate === "tundra" || climate === "boreal" ? ["tit", "trill", "crow"]
    : woods(scene) ? ["thrush", "warbler", "tit", "trill", "dove"]
    : ["warbler", "trill", "sparrow", "crow"];
  // The two-note cuckoo is an Old World bird, and only calls in the breeding season.
  if (climate === "temperate" && (season === "spring" || season === "summer") && (scene.lon ?? 0) > -30) cast.push("cuckoo");
  if (scene.townSize && scene.townDistance < 20) cast.push("sparrow", "dove");
  if (scene.water?.kind === "sea" && scene.water.distance < 16) cast.push("gull", "gull");
  return cast;
}

function roomActivity({ indoors, room, year, culture, peopleNear }: Scene): RoomActivity | undefined {
  if (!indoors || !room?.institution || !peopleNear) return;
  const {role, floor, institution} = room;
  const ground = floor === "earth" || floor === "sand" ? "soil" : floor === "plank" || floor === "parquet" ? "timber" :
    floor && ["mat","rushes","carpet","broadloom","paper"].includes(floor) ? "fiber" : "stone";
  const cues: RoomCue[] = ["footsteps"];
  let tool = writingTool(year, culture);
  switch (institution) {
    case "worship":
      if (room.rite) cues.push(room.rite);
      break;
    case "hospital":
      cues.push("cloth");
      if (role !== "store") cues.push(room.clinical ? "tray" : "cup");
      if (room.clinical && (role === "ward" || role === "entry")) cues.push("wheels");
      break;
    case "school":
      if (role === "classroom" || role === "work") {
        if (tool === "tap") tool = "pencil";
        cues.push("writing","pages", ground === "fiber" ? "cloth" : "wood");
      } else cues.push("voices");
      break;
    case "magistracy":
      if (role === "work" || role === "store") cues.push("writing","pages", tool === "brush" ? "inkstone" : "wood");
      else cues.push("voices","pages");
      break;
    case "bazaar":
      cues.push(room.stock === "cloth" ? "cloth" : room.stock === "pots" ? "cup" : "wood", "voices");
      break;
  }
  return { cues, tool, ground, level: (.55 + .45 * Math.min(1, peopleNear / 5)) * near(room.distance ?? 0, 1, 15) };
}

export function ambienceFor(scene: Scene): AmbienceMix {
  const { weather, hour, season, climate } = scene;
  const indoors = scene.indoors && !scene.room?.openAir;
  // Older callers built weather before rain had a strength; treat theirs as steady rain.
  const rain = weather.condition === "rain" ? (weather.rain || 0.5) : 0;
  const wet = Math.min(1, rain * 2);
  // Falling snow deadens a place: fewer birds, fewer voices, no patter.
  const hush = weather.condition === "snow" ? 0.6 : 0;
  const wind = Math.max(0, (weather.wind.strength - 0.2) / 0.8);
  // Dawn chorus, then a quieter daytime; birds shelter from rain and hard wind.
  const chorus = hour > 4.5 && hour < 8 ? 1 : hour < 18 ? 0.45 : 0;
  const cold = climate === "tundra" || climate === "boreal";
  const birds =
    chorus *
    (1 - wet) *
    (1 - hush) *
    (1 - 0.6 * wind) *
    (season === "winter" ? (cold ? 0.15 : 0.4) : 1);
  // Crickets need a warm night. Cold places never get them.
  const warm = weather.tempC > 12;
  const insects = scene.night && warm && !rain && !cold ? 0.85 : 0;
  const hot = climate === "tropical" || climate === "monsoon" || (season === "summer" && !cold);
  const trill = scene.night && hot ? ramp(weather.tempC, 17, 24) * (1 - 0.7 * wet) : 0;
  const cicadas = !scene.night && hour > 9 && hour < 18.5 && hot ? ramp(weather.tempC, 23, 30) * (1 - wet) * 0.8 : 0;
  const owls = scene.night && (woods(scene) || cold) ? 0.6 * (1 - wet) * (1 - 0.6 * wind) : 0;
  // Frogs want warmth and wet: the tropics after dark, or a temperate summer
  // night once it has rained.
  const froggy =
    climate === "tropical" || climate === "monsoon" || scene.ecology === "wetland" ||
    (season === "summer" && climate === "temperate");
  const frogs =
    scene.night && warm && froggy ? Math.min(1, 0.3 + weather.wetness) * (1 - 0.6 * ramp(rain, 0.6, 1)) : 0;
  const water = scene.water ? near(scene.water.distance, 2, 22) : 0;
  const swell = scene.water?.kind === "sea" ? 1 : 0;
  const town =
    Math.min(1, (near(scene.townDistance, 6, 40) * (0.4 + scene.townSize / 12) +
      (indoors ? 0 : Math.min(0.5, scene.peopleNear * 0.12))) * (scene.market ? 1.4 : 1)) *
    // People go quiet at night and under heavy rain.
    (scene.night ? 0.25 : 1) *
    (1 - 0.6 * ramp(rain, 0.2, 0.9)) *
    (1 - 0.5 * hush);
  const fire = near(scene.fireDistance, 1.5, 9);
  const surface = surfaceFor(scene);
  return {
    rain,
    surface,
    thunder: warm || weather.tempC > 8 ? ramp(rain, 0.65, 1) : 0,
    frogs,
    wind: Math.min(1, wind * (1 - 0.4 * hush) + rain * 0.25),
    birds,
    cast: birdCast(scene),
    owls,
    insects,
    trill,
    cicadas,
    water,
    swell,
    town,
    fire,
    inside: indoors ? 1 : 0,
    room: indoors && scene.room ? Math.min(1, Math.max(0.1, (scene.room.area - 8) / 120)) : 0,
    hard: scene.room ? scene.room.finish / 2 : 0,
    activity: roomActivity(scene),
    townKind: townKindFor(scene.year, scene.townSize),
    bell: bellFor(scene.faith, scene.year, scene.lon, scene.lat),
    bells: near(scene.townDistance, 15, 90) * (1 - 0.6 * hush),
    hour,
    day: scene.day ?? 0,
    // Stardew hands a downpour the whole soundstage; a drizzle leaves the
    // music be. A roof takes the edge off too.
    music: (1 - 0.75 * ramp(rain, 0.15, 0.7)) * (indoors ? 0.6 : 1),
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

type Bed = { node: GainNode; start?: () => void };
/** One animal within earshot: it stays where it is and repeats its own song. */
type Caller = { group: "birds" | "owls" | "frogs"; voice: Voice; songs: AudioBuffer[]; pan: number; gain: number; tone: number; next: number };

/** Continuous environmental beds. Levels glide slowly, so weather, a doorway or
 * a passing crowd never arrives as a click. Built on a plain BaseAudioContext so
 * the same mix can be rendered offline for review. */
export class Ambience {
  private beds = {} as Record<
    | "rain"
    | "wind"
    | "water"
    | "town"
    | "fire"
    | "crickets"
    | "trill"
    | "cicadas",
    Bed
  >;
  private callers: Caller[] = [];
  private chirps: GainNode;
  private outside: BiquadFilterNode;
  private waterTone: BiquadFilterNode;
  private sources: AudioScheduledSourceNode[] = [];
  private ticker?: ReturnType<typeof setInterval>;
  private cursor = 0;
  private level: AmbienceMix = { ...silence };
  private lastHour?: number;
  private workSounds: GainNode;
  private nextActivity = 0;
  private lastCue?: RoomCue;
  private heardCues = new Set<RoomCue>();
  constructor(
    private ctx: BaseAudioContext,
    out: AudioNode,
    private live = true,
    roomOut: AudioNode = out,
  ) {
    this.workSounds = ctx.createGain();
    this.workSounds.gain.value = 0;
    this.workSounds.connect(roomOut);
    // Everything outdoors passes through one filter, so a roof muffles the lot.
    this.outside = ctx.createBiquadFilter();
    this.outside.type = "lowpass";
    this.outside.frequency.value = 20000;
    this.outside.connect(out);
    const lfo = (rate: number, depth: number, target: AudioParam) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = rate;
      const d = ctx.createGain();
      d.gain.value = depth;
      osc.connect(d).connect(target);
      osc.start();
      this.sources.push(osc);
    };
    const filter = (type: BiquadFilterType, hz: number, q = 0.7) => {
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = hz;
      f.Q.value = q;
      return f;
    };
    const loud = (value: number) => {
      const g = ctx.createGain();
      g.gain.value = value;
      return g;
    };
    const rain = loud(0);
    rain.connect(this.outside);
    this.beds.rain = {
      node: rain,
      start: () => {
        const source = this.loop(noiseBuffer(ctx, 4.3));
        source.connect(filter("lowpass", 900, 1)).connect(loud(0.22)).connect(rain);
        source.connect(filter("bandpass", 5200, 0.6)).connect(loud(0.07)).connect(rain);
      },
    };

    // Wind: band-passed noise whose centre drifts, so it gusts and sighs.
    const band = filter("bandpass", 420, 1.4);
    lfo(0.09, 220, band.frequency);
    const windGain = loud(0.12);
    lfo(0.053, 0.06, windGain.gain);
    this.beds.wind = this.bed(this.outside, () => noiseBuffer(ctx, 5.7), band, windGain);

    // Water: the same noise reads as a stream when bright, as surf when the
    // filter closes and a slow swell breathes over it.
    this.waterTone = filter("lowpass", 3200);
    const waterGain = loud(0.16);
    lfo(0.11, 0.07, waterGain.gain);
    this.beds.water = this.bed(this.outside, () => noiseBuffer(ctx, 6.7), this.waterTone, waterGain);

    // Town: a formless murmur of voices and work, too far off to make out.
    const murmur = filter("bandpass", 520, 2.2);
    lfo(0.19, 120, murmur.frequency);
    const townGain = loud(0.085);
    lfo(0.13, 0.05, townGain.gain);
    this.beds.town = this.bed(this.outside, () => noiseBuffer(ctx, 7.9), murmur, townGain);

    // Calls are scheduled one at a time. Open air still carries a little of
    // each back from the trees, which is what puts a bird at a distance.
    this.chirps = ctx.createGain();
    this.chirps.gain.value = 1;
    this.chirps.connect(this.outside);
    const air = ctx.createConvolver();
    air.buffer = impulse(ctx, 1.4, 3);
    this.chirps.connect(loud(0.3)).connect(air).connect(this.outside);
    const insects = (make: typeof crickets, seconds: number, gain: number) =>
      this.bed(this.chirps, () => {
        const [l, r] = make(ctx.sampleRate, seconds),
          buffer = ctx.createBuffer(2, l.length, ctx.sampleRate);
        buffer.getChannelData(0).set(l);
        buffer.getChannelData(1).set(r);
        return buffer;
      }, loud(gain));
    this.beds.crickets = insects(crickets, 11.3, 0.07);
    this.beds.trill = insects(nightTrill, 9.1, 0.045);
    this.beds.cicadas = insects(cicadas, 13.7, 0.08);

    // Fire stays dry and close: it is in the room with you, so no muffling.
    const emberGain = loud(0.13);
    lfo(0.23, 0.05, emberGain.gain);
    this.beds.fire = this.bed(out, () => noiseBuffer(ctx, 3.1), filter("lowpass", 1100), emberGain);

    if (live)
      this.ticker = setInterval(
        () => this.advance((this.ctx as AudioContext).currentTime + 0.3),
        120,
      );
  }
  private bed(out: AudioNode, buffer: () => AudioBuffer, ...chain: AudioNode[]): Bed {
    const node = this.ctx.createGain();
    node.gain.value = 0;
    node.connect(out);
    return {
      node,
      start: () => [this.loop(buffer()), ...chain, node].reduce((a, b) => a.connect(b)),
    };
  }
  private loop(buffer: AudioBuffer) {
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.start();
    this.sources.push(src);
    return src;
  }
  /** `instant` skips the glide, for an offline render that starts mid-storm. */
  set(mix: AmbienceMix, instant = false) {
    const before = this.lastHour;
    if (mix.activity && !this.level.activity) this.nextActivity = this.ctx.currentTime + rand(.6, 1.6);
    this.level = mix;
    this.lastHour = mix.hour;
    const struck = Math.floor(mix.hour);
    // Only an hour walked through, not one slept or travelled past.
    const ahead = before === undefined ? 0 : (mix.hour - before + 24) % 24;
    if (mix.bell && mix.bells > 0.02 && ahead > 0 && ahead < 1.5 &&
        struck !== Math.floor(before!) && bellHours[mix.bell].includes(struck))
      this.ring(mix.bell, struck, mix.bells, mix.day % 7);
    const now = this.ctx.currentTime;
    const glide = (param: AudioParam, value: number, seconds: number) =>
      instant ? param.setValueAtTime(value, now) : param.setTargetAtTime(value, now, seconds);
    const fade = (bed: Bed, value: number, seconds: number) => {
      if (bed.start) {
        if (value <= 0) return;
        bed.start();
        bed.start = undefined;
      }
      glide(bed.node.gain, value, seconds);
    };
    fade(this.beds.rain, mix.rain, 2.5);
    fade(this.beds.wind, mix.wind, 3);
    fade(this.beds.water, mix.water, 2);
    fade(this.beds.town, mix.town, 3);
    fade(this.beds.fire, mix.fire, 1.2);
    fade(this.beds.crickets, mix.insects, 4);
    fade(this.beds.trill, mix.trill, 4);
    fade(this.beds.cicadas, mix.cicadas, 4);
    glide(this.workSounds.gain, (mix.activity?.level ?? 0) * 1.65, .22);
    glide(this.waterTone.frequency, mix.swell ? 700 : 3200, 2);
    // A roof cuts the top off the outside world and drops its level.
    glide(this.outside.frequency, mix.inside ? 620 : 20000, 0.6);
    glide(this.chirps.gain, mix.inside ? 0.35 : 1, 0.6);
  }
  /** Schedules the one-off voices up to `until` on the context's clock: live,
   * a little ahead of now; offline, the whole render at once. */
  advance(until: number) {
    this.cursor = Math.max(this.cursor, this.ctx.currentTime);
    for (; this.cursor < until; this.cursor += 0.12) this.tick(this.cursor + 0.05);
  }
  /** Sparse one-off voices: thunder, birdsong, frogs, crickets and
   * popping embers. */
  private tick(at: number) {
    const work = this.level.activity;
    if (work && at >= this.nextActivity) {
      let choices = work.cues.filter(c => !this.heardCues.has(c));
      if (!choices.length) {
        this.heardCues.clear();
        choices = work.cues.length > 1 ? work.cues.filter(c => c !== this.lastCue) : work.cues;
      }
      const cue = choices[Math.floor(Math.random() * choices.length)];
      this.lastCue = cue;
      this.heardCues.add(cue);
      this.oneShot(roomSound(cue, work), this.workSounds, at);
      this.nextActivity = at + rand(2.3, 5.5) / Math.max(.45, work.level);
    }
    const { thunder, frogs, birds, owls, fire, cast, surface } = this.level;
    if (thunder > 0.02 && Math.random() < 0.004 * thunder) this.thunder(at, thunder);
    // A dawn chorus is more birds singing more often, not louder birds.
    this.chorus("birds", birds > 0.02 ? 1 + Math.round(birds * 4.4) : 0, cast, at, 1 / (0.5 + 1.2 * birds));
    this.chorus("owls", owls > 0.02 ? 1 : 0, ["owl"], at, 1);
    this.chorus("frogs", frogs > 0.02 ? Math.ceil(frogs * 3) : 0, surface === "leaves" ? ["treefrog", "treefrog", "croaker"] : ["croaker"], at, 1 / (0.3 + frogs));
    if (fire > 0.05 && Math.random() < 0.12 * fire) this.pop(at, fire);
    const { town, townKind } = this.level;
    if (town > 0.05 && Math.random() < 0.035 * town)
      this.street(at, townKind, town);
  }
  private oneShot(sound: Sound, into: AudioNode, at: number, pan = rand(-0.8, 0.8)) {
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = pan;
    panner.connect(into);
    playSound(this.ctx, panner, sound, at);
    const longest = Math.max(...sound.map((l) => l.at + l.dur));
    if (this.live) setTimeout(() => panner.disconnect(), (at - this.ctx.currentTime + longest + 1) * 1000);
  }
  /** One sound off the street: who and what depends on the period. */
  private street(at: number, kind: TownKind, level: number) {
    const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
    const make = pick(streetSounds[kind]);
    this.oneShot(make(0.5 + 0.5 * level), this.outside, at);
  }
  private ring(bell: Bell, hour: number, level: number, weekday: number) {
    const pan = rand(-0.5, 0.5);
    this.oneShot(bellSound(bell, hour, level, weekday), this.outside, this.ctx.currentTime + 0.05, pan);
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
  /** A roll of thunder: a crack if it is close, then a long low tumble. */
  private thunder(at: number, level: number) {
    const ctx = this.ctx,
      sr = ctx.sampleRate;
    const close = Math.random() < 0.25;
    const seconds = rand(5, 9);
    const buffer = ctx.createBuffer(2, Math.floor(sr * seconds), sr);
    let lo = 0;
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      // A handful of swells, each a strike further down the cloud.
      const swells = Array.from({ length: Math.round(rand(2, 5)) }, () => [rand(0, seconds * 0.6), rand(0.6, 1.8), rand(0.4, 1)]);
      for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        lo = lo * 0.995 + (Math.random() * 2 - 1) * 0.05;
        let env = 0;
        for (const [start, width, peak] of swells) {
          const d = (t - start) / width;
          if (d > -1) env += peak * (d < 0 ? 1 + d : Math.exp(-d));
        }
        const crack = close ? (Math.random() * 2 - 1) * Math.exp(-t / 0.08) * 0.6 : 0;
        data[i] = lo * env * Math.min(1, t * 8) + crack;
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = close ? 1800 : 420;
    const g = ctx.createGain();
    g.gain.value = (close ? 0.9 : 0.6) * (0.6 + 0.4 * level);
    src.connect(tone).connect(g).connect(this.outside);
    src.start(at);
  }
  /** Keeps `want` callers of a group singing from the local cast, each at
   * its own spot. `pace` stretches the rests between songs. */
  private chorus(group: Caller["group"], want: number, cast: Voice[], at: number, pace: number) {
    const ctx = this.ctx;
    let here = this.callers.filter((c) => c.group === group);
    const stay = here.filter((c) => cast.includes(c.voice)).slice(0, want);
    if (stay.length < here.length) this.callers = this.callers.filter((c) => c.group !== group || stay.includes(c));
    here = stay;
    if (here.length < want && cast.length) {
      const voice = cast[Math.floor(Math.random() * cast.length)],
        far = Math.random();
      const songs = [0, 1].map(() => {
        const data = sung(voice, ctx.sampleRate),
          buffer = ctx.createBuffer(1, data.length, ctx.sampleRate);
        buffer.getChannelData(0).set(data);
        return buffer;
      });
      this.callers.push({ group, voice, songs, pan: rand(-0.9, 0.9), gain: 0.05 * voiceGain(voice) * (0.25 + 0.75 * (1 - far) ** 2), tone: 12000 - 7000 * far, next: at + rand(0.3, 5) });
    }
    for (const c of here) {
      if (at < c.next) continue;
      const src = ctx.createBufferSource();
      src.buffer = c.songs[Math.floor(Math.random() * c.songs.length)];
      src.playbackRate.value = rand(0.98, 1.02);
      const tone = ctx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = c.tone;
      const g = ctx.createGain();
      g.gain.value = c.gain * rand(0.7, 1);
      const pan = ctx.createStereoPanner();
      pan.pan.value = c.pan;
      src.connect(tone).connect(g).connect(pan).connect(this.chirps);
      src.start(at);
      if (this.live) src.onended = () => pan.disconnect();
      c.next = at + src.buffer.duration + voiceRest(c.voice) * pace;
      // Now and then one flies off and another takes its place.
      if (Math.random() < 0.08) this.callers = this.callers.filter((x) => x !== c);
    }
  }
  private pop(at: number, level: number) {
    this.blip(
      this.beds.fire.node,
      at + rand(0, 0.1),
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
    this.workSounds.disconnect();
    this.beds.fire.node.disconnect();
  }
}

/** The ambience for one scene, rendered offline with the live master chain:
 * what the review tools listen to. */
export async function renderAmbience(mix: AmbienceMix, seconds: number, sampleRate = 44100) {
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 6;
  limiter.ratio.value = 12;
  limiter.connect(ctx.destination);
  // The director's default effects volume under its master gain.
  const level = ctx.createGain();
  level.gain.value = 0.6 * 0.72;
  level.connect(limiter);
  const room = new Room(ctx, level);
  room.set(mix);
  const ambience = new Ambience(ctx, level, false, room.input(0));
  ambience.set(mix, true);
  ambience.advance(seconds);
  return ctx.startRendering();
}

type Maker = (g: number) => Sound;
const rep = (n: number, gap: number, make: (at: number, i: number) => Sound): Sound =>
  Array.from({ length: n }, (_, i) => make(i * gap * rand(0.85, 1.15), i)).flat();
function roomSound(cue: RoomCue, {ground, tool}: RoomActivity): Sound {
  switch (cue) {
    case "recitation":
    case "unison": {
      const f = rand(135,195), sung = cue === "unison";
      const steps = sung ? [1,1.125,1.06,1] : [1,1.07,1.04,.96];
      return rep(4,sung ? .46 : .29,(at,i) => {
        const hz = f * steps[i], dur = (sung ? .44 : .26) * (i === 3 ? 1.5 : 1);
        return [tone(at,dur,.022,hz,{wave:"triangle",attack:.065,to:hz*.99}),
          tone(at,dur,.009,hz*(i === 1 ? 4 : 3),{attack:.085}),
          tone(at+.013,dur,.004,hz*(i%2 ? 7 : 6),{attack:.07}),
          noise(at,.065,.007,1100,{to:700,attack:.028}),
          ...(sung ? [tone(at+.025,dur,.012,hz*1.009,{wave:"triangle",attack:.12})] : [])];
      });
    }
    case "handbell": return ring(0,rand(790,860),1.1,.025);
    case "woodbeat": return rep(3,.57,at=>[tone(at,.095,.05,rand(570,595),{to:440}),noise(at,.035,.031,1650,{to:630})]);
    case "strings": return rep(3,.46,(at,i)=>[1,2,3,4].map((n)=>tone(at,.73/n,.031/n,[184,207,164][i]*n,{attack:.006})));
    case "wash": return rep(6,.074,(at)=>[noise(at,rand(.12,.22),.039,rand(1050,2700),{to:700,attack:.045})]);
    case "writing": return writing(tool);
    case "pages": return pageTurn();
    case "voices": {
      const pitch = rand(115,185);
      return rep(Math.round(rand(3,5)), .18, (at,i) => {
        const f = pitch * rand(.92,1.12), dur = rand(.09,.18);
        return [tone(at,dur,.022,f,{to:f*.95, wave:"triangle", attack:.04}),
          tone(at,dur,.009,f * (i % 2 ? 3 : 4),{attack:.035}),
          noise(at,dur,.017,rand(650,1450),{to:550, attack:.035})];
      });
    }
    case "wheels": return [noise(0, 1.35, .035, 490, {to:260, filter:"lowpass", attack:.28}),
      ...rep(4,.24, at => [tone(at + .18, .035, .014, rand(190,280), {to:140})])];
    case "footsteps": return rep(3, rand(.35,.5), at => (footstep(ground) ?? []).map(l => ({...l, at:l.at+at})));
    case "cloth": return rep(2,.28, at => [noise(at,rand(.22,.46),.04,rand(1900,2800),{to:950,attack:.09})]);
    default: return handle(({cup:"pottery",tray:"metal",wood:"wood",inkstone:"stone"} as const)[cue]).map(l => ({...l,gain:l.gain*.42}));
  }
}
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

function bellSound(bell: Bell, hour: number, g: number, weekday: number): Sound {
  switch (bell) {
    case "church":
      // Sunday morning a ring of four bells calls the town to church.
      if (weekday === SUNDAY && (hour === 9 || hour === 12)) {
        const peal = [523, 440, 392, 330];
        return rep(24, 0.42, (at, i) => ring(at, peal[i % 4], 2.5, 0.026 * g));
      }
      return rep(((hour + 11) % 12) + 1, 1.7, (at) => ring(at, 440, 3.5, 0.03 * g));
    case "semantron": {
      // A mallet on a hanging plank, slow then quickening, three times over.
      const knocks = [0, 0.7, 1.3, 1.8, 2.2, 2.5, 2.75, 2.95, 3.1, 3.25, 3.4];
      return rep(3, 4.4, (start) =>
        knocks.flatMap((k) => [
          noise(start + k, 0.07, 0.05 * g, 950, { q: 3 }),
          tone(start + k, 0.12, 0.025 * g, 410, { to: 380, wave: "triangle", attack: 0.003 }),
        ]),
      );
    }
    case "temple":
      return rep(3, 7, (at) => [...ring(at, 98, 7, 0.05 * g), tone(at, 7, 0.02 * g, 98.5)]);
    case "toki": {
      // Three warning strokes, then the hour's count: nine at noon and
      // midnight, down to four, then nine again.
      const count = 9 - ((hour / 2) % 6);
      return rep(3 + count, 4.5, (at) => [...ring(at, 92, 8, 0.05 * g), tone(at, 8, 0.02 * g, 92.6)]);
    }
    case "whistle":
      return [
        tone(0, 2.8, 0.02 * g, 380, { wave: "triangle", attack: 0.3, to: 372 }),
        tone(0, 2.8, 0.015 * g, 570, { wave: "triangle", attack: 0.3, to: 560 }),
      ];
    case "adhan": {
      // A sung phrase from afar: long held notes that turn at the end.
      const notes = [220, 247, 262, 247, 220, 196, 220];
      // Friday's noon call, to the congregational prayer, is the one all hear.
      const v = weekday === FRIDAY && hour === 12 ? 1.6 : 1;
      return notes.flatMap((f, i) =>
        tone(i * 0.9, i === notes.length - 1 ? 2.2 : 1, 0.02 * g * v, f, {
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
    private ctx: BaseAudioContext,
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
      this.verb.buffer = impulse(this.ctx, 0.25 + mix.room * 1.3, 2 + 3 * (1 - mix.hard), mix.hard * mix.room);
      this.tone.frequency.value = 2200 + 5000 * mix.hard;
    }
    // A hut of hides swallows a footstep; a plastered hall hands it back.
    const wet = mix.room ? 0.18 + (0.3 + 0.4 * mix.room) * mix.hard : 0;
    this.send.gain.setTargetAtTime(wet, now, 0.3);
  }
}
/** `slap` adds the distinct early returns off hard walls, ahead of the wash:
 * what makes a step in a stone hall or a cave answer back. */
function impulse(ctx: BaseAudioContext, seconds: number, decay: number, slap = 0) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++)
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    for (let k = 0; k < 4; k++) data[Math.floor(length * rand(0.04, 0.3))] += slap * rand(4, 9) * (k % 2 ? -1 : 1);
  }
  return buffer;
}

/** How a tunnel or cave sounds where the player stands, each 0 to 1: how
 * near the running water is, how big the space is, storm water from rain
 * above, far drips in the dark, and a draught through the rock. A cave's
 * water is a clear stream; a sewer's a foul channel that floods in a storm.
 * In a mine, `surge` is the work going on: far picks, and the pumps. */
export type UndergroundLevels = { place: "sewer" | "cave" | "mine"; flow: number; echo: number; surge: number; drips: number; draught: number };

/** Seconds of running water built from thousands of bubbles over a soft wash,
 * written so the end runs into the start. `low` sets the bubbles' register. */
function waterLoop(ctx: BaseAudioContext, seconds: number, bubbles: number, low: number, wash: number) {
  const sr = ctx.sampleRate,
    n = Math.floor(sr * seconds);
  const mono = new Float32Array(n),
    hiss = new Float32Array(n * 2);
  let lp = 0;
  for (let i = 0; i < n * 2; i++) hiss[i] = lp += 0.08 * (Math.random() * 2 - 1 - lp);
  // Crossfade the second pass under the first so the loop has no seam.
  for (let i = 0; i < n; i++)
    mono[i] = wash * (hiss[i] * Math.sqrt(i / n) + hiss[i + n] * Math.sqrt(1 - i / n));
  for (let b = 0; b < bubbles; b++) {
    // A bubble is a short sine that rises as it closes.
    const f0 = low * Math.exp(rand(0, 1.9)),
      dur = rand(0.006, 0.03) * Math.sqrt(600 / f0),
      amp = 0.25 * Math.random() ** 2.5,
      start = Math.floor(Math.random() * n),
      len = Math.floor(dur * sr);
    let phase = 0;
    for (let k = 0; k < len; k++) {
      const t = k / sr;
      phase += (2 * Math.PI * f0 * (1 + (1.6 * t) / dur)) / sr;
      mono[(start + k) % n] += amp * Math.sin(phase) * Math.exp((-5 * t) / dur) * Math.min(1, k / 40);
    }
  }
  // The right ear hears the same water half a loop later: wide, and half the work.
  const buffer = ctx.createBuffer(2, n, sr);
  buffer.copyToChannel(mono, 0);
  const right = buffer.getChannelData(1),
    half = n >> 1;
  right.set(mono.subarray(half));
  right.set(mono.subarray(0, half), n - half);
  return buffer;
}
/** Far drips falling into pools all round, scattered so the end runs into
 * the start: each a falling plink that the cave's echo carries. */
function dripLoop(ctx: BaseAudioContext, seconds: number, drops: number) {
  const sr = ctx.sampleRate,
    n = Math.floor(sr * seconds),
    buffer = ctx.createBuffer(2, n, sr);
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    for (let d = 0; d < drops; d++) {
      const f = rand(700, 2400),
        amp = 0.05 + 0.25 * Math.random() ** 3,
        start = Math.floor(Math.random() * n),
        len = Math.floor(0.12 * sr);
      let phase = 0;
      for (let k = 0; k < len; k++) {
        const t = k / sr;
        phase += (2 * Math.PI * f * (1.5 - 0.5 * Math.min(1, t / 0.04))) / sr;
        data[(start + k) % n] += amp * Math.sin(phase) * Math.exp(-t * 38) * Math.min(1, k / 20);
      }
    }
  }
  return buffer;
}
/** A working mine heard from along the road, written to loop: hewers'
 * picks in runs at a man's swing, far off and mostly echo, and two strokes of
 * the pump rods lifting water up the shaft, a slow thump and a gush. */
function workLoop(ctx: BaseAudioContext, seconds: number) {
  const sr = ctx.sampleRate,
    n = Math.floor(sr * seconds),
    buffer = ctx.createBuffer(2, n, sr);
  const add = (data: Float32Array, at: number, len: number, f: (t: number) => number) => {
    const s0 = Math.floor(at * sr);
    for (let k = 0; k < len * sr; k++) data[(s0 + k) % n] += f(k / sr);
  };
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    for (let run = 0; run < 5; run++) {
      const start = Math.random() * seconds, swing = rand(1, 1.5), hits = 3 + Math.floor(Math.random() * 6), amp = rand(0.05, 0.2), f = rand(1600, 2600);
      for (let i = 0; i < hits; i++)
        add(data, start + i * swing * rand(0.95, 1.05), 0.09, (t) => amp * (Math.sin(2 * Math.PI * f * t) * 0.6 + (Math.random() * 2 - 1) * 0.5) * Math.exp(-t * 70));
    }
    for (const at of [0, seconds / 2]) {
      add(data, at + c * 0.01, 0.5, (t) => 0.4 * Math.sin(2 * Math.PI * (52 - t * 20) * t) * Math.exp(-t * 9) * Math.min(1, t * 200));
      let lp = 0;
      add(data, at + 0.35, 1.4, (t) => (lp += 0.05 * (Math.random() * 2 - 1 - lp)) * 1.2 * Math.sin(Math.PI * Math.min(1, t / 1.4)));
    }
  }
  return buffer;
}
const waterLoops = new WeakMap<BaseAudioContext, Record<string, AudioBuffer>>();

/** Under the ground: running water, the echo of the space, storm surge in a
 * sewer, far drips and a draught in a cave. `set` is cheap enough to call
 * every frame. */
export class UndergroundBed {
  private flow: GainNode;
  private surge: GainNode;
  private wet: GainNode;
  private drips: GainNode;
  private draught: GainNode;
  private tone: BiquadFilterNode;
  private out: GainNode;
  private sources: AudioScheduledSourceNode[] = [];
  private last = { flow: -1, echo: -1, surge: -1, drips: -1, draught: -1 };
  constructor(private ctx: BaseAudioContext, into: AudioNode, readonly place: "sewer" | "cave" | "mine") {
    this.out = ctx.createGain();
    this.out.connect(into);
    this.flow = ctx.createGain();
    this.flow.gain.value = 0;
    this.surge = ctx.createGain();
    this.surge.gain.value = 0;
    this.tone = ctx.createBiquadFilter();
    this.tone.type = "lowpass";
    this.tone.frequency.value = 1500;
    const verb = ctx.createConvolver();
    verb.buffer = impulse(ctx, 3.5, 3);
    const dark = ctx.createBiquadFilter();
    dark.type = "lowpass";
    dark.frequency.value = 2600;
    this.wet = ctx.createGain();
    this.wet.gain.value = 0;
    this.flow.connect(this.tone);
    this.surge.connect(this.tone);
    this.tone.connect(this.out);
    this.tone.connect(this.wet).connect(verb).connect(dark).connect(this.out);
    this.drips = ctx.createGain();
    this.drips.gain.value = 0;
    // Far drips are mostly echo.
    this.drips.connect(verb);
    this.drips.connect(ctx.createGain()).connect(this.out);
    this.draught = ctx.createGain();
    this.draught.gain.value = 0;
    const gust = ctx.createBiquadFilter();
    gust.type = "lowpass";
    gust.frequency.value = 320;
    gust.Q.value = 0.5;
    const gusts = ctx.createGain();
    this.draught.connect(gusts).connect(gust).connect(this.out);
    const play = (buffer: AudioBuffer, into: AudioNode) => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      src.connect(into);
      src.start();
      this.sources.push(src);
    };
    let loops = waterLoops.get(ctx);
    if (!loops) waterLoops.set(ctx, (loops = {}));
    const loop = (key: string, make: () => AudioBuffer) => (loops[key] ??= make());
    // A clear stream chatters higher over stones; storm water is deeper and
    // denser, big glugs under a roar.
    play(place !== "sewer" ? loop("stream", () => waterLoop(ctx, 6.7, 16000, 640, 0.25)) : loop("sewer", () => waterLoop(ctx, 7.3, 9000, 420, 0.5)), this.flow);
    const roar = ctx.createGain();
    roar.connect(this.surge);
    if (place === "sewer") play(loop("storm", () => waterLoop(ctx, 5.9, 8000, 180, 1.4)), roar);
    else {
      play(loop("drips", () => dripLoop(ctx, 13.1, 26)), this.drips);
      // The draught is the wash alone, slowed right down and swelling.
      play(loop("draught", () => waterLoop(ctx, 9.7, 0, 100, 2.5)), this.draught);
      if (place === "mine") {
        const far = ctx.createGain();
        far.gain.value = 0.6;
        roar.connect(far).connect(verb);
        play(loop("work", () => workLoop(ctx, 14.3)), roar);
      }
    }
    // Two slow, unrelated swells, so the channel never sits at one level.
    const swell = (rate: number, depth: number, target: AudioParam) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = rate;
      const d = ctx.createGain();
      d.gain.value = depth;
      osc.connect(d).connect(target);
      osc.start();
      this.sources.push(osc);
    };
    swell(0.07, 0.12, this.out.gain);
    swell(0.031, 0.12, this.out.gain);
    swell(0.19, 0.3, roar.gain);
    swell(0.043, 0.6, gusts.gain);
    swell(0.11, 140, gust.frequency);
  }
  set(levels: Omit<UndergroundLevels, "place">, instant = false) {
    const { flow, echo, surge, drips, draught } = levels,
      last = this.last;
    if (Math.abs(flow - last.flow) + Math.abs(echo - last.echo) + Math.abs(surge - last.surge) + Math.abs(drips - last.drips) + Math.abs(draught - last.draught) < 0.01) return;
    this.last = { flow, echo, surge, drips, draught };
    const now = this.ctx.currentTime;
    const glide = (param: AudioParam, value: number) =>
      instant ? param.setValueAtTime(value, now) : param.setTargetAtTime(value, now, 0.6);
    glide(this.flow.gain, 0.5 * flow);
    glide(this.surge.gain, 0.45 * surge);
    // Far water loses its top; a storm brings it back.
    glide(this.tone.frequency, 900 + 4500 * Math.max(flow, surge) ** 1.5);
    glide(this.wet.gain, 0.15 + 0.85 * echo);
    glide(this.drips.gain, 0.5 * drips);
    glide(this.draught.gain, 0.18 * draught);
  }
  dispose() {
    for (const source of this.sources)
      try {
        source.stop();
      } catch {
        /* Already stopped. */
      }
    this.out.disconnect();
  }
}
