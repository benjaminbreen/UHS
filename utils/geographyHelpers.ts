/**
 * Helper functions for processing geography data
 */

import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';

export interface RegionData {
  name: string;
  zone: string;
  areas: Array<{
    name: string;
    climate: string;
    archetype?: string;
  }>;
}

export interface AreaData {
  name: string;
  region: string;
  zone: string;
  climate: string;
  archetype?: string;
}

/**
 * Get all regions with their areas grouped
 */
export function getAllRegionsGrouped(): RegionData[] {
  const regions: RegionData[] = [];

  Object.entries(GEOGRAPHICAL_DATA).forEach(([zone, zoneData]) => {
    Object.entries(zoneData).forEach(([regionName, regionData]) => {
      if (typeof regionData === 'object' && !Array.isArray(regionData)) {
        const areas: any[] = [];

        Object.entries(regionData).forEach(([areaName, area]) => {
          if (area && typeof area === 'object' && 'name' in area) {
            areas.push({
              name: area.name,
              climate: area.climate || 'temperate',
              archetype: area.archetype
            });
          }
        });

        if (areas.length > 0) {
          regions.push({
            name: regionName,
            zone: zone,
            areas: areas
          });
        }
      }
    });
  });

  return regions;
}

/**
 * Get all individual areas with their parent region and zone
 */
export function getAllAreas(): AreaData[] {
  const areas: AreaData[] = [];

  Object.entries(GEOGRAPHICAL_DATA).forEach(([zone, zoneData]) => {
    Object.entries(zoneData).forEach(([regionName, regionData]) => {
      if (typeof regionData === 'object' && !Array.isArray(regionData)) {
        Object.entries(regionData).forEach(([areaName, area]) => {
          if (area && typeof area === 'object' && 'name' in area) {
            areas.push({
              name: area.name,
              region: regionName,
              zone: zone,
              climate: area.climate || 'temperate',
              archetype: area.archetype
            });
          }
        });
      }
    });
  });

  return areas;
}

/**
 * Map regions to hex grid positions
 * This creates a more accurate world map layout
 */
