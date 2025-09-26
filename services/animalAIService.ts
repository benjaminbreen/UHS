/**
 * services/animalAIService.ts - Enhanced animal AI behavior for standard maps
 */
import { AnimalEntity, NpcEntity, Point, Tile, MapData, BiomeType } from '../types';
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
    // Prey-specific memory
    adrenalineTimer?: number;
    lastThreatPosition?: Point;
    // Predator-specific memory
    stalkingTarget?: string;
    stalkingTimer?: number;
    lastHuntSuccess?: number;
    hunger?: number;
}

interface AIConfig {
    PLAYER_DETECTION_RADIUS: number;
    FLEE_DISTANCE: number;
    ATTACK_DISTANCE: number;
    CHASE_DISTANCE: number;
    WANDER_RADIUS: number;
}

const AI_CONFIG: AIConfig = {
    PLAYER_DETECTION_RADIUS: 12, // Increased from 8 - prey animals detect threats earlier
    FLEE_DISTANCE: 10, // Increased from 5 - prey animals flee further
    ATTACK_DISTANCE: 1.5,
    CHASE_DISTANCE: 12,
    WANDER_RADIUS: 10,
};

// Urban tile types that wild animals should avoid
const URBAN_BIOME_TYPES = new Set([
    BiomeType.HAMLET,
    BiomeType.LOW_DENSITY_CITY,
    BiomeType.DENSE_CITY,
    BiomeType.CITY_CENTER,
    BiomeType.MARKETPLACE,
    BiomeType.GOVERNMENT_DISTRICT,
    BiomeType.PALACE,
    BiomeType.URBAN
]);

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
            currentPatrolIndex: 0,
            // Initialize predator-specific values
            hunger: 50,
            adrenalineTimer: 0
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

/**
 * Calculate how much an animal should avoid urban areas
 */
function getUrbanAvoidanceMultiplier(animal: AnimalEntity, tile: Tile, map: MapData): number {
    const animalData = ANIMAL_DATA[animal.baseId];
    if (!animalData) return 1.0;

    // Check if current tile is urban
    if (URBAN_BIOME_TYPES.has(tile.biome)) {
        // Apex predators (large predators) strongly avoid cities
        if (animal.type === 'Predator' && animalData.size === 'large') {
            return 0.01; // 99% avoidance
        }
        // Regular predators moderately avoid
        if (animal.type === 'Predator') {
            return 0.1; // 90% avoidance
        }
        // Prey animals somewhat avoid (except urban-tolerant species)
        if (animal.type === 'Prey') {
            const urbanTolerant = ['RAT', 'PIGEON', 'STRAY_DOG', 'STRAY_CAT', 'SPARROW'];
            if (urbanTolerant.includes(animal.baseId)) {
                return 1.0; // No avoidance for urban species
            }
            return 0.3; // 70% avoidance for wild prey
        }
        // Domestic animals are fine in urban areas
        if (animal.isDomestic) {
            return 1.0;
        }
    }

    // Check proximity to urban areas (within 5 tiles for predators, 3 for prey)
    const scanRadius = animal.type === 'Predator' ? 5 : 3;
    let nearbyUrbanCount = 0;

    for (let dy = -scanRadius; dy <= scanRadius; dy++) {
        for (let dx = -scanRadius; dx <= scanRadius; dx++) {
            if (Math.abs(dx) + Math.abs(dy) > scanRadius) continue; // Manhattan distance

            const checkY = tile.y + dy;
            const checkX = tile.x + dx;
            if (checkY >= 0 && checkY < map.height && checkX >= 0 && checkX < map.width) {
                if (URBAN_BIOME_TYPES.has(map.tiles[checkY][checkX].biome)) {
                    nearbyUrbanCount++;
                }
            }
        }
    }

    // Apply proximity penalty
    if (nearbyUrbanCount > 0) {
        if (animal.type === 'Predator' && animalData.size === 'large') {
            // Apex predators strongly avoid even being near cities
            return Math.max(0.1, 1 - (nearbyUrbanCount * 0.15));
        } else if (animal.type === 'Predator') {
            return Math.max(0.3, 1 - (nearbyUrbanCount * 0.1));
        } else if (animal.type === 'Prey') {
            const urbanTolerant = ['RAT', 'PIGEON', 'STRAY_DOG', 'STRAY_CAT', 'SPARROW'];
            if (urbanTolerant.includes(animal.baseId)) {
                return 1.0; // No avoidance
            }
            return Math.max(0.5, 1 - (nearbyUrbanCount * 0.05));
        }
    }

    return 1.0; // No penalty for rural areas
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
    let preference = 0.5; // Base preference

    if (animalData.spawnBiomes.includes(tile.biome)) {
        preference = 1.0; // Preferred biome
    }

    const waterBiomes = [BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN, BiomeType.RIVER, BiomeType.FRESHWATER_LAKE, BiomeType.ESTUARY];
    if (waterBiomes.includes(tile.biome)) {
        preference = 0.01; // Most land animals avoid water
    }

    // Impassable terrain - animals cannot traverse these
    const impassableBiomes = [BiomeType.ACTIVE_LAVA, BiomeType.CLIFF, BiomeType.MOUNTAIN, BiomeType.HIGH_PEAK];
    if (impassableBiomes.includes(tile.biome)) {
        preference = 0; // Animals cannot walk on cliffs, mountains, or lava
    }

    // Apply urban avoidance multiplier
    const urbanAvoidance = getUrbanAvoidanceMultiplier(animal, tile, map);

    return preference * urbanAvoidance;
}

