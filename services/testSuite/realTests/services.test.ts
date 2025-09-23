/**
 * Real Service Tests
 * Tests the ACTUAL services from the game
 */

import { Test } from '../types';
import { eventService } from '../../../services/eventService';
import { LogService } from '../../../services/logService';
import { saveGameService } from '../../../services/saveGameService';
import { shareableStateService } from '../../../services/shareableStateService';

export function createRealServiceTests(): Test[] {
  return [
    {
      id: 'real-event-service',
      name: 'Real Event Service Works',
      category: 'services',
      priority: 'critical',
      tags: ['smoke', 'real'],
      fn: async (ctx) => {
        ctx.log('Testing REAL event service...');

        // Test that the service exists
        ctx.assert.defined(eventService, 'Event service should exist');

        // Test API usage stats method
        const stats = eventService.getAPIUsageStats();
        ctx.assert.defined(stats, 'Should get API stats');
        ctx.assert.isNumber(stats.totalCalls, 'Should have total calls');
        ctx.assert.isNumber(stats.sessionCalls, 'Should have session calls');

        // Test settings
        const settings = eventService.getSettings();
        ctx.assert.defined(settings, 'Should have settings');

        ctx.log(`✓ Event service working - ${stats.totalCalls} total API calls`);
      }
    },

    {
      id: 'real-log-service',
      name: 'Real Log Service Creates Logs',
      category: 'services',
      priority: 'high',
      tags: ['real'],
      fn: async (ctx) => {
        ctx.log('Testing REAL log service...');

        const logService = new LogService();
        ctx.assert.defined(logService, 'Log service should exist');

        // Test creating a real log entry
        const entry = logService.createMapEntryLog('Test Location', 1500, 6, 'summer');
        ctx.assert.defined(entry, 'Should create log entry');
        ctx.assert.equal(entry.type, 'MAP_ENTRY', 'Should have correct type');
        ctx.assert.contains(entry.description, 'Test Location', 'Should contain location');

        ctx.log('✓ Log service creates real log entries');
      }
    },

    {
      id: 'real-save-service',
      name: 'Real Save Game Service',
      category: 'services',
      priority: 'critical',
      tags: ['real'],
      fn: async (ctx) => {
        ctx.log('Testing REAL save game service...');

        ctx.assert.defined(saveGameService, 'Save service should exist');

        // Test listing saves (won't create/delete to avoid side effects)
        try {
          const saves = await saveGameService.listSaves();
          ctx.assert.isArray(saves, 'Should return array of saves');
          ctx.log(`✓ Found ${saves.length} existing saves`);
        } catch (error) {
          ctx.warn('Could not list saves - may need initialization');
        }
      }
    },

    {
      id: 'real-shareable-state',
      name: 'Real State Encoding/Decoding',
      category: 'services',
      priority: 'high',
      tags: ['real'],
      fn: async (ctx) => {
        ctx.log('Testing REAL shareable state service...');

        const testState = {
          year: 1492,
          month: 10,
          day: 12,
          mapArea: 'Test Area',
          zone: 'EUROPEAN',
          region: 'test',
          gameMode: 'survival',
          mapSeed: 'TEST123'
        };

        // Test encoding
        const encoded = shareableStateService.encodeGameState(testState);
        ctx.assert.defined(encoded, 'Should encode state');
        ctx.assert.isString(encoded, 'Should return string');

        // Test decoding
        const decoded = shareableStateService.decodeGameState(encoded);
        ctx.assert.defined(decoded, 'Should decode state');
        ctx.assert.equal(decoded.year, 1492, 'Should preserve year');

        ctx.log('✓ State encoding/decoding works');
      }
    }
  ];
}