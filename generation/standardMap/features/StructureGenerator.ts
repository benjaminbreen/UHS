/**
 * generation/standardMap/features/StructureGenerator.ts - Places functional structures on the map.
 */
import { Tile, MapData, TerrainStructure, BiomeType, TerrainStructureType, Allegiance, CulturalZone, HistoricalEra, MetalDefinition, SocietalProfile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';
import { STRUCTURE_BLUEPRINTS, MAP_WIDTH_TILES, MAP_HEIGHT_TILES, METALS, FACTION_DATA } from '../../../constants/index';
// Heavy data files - import directly to avoid loading on app startup
import { GEOGRAPHICAL_DATA } from '../../../constants/gameData/geography';
// Note: FACTION_DATA is loaded lazily via Proxy - it's available synchronously
import { mapLocationToCulture } from '../../../utils/mapUtils';
import { parseDateString } from '../../../utils/dateUtils';
import { determineReligion } from '../../common/npcUtils';
import { getFactoryType, FactoryType } from '../../../constants/gameData/factoryTypes';
import { MINE_FREQUENCY_BY_ERA, QUARRY_FREQUENCY_BY_ERA, getRandomMaterial } from '../../../constants/gameData/mineQuarryMaterials';
import { selectGovernmentType } from '../../../constants/gameData/governmentDistricts';
import { worldEntityRegistry } from '../../../services/worldEntityRegistry';
import { generateWaystationName, generateWellName } from '../../../services/structureNamingService';


let structureIdCounter = 0;

interface Candidate {
    tile: Tile;
    score: number;
    // For mining colonies, store the best potential metal and its score
    bestMetal?: string;
    bestMetalScore?: number;
}

// Replaces the placeholder. This is the new geological simulation.
function createMineralPotentialData(tiles: Tile[][], noise: ValueNoise): Record<string, number[][]> {
    const potentialData: Record<string, number[][]> = {};

    for (const metalId in METALS) {
        potentialData[metalId] = Array(MAP_HEIGHT_TILES).fill(0).map(() => Array(MAP_WIDTH_TILES).fill(0));
    }

    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const tile = tiles[y][x];

            for (const metalId in METALS) {
                const metalDef = METALS[metalId] as MetalDefinition;
                if (!metalDef.geologicalRules) continue;
                const rules = metalDef.geologicalRules;
                
                let score = 0;
                
                // Rule 1: Biome match
                if (rules.biomes.includes(tile.biome as any)) {
                    score += 0.4;
                } else {
                    continue; // No potential if biome doesn't match
                }
                
                // Rule 2: Stress match
                if (rules.minStress) {
                    if ((tile.qualities.geologicalStress || 0) >= rules.minStress) {
                        score += 0.3 * (((tile.qualities.geologicalStress || 0) - rules.minStress) / (1 - rules.minStress));
                    } else {
                        score -= 0.5; // Penalty for not meeting minimum
                    }
                }

                // Rule 3: Thermal match
                if (rules.minThermal) {
                     if ((tile.qualities.thermalActivity || 0) >= rules.minThermal) {
                        score += 0.3 * (((tile.qualities.thermalActivity || 0) - rules.minThermal) / (1 - rules.minThermal));
                    } else {
                        score -= 0.5; // Penalty
                    }
                }
                 
                // Add noise for variation
                score += noise.noise(x * 0.3, y * 0.3) * 0.2;

                potentialData[metalId][y][x] = Math.max(0, Math.min(1, score));
            }
        }
    }
    return potentialData;
}


