/**
 * generation/standardMap/features/MineralGenerator.ts - Procedural mineral deposit generation
 */
import { MapData, Tile, BiomeType, HistoricalEra } from '../../../types';
import { ValueNoise } from '../../../utils/noise';
import { METALS } from '../../../constants/gameData/metals';
import { getAvailableMinerals, FUTURE_MINERALS } from '../../../constants/gameData/historicalMinerals';

export function generateMineralDeposits(mapData: MapData, noise: ValueNoise): void {
    console.log('[MineralGen] Starting mineral deposit generation...');
    
    const tiles = mapData.tiles;
    const era = mapData.era || HistoricalEra.MEDIEVAL;
    const region = mapData.mapAreaName || 'DEFAULT';
    
    // Get available minerals for this region and era
    let availableMinerals = getAvailableMinerals(region, era);
    
    // Add future minerals if in future era
    if (era === HistoricalEra.FUTURE_ERA) {
        availableMinerals = [...availableMinerals, ...FUTURE_MINERALS];
    }
    
    console.log(`[MineralGen] Available minerals for ${region} in ${era}:`, availableMinerals.map(m => m.metalId));
    
    let totalDeposits = 0;
    const depositsByType: Record<string, number> = {};
    
    // Iterate through all tiles
    for (let y = 0; y < tiles.length; y++) {
        for (let x = 0; x < tiles[y].length; x++) {
            const tile = tiles[y][x];
            
            // Skip water and urban tiles
            if (!tile.isLand || isUrbanBiome(tile.biome)) {
                continue;
            }
            
            // Check each available mineral
            for (const mineralData of availableMinerals) {
                const metal = METALS[mineralData.metalId];
                if (!metal) continue;
                
                // Check if this tile meets geological requirements
                if (!meetsGeologicalRequirements(tile, metal.geologicalRules)) {
                    continue;
                }
                
                // Use noise to determine if mineral spawns here
                const noiseValue = noise.noise(
                    x * 0.1 + mineralData.metalId.charCodeAt(0) * 0.1,
                    y * 0.1 + mineralData.metalId.charCodeAt(1) * 0.1
                );
                
                // Adjust spawn chance based on abundance
                const spawnThreshold = 1.0 - (mineralData.abundance * 0.05); // 5% max spawn rate
                
                if (noiseValue > spawnThreshold) {
                    // Calculate quantity based on noise and abundance
                    const quantityNoise = noise.noise(x * 0.2, y * 0.2);
                    const baseQuantity = 50 + Math.floor(quantityNoise * 200);
                    const quantity = Math.floor(baseQuantity * mineralData.abundance);
                    
                    tile.mineralDeposit = {
                        metalId: mineralData.metalId,
                        quantity: quantity
                    };
                    
                    totalDeposits++;
                    depositsByType[mineralData.metalId] = (depositsByType[mineralData.metalId] || 0) + 1;
                    break; // Only one mineral per tile
                }
            }
        }
    }
    
    console.log(`[MineralGen] Generated ${totalDeposits} mineral deposits:`);
    for (const [type, count] of Object.entries(depositsByType)) {
        console.log(`  - ${type}: ${count} deposits`);
    }
}

function meetsGeologicalRequirements(tile: Tile, rules: any): boolean {
    if (!rules) return true;
    
    // Check biome requirements
    if (rules.biomes) {
        const tileBiomeName = BiomeType[tile.biome];
        const biomeMatches = rules.biomes.some((requiredBiome: string) => {
            // Handle partial matches (e.g., MOUNTAIN matches HIGH_PEAK)
            if (requiredBiome === 'MOUNTAIN') {
                return tileBiomeName === 'HIGH_PEAK' || tileBiomeName === 'ALPINE_TUNDRA' || 
                       tile.altitude > 0.7;
            }
            if (requiredBiome === 'HILLS') {
                return tileBiomeName === 'HILLS' || tileBiomeName === 'SCRUB' || 
                       (tile.altitude > 0.4 && tile.altitude < 0.7);
            }
            if (requiredBiome === 'RIVER') {
                return tileBiomeName === 'RIVER' || tileBiomeName === 'MAJOR_RIVER' || 
                       tileBiomeName === 'RIVERBANK';
            }
            if (requiredBiome === 'WETLANDS') {
                return tileBiomeName === 'WETLANDS' || tileBiomeName === 'MANGROVE';
            }
            if (requiredBiome === 'DESERT') {
                return tileBiomeName === 'DESERT' || tileBiomeName === 'SALT_FLATS';
            }
            if (requiredBiome === 'BEACH') {
                return tile.isCoast;
            }
            if (requiredBiome === 'CLIFF') {
                return tile.altitude > 0.6 && tile.isCoast;
            }
            return tileBiomeName === requiredBiome;
        });
        
        if (!biomeMatches) return false;
    }
    
    // Check geological stress
    if (rules.minStress && tile.qualities.geologicalStress) {
        if (tile.qualities.geologicalStress < rules.minStress) return false;
    }
    
    // Check thermal activity
    if (rules.minThermal && tile.qualities.thermalActivity) {
        if (tile.qualities.thermalActivity < rules.minThermal) return false;
    }
    
    return true;
}

function isUrbanBiome(biome: BiomeType): boolean {
    return biome === BiomeType.URBAN || 
           biome === BiomeType.DENSE_CITY || 
           biome === BiomeType.LOW_DENSITY_CITY || 
           biome === BiomeType.HAMLET;
}