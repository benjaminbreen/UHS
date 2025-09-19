import { CulturalZone, HistoricalEra } from '../types';
import { PrimarySourceMetadata } from './primarySourceService';

export interface ContextualManuscript extends PrimarySourceMetadata {
    scriptType: ScriptType;
    translationDifficulty: 'easy' | 'medium' | 'hard' | 'expert';
    fragmentText?: string; // Actual historical text fragment
    decodingHints?: string[];
    historicalContext?: string;
    materialType?: string; // papyrus, vellum, paper, clay tablet, etc.
    preservationState?: 'pristine' | 'good' | 'damaged' | 'fragmentary';
}

export type ScriptType =
    | 'latin' | 'greek' | 'arabic' | 'hebrew' | 'sanskrit' | 'chinese'
    | 'hieroglyphic' | 'cuneiform' | 'mayan' | 'runic' | 'cyrillic'
    | 'devanagari' | 'japanese' | 'mongolian' | 'tibetan' | 'coptic'
    | 'syriac' | 'ethiopic' | 'armenian' | 'georgian' | 'glagolitic';

// Translation puzzle for decoding manuscripts
export interface TranslationPuzzle {
    originalScript: string[];  // Text in original script/language
    partialTranslation: string[]; // Partially decoded with gaps
    wordBank: string[]; // Possible words to fill gaps
    correctSolution: string[]; // Full correct translation
    scriptVisual?: string[]; // ASCII art representation of script
}

