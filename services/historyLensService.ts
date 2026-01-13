import { GoogleGenAI } from '@google/genai';
import type { AnimalEntity, GameDate, MapData, NpcEntity, PlayerCharacter, TerrainStructure, HomeAnchor, Tile } from '../types';
import type { MarketplaceInfo } from '../types/core/map';
import type { HistoryLensResponse } from '../types/historyLens';

type HistoryLensMessage = {
  sender: 'system' | 'player' | 'narrator';
  text: string;
};

type HistoryLensContext = {
  playerCharacter: PlayerCharacter;
  mapData: MapData;
  gameDate: GameDate;
  gameTimeHours: number;
  playerX: number;
  playerY: number;
  npcs: NpcEntity[];
  animals: AnimalEntity[];
  terrainStructures: TerrainStructure[];
  marketplaces?: MarketplaceInfo[];
  playerMode?: string;
  homeAnchor?: HomeAnchor | null;
};

// Biome types that represent significant points of interest
const SPECIAL_BIOMES = new Set([
  'DENSE_CITY', 'LOW_DENSITY_CITY', 'CITY_CENTER', 'URBAN', 'HAMLET',
  'GOVERNMENT_DISTRICT', 'PALACE', 'HOLY_SITE', 'MARKETPLACE',
  'FARMLAND', 'HARBOR_DISTRICT', 'INDUSTRIAL_DISTRICT', 'PLAZA', 'PARK',
  'RUINS', 'FORTRESS'
]);

// Priority for displaying nearby features (higher = more important)
const BIOME_PRIORITY: Record<string, number> = {
  'DENSE_CITY': 100,
  'CITY_CENTER': 100,
  'LOW_DENSITY_CITY': 90,
  'PALACE': 85,
  'GOVERNMENT_DISTRICT': 80,
  'FORTRESS': 75,
  'HARBOR_DISTRICT': 70,
  'MARKETPLACE': 65,
  'HOLY_SITE': 60,
  'INDUSTRIAL_DISTRICT': 55,
  'HAMLET': 50,
  'URBAN': 50,
  'PLAZA': 40,
  'PARK': 35,
  'FARMLAND': 30,
  'RUINS': 20
};

// Human-readable labels for biomes
const BIOME_LABELS: Record<string, string> = {
  'DENSE_CITY': 'city center',
  'CITY_CENTER': 'city center',
  'LOW_DENSITY_CITY': 'city district',
  'URBAN': 'urban area',
  'HAMLET': 'hamlet',
  'PALACE': 'palace grounds',
  'GOVERNMENT_DISTRICT': 'government quarter',
  'FORTRESS': 'fortress',
  'HARBOR_DISTRICT': 'harbor',
  'MARKETPLACE': 'marketplace',
  'HOLY_SITE': 'sacred site',
  'INDUSTRIAL_DISTRICT': 'industrial area',
  'PLAZA': 'public square',
  'PARK': 'park',
  'FARMLAND': 'farmland',
  'RUINS': 'ruins'
};

type PointOfInterest = {
  x: number;
  y: number;
  label: string;
  kind: string;
  priority: number;
  distance: number;
};

