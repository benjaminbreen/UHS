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
  // === RECONSTRUCTED PROTO-LANGUAGES (Pre-3000 BCE) ===

  PROTO_INDO_EUROPEAN: {
    id: 'PROTO_INDO_EUROPEAN',
    name: 'Proto-Indo-European',
    nativeName: '*Prōtokʷoinos Indo-h₁ewropeyskos',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: ['Latin (reconstructed)'],
    period: [-4000, -2500],
    regions: ['Pontic-Caspian Steppe', 'Eastern Europe', 'Central Asia'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    isReconstructed: true,
    successors: ['PROTO_GERMANIC', 'PROTO_CELTIC', 'PROTO_ITALIC', 'PROTO_INDO_IRANIAN', 'PROTO_ANATOLIAN'],
    description: 'Reconstructed common ancestor of all Indo-European languages',
    llmPrompt: 'Reconstruct a primitive Indo-European dialect using scholarly conventions. Use reconstructed *-marked roots and emphasize basic concepts: kinship, livestock, nature, tools. Word order is likely SOV. Vocabulary should focus on pastoral/agricultural terminology. Be conservative with complex abstract concepts.',
  },

  PROTO_SINO_TIBETAN: {
    id: 'PROTO_SINO_TIBETAN',
    name: 'Proto-Sino-Tibetan',
    nativeName: '*Proto-Sino-Tibetan',
    family: LANGUAGE_FAMILIES.SINO_TIBETAN,
    script: ['Reconstructed'],
    period: [-4000, -2000],
    regions: ['Yellow River Valley', 'Tibetan Plateau', 'Southeast Asia'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    isReconstructed: true,
    successors: ['OLD_CHINESE', 'PROTO_TIBETO_BURMAN'],
    description: 'Reconstructed ancestor of Chinese and Tibetan languages',
    llmPrompt: 'Use monosyllabic roots with tonal variations. Syntax is likely SVO with classifier systems. Focus on agricultural, geographic, and kinship terms. Use simple sentence structures and avoid complex grammatical particles.',
  },

  // === EARLIEST ATTESTED LANGUAGES (3500-1500 BCE) ===

  SUMERIAN: {
    id: 'SUMERIAN',
    name: 'Sumerian',
    nativeName: '𒅴𒂵',
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: 'Cuneiform',
    period: [-3500, -1750],
    regions: ['Sumer', 'Babylon', 'Ur', 'Uruk', 'Mesopotamia'],
    culturalZones: ['MENA' as CulturalZone],
    description: 'World\'s first written language, language isolate',
    greetings: {
      hello: 'silim-ma',
      goodbye: 'igi-zu he2-du7',
      yes: 'he2-am3',
      no: 'nu-me-a',
      thanks: 'dug3-ga-zu',
    },
    llmPrompt: 'Emulate cuneiform administrative and religious texts. Use agglutinative morphology with complex case systems. Word order is typically SOV. Tone should be formal, ceremonial, and often invoke deities. Use repetitive formulaic structures typical of early legal/religious texts.',
  },

  ELAMITE: {
    id: 'ELAMITE',
    name: 'Elamite',
    nativeName: 'Hatamti',
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: ['Linear Elamite', 'Cuneiform'],
    period: [-3200, -300],
    regions: ['Elam', 'Susa', 'Fars', 'Khuzestan', 'Southwest Iran'],
    culturalZones: ['MENA' as CulturalZone],
    description: 'Ancient language of Elam, Iran. Language isolate with no known relatives.',
    llmPrompt: 'Use the ergative-absolutive alignment typical of Elamite. Word order tends toward SOV. Employ complex verbal morphology and frequent use of compound verbs. Tone should reflect the formal court style of an ancient Iranian civilization.',
  },

  PROTO_AFROASIATIC: {
    id: 'PROTO_AFROASIATIC',
    name: 'Proto-Afroasiatic',
    nativeName: '*Proto-Afroasiatic',
    family: LANGUAGE_FAMILIES.AFRO_ASIATIC,
    script: ['Reconstructed'],
    period: [-10000, -6000],
    regions: ['Northeast Africa', 'Arabian Peninsula', 'Levant'],
    culturalZones: ['SUB_SAHARAN_AFRICAN' as CulturalZone, 'MENA' as CulturalZone],
    isReconstructed: true,
    successors: ['PROTO_SEMITIC', 'ANCIENT_EGYPTIAN', 'PROTO_BERBER', 'PROTO_CUSHITIC'],
    description: 'Reconstructed ancestor of Semitic, Egyptian, Berber, and Cushitic languages',
    llmPrompt: 'Use triconsonantal roots typical of Afroasiatic. VSO word order preferred. Focus on pastoral vocabulary, celestial terms, and basic kinship. Use pharyngeal and emphatic consonants. Keep morphology relatively simple.',
  },

  // === ANCIENT ATTESTED LANGUAGES (Pre-500 CE) ===

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

  VEDIC_SANSKRIT: {
    id: 'VEDIC_SANSKRIT',
    name: 'Vedic Sanskrit',
    nativeName: 'वैदिक संस्कृतम्',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: ['Oral tradition', 'Brahmi'],
    period: [-1500, -500],
    regions: ['Punjab', 'Sapta Sindhu', 'Indus Valley', 'Ganges Valley'],
    culturalZones: ['SOUTH_ASIAN' as CulturalZone],
    predecessors: ['PROTO_INDO_IRANIAN'],
    successors: ['CLASSICAL_SANSKRIT'],
    description: 'Archaic form of Sanskrit used in the earliest Hindu scriptures',
    greetings: {
      hello: 'svasti te',
      goodbye: 'śubham bhavatu',
      yes: 'evam',
      no: 'na',
      thanks: 'dhanyaḥ asmi',
    },
    llmPrompt: 'Use the archaic language of the Rigveda. Employ complex meter and elaborate compound formations. Word order is quite free but favors SOV. Use abundant ritual/religious terminology, fire imagery, and pastoral metaphors. Tone should be elevated, hymnic, and ceremonial.',
  },

  CLASSICAL_SANSKRIT: {
    id: 'CLASSICAL_SANSKRIT',
    name: 'Classical Sanskrit',
    nativeName: 'संस्कृतम्',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Devanagari',
    period: [-500, 1400],
    regions: ['India', 'Southeast Asia', 'Central Asia'],
    culturalZones: ['SOUTH_ASIAN' as CulturalZone],
    predecessors: ['VEDIC_SANSKRIT'],
    successors: ['PRAKRIT'],
    description: 'Standardized form of Sanskrit used in classical literature and philosophy',
    greetings: {
      hello: 'namaste',
      goodbye: 'śubhayātrā',
      yes: 'āma',
      no: 'na',
      thanks: 'dhanyavādaḥ',
    },
    llmPrompt: 'Use Paninian grammatical precision. Employ elaborate compound words and complex syntactic structures. SOV word order predominates. Use formal scholarly register appropriate for philosophical, literary, or legal discourse.',
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

  OLD_CHINESE: {
    id: 'OLD_CHINESE',
    name: 'Old Chinese',
    nativeName: '上古漢語',
    family: LANGUAGE_FAMILIES.SINO_TIBETAN,
    script: ['Oracle bone script', 'Bronze script', 'Early Chinese characters'],
    period: [-1250, -221],
    regions: ['Shang territory', 'Zhou domains', 'Yellow River', 'Central China'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['PROTO_SINO_TIBETAN'],
    successors: ['CLASSICAL_CHINESE'],
    description: 'Archaic Chinese as spoken during Shang and Zhou dynasties',
    greetings: {
      hello: '*Gjaŋ',
      goodbye: '*ʔjats',
      yes: '*da',
      no: '*pjər',
      thanks: '*sjək',
    },
    llmPrompt: 'Use reconstructed Old Chinese phonology with complex consonant clusters and no tones. Word order is SVO but more flexible than later Chinese. Use simple monosyllabic words with minimal compounding. Tone should be archaic and ceremonial, appropriate for bronze inscriptions and oracle bones.',
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
    predecessors: ['OLD_CHINESE'],
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

  HITTITE: {
    id: 'HITTITE',
    name: 'Hittite',
    nativeName: '𒉈𒅆𒇷',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Cuneiform',
    period: [-1650, -1200],
    regions: ['Anatolia', 'Hattusa', 'Asia Minor', 'Central Turkey'],
    culturalZones: ['MENA' as CulturalZone],
    predecessors: ['PROTO_ANATOLIAN'],
    description: 'Earliest attested Indo-European language, spoken by the Hittite Empire',
    greetings: {
      hello: 'šalli',
      goodbye: 'āšši',
      yes: 'nu',
      no: 'natta',
      thanks: 'šarā',
    },
    llmPrompt: 'Use the formal style of Hittite royal decrees and treaties. SOV word order is standard. Employ complex sentences with extensive use of conjunctions (nu, ta, ma). Tone should be legalistic, formal, and often invoke the gods as witnesses to treaties.',
  },

  PROTO_ANATOLIAN: {
    id: 'PROTO_ANATOLIAN',
    name: 'Proto-Anatolian',
    nativeName: '*Proto-Anatolian',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: ['Reconstructed'],
    period: [-3500, -2000],
    regions: ['Anatolia', 'Central Asia Minor'],
    culturalZones: ['MENA' as CulturalZone],
    isReconstructed: true,
    predecessors: ['PROTO_INDO_EUROPEAN'],
    successors: ['HITTITE', 'LUWIAN', 'PALAIC'],
    description: 'Reconstructed ancestor of Anatolian languages including Hittite',
    llmPrompt: 'Use reconstructed Anatolian features with archaic Indo-European characteristics. SOV word order with complex verbal morphology. Focus on pastoral, metallurgical, and early agricultural terminology. Tone should be simple and direct.',
  },

  MINOAN: {
    id: 'MINOAN',
    name: 'Minoan',
    nativeName: 'Linear A',
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: 'Linear A',
    period: [-2700, -1450],
    regions: ['Crete', 'Aegean', 'Knossos', 'Phaistos'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    description: 'Undeciphered language of Bronze Age Crete. Language family unknown.',
    llmPrompt: 'Since Minoan (Linear A) is undeciphered, construct plausible proto-Mediterranean speech patterns. Use simple SVO syntax with possible agglutinative elements. Focus on maritime, palace administration, and religious terminology. Tone should be ceremonial and trade-focused.',
  },

  PROTO_CELTIC: {
    id: 'PROTO_CELTIC',
    name: 'Proto-Celtic',
    nativeName: '*Protokeltikos',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: ['Reconstructed'],
    period: [-1300, -500],
    regions: ['Central Europe', 'Austria', 'Bohemia', 'Gaul'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    isReconstructed: true,
    predecessors: ['PROTO_INDO_EUROPEAN'],
    successors: ['GAULISH', 'OLD_IRISH', 'BRYTHONIC'],
    description: 'Reconstructed ancestor of all Celtic languages',
    llmPrompt: 'Use reconstructed Celtic features with VSO word order becoming established. Employ complex consonant mutations and initial emphasis patterns. Focus on warrior culture, druids, agriculture, and metalworking. Tone should be tribal and ceremonial.',
  },

  GAULISH: {
    id: 'GAULISH',
    name: 'Gaulish',
    nativeName: 'Gaulisca',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: ['Latin', 'Greek letters'],
    period: [-500, 500],
    regions: ['Gaul', 'France', 'Belgium', 'Switzerland'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    predecessors: ['PROTO_CELTIC'],
    successors: ['VULGAR_LATIN'],
    description: 'Continental Celtic language of ancient Gaul',
    greetings: {
      hello: 'Sveiks',
      goodbye: 'Valete',
      yes: 'Yo',
      no: 'Nē',
      thanks: 'Brogī',
    },
    llmPrompt: 'Use VSO word order characteristic of Celtic languages. Employ complex verbal conjugations and noun mutations. Vocabulary should reflect Gallic warrior society, druidism, and Roman contact. Tone should be proud, tribal, and resistant to Roman influence.',
  },

  GOTHIC: {
    id: 'GOTHIC',
    name: 'Gothic',
    nativeName: 'Gutrazda',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Gothic alphabet',
    period: [200, 700],
    regions: ['Eastern Europe', 'Crimea', 'Black Sea', 'Visigothic Spain'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    predecessors: ['PROTO_GERMANIC'],
    description: 'Earliest attested Germanic language, preserved in Wulfila\'s Bible translation',
    greetings: {
      hello: 'Hails',
      goodbye: 'Faírra',
      yes: 'Jai',
      no: 'Ně',
      thanks: 'Awiliuþ',
    },
    llmPrompt: 'Use the formal style of Wulfila\'s biblical Gothic. SOV word order with free variation for emphasis. Employ dual number and complex case system. Vocabulary should blend Germanic warrior culture with Christian terminology. Tone should be formal and religious.',
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

  // === NEW LANGUAGES FOR BETTER REGIONAL COVERAGE ===

  // European Languages
  DUTCH: {
    id: 'DUTCH',
    name: 'Dutch',
    nativeName: 'Nederlands',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [1500, 2025],
    regions: ['Netherlands', 'Holland', 'Flanders', 'Low Countries', 'Scheldt', 'Brabant', 'Amsterdam', 'Rotterdam', 'Utrecht', 'Suriname', 'Batavia'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    predecessors: ['OLD_DUTCH'],
    greetings: {
      hello: 'Goedendag',
      goodbye: 'Tot ziens',
      yes: 'Ja',
      no: 'Nee',
      thanks: 'Dank u',
    },
    llmPrompt: 'Emulate Dutch from the Golden Age onwards. Use SVO word order. The language shares Germanic roots with English but has evolved separately. Use diminutives frequently (-je, -tje). The tone should be direct and pragmatic, suitable for a maritime trading nation.',
  },

  GERMAN: {
    id: 'GERMAN',
    name: 'German',
    nativeName: 'Deutsch',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [1000, 2025],
    regions: ['Germany', 'Austria', 'Switzerland', 'Bavaria', 'Prussia', 'Saxony', 'Rhineland', 'Swabia', 'Brandenburg', 'Hanseatic', 'Alsace', 'Namibia'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    predecessors: ['OLD_HIGH_GERMAN'],
    successors: ['MODERN_GERMAN'],
    greetings: {
      hello: 'Guten Tag',
      goodbye: 'Auf Wiedersehen',
      yes: 'Ja',
      no: 'Nein',
      thanks: 'Danke',
    },
    llmPrompt: 'Emulate High German. Use V2 (verb-second) word order in main clauses, with the verb moving to the end in subordinate clauses. Employ compound nouns freely. The tone should be formal and precise, with clear hierarchical address forms (Sie/du).',
  },

  YIDDISH: {
    id: 'YIDDISH',
    name: 'Yiddish',
    nativeName: 'ייִדיש',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Hebrew',
    period: [1000, 2025],
    regions: ['Eastern Europe', 'Poland', 'Lithuania', 'Ukraine', 'Romania', 'Hungary', 'New York', 'Brooklyn'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    greetings: {
      hello: 'Sholem aleykhem',
      goodbye: 'A gutn tog',
      yes: 'Yo',
      no: 'Neyn',
      thanks: 'A dank',
    },
    llmPrompt: 'Emulate Yiddish, the fusion of Middle High German with Hebrew, Aramaic, and Slavic elements. Use Germanic grammar with extensive Hebrew/Aramaic vocabulary for religious and abstract concepts. The tone should be expressive, often ironic or humorous, with frequent use of rhetorical questions.',
  },

  SCOTS: {
    id: 'SCOTS',
    name: 'Scots',
    nativeName: 'Scots',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [1100, 2025],
    regions: ['Scotland', 'Lowlands', 'Edinburgh', 'Glasgow', 'Ulster'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    predecessors: ['OLD_ENGLISH'],
    greetings: {
      hello: 'Guid day',
      goodbye: 'Fare ye weel',
      yes: 'Aye',
      no: 'Naw',
      thanks: 'Thankye',
    },
    llmPrompt: 'Emulate Lowland Scots. This is a distinct language from English, not a dialect. Use distinctive vocabulary (ken for know, bairn for child, kirk for church). The grammar is similar to English but with distinct features like the use of "nae" for "not". The tone can range from formal to familiar.',
  },

  IRISH_GAELIC: {
    id: 'IRISH_GAELIC',
    name: 'Irish Gaelic',
    nativeName: 'Gaeilge',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [500, 2025],
    regions: ['Ireland', 'Connacht', 'Munster', 'Ulster', 'Leinster', 'Gaeltacht'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    greetings: {
      hello: 'Dia dhuit',
      goodbye: 'Slán',
      yes: 'Tá',
      no: 'Níl',
      thanks: 'Go raibh maith agat',
    },
    llmPrompt: 'Emulate Irish Gaelic. Use VSO word order strictly. Initial consonant mutations are a key feature (lenition and eclipsis). The language has no words for yes/no - instead echo the verb. Use the copula (is) vs substantive verb (tá) distinction.',
  },

  WELSH: {
    id: 'WELSH',
    name: 'Welsh',
    nativeName: 'Cymraeg',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [500, 2025],
    regions: ['Wales', 'Cymru', 'Gwynedd', 'Powys', 'Dyfed', 'Glamorgan'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    greetings: {
      hello: 'Bore da',
      goodbye: 'Hwyl fawr',
      yes: 'Ie',
      no: 'Na',
      thanks: 'Diolch',
    },
    llmPrompt: 'Emulate Welsh. Use VSO word order. Initial consonant mutations are crucial (soft, nasal, aspirate). The language is highly inflected with complex verbal forms. Use the distinctive "ll" and "ch" sounds in vocabulary.',
  },

  CATALAN: {
    id: 'CATALAN',
    name: 'Catalan',
    nativeName: 'Català',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [900, 2025],
    regions: ['Catalonia', 'Valencia', 'Balearic Islands', 'Barcelona', 'Andorra', 'Roussillon'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    greetings: {
      hello: 'Bon dia',
      goodbye: 'Adéu',
      yes: 'Sí',
      no: 'No',
      thanks: 'Gràcies',
    },
    llmPrompt: 'Emulate Catalan, distinct from Spanish. Use SVO word order with pronoun clitics. The language uses the distinctive "ny" sound and has eight vowel sounds. The tone should reflect a Mediterranean maritime culture.',
  },

  BASQUE: {
    id: 'BASQUE',
    name: 'Basque',
    nativeName: 'Euskara',
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: 'Latin',
    period: [-2000, 2025],
    regions: ['Basque Country', 'Euskadi', 'Navarre', 'Gipuzkoa', 'Bizkaia', 'Araba'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    greetings: {
      hello: 'Kaixo',
      goodbye: 'Agur',
      yes: 'Bai',
      no: 'Ez',
      thanks: 'Eskerrik asko',
    },
    llmPrompt: 'Emulate Basque/Euskera, the oldest language in Europe. This is an ergative-absolutive language with SOV word order. Use extensive agglutination and postpositions instead of prepositions. The language has no known relatives.',
  },

  // African Languages
  AFRIKAANS: {
    id: 'AFRIKAANS',
    name: 'Afrikaans',
    nativeName: 'Afrikaans',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [1700, 2025],
    regions: ['South Africa', 'Cape Colony', 'Transvaal', 'Orange Free State', 'Namibia', 'Cape Town', 'Pretoria', 'Johannesburg'],
    culturalZones: ['SUB_SAHARAN_AFRICAN' as CulturalZone],
    predecessors: ['DUTCH'],
    greetings: {
      hello: 'Goeie dag',
      goodbye: 'Totsiens',
      yes: 'Ja',
      no: 'Nee',
      thanks: 'Dankie',
    },
    llmPrompt: 'Emulate Afrikaans, which evolved from Dutch. The grammar is greatly simplified - no grammatical gender, simplified verb conjugations. Use double negation ("Ek weet nie" becomes "Ek weet nie...nie"). The tone should reflect a frontier society.',
  },

  ZULU: {
    id: 'ZULU',
    name: 'Zulu',
    nativeName: 'isiZulu',
    family: LANGUAGE_FAMILIES.NIGER_CONGO,
    script: 'Latin',
    period: [1500, 2025],
    regions: ['KwaZulu-Natal', 'Zululand', 'Natal', 'Durban'],
    culturalZones: ['SUB_SAHARAN_AFRICAN' as CulturalZone],
    greetings: {
      hello: 'Sawubona',
      goodbye: 'Hamba kahle',
      yes: 'Yebo',
      no: 'Cha',
      thanks: 'Ngiyabonga',
    },
    llmPrompt: 'Emulate Zulu. This is an agglutinative language with a complex noun class system (15 classes). Use click consonants (c, q, x). The language has tonal distinctions. Agreement markers must match throughout the sentence.',
  },

  XHOSA: {
    id: 'XHOSA',
    name: 'Xhosa',
    nativeName: 'isiXhosa',
    family: LANGUAGE_FAMILIES.NIGER_CONGO,
    script: 'Latin',
    period: [1500, 2025],
    regions: ['Eastern Cape', 'Cape Colony', 'Transkei', 'Ciskei'],
    culturalZones: ['SUB_SAHARAN_AFRICAN' as CulturalZone],
    greetings: {
      hello: 'Molo',
      goodbye: 'Sala kakuhle',
      yes: 'Ewe',
      no: 'Hayi',
      thanks: 'Enkosi',
    },
    llmPrompt: 'Emulate Xhosa. Like Zulu, this has noun classes and click consonants (c, q, x). The language is tonal. Use the distinctive Xhosa hlonipha (respect) vocabulary when appropriate.',
  },

  NAMA: {
    id: 'NAMA',
    name: 'Nama',
    nativeName: 'Khoekhoegowab',
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: 'Latin',
    period: [-2000, 2025],
    regions: ['Namibia', 'Namaland', 'Kalahari', 'Great Namaqualand'],
    culturalZones: ['SUB_SAHARAN_AFRICAN' as CulturalZone],
    greetings: {
      hello: 'ǃGâi tsēs',
      goodbye: 'ǀÎ ǃgâi',
      yes: 'ǃÎ-ǃî',
      no: 'ǀÎ-ǀî',
      thanks: 'Gangans',
    },
    llmPrompt: 'Emulate Nama/Khoekhoe. This language has the most complex click consonant system (ǃ ǀ ǁ ǂ). It is a tonal language with grammatical gender. Use SOV word order.',
  },

  // Creole Languages
  QUEBECOIS_FRENCH: {
    id: 'QUEBECOIS_FRENCH',
    name: 'Quebec French',
    nativeName: 'Français québécois',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [1600, 2025],
    regions: ['Quebec', 'St. Lawrence River', 'Montreal', 'Quebec City', 'Trois-Rivières', 'New France', 'Acadia'],
    culturalZones: ['NORTH_AMERICAN_COLONIAL' as CulturalZone],
    predecessors: ['OLD_FRENCH'],
    greetings: {
      hello: 'Bonjour',
      goodbye: 'Bonne journée',
      yes: 'Oui',
      no: 'Non',
      thanks: 'Merci',
    },
    llmPrompt: 'Emulate Quebec French, which preserved many 17th-century French features lost in France. Use distinctive vocabulary (char for car, blonde for girlfriend). Pronounce "moi" as "moé" and "toi" as "toé". The tone should reflect North American frontier life mixed with French tradition.',
  },

  LOUISIANA_CREOLE: {
    id: 'LOUISIANA_CREOLE',
    name: 'Louisiana Creole',
    nativeName: 'Kréyòl La Lwizyàn',
    family: LANGUAGE_FAMILIES.PIDGIN,
    script: 'Latin',
    period: [1700, 2025],
    regions: ['Louisiana', 'New Orleans', 'Mississippi Delta', 'Acadiana', 'Cajun Country'],
    culturalZones: ['NORTH_AMERICAN_COLONIAL' as CulturalZone],
    greetings: {
      hello: 'Bonjou',
      goodbye: 'Orevwa',
      yes: 'Wi',
      no: 'Non',
      thanks: 'Mèsi',
    },
    llmPrompt: 'Emulate Louisiana Creole. Mix French vocabulary with West African grammar patterns. Simplified verb system with particles for tense (té for past, ké/va for future). No gender or complex agreement. The tone should reflect the cultural blend of French, African, and American influences.',
  },

  HAITIAN_CREOLE: {
    id: 'HAITIAN_CREOLE',
    name: 'Haitian Creole',
    nativeName: 'Kreyòl ayisyen',
    family: LANGUAGE_FAMILIES.PIDGIN,
    script: 'Latin',
    period: [1700, 2025],
    regions: ['Haiti', 'Saint-Domingue', 'Port-au-Prince'],
    culturalZones: ['MESOAMERICAN' as CulturalZone],
    greetings: {
      hello: 'Bonjou',
      goodbye: 'Orevwa',
      yes: 'Wi',
      no: 'Non',
      thanks: 'Mèsi',
    },
    llmPrompt: 'Emulate Haitian Creole. French-based vocabulary with West African grammatical structure. Use particles for tense marking (te for past, ap for progressive, pral for future). No gender or verb conjugation. The tone should reflect Caribbean culture.',
  },

  // Asian Languages
  CANTONESE: {
    id: 'CANTONESE',
    name: 'Cantonese',
    nativeName: '廣東話',
    family: LANGUAGE_FAMILIES.SINO_TIBETAN,
    script: 'Chinese characters',
    period: [1200, 2025],
    regions: ['Guangdong', 'Canton', 'Hong Kong', 'Macau', 'Guangzhou'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['MIDDLE_CHINESE'],
    greetings: {
      hello: '你好',
      goodbye: '再見',
      yes: '係',
      no: '唔係',
      thanks: '唔該',
    },
    llmPrompt: 'Emulate Cantonese. This has 6-9 tones (depending on dialect). More conservative than Mandarin, preserving final consonants. Use sentence-final particles extensively (啦, 呀, 囉, 啊). The tone should be direct and pragmatic.',
  },

  OLD_KOREAN: {
    id: 'OLD_KOREAN',
    name: 'Old Korean',
    nativeName: '古朝鮮語',
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: ['Chinese characters (Idu)', 'Gugyeol'],
    period: [-2000, 900],
    regions: ['Korean Peninsula', 'Gojoseon', 'Three Kingdoms', 'Goguryeo', 'Baekje', 'Silla'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    successors: ['MIDDLE_KOREAN'],
    description: 'Earliest attested form of Korean, written using Chinese characters',
    llmPrompt: 'Use archaic Korean grammatical structures recorded in Chinese character transcriptions. SOV word order is strict. Use honorific particles abundantly. Vocabulary should focus on agricultural, military, and court terminology. Tone should be formal and deferential to authority.',
  },

  MIDDLE_KOREAN: {
    id: 'MIDDLE_KOREAN',
    name: 'Middle Korean',
    nativeName: '중세 한국어',
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: ['Hangul (early)', 'Hanja', 'Mixed script'],
    period: [900, 1600],
    regions: ['Goryeo', 'Early Joseon', 'Korean Peninsula'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['OLD_KOREAN'],
    successors: ['MODERN_KOREAN'],
    description: 'Medieval Korean during Goryeo and early Joseon periods',
    greetings: {
      hello: '平安하시니잇가',
      goodbye: '安寧히 가시옵소서',
      yes: '그러하옵니다',
      no: '아니하옵니다',
      thanks: '고맙사옵니다',
    },
    llmPrompt: 'Use Middle Korean as recorded in 15th-16th century texts. Employ complex honorific system with multiple levels. Use archaic verbal endings (-옵-, -사-, -시-). Mix Sino-Korean and native vocabulary. Maintain highly formal court register.',
  },

  MODERN_KOREAN: {
    id: 'MODERN_KOREAN',
    name: 'Modern Korean',
    nativeName: '한국어',
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: 'Hangul',
    period: [1600, 2025],
    regions: ['Korea', 'Seoul', 'Pyongyang', 'Joseon', 'Busan', 'Gyeongju'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['MIDDLE_KOREAN'],
    greetings: {
      hello: '안녕하세요',
      goodbye: '안녕히 가세요',
      yes: '네',
      no: '아니요',
      thanks: '감사합니다',
    },
    llmPrompt: 'Use contemporary Korean with appropriate honorific levels. SOV word order with complex agglutination. Employ formal speech levels (-습니다, -세요) in most contexts. Balance Sino-Korean and native vocabulary appropriately.',
  },

  KOREAN: {
    id: 'KOREAN',
    name: 'Korean',
    nativeName: '한국어',
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: 'Hangul',
    period: [500, 2025],
    regions: ['Korea', 'Seoul', 'Pyongyang', 'Joseon', 'Goryeo', 'Busan', 'Gyeongju'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    greetings: {
      hello: '안녕하세요',
      goodbye: '안녕히 가세요',
      yes: '네',
      no: '아니요',
      thanks: '감사합니다',
    },
    llmPrompt: 'Emulate Korean. Agglutinative language with SOV word order. Complex honorific system with multiple speech levels. Use appropriate endings based on social hierarchy (-습니다 formal, -어요 polite, -어 casual).',
  },

  VIETNAMESE: {
    id: 'VIETNAMESE',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    family: LANGUAGE_FAMILIES.AUSTRONESIAN,
    script: 'Latin',
    period: [1000, 2025],
    regions: ['Vietnam', 'Annam', 'Tonkin', 'Cochinchina', 'Saigon', 'Hanoi', 'Mekong Delta'],
    culturalZones: ['SOUTH_ASIAN' as CulturalZone],
    greetings: {
      hello: 'Xin chào',
      goodbye: 'Tạm biệt',
      yes: 'Vâng',
      no: 'Không',
      thanks: 'Cảm ơn',
    },
    llmPrompt: 'Emulate Vietnamese. Tonal language (6 tones). Analytic/isolating grammar with SVO word order. Use classifiers for counting. Heavy Chinese vocabulary influence for formal/abstract terms.',
  },

  THAI: {
    id: 'THAI',
    name: 'Thai',
    nativeName: 'ภาษาไทย',
    family: LANGUAGE_FAMILIES.SINO_TIBETAN,
    script: 'Thai',
    period: [1200, 2025],
    regions: ['Thailand', 'Siam', 'Bangkok', 'Ayutthaya', 'Chiang Mai'],
    culturalZones: ['SOUTH_ASIAN' as CulturalZone],
    greetings: {
      hello: 'สวัสดี',
      goodbye: 'ลาก่อน',
      yes: 'ใช่',
      no: 'ไม่',
      thanks: 'ขอบคุณ',
    },
    llmPrompt: 'Emulate Thai. Tonal language (5 tones). SVO word order. No verb conjugation or noun declension. Use polite particles (ครับ for males, ค่ะ for females). Complex pronoun system based on social status.',
  },

  TAGALOG: {
    id: 'TAGALOG',
    name: 'Tagalog',
    nativeName: 'Tagalog',
    family: LANGUAGE_FAMILIES.AUSTRONESIAN,
    script: 'Latin',
    period: [1500, 2025],
    regions: ['Philippines', 'Luzon', 'Manila', 'Batangas', 'Quezon'],
    culturalZones: ['SOUTH_ASIAN' as CulturalZone],
    predecessors: ['OLD_TAGALOG'],
    greetings: {
      hello: 'Kumusta',
      goodbye: 'Paalam',
      yes: 'Oo',
      no: 'Hindi',
      thanks: 'Salamat',
    },
    llmPrompt: 'Emulate modern Tagalog/Filipino. VSO word order with focus marking system. Spanish loanwords for numbers, time, kitchen items. English loanwords for modern concepts. Use po/opo for respect.',
  },

  // Indigenous American
  INUKTITUT: {
    id: 'INUKTITUT',
    name: 'Inuktitut',
    nativeName: 'ᐃᓄᒃᑎᑐᑦ',
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: 'Canadian Aboriginal syllabics',
    period: [-2000, 2025],
    regions: ['Arctic', 'Nunavut', 'Greenland', 'Hudson Bay', 'Baffin Island', 'Canadian North'],
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone],
    greetings: {
      hello: 'ᐊᐃ',
      goodbye: 'ᐊᑦᓯᐅᓂᖅᐊᖅᑐᖓ',
      yes: 'ᐄ',
      no: 'ᐊᐅᒃᑲ',
      thanks: 'ᓇᑯᕐᒦᒃ',
    },
    llmPrompt: 'Emulate Inuktitut. Highly polysynthetic language where entire sentences can be one word. Ergative-absolutive alignment. Dual number in addition to singular/plural. Focus on words related to snow, ice, hunting, and Arctic life.',
  },

  NAVAJO: {
    id: 'NAVAJO',
    name: 'Navajo',
    nativeName: 'Diné bizaad',
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: 'Latin',
    period: [1000, 2025],
    regions: ['Southwest', 'Arizona', 'New Mexico', 'Four Corners', 'Navajo Nation'],
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone],
    greetings: {
      hello: 'Yáʼátʼééh',
      goodbye: 'Hágoóneeʼ',
      yes: 'Aooʼ',
      no: 'Dooda',
      thanks: 'Ahéheeʼ',
    },
    llmPrompt: 'Emulate Navajo/Diné. Complex verb morphology with aspectual rather than tense marking. Animacy hierarchy affects word order. Use fourth person (obviative) pronoun. The language emphasizes process over state.',
  },

  GUARANI: {
    id: 'GUARANI',
    name: 'Guarani',
    nativeName: "Avañe'ẽ",
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: 'Latin',
    period: [1000, 2025],
    regions: ['Paraguay', 'Misiones', 'Chaco', 'Parana River'],
    culturalZones: ['SOUTH_AMERICAN' as CulturalZone],
    greetings: {
      hello: 'Mba\'éichapa',
      goodbye: 'Jajotopáta',
      yes: 'Heẽ',
      no: 'Nahániri',
      thanks: 'Aguyje',
    },
    llmPrompt: 'Emulate Guarani. Agglutinative language with nasal harmony. Active-stative alignment. Extensive Spanish loanwords in modern usage. The language coexists with Spanish in Paraguay.',
  },
};

// Regional language mappings with name-based detection
interface LanguageWeight {
  id: string;
  period: [number, number];
  weight: number;
}

interface NamePattern {
  pattern: RegExp;
  language: string;
  weight: number;
}

interface RegionLanguageMapping {
  patterns: string[];
  languages: LanguageWeight[];
  namePatterns?: NamePattern[];
}

// Comprehensive regional language mappings
const REGIONAL_LANGUAGE_MAPPINGS: RegionLanguageMapping[] = [
  // === EUROPE ===
  // Low Countries
  {
    patterns: ['low countries', 'scheldt', 'flanders', 'brabant', 'antwerp', 'bruges', 'ghent'],
    languages: [
      { id: 'DUTCH', period: [1500, 2025], weight: 60 },
      { id: 'OLD_FRENCH', period: [1500, 1700], weight: 30 },
      { id: 'FRENCH_MEDIEVAL', period: [1100, 1500], weight: 30 },
      { id: 'GERMAN', period: [1500, 2025], weight: 5 },
      { id: 'EARLY_SPANISH', period: [1550, 1700], weight: 5 },
    ],
    namePatterns: [
      { pattern: /van der|van den|van|de \w+/i, language: 'DUTCH', weight: 95 },
      { pattern: /Dubois|Dupont|Lefevre|Moreau/i, language: 'OLD_FRENCH', weight: 90 },
      { pattern: /Schmidt|Mueller|Schneider/i, language: 'GERMAN', weight: 85 },
    ],
  },
  // Netherlands
  {
    patterns: ['netherlands', 'holland', 'amsterdam', 'rotterdam', 'utrecht', 'hague'],
    languages: [
      { id: 'DUTCH', period: [1500, 2025], weight: 95 },
      { id: 'GERMAN', period: [1500, 2025], weight: 3 },
      { id: 'OLD_FRENCH', period: [1700, 1800], weight: 2 },
    ],
    namePatterns: [
      { pattern: /van der|van den|van|de \w+|Jansen|Bakker|Visser/i, language: 'DUTCH', weight: 98 },
    ],
  },
  // Ireland
  {
    patterns: ['ireland', 'dublin', 'cork', 'galway', 'limerick', 'connacht', 'munster', 'leinster', 'ulster'],
    languages: [
      { id: 'IRISH_GAELIC', period: [500, 2025], weight: 60 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1200, 2025], weight: 40 },
    ],
    namePatterns: [
      { pattern: /O'|Mc|Mac|Ó|Ni /i, language: 'IRISH_GAELIC', weight: 75 },
      { pattern: /Smith|Brown|Williams|Jones/i, language: 'EARLY_MODERN_ENGLISH', weight: 80 },
    ],
  },
  // Scotland
  {
    patterns: ['scotland', 'edinburgh', 'glasgow', 'aberdeen', 'highlands', 'lowlands'],
    languages: [
      { id: 'SCOTS', period: [1100, 2025], weight: 40 },
      { id: 'SCOTS_GAELIC', period: [500, 2025], weight: 30 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1500, 2025], weight: 30 },
    ],
    namePatterns: [
      { pattern: /Mac|Mc|Campbell|Stewart|Murray|Ross/i, language: 'SCOTS_GAELIC', weight: 70 },
      { pattern: /Burns|Scott|Wallace|Douglas/i, language: 'SCOTS', weight: 75 },
    ],
  },
  // Wales
  {
    patterns: ['wales', 'cymru', 'cardiff', 'swansea', 'gwynedd', 'powys'],
    languages: [
      { id: 'WELSH', period: [500, 2025], weight: 60 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1500, 2025], weight: 40 },
    ],
    namePatterns: [
      { pattern: /Llewellyn|Gwynn|Rhys|ap |ab /i, language: 'WELSH', weight: 85 },
    ],
  },
  // Catalonia
  {
    patterns: ['catalonia', 'barcelona', 'valencia', 'balearic', 'mallorca'],
    languages: [
      { id: 'CATALAN', period: [900, 2025], weight: 70 },
      { id: 'EARLY_SPANISH', period: [1500, 2025], weight: 30 },
    ],
    namePatterns: [
      { pattern: /Puig|Ferrer|Serra|Soler|Mas/i, language: 'CATALAN', weight: 80 },
    ],
  },
  // Basque Country
  {
    patterns: ['basque', 'euskadi', 'bilbao', 'san sebastian', 'vitoria', 'navarre'],
    languages: [
      { id: 'BASQUE', period: [-2000, 2025], weight: 50 },
      { id: 'EARLY_SPANISH', period: [1500, 2025], weight: 35 },
      { id: 'OLD_FRENCH', period: [1500, 1800], weight: 15 },
    ],
    namePatterns: [
      { pattern: /Etxe|Iturri|Zugasti|Aguirre|Azkuna/i, language: 'BASQUE', weight: 90 },
    ],
  },
  // Switzerland
  {
    patterns: ['switzerland', 'swiss', 'zurich', 'geneva', 'bern', 'basel', 'lucerne'],
    languages: [
      { id: 'GERMAN', period: [1000, 2025], weight: 65 },
      { id: 'OLD_FRENCH', period: [1000, 2025], weight: 25 },
      { id: 'ITALIAN', period: [1000, 2025], weight: 8 },
      { id: 'ROMANSH', period: [500, 2025], weight: 2 },
    ],
  },

  // === AMERICAS ===
  // Quebec/St. Lawrence
  {
    patterns: ['st. lawrence', 'saint lawrence', 'quebec', 'montreal', 'trois-rivieres', 'new france'],
    languages: [
      { id: 'QUEBECOIS_FRENCH', period: [1600, 2025], weight: 85 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1760, 2025], weight: 10 },
      { id: 'MOHAWK', period: [1000, 2025], weight: 5 },
    ],
    namePatterns: [
      { pattern: /Tremblay|Gagnon|Roy|Côté|Bouchard|Gauthier/i, language: 'QUEBECOIS_FRENCH', weight: 95 },
      { pattern: /Smith|Brown|Wilson|MacDonald/i, language: 'EARLY_MODERN_ENGLISH', weight: 90 },
    ],
  },
  // Canadian North/Arctic
  {
    patterns: ['canadian north', 'hudson bay', 'nunavut', 'baffin', 'arctic canada', 'northwest territories'],
    languages: [
      { id: 'INUKTITUT', period: [-2000, 2025], weight: 70 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1700, 2025], weight: 25 },
      { id: 'OLD_FRENCH', period: [1600, 1800], weight: 5 },
    ],
  },
  // Louisiana
  {
    patterns: ['louisiana', 'new orleans', 'mississippi delta', 'baton rouge', 'cajun'],
    languages: [
      { id: 'LOUISIANA_CREOLE', period: [1700, 2025], weight: 30 },
      { id: 'OLD_FRENCH', period: [1700, 1803], weight: 40 },
      { id: 'EARLY_SPANISH', period: [1762, 1803], weight: 20 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1803, 2025], weight: 40 },
    ],
    namePatterns: [
      { pattern: /Thibodaux|Boudreaux|Fontenot|Hebert|Landry/i, language: 'LOUISIANA_CREOLE', weight: 85 },
    ],
  },
  // Caribbean
  {
    patterns: ['haiti', 'saint-domingue', 'port-au-prince'],
    languages: [
      { id: 'HAITIAN_CREOLE', period: [1700, 2025], weight: 85 },
      { id: 'OLD_FRENCH', period: [1600, 1800], weight: 15 },
    ],
  },
  // Southwest US
  {
    patterns: ['new mexico', 'santa fe', 'albuquerque', 'ancestral puebloan'],
    languages: [
      { id: 'NAVAJO', period: [1000, 2025], weight: 30 },
      { id: 'EARLY_SPANISH', period: [1540, 2025], weight: 40 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1846, 2025], weight: 30 },
    ],
    namePatterns: [
      { pattern: /Begay|Yazzie|Benally|Tsosie/i, language: 'NAVAJO', weight: 95 },
      { pattern: /Martinez|Garcia|Lopez|Sanchez/i, language: 'EARLY_SPANISH', weight: 90 },
    ],
  },

  // === AFRICA ===
  // South Africa
  {
    patterns: ['cape colony', 'cape town', 'transvaal', 'johannesburg', 'pretoria', 'orange free state'],
    languages: [
      { id: 'AFRIKAANS', period: [1700, 2025], weight: 35 },
      { id: 'ZULU', period: [1500, 2025], weight: 20 },
      { id: 'XHOSA', period: [1500, 2025], weight: 20 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1800, 2025], weight: 20 },
      { id: 'DUTCH', period: [1652, 1800], weight: 5 },
    ],
    namePatterns: [
      { pattern: /van der|van den|van |de |Botha|Kruger|Pretorius/i, language: 'AFRIKAANS', weight: 90 },
      { pattern: /Zulu|Buthelezi|Dlamini|Mthethwa/i, language: 'ZULU', weight: 95 },
      { pattern: /Mandela|Sisulu|Tambo|Mbeki/i, language: 'XHOSA', weight: 90 },
    ],
  },
  // Namibia
  {
    patterns: ['namibia', 'windhoek', 'kalahari', 'namib', 'walvis bay'],
    languages: [
      { id: 'NAMA', period: [-2000, 2025], weight: 25 },
      { id: 'HERERO', period: [1500, 2025], weight: 20 },
      { id: 'AFRIKAANS', period: [1800, 2025], weight: 25 },
      { id: 'GERMAN', period: [1884, 2025], weight: 10 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1920, 2025], weight: 20 },
    ],
    namePatterns: [
      { pattern: /ǃ|ǀ|ǁ|ǂ|!|\\|/i, language: 'NAMA', weight: 100 },
      { pattern: /Tjituka|Kaura|Herero|Maharero/i, language: 'HERERO', weight: 95 },
      { pattern: /von |Schmidt|Mueller|Zimmermann/i, language: 'GERMAN', weight: 95 },
      { pattern: /van der|Botha|Swart|Venter/i, language: 'AFRIKAANS', weight: 90 },
    ],
  },

  // === ASIA ===
  // Hong Kong
  {
    patterns: ['hong kong', 'victoria', 'kowloon'],
    languages: [
      { id: 'CANTONESE', period: [1200, 2025], weight: 85 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1842, 2025], weight: 15 },
    ],
    namePatterns: [
      { pattern: /Wong|Chan|Lee|Cheung|Ho|Lau/i, language: 'CANTONESE', weight: 95 },
      { pattern: /Smith|Jones|Wilson/i, language: 'EARLY_MODERN_ENGLISH', weight: 90 },
    ],
  },
  // China - Enhanced with proper archaic periodization
  {
    patterns: ['china', 'yellow river', 'yangtze', 'beijing', 'luoyang', 'changan', 'xian', 'kaifeng', 'nanjing', 'tang', 'song', 'ming', 'qing', 'shang', 'zhou'],
    languages: [
      { id: 'OLD_CHINESE', period: [-1250, -221], weight: 95 },
      { id: 'CLASSICAL_CHINESE', period: [-221, 600], weight: 90 },
      { id: 'MIDDLE_CHINESE', period: [600, 1400], weight: 90 },
      { id: 'EARLY_MANDARIN', period: [1400, 1900], weight: 85 },
      { id: 'MANDARIN', period: [1900, 2025], weight: 95 },
    ],
    namePatterns: [
      { pattern: /Wang|Li|Zhang|Liu|Chen|Yang|Zhao|Huang|Zhou|Wu|Xu|Sun|Zhu|Ma|Hu|Guo|Lin|He|Gao|Luo/i, language: 'OLD_CHINESE', period: [-1250, -221], weight: 98 },
      { pattern: /Wang|Li|Zhang|Liu|Chen|Yang|Zhao|Huang|Zhou|Wu|Xu|Sun|Zhu|Ma|Hu|Guo|Lin|He|Gao|Luo/i, language: 'CLASSICAL_CHINESE', period: [-221, 600], weight: 98 },
      { pattern: /Wang|Li|Zhang|Liu|Chen|Yang|Zhao|Huang|Zhou|Wu|Xu|Sun|Zhu|Ma|Hu|Guo|Lin|He|Gao|Luo/i, language: 'MIDDLE_CHINESE', period: [600, 1400], weight: 98 },
      { pattern: /Wang|Li|Zhang|Liu|Chen|Yang|Zhao|Huang|Zhou|Wu|Xu|Sun|Zhu|Ma|Hu|Guo|Lin|He|Gao|Luo/i, language: 'EARLY_MANDARIN', period: [1400, 1900], weight: 98 },
      { pattern: /Wang|Li|Zhang|Liu|Chen|Yang|Zhao|Huang|Zhou|Wu|Xu|Sun|Zhu|Ma|Hu|Guo|Lin|He|Gao|Luo/i, language: 'MANDARIN', period: [1900, 2025], weight: 98 },
    ],
  },

  // Korea - Enhanced with proper periodization
  {
    patterns: ['korea', 'seoul', 'pyongyang', 'busan', 'joseon', 'goryeo', 'silla', 'baekje', 'goguryeo', 'gojoseon'],
    languages: [
      { id: 'OLD_KOREAN', period: [-2000, 900], weight: 95 },
      { id: 'MIDDLE_KOREAN', period: [900, 1600], weight: 95 },
      { id: 'MODERN_KOREAN', period: [1600, 2025], weight: 95 },
      { id: 'OLD_CHINESE', period: [-1000, 0], weight: 15 },
      { id: 'CLASSICAL_CHINESE', period: [0, 1900], weight: 10 },
    ],
    namePatterns: [
      { pattern: /Kim|Lee|Park|Choi|Jung|Kang|Yi|Yun|Song|Jang/i, language: 'OLD_KOREAN', period: [-2000, 900], weight: 98 },
      { pattern: /Kim|Lee|Park|Choi|Jung|Kang|Yi|Yun|Song|Jang/i, language: 'MIDDLE_KOREAN', period: [900, 1600], weight: 98 },
      { pattern: /Kim|Lee|Park|Choi|Jung|Kang|Yi|Yun|Song|Jang/i, language: 'MODERN_KOREAN', period: [1600, 2025], weight: 98 },
    ],
  },

  // India - Enhanced with proper archaic Sanskrit forms
  {
    patterns: ['india', 'ganges', 'indus', 'punjab', 'delhi', 'agra', 'varanasi', 'pataliputra', 'hastinapura', 'mathura', 'vedic', 'arya', 'bharata'],
    languages: [
      { id: 'VEDIC_SANSKRIT', period: [-1500, -500], weight: 90 },
      { id: 'CLASSICAL_SANSKRIT', period: [-500, 1400], weight: 85 },
      { id: 'PRAKRIT', period: [-300, 1000], weight: 60 },
      { id: 'HINDI', period: [1000, 2025], weight: 80 },
      { id: 'PERSIAN', period: [1200, 1800], weight: 25 },
      { id: 'ENGLISH', period: [1800, 1947], weight: 15 },
    ],
    namePatterns: [
      { pattern: /Singh|Sharma|Gupta|Agarwal|Mishra|Yadav|Verma|Srivastava|Rai|Jha/i, language: 'VEDIC_SANSKRIT', period: [-1500, -500], weight: 95 },
      { pattern: /Singh|Sharma|Gupta|Agarwal|Mishra|Yadav|Verma|Srivastava|Rai|Jha/i, language: 'CLASSICAL_SANSKRIT', period: [-500, 1000], weight: 95 },
      { pattern: /Singh|Sharma|Gupta|Agarwal|Mishra|Yadav|Verma|Srivastava|Rai|Jha/i, language: 'HINDI', period: [1000, 2025], weight: 95 },
    ],
  },
  // Vietnam
  {
    patterns: ['vietnam', 'annam', 'tonkin', 'cochinchina', 'saigon', 'hanoi', 'mekong'],
    languages: [
      { id: 'VIETNAMESE', period: [1000, 2025], weight: 85 },
      { id: 'OLD_FRENCH', period: [1850, 1954], weight: 10 },
      { id: 'CLASSICAL_CHINESE', period: [100, 1900], weight: 5 },
    ],
    namePatterns: [
      { pattern: /Nguyen|Tran|Le|Pham|Vu|Hoang/i, language: 'VIETNAMESE', weight: 95 },
    ],
  },
  // Philippines
  {
    patterns: ['philippines', 'luzon', 'manila', 'cebu', 'mindanao', 'visayas'],
    languages: [
      { id: 'TAGALOG', period: [1500, 2025], weight: 30 },
      { id: 'OLD_CEBUANO', period: [900, 2025], weight: 20 },
      { id: 'EARLY_SPANISH', period: [1565, 1898], weight: 25 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1898, 2025], weight: 25 },
    ],
    namePatterns: [
      { pattern: /dela Cruz|Santos|Reyes|Garcia|Mendoza/i, language: 'EARLY_SPANISH', weight: 70 },
      { pattern: /Magbanua|Magsaysay|Macapagal/i, language: 'TAGALOG', weight: 80 },
    ],
  },

  // === OCEANIA ===
  // New Zealand
  {
    patterns: ['new zealand', 'aotearoa', 'north island', 'south island', 'wellington', 'auckland'],
    languages: [
      { id: 'MAORI', period: [1200, 2025], weight: 40 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1840, 2025], weight: 60 },
    ],
    namePatterns: [
      { pattern: /Te |Ngā|Wh/i, language: 'MAORI', weight: 90 },
    ],
  },
  // Hawaii
  {
    patterns: ['hawaii', 'hawaiian islands', 'oahu', 'maui', 'big island'],
    languages: [
      { id: 'HAWAIIAN', period: [300, 2025], weight: 50 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1893, 2025], weight: 50 },
    ],
    namePatterns: [
      { pattern: /Kamehameha|Kalani|Keoni|Leilani/i, language: 'HAWAIIAN', weight: 95 },
    ],
  },
];

/**
 * Get the appropriate language for a character based on context
 */
export function getLanguageForCharacter(
  culturalZone: CulturalZone | string,
  year: number,
  region?: string,
  localArea?: string,
  npcName?: string,
  profession?: string
): LanguageData | undefined {
  // STEP 1: Name-based detection (highest priority)
  if (npcName) {
    const nameParts = npcName.split(' ');
    const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const fullName = npcName;

    // Check against regional name patterns
    const searchTerms = [
      localArea?.toLowerCase(),
      region?.toLowerCase()
    ].filter(Boolean);

    for (const mapping of REGIONAL_LANGUAGE_MAPPINGS) {
      // Check if this region matches
      const regionMatches = searchTerms.some(term =>
        term && mapping.patterns.some(pattern => term.includes(pattern))
      );

      if (regionMatches && mapping.namePatterns) {
        for (const namePattern of mapping.namePatterns) {
          if (namePattern.pattern.test(fullName) || namePattern.pattern.test(surname)) {
            const lang = LANGUAGES[namePattern.language];
            if (lang && year >= lang.period[0] && year <= lang.period[1]) {
              return lang;
            }
          }
        }
      }
    }
  }

  // STEP 2: Profession-based detection
  if (profession) {
    const profLower = profession.toLowerCase();

    // Clergy speak Latin in medieval/renaissance Europe
    if (profLower.match(/priest|bishop|monk|friar|abbott|cardinal|pope/i)) {
      if (year < 1700 && culturalZone === 'EUROPEAN') {
        return LANGUAGES['LATIN'];
      }
    }

    // Islamic scholars speak Arabic
    if (profLower.match(/imam|mullah|qadi|ulama|sufi|muezzin/i)) {
      return LANGUAGES['CLASSICAL_ARABIC'];
    }

    // Jewish religious figures
    if (profLower.match(/rabbi|cantor|hazzan|maggid/i)) {
      if (year >= 1000) {
        return LANGUAGES['YIDDISH'];
      }
      return LANGUAGES['HEBREW'] || LANGUAGES['ARAMAIC'];
    }

    // Buddhist monks
    if (profLower.match(/lama|rinpoche|bhikkhu/i)) {
      if (culturalZone === 'EAST_ASIAN') {
        return LANGUAGES['CLASSICAL_CHINESE'];
      } else if (culturalZone === 'SOUTH_ASIAN') {
        return LANGUAGES['SANSKRIT'];
      }
    }
  }

  // STEP 3: Regional override mappings
  const searchTerms = [
    localArea?.toLowerCase(),
    region?.toLowerCase()
  ].filter(Boolean);

  for (const mapping of REGIONAL_LANGUAGE_MAPPINGS) {
    const matches = searchTerms.some(term =>
      term && mapping.patterns.some(pattern => term.includes(pattern))
    );

    if (matches) {
      // Find the appropriate language for this time period
      const validLanguages = mapping.languages
        .filter(lang => year >= lang.period[0] && year <= lang.period[1])
        .sort((a, b) => b.weight - a.weight);

      if (validLanguages.length > 0) {
        // Could implement weighted random selection here
        // For now, just pick the highest weight
        const selected = validLanguages[0];
        return LANGUAGES[selected.id];
      }
    }
  }

  // STEP 4: Check exact language region matches (original logic)
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