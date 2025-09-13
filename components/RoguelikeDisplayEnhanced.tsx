/**
 * components/RoguelikeDisplayEnhanced.tsx - Full-featured historically accurate roguelike
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PlayerCharacter, MapData, HistoricalEra, CulturalZone } from '../types';
import { ITEM_DEFINITIONS } from '../constants/index';
import { primarySourceService, PrimarySourceMetadata } from '../services/primarySourceService';
import { generateNPCDialogue } from '../services/llmService';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { ruinProgressService } from '../services/ruinProgressService';
import gameSoundsService from '../services/gameSoundsService';
import { generateRoguelikeDialogue, generateRoguelikeNpcs, generateNegotiationDialogue } from '../services/roguelikeService';

interface RoguelikeDisplayEnhancedProps {
    ruinType: {
        name: string;
        description: string;
        age: string;
        dangers: string[];
    };
    playerCharacter: PlayerCharacter;
    mapData?: MapData;
    onExit: () => void;
    onHealthChange?: (newHealth: number) => void;
    onInventoryAdd?: (item: any) => void;
    onGoldChange?: (newGold: number) => void;
    structureLocation?: [number, number]; // For tracking progress
}

// Tile types
type TileType = 'wall' | 'floor' | 'door' | 'treasure' | 'trap' | 'stairs_down' | 'stairs_up' | 
                'entrance' | 'altar' | 'statue' | 'rubble' | 'water' | 'chasm' | 'pillar' | 'manuscript' |
                'inscription' | 'mural' | 'brazier' | 'crystal' | 'pressure_plate' | 'puzzle_door' | 
                'lever' | 'mirror';

// Entity types - historically accurate
interface Entity {
    id: string;
    x: number;
    y: number;
    type: string; // Now more flexible for various NPC types
    subtype: string; // e.g., 'monkey', 'snake', 'rat', 'bat', 'spider', 'buddhist_monk', etc.
    name: string;
    hp: number;
    maxHp: number;
    hostile: boolean;
    dialogue?: string[];
    loot?: any[];
    description: string;
    symbol: string;
    color: string;
    attack?: number;
    defense?: number;
    accuracy?: number;
    evasion?: number;
    level?: number;
    canNegotiate?: boolean; // Can player attempt to talk down this hostile NPC?
}

interface DungeonTile {
    type: TileType;
    visible: boolean;
    explored: boolean;
    hasGold?: number;
    hasItem?: any; // Item from ITEM_DEFINITIONS
    hasManuscript?: PrimarySourceMetadata;
    hasTrap?: boolean;
    trapTriggered?: boolean;
    description?: string;
    inscription?: string;
    muralDescription?: string;
    lightSource?: boolean;
    lightRadius?: number;
    hasFood?: string;
    hasTorch?: boolean;
    // Puzzle mechanics
    puzzleId?: string;
    isActivated?: boolean;
    linkedTiles?: { x: number; y: number }[];
    requiredPlates?: number;
    activatedPlates?: number;
}

interface DungeonPlayer {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    gold: number;
    level: number;
    inventory: any[];
    manuscripts: PrimarySourceMetadata[];
    hasTorch?: boolean;
    torchTurns?: number;
    experience?: number;
    nextLevelExp?: number;
    hunger?: number;
    maxHunger?: number;
    attack?: number;
    defense?: number;
    accuracy?: number;
    evasion?: number;
    weapon?: any;
    armor?: any;
    defending?: boolean;
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

// Get historically accurate entities based on culture and era
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
                { subtype: 'crocodile', symbol: 'C', color: 'text-green-600', hostile: true, hp: 35, attack: 9, defense: 6, accuracy: 60, evasion: 5, level: 6, description: 'A saltwater crocodile' },
                { subtype: 'cassowary', symbol: 'c', color: 'text-blue-500', hostile: true, hp: 20, attack: 6, defense: 3, accuracy: 70, evasion: 15, level: 4, description: 'A dangerous cassowary' },
                { subtype: 'parrot', symbol: 'p', color: 'text-green-400', hostile: false, hp: 4, attack: 1, defense: 1, accuracy: 60, evasion: 50, level: 1, description: 'A colorful parrot' },
                { subtype: 'monitor', symbol: 'M', color: 'text-gray-500', hostile: true, hp: 15, attack: 5, defense: 3, accuracy: 65, evasion: 20, level: 3, description: 'A monitor lizard' }
            ],
            humans: [
                { type: 'hermit', subtype: 'hermit', symbol: 'H', color: 'text-green-300', hostile: false, hp: 20, attack: 3, defense: 3, accuracy: 50, evasion: 20, level: 2, description: 'An island hermit' },
                { type: 'pirate', subtype: 'pirate', symbol: 'P', color: 'text-red-400', hostile: true, hp: 26, attack: 7, defense: 3, accuracy: 65, evasion: 20, level: 4, description: 'A stranded pirate' },
                { type: 'castaway', subtype: 'castaway', symbol: 'c', color: 'text-gray-400', hostile: Math.random() > 0.7, hp: 12, attack: 3, defense: 1, accuracy: 50, evasion: 25, level: 1, description: 'A desperate castaway' }
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
    structureLocation
}) => {
    // Parse cultural context from map data
    const culturalContext = useMemo(() => {
        if (!mapData) return { era: HistoricalEra.MEDIEVAL, culturalZone: 'EUROPEAN' as CulturalZone };
        const dateInfo = parseDateString(mapData.timeSlice || '1500');
        const culture = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
        return { era: dateInfo.era as HistoricalEra, culturalZone: culture as CulturalZone };
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
    const [gameMessages, setGameMessages] = useState<string[]>(['You descend into the ancient ruins...']);
    const [turnCount, setTurnCount] = useState(0);
    const [currentDialogue, setCurrentDialogue] = useState<{ entity: Entity; message: string } | null>(null);
    const [zoomLevel, setZoomLevel] = useState(20); // Font size for the map
    const [showHelp, setShowHelp] = useState(false); // Help overlay visibility
    const [dungeonDimensions, setDungeonDimensions] = useState({ width: 60, height: 30 });
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Combat state for multi-turn battles
    const [combatState, setCombatState] = useState<{
        active: boolean;
        enemy: Entity | null;
        playerTurn: boolean;
    }>({ active: false, enemy: null, playerTurn: true });
    const [combatTarget, setCombatTarget] = useState<Entity | null>(null);
    const [discoveredSources, setDiscoveredSources] = useState<PrimarySourceMetadata[]>([]);
    
    // Chamber tracking
    const [currentChamber, setCurrentChamber] = useState<string>('Entrance');
    const [currentDepth, setCurrentDepth] = useState<number>(1);
    const structureId = structureLocation ? `${structureLocation[0]}-${structureLocation[1]}` : 'default-ruin';

    // Add message to game log
    const addMessage = useCallback((message: string) => {
        setGameMessages(prev => [...prev.slice(-4), message]);
    }, []);

    // Track which rooms have been entered for chamber discovery
    const [discoveredRooms, setDiscoveredRooms] = useState<Set<string>>(new Set());
    const [currentRooms, setCurrentRooms] = useState<Room[]>([]);
    
    // Puzzle state tracking
    const [puzzleStates, setPuzzleStates] = useState<Record<string, {
        sequence: number[];
        correctSequence: number[];
        completed: boolean;
    }>>({});

    // Generate a proper dungeon with guaranteed walkable entrance
    const generateDungeon = useCallback(async () => {
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

        // Add gold piles
        for (let i = 0; i < Math.min(10, floorTiles.length / 10); i++) {
            if (floorTiles.length === 0) break;
            const idx = Math.floor(Math.random() * floorTiles.length);
            const tile = floorTiles[idx];
            floorTiles.splice(idx, 1);
            newDungeon[tile.y][tile.x] = {
                ...newDungeon[tile.y][tile.x],
                type: 'treasure',
                hasGold: 20 + Math.floor(Math.random() * 80)
            };
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
        
        // Add primary source manuscripts in library rooms
        try {
            // Load sources for this cultural zone
            await primarySourceService.loadSourcesForContext(culturalContext.era, culturalContext.culturalZone);
            const sources = await primarySourceService.searchSources('', culturalContext.era, culturalContext.culturalZone);
            
            if (sources.length > 0) {
                // Place 2-3 manuscripts
                const manuscriptCount = Math.min(3, sources.length, floorTiles.length / 30);
                for (let i = 0; i < manuscriptCount; i++) {
                    if (floorTiles.length === 0) break;
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
        } catch (error) {
            console.error('Failed to load primary sources:', error);
        }

        // Culturally-specific puzzle generation
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
        
        // Add traps
        for (let i = 0; i < Math.min(8, floorTiles.length / 15); i++) {
            if (floorTiles.length === 0) break;
            const idx = Math.floor(Math.random() * floorTiles.length);
            const tile = floorTiles[idx];
            floorTiles.splice(idx, 1);
            newDungeon[tile.y][tile.x] = {
                ...newDungeon[tile.y][tile.x],
                type: 'trap',
                hasTrap: true,
                trapTriggered: false
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

        // Generate entities
        const entityData = getHistoricalEntities(culturalContext.culturalZone, culturalContext.era);
        const newEntities: Entity[] = [];
        let entityId = 0;

        // Place entities in rooms - MUCH RARER but more dangerous
        // Deeper floors have higher chance of encounters
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
                    // 80% chance of human, 20% chance of animal
                    const isAnimal = Math.random() < 0.2;
                    
                    if (isAnimal && entityData.animals && entityData.animals.length > 0) {
                        // Animals are mostly harmless except rare dangerous ones
                        const entityTemplate = entityData.animals[Math.floor(Math.random() * entityData.animals.length)];
                        newEntities.push({
                            id: `entity_${entityId++}`,
                            x: ex,
                            y: ey,
                            type: 'animal',
                            subtype: entityTemplate.subtype,
                            name: entityTemplate.description,
                            hp: entityTemplate.hp,
                            maxHp: entityTemplate.hp,
                            attack: entityTemplate.attack || 1,
                            defense: entityTemplate.defense || 0,
                            accuracy: entityTemplate.accuracy || 50,
                            evasion: entityTemplate.evasion || 30,
                            level: entityTemplate.level || 1,
                            hostile: entityTemplate.hostile,
                            description: entityTemplate.description,
                            symbol: entityTemplate.symbol,
                            color: entityTemplate.color,
                            dialogue: undefined,
                            loot: undefined
                        });
                    } else if (entityData.humans && entityData.humans.length > 0) {
                        // Humans are the main threat - use LLM for realistic NPCs
                        const entityTemplate = entityData.humans[Math.floor(Math.random() * entityData.humans.length)];
                        const npcName = `${entityTemplate.type.charAt(0).toUpperCase() + entityTemplate.type.slice(1)}`;
                        
                        newEntities.push({
                            id: `entity_${entityId++}`,
                            x: ex,
                            y: ey,
                            type: entityTemplate.type,
                            subtype: entityTemplate.type,
                            name: npcName,
                            hp: entityTemplate.hp + (currentDepth * 2), // Scale with depth
                            maxHp: entityTemplate.hp + (currentDepth * 2),
                            attack: entityTemplate.attack + Math.floor(currentDepth / 2),
                            defense: entityTemplate.defense + Math.floor(currentDepth / 3),
                            accuracy: entityTemplate.accuracy || 70,
                            evasion: entityTemplate.evasion || 20,
                            level: entityTemplate.level || currentDepth,
                            hostile: entityTemplate.hostile,
                            description: entityTemplate.description,
                            symbol: entityTemplate.symbol,
                            color: entityTemplate.color,
                            dialogue: [], // Will be generated via LLM when encountered
                            loot: Math.random() > 0.5 ? [availableItems[Math.floor(Math.random() * availableItems.length)]] : undefined,
                            canNegotiate: !entityTemplate.hostile || Math.random() > 0.7 // Some hostile NPCs can be talked down
                        });
                    }
                }
            }
        }

        setDungeon(newDungeon);
        setEntities(newEntities);
        setPlayer(prev => ({ ...prev, x: startX, y: startY }));
        
        // Store room information for chamber discovery
        setCurrentRooms(rooms);
        setDiscoveredRooms(new Set());
        
        return { startX, startY };
    }, [culturalContext, dungeonDimensions]);

    // Start dungeon music with random timing
    useEffect(() => {
        gameSoundsService.playDungeonMusicWithRandomTiming();
        return () => {
            gameSoundsService.stopDungeonMusicWithRandomTiming();
        };
    }, []);

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
    
    // Initialize dungeon when dimensions are ready
    useEffect(() => {
        if (dungeonDimensions.width > 0 && dungeonDimensions.height > 0) {
            generateDungeon();
        }
    }, [dungeonDimensions, generateDungeon]);

    // Initialize first chamber after dungeon is ready
    useEffect(() => {
        if (dungeon.length > 0 && currentChamber === 'Entrance') {
            discoverNewChamber(1);
        }
    }, [dungeon.length]); // Don't include discoverNewChamber in deps to avoid circular dependency

    // Update fog of war with dynamic lighting
    const updateVisibility = useCallback((playerX: number, playerY: number) => {
        setDungeon(prev => {
            const newDungeon = prev.map(row => row.map(tile => ({ ...tile, visible: false })));
            
            // Base vision radius, enhanced by torch
            const baseRadius = 3;
            const torchBonus = player.hasTorch ? 3 : 0;
            const visionRadius = baseRadius + torchBonus;
            
            // First pass: player vision
            for (let dy = -visionRadius; dy <= visionRadius; dy++) {
                for (let dx = -visionRadius; dx <= visionRadius; dx++) {
                    const x = playerX + dx;
                    const y = playerY + dy;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (x >= 0 && x < dungeonDimensions.width && y >= 0 && y < dungeonDimensions.height && distance <= visionRadius) {
                        // Line of sight check
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
                        
                        if (hasLineOfSight) {
                            newDungeon[y][x].visible = true;
                            newDungeon[y][x].explored = true;
                        }
                    }
                }
            }
            
            // Second pass: environmental light sources
            for (let y = 0; y < dungeonDimensions.height; y++) {
                for (let x = 0; x < dungeonDimensions.width; x++) {
                    const tile = newDungeon[y][x];
                    if (tile.lightSource && tile.explored) {
                        const lightRadius = tile.lightRadius || 2;
                        
                        // Illuminate area around light sources
                        for (let dy = -lightRadius; dy <= lightRadius; dy++) {
                            for (let dx = -lightRadius; dx <= lightRadius; dx++) {
                                const lx = x + dx;
                                const ly = y + dy;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                
                                if (lx >= 0 && lx < dungeonDimensions.width && 
                                    ly >= 0 && ly < dungeonDimensions.height && 
                                    distance <= lightRadius) {
                                    
                                    // Simple line of sight for light sources
                                    let hasLineOfSight = true;
                                    const steps = Math.ceil(distance);
                                    for (let step = 1; step < steps; step++) {
                                        const checkX = Math.round(x + (dx * step / steps));
                                        const checkY = Math.round(y + (dy * step / steps));
                                        if (newDungeon[checkY] && newDungeon[checkY][checkX] && 
                                            newDungeon[checkY][checkX].type === 'wall') {
                                            hasLineOfSight = false;
                                            break;
                                        }
                                    }
                                    
                                    if (hasLineOfSight) {
                                        newDungeon[ly][lx].visible = true;
                                        newDungeon[ly][lx].explored = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
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

    // Handle combat turn with tactical mechanics
    const handleCombatTurn = useCallback((entity: Entity, isPlayerAttacking: boolean) => {
        if (isPlayerAttacking) {
            // Player attacks entity
            const result = calculateDamage(
                { attack: player.attack + (player.weapon?.damage || 0), accuracy: player.accuracy },
                { defense: entity.defense, evasion: entity.evasion }
            );
            
            if (!result.hit) {
                addMessage(`Your attack misses the ${entity.name}!`);
                gameSoundsService.playRoguelikeAttackSound(false); // Miss sound
            } else {
                const critText = result.critical ? ' CRITICAL HIT!' : '';
                addMessage(`You strike the ${entity.name} for ${result.damage} damage!${critText}`);
                gameSoundsService.playRoguelikeAttackSound(true); // Hit sound
                
                setEntities(prev => prev.map(e => {
                    if (e.id === entity.id) {
                        const newHp = Math.max(0, e.hp - result.damage);
                        if (newHp === 0) {
                            addMessage(`✦ You defeated the ${e.name}!`);
                            gameSoundsService.playEnemyDefeatSound();
                            
                            // Handle loot
                            if (e.loot && Array.isArray(e.loot) && e.loot.length > 0) {
                                const item = e.loot[0];
                                if (item) {
                                    setPlayer(p => ({ ...p, inventory: [...p.inventory, item] }));
                                    onInventoryAdd?.(item);
                                    addMessage(`  Found ${item.name || 'an item'}!`);
                                }
                            }
                            
                            // Add gold
                            const goldReward = 5 + Math.floor(Math.random() * 20);
                            
                            // Add experience
                            const expReward = e.level * 20;
                            
                            setPlayer(p => {
                                const newExp = (p.experience || 0) + expReward;
                                const nextLevel = (p.nextLevelExp || 100);
                                let newP = { ...p, gold: p.gold + goldReward, experience: newExp };
                                
                                // Level up check
                                if (newExp >= nextLevel) {
                                    newP.level += 1;
                                    newP.maxHp += 10;
                                    newP.hp = newP.maxHp;
                                    newP.attack += 2;
                                    newP.defense += 1;
                                    newP.nextLevelExp = nextLevel * 1.5;
                                    addMessage(`☆ LEVEL UP! You are now level ${newP.level}! ☆`);
                                    gameSoundsService.playLevelUpSound();
                                }
                                
                                return newP;
                            });
                            
                            onGoldChange?.(goldReward);
                            addMessage(`  Found ${goldReward} gold!`);
                            addMessage(`  Gained ${expReward} experience!`);
                            
                            // End combat
                            setCombatState({ active: false, enemy: null, playerTurn: true });
                        }
                        return { ...e, hp: newHp };
                    }
                    return e;
                }));
            }
        } else {
            // Entity attacks player
            const result = calculateDamage(
                { attack: entity.attack, accuracy: entity.accuracy },
                { defense: player.defense + (player.armor?.defense || 0), evasion: player.evasion }
            );
            
            if (!result.hit) {
                addMessage(`The ${entity.name}'s attack misses!`);
                gameSoundsService.playRoguelikeAttackSound(false); // Enemy miss
            } else {
                const critText = result.critical ? ' CRITICAL HIT!' : '';
                addMessage(`The ${entity.name} attacks you for ${result.damage} damage!${critText}`);
                gameSoundsService.playDamageSound(result.critical ? 'heavy' : result.damage > 10 ? 'medium' : 'light');
                
                setPlayer(prev => {
                    const newHp = Math.max(0, prev.hp - result.damage);
                    onHealthChange?.(newHp);
                    return { ...prev, hp: newHp };
                });
            }
        }
        
        // Toggle turn
        setCombatState(prev => ({ ...prev, playerTurn: !prev.playerTurn }));
    }, [player, calculateDamage, addMessage, onHealthChange, onGoldChange, onInventoryAdd]);

    // Start combat encounter
    const startCombat = useCallback((entity: Entity) => {
        setCombatState({ active: true, enemy: entity, playerTurn: true });
        addMessage(`⚔ Combat with ${entity.name} begins!`);
        addMessage(`  ${entity.name}: HP ${entity.hp}/${entity.maxHp}, Level ${entity.level}`);
        gameSoundsService.playRoguelikeCombatSound();
    }, [addMessage]);

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

    // Handle player movement
    const movePlayer = useCallback((dx: number, dy: number) => {
        setPlayer(prev => {
            const newX = Math.max(0, Math.min(dungeonDimensions.width - 1, prev.x + dx));
            const newY = Math.max(0, Math.min(dungeonDimensions.height - 1, prev.y + dy));
            
            if (!dungeon[newY] || !dungeon[newY][newX]) return prev;
            
            const tile = dungeon[newY][newX];
            
            // Can't move through walls
            if (tile.type === 'wall') {
                addMessage('You bump into a wall.');
                gameSoundsService.playWallBumpSound();
                return prev;
            }
            
            // Check for entity collision
            const entityAtPosition = entities.find(e => e.x === newX && e.y === newY && e.hp > 0);
            if (entityAtPosition) {
                // Generate dialogue for NPCs using LLM
                if (entityAtPosition.type !== 'animal') {
                    generateRoguelikeDialogue({
                        npcType: entityAtPosition.type,
                        npcName: entityAtPosition.name,
                        era: culturalContext.era,
                        culturalZone: culturalContext.culturalZone,
                        ruinType: ruinType.name,
                        currentDepth: currentDepth,
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
                        
                        // If hostile but can negotiate, give player a chance to talk
                        if (entityAtPosition.hostile && entityAtPosition.canNegotiate) {
                            addMessage(`The ${entityAtPosition.name} seems aggressive but might listen to reason... [Press T to try talking]`);
                        } else if (entityAtPosition.hostile) {
                            // Immediate combat for non-negotiable hostiles
                            setTimeout(() => startCombat(entityAtPosition), 1500);
                        }
                    });
                } else if (entityAtPosition.hostile) {
                    // Animals attack immediately
                    startCombat(entityAtPosition);
                } else {
                    // Non-hostile animals just block movement
                    addMessage(`The ${entityAtPosition.name} blocks your path.`);
                }
                return prev;
            }
            
            let newPlayer = { ...prev, x: newX, y: newY };
            
            // Handle tile interactions
            switch (tile.type) {
                case 'treasure':
                    if (tile.hasGold) {
                        newPlayer.gold += tile.hasGold;
                        addMessage(`You found ${tile.hasGold} gold!`);
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
                        onInventoryAdd?.(tile.hasItem);
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
                        newPlayer.manuscripts.push(tile.hasManuscript);
                        addMessage(`You discovered: "${tile.hasManuscript.title}"!`);
                        addMessage('Press M to read the manuscript.');
                        gameSoundsService.playManuscriptSound();
                        setDiscoveredSources(prev => [...prev, tile.hasManuscript]);
                        setDungeon(prevDungeon => {
                            const newDungeon = [...prevDungeon];
                            newDungeon[newY][newX] = { ...tile, type: 'floor', hasManuscript: undefined };
                            return newDungeon;
                        });
                    }
                    break;
                    
                case 'trap':
                    if (tile.hasTrap && !tile.trapTriggered) {
                        const damage = 10 + Math.floor(Math.random() * 15);
                        newPlayer.hp = Math.max(0, newPlayer.hp - damage);
                        addMessage(`You triggered a trap! Lost ${damage} HP.`);
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
                    
                case 'brazier':
                    addMessage('A burning brazier illuminates the area with flickering flames.');
                    break;
                    
                case 'crystal':
                    addMessage('A glowing crystal emanates a soft, ethereal light.');
                    break;
                    
                case 'pressure_plate':
                    if (!tile.isActivated) {
                        tile.isActivated = true;
                        addMessage('*CLICK* The pressure plate sinks under your weight.');
                        gameSoundsService.playTrapSound();
                        
                        // Check if all plates for this puzzle are activated
                        if (tile.puzzleId && tile.linkedTiles) {
                            let activatedCount = 1; // Current plate
                            let totalPlates = 1;
                            
                            for (let y = 0; y < dungeon.length; y++) {
                                for (let x = 0; x < dungeon[0].length; x++) {
                                    if (dungeon[y][x].type === 'pressure_plate' && 
                                        dungeon[y][x].puzzleId === tile.puzzleId &&
                                        !(x === newPlayer.x && y === newPlayer.y)) {
                                        totalPlates++;
                                        if (dungeon[y][x].isActivated) activatedCount++;
                                    }
                                }
                            }
                            
                            if (activatedCount === totalPlates) {
                                addMessage('✦ All pressure plates activated! The sealed door opens!');
                                // Open the linked door
                                tile.linkedTiles.forEach(linked => {
                                    if (dungeon[linked.y] && dungeon[linked.y][linked.x]) {
                                        dungeon[linked.y][linked.x].type = 'floor';
                                    }
                                });
                            } else {
                                addMessage(`Pressure plates activated: ${activatedCount}/${totalPlates}`);
                            }
                        }
                    } else {
                        addMessage('This pressure plate is already activated.');
                    }
                    break;
                    
                case 'lever':
                    tile.isActivated = !tile.isActivated;
                    addMessage(`You ${tile.isActivated ? 'pull' : 'push'} the lever. *CLUNK*`);
                    gameSoundsService.playAltarSound();
                    
                    // Handle lever sequence puzzles
                    if (tile.puzzleId && tile.sequenceIndex !== undefined) {
                        setPuzzleStates(prev => {
                            const puzzleState = prev[tile.puzzleId!] || {
                                sequence: [],
                                correctSequence: tile.correctSequence || [1,2,3],
                                completed: false
                            };
                            
                            if (tile.isActivated) {
                                // Add to sequence
                                puzzleState.sequence.push(tile.sequenceIndex);
                                
                                // Check if sequence is complete and correct
                                if (puzzleState.sequence.length === puzzleState.correctSequence.length) {
                                    const isCorrect = puzzleState.sequence.every((val, idx) => 
                                        val === puzzleState.correctSequence[idx]
                                    );
                                    
                                    if (isCorrect) {
                                        addMessage('✦ The ancient mechanism activates! A hidden door opens!');
                                        puzzleState.completed = true;
                                        // Open related doors or reveal treasure
                                        for (let y = 0; y < dungeon.length; y++) {
                                            for (let x = 0; x < dungeon[0].length; x++) {
                                                if (dungeon[y][x].puzzleId === tile.puzzleId && 
                                                    dungeon[y][x].type === 'puzzle_door') {
                                                    dungeon[y][x].type = 'floor';
                                                }
                                            }
                                        }
                                    } else {
                                        addMessage('The sequence was incorrect. The levers reset with a grinding sound.');
                                        // Reset all levers for this puzzle
                                        for (let y = 0; y < dungeon.length; y++) {
                                            for (let x = 0; x < dungeon[0].length; x++) {
                                                if (dungeon[y][x].puzzleId === tile.puzzleId && 
                                                    dungeon[y][x].type === 'lever') {
                                                    dungeon[y][x].isActivated = false;
                                                }
                                            }
                                        }
                                        puzzleState.sequence = [];
                                    }
                                }
                            } else {
                                // Remove from sequence if deactivated
                                const index = puzzleState.sequence.indexOf(tile.sequenceIndex);
                                if (index > -1) {
                                    puzzleState.sequence.splice(index, 1);
                                }
                            }
                            
                            return { ...prev, [tile.puzzleId!]: puzzleState };
                        });
                    }
                    break;
                    
                case 'puzzle_door':
                    addMessage('This door is sealed by an ancient mechanism. Perhaps there\'s a way to open it...');
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
                    }
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
    }, [dungeon, entities, addMessage, startCombat, moveEntities, onHealthChange, onGoldChange, onInventoryAdd, dungeonDimensions]);

    // Update visibility when player moves
    useEffect(() => {
        updateVisibility(player.x, player.y);
    }, [player.x, player.y, updateVisibility]);

    // Handle keyboard input
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            const keyLower = event.key.toLowerCase();
            
            // Movement and actions
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'escape', 'm', '>', 'h', 't'].includes(keyLower)) {
                event.preventDefault();
                event.stopPropagation();
                
                switch (keyLower) {
                    case 'w':
                    case 'arrowup':
                        movePlayer(0, -1);
                        break;
                    case 's':
                    case 'arrowdown':
                        movePlayer(0, 1);
                        break;
                    case 'a':
                    case 'arrowleft':
                        movePlayer(-1, 0);
                        break;
                    case 'd':
                    case 'arrowright':
                        movePlayer(1, 0);
                        break;
                    case 'escape':
                        onExit();
                        break;
                    case 'm':
                        // Show manuscripts modal
                        if (player.manuscripts.length > 0) {
                            // This would open a modal showing discovered manuscripts
                            addMessage('Manuscript reading not yet implemented.');
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
                        break;
                    case 't':
                        // Try to talk/negotiate with nearby hostile NPC
                        const nearbyHostile = entities.find(e => 
                            e.hostile && 
                            e.canNegotiate && 
                            e.hp > 0 &&
                            Math.abs(e.x - player.x) <= 1 && 
                            Math.abs(e.y - player.y) <= 1
                        );
                        
                        if (nearbyHostile) {
                            addMessage(`You attempt to negotiate with the ${nearbyHostile.name}...`);
                            generateNegotiationDialogue({
                                npcType: nearbyHostile.type,
                                npcName: nearbyHostile.name,
                                era: culturalContext.era,
                                culturalZone: culturalContext.culturalZone,
                                ruinType: ruinType.name,
                                currentDepth: currentDepth,
                                playerName: playerCharacter.name,
                                playerProfession: playerCharacter.profession,
                                isHostile: true,
                                hasWeapon: player.weapon !== undefined,
                                playerHealth: player.hp,
                                playerMaxHealth: player.maxHp
                            }).then(result => {
                                addMessage(`${nearbyHostile.name}: "${result.response}"`);
                                if (result.success) {
                                    // Make NPC non-hostile
                                    setEntities(prev => prev.map(e => 
                                        e.id === nearbyHostile.id 
                                            ? { ...e, hostile: false }
                                            : e
                                    ));
                                    addMessage(`The ${nearbyHostile.name} seems less hostile now.`);
                                } else {
                                    addMessage(`Negotiation failed! The ${nearbyHostile.name} attacks!`);
                                    startCombat(nearbyHostile);
                                }
                            });
                        } else {
                            addMessage("There's no one nearby to talk to.");
                        }
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [movePlayer, onExit, player, dungeon, generateDungeon, addMessage, combatState, handleCombatTurn, currentDepth, discoverNewChamber, entities, startCombat, culturalContext, ruinType, playerCharacter]);

    // Handle enemy turns in combat
    useEffect(() => {
        if (combatState.active && !combatState.playerTurn && combatState.enemy) {
            const timer = setTimeout(() => {
                const enemy = entities.find(e => e.id === combatState.enemy?.id);
                if (enemy && enemy.hp > 0) {
                    handleCombatTurn(enemy, false);
                } else {
                    // Enemy was defeated or disappeared
                    setCombatState({ active: false, enemy: null, playerTurn: true });
                }
            }, 1000); // 1 second delay for enemy turn
            return () => clearTimeout(timer);
        }
    }, [combatState, entities, handleCombatTurn]);

    // Get tile display with enhanced ASCII art
    const getTileDisplay = (tile: DungeonTile, x: number, y: number) => {
        // Check for player - classic @ symbol with glow
        if (x === player.x && y === player.y) {
            return { char: '@', color: 'text-amber-400', glow: true, strongGlow: true }; // Classic @ with strong glow
        }
        
        // Check for entities
        const entity = entities.find(e => e.x === x && e.y === y && e.hp > 0);
        if (entity && tile.visible) {
            return { char: entity.symbol, color: entity.color, glow: entity.hostile };
        }
        
        if (!tile.visible && !tile.explored) {
            return { char: ' ', color: 'text-black', glow: false };
        }
        
        const dimmed = !tile.visible && tile.explored;
        
        switch (tile.type) {
            case 'wall': 
                // Use different wall characters for variety
                const wallChars = ['█', '▓', '▒'];
                const wallChar = wallChars[Math.floor((x + y) % 3)];
                return { char: wallChar, color: dimmed ? 'text-gray-700' : 'text-gray-400', glow: false };
            case 'floor': 
                // Use different floor patterns
                const floorChars = ['·', '.', '˙'];
                const floorChar = floorChars[Math.floor((x * 7 + y * 3) % 3)];
                return { char: floorChar, color: dimmed ? 'text-gray-700' : 'text-gray-600', glow: false };
            case 'door': 
                return { char: '╬', color: dimmed ? 'text-amber-800' : 'text-amber-600', glow: false }; // Better door
            case 'treasure': 
                if (tile.hasGold) return { char: '¤', color: dimmed ? 'text-yellow-700' : 'text-yellow-400', glow: !dimmed }; // Currency symbol
                if (tile.hasItem) return { char: '†', color: dimmed ? 'text-blue-700' : 'text-blue-400', glow: !dimmed }; // Dagger symbol
                return { char: '·', color: dimmed ? 'text-gray-700' : 'text-gray-600', glow: false };
            case 'manuscript': 
                return { char: '§', color: dimmed ? 'text-amber-700' : 'text-amber-300', glow: !dimmed }; // Section sign for scrolls
            case 'trap': 
                return { char: tile.trapTriggered ? '♦' : '·', color: tile.trapTriggered ? (dimmed ? 'text-red-800' : 'text-red-500') : (dimmed ? 'text-gray-700' : 'text-gray-600'), glow: false };
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
                return { char: '≈', color: dimmed ? 'text-blue-800' : 'text-blue-500', glow: false }; // Almost equal for water
            case 'chasm':
                return { char: '░', color: dimmed ? 'text-gray-900' : 'text-gray-800', glow: false };
            case 'pillar':
                return { char: '●', color: dimmed ? 'text-gray-600' : 'text-gray-400', glow: false }; // Black circle
            case 'food':
                return { char: '♣', color: dimmed ? 'text-green-700' : 'text-green-400', glow: !dimmed }; // Club for food
            case 'torch':
                return { char: '†', color: dimmed ? 'text-orange-700' : 'text-orange-400', glow: !dimmed }; // Dagger/torch
            case 'campfire':
                return { char: '∆', color: dimmed ? 'text-red-700' : 'text-red-500', glow: !dimmed }; // Delta for fire
            case 'inscription':
                return { char: '≡', color: dimmed ? 'text-amber-700' : 'text-amber-500', glow: false }; // Triple bar for text
            case 'mural':
                return { char: '▣', color: dimmed ? 'text-indigo-700' : 'text-indigo-400', glow: false }; // Filled square for art
            case 'brazier':
                return { char: '◈', color: dimmed ? 'text-orange-700' : 'text-orange-500', glow: !dimmed, strongGlow: !dimmed }; // Diamond with dot for fire
            case 'crystal':
                return { char: '◊', color: dimmed ? 'text-cyan-700' : 'text-cyan-400', glow: !dimmed, strongGlow: !dimmed }; // Diamond for crystal
            case 'pressure_plate':
                return { char: tile.isActivated ? '▪' : '□', color: tile.isActivated ? 'text-green-400' : 'text-yellow-600', glow: false };
            case 'lever':
                return { char: tile.isActivated ? '╨' : '╥', color: 'text-purple-400', glow: false };
            case 'puzzle_door':
                return { char: '▩', color: 'text-red-600', glow: true };
            case 'mirror':
                return { char: '◯', color: 'text-blue-300', glow: true };
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
                    <p className="text-lg mb-2" style={{ color: '#ffa500' }}>Gold collected: {player.gold}</p>
                    <p className="text-lg mb-2" style={{ color: '#ffa500' }}>Items found: {player.inventory.length}</p>
                    <p className="text-lg mb-6" style={{ color: '#ffa500' }}>Manuscripts discovered: {player.manuscripts.length}</p>
                    <button
                        onClick={onExit}
                        className="px-8 py-3 font-bold rounded"
                        style={{ 
                            backgroundColor: '#ff6b00', 
                            color: 'black',
                            boxShadow: '0 0 20px #ff6b00'
                        }}
                    >
                        Return to Surface
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
                        <span style={{ color: '#ff6b00' }}>HP: {player.hp}/{player.maxHp}</span>
                        <span style={{ color: '#ffaa00' }}>Gold: {player.gold}</span>
                        <span style={{ color: '#ff8800' }}>Lv: {player.level}</span>
                        <span style={{ color: '#66ff66' }}>EXP: {player.experience || 0}/{player.nextLevelExp || 100}</span>
                        <span style={{ color: player.hunger && player.hunger < 30 ? '#ff4444' : '#88ff88' }}>
                            Hunger: {player.hunger || 100}%
                        </span>
                        {player.hasTorch && <span style={{ color: '#ffcc00' }}>🕯️ {player.torchTurns}</span>}
                        <span style={{ color: '#ff7700' }}>Turn: {turnCount}</span>
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
                            Zoom +
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

            <div className="flex-1 flex flex-col" style={{ backgroundColor: '#0a0a0a' }}>
                {/* Dungeon map - fills available space */}
                <div className="flex-1 overflow-auto flex justify-center items-center">
                    <pre style={{ fontSize: `${zoomLevel}px`, lineHeight: `${zoomLevel}px`, fontFamily: 'Courier New, Courier, monospace', margin: 0, letterSpacing: '0px' }}>
                            {dungeon.map((row, y) => (
                                <div key={y} style={{ height: `${zoomLevel}px`, display: 'flex' }}>
                                    {row.map((tile, x) => {
                                        const display = getTileDisplay(tile, x, y);
                                        return (
                                            <span
                                                key={x}
                                                className={display.color}
                                                style={{
                                                    width: `${zoomLevel}px`,
                                                    display: 'inline-block',
                                                    textAlign: 'center',
                                                    fontWeight: 'bold',
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
                            ))}
                        </pre>
                    </div>

                {/* Message log - compact */}
                <div className="h-20 border-t overflow-y-auto px-2" style={{ borderColor: '#ff6b00', backgroundColor: '#0a0a0a' }}>
                    {gameMessages.map((msg, i) => (
                        <div key={i} style={{ color: '#ff9500', opacity: 1 - (gameMessages.length - i - 1) * 0.2 }}>
                            {'>'} {msg}
                        </div>
                    ))}
                </div>
                
                {/* Combat overlay */}
                {combatState.active && combatState.enemy && (
                        <div className="absolute inset-x-4 bottom-40 max-w-3xl mx-auto p-6 border-2 rounded"
                             style={{ 
                                 backgroundColor: '#1a0a0a', 
                                 borderColor: '#ff3333',
                                 boxShadow: '0 0 40px #ff3333'
                             }}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2" style={{ color: '#ff6666' }}>⚔ COMBAT ⚔</h3>
                                    <div style={{ color: '#ffaa00' }}>
                                        Fighting: {combatState.enemy.name} (Level {combatState.enemy.level})
                                    </div>
                                </div>
                                <div className="text-right" style={{ color: '#ff9900' }}>
                                    <div>{combatState.playerTurn ? '» YOUR TURN «' : '» ENEMY TURN «'}</div>
                                </div>
                            </div>
                            
                            {/* Health bars */}
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <div className="flex justify-between mb-1" style={{ color: '#ff9900' }}>
                                        <span>You</span>
                                        <span>{player.hp}/{player.maxHp} HP</span>
                                    </div>
                                    <div className="w-full h-4 bg-gray-800 rounded overflow-hidden">
                                        <div 
                                            className="h-full transition-all duration-300"
                                            style={{ 
                                                width: `${(player.hp / player.maxHp) * 100}%`,
                                                backgroundColor: player.hp > player.maxHp * 0.5 ? '#00ff00' : 
                                                               player.hp > player.maxHp * 0.25 ? '#ffaa00' : '#ff3333'
                                            }}
                                        />
                                    </div>
                                    <div className="mt-1 text-sm" style={{ color: '#ff7700' }}>
                                        ATK: {player.attack} | DEF: {player.defense} | ACC: {player.accuracy}% | EVA: {player.evasion}%
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="flex justify-between mb-1" style={{ color: '#ff9900' }}>
                                        <span>{combatState.enemy.name}</span>
                                        <span>{combatState.enemy.hp}/{combatState.enemy.maxHp} HP</span>
                                    </div>
                                    <div className="w-full h-4 bg-gray-800 rounded overflow-hidden">
                                        <div 
                                            className="h-full transition-all duration-300"
                                            style={{ 
                                                width: `${(combatState.enemy.hp / combatState.enemy.maxHp) * 100}%`,
                                                backgroundColor: combatState.enemy.hp > combatState.enemy.maxHp * 0.5 ? '#00ff00' : 
                                                               combatState.enemy.hp > combatState.enemy.maxHp * 0.25 ? '#ffaa00' : '#ff3333'
                                            }}
                                        />
                                    </div>
                                    <div className="mt-1 text-sm" style={{ color: '#ff7700' }}>
                                        ATK: {combatState.enemy.attack} | DEF: {combatState.enemy.defense} | ACC: {combatState.enemy.accuracy}% | EVA: {combatState.enemy.evasion}%
                                    </div>
                                </div>
                            </div>
                            
                            {/* Combat actions */}
                            {combatState.playerTurn && (
                                <div className="grid grid-cols-3 gap-3">
                                    <button 
                                        onClick={() => handleCombatTurn(combatState.enemy!, true)}
                                        className="px-4 py-2 rounded font-bold transition-all hover:scale-105"
                                        style={{ 
                                            backgroundColor: '#ff6600', 
                                            color: 'black',
                                            boxShadow: '0 0 10px #ff6600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        [1] Attack
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setPlayer(prev => ({ ...prev, defending: true }));
                                            handleCombatTurn(combatState.enemy!, true);
                                        }}
                                        className="px-4 py-2 rounded font-bold transition-all hover:scale-105"
                                        style={{ 
                                            backgroundColor: '#0066ff', 
                                            color: 'white',
                                            boxShadow: '0 0 10px #0066ff',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        [2] Defend
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (Math.random() > 0.5) {
                                                addMessage('You fled from combat!');
                                                setCombatState({ active: false, enemy: null, playerTurn: true });
                                            } else {
                                                addMessage('Failed to flee!');
                                                handleCombatTurn(combatState.enemy!, false);
                                            }
                                        }}
                                        className="px-4 py-2 rounded font-bold transition-all hover:scale-105"
                                        style={{ 
                                            backgroundColor: '#666666', 
                                            color: 'white',
                                            boxShadow: '0 0 10px #666666',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        [3] Flee (50%)
                                    </button>
                                </div>
                            )}
                            
                            {!combatState.playerTurn && (
                                <div className="text-center py-3" style={{ color: '#ff9900' }}>
                                    <div className="animate-pulse">Enemy is attacking...</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Dialogue overlay */}
                    {currentDialogue && !combatState.active && (
                        <div className="absolute inset-x-4 top-1/3 max-w-2xl mx-auto p-4 border rounded"
                             style={{ 
                                 backgroundColor: '#1a1a1a', 
                                 borderColor: '#ff6b00',
                                 boxShadow: '0 0 30px #ff6b00'
                             }}>
                            <h3 style={{ color: '#ffaa00' }}>{currentDialogue.entity.name}:</h3>
                            <p style={{ color: '#ff9500' }} className="mt-2">{currentDialogue.message}</p>
                            <button 
                                onClick={() => setCurrentDialogue(null)}
                                className="mt-4 px-4 py-1 rounded"
                                style={{ backgroundColor: '#ff6b00', color: 'black' }}
                            >
                                [Continue]
                            </button>
                        </div>
                    )}
                    
                    {/* Help button (shows legend/controls) */}
                    <div className="absolute top-20 right-4">
                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
                            style={{ fontSize: '14px' }}
                        >
                            {showHelp ? 'Hide' : 'Help'} (H)
                        </button>
                    </div>
                    
                    {/* Help overlay */}
                    {showHelp && (
                        <div className="absolute top-32 right-4 w-64 p-4 rounded" 
                             style={{ backgroundColor: '#1a1a1a', border: '2px solid #ff6b00' }}>
                            <h3 className="text-base font-bold mb-2" style={{ color: '#ff9500' }}>
                                ═══ CONTROLS ═══
                            </h3>
                            <div className="space-y-1 text-xs mb-4" style={{ color: '#ff8800' }}>
                                <div>WASD/Arrows - Move</div>
                                <div>M - Read Manuscripts</div>
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

            
      
            
            {/* Always visible legend - bottom right corner */}
            <div className="absolute bottom-4 right-4 p-3 rounded" 
                 style={{ 
                     backgroundColor: 'rgba(26, 26, 26, 0.9)', 
                     border: '1px solid #ff6b00',
                     maxWidth: '220px'
                 }}>
                <h3 className="text-xs font-bold mb-2" style={{ color: '#ff9500' }}>
                    LEGEND
                </h3>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs" style={{ fontSize: '10px' }}>
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
                        <span className="text-orange-400">†</span>
                        <span style={{ color: '#ff8800' }}>Torch</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-amber-300">§</span>
                        <span style={{ color: '#ff8800' }}>Scroll</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-cyan-400">↓</span>
                        <span style={{ color: '#ff8800' }}>Stairs</span>
                    </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-700" style={{ fontSize: '10px', color: '#ff8800' }}>
                    <div>WASD/Arrows: Move</div>
                    <div>ESC: Exit</div>
                    <div>H: Help</div>
                </div>
            </div>
        </div>
    );
};

export default RoguelikeDisplayEnhanced;