// Contextual manuscript templates by era and culture
const manuscriptTemplates: Record<string, ContextualManuscript[]> = {
    // EUROPEAN MEDIEVAL
    'EUROPEAN_MEDIEVAL': [
        {
            id: 'gutenberg_bible_fragment',
            title: 'Gutenberg Bible Fragment (Genesis)',
            date: '1455',
            era: 'MEDIEVAL' as HistoricalEra,
            culturalZone: 'EUROPEAN' as CulturalZone,
            scriptType: 'latin',
            translationDifficulty: 'easy',
            materialType: 'vellum',
            preservationState: 'pristine',
            fragmentText: 'In principio creavit Deus caelum et terram. Terra autem erat inanis et vacua.',
            content: 'In the beginning God created the heaven and the earth. And the earth was without form, and void; and darkness was upon the face of the deep.',
            historicalContext: 'One of the first books printed with movable type. Only 49 complete copies survive today.',
            decodingHints: ['principio = beginning', 'Deus = God', 'terra = earth'],
            keywords: ['Gutenberg', 'printing press', 'Bible', 'movable type'],
            author: 'Johannes Gutenberg (printer)',
            language: 'Latin'
        },
        {
            id: 'book_of_kells_page',
            title: 'Book of Kells Illuminated Page',
            date: '800',
            era: 'MEDIEVAL' as HistoricalEra,
            culturalZone: 'EUROPEAN' as CulturalZone,
            scriptType: 'latin',
            translationDifficulty: 'medium',
            materialType: 'vellum',
            preservationState: 'good',
            fragmentText: 'Liber generationis Iesu Christi filii David filii Abraham',
            content: 'The book of the generation of Jesus Christ, the son of David, the son of Abraham. Celtic monks created elaborate illuminations with intricate knotwork patterns surrounding the text.',
            historicalContext: 'Created by Celtic monks around 800 CE, considered one of Ireland\'s greatest treasures.',
            decodingHints: ['Liber = book', 'filius = son', 'Look for repeating "filii" pattern'],
            keywords: ['illuminated manuscript', 'Celtic', 'monastery', 'Ireland'],
            author: 'Monks of Iona/Kells',
            language: 'Latin'
        },
        {
            id: 'magna_carta_clause',
            title: 'Magna Carta - Clause 39',
            date: '1215',
            era: 'MEDIEVAL' as HistoricalEra,
            culturalZone: 'EUROPEAN' as CulturalZone,
            scriptType: 'latin',
            translationDifficulty: 'medium',
            materialType: 'parchment',
            preservationState: 'damaged',
            fragmentText: 'Nullus liber homo capiatur, vel imprisonetur, aut dissaisiatur',
            content: 'No free man shall be seized or imprisoned, or stripped of his rights or possessions, or outlawed or exiled. Foundation of habeas corpus and due process.',
            historicalContext: 'Signed by King John at Runnymede, limiting royal power for the first time.',
            decodingHints: ['nullus = no/none', 'liber homo = free man', 'vel = or'],
            keywords: ['Magna Carta', 'liberty', 'law', 'King John'],
            author: 'Stephen Langton and the Barons',
            language: 'Latin'
        }
    ],

    // ANCIENT EGYPT
    'MENA_ANTIQUITY': [
        {
            id: 'rosetta_stone_fragment',
            title: 'Rosetta Stone Fragment',
            date: '-196',
            era: 'ANTIQUITY' as HistoricalEra,
            culturalZone: 'MENA' as CulturalZone,
            scriptType: 'hieroglyphic',
            translationDifficulty: 'hard',
            materialType: 'granite',
            preservationState: 'good',
            fragmentText: '𓈖𓆑𓂋 𓊪𓏏𓇯𓃭𓐝𓇌𓋴',
            content: 'Decree issued at Memphis concerning Ptolemy V. The same text in hieroglyphic, Demotic, and Greek unlocked Egyptian writing.',
            historicalContext: 'Discovered by Napoleon\'s army in 1799, decoded by Champollion in 1822.',
            decodingHints: ['Cartouches contain royal names', '𓊪𓏏 often means "Ptah"', 'Look for repeated symbols'],
            keywords: ['Rosetta Stone', 'hieroglyphs', 'Champollion', 'Ptolemy'],
            author: 'Memphis priesthood',
            language: 'Egyptian hieroglyphic'
        },
        {
            id: 'book_of_dead_spell',
            title: 'Book of the Dead - Spell 125',
            date: '-1550',
            era: 'ANTIQUITY' as HistoricalEra,
            culturalZone: 'MENA' as CulturalZone,
            scriptType: 'hieroglyphic',
            translationDifficulty: 'expert',
            materialType: 'papyrus',
            preservationState: 'fragmentary',
            fragmentText: '𓇋𓈖 𓅓𓊖𓏏 𓊹𓊹𓊹',
            content: 'The Weighing of the Heart. "I have not committed sin. I have not committed robbery with violence. I have not stolen."',
            historicalContext: 'Burial texts to help the deceased navigate the afterlife. This spell lists 42 negative confessions.',
            decodingHints: ['𓇋𓈖 = "I" or negative', '𓊹 = "god" or "divine"', 'Repeated negations'],
            keywords: ['Book of the Dead', 'afterlife', 'judgment', 'Osiris'],
            author: 'Anonymous priests',
            language: 'Middle Egyptian'
        },
        {
            id: 'amarna_letter',
            title: 'Amarna Letter - EA 35',
            date: '-1350',
            era: 'ANTIQUITY' as HistoricalEra,
            culturalZone: 'MENA' as CulturalZone,
            scriptType: 'cuneiform',
            translationDifficulty: 'hard',
            materialType: 'clay tablet',
            preservationState: 'good',
            fragmentText: '𒀭𒈾𒆠𒂊𒀀',
            content: 'Letter from the King of Alashiya (Cyprus) to Pharaoh Akhenaten about copper trade. "My brother, I send you 500 talents of copper."',
            historicalContext: 'Diplomatic correspondence between Bronze Age powers, found at Tell el-Amarna.',
            decodingHints: ['𒀭 = divine determinative', '𒈾 = "na" sound', 'Wedge patterns indicate syllables'],
            keywords: ['Amarna', 'diplomacy', 'Bronze Age', 'trade'],
            author: 'King of Alashiya',
            language: 'Akkadian cuneiform'
        }
    ],

    // EAST ASIAN MEDIEVAL
    'EAST_ASIAN_MEDIEVAL': [
        {
            id: 'diamond_sutra',
            title: 'Diamond Sutra - World\'s Oldest Printed Book',
            date: '868',
            era: 'MEDIEVAL' as HistoricalEra,
            culturalZone: 'EAST_ASIAN' as CulturalZone,
            scriptType: 'chinese',
            translationDifficulty: 'medium',
            materialType: 'paper',
            preservationState: 'pristine',
            fragmentText: '金剛般若波羅蜜經',
            content: 'Thus I have heard. The Buddha teaches that all conditioned things are like dreams, illusions, bubbles, shadows.',
            historicalContext: 'Printed May 11, 868 CE. Found in Dunhuang Caves in 1907. Predates Gutenberg by 600 years.',
            decodingHints: ['金 = gold/diamond', '般若 = wisdom', '經 = sutra/scripture'],
            keywords: ['Diamond Sutra', 'Buddhism', 'printing', 'Dunhuang'],
            author: 'Wang Jie (patron)',
            language: 'Classical Chinese'
        },
        {
            id: 'tale_of_genji',
            title: 'Tale of Genji - Chapter 1',
            date: '1010',
            era: 'MEDIEVAL' as HistoricalEra,
            culturalZone: 'EAST_ASIAN' as CulturalZone,
            scriptType: 'japanese',
            translationDifficulty: 'hard',
            materialType: 'paper',
            preservationState: 'good',
            fragmentText: 'いづれの御時にか、女御、更衣あまたさぶらひたまひける',
            content: 'In which reign was it? Among the many consorts and ladies-in-waiting who served at court...',
            historicalContext: 'Written by Murasaki Shikibu, considered the world\'s first novel.',
            decodingHints: ['御時 = honorable time/reign', '女御 = court lady', 'Classical Japanese grammar'],
            keywords: ['Genji', 'Heian period', 'novel', 'Murasaki Shikibu'],
            author: 'Murasaki Shikibu',
            language: 'Classical Japanese'
        },
        {
            id: 'yongle_encyclopedia',
            title: 'Yongle Encyclopedia - Astronomy Section',
            date: '1408',
            era: 'MEDIEVAL' as HistoricalEra,
            culturalZone: 'EAST_ASIAN' as CulturalZone,
            scriptType: 'chinese',
            translationDifficulty: 'medium',
            materialType: 'paper',
            preservationState: 'damaged',
            fragmentText: '天文志：日月星辰之行度',
            content: 'Treatise on Astronomy: The movements and degrees of the sun, moon, and stars. Includes observations of supernovae.',
            historicalContext: 'Largest encyclopedia in history: 11,095 volumes. Most was destroyed; only 400 volumes survive.',
            decodingHints: ['天 = heaven/sky', '日月 = sun and moon', '星 = star'],
            keywords: ['Yongle', 'encyclopedia', 'Ming Dynasty', 'astronomy'],
            author: 'Imperial scholars',
            language: 'Classical Chinese'
        }
    ],

    // MESOAMERICAN
    'NORTH_AMERICAN_PRE_COLUMBIAN_MEDIEVAL': [
        {
            id: 'dresden_codex',
            title: 'Dresden Codex - Venus Tables',
            date: '1200',
            era: 'MEDIEVAL' as HistoricalEra,
            culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone,
            scriptType: 'mayan',
            translationDifficulty: 'expert',
            materialType: 'bark paper',
            preservationState: 'fragmentary',
            fragmentText: '𝋠𝋡𝋢𝋣',
            content: 'Venus cycle calculations predicting eclipses for centuries. Shows Maya astronomical precision exceeded European knowledge.',
            historicalContext: 'One of only 4 surviving Maya books. Spanish burned thousands as "devil\'s work."',
            decodingHints: ['Dot = 1, Bar = 5', 'Glyphs combine phonetic and logographic', 'Venus = Kukulkan'],
            keywords: ['Maya', 'codex', 'Venus', 'astronomy'],
            author: 'Maya astronomer-priests',
            language: 'Classic Maya'
        },
        {
            id: 'aztec_tribute_list',
            title: 'Codex Mendoza - Tribute List',
            date: '1541',
            era: 'RENAISSANCE_EARLY_MODERN' as HistoricalEra,
            culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone,
            scriptType: 'aztec_pictographic',
            translationDifficulty: 'medium',
            materialType: 'European paper',
            preservationState: 'pristine',
            fragmentText: '🦅🐆🌽🌶️',
            content: 'Annual tribute: 800 bundles of cacao, 2400 cotton mantles, 1 eagle warrior costume, jade beads.',
            historicalContext: 'Created for Charles V to explain Aztec governance. Captured by French pirates, ended up in Oxford.',
            decodingHints: ['Feathers = 400', 'Bag = 8000', 'Pictures are literal'],
            keywords: ['Aztec', 'tribute', 'Codex Mendoza', 'pictographic'],
            author: 'Aztec scribes for Spanish',
            language: 'Nahuatl pictographs'
        }
    ],

    // SOUTH ASIAN ANCIENT
    'SOUTH_ASIAN_ANTIQUITY': [
        {
            id: 'rigveda_hymn',
            title: 'Rigveda - Hymn to Agni',
            date: '-1500',
            era: 'ANTIQUITY' as HistoricalEra,
            culturalZone: 'SOUTH_ASIAN' as CulturalZone,
            scriptType: 'sanskrit',
            translationDifficulty: 'hard',
            materialType: 'oral tradition/palm leaf',
            preservationState: 'good',
            fragmentText: 'अग्निमीळे पुरोहितं यज्ञस्य देवं',
            content: 'I praise Agni, the household priest, the divine minister of sacrifice, the invoker, bestower of wealth.',
            historicalContext: 'Oldest Sanskrit text, preserved orally for 3000 years with perfect accuracy through elaborate memorization techniques.',
            decodingHints: ['अग्नि = Agni/fire', 'देव = deva/god', 'Devanagari script'],
            keywords: ['Rigveda', 'Sanskrit', 'hymn', 'Vedic'],
            author: 'Vedic rishis',
            language: 'Vedic Sanskrit'
        },
        {
            id: 'ashoka_edict',
            title: 'Edicts of Ashoka - Rock Edict XIII',
            date: '-260',
            era: 'ANTIQUITY' as HistoricalEra,
            culturalZone: 'SOUTH_ASIAN' as CulturalZone,
            scriptType: 'brahmi',
            translationDifficulty: 'hard',
            materialType: 'rock inscription',
            preservationState: 'damaged',
            fragmentText: '𑀓𑀮𑀺𑀁𑀕',
            content: 'The Kalinga war was conquered. 150,000 deported, 100,000 killed. The Beloved of the Gods felt remorse.',
            historicalContext: 'After the bloody Kalinga war, Ashoka converted to Buddhism and renounced violence.',
            decodingHints: ['Brahmi script', 'Read left to right', 'दुःख = suffering'],
            keywords: ['Ashoka', 'Buddhism', 'Kalinga', 'pacifism'],
            author: 'Emperor Ashoka',
            language: 'Prakrit'
        }
    ],

    // INDUSTRIAL ERA REVOLUTIONARY
    'EUROPEAN_INDUSTRIAL_ERA': [
        {
            id: 'communist_manifesto_draft',
            title: 'Communist Manifesto - Draft Notes',
            date: '1847',
            era: 'INDUSTRIAL_ERA' as HistoricalEra,
            culturalZone: 'EUROPEAN' as CulturalZone,
            scriptType: 'latin',
            translationDifficulty: 'easy',
            materialType: 'paper',
            preservationState: 'good',
            fragmentText: 'Ein Gespenst geht um in Europa – das Gespenst des Kommunismus',
            content: 'A spectre is haunting Europe — the spectre of communism. All the powers of old Europe have entered into a holy alliance to exorcise this spectre.',
            historicalContext: 'Written in a Brussels café. Published just before the 1848 revolutions swept Europe.',
            decodingHints: ['Gespenst = ghost/spectre', 'geht um = haunts', 'German grammar'],
            keywords: ['Marx', 'communism', 'revolution', '1848'],
            author: 'Karl Marx & Friedrich Engels',
            language: 'German'
        },
        {
            id: 'underground_railroad_code',
            title: 'Underground Railroad - Coded Letter',
            date: '1852',
            era: 'INDUSTRIAL_ERA' as HistoricalEra,
            culturalZone: 'NORTH_AMERICAN_COLONIAL' as CulturalZone,
            scriptType: 'latin',
            translationDifficulty: 'medium',
            materialType: 'paper',
            preservationState: 'damaged',
            fragmentText: 'Two small parcels arrived on the morning train. The conductor suggests they continue to the next station.',
            content: 'DECODED: Two enslaved children arrived this morning. The guide recommends moving them to the next safe house tonight.',
            historicalContext: 'Coded language used to coordinate the Underground Railroad. "Parcels" = escapees, "conductor" = guide.',
            decodingHints: ['parcels = people', 'train = escape route', 'station = safe house'],
            keywords: ['Underground Railroad', 'slavery', 'codes', 'freedom'],
            author: 'Anonymous conductor',
            language: 'English (coded)'
        }
    ],

    // MODERN ERA
    'EUROPEAN_MODERN_ERA': [
        {
            id: 'turing_paper',
            title: 'Turing\'s Computing Machinery and Intelligence',
            date: '1950',
            era: 'MODERN_ERA' as HistoricalEra,
            culturalZone: 'EUROPEAN' as CulturalZone,
            scriptType: 'latin',
            translationDifficulty: 'easy',
            materialType: 'typescript',
            preservationState: 'pristine',
            fragmentText: 'I propose to consider the question, "Can machines think?"',
            content: 'The original question, "Can machines think?" I propose to replace with "Can machines do what we (as thinking entities) can do?"',
            historicalContext: 'Founded the field of AI. Proposed the Turing Test. Turing was persecuted for homosexuality and died at 41.',
            decodingHints: ['Modern English', 'Technical vocabulary', 'Philosophical argument'],
            keywords: ['Turing', 'AI', 'computing', 'intelligence'],
            author: 'Alan Turing',
            language: 'English'
        },
        {
            id: 'enigma_intercept',
            title: 'Enigma Machine Intercept',
            date: '1943',
            era: 'MODERN_ERA' as HistoricalEra,
            culturalZone: 'EUROPEAN' as CulturalZone,
            scriptType: 'latin',
            translationDifficulty: 'hard',
            materialType: 'radio transcript',
            preservationState: 'good',
            fragmentText: 'KEINEBESONDERENEREIGNISSE',
            content: 'DECODED: "Keine besonderen Ereignisse" (No special events). Common Wehrmacht daily report helped break the code.',
            historicalContext: 'Bletchley Park used repeated phrases like weather reports and "Heil Hitler" to break Enigma.',
            decodingHints: ['No spaces in encryption', 'German military terminology', 'Repetitive phrases'],
            keywords: ['Enigma', 'Bletchley Park', 'WWII', 'cryptography'],
            author: 'Wehrmacht signals',
            language: 'German (encrypted)'
        }
    ]
};