export function calculateAnimalUpdate(
    animal: AnimalEntity,
    allAnimals: AnimalEntity[],
    playerPos: Point,
    map: MapData,
    allNpcs?: NpcEntity[]
): Partial<AnimalEntity> {
    const memory = getAnimalMemory(animal.id, animal);
    const animalData = ANIMAL_DATA[animal.baseId];
    if (!animalData) return {};

    // Flotsam does not move.
    if (animal.baseId === 'FLOTSAM') {
        return {};
    }

    memory.timeSinceSeen++;

    // Performance optimization: Skip frequent updates for distant animals
    const playerDist = Math.hypot(animal.x - playerPos.x, animal.y - playerPos.y);
    if (playerDist > 30 && Math.random() > 0.3) {
        // Far animals only update 30% of the time
        return {};
    }

    const canSeePlayer = playerDist <= AI_CONFIG.PLAYER_DETECTION_RADIUS;
    
    // Enhanced flight distances for prey based on size
    const PREY_FLIGHT_DISTANCES = {
        small: 3,   // Rabbits, squirrels flee at 3 tiles
        medium: 5,  // Deer flee at 5 tiles
        large: 7    // Elk, moose flee at 7 tiles
    };

    // Check for threats and prey
    let nearestThreat: Point | null = null;
    let nearestThreatDist = Infinity;
    let nearestPrey: AnimalEntity | null = null;
    let nearestPreyDist = Infinity;

    if (animal.type === 'Prey') {
        const flightDistance = PREY_FLIGHT_DISTANCES[animalData.size as keyof typeof PREY_FLIGHT_DISTANCES] || 4;

        // Check player proximity with enhanced detection
        if (playerDist <= flightDistance) {
            nearestThreat = playerPos;
            nearestThreatDist = playerDist;
            memory.adrenalineTimer = 10; // Stay alert for 10 ticks
            memory.lastThreatPosition = playerPos;
        }

        // Check for predator animals
        for (const otherAnimal of allAnimals) {
            if (otherAnimal.type === 'Predator' && otherAnimal.id !== animal.id) {
                const predDist = Math.hypot(animal.x - otherAnimal.x, animal.y - otherAnimal.y);
                if (predDist <= flightDistance * 1.5) { // Flee from predators at greater distance
                    if (predDist < nearestThreatDist) {
                        nearestThreat = { x: otherAnimal.x, y: otherAnimal.y };
                        nearestThreatDist = predDist;
                        memory.adrenalineTimer = 15; // Stay extra alert for predators
                        memory.lastThreatPosition = { x: otherAnimal.x, y: otherAnimal.y };
                    }
                }
            }
        }

        // Check NPCs as threats
        if (allNpcs) {
            for (const npc of allNpcs) {
                const npcDist = Math.hypot(animal.x - npc.x, animal.y - npc.y);
                if (npcDist <= flightDistance && npcDist < nearestThreatDist) {
                    nearestThreat = { x: npc.x, y: npc.y };
                    nearestThreatDist = npcDist;
                    memory.adrenalineTimer = 8;
                }
            }
        }

        // Maintain alertness if adrenaline is active
        if (memory.adrenalineTimer && memory.adrenalineTimer > 0) {
            memory.adrenalineTimer--;
            // Stay wary even if threat is gone
            if (!nearestThreat && memory.lastThreatPosition) {
                const lastThreatDist = Math.hypot(animal.x - memory.lastThreatPosition.x, animal.y - memory.lastThreatPosition.y);
                if (lastThreatDist < flightDistance * 2) {
                    // Still somewhat close to last known threat position
                    nearestThreat = memory.lastThreatPosition;
                    nearestThreatDist = lastThreatDist;
                }
            }
        }
    } else if (animal.type === 'Predator') {
        // Update hunger
        memory.hunger = Math.min(100, (memory.hunger || 50) + 0.5);

        // Only hunt when moderately hungry
        if (memory.hunger! > 30) {
            // Find nearest suitable prey
            const HUNT_DETECTION_RADIUS = 15;

            for (const otherAnimal of allAnimals) {
                if (otherAnimal.type === 'Prey' && otherAnimal.id !== animal.id) {
                    const dist = Math.hypot(animal.x - otherAnimal.x, animal.y - otherAnimal.y);

                    // Check if prey is suitable (not too large)
                    const preyData = ANIMAL_DATA[otherAnimal.baseId];
                    if (preyData && dist < HUNT_DETECTION_RADIUS && dist < nearestPreyDist) {
                        // Simple size check - don't hunt prey larger than self
                        const sizeValue = (size: string) => size === 'small' ? 1 : size === 'medium' ? 2 : 3;
                        if (sizeValue(preyData.size) <= sizeValue(animalData.size)) {
                            nearestPrey = otherAnimal;
                            nearestPreyDist = dist;
                        }
                    }
                }
            }

            if (nearestPrey) {
                memory.stalkingTarget = nearestPrey.id;
                memory.stalkingTimer = 20;
            }
        }

        // Avoid humans unless very hungry
        if (playerDist <= 10 && (memory.hunger! < 80)) {
            // Apex predators avoid humans more
            const avoidanceDistance = animalData.size === 'large' ? 12 : 8;
            if (playerDist <= avoidanceDistance) {
                nearestThreat = playerPos; // Will use avoiding behavior
            }
        }
    }
    
    let newState = animal.aiState;
    let targetPos: Point | null = null;

    // --- State Transitions ---
    if (animal.type === 'Predator') {
        if (nearestThreat && memory.hunger! < 80) {
            // Avoid humans when not desperate
            newState = 'avoiding';
            targetPos = nearestThreat;
        } else if (nearestPrey && nearestPreyDist <= 2) {
            // Attack range
            newState = 'attacking';
            targetPos = { x: nearestPrey.x, y: nearestPrey.y };
            // Reset hunger on successful attack
            if (nearestPreyDist < 1) {
                memory.hunger = 0;
                memory.lastHuntSuccess = Date.now();
            }
        } else if (nearestPrey && nearestPreyDist <= 8) {
            // Stalking range
            newState = 'stalking';
            targetPos = { x: nearestPrey.x, y: nearestPrey.y };
        } else if (canSeePlayer && memory.hunger! > 80) {
            // Only attack player when very hungry
            newState = playerDist <= AI_CONFIG.ATTACK_DISTANCE ? 'attacking' : 'chasing';
            targetPos = playerPos;
        } else {
            newState = 'wandering';
        }
    } else if (animal.type === 'Prey') {
        if (nearestThreat) {
            newState = 'fleeing';
            targetPos = nearestThreat;
        } else if (memory.adrenalineTimer && memory.adrenalineTimer > 0) {
            // Stay alert and ready to flee
            newState = 'alert';
        } else {
            newState = 'wandering';
        }
    } else {
        if (newState !== 'wandering' && newState !== 'idle') {
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

    // Movement probability system to reduce jittery movement
    const shouldMove = (state: string): boolean => {
        // Domestic animals in paddocks move less frequently (grazing behavior)
        if (animal.isDomestic && map.tiles[animal.y][animal.x].paddockType === 'Livestock') {
            switch(state) {
                case 'fleeing': return Math.random() < 0.8; // 80% chance when fleeing in paddock
                case 'wandering': return Math.random() < 0.2; // 20% chance - mostly grazing
                default: return Math.random() < 0.3; // 30% chance default for paddock animals
            }
        }

        // Normal movement rates for wild animals
        switch(state) {
            case 'fleeing':
            case 'attacking':
                return true; // Always move when fleeing or attacking
            case 'chasing':
                return Math.random() < 0.9; // 90% chance when chasing
            case 'stalking':
                return Math.random() < 0.7; // 70% chance when stalking (slower, more deliberate)
            case 'avoiding':
                return Math.random() < 0.8; // 80% chance when avoiding threats
            case 'alert':
                return Math.random() < 0.4; // 40% chance when alert (cautious movement)
            case 'wandering':
                return Math.random() < 0.5; // 50% chance when wandering
            default:
                return Math.random() < 0.6; // 60% chance default
        }
    };

    if (!shouldMove(newState)) {
        return { aiState: newState }; // Update state but don't move
    }

    switch (newState) {
        case 'fleeing':
            if (targetPos) {
                let bestTile: Tile | null = null;
                let maxScore = -Infinity;
                for (const neighbor of walkableNeighbors) {
                    const distToThreat = Math.hypot(neighbor.x - targetPos.x, neighbor.y - targetPos.y);
                    const terrainPref = getTerrainPreference(animal, neighbor, map);
                    const score = distToThreat * terrainPref; // Combine distance and terrain preference
                    if (score > maxScore) {
                        maxScore = score;
                        bestTile = neighbor;
                    }
                }
                if (bestTile) nextPos = { x: bestTile.x, y: bestTile.y };
            }
            break;

        case 'stalking':
            if (targetPos) {
                const directDist = Math.hypot(targetPos.x - animal.x, targetPos.y - animal.y);

                if (directDist > 4) {
                    // Circle around when far - indirect approach
                    const angle = Math.atan2(targetPos.y - animal.y, targetPos.x - animal.x);
                    const offsetAngle = angle + (Math.random() - 0.5) * Math.PI/3; // ±60 degrees

                    let bestTile: Tile | null = null;
                    let bestScore = -Infinity;

                    for (const neighbor of walkableNeighbors) {
                        const nAngle = Math.atan2(neighbor.y - animal.y, neighbor.x - animal.x);
                        const angleDiff = Math.abs(nAngle - offsetAngle);
                        const terrainPref = getTerrainPreference(animal, neighbor, map);
                        const score = (1 / (1 + angleDiff)) * terrainPref;

                        if (score > bestScore) {
                            bestScore = score;
                            bestTile = neighbor;
                        }
                    }

                    if (bestTile) nextPos = { x: bestTile.x, y: bestTile.y };
                } else {
                    // Direct approach when close
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
            }
            break;

        case 'avoiding':
            // Move away from threat but not in panic (unlike fleeing)
            if (targetPos) {
                let bestTile: Tile | null = null;
                let bestScore = -Infinity;

                for (const neighbor of walkableNeighbors) {
                    const dist = Math.hypot(neighbor.x - targetPos.x, neighbor.y - targetPos.y);
                    const terrainPref = getTerrainPreference(animal, neighbor, map);
                    // Prefer distance from threat and good terrain
                    const score = dist * terrainPref;

                    if (score > bestScore) {
                        bestScore = score;
                        bestTile = neighbor;
                    }
                }

                if (bestTile) {
                    nextPos = { x: bestTile.x, y: bestTile.y };
                }
            }
            break;

        case 'alert':
            // Cautious random movement, preferring cover
            const alertWeights = walkableNeighbors.map(n => {
                const terrainPref = getTerrainPreference(animal, n, map);
                // Prefer tiles with cover (forest, hills) when alert
                const coverBonus = (n.biome === BiomeType.FOREST || n.biome === BiomeType.DENSE_FOREST ||
                                   n.biome === BiomeType.HILLS) ? 2.0 : 1.0;
                return terrainPref * coverBonus;
            });
            const alertTotalWeight = alertWeights.reduce((a, b) => a + b, 0);
            let alertRandom = Math.random() * alertTotalWeight;
            for (let i = 0; i < walkableNeighbors.length; i++) {
                alertRandom -= alertWeights[i];
                if (alertRandom <= 0) {
                    nextPos = { x: walkableNeighbors[i].x, y: walkableNeighbors[i].y };
                    break;
                }
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
        default:
            // Domestic animals should move much less frequently
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