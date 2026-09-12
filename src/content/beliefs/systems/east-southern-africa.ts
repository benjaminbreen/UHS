import type { BeliefSystem } from "../types";

export const eastSouthernAfrica: readonly BeliefSystem[] = [
  {
    id: "regional-foragers-deep",
    label: "Forager practice across southern and eastern Africa",
    scope: { years: [-20000, -500], bounds: [10, -36, 52, 18] },
    wiki: "https://en.wikipedia.org/wiki/Prehistoric_religion",
    powers: [
      {
        name: "*!Khub",
        gloss:
          "Comparative Khoe root reconstructed for sky and rain, per Khoe-Kwadi historical phonology.",
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
        name: "*Xu",
        gloss:
          "Reconstructed Khoe/Kx'a root for person or forebear, compare the Ju!'hoan self-designation Ju, 'person, people.'",
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
      status: "hypothesis",
      claim:
        "Rock art across southern and eastern Africa shows hunting, trance, and animal imagery spanning millennia; ethnographic sources document shamanic practice among San and other foragers, though specific beliefs varied widely and no names survive from this deep span. *!Khub and *Xu are comparative Khoe-family reconstructions used here to stand in for that missing vocabulary.",
      sources: [
        "Lewis-Williams, The Mind in the Cave",
        "Biesele, Women Like Meat",
        "Deacon, Arrows and Fire",
        "Vossen, ed., The Khoesan Languages",
      ],
      limitation:
        "The starred forms are comparative reconstructions of vocabulary, not recovered theonyms: nobody is recorded speaking them, and a word for sky is not evidence of a sky god by that name. The Khoe family itself is reconstructable only a few thousand years deep, far short of this entry's opening date of -20000; the forms are carried back anyway as the best available proxy. Foragers were diverse across vast regions and deep time; this summary flattens centuries of change and regional variation.",
    },
  },
  {
    id: "san-forager-practice",
    label: "San forager practice",
    scope: { years: [-8000, 500], bounds: [10, -36, 45, 10] },
    wiki: "https://en.wikipedia.org/wiki/San_religion",
    powers: [
      {
        name: "ǀKaggen",
        wiki: "https://en.wikipedia.org/wiki/%C7%80Kaggen",
        domain: "creation, trickery, the mantis",
        rank: "paramount",
      },
      {
        name: "Hishe",
        domain: "the sky, rain, the high places",
        rank: "major",
      },
      {
        name: "Gǁawama",
        domain: "the earth, ill fortune, the setting sun",
        rank: "major",
        relations: [{ kind: "rival-of", of: "Hishe" }],
      },
      {
        name: "The eland",
        domain: "power, trance, abundance",
        rank: "major",
      },
      {
        name: "*Xu",
        gloss:
          "Reconstructed Khoe/Kx'a root for person or forebear, compare the Ju!'hoan self-designation Ju, 'person, people.'",
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
      {
        name: "The spirit of the rock shelter",
        domain: "safety, shelter, home",
        rank: "local",
      },
    ],
    practice: [
      "Trance dance at night, men and women entering spirit sight to heal and hunt.",
      "Eland blood smeared on initiates; the animal's power enters them.",
      "The band avoids eating the eland except in ceremony.",
      "The trance healer calls on Hishe for rain and turns aside Gǁawama's ill fortune.",
    ],
    specialist: "The person who enters trance most readily leads the dance.",
    afterlife:
      "The dead become part of the shelter's spirit and guide the living hunt.",
    evidence: {
      status: "hypothesis",
      claim:
        "San rock art across southern Africa shows eland-hunting scenes and human figures in postures of trance. ǀKaggen, the mantis trickster-creator, is recorded across |Xam and Kalahari oral tradition; Hishe and Gǁawama are recorded among Kalahari San groups as a benevolent sky figure and a malevolent figure of the earth and setting sun. *Xu is a comparative Khoe/Kx'a reconstruction used to name the band's forebears, not an attested term.",
      sources: [
        "Lewis-Williams, The Mind in the Cave",
        "Biesele, Women Like Meat",
        "Barnard, Hunters and Herders of Southern Africa",
        "Vossen, ed., The Khoesan Languages",
      ],
      limitation:
        "The starred form is a comparative reconstruction of vocabulary, not a recovered theonym: nobody is recorded speaking it, and a word for person or forebear is not evidence of an ancestor cult by that name. San societies were diverse and changed over millennia; this summary flattens regional and temporal variation. Hishe and Gǁawama are recorded in twentieth-century Kalahari ethnography and are projected back onto a much older span; the specifics of pre-colonial belief remain reconstructed from rock art and late ethnography.",
    },
  },
  {
    id: "early-farmers-herders",
    label: "Early farming and herding communities",
    scope: { years: [-500, 500], bounds: [10, -36, 52, 18] },
    wiki: "https://en.wikipedia.org/wiki/Bantu_expansion",
    powers: [
      {
        name: "*Nyambe",
        gloss:
          "Proto-Bantu *-nyambe/*-jambe, a reconstructed sky and creator term widely reflected as Nyambe, Nzambi, and related forms across Bantu languages.",
        domain: "rains, lightning, fertility",
        rank: "paramount",
      },
      {
        name: "The earth",
        domain: "crops, settlement, burial",
        rank: "major",
      },
      {
        name: "*Mudimu",
        gloss:
          "Proto-Bantu *-dima/*mudimu, a reconstructed term for an ancestral or lineage spirit.",
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
        name: "*Kúmú",
        gloss:
          "Proto-Bantu *-kʊ́mʊ́, a reconstructed term for a chief or headman, widely reflected in Bantu political vocabulary.",
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
      status: "hypothesis",
      claim:
        "Iron-working sites and settlement patterns show Bantu and other farming communities expanding across the region; ethnography and archaeology document lineage-based ancestor veneration, cattle significance, and smith's ritual role. *Nyambe, *Mudimu, and *Kúmú are Proto-Bantu comparative reconstructions standing in for the sky/creator, ancestor, and chief concepts this period left unnamed.",
      sources: [
        "Huffman, Handbook to the Iron Age",
        "Mitchell, The Archaeology of Southern Africa",
        "Hall, Farmers, Kings and Traders",
        "Bastin, Coupez, and Mumba, Bantu Lexical Reconstructions",
      ],
      limitation:
        "The starred forms are comparative reconstructions of vocabulary, not recovered theonyms: nobody is recorded speaking them, and a word for chief is not evidence of a cult of that name. Early beliefs are inferred from archaeology and later tradition; this schematic pattern flattens wide regional and temporal variation across a thousand years.",
    },
  },
  {
    id: "early-bantu-iron-age",
    label: "Early Bantu Iron Age farming practice",
    scope: { years: [-500, 500], bounds: [18, -34, 45, 2] },
    wiki: "https://en.wikipedia.org/wiki/Bantu_expansion",
    powers: [
      {
        name: "*Nyambe",
        wiki: "https://en.wikipedia.org/wiki/Nyambe",
        gloss:
          "Proto-Bantu *-nyambe/*-jambe, a reconstructed sky and creator term widely reflected as Nyambe, Nzambi, and related forms across Bantu languages.",
        domain: "the sky, creation, the distant high god",
        rank: "paramount",
      },
      {
        name: "The earth",
        domain: "crops, settlement, burial place",
        rank: "major",
      },
      {
        name: "*Mudimu",
        gloss:
          "Proto-Bantu *-dima/*mudimu, a reconstructed term for an ancestral or lineage spirit.",
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
        name: "*Kúmú",
        gloss:
          "Proto-Bantu *-kʊ́mʊ́, a reconstructed term for a chief or headman, widely reflected in Bantu political vocabulary.",
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
      status: "hypothesis",
      claim:
        "Early iron-working sites show settlement patterns, burial practices, and crop marks consistent with Bantu languages. *Nyambe, *Mudimu, and *Kúmú are comparative-religion reconstructions of widely cognate Bantu terms for the sky/creator, the ancestral spirit, and the chief (compare Nyambe among the Lozi, Nzambi elsewhere); ethnographic accounts of later Bantu groups document lineage-based ancestor veneration and the smith's ritual status.",
      sources: [
        "Huffman, Handbook to the Iron Age",
        "Vansina, Paths in the Rainforest",
        "Mitchell, The Archaeology of Southern Africa",
        "Bastin, Coupez, and Mumba, Bantu Lexical Reconstructions",
      ],
      limitation:
        "The starred forms are reconstructed comparative vocabulary, not terms anyone in this era is recorded as speaking; they are carried back from much later, geographically scattered Bantu-language attestations, and a word is not evidence of a cult of that name. The rest of early Bantu belief is inferred from archaeology and later oral tradition, and this represents a schematic early Iron Age pattern shared across wide regions.",
    },
  },
  {
    id: "iron-age-development",
    label: "Iron Age settlement and regional development",
    scope: { years: [500, 1200], bounds: [10, -36, 52, 12] },
    wiki: "https://en.wikipedia.org/wiki/African_Iron_Age",
    powers: [
      {
        name: "Leza",
        wiki: "https://en.wikipedia.org/wiki/Leza",
        domain: "the sky, rains, the distant creator",
        rank: "paramount",
      },
      {
        name: "Ryangombe",
        domain: "spirit possession, cattle, the initiated dead",
        rank: "major",
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
      "In the Great Lakes region, initiates are possessed by Ryangombe and the spirits of his following.",
      "Iron tools and weapons are crafted in ritual; the smith's work is sacred.",
    ],
    specialist: "The lineage head and settlement elders; healers and smiths.",
    afterlife:
      "The ancestors dwell in or near the settlement and fields, watching over the living.",
    evidence: {
      status: "inferred",
      claim:
        "Archaeological evidence shows Iron Age settlement, burial, craft, and trading patterns across the region. Leza is a widely attested Central-Southern Bantu sky/rain deity name; the Ryangombe possession cult is documented in Great Lakes oral tradition. Oral traditions and later ethnography describe ancestor veneration and lineage-based communities.",
      sources: [
        "Werner, Myths and Legends of the Bantu",
        "Vansina, Paths in the Rainforest",
        "Huffman, Handbook to the Iron Age",
      ],
      limitation:
        "Leza and Ryangombe are drawn from later ethnography and oral tradition and projected back onto this earlier period; each is representative of only part of the region (Zambia/Malawi and the Great Lakes respectively), not the whole. This is a schematic synthesis flattening seven centuries of change and vast regional variation.",
    },
  },
  {
    id: "aksumite-pre-christian",
    label: "Aksumite pre-Christian practice",
    scope: { years: [100, 350], bounds: [33, 5, 44, 17] },
    wiki: "https://en.wikipedia.org/wiki/Kingdom_of_Aksum",
    powers: [
      {
        name: "Mahrem",
        wiki: "https://en.wikipedia.org/wiki/Mahrem",
        domain: "war, kingship, the state",
        rank: "paramount",
      },
      {
        name: "Astar",
        wiki: "https://en.wikipedia.org/wiki/Athtar",
        domain: "love, fertility, abundance",
        rank: "major",
      },
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
        "Aksumite coins, temple sites, and inscriptions from the 1st-4th centuries document Mahrem, Astar, and Beher; later Christian sources describe the pre-Christian state cult.",
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
    wiki: "https://en.wikipedia.org/wiki/Ethiopian_Orthodox_Tewahedo_Church",
    powers: [
      {
        name: "Christ the King",
        wiki: "https://en.wikipedia.org/wiki/Jesus",
        domain: "salvation, the state, justice",
        rank: "paramount",
      },
      {
        name: "Mary, Mother of God",
        wiki: "https://en.wikipedia.org/wiki/Mary,_mother_of_Jesus",
        domain: "healing, childbirth, mercy",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Christ the King" }],
      },
      {
        name: "Saint George",
        wiki: "https://en.wikipedia.org/wiki/Saint_George",
        domain: "war, kingship, protection",
        rank: "major",
        relations: [{ kind: "serves", of: "Christ the King" }],
      },
      {
        name: "The saints of the monastery",
        domain: "scholarship, prayer, intercession",
        rank: "major",
        relations: [{ kind: "serves", of: "Christ the King" }],
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
    wiki: "https://en.wikipedia.org/wiki/Swahili_culture",
    powers: [
      {
        name: "Allah",
        wiki: "https://en.wikipedia.org/wiki/Allah",
        domain: "creation, judgment, the merchant's fortune",
        rank: "paramount",
      },
      {
        name: "The Prophet Muhammad",
        wiki: "https://en.wikipedia.org/wiki/Muhammad",
        domain: "guidance, protection, intercession",
        rank: "major",
        relations: [{ kind: "serves", of: "Allah" }],
      },
      {
        name: "The jinn of this shore",
        domain: "storm, shipwreck, the sea's spirits",
        rank: "major",
      },
      {
        name: "The mizimu of the town",
        domain: "the well, women's work, household life",
        rank: "local",
      },
      {
        name: "*Mudimu of the merchant houses",
        gloss:
          "Proto-Bantu *-dima/*mudimu, a reconstructed term for an ancestral or lineage spirit; the same root underlies the mizimu of the well, above.",
        domain: "trade success, family honor",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "The mizimu of the town" }],
      },
      {
        name: "The shrine of Fumo Liyongo",
        wiki: "https://en.wikipedia.org/wiki/Fumo_Liyongo",
        domain: "blessing, the hero-saint, miraculous return",
        rank: "local",
      },
    ],
    practice: [
      "Five daily prayers at the mosque; Friday congregations gather.",
      "Dhow captains pour water from the Zamzam well on the bow before sailing.",
      "Women visit the well at dawn with prayers for a son, and leave offerings for the mizimu who keep it.",
      "Incense burned at Fumo Liyongo's tomb; pilgrims touch the stone.",
      "No pork eaten; alcohol is refused in town, though jinn and mizimu are still propitiated privately.",
    ],
    specialist: "The qadi judges; the imam leads prayer.",
    afterlife: "The righteous enter paradise; the rest face judgment and fire.",
    evidence: {
      status: "documented",
      claim:
        "Swahili towns show mosques, Arabic inscriptions, and material culture from the 8th-9th centuries. Later texts describe the blend of Islamic practice with older coastal veneration of jinn, mizimu, and hero-saints such as Fumo Liyongo.",
      sources: [
        "Horton, Shungwaya: An Archaeological Interpretation",
        "Nurse and Spear, The Swahili",
        "Pouwels, Horn and Crescent",
        "Bastin, Coupez, and Mumba, Bantu Lexical Reconstructions",
      ],
      limitation:
        "Urban coastal evidence is rich; rural and forest practice is less well documented. The balance between Islam and older beliefs varied by town and decade, and the Fumo Liyongo epic survives mainly in later recensions. *Mudimu is a Proto-Bantu comparative reconstruction, not a term distinct from the attested Swahili mizimu; it names the same root for a household with no fixed word of its own recorded.",
    },
  },
  {
    id: "great-zimbabwe-shona",
    label: "Great Zimbabwe and Shona royal practice",
    scope: { years: [1100, 1600], bounds: [26, -26, 36, -12] },
    wiki: "https://en.wikipedia.org/wiki/Shona_religion",
    powers: [
      {
        name: "Mwari",
        wiki: "https://en.wikipedia.org/wiki/Mwari",
        domain: "creation, rains, the high places",
        rank: "paramount",
      },
      {
        name: "The mhondoro",
        wiki: "https://en.wikipedia.org/wiki/Mhondoro",
        domain: "the royal ancestral spirits, the land, kingship",
        rank: "major",
      },
      {
        name: "Dzivaguru",
        domain: "rain, the deep pools, the northern shrines",
        rank: "major",
      },
      {
        name: "Nehanda",
        wiki: "https://en.wikipedia.org/wiki/Nehanda_Nyakasikana",
        domain: "a named mhondoro, rain, the land's fertility",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "The mhondoro" }],
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
      "In the north, rain is sought at Dzivaguru's shrines rather than Mwari's.",
      "Cattle herds kept sacred for the ancestors; they are not slaughtered lightly.",
    ],
    specialist: "The king's mediums; the keeper of the sacred rock.",
    afterlife:
      "The royal dead become mhondoro, spirits whose will shapes the realm.",
    evidence: {
      status: "documented",
      claim:
        "Great Zimbabwe's stone structures, settlement layout, and archaeological context show centralized royal power. Ethnographic and historical sources describe Mwari, the mhondoro system, named spirits such as Nehanda and Dzivaguru, and the role of mediums in Shona kingdoms.",
      sources: [
        "Huffman, Snakes and Crocodiles",
        "Beach, Zimbabwe Before 1900",
        "Lan, Guns and Rain",
      ],
      limitation:
        "Elite royal practice is better documented than village practice. The oral traditions recorded in the 19th and 20th centuries may reflect later political changes, and Nehanda in particular is best attested as a recurring named medium rather than a single historical person.",
    },
  },
  {
    id: "medieval-kingdoms",
    label: "Medieval kingdoms and settlement networks",
    scope: { years: [1200, 1700], bounds: [10, -36, 52, 12] },
    wiki: "https://en.wikipedia.org/wiki/African_Iron_Age",
    powers: [
      {
        name: "*Kúmú",
        gloss:
          "Proto-Bantu *-kʊ́mʊ́, a reconstructed term for a chief or headman, widely reflected in Bantu political vocabulary.",
        domain: "the realm, justice, power",
        rank: "paramount",
      },
      {
        name: "*Mudimu",
        gloss:
          "Proto-Bantu *-dima/*mudimu, a reconstructed term for an ancestral or lineage spirit.",
        domain: "kingship, war, legitimacy",
        rank: "major",
      },
      {
        name: "Ryangombe",
        domain: "spirit possession, cattle, the initiated dead",
        rank: "major",
      },
      {
        name: "The earth and the land",
        domain: "crops, settlement, cattle",
        rank: "major",
      },
      {
        name: "Mbona",
        wiki: "https://en.wikipedia.org/wiki/Mbona",
        domain: "rain, the territorial shrine",
        rank: "local",
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
    ],
    practice: [
      "Beer and meat are offered to the ancestors at major gatherings and harvests.",
      "Cattle herds are kept for the ancestors; great animals are slaughtered in ceremony.",
      "In the Great Lakes region, initiates are possessed by Ryangombe; in the Shire valley, rain is asked at Mbona's shrine.",
      "Healers and diviners are consulted for illness, drought, and counsel.",
    ],
    specialist:
      "The king or paramount chief and their advisors; healers and shrine keepers.",
    afterlife:
      "The royal dead become ancestors of the realm; the humble ancestors watch over their kin.",
    evidence: {
      status: "hypothesis",
      claim:
        "Archaeological evidence shows settlement hierarchies, craft specialization, and long-distance trade across the region in this period. The Ryangombe possession cult and the Mbona rain shrine are documented in Great Lakes and Shire valley oral tradition respectively; elsewhere, royal ancestor veneration is described in later ethnography. *Kúmú and *Mudimu are Proto-Bantu comparative reconstructions standing in for the chief and royal-ancestor concepts common to this era's kingdoms.",
      sources: [
        "Vansina, Paths in the Rainforest",
        "Schoffeleers, River of Blood",
        "Huffman, Handbook to the Iron Age",
        "Bastin, Coupez, and Mumba, Bantu Lexical Reconstructions",
      ],
      limitation:
        "The starred forms are comparative reconstructions of vocabulary, not recovered theonyms: nobody is recorded speaking them, and a word for chief is not evidence of the specific kingship of this period. This represents a schematic synthesis of five centuries and vast regions. Ryangombe and Mbona are each attested for one part of this territory, not the whole, and stand in here for a broader pattern of named royal and territorial cults.",
    },
  },
  {
    id: "nguni-ancestor-veneration",
    label: "Nguni ancestor veneration",
    scope: { years: [1400, 1800], bounds: [26, -36, 34, -26] },
    wiki: "https://en.wikipedia.org/wiki/Nguni_people",
    powers: [
      {
        name: "uNkulunkulu",
        wiki: "https://en.wikipedia.org/wiki/Unkulunkulu",
        domain: "the first ancestor, the origin",
        rank: "paramount",
      },
      {
        name: "uMvelinqangi",
        domain: "the sky, thunder, the first to emerge",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "uNkulunkulu" }],
      },
      {
        name: "The royal ancestors",
        domain: "the kingdom, war, succession",
        rank: "major",
      },
      {
        name: "Nomkhubulwane",
        domain: "rain, crops, young women's rites",
        rank: "major",
      },
      {
        name: "Inkosazana",
        domain: "the princess spirit of the rainbow and rain rites",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "Nomkhubulwane" }],
      },
      {
        name: "The amadlozi",
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
      "Beer is brewed and poured on the ground to call the amadlozi; they drink first.",
      "At a homestead's founding, the ancestors are invoked to bless the ground.",
      "Cattle are slaughtered at a death; the meat is eaten by the living, the spirit by the dead.",
      "Young women perform rites for Nomkhubulwane before the rains, asking fertility for the fields.",
    ],
    specialist:
      "The lineage elder conducts offerings; the inyanga (healer) treats spirit illness.",
    afterlife:
      "The dead join the amadlozi near the homestead and watch over the living; they must be fed and respected.",
    evidence: {
      status: "inferred",
      claim:
        "Ethnographic accounts of Zulu, Xhosa, and other Nguni groups describe uNkulunkulu, uMvelinqangi, the amadlozi, and Nomkhubulwane (also called Inkosazana), along with cattle significance and homestead ritual; the system is inferred back to pre-colonial centuries via linguistic and archaeological continuity.",
      sources: [
        "Berglund, Zulu Thought-Patterns and Symbolism",
        "Krige, The Social System of the Zulu",
        "Hammond-Tooke, ed., The Bantu-Speaking Peoples of Southern Africa",
      ],
      limitation:
        "Direct evidence for the pre-colonial period is limited. These names are recorded in 19th- and 20th-century ethnography and projected back via linguistic continuity; earlier forms of the same figures may have differed. Some ethnographers treat uMvelinqangi and uNkulunkulu as the same figure under different names rather than as sky-aspect and source; the aspect-of relation drawn here follows the reading that keeps them distinct.",
    },
  },
  {
    id: "zulu-mfecane-era",
    label: "Zulu practice during the Mfecane expansion",
    scope: { years: [1700, 1920], bounds: [26, -34, 34, -24] },
    wiki: "https://en.wikipedia.org/wiki/Zulu_religion",
    powers: [
      {
        name: "uMvelinqangi",
        domain: "the king, war, the nation's fate, the sky",
        rank: "paramount",
      },
      {
        name: "*Mudimu of the royal line",
        gloss:
          "Proto-Bantu *-dima/*mudimu, a reconstructed term for an ancestral or lineage spirit; the attested Zulu amadlozi, below, names the household form of the same idea.",
        domain: "battle guidance, kingship, victory",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "The amadlozi" }],
      },
      {
        name: "Nomkhubulwane",
        domain: "rains, crops, cattle",
        rank: "major",
      },
      {
        name: "The amadlozi",
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
      "Before battle, the king's izinyanga (healers) fortify warriors with isifu to bind them to the amadlozi.",
      "Beer is poured at the royal homestead; the amadlozi drink and enter the king's counsel.",
      "Young initiates fast and isolate; they meet the amadlozi and return as men.",
      "Healing medicines are drawn from plants and bones; the inyanga channels ancestral knowledge.",
    ],
    specialist: "The king's izinyanga; diviners who work with the amadlozi.",
    afterlife:
      "Warriors who die in battle join the royal ancestors and guard the kingdom.",
    evidence: {
      status: "documented",
      claim:
        "European travelers and settlers in southern Africa recorded Zulu practice during the early 19th century; later ethnographic work with Zulu informants documents uMvelinqangi, Nomkhubulwane, the amadlozi, healer roles, and ancestor veneration in detail.",
      sources: [
        "Berglund, Zulu Thought-Patterns and Symbolism",
        "Krige, The Social System of the Zulu",
        "Wylie, Myth of Iron: Shaka in History",
        "Bastin, Coupez, and Mumba, Bantu Lexical Reconstructions",
      ],
      limitation:
        "European accounts have biases; they focus on war and rulers. Household practice, particularly among women, is less fully recorded. *Mudimu is a Proto-Bantu comparative reconstruction, not an attested Zulu term distinct from amadlozi; it stands in for a royal-line ancestor concept this schema separates from the household dead.",
    },
  },
  {
    id: "maasai-pastoral-practice",
    label: "Maasai pastoral practice",
    scope: { years: [1400, 1920], bounds: [32, -6, 40, 4] },
    wiki: "https://en.wikipedia.org/wiki/Maasai_mythology",
    powers: [
      {
        name: "Engai Narok",
        wiki: "https://en.wikipedia.org/wiki/Enkai",
        domain: "the black, benevolent sky, rains, fertility",
        rank: "paramount",
      },
      {
        name: "Engai Nanyokie",
        domain: "the red, wrathful sky, drought, anger",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Engai Narok" }],
      },
      {
        name: "Naiterukop",
        domain: "the first man, cattle, the ancestor of the age-sets",
        rank: "major",
        relations: [{ kind: "child-of", of: "Engai Narok" }],
      },
      {
        name: "The cattle themselves",
        domain: "wealth, life, the Maasai identity",
        rank: "major",
      },
      {
        name: "The laibon",
        domain: "prophecy, healing, the office of ritual leadership",
        rank: "local",
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
      "The laibon reads omens in cattle organs and the sky.",
      "Milk is blessed before it is drunk; Engai Narok is thanked for the herd's abundance.",
      "Age-sets gather in ceremony to invoke the blessings of their ancestors and of Naiterukop, their first father.",
      "Cattle are never sold but gifted; to sell them is to break the covenant with Engai.",
      "A warrior who kills in war is ritually separated until the ancestors accept him back.",
    ],
    specialist: "The laibon; the age-set elders.",
    afterlife:
      "The worthy become part of the age-set's collective spirit; the disrespectful are forgotten.",
    evidence: {
      status: "documented",
      claim:
        "Maasai practice is documented by 19th-century travelers and ethnographic studies beginning in the early 20th century. Engai's two aspects, the culture hero Naiterukop, cattle theology, and age-set organization are consistently described.",
      sources: [
        "Hollis, The Maasai: Their Language and Folklore",
        "Merker, The Maasai",
        "Spear and Waller, eds., Being Maasai",
      ],
      limitation:
        "The practice has changed significantly due to colonialism and ecological pressure. What is recorded is a snapshot, and earlier variation is not well documented.",
    },
  },
  {
    id: "malagasy-razana-practice",
    label: "Malagasy razana practice",
    scope: { years: [600, 1920], bounds: [39, -26, 52, -10] },
    wiki: "https://en.wikipedia.org/wiki/Malagasy_mythology",
    powers: [
      {
        name: "Zanahary",
        wiki: "https://en.wikipedia.org/wiki/Zanahary",
        domain: "creation, the sky, the distant source",
        rank: "paramount",
      },
      {
        name: "Andriamanitra",
        domain: "the sweet-scented lord, creation, the sky",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Zanahary" }],
      },
      {
        name: "The razana",
        domain: "the lineage ancestors, the land, blessing",
        rank: "major",
      },
      {
        name: "*Qanitu of the household",
        gloss:
          "Proto-Malayo-Polynesian *qanitu, 'ancestral spirit, ghost'; regularly reflected in Malagasy angatra, 'ghost.'",
        domain: "that house's fertility, health, children",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "The razana" }],
      },
      {
        name: "The vazimba",
        domain: "the land's first spirits, the wilderness, omens",
        rank: "local",
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
      "At famadihana (the turning of the bones), the razana are unwrapped, danced with, and rewrapped.",
      "Fady (taboos) protect the lineage; breaking them angers the razana.",
      "Rice is left as offering at the tomb; the dead are fed first.",
      "Shrines to the vazimba, the land's first people, are tended by those who farm near them.",
      "Slaves are bound by oath to the razana as surely as blood kin.",
    ],
    specialist:
      "The elder of the lineage; the keeper of the tomb for the collective dead.",
    afterlife:
      "The dead join the razana and watch over the land and the lineage's fertility.",
    evidence: {
      status: "documented",
      claim:
        "Malagasy ethnography from the 19th century onward documents Zanahary and Andriamanitra as the distant creator, razana veneration, famadihana, fady, and the vazimba as the island's earlier inhabitants remembered as land spirits; linguistic and archaeological evidence shows settlement and practice stability across centuries.",
      sources: [
        "Feeley-Harnik, A Green Estate",
        "Bloch, Placing the Dead",
        "Parker Pearson, The Archaeology of Madagascar",
        "Blust, The Austronesian Languages",
      ],
      limitation:
        "Most detailed sources are 19th-20th century. Earlier variation and regional differences are poorly documented, and the identity of the vazimba varies by locality and is often merged with unrelated ancestor cults. *Qanitu is a Proto-Malayo-Polynesian comparative reconstruction, not a recovered theonym; the settlers who reached Madagascar had already diverged from that reconstructed stage by centuries, and a word for ghost is not evidence of the specific household cult described here.",
    },
  },
  {
    id: "buganda-balubaale",
    label: "Buganda balubaale practice",
    scope: { years: [1400, 1920], bounds: [28, -4, 36, 4] },
    wiki: "https://en.wikipedia.org/wiki/Buganda",
    powers: [
      {
        name: "Katonda",
        domain: "creation, the ultimate source",
        rank: "paramount",
      },
      {
        name: "Ggulu",
        domain: "the sky, the first father, rain",
        rank: "major",
      },
      {
        name: "Kintu",
        domain: "the first man, the origin of kingship",
        rank: "major",
      },
      {
        name: "Nambi",
        domain: "Ggulu's daughter, fertility, the first marriage",
        rank: "major",
        relations: [{ kind: "consort-of", of: "Kintu" }],
      },
      {
        name: "Walumbe",
        domain: "death, misfortune",
        rank: "major",
        relations: [{ kind: "child-of", of: "Ggulu" }],
      },
      {
        name: "Mukasa",
        wiki: "https://en.wikipedia.org/wiki/Mukasa",
        domain: "waters, lakes, fish, commerce",
        rank: "major",
      },
      {
        name: "Kibuka",
        domain: "war, the king's battles, victory",
        rank: "major",
        relations: [{ kind: "sibling-of", of: "Mukasa" }],
      },
      {
        name: "Nnende",
        domain: "smallpox and its cure, plague",
        rank: "local",
      },
      {
        name: "The royal balubaale (spirits)",
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
      "The story of Kintu, Nambi, and Walumbe's pursuit is retold to explain why death entered the world.",
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
        "Buganda's balubaale system is documented in 19th-century accounts and ethnographic work, including by Baganda writers themselves. The roles of Mukasa, Kibuka, and Nnende, the Kintu-Nambi-Walumbe origin story, the shrine system, and the king's ritual authority are consistently described.",
      sources: [
        "Kagwa, The Customs of the Baganda",
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
    wiki: "https://en.wikipedia.org/wiki/History_of_Africa",
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
        name: "Chaminuka",
        domain: "prophecy, protection, the spirit medium's authority",
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
      "Prophetic mediums such as Chaminuka speak for the ancestors and are consulted by chiefs.",
      "In mission zones, Christian practice blends with ancestral veneration.",
    ],
    specialist:
      "Chiefs and kings; healers, diviners, and prophetic mediums; Christian missionaries and converts in some areas.",
    afterlife:
      "The ancestors remain near and influential; in Christian areas, some believe in judgment and heaven.",
    evidence: {
      status: "inferred",
      claim:
        "Ethnographic records from the 19th century and early colonial period document continuing ancestral veneration, healing, chiefdom organization, and the mixed adoption of Christianity. Missionary and colonial accounts describe named prophetic mediums, such as Chaminuka in the Shona-speaking plateau, and the blend of religions.",
      sources: [
        "Lan, Guns and Rain",
        "Vansina, Oral Tradition as History",
        "Doyle, Missions and Peoples",
      ],
      limitation:
        "This summarizes one or two centuries of rapid change and colonial disruption. Chaminuka stands here for a wider pattern of named prophetic mediums across the region; regional variation is vast and the period spans major upheaval.",
    },
  },
];
