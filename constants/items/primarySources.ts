/**
 * Primary source texts that can be discovered in holy places and palaces
 * These are actual historical texts organized by culture, era, and type
 */

import { ItemDefinition, CulturalZone } from '../../types';

export interface PrimarySourceText extends ItemDefinition {
    baseId: string;
    title: string;
    author: string;
    originalDate: string;
    excerpt: string;
    fullText: string;
    context: string;
    sourceType: 'religious' | 'political' | 'philosophical' | 'literary' | 'legal' | 'scientific';
    language: string;
    culturalZone: CulturalZone;
    eraAvailability: { startYear: number; endYear: number };
}

export const PRIMARY_SOURCES: PrimarySourceText[] = [
    // ANTIQUITY - Religious Texts
    {
        baseId: 'text_epic_gilgamesh',
        name: 'Clay Tablet: Epic of Gilgamesh',
        title: 'Epic of Gilgamesh, Tablet XI',
        author: 'Unknown (Mesopotamian)',
        originalDate: 'c. 2100 BCE',
        excerpt: 'I will proclaim to the world the deeds of Gilgamesh...',
        fullText: 'I will proclaim to the world the deeds of Gilgamesh. This was the man to whom all things were known; this was the king who knew the countries of the world. He was wise, he saw mysteries and knew secret things, he brought us a tale of the days before the flood. He went on a long journey, was weary, worn-out with labor, returning he rested, he engraved on a stone the whole story.',
        context: 'The oldest known work of literature, found in the library of Ashurbanipal. This tablet describes the great flood.',
        sourceType: 'religious',
        language: 'Akkadian',
        culturalZone: 'MENA',
        eraAvailability: { startYear: -3000, endYear: 500 },
        description: 'An ancient clay tablet with cuneiform script',
        emoji: '📜',
        rarity: 'Ultra-rare',
        value: 500,
        weight: 2,
        wearable: false,
        stackable: false,
        category: 'Document',
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 0
    },
    {
        baseId: 'text_book_dead',
        name: 'Papyrus: Book of the Dead',
        title: 'Book of Going Forth by Day',
        author: 'Various Egyptian Priests',
        originalDate: 'c. 1550 BCE',
        excerpt: 'O you who bring the ferryboat of Ra...',
        fullText: 'O you who bring the ferryboat of Ra, strengthen for me the rope of your ferryboat on this day when I myself go forth. My mouth has been given to me that I may speak with it in the presence of the Great God, and my hand shall not be taken away from me in the Council of the Gods.',
        context: 'Egyptian funerary text containing spells to help the deceased navigate the afterlife.',
        sourceType: 'religious',
        language: 'Hieroglyphic Egyptian',
        culturalZone: 'AFRICA',
        eraAvailability: { startYear: -2000, endYear: 300 },
        description: 'A papyrus scroll with hieroglyphic inscriptions',
        emoji: '📜',
        rarity: 'Rare',
        value: 300,
        weight: 1,
        wearable: false,
        stackable: false,
        category: 'Document',
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 0
    },
    {
        baseId: 'text_dao_de_jing',
        name: 'Bamboo Scroll: Dao De Jing',
        title: 'Dao De Jing (Tao Te Ching)',
        author: 'Laozi',
        originalDate: 'c. 400 BCE',
        excerpt: 'The Dao that can be spoken is not the eternal Dao...',
        fullText: 'The Dao that can be spoken is not the eternal Dao. The name that can be named is not the eternal name. The nameless is the origin of Heaven and Earth. The named is the mother of all things. Therefore, constantly without desire, one observes its wonders.',
        context: 'Foundational text of Daoism, emphasizing harmony with the natural order.',
        sourceType: 'philosophical',
        language: 'Classical Chinese',
        culturalZone: 'EAST_ASIA',
        eraAvailability: { startYear: -500, endYear: 2025 },
        description: 'A bamboo scroll with Chinese characters',
        emoji: '📜',
        rarity: 'Rare',
        value: 250,
        weight: 1,
        wearable: false,
        stackable: false,
        category: 'Document',
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 0
    },
    {
        baseId: 'text_iliad',
        name: 'Scroll: The Iliad',
        title: 'The Iliad, Book I',
        author: 'Homer',
        originalDate: 'c. 750 BCE',
        excerpt: 'Sing, O goddess, the anger of Achilles...',
        fullText: 'Sing, O goddess, the anger of Achilles son of Peleus, that brought countless ills upon the Achaeans. Many a brave soul did it send hurrying down to Hades, and many a hero did it yield a prey to dogs and vultures.',
        context: 'Epic poem about the Trojan War, foundational to Greek literature.',
        sourceType: 'literary',
        language: 'Ancient Greek',
        culturalZone: 'EUROPE',
        eraAvailability: { startYear: -800, endYear: 600 },
        description: 'A papyrus scroll with Greek text',
        emoji: '📜',
        rarity: 'Uncommon',
        value: 200,
        weight: 1,
        wearable: false,
        stackable: false,
        category: 'Document',
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 0
    },

    // MEDIEVAL - Religious & Political
    {
        baseId: 'text_quran',
        name: 'Illuminated Manuscript: Quran',
        title: 'Al-Quran, Surah Al-Fatiha',
        author: 'Divine Revelation to Muhammad',
        originalDate: 'c. 610-632 CE',
        excerpt: 'In the name of Allah, the Most Gracious...',
        fullText: 'In the name of Allah, the Most Gracious, the Most Merciful. All praise is due to Allah, Lord of the Worlds. The Most Gracious, the Most Merciful. Master of the Day of Judgment. You alone we worship, and You alone we ask for help.',
        context: 'The opening chapter of the Quran, recited in daily prayers.',
        sourceType: 'religious',
        language: 'Classical Arabic',
        culturalZone: 'MENA',
        eraAvailability: { startYear: 610, endYear: 2025 },
        description: 'A beautifully illuminated Quranic manuscript',
        emoji: '📖',
        rarity: 'Rare',
        value: 400,
        weight: 2,
        wearable: false,
        stackable: false,
        category: 'Document',
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 0
    },
    {
        baseId: 'text_beowulf',
        name: 'Vellum Manuscript: Beowulf',
        title: 'Beowulf',
        author: 'Unknown (Anglo-Saxon)',
        originalDate: 'c. 1000 CE',
        excerpt: 'Hwæt! We Gardena in geardagum...',
        fullText: 'Listen! We have heard of the glory of the Spear-Danes in the old days, the kings of the people, how those princes performed brave deeds.',
        context: 'Old English epic poem, one of the most important works of Anglo-Saxon literature.',
        sourceType: 'literary',
        language: 'Old English',
        culturalZone: 'EUROPE',
        eraAvailability: { startYear: 800, endYear: 1200 },
        description: 'A vellum manuscript with Old English text',
        emoji: '📜',
        rarity: 'Ultra-rare',
        value: 450,
        weight: 2,
        wearable: false,
        stackable: false,
        category: 'Document',
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 0
    },
    {
        baseId: 'text_tale_genji',
        name: 'Scroll: Tale of Genji',
        title: 'Genji Monogatari',
        author: 'Murasaki Shikibu',
        originalDate: 'c. 1010 CE',
        excerpt: 'In a certain reign there was a lady...',
        fullText: 'In a certain reign there was a lady not of the first rank whom the emperor loved more than any of the others. The grand ladies with high ambitions thought her a presumptuous upstart.',
        context: 'Often considered the world\'s first novel, depicting court life in Heian Japan.',
        sourceType: 'literary',
        language: 'Classical Japanese',
        culturalZone: 'EAST_ASIA',
        eraAvailability: { startYear: 900, endYear: 1400 },
        description: 'An illustrated scroll with Japanese calligraphy',
        emoji: '📜',
        rarity: 'Rare',
        value: 350,
        weight: 1,
        wearable: false,
        stackable: false,
        category: 'Document',
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 0
    },
    {
        baseId: 'text_magna_carta',
        name: 'Charter: Magna Carta',
        title: 'Magna Carta Libertatum',
        author: 'English Barons',
        originalDate: '1215 CE',
        excerpt: 'No free man shall be seized...',
        fullText: 'No free man shall be seized or imprisoned, or stripped of his rights or possessions, or outlawed or exiled, or deprived of his standing in any way, nor will we proceed with force against him, except by the lawful judgment of his equals or by the law of the land.',
        context: 'Charter of rights that limited the power of the English monarchy.',
        sourceType: 'legal',
        language: 'Latin',
        culturalZone: 'EUROPE',
        eraAvailability: { startYear: 1200, endYear: 1500 },
        description: 'A sealed charter on parchment',
        emoji: '📜',
        rarity: 'Ultra-rare',
        value: 500,
        weight: 1,
        wearable: false,
        stackable: false,
        category: 'Document',
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 0
    },

    // RENAISSANCE
    {
        baseId: 'text_prince',
        name: 'Book: The Prince',
        title: 'Il Principe',
        author: 'Niccolò Machiavelli',
        originalDate: '1513 CE',
        excerpt: 'It is better to be feared than loved...',
        fullText: 'Upon this a question arises: whether it be better to be loved than feared or feared than loved? One should wish to be both, but, because it is difficult to unite them in one person, it is much safer to be feared than loved.',
        context: 'Political treatise on power and statecraft that shocked contemporary Europe.',
        sourceType: 'political',
        language: 'Italian',
        culturalZone: 'EUROPE',
        eraAvailability: { startYear: 1450, endYear: 1700 },
        description: 'A bound book with Italian text',
        emoji: '📕',
        rarity: 'Uncommon',
        value: 250,
        weight: 2,
        wearable: false,
        stackable: false,
        category: 'Document',
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 0
    },
    {
        baseId: 'text_95_theses',
        name: 'Document: 95 Theses',
        title: 'Disputation on the Power of Indulgences',
        author: 'Martin Luther',
        originalDate: '1517 CE',
        excerpt: 'When our Lord Jesus Christ said "Repent"...',
        fullText: 'When our Lord and Master Jesus Christ said "Repent", he willed the entire life of believers to be one of repentance. This word cannot be understood as referring to the sacrament of penance.',
        context: 'Document that sparked the Protestant Reformation.',
        sourceType: 'religious',
        language: 'Latin',
        culturalZone: 'EUROPE',
        eraAvailability: { startYear: 1500, endYear: 1700 },
        description: 'A printed pamphlet with Latin text',
        emoji: '📄',
        rarity: 'Rare',
        value: 300,
        weight: 1,
        wearable: false,
        stackable: false,
        category: 'Document',
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 0
    },

    // ENLIGHTENMENT & MODERN
    {
        baseId: 'text_two_treatises',
        name: 'Book: Two Treatises of Government',
        title: 'Two Treatises of Government',
        author: 'John Locke',
        originalDate: '1689 CE',
        excerpt: 'All men are naturally in a state of perfect freedom...',
        fullText: 'To understand political power right, and derive it from its original, we must consider what state all men are naturally in, and that is, a state of perfect freedom to order their actions.',
        context: 'Foundational work of liberal political philosophy.',
        sourceType: 'political',
        language: 'English',
        culturalZone: 'EUROPE',
        eraAvailability: { startYear: 1650, endYear: 1850 },
        description: 'A leather-bound book',
        emoji: '📘',
        rarity: 'Uncommon',
        value: 200,
        weight: 2,
        wearable: false,
        stackable: false,
        category: 'Document',
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 0
    },
    {
        baseId: 'text_declaration_independence',
        name: 'Document: Declaration of Independence',
        title: 'Declaration of Independence',
        author: 'Thomas Jefferson et al.',
        originalDate: '1776 CE',
        excerpt: 'We hold these truths to be self-evident...',
        fullText: 'We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.',
        context: 'Document declaring American independence from British rule.',
        sourceType: 'political',
        language: 'English',
        culturalZone: 'AMERICAS',
        eraAvailability: { startYear: 1750, endYear: 1850 },
        description: 'A printed broadside',
        emoji: '📄',
        rarity: 'Rare',
        value: 350,
        weight: 1,
        wearable: false,
        stackable: false,
        category: 'Document',
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 0
    },
    {
        baseId: 'text_origin_species',
        name: 'Book: Origin of Species',
        title: 'On the Origin of Species',
        author: 'Charles Darwin',
        originalDate: '1859 CE',
        excerpt: 'There is grandeur in this view of life...',
        fullText: 'There is grandeur in this view of life, with its several powers, having been originally breathed into a few forms or into one; and that, whilst this planet has gone cycling on according to the fixed law of gravity, from so simple a beginning endless forms most beautiful and most wonderful have been, and are being, evolved.',
        context: 'Revolutionary scientific work establishing the theory of evolution.',
        sourceType: 'scientific',
        language: 'English',
        culturalZone: 'EUROPE',
        eraAvailability: { startYear: 1850, endYear: 2025 },
        description: 'A hardcover scientific treatise',
        emoji: '📗',
        rarity: 'Uncommon',
        value: 250,
        weight: 3,
        wearable: false,
        stackable: false,
        category: 'Document',
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 0
    },

    // NON-WESTERN TEXTS
    {
        baseId: 'text_aztec_codex',
        name: 'Codex: Florentine Codex',
        title: 'Historia General de las Cosas de Nueva España',
        author: 'Bernardino de Sahagún & Nahua scholars',
        originalDate: 'c. 1577 CE',
        excerpt: 'The gods assembled in Teotihuacan...',
        fullText: 'It is told that when yet all was in darkness, when yet no sun had shone and no dawn had come, the gods gathered themselves together and took counsel among themselves there in Teotihuacan.',
        context: 'Encyclopedic study of Aztec culture written in Nahuatl and Spanish.',
        sourceType: 'religious',
        language: 'Nahuatl/Spanish',
        culturalZone: 'AMERICAS',
        eraAvailability: { startYear: 1500, endYear: 1700 },
        description: 'An illustrated codex with pictographs',
        emoji: '📜',
        rarity: 'Ultra-rare',
        value: 500,
        weight: 2,
        wearable: false,
        stackable: false,
        category: 'Document',
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 0
    },
    {
        baseId: 'text_sundiata_epic',
        name: 'Manuscript: Epic of Sundiata',
        title: 'Sundiata Keita Epic',
        author: 'Mandinka Griots',
        originalDate: 'c. 1200 CE (oral tradition)',
        excerpt: 'Listen then, sons of Mali...',
        fullText: 'Listen then, sons of Mali, children of the black people, listen to my word, for I am going to tell you of Sundiata, the father of the Bright Country, of the savanna land, the ancestor of those who draw the bow.',
        context: 'Epic tale of the founder of the Mali Empire, preserved through oral tradition.',
        sourceType: 'literary',
        language: 'Mandinka',
        culturalZone: 'AFRICA',
        eraAvailability: { startYear: 1200, endYear: 1600 },
        description: 'A manuscript transcription of oral history',
        emoji: '📜',
        rarity: 'Rare',
        value: 300,
        weight: 1,
        wearable: false,
        stackable: false,
        category: 'Document',
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 0
    },
    {
        baseId: 'text_vedas',
        name: 'Palm Leaf: Rigveda',
        title: 'Rigveda Samhita',
        author: 'Unknown (Vedic tradition)',
        originalDate: 'c. 1500 BCE',
        excerpt: 'Agni I praise, the household priest...',
        fullText: 'Agni I praise, the household priest, the god, the sacrificial priest, the invoker, best bestower of wealth. Agni, worthy to be praised by ancient and by modern seers, may he bring the gods here.',
        context: 'Oldest of the four Vedas, sacred texts of Hinduism.',
        sourceType: 'religious',
        language: 'Vedic Sanskrit',
        culturalZone: 'SOUTH_ASIA',
        eraAvailability: { startYear: -2000, endYear: 2025 },
        description: 'Palm leaf manuscript with Sanskrit text',
        emoji: '📜',
        rarity: 'Ultra-rare',
        value: 450,
        weight: 1,
        wearable: false,
        stackable: false,
        category: 'Document',
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 0
    }
];