// Generate translation puzzles for manuscripts
export function generateTranslationPuzzle(manuscript: ContextualManuscript): TranslationPuzzle {
    const difficulty = manuscript.translationDifficulty;

    // Create puzzle based on script type and difficulty
    switch (manuscript.scriptType) {
        case 'latin':
            return generateLatinPuzzle(manuscript, difficulty);
        case 'hieroglyphic':
            return generateHieroglyphicPuzzle(manuscript, difficulty);
        case 'chinese':
            return generateChinesePuzzle(manuscript, difficulty);
        case 'cuneiform':
            return generateCuneiformPuzzle(manuscript, difficulty);
        default:
            return generateGenericPuzzle(manuscript, difficulty);
    }
}

function generateLatinPuzzle(manuscript: ContextualManuscript, difficulty: string): TranslationPuzzle {
    const fragment = manuscript.fragmentText || 'Lorem ipsum dolor sit amet';
    const words = fragment.split(' ');

    // Create partial translation based on difficulty
    const gaps = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
    const partialWords = [...words];
    const missingWords: string[] = [];

    for (let i = 0; i < gaps && i < words.length; i++) {
        const idx = Math.floor(Math.random() * words.length);
        missingWords.push(words[idx]);
        partialWords[idx] = '___';
    }

    // Add decoy words to word bank
    const wordBank = [...missingWords];
    const decoys = ['rex', 'aqua', 'terra', 'caelum', 'homo', 'deus', 'vita', 'mors'];
    for (let i = 0; i < 3; i++) {
        wordBank.push(decoys[Math.floor(Math.random() * decoys.length)]);
    }

    return {
        originalScript: [fragment],
        partialTranslation: [`${partialWords.join(' ')}`],
        wordBank: shuffleArray(wordBank),
        correctSolution: [fragment],
        scriptVisual: [
            '╔════════════════════════════════════╗',
            '║  LATIN MANUSCRIPT - MEDIEVAL SCRIPT ║',
            '╠════════════════════════════════════╣',
            `║  ${fragment.substring(0, 35)}... ║`,
            '╚════════════════════════════════════╝'
        ]
    };
}

