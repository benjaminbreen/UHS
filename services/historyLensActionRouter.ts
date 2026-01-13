import type { GameDate, MapData, NpcEntity, PlayerCharacter, HomeAnchor, AnimalEntity } from '../types';
import type { HistoryLensAction, StructureCard, StructureCardType } from '../types/historyLens';
import { createItemInstance, addItemToInventory, removeItemFromInventory } from '../utils/inventoryUtils';
import { timeAdvancementService } from './timeAdvancementService';
import { getDaysInMonth } from '../utils/dateUtils';
import { createHistoryLensNpcs } from './historyLensNpcFactory';
import { findEdgeTarget } from './historyLensPathfinding';
import { ANIMAL_DATA } from '../constants/gameData/animals';

type ActionRouterState = {
  playerCharacter: PlayerCharacter;
  mapData: MapData;
  gameDate: GameDate;
  gameTimeHours: number;
  playerX: number;
  playerY: number;
  hasVessel: boolean;
  playerMode: 'onFoot' | 'ship' | string;
  npcs: NpcEntity[];
  animals: AnimalEntity[];
  homeAnchor?: HomeAnchor | null;
};

export type HistoryLensActionResult = {
  moveRequest?: { dx: number; dy: number; steps: number };
  navigateTarget?: { x: number; y: number; label: string; kind: string };
  animalTarget?: { animal: AnimalEntity; huntMode: boolean }; // For navigate_animal - includes the actual animal entity
  npcTarget?: { npc: NpcEntity }; // For seek_npc - includes the actual NPC entity for encounter
  npcSpawnRequests?: Array<{ count: number; role?: string; name?: string }>;
  nextTime?: { hours: number; date: GameDate };
  nextInventory?: PlayerCharacter['inventory'];
  playerUpdates?: Partial<PlayerCharacter>;
  triggerGameOver?: boolean;
  npcAdditions?: NpcEntity[];
  structureCard?: StructureCard;
  rejections: string[];
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const isTilePassable = (mapData: MapData, x: number, y: number, hasVessel: boolean): boolean => {
  const tile = mapData.tiles[y]?.[x];
  if (!tile) return false;
  if (tile.isBlocking) return false;
  if (!tile.isLand && !tile.hasBridge && !hasVessel) return false;
  return true;
};

const resolveNearestNpc = (
  state: ActionRouterState,
  maxDistance: number,
  role?: string
): { x: number; y: number; label: string; kind: string; npc: NpcEntity } | null => {
  const candidates = state.npcs.filter(npc => {
    const dist = Math.hypot(npc.x - state.playerX, npc.y - state.playerY);
    if (dist > maxDistance) return false;
    if (role && npc.role?.toLowerCase() !== role.toLowerCase()) return false;
    return true;
  });
  if (!candidates.length) return null;
  const nearest = candidates.reduce((best, npc) => {
    const dist = Math.hypot(npc.x - state.playerX, npc.y - state.playerY);
    return dist < best.distance ? { npc, distance: dist } : best;
  }, { npc: candidates[0], distance: Math.hypot(candidates[0].x - state.playerX, candidates[0].y - state.playerY) });
  return {
    x: nearest.npc.x,
    y: nearest.npc.y,
    label: nearest.npc.name || 'nearby traveler',
    kind: 'npc',
    npc: nearest.npc
  };
};

/**
 * Find nearest animal matching the given criteria.
 * @param state - Current game state
 * @param maxDistance - Maximum distance to search
 * @param speciesQuery - Optional species name or type to filter by (e.g., "deer", "wolf", "prey", "predator")
 * @returns The matching animal entity or null if none found
 */
const resolveNearestAnimal = (
  state: ActionRouterState,
  maxDistance: number,
  speciesQuery?: string
): AnimalEntity | null => {
  if (!state.animals || !state.animals.length) return null;

  const normalizedQuery = speciesQuery?.toLowerCase().trim();

  const candidates = state.animals.filter(animal => {
    const dist = Math.hypot(animal.x - state.playerX, animal.y - state.playerY);
    if (dist > maxDistance) return false;
    if (dist < 0.5) return false; // Don't target animals on same tile

    // If no query, match any animal
    if (!normalizedQuery) return true;

    // Get animal data for type checking
    const animalData = ANIMAL_DATA[animal.baseId];
    const speciesName = animal.speciesName?.toLowerCase() || animal.baseId.toLowerCase();
    const animalType = animalData?.type?.toLowerCase(); // 'prey', 'predator', etc.

    // Match by exact species name
    if (speciesName.includes(normalizedQuery)) return true;

    // Match by base ID (e.g., "DEER", "WOLF")
    if (animal.baseId.toLowerCase().includes(normalizedQuery)) return true;

    // Match by animal type (prey/predator)
    if (animalType && animalType.includes(normalizedQuery)) return true;

    // Match common synonyms
    if (normalizedQuery === 'game' && animalType === 'prey') return true;
    if (normalizedQuery === 'beast' || normalizedQuery === 'dangerous') {
      if (animalType === 'predator') return true;
    }

    return false;
  });

  if (!candidates.length) return null;

  // Return the nearest matching animal
  const nearest = candidates.reduce((best, animal) => {
    const dist = Math.hypot(animal.x - state.playerX, animal.y - state.playerY);
    return dist < best.distance ? { animal, distance: dist } : best;
  }, { animal: candidates[0], distance: Math.hypot(candidates[0].x - state.playerX, candidates[0].y - state.playerY) });

  return nearest.animal;
};

// Mapping from navigate_nearest kind to tile biomes to search
const KIND_TO_BIOMES: Record<string, string[]> = {
  'city': ['DENSE_CITY', 'LOW_DENSITY_CITY', 'CITY_CENTER', 'URBAN'],
  'farm': ['FARMLAND'],
  'market': ['MARKETPLACE'],
  'holy_site': ['HOLY_SITE'],
  'palace': ['PALACE'],
  'government': ['GOVERNMENT_DISTRICT'],
  'harbor': ['HARBOR_DISTRICT'],
  'industrial': ['INDUSTRIAL_DISTRICT'],
  'hamlet': ['HAMLET'],
  'plaza': ['PLAZA'],
  'park': ['PARK'],
  'ruin': ['RUINS']
};

// Keywords to search for in structure names (for flexible matching)
const KIND_NAME_KEYWORDS: Record<string, string[]> = {
  'fortress': ['fortress', 'fort', 'citadel', 'stronghold', 'castle', 'keep'],
  'palace': ['palace', 'royal', 'throne'],
  'temple': ['temple', 'shrine', 'sanctuary', 'cathedral', 'church', 'mosque', 'synagogue'],
  'market': ['market', 'bazaar', 'souk', 'trading'],
  'farm': ['farm', 'plantation', 'orchard', 'vineyard'],
  'mine': ['mine', 'quarry', 'mining'],
  'ruin': ['ruin', 'ancient', 'abandoned', 'lost', 'forgotten', 'deserted']
};

// Human-readable labels for biome types
const BIOME_NAV_LABELS: Record<string, string> = {
  'DENSE_CITY': 'city center',
  'LOW_DENSITY_CITY': 'city district',
  'CITY_CENTER': 'city center',
  'URBAN': 'urban area',
  'FARMLAND': 'farmland',
  'MARKETPLACE': 'marketplace',
  'FORTRESS': 'fortress',
  'HOLY_SITE': 'sacred site',
  'PALACE': 'palace',
  'GOVERNMENT_DISTRICT': 'government quarter',
  'HARBOR_DISTRICT': 'harbor',
  'INDUSTRIAL_DISTRICT': 'industrial area',
  'HAMLET': 'hamlet',
  'PLAZA': 'public square',
  'PARK': 'park',
  'RUINS': 'ruins'
};

// Map navigate_nearest kinds to StructureCardType for propose_enter
const KIND_TO_CARD_TYPE: Record<string, StructureCardType> = {
  'city': 'city',
  'settlement': 'city',
  'town': 'city',
  'fortress': 'fortress',
  'fort': 'fortress',
  'castle': 'fortress',
  'mine': 'mine',
  'mining': 'mine',
  'quarry': 'quarry',
  'fishing': 'fishing_hut',
  'fishing_hut': 'fishing_hut',
  'palace': 'palace',
  'holy_site': 'holy_site',
  'temple': 'holy_site',
  'church': 'holy_site',
  'shrine': 'holy_site',
  'ruin': 'ruins',
  'ruins': 'ruins',
  'government': 'government',
  'farm': 'farm',
  'market': 'market',
  'marketplace': 'market',
  'harbor': 'harbor',
  'port': 'harbor',
  'woodcutter': 'woodcutter'
};

// Find structure data by location for propose_enter
const findStructureAtLocation = (
  state: ActionRouterState,
  x: number,
  y: number,
  kind: string
): { id: string; name: string; description?: string } | null => {
  const structures = state.mapData.terrainStructures || [];

  // Find structure at or very near the target location
  const structure = structures.find(s =>
    Math.hypot(s.location[0] - x, s.location[1] - y) <= 2
  );

  if (structure) {
    return {
      id: structure.id,
      name: structure.name || structure.structureType.replace(/_/g, ' '),
      description: structure.description
    };
  }

  // For biome-based locations (cities), use tile info
  const tile = state.mapData.tiles[y]?.[x];
  if (tile) {
    return {
      id: `tile-${x}-${y}`,
      name: tile.cityName || BIOME_NAV_LABELS[String(tile.biome)] || kind,
      description: undefined
    };
  }

  return null;
};

const resolveNearestStructure = (
  state: ActionRouterState,
  kind: string,
  maxDistance: number
): { x: number; y: number; label: string; kind: string } | null => {
  const structures = state.mapData.terrainStructures || [];
  const marketplaces = state.mapData.marketplaces || [];
  const normalizedKind = kind.toLowerCase();
  const resolvedKind = normalizedKind === 'settlement' || normalizedKind === 'town' ? 'city' : normalizedKind;

  // Get name keywords for flexible matching
  const nameKeywords = KIND_NAME_KEYWORDS[resolvedKind] || [];

  // Helper to check if structure name contains any of the keywords
  const nameMatches = (name: string | undefined): boolean => {
    if (!name || !nameKeywords.length) return false;
    const lowerName = name.toLowerCase();
    return nameKeywords.some(keyword => lowerName.includes(keyword));
  };

  // First, try to find matching terrain structures by type OR by name
  const matchingStructures = structures.filter(structure => {
    // Check by exact structure type first
    if (resolvedKind === 'city') return structure.structureType === 'city_center';
    if (resolvedKind === 'farm') return structure.structureType === 'farm' || nameMatches(structure.name);
    if (resolvedKind === 'market') return structure.structureType === 'marketplace' || nameMatches(structure.name);
    if (resolvedKind === 'ruin') return structure.structureType === 'ruin' || nameMatches(structure.name);
    if (resolvedKind === 'fortress') return structure.structureType === 'fortress' || nameMatches(structure.name);
    if (resolvedKind === 'holy_site') return structure.structureType === 'holy_site' || nameMatches(structure.name);
    if (resolvedKind === 'palace') return structure.structureType === 'palace' || nameMatches(structure.name);
    if (resolvedKind === 'government') return structure.structureType === 'government_district';
    if (resolvedKind === 'fishing') return structure.structureType === 'fishing_hut';
    if (resolvedKind === 'mine') return ['mining_colony', 'quarry'].includes(structure.structureType) || nameMatches(structure.name);
    if (resolvedKind === 'temple') return structure.structureType === 'holy_site' || nameMatches(structure.name);
    if (resolvedKind === 'structure') return true;
    // For any other kind, try name matching as fallback
    return nameMatches(structure.name);
  });

  let candidates: Array<{ x: number; y: number; label: string }> = matchingStructures.map(structure => ({
    x: structure.location[0],
    y: structure.location[1],
    label: structure.name || structure.structureType
  }));

  if (resolvedKind === 'market' && marketplaces.length) {
    candidates = candidates.concat(marketplaces.map(market => ({
      x: market.x,
      y: market.y,
      label: market.name
    })));
  }

  const filteredCandidates = candidates.filter(candidate => {
    const dist = Math.hypot(candidate.x - state.playerX, candidate.y - state.playerY);
    return dist <= maxDistance;
  });

  // If no structures found, search tile biomes for matching types
  const targetBiomes = KIND_TO_BIOMES[resolvedKind];
  if (!filteredCandidates.length && targetBiomes) {
    const mapWidth = state.mapData.tiles[0]?.length ?? state.mapData.width;
    const mapHeight = state.mapData.tiles.length ?? state.mapData.height;
    const minX = Math.max(0, state.playerX - maxDistance);
    const maxX = Math.min(mapWidth - 1, state.playerX + maxDistance);
    const minY = Math.max(0, state.playerY - maxDistance);
    const maxY = Math.min(mapHeight - 1, state.playerY + maxDistance);

    // Track clusters to avoid adding too many candidates from the same area
    const seenClusters = new Set<string>();

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const tile = state.mapData.tiles[y]?.[x];
        if (!tile) continue;
        const biome = String(tile.biome);
        if (!targetBiomes.includes(biome)) continue;

        // Cluster by 4-tile areas to avoid duplicate nearby tiles
        const clusterKey = `${Math.floor(x / 4)}-${Math.floor(y / 4)}`;
        if (seenClusters.has(clusterKey)) continue;
        seenClusters.add(clusterKey);

        const dist = Math.hypot(x - state.playerX, y - state.playerY);
        // Include tiles the player is standing on (dist >= 0) for enter actions
        if (dist <= maxDistance) {
          const label = tile.cityName || BIOME_NAV_LABELS[biome] || biome.toLowerCase().replace(/_/g, ' ');
          filteredCandidates.push({ x, y, label });
        }
      }
    }
  }

  if (!filteredCandidates.length) return null;

  const nearest = filteredCandidates.reduce((best, candidate) => {
    const dist = Math.hypot(candidate.x - state.playerX, candidate.y - state.playerY);
    return dist < best.distance ? { candidate, distance: dist } : best;
  }, { candidate: filteredCandidates[0], distance: Math.hypot(filteredCandidates[0].x - state.playerX, filteredCandidates[0].y - state.playerY) });

  return { ...nearest.candidate, kind: resolvedKind };
};

