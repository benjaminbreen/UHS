import { seasonAt } from "./livelihood";

export type WeatherCondition =
  | "clear"
  | "light-clouds"
  | "overcast"
  | "rain"
  | "snow"
  | "mist"
  | "dust";
export type Wind = {
  /** Direction the wind blows toward, in screen radians: 0 is east, PI/2 south. */
  angle: number;
  /** 0 still, 1 a gale. */
  strength: number;
};
export type Weather = {
  condition: WeatherCondition;
  label: string;
  tempC: number;
  night: boolean;
  wind: Wind;
  /** How wet the ground is, 0 to 1. Rain soaks it and it dries out after. */
  wetness: number;
  /** How hard it is raining, 0 to 1: under 0.25 a drizzle, over 0.75 a
   * downpour. 0 unless the condition is rain. */
  rain: number;
  /** Thunder and lightning, 0 to 1: only in a warm, heavy rain. */
  storm: number;
  /** Hailstones coming down, 0 to 1: a short burst inside a squall. */
  hail: number;
  /** Snow driven on a gale, 0 to 1. 0 unless the condition is snow. */
  blizzard: number;
  /** Blown sand and dust, 0 to 1: under 0.5 it hazes the air, over it the
   * far side of the street is gone. 0 unless the condition is dust. */
  dust: number;
};

const labels: Record<WeatherCondition, string> = {
  clear: "Clear",
  "light-clouds": "Light clouds",
  overcast: "Overcast",
  rain: "Rain",
  snow: "Snow",
  mist: "Mist",
  dust: "Blowing dust",
};

// Mean daily temperature (°C) by climate and season, and the day/night swing.
const bands: Record<
  string,
  { temps: [number, number, number, number]; swing: number }
> = {
  temperate: { temps: [11, 22, 12, 2], swing: 8 },
  mediterranean: { temps: [16, 27, 19, 10], swing: 9 },
  tropical: { temps: [28, 29, 28, 26], swing: 6 },
  monsoon: { temps: [30, 31, 27, 19], swing: 10 },
  arid: { temps: [26, 36, 27, 14], swing: 15 },
  boreal: { temps: [2, 15, 3, -14], swing: 7 },
  tundra: { temps: [-8, 7, -4, -22], swing: 5 },
};
// Chance of each condition by climate, per season (spring, summer, autumn, winter).
const rainChance: Record<string, [number, number, number, number]> = {
  temperate: [0.3, 0.2, 0.3, 0.3],
  mediterranean: [0.2, 0.03, 0.2, 0.35],
  tropical: [0.4, 0.45, 0.45, 0.35],
  monsoon: [0.1, 0.55, 0.25, 0.03],
  arid: [0.05, 0.02, 0.04, 0.08],
  boreal: [0.25, 0.3, 0.35, 0.3],
  tundra: [0.15, 0.25, 0.25, 0.2],
};

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

// Chance of a dust storm by season: the spring khamsin, the summer haboob, the
// andhi before the monsoon breaks, and the odd sirocco.
const dustChance: Record<string, [number, number, number, number]> = {
  arid: [0.14, 0.1, 0.06, 0.05],
  monsoon: [0.07, 0, 0, 0.02],
  mediterranean: [0.02, 0.03, 0.01, 0],
};
/** A window of the day, 0 outside it: up fast as the front arrives, held,
 * then eased off over the last `tail` of it. */
function burst(hour: number, start: number, length: number, rise: number, tail: number) {
  const x = (hour - start) / length;
  return x < 0 || x > 1 ? 0 : Math.min(1, x / rise + 0.05, (1 - x) / tail + 0.05);
}
/** The storm comes in as a wall some time between mid-morning and late
 * afternoon, blows for two to five hours and thins out. */
