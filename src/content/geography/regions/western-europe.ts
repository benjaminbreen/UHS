import type { RegionalProfile, Provenance } from "./types";
const londonEvidence: Provenance = {
  status: "inferred",
  sources: [
    "https://www.londonmuseum.org.uk/collections/time-periods/elizabethan/collections/",
    "https://mapco.net/agas/agas.htm",
  ],
  note: "Approximate spatial relationships from early modern London maps. Coordinates, footprints, river width and extension across 1500–1665 are game-scale interpretations, not surveyed historical boundaries.",
};
const londonDates = { start: { year: 1500 }, end: { year: 1666 } };
export const westernEurope: RegionalProfile[] = [
  {
    id: "early-modern-london",
    bounds: [-0.19, 51.475, -0.055, 51.55],
    dates: londonDates,
    priority: 100,
    settlement: "anchored",
    defaults: {
      culture: "european",
      architecture: "timber",
      climate: "temperate",
      relief: 0.15,
    },
    evidence: londonEvidence,
    places: [
      {
        id: "london",
        name: "City of London",
        at: [-0.092, 51.515],
        radius: 35,
        dates: londonDates,
        defaults: { settlement: "city", settlementPattern: "dense" },
        evidence: londonEvidence,
      },
      {
        id: "westminster",
        name: "Westminster",
        at: [-0.13, 51.501],
        radius: 24,
        dates: londonDates,
        defaults: { settlement: "city", settlementPattern: "clustered" },
        evidence: londonEvidence,
      },
      {
        id: "southwark",
        name: "Southwark",
        at: [-0.091, 51.501],
        radius: 23,
        dates: londonDates,
        defaults: { settlement: "port", settlementPattern: "waterfront" },
        evidence: londonEvidence,
      },
    ],
    features: [
      {
        id: "thames-london",
        kind: "river",
        width: 5,
        dates: londonDates,
        geometry: [
          [-0.19, 51.479],
          [-0.155, 51.485],
          [-0.125, 51.488],
          [-0.12, 51.502],
          [-0.113, 51.509],
          [-0.101, 51.509],
          [-0.09, 51.507],
          [-0.073, 51.505],
          [-0.055, 51.508],
        ],
        evidence: londonEvidence,
      },
    ],
    connections: [
      {
        id: "london-westminster",
        from: "london",
        to: "westminster",
        mode: "road",
        dates: londonDates,
        via: [
          [-0.112, 51.516],
          [-0.128, 51.51],
        ],
        evidence: londonEvidence,
      },
      {
        id: "london-southwark",
        from: "london",
        to: "southwark",
        mode: "road",
        dates: londonDates,
        evidence: londonEvidence,
      },
    ],
  },
  {
    id: "iberia-early-modern",
    bounds: [-9.6, 36, -0.6, 43.8],
    dates: { start: { year: 1500 }, end: { year: 1900 } },
    priority: 40,
    settlement: "procedural",
    defaults: { culture: "european", architecture: "timber" },
    evidence: {
      status: "inferred",
      sources: [
        "https://www.visitportugal.com/en/NR/exeres/98BE771F-120C-4A83-A18B-DFC8C7907F5B",
        "https://www.esmadrid.com/historia-de-madrid",
      ],
      note: "Named cities retained across this period; buildings, settlement radii and intervening countryside are procedural.",
    },
    places: [
      {
        id: "lisbon",
        name: "Lisbon",
        at: [-9.139, 38.722],
        radius: 95,
        dates: { start: { year: 1500 }, end: { year: 1900 } },
        defaults: { settlement: "port", settlementPattern: "waterfront" },
        evidence: {
          status: "inferred",
          sources: ["https://www.visitlisboa.com/en/lisbon-stories"],
          note: "Approximate city anchor, not a reconstruction of the city before or after the 1755 earthquake.",
        },
      },
      {
        id: "madrid",
        name: "Madrid",
        at: [-3.704, 40.416],
        radius: 95,
        dates: { start: { year: 1500 }, end: { year: 1900 } },
        defaults: { settlement: "city", settlementPattern: "dense" },
        evidence: {
          status: "inferred",
          sources: ["https://www.esmadrid.com/historia-de-madrid"],
          note: "Approximate city anchor; footprint is generated rather than dated cadastral geometry.",
        },
      },
    ],
  },
];