function generateHieroglyphicPuzzle(manuscript: ContextualManuscript, difficulty: string): TranslationPuzzle {
    // Simplified hieroglyphic symbols for game
    const symbols = ['𓀀', '𓂋', '𓈖', '𓊪', '𓏏', '𓇋', '𓅓', '𓊖'];
    const meanings = ['man', 'mouth', 'water', 'stool', 'bread', 'reed', 'owl', 'house'];

    const selectedCount = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
    const selected = symbols.slice(0, selectedCount);
    const selectedMeanings = meanings.slice(0, selectedCount);

    // Create puzzle with some blanks
    const partial = [...selectedMeanings];
    const gaps = Math.min(2, selectedCount - 1);
    const missing: string[] = [];

    for (let i = 0; i < gaps; i++) {
        const idx = Math.floor(Math.random() * selectedCount);
        if (partial[idx] !== '___') {
            missing.push(partial[idx]);
            partial[idx] = '___';
        }
    }

    const wordBank = [...missing, 'sun', 'god', 'king', 'river'].slice(0, gaps + 2);

    return {
        originalScript: selected,
        partialTranslation: partial,
        wordBank: shuffleArray(wordBank),
        correctSolution: selectedMeanings,
        scriptVisual: [
            '╔══════════════════════════════════════╗',
            '║   HIEROGLYPHIC TABLET - DYNASTY XVIII ║',
            '╠══════════════════════════════════════╣',
            '║                                      ║',
            `║        ${selected.join('  ')}           ║`,
            '║                                      ║',
            '║   [Cartouche of Royal Name]         ║',
            '╚══════════════════════════════════════╝'
        ]
    };
}

