/**
 * Test script for restaurantInnGenerator overlay system
 * Demonstrates the new overlay-based furniture placement
 */

import { Tile, BiomeType, OverlayObjectType } from '../../types';
import { generateRestaurantInn } from './archetypes/restaurantInnGenerator';
import { ValueNoise } from '../../utils/noise';

export function testRestaurantOverlays() {
  console.log('🍽️ Testing Restaurant/Inn Generator with Overlay System');
  
  const testConfigs = [
    {
      name: 'MENA Bazaar Restaurant',
      config: {
        culturalZone: 'MENA',
        specificYear: 1200,
        mapSize: 'medium' as const,
        hasLandscape: false
      }
    },
    {
      name: 'South Asian Dining Hall',
      config: {
        culturalZone: 'SOUTH_ASIAN',
        specificYear: 1400,
        mapSize: 'medium' as const,
        hasLandscape: false
      }
    },
    {
      name: 'East Asian Tea House',
      config: {
        culturalZone: 'EAST_ASIAN',
        specificYear: 1500,
        mapSize: 'medium' as const,
        hasLandscape: false
      }
    },
    {
      name: 'American Diner',
      config: {
        culturalZone: 'NORTH_AMERICAN',
        specificYear: 1950,
        mapSize: 'medium' as const,
        hasLandscape: false
      }
    },
    {
      name: 'Medieval European Tavern',
      config: {
        culturalZone: 'EUROPEAN',
        specificYear: 1300,
        mapSize: 'medium' as const,
        hasLandscape: false
      }
    }
  ];
  
  testConfigs.forEach(({ name, config }) => {
    console.log(`\n🏛️ Testing: ${name}`);
    
    // Create test map
    const size = { width: 16, height: 12 };
    const tiles: Tile[][] = [];
    
    for (let y = 0; y < size.height; y++) {
      tiles[y] = [];
      for (let x = 0; x < size.width; x++) {
        tiles[y][x] = {
          x,
          y,
          altitude: 0,
          biome: BiomeType.FLOOR_STONE,
          isLand: true,
          isCoast: false,
          qualities: {
            flammability: 0.1,
            biodiversity: 0.1,
            healthiness: 0.8,
            sacrality: 0.1,
            accessibility: 0.9,
            defensibility: 0.3
          },
          isBlocking: false
        };
      }
    }
    
    const noise = new ValueNoise(12345);
    
    try {
      const result = generateRestaurantInn(tiles, config, noise, size);
      
      // Count overlay objects by type
      const overlayStats: Record<string, number> = {};
      let totalOverlays = 0;
      
      for (let y = 0; y < size.height; y++) {
        for (let x = 0; x < size.width; x++) {
          const tile = result.tiles[y][x];
          if (tile.overlayObject) {
            totalOverlays++;
            const type = tile.overlayObject.type;
            overlayStats[type] = (overlayStats[type] || 0) + 1;
          }
        }
      }
      
      console.log(`   ✅ Generated successfully`);
      console.log(`   📊 Total overlays: ${totalOverlays}`);
      console.log(`   🎯 Rooms: ${result.rooms.length}`);
      console.log(`   🚪 Exit zones: ${result.exitZones.length}`);
      console.log(`   💡 Interaction zones: ${result.interactionZones.length}`);
      
      if (Object.keys(overlayStats).length > 0) {
        console.log(`   🪑 Overlay breakdown:`);
        Object.entries(overlayStats).forEach(([type, count]) => {
          console.log(`      ${type}: ${count}`);
        });
        
        // Test multi-tile tables specifically
        const multiTileTables = [
          OverlayObjectType.TABLE_LEFT,
          OverlayObjectType.TABLE_CENTER,
          OverlayObjectType.TABLE_RIGHT
        ];
        
        const tableCount = multiTileTables.reduce((sum, type) => 
          sum + (overlayStats[type] || 0), 0);
        
        if (tableCount > 0) {
          console.log(`   🍽️ Multi-tile table components: ${tableCount}`);
        }
        
        // Check for cultural-specific items
        if (config.culturalZone === 'MENA' && overlayStats[OverlayObjectType.FOUNTAIN]) {
          console.log(`   ⛲ Cultural feature: Central fountain detected`);
        }
        
        if (config.culturalZone === 'EAST_ASIAN' && overlayStats[OverlayObjectType.ALTAR]) {
          console.log(`   ⛩️ Cultural feature: Corner altar detected`);
        }
        
        if (config.culturalZone === 'NORTH_AMERICAN' && overlayStats[OverlayObjectType.KITCHEN_STOVE]) {
          console.log(`   🍳 Modern feature: Kitchen stove detected`);
        }
        
      } else {
        console.log(`   ⚠️ Warning: No overlay objects found`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
  });
  
  console.log('\n🎉 Restaurant overlay system test complete!');
}

// Test runner for console
if (typeof window === 'undefined') {
  testRestaurantOverlays();
}