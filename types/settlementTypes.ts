/**
 * Settlement Types
 * Types for settlements and population centers
 */

export interface Settlement {
  id?: string;
  name: string;
  type: 'hamlet' | 'village' | 'town' | 'city' | 'metropolis' | 'capital';
  location: { x: number; y: number };
  zone?: string;
  era?: string;
  population?: number;
  culture?: string;
  importance?: 'minor' | 'moderate' | 'major' | 'critical';
  resources?: string[];
  buildings?: string[];
  ruler?: string;
}