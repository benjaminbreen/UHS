import type { Coordinate } from "../../../world/travel/types";

type Area = { id: string; name: string; ring: [number, number][] };
const area = (id: string, name: string, ring: [number, number][]): Area => ({
  id,
  name,
  ring,
});

// Simplified interpretation of USGS physiographic provinces, not surveyed boundaries.
// https://pubs.usgs.gov/gip/70039236/report.pdf
export const northAmericanLandscapes: Area[] = [
  area("lower-mississippi", "Lower Mississippi floodplain", [
    [-91.8, 29],
    [-90.5, 29],
    [-90.6, 32],
    [-89.5, 35],
    [-89, 37],
    [-90, 37],
    [-91.3, 35],
    [-92.1, 32],
  ]),
  area("ozarks", "Ozark uplands", [
    [-94.8, 35.5],
    [-91, 35.5],
    [-89.8, 37],
    [-91, 38.8],
    [-94.6, 38.5],
  ]),
  area("ouachitas", "Ouachita Mountains", [
    [-95.8, 34],
    [-92, 34],
    [-92, 35.2],
    [-95.8, 35.2],
  ]),
  area("piney-woods", "Piney Woods", [
    [-96, 30],
    [-92.1, 30],
    [-91.5, 33],
    [-94, 34.5],
    [-95.8, 33],
  ]),
  area("edwards-plateau", "Edwards Plateau", [
    [-102, 29.5],
    [-99, 29],
    [-97.5, 30],
    [-98.5, 32],
    [-101.5, 32.3],
  ]),
  area("chihuahuan", "Chihuahuan Desert", [
    [-108.5, 27],
    [-103, 25],
    [-101.5, 29],
    [-102, 32.5],
    [-105, 35],
    [-108.5, 33],
  ]),
  area("southern-high-plains", "Southern High Plains", [
    [-103.8, 32.5],
    [-100, 32.5],
    [-100, 37],
    [-104, 37],
  ]),
  area("texas-prairies", "Texas prairies", [
    [-101.5, 29.5],
    [-96, 28],
    [-95, 33],
    [-96, 34.5],
    [-100, 34.5],
  ]),
  area("georgia-coastal-plain", "Georgia coastal plain", [
    [-84.8, 30],
    [-80, 30],
    [-80, 33],
    [-82, 34.5],
    [-84.8, 32.5],
  ]),
  area("alabama-coastal-plain", "Alabama coastal plain", [
    [-88.5, 30],
    [-84.8, 30],
    [-84.8, 33],
    [-88.5, 34],
  ]),
  area("mississippi-pine-hills", "Mississippi pine hills", [
    [-91, 30],
    [-88.5, 30],
    [-88.5, 33.5],
    [-90.5, 33.5],
  ]),
  area("gulf-coastal-plain", "Gulf coastal plain", [
    [-98, 25],
    [-80, 25],
    [-80, 31],
    [-85, 34],
    [-89, 35],
    [-92, 34],
    [-96, 30],
  ]),
  area("atlantic-coastal-plain", "Atlantic coastal plain", [
    [-82, 30],
    [-77, 33],
    [-73, 40],
    [-75, 40],
    [-78, 36],
    [-82, 32],
  ]),
  area("appalachians", "Appalachian uplands", [
    [-87, 33],
    [-84, 32],
    [-78, 36],
    [-74, 41],
    [-70, 45],
    [-74, 46],
    [-81, 41],
    [-85, 37],
  ]),
  area("colorado-plateau", "Colorado Plateau", [
    [-114, 35],
    [-109, 34],
    [-107, 37],
    [-109, 41],
    [-112, 41],
    [-114, 38],
  ]),
  area("sonoran", "Sonoran Desert", [
    [-116, 28],
    [-110, 28],
    [-109, 32],
    [-112, 34],
    [-115, 34],
  ]),
  area("great-plains", "Great Plains", [
    [-105, 34],
    [-97, 34],
    [-96, 49],
    [-110, 49],
    [-106, 43],
  ]),
  area("rocky-mountains", "Rocky Mountains", [
    [-110, 31],
    [-104, 31],
    [-104, 42],
    [-110, 50],
    [-117, 50],
    [-112, 40],
  ]),
  area("great-basin", "Great Basin", [
    [-120, 35],
    [-114, 35],
    [-112, 42],
    [-119, 43],
  ]),
  area("california", "California valleys and ranges", [
    [-125, 32],
    [-117, 32],
    [-119, 42],
    [-125, 42],
  ]),
  area("interior-lowlands", "Interior lowlands", [
    [-98, 34],
    [-88, 34],
    [-80, 41],
    [-82, 49],
    [-98, 49],
  ]),
];

function contains(ring: Area["ring"], { lon, lat }: Coordinate) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x, y] = ring[i],
      [a, b] = ring[j];
    if (y > lat !== b > lat && lon < ((a - x) * (lat - y)) / (b - y) + x)
      inside = !inside;
  }
  return inside;
}
export function northAmericanLandscape(p: Coordinate) {
  return northAmericanLandscapes.find((a) => contains(a.ring, p));
}
