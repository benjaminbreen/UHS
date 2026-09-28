import type { ReligiousRule } from "./types";

export const nearEastReligious: ReligiousRule[] = [
  {
    id: "mesopotamian-temple",
    faith: "Mesopotamian",
    recipe: "mesopotamian-temple",
    labels: { small: "Shrine", medium: "Temple", large: "Great temple" },
    culture: "north-african-west-asian",
    from: -3000,
    to: -539,
    bounds: [38, 29, 50, 38],
    side: "north",
    about:
      "The house of the city's god, in a walled court: priests offer there at dawn and dusk, the god's statue is fed and clothed, and none but the temple's own go in past the court.",
    forecourt: 2,
    warded: true,
    evidence: {
      status: "inferred",
      sources: [],
      note: "A niched and buttressed mud-brick enclosure with a towered gate, storerooms round a court and the god's house at the back follows the excavated temples of Nippur, Assur and Old Babylonian Ur. Kassite and Neo-Babylonian temples are not yet told apart.",
    },
  },
  {
    id: "hittite-temple",
    faith: "Hittite",
    recipe: "hittite-temple",
    labels: { small: "Shrine", medium: "Temple", large: "Great temple" },
    culture: "north-african-west-asian",
    from: -1650,
    to: -1180,
    bounds: [26, 35.5, 45, 42.5],
    side: "north",
    about:
      "A house of the thousand gods of Hatti in its walled court: the storerooms hold the god's grain and tablets, and the temple's guards keep the unclean from its gate.",
    forecourt: 2,
    warded: true,
    evidence: {
      status: "inferred",
      sources: [],
      note: "A stone socle under mud brick and timber, a gate flanked by lions, storerooms round a court and a pillared portico before the cella follow Temple I and the upper-city temples at Hattusa. Hittite instructions for temple officials order guards at the gates by night and day.",
    },
  },
];
