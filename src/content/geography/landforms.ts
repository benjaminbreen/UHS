/** Broad game-atlas landforms, hand-simplified in longitude/latitude. */
export const mountainBelts = [
  {
    name: "Apennines",
    width: 0.65,
    points: [
      [9.3, 44.4],
      [11.7, 43.3],
      [13.3, 42.1],
      [15.8, 39.2],
      [16.1, 38],
    ],
  },
  {
    name: "Alps",
    width: 0.8,
    points: [
      [6, 45],
      [8, 46.5],
      [11, 47],
      [15, 46.5],
    ],
  },
  {
    name: "Pyrenees",
    width: 0.45,
    points: [
      [-1.5, 43],
      [1, 42.6],
      [3, 42.4],
    ],
  },
  {
    name: "Balkans",
    width: 1,
    points: [
      [15, 45],
      [20, 42],
      [23, 38],
    ],
  },
  {
    name: "Atlas Mountains",
    width: 1,
    points: [
      [-9, 30],
      [-5, 33],
      [1, 35],
      [8, 35],
    ],
  },
  {
    name: "Taurus and Zagros",
    width: 1.2,
    points: [
      [29, 37],
      [35, 38],
      [42, 38],
      [47, 33],
      [54, 29],
    ],
  },
  {
    name: "Himalaya",
    width: 2,
    points: [
      [73, 35],
      [80, 30],
      [87, 28],
      [96, 29],
    ],
  },
  {
    name: "Tibetan highlands",
    width: 4,
    points: [
      [79, 33],
      [88, 33],
      [96, 34],
    ],
  },
  {
    name: "Ural Mountains",
    width: 0.8,
    points: [
      [59, 51],
      [60, 58],
      [64, 67],
    ],
  },
  {
    name: "Altai",
    width: 1.4,
    points: [
      [84, 48],
      [90, 49],
      [97, 52],
      [106, 52],
    ],
  },
  {
    name: "Japanese mountains",
    width: 0.55,
    points: [
      [130.7, 32.5],
      [135, 35],
      [139, 37],
      [142, 43],
    ],
  },
  {
    name: "Burmese highlands",
    width: 1,
    points: [
      [96, 27],
      [97, 23],
      [98, 18],
    ],
  },
  {
    name: "Javanese spine",
    width: 0.28,
    points: [
      [106, -6.8],
      [110, -7.5],
      [114, -8],
    ],
  },
  {
    name: "Rocky Mountains",
    width: 2,
    points: [
      [-132, 58],
      [-118, 48],
      [-110, 40],
      [-106, 32],
    ],
  },
  {
    name: "Appalachians",
    width: 1,
    points: [
      [-72, 44],
      [-77, 39],
      [-83, 35],
    ],
  },
  {
    name: "Andes",
    width: 1.5,
    points: [
      [-73, 8],
      [-78, -1],
      [-75, -10],
      [-68, -22],
      [-70, -37],
      [-73, -51],
    ],
  },
  {
    name: "Hispaniola",
    width: 0.4,
    points: [
      [-73.8, 18.3],
      [-72.5, 18.9],
      [-71, 19],
      [-69.8, 18.8],
    ],
  },
  {
    name: "Ethiopian highlands",
    width: 2,
    points: [
      [37, 13],
      [39, 9],
      [38, 6],
    ],
  },
  {
    name: "East African highlands",
    width: 1,
    points: [
      [35, 3],
      [37, -3],
      [34, -10],
    ],
  },
  {
    name: "Great Dividing Range",
    width: 1,
    points: [
      [145, -17],
      [150, -27],
      [148, -37],
    ],
  },
];

type Box = readonly [west: number, south: number, east: number, north: number];
const inside = (lon: number, lat: number, [w, s, e, n]: Box) =>
  lon >= w && lon <= e && lat >= s && lat <= n;

/** Typical ground altitude of the world's high country, in metres: a broad
 * reading for snowlines and the high-plateau colourways, not a DEM. The
 * highest box containing a place wins. */
