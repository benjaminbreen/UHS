import type { RegionalProfile, Provenance, Coordinate } from "./types";
const dates = { start: { year: 1850 }, end: { year: 1914 } };
const modernDates = { start: { year: 1914 }, end: { year: 2100 } };
/** Land and water hold for both periods; only the places change. */
const featureDates = { start: { year: 1850 } };
const evidence: Provenance = {
  status: "inferred",
  sources: [
    "https://www.loc.gov/item/80695174/",
    "https://www.loc.gov/item/76692279/",
  ],
  note: "Deliberately simplified land/water and urban shapes, informed by nineteenth-century maps; not digitized shorelines or exact dated development limits. Shared building art remains approximate.",
};
const manhattan: Coordinate[] = [
  [-74.018, 40.701],
  [-74.012, 40.725],
  [-74.008, 40.756],
  [-73.978, 40.798],
  [-73.935, 40.873],
  [-73.911, 40.874],
  [-73.933, 40.825],
  [-73.94, 40.793],
  [-73.969, 40.739],
  [-73.974, 40.709],
];
const longIsland: Coordinate[] = [
  [-73.8, 40.53],
  [-73.96, 40.565],
  [-74.025, 40.635],
  [-74.034, 40.678],
  [-73.976, 40.715],
  [-73.953, 40.765],
  [-73.902, 40.795],
  [-73.8, 40.84],
];
const newYorkFeatures: RegionalProfile["features"] = [
  {
    id: "new-york-harbor",
    kind: "sea",
    geometry: [
      [-74.27, 40.48],
      [-73.8, 40.48],
      [-73.8, 40.92],
      [-74.27, 40.92],
    ],
    dates: featureDates,
    evidence,
  },
  {
    id: "manhattan-land",
    kind: "land",
    geometry: manhattan,
    dates: featureDates,
    evidence,
  },
  {
    id: "new-jersey-land",
    kind: "land",
    geometry: [
      [-74.27, 40.55],
      [-74.13, 40.64],
      [-74.065, 40.685],
      [-74.028, 40.74],
      [-73.925, 40.92],
      [-74.27, 40.92],
    ],
    dates: featureDates,
    evidence,
  },
  {
    id: "long-island-land",
    kind: "land",
    geometry: longIsland,
    dates: featureDates,
    evidence,
  },
  {
    id: "staten-island-land",
    kind: "land",
    geometry: [
      [-74.255, 40.5],
      [-74.225, 40.56],
      [-74.175, 40.645],
      [-74.085, 40.649],
      [-74.055, 40.6],
      [-74.14, 40.54],
    ],
    dates: featureDates,
    evidence,
  },
  {
    id: "bronx-land",
    kind: "land",
    geometry: [
      [-73.917, 40.92],
      [-73.912, 40.86],
      [-73.93, 40.815],
      [-73.88, 40.806],
      [-73.8, 40.84],
      [-73.8, 40.92],
    ],
    dates: featureDates,
    evidence,
  },
  {
    id: "central-park",
    kind: "park",
    geometry: [
      [-73.982, 40.768],
      [-73.958, 40.8],
      [-73.949, 40.796],
      [-73.973, 40.764],
    ],
    dates: { start: { year: 1860 } },
    evidence: {
      status: "inferred",
      sources: ["https://www.centralparknyc.org/articles/central-park-history"],
      note: "Approximate park footprint reserved from settlement generation from 1860; phased construction and earlier communities are not reconstructed.",
    },
  },
];
export const northAmerica: RegionalProfile[] = [
  {
    id: "new-york-nineteenth-century",
    bounds: [-74.27, 40.48, -73.8, 40.92],
    dates,
    priority: 100,
    settlement: "anchored",
    defaults: {
      culture: "european",
      architecture: "board",
      climate: "temperate",
      relief: 0.15,
    },
    evidence,
    places: [
      {
        id: "manhattan",
        name: "Manhattan",
        at: [-74.005, 40.721],
        footprint: manhattan,
        radius: 45,
        population: 900000,
        dates,
        defaults: { settlement: "city", settlementPattern: "planned" },
        evidence,
      },
      {
        id: "brooklyn",
        name: "Brooklyn",
        at: [-73.993, 40.693],
        radius: 55,
        population: 300000,
        dates,
        defaults: { settlement: "city", settlementPattern: "dense" },
        evidence,
      },
      {
        id: "staten-island",
        name: "Staten Island",
        at: [-74.082, 40.64],
        radius: 24,
        dates,
        defaults: { settlement: "village", settlementPattern: "roadside" },
        evidence,
      },
    ],
    features: newYorkFeatures,
    connections: [
      {
        id: "manhattan-brooklyn-water",
        from: "manhattan",
        to: "brooklyn",
        mode: "ferry",
        dates,
        evidence,
      },
      {
        id: "manhattan-staten-water",
        from: "manhattan",
        to: "staten-island",
        mode: "ferry",
        dates,
        evidence,
      },
    ],
  },
  {
    id: "new-york-modern",
    bounds: [-74.27, 40.48, -73.8, 40.92],
    dates: modernDates,
    priority: 100,
    settlement: "anchored",
    defaults: {
      culture: "european",
      architecture: "board",
      climate: "temperate",
      relief: 0.15,
    },
    evidence: {
      status: "inferred",
      sources: ["https://www.naturalearthdata.com/"],
      note: "The same simplified land and water as the nineteenth-century entry, with density anchored on the Financial District and Midtown. Block art is generic; the grid module, not any named street, is reproduced.",
    },
    places: [
      {
        // Replaces the gazetteer anchor of the same id, which would
        // otherwise stand a second city on top of this one after 1990.
        id: "city-new-york",
        name: "New York",
        at: [-74.006, 40.712],
        footprint: manhattan,
        radius: 140,
        population: 8000000,
        // Narrow island: the built extent runs north-south.
        aspect: 0.45,
        cores: [
          { at: [-74.009, 40.708], radius: 60 },
          { at: [-73.985, 40.755], radius: 70, weight: 0.9 },
        ],
        dates: modernDates,
        defaults: {
          settlement: "port",
          settlementPattern: "planned",
          water: "coast-s",
        },
        evidence,
      },
      {
        id: "brooklyn",
        name: "Brooklyn",
        at: [-73.99, 40.69],
        // The polygon keeps this claim off Manhattan across the river.
        footprint: longIsland,
        radius: 110,
        population: 2500000,
        cores: [{ at: [-73.99, 40.693], radius: 70 }],
        dates: modernDates,
        defaults: {
          settlement: "port",
          settlementPattern: "dense",
          water: "coast-w",
        },
        evidence,
      },
    ],
    features: newYorkFeatures,
    connections: [
      {
        id: "manhattan-brooklyn-bridge",
        from: "city-new-york",
        to: "brooklyn",
        mode: "road",
        dates: modernDates,
        evidence,
      },
    ],
  },
];
