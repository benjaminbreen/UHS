import type { GameDate, MapData, NpcEntity, PlayerCharacter } from '../types';
import type { HistoryLensAction } from '../types/historyLens';
import { createItemInstance, addItemToInventory, removeItemFromInventory } from '../utils/inventoryUtils';
import { timeAdvancementService } from './timeAdvancementService';
import { getDaysInMonth } from '../utils/dateUtils';
import { createHistoryLensNpcs } from './historyLensNpcFactory';

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
};

export type HistoryLensActionResult = {
  nextPosition?: { x: number; y: number };
  nextTime?: { hours: number; date: GameDate };
  nextInventory?: PlayerCharacter['inventory'];
  playerUpdates?: Partial<PlayerCharacter>;
  triggerGameOver?: boolean;
  npcAdditions?: NpcEntity[];
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

const resolveMove = (
  action: HistoryLensAction,
  state: ActionRouterState
): { x: number; y: number } | null => {
  const params = action.params || {};
  const dx = Number(params.dx);
  const dy = Number(params.dy);
  const direction = typeof params.direction === 'string' ? params.direction : null;
  const steps = clamp(Number(params.steps || 1), 1, 5);

  let targetX = state.playerX;
  let targetY = state.playerY;

  if (!Number.isNaN(dx) && !Number.isNaN(dy)) {
    targetX += clamp(dx, -5, 5);
    targetY += clamp(dy, -5, 5);
  } else if (direction) {
    switch (direction) {
      case 'north':
        targetY -= steps;
        break;
      case 'south':
        targetY += steps;
        break;
      case 'east':
        targetX += steps;
        break;
      case 'west':
        targetX -= steps;
        break;
      default:
        return null;
    }
  } else {
    return null;
  }

  const maxX = state.mapData.tiles[0]?.length ? state.mapData.tiles[0].length - 1 : state.playerX;
  const maxY = state.mapData.tiles.length ? state.mapData.tiles.length - 1 : state.playerY;
  targetX = clamp(targetX, 0, maxX);
  targetY = clamp(targetY, 0, maxY);

  if (!isTilePassable(state.mapData, targetX, targetY, state.hasVessel)) {
    return null;
  }

  return { x: targetX, y: targetY };
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
  let nextPosition: { x: number; y: number } | undefined;
  let nextTime: { hours: number; date: GameDate } | undefined;
  let workingInventory = state.playerCharacter.inventory;
  let nextInventory: PlayerCharacter['inventory'] | undefined;
  let playerUpdates: Partial<PlayerCharacter> | undefined;
  let triggerGameOver = false;
  let npcAdditions: NpcEntity[] | undefined;
  const rejections: string[] = [];

  for (const action of actions) {
    switch (action.type) {
      case 'move': {
        const position = resolveMove(action, { ...state, playerX: nextPosition?.x ?? state.playerX, playerY: nextPosition?.y ?? state.playerY });
        if (!position) {
          rejections.push('Movement not possible from this location.');
          break;
        }
        nextPosition = position;
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
        const created = createHistoryLensNpcs({
          mapData: state.mapData,
          gameDate: state.gameDate,
          playerX: nextPosition?.x ?? state.playerX,
          playerY: nextPosition?.y ?? state.playerY,
          playerMode: state.playerMode,
          existingNpcs: state.npcs,
          preferredRole,
          preferredName,
          count
        });
        if (!created.length) {
          rejections.push('No one appears nearby.');
          break;
        }
        npcAdditions = [...(npcAdditions || []), ...created];
        break;
      }
      default:
        break;
    }
  }

  return {
    nextPosition,
    nextTime,
    nextInventory,
    playerUpdates,
    triggerGameOver,
    npcAdditions,
    rejections
  };
}
