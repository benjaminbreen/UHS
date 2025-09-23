import { describe, it, expect } from 'vitest';

describe('Test Environment Smoke Test', () => {
  it('basic math works', () => {
    expect(2 + 2).toBe(4);
  });

  it('can create DOM elements', () => {
    const div = document.createElement('div');
    expect(div.tagName).toBe('DIV');
  });

  it('localStorage is mocked', () => {
    expect(localStorage).toBeDefined();
    expect(typeof localStorage.setItem).toBe('function');
  });
});