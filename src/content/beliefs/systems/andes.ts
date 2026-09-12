import type { BeliefSystem } from "../types";

export const andes: readonly BeliefSystem[] = [
  {
    id: "andean-foragers",
    label: "Foragers and early farmers of the Andes",
    wiki: "https://en.wikipedia.org/wiki/Andean_civilizations",
    scope: { years: [-20000, -900], bounds: [-82, -40, -60, 13] },
    powers: [
      {
        name: "*Wak'a",
        gloss:
          "Proto-Quechuan *wak'a, 'a sacred place, object, or ancestor requiring reverence'",
        domain: "the lineage dead, the dead in the cave",
        rank: "paramount",
      },
      {
        name: "The hunt",
        domain: "the game, the hunting grounds",
        rank: "major",
      },
      {
        name: "*Qullu",
        gloss: "Proto-Aymaran *qullu, 'mountain'",
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
        relations: [{ kind: "serves", of: "The water" }],
      },
      {
        name: "The field boundary",
        domain: "the stone marker, the plot",
        rank: "local",
        relations: [{ kind: "serves", of: "*Qullu" }],
      },
      {
        name: "The cave sanctuary",
        domain: "the rock shelter, the place of the dead",
        rank: "local",
        relations: [{ kind: "serves", of: "*Wak'a" }],
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
        "Pre-agricultural and early agricultural societies across the Andes and coast were organized around ancestors, hunting territories, water sources, and seasonal camps. *Wak'a and *qullu are reconstructed Quechuan and Aymaran words, used here as placeholder names for the ancestor- and mountain-powers no record from this period can supply.",
      sources: [
        "Lynch, 'The South American Paleo-Indians'",
        "Quilter, The Ancient Central Andes",
        "Cerrón-Palomino, Lingüística Quechua",
      ],
      limitation:
        "This entry spans 19,000 years and encompasses the entire Andean region. No names survive from this period, and Quechuan and Aymaran are dated far later than most of this span; projecting them onto -20000 is a considerable stretch, kept only because it is the most defensible vocabulary available for the region, not because it was spoken by anyone this entry describes.",
    },
  },
  {
    id: "andean-regional-states",
    label: "Andean regional states and traditions",
    wiki: "https://en.wikipedia.org/wiki/Andean_civilizations",
    scope: { years: [-900, 1450], bounds: [-82, -40, -60, 13] },
    powers: [
      {
        name: "The ancestors",
        domain: "the lineage dead, the mummy bundle",
        rank: "major",
      },
      {
        name: "The apus",
        domain: "the sacred mountain, the valley guardian",
        rank: "major",
      },
      {
        name: "Pachamama",
        wiki: "https://en.wikipedia.org/wiki/Pachamama",
        domain: "the earth, fertility, the harvest",
        rank: "major",
      },
      {
        name: "Illapa",
        wiki: "https://en.wikipedia.org/wiki/Illapa",
        domain: "storm, lightning, water for the fields",
        rank: "major",
      },
      {
        name: "The herds",
        domain: "the llama and alpaca, the wealth",
        rank: "local",
        relations: [{ kind: "serves", of: "Pachamama" }],
      },
      {
        name: "The temple",
        domain: "the sacred place, the gathering site",
        rank: "local",
        relations: [{ kind: "serves", of: "The ancestors" }],
      },
      {
        name: "The spring shrine",
        domain: "water for irrigation and offering",
        rank: "local",
        relations: [{ kind: "serves", of: "Illapa" }],
      },
      {
        name: "The boundary stone",
        domain: "the field edge, the marker, ownership",
        rank: "local",
        relations: [{ kind: "serves", of: "The ancestors" }],
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
        "Across the Andes for two millennia before the Inca, distinct traditions (Chavin, Moche, Nazca, Tiwanaku) shared common practices: ancestor veneration, mountain devotion, irrigation management, and textile offerings. Pachamama, the apus, and Illapa are documented by name only from the Inca period onward, but the concepts of an earth-mother, mountain guardians, and a storm power run through Andean iconography well before that.",
      sources: [
        "Burger, Chavin and the Origins of Andean Civilization",
        "Lumbreras, The Peoples and Cultures of Ancient Peru",
        "Stanish, Ancient Andean Political Economies",
      ],
      limitation:
        "This is a schematic summary of radically different regional traditions across an enormous area. The names Pachamama, apu, and Illapa are Quechua terms first recorded under the Inca and applied here to older, regionally distinct practice; it is deliberately generic, intended to cover any place-year not already covered by a specific entry.",
    },
  },
  {
    id: "chavin-horizon",
    label: "Chavin horizon practice",
    wiki: "https://en.wikipedia.org/wiki/Chav%C3%ADn_culture",
    scope: { years: [-900, -200], bounds: [-78, -12, -76, -8] },
    powers: [
      {
        name: "*Pacha",
        gloss: "Proto-Aymaran *pacha, 'earth, world, time, era'",
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
      {
        name: "The jaguar",
        domain: "the forest, power, fangs",
        rank: "major",
        relations: [{ kind: "serves", of: "*Pacha" }],
      },
      {
        name: "The spring",
        domain: "water, the source of life",
        rank: "local",
        relations: [{ kind: "serves", of: "*Pacha" }],
      },
      {
        name: "The field stone",
        domain: "the boundary, the marking",
        rank: "local",
        relations: [{ kind: "serves", of: "The ancestors" }],
      },
      {
        name: "*Wak'a",
        gloss:
          "Proto-Quechuan *wak'a, 'a sacred place, object, or ancestor requiring reverence'",
        domain: "the wrapped dead of the ayllu",
        rank: "local",
        relations: [{ kind: "serves", of: "The ancestors" }],
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
        "Widespread feline imagery on Chavin pottery suggests a pan-Andean paramount power; the local spring and field stone are inferred from later documented village practice. *Pacha and *wak'a are reconstructed Aymaran and Quechuan words, used here for the fanged figure and the ancestor bundle in the absence of any recovered Chavin name.",
      sources: [
        "Burger, Chavin and the Origins of Andean Civilization",
        "Lumbreras, The Peoples and Cultures of Ancient Peru",
        "Cerrón-Palomino, Lingüística Aimara",
      ],
      limitation:
        "No names are recovered from the Chavin period; the powers are inferred from visual evidence and later documented systems. Both Quechuan and Aymaran are conventionally dated well after Chavin's -900 to -200 span, so these starred forms describe vocabulary, not a Chavin theonym.",
    },
  },
  {
    id: "moche-coast",
    label: "Moche coastal practice",
    wiki: "https://en.wikipedia.org/wiki/Moche_culture",
    scope: { years: [-100, 750], bounds: [-81, -9, -78, -5] },
    powers: [
      {
        name: "Ai Apaec",
        gloss:
          "Mochica ai apaec, roughly 'the doer, the maker' — the scholarly name given to this figure, drawn from colonial-era Mochica vocabulary",
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
        name: "Si",
        gloss:
          "Mochica-region moon deity, recorded by the colonial chronicler Calancha as more powerful than the sun",
        domain: "night, danger, the night hunt",
        rank: "major",
      },
      {
        name: "The warrior",
        domain: "the noble dead, weapons and captives",
        rank: "major",
        relations: [{ kind: "serves", of: "Ai Apaec" }],
      },
      {
        name: "The irrigation spring",
        domain: "water for the fields",
        rank: "local",
        relations: [{ kind: "serves", of: "The sea" }],
      },
      {
        name: "The household dead",
        domain: "the ancestors of this place",
        rank: "local",
        relations: [{ kind: "serves", of: "The ancestors" }],
      },
      {
        name: "The boundary marker",
        domain: "land, field ownership",
        rank: "local",
        relations: [{ kind: "serves", of: "The ancestors" }],
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
        "The decapitator is a repeated figure on Moche ceramics; portrait vessels show ancestor veneration; the sea and moon appear throughout the pottery. Mochica (Muchik), recorded in a 1644 colonial grammar, is the language most often argued for the Moche coast, and archaeologists already use 'Ai Apaec' for the decapitator figure on that basis; the colonial chronicler Calancha likewise recorded a moon deity, Si, as the region's dominant power.",
      sources: [
        "Castillo, Moche Politics on the North Coast",
        "Quilter, The Ancient Central Andes",
        "Carrera, Arte de la lengua yunga",
      ],
      limitation:
        "Moche-period language does not survive directly; Mochica is attested only from a 1644 grammar and later colonial chronicles, roughly a thousand years after Moche art was made, so Ai Apaec and Si are names retrojected across that gap rather than recovered Moche-period words.",
    },
  },
  {
    id: "nazca-coast",
    label: "Nazca coastal practice",
    wiki: "https://en.wikipedia.org/wiki/Nazca_culture",
    scope: { years: [-100, 750], bounds: [-76, -16, -74, -14] },
    powers: [
      {
        name: "*Illa",
        gloss:
          "Proto-Quechuan *illa, 'a luminous or sacred thing; a shrine-object, often linked to lightning-struck stone'",
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
        relations: [{ kind: "serves", of: "*Illa" }],
      },
      {
        name: "The puma",
        domain: "strength, hunting, the fanged lord",
        rank: "major",
        relations: [{ kind: "serves", of: "*Illa" }],
      },
      {
        name: "The spring",
        domain: "water in the dry land",
        rank: "local",
        relations: [{ kind: "serves", of: "*Illa" }],
      },
      {
        name: "*Wak'a",
        gloss:
          "Proto-Quechuan *wak'a, 'a sacred place, object, or ancestor requiring reverence'",
        domain: "the wrapped lineage dead",
        rank: "local",
        relations: [{ kind: "serves", of: "The ancestors" }],
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
        "Geoglyphs and textile iconography show astronomical themes; trophy head practice is attested archaeologically; killer whale and puma recur throughout the art. *Illa and *wak'a are reconstructed Quechuan words for a sacred, luminous shrine-object and for a venerated place or relic, used here in place of any recovered Nazca name.",
      sources: [
        "Silverman, Nazca: The Mysteries Solved",
        "Proulx, 'Nasca Textiles from the Early Intermediate Period'",
        "Cerrón-Palomino, Lingüística Quechua",
      ],
      limitation:
        "Nazca language is lost, and it is unlikely to have been Quechua at all; Puquina, sparsely attested from a single colonial catechism, is sometimes argued for the south coast but is too thinly recorded to supply a defensible word. The starred forms borrow better-documented pan-Andean vocabulary instead, which is a real substitution, not a recovery of what the Nazca themselves said.",
    },
  },
  {
    id: "tiwanaku-altiplano",
    label: "Tiwanaku altiplano practice",
    wiki: "https://en.wikipedia.org/wiki/Tiwanaku",
    scope: { years: [-300, 1000], bounds: [-70, -19, -68, -15] },
    powers: [
      {
        name: "*Pacha",
        wiki: "https://en.wikipedia.org/wiki/Gateway_of_the_Sun",
        gloss: "Proto-Aymaran *pacha, 'earth, world, time, era'",
        domain: "the creator, the sky, the staff of order",
        rank: "paramount",
      },
      {
        name: "Inti",
        wiki: "https://en.wikipedia.org/wiki/Inti",
        domain: "the sun, warmth, the day",
        rank: "major",
        relations: [{ kind: "serves", of: "*Pacha" }],
      },
      {
        name: "The apus",
        domain: "height, stone, the mountain",
        rank: "major",
      },
      {
        name: "Illapa",
        wiki: "https://en.wikipedia.org/wiki/Illapa",
        domain: "lightning, water, fertility, the storm",
        rank: "major",
        relations: [{ kind: "serves", of: "*Pacha" }],
      },
      {
        name: "The ancestors",
        domain: "the wrapped dead of the ayllus",
        rank: "major",
      },
      {
        name: "*Illa",
        gloss:
          "Proto-Quechuan *illa, 'a luminous or sacred thing; a shrine-object, often linked to springs and lightning-struck stone'",
        domain: "water for fields and herds",
        rank: "local",
        relations: [{ kind: "serves", of: "Illapa" }],
      },
      {
        name: "Mallki",
        gloss:
          "Quechua mallki, 'the wrapped ancestor' — the same term used elsewhere in this file for mummy bundles",
        domain: "the wrapped dead of the lineage",
        rank: "local",
        relations: [{ kind: "serves", of: "The ancestors" }],
      },
      {
        name: "*Wak'a",
        gloss:
          "Proto-Quechuan *wak'a, 'a sacred place, object, or ancestor requiring reverence'",
        domain: "the village marker, the field edge",
        rank: "local",
        relations: [{ kind: "serves", of: "The apus" }],
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
      status: "hypothesis",
      claim:
        "The carved figure on the Gateway of the Sun dominates Tiwanaku iconography, but no name for it survives; astronomical alignments are built into the temples; mummy practices are inferred from burials and later Inca traditions. Inti, the apus, and Illapa are Quechua/Aymara terms first recorded centuries later under the Inca and applied here to comparable Tiwanaku-era imagery, as are the reconstructed *pacha, *illa, and *wak'a used for the unnamed powers.",
      sources: [
        "Janusek, Ancient Tiwanaku",
        "Stanish, Ancient Andean Political Economies",
        "Cerrón-Palomino, Lingüística Aimara",
      ],
      limitation:
        "No written records survive; beliefs are inferred from architecture and iconography. The figure on the Gateway is never named in any surviving source and should not be read as having a recovered proper name; *pacha stands in as a word for the concept of order it seems to embody, not a theonym. Quechuan and Aymaran speakers likely arrived in the altiplano after Tiwanaku's own collapse, so every starred form here postdates the culture it is applied to.",
    },
  },
  {
    id: "inca-state",
    label: "Inca state religion",
    wiki: "https://en.wikipedia.org/wiki/Inca_religion",
    scope: { years: [1450, 1532], bounds: [-77, -16, -69, -8] },
    powers: [
      {
        name: "Inti",
        wiki: "https://en.wikipedia.org/wiki/Inti",
        domain: "the sun, the king, divine order",
        rank: "paramount",
        relations: [{ kind: "child-of", of: "Viracocha" }],
      },
      {
        name: "Viracocha",
        wiki: "https://en.wikipedia.org/wiki/Viracocha",
        domain: "the creator, the transformer",
        rank: "major",
      },
      {
        name: "Mama Quilla",
        wiki: "https://en.wikipedia.org/wiki/Mama_Killa",
        domain: "the moon, the night, protection",
        rank: "major",
        relations: [
          { kind: "consort-of", of: "Inti" },
          { kind: "child-of", of: "Viracocha" },
        ],
      },
      {
        name: "Illapa",
        wiki: "https://en.wikipedia.org/wiki/Illapa",
        domain: "the lightning, the storm, water",
        rank: "major",
        relations: [{ kind: "serves", of: "Inti" }],
      },
      {
        name: "Mama Cocha",
        wiki: "https://en.wikipedia.org/wiki/Mama_Cocha",
        domain: "the sea, the waters, abundance",
        rank: "major",
      },
      {
        name: "The royal ancestors",
        domain: "the wrapped dead kings",
        rank: "major",
        relations: [{ kind: "child-of", of: "Inti" }],
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
    wiki: "https://en.wikipedia.org/wiki/Inca_religion",
    scope: { years: [1450, 1532], bounds: [-77, -16, -69, -8] },
    powers: [
      {
        name: "Pachamama",
        wiki: "https://en.wikipedia.org/wiki/Pachamama",
        domain: "the earth, fertility, the growing crop",
        rank: "paramount",
      },
      {
        name: "The apus",
        domain: "the mountain, the village guardian",
        rank: "major",
      },
      {
        name: "Mama Cocha",
        wiki: "https://en.wikipedia.org/wiki/Mama_Cocha",
        domain: "the sea, the lake, the waters that give life",
        rank: "major",
      },
      {
        name: "Illapa",
        wiki: "https://en.wikipedia.org/wiki/Illapa",
        domain: "lightning, thunder, rain",
        rank: "major",
      },
      {
        name: "Mama Quilla",
        wiki: "https://en.wikipedia.org/wiki/Mama_Killa",
        domain: "the moon, protection, women's matters",
        rank: "major",
      },
      {
        name: "The mallquis",
        domain: "the wrapped ancestors of the lineage",
        rank: "major",
      },
      {
        name: "Supay",
        wiki: "https://en.wikipedia.org/wiki/Supay",
        domain: "the underworld, danger, mischief; placated, not courted",
        rank: "major",
      },
      {
        name: "The local huaca",
        wiki: "https://en.wikipedia.org/wiki/Huaca",
        domain: "the sacred stone or spring that marks this place",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "The apus" }],
      },
      {
        name: "The spring",
        domain: "water, fertility, life",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "Mama Cocha" }],
      },
      {
        name: "The household hearth",
        domain: "fire, cooking, the family",
        rank: "local",
        relations: [{ kind: "serves", of: "Pachamama" }],
      },
    ],
    practice: [
      "Guinea pigs and llamas given to the apu and Pachamama before sowing and harvest.",
      "Mummies taken out and fed with maize beer and coca at festivals.",
      "Water from the spring touches the lips of every newborn.",
      "The local huaca is kept clean and fed; travelers leave coca and a stone at its base.",
      "Supay is not worshipped but placated, so he leaves the sick and the harvest alone.",
    ],
    specialist: "The curaca and elders; household heads.",
    afterlife:
      "The body is mummified and kept in the ayllu's collective house; the mallqui speaks through the curaca.",
    evidence: {
      status: "documented",
      claim:
        "Pachamama, the apus, Mama Cocha, Illapa, Supay, and the mallquis are all documented in Spanish extirpation campaigns and in later ethnographic work in Quechua communities; the huaca as a category of sacred place or object is likewise well attested.",
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
    wiki: "https://en.wikipedia.org/wiki/Extirpation_of_idolatry",
    scope: { years: [1532, 1700], bounds: [-82, -40, -60, 13] },
    powers: [
      {
        name: "God",
        domain: "the Christian God, the creator, the new paramount",
        rank: "paramount",
      },
      {
        name: "The Virgin of Copacabana",
        wiki: "https://en.wikipedia.org/wiki/Virgin_of_Copacabana",
        domain: "the mother, protection, healing, fertility",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
      },
      {
        name: "The saints",
        domain: "local protectors, answerers of prayers",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
      },
      {
        name: "Pachamama",
        wiki: "https://en.wikipedia.org/wiki/Pachamama",
        domain: "the earth, the old power beneath the new",
        rank: "major",
      },
      {
        name: "The apus",
        domain: "the mountain, the guardian, the old power",
        rank: "major",
      },
      {
        name: "The mallquis",
        domain: "the wrapped dead of the lineage",
        rank: "major",
      },
      {
        name: "El Tío",
        wiki: "https://en.wikipedia.org/wiki/El_T%C3%ADo",
        domain: "the lord of the mine, danger and wealth underground",
        rank: "major",
      },
      {
        name: "The spring",
        domain: "water, now blessed by the church",
        rank: "local",
        relations: [{ kind: "serves", of: "God" }],
      },
      {
        name: "The village saint",
        domain: "the Christian name placed on the old guardian",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "The saints" }],
      },
      {
        name: "The hidden mallqui",
        domain: "the ancestor, kept wrapped in secret",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "The mallquis" }],
      },
    ],
    practice: [
      "Maize and guinea pigs offered at the church and at hidden mountain shrines.",
      "The saint's day is celebrated publicly; the apu and Pachamama are addressed in private.",
      "Mummies kept hidden from priests but brought out for family rites.",
      "Water from the blessed spring used for healing.",
      "Miners entering the shaft leave coca and alcohol for El Tío, who rules underground where the church has no authority.",
    ],
    specialist:
      "The Catholic priest for the church; curaca and elders for hidden practices; miners tend El Tío's shrine themselves.",
    evidence: {
      status: "documented",
      claim:
        "Spanish extirpation campaigns document the coexistence of saint worship (including the early cult of the Virgin of Copacabana, established 1583) and the secret continuation of Pachamama, apu, and mallqui cults; the mine spirit later called El Tío has roots in colonial Potosí, where forced indigenous labor under Spanish overseers gave the deep shaft its own dangerous lord.",
      sources: [
        "Arriaga, Extirpation of Idolatry in Peru",
        "Poole, 'The Procession of Our Lord of Qoyllur Riti'",
        "Nash, We Eat the Mines and the Mines Eat Us",
      ],
      limitation:
        "Evidence comes from Spanish accounts and indigenous confessions under pressure; the coexistence varied widely by location, and El Tío's cult is best documented from mining communities specifically rather than the Andes generally.",
    },
  },
  {
    id: "andean-village-modern",
    label: "Andean village practice, modern",
    wiki: "https://en.wikipedia.org/wiki/Andean_civilizations",
    scope: { years: [1700, 2025], bounds: [-82, -40, -60, 13] },
    powers: [
      {
        name: "God",
        domain: "the supreme creator, the Christian God",
        rank: "paramount",
      },
      {
        name: "Pachamama",
        wiki: "https://en.wikipedia.org/wiki/Pachamama",
        domain: "fertility, crops, animals, the female earth power",
        rank: "major",
      },
      {
        name: "The apus",
        domain: "the mountain lords, the valley guardian",
        rank: "major",
      },
      {
        name: "Mary and the Virgin of Copacabana",
        wiki: "https://en.wikipedia.org/wiki/Virgin_of_Copacabana",
        domain: "protection, healing, local patronage",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
      },
      {
        name: "The mallquis",
        domain: "the ancestors, counsel of the dead",
        rank: "major",
      },
      {
        name: "Ekeko",
        wiki: "https://en.wikipedia.org/wiki/Ekeko",
        domain: "household abundance, luck, wishes carried in miniature",
        rank: "local",
      },
      {
        name: "The spring of this place",
        domain: "water, blessing, life",
        rank: "local",
        relations: [{ kind: "serves", of: "God" }],
      },
      {
        name: "The field guardian",
        domain: "the boundary stone, the crop warden",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "The apus" }],
      },
      {
        name: "The household dead",
        domain: "parents and grandparents, counsel",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "The mallquis" }],
      },
    ],
    practice: [
      "Maize, coca and alcohol left at the mountain shrine and spring.",
      "Pachamama is thanked before planting and after harvest, often with a poured libation on the ground.",
      "Saints' days celebrated with feasting and processions.",
      "Healing sought from the mountain lord and saint together.",
      "At Alasitas, miniature goods are bought for Ekeko so he brings the real thing within the year.",
    ],
    specialist:
      "The Catholic priest for public ritual; curaca, elder women and family heads for household and village practices.",
    afterlife:
      "The body is buried in the churchyard; the ancestor spirit remains present in dreams and at sacred places.",
    evidence: {
      status: "documented",
      claim:
        "Late colonial and modern ethnographic research documents the coexistence of Catholic Christianity with devotion to Pachamama, the apus, the Virgin of Copacabana, and the mallquis in Quechua and Aymara communities; Ekeko and the Alasitas fair are documented nineteenth- and twentieth-century Aymara traditions centered on La Paz and now practiced across the Bolivian highlands.",
      sources: [
        "Bastien, Mountain of the Condor",
        "Allen, The Hold Life Has",
        "Bray, The Inca and Andean Culture",
      ],
      limitation:
        "This entry spans centuries and considerable geographic variation; it is a schematic summary of thousands of distinct local practices, and Ekeko in particular is most strongly attested for the La Paz region rather than the whole Andes.",
    },
  },
];
