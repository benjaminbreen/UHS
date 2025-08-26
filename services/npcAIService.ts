/**
 * services/npcAIService.ts - Enhanced animal AI behavior for standard maps
 */
import { AnimalEntity, Point, Tile, MapData, BiomeType, NpcEntity, PersonalGoal } from '../types';
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
    if (tile.biome === BiomeType.ACTIVE_LAVA) return 0;
    
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
    
    let walkableNeighbors: Tile[];

    if (animalData.habitat === 'aquatic') {
        walkableNeighbors = allNeighbors.filter(n => !n.isLand && !isNearLand(n.x, n.y, map.tiles, 2));
    } else {
        walkableNeighbors = allNeighbors.filter(n => n.isLand || n.biome === BiomeType.SHOALS_TILE);
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

const POI_BIOMES = new Set([
    BiomeType.PALACE, BiomeType.HOLY_SITE, BiomeType.RUINS, 
    BiomeType.CITY_CENTER, BiomeType.MARKETPLACE, BiomeType.GOVERNMENT_DISTRICT,
]);

const isWalkableForNpc = (tile: Tile): boolean => {
    if (tile.structure || POI_BIOMES.has(tile.biome)) {
        return false;
    }
    return tile.isLand && ![BiomeType.ACTIVE_LAVA, BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN, BiomeType.HIGH_PEAK, BiomeType.MOUNTAIN, BiomeType.CLIFF].includes(tile.biome);
};

const moveTowards = (start: Point, target: Point, walkableNeighbors: Tile[]): Point => {
    let bestNeighbor: Tile | null = null;
    let minDistance = Math.hypot(start.x - target.x, start.y - target.y);

    for (const neighbor of walkableNeighbors) {
        const distance = Math.hypot(neighbor.x - target.x, neighbor.y - target.y);
        if (distance < minDistance) {
            minDistance = distance;
            bestNeighbor = neighbor;
        }
    }
    
    return bestNeighbor ? { x: bestNeighbor.x, y: bestNeighbor.y } : start;
};

const getGoalTargetPosition = (npc: NpcEntity, map: MapData): Point | null => {
    const goal = npc.personalGoal;
    if (!goal) return null;
    
    if (goal.targetType === 'STRUCTURE' || goal.targetType === 'LOCATION') {
        const structure = map.terrainStructures?.find(s => s.id === goal.targetId);
        if (structure) {
            return { x: structure.location[0], y: structure.location[1] };
        }
    }
    if (goal.targetType === 'RESOURCE') {
        const resourceId = goal.targetId;
        const searchRadius = 15;
        let closestTile: Tile | null = null;
        let minDistance = Infinity;

        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                const checkX = npc.x + dx;
                const checkY = npc.y + dy;
                if (checkX >= 0 && checkX < map.width && checkY >= 0 && checkY < map.height) {
                    const tile = map.tiles[checkY][checkX];
                    if (tile.mineralDeposit?.metalId === resourceId && tile.mineralDeposit.quantity > 0) {
                        const distance = Math.hypot(dx, dy);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestTile = tile;
                        }
                    }
                }
            }
        }
        if (closestTile) {
            return { x: closestTile.x, y: closestTile.y };
        }
    }
    return null;
};

