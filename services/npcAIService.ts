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

interface NpcMemory {
    nextMoveTime: number; // Single timer: when NPC can move next
    currentDestination: Point | null;
    destinationPath?: Point[]; // Cached path to destination
    pathIndex?: number; // Current position in path
    visitedPOIs: string[];
    idleWanderAnchor: Point | null;
    idleWanderTimer: number;
    spawnTime: number; // Track when NPC was first seen
    edgeApproachTime?: number; // Track how long NPC has been at edge
    lastActivity?: string; // Track activity changes for smooth transitions
    lastDestinationCheck?: number; // When we last verified destination is still valid
    transitDestination?: Point; // For uninhabited areas, where NPC is heading
    transitStartPoint?: Point; // Where NPC started their transit from
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
    FLEE_DISTANCE: 10, // Increased from 6 - prey animals flee further
    ATTACK_DISTANCE: 1.5,
    CHASE_DISTANCE: 12,
    WANDER_RADIUS: 10,
};

const animalMemories = new Map<string, AIMemory>();
const npcMemories = new Map<string, NpcMemory>();

// Urban tile types that indicate inhabited areas
const URBAN_BIOME_TYPES = new Set([
    BiomeType.HAMLET,
    BiomeType.LOW_DENSITY_CITY,
    BiomeType.DENSE_CITY,
    BiomeType.CITY_CENTER,
    BiomeType.MARKETPLACE,
    BiomeType.GOVERNMENT_DISTRICT,
    BiomeType.PALACE
]);

/**
 * Checks if map has any urban/inhabited tiles
 */
