import type { BeliefSystem } from "../types";

export const mesoamerica: readonly BeliefSystem[] = [
  {
    id: "mesoamerican-foragers",
    label: "Ancestral Mesoamerican beliefs",
    wiki: "https://en.wikipedia.org/wiki/Archaic_period_in_the_Americas",
    scope: { years: [-10000, -800], bounds: [-107, 12, -78, 25] },
    powers: [
      {
        name: "*Mam",
        gloss: "Proto-Mayan *mam, 'grandfather, ancestor'",
        domain: "lineage, the dead, guidance",
        rank: "paramount",
      },
      {
        name: "*B'alam",
        gloss: "Proto-Mayan *b'alam, 'jaguar'",
        domain: "game, hunting skill, transformation",
        rank: "major",
        relations: [{ kind: "serves", of: "*Mam" }],
      },
      {
        name: "The water sources",
        domain: "rivers, cenotes, rain, fish",
        rank: "major",
        relations: [{ kind: "serves", of: "*Mam" }],
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
        relations: [{ kind: "serves", of: "*B'alam" }],
      },
      {
        name: "The household hearth",
        domain: "family, food, warmth",
        rank: "local",
        relations: [{ kind: "serves", of: "*Mam" }],
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
        "Early Mesoamerican remains (Clovis-era points, middens, rock shelters) show sustained use of specific water sources and mountain passes. Ancestor veneration and animal transformation themes appear consistently in later Mesoamerican traditions from the Olmec onward, suggesting deep roots in forager cosmologies. *Mam and *b'alam are reconstructed Proto-Mayan vocabulary, borrowed here as stand-in names for the ancestor- and animal-powers this record cannot otherwise name.",
      sources: [
        "Piperno & Flannery, 'The Earliest Archaeological Maize (Zea mays L.) from Highland Mexico'",
        "Flannery, 'The Origins of Agriculture in Mesoamerica and North America'",
        "Kaufman, 'A Preliminary Mayan Etymological Dictionary'",
      ],
      limitation:
        "Forager beliefs are not directly recoverable, and no names survive from this period. Proto-Mayan is itself dated no earlier than about 2000 BCE, thousands of years after this entry begins in -10000; projecting its vocabulary onto Archaic-period foragers is a considerable stretch, kept only because it is the most defensible vocabulary available for the region, not because Mayan speech reaches back that far.",
    },
  },
  {
    id: "early-mesoamerican-farming",
    label: "Early Mesoamerican farming communities",
    wiki: "https://en.wikipedia.org/wiki/Mesoamerican_chronology",
    scope: { years: [-3000, -300], bounds: [-107, 12, -78, 25] },
    powers: [
      {
        name: "*Ixim",
        gloss: "Proto-Mayan *ixim, 'maize'",
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
        name: "*Kab'",
        gloss: "Proto-Mayan *kab', 'earth, land, honey'",
        domain: "family settlement and fields",
        rank: "local",
      },
      {
        name: "The harvest spirits",
        domain: "crops at each season",
        rank: "local",
        relations: [{ kind: "serves", of: "*Ixim" }],
      },
      {
        name: "The boundary markers",
        domain: "fields, lineage lands, the village",
        rank: "local",
        relations: [{ kind: "serves", of: "*Kab'" }],
      },
      {
        name: "*K'in",
        gloss: "Proto-Mayan *k'in, 'day, sun'",
        domain: "timing of planting and harvest",
        rank: "local",
        relations: [{ kind: "serves", of: "*Ixim" }],
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
        "Archaeological sites show stable village settlement across Mesoamerica by -3000 with domesticated maize, beans, and squash in storage. Maize-centered ritual appears in later Mesoamerican traditions and dominates Mesoamerican cosmology, suggesting maize veneration emerged early with farming adoption. *Ixim, *kab', and *k'in are reconstructed Proto-Mayan words for maize, land, and the day/sun, used here as concept-names for powers no text ever recorded.",
      sources: [
        "Piperno et al., 'Maize in Prehistoric Central America: Phytoliths and Pollen Records'",
        "Zeder et al., 'Harvesting Change: Archaeology and the Transition to Agriculture'",
        "Kaufman, 'A Preliminary Mayan Etymological Dictionary'",
      ],
      limitation:
        "No written records survive and no names are recoverable. The detail and sophistication of later maize theology is projected backward; early farming communities likely held simpler forms. The starred words are Proto-Mayan reconstructions, not attested theonyms, and this entry's Gulf and Chiapas farmers may equally have spoken early Mixe-Zoquean rather than Mayan.",
    },
  },
  {
    id: "olmec-early",
    label: "Olmec ritual practice",
    wiki: "https://en.wikipedia.org/wiki/Olmecs",
    scope: { years: [-1500, -200], bounds: [-103, 14, -82, 20] },
    powers: [
      {
        name: "The jaguar-serpent being",
        domain: "storm, transformation, the underworld",
        rank: "paramount",
      },
      {
        name: "*Kakawa",
        gloss: "Proto-Mixe-Zoquean *kakawa, 'cacao'",
        domain: "maize, cacao, fertility, sustenance",
        rank: "major",
        relations: [{ kind: "serves", of: "The jaguar-serpent being" }],
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
        relations: [{ kind: "serves", of: "The ancestors" }],
      },
      {
        name: "*Poma",
        gloss: "Proto-Mixe-Zoquean *pom, 'copal incense'",
        domain: "incense, bloodletting, debt to the gods",
        rank: "local",
        relations: [{ kind: "serves", of: "The jaguar-serpent being" }],
      },
      {
        name: "The jade and stone powers",
        domain: "precious materials, the divine",
        rank: "local",
        relations: [{ kind: "serves", of: "The jaguar-serpent being" }],
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
        "Olmec sculpture depicts a being combining human and jaguar features; jade working and depiction of bloodletting suggest sacrificial systems. Water and mountain orientation appears consistent across settlement layouts. Olmec influence spread across Mesoamerica, suggesting ideology shared with neighboring regions. Mixe-Zoquean is the language family most often proposed for the Olmec themselves, on the strength of early loanwords such as *kakawa and *pom that spread from Mixe-Zoquean into Mayan and other Mesoamerican languages alongside cacao and incense use.",
      sources: [
        "Cyphers, Olmec: America's First Civilization",
        "Grove, 'Olmec Archaeology: A Synthesis'",
        "Flannery & Marcus, 'The Cloud People'",
        "Campbell & Kaufman, 'Mesoamerica as a Linguistic Area'",
      ],
      limitation:
        "No written records survive and no Olmec names are recoverable. Deductions rest on monumental art and settlement patterns, and the Mixe-Zoquean identification of the Olmec, while widely argued, is not certain. *Kakawa and *pom are reconstructed words carried by loanword evidence, not recovered Olmec theonyms.",
    },
  },
  {
    id: "maya-preclassic",
    label: "Preclassic Maya cosmology",
    wiki: "https://en.wikipedia.org/wiki/Maya_civilization",
    scope: { years: [-1000, 300], bounds: [-97, 12, -78, 24] },
    powers: [
      {
        name: "Hunab Ku",
        wiki: "https://en.wikipedia.org/wiki/Hunab_Ku",
        domain: "the creator, the sky, unity",
        rank: "paramount",
      },
      {
        name: "Chaac",
        wiki: "https://en.wikipedia.org/wiki/Chaac",
        domain: "rain, lightning, storms",
        rank: "major",
        relations: [{ kind: "child-of", of: "Hunab Ku" }],
      },
      {
        name: "Itzamna",
        wiki: "https://en.wikipedia.org/wiki/Itzamna",
        domain: "earth, sky knowledge, healing",
        rank: "major",
        relations: [{ kind: "child-of", of: "Hunab Ku" }],
      },
      {
        name: "The maize god",
        wiki: "https://en.wikipedia.org/wiki/Maya_maize_god",
        domain: "maize, death, rebirth",
        rank: "major",
        relations: [{ kind: "child-of", of: "Hunab Ku" }],
      },
      {
        name: "Xibalba",
        wiki: "https://en.wikipedia.org/wiki/Xibalba",
        domain: "the underworld, danger, disease",
        rank: "major",
      },
      {
        name: "The household shrine",
        domain: "the family's protection",
        rank: "local",
        relations: [{ kind: "serves", of: "Itzamna" }],
      },
      {
        name: "The cenote",
        domain: "water, caves, the axis between worlds",
        rank: "local",
        relations: [{ kind: "serves", of: "Chaac" }],
      },
      {
        name: "The place ancestors",
        domain: "the family dead and the land",
        rank: "local",
        relations: [{ kind: "serves", of: "Itzamna" }],
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
    wiki: "https://en.wikipedia.org/wiki/Maya_civilization",
    scope: { years: [100, 950], bounds: [-97, 12, -78, 24] },
    powers: [
      {
        name: "Hunab Ku",
        wiki: "https://en.wikipedia.org/wiki/Hunab_Ku",
        domain: "the creator, the sky, unity",
        rank: "paramount",
      },
      {
        name: "Chaac",
        wiki: "https://en.wikipedia.org/wiki/Chaac",
        domain: "rain, lightning, the four directions",
        rank: "major",
        relations: [{ kind: "child-of", of: "Hunab Ku" }],
      },
      {
        name: "Itzamna",
        wiki: "https://en.wikipedia.org/wiki/Itzamna",
        domain: "writing, healing, the east",
        rank: "major",
        relations: [{ kind: "child-of", of: "Hunab Ku" }],
      },
      {
        name: "The maize god",
        wiki: "https://en.wikipedia.org/wiki/Maya_maize_god",
        domain: "maize, death and rebirth",
        rank: "major",
        relations: [{ kind: "child-of", of: "Hunab Ku" }],
      },
      {
        name: "K'inich Ajaw",
        domain: "the sun, kingship, day",
        rank: "major",
        relations: [{ kind: "child-of", of: "Hunab Ku" }],
      },
      {
        name: "Lady Ixik",
        domain: "the moon, fertility, the night",
        rank: "major",
        relations: [{ kind: "consort-of", of: "K'inich Ajaw" }],
      },
      {
        name: "The household shrine",
        domain: "the family and its threshold",
        rank: "local",
        relations: [{ kind: "serves", of: "Itzamna" }],
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
    wiki: "https://en.wikipedia.org/wiki/Pre-Columbian_era",
    scope: { years: [-800, 1550], bounds: [-96, 8, -78, 20] },
    powers: [
      {
        name: "Sibö",
        wiki: "https://en.wikipedia.org/wiki/Bribri_people",
        domain: "creation, the sky, the giving of life",
        rank: "paramount",
      },
      {
        name: "*Ixim",
        gloss: "Proto-Mayan *ixim, 'maize'",
        domain: "crops, fertility, sustenance",
        rank: "major",
      },
      {
        name: "*Ha'",
        gloss: "Proto-Mayan *ha', 'water'",
        domain: "rivers, the sea, cenotes",
        rank: "major",
      },
      { name: "The ancestors", domain: "the dead, lineage", rank: "major" },
      {
        name: "The land powers",
        domain: "mountains, caves, the forest",
        rank: "local",
        relations: [{ kind: "serves", of: "The ancestors" }],
      },
      {
        name: "The household spirits",
        domain: "family, dwelling, hearth",
        rank: "local",
        relations: [{ kind: "serves", of: "The ancestors" }],
      },
      {
        name: "The animal masters",
        domain: "game, hunting, the wild",
        rank: "local",
        relations: [{ kind: "serves", of: "The land powers" }],
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
      status: "hypothesis",
      claim:
        "Archaeological evidence from Mesoamerican sites shows extended cultural contact and shared symbolic systems across Central America. Bribri and Cabécar oral tradition, recorded by twentieth-century ethnographers, names Sibö as the creator power of the Talamanca highlands. The maize spirit and water powers instead carry reconstructed Proto-Mayan vocabulary, appropriate to this entry's northern, Maya-adjacent reach rather than the Chibchan-speaking south it also covers.",
      sources: [
        "Sharer & Traxler, The Ancient Maya",
        "Bozzoli, El nacimiento y la muerte entre los Bribris",
        "Stone & Zalewski, 'The Nahua Conquest of Yucatan Reconsidered'",
        "Kaufman, 'A Preliminary Mayan Etymological Dictionary'",
      ],
      limitation:
        "Central American archaeology is less intensively studied than the Maya heartland. Sibö is documented for one language group (Bribri/Cabécar) within a region of great linguistic and religious diversity; naming it paramount for the whole entry is a simplification. *Ixim and *ha' are Proto-Mayan words, defensible only for this entry's Guatemalan end; no comparably established Proto-Chibchan vocabulary is used here for the Costa Rican and Panamanian end, where Sibö's own language actually belongs.",
    },
  },
  {
    id: "teotihuacan-classical",
    label: "Teotihuacan ritual practice",
    wiki: "https://en.wikipedia.org/wiki/Teotihuacan",
    scope: { years: [50, 850], bounds: [-100, 18, -98, 21] },
    powers: [
      {
        name: "The storm figure",
        domain: "rain, lightning, the sky",
        rank: "paramount",
      },
      {
        name: "*Kōātl",
        gloss: "Proto-Nahuan *kōā-tl, 'serpent'",
        domain: "wind, sky, transformation",
        rank: "major",
      },
      {
        name: "*Tleh",
        gloss: "Proto-Nahuan *tleh, 'fire'",
        domain: "fire, the hearth, renewal",
        rank: "major",
        relations: [{ kind: "serves", of: "The ancestors" }],
      },
      {
        name: "*Sintli",
        gloss: "Proto-Nahuan *sin-, 'maize, dried ear of maize'",
        domain: "crops, fertility, sustenance",
        rank: "major",
      },
      { name: "The ancestors", domain: "the dead and lineage", rank: "major" },
      {
        name: "The household altar",
        domain: "the family's protection and prosperity",
        rank: "local",
        relations: [{ kind: "serves", of: "The ancestors" }],
      },
      {
        name: "The mountain shrines",
        domain: "water sources and peaks",
        rank: "local",
        relations: [{ kind: "serves", of: "The storm figure" }],
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
        "Murals and censers depict a storm figure and a feathered serpent. Foundation deposits contain maize, blood-letter, and shells. Pyramid alignments suggest astronomical and directional significance. Teotihuacan's political reach extended across central Mesoamerica. Proto-Nahuan and Proto-Totonacan are the two languages most often proposed for Teotihuacan itself; the city's own language is unresolved, and this entry draws its reconstructed vocabulary from Nahuan, the better-attested of the two candidates.",
      sources: [
        "Millon, Teotihuacan: City of the Gods",
        "Sugiyama, 'Human Sacrifice, Warfare and Veneration'",
        "Dakin, 'Studies in Nahuatl Historical Phonology'",
      ],
      limitation:
        "Teotihuacan left no deciphered texts and no name for any of its powers survives. Deduction relies on art, architecture, and comparative analysis with later Aztec practice. *Kōātl, *tleh, and *sintli are Proto-Nahuan reconstructions, not recovered Teotihuacan words; Proto-Totonacan is an equally argued candidate for the city's language, but its comparative vocabulary is less accessible and is not drawn on directly here.",
    },
  },
  {
    id: "zapotec-montealbán",
    label: "Zapotec Monte Albán practice",
    wiki: "https://en.wikipedia.org/wiki/Zapotec_civilization",
    scope: { years: [-500, 1000], bounds: [-101, 14, -96, 20] },
    powers: [
      {
        name: "Cocijo",
        wiki: "https://en.wikipedia.org/wiki/Cocijo",
        domain: "lightning, rain, fertility",
        rank: "paramount",
      },
      {
        name: "Pitao Cozobi",
        domain: "maize, abundance, the granary",
        rank: "major",
        relations: [{ kind: "serves", of: "Cocijo" }],
      },
      {
        name: "Coquihani",
        domain: "light, dawn, life-giving warmth",
        rank: "major",
        relations: [{ kind: "serves", of: "Cocijo" }],
      },
      {
        name: "The ancestors",
        domain: "lineage and the past",
        rank: "major",
        relations: [{ kind: "serves", of: "Cocijo" }],
      },
      {
        name: "The household altar",
        domain: "family protection",
        rank: "local",
        relations: [{ kind: "serves", of: "Cocijo" }],
      },
      {
        name: "The mountain shrine",
        domain: "water and seasonal rains",
        rank: "local",
      },
      {
        name: "The pèe",
        domain: "the breath of life carried in every person and thing",
        rank: "local",
      },
      {
        name: "The day signs",
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
        "Zapotec glyphs and colonial-era vocabularies name Cocijo as the paramount rain and lightning power, Pitao Cozobi as the maize and abundance power, and Coquihani as a power of light and dawn. The pèe, a life-force believed to inhere in people, animals, and even stones, is recorded in colonial Zapotec dictionaries and remains a term in modern Zapotec communities.",
      sources: [
        "Flannery & Marcus, The Cloud People: Divergence and Development",
        "Joyce, Zapotec Chiefdoms",
        "Marcus, 'Zapotec Religion'",
      ],
      limitation:
        "Zapotec writing is only partially deciphered. Many divine names come from colonial-era vocabularies compiled after the conquest and may not map cleanly onto Classic-period Monte Albán practice.",
    },
  },
  {
    id: "west-mexican-traditions",
    label: "West Mexican ritual practice",
    wiki: "https://en.wikipedia.org/wiki/Pur%C3%A9pecha_people",
    scope: { years: [-500, 1600], bounds: [-107, 16, -98, 25] },
    powers: [
      {
        name: "Curicaveri",
        domain: "fire, the sun, war",
        rank: "paramount",
      },
      {
        name: "Xaratanga",
        domain: "the moon, fertility, agriculture",
        rank: "major",
        relations: [{ kind: "consort-of", of: "Curicaveri" }],
      },
      {
        name: "Cuerauperi",
        domain: "creation, the earth, rain",
        rank: "major",
      },
      {
        name: "The mountain masters",
        domain: "peaks, water sources, sacred landscape",
        rank: "major",
        relations: [{ kind: "serves", of: "Curicaveri" }],
      },
      {
        name: "The ancestors",
        domain: "lineage, the dead, protection",
        rank: "major",
      },
      {
        name: "The household spirits",
        domain: "family, home, the hearth",
        rank: "local",
        relations: [{ kind: "serves", of: "The ancestors" }],
      },
      {
        name: "*Maso",
        gloss: "Proto-Uto-Aztecan *maso, 'deer'",
        domain: "game, hunting, transformation",
        rank: "local",
        relations: [{ kind: "serves", of: "The mountain masters" }],
      },
      {
        name: "The boundary keepers",
        domain: "fields, lineage lands, villages",
        rank: "local",
        relations: [{ kind: "serves", of: "The ancestors" }],
      },
    ],
    practice: [
      "Maize and squash are offered at mountain shrines and household altars.",
      "The ancestors are fed and consulted in matters of family and land.",
      "Game animals are thanked before and after the hunt.",
      "Seasonal gatherings mark planting and harvest with feasting and dance.",
    ],
    specialist:
      "Priests of Curicaveri direct state ritual under the Tarascan kings; shamans and elders serve household and lineage shrines.",
    afterlife:
      "The dead remain in the ancestral mountains and watch over living family and fields.",
    evidence: {
      status: "documented",
      claim:
        "The Relación de Michoacán, compiled shortly after the conquest, names Curicaveri as the paramount fire and sun power of the Tarascan (Purépecha) state, with Xaratanga as a moon and fertility power and Cuerauperi as an earth and creation power. West Mexican archaeology outside the Tarascan core shows distinct ceramic and architectural traditions, suggesting related but locally varied practice.",
      sources: [
        "Relación de Michoacán (Relación de las ceremonias y ritos y población y gobierno de los indios de la provincia de Mechuacan)",
        "Pollard, Tariacuri's Legacy: The Prehispanic Tarascan State",
        "Kelley & Kelley, 'An Alternative Hypothesis for the Explanation of Aztec Imperialism'",
      ],
      limitation:
        "This entry spans a much larger area and longer period than the Tarascan state it draws its named powers from. West Mexico outside the Tarascan core is less well studied, and much of this entry is reconstructed from fragmentary archaeological evidence and ethnographic parallels. Purépecha itself is a language isolate with no established proto-family of its own, so no reconstruction can honestly stand in for the Tarascan state's own speech; *maso is Proto-Uto-Aztecan, borrowed from the Nahua, Cora, and Huichol communities that ringed this region, not from Tarascan territory itself.",
    },
  },
  {
    id: "mexica-aztec",
    label: "Mexica (Aztec) practice",
    wiki: "https://en.wikipedia.org/wiki/Aztec_religion",
    scope: { years: [1250, 1600], bounds: [-104, 15, -94, 23] },
    powers: [
      {
        name: "Huitzilopochtli",
        wiki: "https://en.wikipedia.org/wiki/Huitzilopochtli",
        domain: "war, sun, the Mexica nation",
        rank: "paramount",
      },
      {
        name: "Tlaloc",
        wiki: "https://en.wikipedia.org/wiki/Tlaloc",
        domain: "rain, lightning, mountains",
        rank: "major",
      },
      {
        name: "Quetzalcoatl",
        wiki: "https://en.wikipedia.org/wiki/Quetzalcoatl",
        domain: "wind, learning, rulership",
        rank: "major",
        relations: [
          { kind: "sibling-of", of: "Huitzilopochtli" },
          { kind: "rival-of", of: "Tezcatlipoca" },
        ],
      },
      {
        name: "Tezcatlipoca",
        wiki: "https://en.wikipedia.org/wiki/Tezcatlipoca",
        domain: "night, fate, sorcery",
        rank: "major",
        relations: [{ kind: "sibling-of", of: "Huitzilopochtli" }],
      },
      {
        name: "Chalchiuhtlicue",
        wiki: "https://en.wikipedia.org/wiki/Chalchiuhtlicue",
        domain: "water, rivers",
        rank: "major",
        relations: [{ kind: "consort-of", of: "Tlaloc" }],
      },
      {
        name: "The maize god",
        domain: "maize and sustenance",
        rank: "major",
        relations: [{ kind: "serves", of: "Tlaloc" }],
      },
      {
        name: "Xiuhtecuhtli",
        wiki: "https://en.wikipedia.org/wiki/Xiuhtecuhtli",
        domain: "fire, the hearth, the household",
        rank: "local",
        relations: [{ kind: "serves", of: "Huitzilopochtli" }],
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
        relations: [{ kind: "serves", of: "Xiuhtecuhtli" }],
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
    wiki: "https://en.wikipedia.org/wiki/Maya_civilization",
    scope: { years: [750, 1600], bounds: [-97, 12, -78, 24] },
    powers: [
      {
        name: "Hunab Ku",
        wiki: "https://en.wikipedia.org/wiki/Hunab_Ku",
        domain: "the creator, the sky",
        rank: "paramount",
      },
      {
        name: "Chaac",
        wiki: "https://en.wikipedia.org/wiki/Chaac",
        domain: "rain, the four directions",
        rank: "major",
        relations: [{ kind: "child-of", of: "Hunab Ku" }],
      },
      {
        name: "Itzamna",
        wiki: "https://en.wikipedia.org/wiki/Itzamna",
        domain: "earth, knowledge, healing",
        rank: "major",
        relations: [{ kind: "child-of", of: "Hunab Ku" }],
      },
      {
        name: "Kukulkan",
        wiki: "https://en.wikipedia.org/wiki/Kukulkan",
        domain: "the feathered serpent, wind, kingship",
        rank: "major",
        relations: [{ kind: "child-of", of: "Hunab Ku" }],
      },
      {
        name: "Ix Chel",
        wiki: "https://en.wikipedia.org/wiki/Ix_Chel",
        domain: "the moon, medicine, weaving, childbirth",
        rank: "major",
        relations: [{ kind: "consort-of", of: "Itzamna" }],
      },
      {
        name: "Yum Kaax",
        wiki: "https://en.wikipedia.org/wiki/Yum_Kaax",
        domain: "maize, the forest, young growth",
        rank: "major",
        relations: [{ kind: "child-of", of: "Hunab Ku" }],
      },
      {
        name: "Ah Puch",
        wiki: "https://en.wikipedia.org/wiki/Ah_Puch",
        domain: "death, decay, the ninth underworld",
        rank: "major",
      },
      {
        name: "The Bacabs",
        wiki: "https://en.wikipedia.org/wiki/Bacab",
        domain: "the four sky-bearers set at the world's corners",
        rank: "local",
        relations: [{ kind: "serves", of: "Itzamna" }],
      },
      {
        name: "The household shrine",
        domain: "the family's prosperity",
        rank: "local",
        relations: [{ kind: "serves", of: "Itzamna" }],
      },
      {
        name: "The cenote or cave",
        domain: "water and the underworld",
        rank: "local",
        relations: [{ kind: "serves", of: "Chaac" }],
      },
      {
        name: "The place ancestors",
        domain: "the bloodline",
        rank: "local",
        relations: [{ kind: "serves", of: "Itzamna" }],
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
      "Kukulkan's descent is marked at the equinoxes at temples built to his design.",
      "Ah Puch is placated, not courted, with fasting and care at the sickbed.",
    ],
    specialist: "Ah kin keep the calendar. Shamans work for healing and harm.",
    afterlife:
      "The ancestors dwell in the landscape and may return to aid or afflict the living.",
    evidence: {
      status: "documented",
      claim:
        "The Books of Chilam Balam (16th-17th century), colonial accounts, and archaeological cenote deposits record Chaac, Itzamna, Kukulkan, Ix Chel, Yum Kaax, Ah Puch, and the Bacabs. Domestic shrines with figurines appear in household archaeology. Postclassic cities maintained Maya religious practice despite political fragmentation.",
      sources: [
        "Roys, The Book of Chilam Balam of Chumayel",
        "Tozzer, Chichen Itza and Its Cenote of Sacrifice",
        "Taube, The Major Gods of Ancient Yucatan",
      ],
      limitation:
        "The Books of Chilam Balam were written in Maya using Spanish script by Maya authors after the conquest, incorporating both pre-conquest knowledge and Spanish Christian influence.",
    },
  },
  {
    id: "colonial-mesoamerica-syncretic",
    label: "Colonial Mesoamerica syncretism",
    wiki: "https://en.wikipedia.org/wiki/Colonial_Mexico",
    scope: { years: [1500, 1850], bounds: [-107, 10, -78, 25] },
    powers: [
      {
        name: "The Christian God",
        domain: "creation, judgment, salvation",
        rank: "paramount",
      },
      {
        name: "Jesus",
        wiki: "https://en.wikipedia.org/wiki/Jesus",
        domain: "suffering, redemption, the cross",
        rank: "major",
        relations: [{ kind: "child-of", of: "The Christian God" }],
      },
      {
        name: "The Virgin of Guadalupe",
        wiki: "https://en.wikipedia.org/wiki/Our_Lady_of_Guadalupe",
        domain: "mercy, protection, motherhood, the new patroness",
        rank: "major",
        relations: [{ kind: "serves", of: "The Christian God" }],
      },
      {
        name: "Maximón",
        wiki: "https://en.wikipedia.org/wiki/Maxim%C3%B3n",
        domain: "the crossroads, vice and its cure, dangerous protection",
        rank: "major",
      },
      {
        name: "The local mountain and water powers",
        domain: "rain, fertility, the landscape",
        rank: "major",
      },
      {
        name: "The household saints",
        domain: "family protection and prosperity",
        rank: "local",
        relations: [{ kind: "serves", of: "The Christian God" }],
      },
      {
        name: "The aluxob",
        wiki: "https://en.wikipedia.org/wiki/Alux",
        domain: "small guardians of the field, mischief and protection",
        rank: "local",
      },
      {
        name: "The chaneques",
        wiki: "https://en.wikipedia.org/wiki/Chaneque",
        domain: "the wild place, springs and caves, stolen souls",
        rank: "local",
      },
    ],
    practice: [
      "Mass at the Christian church marks the yearly round alongside saint festivals.",
      "Candles and copal burn at the household altar before images of saints and crucifixes.",
      "Maximón is fed cigars and liquor by cofradía members who keep his effigy through the year.",
      "Aluxob are fed at field shrines so they guard rather than spoil the milpa; chaneques are placated before clearing new ground.",
    ],
    specialist:
      "The Spanish priest oversees the church. Ah kin, shamans, and Maximón's cofradía continue to serve secretly or in the hills.",
    afterlife:
      "Heaven and hell replace the older cosmology. The ancestors and saints intercede before God.",
    evidence: {
      status: "documented",
      claim:
        "Spanish ecclesiastical records (visita records, papal correspondence) and Maya-language documents (Chilam Balam, land grants, testaments) record the blending of Christian saints with local mountain powers and household ancestors. The Virgin of Guadalupe's cult dates to the earliest colonial decades; Maximón and the aluxob and chaneques are documented in colonial and early ethnographic sources across the Maya and Nahua highlands.",
      sources: [
        "MacLeod, Spanish Central America: A Socioeconomic History",
        "Restall, The Black Middle: Africans, Mayas and Spaniards in Colonial Yucatan",
        "Gossen, Chamulas in the World of the Sun",
        "Mendelson, 'Ritual and Mythology' in Handbook of Middle American Indians",
      ],
      limitation:
        "Colonial Spanish sources were written by clergy with missionary goals. Maya testimony comes through colonial officials and Christian scribes. The balance between Christian and pre-Christian practice varied by locality and changed across the colonial period.",
    },
  },
  {
    id: "modern-mesoamerica",
    label: "Modern Mesoamerican traditions",
    wiki: "https://en.wikipedia.org/wiki/Folk_Catholicism",
    scope: { years: [1750, 2025], bounds: [-107, 10, -78, 25] },
    powers: [
      {
        name: "The Christian God",
        domain: "creation, moral order, salvation",
        rank: "paramount",
      },
      {
        name: "Jesus",
        wiki: "https://en.wikipedia.org/wiki/Jesus",
        domain: "redemption, suffering, the cross",
        rank: "major",
        relations: [{ kind: "child-of", of: "The Christian God" }],
      },
      {
        name: "The Virgin of Guadalupe",
        wiki: "https://en.wikipedia.org/wiki/Our_Lady_of_Guadalupe",
        domain: "protection, motherhood, healing, national patroness",
        rank: "major",
        relations: [{ kind: "serves", of: "The Christian God" }],
      },
      {
        name: "Maximón (San Simón)",
        wiki: "https://en.wikipedia.org/wiki/Maxim%C3%B3n",
        domain: "the town, community, dangerous favors",
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
        relations: [{ kind: "serves", of: "The Christian God" }],
      },
      {
        name: "The Day of the Dead ancestors",
        wiki: "https://en.wikipedia.org/wiki/Day_of_the_Dead",
        domain:
          "the returning dead, honored each November with altars and marigolds",
        rank: "local",
      },
      {
        name: "The chaneques",
        wiki: "https://en.wikipedia.org/wiki/Chaneque",
        domain: "guardian spirits of field and forest",
        rank: "local",
      },
    ],
    practice: [
      "Church attendance marks baptism, marriage, death, and the calendar of saints.",
      "Household altars with saints and candles remain central to family ritual.",
      "The dead are welcomed home on the Day of the Dead with food, marigolds, and photographs.",
      "Local mountains and water sources receive offerings for rain and fertility; chaneques are placated before working new ground.",
    ],
    specialist:
      "Catholic priests, indigenous shamans, and family elders each maintain their domains.",
    afterlife:
      "Heaven and hell, with the dead joining the communion of saints and ancestors, and returning each year to visit the living.",
    evidence: {
      status: "documented",
      claim:
        "Modern ethnographic studies, religious practice surveys, and community documentation show persistent indigenous cosmology integrated with Christianity. Mountain worship, the Day of the Dead, and the cult of the Virgin of Guadalupe and of Maximón retain pre-conquest structures adapted to Christian frameworks across Mesoamerica.",
      sources: [
        "Vogt, Zinacantan: A Maya Community in the Highlands of Chiapas",
        "Watanabe, 'Unimagined Listeners' in Postcolonial Mesoamerica",
        "Annis, God and Production in a Guatemalan Town",
        "Brandes, Skulls to the Living, Bread to the Dead",
      ],
      limitation:
        "Modern traditions vary significantly by region, community, and generation. This entry flattens real diversity into a regional summary.",
    },
  },
];
