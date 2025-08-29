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
}

/* ───────────────────────── Layout constants ───────────────────────── */
const GROUND_Y_DEFAULT = 110;
const WATER_OFFSET = 15;

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
const OCEAN_COLORS: Record<string, { shallow: string, deep: string, foam: string }> = {
  [ClimateType.COLD]: { shallow:'#5A7A8C', deep:'#2C4A5C', foam:'#E8F4F8' },
  [ClimateType.TEMPERATE]: { shallow:'#4A90E2', deep:'#2E5A8E', foam:'#F0F8FF' },
  [ClimateType.ARID]: { shallow:'#6BA3D0', deep:'#4A7A9C', foam:'#FFF8E7' },
  [ClimateType.SEMITROPICAL]: { shallow:'#40E0D0', deep:'#20B2AA', foam:'#F0FFFF' },
  [ClimateType.TROPICAL]: { shallow:'#00CED1', deep:'#008B8B', foam:'#F0FFFF' },
  [ClimateType.MEDITERRANEAN]: { shallow:'#4682B4', deep:'#1E5A8E', foam:'#F5F5DC' }
};

/* ───────────────────────── Local types ───────────────────────── */
type Fish = { x:number; y:number; vx:number; vy:number; color:string; size:number; dir:1|-1; phase:number; amp:number; };
type IceFloe = { x:number; size:number; drift:number; };
type Fisher = { x:number; casting:boolean };

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
  const [fish, setFish] = useState<Fish[]>([]);
  const [iceFloes, setIceFloes] = useState<IceFloe[]>([]);
  const [fishermenPos, setFishermenPos] = useState<Fisher[]>([]);
  const [boatPhase, setBoatPhase] = useState(rng.range(0, Math.PI * 2));

  // initialize critters & folks
  useEffect(() => {
    // Fish (tropical schools, sinusoidal paths)
    if (isTropical) {
      const n = 4 + staticRng.int(0, 3);
      const colors = ['#FFD700', '#FF69B4', '#00FFFF', '#FFA500', '#9370DB', '#7FFFD4'];
      const Fs: Fish[] = Array.from({ length: n }, (_, i) => {
        const dir: 1 | -1 = staticRng.next() > 0.5 ? 1 : -1;
        const size = 2 + staticRng.range(0, 2.5);
        return {
          x: staticRng.range(0, width),
          y: WATER_Y + 12 + staticRng.range(0, 28),
          vx: (0.4 + staticRng.range(0, 0.9)) * dir,
          vy: 0,
          color: colors[i % colors.length],
          size,
          dir,
          phase: staticRng.range(0, 1000),
          amp: staticRng.range(0.8, 2.2),
        };
      });
      setFish(Fs);
    } else {
      setFish([]);
    }

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
  }, [width, isTropical, isCold, WATER_Y, staticRng]);

  // animate fish, floes, boat bob, casting cadence
  useEffect(() => {
    let raf = 0;
    const step = () => {
      setBoatPhase((p) => p + (reduced ? 0.012 : 0.02));
      if (isTropical) {
        setFish((prev) => prev.map(f => {
          let x = f.x + (reduced ? 0.4 : 0.9) * f.vx;
          const sway = Math.sin((frame * 0.06) + f.phase + x * 0.01) * f.amp;
          let dir = f.dir;
          if (x < -25 || x > width + 25) { dir = (dir === 1 ? -1 : 1); x = Math.max(-24, Math.min(width + 24, x)); }
          return { ...f, x, y: Math.max(WATER_Y + 8, Math.min(height - 8, f.y + sway * 0.05)), dir };
        }));
      }
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
  }, [width, height, frame, isTropical, isCold, reduced, WATER_Y]);

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
      {/* strand */}
      <rect x={0} y={GROUND_Y} width={width} height={15} fill={isCold ? '#8B8682' : '#F4E4C1'} />
      {/* pebbles / rocklets */}
      {!isCold && Array.from({ length: Math.max(12, width / 40) }, (_, i) => (
        <circle
          key={i}
          cx={i * (width / 12) * 0.9 + rng.range(-8, 8)}
          cy={GROUND_Y + rng.range(2, 12)}
          r={1}
          fill="#D2B48C"
          opacity={0.45}
        />
      ))}
      {isCold && Array.from({ length: Math.max(8, width / 80) }, (_, i) => (
        <rect
          key={i}
          x={i * (width / 8) + rng.range(-20, 20)}
          y={GROUND_Y + rng.range(0, 10)}
          width={rng.range(5, 14)}
          height={rng.range(3, 7)}
          fill="#696969"
        />
      ))}
    </g>
  );

  const renderFishingHut = () => {
    const cx = width / 2;
    const asian = /asia/i.test(String(culturalZone));
    const pacific = /pacific|oceania/i.test(String(culturalZone));
    const hutStyle = asian ? 'stilt' : pacific ? 'thatched' : isCold ? 'log' : 'wooden';
    const night = tod === 'dusk' || tod === 'night';

    return (
      <g>
        {/* pier deck (slight sway by wind/waves) */}
        <rect x={cx - 80} y={GROUND_Y + 5 + Math.sin(frame * 0.02) * 0.5} width={160} height={3} fill="#8B4513" />
        {/* pier posts with ripple shadows */}
        {[-70, -35, 0, 35, 70].map((off, i) => (
          <g key={i}>
            <rect x={cx + off - 1} y={GROUND_Y + 5} width={2} height={20} fill="#654321" />
            {/* ripple on water */}
            <ellipse
              cx={cx + off}
              cy={WATER_Y - 1 + Math.sin(frame * 0.06 + i) * 0.3}
              rx={8}
              ry={2}
              fill="#000"
              opacity={0.08}
            />
          </g>
        ))}

        {hutStyle === 'stilt' && (
          <>
            {[ -25, -10, 7, 22 ].map((ox,i) => (
              <rect key={i} x={cx + ox} y={GROUND_Y - 15} width={3} height={25} fill="#8B4513" />
            ))}
            <rect x={cx - 28} y={GROUND_Y - 15} width={56} height={3} fill="#A0826D" />
            <rect x={cx - 20} y={GROUND_Y - 30} width={40} height={15} fill="#D2B48C" stroke="#A0826D" strokeWidth={1} />
            <polygon points={`${cx - 23},${GROUND_Y - 30} ${cx},${GROUND_Y - 38} ${cx + 23},${GROUND_Y - 30}`}
                     fill="#8B4513" stroke="#654321" strokeWidth={1} />
          </>
        )}

        {hutStyle === 'thatched' && (
          <>
            <rect x={cx - 18} y={GROUND_Y - 20} width={36} height={20} fill="#D2B48C" stroke="#A0826D" strokeWidth={1} />
            <ellipse cx={cx} cy={GROUND_Y - 20} rx={20} ry={8} fill="#B8860B" stroke="#8B6508" strokeWidth={1} />
            <rect x={cx - 4} y={GROUND_Y - 10} width={8} height={10} fill="#654321" />
          </>
        )}

        {hutStyle === 'log' && (
          <>
            {[0, 4, 8, 12, 16].map(offset => (
              <rect key={offset} x={cx - 20} y={GROUND_Y - 20 + offset} width={40} height={3} fill="#8B4513" stroke="#654321" strokeWidth={0.5} />
            ))}
            <polygon points={`${cx - 23},${GROUND_Y - 20} ${cx},${GROUND_Y - 30} ${cx + 23},${GROUND_Y - 20}`}
                     fill="#696969" stroke="#4A4A4A" strokeWidth={1} />
            {/* chimney + soft smoke */}
            <rect x={cx + 12} y={GROUND_Y - 28} width={6} height={10} fill="#808080" />
            {[0,1,2].map(i => (
              <circle key={i} cx={cx + 15 + i * 1.5} cy={GROUND_Y - 30 - ((frame + i*6) % 36) * 0.5} r={2 + i * 0.6} fill="#808080" opacity={0.25 - i*0.06} />
            ))}
          </>
        )}

        {hutStyle === 'wooden' && (
          <>
            <rect x={cx - 20} y={GROUND_Y - 25} width={40} height={25} fill="#A0826D" stroke="#8B4513" strokeWidth={1} />
            <polygon points={`${cx - 22},${GROUND_Y - 25} ${cx},${GROUND_Y - 35} ${cx + 22},${GROUND_Y - 25}`}
                     fill="#8B4513" stroke="#654321" strokeWidth={1} />
            <rect x={cx - 4} y={GROUND_Y - 12} width={8} height={12} fill="#654321" />
            <rect x={cx - 14} y={GROUND_Y - 18} width={6} height={6} fill="#87CEEB" opacity={0.6} />
            <rect x={cx + 8} y={GROUND_Y - 18} width={6} height={6} fill="#87CEEB" opacity={0.6} />
          </>
        )}

        {/* nets */}
        <g opacity={0.6}>
          <path d={`M ${cx - 35} ${GROUND_Y - 10} Q ${cx - 30} ${GROUND_Y - 5} ${cx - 25} ${GROUND_Y - 10}`}
                stroke="#8B7355" strokeWidth={0.5} fill="none" />
          {[0, 2, 4, 6, 8].map(i => (
            <line key={i} x1={cx - 35 + i * 1.2} y1={GROUND_Y - 10 + i * 0.5}
                  x2={cx - 35 + i * 1.2} y2={GROUND_Y - 5 + i * 0.3}
                  stroke="#8B7355" strokeWidth={0.3} />
          ))}
        </g>

        {/* drying rack */}
        <rect x={cx + 30} y={GROUND_Y - 8} width={20} height={1} fill="#8B4513" />
        <rect x={cx + 33} y={GROUND_Y - 8} width={1} height={8} fill="#654321" />
        <rect x={cx + 46} y={GROUND_Y - 8} width={1} height={8} fill="#654321" />
        {[0,1,2].map(i => (
          <ellipse key={i} cx={cx + 36 + i * 4} cy={GROUND_Y - 6} rx={1.5} ry={3} fill="#C0C0C0" stroke="#808080" strokeWidth={0.5} />
        ))}

        {/* crates */}
        <rect x={cx - 45} y={GROUND_Y - 5} width={6} height={5} fill="#8B4513" stroke="#654321" strokeWidth={0.5} />
        <ellipse cx={cx - 42} cy={GROUND_Y - 5} rx={3} ry={1} fill="#A0826D" />

        {/* cozy lantern at night */}
        {night && (
          <g style={{ mixBlendMode: 'screen', isolation: 'isolate' }}>
            <rect x={cx - 22} y={GROUND_Y - 28} width={5} height={6} fill="#B77A2A" />
            <rect x={cx - 20.5} y={GROUND_Y - 26.5} width={2} height={3} fill="#FFD86B" />
            <circle cx={cx - 19.5} cy={GROUND_Y - 25} r={6 + Math.sin(frame*0.2)*(reduced?0.3:0.6)} fill="#FFD86B" opacity={0.7}/>
            <circle cx={cx - 19.5} cy={GROUND_Y - 25} r={11 + Math.sin(frame*0.2)*(reduced?0.6:1.0)} fill="#FFE08A" opacity={0.35}/>
          </g>
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
      </defs>
      {/* body */}
      <rect x={0} y={WATER_Y} width={width} height={height - WATER_Y} fill="url(#oceanGradient)" />
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

      {/* tropical fish */}
      {isTropical && fish.map((f, i) => (
        <g key={i} transform={`translate(${f.x}, ${f.y}) scale(1,1)`}>
          <ellipse cx={0} cy={0} rx={f.size} ry={f.size * 0.6} fill={f.color} />
          <polygon points={`${f.dir * f.size},0 ${f.dir * (f.size + 2)},-1 ${f.dir * (f.size + 2)},1`} fill={f.color} />
          <circle cx={-f.dir * f.size * 0.3} cy={-0.5} r={0.5} fill="#000" />
        </g>
      ))}

      {/* ice floes */}
      {isCold && iceFloes.map((fl, i) => (
        <g key={i}>
          <rect x={fl.x} y={WATER_Y - 5} width={fl.size} height={8} rx={2} fill="#E0F7FF" stroke="#B0E0FF" strokeWidth={1} />
          <rect x={fl.x + 2} y={WATER_Y - 3} width={fl.size - 4} height={2} fill="#F0FFFF" opacity={0.85} />
        </g>
      ))}
    </g>
  );

  const renderBoat = () => {
    const cx = width * 0.7 + boatX;
    return (
      <g transform={`translate(${cx}, ${WATER_Y - 5 + boatYBob})`}>
        <path d="M -15 5 Q -15 8 -10 10 L 10 10 Q 15 8 15 5 Z" fill="#8B4513" stroke="#654321" strokeWidth={1} />
        {!isModern ? (
          <>
            <rect x={-0.5} y={-15} width={1} height={20} fill="#654321" />
            <polygon points="-8,-12 8,-8 8,0 -8,-4" fill="#F5F5DC" stroke="#D2B48C" strokeWidth={0.5} opacity={0.9} />
          </>
        ) : (
          <rect x={8} y={6} width={5} height={4} fill="#606060" stroke="#404040" strokeWidth={0.5} />
        )}
        {/* lil' fisher */}
        <g transform="translate(0, 2)">
          <rect x={-1.5} y={-5} width={3} height={4} fill="#8B4513" />
          <circle cx={0} cy={-6} r={1.5} fill="#FFDBAC" />
          <rect x={-2} y={-7} width={4} height={1} fill="#4A4A4A" />
          <line x1={2} y1={-4} x2={6} y2={-8} stroke="#654321" strokeWidth={0.5} />
          <line x1={6} y1={-8} x2={6} y2={Math.sin(frame * 0.1) * 2} stroke="#F5F5F5" strokeWidth={0.3} />
        </g>
      </g>
    );
  };

  // minimal seabirds (kept; they fly over the horizon area but we don't render any sky)
  const renderSeabirds = () => (
    <g>
      {tod !== 'night' && [0,1,2].map(i => {
        const speed = 0.3 + i * 0.12;
        const x = (frame * speed + i * 100) % (width + 100) - 50;
        const y = GROUND_Y - 60 + Math.sin((frame + i * 23) * 0.05) * 10;
        return (
          <g key={i} transform={`translate(${x}, ${y})`}>
            <path d="M -3 0 Q 0 -2 3 0" stroke="#1C1C1C" strokeWidth={0.5} fill="none" />
          </g>
        );
      })}
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
