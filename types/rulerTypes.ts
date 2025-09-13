/**
 * Ruler Types
 * Types for rulers and leadership entities
 */

export interface Ruler {
  id?: string;
  name: string;
  title?: string;
  dynasty?: string;
  faction?: string;
  zone?: string;
  era?: string;
  location?: { x: number; y: number };
  personality?: string[];
  policies?: string[];
  relationships?: Record<string, string>;
}