function generateChinesePuzzle(manuscript: ContextualManuscript, difficulty: string): TranslationPuzzle {
    const characters = ['金', '木', '水', '火', '土', '日', '月', '山'];
    const meanings = ['gold', 'wood', 'water', 'fire', 'earth', 'sun', 'moon', 'mountain'];

    const count = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
    const selectedChars = characters.slice(0, count);
    const selectedMeanings = meanings.slice(0, count);

    const partial = [...selectedMeanings];
    const gaps = Math.min(2, count - 1);
    const missing: string[] = [];

    for (let i = 0; i < gaps; i++) {
        const idx = Math.floor(Math.random() * count);
        if (partial[idx] !== '___') {
            missing.push(partial[idx]);
            partial[idx] = '___';
        }
    }

    const wordBank = [...missing, 'star', 'wind', 'cloud'].slice(0, gaps + 2);

    return {
        originalScript: selectedChars,
        partialTranslation: partial,
        wordBank: shuffleArray(wordBank),
        correctSolution: selectedMeanings,
        scriptVisual: [
            '╔═══════════════════════════════╗',
            '║  漢 CHINESE SCROLL - TANG ERA ║',
            '╠═══════════════════════════════╣',
            `║     ${selectedChars.join(' ')}        ║`,
            '║                               ║',
            '║  [Imperial Seal: 天子之寶]     ║',
            '╚═══════════════════════════════╝'
        ]
    };
}

