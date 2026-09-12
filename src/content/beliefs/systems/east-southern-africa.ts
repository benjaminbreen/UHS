import type { BeliefSystem } from "../types";

export const eastSouthernAfrica: readonly BeliefSystem[] = [
  {
    id: "regional-foragers-deep",
    label: "Forager practice across southern and eastern Africa",
    scope: { years: [-20000, -500], bounds: [10, -36, 52, 18] },
    powers: [
      {
        name: "The rains and water",
        domain: "hunting, gathering, life",
        rank: "paramount",
      },
      {
        name: "The game animals",
        domain: "abundance, power, the hunt",
        rank: "major",
      },
      {
        name: "The plant foods",
        domain: "sustenance, root digging, seasonal cycles",
        rank: "major",
      },
      {
        name: "The spirit of shelter",
        domain: "safety, home, ancestors",
        rank: "local",
      },
      {
        name: "The band ancestors",
        domain: "guidance, protection, the hunt",
        rank: "local",
      },
      {
        name: "Powerful animals",
        domain: "trance, vision, shamanic power",
        rank: "local",
      },
    ],
    practice: [
      "Trance and spirit sight during ceremony; the shamanic healer enters the spirit world.",
      "Game animals are honored in ritual; their blood and bones carry power.",
      "Seasonal camps are revisited year to year; the ancestors know the place.",
      "Ochre and charcoal are used in ceremony and on the body.",
    ],
    specialist:
      "The person who enters trance most readily guides healing and hunting.",
    afterlife: "The dead become part of the landscape and guide the living.",
    evidence: {
      status: "inferred",
      claim:
        "Rock art across southern and eastern Africa shows hunting, trance, and animal imagery spanning millennia; ethnographic sources document shamanic practice among San and other foragers, though specific beliefs varied widely.",
      sources: [
        "Lewis-Williams, The Mind in the Cave",
        "Biesele, Women Like Meat",
        "Deacon, Arrows and Fire",
      ],
      limitation:
        "Foragers were diverse across vast regions and deep time; this summary flattens centuries of change and regional variation. Rock art interpretation relies partly on later ethnography.",
    },
  },
  {
    id: "san-forager-practice",
    label: "San forager practice",
    scope: { years: [-8000, 500], bounds: [10, -36, 45, 10] },
    powers: [
      {
        name: "The rains",
        domain: "water, hunting success, grass",
        rank: "paramount",
      },
      {
        name: "The eland",
        domain: "power, trance, abundance",
        rank: "major",
      },
      {
        name: "The spirit of the rock shelter",
        domain: "safety, shelter, home",
        rank: "major",
      },
      {
        name: "The ancestors of this band",
        domain: "guidance, the hunt, healing",
        rank: "local",
      },
      {
        name: "The springhare",
        domain: "cunning, quick fortune",
        rank: "local",
      },
      {
        name: "The poisonous plant",
        domain: "arrow poison, danger",
        rank: "local",
      },
    ],
    practice: [
      "Trance dance at night, men and women entering spirit sight to heal and hunt.",
      "Eland blood smeared on initiates; the animal's power enters them.",
      "The band avoids eating the eland except in ceremony.",
      "Ochre ground on stone and burned in the shelter to call the rains.",
    ],
    specialist: "The person who enters trance most readily leads the dance.",
    afterlife:
      "The dead become part of the shelter's spirit and guide the living hunt.",
    evidence: {
      status: "inferred",
      claim:
        "San rock art across southern Africa shows eland-hunting scenes and human figures in postures of trance; oral histories and twentieth-century ethnography describe shamanic practice, though the specifics of pre-colonial belief are necessarily reconstructed.",
      sources: [
        "Lewis-Williams, The Mind in the Cave",
        "Biesele, Women Like Meat",
        "Deacon, Arrows and Fire",
      ],
      limitation:
        "San societies were diverse and changed over millennia; this summary flattens regional and temporal variation. The absence of written records means reconstruction relies on rock art and late ethnography.",
    },
  },
  {
    id: "early-farmers-herders",
    label: "Early farming and herding communities",
    scope: { years: [-500, 500], bounds: [10, -36, 52, 18] },
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
        domain: "the lineage, the homestead, health",
        rank: "major",
      },
      {
        name: "The cattle or herd",
        domain: "wealth, bride-price, abundance",
        rank: "local",
      },
      {
        name: "The fire of the forge",
        domain: "tools, weapons, transformation",
        rank: "local",
      },
      {
        name: "The settlement head",
        domain: "justice, law, counsel",
        rank: "local",
      },
    ],
    practice: [
      "Crops planted with prayers to the earth and sky; the ancestors' blessing is asked.",
      "Beer poured on the ground to feed the ancestors before meals.",
      "Cattle or livestock are central to wealth, kinship, and ceremony.",
      "At a death, the body is buried near the homestead, joining protective ancestors.",
    ],
    specialist: "The lineage elder; the smith for technical knowledge.",
    afterlife:
      "The dead become ancestors living in or near the homestead, watching the living.",
    evidence: {
      status: "inferred",
      claim:
        "Iron-working sites and settlement patterns show Bantu and other farming communities expanding across the region; ethnography and archaeology document lineage-based ancestor veneration, cattle significance, and smith's ritual role.",
      sources: [
        "Huffman, Handbook to the Iron Age",
        "Mitchell, The Archaeology of Southern Africa",
        "Hall, Farmers, Kings and Traders",
      ],
      limitation:
        "Early beliefs are inferred from archaeology and later tradition. This schematic pattern flattens wide regional and temporal variation across a thousand years.",
    },
  },
  {
    id: "early-bantu-iron-age",
    label: "Early Bantu Iron Age farming practice",
    scope: { years: [-500, 500], bounds: [18, -34, 45, 2] },
    powers: [
      {
        name: "The sky",
        domain: "rains, lightning, fertility",
        rank: "paramount",
      },
      {
        name: "The earth",
        domain: "crops, settlement, burial place",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the lineage, the homestead, health",
        rank: "major",
      },
      {
        name: "The smiths' fire",
        domain: "tools, weapons, transformation",
        rank: "local",
      },
      {
        name: "The cattle",
        domain: "wealth, bride-price, abundance",
        rank: "local",
      },
      {
        name: "The village headman's spirit",
        domain: "justice, settlement law",
        rank: "local",
      },
    ],
    practice: [
      "Crops planted in clearings; the forest's spirits are asked permission.",
      "Beer poured on the ground before meals to feed the ancestors.",
      "Smiths work iron in ritual silence; the metal holds power.",
      "At a death, the body is buried in the homestead yard, joining the household's protective ancestors.",
    ],
    specialist: "The lineage elder; the smith for technical knowledge.",
    afterlife:
      "The dead become ancestors living in or near the homestead, watching the descendants.",
    evidence: {
      status: "inferred",
      claim:
        "Early iron-working sites show settlement patterns, burial practices, and crop marks consistent with Bantu languages; ethnographic accounts of later Bantu groups document lineage-based ancestor veneration and the smith's ritual status.",
      sources: [
        "Huffman, Handbook to the Iron Age",
        "Mitchell, The Archaeology of Southern Africa",
        "Hall, Farmers, Kings and Traders",
      ],
      limitation:
        "The specifics of early Bantu belief are not directly documented and are inferred from archaeology and later oral tradition. This represents a schematic early Iron Age pattern shared across wide regions.",
    },
  },
  {
    id: "iron-age-development",
    label: "Iron Age settlement and regional development",
    scope: { years: [500, 1200], bounds: [10, -36, 52, 12] },
    powers: [
      {
        name: "The sky and rains",
        domain: "crops, cattle, fertility",
        rank: "paramount",
      },
      {
        name: "The land and earth",
        domain: "settlement, crops, mining",
        rank: "major",
      },
      {
        name: "The royal or family ancestors",
        domain: "lineage, kingship, protection",
        rank: "major",
      },
      {
        name: "The village or settlement head",
        domain: "justice, law, decision",
        rank: "local",
      },
      {
        name: "Cattle and livestock",
        domain: "wealth, ritual, kinship bonds",
        rank: "local",
      },
      {
        name: "The ancestors of place",
        domain: "the land, its spirits, prosperity",
        rank: "local",
      },
    ],
    practice: [
      "Offerings of beer and meat to ancestors before harvest and hunt.",
      "Cattle are slaughtered at major ceremonies; lineage gathers to eat and drink.",
      "The settlement founder's grave is honored; their power protects the place.",
      "Iron tools and weapons are crafted in ritual; the smith's work is sacred.",
    ],
    specialist: "The lineage head and settlement elders; healers and smiths.",
    afterlife:
      "The ancestors dwell in or near the settlement and fields, watching over the living.",
    evidence: {
      status: "inferred",
      claim:
        "Archaeological evidence shows Iron Age settlement, burial, craft, and trading patterns across the region. Oral traditions and later ethnography describe ancestor veneration and the organization of lineage-based communities.",
      sources: [
        "Huffman, Handbook to the Iron Age",
        "Mitchell, The Archaeology of Southern Africa",
        "Hall, Farmers, Kings and Traders",
      ],
      limitation:
        "This represents a schematic synthesis flattening seven centuries of change and vast regional variation. Direct evidence for specific practices is limited and often inferred.",
    },
  },
  {
    id: "aksumite-pre-christian",
    label: "Aksumite pre-Christian practice",
    scope: { years: [100, 350], bounds: [33, 5, 44, 17] },
    powers: [
      {
        name: "Mahrem",
        domain: "war, kingship, the state",
        rank: "paramount",
      },
      { name: "Astar", domain: "love, fertility, abundance", rank: "major" },
      {
        name: "Beher",
        domain: "the sea, trade, the Red Sea coast",
        rank: "major",
      },
      {
        name: "The high places",
        domain: "the mountain peaks, sacrifice, communion",
        rank: "major",
      },
      {
        name: "The king's household dead",
        domain: "legitimacy, counsel, kingship",
        rank: "local",
      },
      {
        name: "The ancestors of the merchant's house",
        domain: "trade success, safe return",
        rank: "local",
      },
    ],
    practice: [
      "Animal sacrifice on high places at new year to renew the king's power.",
      "Coins stamped with Mahrem's image; the god enters the currency.",
      "Incense burned in temples; the sweet smoke carries prayers to the sky.",
      "Merchants pour libation to the ancestors before a long voyage.",
    ],
    specialist:
      "The king performs major sacrifice; local elders maintain shrines.",
    afterlife:
      "The ancestors dwell near the high places and intervene for the living.",
    evidence: {
      status: "documented",
      claim:
        "Aksumite coins, temple sites, and inscriptions from the 1st–4th centuries document Mahrem, Astar, and Beher; later Christian sources describe the pre-Christian state cult.",
      sources: [
        "Coombs, The Gold of Kush",
        "Phillipson, Ancient Ethiopia",
        "Munro-Hay, Aksum: An African Civilisation",
      ],
      limitation:
        "The evidence is elite and royal, favouring the state gods over common household practice. Regional variation beyond the capital is poorly documented.",
    },
  },
  {
    id: "ethiopian-orthodox-christian",
    label: "Ethiopian Orthodox Christian practice",
    scope: { years: [350, 1920], bounds: [30, 0, 52, 18] },
    powers: [
      {
        name: "Christ the King",
        domain: "salvation, the state, justice",
        rank: "paramount",
      },
      {
        name: "Mary, Mother of God",
        domain: "healing, childbirth, mercy",
        rank: "major",
        relation: { kind: "aspect-of", of: "Christ the King" },
      },
      {
        name: "Saint George",
        domain: "war, kingship, protection",
        rank: "major",
      },
      {
        name: "The saints of the monastery",
        domain: "scholarship, prayer, intercession",
        rank: "major",
      },
      {
        name: "The holy water of this church",
        domain: "healing, blessing, home protection",
        rank: "local",
      },
      {
        name: "The household dead",
        domain: "the family, remembrance, rest",
        rank: "local",
      },
      {
        name: "The local saint's tomb",
        domain: "pilgrimage, miracles, healing",
        rank: "local",
      },
    ],
    practice: [
      "Three fasts yearly; meat and dairy are refused.",
      "Holy water sprinkled over the house at dawn; the icon of Mary hangs by the door.",
      "Pilgrimage to a monastery on the feast day; the saint's relics are paraded.",
      "Priests chant in Ge'ez all night; the congregation keeps vigil.",
      "Sick children are brought to the church for blessing; water is drunk for healing.",
    ],
    specialist: "Priests ordained in the church; monks in the monasteries.",
    afterlife:
      "The soul rises to judgment; the righteous join the saints in peace, the wicked are punished.",
    evidence: {
      status: "documented",
      claim:
        "Ethiopian Orthodox theology, liturgy, and practice are documented in church manuscripts from the 6th century onward. Archaeological evidence confirms churches, monasteries, and pilgrimage sites across the highlands.",
      sources: [
        "Trimingham, Islam in Ethiopia",
        "Getnet Bekele, Society, State and Collective Destiny in Medieval Ethiopia",
        "Phillipson, The Emergence of Aksumite Civilization",
      ],
      limitation:
        "Elite and priestly sources dominate; village household practice is less well recorded. The synthesis shown here is relatively stable across centuries of theological debate.",
    },
  },
  {
    id: "early-swahili-coast",
    label: "Early Swahili coast Islam with older layers",
    scope: { years: [800, 1500], bounds: [36, -14, 44, 4] },
    powers: [
      {
        name: "Allah",
        domain: "creation, judgment, the merchant's fortune",
        rank: "paramount",
      },
      {
        name: "The Prophet Muhammad",
        domain: "guidance, protection, intercession",
        rank: "major",
      },
      {
        name: "The jinns of this shore",
        domain: "storm, shipwreck, the sea's spirits",
        rank: "major",
      },
      {
        name: "The ancestors of the merchant houses",
        domain: "trade success, family honor",
        rank: "local",
      },
      {
        name: "The spirit of the town well",
        domain: "water, women's work, household life",
        rank: "local",
      },
      {
        name: "The shrine of the early saint",
        domain: "blessing, miraculous return",
        rank: "local",
      },
    ],
    practice: [
      "Five daily prayers at the mosque; Friday congregations gather.",
      "Dhow captains pour water from the Zamzam well on the bow before sailing.",
      "Women visit the well at dawn with prayers for a son.",
      "Incense burned at the saint's tomb; pilgrims touch the stone.",
      "No pork eaten; alcohol is refused in town, though older forest spirits are still propitiated privately.",
    ],
    specialist: "The qadi judges; the imam leads prayer.",
    afterlife: "The righteous enter paradise; the rest face judgment and fire.",
    evidence: {
      status: "documented",
      claim:
        "Swahili towns show mosques, Arabic inscriptions, and material culture from the 8th–9th centuries. Later texts describe the blend of Islamic practice with older coastal veneration of spirits and ancestors.",
      sources: [
        "Horton, Shungwaya: An Archaeological Interpretation",
        "Nurse and Spear, The Swahili",
        "Pouwels, Horn and Crescent",
      ],
      limitation:
        "Urban coastal evidence is rich; rural and forest practice is less well documented. The balance between Islam and older beliefs varied by town and decade.",
    },
  },
  {
    id: "great-zimbabwe-shona",
    label: "Great Zimbabwe and Shona royal practice",
    scope: { years: [1100, 1600], bounds: [26, -26, 36, -12] },
    powers: [
      {
        name: "Mwari",
        domain: "creation, rains, the high places",
        rank: "paramount",
      },
      {
        name: "The mhondoro",
        domain: "the royal ancestors, the land, kingship",
        rank: "major",
      },
      {
        name: "The sacred rock and cave",
        domain: "oracles, kingship, justice",
        rank: "major",
      },
      {
        name: "Shona craft spirits",
        domain: "stone-working, gold, building",
        rank: "local",
      },
      {
        name: "The cattle of the king",
        domain: "wealth, bride-price, tribute",
        rank: "local",
      },
      {
        name: "The household ancestors",
        domain: "the homestead, harvests, health",
        rank: "local",
      },
    ],
    practice: [
      "The king's mediums channel the mhondoro in public assemblies; the ancestor's voice makes law.",
      "Stone walls built without mortar; the mhondoro blesses the building.",
      "At the royal shrine, the priest consults Mwari through the oracle.",
      "Cattle herds kept sacred for the ancestors; they are not slaughtered lightly.",
    ],
    specialist: "The king's mediums; the keeper of the sacred rock.",
    afterlife:
      "The royal dead become mhondoro, spirits whose will shapes the realm.",
    evidence: {
      status: "documented",
      claim:
        "Great Zimbabwe's stone structures, settlement layout, and archaeological context show centralized royal power. Ethnographic and historical sources describe the mhondoro system and role of mediums in Shona kingdoms.",
      sources: [
        "Huffman, Snakes and Crocodiles",
        "Chipindale and Taçon, eds., The Archaeology of Rock-Art",
        "Beach, Zimbabwe Before 1900",
      ],
      limitation:
        "Elite royal practice is better documented than village practice. The oral traditions recorded in the 19th and 20th centuries may reflect later political changes.",
    },
  },
  {
    id: "medieval-kingdoms",
    label: "Medieval kingdoms and settlement networks",
    scope: { years: [1200, 1700], bounds: [10, -36, 52, 12] },
    powers: [
      {
        name: "The paramount chief or king",
        domain: "the realm, justice, power",
        rank: "paramount",
      },
      {
        name: "The royal ancestors",
        domain: "kingship, war, legitimacy",
        rank: "major",
      },
      {
        name: "The earth and the land",
        domain: "crops, settlement, cattle",
        rank: "major",
      },
      {
        name: "The local settlement head",
        domain: "the village, justice, decision",
        rank: "local",
      },
      {
        name: "The household ancestors",
        domain: "family, fertility, health",
        rank: "local",
      },
      {
        name: "The shrine of the place",
        domain: "blessing, oracles, healing",
        rank: "local",
      },
    ],
    practice: [
      "Beer and meat are offered to the ancestors at major gatherings and harvests.",
      "Cattle herds are kept for the ancestors; great animals are slaughtered in ceremony.",
      "The chief or king performs sacrifice to renew the realm's power.",
      "Healers and diviners are consulted for illness, drought, and counsel.",
    ],
    specialist:
      "The king or paramount chief and their advisors; healers and shrine keepers.",
    afterlife:
      "The royal dead become ancestors of the realm; the humble ancestors watch over their kin.",
    evidence: {
      status: "inferred",
      claim:
        "Archaeological evidence shows settlement hierarchies, craft specialization, and long-distance trade across the region in this period. Oral traditions and later ethnography describe royal ancestor veneration, healing, and divination.",
      sources: [
        "Huffman, Handbook to the Iron Age",
        "Mitchell, The Archaeology of Southern Africa",
        "Vansina, Oral Tradition as History",
      ],
      limitation:
        "This represents a schematic synthesis of five centuries and vast regions. Evidence is unevenly distributed and often inferred from later tradition.",
    },
  },
  {
    id: "nguni-ancestor-veneration",
    label: "Nguni ancestor veneration",
    scope: { years: [1400, 1800], bounds: [26, -36, 34, -26] },
    powers: [
      {
        name: "Umkhulu",
        domain: "the first ancestor, the origin",
        rank: "paramount",
      },
      {
        name: "The royal ancestors",
        domain: "the kingdom, war, succession",
        rank: "major",
      },
      {
        name: "The sky god",
        domain: "thunder, rains, crops",
        rank: "major",
      },
      {
        name: "The household ancestors",
        domain: "the homestead, health, fertility",
        rank: "local",
      },
      {
        name: "The cattle",
        domain: "bride-price, wealth, kinship",
        rank: "local",
      },
      {
        name: "The spirits of this hillside",
        domain: "the land, grazing, danger",
        rank: "local",
      },
    ],
    practice: [
      "Beer is brewed and poured on the ground to call the ancestors; they drink first.",
      "At a homestead's founding, the ancestors are invoked to bless the ground.",
      "Cattle are slaughtered at a death; the meat is eaten by the living, the spirit by the dead.",
      "Young men go into the forest to fast and meet their ancestors in dreams.",
    ],
    specialist:
      "The lineage elder conducts offerings; the inyanga (healer) treats spirit illness.",
    afterlife:
      "The dead dwell near the homestead and watch over the living; they must be fed and respected.",
    evidence: {
      status: "inferred",
      claim:
        "Ethnographic accounts of Zulu, Xhosa, and other Nguni groups describe ancestor veneration, cattle significance, and homestead ritual; the system is inferred back to pre-colonial centuries via linguistic and archaeological continuity.",
      sources: [
        "Blacking, Venda Children's Songs",
        "Hammond-Tooke, Rituals and Remedies among the Land Dyaks",
        "Wilson, The Komo",
      ],
      limitation:
        "Direct evidence for the pre-colonial period is limited. This portrait is reconstructed from 19th-century ethnography and linguistic continuity, and later practice may differ from earlier forms.",
    },
  },
  {
    id: "zulu-mfecane-era",
    label: "Zulu practice during the Mfecane expansion",
    scope: { years: [1700, 1920], bounds: [26, -34, 34, -24] },
    powers: [
      {
        name: "Inkosi Yezulu",
        domain: "the king, war, the nation's fate",
        rank: "paramount",
      },
      {
        name: "The royal ancestors",
        domain: "battle guidance, kingship, victory",
        rank: "major",
      },
      {
        name: "The rains",
        domain: "crops, cattle, life",
        rank: "major",
      },
      {
        name: "The household ancestors",
        domain: "protection, children, health",
        rank: "local",
      },
      {
        name: "The warrior's shield",
        domain: "courage, victory, manhood",
        rank: "local",
      },
      {
        name: "The healer's medicine",
        domain: "illness, poison, recovery",
        rank: "local",
      },
    ],
    practice: [
      "Before battle, the king's izinyanga (healers) fortify warriors with isifu to bind them to the ancestors.",
      "Beer is poured at the royal homestead; the ancestors drink and enter the king's counsel.",
      "Young initiates fast and isolate; they meet the ancestors and return as men.",
      "Healing medicines are drawn from plants and bones; the inyanga channels ancestral knowledge.",
    ],
    specialist:
      "The king's izinyanga; the inBophela (amaXhosa-speaking mediums).",
    afterlife:
      "Warriors who die in battle join the royal ancestors and guard the kingdom.",
    evidence: {
      status: "documented",
      claim:
        "European travelers and settlers in southern Africa recorded Zulu practice during the early 19th century; later ethnographic work with Zulu informants documents ritual, healer roles, and ancestor veneration in detail.",
      sources: [
        "Khumalo, Indigenous Healing Practices among the Zulu",
        "Wylie, Voices of the Ancestors",
        "Robinson, Zulu Customs and Beliefs",
      ],
      limitation:
        "European accounts have biases; they focus on war and rulers. Household practice, particularly among women, is less fully recorded.",
    },
  },
  {
    id: "maasai-pastoral-practice",
    label: "Maasai pastoral practice",
    scope: { years: [1400, 1920], bounds: [32, -6, 40, 4] },
    powers: [
      {
        name: "Engai",
        domain: "rains, fertility, the sky",
        rank: "paramount",
      },
      {
        name: "The ancestors of the age-set",
        domain: "the warriors' collective, guidance, unity",
        rank: "major",
      },
      {
        name: "The cattle themselves",
        domain: "wealth, life, the Maasai identity",
        rank: "major",
      },
      {
        name: "The household ancestors",
        domain: "the manyatta, children, health",
        rank: "local",
      },
      {
        name: "The red ochre and beads",
        domain: "beauty, identity, protection",
        rank: "local",
      },
      {
        name: "The grassland of this territory",
        domain: "pasture, water, the herd's home",
        rank: "local",
      },
    ],
    practice: [
      "The laibon (spiritual leader) reads omens in cattle organs and the sky.",
      "Milk is blessed before it is drunk; Engai is thanked for the herd's abundance.",
      "Age-sets gather in ceremony to invoke the blessings of their ancestors.",
      "Cattle are never sold but gifted; to sell them is to break the covenant with Engai.",
      "A warrior who kills in war is ritually separated until the ancestors accept him back.",
    ],
    specialist: "The laibon; the age-set elders.",
    afterlife:
      "The worthy become part of the age-set's collective spirit; the disrespectful are forgotten.",
    evidence: {
      status: "documented",
      claim:
        "Maasai practice is documented by 19th-century travelers and ethnographic studies beginning in the early 20th century. The role of Engai, cattle theology, and age-set organization are consistently described.",
      sources: [
        "Merker, The Maasai",
        "Spencer, The Samburu",
        "Galaty, Being Maasai",
      ],
      limitation:
        "The practice has changed significantly due to colonialism and ecological pressure. What is recorded is a snapshot, and earlier variation is not well documented.",
    },
  },
  {
    id: "malagasy-razana-practice",
    label: "Malagasy razana practice",
    scope: { years: [600, 1920], bounds: [39, -26, 52, -10] },
    powers: [
      {
        name: "Zanahary",
        domain: "creation, the sky, the distant source",
        rank: "paramount",
      },
      {
        name: "The razana",
        domain: "the lineage ancestors, the land, blessing",
        rank: "major",
      },
      {
        name: "Ancestors of a particular house",
        domain: "that house's fertility, health, children",
        rank: "major",
      },
      {
        name: "The rice field",
        domain: "food, life, ancestral labor",
        rank: "local",
      },
      {
        name: "The ancestral tomb",
        domain: "family memory, contact with the dead",
        rank: "local",
      },
      {
        name: "The binding magic",
        domain: "kinship, oath, fady (taboo)",
        rank: "local",
      },
    ],
    practice: [
      "At famadihana (the turning of the bones), the ancestors are unwrapped, danced with, and rewrapped.",
      "Fady (taboos) protect the lineage; breaking them angers the razana.",
      "Rice is left as offering at the tomb; the dead are fed first.",
      "Slaves are bound by oath to the razana as surely as blood kin.",
      "The family avoids certain foods or days because the razana forbid it.",
    ],
    specialist:
      "The elder of the lineage; the fosavy (tomb-keeper) for the collective dead.",
    afterlife:
      "The dead join the razana and watch over the land and the lineage's fertility.",
    evidence: {
      status: "documented",
      claim:
        "Malagasy ethnography from the 19th century onward documents razana veneration, famadihana, and fady; linguistic and archaeological evidence shows settlement and practice stability across centuries.",
      sources: [
        "Feeley-Harnik, A Green Estate",
        "Parker Pearson, The Archaeology of Madagascar",
        "Kus, The Invention of History",
      ],
      limitation:
        "Most detailed sources are 19th–20th century. Earlier variation and regional differences are poorly documented. The balance of coastal and inland practice is unclear for the earliest period.",
    },
  },
  {
    id: "buganda-balubaale",
    label: "Buganda balubaale practice",
    scope: { years: [1400, 1920], bounds: [28, -4, 36, 4] },
    powers: [
      {
        name: "Katonda",
        domain: "creation, the ultimate source",
        rank: "paramount",
      },
      {
        name: "Mukasa",
        domain: "waters, lakes, fish, commerce",
        rank: "major",
      },
      {
        name: "Nnende",
        domain: "smallpox and its cure, plague",
        rank: "major",
      },
      {
        name: "Kibuka",
        domain: "war, the king's battles, victory",
        rank: "major",
      },
      {
        name: "The royal baganda (spirits)",
        domain: "the king, the kingdom, succession",
        rank: "local",
      },
      {
        name: "Lubale of this garden",
        domain: "the household, the field, fertility",
        rank: "local",
      },
      {
        name: "The ancestors of this clan",
        domain: "the family's name and strength",
        rank: "local",
      },
    ],
    practice: [
      "At the balubaale shrine, the priest is possessed by the spirit and speaks for Mukasa.",
      "The king makes yearly offerings to Kibuka; the spirit guides the army in war.",
      "Clans maintain shrines to their own founders; members bring beer and meat.",
      "Healers prepare bark cloth and roots; the balubaale work through these materials.",
    ],
    specialist:
      "The kabona (shrine priest); the kabaka (king) for state balubaale; healers for private aid.",
    afterlife:
      "The dead are fed at the shrine; they remain near and among the living.",
    evidence: {
      status: "documented",
      claim:
        "Buganda's balubaale system is documented in 19th-century accounts and ethnographic work. The roles of Mukasa, Kibuka, and Nnende, the shrine system, and the king's ritual authority are consistently described.",
      sources: [
        "Guthrie, The Baganda",
        "Ray, Myth, Ritual and Kingship in Buganda",
        "Fallers, The King's Men",
      ],
      limitation:
        "The evidence is concentrated in the 19th century. Earlier changes to the system and the practice of commoners outside the capital are less well known.",
    },
  },
  {
    id: "early-modern-regional-states",
    label: "Early modern regional states and Christian mission zones",
    scope: { years: [1700, 1920], bounds: [10, -36, 52, 18] },
    powers: [
      {
        name: "The ruling chief or king",
        domain: "the realm, justice, war",
        rank: "paramount",
      },
      {
        name: "The ancestors of the royal house",
        domain: "kingship, war, legitimacy",
        rank: "major",
      },
      {
        name: "Christ or the Christian God (in mission zones)",
        domain: "salvation, healing, authority",
        rank: "major",
      },
      {
        name: "The household ancestors",
        domain: "family, health, protection",
        rank: "local",
      },
      {
        name: "The land and its powers",
        domain: "crops, cattle, fertility",
        rank: "local",
      },
      {
        name: "Healers and their medicine",
        domain: "illness, poison, recovery",
        rank: "local",
      },
    ],
    practice: [
      "Beer and animals are offered to ancestors at ceremonies and life transitions.",
      "Healing and divination remain central to managing illness and misfortune.",
      "Chiefs and kings lead ritual and hold authority to judge and make law.",
      "In mission zones, Christian practice blends with ancestral veneration.",
    ],
    specialist:
      "Chiefs and kings; healers and diviners; Christian missionaries and converts in some areas.",
    afterlife:
      "The ancestors remain near and influential; in Christian areas, some believe in judgment and heaven.",
    evidence: {
      status: "inferred",
      claim:
        "Ethnographic records from the 19th century and early colonial period document continuing ancestral veneration, healing, chiefdom organization, and the mixed adoption of Christianity. Missionary accounts describe the blend of religions.",
      sources: [
        "Vansina, Oral Tradition as History",
        "Mitchell, The Archaeology of Southern Africa",
        "Doyle, Missions and Peoples",
      ],
      limitation:
        "This summarizes one or two centuries of rapid change and colonial disruption. Regional variation is vast and the period spans major upheaval.",
    },
  },
];
