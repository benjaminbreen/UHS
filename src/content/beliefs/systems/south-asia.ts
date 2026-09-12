import type { BeliefSystem } from "../types";

/** South Asian belief systems from the Indus Valley through the colonial era.
 * Coverage emphasizes the local powers actually addressed by villagers: the
 * household dead, the village goddess, the field spirit, the sacred tree.
 */
export const southAsia: readonly BeliefSystem[] = [
  {
    id: "prehistoric-foragers",
    label: "Prehistoric forager practice",
    scope: { years: [-10000, -3000], bounds: [60, 5, 92, 37] },
    powers: [
      {
        name: "The ancestors",
        domain: "the lineage of the dead, guidance and presence",
        rank: "paramount",
      },
      {
        name: "The spirits of the animals",
        domain: "game animals, the hunt, abundance",
        rank: "major",
      },
      {
        name: "The water places",
        domain: "rivers, springs, gathering and sustenance",
        rank: "major",
      },
      {
        name: "The sacred grove",
        domain: "shelter, refuge, settled knowledge",
        rank: "local",
      },
      {
        name: "The rock shelter",
        domain: "home, protection, gathering place",
        rank: "local",
      },
      {
        name: "The lightning and storm",
        domain: "danger, renewal, awe",
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
      ],
      limitation:
        "No written records; interpretation rests on material remains and ethnographic parallels with living forager societies.",
    },
  },
  {
    id: "early-farming-neolithic",
    label: "Early farming and herding communities",
    scope: { years: [-5000, -2300], bounds: [60, 5, 92, 37] },
    powers: [
      {
        name: "The ancestors",
        domain: "the lineage of the dead, blessing the fields",
        rank: "paramount",
      },
      {
        name: "The earth mother",
        domain: "crops, fertility, the soil",
        rank: "major",
      },
      {
        name: "The herd spirits",
        domain: "cattle and flocks, wealth and sustenance",
        rank: "major",
      },
      {
        name: "The water spirits",
        domain: "rivers, wells, life and purification",
        rank: "major",
      },
      {
        name: "The household hearth",
        domain: "family, fire, daily life",
        rank: "local",
      },
      {
        name: "The field spirit",
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
      status: "inferred",
      claim:
        "Neolithic sites across South Asia show structured settlements, domestic crops and animals, elaborate burials, and evidence of household ritual, suggesting organized agricultural ritual from early farming's arrival.",
      sources: [
        "Possehl, The Indus Civilization: A Contemporary Perspective",
        "Fuller, Agricultural Beginnings in the Indian Subcontinent",
      ],
      limitation:
        "Neolithic material culture varies widely; this sketch flattens regional differences in farming and ritual adoption.",
    },
  },
  {
    id: "indus-valley",
    label: "Indus Valley ritual practice",
    scope: { years: [-2300, -1300], bounds: [60, 23, 77, 34] },
    powers: [
      {
        name: "The horned figure on the seals",
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
        name: "The tree deity",
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
        name: "The earth mother",
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
      ],
      limitation:
        "No written records; interpretation rests entirely on archaeological form and distribution.",
    },
  },
  {
    id: "vedic-early",
    label: "Early Vedic practice",
    scope: { years: [-1500, -1000], bounds: [60, 20, 97, 37] },
    powers: [
      {
        name: "Indra",
        domain: "storm, cattle, kingship",
        rank: "paramount",
      },
      {
        name: "Varuna",
        domain: "cosmic order, oaths, the waters",
        rank: "major",
      },
      {
        name: "Agni",
        domain: "fire, sacrifice, the bridge between worlds",
        rank: "major",
      },
      {
        name: "Soma",
        domain: "intoxication, immortality, the ritual drink",
        rank: "major",
      },
      {
        name: "Surya",
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
    scope: { years: [-1000, -200], bounds: [60, 8, 97, 37] },
    powers: [
      {
        name: "Brahman",
        domain: "the ultimate reality, undifferentiated",
        rank: "paramount",
      },
      {
        name: "Prajapati",
        domain: "the creator of creatures",
        rank: "major",
      },
      {
        name: "Rudra",
        domain: "storms, asceticism, transformation",
        rank: "major",
      },
      {
        name: "The Atman",
        domain: "the self, breath, inner truth",
        rank: "major",
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
    scope: { years: [-500, 200], bounds: [60, 8, 97, 37] },
    powers: [
      {
        name: "The Buddha",
        domain: "awakening, the path to cessation of suffering",
        rank: "paramount",
      },
      {
        name: "The Sangha",
        domain: "the order of monks, the community of practice",
        rank: "major",
      },
      {
        name: "Shakra",
        domain: "sky god, protector of the dharma",
        rank: "major",
        relation: { kind: "serves", of: "The Buddha" },
      },
      {
        name: "Brahma",
        domain: "the celestial realm, messenger of dharma",
        rank: "major",
        relation: { kind: "serves", of: "The Buddha" },
      },
      {
        name: "The local protective deity",
        domain: "the guardian of the settlement",
        rank: "local",
      },
      {
        name: "The household dead",
        domain: "the family's ancestors, merit-sharers",
        rank: "local",
      },
      {
        name: "The bodhi tree",
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
        "The Pali Canon depicts the Buddha as paramount, the sangha as the instrument of his teaching, and earlier deities like Shakra and Brahma as supportive but subordinate protectors.",
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
    scope: { years: [-500, 800], bounds: [70, 19, 78, 27] },
    powers: [
      {
        name: "The Jinas",
        domain: "the victorious ones, liberated perfected beings",
        rank: "paramount",
      },
      {
        name: "Mahavira",
        domain: "the last Jina, the exemplar of renunciation",
        rank: "major",
        relation: { kind: "aspect-of", of: "The Jinas" },
      },
      {
        name: "The Yakshas",
        domain: "protecting spirits around the Jinas",
        rank: "major",
      },
      {
        name: "Saraswati",
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
        name: "The sacred space",
        domain: "the temple or grove where asceticism is practiced",
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
        "The Jain texts present the Jinas as perfected beings and Mahavira as the exemplar of complete renunciation; extreme asceticism and non-violence are the core practices.",
      sources: ["Dundas, The Jains", "Wiley, The A to Z of Jainism"],
      limitation:
        "The texts emphasize the monastic ideal; lay Jain practice and local variations are less fully preserved.",
    },
  },
  {
    id: "gupta-puranic",
    label: "Gupta-era Puranic Hinduism",
    scope: { years: [100, 1000], bounds: [60, 8, 97, 37] },
    powers: [
      {
        name: "Brahman",
        domain: "the ultimate reality, manifest in the gods",
        rank: "paramount",
      },
      {
        name: "Vishnu",
        domain: "preservation, kingship, the embodied divine",
        rank: "major",
      },
      {
        name: "Shiva",
        domain: "destruction, asceticism, cosmic renewal",
        rank: "major",
      },
      {
        name: "Devi/Shakti",
        domain: "the goddess, power, destruction and protection",
        rank: "major",
        relation: { kind: "consort-of", of: "Shiva" },
      },
      {
        name: "Brahma",
        domain: "creation, less worshipped in practice",
        rank: "major",
      },
      {
        name: "Ganesha",
        domain: "remover of obstacles, the elephant-headed guardian",
        rank: "local",
        relation: { kind: "child-of", of: "Shiva" },
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
        "Temple inscriptions and the Puranas confirm the rise of Vishnu and Shiva as paramount, Devi as powerful, and Ganesha as a household protector; puja and festival practice are well attested.",
      sources: [
        "Doniger, The Hindus: An Alternative History",
        "Pollock, The Language of the Gods in the World of Men",
      ],
      limitation:
        "The Puranas blend myth and instruction; local and regional variations in deity emphasis and ritual are immense.",
    },
  },
  {
    id: "tamil-shaivism",
    label: "Tamil Shaivism",
    scope: { years: [100, 1000], bounds: [75, 7, 85, 20] },
    powers: [
      {
        name: "Shiva",
        domain: "the cosmic dancer, ascetic, destroyer and renewer",
        rank: "paramount",
      },
      {
        name: "Parvati",
        domain: "the goddess, consort and shakti",
        rank: "major",
        relation: { kind: "consort-of", of: "Shiva" },
      },
      {
        name: "Murugan",
        domain: "the beautiful youth, warrior, mountain god",
        rank: "major",
        relation: { kind: "child-of", of: "Shiva" },
      },
      {
        name: "Ganesha",
        domain: "remover of obstacles, the host of Shiva's company",
        rank: "major",
        relation: { kind: "child-of", of: "Shiva" },
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
    scope: { years: [600, 1800], bounds: [60, 8, 92, 35] },
    powers: [
      {
        name: "Krishna",
        domain: "divine love, the cowherd, the beloved",
        rank: "paramount",
      },
      {
        name: "Radha",
        domain: "the beloved of Krishna, eternal consort",
        rank: "major",
        relation: { kind: "consort-of", of: "Krishna" },
      },
      {
        name: "The gopis",
        domain: "the milkmaids who love Krishna, models of devotion",
        rank: "major",
        relation: { kind: "aspect-of", of: "Krishna" },
      },
      {
        name: "Vishnu",
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
    scope: { years: [1400, 1800], bounds: [70, 28, 82, 35] },
    powers: [
      {
        name: "Akal Purakh",
        domain: "the timeless God, beyond form, all-pervasive",
        rank: "paramount",
      },
      {
        name: "The Guru",
        domain: "the living teacher, the voice of truth",
        rank: "major",
        relation: { kind: "serves", of: "Akal Purakh" },
      },
      {
        name: "The Granth",
        domain: "the sacred hymns, the word of the Guru",
        rank: "major",
        relation: { kind: "aspect-of", of: "The Guru" },
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
        "The Guru Granth Sahib and the Rahit (Sikh code) establish Akal Purakh as one God, the Guru as teacher, and kirtan and langar as central communal practices.",
      sources: [
        "Guru Granth Sahib",
        "Singh, The Sikhs: Their History and Distinctive Culture",
      ],
      limitation:
        "Sikhism developed multiple theological schools; this captures the shared core established by the early Gurus.",
    },
  },
  {
    id: "village-goddess-practice",
    label: "Village goddess and spirit practice",
    scope: { years: [-3000, 1950], bounds: [60, 5, 97, 37] },
    powers: [
      {
        name: "The village goddess",
        domain: "fertility, protection, plague and purity",
        rank: "paramount",
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
        relation: { kind: "serves", of: "The village goddess" },
      },
      {
        name: "The field spirit",
        domain: "crops, water, agricultural boundaries",
        rank: "major",
      },
      {
        name: "The serpent at the field bund",
        domain: "fertility and danger, protection and poison",
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
        "Ethnographic and folklore sources document the persistence of village goddesses across all major religions, from Bronze Age to modern times, suggesting a substrate of local protection and fertility worship.",
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
    scope: { years: [200, 1950], bounds: [79, 5, 83, 11] },
    powers: [
      {
        name: "The Buddha",
        domain: "the historical awakened one, exemplar",
        rank: "paramount",
      },
      {
        name: "The Sangha",
        domain: "the order of monks, keepers of the doctrine",
        rank: "major",
      },
      {
        name: "The Bodhi tree and relics",
        domain: "the Buddha's presence and teaching in tangible form",
        rank: "major",
        relation: { kind: "aspect-of", of: "The Buddha" },
      },
      {
        name: "The protective deities",
        domain: "Shakra, Brahma and local guardians of the dharma",
        rank: "major",
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
        "The Sri Lankan Buddhist chronicles (Mahavamsa) and temple inscriptions attest to the Buddha as paramount, the sangha as guardian of the doctrine, and relic veneration as central to practice.",
      sources: [
        "Mahavamsa, translated by Geiger",
        "Rahula, The Heritage of the Bhikkhu",
      ],
      limitation:
        "The written sources privilege the monastic tradition; local and lay variations, especially the role of protective deities and the ancestors, are less fully preserved.",
    },
  },
  {
    id: "himalayan-newar",
    label: "Himalayan and Newar syncretic practice",
    scope: { years: [400, 1800], bounds: [78, 26, 92, 37] },
    powers: [
      {
        name: "The mountain goddess",
        domain: "fertility, protection, the sovereignty of place",
        rank: "paramount",
      },
      {
        name: "Shiva",
        domain: "the great ascetic, cosmic renewal",
        rank: "major",
        relation: { kind: "consort-of", of: "The mountain goddess" },
      },
      {
        name: "The Nagas",
        domain: "the serpent kings, water, underground wealth",
        rank: "major",
      },
      {
        name: "The local protecting deities",
        domain: "place-specific guardians and spirits",
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
        "Newar ethnography and temple records from Nepal show a synthesis of Shiva worship, Naga propitiation, and local goddess cults, with priestesses as the primary ritualists.",
      sources: [
        "Levy, Mesocosm: Hinduism and the Organization of a Traditional Newar City in Nepal",
        "Toffin, The Politics of Ritual Kinship",
      ],
      limitation:
        "Newar practice is complex and regionally variable; this is a generalized portrait.",
    },
  },
  {
    id: "indo-islamic-sufi",
    label: "Indo-Islamic Sufi practice",
    scope: { years: [1000, 1950], bounds: [60, 5, 97, 37] },
    powers: [
      {
        name: "Allah",
        domain: "God, transcendent and ineffable",
        rank: "paramount",
      },
      {
        name: "The Prophet Muhammad",
        domain: "the messenger, the guide to the divine",
        rank: "major",
        relation: { kind: "serves", of: "Allah" },
      },
      {
        name: "The Sufi saint or pir",
        domain: "the spiritual master, intercessor, guide to God",
        rank: "major",
        relation: { kind: "aspect-of", of: "The Prophet Muhammad" },
      },
      {
        name: "The household ancestors",
        domain: "the family lineage, sharers in blessing",
        rank: "local",
      },
      {
        name: "The protective saint's shrine",
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
        "Sufi poetry and shrine records document the role of the pir as guide and intercessor, qawwali as ecstatic practice, and the saint's shrine as a center of healing and blessing across South Asia.",
      sources: [
        "Eaton, Sufis of Bijapur",
        "Schimmel, The Mystical Dimensions of Islam",
      ],
      limitation:
        "Sufi orders and regional traditions vary greatly; orthodox Islamic scholars often criticized shrine veneration and ecstatic practice.",
    },
  },
  {
    id: "hindu-reform",
    label: "Colonial-era Hindu reform",
    scope: { years: [1750, 1950], bounds: [60, 8, 97, 35] },
    powers: [
      {
        name: "Brahman",
        domain: "the universal divine principle, rational",
        rank: "paramount",
      },
      {
        name: "The Vedas",
        domain: "eternal truth, interpreted without ritual excess",
        rank: "major",
      },
      {
        name: "The reformer or teacher",
        domain: "the guide to modern understanding",
        rank: "major",
        relation: { kind: "serves", of: "Brahman" },
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
        name: "The community",
        domain: "the sangha of the faithful, moral progress",
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
        "The Brahmo Samaj and other reform movements of 19th-century Bengal established Brahman as one God, the Vedas as ethical teaching rather than ritual prescription, and rejected image worship and caste.",
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
    scope: { years: [-1000, 1900], bounds: [72, 5, 97, 14] },
    powers: [
      {
        name: "The sea and the wind",
        domain: "travel, abundance, danger",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "the voyage, protection at sea",
        rank: "major",
      },
      {
        name: "The island spirits",
        domain: "the place, shelter, the coconut and the reef",
        rank: "major",
      },
      {
        name: "The monsoon",
        domain: "the season, the weather, life and trade",
        rank: "local",
      },
      {
        name: "The sacred reef",
        domain: "abundance, the boundary between worlds",
        rank: "local",
      },
      {
        name: "The household hearth",
        domain: "home, safety after the voyage",
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
      status: "inferred",
      claim:
        "Coastal archaeological sites and ethnographic accounts of Tamil, Kerala and Sri Lankan seafaring suggest organized maritime practices tied to monsoons and spirit propitiation.",
      sources: [
        "Chaudhuri, Trade and Civilisation in the Indian Ocean",
        "Alpers, The Indian Ocean in World History",
      ],
      limitation:
        "Maritime practices are harder to detect archaeologically; this draws on ethnographic parallels and the widespread evidence of early Indian Ocean trade.",
    },
  },
  {
    id: "deccan-regional",
    label: "Deccan regional practice",
    scope: { years: [-1000, 1600], bounds: [73, 12, 85, 24] },
    powers: [
      {
        name: "The mountain passes",
        domain: "trade, connection, abundance",
        rank: "paramount",
      },
      {
        name: "The local prince",
        domain: "protection, tribute, seasonal right",
        rank: "major",
      },
      {
        name: "The village goddess",
        domain: "fertility, plague, protection",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the lineage, blessing of place",
        rank: "major",
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
      "Tribute and offerings to the local prince.",
      "Ritual maintenance of wells and tanks.",
    ],
    specialist: "The village headman and the priestess of the local goddess.",
    afterlife:
      "The dead remain near the place; the blessed become protective spirits.",
    evidence: {
      status: "inferred",
      claim:
        "Deccan inscriptions and ethnographic work on plateau societies show regional kingdoms organizing temple ritual, herding practice, and water management across millennium-long periods.",
      sources: [
        "Wink, Al-Hind: The Making of the Indo-Islamic World",
        "Eaton, Sufis of Bijapur",
      ],
      limitation:
        "Regional kingdoms varied greatly; this represents a generalized Deccan plateau pattern.",
    },
  },
  {
    id: "northeast-regional",
    label: "Northeast regional practice",
    scope: { years: [-500, 1800], bounds: [87, 20, 97, 37] },
    powers: [
      {
        name: "The river",
        domain: "life, fertility, movement",
        rank: "paramount",
      },
      {
        name: "The forest spirits",
        domain: "wild animals, plants, the boundary between settled and wild",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the lineage, the clan, continued presence",
        rank: "major",
      },
      {
        name: "The hill spirits",
        domain: "the peaks, shelter, vision",
        rank: "major",
      },
      {
        name: "The household hearth",
        domain: "family, daily life, protection",
        rank: "local",
      },
      {
        name: "The sacred grove",
        domain: "the place of knowledge, initiation",
        rank: "local",
      },
      {
        name: "The water spirits",
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
      status: "inferred",
      claim:
        "Ethnographic work on Northeast Indian societies shows river-centered settlement, forest propitiation, ancestor veneration, and shamanic practice across diverse ethnic groups.",
      sources: ["Verrier Elwin, The Tribal Myths of India", "Roy, The Khonds"],
      limitation:
        "Northeast societies are highly diverse; this represents a generalized pattern of river-valley and forest communities.",
    },
  },
  {
    id: "bengal-specific",
    label: "Bengal regional practice",
    scope: { years: [-500, 1950], bounds: [85, 22, 92, 30] },
    powers: [
      {
        name: "The Ganges",
        domain: "purification, fertility, the sacred river",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "the household and lineage, continued presence",
        rank: "major",
      },
      {
        name: "The village goddess",
        domain: "fertility, health, protection",
        rank: "major",
        relation: { kind: "aspect-of", of: "The Ganges" },
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
      "Monthly puja at the village goddess shrine.",
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
        "Vedic and Puranic texts, colonial accounts, and modern ethnography attest to the Ganges as sacred center, village goddess cults, and household puja across Bengal for millennia.",
      sources: [
        "Doniger, The Hindus: An Alternative History",
        "Risley, The Tribes and Castes of Bengal",
      ],
      limitation:
        "Bengal's religious life is complex and pluralistic; this represents the Hindu-centered majority practice.",
    },
  },
];
