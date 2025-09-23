import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eventService } from '../../services/eventService';

describe('Event Service', () => {
  beforeEach(() => {
    // Clear any mocks before each test
    vi.clearAllMocks();
  });

  describe('API Usage Stats', () => {
    it('should track API usage statistics', () => {
      const stats = eventService.getAPIUsageStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalCalls');
      expect(stats).toHaveProperty('sessionCalls');
      expect(typeof stats.totalCalls).toBe('number');
      expect(typeof stats.sessionCalls).toBe('number');
    });
  });

  describe('Settings', () => {
    it('should have default settings', () => {
      const settings = eventService.getSettings();

      expect(settings).toBeDefined();
      expect(settings).toHaveProperty('eventFrequency');
      expect(settings).toHaveProperty('llmEnabled');
    });

    it('should allow updating settings', () => {
      const originalSettings = eventService.getSettings();

      eventService.updateSettings({ llmEnabled: false });
      const updatedSettings = eventService.getSettings();

      expect(updatedSettings.llmEnabled).toBe(false);

      // Restore original settings
      eventService.updateSettings(originalSettings);
    });
  });
});