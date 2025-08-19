/**
 * generation/standardMap/features/AnimalGenerator.ts - Generates animal presence for Standard Maps.
 */
import { Tile, ClimateType, AnimalEntity, AnimalSpecies, BiomeType, MapData, CulturalZone } from '../../../types/index';
import { ANIMAL_DATA, SPECIES_DATA } from '../../../constants/index';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES } from '../../../constants/index';
import { ValueNoise } from '../../../utils/noise';
import { mapLocationToCulture } from '../../../utils/mapUtils';
import { parseDateString } from '../../../utils/dateUtils';
import DiseaseService from '../../../services/diseaseService';
import { HistoricalEra } from '../../../types';

let animalIdCounter = 0;

function isNearLand(x: number, y: number, tiles: Tile[][], distance: number): boolean {
    for (let dy = -distance; dy <= distance; dy++) {
        for (let dx = -distance; dx <= distance; dx++) {
            if (dx === 0 && dy === 0) continue;
            const checkX = x + dx;
            const checkY = y + dy;
            if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
                if (tiles[checkY][checkX].isLand) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Tries to spawn a single animal on a valid tile.
 * @param mapData The full map data object.
 * @param noise A ValueNoise instance for randomness.
 * @param occupiedTiles A Set of coordinates (e.g., "x,y") that are already occupied.
 * @returns A new AnimalEntity or null if no valid spot/animal could be found.
 */
export function spawnSingleAnimal(
    mapData: MapData,
    noise: ValueNoise,
    occupiedTiles: Set<string>,
    culturalZone: CulturalZone,
    region: string
): AnimalEntity | null {
    const maxAttempts = 50; // Try 50 times to find a spot
    for (let i = 0; i < maxAttempts; i++) {
        const x = Math.floor(noise.random() * MAP_WIDTH_TILES);
        const y = Math.floor(noise.random() * MAP_HEIGHT_TILES);
        const tile = mapData.tiles[y][x];
        
        if (occupiedTiles.has(`${x},${y}`)) {
            continue;
        }

        for (const animalKey in ANIMAL_DATA) {
            const animalData = ANIMAL_DATA[animalKey];
            
            if (animalData.habitat === 'aquatic' ? (tile.isLand || isNearLand(x, y, mapData.tiles, 2)) : !tile.isLand) continue;
            if (!animalData.spawnBiomes.includes(tile.biome)) continue;
            
            // Geographic and Climate Checks
            if (animalData.spawnConditions.climate && !animalData.spawnConditions.climate.includes(mapData.climate)) continue;
            if (animalData.spawnConditions.zones && !animalData.spawnConditions.zones.includes(culturalZone)) continue;
            if (animalData.spawnConditions.regions && !animalData.spawnConditions.regions.includes(region)) continue;

            // Quality Checks
            if (animalData.spawnConditions.minBiodiversity && tile.qualities.biodiversity < animalData.spawnConditions.minBiodiversity) continue;
            if (animalData.spawnConditions.maxSafety && tile.qualities.safety > animalData.spawnConditions.maxSafety) continue;
            if (animalData.spawnConditions.minSafety && tile.qualities.safety < animalData.spawnConditions.minSafety) continue;
            
            let baseChance = 0.05;
            if (animalKey === 'WHALE') baseChance *= 0.05;
            else if (animalData.habitat === 'aquatic') baseChance *= 0.3;
            if (animalKey === 'FLOTSAM') baseChance *= 0.1; // Make flotsam 10x rarer

            const biodiversityBonus = tile.qualities.biodiversity * 0.1;
            const finalChance = baseChance + biodiversityBonus;

            if (noise.random() < finalChance) {
                let speciesList: AnimalSpecies[] | undefined;
                const speciesDataForAnimal = SPECIES_DATA[animalKey];
                if (speciesDataForAnimal) {
                    if (speciesDataForAnimal[culturalZone]) {
                        speciesList = speciesDataForAnimal[culturalZone];
                    } else if (speciesDataForAnimal[mapData.climate]) {
                        speciesList = speciesDataForAnimal[mapData.climate];
                    } else {
                        // Fallback logic
                        speciesList = speciesDataForAnimal['EUROPEAN'] || speciesDataForAnimal[ClimateType.TEMPERATE];
                    }
                }
                const chosenSpecies: AnimalSpecies | undefined = speciesList?.[Math.floor(noise.random() * speciesList.length)];

                const maxHealth = Math.max(1, animalData.maxHealth + Math.floor((noise.random() - 0.5) * 4));

                const stats = {
                    level: Math.max(1, animalData.level + Math.floor((noise.random() - 0.5) * 2)),
                    attack: Math.max(0, animalData.attack + Math.floor((noise.random() - 0.5) * 3)),
                    defense: Math.max(0, animalData.defense + Math.floor((noise.random() - 0.5) * 3)),
                    speed: Math.max(1, animalData.speed + Math.floor((noise.random() - 0.5) * 4)),
                    strength: Math.max(1, animalData.strength + Math.floor((noise.random() - 0.5) * 4)),
                    agility: Math.max(1, animalData.agility + Math.floor((noise.random() - 0.5) * 4)),
                    perception: Math.max(1, animalData.perception + Math.floor((noise.random() - 0.5) * 4)),
                    luck: Math.max(1, 5 + Math.floor((noise.random() - 0.5) * 6)),
                };
                
                // Initialize disease health with potential disease (25% chance for wild animals)
                const diseaseService = DiseaseService.getInstance();
                const shouldHaveDisease = noise.random() < 0.25; // 25% chance for animals
                
                let diseaseHealth = undefined;
                if (shouldHaveDisease) {
                    // Get context for disease assignment
                    const dateInfo = parseDateString(mapData.timeSlice || '1650');
                    const era = dateInfo.era || HistoricalEra.MEDIEVAL;
                    
                    diseaseHealth = diseaseService.assignDiseasesToEntity(
                        { health: undefined } as any,
                        era,
                        culturalZone,
                        dateInfo.year
                    );
                    
                    if (diseaseHealth && diseaseHealth.currentDiseases.length > 0) {
                        const disease = diseaseHealth.currentDiseases[0].disease;
                        console.log(`[Animal Disease Spawn] ${chosenSpecies?.name || animalData.name} spawned with ${disease.name} at (${x}, ${y}) - 25% chance`);
                        if (disease.symptoms && disease.symptoms.length > 0) {
                            console.log(`  → Symptoms: ${disease.symptoms.join(', ')}`);
                        }
                    }
                }

                return {
                    id: `animal-${animalIdCounter++}`, baseId: animalKey,
                    speciesName: chosenSpecies?.name || animalData.name,
                    linnaeanName: chosenSpecies?.linnaeanName || 'N/A',
                    emoji: chosenSpecies?.emoji || animalData.emoji,
                    x, y,
                    age: 1 + Math.floor(noise.random() * 15),
                    isDomestic: animalData.type === 'Domestic',
                    health: maxHealth,
                    maxHealth: maxHealth,
                    stats,
                    type: animalData.type,
                    aiState: 'wandering', target: null,
                    statusEffects: [],
                    diseaseHealth // Add disease health with potential disease
                };
            }
        }
    }
    return null; // No animal spawned
}

export function generateAnimalsForMap(
  mapData: MapData,
  noise: ValueNoise
): AnimalEntity[] {
    const animals: AnimalEntity[] = [];
    const occupiedTiles = new Set<string>();
    const numToSpawn = 4 + Math.floor(noise.random() * 4); // Spawn 4-7 animals initially

    const dateInfo = parseDateString(mapData.timeSlice || '1650');
    const culturalZone = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
    const region = mapData.localArea || 'Unknown'; // Use localArea as region for specificity

    while (animals.length < numToSpawn) {
        const newAnimal = spawnSingleAnimal(mapData, noise, occupiedTiles, culturalZone, region);
        if (newAnimal) {
            animals.push(newAnimal);
            occupiedTiles.add(`${newAnimal.x},${newAnimal.y}`);
        } else {
            // If we fail to spawn an animal after many tries, break to avoid infinite loop
            if (occupiedTiles.size >= MAP_WIDTH_TILES * MAP_HEIGHT_TILES) break;
        }
    }
    
    console.log(`[Gen] Spawned ${animals.length} initial animals.`);
    return animals;
}