function hasUrbanTiles(map: MapData): boolean {
    for (let y = 0; y < map.tiles.length; y++) {
        for (let x = 0; x < map.tiles[y].length; x++) {
            if (URBAN_BIOME_TYPES.has(map.tiles[y][x].biome)) {
                return true;
            }
        }
    }
    return false;
}

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
    map: MapData,
    npcs?: NpcEntity[]
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

    // Check for nearby NPCs that prey should flee from
    let nearestThreat: Point | null = null;
    let nearestThreatDist = Infinity;

    if (animal.type === 'Prey') {
        // Check player as threat
        if (canSeePlayer) {
            nearestThreat = playerPos;
            nearestThreatDist = playerDist;
        }

        // Check NPCs as threats
        if (npcs) {
            for (const npc of npcs) {
                const npcDist = Math.hypot(animal.x - npc.x, animal.y - npc.y);
                if (npcDist <= AI_CONFIG.PLAYER_DETECTION_RADIUS && npcDist < nearestThreatDist) {
                    nearestThreat = { x: npc.x, y: npc.y };
                    nearestThreatDist = npcDist;
                }
            }
        }
    }

    let newState = animal.aiState;
    let targetPos: Point | null = null;

    // --- State Transitions ---
    if(animal.type === 'Predator' && canSeePlayer) {
        newState = playerDist <= AI_CONFIG.ATTACK_DISTANCE ? 'attacking' : 'chasing';
        targetPos = playerPos;
    } else if (animal.type === 'Prey' && nearestThreat) {
        newState = 'fleeing';
        targetPos = nearestThreat;
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

    // Paddock containment for domestic animals
    if (animal.isDomestic) {
        const currentTile = map.tiles[animal.y][animal.x];

        if (currentTile.paddockType === 'Livestock') {
            // Animal is in paddock - restrict movement to paddock tiles only
            const paddockNeighbors = walkableNeighbors.filter(n => n.paddockType === 'Livestock');
            if (paddockNeighbors.length > 0) {
                walkableNeighbors = paddockNeighbors;
            }
            // If no paddock neighbors available, stay put (animal at edge of paddock)
        } else {
            // Animal escaped! Find path back to nearest paddock
            // First, find all paddock tiles
            const paddockTiles: Tile[] = [];
            for (let y = 0; y < map.height; y++) {
                for (let x = 0; x < map.width; x++) {
                    if (map.tiles[y][x].paddockType === 'Livestock') {
                        paddockTiles.push(map.tiles[y][x]);
                    }
                }
            }

            if (paddockTiles.length > 0) {
                // Find closest paddock tile
                let closestPaddock: Tile | null = null;
                let minDist = Infinity;
                for (const paddockTile of paddockTiles) {
                    const dist = Math.hypot(paddockTile.x - animal.x, paddockTile.y - animal.y);
                    if (dist < minDist) {
                        minDist = dist;
                        closestPaddock = paddockTile;
                    }
                }

                // Filter neighbors to move towards closest paddock
                if (closestPaddock) {
                    let bestNeighbor: Tile | null = null;
                    let bestDist = Infinity;
                    for (const neighbor of walkableNeighbors) {
                        const dist = Math.hypot(closestPaddock.x - neighbor.x, closestPaddock.y - neighbor.y);
                        if (dist < bestDist) {
                            bestDist = dist;
                            bestNeighbor = neighbor;
                        }
                    }
                    walkableNeighbors = bestNeighbor ? [bestNeighbor] : [];
                }
            }
        }
    }
    
    if(walkableNeighbors.length === 0) {
        memory.stuckCounter++;
        return { aiState: newState };
    }
    memory.stuckCounter = 0;

    // Add movement probability to slow down animals
    const shouldMove = (state: string): boolean => {
        // Domestic animals in paddocks move less frequently (grazing behavior)
        if (animal.isDomestic && map.tiles[animal.y][animal.x].paddockType === 'Livestock') {
            switch(state) {
                case 'fleeing':
                    return Math.random() < 0.8; // 80% chance when fleeing in paddock
                case 'wandering':
                case 'idle':
                    return Math.random() < 0.2; // 20% chance - mostly grazing
                default:
                    return Math.random() < 0.3; // 30% chance default for paddock animals
            }
        }

        // Normal movement rates for wild animals and domestic animals outside paddocks
        switch(state) {
            case 'fleeing':
            case 'attacking':
                return true; // Always move when fleeing or attacking
            case 'chasing':
                return Math.random() < 0.9; // 90% chance when chasing
            case 'wandering':
            case 'idle':
                return Math.random() < 0.5; // 50% chance when wandering/idle (increased from 30%)
            default:
                return Math.random() < 0.6; // 60% chance default (increased from 40%)
        }
    };

    if (!shouldMove(newState)) {
        return { aiState: newState }; // Update state but don't move
    }

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

export function cleanupNpcMemory(npcId: string) {
    npcMemories.delete(npcId);
}

const POI_BIOMES = new Set([
    BiomeType.PALACE, BiomeType.HOLY_SITE, BiomeType.RUINS,
    BiomeType.CITY_CENTER, BiomeType.MARKETPLACE, BiomeType.GOVERNMENT_DISTRICT,
]);

const SOCIAL_POI_BIOMES = [
    BiomeType.MARKETPLACE,
    BiomeType.HOLY_SITE,
    BiomeType.GOVERNMENT_DISTRICT,
    BiomeType.PALACE,
    BiomeType.CITY_CENTER
];

function getNpcMemory(npcId: string): NpcMemory {
    const now = Date.now();
    if (!npcMemories.has(npcId)) {
        // Randomize initial movement time to prevent all NPCs moving at once on spawn
        const randomOffset = Math.random() * 3000; // 0-3 seconds random offset
        npcMemories.set(npcId, {
            nextMoveTime: now + randomOffset, // Stagger initial movement
            currentDestination: null,
            visitedPOIs: [],
            idleWanderAnchor: null,
            idleWanderTimer: 0,
            spawnTime: now,
            edgeApproachTime: undefined,
            lastActivity: undefined
        });
    }
    return npcMemories.get(npcId)!;
}

interface MovementProfile {
    baseSpeed: number;      // ms between moves
    variability: number;    // ±% randomization
    canInterrupt: boolean;  // Can change direction mid-path
    description: string;    // For debugging
}

// Define clear movement profiles for each activity type
const MOVEMENT_PROFILES: Record<string, MovementProfile> = {
    // Emergency/Combat
    fleeing:         { baseSpeed: 500,    variability: 0.1,  canInterrupt: false, description: "Fleeing danger" },
    chasing:         { baseSpeed: 750,    variability: 0.1,  canInterrupt: false, description: "Pursuing target" },
    attacking:       { baseSpeed: 1000,   variability: 0.2,  canInterrupt: false, description: "In combat" },

    // Purposeful movement
    commuting_to_work: { baseSpeed: 1000, variability: 0.2,  canInterrupt: false, description: "Going to work" },
    commuting_home:    { baseSpeed: 1200, variability: 0.3,  canInterrupt: false, description: "Going home" },
    visiting_poi:      { baseSpeed: 1500, variability: 0.3,  canInterrupt: true,  description: "Visiting location" },
    entering_palace:   { baseSpeed: 2000, variability: 0.2,  canInterrupt: false, description: "Entering palace" },
    leaving_palace:    { baseSpeed: 2000, variability: 0.2,  canInterrupt: false, description: "Leaving palace" },

    // Casual movement
    wandering:       { baseSpeed: 4000,  variability: 0.5,  canInterrupt: true,  description: "Wandering around" },
    shopping:        { baseSpeed: 3000,  variability: 0.4,  canInterrupt: true,  description: "Browsing shops" },
    socializing:     { baseSpeed: 6000,  variability: 0.6,  canInterrupt: true,  description: "Chatting" },

    // Work activities
    working:         { baseSpeed: 8000,  variability: 0.4,  canInterrupt: true,  description: "Working" },
    patrolling:      { baseSpeed: 3000,  variability: 0.1,  canInterrupt: false, description: "On patrol" },
    guarding:        { baseSpeed: 30000, variability: 0.1,  canInterrupt: false, description: "Standing guard" },

    // Rest activities
    idle:            { baseSpeed: 12000, variability: 0.6,  canInterrupt: true,  description: "Idle" },
    resting:         { baseSpeed: 20000, variability: 0.3,  canInterrupt: true,  description: "Resting" },
    sleeping:        { baseSpeed: Infinity, variability: 0, canInterrupt: false, description: "Sleeping" },

    // Special NPCs
    shopkeeper:      { baseSpeed: 15000, variability: 0.2,  canInterrupt: true,  description: "Tending shop" },
    noble:           { baseSpeed: 5000,  variability: 0.3,  canInterrupt: true,  description: "Noble bearing" },
    merchant:        { baseSpeed: 4000,  variability: 0.4,  canInterrupt: true,  description: "Trading" },
    guard_standing:  { baseSpeed: Infinity, variability: 0, canInterrupt: false, description: "At post" }
};

function getMovementProfile(npc: NpcEntity, activity: string): MovementProfile {
    // Check for special profession-based overrides
    const profession = npc.profession?.toLowerCase() || '';
    const age = npc.age || 30;

    // Guards have special movement patterns
    if (profession.includes('guard') || profession.includes('soldier') || profession.includes('watch')) {
        if (activity === 'idle' || activity === 'working') {
            // Guards alternate between patrolling and standing
            const patrolPhase = Math.floor(Date.now() / 60000) % 4; // 4-minute cycles
            if (patrolPhase === 0) {
                return MOVEMENT_PROFILES.patrolling;
            }
            return MOVEMENT_PROFILES.guard_standing;
        }
    }

    // Shopkeepers mostly stay put
    if (profession.includes('merchant') || profession.includes('vendor') || profession.includes('shopkeeper') ||
        profession.includes('trader') || profession.includes('smith') || profession.includes('tailor')) {
        if (activity === 'working' || activity === 'idle') {
            return MOVEMENT_PROFILES.shopkeeper;
        }
    }

    // Nobles move more deliberately
    if (profession.includes('noble') || profession.includes('lord') || profession.includes('lady') ||
        profession.includes('duke') || profession.includes('duchess') || profession.includes('baron')) {
        if (activity === 'wandering' || activity === 'idle') {
            return MOVEMENT_PROFILES.noble;
        }
    }

    // Children are energetic
    if (age < 16) {
        if (activity === 'wandering' || activity === 'idle') {
            return { baseSpeed: 2000, variability: 0.6, canInterrupt: true, description: "Child playing" };
        }
    }

    // Elderly move more slowly
    if (age > 70) {
        if (activity === 'wandering' || activity === 'idle') {
            return { baseSpeed: 15000, variability: 0.3, canInterrupt: true, description: "Elderly resting" };
        }
    }

    // Priests and religious figures move calmly
    if (profession.includes('priest') || profession.includes('monk') || profession.includes('nun') ||
        profession.includes('cleric') || profession.includes('imam') || profession.includes('rabbi')) {
        if (activity === 'wandering' || activity === 'idle') {
            return { baseSpeed: 8000, variability: 0.2, canInterrupt: true, description: "Contemplative walk" };
        }
    }

    // Farmers and laborers have work patterns
    if (profession.includes('farmer') || profession.includes('laborer') || profession.includes('miner') ||
        profession.includes('worker') || profession.includes('peasant')) {
        if (activity === 'working') {
            // Active work periods
            const workHour = new Date().getHours();
            if (workHour >= 6 && workHour < 12) {
                return { baseSpeed: 3000, variability: 0.3, canInterrupt: true, description: "Morning work" };
            } else if (workHour >= 14 && workHour < 18) {
                return { baseSpeed: 4000, variability: 0.4, canInterrupt: true, description: "Afternoon work" };
            }
            return MOVEMENT_PROFILES.working;
        }
    }

    // Return the activity's default profile or a fallback
    return MOVEMENT_PROFILES[activity] || MOVEMENT_PROFILES.wandering;
}

function getGoalUrgencyMultiplier(npc: NpcEntity): number {
    if (!npc.personalGoal) return 1.0;

    const goal = npc.personalGoal;

    // Determine urgency based on goal type and context
    if (goal.archetype === 'SURVIVE') {
        // Survival goals are always urgent
        return 0.6; // 40% faster movement
    } else if (goal.archetype === 'PROTECT') {
        // Protection goals are urgent if target is threatened
        return 0.7; // 30% faster
    } else if (goal.archetype === 'ACQUIRE') {
        // Acquisition goals vary based on what's being acquired
        if (goal.targetId === 'food' || goal.targetId === 'water' || goal.targetId === 'medicine') {
            return 0.75; // 25% faster for necessities
        }
        return 0.9; // 10% faster for other items
    }

    // Default: normal speed
    return 1.0;
}

function calculateNextMoveTime(npc: NpcEntity, activity: string): number {
    const profile = getMovementProfile(npc, activity);

    // Age modifier for movement speed (only for traveling activities)
    let ageModifier = 1.0;
    if (activity.includes('commuting') || activity === 'visiting_poi') {
        const age = npc.age || 30;
        if (age < 25) ageModifier = 0.8;      // Young people walk 20% faster
        else if (age > 60) ageModifier = 1.5; // Elderly walk 50% slower
        else if (age > 40) ageModifier = 1.2; // Middle-aged walk 20% slower
    }

    // Goal urgency modifier - affects all activities
    const urgencyModifier = getGoalUrgencyMultiplier(npc);

    // Apply variability
    const variation = 1 + (Math.random() - 0.5) * profile.variability * 2;
    const finalSpeed = profile.baseSpeed * ageModifier * urgencyModifier * variation;

    return Date.now() + finalSpeed;
}

function findNearbyPOI(npc: NpcEntity, map: MapData, excludeVisited: boolean = true): Point | null {
    const memory = getNpcMemory(npc.id);
    const searchRadius = 30;
    const pois: { point: Point; biome: BiomeType; distance: number }[] = [];

    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
            const x = npc.x + dx;
            const y = npc.y + dy;
            if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
                const tile = map.tiles[y][x];
                if (SOCIAL_POI_BIOMES.includes(tile.biome)) {
                    const poiKey = `${x},${y}`;
                    if (!excludeVisited || !memory.visitedPOIs.includes(poiKey)) {
                        const distance = Math.hypot(dx, dy);
                        pois.push({ point: { x, y }, biome: tile.biome, distance });
                    }
                }
            }
        }
    }

    if (pois.length === 0) return null;

    // Prefer closer POIs with some randomness
    pois.sort((a, b) => a.distance - b.distance);
    const topPois = pois.slice(0, Math.min(3, pois.length));
    const selected = topPois[Math.floor(Math.random() * topPois.length)];

    // Mark as visited
    memory.visitedPOIs.push(`${selected.point.x},${selected.point.y}`);
    // Reset visited list if it gets too long
    if (memory.visitedPOIs.length > 5) {
        memory.visitedPOIs = memory.visitedPOIs.slice(-2);
    }

    return selected.point;
}

