/**
 * components/factory/FactoryTimingMinigame.tsx
 * Factory-specific animated timing minigames for tasks
 * Each factory type gets unique, thematic mini-challenges
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FactoryTask } from './FactoryTaskCard';

type MinigameType =
  | 'timing_bar'        // Moving bar - click in green zone
  | 'rhythm_pulse'      // Click in sync with pulses
  | 'temperature_gauge' // Stop needle in safe zone
  | 'quick_sequence'    // Multiple timed clicks
  | 'precision_align';  // Align moving elements

interface MinigameConfig {
  type: MinigameType;
  duration: number; // milliseconds
  difficulty: 'easy' | 'medium' | 'hard';
  theme: {
    color: string;
    icon: string;
    instruction: string;
  };
}

interface FactoryTimingMinigameProps {
  task: FactoryTask;
  factoryTypeId: string;
  onSuccess: () => void;
  onFailure: () => void;
}

// Map factory tasks to minigame configurations
const MINIGAME_CONFIGS: Record<string, MinigameConfig> = {
  // TEXTILE MILL
  'operate_loom': {
    type: 'rhythm_pulse',
    duration: 6000,
    difficulty: 'medium',
    theme: {
      color: '#8b5cf6', // purple
      icon: '🧵',
      instruction: 'Click in sync with the shuttle!'
    }
  },
  'thread_bobbin': {
    type: 'timing_bar',
    duration: 5000,
    difficulty: 'easy',
    theme: {
      color: '#06b6d4', // cyan
      icon: '🪡',
      instruction: 'Click when the thread aligns!'
    }
  },
  'repair_thread': {
    type: 'quick_sequence',
    duration: 4000,
    difficulty: 'hard',
    theme: {
      color: '#ef4444', // red
      icon: '🔗',
      instruction: 'Quick! Press SPACE at each flash!'
    }
  },

  // STEEL MILL
  'pour_ladle': {
    type: 'temperature_gauge',
    duration: 7000,
    difficulty: 'hard',
    theme: {
      color: '#f97316', // orange
      icon: '🥄',
      instruction: 'Stop the gauge in the safe zone!'
    }
  },
  'move_ingots': {
    type: 'quick_sequence',
    duration: 5000,
    difficulty: 'medium',
    theme: {
      color: '#f59e0b', // amber
      icon: '📦',
      instruction: 'Lift at each pulse - SPACE!'
    }
  },

  // SUGAR PLANTATION
  'cut_cane': {
    type: 'rhythm_pulse',
    duration: 6000,
    difficulty: 'medium',
    theme: {
      color: '#10b981', // green
      icon: '🌾',
      instruction: 'Swing in rhythm with the cuts!'
    }
  },

  // COTTON PLANTATION
  'pick_cotton': {
    type: 'timing_bar',
    duration: 5000,
    difficulty: 'easy',
    theme: {
      color: '#f0f0f0', // white
      icon: '☁️',
      instruction: 'Pick when hands align with bolls!'
    }
  },

  // RAILWAY WORKSHOP
  'rivet_plates': {
    type: 'rhythm_pulse',
    duration: 6000,
    difficulty: 'hard',
    theme: {
      color: '#6366f1', // indigo
      icon: '🔨',
      instruction: 'Hammer in perfect rhythm!'
    }
  },
  'assemble_boiler': {
    type: 'precision_align',
    duration: 8000,
    difficulty: 'hard',
    theme: {
      color: '#8b5cf6', // purple
      icon: '⚙️',
      instruction: 'Click when parts align!'
    }
  },

  // AUTOMOBILE FACTORY
  'install_engine': {
    type: 'precision_align',
    duration: 7000,
    difficulty: 'medium',
    theme: {
      color: '#3b82f6', // blue
      icon: '🔧',
      instruction: 'Lower engine when aligned!'
    }
  },

  // ELECTRONICS FACTORY
  'solder_boards': {
    type: 'timing_bar',
    duration: 6000,
    difficulty: 'hard',
    theme: {
      color: '#14b8a6', // teal
      icon: '🔌',
      instruction: 'Solder when iron is at perfect temp!'
    }
  }
};

export const FactoryTimingMinigame: React.FC<FactoryTimingMinigameProps> = ({
  task,
  factoryTypeId,
  onSuccess,
  onFailure
}) => {
  const config = MINIGAME_CONFIGS[task.id] || {
    type: 'timing_bar',
    duration: 5000,
    difficulty: 'medium',
    theme: {
      color: '#6366f1',
      icon: '⚙️',
      instruction: 'Click at the right moment!'
    }
  };

  const [gameState, setGameState] = useState<'countdown' | 'playing' | 'finished'>('countdown');
  const [countdown, setCountdown] = useState(3);

  // Countdown before game starts
  useEffect(() => {
    if (gameState === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGameState('playing');
      }
    }
  }, [countdown, gameState]);

  // Render appropriate minigame based on type
  const renderMinigame = () => {
    if (gameState === 'countdown') {
      return (
        <div className="flex items-center justify-center h-full">
          <div
            className="text-9xl font-bold animate-bounce"
            style={{ color: config.theme.color }}
          >
            {countdown}
          </div>
        </div>
      );
    }

    switch (config.type) {
      case 'timing_bar':
        return <TimingBarMinigame config={config} onSuccess={onSuccess} onFailure={onFailure} />;
      case 'rhythm_pulse':
        return <RhythmPulseMinigame config={config} onSuccess={onSuccess} onFailure={onFailure} />;
      case 'temperature_gauge':
        return <TemperatureGaugeMinigame config={config} onSuccess={onSuccess} onFailure={onFailure} />;
      case 'quick_sequence':
        return <QuickSequenceMinigame config={config} onSuccess={onSuccess} onFailure={onFailure} />;
      case 'precision_align':
        return <PrecisionAlignMinigame config={config} onSuccess={onSuccess} onFailure={onFailure} />;
      default:
        return <TimingBarMinigame config={config} onSuccess={onSuccess} onFailure={onFailure} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div
        className="relative w-full max-w-3xl h-96 rounded-2xl border-4 shadow-2xl overflow-hidden"
        style={{ borderColor: config.theme.color, backgroundColor: '#1e293b' }}
      >
        {/* Header */}
        <div
          className="absolute top-0 left-0 right-0 px-6 py-4 text-center border-b-2"
          style={{ borderColor: config.theme.color + '40', backgroundColor: config.theme.color + '20' }}
        >
          <div className="text-4xl mb-2">{config.theme.icon}</div>
          <div className="text-xl font-bold text-white">{task.name}</div>
          <div className="text-sm text-slate-300 mt-1">{config.theme.instruction}</div>
        </div>

        {/* Game Area */}
        <div className="absolute inset-0 mt-28">
          {renderMinigame()}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TIMING BAR MINIGAME