function findNearbyPointsOfInterest(
  mapData: MapData,
  playerX: number,
  playerY: number,
  radius: number,
  terrainStructures?: TerrainStructure[],
  marketplaces?: MarketplaceInfo[]
): PointOfInterest[] {
  const pois: PointOfInterest[] = [];
  const seenLocations = new Set<string>();
  const tiles = mapData.tiles;
  const minX = Math.max(0, playerX - radius);
  const maxX = Math.min((tiles[0]?.length || mapData.width) - 1, playerX + radius);
  const minY = Math.max(0, playerY - radius);
  const maxY = Math.min((tiles.length || mapData.height) - 1, playerY + radius);

  // Build lookup maps for structures and marketplaces by location
  const structuresByLocation = new Map<string, TerrainStructure>();
  for (const structure of (terrainStructures || [])) {
    const key = `${structure.location[0]},${structure.location[1]}`;
    structuresByLocation.set(key, structure);
  }

  const marketplacesByLocation = new Map<string, MarketplaceInfo>();
  for (const market of (marketplaces || [])) {
    const key = `${market.x},${market.y}`;
    marketplacesByLocation.set(key, market);
  }

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const tile = tiles[y]?.[x];
      if (!tile) continue;
      const biome = String(tile.biome);
      if (!SPECIAL_BIOMES.has(biome)) continue;

      const dist = Math.hypot(x - playerX, y - playerY);
      if (dist > radius || dist < 0.5) continue;

      // Cluster nearby same-biome tiles - only report once per 3-tile area
      const clusterKey = `${biome}-${Math.floor(x / 3)}-${Math.floor(y / 3)}`;
      if (seenLocations.has(clusterKey)) continue;
      seenLocations.add(clusterKey);

      // Try to get a proper name from structures or marketplaces
      const locationKey = `${x},${y}`;
      const structure = structuresByLocation.get(locationKey);
      const marketplace = marketplacesByLocation.get(locationKey);

      // Priority for label: structure name > marketplace name > tile cityName > biome label
      let label: string;
      if (structure?.name) {
        label = structure.name;
      } else if (marketplace?.name) {
        label = marketplace.name;
      } else if (tile.cityName) {
        label = tile.cityName;
      } else {
        // For government districts and marketplaces, also check nearby structures (within 2 tiles)
        // since the structure location might not be exactly on this tile
        let nearbyStructureName: string | undefined;
        if (biome === 'GOVERNMENT_DISTRICT' || biome === 'MARKETPLACE' || biome === 'PALACE' || biome === 'HOLY_SITE') {
          for (const struct of (terrainStructures || [])) {
            const structDist = Math.hypot(struct.location[0] - x, struct.location[1] - y);
            if (structDist <= 2) {
              // Match structure type to biome
              if (biome === 'GOVERNMENT_DISTRICT' && struct.structureType === 'government_district') {
                nearbyStructureName = struct.name;
                break;
              } else if (biome === 'MARKETPLACE' && struct.structureType === 'marketplace') {
                nearbyStructureName = struct.name;
                break;
              } else if (biome === 'PALACE' && struct.structureType === 'palace') {
                nearbyStructureName = struct.name;
                break;
              } else if (biome === 'HOLY_SITE' && struct.structureType === 'holy_site') {
                nearbyStructureName = struct.name;
                break;
              }
            }
          }
          // Also check marketplaces array for MARKETPLACE biome
          if (!nearbyStructureName && biome === 'MARKETPLACE') {
            for (const market of (marketplaces || [])) {
              const marketDist = Math.hypot(market.x - x, market.y - y);
              if (marketDist <= 2 && market.name) {
                nearbyStructureName = market.name;
                break;
              }
            }
          }
        }
        label = nearbyStructureName || BIOME_LABELS[biome] || biome.toLowerCase().replace(/_/g, ' ');
      }

      const priority = BIOME_PRIORITY[biome] || 10;

      pois.push({
        x,
        y,
        label,
        kind: biome,
        priority,
        distance: dist
      });
    }
  }

  // Sort by priority (descending), then by distance (ascending)
  return pois.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.distance - b.distance;
  });
}

function findNearbyMineralDeposits(
  mapData: MapData,
  playerX: number,
  playerY: number,
  radius: number
): string[] {
  const deposits: Array<{ metal: string; distance: number }> = [];
  const tiles = mapData.tiles;
  const minX = Math.max(0, playerX - radius);
  const maxX = Math.min((tiles[0]?.length || mapData.width) - 1, playerX + radius);
  const minY = Math.max(0, playerY - radius);
  const maxY = Math.min((tiles.length || mapData.height) - 1, playerY + radius);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const tile = tiles[y]?.[x];
      if (!tile?.mineralDeposit) continue;
      const dist = Math.hypot(x - playerX, y - playerY);
      if (dist > radius) continue;
      deposits.push({
        metal: tile.mineralDeposit.metalId,
        distance: dist
      });
    }
  }

  // Dedupe and sort by distance
  const seen = new Set<string>();
  return deposits
    .sort((a, b) => a.distance - b.distance)
    .filter(d => {
      if (seen.has(d.metal)) return false;
      seen.add(d.metal);
      return true;
    })
    .slice(0, 5)
    .map(d => `${d.metal.toLowerCase().replace(/_/g, ' ')} deposit (${Math.round(d.distance)} tiles)`);
}