function dustAt(seed: string, day: number, hour: number) {
  const peak = 0.45 + hash(`${seed}:${day}:dust`) * 0.55;
  return peak * burst(hour, 9 + hash(`${seed}:${day}:dust-at`) * 8, 2 + hash(`${seed}:${day}:dust-for`) * 3, 0.08, 0.45);
}
// Chance that a wet day throws hail: spring and early summer over land, the
// hot weeks before the monsoon, almost never in the wet tropics or the cold.
const hailChance: Record<string, [number, number, number, number]> = {
  temperate: [0.14, 0.16, 0.05, 0],
  mediterranean: [0.14, 0.1, 0.1, 0.04],
  tropical: [0.02, 0.02, 0.02, 0.02],
  monsoon: [0.25, 0.04, 0.02, 0],
  arid: [0.18, 0.18, 0.1, 0.04],
  boreal: [0.06, 0.12, 0.04, 0],
  tundra: [0, 0.05, 0, 0],
};
/** Hail falls for a quarter to three quarters of an hour in the afternoon. */
function hailAt(seed: string, day: number, hour: number, chance: number) {
  if (hash(`${seed}:${day}:hail`) >= chance) return 0;
  const peak = 0.5 + hash(`${seed}:${day}:hail-size`) * 0.5;
  return peak * burst(hour, 12.5 + hash(`${seed}:${day}:hail-at`) * 6, 0.25 + hash(`${seed}:${day}:hail-for`) * 0.5, 0.15, 0.4);
}
// Chance that a snow day has a gale behind it.
const blizzardChance: Record<string, number> = { tundra: 0.35, boreal: 0.25, temperate: 0.12 };
/** A blizzard lasts the day, easing and coming on again in squalls. */
function blizzardAt(seed: string, day: number, hour: number, climate: string) {
  if (hash(`${seed}:${day}:blizzard`) >= (blizzardChance[climate] ?? 0.08)) return 0;
  const peak = 0.55 + hash(`${seed}:${day}:blizzard-force`) * 0.45;
  return peak * (0.8 + 0.2 * Math.sin(hour * 1.1 + hash(`${seed}:${day}:squall`) * 6));
}

function conditionFor(
  seed: string,
  day: number,
  rain: number,
  hour: number,
  dust = 0,
): WeatherCondition {
  const roll = hash(`${seed}:${day}:sky`);
  if (roll > 1 - dust) return dustAt(seed, day, hour) ? "dust" : "clear";
  return roll < rain
    ? "rain"
    : roll < rain + 0.15
      ? "overcast"
      : roll < rain + 0.4
        ? "light-clouds"
        : roll > 0.975 && hour < 8
          ? "mist"
          : "clear";
}

// What a wet day is like where you are, as [typical, spread] of intensity:
// northern drizzle, Mediterranean showers, tropical and monsoon downpours,
// and the rare desert cloudburst.
const rainStyle: Record<string, [number, number]> = {
  temperate: [0.35, 0.3],
  mediterranean: [0.5, 0.35],
  tropical: [0.7, 0.3],
  monsoon: [0.75, 0.25],
  arid: [0.6, 0.4],
  boreal: [0.3, 0.25],
  tundra: [0.2, 0.2],
};
/** The day's rain comes and goes in showers through the hours; tropical rain
 * builds to an afternoon storm. */
function rainAt(seed: string, day: number, hour: number, climate: string) {
  const [typical, spread] = rainStyle[climate] ?? rainStyle.temperate;
  const base = typical + (hash(`${seed}:${day}:rain`) - 0.5) * 2 * spread;
  const phase = hash(`${seed}:${day}:shower`) * 24;
  const showers = 0.7 + 0.2 * Math.sin((hour + phase) * 1.3) + 0.1 * Math.sin((hour + phase) * 3.7);
  const afternoon =
    (climate === "tropical" || climate === "monsoon") && hour > 13 && hour < 19 ? 0.15 : 0;
  return Math.max(0.05, Math.min(1, base * showers + afternoon));
}
const rainLabel = (rain: number) =>
  rain < 0.25 ? "Drizzle" : rain < 0.55 ? "Rain" : rain < 0.8 ? "Heavy rain" : "Downpour";

/** How much water a day's weather puts on the ground. */
const soak: Record<WeatherCondition, number> = {
  rain: 1,
  // Snow lies rather than soaks; the thaw is what wets the ground.
  snow: 0.1,
  overcast: 0.12,
  mist: 0.2,
  dust: 0,
  "light-clouds": 0,
  clear: 0,
};

