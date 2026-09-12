import type { BeliefSystem } from "../types";

export const andes: readonly BeliefSystem[] = [
  {
    id: "andean-foragers",
    label: "Foragers and early farmers of the Andes",
    scope: { years: [-20000, -900], bounds: [-82, -40, -60, 13] },
    powers: [
      {
        name: "The ancestors",
        domain: "the lineage dead, the dead in the cave",
        rank: "paramount",
      },
      {
        name: "The hunt",
        domain: "the game, the hunting grounds",
        rank: "major",
      },
      {
        name: "The mountain",
        domain: "height, stone, the sacred peak",
        rank: "major",
      },
      {
        name: "The water",
        domain: "the river, the spring, the source",
        rank: "major",
      },
      {
        name: "The sea",
        domain: "the coast, the shellfish, the fish",
        rank: "major",
      },
      {
        name: "The spring",
        domain: "fresh water, the drinking place",
        rank: "local",
      },
      {
        name: "The field boundary",
        domain: "the stone marker, the plot",
        rank: "local",
      },
      {
        name: "The cave sanctuary",
        domain: "the rock shelter, the place of the dead",
        rank: "local",
      },
    ],
    practice: [
      "Game and shells left at the mountain and spring.",
      "Ancestors venerated in caves and at burial places.",
      "Bones painted and wrapped for secondary burial.",
      "Seasonal migrations follow the herds and fish runs.",
    ],
    specialist: "The eldest and the shaman.",
    evidence: {
      status: "hypothesis",
      claim:
        "Pre-agricultural and early agricultural societies across the Andes and coast were organized around ancestors, hunting territories, water sources, and seasonal camps.",
      sources: [
        "Lynch, 'The South American Paleo-Indians'",
        "Quilter, The Ancient Central Andes",
      ],
      limitation:
        "This entry spans 19,000 years and encompasses the entire Andean region. It is a generic summary that flattens enormous variation in actual forager and early farmer practices across different valleys, elevations, and coasts.",
    },
  },
  {
    id: "andean-regional-states",
    label: "Andean regional states and traditions",
    scope: { years: [-900, 1450], bounds: [-82, -40, -60, 13] },
    powers: [
      {
        name: "The ancestors",
        domain: "the lineage dead, the mummy bundle",
        rank: "major",
      },
      {
        name: "The apu",
        domain: "the sacred mountain, the valley guardian",
        rank: "major",
      },
      {
        name: "The water",
        domain: "the spring, the river, the source of life",
        rank: "major",
      },
      {
        name: "The herds",
        domain: "the llama and alpaca, the wealth",
        rank: "major",
      },
      {
        name: "The field",
        domain: "the terrace, the plot, the harvest",
        rank: "major",
      },
      {
        name: "The temple",
        domain: "the sacred place, the gathering site",
        rank: "local",
      },
      {
        name: "The spring shrine",
        domain: "water for irrigation and offering",
        rank: "local",
      },
      {
        name: "The boundary stone",
        domain: "the field edge, the marker, ownership",
        rank: "local",
      },
      {
        name: "The household hearth",
        domain: "fire, cooking, the family",
        rank: "local",
      },
    ],
    practice: [
      "Guinea pigs and camelids offered to mountain shrines and springs.",
      "Mummy bundles brought out during festivals and planting.",
      "Textiles woven with sacred figures as offerings.",
      "Boundary markers maintained and respected.",
    ],
    specialist: "Temple priests and curaca; family and ayllu heads.",
    evidence: {
      status: "inferred",
      claim:
        "Across the Andes for two millennia before the Inca, distinct traditions (Chavin, Moche, Nazca, Tiwanaku) shared common practices: ancestor veneration, mountain devotion, irrigation management, and textile offerings.",
      sources: [
        "Burger, Chavin and the Origins of Andean Civilization",
        "Lumbreras, The Peoples and Cultures of Ancient Peru",
        "Stanish, Ancient Andean Political Economies",
      ],
      limitation:
        "This is a schematic summary of radically different regional traditions across an enormous area. It is deliberately generic, intended to cover any place-year not already covered by a specific entry.",
    },
  },
  {
    id: "chavin-horizon",
    label: "Chavin horizon practice",
    scope: { years: [-900, -200], bounds: [-78, -12, -76, -8] },
    powers: [
      {
        name: "The fanged figure",
        domain: "transformation, creation, hidden depths",
        rank: "paramount",
      },
      { name: "The ancestors", domain: "the lineage, the dead", rank: "major" },
      {
        name: "The mountain",
        domain: "stone, height, the sacred peak",
        rank: "major",
      },
      {
        name: "The sea",
        domain: "the far coast, abundance, exchange",
        rank: "major",
      },
      { name: "The jaguar", domain: "the forest, power, fangs", rank: "major" },
      {
        name: "The spring",
        domain: "water, the source of life",
        rank: "local",
      },
      {
        name: "The field stone",
        domain: "the boundary, the marking",
        rank: "local",
      },
      {
        name: "The ancestor bundle",
        domain: "the wrapped dead of the ayllu",
        rank: "local",
      },
    ],
    practice: [
      "Coca and guinea pig given to the mountain and spring.",
      "Ancestors kept wrapped and consulted in times of need.",
      "Textiles woven with feline and serpent figures.",
      "Gatherings at the temple platform follow the agricultural calendar.",
    ],
    specialist: "Temple attendants and family elders.",
    evidence: {
      status: "hypothesis",
      claim:
        "Widespread feline imagery on Chavin pottery suggests a pan-Andean paramount power; the local spring and field stone are inferred from later documented village practice.",
      sources: [
        "Burger, Chavin and the Origins of Andean Civilization",
        "Lumbreras, The Peoples and Cultures of Ancient Peru",
      ],
      limitation:
        "No names are recovered from the Chavin period; the powers are inferred from visual evidence and later documented systems.",
    },
  },
  {
    id: "moche-coast",
    label: "Moche coastal practice",
    scope: { years: [-100, 750], bounds: [-81, -9, -78, -5] },
    powers: [
      {
        name: "The decapitator",
        domain: "war, victory, sacrifice",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "the dead lords, the lineage",
        rank: "major",
      },
      { name: "The sea", domain: "fish, shells, abundance", rank: "major" },
      {
        name: "The moon",
        domain: "night, danger, the night hunt",
        rank: "major",
      },
      {
        name: "The warrior",
        domain: "the noble dead, weapons and captives",
        rank: "major",
      },
      {
        name: "The irrigation spring",
        domain: "water for the fields",
        rank: "local",
      },
      {
        name: "The household dead",
        domain: "the ancestors of this place",
        rank: "local",
      },
      {
        name: "The boundary marker",
        domain: "land, field ownership",
        rank: "local",
      },
    ],
    practice: [
      "Captured enemy and guinea pig offered before battle.",
      "Ceramic vessels shaped as warriors filled with coca and chicha for the ancestors.",
      "Moon's phases watched for fishing and ritual timing.",
      "Fish and shellfish left at sacred spots on irrigation channels.",
    ],
    specialist: "The village lord and war priests; family elders at home.",
    evidence: {
      status: "hypothesis",
      claim:
        "The decapitator is a repeated figure on Moche ceramics; portrait vessels show ancestor veneration; the sea and moon appear throughout the pottery.",
      sources: [
        "Castillo, Moche Politics on the North Coast",
        "Quilter, The Ancient Central Andes",
      ],
      limitation:
        "Moche language does not survive; interpretation of iconography is inferential.",
    },
  },
  {
    id: "nazca-coast",
    label: "Nazca coastal practice",
    scope: { years: [-100, 750], bounds: [-76, -16, -74, -14] },
    powers: [
      {
        name: "The figure on the plain",
        domain: "the drawn lines, the sky, unseen power",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "the trophy head, the dead",
        rank: "major",
      },
      {
        name: "The sea",
        domain: "fish, whales, the waters beyond",
        rank: "major",
      },
      {
        name: "The killer whale",
        domain: "power in water, fangs, transformation",
        rank: "major",
      },
      {
        name: "The puma",
        domain: "strength, hunting, the fanged lord",
        rank: "major",
      },
      { name: "The spring", domain: "water in the dry land", rank: "local" },
      {
        name: "The trophy heads",
        domain: "the wrapped lineage dead",
        rank: "local",
      },
      {
        name: "The field boundary",
        domain: "ownership, the marked plot",
        rank: "local",
      },
    ],
    practice: [
      "Water poured on the drawn lines during the dry season.",
      "Trophy heads wrapped and kept in the family house, consulted and fed.",
      "Ceramic vessels showing killer whales and fangs broken at the spring.",
      "The lineage gathers at the great lines for star watching and rituals.",
    ],
    specialist:
      "The curaca marks the lines; family members maintain the heads.",
    evidence: {
      status: "hypothesis",
      claim:
        "Geoglyphs and textile iconography show astronomical themes; trophy head practice is attested archaeologically; killer whale and puma recur throughout the art.",
      sources: [
        "Silverman, Nazca: The Mysteries Solved",
        "Proulx, 'Nasca Textiles from the Early Intermediate Period'",
      ],
      limitation:
        "Nazca language is lost; interpretation of the geoglyphs remains debated.",
    },
  },
  {
    id: "tiwanaku-altiplano",
    label: "Tiwanaku altiplano practice",
    scope: { years: [-300, 1000], bounds: [-70, -19, -68, -15] },
    powers: [
      {
        name: "The staff god",
        domain: "the creator, the sky, the staff of order",
        rank: "paramount",
      },
      { name: "Inti", domain: "the sun, warmth, the day", rank: "major" },
      {
        name: "The ancestors",
        domain: "the wrapped dead of the ayllus",
        rank: "major",
      },
      { name: "The mountain", domain: "height, stone, the apu", rank: "major" },
      {
        name: "The lightning",
        domain: "water, fertility, the storm",
        rank: "major",
      },
      {
        name: "The lake spring",
        domain: "water for fields and herds",
        rank: "local",
      },
      {
        name: "The mummy bundle",
        domain: "the wrapped dead of the lineage",
        rank: "local",
      },
      {
        name: "The sacred stone",
        domain: "the village marker, the field edge",
        rank: "local",
      },
    ],
    practice: [
      "Potatoes and llamas left at the mountain shrine and spring.",
      "Mummy bundles brought out during planting and harvest.",
      "Textiles with geometric staff-god figures woven as offerings.",
      "The lake is circled during astronomical events.",
    ],
    specialist:
      "State priest and curaca at the temple platform; family heads at home.",
    evidence: {
      status: "inferred",
      claim:
        "The staff god dominates gateway iconography; astronomical alignments are built into the temples; mummy practices are inferred from burials and later Inca traditions.",
      sources: [
        "Janusek, Ancient Tiwanaku",
        "Stanish, Ancient Andean Political Economies",
      ],
      limitation:
        "No written records survive; beliefs are inferred from architecture and iconography.",
    },
  },
  {
    id: "inca-state",
    label: "Inca state religion",
    scope: { years: [1450, 1532], bounds: [-77, -16, -69, -8] },
    powers: [
      {
        name: "Inti",
        domain: "the sun, the king, divine order",
        rank: "paramount",
      },
      {
        name: "Viracocha",
        domain: "the creator, the transformer",
        rank: "major",
      },
      {
        name: "Mama Quilla",
        domain: "the moon, the night, protection",
        rank: "major",
        relation: { kind: "consort-of", of: "Inti" },
      },
      {
        name: "Illapa",
        domain: "the lightning, the storm, water",
        rank: "major",
      },
      {
        name: "Mama Cocha",
        domain: "the sea, the waters, abundance",
        rank: "major",
      },
      {
        name: "The royal ancestors",
        domain: "the wrapped dead kings",
        rank: "major",
      },
      {
        name: "The local apu",
        domain: "the mountain above the village",
        rank: "local",
      },
      { name: "The spring", domain: "water, the source", rank: "local" },
      {
        name: "The lineage mummies",
        domain: "the wrapped ayllu dead",
        rank: "local",
      },
    ],
    practice: [
      "Llamas, guinea pigs and woven cloth burned on the mountain shrine.",
      "The king performs the planting ceremony; the sun is called to ripen the crops.",
      "Maize beer and coca left at springs and mountain passes.",
      "Ancestors brought out during major festivals and consulted on state matters.",
    ],
    specialist: "The Sapa Inca and state priests at Cuzco.",
    afterlife:
      "The mummified king remains in Cuzco, consulted and cared for; the ordinary ancestor joins the collective mummies.",
    evidence: {
      status: "documented",
      claim:
        "Inti's paramount position and the state pantheon are attested in Spanish chronicles; the mummy bundles of kings are documented by early colonial writers.",
      sources: [
        "Cobo, Inca Religion and Customs",
        "Guaman Poma, Nueva coronica y buen gobierno",
      ],
      limitation:
        "The accounts come from Spanish observers and indigenous people writing under colonial rule.",
    },
  },
  {
    id: "inca-village",
    label: "Inca village practice",
    scope: { years: [1450, 1532], bounds: [-77, -16, -69, -8] },
    powers: [
      {
        name: "The apu",
        domain: "the mountain, the village guardian",
        rank: "major",
      },
      {
        name: "Mama Quilla",
        domain: "the moon, protection, women's matters",
        rank: "major",
      },
      {
        name: "The mallqui",
        domain: "the wrapped ancestors of the lineage",
        rank: "major",
      },
      { name: "The spring", domain: "water, fertility, life", rank: "local" },
      {
        name: "The boundary stone",
        domain: "the field edge, the marked plot, ownership",
        rank: "local",
      },
      {
        name: "The village founder",
        domain: "the first ancestor, the root of the ayllu",
        rank: "local",
      },
      {
        name: "The household hearth",
        domain: "fire, cooking, the family",
        rank: "local",
      },
    ],
    practice: [
      "Guinea pigs and llamas given to the apu before sowing and harvest.",
      "Mummies taken out and fed with maize beer and coca at festivals.",
      "Water from the spring touches the lips of every newborn.",
      "Boundary stones are kept marked and clean.",
    ],
    specialist: "The curaca and elders; household heads.",
    afterlife:
      "The body is mummified and kept in the ayllu's collective house; the mummy speaks through the curaca.",
    evidence: {
      status: "documented",
      claim:
        "The apu, the mallqui, the spring and household devotions are documented in Spanish extirpation campaigns and in later ethnographic work in Quechua communities.",
      sources: [
        "Arriaga, Extirpation of Idolatry in Peru",
        "MacCormack, 'Inca Religion and Aspects of Nature'",
      ],
      limitation:
        "Knowledge of village practice comes largely from Spanish records written while suppressing it.",
    },
  },
  {
    id: "colonial-syncretism",
    label: "Early colonial syncretic practice",
    scope: { years: [1532, 1700], bounds: [-82, -40, -60, 13] },
    powers: [
      {
        name: "God",
        domain: "the Christian God, the creator, the new paramount",
        rank: "paramount",
      },
      {
        name: "Mary",
        domain: "the mother, protection, healing, fertility",
        rank: "major",
      },
      {
        name: "The saints",
        domain: "local protectors, answerers of prayers",
        rank: "major",
      },
      {
        name: "The apu",
        domain: "the mountain, the guardian, the old power",
        rank: "major",
      },
      {
        name: "The mallqui",
        domain: "the wrapped dead of the lineage",
        rank: "major",
      },
      {
        name: "The spring",
        domain: "water, now blessed by the church",
        rank: "local",
      },
      {
        name: "The village saint",
        domain: "the Christian name placed on the old guardian",
        rank: "local",
      },
      {
        name: "The hidden mummy",
        domain: "the ancestor, kept wrapped in secret",
        rank: "local",
      },
    ],
    practice: [
      "Maize and guinea pigs offered at the church and at hidden mountain shrines.",
      "The saint's day is celebrated publicly; the apu is addressed in private.",
      "Mummies kept hidden from priests but brought out for family rites.",
      "Water from the blessed spring used for healing.",
    ],
    specialist:
      "The Catholic priest for the church; curaca and elders for hidden practices.",
    evidence: {
      status: "documented",
      claim:
        "Spanish extirpation campaigns document the coexistence of saint worship and the secret continuation of apu and mallqui cults; Catholic language and local practice intertwined.",
      sources: [
        "Arriaga, Extirpation of Idolatry in Peru",
        "Poole, 'The Procession of Our Lord of Qoyllur Riti'",
      ],
      limitation:
        "Evidence comes from Spanish accounts and indigenous confessions under pressure; the coexistence varied widely by location.",
    },
  },
  {
    id: "andean-village-modern",
    label: "Andean village practice, modern",
    scope: { years: [1700, 2025], bounds: [-82, -40, -60, 13] },
    powers: [
      {
        name: "God",
        domain: "the supreme creator, the Christian God",
        rank: "paramount",
      },
      {
        name: "The earth mother",
        domain: "fertility, crops, animals, the female power",
        rank: "major",
      },
      {
        name: "The mountain lords",
        domain: "the apu, the valley guardian",
        rank: "major",
      },
      {
        name: "Mary and the saints",
        domain: "protection, healing, local patronage",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the mallqui, counsel of the dead",
        rank: "major",
      },
      {
        name: "The spring of this place",
        domain: "water, blessing, life",
        rank: "local",
      },
      {
        name: "The field guardian",
        domain: "the boundary stone, the crop warden",
        rank: "local",
      },
      {
        name: "The household dead",
        domain: "parents and grandparents, counsel",
        rank: "local",
      },
    ],
    practice: [
      "Maize, coca and alcohol left at the mountain shrine and spring.",
      "The earth is thanked before planting and after harvest.",
      "Saints' days celebrated with feasting and processions.",
      "Healing sought from the mountain lord and saint together.",
      "Ancestors consulted in dreams and at gathering times.",
    ],
    specialist:
      "The Catholic priest for public ritual; curaca, elder women and family heads for household and village practices.",
    afterlife:
      "The body is buried in the churchyard; the ancestor spirit remains present in dreams and at sacred places.",
    evidence: {
      status: "documented",
      claim:
        "Late colonial and modern ethnographic research documents the coexistence of Catholic Christianity with devotion to earth, mountains and ancestors in Quechua and Aymara communities; this system persists in rural Andes today.",
      sources: [
        "Bastien, Mountain of the Condor",
        "Allen, The Hold Life Has",
        "Bray, The Inca and Andean Culture",
      ],
      limitation:
        "This entry spans centuries and considerable geographic variation; it is a schematic summary of thousands of distinct local practices.",
    },
  },
];
