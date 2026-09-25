import type { WorldSetting } from "../content/geography/types";

export function arrivalBackdrop(setting: WorldSetting) {
  const { lon, lat, year } = setting;
  const name = `${setting.location} ${setting.placeId}`.toLowerCase();
  const special: [string, number, number, number, number, number, number][] = [
    ["botswana-500", 20, 30.5, -26, -16, 300, 900],
    ["mozambique-700", 31, 42, -27, -10, 300, 900],
    ["bengal-delta-100bce", 87, 94, 20, 27, -500, 500],
    ["deccan-100bce", 72, 84, 11, 22, -500, 499],
    ["south-china-100bce", 105, 122, 20, 27, -500, 600],
    ["north-china-500", 106, 123, 32, 43, 301, 699],
    ["lower-mekong-100ce", 101, 108, 9, 16, -500, 699],
    ["java-interior-100ce", 105, 115, -9, -5, -500, 899],
    ["middle-niger-100bce", -5, 8, 10, 19, -500, 499],
    ["great-lakes-africa-100bce", 28, 38, -7, 3, -500, 599],
    ["congo-100bce", 12, 31, -6, 6, -500, 499],
    ["nile-valley-900", 29, 34.5, 22, 31, 500, 1499],
    ["bay-area-2000", -123.5, -121.2, 36.8, 38.8, 1970, 2100],
    ["namaqualand-2000", 15, 22, -34, -26, 1970, 2100],
    ["mozambique-coast-2000", 31, 42, -27, -10, 1970, 2100],
    ["central-africa-town-2000", 12, 32, -12, 7, 1970, 2100],
    ["southern-africa-city-2000", 16, 42, -35, -10, 1970, 2100],
    ["east-africa-town-2000", 28, 51, -12, 15, 1970, 2100],
    ["west-africa-city-2000", -18, 18, 4, 19, 1970, 2100],
    ["north-africa-town-2000", -17, 38, 17, 38, 1970, 2100],
    ["central-asia-town-2000", 46, 95, 34, 55, 1970, 2100],
    ["south-asia-city-2000", 60, 96, 5, 38, 1970, 2100],
    ["south-asia-rural-2000", 60, 96, 5, 38, 1970, 2100],
    ["southeast-asia-town-2000", 95, 140, -11, 22, 1970, 2100],
    ["east-asia-city-2000", 96, 146, 20, 55, 1970, 2100],
    ["east-asia-rural-2000", 96, 146, 20, 55, 1970, 2100],
    ["andes-town-2000", -82, -65, -30, 8, 1970, 2100],
    ["amazon-town-2000", -77, -47, -15, 9, 1970, 2100],
    ["latin-america-city-2000", -118, -34, -35, 33, 1970, 2100],
    ["latin-america-rural-2000", -118, -34, -35, 33, 1970, 2100],
    ["north-america-suburb-2000", -170, -50, 25, 72, 1970, 2100],
    ["middle-east-town-2000", 34, 66, 12, 43, 1970, 2100],
    ["europe-town-2000", -13, 60, 34, 72, 1970, 2100],
    ["australia-town-2000", 111, 155, -46, -10, 1970, 2100],
    ["pacific-island-town-2000", 155, 180, -30, 30, 1970, 2100],
    ["pacific-island-town-2000", -180, -130, -30, 30, 1970, 2100],
    ["southern-africa-1930", 16, 42, -35, -10, 1900, 1969],
    ["east-africa-1930", 28, 51, -12, 15, 1900, 1969],
    ["central-africa-1930", 12, 32, -12, 7, 1900, 1969],
    ["west-africa-1930", -18, 18, 4, 19, 1900, 1949],
    ["central-asia-1930", 46, 95, 34, 55, 1900, 1969],
    ["middle-east-1930", 34, 66, 12, 43, 1900, 1969],
    ["southeast-asia-1930", 95, 140, -11, 22, 1900, 1969],
    ["europe-1930", -13, 60, 34, 72, 1900, 1969],
    ["americas-1930", -170, -34, -55, 72, 1900, 1969],
    ["australia-1930", 111, 155, -46, -10, 1900, 1969],
    ["pacific-island-1930", 155, 180, -30, 30, 1900, 1969],
    ["pacific-island-1930", -180, -130, -30, 30, 1900, 1969],
    ["mesopotamia-farm-1800bce", 42, 49, 29, 36, -2500, -1000],
    ["indus-hinterland-2200bce", 65, 76, 22, 33, -2700, -1700],
    ["ganges-early-100", 76, 89, 23, 31, -500, 500],
    ["north-china-han-100", 108, 122, 34, 42, -200, 300],
    ["bengal-medieval-1300", 87, 93, 20, 27, 800, 1500],
    ["ganges-medieval-900", 76, 89, 23, 31, 600, 1200],
    ["sichuan-medieval-1200", 102, 108, 27, 33, 900, 1400],
    ["north-china-medieval-1100", 108, 122, 34, 42, 700, 1400],
    ["tamil-country-1100", 76, 81, 8, 13, 800, 1400],
    ["java-medieval-1200", 105, 115, -9, -5, 900, 1500],
    ["bengal-1800", 87, 93, 20, 27, 1650, 1899],
    ["indo-gangetic-1700", 75, 88, 23, 31, 1500, 1850],
    ["lower-yangtze-1700", 115, 123, 28, 34, 1500, 1850],
    ["north-china-1700", 108, 122, 34, 42, 1500, 1850],
    ["europe-lowlands-1650", -1, 15, 47, 55, 1500, 1800],
    ["nile-valley-1800", 29, 34, 22, 31, 1500, 1899],
    ["rural-japan-1800", 130, 142, 32, 41, 1700, 1899],
    ["north-india-1930", 73, 87, 22, 33, 1900, 1969],
    ["east-china-1930", 110, 123, 25, 42, 1900, 1969],
    ["west-africa-1970", -18, 15, 5, 17, 1950, 2100],
    ["northeast-woodlands-1200", -82, -59, 41, 52, 800, 1500],
    ["hudson-lowlands-1200", -107, -75, 50, 61, 800, 1500],
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
    ["amazon-1000", -62, -50, 4, 8, 500, 1500],
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
    ["california-1100", -125, -114, 32, 42, -3000, 1799],
    ["colorado-400", -115, -101, 34, 43, -3000, 1799],
    ["great-plains-1100", -106, -92, 30, 56, -3000, 1799],
    ["eastern-woodlands-400", -100, -62, 25, 62, -3000, 1599],
    ["north-atlantic-1730", -100, -50, 25, 62, 1600, 1899],
    ["western-north-america-1850", -125, -95, 25, 62, 1800, 1899],
  ];
  const named = [
    [/new england|acadian|maine|new brunswick|nova scotia/, "northeast-woodlands-1200"],
    [/hudson bay/, "hudson-lowlands-1200"],
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
      if (id === "mozambique-coast-2000" && !setting.water.startsWith("coast") && !/maputo|beira|quelimane|pemba/.test(name)) continue;
      if (id === "andes-town-2000" && setting.relief < 0.5) continue;
      if (id === "south-asia-city-2000" && setting.settlement !== "city" && setting.settlement !== "port") continue;
      if (id === "east-asia-city-2000" && setting.settlement !== "city" && setting.settlement !== "port") continue;
      if (id === "latin-america-city-2000" && setting.settlement !== "city" && setting.settlement !== "port") continue;
      if (id === "west-africa-city-2000" && setting.settlement !== "city" && setting.settlement !== "port") continue;
      if (id === "indus-hinterland-2200bce" && setting.settlement === "city") continue;
      if (id === "bengal-delta-100bce" && setting.relief >= 0.5) continue;
      if (id === "lower-mekong-100ce" && setting.relief >= 0.5) continue;
      if (id === "congo-100bce" && setting.climate !== "tropical") continue;
      if (id === "andes-1400" && setting.relief < 0.5) continue;
      if (id === "sierra-madre-1000" && setting.relief < 0.5) continue;
      if (id === "sepik-1000" && setting.relief >= 0.5) continue;
      if (id === "australian-interior-500bce" && setting.water.startsWith("coast")) continue;
      return `/opening/${id}.webp`;
    }
  }
  if (lon >= -77 && lon <= -47 && lat >= -15 && lat <= 9 && year < 1900 && setting.climate === "tropical" && setting.relief < 0.5) {
    if (year < 500) return "/opening/amazon-400bce.webp";
    if (year <= 1500) return "/opening/amazon-1000.webp";
    return "/opening/amazon-1750.webp";
  }
  if (lon >= -170 && lon <= -50 && lat >= 25 && year < 1900) {
    if (lat >= 62) return "/opening/arctic-north-america-1100.webp";
    if (year >= 1800) return lon < -100
      ? "/opening/western-north-america-1850.webp"
      : "/opening/north-atlantic-1730.webp";
    if (year >= 1600 && lon >= -100) return "/opening/north-atlantic-1730.webp";
    if (lon < -125 && lat >= 42) return "/opening/pacific-northwest-1100.webp";
    if (lon < -114 && lat < 42) return "/opening/california-1100.webp";
    if (lon < -101 && lat < 43) return "/opening/colorado-400.webp";
    if (lon < -92) return "/opening/great-plains-1100.webp";
    return "/opening/eastern-woodlands-400.webp";
  }
  if (year >= 1900 && year <= 2100) {
    const recent = year >= 1970;
    const urban = setting.settlement === "city" || setting.settlement === "port";
    if (lon < -30) {
      if (!recent) return "/opening/americas-1930.webp";
      if (lat > 25) return "/opening/north-america-suburb-2000.webp";
      return urban ? "/opening/latin-america-city-2000.webp" : "/opening/latin-america-rural-2000.webp";
    }
    if (lon < 45 && lat < 35) {
      if (lat < -10) return recent ? "/opening/southern-africa-city-2000.webp" : "/opening/southern-africa-1930.webp";
      if (lat < 7) return recent ? "/opening/central-africa-town-2000.webp" : "/opening/central-africa-1930.webp";
      if (lat < 17) return recent ? "/opening/east-africa-town-2000.webp" : "/opening/east-africa-1930.webp";
      return recent ? "/opening/north-africa-town-2000.webp" : "/opening/middle-east-1930.webp";
    }
    if (lon < 60 && lat >= 35) return recent ? "/opening/europe-town-2000.webp" : "/opening/europe-1930.webp";
    if (lon < 70) return recent ? "/opening/middle-east-town-2000.webp" : "/opening/middle-east-1930.webp";
    if (lon < 96) return lat > 34
      ? recent ? "/opening/central-asia-town-2000.webp" : "/opening/central-asia-1930.webp"
      : recent ? urban ? "/opening/south-asia-city-2000.webp" : "/opening/south-asia-rural-2000.webp" : "/opening/north-india-1930.webp";
    if (lon < 140 && lat < 22) return recent ? "/opening/southeast-asia-town-2000.webp" : "/opening/southeast-asia-1930.webp";
    if (lon < 155 && lat < -10) return recent ? "/opening/australia-town-2000.webp" : "/opening/australia-1930.webp";
    if (lon < 155 && lat > 15) return recent
      ? urban ? "/opening/east-asia-city-2000.webp" : "/opening/east-asia-rural-2000.webp"
      : "/opening/east-china-1930.webp";
    return recent ? "/opening/pacific-island-town-2000.webp" : "/opening/pacific-island-1930.webp";
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
