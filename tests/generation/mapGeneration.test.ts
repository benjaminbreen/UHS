import { describe, it, expect, vi } from 'vitest';
import { proceduralGenerateMap } from '../../generation/standardMap/standardMapGenerator';
import { BiomeType, ClimateType } from '../../types';

describe('Map Generation', () => {
  it('should have BiomeType enum with expected values', () => {
    const biomes = Object.values(BiomeType);

    expect(biomes).toBeDefined();
    expect(biomes.length).toBeGreaterThan(0);

    // Check for some expected biomes
    expect(biomes).toContain('GRASSLAND');
    expect(biomes).toContain('FOREST');
    expect(biomes).toContain('DESERT');
    expect(biomes).toContain('MOUNTAIN');
  });

  it('should have ClimateType enum', () => {
    const climates = Object.values(ClimateType);

    expect(climates).toBeDefined();
    expect(climates.length).toBeGreaterThanOrEqual(3);
  });

  it('should generate a basic map with required parameters', async () => {
    // Mock console methods to suppress output during test
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const mapData = await proceduralGenerateMap({
      seed: 'TEST_SEED',
      width: 10,
      height: 10,
      archetype: 'CONTINENTAL',
      climate: ClimateType.TEMPERATE
    });

    expect(mapData).toBeDefined();
    expect(mapData.tiles).toBeDefined();
    expect(Array.isArray(mapData.tiles)).toBe(true);
    expect(mapData.tiles.length).toBeGreaterThan(0);

    // Check first tile structure
    if (mapData.tiles.length > 0) {
      const firstTile = mapData.tiles[0];
      expect(firstTile).toHaveProperty('x');
      expect(firstTile).toHaveProperty('y');
      expect(firstTile).toHaveProperty('biome');
    }

    // Restore console
    consoleSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  }, 20000); // Increase timeout for map generation
});