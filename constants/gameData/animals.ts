/**
 * constants/gameData/animals.ts - Central database for animal data.
 */
import { BiomeType, ClimateType, AnimalData, CulturalZone } from '../../types';

export const ANIMAL_DATA: Record<string, AnimalData> = {
    DEER: {
        name: 'Deer', emoji: '🦌', type: 'Prey', social: 'herd', attack: 1, defense: 3, maxHealth: 10, speed: 8, strength: 5, agility: 9, perception: 9, level: 1,
        drops: [{ name: 'Venison', chance: 0.9 }, { name: 'Deer Hide', chance: 0.6 }],
        spawnBiomes: [BiomeType.FOREST, BiomeType.HILLS, BiomeType.GRASSLAND, BiomeType.RIVERBANK],
        spawnConditions: { minBiodiversity: 0.5, minSafety: 0.5, remote: true, zones: ['EUROPEAN', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'EAST_ASIAN'] },
        habitat: 'grassland', behaviorProfile: 'deer'
    },
    MOOSE: {
        name: 'Moose', emoji: '🦌', type: 'Prey', social: 'solitary', attack: 4, defense: 6, maxHealth: 40, speed: 6, strength: 12, agility: 4, perception: 7, level: 6,
        drops: [{ name: 'Venison', chance: 0.9 }, { name: 'Moose Hide', chance: 0.8 }],
        spawnBiomes: [BiomeType.FOREST, BiomeType.DENSE_FOREST, BiomeType.TUNDRA],
        spawnConditions: { climate: [ClimateType.COLD, ClimateType.TEMPERATE], remote: true, zones: ['EUROPEAN', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'EAST_ASIAN'] },
        habitat: 'forest', behaviorProfile: 'bear'
    },
    WOLF: {
        name: 'Wolf', emoji: '🐺', type: 'Predator', social: 'herd', attack: 5, defense: 2, maxHealth: 15, speed: 7, strength: 7, agility: 7, perception: 8, level: 3,
        drops: [{ name: 'Wolf Pelt', chance: 0.8 }, { name: 'Meat', chance: 0.5 }],
        spawnBiomes: [BiomeType.FOREST, BiomeType.DENSE_FOREST, BiomeType.TUNDRA, BiomeType.MOUNTAIN, BiomeType.HILLS],
        spawnConditions: { maxSafety: 0.4, remote: true, zones: ['EUROPEAN', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'EAST_ASIAN', 'MENA'] },
        habitat: 'forest', behaviorProfile: 'wolf'
    },
    BEAR: {
        name: 'Bear', emoji: '🐻', type: 'Predator', social: 'solitary', attack: 7, defense: 5, maxHealth: 30, speed: 2, strength: 10, agility: 2, perception: 4, level: 5,
        drops: [{ name: 'Bear Hide', chance: 0.8 }, { name: 'Meat', chance: 0.9 }, { name: 'Bear Claw', chance: 0.2 }],
        spawnBiomes: [BiomeType.FOREST, BiomeType.DENSE_FOREST, BiomeType.MOUNTAIN, BiomeType.RIVERBANK],
        spawnConditions: { remote: true, minBiodiversity: 0.6, zones: ['EUROPEAN', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'EAST_ASIAN'] },
        habitat: 'forest', behaviorProfile: 'bear'
    },
    FOX: {
        name: 'Fox', emoji: '🦊', type: 'Prey', social: 'solitary', attack: 2, defense: 1, maxHealth: 8, speed: 9, strength: 2, agility: 10, perception: 8, level: 2,
        drops: [{ name: 'Fox Fur', chance: 0.7 }],
        spawnBiomes: [BiomeType.FOREST, BiomeType.GRASSLAND, BiomeType.TUNDRA, BiomeType.HILLS],
        spawnConditions: { minBiodiversity: 0.4, zones: ['EUROPEAN', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'EAST_ASIAN', 'MENA'] },
        habitat: 'grassland', behaviorProfile: 'rabbit'
    },
    BOAR: {
        name: 'Boar', emoji: '🐗', type: 'Predator', social: 'herd', attack: 4, defense: 4, maxHealth: 20, speed: 7, strength: 6, agility: 4, perception: 4, level: 4,
        drops: [{ name: 'Tough Hide', chance: 0.7 }, { name: 'Boar Tusk', chance: 0.4 }],
        spawnBiomes: [BiomeType.DENSE_FOREST],
        spawnConditions: { zones: ['EUROPEAN', 'EAST_ASIAN', 'SOUTH_ASIAN'] },
        habitat: 'forest', behaviorProfile: 'bear'
    },
    LION: {
        name: 'Lion', emoji: '🦁', type: 'Predator', social: 'herd', attack: 8, defense: 4, maxHealth: 25, speed: 8, strength: 9, agility: 6, perception: 8, level: 7,
        drops: [{ name: 'Lion Pelt', chance: 0.7 }, { name: 'Meat', chance: 0.8 }],
        spawnBiomes: [BiomeType.GRASSLAND, BiomeType.SCRUB, BiomeType.STEPPE],
        spawnConditions: { climate: [ClimateType.ARID, ClimateType.SEMITROPICAL], zones: ['SUB_SAHARAN_AFRICAN', 'SOUTH_ASIAN'], regions: ['East African Rift', 'Indus Valley'] },
        habitat: 'grassland', behaviorProfile: 'wolf'
    },
    TIGER: {
        name: 'Tiger', emoji: '🐅', type: 'Predator', social: 'solitary', attack: 9, defense: 3, maxHealth: 28, speed: 7, strength: 10, agility: 7, perception: 7, level: 8,
        drops: [{ name: 'Tiger Pelt', chance: 0.7 }, { name: 'Meat', chance: 0.8 }],
        spawnBiomes: [BiomeType.FOREST, BiomeType.DENSE_FOREST, BiomeType.JUNGLE, BiomeType.WETLANDS],
        spawnConditions: { remote: true, zones: ['SOUTH_ASIAN', 'EAST_ASIAN'] },
        habitat: 'forest', behaviorProfile: 'wolf'
    },
    LEOPARD: {
        name: 'Leopard', emoji: '🐆', type: 'Predator', social: 'solitary', attack: 6, defense: 2, maxHealth: 18, speed: 9, strength: 6, agility: 9, perception: 9, level: 5,
        drops: [{ name: 'Leopard Pelt', chance: 0.6 }],
        spawnBiomes: [BiomeType.FOREST, BiomeType.JUNGLE, BiomeType.HILLS, BiomeType.MOUNTAIN, BiomeType.GRASSLAND],
        spawnConditions: { maxSafety: 0.5, zones: ['SUB_SAHARAN_AFRICAN', 'SOUTH_ASIAN', 'MENA'] },
        habitat: 'forest', behaviorProfile: 'wolf'
    },
    ELEPHANT: {
        name: 'Elephant', emoji: '🐘', type: 'Prey', social: 'herd', attack: 7, defense: 8, maxHealth: 80, speed: 3, strength: 15, agility: 2, perception: 5, level: 9,
        drops: [{ name: 'Tough Hide', chance: 0.9 }, { name: 'Ivory Tusk', chance: 0.5 }],
        spawnBiomes: [BiomeType.GRASSLAND, BiomeType.FOREST, BiomeType.JUNGLE],
        spawnConditions: { zones: ['SUB_SAHARAN_AFRICAN', 'SOUTH_ASIAN'] },
        habitat: 'grassland', behaviorProfile: 'bear'
    },
    RHINOCEROS: {
        name: 'Rhinoceros', emoji: '🦏', type: 'Prey', social: 'solitary', attack: 8, defense: 7, maxHealth: 60, speed: 4, strength: 13, agility: 3, perception: 3, level: 8,
        drops: [{ name: 'Tough Hide', chance: 0.9 }, { name: 'Rhino Horn', chance: 0.5 }],
        spawnBiomes: [BiomeType.GRASSLAND, BiomeType.SCRUB, BiomeType.WETLANDS],
        spawnConditions: { zones: ['SUB_SAHARAN_AFRICAN', 'SOUTH_ASIAN'] },
        habitat: 'grassland', behaviorProfile: 'bear'
    },
    HIPPOPOTAMUS: {
        name: 'Hippopotamus', emoji: '🦛', type: 'Predator', social: 'herd', attack: 9, defense: 6, maxHealth: 50, speed: 5, strength: 14, agility: 2, perception: 4, level: 8,
        drops: [{ name: 'Tough Hide', chance: 0.8 }, { name: 'Hippo Tooth', chance: 0.6 }],
        spawnBiomes: [BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.WETLANDS, BiomeType.FRESHWATER_LAKE],
        spawnConditions: { zones: ['SUB_SAHARAN_AFRICAN'] },
        habitat: 'aquatic', behaviorProfile: 'bear'
    },
    GIRAFFE: {
        name: 'Giraffe', emoji: '🦒', type: 'Prey', social: 'herd', attack: 2, defense: 4, maxHealth: 35, speed: 7, strength: 8, agility: 5, perception: 10, level: 4,
        drops: [{ name: 'Tough Hide', chance: 0.7 }],
        spawnBiomes: [BiomeType.GRASSLAND, BiomeType.STEPPE, BiomeType.SCRUB],
        spawnConditions: { zones: ['SUB_SAHARAN_AFRICAN'] },
        habitat: 'grassland', behaviorProfile: 'deer'
    },
    ZEBRA: {
        name: 'Zebra', emoji: '🦓', type: 'Prey', social: 'herd', attack: 1, defense: 2, maxHealth: 12, speed: 9, strength: 4, agility: 8, perception: 8, level: 2,
        drops: [{ name: 'Zebra Hide', chance: 0.8 }],
        spawnBiomes: [BiomeType.GRASSLAND, BiomeType.STEPPE],
        spawnConditions: { zones: ['SUB_SAHARAN_AFRICAN'] },
        habitat: 'grassland', behaviorProfile: 'deer'
    },
    GORILLA: {
        name: 'Gorilla', emoji: '🦍', type: 'Prey', social: 'herd', attack: 6, defense: 6, maxHealth: 45, speed: 4, strength: 13, agility: 5, perception: 6, level: 7,
        drops: [{ name: 'Tough Hide', chance: 0.6 }],
        spawnBiomes: [BiomeType.JUNGLE, BiomeType.DENSE_FOREST, BiomeType.MOUNTAIN],
        spawnConditions: { remote: true, zones: ['SUB_SAHARAN_AFRICAN'], regions: ['Lower Guinea and Congo Basin', 'East African Rift'] },
        habitat: 'forest', behaviorProfile: 'bear'
    },
    CROCODILE: {
        name: 'Crocodile', emoji: '🐊', type: 'Predator', social: 'solitary', attack: 7, defense: 5, maxHealth: 22, speed: 6, strength: 8, agility: 4, perception: 7, level: 6,
        drops: [{ name: 'Crocodile Skin', chance: 0.8 }],
        spawnBiomes: [BiomeType.RIVER, BiomeType.WETLANDS, BiomeType.MANGROVE],
        spawnConditions: { climate: [ClimateType.TROPICAL, ClimateType.SEMITROPICAL], zones: ['SUB_SAHARAN_AFRICAN', 'SOUTH_ASIAN', 'OCEANIA', 'SOUTH_AMERICAN'] },
        habitat: 'aquatic', behaviorProfile: 'wolf'
    },
    BISON: {
        name: 'Bison', emoji: '🐃', type: 'Prey', social: 'herd', attack: 5, defense: 7, maxHealth: 55, speed: 5, strength: 14, agility: 3, perception: 5, level: 7,
        drops: [{ name: 'Bison Hide', chance: 0.9 }, { name: 'Meat', chance: 0.9 }],
        spawnBiomes: [BiomeType.GRASSLAND, BiomeType.STEPPE],
        spawnConditions: { zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'] },
        habitat: 'grassland', behaviorProfile: 'bear'
    },
    KANGAROO: {
        name: 'Kangaroo', emoji: '🦘', type: 'Prey', social: 'herd', attack: 3, defense: 3, maxHealth: 15, speed: 8, strength: 5, agility: 9, perception: 7, level: 3,
        drops: [{ name: 'Kangaroo Hide', chance: 0.7 }],
        spawnBiomes: [BiomeType.GRASSLAND, BiomeType.SCRUB],
        spawnConditions: { zones: ['OCEANIA'] },
        habitat: 'grassland', behaviorProfile: 'deer'
    },
    KOALA: {
        name: 'Koala', emoji: '🐨', type: 'Prey', social: 'solitary', attack: 1, defense: 2, maxHealth: 8, speed: 1, strength: 2, agility: 3, perception: 4, level: 1,
        drops: [],
        spawnBiomes: [BiomeType.FOREST],
        spawnConditions: { zones: ['OCEANIA'] },
        habitat: 'forest', behaviorProfile: 'rabbit'
    },
    PANDA: {
        name: 'Panda', emoji: '🐼', type: 'Prey', social: 'solitary', attack: 2, defense: 5, maxHealth: 25, speed: 2, strength: 8, agility: 3, perception: 4, level: 4,
        drops: [],
        spawnBiomes: [BiomeType.DENSE_FOREST, BiomeType.MOUNTAIN],
        spawnConditions: { remote: true, zones: ['EAST_ASIAN'], regions: ['West China and Tibet'] },
        habitat: 'forest', behaviorProfile: 'bear'
    },
    WILD_HORSE: {
        name: 'Wild Horse', emoji: '🐎', type: 'Prey', social: 'herd', attack: 2, defense: 3, maxHealth: 18, speed: 9, strength: 6, agility: 8, perception: 8, level: 3,
        drops: [{ name: 'Horse Hide', chance: 0.7 }],
        spawnBiomes: [BiomeType.STEPPE, BiomeType.GRASSLAND],
        spawnConditions: { 
            // Horses were native to Eurasia, reintroduced to Americas post-1492
            zones: ['EAST_ASIAN', 'EUROPEAN', 'MENA']
        },
        habitat: 'grassland', behaviorProfile: 'deer'
    },
    GOAT: {
        name: 'Goat', emoji: '🐐', type: 'Domestic', social: 'herd', attack: 1, defense: 1, maxHealth: 8, speed: 6, strength: 3, agility: 7, perception: 6, level: 1,
        drops: [{ name: 'Goat Hide', chance: 0.8 }, { name: 'Meat', chance: 0.9 }],
        spawnBiomes: [BiomeType.HILLS, BiomeType.MOUNTAIN, BiomeType.FARMLAND],
        spawnConditions: { nearSettlement: true, zones: ['EUROPEAN', 'MENA', 'SOUTH_ASIAN'] },
        habitat: 'mountain', behaviorProfile: 'deer'
    },
    EAGLE: {
        name: 'Eagle', emoji: '🦅', type: 'Ambient', social: 'solitary', attack: 3, defense: 1, maxHealth: 5, speed: 10, strength: 4, agility: 9, perception: 10, level: 3,
        drops: [{ name: 'Eagle Feather', chance: 0.9 }],
        spawnBiomes: [BiomeType.MOUNTAIN, BiomeType.HIGH_PEAK, BiomeType.CLIFF],
        spawnConditions: { minSacrality: 0.6 },
        habitat: 'mountain', behaviorProfile: 'wolf'
    },

    COW: {
        name: 'Cow', emoji: '🐄', type: 'Domestic', social: 'herd', attack: 1, defense: 2, maxHealth: 15, speed: 1, strength: 2, agility: 1, perception: 1, level: 1,
        drops: [{ name: 'Beef', chance: 1.0 }, { name: 'Cow Hide', chance: 0.8 }],
        spawnBiomes: [BiomeType.FARMLAND, BiomeType.GRASSLAND],
        spawnConditions: { 
            nearSettlement: true,
            // Cows were introduced to Americas post-1492
            zones: ['EUROPEAN', 'MENA', 'SOUTH_ASIAN', 'EAST_ASIAN', 'SUB_SAHARAN_AFRICAN', 'NORTH_AMERICAN_COLONIAL', 'SOUTH_AMERICAN_COLONIAL']
        },
        habitat: 'grassland', behaviorProfile: 'deer'
    },
    CHICKEN: {
        name: 'Chicken', emoji: '🐔', type: 'Domestic', social: 'herd', attack: 1, defense: 0, maxHealth: 3, speed: 6, strength: 1, agility: 4, perception: 2, level: 1,
        drops: [{ name: 'Poultry', chance: 1.0 }, { name: 'Feather', chance: 0.9 }],
        spawnBiomes: [BiomeType.FARMLAND, BiomeType.HAMLET],
        spawnConditions: { nearSettlement: true },
        habitat: 'grassland', behaviorProfile: 'rabbit'
    },
    CAMEL: {
        name: 'Camel', emoji: '🐪', type: 'Domestic', social: 'herd', attack: 2, defense: 3, maxHealth: 20, speed: 6, strength: 7, agility: 5, perception: 5, level: 2,
        drops: [{ name: 'Tough Hide', chance: 0.6 }],
        spawnBiomes: [BiomeType.DESERT],
        spawnConditions: { climate: [ClimateType.ARID, ClimateType.SEMITROPICAL], zones: ['MENA', 'EAST_ASIAN', 'SUB_SAHARAN_AFRICAN'] },
        habitat: 'desert', behaviorProfile: 'deer'
    },

    SNAKE: {
        name: 'Snake', emoji: '🐍', type: 'Predator', social: 'solitary', attack: 3, defense: 1, maxHealth: 6, speed: 5, strength: 2, agility: 8, perception: 6, level: 2,
        drops: [{ name: 'Snake Skin', chance: 0.6 }, { name: 'Venom', chance: 0.3 }],
        spawnBiomes: [BiomeType.DESERT, BiomeType.JUNGLE, BiomeType.WETLANDS, BiomeType.RUINS],
        spawnConditions: { minBiodiversity: 0.7 },
        habitat: 'desert', behaviorProfile: 'wolf'
    },
    MONKEY: {
        name: 'Monkey', emoji: '🐒', type: 'Ambient', social: 'herd', attack: 1, defense: 2, maxHealth: 5, speed: 8, strength: 3, agility: 9, perception: 7, level: 1,
        drops: [{ name: 'Strange Fruit', chance: 0.2 }],
        spawnBiomes: [BiomeType.JUNGLE],
        spawnConditions: { climate: [ClimateType.TROPICAL, ClimateType.SEMITROPICAL], minBiodiversity: 0.7, zones: ['SOUTH_ASIAN', 'EAST_ASIAN', 'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN'] },
        habitat: 'forest', behaviorProfile: 'rabbit'
    },
    FISH: {
        name: 'Fish', emoji: '🐟', type: 'Ambient', social: 'herd', attack: 0, defense: 0, maxHealth: 1, speed: 5, strength: 1, agility: 6, perception: 3, level: 1,
        drops: [{ name: 'FISH_MEAT', chance: 1.0 }],
        spawnBiomes: [BiomeType.SHALLOW_OCEAN, BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.FRESHWATER_LAKE, BiomeType.ESTUARY],
        spawnConditions: {},
        habitat: 'aquatic', behaviorProfile: 'rabbit'
    },
    JELLYFISH: {
        name: 'Jellyfish', emoji: '🪼', type: 'Ambient', social: 'herd', attack: 1, defense: 1, maxHealth: 2, speed: 2, strength: 1, agility: 2, perception: 2, level: 1,
        drops: [{ name: 'BIOLUMINESCENT_GOOP', chance: 0.75 }],
        spawnBiomes: [BiomeType.SHALLOW_OCEAN],
        spawnConditions: {},
        habitat: 'aquatic', behaviorProfile: 'rabbit'
    },
    WHALE: {
        name: 'Whale', emoji: '🐋', type: 'Ambient', social: 'solitary', attack: 0, defense: 20, maxHealth: 200, speed: 7, strength: 20, agility: 3, perception: 6, level: 10,
        drops: [{ name: 'WHALE_BLUBBER', chance: 1.0 }, { name: 'AMBERGRIS', chance: 0.05 }],
        spawnBiomes: [BiomeType.DEEP_OCEAN],
        spawnConditions: { climate: [ClimateType.COLD, ClimateType.TEMPERATE] },
        habitat: 'aquatic', behaviorProfile: 'deer'
    },
    FLOTSAM: {
        name: 'Flotsam', emoji: '📦', type: 'Ambient', social: 'solitary', attack: 0, defense: 0, maxHealth: 1, speed: 0, strength: 0, agility: 0, perception: 1, level: 1,
        drops: [
            { name: 'STICK', chance: 0.8 },
            { name: 'ROPE', chance: 0.3 },
            { name: 'COPPER_COINS', chance: 0.1 },
            { name: 'HEALING_POTION', chance: 0.05 }
        ],
        spawnBiomes: [BiomeType.SHALLOW_OCEAN, BiomeType.DEEP_OCEAN],
        spawnConditions: { minBiodiversity: 0.0, maxBiodiversity: 0.2 },
        habitat: 'aquatic', behaviorProfile: 'rabbit'
    },
    FLAMINGO: {
        name: 'Flamingo', emoji: '🦩', type: 'Ambient', social: 'herd', attack: 0, defense: 1, maxHealth: 3, speed: 4, strength: 1, agility: 5, perception: 6, level: 1,
        drops: [{ name: 'Pink Feather', chance: 0.5 }],
        spawnBiomes: [BiomeType.SALT_FLATS, BiomeType.MANGROVE],
        spawnConditions: { 
            climate: [ClimateType.TROPICAL, ClimateType.SEMITROPICAL, ClimateType.ARID],
            zones: ['SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN', 'MENA', 'NORTH_AMERICAN_COLONIAL'] 
        },
        habitat: 'wetland', behaviorProfile: 'rabbit'
    },
    
    // New region-specific animals
    LLAMA: {
        name: 'Llama', emoji: '🦙', type: 'Prey', social: 'herd', attack: 2, defense: 3, maxHealth: 14, speed: 5, strength: 5, agility: 6, perception: 7, level: 2,
        drops: [{ name: 'Llama Wool', chance: 0.8 }, { name: 'Meat', chance: 0.7 }],
        spawnBiomes: [BiomeType.MOUNTAIN, BiomeType.HILLS, BiomeType.GRASSLAND],
        spawnConditions: { zones: ['SOUTH_AMERICAN'], minAltitude: 0.3 },
        habitat: 'mountain', behaviorProfile: 'deer'
    },
    PENGUIN: {
        name: 'Penguin', emoji: '🐧', type: 'Ambient', social: 'herd', attack: 0, defense: 2, maxHealth: 5, speed: 2, strength: 2, agility: 3, perception: 5, level: 1,
        drops: [{ name: 'Fish Meat', chance: 0.4 }],
        spawnBiomes: [BiomeType.BEACH, BiomeType.SHALLOW_OCEAN],
        spawnConditions: { climate: [ClimateType.COLD], zones: ['SOUTH_AMERICAN', 'OCEANIA'] },
        habitat: 'aquatic', behaviorProfile: 'rabbit'
    },
    RABBIT: {
        name: 'Rabbit', emoji: '🐇', type: 'Prey', social: 'solitary', attack: 0, defense: 1, maxHealth: 4, speed: 9, strength: 1, agility: 10, perception: 8, level: 1,
        drops: [{ name: 'Rabbit Fur', chance: 0.7 }, { name: 'Meat', chance: 0.8 }],
        spawnBiomes: [BiomeType.GRASSLAND, BiomeType.FOREST, BiomeType.SCRUB],
        spawnConditions: { minBiodiversity: 0.3, zones: ['EUROPEAN', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'EAST_ASIAN'] },
        habitat: 'grassland', behaviorProfile: 'rabbit'
    },
    SQUIRREL: {
        name: 'Squirrel', emoji: '🐿️', type: 'Ambient', social: 'solitary', attack: 0, defense: 1, maxHealth: 2, speed: 8, strength: 1, agility: 9, perception: 7, level: 1,
        drops: [{ name: 'Acorn', chance: 0.3 }],
        spawnBiomes: [BiomeType.FOREST, BiomeType.DENSE_FOREST],
        spawnConditions: { zones: ['EUROPEAN', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'EAST_ASIAN'] },
        habitat: 'forest', behaviorProfile: 'rabbit'
    },
    HEDGEHOG: {
        name: 'Hedgehog', emoji: '🦔', type: 'Ambient', social: 'solitary', attack: 0, defense: 3, maxHealth: 3, speed: 3, strength: 1, agility: 4, perception: 5, level: 1,
        drops: [],
        spawnBiomes: [BiomeType.SCRUB],
        spawnConditions: { zones: ['EUROPEAN', 'MENA'] },
        habitat: 'forest', behaviorProfile: 'rabbit'
    },
    BAT: {
        name: 'Bat', emoji: '🦇', type: 'Ambient', social: 'herd', attack: 0, defense: 1, maxHealth: 2, speed: 8, strength: 1, agility: 10, perception: 6, level: 1,
        drops: [{ name: 'Bat Guano', chance: 0.2 }],
        spawnBiomes: [BiomeType.RUINS, BiomeType.MOUNTAIN, BiomeType.CLIFF],
        spawnConditions: { minSacrality: 0.4 },
        habitat: 'mountain', behaviorProfile: 'rabbit'
    },
    OTTER: {
        name: 'Otter', emoji: '🦦', type: 'Prey', social: 'herd', attack: 1, defense: 2, maxHealth: 6, speed: 6, strength: 2, agility: 8, perception: 7, level: 1,
        drops: [{ name: 'Otter Pelt', chance: 0.6 }],
        spawnBiomes: [BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.WETLANDS],
        spawnConditions: { zones: ['EUROPEAN', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'EAST_ASIAN'] },
        habitat: 'aquatic', behaviorProfile: 'rabbit'
    },
    PEACOCK: {
        name: 'Peacock', emoji: '🦚', type: 'Ambient', social: 'solitary', attack: 1, defense: 1, maxHealth: 4, speed: 5, strength: 2, agility: 6, perception: 8, level: 1,
        drops: [{ name: 'Peacock Feather', chance: 0.7 }],
        spawnBiomes: [BiomeType.FOREST, BiomeType.PALACE],
        spawnConditions: { zones: ['SOUTH_ASIAN'], minSacrality: 0.5 },
        habitat: 'forest', behaviorProfile: 'rabbit'
    },
    TURKEY: {
        name: 'Turkey', emoji: '🦃', type: 'Prey', social: 'herd', attack: 1, defense: 2, maxHealth: 6, speed: 5, strength: 3, agility: 5, perception: 6, level: 1,
        drops: [{ name: 'Poultry', chance: 0.9 }, { name: 'Feather', chance: 0.7 }],
        spawnBiomes: [BiomeType.FOREST, BiomeType.GRASSLAND],
        spawnConditions: { zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'] },
        habitat: 'forest', behaviorProfile: 'deer'
    },
    PARROT: {
        name: 'Parrot', emoji: '🦜', type: 'Ambient', social: 'herd', attack: 0, defense: 1, maxHealth: 3, speed: 7, strength: 1, agility: 8, perception: 7, level: 1,
        drops: [{ name: 'Colorful Feather', chance: 0.6 }],
        spawnBiomes: [BiomeType.JUNGLE, BiomeType.DENSE_FOREST],
        spawnConditions: { climate: [ClimateType.TROPICAL, ClimateType.SEMITROPICAL], zones: ['SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN', 'OCEANIA'] },
        habitat: 'forest', behaviorProfile: 'rabbit'
    },
    SLOTH: {
        name: 'Sloth', emoji: '🦥', type: 'Ambient', social: 'solitary', attack: 0, defense: 2, maxHealth: 5, speed: 1, strength: 2, agility: 2, perception: 3, level: 1,
        drops: [],
        spawnBiomes: [BiomeType.JUNGLE, BiomeType.DENSE_FOREST],
        spawnConditions: { climate: [ClimateType.TROPICAL], zones: ['SOUTH_AMERICAN'], remote: true },
        habitat: 'forest', behaviorProfile: 'rabbit'
    },
    BADGER: {
        name: 'Badger', emoji: '🦡', type: 'Prey', social: 'solitary', attack: 3, defense: 3, maxHealth: 10, speed: 4, strength: 4, agility: 5, perception: 6, level: 2,
        drops: [{ name: 'Badger Hide', chance: 0.6 }],
        spawnBiomes: [BiomeType.FOREST, BiomeType.HILLS, BiomeType.GRASSLAND],
        spawnConditions: { zones: ['EUROPEAN', 'NORTH_AMERICAN_PRE_COLUMBIAN'] },
        habitat: 'forest', behaviorProfile: 'wolf'
    },
 
    LOBSTER: {
        name: 'Lobster', emoji: '🦞', type: 'Ambient', social: 'solitary', attack: 1, defense: 3, maxHealth: 3, speed: 3, strength: 2, agility: 4, perception: 3, level: 1,
        drops: [{ name: 'Lobster Meat', chance: 0.9 }],
        spawnBiomes: [BiomeType.SHALLOW_OCEAN, BiomeType.REEF],
        spawnConditions: { climate: [ClimateType.COLD, ClimateType.TEMPERATE] },
        habitat: 'aquatic', behaviorProfile: 'rabbit'
    },
    OCTOPUS: {
        name: 'Octopus', emoji: '🐙', type: 'Prey', social: 'solitary', attack: 2, defense: 2, maxHealth: 8, speed: 5, strength: 3, agility: 7, perception: 8, level: 2,
        drops: [{ name: 'Ink Sac', chance: 0.6 }],
        spawnBiomes: [BiomeType.SHALLOW_OCEAN, BiomeType.REEF],
        spawnConditions: { zones: ['EUROPEAN', 'EAST_ASIAN', 'OCEANIA'] },
        habitat: 'aquatic', behaviorProfile: 'wolf'
    },

    BUTTERFLY: {
        name: 'Butterfly', emoji: '🦋', type: 'Ambient', social: 'solitary', attack: 0, defense: 0, maxHealth: 1, speed: 4, strength: 0, agility: 9, perception: 5, level: 1,
        drops: [],
        spawnBiomes: [BiomeType.GRASSLAND, BiomeType.FOREST],
        spawnConditions: { minBiodiversity: 0.9, climate: [ClimateType.TEMPERATE, ClimateType.TROPICAL, ClimateType.SEMITROPICAL] },
        habitat: 'grassland', behaviorProfile: 'rabbit'
    }
};