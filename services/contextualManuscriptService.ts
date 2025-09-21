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
    culturalZone: CulturalZone; // Add this to make it easier to work with
    content?: string; // Override to make optional since we have fragmentText
    language?: string; // Language of the text
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

// Simplified contextual manuscript templates
const manuscriptTemplates: Record<string, ContextualManuscript[]> = {
    // EUROPEAN MEDIEVAL
    'EUROPEAN_MEDIEVAL': [
        {
            id: 'gutenberg_bible_fragment',
            title: 'Gutenberg Bible Fragment (Genesis)',
            year: 1455,
            era: 'MEDIEVAL',
            culturalZones: ['EUROPEAN'],
            excerpt: 'In principio creavit Deus caelum et terram.',
            culturalZone: 'EUROPEAN' as CulturalZone,
            scriptType: 'latin',
            translationDifficulty: 'easy',
            materialType: 'vellum',
            preservationState: 'pristine',
            fragmentText: 'In principio creavit Deus caelum et terram',
            content: 'In the beginning God created the heaven and the earth.',
            historicalContext: 'One of the first books printed with movable type. Only 49 complete copies survive today.',
            decodingHints: ['principio = beginning', 'Deus = God', 'terra = earth'],
            keywords: ['Gutenberg', 'printing press', 'Bible', 'movable type'],
            author: 'Johannes Gutenberg (printer)',
            language: 'Latin'
        },
        {
            id: 'magna_carta_clause',
            title: 'Magna Carta - Clause 39',
            year: 1215,
            era: 'MEDIEVAL',
            culturalZones: ['EUROPEAN'],
            excerpt: 'Nullus liber homo capiatur...',
            culturalZone: 'EUROPEAN' as CulturalZone,
            scriptType: 'latin',
            translationDifficulty: 'medium',
            materialType: 'parchment',
            preservationState: 'damaged',
            fragmentText: 'Nullus liber homo capiatur vel imprisonetur',
            content: 'No free man shall be seized or imprisoned.',
            historicalContext: 'Foundation of habeas corpus and due process, signed by King John at Runnymede.',
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
            year: -196,
            era: 'ANTIQUITY',
            culturalZones: ['MENA'],
            excerpt: 'Decree issued at Memphis concerning Ptolemy V...',
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
        }
    ],

    // EAST ASIAN MEDIEVAL
    'EAST_ASIAN_MEDIEVAL': [
        {
            id: 'diamond_sutra',
            title: 'Diamond Sutra - World\'s Oldest Printed Book',
            year: 868,
            era: 'MEDIEVAL',
            culturalZones: ['EAST_ASIAN'],
            excerpt: 'Thus I have heard...',
            culturalZone: 'EAST_ASIAN' as CulturalZone,
            scriptType: 'chinese',
            translationDifficulty: 'medium',
            materialType: 'paper',
            preservationState: 'pristine',
            fragmentText: '金剛般若波羅蜜經',
            content: 'Diamond Perfection of Wisdom Sutra - a fundamental Buddhist text.',
            historicalContext: 'Printed May 11, 868 CE. Found in Dunhuang Caves in 1907. Predates Gutenberg by 600 years.',
            decodingHints: ['金 = gold/diamond', '般若 = wisdom', '經 = sutra/scripture'],
            keywords: ['Diamond Sutra', 'Buddhism', 'printing', 'Dunhuang'],
            author: 'Wang Jie (patron)',
            language: 'Classical Chinese'
        }
    ],

    // INDUSTRIAL ERA
    'EUROPEAN_INDUSTRIAL_ERA': [
        {
            id: 'communist_manifesto_draft',
            title: 'Communist Manifesto - Draft Notes',
            year: 1847,
            era: 'INDUSTRIAL_ERA',
            culturalZones: ['EUROPEAN'],
            excerpt: 'Ein Gespenst geht um in Europa...',
            culturalZone: 'EUROPEAN' as CulturalZone,
            scriptType: 'latin',
            translationDifficulty: 'easy',
            materialType: 'paper',
            preservationState: 'good',
            fragmentText: 'Ein Gespenst geht um in Europa',
            content: 'A spectre is haunting Europe — the spectre of communism.',
            historicalContext: 'Written in a Brussels café. Published just before the 1848 revolutions swept Europe.',
            decodingHints: ['Gespenst = ghost/spectre', 'geht um = haunts', 'German grammar'],
            keywords: ['Marx', 'communism', 'revolution', '1848'],
            author: 'Karl Marx & Friedrich Engels',
            language: 'German'
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
        default:
            return generateGenericPuzzle(manuscript, difficulty);
    }
}

function generateLatinPuzzle(manuscript: ContextualManuscript, difficulty: string): TranslationPuzzle {
    const fragment = manuscript.fragmentText || 'Lorem ipsum dolor sit amet';
    const translation = manuscript.content || 'Unknown translation';
    const words = fragment.split(' ');
    const translationWords = translation.split(' ');

    // Create partial translation based on difficulty
    const gaps = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
    const partialWords = [...translationWords];
    const missingWords: string[] = [];

    for (let i = 0; i < gaps && i < translationWords.length; i++) {
        const idx = Math.floor(Math.random() * translationWords.length);
        if (partialWords[idx] !== '___') {
            missingWords.push(translationWords[idx]);
            partialWords[idx] = '___';
        }
    }

    // Add decoy words to word bank
    const wordBank = [...missingWords];
    const decoys = ['king', 'water', 'earth', 'heaven', 'man', 'god', 'life', 'death'];
    for (let i = 0; i < 3 && wordBank.length < gaps + 3; i++) {
        const decoy = decoys[Math.floor(Math.random() * decoys.length)];
        if (!wordBank.includes(decoy)) {
            wordBank.push(decoy);
        }
    }

    return {
        originalScript: words,
        partialTranslation: partialWords,
        wordBank: shuffleArray(wordBank),
        correctSolution: translationWords,
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
    const symbols = ['𓀀', '𓂋', '𓈖', '𓊪', '𓏏', '𓇋'];
    const meanings = ['man', 'mouth', 'water', 'stool', 'bread', 'reed'];

    const selectedCount = difficulty === 'easy' ? 3 : 4;
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

    const wordBank = [...missing, 'sun', 'god', 'king'].slice(0, gaps + 2);

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
    const characters = ['金', '剛', '般', '若'];
    const meanings = ['diamond', 'strong', 'wisdom', 'like'];

    const count = Math.min(characters.length, difficulty === 'easy' ? 2 : 3);
    const selectedChars = characters.slice(0, count);
    const selectedMeanings = meanings.slice(0, count);

    const partial = [...selectedMeanings];
    const gaps = 1;
    const missing: string[] = [];

    const idx = Math.floor(Math.random() * count);
    missing.push(partial[idx]);
    partial[idx] = '___';

    const wordBank = [...missing, 'power', 'temple'].slice(0, gaps + 2);

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

function generateGenericPuzzle(manuscript: ContextualManuscript, difficulty: string): TranslationPuzzle {
    const text = manuscript.content?.substring(0, 100) || 'Ancient wisdom preserved in time.';
    const words = text.split(' ').slice(0, 6);

    const partial = [...words];
    const gaps = difficulty === 'easy' ? 1 : 2;
    const missing: string[] = [];

    for (let i = 0; i < gaps && i < words.length; i++) {
        const idx = Math.floor(Math.random() * words.length);
        if (partial[idx] !== '___' && partial[idx].length > 3) {
            missing.push(partial[idx]);
            partial[idx] = '___';
        }
    }

    const wordBank = [...missing, 'ancient', 'sacred'].slice(0, gaps + 2);

    return {
        originalScript: [manuscript.fragmentText || text],
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

    // Filter by year if close match
    if (year) {
        const closeByDate = manuscripts.filter(m => {
            return Math.abs(m.year - year) < 100;
        });
        if (closeByDate.length > 0) {
            return closeByDate[Math.floor(Math.random() * closeByDate.length)];
        }
    }

    return manuscripts[Math.floor(Math.random() * manuscripts.length)];
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
            modified.content = base.content + '\n\n[Marginal note: A later scribe notes disagreement with this passage]';
            break;
    }

    return modified;
}

// Export service
export const contextualManuscriptService = {
    getContextualManuscript,
    generateTranslationPuzzle,
    checkTranslation,
    generateProceduralManuscript,
    manuscriptTemplates
};