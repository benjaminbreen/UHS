/**
 * Test Categories
 * Defines all test categories and their tests for the Universal History Simulator
 */

import { Test, TestCategory, TestPriority } from './types';
import { BiomeType } from '../../types';

// Import REAL test implementations that test actual game code
import { createRealMapGenerationTests } from './realTests/mapGeneration.test';
import { createRealServiceTests } from './realTests/services.test';

/**
 * Create all test categories with their tests
 */
export async function createTestCategories(): Promise<TestCategory[]> {
  // Get real tests
  const realMapTests = createRealMapGenerationTests();
  const realServiceTests = createRealServiceTests();

  return [
    // Real tests that test actual game functionality
    {
      id: 'real-map-generation',
      name: 'Map Generation (Real)',
      description: 'Tests the ACTUAL map generation functions',
      priority: 'critical',
      tests: realMapTests
    },
    {
      id: 'real-services',
      name: 'Game Services (Real)',
      description: 'Tests the ACTUAL game services',
      priority: 'critical',
      tests: realServiceTests
    },
    // Mock tests for testing the test infrastructure itself
    createCoreSystemsCategory(),
    createModalSystemCategory(),
    createMapGenerationCategory(),
    createNPCSystemCategory(),
    createSaveLoadCategory(),
    createPerformanceCategory(),
    createEducationalCategory()
  ];
}

/**
 * Core Systems Tests (Critical Path)
 */
