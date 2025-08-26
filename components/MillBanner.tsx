/**
 * components/MillBanner.tsx
 * Pixel-art banner for mills, matched to MineColonyBanner aesthetic.
 * - Distinct variants: hand_quern | animal_mill | water_mill | windmill | tidal_mill | steam_mill | electric_mill | sugar_mill
 * - Era-keyed vehicles (hand carts/wagons → steam trains → trucks/electric)
 * - Stable seeded randomness (clouds, skyline, pebbles, vegetation)
 * - Night lighting & subtle animations via SVG animate/interval ticker
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClimateType, TimeOfDay, BiomeType } from '../types';
import type { Season } from '../types/ui';

/* ------------------------------------------------------------------ */
/* Types & Props (robust to either enums or strings to avoid breakage) */
/* ------------------------------------------------------------------ */

type MillVariant =
  | 'hand_quern'
  | 'animal_mill'
  | 'water_mill'
  | 'windmill'
  | 'tidal_mill'
  | 'steam_mill'
  | 'electric_mill'
  | 'sugar_mill';

interface MillBannerProps {
  width?: number;
  height?: number;
  climate?: ClimateType | string;
  season: Season;
  era?: string;                 // year or label: 'ancient' | 'medieval' | 'early_modern' | 'industrial' | 'modern'
  culturalZone?: string;
  millType?: string;            // accepts the names in MillVariant, plus common aliases
  timeOfDay?: TimeOfDay | string;
  isRuined?: boolean;
  seed?: number;
  adjacentBiomes?: BiomeType[]; // not used heavily, but kept for parity if needed later
}

/* ----------------------------------- */
/* Shared palette & constants (matchy) */
/* ----------------------------------- */

const GROUND_Y = 110;

const SKY_COLORS: Record<'dawn'|'day'|'dusk'|'night', string[]> = {
  dawn: ['#FF9A8B', '#A8E6CF', '#FFD3BA'],
  day:  ['#87CEEB', '#98D8E8', '#B8E6B8'],
  dusk: ['#FF8C42', '#FF6B6B', '#C44569'],
  night:['#2C3E50', '#34495E', '#4A6741']
};

const getGroundColor = (
  climate: ClimateType | string | undefined,
  season: Season | string | undefined
): { ground: string, vegetation: string, accent: string } => {
  const c = (typeof climate === 'string' ? climate : ClimateType[climate ?? ClimateType.TEMPERATE])?.toString().toLowerCase();
  const s = (typeof season === 'string' ? season : Season[season ?? 'summer'])?.toString().toLowerCase();

  if (s === 'winter') {
    if (c === 'cold') return { ground: '#F0F8FF', vegetation: '#E0E8EF', accent: '#C0D0E0' };
    if (c === 'temperate') return { ground: '#E8F0F8', vegetation: '#D0E0F0', accent: '#B0C0D0' };
    if (c === 'mediterranean') return { ground: '#86EFAC', vegetation: '#22C55E', accent: '#16A34A' };
  }
  if (c === 'cold') return { ground: '#F0F8FF', vegetation: '#E0E8EF', accent: '#C0D0E0' };
  if (c === 'arid') return { ground: '#D2B48C', vegetation: '#CD853F', accent: '#A0826D' };
  if (c === 'mediterranean') {
    return { ground: '#B4C5A0', vegetation: '#8B9070', accent: '#7A8060' };
  }
  if (c === 'tropical') return { ground: '#4A7C59', vegetation: '#059669', accent: '#047857' };
  if (c === 'semitropical') return { ground: '#6EE7B7', vegetation: '#32CD32', accent: '#228B22' };
  return { ground: '#86EFAC', vegetation: '#22C55E', accent: '#16A34A' };
};

/* ---------------- */
/* Seeded RNG utils */
/* ---------------- */

class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number { this.seed = (this.seed * 9301 + 49297) % 233280; return this.seed / 233280; }
  range(min: number, max: number) { return min + this.next() * (max - min); }
  pick<T>(arr: T[]) { return arr[Math.floor(this.range(0, arr.length))]; }
}
const hashSeed = (s: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h % 233279) + 1;
};

/* -------------------- */
/* Era & time utilities */
/* -------------------- */

const parseYear = (era?: string) => {
  if (!era) return 1200;
  const e = era.toLowerCase();
  if (/^\d{3,4}$/.test(e)) return parseInt(e, 10);
  if (e.includes('prehistoric')) return -1000;
  if (e.includes('ancient')) return 0;
  if (e.includes('medieval')) return 1200;
  if (e.includes('early')) return 1700;
  if (e.includes('industrial')) return 1850;
  if (e.includes('modern') || e.includes('contemporary')) return 1960;
  return 1200;
};

