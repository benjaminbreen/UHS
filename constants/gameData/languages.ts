/**
 * constants/gameData/languages.ts
 * Comprehensive historical language data for all regions and eras
 *
 * REVISION NOTE:
 * LLM prompts have been rewritten to focus on LINGUISTIC STYLE (how to speak)
 * rather than TOPICAL STEREOTYPES (what to speak about). This encourages the LLM
 * to generate authentic, personal dialogue appropriate to the character and context,
 * rather than cultural caricatures. Prompts for unattested languages guide the

 * LLM in plausible reconstruction.
 */

import { HistoricalEra, CulturalZone } from '../../types';

export interface LanguageData {
  id: string;
  name: string;
  nativeName?: string; // Name in the language itself
  family: string; // Language family
  script?: string | string[]; // Writing system(s) used
  period: [number, number]; // Active period [start year, end year]
  regions: string[]; // Geographic regions where spoken
  culturalZones: CulturalZone[];
  isReconstructed?: boolean; // True if the language is a scholarly reconstruction
  predecessors?: string[]; // Languages it evolved from
  successors?: string[]; // Languages it evolved into
  description?: string;
  greetings?: { // Common greetings/phrases
    hello?: string;
    goodbye?: string;
    yes?: string;
    no?: string;
    thanks?: string;
  };
  llmPrompt: string; // Instructions for LLM on HOW to roleplay this language's style
}

// Language families for reference
export const LANGUAGE_FAMILIES = {
  INDO_EUROPEAN: 'Indo-European',
  SINO_TIBETAN: 'Sino-Tibetan',
  AFRO_ASIATIC: 'Afro-Asiatic',
  NIGER_CONGO: 'Niger-Congo',
  AUSTRONESIAN: 'Austronesian',
  DRAVIDIAN: 'Dravidian',
  TURKIC: 'Turkic',
  MONGOLIC: 'Mongolic',
  URALIC: 'Uralic',
  ALGONQUIAN: 'Algonquian',
  SIOUAN_CATAWBAN: 'Siouan-Catawban',
  IROQUOIAN: 'Iroquoian',
  UTO_AZTECAN: 'Uto-Aztecan',
  MAYAN: 'Mayan',
  QUECHUAN: 'Quechuan',
  PAMA_NYUNGAN: 'Pama-Nyungan',
  AUSTRALIAN_NON_PAMA_NYUNGAN: 'Australian (Non-Pama-Nyungan)',
  ISOLATE: 'Language Isolate',
  PIDGIN: 'Pidgin',
};

