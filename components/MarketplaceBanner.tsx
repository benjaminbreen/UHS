/**
 * components/MarketplaceBanner.tsx
 * Expansive pixel-art marketplace banner with era/culture silhouettes, proper horizon-warm skies,
 * stronger warm lamps, disciplined RNG, subtle weather integration, and charming walker variety.
 *
 * Notes
 * - Sky gradients now match TimeAwareBackground: cool/dark at TOP, warm near the HORIZON.
 * - Night tint uses soft-light (not multiply) + root SVG { isolation: 'isolate' } so screen glows punch.
 * - Optional `weather?: WeatherState` prop (from services/weatherService). If omitted, we synthesize weather.
 * - Walkers: randomized limb/torso proportions, simple garb system (≈50% dresses), tiny rim lights & shadows.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

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

/* ─────────────────────────── Horizon-Warm Sky Palettes ───────────────────────────
   These are TOP→BOTTOM stops. Warm hues sit near the horizon (bottom).            */

type SkyStop = { offset: string; color: string };
const SKY: Record<TOD, SkyStop[]> = {
  dawn: [
    { offset:'0%',  color:'#2B3E5C' }, // top cool blue
    { offset:'40%', color:'#7A90B0' },
    { offset:'72%', color:'#FFB6C1' }, // pinks
    { offset:'100%',color:'#FFE4B5' }, // warm peach at horizon
  ],
  day: [
    { offset:'0%',  color:'#4A90E2' }, // deeper blue at zenith
    { offset:'65%', color:'#87CEEB' },
    { offset:'100%',color:'#E6F3FF' }, // pale near horizon
  ],
  dusk: [
    { offset:'0%',  color:'#1F2937' }, // deep blue-gray top
    { offset:'60%', color:'#FF8C69' }, // salmon
    { offset:'100%',color:'#FFA07A' }, // light salmon at horizon
  ],
  night: [
    { offset:'0%',  color:'#0a0e27' }, // deep at top
    { offset:'55%', color:'#1a1a3e' },
    { offset:'100%',color:'#16213e' }, // slightly lighter near horizon
  ],
};

/* ───────────────────────────── Biome/Climate Palettes ─────────────────────────── */

