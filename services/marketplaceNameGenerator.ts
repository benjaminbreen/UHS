/**
 * services/marketplaceNameGenerator.ts - Generates historically authentic, procedural names for marketplaces.
 */
import { MapData, BiomeType, MarketplaceInfo, CulturalZone, HistoricalEra } from '../types';
import { FACTION_DATA } from '../constants/index';
import { getMapAreaCardinalDirection } from '../utils/geographyUtils';
import { parseDateString } from '../utils/dateUtils';

function isNearRiver(tileX: number, tileY: number, mapData: MapData): boolean {
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            const checkX = tileX + dx;
            const checkY = tileY + dy;
            if (checkX >= 0 && checkX < mapData.width && checkY >= 0 && checkY < mapData.height) {
                if (mapData.tiles[checkY][checkX].biome === BiomeType.RIVER || mapData.tiles[checkY][checkX].biome === BiomeType.MAJOR_RIVER) {
                    return true;
                }
            }
        }
    }
    return false;
}

export function generateMarketplaceNames(mapData: MapData): MarketplaceInfo[] {
    const marketplaces: MarketplaceInfo[] = [];
    const dateInfo = parseDateString(mapData.timeSlice || '1650');
    
    // Check if faction data is available, otherwise use a generic descriptor
    const factionData = FACTION_DATA[mapData.continent as CulturalZone]?.[mapData.region || '']?.[dateInfo.era as HistoricalEra];
    const dominantFaction = factionData?.dominantPower || mapData.continent;

    mapData.tiles.flat().forEach(tile => {
        if (tile.biome === BiomeType.MARKETPLACE) {
            const direction = getMapAreaCardinalDirection({ x: tile.x, y: tile.y });
            const nearRiver = isNearRiver(tile.x, tile.y, mapData);

            let name = '';
            const random = Math.random();

            if (nearRiver && random > 0.5) {
                 name = `Riverside Market of ${dominantFaction}`;
            } else if (direction !== 'Central' && random > 0.3) {
                 name = `${direction} Market of ${dominantFaction}`;
            } else {
                 name = `${mapData.localArea} Central Market`;
            }

            marketplaces.push({
                name,
                x: tile.x,
                y: tile.y,
            });
        }
    });

    return marketplaces;
}