// Prevailing wind. The monsoon reverses with the season, which is the whole
// point of it; elsewhere the day's direction is diced and drifts a little.
function windFor(
  seed: string,
  day: number,
  hour: number,
  climate: string,
  si: number,
  condition: WeatherCondition,
  /** A blizzard's or a dust storm's force: the wind is what makes either. */
  gale = 0,
): Wind {
  const monsoon = climate === "monsoon" ? (si === 1 ? 0 : Math.PI) : undefined;
  const dice = hash(`${seed}:${day}:wind`);
  const angle =
    (monsoon ?? dice * Math.PI * 2) +
    (hash(`${seed}:${day}:veer`) - 0.5) * (monsoon === undefined ? 0.9 : 0.5) +
    Math.sin(hour / 5 + dice * 6) * 0.25;
  // Afternoons are breezier than dawn, and a wet day is rarely a still one.
  const diurnal = 0.72 + 0.28 * -Math.cos(((hour - 2) / 24) * Math.PI * 2);
  const wet = condition === "rain" || condition === "snow" ? 0.3 : condition === "overcast" ? 0.12 : 0;
  const strength = Math.max(
    0.05,
    Math.min(1, (0.15 + hash(`${seed}:${day}:force`) * 0.6) * diurnal + wet),
    gale && 0.55 + 0.45 * gale,
  );
  return { angle, strength };
}

/** Deterministic daily weather; the day is diced once so it never flickers. */
export const skySeed = (m: { seed: string; sky?: string }) => m.sky ?? m.seed;
export function weatherAt(
  seed: string,
  climate: string,
  initialSeason: string,
  clock: number,
): Weather {
  const day = Math.floor(clock / 86400);
  const hour = (((clock / 3600) % 24) + 24) % 24;
  const season = seasonAt(initialSeason, clock);
  const si = Math.max(
    0,
    ["spring", "summer", "autumn", "winter"].indexOf(season),
  );
  const band = bands[climate] ?? bands.temperate;
  const rain = (rainChance[climate] ?? rainChance.temperate)[si];
  const dusty = dustChance[climate]?.[si] ?? 0;
  let condition = conditionFor(seed, day, rain, hour, dusty);
  // Coolest before dawn, warmest mid-afternoon.
  const diurnal = -Math.cos(((hour - 4) / 24) * Math.PI * 2);
  const noise = (hash(`${seed}:${day}:temp`) - 0.5) * 6;
  const cloudCool = condition === "rain" || condition === "overcast" ? -3 : 0;
  const tempC = Math.round(
    band.temps[si] + (diurnal * band.swing) / 2 + noise + cloudCool,
  );
  if (condition === "rain" && tempC <= 1) condition = "snow";
  // Today's rain builds through the day; yesterday's is still drying off.
  const today = soak[condition];
  const before = soak[conditionFor(seed, day - 1, rain, 20, dusty)];
  const wetness = Math.max(
    today * Math.min(1, 0.4 + hour / 14),
    before - hour / (condition === "clear" ? 7 : 14),
    0,
  );
  // Hail needs warm air under the cloud, and brings its own squall and thunder.
  const hail =
    condition === "rain" && tempC > 6 ? hailAt(seed, day, hour, (hailChance[climate] ?? hailChance.temperate)[si]) : 0;
  const falling = condition === "rain" ? Math.max(rainAt(seed, day, hour, climate), hail && 0.6 + 0.4 * hail) : 0;
  const storm = tempC > 8 ? Math.max(0, Math.min(1, (falling - 0.65) / 0.35), hail * 0.8) : hail * 0.8;
  const blizzard = condition === "snow" ? blizzardAt(seed, day, hour, climate) : 0;
  const dust = condition === "dust" ? dustAt(seed, day, hour) : 0;
  return {
    condition,
    label:
      hail > 0.1
        ? "Hail"
        : storm > 0.3
          ? "Thunderstorm"
          : falling
            ? rainLabel(falling)
            : blizzard > 0.3
              ? "Blizzard"
              : dust >= 0.5
                ? climate === "arid" ? "Sandstorm" : "Dust storm"
                : labels[condition],
    tempC,
    night: hour < 5 || hour >= 20,
    wind: windFor(seed, day, hour, climate, si, condition, Math.max(blizzard, dust)),
    wetness: Math.min(1, wetness),
    rain: falling,
    storm,
    hail,
    blizzard,
    dust,
  };
}

/** Weather that sends people and animals under cover. */
export const foul = (condition: WeatherCondition) =>
  condition === "rain" || condition === "snow" || condition === "dust";

export const toFahrenheit = (c: number) => Math.round((c * 9) / 5 + 32);

/** Unpaved ground between rains: 0 dry, 1 churned to mud. The season sets the
 * floor, today's wetness adds to it, and a hard frost freezes what is there. */