const CLIMATE: Record<string, { ground: string; paving: string; veg: string; accent: string }> = {
  [Climate.COLD]:        { ground:'#BFE6D7', paving:'#A9D4C7', veg:'#497C74', accent:'#78A3AD' },
  [Climate.TEMPERATE]:   { ground:'#A7E7B1', paving:'#8FD197', veg:'#1E9E57', accent:'#5BBF7F' },
  // MED uses temperate palette unless you add ClimateType.MEDITERRANEAN in your types.
  ['MEDITERRANEAN' as any]: { ground:'#C9E1AE', paving:'#B5CF9C', veg:'#2F8A56', accent:'#87AA63' },
  [Climate.ARID]:        { ground:'#D7C2A0', paving:'#C5AF8E', veg:'#7A6B44', accent:'#C89145' },
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

/* ───────────────────────────── Weather Integration ───────────────────────────── */

type WeatherKind = 'clear' | 'rain' | 'snow' | 'sleet' | 'drizzle' | 'dust';

interface LocalWeather {
  kind: WeatherKind;
  wind: number;              // px/frame
  wetness: number;           // 0..1 for gloss/puddles
  precipitation: number;     // density (0..1)
  temp: number;
  cloudCover: number;        // 0..1
  visibility: number;        // 0..1
  special: WeatherState['special'];
  overcast: number;          // alias for cloudCover
}

// Fallback generator if the app doesn't pass a WeatherState
const synthWeather = (
  season: Season | string,
  climate: Climate | string,
  tod: TOD,
  rng: RNG
): LocalWeather => {
  const s = String(season).toLowerCase();
  const c = String(climate).toLowerCase();
  let rain = 0.25, snow = 0.05, dust = 0.02;
  if (c.includes('arid')) { rain = 0.08; dust = 0.12; }
  if (c.includes('cold')) { snow = 0.18; rain = 0.16; }
  if (c.includes('trop')) { rain = 0.35; }
  if (s.includes('winter')) { snow += 0.25; rain *= 0.6; }
  if (s.includes('summer')) { dust += c.includes('arid') ? 0.1 : 0.02; }
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
  return { kind, wind, wetness, precipitation: prec, temp, cloudCover, visibility: 1 - cloudCover * 0.25, special: null, overcast: cloudCover };
};

// Map WeatherState → LocalWeather
const fromWeatherState = (w: WeatherState): LocalWeather => {
  const kind: WeatherKind = (w.precipitation as WeatherKind) || 'clear';
  const wetness = (w.precipitation === 'rain' || w.precipitation === 'drizzle') ? Math.min(1, 0.6 + w.intensity * 0.6)
                 : (w.precipitation === 'sleet' ? 0.35
                 : (w.precipitation === 'snow' ? 0.2 : 0));
  return {
    kind,
    wind: 0.25 + (w.windSpeed / 80), // scale into px/frame
    wetness,
    precipitation: w.intensity || 0,
    temp: w.temperature,
    cloudCover: w.cloudCover,
    visibility: w.visibility,
    special: w.special,
    overcast: w.cloudCover,
  };
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

const CULTURE_GOODS = (era: EraKey, zone: ZoneKey): IconKey[] => {
  if (zone === 'EAST_ASIAN') return ['fish','textiles','pottery','spices','tools','produce'];
  if (zone === 'MENA') return ['spices','textiles','pottery','tools','produce','bread'];
  if (zone === 'SUB_SAHARAN_AFRICAN') return ['produce','pottery','tools','textiles','fish','beads','hide'];
  if (zone === 'SOUTH_ASIAN') return ['spices','textiles','pottery','tools','produce','fish'];
  if (zone === 'SOUTH_AMERICAN') return ['produce','pottery','textiles','cocoa','tools','fish'];
  if (zone === 'OCEANIA') return ['fish','produce','textiles','pottery','tools'];
  if (zone === 'NORTH_AMERICAN_PRE_COLUMBIAN') return ['corn','pottery','hide','fish','beads','tools','produce'];
  if (zone === 'NORTH_AMERICAN_COLONIAL') return ['bread','cheese','textiles','tools','produce','fish'];
  if (era === 'early') return ['bread','cheese','spices','textiles','tools','fish','produce'];
  if (era === 'industrial') return ['bread','tools','textiles','produce','cheese','fish'];
  return ['bread','cheese','textiles','tools','produce','fish'];
};

/* ───────────────────────────── Layout & Types ─────────────────────────── */

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
}) => {
  const [frame, setFrame] = useState(0);
  useEffect(() => { const id = setInterval(() => setFrame(f => f + 1), 60); return () => clearInterval(id); }, []);

  const rng = useMemo(() => new RNG(seed), [seed]);
  const tod = useMemo(() => toTOD(timeOfDay), [timeOfDay]);
  const eraK = useMemo(() => toEra(era), [era]);
  const zoneK = useMemo(() => toZone(culturalZone), [culturalZone]);
  const climateKey = useMemo(() => {
    const k = String(climate);
    return CLIMATE[k] ? k : Climate.TEMPERATE;
  }, [climate]);
  const palette = CLIMATE[climateKey];
  const rimSide = LEFT_RIM(tod);

  const horizonY = ipx(height * 0.60);
  const stallsY = ipx(horizonY + 10);
  const walkBackY = ipx(horizonY + 6);
  const walkFrontY = ipx(stallsY + 78);
  const groundBand = ipx(Math.max(12, height * 0.1));

  // Weather, live if provided
  const W = useMemo<LocalWeather>(() => {
    if (weather) return fromWeatherState(weather);
    return synthWeather(season as Season, climate as Climate, tod, new RNG(seed + 999));
  }, [weather, season, climate, tod, seed]);

  /* ────────────────────────────── Silhouette Cityline ───────────────────────────── */

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

    const awningBase = (() => {
      switch(zoneK){
        case 'EAST_ASIAN': return { base:'#B72A2A', hi:'#E7B64D', lo:'#6B1111', pattern:'striped' as const, fringe:true, cords:true };
        case 'MENA': return { base:'#2A5F79', hi:'#D4B46A', lo:'#1A3E4E', pattern:'checker' as const, fringe:true, cords:false };
        case 'SUB_SAHARAN_AFRICAN': return { base:'#7A5328', hi:'#D6B14A', lo:'#4C331C', pattern:'checker' as const, fringe:false, cords:true };
        case 'SOUTH_ASIAN': return { base:'#C0542E', hi:'#E9C35C', lo:'#6E2E16', pattern:'striped' as const, fringe:true, cords:true };
        case 'SOUTH_AMERICAN': return { base:'#8B3E2A', hi:'#E0A35A', lo:'#4B2518', pattern:'striped' as const, fringe:false, cords:true };
        case 'NORTH_AMERICAN_PRE_COLUMBIAN': return { base:'#7B3F2A', hi:'#E0A35A', lo:'#4B2518', pattern:'checker' as const, fringe:false, cords:true };
        case 'NORTH_AMERICAN_COLONIAL': return { base:'#8B3A2A', hi:'#F0C25C', lo:'#572016', pattern:'striped' as const, fringe:true, cords:true };
        case 'OCEANIA': return { base:'#7B5A2A', hi:'#E2C16B', lo:'#4B3316', pattern:'striped' as const, fringe:true, cords:true };
        default: return { base:'#8B3A2A', hi:'#F0C25C', lo:'#572016', pattern:'striped' as const, fringe:true, cords:true };
      }
    })();

    const models: StallModel[] = [];
    const baseGoods = CULTURE_GOODS(eraK, zoneK);

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
        awning:{...awningBase, phase:r.range(0,Math.PI*2)},
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
  }, [rebuildKey, stallsY]);

  const stalls = stallsRef.current ?? [];

  /* ───────────────────────── Walkers (two lanes) + Garb Variety ─────────────────── */

  type Garb = 'dress'|'robe'|'tunic_pants'|'child_simple';
  type Walker = {
    id:string;x:number;y:number;dir:1|-1;speed:number;hue:string;
    kind:'villager'|'merchant'|'child';scale:number;
    // proportions (pixel lengths)
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
      const hue = CULTURE_SWATCHES[zoneK][i % CULTURE_SWATCHES[zoneK].length];
      const accent = shade(hue, 30);

      arr.push({
        id:`w-${salt}-${i}`,
        x:r.range(10,width-10),
        y:ipx(y + r.range(-2,3)),
        dir:r.next()>0.5?1:-1,
        speed:(0.35 + r.range(0,0.25)) * speedMul,
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
  }, [seed, width, walkBackY, walkFrontY, zoneK, condition]);

  useEffect(() => {
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
  }, [width]);

  const WalkerSprite: React.FC<{ w:Walker }> = ({ w }) => {
    const phase = Math.floor((frame + (w.id.charCodeAt(2) % 11)) / (w.scale > 1.2 ? 5 : 7)) % 4;
    const swingBase = [1, 0, -1, 0][phase];
    const swing = swingBase * w.dir;
    const bob = (phase === 1 || phase === 3 ? 0.12 : 0) * w.scale + Math.sin((frame + (w.id.charCodeAt(1) % 17)) * 0.06) * (0.12 * w.scale);
    const rimX = (LEFT_RIM(tod) === 'left' ? -2 : 2) * w.scale;

    const skin = '#E8C6A3';
    const shoe = '#1B1B1B';

    return (
      <g transform={`translate(${ipx(w.x)}, ${w.y + bob}) scale(${w.scale})`}>
        {/* soft shadow */}
        <ellipse cx={0} cy={w.legH + 1} rx={4} ry={1.6} fill="#000" opacity={0.16} />

        {/* LEGS */}
        <rect x={-1.5 + swing} y={-w.legH+2} width={1} height={w.legH} fill="#2E2E2E" />
        <rect x={0.5 - swing}  y={-w.legH+2} width={1} height={w.legH} fill="#2E2E2E" />
        <rect x={-2 + swing} y={2} width={2} height={1} fill={shoe} />
        <rect x={0 - swing}  y={2} width={2} height={1} fill={shoe} />

        {/* GARMENTS */}
        {w.garb === 'dress' && (
          <>
            {/* upper */}
            <rect x={-2.5} y={-w.legH - w.torsoH} width={5} height={w.torsoH} fill={w.hue}/>
            {/* skirt */}
            <rect x={-3.2} y={-w.legH - 2} width={6.4} height={3} fill={shade(w.hue,-8)} />
            {/* tiny rim */}
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

        {/* HEAD */}
        <rect x={-2} y={-w.legH - w.torsoH - w.headH} width={4} height={w.headH} fill={skin} />
        {/* ARMS (counter-swing) */}
        <rect x={-3 - swing} y={-w.legH - w.torsoH + 1} width={1} height={w.armH} fill={skin} />
        <rect x={2 + swing}  y={-w.legH - w.torsoH + 1} width={1} height={w.armH} fill={skin} />

        {/* Accessories */}
        {w.kind === 'merchant' && (
          <g>
            <rect x={2 + swing} y={-w.legH - 4} width={2} height={2} fill="#B79C56" />
          </g>
        )}
        {/* tiny highlight dot */}
        <rect x={rimX>0?1:-2} y={-w.legH - w.torsoH + 1} width={1} height={1} fill={w.accent} opacity={0.6}/>
      </g>
    );
  };

  /* ────────────────────────────────── Sky Layer ────────────────────────────────── */

  const renderSky = () => {
    // more clouds when overcast; fewer when clear
    const cloudCount = W.cloudCover > 0.7 ? 7 : W.cloudCover > 0.4 ? 4 : 2;
    const cloudOffset = (frame * (0.15 + W.wind*0.3)) % (width + 160);
    const sunColor = tod==='night' ? '#F6F9FF' : '#FFD56A';
    const showStars = tod==='night' && W.cloudCover < 0.7;

    return (
      <g>
        <defs>
          <linearGradient id="mk_sky" x1="0%" y1="0%" x2="0%" y2="100%">
            {SKY[tod].map((s,i) => <stop key={i} offset={s.offset} stopColor={s.color}/>)}
          </linearGradient>
          <linearGradient id="mk_haze" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(180,200,230,0.00)"/>
            <stop offset="40%" stopColor="rgba(180,200,230,0.18)"/>
            <stop offset="70%" stopColor="rgba(180,200,230,0.18)"/>
            <stop offset="100%" stopColor="rgba(180,200,230,0.00)"/>
          </linearGradient>
        </defs>

        {/* Sky dome */}
        <rect x={0} y={0} width={width} height={horizonY} fill="url(#mk_sky)" />

        {/* Sun/Moon near top; stars only at night */}
        {tod==='night'
          ? showStars && (
              <g>
                {[...Array(18)].map((_,i)=>(
                  <rect key={i}
                        x={ipx(20 + (i*67 + (seed*(i+3))%63) % (width-40))}
                        y={ipx(8 + (i*19 + seed)%38)}
                        width={1} height={1} fill="#F8F8FF" opacity={0.9}/>
                ))}
              </g>
            )
          : <circle cx={width-86} cy={24} r={12} fill={sunColor} />
        }

        {/* Clouds (more/less based on cloudCover) */}
        {cloudCount>0 && [...Array(cloudCount)].map(i=>{
          const x = -130 + cloudOffset + i* (width / (cloudCount-0.5));
          const y = 10 + (i*13 % 28);
          const alpha = clamp(0.4 + (W.cloudCover-0.4)*0.8, 0.15, 0.95);
          return (
            <g key={i} opacity={tod==='night' ? alpha*0.7 : alpha}>
              <rect x={x} y={y} width={26} height={12} rx={5} fill="#F2F6FA" />
              <rect x={x+12} y={y-2} width={24} height={10} rx={5} fill="#F2F6FA" />
              <rect x={x+6} y={y+6} width={18} height={8} rx={4} fill="#F2F6FA" />
            </g>
          );
        })}

        {/* Gentle vertical haze near horizon, helps warm glow */}
        <rect x={0} y={ipx(horizonY-18)} width={width} height={36} fill="url(#mk_haze)"/>
      </g>
    );
  };

  /* ───────────────────────────────── Silhouettes ───────────────────────────────── */

  const TreeSilhouette: React.FC<{x:number;baseY:number;scale:number}> = ({x, baseY, scale}) => {
    const trunk = shade(palette.veg, -40);
    const canopy = shade(palette.veg, -30);
    return (
      <g>
        <rect x={x-1} y={baseY-8*scale} width={2} height={8*scale} fill={trunk}/>
        <rect x={x-7*scale} y={baseY-8*scale-6*scale} width={6*scale} height={5*scale} fill={canopy}/>
        <rect x={x-2*scale} y={baseY-8*scale-8*scale} width={7*scale} height={6*scale} fill={shade(canopy,-8)}/>
        <rect x={x+3*scale} y={baseY-8*scale-5*scale} width={5*scale} height={4*scale} fill={canopy}/>
      </g>
    );
  };

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

  /* ───────────────────────────────── Ground & Wetness ───────────────────────────── */

  const renderGround = () => {
    return (
      <g>
        <rect x={0} y={horizonY} width={width} height={height-horizonY} fill={palette.ground}/>
        <rect x={0} y={ipx(stallsY + 10)} width={width} height={ipx(height - (stallsY + 10) - groundBand)} fill={palette.paving}/>
        {[...Array(12)].map((_,r)=>{
          const y = ipx(stallsY + 14 + r*6);
          return <rect key={r} x={0} y={y} width={width} height={1} opacity={0.22} fill={shade(palette.paving,-25)}/>;
        })}
        {/* Wet gloss and puddles */}
        {W.wetness > 0 && (
          <g opacity={0.18 + W.wetness*0.26}>
            <rect x={0} y={ipx(stallsY + 10)} width={width} height={ipx(height - (stallsY + 10) - groundBand)} fill="#FFFFFF" />
            {[...Array(18)].map((_,i)=>{
              const r = new RNG(seed + 9000 + i);
              const w = ipx(r.range(30, 90));
              const x = ipx((i*67 + seed) % (width - w));
              const y = ipx(stallsY + 20 + (i*9 % (height - stallsY - groundBand - 26)));
              return <rect key={i} x={x} y={y} width={w} height={2} fill="#CFE9F9" opacity={0.35}/>;
            })}
          </g>
        )}
        <rect x={0} y={height - groundBand} width={width} height={groundBand} fill={shade(palette.paving,-10)} />
      </g>
    );
  };

  /* ───────────────────────────────── Stall Pieces ───────────────────────────────── */

  const Vendor: React.FC<{ x:number; y:number; hue:string; scale:number }> = ({ x, y, hue, scale }) => {
    const rimX = rimSide==='left' ? -2*scale : 2*scale;
    return (
      <g transform={`translate(${x}, ${y}) scale(${scale})`}>
        <rect x={-2.5} y={-14} width={5} height={9} fill={hue}/>
        <rect x={rimX} y={-14} width={1} height={9} fill={shade(hue,35)} opacity={tod==='night'?0.55:0.85}/>
        <rect x={-2} y={-16} width={4} height={2} fill="#E8C6A3"/>
      </g>
    );
  };

  const Awning: React.FC<{ stall: StallModel }> = ({ stall }) => {
    const { x, y, w } = stall;
    const topY = y - 22;
    const wave = Math.sin(frame * (0.04 + W.wind*0.05) + stall.awning.phase) * 1.2;
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
  };

  const StallBlock: React.FC<{ stall: StallModel }> = ({ stall }) => {
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
        {/* Posts + rim light */}
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

        {/* Interior cavity + shelves */}
        <rect x={x} y={innerTop} width={w} height={innerH} fill={stall.wood.inner} opacity={0.92}/>
        <rect x={x+4} y={innerTop+8}  width={w-8} height={1} fill={shade(stall.wood.counter,-10)}/>
        <rect x={x+4} y={innerTop+20} width={w-8} height={1} fill={shade(stall.wood.counter,-10)}/>
        <rect x={x+4} y={innerTop+32} width={w-8} height={1} fill={shade(stall.wood.counter,-10)}/>

        {/* Goods */}
        {stall.goods.map((g, gi)=>{
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

        {/* Body + counter */}
        <rect x={x} y={y} width={w} height={h - 8} fill={shade(stall.wood.counter, 10)} opacity={0.22}/>
        <rect x={x} y={y + h - counterH} width={w} height={counterH} fill={stall.wood.counter}/>
        <rect x={x} y={y + h - counterH} width={w} height={2} fill={shade(stall.wood.counter, 28)}/>
        <rect x={x} y={y + h - 1} width={w} height={1} fill={shade(stall.wood.counter, -35)}/>

        {/* Optional decor */}
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
            <polygon points={`${x+w/2+1},${y-22} ${x+w/2+13},${y-18 + Math.sin(frame*0.18 + x*0.02)*2} ${x+w/2+1},${y-14}`}
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
            {/* stronger halo */}
            <circle cx={x + w - 7} cy={y - 10} r={6 + Math.sin(frame*0.2)*0.6} fill="#FFD86B" opacity={0.75}/>
            <circle cx={x + w - 7} cy={y - 10} r={12 + Math.sin(frame*0.2)*1.2} fill="#FFE08A" opacity={0.42}/>
            {/* warm ground pool */}
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
  };

  /* ─────────────────────────── Night/Day Atmosphere (soft-light) ────────────────── */

  const renderAtmosphere = () => {
    return (
      <g style={{ mixBlendMode: 'soft-light', pointerEvents: 'none' }}>
        <rect x={0} y={0} width={width} height={height}
          fill={tod==='night' ? '#080b1a' : '#ffffff'}
          opacity={tod==='night' ? 0.10 : (tod==='dusk' ? 0.08 : 0.04)}
        />
        {/* Dust tint */}
        {W.kind==='dust' && <rect x={0} y={0} width={width} height={height} fill="#C19A6B" opacity={0.06 + W.precipitation*0.2}/>}
        {/* Fog/Mist softening near ground */}
        {(W.special==='fog' || W.special==='mist') && (
          <g opacity={W.special==='fog' ? 0.22 : 0.14}>
            {[...Array(3)].map((_,i)=>(
              <rect key={i} x={0} y={horizonY + i*14} width={width} height={12} fill="#DFE5EE"/>
            ))}
          </g>
        )}
      </g>
    );
  };

  /* ───────────────────────────────── Era Lighting ───────────────────────────────── */

  const renderEraNightLights = () => {
    if (tod !== 'night' && tod !== 'dusk') return null;

    // Early eras: torches at posts
    if (eraK === 'prehist' || eraK === 'antiquity' || eraK === 'medieval' || eraK === 'early') {
      return (
        <g>
          {stalls.map((s,i)=>(
            <g key={i}>
              {[s.x-5, s.x + s.w + 4].map((tx,ix)=>{
                const flick = 1 + Math.sin((frame + i*7 + ix*13)*0.22)*0.6;
                return (
                  <g key={ix} style={{ mixBlendMode: 'screen', isolation: 'isolate' }}>
                    <rect x={tx} y={s.y-18} width={2} height={10} fill="#4A3A2A"/>
                    <polygon points={`${tx-2},${s.y-18} ${tx+1},${s.y-24 - flick} ${tx+4},${s.y-18}`} fill="#FFC86B"/>
                    {/* brighter core + larger halos */}
                    <circle cx={tx+1} cy={s.y-21} r={3.8} fill="#FFD873" opacity={1}/>
                    <circle cx={tx+1} cy={s.y-21} r={9+flick*1.2}  fill="#FFDE86" opacity={0.7}/>
                    <circle cx={tx+1} cy={s.y-21} r={15+flick*2.2} fill="#FFE8A6" opacity={0.35}/>
                    {/* warm ground pool */}
                    <ellipse cx={tx+1} cy={s.y-6} rx={15} ry={5} fill="#FFD673" opacity={0.28}/>
                  </g>
                );
              })}
            </g>
          ))}
        </g>
      );
    }

    // Industrial: gas lamps between stalls
    if (eraK === 'industrial') {
      const posts: number[] = [];
      for (let i=0;i<stalls.length-1;i++) posts.push((stalls[i].x + stalls[i].w + stalls[i+1].x)/2);
      return (
        <g>
          {posts.map((px,i)=>{
            const baseY = stallsY - 8;
            const flick = 0.6 + Math.sin((frame + i*11)*0.12)*0.4;
            return (
              <g key={i} style={{ mixBlendMode: 'screen', isolation: 'isolate' }}>
                <rect x={px-1} y={baseY-22} width={2} height={22} fill="#2E3A44"/>
                <rect x={px-4} y={baseY-30} width={8} height={8} fill="#3B4C58"/>
                <rect x={px-3} y={baseY-29} width={6} height={6} fill="#FFE08A" opacity={1}/>
                <circle cx={px} cy={baseY-26} r={8+flick}  fill="#FFE08A" opacity={0.75}/>
                <circle cx={px} cy={baseY-26} r={15+flick*2} fill="#FFE8A6" opacity={0.35}/>
                {/* ground pool */}
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
          const pulse = 0.6 + Math.sin((frame + i*9)*0.15)*0.35;
          const bulb = eraK==='future' ? ['#66F7FF','#9BFF7A','#FFD86B','#FF77C8'][i%4] : '#FFD86B';
          return (
            <g key={i} style={{ mixBlendMode: 'screen', isolation: 'isolate' }}>
              <rect x={ipx(bx)-1} y={y-1} width={2} height={2} fill={bulb}/>
              <circle cx={ipx(bx)} cy={y} r={4+pulse} fill={bulb} opacity={1}/>
              <circle cx={ipx(bx)} cy={y} r={9+pulse*2} fill={bulb} opacity={0.72}/>
              <circle cx={ipx(bx)} cy={y} r={15+pulse*3} fill={bulb} opacity={0.35}/>
              {/* subtle alternating ground pools */}
              {i%2===0 && <ellipse cx={ipx(bx)} cy={y+10} rx={12} ry={4} fill="#FFD673" opacity={0.22}/>}
            </g>
          );
        })}
      </g>
    );
  };

  /* ───────────────────────────────── Particles ───────────────────────────────── */

  const renderParticles = () => {
    if (W.kind === 'clear') {
      const summer = String(season).toLowerCase().includes('summer');
      const starry = tod==='night' && summer && W.cloudCover<0.4;
      if (starry) {
        return (
          <g>
            {[...Array(16)].map((_,i)=>{
              const fx = (i*67 + (frame*0.6) + seed) % width;
              const fy = 10 + ((i*13 + seed) % (horizonY-12));
              const flick = 0.6 + Math.sin((frame + i*7)*0.22)*0.4;
              return (
                <g key={i} style={{ mixBlendMode: 'screen', isolation: 'isolate' }}>
                  <rect x={ipx(fx)} y={ipx(fy)} width={1} height={1} fill="#FFFBAA" opacity={0.9}/>
                  <circle cx={ipx(fx)} cy={ipx(fy)} r={1.6 + flick*1.2} fill="#F9FFB0" opacity={0.35}/>
                </g>
              );
            })}
          </g>
        );
      }
      return null;
    }

    if (W.kind === 'rain' || W.kind === 'drizzle' || W.kind==='sleet') {
      const d = Math.round(90 * (W.precipitation || 0.4));
      return (
        <g opacity={0.8}>
          {[...Array(d)].map((_,i)=>{
            const x = ipx((i*17 + frame*3 + seed) % width);
            const y = ipx(((i*23 + frame*6) % (height - horizonY)) + horizonY);
            const h = W.kind==='drizzle' ? 2 : W.kind==='sleet' ? 3 : 4;
            return <rect key={i} x={x} y={y} width={1} height={h} fill="#BFDFF7"/>;
          })}
        </g>
      );
    }
    if (W.kind === 'snow') {
      const d = Math.round(40 * (W.precipitation || 0.4));
      return (
        <g opacity={0.9}>
          {[...Array(d)].map((_,i)=>{
            const x = ipx((i*23 + seed + frame) % width);
            const y = ipx(((i*17 + frame*1.4) % (height - horizonY)) + horizonY - 8);
            return <rect key={i} x={x} y={y} width={1} height={1} fill="#FFF"/>;
          })}
        </g>
      );
    }
    if (W.kind === 'dust') {
      const d = Math.round(50 * (W.precipitation || 0.3));
      return (
        <g opacity={0.35}>
          {[...Array(d)].map((_,i)=>{
            const x = ipx((i*29 + seed + frame*W.wind) % width);
            const y = ipx(((i*19 + frame*0.9) % (height - horizonY)) + horizonY);
            return <rect key={i} x={x} y={y} width={2} height={1} fill="#C19A6B"/>;
          })}
        </g>
      );
    }
    return null;
  };

  /* ─────────────────────────────────── Render ─────────────────────────────────── */

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ imageRendering: 'pixelated', display: 'block', isolation: 'isolate' }}  // <-- keeps screen glows hot
    >
      {/* Rear layers */}
      {renderSky()}
      {renderSilhouettes()}
      {renderGround()}

      {/* Light mood tint UNDER everything so glows punch through */}
      {renderAtmosphere()}

      {/* Actors + stalls */}
      <g>{walkBack.map(w => <WalkerSprite key={w.id} w={w} />)}</g>
      {stalls.map(s => <StallBlock key={s.id} stall={s}/>)}
      <g>{walkFront.map(w => <WalkerSprite key={w.id} w={w} />)}</g>

      {/* Weather & small particles */}
      {renderParticles()}

      {/* Lights on top with screen blending */}
      {renderEraNightLights()}
    </svg>
  );
};

export default React.memo(MarketplaceBanner);
