import type { ReligiousRule } from "./types";

/** Latin Christendom: the west, then Hungary, Poland and Transylvania, then
 * Lithuania and Livonia. Greece, the Balkans east of the Drina and Rus are
 * Orthodox (orthodox.ts). */
const latin = [
  [-10, 36, 19, 62],
  [19, 45.5, 24.5, 62],
  [24.5, 54, 28.5, 62],
] as const;
const inLatin = (rule: Omit<ReligiousRule, "bounds">): ReligiousRule[] => latin.map((bounds) => ({ ...rule, bounds }));

export const europeReligious: ReligiousRule[] = [
  ...([
    ["london-mosque", "Islam", "Mosque", "euro-london-0-urban-hall", "People leave their shoes at the door. The prayer rows face the niche in the far wall."],
    ["london-synagogue", "Jewish", "Synagogue", "euro-london-1-urban-row", "The congregation gathers around the reading desk. The Torah scrolls are kept in the ark."],
    ["london-mandir", "Hindu", "Mandir", "euro-london-2-urban-wide", "Families bring flowers to the shrine. There is room to sit together for the singing."],
    ["london-gurdwara", "Sikh", "Gurdwara", "euro-london-0-urban-wide", "The Guru Granth Sahib rests under a canopy. Volunteers cook and serve a meal in the next room."],
  ] as const).map(([id, faith, label, recipe, about]): ReligiousRule => ({
    id, faith, recipe,
    labels: {small:label, medium:label, large:label}, about, congregationOnly:true,
    from:2016, to:2026, bounds:[-.52,51.28,.34,51.70], side:"north", forecourt:1,
    evidence:{status:"inferred",sources:["https://historicengland.org.uk/images-books/publications/changing-london-6/changinglondon-6/"],
      note:"An adapted street building represents a neighbourhood congregation in the period covered by the London population profile."},
  })),
  {
    id:"anglican-parish", faith:"Anglican", offices:["Priest"], recipe:"gothic",
    labels:{small:"Chapel",medium:"Parish church",large:"Parish church"},
    from:1900, to:2100, bounds:[-1.5,50.8,1.45,52.1], side:"north", forecourt:2,
    about:"The parish gathers here for Sunday worship, weddings and funerals.",
    evidence:{status:"inferred",sources:["https://www.churchofengland.org/"],note:"An Anglican parish in southeast England. The Gothic building represents one congregation."},
  },
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
  ...inLatin({
    id: "romanesque-parish",
    neighborhoodHouse: "Parish church",
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
    side: "north",
    about:
      "The parish church, where people come to Mass, are baptised, married and buried, and where the bells mark the hours of the day.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "A stone church beside the market, sized to the town, follows the Romanesque parish and abbey churches of western and central Europe. One towered parish form stands in for the whole range; Romanesque and Gothic are not yet told apart.",
    },
  }),
  ...inLatin({
    id: "gothic-parish",
    neighborhoodHouse: "Parish church",
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
    side: "north",
    about:
      "The parish church, where people come to Mass, are baptised, married and buried, and where the bells mark the hours of the day.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "West tower and spire, buttressed aisles, a transept rose and an apse: the parish Gothic of northern France, England and the Rhineland from the later twelfth century, kept and restored through the nineteenth. One form stands for the whole range.",
    },
  }),
];
