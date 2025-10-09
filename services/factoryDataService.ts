/**
 * Factory Data Service
 * SINGLE SOURCE OF TRUTH for factory type identification and data
 */

import { FACTORY_TYPES, FactoryType } from '../constants/gameData/factoryTypes';
import { TerrainStructure, MapData } from '../types';
import { FactoryTask } from '../components/factory/FactoryTaskCard';
import { FactoryEvent } from '../components/factory/FactoryEventModal';
import { getFactoryType } from '../constants/gameData/factoryTypes';

/**
 * Get factory type from terrain structure
 * This is the SINGLE SOURCE OF TRUTH for factory identification
 */
export function getFactoryTypeFromStructure(
  structure: TerrainStructure,
  mapData: MapData
): FactoryType | null {
  console.log('[FactoryData] Identifying factory type:', {
    structureName: structure.name,
    factorySubtype: structure.factorySubtype,
    era: mapData.era,
    zone: mapData.culturalZone
  });

  // Priority 1: Use structure.factorySubtype if it exists
  if (structure.factorySubtype && FACTORY_TYPES[structure.factorySubtype]) {
    console.log('[FactoryData] ✅ Found via factorySubtype:', structure.factorySubtype);
    return FACTORY_TYPES[structure.factorySubtype];
  }

  // Priority 2: Use structure.name to infer type
  const nameLower = structure.name.toLowerCase();
  for (const [id, type] of Object.entries(FACTORY_TYPES)) {
    if (nameLower.includes(type.name.toLowerCase())) {
      console.log('[FactoryData] ✅ Found via name match:', id);
      return type;
    }
  }

  // Priority 3: Use getFactoryType based on era/zone/region
  const fallbackType = getFactoryType(mapData.era, mapData.culturalZone, mapData.region || mapData.localArea || 'Unknown');
  console.log('[FactoryData] ⚠️  Using fallback type:', fallbackType?.id || 'null');
  return fallbackType;
}

/**
 * Validate that tasks match factory type
 */
export function validateFactoryTasks(factoryType: FactoryType, tasks: FactoryTask[]): boolean {
  if (tasks.length === 0) {
    console.error('[FactoryData] ❌ No tasks for factory type:', factoryType.id);
    return false;
  }

  // Check that task IDs don't contradict factory type
  const invalidTasks = tasks.filter(task => {
    // Sugar plantation tasks shouldn't appear in railway workshop
    if (factoryType.id === 'railway_workshop' && task.id.includes('cane')) {
      return true;
    }
    // Railway tasks shouldn't appear in sugar plantation
    if (factoryType.id === 'sugar_plantation' && task.id.includes('boiler')) {
      return true;
    }
    return false;
  });

  if (invalidTasks.length > 0) {
    console.error('[FactoryData] ❌ Invalid tasks detected:', {
      factoryType: factoryType.id,
      invalidTasks: invalidTasks.map(t => t.id)
    });
    return false;
  }

  console.log('[FactoryData] ✅ Tasks validated for:', factoryType.id);
  return true;
}