// ============================================================================
const TimingBarMinigame: React.FC<{
  config: MinigameConfig;
  onSuccess: () => void;
  onFailure: () => void;
}> = ({ config, onSuccess, onFailure }) => {
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1);
  const [clicked, setClicked] = useState(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef(Date.now());

  // Safe zones based on difficulty
  const safeZones = {
    easy: { start: 40, end: 60 },
    medium: { start: 42, end: 58 },
    hard: { start: 45, end: 55 }
  };
  const safeZone = safeZones[config.difficulty];

  // Animate position
  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed > config.duration) {
        if (!clicked) onFailure();
        return;
      }

      setPosition(prev => {
        let newPos = prev + direction * 0.8;
        if (newPos >= 100) {
          newPos = 100;
          setDirection(-1);
        } else if (newPos <= 0) {
          newPos = 0;
          setDirection(1);
        }
        return newPos;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [direction, clicked, config.duration, onFailure]);

  // Handle click
  const handleClick = useCallback(() => {
    if (clicked) return;
    setClicked(true);

    if (position >= safeZone.start && position <= safeZone.end) {
      onSuccess();
    } else {
      onFailure();
    }
  }, [clicked, position, safeZone, onSuccess, onFailure]);

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleClick();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClick]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-12">
      {/* Main bar */}
      <div className="relative w-full h-20 bg-slate-800 rounded-full border-4 border-slate-600 overflow-hidden shadow-inner">
        {/* Safe zone */}
        <div
          className="absolute h-full opacity-40 animate-pulse"
          style={{
            left: `${safeZone.start}%`,
            width: `${safeZone.end - safeZone.start}%`,
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
        className="mt-8 px-12 py-4 text-2xl font-bold text-white rounded-xl shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
        style={{ backgroundColor: config.theme.color }}
      >
        CLICK NOW! (SPACE)
      </button>

      <div className="mt-4 text-sm text-slate-400">
        Click when the line is in the highlighted zone
      </div>
    </div>
  );
};

