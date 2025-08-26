/**
 * generation/standardMap/features/NpcGenerator.ts - Enhanced NPC generation with portrait integration
 */
import { Tile, ClimateType, NpcEntity, HistoricalEra, MapData, TerrainStructure, BiomeType, Appearance, Item, EquipmentSlot, ClothingPiece, Point, SocietalProfile } from '../../../types';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES, CulturalZone, STRUCTURE_BLUEPRINTS, PROFESSIONS, ProfessionDefinition, FACTION_DATA, GEOGRAPHICAL_DATA, STARTING_PACKAGES, SOCIETAL_PROFILES } from '../../../constants/index';
import { ValueNoise } from '../../../utils/noise';
import { generateBaseProfile, determineSocialRole, generateNpcName, assignBeliefs, generateCompleteOutfit } from '../../common/npcUtils';
import { parseDateString } from '../../../utils/dateUtils';
import { generateNpcDescriptions } from '../../../services/npcDescriptionService';
import { mapLocationToCulture } from '../../../utils/mapUtils';
import { generateNpcFamilyAndLifeEvents, findNpcFriends } from '../../../services/socialService';
import { createItemInstance } from '../../../utils/inventoryUtils';
import { detectCitiesForArea } from '../../../utils/cityDetectionUtils';
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
        
        let diseaseHealth = undefined;
        if (shouldHaveDisease) {
            diseaseHealth = diseaseService.assignDiseasesToEntity(
                { health: undefined } as any,
                context.era,
                context.culturalZone,
                context.year
            );
            
            if (diseaseHealth && diseaseHealth.currentDiseases.length > 0) {
                const disease = diseaseHealth.currentDiseases[0].disease;
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
            diseaseHealth, // Add disease health with potential disease
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
    const npcs: NpcEntity[] = [];
    
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
        
        // 1. Spawn anchored NPCs first
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
            
            const npc = createNpc(position.x, position.y, context, noise, stats); // No structure passed for wanderers
            if (npc) {
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