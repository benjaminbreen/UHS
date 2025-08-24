/**
 * components/MillBanner.tsx
 * Consistent with MineColonyBanner aesthetic: fixed ground level, gradients, center-zoom, seeded stable noise.
 * Clear visual variants for: water_mill, windmill (post/tower/panemone), tide_mill, animal_mill (gin/capstan).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClimateType, Season, TimeOfDay, BiomeType } from '../types';

type MillKind = 'water_mill' | 'windmill' | 'tide_mill' | 'animal_mill';

interface MillBannerProps {
  millType?: MillKind;
  era?: string;
  culturalZone?: 'european' | 'mena' | 'east_asia' | 'south_asia' | 'sub_saharan' | 'americas' | string;
  climate?: ClimateType;
  season: Season;
  timeOfDay: TimeOfDay;
  width?: number;
  height?: number;
  seed?: number;
  adjacentBiomes?: BiomeType[];
  isRuined?: boolean;
}

// --- Shared constants to match MineColonyBanner vibe ---
const GROUND_Y = 110;
const SKY_HEIGHT = 90; // keep like mining for consistency

// Seeded RNG (stable)
class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number { this.seed = (this.seed * 9301 + 49297) % 233280; return this.seed / 233280; }
  range(min: number, max: number): number { return min + this.next() * (max - min); }
  pick<T>(arr: T[]): T { return arr[Math.floor(this.range(0, arr.length))]; }
}
const hashSeed = (s: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h % 233279) + 1;
};

// Sky palette (as in mining)
const SKY_COLORS: Record<'dawn'|'day'|'dusk'|'night', string[]> = {
  dawn: ['#FF9A8B', '#A8E6CF', '#FFD3BA'],
  day:  ['#87CEEB', '#98D8E8', '#B8E6B8'],
  dusk: ['#FF8C42', '#FF6B6B', '#C44569'],
  night:['#2C3E50', '#34495E', '#4A6741']
};
const getTOD = (t: TimeOfDay): 'dawn'|'day'|'dusk'|'night' => {
  switch (t) { case 'Dawn': return 'dawn'; case 'Dusk': return 'dusk'; case 'Night': return 'night'; default: return 'day'; }
};

const groundPalette = (climate: ClimateType, season: Season) => {
  if (season === 'winter') {
    if (climate === ClimateType.COLD)       return { ground: '#F0F8FF', vegetation: '#E0E8EF', accent: '#C0D0E0' };
    if (climate === ClimateType.TEMPERATE)  return { ground: '#E8F0F8', vegetation: '#D0E0F0', accent: '#B0C0D0' };
    if (climate === ClimateType.MEDITERRANEAN) return { ground: '#86EFAC', vegetation: '#22C55E', accent: '#16A34A' };
  }
  if (climate === ClimateType.COLD)         return { ground: '#F0F8FF', vegetation: '#E0E8EF', accent: '#C0D0E0' };
  if (climate === ClimateType.ARID)         return { ground: '#D2B48C', vegetation: '#CD853F', accent: '#A0826D' };
  if (climate === ClimateType.MEDITERRANEAN) {
    if (season === 'summer')                return { ground: '#C4B5A0', vegetation: '#A08060', accent: '#8B7355' };
    return                                  { ground: '#B4C5A0', vegetation: '#8B9070', accent: '#7A8060' };
  }
  if (climate === ClimateType.TROPICAL)     return { ground: '#4A7C59', vegetation: '#059669', accent: '#047857' };
  if (climate === ClimateType.SEMITROPICAL) return { ground: '#6EE7B7', vegetation: '#32CD32', accent: '#228B22' };
  return                                    { ground: '#86EFAC', vegetation: '#22C55E', accent: '#16A34A' };
};

const parseYear = (era?: string) => {
  if (!era) return 1500;
  const e = era.toLowerCase();
  if (/^\d{3,4}$/.test(e)) return parseInt(e, 10);
  if (e.includes('ancient')) return 200;
  if (e.includes('medieval')) return 1200;
  if (e.includes('early')) return 1600;
  if (e.includes('industrial')) return 1850;
  if (e.includes('modern')) return 1960;
  return 1500;
};

const subtypeForWindmill = (year: number, zone: string): 'post' | 'tower' | 'panemone' => {
  const z = (zone || 'european').toLowerCase();
  if (z === 'mena') return 'panemone';                 // vertical-axis Persian
  if (year < 1500) return 'post';                      // medieval post mill
  return 'tower';                                      // early modern/modern tower
};

const MillBanner: React.FC<MillBannerProps> = ({
  millType = 'water_mill',
  era = '1500',
  culturalZone = 'european',
  climate = ClimateType.TEMPERATE,
  season,
  timeOfDay,
  width = 600,
  height = 250,
  seed,
  adjacentBiomes = [],
  isRuined = false
}) => {
  // Stable seed based on inputs (unless seed provided)
  const baseSeed = useMemo(
    () => seed ?? hashSeed([millType, era, culturalZone, climate, season, timeOfDay, width, height].join('|')),
    [millType, era, culturalZone, climate, season, timeOfDay, width, height, seed]
  );
  const rng = useMemo(() => new SeededRandom(baseSeed), [baseSeed]);
  const staticRng = useMemo(() => new SeededRandom(baseSeed + 9999), [baseSeed]);

  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (isRuined) return;
    const id = setInterval(() => setFrame(f => f + 1), 60);
    return () => clearInterval(id);
  }, [isRuined]);

  // Consistent MineColony zoom
  const zoomLevel = 1.5;
  const viewW = width / zoomLevel;
  const viewH = height / zoomLevel;
  const viewX = (width - viewW) / 2;
  const viewY = (height - viewH) / 3;

  const year = parseYear(era);
  const tod = getTOD(timeOfDay);
  const palette = groundPalette(climate, season);
  const nearOcean = adjacentBiomes.includes(BiomeType.SHALLOW_OCEAN) || adjacentBiomes.includes(BiomeType.DEEP_OCEAN);

  // --- STABLE RANDOM ELEMENTS (no wiggle): refs filled once ---
  const clouds = useRef<{ x: number; y: number; w: number; }[]>([]);
  const stars  = useRef<{ x: number; y: number; }[]>([]);
  const pebbles= useRef<{ x: number; yoff: number; w: number; h: number; }[]>([]);
  const birds  = useRef<{ baseX: number; baseY: number; ampX: number; ampY: number; speed: number; }[]>([]);
  const windowPhases = useRef<number[]>([]);

  if (clouds.current.length === 0) {
    for (let i = 0; i < 4; i++) {
      clouds.current.push({
        x: -90 + i * 180 + staticRng.range(-20, 20),
        y: 18 + staticRng.range(-8, 8),
        w: staticRng.range(18, 26)
      });
    }
  }
  if (tod === 'night' && stars.current.length === 0) {
    for (let i = 0; i < 18; i++) stars.current.push({ x: staticRng.range(6, width - 6), y: staticRng.range(6, SKY_HEIGHT - 6) });
  }
  if (pebbles.current.length === 0) {
    const count = Math.floor(width / 12);
    for (let i = 0; i < count; i++) {
      pebbles.current.push({
        x: i * 12 + staticRng.range(-3, 3),
        yoff: staticRng.range(0, 3),
        w: staticRng.range(2, 4),
        h: staticRng.range(1, 3),
      });
    }
  }
  if (birds.current.length === 0) {
    const n = 2;
    for (let i = 0; i < n; i++) birds.current.push({
      baseX: 30 + i * 160 + staticRng.range(-10, 10),
      baseY: 20 + staticRng.range(-3, 3),
      ampX: staticRng.range(6, 12),
      ampY: staticRng.range(1.2, 2.5),
      speed: staticRng.range(0.02, 0.05)
    });
  }
  if (windowPhases.current.length === 0) {
    for (let i = 0; i < 24; i++) windowPhases.current.push(staticRng.range(0, Math.PI * 2));
  }

  // --- SKY / HORIZON / GROUND (match mining style) ---
  const skyGradient = SKY_COLORS[tod];

  const renderSky = () => {
    const cloudDrift = (frame * 0.10) % (width + 120);
    return (
      <g>
        <defs>
          <linearGradient id="mill_sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={skyGradient[0]} />
            <stop offset="50%"  stopColor={skyGradient[1]} />
            <stop offset="100%" stopColor={skyGradient[2] || skyGradient[1]} />
          </linearGradient>
          <filter id="moonSoft"><feGaussianBlur stdDeviation="1.2" /></filter>
        </defs>
        <rect x="0" y="0" width={width} height={SKY_HEIGHT} fill="url(#mill_sky)" />
        {tod !== 'night'
          ? <circle cx={width - 38} cy={20} r={9} fill="#FFD700" opacity="0.95" />
          : (<g>
              <circle cx={width - 40} cy={20} r={7} fill="#F3F3F3" />
              <circle cx={width - 40} cy={20} r={10} fill="#F3F3F3" opacity="0.15" filter="url(#moonSoft)" />
            </g>)
        }
        {tod === 'night' && stars.current.map((s, i) => (
          <rect key={`star-${i}`} x={s.x} y={s.y} width="1" height="1" fill="#FFFFFF" opacity="0.9" shapeRendering="crispEdges" />
        ))}
        {clouds.current.map((c, i) => {
          const cx = c.x + cloudDrift - 100;
          return (
            <g key={`cloud-${i}`} opacity={tod === 'night' ? 0.35 : 0.8}>
              <rect x={cx} y={c.y} width={c.w} height={c.w * 0.45} rx="4" fill="#F1F5F9" />
              <rect x={cx + 8} y={c.y - 2} width={c.w + 6} height={c.w * 0.45} rx="4" fill="#F1F5F9" />
              <rect x={cx + 5} y={c.y + 4} width={c.w - 6} height={c.w * 0.35} rx="3" fill="#F1F5F9" />
            </g>
          );
        })}
        {tod !== 'night' && birds.current.map((b, i) => {
          const t = frame * b.speed;
          const x = b.baseX + Math.sin(t) * b.ampX;
          const y = b.baseY + Math.cos(t) * b.ampY;
          return <path key={`bird-${i}`} d={`M${x},${y} l-3,-1 l3,1 l3,-1`} stroke="#2a2a2a" strokeWidth="0.6" fill="none" />;
        })}
      </g>
    );
  };

  const renderHorizon = () => {
    const layers = [
      { color: '#7DA3A6', opacity: 0.28, height: 32 },
      { color: '#5C7E86', opacity: 0.44, height: 28 },
      { color: '#43606A', opacity: 0.58, height: 24 }
    ];
    if (climate === ClimateType.ARID || (climate === ClimateType.MEDITERRANEAN && season === 'summer')) {
      layers[0].color = '#C9A97A'; layers[1].color = '#B48E63'; layers[2].color = '#9A7854';
    }
    if (climate === ClimateType.COLD || (climate === ClimateType.TEMPERATE && season === 'winter')) {
      layers[0].color = '#DCE7F2'; layers[1].color = '#C5D5EA'; layers[2].color = '#AFC2D7';
    }
    return (
      <g>
        {layers.map((layer, idx) => {
          const pts: string[] = [];
          for (let x = 0; x <= width + 40; x += 40) {
            const baseY = SKY_HEIGHT - layer.height;
            const peakY = baseY - staticRng.range(4, 12);
            const nextY = SKY_HEIGHT - layer.height;
            if (x === 0) pts.push(`${x - 20},${SKY_HEIGHT}`);
            pts.push(`${x},${baseY}`);
            pts.push(`${x + 20},${peakY}`);
            pts.push(`${x + 40},${nextY}`);
            if (x >= width) pts.push(`${width + 20},${SKY_HEIGHT}`);
          }
          return <polygon key={idx} points={pts.join(' ') + ` ${width + 20},${SKY_HEIGHT} -20,${SKY_HEIGHT}`} fill={layer.color} opacity={layer.opacity} />;
        })}
      </g>
    );
  };

  const renderGround = () => {
    const isSnowy = climate === ClimateType.COLD || (climate === ClimateType.TEMPERATE && season === 'winter');
    return (
      <g>
        <defs>
          <linearGradient id="mill_ground" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={palette.ground} stopOpacity="1" />
            <stop offset="55%"  stopColor={palette.ground} stopOpacity="0.96" />
            <stop offset="100%" stopColor={palette.accent} stopOpacity="0.92" />
          </linearGradient>
        </defs>
        <rect x="0" y={GROUND_Y} width={width} height={height - GROUND_Y} fill="url(#mill_ground)" />
        {pebbles.current.map((p, i) => (
          <rect key={`peb-${i}`} x={p.x} y={GROUND_Y + p.yoff} width={p.w} height={p.h}
                fill={isSnowy ? '#E0E8EF' : '#756B5A'} opacity={isSnowy ? 0.35 : 0.4} />
        ))}
      </g>
    );
  };

  // --- WATERBAND for water/tide mills ---
  const renderWaterband = (variant: 'river' | 'estuary') => {
    const bandY = GROUND_Y + 6;
    const bandH = 14;
    const waterBase = tod === 'night' ? '#2A4560' : '#4A90E2';
    const waveStroke = tod === 'night' ? '#1D3247' : '#5AA5F2';
    const offset = (frame * 2) % 24;
    return (
      <g>
        <rect x="0" y={bandY} width={width} height={bandH} fill={waterBase} opacity={variant === 'estuary' ? 0.55 : 0.5} />
        {Array.from({ length: Math.ceil(width / 24) + 2 }).map((_, i) => {
          const sx = (i * 24 - offset);
          return <path key={i} d={`M ${sx},${bandY + 3} Q ${sx + 12},${bandY + 1} ${sx + 24},${bandY + 3}`} stroke={waveStroke} strokeWidth="0.8" fill="none" opacity="0.7" />;
        })}
      </g>
    );
  };

  // --- SHARED windows with night glow/torch ---
  const renderWindows = (x: number, y: number, w: number, rows: number[]) => {
    const cols = Math.max(5, Math.floor((w - 8) / 10));
    const colW = Math.min(10, Math.max(8, (w - 8) / cols));
    const isMedievalOrEarly = year <= 1600;
    return (
      <g>
        <filter id="winGlow"><feGaussianBlur stdDeviation="1.2" /></filter>
        {rows.map((ry, rIndex) => (
          Array.from({ length: cols }).map((_, c) => {
            const wx = x + 4 + c * colW;
            const wy = y + ry;
            const idx = (rIndex * cols + c) % windowPhases.current.length;
            const phase = windowPhases.current[idx];
            const lightOn = tod === 'night' && !isRuined;
            const electric = lightOn && year >= 1850;
            const torch = lightOn && !electric;
            const fill = lightOn ? (electric ? '#FFF49A' : '#FFB35A') : '#87CEEB';
            const alpha = lightOn ? (electric ? 0.7 + 0.25 * Math.sin(frame * 0.12 + phase) : 0.65 + 0.25 * Math.sin(frame * 0.18 + phase)) : 0.9;
            return (
              <g key={`w-${rIndex}-${c}`}>
                <rect x={wx} y={wy} width={colW - 2} height={6} fill={isRuined ? '#1a1a1a' : fill} opacity={isRuined ? 1 : alpha} />
                {lightOn && (
                  <rect x={wx - 1} y={wy - 1} width={colW} height={8}
                        fill={electric ? '#FFF49A' : '#FF9B4A'} opacity={0.25} filter="url(#winGlow)" />
                )}
                {torch && isMedievalOrEarly && (
                  <polygon points={`${wx + (colW/2)},${wy+3} ${wx + (colW/2) - 1},${wy+6} ${wx + (colW/2) + 1},${wy+6}`}
                           fill="#FF7A2A" opacity={0.8} />
                )}
              </g>
            );
          })
        ))}
      </g>
    );
  };

  // --- MILL VARIANTS ---
  const renderWaterMill = () => {
    const cx = width / 2;
    const wallFill = '#BFAF9A';
    const roofFill = year < 1600 ? '#7F4E2E' : '#6B5A50';
    const rotation = isRuined ? 0 : (frame * 4) % 360;

    return (
      <g>
        {renderWaterband('river')}
        {/* House */}
        <rect x={cx - 38} y={GROUND_Y - 34} width={76} height={34} fill={isRuined ? '#6B6B6B' : wallFill} />
        <polygon points={`${cx - 42},${GROUND_Y - 34} ${cx},${GROUND_Y - 48} ${cx + 42},${GROUND_Y - 34}`} fill={isRuined ? '#3E3E3E' : roofFill} />
        {renderWindows(cx - 26, GROUND_Y - 34, 52, [6, 22])}
        <rect x={cx - 4} y={GROUND_Y - 14} width="8" height="14" fill={isRuined ? '#2a2a2a' : '#3a2a1a'} />

        {/* Wheel (undershot) */}
        <g transform={`translate(${cx + 50}, ${GROUND_Y - 2})`}>
          <circle cx="0" cy="0" r="16" fill="none" stroke="#5B3A24" strokeWidth="3" />
          <g transform={`rotate(${rotation} 0 0)`}>
            {[0,45,90,135,180,225,270,315].map(a => (
              <rect key={a} x="-1.2" y={-16} width="2.4" height="32" fill="#7B5133" transform={`rotate(${a} 0 0)`} />
            ))}
          </g>
          <circle cx="0" cy="0" r="3" fill="#3E2A1C" />
        </g>
      </g>
    );
  };

  const renderWindmill = () => {
    const cx = width / 2;
    const subtype = subtypeForWindmill(year, culturalZone);
    const spin = isRuined ? 0 : (frame * 3) % 360;

    if (subtype === 'panemone') {
      // Vertical-axis Persian windmill
      return (
        <g>
          <rect x={cx - 20} y={GROUND_Y - 30} width="40" height="30" fill={isRuined ? '#6E6B63' : '#C8B48E'} />
          <g transform={`translate(${cx}, ${GROUND_Y - 20})`}>
            <circle cx="0" cy="0" r="12" fill="none" stroke="#6B5A3E" strokeWidth="2" />
            <g transform={`rotate(${spin} 0 0)`}>
              {[0,30,60,90,120,150,180].map(a => (
                <rect key={a} x="-1" y="-12" width="2" height="24" fill="#876846" transform={`rotate(${a} 0 0)`} />
              ))}
            </g>
          </g>
          <rect x={cx - 4} y={GROUND_Y - 12} width="8" height="12" fill="#4A3A2A" />
        </g>
      );
    }

    if (subtype === 'post') {
      // Medieval post mill on trestle
      return (
        <g>
          <rect x={cx - 22} y={GROUND_Y - 36} width="44" height="28" fill={isRuined ? '#6B6B6B' : '#BFAF9A'} />
          <polygon points={`${cx - 26},${GROUND_Y - 36} ${cx},${GROUND_Y - 48} ${cx + 26},${GROUND_Y - 36}`} fill={isRuined ? '#3E3E3E' : '#7F4E2E'} />
          <rect x={cx - 2} y={GROUND_Y - 16} width="4" height="16" fill="#6B4A2E" />
          <rect x={cx - 4} y={GROUND_Y - 8} width="8" height="8" fill="#6B4A2E" />
          <g transform={`translate(${cx}, ${GROUND_Y - 34})`}>
            <g transform={`rotate(${spin} 0 0)`}>
              {[0,90,180,270].map(a => (
                <g key={a} transform={`rotate(${a} 0 0)`}>
                  <rect x="-1" y="-1" width="2" height="26" fill="#7B5A3D" />
                  <polygon points={`-6,6 6,6 4,24 -4,24`} fill={isRuined ? '#555' : '#EEE7D6'} opacity="0.95" />
                </g>
              ))}
            </g>
            <circle cx="0" cy="0" r="2.2" fill="#3E2A1C" />
          </g>
        </g>
      );
    }

    // Tower mill
    return (
      <g>
        <polygon points={`${cx - 16},${GROUND_Y} ${cx - 12},${GROUND_Y - 46} ${cx + 12},${GROUND_Y - 46} ${cx + 16},${GROUND_Y}`} fill={isRuined ? '#6B6B6B' : '#D4D0C6'} />
        <polygon points={`${cx - 16},${GROUND_Y - 46} ${cx},${GROUND_Y - 54} ${cx + 16},${GROUND_Y - 46}`} fill={isRuined ? '#3E3E3E' : '#6B4A2E'} />
        <rect x={cx - 2} y={GROUND_Y - 38} width="4" height="4" fill={tod === 'night' ? '#FFF49A' : '#87CEEB'} />
        <rect x={cx - 2} y={GROUND_Y - 28} width="4" height="4" fill={tod === 'night' ? '#FFF49A' : '#87CEEB'} />
        <g transform={`translate(${cx}, ${GROUND_Y - 48})`}>
          <g transform={`rotate(${spin} 0 0)`}>
            {[0,90,180,270].map(a => (
              <g key={a} transform={`rotate(${a} 0 0)`}>
                <rect x="-1" y="0" width="2" height="28" fill="#7B5A3D" />
                <polygon points={`-8,6 8,6 6,26 -6,26`} fill={isRuined ? '#555' : '#EEE7D6'} />
              </g>
            ))}
          </g>
          <circle cx="0" cy="0" r="2.2" fill="#3E2A1C" />
        </g>
        <rect x={cx - 3} y={GROUND_Y - 10} width="6" height="10" fill="#4A3A2A" />
      </g>
    );
  };

  const renderTideMill = () => {
    const cx = width / 2;
    const rotation = isRuined ? 0 : (frame * 3.5) % 360;
    return (
      <g>
        {renderWaterband('estuary')}
        {/* causeway */}
        <rect x="0" y={GROUND_Y + 12} width={width} height="4" fill="#7C7268" />
        {/* long low building */}
        <rect x={cx - 56} y={GROUND_Y - 20} width="112" height="20" fill={isRuined ? '#6B6B6B' : '#A69683'} />
        <rect x={cx - 58} y={GROUND_Y - 22} width="116" height="2" fill={isRuined ? '#3E3E3E' : '#6B4A2E'} />
        {renderWindows(cx - 44, GROUND_Y - 20, 88, [6, 14])}
        {/* big door */}
        <rect x={cx - 6} y={GROUND_Y - 12} width="12" height="12" fill="#3A2D25" />
        {/* sluice slots */}
        <rect x={cx - 24} y={GROUND_Y + 10} width="4" height="6" fill="#534B44" />
        <rect x={cx + 18} y={GROUND_Y + 10} width="4" height="6" fill="#534B44" />
        {/* wheel at end */}
        <g transform={`translate(${cx + 64}, ${GROUND_Y + 6})`}>
          <circle cx="0" cy="0" r="14" fill="none" stroke="#5B3A24" strokeWidth="3" />
          <g transform={`rotate(${rotation} 0 0)`}>
            {[0,45,90,135,180,225,270,315].map(a => (
              <rect key={a} x="-1.2" y={-14} width="2.4" height="28" fill="#7B5133" transform={`rotate(${a} 0 0)`} />
            ))}
          </g>
          <circle cx="0" cy="0" r="3" fill="#3E2A1C" />
        </g>
        {/* sea birds */}
        {nearOcean && Array.from({ length: 3 }).map((_, i) => (
          <polygon key={`gull-${i}`} points={`${60 + i*36},${GROUND_Y - 22} ${66 + i*36},${GROUND_Y - 20} ${60 + i*36},${GROUND_Y - 18}`} fill="#EDEDED" opacity="0.85" />
        ))}
      </g>
    );
  };

  const renderAnimalMill = () => {
    // Circular horse/donkey gin driving capstan gear
    const cx = width / 2;
    const trackR = 24;
    const spin = isRuined ? 0 : (frame * 2.2) % 360; // animal walks around slowly
    const animalCount = 1; // simple
    return (
      <g>
        {/* round track */}
        <circle cx={cx} cy={GROUND_Y - 6} r={trackR + 4} fill="none" stroke="#7B5A3D" strokeWidth="2" opacity="0.6" />
        {/* central post & gear drum */}
        <rect x={cx - 2} y={GROUND_Y - 14} width="4" height="14" fill="#6B4A2E" />
        <circle cx={cx} cy={GROUND_Y - 14} r="6" fill="#7B5A3D" stroke="#5B3A24" strokeWidth="1" />

        {/* mill shed */}
        <rect x={cx - 34} y={GROUND_Y - 30} width="68" height="30" fill={isRuined ? '#6B6B6B' : '#BFAF9A'} />
        <polygon points={`${cx - 38},${GROUND_Y - 30} ${cx},${GROUND_Y - 42} ${cx + 38},${GROUND_Y - 30}`} fill={isRuined ? '#3E3E3E' : '#7F4E2E'} />
        {renderWindows(cx - 24, GROUND_Y - 30, 48, [8])}
        <rect x={cx - 3} y={GROUND_Y - 12} width="6" height="12" fill="#3a2a1a" />

        {/* rotating arm + animal */}
        <g transform={`translate(${cx}, ${GROUND_Y - 6}) rotate(${spin})`}>
          {/* arm */}
          <rect x="0" y="-1" width={trackR} height="2" fill="#6B4A2E" />
          {/* animal (donkey/horse) at arm end */}
          {Array.from({ length: animalCount }).map((_, i) => (
            <g key={i} transform={`translate(${trackR}, 0)`}>
              {/* body */}
              <rect x="-4" y="-3" width="8" height="6" fill="#6A5846" />
              {/* head */}
              <rect x="4" y="-2" width="3" height="3" fill="#6A5846" />
              {/* legs */}
              <rect x="-3.5" y="3" width="1" height="3" fill="#3A2D25" />
              <rect x="-1.5" y="3" width="1" height="3" fill="#3A2D25" />
              <rect x="0.5"  y="3" width="1" height="3" fill="#3A2D25" />
              <rect x="2.5"  y="3" width="1" height="3" fill="#3A2D25" />
              {/* harness */}
              <rect x="-1" y="-1" width="2" height="2" fill="#3A2D25" />
            </g>
          ))}
        </g>
      </g>
    );
  };

  // --- DISPATCH ---
  const renderMill = () => {
    switch (millType) {
      case 'water_mill': return renderWaterMill();
      case 'windmill':   return renderWindmill();
      case 'tide_mill':  return renderTideMill();
      case 'animal_mill':return renderAnimalMill();
      default:           return renderWaterMill();
    }
  };

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
      style={{ imageRendering: 'pixelated' }}
      className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-t-lg"
    >
      {renderSky()}
      {renderHorizon()}
      {renderGround()}
      {renderMill()}
    </svg>
  );
};

export default React.memo(MillBanner);
