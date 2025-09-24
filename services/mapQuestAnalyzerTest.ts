/**
 * Map Quest Analyzer Test Utility
 * Test the map analysis system with various scenarios
 */

import { MapQuestAnalyzer, QuestLocation } from './mapQuestAnalyzer';
import { MapData, BiomeType } from '../types';

class MapQuestAnalyzerTest {

  /**
   * Test the analyzer with a mock map
   */
  testWithMockMap(): void {
    console.log('[MapQuestAnalyzerTest] Testing with mock map...');

    const analyzer = new MapQuestAnalyzer();
    const mockMap = this.createMockMap();
    const playerLocation = { x: 50, y: 50 }; // Center of 100x100 map

    const locations = analyzer.extractQuestLocations(mockMap, playerLocation);

    console.log('[MapQuestAnalyzerTest] Results:');
    console.log('- Total locations found:', locations.length);
    console.log('- Location summary:', analyzer.getLocationSummary(locations));

    locations.forEach((loc, index) => {
      console.log(`${index + 1}. ${loc.type} at (${loc.coordinates.x}, ${loc.coordinates.y}) - ${loc.description}`);
      console.log(`   Distance: ${loc.distance.toFixed(1)} tiles, Suitable for: ${loc.suitable_for.join(', ')}`);
    });

    // Test prompt formatting
    const promptText = analyzer.formatLocationsForPrompt(locations);
    console.log('\n[MapQuestAnalyzerTest] Formatted for LLM prompt:');
    console.log(promptText);
  }

  /**
   * Test location finding utilities
   */
  testLocationFinding(): void {
    console.log('\n[MapQuestAnalyzerTest] Testing location finding utilities...');

    const analyzer = new MapQuestAnalyzer();
    const mockMap = this.createMockMap();
    const playerLocation = { x: 50, y: 50 };

    const locations = analyzer.extractQuestLocations(mockMap, playerLocation);

    // Test finding specific location types
    const marketplace = analyzer.findNearestLocationType(locations, 'marketplace');
    const farm = analyzer.findNearestLocationType(locations, 'farm');
    const temple = analyzer.findNearestLocationType(locations, 'temple');

    console.log('Nearest marketplace:', marketplace ? `(${marketplace.coordinates.x}, ${marketplace.coordinates.y})` : 'none found');
    console.log('Nearest farm:', farm ? `(${farm.coordinates.x}, ${farm.coordinates.y})` : 'none found');
    console.log('Nearest temple:', temple ? `(${temple.coordinates.x}, ${temple.coordinates.y})` : 'none found');
  }

  /**
   * Test with different player positions
   */
  testDifferentPlayerPositions(): void {
    console.log('\n[MapQuestAnalyzerTest] Testing different player positions...');

    const analyzer = new MapQuestAnalyzer();
    const mockMap = this.createMockMap();

    const positions = [
      { x: 10, y: 10, desc: 'northwest corner' },
      { x: 90, y: 90, desc: 'southeast corner' },
      { x: 50, y: 20, desc: 'north center' },
      { x: 50, y: 80, desc: 'south center' }
    ];

    positions.forEach(pos => {
      const locations = analyzer.extractQuestLocations(mockMap, pos);
      console.log(`From ${pos.desc} (${pos.x}, ${pos.y}): found ${locations.length} locations`);

      if (locations.length > 0) {
        const nearest = locations[0];
        console.log(`  Nearest: ${nearest.type} at (${nearest.coordinates.x}, ${nearest.coordinates.y}) - ${nearest.distance.toFixed(1)} tiles`);
      }
    });
  }

  /**
   * Create a mock map with various POI types for testing
   */
  private createMockMap(): MapData {
    const MAP_SIZE = 100;
    const tiles = Array(MAP_SIZE).fill(null).map(() =>
      Array(MAP_SIZE).fill(null).map(() => ({
        biome: BiomeType.GRASSLAND,
        isLand: true,
        altitude: 0.3
      }))
    );

    // Add various POI types at different locations
    const pois = [
      { x: 30, y: 30, biome: BiomeType.MARKETPLACE },
      { x: 70, y: 40, biome: BiomeType.FARMLAND },
      { x: 60, y: 60, biome: BiomeType.HOLY_SITE },
      { x: 20, y: 70, biome: BiomeType.RUINS },
      { x: 80, y: 20, biome: BiomeType.PALACE },
      { x: 40, y: 80, biome: BiomeType.CITY_CENTER },
      { x: 25, y: 25, biome: BiomeType.DENSE_CITY },
      { x: 75, y: 75, biome: BiomeType.LOW_DENSITY_CITY },
      { x: 65, y: 35, biome: BiomeType.GOVERNMENT_DISTRICT },
      { x: 15, y: 85, biome: BiomeType.HARBOR_DISTRICT },
      { x: 85, y: 15, biome: BiomeType.INDUSTRIAL_DISTRICT },
      // Add some very close ones that should be filtered out
      { x: 49, y: 49, biome: BiomeType.MARKETPLACE },
      { x: 51, y: 51, biome: BiomeType.FARMLAND },
      // Add some very far ones that should be filtered out
      { x: 5, y: 5, biome: BiomeType.PALACE },
      { x: 95, y: 95, biome: BiomeType.HOLY_SITE }
    ];

    pois.forEach(poi => {
      if (poi.x < MAP_SIZE && poi.y < MAP_SIZE) {
        tiles[poi.y][poi.x].biome = poi.biome;
      }
    });

    return {
      tiles,
      seed: 'test-map',
      area: 'Test Area',
      climate: 'TEMPERATE' as any,
      localArea: 'Test Region'
    } as MapData;
  }
}

// Export for testing in dev tools
export const mapQuestAnalyzerTest = new MapQuestAnalyzerTest();

// Auto-run test if in development mode
if (typeof window !== 'undefined' && (window as any).location?.hostname === 'localhost') {
  console.log('[MapQuestAnalyzerTest] Development mode detected, running tests...');
  // Delay to ensure proper loading
  setTimeout(() => {
    try {
      mapQuestAnalyzerTest.testWithMockMap();
      mapQuestAnalyzerTest.testLocationFinding();
      mapQuestAnalyzerTest.testDifferentPlayerPositions();
    } catch (error) {
      console.error('[MapQuestAnalyzerTest] Test error:', error);
    }
  }, 1000);
}