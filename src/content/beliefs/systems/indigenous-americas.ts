import type { BeliefSystem } from "../types";

export const indigenousAmericas: readonly BeliefSystem[] = [
  // ERA FLOOR LAYERS: wide geographic and temporal scope to ensure coverage

  {
    id: "paleoindian-americas",
    label: "Paleoindian and Archaic forager practice",
    scope: { years: [-13000, -1500], bounds: [-170, -56, -32, 83] },
    powers: [
      {
        name: "The animals",
        domain: "hunted and gathered species, their presence and abundance",
        rank: "paramount",
      },
      {
        name: "*Axkyi",
        gloss: "Proto-Algonquian *axkyi, 'earth, land'",
        domain: "passage, shelter, water sources, sacred places",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the first people, guidance, continuity",
        rank: "major",
      },
      {
        name: "*Nepyi",
        gloss: "Proto-Algonquian *nepyi, 'water'",
        domain: "rivers and coasts, fish, crossing, cleansing",
        rank: "major",
      },
      {
        name: "*Eškwote·wi",
        gloss: "Proto-Algonquian *eškwote·wi, 'fire'",
        domain: "warmth, cooking, gathering, protection",
        rank: "local",
      },
      {
        name: "*Ki·ži·kwi",
        gloss: "Proto-Algonquian *ki·ži·kwi, 'sky, sun, day'",
        domain: "direction, time, movement of animals",
        rank: "local",
      },
      {
        name: "The sacred peak or cave",
        domain: "local power, ritual place, vision",
        rank: "local",
      },
    ],
    practice: [
      "First kill and first gather offerings made at the site.",
      "Ochre and pigment used in burial and ceremony.",
      "Seasonal gathering at resource-rich locations.",
      "Careful use of fire to influence landscape and hunt.",
      "Sacred places visited for ritual and vision.",
    ],
    evidence: {
      status: "hypothesis",
      claim:
        "Archaeological sites spanning 13,000 years show consistent patterns: ritual ochre use, deliberate tool and bone placement at burials, site reuse suggesting seasonal rounds, and evidence of fire management across diverse environments.",
      sources: [
        "Dillehay, The Settlement of the Americas",
        "Byers, Early Holocene Occupations in the Americas",
        "Boyd, The Coming of the Spirit of Pestilence",
        'Goddard, "Handbook of North American Indians, Vol. 17: Languages" (Proto-Algonquian)',
        "Hewson, A Computer-Generated Dictionary of Proto-Algonquian",
      ],
      limitation:
        "No written records; practices are inferred from artifact distributions, settlement patterns, and burial contexts across vast time and geography, and this represents broad patterns among many distinct populations with their own local practices. The starred forms are Proto-Algonquian reconstructions, a language stage dated to roughly 3,000 years ago at most — thousands of years after this floor layer's horizon closes. No family reaches back 13,000 years, so these words stand in for a Paleoindian vocabulary that is simply gone; a reconstructed word for 'earth' or 'fire' is not evidence that Paleoindian people used it, or worshipped an earth-power or fire-power by that name.",
    },
  },

  {
    id: "early-farming-americas",
    label: "Early agricultural Americas practice",
    scope: { years: [-1500, -500], bounds: [-170, -56, -32, 83] },
    powers: [
      {
        name: "Corn or seeds",
        domain: "cultivation, fertility, life",
        rank: "paramount",
      },
      {
        name: "*Tïpa",
        gloss: "Proto-Uto-Aztecan *tïpa, 'earth, ground' (provisional)",
        domain: "fields, shelter, water, the place itself",
        rank: "major",
      },
      {
        name: "The wild animals",
        domain: "hunted species, respect in taking",
        rank: "major",
      },
      {
        name: "*Tata",
        gloss: "Proto-Uto-Aztecan *tata, 'father, elder male'",
        domain: "the people who came before, guidance",
        rank: "major",
      },
      {
        name: "The fire",
        domain: "clearing land, cooking, community",
        rank: "local",
      },
      {
        name: "*Pa",
        gloss: "Proto-Uto-Aztecan *pa, 'water'",
        domain: "river or spring, irrigation, renewal",
        rank: "local",
      },
      {
        name: "The sacred place",
        domain: "local shrine, village center, protection",
        rank: "local",
      },
    ],
    practice: [
      "First harvest offerings and communal celebration.",
      "Seasonal burning of fields and forest.",
      "Ritual payment to the land before clearing.",
      "Gathering of wild foods alongside farming.",
      "Ceremonies at planting and harvest.",
    ],
    evidence: {
      status: "hypothesis",
      claim:
        "Archaeological evidence from Mesoamerica, eastern North America, Amazonia, and the Andes shows the gradual adoption of domesticated plants (maize, beans, squash, root crops) between 2000 and 500 years ago, with persistent reliance on wild foods and modified fire use to expand productive zones.",
      sources: [
        "Smith, The Emergence of Agriculture",
        "Pearsall, Paleoethnobotany: A Handbook of Procedures",
        "Roosevelt, Moundbuilders of the Amazon",
        'Miller, "Uto-Aztecan Cognate Sets", IJAL',
        "Stubbs, Uto-Aztecan: A Comparative Vocabulary",
      ],
      limitation:
        "Practices varied enormously by region and climate; this is a general summary of the transition zone between hunting and farming, applicable across the Americas, and Uto-Aztecan speakers occupied only one corner of it. The starred forms are comparative reconstructions of vocabulary, not recovered theonyms: nobody is recorded speaking them, and a word for 'water' is not evidence of a water god by that name. Maize itself has no inherited Proto-Uto-Aztecan term, so the staple crop is left undescribed rather than forced into a reconstruction it does not have.",
    },
  },

  {
    id: "middle-period-americas",
    label: "Middle period Americas practice",
    wiki: "https://en.wikipedia.org/wiki/Viracocha",
    scope: { years: [-500, 1200], bounds: [-170, -56, -32, 83] },
    powers: [
      {
        name: "Corn or the staple crop",
        domain: "life, fertility, the sacred plant",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "the village dead, continuity, power",
        rank: "major",
      },
      {
        name: "Viracocha",
        wiki: "https://en.wikipedia.org/wiki/Viracocha",
        domain: "creation, the civilizing order, the sacred center",
        rank: "major",
      },
      {
        name: "*Úni",
        gloss: "Proto-Arawakan *úni, 'water'",
        domain: "rivers, springs, rain, abundance",
        rank: "major",
      },
      {
        name: "The wild animals",
        domain: "hunted species, respect and reciprocity",
        rank: "local",
      },
      {
        name: "The hearth fire",
        domain: "family, home, protection",
        rank: "local",
      },
      {
        name: "The earth",
        domain: "fields, foundation, mother",
        rank: "local",
      },
    ],
    practice: [
      "Planting and harvest ceremonies with offerings.",
      "Sacred fires kept burning at community centers.",
      "Offerings to ancestors at graves and shrines.",
      "Vision quests and dream-seeking for guidance.",
      "First-fruits and first-kill dedicated to powers.",
      "Seasonal gathering and feasting.",
    ],
    specialist: "Elders and healers who maintain the traditions",
    afterlife:
      "Ancestors join the spirit world but remain present and influential in the village.",
    evidence: {
      status: "hypothesis",
      claim:
        "Archaeological evidence from across the Americas shows the development of stable farming villages, ceremonial centers, and complex social organization. Ethnographic and historical accounts document the persistence of these practices into the contact period; Viracocha, the creator god of the pre-Inca and Inca Andes, is one well-documented example of a civilizing power tied to a sacred center in this era.",
      sources: [
        "Silverberg, Mound Builders of Ancient America",
        "Hodge, The Handbook of American Indians North of Mexico",
        "Lévi-Strauss, The Raw and the Cooked",
        "Aikhenvald, The Arawak Language Family",
        "Payne, A Classification of Maipuran Arawakan Languages",
      ],
      limitation:
        "Practices varied widely across regions and centuries; this is a middle-range summary applicable to the agricultural Americas from 500 BCE through the first centuries of the Common Era and beyond, and Arawakan speech covered only its Caribbean and lowland South American corner of that range. The starred form is a comparative reconstruction of vocabulary, not a recovered theonym: nobody is recorded speaking it, and a word for 'water' is not evidence of a water god by that name.",
    },
  },

  {
    id: "early-complex-americas",
    label: "Early complex societies practice",
    wiki: "https://en.wikipedia.org/wiki/Chiefdom",
    scope: { years: [1200, 1500], bounds: [-170, -56, -32, 83] },
    powers: [
      {
        name: "The paramount chief or king",
        domain: "order, authority, the cosmos",
        rank: "paramount",
      },
      {
        name: "The staple crop",
        domain: "life and fertility, state provision",
        rank: "major",
      },
      {
        name: "Naymlap",
        wiki: "https://en.wikipedia.org/wiki/Naymlap",
        domain: "the founding king, dynastic legitimacy",
        rank: "major",
      },
      {
        name: "The sacred center",
        domain: "the capital, the cosmos, government",
        rank: "major",
      },
      {
        name: "*Úni",
        gloss: "Proto-Arawakan *úni, 'water'",
        domain: "trade, travel, abundance",
        rank: "local",
      },
      {
        name: "The village territory",
        domain: "fields, forests, protection",
        rank: "local",
      },
      {
        name: "The household ancestors",
        domain: "family continuity and blessing",
        rank: "local",
      },
    ],
    practice: [
      "Feasts and gatherings to redistribute wealth and honor.",
      "Tribute and tax paid to the center.",
      "Ceremonies marking the chief's access to power.",
      "Pilgrimages to sacred sites.",
      "War and alliance-making for regional control.",
    ],
    specialist: "Priests and nobles who serve the paramount authority",
    afterlife:
      "Honored dead ascend to the spirit realm; ancestors of chiefs remain powerful.",
    evidence: {
      status: "hypothesis",
      claim:
        "Archaeological evidence from Mississippian centers, Ancestral Puebloan towns, northern Andean chiefdoms, and Caribbean polities shows the emergence of hierarchical societies with chiefly authority, monumental architecture, and differential burials. Naymlap, the legendary founding king of the Lambayeque dynasty on Peru's north coast, is one well-documented example of the dynastic founder figures such societies produced.",
      sources: [
        "Peregrine, Mississippian Evolution of Chiefdoms",
        "Drennan & Peterson, Prehispanic Chiefdoms in the Americas",
        "Whitmore & Turner, Collapsed Civilizations",
        "Aikhenvald, The Arawak Language Family",
      ],
      limitation:
        "This describes the general pattern of early complex societies and does not represent any specific regional tradition in detail; the Arawakan-speaking chiefdoms of the Caribbean are only one strand of it. The starred form is a comparative reconstruction of vocabulary, not a recovered theonym: nobody is recorded speaking it, and a word for 'water' is not evidence of a water god by that name.",
    },
  },

  {
    id: "historic-contact-americas",
    label: "Historic Americas practice at contact",
    wiki: "https://en.wikipedia.org/wiki/Indigenous_peoples_of_the_Americas",
    scope: { years: [1500, 1901], bounds: [-170, -56, -32, 83] },
    powers: [
      {
        name: "The ancestors",
        domain: "the people's dead, power, continuity, land claim",
        rank: "paramount",
      },
      {
        name: "*Tïpa",
        gloss: "Proto-Uto-Aztecan *tïpa, 'earth, ground' (provisional)",
        domain: "home territory, sustenance, sacred geography",
        rank: "major",
      },
      {
        name: "The staple food",
        domain: "life, fertility, sacred substance",
        rank: "major",
      },
      {
        name: "Coyote",
        wiki: "https://en.wikipedia.org/wiki/Coyote_(mythology)",
        domain: "the trickster and culture hero, in dozens of local forms",
        rank: "major",
      },
      {
        name: "The fire",
        domain: "home, gathering, purification",
        rank: "local",
      },
      {
        name: "The hunted or gathered animal",
        domain: "food, respect, reciprocity",
        rank: "local",
      },
      {
        name: "*Tata",
        gloss: "Proto-Uto-Aztecan *tata, 'father, elder male'",
        domain: "medicine, wisdom, guidance",
        rank: "local",
      },
      {
        name: "Pachamama",
        wiki: "https://en.wikipedia.org/wiki/Pachamama",
        domain: "the earth mother, fertility, provision",
        rank: "local",
      },
    ],
    practice: [
      "Offerings made before hunting, gathering, and planting.",
      "Ceremonies at seasonal transitions.",
      "Dreams and visions sought for guidance.",
      "First-fruits and first-kills given to the land or spirits.",
      "Healing ceremonies and purification rituals.",
      "Gatherings for feasting, storytelling, and alliance.",
    ],
    specialist:
      "Healers, shamans, elders, and ceremonial leaders who maintain the traditions",
    afterlife:
      "Souls travel to the ancestors; the dead remain present and influential.",
    evidence: {
      status: "hypothesis",
      claim:
        "Historical accounts, ethnographic records, and oral traditions from contact onward document the religious practices of hundreds of distinct indigenous nations across the Americas, from the Arctic to Patagonia. Coyote and Pachamama are given here as widely attested, well-documented examples of a trickster/culture-hero figure and an earth-mother figure respectively; each nation had, and many still have, their own names and figures.",
      sources: [
        "Sturtevant, Handbook of North American Indians",
        "Urton, The Inca of South America",
        "Hemming, The Search for El Dorado",
        'Miller, "Uto-Aztecan Cognate Sets", IJAL',
        "Stubbs, Uto-Aztecan: A Comparative Vocabulary",
      ],
      limitation:
        "This summarizes broad patterns shared across many nations and time periods; every community had distinct practices, and these traditions continue to evolve today. The starred forms are Proto-Uto-Aztecan reconstructions of vocabulary, not recovered theonyms, and Uto-Aztecan speech covered only the Southwest, Mesoamerica, and the Great Basin corner of this hemispheric layer; a word for 'earth' is not evidence of an earth god by that name.",
    },
  },

  // ANCESTRAL PUEBLOAN AND SOUTHWEST (keeping and refining existing)

  {
    id: "southwest-early-foragers",
    label: "Southwest early forager and farmer practice",
    scope: { years: [-2000, 100], bounds: [-115, 28, -103, 37] },
    powers: [
      {
        name: "The seasonal plants",
        domain: "agave, seeds, roots, abundance by season",
        rank: "paramount",
      },
      {
        name: "*Tïpa",
        gloss: "Proto-Uto-Aztecan *tïpa, 'earth, ground' (provisional)",
        domain: "shelter, water sources, sacred peaks",
        rank: "major",
      },
      {
        name: "*Tata",
        gloss: "Proto-Uto-Aztecan *tata, 'father, elder male'",
        domain: "the first people, guidance",
        rank: "major",
      },
      {
        name: "The fire",
        domain: "cooking, clearing, protection",
        rank: "local",
      },
      {
        name: "*Pa",
        gloss: "Proto-Uto-Aztecan *pa, 'water'",
        domain: "river or spring, life, purity",
        rank: "local",
      },
      {
        name: "The animals",
        domain: "game, respect, reciprocity",
        rank: "local",
      },
    ],
    practice: [
      "Seasonal rounds following plant and animal abundance.",
      "Roasting pits for processing agave and seeds.",
      "Ochre used in burial and ceremony.",
      "Gathering at water sources.",
      "Early cultivation of maize alongside wild foods.",
    ],
    evidence: {
      status: "hypothesis",
      claim:
        "Archaic Period sites in the Southwest show long-term occupation, processing equipment for seeds and tubers, and gradual adoption of maize agriculture from 2000 BCE onward.",
      sources: [
        "Wilcox, Pueblo Period Population History",
        "Minnis, Social Adaptations to Food Stress in the Prehistoric American Southwest",
        'Miller, "Uto-Aztecan Cognate Sets", IJAL',
        "Stubbs, Uto-Aztecan: A Comparative Vocabulary",
      ],
      limitation:
        "Evidence is sparse and unevenly distributed; this represents the broad pattern of forager-farmers in the Southwest. The starred forms are comparative reconstructions of vocabulary, not recovered theonyms: nobody is recorded speaking them, and a word for 'water' is not evidence of a water god by that name.",
    },
  },

  {
    id: "ancestral-puebloan",
    label: "Ancestral Puebloan practice",
    wiki: "https://en.wikipedia.org/wiki/Ancestral_Puebloans",
    scope: { years: [100, 1450], bounds: [-115, 27, -101, 37] },
    powers: [
      {
        name: "Iyatiku",
        wiki: "https://en.wikipedia.org/wiki/Iyatiku",
        domain: "corn, fertility, the harvest, creation",
        rank: "paramount",
      },
      {
        name: "Katsinas",
        wiki: "https://en.wikipedia.org/wiki/Kachina",
        domain: "rain, crops, the ancestor spirits who return",
        rank: "major",
      },
      {
        name: "Tawa",
        domain: "the sun, time, the calendar",
        rank: "major",
      },
      {
        name: "Masauwu",
        domain: "the earth, death, fire, guardianship of this world",
        rank: "major",
      },
      {
        name: "Badger",
        domain: "the hunt, protection of the south",
        rank: "local",
        relation: { kind: "serves", of: "Katsinas" },
      },
      {
        name: "The household hearth",
        domain: "cooking, family protection, the home",
        rank: "local",
      },
      {
        name: "The kiva pit",
        domain: "the underworld emergence, ceremony",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the pueblo's dead, continuity",
        rank: "local",
      },
    ],
    practice: [
      "Katsina dances at solstices and planting.",
      "Corn pollen sprinkled on altars and prayers.",
      "Kivas used for male initiation and ceremony.",
      "Prayer sticks left at shrines and mountain springs.",
      "Fasting before the hunt and the harvest.",
    ],
    specialist: "Kivas societies for initiation; elders for prayer",
    afterlife:
      "The spirits of the dead join the katsinas and return in rain and fertility.",
    evidence: {
      status: "inferred",
      claim:
        "Katsina veneration is documented in historic Pueblo practice and in the archaeological record of kivas, prayer sticks, and katsina figurines from Chaco and Mesa Verde phases. Corn agriculture structures Puebloan cosmology, and named figures such as Keresan Iyatiku, Hopi Tawa, and Hopi Masauwu are recorded in documented ethnography and projected back to earlier Puebloan practice.",
      sources: [
        "Nabokov & Wall, Tiwa Indians of the Rio Grande",
        "Ortiz, The Tewa World",
        "Adams, The Blue House People",
      ],
      limitation:
        "Most details come from 19th- and 20th-century ethnography and are projected back to Ancestral Puebloan times. This is a general summary for Puebloan cosmology and not the practice of any specific pueblo today.",
    },
  },

  // CALIFORNIA (new entries)

  {
    id: "california-foragers",
    label: "California forager and early farmer practice",
    scope: { years: [-8000, 1500], bounds: [-125, 32, -114, 42] },
    powers: [
      {
        name: "The oak trees",
        domain: "acorns, mast, abundance, sacred groves",
        rank: "paramount",
      },
      {
        name: "The salmon and fish",
        domain: "rivers, spawning runs, abundance",
        rank: "major",
      },
      {
        name: "The land",
        domain: "territory, home, sacred places",
        rank: "major",
      },
      {
        name: "*ʔUuti",
        gloss: "Proto-Utian (Miwok-Costanoan) *ʔuuti, 'person, people'",
        domain: "the people before, guidance, land claim",
        rank: "major",
      },
      {
        name: "The fire",
        domain: "burning groves, cooking, protection",
        rank: "local",
      },
      {
        name: "The seeds and roots",
        domain: "gathered foods, seasonal abundance",
        rank: "local",
      },
      {
        name: "The mountains or coastal rocks",
        domain: "sacred places, shelter, water",
        rank: "local",
      },
    ],
    practice: [
      "Regular burning of oak groves to increase acorn yield.",
      "Weirs and traps for salmon and fish.",
      "Acorn gathering and processing by women.",
      "Seasonal encampments at resource-rich sites.",
      "Trading of shell beads and dried fish.",
      "Cremation of the dead to release the spirit.",
    ],
    specialist: "Elders who direct burning and gathering; healers",
    afterlife:
      "Spirits of the dead travel; the cremation releases them to join the ancestors.",
    evidence: {
      status: "hypothesis",
      claim:
        "Archaeological evidence shows 10,000 years of intensive harvesting and burning management of California oak woodlands and riparian zones. Ethnographic accounts by Powers, Barrett, and others document the continuity of these practices into the 19th and 20th centuries.",
      sources: [
        "Boyd, The Coming of the Spirit of Pestilence",
        "Peacock & Turner, Just Below the Surface",
        "Anderson, Tending the Wild",
        'Callaghan, "Evidence for Yok-Utian", IJAL',
      ],
      limitation:
        "This is a general summary across California's diverse language groups and regions, from the coast to the interior valley and mountains, and each nation had distinct practices. The starred form is a comparative reconstruction of vocabulary, not a recovered theonym: nobody is recorded speaking it, and a word for 'people' is not evidence of an ancestor cult by that name. Utian itself, the family name Callaghan gave this Miwok-Costanoan grouping, comes from this same reconstructed word.",
    },
  },

  {
    id: "california-coast-maritime",
    label: "California coast maritime practice",
    scope: { years: [-3000, 1500], bounds: [-125, 32, -117, 42] },
    powers: [
      {
        name: "*Xa",
        gloss: "Proto-Yuman *xa, 'water'",
        domain: "fish, kelp, seals, shellfish",
        rank: "paramount",
      },
      {
        name: "The islands",
        domain: "sacred places, refuge, sea mammal hunting",
        rank: "major",
      },
      {
        name: "The salmon rivers",
        domain: "seasonal runs, abundance, fresh water",
        rank: "major",
      },
      {
        name: "*ʔIipaa",
        gloss: "Proto-Yuman *ʔiipaa, 'person, people'",
        domain: "the sea people, protection",
        rank: "major",
      },
      {
        name: "The shell and bone",
        domain: "tools, ornaments, exchange",
        rank: "local",
      },
      {
        name: "The canoe or plank boat",
        domain: "travel, trade, hunting at sea",
        rank: "local",
      },
      {
        name: "The fire",
        domain: "cooking, warmth, home",
        rank: "local",
      },
    ],
    practice: [
      "Offshore hunting of seals and sea lions with harpoons.",
      "Diving for abalone and sea urchins.",
      "Harvesting of kelp and processing of fish.",
      "Exchange of shell beads and dried fish for inland goods.",
      "Ceremonies at spring and at the return of salmon.",
      "Cremation with shell and bone offerings.",
    ],
    specialist: "Skilled harpooners and boat builders; elders",
    afterlife:
      "Spirits of the sea people return to the islands and the depths.",
    evidence: {
      status: "hypothesis",
      claim:
        "Coastal middens and shell mounds show 3000+ years of marine resource exploitation. Ethnographic accounts document the sophistication of plank-boat construction, harpoon hunting, and maritime trading networks.",
      sources: [
        "Erlandson, The Archaeology of Aquatic Adaptations",
        "Boyd, The Coming of the Spirit of Pestilence",
        "Lightfoot & Parrish, California Indians and Their Environment",
        "Wares, A Comparative Study of Yuman Consonantism",
      ],
      limitation:
        "This is a summary of California coastal maritime societies and does not represent any single nation's specific practice; Yuman speech fits its southern reach best. The starred forms are comparative reconstructions of vocabulary, not recovered theonyms: nobody is recorded speaking them, and a word for 'water' is not evidence of a sea god by that name.",
    },
  },

  // GREAT BASIN (new entry)

  {
    id: "great-basin-foragers",
    label: "Great Basin forager practice",
    scope: { years: [-8000, 1500], bounds: [-120, 34, -112, 43] },
    powers: [
      {
        name: "The seeds and roots",
        domain: "gathered staples, abundance, survival",
        rank: "paramount",
      },
      {
        name: "*Pa",
        gloss: "Proto-Uto-Aztecan *pa, 'water'",
        domain: "water, sacred places, travel",
        rank: "major",
      },
      {
        name: "*Tïpa",
        gloss: "Proto-Uto-Aztecan *tïpa, 'earth, ground' (provisional)",
        domain: "territory, home, resources",
        rank: "major",
      },
      {
        name: "*Tata",
        gloss: "Proto-Uto-Aztecan *tata, 'father, elder male'",
        domain: "the first people, guidance",
        rank: "major",
      },
      {
        name: "The fire",
        domain: "cooking, warmth, signaling",
        rank: "local",
      },
      {
        name: "The animals",
        domain: "rabbits, deer, bighorn, hunted game",
        rank: "local",
      },
      {
        name: "The seasonal lakes",
        domain: "fish and waterfowl, abundance in season",
        rank: "local",
      },
    ],
    practice: [
      "Seasonal rounds following seed and water abundance.",
      "Intensive harvesting and storage of seeds.",
      "Cooperative rabbit hunts with nets and clubs.",
      "Hunting of bighorn sheep in mountain ranges.",
      "Gathering of pine nuts and grass seeds.",
      "Small family group camps with seasonal aggregation.",
    ],
    specialist: "Elders and skilled hunters who navigate the seasons",
    afterlife:
      "Souls of the dead travel to distant places; ancestors watch from afar.",
    evidence: {
      status: "hypothesis",
      claim:
        "Archaeological evidence from the last 8000 years shows intensive seed gathering, storage pits, and seasonal occupation patterns. Ethnographic accounts by Steward and others document the seasonal round and resource management.",
      sources: [
        "Steward, Basin-Plateau Aboriginal Sociopolitical Groups",
        "Aikens & Croes, The Archaeology of the Columbia Plateau",
        'Miller, "Uto-Aztecan Cognate Sets", IJAL',
      ],
      limitation:
        "This is a general summary of Great Basin foraging and does not represent any specific nation's distinct seasonal and territorial practices. The starred forms are comparative reconstructions of vocabulary, not recovered theonyms, and the Numic branch of Uto-Aztecan is thought to have spread across the Great Basin only in the last thousand years or so — far later than this system's 8000-year floor; a word for 'water' is not evidence of a water god by that name at any point in the range.",
    },
  },

  // EASTERN WOODLANDS

  {
    id: "eastern-woodlands-early",
    label: "Eastern Woodlands early forager and farmer practice",
    scope: { years: [-3000, 800], bounds: [-90, 35, -70, 50] },
    powers: [
      {
        name: "The mast forest",
        domain: "acorns, nuts, abundance, sacred groves",
        rank: "paramount",
      },
      {
        name: "*Nepyi",
        gloss: "Proto-Algonquian *nepyi, 'water'",
        domain: "travel, fish, water, crossing",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the people before, guidance, territory",
        rank: "major",
      },
      {
        name: "*Axkyi",
        gloss: "Proto-Algonquian *axkyi, 'earth, land'",
        domain: "home, shelter, sacred places",
        rank: "major",
      },
      {
        name: "*Eškwote·wi",
        gloss: "Proto-Algonquian *eškwote·wi, 'fire'",
        domain: "cooking, clearing, protection, gathering place",
        rank: "local",
      },
      {
        name: "The animals",
        domain: "deer, elk, hunted game, respect",
        rank: "local",
      },
      {
        name: "The corn or seeds",
        domain: "cultivated foods, emerging sustenance",
        rank: "local",
      },
    ],
    practice: [
      "Seasonal gathering at river confluences and nut groves.",
      "Hunting with bow and trap.",
      "Gradual adoption of maize, beans, and squash.",
      "Shell mounds from oyster and clam gathering.",
      "Burial mounds for ancestors and leaders.",
      "Trade networks along rivers.",
    ],
    specialist: "Elders and healers who guide the seasons",
    afterlife: "Ancestors rest in the mounds; spirits watch over the living.",
    evidence: {
      status: "hypothesis",
      claim:
        "Archaic Period sites show 3000 years of mound building, river resource use, and gradual adoption of agriculture. Late Archaic mounds (e.g., Watson Brake, Poverty Point) suggest emerging social complexity.",
      sources: [
        "Steponaitis, Prehistoric Archaeology in the Eastern United States",
        "Caldwell, The Trend of Indian Population in the Southeast",
        'Goddard, "Handbook of North American Indians, Vol. 17: Languages" (Proto-Algonquian)',
        "Hewson, A Computer-Generated Dictionary of Proto-Algonquian",
      ],
      limitation:
        "Evidence of early farming is sparse; dates for maize adoption vary by region, and this is a general summary of Eastern Woodlands transition from hunting to farming. The starred forms are Proto-Algonquian reconstructions of vocabulary, not recovered theonyms: nobody is recorded speaking them, and a word for 'water' is not evidence of a river god by that name. The Proto-Algonquian split is dated well after this system's early centuries, so the reconstruction is a placeholder for an older, unrecorded stage of the same language family.",
    },
  },

  {
    id: "mississippian-southeast",
    label: "Mississippian practice",
    wiki: "https://en.wikipedia.org/wiki/Southeastern_Ceremonial_Complex",
    scope: { years: [800, 1600], bounds: [-100, 25, -75, 48] },
    powers: [
      {
        name: "Selu",
        wiki: "https://en.wikipedia.org/wiki/Selu",
        domain: "corn, agriculture, life, emergence",
        rank: "paramount",
      },
      {
        name: "Kanati",
        domain: "the hunt, game animals, the sky",
        rank: "major",
      },
      {
        name: "Uktena",
        wiki: "https://en.wikipedia.org/wiki/Uktena",
        domain: "waters, the underworld, danger",
        rank: "major",
      },
      {
        name: "Red Horn",
        wiki: "https://en.wikipedia.org/wiki/Red_Horn",
        domain: "war, the hunt, the birdman power",
        rank: "major",
      },
      {
        name: "The sacred fire",
        domain: "purification, renewal, the town center",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the town's founders and dead",
        rank: "local",
      },
      {
        name: "The river",
        domain: "travel, water, trade",
        rank: "local",
      },
      {
        name: "The mound itself",
        domain: "the town, protection, elevation",
        rank: "local",
      },
    ],
    practice: [
      "Green Corn Ceremony at harvest for renewal.",
      "Sacred fires kept burning at town centers.",
      "Mound burials for chiefs with grave goods.",
      "Fasting and purification before hunts and war.",
      "Shell and copper offerings at shrines.",
    ],
    specialist: "Priests serving the mound temple; the chief as intermediary",
    afterlife:
      "The honored dead ascend the mound and remain present in the town.",
    evidence: {
      status: "documented",
      claim:
        "Mississippian cosmology is reconstructed from iconography on shell gorgets and copper plates, from mound-and-plaza town plans, and from 16th-century Spanish accounts of Southeastern chiefdoms like Coosa and Cahokia. Later Cherokee oral tradition names Selu (Corn Mother) and Kanati (the Lucky Hunter) as first parents, and Uktena as the great horned serpent; scholars link the Birdman iconography of the Southeastern Ceremonial Complex to Red Horn, a hero figure recorded across the wider Mississippian world.",
      sources: [
        "Peregrine, Mississippian Evolution of Chiefdoms",
        "Swanton, Indians of the Southeastern United States",
        "DePratter & Covington, Hernando de Soto",
        "Mooney, Myths of the Cherokee",
      ],
      limitation:
        "Cosmology is inferred from material culture and later ethnographic parallels, not from texts. Regional variation was substantial; this is a central pattern.",
    },
  },

  {
    id: "eastern-woodlands-algonquian",
    label: "Eastern Woodlands Algonquian practice",
    wiki: "https://en.wikipedia.org/wiki/Algonquian_mythology",
    scope: { years: [1200, 1901], bounds: [-90, 38, -65, 52] },
    powers: [
      {
        name: "Manitou",
        wiki: "https://en.wikipedia.org/wiki/Manitou",
        domain: "the great spirit, all power and life",
        rank: "paramount",
      },
      {
        name: "Nanabozho",
        wiki: "https://en.wikipedia.org/wiki/Nanabozho",
        domain: "the culture hero, trickster, transformation",
        rank: "major",
      },
      {
        name: "Gluskap",
        wiki: "https://en.wikipedia.org/wiki/Gluskap",
        domain: "the culture hero, transformer, teacher",
        rank: "major",
      },
      {
        name: "Turtle",
        domain: "the earth, slowness, steadiness",
        rank: "major",
        relation: { kind: "aspect-of", of: "Manitou" },
      },
      {
        name: "The forest animals",
        domain: "hunted species, respect and reciprocity",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the band's dead, guidance",
        rank: "local",
      },
      {
        name: "The lodge fire",
        domain: "home, gathering, warmth",
        rank: "local",
      },
      {
        name: "The maple tree",
        domain: "sweetness, spring, sustenance",
        rank: "local",
      },
    ],
    practice: [
      "Tobacco offered before hunting and travel.",
      "Dreams sought in isolation for guidance.",
      "First kill and first fruits given back to the land.",
      "Seasonal gathering at sugar camps and hunt sites.",
      "Stories told in winter to maintain proper relations.",
    ],
    specialist: "Dreamers and healers; the eldest as keeper of stories",
    afterlife:
      "Souls travel the path of spirits; the ancestors watch over the living.",
    evidence: {
      status: "documented",
      claim:
        "Algonquian cosmology is documented in early ethnographic accounts by Schoolcraft, James, and Densmore, and in the oral traditions preserved by Anishinaabe, Wabanaki, and other Algonquian peoples. Manitou theology, the Nanabozho cycle among Great Lakes Algonquians, and the Gluskap cycle among Wabanaki peoples are central in 19th-century records.",
      sources: [
        "Densmore, Chippewa Customs",
        "Leland, The Algonquin Legends of New England",
        "Warren, History of Ojibwe Nation",
      ],
      limitation:
        "Ethnographic data is from the 19th century onward. This is a summary across Algonquian-speaking peoples and does not represent the practice of any single contemporary nation.",
    },
  },

  {
    id: "eastern-woodlands-iroquoian",
    label: "Eastern Woodlands Iroquoian practice",
    wiki: "https://en.wikipedia.org/wiki/Haudenosaunee_creation_myth",
    scope: { years: [1200, 1901], bounds: [-85, 40, -70, 50] },
    powers: [
      {
        name: "Sky Woman",
        wiki: "https://en.wikipedia.org/wiki/Sky_Woman",
        domain: "creation, the earth, women",
        rank: "paramount",
      },
      {
        name: "Tharonhiawagon",
        domain: "growth, order, the good twin",
        rank: "major",
        relation: { kind: "child-of", of: "Sky Woman" },
      },
      {
        name: "Flint",
        domain: "winter, stone, the twin who opposes",
        rank: "major",
        relation: { kind: "child-of", of: "Sky Woman" },
      },
      {
        name: "The Three Sisters",
        domain: "corn, beans, squash, cultivation",
        rank: "major",
        relation: { kind: "aspect-of", of: "Sky Woman" },
      },
      {
        name: "Hinon",
        domain: "thunder, war, rain, strength",
        rank: "major",
      },
      {
        name: "The turtle",
        domain: "the earth mother, patience, home",
        rank: "local",
      },
      {
        name: "The longhouse ancestors",
        domain: "matrilineal lines, clan protection",
        rank: "local",
      },
      {
        name: "The healing herbs",
        domain: "medicine, restoration, growth",
        rank: "local",
      },
      {
        name: "The fire at the longhouse center",
        domain: "family, heat, community",
        rank: "local",
      },
    ],
    practice: [
      "Thanksgiving addressed before eating.",
      "Midwinter Ceremony for renewal and dream fulfillment.",
      "Condolence ceremony for mourning and adoption.",
      "Green Corn Ceremony at harvest.",
      "Women control the seed and the harvest.",
    ],
    specialist:
      "Clan mothers and faith keepers; male speakers for the confederacy",
    afterlife:
      "Souls journey toward the land of the Creator; ancestors watch the people.",
    evidence: {
      status: "documented",
      claim:
        "Haudenosaunee cosmology—the creation story of Sky Woman and her grandsons Tharonhiawagon and Flint (Tawiskaron), the Thanksgiving Address, and the seasonal ceremonies—is preserved in oral tradition and documented in ethnographic records by Goldenweiser, Hewitt, and others. Contemporary Haudenosaunee nations maintain these teachings.",
      sources: [
        "Hewitt, Iroquoian Cosmology",
        "Fenton, The Great Law and the Longhouse",
        "DeLucia, Memory Lands",
      ],
      limitation:
        "This is a general summary of Haudenosaunee (Iroquois) teaching and not authoritative for any specific nation. The beliefs and practices of Haudenosaunee peoples are living traditions maintained by the nations themselves.",
    },
  },

  // GREAT PLAINS

  {
    id: "great-plains-historic",
    label: "Great Plains historic practice",
    wiki: "https://en.wikipedia.org/wiki/Lakota_mythology",
    scope: { years: [1200, 1901], bounds: [-110, 28, -90, 55] },
    powers: [
      {
        name: "Wakan Tanka",
        wiki: "https://en.wikipedia.org/wiki/Wakan_Tanka",
        domain: "the great mystery, all powers united",
        rank: "paramount",
      },
      {
        name: "Ptesanwin",
        wiki: "https://en.wikipedia.org/wiki/White_Buffalo_Calf_Woman",
        domain: "the buffalo, the sacred pipe, teaching",
        rank: "major",
      },
      {
        name: "Wi",
        domain: "the sun, time, the pole of the circle",
        rank: "major",
      },
      {
        name: "Wakinyan",
        wiki: "https://en.wikipedia.org/wiki/Thunderbird_(mythology)",
        domain: "thunder, storm, the west, war power",
        rank: "major",
      },
      {
        name: "Iktomi",
        wiki: "https://en.wikipedia.org/wiki/Iktomi",
        domain: "trickery, the spider, mischief",
        rank: "local",
      },
      {
        name: "The sacred pipe",
        domain: "ceremony, binding, truth",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the people's dead, protection, memory",
        rank: "local",
      },
      {
        name: "The earth",
        domain: "the mother, abundance, home",
        rank: "local",
      },
    ],
    practice: [
      "Sun dance at summer solstice for renewal and sacrifice.",
      "Vision quests by young men for guardian spirits.",
      "Sacred pipes smoked to seal agreements and prayers.",
      "Buffalo hunts with ceremony before and after killing.",
      "Sweat lodges for purification.",
    ],
    specialist: "Vision seekers and medicine people who receive power",
    afterlife:
      "Spirits journey to the ancestors; the dead watch over the people.",
    evidence: {
      status: "documented",
      claim:
        "Plains religious practice is documented in accounts by Dorsey, Grinnell, Hassrick, and in the oral traditions maintained by Lakota, Cheyenne, Arapaho, and other Plains nations. Walker's Lakota consultants named Wakan Tanka, Wi, and Wakinyan among the Wakan beings; White Buffalo Calf Woman's gift of the pipe and Iktomi's trickster cycle are widely recorded.",
      sources: [
        "Hassrick, The Sioux: Life and Customs",
        "Walker, Lakota Belief and Ritual",
        "Grinnell, The Cheyenne Indians",
      ],
      limitation:
        "This is a summary of shared themes across culturally distinct Plains peoples and does not represent any specific nation's practice today. It is general ethnographic description.",
    },
  },

  // NORTHWEST COAST

  {
    id: "northwest-coast-historic",
    label: "Northwest Coast historic practice",
    wiki: "https://en.wikipedia.org/wiki/Raven_Tales",
    scope: { years: [1200, 1901], bounds: [-135, 42, -115, 62] },
    powers: [
      {
        name: "The salmon",
        domain: "abundance, return, the cycle",
        rank: "paramount",
      },
      {
        name: "Raven",
        wiki: "https://en.wikipedia.org/wiki/Raven_Tales",
        domain: "creation, trickster, light",
        rank: "major",
      },
      {
        name: "Thunderbird",
        wiki: "https://en.wikipedia.org/wiki/Thunderbird_(mythology)",
        domain: "storm, power, the sky, nobility",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the lineage, rank, spirit power",
        rank: "major",
      },
      {
        name: "Killer whale",
        domain: "the sea, power, hunters",
        rank: "local",
        relation: { kind: "aspect-of", of: "The ancestors" },
      },
      {
        name: "The cedar tree",
        domain: "shelter, baskets, canoes, life",
        rank: "local",
      },
      {
        name: "The river",
        domain: "fish, freshwater, gathering",
        rank: "local",
      },
    ],
    practice: [
      "First salmon ceremony in spring to honor the return.",
      "Potlatch feasts at winter to distribute wealth and prestige.",
      "Heraldic crests carved on totem poles and house posts.",
      "Shamans conduct healing ceremonies with song and rattle.",
      "Taboos on speaking names of the recent dead.",
    ],
    specialist:
      "Shamans who command spirit power and heal; nobles who host potlatches",
    afterlife:
      "Souls return as new generations; the ancestors live in the lineage.",
    evidence: {
      status: "documented",
      claim:
        "Northwest Coast cosmology is documented in ethnographies by Boas, Swanton, and Barbeau, and is maintained in oral tradition by Tlingit, Haida, Kwakwaka'wakw, and other nations. Raven's creation and trickster cycle and widespread Thunderbird tradition are well recorded; salmon ceremonies and potlatches are well documented.",
      sources: [
        "Boas, Kwakwaka'wakw Ethnography",
        "Swanton, Contribution to the Ethnology of the Haida",
        "Hoover, Nuu-chah-nulth Voices",
      ],
      limitation:
        "This is a summary of shared coastal themes and does not represent any single nation's specific traditions or contemporary practice.",
    },
  },

  // SUBARCTIC

  {
    id: "subarctic-boreal",
    label: "Subarctic boreal forager practice",
    wiki: "https://en.wikipedia.org/wiki/Wisakedjak",
    scope: { years: [-3000, 1500], bounds: [-140, 50, -80, 68] },
    powers: [
      {
        name: "The caribou or moose",
        domain: "the primary hunt, meat, hides, sustenance",
        rank: "paramount",
      },
      {
        name: "*Ni·",
        gloss: "Proto-Athabaskan *ni·, 'land, earth'",
        domain: "territory, water, travel routes",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the people before, guidance, names",
        rank: "major",
      },
      {
        name: "Wisakedjak",
        wiki: "https://en.wikipedia.org/wiki/Wisakedjak",
        domain: "the culture hero, trickster, transformation",
        rank: "major",
      },
      {
        name: "*Tuʔ",
        gloss: "Proto-Athabaskan *tuʔ, 'water'",
        domain: "fish, passage, cleansing",
        rank: "local",
      },
      {
        name: "*Qoʔ",
        gloss: "Proto-Athabaskan *qoʔ, 'fire'",
        domain: "warmth, cooking, protection",
        rank: "local",
      },
      {
        name: "The forest",
        domain: "shelter, berries, game",
        rank: "local",
      },
      {
        name: "Yamoria",
        domain: "law, monsters tamed, right order on the land",
        rank: "local",
      },
    ],
    practice: [
      "Seasonal hunting of caribou and moose.",
      "Trapping of smaller game for furs.",
      "Fishing in lakes and rivers.",
      "Processing meat and hides for winter.",
      "Movement following animal migrations.",
      "Trading of furs and crafted items.",
    ],
    specialist: "Hunters and elders who read signs and direct camp movement",
    afterlife:
      "Souls and spirits return through names and reincarnation; hunting requires respect for animal spirits.",
    evidence: {
      status: "hypothesis",
      claim:
        "Archaeological evidence shows 3000+ years of hunting and trapping in boreal forests. Ethnographic accounts document the seasonal round, naming practices, and spiritual relationships with hunted animals, and record the Wisakedjak (Cree/Anishinaabe) and Yamoria (Dene) culture-hero cycles that are projected back to this earlier period.",
      sources: [
        "Helm, The Indians of the Subarctic",
        "Bloomfield, Sacred Stories of the Sweet Grass Cree",
        "Petitot, Traditions indiennes du Canada nord-ouest",
        "Krauss & Leer, Athabaskan Tone",
        "Cook, A Grammar of Dëne Sųłiné",
      ],
      limitation:
        "This is a general summary of Subarctic foraging societies and does not represent any specific nation's practices or contemporary traditions. The starred forms are Proto-Athabaskan reconstructions of vocabulary, not recovered theonyms, chosen alongside the already-named Algonquian (Wisakedjak) and Dene (Yamoria) figures to reflect the region's real mix of language families; a word for 'water' is not evidence of a water god by that name.",
    },
  },

  {
    id: "subarctic-historic",
    label: "Subarctic historic practice",
    wiki: "https://en.wikipedia.org/wiki/Wisakedjak",
    scope: { years: [1500, 1901], bounds: [-140, 50, -80, 68] },
    powers: [
      {
        name: "The caribou or moose",
        domain: "the hunt, sustenance, respect",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "the people's dead, names, power",
        rank: "major",
      },
      {
        name: "Wisakedjak",
        wiki: "https://en.wikipedia.org/wiki/Wisakedjak",
        domain: "healing, trickery, hunting success, vision",
        rank: "major",
      },
      {
        name: "*Ni·",
        gloss: "Proto-Athabaskan *ni·, 'land, earth'",
        domain: "territory, water, shelter",
        rank: "major",
      },
      {
        name: "*Qoʔ",
        gloss: "Proto-Athabaskan *qoʔ, 'fire'",
        domain: "home, warmth, gathering",
        rank: "local",
      },
      {
        name: "*Tuʔ",
        gloss: "Proto-Athabaskan *tuʔ, 'water'",
        domain: "fish, crossing, cleansing",
        rank: "local",
      },
      {
        name: "The beaver or fur-bearer",
        domain: "trade, wealth, respect",
        rank: "local",
      },
      {
        name: "Yamoria",
        domain: "law, monsters tamed, right order on the land",
        rank: "local",
      },
    ],
    practice: [
      "Hunting of caribou, moose, and beaver.",
      "Trapping and fur trading.",
      "Shamanic healing ceremonies and vision quests.",
      "Offerings to animal spirits before killing.",
      "Naming practices maintaining connection to ancestors.",
      "Seasonal gathering at meeting places.",
    ],
    specialist: "Shamans and skilled hunters who lead the bands",
    afterlife:
      "Souls return in new births and in the animals hunted; shamans travel between worlds.",
    evidence: {
      status: "hypothesis",
      claim:
        "Subarctic religious practice is documented in ethnographies by Helm, Wilkinson, and in oral traditions maintained by Dene, Cree, Beaver, and other nations. Wisakedjak's trickster cycle among Algonquian Subarctic peoples and Yamoria the lawgiver among Dene peoples are widely recorded; shamanism and animal respect are central themes.",
      sources: [
        "Helm, The Indians of the Subarctic",
        "Petitot, Traditions indiennes du Canada nord-ouest",
        "Gwich'in Steering Committee, Gwich'in and the Porcupine Caribou Herd",
        "Krauss & Leer, Athabaskan Tone",
      ],
      limitation:
        "This is a general summary across Subarctic societies and does not represent any specific nation's practices or living traditions. The starred forms are Proto-Athabaskan reconstructions of vocabulary, not recovered theonyms: nobody is recorded speaking them, and a word for 'land' is not evidence of a land god by that name.",
    },
  },

  // ARCTIC

  {
    id: "arctic-thule-inuit",
    label: "Arctic Thule and Inuit practice",
    wiki: "https://en.wikipedia.org/wiki/Inuit_religion",
    scope: { years: [1000, 1901], bounds: [-180, 55, -60, 83] },
    powers: [
      {
        name: "Sedna",
        wiki: "https://en.wikipedia.org/wiki/Sedna_(mythology)",
        domain: "the sea, marine animals, storms",
        rank: "paramount",
      },
      {
        name: "Sila",
        wiki: "https://en.wikipedia.org/wiki/Sila_(mythology)",
        domain: "weather, breath, the order of the world",
        rank: "major",
      },
      {
        name: "Tornarsuk",
        domain: "the great spirit, shamans, weather",
        rank: "major",
      },
      {
        name: "The seal",
        domain: "the hunt, blubber, sustenance",
        rank: "major",
        relation: { kind: "serves", of: "Sedna" },
      },
      {
        name: "Anguta",
        domain: "Sedna's father, guardian of the drowned dead",
        rank: "local",
        relation: { kind: "serves", of: "Sedna" },
      },
      {
        name: "The oil lamp fire",
        domain: "warmth, the home, light",
        rank: "local",
      },
      {
        name: "The sea ice",
        domain: "stability, travel, the platform",
        rank: "local",
      },
      {
        name: "Tuurngaq",
        domain: "an individual's helping spirit, gained in dreams",
        rank: "local",
      },
    ],
    practice: [
      "Sedna appeased by keeping her taboos and offerings.",
      "Shamans journey to Sedna's underwater house to heal sickness.",
      "Names of the dead given to newborns to maintain presence.",
      "Amulets worn for protection at sea and on ice.",
      "First kill offering to honor the animal and Sedna.",
    ],
    specialist: "Shamans who travel to spirit worlds and heal",
    afterlife:
      "Souls travel to Sedna's house or to the sky; names return in new births.",
    evidence: {
      status: "documented",
      claim:
        "Inuit and Yupik cosmology is documented in ethnographies by Hawkes, Nelson, and Rasmussen, and is maintained in oral tradition. Sedna's dominion over sea mammals, her father Anguta, the pervasive weather-spirit Sila, and shamans' individual tuurngait are central, well-recorded themes.",
      sources: [
        "Rasmussen, Intellectual Culture of the Iglulik Eskimos",
        "Nelson, Eskimo about Bering Strait",
        "Guedon, Canadian Inuit Shamanism",
      ],
      limitation:
        "This is a broad summary of Arctic cosmology across Thule-descended and Dorset-influenced peoples. It does not represent contemporary Inuit, Yupik, or Iñupiaq communities, whose traditions are living and evolving.",
    },
  },

  // CARIBBEAN

  {
    id: "caribbean-early",
    label: "Caribbean early forager and farmer practice",
    scope: { years: [-2000, 500], bounds: [-85, 10, -55, 30] },
    powers: [
      {
        name: "*Úni",
        gloss: "Proto-Arawakan *úni, 'water'",
        domain: "fish, salt, shellfish, travel",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "the people before, connection to land",
        rank: "major",
      },
      {
        name: "The land and forest",
        domain: "shelter, roots, fruits, territory",
        rank: "major",
      },
      {
        name: "The island mountain",
        domain: "fresh water, sacred place, shelter",
        rank: "local",
      },
      {
        name: "The fire",
        domain: "cooking, clearing, protection",
        rank: "local",
      },
      {
        name: "The mangrove and coastal trees",
        domain: "fish nursery, canoes, shelter",
        rank: "local",
      },
    ],
    practice: [
      "Gathering of shellfish and fish.",
      "Hunting of marine turtles and seabirds.",
      "Cultivation of cassava and sweet potato.",
      "Canoe building for island travel.",
      "Offerings at coastal shrines.",
    ],
    evidence: {
      status: "hypothesis",
      claim:
        "Archaeological shell middens and settlement sites show 2000+ years of maritime foraging and gradual adoption of agriculture before the Taíno period.",
      sources: [
        "Keegan, The Bahama Archipelago",
        "Curet, The Evolution of Postclassic Hispaniola",
        "Aikhenvald, The Arawak Language Family",
      ],
      limitation:
        "Evidence is sparse; this is a general summary of early Caribbean maritime foragers, and Arawakan speakers reached the islands only partway through this system's span. The starred form is a comparative reconstruction of vocabulary, not a recovered theonym: nobody is recorded speaking it, and a word for 'water' is not evidence of a sea god by that name.",
    },
  },

  {
    id: "taino-caribbean",
    label: "Taíno Caribbean practice",
    scope: { years: [500, 1600], bounds: [-85, 10, -55, 30] },
    powers: [
      {
        name: "Yocahu",
        domain: "the great spirit, cassava, fertility",
        rank: "paramount",
      },
      {
        name: "Atabey",
        domain: "the mother, water, motherhood",
        rank: "major",
        relation: { kind: "consort-of", of: "Yocahu" },
      },
      {
        name: "Guabancex",
        domain: "the hurricane, wind, destruction",
        rank: "major",
      },
      {
        name: "Zemis (ancestral spirits)",
        domain: "lineage power, protection, healing",
        rank: "major",
      },
      {
        name: "The sea",
        domain: "travel, fish, salt, boundaries",
        rank: "local",
      },
      {
        name: "The mangrove",
        domain: "fish nursery, shelter, stability",
        rank: "local",
      },
      {
        name: "The ancestors of the cohort",
        domain: "clan protection, continuity",
        rank: "local",
      },
    ],
    practice: [
      "Zemi idols kept in the home for blessing and protection.",
      "Ceremonial ball games between villages to honor the gods.",
      "Cassava bread made with ritual first-fruits offering.",
      "Cohoba ceremonies where hallucinogenic snuff connects to zemis.",
      "Fasting before hunts and before contact with sacred objects.",
    ],
    specialist: "The cacique (chief) as mediator; caciques and nitaínos",
    afterlife:
      "Souls return to the land of the ancestors; zemis guide the living.",
    evidence: {
      status: "documented",
      claim:
        "Taíno cosmology is documented in accounts by Columbus, Las Casas, and Oviedo from first contact, supplemented by archaeological zemi idols and settlement patterns. Later ethnography by Pané and Martyr preserves oral traditions.",
      sources: [
        "Las Casas, Apologética historia sumaria",
        "Pané, An Account of the Antiquities of the Indians",
        "Curet, The Evolution of Postclassic Hispaniola",
      ],
      limitation:
        "Most evidence comes from early Spanish accounts written by outsiders and from Taíno oral traditions preserved at contact. Practices varied by island and changed rapidly after 1492. This is a general summary.",
    },
  },

  // AMAZONIA

  {
    id: "amazonia-early",
    label: "Amazonian early farmer and forager practice",
    scope: { years: [-2000, 1500], bounds: [-80, -8, -45, 5] },
    powers: [
      {
        name: "The anaconda or river spirit",
        domain: "water, rain, fertility, danger",
        rank: "paramount",
      },
      {
        name: "*Ka'a",
        gloss: "Proto-Tupi-Guaraní *ka'a, 'forest, plant, herb'",
        domain: "animals, plants, shelter, hunting",
        rank: "major",
      },
      {
        name: "*Awa",
        gloss: "Proto-Tupi-Guaraní *awa, 'person, human being'",
        domain: "the village and lineage, connection to land",
        rank: "major",
      },
      {
        name: "The jaguar",
        domain: "power, transformation, forest mastery",
        rank: "local",
      },
      {
        name: "The yam or manioc",
        domain: "cultivated staple, fertility",
        rank: "local",
      },
      {
        name: "The fish and river mammals",
        domain: "food, abundance in season",
        rank: "local",
      },
      {
        name: "The shamanic plant",
        domain: "vision, communication, power",
        rank: "local",
      },
    ],
    practice: [
      "Swidden (slash-and-burn) agriculture with cassava and other crops.",
      "Fishing with weirs, traps, and poison.",
      "Hunting of forest animals with blow guns and bows.",
      "Shamanic ceremonies with plant medicines.",
      "Offerings to river and forest spirits.",
      "Trading downriver to other groups.",
    ],
    specialist: "Shamans who work with plant spirits and healing",
    afterlife:
      "Souls travel to the forest; shamans' spirits move between the visible and invisible worlds.",
    evidence: {
      status: "hypothesis",
      claim:
        "Archaeological evidence from Amazonian sites (pottery, middens, earthworks) and ethnographic parallels suggest that swidden agriculture, shamanism, and river-forest integration developed over several millennia. Paleobotanical evidence shows ancient plant management.",
      sources: [
        "Roosevelt, Moundbuilders of the Amazon",
        "Heckenberger et al., Pre-Columbian Urbanism and Landscape Transformation",
        "Rodrigues, Línguas Brasileiras",
        'Jensen, "Comparative Tupi-Guarani Morphosyntax"',
      ],
      limitation:
        "Early Amazonian practices are inferred from archaeological and ethnographic parallels; this is a general summary of early Amazonian societies, and Tupi-Guaraní is only one of many language families in the basin. The starred forms are comparative reconstructions of vocabulary, not recovered theonyms: nobody is recorded speaking them, and a word for 'forest' is not evidence of a forest god by that name.",
    },
  },

  {
    id: "amazonian-ethnographic",
    label: "Amazonian ethnographic practice",
    wiki: "https://en.wikipedia.org/wiki/Jurupari",
    scope: { years: [1500, 1901], bounds: [-80, -8, -45, 5] },
    powers: [
      {
        name: "The anaconda spirit",
        domain: "the river, water, rain, abundance",
        rank: "paramount",
      },
      {
        name: "*Ka'a",
        gloss: "Proto-Tupi-Guaraní *ka'a, 'forest, plant, herb'",
        domain: "animals, plants, hunting and gathering",
        rank: "major",
      },
      {
        name: "Jurupari",
        wiki: "https://en.wikipedia.org/wiki/Jurupari",
        domain: "male initiation, sacred flutes, law among men",
        rank: "major",
      },
      {
        name: "The river dolphins",
        domain: "shape-shifting, seduction, danger",
        rank: "major",
        relation: { kind: "aspect-of", of: "The anaconda spirit" },
      },
      {
        name: "*Awa",
        gloss: "Proto-Tupi-Guaraní *awa, 'person, human being'",
        domain: "the lineage, the village, protection",
        rank: "local",
      },
      {
        name: "Yachak (plant masters)",
        domain: "specific plants for medicine and power",
        rank: "local",
      },
      {
        name: "The fish",
        domain: "food, abundance, careful taking",
        rank: "local",
      },
    ],
    practice: [
      "Offerings to the anaconda spirit at the river's edge.",
      "Ayahuasca ceremonies for visions and communication with spirits.",
      "Hunting taboos to respect animal persons and their masters.",
      "Shamans sing icaros (songs) to heal and to travel.",
      "Food prohibitions during illness and after birth.",
    ],
    specialist: "Shamans (curanderos/vegetalistas) who work with plant spirits",
    afterlife:
      "Souls return to the forest; shamans' spirits travel between worlds.",
    evidence: {
      status: "hypothesis",
      claim:
        "Amazonian cosmology is documented in 20th-century ethnographies by Descola, Århem, and Echeverri, and in contemporary accounts by Amazonian peoples. Jurupari, the initiation figure of the Tukanoan and Arawakan Upper Rio Negro, is documented since Barbosa Rodrigues's 19th-century recording of the cycle. Archaeological and paleobotanical evidence suggests that shamanism and plant use are ancient.",
      sources: [
        "Descola, The Spears of Twilight",
        "Århem, Makuna Social Order",
        "Calavia Sáez, The Cosmology of Attraction",
        "Rodrigues, Línguas Brasileiras",
        'Jensen, "Comparative Tupi-Guarani Morphosyntax"',
      ],
      limitation:
        "Most detailed evidence is from ethnography after 1950; earlier practices are inferred from ethnographic parallels and archaeological context, and this is a summary across diverse Amazonian societies, of which Tupi-Guaraní speakers are only one strand — the Jurupari cycle itself belongs to Tukanoan and Arawakan peoples of the Rio Negro. The starred forms are comparative reconstructions of vocabulary, not recovered theonyms: nobody is recorded speaking them, and a word for 'forest' is not evidence of a forest god by that name.",
    },
  },

  // BRAZIL AND ATLANTIC FOREST

  {
    id: "brazil-atlantic-coast",
    label: "Brazilian Atlantic coast and forest practice",
    wiki: "https://en.wikipedia.org/wiki/Tup%C3%A3",
    scope: { years: [-2000, 1901], bounds: [-62, -32, -32, -2] },
    powers: [
      {
        name: "Tupã",
        wiki: "https://en.wikipedia.org/wiki/Tup%C3%A3",
        domain: "thunder, the sky, the highest power",
        rank: "paramount",
      },
      {
        name: "*Ka'a",
        gloss: "Proto-Tupi-Guaraní *ka'a, 'forest, plant, herb'",
        domain: "shelter, game, roots, fruits, medicine",
        rank: "major",
      },
      {
        name: "Anhangá",
        wiki: "https://en.wikipedia.org/wiki/Anhang%C3%A1",
        domain: "the deceiver of hunters, the forest's dangers",
        rank: "major",
      },
      {
        name: "*Ɨ",
        gloss: "Proto-Tupi-Guaraní *ɨ, 'water'",
        domain: "fish, trade, travel, shells",
        rank: "major",
      },
      {
        name: "*Tata",
        gloss: "Proto-Tupi-Guaraní *tata, 'fire'",
        domain: "cooking, clearing, protection",
        rank: "local",
      },
      {
        name: "The shamanic power",
        domain: "healing, vision, danger",
        rank: "local",
      },
      {
        name: "The maize or cultivated crop",
        domain: "fertility, sustenance",
        rank: "local",
      },
    ],
    practice: [
      "Hunting of game with bows and blow guns.",
      "Gathering of forest fruits and roots.",
      "Fishing in rivers and ocean.",
      "Swidden agriculture with maize and yams.",
      "Shellfish gathering at coastal middens.",
      "Shamanic healing and ceremony.",
    ],
    specialist: "Shamans and elders who guide the people",
    afterlife:
      "Souls travel to the forest or to distant lands; ancestors watch over the village.",
    evidence: {
      status: "hypothesis",
      claim:
        "Atlantic Forest sites show 2000+ years of habitation, shell middens, and pottery traditions. Colonial accounts from Thevet, Léry, and Anchieta, and later ethnography, document Tupi and Ge traditions, including Tupã as thunder and highest power and Anhangá as the forest spirit who leads hunters astray.",
      sources: [
        "Prous, Arqueologia Brasileira",
        "Hemming, Red Gold: The Conquest of the Brazilian Indians",
        "Léry, History of a Voyage to the Land of Brazil",
        "Rodrigues, Línguas Brasileiras",
        'Jensen, "Comparative Tupi-Guarani Morphosyntax"',
      ],
      limitation:
        "This is a general summary of Atlantic Forest and coastal societies and does not represent any specific nation's practices or contemporary traditions. The starred forms are Proto-Tupi-Guaraní reconstructions of vocabulary, not recovered theonyms, offered alongside Tupã and Anhangá — names that are themselves recorded words, not modern coinages — to fill out the pantheon; a word for 'water' is not evidence of a water god by that name.",
    },
  },

  // SOUTHERN CONE

  {
    id: "patagonian-southern-cone",
    label: "Patagonian and southern cone practice",
    wiki: "https://en.wikipedia.org/wiki/Elal",
    scope: { years: [-2000, 1901], bounds: [-75, -56, -50, -25] },
    powers: [
      {
        name: "Elal",
        wiki: "https://en.wikipedia.org/wiki/Elal",
        domain: "the culture hero, the sky, creation",
        rank: "paramount",
      },
      {
        name: "Xelsum",
        domain: "the evil spirit, wind, suffering",
        rank: "major",
      },
      {
        name: "Ngenechen",
        wiki: "https://en.wikipedia.org/wiki/Ngenechen",
        domain: "creation, fertility, order",
        rank: "major",
      },
      {
        name: "Pillan",
        wiki: "https://en.wikipedia.org/wiki/Pillan",
        domain: "volcanoes, thunder, ancestral power",
        rank: "major",
      },
      {
        name: "Temaukel",
        domain: "creation, the sky, moral law",
        rank: "local",
      },
      {
        name: "The guanaco",
        domain: "the hunt, meat, sustenance",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the band's dead, strength",
        rank: "local",
      },
      {
        name: "The sea",
        domain: "travel, shellfish, danger",
        rank: "local",
      },
    ],
    practice: [
      "First hunt ceremony for young men.",
      "Offerings to the guanaco spirits before hunting.",
      "Shamans conduct healings with singing and sucking.",
      "Mourning rites involving breaking the deceased's possessions.",
      "Seasonal gatherings for hunting and celebration.",
    ],
    specialist: "Shamans who heal and communicate with spirit world",
    afterlife: "Souls ascend to the sky; some return as new generations.",
    evidence: {
      status: "documented",
      claim:
        "Patagonian and southern cone cosmology is documented in 19th-century accounts by D'Orbigny, Musters, and later ethnographies. The Elal and Xelsum cycle is preserved in Tehuelche oral tradition, Ngenechen and Pillan are recorded in Mapuche ethnography, and Temaukel is the Selk'nam supreme being documented by Gusinde.",
      sources: [
        "Musters, At Home with the Patagonians",
        "Gusinde, The Selk'nam",
        "Faron, Mapuche Social Structure",
      ],
      limitation:
        "This is a summary spanning several distinct traditions (Tehuelche, Mapuche, Selk'nam) from ethnographic records, not a single people's cosmology, and does not represent any contemporary community's living practice.",
    },
  },

  {
    id: "california-historic",
    label: "California historic practice",
    wiki: "https://en.wikipedia.org/wiki/Chinigchinich",
    scope: { years: [1500, 1901], bounds: [-125, 30, -114, 50] },
    powers: [
      {
        name: "The oak and salmon abundance",
        domain: "seasonal resources, sacred cycle",
        rank: "paramount",
      },
      {
        name: "Chinigchinich",
        wiki: "https://en.wikipedia.org/wiki/Chinigchinich",
        domain: "moral law, the secret society, punishment",
        rank: "major",
      },
      {
        name: "Kuksu",
        wiki: "https://en.wikipedia.org/wiki/Kuksu",
        domain: "creation, spirit impersonation, the secret society",
        rank: "major",
      },
      {
        name: "*ʔUuti",
        gloss: "Proto-Utian (Miwok-Costanoan) *ʔuuti, 'person, people'",
        domain: "connection to land and territory",
        rank: "major",
      },
      {
        name: "Coyote",
        wiki: "https://en.wikipedia.org/wiki/Coyote_(mythology)",
        domain: "trickery, creation, teaching by bad example",
        rank: "local",
      },
      {
        name: "The fire",
        domain: "burning, cooking, gathering",
        rank: "local",
      },
      {
        name: "The mountains or rivers",
        domain: "water, shelter, access",
        rank: "local",
      },
      {
        name: "The healer or elder",
        domain: "knowledge, guidance",
        rank: "local",
      },
    ],
    practice: [
      "Burning of oak groves for acorn productivity.",
      "Seasonal gathering at rich resource sites.",
      "Trading of shell beads and dried goods.",
      "Ceremonies and gatherings for alliance and healing.",
    ],
    specialist: "Elders and healers who guide the people",
    afterlife: "Spirits release through cremation to join ancestors.",
    evidence: {
      status: "hypothesis",
      claim:
        "Ethnographic accounts and oral traditions document California indigenous practice through the 19th and 20th centuries. Boscana recorded the Chinigchinich religion of Southern California, and the Kuksu secret-society tradition of Central California is documented by Kroeber and Loeb; fire management, gathering, and trade are well documented.",
      sources: [
        "Boscana, Chinigchinich",
        "Loeb, The Western Kuksu Cult",
        "Anderson, Tending the Wild",
        'Callaghan, "Evidence for Yok-Utian", IJAL',
      ],
      limitation:
        "This is a general summary of California indigenous practice and does not represent any specific nation's traditions; Chinigchinich belongs to a Uto-Aztecan-speaking people and Kuksu to Penutian-speaking ones, while the starred form here is Utian (Miwok-Costanoan) — three different families sharing this floor layer. The starred form is a comparative reconstruction of vocabulary, not a recovered theonym: nobody is recorded speaking it, and a word for 'people' is not evidence of an ancestor cult by that name.",
    },
  },

  {
    id: "great-basin-historic",
    label: "Great Basin historic practice",
    wiki: "https://en.wikipedia.org/wiki/Southern_Paiute_people",
    scope: { years: [1500, 1901], bounds: [-120, 32, -109, 43] },
    powers: [
      {
        name: "The seeds and roots",
        domain: "gathered staples, survival",
        rank: "paramount",
      },
      {
        name: "Tobats",
        domain: "Wolf, the elder, wisdom, right creation",
        rank: "major",
      },
      {
        name: "Shinangwav",
        wiki: "https://en.wikipedia.org/wiki/Coyote_(mythology)",
        domain: "Coyote, mischief, the flaws in creation",
        rank: "major",
      },
      {
        name: "*Tata",
        gloss: "Proto-Uto-Aztecan *tata, 'father, elder male'",
        domain: "guidance, connection to land",
        rank: "major",
      },
      {
        name: "The fire",
        domain: "cooking, signaling, protection",
        rank: "local",
      },
      {
        name: "The animals",
        domain: "game, respect, reciprocity",
        rank: "local",
      },
      {
        name: "The elder or healer",
        domain: "knowledge, healing, guidance",
        rank: "local",
      },
    ],
    practice: [
      "Seasonal gathering and storage of seeds.",
      "Hunting of game following animal movements.",
      "Trading with neighboring groups.",
      "Ceremonies at seasonal transitions.",
      "Healing and vision practices.",
    ],
    specialist: "Elders and healers who guide the seasons",
    afterlife: "Spirits of the dead travel distant paths.",
    evidence: {
      status: "hypothesis",
      claim:
        "Ethnographic records and oral traditions document Great Basin indigenous practice through the 19th and 20th centuries. Powell and later Sapir and Lowie recorded the Numic creation cycle of Wolf (Tobats) and his younger brother Coyote (Shinangwav) among Southern Paiute, Ute, and neighboring peoples.",
      sources: [
        "Steward, Basin-Plateau Aboriginal Sociopolitical Groups",
        "Powell, Sketch of the Mythology of the North American Indians",
        "Lowie, Shoshonean Tales",
        'Miller, "Uto-Aztecan Cognate Sets", IJAL',
      ],
      limitation:
        "This is a general summary of Great Basin practice and does not represent any specific nation's traditions. The starred form is a comparative reconstruction of vocabulary, not a recovered theonym: nobody is recorded speaking it, and a word for 'father' is not evidence of an ancestor god by that name, distinct from Tobats and Shinangwav, whose names are themselves recorded Numic words.",
    },
  },

  {
    id: "caribbean-historic",
    label: "Caribbean indigenous historic practice",
    wiki: "https://en.wikipedia.org/wiki/Ta%C3%ADno_mythology",
    scope: { years: [1600, 1901], bounds: [-85, 10, -55, 30] },
    powers: [
      {
        name: "Yúcahu",
        domain: "cassava, fertility, the great spirit",
        rank: "paramount",
      },
      {
        name: "Atabey",
        wiki: "https://en.wikipedia.org/wiki/Atabey_(goddess)",
        domain: "the mother, water, motherhood",
        rank: "major",
        relation: { kind: "consort-of", of: "Yúcahu" },
      },
      {
        name: "Guabancex",
        wiki: "https://en.wikipedia.org/wiki/Guabancex",
        domain: "the hurricane, wind, destruction",
        rank: "major",
      },
      {
        name: "The sea",
        domain: "fish, travel, trade, sustenance",
        rank: "major",
      },
      {
        name: "Maquetaurie Guayaba",
        domain: "the dead, the afterlife realm of Coaybay",
        rank: "local",
      },
      {
        name: "The fire",
        domain: "cooking, home, protection",
        rank: "local",
      },
      {
        name: "The sacred place",
        domain: "cave or peak, local power",
        rank: "local",
      },
      {
        name: "The healer",
        domain: "medicine, ceremony",
        rank: "local",
      },
    ],
    practice: [
      "Fishing and hunting of marine animals.",
      "Gathering of island plants and roots.",
      "Ceremonies and healing practices.",
      "Trading with other islands.",
      "Maintaining connection to ancestral places.",
    ],
    specialist: "Healers and elders maintaining traditions",
    afterlife:
      "Souls travel to Maquetaurie Guayaba's realm of Coaybay; ancestors remain present and protective.",
    evidence: {
      status: "hypothesis",
      claim:
        "Following Taíno collapse and displacement, remnant Caribbean communities maintained syncretic practices blending indigenous and African traditions, documented in colonial and later accounts. Zemís such as Yúcahu, Atabey, Guabancex, and Maquetaurie Guayaba, recorded by Pané at contact, persisted in altered form among surviving communities.",
      sources: [
        "Hemming, Red Gold",
        "Pané, An Account of the Antiquities of the Indians",
        "Sturm & Sturm, The Oklahoma Cherokees",
      ],
      limitation:
        "This is a summary of postcolonial Caribbean indigenous survival and does not represent any specific contemporary community.",
    },
  },
];
