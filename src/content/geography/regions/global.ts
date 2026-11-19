import type { RegionalProfile, Bounds, LocalDefaults, Provenance } from "./types";

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
const broadRegions: RegionalProfile[] = envelopes.map(
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

const nyanza:Provenance = {status:"inferred",sources:["https://www.fao.org/4/t0336e/T0336E02.htm"],
  note:"A reconstructed fishing settlement on the southern shore of Lake Victoria. The inlet is compressed to local map scale."};
const ur:Provenance={status:"inferred",sources:["https://www.britishmuseum.org/collection/object/W_1953-0411-71"],
  note:"A reconstructed branch and trading bank at Ur, at game scale. The tablet documents the copper trade, not this quay plan."};
export const globalProfiles:RegionalProfile[]=[...broadRegions,{
  id:"ancient-ur",bounds:[46.06,30.92,46.15,31.01],dates:{start:{year:-2999},end:{year:-1199}},priority:80,settlement:"anchored",
  defaults:{water:"river-ns",relief:.06},evidence:ur,
  features:[{id:"ur-channel",kind:"river",width:12,geometry:[[46.082,31.02],[46.09,30.986],[46.088,30.962],[46.093,30.938],[46.12,30.91]],dates:{},evidence:ur}],
},{
  id:"mwanza-lakeshore",bounds:[32.85,-2.55,32.94,-2.46],dates:{start:{year:1000}},priority:80,settlement:"anchored",
  defaults:{water:"lake",relief:.06},evidence:nyanza,
  places:[{id:"mwanza-landing",name:"Mwanza Gulf fishing landing",at:[32.892,-2.514],radius:30,dates:{start:{year:1000}},
    defaults:{water:"lake",settlement:"village",settlementPattern:"waterfront",relief:.05},evidence:nyanza}],
  features:[{id:"mwanza-gulf-inlet",kind:"lake",geometry:[[32.84,-2.46],[32.93,-2.46],[32.906,-2.492],[32.888,-2.502],[32.866,-2.513],[32.84,-2.516]],dates:{},evidence:nyanza}],
}];
