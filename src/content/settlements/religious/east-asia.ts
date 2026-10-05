import type { ReligiousRule } from "./types";

export const eastAsiaReligious: ReligiousRule[] = [
  {
    id: "chinese-temple",
    faith: "Buddhism",
    recipe: "chinese-temple",
    labels: { small: "Temple", medium: "Temple", large: "Great temple" },
    culture: "east-asian",
    from: 68,
    to: 2100,
    bounds: [98, 18, 124, 46],
    side: "north",
    about:
      "The Buddhist temple: its gate hall, the court where incense burns in the bronze vessel, and the main hall where the monks chant at dawn and dusk and the town comes on festival days.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "A walled compound on its axis, a gate hall, an incense burner in the court and the main hall on a stone platform under a hip-and-gable roof with swept eaves, vermilion columns, painted brackets and fish-tailed ridge ends, after Ming and Qing temples such as the Fayuan Temple in Beijing. Buddhism reached China in the first century; the earliest temples, from the White Horse Temple on, are drawn in the later form.",
    },
  },
  {
    id: "korean-temple",
    faith: "Buddhism",
    recipe: "chinese-temple",
    labels: { small: "Temple", medium: "Temple", large: "Great temple" },
    culture: "east-asian",
    from: 372,
    to: 2100,
    bounds: [124, 33, 131, 43.5],
    side: "north",
    about:
      "The Buddhist temple: its gate, the court and the main hall, a retreat in the hills as often as a temple in the town.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "Korean temple halls share the Chinese plan and swept roof; their painted dancheong brackets and gentler eaves are not yet told apart here.",
    },
  },
  {
    id: "japanese-temple",
    faith: "Buddhism",
    recipe: "japanese-temple",
    labels: { small: "Temple", medium: "Temple", large: "Great temple" },
    culture: "east-asian",
    from: 552,
    to: 2100,
    bounds: [128, 30, 146, 46],
    side: "north",
    about:
      "The Buddhist temple: the gate, stone lanterns in the court, the pagoda over its relics and the main hall, where the town's dead are remembered and its children may be taught.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "A walled compound with a gate, paired stone lanterns, a five-storeyed pagoda in the larger temples and the main hall under a deep hip-and-gable roof of grey tile, in dark timber and white plaster, after the temples of Nara and Kyoto. Buddhism came to Japan in the sixth century.",
    },
  },
];
