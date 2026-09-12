import type { BeliefSystem } from "../types";

export const westCentralAfrica: readonly BeliefSystem[] = [
  {
    id: "west-central-foragers",
    label: "West-central African forager practice",
    scope: { years: [-8000, -500], bounds: [-18, -10, 32, 20] },
    powers: [
      {
        name: "The rains",
        domain: "water, game abundance, grass",
        rank: "paramount",
      },
      {
        name: "The forest",
        domain: "shelter, medicine, animals",
        rank: "major",
      },
      {
        name: "The ancestors of the band",
        domain: "hunting skill, healing, the place",
        rank: "major",
      },
      {
        name: "Lightning",
        domain: "power, danger, the sky",
        rank: "major",
      },
      {
        name: "The river",
        domain: "fish, drinking, crossing",
        rank: "local",
      },
      {
        name: "The sacred grove",
        domain: "gathering place, initiation, safety",
        rank: "local",
      },
      {
        name: "The night",
        domain: "dreams, messages from the dead",
        rank: "local",
      },
      {
        name: "The hunter's luck",
        domain: "fortune in tracking and killing",
        rank: "local",
      },
    ],
    practice: [
      "Before the hunt, the ancestors are called and the rains thanked.",
      "A person entering trance may receive guidance from the other world.",
      "The first fruits and meat are shared with the band and the place.",
      "Ochre, ash and bones are left at significant places as marks and messages.",
    ],
    specialist:
      "Elders and those with gift of trance; the most successful hunter.",
    afterlife:
      "The dead stay near their band, guiding hunts and watching over camp.",
    evidence: {
      status: "hypothesis",
      claim:
        "West-central African forager communities are attested archaeologically from -8000 onward; specific belief systems are reconstructed from rock art, settlement patterns, and ethnographic parallels from surviving San and Hadza peoples.",
      sources: [
        "Robertshaw, A History of African Archaeology",
        "Lewis-Williams, The Mind in the Cave",
        "Mitchell, The Archaeology of Southern Africa",
      ],
      limitation:
        "No written forager records exist; this system flattens thousands of years and many distinct peoples into one schematic pattern.",
    },
  },
  {
    id: "early-bantu-farmers",
    label: "Early Bantu farming and herding practice",
    scope: { years: [-500, 500], bounds: [-18, -10, 32, 20] },
    powers: [
      {
        name: "The sky",
        domain: "rains, lightning, fertility",
        rank: "paramount",
      },
      {
        name: "The earth",
        domain: "crops, settlement, burial",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the lineage, the homestead, protection",
        rank: "major",
      },
      {
        name: "The cattle",
        domain: "wealth, bride-price, living and dead",
        rank: "major",
      },
      {
        name: "The smiths' fire",
        domain: "iron, tools, transformation",
        rank: "local",
      },
      {
        name: "The village head's spirit",
        domain: "law, justice, settlement order",
        rank: "local",
      },
      {
        name: "The forest border",
        domain: "game, medicine, danger",
        rank: "local",
      },
      {
        name: "The water source",
        domain: "drinking, healing, crossing",
        rank: "local",
      },
    ],
    practice: [
      "Crops planted with greeting to the earth and asking permission from the forest.",
      "Beer poured and meat shared with ancestors before eating.",
      "At a death, the body is buried in the homestead yard, joining protective ancestors.",
      "Smiths work iron in ritual quiet; metal holds power and must be treated with respect.",
    ],
    specialist:
      "The lineage elder; the smith for technical knowledge; the rainmaker.",
    afterlife:
      "The dead become ancestors dwelling in or near the homestead, watching and guiding descendants.",
    evidence: {
      status: "inferred",
      claim:
        "Iron-working settlements across central Africa from -500 onward show agricultural and pastoral practices consistent with Bantu expansion; ethnography of later Bantu groups documents lineage-based ancestor veneration and iron ritual.",
      sources: [
        "Huffman, Handbook to the Iron Age",
        "Mitchell, The Archaeology of Southern Africa",
        "Vansina, Paths in the Rainforests",
      ],
      limitation:
        "Early Bantu beliefs are not directly documented; this entry is inferred from archaeology and later oral tradition, flattening real regional and temporal variation.",
    },
  },
  {
    id: "regional-kingdoms-era",
    label: "Regional kingdoms and savanna practice",
    scope: { years: [500, 1200], bounds: [-18, -10, 32, 20] },
    powers: [
      {
        name: "The high god",
        domain: "the creator, rarely named directly",
        rank: "paramount",
      },
      {
        name: "The king's spirit",
        domain: "law, order, prosperity of the land",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the kingdom's founding line, protection",
        rank: "major",
      },
      {
        name: "The earth",
        domain: "crops, settlement, fertility",
        rank: "major",
      },
      {
        name: "The rivers",
        domain: "water, crossing, local power",
        rank: "major",
      },
      {
        name: "Thunder",
        domain: "divine punishment and power",
        rank: "local",
      },
      {
        name: "The royal regalia",
        domain: "the king's connection to power",
        rank: "local",
      },
      {
        name: "The market",
        domain: "trade, prosperity, communal gathering",
        rank: "local",
      },
      {
        name: "The smiths' guild",
        domain: "craft, metal, transformation",
        rank: "local",
      },
    ],
    practice: [
      "The king makes annual offerings to ensure rain and good harvest.",
      "Ancestors are honored with libations; the founders of the kingdom receive special feasts.",
      "Markets open on set days marked by ritual and protected by local powers.",
      "Smiths work in recognized guild with ritual prohibitions and secret knowledge.",
    ],
    specialist:
      "The king or his designated ritual deputy; smiths with guild knowledge; market elders.",
    afterlife:
      "The dead join the ancestors; powerful people may become localized spirits for their place.",
    evidence: {
      status: "inferred",
      claim:
        "Archaeological evidence of organized settlements, trade networks, and craft specialization from 500 onward suggests hierarchical societies; later kingdoms' practices project back to infer this era's structure.",
      sources: [
        "McIntosh, Ancient Middle Niger",
        "Connah, African Civilizations",
        "Vansina, Paths in the Rainforests",
      ],
      limitation:
        "This is a schematic summary covering vast regional variation across five centuries. Specific kingdoms had their own systems; this describes common patterns among them.",
    },
  },
  {
    id: "islamic-trade-era",
    label: "Islamic trade and adaptation",
    scope: { years: [1200, 1600], bounds: [-18, 11, 32, 20] },
    powers: [
      {
        name: "Allah",
        domain: "the one god, ultimate power",
        rank: "paramount",
      },
      {
        name: "The Prophet Muhammad",
        domain: "the messenger, intercession",
        rank: "major",
      },
      {
        name: "Saints and holy men",
        domain: "blessing, healing, protection",
        rank: "major",
      },
      {
        name: "The Qur'an",
        domain: "divine speech, protection in amulets",
        rank: "major",
      },
      {
        name: "The local ancestors",
        domain: "the land's founders, still present",
        rank: "major",
      },
      {
        name: "Jinn",
        domain: "spirits of place, hidden power",
        rank: "local",
      },
      {
        name: "The king or chief",
        domain: "worldly authority, order",
        rank: "local",
      },
      {
        name: "Water spirits",
        domain: "the river, healing, initiation",
        rank: "local",
      },
      {
        name: "The market",
        domain: "trade, prosperity, Islamic community",
        rank: "local",
      },
    ],
    practice: [
      "Islamic traders and scholars establish mosques; prayer five times daily faces Mecca.",
      "Verses from the Qur'an are written as amulets for protection.",
      "The ancestors and older spirits are respected but receive fewer overt offerings.",
      "Islamic law (Sharia) coexists with local custom; the two are negotiated in practice.",
    ],
    specialist:
      "The mallam (Islamic scholar) and imam; local elders retain authority in custom.",
    afterlife:
      "Islamic judgment before Allah; paradise for the faithful. Older ancestor beliefs persist privately.",
    evidence: {
      status: "documented",
      claim:
        "Islamic expansion into West-central Africa is documented from 1100 onward through trade contacts, written Arabic accounts, and archaeological evidence of mosques and settlements. Conversion was gradual and syncretic.",
      sources: [
        "Levtzion, Islam in West Africa",
        "Curtin, Cross-cultural Trade",
        "Insoll, Archaeology of Islam in Sub-Saharan Africa",
      ],
      limitation:
        "Islam spread unevenly; many areas remained non-Islamic or only nominally so. This entry represents the Islamic layer; older systems persisted alongside and underneath.",
    },
  },
  {
    id: "yoruba-orisha",
    label: "Yoruba orisha practice",
    scope: { years: [900, 1750], bounds: [-2, 2, 10, 14] },
    powers: [
      {
        name: "Olorun",
        domain: "the high god, the sky",
        rank: "paramount",
      },
      {
        name: "Orunmila",
        domain: "divination, destiny, fate",
        rank: "major",
      },
      {
        name: "Shango",
        domain: "thunder, justice, war",
        rank: "major",
      },
      {
        name: "Oshun",
        domain: "rivers, fertility, beauty",
        rank: "major",
      },
      {
        name: "Yemoja",
        domain: "the ocean, motherhood",
        rank: "major",
      },
      {
        name: "Aje",
        domain: "wealth, prosperity",
        rank: "major",
      },
      {
        name: "Eleggua",
        domain: "crossroads, boundaries, trickster",
        rank: "local",
      },
      {
        name: "Iya Mapo",
        domain: "the earth, fertility",
        rank: "local",
      },
      {
        name: "The ori",
        domain: "the personal head-spirit and destiny",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the household's own dead",
        rank: "local",
      },
    ],
    practice: [
      "Libations of gin or palm wine poured at a household shrine.",
      "Divination through Ifa and the casting of sixteen cowries guides major decisions.",
      "Orisha are fed with animals and grain on their feast days.",
      "No one enters a sacred grove without washing; menstruating women stay away from certain shrines.",
    ],
    specialist:
      "Babalawo (Ifa priest) for divination; babalorisha (elder) at household shrines.",
    afterlife:
      "The ori travels to meet Olorun; the body returns to the earth; the ancestor stays in the family.",
    evidence: {
      status: "documented",
      claim:
        "Orunmila's role in divination, Shango and Oshun's cult followings, household shrines to Eleggua and the ori are attested in twentieth-century Yoruba ethnography across Nigeria and in diaspora accounts from the Atlantic slave trade.",
      sources: [
        "Awolalu, Yoruba Beliefs and Sacrificial Rites",
        "Bascom, Sixteen Cowries",
        "Pemberton, Insight and Artistry in African Divination",
      ],
      limitation:
        "Orisha worship and its relation to Olorun varied by Yoruba subgroup and town. This summary takes the nineteenth and twentieth-century practice as a model and projects it back.",
    },
  },
  {
    id: "igbo-chi",
    label: "Igbo chi and earth practice",
    scope: { years: [900, 1750], bounds: [6, 4, 12, 10] },
    powers: [
      {
        name: "Chukwu",
        domain: "the creator god, sky and fate",
        rank: "paramount",
      },
      {
        name: "Ala",
        domain: "the earth, crops, morality",
        rank: "major",
      },
      {
        name: "Agbala",
        domain: "the oracle, prophecy",
        rank: "major",
      },
      {
        name: "Idemili",
        domain: "the waters, medicine, oaths",
        rank: "major",
      },
      {
        name: "Ani",
        domain: "the day and the sun",
        rank: "major",
      },
      {
        name: "The chi",
        domain: "the personal guardian spirit",
        rank: "local",
      },
      {
        name: "The umuada",
        domain: "the village daughters' collective power",
        rank: "local",
      },
      {
        name: "The nri",
        domain: "the rain-maker and the land's prosperity",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the lineage's own dead",
        rank: "local",
      },
    ],
    practice: [
      "Yams are first offered to Ala before harvest begins.",
      "An oath sworn at Agbala or at Idemili binds absolutely; breakers sicken.",
      "The chi is propitiated with kola and palm wine on quiet mornings.",
      "An Ala shrine sits near the hearth; a woman who breaks her word to Ala may be cast out.",
    ],
    specialist:
      "The oracle priestess at Agbala; the eldest woman at the household.",
    afterlife:
      "A good chi leads to a good life; at death, the spirit joins the ancestors if the proper rites are kept.",
    evidence: {
      status: "documented",
      claim:
        "Igbo chi, Ala's connection to morality and crops, Agbala's oracle role, and Idemili as oath-spirit are attested in early twentieth-century accounts and in oral traditions from Igboland.",
      sources: [
        "Achebe, Things Fall Apart (ethnographic fiction)",
        "Cole and Aniakor, Igbo Arts",
        "Okonkwo, A History of Igbo People",
      ],
      limitation:
        "No written Igbo records predate European contact. This reflects practices documented in the 1900s, projected back to earlier centuries with the assumption that Chukwu and the earth cult were well established.",
    },
  },
  {
    id: "akan-suman",
    label: "Akan suman and abosom practice",
    scope: { years: [1000, 1750], bounds: [-6, 2, 4, 10] },
    powers: [
      {
        name: "Onyankopon",
        domain: "the high god, the creator",
        rank: "paramount",
      },
      {
        name: "Asase Ya",
        domain: "the earth, fertility, the dead",
        rank: "major",
      },
      {
        name: "Tano",
        domain: "the river Tano, medicine, wealth",
        rank: "major",
      },
      {
        name: "Bia",
        domain: "the river Bia, wind, spirits of nature",
        rank: "major",
      },
      {
        name: "Okra",
        domain: "the personal guardian soul",
        rank: "major",
      },
      {
        name: "Nananom",
        domain: "local river spirits and place-powers",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the family's own dead",
        rank: "local",
      },
      {
        name: "The adinkra",
        domain: "the day's fortune and danger",
        rank: "local",
      },
    ],
    practice: [
      "A libation of palm wine is poured at dawn to Asase Ya before any important work.",
      "A household keeps a suman (shrine object) for protection.",
      "The river is thanked before crossing and before drawing water.",
      "On a man's adinkra (lucky day), he makes offerings and speaks to his okra.",
    ],
    specialist:
      "The okomfo (shrine priest) tends the abosom; the family head at the household.",
    afterlife:
      "The okra rejoins Onyankopon; the body is returned to Asase Ya; the ancestor joins the dead living beneath the earth.",
    evidence: {
      status: "documented",
      claim:
        "Asase Ya's preeminence in household and agricultural life, the okra as guardian soul, and river spirits as localized abosom are attested in eighteenth-century Akan accounts and in twentieth-century Asante and Fante ethnography.",
      sources: [
        "Danquah, The Akan Doctrine of God",
        "Rattray, Religion and Art in Ashanti",
        "McCaskie, State and Society in Pre-colonial Asante",
      ],
      limitation:
        "Asante and Fante practices diverged. This reflects a generalized Akan pattern, most clearly documented for Asante in the nineteenth century.",
    },
  },
  {
    id: "dogon-mande",
    label: "Dogon cosmology and Mande spirit practice",
    scope: { years: [1200, 1750], bounds: [-18, 4, 10, 20] },
    powers: [
      {
        name: "Amma",
        domain: "the creator, the world-egg",
        rank: "paramount",
      },
      {
        name: "Nommo",
        domain: "water, fertility, speech, the word",
        rank: "major",
      },
      {
        name: "Faro",
        domain: "the rain and the river Niger",
        rank: "major",
      },
      {
        name: "Nyale",
        domain: "water spirits, the wilderness",
        rank: "major",
      },
      {
        name: "Pemba",
        domain: "the first woman, agriculture",
        rank: "major",
      },
      {
        name: "The jinn",
        domain: "spirits of place, the bush and river",
        rank: "local",
      },
      {
        name: "The badenya",
        domain: "the maternal clan spirits",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the patriline's own dead",
        rank: "local",
      },
    ],
    practice: [
      "The Niger is greeted with respect; fishermen make offerings before casting nets.",
      "A griot sings the words of Nommo to bind the community and recall the past.",
      "Millet is planted with thanks to Pemba and prayer for rain.",
      "No one speaks carelessly; words invoke the power of Nommo.",
    ],
    specialist:
      "The griot (holder of genealogy and word-power); the family head at household.",
    afterlife:
      "The soul returns to the water and to the ancestors if proper rites are sung.",
    evidence: {
      status: "inferred",
      claim:
        "Amma as creator, Nommo and Faro in Dogon and Mande cosmologies, and the jinn as localized spirits are well attested in twentieth-century ethnography; their pre-Islamic antiquity is inferred from the stable system and from references in Islamic sources.",
      sources: [
        "Griaule, Conversations with Ogotemmeli",
        "Diop, Civilization or Barbarism",
        "Levtzion, Islam in West Africa",
      ],
      limitation:
        "Islamic influence complicated these systems from around 1500 onward. This entry presents the pre-Islamic foundation as inferred from colonial-era accounts.",
    },
  },
  {
    id: "hausa-bori",
    label: "Hausa bori and spirit possession",
    scope: { years: [1000, 1500], bounds: [4, 10, 15, 15] },
    powers: [
      {
        name: "Ubandawaki",
        domain: "the high god, destiny",
        rank: "paramount",
      },
      {
        name: "The bori",
        domain: "the great spirits, possessing and healing",
        rank: "major",
      },
      {
        name: "Sarki",
        domain: "the chief spirit, kingship and prosperity",
        rank: "major",
      },
      {
        name: "Iska",
        domain: "the wind spirit",
        rank: "major",
      },
      {
        name: "The gida",
        domain: "household spirits",
        rank: "local",
      },
      {
        name: "The ruwa",
        domain: "water spirits and illness",
        rank: "local",
      },
      {
        name: "The mai",
        domain: "place spirits and their owners",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the lineage's own dead",
        rank: "local",
      },
    ],
    practice: [
      "A spirit may possess a woman or man, speaking through them and demanding gifts.",
      "The possessed are honored; they become mediums between the human and spirit world.",
      "A drum calls the bori to gather; they dance and are fed.",
      "Some spirits bring illness; a healer negotiates with them on behalf of the sick.",
    ],
    specialist:
      "The mai bori (spirit medium) and the magajiya (priestess who leads the bori cult).",
    afterlife:
      "A person of power may become a spirit after death, joining the bori.",
    evidence: {
      status: "documented",
      claim:
        "Hausa bori spirit possession, the role of mediums and priestesses, and the relationship to pre-Islamic Hausa religion are documented in early colonial records and in twentieth-century ethnography.",
      sources: [
        "Besmer, Horses of God",
        "Masquelier, Prayer Has Spoiled Everything",
        "Masquelier, Dirt, Undress, and Difference",
      ],
      limitation:
        "Bori remained most robust in rural areas as Islam took hold of Hausa cities from 1500 onward. This entry represents the pre-Islamic or minimally Islamic form.",
    },
  },
  {
    id: "hausa-islamic",
    label: "Hausa Islam with older layered practice",
    scope: { years: [1500, 1900], bounds: [-4, 10, 18, 18] },
    powers: [
      {
        name: "Allah",
        domain: "the one god, ultimate power",
        rank: "paramount",
      },
      {
        name: "The Prophet Muhammad",
        domain: "the messenger, intercession",
        rank: "major",
      },
      {
        name: "Angels",
        domain: "the divine will, protection",
        rank: "major",
      },
      {
        name: "The Qur'an",
        domain: "divine speech and power",
        rank: "major",
      },
      {
        name: "Saints",
        domain: "spiritual power, blessing",
        rank: "major",
      },
      {
        name: "The jinn",
        domain: "supernatural beings, trouble and protection",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the family's own dead",
        rank: "local",
      },
      {
        name: "Market spirits",
        domain: "the prosperity and dangers of trade",
        rank: "local",
      },
    ],
    practice: [
      "Five daily prayers face Mecca; the mosque gathers the town.",
      "Verses from the Qur'an are worn as protective amulets.",
      "The spirits and the ancestors are respected but not openly worshipped.",
      "Fasting during Ramadan and a pilgrimage to Mecca mark the faithful.",
    ],
    specialist: "The mallam (Islamic scholar) and the imam (mosque leader).",
    afterlife:
      "The resurrection and judgment before Allah; paradise for the faithful and the damned.",
    evidence: {
      status: "documented",
      claim:
        "Hausa Islam from the fifteenth century onward is well attested. Older spirit practices persisted in rural areas and in women's domains (bori), but urban Hausa Islam dominated official life by 1800.",
      sources: [
        "Levtzion, Islam in West Africa",
        "Masquelier, Prayer Has Spoiled Everything",
        "Cohen, Custom and Politics in Urban Africa",
      ],
      limitation:
        "Islamic and older practices coexisted in tension. This entry reflects the official urban form; see hausa-bori for the persistent older layer.",
    },
  },
  {
    id: "fon-vodun",
    label: "Fon and Dahomey vodun",
    scope: { years: [1400, 1900], bounds: [-4, 4, 8, 14] },
    powers: [
      {
        name: "Mawu-Lisa",
        domain: "the high god and creator",
        rank: "paramount",
      },
      {
        name: "Legba",
        domain: "crossroads, boundaries, trickster and opener of the way",
        rank: "major",
      },
      {
        name: "Gu",
        domain: "war, iron, metalwork",
        rank: "major",
      },
      {
        name: "Aja",
        domain: "hunting, the bush, wild things",
        rank: "major",
      },
      {
        name: "Oshun",
        domain: "rivers, women, fertility",
        rank: "major",
      },
      {
        name: "Agbe",
        domain: "wealth and the sea",
        rank: "major",
      },
      {
        name: "Tohosou",
        domain: "the royal ancestors and the ancestors of the land",
        rank: "local",
      },
      {
        name: "The vodun",
        domain: "household spirits and shrines",
        rank: "local",
      },
      {
        name: "Hevioso",
        domain: "thunder and the sky",
        rank: "local",
      },
    ],
    practice: [
      "Legba is greeted first at every shrine; no power can be approached without him.",
      "Certain days of the week belong to certain vodun and are marked with food and rest.",
      "Blood from a sacrificed animal feeds the spirits and seals a pact.",
      "A vodun priest enters trance, speaking for the spirits to those gathered.",
    ],
    specialist:
      "The vodunon (vodun priest or priestess) or the hunon (head of the household shrine).",
    afterlife:
      "The dead return to their vodun; the living must keep them fed and honored.",
    evidence: {
      status: "documented",
      claim:
        "The Fon and Dahomey vodun pantheon with Mawu-Lisa as paramount, Legba's gatekeeper role, and spirit possession by vodun are well attested in colonial-era accounts and in twentieth-century Fon and Ewe ethnography.",
      sources: [
        "Herskovits, Dahomey",
        "Gaba, Prophets of the Dead",
        "Blakely, Dispossessing the Spirits of the Waters",
      ],
      limitation:
        "The Fon and related Ewe peoples shared this broad system; local detail and emphasis varied by town and by era.",
    },
  },
  {
    id: "kongo-nkisi",
    label: "Kongo nkisi and ancestral power",
    scope: { years: [1450, 1850], bounds: [10, -10, 28, 5] },
    powers: [
      {
        name: "Nzambi",
        domain: "the high god, the creator",
        rank: "paramount",
      },
      {
        name: "The nkisi",
        domain: "spirits bound in objects, healing and justice",
        rank: "major",
      },
      {
        name: "Mbumba",
        domain: "the rainbow and the waters",
        rank: "major",
      },
      {
        name: "Tombe",
        domain: "lightning and divine wrath",
        rank: "major",
      },
      {
        name: "Kalunga",
        domain: "the boundary between the living and the dead",
        rank: "major",
      },
      {
        name: "The baloji",
        domain: "the ancestors, the family's own dead",
        rank: "local",
      },
      {
        name: "Mpemba",
        domain: "the land of the dead, and the spirits of the departed",
        rank: "local",
      },
      {
        name: "The Knifu",
        domain: "the royal ancestors",
        rank: "local",
      },
      {
        name: "Place spirits",
        domain: "the guardian powers of river, forest and settlement",
        rank: "local",
      },
    ],
    practice: [
      "An nkisi—a figure carved of wood or clay, with medicines sewn inside—holds a spirit and seals oaths.",
      "The spirit in the nkisi may judge one who breaks an oath, or protect the village.",
      "The ancestors are called to bless a marriage or a child.",
      "The dead cross the Kalunga into Mpemba; the living pour water at the grave to refresh them.",
    ],
    specialist:
      "The nganga (healer and nkisi-maker) and the family head with the ancestors.",
    afterlife:
      "Death is a passage under Kalunga into Mpemba, a shadow world where the ancestors dwell and can aid the living.",
    evidence: {
      status: "documented",
      claim:
        "Kongo nkisi objects, the nkisi spirit-makers' role, and the Kalunga boundary are attested in sixteenth-century Portuguese accounts and in twentieth-century Kongo ethnography; the veneration of ancestors through libation is well documented.",
      sources: [
        "Janzen and MacGaffey, An Anthology of Kongo Religion",
        "MacGaffey, Religion and Society in Central Africa",
        "Thornton, The Kongolese Saint Anthony",
      ],
      limitation:
        "Portuguese and other foreign accounts from the sixteenth century onward shape what we know; there is no written Kongo record from before contact.",
    },
  },
  {
    id: "central-forest-spirits",
    label: "Central African forest spirits and earth power",
    scope: { years: [1000, 1800], bounds: [2, -10, 32, 8] },
    powers: [
      {
        name: "The creator",
        domain: "the high god, rarely named or addressed",
        rank: "paramount",
      },
      {
        name: "Enuma",
        domain: "the earth, growth and death",
        rank: "major",
      },
      {
        name: "The forest",
        domain: "the wilderness, animals, medicine",
        rank: "major",
      },
      {
        name: "The waters",
        domain: "healing, danger, initiation",
        rank: "major",
      },
      {
        name: "Lightning",
        domain: "divine power and punishment",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the lineage's own dead, protection",
        rank: "local",
      },
      {
        name: "The night",
        domain: "dreams, the other world",
        rank: "local",
      },
      {
        name: "The village boundary",
        domain: "protection and danger",
        rank: "local",
      },
    ],
    practice: [
      "The earth receives the first portions of game and grain.",
      "A river crossing or a night in the forest is approached with respect and prayer.",
      "Dreams carry messages from the ancestors and the other world.",
      "Boys and girls undergo initiation in the forest, learning the knowledge held by water or earth.",
    ],
    specialist:
      "Elders and initiated persons teach the young; healers address the spirits.",
    afterlife:
      "The dead join the ancestors; their names are called and their memory is kept in the living.",
    evidence: {
      status: "hypothesis",
      claim:
        "Central African forest-dwelling peoples possessed earth-centered and animistic systems before intensive colonization. The specifics are inferred from scattered colonial reports and from later ethnography of surviving systems.",
      sources: [
        "Turnbull, The Forest People",
        "Rey, The Network of the Gods",
        "Kisliuk, Seizing the Dance",
      ],
      limitation:
        "No written sources predate colonization; this entry is based on twentieth-century ethnography projected back and on colonial observations. The named powers are descriptive rather than recovered proper names.",
    },
  },
  {
    id: "atlantic-trade-era",
    label: "Atlantic trade era adaptation",
    scope: { years: [1600, 1850], bounds: [-18, -10, 32, 20] },
    powers: [
      {
        name: "The ancestors",
        domain: "protection, guidance, the land",
        rank: "paramount",
      },
      {
        name: "The high god",
        domain: "the creator, often distant",
        rank: "major",
      },
      {
        name: "Water spirits",
        domain: "the sea, trade, danger and opportunity",
        rank: "major",
      },
      {
        name: "The king or chief",
        domain: "authority, order, trade partnership",
        rank: "major",
      },
      {
        name: "Trading spirits",
        domain: "profit, safe passage, wealth",
        rank: "local",
      },
      {
        name: "Protective charms and medicines",
        domain: "personal safety in perilous times",
        rank: "local",
      },
      {
        name: "The sacred site",
        domain: "community identity, gathering place",
        rank: "local",
      },
      {
        name: "The smith",
        domain: "metalwork, weapons, power",
        rank: "local",
      },
      {
        name: "Warrior spirits",
        domain: "strength, raid defense, conflict",
        rank: "local",
      },
    ],
    practice: [
      "Trade goods and guns are accepted; new spirits associated with wealth emerge.",
      "The ancestors remain central; offerings increase to protect the household through danger.",
      "Protective amulets and medicines intensify; coastal peoples develop sea-crossing rituals.",
      "The chief's authority expands as trade wealth centralizes; his connection to power deepens.",
    ],
    specialist:
      "The chief and trading delegations; specialists in protective medicines; priests at ancestral shrines.",
    afterlife:
      "The ancestors watch the trade; the dead protect their lineage as wealth flows.",
    evidence: {
      status: "inferred",
      claim:
        "Atlantic trade intensified 1600-1850; coastal kingdoms show evidence of wealth concentration and chiefly power; European accounts describe elaborate ceremonies and expanded ritual specialists.",
      sources: [
        "Eltis and Richardson, Atlas of the Transatlantic Slave Trade",
        "Thornton, Africa and Africans in the Making of the Atlantic World",
        "Curtin, The Atlantic Slave Trade",
      ],
      limitation:
        "Trade's spiritual impact is reconstructed from archaeology, European accounts, and oral tradition; direct sources on belief are scarce. The entry schematizes rapid and uneven changes.",
    },
  },
  {
    id: "colonial-period",
    label: "Colonial period and Christian expansion",
    scope: { years: [1850, 1950], bounds: [-18, -10, 32, 20] },
    powers: [
      {
        name: "God",
        domain: "the Christian God, often aligned with colonial authority",
        rank: "paramount",
      },
      {
        name: "The colonial state",
        domain: "new law, authority, disruption",
        rank: "major",
      },
      {
        name: "Jesus Christ",
        domain: "redemption, mission teaching",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the lineage, now under pressure",
        rank: "major",
      },
      {
        name: "The mission church",
        domain: "education, healing, new community",
        rank: "local",
      },
      {
        name: "The older spirits",
        domain: "contested power, resistance or syncretism",
        rank: "local",
      },
      {
        name: "School and learning",
        domain: "new knowledge, literacy, change",
        rank: "local",
      },
      {
        name: "The district officer",
        domain: "imposed authority, law",
        rank: "local",
      },
      {
        name: "Money and trade",
        domain: "new economy, wage labor",
        rank: "local",
      },
    ],
    practice: [
      "Mission schools teach reading and arithmetic alongside Christian doctrine.",
      "Sunday churches gather alongside older shrines; many people participate in both.",
      "The colonial administration imposes laws that override local custom.",
      "The ancestors are invoked for protection against new troubles and change.",
    ],
    specialist:
      "European missionaries and African pastors; colonial administrators; traditional elders in contested authority.",
    afterlife:
      "Christian heaven and judgment, but ancestor veneration persists in private.",
    evidence: {
      status: "documented",
      claim:
        "Colonial expansion accelerated Christian mission from 1850 onward. By 1900, mission stations were widespread. People navigated between mission teaching, colonial authority, and older practice through adaptation and resistance.",
      sources: [
        "Ajayi, Christian Missions in Nigeria",
        "Ferguson, The Anti-Politics Machine",
        "Cooper, Colonialism in Question",
      ],
      limitation:
        "This entry schematizes rapid, traumatic change across the region. Local responses varied from conversion to resistance to syncretic blending.",
    },
  },
  {
    id: "yoruba-nineteenth-century-christian",
    label: "Yoruba Christian mission encounter",
    scope: { years: [1850, 1920], bounds: [-2, 2, 10, 14] },
    powers: [
      {
        name: "God",
        domain: "the creator and judge",
        rank: "paramount",
      },
      {
        name: "Jesus Christ",
        domain: "redemption, sacrifice, incarnate god",
        rank: "major",
      },
      {
        name: "The Holy Spirit",
        domain: "healing, prophecy, indwelling power",
        rank: "major",
      },
      {
        name: "Angels",
        domain: "divine servants and protectors",
        rank: "major",
      },
      {
        name: "The Virgin Mary",
        domain: "motherhood, intercession",
        rank: "major",
      },
      {
        name: "Saints",
        domain: "powerful dead, intercession",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the family's own dead, still present",
        rank: "local",
      },
      {
        name: "The orisha",
        domain: "older powers, reinterpreted or resisted",
        rank: "local",
      },
    ],
    practice: [
      "Sunday worship in a church; hymns sung together invoke power.",
      "Baptism and communion are central sacraments; they remake the person.",
      "The Bible is read aloud; Jesus's stories are learned.",
      "Some convert fully; others keep orisha practice in parallel with church attendance.",
    ],
    specialist: "African pastors and European missionaries lead churches.",
    afterlife:
      "Judgment before God; heaven for the faithful, damnation for the lost.",
    evidence: {
      status: "documented",
      claim:
        "Christian missions arrived in Yorubaland from the 1840s onward; Anglican and Methodist churches established by the 1870s. Yoruba theologians and pastors led churches from the 1880s, often syncretically blending Christian and orisha practice.",
      sources: [
        "Ajayi, Christian Missions in Nigeria",
        "Peel, Religious Encounter and the Making of the Yoruba",
        "Oduyokan, The Sons of the Gods",
      ],
      limitation:
        "The Christian entry was rapid in coastal areas, slower inland. This reflects an urban, missionary-influenced form; many Yoruba maintained orisha practice alongside or instead of Christianity.",
    },
  },
];