export function getRegionHexPositions(): { [regionName: string]: { x: number; y: number; areas: string[] } } {
  const positions: { [regionName: string]: { x: number; y: number; areas: string[] } } = {};

  // Europe - Western regions
  positions['British Isles'] = { x: 35, y: 12, areas: [] };
  positions['France'] = { x: 36, y: 14, areas: [] };
  positions['Iberian Peninsula'] = { x: 34, y: 17, areas: [] };
  positions['Low Countries'] = { x: 37, y: 13, areas: [] };

  // Europe - Central
  positions['Germanic Lands'] = { x: 39, y: 13, areas: [] };
  positions['Italy'] = { x: 39, y: 16, areas: [] };
  positions['Central Europe'] = { x: 41, y: 14, areas: [] };
  positions['Scandinavia'] = { x: 40, y: 9, areas: [] };

  // Europe - Eastern
  positions['Balkans'] = { x: 42, y: 16, areas: [] };
  positions['Greece and Aegean'] = { x: 43, y: 18, areas: [] };
  positions['Eastern Europe'] = { x: 44, y: 13, areas: [] };
  positions['Ural and Arctic Europe'] = { x: 48, y: 10, areas: [] };

  // MENA - North Africa
  positions['Maghreb'] = { x: 36, y: 20, areas: [] };
  positions['Nile Valley'] = { x: 43, y: 21, areas: [] };
  positions['Eastern Desert and Red Sea'] = { x: 45, y: 22, areas: [] };
  positions['Nubian Corridor'] = { x: 44, y: 24, areas: [] };

  // MENA - Middle East
  positions['Levant'] = { x: 46, y: 19, areas: [] };
  positions['Mesopotamia'] = { x: 48, y: 19, areas: [] };
  positions['Arabian Peninsula'] = { x: 49, y: 23, areas: [] };
  positions['Anatolia'] = { x: 45, y: 17, areas: [] };
  positions['Persian Plateau'] = { x: 52, y: 20, areas: [] };
  positions['Caucasus'] = { x: 47, y: 16, areas: [] };

  // Africa - Sub-Saharan
  positions['Sahel'] = { x: 38, y: 25, areas: [] };
  positions['Upper Guinea'] = { x: 34, y: 27, areas: [] };
  positions['West African Forests'] = { x: 36, y: 28, areas: [] };
  positions['Lower Guinea and Congo Basin'] = { x: 40, y: 30, areas: [] };
  positions['Central Africa'] = { x: 42, y: 29, areas: [] };
  positions['East African Rift'] = { x: 45, y: 29, areas: [] };
  positions['Horn of Africa'] = { x: 48, y: 27, areas: [] };
  positions['Southern Africa'] = { x: 43, y: 35, areas: [] };
  positions['Madagascar and Islands'] = { x: 48, y: 34, areas: [] };

  // South Asia
  positions['Indus Valley'] = { x: 54, y: 22, areas: [] };
  positions['Gangetic Plain'] = { x: 57, y: 23, areas: [] };
  positions['Central India'] = { x: 56, y: 25, areas: [] };
  positions['Deccan Plateau'] = { x: 56, y: 27, areas: [] };
  positions['Himalayas and Northeast'] = { x: 59, y: 21, areas: [] };
  positions['Sri Lanka'] = { x: 57, y: 30, areas: [] };

  // East Asia
  positions['North China Plain'] = { x: 65, y: 18, areas: [] };
  positions['South China'] = { x: 64, y: 22, areas: [] };
  positions['West China and Tibet'] = { x: 60, y: 19, areas: [] };
  positions['Mongolia and Manchuria'] = { x: 67, y: 15, areas: [] };
  positions['Korea'] = { x: 69, y: 17, areas: [] };
  positions['Japan'] = { x: 72, y: 18, areas: [] };
  positions['Taiwan and Ryukyu'] = { x: 68, y: 23, areas: [] };

  // Central Asia
  positions['Xinjiang'] = { x: 58, y: 16, areas: [] };
  positions['Central Asian Oases'] = { x: 55, y: 17, areas: [] };
  positions['Kazakh Steppes'] = { x: 53, y: 14, areas: [] };
  positions['Siberia'] = { x: 60, y: 10, areas: [] };

  // Southeast Asia
  positions['Mainland Southeast Asia'] = { x: 62, y: 26, areas: [] };
  positions['Indochina Interior'] = { x: 63, y: 24, areas: [] };
  positions['Maritime Southeast Asia'] = { x: 64, y: 30, areas: [] };
  positions['Philippines'] = { x: 68, y: 28, areas: [] };
  positions['Indonesian and Melanesian Islands'] = { x: 66, y: 32, areas: [] };

  // Oceania
  positions['Australia – North and Queensland'] = { x: 70, y: 33, areas: [] };
  positions['Australia – Outback and Center'] = { x: 68, y: 35, areas: [] };
  positions['Australia – Southeast'] = { x: 72, y: 37, areas: [] };
  positions['Australia – West and Desert'] = { x: 65, y: 35, areas: [] };
  positions['New Zealand'] = { x: 75, y: 40, areas: [] };
  positions['New Guinea and Melanesia'] = { x: 72, y: 31, areas: [] };
  positions['Micronesia'] = { x: 74, y: 28, areas: [] };
  positions['Polynesia'] = { x: 78, y: 30, areas: [] };
  positions['Hawaii and Central Pacific'] = { x: 82, y: 25, areas: [] };

  // North America - East
  positions['Canada'] = { x: 15, y: 8, areas: [] };
  positions['Northeastern Seaboard'] = { x: 18, y: 14, areas: [] };
  positions['Atlantic Coast'] = { x: 18, y: 17, areas: [] };
  positions['Southeast'] = { x: 16, y: 20, areas: [] };

  // North America - Central
  positions['Great Plains'] = { x: 12, y: 16, areas: [] };
  positions['Mississippi Valley'] = { x: 14, y: 18, areas: [] };
  positions['Southwest'] = { x: 10, y: 21, areas: [] };
  positions['Mexico and Central Highlands'] = { x: 10, y: 24, areas: [] };

  // North America - West
  positions['Northern Rockies'] = { x: 8, y: 13, areas: [] };
  positions['Pacific Coast'] = { x: 5, y: 15, areas: [] };
  positions['Northern California'] = { x: 4, y: 17, areas: [] };
  positions['Central California Coast'] = { x: 3, y: 18, areas: [] };
  positions['Southern California'] = { x: 4, y: 20, areas: [] };

  // Central America & Caribbean
  positions['Central America'] = { x: 12, y: 26, areas: [] };
  positions['The Caribbean'] = { x: 16, y: 24, areas: [] };

  // South America - North
  positions['Llanos and Orinoco'] = { x: 18, y: 28, areas: [] };
  positions['Guiana Shield'] = { x: 20, y: 29, areas: [] };
  positions['Amazon Basin'] = { x: 22, y: 31, areas: [] };

  // South America - West
  positions['Andes North'] = { x: 18, y: 30, areas: [] };
  positions['Andes South'] = { x: 17, y: 35, areas: [] };

  // South America - South
  positions['Gran Chaco and Pampas'] = { x: 20, y: 36, areas: [] };
  positions['Southern Highlands'] = { x: 22, y: 34, areas: [] };
  positions['Patagonia'] = { x: 18, y: 40, areas: [] };

  // Special regions
  positions['Arctic and Subarctic'] = { x: 30, y: 3, areas: [] };
  positions['Antarctica'] = { x: 40, y: 45, areas: [] };
  positions['Atlantic Islands'] = { x: 28, y: 18, areas: [] };
  positions['Major Seas and Oceans'] = { x: 50, y: 30, areas: [] };

  // Fill in areas for each region
  const regions = getAllRegionsGrouped();
  regions.forEach(region => {
    if (positions[region.name]) {
      positions[region.name].areas = region.areas.map(a => a.name);
    }
  });

  return positions;
}