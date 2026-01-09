import type { MapData, PlayerCharacter, Tile } from '../types';
import type { PlayerContext } from '../types/skillTypes';
import type { TerrainStructure } from '../types';
import { generateDmResponse } from './llmService';
import { isStandardTile } from '../types';

export type EntryKind = 'start' | 'map' | 'city' | 'structure' | 'poi' | 'ruin' | 'market' | 'government' | 'fishing' | 'mine' | 'palace' | 'holy_site' | 'fortress';

type EntryContext = {
  kind: EntryKind;
  label: string;
  playerCharacter: PlayerCharacter;
  mapData: MapData;
  playerX: number;
  playerY: number;
  playerMode?: 'ship' | 'onFoot' | string;
  currentZone?: string | null;
  currentRegion?: string | null;
  timeOfDay?: string | null;
  structure?: TerrainStructure | null;
  tile?: Tile | null;
};

const buildPlayerContext = (context: EntryContext): PlayerContext => {
  const tile = context.tile || context.mapData.tiles?.[context.playerY]?.[context.playerX];
  const currentTile = (tile && isStandardTile(tile)) ? tile : (context.mapData.tiles?.[context.playerY]?.[context.playerX] as any);

  return {
    viewMode: 'standard',
    currentTile,
    playerCharacter: context.playerCharacter,
    mapData: context.mapData,
    terrainStructures: context.mapData.terrainStructures || [],
    playerX: context.playerX,
    playerY: context.playerY,
    npcs: [],
    animals: [],
    ambianceContext: {
      timeOfDay: context.timeOfDay || 'morning',
      climate: context.mapData.climate || 'TEMPERATE',
      historicalEra: context.mapData.era || 'MEDIEVAL',
      season: context.mapData.season || 'SPRING',
      culturalZone: context.currentZone || context.mapData.culturalZone || 'EUROPEAN'
    }
  };
};

export const generateEntryNarration = async (context: EntryContext): Promise<string> => {
  const currentTile = context.tile || context.mapData.tiles?.[context.playerY]?.[context.playerX];
  const isOnLand = Boolean(currentTile && (currentTile as any).isLand);
  const isEmbarked = context.playerMode === 'ship';
  const modeLine = isEmbarked && !isOnLand
    ? 'Player is embarked on water; describe the vessel only if on open water.'
    : 'Player is on land; do not place them on a vessel even if water is nearby.';

  const prompt = [
    `Write 2–4 sentences in second-person present, historically grounded and vivid.`,
    `Keep it concise, literary, and specific to the setting.`,
    `Do not ask a question. Avoid modern terms.`,
    `Focus on sensory detail, social atmosphere, and immediate stakes.`,
    `Include 1–2 sentences that plausibly explain why the character is here right now (duty, exile, trade, seasonal labor, kinship obligation, conflict), grounded in era and class.`,
    `Do not invent a new profession; use the provided one.`,
    modeLine,
    `Place: ${context.label}.`,
    context.structure ? `Structure: ${context.structure.name || context.structure.structureType}.` : '',
    context.kind === 'start' ? 'This is the opening scene.' : `This is an arrival scene (${context.kind}).`
  ].filter(Boolean).join(' ');

  try {
    const response = await generateDmResponse(prompt, buildPlayerContext(context));
    return response.trim();
  } catch (error) {
    console.warn('[HistoryLensEntry] Failed to generate entry narration:', error);
    return `You arrive at ${context.label}.`;
  }
};

export const buildEntryMeta = (
  kind: EntryKind,
  mapData: MapData,
  structure?: TerrainStructure | null,
  currentZone?: string | null,
  currentRegion?: string | null
): string => {
  const area = mapData.localArea || currentRegion || currentZone || 'the region';

  switch (kind) {
    case 'start':
      return `Beginning in ${area}`;
    case 'map':
      return `Entered ${area}`;
    case 'city':
      return `Entered outskirts of ${structure?.name || mapData.majorCity?.name || area}`;
    case 'market':
      return `Approached marketplace of ${structure?.name || area}`;
    case 'government':
      return `Entered civic quarter of ${structure?.name || area}`;
    case 'ruin':
      return `Approached ruins of ${structure?.name || area}`;
    case 'mine':
      return `Approached mining site of ${structure?.name || area}`;
    case 'palace':
      return `Approached palace of ${structure?.name || area}`;
    case 'holy_site':
      return `Approached holy site of ${structure?.name || area}`;
    case 'fortress':
      return `Approached fortress of ${structure?.name || area}`;
    case 'fishing':
      return `Approached fishing hut of ${structure?.name || area}`;
    case 'structure':
    case 'poi':
    default:
      return `Approached ${structure?.name || area}`;
  }
};
