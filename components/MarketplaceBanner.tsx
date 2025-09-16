/**
 * components/MarketplaceBanner.tsx
 * V2: Composes TimeAwareBackground (+ optional WeatherEffects FX)
 * while preserving all marketplace game logic (stalls, walkers, masks, etc.).
 *
 * - Overcast, seasons, climates handled by TimeAwareBackground (no sky duplication)
 * - SVG pooled precipitation stays (masked under awnings/counters)
 * - Optional WeatherEffects for non-precip FX (precip disabled there to avoid duplication)
 * - Keeps rAF timing, reduced-motion, namescoped <defs>, and lerped weather transitions
 */

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import TimeAwareBackground from './TimeAwareBackground';
import WeatherEffects from './WeatherEffects';
import {
  HistoricalEra,
  CulturalZone,
  ClimateType as Climate,
  Season,
  MapData,
  TimeOfDay,
  Tile,
} from '../types';
import type { WeatherState } from '../services/weatherService';

/* ─────────────────────────────── Utilities ─────────────────────────────── */

class RNG {
  private s: number;
  constructor(seed = 1) { this.s = seed || 1; }
  next() { this.s = (this.s * 9301 + 49297) % 233280; return this.s / 233280; }
  range(min: number, max: number) { return min + this.next() * (max - min); }
  int(min: number, max: number) { return Math.floor(this.range(min, max + 1)); }
  pick<T>(arr: T[]) { return arr[Math.floor(this.next() * arr.length)]!; }
}

const ipx = (n: number) => Math.round(n);
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const hexToRgb = (hex: string) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 0, g: 0, b: 0 };
};
const rgbToHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map(v => { const h = clamp(Math.round(v), 0, 255).toString(16); return h.length === 1 ? '0' + h : h; }).join('');
const shade = (hex: string, pct: number) => {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    r + (pct > 0 ? (255 - r) * pct / 100 : r * pct / 100),
    g + (pct > 0 ? (255 - g) * pct / 100 : g * pct / 100),
    b + (pct > 0 ? (255 - b) * pct / 100 : b * pct / 100)
  );
};

/* ───────────────────────────── Normalization ───────────────────────────── */

type TOD = 'dawn' | 'day' | 'dusk' | 'night';
const toTOD = (t?: TimeOfDay | string): TOD => {
  const s = String(t ?? 'day').toLowerCase();
  if (s.startsWith('dawn')) return 'dawn';
  if (s.startsWith('dusk') || s.includes('even') || s.includes('twilight')) return 'dusk';
  if (s.startsWith('night')) return 'night';
  return 'day';
};

type EraKey = 'prehist'|'antiquity'|'medieval'|'early'|'industrial'|'modern'|'future';
const toEra = (e?: HistoricalEra | string): EraKey => {
  const s = String(e ?? '').toLowerCase();
  if (s.includes('prehist')) return 'prehist';
  if (s.includes('antiq') || s.includes('ancient')) return 'antiquity';
  if (s.includes('mediev')) return 'medieval';
  if (s.includes('rena') || s.includes('early')) return 'early';
  if (s.includes('indust')) return 'industrial';
  if (s.includes('modern')) return 'modern';
  if (s.includes('future')) return 'future';
  return 'medieval';
};

type ZoneKey =
  | 'EUROPEAN' | 'EAST_ASIAN' | 'MENA' | 'SOUTH_ASIAN' | 'SUB_SAHARAN_AFRICAN'
  | 'SOUTH_AMERICAN' | 'NORTH_AMERICAN_PRE_COLUMBIAN' | 'NORTH_AMERICAN_COLONIAL'
  | 'OCEANIA';
const toZone = (z?: CulturalZone | string): ZoneKey => {
  const s = String(z ?? '').toUpperCase() as ZoneKey;
  const all: ZoneKey[] = [
    'EUROPEAN','EAST_ASIAN','MENA','SOUTH_ASIAN','SUB_SAHARAN_AFRICAN',
    'SOUTH_AMERICAN','NORTH_AMERICAN_PRE_COLUMBIAN','NORTH_AMERICAN_COLONIAL','OCEANIA'
  ];
  return all.includes(s) ? s : 'EUROPEAN';
};

const LEFT_RIM = (tod: TOD) => (tod === 'dusk' || tod === 'night') ? 'right' : 'left';

/* ─────────────────────────── TimeAwareBackground adapters ─────────────────────────── */