export const highlands: readonly [name: string, metres: number, box: Box][] = [
  ["Tibetan Plateau", 4500, [78, 28.5, 102, 36.5]],
  ["Pamir", 4000, [71, 36.5, 75.5, 39.5]],
  ["Altiplano", 3800, [-71.5, -23, -65.5, -14]],
  ["Himalaya", 3000, [73, 27, 97, 31]],
  ["Central Andes", 3000, [-77, -14, -70, -6]],
  ["Northern Andes", 2700, [-79, -6, -72, 8]],
  ["Tian Shan", 2500, [72, 40, 86, 43.5]],
  ["Ethiopian Highlands", 2400, [36, 6, 40.5, 14.5]],
  ["Rockies", 2000, [-115, 35, -104, 48]],
  ["Mexican Plateau", 2000, [-104, 18.5, -97, 24]],
  ["Caucasus", 2000, [40, 42, 47, 43.5]],
  ["Colorado Plateau", 1800, [-113, 35, -107, 39]],
  ["East African Highlands", 1700, [29, -4, 38, 2]],
  ["Alps", 1500, [5.5, 45, 15.5, 47.5]],
  ["Mongolian Plateau", 1500, [90, 43, 115, 50]],
  ["Highveld", 1500, [26, -28, 31, -25]],
  ["Iranian Plateau", 1200, [48, 27, 62, 37]],
  ["Loess Plateau", 1200, [103.5, 34, 114, 39.5]],
  ["Anatolian Plateau", 1000, [30, 37, 42, 40]],
  ["Deccan", 600, [74, 13, 80, 21]],
];
export function highlandAltitude(lon: number, lat: number) {
  let metres = 0;
  for (const [, m, box] of highlands) if (m > metres && inside(lon, lat, box)) metres = m;
  return metres;
}

/** Ground that has its own relief: sand seas, tower karst, cenotes and
 * dolines, limestone pavement, volcanic fields, loess and badlands. Named
 * boxes, first match wins; outside them the ground keeps its plain relief. */
export type TerrainProvince =
  | "erg"
  | "karst"
  | "cenote"
  | "doline"
  | "pavement"
  | "volcanic"
  | "loess"
  | "badland";