function generateCuneiformPuzzle(manuscript: ContextualManuscript, difficulty: string): TranslationPuzzle {
    // Simplified cuneiform representation
    const wedges = ['𒀭', '𒈾', '𒆠', '𒂊', '𒀀', '𒁀', '𒌋', '𒈬'];
    const syllables = ['AN', 'NA', 'KI', 'E', 'A', 'BA', 'U', 'MU'];

    const count = difficulty === 'easy' ? 3 : 4;
    const selected = wedges.slice(0, count);
    const selectedSounds = syllables.slice(0, count);

    const partial = [...selectedSounds];
    const missing: string[] = [];
    const gaps = 2;

    for (let i = 0; i < gaps && i < count; i++) {
        const idx = Math.floor(Math.random() * count);
        if (partial[idx] !== '___') {
            missing.push(partial[idx]);
            partial[idx] = '___';
        }
    }

    const wordBank = [...missing, 'LA', 'TU', 'RI'].slice(0, gaps + 1);

    return {
        originalScript: selected,
        partialTranslation: partial,
        wordBank: shuffleArray(wordBank),
        correctSolution: selectedSounds,
        scriptVisual: [
            '╔════════════════════════════════════╗',
            '║  𒊬 CLAY TABLET - SUMERIAN SCRIPT  ║',
            '╠════════════════════════════════════╣',
            '║                                    ║',
            `║    ${selected.join('  ')}              ║`,
            '║                                    ║',
            '║  [Cylinder Seal Impression]        ║',
            '╚════════════════════════════════════╝'
        ]
    };
}

