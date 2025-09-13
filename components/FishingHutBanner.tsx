/**
 * components/FishingHutBanner.tsx
 * V3: Transparent-sky composition with TimeAwareBackground (+ optional WeatherEffects FX)
 *  - Sky is NOT drawn in SVG; TimeAwareBackground owns seasons/climates/overcast
 *  - Optional WeatherEffects is clipped to the sky band (no ocean/ground duplication)
 *  - rAF ticker with reduced-motion support
 *  - Small polish: better fish & bird motion, pier/seaweed sway, cold breath, night lantern
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import TimeAwareBackground from './TimeAwareBackground';
import WeatherEffects from './WeatherEffects';
import { TerrainStructure, ClimateType, Season, TimeOfDay, BiomeType } from '../types';
import type { WeatherState } from '../services/weatherService';

interface FishingHutBannerProps {
  structure?: TerrainStructure;
  era?: string;
  culturalZone?: string;
  climate?: ClimateType;
  season: Season;
  timeOfDay: TimeOfDay;
  width?: number;
  height?: number;
  seed?: number;
  adjacentBiomes?: BiomeType[];
  /** Optional live weather from the central WeatherService */
  weather?: WeatherState | null;
  /** Set false to skip WeatherEffects entirely (sky still handled by TimeAwareBackground) */
  enableFxLayer?: boolean;
  /** Callback to share ambient element positions with game layer */
  onAmbientUpdate?: (elements: AmbientElement[]) => void;
  /** Game mode hides some decorative elements */
  gameMode?: boolean;
  /** Notify banner of game events */
  gameEvent?: 'cast' | 'catch' | 'escape' | null;
}

/* ───────────────────────── Layout constants ───────────────────────── */
export const GROUND_Y_DEFAULT = 110;
export const WATER_OFFSET = 15;

/* ───────────────────────── Utilities ───────────────────────── */
const ipx = (n: number) => Math.round(n);
class RNG {
  private s: number;
  constructor(seed = 1) { this.s = seed || 1; }
  next() { this.s = (this.s * 1664525 + 1013904223) >>> 0; return (this.s & 0xffffffff) / 0x100000000; }
  range(a: number, b: number) { return a + this.next() * (b - a); }
  int(a: number, b: number) { return Math.floor(this.range(a, b + 1)); }
  pick<T>(arr: T[]) { return arr[Math.floor(this.next() * arr.length)]!; }
}

type TOD = 'dawn'|'day'|'dusk'|'night';
const toTOD = (t: TimeOfDay): TOD => {
  if (t === 'Dawn') return 'dawn';
  if (t === 'Dusk') return 'dusk';
  if (t === 'Night') return 'night';
  return 'day';
};
function toSeasonString(season?: Season | string | null): 'spring'|'summer'|'fall'|'winter'|null {
  if (!season) return null;
  const s = String(season).toLowerCase();
  if (s.startsWith('spr')) return 'spring';
  if (s.startsWith('sum')) return 'summer';
  if (s.startsWith('aut') || s.startsWith('fal')) return 'fall';
  if (s.startsWith('win')) return 'winter';
  return null;
}
function toClimateString(climate?: ClimateType | string | null): 'temperate'|'tropical'|'arid'|'arctic'|'mediterranean'|'continental'|null {
  if (!climate) return null;
  const c = String(climate).toUpperCase();
  if (c.includes('TEMPERATE')) return 'temperate';
  if (c.includes('TROP')) return 'tropical';
  if (c.includes('SEMI')) return 'tropical';
  if (c.includes('ARID') || c.includes('DESERT')) return 'arid';
  if (c.includes('MEDITERRANEAN')) return 'mediterranean';
  if (c.includes('COLD') || c.includes('ARCTIC') || c.includes('POLAR')) return 'arctic';
  return 'continental';
}
function todToClock(tod: TOD) {
  if (tod === 'dawn') return { h: 6, m: 30 };
  if (tod === 'dusk') return { h: 19, m: 30 };
  if (tod === 'night') return { h: 23, m: 0 };
  return { h: 13, m: 0 };
}

/* ───────────────────────── Ocean palettes ───────────────────────── */
export const OCEAN_COLORS: Record<string, { shallow: string, deep: string, foam: string }> = {
  [ClimateType.COLD]: { shallow:'#5A7A8C', deep:'#2C4A5C', foam:'#E8F4F8' },
  [ClimateType.TEMPERATE]: { shallow:'#4A90E2', deep:'#2E5A8E', foam:'#F0F8FF' },
  [ClimateType.ARID]: { shallow:'#6BA3D0', deep:'#4A7A9C', foam:'#FFF8E7' },
  [ClimateType.SEMITROPICAL]: { shallow:'#40E0D0', deep:'#20B2AA', foam:'#F0FFFF' },
  [ClimateType.TROPICAL]: { shallow:'#00CED1', deep:'#008B8B', foam:'#F0FFFF' },
  [ClimateType.MEDITERRANEAN]: { shallow:'#4682B4', deep:'#1E5A8E', foam:'#F5F5DC' }
};

/* ───────────────────────── Local types ───────────────────────── */
// Removed Fish type - replaced with ambient animations
export type AmbientElement = {
  type: 'boat' | 'dolphin' | 'bird' | 'whale' | 'seals' | 'jumping_fish';
  x: number; y: number; vx: number; vy: number;
  phase: number; size: number; visible: boolean;
  animationDuration: number;
  jumpTime?: number; // For jumping fish
};
type IceFloe = { x:number; size:number; drift:number; };
type Fisher = { x:number; casting:boolean };
type ShorelineElement = { x: number; y: number; size: number; type: 'pebble' | 'rock' | 'shell' | 'driftwood'; };
type WaveReflection = { x: number; phase: number; intensity: number; };

