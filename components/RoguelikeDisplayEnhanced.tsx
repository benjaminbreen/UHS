/**
 * components/RoguelikeDisplayEnhanced.tsx - Full-featured historically accurate roguelike
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PlayerCharacter, MapData, HistoricalEra, CulturalZone } from '../types';
import { ITEM_DEFINITIONS } from '../constants/index';
import { primarySourceService, PrimarySourceMetadata } from '../services/primarySourceService';
import { generateEncounterDialogue } from '../services/llmService';
// primarySourceService already imported above
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { ruinProgressService } from '../services/ruinProgressService';
import gameSoundsService from '../services/gameSoundsService';
import { generateRoguelikeDialogue, generateRoguelikeNpcs, generateNegotiationDialogue, getMaterialColors, getMaterialWallPattern } from '../services/roguelikeService';
import { generateSpecialMapContainerContents, ContainerContents } from '../services/specialMapContainerService';
import { OverlayObjectType } from '../types/core/tile';
import { SpecialMapArchetype } from '../types/specialMapTypes';
import { createItemInstance } from '../utils/inventoryUtils';
import ContainerModal from './ContainerModal';
import { getASCIIPortrait, framePortrait, getHealthBar, applyCulturalStyle } from '../services/asciiPortraitService';
import { ruinsEnemyService, RuinsEnemy } from '../services/ruinsEnemyService';
import { historicalEncounterService, HistoricalEncounter, EncounterChoice } from '../services/historicalEncounterService';
import { getRandomDiscovery, rollOutcome, DiscoveryPrompt } from '../constants/ruinDiscoveries';
import {
    generateRuinNPCs,
    getRuinAnimals,
    getNpcMotivation,
    storeBefriendedNpc,
    getBefriendedNpcsForLocation,
    isNpcBefriended,
    getRuinLocationId,
    PersistentNpc
} from '../services/ruinNpcService';
import { generateLLMRuinNPC } from '../services/llmRuinNpcService';
import { TileType, DungeonTile, DungeonPlayer, Entity } from '../engine/ruins/types';
import { evaluatePlayerMove } from '../engine/ruins/movement';
import { ruinsMetricsService } from '../services/ruinsMetricsService';
import { ruinsDataBridge } from '../services/ruinsDataBridge';
import { requestDiscoveryNarrative } from '../services/ruinsContentBroker';
import { DiscoveryTerminal } from './ruins/DiscoveryTerminal';
import { eventBus } from '../services/eventBus';
import { generateEnvironmentalDiscovery } from '../services/environmentalStorytellingService';

interface RoguelikeDisplayEnhancedProps {
    ruinType: {
        name: string;
        description: string;
        age: string;
        dangers: string[];
        material?: string;
        originalType?: string;
    };
    playerCharacter: PlayerCharacter;
    mapData?: MapData;
    onExit: () => void;
    onHealthChange?: (newHealth: number) => void;
    onInventoryAdd?: (item: any) => void;
    onGoldChange?: (newGold: number) => void;
    structureLocation?: [number, number]; // For tracking progress
    onPlayerDeath?: (deathInfo: any) => void; // Added for game over integration
}

// Sound effect that appears and fades
interface SoundEffect {
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
    opacity: number;
    duration: number;
    style?: 'normal' | 'shake' | 'float';
}

// Ambient text that appears at bottom of screen
interface AmbianceText {
    id: string;
    text: string;
    color: string;
    opacity: number;
    duration: number;
}

// Journal entry for environmental discoveries
interface JournalEntry {
    id: string;
    title: string;
    description: string;
    category: 'architecture' | 'mural' | 'evidence' | 'inscription' | 'artifact';
    timestamp: number;
    location: { depth: number; chamber: string };
}

// Attack animation for real-time combat
interface AttackAnimation {
    id: string;
    type: 'slash' | 'thrust' | 'arc' | 'projectile';
    x: number;
    y: number;
    direction: 'north' | 'south' | 'east' | 'west';
    frame: number;
    maxFrames: number;
    damage: number;
    color: string;
    pattern: { x: number; y: number }[]; // Tiles affected by attack
}

// Projectile for ranged combat
interface Projectile {
    id: string;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    speed: number; // tiles per second
    damage: number;
    type: 'arrow' | 'stone' | 'knife' | 'dart';
    symbol: string;
    color: string;
    piercing: boolean; // Goes through enemies?
    owner: 'player' | 'enemy'; // Who shot it
}

interface Room {
    x: number;
    y: number;
    width: number;
    height: number;
    type?: 'entrance' | 'treasure' | 'altar' | 'library' | 'guard' | 'storage';
}

// Dynamic dungeon sizing will be calculated based on viewport

// Get historically accurate food based on culture and era
const getHistoricalFood = (culturalZone: CulturalZone, era: HistoricalEra): string[] => {
    const foodByCulture: Record<string, string[]> = {
        'EUROPEAN': ['bread', 'cheese', 'ale', 'dried meat', 'apples', 'porridge'],
        'SOUTH_ASIAN': ['rice', 'lentils', 'chapati', 'mango', 'curry', 'lassi'],
        'MENA': ['dates', 'flatbread', 'olives', 'figs', 'lamb', 'yogurt'],
        'EAST_ASIAN': ['rice', 'tea', 'dumplings', 'fish', 'noodles', 'tofu'],
        'MESOAMERICAN': ['maize', 'beans', 'squash', 'chili', 'tamales', 'cacao'],
        'SUB_SAHARAN_AFRICAN': ['yam', 'cassava', 'plantain', 'millet', 'groundnuts', 'palm wine'],
        'NORTH_AMERICAN_PRE_COLUMBIAN': ['pemmican', 'berries', 'corn', 'squash', 'wild game', 'nuts'],
        'ANDEAN': ['potatoes', 'quinoa', 'llama meat', 'corn beer', 'coca leaves', 'chuño'],
        'OCEANIAN': ['taro', 'coconut', 'fish', 'breadfruit', 'sweet potato', 'kava']
    };
    
    return foodByCulture[culturalZone] || foodByCulture['EUROPEAN'];
};

// Emoji mapping for human NPCs
const getHumanEmoji = (type: string, subtype: string): string => {
    const emojiMap: Record<string, string> = {
        'hermit': '🧙‍♂️',
        'brigand': '🗡️',
        'vagabond': '🚶‍♂️',
        'tomb_robber': '💀',
        'sadhu': '🕉️',
        'dacoit': '⚔️',
        'vagrant': '👤',
        'ascetic': '🙏',
        'bedouin': '🐪',
        'bandit': '🏹',
        'monk': '👨‍🦲',
        'outcast': '😔',
        'looter': '💰',
        'refugee': '🏃‍♂️',
        'raider': '⚡',
        'hunter': '🏹',
        'outlaw': '🤠',
        'trapper': '🪤',
        'grave_robber': '⚱️',
        'huaquero': '⚱️',
        'shepherd': '🐑',
        'pirate': '🏴‍☠️',
        'castaway': '🏝️'
    };
    
    return emojiMap[type] || emojiMap[subtype] || '👤';
};

// Helper function to get animal emoji
const getAnimalEmoji = (type: string): string => {
    const emojiMap: Record<string, string> = {
        'rat': '🐀',
        'bat': '🦇',
        'spider': '🕷️',
        'snake': '🐍',
        'scorpion': '🦂',
        'centipede': '🐛',
        'monkey': '🐵',
        'lizard': '🦎',
        'vulture': '🦅',
        'wolf': '🐺',
        'bear': '🐻',
        'owl': '🦉'
    };
    return emojiMap[type] || '🐾';
};

// Helper function to get animal color
const getAnimalColor = (type: string): string => {
    const colorMap: Record<string, string> = {
        'rat': 'text-gray-400',
        'bat': 'text-purple-400',
        'spider': 'text-gray-500',
        'snake': 'text-green-500',
        'scorpion': 'text-yellow-500',
        'centipede': 'text-orange-400',
        'monkey': 'text-amber-500',
        'lizard': 'text-green-600',
        'vulture': 'text-gray-600',
        'wolf': 'text-gray-300',
        'bear': 'text-amber-700',
        'owl': 'text-gray-200'
    };
    return colorMap[type] || 'text-gray-400';
};
// Historical language mappings for accurate ruin discoveries
const ERA_LANGUAGES: Record<string, Record<HistoricalEra, string[]>> = {
    'EUROPEAN': {
        [HistoricalEra.PREHISTORY]: ['Proto-Indo-European symbols', 'Cave paintings', 'Pictographs'],
        [HistoricalEra.ANTIQUITY]: ['Latin', 'Ancient Greek', 'Etruscan', 'Celtic runes', 'Germanic runes'],
        [HistoricalEra.MEDIEVAL]: ['Latin', 'Old French', 'Middle English', 'Old German', 'Old Norse'],
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['Latin', 'Italian', 'French', 'Spanish', 'German', 'English'],
        [HistoricalEra.INDUSTRIAL_ERA]: ['English', 'French', 'German', 'Italian', 'Spanish'],
        [HistoricalEra.MODERN_ERA]: ['English', 'French', 'German', 'Italian', 'Spanish'],
        [HistoricalEra.FUTURE_ERA]: ['English', 'Digital records', 'Multi-lingual texts']
    },
    'MENA': {
        [HistoricalEra.PREHISTORY]: ['Proto-Semitic symbols', 'Petroglyphs', 'Cave art'],
        [HistoricalEra.ANTIQUITY]: ['Ancient Egyptian hieroglyphs', 'Akkadian cuneiform', 'Aramaic', 'Ancient Greek', 'Latin'],
        [HistoricalEra.MEDIEVAL]: ['Arabic', 'Persian', 'Turkish', 'Coptic', 'Hebrew'],
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['Arabic', 'Ottoman Turkish', 'Persian', 'Hebrew'],
        [HistoricalEra.INDUSTRIAL_ERA]: ['Arabic', 'Turkish', 'French', 'English'],
        [HistoricalEra.MODERN_ERA]: ['Arabic', 'Hebrew', 'Turkish', 'English', 'French'],
        [HistoricalEra.FUTURE_ERA]: ['Arabic', 'Hebrew', 'English', 'Digital archives']
    },
    'SOUTH_ASIAN': {
        [HistoricalEra.PREHISTORY]: ['Indus Valley symbols', 'Proto-Dravidian marks', 'Cave paintings'],
        [HistoricalEra.ANTIQUITY]: ['Sanskrit', 'Prakrit', 'Pali', 'Tamil Brahmi', 'Kharosthi'],
        [HistoricalEra.MEDIEVAL]: ['Sanskrit', 'Tamil', 'Telugu', 'Kannada', 'Persian'],
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['Sanskrit', 'Persian', 'Urdu', 'Tamil', 'Bengali'],
        [HistoricalEra.INDUSTRIAL_ERA]: ['English', 'Hindi', 'Urdu', 'Bengali', 'Tamil'],
        [HistoricalEra.MODERN_ERA]: ['Hindi', 'English', 'Urdu', 'Bengali', 'Tamil'],
        [HistoricalEra.FUTURE_ERA]: ['Hindi', 'English', 'Digital records']
    },
    'EAST_ASIAN': {
        [HistoricalEra.PREHISTORY]: ['Oracle bone script', 'Proto-writing', 'Pictographs'],
        [HistoricalEra.ANTIQUITY]: ['Classical Chinese', 'Oracle bone script', 'Bronze inscriptions'],
        [HistoricalEra.MEDIEVAL]: ['Classical Chinese', 'Japanese Kana', 'Korean Hanja'],
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['Classical Chinese', 'Japanese', 'Korean', 'Manchu'],
        [HistoricalEra.INDUSTRIAL_ERA]: ['Chinese', 'Japanese', 'Korean', 'English'],
        [HistoricalEra.MODERN_ERA]: ['Simplified Chinese', 'Japanese', 'Korean', 'English'],
        [HistoricalEra.FUTURE_ERA]: ['Chinese', 'Japanese', 'Korean', 'English', 'Digital archives']
    },
    'SUB_SAHARAN_AFRICAN': {
        [HistoricalEra.PREHISTORY]: ['Rock art', 'Symbolic marks', 'Petroglyphs'],
        [HistoricalEra.ANTIQUITY]: ['Meroitic', 'Ge\'ez', 'Ancient Berber', 'Greek'],
        [HistoricalEra.MEDIEVAL]: ['Arabic', 'Ge\'ez', 'Old Swahili', 'Ajami scripts'],
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['Arabic', 'Swahili', 'Amharic', 'Portuguese'],
        [HistoricalEra.INDUSTRIAL_ERA]: ['English', 'French', 'Arabic', 'Swahili', 'Amharic'],
        [HistoricalEra.MODERN_ERA]: ['English', 'French', 'Swahili', 'Arabic', 'Local languages'],
        [HistoricalEra.FUTURE_ERA]: ['English', 'Swahili', 'French', 'Digital records']
    },
    'NORTH_AMERICAN_PRE_COLUMBIAN': {
        [HistoricalEra.PREHISTORY]: ['Petroglyphs', 'Pictographs', 'Rock art'],
        [HistoricalEra.ANTIQUITY]: ['Petroglyphs', 'Pottery symbols', 'Wampum patterns'],
        [HistoricalEra.MEDIEVAL]: ['Pictographs', 'Pottery marks', 'Wampum', 'Birchbark scrolls'],
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['Native pictographs', 'Spanish', 'French', 'English'],
        [HistoricalEra.INDUSTRIAL_ERA]: ['English', 'Spanish', 'French', 'Native languages in Latin script'],
        [HistoricalEra.MODERN_ERA]: ['English', 'Spanish', 'French', 'Native language revival texts'],
        [HistoricalEra.FUTURE_ERA]: ['English', 'Spanish', 'Digital archives', 'Native language databases']
    },
    'NORTH_AMERICAN_COLONIAL': {
        [HistoricalEra.PREHISTORY]: ['N/A - Colonial period only'],
        [HistoricalEra.ANTIQUITY]: ['N/A - Colonial period only'],
        [HistoricalEra.MEDIEVAL]: ['N/A - Colonial period only'],
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['English', 'Spanish', 'French', 'Dutch', 'Native languages'],
        [HistoricalEra.INDUSTRIAL_ERA]: ['English', 'Spanish', 'French'],
        [HistoricalEra.MODERN_ERA]: ['English', 'Spanish', 'French'],
        [HistoricalEra.FUTURE_ERA]: ['English', 'Spanish', 'Digital records']
    },
    'SOUTH_AMERICAN': {
        [HistoricalEra.PREHISTORY]: ['Petroglyphs', 'Cave paintings', 'Symbolic marks'],
        [HistoricalEra.ANTIQUITY]: ['Quipu', 'Pottery symbols', 'Textile patterns'],
        [HistoricalEra.MEDIEVAL]: ['Quipu', 'Quechua glyphs', 'Aymara symbols'],
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['Spanish', 'Portuguese', 'Quechua', 'Quipu'],
        [HistoricalEra.INDUSTRIAL_ERA]: ['Spanish', 'Portuguese', 'English'],
        [HistoricalEra.MODERN_ERA]: ['Spanish', 'Portuguese', 'English', 'Indigenous languages'],
        [HistoricalEra.FUTURE_ERA]: ['Spanish', 'Portuguese', 'English', 'Digital archives']
    },
    'OCEANIA': {
        [HistoricalEra.PREHISTORY]: ['Rock art', 'Petroglyphs', 'Cave paintings'],
        [HistoricalEra.ANTIQUITY]: ['Proto-Polynesian symbols', 'Lapita pottery marks'],
        [HistoricalEra.MEDIEVAL]: ['Rongorongo', 'Tattoo patterns', 'Oral traditions transcribed'],
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['Native oral traditions', 'Dutch', 'Spanish', 'English'],
        [HistoricalEra.INDUSTRIAL_ERA]: ['English', 'French', 'German', 'Native languages in Latin script'],
        [HistoricalEra.MODERN_ERA]: ['English', 'French', 'Native languages', 'Pidgin'],
        [HistoricalEra.FUTURE_ERA]: ['English', 'Native language revival', 'Digital archives']
    }
};

// Helper function to calculate ruin construction date
const calculateRuinConstructionPeriod = (
    ruinAge: string,
    currentYear: number
): { year: number; era: HistoricalEra } => {
    // Parse age from string like "500 year old" or just "500"
    const ageMatch = ruinAge.match(/\d+/);
    const ageYears = ageMatch ? parseInt(ageMatch[0]) : 500;

    const constructionYear = currentYear - ageYears;

    // Determine construction era based on year
    let constructionEra: HistoricalEra;
    if (constructionYear < -1000) {
        constructionEra = HistoricalEra.PREHISTORY;
    } else if (constructionYear < 500) {
        constructionEra = HistoricalEra.ANTIQUITY;
    } else if (constructionYear < 1450) {
        constructionEra = HistoricalEra.MEDIEVAL;
    } else if (constructionYear < 1800) {
        constructionEra = HistoricalEra.RENAISSANCE_EARLY_MODERN;
    } else if (constructionYear < 1920) {
        constructionEra = HistoricalEra.INDUSTRIAL_ERA;
    } else if (constructionYear < 2000) {
        constructionEra = HistoricalEra.MODERN_ERA;
    } else {
        constructionEra = HistoricalEra.FUTURE_ERA;
    }

    return { year: constructionYear, era: constructionEra };
};

// Helper function to get appropriate languages for ruins
const getLanguagesForRuin = (culturalZone: CulturalZone, constructionEra: HistoricalEra): string[] => {
    const scripts = ruinsDataBridge.getScripts({ culturalZone, era: constructionEra });
    if (scripts.length > 0) {
        return scripts.map(script => script.displayName);
    }
    const fallback = ERA_LANGUAGES[culturalZone]?.[constructionEra];
    if (fallback && fallback.length > 0) {
        return fallback;
    }
    return ['Unknown script'];
};

// DEPRECATED - Kept for backwards compatibility
const getHistoricalEntities = (culturalZone: CulturalZone, era: HistoricalEra): any => {
    // Common animals that might inhabit ruins
    const commonAnimals = [
        { subtype: 'rat', symbol: 'r', color: 'text-gray-400', hostile: false, hp: 2, attack: 1, defense: 0, accuracy: 50, evasion: 30, level: 1, description: 'A scurrying rat' },
        { subtype: 'bat', symbol: 'b', color: 'text-purple-400', hostile: false, hp: 1, attack: 1, defense: 0, accuracy: 40, evasion: 60, level: 1, description: 'A fluttering bat' },
        { subtype: 'spider', symbol: 's', color: 'text-gray-500', hostile: Math.random() > 0.5, hp: 3, attack: 2, defense: 1, accuracy: 60, evasion: 20, level: 1, description: 'A large spider' }
    ];

    const entities: Record<string, any> = {
        'EUROPEAN': {
            animals: [
                ...commonAnimals,
                { subtype: 'wolf', symbol: 'w', color: 'text-gray-300', hostile: true, hp: 15, attack: 5, defense: 2, accuracy: 70, evasion: 20, level: 3, description: 'A hungry wolf' },
                { subtype: 'boar', symbol: 'B', color: 'text-amber-600', hostile: true, hp: 20, attack: 4, defense: 4, accuracy: 60, evasion: 10, level: 4, description: 'A wild boar' },
                { subtype: 'fox', symbol: 'f', color: 'text-orange-400', hostile: false, hp: 8, attack: 2, defense: 1, accuracy: 80, evasion: 40, level: 2, description: 'A curious fox' }
            ],
            humans: [
                { type: 'hermit', subtype: 'hermit', symbol: 'H', color: 'text-amber-300', hostile: false, hp: 20, attack: 3, defense: 2, accuracy: 50, evasion: 15, level: 2, description: 'A solitary hermit' },
                { type: 'brigand', subtype: 'brigand', symbol: 'b', color: 'text-red-400', hostile: true, hp: 25, attack: 6, defense: 3, accuracy: 65, evasion: 20, level: 4, description: 'A desperate brigand' },
                { type: 'vagabond', subtype: 'vagabond', symbol: 'v', color: 'text-gray-300', hostile: Math.random() > 0.7, hp: 15, attack: 3, defense: 2, accuracy: 55, evasion: 25, level: 2, description: 'A wandering vagabond' },
                { type: 'tomb_robber', subtype: 'tomb_robber', symbol: 'T', color: 'text-yellow-600', hostile: true, hp: 20, attack: 5, defense: 2, accuracy: 70, evasion: 30, level: 3, description: 'A greedy tomb robber' }
            ]
        },
        'SOUTH_ASIAN': {
            animals: [
                ...commonAnimals,
                { subtype: 'monkey', symbol: 'm', color: 'text-amber-400', hostile: false, hp: 8, attack: 3, defense: 1, accuracy: 75, evasion: 35, level: 2, description: 'A mischievous monkey' },
                { subtype: 'cobra', symbol: 'C', color: 'text-green-400', hostile: true, hp: 12, attack: 6, defense: 1, accuracy: 80, evasion: 25, level: 3, description: 'A hooded cobra' },
                { subtype: 'tiger', symbol: 'T', color: 'text-orange-500', hostile: true, hp: 30, attack: 9, defense: 3, accuracy: 75, evasion: 15, level: 6, description: 'A prowling tiger' },
                { subtype: 'peacock', symbol: 'p', color: 'text-cyan-400', hostile: false, hp: 5, attack: 1, defense: 1, accuracy: 40, evasion: 30, level: 1, description: 'A beautiful peacock' }
            ],
            humans: [
                { type: 'hermit', subtype: 'sadhu', symbol: 'S', color: 'text-orange-300', hostile: false, hp: 20, attack: 2, defense: 3, accuracy: 40, evasion: 20, level: 2, description: 'An ascetic sadhu' },
                { type: 'dacoit', subtype: 'dacoit', symbol: 'd', color: 'text-red-500', hostile: true, hp: 28, attack: 7, defense: 3, accuracy: 70, evasion: 20, level: 5, description: 'A dangerous dacoit' },
                { type: 'vagrant', subtype: 'vagrant', symbol: 'v', color: 'text-gray-400', hostile: false, hp: 12, attack: 2, defense: 1, accuracy: 45, evasion: 30, level: 1, description: 'A poor vagrant' }
            ]
        },
        'MENA': {
            animals: [
                ...commonAnimals,
                { subtype: 'scorpion', symbol: 'c', color: 'text-yellow-500', hostile: true, hp: 8, attack: 4, defense: 2, accuracy: 70, evasion: 15, level: 2, description: 'A venomous scorpion' },
                { subtype: 'viper', symbol: 'v', color: 'text-green-300', hostile: true, hp: 10, attack: 5, defense: 1, accuracy: 75, evasion: 30, level: 3, description: 'A desert viper' },
                { subtype: 'hyena', symbol: 'h', color: 'text-amber-700', hostile: true, hp: 18, attack: 6, defense: 3, accuracy: 65, evasion: 20, level: 4, description: 'A scavenging hyena' },
                { subtype: 'lizard', symbol: 'l', color: 'text-green-600', hostile: false, hp: 4, attack: 1, defense: 2, accuracy: 50, evasion: 40, level: 1, description: 'A desert lizard' }
            ],
            humans: [
                { type: 'hermit', subtype: 'ascetic', symbol: 'A', color: 'text-cyan-300', hostile: false, hp: 18, attack: 2, defense: 3, accuracy: 45, evasion: 20, level: 2, description: 'A desert ascetic' },
                { type: 'bedouin', subtype: 'bedouin', symbol: 'B', color: 'text-amber-400', hostile: Math.random() > 0.6, hp: 22, attack: 5, defense: 3, accuracy: 65, evasion: 25, level: 3, description: 'A bedouin wanderer' },
                { type: 'bandit', subtype: 'bandit', symbol: 'b', color: 'text-red-400', hostile: true, hp: 30, attack: 7, defense: 4, accuracy: 70, evasion: 15, level: 5, description: 'A desert bandit' }
            ]
        },
        'EAST_ASIAN': {
            animals: [
                ...commonAnimals,
                { subtype: 'crane', symbol: 'c', color: 'text-white', hostile: false, hp: 8, attack: 2, defense: 1, accuracy: 60, evasion: 35, level: 2, description: 'A graceful crane' },
                { subtype: 'tiger', symbol: 'T', color: 'text-orange-500', hostile: true, hp: 35, attack: 10, defense: 4, accuracy: 75, evasion: 10, level: 7, description: 'A fearsome tiger' },
                { subtype: 'snake', symbol: 's', color: 'text-green-400', hostile: true, hp: 10, attack: 5, defense: 1, accuracy: 80, evasion: 30, level: 3, description: 'A venomous snake' },
                { subtype: 'monkey', symbol: 'm', color: 'text-brown-400', hostile: false, hp: 10, attack: 3, defense: 2, accuracy: 70, evasion: 40, level: 2, description: 'A clever monkey' }
            ],
            humans: [
                { type: 'hermit', subtype: 'monk', symbol: 'M', color: 'text-purple-300', hostile: false, hp: 25, attack: 3, defense: 4, accuracy: 50, evasion: 20, level: 3, description: 'A mountain monk' },
                { type: 'bandit', subtype: 'bandit', symbol: 'b', color: 'text-red-400', hostile: true, hp: 26, attack: 7, defense: 3, accuracy: 68, evasion: 22, level: 4, description: 'A mountain bandit' },
                { type: 'outcast', subtype: 'outcast', symbol: 'o', color: 'text-gray-400', hostile: Math.random() > 0.5, hp: 15, attack: 4, defense: 2, accuracy: 55, evasion: 25, level: 2, description: 'A social outcast' }
            ]
        },
        'MESOAMERICAN': {
            animals: [
                ...commonAnimals,
                { subtype: 'jaguar', symbol: 'J', color: 'text-yellow-600', hostile: true, hp: 40, attack: 11, defense: 5, accuracy: 80, evasion: 15, level: 8, description: 'A prowling jaguar' },
                { subtype: 'quetzal', symbol: 'q', color: 'text-green-400', hostile: false, hp: 6, attack: 1, defense: 1, accuracy: 50, evasion: 45, level: 1, description: 'A colorful quetzal bird' },
                { subtype: 'spider_monkey', symbol: 'm', color: 'text-amber-500', hostile: false, hp: 10, attack: 3, defense: 2, accuracy: 70, evasion: 40, level: 2, description: 'A spider monkey' },
                { subtype: 'ocelot', symbol: 'o', color: 'text-orange-400', hostile: true, hp: 20, attack: 7, defense: 3, accuracy: 75, evasion: 30, level: 5, description: 'A spotted ocelot' }
            ],
            humans: [
                { type: 'hermit', subtype: 'hermit', symbol: 'H', color: 'text-green-300', hostile: false, hp: 20, attack: 3, defense: 3, accuracy: 50, evasion: 20, level: 2, description: 'A jungle hermit' },
                { type: 'looter', subtype: 'looter', symbol: 'L', color: 'text-yellow-500', hostile: true, hp: 24, attack: 6, defense: 3, accuracy: 65, evasion: 25, level: 4, description: 'A treasure looter' },
                { type: 'refugee', subtype: 'refugee', symbol: 'r', color: 'text-gray-400', hostile: false, hp: 10, attack: 2, defense: 1, accuracy: 40, evasion: 30, level: 1, description: 'A displaced refugee' }
            ]
        },
        'SUB_SAHARAN_AFRICAN': {
            animals: [
                ...commonAnimals,
                { subtype: 'lion', symbol: 'L', color: 'text-yellow-500', hostile: true, hp: 35, attack: 8, defense: 4, accuracy: 70, evasion: 15, level: 6, description: 'A mighty lion' },
                { subtype: 'hyena', symbol: 'h', color: 'text-amber-700', hostile: true, hp: 18, attack: 6, defense: 3, accuracy: 65, evasion: 20, level: 4, description: 'A laughing hyena' },
                { subtype: 'baboon', symbol: 'b', color: 'text-brown-400', hostile: Math.random() > 0.6, hp: 12, attack: 4, defense: 2, accuracy: 60, evasion: 25, level: 3, description: 'An aggressive baboon' },
                { subtype: 'snake', symbol: 's', color: 'text-green-500', hostile: true, hp: 8, attack: 5, defense: 1, accuracy: 75, evasion: 35, level: 2, description: 'A black mamba' }
            ],
            humans: [
                { type: 'hermit', subtype: 'hermit', symbol: 'H', color: 'text-amber-300', hostile: false, hp: 22, attack: 3, defense: 3, accuracy: 50, evasion: 20, level: 2, description: 'A solitary hermit' },
                { type: 'raider', subtype: 'raider', symbol: 'R', color: 'text-red-500', hostile: true, hp: 28, attack: 7, defense: 4, accuracy: 70, evasion: 18, level: 5, description: 'A fierce raider' },
                { type: 'hunter', subtype: 'hunter', symbol: 'h', color: 'text-green-600', hostile: Math.random() > 0.7, hp: 18, attack: 5, defense: 2, accuracy: 75, evasion: 25, level: 3, description: 'A skilled hunter' }
            ]
        },
        'NORTH_AMERICAN_PRE_COLUMBIAN': {
            animals: [
                ...commonAnimals,
                { subtype: 'bear', symbol: 'B', color: 'text-brown-500', hostile: true, hp: 30, attack: 7, defense: 5, accuracy: 60, evasion: 10, level: 5, description: 'A black bear' },
                { subtype: 'wolf', symbol: 'w', color: 'text-gray-400', hostile: true, hp: 15, attack: 5, defense: 2, accuracy: 70, evasion: 20, level: 3, description: 'A grey wolf' },
                { subtype: 'eagle', symbol: 'E', color: 'text-white', hostile: false, hp: 8, attack: 3, defense: 1, accuracy: 80, evasion: 40, level: 2, description: 'A soaring eagle' },
                { subtype: 'cougar', symbol: 'C', color: 'text-amber-600', hostile: true, hp: 25, attack: 8, defense: 3, accuracy: 75, evasion: 25, level: 5, description: 'A mountain cougar' }
            ],
            humans: [
                { type: 'hermit', subtype: 'hermit', symbol: 'H', color: 'text-gray-300', hostile: false, hp: 20, attack: 3, defense: 3, accuracy: 50, evasion: 20, level: 2, description: 'A wilderness hermit' },
                { type: 'outlaw', subtype: 'outlaw', symbol: 'O', color: 'text-red-400', hostile: true, hp: 25, attack: 6, defense: 3, accuracy: 65, evasion: 20, level: 4, description: 'A dangerous outlaw' },
                { type: 'trapper', subtype: 'trapper', symbol: 't', color: 'text-brown-400', hostile: Math.random() > 0.6, hp: 18, attack: 4, defense: 2, accuracy: 70, evasion: 25, level: 3, description: 'A fur trapper' }
            ]
        },
        'ANDEAN': {
            animals: [
                ...commonAnimals,
                { subtype: 'llama', symbol: 'L', color: 'text-gray-300', hostile: false, hp: 15, attack: 2, defense: 3, accuracy: 40, evasion: 15, level: 2, description: 'A woolly llama' },
                { subtype: 'condor', symbol: 'C', color: 'text-gray-600', hostile: false, hp: 10, attack: 3, defense: 1, accuracy: 70, evasion: 35, level: 2, description: 'An Andean condor' },
                { subtype: 'puma', symbol: 'P', color: 'text-amber-500', hostile: true, hp: 28, attack: 8, defense: 3, accuracy: 75, evasion: 20, level: 5, description: 'A mountain puma' },
                { subtype: 'vicuña', symbol: 'v', color: 'text-amber-400', hostile: false, hp: 8, attack: 1, defense: 2, accuracy: 50, evasion: 40, level: 1, description: 'A swift vicuña' }
            ],
            humans: [
                { type: 'hermit', subtype: 'hermit', symbol: 'H', color: 'text-blue-300', hostile: false, hp: 20, attack: 3, defense: 3, accuracy: 50, evasion: 20, level: 2, description: 'A mountain hermit' },
                { type: 'grave_robber', subtype: 'huaquero', symbol: 'G', color: 'text-yellow-600', hostile: true, hp: 22, attack: 5, defense: 2, accuracy: 65, evasion: 25, level: 3, description: 'A huaquero (grave robber)' },
                { type: 'shepherd', subtype: 'shepherd', symbol: 's', color: 'text-gray-400', hostile: false, hp: 15, attack: 3, defense: 2, accuracy: 55, evasion: 20, level: 2, description: 'A highland shepherd' }
            ]
        },
        'OCEANIAN': {
            animals: [
                ...commonAnimals,
                { subtype: 'komodo', symbol: 'K', color: 'text-green-700', hostile: true, hp: 40, attack: 10, defense: 6, accuracy: 65, evasion: 10, level: 7, description: 'A massive Komodo dragon - sacred to locals' },
                { subtype: 'python', symbol: 'S', color: 'text-yellow-600', hostile: true, hp: 25, attack: 7, defense: 4, accuracy: 70, evasion: 15, level: 5, description: 'A reticulated python coiled in shadows' },
                { subtype: 'hornbill', symbol: 'h', color: 'text-orange-400', hostile: false, hp: 6, attack: 1, defense: 1, accuracy: 60, evasion: 45, level: 1, description: 'A rhinoceros hornbill - symbol of vision' },
                { subtype: 'macaque', symbol: 'm', color: 'text-brown-400', hostile: Math.random() > 0.6, hp: 12, attack: 4, defense: 2, accuracy: 70, evasion: 35, level: 3, description: 'A long-tailed macaque, clever and quick' }
            ],
            humans: [
                { type: 'temple_guardian', subtype: 'guardian', symbol: 'G', color: 'text-amber-400', hostile: true, hp: 35, attack: 8, defense: 5, accuracy: 70, evasion: 15, level: 5, description: 'Temple guardian wielding a keris dagger' },
                { type: 'dutch_explorer', subtype: 'colonial', symbol: 'D', color: 'text-blue-400', hostile: Math.random() > 0.5, hp: 28, attack: 7, defense: 4, accuracy: 75, evasion: 20, level: 4, description: 'VOC explorer seeking spices and gold' },
                { type: 'dukun', subtype: 'shaman', symbol: 'd', color: 'text-purple-400', hostile: false, hp: 22, attack: 4, defense: 3, accuracy: 60, evasion: 25, level: 3, description: 'Local dukun (shaman) practicing mysticism' },
                { type: 'bugis_pirate', subtype: 'pirate', symbol: 'B', color: 'text-red-500', hostile: true, hp: 30, attack: 9, defense: 3, accuracy: 70, evasion: 25, level: 5, description: 'Feared Bugis sea raider with curved blade' },
                { type: 'javanese_scholar', subtype: 'scholar', symbol: 's', color: 'text-cyan-400', hostile: false, hp: 18, attack: 2, defense: 2, accuracy: 50, evasion: 20, level: 2, description: 'Scholar studying ancient palm manuscripts' },
                { type: 'chinese_trader', subtype: 'trader', symbol: 'T', color: 'text-yellow-500', hostile: false, hp: 20, attack: 3, defense: 3, accuracy: 60, evasion: 30, level: 3, description: 'Ming dynasty trader with porcelain wares' }
            ]
        }
    };

    // Default fallback
    const defaultEntities = entities['EUROPEAN'];
    return entities[culturalZone] || defaultEntities;
};

const RoguelikeDisplayEnhanced: React.FC<RoguelikeDisplayEnhancedProps> = ({
    ruinType,
    playerCharacter,
    mapData,
    onExit,
    onHealthChange,
    onInventoryAdd,
    onGoldChange,
    structureLocation,
    onPlayerDeath
}) => {
    // Parse cultural context from map data
    const culturalContext = useMemo(() => {
        if (!mapData) return { era: HistoricalEra.MEDIEVAL, culturalZone: 'EUROPEAN' as CulturalZone };
        const dateInfo = parseDateString(mapData.timeSlice || '1500');
        const culture = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
        return { era: dateInfo.era as HistoricalEra, culturalZone: culture as CulturalZone };
    }, [mapData]);

    // Extract year for historical context
    const year = useMemo(() => {
        if (!mapData) return 1500;
        const dateInfo = parseDateString(mapData.timeSlice || '1500');
        return dateInfo.year;
    }, [mapData]);

    const [dungeon, setDungeon] = useState<DungeonTile[][]>([]);
    const [entities, setEntities] = useState<Entity[]>([]);
    const [player, setPlayer] = useState<DungeonPlayer>({
        x: 0,
        y: 0,
        hp: playerCharacter.health || 100,
        maxHp: playerCharacter.maxHealth || 100,
        gold: 0,
        level: playerCharacter.stats?.level || 1,
        attack: 10 + (playerCharacter.stats?.strength || 0) * 2,
        defense: 5 + (playerCharacter.stats?.endurance || 0),
        accuracy: 70 + (playerCharacter.stats?.dexterity || 0) * 2,
        evasion: 10 + (playerCharacter.stats?.dexterity || 0),
        inventory: [],
        manuscripts: [],
        weapon: undefined,
        armor: undefined
    });
    const [gameMessages, setGameMessages] = useState<string[]>(['You enter the ancient ruins...']);
    const [discoveries, setDiscoveries] = useState<string[]>([]);
    const [showingDiscovery, setShowingDiscovery] = useState(false);
    const [currentDiscoveryText, setCurrentDiscoveryText] = useState<string>('');
    const [turnCount, setTurnCount] = useState(0);
    const [currentDialogue, setCurrentDialogue] = useState<{ entity: Entity; message: string } | null>(null);
    const [zoomLevel, setZoomLevel] = useState(20); // Font size for the map
    const [showHelp, setShowHelp] = useState(false); // Help overlay visibility
    const [showSourceReader, setShowSourceReader] = useState(false); // Primary source reader
    const [selectedSource, setSelectedSource] = useState<PrimarySourceMetadata | null>(null);
    const [gameLogExpanded, setGameLogExpanded] = useState(false); // Game log expansion state

    // Historical encounter state
    const [currentEncounter, setCurrentEncounter] = useState<HistoricalEncounter | null>(null);
    const [showEncounterModal, setShowEncounterModal] = useState(false);
    const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
    const [encounterOutcome, setEncounterOutcome] = useState<string | null>(null);

    // Simple discovery system state
    const [currentDiscoveryPrompt, setCurrentDiscoveryPrompt] = useState<any | null>(null);
    const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
    const [discoveryLocation, setDiscoveryLocation] = useState<{ x: number; y: number } | null>(null);

    const [dungeonDimensions, setDungeonDimensions] = useState({ width: 60, height: 30 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [playerInput, setPlayerInput] = useState(''); // For NPC dialogue input

    const [currentChamber, setCurrentChamber] = useState<string>('Entrance');
    const [currentDepth, setCurrentDepth] = useState<number>(1);
    const structureId = structureLocation && structureLocation.length >= 2 ? `${structureLocation[0]}-${structureLocation[1]}` : 'default-ruin';

    const runIdRef = useRef<string>('');
    const runStartRef = useRef<number>(0);
    const currentDepthRef = useRef(currentDepth);

    useEffect(() => {
        currentDepthRef.current = currentDepth;
    }, [currentDepth]);

    useEffect(() => {
        const runId = `ruin-${structureId}-${Date.now()}`;
        runIdRef.current = runId;
        runStartRef.current = Date.now();
        eventBus.emit('ruins.roguelike.active', true);
        ruinsMetricsService.record('ruins.run.start', {
            runId,
            ruinId: structureId,
            ruinName: ruinType.name,
            era: culturalContext.era,
            culturalZone: culturalContext.culturalZone
        });

        return () => {
            const durationMs = Date.now() - runStartRef.current;
            ruinsMetricsService.record('ruins.run.end', {
                runId,
                ruinId: structureId,
                durationMs,
                depth: currentDepthRef.current
            });
            eventBus.emit('ruins.roguelike.active', false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false); // Waiting for LLM response
    
    // Visual effects state
    const [particles, setParticles] = useState<Array<{x: number, y: number, char: string, color: string, lifetime: number, vx: number, vy: number}>>([]);
    const [lightSources, setLightSources] = useState<Array<{x: number, y: number, radius: number, color: string, flicker: boolean}>>([]);
    const animationFrameRef = useRef<number>();
    
    const [combatTarget, setCombatTarget] = useState<Entity | null>(null);
    const [discoveredSources, setDiscoveredSources] = useState<PrimarySourceMetadata[]>([]);

    // Journal and examination system
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [currentExamination, setCurrentExamination] = useState<JournalEntry | null>(null);
    const [showExaminationModal, setShowExaminationModal] = useState(false);

    // Sound effects and ambiance
    const [soundEffects, setSoundEffects] = useState<SoundEffect[]>([]);
    const [ambianceTexts, setAmbianceTexts] = useState<AmbianceText[]>([]);
    const soundEffectIdRef = useRef(0);
    const ambianceIdRef = useRef(0);
    
    // Real-time combat state
    const [attackCooldown, setAttackCooldown] = useState(0);
    const [activeAttacks, setActiveAttacks] = useState<AttackAnimation[]>([]);
    const [weaponSwinging, setWeaponSwinging] = useState(false);
    const attackIdRef = useRef(0);
    const attackCooldownRef = useRef(0);
    const weaponSwingingRef = useRef(false);
    
    // Projectile system
    const [projectiles, setProjectiles] = useState<Projectile[]>([]);
    const projectileIdRef = useRef(0);
    
    // Charge attack system
    const [chargingAttack, setChargingAttack] = useState(false);
    const [chargeLevel, setChargeLevel] = useState(0);
    const [chargeDirection, setChargeDirection] = useState<string | null>(null);
    const [chargeStartTime, setChargeStartTime] = useState<number | null>(null);

    // Add message to game log
    const addMessage = useCallback((message: string) => {
        setGameMessages(prev => [...prev.slice(-4), message]);
    }, []);

    // Handle player dialogue response to NPC
    const handlePlayerDialogueResponse = useCallback(async () => {
        if (!currentDialogue || !playerInput.trim() || isWaitingForResponse) return;

        setIsWaitingForResponse(true);

        try {
            // Get location ID for persistence
            const locationId = getRuinLocationId(
                structureLocation?.[0] || 0,
                structureLocation?.[1] || 0,
                currentDepth
            );

            // Create NPC entity structure for the dialogue function
            const npcEntity = {
                name: currentDialogue.entity.name,
                profession: currentDialogue.entity.subtype || currentDialogue.entity.type,
                isHostile: currentDialogue.entity.hostile,
                speciesName: currentDialogue.entity.type === 'animal' ? currentDialogue.entity.subtype : undefined
            };

            // Generate NPC response using LLM
            const dialogueResult = await generateEncounterDialogue(
                npcEntity as any,
                [
                    { speaker: 'npc', text: currentDialogue.message },
                    { speaker: 'player', text: playerInput }
                ],
                playerInput,
                playerCharacter,
                [], // No other NPCs in ruins context
                mapData || {
                    era: culturalContext.era,
                    culturalZone: culturalContext.culturalZone,
                    continent: 'Unknown',
                    mapAreaName: ruinType.name,
                    timeSlice: `${1500}` // Default historical time
                } as any,
                false // Use normal language, not real historical languages
            );

            const response = dialogueResult.text;

            // Update the dialogue with the NPC's response
            setCurrentDialogue(prev => prev ? {
                ...prev,
                message: response
            } : null);

            // Clear player input
            setPlayerInput('');

            // Add to game log
            addMessage(`You: "${playerInput}"`);
            addMessage(`${currentDialogue.entity.name}: "${response}"`);

            // Handle dialogue results
            if (dialogueResult.shouldLeave) {
                // NPC wants to leave
                setEntities(prev => prev.filter(e => e.id !== currentDialogue.entity.id));
                addMessage(`${currentDialogue.entity.name} walks away.`);
                setCurrentDialogue(null);
                setPlayerInput('');
                setIsWaitingForResponse(false);
                return;
            }

            if (dialogueResult.shouldAttack) {
                // NPC becomes hostile
                setEntities(prev => prev.map(e =>
                    e.id === currentDialogue.entity.id
                        ? { ...e, hostile: true }
                        : e
                ));
                addMessage(`${currentDialogue.entity.name} becomes hostile!`);
                setCurrentDialogue(null);
                setPlayerInput('');
                setIsWaitingForResponse(false);
                return;
            }

            // If NPC becomes friendly through dialogue, update their state
            if (currentDialogue.entity.hostile && (
                response.toLowerCase().includes('friend') ||
                response.toLowerCase().includes('peace') ||
                response.toLowerCase().includes('forgive') ||
                dialogueResult.reputationChange && dialogueResult.reputationChange > 0
            )) {
                setEntities(prev => prev.map(e =>
                    e.id === currentDialogue.entity.id
                        ? { ...e, hostile: false }
                        : e
                ));

                // Store as befriended NPC
                storeBefriendedNpc(
                    currentDialogue.entity as any,
                    locationId,
                    culturalContext.culturalZone,
                    culturalContext.era
                );
            }
        } catch (error) {
            console.error('Error generating NPC response:', error);
            addMessage('The NPC seems confused by your words...');
        } finally {
            setIsWaitingForResponse(false);
        }
    }, [currentDialogue, playerInput, isWaitingForResponse, structureLocation, currentDepth,
        culturalContext, ruinType, playerCharacter, addMessage]);


    // Track which rooms have been entered for chamber discovery
    const [discoveredRooms, setDiscoveredRooms] = useState<Set<string>>(new Set());
    const [currentRooms, setCurrentRooms] = useState<Room[]>([]);
    const [playerCurrentRoom, setPlayerCurrentRoom] = useState<string>('entrance');
    
    // Viewport state for scrolling map
    const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
    const VIEWPORT_WIDTH = 25;
    const VIEWPORT_HEIGHT = 15;
    
    // Update viewport to keep player visible within 2 squares of edge
    const updateViewport = useCallback((playerX: number, playerY: number) => {
        setViewportOffset(prevOffset => {
            // Use dungeon dimensions from state to avoid dependency on dungeon array
            const dungeonWidth = dungeonDimensions.width;
            const dungeonHeight = dungeonDimensions.height;
            
            const buffer = 2; // Keep player 2 squares from edge
            let newX = prevOffset.x;
            let newY = prevOffset.y;
            
            // Check if player is too close to left edge
            if (playerX - prevOffset.x < buffer) {
                newX = Math.max(0, playerX - buffer);
            }
            // Check if player is too close to right edge
            else if (playerX - prevOffset.x >= VIEWPORT_WIDTH - buffer) {
                newX = Math.min(dungeonWidth - VIEWPORT_WIDTH, playerX - VIEWPORT_WIDTH + buffer + 1);
            }
            
            // Check if player is too close to top edge
            if (playerY - prevOffset.y < buffer) {
                newY = Math.max(0, playerY - buffer);
            }
            // Check if player is too close to bottom edge
            else if (playerY - prevOffset.y >= VIEWPORT_HEIGHT - buffer) {
                newY = Math.min(dungeonHeight - VIEWPORT_HEIGHT, playerY - VIEWPORT_HEIGHT + buffer + 1);
            }
            
            // Only update if offset actually changed
            if (newX !== prevOffset.x || newY !== prevOffset.y) {
                return { x: newX, y: newY };
            }
            return prevOffset;
        });
    }, [dungeonDimensions.width, dungeonDimensions.height, VIEWPORT_WIDTH, VIEWPORT_HEIGHT]);
    
    // Removed puzzle state tracking - no longer needed
    
    // Create sound effect at position
    const createSoundEffect = useCallback((text: string, x: number, y: number, color: string = '#ff9500', style: 'normal' | 'shake' | 'float' = 'normal') => {
        const id = `sound_${soundEffectIdRef.current++}`;
        const duration = style === 'shake' ? 1500 : style === 'float' ? 2000 : 2500;
        
        setSoundEffects(prev => [...prev, {
            id,
            text,
            x,
            y,
            color,
            opacity: 1,
            duration,
            style
        }]);
        
        // Gradually fade out (CSS handles the animation, this just cleans up)
        setTimeout(() => {
            setSoundEffects(prev => prev.filter(s => s.id !== id));
        }, duration);
    }, []);
    
    // Environmental interaction system
    const handleEnvironmentalInteraction = useCallback((x: number, y: number, action: 'push' | 'break' | 'activate' | 'douse' | 'ignite') => {
        const tile = dungeon[y]?.[x];
        if (!tile) return false;
        
        let success = false;
        let message = '';
        let soundEffect = null;
        
        switch (action) {
            case 'push':
                if (tile.pushable && tile.type === 'boulder') {
                    // Determine push direction based on player position
                    const playerX = player.x;
                    const playerY = player.y;
                    let pushDir: 'north' | 'south' | 'east' | 'west' | null = null;
                    let newX = x, newY = y;
                    
                    if (playerX < x) { pushDir = 'east'; newX = x + 1; }
                    else if (playerX > x) { pushDir = 'west'; newX = x - 1; }
                    else if (playerY < y) { pushDir = 'south'; newY = y + 1; }
                    else if (playerY > y) { pushDir = 'north'; newY = y - 1; }
                    
                    // Check if destination is valid
                    const destTile = dungeon[newY]?.[newX];
                    if (destTile && (destTile.type === 'floor' || destTile.type === 'water')) {
                        setDungeon(prev => {
                            const newDungeon = [...prev];
                            // Move boulder
                            newDungeon[y][x] = { type: 'floor', visible: true, explored: true };
                            newDungeon[newY][newX] = {
                                ...destTile,
                                type: 'boulder',
                                pushable: true,
                                description: 'A heavy stone boulder'
                            };
                            
                            // Special interactions
                            if (destTile.type === 'water') {
                                message = 'The boulder splashes into the water, creating ripples.';
                                soundEffect = { text: '*SPLASH*', color: '#4488ff', style: 'normal' as const };
                            } else {
                                message = `You push the boulder ${pushDir}ward. *RUMBLE*`;
                                soundEffect = { text: '*rumble*', color: '#8B4513', style: 'shake' as const };
                            }
                            
                            return newDungeon;
                        });
                        success = true;
                    } else {
                        message = "The boulder won't budge - something is blocking its path.";
                    }
                }
                break;
                
            case 'break':
                if (tile.breakable) {
                    const durability = tile.durability || 1;
                    if (durability <= 1) {
                        setDungeon(prev => {
                            const newDungeon = [...prev];
                            
                            if (tile.type === 'weak_wall') {
                                newDungeon[y][x] = { type: 'floor', visible: true, explored: true };
                                message = 'The weak wall crumbles, revealing a passage!';
                                soundEffect = { text: 'CRASH!', color: '#ff6600', style: 'shake' as const };
                                
                                // Sometimes reveal treasure behind walls
                                if (Math.random() < 0.3) {
                                    newDungeon[y][x].hasGold = 50 + Math.floor(Math.random() * 100);
                                    message += ' Something glints in the rubble...';
                                }
                            } // Removed ice_wall and vine_wall mechanics
                            
                            return newDungeon;
                        });
                        success = true;
                    } else {
                        setDungeon(prev => {
                            const newDungeon = [...prev];
                            newDungeon[y][x] = { ...tile, durability: durability - 1 };
                            return newDungeon;
                        });
                        message = `You chip away at the ${tile.type.replace('_', ' ')}. ${durability - 1} hits remaining.`;
                        soundEffect = { text: '*chip*', color: '#cccccc', style: 'normal' as const };
                        success = true;
                    }
                }
                break;
                
            case 'douse':
                // Removed fire trap and brazier mechanics
                if (false) {
                    // Check if player has water nearby or water item
                    const hasWater = player.inventory.some(item => item.name.toLowerCase().includes('water')) ||
                                    dungeon.some((row, y) => row.some((t, x) => t.type === 'water' &&
                                        Math.abs(x - player.x) <= 1 && Math.abs(y - player.y) <= 1));
                    
                    if (hasWater) {
                        setDungeon(prev => {
                            const newDungeon = [...prev];
                            newDungeon[y][x] = {
                                type: 'floor',
                                visible: true,
                                explored: true,
                                description: 'Extinguished torch'
                            };
                            return newDungeon;
                        });
                        message = `You extinguish the torch with water.`;
                        soundEffect = { text: '*hiss*', color: '#666666', style: 'float' as const };
                        success = true;
                    } else {
                        message = "You need water to extinguish this fire.";
                    }
                }
                break;
                
            case 'activate':
                // Removed ancient mechanism mechanics
                if (false) {
                    if (!tile.isActivated) {
                        setDungeon(prev => {
                            const newDungeon = [...prev];
                            newDungeon[y][x] = { ...tile };
                            
                            // Removed mechanism activation logic - no longer needed
                            
                            return newDungeon;
                        });
                        message = 'Ancient gears grind to life! Mechanisms activate throughout the chamber.';
                        soundEffect = { text: 'WHIRR!', color: '#ffa500', style: 'shake' as const };
                        success = true;
                    } else {
                        message = 'This mechanism has already been activated.';
                    }
                }
                break;
        }
        
        if (message) {
            addMessage(message);
        }
        if (soundEffect) {
            createSoundEffect(soundEffect.text, x, y, soundEffect.color, soundEffect.style);
        }
        
        return success;
    }, [dungeon, player, addMessage, createSoundEffect]);
    
    // Get attack pattern based on weapon type and direction
    const getAttackPattern = useCallback((x: number, y: number, direction: 'north' | 'south' | 'east' | 'west', weaponType: string = 'fist') => {
        const patterns: Record<string, Record<string, { x: number; y: number }[]>> = {
            // Sword: Arc attack (3 tiles in front)
            sword: {
                north: [{x, y: y-1}, {x: x-1, y: y-1}, {x: x+1, y: y-1}],
                south: [{x, y: y+1}, {x: x-1, y: y+1}, {x: x+1, y: y+1}],
                east: [{x: x+1, y}, {x: x+1, y: y-1}, {x: x+1, y: y+1}],
                west: [{x: x-1, y}, {x: x-1, y: y-1}, {x: x-1, y: y+1}]
            },
            // Spear: Line attack (2 tiles)
            spear: {
                north: [{x, y: y-1}, {x, y: y-2}],
                south: [{x, y: y+1}, {x, y: y+2}],
                east: [{x: x+1, y}, {x: x+2, y}],
                west: [{x: x-1, y}, {x: x-2, y}]
            },
            // Axe: Wide arc (5 tiles)
            axe: {
                north: [{x, y: y-1}, {x: x-1, y: y-1}, {x: x+1, y: y-1}, {x: x-2, y: y-1}, {x: x+2, y: y-1}],
                south: [{x, y: y+1}, {x: x-1, y: y+1}, {x: x+1, y: y+1}, {x: x-2, y: y+1}, {x: x+2, y: y+1}],
                east: [{x: x+1, y}, {x: x+1, y: y-1}, {x: x+1, y: y+1}, {x: x+1, y: y-2}, {x: x+1, y: y+2}],
                west: [{x: x-1, y}, {x: x-1, y: y-1}, {x: x-1, y: y+1}, {x: x-1, y: y-2}, {x: x-1, y: y+2}]
            },
            // Hammer: Single tile but with knockback potential
            hammer: {
                north: [{x, y: y-1}],
                south: [{x, y: y+1}],
                east: [{x: x+1, y}],
                west: [{x: x-1, y}]
            },
            // Fist/default: Single adjacent tile
            fist: {
                north: [{x, y: y-1}],
                south: [{x, y: y+1}],
                east: [{x: x+1, y}],
                west: [{x: x-1, y}]
            }
        };
        
        const weaponPattern = patterns[weaponType] || patterns.fist;
        return weaponPattern[direction] || [];
    }, []);
    
    // Perform ranged attack
    const performRangedAttack = useCallback((dx: number, dy: number, direction: 'north' | 'south' | 'east' | 'west') => {
        // Check if player has ranged weapon or ammo
        const rangedWeapon = player.weapon?.type === 'bow' || player.weapon?.type === 'crossbow' ? player.weapon : null;
        const hasAmmo = player.inventory?.some(item => item.type === 'arrow' || item.type === 'bolt');
        
        if (!rangedWeapon && !hasAmmo) {
            // Use thrown rock as default
            const projectile: Projectile = {
                id: `proj_${projectileIdRef.current++}`,
                x: player.x,
                y: player.y,
                targetX: player.x + (dx * 8),
                targetY: player.y + (dy * 8),
                speed: 10,
                damage: 2,
                type: 'stone',
                symbol: direction === 'north' || direction === 'south' ? '|' : '-',
                color: '#888888',
                piercing: false,
                owner: 'player'
            };
            
            setProjectiles(prev => [...prev, projectile]);
            createSoundEffect('*throw*', player.x, player.y, '#888888', 'normal');
            addMessage("You throw a stone!");
        } else {
            // Use actual ranged weapon
            const projectile: Projectile = {
                id: `proj_${projectileIdRef.current++}`,
                x: player.x,
                y: player.y,
                targetX: player.x + (dx * 12),
                targetY: player.y + (dy * 12),
                speed: 15,
                damage: rangedWeapon?.damage || 5,
                type: 'arrow',
                symbol: getProjectileSymbol(direction),
                color: '#8B4513',
                piercing: rangedWeapon?.type === 'crossbow',
                owner: 'player'
            };
            
            setProjectiles(prev => [...prev, projectile]);
            createSoundEffect('*twang*', player.x, player.y, '#8B4513', 'normal');
            addMessage(`You shoot an arrow ${direction}!`);
            
            // Consume ammo
            setPlayer(prev => ({
                ...prev,
                inventory: prev.inventory.filter((item, index) => 
                    !(index === prev.inventory.findIndex(i => i.type === 'arrow' || i.type === 'bolt'))
                )
            }));
        }
    }, [player, createSoundEffect, addMessage]);
    
    // Get projectile symbol based on direction
    const getProjectileSymbol = (direction: string): string => {
        switch(direction) {
            case 'north': return '↑';
            case 'south': return '↓';
            case 'east': return '→';
            case 'west': return '←';
            default: return '•';
        }
    };
    
    // Perform melee attack (moved before performChargedSpecial to fix initialization error)
    const performMeleeAttack = useCallback((dx: number, dy: number, direction: 'north' | 'south' | 'east' | 'west', powerMultiplier: number = 1) => {
        // Check cooldown using refs for current values
        if (attackCooldownRef.current > 0 || weaponSwingingRef.current) {
            return;
        }
        
        // Get weapon info
        const weapon = player.weapon || { name: 'fist', damage: 2, type: 'fist' };
        const weaponType = weapon.name?.toLowerCase().includes('sword') ? 'sword' :
                          weapon.name?.toLowerCase().includes('spear') ? 'spear' :
                          weapon.name?.toLowerCase().includes('axe') ? 'axe' :
                          weapon.name?.toLowerCase().includes('hammer') ? 'hammer' : 'fist';
        
        // Calculate attack tiles
        const attackTiles = getAttackPattern(player.x, player.y, direction, weaponType);

        // Create attack animation
        const baseDamage = (weapon.damage || 2) + (player.attack || 0);
        const attackAnim: AttackAnimation = {
            id: `attack_${attackIdRef.current++}`,
            type: weaponType === 'spear' ? 'thrust' : weaponType === 'axe' ? 'arc' : 'slash',
            x: player.x + dx,
            y: player.y + dy,
            direction,
            frame: 0,
            maxFrames: 4,
            damage: Math.floor(baseDamage * powerMultiplier),
            color: powerMultiplier > 2 ? '#ff0000' : powerMultiplier > 1.5 ? '#ff9900' : '#ff6600',
            pattern: attackTiles
        };
        
        setActiveAttacks(prev => [...prev, attackAnim]);
        setWeaponSwinging(true);
        weaponSwingingRef.current = true;
        setAttackCooldown(300); // 300ms cooldown
        attackCooldownRef.current = 300;
        
        // Check for hit entities
        attackTiles.forEach(tile => {
            const hitEntity = entities.find(e => e.x === tile.x && e.y === tile.y && e.hp > 0);
            if (hitEntity) {
                // Calculate damage
                const baseDamage = Math.max(1, attackAnim.damage - (hitEntity.defense || 0));

                // Critical hit chance (15%)
                const isCritical = Math.random() < 0.15;
                const damage = isCritical ? Math.floor(baseDamage * 1.5) : baseDamage;

                // Apply damage
                setEntities(prev => prev.map(e =>
                    e.id === hitEntity.id
                        ? { ...e, hp: Math.max(0, e.hp - damage) }
                        : e
                ));

                // Blood splatter effects - multiple droplets for visual impact
                const bloodSymbols = ['●', '•', '·'];
                for (let i = 0; i < 3; i++) {
                    const offsetX = (Math.random() - 0.5) * 2;
                    const offsetY = (Math.random() - 0.5) * 2;
                    setTimeout(() => {
                        createSoundEffect(
                            bloodSymbols[i % bloodSymbols.length],
                            tile.x,
                            tile.y,
                            '#8B0000',
                            'float'
                        );
                    }, i * 50);
                }

                // Damage number display
                createSoundEffect(
                    `-${damage}${isCritical ? '!' : ''}`,
                    tile.x,
                    tile.y,
                    isCritical ? '#ff00ff' : '#ff0000',
                    'shake'
                );

                addMessage(`You hit ${hitEntity.name} for ${damage} damage${isCritical ? ' - CRITICAL!' : ''}!`);

                // Screen shake on critical hit
                if (isCritical) {
                    const container = document.querySelector('.absolute.inset-0.bg-black') as HTMLElement;
                    if (container) {
                        container.style.animation = 'shake 0.3s ease-in-out';
                        setTimeout(() => {
                            container.style.animation = '';
                        }, 300);
                    }
                }

                // Knockback for hammer
                if (weaponType === 'hammer') {
                    const knockX = tile.x + dx;
                    const knockY = tile.y + dy;
                    if (dungeon[knockY]?.[knockX]?.type === 'floor') {
                        setEntities(prev => prev.map(e =>
                            e.id === hitEntity.id
                                ? { ...e, x: knockX, y: knockY }
                                : e
                        ));
                        createSoundEffect('KNOCK!', knockX, knockY, '#ffaa00', 'shake');
                    }
                }

                // Death animation - mark entity as dying instead of removing immediately
                if (hitEntity.hp - damage <= 0) {
                    addMessage(`${hitEntity.name} is defeated!`);
                    setEntities(prev => prev.map(e =>
                        e.id === hitEntity.id
                            ? { ...e, dying: true, hp: 0 }
                            : e
                    ));

                    // Create death animation - fade to bones
                    createSoundEffect('💀', tile.x, tile.y, '#666666', 'float');

                    // Remove entity after death animation
                    setTimeout(() => {
                        setEntities(prev => prev.filter(e => e.id !== hitEntity.id));
                    }, 1000);
                }
            }
            
            // Environmental interactions
            const dungeonTile = dungeon[tile.y]?.[tile.x];
            if (dungeonTile?.breakable) {
                handleEnvironmentalInteraction(tile.x, tile.y, 'break');
            }
        });
        
        // Play attack sound
        gameSoundsService.playRoguelikeAttackSound(true);
        
        // Clear animation after completion
        setTimeout(() => {
            setActiveAttacks(prev => prev.filter(a => a.id !== attackAnim.id));
            setWeaponSwinging(false);
            weaponSwingingRef.current = false;
        }, 200);
    }, [player, entities, dungeon, getAttackPattern, createSoundEffect, addMessage, handleEnvironmentalInteraction]);
    
    // Perform special charged attack
    const performChargedSpecial = useCallback((direction: string, powerLevel: number) => {
        const weapon = player.weapon || { name: 'fist', damage: 2, type: 'fist' };
        const weaponType = weapon.name?.toLowerCase().includes('sword') ? 'sword' :
                          weapon.name?.toLowerCase().includes('spear') ? 'spear' :
                          weapon.name?.toLowerCase().includes('axe') ? 'axe' :
                          weapon.name?.toLowerCase().includes('hammer') ? 'hammer' : 'fist';
        
        switch (weaponType) {
            case 'sword':
                // Spin attack - hits all 8 adjacent tiles
                const spinTiles = [
                    {x: player.x-1, y: player.y-1}, {x: player.x, y: player.y-1}, {x: player.x+1, y: player.y-1},
                    {x: player.x-1, y: player.y},                                   {x: player.x+1, y: player.y},
                    {x: player.x-1, y: player.y+1}, {x: player.x, y: player.y+1}, {x: player.x+1, y: player.y+1}
                ];
                
                spinTiles.forEach(tile => {
                    createSoundEffect('SPIN!', tile.x, tile.y, '#ff6600', 'float');
                    
                    // Damage all entities in spin radius
                    const hitEntity = entities.find(e => e.x === tile.x && e.y === tile.y && e.hp > 0);
                    if (hitEntity) {
                        const damage = Math.floor(((weapon.damage || 2) + (player.attack || 0)) * (powerLevel * 0.5));
                        setEntities(prev => prev.map(e => 
                            e.id === hitEntity.id 
                                ? { ...e, hp: Math.max(0, e.hp - damage) }
                                : e
                        ));
                        createSoundEffect(`-${damage}`, tile.x, tile.y, '#ff0000', 'float');
                    }
                });
                addMessage("Sword spin attack!");
                break;
                
            case 'spear':
                // Long thrust - extended reach
                const thrustDistance = 2 + Math.floor(powerLevel);
                const dx = direction === 'd' ? 1 : direction === 'a' ? -1 : 0;
                const dy = direction === 's' ? 1 : direction === 'w' ? -1 : 0;
                
                for (let i = 1; i <= thrustDistance; i++) {
                    const tile = { x: player.x + (dx * i), y: player.y + (dy * i) };
                    createSoundEffect('THRUST!', tile.x, tile.y, '#ffaa00', 'normal');
                    
                    const hitEntity = entities.find(e => e.x === tile.x && e.y === tile.y && e.hp > 0);
                    if (hitEntity) {
                        const damage = Math.floor(((weapon.damage || 2) + (player.attack || 0)) * (powerLevel * 0.7));
                        setEntities(prev => prev.map(e => 
                            e.id === hitEntity.id 
                                ? { ...e, hp: Math.max(0, e.hp - damage) }
                                : e
                        ));
                        createSoundEffect(`-${damage}`, tile.x, tile.y, '#ff0000', 'float');
                    }
                }
                addMessage("Spear charge thrust!");
                break;
                
            case 'hammer':
                // Ground slam - AoE with knockback
                createSoundEffect('SLAM!', player.x, player.y, '#8B4513', 'shake');
                
                // Damage and knockback all nearby entities
                const slamRadius = 2;
                for (let dy = -slamRadius; dy <= slamRadius; dy++) {
                    for (let dx = -slamRadius; dx <= slamRadius; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        
                        const tile = { x: player.x + dx, y: player.y + dy };
                        const distance = Math.abs(dx) + Math.abs(dy);
                        
                        const hitEntity = entities.find(e => e.x === tile.x && e.y === tile.y && e.hp > 0);
                        if (hitEntity) {
                            const damage = Math.floor(((weapon.damage || 2) + (player.attack || 0)) * (powerLevel * 0.6) / distance);
                            
                            // Apply knockback
                            const knockX = hitEntity.x + Math.sign(dx);
                            const knockY = hitEntity.y + Math.sign(dy);
                            
                            setEntities(prev => prev.map(e => {
                                if (e.id === hitEntity.id) {
                                    // Check if knockback position is valid
                                    if (dungeon[knockY]?.[knockX]?.type === 'floor') {
                                        return { ...e, x: knockX, y: knockY, hp: Math.max(0, e.hp - damage), aiState: 'stunned' };
                                    } else {
                                        return { ...e, hp: Math.max(0, e.hp - damage), aiState: 'stunned' };
                                    }
                                }
                                return e;
                            }));
                            createSoundEffect(`-${damage}`, tile.x, tile.y, '#ff0000', 'shake');
                        }
                    }
                }
                addMessage("Hammer ground slam!");
                break;
                
            default:
                // Fist: Powerful single strike
                const dir = direction === 'w' ? 'north' : direction === 's' ? 'south' : 
                           direction === 'a' ? 'west' : 'east';
                performMeleeAttack(
                    direction === 'd' ? 1 : direction === 'a' ? -1 : 0,
                    direction === 's' ? 1 : direction === 'w' ? -1 : 0,
                    dir as 'north' | 'south' | 'east' | 'west',
                    powerLevel
                );
                break;
        }
    }, [player, entities, dungeon, createSoundEffect, addMessage, performMeleeAttack]);
    
    // Create ambiance text  
    const createAmbianceText = useCallback((text: string, color: string = '#666666') => {
        const id = `ambiance_${ambianceIdRef.current++}`;
        setAmbianceTexts(prev => [...prev, {
            id,
            text,
            color,
            opacity: 0,
            duration: 4000
        }]);
        
        // Fade in
        setTimeout(() => {
            setAmbianceTexts(prev => prev.map(a => 
                a.id === id ? { ...a, opacity: 1 } : a
            ));
        }, 100);
        
        // Fade out
        setTimeout(() => {
            setAmbianceTexts(prev => prev.map(a => 
                a.id === id ? { ...a, opacity: 0 } : a
            ));
        }, 3000);
        
        // Remove
        setTimeout(() => {
            setAmbianceTexts(prev => prev.filter(a => a.id !== id));
        }, 4000);
    }, []);

    // Create unique cache key for this ruin level
    const getCacheKey = useCallback(() => {
        const location = structureLocation ? `${structureLocation[0]},${structureLocation[1]}` : 'unknown';
        return `ruin_${ruinType.name}_${location}_depth_${currentDepth}`;
    }, [structureLocation, ruinType.name, currentDepth]);

    // Clear old dungeon caches to free up storage space
    const clearOldDungeonCaches = useCallback(() => {
        try {
            const keysToRemove: string[] = [];
            const now = Date.now();
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

            // Find old dungeon cache keys
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('ruin_')) {
                    try {
                        const cached = localStorage.getItem(key);
                        if (cached) {
                            const data = JSON.parse(cached);
                            if (data.timestamp && (now - data.timestamp) > maxAge) {
                                keysToRemove.push(key);
                            }
                        }
                    } catch {
                        // If we can't parse it, it's probably corrupted, remove it
                        keysToRemove.push(key);
                    }
                }
            }

            // Remove old caches
            keysToRemove.forEach(key => localStorage.removeItem(key));

            if (keysToRemove.length > 0) {
                console.log(`Cleared ${keysToRemove.length} old dungeon caches`);
            }
        } catch (error) {
            console.warn('Failed to clear old dungeon caches:', error);
        }
    }, []);

    // Save dungeon state to localStorage with quota management
    const saveDungeonState = useCallback((dungeonData: DungeonTile[][], entitiesData: Entity[]) => {
        try {
            const cacheKey = getCacheKey();
            const stateData = {
                dungeon: dungeonData,
                entities: entitiesData,
                timestamp: Date.now(),
                version: '1.0' // For future compatibility
            };

            const serialized = JSON.stringify(stateData);

            // Check if data is too large (rough estimate: 4MB limit)
            if (serialized.length > 4 * 1024 * 1024) {
                console.warn('Dungeon state too large to cache, skipping storage');
                return;
            }

            localStorage.setItem(cacheKey, serialized);
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                // Clear old dungeon caches when quota exceeded
                console.warn('Storage quota exceeded, clearing old dungeon caches');
                clearOldDungeonCaches();

                // Try one more time after cleanup
                try {
                    const cacheKey = getCacheKey();
                    const stateData = {
                        dungeon: dungeonData,
                        entities: entitiesData,
                        timestamp: Date.now(),
                        version: '1.0'
                    };
                    localStorage.setItem(cacheKey, JSON.stringify(stateData));
                } catch (retryError) {
                    console.warn('Failed to cache dungeon state after cleanup:', retryError);
                }
            } else {
                console.warn('Failed to cache dungeon state:', error);
            }
        }
    }, [getCacheKey]);

    // Load dungeon state from localStorage
    const loadDungeonState = useCallback(() => {
        try {
            const cacheKey = getCacheKey();
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const stateData = JSON.parse(cached);
                // Check if cache is not too old (optional: expire after 24 hours)
                const isRecentEnough = Date.now() - stateData.timestamp < 24 * 60 * 60 * 1000;
                if (isRecentEnough && stateData.version === '1.0') {
                    return {
                        dungeon: stateData.dungeon,
                        entities: stateData.entities
                    };
                }
            }
        } catch (error) {
            console.warn('Failed to load cached dungeon state:', error);
        }
        return null;
    }, [getCacheKey]);

    // Helper function to get container type based on room type
    const getContainerTypeForRoom = (roomType: string): OverlayObjectType => {
        const roomContainers: Record<string, OverlayObjectType> = {
            'treasure': OverlayObjectType.CHEST,
            'altar': OverlayObjectType.CABINET,
            'library': OverlayObjectType.BOOKSHELF,
            'storage': OverlayObjectType.CRATE,
            'guard': OverlayObjectType.BARREL,
            'entrance': OverlayObjectType.BASKET,
            'corridor': OverlayObjectType.CRATE
        };
        return roomContainers[roomType] || OverlayObjectType.CHEST;
    };

    // Generate a proper dungeon with guaranteed walkable entrance
    const generateDungeon = useCallback(async () => {
        // Try to load from cache first
        const cachedState = loadDungeonState();
        if (cachedState) {
            setDungeon(cachedState.dungeon);
            setEntities(cachedState.entities);
            
            // Set player position to entrance
            const entrance = cachedState.dungeon.flatMap((row, y) =>
                row.map((tile, x) => ({ tile, x, y }))
            ).find(({ tile }) => tile.type === 'entrance');
            
            if (entrance) {
                setPlayer(prev => ({ ...prev, x: entrance.x, y: entrance.y }));
            }
            return;
        }

        const { width: DUNGEON_WIDTH, height: DUNGEON_HEIGHT } = dungeonDimensions;
        const newDungeon: DungeonTile[][] = Array(DUNGEON_HEIGHT).fill(null).map(() =>
            Array(DUNGEON_WIDTH).fill(null).map(() => ({
                type: 'wall' as const,
                visible: false,
                explored: false
            }))
        );

        const rooms: Room[] = [];
        
        // Determine dungeon archetype based on ruin type or random selection
        const ruinTypeLower = ruinType.name.toLowerCase();
        let layoutType: 'dungeon' | 'chamber' | 'grid' | 'organic' = 'dungeon';
        
        // Map ruin types to appropriate archetypes with floor-by-floor variation
        if (ruinTypeLower.includes('cave') || ruinTypeLower.includes('grotto') || ruinTypeLower.includes('natural')) {
            // Natural caves: mostly organic, but deeper floors can have chamber-like caverns
            if (currentDepth <= 2) {
                layoutType = 'organic';
            } else if (currentDepth <= 4 && Math.random() < 0.3) {
                layoutType = 'chamber'; // Natural large caverns deeper down
            } else {
                layoutType = 'organic';
            }
        } else if (ruinTypeLower.includes('vault') || ruinTypeLower.includes('tomb') || ruinTypeLower.includes('chamber') || ruinTypeLower.includes('hall')) {
            // Tombs/vaults: mix of chambers and grid patterns for burial complexes
            if (currentDepth === 1) {
                layoutType = 'chamber'; // Entry hall
            } else if (currentDepth <= 3 && Math.random() < 0.4) {
                layoutType = 'grid'; // Organized burial sections
            } else {
                layoutType = 'chamber'; // Main burial chambers
            }
        } else if (ruinTypeLower.includes('complex') || ruinTypeLower.includes('facility') || ruinTypeLower.includes('compound') || ruinTypeLower.includes('office')) {
            // Modern/administrative: grid patterns with some dungeon-like areas
            if (currentDepth <= 2) {
                layoutType = 'grid'; // Office floors
            } else if (Math.random() < 0.3) {
                layoutType = 'dungeon'; // Basement/maintenance areas
            } else {
                layoutType = 'grid';
            }
        } else if (ruinTypeLower.includes('mine') || ruinTypeLower.includes('catacombs') || ruinTypeLower.includes('labyrinth') || ruinTypeLower.includes('dungeon')) {
            // Mining/catacomb structures: mostly dungeon with organic deeper areas
            if (currentDepth <= 3) {
                layoutType = 'dungeon'; // Worked passages
            } else if (Math.random() < 0.4) {
                layoutType = 'organic'; // Natural caves encountered while digging
            } else {
                layoutType = 'dungeon';
            }
        } else {
            // Generic ruins: progressive archetype changes by depth with weighted randomness
            const archetypes: ('dungeon' | 'chamber' | 'grid' | 'organic')[] = [];
            
            // Floor 1: Favor chamber (entrance halls) and grid (organized upper floors)
            if (currentDepth === 1) {
                archetypes.push('chamber', 'chamber', 'grid', 'dungeon');
            }
            // Floors 2-3: Mix of all types with slight dungeon bias
            else if (currentDepth <= 3) {
                archetypes.push('dungeon', 'dungeon', 'chamber', 'grid', 'organic');
            }
            // Floors 4-6: Favor dungeon and organic (deeper, more natural/carved areas)
            else if (currentDepth <= 6) {
                archetypes.push('dungeon', 'dungeon', 'organic', 'organic', 'chamber');
            }
            // Floor 7+: Mostly organic with some dungeon (deepest natural caves)
            else {
                archetypes.push('organic', 'organic', 'organic', 'dungeon', 'chamber');
            }
            
            layoutType = archetypes[Math.floor(Math.random() * archetypes.length)];
        }
        
        // Generate based on archetype
        if (layoutType === 'dungeon') {
            // Dungeon layout: Interconnected rooms and corridors (mines/catacombs style)
            const numRooms = 6 + Math.floor(Math.random() * 4);
            
            // Create entrance room near one edge
            const entranceRoom: Room = {
                x: 3,
                y: 3,
                width: 5,
                height: 4,
                type: 'entrance'
            };
            rooms.push(entranceRoom);
            
            // Carve entrance room
            for (let y = entranceRoom.y; y < entranceRoom.y + entranceRoom.height; y++) {
                for (let x = entranceRoom.x; x < entranceRoom.x + entranceRoom.width; x++) {
                    newDungeon[y][x] = { type: 'floor', visible: false, explored: false };
                }
            }
            
            // Generate other rooms connected by corridors
            for (let i = 1; i < numRooms; i++) {
                let attempts = 0;
                let roomPlaced = false;
                
                while (attempts < 50 && !roomPlaced) {
                    const roomWidth = 4 + Math.floor(Math.random() * 6);
                    const roomHeight = 3 + Math.floor(Math.random() * 5);
                    const roomX = 3 + Math.floor(Math.random() * (DUNGEON_WIDTH - roomWidth - 6));
                    const roomY = 3 + Math.floor(Math.random() * (DUNGEON_HEIGHT - roomHeight - 6));
                    
                    // Check for reasonable distance from other rooms
                    let tooClose = false;
                    for (const room of rooms) {
                        const distance = Math.sqrt(Math.pow(roomX - room.x, 2) + Math.pow(roomY - room.y, 2));
                        if (distance < 6) {
                            tooClose = true;
                            break;
                        }
                    }
                    
                    if (!tooClose) {
                        const roomType = i === numRooms - 1 ? 'treasure' : 
                            ['library', 'altar', 'guard', 'storage'][Math.floor(Math.random() * 4)] as Room['type'];
                        
                        const newRoom = { x: roomX, y: roomY, width: roomWidth, height: roomHeight, type: roomType };
                        rooms.push(newRoom);
                        
                        // Carve room
                        for (let y = roomY; y < roomY + roomHeight; y++) {
                            for (let x = roomX; x < roomX + roomWidth; x++) {
                                newDungeon[y][x] = { type: 'floor', visible: false, explored: false };
                            }
                        }
                        
                        roomPlaced = true;
                    }
                    attempts++;
                }
            }
            
            // Connect rooms with winding corridors
            for (let i = 1; i < rooms.length; i++) {
                const room1 = rooms[i - 1];
                const room2 = rooms[i];
                
                const startX = room1.x + Math.floor(room1.width / 2);
                const startY = room1.y + Math.floor(room1.height / 2);
                const endX = room2.x + Math.floor(room2.width / 2);
                const endY = room2.y + Math.floor(room2.height / 2);
                
                // Create L-shaped corridor with some random bends
                let currentX = startX;
                let currentY = startY;
                
                // First leg (horizontal)
                const midX = startX + Math.floor((endX - startX) * (0.3 + Math.random() * 0.4));
                while (currentX !== midX) {
                    newDungeon[currentY][currentX] = { type: 'floor', visible: false, explored: false };
                    currentX += currentX < midX ? 1 : -1;
                }
                
                // Turn and go vertical
                while (currentY !== endY) {
                    newDungeon[currentY][currentX] = { type: 'floor', visible: false, explored: false };
                    currentY += currentY < endY ? 1 : -1;
                }
                
                // Final leg (horizontal)
                while (currentX !== endX) {
                    newDungeon[currentY][currentX] = { type: 'floor', visible: false, explored: false };
                    currentX += currentX < endX ? 1 : -1;
                }
            }
            
        } else if (layoutType === 'chamber') {
            // Chamber layout: Single large vault or tomb chamber
            const chamberPadding = 4 + Math.floor(Math.random() * 3);
            const chamber: Room = {
                x: chamberPadding,
                y: chamberPadding,
                width: DUNGEON_WIDTH - (chamberPadding * 2),
                height: DUNGEON_HEIGHT - (chamberPadding * 2),
                type: 'treasure'
            };
            rooms.push(chamber);
            
            // Carve the main chamber
            for (let y = chamber.y; y < chamber.y + chamber.height; y++) {
                for (let x = chamber.x; x < chamber.x + chamber.width; x++) {
                    newDungeon[y][x] = { type: 'floor', visible: false, explored: false };
                }
            }
            
            // Add entrance alcove
            const entranceWidth = 6;
            const entranceHeight = 4;
            const entranceRoom: Room = {
                x: chamber.x + Math.floor((chamber.width - entranceWidth) / 2),
                y: chamber.y,
                width: entranceWidth,
                height: entranceHeight,
                type: 'entrance'
            };
            rooms.push(entranceRoom);
            
            // Add central feature (altar, tomb, or treasure pedestal)
            const centerX = Math.floor(DUNGEON_WIDTH / 2);
            const centerY = Math.floor(DUNGEON_HEIGHT / 2);
            
            // Central dais or pedestal area
            const daisSize = 3;
            for (let dy = -daisSize; dy <= daisSize; dy++) {
                for (let dx = -daisSize; dx <= daisSize; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) <= daisSize) {
                        if (centerY + dy >= 0 && centerY + dy < DUNGEON_HEIGHT && 
                            centerX + dx >= 0 && centerX + dx < DUNGEON_WIDTH) {
                            newDungeon[centerY + dy][centerX + dx] = { 
                                type: 'altar', 
                                visible: false, 
                                explored: false,
                                description: 'A raised dais with ancient markings'
                            };
                        }
                    }
                }
            }
            
            // Add pillars around the chamber
            const pillarPositions = [
                { x: chamber.x + 3, y: chamber.y + 3 },
                { x: chamber.x + chamber.width - 4, y: chamber.y + 3 },
                { x: chamber.x + 3, y: chamber.y + chamber.height - 4 },
                { x: chamber.x + chamber.width - 4, y: chamber.y + chamber.height - 4 },
                { x: centerX - 8, y: centerY },
                { x: centerX + 8, y: centerY },
                { x: centerX, y: centerY - 6 },
                { x: centerX, y: centerY + 6 }
            ];
            
            pillarPositions.forEach(pos => {
                if (pos.x >= 0 && pos.x < DUNGEON_WIDTH && pos.y >= 0 && pos.y < DUNGEON_HEIGHT) {
                    newDungeon[pos.y][pos.x] = { type: 'pillar', visible: false, explored: false };
                }
            });
            
            // Add smaller alcoves around the edges for storage/artifacts
            const alcoves = [
                { x: chamber.x + 1, y: chamber.y + Math.floor(chamber.height / 3), width: 3, height: 3, type: 'library' as Room['type'] },
                { x: chamber.x + chamber.width - 4, y: chamber.y + Math.floor(chamber.height / 3), width: 3, height: 3, type: 'storage' as Room['type'] },
                { x: chamber.x + 1, y: chamber.y + Math.floor(2 * chamber.height / 3), width: 3, height: 3, type: 'altar' as Room['type'] },
                { x: chamber.x + chamber.width - 4, y: chamber.y + Math.floor(2 * chamber.height / 3), width: 3, height: 3, type: 'guard' as Room['type'] }
            ];
            
            alcoves.forEach(alcove => {
                if (alcove.x > chamber.x && alcove.y > chamber.y && 
                    alcove.x + alcove.width < chamber.x + chamber.width && 
                    alcove.y + alcove.height < chamber.y + chamber.height) {
                    rooms.push(alcove);
                }
            });
            
        } else if (layoutType === 'grid') {
            // Grid layout: Office/facility with straight hallways and symmetrical rooms
            const hallwayWidth = 2;
            const roomSize = 4;
            const gridSpacing = roomSize + hallwayWidth;
            
            // Create main horizontal and vertical corridors
            const midX = Math.floor(DUNGEON_WIDTH / 2);
            const midY = Math.floor(DUNGEON_HEIGHT / 2);
            
            // Main horizontal corridor
            for (let x = 2; x < DUNGEON_WIDTH - 2; x++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (midY + dy >= 0 && midY + dy < DUNGEON_HEIGHT) {
                        newDungeon[midY + dy][x] = { type: 'floor', visible: false, explored: false };
                    }
                }
            }
            
            // Main vertical corridor
            for (let y = 2; y < DUNGEON_HEIGHT - 2; y++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (midX + dx >= 0 && midX + dx < DUNGEON_WIDTH) {
                        newDungeon[y][midX + dx] = { type: 'floor', visible: false, explored: false };
                    }
                }
            }
            
            // Create grid of rooms connected to main corridors
            const roomPositions = [
                // Top quadrants
                { x: 4, y: 4, width: roomSize, height: roomSize, type: 'entrance' as Room['type'] },
                { x: midX + 4, y: 4, width: roomSize, height: roomSize, type: 'storage' as Room['type'] },
                { x: 4, y: midY - roomSize - 2, width: roomSize, height: roomSize, type: 'library' as Room['type'] },
                { x: midX + 4, y: midY - roomSize - 2, width: roomSize, height: roomSize, type: 'guard' as Room['type'] },
                
                // Bottom quadrants
                { x: 4, y: midY + 4, width: roomSize, height: roomSize, type: 'altar' as Room['type'] },
                { x: midX + 4, y: midY + 4, width: roomSize, height: roomSize, type: 'treasure' as Room['type'] },
                { x: 4, y: DUNGEON_HEIGHT - roomSize - 4, width: roomSize, height: roomSize, type: 'storage' as Room['type'] },
                { x: midX + 4, y: DUNGEON_HEIGHT - roomSize - 4, width: roomSize, height: roomSize, type: 'library' as Room['type'] }
            ];
            
            roomPositions.forEach(roomPos => {
                if (roomPos.x + roomPos.width < DUNGEON_WIDTH - 2 && roomPos.y + roomPos.height < DUNGEON_HEIGHT - 2) {
                    rooms.push(roomPos);
                    
                    // Carve room
                    for (let y = roomPos.y; y < roomPos.y + roomPos.height; y++) {
                        for (let x = roomPos.x; x < roomPos.x + roomPos.width; x++) {
                            newDungeon[y][x] = { type: 'floor', visible: false, explored: false };
                        }
                    }
                    
                    // Connect to nearest main corridor
                    if (Math.abs(roomPos.y + Math.floor(roomPos.height / 2) - midY) < 
                        Math.abs(roomPos.x + Math.floor(roomPos.width / 2) - midX)) {
                        // Connect to vertical corridor
                        const connectY = roomPos.y + Math.floor(roomPos.height / 2);
                        const startX = roomPos.x + roomPos.width;
                        const endX = midX - 1;
                        for (let x = Math.min(startX, endX); x <= Math.max(startX, endX); x++) {
                            newDungeon[connectY][x] = { type: 'floor', visible: false, explored: false };
                        }
                    } else {
                        // Connect to horizontal corridor
                        const connectX = roomPos.x + Math.floor(roomPos.width / 2);
                        const startY = roomPos.y + roomPos.height;
                        const endY = midY - 1;
                        for (let y = Math.min(startY, endY); y <= Math.max(startY, endY); y++) {
                            newDungeon[y][connectX] = { type: 'floor', visible: false, explored: false };
                        }
                    }
                }
            });
            
        } else if (layoutType === 'organic') {
            // Organic layout: Natural cave system with flowing, organic shapes
            // Start with multiple seed points for cave chambers
            const seedPoints = [
                { x: Math.floor(DUNGEON_WIDTH * 0.25), y: Math.floor(DUNGEON_HEIGHT * 0.25) },
                { x: Math.floor(DUNGEON_WIDTH * 0.75), y: Math.floor(DUNGEON_HEIGHT * 0.25) },
                { x: Math.floor(DUNGEON_WIDTH * 0.5), y: Math.floor(DUNGEON_HEIGHT * 0.75) },
                { x: Math.floor(DUNGEON_WIDTH * 0.15), y: Math.floor(DUNGEON_HEIGHT * 0.6) }
            ];
            
            // Create initial organic chambers using distance-based generation
            seedPoints.forEach((seed, index) => {
                const chamberRadius = 4 + Math.floor(Math.random() * 4);
                for (let y = Math.max(1, seed.y - chamberRadius); y <= Math.min(DUNGEON_HEIGHT - 2, seed.y + chamberRadius); y++) {
                    for (let x = Math.max(1, seed.x - chamberRadius); x <= Math.min(DUNGEON_WIDTH - 2, seed.x + chamberRadius); x++) {
                        const distance = Math.sqrt(Math.pow(x - seed.x, 2) + Math.pow(y - seed.y, 2));
                        const threshold = chamberRadius * (0.6 + Math.random() * 0.3); // Organic variation
                        if (distance <= threshold) {
                            newDungeon[y][x] = { type: 'floor', visible: false, explored: false };
                        }
                    }
                }
                
                // Define rooms for gameplay purposes
                const roomType = index === 0 ? 'entrance' : 
                    index === seedPoints.length - 1 ? 'treasure' :
                    ['library', 'altar', 'storage'][Math.floor(Math.random() * 3)] as Room['type'];
                    
                rooms.push({
                    x: seed.x - 3,
                    y: seed.y - 3,
                    width: 6,
                    height: 6,
                    type: roomType
                });
            });
            
            // Connect chambers with winding, organic tunnels
            for (let i = 0; i < seedPoints.length - 1; i++) {
                const start = seedPoints[i];
                const end = seedPoints[i + 1];
                
                let currentX = start.x;
                let currentY = start.y;
                
                // Create organic, winding tunnel
                while (Math.abs(currentX - end.x) > 1 || Math.abs(currentY - end.y) > 1) {
                    // Carve tunnel with some width variation
                    const tunnelWidth = 1 + Math.floor(Math.random() * 2);
                    for (let dy = -tunnelWidth; dy <= tunnelWidth; dy++) {
                        for (let dx = -tunnelWidth; dx <= tunnelWidth; dx++) {
                            const tx = currentX + dx;
                            const ty = currentY + dy;
                            if (tx >= 1 && tx < DUNGEON_WIDTH - 1 && ty >= 1 && ty < DUNGEON_HEIGHT - 1) {
                                if (Math.random() < 0.8) { // Some randomness in tunnel walls
                                    newDungeon[ty][tx] = { type: 'floor', visible: false, explored: false };
                                }
                            }
                        }
                    }
                    
                    // Move toward target with organic randomness
                    const dx = end.x - currentX;
                    const dy = end.y - currentY;
                    
                    if (Math.abs(dx) > Math.abs(dy)) {
                        currentX += dx > 0 ? 1 : -1;
                        if (Math.random() < 0.3) currentY += Math.random() < 0.5 ? 1 : -1; // Random branching
                    } else {
                        currentY += dy > 0 ? 1 : -1;
                        if (Math.random() < 0.3) currentX += Math.random() < 0.5 ? 1 : -1; // Random branching
                    }
                }
            }
            
            // Add some additional organic features
            // Water pools in natural depressions
            for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
                const poolX = 5 + Math.floor(Math.random() * (DUNGEON_WIDTH - 10));
                const poolY = 5 + Math.floor(Math.random() * (DUNGEON_HEIGHT - 10));
                const poolRadius = 1 + Math.floor(Math.random() * 2);
                
                for (let dy = -poolRadius; dy <= poolRadius; dy++) {
                    for (let dx = -poolRadius; dx <= poolRadius; dx++) {
                        const px = poolX + dx;
                        const py = poolY + dy;
                        if (px >= 0 && px < DUNGEON_WIDTH && py >= 0 && py < DUNGEON_HEIGHT &&
                            newDungeon[py][px].type === 'floor' &&
                            Math.sqrt(dx * dx + dy * dy) <= poolRadius) {
                            newDungeon[py][px] = { type: 'water', visible: false, explored: false };
                        }
                    }
                }
            }
            
            // Natural rock formations (pillars) scattered throughout
            for (let i = 0; i < 3 + Math.floor(Math.random() * 4); i++) {
                const pillarX = 3 + Math.floor(Math.random() * (DUNGEON_WIDTH - 6));
                const pillarY = 3 + Math.floor(Math.random() * (DUNGEON_HEIGHT - 6));
                if (newDungeon[pillarY][pillarX].type === 'floor') {
                    newDungeon[pillarY][pillarX] = { type: 'pillar', visible: false, explored: false };
                }
            }
            
        }
        
        // Now handle common elements for all layout types
        
        // Set player starting position - find the entrance room or first room
        let startX = 10;
        let startY = 10;
        
        const entranceRoom = rooms.find(r => r.type === 'entrance') || rooms[0];
        if (entranceRoom) {
            startX = entranceRoom.x + Math.floor(entranceRoom.width / 2);
            startY = entranceRoom.y + Math.floor(entranceRoom.height / 2);
        } else {
            // Find any floor tile for caverns
            for (let y = 0; y < DUNGEON_HEIGHT; y++) {
                for (let x = 0; x < DUNGEON_WIDTH; x++) {
                    if (newDungeon[y][x].type === 'floor') {
                        startX = x;
                        startY = y;
                        break;
                    }
                }
                if (startX !== 10) break;
            }
        }
        
        // Mark entrance
        newDungeon[startY][startX] = { 
            type: 'entrance', 
            visible: true, 
            explored: true,
            description: 'The entrance to the ruins'
        };

        // Add treasures and traps
        const floorTiles: { x: number, y: number }[] = [];
        for (let y = 0; y < DUNGEON_HEIGHT; y++) {
            for (let x = 0; x < DUNGEON_WIDTH; x++) {
                if (newDungeon[y][x].type === 'floor' && !(x === startX && y === startY)) {
                    floorTiles.push({ x, y });
                }
            }
        }

        // Get culturally appropriate items
        const availableItems = Object.values(ITEM_DEFINITIONS).filter(item => {
            // Filter items by era and culture if possible
            return !item.name.toLowerCase().includes('modern') && !item.name.toLowerCase().includes('gun');
        });

        // Add chests and occasional gold piles
        const numTreasures = Math.min(10, floorTiles.length / 10);
        for (let i = 0; i < numTreasures; i++) {
            if (floorTiles.length === 0) break;
            const idx = Math.floor(Math.random() * floorTiles.length);
            const tile = floorTiles[idx];
            floorTiles.splice(idx, 1);

            // 80% chance for chest, 20% for gold pile
            if (Math.random() < 0.8) {
                // Determine which room this chest is in
                const room = rooms.find(r =>
                    tile.x >= r.x && tile.x < r.x + r.width &&
                    tile.y >= r.y && tile.y < r.y + r.height
                );
                const roomType = room?.type || 'corridor';

                // Select appropriate container type based on room
                const containerType = getContainerTypeForRoom(roomType);

                // Generate culturally appropriate contents
                // Use different archetypes based on room type for variety
                const archetype = roomType === 'treasure' ? SpecialMapArchetype.PALACE_COMPLEX :
                    roomType === 'library' ? SpecialMapArchetype.UNIVERSITY :
                    roomType === 'altar' ? SpecialMapArchetype.SACRED_COMPLEX :
                    roomType === 'guard' ? SpecialMapArchetype.MILITARY_FORTRESS :
                    SpecialMapArchetype.ESTATES;

                const contents = generateSpecialMapContainerContents(
                    containerType,
                    archetype,
                    culturalContext.culturalZone,
                    culturalContext.era,
                    roomType,
                    'private' // Most ruin rooms are private/abandoned
                );

                newDungeon[tile.y][tile.x] = {
                    ...newDungeon[tile.y][tile.x],
                    type: 'chest',
                    containerContents: contents,
                    containerType: containerType,
                    chestOpened: false
                };
            } else {
                // Traditional gold pile (rare)
                newDungeon[tile.y][tile.x] = {
                    ...newDungeon[tile.y][tile.x],
                    type: 'treasure',
                    hasGold: 50 + Math.floor(Math.random() * 150) // Make gold piles more valuable since they're rarer
                };
            }
        }

        // Add items
        for (let i = 0; i < Math.min(5, floorTiles.length / 20); i++) {
            if (floorTiles.length === 0) break;
            const idx = Math.floor(Math.random() * floorTiles.length);
            const tile = floorTiles[idx];
            floorTiles.splice(idx, 1);
            const item = availableItems[Math.floor(Math.random() * availableItems.length)];
            newDungeon[tile.y][tile.x] = {
                ...newDungeon[tile.y][tile.x],
                type: 'treasure',
                hasItem: item
            };
        }

        // Add environmental storytelling elements
        const inscriptions = [
            `"Here lies the ${culturalContext.era} kingdom, fallen to time"`,
            `"Beware the curse of those who disturb this place"`,
            `"${culturalContext.culturalZone} warriors once walked these halls"`,
            `"The treasures within belong to the dead"`,
            `"May the gods forgive our hubris"`,
            `"In ${culturalContext.era}, we ruled these lands"`,
            `"Turn back, traveler, while you still can"`,
            `"The ${culturalContext.culturalZone} empire's last stand"`
        ];
        
        const muralDescriptions = [
            `A faded mural depicting ${culturalContext.culturalZone} nobles in ceremony`,
            `Ancient battle scenes from the ${culturalContext.era} period`,
            `Religious imagery showing ${culturalContext.culturalZone} deities`,
            `A map of the region as it was in ${culturalContext.era}`,
            `Scenes of daily life from ancient ${culturalContext.culturalZone}`,
            `The construction of this very structure, frozen in paint`
        ];
        
        // Add inscriptions on walls (2-4 per dungeon)
        for (let i = 0; i < 3; i++) {
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            // Place on a wall tile
            const wallPositions = [
                { x: room.x - 1, y: room.y + Math.floor(room.height / 2) }, // left wall
                { x: room.x + room.width, y: room.y + Math.floor(room.height / 2) }, // right wall
                { x: room.x + Math.floor(room.width / 2), y: room.y - 1 }, // top wall
                { x: room.x + Math.floor(room.width / 2), y: room.y + room.height } // bottom wall
            ];
            const pos = wallPositions[Math.floor(Math.random() * wallPositions.length)];
            
            if (pos.x >= 0 && pos.x < DUNGEON_WIDTH && pos.y >= 0 && pos.y < DUNGEON_HEIGHT &&
                newDungeon[pos.y][pos.x].type === 'wall') {
                newDungeon[pos.y][pos.x].inscription = inscriptions[Math.floor(Math.random() * inscriptions.length)];
            }
        }
        
        // Add murals in larger rooms
        rooms.filter(r => r.width >= 5 && r.height >= 5).forEach(room => {
            if (Math.random() < 0.6) {
                const muralX = room.x + Math.floor(room.width / 2);
                const muralY = room.y;
                if (newDungeon[muralY][muralX].type === 'wall') {
                    newDungeon[muralY][muralX].type = 'mural';
                    newDungeon[muralY][muralX].muralDescription = muralDescriptions[Math.floor(Math.random() * muralDescriptions.length)];
                }
            }
        });

        // Add examinable environmental storytelling elements (3-6 per floor)
        const numExaminables = 3 + Math.floor(Math.random() * 4);
        const examinableTypes: Array<'architecture' | 'mural' | 'evidence' | 'inscription' | 'artifact'> =
            ['architecture', 'mural', 'evidence', 'inscription', 'artifact'];

        for (let i = 0; i < numExaminables; i++) {
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            const type = examinableTypes[Math.floor(Math.random() * examinableTypes.length)];
            const discovery = generateEnvironmentalDiscovery(type, culturalContext.culturalZone, culturalContext.era);

            // All examinables are placed on floor tiles so player can walk onto them
            let targetTiles: Array<{x: number, y: number}> = [];

            // Place on floor tiles
            for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
                for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
                    if (newDungeon[y]?.[x]?.type === 'floor' && !newDungeon[y][x].examinable) {
                        targetTiles.push({ x, y });
                    }
                }
            }

            if (targetTiles.length > 0) {
                const pos = targetTiles[Math.floor(Math.random() * targetTiles.length)];
                newDungeon[pos.y][pos.x] = {
                    ...newDungeon[pos.y][pos.x],
                    examinable: true,
                    examinableData: {
                        ...discovery,
                        id: `examine-${currentDepth}-${i}`,
                        timestamp: Date.now(),
                        location: { depth: currentDepth, chamber: currentChamber }
                    }
                };

                // Add visual marker for examinable items
                if (type === 'artifact') {
                    newDungeon[pos.y][pos.x].description = `A ${discovery.title.toLowerCase()} lies here (press SPACE to examine)`;
                } else if (type === 'architecture') {
                    newDungeon[pos.y][pos.x].description = `Interesting ${type} here (press SPACE to examine)`;
                } else {
                    newDungeon[pos.y][pos.x].description = `${discovery.title} (press SPACE to examine)`;
                }
            }
        }

        // Add secret passages (hidden doors in walls) - 2-4 per floor
        const numSecrets = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numSecrets && i < rooms.length - 1; i++) {
            const room = rooms[i];
            // Find wall tiles adjacent to the room
            const wallTiles: Array<{x: number, y: number}> = [];

            // Check all four walls of the room
            for (let x = room.x; x < room.x + room.width; x++) {
                // Top wall
                if (room.y > 0 && newDungeon[room.y - 1][x].type === 'wall') {
                    wallTiles.push({ x, y: room.y - 1 });
                }
                // Bottom wall
                if (room.y + room.height < DUNGEON_HEIGHT && newDungeon[room.y + room.height][x].type === 'wall') {
                    wallTiles.push({ x, y: room.y + room.height });
                }
            }
            for (let y = room.y; y < room.y + room.height; y++) {
                // Left wall
                if (room.x > 0 && newDungeon[y][room.x - 1].type === 'wall') {
                    wallTiles.push({ x: room.x - 1, y });
                }
                // Right wall
                if (room.x + room.width < DUNGEON_WIDTH && newDungeon[y][room.x + room.width].type === 'wall') {
                    wallTiles.push({ x: room.x + room.width, y });
                }
            }

            if (wallTiles.length > 0) {
                const secretPos = wallTiles[Math.floor(Math.random() * wallTiles.length)];
                newDungeon[secretPos.y][secretPos.x] = {
                    ...newDungeon[secretPos.y][secretPos.x],
                    type: 'wall',
                    secretPassage: true,
                    excavatable: true,
                    description: 'This wall seems different from the others... (press SPACE to examine)'
                };
            }
        }

        // Add boulders and weak walls - 3-6 boulders, 1-3 weak walls per floor (rare!)
        const numBoulders = 3 + Math.floor(Math.random() * 4);
        const numWeakWalls = 1 + Math.floor(Math.random() * 3);

        // Add weak walls in random wall positions
        for (let i = 0; i < numWeakWalls; i++) {
            const wallTiles: Array<{x: number, y: number}> = [];
            for (let y = 1; y < DUNGEON_HEIGHT - 1; y++) {
                for (let x = 1; x < DUNGEON_WIDTH - 1; x++) {
                    if (newDungeon[y][x].type === 'wall' &&
                        !newDungeon[y][x].secretPassage &&
                        !newDungeon[y][x].examinable) {
                        // Check if adjacent to floor (only walls bordering rooms)
                        const adjacentToFloor =
                            (newDungeon[y-1]?.[x]?.type === 'floor') ||
                            (newDungeon[y+1]?.[x]?.type === 'floor') ||
                            (newDungeon[y]?.[x-1]?.type === 'floor') ||
                            (newDungeon[y]?.[x+1]?.type === 'floor');
                        if (adjacentToFloor) {
                            wallTiles.push({ x, y });
                        }
                    }
                }
            }

            if (wallTiles.length > 0) {
                const pos = wallTiles[Math.floor(Math.random() * wallTiles.length)];
                newDungeon[pos.y][pos.x] = {
                    type: 'weak_wall',
                    visible: false,
                    explored: false,
                    breakable: true,
                    durability: 100,
                    description: 'A crumbling, weak section of wall'
                };
            }
        }

        // Add boulders in corridor and room floor positions
        const boulderTiles: Array<{x: number, y: number}> = [];
        for (let y = 1; y < DUNGEON_HEIGHT - 1; y++) {
            for (let x = 1; x < DUNGEON_WIDTH - 1; x++) {
                if (newDungeon[y][x].type === 'floor') {
                    // Check if there's space around it (not near entrance or important features)
                    const nearEntrance = Math.abs(x - startX) < 3 && Math.abs(y - startY) < 3;
                    const nearChest = newDungeon[y][x].type === 'chest';
                    if (!nearEntrance && !nearChest) {
                        boulderTiles.push({ x, y });
                    }
                }
            }
        }

        for (let i = 0; i < numBoulders && boulderTiles.length > 0; i++) {
            const idx = Math.floor(Math.random() * boulderTiles.length);
            const pos = boulderTiles[idx];
            boulderTiles.splice(idx, 1);

            newDungeon[pos.y][pos.x] = {
                type: 'boulder',
                visible: false,
                explored: false,
                pushable: true,
                description: 'A large boulder blocks the way'
            };
        }

        // Add light sources (braziers, crystals) in special rooms
        rooms.forEach(room => {
            if (room.type === 'altar' || room.type === 'treasure' || room.type === 'library') {
                const corners = [
                    { x: room.x + 1, y: room.y + 1 },
                    { x: room.x + room.width - 2, y: room.y + 1 },
                    { x: room.x + 1, y: room.y + room.height - 2 },
                    { x: room.x + room.width - 2, y: room.y + room.height - 2 }
                ];
                
                // Place 1-2 light sources
                const numLights = room.type === 'altar' ? 2 : 1;
                for (let i = 0; i < numLights && i < corners.length; i++) {
                    const corner = corners[i];
                    if (newDungeon[corner.y][corner.x].type === 'floor') {
                        newDungeon[corner.y][corner.x] = {
                            ...newDungeon[corner.y][corner.x],
                            type: room.type === 'altar' ? 'brazier' : 'crystal',
                            lightSource: true,
                            lightRadius: 3
                        };
                    }
                }
            }
        });

        // Add room-specific atmospheric decorations
        rooms.forEach(room => {
            const roomFloorTiles = [];
            for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
                for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
                    if (newDungeon[y]?.[x]?.type === 'floor') {
                        roomFloorTiles.push({ x, y });
                    }
                }
            }

            if (roomFloorTiles.length === 0) return;

            switch (room.type) {
                case 'altar':
                    // Altars: Add altar piece in center, scattered offerings around it
                    const altarCenter = {
                        x: room.x + Math.floor(room.width / 2),
                        y: room.y + Math.floor(room.height / 2)
                    };
                    if (newDungeon[altarCenter.y]?.[altarCenter.x]?.type === 'floor') {
                        newDungeon[altarCenter.y][altarCenter.x] = {
                            ...newDungeon[altarCenter.y][altarCenter.x],
                            type: 'altar',
                            description: `An ancient altar dedicated to ${culturalContext.culturalZone} deities`
                        };
                    }
                    break;

                case 'library':
                    // Libraries: Scattered book piles (debris) representing fallen bookshelves
                    const numBookPiles = Math.min(3, Math.floor(roomFloorTiles.length / 8));
                    for (let i = 0; i < numBookPiles; i++) {
                        const idx = Math.floor(Math.random() * roomFloorTiles.length);
                        const tile = roomFloorTiles[idx];
                        roomFloorTiles.splice(idx, 1);
                        newDungeon[tile.y][tile.x] = {
                            ...newDungeon[tile.y][tile.x],
                            type: 'debris',
                            description: 'Scattered scrolls and crumbling books'
                        };
                    }
                    break;

                case 'treasure':
                    // Treasure rooms: Scattered coins/gems (represented as rubble with description)
                    const numPiles = Math.min(4, Math.floor(roomFloorTiles.length / 6));
                    for (let i = 0; i < numPiles; i++) {
                        const idx = Math.floor(Math.random() * roomFloorTiles.length);
                        const tile = roomFloorTiles[idx];
                        roomFloorTiles.splice(idx, 1);
                        newDungeon[tile.y][tile.x] = {
                            ...newDungeon[tile.y][tile.x],
                            type: 'rubble',
                            description: 'Glittering coins and gems scattered about'
                        };
                    }
                    break;

                case 'guard':
                    // Guard rooms: Weapon racks (pillars) and armor stands (statues)
                    const numRacks = Math.min(2, Math.floor(roomFloorTiles.length / 10));
                    for (let i = 0; i < numRacks; i++) {
                        const idx = Math.floor(Math.random() * roomFloorTiles.length);
                        const tile = roomFloorTiles[idx];
                        roomFloorTiles.splice(idx, 1);
                        newDungeon[tile.y][tile.x] = {
                            ...newDungeon[tile.y][tile.x],
                            type: i % 2 === 0 ? 'pillar' : 'statue',
                            description: i % 2 === 0 ? 'An empty weapon rack' : 'A suit of ancient armor on display'
                        };
                    }
                    break;

                case 'storage':
                    // Storage rooms: Extra rubble/debris piles
                    const numDebris = Math.min(5, Math.floor(roomFloorTiles.length / 5));
                    for (let i = 0; i < numDebris; i++) {
                        const idx = Math.floor(Math.random() * roomFloorTiles.length);
                        const tile = roomFloorTiles[idx];
                        roomFloorTiles.splice(idx, 1);
                        newDungeon[tile.y][tile.x] = {
                            ...newDungeon[tile.y][tile.x],
                            type: 'debris',
                            description: 'Broken crates and scattered supplies'
                        };
                    }
                    break;
            }
        });

        // Add primary source manuscripts in library rooms
        try {
            // Get contextually appropriate manuscripts instead of random ones
            const manuscriptCount = Math.min(3, floorTiles.length / 30);

            for (let i = 0; i < manuscriptCount; i++) {
                if (floorTiles.length === 0) break;

                // Get contextual manuscript based on era, culture, ruin type, and year
                const contextualManuscript = contextualManuscriptService.getContextualManuscript(
                    culturalContext.era,
                    culturalContext.culturalZone,
                    ruinType.name,
                    year
                );

                if (contextualManuscript) {
                    // Add some procedural variation
                    const variations = ['damaged', 'partial', 'annotated'] as const;
                    const variation = Math.random() < 0.3 ? variations[Math.floor(Math.random() * variations.length)] : undefined;

                    const finalManuscript = variation
                        ? contextualManuscriptService.generateProceduralManuscript(contextualManuscript, variation)
                        : contextualManuscript;

                    const idx = Math.floor(Math.random() * floorTiles.length);
                    const tile = floorTiles[idx];
                    floorTiles.splice(idx, 1);

                    newDungeon[tile.y][tile.x] = {
                        ...newDungeon[tile.y][tile.x],
                        type: 'manuscript',
                        hasManuscript: finalManuscript as PrimarySourceMetadata
                    };
                } else {
                    // Fallback to original system if no contextual manuscript available
                    const sources = await primarySourceService.getSourcesForContext(culturalContext.era, culturalContext.culturalZone);
                    if (sources.length > 0) {
                        const idx = Math.floor(Math.random() * floorTiles.length);
                        const tile = floorTiles[idx];
                        floorTiles.splice(idx, 1);
                        const source = sources[Math.floor(Math.random() * sources.length)];
                        newDungeon[tile.y][tile.x] = {
                            ...newDungeon[tile.y][tile.x],
                            type: 'manuscript',
                            hasManuscript: source
                        };
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load contextual manuscripts:', error);
        }

        // Discovery tile placement (replacing puzzle generation)
        const generateCulturalPuzzle = (room: Room) => {
            const puzzleId = `puzzle_${Math.random().toString(36).substr(2, 9)}`;
            
            // Culture and era-specific puzzle types
            const puzzlesByZone: Record<string, any> = {
                'Europe': {
                    'Ancient': {
                        type: 'roman_numerals',
                        riddles: [
                            { q: '"I am V plus III, step on me"', a: 8 },
                            { q: '"Caesar crossed me, now cross to VII"', a: 7 },
                            { q: '"The Ides minus I"', a: 14 }
                        ],
                        hint: 'Roman mathematics guide the way'
                    },
                    'Medieval': {
                        type: 'heraldry',
                        riddles: [
                            { q: '"First the lion, then the eagle, last the crown"', a: [1,2,3] },
                            { q: '"Follow the rose, avoid the thorn"', a: 'rose' },
                            { q: '"Three knights guard, one must fall"', a: 3 }
                        ],
                        hint: 'Noble symbols hold the key'
                    },
                    'Modern': {
                        type: 'gears',
                        riddles: [
                            { q: '"Turn the wheel thrice clockwise"', a: 3 },
                            { q: '"Steam rises, pressure falls"', a: 'valve' }
                        ],
                        hint: 'Industrial mechanisms await'
                    }
                },
                'Asia': {
                    'Ancient': {
                        type: 'i_ching',
                        riddles: [
                            { q: '"Heaven above, Earth below, Man between"', a: [1,3,2] },
                            { q: '"Follow the path of water - it flows downward"', a: 'down' },
                            { q: '"The sage faces south, the ruler faces north"', a: 'north' }
                        ],
                        hint: 'The Book of Changes reveals truth'
                    },
                    'Medieval': {
                        type: 'zodiac',
                        riddles: [
                            { q: '"Rat leads, Pig follows, Dragon breathes between"', a: [1,12,5] },
                            { q: '"The Tiger and Rabbit cannot meet"', a: 'separate' },
                            { q: '"Metal conquers Wood, Wood splits Earth"', a: 'metal' }
                        ],
                        hint: 'The celestial cycle guides you'
                    },
                    'Modern': {
                        type: 'kanji',
                        riddles: [
                            { q: '"Mountain 山 upon mountain makes?"', a: 'exit' },
                            { q: '"Water 水 flows to the east 東"', a: 'east' }
                        ],
                        hint: 'Written wisdom shows the way'
                    }
                },
                'MENA': {
                    'Ancient': {
                        type: 'hieroglyphs',
                        riddles: [
                            { q: '"The Eye of Ra sees all, place it first"', a: 'eye' },
                            { q: '"Anubis weighs, Ma\'at judges, Thoth records"', a: [2,3,1] },
                            { q: '"Follow the scarab to the dawn"', a: 'east' }
                        ],
                        hint: 'Sacred symbols of the Nile'
                    },
                    'Medieval': {
                        type: 'arabic_numerals',
                        riddles: [
                            { q: '"In the name of Allah, the sum of His names"', a: 99 },
                            { q: '"Five pillars support, but one points the way"', a: 5 },
                            { q: '"The crescent waxes thrice"', a: 3 }
                        ],
                        hint: 'Mathematical wisdom from the East'
                    },
                    'Modern': {
                        type: 'geometric',
                        riddles: [
                            { q: '"The star has eight points, touch each once"', a: 8 },
                            { q: '"Sacred geometry: square within circle"', a: 'square' }
                        ],
                        hint: 'Patterns within patterns'
                    }
                },
                'Africa': {
                    'Ancient': {
                        type: 'adinkra',
                        riddles: [
                            { q: '"Sankofa says: look back to move forward"', a: 'back' },
                            { q: '"The crocodile lives in water but breathes air"', a: 'both' },
                            { q: '"Wisdom knot has no beginning, no end"', a: 'circle' }
                        ],
                        hint: 'Symbols of wisdom guide you'
                    },
                    'Medieval': {
                        type: 'drums',
                        riddles: [
                            { q: '"Beat twice, pause, beat thrice"', a: [2,0,3] },
                            { q: '"The talking drum speaks: high-low-high"', a: 'hlh' },
                            { q: '"Answer the call: boom-boom-clap"', a: 3 }
                        ],
                        hint: 'The rhythm holds the secret'
                    }
                },
                'Americas': {
                    'Ancient': {
                        type: 'mayan_calendar',
                        riddles: [
                            { q: '"Twenty days, thirteen numbers, find day 6"', a: 6 },
                            { q: '"Jaguar before Eagle, Serpent after"', a: [1,3,2] },
                            { q: '"The Long Count begins at zero"', a: 0 }
                        ],
                        hint: 'Time cycles reveal the path'
                    },
                    'Medieval': {
                        type: 'quipu',
                        riddles: [
                            { q: '"Three knots, space, two knots equals?"', a: 32 },
                            { q: '"The red cord counts warriors"', a: 'red' },
                            { q: '"Tied memories cannot be untied"', a: 'permanent' }
                        ],
                        hint: 'Knotted cords hold knowledge'
                    }
                },
                'Oceania': {
                    'Ancient': {
                        type: 'star_navigation',
                        riddles: [
                            { q: '"Southern Cross points the way home"', a: 'south' },
                            { q: '"Rising tide lifts all boats"', a: 'up' },
                            { q: '"Navigate by star, not by shore"', a: 'stars' }
                        ],
                        hint: 'The ocean remembers all paths'
                    }
                }
            };
            
            // Get appropriate puzzle for current culture/era
            const zoneData = puzzlesByZone[culturalContext.culturalZone] || puzzlesByZone['Europe'];
            const eraKey = culturalContext.era.includes('Ancient') ? 'Ancient' : 
                          culturalContext.era.includes('Medieval') ? 'Medieval' : 'Modern';
            const puzzleConfig = zoneData[eraKey] || zoneData['Ancient'];
            
            // Select a random riddle from available ones
            const riddle = puzzleConfig.riddles[Math.floor(Math.random() * puzzleConfig.riddles.length)];
            
            // Create puzzle based on type
            if (puzzleConfig.type === 'pressure_plates' || puzzleConfig.type === 'hieroglyphs' || 
                puzzleConfig.type === 'adinkra' || puzzleConfig.type === 'star_navigation') {
                // Spatial puzzles with specific patterns
                const doorX = room.x + Math.floor(room.width / 2);
                const doorY = room.y + room.height - 1;
                
                // Place sealed door
                if (newDungeon[doorY] && newDungeon[doorY][doorX]) {
                    newDungeon[doorY][doorX] = {
                        type: 'puzzle_door',
                        visible: false,
                        explored: false,
                        puzzleId: puzzleId,
                        description: `A door sealed with ${culturalContext.culturalZone} mechanisms`,
                        requiredPlates: Array.isArray(riddle.a) ? riddle.a.length : 3,
                        activatedPlates: 0
                    };
                }
                
                // Place pressure plates in culturally significant patterns
                let platePositions = [];
                if (culturalContext.culturalZone === 'MENA' && eraKey === 'Ancient') {
                    // Eye of Ra pattern
                    platePositions = [
                        { x: room.x + Math.floor(room.width / 2), y: room.y + 2 }, // top
                        { x: room.x + 2, y: room.y + Math.floor(room.height / 2) }, // left
                        { x: room.x + room.width - 3, y: room.y + Math.floor(room.height / 2) }, // right
                    ];
                } else if (culturalContext.culturalZone === 'Asia') {
                    // Trigram pattern
                    platePositions = [
                        { x: room.x + 2, y: room.y + 2 },
                        { x: room.x + Math.floor(room.width / 2), y: room.y + 2 },
                        { x: room.x + room.width - 3, y: room.y + 2 }
                    ];
                } else {
                    // Default triangle
                    platePositions = [
                        { x: room.x + Math.floor(room.width / 2), y: room.y + 2 },
                        { x: room.x + 2, y: room.y + room.height - 3 },
                        { x: room.x + room.width - 3, y: room.y + room.height - 3 }
                    ];
                }
                
                platePositions.forEach((pos, index) => {
                    if (newDungeon[pos.y] && newDungeon[pos.y][pos.x] && newDungeon[pos.y][pos.x].type === 'floor') {
                        newDungeon[pos.y][pos.x] = {
                            type: 'pressure_plate',
                            visible: false,
                            explored: false,
                            puzzleId: puzzleId,
                            isActivated: false,
                            linkedTiles: [{ x: doorX, y: doorY }],
                            description: `A plate marked with ${culturalContext.culturalZone} symbols`,
                            puzzleSequence: Array.isArray(riddle.a) ? riddle.a[index] : index + 1
                        };
                    }
                });
                
            } else if (puzzleConfig.type === 'levers' || puzzleConfig.type === 'i_ching' || 
                       puzzleConfig.type === 'drums' || puzzleConfig.type === 'gears') {
                // Sequence puzzles
                const leverCount = Array.isArray(riddle.a) ? riddle.a.length : 3;
                for (let i = 0; i < leverCount; i++) {
                    const leverX = room.x + 2 + i * Math.floor((room.width - 4) / leverCount);
                    const leverY = room.y + Math.floor(room.height / 2);
                    
                    if (newDungeon[leverY] && newDungeon[leverY][leverX] && newDungeon[leverY][leverX].type === 'floor') {
                        const symbols = {
                            'Europe': ['☉', '☽', '✦'], // Sun, Moon, Stars
                            'Asia': ['☰', '☷', '☵'], // I Ching trigrams  
                            'MENA': ['☪', '✡', '☥'], // Religious symbols
                            'Africa': ['🥁', '◈', '◉'], // Drum patterns
                            'Americas': ['🐆', '🦅', '🐍'], // Animal totems
                            'Oceania': ['✦', '🌊', '⛵'] // Navigation symbols
                        };
                        
                        const zoneSymbols = symbols[culturalContext.culturalZone] || symbols['Europe'];
                        
                        newDungeon[leverY][leverX] = {
                            type: 'lever',
                            visible: false,
                            explored: false,
                            puzzleId: puzzleId,
                            isActivated: false,
                            description: `A lever marked with ${zoneSymbols[i]}`,
                            correctSequence: Array.isArray(riddle.a) ? riddle.a : [1,2,3],
                            sequenceIndex: i
                        };
                    }
                }
            }
            
            // Add culturally appropriate hint inscription
            const hintX = room.x + Math.floor(room.width / 2);
            const hintY = room.y;
            if (newDungeon[hintY] && newDungeon[hintY][hintX]) {
                newDungeon[hintY][hintX].inscription = riddle.q;
            }
            
            // Add a second hint with the puzzle type clue
            const hint2Y = room.y + 1;
            if (newDungeon[hint2Y] && newDungeon[hint2Y][hintX]) {
                newDungeon[hint2Y][hintX].inscription = `"${puzzleConfig.hint}"`;
            }
        };
        
        // Add puzzle rooms with cultural awareness
        const eligibleRooms = rooms.filter(r => 
            r.type === 'treasure' || r.type === 'library' || r.type === 'altar'
        );
        
        if (eligibleRooms.length > 0 && Math.random() < 0.7) {
            const puzzleRoom = eligibleRooms[Math.floor(Math.random() * eligibleRooms.length)];
            generateCulturalPuzzle(puzzleRoom);
        }
        
        // Add traps and pressure plates - enhanced system
        const trapCount = Math.min(12, Math.floor(floorTiles.length / 12)); // More traps
        for (let i = 0; i < trapCount; i++) {
            if (floorTiles.length === 0) break;
            const idx = Math.floor(Math.random() * floorTiles.length);
            const tile = floorTiles[idx];
            floorTiles.splice(idx, 1);
            
            // Mix of regular traps and pressure plates
            const trapType = Math.random() < 0.4 ? 'pressure_plate' : 'trap';
            
            if (trapType === 'pressure_plate') {
                newDungeon[tile.y][tile.x] = {
                    ...newDungeon[tile.y][tile.x],
                    type: 'pressure_plate',
                    isActivated: false,
                    puzzleId: `puzzle_${Math.floor(Math.random() * 3)}`, // Group some plates
                    description: 'A subtle pressure plate. Look for the comma on the ground.'
                };
            } else {
                newDungeon[tile.y][tile.x] = {
                    ...newDungeon[tile.y][tile.x],
                    type: 'trap',
                    hasTrap: true,
                    trapTriggered: false,
                    trapType: Math.random() < 0.3 ? 'spike' : Math.random() < 0.5 ? 'pit' : 'dart',
                    description: 'A subtle trap. Look for the comma on the ground.'
                };
            }
        }

        // Add environmental interaction elements
        // Boulders - pushable objects for puzzle solving
        for (let i = 0; i < Math.min(3, floorTiles.length / 25); i++) {
            if (floorTiles.length === 0) break;
            const idx = Math.floor(Math.random() * floorTiles.length);
            const tile = floorTiles[idx];
            floorTiles.splice(idx, 1);
            newDungeon[tile.y][tile.x] = {
                ...newDungeon[tile.y][tile.x],
                type: 'boulder',
                pushable: true,
                weight: 5,
                description: 'A heavy stone boulder that can be pushed'
            };
        }

        // Water features - flooded areas, streams, and pools
        // More common on deeper levels (underground springs, flooding)
        const waterChance = 0.3 + (currentDepth * 0.1); // Increases with depth

        if (Math.random() < waterChance) {
            // 1. Small water pools in rooms (puddles, cisterns)
            const numPools = 1 + Math.floor(Math.random() * 2); // 1-2 pools
            for (let i = 0; i < numPools; i++) {
                if (rooms.length === 0) break;
                const room = rooms[Math.floor(Math.random() * rooms.length)];

                // Create a small pool (2x2 to 4x4)
                const poolSize = 2 + Math.floor(Math.random() * 3);
                const poolX = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.width - poolSize - 2));
                const poolY = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.height - poolSize - 2));

                for (let py = poolY; py < poolY + poolSize && py < room.y + room.height - 1; py++) {
                    for (let px = poolX; px < poolX + poolSize && px < room.x + room.width - 1; px++) {
                        if (newDungeon[py]?.[px]?.type === 'floor') {
                            newDungeon[py][px] = {
                                type: 'water',
                                visible: false,
                                explored: false,
                                description: 'A pool of stagnant water'
                            };
                        }
                    }
                }
            }

            // 2. Flooded corridors/channels (30% chance)
            if (Math.random() < 0.3 && rooms.length >= 2) {
                const room1 = rooms[Math.floor(Math.random() * rooms.length)];
                const room2 = rooms[Math.floor(Math.random() * rooms.length)];

                if (room1 !== room2) {
                    // Create a thin stream connecting two rooms
                    const startX = room1.x + Math.floor(room1.width / 2);
                    const startY = room1.y + Math.floor(room1.height / 2);
                    const endX = room2.x + Math.floor(room2.width / 2);
                    const endY = room2.y + Math.floor(room2.height / 2);

                    let currentX = startX;
                    let currentY = startY;

                    // Trace path and fill with water
                    while ((currentX !== endX || currentY !== endY) && Math.abs(currentX - startX) + Math.abs(currentY - startY) < 50) {
                        if (newDungeon[currentY]?.[currentX]?.type === 'floor') {
                            newDungeon[currentY][currentX] = {
                                type: 'water',
                                visible: false,
                                explored: false,
                                description: 'A shallow stream flows here'
                            };
                        }

                        // Move toward target
                        if (currentX < endX) currentX++;
                        else if (currentX > endX) currentX--;
                        else if (currentY < endY) currentY++;
                        else if (currentY > endY) currentY--;
                    }
                }
            }

            // 3. Flooded chamber (rare, deeper levels only)
            if (currentDepth >= 3 && Math.random() < 0.15 && rooms.length > 2) {
                const floodedRoom = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))]; // Not entrance
                const floodDepth = 0.3 + Math.random() * 0.4; // 30-70% flooded

                for (let y = floodedRoom.y; y < floodedRoom.y + floodedRoom.height; y++) {
                    for (let x = floodedRoom.x; x < floodedRoom.x + floodedRoom.width; x++) {
                        if (newDungeon[y]?.[x]?.type === 'floor' && Math.random() < floodDepth) {
                            newDungeon[y][x] = {
                                type: 'water',
                                visible: false,
                                explored: false,
                                description: 'Deep water fills this chamber'
                            };
                        }
                    }
                }
            }
        }

        // Weak walls - breakable for secret passages
        const walls: { x: number, y: number }[] = [];
        for (let y = 1; y < DUNGEON_HEIGHT - 1; y++) {
            for (let x = 1; x < DUNGEON_WIDTH - 1; x++) {
                if (newDungeon[y][x].type === 'wall') {
                    // Check if wall has floor on both sides (potential secret passage)
                    const hasFloorAdjacent = [
                        newDungeon[y-1]?.[x]?.type === 'floor',
                        newDungeon[y+1]?.[x]?.type === 'floor',
                        newDungeon[y]?.[x-1]?.type === 'floor',
                        newDungeon[y]?.[x+1]?.type === 'floor'
                    ].filter(Boolean).length >= 2;
                    
                    if (hasFloorAdjacent) {
                        walls.push({ x, y });
                    }
                }
            }
        }
        
        for (let i = 0; i < Math.min(2, walls.length / 5); i++) {
            const wall = walls[Math.floor(Math.random() * walls.length)];
            newDungeon[wall.y][wall.x] = {
                type: 'weak_wall',
                visible: false,
                explored: false,
                breakable: true,
                durability: Math.random() < 0.5 ? 1 : 2,
                description: 'A cracked wall that looks like it might break with enough force'
            };
        }

        // Fire traps - can be extinguished with water
        for (let i = 0; i < Math.min(2, floorTiles.length / 30); i++) {
            if (floorTiles.length === 0) break;
            const idx = Math.floor(Math.random() * floorTiles.length);
            const tile = floorTiles[idx];
            floorTiles.splice(idx, 1);
            newDungeon[tile.y][tile.x] = {
                ...newDungeon[tile.y][tile.x],
                type: 'fire_trap',
                lightSource: true,
                lightRadius: 3,
                flammable: false, // Already on fire
                description: 'A gout of flame springs from the ground'
            };
        }

        // Removed ancient mechanisms - replaced with discovery tiles
        /* const treasureRooms = rooms.filter(r => r.type === 'treasure' || r.type === 'altar');
        treasureRooms.forEach(room => {
            if (Math.random() < 0.6) { // 60% chance for treasure rooms to have mechanisms
                const mechX = room.x + Math.floor(room.width / 2);
                const mechY = room.y + Math.floor(room.height / 2);
                
                if (newDungeon[mechY]?.[mechX]?.type === 'floor') {
                    newDungeon[mechY][mechX] = {
                        type: 'ancient_mechanism',
                        visible: false,
                        explored: false,
                        mechanismType: ['counterweight', 'pulley', 'gear'][Math.floor(Math.random() * 3)] as any,
                        isActivated: false,
                        connectedTo: [], // Will be populated below
                        description: 'An ancient mechanism of unknown purpose'
                    };
                    
                    // Connect to puzzle doors or other mechanisms
                    const nearbyRooms = rooms.filter(r => r !== room && 
                        Math.abs(r.x - room.x) + Math.abs(r.y - room.y) < 20);
                    
                    nearbyRooms.forEach(targetRoom => {
                        if (Math.random() < 0.3) { // 30% chance to connect
                            const doorX = targetRoom.x + Math.floor(targetRoom.width / 2);
                            const doorY = targetRoom.y;
                            
                            if (newDungeon[doorY]?.[doorX]) {
                                newDungeon[doorY][doorX] = {
                                    type: 'puzzle_door',
                                    visible: false,
                                    explored: false,
                                    description: 'A sealed door with ancient mechanisms'
                                };
                                
                                // Add connection
                                newDungeon[mechY][mechX].connectedTo!.push({ x: doorX, y: doorY });
                            }
                        }
                    });
                }
            }
        }); */

        // Add discovery tiles (? tiles) throughout the dungeon
        const availableFloorTiles: { x: number; y: number }[] = [];
        for (let y = 0; y < DUNGEON_HEIGHT; y++) {
            for (let x = 0; x < DUNGEON_WIDTH; x++) {
                if (newDungeon[y][x].type === 'floor' &&
                    !newDungeon[y][x].hasGold &&
                    !newDungeon[y][x].hasItem &&
                    !newDungeon[y][x].hasManuscript) {
                    // Check if not too close to entrance
                    const distFromEntrance = Math.abs(x - startX) + Math.abs(y - startY);
                    if (distFromEntrance > 3) {
                        availableFloorTiles.push({ x, y });
                    }
                }
            }
        }

        // Place 3-5 discovery tiles randomly
        const numDiscoveries = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numDiscoveries && availableFloorTiles.length > 0; i++) {
            const idx = Math.floor(Math.random() * availableFloorTiles.length);
            const tile = availableFloorTiles[idx];
            availableFloorTiles.splice(idx, 1);

            newDungeon[tile.y][tile.x] = {
                ...newDungeon[tile.y][tile.x],
                type: 'discovery',
                hasBeenDiscovered: false,
                discoveryId: `discovery_${currentDepth}_${i}`,
                description: 'Something of historical interest catches your eye...'
            };
        }

        // Add stairs down in a far room
        const lastRoom = rooms[rooms.length - 1];
        const stairsX = lastRoom.x + Math.floor(lastRoom.width / 2);
        const stairsY = lastRoom.y + Math.floor(lastRoom.height / 2);
        newDungeon[stairsY][stairsX] = {
            type: 'stairs_down',
            visible: false,
            explored: false,
            description: 'Stairs leading deeper into the earth'
        };

        // Add random ambiance based on depth and layout type
        setTimeout(() => {
            const ambiances = [
                { text: 'The air grows colder as you venture deeper...', condition: () => currentDepth > 2 },
                { text: 'You hear faint whispers echoing through the halls...', condition: () => Math.random() < 0.3 },
                { text: 'Dust motes dance in the dim light...', condition: () => Math.random() < 0.4 },
                { text: 'The ancient stones groan under their own weight...', condition: () => currentDepth > 3 },
                { text: 'A musty smell fills your nostrils...', condition: () => Math.random() < 0.5 },
                { text: 'Your footsteps echo endlessly through the vast space...', condition: () => layoutType === 'chamber' },
                { text: 'Something scurries in the darkness beyond your vision...', condition: () => Math.random() < 0.2 && currentDepth > 1 },
                { text: 'Water drips steadily somewhere in the distance...', condition: () => layoutType === 'organic' },
                { text: 'The rigid corridors suggest careful planning by ancient builders...', condition: () => layoutType === 'grid' }
            ];
            
            const validAmbiances = ambiances.filter(a => a.condition());
            if (validAmbiances.length > 0) {
                const ambiance = validAmbiances[Math.floor(Math.random() * validAmbiances.length)];
                createAmbianceText(ambiance.text, '#888888');
            }
        }, 3000);
        
        // Get location ID for checking befriended NPCs
        const locationId = getRuinLocationId(
            structureLocation?.[0] || 0,
            structureLocation?.[1] || 0,
            currentDepth
        );

        // Check for befriended NPCs at this location
        const befriendedNpcs = getBefriendedNpcsForLocation(locationId);

        // Generate entities using the dynamic ruin NPC service
        const dynamicNPCs = generateRuinNPCs(
            culturalContext.culturalZone,
            culturalContext.era,
            ruinType.originalType || ruinType.name,
            currentDepth,
            3 + currentDepth // More NPCs on deeper levels
        );

        // Generate one special LLM-powered NPC for richer interaction
        // (Disabled for now to avoid async in effect - would need useEffect)
        // TODO: Add async LLM NPC generation in separate effect

        // Get appropriate animals for the biome
        const ruinAnimals = getRuinAnimals(
            mapData?.climate || 'TEMPERATE',
            mapData?.climate || 'TEMPERATE',
            2 + currentDepth
        );

        const newEntities: Entity[] = [];
        let entityId = 0;

        // Place entities in rooms - scaled by depth
        const baseEncounterChance = 0.15 + (currentDepth * 0.05); // 15% base, +5% per floor
        
        for (let i = 1; i < rooms.length; i++) {
            const room = rooms[i];
            
            // Only some rooms have entities
            if (Math.random() > baseEncounterChance) continue;
            
            // Guard rooms always have 1-2 guards, other rooms have 0-1 entity
            const maxEntities = room.type === 'guard' ? 2 : 1;
            const entityCount = room.type === 'guard' ? (1 + Math.floor(Math.random() * 2)) : (Math.random() < 0.6 ? 1 : 0);
            
            for (let j = 0; j < entityCount; j++) {
                const ex = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
                const ey = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
                
                if (newDungeon[ey][ex].type === 'floor') {
                    // Mix of dynamic NPCs and ruin animals
                    const useAnimal = Math.random() < 0.5 && ruinAnimals.length > 0;
                    const useRuinsEnemy = Math.random() < 0.3; // 30% chance for special ruin enemy

                    if (useAnimal && ruinAnimals.length > 0) {
                        // Use ruin animal
                        const animal = ruinAnimals[Math.floor(Math.random() * ruinAnimals.length)];
                        newEntities.push({
                            id: `entity_${entityId++}`,
                            x: ex,
                            y: ey,
                            type: 'creature',
                            subtype: animal.type,
                            name: animal.type.charAt(0).toUpperCase() + animal.type.slice(1),
                            hp: animal.hp + (currentDepth * 2),
                            maxHp: animal.hp + (currentDepth * 2),
                            attack: animal.attack + Math.floor(currentDepth / 2),
                            defense: 2 + Math.floor(currentDepth / 3),
                            accuracy: 60,
                            evasion: 20,
                            level: currentDepth,
                            hostile: animal.hostile,
                            description: animal.description,
                            symbol: animal.type[0],
                            emoji: getAnimalEmoji(animal.type),
                            color: getAnimalColor(animal.type),
                            dialogue: undefined,
                            loot: undefined,
                            aiState: 'idle'
                        });
                    } else if (useRuinsEnemy) {
                        // Use the new ruins enemy system with emoji sprites
                        const ruinsEnemy = ruinsEnemyService.generateEnemy(currentDepth, ex, ey);
                        newEntities.push({
                            id: `entity_${entityId++}`,
                            x: ex,
                            y: ey,
                            type: 'creature',
                            subtype: ruinsEnemy.id,
                            name: ruinsEnemy.name,
                            hp: ruinsEnemy.hp,
                            maxHp: ruinsEnemy.maxHp,
                            attack: ruinsEnemy.damage.max,
                            defense: ruinsEnemy.defense,
                            accuracy: 70,
                            evasion: Math.floor(ruinsEnemy.speed * 15),
                            level: ruinsEnemy.level,
                            hostile: true,
                            description: ruinsEnemy.description,
                            symbol: ruinsEnemy.asciiBackup,
                            emoji: ruinsEnemy.emoji, // Use emoji sprite!
                            color: ruinsEnemyService.getColor(ruinsEnemy),
                            dialogue: undefined,
                            loot: ruinsEnemy.lootTable.filter(l => Math.random() < l.chance).map(l => l.item),
                            behavior: ruinsEnemy.behavior,
                            rangedAttack: ruinsEnemy.rangedAttack,
                            moveSpeed: 1000 / ruinsEnemy.speed, // Convert speed to ms delay
                            aiState: 'idle'
                        });
                    } else if (dynamicNPCs.length > 0) {
                        // Use dynamically generated NPCs
                        const npc = dynamicNPCs[Math.floor(Math.random() * dynamicNPCs.length)];
                        const motivation = getNpcMotivation(npc.profession, ruinType.name);

                        newEntities.push({
                            id: `entity_${entityId++}`,
                            x: ex,
                            y: ey,
                            type: npc.profession,
                            subtype: npc.profession,
                            name: npc.name,
                            hp: npc.combat?.health || 30,
                            maxHp: npc.combat?.maxHealth || 30,
                            attack: npc.combat?.attack || 5,
                            defense: npc.combat?.defense || 3,
                            accuracy: npc.combat?.accuracy || 70,
                            evasion: npc.combat?.evasion || 20,
                            level: npc.combat?.level || currentDepth,
                            hostile: npc.isHostile,
                            description: `${npc.profession} - ${motivation}`,
                            symbol: npc.emoji || '👤',
                            emoji: npc.emoji || '👤',
                            color: npc.isHostile ? 'text-red-400' : 'text-blue-400',
                            dialogue: npc.dialogue || ['Hello', 'Goodbye'],
                            loot: npc.inventory,
                            canNegotiate: !npc.isHostile || Math.random() > 0.5,
                            aiState: 'idle'
                        });
                    }
                }
            }
        }

        // Add befriended NPCs to the entity list
        if (befriendedNpcs.length > 0) {
            befriendedNpcs.forEach((befriendedNpc, index) => {
                // Find a random empty floor tile for the befriended NPC
                const emptyTiles: {x: number, y: number}[] = [];
                for (let y = 0; y < newDungeon.length; y++) {
                    for (let x = 0; x < newDungeon[y].length; x++) {
                        if (newDungeon[y][x].type === 'floor' &&
                            !newEntities.some(e => e.x === x && e.y === y)) {
                            emptyTiles.push({x, y});
                        }
                    }
                }

                if (emptyTiles.length > 0) {
                    const position = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
                    newEntities.push({
                        id: befriendedNpc.id,
                        x: position.x,
                        y: position.y,
                        type: befriendedNpc.profession,
                        subtype: befriendedNpc.profession,
                        name: befriendedNpc.fullName || befriendedNpc.name,
                        hp: befriendedNpc.health || 30,
                        maxHp: befriendedNpc.maxHealth || 30,
                        attack: befriendedNpc.combat?.attack || 5,
                        defense: befriendedNpc.combat?.defense || 3,
                        accuracy: befriendedNpc.combat?.accuracy || 70,
                        evasion: befriendedNpc.combat?.evasion || 15,
                        level: befriendedNpc.combat?.level || currentDepth,
                        hostile: false, // Befriended NPCs are never hostile
                        description: befriendedNpc.backstory || `A ${befriendedNpc.profession.toLowerCase()}`,
                        symbol: befriendedNpc.profession[0],
                        emoji: befriendedNpc.emoji || '👤',
                        color: 'text-green-400', // Friendly color
                        dialogue: [`${befriendedNpc.backstory}`, 'Good to see you again!'],
                        loot: befriendedNpc.inventory,
                        canNegotiate: false, // Already befriended
                        aiState: 'idle'
                    });

                    addMessage(`${befriendedNpc.fullName} is here, your old acquaintance.`);
                }
            });
        }

        setDungeon(newDungeon);
        setEntities(newEntities);
        
        // Save the generated dungeon to cache for persistence
        saveDungeonState(newDungeon, newEntities);
        setPlayer(prev => ({ ...prev, x: startX, y: startY }));
        
        // Store room information for chamber discovery
        setCurrentRooms(rooms);
        setDiscoveredRooms(new Set());
        
        return { startX, startY };
    }, [culturalContext, dungeonDimensions, loadDungeonState, saveDungeonState, currentDepth, ruinType]);

    // Start ruins audio orchestrator with cycling pattern
    useEffect(() => {
        // Start the ruins orchestrator which cycles between:
        // 1. Cave/ruins soundscape (1-2 min)
        // 2. Short silence (10-20s)
        // 3. Dungeon music (2-4 loops)
        // 4. Long silence (1-2 min)
        // 5. Repeat
        gameSoundsService.startRuinsOrchestrator();

        return () => {
            gameSoundsService.stopRuinsOrchestrator();
        };
    }, []);
    
    // Game loop for animations, enemy AI, projectiles, and cooldowns
    useEffect(() => {
        const gameLoop = setInterval(() => {
            const now = Date.now();
            
            // Update attack animations
            setActiveAttacks(prev => prev.map(attack => ({
                ...attack,
                frame: attack.frame + 0.5 // Advance animation
            })).filter(a => a.frame < a.maxFrames));
            
            // Update cooldowns
            setAttackCooldown(prev => {
                const newCooldown = Math.max(0, prev - 16); // 60fps = 16ms per frame
                attackCooldownRef.current = newCooldown;
                return newCooldown;
            });
            
            // Update charge level if charging
            if (chargingAttack && chargeStartTime) {
                const chargeTime = now - chargeStartTime;
                setChargeLevel(Math.min(100, (chargeTime / 1000) * 40)); // Full charge in 2.5 seconds
            }
            
            // Update projectiles
            setProjectiles(prev => {
                return prev.map(proj => {
                    // Move projectile toward target
                    const dx = Math.sign(proj.targetX - proj.x);
                    const dy = Math.sign(proj.targetY - proj.y);
                    const speed = 0.2; // Movement per frame
                    
                    const newX = proj.x + dx * speed;
                    const newY = proj.y + dy * speed;
                    
                    // Check if reached target
                    if (Math.abs(newX - proj.targetX) < 0.5 && Math.abs(newY - proj.targetY) < 0.5) {
                        return null; // Remove projectile
                    }
                    
                    // Check collision with walls
                    const tileX = Math.floor(newX);
                    const tileY = Math.floor(newY);
                    if (dungeon[tileY]?.[tileX]?.type === 'wall') {
                        createSoundEffect('*tink*', tileX, tileY, '#666666', 'normal');
                        return null; // Remove projectile
                    }
                    
                    // Check collision with traps - ranged attacks can disable them!
                    const targetTile = dungeon[tileY]?.[tileX];
                    if (targetTile && (targetTile.type === 'trap' || targetTile.type === 'pressure_plate') && !targetTile.trapTriggered && !targetTile.isActivated) {
                        // Disable the trap/pressure plate
                        setDungeon(prevDungeon => {
                            const newDungeon = [...prevDungeon];
                            if (targetTile.type === 'trap') {
                                newDungeon[tileY][tileX] = { ...targetTile, type: 'floor', hasTrap: false };
                                addMessage('*CRACK* Your projectile disabled the trap!');
                                createSoundEffect('*disabled*', tileX, tileY, '#00ff00', 'float');
                            } else if (targetTile.type === 'pressure_plate') {
                                newDungeon[tileY][tileX] = { ...targetTile, isActivated: true };
                                addMessage('*CLICK* Your projectile triggered the pressure plate!');
                                createSoundEffect('*click*', tileX, tileY, '#ffff00', 'normal');
                            }
                            return newDungeon;
                        });
                        return null; // Remove projectile
                    }
                    
                    // Check collision with entities
                    const hitEntity = entities.find(e => 
                        Math.abs(e.x - newX) < 0.5 && 
                        Math.abs(e.y - newY) < 0.5 &&
                        e.hp > 0
                    );
                    
                    if (hitEntity && proj.owner === 'player') {
                        // Deal damage to entity
                        setEntities(prevEntities => prevEntities.map(e => {
                            if (e.id === hitEntity.id) {
                                const damage = proj.damage;
                                const newHp = Math.max(0, e.hp - damage);
                                createSoundEffect(`-${damage}`, e.x, e.y, '#ff0000', 'float');
                                if (newHp <= 0) {
                                    addMessage(`${e.name} was defeated!`);
                                }
                                return { ...e, hp: newHp };
                            }
                            return e;
                        }));
                        
                        if (!proj.piercing) {
                            return null; // Remove projectile
                        }
                    }
                    
                    // Check collision with player
                    if (proj.owner === 'enemy' && Math.abs(player.x - newX) < 0.5 && Math.abs(player.y - newY) < 0.5) {
                        const damage = Math.max(1, proj.damage - (player.defense || 0));
                        setPlayer(prev => ({
                            ...prev,
                            hp: Math.max(0, prev.hp - damage)
                        }));
                        createSoundEffect(`-${damage}`, player.x, player.y, '#ff0000', 'shake');
                        addMessage(`You take ${damage} damage from projectile!`);
                        
                        if (!proj.piercing) {
                            return null; // Remove projectile
                        }
                    }
                    
                    return { ...proj, x: newX, y: newY };
                }).filter(Boolean);
            });
            
            // Update enemy AI (every 50ms instead of every frame for performance)
            if (now % 3 === 0) { // Roughly every 3rd frame
                setEntities(prev => prev.map(entity => {
                    // Check if this NPC is befriended (extra safety check)
                    const locationId = getRuinLocationId(
                        structureLocation?.[0] || 0,
                        structureLocation?.[1] || 0,
                        currentDepth
                    );
                    const isBefriended = isNpcBefriended(entity.id, locationId);

                    if (!entity.hostile || entity.hp <= 0 || entity.dying || isBefriended) return entity;
                    
                    // Initialize AI properties if not set
                    if (!entity.moveSpeed) {
                        entity = {
                            ...entity,
                            moveSpeed: 500 + Math.random() * 500, // 500-1000ms between moves
                            lastMove: now,
                            lastAttack: now,
                            aiState: 'idle'
                        };
                    }
                    
                    // Check if can move
                    if (now - (entity.lastMove || 0) < (entity.moveSpeed || 500)) return entity;
                    
                    const distance = Math.abs(entity.x - player.x) + Math.abs(entity.y - player.y);
                    
                    // AI decision making based on behavior type
                    const behavior = entity.behavior || 'aggressive';
                    
                    // Check for ranged attack opportunity
                    if (entity.rangedAttack && distance <= entity.rangedAttack.range && distance > 1) {
                        if (now - (entity.lastAttack || 0) > 1500) { // Ranged attacks have longer cooldown
                            // Fire projectile
                            const projectileId = `proj_${projectileIdRef.current++}`;
                            setProjectiles(prev => [...prev, {
                                id: projectileId,
                                x: entity.x,
                                y: entity.y,
                                targetX: player.x,
                                targetY: player.y,
                                speed: 0.3,
                                damage: entity.attack || 2,
                                type: entity.rangedAttack.projectileType as any,
                                symbol: entity.rangedAttack.projectileSymbol,
                                color: entity.rangedAttack.projectileColor,
                                piercing: false,
                                owner: 'enemy'
                            }]);
                            createSoundEffect(entity.rangedAttack.projectileSymbol, entity.x, entity.y, entity.rangedAttack.projectileColor, 'normal');
                            addMessage(`${entity.name} fires a projectile!`);
                            return { ...entity, lastAttack: now, aiState: 'attacking' };
                        }
                    }
                    
                    if (distance <= 1) {
                        // Melee attack if adjacent
                        if (now - (entity.lastAttack || 0) > 1000) { // 1 second attack cooldown
                            const damage = Math.max(1, (entity.attack || 2) - (player.defense || 0));
                            setPlayer(prev => ({
                                ...prev,
                                hp: Math.max(0, prev.hp - damage)
                            }));
                            createSoundEffect(`-${damage}`, player.x, player.y, '#ff0000', 'shake');
                            addMessage(`${entity.name} attacks for ${damage} damage!`);
                            return { ...entity, lastAttack: now, aiState: 'attacking' };
                        }
                    } else if (entity.aiState !== 'fleeing') {
                        // Movement based on behavior type
                        let shouldMove = false;
                        let moveTowardPlayer = true;
                        
                        switch (behavior) {
                            case 'aggressive':
                                shouldMove = distance <= 6;
                                moveTowardPlayer = true;
                                break;
                            case 'defensive':
                                shouldMove = distance <= 3 || entity.hp < entity.maxHp * 0.5;
                                moveTowardPlayer = entity.hp >= entity.maxHp * 0.5;
                                break;
                            case 'erratic':
                                shouldMove = Math.random() < 0.7 && distance <= 5;
                                moveTowardPlayer = Math.random() < 0.6;
                                break;
                            case 'ambush':
                                shouldMove = distance <= 2 || (entity.aiState === 'pursuing' && distance <= 4);
                                moveTowardPlayer = true;
                                break;
                            case 'ranged':
                                shouldMove = distance < 3 || distance > 5; // Keep optimal range
                                moveTowardPlayer = distance > 4; // Stay at range
                                break;
                        }
                        
                        if (shouldMove) {
                            const dx = moveTowardPlayer ? Math.sign(player.x - entity.x) : Math.sign(entity.x - player.x);
                            const dy = moveTowardPlayer ? Math.sign(player.y - entity.y) : Math.sign(entity.y - player.y);
                            
                            // For erratic behavior, sometimes move randomly
                            const randomMove = behavior === 'erratic' && Math.random() < 0.3;
                            const actualDx = randomMove ? (Math.random() < 0.5 ? -1 : 1) : dx;
                            const actualDy = randomMove ? (Math.random() < 0.5 ? -1 : 1) : dy;
                            
                            // Simple pathfinding - try to move
                            let newX = entity.x;
                            let newY = entity.y;
                            
                            // Try horizontal movement first
                            if (actualDx !== 0) {
                                const testX = entity.x + actualDx;
                                if (dungeon[entity.y]?.[testX]?.type === 'floor' &&
                                    !entities.some(e => e.id !== entity.id && e.x === testX && e.y === entity.y)) {
                                    newX = testX;
                                }
                            }
                            
                            // If couldn't move horizontally, try vertical
                            if (newX === entity.x && actualDy !== 0) {
                                const testY = entity.y + actualDy;
                                if (dungeon[testY]?.[entity.x]?.type === 'floor' &&
                                    !entities.some(e => e.id !== entity.id && e.x === entity.x && e.y === testY)) {
                                    newY = testY;
                                }
                            }
                            
                            if (newX !== entity.x || newY !== entity.y) {
                                return {
                                    ...entity,
                                    x: newX,
                                    y: newY,
                                    lastMove: now,
                                    aiState: moveTowardPlayer ? 'pursuing' : 'fleeing'
                                };
                            }
                        }
                    } else if (entity.hp < entity.maxHp / 3) {
                        // Flee if critically low health
                        const dx = Math.sign(entity.x - player.x);
                        const dy = Math.sign(entity.y - player.y);
                        
                        const testX = entity.x + dx;
                        const testY = entity.y + dy;
                        
                        if (dungeon[testY]?.[testX]?.type === 'floor') {
                            return {
                                ...entity,
                                x: testX,
                                y: testY,
                                lastMove: now,
                                aiState: 'fleeing'
                            };
                        }
                    }
                    
                    return entity;
                }));
            }
        }, 16); // 60fps
        
        return () => clearInterval(gameLoop);
    }, [chargingAttack, chargeStartTime, dungeon, entities, player, createSoundEffect, addMessage]);

    // Calculate dynamic dungeon dimensions based on viewport
    useEffect(() => {
        const calculateDimensions = () => {
            // Get the parent container dimensions (central game area)
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const containerWidth = rect.width;
                const containerHeight = rect.height;
                
                const headerHeight = 50; // Header with stats
                const chamberHeight = 30; // Chamber name display  
                const messageLogHeight = 80; // Message log
                const padding = 20;
                
                const availableWidth = containerWidth - padding;
                const availableHeight = containerHeight - headerHeight - chamberHeight - messageLogHeight - padding;
                
                const tilesWidth = Math.floor(availableWidth / zoomLevel);
                const tilesHeight = Math.floor(availableHeight / zoomLevel);
                
                setDungeonDimensions({
                    width: Math.min(100, Math.max(30, tilesWidth)),
                    height: Math.min(50, Math.max(20, tilesHeight))
                });
            } else {
                // Fallback dimensions if ref not ready
                setDungeonDimensions({ width: 60, height: 30 });
            }
        };
        
        // Small delay to ensure container is mounted
        setTimeout(calculateDimensions, 100);
        calculateDimensions();
        window.addEventListener('resize', calculateDimensions);
        return () => window.removeEventListener('resize', calculateDimensions);
    }, [zoomLevel]);
    
    // Initialize dungeon once on mount
    useEffect(() => {
        generateDungeon();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps - only run once on mount

    // Initialize first chamber after dungeon is ready
    useEffect(() => {
        if (dungeon.length > 0 && currentChamber === 'Entrance') {
            discoverNewChamber(1);
        }
    }, [dungeon.length]); // Don't include discoverNewChamber in deps to avoid circular dependency

    // Simple static lighting - just pools of light
    const updateVisibility = useCallback((playerX: number, playerY: number) => {
        setDungeon(prev => {
            // Guard against empty dungeon
            if (!prev || prev.length === 0 || !prev[0] || prev[0].length === 0) {
                return prev;
            }
            
            const newDungeon = prev.map(row => row.map(tile => ({ ...tile, visible: false })));
            
            // Player vision (simple radius)
            const visionRadius = player.hasTorch ? 7 : 4;
            
            for (let dy = -visionRadius; dy <= visionRadius; dy++) {
                for (let dx = -visionRadius; dx <= visionRadius; dx++) {
                    const x = playerX + dx;
                    const y = playerY + dy;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (x >= 0 && x < dungeonDimensions.width && y >= 0 && y < dungeonDimensions.height && distance <= visionRadius) {
                        // Simple line of sight check
                        let hasLineOfSight = true;
                        const steps = Math.ceil(distance);
                        for (let step = 1; step < steps; step++) {
                            const checkX = Math.round(playerX + (dx * step / steps));
                            const checkY = Math.round(playerY + (dy * step / steps));
                            if (newDungeon[checkY] && newDungeon[checkY][checkX] && newDungeon[checkY][checkX].type === 'wall') {
                                hasLineOfSight = false;
                                break;
                            }
                        }
                        
                        if (hasLineOfSight && newDungeon[y] && newDungeon[y][x]) {
                            newDungeon[y][x].visible = true;
                            newDungeon[y][x].explored = true;
                        }
                    }
                }
            }
            
            // Add static light pools for environmental sources
            prev.forEach((row, ly) => {
                row.forEach((tile, lx) => {
                    let lightRadius = 0;
                    
                    if (tile.type === 'brazier') lightRadius = 5;
                    else if (tile.type === 'crystal') lightRadius = 4;
                    else if (tile.type === 'campfire') lightRadius = 4;
                    
                    if (lightRadius > 0 && tile.explored) {
                        // Create static pool of light
                        for (let dy = -lightRadius; dy <= lightRadius; dy++) {
                            for (let dx = -lightRadius; dx <= lightRadius; dx++) {
                                const x = lx + dx;
                                const y = ly + dy;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                
                                if (x >= 0 && x < dungeonDimensions.width && 
                                    y >= 0 && y < dungeonDimensions.height && 
                                    distance <= lightRadius) {
                                    
                                    // Simple line of sight from light source
                                    let hasLineOfSight = true;
                                    const steps = Math.ceil(distance);
                                    for (let step = 1; step < steps; step++) {
                                        const checkX = Math.round(lx + (dx * step / steps));
                                        const checkY = Math.round(ly + (dy * step / steps));
                                        if (newDungeon[checkY] && newDungeon[checkY][checkX] && 
                                            newDungeon[checkY][checkX].type === 'wall') {
                                            hasLineOfSight = false;
                                            break;
                                        }
                                    }
                                    
                                    if (hasLineOfSight) {
                                        newDungeon[y][x].visible = true;
                                        newDungeon[y][x].explored = true;
                                    }
                                }
                            }
                        }
                    }
                });
            });
            
            return newDungeon;
        });
    }, [dungeonDimensions, player.hasTorch]);

    // Calculate combat damage with proper RPG mechanics
    const calculateDamage = useCallback((attacker: { attack: number; accuracy: number }, defender: { defense: number; evasion: number }) => {
        // Check if attack hits
        const hitRoll = Math.random() * 100;
        const hitChance = Math.max(10, Math.min(95, attacker.accuracy - defender.evasion));
        
        if (hitRoll > hitChance) {
            return { hit: false, damage: 0, critical: false };
        }
        
        // Check for critical hit (10% base chance)
        const critRoll = Math.random();
        const critical = critRoll < 0.1;
        
        // Calculate damage
        const baseDamage = attacker.attack;
        const variance = Math.random() * 0.4 + 0.8; // 80-120% variance
        const damage = Math.max(1, Math.floor((baseDamage * variance * (critical ? 2 : 1)) - defender.defense / 2));
        
        return { hit: true, damage, critical };
    }, []);



    // Move entities
    const moveEntities = useCallback(() => {
        setEntities(prev => prev.map(entity => {
            if (entity.hp <= 0 || !entity.hostile) return entity;
            
            // Simple AI: move towards player if in range
            const dx = player.x - entity.x;
            const dy = player.y - entity.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 8 && distance > 1) {
                const moveX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
                const moveY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
                
                const newX = entity.x + moveX;
                const newY = entity.y + moveY;
                
                if (dungeon[newY] && dungeon[newY][newX] && dungeon[newY][newX].type !== 'wall' &&
                    !prev.some(e => e.x === newX && e.y === newY && e.id !== entity.id)) {
                    return { ...entity, x: newX, y: newY };
                }
            }
            
            return entity;
        }));
    }, [player.x, player.y, dungeon]);

    // Discover new chamber
    const discoverNewChamber = useCallback((newDepth: number) => {
        const newChamber = ruinProgressService.discoverChamber(
            structureId, 
            newDepth, 
            ruinType.name,
            culturalContext.culturalZone
        );
        setCurrentChamber(newChamber.name);
        setCurrentDepth(newDepth);
        addMessage(`You enter the ${newChamber.name}...`);
    }, [structureId, ruinType.name, culturalContext.culturalZone, addMessage]);

    const handleEntityEncounter = useCallback((entityAtPosition: Entity, x: number, y: number) => {
        if (entityAtPosition.type !== 'animal') {
            const locationId = getRuinLocationId(
                structureLocation?.[0] || 0,
                structureLocation?.[1] || 0,
                currentDepth
            );

            const isBefriended = isNpcBefriended(entityAtPosition.id, locationId);
            const befriendedNpcs = getBefriendedNpcsForLocation(locationId);
            const persistentNpc = befriendedNpcs.find(n => n.id === entityAtPosition.id);

            if (isBefriended && persistentNpc) {
                setCurrentDialogue({
                    entity: {
                        ...entityAtPosition,
                        name: persistentNpc.fullName || entityAtPosition.name,
                        hostile: false
                    },
                    message: `*You recognize ${persistentNpc.fullName}*\n\n"${persistentNpc.backstory}"\n\n"It's good to see you again, friend."`
                });
            } else {
                generateRoguelikeDialogue({
                    npcType: entityAtPosition.type,
                    npcName: entityAtPosition.name,
                    era: culturalContext.era,
                    culturalZone: culturalContext.culturalZone,
                    ruinType: ruinType.name,
                    currentDepth,
                    playerName: playerCharacter.name,
                    playerProfession: playerCharacter.profession,
                    isHostile: entityAtPosition.hostile,
                    hasWeapon: player.weapon !== undefined,
                    playerHealth: player.hp,
                    playerMaxHealth: player.maxHp
                }).then(dialogue => {
                    setCurrentDialogue({
                        entity: entityAtPosition,
                        message: dialogue
                    });

                    if (!entityAtPosition.hostile || entityAtPosition.canNegotiate) {
                        const persistedNpc = storeBefriendedNpc(
                            entityAtPosition as any,
                            locationId,
                            culturalContext.culturalZone,
                            culturalContext.era
                        );

                        setEntities(prev => prev.map(e =>
                            e.id === entityAtPosition.id
                                ? { ...e, name: persistedNpc.fullName || e.name, hostile: false }
                                : e
                        ));

                        addMessage(`You've befriended ${persistedNpc.fullName}!`);
                    }
                });

                if (entityAtPosition.hostile && entityAtPosition.canNegotiate) {
                    addMessage(`The ${entityAtPosition.name} seems aggressive but might listen to reason... [Press T to try talking]`);
                } else if (entityAtPosition.hostile && !isBefriended) {
                    addMessage(`The ${entityAtPosition.name} is hostile!`);
                }
            }
        } else if (entityAtPosition.hostile) {
            addMessage(`The ${entityAtPosition.name} is hostile and ready to attack!`);
        } else {
            addMessage(`The ${entityAtPosition.name} blocks your path.`);
        }
    }, [structureLocation, currentDepth, culturalContext.era, culturalContext.culturalZone, ruinType.name, playerCharacter.name, playerCharacter.profession, player, addMessage]);

    // Handle discovery choice
    const handleDiscoveryChoice = useCallback((choiceIndex: number) => {
        if (!currentDiscoveryPrompt || !discoveryLocation) return;

        const outcomes = currentDiscoveryPrompt.outcomes[choiceIndex];
        if (!outcomes) return;

        // Roll for outcome
        const outcome = rollOutcome(outcomes);

        // Show outcome message
        addMessage(outcome.message);

        // Apply outcome effects
        const { x, y } = discoveryLocation;

        switch (outcome.result) {
            case 'staircase':
                // Create stairs down at discovery location
                setDungeon(prevDungeon => {
                    const newDungeon = [...prevDungeon];
                    if (newDungeon[y] && newDungeon[y][x]) {
                        newDungeon[y][x] = {
                            ...newDungeon[y][x],
                            type: 'stairs_down',
                            visible: true,
                            explored: true
                        };
                    }
                    return newDungeon;
                });
                gameSoundsService.playItemPickupSound('generic'); // Positive sound
                break;

            case 'trap':
                // Trigger trap damage
                setPlayer(prev => ({
                    ...prev,
                    hp: Math.max(0, prev.hp - 10)
                }));
                onHealthChange?.(-10);
                addMessage('You take 10 damage!');
                gameSoundsService.playWallBumpSound(); // Negative sound
                break;

            case 'item':
                // Spawn random item from available items
                const availableItems = Object.values(ITEM_DEFINITIONS).filter(item => {
                    return !item.name.toLowerCase().includes('modern') && !item.name.toLowerCase().includes('gun');
                });
                const item = availableItems[Math.floor(Math.random() * availableItems.length)];
                if (item) {
                    const itemInstance = {
                        ...item,
                        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        quantity: 1,
                    };
                    onInventoryAdd?.(itemInstance);
                    addMessage(`You found: ${item.name}!`);
                    gameSoundsService.playItemPickupSound('generic');
                }
                break;

            case 'secret_room':
                // Reveal hidden area nearby (convert nearby walls to floors)
                setDungeon(prevDungeon => {
                    const newDungeon = [...prevDungeon];
                    // Reveal a small 3x3 area adjacent to discovery
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nx = x + dx + 2; // Offset to one side
                            const ny = y + dy;
                            if (nx >= 0 && nx < dungeonDimensions.width &&
                                ny >= 0 && ny < dungeonDimensions.height &&
                                newDungeon[ny] && newDungeon[ny][nx] &&
                                newDungeon[ny][nx].type === 'wall') {
                                newDungeon[ny][nx] = {
                                    type: 'floor',
                                    visible: true,
                                    explored: true
                                };
                            }
                        }
                    }
                    return newDungeon;
                });
                gameSoundsService.playItemPickupSound('generic'); // Positive sound
                break;

            case 'nothing':
                // No effect, just the message
                break;
        }

        // Close modal
        setShowDiscoveryModal(false);
        setCurrentDiscoveryPrompt(null);
        setDiscoveryLocation(null);
    }, [
        currentDiscoveryPrompt,
        discoveryLocation,
        addMessage,
        onHealthChange,
        onInventoryAdd,
        culturalContext.culturalZone,
        culturalContext.era,
        ruinType.age,
        dungeonDimensions
    ]);

    // Handle player movement
    const movePlayer = useCallback((dx: number, dy: number) => {
        const movement = evaluatePlayerMove(player, dx, dy, {
            dungeon,
            entities,
            dimensions: dungeonDimensions
        });

        const event = movement.events[0];
        if (!event) {
            return;
        }

        if (event.type === 'BLOCKED_WALL') {
            addMessage('You bump into a wall.');
            gameSoundsService.playWallBumpSound();
            return;
        }

        if (event.type === 'BLOCKED_WEAK_WALL') {
            // Weak wall auto-breaks on bump
            setDungeon(prev => {
                const newDungeon = [...prev];
                if (newDungeon[event.y] && newDungeon[event.y][event.x]) {
                    newDungeon[event.y][event.x] = {
                        type: 'floor',
                        visible: true,
                        explored: true
                    };
                }
                return newDungeon;
            });
            addMessage('The weakened wall crumbles as you push against it! *CRASH*');
            createSoundEffect('*CRASH*', event.x, event.y, '#888888', 'shake');
            gameSoundsService.playWallBumpSound();
            return;
        }

        if (event.type === 'BLOCKED_BOULDER') {
            // Boulder collision - try to push it
            const boulderX = event.x;
            const boulderY = event.y;
            let pushX = boulderX + event.dx;
            let pushY = boulderY + event.dy;

            // Get direction name for message
            const directionNames: { [key: string]: string } = {
                '0,-1': 'north',
                '0,1': 'south',
                '-1,0': 'west',
                '1,0': 'east'
            };
            const direction = directionNames[`${event.dx},${event.dy}`] || 'away';

            // Check if destination is valid
            if (pushX >= 0 && pushX < dungeonDimensions.width &&
                pushY >= 0 && pushY < dungeonDimensions.height) {
                const destTile = dungeon[pushY]?.[pushX];

                // Check if boulder breaks through weak wall
                if (destTile && destTile.type === 'weak_wall') {
                    // Boulder crashes through weak wall and stops
                    setDungeon(prev => {
                        const newDungeon = [...prev];
                        // Remove boulder from old position
                        newDungeon[boulderY][boulderX] = { type: 'floor', visible: true, explored: true };
                        // Weak wall breaks and boulder stops there
                        newDungeon[pushY][pushX] = {
                            type: 'boulder',
                            visible: true,
                            explored: true,
                            pushable: true,
                            description: 'A boulder that crashed through the wall'
                        };
                        return newDungeon;
                    });
                    addMessage(`The boulder smashes through the crumbling wall! *CRASH*`);
                    createSoundEffect('*CRASH*', pushX, pushY, '#888888', 'shake');
                    gameSoundsService.playWallBumpSound();
                    return;
                }

                if (destTile && (destTile.type === 'floor' || destTile.type === 'water' || destTile.type === 'discovery')) {
                    // 30% chance boulder keeps rolling downhill
                    const keepsRolling = Math.random() < 0.3;
                    let finalX = pushX;
                    let finalY = pushY;
                    let rolledExtra = false;

                    if (keepsRolling) {
                        // Boulder keeps rolling in same direction until it hits a wall
                        let checkX = pushX + event.dx;
                        let checkY = pushY + event.dy;

                        while (checkX >= 0 && checkX < dungeonDimensions.width &&
                               checkY >= 0 && checkY < dungeonDimensions.height) {
                            const checkTile = dungeon[checkY]?.[checkX];
                            if (checkTile && (checkTile.type === 'floor' || checkTile.type === 'water' || checkTile.type === 'discovery')) {
                                finalX = checkX;
                                finalY = checkY;
                                checkX += event.dx;
                                checkY += event.dy;
                                rolledExtra = true;
                            } else {
                                break; // Hit an obstacle
                            }
                        }
                    }

                    // Successfully push boulder
                    setDungeon(prev => {
                        const newDungeon = [...prev];
                        // Remove boulder from old position
                        newDungeon[boulderY][boulderX] = { type: 'floor', visible: true, explored: true };
                        // Place boulder at final position
                        const finalDestTile = newDungeon[finalY][finalX];
                        if (finalDestTile.type === 'water') {
                            // Boulder falls into water, doesn't reappear
                            newDungeon[finalY][finalX] = { type: 'water', visible: true, explored: true };
                        } else {
                            newDungeon[finalY][finalX] = {
                                ...finalDestTile,
                                type: 'boulder',
                                pushable: true,
                                visible: true,
                                explored: true
                            };
                        }
                        return newDungeon;
                    });

                    if (dungeon[finalY][finalX].type === 'water') {
                        addMessage('You push the boulder into the water. *SPLASH*');
                        createSoundEffect('*SPLASH*', finalX, finalY, '#4488ff', 'normal');
                    } else if (rolledExtra) {
                        addMessage(`You roll the boulder ${direction}. It keeps rolling downhill! *CRASH*`);
                        createSoundEffect('*CRASH*', finalX, finalY, '#8B4513', 'shake');
                        gameSoundsService.playWallBumpSound(); // Crash sound
                    } else {
                        addMessage(`You roll the boulder ${direction}.`);
                        createSoundEffect('*rumble*', finalX, finalY, '#8B4513', 'shake');
                        gameSoundsService.playWallBumpSound(); // Rumble sound
                    }
                } else {
                    addMessage('You walk into a large boulder! It won\'t budge.');
                }
            } else {
                addMessage('You walk into a large boulder! It won\'t budge.');
            }
            return;
        }

        if (event.type === 'ENTITY_ENCOUNTER') {
            handleEntityEncounter(event.entity, event.x, event.y);
            return;
        }

        if (event.type !== 'STEP') {
            return;
        }

        const { x: newX, y: newY, tile } = event;

        setPlayer(prev => {
            if (!dungeon[newY] || !dungeon[newY][newX]) return prev;

            let newPlayer = { ...prev, x: newX, y: newY };
            
            // Handle tile interactions
            switch (tile.type) {
                case 'chest':
                    if (!tile.chestOpened) {
                        addMessage('Press SPACE to open the chest');
                    }
                    break;

                case 'treasure':
                    if (tile.hasGold) {
                        newPlayer.gold += tile.hasGold;
                        addMessage(`You found ${tile.hasGold} gold!`);
                        createSoundEffect('*clink*', newX, newY, '#ffdd00', 'float');
                        onGoldChange?.(newPlayer.gold);
                        gameSoundsService.playGoldPickupSound();
                        setDungeon(prevDungeon => {
                            const newDungeon = [...prevDungeon];
                            newDungeon[newY][newX] = { ...tile, type: 'floor', hasGold: undefined };
                            return newDungeon;
                        });
                    }
                    if (tile.hasItem) {
                        newPlayer.inventory.push(tile.hasItem);
                        addMessage(`You found: ${tile.hasItem.name}!`);

                        // Convert ItemDefinition to Item instance for parent game
                        const itemInstance = {
                            ...tile.hasItem,
                            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            quantity: 1,
                        };
                        console.log('[RoguelikeDisplay] Calling onInventoryAdd with item:', itemInstance.name, 'ID:', itemInstance.id);
                        onInventoryAdd?.(itemInstance);

                        gameSoundsService.playItemPickupSound('generic');
                        setDungeon(prevDungeon => {
                            const newDungeon = [...prevDungeon];
                            newDungeon[newY][newX] = { ...tile, type: 'floor', hasItem: undefined };
                            return newDungeon;
                        });
                    }
                    break;
                    
                case 'manuscript':
                    if (tile.hasManuscript) {
                        // Auto-collect manuscript - no puzzle!
                        newPlayer.manuscripts.push(tile.hasManuscript);
                        addMessage(`You discovered: "${tile.hasManuscript.title}"!`);
                        addMessage('Press M to read your manuscripts.');
                        gameSoundsService.playManuscriptSound();
                        setDiscoveredSources(prev => [...prev, tile.hasManuscript]);
                        createSoundEffect('*scroll*', newX, newY, '#d4af37', 'float');

                        // Remove manuscript from map after discovery
                        setDungeon(prevDungeon => {
                            const newDungeon = [...prevDungeon];
                            newDungeon[newY][newX] = { ...tile, type: 'floor', hasManuscript: undefined };
                            return newDungeon;
                        });

                        // Lower chance of historical encounter when finding contextual manuscripts (they have their own minigame)
                        const encounterChance = manuscript.scriptType ? 0.2 : 0.5;
                        if (Math.random() < encounterChance) {
                            const encounter = historicalEncounterService.getHistoricalEncounter(
                                culturalContext.culturalZone,
                                culturalContext.era,
                                year
                            );
                            if (encounter) {
                                const proceduralEncounter = historicalEncounterService.generateProceduralEncounter(
                                    encounter,
                                    {
                                        intelligence: playerCharacter.intelligence || 10,
                                        wisdom: playerCharacter.wisdom || 10,
                                        charisma: playerCharacter.charisma || 10
                                    }
                                );
                                setCurrentEncounter(proceduralEncounter);
                                setShowEncounterModal(true);
                                setSelectedChoiceId(null);
                                setEncounterOutcome(null);
                                addMessage('✦ The manuscript triggers a vision of the past...');
                            }
                        }
                    }
                    break;
                    
                case 'trap':
                    if (tile.hasTrap && !tile.trapTriggered) {
                        // Different trap types cause different damage and effects
                        let damage = 10;
                        let message = 'You triggered a trap!';
                        let sound = 'SNAP!';
                        
                        switch (tile.trapType) {
                            case 'spike':
                                damage = 8 + Math.floor(Math.random() * 12);
                                message = `Spikes shoot up from the floor! Lost ${damage} HP.`;
                                sound = '*SHING*';
                                break;
                            case 'pit':
                                damage = 12 + Math.floor(Math.random() * 8);
                                message = `You fall into a hidden pit! Lost ${damage} HP.`;
                                sound = '*THUD*';
                                break;
                            case 'dart':
                                damage = 6 + Math.floor(Math.random() * 8);
                                message = `A poisoned dart strikes you! Lost ${damage} HP.`;
                                sound = '*FWIP*';
                                break;
                            default:
                                damage = 10 + Math.floor(Math.random() * 10);
                                message = `You triggered a trap! Lost ${damage} HP.`;
                        }
                        
                        newPlayer.hp = Math.max(0, newPlayer.hp - damage);
                        addMessage(message);
                        createSoundEffect(sound, newX, newY, '#ff0000', 'shake');
                        gameSoundsService.playTrapSound();
                        onHealthChange?.(newPlayer.hp);
                        setDungeon(prevDungeon => {
                            const newDungeon = [...prevDungeon];
                            newDungeon[newY][newX] = { ...tile, trapTriggered: true };
                            return newDungeon;
                        });
                    }
                    break;
                    
                case 'stairs_down':
                    addMessage('You found stairs leading deeper. Press > to descend.');
                    gameSoundsService.playStairsSound();
                    break;
                    
                case 'altar':
                    addMessage('You examine the ancient altar. Mysterious energies emanate from it.');
                    gameSoundsService.playAltarSound();

                    // Chance to trigger historical encounter at altars
                    if (Math.random() < 0.3) { // 30% chance
                        const encounter = historicalEncounterService.getHistoricalEncounter(
                            culturalContext.culturalZone,
                            culturalContext.era,
                            year
                        );
                        if (encounter) {
                            const proceduralEncounter = historicalEncounterService.generateProceduralEncounter(
                                encounter,
                                {
                                    intelligence: playerCharacter.intelligence || 10,
                                    wisdom: playerCharacter.wisdom || 10,
                                    charisma: playerCharacter.charisma || 10
                                }
                            );
                            setCurrentEncounter(proceduralEncounter);
                            setShowEncounterModal(true);
                            setSelectedChoiceId(null);
                            setEncounterOutcome(null);
                            addMessage('✦ You sense echoes of the past... A vision forms before you.');
                            gameSoundsService.playAltarSound();
                        }
                    }
                    break;
                    
                case 'inscription':
                    if (tile.inscription) {
                        addMessage(`You read the ancient inscription: ${tile.inscription}`);
                    }
                    break;
                    
                case 'mural':
                    if (tile.muralDescription) {
                        addMessage(`You examine the mural: ${tile.muralDescription}`);
                    }
                    break;
                    
                case 'torch':
                    addMessage('A torch on the wall provides warm, flickering light.');
                    createSoundEffect('*crackle*', newX, newY, '#ff6600', 'float');
                    break;
                    
                case 'debris':
                    if (tile.description) {
                        addMessage(`You see ${tile.description.toLowerCase()}.`);
                    } else {
                        addMessage('Rubble and debris scattered here.');
                    }
                    break;

                case 'rubble':
                    if (tile.description) {
                        addMessage(`You notice ${tile.description.toLowerCase()}.`);
                    } else {
                        addMessage('Piles of rubble lie scattered about.');
                    }
                    break;

                case 'pillar':
                    if (tile.description) {
                        addMessage(`${tile.description}`);
                    } else {
                        addMessage('A stone pillar stands here.');
                    }
                    break;

                case 'discovery':
                    if (!tile.hasBeenDiscovered) {
                        // Get random discovery prompt
                        const currentRoom = currentRooms.find(room =>
                            newX >= room.x && newX < room.x + room.width &&
                            newY >= room.y && newY < room.y + room.height
                        );
                        const roomType = currentRoom?.type || 'corridor';
                        const discoveryPrompt = getRandomDiscovery(roomType);

                        // Mark tile as discovered
                        setDungeon(prevDungeon => {
                            const newDungeon = [...prevDungeon];
                            newDungeon[newY][newX] = {
                                ...tile,
                                hasBeenDiscovered: true,
                                type: 'floor'
                            };
                            return newDungeon;
                        });

                        // Show discovery modal
                        setCurrentDiscoveryPrompt(discoveryPrompt);
                        setDiscoveryLocation({ x: newX, y: newY });
                        setShowDiscoveryModal(true);
                    }
                    break;
                    
                // Removed lever mechanics - no longer needed
                    
                case 'locked_door':
                    if (tile.hasKey) {
                        addMessage('This door is locked. You need a key to open it.');
                    } else {
                        addMessage('The door is barred from the other side.');
                    }
                    break;
                    
                case 'food':
                    if (tile.hasFood) {
                        newPlayer.hunger = Math.min((newPlayer.maxHunger || 100), (newPlayer.hunger || 0) + 30);
                        addMessage(`You eat the ${tile.hasFood}. Hunger restored!`);
                        gameSoundsService.playItemPickupSound('food');
                        setDungeon(prevDungeon => {
                            const newDungeon = [...prevDungeon];
                            newDungeon[newY][newX] = { ...tile, type: 'floor', hasFood: undefined };
                            return newDungeon;
                        });
                    }
                    break;
                    
                case 'torch':
                    if (tile.hasTorch) {
                        newPlayer.hasTorch = true;
                        newPlayer.torchTurns = 100;
                        addMessage('You picked up a torch! Your vision range increased.');
                        gameSoundsService.playTorchSound();
                        setDungeon(prevDungeon => {
                            const newDungeon = [...prevDungeon];
                            newDungeon[newY][newX] = { ...tile, type: 'floor', hasTorch: undefined };
                            return newDungeon;
                        });
                    } else {
                        addMessage('A flickering torch illuminates the area.');
                    }
                    break;

                case 'water':
                    addMessage('You splash through shallow water.');
                    createSoundEffect('*splash*', newX, newY, '#4488ff', 'normal');
                    break;

                case 'chasm':
                    addMessage('You peer into a dark chasm. The depths are unfathomable.');
                    break;

                case 'pillar':
                    if (tile.description) {
                        addMessage(`${tile.description}`);
                    } else {
                        addMessage('You pass by an ancient stone pillar.');
                    }
                    break;

                case 'brazier':
                    addMessage('Heat radiates from a bronze brazier.');
                    createSoundEffect('*crackle*', newX, newY, '#ff4400', 'float');
                    break;

                case 'campfire':
                    addMessage('You warm yourself by the campfire.');
                    createSoundEffect('*crackle*', newX, newY, '#ff5500', 'float');
                    break;

                case 'entrance':
                    addMessage('You stand at the entrance to the ruins.');
                    break;

                case 'door':
                    addMessage('You pass through a doorway.');
                    break;

                case 'open_door':
                    addMessage('You walk through an open archway.');
                    break;

                case 'floor':
                    // Silent for regular floor - just footsteps
                    break;

                case 'boulder':
                    // This shouldn't happen as boulders block movement, but just in case
                    addMessage('You squeeze past a massive boulder.');
                    break;
            }

            // Play footstep sound if player actually moved
            if (newPlayer.x !== prev.x || newPlayer.y !== prev.y) {
                gameSoundsService.playFootstepSound();
            }
            
            setTurnCount(prev => prev + 1);
            moveEntities();
            
            return newPlayer;
        });
    }, [
        player,
        dungeon,
        entities,
        addMessage,
        moveEntities,
        onHealthChange,
        onGoldChange,
        onInventoryAdd,
        dungeonDimensions,
        handleEntityEncounter,
        culturalContext.culturalZone,
        culturalContext.era,
        ruinType.name,
        ruinType.age,
        ruinType.originalType,
        structureId,
        mapData,
        currentRooms,
        discoveries,
        currentDepth
    ]);

    // Update visibility and viewport when player moves
    useEffect(() => {
        updateVisibility(player.x, player.y);
        updateViewport(player.x, player.y);
    }, [player.x, player.y, updateVisibility, updateViewport]);

    // Handle keyboard input
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Don't handle keys if user is typing in an input field
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
                return;
            }

            const keyLower = event.key.toLowerCase();
            
            // MOVEMENT - Arrow keys only
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(keyLower)) {
                event.preventDefault();
                event.stopPropagation();
                
                switch (keyLower) {
                    case 'arrowup':
                        movePlayer(0, -1);
                        break;
                    case 'arrowdown':
                        movePlayer(0, 1);
                        break;
                    case 'arrowleft':
                        movePlayer(-1, 0);
                        break;
                    case 'arrowright':
                        movePlayer(1, 0);
                        break;
                }
                return;
            }
            
            // COMBAT - WASD for attacks (handle keydown for charging)
            if (['w', 'a', 's', 'd'].includes(keyLower) && !event.repeat) {
                event.preventDefault();
                event.stopPropagation();
                
                const attackMap: Record<string, { dx: number; dy: number; dir: 'north' | 'south' | 'east' | 'west' }> = {
                    'w': { dx: 0, dy: -1, dir: 'north' },
                    's': { dx: 0, dy: 1, dir: 'south' },
                    'a': { dx: -1, dy: 0, dir: 'west' },
                    'd': { dx: 1, dy: 0, dir: 'east' }
                };
                
                const attack = attackMap[keyLower];
                if (attack) {
                    if (event.shiftKey) {
                        // Ranged attack
                        performRangedAttack(attack.dx, attack.dy, attack.dir);
                    } else {
                        // Start charging attack
                        setChargingAttack(true);
                        setChargeDirection(keyLower);
                        setChargeStartTime(Date.now());
                        setChargeLevel(0);
                    }
                }
                return;
            }
            
            // SPACE BAR - Interact with current tile
            if (event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();

                const currentTile = dungeon[player.y]?.[player.x];

                // Check for examinable environmental storytelling elements first
                if (currentTile?.examinable && currentTile?.examinableData) {
                    setCurrentExamination(currentTile.examinableData as JournalEntry);
                    setShowExaminationModal(true);
                    gameSoundsService.playItemPickupSound('generic'); // Discovery sound
                    return;
                }

                // Check for secret passages
                if (currentTile?.secretPassage) {
                    addMessage('You examine the wall closely... It feels hollow! You reveal a secret passage!');
                    gameSoundsService.playTreasureOpeningSound();
                    setDungeon(prevDungeon => {
                        const newDungeon = [...prevDungeon];
                        newDungeon[player.y][player.x] = {
                            type: 'floor',
                            visible: true,
                            explored: true,
                            description: 'A newly discovered secret passage'
                        };
                        return newDungeon;
                    });
                    createSoundEffect('*crumble*', player.x, player.y, '#888888', 'shake');
                    return;
                }

                if (currentTile?.type === 'chest' && !currentTile.chestOpened) {
                    // Open the chest
                    const contents = currentTile.containerContents;
                    if (contents && contents.items.length > 0) {
                        // Play chest opening sound
                        gameSoundsService.playTreasureOpeningSound();

                        // Add all items to player inventory
                        let totalGold = 0;
                        const itemNames: string[] = [];

                        contents.items.forEach(item => {
                            if (item.baseId === 'COIN') {
                                totalGold += item.value * (item.quantity || 1);
                            } else {
                                // Add to player's inventory
                                setPlayer(prev => ({
                                    ...prev,
                                    inventory: [...prev.inventory, item]
                                }));
                                itemNames.push(item.name);

                                // Convert ItemDefinition to Item instance for parent game
                                const itemInstance = {
                                    ...item,
                                    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                    quantity: item.quantity || 1,
                                };
                                console.log('[RoguelikeDisplay] Calling onInventoryAdd from chest with item:', itemInstance.name, 'ID:', itemInstance.id);
                                onInventoryAdd?.(itemInstance);
                            }
                        });

                        // Update gold if coins were found
                        if (totalGold > 0) {
                            setPlayer(prev => ({ ...prev, gold: prev.gold + totalGold }));
                            onGoldChange?.(player.gold + totalGold);
                            addMessage(`You found ${totalGold} gold!`);
                        }

                        // Report items found
                        if (itemNames.length > 0) {
                            const itemsMessage = itemNames.length <= 3
                                ? itemNames.join(', ')
                                : `${itemNames.slice(0, 2).join(', ')} and ${itemNames.length - 2} more items`;
                            addMessage(`You found: ${itemsMessage}`);
                        }

                        // Mark chest as opened
                        setDungeon(prevDungeon => {
                            const newDungeon = [...prevDungeon];
                            newDungeon[player.y][player.x] = {
                                ...currentTile,
                                chestOpened: true,
                                containerContents: undefined
                            };
                            return newDungeon;
                        });

                        // Visual effect
                        createSoundEffect('*sparkle*', player.x, player.y, '#ffdd00', 'float');
                    } else {
                        addMessage('The chest is empty.');
                        // Still mark as opened
                        setDungeon(prevDungeon => {
                            const newDungeon = [...prevDungeon];
                            newDungeon[player.y][player.x] = {
                                ...currentTile,
                                chestOpened: true
                            };
                            return newDungeon;
                        });
                    }
                } else if (currentTile?.type === 'debris') {
                    // Examine debris in detail
                    const detailedDescriptions = [
                        'You sift through the debris. Mostly worthless scraps and dust.',
                        'Broken pottery shards, rotted wood, and tarnished metal pieces.',
                        'The remains of what was once valuable, now reduced to refuse.',
                        'Old bones, rusted nails, and fragments of cloth peek through the rubble.'
                    ];
                    const description = detailedDescriptions[Math.floor(Math.random() * detailedDescriptions.length)];
                    addMessage(description);
                } else if (currentTile?.type === 'rubble') {
                    // Examine rubble in detail - might find small treasures
                    const detailedDescriptions = [
                        'You carefully search through the rubble. Mostly broken masonry and dust.',
                        'Chunks of carved stone, worn by time. Perhaps once part of grand architecture.',
                        'The rubble shifts slightly as you examine it. Nothing of value here.',
                        'Fragments of decorated tiles and crumbling mortar fill the pile.'
                    ];
                    const description = detailedDescriptions[Math.floor(Math.random() * detailedDescriptions.length)];
                    addMessage(description);

                    // 20% chance to find a small coin or gem
                    if (Math.random() < 0.2) {
                        const goldFound = 5 + Math.floor(Math.random() * 15);
                        setPlayer(prev => ({ ...prev, gold: prev.gold + goldFound }));
                        onGoldChange?.(player.gold + goldFound);
                        addMessage(`Hidden beneath, you discover ${goldFound} gold!`);
                        gameSoundsService.playGoldPickupSound();
                        createSoundEffect('*clink*', player.x, player.y, '#ffdd00', 'float');
                    }
                } else if (currentTile?.type === 'pillar') {
                    // Examine pillar in detail
                    const detailedDescriptions = [
                        'A weathered stone pillar. Ancient carvings have worn smooth with age.',
                        'The pillar stands resolute, a testament to forgotten builders.',
                        'Faint traces of paint still cling to the pillar\'s surface.',
                        'The pillar\'s base shows chisel marks from its original carving.'
                    ];
                    const description = detailedDescriptions[Math.floor(Math.random() * detailedDescriptions.length)];
                    addMessage(description);
                } else if (currentTile?.type === 'discovery' && currentTile.hasBeenDiscovered) {
                    // Discovery tile that's already been used - give a random item
                    const availableItems = Object.values(ITEM_DEFINITIONS).filter(item => {
                        return !item.name.toLowerCase().includes('modern') && !item.name.toLowerCase().includes('gun');
                    });
                    const item = availableItems[Math.floor(Math.random() * availableItems.length)];

                    if (item) {
                        const itemInstance = {
                            ...item,
                            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            quantity: 1,
                        };
                        onInventoryAdd?.(itemInstance);
                        addMessage(`You find ${item.name} hidden here!`);
                        gameSoundsService.playItemPickupSound('generic');

                        // Remove the discovery marker
                        setDungeon(prevDungeon => {
                            const newDungeon = [...prevDungeon];
                            newDungeon[player.y][player.x] = {
                                type: 'floor',
                                visible: true,
                                explored: true
                            };
                            return newDungeon;
                        });
                    }
                }
                return;
            }

            // OTHER ACTIONS
            if (['escape', 'm', '>', 'h', 'p', 'b', 'e', 'q'].includes(keyLower)) {
                event.preventDefault();
                event.stopPropagation();

                // Define adjacent tiles for environmental interactions (shared across multiple cases)
                const adjacentTiles = [
                    { x: player.x, y: player.y - 1 }, // North
                    { x: player.x, y: player.y + 1 }, // South
                    { x: player.x - 1, y: player.y }, // West
                    { x: player.x + 1, y: player.y }  // East
                ];

                switch (keyLower) {
                    case 'escape':
                        // Close encounter modal, then exit
                        if (showEncounterModal) {
                            setShowEncounterModal(false);
                            setCurrentEncounter(null);
                            setSelectedChoiceId(null);
                            setEncounterOutcome(null);
                        } else {
                            onExit();
                        }
                        break;
                    case 'm':
                        // Toggle manuscript reader
                        if (discoveredSources.length > 0) {
                            setShowSourceReader(prev => !prev);
                            if (!showSourceReader && discoveredSources.length > 0) {
                                setSelectedSource(discoveredSources[0]);
                            }
                        } else {
                            addMessage('No manuscripts discovered yet. Look for § symbols.');
                        }
                        break;
                    case '>':
                        // Descend stairs
                        if (dungeon[player.y] && dungeon[player.y][player.x].type === 'stairs_down') {
                            const newDepth = currentDepth + 1;
                            discoverNewChamber(newDepth);
                            generateDungeon();
                        }
                        break;
                    case 'h':
                        // Toggle help
                        setShowHelp(prev => !prev);
                        setShowSourceReader(false); // Close source reader when opening help
                        break;
                    case '1':
                    case '2':
                    case '3':
                        // Select choice in encounter modal
                        if (showEncounterModal && currentEncounter && !encounterOutcome) {
                            const choiceIndex = parseInt(keyLower) - 1;
                            if (choiceIndex < currentEncounter.choices.length) {
                                const choice = currentEncounter.choices[choiceIndex];
                                const canSelect = historicalEncounterService.canSelectChoice(
                                    choice,
                                    {
                                        intelligence: playerCharacter.intelligence || 10,
                                        wisdom: playerCharacter.wisdom || 10,
                                        charisma: playerCharacter.charisma || 10
                                    },
                                    player.inventory.map(i => i.name)
                                );
                                if (canSelect) {
                                    setSelectedChoiceId(choice.id);
                                }
                            }
                        }
                        break;
                    case 'enter':
                        // Confirm choice in encounter modal
                        if (showEncounterModal && selectedChoiceId && !encounterOutcome) {
                            const choice = currentEncounter?.choices.find(c => c.id === selectedChoiceId);
                            if (choice) {
                                // Apply choice effects
                                setEncounterOutcome(choice.outcome.description);

                                // Apply effects to player
                                if (choice.outcome.effects.health) {
                                    const newHealth = Math.max(0, player.hp + choice.outcome.effects.health);
                                    setPlayer(prev => ({ ...prev, hp: newHealth }));
                                    onHealthChange?.(newHealth);
                                }

                                if (choice.outcome.effects.reputation) {
                                    addMessage(`Your reputation ${choice.outcome.effects.reputation > 0 ? 'increased' : 'decreased'}!`);
                                }

                                if (choice.outcome.effects.items && choice.outcome.effects.items.length > 0) {
                                    choice.outcome.effects.items.forEach(itemName => {
                                        addMessage(`You gained: ${itemName}`);
                                    });
                                }

                                if (choice.outcome.effects.knowledge) {
                                    setTimeout(() => {
                                        addMessage(`Knowledge gained: ${choice.outcome.effects.knowledge}`);
                                    }, 100);
                                }
                            }
                        }
                        break;
                    case 'r':
                        // Research mode - search for sources
                        if (showSourceReader) {
                            addMessage('Press a key to search: [1-9] to select source, [Q] to query');
                        }
                        break;
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                    case '5':
                    case '6':
                    case '7':
                    case '8':
                    case '9':
                        // Select document by number in source reader
                        if (showSourceReader && discoveredSources.length > 0) {
                            const idx = parseInt(keyLower) - 1;
                            if (idx < discoveredSources.length) {
                                setSelectedSource(discoveredSources[idx]);
                            }
                        }
                        break;
                }
            }
        };
        
        // Handle key release for charge attacks
        const handleKeyUp = (event: KeyboardEvent) => {
            const keyLower = event.key.toLowerCase();
            
            if (keyLower === chargeDirection && chargingAttack) {
                event.preventDefault();
                event.stopPropagation();
                
                // Execute charged attack based on charge level
                const powerLevel = Math.floor(chargeLevel / 25); // 0-4 power levels
                
                const attackMap: Record<string, { dx: number; dy: number; dir: 'north' | 'south' | 'east' | 'west' }> = {
                    'w': { dx: 0, dy: -1, dir: 'north' },
                    's': { dx: 0, dy: 1, dir: 'south' },
                    'a': { dx: -1, dy: 0, dir: 'west' },
                    'd': { dx: 1, dy: 0, dir: 'east' }
                };
                
                const attack = attackMap[keyLower];
                if (attack) {
                    if (powerLevel === 0) {
                        // Quick tap = normal attack
                        performMeleeAttack(attack.dx, attack.dy, attack.dir);
                    } else if (powerLevel >= 3) {
                        // Full charge = special attack
                        performChargedSpecial(chargeDirection, powerLevel);
                    } else {
                        // Partial charge = stronger normal attack
                        performMeleeAttack(attack.dx, attack.dy, attack.dir, 1 + powerLevel * 0.5);
                    }
                }
                
                // Reset charge state
                setChargingAttack(false);
                setChargeLevel(0);
                setChargeDirection(null);
                setChargeStartTime(null);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [movePlayer, onExit, player, dungeon, generateDungeon, addMessage, currentDepth, discoverNewChamber, entities, culturalContext, ruinType, playerCharacter, performMeleeAttack, performRangedAttack, performChargedSpecial, chargingAttack, chargeDirection, chargeLevel, showEncounterModal, currentEncounter, selectedChoiceId, encounterOutcome, setShowEncounterModal, setCurrentEncounter, setSelectedChoiceId, setEncounterOutcome, onHealthChange]);

    
    // Generate a special LLM-powered NPC when entering ruins
    useEffect(() => {
        if (currentDepth === 1 && entities.length > 0 && mapData && ruinType) {
            // Generate one special NPC with rich historical context
            const generateSpecialNPC = async () => {
                try {
                    const llmNPC = await generateLLMRuinNPC(
                        culturalContext.year,
                        culturalContext.culturalZone,
                        culturalContext.era,
                        ruinType.originalType || ruinType.name,
                        currentDepth,
                        mapData.biome || 'temperate'
                    );

                    // Convert LLM NPC to entity format
                    const specialEntity: Entity = {
                        id: `llm_npc_${Date.now()}`,
                        x: Math.floor(dungeonDimensions.width / 2),
                        y: Math.floor(dungeonDimensions.height / 2),
                        type: 'npc',
                        subtype: llmNPC.type.toLowerCase(),
                        name: llmNPC.name,
                        hp: 30,
                        maxHp: 30,
                        hostile: llmNPC.hostile,
                        dialogue: [
                            llmNPC.dialogue.greeting,
                            llmNPC.dialogue.backstory,
                            llmNPC.dialogue.information,
                            llmNPC.dialogue.farewell
                        ],
                        loot: llmNPC.items?.map(item => ({ name: item, quantity: 1 })),
                        description: `${llmNPC.backstory} ${llmNPC.motivation}`,
                        symbol: llmNPC.hostile ? 'H' : 'M',
                        emoji: llmNPC.hostile ? '⚔️' : '🧙',
                        color: llmNPC.hostile ? 'text-red-500' : 'text-blue-400',
                        canNegotiate: !llmNPC.hostile
                    };

                    // Add to entities if not already at max
                    setEntities(prev => {
                        if (prev.length < 10) {
                            console.log('Added LLM-generated NPC:', llmNPC.name, llmNPC.type);
                            return [...prev, specialEntity];
                        }
                        return prev;
                    });
                } catch (error) {
                    console.log('Could not generate LLM NPC:', error);
                }
            };

            // Only generate once per ruin
            const hasLLMNPC = entities.some(e => e.id.startsWith('llm_npc_'));
            if (!hasLLMNPC) {
                generateSpecialNPC();
            }
        }
    }, [currentDepth]);

    // Simple static particles for atmosphere (no animation)
    useEffect(() => {
        // Add a few static dust motes when entering new areas
        if (currentChamber) {
            const staticParticles = [];
            for (let i = 0; i < 10; i++) {
                staticParticles.push({
                    x: Math.floor(Math.random() * dungeonDimensions.width),
                    y: Math.floor(Math.random() * dungeonDimensions.height),
                    char: '·',
                    color: 'text-gray-600',
                    lifetime: 1000,
                    vx: 0,
                    vy: 0
                });
            }
            setParticles(staticParticles);
        }
    }, [currentChamber, dungeonDimensions]);

    // Get tile display with simple visibility
    // Get attack animation display
    const getAttackAnimationDisplay = (attack: AttackAnimation) => {
        const animationFrames: Record<string, Record<string, string[]>> = {
            slash: {
                north: ['|', '/', '─', '\\'],
                south: ['|', '\\', '─', '/'],
                east: ['─', '\\', '|', '/'],
                west: ['─', '/', '|', '\\']
            },
            thrust: {
                north: ['·', ':', '|', '!'],
                south: ['·', ':', '|', '!'],
                east: ['·', ':', '═', '─'],
                west: ['·', ':', '═', '─']
            },
            arc: {
                north: ['/', '─', '\\', '─'],
                south: ['\\', '─', '/', '─'],
                east: ['|', '/', '|', '\\'],
                west: ['|', '\\', '|', '/']
            }
        };
        
        const frames = animationFrames[attack.type]?.[attack.direction] || ['*'];
        const frameIndex = Math.min(Math.floor(attack.frame), frames.length - 1);
        const currentFrame = frames[frameIndex];
        
        return {
            char: currentFrame,
            color: attack.color,
            opacity: 1 - (attack.frame / attack.maxFrames) * 0.3,
            scale: 1 + (attack.frame / attack.maxFrames) * 0.2
        };
    };
    
    // Get material colors and patterns
    const materialColors = useMemo(() => {
        const material = ruinType.material || 'stone';
        return getMaterialColors(material);
    }, [ruinType.material]);

    const wallPattern = useMemo(() => {
        const material = ruinType.material || 'stone';
        return getMaterialWallPattern(material);
    }, [ruinType.material]);

    // Calculate light intensity at a tile based on nearby light sources
    const calculateLightLevel = useCallback((x: number, y: number): number => {
        let maxLight = 0;

        // Check all tiles in the dungeon for light sources
        for (let dy = -6; dy <= 6; dy++) {
            for (let dx = -6; dx <= 6; dx++) {
                const checkX = x + dx;
                const checkY = y + dy;

                if (checkY >= 0 && checkY < dungeon.length && checkX >= 0 && checkX < dungeon[0].length) {
                    const tile = dungeon[checkY][checkX];

                    // Check if tile is a light source
                    const isLightSource = tile.type === 'torch' ||
                                        tile.type === 'brazier' ||
                                        tile.type === 'campfire' ||
                                        tile.lightSource === true;

                    if (isLightSource) {
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const lightRadius = tile.lightRadius || 3;

                        if (distance <= lightRadius) {
                            // Light falls off with distance
                            const intensity = 1 - (distance / lightRadius);
                            maxLight = Math.max(maxLight, intensity);
                        }
                    }
                }
            }
        }

        // Also check if player has a torch (always light around player)
        if (player.hasTorch) {
            const distToPlayer = Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2);
            if (distToPlayer <= 4) {
                const intensity = 1 - (distToPlayer / 4);
                maxLight = Math.max(maxLight, intensity * 0.8);
            }
        }

        return maxLight;
    }, [dungeon, player]);

    const getTileDisplay = (tile: DungeonTile, x: number, y: number) => {
        // Check for player - classic @ symbol
        if (x === player.x && y === player.y) {
            return { char: '@', color: 'text-amber-400', glow: false };
        }

        // Check for static particles at this position
        const particle = particles.find(p => Math.floor(p.x) === x && Math.floor(p.y) === y);
        if (particle && tile.visible && tile.type === 'floor') {
            return { char: particle.char, color: particle.color, glow: false };
        }

        // Check for entities (including dying ones)
        const entity = entities.find(e => e.x === x && e.y === y && (e.hp > 0 || e.dying));
        if (entity && tile.visible) {
            // Use emoji sprite if available, otherwise fall back to ASCII symbol
            const displayChar = entity.dying ? '💀' : (entity.emoji || entity.symbol);
            const entityColor = entity.dying ? 'text-gray-500' : entity.color;
            return { char: displayChar, color: entityColor, glow: false, customColor: entity.dying ? '#666666' : undefined };
        }

        // Not visible and not explored = darkness
        if (!tile.visible && !tile.explored) {
            return { char: ' ', color: 'text-black', glow: false };
        }

        // Explored but not currently visible = dimmed
        const dimmed = !tile.visible && tile.explored;

        // Calculate dynamic lighting for this tile
        const lightLevel = tile.visible ? calculateLightLevel(x, y) : 0;

        // Examinable environmental storytelling elements - show with special symbol
        if (tile.examinable && tile.visible) {
            return {
                char: '✦', // Sparkle to indicate something interesting
                color: dimmed ? 'text-amber-700' : 'text-amber-300',
                glow: true,
                customColor: dimmed ? '#b8860b' : '#d4af37'
            };
        }

        switch (tile.type) {
            case 'wall':
                // Use material-specific wall pattern with dynamic lighting
                const wallChar = wallPattern;
                // Calculate opacity based on light level
                const wallOpacity = dimmed ? '40' : Math.floor(50 + (lightLevel * 150)).toString(16).padStart(2, '0');
                // Secret passages look subtly different (slightly dimmer)
                const wallColor = tile.secretPassage ? materialColors.wall + '99' : materialColors.wall + wallOpacity;
                return {
                    char: wallChar,
                    color: 'material-wall',
                    customColor: wallColor,
                    glow: false
                };
            case 'weak_wall':
                // Weak walls use cultural patterns to indicate they're breakable
                const weakWallChars: Record<string, string[]> = {
                    MENA: ['◆', '❖', '⌂', '◇', '◈', '✦'],
                    EAST_ASIAN: ['◎', '○', '◉', '⊙', '◐', '◑'],
                    EUROPEAN: ['┼', '╬', '†', '‡', '✠', '✙'],
                    SOUTH_ASIAN: ['✦', '✧', '◈', '◊', '◆', '✺'],
                    SUB_SAHARAN_AFRICAN: ['◊', '◇', '○', '●', '◐', '◑'],
                    OCEANIA: ['○', '◎', '◉', '⊚', '⊙', '◌'],
                    NORTH_AMERICAN_PRE_COLUMBIAN: ['◆', '◇', '△', '▽', '◊', '○'],
                    SOUTH_AMERICAN: ['◆', '◇', '○', '●', '◈', '◊'],
                    NORTH_AMERICAN_COLONIAL: ['┼', '╬', '†', '‡', '✠', '◊']
                };
                const weakChars = weakWallChars[culturalContext.culturalZone] || ['▒'];
                const weakChar = weakChars[Math.floor(Math.random() * weakChars.length)];
                return {
                    char: weakChar,
                    color: dimmed ? 'text-gray-700' : 'text-gray-500',
                    glow: false
                };
            case 'floor':
                // Use different floor patterns with dynamic lighting
                const floorChars = ['·', '.', '˙'];
                const floorChar = floorChars[Math.floor((x * 7 + y * 3) % 3)];
                // Calculate opacity based on light level (darker base for floors)
                const floorOpacity = dimmed ? '30' : Math.floor(40 + (lightLevel * 120)).toString(16).padStart(2, '0');
                return {
                    char: floorChar,
                    color: 'material-floor',
                    customColor: materialColors.floor + floorOpacity,
                    glow: false
                };
            case 'door':
                // Closed door with better character
                return { char: '▓', color: dimmed ? 'text-amber-800' : 'text-amber-600', glow: false };
            case 'open_door':
                // Open door or archway
                return { char: '▒', color: dimmed ? 'text-amber-900' : 'text-amber-700', glow: false };
            case 'archway':
                // Decorative archway
                return { char: '∩', color: dimmed ? 'text-gray-600' : 'text-gray-400', glow: false };
            case 'chest':
                if (!tile.chestOpened) {
                    return { char: '☒', color: dimmed ? 'text-amber-700' : 'text-amber-400', glow: !dimmed }; // Closed chest
                } else {
                    return { char: '☐', color: dimmed ? 'text-gray-600' : 'text-gray-400', glow: false }; // Opened chest
                }
            case 'treasure':
                if (tile.hasGold) return { char: '¤', color: dimmed ? 'text-yellow-700' : 'text-yellow-400', glow: !dimmed }; // Currency symbol
                if (tile.hasItem) return { char: '†', color: dimmed ? 'text-blue-700' : 'text-blue-400', glow: !dimmed }; // Dagger symbol
                return { char: '·', color: dimmed ? 'text-gray-700' : 'text-gray-600', glow: false };
            case 'manuscript': 
                return { char: '§', color: dimmed ? 'text-amber-700' : 'text-amber-300', glow: !dimmed }; // Section sign for scrolls
            case 'trap': 
                // Subtle indication - comma instead of period for armed traps
                return { char: tile.trapTriggered ? '♦' : ',', color: tile.trapTriggered ? (dimmed ? 'text-red-800' : 'text-red-500') : (dimmed ? 'text-gray-700' : 'text-gray-600'), glow: false };
            case 'stairs_down': 
                return { char: '↓', color: dimmed ? 'text-cyan-800' : 'text-cyan-400', glow: !dimmed }; // Down arrow
            case 'stairs_up': 
                return { char: '↑', color: dimmed ? 'text-cyan-800' : 'text-cyan-400', glow: !dimmed }; // Up arrow
            case 'entrance': 
                return { char: '◎', color: dimmed ? 'text-green-700' : 'text-green-400', glow: false }; // Bullseye
            case 'altar': 
                return { char: '†', color: dimmed ? 'text-purple-700' : 'text-purple-400', glow: !dimmed }; // Cross
            case 'statue': 
                return { char: '¶', color: dimmed ? 'text-gray-600' : 'text-gray-400', glow: false }; // Pilcrow
            case 'rubble':
                return { char: '•', color: dimmed ? 'text-gray-700' : 'text-gray-500', glow: false };
            case 'water':
                // Animated water effect - faster cycling
                const waterChars = ['≈', '~', '∼', '≋'];
                const waterChar = waterChars[Math.floor(Date.now() / 400) % waterChars.length];
                return { char: waterChar, color: dimmed ? 'text-blue-800' : 'text-blue-500', glow: false };
            case 'chasm':
                return { char: '░', color: dimmed ? 'text-gray-900' : 'text-gray-800', glow: false };
            case 'pillar':
                return { char: '●', color: dimmed ? 'text-gray-600' : 'text-gray-400', glow: false }; // Black circle
            case 'food':
                return { char: '♣', color: dimmed ? 'text-green-700' : 'text-green-400', glow: !dimmed }; // Club for food
            case 'torch':
                // Animated torch flame - cycles through different flame shapes
                const torchChars = ['⟡', '✦', '✧', '❋', '✺'];
                const torchChar = torchChars[Math.floor(Date.now() / 250) % torchChars.length];
                const torchColors = ['#ff8800', '#ffaa00', '#ff6600', '#ffcc00'];
                const torchColor = torchColors[Math.floor(Date.now() / 250) % torchColors.length];
                return {
                    char: torchChar,
                    color: dimmed ? 'text-orange-700' : 'text-orange-400',
                    glow: !dimmed,
                    customColor: dimmed ? undefined : torchColor
                };
            case 'brazier':
                // Animated brazier with different fire pattern
                const brazierChars = ['▲', '▴', '▵', '△'];
                const brazierChar = brazierChars[Math.floor(Date.now() / 200) % brazierChars.length];
                return {
                    char: brazierChar,
                    color: dimmed ? 'text-red-700' : 'text-red-500',
                    glow: !dimmed,
                    customColor: dimmed ? undefined : '#ff4400'
                };
            case 'campfire':
                // Animated campfire - most energetic flame
                const campfireChars = ['⟨⟩', '⟪⟫', '≪≫', '‹›', '«»'];
                const campfireChar = campfireChars[Math.floor(Date.now() / 300) % campfireChars.length];
                const campfireColors = ['#ff3300', '#ff5500', '#ff7700'];
                const campfireColor = campfireColors[Math.floor(Date.now() / 300) % campfireColors.length];
                return {
                    char: campfireChar,
                    color: dimmed ? 'text-red-700' : 'text-red-500',
                    glow: !dimmed,
                    customColor: dimmed ? undefined : campfireColor
                };
            case 'inscription':
                return { char: '≡', color: dimmed ? 'text-amber-700' : 'text-amber-500', glow: false }; // Triple bar for text
            case 'mural':
                return { char: '▣', color: dimmed ? 'text-indigo-700' : 'text-indigo-400', glow: false }; // Filled square for art
            case 'debris':
                return { char: '∙', color: dimmed ? 'text-gray-700' : 'text-gray-500', glow: false };
            case 'locked_door':
                return { char: '█', color: dimmed ? 'text-red-800' : 'text-red-600', glow: false }; // Solid block for locked door
            case 'discovery':
                if (!tile.hasBeenDiscovered) {
                    return {
                        char: '?',
                        color: 'text-amber-400',
                        glow: true,
                        strongGlow: true,
                        gradient: 'from-amber-300 to-yellow-500',
                        fontWeight: 'font-bold'
                    };
                }
                return { char: '.', color: dimmed ? 'text-gray-700' : 'text-gray-600', glow: false };
            case 'boulder':
                return { char: '●', color: dimmed ? 'text-gray-600' : 'text-gray-300', glow: false };
            // Removed fantasy trap types - keeping only realistic traps
            default: 
                return { char: '?', color: 'text-white', glow: false };
        }
    };

    // Death screen
    if (player.hp <= 0) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
                <div className="text-center" style={{ fontFamily: 'monospace' }}>
                    <h2 className="text-4xl font-bold mb-4" style={{ color: '#ff6b00', textShadow: '0 0 20px #ff6b00' }}>
                        ☠ YOU HAVE PERISHED ☠
                    </h2>
                    <p className="text-xl mb-4" style={{ color: '#ff9500' }}>
                        The ancient ruins have claimed your life...
                    </p>
                    <p className="text-lg mb-2" style={{ color: '#ffa500' }}>Gold collected: {Math.round(player.gold)}</p>
                    <p className="text-lg mb-2" style={{ color: '#ffa500' }}>Items found: {player.inventory.length}</p>
                    <p className="text-lg mb-6" style={{ color: '#ffa500' }}>Manuscripts discovered: {player.manuscripts.length}</p>
                    <button
                        onClick={() => {
                            // Trigger the main game over modal if handler is provided
                            if (onPlayerDeath) {
                                onPlayerDeath({
                                    type: 'combat',
                                    description: `Perished in the depths of ${ruinType.name}`,
                                    opponent: 'ancient ruins',
                                    location: ruinType.name,
                                    depth: currentDepth,
                                    goldCollected: player.gold,
                                    itemsFound: player.inventory.length,
                                    manuscriptsFound: player.manuscripts.length
                                });
                            }
                            onExit();
                        }}
                        className="px-8 py-3 font-bold rounded"
                        style={{
                            backgroundColor: '#ff6b00',
                            color: 'black',
                            boxShadow: '0 0 20px #ff6b00'
                        }}
                    >
                        Your life flashes before your eyes
                    </button>
                </div>
            </div>
        );
    }

    // Render to fill the central game area
    return (
        <div ref={containerRef} className="absolute inset-0 bg-black flex flex-col" style={{ 
            fontFamily: 'monospace',
            zIndex: 50
        }}>
            {/* Terminal header - compact */}
            <div className="px-2 py-1 border-b" style={{ borderColor: '#ff6b00', backgroundColor: '#0a0a0a' }}>
                <div className="flex justify-between items-center w-full">
                    <h1 className="text-2xl font-bold" style={{ color: '#ff9500', textShadow: '0 0 10px #ff6b00' }}>
                        ▓ {ruinType.name || 'Ancient Ruins'} ▓
                    </h1>
                    <div className="flex gap-3 text-sm font-bold flex-wrap">
                        <span style={{ color: '#ff6b00' }}>HP: {Math.round(player.hp)}/{Math.round(player.maxHp)}</span>
                        <span style={{ color: '#ffaa00' }}>Gold: {Math.round(player.gold)}</span>
                        <span style={{ color: '#ff8800' }}>Lv: {Math.round(player.level)}</span>
                        <span style={{ color: '#66ff66' }}>EXP: {Math.round(player.experience || 0)}/{Math.round(player.nextLevelExp || 100)}</span>
                        <span style={{ color: player.hunger && player.hunger < 30 ? '#ff4444' : '#88ff88' }}>
                            Hunger: {Math.round(player.hunger || 100)}%
                        </span>
                        {player.hasTorch && <span style={{ color: '#ffcc00' }}>🕯️ {Math.round(player.torchTurns || 0)}</span>}
                        <span style={{ color: '#ff7700' }}>Turn: {turnCount}</span>
                        {/* Help button moved to top bar */}
                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className="px-2 py-1 rounded transition-all text-xs"
                            style={{
                                backgroundColor: showHelp ? '#ff6b00' : 'rgba(75, 85, 99, 0.8)',
                                color: showHelp ? 'black' : 'white',
                                border: '1px solid #ff6b00'
                            }}
                        >
                            {showHelp ? 'Hide' : 'Help'} (H)
                        </button>
                    </div>
                    {/* Zoom controls */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setZoomLevel(Math.max(12, zoomLevel - 2))}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
                            style={{ fontSize: '14px' }}
                        >
                            Zoom -
                        </button>
                        <span style={{ color: '#ffaa00', fontSize: '14px' }}>{zoomLevel}px</span>
                        <button
                            onClick={() => setZoomLevel(Math.min(32, zoomLevel + 2))}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
                            style={{ fontSize: '14px' }}
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>

            {/* Chamber name display - compact */}
            <div className="flex justify-center" style={{ backgroundColor: '#0a0a0a' }}>
                <div className="px-3 py-0.5 rounded border text-sm" 
                     style={{ 
                         borderColor: '#ff6b00', 
                         backgroundColor: '#1a1a1a',
                         boxShadow: '0 0 10px #ff6b00'
                     }}>
                    <div className="flex items-center gap-2 text-sm">
                        <span style={{ color: '#ffaa00' }}>📍</span>
                        <span style={{ color: '#ff9500' }}>{currentChamber}</span>
                        <span style={{ color: '#ff7700' }}>• Depth {currentDepth}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col relative" style={{ backgroundColor: '#0a0a0a' }}>
                <div className="absolute top-20 right-4 z-50">
                   
                </div>

                {/* Dungeon map - fills available space */}
                <div className="flex-1 overflow-auto flex justify-center items-center">
                    <div className="relative">
                        <pre style={{ fontSize: `${zoomLevel}px`, lineHeight: `${zoomLevel}px`, fontFamily: 'Courier New, Courier, monospace', margin: 0, letterSpacing: '0px' }}>
                            {dungeon.slice(viewportOffset.y, viewportOffset.y + VIEWPORT_HEIGHT).map((row, relativeY) => {
                                const absoluteY = viewportOffset.y + relativeY;
                                return (
                                    <div key={absoluteY} style={{ height: `${zoomLevel}px`, display: 'flex' }}>
                                        {row.slice(viewportOffset.x, viewportOffset.x + VIEWPORT_WIDTH).map((tile, relativeX) => {
                                            const absoluteX = viewportOffset.x + relativeX;
                                            const display = getTileDisplay(tile, absoluteX, absoluteY);
                                            return (
                                                <span
                                                    key={absoluteX}
                                                    className={`${display.customColor ? '' : display.color} ${display.gradient ? `bg-gradient-to-br ${display.gradient} bg-clip-text text-transparent` : ''}`}
                                                    style={{
                                                        width: `${zoomLevel}px`,
                                                        display: 'inline-block',
                                                        textAlign: 'center',
                                                        fontWeight: display.fontWeight || 'bold',
                                                        color: display.customColor || undefined,
                                                        ...(display.strongGlow ? {
                                                            textShadow: `0 0 12px currentColor, 0 0 20px currentColor, 0 0 8px #ffff00`
                                                        } : display.glow ? {
                                                            textShadow: `0 0 8px currentColor`
                                                        } : {})
                                                    }}
                                                >
                                                    {display.char}
                                                </span>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </pre>
                        
                        {/* Render attack animations */}
                        {activeAttacks.map(attack => {
                            const anim = getAttackAnimationDisplay(attack);
                            // Render for each tile in the pattern
                            return attack.pattern.map((tile, index) => {
                                // Only render if within viewport (with buffer for edge cases)
                                const buffer = 1;
                                if (tile.x < viewportOffset.x - buffer || tile.x >= viewportOffset.x + VIEWPORT_WIDTH + buffer ||
                                    tile.y < viewportOffset.y - buffer || tile.y >= viewportOffset.y + VIEWPORT_HEIGHT + buffer) {
                                    return null;
                                }
                                const relativeX = tile.x - viewportOffset.x;
                                const relativeY = tile.y - viewportOffset.y;
                                return (
                                    <div
                                        key={`${attack.id}_${index}`}
                                        className="absolute pointer-events-none"
                                        style={{
                                            left: `${relativeX * zoomLevel}px`,
                                            top: `${relativeY * zoomLevel}px`,
                                            width: `${zoomLevel}px`,
                                            height: `${zoomLevel}px`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: anim.color,
                                            opacity: anim.opacity,
                                            transform: `scale(${anim.scale})`,
                                            fontSize: `${zoomLevel * 1.2}px`,
                                            fontWeight: 'bold',
                                            textShadow: `0 0 10px ${anim.color}`,
                                            zIndex: 1000
                                        }}
                                    >
                                        {anim.char}
                                    </div>
                                );
                            });
                        })}
                        
                        {/* Render projectiles */}
                        {projectiles.filter(proj => {
                            // Give projectiles some buffer for fractional coordinates
                            const buffer = 1;
                            return proj.x >= viewportOffset.x - buffer && proj.x < viewportOffset.x + VIEWPORT_WIDTH + buffer &&
                                   proj.y >= viewportOffset.y - buffer && proj.y < viewportOffset.y + VIEWPORT_HEIGHT + buffer;
                        }).map(proj => (
                            <div
                                key={proj.id}
                                className="absolute pointer-events-none"
                                style={{
                                    left: `${(proj.x - viewportOffset.x) * zoomLevel}px`,
                                    top: `${(proj.y - viewportOffset.y) * zoomLevel}px`,
                                    width: `${zoomLevel}px`,
                                    height: `${zoomLevel}px`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: proj.color,
                                    fontSize: `${zoomLevel * 0.8}px`,
                                    fontWeight: 'bold',
                                    textShadow: `0 0 8px ${proj.color}`,
                                    zIndex: 900,
                                    transition: 'all 0.05s linear'
                                }}
                            >
                                {proj.symbol}
                            </div>
                        ))}
                        
                        {/* Render charge bar if charging */}
                        {chargingAttack && (
                            <div
                                className="absolute pointer-events-none"
                                style={{
                                    left: `${player.x * zoomLevel}px`,
                                    top: `${(player.y - 1) * zoomLevel}px`,
                                    width: `${zoomLevel}px`,
                                    height: '4px',
                                    backgroundColor: '#333',
                                    border: '1px solid #666',
                                    zIndex: 1100
                                }}
                            >
                                <div
                                    style={{
                                        width: `${chargeLevel}%`,
                                        height: '100%',
                                        backgroundColor: chargeLevel > 75 ? '#ff0000' :
                                                       chargeLevel > 50 ? '#ffaa00' :
                                                       chargeLevel > 25 ? '#ffff00' : '#00ff00',
                                        transition: 'width 0.1s, background-color 0.2s',
                                        boxShadow: chargeLevel > 75 ? '0 0 4px #ff0000' : 'none'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Message log - enhanced with expand functionality */}
                <div 
                    className={`border-t transition-all duration-300 ${gameLogExpanded ? 'fixed inset-0 z-50' : 'h-32'}`}
                    style={{ 
                        borderColor: '#ff6b00', 
                        backgroundColor: '#0a0a0a',
                        ...(gameLogExpanded && { 
                            borderColor: '#ff6b00',
                            boxShadow: '0 0 30px rgba(255, 107, 0, 0.5)'
                        })
                    }}
                >
                    {/* Header with expand/collapse button */}
                    <div className="flex items-center px-3 py-1 border-b" style={{ borderColor: '#ff6b00' }}>
                        <span style={{ color: '#ff9500', fontSize: '14px', fontWeight: 'bold', marginRight: '8px' }}>
                            Game Log {gameLogExpanded ? '(Full Screen)' : ''}
                        </span>
                        <button
                            onClick={() => setGameLogExpanded(!gameLogExpanded)}
                            className="px-2 py-1 text-xs rounded border transition-colors"
                            style={{
                                backgroundColor: gameLogExpanded ? '#ff6b00' : 'transparent',
                                borderColor: '#ff6b00',
                                color: gameLogExpanded ? '#000' : '#ff9500'
                            }}
                        >
                            {gameLogExpanded ? '↓ Collapse' : '↑ Expand'}
                        </button>
                    </div>
                    
                    {/* Messages area */}
                    <div className={`overflow-y-auto px-3 py-2 ${gameLogExpanded ? 'h-full' : 'h-24'}`}>
                        {gameMessages.map((msg, i) => (
                            <div 
                                key={i} 
                                className="mb-1"
                                style={{ 
                                    color: '#ff9500', 
                                    opacity: gameLogExpanded ? 1 : (1 - (gameMessages.length - i - 1) * 0.15),
                                    fontSize: gameLogExpanded ? '16px' : '14px',
                                    lineHeight: gameLogExpanded ? '1.4' : '1.2'
                                }}
                            >
                                <span style={{ color: '#666', marginRight: '6px' }}>{'>'}</span>
                                {msg}
                            </div>
                        ))}
                        {gameLogExpanded && gameMessages.length === 0 && (
                            <div style={{ color: '#666', fontStyle: 'italic' }}>No messages yet...</div>
                        )}
                    </div>
                </div>
                

                    {/* Enhanced Dialogue overlay with ASCII portrait */}
                    {currentDialogue && (
                        <div className="absolute inset-x-4 top-1/4 max-w-3xl mx-auto p-6 border-2 rounded-lg"
                             style={{ 
                                 backgroundColor: '#0a0a0a', 
                                 borderColor: '#ff6b00',
                                 boxShadow: '0 0 40px #ff6b00, inset 0 0 20px rgba(255, 107, 0, 0.1)'
                             }}>
                            <div className="flex gap-6">
                                {/* ASCII Portrait */}
                                <div className="flex-shrink-0">
                                    <pre style={{ 
                                        fontFamily: 'monospace', 
                                        fontSize: '12px',
                                        lineHeight: '1',
                                        color: currentDialogue.entity.hostile ? '#ff4444' : '#ffaa00',
                                        textShadow: currentDialogue.entity.hostile ? '0 0 5px #ff0000' : '0 0 5px #ff6b00'
                                    }}>
                                        {(() => {
                                            const portrait = applyCulturalStyle(
                                                getASCIIPortrait(
                                                    currentDialogue.entity.type, 
                                                    currentDialogue.entity.subtype,
                                                    currentDialogue.entity.hostile
                                                ),
                                                culturalContext.culturalZone
                                            );
                                            const framedPortrait = framePortrait(portrait, currentDialogue.entity.name);
                                            return framedPortrait.join('\n');
                                        })()}
                                    </pre>
                                    {/* Health bar */}
                                    <div className="text-center mt-2" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                                        <span style={{ color: '#ff6b00' }}>
                                            {getHealthBar(currentDialogue.entity.hp, currentDialogue.entity.maxHp, 15)}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Dialogue text */}
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold mb-3" style={{ 
                                        color: '#ffaa00',
                                        textShadow: '0 0 10px #ff6b00'
                                    }}>
                                        {currentDialogue.entity.name}
                                        {currentDialogue.entity.hostile && 
                                            <span className="ml-2 text-sm" style={{ color: '#ff4444' }}>[HOSTILE]</span>
                                        }
                                    </h3>
                                    <p style={{ 
                                        color: '#ff9500',
                                        fontFamily: 'serif',
                                        fontSize: '16px',
                                        fontStyle: 'italic',
                                        lineHeight: '1.5'
                                    }} className="mb-4">
                                        "{currentDialogue.message}"
                                    </p>
                                    
                                    {/* Action buttons */}
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setCurrentDialogue(null)}
                                            className="px-6 py-2 rounded font-bold transition-all"
                                            style={{ 
                                                backgroundColor: '#ff6b00', 
                                                color: 'black',
                                                boxShadow: '0 0 10px #ff6b00'
                                            }}
                                        >
                                            [Continue]
                                        </button>
                                        {currentDialogue.entity.hostile && currentDialogue.entity.canNegotiate && (
                                            <button 
                                                onClick={() => {
                                                    // Trigger negotiation
                                                    const event = new KeyboardEvent('keydown', { key: 't' });
                                                    window.dispatchEvent(event);
                                                    setCurrentDialogue(null);
                                                }}
                                                className="px-6 py-2 rounded font-bold transition-all"
                                                style={{ 
                                                    backgroundColor: '#4a4a4a', 
                                                    color: '#ff9500',
                                                    border: '1px solid #ff6b00'
                                                }}
                                            >
                                                [Try to Talk - T]
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    
                    {/* Help overlay - positioned above game log */}
                    {showHelp && (
                        <div className="absolute bottom-44 right-8 w-64 p-4 rounded max-h-96 overflow-y-auto" 
                             style={{ 
                                 backgroundColor: 'rgba(26, 26, 26, 0.85)', 
                                 border: '2px solid rgba(255, 107, 0, 0.8)',
                                 backdropFilter: 'blur(4px)',
                                 boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
                             }}>
                            <h3 className="text-base font-bold mb-2" style={{ color: '#ff9500' }}>
                                ═══ CONTROLS ═══
                            </h3>
                            <div className="space-y-1 text-xs mb-4" style={{ color: '#ff8800' }}>
                                <div><b>Arrows</b> - Move</div>
                                <div><b>WASD (tap)</b> - Quick attack</div>
                                <div><b>WASD (hold)</b> - Charge attack</div>
                                <div><b>Shift+WASD</b> - Ranged attack</div>
                                <div className="mt-2 pt-2 border-t border-gray-700">
                                    <div className="font-bold mb-1">Charge Levels:</div>
                                    <div>🟢 Quick tap - Normal damage</div>
                                    <div>🟡 1s hold - 1.5x damage</div>
                                    <div>🟠 2s hold - 2x damage</div>
                                    <div>🔴 Full charge - Special attack!</div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-700">
                                    <div>M - Read Manuscripts</div>
                                    <div>T - Talk/Negotiate</div>
                                    <div>P - Push Boulder</div>
                                    <div>B - Break Wall</div>
                                    <div>E - Extinguish Fire</div>
                                    <div>Q - Activate Mechanism</div>
                                </div>
                                <div>{'>'} - Descend stairs</div>
                                <div>H - Toggle this help</div>
                                <div>ESC - Exit dungeon</div>
                            </div>
                            
                            <h3 className="text-base font-bold mb-2" style={{ color: '#ff9500' }}>
                                ═══ SYMBOLS ═══
                            </h3>
                            <div className="space-y-0.5 text-xs" style={{ color: '#ff8800' }}>
                                <div><span className="text-amber-400">@</span> - You</div>
                                <div><span className="text-gray-400">█</span> - Wall</div>
                                <div><span className="text-yellow-400">¤</span> - Gold</div>
                                <div><span className="text-blue-400">†</span> - Item</div>
                                <div><span className="text-amber-300">§</span> - Manuscript</div>
                                <div><span className="text-green-400">♣</span> - Food</div>
                                <div><span className="text-orange-400">†</span> - Torch</div>
                                <div><span className="text-cyan-400">↓</span> - Stairs Down</div>
                                <div><span className="text-purple-400">†</span> - Altar</div>
                                <div><span className="text-red-500">♦</span> - Triggered Trap</div>
                                <div><span className="text-gray-600">·</span> - Hidden Trap</div>
                                <div><span className="text-gray-400">¶</span> - Statue</div>
                                <div><span className="text-gray-500">#</span> - Rubble</div>
                                <div><span className="text-blue-600">≈</span> - Water</div>
                                <div><span className="text-amber-500">≡</span> - Inscription</div>
                                <div><span className="text-indigo-400">▣</span> - Mural</div>
                                <div><span className="text-orange-500">◈</span> - Brazier (light)</div>
                                <div><span className="text-cyan-400">◊</span> - Crystal (light)</div>
                                <div><span className="text-yellow-600">□</span> - Pressure Plate</div>
                                <div><span className="text-purple-400">╥</span> - Lever</div>
                                <div><span className="text-red-600">▩</span> - Sealed Door</div>
                            </div>
                            
                            <h3 className="text-base font-bold mt-3 mb-2" style={{ color: '#ff9500' }}>
                                ═══ CREATURES ═══
                            </h3>
                            <div className="space-y-0.5 text-xs" style={{ color: '#ff8800' }}>
                                <div><span className="text-gray-400">r</span> - Rat</div>
                                <div><span className="text-purple-400">b</span> - Bat</div>
                                <div><span className="text-gray-500">s</span> - Spider</div>
                                <div><span className="text-green-500">s</span> - Snake</div>
                                <div><span className="text-amber-300">H</span> - Hermit (friendly)</div>
                                <div><span className="text-red-400">b/O/P</span> - Hostile humans</div>
                                <div><span className="text-brown-400">m</span> - Monkey</div>
                            </div>
                            
                            <h3 className="text-base font-bold mt-3 mb-2" style={{ color: '#ff9500' }}>
                                ═══ GAMEPLAY TIPS ═══
                            </h3>
                            <div className="space-y-1 text-xs" style={{ color: '#ff8800' }}>
                                <div>• Explore carefully - traps are hidden</div>
                                <div>• Combat: Higher ground = advantage</div>
                                <div>• Torches expand vision range</div>
                                <div>• Food restores hunger</div>
                                <div>• Manuscripts contain history</div>
                                <div>• Some creatures may be friendly</div>
                                <div>• Level up by defeating enemies</div>
                                <div>• Descend deeper for better loot</div>
                            </div>
                            
                            {player.inventory.length > 0 && (
                                <>
                                    <h3 className="text-base font-bold mt-3 mb-2" style={{ color: '#ff9500' }}>
                                        ═══ INVENTORY ═══
                                    </h3>
                                    <div className="space-y-0.5 text-xs" style={{ color: '#ff8800' }}>
                                        {player.inventory.slice(-5).map((item, i) => (
                                            <div key={i}>• {item.name}</div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

            
      
            
            {/* Always visible legend - top right corner, below header */}
            <div className="absolute top-16 right-4 p-2 rounded"
                 style={{
                     backgroundColor: '#0a0a0a',
                     border: '1px solid #ff6b00',
                     maxWidth: '200px'
                 }}>
                <h3 className="text-xs font-bold mb-1" style={{ color: '#ff9500', fontSize: '10px' }}>
                    LEGEND
                </h3>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0" style={{ fontSize: '9px', lineHeight: '1.4' }}>
                    <div className="flex items-center gap-1">
                        <span className="text-amber-400">@</span>
                        <span style={{ color: '#ff8800' }}>You</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-gray-400">█</span>
                        <span style={{ color: '#ff8800' }}>Wall</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-yellow-400">¤</span>
                        <span style={{ color: '#ff8800' }}>Gold</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-blue-400">†</span>
                        <span style={{ color: '#ff8800' }}>Item</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-green-400">♣</span>
                        <span style={{ color: '#ff8800' }}>Food</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-cyan-400">↓</span>
                        <span style={{ color: '#ff8800' }}>Stairs</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-amber-300">§</span>
                        <span style={{ color: '#ff8800' }}>Scroll</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-amber-300">✦</span>
                        <span style={{ color: '#ff8800' }}>Examine</span>
                    </div>
                </div>
                <div className="mt-1 pt-1 border-t" style={{ fontSize: '8px', color: '#ff8800', lineHeight: '1.2', borderColor: '#ff6b00' }}>
                    <div>↑↓←→ Move • WASD Attack • Space Interact</div>
                    <div>H Help • ESC Exit</div>
                </div>
            </div>
            
            {/* Render sound effects positioned relative to map */}
            <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'hidden' }}>
                {soundEffects.map(effect => {
                    // Calculate position relative to the map container
                    const mapContainer = containerRef.current?.querySelector('pre');
                    if (!mapContainer) return null;
                    
                    const mapRect = mapContainer.getBoundingClientRect();
                    const containerRect = containerRef.current?.getBoundingClientRect();
                    
                    if (!containerRect) return null;
                    
                    // Calculate screen position of the effect
                    const screenX = (mapRect.left - containerRect.left) + (effect.x * zoomLevel) + (zoomLevel / 2);
                    const screenY = (mapRect.top - containerRect.top) + (effect.y * zoomLevel) + (zoomLevel / 2);
                    
                    // Only show if within container bounds
                    if (screenX < 0 || screenX > containerRect.width || 
                        screenY < 0 || screenY > containerRect.height) {
                        return null;
                    }
                    
                    return (
                        <div
                            key={effect.id}
                            className="absolute"
                            style={{
                                left: `${screenX}px`,
                                top: `${screenY}px`,
                                transform: 'translate(-50%, -50%)',
                                color: effect.color,
                                fontSize: '14px',
                                fontWeight: 'bold',
                                fontFamily: 'monospace',
                                textShadow: `0 0 8px ${effect.color}`,
                                animation: effect.style === 'shake' ? 'soundShake 0.5s ease-out' : 
                                          effect.style === 'float' ? 'soundFloat 2s ease-out' : 'soundFadeOut 2s ease-in-out',
                                zIndex: 1000,
                                userSelect: 'none'
                            }}
                        >
                            {effect.text}
                        </div>
                    );
                })}
            </div>

            {/* HP bars for enemies */}
            <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'hidden' }}>
                {entities.filter(e => e.hp > 0 || e.dying).map(entity => {
                    // Calculate position relative to the map container
                    const mapContainer = containerRef.current?.querySelector('pre');
                    if (!mapContainer) return null;

                    const mapRect = mapContainer.getBoundingClientRect();
                    const containerRect = containerRef.current?.getBoundingClientRect();

                    if (!containerRect) return null;

                    // Calculate tile position within viewport
                    const tileX = entity.x - viewportOffset.x;
                    const tileY = entity.y - viewportOffset.y;

                    // Only show if within viewport
                    if (tileX < 0 || tileX >= VIEWPORT_WIDTH || tileY < 0 || tileY >= VIEWPORT_HEIGHT) {
                        return null;
                    }

                    // Calculate screen position of the HP bar (above the entity)
                    const screenX = (mapRect.left - containerRect.left) + (tileX * zoomLevel) + (zoomLevel / 2);
                    const screenY = (mapRect.top - containerRect.top) + (tileY * zoomLevel) - (zoomLevel * 0.3);

                    const hpPercent = (entity.hp / (entity.maxHp || entity.hp)) * 100;
                    const barWidth = zoomLevel * 0.8;
                    const barHeight = 3;

                    return (
                        <div
                            key={`hp-${entity.id}`}
                            className="absolute"
                            style={{
                                left: `${screenX}px`,
                                top: `${screenY}px`,
                                transform: 'translate(-50%, -100%)',
                                zIndex: 999,
                                opacity: entity.dying ? 0.3 : 0.9
                            }}
                        >
                            {/* HP bar background */}
                            <div style={{
                                width: `${barWidth}px`,
                                height: `${barHeight}px`,
                                backgroundColor: '#333',
                                border: '1px solid #666',
                                borderRadius: '2px',
                                overflow: 'hidden'
                            }}>
                                {/* HP bar fill */}
                                <div style={{
                                    width: `${hpPercent}%`,
                                    height: '100%',
                                    backgroundColor: hpPercent > 60 ? '#00ff00' :
                                                     hpPercent > 30 ? '#ffaa00' : '#ff0000',
                                    transition: 'width 0.3s ease-out, background-color 0.3s ease-out',
                                    boxShadow: `0 0 4px ${hpPercent > 60 ? '#00ff00' : hpPercent > 30 ? '#ffaa00' : '#ff0000'}`
                                }}/>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Ambiance text */}
            {ambianceTexts.map(ambiance => (
                <div
                    key={ambiance.id}
                    className="absolute bottom-32 left-1/2 transform -translate-x-1/2 pointer-events-none"
                    style={{
                        color: ambiance.color,
                        opacity: ambiance.opacity,
                        fontSize: '14px',
                        fontStyle: 'italic',
                        fontFamily: 'Georgia, serif',
                        textAlign: 'center',
                        transition: 'opacity 1s ease-in-out',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        maxWidth: '600px'
                    }}
                >
                    {ambiance.text}
                </div>
            ))}
            
            {/* Add CSS animations */}
            <style>{`
                @keyframes soundShake {
                    0%, 100% { 
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    10% { transform: translate(-50%, -50%) translateX(-1px) scale(1.1); }
                    20% { transform: translate(-50%, -50%) translateX(1px) scale(1.1); }
                    30% { transform: translate(-50%, -50%) translateX(-1px) scale(1.05); }
                    40% { transform: translate(-50%, -50%) translateX(1px) scale(1.05); }
                    50% { transform: translate(-50%, -50%) scale(1); }
                    60% { opacity: 1; }
                    100% { 
                        transform: translate(-50%, -50%) scale(0.8);
                        opacity: 0;
                    }
                }
                
                @keyframes soundFloat {
                    0% { 
                        transform: translate(-50%, -50%) translateY(0) scale(1);
                        opacity: 1;
                    }
                    20% {
                        transform: translate(-50%, -50%) translateY(-8px) scale(1.1);
                        opacity: 1;
                    }
                    100% { 
                        transform: translate(-50%, -50%) translateY(-35px) scale(0.7);
                        opacity: 0;
                    }
                }
                
                @keyframes soundFadeOut {
                    0% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    30% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.05);
                    }
                    70% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    85% {
                        opacity: 0.7;
                        transform: translate(-50%, -50%) scale(0.95);
                    }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10% { transform: translateX(-4px) translateY(2px); }
                    20% { transform: translateX(4px) translateY(-2px); }
                    30% { transform: translateX(-4px) translateY(2px); }
                    40% { transform: translateX(4px) translateY(-2px); }
                    50% { transform: translateX(-2px) translateY(1px); }
                    60% { transform: translateX(2px) translateY(-1px); }
                    70% { transform: translateX(-2px) translateY(1px); }
                    80% { transform: translateX(2px) translateY(-1px); }
                    90% { transform: translateX(-1px); }
                }
            `}</style>

            {showSourceReader && (
                <DiscoveryTerminal
                    ruinName={ruinType.name}
                    era={culturalContext.era}
                    culturalZone={culturalContext.culturalZone}
                    discoveredSources={discoveredSources}
                    selectedSource={selectedSource}
                    onSelectSource={setSelectedSource}
                    onClose={() => setShowSourceReader(false)}
                />
            )}

            {/* Historical Encounter Terminal - Full Screen Overlay */}
            {showEncounterModal && currentEncounter && (
                <div className="absolute inset-0 flex items-center justify-center z-50"
                     style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>
                    <div className="w-full max-w-5xl h-5/6 flex flex-col p-6"
                         style={{
                             backgroundColor: '#0a0a0a',
                             border: '2px solid #ff8800',
                             boxShadow: '0 0 20px #ff6600',
                             fontFamily: 'Courier New, monospace'
                         }}>
                        {/* Terminal Header */}
                        <div className="mb-4" style={{ borderBottom: '2px solid #ff8800', paddingBottom: '10px' }}>
                            <div className="text-center mb-2">
                                <div className="text-3xl font-bold" style={{ color: '#ff9500', textShadow: '0 0 15px #ff6600' }}>
                                    ╔══════════════════════════════════════════════════════╗
                                </div>
                                <div className="text-2xl font-bold my-2" style={{ color: '#ff9500', textShadow: '0 0 10px #ff6600' }}>
                                    A VISION...
                                </div>
                                <div className="text-3xl font-bold" style={{ color: '#ff9500', textShadow: '0 0 15px #ff6600' }}>
                                    ╚══════════════════════════════════════════════════════╝
                                </div>
                            </div>
                            <div className="text-sm mt-3" style={{ color: '#ff8800' }}>
                                &gt; LOCATION: {currentEncounter.location || ruinType.name}
                                {currentEncounter.year && ` | YEAR: ${currentEncounter.year > 0 ? currentEncounter.year : Math.abs(currentEncounter.year) + ' BCE'}`}
                                {` | ERA: ${currentEncounter.era}`}
                            </div>
                            <div className="text-sm mt-1" style={{ color: '#ff8800' }}>
                                &gt; ENCOUNTER: {currentEncounter.title}
                            </div>
                        </div>

                        {/* Encounter Content */}
                        <div className="flex-1 overflow-y-auto mb-4">
                            {!encounterOutcome ? (
                                <div className="space-y-6">
                                    {/* Historical Context */}
                                    <div style={{ color: '#ff9500' }}>
                                        <div className="text-lg font-bold mb-3" style={{ color: '#ff9500' }}>
                                            ═══ HISTORICAL CONTEXT ═══
                                        </div>
                                        <div className="border-l-2 pl-4" style={{ borderColor: '#ff6600', color: '#ffa500' }}>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                {currentEncounter.contextText}
                                            </p>
                                        </div>
                                    </div>

                                    {/* The Encounter */}
                                    <div style={{ color: '#ff9500' }}>
                                        <div className="text-lg font-bold mb-3" style={{ color: '#ff9500' }}>
                                            ═══ THE MOMENT ═══
                                        </div>
                                        <div className="border-l-2 pl-4" style={{ borderColor: '#ff6600', color: '#ffb500' }}>
                                            <p className="text-base leading-relaxed whitespace-pre-wrap font-medium">
                                                {currentEncounter.encounterText}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Artifacts Found */}
                                    {currentEncounter.artifacts && currentEncounter.artifacts.length > 0 && (
                                        <div style={{ color: '#ff9500' }}>
                                            <div className="text-lg font-bold mb-2" style={{ color: '#ff9500' }}>
                                                ═══ ARTIFACTS PRESENT ═══
                                            </div>
                                            <div className="pl-4">
                                                {currentEncounter.artifacts.map((artifact, idx) => (
                                                    <div key={idx} className="text-sm" style={{ color: '#ffa500' }}>
                                                        ◊ {artifact}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Player Choices */}
                                    <div style={{ color: '#ff9500' }}>
                                        <div className="text-lg font-bold mb-3" style={{ color: '#ff9500' }}>
                                            ═══ YOUR CHOICE ═══
                                        </div>
                                        <div className="space-y-3">
                                            {currentEncounter.choices.map((choice, idx) => {
                                                const canSelect = historicalEncounterService.canSelectChoice(
                                                    choice,
                                                    {
                                                        intelligence: playerCharacter.intelligence || 10,
                                                        wisdom: playerCharacter.wisdom || 10,
                                                        charisma: playerCharacter.charisma || 10
                                                    },
                                                    player.inventory.map(i => i.name)
                                                );

                                                return (
                                                    <button
                                                        key={choice.id}
                                                        onClick={() => canSelect && setSelectedChoiceId(choice.id)}
                                                        disabled={!canSelect}
                                                        className={`w-full text-left p-4 rounded transition-all ${
                                                            selectedChoiceId === choice.id
                                                                ? 'bg-orange-900 bg-opacity-30'
                                                                : 'hover:bg-orange-900 hover:bg-opacity-20'
                                                        } ${!canSelect ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                        style={{
                                                            border: selectedChoiceId === choice.id
                                                                ? '2px solid #ff8800'
                                                                : '2px solid transparent',
                                                            color: canSelect ? '#ffb500' : '#aa6600'
                                                        }}>
                                                        <div className="flex items-start gap-3">
                                                            <div className="text-xl font-bold" style={{ color: '#ff9500' }}>
                                                                [{idx + 1}]
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="text-base mb-1">
                                                                    {choice.text}
                                                                </div>
                                                                {choice.requirements && (
                                                                    <div className="text-xs mt-1" style={{ color: '#ff6600' }}>
                                                                        {!canSelect && '✗ Requirements not met'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Historical Note */}
                                    {currentEncounter.historicalNote && (
                                        <div className="mt-6 p-4 rounded" style={{
                                            backgroundColor: 'rgba(255, 136, 0, 0.1)',
                                            border: '1px solid #ff6600'
                                        }}>
                                            <div className="text-sm font-bold mb-2" style={{ color: '#ff9500' }}>
                                                📚 HISTORICAL NOTE
                                            </div>
                                            <div className="text-xs" style={{ color: '#ffa500' }}>
                                                {currentEncounter.historicalNote}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Outcome Display */
                                <div className="space-y-6">
                                    <div style={{ color: '#ff9500' }}>
                                        <div className="text-lg font-bold mb-3" style={{ color: '#ff9500' }}>
                                            ═══ OUTCOME ═══
                                        </div>
                                        <div className="border-l-2 pl-4" style={{ borderColor: '#ff6600', color: '#ffb500' }}>
                                            <p className="text-base leading-relaxed whitespace-pre-wrap">
                                                {encounterOutcome}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-center mt-8">
                                        <button
                                            onClick={() => {
                                                setShowEncounterModal(false);
                                                setCurrentEncounter(null);
                                                setSelectedChoiceId(null);
                                                setEncounterOutcome(null);
                                            }}
                                            className="px-6 py-3 rounded"
                                            style={{
                                                backgroundColor: '#ff6600',
                                                color: '#000',
                                                fontWeight: 'bold',
                                                fontSize: '16px'
                                            }}>
                                            RETURN TO RUINS
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Terminal Commands */}
                        {!encounterOutcome && (
                            <div className="text-sm border-t-2 pt-3" style={{ color: '#ff8800', borderColor: '#ff8800' }}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        [1-3] Select Choice | [ENTER] Confirm Selection | [ESC] Defer Decision
                                    </div>
                                    {selectedChoiceId && (
                                        <button
                                            onClick={() => {
                                                const choice = currentEncounter.choices.find(c => c.id === selectedChoiceId);
                                                if (choice) {
                                                    // Apply choice effects
                                                    setEncounterOutcome(choice.outcome.description);

                                                    // Apply effects to player
                                                    if (choice.outcome.effects.health) {
                                                        const newHealth = Math.max(0, player.hp + choice.outcome.effects.health);
                                                        setPlayer(prev => ({ ...prev, hp: newHealth }));
                                                        onHealthChange?.(newHealth);
                                                    }

                                                    if (choice.outcome.effects.reputation) {
                                                        // Could integrate with reputation system here
                                                        addMessage(`Your reputation ${choice.outcome.effects.reputation > 0 ? 'increased' : 'decreased'}!`);
                                                    }

                                                    if (choice.outcome.effects.items && choice.outcome.effects.items.length > 0) {
                                                        // Add items to inventory
                                                        choice.outcome.effects.items.forEach(itemName => {
                                                            addMessage(`You gained: ${itemName}`);
                                                        });
                                                    }

                                                    if (choice.outcome.effects.primarySources && choice.outcome.effects.primarySources.length > 0) {
                                                        // Add to discovered sources
                                                        choice.outcome.effects.primarySources.forEach(source => {
                                                            addMessage(`Historical source discovered: ${source}`);
                                                        });
                                                    }

                                                    if (choice.outcome.effects.knowledge) {
                                                        // Display knowledge gained
                                                        setTimeout(() => {
                                                            addMessage(`Knowledge gained: ${choice.outcome.effects.knowledge}`);
                                                        }, 100);
                                                    }
                                                }
                                            }}
                                            className="px-4 py-2 rounded font-bold"
                                            style={{
                                                backgroundColor: '#ff8800',
                                                color: '#000'
                                            }}>
                                            MAKE YOUR CHOICE
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Discovery Choice Modal */}
            {showDiscoveryModal && currentDiscoveryPrompt && (
                <div className="absolute inset-0 flex items-center justify-center z-50"
                     style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
                    <div className="max-w-2xl w-full mx-4 p-6 border-2 rounded"
                         style={{
                             backgroundColor: '#0a0a0a',
                             borderColor: '#ff6b00',
                             boxShadow: '0 0 20px #ff6b00',
                             fontFamily: 'monospace'
                         }}>
                        {/* Prompt Text */}
                        <div className="mb-6 text-center">
                            <p className="text-xl font-bold mb-4" style={{ color: '#ff6b00' }}>
                                {currentDiscoveryPrompt.prompt}
                            </p>
                        </div>

                        {/* Choice Buttons */}
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => handleDiscoveryChoice(0)}
                                className="px-6 py-3 font-bold rounded transition-all hover:scale-105"
                                style={{
                                    backgroundColor: '#ff6b00',
                                    color: '#0a0a0a',
                                    boxShadow: '0 0 10px #ff6b00',
                                    minWidth: '150px'
                                }}
                            >
                                {currentDiscoveryPrompt.options[0]}
                            </button>
                            <button
                                onClick={() => handleDiscoveryChoice(1)}
                                className="px-6 py-3 font-bold rounded transition-all hover:scale-105"
                                style={{
                                    backgroundColor: '#666',
                                    color: '#fff',
                                    boxShadow: '0 0 10px #666',
                                    minWidth: '150px'
                                }}
                            >
                                {currentDiscoveryPrompt.options[1]}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Environmental Examination Modal */}
            {showExaminationModal && currentExamination && (
                <div className="absolute inset-0 flex items-center justify-center z-50"
                     style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}>
                    <div className="max-w-3xl w-full mx-4 p-8 border-2 rounded-lg"
                         style={{
                             backgroundColor: '#1a1410',
                             borderColor: '#d4af37',
                             boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
                             fontFamily: 'Georgia, serif'
                         }}>

                        {/* Category badge */}
                        <div className="text-center mb-4">
                            <span className="px-4 py-1 rounded-full text-xs uppercase tracking-wider"
                                  style={{
                                      backgroundColor: 'rgba(212, 175, 55, 0.2)',
                                      color: '#d4af37',
                                      border: '1px solid #d4af37'
                                  }}>
                                {currentExamination.category}
                            </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl font-bold text-center mb-6"
                            style={{
                                color: '#d4af37',
                                textShadow: '0 0 10px rgba(212, 175, 55, 0.5)',
                                fontFamily: 'Georgia, serif'
                            }}>
                            {currentExamination.title}
                        </h2>

                        {/* Description */}
                        <div className="mb-8 px-4">
                            <p className="text-lg leading-relaxed"
                               style={{
                                   color: '#e8d4a8',
                                   textAlign: 'justify',
                                   lineHeight: '1.8'
                               }}>
                                {currentExamination.description}
                            </p>
                        </div>

                        {/* Location info */}
                        <div className="text-center text-sm mb-6"
                             style={{ color: '#a89968', fontStyle: 'italic' }}>
                            Discovered in {currentExamination.location.chamber}, Depth {currentExamination.location.depth}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => {
                                    // Save to journal if not already saved
                                    if (!journalEntries.find(e => e.id === currentExamination.id)) {
                                        setJournalEntries(prev => [...prev, currentExamination]);
                                        addMessage(`Saved to journal: ${currentExamination.title}`);
                                    }
                                    setShowExaminationModal(false);
                                    setCurrentExamination(null);
                                }}
                                className="px-8 py-3 font-semibold rounded transition-all hover:scale-105"
                                style={{
                                    backgroundColor: '#d4af37',
                                    color: '#1a1410',
                                    boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)',
                                    fontFamily: 'Georgia, serif',
                                    fontSize: '16px'
                                }}>
                                📖 Save to Journal
                            </button>
                            <button
                                onClick={() => {
                                    setShowExaminationModal(false);
                                    setCurrentExamination(null);
                                }}
                                className="px-8 py-3 font-semibold rounded transition-all hover:scale-105"
                                style={{
                                    backgroundColor: 'rgba(100, 100, 100, 0.5)',
                                    color: '#d4af37',
                                    border: '2px solid #8b7355',
                                    fontFamily: 'Georgia, serif',
                                    fontSize: '16px'
                                }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoguelikeDisplayEnhanced;
