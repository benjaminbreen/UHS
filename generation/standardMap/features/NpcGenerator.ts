/**
 * generation/standardMap/features/NpcGenerator.ts - Enhanced NPC generation with portrait integration
 */
import { Tile, ClimateType, NpcEntity, HistoricalEra, MapData, TerrainStructure, BiomeType, Appearance, Item, EquipmentSlot, ClothingPiece, Point, SocietalProfile, WealthLevel } from '../../../types';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES, CulturalZone, STRUCTURE_BLUEPRINTS, PROFESSIONS, ProfessionDefinition, FACTION_DATA, GEOGRAPHICAL_DATA, STARTING_PACKAGES, SOCIETAL_PROFILES } from '../../../constants/index';
import { ValueNoise } from '../../../utils/noise';
import { generateBaseProfile, determineSocialRole, generateNpcName, assignBeliefs, generateCompleteOutfit } from '../../common/npcUtils';
import { parseDateString } from '../../../utils/dateUtils';
import { generateNpcDescriptions } from '../../../services/npcDescriptionService';
import { mapLocationToCulture } from '../../../utils/mapUtils';
import { generateNpcFamilyAndLifeEvents, findNpcFriends } from '../../../services/socialService';
import { createItemInstance } from '../../../utils/inventoryUtils';
import { detectCitiesForArea } from '../../../utils/cityDetectionUtils';
import { generateCulturalAccessory } from '../../../services/culturalAccessoryService';

/**
 * Generate historically appropriate legs/trousers equipment
 */
function generateLegsEquipment(era: HistoricalEra | undefined, culturalZone: CulturalZone, role: string, isWealthy: boolean, equippedItems: any, colorHex?: string) {
    let legsChance = 0.60; // Base 60% chance for legs coverage
    
    // Era-based adjustments
    if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN' || era === 'INDUSTRIAL' || era === 'MODERN') {
        legsChance = 0.80; // Higher chance in later eras
    }
    
    // Cultural adjustments
    if (culturalZone === 'EUROPEAN' || culturalZone === 'EAST_ASIAN') {
        legsChance += 0.15; // More leg covering in these cultures
    } else if (culturalZone === 'MENA') {
        legsChance += 0.10; // Loose trousers common
    } else if (culturalZone === 'OCEANIA' || culturalZone === 'SUB_SAHARAN_AFRICAN') {
        legsChance -= 0.20; // Less leg covering in tropical climates
    }
    
    // Role adjustments
    const roleLower = role.toLowerCase();
    if (roleLower.includes('soldier') || roleLower.includes('guard') || roleLower.includes('knight')) {
        legsChance += 0.25; // Military needs leg protection
    } else if (roleLower.includes('merchant') || roleLower.includes('noble')) {
        legsChance += 0.15; // Status roles more likely to have full dress
    } else if (roleLower.includes('farmer') || roleLower.includes('peasant')) {
        legsChance += 0.10; // Working clothes include trousers
    }
    
    if (Math.random() < Math.min(legsChance, 0.95)) {
        let legsId = 'SIMPLE_TROUSERS';
        
        if (isWealthy) {
            const wealthyLegs = ['SILK_TROUSERS', 'FINE_BREECHES', 'NOBLE_LEGGINGS', 'VELVET_PANTS'];
            legsId = wealthyLegs[Math.floor(Math.random() * wealthyLegs.length)];
        } else if (roleLower.includes('soldier') || roleLower.includes('guard')) {
            const militaryLegs = ['CHAINMAIL_LEGGINGS', 'LEATHER_GREAVES', 'PADDED_LEGGINGS'];
            legsId = militaryLegs[Math.floor(Math.random() * militaryLegs.length)];
        } else if (culturalZone === 'MENA') {
            legsId = 'LOOSE_TROUSERS';
        } else if (culturalZone === 'EAST_ASIAN') {
            legsId = 'SILK_TROUSERS';
        }
        
        const legsItem = createItemInstance(legsId);
        if (legsItem) {
            equippedItems.legs = legsItem;
        }
    }
}

/**
 * Generate profession-appropriate cloaks
 */
function generateCloakEquipment(era: HistoricalEra | undefined, culturalZone: CulturalZone, role: string, isWealthy: boolean, equippedItems: any, colorHex?: string) {
    let cloakChance = 0.25; // Base 25% chance
    
    // Era adjustments - cloaks more common in earlier eras
    if (era === 'MEDIEVAL' || era === 'ANTIQUITY') {
        cloakChance = 0.50;
    } else if (era === 'RENAISSANCE_EARLY_MODERN') {
        cloakChance = 0.35;
    }
    
    // Cultural adjustments
    if (culturalZone === 'EUROPEAN') {
        cloakChance += 0.20; // Cloaks very common in medieval Europe
    } else if (culturalZone === 'MENA') {
        cloakChance += 0.15; // Desert robes and cloaks common
    } else if (culturalZone === 'OCEANIA' || culturalZone === 'SUB_SAHARAN_AFRICAN') {
        cloakChance -= 0.10; // Less need in warm climates
    }
    
    // Role adjustments
    const roleLower = role.toLowerCase();
    if (roleLower.includes('noble') || roleLower.includes('lord') || roleLower.includes('lady')) {
        cloakChance += 0.30; // Nobles love cloaks for status
    } else if (roleLower.includes('priest') || roleLower.includes('monk') || roleLower.includes('cleric')) {
        cloakChance += 0.25; // Religious robes/cloaks
    } else if (roleLower.includes('merchant') || roleLower.includes('traveler')) {
        cloakChance += 0.20; // Travel cloaks
    } else if (roleLower.includes('wizard') || roleLower.includes('scholar')) {
        cloakChance += 0.25; // Academic robes
    } else if (roleLower.includes('guard') || roleLower.includes('soldier')) {
        cloakChance += 0.15; // Military cloaks
    }
    
    if (Math.random() < Math.min(cloakChance, 0.90)) {
        let cloakId = 'SIMPLE_CLOAK';
        
        if (isWealthy) {
            const wealthyCloaks = ['SILK_CLOAK', 'VELVET_CLOAK', 'FUR_CLOAK', 'NOBLE_CAPE'];
            cloakId = wealthyCloaks[Math.floor(Math.random() * wealthyCloaks.length)];
        } else if (roleLower.includes('priest') || roleLower.includes('monk')) {
            const religiousCloaks = ['MONK_ROBE', 'PRIEST_VESTMENTS', 'SIMPLE_HABIT'];
            cloakId = religiousCloaks[Math.floor(Math.random() * religiousCloaks.length)];
        } else if (roleLower.includes('noble')) {
            const nobleCloaks = ['NOBLE_CAPE', 'HERALDIC_CLOAK', 'COURT_MANTLE'];
            cloakId = nobleCloaks[Math.floor(Math.random() * nobleCloaks.length)];
        } else if (culturalZone === 'MENA') {
            cloakId = 'DESERT_ROBE';
        }
        
        const cloakItem = createItemInstance(cloakId);
        if (cloakItem) {
            equippedItems.cloak = cloakItem;
        }
    }
}

/**
 * Generate profession-appropriate offhand items
 */
function generateOffhandEquipment(era: HistoricalEra | undefined, culturalZone: CulturalZone, role: string, isWealthy: boolean, equippedItems: any) {
    let offhandChance = 0.15; // Base 15% chance
    
    const roleLower = role.toLowerCase();
    
    // High chance for specific professions that need offhand items
    if (roleLower.includes('guard') || roleLower.includes('soldier') || roleLower.includes('knight')) {
        offhandChance = 0.70; // Military almost always has shields
    } else if (roleLower.includes('scholar') || roleLower.includes('scribe') || roleLower.includes('clerk')) {
        offhandChance = 0.60; // Scholars carry books/scrolls
    } else if (roleLower.includes('priest') || roleLower.includes('cleric') || roleLower.includes('monk')) {
        offhandChance = 0.50; // Religious symbols/books
    } else if (roleLower.includes('merchant') || roleLower.includes('trader')) {
        offhandChance = 0.40; // Ledgers, scales, samples
    } else if (roleLower.includes('noble') || roleLower.includes('lord')) {
        offhandChance = 0.35; // Status symbols
    } else if (roleLower.includes('farmer') || roleLower.includes('peasant')) {
        offhandChance = 0.25; // Tools, baskets
    }
    
    if (Math.random() < offhandChance) {
        let offhandId = 'WOODEN_SHIELD';
        
        if (roleLower.includes('guard') || roleLower.includes('soldier')) {
            const militaryOffhand = ['IRON_SHIELD', 'WOODEN_SHIELD', 'BUCKLER', 'KITE_SHIELD'];
            offhandId = militaryOffhand[Math.floor(Math.random() * militaryOffhand.length)];
        } else if (roleLower.includes('knight')) {
            const knightOffhand = ['HERALDIC_SHIELD', 'STEEL_SHIELD', 'KITE_SHIELD'];
            offhandId = knightOffhand[Math.floor(Math.random() * knightOffhand.length)];
        } else if (roleLower.includes('scholar') || roleLower.includes('scribe')) {
            const scholarOffhand = ['SCROLL_CASE', 'LEATHER_TOME', 'WRITING_SLATE'];
            offhandId = scholarOffhand[Math.floor(Math.random() * scholarOffhand.length)];
        } else if (roleLower.includes('priest') || roleLower.includes('cleric')) {
            const religiousOffhand = ['HOLY_SYMBOL', 'PRAYER_BOOK', 'CEREMONIAL_CHALICE'];
            offhandId = religiousOffhand[Math.floor(Math.random() * religiousOffhand.length)];
        } else if (roleLower.includes('merchant')) {
            const merchantOffhand = ['MERCHANT_LEDGER', 'COIN_PURSE', 'SAMPLE_CASE'];
            offhandId = merchantOffhand[Math.floor(Math.random() * merchantOffhand.length)];
        } else if (roleLower.includes('noble')) {
            const nobleOffhand = ['IVORY_FAN', 'SILK_HANDKERCHIEF', 'JEWELED_GOBLET'];
            offhandId = nobleOffhand[Math.floor(Math.random() * nobleOffhand.length)];
        } else if (roleLower.includes('farmer')) {
            const farmerOffhand = ['WICKER_BASKET', 'SEED_POUCH', 'WATER_GOURD'];
            offhandId = farmerOffhand[Math.floor(Math.random() * farmerOffhand.length)];
        }
        
        const offhandItem = createItemInstance(offhandId);
        if (offhandItem) {
            equippedItems.off_hand = offhandItem;
        }
    }
}

/**
 * Calculate accessory chance based on cultural universality
 */
function calculateAccessoryChance(culturalZone: CulturalZone, era: HistoricalEra | undefined, role: string): number {
    // Base chance varies by culture - some cultures have universal tattoo/marking traditions
    let baseChance = 0.30; // Default 30%
    
    // Cultures with near-universal tattoo/marking traditions
    if (culturalZone === 'OCEANIA') {
        baseChance = 1.0; // Everyone in Polynesian/Maori culture has tattoos
    } else if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
        baseChance = 0.85; // Very common tattoos and face paint
    } else if (culturalZone === 'SUB_SAHARAN_AFRICAN') {
        baseChance = 0.80; // Scarification, tattoos, and ornaments very common
    } else if (culturalZone === 'SOUTH_AMERICAN') {
        baseChance = 0.75; // Body modifications common in many cultures
    } else if (culturalZone === 'SOUTH_ASIAN') {
        baseChance = 0.70; // Bindis, nose rings, henna very common especially for women
    } else if (culturalZone === 'MENA') {
        baseChance = 0.60; // Kohl, henna, tattoos common
    } else if (culturalZone === 'EAST_ASIAN') {
        baseChance = 0.45; // Hair ornaments, some cultural markings
    } else if (culturalZone === 'EUROPEAN') {
        baseChance = 0.35; // Lower base rate, more jewelry than markings
    }
    
    // Role modifiers
    const roleLower = role.toLowerCase();
    if (roleLower.includes('shaman') || roleLower.includes('priest') || roleLower.includes('healer')) {
        baseChance += 0.20; // Religious/spiritual roles more likely to have markings
    } else if (roleLower.includes('warrior') || roleLower.includes('hunter')) {
        baseChance += 0.15; // Warriors often have tattoos/war paint
    } else if (roleLower.includes('noble') || roleLower.includes('chief')) {
        baseChance += 0.10; // High status individuals more likely to have ornate accessories
    }
    
    // Era modifiers
    if (era === 'PREHISTORIC') {
        baseChance += 0.10; // More body modification in prehistoric times
    }
    
    return Math.min(baseChance, 0.98); // Cap at 98%
}

/**
 * Add a quality adjective to amulet/jewelry names based on privilege level
 */
function addQualityAdjective(itemName: string, privilege: number): string {
    // Skip if name already has an adjective
    if (itemName.toLowerCase().includes('legendary') || 
        itemName.toLowerCase().includes('ornate') ||
        itemName.toLowerCase().includes('polished') ||
        itemName.toLowerCase().includes('beautiful')) {
        return itemName;
    }
    
    const qualityAdjectives = {
        poor: ['Battered', 'Worn', 'Simple', 'Crude', 'Plain', 'Humble', 'Weathered'],
        common: ['Well-made', 'Sturdy', 'Decent', 'Solid', 'Reliable', 'Functional'],
        wealthy: ['Fine', 'Polished', 'Elegant', 'Beautiful', 'Ornate', 'Exquisite', 'Masterful'],
        legendary: ['Legendary', 'Ancient', 'Sacred', 'Blessed', 'Magnificent', 'Divine']
    };
    
    let adjectives: string[];
    if (privilege < 0.2) {
        adjectives = qualityAdjectives.poor;
    } else if (privilege < 0.6) {
        adjectives = qualityAdjectives.common;
    } else if (privilege < 0.9) {
        adjectives = qualityAdjectives.wealthy;
    } else {
        adjectives = qualityAdjectives.legendary;
    }
    
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    return `${randomAdjective} ${itemName}`;
}
import { factoryEconomyService } from '../../../services/factoryEconomyService';
import { factoryNpcBehaviorService } from '../../../services/factoryNpcBehaviors';
import { getFactoryType } from '../../../constants/gameData/factoryTypes';
import { holySiteEconomyService } from '../../../services/holySiteEconomyService';
import { getClergyRoles } from '../../../constants/characterData/religionClergyRoles';
import DiseaseService from '../../../services/diseaseService';
import { AttributeBadgeService } from '../../../services/attributeBadgeService';


let standardNpcIdCounter = 0;

interface NpcGenerationStats {
    attempted: number;
    successful: number;
    failed: number;
    byWealth: Record<string, number>;
    byProfession: Record<string, number>;
    byCulture: Record<string, number>;
}

function createNpc(
    x: number,
    y: number,
    context: { era: HistoricalEra, culturalZone: CulturalZone, region: string, year: number },
    noise: ValueNoise,
    statsTracker: NpcGenerationStats,
    structure: TerrainStructure | null = null,
    preferredRoleOverride?: string
): NpcEntity | null {
    try {
        statsTracker.attempted++;
        const id = `npc-std-${standardNpcIdCounter++}`;
        const baseProfile = generateBaseProfile(noise, context);
        if (!baseProfile) return null;

        const roleToDetermine = preferredRoleOverride || structure?.npcAnchor;

        const { socialClass, role, emoji, nameKey } = determineSocialRole(
            baseProfile, 
            { 
                era: context.era, 
                culturalZone: context.culturalZone,
                region: context.region,
                citySize: structure?.citySize
            }, 
            roleToDetermine,
            structure?.type
        );
        if (!role) {
            statsTracker.failed++;
            return null;
        }

        // Constrain wealth level based on social class for realism
        // Map all social class types to appropriate wealth levels
        const socialClassToWealthLevel = (socialClass: string, noise: ValueNoise) => {
            const lowerClass = socialClass.toLowerCase();
            
            // Working class variants
            if (lowerClass.includes('working') || lowerClass.includes('laborer') || 
                lowerClass.includes('worker') || lowerClass === 'working_poor') {
                return noise.random() > 0.8 ? 'modest' : 'poor';
            }
            
            // Commoners and peasants
            if (socialClass === 'COMMONER' || lowerClass.includes('peasant')) {
                return noise.random() > 0.7 ? 'modest' : 'poor';
            }
            
            // Artisans, merchants, skilled workers
            if (socialClass === 'ARTISAN' || socialClass === 'MERCHANT' || 
                lowerClass.includes('skilled') || lowerClass.includes('trader')) {
                return noise.random() > 0.5 ? 'comfortable' : 'modest';
            }
            
            // Upper classes
            if (socialClass === 'NOBILITY' || socialClass === 'CLERGY' || 
                socialClass === 'CITIZEN' || socialClass === 'SCHOLAR_OFFICIAL' ||
                lowerClass.includes('elite') || lowerClass.includes('royal')) {
                return noise.random() > 0.3 ? 'wealthy' : 'comfortable';
            }
            
            // Default fallback
            return 'modest';
        };
        
        // Apply the appropriate wealth level
        baseProfile.wealthLevel = socialClassToWealthLevel(socialClass, noise);
        
        // Regenerate clothing with proper wealth level and occupation filtering
        const clothingPieces = generateCompleteOutfit(
            context.culturalZone, 
            context.era, 
            baseProfile.wealthLevel, 
            baseProfile.gender,
            role // Pass the role for occupation-based filtering
        );
        
        // Update appearance with corrected clothing
        baseProfile.appearance = {
            ...baseProfile.appearance,
            ...clothingPieces
        };
        
        // Validate clothing is appropriate for social class
        const validateClothing = (clothing: typeof clothingPieces, socialClass: string) => {
            const lowerClass = socialClass.toLowerCase();
            const isWorkingClass = lowerClass.includes('working') || lowerClass.includes('laborer') || 
                                  lowerClass === 'commoner' || lowerClass.includes('peasant');
            
            if (isWorkingClass) {
                // Check each clothing piece for inappropriate luxury items
                const luxuryKeywords = ['tiara', 'parure', 'diamond', 'emerald', 'ruby', 'sapphire', 
                                       'cocktail dress', 'evening gown', 'silk', 'velvet', 'jeweled'];
                
                Object.entries(clothing).forEach(([key, piece]) => {
                    if (piece && piece.name) {
                        const nameLower = piece.name.toLowerCase();
                        const materialLower = (piece.material || '').toLowerCase();
                        
                        for (const luxury of luxuryKeywords) {
                            if (nameLower.includes(luxury) || materialLower.includes(luxury)) {
                                console.warn(`[NPC Gen] Inappropriate ${key} for ${socialClass}: ${piece.name}`);
                                // Replace with simpler item
                                if (key === 'garment') {
                                    clothing[key as keyof typeof clothing] = { 
                                        name: baseProfile.gender === 'Female' ? 'Simple Dress' : 'Work Shirt', 
                                        material: 'Cotton' 
                                    };
                                } else if (key === 'accessory') {
                                    clothing[key as keyof typeof clothing] = { 
                                        name: 'Simple Pin', 
                                        material: 'Brass' 
                                    };
                                } else if (key === 'headgear') {
                                    clothing[key as keyof typeof clothing] = { 
                                        name: baseProfile.gender === 'Female' ? 'Headband' : 'Cap', 
                                        material: 'Cotton' 
                                    };
                                }
                                break;
                            }
                        }
                    }
                });
            }
            
            return clothing;
        };
        
        // Apply validation
        const validatedClothing = validateClothing(clothingPieces, socialClass);
        baseProfile.appearance = {
            ...baseProfile.appearance,
            ...validatedClothing
        };

        const { appearance } = baseProfile;
        
        // --- "LOOT WHAT YOU SEE" LOGIC ---
        // Create actual Item instances from the procedurally generated appearance data.
        const newEquippedItems: NpcEntity['equippedItems'] = {};
        const newInventory: Item[] = [];

        // Helper function to apply color to items
        const applyColorToItem = (item: Item, colorHex: string | undefined): Item => {
            if (!colorHex) return item;
            
            const hexToColor: Record<string, string> = {
                '#000080': 'Navy', '#001f3f': 'Navy', '#0000ff': 'Blue', '#4169e1': 'Royal Blue',
                '#ff0000': 'Red', '#dc143c': 'Crimson', '#00ff00': 'Green', '#228b22': 'Forest Green',
                '#ffff00': 'Yellow', '#ffd700': 'Gold', '#800080': 'Purple', '#4b0082': 'Indigo',
                '#ffa500': 'Orange', '#ff8c00': 'Dark Orange', '#964b00': 'Brown', '#8b4513': 'Saddle Brown',
                '#000000': 'Black', '#ffffff': 'White', '#c0c0c0': 'Silver', '#808080': 'Gray',
                '#008080': 'Teal', '#40e0d0': 'Turquoise', '#ff7f50': 'Coral', '#deb887': 'Burlywood',
                '#d2b48c': 'Tan', '#f5deb3': 'Wheat', '#faebd7': 'Antique White', '#8b7355': 'Burlywood',
                // Add fallback brown colors
                '#654321': 'Dark Brown', '#d2691e': 'Chocolate', '#a52a2a': 'Brown',
                '#704214': 'Dark Brown'
            };
            
            let colorName = '';
            const colorHexLower = colorHex.toLowerCase();
            
            if (hexToColor[colorHexLower]) {
                colorName = hexToColor[colorHexLower];
            } else {
                // Find closest color by RGB distance
                const hexToRgb = (hex: string) => {
                    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result ? {
                        r: parseInt(result[1], 16),
                        g: parseInt(result[2], 16),
                        b: parseInt(result[3], 16)
                    } : null;
                };
                
                const targetRgb = hexToRgb(colorHex);
                if (targetRgb) {
                    let minDistance = Infinity;
                    let closestColor = 'Gray';
                    
                    for (const [hex, name] of Object.entries(hexToColor)) {
                        const rgb = hexToRgb(hex);
                        if (rgb) {
                            const distance = Math.sqrt(
                                Math.pow(targetRgb.r - rgb.r, 2) +
                                Math.pow(targetRgb.g - rgb.g, 2) +
                                Math.pow(targetRgb.b - rgb.b, 2)
                            );
                            if (distance < minDistance) {
                                minDistance = distance;
                                closestColor = name;
                            }
                        }
                    }
                    colorName = closestColor;
                }
            }
            
            // Check if color is already in the name
            const colorWords = ['navy', 'red', 'blue', 'green', 'yellow', 'purple', 'black', 'white', 'gold', 'silver', 
                               'crimson', 'emerald', 'amber', 'bronze', 'copper', 'ivory', 'ebony', 'maroon', 
                               'olive', 'teal', 'turquoise', 'coral', 'brown', 'gray', 'grey'];
            
            for (const color of colorWords) {
                if (item.name.toLowerCase().includes(color)) {
                    return item; // Color already in name
                }
            }
            
            // Add color to item name if we found one
            if (colorName) {
                return {
                    ...item,
                    name: `${colorName} ${item.name}`,
                    originalName: item.name
                };
            }
            
            return item;
        };

        const createAndEquip = (slot: EquipmentSlot, piece: ClothingPiece | undefined, colorHex?: string) => {
            if (piece && piece.name && piece.name.toLowerCase() !== 'none' && piece.name.toLowerCase() !== 'barefoot') {
                let baseId = piece.name.toUpperCase().replace(/ /g, '_');
                
                // Add color prefix if we have one and material isn't its own color
                if (colorHex) {
                    const materialColors = ['leather', 'hide', 'fur', 'straw', 'iron', 'steel', 'bronze', 
                                           'copper', 'brass', 'gold', 'silver', 'wood', 'oak', 'pine', 'bamboo'];
                    const material = (piece.material || '').toLowerCase();
                    const hasMaterialColor = materialColors.some(mat => material.includes(mat));
                    
                    if (!hasMaterialColor) {
                        const hexToColor: Record<string, string> = {
                            '#000080': 'Navy', '#001f3f': 'Navy', '#0000ff': 'Blue', '#4169e1': 'Royal',
                            '#ff0000': 'Red', '#dc143c': 'Crimson', '#00ff00': 'Green', '#228b22': 'Forest',
                            '#ffff00': 'Yellow', '#ffd700': 'Gold', '#800080': 'Purple', '#4b0082': 'Indigo',
                            '#ffa500': 'Orange', '#ff8c00': 'Orange', '#964b00': 'Brown', '#8b4513': 'Brown',
                            '#000000': 'Black', '#ffffff': 'White', '#c0c0c0': 'Silver', '#808080': 'Gray',
                            '#008080': 'Teal', '#40e0d0': 'Turquoise', '#ff7f50': 'Coral', '#deb887': 'Tan',
                            // Add fallback brown colors
                            '#654321': 'Dark_Brown', '#d2691e': 'Chocolate', '#a52a2a': 'Brown',
                            '#704214': 'Dark_Brown'
                        };
                        
                        const colorHexLower = colorHex.toLowerCase();
                        const colorName = hexToColor[colorHexLower];
                        if (colorName) {
                            baseId = `${colorName.toUpperCase().replace(/ /g, '_')}_${baseId}`;
                        }
                    }
                }
                
                const item = createItemInstance(baseId);
                if (item) {
                    newEquippedItems[slot] = item;
                }
            }
        };

        // Apply colors from palette to equipped items
        createAndEquip('head', appearance.headgear, appearance.palette?.secondary);
        createAndEquip('torso', appearance.garment, appearance.palette?.primary);
        createAndEquip('feet', appearance.footwear, appearance.palette?.secondary);
        createAndEquip('belt', appearance.belt, appearance.palette?.accent);
        createAndEquip('amulet', appearance.accessory, appearance.palette?.accent);
        
        // Determine if NPC is wealthy based on wealth level
        const isWealthy = baseProfile.wealthLevel === 'wealthy' || baseProfile.wealthLevel === 'comfortable';
        
        // Generate historically appropriate legs/trousers
        generateLegsEquipment(context.era, context.culturalZone, role, isWealthy, newEquippedItems, appearance.palette?.primary);
        
        // Generate profession-appropriate cloaks
        generateCloakEquipment(context.era, context.culturalZone, role, isWealthy, newEquippedItems, appearance.palette?.secondary);
        
        // Generate profession-appropriate offhand items
        generateOffhandEquipment(context.era, context.culturalZone, role, isWealthy, newEquippedItems);
        
        // Cultural accessory generation - tattoos, face paint, jewelry
        const accessoryChance = calculateAccessoryChance(context.culturalZone, context.era, role);
        if (Math.random() < accessoryChance) {
            const wealthLevel = isWealthy ? 'wealthy' : 'modest';
            const culturalAccessory = generateCulturalAccessory({
                culture: context.culturalZone,
                era: context.era,
                wealth: wealthLevel,
                gender: baseProfile.gender.toLowerCase() as 'male' | 'female',
                profession: role
            });
            
            if (culturalAccessory) {
                newEquippedItems.accessory = culturalAccessory;
            }
        }
        
        // Enhanced amulet assignment for NPCs - ensure higher distribution
        if (!newEquippedItems.amulet) {
            // Calculate chance based on era, culture, and role
            let amuletChance = 0.35; // Base 35% chance
            
            // Era modifiers
            if (era === 'MEDIEVAL') amuletChance += 0.20;
            if (era === 'ANTIQUITY') amuletChance += 0.15;
            if (era === 'RENAISSANCE_EARLY_MODERN') amuletChance += 0.10;
            
            // Role modifiers
            const roleLower = role.toLowerCase();
            if (roleLower.includes('priest') || roleLower.includes('monk') || roleLower.includes('nun')) amuletChance = 0.90;
            if (roleLower.includes('merchant') || roleLower.includes('noble')) amuletChance += 0.15;
            if (roleLower.includes('child')) amuletChance += 0.20;
            
            // Culture modifiers
            if (culturalZone === 'EUROPEAN' || culturalZone === 'MENA') amuletChance += 0.10;
            if (culturalZone === 'SOUTH_ASIAN' || culturalZone === 'EAST_ASIAN') amuletChance += 0.10;
            
            // Apply chance
            if (Math.random() < Math.min(amuletChance, 0.95)) {
                // Select appropriate amulet based on wealth and culture
                let amuletId = 'ROPE_NECKLACE'; // Default
                
                if (isWealthy) {
                    const wealthyAmulets = ['SILVER_CHAIN', 'GOLD_CHAIN', 'PEARL_NECKLACE', 'CORAL_BEADS', 'AMBER_PENDANT'];
                    amuletId = wealthyAmulets[Math.floor(Math.random() * wealthyAmulets.length)];
                } else if (era === 'MEDIEVAL' && culturalZone === 'EUROPEAN') {
                    const medievalAmulets = ['WOODEN_CROSS', 'PRAYER_BEADS', 'SAINTS_MEDAL', 'PILGRIM_BADGE'];
                    amuletId = medievalAmulets[Math.floor(Math.random() * medievalAmulets.length)];
                } else if (culturalZone === 'MENA') {
                    const menaAmulets = ['HAMSA_PENDANT', 'EVIL_EYE_AMULET', 'PRAYER_BEADS'];
                    amuletId = menaAmulets[Math.floor(Math.random() * menaAmulets.length)];
                } else if (culturalZone === 'EAST_ASIAN') {
                    const asianAmulets = ['JADE_PENDANT', 'PRAYER_BEADS', 'BONE_NECKLACE'];
                    amuletId = asianAmulets[Math.floor(Math.random() * asianAmulets.length)];
                } else {
                    const commonAmulets = ['SHELL_NECKLACE', 'BONE_NECKLACE', 'ROPE_NECKLACE', 'PRAYER_BEADS'];
                    amuletId = commonAmulets[Math.floor(Math.random() * commonAmulets.length)];
                }
                
                const amuletItem = createItemInstance(amuletId);
                if (amuletItem) {
                    // Add quality adjective based on wealth instead of color
                    const privilege = isWealthy ? 0.8 : 0.3;
                    amuletItem.name = addQualityAdjective(amuletItem.name, privilege);
                    newEquippedItems.amulet = amuletItem;
                }
            }
        }

        // Add some generic items to inventory from a starting package for flavor
        const startingPackage = STARTING_PACKAGES[role] || STARTING_PACKAGES['Wanderer'];
        if (startingPackage) {
            startingPackage.inventory.forEach(baseId => {
                const item = createItemInstance(baseId);
                if (item) {
                    newInventory.push(item);
                }
            });
        }
        
        const name = generateNpcName(baseProfile.gender, context.culturalZone, context.region, context.year, noise, nameKey);
        
        // Initialize disease health with era-based chance
        const diseaseService = DiseaseService.getInstance();
        
        // 50% chance for medieval and earlier, less for later periods
        let diseaseChance = 0.5; // Base 50% for medieval
        if (context.era === 'Renaissance' || context.era === 'EarlyModern') {
            diseaseChance = 0.35; // 35% for Renaissance/Early Modern
        } else if (context.era === 'Industrial') {
            diseaseChance = 0.25; // 25% for Industrial
        } else if (context.era === 'Modern' || context.era === 'Contemporary') {
            diseaseChance = 0.15; // 15% for Modern
        } else if (context.era === 'Classical' || context.era === 'Ancient') {
            diseaseChance = 0.5; // 50% for ancient times too
        }
        
        const shouldHaveDisease = Math.random() < diseaseChance;
        
        let health = undefined;
        if (shouldHaveDisease) {
            health = diseaseService.assignDiseasesToEntity(
                { health: undefined } as any,
                context.era,
                context.culturalZone,
                context.year
            );
            
            if (health && health.currentDiseases.length > 0) {
                const disease = health.currentDiseases[0].disease;
                console.log(`[NPC Disease Spawn] ${name} (${role}, ${socialClass}) spawned with ${disease.name} at (${x}, ${y}) - ${(diseaseChance*100).toFixed(0)}% chance in ${context.era}`);
                if (disease.symptoms && disease.symptoms.length > 0) {
                    console.log(`  → Symptoms: ${disease.symptoms.join(', ')}`);
                }
            }
        }
        
        // Generate attribute badges for NPC
        const attributes = AttributeBadgeService.generateAttributes(
            { ...baseProfile, name, class: socialClass, profession: role } as any,
            context.year,
            context.region
        );
        
        if (attributes.length > 0) {
            console.log(`[NPC Generator] Generated ${attributes.length} attribute(s) for ${name}:`, 
                attributes.map(a => `${a.name} (${a.rarity})`).join(', '));
        }
        
        const npc: NpcEntity = {
            ...baseProfile,
            id, x, y, name, class: socialClass, role,
            emoji: emoji || '🧑',
            movement: { type: 'wander' },
            activity: structure ? 'working' : 'wandering',
            descriptions: { short: `A ${role}`, long: `A person who appears to be a ${role.toLowerCase()}.` },
            portraitSeed: Math.floor(noise.random() * 1000000),
            allegianceGroup: structure?.allegianceGroup ?? 'NEUTRAL',
            workplaceId: structure?.id,
            workplaceName: structure?.name,
            inventory: newInventory,
            equippedItems: newEquippedItems,
            health, // Add disease health with potential disease
            attributes, // Add generated attribute badges
        };
        
        statsTracker.successful++;
        statsTracker.byProfession[npc.role] = (statsTracker.byProfession[npc.role] || 0) + 1;
        statsTracker.byWealth[npc.wealthLevel] = (statsTracker.byWealth[npc.wealthLevel] || 0) + 1;
        statsTracker.byCulture[npc.culturalZone] = (statsTracker.byCulture[npc.culturalZone] || 0) + 1;

        return npc;
    } catch (error) {
        statsTracker.failed++;
        console.warn(`[NPC Generator] Failed to create NPC:`, error);
        return null;
    }
}

/**
 * Generate court NPCs for palaces and holy sites using faction data
 */
function generateCourtNpcs(
    structures: TerrainStructure[],
    context: { era: HistoricalEra, culturalZone: CulturalZone, region: string, year: number },
    noise: ValueNoise,
    statsTracker: NpcGenerationStats
): NpcEntity[] {
    const courtNpcs: NpcEntity[] = [];
    
    for (const structure of structures) {
        if (structure.structureType === 'palace' || structure.structureType === 'holy_site') {
            const factionData = FACTION_DATA[context.culturalZone]?.[context.region]?.[context.era];
            if (factionData?.courtRoles) {
                const courtRoles = factionData.courtRoles[structure.structureType];
                if (courtRoles && courtRoles.length > 0) {
                    // Generate NPCs for each court role (up to 3-4 maximum to avoid overcrowding)
                    const maxCourtNpcs = Math.min(courtRoles.length, 4);
                    for (let i = 0; i < maxCourtNpcs; i++) {
                        const role = courtRoles[i];
                        
                        // Find a position near the structure
                        const structureLocation = structure.location || [50, 50];
                        const x = structureLocation[0] + Math.floor((noise.random() - 0.5) * 4);
                        const y = structureLocation[1] + Math.floor((noise.random() - 0.5) * 4);
                        
                        const contextWithFactionData = {
                            ...context,
                            factionData
                        };
                        
                        const courtNpc = createNpc(
                            x, y,
                            context,
                            noise,
                            statsTracker,
                            structure,
                            role // Use the specific court role
                        );
                        
                        if (courtNpc) {
                            // Override the role determination to use the specific court role
                            const { socialClass, emoji } = determineSocialRole(
                                courtNpc, 
                                {
                                    ...contextWithFactionData,
                                    region: context.region,
                                    citySize: structure.citySize
                                }, 
                                role, 
                                structure.structureType
                            );
                            
                            courtNpc.role = role;
                            courtNpc.class = socialClass;
                            courtNpc.emoji = emoji;
                            
                            courtNpcs.push(courtNpc);
                        }
                    }
                }
            }
        }
    }
    
    return courtNpcs;
}

/**
 * Enhanced NPC generation with comprehensive error handling and portrait integration
 */
export function generateNpcsForStandardMap(
    mapData: MapData,
    climate: ClimateType,
    date: string,
    location: string,
    noise: ValueNoise,
    region?: string,
    mapAreaName?: string
): NpcEntity[] {
    const startTime = performance.now();
    let npcs: NpcEntity[] = [];
    
    // Skip NPC generation for SHOALS archetype (no people on shoals)
    if (mapData.archetype === 'SHOALS') {
        console.log(`[NPC] Skipping NPC generation for SHOALS archetype`);
        return [];
    }
    const npcPositions = new Set<string>();
    
    // Initialize stats tracking
    const stats: NpcGenerationStats = {
        attempted: 0,
        successful: 0,
        failed: 0,
        byWealth: {},
        byProfession: {},
        byCulture: {}
    };

    try {
        const { tiles } = mapData;
        
        // Validate inputs
        if (!tiles || !Array.isArray(tiles) || tiles.length === 0) {
            console.error('[NPC Generator] Invalid tiles array');
            return [];
        }
        
        // Parse context with fallbacks
        const dateInfo = parseDateString(date) || { era: HistoricalEra.MEDIEVAL, year: 1200 };
        const culturalZone = mapLocationToCulture(location, dateInfo.year) || 'EUROPEAN';
        const regionName = region || Object.keys(GEOGRAPHICAL_DATA[culturalZone as CulturalZone] || {})[0] || 'DefaultRegion';
        const context = { 
            era: (dateInfo.era || HistoricalEra.MEDIEVAL) as HistoricalEra, 
            culturalZone: culturalZone as CulturalZone,
            region: regionName,
            year: dateInfo.year
        };
        const societalProfile = SOCIETAL_PROFILES[culturalZone]?.[context.era] || SOCIETAL_PROFILES.DEFAULT;
        
        // 1. Spawn palace nobles FIRST (before structures)
        // Find all palace tiles and spawn nobles in front of them
        const palaceTiles = tiles.flat().filter(tile => tile.biome === BiomeType.PALACE);
        for (const palaceTile of palaceTiles) {
            // Spawn an elite noble in front of the palace
            // Try to spawn to the south (front) of the palace first
            const spawnOffsets = [
                { dx: 0, dy: 1 },  // South (front)
                { dx: -1, dy: 1 }, // Southwest
                { dx: 1, dy: 1 },  // Southeast
                { dx: 0, dy: -1 }, // North (back)
                { dx: -1, dy: 0 }, // West
                { dx: 1, dy: 0 },  // East
            ];
            
            let spawnPosition = null;
            for (const offset of spawnOffsets) {
                const testX = palaceTile.x + offset.dx;
                const testY = palaceTile.y + offset.dy;
                
                // Check if position is valid
                if (testX >= 0 && testX < tiles[0].length && 
                    testY >= 0 && testY < tiles.length) {
                    const testTile = tiles[testY][testX];
                    const posKey = `${testX},${testY}`;
                    
                    // Check if walkable and not occupied
                    if (testTile.isLand && 
                        !npcPositions.has(posKey) &&
                        testTile.biome !== BiomeType.DEEP_OCEAN &&
                        testTile.biome !== BiomeType.SHALLOW_OCEAN &&
                        testTile.biome !== BiomeType.RIVER &&
                        testTile.biome !== BiomeType.MAJOR_RIVER) {
                        spawnPosition = { x: testX, y: testY };
                        break;
                    }
                }
            }
            
            if (spawnPosition) {
                // Determine the appropriate noble role based on era and culture
                let nobleRole = 'Lady'; // Default
                const nobilityRoles = PROFESSIONS[context.culturalZone]?.[context.era]?.['NOBILITY'];
                if (nobilityRoles) {
                    // Pick the highest ranking noble role available
                    const highRankRoles = Object.keys(nobilityRoles).filter(role => {
                        const def = nobilityRoles[role];
                        return def.socialRequirements?.minPrivilege >= 0.6;
                    });
                    if (highRankRoles.length > 0) {
                        nobleRole = highRankRoles[Math.floor(noise.random() * highRankRoles.length)];
                    }
                }
                
                // Create the palace noble NPC
                const palaceNoble = createNpc(
                    spawnPosition.x, 
                    spawnPosition.y, 
                    context, 
                    noise, 
                    stats, 
                    undefined, // No structure anchor for now
                    nobleRole
                );
                
                if (palaceNoble) {
                    // Set special attributes for palace nobles
                    palaceNoble.isElite = true;
                    palaceNoble.homeTile = palaceTile; // Remember the palace
                    palaceNoble.wanderRadius = 3; // Stay close to palace
                    palaceNoble.privilege = 0.8 + noise.random() * 0.2; // High privilege
                    palaceNoble.wealth = 'wealthy' as WealthLevel;
                    
                    // Add behavior flags for entering/exiting palace
                    palaceNoble.behavior = {
                        ...palaceNoble.behavior,
                        palaceVisitor: true,
                        palaceLocation: [palaceTile.x, palaceTile.y],
                        timeUntilPalaceVisit: 30 + Math.floor(noise.random() * 60) // Visit palace in 30-90 ticks
                    };
                    
                    npcs.push(palaceNoble);
                    npcPositions.add(`${spawnPosition.x},${spawnPosition.y}`);
                    stats.successful++;
                    console.log(`[NPC] Spawned palace noble ${nobleRole} at (${spawnPosition.x}, ${spawnPosition.y})`);
                }
            }
        }
        
        // 2. Spawn anchored NPCs for structures
        if (mapData.terrainStructures) {
            for (const structure of mapData.terrainStructures) {
                 if (structure.state !== 'active') continue; // Only spawn at active structures

                 const factionData = FACTION_DATA[context.culturalZone]?.[context.region]?.[context.era];
                 let rolesToSpawn: string[] = [];

                 // Special handling for holy sites - use clergy roles
                 if (structure.structureType === 'holy_site') {
                     const religion = (structure as any).religion || structure.name || 'default';
                     const clergyRoles = getClergyRoles(religion);
                     
                     // Always spawn at least one clergy member
                     if (clergyRoles.length > 0) {
                         rolesToSpawn.push(clergyRoles[0]); // Head priest/leader
                         
                         // Spawn additional clergy with decreasing probability
                         for (let i = 1; i < Math.min(clergyRoles.length, 4); i++) {
                             if (noise.random() < 0.8 / i) {
                                 rolesToSpawn.push(clergyRoles[i]);
                             }
                         }
                     }
                     
                     // If no clergy roles found, fallback to generic
                     if (rolesToSpawn.length === 0) {
                         rolesToSpawn = ['Priest', 'Acolyte'];
                     }
                 } else {
                     // For non-holy sites, use the existing logic
                     // Priority 1: Faction-specific court roles
                     let roleSource = factionData?.courtRoles?.[structure.structureType];

                     // Priority 2: Societal Profile fallback
                     if (!roleSource || roleSource.length === 0) {
                         roleSource = societalProfile.courtRoles?.[structure.structureType];
                     }

                     // Priority 3: Simple npcAnchor fallback
                     if ((!roleSource || roleSource.length === 0) && structure.npcAnchor) {
                         roleSource = [structure.npcAnchor];
                     }

                     if (roleSource && roleSource.length > 0) {
                         // Always spawn the first role (leader)
                         rolesToSpawn.push(roleSource[0]);
                         // Spawn subsequent roles with decreasing probability
                         for (let i = 1; i < roleSource.length; i++) {
                             if (noise.random() < 0.8 / i) {
                                 rolesToSpawn.push(roleSource[i]);
                             }
                         }
                     }
                 }
                 
                for (const role of rolesToSpawn) {
                    const position = findValidNpcPosition(tiles, npcPositions, noise, structure.location, 5);
                    if (!position) continue;
                    
                    const npc = createNpc(position.x, position.y, context, noise, stats, structure, role);
                    if (npc) {
                        npcs.push(npc);
                        npcPositions.add(`${position.x},${position.y}`);
                    }
                }
            }
        }
        
        // 2. Initialize factory and holy site economies
        if (mapData.terrainStructures) {
            // Initialize holy site economies
            const holySites = mapData.terrainStructures.filter(s => s.structureType === 'holy_site');
            for (const holySite of holySites) {
                holySiteEconomyService.initializeHolySite(holySite, mapData, npcs);
            }
            
            // Initialize factory economies and assign workers
            const factories = mapData.terrainStructures.filter(s => s.structureType === 'factory');
            for (const factory of factories) {
                // Initialize the factory economy first
                factoryEconomyService.initializeFactory(factory, mapData, npcs);
                
                // Get the factory type for worker generation
                const factoryType = getFactoryType(context.era, context.culturalZone, context.region);
                if (factoryType) {
                    // Generate additional factory workers if needed
                    const workersNeeded = factoryType.workersNeeded;
                    const nearbyWorkers = npcs.filter(npc => {
                        const distance = Math.hypot(
                            npc.x - factory.location[0],
                            npc.y - factory.location[1]
                        );
                        return distance < 20 && !npc.workplaceId;
                    });
                    
                    // Generate more workers if we don't have enough
                    // BUT respect the hard limit of 10 NPCs total
                    const MAX_NPCS = 10;
                    let workersGenerated = nearbyWorkers.length;
                    while (workersGenerated < workersNeeded * 0.5 && npcs.length < MAX_NPCS) { // Respect 10 NPC limit
                        const position = findValidNpcPosition(tiles, npcPositions, noise, factory.location, 10);
                        if (!position) break;
                        
                        const worker = createNpc(position.x, position.y, context, noise, stats, factory, 'Factory Worker');
                        if (worker) {
                            // Set factory-specific attributes
                            worker.fatigue = 0.3 + Math.random() * 0.4; // Start with some fatigue
                            worker.morale = 0.3 + Math.random() * 0.4; // Variable morale
                            
                            npcs.push(worker);
                            npcPositions.add(`${position.x},${position.y}`);
                            workersGenerated++;
                        }
                    }
                }
            }
        }
        
        // 3. Spawn remaining wandering NPCs
        // HARD LIMIT: Never exceed 10 NPCs total
        const MAX_NPCS_TOTAL = 10;
        const targetNpcCount = Math.min(MAX_NPCS_TOTAL, calculateNpcCount(tiles, climate, noise, region, mapAreaName, dateInfo.year));
        let attempts = 0;
        const maxAttempts = (targetNpcCount - npcs.length) * 50;
        
        while (npcs.length < targetNpcCount && npcs.length < MAX_NPCS_TOTAL && attempts < maxAttempts) {
            attempts++;
            const position = findValidNpcPosition(tiles, npcPositions, noise, null, 15);
            if (!position) continue;
            
            // Check proximity to palaces - spawn nobles near palaces, commoners elsewhere
            let nearPalace = false;
            let forcedRole: string | undefined = undefined;
            
            // Find distance to nearest palace
            for (const palaceTile of palaceTiles) {
                const distToPalace = Math.hypot(position.x - palaceTile.x, position.y - palaceTile.y);
                if (distToPalace < 8) { // Within 8 tiles of a palace
                    nearPalace = true;
                    // Force noble/wealthy role near palaces
                    const nobilityRoles = PROFESSIONS[context.culturalZone]?.[context.era]?.['NOBILITY'];
                    const merchantRoles = PROFESSIONS[context.culturalZone]?.[context.era]?.['MERCHANT'];
                    const scholarRoles = PROFESSIONS[context.culturalZone]?.[context.era]?.['CLERGY'];
                    
                    const eliteRoles: string[] = [];
                    if (nobilityRoles) eliteRoles.push(...Object.keys(nobilityRoles));
                    if (merchantRoles && noise.random() < 0.3) eliteRoles.push(...Object.keys(merchantRoles));
                    if (scholarRoles && noise.random() < 0.2) eliteRoles.push(...Object.keys(scholarRoles));
                    
                    if (eliteRoles.length > 0) {
                        forcedRole = eliteRoles[Math.floor(noise.random() * eliteRoles.length)];
                    }
                    break;
                }
            }
            
            // If far from palace, prefer common/laborer roles
            if (!nearPalace && position) {
                const tile = tiles[position.y][position.x];
                // Rural or dangerous areas get laborers/farmers
                if (tile.qualities?.safety < 0.5 || tile.biome === BiomeType.FARMLAND || 
                    tile.biome === BiomeType.FOREST || tile.biome === BiomeType.HILLS) {
                    const laborerRoles = PROFESSIONS[context.culturalZone]?.[context.era]?.['LABORER'];
                    const farmerRoles = PROFESSIONS[context.culturalZone]?.[context.era]?.['FARMER'];
                    
                    const commonRoles: string[] = [];
                    if (laborerRoles) commonRoles.push(...Object.keys(laborerRoles));
                    if (farmerRoles) commonRoles.push(...Object.keys(farmerRoles));
                    
                    if (commonRoles.length > 0 && noise.random() < 0.7) {
                        forcedRole = commonRoles[Math.floor(noise.random() * commonRoles.length)];
                    }
                }
            }
            
            const npc = createNpc(position.x, position.y, context, noise, stats, undefined, forcedRole);
            if (npc) {
                // Adjust wealth based on proximity to palace
                if (nearPalace) {
                    npc.wealth = noise.random() < 0.6 ? 'wealthy' : 'modest';
                    (npc as any).privilege = 0.5 + noise.random() * 0.5; // Higher privilege near palaces
                }
                npcs.push(npc);
                npcPositions.add(`${position.x},${position.y}`);
            }
        }
        
        // 3. Post-Generation Social & Home Simulation
        const settlementTiles = tiles.flat().filter(t => [BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY].includes(t.biome));
        
        try {
            for (const npc of npcs) {
                 // Assign Home Location
                if (settlementTiles.length > 0) {
                    let closestSettlementTile: Tile | null = null;
                    let minDistance = Infinity;
                    settlementTiles.forEach(tile => {
                        const distance = Math.hypot(npc.x - tile.x, npc.y - tile.y);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestSettlementTile = tile;
                        }
                    });
                    if (closestSettlementTile) {
                        npc.homeLocation = { x: closestSettlementTile.x, y: closestSettlementTile.y };
                    }
                }

                // Generate family and life events
                const { family, lifeEvents } = generateNpcFamilyAndLifeEvents(npc, npcs, mapData, noise);
                npc.family = family;
                npc.lifeEvents = lifeEvents;
                
                const spouseName = family.find(f => f.relation === 'spouse')?.name;
                if (spouseName) {
                    const spouseEntity = npcs.find(s => s.name === spouseName);
                    if (spouseEntity) {
                        npc.memory.relationships.set(spouseEntity.id, { opinion: 85, type: 'family' });
                        spouseEntity.memory.relationships.set(npc.id, { opinion: 85, type: 'family' });
                    }
                }
            }

            // Populate friendships
            for (const npc of npcs) {
                const friends = findNpcFriends(npc, npcs, mapData);
                for (const friend of friends) {
                    if (!npc.memory.relationships.has(friend.id)) {
                        const opinion = 50 + Math.floor(noise.random() * 30);
                        npc.memory.relationships.set(friend.id, { opinion, type: 'friend' });
                        friend.memory.relationships.set(npc.id, { opinion, type: 'friend' });
                    }
                }
            }
        } catch (e) {
            console.error("Failed to populate NPC social data:", e);
        }

        // 4. Generate enhanced descriptions for all NPCs
        enhanceNpcDescriptions(npcs);
        
        // Final safety check: Ensure we never exceed 10 NPCs
        if (npcs.length > 10) {
            console.warn(`[NPC Gen] Generated ${npcs.length} NPCs, trimming to 10 for performance`);
            npcs = npcs.slice(0, 10);
        }
        
        logGenerationStats(stats, startTime);
        return npcs;
        
    } catch (error) {
        console.error('[NPC Generator] Critical error during NPC generation:', error);
        return [];
    }
}

function findValidNpcPosition(
    tiles: Tile[][], 
    usedPositions: Set<string>, 
    noise: ValueNoise,
    anchor: [number, number] | null,
    searchRadius: number
): { x: number, y: number } | null {
    const startX = anchor ? anchor[0] : Math.floor(noise.random() * MAP_WIDTH_TILES);
    const startY = anchor ? anchor[1] : Math.floor(noise.random() * MAP_HEIGHT_TILES);

    for (let i = 0; i < 30; i++) { // 30 attempts to find a spot
        const angle = noise.random() * 2 * Math.PI;
        const radius = Math.sqrt(noise.random()) * searchRadius;
        const x = Math.round(startX + Math.cos(angle) * radius);
        const y = Math.round(startY + Math.sin(angle) * radius);
        
        if (y < 0 || y >= MAP_HEIGHT_TILES || x < 0 || x >= MAP_WIDTH_TILES) continue;

        const tile = tiles[y][x];
        const positionKey = `${x},${y}`;

        const isWalkable = tile.isLand && 
            tile.biome !== BiomeType.ACTIVE_LAVA && 
            tile.biome !== BiomeType.DEEP_OCEAN && 
            tile.biome !== BiomeType.SHALLOW_OCEAN &&
            tile.biome !== BiomeType.CLIFF &&
            tile.biome !== BiomeType.MOUNTAIN &&
            tile.biome !== BiomeType.HIGH_PEAK;
        if (isWalkable && !usedPositions.has(positionKey)) {
            return { x, y };
        }
    }
    return null;
}

