import type { WorldSetting } from "../content/geography/types";

export function arrivalBackdrop(setting: WorldSetting) {
  const { lon, lat, year } = setting;
  let region: string;
  if (lon < -30) region = "americas";
  else if (lon > 110 && lat < -10) region = "oceania";
  else if (lon > 95 && lat > -10) region = "east-asia";
  else if (lon > 60 && lat > -10) region = "south-asia";
  else if (lon > 30 && lat > 0) region = "west-asia";
  else if (lat < 35 && lon < 60) region = "africa";
  else region = "europe";
  const age = year < -3000 ? "prehistory" : year < 500 ? "antiquity" : year < 1500 ? "medieval" : year < 1750 ? "early-modern" : "industrial";
  const available: Record<string, string[]> = {
    africa: ["prehistory", "antiquity", "medieval", "early-modern"],
    europe: ["prehistory", "antiquity", "medieval", "industrial"],
    "west-asia": ["neolithic", "antiquity"],
    "south-asia": ["antiquity", "medieval"],
    "east-asia": ["antiquity", "medieval", "early-modern"],
    americas: ["prehistory", "medieval", "early-modern"],
    oceania: ["prehistory", "early-modern"],
  };
  const choices = available[region];
  const chosen = choices.includes(age)
    ? age
    : region === "west-asia" && year < -3000
      ? "neolithic"
      : year < 500
        ? choices[0]
        : choices.at(-1)!;
  return `/opening/${region}-${chosen}.webp`;
}

// PRB's 2022 cumulative-birth estimates; interpolate only between published benchmarks.
const births: [number, number][] = [
  [-190000, 2], [-50000, 7856100002], [-8000, 8993889771],
  [1, 55019222125], [1200, 81610565125], [1650, 94392567578],
  [1750, 97564499091], [1850, 101610739100], [1900, 104510976956],
  [1950, 107901175171], [2000, 113966170055], [2010, 115330173460],
  [2022, 117020448575],
];
export function birthPercentile(year: number) {
  if (year < births[0][0] || year > 2022) return null;
  const end = births.findIndex(([y]) => y >= year);
  if (end === 0) return 0;
  const [y0, n0] = births[end - 1], [y1, n1] = births[end];
  return Math.round((n0 + ((year - y0) / (y1 - y0)) * (n1 - n0)) / births.at(-1)![1] * 100);
}
