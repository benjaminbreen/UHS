/**
 * constants/gameData/containerLootTables.ts - Data for procedural item generation in containers.
 */

import { HistoricalEra } from '../../types';

export type LocationKey = 'EUROPE' | 'ASIA' | 'AMERICAS' | 'AFRICA' | 'MIDDLE_EAST';
export type BuildingKey = 'HOUSE' | 'TAVERN' | 'PALACE' | 'SHOP' | 'MANOR' | 'GUARD_ROOM' | 'THRONE_ROOM' | 'GREAT_HALL' | 'KITCHEN';
export type ContainerKey = 'BOOKSHELF' | 'BARREL' | 'CHEST' | 'CABINET' | 'ARMOR_STAND';

type ItemBaseId = string;

export const CONTAINER_LOOT_TABLES: Partial<
  Record<
    HistoricalEra,
    Partial<
      Record<
        LocationKey,
        Partial<
          Record<
            BuildingKey,
            Partial<
              Record<ContainerKey, ItemBaseId[]>
            >
          >
        >
      >
    >
  >
> = {
  [HistoricalEra.MEDIEVAL]: {
    EUROPE: {
      HOUSE: {
        CHEST: ['WOOL_TUNIC', 'WOODEN_BOWL', 'CLAY_LAMP', 'LETTER'],
        BARREL: ['SMOOTH_STONE', 'DRY_LEAVES'],
        BOOKSHELF: ['BOOK', 'SCROLL'],
      },
      PALACE: {
        CHEST: ['WOOL_TUNIC', 'SCROLL'],
        BOOKSHELF: ['BOOK', 'LETTER'],
      },
    }
  },
  [HistoricalEra.INDUSTRIAL_ERA]: {
    EUROPE: {
      HOUSE: {
        BOOKSHELF: ['BOOK', 'LETTER'],
        BARREL: ['STICK'],
        CHEST: ['WOOL_TUNIC', 'SCROLL'],
        CABINET: ['WOODEN_BOWL'],
      },
      TAVERN: {
        BARREL: ['STICK', 'SMOOTH_STONE'],
        CABINET: ['WOODEN_BOWL'],
      },
      PALACE: {
        CHEST: ['WOOL_TUNIC'],
        CABINET: ['WOODEN_BOWL'],
        BOOKSHELF: ['BOOK', 'SCROLL', 'LETTER'],
      }
    }
  },
  [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
    EUROPE: {
      HOUSE: {
          CHEST: ['WOOL_TUNIC', 'WOODEN_BOWL', 'LETTER'],
          BOOKSHELF: ['BOOK'],
      }
    }
  },
};