export function calculateNpcUpdate(
    npc: NpcEntity, 
    playerPos: Point,
    map: MapData,
    gameTimeHours: number
): Partial<NpcEntity> {
    const workplace = map.terrainStructures?.find(s => s.id === npc.workplaceId);
    let newActivity = npc.activity;

    // --- Palace Noble Special Behavior ---
    if ((npc as any).behavior?.palaceVisitor) {
        const behavior = (npc as any).behavior;
        const palaceLocation = behavior.palaceLocation;
        
        // Decrement timer
        if (behavior.timeUntilPalaceVisit !== undefined) {
            behavior.timeUntilPalaceVisit--;
        }
        
        // Check if at palace
        const isAtPalace = Math.hypot(npc.x - palaceLocation[0], npc.y - palaceLocation[1]) <= 0.5;
        
        // Palace visiting logic
        if (behavior.timeUntilPalaceVisit <= 0) {
            if (isAtPalace) {
                // Exit palace
                newActivity = 'leaving_palace';
                behavior.timeUntilPalaceVisit = 60 + Math.floor(Math.random() * 120); // Stay outside 60-180 ticks
            } else {
                // Enter palace
                newActivity = 'entering_palace';
                behavior.timeUntilPalaceVisit = 30 + Math.floor(Math.random() * 60); // Stay inside 30-90 ticks
            }
        } else if (newActivity === 'entering_palace' && !isAtPalace) {
            // Move towards palace
            const allNeighbors = getNeighbors(npc.x, npc.y, map);
            const walkableNeighbors = allNeighbors.filter(isWalkableForNpc);
            if (walkableNeighbors.length > 0) {
                const target = { x: palaceLocation[0], y: palaceLocation[1] };
                const nextPos = moveTowards({ x: npc.x, y: npc.y }, target, walkableNeighbors);
                return { 
                    activity: newActivity, 
                    x: nextPos.x, 
                    y: nextPos.y,
                    behavior: behavior
                };
            }
        } else if (newActivity === 'leaving_palace' && isAtPalace) {
            // Move away from palace (to the front/south)
            const allNeighbors = getNeighbors(npc.x, npc.y, map);
            const walkableNeighbors = allNeighbors.filter(isWalkableForNpc);
            if (walkableNeighbors.length > 0) {
                // Prefer moving south (front of palace)
                const southTile = walkableNeighbors.find(t => t.y > npc.y);
                const nextPos = southTile || walkableNeighbors[0];
                newActivity = 'wandering'; // Switch to wandering after leaving
                return { 
                    activity: newActivity, 
                    x: nextPos.x, 
                    y: nextPos.y,
                    behavior: behavior
                };
            }
        }
        
        // Store updated behavior
        (npc as any).behavior = behavior;
    }
    
    // --- State Transitions based on Schedule ---
    if (npc.homeLocation && workplace) {
        const isAtHome = Math.hypot(npc.x - npc.homeLocation.x, npc.y - npc.homeLocation.y) <= 1.5;
        const isAtWork = Math.hypot(npc.x - workplace.location[0], npc.y - workplace.location[1]) <= 1.5;
        
        if (gameTimeHours >= 7 && gameTimeHours < 9) { // Commute to work
            if (isAtHome) newActivity = 'commuting_to_work';
        } else if (gameTimeHours >= 9 && gameTimeHours < 17) { // Work
            if (isAtWork) newActivity = 'working';
            else if(newActivity !== 'working') newActivity = 'commuting_to_work';
        } else if (gameTimeHours >= 17 && gameTimeHours < 19) { // Commute home
            if (isAtWork) newActivity = 'commuting_home';
        } else { // Rest
            if (isAtHome) newActivity = 'idle';
            else if (newActivity !== 'idle') newActivity = 'commuting_home';
        }
    } else {
        newActivity = 'wandering'; // Default if no home/work
    }

    const allNeighbors = getNeighbors(npc.x, npc.y, map);
    const walkableNeighbors = allNeighbors.filter(isWalkableForNpc);

    if (walkableNeighbors.length === 0) {
        // Emergency unstuck: if there are ANY land neighbors, move to one.
        const emergencyNeighbors = allNeighbors.filter(n => n.isLand && !POI_BIOMES.has(n.biome));
        if(emergencyNeighbors.length > 0) {
            const escapeTile = emergencyNeighbors[Math.floor(Math.random() * emergencyNeighbors.length)];
            return { x: escapeTile.x, y: escapeTile.y, activity: newActivity };
        }
        return { activity: newActivity }; // Truly stuck, do nothing.
    }

    let nextPos = { x: npc.x, y: npc.y };
    const goalTargetPos = getGoalTargetPosition(npc, map);

    // --- State-based Action ---
    switch(newActivity) {
        case 'commuting_to_work': {
            const target = workplace ? { x: workplace.location[0], y: workplace.location[1] } : null;
            if (target) {
                const dist = Math.hypot(npc.x - target.x, npc.y - target.y);
                if (dist <= 1.5) {
                    return { activity: 'working' }; // Arrived, switch to working
                }
                nextPos = moveTowards({ x: npc.x, y: npc.y }, target, walkableNeighbors);
            } else {
                newActivity = 'wandering'; // No workplace, so just wander
            }
            break;
        }
        case 'commuting_home': {
            const target = npc.homeLocation;
            if (target) {
                const dist = Math.hypot(npc.x - target.x, npc.y - target.y);
                if (dist <= 1.5) {
                    return { activity: 'idle' }; // Arrived, switch to idle
                }
                nextPos = moveTowards({ x: npc.x, y: npc.y }, target, walkableNeighbors);
            } else {
                newActivity = 'wandering'; // No home, so just wander
            }
            break;
        }
        case 'working':
        case 'idle':
        case 'wandering': 
        case 'entering_palace':
        case 'leaving_palace': {
            // Default wandering behavior (also for palace nobles when not actively entering/leaving)
            let baseTarget: Point | null = null;
            
            // Palace nobles wander near their palace
            if ((npc as any).behavior?.palaceVisitor) {
                const palaceLocation = (npc as any).behavior.palaceLocation;
                baseTarget = { x: palaceLocation[0], y: palaceLocation[1] + 1 }; // Stay in front
            } else if (newActivity === 'working' && workplace) {
                baseTarget = { x: workplace.location[0], y: workplace.location[1] };
            } else if (newActivity === 'idle' && npc.homeLocation) {
                baseTarget = npc.homeLocation;
            }

            // Goal influence
            if (goalTargetPos) {
                const distToGoal = Math.hypot(npc.x - goalTargetPos.x, npc.y - goalTargetPos.y);
                const goalArchetype = npc.personalGoal.archetype;
                let goalDriven = false;
                
                if (goalArchetype === 'PROTECT' && distToGoal > 5) {
                    nextPos = moveTowards({ x: npc.x, y: npc.y }, goalTargetPos, walkableNeighbors);
                    goalDriven = true;
                }
                
                if (goalArchetype === 'ACQUIRE' && distToGoal > 2) {
                    if (Math.random() < 0.5) {
                         nextPos = moveTowards({ x: npc.x, y: npc.y }, goalTargetPos, walkableNeighbors);
                         goalDriven = true;
                    }
                }
                if (goalDriven) break;
            }

            if (baseTarget) {
                // Use custom wander radius for palace nobles, otherwise default
                const WANDER_RADIUS = (npc as any).wanderRadius || (newActivity === 'working' ? 4 : 3);
                const distFromAnchor = Math.hypot(npc.x - baseTarget.x, npc.y - baseTarget.y);
                if (distFromAnchor > WANDER_RADIUS) {
                    nextPos = moveTowards({ x: npc.x, y: npc.y }, baseTarget, walkableNeighbors);
                } else if (Math.random() > (newActivity === 'idle' ? 0.8 : 0.6)) {
                    nextPos = walkableNeighbors[Math.floor(Math.random() * walkableNeighbors.length)];
                }
            } else { // Pure wandering
                 if (Math.random() > 0.7) {
                    nextPos = walkableNeighbors[Math.floor(Math.random() * walkableNeighbors.length)];
                }
            }
            break;
        }
    }
    
    return { activity: newActivity, x: nextPos.x, y: nextPos.y };
}
