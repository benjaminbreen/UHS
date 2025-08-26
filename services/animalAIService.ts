/**
 * services/animalAIService.ts - Enhanced animal AI behavior for standard maps
 */
import { AnimalEntity, Point, Tile, MapData, BiomeType } from '../types';
import { ANIMAL_DATA } from '../constants/index';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES } from '../constants/index';

interface AIMemory {
    lastSeen: Point | null;
    timeSinceSeen: number;
    lastDirection: Point | null;
    stuckCounter: number;
    homeTerritory: Point | null;
    patrolRoute: Point[];
    currentPatrolIndex: number;
}

interface AIConfig {
    PLAYER_DETECTION_RADIUS: number;
    FLEE_DISTANCE: number;
    ATTACK_DISTANCE: number;
    CHASE_DISTANCE: number;
    WANDER_RADIUS: number;
}

const AI_CONFIG: AIConfig = {
    PLAYER_DETECTION_RADIUS: 8,
    FLEE_DISTANCE: 6,
    ATTACK_DISTANCE: 1.5,
    CHASE_DISTANCE: 12,
    WANDER_RADIUS: 10,
};

const animalMemories = new Map<string, AIMemory>();

function getAnimalMemory(animalId: string, currentPos: Point): AIMemory {
    if (!animalMemories.has(animalId)) {
        animalMemories.set(animalId, {
            lastSeen: null,
            timeSinceSeen: 0,
            lastDirection: { x: Math.random() > 0.5 ? 1 : -1, y: 0 },
            stuckCounter: 0,
            homeTerritory: { ...currentPos },
            patrolRoute: [],
            currentPatrolIndex: 0
        });
    }
    return animalMemories.get(animalId)!;
}

function getNeighbors(x: number, y: number, map: MapData): Tile[] {
    const neighbors: Tile[] = [];
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (ny >= 0 && ny < map.height && nx >= 0 && nx < map.width) {
                neighbors.push(map.tiles[ny][nx]);
            }
        }
    }
    return neighbors;
}

