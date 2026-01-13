/**
 * constants/historicalFigures.ts
 *
 * Defines 20 historical figures from the ancient world (3000-0 BCE) that players
 * can choose to embody. Each figure has documented historical traces sufficient
 * to simulate their lives. Distribution spans multiple cultures and social classes.
 */

import { HistoricalEra } from '../types/enums';

// CulturalZone type - matches the definition in types/characterData.ts
type CulturalZone = 'EUROPEAN' | 'EAST_ASIAN' | 'MENA' | 'NORTH_AMERICAN_PRE_COLUMBIAN' | 'NORTH_AMERICAN_COLONIAL' | 'OCEANIA' | 'SOUTH_ASIAN' | 'SOUTH_AMERICAN' | 'SUB_SAHARAN_AFRICAN';

export interface HistoricalFigure {
  id: string;
  name: string;
  profession: string;
  gender: 'male' | 'female';
  age: number;
  year: number; // Negative for BCE
  era: HistoricalEra;
  culturalZone: CulturalZone;
  mapArea: string;
  biography: string; // Brief historical context for LLM
  tagline: string; // One-line description for UI
  historicalNote: string; // Why we know about them
  wikipediaTitle?: string; // Wikipedia page title for API lookup (e.g., "Enheduanna")
  portraitHints?: {
    // Hints for portrait generation
    socialClass?: 'poor' | 'modest' | 'comfortable' | 'wealthy' | 'noble';
    distinctiveFeatures?: string[];
  };
  startingInventory?: string[];
  skills?: Record<string, number>; // Skill bonuses
}