const resolveMove = (
  action: HistoryLensAction,
  state: ActionRouterState
): { dx: number; dy: number; steps: number } | null => {
  const params = action.params || {};
  const dxParam = Number(params.dx);
  const dyParam = Number(params.dy);
  const direction = typeof params.direction === 'string' ? params.direction.toLowerCase() : null;
  const steps = clamp(Number(params.steps || 1), 1, 5);

  let dx = 0;
  let dy = 0;

  if (!Number.isNaN(dxParam) || !Number.isNaN(dyParam)) {
    const rawDx = Number.isNaN(dxParam) ? 0 : dxParam;
    const rawDy = Number.isNaN(dyParam) ? 0 : dyParam;
    // For diagonal dx/dy, pick the dominant axis (or default to horizontal)
    if (rawDx !== 0 && rawDy !== 0) {
      if (Math.abs(rawDx) >= Math.abs(rawDy)) {
        dx = clamp(Math.sign(rawDx), -1, 1);
      } else {
        dy = clamp(Math.sign(rawDy), -1, 1);
      }
    } else {
      dx = clamp(Math.sign(rawDx), -1, 1);
      dy = clamp(Math.sign(rawDy), -1, 1);
    }
  } else if (direction) {
    // Handle all 8 directions - for diagonals, alternate between axes
    switch (direction) {
      case 'north':
        dy = -1;
        break;
      case 'south':
        dy = 1;
        break;
      case 'east':
        dx = 1;
        break;
      case 'west':
        dx = -1;
        break;
      case 'northeast':
        // For diagonal directions, move in the first axis (will need multiple moves)
        dx = 1;  // Move east first
        break;
      case 'northwest':
        dx = -1; // Move west first
        break;
      case 'southeast':
        dx = 1;  // Move east first
        break;
      case 'southwest':
        dx = -1; // Move west first
        break;
      default:
        return null;
    }
  }

  if (dx === 0 && dy === 0) {
    return null;
  }

  const nextX = state.playerX + dx;
  const nextY = state.playerY + dy;
  const tile = state.mapData.tiles[nextY]?.[nextX];
  if (tile && !isTilePassable(state.mapData, nextX, nextY, state.hasVessel)) {
    return null;
  }

  return { dx, dy, steps };
};

