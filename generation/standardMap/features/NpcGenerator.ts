/**
 * generation/standardMap/features/NpcGenerator.ts - Enhanced NPC generation with portrait integration
 */
import { Tile, ClimateType, NpcEntity, HistoricalEra, MapData, TerrainStructure, BiomeType, Appearance, Item, EquipmentSlot, ClothingPiece, Point, SocietalProfile } from '../../../types';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES, CulturalZone, STRUCTURE_BLUEPRINTS, PROFESSIONS, ProfessionDefinition, FACTION_DATA, GEOGRAPHICAL_DATA, STARTING_PACKAGES, SOCIETAL_PROFILES } from '../../../constants/index';
import { ValueNoise } from '../../../utils/noise';
import { generateBaseProfile, determineSocialRole, generateNpcName, assignBeliefs } from '../../common/npcUtils';
import { parseDateString } from '../../../utils/dateUtils';
import { generateNpcDescriptions } from '../../../services/npcDescriptionService';
import { mapLocationToCulture } from '../../../utils/mapUtils';
import { generateNpcFamilyAndLifeEvents, findNpcFriends } from '../../../services/socialService';
import { createItemInstance } from '../../../utils/inventoryUtils';
import { detectCitiesForArea } from '../../../utils/cityDetectionUtils';


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

        const { socialClass, role, emoji, nameKey } = determineSocialRole(baseProfile, { era: context.era, culturalZone: context.culturalZone }, roleToDetermine);
        if (!role) {
            statsTracker.failed++;
            return null;
        }

        // Constrain wealth level based on social class for realism
        if (socialClass === 'COMMONER' && (baseProfile.wealthLevel === 'comfortable' || baseProfile.wealthLevel === 'wealthy' || baseProfile.wealthLevel === 'noble')) {
            baseProfile.wealthLevel = noise.random() > 0.7 ? 'modest' : 'poor';
        }
        if ((socialClass === 'ARTISAN' || socialClass === 'MERCHANT') && (baseProfile.wealthLevel === 'poor' || baseProfile.wealthLevel === 'wealthy' || baseProfile.wealthLevel === 'noble')) {
            baseProfile.wealthLevel = noise.random() > 0.5 ? 'comfortable' : 'modest';
        }
        if ((socialClass === 'NOBILITY' || socialClass === 'CLERGY' || socialClass === 'CITIZEN' || socialClass === 'SCHOLAR_OFFICIAL') && (baseProfile.wealthLevel === 'poor')) {
            baseProfile.wealthLevel = 'modest';
        }

        const { appearance } = baseProfile;
        
        // --- "LOOT WHAT YOU SEE" LOGIC ---
        // Create actual Item instances from the procedurally generated appearance data.
        const newEquippedItems: NpcEntity['equippedItems'] = {};
        const newInventory: Item[] = [];

        const createAndEquip = (slot: EquipmentSlot, piece: ClothingPiece | undefined) => {
            if (piece && piece.name && piece.name.toLowerCase() !== 'none' && piece.name.toLowerCase() !== 'barefoot') {
                const baseId = piece.name.toUpperCase().replace(/ /g, '_');
                const item = createItemInstance(baseId);
                if (item) {
                    newEquippedItems[slot] = item;
                }
            }
        };

        createAndEquip('head', appearance.headgear);
        createAndEquip('torso', appearance.garment);
        createAndEquip('feet', appearance.footwear);
        createAndEquip('belt', appearance.belt);
        createAndEquip('amulet', appearance.accessory);

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
                                contextWithFactionData, 
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
        
        // 2. Spawn remaining wandering NPCs
        const npcCount = calculateNpcCount(tiles, climate, noise, region, mapAreaName, dateInfo.year);
        let attempts = 0;
        const maxAttempts = (npcCount - npcs.length) * 50;
        
        while (npcs.length < npcCount && attempts < maxAttempts) {
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