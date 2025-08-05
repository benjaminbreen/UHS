/**
 * services/settlementService.ts - Logic for generating detailed settlement information.
 */
import { Tile, MapData, CulturalZone, HistoricalEra, BiomeType } from '../types';
import { PROFESSIONS, ProfessionDefinition } from '../constants/index';

export function getSettlementProfessions(
    tile: Tile,
    mapData: MapData,
    culturalZone: CulturalZone,
    era: HistoricalEra
): string[] {
    const weights = new Map<string, number>();
    const radius = 10;
    
    const eraProfessions = PROFESSIONS[culturalZone]?.[era];
    if (!eraProfessions) return ['Farmer', 'Laborer'];

    // 1. Check nearby structures
    mapData.terrainStructures?.forEach(s => {
        if (Math.hypot(s.location[0] - tile.x, s.location[1] - tile.y) < radius) {
            weights.set(s.npcAnchor, (weights.get(s.npcAnchor) || 0) + 20);
        }
    });

    // 2. Check nearby biomes
    for (let y = Math.max(0, tile.y - radius); y < Math.min(mapData.height, tile.y + radius); y++) {
        for (let x = Math.max(0, tile.x - radius); x < Math.min(mapData.width, tile.x + radius); x++) {
            const checkTile = mapData.tiles[y][x];
            if (checkTile.isCoast) weights.set('Sailor', (weights.get('Sailor') || 0) + 0.5);
            if (checkTile.biome === BiomeType.FOREST || checkTile.biome === BiomeType.DENSE_FOREST) weights.set('Lumberjack', (weights.get('Lumberjack') || 0) + 0.3);
            if (checkTile.biome === BiomeType.MOUNTAIN) weights.set('Miner', (weights.get('Miner') || 0) + 0.2);
        }
    }

    // 3. Add base weights for common professions
    weights.set('Farmer', (weights.get('Farmer') || 0) + 5);
    weights.set('Guard', (weights.get('Guard') || 0) + 3);
    weights.set('Merchant', (weights.get('Merchant') || 0) + 4);
    
    const tavernWenchKey = Object.keys(eraProfessions).flatMap(sc => Object.keys(eraProfessions[sc])).find(r => r.toLowerCase().includes('tavern')) || 'Tavern Wench';
    weights.set(tavernWenchKey, (weights.get(tavernWenchKey) || 0) + 2);

    // Filter to available professions and sort
    const validProfessions = Object.entries(weights)
        .filter(([prof, _]) => {
            for (const socialClass in eraProfessions) {
                if (eraProfessions[socialClass][prof]) return true;
            }
            return false;
        })
        .sort(([, weightA], [, weightB]) => weightB - weightA);

    return validProfessions.map(([prof, _]) => prof).slice(0, 7);
}