const extractJson = (raw: string): string => {
  const fenced = raw.match(/```json\n?([\s\S]*?)\n?```/);
  if (fenced?.[1]) return fenced[1].trim();
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch?.[0]) return braceMatch[0].trim();
  return raw.trim();
};

// Biomes where people are expected to be present
const POPULATED_BIOMES: Record<string, string> = {
  'DENSE_CITY': 'crowded (many people expected)',
  'CITY_CENTER': 'crowded (many people expected)',
  'LOW_DENSITY_CITY': 'populated (people expected)',
  'URBAN': 'populated (people expected)',
  'HAMLET': 'small settlement (a few people expected)',
  'MARKETPLACE': 'busy (merchants, shoppers expected)',
  'HARBOR_DISTRICT': 'busy (sailors, workers, merchants expected)',
  'GOVERNMENT_DISTRICT': 'official (guards, clerks, officials expected)',
  'PALACE': 'guarded (servants, guards, nobles expected)',
  'HOLY_SITE': 'sacred (priests, pilgrims expected)',
  'FARMLAND': 'rural (farmers, laborers expected)',
  'PLAZA': 'public space (townspeople expected)',
  'INDUSTRIAL_DISTRICT': 'working area (laborers, craftsmen expected)',
  'ROAD': 'travel route (travelers, merchants possible)',
  'PARK': 'leisure area (visitors possible)'
};

function getExpectedPopulationContext(
  currentTile: Tile | undefined,
  npcs: NpcEntity[],
  playerX: number,
  playerY: number
): string {
  if (!currentTile) return 'unknown terrain';

  const biome = String(currentTile.biome);
  const nearbyCount = npcs.filter(npc =>
    Math.hypot(npc.x - playerX, npc.y - playerY) <= 4
  ).length;

  const expectedDesc = POPULATED_BIOMES[biome];

  if (expectedDesc) {
    if (nearbyCount === 0) {
      return `${expectedDesc} - UNUSUALLY EMPTY, consider using npc_create to add appropriate inhabitants`;
    } else if (nearbyCount < 2 && biome.includes('CITY')) {
      return `${expectedDesc} - fewer people than expected, npc_create could add more`;
    }
    return `${expectedDesc} - ${nearbyCount} people nearby`;
  }

  // Wilderness/remote areas
  if (['FOREST', 'DENSE_FOREST', 'JUNGLE', 'MOUNTAIN', 'HILLS', 'DESERT', 'TUNDRA', 'STEPPE'].includes(biome)) {
    return `remote wilderness - people rare but travelers/hunters possible`;
  }

  if (['DEEP_OCEAN', 'SHALLOW_OCEAN', 'RIVER', 'MAJOR_RIVER'].includes(biome)) {
    return `waterway - sailors/fishermen possible if near shore`;
  }

  return `${biome.toLowerCase().replace(/_/g, ' ')} - ${nearbyCount} people nearby`;
}

