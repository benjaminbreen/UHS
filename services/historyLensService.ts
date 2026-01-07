import { GoogleGenAI } from '@google/genai';
import type { AnimalEntity, GameDate, MapData, NpcEntity, PlayerCharacter, TerrainStructure } from '../types';
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
};

const extractJson = (raw: string): string => {
  const fenced = raw.match(/```json\n?([\s\S]*?)\n?```/);
  if (fenced?.[1]) return fenced[1].trim();
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch?.[0]) return braceMatch[0].trim();
  return raw.trim();
};

export async function generateHistoryLensResponse(
  playerInput: string,
  context: HistoryLensContext,
  history: HistoryLensMessage[]
): Promise<HistoryLensResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

Simulation constraints:
- Canonical truth is the provided state (time, place, inventory, NPCs, terrain). Do not override it.
- If the player requests something implausible for the era/place, refuse politely and explain in a grounded way.
- Time may advance only in small, realistic increments (minutes to hours). Never jump more than 8 hours in one turn.
- Movement must respect geography (water, mountains, barriers) and realistic travel constraints.
- Do not spawn crowds. If new people enter, introduce 1-2 at most with plausible roles.

Output format:
You MUST respond with valid JSON only. No markdown. No extra text.

Schema:
{
  "narration": "string",
  "actions": [
    { "type": "move|advance_time|inventory_add|inventory_remove|player_damage|game_over|npc_create", "params": { ... } }
  ],
  "suggestedActions": ["string", "string", "string"]
}

Actions:
- move: { "direction": "north|south|east|west", "steps": 1-5 } OR { "dx": -5..5, "dy": -5..5 }
- advance_time: { "hours": 1-8, "activity": "traveling|resting|working|waiting" }
- inventory_add: { "baseId": "ITEM_ID", "quantity": 1-3 } (only if clearly plausible in era/place)
- inventory_remove: { "name": "Item Name", "quantity": 1-3 } (only if the player had it)
- player_damage: { "amount": 1-50, "cause": "short reason" }
- game_over: { "cause": "short reason" } (only when death is unavoidable)
- npc_create: { "count": 1-3, "role": "optional role", "name": "optional name" } (only when new people plausibly enter the immediate scene; keep them within 2-3 tiles)

Guidance for historical fidelity:
- Use concrete details consistent with the location’s climate, season, and material culture.
- Social hierarchy, law, religion, gender roles, and labor expectations should shape NPC behavior.
- If the player attempts to bypass hardship (instant travel, modern knowledge, wealth), resist with grounded constraints.

Current state:
- Player: ${context.playerCharacter.name}, ${context.playerCharacter.age}-year-old ${context.playerCharacter.profession}
- Date: ${context.gameDate.year}-${context.gameDate.month}-${context.gameDate.day}
- Time: ${context.gameTimeHours}:00
- Era/Setting: ${timeSliceLabel}
- Location: ${context.mapData.localArea || 'Unknown area'} (${culturalZoneLabel})
- Climate/Season: ${climateLabel}, ${seasonLabel}
- Terrain: ${tileLabel}
- Nearby NPCs (within 3 tiles):
${nearbyNpcs || 'None'}
- Distant NPCs (4-8 tiles): ${distantNpcs || 'none'}
- Nearby animals (within 3 tiles): ${nearbyAnimals || 'none'}
- Distant animals (4-8 tiles): ${distantAnimals || 'none'}
- Nearby structures (within 3 tiles): ${nearbyStructures || 'none'}
- Distant structures (4-8 tiles): ${distantStructures || 'none'}
- Inventory: ${context.playerCharacter.inventory.slice(0, 10).map(item => item.name).join(', ') || 'empty'}

Recent history:
${recentHistory || 'None'}
  `.trim();

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
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
      suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : []
    };
  } catch (error) {
    console.warn('[HistoryLens] Failed to parse response JSON:', error);
    return {
      narration: response.text || 'The moment passes without incident.',
      actions: []
    };
  }
}
