import { seasonAt } from "./livelihood";

export type WeatherCondition =
  | "clear"
  | "light-clouds"
  | "overcast"
  | "rain"
  | "mist";
export type Weather = {
  condition: WeatherCondition;
  label: string;
  tempC: number;
  night: boolean;
};

const labels: Record<WeatherCondition, string> = {
  clear: "Clear",
  "light-clouds": "Light clouds",
  overcast: "Overcast",
  rain: "Rain",
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
  const roll = hash(`${seed}:${day}:sky`);
  const condition: WeatherCondition =
    roll < rain
      ? "rain"
      : roll < rain + 0.15
        ? "overcast"
        : roll < rain + 0.4
          ? "light-clouds"
          : roll > 0.93 && hour < 9
            ? "mist"
            : "clear";
  // Coolest before dawn, warmest mid-afternoon.
  const diurnal = -Math.cos(((hour - 4) / 24) * Math.PI * 2);
  const noise = (hash(`${seed}:${day}:temp`) - 0.5) * 6;
  const cloudCool = condition === "rain" || condition === "overcast" ? -3 : 0;
  const tempC = Math.round(
    band.temps[si] + (diurnal * band.swing) / 2 + noise + cloudCool,
  );
  return {
    condition,
    label: labels[condition],
    tempC,
    night: hour < 5 || hour >= 20,
  };
}

export const toFahrenheit = (c: number) => Math.round((c * 9) / 5 + 32);
