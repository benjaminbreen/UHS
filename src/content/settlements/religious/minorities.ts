import { over, type ReligiousRule } from "./types";

/**
 * Faiths that were the town's own only in a few places: the Galilean
 * villages, the Jewish cities of the Ottoman world and of the Polish
 * borderlands, the Parsi towns of Gujarat. A rule names those places; a
 * community living as a minority elsewhere is not yet drawn.
 */
const synagogue = {
  faith: "Jewish",
  labels: { small: "Synagogue", medium: "Synagogue", large: "Great synagogue" },
  side: "north",
  about:
    "The synagogue: the Torah scrolls in their ark on the wall facing Jerusalem, the reader's platform, prayers morning and evening, and the town's study and courts held in its rooms.",
  forecourt: 2,
} as const;

export const minorityReligious: ReligiousRule[] = [
  {
    ...synagogue,
    id: "galilean-synagogue",
    recipe: "galilean-synagogue",
    culture: "north-african-west-asian",
    // Narrower than the Byzantine rule over the Levant, so it wins here.
    from: 250,
    to: 550,
    bounds: [34.9, 32.4, 35.9, 33.3],
    evidence: {
      status: "inferred",
      sources: [],
      note: "After 135 the Jewish population of Palestine was concentrated in Galilee and the Golan; the basilica synagogues of Capernaum (limestone) and Chorazin (basalt) with their triple portals facing Jerusalem date from the third to sixth centuries.",
    },
  },
  ...over(
    {
      ...synagogue,
      id: "sephardi-synagogue",
      recipe: "sephardi-synagogue",
      from: 1500,
      to: 1912,
      evidence: {
        status: "inferred",
        sources: [],
        note: "Sephardi exiles made Salonica a Jewish-majority city from the sixteenth century to 1912, and Safed a centre of learning; Djerba's Hara Kebira was a Jewish town round the Ghriba. Their synagogues stood behind walled courts, as Ottoman law required.",
      },
    },
    [22.85, 40.58, 23.0, 40.7],
    [35.45, 32.93, 35.55, 33.0],
    [10.8, 33.8, 10.9, 33.9],
  ),
  ...over(
    {
      ...synagogue,
      id: "ashkenazi-synagogue",
      recipe: "ashkenazi-synagogue",
      from: 1700,
      to: 1940,
      evidence: {
        status: "inferred",
        sources: [],
        note: "Brody and Berdychiv were Jewish-majority towns of the Polish-Lithuanian and later Austrian and Russian borderlands. Brody's fortified Great Synagogue dates from 1742; the wooden synagogues of the region had tiered roofs and painted interiors.",
      },
    },
    [25.1, 50.05, 25.2, 50.12],
    [28.55, 49.87, 28.65, 49.93],
  ),
  {
    id: "parsi-fire-temple",
    faith: "Zoroastrian",
    recipe: "parsi-fire-temple",
    labels: { small: "Agiary", medium: "Agiary", large: "Atash Behram" },
    from: 1150,
    to: 2100,
    bounds: [72.7, 20.3, 73.0, 21.0],
    side: "north",
    about:
      "The Parsi fire temple: the sacred fire brought from Iran centuries ago burns behind its screen, priests in white keep it day and night, and none but Parsis may go in.",
    forecourt: 2,
    warded: true,
    evidence: {
      status: "inferred",
      sources: [],
      note: "Parsis settled at Sanjan and then Navsari, where the priesthood had its seat; the Iranshah fire was installed at Udvada in 1742. Plain plastered agiaries, and the pillared portico with winged emblem built in the nineteenth century.",
    },
  },
];
