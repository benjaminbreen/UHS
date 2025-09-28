/**
 * components/MiningRoguelikeDisplay.tsx - Dig Dug-style mining roguelike
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlayerCharacter, Item } from '../types';
import { ITEM_DEFINITIONS } from '../constants/index';
import gameSoundsService from '../services/gameSoundsService';

interface MiningRoguelikeDisplayProps {
    mineData: {
        name: string;
        description: string;
        oreType: string;
        depth: number;
        culturalZone?: string; // Add cultural zone for regional ores
        historicalEra?: string; // Add era for appropriate tools
    };
    playerCharacter: PlayerCharacter;
    onExit: () => void;
    onHealthChange?: (newHealth: number) => void;
    onInventoryAdd?: (item: any) => void;
    onFatigueChange?: (newFatigue: number) => void;
    onPlayerDeath?: (deathInfo: any) => void;
}

// Tile types for mining
type MineTileType = 'rock' | 'empty' | 'ore_vein' | 'rare_ore' | 'support_beam' |
                    'ladder' | 'entrance' | 'bedrock' | 'cave' | 'water' |
                    'lava' | 'gas_pocket' | 'crystal' | 'mushroom' | 'bones' |
                    'fossil' | 'cave_painting' | 'ancient_tool' | 'graffiti' | 'ruins_entrance' |
                    'ore_deposit' | 'gem_deposit';

// Mining entity types
interface MiningEntity {
    id: string;
    x: number;
    y: number;
    type: 'bat' | 'rat' | 'spider' | 'gas' | 'water_flow';
    hp?: number;
    hostile?: boolean;
    symbol: string;
    color: string;
}

interface MineTile {
    type: MineTileType;
    visible: boolean;
    explored: boolean;
    durability?: number; // How many hits to mine
    oreType?: string;
    oreAmount?: number;
    oreQuality?: 'poor' | 'low' | 'medium' | 'high' | 'exquisite';
    mineralType?: string; // Specific mineral/rock type
    waterLevel?: number;
    gasLevel?: number; // 0-100, gas concentration
    heat?: number; // For lava proximity
    oreHint?: boolean; // Shows if adjacent to ore
    hazard?: 'gas' | 'water' | 'unstable'; // Hazard warnings
    hasPickup?: boolean; // Ore/gem dropped on ground
    pickupItem?: any; // The actual item to pickup
    isGasSource?: boolean; // Tile actively emits gas
    supportBeam?: boolean; // Has structural support
}

interface MiningPlayer {
    x: number;
    y: number;
    depth: number; // Current depth in mine
    hp: number;
    maxHp: number;
    fatigue: number;
    maxFatigue: number;
    inventory: any[];
    oxygen: number; // For gas pockets
    torchLight: number; // Light radius
    pickaxeLevel: number; // 0 = hands, 1 = basic, 2 = iron, 3 = steel, 4 = diamond
    oresCollected: { [key: string]: number }; // Track collected ores
    isFalling?: boolean; // Track if player is currently falling
    fallDistance?: number; // How far the player has fallen
}

// Colors for different depths (gradient from surface to deep)
const getDepthColor = (depth: number, tileType: MineTileType): string => {
    const depthGradient = [
        { depth: 0, rock: '#8B7355', empty: '#2C2416' },     // Surface - browns
        { depth: 5, rock: '#705548', empty: '#1C1411' },     // Shallow - darker browns
        { depth: 10, rock: '#5A453A', empty: '#141010' },    // Medium - grays
        { depth: 15, rock: '#4A3A35', empty: '#0F0D0D' },    // Deep - dark grays
        { depth: 20, rock: '#3A2A30', empty: '#0A0808' },    // Deeper - purples
        { depth: 25, rock: '#2A1A25', empty: '#050505' },    // Very deep - dark purples
        { depth: 30, rock: '#1A0A20', empty: '#000000' },    // Bedrock - near black
    ];

    // Find the appropriate color range based on depth
    let colorSet = depthGradient[0];
    for (const range of depthGradient) {
        if (depth >= range.depth) {
            colorSet = range;
        }
    }

    switch (tileType) {
        case 'rock': return colorSet.rock;
        case 'empty': return colorSet.empty;
        case 'ore_vein':
            // Different ore colors based on type - more vibrant
            if (depth > 20) return '#FFB700'; // Deep gold
            if (depth > 15) return '#FFA500'; // Orange for iron
            if (depth > 10) return '#CD7F32'; // Bronze for copper
            return '#8B8B8B'; // Silver-gray for coal
        case 'rare_ore': return '#00FFFF'; // Bright cyan for rare ores
        case 'crystal': return '#FF00FF'; // Bright magenta for crystals
        case 'water': return '#0099FF'; // Bright blue
        case 'lava': return '#FF4500'; // Bright orange-red
        case 'support_beam': return '#8B4513';
        case 'ladder': return '#CD853F';
        case 'mushroom': return '#00FF00'; // Bright green
        case 'fossil': return '#D4A373'; // Tan/bone color
        case 'cave_painting': return '#8B4513'; // Saddle brown
        case 'ancient_tool': return '#708090'; // Slate gray
        case 'graffiti': return '#F0F0F0'; // Light gray
        case 'ruins_entrance': return '#4B0082'; // Indigo
        default: return colorSet.rock;
    }
};

// ASCII patterns for different rock types
const getRockPattern = (x: number, y: number, depth: number): string => {
    const patterns = ['█', '▓', '▒', '░'];
    const noise = (x * 7 + y * 13 + depth * 3) % 4;
    return patterns[Math.min(noise, patterns.length - 1)];
};

// Realistic geological associations - what rocks and minerals are found together
const GEOLOGICAL_ASSOCIATIONS = {
    // Igneous rocks and their associated minerals
    'Granite': ['Quartz', 'Feldspar', 'Mica', 'Tourmaline', 'Beryl'],
    'Basalt': ['Olivine', 'Pyroxene', 'Magnetite', 'Iron Ore'],
    'Obsidian': ['Pumice', 'Volcanic Glass', 'Sulfur'],
    'Pegmatite': ['Lithium', 'Beryllium', 'Tantalum', 'Rare Earth Elements', 'Tourmaline'],

    // Sedimentary rocks and associations
    'Limestone': ['Calcite', 'Dolomite', 'Fossils', 'Lead Ore', 'Zinc Ore'],
    'Sandstone': ['Quartz Sand', 'Iron Oxide', 'Gold Nuggets', 'Uranium Ore'],
    'Shale': ['Oil Shale', 'Natural Gas', 'Pyrite', 'Coal'],
    'Conglomerate': ['Gold Nuggets', 'Diamond', 'Platinum', 'Uranium'],

    // Metamorphic rocks and associations
    'Marble': ['Calcite Crystals', 'Graphite', 'Ruby', 'Sapphire'],
    'Slate': ['Pyrite', 'Quartz Veins', 'Gold Veins'],
    'Quartzite': ['Quartz Crystals', 'Gold Veins', 'Silver Veins'],
    'Schist': ['Garnet', 'Mica', 'Staurolite', 'Kyanite'],

    // Ore-bearing formations
    'Quartz Vein': ['Gold', 'Silver', 'Copper', 'Lead', 'Zinc'],
    'Kimberlite': ['Diamond', 'Garnet', 'Chromite', 'Olivine'],
    'Banded Iron': ['Hematite', 'Magnetite', 'Iron Ore', 'Jasper'],
    'Sulfide Deposit': ['Copper', 'Lead', 'Zinc', 'Silver', 'Gold'],

    // Coal and carbon deposits
    'Coal Seam': ['Coal', 'Shale', 'Pyrite', 'Fossils'],
    'Anthracite': ['High-Grade Coal', 'Graphite', 'Rare Coal'],

    // Precious metal zones
    'Gold Zone': ['Native Gold', 'Pyrite', 'Quartz', 'Silver', 'Tellurides'],
    'Silver Zone': ['Native Silver', 'Galena', 'Silver Chloride', 'Lead'],
    'Copper Zone': ['Malachite', 'Azurite', 'Chalcopyrite', 'Native Copper']
};

// Quality multipliers for value
const QUALITY_MULTIPLIERS = {
    'poor': 0.5,
    'low': 0.75,
    'medium': 1.0,
    'high': 1.5,
    'exquisite': 3.0
};

// Gem types by rarity
const GEM_TYPES = {
    common: ['Quartz Crystal', 'Amethyst', 'Citrine', 'Smoky Quartz', 'Rose Quartz'],
    uncommon: ['Garnet', 'Topaz', 'Tourmaline', 'Aquamarine', 'Peridot'],
    rare: ['Ruby', 'Sapphire', 'Emerald', 'Opal', 'Alexandrite'],
    legendary: ['Diamond', 'Black Diamond', 'Red Diamond', 'Star Sapphire', 'Padparadscha']
};

// Get geological context for a position
const getGeologicalContext = (x: number, y: number, depth: number): string => {
    // Use position and depth to determine rock type
    const noise = (x * 3 + y * 7 + depth * 11) % 20;

    if (depth < 5) {
        const surfaceRocks = ['Sandstone', 'Limestone', 'Shale', 'Conglomerate'];
        return surfaceRocks[noise % surfaceRocks.length];
    } else if (depth < 15) {
        const midRocks = ['Granite', 'Slate', 'Marble', 'Quartzite', 'Coal Seam'];
        return midRocks[noise % midRocks.length];
    } else if (depth < 25) {
        const deepRocks = ['Schist', 'Quartz Vein', 'Sulfide Deposit', 'Gold Zone', 'Banded Iron'];
        return deepRocks[noise % deepRocks.length];
    } else {
        const veryDeepRocks = ['Kimberlite', 'Pegmatite', 'Silver Zone', 'Copper Zone', 'Basalt'];
        return veryDeepRocks[noise % veryDeepRocks.length];
    }
};

// Determine ore quality based on depth and randomness
const getOreQuality = (depth: number): 'poor' | 'low' | 'medium' | 'high' | 'exquisite' => {
    const roll = Math.random();
    const depthBonus = depth / 50; // Deeper = better quality chance

    if (roll + depthBonus > 0.98) return 'exquisite';
    if (roll + depthBonus > 0.90) return 'high';
    if (roll + depthBonus > 0.60) return 'medium';
    if (roll + depthBonus > 0.30) return 'low';
    return 'poor';
};

// Get region-specific ores based on cultural zone
const getRegionalOre = (culturalZone: string = 'EUROPEAN', depth: number, rarity: number): { oreType: string, tileType: MineTileType } => {
    const regionalOres: { [key: string]: { common: string[], rare: string[], legendary: string[] } } = {
        'EUROPEAN': {
            common: ['Coal', 'Iron Ore', 'Tin Ore', 'Lead Ore'],
            rare: ['Silver Ore', 'Salt Crystals', 'Amber'],
            legendary: ['Mithril', 'Crystal Quartz']
        },
        'EAST_ASIAN': {
            common: ['Coal', 'Iron Ore', 'Copper Ore', 'Kaolin Clay'],
            rare: ['Jade', 'Mercury Ore', 'Rare Earth Elements'],
            legendary: ['Dragon Stone', 'Celestial Crystal']
        },
        'MENA': {
            common: ['Copper Ore', 'Salt Crystals', 'Limestone', 'Sandstone'],
            rare: ['Gold Ore', 'Turquoise', 'Lapis Lazuli'],
            legendary: ['Desert Glass', 'Phoenix Gem']
        },
        'SUB_SAHARAN_AFRICAN': {
            common: ['Iron Ore', 'Copper Ore', 'Bauxite', 'Cobalt Ore'],
            rare: ['Gold Ore', 'Diamond', 'Coltan'],
            legendary: ['Blood Diamond', 'Vibranium']
        },
        'SOUTH_ASIAN': {
            common: ['Coal', 'Iron Ore', 'Mica', 'Limestone'],
            rare: ['Ruby', 'Sapphire', 'Emerald'],
            legendary: ['Star Sapphire', 'Moonstone']
        },
        'NORTH_AMERICAN_PRE_COLUMBIAN': {
            common: ['Obsidian', 'Flint', 'Copper Ore', 'Clay'],
            rare: ['Turquoise', 'Silver Ore', 'Quartz Crystal'],
            legendary: ['Thunder Stone', 'Spirit Crystal']
        },
        'NORTH_AMERICAN_COLONIAL': {
            common: ['Coal', 'Iron Ore', 'Lead Ore', 'Zinc Ore'],
            rare: ['Silver Ore', 'Gold Ore', 'Oil Shale'],
            legendary: ['Uranium Ore', 'Plutonium']
        },
        'OCEANIA': {
            common: ['Bauxite', 'Iron Ore', 'Copper Ore', 'Nickel Ore'],
            rare: ['Opal', 'Gold Ore', 'Uranium Ore'],
            legendary: ['Black Opal', 'Rainbow Stone']
        },
        'SOUTH_AMERICAN': {
            common: ['Copper Ore', 'Tin Ore', 'Iron Ore', 'Saltpeter'],
            rare: ['Silver Ore', 'Gold Ore', 'Emerald'],
            legendary: ['El Dorado Gold', 'Inca Crystal']
        }
    };

    const ores = regionalOres[culturalZone] || regionalOres['EUROPEAN'];

    // Determine ore based on depth and rarity
    if (depth > 25 && rarity < 0.05) {
        // Very deep and very rare - legendary
        const ore = ores.legendary[Math.floor(Math.random() * ores.legendary.length)];
        return { oreType: ore, tileType: 'crystal' };
    } else if (depth > 15 && rarity < 0.15) {
        // Deep and rare
        const ore = ores.rare[Math.floor(Math.random() * ores.rare.length)];
        return { oreType: ore, tileType: 'rare_ore' };
    } else {
        // Common ores
        const ore = ores.common[Math.floor(Math.random() * ores.common.length)];
        return { oreType: ore, tileType: 'ore_vein' };
    }
};

const MiningRoguelikeDisplay: React.FC<MiningRoguelikeDisplayProps> = ({
    mineData,
    playerCharacter,
    onExit,
    onHealthChange,
    onInventoryAdd,
    onFatigueChange,
    onPlayerDeath
}) => {
    const MAP_WIDTH = 80;
    const MAP_HEIGHT = 40;
    const VIEWPORT_WIDTH = 22;  // Even more zoom for better visibility
    const VIEWPORT_HEIGHT = 12; // Even more zoom for better visibility

    // Initialize mine map
    const [mineMap, setMineMap] = useState<MineTile[][]>(() => {
        const map: MineTile[][] = [];
        for (let y = 0; y < MAP_HEIGHT; y++) {
            const row: MineTile[] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                // Create initial mine shaft entrance
                if (y === 0 && x >= MAP_WIDTH / 2 - 2 && x <= MAP_WIDTH / 2 + 2) {
                    row.push({ type: 'empty', visible: true, explored: true });
                } else if (y === 0 && x === MAP_WIDTH / 2) {
                    row.push({ type: 'entrance', visible: true, explored: true });
                } else {
                    // Generate rock with depth-based ore veins
                    const depthBonus = y * 0.003; // Increased ore chance with depth
                    const isOre = Math.random() < 0.04 + depthBonus;
                    const isStoryElement = Math.random() < 0.01 + (y * 0.0005); // Rare story elements

                    // Default to rock
                    let tileType: MineTileType = 'rock';
                    let oreType = mineData?.oreType || 'Iron';
                    let durability = 1;
                    let oreAmount = 0;

                    // Add environmental storytelling elements
                    if (isStoryElement && !isOre) {
                        const storyRoll = Math.random();
                        if (storyRoll < 0.2 && y > 10) {
                            tileType = 'fossil';
                            durability = 2;
                        } else if (storyRoll < 0.35 && y > 5) {
                            tileType = 'cave_painting';
                            durability = 1;
                        } else if (storyRoll < 0.5) {
                            tileType = 'ancient_tool';
                            durability = 1;
                        } else if (storyRoll < 0.7 && y > 3) {
                            tileType = 'graffiti';
                            durability = 1;
                        } else if (storyRoll < 0.85) {
                            tileType = 'bones';
                            durability = 1;
                        } else if (y > 20 && storyRoll < 0.95) {
                            tileType = 'ruins_entrance';
                            durability = 5;
                        }
                    } else if (isOre) {
                        // Use regional ore generation
                        const oreRoll = Math.random();
                        const regional = getRegionalOre(mineData?.culturalZone || 'EUROPEAN', y, oreRoll);

                        tileType = regional.tileType;
                        oreType = regional.oreType;

                        // Set durability based on ore type
                        if (tileType === 'crystal') {
                            durability = 4;
                            oreAmount = 1;
                        } else if (tileType === 'rare_ore') {
                            durability = 3;
                            oreAmount = Math.floor(Math.random() * 2) + 1;
                        } else {
                            durability = 2;
                            oreAmount = Math.floor(Math.random() * 3) + 2;
                        }
                    }

                    // Add hazards at deeper levels
                    let hazard: 'gas' | 'water' | 'unstable' | undefined = undefined;
                    let isGasSource = false;

                    // Add gas pockets
                    if (y > 5 && Math.random() < 0.05 && tileType === 'rock') {
                        tileType = 'gas_pocket';
                        durability = 1;
                        isGasSource = true;
                        hazard = 'gas';
                    }

                    if (y > 10 && tileType === 'rock') {
                        const hazardRoll = Math.random();
                        if (hazardRoll < 0.02) hazard = 'gas';
                        else if (hazardRoll < 0.04) hazard = 'water';
                        else if (hazardRoll < 0.06) hazard = 'unstable';
                    }

                    row.push({
                        type: tileType,
                        visible: false,
                        explored: false,
                        durability: durability,
                        oreType: tileType !== 'rock' ? oreType : undefined,
                        oreAmount: tileType !== 'rock' ? oreAmount : undefined,
                        hazard: hazard,
                        isGasSource: isGasSource,
                        gasLevel: isGasSource ? 100 : 0
                    });
                }
            }
            map.push(row);
        }

        // Create some initial caves for variety
        for (let i = 0; i < 5; i++) {
            const caveX = Math.floor(Math.random() * MAP_WIDTH);
            const caveY = Math.floor(Math.random() * (MAP_HEIGHT - 10)) + 10;
            const radius = Math.floor(Math.random() * 3) + 2;

            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if (dx * dx + dy * dy <= radius * radius) {
                        const x = caveX + dx;
                        const y = caveY + dy;
                        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                            map[y][x] = { type: 'cave', visible: false, explored: false };
                        }
                    }
                }
            }
        }

        return map;
    });

    // Player state
    const [player, setPlayer] = useState<MiningPlayer>({
        x: MAP_WIDTH / 2,
        y: 0,
        depth: 0,
        hp: playerCharacter.health,
        maxHp: playerCharacter.maxHealth,
        fatigue: playerCharacter.fatigue,
        maxFatigue: playerCharacter.maxFatigue,
        inventory: [],
        oxygen: 100,
        torchLight: 5,
        pickaxeLevel: getPickaxeLevel(),
        oresCollected: {}
    });

    // Determine pickaxe level from inventory
    function getPickaxeLevel(): number {
        const inventory = playerCharacter.inventory || [];
        if (inventory.some(i => i.name?.includes('Diamond') && i.name?.includes('Pickaxe'))) return 4;
        if (inventory.some(i => i.name?.includes('Steel') && i.name?.includes('Pickaxe'))) return 3;
        if (inventory.some(i => i.name?.includes('Iron') && i.name?.includes('Pickaxe'))) return 2;
        if (inventory.some(i => i.name?.includes('Pickaxe'))) return 1;
        return 1; // Default to basic pickaxe (assume player has one for now)
    }

    const [entities, setEntities] = useState<MiningEntity[]>([]);
    const [messages, setMessages] = useState<string[]>(['You enter the mine shaft...']);
    const [miningDirection, setMiningDirection] = useState<'north' | 'south' | 'east' | 'west' | null>(null);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showLegend, setShowLegend] = useState(true);
    const [isDead, setIsDead] = useState(false);
    const [deathCause, setDeathCause] = useState<string>('');
    const [lastDamageSource, setLastDamageSource] = useState<'fall' | 'gas' | 'cave-in' | 'drowning' | ''>('');
    const [consecutiveFalls, setConsecutiveFalls] = useState(0);
    const [gasWarningShown, setGasWarningShown] = useState(false);
    const [particles, setParticles] = useState<Array<{
        id: string;
        x: number;
        y: number;
        type: 'sparkle' | 'dust' | 'gas' | 'water_drip';
        startTime: number;
        duration: number;
    }>>([]);

    const [floatingTexts, setFloatingTexts] = useState<Array<{
        id: string;
        text: string;
        x: number;
        y: number;
        color: string;
        startTime: number;
    }>>([]);

    // Particle management functions
    const addParticle = useCallback((x: number, y: number, type: 'sparkle' | 'dust' | 'gas' | 'water_drip') => {
        const particle = {
            id: `${Date.now()}-${Math.random()}`,
            x,
            y,
            type,
            startTime: Date.now(),
            duration: type === 'sparkle' ? 2000 : type === 'dust' ? 1500 : 3000
        };
        setParticles(prev => [...prev, particle]);
    }, []);

    // Add floating text for item collection
    const addFloatingText = useCallback((x: number, y: number, text: string, color: string = '#FFD700') => {
        const floatingText = {
            id: `${Date.now()}-${Math.random()}`,
            text,
            x,
            y,
            color,
            startTime: Date.now()
        };
        setFloatingTexts(prev => [...prev, floatingText]);
    }, []);

    // Cleanup expired particles and floating texts
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setParticles(prev => prev.filter(p => now - p.startTime < p.duration));
            setFloatingTexts(prev => prev.filter(t => now - t.startTime < 2000));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Start mining ambient and roguelike music system
    useEffect(() => {
        // Start cave/ruins ambient sounds immediately for atmosphere (louder)
        gameSoundsService.playEnvironmentalSoundscape('RUINS');

        // Simple system: after 1-2 minutes, play roguelike music for 1-5 loops
        const initialDelay = (Math.random() * 60000) + 60000; // 1-2 minutes

        const scheduleRoguelikeMusic = () => {
            const timer = setTimeout(() => {
                const loopCount = Math.floor(Math.random() * 5) + 1; // 1-5 loops
                gameSoundsService.playRoguelikeMusic();

                // Stop after loop count (40 seconds per loop)
                const stopTimer = setTimeout(() => {
                    gameSoundsService.stopRoguelikeMusic();

                    // Schedule next session after 1-2 minutes
                    scheduleRoguelikeMusic();
                }, loopCount * 40000);

                return () => clearTimeout(stopTimer);
            }, initialDelay);

            return () => clearTimeout(timer);
        };

        const cleanup = scheduleRoguelikeMusic();

        return () => {
            cleanup();
            gameSoundsService.stopRoguelikeMusic();
            gameSoundsService.stopEnvironmentalSoundscape();
        };
    }, []);

    // Update visibility based on torch light and detect ore hints
    const updateVisibility = useCallback((playerX: number, playerY: number, map: MineTile[][]) => {
        const newMap = map.map(row => row.map(tile => ({ ...tile })));
        const lightRadius = player.torchLight;

        // Clear old ore hints
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                newMap[y][x].oreHint = false;
            }
        }

        for (let y = Math.max(0, playerY - lightRadius); y < Math.min(MAP_HEIGHT, playerY + lightRadius + 1); y++) {
            for (let x = Math.max(0, playerX - lightRadius); x < Math.min(MAP_WIDTH, playerX + lightRadius + 1); x++) {
                const distance = Math.sqrt((x - playerX) ** 2 + (y - playerY) ** 2);
                if (distance <= lightRadius) {
                    newMap[y][x].visible = true;
                    newMap[y][x].explored = true;

                    // Check for adjacent ore and mark ore hints
                    if (newMap[y][x].type === 'rock') {
                        const adjacentOre =
                            (y > 0 && (newMap[y-1][x].type === 'ore_vein' || newMap[y-1][x].type === 'rare_ore' || newMap[y-1][x].type === 'crystal')) ||
                            (y < MAP_HEIGHT - 1 && (newMap[y+1][x].type === 'ore_vein' || newMap[y+1][x].type === 'rare_ore' || newMap[y+1][x].type === 'crystal')) ||
                            (x > 0 && (newMap[y][x-1].type === 'ore_vein' || newMap[y][x-1].type === 'rare_ore' || newMap[y][x-1].type === 'crystal')) ||
                            (x < MAP_WIDTH - 1 && (newMap[y][x+1].type === 'ore_vein' || newMap[y][x+1].type === 'rare_ore' || newMap[y][x+1].type === 'crystal'));

                        if (adjacentOre) {
                            newMap[y][x].oreHint = true;
                        }
                    }
                }
            }
        }
        return newMap;
    }, [player.torchLight]);

    // Handle hazard triggering
    const handleHazard = (hazardType: 'gas' | 'water' | 'unstable', x: number, y: number) => {
        switch (hazardType) {
            case 'gas':
                setMessages(prev => [...prev.slice(-4), '⚠️ Gas pocket! You feel dizzy...']);
                gameSoundsService.playPoisonEffect(); // Use poison effect for gas hazard
                const gasDamage = Math.floor(Math.random() * 10) + 5;
                const newHpGas = Math.max(0, player.hp - gasDamage);
                setPlayer(prev => ({ ...prev, hp: newHpGas, oxygen: Math.max(0, prev.oxygen - 20) }));
                if (onHealthChange) onHealthChange(newHpGas);
                break;

            case 'water':
                setMessages(prev => [...prev.slice(-4), '💧 Water rushes in!']);
                gameSoundsService.playWaterSound(); // Water rushing sound
                // Fill nearby empty tiles with water
                const newMapWater = mineMap.map(row => row.map(tile => ({ ...tile })));
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const wx = x + dx;
                        const wy = y + dy;
                        if (wx >= 0 && wx < MAP_WIDTH && wy >= 0 && wy < MAP_HEIGHT) {
                            if (newMapWater[wy][wx].type === 'empty') {
                                newMapWater[wy][wx].type = 'water';
                            }
                        }
                    }
                }
                setMineMap(newMapWater);
                break;

            case 'unstable':
                setMessages(prev => [...prev.slice(-4), '⚠️ Cave-in! Rocks fall from above!']);
                gameSoundsService.playExplosionSound(); // Explosion sound for cave-in
                const caveDamage = Math.floor(Math.random() * 15) + 10;
                const newHpCave = Math.max(0, player.hp - caveDamage);
                setPlayer(prev => ({ ...prev, hp: newHpCave }));
                if (onHealthChange) onHealthChange(newHpCave);
                // Block some nearby tiles with rock
                const newMapCave = [...mineMap];
                for (let i = 0; i < 3; i++) {
                    const rx = x + Math.floor(Math.random() * 3) - 1;
                    const ry = y - 1;
                    if (rx >= 0 && rx < MAP_WIDTH && ry >= 0 && ry < MAP_HEIGHT) {
                        if (newMapCave[ry][rx].type === 'empty') {
                            newMapCave[ry][rx] = { type: 'rock', visible: true, explored: true, durability: 1 };
                        }
                    }
                }
                setMineMap(newMapCave);
                break;
        }
    };

    // Handle mining action with proper direction mapping
    const handleMine = useCallback((direction: 'north' | 'south' | 'east' | 'west') => {
        // Use current player position directly to avoid stale closure
        const currentX = player.x;
        const currentY = player.y;

        const dx = direction === 'east' ? 1 : direction === 'west' ? -1 : 0;
        const dy = direction === 'south' ? 1 : direction === 'north' ? -1 : 0;
        const targetX = currentX + dx;
        const targetY = currentY + dy;

        console.log(`Mining ${direction} from (${currentX},${currentY}) to (${targetX},${targetY})`);

        if (targetX < 0 || targetX >= MAP_WIDTH || targetY < 0 || targetY >= MAP_HEIGHT) {
            return;
        }

        const targetTile = mineMap[targetY][targetX];

        // Handle mineable tiles
        const mineableTiles = ['rock', 'ore_vein', 'rare_ore', 'crystal', 'fossil', 'cave_painting', 'ancient_tool', 'graffiti', 'ruins_entrance', 'gas_pocket'];
        if (mineableTiles.includes(targetTile.type)) {
            // Check for gas pocket BEFORE mining it
            if (targetTile.type === 'gas_pocket') {
                setMessages(prev => [...prev.slice(-4), '⚠️ WARNING: Gas pocket detected! Mining will release toxic gas!']);
            }
            // Check if can mine with current tool (only restrict for crystal and rare ore)
            const requiredLevel = targetTile.type === 'crystal' ? 3 : targetTile.type === 'rare_ore' ? 2 : 1;
            if (player.pickaxeLevel < requiredLevel && targetTile.type !== 'rock' && targetTile.type !== 'ore_vein') {
                const toolName = ['bare hands', 'basic pickaxe', 'iron pickaxe', 'steel pickaxe', 'diamond pickaxe'][player.pickaxeLevel];
                const requiredTool = ['basic pickaxe', 'iron pickaxe', 'steel pickaxe', 'diamond pickaxe'][requiredLevel - 1];
                setMessages(prev => [...prev.slice(-4), `Can't mine ${targetTile.type} with ${toolName}! Need ${requiredTool}.`]);
                return;
            }

            // Mine the tile
            gameSoundsService.playPickaxeHit();

            // Add dust particles when mining
            addParticle(targetX, targetY, 'dust');

            const newMap = mineMap.map(row => row.map(tile => ({ ...tile })));

            // Pickaxe efficiency reduces hits needed
            const miningPower = Math.max(1, player.pickaxeLevel);
            const effectiveDurability = Math.max(1, (targetTile.durability || 1) - miningPower + 1);

            if (effectiveDurability > 1) {
                newMap[targetY][targetX].durability = effectiveDurability - 1;
                setMessages(prev => [...prev.slice(-4), `Mining ${targetTile.type}... (${effectiveDurability - 1} hits remaining)`]);
            } else {
                // Check for hazards before mining
                if (targetTile.hazard) {
                    handleHazard(targetTile.hazard, targetX, targetY);
                }

                // Successfully mined - now drops ore instead of instant collection
                if (targetTile.type === 'ore_vein' || targetTile.type === 'rare_ore' || targetTile.type === 'crystal') {
                    // Determine what was mined based on geological context
                    const geologicalContext = getGeologicalContext(targetX, targetY, targetY);
                    const possibleMinerals = GEOLOGICAL_ASSOCIATIONS[geologicalContext] || ['Iron Ore'];
                    const mineralRoll = Math.random();

                    let minedItem = '';
                    let isGem = false;

                    // Check for gem chance (higher at depth, higher for crystal tiles)
                    const gemChance = targetTile.type === 'crystal' ? 0.3 : targetTile.type === 'rare_ore' ? 0.1 : 0.02;
                    if (mineralRoll < gemChance + (targetY / 100)) {
                        // It's a gem!
                        isGem = true;
                        const gemRarity = mineralRoll < 0.01 ? 'legendary' :
                                         mineralRoll < 0.05 ? 'rare' :
                                         mineralRoll < 0.15 ? 'uncommon' : 'common';
                        const gems = GEM_TYPES[gemRarity];
                        minedItem = gems[Math.floor(Math.random() * gems.length)];
                    } else {
                        // Regular mineral from geological association
                        minedItem = possibleMinerals[Math.floor(Math.random() * possibleMinerals.length)];
                    }

                    const quality = getOreQuality(targetY);
                    const oreAmount = targetTile.oreAmount || 1;

                    // Create ore drop on the ground
                    newMap[targetY][targetX] = {
                        type: 'ore_deposit',
                        visible: true,
                        explored: true,
                        hasPickup: true,
                        oreType: minedItem,
                        oreQuality: quality,
                        mineralType: geologicalContext,
                        pickupItem: {
                            name: minedItem,
                            quality: quality,
                            isGem: isGem,
                            geologicalContext: geologicalContext,
                            value: Math.floor((isGem ? 100 : 10) * QUALITY_MULTIPLIERS[quality] * (isGem ? 10 : 1)),
                            amount: oreAmount
                        }
                    };

                    console.log(`🔍 EXPOSED ORE: ${minedItem} at (${targetX},${targetY})`);
                    console.log(`   Type: ${newMap[targetY][targetX].type}`);
                    console.log(`   HasPickup: ${newMap[targetY][targetX].hasPickup}`);
                    console.log(`   PickupItem:`, newMap[targetY][targetX].pickupItem);

                    // Add sparkle particles for ore exposure
                    addParticle(targetX, targetY, 'sparkle');

                    // Play appropriate ore exposure sound
                    if (isGem) {
                        gameSoundsService.playGemExposedSound();
                    } else {
                        gameSoundsService.playOreExposedSound();
                    }

                    // Different message based on what was found
                    if (isGem) {
                        setMessages(prev => [...prev.slice(-4),
                            `💎 You exposed a ${quality} quality ${minedItem}! Press SPACE to collect.`]);
                    } else {
                        setMessages(prev => [...prev.slice(-4),
                            `You exposed ${quality} quality ${minedItem} (${geologicalContext} formation). Press SPACE to collect.`]);
                    }
                } else if (targetTile.type === 'fossil') {
                    setMessages(prev => [...prev.slice(-4), '🦴 You discovered an ancient fossil!']);
                    gameSoundsService.playAncientDiscoverySound();

                    // Add fossil to inventory as a valuable item
                    if (onInventoryAdd) {
                        onInventoryAdd({
                            id: `fossil_${Date.now()}`,
                            baseId: 'FOSSIL',
                            name: 'Ancient Fossil',
                            description: 'A well-preserved fossil from a prehistoric creature',
                            emoji: '🦴',
                            rarity: 'Rare',
                            value: 50,
                            weight: 2,
                            wearable: false,
                            stackable: false,
                            category: 'Artifact',
                            attack: 0,
                            sustenance: 0,
                            quantity: 1,
                            quality: 'standard',
                            condition: 100
                        });
                    }
                } else if (targetTile.type === 'cave_painting') {
                    const paintingMessages = [
                        '🎨 You found ancient cave paintings depicting hunters and animals!',
                        '🎨 Mysterious symbols are painted on the cave wall...',
                        '🎨 The wall shows a map of deeper tunnels!',
                        '🎨 These paintings tell a story of an ancient civilization...'
                    ];
                    setMessages(prev => [...prev.slice(-4), paintingMessages[Math.floor(Math.random() * paintingMessages.length)]]);
                } else if (targetTile.type === 'ancient_tool') {
                    const toolTypes = ['Ancient Pickaxe', 'Stone Hammer', 'Primitive Drill', 'Bronze Chisel'];
                    const toolType = toolTypes[Math.floor(Math.random() * toolTypes.length)];
                    setMessages(prev => [...prev.slice(-4), `⚒ You found an abandoned ${toolType}!`]);
                    gameSoundsService.playDiscoverySound();

                    if (onInventoryAdd) {
                        onInventoryAdd({
                            id: `tool_${Date.now()}`,
                            baseId: 'ANCIENT_TOOL',
                            name: toolType,
                            description: `An ancient mining tool left behind by previous explorers`,
                            emoji: '⚒',
                            rarity: 'Uncommon',
                            value: 30,
                            weight: 3,
                            wearable: false,
                            stackable: false,
                            category: 'Tool',
                            attack: 2,
                            sustenance: 0,
                            quantity: 1,
                            quality: 'poor',
                            condition: 40
                        });
                    }
                } else if (targetTile.type === 'graffiti') {
                    const graffitiMessages = [
                        '📝 "Turn back while you still can!" is scrawled on the wall',
                        '📝 "Rich veins 20m down" - signed J.M., 1889',
                        '📝 "Beware the gas pockets" written in charcoal',
                        '📝 Someone drew a crude map showing ore locations',
                        `📝 "${playerCharacter.name} was here" - wait, that's your name!`,
                        '📝 "If you can read this, you\'re too deep"'
                    ];
                    setMessages(prev => [...prev.slice(-4), graffitiMessages[Math.floor(Math.random() * graffitiMessages.length)]]);
                } else if (targetTile.type === 'ruins_entrance') {
                    setMessages(prev => [...prev.slice(-4), '⌂ You discovered the entrance to ancient underground ruins!']);
                    setMessages(prev => [...prev.slice(-4), '  This area requires further exploration...']);
                    gameSoundsService.playAncientDiscoverySound();

                    // Could trigger a special event or new area here
                    // For now, give a valuable artifact
                    if (onInventoryAdd) {
                        onInventoryAdd({
                            id: `artifact_${Date.now()}`,
                            baseId: 'ANCIENT_ARTIFACT',
                            name: 'Ancient Relic',
                            description: 'A mysterious artifact from the underground ruins',
                            emoji: '🏺',
                            rarity: 'Ultra-rare',
                            value: 200,
                            weight: 1,
                            wearable: false,
                            stackable: false,
                            category: 'Artifact',
                            attack: 0,
                            sustenance: 0,
                            quantity: 1,
                            quality: 'excellent',
                            condition: 100
                        });
                    }
                }

                // Don't clear tile if it's an ore deposit (which should remain for pickup)
                // The ore deposit was already set above
                if (targetTile.type !== 'ore_vein' && targetTile.type !== 'rare_ore' && targetTile.type !== 'crystal') {
                    // Only clear non-ore tiles
                    newMap[targetY][targetX] = { type: 'empty', visible: true, explored: true };
                }

                // Update player fatigue (less with better pickaxe)
                const fatigueCost = Math.max(1, 3 - player.pickaxeLevel);
                const newFatigue = Math.max(0, player.fatigue - fatigueCost);
                setPlayer(prev => ({ ...prev, fatigue: newFatigue }));
                if (onFatigueChange) {
                    onFatigueChange(newFatigue);
                }
            }

            setMineMap(updateVisibility(currentX, currentY, newMap));
        }
    }, [player.x, player.y, player.pickaxeLevel, player.fatigue, mineMap, mineData?.oreType, onInventoryAdd, onFatigueChange, updateVisibility]);

    // Handle player movement
    const handleMove = useCallback((dx: number, dy: number) => {
        const newX = player.x + dx;
        const newY = player.y + dy;

        if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) {
            return;
        }

        const targetTile = mineMap[newY][newX];

        if (targetTile.type !== 'rock' && targetTile.type !== 'bedrock') {
            // Can move to this tile
            const newPlayer = { ...player, x: newX, y: newY, depth: newY };
            setPlayer(newPlayer);
            setMineMap(updateVisibility(newX, newY, mineMap));

            // Play footstep sound based on surface type
            if (targetTile.type === 'water') {
                gameSoundsService.playFootstepSound('sand'); // Water splashing sound
            } else if (targetTile.type === 'ore_deposit' || targetTile.type === 'gem_deposit') {
                gameSoundsService.playFootstepSound('metal'); // Metallic clink when stepping on ore
            } else {
                gameSoundsService.playFootstepSound('stone'); // Stone footsteps for most surfaces
            }

            // Check for special tiles
            if (targetTile.type === 'entrance' && newY === 0) {
                setMessages(prev => [...prev.slice(-4), 'Press ESC to exit the mine']);
            }

            // Immediately check for gravity after moving
            setTimeout(() => applyGravity(), 50);
        }
    }, [player, mineMap, updateVisibility]);

    // Apply gravity to player and rocks
    const applyGravity = useCallback(() => {
        // First check if player should fall
        if (player.y < MAP_HEIGHT - 1) {
            const tileBelowPlayer = mineMap[player.y + 1][player.x];

            // Player falls if tile below is empty and not on a ladder
            if (tileBelowPlayer.type === 'empty' || tileBelowPlayer.type === 'water') {
                const fallStartY = player.y;
                let fallDistance = 0;
                let newY = player.y;

                // Calculate how far player will fall
                while (newY < MAP_HEIGHT - 1) {
                    const nextTile = mineMap[newY + 1][player.x];
                    if (nextTile.type === 'empty' || nextTile.type === 'water') {
                        newY++;
                        fallDistance++;
                    } else {
                        break;
                    }
                }

                if (fallDistance > 0) {
                    // Player is falling!
                    setPlayer(prev => ({ ...prev, y: newY, isFalling: true, fallDistance: (prev.fallDistance || 0) + fallDistance }));

                    // Add dust particles while falling
                    for (let i = 0; i < fallDistance; i++) {
                        addParticle(player.x, fallStartY + i, 'dust');
                    }

                    // Calculate fall damage
                    if (fallDistance > 2) {
                        const damage = Math.min(fallDistance * 10, 80); // Cap at 80 damage
                        const newHp = Math.max(0, player.hp - damage);
                        setPlayer(prev => ({ ...prev, hp: newHp }));

                        if (onHealthChange) onHealthChange(newHp);

                        // Play impact sound based on severity
                        if (fallDistance > 5) {
                            gameSoundsService.playExplosionSound(); // Heavy impact
                            setMessages(prev => [...prev.slice(-4),
                                `💥 You fell ${fallDistance}m! Took ${damage} damage!`]);
                            addFloatingText(player.x, newY, `-${damage} HP`, '#FF0000');
                        } else {
                            gameSoundsService.playImpactSound();
                            setMessages(prev => [...prev.slice(-4),
                                `You fell ${fallDistance}m and took ${damage} damage`]);
                            addFloatingText(player.x, newY, `-${damage} HP`, '#FFA500');
                        }

                        setLastDamageSource('fall');
                        setConsecutiveFalls(prev => prev + 1);

                        // Check for death
                        if (newHp <= 0) {
                            handleDeath('fall', fallDistance);
                        }
                    } else {
                        // Safe drop
                        setMessages(prev => [...prev.slice(-4), 'You dropped down safely']);
                    }

                    // Update map visibility
                    setMineMap(updateVisibility(player.x, newY, mineMap));
                    return true; // Gravity was applied
                }
            } else {
                // Player is on solid ground, reset fall tracking
                if (player.isFalling) {
                    setPlayer(prev => ({ ...prev, isFalling: false, fallDistance: 0 }));
                    setConsecutiveFalls(0);
                }
            }
        }

        // Apply gravity to rocks (cave-ins)
        let mapChanged = false;
        const newMap = mineMap.map(row => row.map(tile => ({ ...tile })));

        // Check from bottom to top to avoid processing the same rock multiple times
        for (let y = MAP_HEIGHT - 2; y >= 0; y--) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const tile = newMap[y][x];

                // Check if rock should fall
                if (tile.type === 'rock' && !tile.supportBeam) {
                    const tileBelow = newMap[y + 1][x];

                    // Rock falls if space below is empty
                    if (tileBelow.type === 'empty') {
                        // Check if player is below falling rock
                        if (player.x === x && player.y === y + 1) {
                            // Player gets crushed!
                            const damage = 50;
                            const newHp = Math.max(0, player.hp - damage);
                            setPlayer(prev => ({ ...prev, hp: newHp }));

                            if (onHealthChange) onHealthChange(newHp);

                            gameSoundsService.playExplosionSound();
                            setMessages(prev => [...prev.slice(-4),
                                '⚠️ CRUSHED by falling rock! Massive damage!']);
                            addFloatingText(x, y + 1, `-${damage} HP!`, '#FF0000');
                            setLastDamageSource('cave-in');

                            if (newHp <= 0) {
                                handleDeath('cave-in', 0);
                            }
                        }

                        // Move rock down
                        newMap[y + 1][x] = { ...tile };
                        newMap[y][x] = { type: 'empty', visible: true, explored: true };
                        mapChanged = true;

                        // Add dust particles
                        addParticle(x, y, 'dust');
                    }
                }
            }
        }

        if (mapChanged) {
            setMineMap(newMap);
            gameSoundsService.playRockSlideSound();
        }

        return mapChanged;
    }, [player, mineMap, onHealthChange, updateVisibility, addParticle, addFloatingText]);

    // Gas expansion system - gas spreads to adjacent empty tiles
    const expandGas = useCallback(() => {
        // Create a deep copy of the map to avoid mutating original tiles
        const newMap = mineMap.map(row => row.map(tile => ({ ...tile })));
        let gasExpanded = false;

        // First pass: identify gas sources and current gas tiles
        const gasTiles: {x: number, y: number, level: number}[] = [];

        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const tile = newMap[y][x];
                if (tile.gasLevel && tile.gasLevel > 0) {
                    gasTiles.push({x, y, level: tile.gasLevel});
                }
                // Gas pockets emit gas when broken
                if (tile.type === 'gas_pocket' || tile.isGasSource) {
                    tile.gasLevel = 100; // Maximum gas concentration
                    gasTiles.push({x, y, level: 100});
                }
            }
        }

        // Second pass: expand gas to adjacent tiles
        gasTiles.forEach(({x, y, level}) => {
            // Check all adjacent tiles
            const adjacent = [
                {dx: 0, dy: -1}, // up
                {dx: 0, dy: 1},  // down
                {dx: -1, dy: 0}, // left
                {dx: 1, dy: 0},  // right
            ];

            adjacent.forEach(({dx, dy}) => {
                const nx = x + dx;
                const ny = y + dy;

                if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
                    const adjacentTile = newMap[ny][nx];

                    // Gas spreads to empty spaces
                    if (adjacentTile.type === 'empty' || adjacentTile.type === 'water') {
                        const currentGas = adjacentTile.gasLevel || 0;
                        const spreadAmount = level * 0.25; // Gas spreads at 25% concentration

                        if (spreadAmount > currentGas) {
                            adjacentTile.gasLevel = Math.min(100, spreadAmount);
                            gasExpanded = true;

                            // Add gas particle effect
                            if (Math.random() < 0.3) {
                                addParticle(nx, ny, 'gas');
                            }
                        }
                    }
                }
            });
        });

        // Third pass: gas dissipation (slowly reduces over time)
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const tile = newMap[y][x];
                if (tile.gasLevel && tile.gasLevel > 0 && !tile.isGasSource) {
                    // Gas slowly dissipates
                    tile.gasLevel = Math.max(0, tile.gasLevel - 1);
                }
            }
        }

        if (gasExpanded || gasTiles.length > 0) {
            setMineMap(newMap);
        }

        // Check if player is in gas
        const playerTile = newMap[player.y][player.x];
        if (playerTile.gasLevel && playerTile.gasLevel > 0) {
            // Deplete oxygen based on gas concentration
            const oxygenLoss = Math.ceil(playerTile.gasLevel / 20); // 5% per turn at max concentration
            const newOxygen = Math.max(0, player.oxygen - oxygenLoss);

            setPlayer(prev => ({ ...prev, oxygen: newOxygen }));

            // Warning messages based on oxygen level
            if (newOxygen <= 0) {
                // Player suffocates!
                const newHp = 0;
                setPlayer(prev => ({ ...prev, hp: newHp }));
                if (onHealthChange) onHealthChange(newHp);
                handleDeath('gas', 0);
            } else if (newOxygen < 30) {
                setMessages(prev => [...prev.slice(-4),
                    '💀 CRITICAL: You\'re suffocating! Get to fresh air NOW!']);
                gameSoundsService.playPoisonEffect();
                addFloatingText(player.x, player.y, 'Can\'t breathe!', '#FF00FF');
            } else if (newOxygen < 60) {
                setMessages(prev => [...prev.slice(-4),
                    '⚠️ Warning: Toxic gas! Oxygen dropping fast!']);
                if (!gasWarningShown) {
                    gameSoundsService.playWarningSound();
                    setGasWarningShown(true);
                }
            } else {
                setMessages(prev => [...prev.slice(-4),
                    'You smell gas... be careful!']);
            }
        } else {
            // Player in fresh air, slowly recover oxygen
            if (player.oxygen < 100) {
                setPlayer(prev => ({ ...prev, oxygen: Math.min(100, prev.oxygen + 5) }));
                setGasWarningShown(false);
            }
        }
    }, [mineMap, player, onHealthChange, addParticle, addFloatingText]);

    // Handle death - integrates with existing game death system
    const handleDeath = useCallback((cause: 'fall' | 'gas' | 'cave-in' | 'drowning', fallDistance: number) => {
        setIsDead(true);

        let description = '';
        switch (cause) {
            case 'fall':
                description = `Fell ${fallDistance}m down a mine shaft`;
                break;
            case 'gas':
                description = 'Suffocated in toxic mine gases';
                break;
            case 'cave-in':
                description = 'Crushed by falling rocks in a cave-in';
                break;
            case 'drowning':
                description = 'Drowned in a flooded mine shaft';
                break;
        }

        setDeathCause(description);

        // Use the existing game death system
        if (onPlayerDeath) {
            onPlayerDeath({
                type: 'accident' as const,
                description: description
            });
        } else {
            // Fallback if no death handler
            setMessages(prev => [...prev.slice(-4),
                '☠️ YOU DIED!',
                description,
                'The mine has claimed another life...'
            ]);
        }
    }, [onPlayerDeath]);

    // Handle ore pickup
    const handlePickup = useCallback(() => {
        const currentTile = mineMap[player.y][player.x];
        console.log(`🎯 Attempting pickup at (${player.x},${player.y})`);
        console.log(`   Tile type: ${currentTile.type}`);
        console.log(`   HasPickup: ${currentTile.hasPickup}`);
        console.log(`   PickupItem:`, currentTile.pickupItem);

        if (currentTile.hasPickup && currentTile.pickupItem) {
            const item = currentTile.pickupItem;
            console.log(`✅ Pickup successful! Item:`, item);

            // Play appropriate sound based on item type
            if (item.isGem) {
                // Play Treasure Opening sound for gems (Zelda-style)
                gameSoundsService.playTreasureOpeningSound();
                setMessages(prev => [...prev.slice(-4),
                    `🎉 AMAZING! You collected a ${item.quality} ${item.name}! Value: ${item.value} gold!`]);
                addFloatingText(player.x, player.y, `💎 +${item.name}`, '#FFD700');
            } else if (item.quality === 'exquisite' || item.quality === 'high') {
                // Play discovery sound for high quality ores
                gameSoundsService.playDiscoverySound();
                gameSoundsService.playItemPickupSound('gold');
                setMessages(prev => [...prev.slice(-4),
                    `✨ Excellent find! ${item.quality} ${item.name} collected! Value: ${item.value} gold`]);
                addFloatingText(player.x, player.y, `✨ +${item.name}`, '#FFA500');
            } else if (item.quality === 'medium') {
                // Play success sound for medium quality items
                gameSoundsService.playTradeSuccessSound();
                setMessages(prev => [...prev.slice(-4),
                    `Good find! ${item.quality} ${item.name} collected`]);
                addFloatingText(player.x, player.y, `+${item.name}`, '#FFFF00');
            } else {
                // Play normal collection sound for common items
                gameSoundsService.playItemPickupSound('generic');
                setMessages(prev => [...prev.slice(-4),
                    `Collected ${item.quality} ${item.name} (${item.geologicalContext})`]);
                addFloatingText(player.x, player.y, `+${item.name}`, '#90EE90');
            }

            // Track collected ores
            setPlayer(prev => ({
                ...prev,
                oresCollected: {
                    ...prev.oresCollected,
                    [item.name]: (prev.oresCollected[item.name] || 0) + item.amount
                }
            }));

            // Add to inventory if callback exists
            if (onInventoryAdd) {
                // Determine emoji based on item type
                const getItemEmoji = (name: string, isGem: boolean) => {
                    if (isGem) {
                        if (name.includes('Diamond')) return '💎';
                        if (name.includes('Ruby')) return '🔴';
                        if (name.includes('Sapphire')) return '🔵';
                        if (name.includes('Emerald')) return '🟢';
                        if (name.includes('Opal')) return '⚪';
                        return '💎';
                    }
                    if (name.includes('Gold')) return '🟡';
                    if (name.includes('Silver')) return '⚪';
                    if (name.includes('Iron')) return '🔶';
                    if (name.includes('Copper')) return '🟤';
                    if (name.includes('Coal')) return '⚫';
                    if (name.includes('Quartz')) return '⬜';
                    return '🪨';
                };

                // Determine rarity based on quality and type
                const getRarity = (quality: string, isGem: boolean) => {
                    if (isGem) return 'Ultra-rare';
                    switch (quality) {
                        case 'exquisite': return 'Ultra-rare';
                        case 'high': return 'Rare';
                        case 'medium': return 'Uncommon';
                        case 'low': return 'Common';
                        case 'poor': return 'Common';
                        default: return 'Common';
                    }
                };

                for (let i = 0; i < item.amount; i++) {
                    onInventoryAdd({
                        id: `mineral_${Date.now()}_${i}_${Math.random()}`,
                        baseId: item.name.toUpperCase().replace(/ /g, '_'),
                        name: `${item.quality} ${item.name}`,
                        description: `${item.quality} quality ${item.name} from ${item.geologicalContext} formation`,
                        emoji: getItemEmoji(item.name, item.isGem),
                        rarity: getRarity(item.quality, item.isGem),
                        value: item.value,
                        weight: item.isGem ? 0.1 : 0.5,
                        wearable: false,
                        stackable: !item.isGem,
                        category: item.isGem ? 'Gem' : 'Material',
                        attack: 0,
                        sustenance: 0,
                        quantity: 1,
                        quality: item.quality,
                        condition: 100
                    });
                }
            }

            // Clear the pickup from the tile and make it empty
            const newMap = [...mineMap];
            newMap[player.y][player.x] = {
                type: 'empty',
                visible: true,
                explored: true,
                hasPickup: false,
                pickupItem: undefined
            };
            setMineMap(newMap);
        } else {
            setMessages(prev => [...prev.slice(-4), 'Nothing to pick up here.']);
        }
    }, [player, mineMap, onInventoryAdd, addFloatingText]);

    // Initialize environmental sounds when component mounts
    useEffect(() => {
        // Play cave/underground environmental soundscape
        gameSoundsService.playEnvironmentalSoundscape('RUINS'); // Using RUINS for cave-like atmosphere

        // Start the roguelike music after a short delay
        const musicTimer = setTimeout(() => {
            gameSoundsService.playRoguelikeMusic();
        }, 2000);

        // Cleanup on unmount
        return () => {
            clearTimeout(musicTimer);
            gameSoundsService.stopRoguelikeMusic();
        };
    }, []);

    // Keyboard controls
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Only prevent default for keys we're actually handling
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'escape', ' ', 'l'].includes(e.key.toLowerCase())) {
                e.preventDefault();
                e.stopPropagation();
            }

            switch (e.key.toLowerCase()) {
                // Movement
                case 'arrowup': handleMove(0, -1); break;
                case 'arrowdown': handleMove(0, 1); break;
                case 'arrowleft': handleMove(-1, 0); break;
                case 'arrowright': handleMove(1, 0); break;

                // Mining with WASD
                case 'w': handleMine('north'); break;
                case 's': handleMine('south'); break;
                case 'a': handleMine('west'); break;
                case 'd': handleMine('east'); break;

                // Pickup
                case ' ': handlePickup(); break;

                // Toggle legend
                case 'l':
                    gameSoundsService.playUIClickSound();
                    setShowLegend(prev => !prev);
                    break;

                // Exit
                case 'escape': setShowExitConfirm(true); break;
            }
        };

        // Don't process input if dead
        if (!isDead) {
            window.addEventListener('keydown', handleKeyPress);
            return () => window.removeEventListener('keydown', handleKeyPress);
        }
    }, [handleMove, handleMine, handlePickup, onExit, player.x, player.y]);

    // Periodic physics update (gravity and gas)
    useEffect(() => {
        if (isDead) return; // Stop updates if dead

        const physicsInterval = setInterval(() => {
            // Apply gravity every tick
            applyGravity();

            // Expand gas every few ticks
            expandGas();
        }, 500); // Update every 500ms

        return () => clearInterval(physicsInterval);
    }, [applyGravity, expandGas, isDead]);

    // Trigger gravity check after any movement or mining action
    useEffect(() => {
        if (!isDead) {
            // Small delay to let the map update first
            const gravityTimer = setTimeout(() => {
                applyGravity();
            }, 100);

            return () => clearTimeout(gravityTimer);
        }
    }, [player.x, player.y, mineMap, applyGravity, isDead]);

    // Render the mining view
    const renderMineView = () => {
        const startX = Math.max(0, Math.min(player.x - VIEWPORT_WIDTH / 2, MAP_WIDTH - VIEWPORT_WIDTH));
        const startY = Math.max(0, Math.min(player.y - VIEWPORT_HEIGHT / 2, MAP_HEIGHT - VIEWPORT_HEIGHT));

        const rows = [];
        for (let y = 0; y < VIEWPORT_HEIGHT; y++) {
            let row = '';
            for (let x = 0; x < VIEWPORT_WIDTH; x++) {
                const mapX = startX + x;
                const mapY = startY + y;

                if (mapY >= MAP_HEIGHT || mapX >= MAP_WIDTH) {
                    row += ' ';
                    continue;
                }

                const tile = mineMap[mapY][mapX];
                const isPlayer = mapX === player.x && mapY === player.y;

                if (isPlayer) {
                    row += '@';
                } else if (!tile.visible) {
                    row += ' ';
                } else {
                    switch (tile.type) {
                        case 'rock':
                            // Show ore hints with special character
                            row += tile.oreHint ? '▓' : getRockPattern(mapX, mapY, mapY);
                            break;
                        case 'empty':
                            // Show gas density if present
                            if (tile.gasLevel && tile.gasLevel > 70) {
                                row += '▓'; // Dense gas cloud
                            } else if (tile.gasLevel && tile.gasLevel > 30) {
                                row += '░'; // Light gas
                            } else {
                                row += '·'; // Normal empty
                            }
                            break;
                        case 'cave': row += ' '; break;
                        case 'ore_vein': row += '◊'; break;
                        case 'rare_ore': row += '◈'; break;
                        case 'crystal': row += '♦'; break;
                        case 'support_beam': row += '╬'; break;
                        case 'ladder': row += 'H'; break;
                        case 'entrance': row += '▲'; break;
                        case 'water': row += '~'; break;
                        case 'lava': row += '≈'; break;
                        case 'mushroom': row += '♠'; break;
                        case 'gas_pocket': row += '☠'; break;
                        case 'fossil': row += '◎'; break;
                        case 'cave_painting': row += '▣'; break;
                        case 'ancient_tool': row += '⚒'; break;
                        case 'graffiti': row += '§'; break;
                        case 'ruins_entrance': row += '⌂'; break;
                        case 'ore_deposit': row += tile.pickupItem?.isGem ? '◆' : '●'; break;
                        case 'gem_deposit': row += '◆'; break;
                        default: row += '?';
                    }
                }
            }
            rows.push(row);
        }
        return rows;
    };

    const viewRows = renderMineView();

    return (
        <div className="w-full h-full flex flex-col bg-gradient-to-b from-gray-900 via-stone-900 to-black text-white font-mono">
            {/* Add CSS animations for mystical effects */}
            <style>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px) translateX(0px);
                        opacity: 0.3;
                    }
                    25% {
                        transform: translateY(-20px) translateX(10px);
                        opacity: 0.6;
                    }
                    50% {
                        transform: translateY(-10px) translateX(-10px);
                        opacity: 0.4;
                    }
                    75% {
                        transform: translateY(-30px) translateX(5px);
                        opacity: 0.5;
                    }
                }
                @keyframes glow {
                    0%, 100% { opacity: 0.7; }
                    50% { opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.9; }
                    50% { transform: scale(1.05); opacity: 1; }
                }
                @keyframes sparkle {
                    0%, 100% { opacity: 0.8; filter: brightness(1); }
                    50% { opacity: 1; filter: brightness(1.5); }
                }
                @keyframes ore-glow {
                    0%, 100% { filter: brightness(1) drop-shadow(0 0 8px currentColor); }
                    50% { filter: brightness(1.3) drop-shadow(0 0 16px currentColor); }
                }
                .ore-exposed {
                    animation: ore-glow 1.5s ease-in-out infinite;
                }
            `}</style>
            {/* Header */}
            <div className="bg-gradient-to-b from-amber-900 to-amber-950 p-3 border-b-2 border-yellow-600">
                <div className="flex justify-between items-center">
                    <div className="flex gap-6">
                        <span className="text-yellow-300 text-lg">⛏️ {mineData?.name || 'Unknown Mine'}</span>
                        <span className="text-orange-400">Depth: {player.depth}m</span>
                        <span className="text-yellow-400">Light: {player.torchLight}</span>
                    </div>
                </div>
            </div>

            {/* Main game area - flexbox layout with left panel, center map, right space */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 flex">
                    {/* Left Status Panel */}
                    <div className="w-80 p-4 bg-gray-900 border-r border-gray-700">
                        {/* Status Panel */}
                        <div className="mb-4 p-3 bg-gray-800 rounded">
                            <h3 className="text-yellow-400 font-bold mb-2">Mining Status</h3>

                            {/* Depth Meter */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-300">Depth</span>
                                    <span className="text-orange-400">{player.depth}m</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-orange-600 to-red-600 h-2 rounded-full transition-all duration-300"
                                         style={{width: `${Math.min(100, (player.depth/(mineData?.depth || 100))*100)}%`}} />
                                </div>
                            </div>

                            {/* Pickaxe Level */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-300">Pickaxe</span>
                                    <span className="text-cyan-400">
                                        {['Bare Hands', 'Basic', 'Iron', 'Steel', 'Diamond'][player.pickaxeLevel]}
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    {[0,1,2,3,4].map(level => (
                                        <div key={level} className={`flex-1 h-2 rounded ${
                                            level <= player.pickaxeLevel ? 'bg-cyan-500' : 'bg-gray-600'
                                        }`} />
                                    ))}
                                </div>
                            </div>

                            {/* Oxygen Level (if in gas area) */}
                            {player.oxygen < 100 && (
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-300">Oxygen</span>
                                        <span className={player.oxygen < 30 ? 'text-red-400' : 'text-blue-400'}>
                                            {player.oxygen}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div className={`h-2 rounded-full transition-all duration-300 ${
                                            player.oxygen < 30 ? 'bg-gradient-to-r from-red-600 to-red-400' :
                                            player.oxygen < 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                                            'bg-gradient-to-r from-blue-600 to-cyan-400'
                                        }`}
                                             style={{width: `${Math.max(0, player.oxygen)}%`}} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mini-Map */}
                        <div className="mb-4 p-3 bg-gray-800 rounded">
                            <h3 className="text-yellow-400 font-bold mb-2">Mini-Map</h3>
                            <div className="grid grid-cols-7 gap-px bg-gray-600 p-1 rounded text-xs leading-none">
                                {(() => {
                                    const miniMapCells = [];
                                    const centerX = player.x;
                                    const centerY = player.y;
                                    const radius = 3;

                                    for (let dy = -radius; dy <= radius; dy++) {
                                        for (let dx = -radius; dx <= radius; dx++) {
                                            const mapX = centerX + dx;
                                            const mapY = centerY + dy;
                                            const isPlayer = dx === 0 && dy === 0;
                                            const isInBounds = mapX >= 0 && mapX < MAP_WIDTH && mapY >= 0 && mapY < MAP_HEIGHT;
                                            const tile = isInBounds ? mineMap[mapY]?.[mapX] : null;

                                            let bgColor = '#1F2937'; // Default dark gray
                                            let content = '';

                                            if (isPlayer) {
                                                bgColor = '#FCD34D'; // Yellow for player
                                                content = '●';
                                            } else if (tile?.explored) {
                                                if (tile.type === 'ore_vein') bgColor = '#F59E0B'; // Amber
                                                else if (tile.type === 'rare_ore') bgColor = '#06B6D4'; // Cyan
                                                else if (tile.type === 'crystal') bgColor = '#EC4899'; // Pink
                                                else if (tile.type === 'ore_deposit') bgColor = '#10B981'; // Green
                                                else if (tile.type === 'empty') bgColor = '#374151'; // Gray
                                                else if (tile.type === 'rock') bgColor = '#6B7280'; // Lighter gray
                                                else bgColor = '#4B5563'; // Medium gray
                                            } else if (tile?.visible) {
                                                bgColor = '#111827'; // Very dark for visible but unexplored
                                            }

                                            miniMapCells.push(
                                                <div
                                                    key={`${dx}_${dy}`}
                                                    className="w-3 h-3 flex items-center justify-center text-white"
                                                    style={{ backgroundColor: bgColor }}
                                                >
                                                    {content}
                                                </div>
                                            );
                                        }
                                    }
                                    return miniMapCells;
                                })()}
                            </div>
                            <div className="text-xs text-gray-400 mt-2 text-center">
                                7×7 area around player
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="mb-4 p-3 bg-gray-800 rounded">
                            <h3 className="text-yellow-400 font-bold mb-2">Controls</h3>
                            <div className="text-xs space-y-1">
                                <div>Arrow Keys: Move through tunnels</div>
                                <div>WASD: Mine in direction</div>
                                <div>SPACE: Pick up ore/gems</div>
                                <div>ESC: Exit mine</div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="mb-4 p-3 bg-gray-800 rounded">
                            <h3 className="text-yellow-400 font-bold mb-2">Messages</h3>
                            <div className="text-xs space-y-1 text-gray-300">
                                {messages.map((msg, i) => (
                                    <div key={i} className="opacity-${100 - i * 20}">{msg}</div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Mine view with enhanced mystical display - now centered and larger */}
                    <div className="flex-1 p-8 relative flex items-center justify-center overflow-hidden">
                        <div className="bg-gradient-to-br from-stone-900 via-gray-900 to-black p-8 rounded-2xl border-4 border-amber-600 shadow-2xl relative" style={{ width: '100%', maxWidth: '800px', height: '100%', maxHeight: '600px', boxShadow: '0 0 80px rgba(251, 191, 36, 0.5), inset 0 0 40px rgba(0, 0, 0, 0.9)' }}>
                            {viewRows.map((row, y) => (
                                <div key={y} className="leading-relaxed" style={{ height: '40px', fontSize: '28px', letterSpacing: '0.35em' }}>
                                    {row.split('').map((char, x) => {
                                        const startX = Math.max(0, Math.min(player.x - Math.floor(VIEWPORT_WIDTH / 2), MAP_WIDTH - VIEWPORT_WIDTH));
                                        const startY = Math.max(0, Math.min(player.y - Math.floor(VIEWPORT_HEIGHT / 2), MAP_HEIGHT - VIEWPORT_HEIGHT));
                                        const mapX = startX + x;
                                        const mapY = startY + y;
                                        // Add extra bounds checking to prevent undefined access
                                        const tile = (mapY >= 0 && mapY < MAP_HEIGHT && mapX >= 0 && mapX < MAP_WIDTH && mineMap[mapY] && mineMap[mapY][mapX]) ? mineMap[mapY][mapX] : null;
                                        const isPlayer = mapX === player.x && mapY === player.y;

                                    const color = isPlayer ? '#FFD700' :  // Gold for player - more visible
                                                 tile?.oreHint ? '#FFA500' :  // Orange for ore hints
                                                 tile?.hazard ? '#FF4444' :   // Red for hazards
                                                 tile ? getDepthColor(mapY, tile.type) : '#000000';

                                    // Add glowing effects for ores and crystals
                                    let textShadow = 'none';

                                    // Check for gas overlay first
                                    if (tile?.gasLevel && tile.gasLevel > 0) {
                                        // Green tint for gas
                                        const gasOpacity = tile.gasLevel / 100;
                                        const baseColor = color;

                                        // Mix green with base color based on gas concentration
                                        if (tile.gasLevel > 70) {
                                            color = '#00FF00'; // Dense toxic gas
                                            textShadow = '0 0 20px #00FF00, 0 0 40px #00AA00';
                                        } else if (tile.gasLevel > 30) {
                                            color = '#66FF66'; // Medium gas
                                            textShadow = `0 0 10px #00FF00, 0 0 20px #00AA00`;
                                        } else {
                                            // Light gas - tint the existing color
                                            textShadow = `0 0 5px #00FF0066`;
                                        }
                                    }

                                    if (isPlayer) {
                                        // Player glow (override gas if player)
                                        textShadow = '0 0 12px #FFD700, 0 0 24px #FFA500';  // Brighter gold glow
                                    } else if (tile?.type === 'ore_vein') {
                                        textShadow = `0 0 6px ${color}, 0 0 12px ${color}`;
                                    } else if (tile?.type === 'rare_ore') {
                                        textShadow = '0 0 8px #00FFFF, 0 0 16px #00FFFF, 0 0 24px #00FFFF';
                                    } else if (tile?.type === 'crystal') {
                                        // Animated pulsing effect for crystals
                                        const pulse = Math.sin(Date.now() / 500 + x + y) * 0.5 + 0.5;
                                        textShadow = `0 0 ${10 + pulse * 10}px #FF00FF, 0 0 ${20 + pulse * 20}px #FF00FF, 0 0 ${30 + pulse * 15}px #FF00FF`;
                                    } else if (tile?.type === 'mushroom') {
                                        textShadow = '0 0 4px #00FF00, 0 0 8px #00FF00';
                                    } else if (tile?.type === 'lava') {
                                        textShadow = '0 0 10px #FF4500, 0 0 20px #FF0000';
                                    } else if (tile?.type === 'fossil') {
                                        textShadow = '0 0 5px #D4A373, 0 0 10px #8B7355';
                                    } else if (tile?.type === 'cave_painting') {
                                        textShadow = '0 0 6px #8B4513, 0 0 12px #A0522D';
                                    } else if (tile?.type === 'ancient_tool') {
                                        textShadow = '0 0 4px #708090, 0 0 8px #778899';
                                    } else if (tile?.type === 'graffiti') {
                                        textShadow = '0 0 3px #FFFFFF, 0 0 6px #C0C0C0';
                                    } else if (tile?.type === 'ruins_entrance') {
                                        const pulse = Math.sin(Date.now() / 800) * 0.5 + 0.5;
                                        textShadow = `0 0 ${8 + pulse * 8}px #4B0082, 0 0 ${16 + pulse * 16}px #6A0DAD`;
                                    } else if (tile?.type === 'ore_deposit') {
                                        // Glow based on quality
                                        if (tile.pickupItem?.isGem) {
                                            // Intense pulsing for gems
                                            const pulse = Math.sin(Date.now() / 300) * 0.5 + 0.5;
                                            textShadow = `0 0 ${15 + pulse * 20}px #FFD700, 0 0 ${30 + pulse * 30}px #FFA500`;
                                        } else if (tile.oreQuality === 'exquisite') {
                                            textShadow = '0 0 15px #FFD700, 0 0 30px #FFA500';
                                        } else if (tile.oreQuality === 'high') {
                                            textShadow = '0 0 10px #FFA500, 0 0 20px #FF8C00';
                                        } else {
                                            textShadow = '0 0 5px #CD853F, 0 0 10px #8B7355';
                                        }
                                    } else if (tile?.oreHint) {
                                        textShadow = '0 0 3px #FFA500';
                                    }

                                    // Use better, larger characters
                                    let displayChar = char;
                                    let fontSize = '16px';

                                    if (isPlayer) {
                                        displayChar = '👷';  // Worker emoji
                                        fontSize = '18px';
                                    } else if (tile?.type === 'ore_deposit' && tile?.pickupItem?.isGem) {
                                        displayChar = '💎';  // Gem emoji
                                        fontSize = '18px';
                                    } else if (tile?.type === 'crystal') {
                                        displayChar = '💠';  // Crystal emoji
                                        fontSize = '18px';
                                    }

                                    return (
                                        <span key={x} style={{
                                            color,
                                            textShadow,
                                            fontSize,
                                            fontWeight: isPlayer ? 'bold' : 'normal',
                                            display: 'inline-block',
                                            width: '16px',
                                            textAlign: 'center'
                                        }}>
                                            {displayChar}
                                        </span>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Particle Effects Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                        {particles.map(particle => {
                            const startX = Math.max(0, Math.min(player.x - Math.floor(VIEWPORT_WIDTH / 2), MAP_WIDTH - VIEWPORT_WIDTH));
                            const startY = Math.max(0, Math.min(player.y - Math.floor(VIEWPORT_HEIGHT / 2), MAP_HEIGHT - VIEWPORT_HEIGHT));

                            // Convert world coordinates to viewport coordinates
                            const viewportX = particle.x - startX;
                            const viewportY = particle.y - startY;

                            // Only render particles visible in the viewport
                            if (viewportX < 0 || viewportX >= VIEWPORT_WIDTH || viewportY < 0 || viewportY >= VIEWPORT_HEIGHT) {
                                return null;
                            }

                            const elapsed = Date.now() - particle.startTime;
                            const progress = Math.min(elapsed / particle.duration, 1);

                            let particleElements;
                            const baseX = viewportX * 24 * 1.6; // Match scaling
                            const baseY = viewportY * 32 * 1.6; // Match scaling

                            if (particle.type === 'sparkle') {
                                particleElements = (
                                    <div className="absolute flex" style={{ left: baseX, top: baseY }}>
                                        {[0, 1, 2, 3, 4].map(i => (
                                            <div
                                                key={i}
                                                className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-ping"
                                                style={{
                                                    left: `${Math.cos(i * 1.26) * 15}px`,
                                                    top: `${Math.sin(i * 1.26) * 15}px`,
                                                    animationDelay: `${i * 100}ms`,
                                                    animationDuration: '800ms',
                                                    opacity: 1 - progress
                                                }}
                                            />
                                        ))}
                                    </div>
                                );
                            } else if (particle.type === 'dust') {
                                particleElements = (
                                    <div className="absolute" style={{ left: baseX, top: baseY }}>
                                        {[0, 1, 2].map(i => (
                                            <div
                                                key={i}
                                                className="absolute w-1 h-1 bg-gray-400 rounded-full"
                                                style={{
                                                    left: `${(Math.random() - 0.5) * 20}px`,
                                                    top: `${(Math.random() - 0.5) * 20}px`,
                                                    transform: `translateY(${progress * 30}px) scale(${1 + progress})`,
                                                    opacity: 0.8 - progress
                                                }}
                                            />
                                        ))}
                                    </div>
                                );
                            } else if (particle.type === 'gas') {
                                particleElements = (
                                    <div className="absolute" style={{ left: baseX, top: baseY }}>
                                        <div
                                            className="w-6 h-6 bg-green-400 rounded-full"
                                            style={{
                                                transform: `scale(${1 + progress * 2})`,
                                                opacity: 0.6 - progress * 0.6,
                                                filter: 'blur(2px)'
                                            }}
                                        />
                                    </div>
                                );
                            } else if (particle.type === 'water_drip') {
                                particleElements = (
                                    <div className="absolute" style={{ left: baseX, top: baseY }}>
                                        <div
                                            className="w-1 h-2 bg-blue-400 rounded-full"
                                            style={{
                                                transform: `translateY(${progress * 40}px)`,
                                                opacity: 1 - progress
                                            }}
                                        />
                                    </div>
                                );
                            }

                            return (
                                <div key={particle.id}>
                                    {particleElements}
                                </div>
                            );
                        })}

                        {/* Floating Text Effects */}
                        {floatingTexts.map(text => {
                            const startX = Math.max(0, Math.min(player.x - Math.floor(VIEWPORT_WIDTH / 2), MAP_WIDTH - VIEWPORT_WIDTH));
                            const startY = Math.max(0, Math.min(player.y - Math.floor(VIEWPORT_HEIGHT / 2), MAP_HEIGHT - VIEWPORT_HEIGHT));

                            // Convert world coordinates to viewport coordinates
                            const viewportX = text.x - startX;
                            const viewportY = text.y - startY;

                            // Only render texts visible in the viewport
                            if (viewportX < 0 || viewportX >= VIEWPORT_WIDTH || viewportY < 0 || viewportY >= VIEWPORT_HEIGHT) {
                                return null;
                            }

                            const elapsed = Date.now() - text.startTime;
                            const progress = Math.min(elapsed / 2000, 1);

                            const baseX = viewportX * 24 * 1.8 + 100;
                            const baseY = viewportY * 48 + 50;

                            return (
                                <div
                                    key={text.id}
                                    className="absolute text-lg font-bold pointer-events-none"
                                    style={{
                                        left: baseX,
                                        top: baseY,
                                        color: text.color,
                                        transform: `translateY(${-progress * 40}px)`,
                                        opacity: 1 - progress,
                                        textShadow: `0 0 10px ${text.color}, 0 2px 4px rgba(0,0,0,0.8)`,
                                        transition: 'none'
                                    }}
                                >
                                    {text.text}
                                </div>
                            );
                        })}
                    </div>
                </div>
                </div>

                {/* Subtle Legend Overlay - positioned only under the mining viewport */}
                {showLegend && (
                    <div className="absolute bottom-4 left-[calc(320px+2rem)] right-8 max-w-3xl mx-auto bg-black/60 backdrop-blur-sm rounded-lg p-3 text-xs border border-gray-700/50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-yellow-400 font-semibold text-sm">Legend</span>
                            <button
                                onClick={() => {
                                    gameSoundsService.playUIClickSound();
                                    setShowLegend(false);
                                }}
                                className="text-gray-400 hover:text-white transition-colors text-sm px-1"
                                title="Hide legend (press L to toggle)"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-1 text-gray-300">
                            <div className="flex items-center gap-1"><span style={{ color: '#FFD700' }}>◊</span> Ore</div>
                            <div className="flex items-center gap-1"><span style={{ color: '#00FFFF' }}>◈</span> Rare</div>
                            <div className="flex items-center gap-1"><span style={{ color: '#FF00FF' }}>♦</span> Crystal</div>
                            <div className="flex items-center gap-1"><span style={{ color: '#FFA500' }}>▓</span> Ore nearby</div>
                            <div className="flex items-center gap-1"><span style={{ color: '#10B981' }}>●/◆</span> Pickup</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Exit Confirmation Modal */}
            {showExitConfirm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border-2 border-yellow-600 rounded-lg p-6 max-w-md">
                        <h2 className="text-yellow-400 text-xl font-bold mb-4">Exit Mine?</h2>

                        {/* Ore Summary */}
                        {Object.keys(player.oresCollected).length > 0 ? (
                            <div className="mb-4 p-3 bg-gray-800 rounded">
                                <h3 className="text-white font-semibold mb-2">Ores Collected:</h3>
                                <div className="space-y-1">
                                    {Object.entries(player.oresCollected).map(([ore, count]) => (
                                        <div key={ore} className="text-sm flex justify-between">
                                            <span className="text-gray-300">{ore}:</span>
                                            <span className="text-yellow-400 font-bold">{count}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-700">
                                    <div className="text-sm flex justify-between">
                                        <span className="text-green-400">Total Value:</span>
                                        <span className="text-green-400 font-bold">
                                            {Object.entries(player.oresCollected).reduce((sum, [ore, count]) => {
                                                const values: { [key: string]: number } = {
                                                    'Coal': 2,
                                                    'Copper Ore': 5,
                                                    'Iron Ore': 8,
                                                    'Silver Ore': 15,
                                                    'Gold Ore': 25,
                                                    'Diamond': 100
                                                };
                                                return sum + (values[ore] || 5) * count;
                                            }, 0)} gold
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-4 p-3 bg-gray-800 rounded text-gray-400 text-sm">
                                You haven't collected any ores yet.
                            </div>
                        )}

                        {/* Status Info */}
                        <div className="mb-4 text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Max Depth Reached:</span>
                                <span className="text-orange-400">{player.depth}m</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Health:</span>
                                <span className={player.hp < player.maxHp / 3 ? 'text-red-400' : 'text-green-400'}>
                                    {player.hp}/{player.maxHp}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Fatigue:</span>
                                <span className={player.fatigue < 20 ? 'text-orange-400' : 'text-blue-400'}>
                                    {player.fatigue}/{player.maxFatigue}
                                </span>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                            <button
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                onClick={() => {
                                    gameSoundsService.playUIClickSound();
                                    onExit();
                                }}
                            >
                                Exit Mine
                            </button>
                            <button
                                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                                onClick={() => {
                                    gameSoundsService.playUIClickSound();
                                    setShowExitConfirm(false);
                                }}
                            >
                                Keep Mining
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MiningRoguelikeDisplay;