// ============================================================================
// RHYTHM PULSE MINIGAME
// ============================================================================
const RhythmPulseMinigame: React.FC<{
  config: MinigameConfig;
  onSuccess: () => void;
  onFailure: () => void;
}> = ({ config, onSuccess, onFailure }) => {
  const [pulses, setPulses] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [required] = useState(config.difficulty === 'easy' ? 5 : config.difficulty === 'medium' ? 7 : 10);
  const [isActive, setIsActive] = useState(false);
  const startTimeRef = useRef(Date.now());
  const lastPulseRef = useRef(0);

  const pulseInterval = config.difficulty === 'easy' ? 1000 : config.difficulty === 'medium' ? 800 : 600;

  // Generate pulses
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed > config.duration) {
        clearInterval(interval);
        if (score >= required) {
          onSuccess();
        } else {
          onFailure();
        }
        return;
      }

      setIsActive(true);
      lastPulseRef.current = Date.now();
      setPulses(prev => [...prev, Date.now()]);

      setTimeout(() => setIsActive(false), pulseInterval / 2);
    }, pulseInterval);

    return () => clearInterval(interval);
  }, [config.duration, pulseInterval, score, required, onSuccess, onFailure]);

  // Handle click
  const handleClick = useCallback(() => {
    const timeSinceLastPulse = Date.now() - lastPulseRef.current;
    const window = pulseInterval / 2;

    if (timeSinceLastPulse < window) {
      // Good timing!
      setScore(prev => prev + 1);
    }
  }, [pulseInterval]);

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleClick();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClick]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Pulse circle */}
      <div className="relative w-64 h-64 mb-8">
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

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl">{config.theme.icon}</div>
        </div>
      </div>

      {/* Score */}
      <div className="text-4xl font-bold text-white mb-4">
        {score} / {required}
      </div>

      {/* Click button */}
      <button
        onClick={handleClick}
        className="px-12 py-4 text-2xl font-bold text-white rounded-xl shadow-xl transition-all hover:scale-110 active:scale-95"
        style={{ backgroundColor: config.theme.color }}
      >
        CLICK! (SPACE)
      </button>

      <div className="mt-4 text-sm text-slate-400">
        Click in sync with the pulses
      </div>
    </div>
  );
};