/**
 * Get primary sources appropriate for a given context
 */
export function getPrimarySourcesForContext(
    culturalZone: CulturalZone,
    year: number,
    sourceType?: 'religious' | 'political' | 'philosophical' | 'literary' | 'legal' | 'scientific',
    isHolyPlace?: boolean
): PrimarySourceText[] {
    return PRIMARY_SOURCES.filter(source => {
        // Check cultural zone
        if (source.culturalZone !== culturalZone) return false;
        
        // Check era availability
        if (year < source.eraAvailability.startYear || year > source.eraAvailability.endYear) {
            return false;
        }
        
        // If holy place, prioritize religious texts
        if (isHolyPlace && source.sourceType !== 'religious') {
            return Math.random() < 0.2; // 20% chance for non-religious texts in holy places
        }
        
        // Filter by source type if specified
        if (sourceType && source.sourceType !== sourceType) {
            return false;
        }
        
        return true;
    });
}

/**
 * Generate a random primary source for discovery
 */
export function generateRandomPrimarySource(
    culturalZone: CulturalZone,
    year: number,
    buildingType: 'holy_place' | 'palace' | 'library' | 'house'
): PrimarySourceText | null {
    let sourceType: typeof PRIMARY_SOURCES[0]['sourceType'] | undefined;
    
    // Determine likely source types based on building
    switch (buildingType) {
        case 'holy_place':
            sourceType = Math.random() < 0.8 ? 'religious' : 'philosophical';
            break;
        case 'palace':
            sourceType = Math.random() < 0.5 ? 'political' : Math.random() < 0.7 ? 'legal' : 'literary';
            break;
        case 'library':
            // Libraries can have any type
            break;
        case 'house':
            sourceType = Math.random() < 0.5 ? 'literary' : 'philosophical';
            break;
    }
    
    const validSources = getPrimarySourcesForContext(
        culturalZone,
        year,
        sourceType,
        buildingType === 'holy_place'
    );
    
    if (validSources.length === 0) return null;
    
    // Weight by rarity
    const weights = validSources.map(s => {
        switch (s.rarity) {
            case 'Common': return 10;
            case 'Uncommon': return 5;
            case 'Rare': return 2;
            case 'Ultra-rare': return 1;
            default: return 1;
        }
    });
    
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < validSources.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return validSources[i];
        }
    }
    
    return validSources[0];
}