export const terrainProvinces: readonly [TerrainProvince, string, Box][] = [
  ["erg", "Rub' al Khali", [44, 16.5, 56, 23.5]],
  ["erg", "Nafud", [38, 27, 44, 29.5]],
  ["erg", "Grand Erg Oriental", [5.5, 28.5, 10, 32]],
  ["erg", "Grand Erg Occidental", [-2, 28.5, 3, 31.5]],
  ["erg", "Erg Chech", [-6, 22, 0, 27.5]],
  ["erg", "Ubari and Murzuq", [10, 23.5, 15, 27.5]],
  ["erg", "Great Sand Sea", [24, 23.5, 27, 29]],
  ["erg", "Ténéré", [8, 16, 12, 20]],
  ["erg", "Taklamakan", [77, 37, 88, 40.5]],
  ["erg", "Badain Jaran", [100, 39, 104, 42]],
  ["erg", "Karakum", [56, 37.5, 63, 41]],
  ["erg", "Thar", [69.5, 24.5, 73, 28.5]],
  ["erg", "Namib", [14.5, -27, 16, -23.5]],
  ["erg", "Simpson", [135, -27.5, 139, -24]],
  ["erg", "Great Sandy", [121, -22, 127, -18]],
  ["karst", "Guilin and Yangshuo", [109.8, 24.4, 111, 25.6]],
  ["karst", "Ninh Binh", [105.6, 20.1, 106.1, 20.45]],
  ["karst", "Phong Nha", [105.9, 17.3, 106.4, 17.8]],
  ["karst", "Vang Vieng", [102.3, 18.8, 102.6, 19.2]],
  ["karst", "Phang Nga and Krabi", [98.3, 7.9, 99, 8.6]],
  ["karst", "Shilin", [103.2, 24.7, 103.5, 24.9]],
  ["karst", "Viñales", [-84, 22.4, -83.4, 22.8]],
  ["karst", "Puerto Rico karst", [-67.2, 18.2, -66.2, 18.5]],
  ["karst", "Chocolate Hills", [124, 9.7, 124.4, 10]],
  ["cenote", "Yucatán", [-90.6, 19.6, -86.7, 21.6]],
  ["doline", "Kras and the Dinarides", [13.5, 43, 18.5, 46]],
  ["doline", "Florida", [-83, 27.5, -81, 30]],
  ["pavement", "the Burren", [-9.4, 52.9, -8.9, 53.2]],
  ["pavement", "Yorkshire Dales", [-2.5, 54, -1.9, 54.3]],
  ["volcanic", "Iceland", [-24.5, 63.3, -13.5, 66.6]],
  ["volcanic", "Hawaii", [-156.1, 18.9, -154.8, 20.3]],
  ["volcanic", "Etna", [14.7, 37.5, 15.3, 38]],
  ["volcanic", "Vesuvius and the Phlegraean Fields", [14, 40.7, 14.6, 40.95]],
  ["volcanic", "Chaîne des Puys", [2.8, 45.5, 3.1, 46]],
  ["volcanic", "Eifel", [6.5, 50, 7.2, 50.5]],
  ["volcanic", "Lanzarote", [-14, 28.8, -13.4, 29.3]],
  ["volcanic", "Tenerife", [-16.9, 28, -16.1, 28.6]],
  ["volcanic", "Michoacán–Guanajuato", [-102.8, 19, -101, 20]],
  ["volcanic", "Sierra Chichinautzin", [-99.5, 19, -98.6, 19.3]],
  ["volcanic", "Craters of the Moon", [-113.8, 43.2, -113.3, 43.6]],
  ["volcanic", "Kamchatka", [156, 51, 163, 57]],
  ["volcanic", "Tengger", [112.8, -8.1, 113.1, -7.8]],
  ["volcanic", "Afar", [40, 11, 42.5, 14.5]],
  ["volcanic", "Harrat Rahat", [39.6, 21.5, 40.4, 24.5]],
  ["volcanic", "Taupō", [175.5, -39.4, 176.2, -38.5]],
  ["volcanic", "Auckland field", [174.6, -37, 175, -36.8]],
  ["volcanic", "Galápagos", [-91.7, -1.5, -89.2, 0.7]],
  ["volcanic", "Jeju", [126.1, 33.2, 126.95, 33.6]],
  ["volcanic", "Virunga", [29.1, -1.7, 29.7, -1.3]],
  ["volcanic", "Kilimanjaro", [37.1, -3.3, 37.6, -2.9]],
  ["volcanic", "Mount Cameroon", [9, 3.9, 9.4, 4.4]],
  ["loess", "Loess Plateau", [103.5, 34, 114, 39.5]],
  ["badland", "Big Badlands", [-102.9, 43.5, -101.5, 44]],
  ["badland", "Alberta badlands", [-113, 50.6, -111.3, 51.6]],
  ["badland", "Bardenas Reales", [-1.7, 42, -1.3, 42.4]],
  ["badland", "Tabernas", [-2.5, 36.95, -2.2, 37.15]],
  ["badland", "Cappadocia", [34.6, 38.5, 35.1, 38.8]],
  ["badland", "Ischigualasto", [-68, -30.2, -67.6, -29.7]],
  // Lavaka gullies of the cleared central highlands.
  ["badland", "Malagasy highlands", [46, -21, 48, -17]],
];
export function terrainProvinceAt(lon: number, lat: number): TerrainProvince | undefined {
  return terrainProvinces.find(([, , box]) => inside(lon, lat, box))?.[0];
}

/** Ice sheets at their Last Glacial Maximum extent, kept until the late-glacial
 * retreat, then shrunk to their cores until the Holocene. */
const glacialIce: readonly Box[] = [
  [-140, 47, -52, 83],
  [-97, 40, -70, 47],
  [-11, 52.5, 35, 72],
  [25, 55, 45, 68],
  [5.5, 45.3, 15.5, 47.8],
  [-76, -56, -70, -38],
];
const lateGlacialIce: readonly Box[] = [
  [-120, 52, -60, 70],
  [5, 59, 30, 70],
];
export function iceSheetAt(lon: number, lat: number, year: number) {
  if (year > -11000 || year < -115000) return false;
  return (year < -15000 ? glacialIce : lateGlacialIce).some((b) => inside(lon, lat, b));
}