// ============================================================================
// TEMPERATURE GAUGE MINIGAME
// ============================================================================
const TemperatureGaugeMinigame: React.FC<{
  config: MinigameConfig;
  onSuccess: () => void;
  onFailure: () => void;
}> = ({ config, onSuccess, onFailure }) => {
  const [temperature, setTemperature] = useState(0);
  const [direction, setDirection] = useState(1);
  const [clicked, setClicked] = useState(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef(Date.now());

  const safeZones = {
    easy: { start: 40, end: 60 },
    medium: { start: 42, end: 58 },
    hard: { start: 45, end: 55 }
  };
  const safeZone = safeZones[config.difficulty];

  // Animate temperature
  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed > config.duration) {
        if (!clicked) onFailure();
        return;
      }

      setTemperature(prev => {
        let newTemp = prev + direction * 1.2;
        if (newTemp >= 100) {
          newTemp = 100;
          setDirection(-1);
        } else if (newTemp <= 0) {
          newTemp = 0;
          setDirection(1);
        }
        return newTemp;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [direction, clicked, config.duration, onFailure]);

  // Handle click
  const handleClick = useCallback(() => {
    if (clicked) return;
    setClicked(true);

    if (temperature >= safeZone.start && temperature <= safeZone.end) {
      onSuccess();
    } else {
      onFailure();
    }
  }, [clicked, temperature, safeZone, onSuccess, onFailure]);

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleClick();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClick]);

  const getColor = () => {
    if (temperature < 33) return '#3b82f6'; // blue
    if (temperature < 66) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Thermometer */}
      <div className="relative w-32 h-80 bg-slate-800 rounded-full border-4 border-slate-600 overflow-hidden shadow-inner">
        {/* Safe zone */}
        <div
          className="absolute w-full opacity-40 border-y-4 border-green-500"
          style={{
            bottom: `${safeZone.start}%`,
            height: `${safeZone.end - safeZone.start}%`
          }}
        />

        {/* Temperature fill */}
        <div
          className="absolute bottom-0 w-full transition-all duration-100"
          style={{
            height: `${temperature}%`,
            backgroundColor: getColor(),
            boxShadow: `0 0 30px ${getColor()}`
          }}
        />

        {/* Temperature reading */}
        <div className="absolute top-4 left-0 right-0 text-center">
          <div className="text-2xl font-bold text-white">{Math.floor(temperature)}°</div>
        </div>
      </div>

      {/* Click button */}
      <button
        onClick={handleClick}
        disabled={clicked}
        className="mt-8 px-12 py-4 text-2xl font-bold text-white rounded-xl shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
        style={{ backgroundColor: config.theme.color }}
      >
        STOP! (SPACE)
      </button>

      <div className="mt-4 text-sm text-slate-400">
        Stop when temperature is in the green zone
      </div>
    </div>
  );
};

// ============================================================================
// QUICK SEQUENCE MINIGAME
// ============================================================================
const QuickSequenceMinigame: React.FC<{
  config: MinigameConfig;
  onSuccess: () => void;
  onFailure: () => void;
}> = ({ config, onSuccess, onFailure }) => {
  const [sequence, setSequence] = useState<boolean[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [required] = useState(config.difficulty === 'easy' ? 5 : config.difficulty === 'medium' ? 7 : 10);
  const [showFlash, setShowFlash] = useState(false);
  const [missed, setMissed] = useState(false);

  const flashDuration = config.difficulty === 'easy' ? 800 : config.difficulty === 'medium' ? 600 : 400;
  const sequenceInterval = config.difficulty === 'easy' ? 1200 : config.difficulty === 'medium' ? 1000 : 800;

  // Generate sequence
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentIndex >= required) {
        clearInterval(interval);
        if (!missed) {
          onSuccess();
        } else {
          onFailure();
        }
        return;
      }

      setShowFlash(true);
      setTimeout(() => {
        setShowFlash(false);
        setMissed(true);
        setTimeout(() => setCurrentIndex(prev => prev + 1), flashDuration / 2);
      }, flashDuration);
    }, sequenceInterval);

    return () => clearInterval(interval);
  }, [currentIndex, required, flashDuration, sequenceInterval, missed, onSuccess, onFailure]);

  // Handle click
  const handleClick = useCallback(() => {
    if (showFlash) {
      setSequence(prev => [...prev, true]);
      setMissed(false);
    }
  }, [showFlash]);

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleClick();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClick]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Flash indicator */}
      <div className="relative w-96 h-40 mb-8">
        <div
          className={`absolute inset-0 rounded-3xl border-8 transition-all duration-200 flex items-center justify-center ${
            showFlash ? 'scale-110 opacity-100' : 'scale-100 opacity-20'
          }`}
          style={{
            borderColor: config.theme.color,
            backgroundColor: showFlash ? config.theme.color : 'transparent',
            boxShadow: showFlash ? `0 0 80px ${config.theme.color}` : 'none'
          }}
        >
          <div className="text-8xl">{config.theme.icon}</div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {Array.from({ length: required }).map((_, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full border-2 transition-all"
            style={{
              borderColor: config.theme.color,
              backgroundColor: i < sequence.filter(Boolean).length ? config.theme.color : 'transparent'
            }}
          />
        ))}
      </div>

      {/* Instructions */}
      <div className="text-3xl font-bold text-white">
        {sequence.filter(Boolean).length} / {required}
      </div>
      <div className="mt-4 text-sm text-slate-400">
        Press SPACE when it flashes!
      </div>
    </div>
  );
};

