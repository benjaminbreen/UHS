import type { ReligiousRule } from "./types";

export const europeReligious: ReligiousRule[] = [
  {
    id: "roman-temple",
    faith: "Roman",
    recipe: "roman-temple",
    labels: { small: "Temple", medium: "Temple", large: "Capitolium" },
    culture: "european",
    from: -509,
    to: 392,
    bounds: [-10, 36, 19, 56],
    side: "north",
    about:
      "The house of a god on its podium at the head of the forum: the cult statue inside, the altar before the steps where the sacrifices are made, and the town's magistrates officiating.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "A frontal temple on a high podium with a stair, columns across the front only, follows Vitruvius and the surviving temples at Nîmes, Vienne, Rome and Pompeii. The look varies from the Tuscan temple of the Republic to the marble Corinthian of the Principate; which a town builds is a roll, not its date.",
    },
  },
  {
    id: "greek-temple",
    faith: "Greek",
    recipe: "greek-temple",
    labels: { small: "Temple", medium: "Temple", large: "Great temple" },
    culture: "european",
    from: -700,
    to: 392,
    bounds: [19, 34, 30, 42],
    side: "north",
    about:
      "The house of the city's god in its sanctuary: the image inside, the altar out in front in the open, and the city's festivals and sacrifices held between them.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "A Doric temple on a three-stepped base with a triglyph frieze follows the excavated temples of Aegina, Olympia and Athens; the peristyle running down the sides is not seen from the front.",
    },
  },
  {
    id: "romanesque-parish",
    faith: "Latin Christian",
    recipe: "parish-church",
    labels: {
      small: "Chapel",
      medium: "Parish church",
      large: "Abbey church",
    },
    culture: "european",
    from: 900,
    to: 1150,
    bounds: [-10, 36, 30, 62],
    side: "north",
    about:
      "The parish church, where people come to Mass, are baptised, married and buried, and where the bells mark the hours of the day.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "A stone church beside the market, sized to the town, follows the Romanesque parish and abbey churches of western and central Europe. One towered parish form stands in for the whole range; Romanesque and Gothic are not yet told apart.",
    },
  },
  {
    id: "gothic-parish",
    faith: "Latin Christian",
    recipe: "gothic",
    labels: {
      small: "Chapel",
      medium: "Parish church",
      large: "Great church",
    },
    culture: "european",
    from: 1150,
    to: 10001,
    bounds: [-10, 36, 30, 62],
    side: "north",
    about:
      "The parish church, where people come to Mass, are baptised, married and buried, and where the bells mark the hours of the day.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "West tower and spire, buttressed aisles, a transept rose and an apse: the parish Gothic of northern France, England and the Rhineland from the later twelfth century, kept and restored through the nineteenth. One form stands for the whole range.",
    },
  },
];