function toSeasonString(season?: Season | string | null): 'spring' | 'summer' | 'fall' | 'winter' | null {
  if (!season) return null;
  const s = String(season).toLowerCase();
  if (s.startsWith('spr')) return 'spring';
  if (s.startsWith('sum')) return 'summer';
  if (s.startsWith('aut') || s.startsWith('fal')) return 'fall';
  if (s.startsWith('win')) return 'winter';
  return null;
}
function toClimateString(climate?: Climate | string | null):
  'temperate' | 'tropical' | 'arid' | 'arctic' | 'mediterranean' | 'continental' | null {
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

/* ───────────────────────────── Climate Palettes ───────────────────────────── */

const CLIMATE: Record<Climate, { ground: string; paving: string; veg: string; accent: string; dust?: string }> = {
  [Climate.COLD]:        { ground:'#BFE6D7', paving:'#A9D4C7', veg:'#497C74', accent:'#78A3AD' },
  [Climate.TEMPERATE]:   { ground:'#A7E7B1', paving:'#8FD197', veg:'#1E9E57', accent:'#5BBF7F' },
  [Climate.MEDITERRANEAN]: { ground:'#C9E1AE', paving:'#B5CF9C', veg:'#2F8A56', accent:'#87AA63' },
  [Climate.ARID]:        { ground:'#D7C2A0', paving:'#C5AF8E', veg:'#7A6B44', accent:'#C89145', dust:'#C19A6B' },
  [Climate.SEMITROPICAL]:{ ground:'#9DE7C2', paving:'#87D5AE', veg:'#239B79', accent:'#1F8473' },
  [Climate.TROPICAL]:    { ground:'#86E3C5', paving:'#6ECFB1', veg:'#066D57', accent:'#0C8F70' },
};

const CULTURE_SWATCHES: Record<ZoneKey,string[]> = {
  EUROPEAN: ['#7C3F2A','#8A5C3D','#3F5EA6','#BFA463','#658A47','#6A4C3E'],
  EAST_ASIAN: ['#9C1A1C','#C32E2E','#D7A332','#2A5C87','#6E3B26','#2C7A5A'],
  MENA: ['#2B5D75','#C4A76A','#7A4D2F','#3C6B6B','#9C6C38','#8A5A3C'],
  SOUTH_ASIAN: ['#BB3E24','#E1B243','#2D6B8C','#7A2E6A','#2D8A59','#8A5A2A'],
  SUB_SAHARAN_AFRICAN: ['#7B4F2A','#D6B14A','#3A6B42','#6E3A2F','#2A5D7A','#8B5A2A'],
  SOUTH_AMERICAN: ['#8B3E2A','#2F7A6E','#D6B14A','#6E3A2F','#2A5D7A','#3A8A52'],
  NORTH_AMERICAN_PRE_COLUMBIAN: ['#6B3E1E','#A36E3A','#C0A060','#346B5B','#7A5A3A','#9B2F2F'],
  NORTH_AMERICAN_COLONIAL: ['#7D4A2A','#9B2F2F','#325B8E','#C0A060','#3A6B42','#6E4B3A'],
  OCEANIA: ['#7A5A2A','#2F7A6E','#C9B35A','#6E3A2F','#4F7A3B','#2A5D7A'],
};

/* ───────────────────────── Weather mapping & synthesis ───────────────────────── */

type WeatherKind = 'clear' | 'rain' | 'snow' | 'sleet' | 'drizzle' | 'dust';

interface LocalWeather {
  kind: WeatherKind;
  wind: number;              // small scalar for banners
  wetness: number;           // 0..1
  precipitation: number;     // density (0..1)
  temp: number;
  cloudCover: number;        // 0..1
  visibility: number;        // 0..1
  special: WeatherState['special'];
  overcast: number;          // alias for cloudCover
  haze: number;              // 0..1
}

const fromWeatherState = (w: WeatherState): LocalWeather => {
  const kind: WeatherKind = (w.precipitation as WeatherKind) || 'clear';
  const wetness =
    (w.precipitation === 'rain' || w.precipitation === 'drizzle') ? Math.min(1, 0.6 + (w.intensity ?? 0) * 0.6) :
    (w.precipitation === 'sleet' ? 0.35 :
    (w.precipitation === 'snow' ? 0.2 : (w.fx?.surfaceWetnessNow ?? 0)));
  return {
    kind,
    wind: 0.25 + (w.windSpeed / 90),
    wetness,
    precipitation: w.intensity || 0,
    temp: w.temperature,
    cloudCover: w.cloudCover,
    visibility: w.visibility,
    special: w.special,
    overcast: w.cloudCover,
    haze: clamp((w.fx?.hazeDensity ?? 0) * 0.85),
  };
};

// Fallback if no WeatherState is supplied
const synthWeather = (
  season: Season | string,
  climate: Climate | string,
  tod: TOD,
  rng: RNG
): LocalWeather => {
  const s = String(season).toLowerCase();
  const c = String(climate).toLowerCase();
  let rain = 0.25, snow = 0.05, dust = 0.02;
  if (c.includes('arid')) { rain = 0.08; dust = 0.14; }
  if (c.includes('cold')) { snow = 0.18; rain = 0.16; }
  if (c.includes('trop')) { rain = 0.35; }
  if (s.includes('winter')) { snow += 0.25; rain *= 0.6; }
  if (s.includes('summer')) { dust += c.includes('arid') ? 0.12 : 0.03; }
  const r = rng.next();
  let kind: WeatherKind = 'clear';
  if (r < snow) kind = 'snow';
  else if (r < snow + rain) kind = 'rain';
  else if (r < snow + rain + dust) kind = 'dust';
  const wetness = kind === 'rain' ? 0.9 : kind === 'snow' ? 0.2 : 0.0;
  const wind = kind === 'dust' ? rng.range(0.8, 1.5) : rng.range(0.25, 0.8);
  const prec = (kind === 'rain' || kind === 'snow') ? rng.range(0.25, 0.8)
              : (kind === 'drizzle' ? rng.range(0.1, 0.25)
              : (kind === 'dust' ? rng.range(0.15, 0.4) : 0));
  const temp = s.includes('winter') ? rng.range(-10, 5) : s.includes('summer') ? rng.range(20, 35) : rng.range(5, 20);
  const cloudCover = kind === 'clear' ? rng.range(0.05, 0.4) : rng.range(0.6, 1.0);
  const haze = c.includes('trop') ? clamp(rng.range(0.1, 0.35) + cloudCover * 0.15) : rng.range(0.02, 0.2);
  return { kind, wind, wetness, precipitation: prec, temp, cloudCover, visibility: 1 - cloudCover * 0.25, special: null, overcast: cloudCover, haze };
};

/* ───────────────────────────── Goods & Icons (unchanged) ───────────────────────── */

type IconKey = 'bread'|'cheese'|'fish'|'pottery'|'textiles'|'spices'|'tools'|'produce'|'beads'|'hide'|'corn'|'cocoa';
type GoodSpec = { id:string; icon:IconKey; color:string; hi:string; lo:string; variant?:number; count:number };

const ICONS: Record<IconKey,(p:{c:string;hi:string;lo:string;v?:number})=>JSX.Element> = {
  bread: ({c,hi,lo}) => (<g><rect x={0} y={6} width={12} height={5} fill={c}/><rect x={1} y={5} width={10} height={2} fill={hi}/><rect x={0} y={11} width={12} height={1} fill={lo}/></g>),
  cheese: ({c,hi,lo}) => (<g><rect x={0} y={4} width={11} height={7} fill={c}/><rect x={0} y={4} width={11} height={1} fill={hi}/><rect x={0} y={10} width={11} height={1} fill={lo}/><rect x={3} y={7} width={1} height={1} fill={lo}/><rect x={7} y={8} width={1} height={1} fill={lo}/></g>),
  fish: ({c,hi,lo,v}) => { const dir = v===1?1:-1; return (<g><rect x={dir===1?1:0} y={7} width={9} height={3} fill={c}/><rect x={dir===1?8:0} y={8} width={2} height={1} fill={lo}/><rect x={dir===1?2:6} y={7} width={2} height={1} fill={hi}/><rect x={dir===1?3:6} y={9} width={1} height={1} fill="#0E0E0E"/></g>); },
  pottery: ({c,hi,lo}) => (<g><rect x={1} y={4} width={10} height={7} fill={c}/><rect x={2} y={3} width={8} height={2} fill={c}/><rect x={2} y={3} width={8} height={1} fill={hi}/><rect x={1} y={11} width={10} height={1} fill={lo}/></g>),
  textiles: ({c,hi,lo}) => (<g><rect x={0} y={3} width={4} height={9} fill={c}/><rect x={4} y={3} width={4} height={9} fill={hi}/><rect x={8} y={3} width={4} height={9} fill={lo}/></g>),
  spices: ({c,hi,lo}) => (<g><rect x={0} y={8} width={12} height={2} fill={c}/><rect x={0} y={6} width={12} height={2} fill={hi}/><rect x={0} y={10} width={12} height={1} fill={lo}/><rect x={2} y={5} width={1} height={1} fill={lo}/><rect x={6} y={5} width={1} height={1} fill={lo}/><rect x={9} y={5} width={1} height={1} fill={lo}/></g>),
  tools: ({c,hi,lo}) => (<g><rect x={0} y={7} width={8} height={1} fill={lo}/><rect x={2} y={4} width={1} height={5} fill={c}/><rect x={6} y={5} width={4} height={2} fill={c}/><rect x={6} y={5} width={4} height={1} fill={hi}/></g>),
  produce: ({c,hi,lo}) => (<g><rect x={0} y={7} width={12} height={3} fill={c}/><rect x={0} y={6} width={12} height={1} fill={hi}/><rect x={0} y={10} width={12} height={1} fill={lo}/><rect x={3} y={5} width={1} height={1} fill="#2A7B2A"/><rect x={7} y={5} width={1} height="#2A7B2A" height={1}/></g>),
  beads: ({c,hi}) => (<g>{[0,1,2,3].map(i => <rect key={i} x={1+i*3} y={7} width={2} height={2} fill={i%2?hi:c} />)}<rect x={0} y={9} width={12} height={1} fill="#3B2B1A"/></g>),
  hide: ({c,hi,lo}) => (<g><rect x={0} y={5} width={12} height={7} fill={c}/><rect x={0} y={5} width={12} height={1} fill={hi}/><rect x={0} y={12} width={12} height={1} fill={lo}/><rect x={2} y={7} width={2} height={1} fill={lo}/><rect x={8} y={8} width={2} height={1} fill={lo}/></g>),
  corn: ({c,hi,lo}) => (<g><rect x={1} y={4} width={10} height={6} fill={c}/><rect x={1} y={4} width={10} height={1} fill={hi}/><rect x={1} y={10} width={10} height={1} fill={lo}/><rect x={2} y={5} width={1} height={4} fill="#3B7A3B"/><rect x={8} y={5} width={1} height={4} fill="#3B7A3B"/></g>),
  cocoa: ({c,hi,lo}) => (<g><rect x={0} y={7} width={12} height={3} fill={c}/><rect x={1} y={6} width={10} height={1} fill={hi}/><rect x={0} y={10} width={12} height={1} fill={lo}/></g>),
};

/* ───────────────────────────── Component Props ───────────────────────────── */

export type Condition = 'humble'|'prosperous';

interface MarketplaceBannerProps {
  era: HistoricalEra | string;
  culturalZone: CulturalZone | string;
  condition?: Condition;
  climate: Climate | string;
  season: Season | string;
  timeOfDay?: TimeOfDay | string;
  seed?: number;
  mapData?: MapData;
  tile?: Tile;
  width?: number;
  height?: number;
  /** Optional live weather from the central WeatherService */
  weather?: WeatherState | null;
  /** Set false to skip WeatherEffects entirely (keeps pooled precip) */
  enableFxLayer?: boolean;
}

/* ───────────────────────────────── Component ────────────────────────────── */

const MarketplaceBanner: React.FC<MarketplaceBannerProps> = ({
  era, culturalZone, climate, season,
  condition = 'humble',
  timeOfDay = 'Day',
  seed = 12345,
  mapData,
  tile,
  width = 1200,
  height = 180,
  weather,
  enableFxLayer = false,
}) => {
  const uid = useId(); // namescope <defs>
  const [frame, setFrame] = useState(0);

  // reduced-motion
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

  // rAF ticker (paused when hidden)
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (document.hidden) { last = now; }
      else {
        const step = reduced ? 0.5 : 1;
        if (now - last > (reduced ? 80 : 16)) {
          setFrame((f) => f + step);
          last = now;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const rng = useMemo(() => new RNG(seed), [seed]);
  const tod = useMemo(() => toTOD(timeOfDay), [timeOfDay]);
  const eraK = useMemo(() => toEra(era), [era]);
  const zoneK = useMemo(() => toZone(culturalZone), [culturalZone]);
  const climateKey = useMemo<Climate>(() => {
    const k = String(climate).toUpperCase() as Climate;
    return (CLIMATE as any)[k] ? (k as Climate) : Climate.TEMPERATE;
  }, [climate]);
  const palette = CLIMATE[climateKey];
  const rimSide = LEFT_RIM(tod);

  const horizonY = ipx(height * 0.60);
  const stallsY = ipx(horizonY + 10);
  const walkBackY = ipx(horizonY + 6);
  const walkFrontY = ipx(stallsY + 78);
  const groundBand = ipx(Math.max(12, height * 0.1));

  // Weather (live or synth) + smooth lerp
  const targetW = useMemo<LocalWeather>(() => {
    if (weather) return fromWeatherState(weather);
    return synthWeather(season as Season, climate as Climate, tod, new RNG(seed + 999));
  }, [weather, season, climate, tod, seed]);

  const lerpedWRef = useRef<LocalWeather>(targetW);
  const lastUpdateRef = useRef<number>(performance.now());
  useEffect(() => {
    const id = requestAnimationFrame(function animate() {
      const now = performance.now();
      const dt = Math.min(1, (now - (lastUpdateRef.current || now)) / 250);
      lastUpdateRef.current = now;
      const cur = lerpedWRef.current;
      const tgt = targetW;
      const t = reduced ? 0.15 : 0.35;

      const lerped: LocalWeather = {
        kind: tgt.kind,
        wind: lerp(cur.wind, tgt.wind, t * dt * 4),
        wetness: lerp(cur.wetness, tgt.wetness, t * dt * 4),
        precipitation: lerp(cur.precipitation, tgt.precipitation, t * dt * 4),
        temp: lerp(cur.temp, tgt.temp, t * dt * 2),
        cloudCover: lerp(cur.cloudCover, tgt.cloudCover, t * dt * 2),
        visibility: lerp(cur.visibility, tgt.visibility, t * dt * 2),
        special: tgt.special,
        overcast: lerp(cur.overcast, tgt.overcast, t * dt * 2),
        haze: lerp(cur.haze, tgt.haze, t * dt * 2),
      };
      lerpedWRef.current = lerped;
      requestAnimationFrame(animate);
    });
    return () => cancelAnimationFrame(id);
  }, [targetW, reduced]);

  /* ─────────────────────────── City silhouettes (unchanged) ───────────────────────── */

  const silhouettes = useMemo(() => {
    const r = new RNG(seed + 2001);
    const arr: {x:number;w:number;h:number;color:string;type:'block'|'gable'|'dome'|'step'}[] = [];
    const count = 8;
    for (let i=0;i<count;i++){
      arr.push({
        x: ipx(r.range(30, width - 70)),
        w: ipx(r.range(20, 42)),
        h: ipx(r.range(16, 34)),
        color: shade(palette.ground, -28 - i*2),
        type: r.pick(['block','gable','block','dome','step']),
      });
    }
    return arr.sort((a,b)=>a.x-b.x);
  }, [width, palette.ground, seed]);

  /* ───────────────────────────── Stalls & Goods Models ──────────────────────────── */

  type StallModel = {
    id:number;x:number;y:number;w:number;h:number;
    wood:{post:string;brace:string;counter:string;inner:string};
    awning:{base:string;hi:string;lo:string;pattern:'striped'|'checker'|'plain';fringe:boolean;cords:boolean;phase:number};
    vendorHue:string; vendorScale:number;
    goods:GoodSpec[];
    decor:{rugFront?:boolean;pennant?:boolean;beadCurtain?:boolean;lantern?:boolean;banner?:boolean};
  };

  const stallsRef = useRef<StallModel[] | null>(null);
  const rebuildKey = `${seed}|${width}|${zoneK}|${eraK}|${condition}|${climateKey}`;
  useEffect(() => {
    const r = new RNG(seed + 4000);
    const count = condition==='prosperous' ? 6 : 5;
    const leftPad = 70, rightPad = 70;
    const usable = width - leftPad - rightPad;
    const w = ipx(Math.min(125, 80 + usable / (count + 2)));
    const gap = ipx((usable - count * w) / (count - 1 <= 0 ? 1 : (count - 1)));

    const swatch = CULTURE_SWATCHES[zoneK];
    const woodBase = climateKey === Climate.ARID ? '#7F5A30' : '#6C4B2A';

    const tint = (c: string) =>
      climateKey === Climate.ARID ? shade(c, -6) :
      climateKey === Climate.TROPICAL ? shade(c, 6) :
      c;

    const awningBase = (() => {
      switch(zoneK){
        case 'EAST_ASIAN': return { base:tint('#B72A2A'), hi:'#E7B64D', lo:'#6B1111', pattern:'striped' as const, fringe:true, cords:true };
        case 'MENA': return { base:tint('#2A5F79'), hi:'#D4B46A', lo:'#1A3E4E', pattern:'checker' as const, fringe:true, cords:false };
        case 'SUB_SAHARAN_AFRICAN': return { base:tint('#7A5328'), hi:'#D6B14A', lo:'#4C331C', pattern:'checker' as const, fringe:false, cords:true };
        case 'SOUTH_ASIAN': return { base:tint('#C0542E'), hi:'#E9C35C', lo:'#6E2E16', pattern:'striped' as const, fringe:true, cords:true };
        case 'SOUTH_AMERICAN': return { base:tint('#8B3E2A'), hi:'#E0A35A', lo:'#4B2518', pattern:'striped' as const, fringe:false, cords:true };
        case 'NORTH_AMERICAN_PRE_COLUMBIAN': return { base:tint('#7B3F2A'), hi:'#E0A35A', lo:'#4B2518', pattern:'checker' as const, fringe:false, cords:true };
        case 'NORTH_AMERICAN_COLONIAL': return { base:tint('#8B3A2A'), hi:'#F0C25C', lo:'#572016', pattern:'striped' as const, fringe:true, cords:true };
        case 'OCEANIA': return { base:tint('#7B5A2A'), hi:'#E2C16B', lo:'#4B3316', pattern:'striped' as const, fringe:true, cords:true };
        default: return { base:tint('#8B3A2A'), hi:'#F0C25C', lo:'#572016', pattern:'striped' as const, fringe:true, cords:true };
      }
    })();

    const models: StallModel[] = [];
    const baseGoods = ((): IconKey[] => {
      if (zoneK === 'EAST_ASIAN') return ['fish','textiles','pottery','spices','tools','produce'];
      if (zoneK === 'MENA') return ['spices','textiles','pottery','tools','produce','bread'];
      if (zoneK === 'SUB_SAHARAN_AFRICAN') return ['produce','pottery','tools','textiles','fish','beads','hide'];
      if (zoneK === 'SOUTH_ASIAN') return ['spices','textiles','pottery','tools','produce','fish'];
      if (zoneK === 'SOUTH_AMERICAN') return ['produce','pottery','textiles','cocoa','tools','fish'];
      if (zoneK === 'OCEANIA') return ['fish','produce','textiles','pottery','tools'];
      if (zoneK === 'NORTH_AMERICAN_PRE_COLUMBIAN') return ['corn','pottery','hide','fish','beads','tools','produce'];
      if (zoneK === 'NORTH_AMERICAN_COLONIAL') return ['bread','cheese','textiles','tools','produce','fish'];
      if (eraK === 'early') return ['bread','cheese','spices','textiles','tools','fish','produce'];
      if (eraK === 'industrial') return ['bread','tools','textiles','produce','cheese','fish'];
      return ['bread','cheese','textiles','tools','produce','fish'];
    })();

    for (let i=0;i<count;i++){
      const x = ipx(leftPad + i * (w + gap));
      const goods: GoodSpec[] = [];
      const kinds = r.int(2, 3);
      const pool = [...baseGoods];
      for (let k=0;k<kinds && pool.length;k++){
        const icon = pool.splice(r.int(0, pool.length-1), 1)[0];
        const base = r.pick([
          r.pick(swatch),
          icon==='cheese' ? '#E7D66B' : icon==='bread' ? '#C88C4A' : icon==='fish' ? '#7FB6D6' :
          icon==='spices' ? '#C24C2A' : icon==='textiles' ? '#7B3A8E' : '#B08A5B'
        ]);
        goods.push({
          id:`${icon}-${i}-${k}`, icon, color:base, hi:shade(base,28), lo:shade(base,-28),
          variant:r.int(0,1), count:r.int(5, condition==='prosperous' ? 11 : 8)
        });
      }

      models.push({
        id:i,
        x, y:stallsY, w, h:80,
        wood:{post:woodBase, brace:shade(woodBase,-12), counter:shade(woodBase,10), inner:shade(woodBase,-35)},
        awning:{...awningBase, base:awningBase.base, phase:r.range(0,Math.PI*2)},
        vendorHue:r.pick(swatch),
        vendorScale:1.16,
        goods,
        decor:{
          rugFront: (zoneK==='MENA' || zoneK==='EUROPEAN') && r.next()>0.55,
          pennant: condition==='prosperous' && r.next()>0.5,
          beadCurtain: (zoneK==='MENA'||zoneK==='SUB_SAHARAN_AFRICAN') && r.next()>0.58,
          lantern: zoneK==='EAST_ASIAN' && (eraK==='medieval' || eraK==='early'),
          banner: r.next() > 0.72
        }
      });
    }

    stallsRef.current = models;
  }, [rebuildKey, stallsY, width]);

  const stalls = stallsRef.current ?? [];

  /* ───────────────────────────── Walkers (compact) ───────────────────────────── */

  type Garb = 'dress'|'robe'|'tunic_pants'|'child_simple';
  type Walker = {
    id:string;x:number;y:number;dir:1|-1;speed:number;hue:string;
    kind:'villager'|'merchant'|'child';scale:number;
    legH:number; armH:number; torsoH:number; headH:number;
    garb:Garb; accent:string;
  };

  const [walkBack, setWalkBack] = useState<Walker[]>([]);
  const [walkFront, setWalkFront] = useState<Walker[]>([]);

  const makeWalkers = (count:number, y:number, salt:number, scale:number, speedMul:number): Walker[] => {
    const arr: Walker[] = [];
    for (let i=0;i<count;i++){
      const r = new RNG(seed + salt + i);
      const adult = r.next() > 0.22;
      const garb = adult
        ? (r.next() < 0.5 ? 'dress' : (r.next() < 0.25 ? 'robe' : 'tunic_pants'))
        : 'child_simple';

      const legH = adult ? r.int(6,8) : r.int(5,6);
      const torsoH = adult ? r.int(6,8) : r.int(5,6);
      const armH = adult ? r.int(3,5) : r.int(3,4);
      const headH = 2;
      const hues = CULTURE_SWATCHES[zoneK];
      const hue = hues[i % hues.length];
      const accent = shade(hue, 30);

      arr.push({
        id:`w-${salt}-${i}`,
        x:r.range(10,width-10),
        y:ipx(y + r.range(-2,3)),
        dir:r.next()>0.5?1:-1,
        speed:(reduced ? 0.2 : 0.35) + r.range(0,0.25) * speedMul,
        hue, kind: adult ? (r.next()>0.75?'merchant':'villager') : 'child',
        scale,
        legH, armH, torsoH, headH,
        garb, accent
      });
    }
    return arr;
  };

  useEffect(() => {
    setWalkBack(makeWalkers(condition==='prosperous'?7:5, walkBackY, 6000, 0.82, 1.0));
    setWalkFront(makeWalkers(condition==='prosperous'?6:4, walkFrontY, 7000, 1.62, 1.55));
  }, [seed, width, walkBackY, walkFrontY, condition, zoneK, reduced]);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setWalkBack(prev => prev.map(w => {
        let x = w.x + w.dir * w.speed;
        if (x < -12) x = width + 12; if (x > width + 12) x = -12;
        return { ...w, x };
      }));
      setWalkFront(prev => prev.map(w => {
        let x = w.x + w.dir * w.speed;
        if (x < -12) x = width + 12; if (x > width + 12) x = -12;
        return { ...w, x };
      }));
    }, 60);
    return () => clearInterval(id);
  }, [width, reduced]);

  const WalkerSprite: React.FC<{ w:Walker }> = ({ w }) => {
    const phase = Math.floor((frame + (w.id.charCodeAt(2) % 11)) / (w.scale > 1.2 ? (reduced?9:5) : (reduced?11:7))) % 4;
    const swingBase = [1, 0, -1, 0][phase];
    const swing = swingBase * w.dir;
    const bob = (phase === 1 || phase === 3 ? 0.12 : 0) * w.scale + Math.sin((frame + (w.id.charCodeAt(1) % 17)) * 0.06) * (0.12 * w.scale) * (reduced?0.25:1);
    const rimX = (LEFT_RIM(tod) === 'left' ? -2 : 2) * w.scale;

    const skin = '#E8C6A3';
    const shoe = '#1B1B1B';

    return (
      <g transform={`translate(${ipx(w.x)}, ${w.y + bob}) scale(${w.scale})`}>
        <ellipse cx={0} cy={w.legH + 1} rx={4} ry={1.6} fill="#000" opacity={0.16} />
        <rect x={-1.5 + swing} y={-w.legH+2} width={1} height={w.legH} fill="#2E2E2E" />
        <rect x={0.5 - swing}  y={-w.legH+2} width={1} height={w.legH} fill="#2E2E2E" />
        <rect x={-2 + swing} y={2} width={2} height={1} fill={shoe} />
        <rect x={0 - swing}  y={2} width={2} height={1} fill={shoe} />

        {/* garments */}
        {w.garb === 'dress' && (
          <>
            <rect x={-2.5} y={-w.legH - w.torsoH} width={5} height={w.torsoH} fill={w.hue}/>
            <rect x={-3.2} y={-w.legH - 2} width={6.4} height={3} fill={shade(w.hue,-8)} />
            <rect x={rimX} y={-w.legH - w.torsoH} width={1} height={w.torsoH+3} fill={shade(w.hue,35)} opacity={tod==='night'?0.55:0.85}/>
          </>
        )}
        {w.garb === 'robe' && (
          <>
            <rect x={-2.8} y={-w.legH - w.torsoH} width={5.6} height={w.torsoH+2} fill={shade(w.hue,-5)}/>
            <rect x={-2.2} y={-w.legH - w.torsoH + 1} width={1} height={w.torsoH+1} fill={shade(w.hue,25)} opacity={0.2}/>
            <rect x={rimX} y={-w.legH - w.torsoH} width={1} height={w.torsoH+2} fill={shade(w.hue,35)} opacity={tod==='night'?0.55:0.85}/>
          </>
        )}
        {w.garb === 'tunic_pants' && (
          <>
            <rect x={-2.5} y={-w.legH - w.torsoH} width={5} height={w.torsoH} fill={w.hue}/>
            <rect x={rimX} y={-w.legH - w.torsoH} width={1} height={w.torsoH} fill={shade(w.hue,35)} opacity={tod==='night'?0.55:0.85}/>
          </>
        )}
        {w.garb === 'child_simple' && (
          <>
            <rect x={-2.2} y={-w.legH - w.torsoH} width={4.4} height={w.torsoH} fill={shade(w.hue,10)}/>
            <rect x={rimX} y={-w.legH - w.torsoH} width={1} height={w.torsoH} fill={shade(w.hue,35)} opacity={0.8}/>
          </>
        )}

        {/* head + arms */}
        <rect x={-2} y={-w.legH - w.torsoH - w.headH} width={4} height={w.headH} fill={skin} />
        <rect x={-3 - swing} y={-w.legH - w.torsoH + 1} width={1} height={w.armH} fill={skin} />
        <rect x={2 + swing}  y={-w.legH - w.torsoH + 1} width={1} height={w.armH} fill={skin} />

        {w.kind === 'merchant' && <rect x={2 + swing} y={-w.legH - 4} width={2} height={2} fill="#B79C56" />}
        <rect x={rimX>0?1:-2} y={-w.legH - w.torsoH + 1} width={1} height={1} fill={w.accent} opacity={0.6}/>
      </g>
    );
  };

  /* ───────────────────────────────── Silhouettes & Ground ───────────────────────────────── */

  const renderSilhouettes = () => {
    const rimLeft = rimSide==='left';
    return (
      <g>
        <rect x={0} y={horizonY-3} width={width} height={3} fill={shade(palette.ground,-16)} />
        {silhouettes.map((s,i)=>{
          const y = horizonY - s.h;
          const hi = shade(s.color, 12);
          const rimX = rimLeft ? s.x-1 : s.x + s.w;

          const body =
            s.type==='dome' ? <ellipse cx={s.x+s.w/2} cy={y+s.h/2} rx={s.w/2} ry={ipx(s.h/2)} fill={s.color}/>
          : s.type==='step' ? (
            <>
              <rect x={s.x} y={y+ipx(s.h*0.5)} width={s.w} height={ipx(s.h*0.5)} fill={s.color}/>
              <rect x={s.x+ipx(s.w*0.12)} y={y+ipx(s.h*0.35)} width={ipx(s.w*0.76)} height={ipx(s.h*0.15)} fill={shade(s.color,-8)}/>
              <rect x={s.x+ipx(s.w*0.24)} y={y+ipx(s.h*0.2)} width={ipx(s.w*0.52)} height={ipx(s.h*0.15)} fill={shade(s.color,-12)}/>
            </>
          ) : s.type==='gable' ? (
            <polygon points={`${s.x},${y+s.h} ${s.x+s.w/2},${y} ${s.x+s.w},${y+s.h}`} fill={s.color}/>
          ) : (
            <rect x={s.x} y={y} width={s.w} height={s.h} fill={s.color}/>
          );

          return (
            <g key={i}>
              {body}
              <rect x={rimX} y={y} width={1} height={s.h} fill={hi} opacity={0.35}/>
            </g>
          );
        })}
        {[...Array(6)].map((_,i)=>{
          const x = ipx(40 + ((i*177 + seed) % (width - 80)));
          return <TreeSilhouette key={i} x={x} baseY={horizonY} scale={1 + ((i%3)*0.3)} />;
        })}
      </g>
    );
  };

  const TreeSilhouette: React.FC<{x:number;baseY:number;scale:number}> = ({x, baseY, scale}) => {
    const trunk = shade(palette.veg, -40);
    const canopy = shade(palette.veg, -30);
    if (climateKey === Climate.TROPICAL || climateKey === Climate.SEMITROPICAL) {
      return (
        <g>
          <rect x={x-0.5} y={baseY-10*scale} width={1} height={10*scale} fill={trunk}/>
          <rect x={x-6*scale} y={baseY-12*scale} width={12*scale} height={2} fill={canopy}/>
          <rect x={x-5*scale} y={baseY-14*scale} width={10*scale} height={2} fill={shade(canopy,-6)}/>
          <rect x={x-4*scale} y={baseY-16*scale} width={8*scale} height={2} fill={shade(canopy,-10)}/>
        </g>
      );
    }
    if (climateKey === Climate.ARID) {
      const c = shade(palette.veg, -20);
      return (
        <g>
          <rect x={x-0.5} y={baseY-8*scale} width={1} height={8*scale} fill={c}/>
          <rect x={x-2*scale} y={baseY-9*scale} width={4*scale} height={2*scale} fill={c}/>
        </g>
      );
    }
    return (
      <g>
        <rect x={x-1} y={baseY-8*scale} width={2} height={8*scale} fill={trunk}/>
        <rect x={x-7*scale} y={baseY-8*scale-6*scale} width={6*scale} height={5*scale} fill={canopy}/>
        <rect x={x-2*scale} y={baseY-8*scale-8*scale} width={7*scale} height={6*scale} fill={shade(canopy,-8)}/>
        <rect x={x+3*scale} y={baseY-8*scale-5*scale} width={5*scale} height={4*scale} fill={canopy}/>
      </g>
    );
  };

  const renderGround = () => {
    const W = lerpedWRef.current;
    const fxWetness = weather?.fx?.surfaceWetnessNow ?? null;
    const reduceGlossIfFx = fxWetness !== null; // avoid double puddles if WeatherEffects handles them

    return (
      <g>
        <rect x={0} y={horizonY} width={width} height={height-horizonY} fill={palette.ground}/>
        <rect x={0} y={ipx(stallsY + 10)} width={width} height={ipx(height - (stallsY + 10) - groundBand)} fill={palette.paving}/>
        {[...Array(12)].map((_,r)=>{
          const y = ipx(stallsY + 14 + r*6);
          return <rect key={r} x={0} y={y} width={width} height={1} opacity={0.22} fill={shade(palette.paving,-25)}/>;
        })}

        {/* Wet gloss and puddles */}
        {W.wetness > 0 && !reduceGlossIfFx && (
          <g opacity={(reduced ? 0.12 : 0.18) + W.wetness*0.26}>
            <rect x={0} y={ipx(stallsY + 10)} width={width} height={ipx(height - (stallsY + 10) - groundBand)} fill="#FFFFFF" />
            {[...Array(reduced?8:18)].map((_,i)=>{
              const r = new RNG(seed + 9000 + i);
              const w = ipx(r.range(30, 90));
              const x = ipx((i*67 + seed) % (width - w));
              const y = ipx(stallsY + 20 + (i*9 % (height - stallsY - groundBand - 26)));
              return <rect key={i} x={x} y={y} width={w} height={2} fill="#CFE9F9" opacity={0.35}/>;
            })}
          </g>
        )}

        {/* Mirage band */}
        {(climateKey === Climate.ARID || climateKey === Climate.TROPICAL) && (tod==='day' || tod==='dawn') && (
          <rect x={0} y={height - groundBand} width={width} height={groundBand} fill={shade(palette.paving,-10)} opacity={0.95}/>
        )}
        {!(climateKey === Climate.ARID || climateKey === Climate.TROPICAL) && (
          <rect x={0} y={height - groundBand} width={width} height={groundBand} fill={shade(palette.paving,-10)} />
        )}
      </g>
    );
  };

  /* ─────────────────────────── Atmosphere & Night Lights ────────────────────────── */

  const renderAtmosphere = () => {
    const W = lerpedWRef.current;
    const hasFxFog = !!weather?.fx?.fogDensity || !!weather?.fx?.hazeDensity || weather?.special === 'fog' || weather?.special === 'mist';
    return (
      <g style={{ mixBlendMode: 'soft-light', pointerEvents: 'none' }}>
        <rect x={0} y={0} width={width} height={height}
          fill={tod==='night' ? '#080b1a' : '#ffffff'}
          opacity={tod==='night' ? 0.10 : (tod==='dusk' ? 0.08 : 0.04)}
        />
        {/* Dust tint by climate + weather (only if FX layer isn't already doing dust) */}
        {(W.kind==='dust' || climateKey===Climate.ARID) && !weather?.fx?.airborneParticles && (
          <rect x={0} y={0} width={width} height={height}
                fill={palette.dust ?? '#C19A6B'} opacity={(W.kind==='dust' ? 0.10 + (W.precipitation*0.25) : 0.05)}/>
        )}
        {/* Simple fog/haze if WeatherEffects isn't already handling it */}
        {!hasFxFog && (W.special==='fog' || W.special==='mist') && (
          <g opacity={W.special==='fog' ? 0.22 : 0.14}>
            {[...Array(3)].map((_,i)=>(
              <rect key={i} x={0} y={horizonY + i*14} width={width} height={12} fill="#DFE5EE"/>
            ))}
          </g>
        )}
      </g>
    );
  };

  const renderEraNightLights = () => {
    if (tod !== 'night' && tod !== 'dusk') return null;

    if (eraK === 'prehist' || eraK === 'antiquity' || eraK === 'medieval' || eraK === 'early') {
      return (
        <g>
          {stalls.map((s,i)=>(
            <g key={i}>
              {[s.x-5, s.x + s.w + 4].map((tx,ix)=>{
                const flick = 1 + Math.sin((frame + i*7 + ix*13)*0.22)*(reduced?0.3:0.6);
                return (
                  <g key={ix} style={{ mixBlendMode: 'screen', isolation: 'isolate' }}>
                    <rect x={tx-1} y={s.y-18} width={2} height={10} fill="#4A3A2A"/>
                    <polygon points={`${tx-2},${s.y-18} ${tx+1},${s.y-24 - flick} ${tx+4},${s.y-18}`} fill="#FFC86B"/>
                    <circle cx={tx+1} cy={s.y-21} r={3.8} fill="#FFD873" opacity={1}/>
                    <circle cx={tx+1} cy={s.y-21} r={9+flick*1.2}  fill="#FFDE86" opacity={0.7}/>
                    <circle cx={tx+1} cy={s.y-21} r={15+flick*2.2} fill="#FFE8A6" opacity={0.35}/>
                    <ellipse cx={tx+1} cy={s.y-6} rx={15} ry={5} fill="#FFD673" opacity={0.28}/>
                  </g>
                );
              })}
            </g>
          ))}
        </g>
      );
    }

    if (eraK === 'industrial') {
      const posts: number[] = [];
      for (let i=0;i<stalls.length-1;i++) posts.push((stalls[i].x + stalls[i].w + stalls[i+1].x)/2);
      return (
        <g>
          {posts.map((px,i)=>{
            const baseY = stallsY - 8;
            const flick = 0.6 + Math.sin((frame + i*11)*0.12)*(reduced?0.2:0.4);
            return (
              <g key={i} style={{ mixBlendMode: 'screen', isolation: 'isolate' }}>
                <rect x={px-1} y={baseY-22} width={2} height={22} fill="#2E3A44"/>
                <rect x={px-4} y={baseY-30} width={8} height={8} fill="#3B4C58"/>
                <rect x={px-3} y={baseY-29} width={6} height={6} fill="#FFE08A" opacity={1}/>
                <circle cx={px} cy={baseY-26} r={8+flick}  fill="#FFE08A" opacity={0.75}/>
                <circle cx={px} cy={baseY-26} r={15+flick*2} fill="#FFE8A6" opacity={0.35}/>
                <ellipse cx={px} cy={baseY-2} rx={16} ry={5} fill="#FFD673" opacity={0.28}/>
              </g>
            );
          })}
        </g>
      );
    }

    // Modern/Future: string bulbs
    const y = stallsY - 16;
    const left = stalls[0]?.x ?? 80;
    const right = (stalls[stalls.length-1]?.x ?? left) + (stalls[stalls.length-1]?.w ?? 0);
    const span = Math.max(1, right - left);
    return (
      <g>
        <path d={`M ${left} ${y} L ${right} ${y}`} stroke="#2E3A44" strokeWidth={1}/>
        {[...Array(18)].map((_,i)=>{
          const bx = left + i * (span/17);
          const pulse = 0.6 + Math.sin((frame + i*9)*0.15)*(reduced?0.2:0.35);
          const bulb = eraK==='future' ? ['#66F7FF','#9BFF7A','#FFD86B','#FF77C8'][i%4] : '#FFD86B';
          return (
            <g key={i} style={{ mixBlendMode: 'screen', isolation: 'isolate' }}>
              <rect x={ipx(bx)-1} y={y-1} width={2} height={2} fill={bulb}/>
              <circle cx={ipx(bx)} cy={y} r={4+pulse} fill={bulb} opacity={1}/>
              <circle cx={ipx(bx)} cy={y} r={9+pulse*2} fill={bulb} opacity={0.72}/>
              <circle cx={ipx(bx)} cy={y} r={15+pulse*3} fill={bulb} opacity={0.35}/>
              {i%2===0 && <ellipse cx={ipx(bx)} cy={y+10} rx={12} ry={4} fill="#FFD673" opacity={0.22}/>}
            </g>
          );
        })}
      </g>
    );
  };

  /* ─────────────────────────── POOLED PRECIPITATION (SVG, masked) ─────────────────────────── */

  type Particle = { x:number; y:number; vx:number; vy:number; w:number; h:number; life?:number; maxLife?:number; };
  class ParticlePoolSVG {
    private ns = 'http://www.w3.org/2000/svg';
    private nodes: SVGRectElement[] = [];
    private data: Particle[] = [];
    private active = 0;
    constructor(private parent: SVGGElement, private max: number, private baseFill: string, private width = 1, private height = 3, private opacity = 1) {}
    init() {
      for (let i = 0; i < this.max; i++) {
        const r = document.createElementNS(this.ns, 'rect');
        r.setAttribute('width', String(this.width));
        r.setAttribute('height', String(this.height));
        r.setAttribute('fill', this.baseFill);
        r.setAttribute('opacity', String(this.opacity));
        r.style.display = 'none';
        this.parent.appendChild(r);
        this.nodes.push(r);
        this.data.push({ x: 0, y: 0, vx: 0, vy: 0, w: this.width, h: this.height });
      }
    }
    configure(i: number, p: Partial<Particle>) {
      const d = this.data[i];
      Object.assign(d, p);
      const node = this.nodes[i];
      node.setAttribute('width', String(d.w));
      node.setAttribute('height', String(d.h));
      node.style.display = 'block';
    }
    setActive(n: number) {
      const to = Math.max(0, Math.min(this.max, n));
      for (let i = to; i < this.active; i++) this.nodes[i].style.display = 'none';
      this.active = to;
    }
    step(boundsW: number, boundsH: number) {
      for (let i = 0; i < this.active; i++) {
        const d = this.data[i];
        d.x += d.vx; d.y += d.vy;
        if (d.life !== undefined && d.maxLife !== undefined) {
          d.life += 1;
          if (d.life >= d.maxLife) {
            d.y = -10 - Math.random() * 40;
            d.x = Math.random() * boundsW;
            d.life = 0;
          }
        } else if (d.y > boundsH + 10) {
          d.y = -10 - Math.random() * 40;
          d.x = Math.random() * boundsW;
        }
        const node = this.nodes[i];
        node.setAttribute('x', d.x.toFixed(1));
        node.setAttribute('y', d.y.toFixed(1));
      }
    }
    cleanup() {
      for (const n of this.nodes) n.remove();
      this.nodes = [];
      this.data = [];
      this.active = 0;
    }
  }

  const precipGroupRef = useRef<SVGGElement | null>(null);
  const snowPoolRef = useRef<ParticlePoolSVG | null>(null);
  const rainPoolRef = useRef<ParticlePoolSVG | null>(null);
  const sleetPoolRef = useRef<ParticlePoolSVG | null>(null);

  useEffect(() => {
    if (!precipGroupRef.current) return;
    const g = precipGroupRef.current;
    rainPoolRef.current = new ParticlePoolSVG(g, reduced ? 70 : 120, '#BFDFF7', 1, 4, 0.9);
    sleetPoolRef.current = new ParticlePoolSVG(g, reduced ? 50 : 90, '#CFE7FF', 1, 3, 0.9);
    snowPoolRef.current = new ParticlePoolSVG(g, reduced ? 40 : 70, '#FFF', 1, 1, 0.95);
    rainPoolRef.current.init();
    sleetPoolRef.current.init();
    snowPoolRef.current.init();
    return () => {
      rainPoolRef.current?.cleanup();
      sleetPoolRef.current?.cleanup();
      snowPoolRef.current?.cleanup();
      rainPoolRef.current = null; sleetPoolRef.current = null; snowPoolRef.current = null;
    };
  }, [width, height, reduced]);

  useEffect(() => {
    const W = lerpedWRef.current;
    const windX = (W.wind) * 7;

    const rainCount = W.kind === 'rain' ? Math.round(90 * (W.precipitation || 0.4)) : 0;
    const drizzleCount = W.kind === 'drizzle' ? Math.round(50 * (W.precipitation || 0.2)) : 0;
    const sleetCount = W.kind === 'sleet' ? Math.round(70 * (W.precipitation || 0.35)) : 0;
    const snowCount = W.kind === 'snow' ? Math.round(40 * (W.precipitation || 0.4)) : 0;

    rainPoolRef.current?.setActive(rainCount + drizzleCount);
    sleetPoolRef.current?.setActive(sleetCount);
    snowPoolRef.current?.setActive(snowCount);

    for (let i=0;i<(rainCount + drizzleCount);i++){
      const speed = reduced ? 2.4 : 3.6;
      rainPoolRef.current?.configure(i, {
        x: Math.random()*width,
        y: Math.random()*(height-horizonY) + horizonY,
        vx: windX * 0.25,
        vy: speed + Math.random()*1.6,
        w: 1,
        h: (i<drizzleCount) ? 2 : 4,
      });
    }
    for (let i=0;i<sleetCount;i++){
      sleetPoolRef.current?.configure(i, {
        x: Math.random()*width,
        y: Math.random()*(height-horizonY) + horizonY,
        vx: windX * 0.25,
        vy: (reduced?2.0:3.0) + Math.random()*1.2,
        w: 1,
        h: 3,
      });
    }
    for (let i=0;i<snowCount;i++){
      snowPoolRef.current?.configure(i, {
        x: Math.random()*width,
        y: Math.random()*(height-horizonY) + horizonY - 8,
        vx: windX * 0.12 + (Math.random()*0.6 - 0.3),
        vy: (reduced?0.35:0.55) + Math.random()*0.4,
        w: 1,
        h: 1,
        life: Math.floor(Math.random()*60),
        maxLife: 150 + Math.floor(Math.random()*120),
      });
    }
  }, [width, height, reduced, targetW]);

  useEffect(() => {
    let raf = 0;
    const step = () => {
      if (!document.hidden) {
        const H = height, Wd = width;
        rainPoolRef.current?.step(Wd, H);
        sleetPoolRef.current?.step(Wd, H);
        snowPoolRef.current?.step(Wd, H);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [width, height]);

  /* ─────────────────────────── CLIP/MASK for precipitation ────────────────────────── */

  const precipMaskId = `mk_precip_mask_${uid}`;
  const buildPrecipMask = useCallback(() => {
    return (
      <mask id={precipMaskId}>
        <rect x={0} y={0} width={width} height={height} fill="#fff"/>
        {stalls.map((s,i) => {
          const topY = s.y - 22;
          const innerTop = s.y;
          const innerBottom = s.y + s.h - 22 - 2;
          return (
            <g key={i}>
              <rect x={s.x-8} y={topY-2} width={s.w+16} height={16} fill="#000"/>
              <rect x={s.x} y={innerTop} width={s.w} height={innerBottom - innerTop} fill="#000"/>
              <rect x={s.x} y={s.y + s.h - 22} width={s.w} height={22} fill="#000"/>
            </g>
          );
        })}
      </mask>
    );
  }, [stalls, width, height]);

  /* ─────────────────────────── Lightning overlay (simple) ─────────────────────────── */

  const lightningProb = weather?.fx?.lightningProbability ?? 0;
  const showLightning = (targetW.kind === 'rain' || targetW.kind === 'drizzle') && lightningProb > 0.2;

  /* ─────────────────────────────────── Render ─────────────────────────────────── */

  const seasonStr = toSeasonString(season);
  const climateStr = toClimateString(climate);
  const { h: clockH, m: clockM } = todToClock(tod);

  // Feed WeatherEffects without precip so our SVG mask continues to govern rain/snow
  const fxWeather = useMemo<WeatherState | undefined>(() => {
    if (!weather) return undefined;
    return { ...weather, precipitation: 'none', intensity: 0 } as WeatherState;
  }, [weather]);

  return (
    <div
      className="relative"
      style={{ width, height, overflow: 'hidden', isolation: 'isolate' }}
      aria-label="Marketplace banner"
    >
      {/* Time & weather aware sky (handles overcast, seasons, climates) */}
      <TimeAwareBackground
        gameTimeHours={clockH}
        gameTimeMinutes={clockM}
        weather={weather ?? undefined}
        season={seasonStr}
        climate={climateStr}
      />

      {/* Optional atmospheric FX layer (no precip here) under SVG so stalls occlude */}
      {enableFxLayer && fxWeather && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          <WeatherEffects weather={fxWeather} width={width} height={height} />
        </div>
      )}

      {/* Main SVG scene (transparent sky) */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ imageRendering: 'pixelated', display: 'block', position: 'relative', zIndex: 2 }}
      >
        <defs>{buildPrecipMask()}</defs>

        {/* Rear layers except sky (sky handled by TimeAwareBackground) */}
        {renderSilhouettes()}
        {renderGround()}
        {renderAtmosphere()}

        {/* Walkers + stalls */}
        <g>{walkBack.map(w => <WalkerSprite key={w.id} w={w} />)}</g>
        {stalls.map(s => <StallBlock key={s.id} stall={s}/>)}
        <g>{walkFront.map(w => <WalkerSprite key={w.id} w={w} />)}</g>

        {/* Weather particles (masked under awnings/counters) */}
        <g ref={precipGroupRef as any} mask={`url(#${precipMaskId})`} />

        {/* Era lights on top */}
        {renderEraNightLights()}
      </svg>

      {/* Lightning flash (kept outside SVG for blend) */}
      {showLightning && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 4,
            animation: `mk-lightning-flash ${3 + (1 - Math.max(0, Math.min(1, lightningProb))) * 3}s ease-in-out ${Math.random() * 2}s infinite`,
            background: 'radial-gradient(circle at 60% 20%, rgba(255,255,255,0.6), rgba(255,255,255,0) 40%)',
            mixBlendMode: 'screen',
            opacity: 0
          }}
        />
      )}

      {/* Animations */}
      <style>{`
        @keyframes mk-lightning-flash {
          0%, 96%, 100% { opacity: 0; }
          97% { opacity: 0.9; }
          98% { opacity: 0.1; }
          99% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );

  /* ────────────────────────── Nested components ────────────────────────── */

  function StallBlock({ stall }: { stall: any }) {
    const { x, y, w, h } = stall;
    const counterH = 22;
    const innerTop = y - 0;
    const innerBottom = y + h - counterH - 2;
    const innerH = innerBottom - innerTop;

    const colW = 13, rowH = 12;
    const maxCols = Math.floor((w - 18) / colW);

    const rimLeft = rimSide==='left';
    const postRim = shade(stall.wood.post, 35);

    const slots: {gx:number; gy:number}[] = [];
    let gx=0, gy=0;
    for (let i=0;i<64;i++){
      const rowY = innerTop + 6 + gy*rowH;
      if (rowY + 10 > innerBottom) break;
      slots.push({ gx, gy });
      gx++; if (gx>=maxCols){ gx=0; gy++; }
    }
    let slotIdx = 0;

    return (
      <g>
        {/* posts */}
        <rect x={x-4} y={y-26} width={3} height={h + 10} fill={stall.wood.post}/>
        <rect x={x+w+1} y={y-26} width={3} height={h + 10} fill={stall.wood.post}/>
        {rimLeft
          ? <>
              <rect x={x-4} y={y-26} width={1} height={h + 10} fill={postRim} opacity={tod==='night'?0.25:0.8}/>
              <rect x={x+w+1} y={y-26} width={1} height={h + 10} fill={shade(stall.wood.post,-25)} opacity={0.25}/>
            </>
          : <>
              <rect x={x-2} y={y-26} width={1} height={h + 10} fill={shade(stall.wood.post,-25)} opacity={0.25}/>
              <rect x={x+w+3 - 1} y={y-26} width={1} height={h + 10} fill={postRim} opacity={tod==='night'?0.25:0.8}/>
            </>
        }
        <rect x={x-4} y={y-10} width={w+8} height={2} fill={stall.wood.brace}/>

        {/* Awning */}
        <Awning stall={stall}/>

        {/* Interior & shelves */}
        <rect x={x} y={innerTop} width={w} height={innerH} fill={stall.wood.inner} opacity={0.92}/>
        <rect x={x+4} y={innerTop+8}  width={w-8} height={1} fill={shade(stall.wood.counter,-10)}/>
        <rect x={x+4} y={innerTop+20} width={w-8} height={1} fill={shade(stall.wood.counter,-10)}/>
        <rect x={x+4} y={innerTop+32} width={w-8} height={1} fill={shade(stall.wood.counter,-10)}/>

        {/* Goods */}
        {stall.goods.map((g: GoodSpec, gi:number)=>{
          const Icon = ICONS[g.icon];
          const count = g.count;
          const lumps: JSX.Element[] = [];
          for (let k=0;k<count && slotIdx<slots.length;k++,slotIdx++){
            const {gx,gy} = slots[slotIdx];
            const colX = x + 6 + gx*colW;
            const rowY = innerTop + 6 + gy*rowH;
            lumps.push(
              <g key={`${gi}-${k}`} transform={`translate(${colX}, ${rowY})`}>
                <rect x={0} y={10} width={12} height={2} fill="#000" opacity={0.15}/>
                <Icon c={g.color} hi={g.hi} lo={g.lo} v={g.variant}/>
              </g>
            );
          }
          return lumps;
        })}

        {/* Vendor */}
        <Vendor x={x + w/2} y={innerTop + Math.min(30, innerH - 18)} hue={stall.vendorHue} scale={stall.vendorScale}/>

        {/* body + counter */}
        <rect x={x} y={y} width={w} height={h - 8} fill={shade(stall.wood.counter, 10)} opacity={0.22}/>
        <rect x={x} y={y + h - counterH} width={w} height={counterH} fill={stall.wood.counter}/>
        <rect x={x} y={y + h - counterH} width={w} height={2} fill={shade(stall.wood.counter, 28)}/>
        <rect x={x} y={y + h - 1} width={w} height={1} fill={shade(stall.wood.counter, -35)}/>

        {/* decor */}
        {stall.decor.rugFront && (
          <g>
            <rect x={x+4} y={y + h - 2} width={w-8} height={6} fill="#8A3C2B"/>
            {[...Array(Math.floor((w-8)/6))].map((_,i)=>
              <rect key={i} x={x+4+i*6} y={y+h-2} width={3} height={6} fill="#D6B14A" opacity={0.85}/>
            )}
          </g>
        )}
        {stall.decor.pennant && (
          <g>
            <rect x={x + w/2 - 1} y={y - 28} width={2} height={6} fill={shade(stall.wood.post,-15)}/>
            <polygon points={`${x+w/2+1},${y-22} ${x+w/2+13},${y-18 + Math.sin(frame*0.18 + x*0.02)*(reduced?1:2)} ${x+w/2+1},${y-14}`}
                    fill={CULTURE_SWATCHES[zoneK][(stall.id)%CULTURE_SWATCHES[zoneK].length]} />
          </g>
        )}
        {stall.decor.beadCurtain && (
          <g opacity={0.7}>
            {[...Array(6)].map((_,i)=>(
              <rect key={i} x={x+3 + i* (w-6)/5} y={innerTop+1} width={1} height={ipx(innerH*0.65)} fill="#C6B6A1"/>
            ))}
          </g>
        )}
        {stall.decor.lantern && (tod==='dusk' || tod==='night') && (
          <g style={{ mixBlendMode: 'screen', isolation: 'isolate' }}>
            <rect x={x + w - 10} y={y - 14} width={6} height={8} fill="#B72A2A"/>
            <rect x={x + w - 8}  y={y - 12} width={2} height={4} fill="#FFD86B" opacity={1}/>
            <circle cx={x + w - 7} cy={y - 10} r={6 + Math.sin(frame*0.2)*(reduced?0.3:0.6)} fill="#FFD86B" opacity={0.75}/>
            <circle cx={x + w - 7} cy={y - 10} r={12 + Math.sin(frame*0.2)*(reduced?0.6:1.2)} fill="#FFE08A" opacity={0.42}/>
            <ellipse cx={x + w - 7} cy={y + 4} rx={14} ry={5} fill="#FFD673" opacity={0.28}/>
          </g>
        )}
        {stall.decor.banner && (
          <g>
            <rect x={x-5} y={y-25} width={1} height={16} fill={shade(stall.wood.post, -10)}/>
            <rect x={x-4} y={y-24} width={10} height={6} fill={CULTURE_SWATCHES[zoneK][(stall.id+2)%CULTURE_SWATCHES[zoneK].length]} />
          </g>
        )}
      </g>
    );
  }

  function Vendor({ x, y, hue, scale }: { x:number; y:number; hue:string; scale:number }) {
    const rimX = rimSide==='left' ? -2*scale : 2*scale;
    const todLocal = tod;
    return (
      <g transform={`translate(${x}, ${y}) scale(${scale})`}>
        <rect x={-2.5} y={-14} width={5} height={9} fill={hue}/>
        <rect x={rimX} y={-14} width={1} height={9} fill={shade(hue,35)} opacity={todLocal==='night'?0.55:0.85}/>
        <rect x={-2} y={-16} width={4} height={2} fill="#E8C6A3"/>
      </g>
    );
  }

  function Awning({ stall }: { stall: any }) {
    const { x, y, w } = stall;
    const topY = y - 22;
    const W = lerpedWRef.current;
    const wave = Math.sin(frame * (reduced ? 0.02 : (0.04 + W.wind*0.05)) + stall.awning.phase) * (reduced ? 0.6 : 1.2);
    const cloth = stall.awning.base, hi = stall.awning.hi, lo = stall.awning.lo;
    const rimColor = shade(cloth, 25);
    const rimLeft = rimSide==='left';

    return (
      <g>
        {stall.awning.cords && <rect x={x - 6} y={topY - 1} width={w + 12} height={1} fill={shade(cloth,-25)}/>}
        <path
          d={`M ${x-6} ${topY} Q ${x+w/2} ${topY - 4 + wave} ${x+w+6} ${topY}
              L ${x+w+6} ${topY+12} Q ${x+w/2} ${topY+16 + wave} ${x-6} ${topY+12} Z`}
          fill={cloth}
        />
        {stall.awning.pattern==='striped' && [...Array(Math.ceil((w+12)/10))].map((_,i)=>{
          const sx = x - 6 + i*10; return <rect key={i} x={sx} y={topY} width={5} height={12} fill={i%2?lo:hi} opacity={0.75}/>;
        })}
        {stall.awning.pattern==='checker' && [...Array(Math.ceil((w + 12)/10))].map((_,i)=>{
          const sx = x - 6 + i*10; return (
            <g key={i} opacity={0.8}>
              <rect x={sx} y={topY} width={5} height={6} fill={i%2?hi:lo}/>
              <rect x={sx+5} y={topY} width={5} height={6} fill={i%2?lo:hi}/>
              <rect x={sx} y={topY+6} width={5} height={6} fill={i%2?lo:hi}/>
              <rect x={sx+5} y={topY+6} width={5} height={6} fill={i%2?hi:lo}/>
            </g>
          );
        })}
        {stall.awning.fringe && [...Array(Math.ceil((w+12)/6))].map((_,i)=>{
          const fx = x - 6 + i*6; return <rect key={i} x={fx} y={topY+12} width={1} height={2} fill={shade(cloth,-30)}/>;
        })}
        {rimLeft
          ? <rect x={x-6} y={topY} width={1} height={12} fill={rimColor} opacity={tod==='night'?0.25:0.7}/>
          : <rect x={x+w+5} y={topY} width={1} height={12} fill={rimColor} opacity={tod==='night'?0.25:0.7}/>
        }
      </g>
    );
  }
};

export default React.memo(MarketplaceBanner);