const getTOD = (timeOfDay?: TimeOfDay | string): 'dawn'|'day'|'dusk'|'night' => {
  if (!timeOfDay) {
    const h = new Date().getHours();
    if (h < 6 || h >= 21) return 'night';
    if (h < 8) return 'dawn';
    if (h >= 19) return 'dusk';
    return 'day';
  }
  const t = typeof timeOfDay === 'string' ? timeOfDay.toLowerCase() : timeOfDay;
  if (String(t).toLowerCase().includes('dawn')) return 'dawn';
  if (String(t).toLowerCase().includes('dusk')) return 'dusk';
  if (String(t).toLowerCase().includes('night')) return 'night';
  return 'day';
};

/* ----------------------- */
/* Variant resolve (robust) */
/* ----------------------- */

const resolveVariant = (millType?: string, era?: string, culturalZone?: string): MillVariant => {
  const t = (millType || '').toLowerCase();
  if (t.includes('quern') || t.includes('hand')) return 'hand_quern';
  if (t.includes('animal') || t.includes('ox') || t.includes('donkey')) return 'animal_mill';
  if (t.includes('water')) return 'water_mill';
  if (t.includes('wind')) return 'windmill';
  if (t.includes('tide')) return 'tidal_mill';
  if (t.includes('steam')) return 'steam_mill';
  if (t.includes('electric') || t.includes('modern')) return 'electric_mill';
  if (t.includes('sugar') || t.includes('cane')) return 'sugar_mill';

  const zone = (culturalZone || '').toUpperCase();
  if (zone.includes('NORTH_AMERICAN_PRE_COLUMBIAN') ||
      zone.includes('SOUTH_AMERICAN') || zone.includes('OCEANIA') ||
      zone.includes('ABORIGINAL') || zone.includes('SUB_SAHARAN_AFRICAN') ||
      zone.includes('ARCTIC')) return 'hand_quern';
  if (zone.includes('EAST_ASIAN') || zone.includes('SOUTH_ASIAN')) return parseYear(era) >= 1850 ? 'electric_mill' : 'water_mill';
  if (zone.includes('MENA')) return parseYear(era) >= 1850 ? 'electric_mill' : 'animal_mill';

  const y = parseYear(era);
  if (y < 500) return 'hand_quern';
  if (y < 1500) return 'water_mill';
  if (y < 1800) return 'windmill';
  if (y < 1900) return 'steam_mill';
  return 'electric_mill';
};

/* =============== */
/* Component start */
/* =============== */

