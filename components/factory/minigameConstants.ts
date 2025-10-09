/**
 * components/factory/minigameConstants.ts
 * Centralized constants for factory timing minigames
 */

export enum MinigameResult {
  PERFECT = 'perfect',  // Center hit - best outcome
  GREAT = 'great',      // Within safe zone, good accuracy
  GOOD = 'good',        // Within safe zone, okay accuracy
  OKAY = 'okay',        // Just outside, minor penalty
  MISS = 'miss'         // Way off, major penalty
}

export enum MinigameDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export enum MinigameType {
  TIMING_BAR = 'timing_bar',
  RHYTHM_PULSE = 'rhythm_pulse',
  TEMPERATURE_GAUGE = 'temperature_gauge',
  QUICK_SEQUENCE = 'quick_sequence',
  PRECISION_ALIGN = 'precision_align'
}

/**
 * Centralized game constants
 */
export const MINIGAME_CONSTANTS = {
  // Animation speeds
  TIMING_BAR_SPEED: 0.8,
  TEMPERATURE_GAUGE_SPEED: 1.2,
  PRECISION_ALIGN_SPEED: 0.6,

  // Safe zone widths (percentage)
  SAFE_ZONE_WIDTH: {
    [MinigameDifficulty.EASY]: 20,
    [MinigameDifficulty.MEDIUM]: 16,
    [MinigameDifficulty.HARD]: 10
  },

  // Scoring multipliers for output
  SCORING: {
    [MinigameResult.PERFECT]: 1.4,   // +40% output
    [MinigameResult.GREAT]: 1.3,     // +30% output
    [MinigameResult.GOOD]: 1.15,     // +15% output
    [MinigameResult.OKAY]: 1.0,      // Standard output
    [MinigameResult.MISS]: 0.7       // -30% output
  },

  // Fatigue penalty on miss
  FATIGUE_PENALTY: {
    [MinigameResult.PERFECT]: 0.9,   // -10% fatigue
    [MinigameResult.GREAT]: 1.0,     // Normal fatigue
    [MinigameResult.GOOD]: 1.0,      // Normal fatigue
    [MinigameResult.OKAY]: 1.1,      // +10% fatigue
    [MinigameResult.MISS]: 1.3       // +30% fatigue
  },

  // Pulse timing intervals (ms)
  PULSE_INTERVALS: {
    [MinigameDifficulty.EASY]: 1000,
    [MinigameDifficulty.MEDIUM]: 800,
    [MinigameDifficulty.HARD]: 600
  },

  // Required successes for rhythm/sequence games
  REQUIRED_SUCCESSES: {
    [MinigameDifficulty.EASY]: 5,
    [MinigameDifficulty.MEDIUM]: 7,
    [MinigameDifficulty.HARD]: 10
  },

  // Timing windows (ms)
  TIMING_WINDOWS: {
    PERFECT: 100,    // ±100ms from center
    GREAT: 200,      // ±200ms
    GOOD: 350,       // ±350ms
    OKAY: 500        // ±500ms (beyond is MISS)
  },

  // Precision alignment tolerance (pixels)
  ALIGNMENT_TOLERANCE: {
    [MinigameDifficulty.EASY]: 8,
    [MinigameDifficulty.MEDIUM]: 5,
    [MinigameDifficulty.HARD]: 3
  },

  // Result screen display duration (ms)
  RESULT_DISPLAY_DURATION: 1500,

  // Countdown duration (ms per number)
  COUNTDOWN_DURATION: 1000
} as const;

/**
 * Visual theme for result screens
 */
export const RESULT_THEMES = {
  [MinigameResult.PERFECT]: {
    color: '#fbbf24',        // gold
    textColor: '#fef3c7',    // light gold
    bgGradient: 'from-yellow-500/30 to-amber-600/30',
    borderColor: 'border-yellow-400',
    emoji: '⭐',
    message: 'PERFECT!'
  },
  [MinigameResult.GREAT]: {
    color: '#10b981',
    textColor: '#d1fae5',
    bgGradient: 'from-green-500/30 to-emerald-600/30',
    borderColor: 'border-green-400',
    emoji: '✓',
    message: 'GREAT!'
  },
  [MinigameResult.GOOD]: {
    color: '#3b82f6',
    textColor: '#dbeafe',
    bgGradient: 'from-blue-500/30 to-blue-600/30',
    borderColor: 'border-blue-400',
    emoji: '👍',
    message: 'Good'
  },
  [MinigameResult.OKAY]: {
    color: '#f59e0b',
    textColor: '#fef3c7',
    bgGradient: 'from-amber-500/30 to-amber-600/30',
    borderColor: 'border-amber-400',
    emoji: '~',
    message: 'Okay...'
  },
  [MinigameResult.MISS]: {
    color: '#ef4444',
    textColor: '#fee2e2',
    bgGradient: 'from-red-500/30 to-red-600/30',
    borderColor: 'border-red-400',
    emoji: '✗',
    message: 'Missed!'
  }
} as const;

/**
 * Calculate result based on distance from perfect zone
 */
export function calculateResult(
  actual: number,
  target: number,
  perfect: number,
  great: number,
  good: number,
  okay: number
): MinigameResult {
  const distance = Math.abs(actual - target);

  if (distance <= perfect) return MinigameResult.PERFECT;
  if (distance <= great) return MinigameResult.GREAT;
  if (distance <= good) return MinigameResult.GOOD;
  if (distance <= okay) return MinigameResult.OKAY;
  return MinigameResult.MISS;
}

/**
 * Get scoring info for a result
 */
export function getScoringInfo(result: MinigameResult) {
  return {
    outputMultiplier: MINIGAME_CONSTANTS.SCORING[result],
    fatigueMultiplier: MINIGAME_CONSTANTS.FATIGUE_PENALTY[result],
    theme: RESULT_THEMES[result]
  };
}