export type GroundState = {
  mud: number;
  puddles: number;
  frozen: boolean;
  /** Snow lying on the ground, 0 bare to 1 deep. */
  snow: number;
};
// Spring, summer, autumn, winter; boreal and tundra winters are frozen anyway.
const seasonMud: Record<string, [number, number, number, number]> = {
  temperate: [0.4, 0.08, 0.5, 0.65],
  mediterranean: [0.25, 0, 0.35, 0.55],
  tropical: [0.55, 0.65, 0.55, 0.1],
  monsoon: [0.05, 0.75, 0.4, 0.05],
  arid: [0.15, 0, 0.1, 0.3],
  boreal: [0.7, 0.15, 0.55, 0.4],
  tundra: [0.6, 0.35, 0.45, 0.3],
};
export function groundState(
  climate: string,
  season: string,
  weather: Weather,
  snow = 0,
): GroundState {
  const si = Math.max(0, ["spring", "summer", "autumn", "winter"].indexOf(season));
  const base = (seasonMud[climate] ?? seasonMud.temperate)[si];
  // A thin cover still shows the ruts through it; a deep one buries them.
  const open = Math.max(0, 1 - snow * 1.6);
  return {
    mud: Math.min(1, base + weather.wetness * 0.7) * open,
    // Standing water needs rain; a muddy season only lets it spread further.
    puddles: Math.min(1, weather.wetness * (1 + base)) * open,
    frozen: weather.tempC <= -1,
    snow,
  };
}

// Cover that lies all season whatever the fortnight did: spring, summer,
// autumn, winter.
const snowpack: Record<string, [number, number, number, number]> = {
  boreal: [0.2, 0, 0.1, 0.75],
  tundra: [0.6, 0, 0.45, 0.9],
};
const coverCache = new Map<string, number>();
/** Snow on the ground now: a fortnight of snowfall laid down, less whatever
 * thaws and rain took off since. */
export function snowCover(
  seed: string,
  climate: string,
  initialSeason: string,
  clock: number,
): number {
  const day = Math.floor(clock / 86400),
    hour = (((clock / 3600) % 24) + 24) % 24;
  const key = `${seed}:${climate}:${initialSeason}:${day}:${Math.floor(hour)}`;
  const cached = coverCache.get(key);
  if (cached !== undefined) return cached;
  let cover = 0;
  for (let d = 14; d >= 0; d--) {
    // Today only counts as far as the clock has got.
    const part = d ? 1 : Math.min(1, hour / 16);
    const at = (h: number) =>
      weatherAt(seed, climate, initialSeason, (day - d) * 86400 + h * 3600);
    const small = at(d ? 4 : Math.min(hour, 4)),
      warm = at(d ? 14 : Math.min(hour, 14));
    if (small.condition === "snow" || warm.condition === "snow")
      cover += 0.3 * part;
    if (warm.condition === "rain") cover -= 0.3 * part;
    if (warm.tempC > 0) cover -= warm.tempC * 0.05 * part;
    cover = Math.max(0, Math.min(1, cover));
  }
  const season = seasonAt(initialSeason, clock);
  const si = Math.max(0, ["spring", "summer", "autumn", "winter"].indexOf(season));
  cover = Math.max(cover, snowpack[climate]?.[si] ?? 0);
  if (coverCache.size > 64) coverCache.clear();
  coverCache.set(key, cover);
  return cover;
}

/** A sky seed whose opening hours bring the weather a start asked for
 * ("a snowy day", "a hailstorm"), if this climate and season ever do. */
export function skyFor(seed: string, climate: string, season: string, want: string, clock: number) {
  const met = (w: Weather, sky: string, t: number) =>
    want === "snow" ? w.condition === "snow" && snowCover(sky, climate, season, t) > 0.2
      : want === "blizzard" ? w.blizzard > 0.3 : want === "hail" ? w.hail > 0.1 : want === "storm" ? w.storm > 0.3
      : want === "rain" ? w.rain > 0.25 : want === "dust" ? w.dust >= 0.5 : w.condition === want;
  // Snow, rain and sun at the start; a gale within the hour; hail and thunder
  // come in the afternoon, as convective storms do.
  const end = want === "hail" || want === "storm" ? Math.floor(clock / 86400) * 86400 + 19 * 3600 : want === "blizzard" || want === "dust" ? clock + 3600 : clock;
  for (let i = 0; i < 400; i++) {
    const sky = `${seed}:${want}:${i}`;
    for (let t = clock; t <= end; t += 900) if (met(weatherAt(sky, climate, season, t), sky, t)) return sky;
  }
}