const MillBanner: React.FC<MillBannerProps> = ({
  width = 600,
  height = 250,
  climate = ClimateType.TEMPERATE,
  season = 'summer',
  era = 'medieval',
  culturalZone = 'europe',
  millType = 'water_mill',
  timeOfDay = 'Day',
  isRuined = false,
  seed,
  adjacentBiomes = []
}) => {
  /* Stable seed (no wiggle) */
  const baseSeed = useMemo(
    () => seed ?? hashSeed([width, height, String(climate), String(season), era, culturalZone, millType].join('|')),
    [width, height, climate, season, era, culturalZone, millType, seed]
  );
  const rng = useMemo(() => new SeededRandom(baseSeed), [baseSeed]);
  const staticRng = useMemo(() => new SeededRandom(baseSeed + 9999), [baseSeed]);

  const variant = useMemo(() => resolveVariant(millType, era, culturalZone), [millType, era, culturalZone]);
  const year = parseYear(era);
  const isEarly = year >= 1600 && year < 1800;
  const isIndustrial = year >= 1800 && year < 1900;
  const isModern = year >= 1900;

  const palette = getGroundColor(climate, season);
  const tod = getTOD(timeOfDay);
  const sky = SKY_COLORS[tod];

  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (isRuined) return;
    const id = setInterval(() => setFrame((f) => f + 1), 70);
    return () => clearInterval(id);
  }, [isRuined]);

  /* ------------------------- */
  /* Stable random scene bits  */
  /* ------------------------- */

  const clouds = useRef<{ x: number; y: number; w: number }[]>([]);
  const skyline = useRef<{ x: number; w: number; h: number; o: number }[]>([]);
  const pebbles = useRef<{ x: number; y: number; w: number; h: number }[]>([]);
  const stars = useRef<{ x: number; y: number }[]>([]);
  const cane = useRef<{ x: number; h: number }[]>([]);

  if (!clouds.current.length) for (let i = 0; i < 6; i++) clouds.current.push({ x: -120 + i * 150 + staticRng.range(-20, 20), y: 18 + staticRng.range(-8, 8), w: staticRng.range(16, 26) });
  if (!skyline.current.length) { const n = Math.floor(width / 90) + 2; for (let i = 0; i < n; i++) skyline.current.push({ x: i * (width / n) + staticRng.range(-24, 24), w: staticRng.range(18, 32), h: staticRng.range(14, 28), o: staticRng.range(0.25, 0.55) }); }
  if (!pebbles.current.length) { const n = Math.floor(width / 12); for (let i = 0; i < n; i++) pebbles.current.push({ x: i * 12 + staticRng.range(-3, 3), y: GROUND_Y + staticRng.range(0, 3), w: staticRng.range(2, 4), h: staticRng.range(1, 3) }); }
  if (tod === 'night' && !stars.current.length) { for (let i = 0; i < 28; i++) stars.current.push({ x: staticRng.range(6, width - 6), y: staticRng.range(6, 88) }); }
  if (!cane.current.length) for (let i = 0; i < 18; i++) cane.current.push({ x: staticRng.range(12, width - 12), h: staticRng.range(8, 16) });

  /* ------------------------- */
  /* Helpers: water & windows  */
  /* ------------------------- */

  const renderWaterBand = (y: number, h = 12) => (
    <g>
      <rect x="0" y={y} width={width} height={h} fill={tod === 'night' ? '#1a3a5a' : '#4a90e2'} opacity="0.55" />
      {Array.from({ length: 10 }).map((_, i) => (
        <path key={i}
          d={`M ${(i * 20 - (frame * 3) % 20)} ${y + 1}
              Q ${((i * 20 + 10 - (frame * 3) % 20))} ${y}
                ${((i * 20 + 20 - (frame * 3) % 20))} ${y + 1}`}
          stroke={tod === 'night' ? '#2a4a6a' : '#5aa0f2'} strokeWidth="0.6" fill="none" opacity="0.8" />
      ))}
    </g>
  );

  const windowGlow = (x: number, y: number, w: number, h: number, count: number, electric = true) => {
    const color = electric ? '#FFF49A' : '#FF9B4A';
    return (
      <g shapeRendering="crispEdges">
        {Array.from({ length: count }).map((_, i) => {
          const cw = (w - 6) / count;
          const wx = x + 3 + i * cw;
          return (
            <g key={i}>
              <rect x={wx} y={y} width={cw - 2} height={h} fill={tod === 'night' ? color : '#87CEEB'} opacity={tod === 'night' ? 0.85 : 1} />
              {tod === 'night' && !isRuined && (
                <rect x={wx - 1} y={y - 1} width={cw} height={h + 2} fill={color} opacity="0.25">
                  <animate attributeName="opacity" values="0.25;0.45;0.25" dur={`${1.4 + (i % 3) * 0.5}s`} repeatCount="indefinite" />
                </rect>
              )}
            </g>
          );
        })}
      </g>
    );
  };

  /* ---------------------- */
  /* Sky & ground rendering */
  /* ---------------------- */

  const renderSky = () => {
    const cloudDrift = (frame * 0.10) % (width + 160);
    return (
      <g>
        <defs>
          <linearGradient id="sky_grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={sky[0]} />
            <stop offset="50%" stopColor={sky[1]} />
            <stop offset="100%" stopColor={sky[2] || sky[1]} />
          </linearGradient>
          <filter id="softGlow"><feGaussianBlur stdDeviation="1.2" /></filter>
        </defs>
        <rect x="0" y="0" width={width} height="90" fill="url(#sky_grad)" />
        {tod !== 'night'
          ? <circle cx={width - 40} cy={22} r={10} fill="#FFD700" opacity="0.95" />
          : <g><circle cx={width - 42} cy={20} r={7} fill="#F2F2F2" /><circle cx={width - 42} cy={20} r={10} fill="#F2F2F2" opacity="0.15" filter="url(#softGlow)" /></g>}
        {tod === 'night' && stars.current.map((s, i) => <rect key={i} x={s.x} y={s.y} width="1" height="1" fill="#fff" opacity="0.9" shapeRendering="crispEdges" />)}
        {clouds.current.map((c, i) => {
          const x = c.x + cloudDrift - 120;
          return (
            <g key={i} opacity={tod === 'night' ? 0.35 : 0.8} shapeRendering="crispEdges">
              <rect x={x} y={c.y} width={c.w} height={c.w * 0.45} rx="4" fill="#F1F5F9" />
              <rect x={x + 9} y={c.y - 2} width={c.w + 6} height={c.w * 0.45} rx="4" fill="#F1F5F9" />
              <rect x={x + 5} y={c.y + 4} width={c.w - 6} height={c.w * 0.35} rx="3" fill="#F1F5F9" />
            </g>
          );
        })}
        {skyline.current.map((b, i) => <g key={i} opacity={b.o}><rect x={b.x} y={GROUND_Y - b.h} width={b.w} height={b.h} fill="#3a3a3a" /></g>)}
      </g>
    );
  };

  const renderGround = () => (
    <g>
      <defs>
        <linearGradient id="ground_grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={palette.ground} stopOpacity="1" />
          <stop offset="50%" stopColor={palette.ground} stopOpacity="0.95" />
          <stop offset="100%" stopColor={palette.accent} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect x="0" y={GROUND_Y} width={width} height={height - GROUND_Y} fill="url(#ground_grad)" />
      {pebbles.current.map((p, i) => <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill="#756B5A" opacity="0.4" />)}
    </g>
  );

  /* ---------------------------- */
  /* Vehicles & figures by epoch  */
  /* ---------------------------- */

  const pathY = GROUND_Y + 12; // walking/vehicle path
  const renderPath = () => (
    <g>
      <rect x={0} y={pathY} width={width} height="2" fill="#8b6b4b" opacity="0.7" />
      {Array.from({ length: width / 20 }, (_, i) => (
        <rect key={i} x={i * 20 + 2} y={pathY - 1} width="2" height="1" fill="#6a5a4a" opacity="0.4" />
      ))}
    </g>
  );

  // Tiny pixel people (miller/worker)
  const renderWorkers = (count = 3, tone: 'light'|'dark' = 'dark') => {
    const people = new SeededRandom(baseSeed + 1234);
    const arr = Array.from({ length: count }).map((_, i) => ({
      x: people.range(80, width - 80),
      dir: people.next() > 0.5 ? 1 : -1,
      speed: 0.25 + people.range(0, 0.2),
      type: i === 0 ? 'miller' : 'worker'
    }));
    const [walkers, setWalkers] = useState(arr);
    useEffect(() => {
      const id = setInterval(() => {
        setWalkers(prev => prev.map(w => {
          let x = w.x + w.dir * w.speed;
          let dir = w.dir;
          if (x < 40 || x > width - 40) { dir = -dir; x = w.x + dir * w.speed; }
          return { ...w, x, dir };
        }));
      }, 90);
      return () => clearInterval(id);
    }, []);

    const shirt = tone === 'dark' ? '#4A4A4A' : '#6A6A6A';
    return (
      <g>
        {walkers.map((w, i) => (
          <g key={i} transform={`translate(${w.x}, ${pathY - 2})`} shapeRendering="crispEdges">
            <rect x="-2" y="-8" width="4" height="6" fill={shirt} />
            <rect x="-1.5" y="-10" width="3" height="2" fill="#FFDBAC" />
            {w.type === 'miller' && <rect x="-2" y="-11.5" width="4" height="1.5" fill="#d4d4d4" />} {/* cap */}
            {/* legs swing */}
            <rect x={-1.6 + Math.sin((frame + i * 10) * 0.2) * 0.6} y="-2" width="1" height="4" fill="#2C2C2C" />
            <rect x={0.6 - Math.sin((frame + i * 10) * 0.2) * 0.6} y="-2" width="1" height="4" fill="#2C2C2C" />
            {/* flour sack occasionally */}
            {w.type === 'miller' && (i % 2 === 0) && <rect x="3" y="-6" width="3" height="3" fill="#f5f5dc" opacity="0.9" />}
          </g>
        ))}
      </g>
    );
  };

  // Era-keyed vehicles
  const renderVehicles = () => {
    if (isEarly) {
      // hand cart / wagon
      const x = ((frame * 0.6) % (width + 40)) - 40;
      return (
        <g transform={`translate(${x}, ${pathY - 6})`} shapeRendering="crispEdges">
          <rect x="0" y="0" width="14" height="6" fill="#8b4513" />
          <circle cx="3" cy="7" r="2" fill="#2a2a2a" />
          <circle cx="11" cy="7" r="2" fill="#2a2a2a" />
          {/* person pulling */}
          <g transform="translate(-8, -1)">
            <rect x="0" y="2" width="2" height="6" fill="#6a6a6a" />
            <rect x="0.5" y="1" width="1" height="1" fill="#ffdbac" />
            <rect x="2" y="3" width="6" height="1" fill="#8b4513" />
          </g>
        </g>
      );
    }
    if (isIndustrial) {
      // steam locomotive on a short foreground rail
      const x = ((frame * 1.2) % (width + 120)) - 120;
      return (
        <g transform={`translate(${x}, ${pathY + 6})`} shapeRendering="crispEdges">
          {/* rail line */}
          <rect x="-20" y="8" width="160" height="2" fill="#4A4A4A" />
          {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={i * 18 - 20} y="6" width="3" height="6" fill="#654321" />)}
          {/* loco */}
          <rect x="0" y="-6" width="30" height="10" fill="#2f2f2f" stroke="#1a1a1a" strokeWidth="1" />
          <rect x="22" y="-12" width="8" height="6" fill="#3b3b3b" />
          <rect x="-10" y="-4" width="10" height="8" fill="#444" />
          <circle cx="4" cy="6" r="3" fill="#111" />
          <circle cx="16" cy="6" r="3" fill="#111" />
          <circle cx="28" cy="6" r="3" fill="#111" />
          {/* chimney smoke */}
          {!isRuined && <>
            <rect x="24" y="-14" width="4" height="4" fill="#555" />
            <ellipse cx="26" cy={-18 - ((frame * 0.5) % 16)} rx="5" ry="3" fill="rgba(120,120,120,0.45)" />
            <ellipse cx="29" cy={-22 - ((frame * 0.5) % 16)} rx="6" ry="3" fill="rgba(120,120,120,0.3)" />
          </>}
        </g>
      );
    }
    if (isModern) {
      // small truck
      const x = (width + 60) - ((frame * 1.0) % (width + 120));
      return (
        <g transform={`translate(${x}, ${pathY - 2})`} shapeRendering="crispEdges">
          <rect x="0" y="-6" width="22" height="8" fill="#4a6fa0" />
          <rect x="16" y="-9" width="6" height="3" fill="#3a5a85" />
          <rect x="2" y="-9" width="10" height="3" fill={tod === 'night' ? '#c8e6ff' : '#9cd0ff'} />
          <circle cx="5" cy="3" r="2" fill="#222" />
          <circle cx="17" cy="3" r="2" fill="#222" />
          {/* subtle headlight at night */}
          {tod === 'night' && <polygon points="22,-6 36,-8 36,-2" fill="#FFF49A" opacity="0.35" />}
        </g>
      );
    }
    return null;
  };

  /* ----------------------- */
  /* Mill buildings (pixel)  */
  /* ----------------------- */

  const renderHandQuern = () => {
    const cx = width / 2 - 18, cy = GROUND_Y - 8;
    return (
      <g shapeRendering="crispEdges">
        <ellipse cx={cx + 24} cy={cy} rx="20" ry="6" fill="rgba(0,0,0,0.25)" />
        <ellipse cx={cx + 24} cy={cy - 4} rx="20" ry="12" fill="#9a8a7a" stroke="#5a4a3a" strokeWidth="1" />
        <ellipse cx={cx + 24} cy={cy - 6} rx="14" ry="10" fill="#8a7a6a" stroke="#6a5a4a" strokeWidth="0.7" />
        <g>
          <animateTransform attributeName="transform" attributeType="XML" type="rotate"
            from={`0 ${cx + 20} ${cy - 12}`} to={`360 ${cx + 20} ${cy - 12}`} dur="6s" repeatCount="indefinite" />
          <ellipse cx={cx + 20} cy={cy - 12} rx="10" ry="7" fill="#a89888" stroke="#7a6a5a" strokeWidth="0.8" />
        </g>
        <rect x={cx + 19} y={cy - 24} width="2" height="10" fill="#6a4a2a" />
        <ellipse cx={cx + 20} cy={cy - 25} rx="4" ry="2" fill="#7a5a3a" />
      </g>
    );
  };

  const renderAnimalMill = () => {
    const bx = width / 2 - 40, by = GROUND_Y - 42;
    return (
      <g shapeRendering="crispEdges">
        <rect x={bx} y={by} width="80" height="30" fill="#d4c4b0" stroke="#9a8a7a" strokeWidth="1" />
        <polygon points={`${bx - 6},${by} ${bx + 40},${by - 16} ${bx + 86},${by}`} fill="#8a6a4a" stroke="#6a4a2a" strokeWidth="0.8" />
        <rect x={bx + 38} y={by - 16} width="4" height="24" fill="#6a5a4a" />
        <g>
          <animateTransform attributeName="transform" attributeType="XML" type="rotate"
            from={`0 ${bx + 40} ${by - 4}`} to={`360 ${bx + 40} ${by - 4}`} dur="15s" repeatCount="indefinite" />
          <rect x={bx + 10} y={by - 6} width="60" height="2" fill="#7a5a3a" />
          {/* tiny donkey block */}
          <rect x={bx + 8} y={by - 8} width="5" height="3" fill="#4a3a2a" />
        </g>
        <ellipse cx={bx + 40} cy={by + 6} rx="18" ry="12" fill="#c8b8a8" stroke="#7a6a5a" strokeWidth="0.8" />
        <rect x={bx + 36} y={by + 16} width="8" height="12" fill="#5a4a3a" />
      </g>
    );
  };

  const renderWaterMill = () => {
    const bw = 120, bx = width / 2 - bw / 2 + 10, by = GROUND_Y - 46;
    const wheelCx = bx - 18, wheelCy = by + 26;
    return (
      <g shapeRendering="crispEdges">
        {renderWaterBand(GROUND_Y + 2, 12)}
        <rect x={bx} y={by} width={bw} height="42" fill="#e8d4c0" stroke="#9a8a7a" strokeWidth="1" />
        <polygon points={`${bx - 6},${by} ${bx + bw / 2},${by - 14} ${bx + bw + 6},${by}`} fill="#7a5a3a" stroke="#5a3a1a" strokeWidth="0.6" />
        {windowGlow(bx + 10, by + 8, bw - 20, 8, 8, year >= 1850)}
        <g>
          <animateTransform attributeName="transform" attributeType="XML" type="rotate"
            from={`0 ${wheelCx} ${wheelCy}`} to={`360 ${wheelCx} ${wheelCy}`} dur="8s" repeatCount="indefinite" />
          <circle cx={wheelCx} cy={wheelCy} r="20" fill="none" stroke="#6a4a2a" strokeWidth="2" />
          <circle cx={wheelCx} cy={wheelCy} r="16" fill="none" stroke="#7a5a3a" strokeWidth="1" />
          {Array.from({ length: 8 }).map((_, i) => {
            const ang = i * 45; const rad = (ang * Math.PI) / 180;
            const x2 = wheelCx + Math.cos(rad) * 20; const y2 = wheelCy + Math.sin(rad) * 20;
            const x1 = wheelCx + Math.cos(rad) * 4;  const y1 = wheelCy + Math.sin(rad) * 4;
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5a3a1a" strokeWidth="1.5" />
                <rect x={x2 - 6} y={y2 - 2} width="12" height="4" fill="#8a6a4a" transform={`rotate(${ang} ${x2} ${y2})`} />
              </g>
            );
          })}
          <circle cx={wheelCx} cy={wheelCy} r="4" fill="#4a3a2a" />
        </g>
      </g>
    );
  };

  const renderWindmill = () => {
    const bx = width / 2 - 20, top = GROUND_Y - 58;
    const cx = width / 2, cy = top + 14;
    return (
      <g shapeRendering="crispEdges">
        <path d={`M ${bx - 16} ${GROUND_Y} L ${bx - 10} ${top} L ${bx + 10} ${top} L ${bx + 16} ${GROUND_Y} Z`} fill="#EFE0D0" stroke="#A89888" strokeWidth="1" />
        <ellipse cx={cx} cy={top + 2} rx="14" ry="8" fill="#8a6a4a" />
        <g>
          <animateTransform attributeName="transform" attributeType="XML" type="rotate"
            from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="10s" repeatCount="indefinite" />
          {Array.from({ length: 4 }).map((_, i) => {
            const ang = i * 90; const rad = (ang * Math.PI) / 180;
            const x2 = cx + Math.cos(rad) * 34; const y2 = cy + Math.sin(rad) * 34;
            return (
              <g key={i}>
                <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#5a3a1a" strokeWidth="2" />
                <path d={`M ${cx + Math.cos(rad) * 10} ${cy + Math.sin(rad) * 10}
                          L ${x2} ${y2}
                          L ${x2 + Math.cos(rad + Math.PI / 2) * 8} ${y2 + Math.sin(rad + Math.PI / 2) * 8}
                          L ${cx + Math.cos(rad) * 10 + Math.cos(rad + Math.PI/2) * 4}
                            ${cy + Math.sin(rad) * 10 + Math.sin(rad + Math.PI/2) * 4} Z`}
                  fill="rgba(250,240,230,0.9)" stroke="#8a7a6a" strokeWidth="0.5" />
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r="3" fill="#4a3a2a" />
        </g>
        {windowGlow(bx - 8, top + 20, 36, 6, 2, year >= 1850)}
        <rect x={bx - 2} y={GROUND_Y - 12} width="8" height="12" fill="#4a3a2a" />
      </g>
    );
  };

  const renderTidalMill = () => {
    const bw = 110, bx = width / 2 - bw / 2, by = GROUND_Y - 42;
    return (
      <g shapeRendering="crispEdges">
        <ellipse cx={width / 2} cy={GROUND_Y + 6} rx={width * 0.35} ry="14" fill="rgba(100,150,200,0.15)" stroke="rgba(80,130,180,0.35)" strokeWidth="1" />
        {renderWaterBand(GROUND_Y + 2, 10)}
        <rect x={bx} y={by} width={bw} height="38" fill="#b8c8d0" stroke="#687888" strokeWidth="1" />
        <polygon points={`${bx - 6},${by} ${bx + bw / 2},${by - 14} ${bx + bw + 6},${by}`} fill="#6a7a8a" stroke="#4a5a6a" strokeWidth="0.6" />
        {windowGlow(bx + 18, by + 8, bw - 36, 8, 4, year >= 1850)}
        <rect x={bx + bw / 2 - 6} y={GROUND_Y - 14} width="12" height="14" fill="#4a3a2a" />
        {/* horizontal wheel hint */}
        <g>
          <animateTransform attributeName="transform" attributeType="XML" type="rotate"
            from={`0 ${bx + bw / 2} ${GROUND_Y - 8}`} to={`360 ${bx + bw / 2} ${GROUND_Y - 8}`} dur="12s" repeatCount="indefinite" />
          <ellipse cx={bx + bw / 2} cy={GROUND_Y - 8} rx="18" ry="9" fill="none" stroke="#5a4a3a" strokeWidth="1" strokeDasharray="2,1" />
          <line x1={bx + bw / 2 - 18} y1={GROUND_Y - 8} x2={bx + bw / 2 + 18} y2={GROUND_Y - 8} stroke="#4a3a2a" strokeWidth="0.8" />
        </g>
      </g>
    );
  };

  const renderSteamMill = () => {
    const bw = 140, bx = width / 2 - bw / 2, by = GROUND_Y - 46;
    return (
      <g shapeRendering="crispEdges">
        <rect x={bx} y={by} width={bw} height="42" fill="#c87868" stroke="#784838" strokeWidth="1.5" />
        <rect x={bx} y={by - 4} width={bw} height="4" fill="#4a3a2a" />
        {windowGlow(bx + 10, by + 10, bw - 20, 8, 7, false)}
        {[0, 1].map((i) => {
          const sx = bx + 18 + i * 60, top = by - 18 - i * 2;
          return (
            <g key={i}>
              <rect x={sx} y={top} width="10" height="18" fill="#c87868" stroke="#684838" strokeWidth="0.8" />
              {!isRuined && <>
                <ellipse cx={sx + 5} cy={top - 6 - ((frame * 0.5) % 18)} rx="5" ry="3" fill="rgba(80,80,80,0.45)" />
                <ellipse cx={sx + 7} cy={top - 12 - ((frame * 0.5) % 18)} rx="7" ry="3" fill="rgba(80,80,80,0.3)" />
              </>}
            </g>
          );
        })}
        {/* side engine house & flywheel */}
        <rect x={bx - 28} y={GROUND_Y - 28} width="18" height="28" fill="#6a6a6a" />
        <g>
          <animateTransform attributeName="transform" attributeType="XML" type="rotate"
            from={`0 ${bx - 18} ${GROUND_Y - 14}`} to={`360 ${bx - 18} ${GROUND_Y - 14}`} dur="2.2s" repeatCount="indefinite" />
          <circle cx={bx - 18} cy={GROUND_Y - 14} r="9" fill="none" stroke="#383838" strokeWidth="2" />
          <line x1={bx - 18} y1={GROUND_Y - 23} x2={bx - 18} y2={GROUND_Y - 5} stroke="#484848" strokeWidth="0.8" />
        </g>
      </g>
    );
  };

  const renderElectricMill = () => {
    const bw = 150, bx = width / 2 - bw / 2, by = GROUND_Y - 44;
    return (
      <g shapeRendering="crispEdges">
        <rect x={bx} y={by} width={bw} height="40" fill="#e8e8e8" stroke="#888" strokeWidth="1.2" />
        <rect x={bx} y={by - 3} width={bw} height="3" fill="#989898" />
        {windowGlow(bx + 14, by + 10, bw - 28, 8, 8, true)}
        {/* silos */}
        <ellipse cx={bx + 24} cy={GROUND_Y - 32} rx="12" ry="9" fill="#d0d0d0" stroke="#787878" strokeWidth="0.8" />
        <rect x={bx + 12} y={GROUND_Y - 32} width="24" height="26" fill="#d0d0d0" stroke="#787878" strokeWidth="0.8" />
        <ellipse cx={bx + 52} cy={GROUND_Y - 36} rx="10" ry="7" fill="#d0d0d0" stroke="#787878" strokeWidth="0.8" />
        <rect x={bx + 42} y={GROUND_Y - 36} width="20" height="22" fill="#d0d0d0" stroke="#787878" strokeWidth="0.8" />
        {tod === 'night' && !isRuined && (
          <rect x={bx + bw - 26} y={by + 6} width="12" height="12" fill="#686868">
            <animate attributeName="fill" values="#686868;#787878;#686868" dur="2s" repeatCount="indefinite" />
          </rect>
        )}
      </g>
    );
  };

  const renderSugarMill = () => {
    const bw = 140, bx = width / 2 - bw / 2, by = GROUND_Y - 40;
    return (
      <g shapeRendering="crispEdges">
        {cane.current.map((s, i) => <rect key={i} x={s.x} y={GROUND_Y - s.h} width="1" height={s.h} fill="#2f7a3d" opacity="0.5" />)}
        <rect x={bx + 6} y={by} width={bw - 12} height="36" fill="none" stroke="#8a6a4a" strokeWidth="1.5" />
        <rect x={bx + 6} y={by} width="6" height="36" fill="#7a5a3a" />
        <rect x={bx + bw - 18} y={by} width="6" height="36" fill="#7a5a3a" />
        <rect x={bx + bw / 2 - 3} y={by} width="6" height="36" fill="#7a5a3a" />
        <polygon points={`${bx},${by} ${bx + bw / 2},${by - 16} ${bx + bw},${by}`} fill="#c8a868" stroke="#a88848" strokeWidth="0.6" />
        {[0, 1, 2].map((k) => {
          const cx = bx + 38 + k * 22, cy = GROUND_Y - 14;
          const dir = k % 2 === 0 ? -1 : 1;
          return (
            <g key={k}>
              <animateTransform attributeName="transform" attributeType="XML" type="rotate"
                from={`0 ${cx} ${cy}`} to={`${dir * 360} ${cx} ${cy}`} dur="4s" repeatCount="indefinite" />
              <ellipse cx={cx} cy={cy} rx="7" ry="12" fill="#686868" stroke="#484848" strokeWidth="0.8" />
            </g>
          );
        })}
        <rect x={bx + 40} y={GROUND_Y - 10} width="60" height="6" fill="#8a7a6a" stroke="#6a5a4a" strokeWidth="0.5" />
        {/* small chimney */}
        <rect x={bx + 10} y={by - 14} width="8" height="14" fill="#985848" stroke="#684838" strokeWidth="0.5" />
        {!isRuined && <ellipse cx={bx + 14} cy={by - 18 - ((frame * 0.5) % 16)} rx="6" ry="3" fill="rgba(80,80,80,0.35)" />}
      </g>
    );
  };

  /* ---------------------- */
  /* Composite mill switch  */
  /* ---------------------- */

  const renderMill = () => {
    switch (variant) {
      case 'hand_quern': return renderHandQuern();
      case 'animal_mill': return renderAnimalMill();
      case 'water_mill': return renderWaterMill();
      case 'windmill': return renderWindmill();
      case 'tidal_mill': return renderTidalMill();
      case 'steam_mill': return renderSteamMill();
      case 'electric_mill': return renderElectricMill();
      case 'sugar_mill': return renderSugarMill();
      default: return renderWaterMill();
    }
  };

  /* ------------------ */
  /* Render final scene */
  /* ------------------ */

  const zoom = 1.1;
  const viewW = width / zoom, viewH = height / zoom, viewX = (width - viewW) / 2, viewY = (height - viewH) / 3;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
      style={{ imageRendering: 'pixelated' }}
      className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-t-lg"
    >
      {renderSky()}
      {renderGround()}
      {renderMill()}
      {renderPath()}
      {renderVehicles()}
      {renderWorkers(3)}
      {/* Ground edge accent */}
      <rect x="0" y={GROUND_Y - 1} width={width} height="1" fill="rgba(0,0,0,0.15)" />
    </svg>
  );
};

export default React.memo(MillBanner);
