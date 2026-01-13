import type { GameDate, MapData, NpcEntity } from '../types';
import { HistoricalEra } from '../types';
import type { CulturalZone } from '../types';
import { ValueNoise } from '../utils/noise';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { generateBaseProfile, determineSocialRole, generateNpcName } from '../generation/common/npcUtils';
import { generateNpcDescriptions } from './npcDescriptionService';
import { generateNpcFamilyAndLifeEvents } from './socialService';
import { worldEntityRegistry } from './worldEntityRegistry';

type SpawnContext = {
  mapData: MapData;
  gameDate: GameDate;
  playerX: number;
  playerY: number;
  playerMode: 'onFoot' | 'ship' | string;
  existingNpcs: NpcEntity[];
  preferredRole?: string;
  preferredName?: string;
  count?: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const isTileSpawnable = (mapData: MapData, x: number, y: number, allowWater: boolean) => {
  const tile = mapData.tiles[y]?.[x];
  if (!tile || tile.isBlocking) return false;
  if (tile.isLand || tile.hasBridge) return true;
  return allowWater;
};

const getSpawnOffsets = (): Array<{ dx: number; dy: number; dist: number }> => {
  const offsets: Array<{ dx: number; dy: number; dist: number }> = [];
  for (let dy = -3; dy <= 3; dy += 1) {
    for (let dx = -3; dx <= 3; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const dist = Math.hypot(dx, dy);
      if (dist <= 3) {
        offsets.push({ dx, dy, dist });
      }
    }
  }
  return offsets;
};

const pickSpawnLocation = (
  mapData: MapData,
  playerX: number,
  playerY: number,
  occupied: Set<string>,
  allowWater: boolean,
  noise: ValueNoise
): { x: number; y: number } | null => {
  const offsets = getSpawnOffsets();
  const preferred = offsets.filter(offset => offset.dist >= 1.5).sort(() => noise.random() - 0.5);
  const fallback = offsets.filter(offset => offset.dist < 1.5).sort(() => noise.random() - 0.5);
  const candidates = [...preferred, ...fallback];

  for (const { dx, dy } of candidates) {
    const x = playerX + dx;
    const y = playerY + dy;
    if (x < 0 || y < 0 || y >= mapData.tiles.length || x >= mapData.tiles[0]?.length) continue;
    if (occupied.has(`${x},${y}`)) continue;
    if (!isTileSpawnable(mapData, x, y, allowWater)) continue;
    return { x, y };
  }
  return null;
};

export function createHistoryLensNpcs(context: SpawnContext): NpcEntity[] {
  const count = clamp(Number(context.count || 1), 1, 3);
  const seed = context.mapData.seed + Math.floor(Math.random() * 100000);
  const noise = new ValueNoise(seed);

  console.log(`[HistoryLens NPC] Creating ${count} NPC(s) near player at (${context.playerX}, ${context.playerY})`, {
    preferredRole: context.preferredRole,
    preferredName: context.preferredName,
    playerMode: context.playerMode
  });

  const locationLabel =
    context.mapData.localArea ||
    context.mapData.region ||
    context.mapData.mapAreaName ||
    context.mapData.continent ||
    'Unknown';

  const dateInfo = parseDateString(context.mapData.timeSlice || `${context.gameDate.year}`) || {
    era: HistoricalEra.MEDIEVAL,
    year: context.gameDate.year
  };

  const culturalZone = (context.mapData.culturalZone ||
    mapLocationToCulture(locationLabel, dateInfo.year) ||
    'EUROPEAN') as CulturalZone;
  const region = context.mapData.region || context.mapData.localArea || 'Unknown region';
  const era = (dateInfo.era || (context.mapData.era as HistoricalEra) || HistoricalEra.MEDIEVAL) as HistoricalEra;

  const occupied = new Set(context.existingNpcs.map(npc => `${npc.x},${npc.y}`));
  const allowWater = context.playerMode === 'ship';
  const npcs: NpcEntity[] = [];

  for (let i = 0; i < count; i += 1) {
    const spawn = pickSpawnLocation(
      context.mapData,
      context.playerX,
      context.playerY,
      occupied,
      allowWater,
      noise
    );
    if (!spawn) break;

    const id = `npc-hl-${Date.now()}-${Math.floor(noise.random() * 100000)}`;
    const baseProfile = generateBaseProfile(noise, { era, culturalZone, region });
    const { socialClass, role, emoji, nameKey } = determineSocialRole(
      baseProfile,
      { era, culturalZone, region },
      context.preferredRole
    );

    const name = context.preferredName && i === 0
      ? context.preferredName
      : generateNpcName(baseProfile.gender, culturalZone, region, dateInfo.year, noise, nameKey);

    const npc: NpcEntity = {
      ...baseProfile,
      id,
      name,
      class: socialClass || 'COMMONER',
      role: role || 'Wanderer',
      emoji: emoji || '🧑',
      x: spawn.x,
      y: spawn.y,
      targetX: spawn.x,
      targetY: spawn.y,
      movement: { type: 'stationary' },
      activity: 'idle',
      descriptions: { short: '', long: '' }
    };

    const descriptions = generateNpcDescriptions(npc);
    npc.descriptions = descriptions;

    const socialData = generateNpcFamilyAndLifeEvents(npc, context.existingNpcs, context.mapData, noise);
    npc.family = socialData.family;
    npc.lifeEvents = socialData.lifeEvents;

    worldEntityRegistry.registerNpc(npc);
    occupied.add(`${spawn.x},${spawn.y}`);
    npcs.push(npc);
  }

  return npcs;
}
