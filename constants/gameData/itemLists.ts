
/**
 * constants/gameData/itemLists.ts - Data for procedural item generation in containers.
 */

import { HistoricalEra } from '../../types';

export type LocationKey = 'EUROPE' | 'ASIA' | 'AMERICAS' | 'AFRICA' | 'MIDDLE_EAST';
export type BuildingKey = 'HOUSE' | 'TAVERN' | 'PALACE' | 'SHOP' | 'MANOR' | 'GUARD_ROOM' | 'THRONE_ROOM' | 'GREAT_HALL' | 'KITCHEN';
export type ContainerKey = 'BOOKSHELF' | 'BARREL' | 'CHEST' | 'CABINET' | 'ARMOR_STAND';

type ItemBaseId = string;

export const CONTAINER_LOOT_TABLES: Partial<Record<HistoricalEra, Partial<Record<LocationKey, Partial<Record<BuildingKey, Partial<Record<ContainerKey, ItemBaseId[]>>>>>>> = {
  [HistoricalEra.MEDIEVAL]: {
      EUROPE: {
          HOUSE: {
              CHEST: ['WOOL_TUNIC', 'WOODEN_BOWL', 'COPPER_COINS', 'CLAY_LAMP'],
              BARREL: ['SMOOTH_STONE', 'DRY_LEAVES'],
          },
          PALACE: {
              CHEST: ['WOOL_TUNIC'], // Placeholder for now
          },
      }
  },
  [HistoricalEra.INDUSTRIAL_ERA]: {
    EUROPE: {
      HOUSE: {
        BOOKSHELF: ['SMOOTH_STONE'],
        BARREL: ['STICK'],
        CHEST: ['WOOL_TUNIC'],
        CABINET: ['WOODEN_BOWL', 'COPPER_COINS'],
      },
      TAVERN: {
        BARREL: ['STICK', 'SMOOTH_STONE'],
        CABINET: ['COPPER_COINS', 'WOODEN_BOWL'],
      },
       PALACE: {
            BOOKSHELF: ['SMOOTH_STONE'],
            BARREL: [],
            CHEST: ['WOOL_TUNIC'],
            CABINET: ['WOODEN_BOWL'],
        }
    }
  },
  [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
    EUROPE: {
      HOUSE: {
          CHEST: ['WOOL_TUNIC', 'WOODEN_BOWL', 'COPPER_COINS'],
      }
    }
  },
};