export async function generateHistoryLensResponse(
  playerInput: string,
  context: HistoryLensContext,
  history: HistoryLensMessage[],
  options?: { requestType?: 'normal' | 'song' }
): Promise<HistoryLensResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-2.0-flash';

  const recentHistory = history.slice(-12).map((entry) => {
    const label = entry.sender.toUpperCase();
    return `${label}: ${entry.text}`;
  }).join('\n');

  const currentTile = context.mapData.tiles[context.playerY]?.[context.playerX];
  const tileLabel = currentTile ? `${currentTile.biome}` : 'unknown terrain';
  const climateLabel = context.mapData.climate || 'unknown climate';
  const seasonLabel = context.mapData.season || 'unknown season';
  const timeSliceLabel = context.mapData.timeSlice || context.mapData.era || 'unknown era';
  const culturalZoneLabel = context.mapData.culturalZone || 'unknown cultural zone';

  const nearbyNpcs = context.npcs
    .filter(npc => Math.hypot(npc.x - context.playerX, npc.y - context.playerY) <= 3)
    .slice(0, 6)
    .map(npc => {
      const goal = npc.personalGoal?.description ? `Goal: ${npc.personalGoal.description}` : 'Goal: unknown';
      return `${npc.name} (${npc.role}, ${npc.class}, ${npc.activity}). ${goal}`;
    })
    .join('\n');

  const distantNpcs = context.npcs
    .filter(npc => {
      const dist = Math.hypot(npc.x - context.playerX, npc.y - context.playerY);
      return dist > 3 && dist <= 8;
    })
    .slice(0, 6)
    .map(npc => `${npc.name} (${npc.role})`)
    .join(', ');

  const nearbyAnimals = context.animals
    .filter(animal => Math.hypot(animal.x - context.playerX, animal.y - context.playerY) <= 3)
    .slice(0, 6)
    .map(animal => animal.speciesName)
    .join(', ');

  const distantAnimals = context.animals
    .filter(animal => {
      const dist = Math.hypot(animal.x - context.playerX, animal.y - context.playerY);
      return dist > 3 && dist <= 8;
    })
    .slice(0, 6)
    .map(animal => animal.speciesName)
    .join(', ');

  const nearbyStructures = (context.terrainStructures || [])
    .filter(structure => Math.hypot(structure.location[0] - context.playerX, structure.location[1] - context.playerY) <= 3)
    .slice(0, 6)
    .map(structure => structure.name || structure.structureType)
    .join(', ');

  const distantStructures = (context.terrainStructures || [])
    .filter(structure => {
      const dist = Math.hypot(structure.location[0] - context.playerX, structure.location[1] - context.playerY);
      return dist > 3 && dist <= 8;
    })
    .slice(0, 6)
    .map(structure => structure.name || structure.structureType)
    .join(', ');

  // Build adjacent terrain in a fixed compass order for clarity
  const adjacentBiomeMap: Record<string, string> = {};
  const directions = [
    { dx: 0, dy: -1, name: 'North' },
    { dx: 1, dy: -1, name: 'Northeast' },
    { dx: 1, dy: 0, name: 'East' },
    { dx: 1, dy: 1, name: 'Southeast' },
    { dx: 0, dy: 1, name: 'South' },
    { dx: -1, dy: 1, name: 'Southwest' },
    { dx: -1, dy: 0, name: 'West' },
    { dx: -1, dy: -1, name: 'Northwest' }
  ];
  for (const dir of directions) {
    const x = context.playerX + dir.dx;
    const y = context.playerY + dir.dy;
    const tile = context.mapData.tiles[y]?.[x];
    if (tile) {
      adjacentBiomeMap[dir.name] = String(tile.biome);
    }
  }
  // Format as separate lines for clarity
  const adjacentBiomesFormatted = directions
    .filter(d => adjacentBiomeMap[d.name])
    .map(d => `  - ${d.name}: ${adjacentBiomeMap[d.name]}`)
    .join('\n');

  const nearbyFeatures = (context.terrainStructures || [])
    .filter(structure => Math.hypot(structure.location[0] - context.playerX, structure.location[1] - context.playerY) <= 4)
    .slice(0, 10)
    .map(structure => `${structure.name || structure.structureType} (${structure.structureType})`);

  const nearbyAnimalsClose = context.animals
    .filter(animal => Math.hypot(animal.x - context.playerX, animal.y - context.playerY) <= 4)
    .slice(0, 10)
    .map(animal => animal.speciesName);

  const nearbyNpcsClose = context.npcs
    .filter(npc => Math.hypot(npc.x - context.playerX, npc.y - context.playerY) <= 4)
    .slice(0, 10)
    .map(npc => `${npc.name} (${npc.role})`);

  // Get prioritized points of interest from tile biomes (cities, markets, farms, etc.)
  // Pass terrainStructures and marketplaces to get proper names for government districts, marketplaces, etc.
  const nearbyPOIs = findNearbyPointsOfInterest(
    context.mapData,
    context.playerX,
    context.playerY,
    8,
    context.terrainStructures,
    context.marketplaces || context.mapData.marketplaces
  );
  const poiContext = nearbyPOIs.slice(0, 8).map(poi => {
    const dirX = poi.x - context.playerX;
    const dirY = poi.y - context.playerY;
    const dir = dirY < 0 ? (dirX < 0 ? 'northwest' : dirX > 0 ? 'northeast' : 'north') :
                dirY > 0 ? (dirX < 0 ? 'southwest' : dirX > 0 ? 'southeast' : 'south') :
                dirX < 0 ? 'west' : 'east';
    return `${poi.label} (${Math.round(poi.distance)} tiles ${dir})`;
  }).join(', ');

  // Get mineral deposits nearby
  const mineralContext = findNearbyMineralDeposits(context.mapData, context.playerX, context.playerY, 10);

  const isEmbarked = context.playerMode === 'ship';
  const homeAnchor = context.homeAnchor;
  const homeLabel = homeAnchor?.label || 'unknown';
  const homeOnThisMap = Boolean(homeAnchor && homeAnchor.mapSeed === context.mapData.seed);
  const homeDx = homeAnchor ? homeAnchor.x - context.playerX : 0;
  const homeDy = homeAnchor ? homeAnchor.y - context.playerY : 0;
  const homeDistance = homeAnchor ? Math.round(Math.hypot(homeDx, homeDy)) : null;
  const homeDirection = (() => {
    if (!homeAnchor) return 'unknown';
    if (homeDx === 0 && homeDy === 0) return 'here';
    const horiz = homeDx === 0 ? '' : homeDx > 0 ? 'east' : 'west';
    const vert = homeDy === 0 ? '' : homeDy > 0 ? 'south' : 'north';
    return [vert, horiz].filter(Boolean).join('');
  })();
  const homeLine = homeAnchor
    ? homeOnThisMap
      ? homeDirection === 'here'
        ? `Home: ${homeLabel} (${homeAnchor.kind}), at your current position.`
        : `Home: ${homeLabel} (${homeAnchor.kind}), about ${homeDistance} tiles ${homeDirection || 'away'} from current position.`
      : `Home: ${homeLabel} (${homeAnchor.kind}) in ${homeAnchor.mapAreaName}, ${homeAnchor.region}, ${homeAnchor.zone}. It is not on this map.`
    : 'Home: unknown.';
  const requestFlavor = options?.requestType || 'normal';
  const songDirective = requestFlavor === 'song'
    ? `
- When asked for a song, treat it as an authentic verse from someone in the scene; never refuse that request, even if a character voice is referenced.
- Keep the lyric short (3-5 sentences), reference the climate/season/landmarks, and use simple line breaks so it reads like a sung stanza.
- Keep the tone grounded in the era, matching the player's mood, and avoid calling attention to the prompt or your own constraints.`
    : '';
  const systemPrompt = `
You are the Game Master for HistoryLens, a university-grade historical simulation designed by a history professor.
This is not fantasy. Your mission is realism, historical verisimilitude, and pedagogical integrity while remaining immersive.

Core identity:
- You are a historically informed narrator who respects the constraints of time, place, and material reality.
- You present human hardship and challenge as grounded facts of the past (scarcity, disease, distance, social hierarchy, climate, war, labor, belief).
- You do not invent anachronistic places, objects, or customs.

Narrative goals:
- Each response advances the situation: present a new obstacle, offer, or consequential choice.
- NPCs have goals and agency. They are often skeptical, demanding, or constrained by real social structures.
- NPC dialogue must be concise and purposeful. They ask questions, press for decisions, and avoid monologues.
- Keep narration short and vivid: 2-5 sentences. Vary tone and cadence across turns.
- Be dynamically inventive within constraints: you may invent plausible details that are consistent with the era, class, and immediate setting.

Simulation constraints:
- Canonical truth is the provided state (time, place, inventory, NPCs, terrain). Do not override it.
- If the player requests something implausible for the era/place, refuse politely and explain in a grounded way.
- Time may advance only in small, realistic increments (minutes to hours). Never jump more than 8 hours in one turn.
- Movement must respect geography (water, mountains, barriers) and realistic travel constraints.
- Do not spawn crowds. If new people enter, introduce 1-2 at most with plausible roles.
- If the player asks about their past, obligations, or identity, provide a plausible, specific explanation consistent with the era, class, and location. Avoid meta refusals. Do not contradict provided state.
- If the player asks about home, village, or where they live, use the Home line below and describe it in period-appropriate terms. Do not invent a different home.

Output format:
You MUST respond with valid JSON only. No markdown. No extra text.

Schema:
{
  "narration": "string",
  "actions": [
    { "type": "move|navigate_nearest|navigate_edge|navigate_animal|seek_npc|advance_time|inventory_add|inventory_remove|player_damage|game_over|npc_create|propose_enter", "params": { ... } }
  ],
  "suggestedActions": ["string", "string", "string"]
}

SuggestedActions guidelines (CRITICAL - follow these closely):
- Each action must be SPECIFIC and NARRATIVELY INTERESTING - never generic
- Use vivid, active verbs that paint a scene: "Approach the weathered fisherman mending nets" not "Talk to fisherman"
- Actions should reflect the immediate situation: visible NPCs, ongoing activities, time of day, weather
- Include the player's profession and social position - a shepherd approaches situations differently than a merchant
- If NPCs are nearby, at least one action should involve meaningful interaction with a specific person
- At least one action should create potential for story advancement, conflict, or discovery
- Actions should feel like real choices with uncertain outcomes
- FORBIDDEN: "Continue walking", "Look around", "Go home", "Rest", "Wait" - these are too passive
- REQUIRED STYLE: "Inquire at the tea house about rumors from the capital", "Offer your services to the harried-looking merchant unloading goods", "Slip into the crowd near the well to overhear the animated conversation"
- Make the player feel like an active participant in a living world, not a passive observer

Actions:
- move: { "direction": "north|south|east|west|northeast|northwest|southeast|southwest", "steps": 1-5 } - ONLY use for simple directional movement like "go north" or "walk east"
- navigate_nearest: { "kind": "city|settlement|town|farm|market|ruin|fortress|holy_site|palace|government|fishing|mine|harbor|hamlet|plaza|structure" } - PREFER this for destination-based movement. Use when player says "go to the fortress", "travel to the city", "head for the farm", etc. The simulation will find and pathfind to the nearest matching location.
- navigate_edge: { "direction": "north|south|east|west" } - Use when the player wants to leave the current map area entirely and travel to a new region. Use for phrases like "sail to a new area", "travel west until I find land", "leave this region", "go somewhere new", "continue sailing west". This will navigate to the edge of the current map and trigger a transition to the neighboring area.
- navigate_home: {} - Use when the player wants to return home. Takes no parameters. Only use when the Home line shows a location on this map. If Home is on a different map, tell the player they need to travel there first.
- navigate_animal: { "species": "optional species name", "hunt": true|false } - Use when the player wants to approach or hunt a visible animal. The species can be a specific animal ("deer", "wolf", "cow") or a general type ("prey", "predator", "game"). Set hunt=true when player intends to attack/hunt the animal (opens combat immediately). Set hunt=false (or omit) when player wants to approach peacefully (for taming, observing, or leading their own animal). Examples: "hunt the deer" → species:"deer", hunt:true. "Find my cow" → species:"cow", hunt:false. "Track the wolf pack" → species:"wolf", hunt:false.
- seek_npc: { "role": "optional role" } - Use when player wants to find someone to talk to
- advance_time: { "hours": 1-8, "activity": "traveling|resting|working|waiting" }
- inventory_add: { "baseId": "ITEM_ID", "quantity": 1-3 } (only if clearly plausible in era/place)
- inventory_remove: { "name": "Item Name", "quantity": 1-3 } (only if the player had it)
- player_damage: { "amount": 1-50, "cause": "short reason" }
- game_over: { "cause": "short reason" } (only when death is unavoidable)
- npc_create: { "count": 1-3, "role": "optional role", "name": "optional name" } - Creates NPCs who appear in the game world and can be interacted with. Use PROACTIVELY when the scene calls for people: arriving at a settlement, marketplace, farm, harbor, or any populated area. If the player is in or approaching urban/settlement terrain and there are few or no nearby NPCs, consider adding 1-2 appropriate inhabitants (farmer, merchant, guard, worker, traveler, etc.). Keep spawns within 2-3 tiles of the player.
- propose_enter: { "kind": "city|fortress|mine|quarry|fishing_hut|palace|holy_site|ruins|government|farm|market|harbor|woodcutter" } - Use when narrating that the player approaches a significant location and might want to enter it. This creates an interactive prompt for the player to confirm entry. Use sparingly: only when the player is actively approaching or arriving at a notable structure.

Important:
- ALWAYS prefer navigate_nearest over move when the player wants to reach a destination (fortress, city, farm, market, etc.). The simulation handles pathfinding automatically.
- Never invent map destinations. Use navigate_nearest and let the simulation resolve targets.
- If the player asks to reach a specific named place that is not in context, refuse in-world and suggest nearby options from the Points of Interest list.
- Movement narration should describe the action without asking for confirmation if a move action is executed.
- When referencing nearby features or structures, treat their labels as prompts and describe them in historically plausible terms (e.g., turn "Noble Residence" into a period-appropriate manor). Do not repeat the raw label unless it is a proper name.
- If the player asks to reach a "settlement" or "town", use navigate_nearest with kind "city".
- Only include movement actions (move/navigate_nearest/seek_npc) when the player explicitly commands movement or seeking someone.
- When describing "home", treat its label as a prompt and render it in historically plausible terms rather than repeating a raw UI label, unless it is a proper name.
- HOME AWARENESS: When player asks to "go home", "return home", "head home", or similar:
  * If Home says "at your current position" → Player IS home. Say so clearly, do NOT navigate.
  * If Home says "about X tiles [direction]" → Player is NOT home yet. Use the navigate_home action (NOT navigate_nearest). This ensures they go to their actual home, not just the nearest similar structure.
  * If Home says "not on this map" → Tell the player they need to travel to that region first. Do NOT use navigate_home.
- CRITICAL: When describing directions (north, south, east, west, etc.), use ONLY the exact directions from the "Adjacent terrain" list below. Do NOT swap, guess, or infer directions. If farmland is listed as Southwest, say southwest - never say southeast or any other direction.
- CRITICAL LOCATION AWARENESS: The "Current state" section below is GROUND TRUTH for the player's location. If the player has moved since earlier conversation turns, DO NOT continue scenes or interactions from those previous locations. If the conversation history mentions a fishing hut but Current state shows the player is now on grassland 10 tiles away, the fishing hut scene is OVER - describe what the player sees at their CURRENT location. Movement invalidates earlier location-specific context. Check for "[You have moved to a new location...]" system messages which explicitly signal location changes.

ARRIVAL SCENES (when player input starts with "[ARRIVAL"):
- The player has just completed a journey to a destination. This is a SPECIAL MOMENT requiring a RICH, IMMERSIVE description.
- Write a FULL PARAGRAPH (4-7 sentences) describing the arrival: what they see, hear, smell; who notices them; what activity is underway; what stands out.
- Use sensory details: the crunch of gravel underfoot, the smell of woodsmoke, the murmur of voices, the play of light.
- Consider time of day: morning markets bustle, midday heat slows activity, evening brings different characters.
- If NPCs are nearby, describe at least one of them doing something specific - not just "standing there" but actively engaged.
- If the location is empty of NPCs but should have people (settlement, market, etc.), use npc_create to add 1-2 appropriate inhabitants.
- End with something that invites action: a person making eye contact, an intriguing sound, an opportunity presenting itself.
- The suggestedActions for arrivals should be especially vivid and specific to what was just described.

Guidance for historical fidelity:
- Use concrete details consistent with the location’s climate, season, and material culture.
- Social hierarchy, law, religion, gender roles, and labor expectations should shape NPC behavior.
- If the player attempts to bypass hardship (instant travel, modern knowledge, wealth), resist with grounded constraints.

Current state:
- Identity: ${context.playerCharacter.name}, ${context.playerCharacter.age}-year-old ${context.playerCharacter.profession}
- Embarked: ${isEmbarked ? 'Yes, aboard a vessel' : 'No, on foot/land'}
- Date: ${context.gameDate.year}-${context.gameDate.month}-${context.gameDate.day}
- Time: ${context.gameTimeHours}:00
- Era/Setting: ${timeSliceLabel}
- Location: ${context.mapData.localArea || 'Unknown area'} (${culturalZoneLabel})
- Climate/Season: ${climateLabel}, ${seasonLabel}
- Terrain: ${tileLabel}
- Adjacent terrain (1 tile away, use these directions EXACTLY):
${adjacentBiomesFormatted || '  - none'}
- Points of interest (priority-ordered, within 8 tiles): ${poiContext || 'none'}
- Nearby named structures (within 4 tiles): ${nearbyFeatures.join(', ') || 'none'}
- Mineral deposits nearby: ${mineralContext.length > 0 ? mineralContext.join(', ') : 'none visible'}
- Nearby NPCs (within 4 tiles): ${nearbyNpcsClose.join(', ') || 'none'}
- Nearby animals (within 4 tiles): ${nearbyAnimalsClose.join(', ') || 'none'}
- Nearby NPCs (within 3 tiles, detailed):
${nearbyNpcs || 'None'}
- Distant NPCs (4-8 tiles): ${distantNpcs || 'none'}
- Nearby animals (within 3 tiles): ${nearbyAnimals || 'none'}
- Distant animals (4-8 tiles): ${distantAnimals || 'none'}
- Nearby structures (within 3 tiles): ${nearbyStructures || 'none'}
- Distant structures (4-8 tiles): ${distantStructures || 'none'}
- Inventory: ${context.playerCharacter.inventory.slice(0, 10).map(item => item.name).join(', ') || 'empty'}
- ${homeLine}
- Expected population: ${getExpectedPopulationContext(currentTile, context.npcs, context.playerX, context.playerY)}
${songDirective}

Recent history:
${recentHistory || 'None'}
  `.trim();

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [{ role: 'user', parts: [{ text: systemPrompt }, { text: `PLAYER: ${playerInput}` }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7
    }
  });

  try {
    const jsonText = extractJson(response.text || '');
    const parsed = JSON.parse(jsonText);
    return {
      narration: parsed.narration || 'The moment passes without incident.',
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : [],
      debugPrompt: `${systemPrompt}\n\nPLAYER: ${playerInput}`,
      rawResponse: response.text || '',
      model: modelName
    };
  } catch (error) {
    console.warn('[HistoryLens] Failed to parse response JSON:', error);
    return {
      narration: response.text || 'The moment passes without incident.',
      actions: [],
      debugPrompt: `${systemPrompt}\n\nPLAYER: ${playerInput}`,
      rawResponse: response.text || '',
      model: modelName
    };
  }
}