function findPlacementCandidates(
    tiles: Tile[][],
    structureType: TerrainStructureType,
    mineralPotentialData: Record<string, number[][]>
): Candidate[] {
    const candidates: Candidate[] = [];
    const unplaceableBiomes = new Set([
        BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN, BiomeType.RIVER, BiomeType.MAJOR_RIVER,
        BiomeType.ACTIVE_LAVA, BiomeType.FRESHWATER_LAKE, BiomeType.ESTUARY,
        // Don't place over existing points of interest
        BiomeType.RUINS, BiomeType.HOLY_SITE, BiomeType.PALACE, BiomeType.CITY_CENTER, BiomeType.MARKETPLACE,
        BiomeType.DENSE_CITY, BiomeType.LOW_DENSITY_CITY, BiomeType.HAMLET,
        BiomeType.ROAD, // Don't place structures on roads
        BiomeType.PARK, // Parks should remain clear
        BiomeType.PLAZA, // Plazas are public spaces
        BiomeType.HARBOR_DISTRICT, // Harbor districts have their own buildings
        BiomeType.INDUSTRIAL_DISTRICT, // Industrial districts have factories
        BiomeType.FARMLAND // SAFEGUARD: Don't place structures on farmland
    ]);

    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const tile = tiles[y][x];
            if (!tile.isLand || unplaceableBiomes.has(tile.biome)) continue;
            
            // SAFEGUARD: Don't place structures in animal paddocks
            if (tile.paddockType === 'Livestock') continue;

            let score = 0;
            let isValid = false;
            let candidate: Partial<Candidate> = {};

            switch(structureType) {
                case 'mill':
                    if (tile.biome === BiomeType.GRASSLAND || tile.biome === BiomeType.RIVERBANK) {
                        let isNearRiver = false;
                        let farmTilesNearby = 0;
                        let settlementTilesNearby = 0;
                        for (let dy = -5; dy <= 5; dy++) {
                            for (let dx = -5; dx <= 5; dx++) {
                                const nx = x + dx;
                                const ny = y + dy;
                                if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
                                    if(Math.hypot(dx, dy) <= 1 && tiles[ny][nx].biome === BiomeType.RIVER) isNearRiver = true;
                                    if(tiles[ny][nx].biome === BiomeType.FARMLAND) farmTilesNearby++;
                                    // Check for settlements within the search radius
                                    if([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.CITY_CENTER].includes(tiles[ny][nx].biome)) {
                                        settlementTilesNearby++;
                                    }
                                }
                            }
                        }
                        // Mills require river AND either farmland OR settlements nearby
                        if (isNearRiver && (farmTilesNearby > 0 || settlementTilesNearby > 0)) {
                            isValid = true;
                            score = farmTilesNearby * 2 + settlementTilesNearby; // Prioritize areas with more farmland
                        }
                    }
                    break;
                case 'mining_colony':
                    if (tile.biome === BiomeType.HILLS || tile.biome === BiomeType.MOUNTAIN) {
                        let bestMetal = 'IRON';
                        let bestMetalScore = 0;

                        for (const metalId in mineralPotentialData) {
                            const potential = mineralPotentialData[metalId][y][x];
                            if (potential > bestMetalScore) {
                                bestMetalScore = potential;
                                bestMetal = metalId;
                            }
                        }

                        if (bestMetalScore > 0.6) { // Placement threshold
                            isValid = true;
                            score = bestMetalScore;
                            candidate.bestMetal = bestMetal;
                            candidate.bestMetalScore = bestMetalScore;
                        }
                    }
                    break;
                case 'lumber_camp':
                     if (tile.biome === BiomeType.FOREST || tile.biome === BiomeType.GRASSLAND || tile.biome === BiomeType.DENSE_FOREST) {
                        let forestTilesNearby = 0;
                        for (let dy = -2; dy <= 2; dy++) {
                            for (let dx = -2; dx <= 2; dx++) {
                                const nx = x + dx;
                                const ny = y + dy;
                                if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
                                    if(tiles[ny][nx].biome === BiomeType.FOREST || tiles[ny][nx].biome === BiomeType.DENSE_FOREST) forestTilesNearby++;
                                }
                            }
                        }
                        // Relaxed requirement: only need 2 forest tiles nearby instead of 3
                        if (forestTilesNearby >= 2) {
                             isValid = true;
                             score = forestTilesNearby;
                        }
                    }
                    break;
                case 'fishing_hut':
                    // Temporarily more permissive for testing - any coastal or water-adjacent tile
                    if(tile.isCoast || tile.biome === BiomeType.BEACH || tile.biome === BiomeType.WETLANDS || tile.biome === BiomeType.RIVER) {
                        isValid = true;
                        score = 1; // Simple placement for now
                        console.log(`[StructureGen] Found valid fishing hut location at (${tile.x}, ${tile.y}) - biome: ${tile.biome}, isCoast: ${tile.isCoast}`);
                    }
                    break;
                case 'fortress':
                    if(tile.biome === BiomeType.HILLS || tile.biome === BiomeType.MOUNTAIN || tile.isCoast) {
                         isValid = true;
                         score = tile.qualities.safety + (tile.altitude * 0.5);
                    }
                    break;
                case 'quarry':
                    if (tile.biome === BiomeType.HILLS || tile.biome === BiomeType.MOUNTAIN) {
                        isValid = true;
                        score = tile.qualities.geologicalStress || 0.5;
                    }
                    break;
                case 'factory': // formerly smelter
                    // Factories can be near cities or industrial areas
                    let nearIndustrial = false;
                    let industrialDistance = 999;
                    for (let dy = -10; dy <= 10; dy++) {
                        for (let dx = -10; dx <= 10; dx++) {
                            const nx = x + dx;
                            const ny = y + dy;
                            if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
                                const dist = Math.hypot(dx, dy);
                                // Look for cities or existing urban areas
                                if ((tiles[ny][nx].biome === BiomeType.CITY_CENTER || 
                                     tiles[ny][nx].biome === BiomeType.DENSE_CITY ||
                                     tiles[ny][nx].biome === BiomeType.LOW_DENSITY_CITY) && 
                                    dist < industrialDistance) {
                                    nearIndustrial = true;
                                    industrialDistance = dist;
                                }
                            }
                        }
                    }
                    // Allow factories within 10 tiles of urban areas
                    if (nearIndustrial && industrialDistance <= 10) {
                        isValid = true;
                        score = 15 - industrialDistance; // Prefer closer to urban areas but allow farther
                    }
                    break;
                case 'government_district':
                    // Government buildings must be very close to city centers
                    // BUT not on urban tiles themselves - only on appropriate terrain
                    if (tile.biome === BiomeType.GRASSLAND || tile.biome === BiomeType.FOREST ||
                        tile.biome === BiomeType.RIVERBANK || tile.biome === BiomeType.DIRT) {
                        let isNearCityCenter = false;
                        let cityDistance = 999;
                        for (let dy = -5; dy <= 5; dy++) {
                            for (let dx = -5; dx <= 5; dx++) {
                                const nx = x + dx;
                                const ny = y + dy;
                                if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
                                    const dist = Math.hypot(dx, dy);
                                    if (tiles[ny][nx].biome === BiomeType.CITY_CENTER && dist < cityDistance) {
                                        isNearCityCenter = true;
                                        cityDistance = dist;
                                    }
                                }
                            }
                        }
                        if (isNearCityCenter && cityDistance <= 5) {
                            isValid = true;
                            score = 10 - cityDistance; // Prefer closer to city center
                        }
                    }
                    break;
                case 'waystation':
                    // Waystations prefer roads, grasslands, and areas between settlements
                    // They serve travelers on trade routes
                    if (tile.biome === BiomeType.GRASSLAND || tile.biome === BiomeType.ROAD ||
                        tile.biome === BiomeType.STEPPE || tile.biome === BiomeType.DESERT ||
                        tile.biome === BiomeType.SCRUB || tile.biome === BiomeType.RIVERBANK) {

                        let nearRoad = false;
                        let nearSettlement = false;
                        let settlementDistance = 999;
                        let roadProximity = 0;

                        for (let dy = -8; dy <= 8; dy++) {
                            for (let dx = -8; dx <= 8; dx++) {
                                const nx = x + dx;
                                const ny = y + dy;
                                if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
                                    const dist = Math.hypot(dx, dy);
                                    const checkTile = tiles[ny][nx];

                                    // Check for nearby roads
                                    if (checkTile.biome === BiomeType.ROAD && dist <= 3) {
                                        nearRoad = true;
                                        roadProximity = Math.max(roadProximity, 4 - dist);
                                    }

                                    // Check for settlements - waystations should be BETWEEN settlements, not in them
                                    if ([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.CITY_CENTER].includes(checkTile.biome)) {
                                        if (dist < settlementDistance) {
                                            nearSettlement = true;
                                            settlementDistance = dist;
                                        }
                                    }
                                }
                            }
                        }

                        // Ideal: near roads, moderate distance from settlements (not too close, not too far)
                        if (nearRoad || tile.biome === BiomeType.ROAD) {
                            // Best placement: 5-15 tiles from settlement
                            if (settlementDistance >= 5 && settlementDistance <= 15) {
                                isValid = true;
                                score = roadProximity + 3;
                            } else if (!nearSettlement) {
                                // Also valid in wilderness without nearby settlements
                                isValid = true;
                                score = roadProximity + 1;
                            }
                        } else if (!nearSettlement) {
                            // Can also place in wilderness away from roads (frontier waystation)
                            isValid = true;
                            score = 0.5;
                        }
                    }
                    break;
                case 'well':
                    // Wells are placed in/near settlements, or at strategic water-access points
                    // They provide water to communities (not ON water sources like oases - those already have water)
                    if (tile.biome === BiomeType.GRASSLAND || tile.biome === BiomeType.DESERT ||
                        tile.biome === BiomeType.STEPPE || tile.biome === BiomeType.SCRUB ||
                        tile.biome === BiomeType.RIVERBANK ||
                        tile.biome === BiomeType.DIRT || tile.biome === BiomeType.HILLS) {

                        let nearSettlement = false;
                        let nearWater = false;
                        let settlementScore = 0;
                        let waterScore = 0;

                        for (let dy = -5; dy <= 5; dy++) {
                            for (let dx = -5; dx <= 5; dx++) {
                                const nx = x + dx;
                                const ny = y + dy;
                                if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
                                    const dist = Math.hypot(dx, dy);
                                    const checkTile = tiles[ny][nx];

                                    // Prefer near settlements
                                    if ([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.FARMLAND].includes(checkTile.biome)) {
                                        nearSettlement = true;
                                        settlementScore += (6 - dist) * 0.5;
                                    }

                                    // Bonus if NOT near existing water sources (wells fill the gap)
                                    if ([BiomeType.RIVER, BiomeType.FRESHWATER_LAKE, BiomeType.WETLANDS].includes(checkTile.biome)) {
                                        nearWater = true;
                                        waterScore += 1;
                                    }
                                }
                            }
                        }

                        // Wells are most valuable away from natural water sources
                        if (nearSettlement) {
                            isValid = true;
                            // Higher score if near settlement but away from water
                            score = settlementScore + (nearWater ? 0 : 2);
                        } else if (tile.biome === BiomeType.DESERT) {
                            // Desert wells are valuable even without settlements
                            isValid = true;
                            score = nearWater ? 1 : 3;
                        } else if (!nearWater) {
                            // Wilderness wells in dry areas
                            isValid = true;
                            score = 0.5;
                        }
                    }
                    break;
            }

            if (isValid) {
                candidates.push({ tile, score, ...candidate });
            }
        }
    }
    return candidates;
}

