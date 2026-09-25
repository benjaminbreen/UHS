import type { WorldSetting } from "../content/geography/types";

export function arrivalBackdrop(setting: WorldSetting) {
  const { lon, lat, year } = setting;
  const name = `${setting.location} ${setting.placeId}`.toLowerCase();
  const special: [string, number, number, number, number, number, number][] = [
    ["iberian-interior-1100", -10, 0, 37, 43, 800, 1300],
    ["baltic-coast-850", 10, 31, 54, 62, 600, 1000],
    ["eurasian-forest-steppe-100", 24, 56, 44, 55, -300, 500],
    ["central-asian-oasis-800", 54, 80, 34, 45, 500, 1100],
    ["iranian-plateau-100", 44, 65, 28, 40, -500, 500],
    ["anatolian-neolithic-6500bce", 25, 42, 35, 43, -8000, -5000],
    ["nile-delta-1000bce", 29, 35, 29, 32, -1500, -500],
    ["saharan-fringe-100", -11, 30, 12, 22, -500, 500],
    ["ethiopian-highlands-900", 35, 43, 6, 15, 500, 1200],
    ["swahili-coast-1300", 38, 43, -11, -1, 1000, 1500],
    ["congo-basin-1000", 13, 30, -5, 5, 500, 1500],
    ["southern-africa-1300", 16, 34, -34, -20, 1000, 1500],
    ["korean-peninsula-100bce", 124, 132, 33, 43, -450, 300],
    ["jomon-japan-500bce", 129, 145, 30, 45, -1500, -300],
    ["seasia-uplands-1100", 95, 107, 15, 25, 500, 1500],
    ["sepik-1000", 141, 146, -6, -2, 500, 1500],
    ["new-guinea-highlands-1000", 135, 147, -8, -3, 500, 1500],
    ["australian-interior-500bce", 115, 145, -33, -18, -5000, 1500],
    ["arctic-north-america-1100", -170, -50, 62, 85, 500, 1500],
    ["pacific-northwest-1100", -133, -120, 44, 60, 500, 1500],
    ["basin-mexico-1400", -100.5, -97.5, 18, 21, 1200, 1500],
    ["oaxaca-500", -98.5, -94, 15, 19, -500, 900],
    ["maya-highlands-800", -94, -88, 12, 18, 500, 1100],
    ["sierra-madre-1000", -102, -96, 20, 27, 500, 1500],
    ["huasteca-1000", -100, -95, 20, 24, 500, 1500],
    ["northern-mexico-1200", -116, -100, 23, 33, 500, 1500],
    ["southwest-1100", -115, -104, 31, 39, 800, 1400],
    ["eastern-woodlands-1100", -96, -75, 30, 45, 800, 1500],
    ["andes-1400", -81, -65, -26, -8, 1200, 1550],
    ["amazon-1000", -77, -47, -13, 4, 500, 1500],
    ["manchuria-bronze", 119, 136, 39, 51, -1600, -500],
    ["yellow-river-1000bce", 106, 121, 33, 41, -1300, -600],
    ["yangtze-100bce", 111, 123, 27, 34, -500, 500],
    ["mongolia-800", 87, 120, 40, 54, 500, 1200],
    ["tibet-900", 75, 103, 26, 37, 600, 1200],
    ["indus-2200bce", 65, 76, 23, 33, -2700, -1700],
    ["deccan-900", 72, 83, 11, 22, 500, 1300],
    ["arabian-oasis-500", 41, 58, 14, 30, 100, 800],
    ["great-lakes-africa-1100", 28, 37, -7, 2, 600, 1500],
    ["maritime-seasia-1200", 95, 139, -11, 19, 700, 1500],
  ];
  const named = [
    [/sierra madre oriental/, "sierra-madre-1000"],
    [/huastec|huasteca/, "huasteca-1000"],
    [/manchuria|manchurian/, "manchuria-bronze"],
    [/sepik/, "sepik-1000"],
    [/new guinea highland/, "new-guinea-highlands-1000"],
  ] as const;
  for (const [pattern, id] of named) {
    const entry = special.find(([key]) => key === id)!;
    if (pattern.test(name) && year >= entry[5] && year <= entry[6]) return `/opening/${id}.webp`;
  }
  for (const [id, west, east, south, north, first, last] of special) {
    if (lon >= west && lon <= east && lat >= south && lat <= north && year >= first && year <= last) {
      if (id === "sierra-madre-1000" && setting.relief < 0.5) continue;
      if (id === "sepik-1000" && setting.relief >= 0.5) continue;
      if (id === "australian-interior-500bce" && setting.water.startsWith("coast")) continue;
      return `/opening/${id}.webp`;
    }
  }
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
