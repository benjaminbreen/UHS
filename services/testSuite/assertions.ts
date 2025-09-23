/**
 * Custom Assertions Library
 * Provides comprehensive assertion methods for testing
 */

import { Assert } from './types';
import { BiomeType } from '../../types';

class AssertionError extends Error {
  constructor(message: string, actual?: any, expected?: any) {
    super(message);
    this.name = 'AssertionError';
    if (actual !== undefined || expected !== undefined) {
      this.message += `\n  Expected: ${JSON.stringify(expected, null, 2)}\n  Actual: ${JSON.stringify(actual, null, 2)}`;
    }
  }
}

export function createAssertions(): Assert {
  return {
    // Basic assertions
    equal(actual: any, expected: any, message?: string) {
      if (actual != expected) {
        throw new AssertionError(
          message || `Expected values to be equal`,
          actual,
          expected
        );
      }
    },

    notEqual(actual: any, expected: any, message?: string) {
      if (actual == expected) {
        throw new AssertionError(
          message || `Expected values to not be equal`,
          actual,
          expected
        );
      }
    },

    strictEqual(actual: any, expected: any, message?: string) {
      if (actual !== expected) {
        throw new AssertionError(
          message || `Expected values to be strictly equal`,
          actual,
          expected
        );
      }
    },

    deepEqual(actual: any, expected: any, message?: string) {
      if (!deepEquals(actual, expected)) {
        throw new AssertionError(
          message || `Expected values to be deeply equal`,
          actual,
          expected
        );
      }
    },

    // Truthiness
    true(value: any, message?: string) {
      if (value !== true) {
        throw new AssertionError(
          message || `Expected value to be true`,
          value,
          true
        );
      }
    },

    false(value: any, message?: string) {
      if (value !== false) {
        throw new AssertionError(
          message || `Expected value to be false`,
          value,
          false
        );
      }
    },

    truthy(value: any, message?: string) {
      if (!value) {
        throw new AssertionError(
          message || `Expected value to be truthy`,
          value,
          'truthy value'
        );
      }
    },

    falsy(value: any, message?: string) {
      if (value) {
        throw new AssertionError(
          message || `Expected value to be falsy`,
          value,
          'falsy value'
        );
      }
    },

    // Existence
    exists(value: any, message?: string) {
      if (value == null) {
        throw new AssertionError(
          message || `Expected value to exist`,
          value,
          'defined value'
        );
      }
    },

    notExists(value: any, message?: string) {
      if (value != null) {
        throw new AssertionError(
          message || `Expected value to not exist`,
          value,
          'null or undefined'
        );
      }
    },

    defined(value: any, message?: string) {
      if (value === undefined) {
        throw new AssertionError(
          message || `Expected value to be defined`,
          value,
          'defined value'
        );
      }
    },

    undefined(value: any, message?: string) {
      if (value !== undefined) {
        throw new AssertionError(
          message || `Expected value to be undefined`,
          value,
          undefined
        );
      }
    },

    null(value: any, message?: string) {
      if (value !== null) {
        throw new AssertionError(
          message || `Expected value to be null`,
          value,
          null
        );
      }
    },

    notNull(value: any, message?: string) {
      if (value === null) {
        throw new AssertionError(
          message || `Expected value to not be null`,
          value,
          'non-null value'
        );
      }
    },

    // Type checking
    isType(value: any, type: string, message?: string) {
      const actualType = typeof value;
      if (actualType !== type) {
        throw new AssertionError(
          message || `Expected value to be of type ${type}`,
          actualType,
          type
        );
      }
    },

    isArray(value: any, message?: string) {
      if (!Array.isArray(value)) {
        throw new AssertionError(
          message || `Expected value to be an array`,
          typeof value,
          'array'
        );
      }
    },

    isObject(value: any, message?: string) {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new AssertionError(
          message || `Expected value to be an object`,
          typeof value,
          'object'
        );
      }
    },

    isString(value: any, message?: string) {
      if (typeof value !== 'string') {
        throw new AssertionError(
          message || `Expected value to be a string`,
          typeof value,
          'string'
        );
      }
    },

    isNumber(value: any, message?: string) {
      if (typeof value !== 'number' || isNaN(value)) {
        throw new AssertionError(
          message || `Expected value to be a number`,
          value,
          'number'
        );
      }
    },

    isBoolean(value: any, message?: string) {
      if (typeof value !== 'boolean') {
        throw new AssertionError(
          message || `Expected value to be a boolean`,
          typeof value,
          'boolean'
        );
      }
    },

    isFunction(value: any, message?: string) {
      if (typeof value !== 'function') {
        throw new AssertionError(
          message || `Expected value to be a function`,
          typeof value,
          'function'
        );
      }
    },

    // Comparisons
    greaterThan(actual: number, expected: number, message?: string) {
      if (actual <= expected) {
        throw new AssertionError(
          message || `Expected ${actual} to be greater than ${expected}`,
          actual,
          `> ${expected}`
        );
      }
    },

    greaterThanOrEqual(actual: number, expected: number, message?: string) {
      if (actual < expected) {
        throw new AssertionError(
          message || `Expected ${actual} to be greater than or equal to ${expected}`,
          actual,
          `>= ${expected}`
        );
      }
    },

    lessThan(actual: number, expected: number, message?: string) {
      if (actual >= expected) {
        throw new AssertionError(
          message || `Expected ${actual} to be less than ${expected}`,
          actual,
          `< ${expected}`
        );
      }
    },

    lessThanOrEqual(actual: number, expected: number, message?: string) {
      if (actual > expected) {
        throw new AssertionError(
          message || `Expected ${actual} to be less than or equal to ${expected}`,
          actual,
          `<= ${expected}`
        );
      }
    },

    between(value: number, min: number, max: number, message?: string) {
      if (value < min || value > max) {
        throw new AssertionError(
          message || `Expected ${value} to be between ${min} and ${max}`,
          value,
          `${min} <= value <= ${max}`
        );
      }
    },

    // Collections
    contains(collection: any[] | string, item: any, message?: string) {
      const contains = typeof collection === 'string'
        ? collection.includes(item)
        : collection.includes(item);

      if (!contains) {
        throw new AssertionError(
          message || `Expected collection to contain item`,
          collection,
          `collection containing ${item}`
        );
      }
    },

    notContains(collection: any[] | string, item: any, message?: string) {
      const contains = typeof collection === 'string'
        ? collection.includes(item)
        : collection.includes(item);

      if (contains) {
        throw new AssertionError(
          message || `Expected collection to not contain item`,
          collection,
          `collection not containing ${item}`
        );
      }
    },

    lengthOf(collection: any[] | string, length: number, message?: string) {
      if (collection.length !== length) {
        throw new AssertionError(
          message || `Expected collection to have length ${length}`,
          collection.length,
          length
        );
      }
    },

    empty(collection: any[] | string | object, message?: string) {
      const isEmpty = Array.isArray(collection)
        ? collection.length === 0
        : typeof collection === 'string'
        ? collection.length === 0
        : Object.keys(collection).length === 0;

      if (!isEmpty) {
        throw new AssertionError(
          message || `Expected collection to be empty`,
          collection,
          'empty collection'
        );
      }
    },

    notEmpty(collection: any[] | string | object, message?: string) {
      const isEmpty = Array.isArray(collection)
        ? collection.length === 0
        : typeof collection === 'string'
        ? collection.length === 0
        : Object.keys(collection).length === 0;

      if (isEmpty) {
        throw new AssertionError(
          message || `Expected collection to not be empty`,
          collection,
          'non-empty collection'
        );
      }
    },

    // Errors
    throws(fn: () => any, expectedError?: string | RegExp | typeof Error, message?: string) {
      let threw = false;
      let error: any;

      try {
        fn();
      } catch (e) {
        threw = true;
        error = e;
      }

      if (!threw) {
        throw new AssertionError(
          message || `Expected function to throw`,
          'no error',
          'error'
        );
      }

      if (expectedError) {
        if (typeof expectedError === 'string' && !error.message.includes(expectedError)) {
          throw new AssertionError(
            message || `Expected error message to contain "${expectedError}"`,
            error.message,
            expectedError
          );
        } else if (expectedError instanceof RegExp && !expectedError.test(error.message)) {
          throw new AssertionError(
            message || `Expected error message to match ${expectedError}`,
            error.message,
            expectedError.toString()
          );
        } else if (typeof expectedError === 'function' && !(error instanceof expectedError)) {
          throw new AssertionError(
            message || `Expected error to be instance of ${expectedError.name}`,
            error.constructor.name,
            expectedError.name
          );
        }
      }
    },

    doesNotThrow(fn: () => any, message?: string) {
      try {
        fn();
      } catch (e: any) {
        throw new AssertionError(
          message || `Expected function to not throw`,
          e.message,
          'no error'
        );
      }
    },

    async rejects(promise: Promise<any>, expectedError?: string | RegExp | typeof Error, message?: string) {
      let threw = false;
      let error: any;

      try {
        await promise;
      } catch (e) {
        threw = true;
        error = e;
      }

      if (!threw) {
        throw new AssertionError(
          message || `Expected promise to reject`,
          'resolved',
          'rejection'
        );
      }

      if (expectedError) {
        if (typeof expectedError === 'string' && !error.message.includes(expectedError)) {
          throw new AssertionError(
            message || `Expected error message to contain "${expectedError}"`,
            error.message,
            expectedError
          );
        }
      }
    },

    async doesNotReject(promise: Promise<any>, message?: string) {
      try {
        await promise;
      } catch (e: any) {
        throw new AssertionError(
          message || `Expected promise to not reject`,
          e.message,
          'resolution'
        );
      }
    },

    // Custom game-specific assertions
    validTile(tile: any, message?: string) {
      if (!tile || typeof tile !== 'object') {
        throw new AssertionError(message || 'Invalid tile object', tile, 'valid tile');
      }
      if (typeof tile.x !== 'number' || typeof tile.y !== 'number') {
        throw new AssertionError(message || 'Tile missing x/y coordinates', tile, 'tile with x,y');
      }
      if (!tile.biome) {
        throw new AssertionError(message || 'Tile missing biome', tile, 'tile with biome');
      }
    },

    validBiome(biome: string, message?: string) {
      const validBiomes = Object.values(BiomeType) as string[];
      if (!validBiomes.includes(biome)) {
        throw new AssertionError(
          message || `Invalid biome type: ${biome}`,
          biome,
          `one of: ${validBiomes.join(', ')}`
        );
      }
    },

    validNPC(npc: any, message?: string) {
      if (!npc || typeof npc !== 'object') {
        throw new AssertionError(message || 'Invalid NPC object', npc, 'valid NPC');
      }
      if (!npc.id || !npc.name) {
        throw new AssertionError(message || 'NPC missing id or name', npc, 'NPC with id and name');
      }
      if (!npc.position || typeof npc.position.x !== 'number' || typeof npc.position.y !== 'number') {
        throw new AssertionError(message || 'NPC missing valid position', npc, 'NPC with position');
      }
    },

    validItem(item: any, message?: string) {
      if (!item || typeof item !== 'object') {
        throw new AssertionError(message || 'Invalid item object', item, 'valid item');
      }
      if (!item.id || !item.name) {
        throw new AssertionError(message || 'Item missing id or name', item, 'item with id and name');
      }
      if (typeof item.value !== 'number' || item.value < 0) {
        throw new AssertionError(message || 'Item missing valid value', item, 'item with positive value');
      }
    },

    validModal(modal: any, message?: string) {
      if (!modal || typeof modal !== 'object') {
        throw new AssertionError(message || 'Invalid modal object', modal, 'valid modal');
      }
      if (typeof modal.isOpen !== 'boolean') {
        throw new AssertionError(message || 'Modal missing isOpen property', modal, 'modal with isOpen');
      }
      if (typeof modal.onClose !== 'function') {
        throw new AssertionError(message || 'Modal missing onClose function', modal, 'modal with onClose');
      }
    },

    validSaveData(data: any, message?: string) {
      if (!data || typeof data !== 'object') {
        throw new AssertionError(message || 'Invalid save data', data, 'valid save data');
      }
      if (!data.playerCharacter) {
        throw new AssertionError(message || 'Save data missing player character', data, 'save with player');
      }
      if (!data.mapSeed) {
        throw new AssertionError(message || 'Save data missing map seed', data, 'save with map seed');
      }
      if (typeof data.year !== 'number' || typeof data.month !== 'number' || typeof data.day !== 'number') {
        throw new AssertionError(message || 'Save data missing valid date', data, 'save with date');
      }
    },

    performanceWithin(metric: string, maxValue: number, message?: string) {
      // This would need to be implemented with actual performance collection
      // For now, it's a placeholder
      const actualValue = performance.now(); // Placeholder
      if (actualValue > maxValue) {
        throw new AssertionError(
          message || `Performance metric ${metric} exceeded maximum`,
          actualValue,
          `<= ${maxValue}`
        );
      }
    }
  };
}

// Deep equality helper
function deepEquals(a: any, b: any): boolean {
  if (a === b) return true;

  if (a == null || b == null) return false;

  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEquals(a[key], b[key])) return false;
  }

  return true;
}