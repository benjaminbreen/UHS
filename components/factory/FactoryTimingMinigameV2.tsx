/**
 * components/factory/FactoryTimingMinigameV2.tsx
 * REFACTORED: Fully integrated with graded scoring, result screen, shared hooks
 * Responsive, performant, polished
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FactoryTask } from './FactoryTaskCard';
import {
  MinigameResult,
  MinigameDifficulty,
  MinigameType,
  MINIGAME_CONSTANTS,
  calculateResult,
  RESULT_THEMES
} from './minigameConstants';
import {
  useMinigameTimer,
  useMinigameKeyboard,
  useOscillator
} from './minigameHooks';
import MinigameResultScreen from './MinigameResultScreen';
import { gameSounds } from '../../services/gameSoundsService';

type MinigameConfig = {
  type: MinigameType;
  duration: number;
  difficulty: MinigameDifficulty;
  theme: {
    color: string;
    icon: string;
    instruction: string;
  };
};

interface FactoryTimingMinigameV2Props {
  task: FactoryTask;
  factoryTypeId: string;
  onComplete: (result: MinigameResult) => void;
  // Phase 1 enhancements
  era?: string;
  culturalZone?: string;
  playerDexterity?: number;
  playerFatigue?: number;
}

// Map factory tasks to minigame configurations
const MINIGAME_CONFIGS: Record<string, MinigameConfig> = {
  'operate_loom': {
    type: MinigameType.RHYTHM_PULSE,
    duration: 6000,
    difficulty: MinigameDifficulty.MEDIUM,
    theme: { color: '#8b5cf6', icon: '🧵', instruction: 'Click in sync with the shuttle!' }
  },
  'thread_bobbin': {
    type: MinigameType.TIMING_BAR,
    duration: 5000,
    difficulty: MinigameDifficulty.EASY,
    theme: { color: '#06b6d4', icon: '🪡', instruction: 'Click when the thread aligns!' }
  },
  'repair_thread': {
    type: MinigameType.QUICK_SEQUENCE,
    duration: 4000,
    difficulty: MinigameDifficulty.HARD,
    theme: { color: '#ef4444', icon: '🔗', instruction: 'Quick! Press SPACE at each flash!' }
  },
  'pour_ladle': {
    type: MinigameType.TEMPERATURE_GAUGE,
    duration: 7000,
    difficulty: MinigameDifficulty.HARD,
    theme: { color: '#f97316', icon: '🥄', instruction: 'Stop the gauge in the safe zone!' }
  },
  'move_ingots': {
    type: MinigameType.QUICK_SEQUENCE,
    duration: 5000,
    difficulty: MinigameDifficulty.MEDIUM,
    theme: { color: '#f59e0b', icon: '📦', instruction: 'Lift at each pulse - SPACE!' }
  },
  'cut_cane': {
    type: MinigameType.RHYTHM_PULSE,
    duration: 6000,
    difficulty: MinigameDifficulty.MEDIUM,
    theme: { color: '#10b981', icon: '🌾', instruction: 'Swing in rhythm with the cuts!' }
  },
  'pick_cotton': {
    type: MinigameType.TIMING_BAR,
    duration: 5000,
    difficulty: MinigameDifficulty.EASY,
    theme: { color: '#f0f0f0', icon: '☁️', instruction: 'Pick when hands align with bolls!' }
  },
  'rivet_plates': {
    type: MinigameType.RHYTHM_PULSE,
    duration: 6000,
    difficulty: MinigameDifficulty.HARD,
    theme: { color: '#6366f1', icon: '🔨', instruction: 'Hammer in perfect rhythm!' }
  },
  'assemble_boiler': {
    type: MinigameType.PRECISION_ALIGN,
    duration: 8000,
    difficulty: MinigameDifficulty.HARD,
    theme: { color: '#8b5cf6', icon: '⚙️', instruction: 'Click when parts align!' }
  },
  'install_engine': {
    type: MinigameType.PRECISION_ALIGN,
    duration: 7000,
    difficulty: MinigameDifficulty.MEDIUM,
    theme: { color: '#3b82f6', icon: '🔧', instruction: 'Lower engine when aligned!' }
  },
  'solder_boards': {
    type: MinigameType.TIMING_BAR,
    duration: 6000,
    difficulty: MinigameDifficulty.HARD,
    theme: { color: '#14b8a6', icon: '🔌', instruction: 'Solder when iron is at perfect temp!' }
  }
};

export const FactoryTimingMinigameV2: React.FC<FactoryTimingMinigameV2Props> = ({
  task,
  factoryTypeId,
  onComplete,
  era,
  culturalZone,
  playerDexterity = 5, // Default average (1-10 scale)
  playerFatigue = 0 // 0-100 scale
}) => {
  const baseConfig = MINIGAME_CONFIGS[task.id] || {
    type: MinigameType.TIMING_BAR,
    duration: 5000,
    difficulty: MinigameDifficulty.MEDIUM,
    theme: { color: '#6366f1', icon: '⚙️', instruction: 'Click at the right moment!' }
  };

  // Adjust difficulty based on player stats
  const config = useMemo(() => {
    // Dexterity affects safe zone width (higher dexterity = easier)
    // Fatigue affects overall difficulty (higher fatigue = harder)

    // Dexterity modifier: 1-10 scale
    // 1-3 = hard, 4-6 = medium, 7-10 = easy
    const dexterityBonus = (playerDexterity - 5) / 10; // -0.4 to +0.5

    // Fatigue penalty: 0-100 scale
    // 0-30 = no penalty, 31-60 = medium penalty, 61+ = high penalty
    const fatiguePenalty = playerFatigue > 60 ? 0.3 : playerFatigue > 30 ? 0.15 : 0;

    // Calculate adjusted difficulty
    const difficultyModifier = dexterityBonus - fatiguePenalty;

    let adjustedDifficulty = baseConfig.difficulty;
    if (difficultyModifier >= 0.2 && baseConfig.difficulty === MinigameDifficulty.HARD) {
      adjustedDifficulty = MinigameDifficulty.MEDIUM;
    } else if (difficultyModifier >= 0.2 && baseConfig.difficulty === MinigameDifficulty.MEDIUM) {
      adjustedDifficulty = MinigameDifficulty.EASY;
    } else if (difficultyModifier <= -0.2 && baseConfig.difficulty === MinigameDifficulty.EASY) {
      adjustedDifficulty = MinigameDifficulty.MEDIUM;
    } else if (difficultyModifier <= -0.2 && baseConfig.difficulty === MinigameDifficulty.MEDIUM) {
      adjustedDifficulty = MinigameDifficulty.HARD;
    }

    return { ...baseConfig, difficulty: adjustedDifficulty };
  }, [baseConfig, playerDexterity, playerFatigue]);

  const [gameState, setGameState] = useState<'countdown' | 'playing' | 'result'>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState<MinigameResult | null>(null);

  // Countdown before game starts
  useEffect(() => {
    if (gameState === 'countdown' && countdown > 0) {
      // Play countdown tick sound
      gameSounds.playFactoryClickSound();
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'countdown' && countdown === 0) {
      setGameState('playing');
    }
  }, [countdown, gameState]);

  // Handle ESC key to skip
  const handleSkip = useCallback(() => {
    if (gameState === 'playing') {
      // Skip with OKAY result (standard output)
      setResult(MinigameResult.OKAY);
      setGameState('result');
    }
  }, [gameState]);

  useMinigameKeyboard(() => {}, handleSkip, gameState === 'playing');

  // Handle minigame completion
  const handleComplete = useCallback((calculatedResult: MinigameResult) => {
    setResult(calculatedResult);
    setGameState('result');
    // Play result sound
    gameSounds.playFactoryResultSound(calculatedResult);
  }, []);

  // Render appropriate minigame
  const renderMinigame = () => {
    if (gameState === 'countdown') {
      return (
        <div className="flex items-center justify-center h-full">
          <div
            className="text-6xl sm:text-7xl md:text-9xl font-bold animate-bounce"
            style={{ color: config.theme.color }}
          >
            {countdown}
          </div>
        </div>
      );
    }

    if (gameState === 'result' && result) {
      return (
        <MinigameResultScreen
          result={result}
          taskName={task.name}
          themeColor={config.theme.color}
          onDismiss={() => onComplete(result)}
        />
      );
    }

    // Render specific minigame type
    switch (config.type) {
      case MinigameType.TIMING_BAR:
        return <TimingBarGame config={config} onComplete={handleComplete} />;
      case MinigameType.RHYTHM_PULSE:
        return <RhythmPulseGame config={config} onComplete={handleComplete} />;
      case MinigameType.TEMPERATURE_GAUGE:
        return <TemperatureGaugeGame config={config} onComplete={handleComplete} />;
      case MinigameType.QUICK_SEQUENCE:
        return <QuickSequenceGame config={config} onComplete={handleComplete} />;
      case MinigameType.PRECISION_ALIGN:
        return <PrecisionAlignGame config={config} onComplete={handleComplete} />;
      default:
        return <TimingBarGame config={config} onComplete={handleComplete} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-xs sm:max-w-2xl md:max-w-3xl h-64 sm:h-80 md:h-96 rounded-2xl border-4 shadow-2xl overflow-hidden"
        style={{ borderColor: config.theme.color, backgroundColor: '#1e293b' }}
      >
        {/* Header */}
        {gameState !== 'result' && (
          <div
            className="absolute top-0 left-0 right-0 px-4 sm:px-6 py-3 sm:py-4 text-center border-b-2 z-10"
            style={{ borderColor: config.theme.color + '40', backgroundColor: config.theme.color + '20' }}
          >
            <div className="text-2xl sm:text-3xl md:text-4xl mb-1">{config.theme.icon}</div>
            <div className="text-sm sm:text-lg md:text-xl font-bold text-white">{task.name}</div>
            <div className="text-xs sm:text-sm text-slate-300 mt-1">{config.theme.instruction}</div>
          </div>
        )}

        {/* Progress Timer Bar */}
        {gameState === 'playing' && (
          <ProgressTimer duration={config.duration} color={config.theme.color} />
        )}

        {/* Game Area */}
        <div className={`absolute inset-0 ${gameState !== 'result' ? 'mt-20 sm:mt-24 md:mt-28' : ''}`}>
          {renderMinigame()}
        </div>

        {/* ESC hint */}
        {gameState === 'playing' && (
          <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-slate-400">
            Press ESC to skip (standard output)
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// PROGRESS TIMER BAR
// ============================================================================
const ProgressTimer: React.FC<{ duration: number; color: string }> = ({ duration, color }) => {
  const { progress } = useMinigameTimer(duration, () => {});

  return (
    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900 z-20">
      <div
        className="h-full transition-all duration-100"
        style={{
          width: `${100 - progress}%`,
          backgroundColor: color
        }}
      />
    </div>
  );
};

// ============================================================================
// TIMING BAR MINIGAME (Refactored)
// ============================================================================
const TimingBarGame: React.FC<{
  config: MinigameConfig;
  onComplete: (result: MinigameResult) => void;
}> = ({ config, onComplete }) => {
  const [clicked, setClicked] = useState(false);
  const { value: position } = useOscillator(0, 100, MINIGAME_CONSTANTS.TIMING_BAR_SPEED);

  // Safe zone width from constants
  const safeZoneWidth = MINIGAME_CONSTANTS.SAFE_ZONE_WIDTH[config.difficulty];
  const safeZone = useMemo(() => ({
    start: 50 - safeZoneWidth / 2,
    end: 50 + safeZoneWidth / 2
  }), [safeZoneWidth]);

  // Timer to auto-fail
  const { elapsed } = useMinigameTimer(config.duration, () => {
    if (!clicked) handleClick();
  });

  const handleClick = useCallback(() => {
    if (clicked) return;
    setClicked(true);

    // Play click sound
    gameSounds.playFactoryClickSound();

    // Calculate graded result based on distance from center (50)
    const distance = Math.abs(position - 50);
    const result = calculateResult(
      distance,
      0, // target is 0 distance
      safeZoneWidth * 0.2, // PERFECT = within 20% of zone
      safeZoneWidth * 0.4, // GREAT = within 40%
      safeZoneWidth * 0.5, // GOOD = within 50%
      safeZoneWidth * 0.7  // OKAY = within 70%
    );

    onComplete(result);
  }, [clicked, position, safeZoneWidth, onComplete]);

  useMinigameKeyboard(handleClick);

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 sm:px-8 md:px-12">
      {/* Main bar */}
      <div className="relative w-full h-16 sm:h-20 bg-slate-800 rounded-full border-4 border-slate-600 overflow-hidden shadow-inner">
        {/* Safe zone */}
        <div
          className="absolute h-full opacity-40 animate-pulse"
          style={{
            left: `${safeZone.start}%`,
            width: `${safeZoneWidth}%`,
            backgroundColor: config.theme.color
          }}
        />

        {/* Moving indicator */}
        <div
          className="absolute top-0 w-2 h-full transition-all duration-100 shadow-lg"
          style={{
            left: `${position}%`,
            backgroundColor: config.theme.color,
            boxShadow: `0 0 20px ${config.theme.color}`
          }}
        />
      </div>

      {/* Click button */}
      <button
        onClick={handleClick}
        disabled={clicked}
        className="mt-6 sm:mt-8 px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-2xl font-bold text-white rounded-xl shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95 min-h-12"
        style={{ backgroundColor: config.theme.color }}
      >
        CLICK NOW! (SPACE)
      </button>

      <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-400">
        Click when the line is in the highlighted zone
      </div>
    </div>
  );
};

// ============================================================================
// RHYTHM PULSE MINIGAME (Refactored - Fixed Memory Leak)
// ============================================================================
const RhythmPulseGame: React.FC<{
  config: MinigameConfig;
  onComplete: (result: MinigameResult) => void;
}> = ({ config, onComplete }) => {
  const [score, setScore] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [lastPulseTime, setLastPulseTime] = useState(0); // Fixed: Single timestamp instead of array
  const required = MINIGAME_CONSTANTS.REQUIRED_SUCCESSES[config.difficulty];
  const pulseInterval = MINIGAME_CONSTANTS.PULSE_INTERVALS[config.difficulty];

  // Timer
  const { elapsed } = useMinigameTimer(config.duration, () => {
    // Calculate result based on score/required ratio
    const ratio = score / required;
    let result: MinigameResult;
    if (ratio >= 0.9) result = MinigameResult.PERFECT;
    else if (ratio >= 0.75) result = MinigameResult.GREAT;
    else if (ratio >= 0.6) result = MinigameResult.GOOD;
    else if (ratio >= 0.4) result = MinigameResult.OKAY;
    else result = MinigameResult.MISS;

    onComplete(result);
  });

  // Generate pulses
  useEffect(() => {
    const interval = setInterval(() => {
      setIsActive(true);
      setLastPulseTime(Date.now());
      // Play pulse sound
      gameSounds.playFactoryPulseSound();
      setTimeout(() => setIsActive(false), pulseInterval / 2);
    }, pulseInterval);

    return () => clearInterval(interval);
  }, [pulseInterval]);

  const handleClick = useCallback(() => {
    // Play click sound
    gameSounds.playFactoryClickSound();

    const timeSinceLastPulse = Date.now() - lastPulseTime;
    if (timeSinceLastPulse < pulseInterval / 2) {
      setScore(prev => prev + 1);
    }
  }, [lastPulseTime, pulseInterval]);

  useMinigameKeyboard(handleClick);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Pulse circle */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 mb-4 sm:mb-8">
        <div
          className={`absolute inset-0 rounded-full border-8 transition-all duration-300 ${
            isActive ? 'scale-110 opacity-100' : 'scale-100 opacity-40'
          }`}
          style={{
            borderColor: config.theme.color,
            backgroundColor: isActive ? `${config.theme.color}40` : 'transparent',
            boxShadow: isActive ? `0 0 60px ${config.theme.color}` : 'none'
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-4xl sm:text-5xl md:text-6xl">
          {config.theme.icon}
        </div>
      </div>

      {/* Score */}
      <div className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
        {score} / {required}
      </div>

      {/* Click button */}
      <button
        onClick={handleClick}
        className="px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-2xl font-bold text-white rounded-xl shadow-xl transition-all hover:scale-110 active:scale-95 min-h-12"
        style={{ backgroundColor: config.theme.color }}
      >
        CLICK! (SPACE)
      </button>

      <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-400">
        Click in sync with the pulses
      </div>
    </div>
  );
};

// ============================================================================
// TEMPERATURE GAUGE MINIGAME (Foundry/Heat Control)
// ============================================================================
const TemperatureGaugeGame: React.FC<{
  config: MinigameConfig;
  onComplete: (result: MinigameResult) => void;
}> = ({ config, onComplete }) => {
  const [temperature, setTemperature] = useState(0);
  const [clicked, setClicked] = useState(false);
  const [heatDirection, setHeatDirection] = useState<'heating' | 'cooling'>('heating');

  // Memoize bubble positions (fix performance bug)
  const bubblePositions = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => ({
      left: 20 + i * 15,
      bottomOffset: Math.random() * 20 - 10, // Random offset from -10 to +10
      animationDelay: i * 0.2
    }));
  }, []);

  // Safe zone (60-80% is perfect temperature range)
  const safeZoneStart = 60;
  const safeZoneEnd = 80;
  const optimalTemp = 70;

  // Timer
  const { elapsed } = useMinigameTimer(config.duration, () => {
    if (!clicked) handleClick();
  });

  // Simulate temperature rising/falling with momentum
  useEffect(() => {
    const interval = setInterval(() => {
      setTemperature(prev => {
        // Heating phase (0-85%)
        if (heatDirection === 'heating') {
          const newTemp = prev + (Math.random() * 2 + 1.5); // 1.5-3.5% per tick
          if (newTemp >= 85) {
            setHeatDirection('cooling');
            return newTemp;
          }
          return Math.min(newTemp, 100);
        }
        // Cooling phase (85-0%)
        else {
          const newTemp = prev - (Math.random() * 2 + 1.2); // 1.2-3.2% per tick
          if (newTemp <= 15) {
            setHeatDirection('heating');
            return newTemp;
          }
          return Math.max(newTemp, 0);
        }
      });
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [heatDirection]);

  const handleClick = useCallback(() => {
    if (clicked) return;
    setClicked(true);

    // Play click sound
    gameSounds.playFactoryClickSound();

    // Calculate result based on temperature
    const distance = Math.abs(temperature - optimalTemp);
    const result = calculateResult(
      distance,
      0,    // target
      3,    // PERFECT = within 3% of optimal (67-73)
      7,    // GREAT = within 7% (63-77)
      10,   // GOOD = within 10% (60-80 = safe zone)
      15    // OKAY = within 15%
    );

    onComplete(result);
  }, [clicked, temperature, onComplete]);

  useMinigameKeyboard(handleClick);

  // Get temperature color
  const getTempColor = () => {
    if (temperature < 30) return '#3b82f6'; // Blue (cold)
    if (temperature < 50) return '#06b6d4'; // Cyan (warm)
    if (temperature < 60) return '#f59e0b'; // Amber (hot)
    if (temperature < 70) return '#f97316'; // Orange (very hot)
    if (temperature < 85) return '#ef4444'; // Red (danger hot)
    return '#dc2626'; // Dark red (extreme)
  };

  // Check if in safe zone
  const inSafeZone = temperature >= safeZoneStart && temperature <= safeZoneEnd;

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 sm:px-8 md:px-12">
      {/* Temperature Gauge */}
      <div className="relative w-full max-w-md mb-6 sm:mb-8">
        {/* Thermometer visual */}
        <div className="relative h-64 sm:h-72 w-24 sm:w-32 mx-auto">
          {/* Outer glass tube */}
          <div className="absolute inset-x-4 sm:inset-x-6 top-4 bottom-16 bg-slate-800/50 rounded-full border-4 border-slate-600 overflow-hidden">
            {/* Safe zone indicator */}
            <div
              className="absolute inset-x-0 bg-green-500/20 border-y-2 border-green-500/50"
              style={{
                bottom: `${safeZoneStart}%`,
                height: `${safeZoneEnd - safeZoneStart}%`
              }}
            />

            {/* Mercury/liquid column */}
            <div
              className="absolute inset-x-0 bottom-0 transition-all duration-100"
              style={{
                height: `${temperature}%`,
                backgroundColor: getTempColor(),
                boxShadow: `0 0 30px ${getTempColor()}, inset 0 0 20px rgba(255,255,255,0.3)`
              }}
            />

            {/* Bubbling effect when hot */}
            {temperature > 60 && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {bubblePositions.map((bubble, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-white rounded-full opacity-60 animate-ping"
                    style={{
                      left: `${bubble.left}%`,
                      bottom: `${temperature + bubble.bottomOffset}%`,
                      animationDelay: `${bubble.animationDelay}s`,
                      animationDuration: '1s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bulb at bottom */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-16 sm:h-20 rounded-full border-4 border-slate-600 transition-all duration-300"
            style={{
              backgroundColor: getTempColor(),
              boxShadow: `0 0 40px ${getTempColor()}`
            }}
          />

          {/* Temperature icon in bulb */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-3xl sm:text-4xl">
            {temperature > 70 ? '🔥' : temperature > 40 ? '♨️' : '❄️'}
          </div>
        </div>

        {/* Temperature readout */}
        <div className="text-center mt-4">
          <div
            className="text-4xl sm:text-5xl font-bold mb-2"
            style={{ color: getTempColor() }}
          >
            {temperature.toFixed(0)}°C
          </div>
          <div className={`text-sm sm:text-base font-bold ${inSafeZone ? 'text-green-400' : 'text-amber-400'}`}>
            {inSafeZone ? '✓ SAFE ZONE' : heatDirection === 'heating' ? '↑ HEATING' : '↓ COOLING'}
          </div>
        </div>
      </div>

      {/* Click button */}
      <button
        onClick={handleClick}
        disabled={clicked}
        className="px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-2xl font-bold text-white rounded-xl shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95 min-h-12"
        style={{ backgroundColor: config.theme.color }}
      >
        POUR NOW! (SPACE)
      </button>

      <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-400 text-center">
        Stop when temperature is in the green zone (60-80°C)
      </div>
    </div>
  );
};

// ============================================================================
// QUICK SEQUENCE MINIGAME (Rapid Sequential Actions)
// ============================================================================
const QuickSequenceGame: React.FC<{
  config: MinigameConfig;
  onComplete: (result: MinigameResult) => void;
}> = ({ config, onComplete }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [flashingIndex, setFlashingIndex] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const lastFlashTimeRef = useRef<number>(0); // Track actual flash timestamp

  const required = MINIGAME_CONSTANTS.REQUIRED_SUCCESSES[config.difficulty];
  const sequenceInterval = config.difficulty === MinigameDifficulty.HARD ? 800 :
                          config.difficulty === MinigameDifficulty.MEDIUM ? 1000 : 1200;

  // Generate random sequence of 5 positions
  const positions = useMemo(() => [0, 1, 2, 3, 4], []);

  // Timer
  const { elapsed } = useMinigameTimer(config.duration, () => {
    // Calculate result based on score
    const ratio = score / required;
    let result: MinigameResult;
    if (ratio >= 0.9 && missed === 0) result = MinigameResult.PERFECT;
    else if (ratio >= 0.8) result = MinigameResult.GREAT;
    else if (ratio >= 0.6) result = MinigameResult.GOOD;
    else if (ratio >= 0.4) result = MinigameResult.OKAY;
    else result = MinigameResult.MISS;

    onComplete(result);
  });

  // Generate sequence
  useEffect(() => {
    if (!gameStarted) {
      setGameStarted(true);
      return;
    }

    const interval = setInterval(() => {
      // Pick random position
      const nextPos = Math.floor(Math.random() * positions.length);
      setSequence(prev => [...prev, nextPos]);
      setFlashingIndex(nextPos);

      // Record flash timestamp for timing validation
      lastFlashTimeRef.current = Date.now();

      // Play pulse sound
      gameSounds.playFactoryPulseSound();

      // Clear flash after half interval
      setTimeout(() => setFlashingIndex(null), sequenceInterval / 2);
    }, sequenceInterval);

    return () => clearInterval(interval);
  }, [gameStarted, sequenceInterval, positions.length]);

  const handleClick = useCallback(() => {
    // Play click sound
    gameSounds.playFactoryClickSound();

    if (currentIndex >= sequence.length) return;

    const expectedPos = sequence[currentIndex];
    const timeSinceFlash = Date.now() - lastFlashTimeRef.current; // Fixed: Use actual flash timestamp

    // Check if clicked during the active window (within sequence interval)
    if (flashingIndex === expectedPos || timeSinceFlash < sequenceInterval * 1.5) {
      setScore(prev => prev + 1);
      setCurrentIndex(prev => prev + 1);
    } else {
      setMissed(prev => prev + 1);
    }
  }, [currentIndex, sequence, flashingIndex, sequenceInterval]);

  useMinigameKeyboard(handleClick);

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      {/* Score display */}
      <div className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
        {score} / {required}
        {missed > 0 && <span className="text-red-400 ml-4">({missed} missed)</span>}
      </div>

      {/* Sequence indicators - 5 stations in a row */}
      <div className="grid grid-cols-5 gap-2 sm:gap-4 mb-6 sm:mb-8 w-full max-w-2xl">
        {positions.map((pos) => {
          const isFlashing = flashingIndex === pos;
          const isCompleted = sequence[currentIndex - 1] === pos && currentIndex > 0;

          return (
            <div
              key={pos}
              className={`relative h-20 sm:h-24 rounded-xl border-4 transition-all duration-100 ${
                isFlashing
                  ? 'scale-110 animate-pulse'
                  : isCompleted
                    ? 'scale-95'
                    : 'scale-100'
              }`}
              style={{
                backgroundColor: isFlashing ? config.theme.color : '#1e293b',
                borderColor: isFlashing ? config.theme.color : '#475569',
                boxShadow: isFlashing ? `0 0 40px ${config.theme.color}` : 'none'
              }}
            >
              {/* Station icon */}
              <div className="absolute inset-0 flex items-center justify-center text-3xl sm:text-4xl">
                {isFlashing ? '⚡' : isCompleted ? '✓' : config.theme.icon}
              </div>

              {/* Flash effect */}
              {isFlashing && (
                <div
                  className="absolute inset-0 rounded-xl animate-ping"
                  style={{ backgroundColor: config.theme.color, opacity: 0.5 }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Action visualization - moving parts */}
      <div className="relative w-full max-w-2xl h-16 mb-6">
        <div className="absolute inset-0 bg-slate-800/50 rounded-lg border-2 border-slate-600 overflow-hidden">
          {/* Progress bar showing sequence completion */}
          <div
            className="absolute inset-y-0 left-0 transition-all duration-300"
            style={{
              width: `${(currentIndex / required) * 100}%`,
              backgroundColor: config.theme.color,
              opacity: 0.3
            }}
          />

          {/* Moving indicator */}
          {flashingIndex !== null && (
            <div
              className="absolute inset-y-0 w-1 bg-white animate-pulse"
              style={{
                left: `${(flashingIndex / positions.length) * 100}%`,
                boxShadow: '0 0 20px white'
              }}
            />
          )}
        </div>
      </div>

      {/* Click button */}
      <button
        onClick={handleClick}
        className="px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-2xl font-bold text-white rounded-xl shadow-xl transition-all hover:scale-110 active:scale-95 min-h-12"
        style={{ backgroundColor: config.theme.color }}
      >
        ACTION! (SPACE)
      </button>

      <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-400 text-center">
        Press SPACE when each station flashes!
      </div>
    </div>
  );
};

// ============================================================================
// PRECISION ALIGN MINIGAME (Heavy Machinery Positioning)
// ============================================================================
const PrecisionAlignGame: React.FC<{
  config: MinigameConfig;
  onComplete: (result: MinigameResult) => void;
}> = ({ config, onComplete }) => {
  const [clicked, setClicked] = useState(false);

  // Two oscillators for crosshair alignment
  const { value: horizontalPos } = useOscillator(0, 100, 0.6);
  const { value: verticalPos } = useOscillator(0, 100, 0.75); // Different speed for challenge

  // Target zone (center of the grid)
  const targetX = 50;
  const targetY = 50;
  const targetSize = MINIGAME_CONSTANTS.SAFE_ZONE_WIDTH[config.difficulty];

  // Timer
  const { elapsed } = useMinigameTimer(config.duration, () => {
    if (!clicked) handleClick();
  });

  const handleClick = useCallback(() => {
    if (clicked) return;
    setClicked(true);

    // Play click sound
    gameSounds.playFactoryClickSound();

    // Calculate distance from center using Pythagorean theorem
    const dx = horizontalPos - targetX;
    const dy = verticalPos - targetY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Grade based on distance from center
    const result = calculateResult(
      distance,
      0,                      // Perfect = dead center
      targetSize * 0.3,       // PERFECT
      targetSize * 0.5,       // GREAT
      targetSize * 0.7,       // GOOD
      targetSize             // OKAY = within target zone
    );

    onComplete(result);
  }, [clicked, horizontalPos, verticalPos, targetSize, onComplete]);

  useMinigameKeyboard(handleClick);

  // Check if aligned
  const dx = horizontalPos - targetX;
  const dy = verticalPos - targetY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const isAligned = distance < targetSize;

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 sm:px-8">
      {/* Alignment Grid */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 mb-6 sm:mb-8">
        {/* Background grid */}
        <div className="absolute inset-0 bg-slate-900 rounded-xl border-4 border-slate-600 overflow-hidden">
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            {/* Vertical lines */}
            {[25, 50, 75].map(x => (
              <line
                key={`v${x}`}
                x1={`${x}%`}
                y1="0%"
                x2={`${x}%`}
                y2="100%"
                stroke="white"
                strokeWidth="1"
              />
            ))}
            {/* Horizontal lines */}
            {[25, 50, 75].map(y => (
              <line
                key={`h${y}`}
                x1="0%"
                y1={`${y}%`}
                x2="100%"
                y2={`${y}%`}
                stroke="white"
                strokeWidth="1"
              />
            ))}
          </svg>

          {/* Target zone (center) */}
          <div
            className="absolute animate-pulse rounded-full"
            style={{
              left: `${targetX - targetSize / 2}%`,
              top: `${targetY - targetSize / 2}%`,
              width: `${targetSize}%`,
              height: `${targetSize}%`,
              backgroundColor: config.theme.color,
              opacity: 0.3,
              border: `3px solid ${config.theme.color}`
            }}
          />

          {/* Perfect zone indicator (smaller center) */}
          <div
            className="absolute rounded-full"
            style={{
              left: `${targetX - targetSize * 0.15}%`,
              top: `${targetY - targetSize * 0.15}%`,
              width: `${targetSize * 0.3}%`,
              height: `${targetSize * 0.3}%`,
              backgroundColor: config.theme.color,
              opacity: 0.5,
              border: `2px solid ${config.theme.color}`
            }}
          />

          {/* Horizontal crosshair (moving part - representing machinery) */}
          <div
            className="absolute inset-y-0 w-1 bg-red-500 transition-all duration-100"
            style={{
              left: `${horizontalPos}%`,
              boxShadow: '0 0 20px #ef4444'
            }}
          />

          {/* Vertical crosshair (moving part) */}
          <div
            className="absolute inset-x-0 h-1 bg-blue-500 transition-all duration-100"
            style={{
              top: `${verticalPos}%`,
              boxShadow: '0 0 20px #3b82f6'
            }}
          />

          {/* Crosshair intersection point (the actual cursor) */}
          <div
            className={`absolute w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 transition-all duration-100 ${
              isAligned ? 'scale-125' : 'scale-100'
            }`}
            style={{
              left: `${horizontalPos}%`,
              top: `${verticalPos}%`,
              transform: 'translate(-50%, -50%)',
              borderColor: isAligned ? '#10b981' : '#ffffff',
              backgroundColor: isAligned ? '#10b98180' : '#ffffff40',
              boxShadow: isAligned ? '0 0 30px #10b981' : '0 0 10px white'
            }}
          >
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isAligned ? '#10b981' : '#ffffff' }}
              />
            </div>
          </div>

          {/* Machinery icon at crosshair */}
          <div
            className="absolute text-3xl sm:text-4xl pointer-events-none"
            style={{
              left: `${horizontalPos}%`,
              top: `${verticalPos}%`,
              transform: 'translate(-50%, -200%)'
            }}
          >
            {config.theme.icon}
          </div>
        </div>

        {/* Corner brackets for industrial look */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-500" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-500" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-500" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-500" />
      </div>

      {/* Alignment indicator */}
      <div className={`text-xl sm:text-2xl font-bold mb-4 transition-all ${
        isAligned ? 'text-green-400 scale-110' : 'text-slate-400'
      }`}>
        {isAligned ? '✓ ALIGNED!' : 'Align crosshairs...'}
      </div>

      {/* Distance readout */}
      <div className="text-sm sm:text-base text-slate-400 mb-6">
        Precision: {distance.toFixed(1)} units
      </div>

      {/* Click button */}
      <button
        onClick={handleClick}
        disabled={clicked}
        className="px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-2xl font-bold text-white rounded-xl shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95 min-h-12"
        style={{ backgroundColor: config.theme.color }}
      >
        LOCK IN! (SPACE)
      </button>

      <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-400 text-center">
        Align both crosshairs at the center target
      </div>
    </div>
  );
};

export default FactoryTimingMinigameV2;