export const LANGUAGES: Record<string, LanguageData> = {
  // === ANCIENT LANGUAGES (Pre-500 CE) ===
  
  // Mediterranean & Near East
  LATIN: {
    id: 'LATIN',
    name: 'Latin',
    nativeName: 'Lingua Latina',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [-753, 600],
    regions: ['Rome', 'Italy', 'Roman Empire', 'Gaul', 'Hispania', 'Britannia'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    successors: ['VULGAR_LATIN', 'ITALIAN', 'FRENCH', 'SPANISH', 'PORTUGUESE', 'ROMANIAN'],
    greetings: {
      hello: 'Salve',
      goodbye: 'Vale',
      yes: 'Ita',
      no: 'Non',
      thanks: 'Gratias tibi',
    },
    llmPrompt: 'Emulate the syntax and style of Classical Latin prose (e.g., Cicero). Use a subject-object-verb (SOV) word order as a baseline, but allow flexibility for emphasis. Fully utilize the complex system of noun declensions and verb conjugations to show relationships between words. Maintain a formal, educated, and somewhat stoic register.',
  },

  ANCIENT_GREEK: {
    id: 'ANCIENT_GREEK',
    name: 'Ancient Greek',
    nativeName: 'Ἑλληνικά',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Greek',
    period: [-800, -300], // Archaic to end of Classical period
    regions: ['Greece', 'Athens', 'Sparta', 'Macedonia', 'Asia Minor', 'Alexandria'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    successors: ['KOINE_GREEK', 'BYZANTINE_GREEK', 'MODERN_GREEK'],
    greetings: {
      hello: 'Χαῖρε',
      goodbye: 'Ἔρρωσο',
      yes: 'Ναί',
      no: 'Οὔ',
      thanks: 'Εὐχαριστῶ',
    },
    llmPrompt: 'Adopt the Attic dialect of the Classical period. Word order is very flexible due to inflection, but default to SVO. Use a rich vocabulary suitable for philosophical, political, or rhetorical discourse. Employ particles (e.g., μέν, δέ, γάρ) to create logical, flowing connections between clauses and sentences.',
  },

  ARAMAIC: {
    id: 'ARAMAIC',
    name: 'Aramaic',
    nativeName: 'ܐܪܡܝܐ',
    family: LANGUAGE_FAMILIES.AFRO_ASIATIC,
    script: 'Aramaic',
    period: [-1000, 700],
    regions: ['Syria', 'Mesopotamia', 'Levant', 'Persia'],
    culturalZones: ['MENA' as CulturalZone],
    successors: ['SYRIAC', 'MANDAIC'],
    greetings: {
      hello: 'Shlama',
      goodbye: 'Shlama',
      yes: 'Ayn',
      no: 'La',
      thanks: 'Taudi',
    },
    llmPrompt: 'Emulate Imperial Aramaic, the administrative lingua franca. The syntax is typically Verb-Subject-Object (VSO). The tone should be practical, clear, and direct, suitable for trade, legal documents, and official correspondence. Avoid overly poetic or metaphorical language unless quoting scripture.',
  },

  AKKADIAN: {
    id: 'AKKADIAN',
    name: 'Akkadian',
    nativeName: '𒀝𒅗𒁺𒌑',
    family: LANGUAGE_FAMILIES.AFRO_ASIATIC,
    script: 'Cuneiform',
    period: [-2500, -100],
    regions: ['Babylon', 'Assyria', 'Mesopotamia'],
    culturalZones: ['MENA' as CulturalZone],
    description: 'Language of ancient Mesopotamian empires. A Semitic language, but not an ancestor of Aramaic.',
    llmPrompt: 'Emulate the style of Old Babylonian/Standard Babylonian cuneiform inscriptions. Use a strict Subject-Object-Verb (SOV) word order. The tone should be formal, elevated, and often formulaic, especially in royal or religious contexts. Phrasing should reflect the structure of official proclamations and legal codes.',
  },

  ANCIENT_EGYPTIAN: {
    id: 'ANCIENT_EGYPTIAN',
    name: 'Ancient Egyptian',
    nativeName: 'r n km.t',
    family: LANGUAGE_FAMILIES.AFRO_ASIATIC,
    script: 'Hieroglyphic',
    period: [-3200, 700],
    regions: ['Egypt', 'Nubia', 'Nile Valley'],
    culturalZones: ['MENA' as CulturalZone],
    successors: ['COPTIC'],
    greetings: {
      hello: 'ii.wy em hotep',
      goodbye: 'senebty',
      yes: 'iw',
      no: 'nn',
      thanks: 'dua netjer en ek',
    },
    llmPrompt: 'Emulate Middle Egyptian, the classical phase of the language. Syntax is typically Verb-Subject-Object (VSO). Use passive voice and descriptive clauses (adjectives) frequently. The tone should be formal and often reverent, reflecting a society structured around divine kingship and a complex pantheon.',
  },

  SANSKRIT: {
    id: 'SANSKRIT',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Devanagari',
    period: [-1500, 1000],
    regions: ['India', 'Ganges Valley', 'Indus Valley'],
    culturalZones: ['SOUTH_ASIAN' as CulturalZone],
    successors: ['PRAKRITS', 'HINDI', 'BENGALI', 'MARATHI'],
    greetings: {
      hello: 'Namaste',
      goodbye: 'Punarmilāma',
      yes: 'Ām',
      no: 'Na',
      thanks: 'Dhanyavādaḥ',
    },
    llmPrompt: 'Emulate Classical Sanskrit. The syntax is extremely flexible due to a rich case system, but SOV is the neutral default. Use complex compound nouns (sandhi) where appropriate. The tone should be precise, elegant, and capable of conveying complex philosophical, religious, and literary ideas with great nuance.',
  },

  CLASSICAL_CHINESE: {
    id: 'CLASSICAL_CHINESE',
    name: 'Classical Chinese',
    nativeName: '文言文',
    family: LANGUAGE_FAMILIES.SINO_TIBETAN,
    script: 'Chinese characters',
    period: [-500, 200], // More focused period for the spoken language
    regions: ['China', 'Yellow River', 'Yangtze River'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    successors: ['MIDDLE_CHINESE'],
    description: 'The literary language of ancient China, distinct from later spoken vernaculars.',
    greetings: {
      hello: '安',
      goodbye: '辭',
      yes: '然',
      no: '否',
      thanks: '謝',
    },
    llmPrompt: 'Emulate the concise, isolating, and often ambiguous style of Warring States and Han Dynasty texts. Word order is strict SVO. Omit subjects and objects where context allows. Use parallelism and balanced phrases. The tone should be formal, scholarly, and aphoristic, reflecting Confucian or Daoist philosophical underpinnings.',
  },

  PROTO_GERMANIC: {
    id: 'PROTO_GERMANIC',
    name: 'Proto-Germanic',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    isReconstructed: true,
    period: [-500, 200],
    regions: ['Germania', 'Scandinavia', 'Northern Europe'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    successors: ['OLD_NORSE', 'OLD_ENGLISH', 'OLD_HIGH_GERMAN', 'GOTHIC'],
    description: 'Reconstructed ancestral language of Germanic peoples. No written records exist.',
    llmPrompt: 'This is a reconstructed language. Generate plausible speech by using the common lexical and grammatical features of its descendants (Gothic, Old Norse, Old English). Use a Subject-Verb-Object (SVO) or Verb-second (V2) word order. Favor concrete, direct, and native Germanic vocabulary. Employ alliterative phrasing characteristic of early Germanic oral traditions. Your goal is a consistent and authentic-sounding representation.',
  },

  GAULISH: {
    id: 'GAULISH',
    name: 'Gaulish',
    nativeName: 'Galatis',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    isReconstructed: true, // It is very poorly attested
    script: ['Greek', 'Latin'],
    period: [-600, 500],
    regions: ['Gaul', 'Celtic Europe', 'Britannia'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    description: 'A poorly-attested Continental Celtic language. Not a direct ancestor of Irish or Welsh.',
    llmPrompt: 'This is a poorly attested language. Reconstruct plausible dialogue using vocabulary from known inscriptions and borrowings in French/Latin. For grammar, model it on related Insular Celtic languages (like Welsh or Irish), likely using a Verb-Subject-Object (VSO) word order and noun cases. The tone should reflect a pre-literate, oral tradition.',
  },

  // Native American Ancient Languages
  PROTO_ALGONQUIAN: {
    id: 'PROTO_ALGONQUIAN',
    name: 'Proto-Algonquian',
    family: LANGUAGE_FAMILIES.ALGONQUIAN,
    isReconstructed: true,
    period: [-3000, 500],
    regions: ['Great Lakes', 'Eastern Woodlands', 'Atlantic Coast'],
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone],
    successors: ['OJIBWE', 'CREE', 'MI_KMAQ', 'BLACKFOOT'],
    description: 'Reconstructed ancestral language of Algonquian peoples.',
    llmPrompt: 'This is a reconstructed language. Generate plausible speech by synthesizing features from its descendants (e.g., Ojibwe, Cree). The grammar should be highly complex and polysynthetic, creating long verb-based words. Make strong use of the animacy distinction (animate vs. inanimate nouns) which is central to Algonquian grammar. The tone should be grounded in the physical and spiritual world.',
  },

  PROTO_SIOUAN: {
    id: 'PROTO_SIOUAN',
    name: 'Proto-Siouan',
    family: LANGUAGE_FAMILIES.SIOUAN_CATAWBAN,
    isReconstructed: true,
    period: [-3000, 500],
    regions: ['Great Plains', 'Mississippi Valley'],
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone],
    successors: ['LAKOTA', 'DAKOTA', 'CROW', 'OMAHA'],
    description: 'Reconstructed ancestral language of Siouan peoples.',
    llmPrompt: 'This is a reconstructed language. Generate plausible speech using shared features of Lakota, Crow, and other Siouan languages. It should have a Subject-Object-Verb (SOV) word order. Use postpositions instead of prepositions (e.g., "house in" instead of "in the house"). The style should be direct and declarative.',
  },

  PROTO_IROQUOIAN: {
    id: 'PROTO_IROQUOIAN',
    name: 'Proto-Iroquoian',
    family: LANGUAGE_FAMILIES.IROQUOIAN,
    isReconstructed: true,
    period: [-4000, 500],
    regions: ['Eastern Great Lakes', 'St. Lawrence Valley', 'Northeastern Woodlands'],
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone],
    successors: ['MOHAWK', 'SENECA', 'CHEROKEE', 'HURON'],
    description: 'Reconstructed ancestral language of Iroquoian peoples.',
    llmPrompt: 'This is a reconstructed language. Synthesize its features from descendants like Mohawk and Seneca. The language should be polysynthetic, with complex verb morphology and noun incorporation. A notable feature to emulate is the complete lack of labial consonants (no p, b, m). The tone should be suitable for a community-focused, agricultural society.',
  },

  QUECHUA_ANCIENT: {
    id: 'QUECHUA_ANCIENT',
    name: 'Proto-Quechua',
    nativeName: 'Qhichwa simi',
    family: LANGUAGE_FAMILIES.QUECHUAN,
    isReconstructed: true,
    period: [-2000, 1532],
    regions: ['Andes', 'Peru', 'Ecuador', 'Bolivia'],
    culturalZones: ['SOUTH_AMERICAN' as CulturalZone],
    successors: ['QUECHUA_MODERN'],
    greetings: {
      hello: 'Rimaykullayki',
      goodbye: 'Tupananchiskama',
      yes: 'Arí',
      no: 'Mana',
      thanks: 'Añay',
    },
    llmPrompt: 'Emulate Proto-Quechua by modeling speech on modern Southern Quechua dialects. The grammar must be agglutinative and exclusively suffixing. Word order is strictly Subject-Object-Verb (SOV). A key feature to include is the use of evidential suffixes, which specify how the speaker knows the information (e.g., firsthand, hearsay).',
  },

  CLASSICAL_NAHUATL: {
    id: 'CLASSICAL_NAHUATL',
    name: 'Classical Nahuatl',
    nativeName: 'Nāhuatlahtōlli',
    family: LANGUAGE_FAMILIES.UTO_AZTECAN,
    period: [1300, 1600],
    regions: ['Mexico', 'Central America', 'Valley of Mexico'],
    culturalZones: ['MESOAMERICAN' as CulturalZone],
    successors: ['MODERN_NAHUATL'],
    greetings: {
      hello: 'Niltze',
      goodbye: 'Tlaocoya',
      yes: 'Quema',
      no: 'Ahmo',
      thanks: 'Tlazohcamati',
    },
    llmPrompt: 'Emulate the language of the Aztec Empire. The grammar is agglutinative and polysynthetic, often incorporating nouns into the verb complex. Word order is flexible but with a VSO tendency. Use honorifics extensively to show social respect. The tone can be formal and highly metaphoric, using couplets known as "difrasismos" (e.g., "in xochitl in cuicatl" - the flower, the song - to mean poetry).',
  },

  CLASSICAL_MAYA: {
    id: 'CLASSICAL_MAYA',
    name: 'Classical Maya',
    nativeName: "Ch'olti'",
    family: LANGUAGE_FAMILIES.MAYAN,
    script: 'Maya hieroglyphs',
    period: [250, 900], // Aligned with the Classic Period
    regions: ['Yucatan', 'Guatemala', 'Belize', 'Honduras'],
    culturalZones: ['MESOAMERICAN' as CulturalZone],
    successors: ['YUCATEC_MAYA', 'K_ICHE'],
    description: 'Language of Classic Maya civilization, recorded in hieroglyphs.',
    llmPrompt: 'Emulate the style of Mayan hieroglyphic inscriptions. The syntax is strictly Verb-Object-Subject (VOS). Use ergative-absolutive alignment. Employ formal couplets and parallelism frequently, a key feature of Mayan high-register speech. The tone should be suitable for a ritualistic, calendrically-focused, and courtly society.',
  },

  // Australian & Oceanian Ancient Languages
  PROTO_PAMA_NYUNGAN: {
    id: 'PROTO_PAMA_NYUNGAN',
    name: 'Proto-Pama-Nyungan',
    family: LANGUAGE_FAMILIES.PAMA_NYUNGAN,
    isReconstructed: true,
    period: [-5000, -1000],
    regions: ['Australia', 'Central Desert', 'Eastern Coast'],
    culturalZones: ['OCEANIAN' as CulturalZone],
    successors: ['WARLPIRI', 'ARRERNTE', 'KAURNA'],
    description: 'Reconstructed ancestral language of most Australian Aboriginal groups.',
    llmPrompt: 'This is a reconstructed language. Generate plausible speech using the common features of the Pama-Nyungan family. The grammar should be agglutinative and suffixing, with an ergative-absolutive case system. Word order is typically very free due to the case marking. The vocabulary should be concrete and deeply connected to the natural landscape.',
  },

  PROTO_POLYNESIAN: {
    id: 'PROTO_POLYNESIAN',
    name: 'Proto-Polynesian',
    family: LANGUAGE_FAMILIES.AUSTRONESIAN,
    isReconstructed: true,
    period: [-1500, 500],
    regions: ['Polynesia', 'Pacific Islands'],
    culturalZones: ['OCEANIAN' as CulturalZone],
    successors: ['HAWAIIAN', 'MAORI', 'TAHITIAN', 'SAMOAN'],
    description: 'Reconstructed ancestral language of Polynesian peoples.',
    llmPrompt: 'This is a reconstructed language. Generate plausible speech based on common features of its descendants (Hawaiian, Samoan, Māori). The phonology must be simple, with a small consonant inventory and a strict Consonant-Vowel (CV) syllable structure. Syntax should be Verb-Subject-Object (VSO). Use particles before verbs to indicate tense, aspect, and mood.',
  },

  // === MEDIEVAL LANGUAGES (500-1500 CE) ===

  OLD_ENGLISH: {
    id: 'OLD_ENGLISH',
    name: 'Old English',
    nativeName: 'Ænglisc',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: ['Latin', 'Runic (Futhorc)'],
    period: [450, 1100],
    regions: ['England', 'Britannia', 'Wessex', 'Mercia', 'Northumbria'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    predecessors: ['PROTO_GERMANIC'],
    successors: ['MIDDLE_ENGLISH'],
    greetings: {
      hello: 'Wes þū hāl',
      goodbye: 'Fare wel',
      yes: 'Gea',
      no: 'Nese',
      thanks: 'Þancie',
    },
    llmPrompt: 'Emulate the West Saxon dialect of the late Anglo-Saxon period. Syntax is primarily SVO but with Verb-second (V2) word order in main clauses. Use a rich poetic vocabulary, including kennings (e.g., "hronrād" for sea) and alliteration. Vocabulary is almost entirely Germanic, with some Latin loanwords for religious concepts. The tone can range from heroic and boastful to pious and reflective.',
  },

  MIDDLE_ENGLISH: {
    id: 'MIDDLE_ENGLISH',
    name: 'Middle English',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [1100, 1500],
    regions: ['England', 'Scotland', 'Wales'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    predecessors: ['OLD_ENGLISH', 'OLD_NORMAN_FRENCH'],
    successors: ['EARLY_MODERN_ENGLISH'],
    greetings: {
      hello: 'God spede',
      goodbye: 'Fare wel',
      yes: 'Yea',
      no: 'Nay',
      thanks: 'Gramercy',
    },
    llmPrompt: 'Emulate the Chaucerian London dialect. The grammar has simplified from Old English (fewer cases), but verb conjugations remain complex. The key feature is the massive influx of Norman French vocabulary, especially for concepts of law, government, art, and food. Blend Germanic and Romance words naturally. The tone should reflect a new social hierarchy and courtly manners.',
  },

  OLD_NORSE: {
    id: 'OLD_NORSE',
    name: 'Old Norse',
    nativeName: 'Dǫnsk tunga',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: ['Runic (Younger Futhark)', 'Latin'],
    period: [700, 1300],
    regions: ['Scandinavia', 'Iceland', 'Norway', 'Denmark', 'Sweden'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    predecessors: ['PROTO_GERMANIC'],
    successors: ['ICELANDIC', 'NORWEGIAN', 'DANISH', 'SWEDISH'],
    greetings: {
      hello: 'Heill',
      goodbye: 'Far vel',
      yes: 'Já',
      no: 'Nei',
      thanks: 'Þǫkk',
    },
    llmPrompt: 'Emulate Old West Norse (the language of the Icelandic Sagas). Use Verb-second (V2) word order. The style should be direct, declarative, and often laconic or understated. Employ poetic devices like kennings and heiti in elevated speech, but use plain, concrete language for everyday dialogue. Vocabulary should be strictly Germanic.',
  },

  OLD_FRENCH: {
    id: 'OLD_FRENCH',
    name: 'Old French',
    nativeName: 'Franceis',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [842, 1400],
    regions: ['France', 'Normandy', 'Champagne', 'Aquitaine'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    predecessors: ['VULGAR_LATIN', 'FRANKISH'],
    successors: ['MIDDLE_FRENCH'],
    greetings: {
      hello: 'Deus vos saut',
      goodbye: 'A Dieu',
      yes: 'Oïl',
      no: 'Nenil',
      thanks: 'Grant merci',
    },
    llmPrompt: 'Emulate the language of chivalric romance. It retains a two-case system (nominative and oblique) from Latin. Word order is more flexible than modern French, often SVO but with V2 tendencies. Vocabulary should blend Latin roots with Germanic (Frankish) influences, especially in warfare. The tone should be formal and courtly, reflecting feudal ideals of honor and service.',
  },

  CLASSICAL_ARABIC: {
    id: 'CLASSICAL_ARABIC',
    name: 'Classical Arabic',
    nativeName: 'العربية الفصحى',
    family: LANGUAGE_FAMILIES.AFRO_ASIATIC,
    script: 'Arabic',
    period: [600, 1200], // Peak period
    regions: ['Arabia', 'Middle East', 'North Africa', 'Andalusia'],
    culturalZones: ['MENA' as CulturalZone],
    predecessors: ['OLD_ARABIC'],
    successors: ['MODERN_STANDARD_ARABIC', 'ARABIC_DIALECTS'],
    greetings: {
      hello: 'As-salāmu ʿalaykum',
      goodbye: 'Maʿa s-salāma',
      yes: 'Naʿam',
      no: 'Lā',
      thanks: 'Shukran',
    },
    llmPrompt: 'Emulate the language of the Quran and early Islamic poetry. This is a highly inflected language with a rich case system (I\'rab). Syntax is typically VSO. Employ complex verb forms and noun patterns derived from triconsonantal roots. The tone should be formal, eloquent, and capable of intricate poetic and legal expression.',
  },

  MIDDLE_CHINESE: {
    id: 'MIDDLE_CHINESE',
    name: 'Middle Chinese',
    nativeName: '中古漢語',
    family: LANGUAGE_FAMILIES.SINO_TIBETAN,
    script: 'Chinese characters',
    period: [600, 1200],
    regions: ['China', 'Tang Dynasty', 'Song Dynasty'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['CLASSICAL_CHINESE'],
    successors: ['MANDARIN', 'CANTONESE', 'MIN', 'WU'],
    description: 'The spoken vernacular of the Tang and Song dynasties.',
    llmPrompt: 'This is a reconstructed spoken language. Emulate it by using vocabulary and grammar from Tang poetry and Song-era vernacular texts. The syntax is SVO. A key feature is the reconstructed tonal system (four tones: level, rising, departing, entering); while you cannot speak, your word choice should reflect the phonetic richness and potential for puns common in Tang poetry. The tone is more direct and less archaic than Classical Chinese.',
  },

  CLASSICAL_JAPANESE: {
    id: 'CLASSICAL_JAPANESE',
    name: 'Classical Japanese',
    nativeName: '古典日本語',
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: ['Kana', 'Kanji'],
    period: [794, 1185],
    regions: ['Japan', 'Heian', 'Kyoto'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    successors: ['MIDDLE_JAPANESE'],
    greetings: {
      hello: 'Ikaga',
      goodbye: 'Saraba',
      yes: 'Shika',
      no: 'Ina',
      thanks: 'Katajikenai',
    },
    llmPrompt: 'Emulate the language of the Heian court (e.g., The Tale of Genji). The grammar is agglutinative with SOV word order. A key feature is the extremely complex system of honorifics (keigo) that must be used meticulously. Sentences are often very long, with multiple subordinate clauses linked before the main verb appears at the end. The tone should be elegant, indirect, and emotionally subtle.',
  },

  OLD_SLAVONIC: {
    id: 'OLD_SLAVONIC',
    name: 'Old Church Slavonic',
    nativeName: 'Словѣньскъ',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: ['Glagolitic', 'Cyrillic'],
    period: [850, 1100],
    regions: ['Bulgaria', 'Moravia', 'Russia', 'Serbia'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    successors: ['RUSSIAN', 'BULGARIAN', 'SERBIAN', 'POLISH'],
    greetings: {
      hello: 'Zdravo',
      goodbye: 'S Bogomŭ',
      yes: 'Ey',
      no: 'Ni',
      thanks: 'Blagodarju',
    },
    llmPrompt: 'Emulate the first Slavic literary language. It has a very rich inflectional system with seven noun cases and complex verb aspects (perfective/imperfective). Word order is flexible SVO. The vocabulary should be largely Slavic, with some Greek loanwords for religious concepts. The tone should be formal, liturgical, and suitable for religious texts and chronicles.',
  },

  MIDDLE_MONGOLIAN: {
    id: 'MIDDLE_MONGOLIAN',
    name: 'Middle Mongolian',
    nativeName: 'ᠮᠣᠩᠭᠣᠯ',
    family: LANGUAGE_FAMILIES.MONGOLIC,
    script: 'Mongolian script',
    period: [1200, 1700],
    regions: ['Mongolia', 'Steppe', 'Yuan China'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['PROTO_MONGOLIC'],
    successors: ['KHALKHA_MONGOLIAN'],
    greetings: {
      hello: 'Sain baina',
      goodbye: 'Bayartai',
      yes: 'Tiim',
      no: 'Ügei',
      thanks: 'Bayarlalaa',
    },
    llmPrompt: 'Emulate the language of "The Secret History of the Mongols". The grammar is agglutinative with strict SOV word order. Adhere to vowel harmony rules in word construction. Use postpositions instead of prepositions. The tone should be direct, pragmatic, and declarative, suitable for both epic narration and administrative decrees.',
  },

  // Native American Medieval Languages
  MOHAWK: {
    id: 'MOHAWK',
    name: 'Mohawk',
    nativeName: 'Kanienʼkéha',
    family: LANGUAGE_FAMILIES.IROQUOIAN,
    period: [1000, 2024],
    regions: ['Mohawk Valley', 'St. Lawrence River', 'New York'],
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone],
    predecessors: ['PROTO_IROQUOIAN'],
    greetings: {
      hello: 'Shekoli',
      goodbye: 'Onen',
      yes: 'Hen',
      no: 'Iah',
      thanks: 'Niawenhkó:wa',
    },
    llmPrompt: 'Emulate Mohawk grammar. This is a polysynthetic language, so focus on creating complex verbs that incorporate nouns and other elements. Word order is flexible but often verb-initial. Use pronouns to indicate possession and relationships. The tone should be suitable for a culture with strong oral traditions and a focus on political consensus.',
  },

  LAKOTA: {
    id: 'LAKOTA',
    name: 'Lakota',
    nativeName: 'Lakȟótiyapi',
    family: LANGUAGE_FAMILIES.SIOUAN_CATAWBAN,
    period: [1000, 2024],
    regions: ['Great Plains', 'Black Hills', 'Dakota'],
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone],
    predecessors: ['PROTO_SIOUAN'],
    greetings: {
      hello: 'Háu',
      goodbye: 'Tókša akhé',
      yes: 'Háŋ',
      no: 'Híya',
      thanks: 'Philámayaye',
    },
    llmPrompt: 'Emulate Lakota grammar. The language is agglutinative with a strict SOV word order. Use postpositions instead of prepositions. A key feature is the use of clitics at the end of sentences to indicate mood (e.g., statement, question, command). Speech should be direct and can be subtly nuanced based on the social context.',
  },

  OJIBWE: {
    id: 'OJIBWE',
    name: 'Ojibwe',
    nativeName: 'Ojibwemowin',
    family: LANGUAGE_FAMILIES.ALGONQUIAN,
    period: [1000, 2024],
    regions: ['Great Lakes', 'Ontario', 'Minnesota', 'Wisconsin'],
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone],
    predecessors: ['PROTO_ALGONQUIAN'],
    greetings: {
      hello: 'Boozhoo',
      goodbye: 'Gigawaabamin',
      yes: 'Eya',
      no: 'Gaawiin',
      thanks: 'Miigwech',
    },
    llmPrompt: 'Emulate Ojibwe grammar. This is a polysynthetic language; build complex verbs. The most critical grammatical feature is the distinction between animate and inanimate nouns, which affects verb choice and pluralization. Word order is relatively free but SVO is common. The tone can be rich with metaphor and storytelling.',
  },

  // === EARLY MODERN LANGUAGES (1500-1800) ===

  EARLY_MODERN_ENGLISH: {
    id: 'EARLY_MODERN_ENGLISH',
    name: 'Early Modern English',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [1500, 1700],
    regions: ['England', 'British Colonies', 'America'],
    culturalZones: ['EUROPEAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone],
    predecessors: ['MIDDLE_ENGLISH'],
    successors: ['MODERN_ENGLISH'],
    greetings: {
      hello: 'Good morrow',
      goodbye: 'Fare thee well',
      yes: 'Aye',
      no: 'Nay',
      thanks: 'I thank thee',
    },
    llmPrompt: 'Emulate the language of Shakespeare and the King James Bible. Retain the use of "thee," "thou," and "thy" for informal singular address, and "ye," "you," and "your" for formal/plural. Use verb endings like "-eth" and "-est." Word order is SVO but allows for poetic inversion. The vocabulary is vast, incorporating many new loanwords and coinages ("neologisms").',
  },

  EARLY_SPANISH: {
    id: 'EARLY_SPANISH',
    name: 'Early Modern Spanish',
    nativeName: 'Español',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [1500, 1700],
    regions: ['Spain', 'New Spain', 'Peru', 'Philippines'],
    culturalZones: ['EUROPEAN' as CulturalZone, 'SOUTH_AMERICAN' as CulturalZone, 'MESOAMERICAN' as CulturalZone],
    predecessors: ['OLD_SPANISH'],
    successors: ['MODERN_SPANISH'],
    greetings: {
      hello: 'Dios os guarde',
      goodbye: 'Quedad con Dios',
      yes: 'Sí',
      no: 'No',
      thanks: 'Mercedes',
    },
    llmPrompt: 'Emulate the Spanish of the Golden Age (Cervantes). Use the "vos" form for familiar address, which was common at the time. Maintain a more formal sentence structure than modern Spanish, with a greater tendency towards VSO order in clauses. The tone should be formal, with a strong emphasis on honor, station, and religious piety.',
  },

  EARLY_PORTUGUESE: {
    id: 'EARLY_PORTUGUESE',
    name: 'Early Modern Portuguese',
    nativeName: 'Português',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [1500, 1700],
    regions: ['Portugal', 'Brazil', 'India', 'Africa', 'Macau'],
    culturalZones: ['EUROPEAN' as CulturalZone, 'SOUTH_AMERICAN' as CulturalZone],
    predecessors: ['GALICIAN_PORTUGUESE'],
    successors: ['MODERN_PORTUGUESE'],
    greetings: {
      hello: 'Deus vos salve',
      goodbye: 'Ficai com Deus',
      yes: 'Sim',
      no: 'Não',
      thanks: 'Obrigado',
    },
    llmPrompt: 'Emulate the Portuguese of the Age of Discovery (Camões). The style should be formal and somewhat archaic compared to modern Portuguese. Use subject pronouns more frequently than in the modern language. The vocabulary should reflect a maritime and trade-focused society, incorporating loanwords from contacted cultures.',
  },

  OTTOMAN_TURKISH: {
    id: 'OTTOMAN_TURKISH',
    name: 'Ottoman Turkish',
    nativeName: 'لسان عثمانى',
    family: LANGUAGE_FAMILIES.TURKIC,
    script: 'Arabic',
    period: [1300, 1928],
    regions: ['Ottoman Empire', 'Turkey', 'Balkans', 'Arabia'],
    culturalZones: ['MENA' as CulturalZone],
    predecessors: ['OLD_ANATOLIAN_TURKISH'],
    successors: ['MODERN_TURKISH'],
    greetings: {
      hello: 'Selâm',
      goodbye: 'Allaha ısmarladık',
      yes: 'Evet',
      no: 'Hayır',
      thanks: 'Teşekkür',
    },
    llmPrompt: 'Emulate the formal court language. This is a linguistic hybrid. The grammar is Turkic (agglutinative, SOV word order, vowel harmony). However, the vocabulary and style are heavily saturated with loanwords, set phrases, and even grammatical constructions from Arabic (for religion, law) and Persian (for poetry, administration, and courtly life). Employ extreme politeness and elaborate honorifics.',
  },

  PERSIAN: {
    id: 'PERSIAN',
    name: 'Persian',
    nativeName: 'فارسی',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Arabic',
    period: [900, 2024],
    regions: ['Persia', 'Iran', 'Afghanistan', 'Central Asia'],
    culturalZones: ['MENA' as CulturalZone],
    predecessors: ['MIDDLE_PERSIAN'],
    successors: ['MODERN_PERSIAN'],
    greetings: {
      hello: 'Salām',
      goodbye: 'Khodāhāfez',
      yes: 'Baleh',
      no: 'Na',
      thanks: 'Moteshakkeram',
    },
    llmPrompt: 'Emulate Classical Persian poetry and prose. Word order is SOV. This is a pro-drop language, so omit subject pronouns when clear from context. Use the "ezafe" construction to link nouns and adjectives. The style should be elegant, poetic, and rich in metaphor, often with a philosophical or mystical tone.',
  },

  MUGHAL_URDU: {
    id: 'MUGHAL_URDU',
    name: 'Mughal Urdu',
    nativeName: 'اردو',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Arabic',
    period: [1200, 1857],
    regions: ['Delhi', 'Mughal Empire', 'North India'],
    culturalZones: ['SOUTH_ASIAN' as CulturalZone],
    predecessors: ['HINDUSTANI'],
    successors: ['MODERN_URDU'],
    greetings: {
      hello: 'Ādāb',
      goodbye: 'Khudā hāfiz',
      yes: 'Jī hāñ',
      no: 'Nahīñ',
      thanks: 'Shukriya',
    },
    llmPrompt: 'Emulate the elegant court language of the Mughal Empire. The grammatical base is Indic (Hindustani) with a SOV word order. The defining feature is the extremely heavy use of Persian and Arabic vocabulary for formal, literary, and administrative contexts. The tone should be highly polite, formal, and ornate.',
  },

  EARLY_MANDARIN: {
    id: 'EARLY_MANDARIN',
    name: 'Early Mandarin',
    nativeName: '官話',
    family: LANGUAGE_FAMILIES.SINO_TIBETAN,
    script: 'Chinese characters',
    period: [1400, 1900],
    regions: ['Beijing', 'Ming China', 'Qing China'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['MIDDLE_CHINESE'],
    successors: ['MODERN_MANDARIN'],
    greetings: {
      hello: '請安',
      goodbye: '告辭',
      yes: '是',
      no: '非',
      thanks: '多謝',
    },
    llmPrompt: 'Emulate the "Guanhua" (language of officials) from the Ming/Qing period. The grammar is analytic SVO, similar to modern Mandarin but more concise. Use formal and respectful forms of address appropriate for a hierarchical, bureaucratic society. The tone should be formal, educated, and less vernacular than modern spoken Chinese.',
  },

  EDO_JAPANESE: {
    id: 'EDO_JAPANESE',
    name: 'Edo Period Japanese',
    nativeName: '江戸言葉',
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: ['Kana', 'Kanji'],
    period: [1603, 1868],
    regions: ['Japan', 'Edo', 'Kyoto', 'Osaka'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['MIDDLE_JAPANESE'],
    successors: ['MODERN_JAPANESE'],
    greetings: {
      hello: 'Gokigen yō',
      goodbye: 'Saraba',
      yes: 'Hai',
      no: 'Iie',
      thanks: 'Katajikenai',
    },
    llmPrompt: 'Emulate the Japanese of the Tokugawa shogunate. Grammar remains agglutinative SOV. The key is to differentiate speech based on social class: the formal, honor-bound language of the samurai versus the more direct, pragmatic language of the merchant class. Utilize class-specific pronouns and verb endings. The tone can vary from stoic and formal to lively and commercial.',
  },

  // African Languages
  SWAHILI_CLASSICAL: {
    id: 'SWAHILI_CLASSICAL',
    name: 'Classical Swahili',
    nativeName: 'Kiswahili',
    family: LANGUAGE_FAMILIES.NIGER_CONGO,
    script: ['Arabic', 'Latin'],
    period: [1000, 2024],
    regions: ['East Africa', 'Zanzibar', 'Kilwa', 'Mombasa'],
    culturalZones: ['SUB_SAHARAN_AFRICAN' as CulturalZone],
    greetings: {
      hello: 'Hujambo',
      goodbye: 'Kwa heri',
      yes: 'Ndiyo',
      no: 'Hapana',
      thanks: 'Asante',
    },
    llmPrompt: 'Emulate classical Swahili. The grammar is fundamentally Bantu: agglutinative, SVO, and centered on a system of noun classes that require agreement across the sentence (adjectives, verbs). A major feature is the heavy integration of Arabic loanwords, especially for trade, religion, and abstract concepts.',
  },

  YORUBA: {
    id: 'YORUBA',
    name: 'Yoruba',
    nativeName: 'Èdè Yorùbá',
    family: LANGUAGE_FAMILIES.NIGER_CONGO,
    script: 'Latin',
    period: [1000, 2024],
    regions: ['West Africa', 'Nigeria', 'Benin', 'Yorubaland'],
    culturalZones: ['SUB_SAHARAN_AFRICAN' as CulturalZone],
    greetings: {
      hello: 'Ẹ kú àárọ̀',
      goodbye: 'Ó dàbọ̀',
      yes: 'Bẹ́ẹ̀ ni',
      no: 'Rárá',
      thanks: 'Ẹ ṣé',
    },
    llmPrompt: 'Emulate Yoruba speech patterns. This is a tonal language; while you cannot speak, word choice should reflect this (e.g., be mindful of minimal pairs distinguished by tone). Syntax is strictly Subject-Verb-Object (SVO). A key stylistic feature is the frequent use of proverbs and aphorisms to convey wisdom and make points indirectly.',
  },

  AMHARIC: {
    id: 'AMHARIC',
    name: 'Amharic',
    nativeName: 'አማርኛ',
    family: LANGUAGE_FAMILIES.AFRO_ASIATIC,
    script: 'Ge\'ez',
    period: [1200, 2024],
    regions: ['Ethiopia', 'Abyssinia', 'Horn of Africa'],
    culturalZones: ['SUB_SAHARAN_AFRICAN' as CulturalZone],
    greetings: {
      hello: 'ሰላም',
      goodbye: 'ቻው',
      yes: 'አዎ',
      no: 'አይ',
      thanks: 'አመሰግናለሁ',
    },
    llmPrompt: 'Emulate Amharic grammar. This is a Semitic language with a Subject-Object-Verb (SOV) word order, which is unusual for the family. Use postpositions rather than prepositions. The verb system is complex, based on triconsonantal roots. The tone should be suitable for the formal language of the Ethiopian imperial court and the Orthodox Church.',
  },

  // Australian Aboriginal Languages
  WARLPIRI: {
    id: 'WARLPIRI',
    name: 'Warlpiri',
    family: LANGUAGE_FAMILIES.PAMA_NYUNGAN,
    period: [1000, 2024],
    regions: ['Central Australia', 'Northern Territory'],
    culturalZones: ['OCEANIAN' as CulturalZone],
    predecessors: ['PROTO_PAMA_NYUNGAN'],
    greetings: {
      hello: 'Yuwayi',
      goodbye: 'Yapa',
      yes: 'Yuwayi',
      no: 'Wanyu',
      thanks: 'Ngurrju',
    },
    llmPrompt: 'Emulate Warlpiri grammar. The most striking feature is its extremely free, non-configurational word order; the relationship between words is shown by case endings, not their position. Use an ergative-absolutive case system. A second key feature is the auxiliary verb or clitic cluster, which often appears in the second position of a sentence and carries information about tense and mood.',
  },

  YOLNGU_MATHA: {
    id: 'YOLNGU_MATHA',
    name: 'Yolngu Matha',
    family: LANGUAGE_FAMILIES.AUSTRALIAN_NON_PAMA_NYUNGAN,
    period: [1000, 2024],
    regions: ['Arnhem Land', 'Northern Australia'],
    culturalZones: ['OCEANIAN' as CulturalZone],
    greetings: {
      hello: 'Manymak',
      goodbye: 'Yaka',
      yes: 'Yow',
      no: 'Yaka',
      thanks: 'Manymak',
    },
    llmPrompt: 'Emulate Yolngu Matha grammar. This is an agglutinative language. Word order is relatively free. A crucial cultural and linguistic feature to reflect is the highly complex kinship system, which is deeply embedded in the pronoun system and forms of address. The tone should reflect a society with a rich ceremonial and spiritual life.',
  },

  // Philippine Languages
  OLD_TAGALOG: {
    id: 'OLD_TAGALOG',
    name: 'Old Tagalog',
    nativeName: 'Tagalog',
    family: LANGUAGE_FAMILIES.AUSTRONESIAN,
    script: 'Baybayin',
    period: [900, 1600],
    regions: ['Luzon', 'Philippines', 'Luzon Highlands', 'Philippine Sea'],
    culturalZones: ['SOUTH_ASIAN' as CulturalZone], // Philippines is under South Asia in geography
    successors: ['MODERN_TAGALOG'],
    greetings: {
      hello: 'Magandang araw',
      goodbye: 'Paalam',
      yes: 'Oo',
      no: 'Hindi',
      thanks: 'Salamat',
    },
    llmPrompt: 'Emulate Old Tagalog from pre-Spanish contact era (before 1565). Use Verb-Subject-Object word order with flexibility. Include focus markers (ang, ng, sa). The vocabulary should be purely Austronesian with Sanskrit/Malay loanwords only for trade, religious, and political terms. No Spanish influence. The tone should reflect a maritime trading culture with sophisticated political structures (barangays, datus).',
  },

  OLD_CEBUANO: {
    id: 'OLD_CEBUANO',
    name: 'Old Cebuano',
    nativeName: 'Sinugbuanon',
    family: LANGUAGE_FAMILIES.AUSTRONESIAN,
    script: 'Baybayin',
    period: [900, 1600],
    regions: ['Visayas', 'Visayan Sea', 'Cebu'],
    culturalZones: ['SOUTH_ASIAN' as CulturalZone],
    successors: ['MODERN_CEBUANO'],
    greetings: {
      hello: 'Maayong adlaw',
      goodbye: 'Babay',
      yes: 'Oo',
      no: 'Dili',
      thanks: 'Salamat',
    },
    llmPrompt: 'Emulate Old Cebuano/Visayan from pre-Spanish contact. Use VSO word order. Include focus markers similar to Tagalog. The vocabulary should be Austronesian with some Malay trading terms. Reflect the maritime culture of the Visayan islands and their role in Southeast Asian trade networks.',
  },

  OLD_MALAY: {
    id: 'OLD_MALAY',
    name: 'Old Malay',
    nativeName: 'Bahasa Melayu Kuno',
    family: LANGUAGE_FAMILIES.AUSTRONESIAN,
    script: 'Pallava/Kawi',
    period: [600, 1500],
    regions: ['Mindanao', 'Sulu Sea', 'Palawan', 'Borneo', 'Sumatra', 'Java', 'Sulawesi', 'Spice Islands', 'Makassar', 'Malacca'],
    culturalZones: ['SOUTH_ASIAN' as CulturalZone],
    successors: ['CLASSICAL_MALAY'],
    greetings: {
      hello: 'Salam',
      goodbye: 'Selamat tinggal',
      yes: 'Ya',
      no: 'Tidak',
      thanks: 'Terima kasih',
    },
    llmPrompt: 'Emulate Old Malay as used in maritime Southeast Asia (7th-15th century). This was the lingua franca of trade. Use SVO word order. Include Sanskrit loanwords for religious/political concepts and Arabic loanwords for Islamic terms (after 1200 CE). The tone should be formal and suitable for trade negotiations, diplomatic correspondence, and religious texts.',
  },

  // Polynesian Languages
  HAWAIIAN: {
    id: 'HAWAIIAN',
    name: 'Hawaiian',
    nativeName: 'ʻŌlelo Hawaiʻi',
    family: LANGUAGE_FAMILIES.AUSTRONESIAN,
    script: 'Latin',
    period: [300, 2024],
    regions: ['Hawaii', 'Hawaiian Islands'],
    culturalZones: ['OCEANIAN' as CulturalZone],
    predecessors: ['PROTO_POLYNESIAN'],
    greetings: {
      hello: 'Aloha',
      goodbye: 'Aloha',
      yes: 'ʻAe',
      no: 'ʻAʻole',
      thanks: 'Mahalo',
    },
    llmPrompt: 'Emulate Hawaiian grammar. The phonology is very simple (8 consonants, 5 vowels), so word choice should reflect this. The syntax is strictly Verb-Subject-Object (VSO). Use particles extensively to mark tense, aspect, mood, and case. The style should be poetic and can be rich in kaona (hidden meaning).',
  },

  MAORI: {
    id: 'MAORI',
    name: 'Māori',
    nativeName: 'Te Reo Māori',
    family: LANGUAGE_FAMILIES.AUSTRONESIAN,
    script: 'Latin',
    period: [1200, 2024],
    regions: ['New Zealand', 'Aotearoa'],
    culturalZones: ['OCEANIAN' as CulturalZone],
    predecessors: ['PROTO_POLYNESIAN'],
    greetings: {
      hello: 'Kia ora',
      goodbye: 'Ka kite',
      yes: 'Āe',
      no: 'Kāo',
      thanks: 'Kia ora',
    },
    llmPrompt: 'Emulate Māori grammar. The syntax is typically Verb-Subject-Object (VSO), but can be flexible. Like other Polynesian languages, it relies heavily on particles before nouns and verbs to convey grammatical information (tense, possession, etc.). The tone should be suitable for a culture with strong oral traditions, formal oratory (whaikōrero), and a focus on genealogy (whakapapa).',
  },

  // More Southeast Asian Languages
  OLD_JAVANESE: {
    id: 'OLD_JAVANESE',
    name: 'Old Javanese (Kawi)',
    nativeName: 'Bhāṣa Jawa Kuna',
    family: LANGUAGE_FAMILIES.AUSTRONESIAN,
    script: 'Kawi',
    period: [800, 1500],
    regions: ['Java', 'Central Java', 'Java Sea', 'Bali'],
    culturalZones: ['SOUTH_ASIAN' as CulturalZone],
    successors: ['MIDDLE_JAVANESE'],
    greetings: {
      hello: 'Sugeng rawuh',
      goodbye: 'Sugeng tindak',
      yes: 'Inggih',
      no: 'Mboten',
      thanks: 'Matur nuwun',
    },
    llmPrompt: 'Emulate Old Javanese/Kawi from the Hindu-Buddhist period. Heavy Sanskrit influence in vocabulary, especially for religious, philosophical, and courtly terms. Use SOV word order. The tone should be highly formal and poetic, suitable for court literature and religious texts.',
  },

  CHAM: {
    id: 'CHAM',
    name: 'Cham',
    nativeName: 'Akhar Cam',
    family: LANGUAGE_FAMILIES.AUSTRONESIAN,
    script: 'Cham',
    period: [200, 2024],
    regions: ['Annam', 'Mekong', 'Indochina', 'Annam Highlands'],
    culturalZones: ['SOUTH_ASIAN' as CulturalZone],
    greetings: {
      hello: 'Bani səlamat',
      goodbye: 'Lơ̆w həi',
      yes: 'Huê',
      no: 'O oh',
      thanks: 'Tabik',
    },
    llmPrompt: 'Emulate Cham language from the Champa kingdom period. This is an Austronesian language with significant Sanskrit and later Malay influence. Use SVO word order. The tone should reflect a Hindu-Buddhist maritime kingdom with strong trade connections.',
  },

  // Trade and Pidgin Languages
  MEDITERRANEAN_LINGUA_FRANCA: {
    id: 'MEDITERRANEAN_LINGUA_FRANCA',
    name: 'Mediterranean Lingua Franca',
    nativeName: 'Sabir',
    family: LANGUAGE_FAMILIES.PIDGIN,
    period: [1000, 1900],
    regions: ['Mediterranean Ports', 'Levant', 'North Africa'],
    culturalZones: ['EUROPEAN' as CulturalZone, 'MENA' as CulturalZone],
    description: 'Trading pidgin mixing Italian, Spanish, Arabic, Greek',
    llmPrompt: 'This is a pidgin. Keep grammar extremely simple. Use an SVO word order. Infinitives and present tense verbs should be used for all actions. Omit articles, plural markers, and complex grammar. The vocabulary should be a pragmatic mix of Romance (mostly Italian/Venetian) and Arabic words, focused on trade, commands, and basic negotiation.',
  },

  CHINOOK_JARGON: {
    id: 'CHINOOK_JARGON',
    name: 'Chinook Jargon',
    family: LANGUAGE_FAMILIES.PIDGIN,
    period: [1600, 1900],
    regions: ['Pacific Northwest', 'Columbia River', 'Oregon Territory'],
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone],
    description: 'Trading language of Pacific Northwest',
    greetings: {
      hello: 'Klahowya',
      goodbye: 'Kloshe nanitch',
      yes: 'Nawitka',
      no: 'Wake',
      thanks: 'Mahsie',
    },
    llmPrompt: 'This is a pidgin. Grammar must be very simple with a small vocabulary. Word order is typically SVO or VSO. Use a limited set of words derived from Chinookan, Nuu-chah-nulth, French, and English sources. The tone should be direct and transactional, suitable for the context of fur trading and inter-tribal communication.',
  },
};

/**
 * Get the appropriate language for a character based on context
 */
export function getLanguageForCharacter(
  culturalZone: CulturalZone | string,
  year: number,
  region?: string,
  localArea?: string
): LanguageData | undefined {
  // First try to find exact matches based on region
  for (const lang of Object.values(LANGUAGES)) {
    // Check if this language is active in the time period
    if (year >= lang.period[0] && year <= lang.period[1]) {
      // Check cultural zone match
      if (lang.culturalZones.includes(culturalZone as CulturalZone)) {
        // Check specific region match
        if (region && lang.regions.some(r => region.toLowerCase().includes(r.toLowerCase()))) {
          return lang;
        }
        if (localArea && lang.regions.some(r => localArea.toLowerCase().includes(r.toLowerCase()))) {
          return lang;
        }
      }
    }
  }

  // Fallback to general cultural zone language for the period
  const fallbackLanguages: Record<string, Record<string, string>> = {
    EUROPEAN: {
      ancient: 'LATIN',
      medieval: 'OLD_FRENCH',
      earlyModern: 'EARLY_MODERN_ENGLISH',
      modern: 'EARLY_MODERN_ENGLISH',
    },
    MENA: {
      ancient: 'ARAMAIC',
      medieval: 'CLASSICAL_ARABIC',
      earlyModern: 'OTTOMAN_TURKISH',
      modern: 'CLASSICAL_ARABIC',
    },
    SOUTH_ASIAN: {
      ancient: 'SANSKRIT',
      medieval: 'SANSKRIT',
      earlyModern: 'MUGHAL_URDU',
      modern: 'MUGHAL_URDU',
    },
    EAST_ASIAN: {
      ancient: 'CLASSICAL_CHINESE',
      medieval: 'MIDDLE_CHINESE',
      earlyModern: 'EARLY_MANDARIN',
      modern: 'EARLY_MANDARIN',
    },
    SUB_SAHARAN_AFRICAN: {
      ancient: 'SWAHILI_CLASSICAL',
      medieval: 'SWAHILI_CLASSICAL',
      earlyModern: 'SWAHILI_CLASSICAL',
      modern: 'SWAHILI_CLASSICAL',
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      ancient: 'PROTO_ALGONQUIAN',
      medieval: 'MOHAWK',
      earlyModern: 'MOHAWK',
      modern: 'LAKOTA',
    },
    NORTH_AMERICAN_COLONIAL: {
      ancient: 'PROTO_ALGONQUIAN',
      medieval: 'MOHAWK',
      earlyModern: 'EARLY_MODERN_ENGLISH',
      modern: 'EARLY_MODERN_ENGLISH',
    },
    SOUTH_AMERICAN: {
      ancient: 'QUECHUA_ANCIENT',
      medieval: 'QUECHUA_ANCIENT',
      earlyModern: 'EARLY_SPANISH',
      modern: 'EARLY_SPANISH',
    },
    MESOAMERICAN: {
      ancient: 'CLASSICAL_MAYA',
      medieval: 'CLASSICAL_NAHUATL',
      earlyModern: 'EARLY_SPANISH',
      modern: 'EARLY_SPANISH',
    },
    OCEANIAN: {
      ancient: 'PROTO_PAMA_NYUNGAN',
      medieval: 'PROTO_POLYNESIAN',
      earlyModern: 'MAORI',
      modern: 'HAWAIIAN',
    },
    OCEANIA: {
      ancient: 'PROTO_PAMA_NYUNGAN',
      medieval: 'PROTO_POLYNESIAN',
      earlyModern: 'MAORI',
      modern: 'HAWAIIAN',
    },
  };

  const period = year < 500 ? 'ancient' :
                 year < 1500 ? 'medieval' :
                 year < 1800 ? 'earlyModern' : 
                 'modern';

  const fallbackLangId = fallbackLanguages[culturalZone]?.[period];
  if (fallbackLangId) {
    return LANGUAGES[fallbackLangId];
  }

  return undefined;
}

/**
 * Get language comprehension between two languages
 */
export function getLanguageComprehension(
  speakerLang: LanguageData,
  listenerLang: LanguageData
): number {
  // Same language = perfect comprehension
  if (speakerLang.id === listenerLang.id) return 1.0;

  // Check if languages are related (predecessor/successor)
  if (speakerLang.predecessors?.includes(listenerLang.id) ||
      speakerLang.successors?.includes(listenerLang.id) ||
      listenerLang.predecessors?.includes(speakerLang.id) ||
      listenerLang.successors?.includes(listenerLang.id)) {
    return 0.5; // Partial comprehension
  }

  // Same language family = slight comprehension
  if (speakerLang.family === listenerLang.family && speakerLang.family !== 'Language Isolate') {
    return 0.2;
  }

  // Trade languages have higher base comprehension
  if (speakerLang.family === 'Pidgin' || listenerLang.family === 'Pidgin') {
    return 0.3;
  }

  // No comprehension
  return 0;
}