// ============================================================================
// PRECISION ALIGN MINIGAME
// ============================================================================
const PrecisionAlignMinigame: React.FC<{
  config: MinigameConfig;
  onSuccess: () => void;
  onFailure: () => void;
}> = ({ config, onSuccess, onFailure }) => {
  const [offset, setOffset] = useState(50);
  const [direction, setDirection] = useState(1);
  const [clicked, setClicked] = useState(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef(Date.now());

  const tolerance = config.difficulty === 'easy' ? 8 : config.difficulty === 'medium' ? 5 : 3;

  // Animate offset
  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed > config.duration) {
        if (!clicked) onFailure();
        return;
      }

      setOffset(prev => {
        let newOffset = prev + direction * 0.6;
        if (newOffset >= 100) {
          newOffset = 100;
          setDirection(-1);
        } else if (newOffset <= 0) {
          newOffset = 0;
          setDirection(1);
        }
        return newOffset;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [direction, clicked, config.duration, onFailure]);

  // Handle click
  const handleClick = useCallback(() => {
    if (clicked) return;
    setClicked(true);

    const distance = Math.abs(offset - 50);
    if (distance <= tolerance) {
      onSuccess();
    } else {
      onFailure();
    }
  }, [clicked, offset, tolerance, onSuccess, onFailure]);

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleClick();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClick]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-12">
      {/* Alignment visual */}
      <div className="relative w-full max-w-2xl h-32 mb-8">
        {/* Target slot */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-32 h-32 border-4 border-dashed rounded-2xl opacity-60"
          style={{ borderColor: config.theme.color }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
            {config.theme.icon}
          </div>
        </div>

        {/* Moving piece */}
        <div
          className="absolute top-0 w-32 h-32 rounded-2xl border-4 transition-all duration-100 flex items-center justify-center text-6xl shadow-lg"
          style={{
            left: `${offset}%`,
            transform: 'translateX(-50%)',
            borderColor: config.theme.color,
            backgroundColor: `${config.theme.color}40`,
            boxShadow: `0 0 30px ${config.theme.color}`
          }}
        >
          {config.theme.icon}
        </div>
      </div>

      {/* Precision meter */}
      <div className="w-full max-w-md h-4 bg-slate-800 rounded-full overflow-hidden mb-8">
        <div
          className="h-full transition-all duration-100"
          style={{
            width: `${Math.max(0, 100 - Math.abs(offset - 50) * 5)}%`,
            backgroundColor: Math.abs(offset - 50) <= tolerance ? '#10b981' : '#ef4444'
          }}
        />
      </div>

      {/* Click button */}
      <button
        onClick={handleClick}
        disabled={clicked}
        className="px-12 py-4 text-2xl font-bold text-white rounded-xl shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
        style={{ backgroundColor: config.theme.color }}
      >
        LOCK IN! (SPACE)
      </button>

      <div className="mt-4 text-sm text-slate-400">
        Click when perfectly aligned with the center
      </div>
    </div>
  );
};

export default FactoryTimingMinigame;