const applyTimeAdvance = async (
  action: HistoryLensAction,
  state: ActionRouterState
): Promise<{ hours: number; date: GameDate; playerUpdates?: Partial<PlayerCharacter> } | null> => {
  const params = action.params || {};
  const hours = clamp(Number(params.hours || 0), 1, 8);
  if (!hours) return null;

  const activity = typeof params.activity === 'string' ? params.activity : 'waiting';
  const currentTile = state.mapData.tiles[state.playerY]?.[state.playerX];
  const result = await timeAdvancementService.advanceTime(
    {
      duration: hours,
      durationType: 'hours',
      activity: activity === 'traveling' || activity === 'resting' || activity === 'working' ? activity : 'waiting',
      location: currentTile ? {
        biome: currentTile.biome,
        climate: state.mapData.climate,
        season: state.mapData.season || 'spring',
        isDangerous: currentTile.biome === 'MOUNTAIN' || currentTile.biome === 'HIGH_PEAK'
      } : undefined
    },
    state.playerCharacter,
    state.gameTimeHours,
    state.gameDate.day,
    state.gameDate.month,
    state.gameDate.year
  );

  let newHours = state.gameTimeHours + result.hoursPassed;
  let newDays = state.gameDate.day;
  let newMonth = state.gameDate.month;
  let newYear = state.gameDate.year;

  while (newHours >= 24) {
    newHours -= 24;
    newDays += 1;
    const daysInMonth = getDaysInMonth(newYear, newMonth);
    if (newDays > daysInMonth) {
      newDays = 1;
      newMonth += 1;
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }
    }
  }

  const playerUpdates: Partial<PlayerCharacter> = {};
  if (result.resourceChanges.health) {
    playerUpdates.health = Math.min(
      state.playerCharacter.maxHealth,
      state.playerCharacter.health + result.resourceChanges.health
    );
  }
  if (result.resourceChanges.fatigue) {
    playerUpdates.fatigue = Math.max(
      0,
      Math.min(state.playerCharacter.maxFatigue, state.playerCharacter.fatigue + result.resourceChanges.fatigue)
    );
  }

  return {
    hours: newHours,
    date: { year: newYear, month: newMonth, day: newDays },
    playerUpdates: Object.keys(playerUpdates).length ? playerUpdates : undefined
  };
};

