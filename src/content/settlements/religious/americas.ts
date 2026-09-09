import type { CultureId } from "../../history/types";
import type { ReligiousRule } from "./types";

/** The atlas keys the Americas by indigenous family whatever the date, so
 * the colonial church is listed under every family the region carries. */
const americas: CultureId[] = [
  "other-indigenous-american",
  "mesoamerican",
  "andean",
];

export const americasReligious: ReligiousRule[] = [
  ...americas.map(
    (culture): ReligiousRule => ({
      id: "spanish-american-church",
      faith: "Catholic",
      recipe: "mission-church",
      labels: {
        small: "Mission chapel",
        medium: "Parish church",
        large: "Cathedral",
      },
      culture,
      from: 1550,
      to: 1900,
      bounds: [-118, -40, -35, 33],
      side: "east",
      forecourt: 3,
      evidence: {
        status: "inferred",
        sources: [],
        note: "The church on the plaza's east side with a walled atrio in front follows the 1573 ordinances for Spanish American towns and the surviving mission and parish churches. Twin towers and a dome are reserved for the largest places.",
      },
    }),
  ),
  {
    id: "mississippian-platform-mound",
    faith: "Mississippian",
    recipe: "stepped-platform",
    labels: {
      small: "Platform mound",
      medium: "Temple mound",
      large: "Great mound",
    },
    culture: "other-indigenous-american",
    from: 800,
    to: 1600,
    bounds: [-98, 29, -78, 42],
    side: "north",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "An earthen, grass-covered platform mound with a stair on the plaza side and a thatched building on top follows Cahokia, Moundville and Etowah. The town plaza itself is attested; house forms around it are illustrative.",
    },
  },
  {
    id: "mesoamerican-temple-pyramid",
    faith: "Mesoamerican",
    recipe: "stepped-platform",
    labels: {
      small: "Shrine platform",
      medium: "Temple platform",
      large: "Temple pyramid",
    },
    culture: "mesoamerican",
    from: -200,
    to: 1550,
    bounds: [-106, 13, -85, 23],
    side: "east",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "A stone-faced stepped pyramid with a balustraded stair and a crested temple follows the surviving platforms of the Mexican highlands and the Maya lowlands. Tier counts here are illustrative.",
    },
  },
  {
    id: "andean-platform-temple",
    faith: "Andean",
    recipe: "stepped-platform",
    labels: {
      small: "Terraced shrine",
      medium: "Platform temple",
      large: "Great platform",
    },
    culture: "andean",
    from: -1000,
    to: 1600,
    bounds: [-82, -22, -65, -4],
    side: "north",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "A terraced stone platform with a central stair and a plain summit building follows the ushnu platforms and terraced shrines of the Andes. Dressed-stone facing is shown for the highlands.",
    },
  },
];