export const HISTORICAL_FIGURES: HistoricalFigure[] = [
  // ============ MESOPOTAMIA / NEAR EAST (6) ============
  {
    id: 'enheduanna',
    name: 'Enheduanna',
    profession: 'High Priestess',
    gender: 'female',
    age: 42,
    year: -2285,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'MENA',
    mapArea: 'Tigris–Euphrates Confluence',
    tagline: 'First named author in human history',
    biography: 'High priestess of the moon god Nanna at Ur, daughter of Sargon of Akkad. Composed hymns and poems that survived millennia. Navigated the dangerous politics between Akkadian rulers and Sumerian religious traditions.',
    historicalNote: 'Her temple hymns and personal poems survive on cuneiform tablets, including accounts of her temporary exile during a rebellion.',
    wikipediaTitle: 'Enheduanna',
    portraitHints: {
      socialClass: 'noble',
      distinctiveFeatures: ['ceremonial headdress', 'formal robes']
    },
    startingInventory: ['STYLUS', 'CLAY_TABLET'],
    skills: { literacy: 80, rhetoric: 70, theology: 85 }
  },
  {
    id: 'puabi',
    name: 'Puabi',
    profession: 'Queen',
    gender: 'female',
    age: 38,
    year: -2600,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'MENA',
    mapArea: 'Tigris–Euphrates Confluence',
    tagline: 'Queen of Ur, buried with treasure and attendants',
    biography: 'A powerful queen of the First Dynasty of Ur whose elaborate tomb revealed the wealth and ritual practices of early Sumerian royalty. Her cylinder seal names her as "nin" (queen or priestess), indicating high independent status.',
    historicalNote: 'Her intact tomb, discovered by Leonard Woolley in 1928, contained gold jewelry, a lyre, and evidence of human sacrifice of her retainers.',
    wikipediaTitle: 'Puabi',
    portraitHints: {
      socialClass: 'noble',
      distinctiveFeatures: ['elaborate gold headdress', 'lapis lazuli jewelry']
    },
    startingInventory: ['GOLD_JEWELRY', 'CYLINDER_SEAL'],
    skills: { leadership: 75, diplomacy: 70 }
  },
  {
    id: 'kubaba',
    name: 'Kubaba',
    profession: 'Tavern Keeper',
    gender: 'female',
    age: 35,
    year: -2500,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'MENA',
    mapArea: 'Tigris–Euphrates Confluence',
    tagline: 'From tavern keeper to Queen of Kish',
    biography: 'A remarkable woman who rose from running a tavern to become the only woman listed on the Sumerian King List as a reigning monarch. Later deified as a goddess. Her rise suggests the social mobility possible in early Mesopotamia.',
    historicalNote: 'The Sumerian King List credits her with consolidating the kingship of Kish for 100 years, and she was later worshipped as a goddess in Anatolia.',
    wikipediaTitle: 'Kubaba',
    portraitHints: {
      socialClass: 'comfortable',
      distinctiveFeatures: ['practical clothing', 'strong presence']
    },
    startingInventory: ['BEER_JUG', 'BRONZE_KNIFE'],
    skills: { commerce: 75, persuasion: 70, brewing: 80 }
  },
  {
    id: 'ea_nasir',
    name: 'Ea-nasir',
    profession: 'Copper Merchant',
    gender: 'male',
    age: 45,
    year: -1750,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'MENA',
    mapArea: 'Babylon Region',
    tagline: 'History\'s most complained-about merchant',
    biography: 'A copper trader of Ur whose house yielded numerous complaint tablets from dissatisfied customers about the quality of his copper ingots. Despite the complaints, he maintained his business and social standing in the merchant quarter.',
    historicalNote: 'Multiple cuneiform tablets found in his house record customer complaints, including the famous letter from Nanni demanding a refund for substandard copper.',
    wikipediaTitle: 'Ea-nasir',
    portraitHints: {
      socialClass: 'comfortable',
      distinctiveFeatures: ['merchant attire', 'calculating expression']
    },
    startingInventory: ['COPPER_INGOT', 'SCALES', 'CLAY_TABLET'],
    skills: { commerce: 85, haggling: 90, deception: 60 }
  },
  {
    id: 'kikkuli',
    name: 'Kikkuli',
    profession: 'Horse Trainer',
    gender: 'male',
    age: 40,
    year: -1400,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'MENA',
    mapArea: 'Cappadocian Highlands',
    tagline: 'Master of the Hittite war chariot horses',
    biography: 'A Hurrian horse trainer employed by the Hittite royal court who wrote the oldest surviving manual on horse training. His systematic methods for conditioning chariot horses were crucial to Hittite military power.',
    historicalNote: 'His training manual, written in Hittite with Hurrian technical terms, describes a 214-day conditioning program for chariot horses.',
    wikipediaTitle: 'Kikkuli',
    portraitHints: {
      socialClass: 'comfortable',
      distinctiveFeatures: ['weathered skin', 'practical clothing']
    },
    startingInventory: ['ROPE', 'BRONZE_KNIFE', 'LEATHER_BRIDLE'],
    skills: { animalHandling: 95, horsemanship: 90, athletics: 70 }
  },
  {
    id: 'ennigaldi_nanna',
    name: 'Ennigaldi-Nanna',
    profession: 'Priestess',
    gender: 'female',
    age: 50,
    year: -530,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'MENA',
    mapArea: 'Tigris–Euphrates Confluence',
    tagline: 'Creator of the world\'s first museum',
    biography: 'Daughter of the Neo-Babylonian king Nabonidus, she served as high priestess of the moon god Sin at Ur. She collected and labeled ancient artifacts from centuries past, creating what archaeologists consider the first museum.',
    historicalNote: 'Excavations at Ur found her collection of artifacts spanning 1,500 years, complete with clay drum labels in three languages describing each object.',
    wikipediaTitle: 'Ennigaldi-Nanna',
    portraitHints: {
      socialClass: 'noble',
      distinctiveFeatures: ['priestly garments', 'scholarly demeanor']
    },
    startingInventory: ['CLAY_TABLET', 'ANCIENT_ARTIFACT'],
    skills: { literacy: 85, history: 90, theology: 75 }
  },

  // ============ EGYPT (5) ============
  {
    id: 'imhotep',
    name: 'Imhotep',
    profession: 'Architect',
    gender: 'male',
    age: 55,
    year: -2650,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    mapArea: 'Nile Delta',
    tagline: 'Builder of the first pyramid, later deified',
    biography: 'Chancellor to Pharaoh Djoser and architect of the Step Pyramid at Saqqara, the first monumental stone building in history. Also renowned as a physician and sage, he was deified two thousand years after his death.',
    historicalNote: 'One of the few non-royals to be depicted with a pharaoh, his titles included "Chancellor of the King of Lower Egypt" and "First after the King."',
    wikipediaTitle: 'Imhotep',
    portraitHints: {
      socialClass: 'noble',
      distinctiveFeatures: ['shaved head', 'white linen']
    },
    startingInventory: ['PAPYRUS_SCROLL', 'MEASURING_CORD'],
    skills: { architecture: 95, medicine: 80, literacy: 85 }
  },
  {
    id: 'merit_ptah',
    name: 'Merit-Ptah',
    profession: 'Physician',
    gender: 'female',
    age: 45,
    year: -2700,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    mapArea: 'Nile Delta',
    tagline: 'Possibly the first named woman in medicine',
    biography: 'Her image appears in a tomb at Saqqara with the title "Chief Physician," suggesting she held a prominent medical position in the royal court during the early Old Kingdom.',
    historicalNote: 'Her son, a high priest, had her image and titles carved in his tomb, preserving her memory across millennia.',
    wikipediaTitle: 'Merit-Ptah',
    portraitHints: {
      socialClass: 'wealthy',
      distinctiveFeatures: ['physician\'s kit', 'dignified bearing']
    },
    startingInventory: ['MEDICAL_KIT', 'PAPYRUS_SCROLL'],
    skills: { medicine: 90, herbalism: 85, anatomy: 80 }
  },
  {
    id: 'heqanakht',
    name: 'Heqanakht',
    profession: 'Farmer',
    gender: 'male',
    age: 52,
    year: -2000,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    mapArea: 'Thebes Valley',
    tagline: 'Egyptian farmer whose letters survived 4,000 years',
    biography: 'A ka-priest and farmer whose detailed letters to his family survived, revealing the economics, family tensions, and daily concerns of Middle Kingdom Egypt. His complaints about his second wife causing household strife inspired Agatha Christie\'s novel.',
    historicalNote: 'His letters discuss grain prices, land rental, family disputes, and give precise instructions about farm management while he was away on priestly duties.',
    wikipediaTitle: 'Heqanakht_papyri',
    portraitHints: {
      socialClass: 'comfortable',
      distinctiveFeatures: ['sun-weathered', 'practical linen']
    },
    startingInventory: ['HOE', 'GRAIN_MEASURE', 'PAPYRUS_SCROLL'],
    skills: { farming: 85, accounting: 70, literacy: 60 }
  },
  {
    id: 'paneb',
    name: 'Paneb',
    profession: 'Tomb Worker',
    gender: 'male',
    age: 38,
    year: -1200,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    mapArea: 'Thebes Valley',
    tagline: 'The most documented criminal of ancient Egypt',
    biography: 'A foreman at the royal tomb workers\' village of Deir el-Medina whose crimes were meticulously recorded by his neighbors: tomb robbery, adultery, assault, and corruption. Yet he maintained his position for years through intimidation and connections.',
    historicalNote: 'Papyrus Salt 124 lists his crimes in detail, including stealing tools from the royal tomb, sleeping with multiple married women, and beating his elderly father.',
    wikipediaTitle: 'Paneb',
    portraitHints: {
      socialClass: 'comfortable',
      distinctiveFeatures: ['muscular build', 'intimidating presence']
    },
    startingInventory: ['CHISEL', 'BRONZE_ADZE', 'STOLEN_GOODS'],
    skills: { stonework: 80, intimidation: 75, stealth: 65 }
  },
  {
    id: 'meketre',
    name: 'Meketre',
    profession: 'Chancellor',
    gender: 'male',
    age: 60,
    year: -2000,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    mapArea: 'Thebes Valley',
    tagline: 'His tomb models reveal Middle Kingdom daily life',
    biography: 'Chancellor and steward under Pharaohs Mentuhotep II and III. His tomb contained exquisite wooden models depicting his estates, workshops, boats, and servants—an unparalleled window into Middle Kingdom economic life.',
    historicalNote: 'The 24 wooden models from his tomb, now in the Cairo and Met museums, show everything from his cattle being counted to bread being baked.',
    wikipediaTitle: 'Meketre',
    portraitHints: {
      socialClass: 'noble',
      distinctiveFeatures: ['fine linen', 'gold jewelry', 'dignified']
    },
    startingInventory: ['GOLD_JEWELRY', 'PAPYRUS_SCROLL', 'SEAL_RING'],
    skills: { administration: 90, diplomacy: 80, literacy: 85 }
  },

  // ============ GREECE / MEDITERRANEAN (4) ============
  {
    id: 'hesiod',
    name: 'Hesiod',
    profession: 'Poet',
    gender: 'male',
    age: 48,
    year: -700,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'EUROPEAN',
    mapArea: 'Athens Basin',
    tagline: 'Poet-farmer who wrote of gods and honest labor',
    biography: 'A farmer in Boeotia who composed the Theogony (birth of the gods) and Works and Days (a farmer\'s almanac with moral advice). Unlike Homer, he names himself and complains about his lazy brother Perses.',
    historicalNote: 'His Works and Days provides practical farming advice alongside mythological and ethical teachings, revealing the life of a small Greek farmer.',
    wikipediaTitle: 'Hesiod',
    portraitHints: {
      socialClass: 'modest',
      distinctiveFeatures: ['weathered hands', 'simple clothing']
    },
    startingInventory: ['HOE', 'LYRE', 'STYLUS'],
    skills: { farming: 70, poetry: 90, theology: 75 }
  },
  {
    id: 'sappho',
    name: 'Sappho',
    profession: 'Poet',
    gender: 'female',
    age: 35,
    year: -610,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'EUROPEAN',
    mapArea: 'Delos Archipelago',
    tagline: 'The Tenth Muse of Lesbos',
    biography: 'An aristocratic poet from Lesbos who led a circle of young women in worship of Aphrodite and the Muses. Her lyric poetry, celebrated throughout antiquity, survives only in fragments but reveals intense emotional and aesthetic sensibility.',
    historicalNote: 'Ancient sources numbered her works in nine books. Plato called her the "Tenth Muse." Only one complete poem and numerous fragments survive.',
    wikipediaTitle: 'Sappho',
    portraitHints: {
      socialClass: 'wealthy',
      distinctiveFeatures: ['fine clothing', 'lyre', 'refined features']
    },
    startingInventory: ['LYRE', 'PAPYRUS_SCROLL', 'PERFUME'],
    skills: { poetry: 95, music: 85, rhetoric: 70 }
  },
  {
    id: 'aesop',
    name: 'Aesop',
    profession: 'Storyteller',
    gender: 'male',
    age: 50,
    year: -580,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'EUROPEAN',
    mapArea: 'Athens Basin',
    tagline: 'Former slave who taught kings through fables',
    biography: 'Born a slave, possibly from Thrace or Phrygia, he gained his freedom through his wit and wisdom. His fables—the Tortoise and the Hare, the Fox and the Grapes—taught moral lessons through animal tales and earned him fame across Greece.',
    historicalNote: 'Ancient sources say he was freed by his master Iadmon of Samos and later served as diplomat for King Croesus of Lydia before his death at Delphi.',
    wikipediaTitle: 'Aesop',
    portraitHints: {
      socialClass: 'modest',
      distinctiveFeatures: ['keen eyes', 'simple clothing', 'expressive face']
    },
    startingInventory: ['WALKING_STAFF', 'TRAVEL_CLOAK'],
    skills: { storytelling: 95, persuasion: 85, wisdom: 80 }
  },
  {
    id: 'pytheas',
    name: 'Pytheas',
    profession: 'Explorer',
    gender: 'male',
    age: 40,
    year: -325,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'EUROPEAN',
    mapArea: 'Marseille Coast',
    tagline: 'Greek explorer who reached the Arctic Circle',
    biography: 'A merchant and astronomer from Massalia (Marseille) who voyaged to Britain, possibly Iceland, and the Baltic. His account of frozen seas, midnight sun, and amber sources expanded Greek knowledge of the north.',
    historicalNote: 'His book "On the Ocean" is lost but was quoted by later geographers. He was the first Greek to describe the tides and correctly connect them to the moon.',
    wikipediaTitle: 'Pytheas',
    portraitHints: {
      socialClass: 'comfortable',
      distinctiveFeatures: ['weathered by sea', 'keen observer\'s eyes']
    },
    startingInventory: ['ASTROLABE', 'PAPYRUS_SCROLL', 'ROPE'],
    skills: { navigation: 90, astronomy: 85, commerce: 70 }
  },

  // ============ CHINA (2) ============
  {
    id: 'fu_hao',
    name: 'Fu Hao',
    profession: 'General',
    gender: 'female',
    age: 33,
    year: -1200,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'EAST_ASIAN',
    mapArea: 'Yellow River Valley',
    tagline: 'Shang dynasty warrior queen and high priestess',
    biography: 'One of the many wives of King Wu Ding, she commanded armies of up to 13,000 soldiers and led military campaigns against neighboring peoples. She also performed important ritual sacrifices as a priestess.',
    historicalNote: 'Her intact tomb, discovered in 1976, contained bronze weapons, jade artifacts, and oracle bones recording her military victories and ritual activities.',
    wikipediaTitle: 'Fu_Hao',
    portraitHints: {
      socialClass: 'noble',
      distinctiveFeatures: ['bronze ceremonial armor', 'commanding presence']
    },
    startingInventory: ['BRONZE_AXE', 'JADE_PENDANT', 'ORACLE_BONES'],
    skills: { combat: 85, leadership: 90, theology: 75 }
  },
  {
    id: 'confucius',
    name: 'Kong Qiu',
    profession: 'Teacher',
    gender: 'male',
    age: 55,
    year: -500,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'EAST_ASIAN',
    mapArea: 'Yellow River Valley',
    tagline: 'Wandering teacher who shaped Chinese civilization',
    biography: 'Born to a declining noble family in Lu, he spent years as a traveling teacher and minor official, developing ethical teachings emphasizing ritual propriety, filial piety, and good governance. His students compiled his sayings after his death.',
    historicalNote: 'The Analects preserve his conversations with students. He served briefly as Minister of Crime in Lu before spending 14 years wandering from state to state.',
    wikipediaTitle: 'Confucius',
    portraitHints: {
      socialClass: 'modest',
      distinctiveFeatures: ['scholar\'s robes', 'dignified bearing', 'thoughtful expression']
    },
    startingInventory: ['BAMBOO_SCROLLS', 'WRITING_BRUSH'],
    skills: { teaching: 95, rhetoric: 85, history: 90, music: 70 }
  },

  // ============ INDIA (1) ============
  {
    id: 'chanakya',
    name: 'Chanakya',
    profession: 'Advisor',
    gender: 'male',
    age: 48,
    year: -320,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'SOUTH_ASIAN',
    mapArea: 'Patna Lowlands',
    tagline: 'The kingmaker who wrote India\'s Machiavelli',
    biography: 'A Brahmin scholar who helped Chandragupta Maurya overthrow the Nanda dynasty and establish the Maurya Empire. His Arthashastra is a treatise on statecraft, economics, and military strategy of unprecedented scope.',
    historicalNote: 'The Arthashastra, rediscovered in 1905, covers everything from spy networks to tax policy to elephant management, revealing sophisticated political thinking.',
    wikipediaTitle: 'Chanakya',
    portraitHints: {
      socialClass: 'modest',
      distinctiveFeatures: ['ascetic appearance', 'piercing intelligence']
    },
    startingInventory: ['PALM_LEAF_MANUSCRIPT', 'WRITING_STYLUS'],
    skills: { politics: 95, strategy: 90, economics: 85, espionage: 80 }
  },

  // ============ AFRICA / CARTHAGE (1) ============
  {
    id: 'hanno',
    name: 'Hanno',
    profession: 'Navigator',
    gender: 'male',
    age: 45,
    year: -500,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'MENA',
    mapArea: 'Tunisian Sahel',
    tagline: 'Carthaginian who sailed past the Sahara',
    biography: 'A Carthaginian explorer who led a fleet of 60 ships down the West African coast, possibly reaching modern Cameroon. He established colonies, encountered "gorillas" (likely great apes), and saw volcanic eruptions.',
    historicalNote: 'His account, the Periplus, was inscribed in the temple of Ba\'al in Carthage. A Greek translation survives, describing three days\' voyage past a volcanic "Chariot of the Gods."',
    wikipediaTitle: 'Hanno_the_Navigator',
    portraitHints: {
      socialClass: 'noble',
      distinctiveFeatures: ['Phoenician dress', 'experienced sailor']
    },
    startingInventory: ['ASTROLABE', 'SWORD', 'TRADE_GOODS'],
    skills: { navigation: 95, leadership: 80, commerce: 75 }
  },

  // ============ NUBIA (1) ============
  {
    id: 'piye',
    name: 'Piye',
    profession: 'King',
    gender: 'male',
    age: 50,
    year: -730,
    era: HistoricalEra.ANTIQUITY,
    culturalZone: 'SUB_SAHARAN_AFRICAN',
    mapArea: 'Thebes Valley',
    tagline: 'Nubian pharaoh who conquered all of Egypt',
    biography: 'King of Kush who marched north to reunite Egypt under his rule, founding the 25th Dynasty. A devout worshipper of Amun, he was known for his mercy to defeated enemies and his love of horses.',
    historicalNote: 'His Victory Stela at Gebel Barkal describes his campaign in detail, including his anger at finding his enemies had mistreated their horses.',
    wikipediaTitle: 'Piye',
    portraitHints: {
      socialClass: 'noble',
      distinctiveFeatures: ['Nubian crown', 'muscular', 'royal bearing']
    },
    startingInventory: ['KHOPESH', 'GOLD_JEWELRY', 'WAR_BOW'],
    skills: { combat: 85, leadership: 90, horsemanship: 85, theology: 75 }
  }
];

