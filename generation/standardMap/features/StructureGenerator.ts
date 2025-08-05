/**
 * generation/standardMap/features/StructureGenerator.ts - Places functional structures on the map.
 */
import { Tile, MapData, TerrainStructure, BiomeType, TerrainStructureType, Allegiance, CulturalZone, HistoricalEra, MetalDefinition, SocietalProfile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';
import { STRUCTURE_BLUEPRINTS, MAP_WIDTH_TILES, MAP_HEIGHT_TILES, FACTION_DATA, METALS, GEOGRAPHICAL_DATA } from '../../../constants/index';
import { mapLocationToCulture } from '../../../utils/mapUtils';
import { parseDateString } from '../../../utils/dateUtils';
import { determineReligion } from '../../common/npcUtils';


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
        BiomeType.DENSE_CITY, BiomeType.LOW_DENSITY_CITY, BiomeType.HAMLET
    ]);

    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const tile = tiles[y][x];
            if (!tile.isLand || unplaceableBiomes.has(tile.biome)) continue;

            let score = 0;
            let isValid = false;
            let candidate: Partial<Candidate> = {};

            switch(structureType) {
                case 'mill':
                    if (tile.biome === BiomeType.GRASSLAND || tile.biome === BiomeType.RIVERBANK) {
                        let isNearRiver = false;
                        let farmTilesNearby = 0;
                        for (let dy = -5; dy <= 5; dy++) {
                            for (let dx = -5; dx <= 5; dx++) {
                                const nx = x + dx;
                                const ny = y + dy;
                                if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
                                    if(Math.hypot(dx, dy) <= 1 && tiles[ny][nx].biome === BiomeType.RIVER) isNearRiver = true;
                                    if(tiles[ny][nx].biome === BiomeType.FARMLAND) farmTilesNearby++;
                                }
                            }
                        }
                        if (isNearRiver) {
                            isValid = true;
                            score = farmTilesNearby;
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
                     if (tile.biome === BiomeType.FOREST || tile.biome === BiomeType.GRASSLAND) {
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
                        if (forestTilesNearby > 3) {
                             isValid = true;
                             score = forestTilesNearby;
                        }
                    }
                    break;
                case 'fishing_hut':
                    if(tile.isCoast && tile.biome === BiomeType.BEACH) {
                        isValid = true;
                        score = 1; // Simple placement for now
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
                case 'trading_post':
                    let isNearUrban = false;
                    for (let dy = -8; dy <= 8; dy++) {
                        for (let dx = -8; dx <= 8; dx++) {
                             const nx = x + dx; const ny = y + dy;
                             if(nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
                                 const neighborBiome = tiles[ny][nx].biome;
                                 if ([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.CITY_CENTER].includes(neighborBiome)) {
                                     isNearUrban = true; break;
                                 }
                             }
                        }
                        if(isNearUrban) break;
                    }
                    if (isNearUrban) {
                        isValid = true;
                        score = tile.qualities.safety;
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

export function generateTerrainStructures(mapData: MapData, noise: ValueNoise, region: string | undefined, societalProfile: SocietalProfile) {
    console.log("Generating terrain structures...");
    if (!mapData.terrainStructures) {
      mapData.terrainStructures = [];
    }
    const placedLocations = new Set<string>();

    const dateInfo = parseDateString(mapData.timeSlice || '1650');
    const culturalZone = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
    const regionName = region || Object.keys(GEOGRAPHICAL_DATA[culturalZone as CulturalZone] || {})[0] || 'DefaultRegion';
    const factionData = FACTION_DATA[culturalZone as CulturalZone]?.[regionName]?.[dateInfo.era as HistoricalEra];

    const mineralPotentialData = createMineralPotentialData(mapData.tiles, noise);

    for (const structureType of societalProfile.allowedStructures) {
        if (['farm', 'holy_site', 'palace', 'ruin'].includes(structureType)) continue;

        const candidates = findPlacementCandidates(mapData.tiles, structureType, mineralPotentialData);
        if (candidates.length === 0) continue;

        candidates.sort((a, b) => b.score - a.score);

        const maxToPlace = structureType === 'fishing_hut' ? 2 : 1;
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
            
            const culturalNames = factionData?.structureNames?.[structureType] || [structureType.replace(/_/g, ' ')];
            const name = culturalNames[Math.floor(noise.random() * culturalNames.length)];


            const newStructure: TerrainStructure = {
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

            if (structureType === 'mining_colony' && candidate.bestMetal && candidate.bestMetalScore) {
                const oreItemId = METALS[candidate.bestMetal]?.oreItemId || `${candidate.bestMetal}_ORE`;
                newStructure.name = `${METALS[candidate.bestMetal].name} Mine`;
                newStructure.mineralDeposits = { [candidate.bestMetal]: Math.floor(candidate.bestMetalScore * 20000) };
                if (newStructure.outputGoods) {
                    newStructure.outputGoods.push(oreItemId);
                } else {
                    newStructure.outputGoods = [oreItemId];
                }
            }

            mapData.terrainStructures.push(newStructure);
            placedLocations.add(posKey);
            placedCount++;
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
}