function getProfessionPOIPreference(npc: NpcEntity): BiomeType[] {
    const profession = npc.profession?.toLowerCase() || '';

    if (profession.includes('merchant') || profession.includes('trader') || profession.includes('vendor')) {
        return [BiomeType.MARKETPLACE, BiomeType.CITY_CENTER];
    }
    if (profession.includes('priest') || profession.includes('monk') || profession.includes('cleric')) {
        return [BiomeType.HOLY_SITE];
    }
    if (profession.includes('guard') || profession.includes('soldier') || profession.includes('official')) {
        return [BiomeType.GOVERNMENT_DISTRICT, BiomeType.PALACE];
    }
    if (profession.includes('noble') || profession.includes('courtier')) {
        return [BiomeType.PALACE, BiomeType.GOVERNMENT_DISTRICT];
    }

    // Default for common folk
    return [BiomeType.MARKETPLACE, BiomeType.CITY_CENTER];
}

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

function detectNearbyDangers(npc: NpcEntity, map: MapData, playerPos: Point): { type: 'fire' | 'combat' | 'lava', position: Point } | null {
    // Check for fires (most urgent)
    for (let dy = -5; dy <= 5; dy++) {
        for (let dx = -5; dx <= 5; dx++) {
            const checkX = npc.x + dx;
            const checkY = npc.y + dy;
            if (checkX >= 0 && checkX < map.width && checkY >= 0 && checkY < map.height) {
                const tile = map.tiles[checkY][checkX];
                // Check for fire or lava
                if (tile.fire && tile.fire.intensity > 0) {
                    return { type: 'fire', position: { x: checkX, y: checkY } };
                }
                if (tile.biome === BiomeType.ACTIVE_LAVA) {
                    return { type: 'lava', position: { x: checkX, y: checkY } };
                }
            }
        }
    }

    // Check if player is in combat nearby (less urgent but still avoid)
    // This is simplified - in reality you'd check combatState or similar
    const playerDist = Math.hypot(npc.x - playerPos.x, npc.y - playerPos.y);
    if (playerDist <= 8) {
        // Check if this NPC is peaceful/civilian type
        const profession = npc.profession?.toLowerCase() || '';
        const isCivilian = !profession.includes('guard') && !profession.includes('soldier') &&
                           !profession.includes('warrior') && !profession.includes('fighter');

        if (isCivilian && playerDist <= 3) {
            // Too close to potential combat
            return { type: 'combat', position: playerPos };
        }
    }

    return null;
}