function calculateNpcCount(tiles: Tile[][], climate: ClimateType, noise: ValueNoise, regionName?: string, localAreaName?: string, year?: number): number {
    console.log(`[NPC] Starting NPC count calculation for localArea="${localAreaName}", region="${regionName}"`);
    
    // Use centralized city detection for accurate era calculation
    const dateInfo = parseDateString(year?.toString() || '1650');
    const cityDetection = detectCitiesForArea(localAreaName, regionName, year || dateInfo.year, dateInfo.era, true);
    
    const hasCities = cityDetection.hasCities;
    const cityDensity = cityDetection.cityDensity;
    
    console.log(`[NPC] City detection result: hasCities=${hasCities}, source=${cityDetection.source}, density=${cityDensity}`);
    
    // Count urban tiles to determine actual urbanization
    let urbanTileCount = 0;
    let hamletCount = 0;
    tiles.flat().forEach(t => {
        if (t.biome === BiomeType.URBAN || t.biome === BiomeType.DENSE_CITY || t.biome === BiomeType.LOW_DENSITY_CITY) {
            urbanTileCount++;
        } else if (t.biome === BiomeType.HAMLET) {
            hamletCount++;
        }
    });
    
    let npcCount = 0;
    
    if (hasCities && cityDensity) {
        // City-based NPC generation
        const densityNpcMap: Record<string, number> = {
            'small': 3,      // 2-4 NPCs
            'moderate': 5,   // 4-6 NPCs
            'large': 7,      // 6-8 NPCs
            'massive': 9     // 8-10 NPCs
        };
        npcCount = densityNpcMap[cityDensity];
        // Add some variation
        npcCount += Math.floor(noise.random() * 3) - 1;
    } else if (urbanTileCount > 0 || hamletCount > 0) {
        // No defined cities but some settlements spawned
        if (hamletCount > 0 && urbanTileCount === 0) {
            // Only hamlets - very few NPCs
            npcCount = Math.min(hamletCount, 2); // 0-2 NPCs max
            if (noise.random() < 0.3) npcCount = 0; // 30% chance of no NPCs even with hamlets
        } else {
            // Some urban tiles - slightly more NPCs
            npcCount = 1 + Math.floor(urbanTileCount / 5);
        }
    } else {
        // No urbanization at all - max 3 NPCs (wanderers, hermits, etc.)
        const roll = noise.random();
        if (roll < 0.4) {
            npcCount = 0; // 40% chance of no NPCs
        } else if (roll < 0.8) {
            npcCount = 1 + Math.floor(noise.random() * 2); // 40% chance of 1-2 NPCs
        } else {
            npcCount = 2 + Math.floor(noise.random() * 2); // 20% chance of 2-3 NPCs
        }
        npcCount = Math.min(npcCount, 3); // Never more than 3 for maps without settlements
    }
    
    // Apply climate modifier
    const climateMultipliers: Partial<Record<ClimateType, number>> = { 
        [ClimateType.TEMPERATE]: 1.1, 
        [ClimateType.TROPICAL]: 1.0, 
        [ClimateType.ARID]: 0.8, 
        [ClimateType.COLD]: 0.7 
    };
    npcCount *= (climateMultipliers[climate] || 1.0);
    
    // Hard cap at 10 NPCs maximum for performance
    return Math.max(0, Math.min(10, Math.floor(npcCount)));
}


function enhanceNpcDescriptions(npcs: NpcEntity[]): void {
    for (const npc of npcs) {
        try {
            npc.descriptions = generateNpcDescriptions(npc);
        } catch (e) {
            console.warn(`Failed to enhance description for NPC ${npc.id}`);
        }
    }
}

function logGenerationStats(stats: NpcGenerationStats, startTime: number): void {
    const duration = Math.round(performance.now() - startTime);
    console.log(`[NPC Gen] Completed in ${duration}ms. Attempted: ${stats.attempted}, Successful: ${stats.successful}, Failed: ${stats.failed}`);
}