/**
 * types/fireTypes.ts - Type definitions for the fire system
 */

/**
 * Represents an active fire on the map
 */
export interface FireState {
  x: number;
  y: number;
  intensity: FireIntensity;
  startTime: number; // Game time in minutes when fire started
  spreadAttempts: number; // Number of times this fire has attempted to spread
  burnDuration: number; // How long this fire has been burning (in game minutes)
}

export enum FireIntensity {
  SMALL = 1,
  MEDIUM = 2,
  LARGE = 3
}

/**
 * Result from attempting to start a fire
 */
export interface BurnResult {
  success: boolean;
  message: string;
  fireStarted?: FireState;
}

/**
 * Information about fire spread
 */
export interface FireSpreadEvent {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  biomeName: string;
}