// Helper function to get a figure by ID
export function getHistoricalFigure(id: string): HistoricalFigure | undefined {
  return HISTORICAL_FIGURES.find(f => f.id === id);
}

// Get figures grouped by region for UI organization
export function getHistoricalFiguresByRegion(): Record<string, HistoricalFigure[]> {
  const regions: Record<string, HistoricalFigure[]> = {
    'Mesopotamia & Near East': [],
    'Egypt & Nubia': [],
    'Greece & Mediterranean': [],
    'East Asia': [],
    'South Asia': [],
    'Africa': []
  };

  for (const figure of HISTORICAL_FIGURES) {
    // Group by cultural zone and map area
    if (figure.mapArea.includes('Tigris') || figure.mapArea.includes('Babylon') || figure.mapArea.includes('Cappadocian')) {
      regions['Mesopotamia & Near East'].push(figure);
    } else if (figure.mapArea.includes('Nile') || figure.mapArea.includes('Thebes')) {
      regions['Egypt & Nubia'].push(figure);
    } else if (figure.mapArea.includes('Athens') || figure.mapArea.includes('Delos') || figure.mapArea.includes('Marseille')) {
      regions['Greece & Mediterranean'].push(figure);
    } else if (figure.mapArea.includes('Yellow River') || figure.culturalZone === 'EAST_ASIAN') {
      regions['East Asia'].push(figure);
    } else if (figure.mapArea.includes('Patna') || figure.culturalZone === 'SOUTH_ASIAN') {
      regions['South Asia'].push(figure);
    } else if (figure.mapArea.includes('Tunisian')) {
      regions['Africa'].push(figure);
    }
  }

  return regions;
}

// Format year for display (e.g., -2285 -> "2285 BCE")
export function formatHistoricalYear(year: number): string {
  if (year < 0) {
    return `${Math.abs(year)} BCE`;
  }
  return `${year} CE`;
}
