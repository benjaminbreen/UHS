import type { CultureId } from "../../history/types";
import type { ReligiousRule } from "./types";

/** The atlas keys most of the Americas by indigenous family whatever the
 * date (settler colonies such as the Caribbean and Brazil turn european), so
 * the colonial church is listed under every family the region carries. */
const americas: CultureId[] = [
  "european",
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
      about:
        "The parish church, where the town hears Mass, has its children baptised and buries its dead.",
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
    about:
      "A great earthen mound with a temple on top. Chiefs and priests climb it for ceremonies that the whole town gathers below to watch.",
    forecourt: 2,
    drawnAt: "small",
    evidence: {
      status: "inferred",
      sources: [],
      note: "An earthen, grass-covered platform mound with a stair on the plaza side and a thatched building on top follows Cahokia, Moundville and Etowah. The town plaza itself is attested; house forms around it are illustrative.",
    },
  },
  {
    id: "cahokia-great-mound",
    faith: "Mississippian",
    recipe: "mississippian-great-mound",
    labels: { small: "Great mound", medium: "Great mound", large: "Great mound" },
    culture: "other-indigenous-american",
    from: 1050,
    to: 1350,
    bounds: [-90.5, 38.4, -89.7, 38.9],
    side: "north",
    about:
      "The great mound at the head of the plaza, the chief's hall on its summit. Chiefs and priests climb it for ceremonies that the whole town gathers below to watch.",
    forecourt: 2,
    drawnAt: "large",
    evidence: {
      status: "inferred",
      sources: [],
      note: "Monks Mound: a terraced earthen platform about 30 m high, its broad first terrace on the plaza side, raised from about 900 to 1200, with a large building on the summit known from post molds. The ramp, steps and summit fence are reconstructed; the scale is reduced to fit the town.",
    },
  },
  {
    id: "maya-temple-pyramid",
    faith: "Maya",
    recipe: "meso-temple-maya",
    labels: {
      small: "Shrine platform",
      medium: "Temple pyramid",
      large: "Great temple pyramid",
    },
    culture: "mesoamerican",
    from: -600,
    to: 1550,
    bounds: [-94, 13, -85, 22],
    side: "east",
    about:
      "A steep stepped pyramid with a shrine and a pierced roof comb at the top, where priests burn copal and make offerings for the town and its lords.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "Red-stuccoed terraces with apron mouldings, a single steep stair and a combed summit temple follow the Petén and Usumacinta temples (Tikal, Palenque). Tier counts, colour schemes and the thatched shrine of the smallest are illustrative.",
    },
  },
  {
    id: "mesoamerican-temple-pyramid",
    faith: "Mesoamerican",
    recipe: "meso-temple-nahua",
    labels: {
      small: "Momoztli shrine",
      medium: "Temple pyramid",
      large: "Twin temple",
    },
    culture: "mesoamerican",
    from: -200,
    to: 1550,
    bounds: [-106, 13, -85, 23],
    side: "east",
    about:
      "A stepped pyramid with a shrine at the top, where priests make offerings to the gods for the whole town.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "Plastered talud terraces, balustrades that stand up square at the top of the stair, serpent heads at its foot and painted high-roofed shrines follow the Templo Mayor and Tenayuca; the largest carries the twin shrines of Tlaloc and Huitzilopochtli. Tier counts and palettes are illustrative.",
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
    // Caral's platform mounds date from about 2600 BCE.
    from: -2700,
    to: 1600,
    bounds: [-82, -22, -65, -4],
    side: "north",
    about:
      "A raised stone platform with a shrine on top, where offerings are made to the gods and the ancestors.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "A terraced stone platform with a central stair and a plain summit building follows the ushnu platforms and terraced shrines of the Andes. Dressed-stone facing is shown for the highlands.",
    },
  },
];
