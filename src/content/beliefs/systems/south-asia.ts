import type { BeliefSystem } from "../types";

/** South Asian belief systems from the Indus Valley through the colonial era.
 * Coverage emphasizes the local powers actually addressed by villagers: the
 * household dead, the village goddess, the field spirit, the sacred tree.
 */
export const southAsia: readonly BeliefSystem[] = [
  {
    id: "prehistoric-foragers",
    label: "Prehistoric forager practice",
    wiki: "https://en.wikipedia.org/wiki/Prehistoric_religion",
    scope: { years: [-10000, -3000], bounds: [60, 5, 92, 37] },
    powers: [
      {
        name: "The ancestors",
        domain: "the lineage of the dead, guidance and presence",
        rank: "paramount",
      },
      {
        name: "*Cūr",
        gloss: "Proto-Dravidian *cūr, 'fierce being, demon'",
        domain: "game animals, the hunt, danger given a shape",
        rank: "major",
      },
      {
        name: "*Āṟu",
        gloss: "Proto-Dravidian *āṟu, 'river'",
        domain: "rivers, springs, gathering and sustenance",
        rank: "major",
      },
      {
        name: "The sacred grove",
        domain: "shelter, refuge, settled knowledge",
        rank: "local",
      },
      {
        name: "*Kal",
        gloss: "Proto-Dravidian *kal, 'stone'",
        domain: "the rock shelter, home, protection",
        rank: "local",
      },
      {
        name: "*Māri",
        gloss: "Proto-Dravidian *māri, 'rain'",
        domain: "lightning, storm, renewal, awe",
        rank: "local",
      },
    ],
    practice: [
      "Hunting magic and animal bone arrangements at shelter walls.",
      "Ochre markings and hand stencils in caves, leaving traces for the spirits.",
      "Gathering at water sites for ceremony and exchange.",
      "Burial with ochre and tools for the journey of the dead.",
    ],
    specialist: "The elder or shaman who knows the songs and the places.",
    afterlife:
      "The dead remain as spirits near the group; they guide the hunt and the gathering.",
    evidence: {
      status: "hypothesis",
      claim:
        "Archaeological caves and rock shelters across the Deccan and coasts show ochre use, hand stencils, and bone arrangements suggesting ritual attention to the dead and animal spirits over tens of thousands of years.",
      sources: [
        "Petraglia, The Middle Paleolithic of the Aravallis and the Deccan",
        "Kumar, Mesolithic India",
        "Krishnamurti, The Dravidian Languages",
      ],
      limitation:
        "No written records; interpretation rests on material remains and ethnographic parallels with living forager societies. The starred names are Proto-Dravidian words reconstructed by comparative linguists, not theonyms anyone spoke; a word for rain or stone is not evidence a rain god or stone god was addressed by it. Proto-Dravidian's breakup is usually dated close to this span's end, so applying it to the earliest foragers here reaches well past what the reconstruction can honestly support.",
    },
  },
  {
    id: "early-farming-neolithic",
    label: "Early farming and herding communities",
    wiki: "https://en.wikipedia.org/wiki/Neolithic_Revolution",
    scope: { years: [-5000, -2300], bounds: [60, 5, 92, 37] },
    powers: [
      {
        name: "The ancestors",
        domain: "the lineage of the dead, blessing the fields",
        rank: "paramount",
      },
      {
        name: "*Nilam",
        gloss: "Proto-Dravidian *nilam, 'earth, land, soil'",
        domain: "crops, fertility, the soil",
        rank: "major",
      },
      {
        name: "The herd spirits",
        domain: "cattle and flocks, wealth and sustenance",
        rank: "major",
      },
      {
        name: "*Āṟu",
        gloss: "Proto-Dravidian *āṟu, 'river'",
        domain: "rivers, wells, life and purification",
        rank: "major",
      },
      {
        name: "The household hearth",
        domain: "family, fire, daily life",
        rank: "local",
      },
      {
        name: "*Cūr",
        gloss: "Proto-Dravidian *cūr, 'fierce being, demon'",
        domain: "the boundary, the local power of the land",
        rank: "local",
      },
      {
        name: "The sacred tree",
        domain: "permanence, shelter, the growing world",
        rank: "local",
      },
    ],
    practice: [
      "Seasonal offerings to the earth and the water as crops grow.",
      "Ritual care of domestic animals, with special rites at birth and slaughter.",
      "Burial in or near the settlement, the dead maintaining connection to place.",
      "Household ceremonies at the hearth for family protection.",
    ],
    specialist:
      "The household head and the elder woman who knows the seasonal rounds.",
    afterlife:
      "The dead remain near the village, blessing the fields and the herd.",
    evidence: {
      status: "hypothesis",
      claim:
        "Neolithic sites across South Asia show structured settlements, domestic crops and animals, elaborate burials, and evidence of household ritual, suggesting organized agricultural ritual from early farming's arrival.",
      sources: [
        "Possehl, The Indus Civilization: A Contemporary Perspective",
        "Fuller, Agricultural Beginnings in the Indian Subcontinent",
        "Krishnamurti, The Dravidian Languages",
      ],
      limitation:
        "Neolithic material culture varies widely; this sketch flattens regional differences in farming and ritual adoption. The starred names are Proto-Dravidian vocabulary reconstructed by comparative method, not recorded theonyms, and a word for earth or river is not proof a power was addressed by that word here; Proto-Dravidian is a hypothesis about the language of some of these farmers, argued from the daughter languages, not a transcript.",
    },
  },
  {
    id: "indus-valley",
    label: "Indus Valley ritual practice",
    wiki: "https://en.wikipedia.org/wiki/Indus_Valley_Civilisation",
    scope: { years: [-2300, -1300], bounds: [60, 23, 77, 34] },
    powers: [
      {
        name: "*Kaṭavuḷ",
        gloss: "Proto-Dravidian *kaṭavuḷ, 'god, that which is beyond'",
        domain: "fertility, animals, the wild",
        rank: "paramount",
      },
      {
        name: "The great bath",
        domain: "purification, collective rite",
        rank: "major",
      },
      {
        name: "The fire altar",
        domain: "ritual burning, sacrifice",
        rank: "major",
      },
      {
        name: "*Maram",
        gloss: "Proto-Dravidian *maram, 'tree'",
        domain: "abundance, protection",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the household's own dead",
        rank: "local",
      },
      { name: "The herds", domain: "cattle wealth and care", rank: "local" },
      {
        name: "*Nilam",
        gloss: "Proto-Dravidian *nilam, 'earth, land, soil'",
        domain: "crops and fertility",
        rank: "local",
      },
      {
        name: "The household shrine",
        domain: "family protection and daily ritual",
        rank: "local",
      },
    ],
    practice: [
      "Ritual bathing in public and household tanks.",
      "Figurines of animals and humans left as offerings.",
      "Burning at fire altars, suggesting sacrifice or purification rites.",
      "Mark-making and seals suggest ritual categories and ownership.",
    ],
    evidence: {
      status: "hypothesis",
      claim:
        "The horned figure, great baths, fire altars, and terracotta figurines suggest fertility rites, collective purification, and household worship, though no texts survive.",
      sources: [
        "Kenoyer, Ancient Cities of the Indus Valley Civilization",
        "Parpola, Deciphering the Indus Script",
        "Krishnamurti, The Dravidian Languages",
      ],
      limitation:
        "No written records; interpretation rests entirely on archaeological form and distribution. The Indus script itself is undeciphered, so naming the horned figure and its neighbors with Proto-Dravidian words is a hypothesis about the language the Indus people spoke, argued from a contested but widely held case for Dravidian as an early subcontinental family, not a reading of the seals themselves. A reconstructed word for tree or earth is not evidence of a tree god or earth god by that word.",
    },
  },
  {
    id: "vedic-early",
    label: "Early Vedic practice",
    wiki: "https://en.wikipedia.org/wiki/Historical_Vedic_religion",
    scope: { years: [-1500, -1000], bounds: [60, 20, 97, 37] },
    powers: [
      {
        name: "Indra",
        wiki: "https://en.wikipedia.org/wiki/Indra",
        domain: "storm, cattle, kingship",
        rank: "paramount",
      },
      {
        name: "Varuna",
        wiki: "https://en.wikipedia.org/wiki/Varuna",
        domain: "cosmic order, oaths, the waters",
        rank: "major",
      },
      {
        name: "Agni",
        wiki: "https://en.wikipedia.org/wiki/Agni",
        domain: "fire, sacrifice, the bridge between worlds",
        rank: "major",
      },
      {
        name: "Soma",
        wiki: "https://en.wikipedia.org/wiki/Soma_(deity)",
        domain: "intoxication, immortality, the ritual drink",
        rank: "major",
      },
      {
        name: "Surya",
        wiki: "https://en.wikipedia.org/wiki/Surya",
        domain: "the sun, sight, truth",
        rank: "major",
      },
      {
        name: "The household fire",
        domain: "the family's own ritual and protection",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the fathers, continued presence at home",
        rank: "local",
      },
      {
        name: "The land spirits",
        domain: "the herd and field, local protection",
        rank: "local",
      },
    ],
    practice: [
      "Fire sacrifice with soma drink at dawn and evening.",
      "Cattle wealth marks status and piety.",
      "Oaths sealed at Varuna's witness.",
      "Brahmins are learned in the ritual sequences.",
    ],
    specialist: "The brahmin, keeper and speaker of sacred utterance.",
    afterlife:
      "The fathers drink soma again in the world beyond; the pious join them.",
    evidence: {
      status: "documented",
      claim:
        "The Rigveda presents Indra as paramount, Varuna as the guardian of cosmic and social order, and Soma as the intoxicating ritual substance linking earth and the divine.",
      sources: [
        "Witzel, The Origins of the World's Mythologies",
        "Jamison and Brereton, The Rigveda: The Earliest Religious Poetry of India",
      ],
      limitation:
        "The Vedas are priestly compositions; the beliefs and practices of non-brahmin groups are invisible.",
    },
  },
  {
    id: "vedic-late-upanishadic",
    label: "Later Vedic and Upanishadic thought",
    wiki: "https://en.wikipedia.org/wiki/Upanishads",
    scope: { years: [-1000, -200], bounds: [60, 8, 97, 37] },
    powers: [
      {
        name: "Brahman",
        wiki: "https://en.wikipedia.org/wiki/Brahman",
        domain: "the ultimate reality, undifferentiated",
        rank: "paramount",
      },
      {
        name: "Prajapati",
        wiki: "https://en.wikipedia.org/wiki/Prajapati",
        domain: "the creator of creatures",
        rank: "major",
      },
      {
        name: "Rudra",
        wiki: "https://en.wikipedia.org/wiki/Rudra",
        domain: "storms, asceticism, transformation",
        rank: "major",
      },
      {
        name: "The Atman",
        wiki: "https://en.wikipedia.org/wiki/Atman_(Hinduism)",
        domain: "the self, breath, inner truth",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Brahman" }],
      },
      {
        name: "The household fire",
        domain: "the family altar, daily offering",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the house lineage, continued presence",
        rank: "local",
      },
      {
        name: "The spirit in the tree",
        domain: "settled local presence and growth",
        rank: "local",
      },
    ],
    practice: [
      "Sacrifice continues but tapering in frequency.",
      "Forest hermits pursue knowledge over ritual.",
      "Household fire worship and remembrance of the fathers remains constant.",
      "Meditation on the Atman is taught to seekers.",
    ],
    specialist: "The brahmin, now also the philosopher and forest sage.",
    afterlife:
      "The Atman is deathless; the ignorant are reborn; the wise are released.",
    evidence: {
      status: "documented",
      claim:
        "The Upanishads move from ritual to knowledge, establishing Brahman as the ultimate reality and Atman as identical to it, while also placing Rudra as an increasingly important cosmic power.",
      sources: [
        "Olivelle, The Early Upanishads",
        "Bronkhorst, The Emergence of Yoga",
      ],
      limitation:
        "Again, these are texts of the learned; village practice and female participation remain largely unrecorded.",
    },
  },
  {
    id: "early-buddhism",
    label: "Early Buddhism",
    wiki: "https://en.wikipedia.org/wiki/Pre-sectarian_Buddhism",
    scope: { years: [-500, 200], bounds: [60, 8, 97, 37] },
    powers: [
      {
        name: "The Buddha",
        wiki: "https://en.wikipedia.org/wiki/Gautama_Buddha",
        domain: "awakening, the path to cessation of suffering",
        rank: "paramount",
      },
      {
        name: "The Sangha",
        wiki: "https://en.wikipedia.org/wiki/Sangha",
        domain: "the order of monks, the community of practice",
        rank: "major",
      },
      {
        name: "Mara",
        wiki: "https://en.wikipedia.org/wiki/Mara_(demon)",
        domain: "temptation, death, obstacles to awakening",
        rank: "major",
        relations: [{ kind: "rival-of", of: "The Buddha" }],
      },
      {
        name: "Shakra",
        wiki: "https://en.wikipedia.org/wiki/Śakra_(Buddhism)",
        domain: "sky god, protector of the dharma",
        rank: "major",
        relations: [{ kind: "serves", of: "The Buddha" }],
      },
      {
        name: "Brahma",
        wiki: "https://en.wikipedia.org/wiki/Brahma_(Buddhism)",
        domain: "the celestial realm, messenger of dharma",
        rank: "major",
        relations: [{ kind: "serves", of: "The Buddha" }],
      },
      {
        name: "The yakkhas",
        wiki: "https://en.wikipedia.org/wiki/Yaksha",
        domain: "guardian spirits of the settlement and its edges",
        rank: "local",
      },
      {
        name: "The nagas",
        wiki: "https://en.wikipedia.org/wiki/Nāga",
        domain: "serpent spirits of water and the underworld",
        rank: "local",
      },
      {
        name: "The household dead",
        domain: "the family's ancestors, merit-sharers",
        rank: "local",
      },
      {
        name: "The bodhi tree",
        wiki: "https://en.wikipedia.org/wiki/Bodhi_Tree",
        domain: "the place of awakening, sacred shelter",
        rank: "local",
      },
    ],
    practice: [
      "Dana (giving) to monks, creating merit.",
      "No blood offering; vegetarian meals at festival times.",
      "Meditation and recollection of the dharma.",
      "Veneration of the Buddha's relics and the places he walked.",
    ],
    specialist: "The bhikkhu (monk), vowed to the disciplines and the sangha.",
    afterlife:
      "Nirvana, the cessation of craving and rebirth, or rebirth according to karma until enlightenment.",
    evidence: {
      status: "documented",
      claim:
        "The Pali Canon depicts the Buddha as paramount, the sangha as the instrument of his teaching, Mara as the tempter he overcomes, and earlier deities like Shakra and Brahma as supportive but subordinate protectors.",
      sources: [
        "Rhys Davids, Dialogues of the Buddha",
        "Gethin, The Foundations of Buddhism",
      ],
      limitation:
        "The Pali texts are monastic perspectives; the role of lay donors, local spirits, and the household cult of ancestors is underrepresented.",
    },
  },
  {
    id: "jainism",
    label: "Jain practice",
    wiki: "https://en.wikipedia.org/wiki/Jainism",
    scope: { years: [-500, 800], bounds: [70, 19, 78, 27] },
    powers: [
      {
        name: "The Tirthankaras",
        wiki: "https://en.wikipedia.org/wiki/Tirthankara",
        domain: "the twenty-four liberated ford-makers, the path to moksha",
        rank: "paramount",
      },
      {
        name: "Mahavira",
        wiki: "https://en.wikipedia.org/wiki/Mahavira",
        domain: "the last Tirthankara, the exemplar of renunciation",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "The Tirthankaras" }],
      },
      {
        name: "Parshvanatha",
        wiki: "https://en.wikipedia.org/wiki/Parshvanatha",
        domain: "the twenty-third Tirthankara, widely worshipped protector",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "The Tirthankaras" }],
      },
      {
        name: "The Yakshas",
        wiki: "https://en.wikipedia.org/wiki/Yaksha",
        domain: "protecting spirits attending the Tirthankaras",
        rank: "major",
        relations: [{ kind: "serves", of: "The Tirthankaras" }],
      },
      {
        name: "Padmavati",
        wiki: "https://en.wikipedia.org/wiki/Padmavati_(Jainism)",
        domain: "the yakshi guardian of Parshvanatha, protection and aid",
        rank: "major",
        relations: [{ kind: "serves", of: "Parshvanatha" }],
      },
      {
        name: "Saraswati",
        wiki: "https://en.wikipedia.org/wiki/Saraswati",
        domain: "knowledge and learning",
        rank: "major",
      },
      {
        name: "The household protective spirit",
        domain: "the family's welfare and endurance",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the lineage of the dead",
        rank: "local",
      },
      {
        name: "The temple grove",
        domain: "the sanctuary where asceticism is practiced",
        rank: "local",
      },
    ],
    practice: [
      "Extreme fasting and renunciation by the ascetic community.",
      "No killing of any being, no meat, no root vegetables (they may harm underground lives).",
      "Lay followers support ascetics through dana.",
      "Pilgrimage to the mountain sanctuaries.",
    ],
    specialist: "The Jain monk or nun, vowed to absolute non-violence.",
    afterlife:
      "Moksha, the utter liberation from the cycle through perfect non-violence and ascetic discipline.",
    evidence: {
      status: "documented",
      claim:
        "The Jain texts present the Tirthankaras as perfected beings and Mahavira as the exemplar of complete renunciation, with Parshvanatha and his guardian Padmavati as widely worshipped protectors; extreme asceticism and non-violence are the core practices.",
      sources: ["Dundas, The Jains", "Wiley, The A to Z of Jainism"],
      limitation:
        "The texts emphasize the monastic ideal; lay Jain practice and local variations are less fully preserved.",
    },
  },
  {
    id: "gupta-puranic",
    label: "Gupta-era Puranic Hinduism",
    wiki: "https://en.wikipedia.org/wiki/Puranas",
    scope: { years: [100, 1000], bounds: [60, 8, 97, 37] },
    powers: [
      {
        name: "Brahman",
        wiki: "https://en.wikipedia.org/wiki/Brahman",
        domain: "the ultimate reality, manifest in the gods",
        rank: "paramount",
      },
      {
        name: "Vishnu",
        wiki: "https://en.wikipedia.org/wiki/Vishnu",
        domain: "preservation, kingship, the embodied divine",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Brahman" }],
      },
      {
        name: "Shiva",
        wiki: "https://en.wikipedia.org/wiki/Shiva",
        domain: "destruction, asceticism, cosmic renewal",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Brahman" }],
      },
      {
        name: "Devi/Shakti",
        wiki: "https://en.wikipedia.org/wiki/Devi",
        domain: "the goddess, power, destruction and protection",
        rank: "major",
        relations: [{ kind: "consort-of", of: "Shiva" }],
      },
      {
        name: "Durga",
        wiki: "https://en.wikipedia.org/wiki/Durga",
        domain: "protective power, victory over disorder",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Devi/Shakti" }],
      },
      {
        name: "Lakshmi",
        wiki: "https://en.wikipedia.org/wiki/Lakshmi",
        domain: "prosperity, good fortune, abundance",
        rank: "major",
        relations: [{ kind: "consort-of", of: "Vishnu" }],
      },
      {
        name: "Brahma",
        wiki: "https://en.wikipedia.org/wiki/Brahma",
        domain: "creation, less worshipped in practice",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Brahman" }],
      },
      {
        name: "Ganesha",
        wiki: "https://en.wikipedia.org/wiki/Ganesha",
        domain: "remover of obstacles, the elephant-headed guardian",
        rank: "local",
        relations: [{ kind: "child-of", of: "Shiva" }],
      },
      {
        name: "The ancestors",
        domain: "the house lineage, continued presence",
        rank: "local",
      },
      {
        name: "The village tank deity",
        domain: "water, local abundance and health",
        rank: "local",
      },
      {
        name: "The sacred tree",
        domain: "permanence, shelter, local power",
        rank: "local",
      },
    ],
    practice: [
      "Temple puja (worship) with flowers, food and incense.",
      "Seasonal festivals at which the god is celebrated.",
      "Vegetarian meals offered at the household shrine.",
      "Pilgrimage to sacred sites and rivers.",
    ],
    specialist:
      "The brahmin priest at temple and home, keeping the ritual calendar and the rules of purity.",
    afterlife:
      "Moksha (liberation) through dharma (duty), bhakti (devotion) and knowledge, or rebirth according to karma.",
    evidence: {
      status: "documented",
      claim:
        "Temple inscriptions and the Puranas confirm the rise of Vishnu and Shiva as paramount, Devi and Durga as powerful protectors, Lakshmi as a focus of prosperity, and Ganesha as a household guardian; puja and festival practice are well attested.",
      sources: [
        "Doniger, The Hindus: An Alternative History",
        "Pollock, The Language of the Gods in the World of Men",
      ],
      limitation:
        "The Puranas blend myth and instruction; local and regional variations in deity emphasis and ritual are immense. Reading Vishnu, Shiva and Brahma as aspects of Brahman follows Smarta nondualism; Vaishnava and Shaiva texts often treat their own god as supreme in his own right, not one face among equals.",
    },
  },
  {
    id: "tamil-shaivism",
    label: "Tamil Shaivism",
    wiki: "https://en.wikipedia.org/wiki/Shaiva_Siddhanta",
    scope: { years: [100, 1000], bounds: [75, 7, 85, 20] },
    powers: [
      {
        name: "Shiva",
        wiki: "https://en.wikipedia.org/wiki/Shiva",
        domain: "the cosmic dancer, ascetic, destroyer and renewer",
        rank: "paramount",
      },
      {
        name: "Parvati",
        wiki: "https://en.wikipedia.org/wiki/Parvati",
        domain: "the goddess, consort and shakti",
        rank: "major",
        relations: [{ kind: "consort-of", of: "Shiva" }],
      },
      {
        name: "Murugan",
        wiki: "https://en.wikipedia.org/wiki/Murugan",
        domain: "the beautiful youth, warrior, mountain god",
        rank: "major",
        relations: [
          { kind: "child-of", of: "Shiva" },
          { kind: "sibling-of", of: "Ganesha" },
        ],
      },
      {
        name: "Ganesha",
        wiki: "https://en.wikipedia.org/wiki/Ganesha",
        domain: "remover of obstacles, the host of Shiva's company",
        rank: "major",
        relations: [{ kind: "child-of", of: "Shiva" }],
      },
      {
        name: "The sacred river",
        domain: "purification and abundance, Kaveri or local equivalent",
        rank: "local",
      },
      {
        name: "The local temple lord",
        domain: "the guardian deity of the place",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the lineage, continued protection from home",
        rank: "local",
      },
    ],
    practice: [
      "Temple festivals with processions and music.",
      "Sacred bathing in rivers and temple tanks.",
      "Devotional hymn-singing by the bhakti poets.",
      "Flowers and vegetarian offerings to Shiva and the goddess.",
    ],
    specialist:
      "The Shaiva priest, keeper of the temple and the rhythm of ritual.",
    afterlife:
      "Union with Shiva through bhakti (devotion) and knowledge (jnana).",
    evidence: {
      status: "documented",
      claim:
        "The early Tamil Shaiva devotional poets (Nayanar) of the 6th-8th centuries attest to Shiva as paramount, Parvati and Murugan as major powers, and temple festivals as central to worship.",
      sources: [
        "Peterson, Poems to Shiva: The Hymns of the Tamil Saints",
        "Dehejia, Slaves of the Lord: The Path of the Tamil Saints",
      ],
      limitation:
        "Early Tamil texts privilege the ecstatic bhakti experience of the poets; daily village practice is less fully recorded.",
    },
  },
  {
    id: "krishna-vaishnavism",
    label: "Medieval Krishna Vaishnavism",
    wiki: "https://en.wikipedia.org/wiki/Krishnaism",
    scope: { years: [600, 1800], bounds: [60, 8, 92, 35] },
    powers: [
      {
        name: "Krishna",
        wiki: "https://en.wikipedia.org/wiki/Krishna",
        domain: "divine love, the cowherd, the beloved",
        rank: "paramount",
        relations: [{ kind: "aspect-of", of: "Vishnu" }],
      },
      {
        name: "Radha",
        wiki: "https://en.wikipedia.org/wiki/Radha",
        domain: "the beloved of Krishna, eternal consort",
        rank: "major",
        relations: [{ kind: "consort-of", of: "Krishna" }],
      },
      {
        name: "The gopis",
        wiki: "https://en.wikipedia.org/wiki/Gopi",
        domain: "the milkmaids who love Krishna, models of devotion",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Krishna" }],
      },
      {
        name: "Vishnu",
        wiki: "https://en.wikipedia.org/wiki/Vishnu",
        domain: "the preserver, Krishna's cosmic form",
        rank: "major",
      },
      {
        name: "The household shrine",
        domain: "Krishna as present at home, daily darshan",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the house lineage, merit-sharers in devotion",
        rank: "local",
      },
      {
        name: "The sacred grove or pool",
        domain: "the place of Krishna's play, local pilgrimage",
        rank: "local",
      },
    ],
    practice: [
      "Kirtan (devotional song) and group singing.",
      "Darshan (vision) of the deity in the temple.",
      "Milk and butter offerings to Krishna.",
      "Temple festivals re-enacting Krishna's life.",
    ],
    specialist:
      "The temple priest and the itinerant singer of Krishna's tales.",
    afterlife:
      "Eternal communion with Krishna in his realm through bhakti (devotion).",
    evidence: {
      status: "documented",
      claim:
        "The 12th-century Sanskrit poet Jayadeva and the bhakti poets of the north attest to Krishna as paramount, Radha as consort, and kirtan and darshan as central practices; temple inscriptions confirm.",
      sources: [
        "Gitagovinda, translated by Siegel",
        "De, Vaishnava Faith and Movement in India",
      ],
      limitation:
        "Krishna Vaishnavism developed many branches with different philosophical interpretations of divine love; this is one schematic summary.",
    },
  },
  {
    id: "sikh-gurus",
    label: "Sikh Gurus",
    wiki: "https://en.wikipedia.org/wiki/Sikhism",
    scope: { years: [1400, 1800], bounds: [70, 28, 82, 35] },
    powers: [
      {
        name: "Akal Purakh",
        wiki: "https://en.wikipedia.org/wiki/Waheguru",
        domain: "the timeless God, beyond form, all-pervasive",
        rank: "paramount",
      },
      {
        name: "Guru Nanak",
        wiki: "https://en.wikipedia.org/wiki/Guru_Nanak",
        domain: "the first Guru, the founder, the voice of truth",
        rank: "major",
        relations: [{ kind: "serves", of: "Akal Purakh" }],
      },
      {
        name: "Guru Gobind Singh",
        wiki: "https://en.wikipedia.org/wiki/Guru_Gobind_Singh",
        domain: "the tenth Guru, founder of the Khalsa",
        rank: "major",
        relations: [
          { kind: "serves", of: "Akal Purakh" },
          { kind: "taught-by", of: "Guru Nanak" },
        ],
      },
      {
        name: "Guru Granth Sahib",
        wiki: "https://en.wikipedia.org/wiki/Guru_Granth_Sahib",
        domain: "the sacred hymns, the eternal Guru's word",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Guru Nanak" }],
      },
      {
        name: "The sangat",
        domain: "the congregation, the community of seekers",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the family lineage, remembered at kirtan",
        rank: "local",
      },
      {
        name: "The langar",
        domain: "the communal kitchen, nourishment without caste",
        rank: "local",
      },
    ],
    practice: [
      "Naam japna (remembering God) through repetition and prayer.",
      "Kirtan (hymn singing) of the Granth at gatherings.",
      "Langar (communal meal) open to all, ending caste distinctions.",
      "No image worship, no ritual hierarchy based on birth.",
    ],
    specialist: "The Guru (the first ten, then the Granth Sahib itself).",
    afterlife:
      "Merger with the divine through God's grace and the Guru's word.",
    evidence: {
      status: "documented",
      claim:
        "The Guru Granth Sahib and the Rahit (Sikh code) establish Akal Purakh as one God, Guru Nanak and his successors as living teachers, and kirtan and langar as central communal practices.",
      sources: [
        "Guru Granth Sahib",
        "Singh, The Sikhs: Their History and Distinctive Culture",
      ],
      limitation:
        "Sikhism developed multiple theological schools; this captures the shared core established by the early Gurus. The taught-by line from Nanak to Gobind Singh skips the eight intervening Gurus, not listed here as powers.",
    },
  },
  {
    id: "village-goddess-practice",
    label: "Village goddess and spirit practice",
    wiki: "https://en.wikipedia.org/wiki/Gramadevata",
    scope: { years: [-3000, 1950], bounds: [60, 5, 97, 37] },
    powers: [
      {
        name: "The grama devata",
        wiki: "https://en.wikipedia.org/wiki/Gramadevata",
        domain:
          "the village's own goddess, fertility, protection, plague and purity",
        rank: "paramount",
      },
      {
        name: "Mariamman",
        wiki: "https://en.wikipedia.org/wiki/Mariamman",
        domain: "smallpox and epidemic disease, rain, village protection",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "The grama devata" }],
      },
      {
        name: "Yellamma",
        wiki: "https://en.wikipedia.org/wiki/Yellamma",
        domain: "fertility, devotion and penance, identified with Renuka",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "The grama devata" }],
      },
      {
        name: "The ancestors",
        domain: "the household dead, continued presence and blessing",
        rank: "major",
      },
      {
        name: "The household spirit",
        domain: "the family's welfare, the hearth and threshold",
        rank: "major",
        relations: [{ kind: "serves", of: "The grama devata" }],
      },
      {
        name: "Khandoba",
        wiki: "https://en.wikipedia.org/wiki/Khandoba",
        domain: "pastoral guardian and warrior god of the Deccan",
        rank: "local",
      },
      {
        name: "Aiyanar",
        wiki: "https://en.wikipedia.org/wiki/Aiyanar",
        domain: "the horse-mounted guardian of the village boundary",
        rank: "local",
      },
      {
        name: "Manasa",
        wiki: "https://en.wikipedia.org/wiki/Manasa",
        domain: "snakes, protection from snakebite, fertility",
        rank: "local",
      },
      {
        name: "The sacred tree",
        domain: "permanence, shade, local power",
        rank: "local",
      },
      {
        name: "The well or spring",
        domain: "water, community gathering, life",
        rank: "local",
      },
    ],
    practice: [
      "Monthly puja at the village goddess's shrine.",
      "Possession of the priestess during festival times.",
      "Protective offerings at field boundaries and village edges.",
      "Propitiation after misfortune, epidemic or animal attack.",
    ],
    specialist:
      "The village priestess or priest, often female, possessed by or dedicated to the goddess.",
    afterlife:
      "The beneficial dead remain near the village; dangerous ghosts must be propitiated and resolved.",
    evidence: {
      status: "inferred",
      claim:
        "Ethnographic and folklore sources document the persistence of village goddesses such as Mariamman, Yellamma and the wider grama devata class across all major religions, from Bronze Age to modern times, alongside guardian figures like Khandoba and Aiyanar.",
      sources: [
        "Whitehead, The Village Gods of South India",
        "Marriott, The Feast of Love",
      ],
      limitation:
        "Village practice varies widely by region and caste; this is a generalized sketch of widespread patterns.",
    },
  },
  {
    id: "theravada-sri-lanka",
    label: "Theravada Buddhism in Sri Lanka",
    wiki: "https://en.wikipedia.org/wiki/Buddhism_in_Sri_Lanka",
    scope: { years: [200, 1950], bounds: [79, 5, 83, 11] },
    powers: [
      {
        name: "The Buddha",
        wiki: "https://en.wikipedia.org/wiki/Gautama_Buddha",
        domain: "the historical awakened one, exemplar",
        rank: "paramount",
      },
      {
        name: "The Sangha",
        wiki: "https://en.wikipedia.org/wiki/Sangha",
        domain: "the order of monks, keepers of the doctrine",
        rank: "major",
      },
      {
        name: "The Bodhi tree and relics",
        wiki: "https://en.wikipedia.org/wiki/Bodhi_Tree",
        domain: "the Buddha's presence and teaching in tangible form",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "The Buddha" }],
      },
      {
        name: "Vishnu",
        wiki: "https://en.wikipedia.org/wiki/Vishnu",
        domain: "guardian of Sri Lanka and the dharma",
        rank: "major",
        relations: [{ kind: "serves", of: "The Buddha" }],
      },
      {
        name: "Kataragama",
        wiki: "https://en.wikipedia.org/wiki/Kataragama_deviyo",
        domain: "war, guardianship, healing",
        rank: "major",
        relations: [{ kind: "serves", of: "The Buddha" }],
      },
      {
        name: "Pattini",
        wiki: "https://en.wikipedia.org/wiki/Pattini",
        domain: "chastity, healing, protection from disease",
        rank: "major",
        relations: [{ kind: "serves", of: "The Buddha" }],
      },
      {
        name: "Saman",
        wiki: "https://en.wikipedia.org/wiki/Saman_(deity)",
        domain: "guardian of Sri Pada and the southwest",
        rank: "local",
        relations: [{ kind: "serves", of: "The Buddha" }],
      },
      {
        name: "Huniyam",
        domain: "sorcery, vengeance, swift justice",
        rank: "local",
      },
      {
        name: "The household Buddha shrine",
        domain: "the family's daily recollection and merit-making",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the lineage, sharers in merit and protection",
        rank: "local",
      },
      {
        name: "The village tank",
        domain: "water, irrigation, gathering",
        rank: "local",
      },
    ],
    practice: [
      "Alms-giving to monks at dawn.",
      "Temple festivals and processions with relics.",
      "Pilgrimage to the Bodhi tree and the tooth relic.",
      "Vegetarian feasts on full-moon days; merit shared with the dead.",
    ],
    specialist: "The bhikkhu (monk), vowed to Theravada discipline.",
    afterlife:
      "Nirvana through enlightenment, or rebirth in a human or celestial realm according to karma.",
    evidence: {
      status: "documented",
      claim:
        "The Sri Lankan Buddhist chronicles (Mahavamsa) and temple inscriptions attest to the Buddha as paramount, the sangha as guardian of the doctrine, and the island's guardian deities Vishnu, Kataragama, Pattini and Saman as central to lay devotion alongside relic veneration.",
      sources: [
        "Mahavamsa, translated by Geiger",
        "Rahula, The Heritage of the Bhikkhu",
      ],
      limitation:
        "The written sources privilege the monastic tradition; local and lay variations, especially the role of the guardian deities and the ancestors, are less fully preserved.",
    },
  },
  {
    id: "himalayan-newar",
    label: "Himalayan and Newar syncretic practice",
    wiki: "https://en.wikipedia.org/wiki/Newar_Buddhism",
    scope: { years: [400, 1800], bounds: [78, 26, 92, 37] },
    powers: [
      {
        name: "Taleju",
        domain: "sovereignty, royal protection, the valley's tutelary goddess",
        rank: "paramount",
      },
      {
        name: "The Kumari",
        wiki: "https://en.wikipedia.org/wiki/Kumari_(goddess)",
        domain: "the living virgin goddess, embodiment of Taleju",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Taleju" }],
      },
      {
        name: "Bhairava",
        wiki: "https://en.wikipedia.org/wiki/Bhairava",
        domain: "the fierce guardian of thresholds and city gates",
        rank: "major",
        relations: [{ kind: "consort-of", of: "Taleju" }],
      },
      {
        name: "The Ashta Matrika",
        wiki: "https://en.wikipedia.org/wiki/Matrikas",
        domain: "the eight mother goddesses who ring and guard the valley",
        rank: "major",
        relations: [{ kind: "serves", of: "Taleju" }],
      },
      {
        name: "The Nagas",
        wiki: "https://en.wikipedia.org/wiki/Nāga",
        domain: "the serpent kings, water, underground wealth",
        rank: "major",
      },
      {
        name: "The household shrine spirits",
        domain: "the family's welfare and continuance",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the lineage, continued presence",
        rank: "local",
      },
      {
        name: "The seasonal spirits",
        domain: "monsoon, harvest, the turning year",
        rank: "local",
      },
    ],
    practice: [
      "Temple festivals with possession of priestesses.",
      "Propitiation of the Nagas at water sites and crossings.",
      "Household talismans and protective rites.",
      "Seasonal offerings at shrines and thresholds.",
    ],
    specialist:
      "The brahmin priest and the local shaman or juju (spirit medium).",
    afterlife:
      "Rebirth according to karma; the virtuous may remain as protective spirits.",
    evidence: {
      status: "inferred",
      claim:
        "Newar ethnography and temple records from Nepal show Taleju as royal tutelary goddess embodied in the Kumari, Bhairava and the Ashta Matrika as guardians of the city, and Naga propitiation at water sites, with priestesses as primary ritualists.",
      sources: [
        "Levy, Mesocosm: Hinduism and the Organization of a Traditional Newar City in Nepal",
        "Toffin, The Politics of Ritual Kinship",
      ],
      limitation:
        "Newar practice is complex and regionally variable; this is a generalized portrait. Bhairava's standing as Taleju's consort is a scholarly reading of royal ritual, not a single canonical statement.",
    },
  },
  {
    id: "indo-islamic-sufi",
    label: "Indo-Islamic Sufi practice",
    wiki: "https://en.wikipedia.org/wiki/Sufism_in_India",
    scope: { years: [1000, 1950], bounds: [60, 5, 97, 37] },
    powers: [
      {
        name: "Allah",
        wiki: "https://en.wikipedia.org/wiki/Allah",
        domain: "God, transcendent and ineffable",
        rank: "paramount",
      },
      {
        name: "The Prophet Muhammad",
        wiki: "https://en.wikipedia.org/wiki/Muhammad",
        domain: "the messenger, the guide to the divine",
        rank: "major",
        relations: [{ kind: "serves", of: "Allah" }],
      },
      {
        name: "Moinuddin Chishti",
        wiki: "https://en.wikipedia.org/wiki/Moinuddin_Chishti",
        domain: "founder of the Chishti order in India, intercessor",
        rank: "major",
        relations: [{ kind: "taught-by", of: "The Prophet Muhammad" }],
      },
      {
        name: "Nizamuddin Auliya",
        wiki: "https://en.wikipedia.org/wiki/Nizamuddin_Auliya",
        domain: "Chishti master of Delhi, spiritual intercession",
        rank: "major",
        relations: [{ kind: "taught-by", of: "Moinuddin Chishti" }],
      },
      {
        name: "Data Ganj Bakhsh",
        wiki: "https://en.wikipedia.org/wiki/Ali_Hujwiri",
        domain: "early Sufi saint of Lahore, patron of the poor",
        rank: "major",
        relations: [{ kind: "serves", of: "The Prophet Muhammad" }],
      },
      {
        name: "Khidr",
        wiki: "https://en.wikipedia.org/wiki/Khidr",
        domain: "the hidden guide, water, sudden aid to travelers",
        rank: "local",
      },
      {
        name: "The household ancestors",
        domain: "the family lineage, sharers in blessing",
        rank: "local",
      },
      {
        name: "The saint's shrine",
        domain: "healing, blessing, local intercession",
        rank: "local",
      },
      {
        name: "The sacred garden or sanctuary",
        domain: "peace, purification, congregation",
        rank: "local",
      },
    ],
    practice: [
      "Dhikr (remembrance of God) through repetition and prayer.",
      "Qawwali (ecstatic devotional song) at shrine gatherings.",
      "Fasting during Ramadan and personal ascetic practice.",
      "Pilgrimage to the shrine of a revered saint.",
    ],
    specialist:
      "The pir (spiritual master) and the qazi (Islamic legal authority).",
    afterlife: "Paradise through submission to God and the pir's intercession.",
    evidence: {
      status: "documented",
      claim:
        "Sufi poetry and shrine records document the roles of Moinuddin Chishti, Nizamuddin Auliya and Data Ganj Bakhsh as guides and intercessors, qawwali as ecstatic practice, and the saint's shrine as a center of healing and blessing across South Asia.",
      sources: [
        "Eaton, Sufis of Bijapur",
        "Schimmel, The Mystical Dimensions of Islam",
      ],
      limitation:
        "Sufi orders and regional traditions vary greatly; orthodox Islamic scholars often criticized shrine veneration and ecstatic practice. The Chishti taught-by chain here elides several generations of masters between Moinuddin Chishti and Nizamuddin Auliya.",
    },
  },
  {
    id: "hindu-reform",
    label: "Colonial-era Hindu reform",
    wiki: "https://en.wikipedia.org/wiki/Brahmo_Samaj",
    scope: { years: [1750, 1950], bounds: [60, 8, 97, 35] },
    powers: [
      {
        name: "Brahman",
        wiki: "https://en.wikipedia.org/wiki/Brahman",
        domain: "the universal divine principle, rational",
        rank: "paramount",
      },
      {
        name: "The Vedas",
        wiki: "https://en.wikipedia.org/wiki/Vedas",
        domain: "eternal truth, interpreted without ritual excess",
        rank: "major",
      },
      {
        name: "Rammohan Roy",
        wiki: "https://en.wikipedia.org/wiki/Ram_Mohan_Roy",
        domain: "founder of the Brahmo Samaj, rational monotheism",
        rank: "major",
        relations: [{ kind: "serves", of: "Brahman" }],
      },
      {
        name: "Dayananda Saraswati",
        wiki: "https://en.wikipedia.org/wiki/Dayananda_Saraswati",
        domain: "founder of the Arya Samaj, return to Vedic purity",
        rank: "major",
        relations: [{ kind: "serves", of: "Brahman" }],
      },
      {
        name: "Debendranath Tagore",
        wiki: "https://en.wikipedia.org/wiki/Debendranath_Tagore",
        domain: "developer of Brahmo Samaj doctrine and discipline",
        rank: "local",
        relations: [{ kind: "serves", of: "Rammohan Roy" }],
      },
      {
        name: "Keshub Chandra Sen",
        wiki: "https://en.wikipedia.org/wiki/Keshub_Chandra_Sen",
        domain: "Brahmo leader, devotional reform",
        rank: "local",
        relations: [{ kind: "taught-by", of: "Debendranath Tagore" }],
      },
      {
        name: "The household shrine",
        domain: "prayer and remembrance, reformed and simplified",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the lineage, moral exemplars",
        rank: "local",
      },
      {
        name: "The samaj",
        domain: "the congregation of the faithful, moral progress",
        rank: "local",
      },
    ],
    practice: [
      "Prayer without idols or ritual excess.",
      "Study of the Vedas interpreted as reason and ethics.",
      "Social reform: rejection of caste hierarchy and widow-burning.",
      "Congregational gatherings for instruction and moral uplift.",
    ],
    specialist: "The educated Brahmin reformer, often Western-trained.",
    afterlife:
      "Moral progress toward eventual liberation through reason and virtue.",
    evidence: {
      status: "documented",
      claim:
        "The Brahmo Samaj under Rammohan Roy and Debendranath Tagore, and the Arya Samaj under Dayananda Saraswati, established Brahman as one God, the Vedas as ethical teaching rather than ritual prescription, and rejected image worship and caste.",
      sources: [
        "Kopf, The Brahmo Samaj and the Shaping of the Modern Indian Mind",
        "Rammohan Roy, The Precepts of Jesus",
      ],
      limitation:
        "Reform movements were urban and educated, reaching a narrow segment; village and traditional practice continued largely unchanged.",
    },
  },
  {
    id: "maritime-island-practice",
    label: "Maritime and island practice",
    wiki: "https://en.wikipedia.org/wiki/Indian_Ocean_trade",
    scope: { years: [-1000, 1900], bounds: [72, 5, 97, 14] },
    powers: [
      {
        name: "Varuna",
        wiki: "https://en.wikipedia.org/wiki/Varuna",
        domain: "the cosmic ocean, oaths, wind and storm at sea",
        rank: "paramount",
      },
      {
        name: "Manimekhala",
        domain: "guardian goddess of the sea, protector of ships and sailors",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Varuna" }],
      },
      {
        name: "Vibhishana",
        wiki: "https://en.wikipedia.org/wiki/Vibhishana",
        domain: "tutelary guardian of the western seas and coast",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the voyage, protection at sea",
        rank: "major",
      },
      {
        name: "*Māri",
        gloss: "Proto-Dravidian *māri, 'rain'",
        domain: "the monsoon, the season, life and trade",
        rank: "local",
      },
      {
        name: "*Kal",
        gloss: "Proto-Dravidian *kal, 'stone'",
        domain: "the sacred reef, abundance, the boundary between worlds",
        rank: "local",
      },
      {
        name: "The household hearth",
        domain: "home, safety after the voyage",
        rank: "local",
      },
      {
        name: "The island spirits",
        domain: "the place, shelter, the coconut and the reef",
        rank: "local",
      },
    ],
    practice: [
      "Offerings made before departure and after safe return.",
      "Seasonal navigation by monsoon knowledge.",
      "Ritual care of the boat and the sail.",
      "Feasting after a successful voyage, shared with the dead.",
    ],
    specialist:
      "The pilot and the elder, keepers of the wind and current knowledge.",
    afterlife:
      "The drowned remain with the sea; the blessed join the ancestors in the reef.",
    evidence: {
      status: "hypothesis",
      claim:
        "Coastal archaeological sites and ethnographic accounts of Tamil, Kerala and Sri Lankan seafaring suggest organized maritime practices tied to monsoons and to sea guardians such as Varuna, Manimekhala and Vibhishana.",
      sources: [
        "Chaudhuri, Trade and Civilisation in the Indian Ocean",
        "Alpers, The Indian Ocean in World History",
        "Krishnamurti, The Dravidian Languages",
      ],
      limitation:
        "Maritime practices are harder to detect archaeologically; this draws on ethnographic parallels and the widespread evidence of early Indian Ocean trade. The starred names are Proto-Dravidian words for rain and stone, reconstructed by comparative linguists from the coastal Dravidian languages spoken here, not recorded names for the monsoon or the reef as powers.",
    },
  },
  {
    id: "deccan-regional",
    label: "Deccan regional practice",
    wiki: "https://en.wikipedia.org/wiki/Deccan_Plateau",
    scope: { years: [-1000, 1600], bounds: [73, 12, 85, 24] },
    powers: [
      {
        name: "Khandoba",
        wiki: "https://en.wikipedia.org/wiki/Khandoba",
        domain: "guardian of the passes and roads, patron of pastoralists",
        rank: "paramount",
      },
      {
        name: "Vithoba",
        wiki: "https://en.wikipedia.org/wiki/Vithoba",
        domain: "the pilgrim god of Pandharpur, devotion",
        rank: "major",
      },
      {
        name: "Tuljabhavani",
        wiki: "https://en.wikipedia.org/wiki/Tulja_Bhavani",
        domain: "the warrior goddess, patroness of the Deccan dynasties",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the lineage, blessing of place",
        rank: "major",
      },
      {
        name: "Mhasoba",
        domain: "the buffalo-spirit guardian of the village boundary",
        rank: "local",
        relations: [{ kind: "serves", of: "Khandoba" }],
      },
      {
        name: "The sacred hill",
        domain: "permanence, sanctuary, power",
        rank: "local",
      },
      {
        name: "The grazing commons",
        domain: "herds, seasonal movement, shared right",
        rank: "local",
      },
      {
        name: "The water tank",
        domain: "life, gathering, collective care",
        rank: "local",
      },
    ],
    practice: [
      "Annual festivals at the mountain shrines.",
      "Herding movements following the seasons and rainfall.",
      "Pilgrimage on foot to Pandharpur.",
      "Ritual maintenance of wells and tanks.",
    ],
    specialist: "The village headman and the priestess of the local goddess.",
    afterlife:
      "The dead remain near the place; the blessed become protective spirits.",
    evidence: {
      status: "inferred",
      claim:
        "Deccan inscriptions and ethnographic work on plateau societies attest to Khandoba as guardian of routes and pastoralists, Vithoba's pilgrimage cult at Pandharpur, and Tuljabhavani as patron of Deccan dynasties, alongside herding practice and water management.",
      sources: [
        "Wink, Al-Hind: The Making of the Indo-Islamic World",
        "Eaton, Sufis of Bijapur",
      ],
      limitation:
        "Regional kingdoms varied greatly; this represents a generalized Deccan plateau pattern. Mhasoba's subordination to Khandoba reflects a common but not universal village hierarchy of guardian spirits.",
    },
  },
  {
    id: "northeast-regional",
    label: "Northeast regional practice",
    wiki: "https://en.wikipedia.org/wiki/Donyi-Polo",
    scope: { years: [-500, 1800], bounds: [87, 20, 97, 37] },
    powers: [
      {
        name: "Donyi-Polo",
        wiki: "https://en.wikipedia.org/wiki/Donyi-Polo",
        domain: "the Sun and Moon, supreme witnesses of truth",
        rank: "paramount",
      },
      {
        name: "Kepenuo",
        domain:
          "Angami Naga guardian spirit of the village gate and prosperity",
        rank: "major",
      },
      {
        name: "The forest spirits",
        domain: "wild animals, plants, the boundary between settled and wild",
        rank: "major",
      },
      {
        name: "*Pwa",
        gloss: "Proto-Tibeto-Burman *pwa, 'grandfather, ancestor'",
        domain: "the lineage, the clan, continued presence",
        rank: "major",
      },
      {
        name: "Ka Iawbei",
        domain: "the Khasi primordial ancestress, root of the clan",
        rank: "local",
      },
      {
        name: "*Mey",
        gloss: "Proto-Tibeto-Burman *mey, 'fire'",
        domain: "family, daily life, protection",
        rank: "local",
      },
      {
        name: "The sacred grove",
        domain: "the place of knowledge, initiation",
        rank: "local",
      },
      {
        name: "*Ti",
        gloss: "Proto-Tibeto-Burman *ti, 'water'",
        domain: "wells, springs, health",
        rank: "local",
      },
    ],
    practice: [
      "Seasonal hunting rituals and propitiation of animal spirits.",
      "Seasonal migrations to forest and hill.",
      "Ancestor veneration at household and clan gatherings.",
      "Forest clearing and clearing ceremonies.",
    ],
    specialist:
      "The elder and the shaman, keepers of the ways of the forest and river.",
    afterlife:
      "The dead remain at home with the lineage; the shamans may travel between worlds.",
    evidence: {
      status: "hypothesis",
      claim:
        "Ethnographic work on Northeast Indian societies shows Tani-speaking veneration of Donyi-Polo, Angami Naga guardian spirits such as Kepenuo, Khasi ancestress cults, forest propitiation, and shamanic practice across diverse ethnic groups.",
      sources: [
        "Verrier Elwin, The Tribal Myths of India",
        "Roy, The Khonds",
        "Matisoff, Handbook of Proto-Tibeto-Burman",
      ],
      limitation:
        "Northeast societies are highly diverse, with hundreds of distinct traditions; this represents a generalized pattern of river-valley and forest communities. Donyi-Polo, Kepenuo and Ka Iawbei are recorded names in their own Tani, Angami and Khasi languages; the starred forms alongside them are Proto-Tibeto-Burman vocabulary reconstructed by comparative linguists (Ka Iawbei's own Khasi is Austroasiatic, not Tibeto-Burman, a mismatch this sketch does not resolve), and a word for fire or water is not evidence of a fire god or water god addressed by it here.",
    },
  },
  {
    id: "bengal-specific",
    label: "Bengal regional practice",
    wiki: "https://en.wikipedia.org/wiki/Bengali_Hindus",
    scope: { years: [-500, 1950], bounds: [85, 22, 92, 30] },
    powers: [
      {
        name: "Ganga",
        wiki: "https://en.wikipedia.org/wiki/Ganga_(goddess)",
        domain: "purification, fertility, the sacred river",
        rank: "paramount",
      },
      {
        name: "Manasa",
        wiki: "https://en.wikipedia.org/wiki/Manasa",
        domain: "snakes, protection from snakebite, fertility",
        rank: "major",
      },
      {
        name: "Shashthi",
        wiki: "https://en.wikipedia.org/wiki/Shashthi",
        domain: "childbirth, the protection of children",
        rank: "major",
      },
      {
        name: "Dharma Thakur",
        domain: "justice and moral order, worshipped as sun or stone",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the household and lineage, continued presence",
        rank: "major",
      },
      {
        name: "Bonbibi",
        wiki: "https://en.wikipedia.org/wiki/Bonbibi",
        domain: "guardian of the Sundarbans forest, protection from tigers",
        rank: "local",
      },
      {
        name: "Olabibi",
        domain: "protection from cholera and epidemic disease",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "Bonbibi" }],
      },
      {
        name: "The household shrine",
        domain: "daily puja, family protection",
        rank: "local",
      },
      {
        name: "The banyan tree",
        domain: "permanence, shade, gathering",
        rank: "local",
      },
      {
        name: "The rice paddy spirits",
        domain: "crops, flooding, seasonal cycle",
        rank: "local",
      },
    ],
    practice: [
      "Ritual bathing in the Ganges at pilgrimage times.",
      "Monthly puja at the shrines of Manasa and Shashthi.",
      "Cremation at the riverside, with bones cast into the sacred water.",
      "Household worship at the family altar with flowers and food.",
    ],
    specialist:
      "The brahmin priest at temple and home; the boatman on the river.",
    afterlife:
      "Cremation and casting into the Ganges ensures liberation; the dead join the river and the ancestors.",
    evidence: {
      status: "documented",
      claim:
        "Vedic and Puranic texts, colonial accounts, and modern ethnography attest to Ganga as sacred center, and to Manasa, Shashthi, Dharma Thakur and the Sundarbans guardians Bonbibi and Olabibi as widespread Bengali folk cults alongside household puja.",
      sources: [
        "Doniger, The Hindus: An Alternative History",
        "Risley, The Tribes and Castes of Bengal",
      ],
      limitation:
        "Bengal's religious life is complex and pluralistic; this represents the Hindu-centered majority practice.",
    },
  },
];