export function generateTerrainStructures(mapData: MapData, noise: ValueNoise, region: string | undefined, societalProfile: SocietalProfile, hasCities: boolean = false, seed: number) {
    console.log("Generating terrain structures...");
    if (!mapData.terrainStructures) {
      mapData.terrainStructures = [];
    }
    const placedLocations = new Set<string>();

    const dateInfo = parseDateString(mapData.timeSlice || '1650');
    const culturalZone = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
    const regionName = region || Object.keys(GEOGRAPHICAL_DATA[culturalZone as CulturalZone] || {})[0] || 'DefaultRegion';
    const factionData = FACTION_DATA[culturalZone as CulturalZone]?.[regionName]?.[dateInfo.era as HistoricalEra];
    
    // Check if factories should be allowed based on era
    const factoriesAllowed = dateInfo.era !== 'PREHISTORY' && 
                            dateInfo.era !== 'ANTIQUITY' && 
                            dateInfo.era !== 'MEDIEVAL';
    
    // Get mine and quarry frequencies for current era
    const mineFrequency = MINE_FREQUENCY_BY_ERA[dateInfo.era as HistoricalEra] || 0.2;
    const quarryFrequency = QUARRY_FREQUENCY_BY_ERA[dateInfo.era as HistoricalEra] || 0.2;

    const mineralPotentialData = createMineralPotentialData(mapData.tiles, noise);

    // Add government_district to allowed structures if we have cities
    const structuresToGenerate = [...societalProfile.allowedStructures];
    if (hasCities && !structuresToGenerate.includes('government_district')) {
        structuresToGenerate.push('government_district');
    }
    
    for (const structureType of structuresToGenerate) {
        if (['farm', 'holy_site', 'palace', 'ruin'].includes(structureType)) continue;
        
        // Skip factories if not in appropriate era
        if (structureType === 'factory' && !factoriesAllowed) {
            continue;
        }
        
        // Skip mines and quarries based on era frequency
        if (structureType === 'mining_colony' && Math.random() > mineFrequency) {
            continue;
        }
        if (structureType === 'quarry' && Math.random() > quarryFrequency) {
            continue;
        }

        const candidates = findPlacementCandidates(mapData.tiles, structureType, mineralPotentialData);
        if (candidates.length === 0) continue;

        candidates.sort((a, b) => b.score - a.score);

        // Structure limits - more permissive for non-city maps to add variety
        let maxToPlace: number;
        if (!hasCities) {
            // Non-city maps can still have rural/wilderness industry
            maxToPlace = structureType === 'fishing_hut' ? 3 : // Coastal areas can have multiple fishing huts
                        structureType === 'lumber_camp' ? 2 : // Allow more lumber camps in forested areas
                        structureType === 'mining_colony' ? 2 : // Multiple mines possible
                        structureType === 'quarry' ? 2 : // Multiple quarries possible
                        structureType === 'mill' ? 1 : // Mills can exist in rural areas (water/windmills)
                        structureType === 'marketplace' ? 1 : // Rural markets/trading posts exist
                        structureType === 'factory' ? 1 : // Plantations, rural workshops in appropriate eras
                        structureType === 'government_district' ? 0 : // No government buildings without cities
                        structureType === 'farm' ? 3 : // Multiple farms in agricultural areas
                        structureType === 'waystation' ? 2 : // Rest stops along routes
                        structureType === 'well' ? 3 : // Water sources scattered across landscape
                        1;
        } else {
            // City maps can have normal structure counts
            maxToPlace = structureType === 'fishing_hut' ? 3 :
                        structureType === 'government_district' ? 1 : // Only one government building per city
                        structureType === 'factory' ? 3 : // Allow multiple factories per city
                        structureType === 'farm' ? 4 : // Multiple farms around cities
                        structureType === 'lumber_camp' ? 2 :
                        structureType === 'mining_colony' ? 2 :
                        structureType === 'waystation' ? 1 : // One waystation per city area
                        structureType === 'well' ? 2 : // Wells in city areas
                        1;
        }
        let placedCount = 0;

        for (const candidate of candidates) {
            if (placedCount >= maxToPlace) break;
            
            const posKey = `${candidate.tile.x},${candidate.tile.y}`;
            if (placedLocations.has(posKey)) continue;

            // Check distance from other structures
            let tooClose = false;
            for (const locStr of placedLocations) {
                const [lx, ly] = locStr.split(',').map(Number);
                if (Math.hypot(candidate.tile.x - lx, candidate.tile.y - ly) < 10) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;

            const blueprint = STRUCTURE_BLUEPRINTS[structureType];
            if (!blueprint) continue;
            
            // Handle factory types specially
            let finalStructure: TerrainStructure;
            
            if (structureType === 'factory' && factoriesAllowed) {
                const factoryType = getFactoryType(
                    dateInfo.era as HistoricalEra,
                    culturalZone as CulturalZone,
                    regionName
                );
                
                if (!factoryType) {
                    // No appropriate factory type for this era/region
                    continue;
                }
                
                finalStructure = {
                    id: `struct-${structureIdCounter++}`,
                    structureType,
                    name: factoryType.name,
                    location: [candidate.tile.x, candidate.tile.y],
                    economicRole: blueprint.economicRole,
                    npcAnchor: factoryType.npcAnchor,
                    state: 'active',
                    inputGoods: factoryType.inputGoods,
                    outputGoods: factoryType.outputGoods,
                    // Store factory subtype for rendering
                    factorySubtype: factoryType.id,
                    factorySymbolType: factoryType.symbolType
                } as TerrainStructure & { factorySubtype?: string; factorySymbolType?: string };
            } else {
                // Determine structure name based on type and era
                let name = '';
                if (structureType === 'mill') {
                    const year = dateInfo.year;
                    console.log(`[StructureGen] Determining mill type for year ${year}, era: ${dateInfo.era}`);
                    
                    if (year < -2000) {
                        name = 'Hand Quern';
                    } else if (year < 500) {
                        name = 'Animal Mill';
                    } else if (year < 1100) {
                        name = 'Water Mill';
                    } else if (year < 1500) {
                        // Mix of water and windmills
                        name = noise.random() > 0.5 ? 'Water Mill' : 'Windmill';
                    } else if (year < 1800) {
                        name = 'Windmill';
                    } else if (year < 1900) {
                        name = 'Steam Mill';
                    } else {
                        name = 'Electric Mill';
                    }
                    
                    console.log(`[StructureGen] Selected mill type: ${name} for year ${year}`);
                } else {
                    // Use region-specific faction data for naming, with fallbacks for missing data
                    const culturalNames = factionData?.structureNames?.[structureType];
                    
                    if (culturalNames && culturalNames.length > 0) {
                        // Use region-specific names from faction data
                        name = culturalNames[Math.floor(noise.random() * culturalNames.length)];
                        console.log(`[StructureGen] Using region-specific ${structureType} name: ${name} from faction data`);
                    } else {
                        // Fallback to era/culture-based naming for fortress and government districts
                        if (structureType === 'fortress') {
                            const year = dateInfo.year;
                            console.log(`[StructureGen] No region-specific fortress names, using fallback for year ${year}, culture: ${culturalZone}`);
                            
                            // Select fortress type based on culture and era - FIXED LOGIC
                            if (year >= 1900) {
                                // Modern era - always modern fort
                                name = 'Modern Fort';
                            } else if (year < -1000) {
                                // Prehistoric - hillfort
                                name = 'Hillfort';
                            } else if (year < 500) {
                                // Ancient era - culture specific
                                if (culturalZone === 'EUROPEAN' && regionName && (
                                    regionName.includes('Rome') || regionName.includes('Italy') || 
                                    regionName.includes('Gaul') || regionName.includes('Iberia') ||
                                    regionName.includes('Britain') || regionName.includes('Germania')
                                )) {
                                    name = 'Roman Castrum';
                                } else if (culturalZone === 'MENA' && year > -500) {
                                    name = 'Roman Castrum'; // Only in areas Rome actually controlled
                                } else if (culturalZone === 'EAST_ASIAN') {
                                    name = 'Chinese Fort';
                                } else {
                                    name = 'Hillfort'; // Default ancient fortification
                                }
                            } else if (year < 1400) {
                                // Medieval era
                                if (culturalZone === 'EAST_ASIAN') {
                                    name = 'Japanese Fortress';
                                } else {
                                    name = 'Medieval Castle';
                                }
                            } else if (year < 1700) {
                                // Renaissance/Early Modern
                                if ((culturalZone === 'NORTH_AMERICAN_COLONIAL' || culturalZone === 'SOUTH_AMERICAN') && year >= 1500) {
                                    name = 'Colonial Presidio';
                                } else {
                                    name = 'Star Fort';
                                }
                            } else if (year < 1900) {
                                // Industrial era
                                if (culturalZone === 'NORTH_AMERICAN_COLONIAL' || culturalZone === 'SOUTH_AMERICAN') {
                                    name = 'Colonial Presidio';
                                } else if (culturalZone === 'EAST_ASIAN') {
                                    name = 'Japanese Fortress';
                                } else {
                                    name = 'Star Fort';
                                }
                            } else {
                                name = 'Modern Fort'; // Fallback
                            }
                        } else if (structureType === 'government_district') {
                            const year = dateInfo.year;
                            console.log(`[StructureGen] No region-specific government names, using fallback for year ${year}, culture: ${culturalZone}`);
                            
                            // Select government building based on culture and era
                            if (culturalZone === 'EAST_ASIAN' && year < 1900) {
                                name = 'Mandate Hall';
                            } else if (culturalZone === 'MENA' && year < 1900) {
                                name = 'Caliph Court';
                            } else if ((culturalZone === 'NORTH_AMERICAN_COLONIAL' || culturalZone === 'SOUTH_AMERICAN') && year > 1500 && year < 1900) {
                                name = 'Colonial Office';
                            } else if (year < -500) {
                                name = 'Tribal Council';
                            } else if (year < 500) {
                                name = 'Roman Forum';
                            } else if (year < 1800) {
                                name = 'City Hall';
                            } else {
                                name = 'City Hall';
                            }
                        } else if (structureType === 'waystation') {
                            // Generate culturally appropriate waystation name
                            name = generateWaystationName(culturalZone, dateInfo.era, dateInfo.year, noise);
                            console.log(`[StructureGen] Generated waystation name: ${name} for culture: ${culturalZone}, era: ${dateInfo.era}`);
                        } else if (structureType === 'well') {
                            // Generate culturally appropriate well name
                            name = generateWellName(culturalZone, dateInfo.era, dateInfo.year, noise);
                            console.log(`[StructureGen] Generated well name: ${name} for culture: ${culturalZone}, era: ${dateInfo.era}`);
                        } else {
                            // Generic fallback for other structure types
                            name = structureType.replace(/_/g, ' ');
                        }
                    }
                }
                
                finalStructure = {
                    id: `struct-${structureIdCounter++}`,
                    structureType,
                    name: name,
                    location: [candidate.tile.x, candidate.tile.y],
                    economicRole: blueprint.economicRole,
                    npcAnchor: blueprint.npcAnchor,
                    state: 'active',
                    inputGoods: blueprint.inputGoods,
                    outputGoods: [...(blueprint.outputGoods || [])],
                };
                
                // Store era and cultural zone for fortresses, government districts, waystations, and wells
                if (structureType === 'fortress' || structureType === 'government_district' ||
                    structureType === 'waystation' || structureType === 'well') {
                    (finalStructure as any).era = dateInfo.era;
                    (finalStructure as any).culturalZone = culturalZone;
                    
                    // For government districts, determine and store the district type
                    if (structureType === 'government_district') {
                        // Use selectGovernmentType to get the district type
                        const govType = selectGovernmentType(
                            region,
                            culturalZone,
                            dateInfo.era,
                            candidate.tile.x,
                            candidate.tile.y,
                            seed
                        );
                        
                        if (govType) {
                            (finalStructure as any).districtType = govType.districtType;
                            // Also update the name to be more specific
                            finalStructure.name = govType.name;
                        }
                    }
                }
            }
            
            const newStructure = finalStructure;

            if (structureType === 'mining_colony') {
                // Use era-specific mine materials instead of generic metals
                const mineMaterial = getRandomMaterial(dateInfo.era as HistoricalEra, 'mine');
                if (mineMaterial) {
                    newStructure.name = `${mineMaterial.name} Mine`;
                    newStructure.mineralDeposits = { [mineMaterial.id]: Math.floor(Math.random() * 10000 + 5000) };
                    newStructure.outputGoods = [mineMaterial.id.toUpperCase()];
                    (newStructure as any).era = dateInfo.era; // Store era for symbol selection
                } else if (candidate.bestMetal && candidate.bestMetalScore) {
                    // Fallback to old system if no era-specific material
                    const oreItemId = METALS[candidate.bestMetal]?.oreItemId || `${candidate.bestMetal}_ORE`;
                    newStructure.name = `${METALS[candidate.bestMetal].name} Mine`;
                    newStructure.mineralDeposits = { [candidate.bestMetal]: Math.floor(candidate.bestMetalScore * 20000) };
                    newStructure.outputGoods = [oreItemId];
                    (newStructure as any).era = dateInfo.era;
                }
            }
            
            if (structureType === 'quarry') {
                // Add era-specific quarry materials
                const quarryMaterial = getRandomMaterial(dateInfo.era as HistoricalEra, 'quarry');
                if (quarryMaterial) {
                    newStructure.name = `${quarryMaterial.name} Quarry`;
                    newStructure.mineralDeposits = { [quarryMaterial.id]: Math.floor(Math.random() * 15000 + 8000) };
                    newStructure.outputGoods = [quarryMaterial.id.toUpperCase()];
                    (newStructure as any).era = dateInfo.era; // Store era for symbol selection
                }
            }

            mapData.terrainStructures.push(newStructure);
            placedLocations.add(posKey);
            placedCount++;
            
            // Register structure with World Entity Registry
            worldEntityRegistry.registerStructure(newStructure);
        }
    }

    // Phase 3 Logic: Allegiance and Ruined State
    const fortresses = mapData.terrainStructures.filter(s => s.structureType === 'fortress');
    const otherStructures = mapData.terrainStructures.filter(s => s.structureType !== 'fortress');
    const dominantPower = factionData?.dominantPower || 'Local Militia';
    
    fortresses.forEach((fort) => {
        fort.allegianceGroup = dominantPower;
    });

    otherStructures.forEach(structure => {
        let closestFortress: TerrainStructure | null = null;
        let minDistance = Infinity;

        fortresses.forEach(fort => {
            const dist = Math.hypot(structure.location[0] - fort.location[0], structure.location[1] - fort.location[1]);
            if (dist < minDistance) {
                minDistance = dist;
                closestFortress = fort;
            }
        });

        if (closestFortress && minDistance < 25) { // Sphere of influence
            structure.allegianceGroup = closestFortress.allegianceGroup;
        } else {
            const secondaryPowers = factionData?.allegianceGroups
                .filter(group => group.type === 'secondary')
                .map(group => group.name);
            if (secondaryPowers && secondaryPowers.length > 0 && noise.random() < 0.4) {
                structure.allegianceGroup = secondaryPowers[Math.floor(noise.random() * secondaryPowers.length)];
            } else {
                 structure.allegianceGroup = 'Neutral';
            }
        }

        // Ruined state logic
        if (noise.random() < 0.15) {
            structure.state = 'ruined';
        }
    });

    // Assign allegiance and religion breakdown to settlements
    const settlementBiomes = new Set([BiomeType.DENSE_CITY, BiomeType.LOW_DENSITY_CITY, BiomeType.HAMLET, BiomeType.CITY_CENTER, BiomeType.MARKETPLACE, BiomeType.FARMLAND]);
    mapData.tiles.flat().forEach(tile => {
        if (settlementBiomes.has(tile.biome)) {
            // Allegiance calculation
            let closestFortress: TerrainStructure | null = null;
            let minDistance = Infinity;
            fortresses.forEach(fort => {
                const dist = Math.hypot(tile.x - fort.location[0], tile.y - fort.location[1]);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestFortress = fort;
                }
            });
            
            const dominantFactionKey = mapData.majorCity?.allegiance || dominantPower;

            if (closestFortress) {
                const loyaltyFactor = Math.max(0, 1 - (minDistance / 40)); // Loyalty drops off over 40 tiles
                const dominantAllegiance = closestFortress.allegianceGroup || dominantPower;
                tile.allegianceBreakdown = {
                    [dominantAllegiance]: loyaltyFactor,
                    'Unaligned': 1 - loyaltyFactor
                };
            } else {
                 tile.allegianceBreakdown = { 'Unaligned': 1 };
            }

            // Religion calculation
            const religionCounts = new Map<string, number>();
            const sampleSize = Math.min(100, tile.population || 20);
            if (sampleSize > 0) {
                for (let i = 0; i < sampleSize; i++) {
                    const religion = determineReligion(culturalZone, regionName, dateInfo.era as HistoricalEra, noise);
                    religionCounts.set(religion, (religionCounts.get(religion) || 0) + 1);
                }
            }
            
            const totalCount = Array.from(religionCounts.values()).reduce((a, b) => a + b, 0);
            if (totalCount > 0) {
                 tile.dominantReligions = Array.from(religionCounts.entries())
                    .map(([name, count]) => ({ name, percentage: count / totalCount }))
                    .sort((a, b) => b.percentage - a.percentage)
                    .slice(0, 3);
            } else {
                tile.dominantReligions = [];
            }
        }
    });
    
     console.log(`Generated ${mapData.terrainStructures.length} terrain structures.`);
     console.log('[StructureGen] Structure types generated:', mapData.terrainStructures.map(s => s.structureType));
}