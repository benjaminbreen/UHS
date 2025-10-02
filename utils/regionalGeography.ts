/**
 * Regional geography mapping - converts real-world positions to hex grid
 * Each region gets one hex on the main map
 */

import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';
import { ADJACENCIES } from '../constants/gameData/adjacencies';

export interface RegionHex {
  name: string;
  zone: string;
  x: number;
  y: number;
  areaCount: number;
  dominantClimate: string;
  areas: string[];
  // Real world approximate center
  lat: number;
  lng: number;
}

/**
 * Convert latitude/longitude to hex grid position
 * This creates a more accurate world map
 */
function latLngToHex(lat: number, lng: number): { x: number; y: number } {
  // Normalize longitude from -180,180 to 0,360
  const normLng = (lng + 180) / 360;

  // Normalize latitude from -90,90 to 0,1 (inverted for display)
  const normLat = (90 - lat) / 180;

  // Map to hex grid (roughly 120 wide, 60 tall)
  const x = Math.round(normLng * 120);
  const y = Math.round(normLat * 60);

  return { x, y };
}

/**
 * Regional geographic positions based on real-world locations
 * These are the approximate centers of each region
 */
const REGION_COORDINATES: { [region: string]: { lat: number; lng: number } } = {
  // Europe
  'British Isles': { lat: 54, lng: -3 },
  'Ireland': { lat: 53, lng: -8 },
  'Scotland': { lat: 56, lng: -4 },
  'France': { lat: 47, lng: 2 },
  'Low Countries': { lat: 52, lng: 5 },
  'Iberian Peninsula': { lat: 40, lng: -4 },
  'Italy': { lat: 42, lng: 12 },
  'Germanic Lands': { lat: 51, lng: 10 },
  'Scandinavia': { lat: 62, lng: 15 },
  'Central Europe': { lat: 48, lng: 16 },
  'Balkans': { lat: 43, lng: 21 },
  'Greece and Aegean': { lat: 38, lng: 23 },
  'Eastern Europe': { lat: 52, lng: 30 },
  'Ural and Arctic Europe': { lat: 60, lng: 55 },
  'European Waters': { lat: 55, lng: 10 },

  // MENA
  'Maghreb': { lat: 30, lng: 0 },
  'Nile Valley': { lat: 25, lng: 32 },
  'Eastern Desert and Red Sea': { lat: 24, lng: 35 },
  'Nubian Corridor': { lat: 20, lng: 33 },
  'Levant': { lat: 32, lng: 35 },
  'Mesopotamia': { lat: 33, lng: 44 },
  'Arabian Peninsula': { lat: 24, lng: 45 },
  'Anatolia': { lat: 39, lng: 35 },
  'Persian Plateau': { lat: 32, lng: 53 },
  'Caucasus': { lat: 42, lng: 45 },

  // Africa
  'Sahel': { lat: 14, lng: 5 },
  'Upper Guinea': { lat: 10, lng: -11 },
  'West African Forests': { lat: 6, lng: 2 },
  'Lower Guinea and Congo Basin': { lat: -1, lng: 18 },
  'Central Africa': { lat: 2, lng: 23 },
  'East African Rift': { lat: -2, lng: 35 },
  'Horn of Africa': { lat: 9, lng: 43 },
  'Southern Africa': { lat: -24, lng: 26 },
  'Madagascar and Islands': { lat: -19, lng: 46 },

  // South Asia
  'Indus Valley': { lat: 28, lng: 69 },
  'Punjab Plains': { lat: 31, lng: 74 },
  'Kashmir Valley': { lat: 34, lng: 75 },
  'Gangetic Plain': { lat: 26, lng: 82 },
  'Central India': { lat: 22, lng: 78 },
  'Deccan Plateau': { lat: 17, lng: 77 },
  'Himalayas and Northeast': { lat: 28, lng: 88 },
  'Sri Lanka': { lat: 7, lng: 81 },

  // East Asia
  'North China Plain': { lat: 37, lng: 116 },
  'South China': { lat: 24, lng: 112 },
  'West China and Tibet': { lat: 31, lng: 88 },
  'Mongolia and Manchuria': { lat: 46, lng: 108 },
  'Korea': { lat: 37, lng: 127 },
  'Japan': { lat: 37, lng: 138 },
  'Taiwan and Ryukyu': { lat: 24, lng: 121 },
  'Taiwan and East China Sea': { lat: 26, lng: 122 },
  'Xinjiang': { lat: 43, lng: 86 },
  'Central Asian Oases': { lat: 41, lng: 64 },
  'Kazakh Steppes': { lat: 50, lng: 66 },
  'Siberia': { lat: 62, lng: 105 },

  // Southeast Asia
  'Mainland Southeast Asia': { lat: 15, lng: 101 },
  'Indochina Interior': { lat: 19, lng: 103 },
  'Maritime Southeast Asia': { lat: -1, lng: 118 },
  'Philippines': { lat: 13, lng: 122 },
  'Indonesian and Melanesian Islands': { lat: -4, lng: 125 },

  // Oceania
  'Australia – North and Queensland': { lat: -18, lng: 142 },
  'Australia – Outback and Center': { lat: -25, lng: 134 },
  'Australia – Southeast': { lat: -37, lng: 145 },
  'Australia – West and Desert': { lat: -26, lng: 120 },
  'New Zealand': { lat: -41, lng: 174 },
  'New Guinea and Melanesia': { lat: -5, lng: 145 },
  'Micronesia': { lat: 8, lng: 158 },
  'Polynesia': { lat: -15, lng: -145 },
  'Hawaii and Central Pacific': { lat: 21, lng: -157 },

  // North America
  'Canada': { lat: 56, lng: -106 },
  'Arctic and Subarctic': { lat: 75, lng: -95 },
  'Northeastern Seaboard': { lat: 42, lng: -73 },
  'Atlantic Coast': { lat: 35, lng: -78 },
  'Southeast': { lat: 32, lng: -85 },
  'Great Plains': { lat: 42, lng: -100 },
  'Mississippi Valley': { lat: 38, lng: -90 },
  'Southwest': { lat: 34, lng: -110 },
  'Mexico and Central Highlands': { lat: 23, lng: -102 },
  'Northern Rockies': { lat: 47, lng: -114 },
  'Pacific Coast': { lat: 43, lng: -123 },
  'Northern California': { lat: 41, lng: -122 },
  'Central California Coast': { lat: 36, lng: -121 },
  'Southern California': { lat: 34, lng: -118 },

  // Central America & Caribbean
  'Central America': { lat: 14, lng: -88 },
  'The Caribbean': { lat: 19, lng: -75 },
  'Atlantic Islands': { lat: 32, lng: -17 },

  // South America
  'Llanos and Orinoco': { lat: 8, lng: -66 },
  'Guiana Shield': { lat: 5, lng: -59 },
  'Amazon Basin': { lat: -3, lng: -62 },
  'Andes North': { lat: -1, lng: -78 },
  'Andes South': { lat: -33, lng: -70 },
  'Gran Chaco and Pampas': { lat: -32, lng: -62 },
  'Southern Highlands': { lat: -22, lng: -48 },
  'Patagonia': { lat: -48, lng: -70 },

  // Special/Waters
  'Major Seas and Oceans': { lat: 0, lng: 0 },
  'Antarctica': { lat: -75, lng: 0 },

  // Additional regions from geography.ts that might be missing
  'Special': { lat: 0, lng: 0 },
  'Unknown': { lat: 0, lng: 0 },
  'Outer Space': { lat: 90, lng: 0 }
};

