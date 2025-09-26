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
  historicalContext?: string; // One-sentence educational context about the language's history and evolution
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
    historicalContext: 'Never written down, this prehistoric language spoken on the Eurasian steppes around 4000 BCE is the reconstructed ancestor of most European and many Asian languages.',
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
    historicalContext: 'Spoken around 4000 BCE in the Yellow River valley, this reconstructed language gave rise to Chinese, Tibetan, Burmese, and hundreds of other East Asian languages.',
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
    historicalContext: 'The world\'s first written language (3500 BCE), a linguistic isolate with no known relatives, died out when its speakers switched to Akkadian around 1750 BCE.',
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
    historicalContext: 'Written in one of the world\'s oldest scripts (3200 BCE), this mysterious language isolate was spoken in ancient Iran until Persian conquered Elam around 300 BCE.',
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
    historicalContext: 'This hypothetical ancestor language from around 10,000 BCE in Northeast Africa gave rise to Arabic, Hebrew, Ancient Egyptian, Berber, and Somali language families.',
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
    historicalContext: 'The language of Rome evolved into the Romance languages (Spanish, French, Italian, Portuguese, Romanian) and remained the lingua franca of Western scholarship until the 18th century.',
  },

  ITALIAN: {
    id: 'ITALIAN',
    name: 'Italian',
    nativeName: 'Italiano',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [1200, 2025],
    regions: ['Italy', 'San Marino', 'Vatican', 'Switzerland', 'Istria'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    predecessors: ['LATIN'],
    greetings: {
      hello: 'Ciao',
      goodbye: 'Arrivederci',
      yes: 'Sì',
      no: 'No',
      thanks: 'Grazie',
    },
    llmPrompt: 'Emulate modern Italian. Romance language with rich vowel system. Extensive use of gestures (described in dialogue). Regional variations between north and south. Include food and art vocabulary. Use passionate, expressive tone.',
    historicalContext: 'Evolved from Vulgar Latin, standardized during the Renaissance based on Tuscan dialect. Became unified national language after Italian unification in 1861.',
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
    historicalContext: 'The language of Socrates, Plato, and Aristotle, Ancient Greek shaped Western philosophy, science, and democracy, leaving thousands of words in modern languages.',
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
    historicalContext: 'The lingua franca of the ancient Near East (1000 BCE-700 CE), spoken by Jesus and used for parts of the Bible, it survived in pockets to the present day.',
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
    historicalContext: 'The language of Babylon and Assyria (2500-100 BCE), used for the Code of Hammurabi and the Epic of Gilgamesh, it was the diplomatic language of the ancient Near East.',
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
    historicalContext: 'Written in hieroglyphs for over 3000 years (3200 BCE-700 CE), Egyptian evolved through several stages before becoming Coptic, still used in Christian liturgy today.',
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
    historicalContext: 'The oldest form of Sanskrit (1500-500 BCE), preserved in the Rigveda and other sacred texts, it represents the earliest Indo-European literature.',
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
    historicalContext: 'Codified by Panini around 500 BCE with mathematical precision, Classical Sanskrit became the refined language of Hindu and Buddhist scholarship for two millennia.',
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
    historicalContext: 'The sacred language of Hinduism and Buddhism, Sanskrit influenced all languages of India and Southeast Asia, remaining a liturgical language to this day.',
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
    historicalContext: 'The language of oracle bones and bronze inscriptions (1250-221 BCE), ancestor to all Chinese dialects, evolved into Classical Chinese for literary use.',
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
    historicalContext: 'The literary language of Confucius and classical Chinese literature remained the written standard across East Asia for 2000+ years until the 20th century.',
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
    historicalContext: 'The oldest known Indo-European language (1650-1200 BCE), Hittite reveals the deep history of European languages and was used by a major Bronze Age empire in Turkey.',
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
    historicalContext: 'The first branch to split from Proto-Indo-European (around 3500 BCE), these languages developed in Anatolia and include Hittite, the oldest known Indo-European language.',
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
    historicalContext: 'The mysterious language of Europe\'s first advanced civilization on Crete (2700-1450 BCE), written in the still-undeciphered Linear A script.',
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
    historicalContext: 'The ancestor of Irish, Welsh, Scottish Gaelic, and ancient Gaulish, spoken by Iron Age Celts who dominated much of Europe before Roman expansion.',
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
    historicalContext: 'The Continental Celtic language of Asterix\'s ancestors, spoken across France and Belgium until Roman conquest gradually replaced it with Latin.',
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
    historicalContext: 'The earliest extensively recorded Germanic language (4th century CE), preserved in Bishop Wulfila\'s Bible translation for the Gothic tribes.',
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
    historicalContext: 'Spoken by Germanic tribes around 500 BCE-200 CE, this reconstructed language was the ancestor of English, German, Dutch, and Scandinavian languages.',
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
    historicalContext: 'Spoken around 3000 BCE by ancestors of Ojibwe, Cree, and Blackfoot peoples, this language spread across much of North America from the Atlantic to the Rockies.',
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
    historicalContext: 'The ancestral language of the Great Plains peoples including Lakota, Dakota, and Crow, central to the buffalo-hunting cultures of North America.',
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
    historicalContext: 'Ancestor of the languages of the Iroquois Confederacy and Cherokee, spoken by agricultural societies in eastern North America for 4000+ years.',
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
    historicalContext: 'The ancestral language of the Inca Empire and Andean civilizations, Proto-Quechua spread along mountain trade routes and remains spoken by millions today.',
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
    historicalContext: 'The language of the Aztec Empire and Mesoamerican literature, Classical Nahuatl gave us words like chocolate, tomato, and coyote.',
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
    historicalContext: 'The language of Maya hieroglyphs and classic period cities like Tikal and Palenque, it recorded astronomy, history, and ritual for over 1500 years.',
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
    historicalContext: 'The ancestor of most Australian Aboriginal languages, spoken for 5000+ years across 90% of Australia, representing humanity\'s longest continuous cultural tradition.',
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
    historicalContext: 'The language of the greatest navigators in human history, Proto-Polynesian speakers colonized the vast Pacific Ocean from Hawaii to New Zealand around 1500 BCE.',
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
    historicalContext: 'The Germanic language of Beowulf and the Anglo-Saxons, heavily influenced by Old Norse invasions, evolved into Middle English after the Norman Conquest of 1066.',
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
    historicalContext: 'The language of Chaucer\'s Canterbury Tales, Middle English shows the dramatic transformation after the Norman Conquest, blending Anglo-Saxon and French into modern English\'s ancestor.',
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
    historicalContext: 'The language of the Viking sagas and Norse mythology, Old Norse spread across Northern Europe and the Atlantic, even reaching North America before Columbus.',
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
    historicalContext: 'The language of troubadours and the Song of Roland, Old French bridged Latin and modern French, spreading courtly culture across medieval Europe.',
  },

  FRENCH: {
    id: 'FRENCH',
    name: 'Modern French',
    nativeName: 'Français',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [1600, 2025],
    regions: ['France', 'Quebec', 'Belgium', 'Switzerland', 'West Africa', 'Global'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    predecessors: ['OLD_FRENCH'],
    greetings: {
      hello: 'Bonjour',
      goodbye: 'Au revoir',
      yes: 'Oui',
      no: 'Non',
      thanks: 'Merci',
    },
    llmPrompt: 'Use modern French with appropriate register. Include formal/informal distinctions (tu/vous). Regional variations when relevant (Metropolitan, Quebec, African French). Rich vocabulary for cuisine, art, philosophy.',
    historicalContext: 'Modern French became the language of diplomacy and high culture, spreading through colonial expansion to become a major world language spoken by 280 million people.',
  },

  // === MISSING ANCIENT MENA LANGUAGES ===

  PHOENICIAN: {
    id: 'PHOENICIAN',
    name: 'Phoenician',
    nativeName: '𐤊𐤍𐤏𐤍𐤉𐤌',
    family: LANGUAGE_FAMILIES.AFRO_ASIATIC,
    script: 'Phoenician alphabet',
    period: [-1200, -300],
    regions: ['Tyre', 'Sidon', 'Byblos', 'Carthage', 'Levantine coast', 'Mediterranean colonies'],
    culturalZones: ['MENA' as CulturalZone],
    successors: ['PUNIC', 'HEBREW', 'ARAMAIC'],
    description: 'Maritime trading language that gave the world its alphabet',
    greetings: {
      hello: 'šlm',
      goodbye: 'šlm',
      yes: 'hn',
      no: 'bl',
      thanks: 'yšlm',
    },
    llmPrompt: 'Emulate the concise, practical style of Phoenician merchant inscriptions. VSO word order. Focus on maritime, commercial, and religious terminology. References to Baal, Astarte, and Melqart common. Tone should be pragmatic and direct, befitting a trading civilization.',
    historicalContext: 'The Phoenicians (1200-300 BCE) spread the alphabet across the Mediterranean, influencing Greek, Latin, Arabic, and Hebrew scripts that billions use today.',
  },

  ANCIENT_HEBREW: {
    id: 'ANCIENT_HEBREW',
    name: 'Ancient Hebrew',
    nativeName: 'עִבְרִית עַתִּיקָה',
    family: LANGUAGE_FAMILIES.AFRO_ASIATIC,
    script: 'Paleo-Hebrew',
    period: [-1000, 500],
    regions: ['Judah', 'Israel', 'Samaria', 'Jerusalem', 'Levant'],
    culturalZones: ['MENA' as CulturalZone],
    predecessors: ['PHOENICIAN'],
    successors: ['MISHNAIC_HEBREW', 'ARAMAIC'],
    description: 'Biblical Hebrew of the First Temple period',
    greetings: {
      hello: 'shalom',
      goodbye: 'shalom',
      yes: 'ken',
      no: 'lo',
      thanks: 'todah',
    },
    llmPrompt: 'Use Biblical Hebrew style with VSO word order and construct chains. Employ parallelism and poetic devices from Psalms and Prophets. Rich use of metaphor and covenantal language. Tone ranges from legal/priestly precision to prophetic poetry.',
    historicalContext: 'The language of the Hebrew Bible (1000-500 BCE), preserved Jewish identity through millennia and was revived as Modern Hebrew in the 20th century.',
  },

  OLD_PERSIAN: {
    id: 'OLD_PERSIAN',
    name: 'Old Persian',
    nativeName: '𐎠𐎼𐎹',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Old Persian cuneiform',
    period: [-600, -300],
    regions: ['Persepolis', 'Susa', 'Ecbatana', 'Persian Empire', 'Iran'],
    culturalZones: ['MENA' as CulturalZone],
    predecessors: ['PROTO_INDO_IRANIAN'],
    successors: ['MIDDLE_PERSIAN'],
    description: 'Imperial language of the Achaemenid Empire',
    greetings: {
      hello: 'draya',
      goodbye: 'vašna',
      yes: 'ava',
      no: 'naiy',
      thanks: 'spas',
    },
    llmPrompt: 'Emulate the monumental inscriptions of Darius and Xerxes. SOV word order. Formal, imperial tone invoking Ahura Mazda. Use titles like "King of Kings" and "King of Countries". Focus on royal achievements, divine mandate, and imperial administration.',
    historicalContext: 'The official language of the Persian Empire (600-300 BCE), Old Persian inscriptions at Persepolis and Behistun provide our earliest records of Persian civilization.',
  },

  MIDDLE_PERSIAN: {
    id: 'MIDDLE_PERSIAN',
    name: 'Middle Persian',
    nativeName: 'Pārsīg',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: ['Pahlavi', 'Manichaean', 'Inscriptional Pahlavi'],
    period: [-300, 700],
    regions: ['Sassanid Empire', 'Persia', 'Mesopotamia', 'Central Asia'],
    culturalZones: ['MENA' as CulturalZone],
    predecessors: ['OLD_PERSIAN'],
    successors: ['CLASSICAL_PERSIAN'],
    description: 'Language of the Sassanid Empire and Zoroastrian texts',
    greetings: {
      hello: 'drōd',
      goodbye: 'pad drōd',
      yes: 'hā',
      no: 'nē',
      thanks: 'spās',
    },
    llmPrompt: 'Use Zoroastrian religious terminology and dualistic concepts (light/darkness, truth/lie). SOV word order. Complex honorific system. Tone should be formal and often religious, reflecting Sassanid court culture and Zoroastrian theology.',
    historicalContext: 'The language of the Sassanid Empire (224-651 CE) and Zoroastrian scriptures, Middle Persian preserved ancient Iranian culture through the Islamic conquest.',
  },

  CLASSICAL_PERSIAN: {
    id: 'CLASSICAL_PERSIAN',
    name: 'Classical Persian',
    nativeName: 'فارسی کلاسیک',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Arabic script',
    period: [900, 1500],
    regions: ['Persia', 'Central Asia', 'India', 'Ottoman Empire'],
    culturalZones: ['MENA' as CulturalZone, 'SOUTH_ASIAN' as CulturalZone],
    predecessors: ['MIDDLE_PERSIAN'],
    successors: ['MODERN_PERSIAN'],
    description: 'Literary language of Persian poetry and administration',
    greetings: {
      hello: 'salām',
      goodbye: 'khodā hāfez',
      yes: 'baleh',
      no: 'nakheyr',
      thanks: 'sepās',
    },
    llmPrompt: 'Emulate the poetic style of Ferdowsi, Hafez, or Rumi. SOV word order with extensive Arabic loanwords. Use elaborate metaphors, wine imagery, and mystical themes. Employ complex compound verbs and ezāfe construction. Tone should be refined, poetic, and philosophically sophisticated.',
    historicalContext: 'The language of Persian literature\'s golden age (900-1500 CE), used by poets like Rumi and Hafez, became the cultural language from Istanbul to Delhi.',
  },

  ANCIENT_SOUTH_ARABIAN: {
    id: 'ANCIENT_SOUTH_ARABIAN',
    name: 'Ancient South Arabian',
    nativeName: 'Sabaean',
    family: LANGUAGE_FAMILIES.AFRO_ASIATIC,
    script: 'South Arabian script',
    period: [-1000, 600],
    regions: ['Yemen', 'Sheba', 'Himyar', 'Hadhramaut', 'Southern Arabia'],
    culturalZones: ['MENA' as CulturalZone],
    successors: ['CLASSICAL_ARABIC', 'ETHIOPIC'],
    description: 'Languages of ancient Yemen kingdoms, including Sabaean and Himyarite',
    greetings: {
      hello: 'slm',
      goodbye: 'slm',
      yes: 'hn',
      no: 'l',
      thanks: 'šlm',
    },
    llmPrompt: 'Use monumental inscription style with references to irrigation, frankincense trade, and moon deity Almaqah. VSO word order. Formal tone appropriate for royal dedications and trade agreements. Focus on agricultural and commercial terminology.',
    historicalContext: 'The languages of the Queen of Sheba\'s realm (1000 BCE-600 CE), these inscriptions reveal the sophisticated kingdoms that controlled the incense trade.',
  },

  COPTIC: {
    id: 'COPTIC',
    name: 'Coptic',
    nativeName: 'ⲙⲉⲧⲣⲉⲙⲛ̀ⲭⲏⲙⲓ',
    family: LANGUAGE_FAMILIES.AFRO_ASIATIC,
    script: 'Coptic alphabet',
    period: [100, 1700],
    regions: ['Egypt', 'Nubia', 'Nile Valley'],
    culturalZones: ['MENA' as CulturalZone],
    predecessors: ['ANCIENT_EGYPTIAN', 'DEMOTIC'],
    description: 'Last stage of Egyptian language, used by Christian Egyptians',
    greetings: {
      hello: 'nofri',
      goodbye: 'oujai',
      yes: 'aha',
      no: 'mmon',
      thanks: 'šepe hmot',
    },
    llmPrompt: 'Use Christian theological vocabulary with Egyptian substrate. SVO word order influenced by Greek. Extensive Greek loanwords. Tone should be liturgical and formal, appropriate for religious texts and monastic correspondence.',
    historicalContext: 'The final stage of the Egyptian language (100-1700 CE), Coptic preserves Ancient Egyptian in Christian liturgy and provides the key to deciphering hieroglyphs.',
  },

  DEMOTIC: {
    id: 'DEMOTIC',
    name: 'Demotic Egyptian',
    nativeName: 'sš n šˤ.t',
    family: LANGUAGE_FAMILIES.AFRO_ASIATIC,
    script: 'Demotic script',
    period: [-700, 500],
    regions: ['Egypt', 'Nile Delta', 'Upper Egypt'],
    culturalZones: ['MENA' as CulturalZone],
    predecessors: ['ANCIENT_EGYPTIAN'],
    successors: ['COPTIC'],
    description: 'Popular script and language of Late Period Egypt',
    greetings: {
      hello: 'ii.wy',
      goodbye: 'seneb.ty',
      yes: 'iw',
      no: 'bn',
      thanks: 'dua',
    },
    llmPrompt: 'Use simplified Egyptian with reduced morphology. Focus on practical, everyday vocabulary for contracts, letters, and stories. Less formal than hieroglyphic texts. VSO word order. Tone should be more colloquial than earlier Egyptian.',
    historicalContext: 'The "people\'s script" of ancient Egypt (700 BCE-500 CE), Demotic was used for everyday documents and helped decode the Rosetta Stone.',
  },

  BYZANTINE_GREEK: {
    id: 'BYZANTINE_GREEK',
    name: 'Byzantine Greek',
    nativeName: 'Ῥωμαϊκή',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Greek alphabet',
    period: [300, 1453],
    regions: ['Constantinople', 'Anatolia', 'Greece', 'Syria', 'Egypt'],
    culturalZones: ['EUROPEAN' as CulturalZone, 'MENA' as CulturalZone],
    predecessors: ['ANCIENT_GREEK', 'KOINE_GREEK'],
    successors: ['MODERN_GREEK'],
    description: 'Medieval Greek of the Byzantine Empire',
    greetings: {
      hello: 'Χαῖρε',
      goodbye: 'Ἔρρωσο',
      yes: 'Ναί',
      no: 'Οὔ',
      thanks: 'Εὐχαριστῶ',
    },
    llmPrompt: 'Use formal Byzantine court language with Christian theological vocabulary. Mix of classical and vernacular elements. Complex honorific titles. References to Emperor and Patriarch. Tone should be ceremonial and orthodox Christian.',
    historicalContext: 'The language of the Byzantine Empire (330-1453 CE), it preserved Greek learning through the Middle Ages and influenced Church Slavonic and Arabic science.',
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
    historicalContext: 'The language of the Quran and classical Islamic scholarship, Classical Arabic unified the Arab world and became the liturgical language of Islam worldwide.',
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
    historicalContext: 'The spoken language of Tang and Song dynasty China (600-1200 CE), it diverged into modern Chinese dialects like Mandarin, Cantonese, and Hokkien.',
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
    historicalContext: 'The refined language of Japan\'s Heian period (794-1185 CE), used in the world\'s first novel (Tale of Genji) and court poetry that shaped Japanese aesthetics.',
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
    historicalContext: 'Created by Saints Cyril and Methodius in the 9th century, this liturgical language gave Slavic peoples literacy and influenced all modern Slavic languages.',
  },

  RUSSIAN: {
    id: 'RUSSIAN',
    name: 'Russian',
    nativeName: 'Русский',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Cyrillic',
    period: [1400, 2025],
    regions: ['Russia', 'Ukraine', 'Belarus', 'Kazakhstan', 'Central Asia'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    predecessors: ['OLD_SLAVONIC'],
    greetings: {
      hello: 'Здравствуйте',
      goodbye: 'До свидания',
      yes: 'Да',
      no: 'Нет',
      thanks: 'Спасибо',
    },
    llmPrompt: 'Emulate Russian. Rich case system with six cases. Flexible word order emphasizing new information. Extensive use of prefixes and suffixes. Include Soviet-era vocabulary for modern contexts. Use formal register unless context suggests informal speech.',
    historicalContext: 'Russian evolved from Old East Slavic and became the lingua franca of the Soviet Union, expanding across Eurasia as a major international language.',
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
    historicalContext: 'The language of Genghis Khan and the Mongol Empire, which created the largest contiguous land empire in history and connected East and West.',
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
    historicalContext: 'One of the six languages of the Iroquois Confederacy, whose democratic principles influenced the US Constitution, still spoken today in New York and Quebec.',
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
    historicalContext: 'The language of the Lakota Sioux, including leaders like Sitting Bull and Crazy Horse, it embodies the culture of the Great Plains buffalo hunters.',
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
    historicalContext: 'One of the most widely spoken indigenous languages in North America, Ojibwe extends from Ontario to Montana and preserves sophisticated ecological knowledge.',
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
    historicalContext: 'The language of Shakespeare and the King James Bible, Early Modern English saw an explosion of vocabulary and became the foundation of English as a global language.',
  },

  ENGLISH: {
    id: 'ENGLISH',
    name: 'Modern English',
    nativeName: 'English',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [1700, 2025],
    regions: ['England', 'United States', 'Canada', 'Australia', 'India', 'Global'],
    culturalZones: ['EUROPEAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone],
    predecessors: ['EARLY_MODERN_ENGLISH'],
    greetings: {
      hello: 'Hello',
      goodbye: 'Goodbye',
      yes: 'Yes',
      no: 'No',
      thanks: 'Thank you',
    },
    llmPrompt: 'Use modern English with appropriate register for the context. Include regional variations when relevant (American, British, Australian, etc.). Vocabulary should reflect the time period and setting.',
    historicalContext: 'Modern English became the global lingua franca through British colonial expansion and American economic dominance, now spoken by over 1.5 billion people worldwide.',
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
    historicalContext: 'The language of Cervantes and the conquistadors, Early Modern Spanish spread across the Americas and Philippines, creating the first global empire.',
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
    historicalContext: 'The language of global exploration, Portuguese navigators spread their language from Brazil to Goa to Macau, creating the first truly worldwide trade network.',
  },

  MODERN_PORTUGUESE: {
    id: 'MODERN_PORTUGUESE',
    name: 'Modern Portuguese',
    nativeName: 'Português',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [1700, 2050],
    regions: ['Portugal', 'Brazil', 'Angola', 'Mozambique', 'Cape Verde', 'Guinea-Bissau', 'São Tomé', 'East Timor', 'Macau'],
    culturalZones: ['EUROPEAN' as CulturalZone, 'SOUTH_AMERICAN' as CulturalZone, 'SUB_SAHARAN_AFRICAN' as CulturalZone],
    predecessors: ['EARLY_PORTUGUESE'],
    greetings: {
      hello: 'Olá',
      goodbye: 'Tchau',
      yes: 'Sim',
      no: 'Não',
      thanks: 'Obrigado',
    },
    llmPrompt: 'Use modern Portuguese with Brazilian colloquialisms when in South America, European Portuguese when in Portugal/Africa. Be informal and conversational. Use diminutives frequently (inho/inha). Drop subject pronouns as is natural in Portuguese. Include regional slang appropriate to the location.',
    historicalContext: 'Modern Portuguese is spoken by over 260 million people across four continents, with distinct Brazilian and European varieties that diverged after Brazilian independence in 1822.',
  },

  MODERN_SPANISH: {
    id: 'MODERN_SPANISH',
    name: 'Modern Spanish',
    nativeName: 'Español',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Latin',
    period: [1700, 2050],
    regions: ['Spain', 'Mexico', 'Argentina', 'Colombia', 'Peru', 'Venezuela', 'Chile', 'Ecuador', 'Guatemala', 'Cuba', 'Bolivia', 'Dominican Republic', 'Honduras', 'Paraguay', 'Nicaragua', 'El Salvador', 'Costa Rica', 'Panama', 'Uruguay', 'Puerto Rico'],
    culturalZones: ['EUROPEAN' as CulturalZone, 'SOUTH_AMERICAN' as CulturalZone, 'MESOAMERICAN' as CulturalZone],
    predecessors: ['EARLY_SPANISH'],
    greetings: {
      hello: 'Hola',
      goodbye: 'Adiós',
      yes: 'Sí',
      no: 'No',
      thanks: 'Gracias',
    },
    llmPrompt: 'Use modern Spanish appropriate to the region. For South America use voseo in Argentina/Uruguay, tuteo elsewhere. Include regional vocabulary: che (Argentina), güey (Mexico), pana (Venezuela), etc. Be conversational and informal unless context requires formality. Avoid overly archaic constructions.',
    historicalContext: 'The world\'s second most spoken language by native speakers, modern Spanish has evolved distinct regional varieties across 21 countries while maintaining mutual intelligibility.',
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
    historicalContext: 'The cosmopolitan language of the Ottoman Empire, blending Turkish grammar with Arabic and Persian vocabulary to administer territories from Budapest to Baghdad.',
  },

  // === Additional MENA Languages for Regional Mappings ===

  BERBER: {
    id: 'BERBER',
    name: 'Berber (Tamazight)',
    nativeName: 'ⵜⴰⵎⴰⵣⵉⵖⵜ',
    family: LANGUAGE_FAMILIES.AFRO_ASIATIC,
    script: ['Tifinagh', 'Arabic script', 'Latin script'],
    period: [-3000, 2025],
    regions: ['North Africa', 'Sahara', 'Atlas Mountains', 'Maghreb'],
    culturalZones: ['MENA' as CulturalZone],
    description: 'Indigenous languages of North Africa',
    greetings: {
      hello: 'Azul',
      goodbye: 'Ar tufat',
      yes: 'Ih',
      no: 'Uhu',
      thanks: 'Tanemmirt',
    },
    llmPrompt: 'Use VSO word order typical of Berber languages. Employ complex verb morphology with person, number, and gender marking. Include Arabic loanwords for Islamic concepts. Tone should reflect oral tradition and tribal identity.',
    historicalContext: 'The indigenous languages of North Africa, spoken by the Amazigh people for over 4000 years, survived Phoenician, Roman, Arab, and French colonization.',
  },

  ANDALUSI_ARABIC: {
    id: 'ANDALUSI_ARABIC',
    name: 'Andalusi Arabic',
    nativeName: 'العربية الأندلسية',
    family: LANGUAGE_FAMILIES.AFRO_ASIATIC,
    script: 'Arabic',
    period: [711, 1609],
    regions: ['Al-Andalus', 'Iberian Peninsula', 'Maghreb'],
    culturalZones: ['MENA' as CulturalZone, 'EUROPEAN' as CulturalZone],
    predecessors: ['CLASSICAL_ARABIC'],
    description: 'Arabic dialect of Islamic Spain',
    greetings: {
      hello: 'Marḥaban',
      goodbye: 'Wadāʿan',
      yes: 'Naʿam',
      no: 'Lā',
      thanks: 'Shukran',
    },
    llmPrompt: 'Mix Classical Arabic with Romance substrate influence. Include botanical, architectural, and scientific terminology. References to gardens, water features, and geometric patterns. Tone should be cultured and poetic, reflecting the sophisticated court culture of Córdoba and Granada.',
    historicalContext: 'The Arabic of Islamic Spain (711-1492) created a unique fusion culture, contributing hundreds of words to Spanish and Portuguese while advancing science and philosophy.',
  },

  MEROITIC: {
    id: 'MEROITIC',
    name: 'Meroitic',
    nativeName: 'Meroitic',
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: ['Meroitic hieroglyphic', 'Meroitic cursive'],
    period: [-300, 400],
    regions: ['Kush', 'Meroe', 'Nubia', 'Sudan'],
    culturalZones: ['SUB_SAHARAN_AFRICAN' as CulturalZone, 'MENA' as CulturalZone],
    description: 'Language of the Kingdom of Kush',
    isReconstructed: true,
    greetings: {
      hello: 'yetmde',
      goodbye: 'arite',
      yes: 'owe',
      no: 'mke',
      thanks: 'arite',
    },
    llmPrompt: 'Use the partially deciphered Meroitic script patterns. Mix Egyptian influences with indigenous African elements. References to iron working, archery, and powerful queens (Kandakes). Formal royal inscriptions style.',
    historicalContext: 'The language of the Kushite kingdom (300 BCE-400 CE) that ruled Egypt as the 25th Dynasty, Meroitic remains only partially deciphered.',
  },

  OLD_NUBIAN: {
    id: 'OLD_NUBIAN',
    name: 'Old Nubian',
    nativeName: 'ⲙⲓⲥⲓⲣ ⲛ ⲕⲟⲩϣ',
    family: LANGUAGE_FAMILIES.NILO_SAHARAN,
    script: ['Coptic alphabet', 'Greek alphabet'],
    period: [400, 1500],
    regions: ['Nubia', 'Dongola', 'Nobatia', 'Makuria', 'Alodia'],
    culturalZones: ['SUB_SAHARAN_AFRICAN' as CulturalZone, 'MENA' as CulturalZone],
    description: 'Medieval language of Christian Nubia',
    greetings: {
      hello: 'eirēnē',
      goodbye: 'ōšal',
      yes: 'aï',
      no: 'men',
      thanks: 'eucharistō',
    },
    llmPrompt: 'Use SOV word order with postpositions. Heavy Greek and Coptic influence for Christian terminology. References to monasteries, churches, and the Nile. Formal religious register.',
    historicalContext: 'The language of medieval Christian Nubian kingdoms (400-1500 CE), preserved in religious texts and tombstones along the Nile.',
  },

  GEORGIAN: {
    id: 'GEORGIAN',
    name: 'Georgian',
    nativeName: 'ქართული',
    family: 'Kartvelian',
    script: 'Georgian script',
    period: [-500, 2025],
    regions: ['Georgia', 'Caucasus', 'Tbilisi', 'Colchis', 'Iberia'],
    culturalZones: ['MENA' as CulturalZone, 'EUROPEAN' as CulturalZone],
    description: 'Ancient language of the Caucasus',
    greetings: {
      hello: 'Gamarjoba',
      goodbye: 'Nakhvamdis',
      yes: 'Diakh',
      no: 'Ara',
      thanks: 'Madloba',
    },
    llmPrompt: 'Use ergative-absolutive alignment and complex verb morphology with polypersonal agreement. SOV word order. Rich consonant clusters. References to wine, hospitality, and mountain traditions. Tone ranges from epic poetry to warm hospitality.',
    historicalContext: 'One of the world\'s oldest living languages with its own unique script, Georgian has been written since the 5th century and preserves ancient Caucasian culture.',
  },

  ARMENIAN: {
    id: 'ARMENIAN',
    name: 'Classical Armenian',
    nativeName: 'Հայերեն',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Armenian alphabet',
    period: [405, 2025],
    regions: ['Armenia', 'Caucasus', 'Anatolia', 'Cilicia'],
    culturalZones: ['MENA' as CulturalZone, 'EUROPEAN' as CulturalZone],
    description: 'Ancient Indo-European language of Armenia',
    greetings: {
      hello: 'Barev',
      goodbye: 'Tstesutyun',
      yes: 'Ayo',
      no: 'Voch',
      thanks: 'Shnorhakalutyun',
    },
    llmPrompt: 'Use Classical Armenian (Grabar) style. SOV word order with seven cases. Rich in compound words. Christian theological vocabulary mixed with ancient Indo-European roots. References to Mount Ararat, manuscripts, and survival.',
    historicalContext: 'Created its unique alphabet in 405 CE to translate the Bible, Armenian preserved its identity through centuries of foreign rule between empires.',
  },

  ETHIOPIC: {
    id: 'ETHIOPIC',
    name: 'Ethiopic (Ge\'ez)',
    nativeName: 'ግዕዝ',
    family: LANGUAGE_FAMILIES.AFRO_ASIATIC,
    script: 'Ethiopic script',
    period: [-1000, 2025],
    regions: ['Ethiopia', 'Eritrea', 'Axum', 'Horn of Africa'],
    culturalZones: ['SUB_SAHARAN_AFRICAN' as CulturalZone],
    predecessors: ['ANCIENT_SOUTH_ARABIAN'],
    successors: ['AMHARIC', 'TIGRINYA'],
    description: 'Classical language of Ethiopia',
    greetings: {
      hello: 'Selam',
      goodbye: 'Dehna hun',
      yes: 'Awo',
      no: 'Albo',
      thanks: 'Egziabher yimesgen',
    },
    llmPrompt: 'Use VSO word order typical of Semitic languages. Complex verb system with stems indicating causative, passive, and intensive. Christian liturgical vocabulary. References to the Ark of the Covenant, coffee, and ancient kingdoms.',
    historicalContext: 'The ancient language of the Axumite Empire and Ethiopian Orthodox Church, Ge\'ez preserves one of the world\'s oldest Christian traditions.',
  },

  BEJA: {
    id: 'BEJA',
    name: 'Beja (Bedawi)',
    nativeName: 'Bidhaawyeet',
    family: LANGUAGE_FAMILIES.AFRO_ASIATIC,
    script: ['Arabic script', 'Latin script'],
    period: [-2000, 2025],
    regions: ['Eastern Desert', 'Red Sea Hills', 'Sudan', 'Eritrea', 'Egypt'],
    culturalZones: ['MENA' as CulturalZone, 'SUB_SAHARAN_AFRICAN' as CulturalZone],
    description: 'Language of the Beja nomads',
    greetings: {
      hello: 'Asalaamu',
      goodbye: 'Aaman',
      yes: 'Aha',
      no: 'Kaaki',
      thanks: 'Win daayiib',
    },
    llmPrompt: 'Use SOV word order with complex aspect system. Mix of Cushitic substrate with Arabic loanwords. References to camels, desert navigation, gold mining, and Red Sea trade. Tone reflects nomadic independence and ancient traditions.',
    historicalContext: 'Spoken by the Beja nomads for over 4000 years in the Eastern Desert, they were known to ancient Egyptians as the Medjay, elite desert scouts and police.',
  },

  // === CENTRAL ASIAN LANGUAGES ===

  PROTO_TURKIC: {
    id: 'PROTO_TURKIC',
    name: 'Proto-Turkic',
    nativeName: '*Proto-Türkik',
    family: LANGUAGE_FAMILIES.TURKIC,
    script: ['Reconstructed', 'Old Turkic runes'],
    period: [-500, 1000],
    regions: ['Altai Mountains', 'Mongolian Steppes', 'Central Asia'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    isReconstructed: true,
    successors: ['OLD_TURKIC', 'KAZAKH', 'UZBEK', 'TURKMEN', 'OTTOMAN_TURKISH'],
    description: 'Reconstructed ancestor of all Turkic languages',
    llmPrompt: 'Use SOV word order with agglutinative morphology. Focus on pastoral nomadic vocabulary: horses, sheep, sky, steppe. Simple phonology with vowel harmony. References to Tengri (sky god) and shamanic practices.',
    historicalContext: 'The ancestor of Turkish, Kazakh, Uzbek and dozens of other languages, Proto-Turkic spread from the Altai Mountains across Eurasia with nomadic confederations.',
  },

  SOGDIAN: {
    id: 'SOGDIAN',
    name: 'Sogdian',
    nativeName: 'swγδyk',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: ['Sogdian alphabet', 'Manichaean script', 'Syriac script'],
    period: [-500, 1000],
    regions: ['Samarkand', 'Bukhara', 'Ferghana Valley', 'Silk Road', 'Transoxiana'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['OLD_PERSIAN'],
    description: 'Lingua franca of the Silk Road',
    greetings: {
      hello: 'δrwt',
      goodbye: 'pδ δrwt',
      yes: 'ʾʾw',
      no: 'nʾ',
      thanks: 'spʾs',
    },
    llmPrompt: 'Use SOV word order typical of Eastern Iranian. Rich merchant vocabulary: trade, caravan, silk, jade, spices. Buddhist and Manichaean religious terminology. Cosmopolitan tone reflecting cultural exchange.',
    historicalContext: 'The international language of the Silk Road (500 BCE-1000 CE), Sogdian merchants connected China with Rome and spread Buddhism across Central Asia.',
  },

  KAZAKH: {
    id: 'KAZAKH',
    name: 'Kazakh',
    nativeName: 'Қазақ тілі',
    family: LANGUAGE_FAMILIES.TURKIC,
    script: ['Cyrillic', 'Arabic script', 'Latin'],
    period: [1000, 2025],
    regions: ['Kazakh Steppes', 'Altai Mountains', 'Aral Sea Basin', 'Tian Shan Range'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['PROTO_TURKIC'],
    description: 'Language of the Kazakh nomads',
    greetings: {
      hello: 'Сәлеметсіз бе',
      goodbye: 'Сау болыңыз',
      yes: 'Иә',
      no: 'Жоқ',
      thanks: 'Рахмет',
    },
    llmPrompt: 'Use SOV word order with extensive case system. Rich vocabulary for horses, eagle hunting, and steppe life. Persian and Arabic loanwords for Islamic concepts. Russian loanwords in modern period. Epic storytelling tradition.',
    historicalContext: 'The language of the vast Kazakh steppes, it preserves ancient Turkic nomadic traditions while adapting to Russian and Chinese influences.',
  },

  UZBEK: {
    id: 'UZBEK',
    name: 'Uzbek',
    nativeName: 'Oʻzbek tili',
    family: LANGUAGE_FAMILIES.TURKIC,
    script: ['Arabic script', 'Cyrillic', 'Latin'],
    period: [1000, 2025],
    regions: ['Samarkand Region', 'Ferghana Valley', 'Transoxiana', 'Khorasan'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['PROTO_TURKIC', 'SOGDIAN'],
    description: 'Language of the settled Turkic peoples of Central Asia',
    greetings: {
      hello: 'Assalomu alaykum',
      goodbye: 'Xayr',
      yes: 'Ha',
      no: 'Yoʻq',
      thanks: 'Rahmat',
    },
    llmPrompt: 'Mix of Turkic grammar with heavy Persian influence. Urban vocabulary: bazaar, crafts, irrigation. References to Timur, Islamic scholarship, and Silk Road heritage. More Persian loanwords than other Turkic languages.',
    historicalContext: 'Heir to the great cities of Samarkand and Bukhara, Uzbek blends Turkic structure with Persian cultural vocabulary from centuries of Timurid rule.',
  },

  TURKMEN: {
    id: 'TURKMEN',
    name: 'Turkmen',
    nativeName: 'Türkmençe',
    family: LANGUAGE_FAMILIES.TURKIC,
    script: ['Arabic script', 'Cyrillic', 'Latin'],
    period: [1000, 2025],
    regions: ['Kyzylkum Desert', 'Karakum Desert', 'Kopet Dag', 'Merv'],
    culturalZones: ['EAST_ASIAN' as CulturalZone, 'MENA' as CulturalZone],
    predecessors: ['PROTO_TURKIC'],
    description: 'Language of Turkmen tribes',
    greetings: {
      hello: 'Salam',
      goodbye: 'Hoş',
      yes: 'Hawa',
      no: 'Ýok',
      thanks: 'Sag bol',
    },
    llmPrompt: 'SOV word order with vowel harmony. Desert vocabulary: camels, oases, carpet weaving. Tribal identity markers. Persian influence but less than Uzbek. References to Akhal-Teke horses and traditional crafts.',
    historicalContext: 'The language of the fierce Turkmen tribes who controlled the desert routes between Iran and Central Asia, famous for their horses and carpets.',
  },

  YAKUT: {
    id: 'YAKUT',
    name: 'Yakut (Sakha)',
    nativeName: 'Саха тыла',
    family: LANGUAGE_FAMILIES.TURKIC,
    script: ['Cyrillic'],
    period: [1000, 2025],
    regions: ['Eastern Siberia', 'Arctic Siberia', 'Sakha'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['PROTO_TURKIC'],
    description: 'Northernmost Turkic language',
    greetings: {
      hello: 'Дорообо',
      goodbye: 'Көрсүөххэ диэри',
      yes: 'Ээх',
      no: 'Суох',
      thanks: 'Баһыыба',
    },
    llmPrompt: 'Turkic structure heavily influenced by local languages. Arctic vocabulary: reindeer, permafrost, long winter nights. Shamanistic traditions. Russian loanwords. Unique among Turkic languages.',
    historicalContext: 'The remarkable northward migration of Turkic speakers to Arctic Siberia created this unique language adapted to the world\'s coldest inhabited region.',
  },

  EVENKI: {
    id: 'EVENKI',
    name: 'Evenki',
    nativeName: 'Эвэнки',
    family: 'Tungusic',
    script: ['Cyrillic'],
    period: [-2000, 2025],
    regions: ['Western Siberia', 'Central Siberia', 'Eastern Siberia', 'Manchurian Plain'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    description: 'Language of Siberian reindeer herders',
    greetings: {
      hello: 'Дорово',
      goodbye: 'Аят',
      yes: 'Э-э',
      no: 'Ачин',
      thanks: 'Бэлэм',
    },
    llmPrompt: 'SOV word order with complex spatial deixis for navigation. Reindeer herding vocabulary. Intimate knowledge of taiga and tundra. Shamanistic terminology. Traditional ecological knowledge.',
    historicalContext: 'The Evenki people and their language spread across the vast Siberian taiga with their reindeer, influencing place names from Mongolia to the Arctic.',
  },

  // === MODERN SUCCESSOR LANGUAGES ===

  MODERN_TURKISH: {
    id: 'MODERN_TURKISH',
    name: 'Modern Turkish',
    nativeName: 'Türkçe',
    family: LANGUAGE_FAMILIES.TURKIC,
    script: 'Latin',
    period: [1928, 2025],
    regions: ['Turkey', 'Cyprus', 'Balkans'],
    culturalZones: ['MENA' as CulturalZone, 'EUROPEAN' as CulturalZone],
    predecessors: ['OTTOMAN_TURKISH'],
    greetings: {
      hello: 'Merhaba',
      goodbye: 'Hoşça kal',
      yes: 'Evet',
      no: 'Hayır',
      thanks: 'Teşekkür ederim',
    },
    llmPrompt: 'SOV word order with agglutination. Vowel harmony. French loanwords for modern concepts replacing Arabic/Persian. Informal vs formal distinction (sen/siz). Atatürk\'s language reforms evident.',
    historicalContext: 'Radically reformed in 1928 by Atatürk\'s alphabet change and language purification, Modern Turkish replaced Arabic script and thousands of Arabic-Persian words.',
  },

  MODERN_PERSIAN: {
    id: 'MODERN_PERSIAN',
    name: 'Modern Persian (Farsi)',
    nativeName: 'فارسی',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Arabic script',
    period: [1500, 2025],
    regions: ['Iran', 'Afghanistan', 'Tajikistan'],
    culturalZones: ['MENA' as CulturalZone],
    predecessors: ['CLASSICAL_PERSIAN'],
    greetings: {
      hello: 'سلام',
      goodbye: 'خداحافظ',
      yes: 'بله',
      no: 'نه',
      thanks: 'متشکرم',
    },
    llmPrompt: 'SOV word order. Politeness levels (formal/informal). French loanwords for technology. Continue poetic tradition but with modern themes. Regional variations between Iran, Afghanistan, and Tajikistan.',
    historicalContext: 'Modern Persian continues the classical tradition while adapting to nationalism, modernization, and regional variations across Iran, Afghanistan, and Tajikistan.',
  },

  MODERN_GREEK: {
    id: 'MODERN_GREEK',
    name: 'Modern Greek',
    nativeName: 'Νέα Ελληνικά',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Greek alphabet',
    period: [1453, 2025],
    regions: ['Greece', 'Cyprus', 'Greek diaspora'],
    culturalZones: ['EUROPEAN' as CulturalZone],
    predecessors: ['BYZANTINE_GREEK'],
    greetings: {
      hello: 'Γεια σου',
      goodbye: 'Αντίο',
      yes: 'Ναι',
      no: 'Όχι',
      thanks: 'Ευχαριστώ',
    },
    llmPrompt: 'Simplified grammar compared to ancient Greek. SVO word order. Katharevousa (formal) vs Demotic (popular) diglossia resolved. Turkish and Italian loanwords. EU terminology.',
    historicalContext: 'Emerging from Byzantine Greek, the modern language underwent intense debate between archaic and popular forms before standardizing on demotic Greek in 1976.',
  },

  MODERN_HEBREW: {
    id: 'MODERN_HEBREW',
    name: 'Modern Hebrew',
    nativeName: 'עברית חדשה',
    family: LANGUAGE_FAMILIES.AFRO_ASIATIC,
    script: 'Hebrew alphabet',
    period: [1880, 2025],
    regions: ['Israel', 'Palestine'],
    culturalZones: ['MENA' as CulturalZone],
    predecessors: ['ANCIENT_HEBREW'],
    greetings: {
      hello: 'שלום',
      goodbye: 'להתראות',
      yes: 'כן',
      no: 'לא',
      thanks: 'תודה',
    },
    llmPrompt: 'Revived ancient language with modern innovations. SVO word order (vs biblical VSO). Simplified verb system. New vocabulary for modern concepts. Slang from Arabic, English, Russian.',
    historicalContext: 'The only successfully revived dead language, Modern Hebrew was reconstructed from ancient texts to become Israel\'s national language, spoken natively by millions.',
  },

  MODERN_STANDARD_ARABIC: {
    id: 'MODERN_STANDARD_ARABIC',
    name: 'Modern Standard Arabic',
    nativeName: 'العربية الفصحى الحديثة',
    family: LANGUAGE_FAMILIES.AFRO_ASIATIC,
    script: 'Arabic',
    period: [1800, 2025],
    regions: ['Arab League countries', 'Middle East', 'North Africa'],
    culturalZones: ['MENA' as CulturalZone],
    predecessors: ['CLASSICAL_ARABIC'],
    greetings: {
      hello: 'مرحبا',
      goodbye: 'وداعا',
      yes: 'نعم',
      no: 'لا',
      thanks: 'شكرا',
    },
    llmPrompt: 'Formal register based on Classical Arabic but simplified. VSO word order. Modern vocabulary for technology, politics, media. No one\'s native language but universal in formal contexts. Avoids dialectical features.',
    historicalContext: 'The formal language of Arab media, education, and literature, MSA modernized Classical Arabic for contemporary use while maintaining mutual intelligibility across dialects.',
  },

  // === MISSING MONGOLIAN AND MANCHURIAN LANGUAGES ===

  PROTO_MONGOLIC: {
    id: 'PROTO_MONGOLIC',
    name: 'Proto-Mongolic',
    nativeName: '*Proto-Mongolic',
    family: LANGUAGE_FAMILIES.MONGOLIC,
    script: ['Reconstructed'],
    period: [-500, 1200],
    regions: ['Mongolian Steppes', 'Northern China'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    isReconstructed: true,
    successors: ['MIDDLE_MONGOLIAN', 'KHITAN'],
    description: 'Reconstructed ancestor of Mongolian languages',
    llmPrompt: 'SOV word order with vowel harmony. Pastoral nomadic vocabulary. References to sky worship (Tengri), horses, and clan structure. Simple agglutinative morphology.',
    historicalContext: 'The reconstructed ancestor of Mongolian languages, spoken by steppe nomads before the rise of the Mongol Empire.',
  },

  KHALKHA_MONGOLIAN: {
    id: 'KHALKHA_MONGOLIAN',
    name: 'Khalkha Mongolian',
    nativeName: 'Халх Монгол',
    family: LANGUAGE_FAMILIES.MONGOLIC,
    script: ['Cyrillic', 'Traditional Mongolian script'],
    period: [1700, 2025],
    regions: ['Mongolia', 'Inner Mongolia'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['MIDDLE_MONGOLIAN'],
    greetings: {
      hello: 'Сайн байна уу',
      goodbye: 'Баяртай',
      yes: 'Тийм',
      no: 'Үгүй',
      thanks: 'Баярлалаа',
    },
    llmPrompt: 'Modern Mongolian with Cyrillic influence. SOV word order with complex case system. Buddhist and shamanistic vocabulary. Russian loanwords for modern concepts.',
    historicalContext: 'The official language of Mongolia, standardized from the central dialect and written in Cyrillic since 1941.',
  },

  MANCHU: {
    id: 'MANCHU',
    name: 'Manchu',
    nativeName: 'ᠮᠠᠨᠵᡠ ᡤᡳᠰᡠᠨ',
    family: 'Tungusic',
    script: ['Manchu script', 'Chinese characters'],
    period: [1200, 1900],
    regions: ['Manchuria', 'Beijing', 'Qing Empire'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    description: 'Language of the Qing Dynasty rulers',
    greetings: {
      hello: 'Si saiyin',
      goodbye: 'Sain achambi',
      yes: 'Inu',
      no: 'Waka',
      thanks: 'Baniha',
    },
    llmPrompt: 'SOV word order with vowel harmony. Imperial vocabulary mixing military, administrative, and shamanic terms. Influences from Mongolian and Chinese.',
    historicalContext: 'The language of the Manchu people who ruled China as the Qing Dynasty (1644-1912), now nearly extinct.',
  },

  KHITAN: {
    id: 'KHITAN',
    name: 'Khitan',
    nativeName: '契丹',
    family: LANGUAGE_FAMILIES.MONGOLIC,
    script: ['Khitan large script', 'Khitan small script'],
    period: [400, 1200],
    regions: ['Northern China', 'Manchuria', 'Mongolia'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['PROTO_MONGOLIC'],
    description: 'Language of the Liao Dynasty',
    isReconstructed: true,
    llmPrompt: 'Partially deciphered language. Mix Mongolic structure with Chinese administrative vocabulary. References to dual administration system.',
    historicalContext: 'The language of the Khitan Liao Dynasty (907-1125), their scripts remain only partially deciphered.',
  },

  OLD_UYGHUR: {
    id: 'OLD_UYGHUR',
    name: 'Old Uyghur',
    nativeName: 'ئۇيغۇرچە',
    family: LANGUAGE_FAMILIES.TURKIC,
    script: ['Old Uyghur alphabet', 'Runic script'],
    period: [700, 1500],
    regions: ['Tarim Basin', 'Turpan', 'Xinjiang'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['PROTO_TURKIC'],
    description: 'Medieval Turkic language of the Silk Road',
    greetings: {
      hello: 'Ässalamu',
      goodbye: 'Xoş',
      yes: 'Hä',
      no: 'Yaq',
      thanks: 'Rähmät',
    },
    llmPrompt: 'SOV Turkic structure with Buddhist and Manichaean vocabulary. Trade terminology from the Silk Road. Sogdian loanwords.',
    historicalContext: 'The literary language of the Uyghur Khaganate (744-840) and Silk Road city-states.',
  },

  // === CHINESE DIALECTS ===

  MIN: {
    id: 'MIN',
    name: 'Min Chinese (Hokkien/Fujianese)',
    nativeName: '閩語',
    family: LANGUAGE_FAMILIES.SINO_TIBETAN,
    script: 'Chinese characters',
    period: [800, 2025],
    regions: ['Fujian', 'Taiwan', 'Southeast Asia'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['MIDDLE_CHINESE'],
    greetings: {
      hello: 'Lí-hó',
      goodbye: 'Tsài-kiàn',
      yes: 'Sī',
      no: 'M̄-sī',
      thanks: 'To-siā',
    },
    llmPrompt: 'Preserves many Old Chinese features lost in Mandarin. Complex tone system (7-8 tones). Maritime vocabulary. Southeast Asian loanwords.',
    historicalContext: 'The language of Fujian province and Chinese diaspora in Southeast Asia, Min preserves ancient Chinese pronunciations.',
  },

  WU: {
    id: 'WU',
    name: 'Wu Chinese (Shanghainese)',
    nativeName: '吳語',
    family: LANGUAGE_FAMILIES.SINO_TIBETAN,
    script: 'Chinese characters',
    period: [800, 2025],
    regions: ['Shanghai', 'Jiangsu', 'Zhejiang'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['MIDDLE_CHINESE'],
    greetings: {
      hello: 'Nong hao',
      goodbye: 'Zei wei',
      yes: 'Eh',
      no: 'Veh',
      thanks: 'Xia xia nong',
    },
    llmPrompt: 'Soft consonants compared to Mandarin. Complex tone sandhi. Commercial and urban vocabulary from Shanghai.',
    historicalContext: 'The language of Shanghai and the Yangtze Delta, Wu Chinese was the prestige language of medieval Chinese poetry.',
  },

  TAIWANESE_HOKKIEN: {
    id: 'TAIWANESE_HOKKIEN',
    name: 'Taiwanese Hokkien',
    nativeName: '臺灣話',
    family: LANGUAGE_FAMILIES.SINO_TIBETAN,
    script: ['Chinese characters', 'Pe̍h-ōe-jī romanization'],
    period: [1600, 2025],
    regions: ['Taiwan', 'Fujian'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['MIN'],
    greetings: {
      hello: 'Lí-hó',
      goodbye: 'Tsài-kiàn',
      yes: 'Sī',
      no: 'M̄-sī',
      thanks: 'Kám-siā',
    },
    llmPrompt: 'Min dialect with Japanese loanwords from colonial period. Aboriginal Austronesian substrate. Code-switching with Mandarin common.',
    historicalContext: 'Brought by Fujian settlers in the 1600s, evolved separately with Japanese colonial and indigenous influences.',
  },

  // === HIMALAYAN AND TIBETAN LANGUAGES ===

  TIBETAN: {
    id: 'TIBETAN',
    name: 'Classical Tibetan',
    nativeName: 'བོད་སྐད',
    family: LANGUAGE_FAMILIES.SINO_TIBETAN,
    script: 'Tibetan script',
    period: [600, 2025],
    regions: ['Tibet', 'Himalayas', 'Ladakh', 'Bhutan'],
    culturalZones: ['SOUTH_ASIAN' as CulturalZone, 'EAST_ASIAN' as CulturalZone],
    description: 'Language of Tibetan Buddhism',
    greetings: {
      hello: 'Tashi delek',
      goodbye: 'Kale pe',
      yes: 'Yin',
      no: 'Men',
      thanks: 'Thuk je che',
    },
    llmPrompt: 'SOV word order with ergative-absolutive alignment. Rich honorific system. Buddhist philosophical vocabulary. Sanskrit loanwords for religious terms.',
    historicalContext: 'The liturgical language of Tibetan Buddhism, remarkably stable since the 7th century due to religious conservatism.',
  },

  NEPALI: {
    id: 'NEPALI',
    name: 'Nepali',
    nativeName: 'नेपाली',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: 'Devanagari',
    period: [1200, 2025],
    regions: ['Nepal', 'Sikkim', 'Darjeeling', 'Bhutan'],
    culturalZones: ['SOUTH_ASIAN' as CulturalZone],
    predecessors: ['SANSKRIT'],
    greetings: {
      hello: 'Namaste',
      goodbye: 'Bidāī',
      yes: 'Ho',
      no: 'Hoina',
      thanks: 'Dhanyabād',
    },
    llmPrompt: 'SOV Indo-Aryan language. Honorific levels (high, medium, low). Sanskrit vocabulary for formal speech. Tibetan loanwords for mountain terminology.',
    historicalContext: 'The language of the Gorkha Kingdom that unified Nepal, bridging Indo-Aryan and Tibeto-Burman linguistic worlds.',
  },

  // === JAPANESE HISTORICAL LANGUAGES ===

  OLD_JAPANESE: {
    id: 'OLD_JAPANESE',
    name: 'Old Japanese',
    nativeName: '上代日本語',
    family: 'Japonic',
    script: ['Man\'yōgana', 'Chinese characters'],
    period: [300, 800],
    regions: ['Nara', 'Yamato', 'Ancient Japan'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    successors: ['CLASSICAL_JAPANESE'],
    description: 'Language of ancient Yamato court',
    llmPrompt: 'SOV word order. Eight vowel system (lost in modern Japanese). No Chinese loanwords yet. Native Japanese vocabulary only.',
    historicalContext: 'The earliest stage of Japanese recorded in the Kojiki and Man\'yōshū, before Chinese influence.',
  },

  AINU: {
    id: 'AINU',
    name: 'Ainu',
    nativeName: 'アイヌ・イタㇰ',
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: ['Katakana', 'Latin'],
    period: [-2000, 2025],
    regions: ['Hokkaido', 'Sakhalin', 'Kurils'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    description: 'Indigenous language of northern Japan',
    greetings: {
      hello: 'Irankarapte',
      goodbye: 'Suy unukar',
      yes: 'E',
      no: 'Somo',
      thanks: 'Iyairaikere',
    },
    llmPrompt: 'Polysynthetic language with complex verb morphology. Nature-based vocabulary: bears, salmon, forests. Spiritual relationship with kamuy (spirits).',
    historicalContext: 'The indigenous language of Japan\'s north, predates Japanese but now critically endangered.',
  },

  RYUKYUAN: {
    id: 'RYUKYUAN',
    name: 'Ryukyuan Languages',
    nativeName: '琉球語',
    family: 'Japonic',
    script: ['Japanese scripts', 'Chinese characters'],
    period: [500, 2025],
    regions: ['Okinawa', 'Ryukyu Islands'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    description: 'Languages of the Ryukyu Kingdom',
    greetings: {
      hello: 'Haisai',
      goodbye: 'Mata yaasai',
      yes: 'Uu',
      no: 'Aibiran',
      thanks: 'Nifeedeebiru',
    },
    llmPrompt: 'Sister language to Japanese but not mutually intelligible. Preserves ancient features. Maritime vocabulary.',
    historicalContext: 'The languages of the independent Ryukyu Kingdom (1429-1879), showing what Japanese might have become without Chinese influence.',
  },

  // === MINORITY REGIONAL LANGUAGES ===

  YI: {
    id: 'YI',
    name: 'Yi (Nuosu)',
    nativeName: 'ꆈꌠꉙ',
    family: LANGUAGE_FAMILIES.SINO_TIBETAN,
    script: 'Yi syllabary',
    period: [500, 2025],
    regions: ['Yunnan', 'Sichuan', 'Guizhou'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    description: 'Language of Yi people in Southwest China',
    greetings: {
      hello: 'Os se la',
      goodbye: 'Mu ga',
      yes: 'Nge',
      no: 'A nge',
      thanks: 'Ka sha mu ga',
    },
    llmPrompt: 'SOV word order. Complex tone system. Clan-based social vocabulary. Mountain agricultural terms. Animistic religious concepts.',
    historicalContext: 'The Yi people maintained independent kingdoms in mountainous Southwest China for centuries.',
  },

  BAI: {
    id: 'BAI',
    name: 'Bai',
    nativeName: '白语',
    family: LANGUAGE_FAMILIES.SINO_TIBETAN,
    script: ['Chinese characters', 'Latin'],
    period: [500, 2025],
    regions: ['Dali', 'Yunnan'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    description: 'Language of Bai people in Yunnan',
    greetings: {
      hello: 'Gou zeix',
      goodbye: 'Zai jian',
      yes: 'Ngv',
      no: 'Mv',
      thanks: 'Xie xie',
    },
    llmPrompt: 'Heavy Chinese influence but retains Tibeto-Burman substrate. Three tones. Buddhist and indigenous religious mixture.',
    historicalContext: 'The Bai kingdom of Dali (937-1253) was a cultural bridge between Chinese and Tibetan civilizations.',
  },

  TOCHARIAN: {
    id: 'TOCHARIAN',
    name: 'Tocharian',
    nativeName: 'Toxri',
    family: LANGUAGE_FAMILIES.INDO_EUROPEAN,
    script: ['Brahmi script', 'Manichaean script'],
    period: [-500, 800],
    regions: ['Tarim Basin', 'Silk Road', 'Xinjiang'],
    culturalZones: ['EAST_ASIAN' as CulturalZone],
    predecessors: ['PROTO_INDO_EUROPEAN'],
    description: 'Extinct Indo-European language of Chinese Turkestan',
    isReconstructed: true,
    llmPrompt: 'Most eastern Indo-European language. Buddhist monastery vocabulary. Silk Road trade terms.',
    historicalContext: 'Spoken by European-looking mummies of the Tarim Basin, proving Indo-European languages reached China before the Silk Road.',
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
    historicalContext: 'The language of Hafez and Rumi, Persian served as the cultural lingua franca from Istanbul to Delhi, profoundly influencing Turkish, Urdu, and other languages.',
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
    historicalContext: 'The sophisticated court language of the Mughal Empire, Urdu blended Hindi grammar with Persian vocabulary to create a new language of poetry and administration.',
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
    historicalContext: 'The bureaucratic language of imperial China\'s civil service, Early Mandarin unified administration across the vast Chinese empire and influenced all East Asian languages.',
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
  MALAGASY: {
    id: 'MALAGASY',
    name: 'Malagasy',
    nativeName: 'Malagasy',
    family: LANGUAGE_FAMILIES.AUSTRONESIAN,
    script: 'Latin',
    period: [500, 2025],
    regions: ['Madagascar'],
    culturalZones: ['SUB_SAHARAN_AFRICAN' as CulturalZone, 'OCEANIA' as CulturalZone],
    description: 'Austronesian language brought to Madagascar from Southeast Asia',
    greetings: {
      hello: 'Salama',
      goodbye: 'Veloma',
      yes: 'Eny',
      no: 'Tsia',
      thanks: 'Misaotra',
    },
    llmPrompt: 'Emulate Malagasy, an Austronesian language spoken in Madagascar. Use VOS word order (Verb-Object-Subject). The vocabulary should blend Austronesian roots with some Bantu and Arabic loanwords. Tone should be polite and formal.',
    historicalContext: 'Brought by Austronesian settlers from Borneo around 500 CE, Malagasy is the westernmost Austronesian language and uniquely blends Southeast Asian and African influences.',
  },

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
    historicalContext: 'A Bantu language enriched with Arabic through Indian Ocean trade, Swahili became the lingua franca of East and Central Africa from medieval times to today.',
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
    historicalContext: 'The maritime trade language of Southeast Asia (600-1500 CE), Old Malay spread from Borneo to the Philippines and evolved into modern Malay and Indonesian.',
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

  // Additional Caribbean Creoles and Pidgins
  JAMAICAN_PATOIS: {
    id: 'JAMAICAN_PATOIS',
    name: 'Jamaican Patois',
    nativeName: 'Patwa',
    family: LANGUAGE_FAMILIES.PIDGIN,
    script: 'Latin',
    period: [1700, 2025],
    regions: ['Jamaica'],
    culturalZones: ['NORTH_AMERICAN_COLONIAL' as CulturalZone],
    description: 'English-based creole with West African influences',
    greetings: {
      hello: 'Wah gwaan',
      goodbye: 'Likkle more',
      yes: 'Yeah mon',
      no: 'No sah',
      thanks: 'Respek',
    },
    llmPrompt: 'Emulate Jamaican Patois. English-based vocabulary with West African grammatical influences. Use characteristic sound changes (th→d, dropping h). Employ characteristic particles like "fi" (to), "deh" (there), "a" (is/am/are).',
    historicalContext: 'Born from the interaction of English colonizers and enslaved West Africans, Patois became Jamaica\'s vibrant national language.',
  },

  BAJAN_CREOLE: {
    id: 'BAJAN_CREOLE',
    name: 'Bajan Creole',
    nativeName: 'Bajan',
    family: LANGUAGE_FAMILIES.PIDGIN,
    script: 'Latin',
    period: [1700, 2025],
    regions: ['Barbados'],
    culturalZones: ['NORTH_AMERICAN_COLONIAL' as CulturalZone],
    description: 'English-based creole of Barbados',
    llmPrompt: 'Emulate Bajan Creole. Similar to standard English but with distinctive pronunciation and some African-influenced grammar.',
  },

  ANTILLEAN_CREOLE: {
    id: 'ANTILLEAN_CREOLE',
    name: 'Antillean Creole',
    nativeName: 'Kwéyòl',
    family: LANGUAGE_FAMILIES.PIDGIN,
    script: 'Latin',
    period: [1700, 2025],
    regions: ['Martinique', 'Guadeloupe', 'Dominica', 'St. Lucia'],
    culturalZones: ['NORTH_AMERICAN_COLONIAL' as CulturalZone],
    description: 'French-based creole of the Lesser Antilles',
    llmPrompt: 'Emulate Antillean Creole. French-based vocabulary with West African grammatical structures. Simpler verb system than French.',
  },

  PAPIAMENTO: {
    id: 'PAPIAMENTO',
    name: 'Papiamento',
    nativeName: 'Papiamentu',
    family: LANGUAGE_FAMILIES.PIDGIN,
    script: 'Latin',
    period: [1700, 2025],
    regions: ['Aruba', 'Curaçao', 'Bonaire'],
    culturalZones: ['SOUTH_AMERICAN' as CulturalZone],
    description: 'Creole with Portuguese, Spanish, Dutch, and African elements',
    llmPrompt: 'Emulate Papiamento. Blend Portuguese/Spanish base with Dutch and African influences. Use simple verb conjugations.',
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
    historicalContext: 'Originally written in Chinese characters, Vietnamese adopted a Latin alphabet in the 17th century and shows heavy Chinese influence from millennia of contact.',
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
    historicalContext: 'Descended from the Tai languages that migrated south from China, Thai became the court language of Siam and absorbed Sanskrit vocabulary through Buddhism.',
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

  PROTO_TUPI: {
    id: 'PROTO_TUPI',
    name: 'Proto-Tupi',
    nativeName: '*Proto-Tupi',
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: ['Reconstructed'],
    period: [-2000, 1000],
    regions: ['Amazon Basin', 'Atlantic Coast Brazil', 'São Paulo Plateau'],
    culturalZones: ['SOUTH_AMERICAN' as CulturalZone],
    isReconstructed: true,
    successors: ['TUPI', 'GUARANI'],
    description: 'Reconstructed ancestor of Tupi-Guarani languages, spoken by indigenous peoples across much of eastern South America.',
    llmPrompt: 'Use polysynthetic word formation with extensive prefixation and agglutination. Focus on animacy distinctions and inclusive/exclusive pronouns. Include terms for tropical ecology, agriculture, and river navigation. Use simple ceremonial and kinship vocabulary.',
    historicalContext: 'Proto-Tupi was likely spoken around 3000 years ago by indigenous peoples who expanded from the Amazon throughout eastern South America, giving rise to the Tupi-Guarani language family with over 70 languages.',
  },

  TUPI: {
    id: 'TUPI',
    name: 'Tupi',
    nativeName: 'Tupinambá',
    family: LANGUAGE_FAMILIES.ISOLATE,
    script: 'Latin',
    period: [-1000, 1700],
    regions: ['Atlantic Coast Brazil', 'São Paulo Plateau', 'Amazon Basin'],
    culturalZones: ['SOUTH_AMERICAN' as CulturalZone],
    predecessors: ['PROTO_TUPI'],
    greetings: {
      hello: 'Ereiupé',
      goodbye: 'Oré robasépe',
      yes: 'Etá',
      no: 'Aáni',
      thanks: 'Aguîyé',
    },
    llmPrompt: 'Emulate historical Tupi (Tupinambá). Polysynthetic with complex verbal morphology. Strong animacy distinctions. Use indigenous terms for tropical flora/fauna. Include ceremonial and shamanic vocabulary. Avoid European loanwords for pre-contact contexts.',
    historicalContext: 'Tupi (Tupinambá) was the main indigenous language of coastal Brazil when Europeans arrived. It served as a lingua franca and was documented by Jesuit missionaries, becoming the basis for the colonial Língua Geral.',
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
    predecessors: ['PROTO_TUPI'],
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
  // Iberian Peninsula (general regions)
  {
    patterns: ['iberia', 'ebro valley', 'toledo plateau', 'andalusian plain', 'lisbon coast', 'strait of gibraltar'],
    languages: [
      // 1059 is medieval period - blend of Arabic and Romance languages
      { id: 'CLASSICAL_ARABIC', period: [711, 1492], weight: 40 },  // Al-Andalus influence
      { id: 'LATIN', period: [0, 1200], weight: 30 },  // Church and educated class
      { id: 'FRENCH_MEDIEVAL', period: [900, 1300], weight: 20 },  // Occitan/Provencal influence in north
      { id: 'BASQUE', period: [-2000, 2025], weight: 5 },  // Basque substrate
      { id: 'EARLY_SPANISH', period: [1500, 2025], weight: 60 },  // Later period
      { id: 'EARLY_PORTUGUESE', period: [1500, 2025], weight: 20 },  // Portuguese areas
    ],
    namePatterns: [
      { pattern: /Ibn |Abu |Al-/i, language: 'CLASSICAL_ARABIC', weight: 80 },
      { pattern: /Fernandez|Rodriguez|Gonzalez|Sanchez/i, language: 'EARLY_SPANISH', weight: 75 },
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

  // === SOUTHEAST ASIA ===
  // Maritime Southeast Asia - Indonesia/Malaysia
  {
    patterns: ['borneo', 'sumatra', 'java', 'sulawesi', 'spice islands', 'makassar', 'malacca', 'strait of malacca', 'sunda strait', 'banda sea', 'celebes', 'maritime southeast'],
    languages: [
      { id: 'OLD_MALAY', period: [600, 1500], weight: 70 },
      { id: 'OLD_JAVANESE', period: [800, 1500], weight: 20 },
      { id: 'CLASSICAL_ARABIC', period: [1200, 2025], weight: 10 }, // Islamic influence
    ],
    namePatterns: [
      { pattern: /Abdul|Ahmad|Ali|Hassan|Hussein|Ibrahim|Muhammad|Omar|Siti|Fatima/i, language: 'CLASSICAL_ARABIC', weight: 85 },
      { pattern: /Agung|Budi|Dewi|Kusuma|Putri|Rama|Sri|Wijaya/i, language: 'OLD_JAVANESE', weight: 80 },
    ],
  },
  // Philippines
  {
    patterns: ['philippines', 'luzon', 'visayan', 'mindanao', 'palawan', 'sulu', 'philippine sea'],
    languages: [
      { id: 'TAGALOG', period: [900, 2025], weight: 60 },
      { id: 'OLD_MALAY', period: [900, 1500], weight: 20 },
      { id: 'EARLY_SPANISH', period: [1521, 2025], weight: 30 },
      { id: 'CLASSICAL_ARABIC', period: [1300, 2025], weight: 10 }, // Mindanao/Sulu
    ],
    namePatterns: [
      { pattern: /dela Cruz|Santos|Garcia|Reyes|Mendoza/i, language: 'EARLY_SPANISH', weight: 85 },
      { pattern: /Datu|Rajah|Lakandula|Lapu|Magat/i, language: 'TAGALOG', weight: 80 },
    ],
  },
  // Mainland Southeast Asia - Thailand/Burma/Cambodia/Laos
  {
    patterns: ['irrawaddy', 'mekong', 'red river', 'chao phraya', 'tonle sap', 'shan', 'annam', 'tenasserim', 'mainland southeast'],
    languages: [
      { id: 'THAI', period: [1200, 2025], weight: 50 },
      { id: 'SANSKRIT', period: [500, 1500], weight: 20 }, // Buddhist texts
      { id: 'CHAM', period: [200, 2025], weight: 30 },
    ],
    namePatterns: [
      { pattern: /Thaksin|Chakri|Narai|Rama|Mongkut/i, language: 'THAI', weight: 80 },
      { pattern: /Po|Aia|Jaya|Inra/i, language: 'CHAM', weight: 80 },
    ],
  },
  // Vietnam
  {
    patterns: ['vietnam', 'annam', 'tonkin', 'cochin', 'saigon', 'hanoi', 'hue', 'red river delta'],
    languages: [
      { id: 'VIETNAMESE', period: [1000, 2025], weight: 70 },
      { id: 'CLASSICAL_CHINESE', period: [-200, 1900], weight: 20 }, // Administrative language
      { id: 'CHAM', period: [200, 2025], weight: 10 },
    ],
    namePatterns: [
      { pattern: /Nguyen|Tran|Le|Pham|Hoang|Phan|Vu|Vo/i, language: 'VIETNAMESE', weight: 90 },
    ],
  },
  // Malay Peninsula/Singapore
  {
    patterns: ['malay peninsula', 'singapore', 'johor', 'kelantan', 'terengganu', 'pahang'],
    languages: [
      { id: 'OLD_MALAY', period: [600, 1500], weight: 60 },
      { id: 'CLASSICAL_MALAY', period: [1500, 2025], weight: 70 },
      { id: 'CLASSICAL_ARABIC', period: [1300, 2025], weight: 10 },
      { id: 'TAMIL', period: [1000, 2025], weight: 10 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1819, 2025], weight: 20 }, // Colonial
    ],
    namePatterns: [
      { pattern: /bin|binti|Raja|Sultan|Iskandar|Mahmud/i, language: 'OLD_MALAY', weight: 85 },
    ],
  },
  // Indochina Interior (additional coverage)
  {
    patterns: ['indochina', 'annamite', 'shan plateau', 'laos', 'cambodia'],
    languages: [
      { id: 'SANSKRIT', period: [600, 1500], weight: 60 },
      { id: 'CHAM', period: [200, 2025], weight: 40 },
    ],
  },
  // Taiwan
  {
    patterns: ['taiwan', 'formosa', 'taipei', 'ryukyu'],
    languages: [
      { id: 'CLASSICAL_CHINESE', period: [1600, 1895], weight: 60 },
      { id: 'CLASSICAL_JAPANESE', period: [1895, 1945], weight: 20 },
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
  // Caribbean - Haiti
  {
    patterns: ['haiti', 'saint-domingue', 'port-au-prince', 'cap-haitien', 'hispaniola'],
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
  // Central Africa and Great Lakes
  {
    patterns: ['central africa', 'lake tanganyika', 'congo', 'kinshasa', 'bangui', 'rwanda', 'burundi', 'katanga', 'ubangi'],
    languages: [
      { id: 'SWAHILI_CLASSICAL', period: [1000, 2025], weight: 60 },
      { id: 'LINGALA', period: [1500, 2025], weight: 30 },
      { id: 'KIKONGO', period: [1000, 2025], weight: 10 },
    ],
    namePatterns: [
      { pattern: /Mwana|Binti|Juma|Fatuma|Hamisi/i, language: 'SWAHILI_CLASSICAL', weight: 80 },
    ],
  },
  // Madagascar
  {
    patterns: ['madagascar', 'antananarivo', 'toamasina', 'fianarantsoa', 'mahajanga', 'toliara', 'lemur', 'baobab', 'highlands of madagascar'],
    languages: [
      { id: 'MALAGASY', period: [500, 2025], weight: 85 },
      { id: 'FRENCH', period: [1895, 2025], weight: 10 },
      { id: 'SWAHILI_CLASSICAL', period: [1000, 2025], weight: 5 },
    ],
  },

  // East Africa
  {
    patterns: ['east africa', 'serengeti', 'kilimanjaro', 'victoria', 'kenya', 'tanzania', 'uganda', 'swahili coast'],
    languages: [
      { id: 'SWAHILI_CLASSICAL', period: [1000, 2025], weight: 70 },
      { id: 'CLASSICAL_ARABIC', period: [1200, 2025], weight: 20 },
      { id: 'AMHARIC', period: [1000, 2025], weight: 10 },
    ],
  },
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

  // === ADDITIONAL CARIBBEAN ===
  // Jamaica
  {
    patterns: ['jamaica', 'kingston', 'montego bay', 'port royal', 'spanish town'],
    languages: [
      { id: 'JAMAICAN_PATOIS', period: [1700, 2025], weight: 70 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1655, 2025], weight: 25 },
      { id: 'EARLY_SPANISH', period: [1494, 1655], weight: 5 },
    ],
    namePatterns: [
      { pattern: /Campbell|Brown|Williams|Johnson|Bailey|Clarke/i, language: 'JAMAICAN_PATOIS', weight: 85 },
    ],
  },
  // Cuba
  {
    patterns: ['cuba', 'havana', 'santiago de cuba', 'cienfuegos', 'camaguey', 'matanzas'],
    languages: [
      { id: 'EARLY_SPANISH', period: [1511, 2025], weight: 90 },
      { id: 'YORUBA', period: [1600, 1900], weight: 5 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1898, 1902], weight: 5 },
    ],
    namePatterns: [
      { pattern: /Garcia|Rodriguez|Martinez|Hernandez|Gonzalez/i, language: 'EARLY_SPANISH', weight: 95 },
    ],
  },
  // Barbados & Eastern Caribbean
  {
    patterns: ['barbados', 'bridgetown', 'trinidad', 'tobago', 'grenada', 'st lucia', 'st vincent', 'antigua', 'dominica'],
    languages: [
      { id: 'EARLY_MODERN_ENGLISH', period: [1627, 2025], weight: 60 },
      { id: 'BAJAN_CREOLE', period: [1700, 2025], weight: 30 },
      { id: 'OLD_FRENCH', period: [1635, 1800], weight: 10 },
    ],
  },
  // French Caribbean
  {
    patterns: ['martinique', 'guadeloupe', 'saint martin', 'saint barthelemy', 'fort-de-france', 'basse-terre'],
    languages: [
      { id: 'OLD_FRENCH', period: [1635, 2025], weight: 60 },
      { id: 'ANTILLEAN_CREOLE', period: [1700, 2025], weight: 40 },
    ],
  },
  // Dutch Caribbean
  {
    patterns: ['curacao', 'aruba', 'bonaire', 'sint maarten', 'willemstad', 'oranjestad'],
    languages: [
      { id: 'DUTCH', period: [1634, 2025], weight: 40 },
      { id: 'PAPIAMENTO', period: [1700, 2025], weight: 40 },
      { id: 'EARLY_SPANISH', period: [1500, 1634], weight: 10 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1800, 2025], weight: 10 },
    ],
  },

  // === GEOGRAPHY.TS EXACT AREA NAMES ===
  // Caribbean from geography.ts
  {
    patterns: ['Greater Antilles'],
    languages: [
      { id: 'SPANISH', period: [1500, 2025], weight: 80 },
      { id: 'TAINO', period: [-2000, 1600], weight: 20 },
    ],
  },
  {
    patterns: ['Lesser Antilles'],
    languages: [
      { id: 'ANTILLEAN_CREOLE', period: [1700, 2025], weight: 60 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1600, 2025], weight: 20 },
      { id: 'OLD_FRENCH', period: [1600, 2025], weight: 20 },
    ],
  },
  // Pacific from geography.ts
  {
    patterns: ['Samoa Archipelago'],
    languages: [
      { id: 'SAMOAN', period: [-1000, 2025], weight: 95 },
      { id: 'PROTO_POLYNESIAN', period: [-2000, -1000], weight: 5 },
    ],
  },
  {
    patterns: ['Society Islands'],
    languages: [
      { id: 'TAHITIAN', period: [-500, 2025], weight: 95 },
      { id: 'PROTO_POLYNESIAN', period: [-2000, -500], weight: 5 },
    ],
  },
  {
    patterns: ['Tonga Ridge'],
    languages: [
      { id: 'TONGAN', period: [-1000, 2025], weight: 95 },
      { id: 'PROTO_POLYNESIAN', period: [-2000, -1000], weight: 5 },
    ],
  },
  // === PROPERLY MAPPED TO EAST ASIA FROM GEOGRAPHY.TS ===

  // Siberia region (exact case-insensitive names from geography.ts)
  {
    patterns: ['western siberia', 'central siberia'],
    languages: [
      { id: 'EVENKI', period: [-1000, 2025], weight: 60 },
      { id: 'PROTO_TURKIC', period: [-2000, 1000], weight: 20 },
      { id: 'RUSSIAN', period: [1500, 2025], weight: 20 },
    ],
    namePatterns: [
      { pattern: /Tungus|Evenk|Solon/i, language: 'EVENKI', weight: 90 },
    ],
  },
  {
    patterns: ['eastern siberia', 'arctic siberia', 'kamchatka peninsula', 'sakhalin island'],
    languages: [
      { id: 'YAKUT', period: [1000, 2025], weight: 70 },
      { id: 'EVENKI', period: [-1000, 2025], weight: 20 },
      { id: 'RUSSIAN', period: [1700, 2025], weight: 10 },
    ],
    namePatterns: [
      { pattern: /Sakha|Yakut/i, language: 'YAKUT', weight: 90 },
    ],
  },
  {
    patterns: ['Greenland Coast'],
    languages: [
      { id: 'GREENLANDIC', period: [-2000, 2025], weight: 90 },
      { id: 'OLD_NORSE', period: [985, 1500], weight: 10 },
    ],
  },
  // Kazakh Steppes region from geography.ts
  {
    patterns: ['kazakh steppes', 'altai mountains', 'aral sea basin', 'tian shan range', 'dzungarian basin'],
    languages: [
      { id: 'KAZAKH', period: [1000, 2025], weight: 60 },
      { id: 'PROTO_TURKIC', period: [-1000, 1000], weight: 25 },
      { id: 'MIDDLE_MONGOLIAN', period: [1200, 1700], weight: 10 },
      { id: 'RUSSIAN', period: [1730, 2025], weight: 5 },
    ],
    namePatterns: [
      { pattern: /bek$|bay$|khan$/i, language: 'KAZAKH', weight: 85 },
    ],
  },
  {
    patterns: ['khorasan', 'transoxiana'],
    languages: [
      { id: 'SOGDIAN', period: [-500, 1000], weight: 35 },
      { id: 'CLASSICAL_PERSIAN', period: [700, 1500], weight: 35 },
      { id: 'UZBEK', period: [1000, 2025], weight: 30 },
    ],
  },

  // Central Asian Oases region from geography.ts
  {
    patterns: ['kyzylkum desert', 'ferghana valley', 'samarkand region', 'balkh plains', 'pamir mountains', 'hindu kush'],
    languages: [
      { id: 'SOGDIAN', period: [-500, 1000], weight: 40 },
      { id: 'CLASSICAL_PERSIAN', period: [500, 1500], weight: 30 },
      { id: 'UZBEK', period: [1000, 2025], weight: 30 },
    ],
    namePatterns: [
      { pattern: /Timur|Babur|Ulugh/i, language: 'UZBEK', weight: 90 },
    ],
  },

  // Xinjiang region from geography.ts
  {
    patterns: ['tarim basin', 'kunlun mountains', 'qaidam basin'],
    languages: [
      { id: 'TOCHARIAN', period: [-500, 800], weight: 25 }, // Ancient Indo-European presence
      { id: 'SOGDIAN', period: [200, 1000], weight: 30 },
      { id: 'OLD_UYGHUR', period: [700, 1500], weight: 35 },
      { id: 'TIBETAN', period: [600, 900], weight: 10 }, // Tibetan Empire control
      { id: 'CLASSICAL_CHINESE', period: [-200, 1900], weight: 15 }, // Han dynasty onwards
      { id: 'MONGOLIAN', period: [1200, 1400], weight: 5 }, // Mongol period
    ],
    namePatterns: [
      { pattern: /Kuchean|Agnean/i, language: 'TOCHARIAN', weight: 85 },
    ],
  },

  // Mongolia and Manchuria region from geography.ts
  {
    patterns: ['mongolian steppes', 'gobi desert'],
    languages: [
      { id: 'PROTO_MONGOLIC', period: [-500, 1200], weight: 40 },
      { id: 'MIDDLE_MONGOLIAN', period: [1200, 1700], weight: 50 },
      { id: 'KHALKHA_MONGOLIAN', period: [1700, 2025], weight: 10 },
    ],
    namePatterns: [
      { pattern: /Temujin|Borjigin|Kublai/i, language: 'MIDDLE_MONGOLIAN', weight: 95 },
    ],
  },
  {
    patterns: ['manchurian plain'],
    languages: [
      { id: 'MANCHU', period: [1200, 1900], weight: 40 },
      { id: 'CLASSICAL_CHINESE', period: [200, 1900], weight: 30 },
      { id: 'KHITAN', period: [900, 1200], weight: 20 },
      { id: 'EVENKI', period: [-1000, 2025], weight: 10 },
    ],
  },
  // Sahara from geography.ts
  {
    patterns: ['Central Sahara'],
    languages: [
      { id: 'TUAREG', period: [-1000, 2025], weight: 70 },
      { id: 'CLASSICAL_ARABIC', period: [700, 2025], weight: 30 },
    ],
  },
  // Amazon from geography.ts
  {
    patterns: ['Amazon Delta', 'Amazon Basin'],
    languages: [
      { id: 'PROTO_ARAWAKAN', period: [-2000, 1500], weight: 50 },
      { id: 'PROTO_TUPI', period: [-2000, 1500], weight: 40 },
      { id: 'PORTUGUESE', period: [1500, 2025], weight: 10 },
    ],
  },

  // === ADDITIONAL PACIFIC ISLANDS ===
  // Fiji
  {
    patterns: ['fiji', 'viti levu', 'vanua levu', 'suva', 'nadi', 'lautoka'],
    languages: [
      { id: 'PROTO_POLYNESIAN', period: [-1500, 1800], weight: 70 },
      { id: 'FIJIAN', period: [1800, 2025], weight: 20 },
      { id: 'HINDI', period: [1879, 2025], weight: 5 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1874, 2025], weight: 5 },
    ],
  },
  // Samoa
  {
    patterns: ['samoa', 'savaii', 'upolu', 'apia', 'american samoa', 'pago pago', 'tutuila'],
    languages: [
      { id: 'PROTO_POLYNESIAN', period: [-1000, 1800], weight: 80 },
      { id: 'SAMOAN', period: [1800, 2025], weight: 15 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1850, 2025], weight: 5 },
    ],
  },
  // Tahiti & French Polynesia
  {
    patterns: ['tahiti', 'french polynesia', 'papeete', 'bora bora', 'moorea', 'marquesas', 'society islands'],
    languages: [
      { id: 'PROTO_POLYNESIAN', period: [-1000, 1800], weight: 70 },
      { id: 'TAHITIAN', period: [1800, 2025], weight: 20 },
      { id: 'OLD_FRENCH', period: [1842, 2025], weight: 10 },
    ],
  },
  // Tonga
  {
    patterns: ['tonga', 'tongatapu', 'nukualofa', 'vavau', 'haapai', 'eua'],
    languages: [
      { id: 'PROTO_POLYNESIAN', period: [-1000, 1800], weight: 85 },
      { id: 'TONGAN', period: [1800, 2025], weight: 10 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1900, 2025], weight: 5 },
    ],
  },
  // Solomon Islands & Melanesia
  {
    patterns: ['solomon islands', 'guadalcanal', 'malaita', 'honiara', 'vanuatu', 'port vila', 'new caledonia', 'noumea'],
    languages: [
      { id: 'PROTO_AUSTRONESIAN', period: [-3000, 1800], weight: 70 },
      { id: 'MELANESIAN_PIDGIN', period: [1800, 2025], weight: 20 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1850, 2025], weight: 5 },
      { id: 'OLD_FRENCH', period: [1850, 2025], weight: 5 },
    ],
  },
  // Micronesia
  {
    patterns: ['micronesia', 'guam', 'palau', 'marshall islands', 'kiribati', 'nauru', 'majuro', 'koror'],
    languages: [
      { id: 'PROTO_AUSTRONESIAN', period: [-3000, 1800], weight: 70 },
      { id: 'CHAMORRO', period: [1800, 2025], weight: 10 },
      { id: 'EARLY_SPANISH', period: [1565, 1898], weight: 10 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1898, 2025], weight: 5 },
      { id: 'JAPANESE', period: [1914, 1945], weight: 5 },
    ],
  },

  // === NORTHERN REGIONS ===
  // Siberia
  {
    patterns: ['siberia', 'yakutsk', 'irkutsk', 'novosibirsk', 'omsk', 'tomsk', 'krasnoyarsk', 'baikal', 'lena river', 'yenisei'],
    languages: [
      { id: 'PROTO_TURKIC', period: [-500, 1500], weight: 25 },
      { id: 'MIDDLE_MONGOLIAN', period: [1200, 1700], weight: 15 },
      { id: 'EVENKI', period: [-2000, 2025], weight: 20 },
      { id: 'YAKUT', period: [1000, 2025], weight: 20 },
      { id: 'RUSSIAN', period: [1580, 2025], weight: 20 },
    ],
  },
  // Arctic (non-Canadian)
  {
    patterns: ['arctic ocean', 'greenland', 'svalbard', 'north pole', 'barents sea', 'nuuk', 'ilulissat'],
    languages: [
      { id: 'INUKTITUT', period: [-2000, 2025], weight: 50 },
      { id: 'GREENLANDIC', period: [1000, 2025], weight: 20 },
      { id: 'OLD_NORSE', period: [985, 1500], weight: 15 },
      { id: 'DANISH', period: [1721, 2025], weight: 15 },
    ],
  },

  // === DESERT REGIONS ===
  // Sahara Interior
  {
    patterns: ['sahara', 'timbuktu', 'gao', 'agadez', 'tamanrasset', 'hoggar', 'tibesti', 'air mountains', 'tenere'],
    languages: [
      { id: 'CLASSICAL_ARABIC', period: [700, 2025], weight: 30 },
      { id: 'PROTO_BERBER', period: [-2000, 700], weight: 30 },
      { id: 'TUAREG', period: [700, 2025], weight: 25 },
      { id: 'HAUSA', period: [1000, 2025], weight: 10 },
      { id: 'SONGHAY', period: [800, 2025], weight: 5 },
    ],
  },
  // Arabian Desert
  {
    patterns: ['arabian desert', 'rub al khali', 'empty quarter', 'najd', 'bedouin'],
    languages: [
      { id: 'CLASSICAL_ARABIC', period: [500, 2025], weight: 90 },
      { id: 'OLD_ARABIC', period: [-500, 500], weight: 10 },
    ],
  },

  // === SOUTH AMERICA - DETAILED REGIONAL MAPPINGS ===

  // Atlantic Coast Brazil (Portuguese-speaking)
  {
    patterns: ['rio de janeiro', 'rio de janeiro bay', 'são paulo', 'são paulo plateau', 'bahia', 'bahia coast', 'salvador', 'pernambuco', 'recife', 'recôncavo', 'espírito santo', 'minas gerais', 'santos', 'vitória'],
    languages: [
      { id: 'PROTO_TUPI', period: [-2000, 1000], weight: 70 },
      { id: 'TUPI', period: [-1000, 1600], weight: 80 },
      { id: 'EARLY_PORTUGUESE', period: [1500, 1700], weight: 80 },
      { id: 'MODERN_PORTUGUESE', period: [1700, 2050], weight: 95 },
      { id: 'YORUBA', period: [1550, 2050], weight: 5 }, // African influence from slave trade
    ],
  },

  // Amazon Basin (Mixed Portuguese/Spanish with strong indigenous)
  {
    patterns: ['amazon', 'amazonas', 'manaus', 'amazon delta', 'amazon basin', 'manaus region', 'rio negro', 'xingu', 'tapajós', 'acre', 'rondônia', 'mato grosso', 'amazon rainforest', 'varzea floodplains'],
    languages: [
      { id: 'TUPI', period: [-1000, 2050], weight: 35 },
      { id: 'GUARANI', period: [-1000, 2050], weight: 15 },
      { id: 'PROTO_ARAWAKAN', period: [-2000, 1500], weight: 15 },
      { id: 'EARLY_PORTUGUESE', period: [1540, 1700], weight: 25 },
      { id: 'MODERN_PORTUGUESE', period: [1700, 2050], weight: 30 },
      { id: 'EARLY_SPANISH', period: [1540, 1700], weight: 10 },
      { id: 'MODERN_SPANISH', period: [1700, 2050], weight: 10 },
    ],
  },

  // Andes North (Spanish-speaking with Quechua)
  {
    patterns: ['quito', 'quito plateau', 'cajamarca', 'chimborazo', 'cordillera blanca', 'chachapoyas', 'ecuador', 'colombia highlands'],
    languages: [
      { id: 'QUECHUA_ANCIENT', period: [-500, 1530], weight: 80 },
      { id: 'EARLY_SPANISH', period: [1530, 1700], weight: 50 },
      { id: 'MODERN_SPANISH', period: [1700, 2050], weight: 70 },
      { id: 'QUECHUA_ANCIENT', period: [1530, 2050], weight: 25 }, // Continued indigenous use
    ],
  },

  // Andes South & Altiplano (Spanish with strong indigenous)
  {
    patterns: ['cuzco', 'cusco', 'altiplano', 'lake titicaca', 'la paz', 'potosí', 'sucre', 'cochabamba', 'tarija', 'mendoza'],
    languages: [
      { id: 'QUECHUA_ANCIENT', period: [-500, 1530], weight: 70 },
      { id: 'AYMARA', period: [-500, 2050], weight: 30 },
      { id: 'EARLY_SPANISH', period: [1530, 1700], weight: 40 },
      { id: 'MODERN_SPANISH', period: [1700, 2050], weight: 60 },
    ],
  },

  // Southern Cone - Argentina/Uruguay (Spanish with Italian influence)
  {
    patterns: ['pampas', 'buenos aires', 'montevideo', 'córdoba', 'rosario', 'paraná delta', 'santa fe', 'uruguay river'],
    languages: [
      { id: 'GUARANI', period: [-1000, 1600], weight: 30 },
      { id: 'EARLY_SPANISH', period: [1530, 1700], weight: 60 },
      { id: 'MODERN_SPANISH', period: [1700, 2050], weight: 85 },
      { id: 'ITALIAN', period: [1850, 2050], weight: 10 }, // Immigration influence
    ],
  },

  // Chile & Mapuche Territory
  {
    patterns: ['mapuche', 'santiago', 'valparaíso', 'concepción', 'atacama', 'chile'],
    languages: [
      { id: 'MAPUDUNGUN', period: [-1000, 2050], weight: 25 },
      { id: 'EARLY_SPANISH', period: [1540, 1700], weight: 50 },
      { id: 'MODERN_SPANISH', period: [1700, 2050], weight: 75 },
    ],
  },

  // Gran Chaco (Mixed Spanish/Guaraní)
  {
    patterns: ['gran chaco', 'chaco', 'asunción', 'paraguay', 'formosa'],
    languages: [
      { id: 'GUARANI', period: [-1000, 2050], weight: 45 },
      { id: 'EARLY_SPANISH', period: [1530, 1700], weight: 35 },
      { id: 'MODERN_SPANISH', period: [1700, 2050], weight: 50 },
    ],
  },

  // Pantanal (Portuguese/Spanish border region)
  {
    patterns: ['pantanal', 'pantanal wetlands', 'campo grande', 'cuiabá'],
    languages: [
      { id: 'GUARANI', period: [-1000, 2050], weight: 20 },
      { id: 'EARLY_PORTUGUESE', period: [1540, 1700], weight: 35 },
      { id: 'MODERN_PORTUGUESE', period: [1700, 2050], weight: 45 },
      { id: 'EARLY_SPANISH', period: [1540, 1700], weight: 15 },
      { id: 'MODERN_SPANISH', period: [1700, 2050], weight: 20 },
    ],
  },

  // Guiana Shield (Mixed colonial languages)
  {
    patterns: ['guiana', 'guyana', 'suriname', 'french guiana', 'orinoco delta', 'essequibo', 'maroni', 'rupununi', 'kaieteur'],
    languages: [
      { id: 'PROTO_ARAWAKAN', period: [-2000, 1500], weight: 30 },
      { id: 'PROTO_CARIBAN', period: [-2000, 2050], weight: 25 },
      { id: 'DUTCH', period: [1600, 2050], weight: 20 },
      { id: 'EARLY_MODERN_ENGLISH', period: [1750, 2050], weight: 15 },
      { id: 'FRENCH', period: [1600, 2050], weight: 10 },
    ],
  },

  // Venezuela & Llanos (Spanish)
  {
    patterns: ['venezuela', 'caracas', 'maracaibo', 'valencia', 'llanos', 'apure', 'meta river', 'orinoco rapids', 'villavicencio'],
    languages: [
      { id: 'PROTO_CARIBAN', period: [-2000, 1500], weight: 20 },
      { id: 'EARLY_SPANISH', period: [1520, 1700], weight: 50 },
      { id: 'MODERN_SPANISH', period: [1700, 2050], weight: 80 },
    ],
  },

  // Patagonia (Spanish with Welsh pockets)
  {
    patterns: ['patagonia', 'tierra del fuego', 'valdés', 'magellanic', 'strait of magellan', 'ushuaia', 'bariloche'],
    languages: [
      { id: 'MAPUDUNGUN', period: [-1000, 1880], weight: 30 },
      { id: 'TEHUELCHE', period: [-1000, 1900], weight: 20 },
      { id: 'EARLY_SPANISH', period: [1520, 1700], weight: 30 },
      { id: 'MODERN_SPANISH', period: [1700, 2050], weight: 70 },
      { id: 'WELSH', period: [1865, 2050], weight: 5 }, // Welsh colony in Chubut
    ],
  },

  // === RAINFOREST REGIONS ===
  // Congo Basin
  {
    patterns: ['congo basin', 'congo rainforest', 'ituri', 'ubangi river', 'sangha'],
    languages: [
      { id: 'PROTO_BANTU', period: [-1000, 1500], weight: 40 },
      { id: 'LINGALA', period: [1500, 2025], weight: 25 },
      { id: 'KIKONGO', period: [1000, 2025], weight: 20 },
      { id: 'OLD_FRENCH', period: [1880, 2025], weight: 10 },
      { id: 'SWAHILI_CLASSICAL', period: [1800, 2025], weight: 5 },
    ],
  },

  // === CENTRAL ASIAN STEPPES ===
  // Kazakhstan & Northern Steppes
  {
    patterns: ['kazakhstan', 'astana', 'almaty', 'steppe', 'kazakh steppe', 'syr darya', 'aral sea'],
    languages: [
      { id: 'PROTO_TURKIC', period: [-500, 1000], weight: 30 },
      { id: 'KAZAKH', period: [1000, 2025], weight: 35 },
      { id: 'MIDDLE_MONGOLIAN', period: [1200, 1700], weight: 10 },
      { id: 'PERSIAN', period: [500, 1800], weight: 10 },
      { id: 'RUSSIAN', period: [1730, 2025], weight: 15 },
    ],
  },
  // Turkmenistan & Southern Steppes
  {
    patterns: ['turkmenistan', 'ashgabat', 'merv', 'mary', 'turkmenbashi', 'karakum desert'],
    languages: [
      { id: 'PROTO_TURKIC', period: [-500, 1000], weight: 25 },
      { id: 'TURKMEN', period: [1000, 2025], weight: 40 },
      { id: 'PERSIAN', period: [500, 2025], weight: 20 },
      { id: 'CLASSICAL_ARABIC', period: [700, 1800], weight: 10 },
      { id: 'RUSSIAN', period: [1880, 2025], weight: 5 },
    ],
  },
  // Uzbekistan & Transoxiana
  {
    patterns: ['uzbekistan', 'tashkent', 'samarkand', 'bukhara', 'khiva', 'ferghana', 'transoxiana', 'sogdiana'],
    languages: [
      { id: 'SOGDIAN', period: [-500, 1000], weight: 25 },
      { id: 'PERSIAN', period: [500, 2025], weight: 25 },
      { id: 'PROTO_TURKIC', period: [500, 1000], weight: 15 },
      { id: 'UZBEK', period: [1000, 2025], weight: 25 },
      { id: 'RUSSIAN', period: [1865, 2025], weight: 10 },
    ],
  },
  // Mongolia
  {
    patterns: ['mongolia', 'ulaanbaatar', 'karakorum', 'gobi desert', 'altai mountains', 'khalkha'],
    languages: [
      { id: 'PROTO_MONGOLIC', period: [-500, 1200], weight: 30 },
      { id: 'MIDDLE_MONGOLIAN', period: [1200, 1700], weight: 40 },
      { id: 'KHALKHA_MONGOLIAN', period: [1700, 2025], weight: 25 },
      { id: 'CLASSICAL_CHINESE', period: [1636, 1911], weight: 5 },
    ],
  },
  // Silk Road Cities
  {
    patterns: ['silk road', 'kashgar', 'khotan', 'dunhuang', 'turpan', 'balkh', 'ctesiphon'],
    languages: [
      { id: 'SOGDIAN', period: [-500, 1000], weight: 30 },
      { id: 'PERSIAN', period: [200, 2025], weight: 20 },
      { id: 'PROTO_TURKIC', period: [500, 1500], weight: 15 },
      { id: 'CLASSICAL_CHINESE', period: [-200, 1900], weight: 15 },
      { id: 'CLASSICAL_ARABIC', period: [700, 2025], weight: 10 },
      { id: 'SANSKRIT', period: [-500, 1000], weight: 10 },
    ],
  },

  // === COMPREHENSIVE MENA REGIONAL MAPPINGS ===

  // Mesopotamia - Cradle of Civilization
  {
    patterns: ['mesopotamia', 'tigris', 'euphrates', 'babylon region', 'nineveh plain', 'marsh arab', 'zagros foothills', 'diyala valley', 'tigris–euphrates'],
    languages: [
      { id: 'SUMERIAN', period: [-3500, -1750], weight: 95 },
      { id: 'AKKADIAN', period: [-2500, -100], weight: 90 },
      { id: 'ARAMAIC', period: [-1000, 700], weight: 70 },
      { id: 'MIDDLE_PERSIAN', period: [224, 651], weight: 30 },
      { id: 'CLASSICAL_ARABIC', period: [637, 2025], weight: 85 },
      { id: 'OTTOMAN_TURKISH', period: [1534, 1918], weight: 35 },
    ],
    namePatterns: [
      { pattern: /Hammurabi|Nebuchadnezzar|Sargon|Ashur|Tiglath|Sennacherib/i, language: 'AKKADIAN', weight: 95 },
      { pattern: /Gilgamesh|Lugal|Enki|Inanna|Enkidu|Urukagina/i, language: 'SUMERIAN', weight: 95 },
      { pattern: /Bar-|Ben-|Shimun|Yohannan|Mattai/i, language: 'ARAMAIC', weight: 85 },
      { pattern: /ibn |bin |al-|Abu |Abdul/i, language: 'CLASSICAL_ARABIC', weight: 90 },
    ],
  },

  // Levant - Cultural Crossroads
  {
    patterns: ['levant', 'jerusalem hills', 'bekaa valley', 'dead sea', 'golan', 'galilee', 'mount lebanon', 'jordan valley'],
    languages: [
      { id: 'ANCIENT_HEBREW', period: [-1000, 500], weight: 60 },
      { id: 'PHOENICIAN', period: [-1200, -300], weight: 50 },
      { id: 'ARAMAIC', period: [-800, 700], weight: 75 },
      { id: 'ANCIENT_GREEK', period: [-332, 637], weight: 35 },
      { id: 'BYZANTINE_GREEK', period: [330, 637], weight: 40 },
      { id: 'CLASSICAL_ARABIC', period: [637, 2025], weight: 80 },
      { id: 'OTTOMAN_TURKISH', period: [1516, 1918], weight: 30 },
    ],
    namePatterns: [
      { pattern: /Hiram|Ithobal|Ahab|Jezebel|Dido/i, language: 'PHOENICIAN', weight: 90 },
      { pattern: /David|Solomon|Saul|Samuel|Elijah|Isaiah/i, language: 'ANCIENT_HEBREW', weight: 95 },
      { pattern: /Yeshua|Shimeon|Yohanan|Miriam|Martha/i, language: 'ARAMAIC', weight: 85 },
      { pattern: /Saladin|Nureddin|Khalil|Hassan|Fatima/i, language: 'CLASSICAL_ARABIC', weight: 90 },
    ],
  },

  // Persian Plateau & Iranian Highlands
  {
    patterns: ['persian plateau', 'isfahan basin', 'zagros highlands', 'caspian foothills', 'shiraz valley', 'alborz', 'khuzestan', 'fars', 'elam'],
    languages: [
      { id: 'ELAMITE', period: [-3200, -539], weight: 85 },
      { id: 'OLD_PERSIAN', period: [-600, -330], weight: 90 },
      { id: 'MIDDLE_PERSIAN', period: [-330, 651], weight: 85 },
      { id: 'CLASSICAL_PERSIAN', period: [651, 1500], weight: 90 },
      { id: 'CLASSICAL_ARABIC', period: [651, 1200], weight: 25 },
    ],
    namePatterns: [
      { pattern: /Cyrus|Darius|Xerxes|Artaxerxes|Cambyses/i, language: 'OLD_PERSIAN', weight: 95 },
      { pattern: /Ardashir|Shapur|Khosrow|Bahram|Yazdegerd/i, language: 'MIDDLE_PERSIAN', weight: 90 },
      { pattern: /Ferdowsi|Hafez|Saadi|Omar|Rumi/i, language: 'CLASSICAL_PERSIAN', weight: 85 },
      { pattern: /Untash|Shutruk|Tepti|Huban/i, language: 'ELAMITE', weight: 90 },
    ],
  },

  // Anatolia - Bridge Between Continents
  {
    patterns: ['anatolia', 'cappadocian', 'pontic coast', 'cilician plain', 'tarsus', 'central plateau', 'bosporus', 'hattusa'],
    languages: [
      { id: 'HITTITE', period: [-1700, -1180], weight: 85 },
      { id: 'PHOENICIAN', period: [-1000, -300], weight: 25 },
      { id: 'ANCIENT_GREEK', period: [-800, 330], weight: 60 },
      { id: 'ARAMAIC', period: [-500, 500], weight: 40 },
      { id: 'BYZANTINE_GREEK', period: [330, 1453], weight: 70 },
      { id: 'OTTOMAN_TURKISH', period: [1299, 1922], weight: 85 },
      { id: 'CLASSICAL_ARABIC', period: [700, 1500], weight: 20 },
    ],
    namePatterns: [
      { pattern: /Muwatalli|Hattusili|Suppiluliuma|Tudhaliya/i, language: 'HITTITE', weight: 95 },
      { pattern: /Constantine|Justinian|Theodora|Basil|Alexios/i, language: 'BYZANTINE_GREEK', weight: 90 },
      { pattern: /Mehmet|Suleiman|Selim|Osman|Bayezid/i, language: 'OTTOMAN_TURKISH', weight: 95 },
    ],
  },

  // Nile Valley - Gift of the River
  {
    patterns: ['nile valley', 'thebes valley', 'nile delta', 'aswan', 'faiyum oasis', 'alexandria coast', 'upper egypt', 'lower egypt'],
    languages: [
      { id: 'ANCIENT_EGYPTIAN', period: [-3100, -700], weight: 95 },
      { id: 'DEMOTIC', period: [-700, 400], weight: 80 },
      { id: 'COPTIC', period: [100, 1700], weight: 70 },
      { id: 'ANCIENT_GREEK', period: [-332, 641], weight: 40 },
      { id: 'BYZANTINE_GREEK', period: [330, 641], weight: 35 },
      { id: 'CLASSICAL_ARABIC', period: [641, 2025], weight: 85 },
    ],
    namePatterns: [
      { pattern: /Ramesses|Amenhotep|Thutmose|Hatshepsut|Nefertiti|Akhenaten/i, language: 'ANCIENT_EGYPTIAN', weight: 95 },
      { pattern: /Ptolemy|Cleopatra|Arsinoe|Berenice/i, language: 'ANCIENT_GREEK', weight: 90 },
      { pattern: /Shenoute|Pachomius|Athanasius|Kyrillos/i, language: 'COPTIC', weight: 85 },
      { pattern: /Amr|Saladin|Muhammad Ali|Ahmad|Fatimah/i, language: 'CLASSICAL_ARABIC', weight: 90 },
    ],
  },

  // Arabian Peninsula - Desert and Oases
  {
    patterns: ['arabian peninsula', 'hejaz', 'empty quarter', 'hadhramaut', 'dhofar', 'najd plateau', 'red sea coast', 'yemen', 'mecca', 'medina'],
    languages: [
      { id: 'ANCIENT_SOUTH_ARABIAN', period: [-1000, 600], weight: 80 },
      { id: 'CLASSICAL_ARABIC', period: [400, 2025], weight: 95 },
      { id: 'ETHIOPIC', period: [100, 1000], weight: 15 }, // Trade influence
    ],
    namePatterns: [
      { pattern: /Muhammad|Abdullah|Khadijah|Fatima|Ali|Umar|Abu Bakr|Uthman/i, language: 'CLASSICAL_ARABIC', weight: 95 },
      { pattern: /Abraha|Dhu Nuwas|Karib|Sheba|Bilqis/i, language: 'ANCIENT_SOUTH_ARABIAN', weight: 90 },
    ],
  },

  // Maghreb - Western Islamic World
  {
    patterns: ['maghreb', 'atlas mountains', 'fez plateau', 'tunisian sahel', 'rif coast', 'draa valley', 'tripolitania', 'tell atlas', 'cyrenaica'],
    languages: [
      { id: 'PHOENICIAN', period: [-814, -146], weight: 40 }, // Carthage
      { id: 'LATIN', period: [-146, 429], weight: 35 },
      { id: 'BERBER', period: [-3000, 2025], weight: 50 },
      { id: 'CLASSICAL_ARABIC', period: [647, 2025], weight: 85 },
      { id: 'ANDALUSI_ARABIC', period: [711, 1609], weight: 30 },
    ],
    namePatterns: [
      { pattern: /Hannibal|Hasdrubal|Hamilcar|Sophonisba/i, language: 'PHOENICIAN', weight: 90 },
      { pattern: /Massinissa|Jugurtha|Juba|Tacfarinas/i, language: 'BERBER', weight: 85 },
      { pattern: /Ibn Battuta|Ibn Khaldun|Tariq|Musa|Yusuf/i, language: 'CLASSICAL_ARABIC', weight: 90 },
    ],
  },

  // Nubia & Sudan - Land of Kush
  {
    patterns: ['nubian', 'nubian desert', 'bayuda desert', 'kush', 'meroe', 'dongola', 'napata'],
    languages: [
      { id: 'ANCIENT_EGYPTIAN', period: [-2500, -500], weight: 40 },
      { id: 'MEROITIC', period: [-300, 400], weight: 70 },
      { id: 'OLD_NUBIAN', period: [400, 1500], weight: 60 },
      { id: 'COPTIC', period: [400, 1200], weight: 30 },
      { id: 'CLASSICAL_ARABIC', period: [1200, 2025], weight: 75 },
    ],
    namePatterns: [
      { pattern: /Piye|Taharqa|Amanirenas|Kandake/i, language: 'MEROITIC', weight: 90 },
      { pattern: /Merkurios|Georgios|Qalidurut/i, language: 'OLD_NUBIAN', weight: 85 },
    ],
  },

  // Caucasus - Mountain Crossroads
  {
    patterns: ['caucasus', 'tbilisi valley', 'mount ararat', 'kura river', 'chechen highlands', 'black sea foothills', 'caspian depression'],
    languages: [
      { id: 'GEORGIAN', period: [-500, 2025], weight: 45 },
      { id: 'ARMENIAN', period: [-500, 2025], weight: 40 },
      { id: 'OLD_PERSIAN', period: [-550, -330], weight: 20 },
      { id: 'MIDDLE_PERSIAN', period: [224, 651], weight: 25 },
      { id: 'CLASSICAL_ARABIC', period: [654, 1200], weight: 30 },
      { id: 'OTTOMAN_TURKISH', period: [1500, 1918], weight: 35 },
    ],
    namePatterns: [
      { pattern: /Davit|Tamar|Giorgi|Vakhtang|Erekle/i, language: 'GEORGIAN', weight: 90 },
      { pattern: /Tigranes|Artashes|Vahan|Vardan|Hayk/i, language: 'ARMENIAN', weight: 90 },
    ],
  },

  // Eastern Desert and Red Sea
  {
    patterns: ['eastern desert', 'red sea', 'sudanese red sea', 'wadi hammamat', 'berenice', 'suez', 'gebel elba'],
    languages: [
      { id: 'ANCIENT_EGYPTIAN', period: [-3100, -700], weight: 40 },
      { id: 'ANCIENT_SOUTH_ARABIAN', period: [-1000, 600], weight: 30 },
      { id: 'CLASSICAL_ARABIC', period: [641, 2025], weight: 80 },
      { id: 'BEJA', period: [-2000, 2025], weight: 35 },
    ],
    namePatterns: [
      { pattern: /Kharamadoye|Bishari|Hadendoa/i, language: 'BEJA', weight: 85 },
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

  // STEP 5: Smart regional fallback based on specific region patterns
  // Check for more specific MENA regional defaults before generic fallback
  if (culturalZone === 'MENA' && region) {
    const regionLower = region.toLowerCase();

    // Mesopotamia/Iraq region defaults
    if (regionLower.includes('mesopotam') || regionLower.includes('babylon') ||
        regionLower.includes('tigris') || regionLower.includes('euphrates')) {
      if (year < -1500) {
        const sumerian = LANGUAGES['SUMERIAN'];
        if (sumerian && year >= sumerian.period[0] && year <= sumerian.period[1]) return sumerian;
      }
      if (year >= -2500 && year < 0) {
        const akkadian = LANGUAGES['AKKADIAN'];
        if (akkadian && year >= akkadian.period[0] && year <= akkadian.period[1]) return akkadian;
      }
    }

    // Egypt/Nile region defaults
    if (regionLower.includes('nile') || regionLower.includes('egypt') ||
        regionLower.includes('thebes') || regionLower.includes('alexandria')) {
      if (year < 0) {
        const egyptian = LANGUAGES['ANCIENT_EGYPTIAN'];
        if (egyptian && year >= egyptian.period[0] && year <= egyptian.period[1]) return egyptian;
      }
      if (year >= -700 && year < 500) {
        const demotic = LANGUAGES['DEMOTIC'];
        if (demotic && year >= demotic.period[0] && year <= demotic.period[1]) return demotic;
      }
      if (year >= 100 && year < 1700) {
        const coptic = LANGUAGES['COPTIC'];
        if (coptic && year >= coptic.period[0] && year <= coptic.period[1]) return coptic;
      }
    }

    // Persian/Iranian region defaults
    if (regionLower.includes('persia') || regionLower.includes('isfahan') ||
        regionLower.includes('shiraz') || regionLower.includes('elam')) {
      if (year < -500) {
        const elamite = LANGUAGES['ELAMITE'];
        if (elamite && year >= elamite.period[0] && year <= elamite.period[1]) return elamite;
      }
      if (year >= -600 && year < -300) {
        const oldPersian = LANGUAGES['OLD_PERSIAN'];
        if (oldPersian && year >= oldPersian.period[0] && year <= oldPersian.period[1]) return oldPersian;
      }
      if (year >= -300 && year < 700) {
        const middlePersian = LANGUAGES['MIDDLE_PERSIAN'];
        if (middlePersian && year >= middlePersian.period[0] && year <= middlePersian.period[1]) return middlePersian;
      }
      if (year >= 700 && year < 1600) {
        const classicalPersian = LANGUAGES['CLASSICAL_PERSIAN'];
        if (classicalPersian && year >= classicalPersian.period[0] && year <= classicalPersian.period[1]) return classicalPersian;
      }
    }

    // Levant region defaults
    if (regionLower.includes('levant') || regionLower.includes('jerusalem') ||
        regionLower.includes('lebanon') || regionLower.includes('galilee')) {
      if (year >= -1200 && year < -300) {
        const phoenician = LANGUAGES['PHOENICIAN'];
        if (phoenician && year >= phoenician.period[0] && year <= phoenician.period[1]) return phoenician;
      }
      if (year >= -1000 && year < 500) {
        const hebrew = LANGUAGES['ANCIENT_HEBREW'];
        if (hebrew && year >= hebrew.period[0] && year <= hebrew.period[1]) return hebrew;
      }
    }

    // Anatolia region defaults
    if (regionLower.includes('anatolia') || regionLower.includes('cappadocia') ||
        regionLower.includes('hittite') || regionLower.includes('hattusa')) {
      if (year >= -1700 && year < -1180) {
        const hittite = LANGUAGES['HITTITE'];
        if (hittite && year >= hittite.period[0] && year <= hittite.period[1]) return hittite;
      }
      if (year >= 330 && year < 1453) {
        const byzantine = LANGUAGES['BYZANTINE_GREEK'];
        if (byzantine && year >= byzantine.period[0] && year <= byzantine.period[1]) return byzantine;
      }
    }

    // Arabian Peninsula defaults
    if (regionLower.includes('arabia') || regionLower.includes('hejaz') ||
        regionLower.includes('yemen') || regionLower.includes('mecca')) {
      if (year < 600) {
        const southArabian = LANGUAGES['ANCIENT_SOUTH_ARABIAN'];
        if (southArabian && year >= southArabian.period[0] && year <= southArabian.period[1]) return southArabian;
      }
    }
  }

  // STEP 6: Fallback to general cultural zone language for the period
  const fallbackLanguages: Record<string, Record<string, string>> = {
    EUROPEAN: {
      ancient: 'LATIN',
      medieval: 'OLD_FRENCH',
      earlyModern: 'EARLY_MODERN_ENGLISH',
      modern: 'EARLY_MODERN_ENGLISH',
      future: 'EARLY_MODERN_ENGLISH',
    },
    MENA: {
      ancient: 'AKKADIAN', // Changed from ARAMAIC - Akkadian was more widespread in ancient times
      medieval: 'CLASSICAL_ARABIC',
      earlyModern: 'OTTOMAN_TURKISH',
      modern: 'CLASSICAL_ARABIC',
      future: 'CLASSICAL_ARABIC',
    },
    SOUTH_ASIAN: {
      ancient: 'SANSKRIT',
      medieval: 'SANSKRIT',
      earlyModern: 'MUGHAL_URDU',
      modern: 'MUGHAL_URDU',
      future: 'MUGHAL_URDU',
    },
    EAST_ASIAN: {
      ancient: 'CLASSICAL_CHINESE',
      medieval: 'MIDDLE_CHINESE',
      earlyModern: 'EARLY_MANDARIN',
      modern: 'EARLY_MANDARIN',
      future: 'EARLY_MANDARIN',
    },
    SUB_SAHARAN_AFRICAN: {
      ancient: 'SWAHILI_CLASSICAL',
      medieval: 'SWAHILI_CLASSICAL',
      earlyModern: 'SWAHILI_CLASSICAL',
      modern: 'SWAHILI_CLASSICAL',
      future: 'SWAHILI_CLASSICAL',
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      ancient: 'PROTO_ALGONQUIAN',
      medieval: 'MOHAWK',
      earlyModern: 'MOHAWK',
      modern: 'LAKOTA',
      future: 'LAKOTA',
    },
    NORTH_AMERICAN_COLONIAL: {
      ancient: 'PROTO_ALGONQUIAN',
      medieval: 'MOHAWK',
      earlyModern: 'EARLY_MODERN_ENGLISH',
      modern: 'EARLY_MODERN_ENGLISH',
      future: 'EARLY_MODERN_ENGLISH',
    },
    SOUTH_AMERICAN: {
      ancient: 'QUECHUA_ANCIENT',
      medieval: 'QUECHUA_ANCIENT',
      earlyModern: 'EARLY_SPANISH',
      modern: 'MODERN_SPANISH',
      future: 'MODERN_SPANISH',
    },
    MESOAMERICAN: {
      ancient: 'CLASSICAL_MAYA',
      medieval: 'CLASSICAL_NAHUATL',
      earlyModern: 'EARLY_SPANISH',
      modern: 'MODERN_SPANISH',
      future: 'MODERN_SPANISH',
    },
    OCEANIAN: {
      ancient: 'PROTO_PAMA_NYUNGAN',
      medieval: 'PROTO_POLYNESIAN',
      earlyModern: 'MAORI',
      modern: 'HAWAIIAN',
      future: 'HAWAIIAN',
    },
    OCEANIA: {
      ancient: 'PROTO_PAMA_NYUNGAN',
      medieval: 'PROTO_POLYNESIAN',
      earlyModern: 'MAORI',
      modern: 'HAWAIIAN',
      future: 'HAWAIIAN',
    },
  };

  const period = year < 500 ? 'ancient' :
                 year < 1500 ? 'medieval' :
                 year < 1800 ? 'earlyModern' :
                 year < 2000 ? 'modern' :
                 'future';

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