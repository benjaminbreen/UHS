import type { BeliefSystem } from "../types";

export const mesoamerica: readonly BeliefSystem[] = [
  {
    id: "mesoamerican-foragers",
    label: "Ancestral Mesoamerican beliefs",
    scope: { years: [-10000, -800], bounds: [-107, 12, -78, 25] },
    powers: [
      {
        name: "The ancestors",
        domain: "lineage, the dead, guidance",
        rank: "paramount",
      },
      {
        name: "The animal powers",
        domain: "game, hunting skill, transformation",
        rank: "major",
      },
      {
        name: "The water sources",
        domain: "rivers, cenotes, rain, fish",
        rank: "major",
      },
      {
        name: "The mountain peaks",
        domain: "the sacred landscape, peaks and caves",
        rank: "major",
      },
      {
        name: "The forest spirits",
        domain: "game and the wild place",
        rank: "local",
      },
      {
        name: "The household hearth",
        domain: "family, food, warmth",
        rank: "local",
      },
      {
        name: "The cardinal directions",
        domain: "place and orientation",
        rank: "local",
      },
    ],
    practice: [
      "Food is offered at dawn to the ancestors and the game.",
      "The dead are spoken to at water sources and caves.",
      "Hunts begin with prayer to the animal master.",
      "The household hearth is never let cold; ashes are scattered at season changes.",
    ],
    specialist:
      "Elders read signs in animals and weather. Shamans journey to speak with the spirits.",
    afterlife:
      "The dead remain in the landscape, watching the living and joining the company of ancestors.",
    evidence: {
      status: "hypothesis",
      claim:
        "Early Mesoamerican remains (Clovis-era points, middens, rock shelters) show sustained use of specific water sources and mountain passes. Ancestor veneration and animal transformation themes appear consistently in later Mesoamerican traditions from the Olmec onward, suggesting deep roots in forager cosmologies.",
      sources: [
        "Piperno & Flannery, 'The Earliest Archaeological Maize (Zea mays L.) from Highland Mexico'",
        "Flannery, 'The Origins of Agriculture in Mesoamerica and North America'",
      ],
      limitation:
        "Forager beliefs are not directly recoverable. This entry describes the likely common base from which later Mesoamerican traditions elaborated.",
    },
  },
  {
    id: "early-mesoamerican-farming",
    label: "Early Mesoamerican farming communities",
    scope: { years: [-3000, -300], bounds: [-107, 12, -78, 25] },
    powers: [
      {
        name: "The maize spirit",
        domain: "crops, fertility, sustenance",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "lineage, the fields, continuity",
        rank: "major",
      },
      {
        name: "The water sources",
        domain: "rain, irrigation, rivers, cenotes",
        rank: "major",
      },
      {
        name: "The mountain peaks",
        domain: "the sacred landscape, caves",
        rank: "major",
      },
      {
        name: "The household earth",
        domain: "family settlement and fields",
        rank: "local",
      },
      {
        name: "The harvest spirits",
        domain: "crops at each season",
        rank: "local",
      },
      {
        name: "The boundary markers",
        domain: "fields, lineage lands, the village",
        rank: "local",
      },
      {
        name: "The day keepers",
        domain: "timing of planting and harvest",
        rank: "local",
      },
    ],
    practice: [
      "Maize dough is offered before planting and after harvest.",
      "The ancestors are fed and consulted in matters of land and family.",
      "Water sources are marked and offered to before the rains.",
      "Harvest festivals gather the village and give thanks.",
    ],
    specialist:
      "Elders and lineage heads direct ritual. Shamans read the timing of seasons.",
    afterlife:
      "The dead remain in the ancestral lands and guide the living in farming and family matters.",
    evidence: {
      status: "hypothesis",
      claim:
        "Archaeological sites show stable village settlement across Mesoamerica by -3000 with domesticated maize, beans, and squash in storage. Maize-centered ritual appears in later Mesoamerican traditions and dominates Mesoamerican cosmology, suggesting maize veneration emerged early with farming adoption.",
      sources: [
        "Piperno et al., 'Maize in Prehistoric Central America: Phytoliths and Pollen Records'",
        "Zeder et al., 'Harvesting Change: Archaeology and the Transition to Agriculture'",
      ],
      limitation:
        "No written records survive. The detail and sophistication of later maize theology is projected backward; early farming communities likely held simpler forms.",
    },
  },
  {
    id: "olmec-early",
    label: "Olmec ritual practice",
    scope: { years: [-1500, -200], bounds: [-103, 14, -82, 20] },
    powers: [
      {
        name: "The jaguar-serpent being",
        domain: "storm, transformation, the underworld",
        rank: "paramount",
      },
      {
        name: "The maize spirit",
        domain: "fertility, crops, sustenance",
        rank: "major",
      },
      { name: "The ancestors", domain: "lineage, the dead", rank: "major" },
      {
        name: "The water sources",
        domain: "rivers, cenotes, rain, Gulf waters",
        rank: "major",
      },
      {
        name: "The mountain peaks",
        domain: "the sacred landscape, lightning",
        rank: "local",
      },
      {
        name: "The household protector",
        domain: "the family and its threshold",
        rank: "local",
      },
      {
        name: "The bloodletting powers",
        domain: "sacrifice, debt to the gods",
        rank: "local",
      },
      {
        name: "The jade and stone powers",
        domain: "precious materials, the divine",
        rank: "local",
      },
    ],
    practice: [
      "Maize and beans are offered at the household shrine.",
      "Blood is let at harvest and during crisis to maintain cosmic order.",
      "The ancestors are addressed through speaking into stone or water.",
      "Jade and stone are worked into ritual objects and buried as offerings.",
    ],
    specialist: "Shamans and lineage leaders conduct the major rituals.",
    afterlife:
      "The dead join the ancestors and influence the living through caves and water.",
    evidence: {
      status: "hypothesis",
      claim:
        "Olmec sculpture depicts a being combining human and jaguar features; jade working and depiction of bloodletting suggest sacrificial systems. Water and mountain orientation appears consistent across settlement layouts. Olmec influence spread across Mesoamerica, suggesting ideology shared with neighboring regions.",
      sources: [
        "Cyphers, Olmec: America's First Civilization",
        "Grove, 'Olmec Archaeology: A Synthesis'",
        "Flannery & Marcus, 'The Cloud People'",
      ],
      limitation:
        "No written records survive. Deductions rest on monumental art and settlement patterns. Influence on later traditions is inferred.",
    },
  },
  {
    id: "maya-preclassic",
    label: "Preclassic Maya cosmology",
    scope: { years: [-1000, 300], bounds: [-97, 12, -78, 24] },
    powers: [
      {
        name: "Hunab Ku",
        domain: "the creator, the sky, unity",
        rank: "paramount",
      },
      {
        name: "Chaac",
        domain: "rain, lightning, storms",
        rank: "major",
      },
      {
        name: "Itzamna",
        domain: "earth, sky knowledge, healing",
        rank: "major",
      },
      {
        name: "The maize god",
        domain: "maize, death, rebirth",
        rank: "major",
      },
      {
        name: "Xibalba",
        domain: "the underworld, danger, disease",
        rank: "major",
      },
      {
        name: "The household shrine",
        domain: "the family's protection",
        rank: "local",
      },
      {
        name: "The cenote",
        domain: "water, caves, the axis between worlds",
        rank: "local",
      },
      {
        name: "The place ancestors",
        domain: "the family dead and the land",
        rank: "local",
      },
      { name: "The day lords", domain: "the calendar cycle", rank: "local" },
    ],
    practice: [
      "Maize dough and cacao are burned as offerings at dawn.",
      "Bloodletting happens on named calendar days to sustain the sun.",
      "The cenote receives maize and precious objects.",
      "The household altar holds figurines of the gods and the dead.",
    ],
    specialist:
      "Ah kin (day-keepers) read the calendar; shamans conduct household rituals.",
    afterlife:
      "The dead travel to Xibalba and may return as ancestral spirits watching over the family.",
    evidence: {
      status: "inferred",
      claim:
        "Early Maya texts, particularly the Dresden Codex and Palenque inscriptions, record Chaac, Itzamna, and the maize god. The cenote as a sacred locus is evident from archaeological deposits and later historical accounts.",
      sources: [
        "Sharer & Traxler, The Ancient Maya",
        "Tedlock, 2000 Years of Mayan Literature",
      ],
      limitation:
        "Preclassic texts are sparse. Reconstruction relies on later Classic and Colonial period sources.",
    },
  },
  {
    id: "maya-classic",
    label: "Classic Maya kingdoms",
    scope: { years: [100, 950], bounds: [-97, 12, -78, 24] },
    powers: [
      {
        name: "Hunab Ku",
        domain: "the creator, the sky, unity",
        rank: "paramount",
      },
      {
        name: "Chaac",
        domain: "rain, lightning, the four directions",
        rank: "major",
      },
      {
        name: "Itzamna",
        domain: "writing, healing, the east",
        rank: "major",
      },
      {
        name: "The maize god",
        domain: "maize, death and rebirth",
        rank: "major",
        relation: { kind: "child-of", of: "Hunab Ku" },
      },
      {
        name: "K'inich Ajaw",
        domain: "the sun, kingship, day",
        rank: "major",
      },
      {
        name: "Lady Ixik",
        domain: "the moon, fertility, the night",
        rank: "major",
      },
      {
        name: "The household shrine",
        domain: "the family and its threshold",
        rank: "local",
      },
      {
        name: "The cenote or cave",
        domain: "water, the axis to Xibalba",
        rank: "local",
      },
      {
        name: "The place ancestors",
        domain: "the bloodline and the land",
        rank: "local",
      },
      {
        name: "The day lords",
        domain: "the tzolk'in cycle, personal fate",
        rank: "local",
      },
    ],
    practice: [
      "Bloodletting at calendar waypoints feeds the gods and renews the cosmos.",
      "Maize and cacao are offered at the household shrine and at the temple.",
      "The king conducts rituals that tie royal bloodline to the gods and cosmos.",
      "Caves and cenotes receive precious goods to petition Chaac for rain.",
    ],
    specialist:
      "The ruler is the chief ritual officer. Priests conduct temple ceremonies. Ah kin mark the calendar.",
    afterlife:
      "The noble dead ascend to K'inich Ajaw or dwell in the house of the gods. Commoners go to Xibalba or remain as ancestors.",
    evidence: {
      status: "documented",
      claim:
        "Hundreds of dated stelae record Chaac, the maize god, K'inich Ajaw, and Lady Ixik. Carved glyphs describe bloodletting rituals. Temple architecture, cenote deposits, and household shrines confirm the tiered cosmology.",
      sources: [
        "Coe, The Maya",
        "Martin & Grube, Chronicle of the Maya Kings and Queens",
        "Schele & Freidel, A Forest of Kings",
      ],
      limitation:
        "Surviving texts tilt toward royal and elite practice. Commoner ritual is inferred from archaeology and later sources.",
    },
  },
  {
    id: "central-american-traditions",
    label: "Central American belief systems",
    scope: { years: [-800, 1550], bounds: [-96, 8, -78, 20] },
    powers: [
      {
        name: "The sky powers",
        domain: "rain, lightning, the seasons",
        rank: "paramount",
      },
      {
        name: "The maize spirit",
        domain: "crops, fertility, sustenance",
        rank: "major",
      },
      {
        name: "The water powers",
        domain: "rivers, the sea, cenotes",
        rank: "major",
      },
      { name: "The ancestors", domain: "the dead, lineage", rank: "major" },
      {
        name: "The land powers",
        domain: "mountains, caves, the forest",
        rank: "local",
      },
      {
        name: "The household spirits",
        domain: "family, dwelling, hearth",
        rank: "local",
      },
      {
        name: "The animal masters",
        domain: "game, hunting, the wild",
        rank: "local",
      },
    ],
    practice: [
      "Maize and cacao are burned at household and mountain shrines.",
      "The ancestors receive food and drink at the household altar.",
      "Bloodletting marks important transitions and calendar waypoints.",
      "Water sources are marked and offered to for the rains.",
    ],
    specialist:
      "Shamans work for healing and divination. Lineage elders conduct family ritual.",
    afterlife:
      "The ancestors dwell in the landscape and may return to aid or afflict the living.",
    evidence: {
      status: "inferred",
      claim:
        "Archaeological evidence from Mesoamerican sites shows extended cultural contact and shared symbolic systems across Central America. Settlement patterns and artifact distribution suggest a common religious substrate adapted to local conditions.",
      sources: [
        "Sharer & Traxler, The Ancient Maya",
        "Stone & Zalewski, 'The Nahua Conquest of Yucatan Reconsidered'",
      ],
      limitation:
        "Central American archaeology is less intensively studied than the Maya heartland. Regional variation was likely significant.",
    },
  },
  {
    id: "teotihuacan-classical",
    label: "Teotihuacan ritual practice",
    scope: { years: [50, 850], bounds: [-100, 18, -98, 21] },
    powers: [
      {
        name: "The storm figure",
        domain: "rain, lightning, the sky",
        rank: "paramount",
      },
      {
        name: "The feathered serpent",
        domain: "wind, sky, transformation",
        rank: "major",
      },
      {
        name: "The old fire god",
        domain: "fire, the hearth, renewal",
        rank: "major",
      },
      {
        name: "The maize being",
        domain: "crops, fertility, sustenance",
        rank: "major",
      },
      { name: "The ancestors", domain: "the dead and lineage", rank: "major" },
      {
        name: "The household altar",
        domain: "the family's protection and prosperity",
        rank: "local",
      },
      {
        name: "The mountain shrines",
        domain: "water sources and peaks",
        rank: "local",
      },
      {
        name: "The bloodletting powers",
        domain: "debt to the gods and renewal",
        rank: "local",
      },
    ],
    practice: [
      "Maize dough and incense are burned at household and temple shrines.",
      "Bloodletting occurs on named days to sustain the gods.",
      "The four directions are marked and acknowledged in ritual.",
      "Shell and jade objects are buried in foundation deposits at temples.",
    ],
    specialist:
      "Priest-administrators at the Pyramid of the Sun conduct state rituals.",
    afterlife:
      "The dead are cremated and scattered. Kin make offerings at household shrines to sustain the dead.",
    evidence: {
      status: "hypothesis",
      claim:
        "Murals and censers depict a storm figure and a feathered serpent. Foundation deposits contain maize, blood-letter, and shells. Pyramid alignments suggest astronomical and directional significance. Teotihuacan's political reach extended across central Mesoamerica.",
      sources: [
        "Millon, Teotihuacan: City of the Gods",
        "Sugiyama, 'Human Sacrifice, Warfare and Veneration'",
      ],
      limitation:
        "Teotihuacan left no deciphered texts. Deduction relies on art, architecture, and comparative analysis with later Aztec practice.",
    },
  },
  {
    id: "zapotec-montealbán",
    label: "Zapotec Monte Albán practice",
    scope: { years: [-500, 1000], bounds: [-101, 14, -96, 20] },
    powers: [
      {
        name: "Cocijo",
        domain: "lightning, rain, fertility",
        rank: "paramount",
      },
      { name: "Pezelao", domain: "the mountain and earth", rank: "major" },
      { name: "Pitao", domain: "creation, the sky", rank: "major" },
      { name: "The maize god", domain: "crops and growth", rank: "major" },
      { name: "The ancestors", domain: "lineage and the past", rank: "major" },
      {
        name: "The household altar",
        domain: "family protection",
        rank: "local",
      },
      {
        name: "The mountain shrine",
        domain: "water and seasonal rains",
        rank: "local",
      },
      {
        name: "The sky powers",
        domain: "individual fate and the calendar",
        rank: "local",
      },
    ],
    practice: [
      "Maize and pulque are offered at the temple and household altar.",
      "Bloodletting on calendar waypoints sustains Cocijo and brings rain.",
      "The ancestors are consulted through shrines placed in caves.",
      "Feasting marks harvest and divine anniversaries.",
    ],
    specialist: "Priests at the main temple; elders at household shrines.",
    afterlife:
      "The dead join the mountain ancestors and intercede for the living.",
    evidence: {
      status: "documented",
      claim:
        "Zapotec glyphs name Cocijo as the paramount rain god. Tomb murals depict Cocijo, Pezelao and the maize god. Monte Albán's architectural alignment and hilltop location emphasize Cocijo's mountain seat.",
      sources: [
        "Flannery & Marcus, The Cloud People: Divergence and Development",
        "Joyce, Zapotec Chiefdoms",
      ],
      limitation:
        "Zapotec writing is only partially deciphered. Interpretation relies on monumental art and ethnographic parallels.",
    },
  },
  {
    id: "west-mexican-traditions",
    label: "West Mexican ritual practice",
    scope: { years: [-500, 1600], bounds: [-107, 16, -98, 25] },
    powers: [
      {
        name: "The mountain masters",
        domain: "peaks, water sources, sacred landscape",
        rank: "paramount",
      },
      {
        name: "The maize spirit",
        domain: "crops, fertility, sustenance",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "lineage, the dead, protection",
        rank: "major",
      },
      {
        name: "The rain and thunder powers",
        domain: "storms, lightning, the seasons",
        rank: "major",
      },
      {
        name: "The household spirits",
        domain: "family, home, the hearth",
        rank: "local",
      },
      {
        name: "The animal masters",
        domain: "game, hunting, transformation",
        rank: "local",
      },
      {
        name: "The boundary keepers",
        domain: "fields, lineage lands, villages",
        rank: "local",
      },
    ],
    practice: [
      "Maize and squash are offered at mountain shrines and household altars.",
      "The ancestors are fed and consulted in matters of family and land.",
      "Game animals are thanked before and after the hunt.",
      "Seasonal gatherings mark planting and harvest with feasting and dance.",
    ],
    specialist:
      "Shamans communicate with mountain masters and animal spirits. Elders oversee lineage shrines.",
    afterlife:
      "The dead remain in the ancestral mountains and watch over living family and fields.",
    evidence: {
      status: "inferred",
      claim:
        "West Mexican archaeology shows distinct ceramic and architectural traditions separate from central and southern Mesoamerica, suggesting a regional belief system. Later historical sources document shamanic and ancestor-centered practice. Evidence for Aztec expansion into the region suggests underlying local traditions.",
      sources: [
        "Kelley & Kelley, 'An Alternative Hypothesis for the Explanation of Aztec Imperialism'",
        "Wilkinson, 'Pre-Columbian Settlement in the Bajío'",
      ],
      limitation:
        "West Mexico is less well studied than other Mesoamerican regions. Much of this entry is reconstructed from fragmentary archaeological evidence and ethnographic parallels.",
    },
  },
  {
    id: "mexica-aztec",
    label: "Mexica (Aztec) practice",
    scope: { years: [1250, 1600], bounds: [-104, 15, -94, 23] },
    powers: [
      {
        name: "Huitzilopochtli",
        domain: "war, sun, the Mexica nation",
        rank: "paramount",
      },
      { name: "Tlaloc", domain: "rain, lightning, mountains", rank: "major" },
      {
        name: "Quetzalcoatl",
        domain: "wind, learning, rulership",
        rank: "major",
      },
      { name: "Tezcatlipoca", domain: "night, fate, sorcery", rank: "major" },
      { name: "Chalchiuhtlicue", domain: "water, rivers", rank: "major" },
      {
        name: "The maize god",
        domain: "maize and sustenance",
        rank: "major",
      },
      {
        name: "Xiuhtecuhtli",
        domain: "fire, the hearth, the household",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "lineage and household past",
        rank: "local",
      },
      {
        name: "The patron of the household craft",
        domain: "trade, skill, livelihood",
        rank: "local",
      },
    ],
    practice: [
      "Maize dough, copal incense and pulque feed the gods at household and temple.",
      "Bloodletting at dawn and at calendar festivals sustains the sun's journey.",
      "The New Fire ceremony every 52 years marks cosmic renewal.",
      "Feasting and flowers mark the many festivals.",
    ],
    specialist:
      "The ruler and high priests perform state rites. Tlamacazque (dedicated priests) serve at temples. Household heads conduct family rituals.",
    afterlife:
      "Warriors slain in battle join the sun's escort. Others journey through Mictlan, the underworld of the dead.",
    evidence: {
      status: "documented",
      claim:
        "The Aztec calendar stone, codices (Mendoza, Florentine), and Spanish chronicle accounts (Sahagún, Díaz del Castillo) record Huitzilopochtli as paramount, Tlaloc and Quetzalcoatl as major powers, and detailed temple ritual. Aztec influence extended across central and western Mesoamerica.",
      sources: [
        "Sahagún, Florentine Codex: General History of the Things of New Spain",
        "Smith, The Aztecs",
        "Aztec, Templo Mayor: Archaeology and Symbolism",
      ],
      limitation:
        "Spanish sources were collected after the conquest from Nahua informants via interpreters, shaping language and emphasis. Some accounts were compiled by clergy with missionary intent.",
    },
  },
  {
    id: "maya-postclassic",
    label: "Postclassic Maya kingdoms",
    scope: { years: [750, 1600], bounds: [-97, 12, -78, 24] },
    powers: [
      {
        name: "Hunab Ku",
        domain: "the creator, the sky",
        rank: "paramount",
      },
      {
        name: "Chaac",
        domain: "rain, the four directions",
        rank: "major",
      },
      {
        name: "Itzamna",
        domain: "earth, knowledge, healing",
        rank: "major",
      },
      {
        name: "The maize god",
        domain: "maize, fertility and death",
        rank: "major",
      },
      {
        name: "The household shrine",
        domain: "the family's prosperity",
        rank: "local",
      },
      {
        name: "The cenote or cave",
        domain: "water and the underworld",
        rank: "local",
      },
      {
        name: "The place ancestors",
        domain: "the bloodline",
        rank: "local",
      },
      {
        name: "The day patrons",
        domain: "the tzolk'in and personal fate",
        rank: "local",
      },
    ],
    practice: [
      "Maize and cacao are burned at household and cenote shrines.",
      "Bloodletting at calendar waypoints sustains the gods.",
      "The ancestors receive food and drink at the household shrine.",
      "Feast days mark the patron saints of towns and lineages.",
    ],
    specialist: "Ah kin keep the calendar. Shamans work for healing and harm.",
    afterlife:
      "The ancestors dwell in the landscape and may return to aid or afflict the living.",
    evidence: {
      status: "documented",
      claim:
        "The Books of Chilam Balam (16th-17th century), colonial accounts, and archaeological cenote deposits record Chaac, Itzamna, and the maize god. Domestic shrines with figurines appear in household archaeology. Postclassic cities maintained Maya religious practice despite political fragmentation.",
      sources: [
        "Roys, The Book of Chilam Balam of Chumayel",
        "Tozzer, Chichen Itza and Its Cenote of Sacrifice",
      ],
      limitation:
        "The Books of Chilam Balam were written in Maya using Spanish script by Maya authors after the conquest, incorporating both pre-conquest knowledge and Spanish Christian influence.",
    },
  },
  {
    id: "colonial-mesoamerica-syncretic",
    label: "Colonial Mesoamerica syncretism",
    scope: { years: [1500, 1850], bounds: [-107, 10, -78, 25] },
    powers: [
      {
        name: "The Christian God",
        domain: "creation, judgment, salvation",
        rank: "paramount",
      },
      {
        name: "Jesus",
        domain: "suffering, redemption, the cross",
        rank: "major",
      },
      {
        name: "The Virgin Mary",
        domain: "mercy, protection, motherhood",
        rank: "major",
      },
      {
        name: "The local mountain and water powers",
        domain: "rain, fertility, the landscape",
        rank: "major",
      },
      {
        name: "The town patron saint",
        domain: "the town's identity and welfare",
        rank: "major",
      },
      {
        name: "The household saints",
        domain: "family protection and prosperity",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the dead and family continuity",
        rank: "local",
      },
      {
        name: "The mountain and cave powers",
        domain: "water, earth, the landscape",
        rank: "local",
      },
    ],
    practice: [
      "Mass at the Christian church marks the yearly round alongside saint festivals.",
      "Candles and copal burn at the household altar before images of saints and crucifixes.",
      "The ancestors receive maize and drink at household shrines on their days.",
      "Fiestas for patron saints gather the town; bloodletting is replaced by self-mortification and fasting.",
    ],
    specialist:
      "The Spanish priest oversees the church. Ah kin and shamans continue to serve secretly or in the hills.",
    afterlife:
      "Heaven and hell replace the older cosmology. The ancestors and saints intercede before God.",
    evidence: {
      status: "documented",
      claim:
        "Spanish ecclesiastical records (visita records, papal correspondence) and Maya-language documents (Chilam Balam, land grants, testaments) record the blending of Christian saints with local mountain powers and household ancestors. Archaeological evidence from colonial churches and shrines shows Spanish Christian imagery alongside indigenous materials.",
      sources: [
        "MacLeod, Spanish Central America: A Socioeconomic History",
        "Restall, The Black Middle: Africans, Mayas and Spaniards in Colonial Yucatan",
        "Gossen, Chamulas in the World of the Sun",
      ],
      limitation:
        "Colonial Spanish sources were written by clergy with missionary goals. Maya testimony comes through colonial officials and Christian scribes. The balance between Christian and pre-Christian practice varied by locality and changed across the colonial period.",
    },
  },
  {
    id: "modern-mesoamerica",
    label: "Modern Mesoamerican traditions",
    scope: { years: [1750, 2025], bounds: [-107, 10, -78, 25] },
    powers: [
      {
        name: "The Christian God",
        domain: "creation, moral order, salvation",
        rank: "paramount",
      },
      {
        name: "Jesus",
        domain: "redemption, suffering, the cross",
        rank: "major",
      },
      {
        name: "The Virgin Mary",
        domain: "protection, motherhood, healing",
        rank: "major",
      },
      {
        name: "The local saints",
        domain: "the town, community, welfare",
        rank: "major",
      },
      {
        name: "The mountain and water spirits",
        domain: "fertility, rain, the landscape",
        rank: "major",
      },
      {
        name: "The household saints and spirits",
        domain: "family, prosperity, home",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the dead, family continuity",
        rank: "local",
      },
      {
        name: "The land and forest powers",
        domain: "agriculture, game, the wild",
        rank: "local",
      },
    ],
    practice: [
      "Church attendance marks baptism, marriage, death, and the calendar of saints.",
      "Household altars with saints and candles remain central to family ritual.",
      "Ancestors are remembered on Days of the Dead with food and flowers.",
      "Local mountains and water sources receive offerings for rain and fertility.",
    ],
    specialist:
      "Catholic priests, indigenous shamans, and family elders each maintain their domains.",
    afterlife:
      "Heaven and hell, with the dead joining the communion of saints and ancestors.",
    evidence: {
      status: "documented",
      claim:
        "Modern ethnographic studies, religious practice surveys, and community documentation show persistent indigenous cosmology integrated with Christianity. Mountain worship, ancestor veneration, and saint festivals retain pre-conquest structures adapted to Christian frameworks across Mesoamerica.",
      sources: [
        "Vogt, Zinacantan: A Maya Community in the Highlands of Chiapas",
        "Watanabe, 'Unimagined Listeners' in Postcolonial Mesoamerica",
        "Annis, God and Production in a Guatemalan Town",
      ],
      limitation:
        "Modern traditions vary significantly by region, community, and generation. This entry flattens real diversity into a regional summary.",
    },
  },
];