function generateGenericPuzzle(manuscript: ContextualManuscript, difficulty: string): TranslationPuzzle {
    const text = manuscript.content?.substring(0, 100) || 'Ancient wisdom preserved in time.';
    const words = text.split(' ').slice(0, 8);

    const partial = [...words];
    const gaps = difficulty === 'easy' ? 2 : 3;
    const missing: string[] = [];

    for (let i = 0; i < gaps && i < words.length; i++) {
        const idx = Math.floor(Math.random() * words.length);
        if (partial[idx] !== '___' && partial[idx].length > 3) {
            missing.push(partial[idx]);
            partial[idx] = '___';
        }
    }

    const wordBank = [...missing, 'ancient', 'sacred', 'knowledge'].slice(0, gaps + 2);

    return {
        originalScript: [text],
        partialTranslation: [partial.join(' ')],
        wordBank: shuffleArray(wordBank),
        correctSolution: [text],
        scriptVisual: [
            '╔════════════════════════════════╗',
            '║     ANCIENT MANUSCRIPT         ║',
            '╠════════════════════════════════╣',
            `║  ${manuscript.scriptType.toUpperCase()} SCRIPT    ║`,
            '╚════════════════════════════════╝'
        ]
    };
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Get contextually appropriate manuscripts for a specific ruin
export function getContextualManuscript(
    era: HistoricalEra,
    culturalZone: CulturalZone,
    ruinType: string,
    year: number
): ContextualManuscript | null {
    // Find manuscripts for this era and culture
    const key = `${culturalZone}_${era}`;
    const manuscripts = manuscriptTemplates[key];

    if (!manuscripts || manuscripts.length === 0) {
        // Try to find close matches
        const alternativeKeys = Object.keys(manuscriptTemplates).filter(k =>
            k.includes(culturalZone) || k.includes(era)
        );

        if (alternativeKeys.length > 0) {
            const altManuscripts = manuscriptTemplates[alternativeKeys[0]];
            return altManuscripts[Math.floor(Math.random() * altManuscripts.length)];
        }

        return null;
    }

    // Filter by ruin type if possible
    let filtered = manuscripts;

    // Specific manuscript types for specific ruins
    if (ruinType.toLowerCase().includes('library') || ruinType.toLowerCase().includes('scriptorium')) {
        // Prefer literary/religious texts
        filtered = manuscripts.filter(m =>
            m.keywords.some(k => k.includes('book') || k.includes('sutra') || k.includes('Bible'))
        ) || manuscripts;
    } else if (ruinType.toLowerCase().includes('government') || ruinType.toLowerCase().includes('palace')) {
        // Prefer administrative/legal texts
        filtered = manuscripts.filter(m =>
            m.keywords.some(k => k.includes('edict') || k.includes('law') || k.includes('decree'))
        ) || manuscripts;
    } else if (ruinType.toLowerCase().includes('temple') || ruinType.toLowerCase().includes('church')) {
        // Prefer religious texts
        filtered = manuscripts.filter(m =>
            m.keywords.some(k => k.includes('hymn') || k.includes('prayer') || k.includes('ritual'))
        ) || manuscripts;
    }

    // If specific year is close to a manuscript's date, prefer it
    if (year) {
        const closeByDate = filtered.filter(m => {
            const mYear = parseInt(m.date || '0');
            return Math.abs(mYear - year) < 100;
        });
        if (closeByDate.length > 0) {
            filtered = closeByDate;
        }
    }

    return filtered[Math.floor(Math.random() * filtered.length)];
}

// Check if player successfully solves translation puzzle
export function checkTranslation(
    puzzle: TranslationPuzzle,
    playerSolution: string[]
): { success: boolean; accuracy: number; feedback: string } {
    let correct = 0;
    const total = puzzle.correctSolution.length;

    for (let i = 0; i < total; i++) {
        if (playerSolution[i] === puzzle.correctSolution[i]) {
            correct++;
        }
    }

    const accuracy = (correct / total) * 100;
    const success = accuracy >= 70; // 70% accuracy required

    let feedback = '';
    if (accuracy === 100) {
        feedback = 'Perfect translation! You have fully decoded this ancient text.';
    } else if (accuracy >= 70) {
        feedback = 'Good translation! You understood the main meaning of the text.';
    } else if (accuracy >= 40) {
        feedback = 'Partial translation. Some errors, but you grasped some concepts.';
    } else {
        feedback = 'Translation failed. The meaning remains obscured.';
    }

    return { success, accuracy, feedback };
}

// Generate procedural variations of manuscripts
export function generateProceduralManuscript(
    base: ContextualManuscript,
    variation: 'damaged' | 'partial' | 'annotated'
): ContextualManuscript {
    const modified = { ...base };

    switch (variation) {
        case 'damaged':
            modified.preservationState = 'fragmentary';
            modified.title += ' (Damaged Fragment)';
            modified.translationDifficulty = 'hard';
            modified.content = base.content?.substring(0, Math.floor((base.content?.length || 100) * 0.6)) + '... [text illegible]';
            break;

        case 'partial':
            modified.title += ' (Partial Copy)';
            modified.preservationState = 'damaged';
            modified.content = '... ' + base.content?.substring(20, 80) + ' ...';
            break;

        case 'annotated':
            modified.title += ' (Annotated Copy)';
            modified.preservationState = 'good';
            modified.content = base.content + '\n\n[Marginal note: ' + generateRandomAnnotation(base) + ']';
            break;
    }

    return modified;
}

function generateRandomAnnotation(manuscript: ContextualManuscript): string {
    const annotations = [
        'A later scribe notes disagreement with this passage',
        'Copied in haste during the siege',
        'This copy verified against three sources',
        'Reader\'s note: "Truth or heresy?"',
        'Illumination added by Brother Francis, Year of Our Lord ' + (parseInt(manuscript.date || '1000') + 50),
        'Water damage has obscured the final verses',
        'Compare with the Constantinople codex',
        'This differs from the Alexandria version'
    ];

    return annotations[Math.floor(Math.random() * annotations.length)];
}

// Export service
export const contextualManuscriptService = {
    getContextualManuscript,
    generateTranslationPuzzle,
    checkTranslation,
    generateProceduralManuscript,
    manuscriptTemplates
};