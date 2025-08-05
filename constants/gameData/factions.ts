/**
 * constants/gameData/factions.ts - Main entry point for all faction data.
 * This file imports data from modularized cultural zone files and exports them as a single object.
 */
import { FactionDatabase } from '../../types';
import { EUROPEAN_FACTIONS } from './factions/european';
import { NORTH_AMERICAN_PRE_COLUMBIAN_FACTIONS } from './factions/northAmericanPreColumbian';
import { NORTH_AMERICAN_COLONIAL_FACTIONS } from './factions/northAmericanColonial';
import { SOUTH_AMERICAN_FACTIONS } from './factions/southAmerican';
import { MENA_FACTIONS } from './factions/mena';
import { SUB_SAHARAN_AFRICAN_FACTIONS } from './factions/subSaharanAfrican';
import { SOUTH_ASIAN_FACTIONS } from './factions/southAsian';
import { EAST_ASIAN_FACTIONS } from './factions/eastAsian';
import { OCEANIA_FACTIONS } from './factions/oceania';

export * from './factions/types';

export const FACTION_DATA: FactionDatabase = {
  ...EUROPEAN_FACTIONS,
  ...NORTH_AMERICAN_PRE_COLUMBIAN_FACTIONS,
  ...NORTH_AMERICAN_COLONIAL_FACTIONS,
  ...SOUTH_AMERICAN_FACTIONS,
  ...MENA_FACTIONS,
  ...SUB_SAHARAN_AFRICAN_FACTIONS,
  ...SOUTH_ASIAN_FACTIONS,
  ...EAST_ASIAN_FACTIONS,
  ...OCEANIA_FACTIONS
};
