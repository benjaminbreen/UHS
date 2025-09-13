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
import gameSounds from '../services/gameSoundsService';

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
                'entrance' | 'altar' | 'statue' | 'rubble' | 'water' | 'chasm' | 'pillar' | 'manuscript';

// Entity types - historically accurate
interface Entity {
    id: string;
    x: number;
    y: number;
    type: 'animal' | 'hermit' | 'guard' | 'scholar' | 'priest' | 'thief' | 'merchant';
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
        const numRooms = 7 + Math.floor(Math.random() * 5);

        // First room is always the entrance room, guaranteed at a specific position
        const entranceRoom: Room = {
            x: 2,
            y: 2,
            width: 6,
            height: 5,
            type: 'entrance'
        };
        rooms.push(entranceRoom);

        // Carve out entrance room
        for (let y = entranceRoom.y; y < entranceRoom.y + entranceRoom.height; y++) {
            for (let x = entranceRoom.x; x < entranceRoom.x + entranceRoom.width; x++) {
                newDungeon[y][x] = { type: 'floor', visible: false, explored: false };
            }
        }

        // Generate other rooms
        for (let i = 1; i < numRooms; i++) {
            let attempts = 0;
            let roomPlaced = false;

            while (attempts < 100 && !roomPlaced) {
                const roomWidth = 5 + Math.floor(Math.random() * 8);
                const roomHeight = 4 + Math.floor(Math.random() * 6);
                const roomX = 2 + Math.floor(Math.random() * (DUNGEON_WIDTH - roomWidth - 4));
                const roomY = 2 + Math.floor(Math.random() * (DUNGEON_HEIGHT - roomHeight - 4));

                // Check for overlap with 1 tile buffer
                let overlap = false;
                for (const room of rooms) {
                    if (roomX < room.x + room.width + 1 && roomX + roomWidth + 1 > room.x &&
                        roomY < room.y + room.height + 1 && roomY + roomHeight + 1 > room.y) {
                        overlap = true;
                        break;
                    }
                }

                if (!overlap) {
                    const roomType = ['treasure', 'altar', 'library', 'guard', 'storage'][Math.floor(Math.random() * 5)] as Room['type'];
                    rooms.push({ x: roomX, y: roomY, width: roomWidth, height: roomHeight, type: roomType });

                    // Carve out room
                    for (let y = roomY; y < roomY + roomHeight; y++) {
                        for (let x = roomX; x < roomX + roomWidth; x++) {
                            newDungeon[y][x] = { type: 'floor', visible: false, explored: false };
                        }
                    }

                    // Add room decorations based on type
                    if (roomType === 'altar') {
                        const centerX = roomX + Math.floor(roomWidth / 2);
                        const centerY = roomY + Math.floor(roomHeight / 2);
                        newDungeon[centerY][centerX] = { 
                            type: 'altar', 
                            visible: false, 
                            explored: false,
                            description: 'An ancient altar covered in mysterious symbols'
                        };
                    } else if (roomType === 'library') {
                        // Add manuscript locations
                        for (let j = 0; j < 2; j++) {
                            const mx = roomX + 1 + Math.floor(Math.random() * (roomWidth - 2));
                            const my = roomY + 1 + Math.floor(Math.random() * (roomHeight - 2));
                            if (newDungeon[my][mx].type === 'floor') {
                                newDungeon[my][mx] = { 
                                    type: 'manuscript', 
                                    visible: false, 
                                    explored: false,
                                    description: 'Ancient scrolls and texts'
                                };
                            }
                        }
                    }

                    roomPlaced = true;
                }
                attempts++;
            }
        }

