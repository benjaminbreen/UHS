import type { RegionalProfile, Bounds, LocalDefaults } from "./types";

const evidence = {
  status: "fictional" as const,
  note: "Broad production-library defaults for unresearched locations, not ethnic or political borders. Dated local profiles override them.",
  sources: [],
};
/** These overlapping envelopes choose reusable content, never a person's identity. */
const envelopes: [
  string,
  Bounds,
  NonNullable<LocalDefaults["culture"]>,
  NonNullable<LocalDefaults["architecture"]>,
][] = [
  ["europe", [-25, 35, 60, 85], "european", "timber"],
  ["west-asia", [-18, 15, 65, 38], "north-african-west-asian", "mudbrick"],
  ["inner-eurasia", [45, 38, 180, 85], "inner-eurasian", "timber"],
  ["south-asia", [65, 5, 91, 38], "south-asian", "courtyard"],
  ["east-asia", [91, 20, 150, 55], "east-asian", "courtyard"],
  ["southeast-asia", [91, -12, 141, 20], "southeast-asian", "timber"],
  [
    "west-central-africa",
    [-20, -15, 30, 15],
    "west-central-african",
    "mudbrick",
  ],
  [
    "east-southern-africa",
    [20, -36, 55, 15],
    "east-southern-african",
    "timber",
  ],
  ["americas", [-180, -56, -30, 85], "other-indigenous-american", "timber"],
  ["mesoamerica", [-118, 7, -82, 25], "mesoamerican", "mudbrick"],
  ["andes", [-82, -35, -65, 8], "andean", "mudbrick"],
  ["australia-pacific", [110, -50, 180, 5], "australian-pacific", "shelter"],
  ["pacific-east", [-180, -50, -120, 0], "australian-pacific", "timber"],
];
export const globalProfiles: RegionalProfile[] = envelopes.map(
  ([id, bounds, culture, architecture], priority) => ({
    id,
    bounds,
    priority,
    dates: {},
    settlement: "procedural",
    defaults: { culture, architecture },
    evidence,
  }),
);
