/**
 * Map layout positions for all 583 areas from geography.ts
 * Areas are grouped by region but each has its own hex position
 */

import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';
import { ADJACENCIES } from '../constants/gameData/adjacencies';

export interface AreaPosition {
  name: string;
  region: string;
  zone: string;
  climate: string;
  x: number;
  y: number;
}

export interface RegionLabel {
  name: string;
  x: number;
  y: number;
  areaCount: number;
}

/**
 * Generate hex positions for all areas based on adjacencies
 * This creates a proper map layout where adjacent areas are next to each other
 */
export function generateAreaPositions(): { areas: AreaPosition[], regions: RegionLabel[] } {
  const areas: AreaPosition[] = [];
  const regionCenters: { [region: string]: { x: number; y: number; count: number } } = {};

  // Starting positions for major regions (spread across the map)
  const regionStartPositions: { [key: string]: { x: number; y: number } } = {
    // Europe
    'British Isles': { x: 30, y: 15 },
    'Ireland': { x: 28, y: 15 },
    'Scotland': { x: 30, y: 13 },
    'France': { x: 32, y: 17 },
    'Low Countries': { x: 34, y: 15 },
    'Iberian Peninsula': { x: 30, y: 20 },
    'Italy': { x: 36, y: 19 },
    'Germanic Lands': { x: 36, y: 16 },
    'Scandinavia': { x: 38, y: 12 },
    'Central Europe': { x: 39, y: 17 },
    'Balkans': { x: 40, y: 19 },
    'Greece and Aegean': { x: 41, y: 21 },
    'Eastern Europe': { x: 42, y: 16 },
    'Ural and Arctic Europe': { x: 46, y: 14 },

    // MENA
    'Maghreb': { x: 32, y: 24 },
    'Nile Valley': { x: 40, y: 25 },
    'Nubian Corridor': { x: 41, y: 28 },
    'Levant': { x: 43, y: 23 },
    'Mesopotamia': { x: 45, y: 24 },
    'Arabian Peninsula': { x: 47, y: 27 },
    'Anatolia': { x: 42, y: 21 },
    'Persian Plateau': { x: 49, y: 25 },
    'Caucasus': { x: 44, y: 20 },

    // Africa
    'Sahel': { x: 35, y: 30 },
    'Upper Guinea': { x: 30, y: 32 },
    'West African Forests': { x: 33, y: 34 },
    'Lower Guinea and Congo Basin': { x: 37, y: 36 },
    'Central Africa': { x: 40, y: 35 },
    'East African Rift': { x: 43, y: 35 },
    'Horn of Africa': { x: 45, y: 32 },
    'Southern Africa': { x: 40, y: 40 },
    'Madagascar and Islands': { x: 46, y: 39 },

    // South Asia
    'Indus Valley': { x: 52, y: 26 },
    'Punjab Plains': { x: 53, y: 24 },
    'Kashmir Valley': { x: 54, y: 22 },
    'Gangetic Plain': { x: 56, y: 26 },
    'Central India': { x: 55, y: 28 },
    'Deccan Plateau': { x: 54, y: 30 },
    'Himalayas and Northeast': { x: 58, y: 24 },
    'Sri Lanka': { x: 54, y: 33 },

    // East Asia
    'North China Plain': { x: 64, y: 20 },
    'South China': { x: 63, y: 24 },
    'West China and Tibet': { x: 59, y: 21 },
    'Mongolia and Manchuria': { x: 66, y: 18 },
    'Korea': { x: 68, y: 20 },
    'Japan': { x: 71, y: 21 },
    'Taiwan and Ryukyu': { x: 67, y: 25 },
    'Xinjiang': { x: 56, y: 19 },
    'Central Asian Oases': { x: 53, y: 20 },
    'Kazakh Steppes': { x: 50, y: 17 },
    'Siberia': { x: 55, y: 14 },

    // Southeast Asia
    'Mainland Southeast Asia': { x: 60, y: 28 },
    'Indochina Interior': { x: 62, y: 27 },
    'Maritime Southeast Asia': { x: 63, y: 32 },
    'Philippines': { x: 67, y: 30 },
    'Indonesian and Melanesian Islands': { x: 65, y: 34 },

    // Oceania
    'Australia – North and Queensland': { x: 68, y: 36 },
    'Australia – Outback and Center': { x: 66, y: 38 },
    'Australia – Southeast': { x: 70, y: 39 },
    'Australia – West and Desert': { x: 63, y: 38 },
    'New Zealand': { x: 74, y: 42 },
    'New Guinea and Melanesia': { x: 70, y: 33 },
    'Micronesia': { x: 73, y: 30 },
    'Polynesia': { x: 77, y: 32 },
    'Hawaii and Central Pacific': { x: 80, y: 28 },

    // North America
    'Canada': { x: 12, y: 10 },
    'Arctic and Subarctic': { x: 20, y: 5 },
    'Northeastern Seaboard': { x: 16, y: 16 },
    'Atlantic Coast': { x: 16, y: 19 },
    'Southeast': { x: 14, y: 22 },
    'Great Plains': { x: 10, y: 18 },
    'Mississippi Valley': { x: 12, y: 20 },
    'Southwest': { x: 8, y: 23 },
    'Mexico and Central Highlands': { x: 8, y: 26 },
    'Northern Rockies': { x: 6, y: 15 },
    'Pacific Coast': { x: 3, y: 17 },
    'Northern California': { x: 2, y: 19 },
    'Central California Coast': { x: 1, y: 20 },
    'Southern California': { x: 2, y: 22 },

    // Central America & Caribbean
    'Central America': { x: 10, y: 28 },
    'The Caribbean': { x: 14, y: 26 },
    'Atlantic Islands': { x: 24, y: 20 },

    // South America
    'Llanos and Orinoco': { x: 16, y: 30 },
    'Guiana Shield': { x: 18, y: 31 },
    'Amazon Basin': { x: 20, y: 33 },
    'Andes North': { x: 16, y: 32 },
    'Andes South': { x: 15, y: 37 },
    'Gran Chaco and Pampas': { x: 18, y: 38 },
    'Southern Highlands': { x: 20, y: 36 },
    'Patagonia': { x: 16, y: 41 },

    // Special/Waters
    'European Waters': { x: 35, y: 13 },
    'Major Seas and Oceans': { x: 50, y: 32 },
    'Antarctica': { x: 35, y: 45 }
  };

  // Process each zone and region to place areas
  let areaId = 0;
  Object.entries(GEOGRAPHICAL_DATA).forEach(([zone, zoneData]) => {
    Object.entries(zoneData).forEach(([regionName, regionData]) => {
      if (typeof regionData === 'object' && !Array.isArray(regionData)) {
        const regionStart = regionStartPositions[regionName] || { x: 40, y: 25 };
        let localX = 0;
        let localY = 0;
        let areaIndex = 0;

        Object.entries(regionData).forEach(([areaKey, area]) => {
          if (area && typeof area === 'object' && 'name' in area) {
            // Place areas in a hex pattern around the region center
            const angle = (areaIndex * 60) % 360;
            const radius = Math.floor(areaIndex / 6) + 1;
            const rad = (angle * Math.PI) / 180;

            const x = regionStart.x + Math.round(Math.cos(rad) * radius);
            const y = regionStart.y + Math.round(Math.sin(rad) * radius * 0.8); // Compress Y for hex layout

            areas.push({
              name: area.name,
              region: regionName,
              zone: zone,
              climate: area.climate || 'temperate',
              x: x,
              y: y
            });

            // Track region center
            if (!regionCenters[regionName]) {
              regionCenters[regionName] = { x: 0, y: 0, count: 0 };
            }
            regionCenters[regionName].x += x;
            regionCenters[regionName].y += y;
            regionCenters[regionName].count++;

            areaIndex++;
          }
        });
      }
    });
  });

  // Calculate region label positions (center of all areas in region)
  const regions: RegionLabel[] = [];
  Object.entries(regionCenters).forEach(([name, data]) => {
    if (data.count > 0) {
      regions.push({
        name: name,
        x: Math.round(data.x / data.count),
        y: Math.round(data.y / data.count),
        areaCount: data.count
      });
    }
  });

  return { areas, regions };
}

/**
 * Get connections between areas based on adjacencies
 */
export function getAreaConnections(areas: AreaPosition[]): Array<{ from: AreaPosition; to: AreaPosition }> {
  const connections: Array<{ from: AreaPosition; to: AreaPosition }> = [];
  const areaMap = new Map(areas.map(a => [a.name, a]));

  areas.forEach(area => {
    const adjacency = ADJACENCIES[area.name];
    if (adjacency) {
      ['N', 'S', 'E', 'W'].forEach(dir => {
        const neighbor = adjacency[dir as 'N' | 'S' | 'E' | 'W'];
        if (neighbor && !neighbor.startsWith('LIMINAL')) {
          const neighborArea = areaMap.get(neighbor);
          if (neighborArea) {
            // Avoid duplicate connections
            const exists = connections.some(c =>
              (c.from.name === area.name && c.to.name === neighbor) ||
              (c.from.name === neighbor && c.to.name === area.name)
            );
            if (!exists) {
              connections.push({ from: area, to: neighborArea });
            }
          }
        }
      });
    }
  });

  return connections;
}