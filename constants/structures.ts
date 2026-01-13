/**
 * constants/structures.ts - Defines the blueprints for all terrain structures.
 * This data-driven approach allows for easy expansion.
 */
import { TerrainStructure, EconomicRole } from '../types';

export interface StructureBlueprint {
    economicRole: EconomicRole;
    npcAnchor: string; // The profession this structure spawns/supports
    icon: string;
    // Base input/output goods can be defined here
    inputGoods?: string[];
    outputGoods?: string[];
}

export const STRUCTURE_BLUEPRINTS: Record<TerrainStructure['structureType'], StructureBlueprint> = {
    fortress: {
        economicRole: 'defensive',
        npcAnchor: 'soldier',
        icon: '🏰',
        inputGoods: ['FOOD', 'WEAPONS'], // Consumes these from the economy
    },
    mill: {
        economicRole: 'processing',
        npcAnchor: 'miller',
        icon: '⚙️',
        inputGoods: ['WHEAT', 'CORN', 'BARLEY'],
        outputGoods: ['FLOUR'],
    },
    mining_colony: {
        economicRole: 'extraction',
        npcAnchor: 'miner',
        icon: '⛏️',
        // outputGoods will be determined by the specific mineral deposit
    },
    factory: {
        economicRole: 'processing',
        npcAnchor: 'factory_worker',
        icon: '🏭',
        inputGoods: ['IRON_ORE', 'COPPER_ORE', 'TIN_ORE', 'GOLD_ORE', 'SILVER_ORE', 'LEAD_ORE', 'COAL', 'WOOD', 'COTTON'],
        outputGoods: ['IRON_INGOT', 'COPPER_INGOT', 'TIN_INGOT', 'GOLD_BAR', 'SILVER_INGOT', 'LEAD_BAR', 'TOOLS', 'TEXTILES'],
    },
    lumber_camp: {
        economicRole: 'extraction',
        npcAnchor: 'lumberjack',
        icon: '🪓',
        outputGoods: ['WOOD'],
    },
    fishing_hut: {
        economicRole: 'subsistence',
        npcAnchor: 'fisherman',
        icon: '🎣',
        outputGoods: ['FISH'],
    },
    farm: {
        economicRole: 'subsistence',
        npcAnchor: 'farmer',
        icon: '🌾',
        // outputGoods are determined dynamically by cropType
    },
    marketplace: {
        economicRole: 'commerce',
        npcAnchor: 'merchant',
        icon: '🏪',
    },
    government_district: {
        economicRole: 'commerce', // Represents administration/control
        npcAnchor: 'clerk',
        icon: '🏛️',
    },
    city_center: {
        economicRole: 'commerce',
        npcAnchor: 'merchant',
        icon: '🌟',
    },
    encampment: {
        economicRole: 'subsistence',
        npcAnchor: 'hunter',
        icon: '⛺',
    },
    quarry: {
        economicRole: 'extraction',
        npcAnchor: 'quarry_worker',
        icon: '⛏️',
        outputGoods: ['STONE_BLOCK']
    },
    holy_site: {
        economicRole: 'commerce', // Attracts pilgrims who spend money
        npcAnchor: 'priest',
        icon: '🙏',
        // Consumes and produces goods defined in societal profiles
    },
    palace: {
        economicRole: 'commerce', // Center of power and wealth
        npcAnchor: 'noble',
        icon: '👑',
    },
    ruin: {
        economicRole: 'subsistence', // Place for foraging/scavenging
        npcAnchor: 'explorer',
        icon: '🏺',
    },
    bridge: {
        economicRole: 'commerce', // Facilitates trade routes
        npcAnchor: 'traveler',
        icon: '🌉',
    },
    waystation: {
        economicRole: 'commerce', // Rest stop for travelers and trade caravans
        npcAnchor: 'innkeeper',
        icon: '🏨',
    },
    well: {
        economicRole: 'subsistence', // Essential water source for communities
        npcAnchor: 'water_carrier',
        icon: '⛲',
    }
};