function isNearLand(x: number, y: number, tiles: Tile[][], distance: number): boolean {
    for (let dy = -distance; dy <= distance; dy++) {
        for (let dx = -distance; dx <= distance; dx++) {
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

function getTerrainPreference(animal: AnimalEntity, tile: Tile, map: MapData): number {
    const animalData = ANIMAL_DATA[animal.baseId];
    if (!animalData) return 0.5;

    // Aquatic animals
    if (animalData.habitat === 'aquatic') {
        if (tile.isLand || isNearLand(tile.x, tile.y, map.tiles, 2)) {
            return 0; // Avoid land and coastlines
        }
        return 1.0; // Prefer any water tile far from land
    }

    // Land animals
    if (animalData.spawnBiomes.includes(tile.biome)) {
        return 1.0;
    }
    
    const waterBiomes = [BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN, BiomeType.RIVER, BiomeType.FRESHWATER_LAKE, BiomeType.ESTUARY];
    if (waterBiomes.includes(tile.biome)) {
        return 0.01; // Most land animals avoid water
    }
    
    // Impassable terrain - animals cannot traverse these
    const impassableBiomes = [BiomeType.ACTIVE_LAVA, BiomeType.CLIFF, BiomeType.MOUNTAIN, BiomeType.HIGH_PEAK];
    if (impassableBiomes.includes(tile.biome)) {
        return 0; // Animals cannot walk on cliffs, mountains, or lava
    }
    
    return 0.5; // Neutral preference for other land biomes
}

export function calculateAnimalUpdate(
    animal: AnimalEntity, 
    allAnimals: AnimalEntity[],
    playerPos: Point,
    map: MapData
): Partial<AnimalEntity> {
    const memory = getAnimalMemory(animal.id, animal);
    const animalData = ANIMAL_DATA[animal.baseId];
    if (!animalData) return {};
    
    // Flotsam does not move.
    if (animal.baseId === 'FLOTSAM') {
        return {};
    }
    
    memory.timeSinceSeen++;
    
    const playerDist = Math.hypot(animal.x - playerPos.x, animal.y - playerPos.y);
    const canSeePlayer = playerDist <= AI_CONFIG.PLAYER_DETECTION_RADIUS;
    
    let newState = animal.aiState;
    let targetPos: Point | null = null;
    
    // --- State Transitions ---
    if(animal.type === 'Predator' && canSeePlayer) {
        newState = playerDist <= AI_CONFIG.ATTACK_DISTANCE ? 'attacking' : 'chasing';
        targetPos = playerPos;
    } else if (animal.type === 'Prey' && canSeePlayer) {
        newState = 'fleeing';
        targetPos = playerPos;
    } else {
        if(newState !== 'wandering' && newState !== 'idle') {
            newState = 'wandering';
        }
    }

    // --- Movement Calculation ---
    let nextPos = { x: animal.x, y: animal.y };
    const allNeighbors = getNeighbors(animal.x, animal.y, map);
    
    // Define city biomes that wild animals should avoid
    const cityBiomes = [
        BiomeType.HAMLET,
        BiomeType.LOW_DENSITY_CITY,
        BiomeType.DENSE_CITY,
        BiomeType.URBAN,
        BiomeType.PALACE,
        BiomeType.MARKETPLACE,
        BiomeType.GOVERNMENT_DISTRICT,
        BiomeType.CITY_CENTER
    ];
    
    // Create set of occupied tiles by other animals
    const occupiedTiles = new Set<string>();
    allAnimals.forEach(otherAnimal => {
        if (otherAnimal.id !== animal.id) {
            occupiedTiles.add(`${otherAnimal.x},${otherAnimal.y}`);
        }
    });

    let walkableNeighbors: Tile[];

    if (animalData.habitat === 'aquatic') {
        walkableNeighbors = allNeighbors.filter(n => {
            // Check if tile is occupied by another animal
            const isOccupied = occupiedTiles.has(`${n.x},${n.y}`);
            return !n.isLand && !isNearLand(n.x, n.y, map.tiles, 2) && !isOccupied;
        });
    } else {
        // For land animals, filter out water AND city tiles (unless domestic)
        walkableNeighbors = allNeighbors.filter(n => {
            const isWalkableTerrain = n.isLand || n.biome === BiomeType.SHOALS_TILE;
            // Wild animals (non-domestic) should avoid city tiles
            const isCityTile = cityBiomes.includes(n.biome);
            const canEnterCity = animal.isDomestic || !isCityTile;
            
            // Check if tile is occupied by another animal
            const isOccupied = occupiedTiles.has(`${n.x},${n.y}`);
            
            // Domestic animals must stay within paddocks
            if (animal.isDomestic) {
                const currentTile = map.tiles[animal.y][animal.x];
                // If the animal is in a paddock, it can only move to other paddock tiles
                if (currentTile.paddockType === 'Livestock') {
                    return isWalkableTerrain && n.paddockType === 'Livestock' && !isOccupied;
                }
                // If somehow outside a paddock, try to find one
                return isWalkableTerrain && n.paddockType === 'Livestock' && !isOccupied;
            }
            
            return isWalkableTerrain && canEnterCity && !isOccupied;
        });
    }
    
    if(walkableNeighbors.length === 0) {
        memory.stuckCounter++;
        return { aiState: newState };
    }
    memory.stuckCounter = 0;

    switch (newState) {
        case 'fleeing':
            if (targetPos) {
                let bestTile: Tile | null = null;
                let maxDist = -1;
                for (const neighbor of walkableNeighbors) {
                    const distToThreat = Math.hypot(neighbor.x - targetPos.x, neighbor.y - targetPos.y);
                    if (distToThreat > maxDist) {
                        maxDist = distToThreat;
                        bestTile = neighbor;
                    }
                }
                if (bestTile) nextPos = { x: bestTile.x, y: bestTile.y };
            }
            break;

        case 'chasing':
        case 'attacking':
             if (targetPos) {
                let bestTile: Tile | null = null;
                let minDist = Infinity;
                for (const neighbor of walkableNeighbors) {
                    const distToTarget = Math.hypot(neighbor.x - targetPos.x, neighbor.y - targetPos.y);
                    if (distToTarget < minDist) {
                        minDist = distToTarget;
                        bestTile = neighbor;
                    }
                }
                if (bestTile) nextPos = { x: bestTile.x, y: bestTile.y };
            }
            break;
            
        case 'wandering':
            // Domestic animals should move much less frequently
            // Since this is called every 2 seconds, we want movement every 10-15 seconds
            // That means a 13.3% to 20% chance of movement per tick (2/15 to 2/10)
            const moveChance = animal.isDomestic ? (0.133 + Math.random() * 0.067) : 1.0; // 13.3% to 20% for domestic, 100% for wild
            
            if (Math.random() < moveChance) {
                const weights = walkableNeighbors.map(n => getTerrainPreference(animal, n, map));
                const totalWeight = weights.reduce((a, b) => a + b, 0);
                let random = Math.random() * totalWeight;
                for (let i = 0; i < walkableNeighbors.length; i++) {
                    random -= weights[i];
                    if (random <= 0) {
                        nextPos = { x: walkableNeighbors[i].x, y: walkableNeighbors[i].y };
                        break;
                    }
                }
            }
            // If we don't move, stay in the same position
            break;
    }

    if (nextPos.x !== animal.x || nextPos.y !== animal.y) {
        memory.lastDirection = { x: nextPos.x - animal.x, y: nextPos.y - animal.y };
    }
    
    return { aiState: newState, x: nextPos.x, y: nextPos.y };
}

export function cleanupAnimalMemory(animalId: string) {
    animalMemories.delete(animalId);
}