// components/RuinBanner.tsx
// Climate/time-of-day aware RUIN banner (stable layout; disciplined RNG, delightful ruin details)
// + foreground set pieces (tumbleweed/parrot/etc), perspective path, course lines, AO
// + fix stray “pixels” (no free-floating soot specks), ground-only flyer shadows

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapData,
  Tile,
  TimeOfDay,
  Season,
  CulturalZone,
  HistoricalEra,
  ClimateType as Climate,
} from '../types';
import type { WeatherState } from '../services/weatherService';

/* ───────────────────────── Utilities ───────────────────────── */

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

// hash → 32-bit unsigned
const hash32 = (s: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

class RNG {
  private s: number;
  constructor(seed = 1) { this.s = seed || 1; }
  next() { this.s = (this.s * 1664525 + 1013904223) >>> 0; return (this.s & 0xffffffff) / 0x100000000; }
  range(a: number, b: number) { return a + this.next() * (b - a); }
  int(a: number, b: number) { return Math.floor(this.range(a, b + 1)); }
  pick<T>(arr: T[]) { return arr[Math.floor(this.next() * arr.length)]!; }
  chance(p: number) { return this.next() < p; }
}

type TOD = 'dawn' | 'day' | 'dusk' | 'night';
const toTOD = (t?: TimeOfDay | string): TOD => {
  const s = String(t ?? 'day').toLowerCase();
  if (s.startsWith('dawn') || s.startsWith('morn')) return 'dawn';
  if (s.startsWith('night')) return 'night';
  if (s.startsWith('dusk') || s.includes('even') || s.includes('twilight')) return 'dusk';
  return 'day';
};
const LEFT_RIM = (tod: TOD) => (tod === 'dusk' || tod === 'night') ? 'right' : 'left';

/* ───────────────────────── Palettes ───────────────────────── */

const SKY: Record<TOD, { offset: string; color: string }[]> = {
  dawn:  [{offset:'0%',color:'#2B3E5C'},{offset:'45%',color:'#7A90B0'},{offset:'72%',color:'#FFB6C1'},{offset:'100%',color:'#FFE4B5'}],
  day:   [{offset:'0%',color:'#4A90E2'},{offset:'65%',color:'#87CEEB'},{offset:'100%',color:'#E6F3FF'}],
  dusk:  [{offset:'0%',color:'#1F2937'},{offset:'60%',color:'#FF8C69'},{offset:'100%',color:'#FFA07A'}],
  night: [{offset:'0%',color:'#0a0e27'},{offset:'55%',color:'#1a1a3e'},{offset:'100%',color:'#16213e'}],
};

const CLIMATE: Record<string, { ground: string; paving: string; veg: string; accent: string; dust?: string }> = {
  [Climate.COLD]:        { ground:'#BFE6D7', paving:'#A9D4C7', veg:'#497C74', accent:'#78A3AD' },
  [Climate.TEMPERATE]:   { ground:'#A7E7B1', paving:'#8FD197', veg:'#1E9E57', accent:'#5BBF7F' },
  ['MEDITERRANEAN' as any]: { ground:'#C9E1AE', paving:'#B5CF9C', veg:'#2F8A56', accent:'#87AA63' },
  [Climate.ARID]:        { ground:'#D7C2A0', paving:'#C5AF8E', veg:'#7A6B44', accent:'#C89145', dust:'#C2A478' },
  [Climate.SEMITROPICAL]:{ ground:'#9DE7C2', paving:'#87D5AE', veg:'#239B79', accent:'#1F8473' },
  [Climate.TROPICAL]:    { ground:'#86E3C5', paving:'#6ECFB1', veg:'#066D57', accent:'#0C8F70' },
};

// gentle tone shifts
const TINT: Record<TOD, {l:number}> = { dawn:{l:6}, day:{l:0}, dusk:{l:-6}, night:{l:-12} };
const CLIMATE_SHIFT: Record<string,{l:number}> = {
  [Climate.COLD]:{l:-6}, [Climate.TEMPERATE]:{l:0}, MEDITERRANEAN:{l:2}, [Climate.ARID]:{l:2}, [Climate.SEMITROPICAL]:{l:2}, [Climate.TROPICAL]:{l:2},
};
const tone = (hex:string, tod:TOD, ck:string) => shade(hex, (TINT[tod]?.l ?? 0) + (CLIMATE_SHIFT[ck]?.l ?? 0));

/* ───────────────────────── Weather mapping ───────────────────────── */

type WeatherKind = 'clear' | 'rain' | 'snow' | 'sleet' | 'drizzle' | 'dust';
type LocalWeather = {
  kind: WeatherKind; wind: number; windDirDeg: number; wetness: number; precipitation: number;
  temp: number; cloudCover: number; visibility: number; special: WeatherState['special']; overcast: number; fx?: WeatherState['fx'];
};

const fromWeather = (w?: WeatherState | null, season?: Season | string, climate?: Climate | string, seed?: number): LocalWeather => {
  if (w) {
    const pxSpeed = 0.25 + (w.windSpeed / 80) * 1.25;
    const wet = typeof w.fx?.surfaceWetnessNow === 'number' ? clamp(w.fx.surfaceWetnessNow, 0, 1)
            : (w.precipitation === 'rain' || w.precipitation === 'drizzle') ? Math.min(1, 0.6 + (w.intensity || 0) * 0.6)
            : (w.precipitation === 'sleet' ? 0.35 : (w.precipitation === 'snow' ? 0.2 : 0));
    return {
      kind: (w.precipitation as WeatherKind) || 'clear',
      wind: pxSpeed, windDirDeg: w.windDirection ?? 0, wetness: wet,
      precipitation: w.intensity || 0, temp: w.temperature, cloudCover: w.cloudCover,
      visibility: w.visibility, special: w.special, overcast: w.cloudCover, fx: w.fx
    };
  }
  // synthetic fallback
  const r = new RNG((seed ?? 1) + 777);
  const s = String(season ?? '').toLowerCase();
  const c = String(climate ?? '').toLowerCase();
  let kind: WeatherKind = 'clear';
  const snowW = c.includes('cold') || s.includes('winter') ? 0.2 : 0.02;
  const rainW = c.includes('arid') ? 0.08 : c.includes('trop') ? 0.35 : 0.2;
  const dustW = c.includes('arid') ? 0.12 : 0.03;
  const rr = r.next();
  if (rr < snowW) kind = 'snow';
  else if (rr < snowW + rainW) kind = 'rain';
  else if (rr < snowW + rainW + dustW) kind = 'dust';
  const intensity = (kind === 'rain' || kind === 'snow') ? r.range(0.25, 0.8) : 0;
  return {
    kind,
    wind: 0.25 + r.range(0.1, 0.8),
    windDirDeg: r.range(0, 360),
    wetness: kind === 'rain' ? 0.6 + intensity * 0.4 : kind === 'snow' ? 0.2 : 0,
    precipitation: intensity,
    temp: s.includes('winter') ? r.range(-10,5) : s.includes('summer') ? r.range(20,35) : r.range(5,20),
    cloudCover: kind === 'clear' ? r.range(0.05, 0.4) : r.range(0.6, 1),
    visibility: 1,
    special: null,
    overcast: 0.5,
  };
};

/* ───────────────────────── Props ───────────────────────── */

interface RuinBannerProps {
  ruinName?: string;
  ruinAge?: string;
  tile: Tile;
  mapData?: MapData;
  width?: number;
  height?: number;
  ruinType?: string;
  ruinStyle?: string;
  ruinMaterial?: string;
  originalStructureType?: string;

  era?: HistoricalEra | string;
  culturalZone?: CulturalZone | string;
  climate?: Climate | string;
  season?: Season | string;
  timeOfDay?: TimeOfDay | string;
  seed?: number;
  weather?: WeatherState | null;
}

/* ───────────────────────── Component ───────────────────────── */

const RuinBanner: React.FC<RuinBannerProps> = ({
  tile,
  mapData,
  width = 1400,
  height = 144,
  ruinType,
  ruinStyle,
  ruinMaterial,
  originalStructureType,
  climate = (mapData as any)?.climate ?? Climate.TEMPERATE,
  season  = (mapData as any)?.season  ?? 'Spring',
  timeOfDay = 'Day',
  seed = (mapData as any)?.seed ?? 12345,
  weather,
}) => {
  /* Animation clock (rAF, throttled ~60–90ms) */
  const [frame, setFrame] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastStep = useRef<number>(0);
  const hiddenRef = useRef<boolean>(false);

  useEffect(() => {
    const onVis = () => { hiddenRef.current = (document.visibilityState === 'hidden'); };
    document.addEventListener('visibilitychange', onVis);
    const loop = (t: number) => {
      if (!hiddenRef.current && (t - lastStep.current > 70)) {
        setFrame(f => (f + 1) % 1_000_000);
        lastStep.current = t;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  /* Derived context */
  const tod = useMemo(() => toTOD(timeOfDay), [timeOfDay]);
  const rimSide = LEFT_RIM(tod);
  const climateKey = useMemo(() => (CLIMATE[String(climate)] ? String(climate) : Climate.TEMPERATE), [climate]);
  const palette = CLIMATE[climateKey];
  const horizonY = ipx(height * 0.62);
  const groundBand = ipx(Math.max(10, height * 0.12));
  const midRidgeY = ipx(horizonY + Math.max(3, height * 0.04));

  // Weather (live preferred)
  const W = useMemo<LocalWeather>(() => fromWeather(weather, season, climate, seed), [weather, season, climate, seed]);
  const fx = weather?.fx;

  /* ───────────── Stable RNG domains ───────────── */
  const geomKey = useMemo(() => {
    return `${seed}|${tile?.x},${tile?.y}|${ruinType ?? ''}|${ruinStyle ?? ''}|${ruinMaterial ?? ''}|${originalStructureType ?? ''}|${climateKey}|${tod}`;
  }, [seed, tile?.x, tile?.y, ruinType, ruinStyle, ruinMaterial, originalStructureType, climateKey, tod]);

  const seeds = useMemo(() => {
    const base = hash32(geomKey);
    const sub = (tag: string) => (hash32(`${base}|${tag}`) >>> 0) || 1;
    return {
      geom: sub('geom'),
      sky: sub('sky'),
      stars: sub('stars'),
      clouds: sub('clouds'),
      ground: sub('ground'),
      deco: sub('deco'),
      starEvent: sub('shooting'),
      veg: sub('veg'),
      birds: sub('birds'),
      bats: sub('bats'),
      fireflies: sub('fireflies'),
      puddles: sub('puddles'),
      drips: sub('drips'),
      shimmer: sub('shimmer'),
      decay: sub('decay'),
      rubble: sub('rubble'),
      holes: sub('holes'),
      growth: sub('growth'),
      animals: sub('animals'),
      perch: sub('perch'),
      // new domains
      path: sub('path'),
      setpiece: sub('setpiece'),
      tumble: sub('tumble'),
      parrot: sub('parrot'),
    };
  }, [geomKey]);

  /* ───────────────────────── Geometry ───────────────────────── */

  type Pix = { x: number; y: number; w: number; h: number; c: string };
  type LineCrack = { x1:number; y1:number; x2:number; y2:number };
  type VoidRect = { x:number; y:number; w:number; h:number };
  type RuinGeom = {
    blocks: Pix[];
    vines: Pix[];
    cracks: LineCrack[];
    rim: { x:number;y:number;w:number;h:number }[];
    width:number; baseY:number;
    mat:{base:string;light:string;dark:string;crack:string;accent:string};
    topEdges: {x:number;y:number;w:number}[];
    baseRect: {x:number;y:number;w:number;h:number};
    voids: VoidRect[];
    rubble: Pix[];
    perch: {x:number;y:number}[];
    growthTree?: {x:number;y:number;kind:'sprout'|'sapling'|'stub'};
    entrance: {x:number;y:number};
  };

  const ruinRef = useRef<RuinGeom | null>(null);

  const buildRuin = (): RuinGeom => {
    const r = new RNG(seeds.geom);
    const rDec = new RNG(seeds.decay);
    const rHole = new RNG(seeds.holes);
    const rRub = new RNG(seeds.rubble);
    const rGrow = new RNG(seeds.growth);

    const blocks: Pix[] = [];
    const vines: Pix[] = [];
    const cracks: LineCrack[] = [];
    const rim: RuinGeom['rim'] = [];
    const topEdges: RuinGeom['topEdges'] = [];
    const voids: VoidRect[] = [];
    const rubble: Pix[] = [];
    const perch: {x:number;y:number}[] = [];

    const MAT_BASE =
      (ruinMaterial || '').toLowerCase().includes('sand') ? '#d2b48c' :
      (ruinMaterial || '').toLowerCase().includes('adobe') ? '#c07f4a' :
      (ruinMaterial || '').toLowerCase().includes('brick') ? '#a94f3c' :
      (ruinMaterial || '').toLowerCase().includes('granite') ? '#8c99a6' :
      (ruinMaterial || '').toLowerCase().includes('basalt') ? '#3a3f43' :
      (ruinMaterial || '').toLowerCase().includes('marble') ? '#eceff3' :
      (ruinMaterial || '').toLowerCase().includes('wood') ? '#8B6F47' :
      (ruinMaterial || '').toLowerCase().includes('coral') ? '#FF7F50' :
      '#7a7a7a';
    const MAT = { base: MAT_BASE, light: shade(MAT_BASE, 20), dark: shade(MAT_BASE, -30), crack: shade(MAT_BASE, -60), accent: shade(MAT_BASE, 35) };

    const ruinWorldW = clamp(Math.floor(width * 0.12), 80, 160);
    const ruinCenterX = width * 0.5;
    const baseY = horizonY + 8 + r.int(-2, 2);
    const HtBase = r.int(26, 46);
    const x0 = ipx(ruinCenterX - ruinWorldW / 2);
    const y0 = baseY - HtBase;

    const addBlock = (x:number,y:number,w:number,h:number,c:string, recordTop=true) => {
      const px = ipx(x), py = ipx(y), pw = ipx(w), ph = ipx(h);
      blocks.push({ x: px, y: py, w: pw, h: ph, c });
      if (recordTop) topEdges.push({ x: px, y: py, w: pw });
    };
    const addVine  = (x:number,y:number,h:number) => vines.push({ x: ipx(x), y: ipx(y), w: 1, h: ipx(h), c: palette.veg });
    const addCrack = (x1:number,y1:number,x2:number,y2:number) => cracks.push({ x1: ipx(x1), y1: ipx(y1), x2: ipx(x2), y2: ipx(y2) });
    const addVoid  = (x:number,y:number,w:number,h:number) => voids.push({ x: ipx(x), y: ipx(y), w: ipx(w), h: ipx(h) });
    const addRubble = (x:number,y:number,w:number,h:number,c=MAT.dark) => rubble.push({ x: ipx(x), y: ipx(y), w: ipx(w), h: ipx(h), c });

    const typeStr = `${ruinType || ''} ${ruinStyle || ''} ${originalStructureType || ''}`.toLowerCase();
    const want = (k: string) => typeStr.includes(k);
    const kind = (() => {
      if (want('pyramid')) return 'pyramid';
      if (want('temple') && want('greek')) return 'greek_temple';
      if (want('temple') && want('maya')) return 'mayan_temple';
      if (want('castle') || want('fortress')) return 'castle';
      if (want('church') || want('cathedral')) return 'church';
      if (want('mosque') || want('minaret')) return 'mosque';
      if (want('pagoda')) return 'pagoda';
      if (want('palace')) return 'palace';
      if (want('mound') || want('earth')) return 'mound';
      if (want('aqueduct') || want('arch')) return 'arch';
      if (want('column') || want('pillar')) return 'columns';
      if (want('ziggurat')) return 'ziggurat';
      if (want('kiva') || want('ring')) return 'ring';
      if (want('longhouse')) return 'longhouse';
      if (want('cliff dwelling')) return 'cliff_dwelling';
      return r.pick(['stubs','columns','arch','steps']);
    })();

    // Global decay factors
    const ruinAgeFactor = 0.35 + (new RNG(seeds.decay).next() * 0.5);
    const heavyDamage = ruinAgeFactor > 0.6;

    const chipTop = (x:number,y:number,w:number, intensity=1) => {
      const segments = Math.max(2, Math.floor((w/6) * (0.6 + intensity)));
      for (let i=0;i<segments;i++){
        if (new RNG(seeds.holes + i*31).chance(0.4*intensity)) {
          const cx = x + i * (w/segments) + Math.random()*2;
          const cw = 1 + Math.random()*2;
          addVoid(cx, y, cw, 1);
        }
      }
    };
    const rubblePile = (x:number, width:number, base:number, density=1) => {
      const n = Math.floor(6 * density);
      for (let i=0;i<n;i++){
        const rx = x + new RNG(seeds.rubble + i*17).range(0, width);
        const rw = 1 + Math.random()*2;
        const rh = 1 + Math.random()*2;
        addRubble(rx, base - rh, rw, rh, shade(MAT.dark, (Math.random()*20-10)));
      }
    };

    // tree option
    const allowTree = (climateKey !== Climate.ARID) && (climateKey !== Climate.COLD || heavyDamage);
    const maybeTree = allowTree && new RNG(seeds.growth).chance(0.35 + ruinAgeFactor*0.3);

    // Build
    let Ht = HtBase;
    const xL = x0, xR = x0 + ruinWorldW;
    let entrance = { x: x0 + ruinWorldW/2, y: baseY-1 };

    if (kind === 'castle') {
      const towerW = 18;
      let leftH = Ht - 5;
      const decapLeft = new RNG(seeds.decay+1).chance(0.45 * ruinAgeFactor);
      if (decapLeft) leftH = Math.max(10, leftH - new RNG(seeds.decay+2).int(6, 14));
      addBlock(xL, y0 + (Ht - leftH), towerW, leftH, MAT.base);
      chipTop(xL, y0 + (Ht - leftH), towerW, decapLeft ? 1.2 : 0.4);
      for (let i = 0; i < 3; i++) if (!new RNG(seeds.decay+3+i).chance(0.35 * ruinAgeFactor))
        addBlock(xL + i * 6, y0 + (Ht - leftH) + 3, 4, 2, MAT.dark, false);

      let rightH = Ht - 5;
      const decapRight = new RNG(seeds.decay+7).chance(0.4 * ruinAgeFactor);
      if (decapRight) rightH = Math.max(10, rightH - new RNG(seeds.decay+8).int(4, 16));
      addBlock(xR - towerW, y0 + (Ht - rightH), towerW, rightH, MAT.base);
      chipTop(xR - towerW, y0 + (Ht - rightH), towerW, decapRight ? 1.1 : 0.4);
      for (let i = 0; i < 3; i++) if (!new RNG(seeds.decay+9+i).chance(0.4 * ruinAgeFactor))
        addBlock(xR - towerW + i * 6, y0 + (Ht - rightH) + 3, 4, 2, MAT.dark, false);

      const wallH = Ht * 0.7, wallTop = y0 + Ht - wallH, wallX = xL + towerW, wallW = ruinWorldW - towerW * 2;
      const breached = new RNG(seeds.decay+12).chance(0.55 * ruinAgeFactor);
      addBlock(wallX, wallTop, wallW, wallH, MAT.dark);
      const gateW = 14, gateH = 12;
      const gateShatter = new RNG(seeds.decay+13).chance(0.5 * ruinAgeFactor);
      if (!gateShatter) addBlock(x0 + ruinWorldW/2 - gateW/2, y0 + Ht - gateH, gateW, gateH, MAT.base, false);
      else { addVoid(x0 + ruinWorldW/2 - gateW/2, y0 + Ht - gateH, gateW, gateH); rubblePile(x0 + ruinWorldW/2 - gateW/2 - 6, gateW + 12, baseY, 1.4); }
      entrance = { x: x0 + ruinWorldW/2, y: baseY-1 };

      if (breached) {
        const gapW = new RNG(seeds.decay+14).int(10, 18);
        const gapX = wallX + new RNG(seeds.decay+15).int(4, Math.max(5, wallW - gapW - 4));
        const gapY = wallTop + new RNG(seeds.decay+16).int(6, Math.max(7, wallH - 8));
        addVoid(gapX, gapY, gapW, wallTop + wallH - gapY);
        rubblePile(gapX - 4, gapW + 8, baseY, 1.3);
      }
      addCrack(xL + 5, y0 + 10, xL + 15, y0 + Ht - 10);
      addCrack(xR - 15, y0 + 8, xR - 5, y0 + Ht - 8);
      if (new RNG(seeds.decay+20).chance(0.5)) addVine(xL + towerW + 5, wallTop, new RNG(seeds.decay+21).int(10, 20));
      perch.push({ x: xL + towerW/2, y: y0 + (Ht - leftH) + 2 });
      perch.push({ x: xR - towerW/2, y: y0 + (Ht - rightH) + 2 });

      if (maybeTree && breached) {
        const gx = (x0 + ruinWorldW/2) + new RNG(seeds.growth+1).int(-12, 12);
        const gy = wallTop + new RNG(seeds.growth+2).int(2, 4);
        const kind = new RNG(seeds.growth+3).chance(0.5) ? 'sapling' : 'sprout';
        return finalize({ blocks, vines, cracks, rim, width: ruinWorldW, baseY, mat: MAT, topEdges, baseRect: {x:x0,y:y0,w:ruinWorldW,h:Ht}, voids, rubble, perch, growthTree:{x:gx,y:gy,kind}, entrance });
      }

    } else if (kind === 'greek_temple') {
      const colCount = 5; const colW = 5;
      const colSpacing = (ruinWorldW - colW * 2) / (colCount - 1);
      const fallenIdx = new RNG(seeds.decay+30).chance(0.5*ruinAgeFactor) ? new RNG(seeds.decay+31).int(0, colCount-1) : -1;
      for (let i = 0; i < colCount; i++) {
        const px = x0 + colW/2 + i * colSpacing;
        const broken = new RNG(seeds.decay+40+i).chance(0.5 * ruinAgeFactor) || i === fallenIdx;
        const colH = broken ? new RNG(seeds.decay+50+i).int(Math.floor(Ht*0.35), Ht - 10) : Ht - 8;
        addBlock(px, y0 + Ht - colH, colW, colH, MAT.base);
        chipTop(px, y0 + Ht - colH, colW, broken ? 1.2 : 0.5);
        if (!broken) addBlock(px - 1, y0 + Ht - colH - 2, colW + 2, 2, MAT.light, false);
        if (broken) rubblePile(px-2, colW+4, baseY, 1.1);
        addBlock(px - 1, y0 + Ht - 2, colW + 2, 2, MAT.dark, false);
        if (new RNG(seeds.decay+60+i).chance(0.4)) addVine(px+1, y0 + Ht - colH + new RNG(seeds.decay+61+i).int(2, 8), new RNG(seeds.decay+62+i).int(6, 12));
      }
      const pedBreak = new RNG(seeds.decay+70).chance(0.6 * ruinAgeFactor);
      for (let i = 0; i < 7; i++) {
        if (pedBreak && i === 3) continue;
        const px = x0 + 10 + i * ((ruinWorldW - 20) / 6);
        const py = y0 + 3 - Math.abs(i - 3) * 1.5;
        addBlock(px, py, 8, 3, MAT.accent, false);
        if (pedBreak && i === 2) addVoid(px+7, py, 4, 3);
      }
      addBlock(x0 - 5, y0 + Ht, ruinWorldW + 10, 3, MAT.dark, false);
      perch.push({ x: x0 + ruinWorldW/2, y: y0 + 3 });
      entrance = { x: x0 + ruinWorldW/2, y: baseY-1 };

      if (maybeTree && pedBreak) {
        const gx = x0 + ruinWorldW/2 + new RNG(seeds.growth+4).int(-8, 8);
        const gy = y0 + 2;
        return finalize({ blocks, vines, cracks, rim, width: ruinWorldW, baseY, mat: MAT, topEdges, baseRect: {x:x0,y:y0,w:ruinWorldW,h:Ht}, voids, rubble, perch, growthTree:{x:gx,y:gy,kind:new RNG(seeds.growth+5).chance(0.6)?'sapling':'sprout'}, entrance });
      }

    } else if (kind === 'mayan_temple' || kind === 'pyramid') {
      const steps = kind === 'mayan_temple' ? 7 : 5;
      const stepFrag = new RNG(seeds.decay+80).chance(0.6 * ruinAgeFactor);
      for (let i = 0; i < steps; i++) {
        let stepW = ruinWorldW - i * (kind==='mayan_temple'?12:ruinWorldW/steps);
        const stepH = 4;
        const stepX = x0 + (ruinWorldW - stepW) / 2;
        const stepY = y0 + Ht - (i + 1) * stepH;
        if (stepFrag && new RNG(seeds.decay+81+i).chance(0.35) && i > 1) {
          const notch = new RNG(seeds.decay+82+i).int(6, Math.max(7, stepW/3));
          addBlock(stepX, stepY, stepW - notch, stepH, MAT.base);
          addVoid(stepX + stepW - notch, stepY, notch, stepH);
          rubblePile(stepX + stepW - notch - 6, notch + 8, baseY, 1.2);
        } else {
          addBlock(stepX, stepY, stepW, stepH, MAT.base);
        }
        if (i % 2 === 0 && i < steps - 1 && !stepFrag) addBlock(stepX + stepW/2 - 3, stepY - 1, 6, 1, MAT.accent, false);
      }
      const tW = 20;
      const topCollapse = new RNG(seeds.decay+90).chance(0.5 * ruinAgeFactor);
      if (!topCollapse) {
        addBlock(x0 + ruinWorldW/2 - tW/2, y0, tW, 8, MAT.dark);
        addBlock(x0 + ruinWorldW/2 - 3, y0 + 3, 6, 5, MAT.base, false);
      } else {
        addVoid(x0 + ruinWorldW/2 - tW/2, y0, tW, 8);
        rubblePile(x0 + ruinWorldW/2 - tW/2 - 6, tW + 12, baseY, 1.3);
      }
      addCrack(x0 + 8, y0 + Ht - 10, x0 + 20, y0 + Ht - 3);
      if (new RNG(seeds.decay+95).chance(0.5)) addVine(x0 + ruinWorldW - 20, y0 + 5, new RNG(seeds.decay+96).int(10, 18));
      perch.push({ x: x0 + ruinWorldW/2, y: y0 + 1 });
      entrance = { x: x0 + ruinWorldW/2, y: baseY-1 };

      if (maybeTree && topCollapse) {
        return finalize({ blocks, vines, cracks, rim, width: ruinWorldW, baseY, mat: MAT, topEdges, baseRect: {x:x0,y:y0,w:ruinWorldW,h:Ht}, voids, rubble, perch, growthTree:{x:x0 + ruinWorldW/2 + new RNG(seeds.growth+7).int(-4,4), y:y0+2, kind:'sapling'}, entrance });
      }

    } else if (kind === 'church') {
      const naveW = ruinWorldW * 0.6;
      let naveH = Ht * 0.7;
      const roofCave = new RNG(seeds.decay+100).chance(0.55 * ruinAgeFactor);
      if (roofCave) naveH -= new RNG(seeds.decay+101).int(3, 8);
      addBlock(x0 + (ruinWorldW - naveW)/2, y0 + Ht - naveH, naveW, naveH, MAT.base);
      const towerW = 16;
      const spireBroken = new RNG(seeds.decay+102).chance(0.6 * ruinAgeFactor);
      addBlock(x0 + ruinWorldW/2 - towerW/2, y0 + 5 + (spireBroken?4:0), towerW, Ht - 5 - (spireBroken?4:0), MAT.dark);
      const tiers = spireBroken ? 2 : 4;
      for (let i = 0; i < tiers; i++) {
        const spireW = towerW - i * 4;
        addBlock(x0 + ruinWorldW/2 - spireW/2, y0 + 3 - i * 2, spireW, 2, MAT.accent, false);
      }
      for (let i = 0; i < 3; i++) {
        const winX = x0 + (ruinWorldW - naveW)/2 + 5 + i * (naveW - 10)/3;
        const winY = y0 + Ht - naveH + 5;
        if (!new RNG(seeds.decay+110+i).chance(0.4 * ruinAgeFactor)) {
          addBlock(winX, winY, 3, 6, MAT.dark, false);
          addBlock(winX, winY - 1, 3, 2, MAT.accent, false);
        } else addVoid(winX, winY - 1, 3, 8);
      }
      addCrack(x0 + (ruinWorldW - naveW)/2 + 2, y0 + Ht - naveH + 3, x0 + (ruinWorldW - naveW)/2 + 12, y0 + Ht - 2);
      if (new RNG(seeds.decay+120).chance(0.5)) addVine(x0 + ruinWorldW/2 + towerW/2, y0 + 10, new RNG(seeds.decay+121).int(8, 15));
      chipTop(x0 + (ruinWorldW - naveW)/2, y0 + Ht - naveH, naveW, roofCave?1.3:0.5);
      if (roofCave) rubblePile(x0 + (ruinWorldW - naveW)/2, naveW, baseY, 1.4);
      perch.push({ x: x0 + ruinWorldW/2, y: y0 + 3 });
      entrance = { x: x0 + ruinWorldW/2, y: baseY-1 };

      if (maybeTree && roofCave) {
        const gx = x0 + ruinWorldW/2 + new RNG(seeds.growth+10).int(-10, 10);
        const gy = y0 + Ht - naveH + new RNG(seeds.growth+11).int(0, 2);
        return finalize({ blocks, vines, cracks, rim, width: ruinWorldW, baseY, mat: MAT, topEdges, baseRect:{x:x0,y:y0,w:ruinWorldW,h:Ht}, voids, rubble, perch, growthTree:{x:gx,y:gy,kind:new RNG(seeds.growth+12).chance(0.7)?'sapling':'sprout'}, entrance });
      }

    } else if (kind === 'arch') {
      const pierW = 12; let pierH = Ht - 6;
      const missKeystone = new RNG(seeds.decay+130).chance(0.6 * ruinAgeFactor);
      if (new RNG(seeds.decay+131).chance(0.4*ruinAgeFactor)) pierH -= new RNG(seeds.decay+132).int(2, 6);
      addBlock(x0 + 6, y0 + (Ht - pierH), pierW, pierH, MAT.base);
      addBlock(x0 + ruinWorldW - pierW - 6, y0 + (Ht - pierH), pierW, pierH, MAT.base);
      chipTop(x0 + 6, y0 + (Ht - pierH), pierW, 0.9);
      chipTop(x0 + ruinWorldW - pierW - 6, y0 + (Ht - pierH), pierW, 0.9);
      for (let i=0;i<9;i++){
        if (missKeystone && i===4) continue;
        const px = x0 + 18 + i*ipx((ruinWorldW-36)/8);
        const py = y0 + Ht - 10 - Math.sin((i/8)*Math.PI) * 10;
        addBlock(px, py, 4, 4, MAT.light, false);
      }
      if (missKeystone) {
        const kx = x0 + 18 + 4*ipx((ruinWorldW-36)/8);
        const ky = y0 + Ht - 10 - Math.sin((4/8)*Math.PI) * 10;
        addVoid(kx, ky, 4, 4);
        rubblePile(kx-6, 14, baseY, 1.1);
      }
      addCrack(x0+8, y0+Ht-8, x0+24, y0+Ht-2);
      if (new RNG(seeds.decay+140).chance(0.6)) addVine(x0 + new RNG(seeds.decay+141).int(12, ruinWorldW-12), y0 + new RNG(seeds.decay+142).int(4, 10), new RNG(seeds.decay+143).int(8, 16));
      perch.push({ x: x0 + ruinWorldW/2, y: y0 + Ht - 10 - Math.sin((4/8)*Math.PI) * 10 - 1 });
      entrance = { x: x0 + ruinWorldW/2, y: baseY-1 };

    } else {
      addBlock(x0 + 4, y0 + 8, 14, Ht-8, MAT.base);
      addBlock(x0 + ruinWorldW - 18, y0 + 8, 14, Ht-8, MAT.base);
      chipTop(x0 + 4, y0 + 8, 14, ruinAgeFactor);
      chipTop(x0 + ruinWorldW - 18, y0 + 8, 14, ruinAgeFactor);
      for (let i=0;i<5;i++){
        const px = x0 + 24 + i*ipx((ruinWorldW-48)/4);
        const py = y0 + Ht - 7 - Math.sin((i/4)*Math.PI) * 6;
        if (!new RNG(seeds.decay+160+i).chance(0.45*ruinAgeFactor)) addBlock(px, py, 2, 2, MAT.light, false);
      }
      if (new RNG(seeds.decay+170).chance(0.5)) rubblePile(x0 + 12, ruinWorldW-24, baseY, 1.0);
      entrance = { x: x0 + ruinWorldW/2, y: baseY-1 };
    }

    const rimX = rimSide === 'left' ? x0 - 1 : x0 + ruinWorldW;
    rim.push({ x: rimX, y: y0, w: 1, h: Ht });

    return finalize({ blocks, vines, cracks, rim, width: ruinWorldW, baseY, mat: MAT, topEdges, baseRect: {x:x0,y:y0,w:ruinWorldW,h:Ht}, voids, rubble, perch, entrance });

    function finalize(g: RuinGeom): RuinGeom {
      // extra random holes along top edges (only at edges; prevents "floating dots")
      if (heavyDamage) {
        for (const e of g.topEdges.slice(0, 10)) {
          if (new RNG(seeds.holes + e.x + e.y).chance(0.22))
            addVoid(e.x + new RNG(seeds.holes + e.w).int(0, Math.max(0,e.w-2)), e.y, 1, 1);
        }
      }
      // (Removed the old global “soot specks” that caused stray pixels.)
      return { ...g };
    }
  };

  if (!ruinRef.current) ruinRef.current = buildRuin();
  useEffect(() => { ruinRef.current = buildRuin(); }, [seeds.geom]); // rebuild when keys change
  const ruin = ruinRef.current!;

  /* Precomputed seeds (sky/ground/vegetation/critters) */
  type CloudSeed = { y:number; w:number; };
  const cloudsRef = useRef<CloudSeed[]>([]);
  const starsRef = useRef<{x:number;y:number;tw:number}[]>([]);
  const groundPatchesRef = useRef<{x:number;y:number;w:number}[]>([]);
  type Veg = { x:number; y:number; kind:'bush'|'pine'|'cypress'|'cactus'|'yucca'|'palm'|'scrub'|'olive'; phase:number };
  const vegRef = useRef<Veg[]>([]);
  type Bird = { y:number; speed:number; amp:number; phase:number };
  const birdsRef = useRef<Bird[]>([]);
  const batsRef = useRef<Bird[]>([]);
  const firefliesRef = useRef<{x:number;y:number;phase:number}[]>([]);
  const circlersRef = useRef<{cx:number;cy:number;rad:number;speed:number;kind:'buzzard'|'crow'}[]>([]);

  useEffect(() => {
    // clouds
    const cloudCount = (W.cloudCover > 0.75 ? 6 : W.cloudCover > 0.45 ? 4 : 2);
    const rC = new RNG(seeds.clouds);
    const arrC: CloudSeed[] = [];
    for (let i=0;i<cloudCount;i++) arrC.push({ y: rC.range(8, 30), w: rC.range(18, 28) });
    cloudsRef.current = arrC;

    // stars
    const rS = new RNG(seeds.stars);
    const arrS: {x:number;y:number;tw:number}[] = [];
    for (let i=0;i<24;i++) arrS.push({
      x: ipx(20 + (i*67 + (rS.int(0, 63))) % Math.max(20, width-40)),
      y: ipx(6 + (i*19 + rS.int(0, 37)) % 36),
      tw: rS.int(0, 10)
    });
    starsRef.current = arrS;

    // ground patches
    const rG = new RNG(seeds.ground);
    const patches: {x:number;y:number;w:number}[] = [];
    for (let i=0;i<Math.max(8, Math.floor(width/160)); i++){
      patches.push({
        x: ipx(rG.range(10, width-50)),
        y: ipx(horizonY + rG.range(8, Math.max(10, height - horizonY - groundBand - 12))),
        w: ipx(rG.range(18, 46)),
      });
    }
    groundPatchesRef.current = patches;

    // vegetation sprites
    const rv = new RNG(seeds.veg);
    const v: Veg[] = [];
    const slots = Math.max(6, Math.floor(width / 180));
    for (let i=0;i<slots;i++){
      const vx = ipx(rv.range(40, width-40));
      const vy = ipx(horizonY + rv.range(6, groundBand + 10));
      let kind: Veg['kind'] = 'scrub';
      if (climateKey === Climate.ARID) kind = rv.next() > 0.5 ? 'cactus' : 'yucca';
      else if (climateKey === Climate.TROPICAL || climateKey === Climate.SEMITROPICAL) kind = rv.next() > 0.6 ? 'palm' : 'bush';
      else if ('MEDITERRANEAN' === climateKey || String(climateKey).includes('MEDITERRANEAN')) kind = rv.next() > 0.6 ? 'olive' : 'cypress';
      else if (climateKey === Climate.COLD) kind = rv.next() > 0.5 ? 'pine' : 'scrub';
      else kind = rv.next() > 0.6 ? 'bush' : 'scrub';
      v.push({ x: vx, y: vy, kind, phase: rv.range(0, Math.PI*2) });
    }
    vegRef.current = v;

    // day birds
    const rb = new RNG(seeds.birds);
    const b: Bird[] = [];
    const nBirds = tod !== 'night' ? rb.int(1, 3) : 0;
    for (let i=0;i<nBirds;i++){
      b.push({ y: ipx(12 + rb.range(0, 24)), speed: 0.6 + rb.range(0.1, 0.4), amp: rb.range(1, 3), phase: rb.range(0, 1000) });
    }
    birdsRef.current = b;

    // bats (night)
    const rbt = new RNG(seeds.bats);
    const bt: Bird[] = [];
    const nBats = tod === 'night' ? rbt.int(2, 5) : 0;
    for (let i=0;i<nBats;i++){
      bt.push({ y: ipx(14 + rbt.range(0, 20)), speed: 0.7 + rbt.range(0.2, 0.6), amp: rbt.range(2, 5), phase: rbt.range(0, 1000) });
    }
    batsRef.current = bt;

    // fireflies
    const rff = new RNG(seeds.fireflies);
    const ff: {x:number;y:number;phase:number}[] = [];
    const ffOk = (tod === 'dusk' || tod === 'night') && (climateKey === Climate.TEMPERATE || climateKey === Climate.TROPICAL || climateKey === Climate.SEMITROPICAL);
    const nFF = ffOk ? rff.int(10, 20) : 0;
    for (let i=0;i<nFF;i++){
      ff.push({ x: ipx(rff.range(20, width-20)), y: ipx(horizonY + rff.range(6, groundBand+20)), phase: rff.range(0, Math.PI*2) });
    }
    firefliesRef.current = ff;

    // circling scavengers
    const rc = new RNG(seeds.perch);
    const kind = (climateKey === Climate.ARID || climateKey === (('MEDITERRANEAN' as any))) ? 'buzzard' : 'crow';
    const cx = ruin.baseRect.x + ruin.width/2 + rc.int(-12, 12);
    const cy = Math.max(6, ruin.baseRect.y - rc.int(6, 14));
    const rad = rc.range(10, 22);
    const speed = 0.4 + rc.range(0.05, 0.2);
    circlersRef.current = [{ cx, cy, rad, speed, kind }];
  }, [seeds.clouds, seeds.stars, seeds.ground, seeds.veg, seeds.birds, seeds.bats, seeds.fireflies, seeds.perch, width, height, horizonY, groundBand, W.cloudCover, tod, climateKey, ruin]);

  /* Snow “accumulation” easing */
  const snowAcc = useRef(0);
  useEffect(() => {
    const target = weather?.precipitation === 'snow' ? clamp((weather?.intensity ?? 0) * 0.9, 0, 0.9) : 0;
    snowAcc.current = snowAcc.current * 0.9 + target * 0.1;
  }, [frame, weather?.precipitation, weather?.intensity]);

  /* ───────────────────────── Sky ───────────────────────── */

  const renderSky = () => {
    const windRad = (W.windDirDeg ?? 0) * Math.PI / 180;
    const cx = Math.cos(windRad);
    const cloudOffset = (frame * (0.12 + W.wind*0.28) * cx) % (width + 200);
    const showStars = tod === 'night' && W.cloudCover < 0.7;

    const shootingLen = 1100;
    const shootingPhase = (seeds.starEvent % 500) + 200;
    const shooting = showStars && ((frame + shootingPhase) % shootingLen) < 35;

    return (
      <g>
        <defs>
          <linearGradient id={`ru_sky_${seeds.sky}`} x1="0%" y1="0%" x2="0%" y2="100%">
            {SKY[tod].map((s, i) => <stop key={i} offset={s.offset} stopColor={s.color} />)}
          </linearGradient>
          <linearGradient id={`ru_aurora_${seeds.sky}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(90,255,160,0.28)"/>
            <stop offset="50%" stopColor="rgba(120,180,255,0.22)"/>
            <stop offset="100%" stopColor="rgba(160,120,255,0.18)"/>
          </linearGradient>
        </defs>

        <rect x={0} y={0} width={width} height={horizonY} fill={`url(#ru_sky_${seeds.sky})`} />

        {/* Stars / Moon / Sun */}
        {tod === 'night'
          ? showStars && (
              <g>
                {starsRef.current.map((p, i) => {
                  const tw = ((frame + p.tw) % 40) < 20 ? 1 : 0.6;
                  return <rect key={i} x={p.x} y={p.y} width={1} height={1} fill="#F8F8FF" opacity={tw}/>;
                })}
                {shooting && (
                  <g opacity={0.9}>
                    <rect x={ipx(width - (frame % 35) * 10)} y={ipx(14 + (frame % 35) * 0.4)} width={3} height={1} fill="#FFFFFF"/>
                    <rect x={ipx(width - (frame % 35) * 10)+3} y={ipx(14 + (frame % 35) * 0.4)} width={6} height={1} fill="#FFFFFF" opacity={0.6}/>
                  </g>
                )}
              </g>
            )
          : <circle cx={width - 80} cy={20} r={10} fill={tod === 'dawn' ? '#FFD56A' : '#FFE07A'} />
        }

        {/* Clouds */}
        {cloudsRef.current.map((c, i) => {
          const x = -130 + cloudOffset + i * (width / (cloudsRef.current.length - 0.2));
          const alpha = clamp(0.35 + (W.cloudCover-0.4)*0.8, 0.15, 0.95);
          const bob = Math.sin((frame + i*31) * 0.02) * 1.2;
          return (
            <g key={i} opacity={tod==='night' ? alpha*0.7 : alpha} shapeRendering="crispEdges">
              <rect x={ipx(x)} y={ipx(c.y + bob)} width={c.w} height={c.w * 0.45} rx={4} fill="#F2F6FA" />
              <rect x={ipx(x + 9)} y={ipx(c.y - 2 + bob)} width={c.w + 6} height={c.w * 0.45} rx={4} fill="#F2F6FA" />
              <rect x={ipx(x + 5)} y={ipx(c.y + 4 + bob)} width={c.w - 6} height={c.w * 0.35} rx={3} fill="#EDF2F7" />
            </g>
          );
        })}

        {/* Aurora */}
        {tod==='night' && (climateKey===Climate.COLD) && (W.cloudCover < 0.35) && ((fx?.auroraProbability ?? 0.2) > 0.15) && (
          <g style={{ mixBlendMode: 'screen' }} opacity={Math.min(0.85, 0.3 + (fx?.auroraProbability ?? 0.25) * 0.8)}>
            <rect x={0} y={0} width={width} height={ipx(height*0.36)} fill={`url(#ru_aurora_${seeds.sky})`}/>
          </g>
        )}

        {/* Day birds / Night bats (no airborne shadow pixels anywhere) */}
        {tod !== 'night' && birdsRef.current.length > 0 && (
          <g fill="#1F2937" opacity={0.6}>
            {birdsRef.current.map((b, i) => {
              const t = (frame + i*100) * b.speed;
              const x = ipx((t % (width + 30)) - 30);
              const y = ipx(b.y + Math.sin((t + b.phase) * 0.04) * b.amp);
              return <path key={i} d={`M${x},${y} l3,1 l-3,1`} stroke="#1F2937" strokeWidth={1} fill="none" />;
            })}
          </g>
        )}
        {tod === 'night' && batsRef.current.length > 0 && (
          <g fill="#0B1026" opacity={0.65}>
            {batsRef.current.map((b, i) => {
              const t = (frame + i*80) * b.speed;
              const x = ipx(width - ((t % (width + 30))));
              const y = ipx(b.y + Math.sin((t + b.phase) * 0.08) * b.amp);
              return <path key={i} d={`M${x},${y} l2,1 l-2,1`} stroke="#0B1026" strokeWidth={1} fill="none" />;
            })}
          </g>
        )}

        {/* Circling scavenger */}
        {circlersRef.current.map((c, i) => {
          const ang = ((frame * c.speed) % 360) * Math.PI/180;
          const x = ipx(c.cx + Math.cos(ang) * c.rad);
          const y = ipx(c.cy + Math.sin(ang) * (c.rad*0.4));
          const stroke = c.kind === 'buzzard' ? '#2b1d10' : '#1F2937';
          return <path key={i} d={`M${x},${y} l3,1 l-3,1`} stroke={stroke} strokeWidth={1} fill="none" opacity={0.8} />;
        })}
      </g>
    );
  };

  /* ───────────────────────── Ground & textures ───────────────────────── */

  const renderGround = () => {
    const wet = W.wetness;
    const groundBase = tone(palette.ground, tod, climateKey);
    const pavingBase = tone(palette.paving, tod, climateKey);

    return (
      <g>
        <defs>
          <pattern id={`px_tundra_${seeds.ground}`} width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill={shade(groundBase,-4)}/>
            <rect x="1" y="0" width="1" height="1" fill={shade(groundBase,-12)}/>
            <rect x="3" y="2" width="1" height="1" fill={shade(groundBase,-12)}/>
          </pattern>
          <pattern id={`px_ripple_${seeds.ground}`} width="8" height="4" patternUnits="userSpaceOnUse">
            <rect width="8" height="4" fill={shade(groundBase,4)}/>
            <rect y="1" width="8" height="1" fill={shade(groundBase,-8)}/>
            <rect y="3" width="8" height="1" fill={shade(groundBase,-10)}/>
          </pattern>
          <pattern id={`px_scrub_${seeds.ground}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill={groundBase}/>
            <rect x="1" y="1" width="1" height="1" fill={shade(groundBase,-8)}/>
            <rect x="4" y="3" width="1" height="1" fill={shade(groundBase,-8)}/>
          </pattern>
          <pattern id={`px_pave_${seeds.ground}`} width="6" height="4" patternUnits="userSpaceOnUse">
            <rect width="6" height="4" fill={shade(pavingBase,-8)} />
            <rect x="2" y="1" width="1" height="1" fill={shade(pavingBase,-16)} />
            <rect x="5" y="3" width="1" height="1" fill={shade(pavingBase,-16)} />
          </pattern>
        </defs>

        {/* distant ridge */}
        <rect x={0} y={midRidgeY} width={width} height={2} fill={shade(groundBase, -18)} opacity={tod==='night'?0.25:0.35} />

        {/* main ground */}
        <rect
          x={0}
          y={horizonY}
          width={width}
          height={height - horizonY}
          fill={
            climateKey===Climate.COLD ? `url(#px_tundra_${seeds.ground})`
            : climateKey===Climate.ARID ? `url(#px_ripple_${seeds.ground})`
            : `url(#px_scrub_${seeds.ground})`
          }
        />

        {/* scattered tundra/scrub patches */}
        {(climateKey===Climate.COLD || climateKey===Climate.TEMPERATE) && groundPatchesRef.current.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={p.w} height={2} fill={shade(groundBase, climateKey===Climate.COLD?-14:-10)} opacity={0.6}/>
        ))}

        {/* paving band */}
        <rect x={0} y={height - groundBand} width={width} height={groundBand} fill={`url(#px_pave_${seeds.ground})`} />

        {/* wet gloss & puddles */}
        {wet > 0 && (
          <g opacity={0.12 + wet * 0.22}>
            <rect x={0} y={height - groundBand} width={width} height={groundBand} fill="#FFFFFF" />
            {[...Array(10)].map((_, i) => {
              const r = new RNG(seeds.puddles + i);
              const w = ipx(r.range(18, 56));
              const x = ipx((i * 91 + (seeds.ground % 7919)) % (width - w));
              const y = ipx(height - groundBand + 6 + (i * 7 % (groundBand - 12)));
              const shim = Math.sin((frame + i*17) * 0.06) * 1.5;
              return <rect key={i} x={x + shim} y={y} width={w} height={2} fill="#CFE9F9" opacity={0.35} />;
            })}
          </g>
        )}
      </g>
    );
  };

  /* ───────────────────────── Perspective path to entrance ───────────────────────── */

  const renderApproachPath = () => {
    const topX = ipx(ruin.entrance.x), topY = ipx(ruin.entrance.y);
    const topW = 10;
    const bottomW = Math.max(60, Math.floor(width*0.22));
    const cx = topX;
    const leftTop = cx - topW/2, rightTop = cx + topW/2;
    const leftBottom = cx - bottomW/2, rightBottom = cx + bottomW/2;
    const color = shade(palette.paving, 8);
    const edge = shade(palette.paving, -14);

    return (
      <g>
        <polygon
          points={`${leftTop},${topY} ${rightTop},${topY} ${rightBottom},${height} ${leftBottom},${height}`}
          fill={color} opacity={0.18}
        />
        {[...Array(16)].map((_,i)=>{
          const t=i/15, lx=ipx(leftTop + (leftBottom-leftTop)*t), rx=ipx(rightTop+(rightBottom-rightTop)*t);
          const yy=ipx(topY + (height-2-topY)*t);
          return (
            <g key={i}>
              <rect x={lx} y={yy} width={1} height={1} fill={edge} opacity={0.28}/>
              <rect x={rx} y={yy} width={1} height={1} fill={edge} opacity={0.28}/>
            </g>
          );
        })}
        {(W.wetness>0.35) && (
          <rect x={cx-1} y={topY} width={2} height={height-topY} fill="#FFFFFF" opacity={0.06 + W.wetness*0.08}/>
        )}
      </g>
    );
  };

  /* ───────────────────────── Growth tree sprite ───────────────────────── */

  const renderGrowthTree = () => {
    const g = ruin.growthTree;
    if (!g) return null;
    const sway = Math.sin(frame * (0.02 + W.wind*0.03)) * Math.min(1.5, 0.6 + W.wind*1.2);
    const x = ipx(g.x + sway);
    const y = ipx(g.y);
    const trunk = shade(palette.veg, -45);
    const leaf = palette.veg;
    if (g.kind === 'sprout') {
      return (
        <g opacity={0.95}>
          <rect x={x} y={y} width={1} height={2} fill={trunk}/>
          <rect x={x-1} y={y-1} width={3} height={1} fill={leaf}/>
        </g>
      );
    }
    return (
      <g opacity={0.95}>
        <rect x={x} y={y-3} width={1} height={3} fill={trunk}/>
        <rect x={x-1} y={y-4} width={3} height={2} fill={leaf}/>
        <rect x={x-2} y={y-3} width={1} height={1} fill={leaf}/>
        <rect x={x+2} y={y-3} width={1} height={1} fill={leaf}/>
      </g>
    );
  };

  /* ───────────────────────── Ruin ───────────────────────── */

  const renderRuin = () => {
    const rimColor = shade(ruin.mat.base, 30);
    const frostOpacity = snowAcc.current;
    const veryCold = W.temp < 0;
    const voidFill = tod==='night' ? '#0b0f20' : shade(ruin.mat.dark, -40);

    return (
      <g>
        <clipPath id={`ru_clip_${seeds.geom}`}>
          <rect x={ruin.baseRect.x-2} y={ruin.baseRect.y-2} width={ruin.baseRect.w+4} height={ruin.baseRect.h+4} />
        </clipPath>

        {/* blocks & frost */}
        {ruin.blocks.map((p, i) => (
          <g key={i}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={p.c} shapeRendering="crispEdges" />
            {p.h > 8 && [...Array(Math.max(1, Math.floor((p.h-4)/3)))].map((_,k)=>(
              <rect key={`course-${i}-${k}`} x={p.x} y={p.y+3+k*3} width={p.w} height={1} fill={shade(ruin.mat.base,-10)} />
            ))}
            {frostOpacity > 0.02 && <rect x={p.x} y={p.y} width={p.w} height={1} fill="#EAF5FF" opacity={0.5 * frostOpacity} />}
          </g>
        ))}

        {/* voids */}
        {ruin.voids.map((v, i) => (
          <rect key={i} x={v.x} y={v.y} width={v.w} height={v.h} fill={voidFill} opacity={0.95} />
        ))}

        {/* rubble */}
        {ruin.rubble.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill={p.c} />
        ))}

        {/* moss/ivy hint */}
        {ruin.topEdges.slice(0, 10).map((e, i) => (
          <rect key={i} x={e.x + (i%2)} y={e.y} width={Math.max(1, Math.min(6, e.w-1))} height={1} fill={shade(palette.veg, -10)} opacity={0.5}/>
        ))}

        {/* cracks */}
        {ruin.cracks.map((c, i) => (
          <polyline key={i}
            points={`${c.x1},${c.y1} ${ipx((c.x1 + c.x2)/2)},${ipx((c.y1 + c.y2)/2)} ${c.x2},${c.y2}`}
            stroke={ruin.mat.crack} strokeWidth={1} fill="none" opacity={0.9} shapeRendering="crispEdges" />
        ))}

        {/* vines swaying */}
        {(() => {
          const seasonS = String(season).toLowerCase();
          const lush =
            climateKey === Climate.TROPICAL || climateKey === Climate.SEMITROPICAL ||
            (climateKey === Climate.TEMPERATE && (seasonS.includes('spring') || seasonS.includes('summer')));
          const sparse =
            climateKey === Climate.ARID || (seasonS.includes('winter') && climateKey !== Climate.TROPICAL);
          const density = lush ? 1 : sparse ? 0.5 : 0.8;
          const wiggle = Math.sin(frame * (0.04 + W.wind * 0.05)) * (0.8 + W.wind * 0.6);
          return ruin.vines.map((v, i) => (
            <g key={i}>
              <rect x={v.x + wiggle} y={v.y} width={v.w} height={v.h * density} fill={palette.veg} opacity={0.95}/>
              <rect x={v.x + wiggle} y={v.y + v.h * density} width={1} height={1} fill={shade(palette.veg,-20)} opacity={0.9}/>
            </g>
          ));
        })()}

        {/* icicles */}
        {veryCold && W.wetness > 0.2 && ruin.topEdges.slice(0,6).map((e, i) => (
          <rect key={i} x={e.x + 1 + i*2} y={e.y + 1} width={1} height={1 + (i%2)} fill="#D9F0FF" opacity={0.8}/>
        ))}

        {/* rim light */}
        {ruin.rim.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={rimColor} opacity={tod==='night'?0.28:0.55} />)}

        {/* contact shadow under whole base */}
        <rect x={ruin.baseRect.x} y={ruin.baseY + 1} width={ruin.baseRect.w} height={2} fill="#000" opacity={0.15}/>

        {/* rain drips */}
        {weather && (weather.precipitation === 'rain' || weather.precipitation === 'drizzle') && (
          <g clipPath={`url(#ru_clip_${seeds.geom})`} opacity={0.8}>
            {[...Array(Math.floor(10 * clamp(weather.intensity ?? 0.5, 0.3, 1)))].map((_, i) => {
              const r = new RNG(seeds.drips + i);
              const ex = ipx(ruin.baseRect.x + r.range(2, ruin.baseRect.w - 4));
              const ey = ipx(ruin.baseRect.y + r.range(0, ruin.baseRect.h/2));
              const dy = (frame * (1.2 + (weather.intensity ?? 0.5)*2) + i*15) % (ruin.baseRect.h);
              return <rect key={i} x={ex} y={ey + dy} width={1} height={1} fill="#BFDFF7" />;
            })}
          </g>
        )}

        {/* heat shimmer (arid) */}
        {climateKey === Climate.ARID && tod === 'day' && W.cloudCover < 0.6 && (weather?.precipitation === 'none' || !weather) && (
          <g opacity={0.15} clipPath={`url(#ru_clip_${seeds.geom})`}>
            {[...Array(6)].map((_, i) => {
              const ph = (frame * 0.6 + i*47);
              const dx = Math.sin(ph * 0.05) * 2;
              return <rect key={i} x={ruin.baseRect.x - 2 + i* (ruin.baseRect.w/6)} y={ruin.baseRect.y} width={2} height={ruin.baseRect.h} fill="#FFF" opacity={0.2} transform={`translate(${dx},0)`}/>;
            })}
          </g>
        )}

        {/* sparkle glints */}
        {(tod !== 'night') && ruin.topEdges.slice(0, 4).map((e, i) => {
          const blink = ((frame + i*23) % 90) < 4;
          return blink ? <rect key={i} x={e.x + e.w - 1} y={e.y} width={1} height={1} fill="#FFFFFF" opacity={0.8}/> : null;
        })}

        {/* growth tree */}
        {renderGrowthTree()}
      </g>
    );
  };

  /* ───────────────────────── Atmosphere & particles ───────────────────────── */

  const renderAtmosphere = () => {
    const fogD = fx?.fogDensity ?? 0;
    const hazeD = fx?.hazeDensity ?? 0;
    return (
      <g style={{ mixBlendMode: 'soft-light', pointerEvents: 'none' }}>
        <rect x={0} y={0} width={width} height={height}
          fill={tod==='night' ? '#080b1a' : '#ffffff'}
          opacity={tod==='night' ? 0.10 : (tod==='dusk' ? 0.08 : 0.04)}
        />
        {(weather?.special==='fog' || fogD > 0.05 || weather?.special==='mist' || hazeD > 0.12) && (
          <g opacity={weather?.special==='fog' ? Math.max(0.22, fogD*0.8) : Math.max(0.14, hazeD*0.6)}>
            {[...Array(3)].map((_,i)=>(
              <rect key={i} x={horizonY - 10 < 0 ? 0 : 0} y={horizonY + i*12} width={width} height={10} fill="#DFE5EE"/>
            ))}
          </g>
        )}
      </g>
    );
  };

  /* ───────────────────────── Weather particles & critters ───────────────────────── */

  const renderParticlesAndCritters = () => {
    const wind = weather?.windSpeed ?? 0;
    const windDir = weather?.windDirection ?? 0;
    const windRad = windDir * Math.PI / 180;
    const windX = Math.cos(windRad) * wind;
    const intensity = clamp(weather?.intensity ?? 0, 0, 1);

    // RAIN/DRIZZLE
    if (weather && (weather.precipitation === 'rain' || weather.precipitation === 'drizzle')) {
      const sizeFactor = fx?.dropletSize ?? (weather.precipitation === 'drizzle' ? 0.25 : 0.7);
      const base = weather.precipitation === 'rain' ? 140 : 60;
      const count = Math.floor(intensity * base);
      const dropW = clamp(0.8 + sizeFactor * 2, 0.8, 3);
      const dropH = clamp(8 + sizeFactor * 16, 8, 24);
      const pxH = Math.max(2, Math.round((dropH / 24) * 5));
      const pxW = Math.max(1, Math.round((dropW / 3) * 1));
      const speedY = 3 + Math.min(5, intensity * 8);
      const driftX = Math.max(-4, Math.min(4, windX * 0.12));
      return (
        <g opacity={0.85}>
          {[...Array(count)].map((_,i)=>{
            const seedX = (i * 19 + (seeds.deco % 97)) % width;
            const seedY = (i * 31 + (seeds.deco % 53)) % (height - horizonY);
            const x = ipx((seedX + frame * driftX) % width);
            const y = ipx(horizonY + ((seedY + frame * speedY) % (height - horizonY)));
            return <rect key={i} x={x} y={y} width={pxW} height={pxH} fill="#BFDFF7"/>;
          })}
        </g>
      );
    }

    // SNOW
    if (weather && weather.precipitation === 'snow') {
      const flakeK = fx?.flakeSize ?? (0.3 + intensity * 0.7);
      const count = Math.floor(intensity * 110);
      const px = Math.max(1, Math.round((1 + flakeK * 3) / 2));
      const driftX = Math.max(-3, Math.min(3, windX * 0.08));
      const speedY = 1 + intensity * 1.5;
      return (
        <g opacity={0.95}>
          {[...Array(count)].map((_,i)=>{
            const sx = (i*23 + (seeds.deco % 1237)) % width;
            const sy = (i*17 + (seeds.deco % 881)) % (height - horizonY);
            const x = ipx((sx + frame * driftX) % width);
            const y = ipx(horizonY - 8 + ((sy + frame * speedY) % (height - horizonY)));
            return <rect key={i} x={x} y={y} width={px} height={px} fill="#FFFFFF"/>;
          })}
        </g>
      );
    }

    // Fireflies
    const fireflies = (tod === 'dusk' || tod === 'night') && firefliesRef.current.length;
    const fireflyLayer = fireflies ? (
      <g>
        {firefliesRef.current.map((f, i) => {
          const pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin((frame * 0.08) + f.phase));
          return <rect key={i} x={f.x} y={f.y} width={1} height={1} fill="#FFF7B0" opacity={pulse} />;
        })}
      </g>
    ) : null;

    // DUST (ARID clear)
    const dustLayer = (!weather || weather.precipitation === 'none' || (weather as any).precipitation === 'clear') && climateKey === Climate.ARID && W.cloudCover < 0.7 ? (
      <g opacity={0.35}>
        {[...Array(Math.floor(0.4 * 90))].map((_,i)=>{
          const s = (i*41 + (seeds.deco % 9973)) % width;
          const x = ipx((s + frame*(0.8 + Math.abs(windX) * 0.06)) % width);
          const y = ipx((horizonY + (height - horizonY) * (0.2 + ((i*13 + frame*0.3) % 40)/100)));
          return <rect key={i} x={x} y={y} width={1} height={1} fill={palette.dust ?? '#C2A478'}/>;
        })}
      </g>
    ) : null;

    // Ground scavenger: jackal/coyote (or fox if cold)
    const groundCritter = (() => {
      const rA = new RNG(seeds.animals);
      const period = 1400 + (seeds.animals % 800);
      const showFor = 230 + (seeds.animals % 80);
      const t = frame % period;
      if (t > showFor) return null;
      const speed = 1.2 + (seeds.animals % 13) * 0.02;
      const dirLeft = rA.chance(0.5);
      const x = dirLeft ? ipx(width - t*speed) : ipx(-20 + t*speed);
      const y = ipx(height - groundBand + 6);
      const step = Math.floor((t/10)) % 2;
      const desert = climateKey === Climate.ARID || String(climateKey).includes('MEDITERRANEAN');
      const cold = climateKey === Climate.COLD;
      const kind = desert ? 'jackal' : (cold ? 'fox' : 'coyote');
      return drawCanidSprite(kind, x, y, step, dirLeft);
    })();

    return <g>{fireflyLayer}{dustLayer}{groundCritter}</g>;

    function drawCanidSprite(kind:'jackal'|'coyote'|'fox', x:number, y:number, step:number, flip:boolean) {
      const body = kind==='jackal' ? '#6b4b2a' : kind==='fox' ? '#b25228' : '#5c4a39';
      const leg = shade(body, -30);
      const head = shade(body, 10);
      const dir = flip ? -1 : 1;
      return (
        <g transform={`translate(${x},${y}) scale(${dir},1)`} opacity={0.95}>
          <ellipse cx={3} cy={-1} rx={4} ry={1.1} fill="#000" opacity={0.12}/>
          <rect x={0} y={-5} width={6} height={3} fill={body} />
          <rect x={6} y={-6} width={2} height={2} fill={head} />
          <rect x={7} y={-7} width={1} height={1} fill={head} />
          <rect x={-1} y={-5} width={1} height={2} fill={body} />
          {step===0 ? (
            <>
              <rect x={1} y={-2} width={1} height={2} fill={leg}/>
              <rect x={4} y={-2} width={1} height={2} fill={leg}/>
            </>
          ) : (
            <>
              <rect x={2} y={-2} width={1} height={2} fill={leg}/>
              <rect x={5} y={-2} width={1} height={2} fill={leg}/>
            </>
          )}
        </g>
      );
    }
  };

  /* ───────────────────────── Foreground set-pieces (by climate) ───────────────────────── */

  // tiny pixel parrot with perch/fly states (ground-only shadow when flying)
  const ParrotSprite: React.FC<{x:number;y:number;flying?:boolean;phase?:number}> = ({x,y,flying=false,phase=0})=>{
    const flap = (Math.floor((frame+phase)/6)%4);
    const bob = flying ? 0 : (flap===1||flap===3 ? -1 : 0);
    const wingUp = flying && (flap===0 || flap===2);
    return (
      <g>
        {flying && <ellipse cx={x} cy={height - groundBand + 6} rx={4} ry={1.2} fill="#000" opacity={0.10}/>}
        <g transform={`translate(${x},${y + bob})`}>
          <rect x={-2} y={-1} width={6} height={3} fill="#0f5b5a"/>
          <rect x={4} y={-1} width={2} height={2} fill="#0f5b5a"/>
          <rect x={6} y={0} width={1} height={1} fill="#ffcc33"/>
          <rect x={3} y={-2} width={2} height={1} fill="#d62839"/>
          {flying ? (
            <>
              <rect x={-2} y={-3 - (wingUp?2:0)} width={3} height={2} fill="#0aa59a"/>
              <rect x={-1} y={ 2 + (wingUp?2:0)} width={4} height={1} fill="#0aa59a"/>
            </>
          ) : (
            <rect x={-1} y={1} width={4} height={1} fill="#0aa59a"/>
          )}
        </g>
      </g>
    );
  };

  const Tumbleweed: React.FC<{x:number;y:number;phase:number;scale?:number}> = ({x,y,phase,scale=1})=>{
    const rot = ((frame + phase) * 2.0) % 360;
    const g = shade(palette.dust ?? '#C2A478', -10);
    return (
      <g transform={`translate(${ipx(x)},${ipx(y)}) scale(${scale}) rotate(${rot})`}>
        <circle cx={0} cy={0} r={4} fill="none" stroke={g} strokeWidth={1}/>
        <rect x={-1} y={-4} width={2} height={8} fill={g} opacity={0.7}/>
        <rect x={-4} y={-1} width={8} height={2} fill={g} opacity={0.7}/>
        <rect x={-3} y={-3} width={6} height={1} fill={shade(g,-15)}/>
        <rect x={-3} y={2} width={6} height={1} fill={shade(g,-15)}/>
      </g>
    );
  };

  const renderForeground = () => {
    const leftX = ipx(width*0.12), rightX = ipx(width*0.86);
    const base = height - groundBand + 2;

    if (climateKey === Climate.ARID) {
      const tuft = (x:number)=>(
        <g key={`tuft-${x}`}>
          <rect x={x-2} y={base-1} width={1} height={2} fill={shade(palette.veg,-25)}/>
          <rect x={x}   y={base-2} width={1} height={3} fill={shade(palette.veg,-15)}/>
          <rect x={x+2} y={base-1} width={1} height={2} fill={shade(palette.veg,-25)}/>
        </g>
      );
      const windRad = (W.windDirDeg ?? 0) * Math.PI/180, dir = Math.cos(windRad) >= 0 ? 1 : -1;
      const speed = (0.6 + Math.min(1.5,W.wind*0.8));
      const tx = ((frame * speed) % (width + 40)) * dir;
      const x = dir>0 ? (-20 + tx) : (width + 20 + tx);
      const dusty = (W.kind==='dust' || climateKey===Climate.ARID);

      return (
        <g>
          {tuft(leftX-20)}{tuft(leftX+18)}{tuft(rightX-12)}
          <Tumbleweed x={x} y={height - groundBand + 6} phase={seeds.tumble} scale={1.1}/>
          {dusty && [...Array(18)].map((_,i)=>(
            <rect key={i} x={ipx(x - 8 + i)} y={ipx(height - groundBand + 4 + (i%3))} width={1} height={1} fill={palette.dust ?? '#C2A478'} opacity={0.18}/>
          ))}
        </g>
      );
    }

    if (climateKey === Climate.TROPICAL || climateKey === Climate.SEMITROPICAL) {
      const leaf = (x:number,y:number,w:number,h:number,c:string)=>(<rect x={x} y={y} width={w} height={h} fill={c}/>);
      const baseC = palette.veg, hi = shade(baseC,18), lo = shade(baseC,-18);
      const parrotPerch = { x: leftX+10, y: height - groundBand - 8 };
      const showFlyaway = ((Math.floor(frame) + (seeds.parrot%137)) % 900) < 60;

      return (
        <g>
          <g>
            {leaf(leftX-6, height - groundBand - 8, 2,8,lo)}
            {leaf(leftX-2, height - groundBand - 10,2,10,baseC)}
            {leaf(leftX+2, height - groundBand - 7, 2,7,hi)}
            {leaf(leftX+6, height - groundBand - 6, 2,6,baseC)}
            <rect x={leftX-8} y={height - groundBand + 1} width={18} height={1} fill="#000" opacity={0.18}/>
          </g>
          <g>
            <rect x={rightX-6} y={height - groundBand + 1} width={6} height={2} fill={shade(palette.paving,-18)}/>
            <rect x={rightX-10} y={height - groundBand + 2} width={3} height={1} fill={shade(palette.paving,-25)}/>
          </g>

          {showFlyaway
            ? <ParrotSprite x={leftX+20 + (frame%60)*2} y={height - groundBand - 18} flying phase={31}/>
            : <ParrotSprite x={parrotPerch.x} y={parrotPerch.y} />
          }
        </g>
      );
    }

    // Temperate & Med: shrubs + stones (and simple rocks in cold)
    const shrub=(x:number)=>(
      <g key={`sh-${x}`}>
        <rect x={x-2} y={height - groundBand - 4} width={5} height={4} fill={shade(palette.veg,-8)}/>
        <rect x={x-4} y={height - groundBand - 2} width={9} height={2} fill={shade(palette.veg,-16)}/>
        <rect x={x-5} y={height - groundBand + 1} width={11} height={1} fill="#000" opacity={0.12}/>
      </g>
    );
    return (
      <g>
        {shrub(leftX)}{shrub(rightX)}
        <rect x={rightX-8} y={height - groundBand + 1} width={6} height={2} fill={shade(palette.paving,-24)}/>
      </g>
    );
  };

  /* ───────────────────────── Render ───────────────────────── */

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ imageRendering: 'pixelated', display: 'block' }}
      role="img"
      aria-label={`Ruins banner: ${String(climate)} climate at ${timeOfDay}`}
    >
      {renderSky()}
      {renderGround()}
      {renderApproachPath()}
      {renderRuin()}
      {renderAtmosphere()}
      {renderParticlesAndCritters()}
      {renderForeground()}
    </svg>
  );
};

export default React.memo(RuinBanner);
