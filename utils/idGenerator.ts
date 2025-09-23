/**
 * Simple ID generation utility
 */

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 8);
}