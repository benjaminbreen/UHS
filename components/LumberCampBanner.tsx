/**
 * components/banners/LumberCampBanner.tsx — Atmospheric pixel‑art lumber camp banner
 *
 * Design goals
 * - Pixel‑art as an aesthetic (crisp grid, small sprites) with sophisticated scene art:
 *   layered mountains, volumetric fog, sun/moon glow, soft vignette, lantern bloom, rain/snow.
 * - Historically informed variants for buildings/vehicles/props (medieval, industrial U.S., East Asian,
 *   Nordic, Siberian, Tropical, Modern mechanized), with culture‑specific accents.
 * - Smooth, light animations: clouds parallax, smoke drift, saw blade tick, character walk/swing cycles,
 *   water shimmer if present, fire flicker at night.
 * - Deterministic seed for reproducibility; compatible props with Marketplace/Farm banners.
 * - Wide default layout to fill modal banners.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HistoricalEra, CulturalZone, ClimateType, Season, TimeOfDay, BiomeType } from '../types';

interface LumberCampBannerProps {
  era?: string;
  culturalZone?: string;
  climate?: ClimateType;
  season: Season;
  timeOfDay: TimeOfDay; // 'Dawn' | 'Day' | 'Dusk' | 'Night'
  width?: number;
  height?: number;
  seed?: number;
  adjacentBiomes?: BiomeType[];
}

// ------------------------- RNG --------------------------------------------
class RNG {
  private s: number;
  constructor(seed: number) { this.s = (seed || 1) >>> 0; }
  next() { // xorshift32
    let x = this.s; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.s = x >>> 0; return (this.s & 0xffffffff) / 0x100000000; }
  range(min: number, max: number) { return min + this.next() * (max - min); }
  int(min: number, max: number) { return Math.floor(this.range(min, max + 1)); }
  pick<T>(arr: T[]): T { return arr[Math.max(0, Math.min(arr.length - 1, this.int(0, arr.length - 1)))]; }
}

// ------------------------- Pixel grid & helpers ---------------------------
// Logical pixel grid — draw using integer rects; scale up to device pixels.
const LOGICAL_W = 800; // extended width to fully fill modal width
const LOGICAL_H = 200; // taller for richer sky/land ratio

const usePixelGrid = (targetW: number, targetH: number) => {
  const px = Math.max(1, Math.floor(Math.min(targetW / LOGICAL_W, targetH / LOGICAL_H)));
  return { px, viewW: LOGICAL_W * px, viewH: LOGICAL_H * px };
};

const PR: React.FC<{ x: number; y: number; w?: number; h?: number; fill: string; opacity?: number }>
  = ({ x, y, w = 1, h = 1, fill, opacity }) => (
    <rect x={x} y={y} width={w} height={h} fill={fill} opacity={opacity} shapeRendering="crispEdges" />
  );

// ------------------------- Color utils ------------------------------------
const clamp = (v: number, a=0, b=255) => Math.max(a, Math.min(b, v));
const hexToRgb = (hex: string) => {
  const n = hex.replace('#','');
  return { r: parseInt(n.slice(0,2),16), g: parseInt(n.slice(2,4),16), b: parseInt(n.slice(4,6),16) };
};
const rgbToHex = (r:number,g:number,b:number) => `#${clamp(r).toString(16).padStart(2,'0')}${clamp(g).toString(16).padStart(2,'0')}${clamp(b).toString(16).padStart(2,'0')}`;
const shade = (hex: string, pct: number) => { // pct [-100..100]
  const {r,g,b} = hexToRgb(hex);
  const f = (v: number) => pct >= 0 ? v + (255 - v) * pct/100 : v + v * pct/100;
  return rgbToHex(Math.round(f(r)), Math.round(f(g)), Math.round(f(b)));
};

// ------------------------- Palettes ---------------------------------------
const TIME_PAL = {
  Dawn:   { skyTop: '#f8a07e', skyMid: '#ffc89f', skyBot: '#ffeec7', sun: '#ffd46b', star:'#cfe4ff', light: 0.85, shade: 0.22 },
  Day:    { skyTop: '#6fb9ff', skyMid: '#a9ddff', skyBot: '#d5f1ff', sun: '#ffe27a', star:'#cfe4ff', light: 1.00, shade: 0.15 },
  Dusk:   { skyTop: '#5c5b97', skyMid: '#e07a5f', skyBot: '#f2cc8f', sun: '#ffb15a', star:'#d8e8ff', light: 0.75, shade: 0.28 },
  Night:  { skyTop: '#081424', skyMid: '#0d1e35', skyBot: '#0a1626', sun: '#f6f7ff', star:'#cfd7ff', light: 0.38, shade: 0.55 },
};

const CLIMATE_PAL: Record<ClimateType, { soil: string; grass: string; sod: string; rock: string; snow: string; pine: string; leaf: string }>
  = {
    [ClimateType.TEMPERATE]: { soil:'#6f5a3d', grass:'#3f7d2a', sod:'#2f5e1f', rock:'#7c7f87', snow:'#f2f5f9', pine:'#2e5a36', leaf:'#c47c2f' },
    [ClimateType.ARID]:      { soil:'#b78a57', grass:'#a59b52', sod:'#8e7e39', rock:'#a06c3c', snow:'#f2f5f9', pine:'#6a7b3a', leaf:'#d18b3c' },
    [ClimateType.TROPICAL]:  { soil:'#6f5c2b', grass:'#2aa43d', sod:'#227f32', rock:'#626a6a', snow:'#f2f5f9', pine:'#1c8a34', leaf:'#d9a43a' },
    [ClimateType.COLD]:      { soil:'#7e7e86', grass:'#3f6b3f', sod:'#345836', rock:'#8b95a6', snow:'#e9eef5', pine:'#2c5334', leaf:'#b17b34' },
  };

// ------------------------- Variant logic ----------------------------------
type VariantKey = 'medieval_european'|'industrial_american'|'east_asian'|'nordic'|'siberian'|'tropical'|'modern';
const pickVariant = (era?: string, zone?: string): VariantKey => {
  const y = Number.parseInt(era || '1750');
  const z = (zone||'european').toLowerCase();
  if (/(nordic|scand)/.test(z)) return 'nordic';
  if (/(siber|arctic)/.test(z)) return 'siberian';
  if (/(asia|east)/.test(z)) return y < 1880 ? 'east_asian' : 'modern';
  if (/(tropic|afric|subsah)/.test(z)) return 'tropical';
  if (/(amer|north_amer)/.test(z)) return y < 1870 ? 'medieval_european' : (y < 1950 ? 'industrial_american' : 'modern');
  // default europe
  return y < 1800 ? 'medieval_european' : (y < 1945 ? 'industrial_american' : 'modern');
};

// ------------------------- Entities ---------------------------------------
interface Character { id: string; x: number; y: number; dir: 1|-1; role: 'woodcutter'|'hauler'|'overseer'|'sawyer'; speed: number; carry?: boolean; swing?: number; }
interface Vehicle { id: string; x: number; y: number; dir: 1|-1; kind: 'ox_cart'|'horse_wagon'|'sled'|'buffalo_cart'|'donkey'|'truck'|'steam_donkey'; speed: number; }

// ------------------------- Component --------------------------------------
const LumberCampBanner: React.FC<LumberCampBannerProps> = ({
  era,
  culturalZone,
  climate = ClimateType.TEMPERATE,
  season,
  timeOfDay,
  width = 1280,
  height = 240,
  seed = 1337,
  adjacentBiomes = [],
}) => {
  const { px, viewW, viewH } = usePixelGrid(width, height);
  const T = TIME_PAL[timeOfDay] || TIME_PAL.Day;
  const C = CLIMATE_PAL[climate] || CLIMATE_PAL[ClimateType.TEMPERATE];
  const variant = useMemo(() => pickVariant(era, culturalZone), [era, culturalZone]);
  const rng = useMemo(() => new RNG(seed), [seed]);

  // world positions
  const HORIZON_Y = 80; // sky/land cutoff
  const GROUND_Y = 110; // ground line for camp - matching other POI banners for consistency

  // anim clock
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    let last = 0; const loop = (t: number) => { if (!last) last = t; const dt = t - last; last = t; if (dt > 14) setTick(v => (v+1)%1000000); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop); return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // precompute entities
  const charsRef = useRef<Character[]>([]);
  const vehRef = useRef<Vehicle[]>([]);
  const smokePhase = useRef(0);
  const firePhase = useRef(0);
  
  // precompute star positions to avoid static/jumping
  const starsRef = useRef<{x: number, y: number, bright: boolean}[]>([]);

  useEffect(() => {
    const Cc: Character[] = [];
    const Vv: Vehicle[] = [];
    
    // Generate fixed star positions once
    if (starsRef.current.length === 0) {
      const stars = [];
      for (let i = 0; i < 70; i++) {
        stars.push({
          x: rng.int(6, LOGICAL_W - 36),
          y: rng.int(4, HORIZON_Y - 8),
          bright: i % 5 === 0
        });
      }
      starsRef.current = stars;
    }

    const makeCutter = (i: number): Character => ({ id:`wc-${i}`, x:rng.int(40, LOGICAL_W-40), y: GROUND_Y-1, dir:rng.next()>0.5?1:-1, role:'woodcutter', speed: 0.18 + rng.next()*0.14, carry: rng.next()>0.6, swing:rng.range(0, Math.PI*2) });
    const makeHauler = (i: number): Character => ({ id:`hl-${i}`, x:rng.int(30, LOGICAL_W-30), y: GROUND_Y, dir:rng.next()>0.5?1:-1, role:'hauler', speed: 0.16 + rng.next()*0.12, carry:true });
    const makeOverseer = (): Character => ({ id:'ov-0', x:rng.int(60, LOGICAL_W-60), y: GROUND_Y-2, dir:1, role:'overseer', speed: 0.12 });
    const makeSawyer = (i: number): Character => ({ id:`sw-${i}`, x:rng.int(60, LOGICAL_W-60), y: GROUND_Y-2, dir:rng.next()>0.5?1:-1, role:'sawyer', speed: 0.14 });

    const pushVehicle = (kind: Vehicle['kind'], y = GROUND_Y, speed = 0.20, dir: 1|-1 = 1) => {
      Vv.push({ id:`${kind}-${rng.int(0,9999)}` , x: dir===1? -50 : LOGICAL_W+50, y, kind, dir, speed });
    };

    switch (variant) {
      case 'medieval_european':
        for (let i=0;i<3;i++) Cc.push(makeCutter(i));
        Cc.push(makeOverseer());
        Cc.push(makeSawyer(0), makeSawyer(1));
        pushVehicle('ox_cart', GROUND_Y, 0.16, 1);
        break;
      case 'industrial_american':
        for (let i=0;i<4;i++) Cc.push(makeCutter(i));
        Cc.push(makeHauler(0));
        pushVehicle('horse_wagon', GROUND_Y, 0.26, 1);
        if ((Number(era||'1900')) >= 1880) pushVehicle('steam_donkey', GROUND_Y-12, 0, 1);
        break;
      case 'east_asian':
        for (let i=0;i<3;i++) Cc.push(makeCutter(i)); Cc.push(makeHauler(0));
        pushVehicle('buffalo_cart', GROUND_Y, 0.16, 1);
        break;
      case 'nordic':
        for (let i=0;i<3;i++) Cc.push(makeCutter(i));
        pushVehicle(season==='winter' ? 'sled' : 'horse_wagon', GROUND_Y, season==='winter'?0.24:0.26, -1);
        break;
      case 'siberian':
        for (let i=0;i<2;i++) Cc.push(makeCutter(i));
        pushVehicle('sled', GROUND_Y, 0.25, -1);
        break;
      case 'tropical':
        for (let i=0;i<2;i++) Cc.push(makeCutter(i)); Cc.push(makeHauler(0), makeHauler(1));
        pushVehicle('buffalo_cart', GROUND_Y, 0.18, 1);
        break;
      case 'modern':
        Cc.push(makeOverseer()); for (let i=0;i<2;i++) Cc.push(makeCutter(i));
        pushVehicle('truck', GROUND_Y, 0.5, 1);
        break;
    }

    charsRef.current = Cc; vehRef.current = Vv; smokePhase.current = 0; firePhase.current = 0;
  }, [variant, era, rng, season]);

  // animate entities
  useEffect(() => {
    const Cc = charsRef.current; const Vv = vehRef.current; smokePhase.current = (smokePhase.current + 1) % 10000; firePhase.current = (firePhase.current + 1) % 10000;
    for (let i=0;i<Cc.length;i++){
      const c = Cc[i]; c.x += c.speed * c.dir; if (c.x < 24 || c.x > LOGICAL_W-24) { c.dir *= -1; c.x = Math.max(24, Math.min(LOGICAL_W-24, c.x)); }
      if (c.role==='woodcutter' && typeof c.swing==='number') c.swing += 0.18; // axe phase
    }
    for (let i=0;i<Vv.length;i++){
      const v = Vv[i]; if (v.kind==='steam_donkey') continue; v.x += v.speed*v.dir; if (v.x < -80) v.x = LOGICAL_W+80; if (v.x > LOGICAL_W+80) v.x = -80; }
  }, [tick]);

  // biome flags
  const hasForest = adjacentBiomes?.includes(BiomeType.FOREST) || true; // lumber camps usually in/near forest; default true for rich backdrop
  const hasMountains = adjacentBiomes?.includes(BiomeType.MOUNTAINS);
  const nearTundra = adjacentBiomes?.includes(BiomeType.TUNDRA);
  const likelySnow = season==='winter' || nearTundra || climate===ClimateType.COLD;

  // ------------------------ defs: gradients & patterns ---------------------
  const defs = (
    <defs>
      {/* Sky gradient */}
      <linearGradient id={`sky-${seed}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={T.skyTop} />
        <stop offset="55%" stopColor={T.skyMid} />
        <stop offset="100%" stopColor={T.skyBot} />
      </linearGradient>

      {/* Vignette mask */}
      <radialGradient id={`vig-${seed}`} cx="50%" cy="50%" r="65%">
        <stop offset="70%" stopColor="#0000"/>
        <stop offset="100%" stopColor="#0008"/>
      </radialGradient>

      {/* Soft glow for sun/moon/lanterns */}
      <filter id={`glow-${seed}`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>

      {/* Dither patterns for subtle pixel shading */}
      <pattern id={`ditherDark-${seed}`} patternUnits="userSpaceOnUse" width={2} height={2}>
        <rect width={2} height={2} fill="#0000" />
        <rect x={0} y={0} width={1} height={1} fill="#000000" opacity={0.15} />
      </pattern>
      <pattern id={`ditherLight-${seed}`} patternUnits="userSpaceOnUse" width={2} height={2}>
        <rect width={2} height={2} fill="#0000" />
        <rect x={1} y={1} width={1} height={1} fill="#ffffff" opacity={0.18} />
      </pattern>
    </defs>
  );

  // ------------------------ sky & atmosphere -------------------------------
  const renderSky = () => (
    <g>
      <PR x={0} y={0} w={LOGICAL_W} h={HORIZON_Y} fill={`url(#sky-${seed})`} />
      {/* Sun/Moon + glow */}
      {timeOfDay==='Night' ? (
        <g filter={`url(#glow-${seed})`}>
          <circle cx={LOGICAL_W-23} cy={11} r={5} fill={T.sun} opacity={0.9}/>
        </g>
      ) : (
        <g filter={`url(#glow-${seed})`}>
          <PR x={LOGICAL_W-30} y={10} w={9} h={9} fill={T.sun}/>
        </g>
      )}

      {/* Stars */}
      {timeOfDay==='Night' && (
        <g>
          {starsRef.current.map((star, i) => (
            <PR key={i} x={star.x} y={star.y} w={1} h={1} fill={star.bright ? '#ffffff' : T.star} opacity={i%7===0?0.95:0.65}/>
          ))}
        </g>
      )}

      {/* God rays at Dawn/Dusk */}
      {(timeOfDay==='Dawn' || timeOfDay==='Dusk') && (
        <g opacity={0.12}>
          {Array.from({length:6}).map((_,i)=> (
            <polygon key={i} points={`${LOGICAL_W-40},10 ${LOGICAL_W-20},14 ${LOGICAL_W-40},${HORIZON_Y}`} fill={shade(T.sun, 10)} />
          ))}
        </g>
      )}

      {/* Clouds */}
      {timeOfDay!=='Night' && (
        <g opacity={0.9}>
          {[0,1,2,3].map(i => {
            const cx = ((i*160 + tick*0.6) % (LOGICAL_W+100)) - 50; const y = 14 + i*8;
            return (
              <g key={i}>
                <PR x={cx} y={y} w={24} h={6} fill="#ffffff" />
                <PR x={cx+8} y={y-2} w={18} h={5} fill="#ffffff" />
                <PR x={cx+16} y={y+1} w={12} h={4} fill="#ffffff" />
              </g>
            );
          })}
        </g>
      )}
    </g>
  );

  // ------------------------ parallax background ---------------------------
  const renderBackdrops = () => (
    <g>
      {/* Distant mountain bands */}
      {hasMountains && (
        <g>
          {Array.from({length:5}).map((_,i)=>{
            const offset = (tick * 0.08) % 80;
            const baseX = i*105 + offset;
            const h = 18 + (i%2?8:0);
            return (
              <polygon key={i} points={`${baseX-50},${HORIZON_Y-6} ${baseX},${HORIZON_Y-6-h} ${baseX+50},${HORIZON_Y-6}`} fill={shade(C.rock, i%2?-10:-25)} opacity={0.45} />
            );
          })}
        </g>
      )}

      {/* Forest silhouette band - pine trees closer to ground */}
      {hasForest && (
        <g opacity={0.88}>
          {Array.from({length:25}).map((_,i)=>{
            const x = i*21 + (i%3)*4;
            const th = 24 + (i%5)*4;
            const yBase = GROUND_Y - 5; // Trees closer to ground level
            return (
              <g key={i}>
                {/* Tree trunk */}
                <PR x={x} y={yBase-th} w={3} h={th} fill={shade(C.pine,-25)} />
                {/* Pine tree shape with pointed top */}
                <polygon points={`${x-1},${yBase-th} ${x+1.5},${yBase-th-6} ${x+4},${yBase-th}`} fill={C.pine} />
                <polygon points={`${x-3},${yBase-th+5} ${x+1.5},${yBase-th-2} ${x+6},${yBase-th+5}`} fill={shade(C.pine,5)} />
                <polygon points={`${x-4},${yBase-th+10} ${x+1.5},${yBase-th+2} ${x+7},${yBase-th+10}`} fill={C.pine} />
                <polygon points={`${x-5},${yBase-th+15} ${x+1.5},${yBase-th+6} ${x+8},${yBase-th+15}`} fill={shade(C.pine,-5)} />
              </g>
            );
          })}
        </g>
      )}

      {/* Haze / fog band along the forest edge */}
      <rect x={0} y={HORIZON_Y+2} width={LOGICAL_W} height={10} fill={`url(#ditherLight-${seed})`} opacity={0.5} />
    </g>
  );

  // ------------------------ ground & path ----------------------------------
  const renderGround = () => (
    <g>
      {/* Ground base - extended with gradient to edges */}
      <defs>
        <linearGradient id={`groundGrad-${seed}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={likelySnow ? C.snow : C.soil} />
          <stop offset="100%" stopColor={likelySnow ? shade(C.snow, -10) : shade(C.soil, -20)} />
        </linearGradient>
      </defs>
      <rect x={0} y={HORIZON_Y+12} width={LOGICAL_W} height={LOGICAL_H-(HORIZON_Y+12)} fill={`url(#groundGrad-${seed})`} />

      {/* Grass / undergrowth strips */}
      {!likelySnow && (
        <g opacity={0.5}>
          {Array.from({length:16}).map((_,i)=>(
            <PR key={i} x={i*32 + (i%2?6:0)} y={GROUND_Y-6} w={22} h={2} fill={C.grass} />
          ))}
        </g>
      )}

      {/* Central track */}
      <g opacity={likelySnow?0.22:0.6}>
        {Array.from({length:14}).map((_,i)=> (
          <PR key={i} x={24 + i*34} y={GROUND_Y+8 + (i%2?1:0)} w={24} h={3} fill={shade(C.soil,-22)} />
        ))}
      </g>

      {/* Random stumps & chips */}
      {Array.from({length:10}).map((_,i)=> (
        <g key={i}>
          <PR x={24 + i*46} y={GROUND_Y-4} w={4} h={4} fill="#7b4f2a" />
          <PR x={24 + i*46} y={GROUND_Y-1} w={4} h={1} fill={shade(C.soil,-30)} />
          <PR x={25 + i*46} y={GROUND_Y-5} w={2} h={1} fill="#4b2a14" />
          {/* sawdust flecks */}
          <PR x={22 + i*46} y={GROUND_Y} w={1} h={1} fill="#caa56a" opacity={0.7} />
          <PR x={30 + i*46} y={GROUND_Y+1} w={1} h={1} fill="#caa56a" opacity={0.6} />
        </g>
      ))}

      {/* Leaf fall (autumn) */}
      {season==='autumn' && !likelySnow && (
        <g opacity={0.7}>
          {Array.from({length:24}).map((_,i)=> (
            <PR key={i} x={rng.int(4, LOGICAL_W-4)} y={GROUND_Y + rng.int(2, 20)} w={1} h={1} fill={i%2? shade(C.leaf,-10):C.leaf} />
          ))}
        </g>
      )}
    </g>
  );

  // ------------------------ structures (per variant) -----------------------
  const renderCampCore = () => {
    const cx = Math.floor(LOGICAL_W/2);

    // Helpers for repeated log pile
    const LogPile = ({x, y, rows=3}:{x:number;y:number;rows?:number}) => (
      <g>
        {Array.from({length:rows}).map((_,r)=> (
          <g key={r}>
            {Array.from({length:6}).map((__,i)=> (
              <PR key={i} x={x + i*6 + (r%2?3:0)} y={y - r*3 - (i%3===0?1:0)} w={5} h={2} fill="#6a3e1c" />
            ))}
          </g>
        ))}
      </g>
    );

    switch (variant) {
      case 'medieval_european':
        return (
          <g>
            {/* Timber shed with thatch */}
            <PR x={cx-34} y={GROUND_Y-26} w={68} h={26} fill="#7b4f2a" />
            <polygon points={`${cx-38},${GROUND_Y-26} ${cx},${GROUND_Y-40} ${cx+38},${GROUND_Y-26}`} fill="#d6b46a" stroke="#a88c4f" strokeWidth={1} />
            {/* Dark doorway & window */}
            <PR x={cx-6} y={GROUND_Y-12} w={12} h={12} fill="#2c1b12" />
            <PR x={cx+16} y={GROUND_Y-20} w={8} h={6} fill="#1a1a1a" />
            {/* Saw pit with two‑man saw */}
            <PR x={cx-64} y={GROUND_Y-2} w={36} h={3} fill={shade(C.soil,-35)} />
            <PR x={cx-58} y={GROUND_Y-6} w={24} h={2} fill="#caa56a" />
            {/* Log pile */}
            <LogPile x={cx+42} y={GROUND_Y-6} rows={3} />
          </g>
        );
      case 'industrial_american':
        return (
          <g>
            {/* Sawmill */}
            <PR x={cx-48} y={GROUND_Y-22} w={96} h={22} fill="#8b7356" />
            {/* Roof cap */}
            <PR x={cx-48} y={GROUND_Y-24} w={96} h={2} fill="#6e5f4a" />
            {/* Chimney */}
            <PR x={cx+28} y={GROUND_Y-32} w={4} h={10} fill="#444a51" />
            {/* Smoke drift */}
            {[0,1,2].map(i => (
              <PR key={i} x={cx+28+i} y={GROUND_Y-34 - ((smokePhase.current + i*5)%14)} w={2} h={2} fill={`#${['aa','bb','cc'][i]}${['aa','bb','cc'][i]}${['aa','bb','cc'][i]}`} opacity={0.6 - i*0.15} />
            ))}
            {/* Saw blade hint */}
            <PR x={cx-3} y={GROUND_Y-9} w={6} h={6} fill="#c7cdd2" />
            <PR x={cx-3 + ((tick%4)<2?0:1)} y={GROUND_Y-10} w={2} h={2} fill="#8a929b" />
            {/* Log deck */}
            <LogPile x={cx+58} y={GROUND_Y-5} rows={2} />
          </g>
        );
      case 'east_asian':
        return (
          <g>
            {/* Warehouse with curved eaves */}
            <PR x={cx-36} y={GROUND_Y-20} w={72} h={20} fill="#7b4f2a" />
            <path d={`M ${cx-42} ${GROUND_Y-20} Q ${cx} ${GROUND_Y-30} ${cx+42} ${GROUND_Y-20}`} fill="#b43a3a" />
            {/* Hanging lanterns at night */}
            {timeOfDay!=='Day' && (
              <g filter={`url(#glow-${seed})`}>
                <PR x={cx-14} y={GROUND_Y-21} w={4} h={4} fill="#ff6b4b" />
                <PR x={cx+10} y={GROUND_Y-21} w={4} h={4} fill="#ff6b4b" />
              </g>
            )}
            <LogPile x={cx+44} y={GROUND_Y-6} rows={2} />
          </g>
        );
      case 'nordic':
        return (
          <g>
            {/* Longhouse */}
            <PR x={cx-44} y={GROUND_Y-20} w={88} h={20} fill="#6f4426" />
            <polygon points={`${cx-48},${GROUND_Y-20} ${cx},${GROUND_Y-30} ${cx+48},${GROUND_Y-20}`} fill="#5a371c" />
            {likelySnow && <PR x={cx-49} y={GROUND_Y-31} w={98} h={2} fill={C.snow} opacity={0.9} />}
            {/* Log slides */}
            <PR x={cx-74} y={GROUND_Y-2} w={28} h={1} fill="#7b4f2a" />
            <PR x={cx+50} y={GROUND_Y-3} w={28} h={1} fill="#7b4f2a" />
            <LogPile x={cx+64} y={GROUND_Y-6} rows={2} />
          </g>
        );
      case 'siberian':
        return (
          <g>
            <PR x={cx-30} y={GROUND_Y-16} w={60} h={16} fill="#8b7356" />
            <polygon points={`${cx-34},${GROUND_Y-16} ${cx},${GROUND_Y-24} ${cx+34},${GROUND_Y-16}`} fill="#5a4b3b" />
            {likelySnow && <PR x={cx-34} y={GROUND_Y-25} w={68} h={3} fill={C.snow} opacity={0.95} />}
            {/* small campfire */}
            {timeOfDay!=='Day' && (
              <g filter={`url(#glow-${seed})`}>
                <PR x={cx-58} y={GROUND_Y-4} w={3} h={2} fill="#ffb74d" />
                <PR x={cx-58} y={GROUND_Y-5 - ((firePhase.current%3)===0?1:0)} w={2} h={2} fill="#ff6b2b" />
              </g>
            )}
            <LogPile x={cx+46} y={GROUND_Y-6} rows={2} />
          </g>
        );
      case 'tropical':
        return (
          <g>
            <PR x={cx-34} y={GROUND_Y-16} w={68} h={16} fill="#9b7a58" />
            <polygon points={`${cx-38},${GROUND_Y-16} ${cx},${GROUND_Y-24} ${cx+38},${GROUND_Y-16}`} fill="#2a7b3a" />
            {/* palms */}
            <PR x={cx-82} y={GROUND_Y-16} w={2} h={14} fill="#6b3f1c" />
            <PR x={cx-86} y={GROUND_Y-18} w={10} h={3} fill="#2a8b3e" />
            <PR x={cx+78} y={GROUND_Y-16} w={2} h={14} fill="#6b3f1c" />
            <PR x={cx+72} y={GROUND_Y-18} w={10} h={3} fill="#2a8b3e" />
            <LogPile x={cx+46} y={GROUND_Y-6} rows={2} />
          </g>
        );
      case 'modern':
        return (
          <g>
            <PR x={cx-54} y={GROUND_Y-18} w={108} h={18} fill="#b7bcc4" />
            <PR x={cx-54} y={GROUND_Y-20} w={108} h={2} fill="#8a909b" />
            {/* dock apron */}
            <PR x={cx+50} y={GROUND_Y-5} w={20} h={4} fill="#8a909b" />
            <LogPile x={cx+68} y={GROUND_Y-8} rows={2} />
          </g>
        );
    }
  };

  // ------------------------ characters (refined sprites) -------------------
  const renderChar = (c: Character) => {
    const body = c.role==='overseer' ? '#4a4a4a' : '#7b4f2a';
    const head = '#f1c7a5';
    const hat = (()=>{
      switch(variant){
        case 'east_asian': return '#d4a534';
        case 'industrial_american': return c.role==='overseer'?'#3c3f46':'#2f2f2f';
        case 'nordic': return '#5a3b1f';
        case 'siberian': return '#3c3c3c';
        case 'modern': return '#ffd21f';
        default: return '#5a3b1f';
      }
    })();
    const bob = (tick % 20)<10 ? 0 : -1;
    const swingOn = c.role==='woodcutter' && !c.carry;
    const swing = swingOn && typeof c.swing==='number' ? Math.sin(c.swing) : 0;

    return (
      <g key={c.id} transform={`translate(${Math.round(c.x)}, ${Math.round(c.y + bob)})`}>
        {/* shadow */}
        <PR x={-2} y={1} w={5} h={1} fill="#000000" opacity={0.22} />
        {/* legs */}
        <PR x={-2} y={-1} w={1} h={2} fill="#3b3b3b" />
        <PR x={1}  y={-1} w={1} h={2} fill="#3b3b3b" />
        {/* torso */}
        <PR x={-2} y={-6} w={5} h={5} fill={body} />
        {/* head */}
        <PR x={-1} y={-8} w={3} h={2} fill={head} />
        {/* hat */}
        <PR x={-1} y={-9} w={3} h={1} fill={hat} />
        {/* carried log */}
        {c.carry && <PR x={-4} y={-6} w={8} h={1} fill="#6a3e1c" />}
        {/* axe hint */}
        {swingOn && <PR x={2 + (swing>0?1:0)} y={-7 + (swing>0?-1:0)} w={2} h={1} fill="#b8c1c9" />}
        {/* two‑man saw */}
        {c.role==='sawyer' && (
          <g>
            <PR x={-6} y={-3} w={12} h={1} fill="#b8c1c9" />
            <PR x={-6} y={-4 + ((tick%8)<4?0:1)} w={1} h={2} fill="#3b3b3b" />
            <PR x={5}  y={-4 + ((tick%8)<4?0:1)} w={1} h={2} fill="#3b3b3b" />
          </g>
        )}
      </g>
    );
  };

  // ------------------------ vehicles --------------------------------------
  const renderVeh = (v: Vehicle) => {
    const x = Math.round(v.x); const y = Math.round(v.y);
    const wheel = (wx:number, wy=0) => <PR key={`w-${wx}-${wy}`} x={wx} y={wy} w={2} h={2} fill="#2c2c2c" />;
    if (v.kind==='ox_cart'){
      return (
        <g key={v.id} transform={`translate(${x}, ${y})`}>
          <PR x={-10} y={-6} w={6} h={3} fill="#7b4f2a" />
          <PR x={-12} y={-7} w={2} h={1} fill="#d7d7d7" />
          <PR x={-2}  y={-5} w={16} h={4} fill="#6a3e1c" />
          {wheel(1,0)}{wheel(9,0)}
          <PR x={0} y={-7} w={14} h={2} fill="#7b4f2a" />
        </g>
      );
    }
    if (v.kind==='horse_wagon'){
      return (
        <g key={v.id} transform={`translate(${x}, ${y})`}>
          <PR x={-14} y={-7} w={4} h={4} fill="#6a4326" />
          <PR x={-9}  y={-7} w={4} h={4} fill="#6a4326" />
          <PR x={-2}  y={-6} w={18} h={6} fill="#8b7356" />
          {wheel(2)}{wheel(12)}
          <PR x={-1} y={-8} w={15} h={2} fill="#6a3e1c" />
        </g>
      );
    }
    if (v.kind==='sled'){
      return (
        <g key={v.id} transform={`translate(${x}, ${y})`}>
          <PR x={-12} y={-3} w={3} h={2} fill="#808080" />
          <PR x={-8}  y={-3} w={3} h={2} fill="#808080" />
          <PR x={-4}  y={-3} w={3} h={2} fill="#808080" />
          <PR x={0} y={-2} w={14} h={1} fill="#6a3e1c" />
          <PR x={0} y={-4} w={12} h={2} fill="#7b4f2a" />
        </g>
      );
    }
    if (v.kind==='buffalo_cart'){
      return (
        <g key={v.id} transform={`translate(${x}, ${y})`}>
          <PR x={-12} y={-7} w={7} h={4} fill="#4b4f58" />
          <PR x={-13} y={-8} w={2} h={1} fill="#d7d7d7" />
          <PR x={-2}  y={-6} w={16} h={5} fill="#6a3e1c" />
          {wheel(1)}{wheel(11)}
        </g>
      );
    }
    if (v.kind==='donkey'){
      return (
        <g key={v.id} transform={`translate(${x}, ${y})`}>
          <PR x={-8} y={-5} w={3} h={2} fill="#9a846c" />
          <PR x={-9} y={-6} w={1} h={1} fill="#9a846c" />
          <PR x={-4} y={-6} w={3} h={2} fill="#d4af37" />
          <PR x={-1} y={-6} w={3} h={2} fill="#d4af37" />
        </g>
      );
    }
    if (v.kind==='truck'){
      return (
        <g key={v.id} transform={`translate(${x}, ${y})`}>
          <PR x={-6} y={-10} w={8} h={6} fill="#e44141" />
          <PR x={-4} y={-9}  w={4} h={2} fill="#8bd0ff" />
          <PR x={3}  y={-9}  w={16} h={6} fill="#8a909b" />
          <PR x={4}  y={-11} w={14} h={2} fill="#6a3e1c" />
          {wheel(0)}{wheel(8)}{wheel(15)}
        </g>
      );
    }
    if (v.kind==='steam_donkey'){
      return (
        <g key={v.id} transform={`translate(${x}, ${y})`}>
          <PR x={-8} y={-10} w={12} h={8} fill="#4b4f58" />
          <PR x={3}  y={-14} w={2} h={4} fill="#2f343b" />
          {[0,1,2].map(i => (
            <PR key={i} x={4 + (i%2?1:0)} y={-15 - Math.floor(((smokePhase.current/2)+i*4)%10)} w={2} h={2} fill={`#${['aa','bb','cc'][i]}${['aa','bb','cc'][i]}${['aa','bb','cc'][i]}`} opacity={0.6 - i*0.15} />
          ))}
          <PR x={6} y={-8} w={10} h={6} fill="#5a5f67" />
        </g>
      );
    }
    return null;
  };

  // ------------------------ weather & atmosphere ---------------------------
  const renderWeather = () => {
    if (likelySnow) {
      return (
        <g opacity={0.65}>
          {Array.from({length:50}).map((_,i)=> {
            // Softer, slower falling snow distributed across full width
            const baseX = (i / 50) * LOGICAL_W; // Distribute evenly across width
            const x = (baseX + Math.sin(tick * 0.01 + i * 0.5) * 4) % LOGICAL_W;
            const y = ((i * 3.7 + tick * 0.3) % LOGICAL_H);
            const size = 0.8 + (i % 3) * 0.3;
            return (
              <circle key={i} cx={x} cy={y} r={size} fill="#ffffff" opacity={0.9 - (i % 4) * 0.15} />
            );
          })}
        </g>
      );
    }
    const drizzle = (timeOfDay==='Dawn' || timeOfDay==='Dusk') && climate===ClimateType.TEMPERATE && season==='spring';
    if (drizzle) {
      return (
        <g opacity={0.35}>
          {Array.from({length:100}).map((_,i)=> (
            <PR key={i} x={(i*5 + (tick*1.2))%LOGICAL_W} y={(i*7 + (tick*1.6))%LOGICAL_H} w={1} h={2} fill="#cfe7ff" />
          ))}
        </g>
      );
    }
    return null;
  };

  // ------------------------ foreground details -----------------------------
  const renderForeground = () => (
    <g>
      {/* Saw chips and debris */}
      <g opacity={0.3}>
        {Array.from({length:64}).map((_,i)=> (
          <PR key={i} x={rng.int(0, LOGICAL_W)} y={GROUND_Y + rng.int(0, 16)} w={rng.int(1,2)} h={1} fill="#6a3e1c" />
        ))}
      </g>

      {/* Subtle vignette */}
      <rect x={0} y={0} width={LOGICAL_W} height={LOGICAL_H} fill={`url(#vig-${seed})`} />

      {/* Night tint overlay */}
      {timeOfDay!=='Day' && (
        <rect x={0} y={0} width={LOGICAL_W} height={LOGICAL_H} fill={timeOfDay==='Night'?'#0b1220':'#2e2631'} opacity={timeOfDay==='Night'?0.16:0.10} />
      )}
    </g>
  );

  // ------------------------ composition -----------------------------------
  return (
    <svg width={width} height={height} viewBox={`0 0 ${LOGICAL_W} ${LOGICAL_H}`} style={{ imageRendering: 'pixelated' }}>
      {defs}
      <g>
        {renderSky()}
        {renderBackdrops()}
        {renderGround()}
        {renderCampCore()}
        {/* Vehicles under people for depth */}
        {vehRef.current.map(renderVeh)}
        {/* Characters */}
        {charsRef.current.map(renderChar)}
        {renderWeather()}
        {renderForeground()}
      </g>
    </svg>
  );
};

export default LumberCampBanner;
