import { seasonAt } from "./livelihood";

export type WeatherCondition =
  | "clear"
  | "light-clouds"
  | "overcast"
  | "rain"
  | "snow"
  | "mist";
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
};

const labels: Record<WeatherCondition, string> = {
  clear: "Clear",
  "light-clouds": "Light clouds",
  overcast: "Overcast",
  rain: "Rain",
  snow: "Snow",
  mist: "Mist",
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

function conditionFor(
  seed: string,
  day: number,
  rain: number,
  hour: number,
): WeatherCondition {
  const roll = hash(`${seed}:${day}:sky`);
  return roll < rain
    ? "rain"
    : roll < rain + 0.15
      ? "overcast"
      : roll < rain + 0.4
        ? "light-clouds"
        : roll > 0.93 && hour < 9
          ? "mist"
          : "clear";
}

/** How much water a day's weather puts on the ground. */
const soak: Record<WeatherCondition, number> = {
  rain: 1,
  // Snow lies rather than soaks; the thaw is what wets the ground.
  snow: 0.1,
  overcast: 0.12,
  mist: 0.2,
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
  );
  return { angle, strength };
}

/** Deterministic daily weather; the day is diced once so it never flickers. */
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
  let condition = conditionFor(seed, day, rain, hour);
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
  const before = soak[conditionFor(seed, day - 1, rain, 20)];
  const wetness = Math.max(
    today * Math.min(1, 0.4 + hour / 14),
    before - hour / (condition === "clear" ? 7 : 14),
    0,
  );
  return {
    condition,
    label: labels[condition],
    tempC,
    night: hour < 5 || hour >= 20,
    wind: windFor(seed, day, hour, climate, si, condition),
    wetness: Math.min(1, wetness),
  };
}

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
  arid: [0, 0, 0, 0.08],
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
    puddles: Math.min(1, base * 0.7 + weather.wetness) * open,
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