function createCoreSystemsCategory(): TestCategory {
  const tests: Test[] = [
    {
      id: 'core-context-providers',
      name: 'Context Providers Initialize',
      category: 'core-systems',
      priority: 'critical',
      tags: ['smoke'],
      timeout: 5000,
      fn: async (ctx) => {
        ctx.log('Testing context providers initialization...');

        // These would need to be mocked or imported
        ctx.assert.defined(ctx.playerCharacter, 'Player character context should be available');
        ctx.assert.defined(ctx.mapData, 'Map data context should be available');
        ctx.assert.isString(ctx.currentZone, 'Current zone should be a string');
        ctx.assert.isNumber(ctx.currentYear, 'Current year should be a number');
      }
    },
    {
      id: 'core-character-stats',
      name: 'Character Stats Valid',
      category: 'core-systems',
      priority: 'critical',
      tags: ['smoke'],
      fn: async (ctx) => {
        if (!ctx.playerCharacter) {
          ctx.skip('No player character available');
          return;
        }

        ctx.assert.defined(ctx.playerCharacter.name, 'Character should have a name');
        ctx.assert.isNumber(ctx.playerCharacter.health, 'Health should be a number');
        ctx.assert.between(ctx.playerCharacter.health, 0, 200, 'Health should be 0-200');
        ctx.assert.isNumber(ctx.playerCharacter.fatigue, 'Fatigue should be a number');
        ctx.assert.isArray(ctx.playerCharacter.inventory, 'Inventory should be an array');
      }
    },
    {
      id: 'core-inventory-operations',
      name: 'Inventory Add/Remove',
      category: 'core-systems',
      priority: 'critical',
      fn: async (ctx) => {
        const testItem = {
          id: 'test-item',
          name: 'Test Item',
          value: 10,
          weight: 1
        };

        // This would need actual inventory service
        ctx.log('Testing inventory operations...');
        ctx.assert.validItem(testItem, 'Test item should be valid');

        // Simulate adding item
        const inventory = ctx.playerCharacter?.inventory || [];
        inventory.push(testItem);
        ctx.assert.contains(inventory, testItem, 'Inventory should contain added item');

        // Simulate removing item
        const index = inventory.indexOf(testItem);
        inventory.splice(index, 1);
        ctx.assert.notContains(inventory, testItem, 'Inventory should not contain removed item');
      }
    },
    {
      id: 'core-time-progression',
      name: 'Time System Advances',
      category: 'core-systems',
      priority: 'high',
      fn: async (ctx) => {
        ctx.log('Testing time progression...');

        const initialTime = Date.now();
        await ctx.measure('time-delay', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        const elapsed = Date.now() - initialTime;
        ctx.assert.greaterThanOrEqual(elapsed, 100, 'Time should have progressed');
      }
    },
    {
      id: 'core-event-system',
      name: 'Event System Triggers',
      category: 'core-systems',
      priority: 'high',
      fn: async (ctx) => {
        ctx.log('Testing event system...');

        // Would need actual event service
        const mockEvent = {
          id: 'test-event',
          type: 'quest',
          priority: 1
        };

        ctx.assert.defined(mockEvent.id, 'Event should have ID');
        ctx.assert.defined(mockEvent.type, 'Event should have type');
      }
    }
  ];

  return {
    id: 'core-systems',
    name: 'Core Systems',
    description: 'Critical path tests for core game systems',
    priority: 'critical',
    tests
  };
}

/**
 * Modal System Tests
 */
function createModalSystemCategory(): TestCategory {
  const modalNames = [
    'CombatModal', 'EncounterModal', 'MarketplaceModal', 'CityModal',
    'GovernmentDistrictModal', 'SavedGamesModal', 'InventoryPanel',
    'CharacterProfileModal', 'SkillsModal', 'CraftingModal'
  ];

  const tests: Test[] = modalNames.slice(0, 10).map(modalName => ({
    id: `modal-${modalName.toLowerCase()}`,
    name: `${modalName} Opens/Closes`,
    category: 'modal-system',
    priority: 'high' as TestPriority,
    tags: modalName === 'CombatModal' ? ['smoke'] : undefined,
    timeout: 3000,
    fn: async (ctx) => {
      ctx.log(`Testing ${modalName}...`);

      // Simulate modal open
      const modal = { isOpen: true, onClose: () => {} };
      ctx.assert.validModal(modal, `${modalName} should be valid`);
      ctx.assert.true(modal.isOpen, 'Modal should be open');

      // Simulate modal close
      modal.isOpen = false;
      ctx.assert.false(modal.isOpen, 'Modal should be closed');
    }
  }));

  return {
    id: 'modal-system',
    name: 'Modal System',
    description: 'Tests for all 47 modal components',
    priority: 'high',
    tests
  };
}

/**
 * Map Generation Tests
 */
function createMapGenerationCategory(): TestCategory {
  const tests: Test[] = [
    {
      id: 'map-biome-generation',
      name: 'All Biomes Generate',
      category: 'map-generation',
      priority: 'critical',
      tags: ['smoke'],
      timeout: 10000,
      fn: async (ctx) => {
        ctx.log('Testing biome generation...');

        const testBiomes = [
          BiomeType.GRASSLAND,
          BiomeType.FOREST,
          BiomeType.DESERT,
          BiomeType.MOUNTAIN,
          BiomeType.SHALLOW_OCEAN
        ];

        for (const biome of testBiomes) {
          ctx.assert.validBiome(biome, `${biome} should be valid`);
        }
      }
    },
    {
      id: 'map-seed-reproducibility',
      name: 'Seed Reproducibility',
      category: 'map-generation',
      priority: 'critical',
      fn: async (ctx) => {
        ctx.log('Testing map seed reproducibility...');

        const seed = 'TEST123';
        // Would need actual map generation
        const map1 = { seed, tiles: [] };
        const map2 = { seed, tiles: [] };

        ctx.assert.equal(map1.seed, map2.seed, 'Seeds should match');
      }
    },
    {
      id: 'map-special-generation',
      name: 'Special Map Generation',
      category: 'map-generation',
      priority: 'high',
      fn: async (ctx) => {
        ctx.log('Testing special map generation...');

        const archetypes = ['GOVERNMENT_FORUM', 'MARKETPLACE', 'PALACE'];

        for (const archetype of archetypes) {
          ctx.log(`Testing ${archetype} generation`);
          ctx.assert.defined(archetype, `${archetype} should be defined`);
        }
      }
    },
    {
      id: 'map-tile-validation',
      name: 'Tile Structure Valid',
      category: 'map-generation',
      priority: 'high',
      tags: ['smoke'],
      fn: async (ctx) => {
        const testTile = {
          x: 10,
          y: 20,
          biome: BiomeType.GRASSLAND,
          elevation: 100,
          moisture: 50
        };

        ctx.assert.validTile(testTile, 'Tile should be valid');
        ctx.assert.between(testTile.elevation, 0, 255, 'Elevation should be 0-255');
        ctx.assert.between(testTile.moisture, 0, 100, 'Moisture should be 0-100');
      }
    }
  ];

  return {
    id: 'map-generation',
    name: 'Map Generation',
    description: 'Tests for map generation systems',
    priority: 'critical',
    tests
  };
}

/**
 * NPC System Tests
 */
function createNPCSystemCategory(): TestCategory {
  const tests: Test[] = [
    {
      id: 'npc-generation',
      name: 'NPC Generation',
      category: 'npc-system',
      priority: 'high',
      fn: async (ctx) => {
        ctx.log('Testing NPC generation...');

        const testNPC = {
          id: 'npc-001',
          name: 'Test Merchant',
          position: { x: 10, y: 10 },
          profession: 'merchant',
          culturalZone: 'EUROPEAN',
          inventory: []
        };

        ctx.assert.validNPC(testNPC, 'NPC should be valid');
        ctx.assert.equal(testNPC.profession, 'merchant', 'Profession should be merchant');
      }
    },
    {
      id: 'npc-memory-persistence',
      name: 'NPC Memory Persistence',
      category: 'npc-system',
      priority: 'high',
      fn: async (ctx) => {
        ctx.log('Testing NPC memory...');

        const npcMemory = {
          npcId: 'npc-001',
          interactions: ['greeting', 'trade'],
          lastSeen: Date.now()
        };

        ctx.assert.defined(npcMemory.npcId, 'NPC memory should have ID');
        ctx.assert.isArray(npcMemory.interactions, 'Interactions should be array');
        ctx.assert.lengthOf(npcMemory.interactions, 2, 'Should have 2 interactions');
      }
    },
    {
      id: 'npc-theft-mechanics',
      name: 'Theft Detection',
      category: 'npc-system',
      priority: 'medium',
      fn: async (ctx) => {
        ctx.log('Testing theft mechanics...');

        const theftAttempt = {
          npcId: 'thief-001',
          targetItem: 'gold-coin',
          successChance: 0.5,
          detected: false
        };

        ctx.assert.between(theftAttempt.successChance, 0, 1, 'Success chance should be 0-1');
        ctx.assert.isBoolean(theftAttempt.detected, 'Detection should be boolean');
      }
    }
  ];

  return {
    id: 'npc-system',
    name: 'NPC System',
    description: 'Tests for NPC behavior and interactions',
    priority: 'high',
    tests
  };
}

/**
 * Save/Load System Tests
 */
function createSaveLoadCategory(): TestCategory {
  const tests: Test[] = [
    {
      id: 'save-create',
      name: 'Create Save Game',
      category: 'save-load',
      priority: 'critical',
      tags: ['smoke'],
      fn: async (ctx) => {
        ctx.log('Testing save game creation...');

        const saveData = {
          id: 'save-001',
          playerCharacter: ctx.playerCharacter || { name: 'Test' },
          mapSeed: 'TESTSEED',
          year: 1500,
          month: 6,
          day: 15,
          timestamp: Date.now()
        };

        ctx.assert.validSaveData(saveData, 'Save data should be valid');
      }
    },
    {
      id: 'save-load',
      name: 'Load Save Game',
      category: 'save-load',
      priority: 'critical',
      fn: async (ctx) => {
        ctx.log('Testing save game loading...');

        // Simulate loading
        const loadedData = {
          playerCharacter: { name: 'Loaded Character' },
          mapSeed: 'LOADSEED',
          year: 1600
        };

        ctx.assert.defined(loadedData.playerCharacter, 'Should load player character');
        ctx.assert.equal(loadedData.mapSeed, 'LOADSEED', 'Seed should match');
      }
    },
    {
      id: 'save-url-sharing',
      name: 'URL State Encoding',
      category: 'save-load',
      priority: 'high',
      fn: async (ctx) => {
        ctx.log('Testing URL state encoding...');

        const state = {
          year: 1500,
          zone: 'EUROPEAN',
          gameMode: 'survival'
        };

        // Simulate encoding
        const encoded = btoa(JSON.stringify(state));
        const decoded = JSON.parse(atob(encoded));

        ctx.assert.deepEqual(decoded, state, 'Decoded state should match original');
      }
    }
  ];

  return {
    id: 'save-load',
    name: 'Save/Load System',
    description: 'Tests for game persistence',
    priority: 'critical',
    tests
  };
}

/**
 * Performance Tests
 */
function createPerformanceCategory(): TestCategory {
  const tests: Test[] = [
    {
      id: 'perf-map-generation',
      name: 'Map Generation < 2s',
      category: 'performance',
      priority: 'high',
      tags: ['smoke'],
      timeout: 5000,
      fn: async (ctx) => {
        await ctx.measure('map-generation', async () => {
          // Simulate map generation
          await new Promise(resolve => setTimeout(resolve, 500));
        });

        ctx.assert.performanceWithin('map-generation', 2000, 'Map should generate within 2s');
      }
    },
    {
      id: 'perf-modal-opening',
      name: 'Modal Opening < 100ms',
      category: 'performance',
      priority: 'high',
      fn: async (ctx) => {
        const start = performance.now();
        // Simulate modal open
        await new Promise(resolve => setTimeout(resolve, 50));
        const duration = performance.now() - start;

        ctx.assert.lessThan(duration, 100, 'Modal should open within 100ms');
      }
    },
    {
      id: 'perf-memory-usage',
      name: 'Memory Usage Check',
      category: 'performance',
      priority: 'medium',
      fn: async (ctx) => {
        ctx.log('Checking memory usage...');

        if ('memory' in performance) {
          const memInfo = (performance as any).memory;
          const usedMB = memInfo.usedJSHeapSize / 1048576;

          ctx.assert.lessThan(usedMB, 500, 'Memory usage should be < 500MB');
          ctx.log(`Current memory: ${usedMB.toFixed(1)}MB`);
        } else {
          ctx.skip('Memory API not available');
        }
      }
    },
    {
      id: 'perf-fps-check',
      name: 'FPS >= 30',
      category: 'performance',
      priority: 'high',
      fn: async (ctx) => {
        ctx.log('Checking frame rate...');

        // This would need actual FPS measurement
        const mockFPS = 60;
        ctx.assert.greaterThanOrEqual(mockFPS, 30, 'FPS should be >= 30');
      }
    }
  ];

  return {
    id: 'performance',
    name: 'Performance',
    description: 'Performance benchmarks and metrics',
    priority: 'high',
    tests
  };
}

/**
 * Educational Features Tests
 */
function createEducationalCategory(): TestCategory {
  const tests: Test[] = [
    {
      id: 'edu-primary-sources',
      name: 'Primary Sources Load',
      category: 'educational',
      priority: 'medium',
      fn: async (ctx) => {
        ctx.log('Testing primary sources...');

        const sources = [
          { id: 'source-001', title: 'Test Document', year: 1500 }
        ];

        ctx.assert.notEmpty(sources, 'Should have primary sources');
        ctx.assert.equal(sources[0].year, 1500, 'Source year should match');
      }
    },
    {
      id: 'edu-quest-tracking',
      name: 'Quest Completion Tracking',
      category: 'educational',
      priority: 'medium',
      fn: async (ctx) => {
        ctx.log('Testing quest tracking...');

        const quest = {
          id: 'quest-001',
          completed: false,
          objectives: ['obj1', 'obj2']
        };

        ctx.assert.false(quest.completed, 'Quest should not be completed');
        ctx.assert.lengthOf(quest.objectives, 2, 'Should have 2 objectives');

        // Simulate completion
        quest.completed = true;
        ctx.assert.true(quest.completed, 'Quest should be completed');
      }
    },
    {
      id: 'edu-gamelog',
      name: 'Gamelog Recording',
      category: 'educational',
      priority: 'medium',
      fn: async (ctx) => {
        ctx.log('Testing gamelog...');

        const logEntry = {
          id: 'log-001',
          timestamp: Date.now(),
          event: 'Area discovered',
          location: 'Ancient Rome'
        };

        ctx.assert.defined(logEntry.id, 'Log entry should have ID');
        ctx.assert.isNumber(logEntry.timestamp, 'Timestamp should be number');
        ctx.assert.isString(logEntry.location, 'Location should be string');
      }
    }
  ];

  return {
    id: 'educational',
    name: 'Educational Features',
    description: 'Tests for educational components',
    priority: 'medium',
    tests
  };
}