        // Create corridors between all rooms
        for (let i = 0; i < rooms.length - 1; i++) {
            const room1 = rooms[i];
            const room2 = rooms[i + 1];
            
            const x1 = room1.x + Math.floor(room1.width / 2);
            const y1 = room1.y + Math.floor(room1.height / 2);
            const x2 = room2.x + Math.floor(room2.width / 2);
            const y2 = room2.y + Math.floor(room2.height / 2);

            // Create L-shaped corridor
            if (Math.random() > 0.5) {
                // Horizontal first, then vertical
                for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
                    if (newDungeon[y1][x].type === 'wall') {
                        newDungeon[y1][x] = { type: 'floor', visible: false, explored: false };
                    }
                }
                for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
                    if (newDungeon[y][x2].type === 'wall') {
                        newDungeon[y][x2] = { type: 'floor', visible: false, explored: false };
                    }
                }
            } else {
                // Vertical first, then horizontal
                for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
                    if (newDungeon[y][x1].type === 'wall') {
                        newDungeon[y][x1] = { type: 'floor', visible: false, explored: false };
                    }
                }
                for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
                    if (newDungeon[y2][x].type === 'wall') {
                        newDungeon[y2][x] = { type: 'floor', visible: false, explored: false };
                    }
                }
            }
        }

        // Set player starting position in entrance room center
        const startX = entranceRoom.x + Math.floor(entranceRoom.width / 2);
        const startY = entranceRoom.y + Math.floor(entranceRoom.height / 2);
        
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

        // Place entities in rooms (not entrance room)
        for (let i = 1; i < rooms.length; i++) {
            const room = rooms[i];
            const entityCount = room.type === 'guard' ? 2 : Math.floor(Math.random() * 3);
            
            for (let j = 0; j < entityCount; j++) {
                const ex = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
                const ey = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
                
                if (newDungeon[ey][ex].type === 'floor') {
                    const isAnimal = Math.random() > 0.4;
                    const entityPool = isAnimal ? entityData.animals : entityData.humans;
                    const entityTemplate = entityPool[Math.floor(Math.random() * entityPool.length)];
                    
                    newEntities.push({
                        id: `entity_${entityId++}`,
                        x: ex,
                        y: ey,
                        type: entityTemplate.type || 'animal',
                        subtype: entityTemplate.subtype,
                        name: `${entityTemplate.description}`,
                        hp: entityTemplate.hp,
                        maxHp: entityTemplate.hp,
                        attack: entityTemplate.attack || 3,
                        defense: entityTemplate.defense || 1,
                        accuracy: entityTemplate.accuracy || 60,
                        evasion: entityTemplate.evasion || 20,
                        level: entityTemplate.level || 1,
                        hostile: entityTemplate.hostile,
                        description: entityTemplate.description,
                        symbol: entityTemplate.symbol,
                        color: entityTemplate.color,
                        dialogue: entityTemplate.type === 'hermit' || entityTemplate.type === 'bedouin' || entityTemplate.type === 'monk' ? 
                                 [`Greetings, traveler...`, `These ruins hold many secrets...`, `Beware the deeper chambers...`] : undefined,
                        loot: Math.random() > 0.7 ? [availableItems[Math.floor(Math.random() * availableItems.length)]] : undefined
                    });
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

    // Update fog of war
    const updateVisibility = useCallback((playerX: number, playerY: number) => {
        setDungeon(prev => {
            const newDungeon = prev.map(row => row.map(tile => ({ ...tile, visible: false })));
            
            // Vision radius of 5 with line of sight
            const visionRadius = 5;
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
                        
                        if (hasLineOfSight) {
                            newDungeon[y][x].visible = true;
                            newDungeon[y][x].explored = true;
                        }
                    }
                }
            }
            
            return newDungeon;
        });
    }, [dungeonDimensions]);

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
                gameSounds.playRoguelikeAttackSound(false); // Miss sound
            } else {
                const critText = result.critical ? ' CRITICAL HIT!' : '';
                addMessage(`You strike the ${entity.name} for ${result.damage} damage!${critText}`);
                gameSounds.playRoguelikeAttackSound(true); // Hit sound
                
                setEntities(prev => prev.map(e => {
                    if (e.id === entity.id) {
                        const newHp = Math.max(0, e.hp - result.damage);
                        if (newHp === 0) {
                            addMessage(`✦ You defeated the ${e.name}!`);
                            gameSounds.playEnemyDefeatSound();
                            
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
                                    gameSounds.playLevelUpSound();
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
                gameSounds.playRoguelikeAttackSound(false); // Enemy miss
            } else {
                const critText = result.critical ? ' CRITICAL HIT!' : '';
                addMessage(`The ${entity.name} attacks you for ${result.damage} damage!${critText}`);
                gameSounds.playDamageSound(result.critical ? 'heavy' : result.damage > 10 ? 'medium' : 'light');
                
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
        gameSounds.playRoguelikeCombatSound();
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
                gameSounds.playWallBumpSound();
                return prev;
            }
            
            // Check for entity collision
            const entityAtPosition = entities.find(e => e.x === newX && e.y === newY && e.hp > 0);
            if (entityAtPosition) {
                if (entityAtPosition.hostile) {
                    startCombat(entityAtPosition);
                } else if (entityAtPosition.dialogue) {
                    setCurrentDialogue({ 
                        entity: entityAtPosition, 
                        message: entityAtPosition.dialogue[Math.floor(Math.random() * entityAtPosition.dialogue.length)] 
                    });
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
                        gameSounds.playGoldPickupSound();
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
                        gameSounds.playItemPickupSound('generic');
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
                        gameSounds.playManuscriptSound();
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
                        gameSounds.playTrapSound();
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
                    gameSounds.playStairsSound();
                    break;
                    
                case 'altar':
                    addMessage('You examine the ancient altar. Mysterious energies emanate from it.');
                    gameSounds.playAltarSound();
                    break;
                    
                case 'food':
                    if (tile.hasFood) {
                        newPlayer.hunger = Math.min((newPlayer.maxHunger || 100), (newPlayer.hunger || 0) + 30);
                        addMessage(`You eat the ${tile.hasFood}. Hunger restored!`);
                        gameSounds.playItemPickupSound('food');
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
                        gameSounds.playTorchSound();
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
                gameSounds.playFootstepSound();
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
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'escape', 'm', '>', 'h'].includes(keyLower)) {
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
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [movePlayer, onExit, player, dungeon, generateDungeon, addMessage, combatState, handleCombatTurn, currentDepth, discoverNewChamber]);

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
                        ▓ {ruinType.name} ▓
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
                                <div><span className="text-cyan-400">↓</span> - Stairs</div>
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

                {/* Bottom Exit button - always visible */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <button
                        onClick={onExit}
                        className="px-6 py-2 font-bold rounded"
                        style={{ 
                            backgroundColor: '#ff6b00', 
                            color: 'black',
                            boxShadow: '0 0 20px #ff6b00'
                        }}
                    >
                        [EXIT DUNGEON - ESC]
                    </button>
                </div>
      
            
            {/* Always visible legend - bottom left corner */}
            <div className="absolute bottom-4 left-4 p-3 rounded" 
                 style={{ 
                     backgroundColor: 'rgba(26, 26, 26, 0.9)', 
                     border: '1px solid #ff6b00',
                     maxWidth: '200px'
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