/* ───────────────────────── Component ───────────────────────── */
const FishingHutBanner: React.FC<FishingHutBannerProps> = ({
  structure,
  era = '1500',
  culturalZone = 'european',
  climate = ClimateType.TEMPERATE,
  season,
  timeOfDay,
  width = 600,
  height = 250,
  seed = 12345,
  adjacentBiomes = [],
  weather,
  enableFxLayer = true,
  onFishPositionUpdate,
  onAmbientUpdate = () => {}, // Safe default
  gameMode = false,
  gameEvent = null,
}) => {
  /* Derived */
  const tod = toTOD(timeOfDay);
  const { h: clockH, m: clockM } = todToClock(tod);
  const seasonStr = toSeasonString(season);
  const climateStr = toClimateString(climate);
  const isModern = (parseInt(era, 10) || 0) >= 1900;
  const isTropical = climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL;
  const isCold = climate === ClimateType.COLD || String(season).toLowerCase().startsWith('win');

  // Layout bands (keeps your classic composition but scalable)
  const GROUND_Y = Math.min(GROUND_Y_DEFAULT, Math.max(80, ipx(height * 0.44)));
  const WATER_Y = GROUND_Y + WATER_OFFSET;

  // RNG domains (stable)
  const baseSeed = seed + (structure?.location?.[0] || 0) * 997 + (structure?.location?.[1] || 0) * 131;
  const rng = useMemo(() => new RNG(baseSeed), [baseSeed]);
  const staticRng = useMemo(() => new RNG(seed + 9999), [seed]);

  // reduced motion
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // rAF ticker
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const step = reduced ? 0.5 : 1;
      if (!document.hidden && now - last > (reduced ? 80 : 16)) {
        setFrame((f) => f + step);
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  /* Marine / ambient state */
  // Removed fish state - replaced with ambient animations
  const [ambientAnimations, setAmbientAnimations] = useState<AmbientElement[]>([]);
  const [iceFloes, setIceFloes] = useState<IceFloe[]>([]);
  const [fishermenPos, setFishermenPos] = useState<Fisher[]>([]);
  const [fishermenReaction, setFishermenReaction] = useState<string | null>(null);
  const [boatPhase, setBoatPhase] = useState(rng.range(0, Math.PI * 2));
  const [shorelineElements, setShorelineElements] = useState<ShorelineElement[]>([]);
  const [waveReflections, setWaveReflections] = useState<WaveReflection[]>([]);
  const [windDirection, setWindDirection] = useState(0);
  const [jumpingFish, setJumpingFish] = useState<AmbientElement[]>([]);

  // React to game events
  useEffect(() => {
    if (gameEvent === 'catch') {
      setFishermenReaction('Nice catch!');
      // Make boat rock more
      setBoatPhase(prev => prev + Math.PI / 4);
      setTimeout(() => setFishermenReaction(null), 3000);
    } else if (gameEvent === 'escape') {
      setFishermenReaction('It got away!');
      setTimeout(() => setFishermenReaction(null), 2000);
    } else if (gameEvent === 'cast') {
      setFishermenReaction('Good cast!');
      setTimeout(() => setFishermenReaction(null), 1500);
    }
  }, [gameEvent]);
  
  // initialize critters & folks
  useEffect(() => {
    // Initialize climate-aware ambient animations (boats, dolphins, etc.)
    // 50% chance to spawn elements, climate-dependent types
    const ambientTypes: AmbientElement['type'][] = isTropical ?
      ['dolphin', 'boat', 'bird'] :
      isCold ?
      ['whale', 'seals', 'boat'] :
      ['boat', 'bird', 'dolphin']; // temperate

    const ambientElements: AmbientElement[] = [];

    // Only 50% chance for ambient elements to appear
    if (staticRng.next() > 0.5) {
      const numElements = 1 + staticRng.int(0, 2); // 1-2 elements max

      for (let i = 0; i < numElements; i++) {
        const type = staticRng.pick(ambientTypes);
        const element: AmbientElement = {
          type,
          x: type === 'bird' ? staticRng.range(-50, width + 50) : staticRng.range(-100, width + 100),
          y: type === 'bird' ? WATER_Y - staticRng.range(30, 80) : WATER_Y - staticRng.range(5, 15),
          vx: (type === 'bird' ? 0.8 : 0.3) * (staticRng.next() > 0.5 ? 1 : -1),
          vy: type === 'dolphin' ? staticRng.range(-0.5, 0.5) : 0,
          phase: staticRng.range(0, 1000),
          size: type === 'whale' ? 20 + staticRng.range(0, 15) : 8 + staticRng.range(0, 8),
          visible: true,
          animationDuration: 8000 + staticRng.range(0, 4000), // 8-12 seconds
        };
        ambientElements.push(element);
      }
    }

    setAmbientAnimations(ambientElements);

    // Initialize shoreline elements (FIX: Store positions in state, not regenerated each frame)
    const shoreElements: ShorelineElement[] = [];
    if (!isCold) {
      // Pebbles and shells for warm climates
      const numPebbles = Math.max(12, width / 40);
      for (let i = 0; i < numPebbles; i++) {
        shoreElements.push({
          x: i * (width / 12) * 0.9 + staticRng.range(-8, 8),
          y: GROUND_Y + staticRng.range(2, 12),
          size: staticRng.range(0.8, 2),
          type: staticRng.next() > 0.8 ? 'shell' : 'pebble'
        });
      }
      // Add some driftwood
      for (let i = 0; i < 3; i++) {
        shoreElements.push({
          x: staticRng.range(50, width - 50),
          y: GROUND_Y + staticRng.range(3, 10),
          size: staticRng.range(10, 25),
          type: 'driftwood'
        });
      }
    } else {
      // Rocks for cold climates
      const numRocks = Math.max(8, width / 80);
      for (let i = 0; i < numRocks; i++) {
        shoreElements.push({
          x: i * (width / 8) + staticRng.range(-20, 20),
          y: GROUND_Y + staticRng.range(0, 10),
          size: staticRng.range(5, 14),
          type: 'rock'
        });
      }
    }
    setShorelineElements(shoreElements);

    // Initialize wave reflections
    const reflections: WaveReflection[] = [];
    for (let i = 0; i < 5; i++) {
      reflections.push({
        x: staticRng.range(0, width),
        phase: staticRng.range(0, Math.PI * 2),
        intensity: staticRng.range(0.3, 0.7)
      });
    }
    setWaveReflections(reflections);

    // Set wind direction
    setWindDirection(staticRng.range(-1, 1));

    // Ice (cold drift)
    if (isCold) {
      const n = 2 + staticRng.int(0, 3);
      setIceFloes(Array.from({ length: n }, () => ({
        x: staticRng.range(-40, width + 40),
        size: 18 + staticRng.range(0, 30),
        drift: 0.08 + staticRng.range(0, 0.18),
      })));
    } else {
      setIceFloes([]);
    }

    // Fishermen on the pier
    const nf = 1 + staticRng.int(0, 2);
    setFishermenPos(Array.from({ length: nf }, () => ({
      x: staticRng.range(width * 0.32, width * 0.68),
      casting: false
    })));
  }, [width, height, isTropical, isCold, gameMode, WATER_Y, GROUND_Y, staticRng]);

  // animate ambient elements, floes, boat bob, casting cadence
  useEffect(() => {
    let raf = 0;
    const step = () => {
      setBoatPhase((p) => p + (reduced ? 0.012 : 0.02));

      // Occasionally spawn jumping fish
      if (Math.random() < 0.002 && jumpingFish.length < 2) { // 0.2% chance per frame
        setJumpingFish(prev => [...prev, {
          type: 'jumping_fish',
          x: Math.random() * width,
          y: WATER_Y,
          vx: (Math.random() - 0.5) * 2,
          vy: -4 - Math.random() * 2,
          phase: 0,
          size: 3 + Math.random() * 3,
          visible: true,
          animationDuration: 2000,
          jumpTime: Date.now()
        }]);
      }

      // Animate jumping fish
      setJumpingFish(prev => prev.map(fish => {
        const elapsed = Date.now() - (fish.jumpTime || 0);
        if (elapsed > 2000) return { ...fish, visible: false };

        const newY = fish.y + fish.vy;
        const newVy = fish.vy + 0.15; // gravity
        const newX = fish.x + fish.vx;

        return {
          ...fish,
          x: newX,
          y: newY,
          vy: newVy,
          phase: elapsed / 2000
        };
      }).filter(f => f.visible));

      // Animate ambient elements (boats, dolphins, birds, etc.)
      setAmbientAnimations((prev) => {
        const updatedElements = prev.map(element => {
          let x = element.x + (reduced ? 0.6 : 1.0) * element.vx;
          let y = element.y;

          // Add wind effect to birds
          if (element.type === 'bird') {
            x += windDirection * 0.2;
          }

          // Different animation behaviors per type
          if (element.type === 'dolphin') {
            // Dolphins arc through water
            const jumpPhase = (frame * 0.05) + element.phase;
            y = element.y + Math.sin(jumpPhase) * 8 + element.vy;
          } else if (element.type === 'bird') {
            // Birds fly with wing flaps
            const flapPhase = (frame * 0.1) + element.phase;
            y = element.y + Math.sin(flapPhase) * 3;
          } else if (element.type === 'whale') {
            // Whales occasionally surface
            const surfacePhase = (frame * 0.02) + element.phase;
            y = element.y + Math.sin(surfacePhase * 0.3) * 2;
          } else if (element.type === 'boat') {
            // Boats bob gently
            const bobPhase = (frame * 0.03) + element.phase;
            y = element.y + Math.sin(bobPhase) * 2;
          }

          // Remove elements that have moved off screen
          const visible = x > -150 && x < width + 150;

          return { ...element, x, y, visible };
        }).filter(e => e.visible); // Remove invisible elements

        // Share ambient positions with game layer if callback provided
        if (onAmbientUpdate) {
          setTimeout(() => onAmbientUpdate(updatedElements), 0);
        }
        return updatedElements;
      });
      if (isCold) {
        setIceFloes((prev) => prev.map(f => ({
          ...f,
          x: ((f.x + f.drift) % (width + 120)) - 60
        })));
      }
      setFishermenPos((prev) => prev.map((p, i) => ({
        ...p,
        casting: Math.floor(frame) % (reduced ? 120 : 60) === (i * (reduced ? 40 : 20))
      })));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [width, height, frame, isTropical, isCold, reduced, WATER_Y, windDirection, jumpingFish, onAmbientUpdate]);

  const ocean = OCEAN_COLORS[climate] || OCEAN_COLORS[ClimateType.TEMPERATE];
  const boatX = Math.sin(boatPhase) * 12;
  const boatYBob = Math.sin(boatPhase * 1.3) * 2;

  /* Optional FX: show only in the sky band to avoid double-layering in ocean/ground */
  const fxWeather = useMemo<WeatherState | undefined>(() => {
    if (!weather) return undefined;
    // Keep precipitation & lightning etc., but clip to sky area via container
    return { ...weather };
  }, [weather]);

  /* ───────────────────────── Render helpers ───────────────────────── */
  const renderHorizon = () => (
    <g>
      {/* distant islands/mountains (very light) */}
      <polygon
        points={`0,${GROUND_Y - 20} ${width * 0.1},${GROUND_Y - 25} ${width * 0.22},${GROUND_Y - 22} ${width * 0.34},${GROUND_Y - 26} ${width * 0.46},${GROUND_Y - 22} ${width},${GROUND_Y - 20}`}
        fill="#B8C5D6"
        opacity="0.25"
      />
    </g>
  );

  const renderShoreline = () => (
    <g>
      {/* Beach gradient */}
      <defs>
        <linearGradient id="beachGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isCold ? '#8B8682' : '#F4E4C1'} />
          <stop offset="100%" stopColor={isCold ? '#696969' : '#D2B48C'} />
        </linearGradient>
      </defs>
      <rect x={0} y={GROUND_Y} width={width} height={15} fill="url(#beachGradient)" />

      {/* Wet sand line */}
      <rect x={0} y={GROUND_Y + 12} width={width} height={3} fill={isCold ? '#5A5A5A' : '#C4A57B'} opacity="0.5" />

      {/* Render stored shoreline elements */}
      {shorelineElements.map((elem, i) => {
        if (elem.type === 'pebble') {
          return (
            <circle
              key={`pebble_${i}`}
              cx={elem.x}
              cy={elem.y}
              r={elem.size}
              fill="#D2B48C"
              opacity={0.45}
            />
          );
        } else if (elem.type === 'shell') {
          return (
            <g key={`shell_${i}`} transform={`translate(${elem.x}, ${elem.y})`}>
              <path
                d={`M 0 0 Q -${elem.size} -${elem.size * 0.5} -${elem.size * 0.5} -${elem.size} Q 0 -${elem.size * 0.5} ${elem.size * 0.5} -${elem.size} Q ${elem.size} -${elem.size * 0.5} 0 0`}
                fill="#FFE4E1"
                opacity="0.6"
              />
            </g>
          );
        } else if (elem.type === 'driftwood') {
          return (
            <rect
              key={`driftwood_${i}`}
              x={elem.x}
              y={elem.y}
              width={elem.size}
              height={elem.size * 0.2}
              fill="#8B7355"
              opacity="0.5"
              transform={`rotate(${(i * 23) % 45} ${elem.x + elem.size/2} ${elem.y})`}
            />
          );
        } else if (elem.type === 'rock') {
          return (
            <rect
              key={`rock_${i}`}
              x={elem.x}
              y={elem.y}
              width={elem.size}
              height={elem.size * 0.5}
              fill="#696969"
              rx={elem.size * 0.1}
            />
          );
        }
        return null;
      })}
    </g>
  );

  const renderFishingHut = () => {
    const cx = width / 2;
    const asian = /asia/i.test(String(culturalZone));
    const pacific = /pacific|oceania/i.test(String(culturalZone));
    const night = tod === 'dusk' || tod === 'night';
    const shadowOffset = tod === 'dawn' ? -15 : tod === 'dusk' ? 15 : tod === 'night' ? 0 : 10;
    const shadowOpacity = tod === 'night' ? 0.1 : tod === 'dawn' || tod === 'dusk' ? 0.2 : 0.15;

    // Determine era-based features
    const eraNum = parseInt(era, 10) || 0;
    const isPrehistoric = eraNum < -3000;
    const isAntiquity = eraNum >= -3000 && eraNum < 500;
    const isMedieval = eraNum >= 500 && eraNum < 1500;
    const isEarlyModern = eraNum >= 1500 && eraNum < 1800;
    const isIndustrial = eraNum >= 1800 && eraNum < 1950;
    const isModernEra = eraNum >= 1950;

    // Determine hut style based on era and culture
    let hutStyle = 'primitive';
    if (isPrehistoric || isAntiquity) {
      hutStyle = 'primitive';
    } else if (isMedieval) {
      hutStyle = asian ? 'stilt' : pacific ? 'thatched' : 'log';
    } else if (isEarlyModern || isIndustrial) {
      hutStyle = 'wooden';
    } else if (isModernEra) {
      hutStyle = 'modern';
    }

    return (
      <g>
        {/* Hut shadow */}
        <ellipse
          cx={cx + shadowOffset}
          cy={GROUND_Y + 5}
          rx={35}
          ry={8}
          fill="#000"
          opacity={shadowOpacity}
        />

        {/* Enhanced pier with wood grain */}
        <defs>
          <pattern id="pierWood" x="0" y="0" width="20" height="4" patternUnits="userSpaceOnUse">
            <rect width="20" height="4" fill="#8B4513"/>
            <line x1="0" y1="2" x2="20" y2="2" stroke="#654321" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>

        {/* pier deck (slight sway by wind/waves) */}
        <rect x={cx - 80} y={GROUND_Y + 5 + Math.sin(frame * 0.02) * 0.5} width={160} height={3} fill="url(#pierWood)" stroke="#654321" strokeWidth="0.5" />

        {/* pier posts with better details */}
        {[-70, -35, 0, 35, 70].map((off, i) => (
          <g key={i}>
            {/* Post shadow in water */}
            <rect x={cx + off - 0.5} y={WATER_Y} width={1} height={15} fill="#000" opacity="0.2" />
            {/* Main post */}
            <rect x={cx + off - 1} y={GROUND_Y + 5} width={2} height={20} fill="#654321" />
            {/* Post top detail */}
            <rect x={cx + off - 1.5} y={GROUND_Y + 5} width={3} height={1} fill="#4A3020" />
            {/* Ripple on water */}
            <ellipse
              cx={cx + off}
              cy={WATER_Y - 1 + Math.sin(frame * 0.06 + i) * 0.3}
              rx={8 + Math.sin(frame * 0.1 + i) * 2}
              ry={2}
              fill="#000"
              opacity={0.08}
            />
            {/* Water reflection of post */}
            <rect
              x={cx + off - 0.5}
              y={WATER_Y + 2}
              width={1}
              height={8}
              fill="#654321"
              opacity={0.15 * (1 - Math.abs(Math.sin(frame * 0.05 + i)))}
            />
          </g>
        ))}

        {/* Primitive hut for prehistoric/antiquity */}
        {hutStyle === 'primitive' && (
          <>
            {/* Simple lean-to structure */}
            <polygon points={`${cx - 15},${GROUND_Y} ${cx - 12},${GROUND_Y - 20} ${cx + 12},${GROUND_Y - 20} ${cx + 15},${GROUND_Y}`}
                     fill="#8B7355" stroke="#654321" strokeWidth={0.5} />
            {/* Support poles */}
            <rect x={cx - 12} y={GROUND_Y - 20} width={2} height={20} fill="#654321" />
            <rect x={cx + 10} y={GROUND_Y - 20} width={2} height={20} fill="#654321" />
            {/* Thatch/hide covering */}
            <path d={`M ${cx - 14} ${GROUND_Y - 5} Q ${cx} ${GROUND_Y - 22} ${cx + 14} ${GROUND_Y - 5}`}
                  fill="#A0826D" opacity="0.7" />
            {/* Simple entrance */}
            <rect x={cx - 3} y={GROUND_Y - 8} width={6} height={8} fill="#4A3020" opacity="0.8" />
          </>
        )}

        {/* Medieval stilt hut (Asian) */}
        {hutStyle === 'stilt' && (
          <>
            {[ -25, -10, 7, 22 ].map((ox,i) => (
              <rect key={i} x={cx + ox} y={GROUND_Y - 15} width={3} height={25} fill="#8B4513" />
            ))}
            <rect x={cx - 28} y={GROUND_Y - 15} width={56} height={3} fill="#A0826D" />
            <rect x={cx - 20} y={GROUND_Y - 30} width={40} height={15} fill="#D2B48C" stroke="#A0826D" strokeWidth={1} />
            <polygon points={`${cx - 23},${GROUND_Y - 30} ${cx},${GROUND_Y - 38} ${cx + 23},${GROUND_Y - 30}`}
                     fill="#8B4513" stroke="#654321" strokeWidth={1} />
            {/* Add small window for medieval */}
            {isMedieval && (
              <rect x={cx - 3} y={GROUND_Y - 25} width={6} height={4} fill="#4A3020" />
            )}
          </>
        )}

        {hutStyle === 'thatched' && (
          <>
            <rect x={cx - 18} y={GROUND_Y - 20} width={36} height={20} fill="#D2B48C" stroke="#A0826D" strokeWidth={1} />
            <ellipse cx={cx} cy={GROUND_Y - 20} rx={20} ry={8} fill="#B8860B" stroke="#8B6508" strokeWidth={1} />
            <rect x={cx - 4} y={GROUND_Y - 10} width={8} height={10} fill="#654321" />
          </>
        )}

        {/* Medieval log cabin */}
        {hutStyle === 'log' && (
          <>
            {[0, 4, 8, 12, 16].map(offset => (
              <rect key={offset} x={cx - 20} y={GROUND_Y - 20 + offset} width={40} height={3} fill="#8B4513" stroke="#654321" strokeWidth={0.5} />
            ))}
            <polygon points={`${cx - 23},${GROUND_Y - 20} ${cx},${GROUND_Y - 30} ${cx + 23},${GROUND_Y - 20}`}
                     fill="#696969" stroke="#4A4A4A" strokeWidth={1} />
            {/* Door */}
            <rect x={cx - 3} y={GROUND_Y - 10} width={6} height={10} fill="#4A3020" />
            {/* Small window */}
            <rect x={cx + 8} y={GROUND_Y - 15} width={4} height={4} fill="#2B4C6F" opacity="0.7" />
            {/* Chimney only for medieval+ */}
            {(isMedieval || isEarlyModern) && (
              <>
                <rect x={cx + 12} y={GROUND_Y - 28} width={6} height={10} fill="#808080" />
                {[0,1,2].map(i => (
                  <circle key={i} cx={cx + 15 + i * 1.5} cy={GROUND_Y - 30 - ((frame + i*6) % 36) * 0.5} r={2 + i * 0.6} fill="#808080" opacity={0.25 - i*0.06} />
                ))}
              </>
            )}
          </>
        )}

        {/* Early Modern wooden structure */}
        {hutStyle === 'wooden' && (
          <>
            <defs>
              <pattern id="woodPattern" x="0" y="0" width="4" height="10" patternUnits="userSpaceOnUse">
                <rect width="4" height="10" fill="#A0826D"/>
                <line x1="0" y1="3" x2="4" y2="3" stroke="#8B4513" strokeWidth="0.3" opacity="0.5"/>
                <line x1="0" y1="7" x2="4" y2="7" stroke="#8B4513" strokeWidth="0.3" opacity="0.5"/>
              </pattern>
            </defs>

            {/* Main structure - larger for early modern */}
            <rect x={cx - 25} y={GROUND_Y - 28} width={50} height={28} fill="url(#woodPattern)" stroke="#8B4513" strokeWidth={1.5} />

            {/* Roof - better materials */}
            <polygon points={`${cx - 28},${GROUND_Y - 28} ${cx},${GROUND_Y - 42} ${cx + 28},${GROUND_Y - 28}`}
                     fill={isIndustrial ? '#4A4A4A' : '#6B4423'} stroke="#4A3020" strokeWidth={1} />

            {/* Chimney for heating/cooking */}
            <rect x={cx + 18} y={GROUND_Y - 38} width={7} height={12} fill="#808080" />
            {[0,1,2].map(i => (
              <circle key={i} cx={cx + 21.5 + i * 1.5} cy={GROUND_Y - 40 - ((frame + i*6) % 36) * 0.5}
                      r={2 + i * 0.6} fill="#808080" opacity={0.25 - i*0.06} />
            ))}

            {/* Door */}
            <rect x={cx - 4} y={GROUND_Y - 14} width={8} height={14} fill="#654321" stroke="#4A3020" strokeWidth={0.5} />
            {isIndustrial && (
              <circle cx={cx + 2} cy={GROUND_Y - 7} r={0.5} fill="#D4AF37" />
            )}

            {/* Windows - glass only after 1500s */}
            {isEarlyModern && (
              <>
                <rect x={cx - 16} y={GROUND_Y - 20} width={6} height={6} fill="#4A3020" stroke="#654321" strokeWidth={0.8} />
                <rect x={cx - 15.5} y={GROUND_Y - 19.5} width={5} height={5} fill="#87CEEB" opacity="0.6" />
                <rect x={cx + 10} y={GROUND_Y - 20} width={6} height={6} fill="#4A3020" stroke="#654321" strokeWidth={0.8} />
                <rect x={cx + 10.5} y={GROUND_Y - 19.5} width={5} height={5} fill="#87CEEB" opacity="0.6" />
              </>
            )}

            {/* Industrial additions */}
            {isIndustrial && (
              <>
                {/* Larger windows with better glass */}
                <rect x={cx - 18} y={GROUND_Y - 22} width={8} height={8} fill="#4A3020" stroke="#654321" strokeWidth={0.8} />
                <rect x={cx - 17.5} y={GROUND_Y - 21.5} width={7} height={7} fill="#87CEEB" />
                <line x1={cx - 14} y1={GROUND_Y - 22} x2={cx - 14} y2={GROUND_Y - 14} stroke="#654321" strokeWidth="0.4" />
                <line x1={cx - 18} y1={GROUND_Y - 18} x2={cx - 10} y2={GROUND_Y - 18} stroke="#654321" strokeWidth="0.4" />

                <rect x={cx + 10} y={GROUND_Y - 22} width={8} height={8} fill="#4A3020" stroke="#654321" strokeWidth={0.8} />
                <rect x={cx + 10.5} y={GROUND_Y - 21.5} width={7} height={7} fill="#87CEEB" />
                <line x1={cx + 14} y1={GROUND_Y - 22} x2={cx + 14} y2={GROUND_Y - 14} stroke="#654321" strokeWidth="0.4" />
                <line x1={cx + 10} y1={GROUND_Y - 18} x2={cx + 18} y2={GROUND_Y - 18} stroke="#654321" strokeWidth="0.4" />

                {/* Sign - only for industrial */}
                <rect x={cx - 10} y={GROUND_Y - 34} width={20} height={8} fill="#8B4513" stroke="#654321" strokeWidth="0.5" />
                <text x={cx} y={GROUND_Y - 28} textAnchor="middle" fill="#F5DEB3" fontSize="5" fontFamily="serif">FISHING</text>
              </>
            )}
          </>
        )}

        {/* Modern concrete/metal structure */}
        {hutStyle === 'modern' && (
          <>
            {/* Concrete base */}
            <rect x={cx - 30} y={GROUND_Y - 2} width={60} height={3} fill="#A9A9A9" />

            {/* Metal/concrete structure */}
            <rect x={cx - 28} y={GROUND_Y - 30} width={56} height={30} fill="#D3D3D3" stroke="#808080" strokeWidth={1} />

            {/* Flat modern roof */}
            <rect x={cx - 30} y={GROUND_Y - 32} width={60} height={3} fill="#808080" />

            {/* Large modern windows */}
            <rect x={cx - 22} y={GROUND_Y - 24} width={12} height={12} fill="#4A7C8E" stroke="#606060" strokeWidth={1} />
            <rect x={cx - 21} y={GROUND_Y - 23} width={10} height={10} fill="#87CEEB" />
            <line x1={cx - 16} y1={GROUND_Y - 24} x2={cx - 16} y2={GROUND_Y - 12} stroke="#606060" strokeWidth="0.5" />
            <line x1={cx - 22} y1={GROUND_Y - 18} x2={cx - 10} y2={GROUND_Y - 18} stroke="#606060" strokeWidth="0.5" />

            <rect x={cx + 10} y={GROUND_Y - 24} width={12} height={12} fill="#4A7C8E" stroke="#606060" strokeWidth={1} />
            <rect x={cx + 11} y={GROUND_Y - 23} width={10} height={10} fill="#87CEEB" />
            <line x1={cx + 16} y1={GROUND_Y - 24} x2={cx + 16} y2={GROUND_Y - 12} stroke="#606060" strokeWidth="0.5" />
            <line x1={cx + 10} y1={GROUND_Y - 18} x2={cx + 22} y2={GROUND_Y - 18} stroke="#606060" strokeWidth="0.5" />

            {/* Modern door */}
            <rect x={cx - 4} y={GROUND_Y - 16} width={8} height={16} fill="#606060" />
            <rect x={cx - 3} y={GROUND_Y - 15} width={6} height={10} fill="#87CEEB" opacity="0.8" />
            <rect x={cx + 1.5} y={GROUND_Y - 8} width={1} height={2} fill="#C0C0C0" />

            {/* Neon sign */}
            <rect x={cx - 12} y={GROUND_Y - 36} width={24} height={10} fill="#2A2A2A" stroke="#FF0000" strokeWidth="0.5" />
            <text x={cx} y={GROUND_Y - 29} textAnchor="middle" fill="#FF69B4" fontSize="6" fontFamily="sans-serif">BAIT SHOP</text>

            {/* Air conditioning unit */}
            <rect x={cx + 24} y={GROUND_Y - 20} width={4} height={4} fill="#A9A9A9" stroke="#606060" strokeWidth="0.5" />
          </>
        )}

        {/* Era-appropriate fishing methods */}
        {/* Only show nets from Medieval onward */}
        {(isMedieval || isEarlyModern || isIndustrial || isModernEra) && (
          <g opacity={0.7}>
            <path d={`M ${cx - 35} ${GROUND_Y - 10} Q ${cx - 30 + Math.sin(frame * 0.05) * windDirection * 2} ${GROUND_Y - 5} ${cx - 25} ${GROUND_Y - 10}`}
                  stroke="#8B7355" strokeWidth={0.5} fill="none" />
            {[0, 2, 4, 6, 8].map(i => (
              <line key={i}
                    x1={cx - 35 + i * 1.2}
                    y1={GROUND_Y - 10 + i * 0.5}
                    x2={cx - 35 + i * 1.2 + Math.sin(frame * 0.05 + i * 0.5) * windDirection}
                    y2={GROUND_Y - 5 + i * 0.3}
                    stroke="#8B7355" strokeWidth={0.3} />
            ))}
            {/* Net mesh details for modern eras */}
            {(isEarlyModern || isIndustrial || isModernEra) && [0, 1, 2, 3].map(i => (
              <line key={`mesh_${i}`}
                    x1={cx - 33 + i * 2}
                    y1={GROUND_Y - 8 + i * 0.3}
                    x2={cx - 31 + i * 2}
                    y2={GROUND_Y - 7 + i * 0.3}
                    stroke="#8B7355"
                    strokeWidth={0.2}
                    opacity={0.5} />
            ))}
          </g>
        )}

        {/* Era-appropriate fish processing */}
        {/* Primitive: Simple drying on rocks/ground */}
        {(isPrehistoric || isAntiquity) && (
          <>
            {/* Flat stones for drying */}
            <ellipse cx={cx + 35} cy={GROUND_Y - 1} rx={6} ry={2} fill="#696969" />
            <ellipse cx={cx + 45} cy={GROUND_Y - 1} rx={5} ry={1.5} fill="#808080" />
            {/* Fish laid on stones */}
            <ellipse cx={cx + 35} cy={GROUND_Y - 2} rx={1.2} ry={2.5} fill="#C0C0C0" />
            <ellipse cx={cx + 38} cy={GROUND_Y - 2} rx={1} ry={2} fill="#B8B8B8" />
            <ellipse cx={cx + 45} cy={GROUND_Y - 2} rx={1.1} ry={2.2} fill="#D0D0D0" />
          </>
        )}

        {/* Medieval and later: Proper drying racks */}
        {(isMedieval || isEarlyModern || isIndustrial) && (
          <>
            <rect x={cx + 30} y={GROUND_Y - 8} width={20} height={1.5} fill="#8B4513" stroke="#654321" strokeWidth="0.3" />
            <rect x={cx + 33} y={GROUND_Y - 8} width={1.5} height={8} fill="#654321" />
            <rect x={cx + 46} y={GROUND_Y - 8} width={1.5} height={8} fill="#654321" />
            <line x1={cx + 33} y1={GROUND_Y - 4} x2={cx + 46} y2={GROUND_Y - 4} stroke="#8B4513" strokeWidth="0.5" />
            {[0,1,2].map(i => (
              <g key={i}>
                <ellipse cx={cx + 36 + i * 4} cy={GROUND_Y - 6 + Math.sin(frame * 0.02 + i) * 0.3}
                         rx={1.5} ry={3} fill="#C0C0C0" stroke="#808080" strokeWidth={0.5} />
                <circle cx={cx + 36 + i * 4 - 0.5} cy={GROUND_Y - 6} r={0.3} fill="#A8A8A8" opacity="0.5" />
                <circle cx={cx + 36 + i * 4 + 0.5} cy={GROUND_Y - 5} r={0.3} fill="#A8A8A8" opacity="0.5" />
                <circle cx={cx + 36 + i * 4 + 0.7} cy={GROUND_Y - 7} r={0.2} fill="#000" />
                <line x1={cx + 36 + i * 4} y1={GROUND_Y - 8} x2={cx + 36 + i * 4} y2={GROUND_Y - 9}
                      stroke="#8B7355" strokeWidth="0.3" />
              </g>
            ))}
          </>
        )}

        {/* Modern: Refrigeration/processing equipment */}
        {isModernEra && (
          <>
            {/* Ice box/freezer */}
            <rect x={cx + 30} y={GROUND_Y - 12} width={15} height={12} fill="#E6E6FA" stroke="#C0C0C0" strokeWidth={1} />
            <rect x={cx + 32} y={GROUND_Y - 10} width={11} height={2} fill="#4169E1" />
            <text x={cx + 37.5} y={GROUND_Y - 8.5} textAnchor="middle" fill="#FFFFFF" fontSize="3" fontFamily="sans-serif">FRESH</text>
            {/* Vent */}
            <rect x={cx + 40} y={GROUND_Y - 11} width={3} height={1} fill="#808080" />
          </>
        )}

        {/* Era-appropriate storage */}
        <g>
          {/* Primitive: Simple baskets or hide bundles */}
          {(isPrehistoric || isAntiquity) && (
            <>
              {/* Woven basket */}
              <ellipse cx={cx - 42} cy={GROUND_Y - 2} rx={4} ry={2} fill="#8B7355" stroke="#654321" strokeWidth={0.5} />
              <ellipse cx={cx - 42} cy={GROUND_Y - 4} rx={3.5} ry={1.5} fill="none" stroke="#654321" strokeWidth={0.3} />
              {/* Hide bundle */}
              <ellipse cx={cx - 50} cy={GROUND_Y - 1} rx={3} ry={2} fill="#A0826D" />
              <path d={`M ${cx - 53} ${GROUND_Y - 2} Q ${cx - 50} ${GROUND_Y - 4} ${cx - 47} ${GROUND_Y - 2}`} stroke="#8B7355" strokeWidth="0.5" fill="none" />
            </>
          )}

          {/* Medieval: Simple wooden containers */}
          {isMedieval && (
            <>
              <rect x={cx - 45} y={GROUND_Y - 4} width={5} height={4} fill="#8B4513" stroke="#654321" strokeWidth={0.5} />
              <ellipse cx={cx - 52} cy={GROUND_Y} rx={2.5} ry={1} fill="#8B4513" />
              <rect x={cx - 54.5} y={GROUND_Y - 5} width={5} height={5} fill="#8B4513" />
              <ellipse cx={cx - 52} cy={GROUND_Y - 5} rx={2.5} ry={1} fill="#A0826D" />
            </>
          )}

          {/* Early Modern/Industrial: Proper crates and barrels */}
          {(isEarlyModern || isIndustrial) && (
            <>
              <rect x={cx - 45} y={GROUND_Y - 5} width={6} height={5} fill="#8B4513" stroke="#654321" strokeWidth={0.5} />
              <line x1={cx - 45} y1={GROUND_Y - 3} x2={cx - 39} y2={GROUND_Y - 3} stroke="#654321" strokeWidth="0.3" />
              <line x1={cx - 42} y1={GROUND_Y - 5} x2={cx - 42} y2={GROUND_Y} stroke="#654321" strokeWidth="0.3" />
              <ellipse cx={cx - 42} cy={GROUND_Y - 5} rx={3} ry={1} fill="#A0826D" stroke="#654321" strokeWidth="0.3" />

              <ellipse cx={cx - 52} cy={GROUND_Y} rx={3} ry={1} fill="#8B4513" />
              <rect x={cx - 55} y={GROUND_Y - 6} width={6} height={6} fill="#8B4513" />
              <ellipse cx={cx - 52} cy={GROUND_Y - 6} rx={3} ry={1} fill="#A0826D" />
              <rect x={cx - 55} y={GROUND_Y - 5} width={6} height={0.5} fill="#4A4A4A" />
              <rect x={cx - 55} y={GROUND_Y - 2} width={6} height={0.5} fill="#4A4A4A" />
            </>
          )}

          {/* Modern: Metal containers and coolers */}
          {isModernEra && (
            <>
              <rect x={cx - 45} y={GROUND_Y - 6} width={8} height={6} fill="#A9A9A9" stroke="#606060" strokeWidth={0.5} />
              <rect x={cx - 44} y={GROUND_Y - 5.5} width={6} height={1} fill="#C0C0C0" />
              <rect x={cx - 55} y={GROUND_Y - 8} width={8} height={8} fill="#4169E1" stroke="#000080" strokeWidth={0.5} />
              <rect x={cx - 54} y={GROUND_Y - 7} width={6} height={1} fill="#FFFFFF" />
              <text x={cx - 51} y={GROUND_Y - 4.5} textAnchor="middle" fill="#FFFFFF" fontSize="3" fontFamily="sans-serif">ICE</text>
            </>
          )}
        </g>

        {/* Era-appropriate lighting */}
        {night && (
          <g>
            {/* Prehistoric/Antiquity: Simple torch or fire */}
            {(isPrehistoric || isAntiquity) && (
              <g>
                {/* Torch post */}
                <rect x={cx - 20} y={GROUND_Y - 15} width={2} height={15} fill="#654321" />
                {/* Fire */}
                <g style={{ mixBlendMode: 'screen', isolation: 'isolate' }}>
                  {[0, 1, 2].map(i => (
                    <ellipse key={i}
                             cx={cx - 19 + Math.sin(frame * 0.3 + i) * 1}
                             cy={GROUND_Y - 18 - i * 2}
                             rx={3 - i * 0.5}
                             ry={4 - i * 0.5}
                             fill={i === 0 ? '#FF6347' : i === 1 ? '#FFA500' : '#FFD700'}
                             opacity={0.7 - i * 0.2} />
                  ))}
                </g>
              </g>
            )}

            {/* Medieval: Oil lamp or candle lantern */}
            {isMedieval && (
              <g>
                <rect x={cx - 22} y={GROUND_Y - 25} width={4} height={5} fill="#8B4513" />
                <rect x={cx - 21} y={GROUND_Y - 24} width={2} height={3} fill="#FFD700" opacity="0.8" />
                <g style={{ mixBlendMode: 'screen', isolation: 'isolate' }}>
                  <circle cx={cx - 20} cy={GROUND_Y - 23} r={6 + Math.sin(frame*0.2)*0.5} fill="#FFD700" opacity={0.5}/>
                  <circle cx={cx - 20} cy={GROUND_Y - 23} r={10 + Math.sin(frame*0.2)*0.8} fill="#FFA500" opacity={0.2}/>
                </g>
              </g>
            )}

            {/* Early Modern/Industrial: Proper lantern */}
            {(isEarlyModern || isIndustrial) && (
              <g>
                <rect x={cx - 24} y={GROUND_Y - 30} width={6} height={7} fill="#B77A2A" stroke="#8B4513" strokeWidth="0.5" />
                <rect x={cx - 23} y={GROUND_Y - 29} width={4} height={5} fill="#FFD86B" opacity="0.8" />
                <polygon points={`${cx - 24.5},${GROUND_Y - 30} ${cx - 21},${GROUND_Y - 32} ${cx - 17.5},${GROUND_Y - 30}`}
                         fill="#4A3020" stroke="#654321" strokeWidth="0.3" />
                <g style={{ mixBlendMode: 'screen', isolation: 'isolate' }}>
                  <circle cx={cx - 21} cy={GROUND_Y - 27} r={8 + Math.sin(frame*0.15)*0.8} fill="#FFD86B" opacity={0.6}/>
                  <circle cx={cx - 21} cy={GROUND_Y - 27} r={15 + Math.sin(frame*0.15)*1.2} fill="#FFE08A" opacity={0.3}/>
                </g>
              </g>
            )}

            {/* Modern: Electric lights */}
            {isModernEra && (
              <g>
                {/* Fluorescent light on building */}
                <rect x={cx - 15} y={GROUND_Y - 31} width={30} height={2} fill="#FFFFFF" stroke="#C0C0C0" strokeWidth="0.5" />
                <rect x={cx - 14} y={GROUND_Y - 30.5} width={28} height={1} fill="#F0F8FF" opacity="0.9" />
                {/* Light glow */}
                <ellipse cx={cx} cy={GROUND_Y - 20} rx={40} ry={20} fill="#FFFFFF" opacity="0.1" />
              </g>
            )}
          </g>
        )}

        {/* Era-appropriate tools and equipment */}
        {/* Primitive: Simple spears and basic tools */}
        {(isPrehistoric || isAntiquity) && (
          <>
            <line x1={cx - 30} y1={GROUND_Y - 12} x2={cx - 22} y2={GROUND_Y - 2} stroke="#654321" strokeWidth="1.5" />
            <polygon points={`${cx - 30},${GROUND_Y - 12} ${cx - 32},${GROUND_Y - 10} ${cx - 28},${GROUND_Y - 10}`} fill="#696969" />
            <line x1={cx - 25} y1={GROUND_Y - 10} x2={cx - 18} y2={GROUND_Y - 1} stroke="#654321" strokeWidth="1.2" />
            <polygon points={`${cx - 25},${GROUND_Y - 10} ${cx - 27},${GROUND_Y - 8} ${cx - 23},${GROUND_Y - 8}`} fill="#4A4A4A" />
          </>
        )}

        {/* Medieval and later: Fishing equipment */}
        {(isMedieval || isEarlyModern || isIndustrial) && (
          <>
            <g transform={`translate(${cx + 25}, ${GROUND_Y - 3})`}>
              <ellipse cx={0} cy={0} rx={3} ry={1.5} fill="none" stroke="#8B7355" strokeWidth="0.8" />
              <ellipse cx={0} cy={0.5} rx={3} ry={1.5} fill="none" stroke="#8B7355" strokeWidth="0.8" />
              <ellipse cx={0} cy={1} rx={3} ry={1.5} fill="none" stroke="#8B7355" strokeWidth="0.8" />
            </g>

            <line x1={cx - 28} y1={GROUND_Y - 15} x2={cx - 20} y2={GROUND_Y - 18} stroke="#654321" strokeWidth="1" />
            <line x1={cx - 26} y1={GROUND_Y - 14} x2={cx - 18} y2={GROUND_Y - 17} stroke="#654321" strokeWidth="1" />
            <line x1={cx - 24} y1={GROUND_Y - 13} x2={cx - 16} y2={GROUND_Y - 16} stroke="#654321" strokeWidth="1" />
          </>
        )}

        {/* Modern: Advanced equipment */}
        {isModernEra && (
          <>
            {/* Tackle box */}
            <rect x={cx + 20} y={GROUND_Y - 4} width={8} height={4} fill="#4169E1" stroke="#000080" strokeWidth="0.5" />
            <rect x={cx + 21} y={GROUND_Y - 3.5} width={6} height={1} fill="#87CEEB" />
            {/* Rod holders */}
            <rect x={cx - 30} y={GROUND_Y - 8} width={12} height={2} fill="#A9A9A9" stroke="#606060" strokeWidth="0.5" />
            <circle cx={cx - 27} cy={GROUND_Y - 7} r={0.8} fill="none" stroke="#606060" strokeWidth="0.5" />
            <circle cx={cx - 21} cy={GROUND_Y - 7} r={0.8} fill="none" stroke="#606060" strokeWidth="0.5" />
            {/* Modern fishing rods */}
            <line x1={cx - 27} y1={GROUND_Y - 7} x2={cx - 20} y2={GROUND_Y - 20} stroke="#4169E1" strokeWidth="1.5" />
            <line x1={cx - 21} y1={GROUND_Y - 7} x2={cx - 14} y2={GROUND_Y - 18} stroke="#228B22" strokeWidth="1.5" />
          </>
        )}
      </g>
    );
  };

  const renderFishermen = () => (
    <g>
      {fishermenPos.map((f, i) => (
        <g key={i} transform={`translate(${f.x}, ${GROUND_Y + 7})`}>
          <rect x={-2} y={-8} width={4} height={6} fill="#556B2F" />
          <rect x={-1.5} y={-10} width={3} height={2} fill="#FFDBAC" />
          <rect x={-2.5} y={-11} width={5} height={1} fill="#8B4513" />
          <rect x={-1.5} y={-12} width={3} height={1} fill="#8B4513" />
          <rect x={-1.5} y={-2} width={1} height={4} fill="#654321" />
          <rect x={0.5} y={-2} width={1} height={4} fill="#654321" />
          {/* rod + line */}
          <rect x={2} y={-7} width={8} height={0.5} fill="#8B4513" />
          <line x1={10} y1={-7} x2={10} y2={f.casting ? 5 : 10} stroke="#F5F5F5" strokeWidth={0.3} />
          {/* bucket */}
          <rect x={-4} y={-1} width={2} height={2} fill="#606060" />
          {/* cold breath */}
          {isCold && (
            <circle cx={-0.5 + Math.sin(frame*0.1 + i)*0.5} cy={-10 - ((frame + i*9) % 22)*0.2} r={0.8} fill="#E6F0FF" opacity={0.25}/>
          )}
          {/* Reaction bubble */}
          {fishermenReaction && i === 0 && (
            <g>
              <rect x={5} y={-20} width={80} height={16} fill="white" stroke="#333" strokeWidth={0.5} rx={8} opacity={0.9} />
              <text x={45} y={-8} textAnchor="middle" fill="#333" fontSize="10" fontFamily="sans-serif">
                {fishermenReaction}
              </text>
            </g>
          )}
        </g>
      ))}
    </g>
  );

  const renderOcean = () => (
    <g>
      <defs>
        <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={ocean.shallow} stopOpacity={0.85} />
          <stop offset="100%" stopColor={ocean.deep} stopOpacity={0.98} />
        </linearGradient>
        {/* Shimmer effect for water surface */}
        <filter id="waterShimmer">
          <feTurbulence baseFrequency="0.02" numOctaves="2" result="turbulence" seed={seed} />
          <feColorMatrix in="turbulence" type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="discrete" tableValues="0 0.1 0.1 0.2 0.2 0.1 0.1 0" />
          </feComponentTransfer>
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>
      {/* body */}
      <rect x={0} y={WATER_Y} width={width} height={height - WATER_Y} fill="url(#oceanGradient)" />

      {/* Water surface shimmer */}
      <rect x={0} y={WATER_Y} width={width} height={10} fill="white" opacity="0.15" filter="url(#waterShimmer)" />

      {/* Reflections of the hut */}
      {tod !== 'night' && (
        <g opacity={0.2} transform={`translate(0, ${WATER_Y * 2 - GROUND_Y + 25}) scale(1, -0.8)`}>
          <rect x={width/2 - 20} y={GROUND_Y - 25} width={40} height={25} fill="#A0826D" />
          <polygon points={`${width/2 - 23},${GROUND_Y - 25} ${width/2},${GROUND_Y - 36} ${width/2 + 23},${GROUND_Y - 25}`} fill="#6B4423" />
        </g>
      )}

      {/* Moonlight/sunlight path on water */}
      {(tod === 'night' || tod === 'dusk' || tod === 'dawn') && (
        <ellipse
          cx={width * (tod === 'dawn' ? 0.3 : tod === 'dusk' ? 0.7 : 0.5)}
          cy={WATER_Y + 20}
          rx={30 + Math.sin(frame * 0.02) * 5}
          ry={height - WATER_Y - 20}
          fill={tod === 'night' ? '#E6E6FA' : '#FFD700'}
          opacity={0.15}
        />
      )}
      {/* wave layers with phase offsets */}
      {[0,1,2].map(layer => {
        const waveY = WATER_Y + layer * 8;
        const phase = (frame * (reduced ? 0.6 : 1)) + layer * 15;
        const heightPx = 4 - layer;
        return (
          <g key={layer} opacity={0.9 - layer * 0.2}>
            <path
              d={`M 0 ${waveY} ${Array.from({ length: 18 }, (_, i) => {
                const x = i * (width / 17);
                const y = waveY + Math.sin((x + phase) * 0.02) * heightPx;
                return `Q ${x - 15} ${y - heightPx} ${x} ${y}`;
              }).join(' ')} L ${width} ${height} L 0 ${height} Z`}
              fill={layer === 0 ? ocean.shallow : ocean.deep}
            />
          </g>
        );
      })}
      {/* crests */}
      {Array.from({ length: 6 }, (_, i) => {
        const t = (frame * 1.2 + i * 90) % width;
        const x = (t + i * 40) % width;
        const y = WATER_Y + Math.sin((x + frame) * 0.02) * 3;
        return <ellipse key={i} cx={x} cy={y} rx={14} ry={2} fill={ocean.foam} opacity={0.65} />;
      })}

      {/* seaweed (temperate) */}
      {climate === ClimateType.TEMPERATE && (
        <>
          {[0,1,2].map(i => {
            const x = 50 + i * Math.max(120, width/5);
            return (
              <path key={i}
                d={`M ${x} ${height} Q ${x + Math.sin(frame * 0.05 + i) * 6} ${height - 20} ${x + Math.sin(frame * 0.05 + i + 1) * 9} ${height - 36}`}
                stroke="#2E8B57" strokeWidth={3} fill="none" opacity={0.6}/>
            );
          })}
        </>
      )}

      {/* coral (tropical) */}
      {isTropical && (
        <>
          {[0,1].map(i => {
            const cx = 100 + i * Math.max(160, width/3);
            return (
              <g key={i} opacity={0.75}>
                <circle cx={cx} cy={height - 10} r={8} fill="#FF6B6B" />
                <circle cx={cx - 5} cy={height - 8} r={6} fill="#FFB6C1" />
                <circle cx={cx + 6} cy={height - 12} r={5} fill="#FF69B4" />
              </g>
            );
          })}
        </>
      )}

      {/* Jumping fish animations */}
      {jumpingFish.map((fish, i) => (
        <g key={`jumping_fish_${i}`} transform={`translate(${fish.x}, ${fish.y})`}>
          <g transform={`rotate(${Math.atan2(fish.vy, fish.vx) * 180 / Math.PI + 90})`}>
            <ellipse cx={0} cy={0} rx={fish.size * 0.4} ry={fish.size} fill="#4682B4" stroke="#2E5A8E" strokeWidth="0.5" />
            <ellipse cx={0} cy={-fish.size * 0.3} rx={fish.size * 0.3} ry={fish.size * 0.5} fill="#5A92C4" />
            {/* Tail fin */}
            <polygon points={`0,${fish.size * 0.5} ${-fish.size * 0.3},${fish.size} ${fish.size * 0.3},${fish.size}`}
                     fill="#4682B4" stroke="#2E5A8E" strokeWidth="0.3" />
            {/* Eye */}
            <circle cx={fish.size * 0.2} cy={-fish.size * 0.3} r={fish.size * 0.08} fill="#000" />
            {/* Scales shimmer */}
            <ellipse cx={0} cy={0} rx={fish.size * 0.2} ry={fish.size * 0.6} fill="#87CEEB" opacity="0.3" />
          </g>
          {/* Water splash where fish emerged */}
          {fish.phase < 0.2 && (
            <g>
              <circle cx={0} cy={WATER_Y - fish.y} r={fish.size * 2 * fish.phase * 5} fill="none" stroke={ocean.foam} strokeWidth="1" opacity={1 - fish.phase * 5} />
              {[0, 1, 2, 3].map(j => (
                <circle key={j} cx={Math.cos(j * Math.PI / 2) * fish.size} cy={WATER_Y - fish.y + Math.sin(j * Math.PI / 2) * fish.size}
                        r={1} fill={ocean.foam} opacity={0.8 - fish.phase * 4} />
              ))}
            </g>
          )}
        </g>
      ))}

      {/* Climate-aware ambient animations */}
      {ambientAnimations.map((element, i) => (
        <g key={`ambient_${i}`} transform={`translate(${element.x}, ${element.y})`}>
          {element.type === 'boat' && (
            <g>
              <ellipse cx={0} cy={0} rx={element.size} ry={element.size * 0.3} fill="#8B4513" />
              <rect x={-element.size * 0.8} y={-2} width={element.size * 1.6} height={4} rx={2} fill="#D2691E" />
              <line x1={0} y1={-2} x2={0} y2={-element.size * 0.8} stroke="#654321" strokeWidth={1} />
              <polygon points={`0,-${element.size * 0.8} ${element.size * 0.4},-${element.size * 0.6} 0,-${element.size * 0.4}`} fill="#F5DEB3" />
            </g>
          )}
          {element.type === 'dolphin' && (
            <g>
              <ellipse cx={0} cy={0} rx={element.size} ry={element.size * 0.4} fill="#4682B4" />
              <ellipse cx={element.size * 0.6} cy={-element.size * 0.1} rx={element.size * 0.4} ry={element.size * 0.3} fill="#4682B4" />
              <polygon points={`${element.size},0 ${element.size * 1.3},-${element.size * 0.3} ${element.size * 1.3},${element.size * 0.3}`} fill="#4682B4" />
              <circle cx={element.size * 0.7} cy={-element.size * 0.2} r={1} fill="#000" />
            </g>
          )}
          {element.type === 'bird' && (
            <g>
              <ellipse cx={0} cy={0} rx={element.size * 0.6} ry={element.size * 0.3} fill="#696969" />
              <circle cx={element.size * 0.4} cy={-element.size * 0.1} r={element.size * 0.2} fill="#696969" />
              {/* Animated wings */}
              <g transform={`rotate(${Math.sin(frame * 0.3 + element.phase) * 20})`}>
                <ellipse cx={-element.size * 0.3} cy={-element.size * 0.2} rx={element.size * 0.8} ry={element.size * 0.1} fill="#556B2F" />
                <ellipse cx={element.size * 0.3} cy={-element.size * 0.2} rx={element.size * 0.8} ry={element.size * 0.1} fill="#556B2F" />
              </g>
            </g>
          )}
          {element.type === 'whale' && (
            <g>
              <ellipse cx={0} cy={0} rx={element.size} ry={element.size * 0.3} fill="#2F4F4F" />
              <ellipse cx={element.size * 0.7} cy={-element.size * 0.1} rx={element.size * 0.3} ry={element.size * 0.2} fill="#2F4F4F" />
              <polygon points={`${-element.size * 0.8},0 ${-element.size * 1.2},-${element.size * 0.4} ${-element.size * 1.2},${element.size * 0.4}`} fill="#2F4F4F" />
              {/* Water spout */}
              {Math.sin(frame * 0.02 + element.phase) > 0.7 && (
                <g>
                  <line x1={element.size * 0.6} y1={-element.size * 0.3} x2={element.size * 0.6} y2={-element.size * 0.8} stroke="#87CEEB" strokeWidth={2} />
                  <circle cx={element.size * 0.6} cy={-element.size * 0.8} r={2} fill="#87CEEB" opacity={0.7} />
                </g>
              )}
            </g>
          )}
          {element.type === 'seals' && (
            <g>
              <ellipse cx={0} cy={0} rx={element.size * 0.8} ry={element.size * 0.4} fill="#4A4A4A" />
              <circle cx={element.size * 0.5} cy={-element.size * 0.2} r={element.size * 0.25} fill="#4A4A4A" />
              <polygon points={`${-element.size * 0.6},0 ${-element.size * 0.9},-${element.size * 0.2} ${-element.size * 0.9},${element.size * 0.2}`} fill="#4A4A4A" />
            </g>
          )}
        </g>
      ))}

      {/* ice floes with reflections */}
      {isCold && iceFloes.map((fl, i) => (
        <g key={i}>
          <rect x={fl.x} y={WATER_Y - 5} width={fl.size} height={8} rx={2} fill="#E0F7FF" stroke="#B0E0FF" strokeWidth={1} />
          <rect x={fl.x + 2} y={WATER_Y - 3} width={fl.size - 4} height={2} fill="#F0FFFF" opacity={0.85} />
          {/* Ice reflection */}
          <rect x={fl.x + 1} y={WATER_Y + 3} width={fl.size - 2} height={4} fill="#E0F7FF" opacity={0.2} />
        </g>
      ))}

      {/* Additional water details */}
      {/* Ripples from wind */}
      {waveReflections.map((refl, i) => (
        <ellipse
          key={`ripple_${i}`}
          cx={refl.x + Math.sin(frame * 0.03 + refl.phase) * 10}
          cy={WATER_Y + 10 + i * 5}
          rx={15 + Math.sin(frame * 0.05 + refl.phase) * 3}
          ry={2}
          fill="none"
          stroke={ocean.foam}
          strokeWidth="0.5"
          opacity={refl.intensity * 0.5}
        />
      ))}
    </g>
  );

  const renderBoat = () => {
    const cx = width * 0.7 + boatX;
    const eraNum = parseInt(era, 10) || 0;
    const isPrehistoric = eraNum < -3000;
    const isAntiquity = eraNum >= -3000 && eraNum < 500;
    const isMedieval = eraNum >= 500 && eraNum < 1500;
    const isEarlyModern = eraNum >= 1500 && eraNum < 1800;
    const isIndustrial = eraNum >= 1800 && eraNum < 1950;
    const isModernEra = eraNum >= 1950;

    return (
      <g transform={`translate(${cx}, ${WATER_Y - 5 + boatYBob})`}>
        {/* Boat shadow/reflection in water */}
        <ellipse cx={0} cy={12} rx={18} ry={4} fill="#000" opacity="0.15" />

        {/* Prehistoric: Simple log or reed raft */}
        {(isPrehistoric || isAntiquity) && (
          <>
            <ellipse cx={0} cy={5} rx={20} ry={3} fill="#8B7355" stroke="#654321" strokeWidth={0.5} />
            {/* Log details */}
            <line x1="-15" y1="4" x2="15" y2="4" stroke="#654321" strokeWidth="0.3" />
            <line x1="-15" y1="6" x2="15" y2="6" stroke="#654321" strokeWidth="0.3" />
            {/* Simple fisher */}
            <g transform="translate(0, 2)">
              <rect x={-1} y={-4} width={2} height={3} fill="#A0826D" />
              <circle cx={0} cy={-5} r={1} fill="#FFDBAC" />
              {/* Simple spear */}
              <line x1={2} y1={-4} x2={8} y2={-10} stroke="#654321" strokeWidth="0.8" />
              <polygon points="8,-10 6,-12 10,-12" fill="#696969" />
            </g>
          </>
        )}

        {/* Medieval: Rowing boat */}
        {isMedieval && (
          <>
            <path d="M -15 5 Q -15 8 -10 10 L 10 10 Q 15 8 15 5 Z" fill="#8B4513" stroke="#654321" strokeWidth={1} />
            <rect x="-8" y="4" width="16" height="1" fill="#A0826D" />
            {/* Fisher */}
            <g transform="translate(0, 2)">
              <rect x={-1.5} y={-5} width={3} height={4} fill="#8B4513" />
              <circle cx={0} cy={-6} r={1.5} fill="#FFDBAC" />
              <line x1={2} y1={-4} x2={6} y2={-8} stroke="#654321" strokeWidth="0.5" />
              <line x1={6} y1={-8} x2={6} y2={Math.sin(frame * 0.1) * 2} stroke="#F5F5F5" strokeWidth="0.3" />
            </g>
            {/* Oars */}
            <rect x="-12" y="3" width="8" height="0.8" fill="#8B4513" transform={`rotate(${Math.sin(frame * 0.03) * 5} -8 3)`} />
            <rect x="4" y="3" width="8" height="0.8" fill="#8B4513" transform={`rotate(${-Math.sin(frame * 0.03) * 5} 8 3)`} />
          </>
        )}

        {/* Early Modern: Sailing boat */}
        {isEarlyModern && (
          <>
            <path d="M -15 5 Q -15 8 -10 10 L 10 10 Q 15 8 15 5 Z" fill="#8B4513" stroke="#654321" strokeWidth={1} />
            <line x1="-12" y1="6" x2="12" y2="6" stroke="#654321" strokeWidth="0.3" />
            <rect x="-8" y="4" width="16" height="1" fill="#A0826D" />
            {/* Mast with wind effect */}
            <rect x={-0.5} y={-15} width={1} height={20} fill="#654321" />
            {/* Sail billowing with wind */}
            <path d={`M -8,-12 Q ${-4 + windDirection * 3},-10 ${4 + windDirection * 2},-8 L ${4 + windDirection},-0 Q ${-2 + windDirection * 2},2 -8,-4 Z`}
                  fill="#F5F5DC" stroke="#D2B48C" strokeWidth={0.5} opacity={0.9} />
            {/* Rigging */}
            <line x1="0" y1="-15" x2="-8" y2="-4" stroke="#8B7355" strokeWidth="0.3" />
            <line x1="0" y1="-15" x2="8" y2="-8" stroke="#8B7355" strokeWidth="0.3" />
            {/* Fisher */}
            <g transform="translate(0, 2)">
              <rect x={-1.5} y={-5} width={3} height={4} fill="#8B4513" />
              <circle cx={0} cy={-6} r={1.5} fill="#FFDBAC" />
              <rect x={-2} y={-7.5} width={4} height={1} fill="#4A4A4A" />
              <path d={`M 2 -4 Q 4 -6 6 -8 Q ${7 + (gameEvent === 'catch' ? 1 : 0)} ${-7 + (gameEvent === 'catch' ? 2 : 0)} ${6} ${Math.sin(frame * 0.1) * 2}`}
                    stroke="#654321" strokeWidth="0.5" fill="none" />
              <line x1={6} y1={-8 + (gameEvent === 'catch' ? 2 : 0)} x2={6} y2={Math.sin(frame * 0.1) * 2 + (gameEvent === 'catch' ? 3 : 0)}
                    stroke="#F5F5F5" strokeWidth="0.3" />
            </g>
          </>
        )}

        {/* Industrial: Steam-powered boat */}
        {isIndustrial && (
          <>
            <path d="M -18 5 Q -18 9 -12 12 L 12 12 Q 18 9 18 5 Z" fill="#4A4A4A" stroke="#2F2F2F" strokeWidth={1} />
            <line x1="-15" y1="7" x2="15" y2="7" stroke="#2F2F2F" strokeWidth="0.5" />
            <rect x="-10" y="4" width="20" height="2" fill="#696969" />
            {/* Steam stack */}
            <rect x={5} y={-8} width={3} height={15} fill="#2F2F2F" />
            {/* Steam */}
            {[0,1,2].map(i => (
              <circle key={i} cx={6.5 + i * 1.5} cy={-10 - ((frame + i*8) % 40) * 0.4}
                      r={1 + i * 0.4} fill="#D3D3D3" opacity={0.3 - i*0.08} />
            ))}
            {/* Fisher */}
            <g transform="translate(-3, 2)">
              <rect x={-1.5} y={-5} width={3} height={4} fill="#2F4F4F" />
              <circle cx={0} cy={-6} r={1.5} fill="#FFDBAC" />
              <rect x={-2} y={-7.5} width={4} height={1} fill="#000000" />
              <line x1={2} y1={-4} x2={6} y2={-8} stroke="#654321" strokeWidth="0.5" />
              <line x1={6} y1={-8} x2={6} y2={Math.sin(frame * 0.1) * 2} stroke="#F5F5F5" strokeWidth="0.3" />
            </g>
          </>
        )}

        {/* Modern: Motor boat */}
        {isModernEra && (
          <>
            <path d="M -18 5 Q -18 8 -12 10 L 12 10 Q 18 8 18 5 Z" fill="#FFFFFF" stroke="#C0C0C0" strokeWidth={1} />
            <rect x="-10" y="4" width="20" height="2" fill="#4169E1" />
            <rect x={10} y={6} width={6} height={4} fill="#606060" stroke="#404040" strokeWidth={0.5} />
            <rect x={11} y={7} width={4} height={2} fill="#404040" />
            <ellipse cx={13} cy={10} rx={2} ry={0.5} fill="#808080" transform={`rotate(${frame * 5} 13 10)`} />
            {/* Modern fisher */}
            <g transform="translate(-2, 2)">
              <rect x={-1.5} y={-5} width={3} height={4} fill="#FF6347" />
              <circle cx={0} cy={-6} r={1.5} fill="#FFDBAC" />
              <rect x={-2} y={-7.5} width={4} height={1} fill="#FF6347" />
              <line x1={2} y1={-4} x2={8} y2={-10} stroke="#4169E1" strokeWidth="1" />
              <line x1={8} y1={-10} x2={8} y2={Math.sin(frame * 0.1) * 2} stroke="#F5F5F5" strokeWidth="0.3" />
              <circle cx={8} cy={Math.sin(frame * 0.1) * 2} r={0.5} fill="#FF0000" />
            </g>
          </>
        )}
      </g>
    );
  };

  // Enhanced seabirds with better animation
  const renderSeabirds = () => (
    <g>
      {tod !== 'night' && [0,1,2,3].map(i => {
        const speed = 0.3 + i * 0.12;
        const x = (frame * speed + i * 100) % (width + 100) - 50;
        const y = GROUND_Y - 60 + Math.sin((frame + i * 23) * 0.05) * 10;
        const wingFlap = Math.sin(frame * 0.2 + i) * 15;
        return (
          <g key={i} transform={`translate(${x}, ${y})`}>
            {/* Bird body */}
            <ellipse cx={0} cy={0} rx={2} ry={1} fill="#1C1C1C" />
            {/* Animated wings */}
            <path d={`M -2 0 Q -4 ${-1 + wingFlap * 0.1} -6 ${wingFlap * 0.1}`} stroke="#1C1C1C" strokeWidth={0.8} fill="none" />
            <path d={`M 2 0 Q 4 ${-1 - wingFlap * 0.1} 6 ${-wingFlap * 0.1}`} stroke="#1C1C1C" strokeWidth={0.8} fill="none" />
          </g>
        );
      })}

      {/* Occasional diving bird */}
      {Math.sin(frame * 0.01) > 0.8 && (
        <g transform={`translate(${width * 0.3}, ${GROUND_Y - 40 + (frame % 100) * 0.8})`}>
          <g transform={`rotate(${45})`}>
            <ellipse cx={0} cy={0} rx={2} ry={1} fill="#1C1C1C" />
            <path d="M -2 0 L -4 -2" stroke="#1C1C1C" strokeWidth={0.8} />
            <path d="M 2 0 L 4 -2" stroke="#1C1C1C" strokeWidth={0.8} />
          </g>
        </g>
      )}
    </g>
  );

  /* ───────────────────────── Render (sky is handled below the SVG) ───────────────────────── */
  return (
    <div className="relative" style={{ width, height, overflow: 'hidden', isolation: 'isolate' }} aria-label="Fishing hut banner">
      {/* Time & weather aware sky (overcast, season, climate handled here) */}
      <TimeAwareBackground
        gameTimeHours={clockH}
        gameTimeMinutes={clockM}
        weather={weather ?? undefined}
        season={seasonStr}
        climate={climateStr}
      />

      {/* Optional FX layer: clipped to sky band only */}
      {enableFxLayer && fxWeather && (
        <div
          className="absolute left-0 right-0 top-0 pointer-events-none"
          style={{ height: GROUND_Y, zIndex: 1, overflow: 'hidden' }}
        >
          <WeatherEffects weather={fxWeather} width={width} height={GROUND_Y} />
        </div>
      )}

      {/* Main scene (transparent sky) */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ imageRendering: 'pixelated', display: 'block', position: 'relative', zIndex: 2 }}
      >
        {renderHorizon()}
        {renderShoreline()}
        {renderFishingHut()}
        {renderFishermen()}
        {renderOcean()}
        {renderBoat()}
        {renderSeabirds()}
      </svg>
    </div>
  );
};

export default React.memo(FishingHutBanner);