/**
 * Build regional hex map with proper geographic positions
 */
export function buildRegionalMap(): RegionHex[] {
  const regions: RegionHex[] = [];
  const processedRegions = new Set<string>();

  // Process all regions from GEOGRAPHICAL_DATA
  Object.entries(GEOGRAPHICAL_DATA).forEach(([zone, zoneData]) => {
    Object.entries(zoneData).forEach(([regionName, regionData]) => {
      if (typeof regionData === 'object' && !Array.isArray(regionData)) {
        // Skip if already processed
        if (processedRegions.has(regionName)) return;
        processedRegions.add(regionName);

        // Collect all areas in this region
        const areas: string[] = [];
        const climates: { [climate: string]: number } = {};

        Object.entries(regionData).forEach(([areaKey, area]) => {
          if (area && typeof area === 'object' && 'name' in area) {
            areas.push(area.name);
            const climate = area.climate || 'temperate';
            climates[climate] = (climates[climate] || 0) + 1;
          }
        });

        // Skip empty regions
        if (areas.length === 0) return;

        // Find dominant climate
        let dominantClimate = 'temperate';
        let maxCount = 0;
        Object.entries(climates).forEach(([climate, count]) => {
          if (count > maxCount) {
            maxCount = count;
            dominantClimate = climate;
          }
        });

        // Get geographic position
        const coords = REGION_COORDINATES[regionName] || { lat: 0, lng: 0 };
        const hexPos = latLngToHex(coords.lat, coords.lng);

        regions.push({
          name: regionName,
          zone: zone,
          x: hexPos.x,
          y: hexPos.y,
          areaCount: areas.length,
          dominantClimate: dominantClimate,
          areas: areas,
          lat: coords.lat,
          lng: coords.lng
        });
      }
    });
  });

  return regions;
}

/**
 * Get areas within a specific region
 */
export function getRegionAreas(regionName: string): Array<{
  name: string;
  climate: string;
  connections: { [dir: string]: string };
}> {
  const areas: Array<{
    name: string;
    climate: string;
    connections: { [dir: string]: string };
  }> = [];

  Object.entries(GEOGRAPHICAL_DATA).forEach(([zone, zoneData]) => {
    Object.entries(zoneData).forEach(([regName, regionData]) => {
      if (regName === regionName && typeof regionData === 'object' && !Array.isArray(regionData)) {
        Object.entries(regionData).forEach(([areaKey, area]) => {
          if (area && typeof area === 'object' && 'name' in area) {
            const connections = ADJACENCIES[area.name] || {};
            areas.push({
              name: area.name,
              climate: area.climate || 'temperate',
              connections: connections
            });
          }
        });
      }
    });
  });

  return areas;
}

/**
 * Get adjacent regions based on their areas' connections
 */
export function getAdjacentRegions(regionName: string): Set<string> {
  const adjacentRegions = new Set<string>();
  const regionAreas = getRegionAreas(regionName);

  regionAreas.forEach(area => {
    Object.values(area.connections).forEach(connectedArea => {
      if (connectedArea && !connectedArea.startsWith('LIMINAL')) {
        // Find which region contains this connected area
        Object.entries(GEOGRAPHICAL_DATA).forEach(([zone, zoneData]) => {
          Object.entries(zoneData).forEach(([regName, regionData]) => {
            if (regName !== regionName && typeof regionData === 'object') {
              Object.entries(regionData).forEach(([areaKey, areaData]) => {
                if (areaData && typeof areaData === 'object' && 'name' in areaData) {
                  if (areaData.name === connectedArea) {
                    adjacentRegions.add(regName);
                  }
                }
              });
            }
          });
        });
      }
    });
  });

  return adjacentRegions;
}