export async function applyHistoryLensActions(
  actions: HistoryLensAction[],
  state: ActionRouterState
): Promise<HistoryLensActionResult> {
  let moveRequest: { dx: number; dy: number; steps: number } | undefined;
  let navigateTarget: { x: number; y: number; label: string; kind: string } | undefined;
  let animalTarget: { animal: AnimalEntity; huntMode: boolean } | undefined;
  let npcTarget: { npc: NpcEntity } | undefined;
  let nextTime: { hours: number; date: GameDate } | undefined;
  let workingInventory = state.playerCharacter.inventory;
  let nextInventory: PlayerCharacter['inventory'] | undefined;
  let playerUpdates: Partial<PlayerCharacter> | undefined;
  let triggerGameOver = false;
  let npcAdditions: NpcEntity[] | undefined;
  let npcSpawnRequests: Array<{ count: number; role?: string; name?: string }> = [];
  let structureCard: StructureCard | undefined;
  let hasMovementIntent = false;
  const rejections: string[] = [];

  for (const action of actions) {
    switch (action.type) {
      case 'move': {
        const move = resolveMove(action, state);
        if (!move) {
          rejections.push('Movement not possible from this location.');
          break;
        }
        moveRequest = move;
        hasMovementIntent = true;
        break;
      }
      case 'navigate_nearest': {
        const params = action.params || {};
        const kind = typeof params.kind === 'string' ? params.kind : '';
        if (!kind) {
          rejections.push('No destination specified.');
          break;
        }
        const target = resolveNearestStructure(state, kind, 40);
        if (!target) {
          // Log for debugging
          console.log(`[HistoryLens] navigate_nearest failed for kind="${kind}". Structures available:`,
            (state.mapData.terrainStructures || []).slice(0, 10).map(s => `${s.name || s.structureType} (${s.structureType}) at ${s.location}`));

          // Find what IS nearby to suggest alternatives
          const nearbyStructures = (state.mapData.terrainStructures || [])
            .filter(s => Math.hypot(s.location[0] - state.playerX, s.location[1] - state.playerY) <= 40)
            .slice(0, 3)
            .map(s => s.name || s.structureType);

          if (nearbyStructures.length > 0) {
            rejections.push(`No ${kind} found nearby. Visible locations: ${nearbyStructures.join(', ')}.`);
          } else {
            rejections.push(`No nearby ${kind} appears within reach.`);
          }
          break;
        }
        console.log(`[HistoryLens] Navigating to ${target.label} at (${target.x}, ${target.y})`);
        navigateTarget = target;
        hasMovementIntent = true;
        break;
      }
      case 'navigate_edge': {
        const params = action.params || {};
        const direction = typeof params.direction === 'string' ? params.direction as 'north' | 'south' | 'east' | 'west' : null;
        if (!direction || !['north', 'south', 'east', 'west'].includes(direction)) {
          rejections.push('Invalid direction specified for edge navigation.');
          break;
        }
        const edgeTarget = findEdgeTarget(state.mapData, state.playerX, state.playerY, direction, state.playerMode);
        if (!edgeTarget) {
          rejections.push(`Cannot find a passable route to the ${direction}ern edge of this area.`);
          break;
        }
        console.log(`[HistoryLens] Navigating to ${direction} edge at (${edgeTarget.x}, ${edgeTarget.y})`);
        navigateTarget = {
          x: edgeTarget.x,
          y: edgeTarget.y,
          label: `${direction}ern edge`,
          kind: 'edge'
        };
        hasMovementIntent = true;
        break;
      }
      case 'navigate_home': {
        const home = state.homeAnchor;
        if (!home) {
          rejections.push('You have no home to return to.');
          break;
        }
        // Check if home is on the current map
        if (home.mapSeed !== state.mapData.seed) {
          rejections.push(`Your home in ${home.mapAreaName} is not on this map. You would need to travel there.`);
          break;
        }
        // Check if already at home
        if (home.x === state.playerX && home.y === state.playerY) {
          rejections.push('You are already home.');
          break;
        }
        console.log(`[HistoryLens] Navigating home to ${home.label} at (${home.x}, ${home.y})`);
        navigateTarget = {
          x: home.x,
          y: home.y,
          label: home.label || 'home',
          kind: 'home'
        };
        hasMovementIntent = true;
        break;
      }
      case 'seek_npc': {
        const params = action.params || {};
        const role = typeof params.role === 'string' ? params.role : undefined;
        const target = resolveNearestNpc(state, 10, role);
        if (!target) {
          rejections.push('No one nearby appears willing or able to talk.');
          break;
        }
        // Store the NPC entity for the encounter when we arrive
        npcTarget = { npc: target.npc };
        navigateTarget = {
          x: target.x,
          y: target.y,
          label: target.label,
          kind: 'npc'
        };
        hasMovementIntent = true;
        break;
      }
      case 'navigate_animal': {
        // Navigate to an animal - for approaching, hunting, or taming
        const params = action.params || {};
        const species = typeof params.species === 'string' ? params.species : undefined;
        const huntMode = params.hunt === true || params.mode === 'hunt';

        // Search a larger radius for animals (20 tiles - they should be visible at distance)
        const animal = resolveNearestAnimal(state, 20, species);
        if (!animal) {
          const speciesText = species ? ` ${species}` : '';
          // Check if any animals exist at all
          if (state.animals.length === 0) {
            rejections.push(`No wildlife visible in this area.`);
          } else {
            // List what animals ARE visible
            const visibleAnimals = state.animals
              .filter(a => Math.hypot(a.x - state.playerX, a.y - state.playerY) <= 20)
              .slice(0, 3)
              .map(a => a.speciesName || a.baseId.toLowerCase());
            if (visibleAnimals.length > 0) {
              rejections.push(`No${speciesText} nearby. You can see: ${visibleAnimals.join(', ')}.`);
            } else {
              rejections.push(`No${speciesText} visible from here.`);
            }
          }
          break;
        }

        const animalName = animal.speciesName || animal.baseId.toLowerCase().replace(/_/g, ' ');
        const modeLabel = huntMode ? 'hunting' : 'approaching';
        console.log(`[HistoryLens] ${modeLabel} ${animalName} at (${animal.x}, ${animal.y})`);

        // Set navigation target to the animal's location
        navigateTarget = {
          x: animal.x,
          y: animal.y,
          label: `the ${animalName}`,
          kind: huntMode ? 'hunt_animal' : 'animal'
        };

        // Store the animal entity for the encounter when we arrive
        animalTarget = { animal, huntMode };
        hasMovementIntent = true;
        break;
      }
      case 'advance_time': {
        try {
          const timeResult = await applyTimeAdvance(action, state);
          if (!timeResult) {
            rejections.push('Time cannot advance in that way right now.');
            break;
          }
          nextTime = { hours: timeResult.hours, date: timeResult.date };
          if (timeResult.playerUpdates) {
            playerUpdates = { ...(playerUpdates || {}), ...timeResult.playerUpdates };
          }
        } catch (error) {
          console.warn('[HistoryLens] Time advance failed:', error);
          rejections.push('Time cannot advance right now.');
        }
        break;
      }
      case 'inventory_add': {
        const params = action.params || {};
        const baseId = typeof params.baseId === 'string' ? params.baseId : '';
        const quantity = clamp(Number(params.quantity || 1), 1, 3);
        if (!baseId) {
          rejections.push('No item could be added.');
          break;
        }
        for (let i = 0; i < quantity; i += 1) {
          const item = createItemInstance(baseId, state.mapData.era, state.mapData.culturalZone);
          if (!item) {
            rejections.push('That item does not fit this time or place.');
            break;
          }
          workingInventory = addItemToInventory(workingInventory, item);
          nextInventory = workingInventory;
        }
        break;
      }
      case 'inventory_remove': {
        const params = action.params || {};
        const name = typeof params.name === 'string' ? params.name : '';
        const quantity = clamp(Number(params.quantity || 1), 1, 3);
        if (!name) {
          rejections.push('No item could be removed.');
          break;
        }
        const hasItem = workingInventory.some(item => item.name.toLowerCase() === name.toLowerCase());
        if (!hasItem) {
          rejections.push('That item is not in your inventory.');
          break;
        }
        const result = removeItemFromInventory(workingInventory, name, quantity);
        workingInventory = result.inventory;
        nextInventory = workingInventory;
        break;
      }
      case 'player_damage': {
        const params = action.params || {};
        const amount = clamp(Number(params.amount || 0), 1, 50);
        if (!amount) {
          rejections.push('No damage was applied.');
          break;
        }
        const nextHealth = Math.max(0, state.playerCharacter.health - amount);
        playerUpdates = { ...(playerUpdates || {}), health: nextHealth };
        if (nextHealth <= 0) {
          triggerGameOver = true;
        }
        break;
      }
      case 'game_over': {
        triggerGameOver = true;
        break;
      }
      case 'npc_create': {
        const params = action.params || {};
        const count = clamp(Number(params.count || 1), 1, 3);
        const preferredRole = typeof params.role === 'string' ? params.role : undefined;
        const preferredName = typeof params.name === 'string' ? params.name : undefined;
        npcSpawnRequests = [...npcSpawnRequests, { count, role: preferredRole, name: preferredName }];
        break;
      }
      case 'propose_enter': {
        const params = action.params || {};
        const kind = typeof params.kind === 'string' ? params.kind.toLowerCase() : '';

        if (!kind) {
          rejections.push('No location type specified for entry.');
          break;
        }

        // Map the kind to a StructureCardType
        const cardType = KIND_TO_CARD_TYPE[kind];
        if (!cardType) {
          rejections.push(`Cannot enter ${kind} - not a recognized location type.`);
          break;
        }

        // Find the nearest structure of this kind (use existing navigateTarget if set, otherwise search)
        let targetLocation = navigateTarget;
        if (!targetLocation) {
          targetLocation = resolveNearestStructure(state, kind, 10); // Shorter range for propose_enter
        }

        if (!targetLocation) {
          rejections.push(`No ${kind} nearby to enter.`);
          break;
        }

        // Get structure details
        const structureInfo = findStructureAtLocation(state, targetLocation.x, targetLocation.y, kind);
        if (!structureInfo) {
          rejections.push(`Could not identify the ${kind} at this location.`);
          break;
        }

        // Create the structure card
        structureCard = {
          type: 'enter_structure',
          structureId: structureInfo.id,
          structureName: structureInfo.name,
          structureType: cardType,
          description: structureInfo.description,
          location: { x: targetLocation.x, y: targetLocation.y },
          resolved: false
        };

        console.log(`[HistoryLens] propose_enter: Created card for ${structureInfo.name} (${cardType}) at (${targetLocation.x}, ${targetLocation.y})`);
        break;
      }
      default:
        break;
    }
  }

  if (npcSpawnRequests.length && !hasMovementIntent) {
    for (const request of npcSpawnRequests) {
      const created = createHistoryLensNpcs({
        mapData: state.mapData,
        gameDate: state.gameDate,
        playerX: state.playerX,
        playerY: state.playerY,
        playerMode: state.playerMode,
        existingNpcs: state.npcs,
        preferredRole: request.role,
        preferredName: request.name,
        count: request.count
      });
      if (!created.length) {
        rejections.push('No one appears nearby.');
      } else {
        npcAdditions = [...(npcAdditions || []), ...created];
      }
    }
  }

  return {
    moveRequest,
    navigateTarget,
    animalTarget,
    npcTarget,
    npcSpawnRequests: hasMovementIntent ? npcSpawnRequests : undefined,
    nextTime,
    nextInventory,
    playerUpdates,
    triggerGameOver,
    npcAdditions,
    structureCard,
    rejections
  };
}