export function calculateNpcUpdate(
    npc: NpcEntity,
    playerPos: Point,
    map: MapData,
    gameTimeHours: number,
    allNpcs?: NpcEntity[]
): Partial<NpcEntity> {
    const memory = getNpcMemory(npc.id);
    const now = Date.now();

    // Check if this is an uninhabited area (no urban tiles)
    const isUninhabitedArea = !hasUrbanTiles(map);

    // Handle transit behavior for uninhabited areas
    if (isUninhabitedArea) {
        // Initialize transit destination if not set
        if (!memory.transitDestination) {
            // Pick a random edge to transit to
            const edges = [
                { x: Math.floor(Math.random() * map.width), y: 0 }, // North edge
                { x: Math.floor(Math.random() * map.width), y: map.height - 1 }, // South edge
                { x: 0, y: Math.floor(Math.random() * map.height) }, // West edge
                { x: map.width - 1, y: Math.floor(Math.random() * map.height) } // East edge
            ];

            // Pick opposite edge from current position for natural transit
            if (npc.x < map.width / 2) {
                // On west side, head east
                memory.transitDestination = { x: map.width - 1, y: Math.floor(Math.random() * map.height) };
            } else {
                // On east side, head west
                memory.transitDestination = { x: 0, y: Math.floor(Math.random() * map.height) };
            }

            memory.transitStartPoint = { x: npc.x, y: npc.y };
        }

        // Check if close to destination edge
        const distToDestination = Math.hypot(
            npc.x - memory.transitDestination.x,
            npc.y - memory.transitDestination.y
        );

        if (distToDestination <= 1.5) {
            // Reached destination edge - exit map
            let exitDirection: 'north' | 'south' | 'east' | 'west' = 'east';
            if (memory.transitDestination.x === 0) exitDirection = 'west';
            else if (memory.transitDestination.x === map.width - 1) exitDirection = 'east';
            else if (memory.transitDestination.y === 0) exitDirection = 'north';
            else if (memory.transitDestination.y === map.height - 1) exitDirection = 'south';

            console.log(`[NPC AI] ${npc.name} transiting through uninhabited area, exiting ${exitDirection}`);
            return { isLeavingMap: true, mapExitDirection: exitDirection };
        }

        // Move towards transit destination
        if (now >= memory.nextMoveTime) {
            const allNeighbors = getNeighbors(npc.x, npc.y, map);
            const walkableNeighbors = allNeighbors.filter(isWalkableForNpc);

            if (walkableNeighbors.length > 0) {
                const nextPos = moveTowards(
                    { x: npc.x, y: npc.y },
                    memory.transitDestination,
                    walkableNeighbors
                );

                // Set next move time - travelers move steadily
                memory.nextMoveTime = now + 800 + Math.random() * 400; // 0.8-1.2 seconds

                return {
                    x: nextPos.x,
                    y: nextPos.y,
                    activity: 'traveling' // New activity type for transit
                };
            }
        }

        return {}; // Wait for next move time
    }

    // Check if NPC is at map edge and should exit
    // Only allow edge exit if:
    // 1. NPC has existed for at least 60 seconds (grace period)
    // 2. NPC is actually AT the edge (0 or max-1)
    // 3. NPC has been at edge for at least 5 seconds
    const SPAWN_GRACE_PERIOD = 60000; // 60 seconds before allowing map exit
    const EDGE_DWELL_TIME = 5000; // Must be at edge for 5 seconds

    // Check if NPC has existed long enough
    if (now - memory.spawnTime < SPAWN_GRACE_PERIOD) {
        // Too new, don't allow map exit yet
        memory.edgeApproachTime = undefined;
    } else {
        // Check if NPC is EXACTLY at map edge (not just near it)
        const isAtEdge = npc.x === 0 || npc.x === map.width - 1 ||
                        npc.y === 0 || npc.y === map.height - 1;

        if (isAtEdge) {
            // Track how long at edge
            if (!memory.edgeApproachTime) {
                memory.edgeApproachTime = now;
            } else if (now - memory.edgeApproachTime >= EDGE_DWELL_TIME) {
                // Been at edge long enough, determine direction
                let shouldExitMap: 'north' | 'south' | 'east' | 'west' | null = null;
                if (npc.x === 0) shouldExitMap = 'west';
                else if (npc.x === map.width - 1) shouldExitMap = 'east';
                else if (npc.y === 0) shouldExitMap = 'north';
                else if (npc.y === map.height - 1) shouldExitMap = 'south';

                if (shouldExitMap) {
                    console.log(`[NPC AI] ${npc.name} leaving map ${shouldExitMap} after dwelling at edge`);
                    return { isLeavingMap: true, mapExitDirection: shouldExitMap };
                }
            }
        } else {
            // Not at edge, reset timer
            memory.edgeApproachTime = undefined;
        }
    }

    // Single timer check - much cleaner than double-gating
    if (now < memory.nextMoveTime) {
        return {}; // Not time to move yet
    }

    // Check for environmental dangers FIRST (overrides normal behavior)
    const nearbyDanger = detectNearbyDangers(npc, map, playerPos);
    if (nearbyDanger) {
        // Override normal behavior - flee from danger!
        const allNeighbors = getNeighbors(npc.x, npc.y, map);
        const walkableNeighbors = allNeighbors.filter(isWalkableForNpc);

        if (walkableNeighbors.length > 0) {
            // Find tile furthest from danger
            let bestTile = walkableNeighbors[0];
            let maxDist = 0;

            for (const tile of walkableNeighbors) {
                const dist = Math.hypot(tile.x - nearbyDanger.position.x, tile.y - nearbyDanger.position.y);
                if (dist > maxDist) {
                    maxDist = dist;
                    bestTile = tile;
                }
            }

            // Set urgent movement speed for fleeing
            memory.nextMoveTime = now + 500 + Math.random() * 250; // Move again in 0.5-0.75s
            memory.lastActivity = 'fleeing';

            // Log occasionally for debugging
            if (Math.random() < 0.1) {
                console.log(`[NPC AI] ${npc.name} fleeing from ${nearbyDanger.type} at (${nearbyDanger.position.x}, ${nearbyDanger.position.y})`);
            }

            return {
                activity: 'fleeing',
                x: bestTile.x,
                y: bestTile.y
            };
        }
    }

    // Use workplaceLocation for urban workplaces, or fall back to terrainStructures for POIs
    const workplace = npc.workplaceLocation ?
        { location: [npc.workplaceLocation.x, npc.workplaceLocation.y] as [number, number] } :
        map.terrainStructures?.find(s => s.id === npc.workplaceId);
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
    if (npc.homeLocation) {  // Just need a home to have a schedule
        const isAtHome = Math.hypot(npc.x - npc.homeLocation.x, npc.y - npc.homeLocation.y) <= 1.5;
        const isAtWork = workplace ?
            Math.hypot(npc.x - workplace.location[0], npc.y - workplace.location[1]) <= 1.5 :
            false;

        // Night time (10pm to 6am) - everyone should be home
        if (gameTimeHours >= 22 || gameTimeHours < 6) {
            if (isAtHome) {
                newActivity = 'idle'; // Sleeping/resting at home
            } else {
                newActivity = 'commuting_home'; // Go home to sleep
            }
        }
        // If NPC has a workplace, use work schedule
        else if (workplace) {
            // Add random POI visits during day
            const shouldVisitPOI = Math.random() < 0.25 && gameTimeHours >= 10 && gameTimeHours <= 18;

            if (shouldVisitPOI && !memory.currentDestination) {
                // Decide to visit a POI
                const poi = findNearbyPOI(npc, map);
                if (poi) {
                    memory.currentDestination = poi;
                    newActivity = 'visiting_poi';
                }
            } else if (memory.currentDestination) {
                // Continue to POI if we have a destination
                const distToDest = Math.hypot(npc.x - memory.currentDestination.x, npc.y - memory.currentDestination.y);
                if (distToDest <= 1.5) {
                    // Arrived at POI, clear destination
                    memory.currentDestination = null;
                    newActivity = 'wandering'; // Wander around POI briefly
                } else {
                    newActivity = 'visiting_poi';
                }
            } else if (gameTimeHours >= 7 && gameTimeHours < 9) { // Commute to work
                if (isAtHome) newActivity = 'commuting_to_work';
            } else if (gameTimeHours >= 9 && gameTimeHours < 17) { // Work
                if (isAtWork) newActivity = 'working';
                else if(newActivity !== 'working') newActivity = 'commuting_to_work';
            } else if (gameTimeHours >= 17 && gameTimeHours < 19) { // Commute home
                if (isAtWork) newActivity = 'commuting_home';
            } else { // Evening
                if (isAtHome) newActivity = 'idle';
                else newActivity = 'commuting_home';
            }
        }
        // NPCs without workplaces (guards, nobles, unemployed)
        else {
            // During the day, wander or visit POIs
            if (gameTimeHours >= 8 && gameTimeHours < 20) {
                const shouldVisitPOI = Math.random() < 0.15; // Less frequent for non-workers
                if (shouldVisitPOI && !memory.currentDestination) {
                    const poi = findNearbyPOI(npc, map);
                    if (poi) {
                        memory.currentDestination = poi;
                        newActivity = 'visiting_poi';
                    } else {
                        newActivity = 'wandering';
                    }
                } else if (memory.currentDestination) {
                    const distToDest = Math.hypot(npc.x - memory.currentDestination.x, npc.y - memory.currentDestination.y);
                    if (distToDest <= 1.5) {
                        memory.currentDestination = null;
                        newActivity = 'wandering';
                    } else {
                        newActivity = 'visiting_poi';
                    }
                } else {
                    newActivity = isAtHome ? 'idle' : 'wandering';
                }
            } else {
                // Evening - go home
                if (isAtHome) newActivity = 'idle';
                else newActivity = 'commuting_home';
            }
        }
    } else {
        // No home - just wander (rare case)
        newActivity = 'wandering';
    }

    const allNeighbors = getNeighbors(npc.x, npc.y, map);
    let walkableNeighbors = allNeighbors.filter(isWalkableForNpc);

    // Filter out tiles occupied by other NPCs to prevent collision
    if (allNpcs && allNpcs.length > 1) {
        const occupiedTiles = new Set(
            allNpcs
                .filter(otherNpc => otherNpc.id !== npc.id)
                .map(otherNpc => `${otherNpc.x},${otherNpc.y}`)
        );
        walkableNeighbors = walkableNeighbors.filter(tile =>
            !occupiedTiles.has(`${tile.x},${tile.y}`)
        );
    }

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

    // NO MORE PROBABILITY CHECKS - If it's time to move, NPC moves!
    // The movement profile already determines frequency

    // Set up idle wander anchor if needed
    if ((newActivity === 'idle' || newActivity === 'wandering') && !memory.idleWanderAnchor) {
        memory.idleWanderAnchor = { x: npc.x, y: npc.y };
    }

    // Check for activity transitions (for smoother movement changes)
    if (memory.lastActivity && memory.lastActivity !== newActivity) {
        // Activity changed - recalculate movement time immediately
        memory.nextMoveTime = calculateNextMoveTime(npc, newActivity);
        memory.lastActivity = newActivity;

        // Clear idle anchor on major activity change
        if (newActivity.includes('commuting') || newActivity === 'visiting_poi') {
            memory.idleWanderAnchor = null;
        }
    }

    // --- State-based Action ---
    switch(newActivity) {
        case 'visiting_poi': {
            if (memory.currentDestination) {
                nextPos = moveTowards({ x: npc.x, y: npc.y }, memory.currentDestination, walkableNeighbors);
            }
            break;
        }
        case 'commuting_to_work': {
            const target = workplace ? { x: workplace.location[0], y: workplace.location[1] } : null;
            if (target) {
                const dist = Math.hypot(npc.x - target.x, npc.y - target.y);
                if (dist <= 1.5) {
                    // Arrived at work - update activity and timer
                    memory.nextMoveTime = calculateNextMoveTime(npc, 'working');
                    memory.lastActivity = 'working';
                    memory.destinationPath = undefined; // Clear path
                    memory.pathIndex = undefined;
                    return { activity: 'working' };
                }

                // Performance optimization: Continue on existing path if we have one
                if (memory.currentDestination &&
                    memory.currentDestination.x === target.x &&
                    memory.currentDestination.y === target.y &&
                    walkableNeighbors.length > 0) {
                    // Still going to same destination - just move toward it
                    nextPos = moveTowards({ x: npc.x, y: npc.y }, target, walkableNeighbors);
                } else {
                    // New destination or path blocked - recalculate
                    memory.currentDestination = target;
                    nextPos = moveTowards({ x: npc.x, y: npc.y }, target, walkableNeighbors);
                }
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
                    // Arrived at home - update activity and timer
                    memory.nextMoveTime = calculateNextMoveTime(npc, 'idle');
                    memory.lastActivity = 'idle';
                    memory.destinationPath = undefined; // Clear path
                    memory.pathIndex = undefined;
                    return { activity: 'idle' };
                }

                // Performance optimization: Continue on existing path if we have one
                if (memory.currentDestination &&
                    memory.currentDestination.x === target.x &&
                    memory.currentDestination.y === target.y &&
                    walkableNeighbors.length > 0) {
                    // Still going to same destination - just move toward it
                    nextPos = moveTowards({ x: npc.x, y: npc.y }, target, walkableNeighbors);
                } else {
                    // New destination or path blocked - recalculate
                    memory.currentDestination = target;
                    nextPos = moveTowards({ x: npc.x, y: npc.y }, target, walkableNeighbors);
                }
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
            } else if (newActivity === 'idle' && memory.idleWanderAnchor) {
                baseTarget = memory.idleWanderAnchor;
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
                    if (Math.random() < 0.7) { // Increased from 50% to 70% for goal-driven movement
                         nextPos = moveTowards({ x: npc.x, y: npc.y }, goalTargetPos, walkableNeighbors);
                         goalDriven = true;
                    }
                }
                if (goalDriven) break;
            }

            if (baseTarget) {
                // Reduce wander radius at night (except for guards)
                const isNight = gameTimeHours >= 22 || gameTimeHours < 5;
                const profession = npc.profession?.toLowerCase() || '';
                const isGuard = profession.includes('guard') || profession.includes('watch');

                let baseRadius = (npc as any).wanderRadius ||
                    (newActivity === 'idle' ? 3 : newActivity === 'working' ? 4 : 5);

                // Reduce movement radius at night for non-guards
                if (isNight && !isGuard) {
                    baseRadius = Math.max(1, Math.floor(baseRadius * 0.5)); // 50% radius at night
                }

                const WANDER_RADIUS = baseRadius;
                const distFromAnchor = Math.hypot(npc.x - baseTarget.x, npc.y - baseTarget.y);

                if (distFromAnchor > WANDER_RADIUS) {
                    // Return to anchor point
                    nextPos = moveTowards({ x: npc.x, y: npc.y }, baseTarget, walkableNeighbors);
                } else {
                    // Wander within radius - prefer tiles 2-3 away for idle
                    if (newActivity === 'idle') {
                        const validTiles = walkableNeighbors.filter(t => {
                            const dist = Math.hypot(t.x - baseTarget.x, t.y - baseTarget.y);
                            return dist >= 1 && dist <= 3;
                        });
                        if (validTiles.length > 0) {
                            nextPos = validTiles[Math.floor(Math.random() * validTiles.length)];
                        } else {
                            nextPos = walkableNeighbors[Math.floor(Math.random() * walkableNeighbors.length)];
                        }
                    } else {
                        // Regular wandering for working/wandering states
                        nextPos = walkableNeighbors[Math.floor(Math.random() * walkableNeighbors.length)];
                    }
                }
            } else {
                // Pure wandering with social clustering
                // Check if other NPCs are nearby for social behavior
                let nearbyNpcs = 0;
                let socialCenter: Point | null = null;

                if (allNpcs && (newActivity === 'idle' || newActivity === 'wandering')) {
                    let totalX = 0, totalY = 0;
                    for (const otherNpc of allNpcs) {
                        if (otherNpc.id === npc.id) continue;
                        const dist = Math.hypot(otherNpc.x - npc.x, otherNpc.y - npc.y);
                        if (dist <= 4) { // Within social range
                            nearbyNpcs++;
                            totalX += otherNpc.x;
                            totalY += otherNpc.y;
                        }
                    }

                    if (nearbyNpcs >= 2) {
                        // Social clustering - tend to stay near group
                        socialCenter = {
                            x: Math.floor(totalX / nearbyNpcs),
                            y: Math.floor(totalY / nearbyNpcs)
                        };
                    }
                }

                if (socialCenter) {
                    // 60% chance to move toward social center, 40% random
                    if (Math.random() < 0.6) {
                        const validTiles = walkableNeighbors.filter(t => {
                            const dist = Math.hypot(t.x - socialCenter!.x, t.y - socialCenter!.y);
                            return dist <= 3; // Stay within social distance
                        });

                        if (validTiles.length > 0) {
                            nextPos = validTiles[Math.floor(Math.random() * validTiles.length)];
                        } else {
                            nextPos = walkableNeighbors[Math.floor(Math.random() * walkableNeighbors.length)];
                        }
                    } else {
                        // Random movement within social area
                        nextPos = walkableNeighbors[Math.floor(Math.random() * walkableNeighbors.length)];
                    }
                } else {
                    // No social group - pure random
                    nextPos = walkableNeighbors[Math.floor(Math.random() * walkableNeighbors.length)];
                }
            }
            break;
        }
    }
    
    // Set next movement time based on activity and movement success
    memory.nextMoveTime = calculateNextMoveTime(npc, newActivity);
    memory.lastActivity = newActivity;

    // Only return new position if NPC actually moved
    if (nextPos.x !== npc.x || nextPos.y !== npc.y) {
        // CRITICAL: Bounds check to prevent NPCs from going off map
        const safeX = Math.max(0, Math.min(nextPos.x, map.width - 1));
        const safeY = Math.max(0, Math.min(nextPos.y, map.height - 1));

        if (safeX !== nextPos.x || safeY !== nextPos.y) {
            console.warn(`[NPC AI] ${npc.name} tried to move out of bounds to (${nextPos.x}, ${nextPos.y}), clamped to (${safeX}, ${safeY})`);
        }

        // Debug logging for movement profiles (occasional)
        if (Math.random() < 0.02) { // 2% chance to log
            const profile = getMovementProfile(npc, newActivity);
            console.log(`[NPC Movement] ${npc.name} (${npc.profession || 'citizen'}) - Activity: ${newActivity}, Speed: ${profile.baseSpeed}ms, Desc: ${profile.description}`);
        }

        return { activity: newActivity, x: safeX, y: safeY };
    }

    return { activity: newActivity };
}
