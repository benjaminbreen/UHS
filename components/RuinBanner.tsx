/**
 * components/RuinBanner.tsx
 * Transparent-sky RUIN banner composed over TimeAwareBackground (+ optional WeatherEffects).
 * - Sky/overcast/TOD via TimeAwareBackground (no sky painting here)
 * - Optional WeatherEffects (precip disabled to avoid duplication)
 * - Rich ruin generator (multiple archetypes) with vines/cracks/rubble/voids
 * - Faster/smoother critters (birds +50%, bats +50%, butterflies, fox/hare, lizard)
 * - Raindrop puddle gloss + splash rings; occasional ledge drips
 * - rAF ticker w/ reduced-motion, namescoped <defs>, lerped live weather
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
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const hexToRgb = (hex: string) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? {
        r: parseInt(m[1], 16),
        g: parseInt(m[2], 16),
        b: parseInt(m[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};
const rgbToHex = (r: number, g: number, b: number) =>
  '#' +
  [r, g, b]
    .map((v) => {
      const h = clamp(Math.round(v), 0, 255).toString(16);
      return h.length === 1 ? '0' + h : h;
    })
    .join('');
const shade = (hex: string, pct: number) => {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    r + (pct > 0 ? ((255 - r) * pct) / 100 : (r * pct) / 100),
    g + (pct > 0 ? ((255 - g) * pct) / 100 : (g * pct) / 100),
    b + (pct > 0 ? ((255 - b) * pct) / 100 : (b * pct) / 100)
  );
};

// hash → 32-bit unsigned
const hash32 = (s: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

class RNG {
  private s: number;
  constructor(seed = 1) {
    this.s = seed || 1;
  }
  next() {
    this.s = (this.s * 1664525 + 1013904223) >>> 0;
    return (this.s & 0xffffffff) / 0x100000000;
  }
  range(a: number, b: number) {
    return a + this.next() * (b - a);
  }
  int(a: number, b: number) {
    return Math.floor(this.range(a, b + 1));
  }
  pick<T>(arr: T[]) {
    return arr[Math.floor(this.next() * arr.length)]!;
  }
  chance(p: number) {
    return this.next() < p;
  }
}

type TOD = 'dawn' | 'day' | 'dusk' | 'night';
const toTOD = (t?: TimeOfDay | string): TOD => {
  const s = String(t ?? 'day').toLowerCase();
  if (s.startsWith('dawn') || s.startsWith('morn')) return 'dawn';
  if (s.startsWith('night')) return 'night';
  if (s.startsWith('dusk') || s.includes('even') || s.includes('twilight'))
    return 'dusk';
  return 'day';
};
const LEFT_RIM = (tod: TOD) =>
  tod === 'dusk' || tod === 'night' ? 'right' : 'left';

/* ───────────────────────── TimeAwareBackground adapters ───────────────────────── */
function toSeasonString(
  season?: Season | string | null
): 'spring' | 'summer' | 'fall' | 'winter' | null {
  if (!season) return null;
  const s = String(season).toLowerCase();
  if (s.startsWith('spr')) return 'spring';
  if (s.startsWith('sum')) return 'summer';
  if (s.startsWith('aut') || s.startsWith('fal')) return 'fall';
  if (s.startsWith('win')) return 'winter';
  return null;
}
function toClimateString(
  climate?: Climate | string | null
):
  | 'temperate'
  | 'tropical'
  | 'arid'
  | 'arctic'
  | 'mediterranean'
  | 'continental'
  | null {
  if (!climate) return null;
  const c = String(climate).toUpperCase();
  if (c.includes('TEMPERATE')) return 'temperate';
  if (c.includes('TROP')) return 'tropical';
  if (c.includes('SEMI')) return 'tropical';
  if (c.includes('ARID') || c.includes('DESERT')) return 'arid';
  if (c.includes('MEDITERRANEAN')) return 'mediterranean';
  if (c.includes('COLD') || c.includes('ARCTIC') || c.includes('POLAR'))
    return 'arctic';
  return 'continental';
}
function todToClock(tod: TOD) {
  if (tod === 'dawn') return { h: 6, m: 30 };
  if (tod === 'dusk') return { h: 19, m: 30 };
  if (tod === 'night') return { h: 23, m: 0 };
  return { h: 13, m: 0 };
}

/* ───────────────────────── Palettes ───────────────────────── */
const CLIMATE: Record<
  Climate | string,
  { ground: string; paving: string; veg: string; accent: string; dust?: string }
> = {
  [Climate.COLD]: {
    ground: '#BFE6D7',
    paving: '#A9D4C7',
    veg: '#497C74',
    accent: '#78A3AD',
  },
  [Climate.TEMPERATE]: {
    ground: '#A7E7B1',
    paving: '#8FD197',
    veg: '#1E9E57',
    accent: '#5BBF7F',
  },
  ['MEDITERRANEAN' as any]: {
    ground: '#C9E1AE',
    paving: '#B5CF9C',
    veg: '#2F8A56',
    accent: '#87AA63',
  },
  [Climate.ARID]: {
    ground: '#D7C2A0',
    paving: '#C5AF8E',
    veg: '#7A6B44',
    accent: '#C89145',
    dust: '#C2A478',
  },
  [Climate.SEMITROPICAL]: {
    ground: '#9DE7C2',
    paving: '#87D5AE',
    veg: '#239B79',
    accent: '#1F8473',
  },
  [Climate.TROPICAL]: {
    ground: '#86E3C5',
    paving: '#6ECFB1',
    veg: '#066D57',
    accent: '#0C8F70',
  },
};

/* ───────────────────────── Weather mapping & synthesis ───────────────────────── */
type WeatherKind = 'clear' | 'rain' | 'snow' | 'sleet' | 'drizzle' | 'dust';
interface LocalWeather {
  kind: WeatherKind;
  wind: number; // scalar for cloth/rustle
  windDirDeg: number;
  wetness: number; // 0..1
  precipitation: number; // density 0..1
  temp: number;
  cloudCover: number; // 0..1
  visibility: number; // 0..1
  special: WeatherState['special'];
  overcast: number; // alias for cloudCover
  fx?: WeatherState['fx'];
}
const fromWeather = (
  w?: WeatherState | null,
  season?: Season | string,
  climate?: Climate | string,
  seed?: number
): LocalWeather => {
  if (w) {
    const pxSpeed = 0.25 + (w.windSpeed / 80) * 1.25;
    const wet =
      typeof w.fx?.surfaceWetnessNow === 'number'
        ? clamp(w.fx.surfaceWetnessNow, 0, 1)
        : w.precipitation === 'rain' || w.precipitation === 'drizzle'
        ? Math.min(1, 0.6 + (w.intensity || 0) * 0.6)
        : w.precipitation === 'sleet'
        ? 0.35
        : w.precipitation === 'snow'
        ? 0.2
        : 0;
    return {
      kind: (w.precipitation as WeatherKind) || 'clear',
      wind: pxSpeed,
      windDirDeg: w.windDirection ?? 0,
      wetness: wet,
      precipitation: w.intensity || 0,
      temp: w.temperature,
      cloudCover: w.cloudCover,
      visibility: w.visibility,
      special: w.special,
      overcast: w.cloudCover,
      fx: w.fx,
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
  const intensity =
    kind === 'rain' || kind === 'snow' ? r.range(0.25, 0.8) : 0;
  return {
    kind,
    wind: 0.25 + r.range(0.1, 0.8),
    windDirDeg: r.range(0, 360),
    wetness: kind === 'rain' ? 0.6 + intensity * 0.4 : kind === 'snow' ? 0.2 : 0,
    precipitation: intensity,
    temp: s.includes('winter') ? r.range(-10, 5) : s.includes('summer') ? r.range(20, 35) : r.range(5, 20),
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

  /** Set false to skip WeatherEffects entirely (keeps pooled precip) */
  enableFxLayer?: boolean;
}

/* ───────────────────────── Component ───────────────────────── */
const RuinBanner: React.FC<RuinBannerProps> = ({
  tile,
  mapData,
  width = 1400,
  height = 160,
  ruinType,
  ruinStyle,
  ruinMaterial,
  originalStructureType,
  climate = (mapData as any)?.climate ?? Climate.TEMPERATE,
  season = (mapData as any)?.season ?? 'Spring',
  timeOfDay = 'Day',
  seed = (mapData as any)?.seed ?? 12345,
  weather,
  enableFxLayer = false,
}) => {
  const uid = useId();

  /* Reduced motion */
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    );
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  /* Animation clock (~30fps; paused when hidden) */
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const stepMs = reduced ? 66 : 33;
    const tick = (now: number) => {
      if (!document.hidden && now - last > stepMs) {
        setFrame((f) => (f + 1) % 1_000_000);
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  /* Derived context */
  const tod = useMemo(() => toTOD(timeOfDay), [timeOfDay]);
  const rimSide = LEFT_RIM(tod);
  const climateKey = useMemo(
    () => (CLIMATE[String(climate)] ? String(climate) : Climate.TEMPERATE),
    [climate]
  ) as keyof typeof CLIMATE;
  const palette = CLIMATE[climateKey];
  const horizonY = ipx(height * 0.62);
  const groundBand = ipx(Math.max(10, height * 0.12));

  /* Weather (live preferred) + smooth lerp */
  const targetW = useMemo<LocalWeather>(
    () => fromWeather(weather, season, climate, seed),
    [weather, season, climate, seed]
  );
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
        windDirDeg: lerp(cur.windDirDeg, tgt.windDirDeg, t * dt * 1),
        fx: tgt.fx,
      };
      lerpedWRef.current = lerped;
      requestAnimationFrame(animate);
    });
    return () => cancelAnimationFrame(id);
  }, [targetW, reduced]);

  /* RNG domains */
  const geomKey = useMemo(() => {
    const txy = `${tile?.x},${tile?.y}`;
    return `${seed}|${txy}|${ruinType ?? ''}|${ruinStyle ?? ''}|${
      ruinMaterial ?? ''
    }|${originalStructureType ?? ''}|${climateKey}|${tod}`;
  }, [
    seed,
    tile?.x,
    tile?.y,
    ruinType,
    ruinStyle,
    ruinMaterial,
    originalStructureType,
    climateKey,
    tod,
  ]);
  const seeds = useMemo(() => {
    const base = hash32(geomKey);
    const sub = (tag: string) => (hash32(`${base}|${tag}`) >>> 0) || 1;
    return {
      geom: sub('geom'),
      decay: sub('decay'),
      holes: sub('holes'),
      rubble: sub('rubble'),
      growth: sub('growth'),
      clouds: sub('clouds'),
      stars: sub('stars'),
      ground: sub('ground'),
      veg: sub('veg'),
      birds: sub('birds'),
      bats: sub('bats'),
      fireflies: sub('fireflies'),
      butterflies: sub('butterflies'),
      fox: sub('fox'),
      lizard: sub('lizard'),
      puddles: sub('puddles'),
      drips: sub('drips'),
      dustdevil: sub('dustdevil'),
    };
  }, [geomKey]);

  /* ───────────────────────── Ruin Geometry ───────────────────────── */
  type Pix = { x: number; y: number; w: number; h: number; c: string };
  type LineCrack = { x1: number; y1: number; x2: number; y2: number };
  type VoidRect = { x: number; y: number; w: number; h: number };
  type RuinGeom = {
    blocks: Pix[];
    vines: Pix[];
    cracks: LineCrack[];
    rim: { x: number; y: number; w: number; h: number }[];
    width: number;
    baseY: number;
    mat: { base: string; light: string; dark: string; crack: string; accent: string };
    topEdges: { x: number; y: number; w: number }[];
    baseRect: { x: number; y: number; w: number; h: number };
    voids: VoidRect[];
    rubble: Pix[];
    ledges: { x: number; y: number; w: number }[]; // for masking precip under overhangs
    entrance: { x: number; y: number };
  };

  const ruinRef = useRef<RuinGeom | null>(null);

  const buildRuin = (): RuinGeom => {
    const r = new RNG(seeds.geom);
    const blocks: Pix[] = [];
    const vines: Pix[] = [];
    const cracks: LineCrack[] = [];
    const rim: RuinGeom['rim'] = [];
    const topEdges: RuinGeom['topEdges'] = [];
    const voids: VoidRect[] = [];
    const rubble: Pix[] = [];
    const ledges: RuinGeom['ledges'] = [];

    // Material palette
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
    const MAT = {
      base: MAT_BASE,
      light: shade(MAT_BASE, 20),
      dark: shade(MAT_BASE, -30),
      crack: shade(MAT_BASE, -60),
      accent: shade(MAT_BASE, 35),
    };

    const ruinWorldW = clamp(Math.floor(width * 0.16), 100, 180);
    const ruinCenterX = width * 0.5;
    const baseY = horizonY + r.int(6, 10);
    const HtBase = r.int(30, 50);
    const x0 = ipx(ruinCenterX - ruinWorldW / 2);
    const y0 = baseY - HtBase;

    const addBlock = (
      x: number,
      y: number,
      w: number,
      h: number,
      c: string,
      recordTop = true
    ) => {
      const px = ipx(x),
        py = ipx(y),
        pw = ipx(w),
        ph = ipx(h);
      blocks.push({ x: px, y: py, w: pw, h: ph, c });
      if (recordTop) topEdges.push({ x: px, y: py, w: pw });
      // simple ledge detection (thin caps create an overhang for masking)
      if (ph <= 2) ledges.push({ x: px, y: py, w: pw });
    };
    const addVine = (x: number, y: number, h: number) =>
      vines.push({ x: ipx(x), y: ipx(y), w: 1, h: ipx(h), c: palette.veg });
    const addCrack = (x1: number, y1: number, x2: number, y2: number) =>
      cracks.push({ x1: ipx(x1), y1: ipx(y1), x2: ipx(x2), y2: ipx(y2) });
    const addVoid = (x: number, y: number, w: number, h: number) =>
      voids.push({ x: ipx(x), y: ipx(y), w: ipx(w), h: ipx(h) });
    const addRubble = (x: number, y: number, w: number, h: number, c = MAT.dark) =>
      rubble.push({ x: ipx(x), y: ipx(y), w: ipx(w), h: ipx(h), c });

    const typeStr = `${ruinType || ''} ${ruinStyle || ''} ${
      originalStructureType || ''
    }`.toLowerCase();
    const want = (k: string) => typeStr.includes(k);

    const kind =
      want('pyramid') ? 'pyramid' :
      (want('temple') && want('greek')) ? 'greek_temple' :
      (want('temple') && (want('maya') || want('step'))) ? 'mayan_temple' :
      (want('castle') || want('fortress')) ? 'castle' :
      (want('church') || want('cathedral')) ? 'church' :
      (want('mosque') || want('minaret')) ? 'mosque' :
      want('pagoda') ? 'pagoda' :
      want('ziggurat') ? 'ziggurat' :
      (want('kiva') || want('ring')) ? 'ring' :
      want('longhouse') ? 'longhouse' :
      want('cliff dwelling') ? 'cliff_dwelling' :
      (want('aqueduct') || want('arch')) ? 'arch' :
      want('columns') ? 'columns' :
      // fallback
      (['arch', 'columns', 'steps', 'stubs'] as const)[new RNG(seeds.decay).int(0, 3)];

    const ruinAgeFactor = 0.35 + new RNG(seeds.decay).next() * 0.5;
    const heavyDamage = ruinAgeFactor > 0.6;

    const chipTop = (x: number, y: number, w: number, intensity = 1) => {
      const segments = Math.max(2, Math.floor((w / 6) * (0.6 + intensity)));
      for (let i = 0; i < segments; i++) {
        if (new RNG(seeds.holes + i * 31).chance(0.4 * intensity)) {
          const cx = x + i * (w / segments) + Math.random() * 2;
          const cw = 1 + Math.random() * 2;
          addVoid(cx, y, cw, 1);
        }
      }
    };
    const rubblePile = (x: number, W: number, base: number, density = 1) => {
      const n = Math.floor(6 * density);
      for (let i = 0; i < n; i++) {
        const rx = x + new RNG(seeds.rubble + i * 17).range(0, W);
        const rw = 1 + Math.random() * 2;
        const rh = 1 + Math.random() * 2;
        addRubble(rx, base - rh, rw, rh, shade(MAT.dark, Math.random() * 20 - 10));
      }
    };

    let entrance = { x: x0 + ruinWorldW / 2, y: baseY - 1 };

    // Build a few archetypes (compact but flavorful)
    if (kind === 'castle') {
      const towerW = 18;
      let leftH = HtBase - 6;
      let rightH = HtBase - 8;
      if (new RNG(seeds.decay + 1).chance(0.5 * ruinAgeFactor)) leftH -= new RNG(seeds.decay + 2).int(4, 12);
      if (new RNG(seeds.decay + 3).chance(0.45 * ruinAgeFactor)) rightH -= new RNG(seeds.decay + 4).int(5, 13);
      // towers
      addBlock(x0, baseY - leftH, towerW, leftH, MAT.base);
      chipTop(x0, baseY - leftH, towerW, 1.0);
      addBlock(x0 + ruinWorldW - towerW, baseY - rightH, towerW, rightH, MAT.base);
      chipTop(x0 + ruinWorldW - towerW, baseY - rightH, towerW, 1.0);
      // wall
      const wallH = Math.floor(HtBase * 0.62);
      const wallX = x0 + towerW;
      const wallW = ruinWorldW - towerW * 2;
      addBlock(wallX, baseY - wallH, wallW, wallH, MAT.dark);
      // gate
      const gateW = 14,
        gateH = 12;
      if (new RNG(seeds.decay + 10).chance(0.55 * ruinAgeFactor)) {
        addVoid(x0 + ruinWorldW / 2 - gateW / 2, baseY - gateH, gateW, gateH);
        rubblePile(x0 + ruinWorldW / 2 - gateW / 2 - 6, gateW + 12, baseY, 1.4);
      } else {
        addBlock(x0 + ruinWorldW / 2 - gateW / 2, baseY - gateH, gateW, gateH, MAT.base, false);
      }
      // cracks & vines
      addCrack(x0 + 6, baseY - leftH + 3, x0 + 16, baseY - 8);
      if (new RNG(seeds.decay + 20).chance(0.45)) addVine(x0 + towerW + 5, baseY - wallH, new RNG(seeds.decay + 21).int(10, 20));
      // rim for light
      const rimX = rimSide === 'left' ? x0 - 1 : x0 + ruinWorldW;
      rim.push({ x: rimX, y: baseY - HtBase, w: 1, h: HtBase });
    } else if (kind === 'greek_temple') {
      const colCount = 6;
      const colW = 5;
      const colSpacing = (ruinWorldW - colW * 2) / (colCount - 1);
      for (let i = 0; i < colCount; i++) {
        const px = x0 + colW / 2 + i * colSpacing;
        const broken = new RNG(seeds.decay + 40 + i).chance(0.5 * ruinAgeFactor);
        const colH = broken ? new RNG(seeds.decay + 50 + i).int(Math.floor(HtBase * 0.35), HtBase - 10) : HtBase - 8;
        addBlock(px, baseY - colH, colW, colH, MAT.base);
        chipTop(px, baseY - colH, colW, broken ? 1.2 : 0.5);
        if (broken) rubblePile(px - 2, colW + 4, baseY, 1.0);
        addBlock(px - 1, baseY - 2, colW + 2, 2, MAT.dark, false);
      }
      // pediment
      for (let i = 0; i < 7; i++) {
        const px = x0 + 10 + i * ((ruinWorldW - 20) / 6);
        const py = y0 + 3 - Math.abs(i - 3) * 1.5;
        if (new RNG(seeds.decay + 71 + i).chance(0.2 * ruinAgeFactor)) continue;
        addBlock(px, py, 8, 3, MAT.accent, false);
      }
    } else if (kind === 'mayan_temple' || kind === 'pyramid' || kind === 'ziggurat') {
      const steps = kind === 'mayan_temple' ? 7 : kind === 'ziggurat' ? 5 : 4;
      for (let i = 0; i < steps; i++) {
        const stepW = ruinWorldW - i * Math.floor(ruinWorldW / (steps + 1));
        const stepH = 4;
        const stepX = x0 + (ruinWorldW - stepW) / 2;
        const stepY = baseY - (i + 1) * stepH;
        if (new RNG(seeds.decay + 80 + i).chance(0.35 * ruinAgeFactor) && i > 0) {
          const notch = new RNG(seeds.decay + 90 + i).int(4, Math.max(6, stepW / 3));
          addBlock(stepX, stepY, stepW - notch, stepH, MAT.base);
          addVoid(stepX + stepW - notch, stepY, notch, stepH);
          rubblePile(stepX + stepW - notch - 6, notch + 10, baseY, 1.2);
        } else {
          addBlock(stepX, stepY, stepW, stepH, MAT.base);
        }
        if (i % 2 === 0 && i < steps - 1)
          addBlock(stepX + stepW / 2 - 3, stepY - 1, 6, 1, MAT.accent, false);
      }
    } else if (kind === 'church') {
      const naveW = Math.floor(ruinWorldW * 0.62);
      let naveH = Math.floor(HtBase * 0.68);
      if (new RNG(seeds.decay + 100).chance(0.55 * ruinAgeFactor)) {
        naveH -= new RNG(seeds.decay + 101).int(3, 8);
      }
      addBlock(x0 + (ruinWorldW - naveW) / 2, baseY - naveH, naveW, naveH, MAT.base);
      const towerW = 16;
      addBlock(x0 + ruinWorldW / 2 - towerW / 2, y0 + 5, towerW, HtBase - 5, MAT.dark);
      for (let i = 0; i < 3; i++) {
        const winX = x0 + (ruinWorldW - naveW) / 2 + 5 + (i * (naveW - 10)) / 3;
        const winY = baseY - naveH + 5;
        if (!new RNG(seeds.decay + 110 + i).chance(0.5 * ruinAgeFactor)) {
          addBlock(winX, winY, 3, 6, MAT.dark, false);
          addBlock(winX, winY - 1, 3, 2, MAT.accent, false);
        } else addVoid(winX, winY - 1, 3, 8);
      }
      addCrack(x0 + (ruinWorldW - naveW) / 2 + 2, baseY - naveH + 3, x0 + (ruinWorldW - naveW) / 2 + 12, baseY - 2);
    } else if (kind === 'arch' || kind === 'columns' || kind === 'aqueduct') {
      const spans = kind === 'columns' ? 5 : 3;
      const spanW = Math.floor((ruinWorldW - 16) / spans);
      for (let i = 0; i < spans; i++) {
        const px = x0 + 8 + i * spanW;
        const broken = new RNG(seeds.decay + 130 + i).chance(0.5 * ruinAgeFactor);
        const h = broken ? new RNG(seeds.decay + 140 + i).int(Math.floor(HtBase * 0.45), HtBase - 8) : HtBase - 6;
        addBlock(px, baseY - h, 6, h, MAT.base);
        chipTop(px, baseY - h, 6, broken ? 1.1 : 0.6);
        if (kind !== 'columns') {
          // light arch cap
          addBlock(px + 4, baseY - h - 4, spanW - 8, 2, MAT.light, true);
        }
        if (broken) rubblePile(px - 2, 12, baseY, 1.0);
      }
    } else {
      // stubs / generic steps
      const stubCount = 4;
      for (let i = 0; i < stubCount; i++) {
        const w = new RNG(seeds.decay + i).int(10, 20);
        const h = new RNG(seeds.decay + i + 5).int(8, 16);
        const x = x0 + 6 + i * (Math.floor((ruinWorldW - 12) / stubCount));
        addBlock(x, baseY - h, w, h, MAT.base);
        chipTop(x, baseY - h, w, 0.8);
      }
    }

    // cap & base rect (for mask/lighting/ref)
    addBlock(x0 - 3, baseY, ruinWorldW + 6, 3, MAT.dark, false);
    const baseRect = { x: x0, y: baseY - HtBase, w: ruinWorldW, h: HtBase };

    // cracks & random vines
    for (let i = 0; i < 3; i++) {
      if (new RNG(seeds.decay + 200 + i).chance(0.6))
        addCrack(
          x0 + new RNG(seeds.decay + 210 + i).int(2, ruinWorldW - 6),
          baseY - new RNG(seeds.decay + 220 + i).int(6, HtBase - 6),
          x0 + new RNG(seeds.decay + 230 + i).int(2, ruinWorldW - 6),
          baseY - 2
        );
    }
    if (new RNG(seeds.decay + 260).chance(0.6))
      addVine(
        x0 + new RNG(seeds.decay + 261).int(8, ruinWorldW - 8),
        baseY - new RNG(seeds.decay + 262).int(10, HtBase - 6),
        new RNG(seeds.decay + 263).int(8, 18)
      );

    // small voids (missing stones)
    if (heavyDamage) {
      for (const e of topEdges.slice(0, 10)) {
        if (new RNG(seeds.holes + e.x + e.y).chance(0.2))
          addVoid(
            e.x + new RNG(seeds.holes + e.w).int(0, Math.max(0, e.w - 2)),
            e.y,
            1,
            1
          );
      }
    }

    return {
      blocks,
      vines,
      cracks,
      rim,
      width: ruinWorldW,
      baseY,
      mat: MAT,
      topEdges,
      baseRect,
      voids,
      rubble,
      ledges,
      entrance,
    };
  };

  if (!ruinRef.current) ruinRef.current = buildRuin();
  useEffect(() => {
    ruinRef.current = buildRuin();
  }, [seeds.geom]); // rebuild on key change

  const ruin = ruinRef.current!;

  /* ───────────────────────── Foreground & Critters ───────────────────────── */
  // puddles (positions + splash timers)
  const puddlesRef = useRef<{ x: number; y: number; w: number; t: number }[]>(
    []
  );
  useEffect(() => {
    const r = new RNG(seeds.puddles);
    const arr: { x: number; y: number; w: number; t: number }[] = [];
    const n = Math.max(4, Math.floor(width / 240));
    for (let i = 0; i < n; i++) {
      const w = r.range(30, 80);
      const x = ipx(r.range(20, width - 40 - w));
      const y = ipx(horizonY + r.range(14, Math.max(16, height - horizonY - groundBand - 20)));
      arr.push({ x, y, w: ipx(w), t: r.range(0, 1000) });
    }
    puddlesRef.current = arr;
  }, [width, height, horizonY, groundBand, seeds.puddles]);

  // birds / bats / butterflies (smoother + faster)
  type Flyer = { x: number; y: number; speed: number; amp: number; phase: number; dir: 1 | -1 };
  const birdsRef = useRef<Flyer[]>([]);
  const batsRef = useRef<Flyer[]>([]);
  const butterfliesRef = useRef<Flyer[]>([]);

  useEffect(() => {
    const W = lerpedWRef.current;
    const rb = new RNG(seeds.birds);
    const nBirds = tod !== 'night' ? rb.int(2, 4) : 0;
    const birds: Flyer[] = [];
    for (let i = 0; i < nBirds; i++) {
      birds.push({
        x: rb.range(10, width - 10),
        y: ipx(10 + rb.range(0, 22)),
        speed: (reduced ? 0.45 : 0.9) + rb.range(0.2, 0.7), // ~50% faster than older 0.6
        amp: rb.range(1.0, 3.0),
        phase: rb.range(0, 1000),
        dir: rb.next() > 0.5 ? 1 : -1,
      });
    }
    birdsRef.current = birds;

    const rbt = new RNG(seeds.bats);
    const nBats = tod === 'night' ? rbt.int(3, 6) : 0;
    const bats: Flyer[] = [];
    for (let i = 0; i < nBats; i++) {
      bats.push({
        x: rbt.range(10, width - 10),
        y: ipx(12 + rbt.range(0, 20)),
        speed: (reduced ? 0.5 : 1.05) + rbt.range(0.3, 0.7), // faster
        amp: rbt.range(2.0, 5.0),
        phase: rbt.range(0, 1000),
        dir: rbt.next() > 0.5 ? 1 : -1,
      });
    }
    batsRef.current = bats;

    const rbf = new RNG(seeds.butterflies);
    const nBut = tod === 'day' && W.cloudCover < 0.7 ? rbf.int(2, 5) : 0;
    const buts: Flyer[] = [];
    for (let i = 0; i < nBut; i++) {
      buts.push({
        x: rbf.range(20, width - 20),
        y: ipx(horizonY + rbf.range(6, groundBand + 12)),
        speed: (reduced ? 0.25 : 0.5) + rbf.range(0.1, 0.3),
        amp: rbf.range(2.0, 6.0),
        phase: rbf.range(0, 1000),
        dir: rbf.next() > 0.5 ? 1 : -1,
      });
    }
    butterfliesRef.current = buts;
  }, [width, horizonY, groundBand, tod, reduced, seeds.birds, seeds.bats, seeds.butterflies]);

  // ground critters: fox/hare & tiny lizard
  const foxRef = useRef<{ x: number; y: number; dir: 1 | -1; speed: number } | null>(null);
  const lizardRef = useRef<{ x: number; y: number; dir: 1 | -1; speed: number } | null>(null);
  useEffect(() => {
    const rf = new RNG(seeds.fox);
    foxRef.current =
      tod !== 'night' && rf.chance(0.6)
        ? {
            x: rf.range(20, width - 20),
            y: horizonY + groundBand - 6,
            dir: rf.next() > 0.5 ? 1 : -1,
            speed: (reduced ? 0.25 : 0.45) + rf.range(0.05, 0.2),
          }
        : null;
    const rl = new RNG(seeds.lizard);
    lizardRef.current =
      rl.chance(0.7)
        ? {
            x: rl.range(12, width - 12),
            y: horizonY + rl.range(2, Math.max(3, groundBand - 10)),
            dir: rl.next() > 0.5 ? 1 : -1,
            speed: (reduced ? 0.18 : 0.3) + rl.range(0.03, 0.08),
          }
        : null;
  }, [width, horizonY, groundBand, tod, reduced, seeds.fox, seeds.lizard]);

  /* ───────────────────────── Precipitation Pool (SVG, masked) ───────────────────────── */
  type Particle = { x: number; y: number; vx: number; vy: number; w: number; h: number; life?: number; maxLife?: number };
  class ParticlePoolSVG {
    private ns = 'http://www.w3.org/2000/svg';
    private nodes: SVGRectElement[] = [];
    private data: Particle[] = [];
    private active = 0;
    constructor(
      private parent: SVGGElement,
      private max: number,
      private baseFill: string,
      private width = 1,
      private height = 3,
      private opacity = 1
    ) {}
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
        d.x += d.vx;
        d.y += d.vy;
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
      rainPoolRef.current = null;
      sleetPoolRef.current = null;
      snowPoolRef.current = null;
    };
  }, [width, height, reduced]);

  useEffect(() => {
    const W = lerpedWRef.current;
    const windX = W.wind * 7;
    const rainCount = W.kind === 'rain' ? Math.round(90 * (W.precipitation || 0.4)) : 0;
    const drizzleCount = W.kind === 'drizzle' ? Math.round(50 * (W.precipitation || 0.2)) : 0;
    const sleetCount = W.kind === 'sleet' ? Math.round(70 * (W.precipitation || 0.35)) : 0;
    const snowCount = W.kind === 'snow' ? Math.round(40 * (W.precipitation || 0.4)) : 0;

    rainPoolRef.current?.setActive(rainCount + drizzleCount);
    sleetPoolRef.current?.setActive(sleetCount);
    snowPoolRef.current?.setActive(snowCount);

    for (let i = 0; i < rainCount + drizzleCount; i++) {
      const speed = reduced ? 2.2 : 3.6;
      rainPoolRef.current?.configure(i, {
        x: Math.random() * width,
        y: Math.random() * (height - horizonY) + horizonY,
        vx: windX * 0.25,
        vy: speed + Math.random() * 1.6,
        w: 1,
        h: i < drizzleCount ? 2 : 4,
      });
    }
    for (let i = 0; i < sleetCount; i++) {
      sleetPoolRef.current?.configure(i, {
        x: Math.random() * width,
        y: Math.random() * (height - horizonY) + horizonY,
        vx: windX * 0.25,
        vy: (reduced ? 2.0 : 3.0) + Math.random() * 1.2,
        w: 1,
        h: 3,
      });
    }
    for (let i = 0; i < snowCount; i++) {
      snowPoolRef.current?.configure(i, {
        x: Math.random() * width,
        y: Math.random() * (height - horizonY) + horizonY - 8,
        vx: windX * 0.12 + (Math.random() * 0.6 - 0.3),
        vy: (reduced ? 0.35 : 0.55) + Math.random() * 0.4,
        w: 1,
        h: 1,
        life: Math.floor(Math.random() * 60),
        maxLife: 150 + Math.floor(Math.random() * 120),
      });
    }
  }, [width, height, reduced, targetW]);

  useEffect(() => {
    let raf = 0;
    const step = () => {
      if (!document.hidden) {
        rainPoolRef.current?.step(width, height);
        sleetPoolRef.current?.step(width, height);
        snowPoolRef.current?.step(width, height);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [width, height]);

  /* ───────────────────────── Masks ───────────────────────── */
  const precipMaskId = `ruin_precip_mask_${uid}`;
  const dripClipId = `ruin_drip_clip_${uid}`;

  const buildPrecipMask = useCallback(() => {
    // white shows precip; black blocks precip (under overhangs/inside voids)
    return (
      <mask id={precipMaskId}>
        <rect x={0} y={0} width={width} height={height} fill="#fff" />
        {/* Interior voids */}
        {ruin.voids.map((v, i) => (
          <rect key={`v${i}`} x={v.x} y={v.y} width={v.w} height={v.h} fill="#000" />
        ))}
        {/* Under ledges: subtract a band beneath each ledge */}
        {ruin.ledges.map((l, i) => (
          <rect key={`l${i}`} x={l.x} y={l.y} width={l.w} height={8} fill="#000" />
        ))}
      </mask>
    );
  }, [width, height, ruin.voids, ruin.ledges]);

  /* ───────────────────────── Render helpers ───────────────────────── */
  const renderGround = () => {
    const W = lerpedWRef.current;
    const fxWetness = weather?.fx?.surfaceWetnessNow ?? null;
    const reduceGlossIfFx = fxWetness !== null;

    return (
      <g>
        {/* earth */}
        <rect x={0} y={horizonY} width={width} height={height - horizonY} fill={palette.ground} />
        {/* near paving band */}
        <rect
          x={0}
          y={ipx(height - groundBand)}
          width={width}
          height={groundBand}
          fill={shade(palette.paving, -10)}
          opacity={0.95}
        />
        {/* gloss/puddles */}
        {W.wetness > 0 && !reduceGlossIfFx && (
          <g opacity={(reduced ? 0.1 : 0.16) + W.wetness * 0.22}>
            <rect
              x={0}
              y={ipx(height - groundBand)}
              width={width}
              height={groundBand}
              fill="#FFFFFF"
              opacity={0.15}
            />
            {puddlesRef.current.map((p, i) => (
              <rect key={i} x={p.x} y={p.y} width={p.w} height={2} fill="#CFE9F9" opacity={0.38} />
            ))}
          </g>
        )}
      </g>
    );
  };

  const renderRuin = () => {
    const rimLeft = rimSide === 'left';
    return (
      <g>
        {/* base shadow line */}
        <rect x={ruin.baseRect.x} y={ruin.baseY - 1} width={ruin.baseRect.w} height={1} fill={shade(ruin.mat.dark, -25)} />
        {/* blocks */}
        {ruin.blocks.map((b, i) => (
          <rect key={`b${i}`} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.c} />
        ))}
        {/* ledge rim */}
        {ruin.ledges.map((l, i) => (
          <rect
            key={`lr${i}`}
            x={rimLeft ? l.x : l.x + l.w - 1}
            y={l.y}
            width={1}
            height={2}
            fill={shade(ruin.mat.light, 10)}
            opacity={tod === 'night' ? 0.35 : 0.8}
          />
        ))}
        {/* voids (holes) */}
        {ruin.voids.map((v, i) => (
          <rect key={`vo${i}`} x={v.x} y={v.y} width={v.w} height={v.h} fill="#0E0E0E" opacity={0.9} />
        ))}
        {/* vines */}
        {ruin.vines.map((v, i) => (
          <rect key={`vn${i}`} x={v.x} y={v.y} width={v.w} height={v.h} fill={shade(palette.veg, -8)} />
        ))}
        {/* cracks */}
        {ruin.cracks.map((c, i) => (
          <rect
            key={`ck${i}`}
            x={Math.min(c.x1, c.x2)}
            y={Math.min(c.y1, c.y2)}
            width={Math.max(1, Math.abs(c.x2 - c.x1))}
            height={1}
            fill={ruin.mat.crack}
            opacity={0.9}
          />
        ))}
        {/* rubble */}
        {ruin.rubble.map((r, i) => (
          <rect key={`rb${i}`} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.c} />
        ))}
      </g>
    );
  };

  const renderCritters = () => {
    const W = lerpedWRef.current;
    const flap = (p: number) => (Math.floor(p) % 4); // 4-frame flap

    return (
      <g>
        {/* birds (day/dusk/dawn) */}
        {birdsRef.current.map((b, i) => {
          const x = (b.x + b.dir * b.speed * (reduced ? 0.7 : 1.0) * (frame * 0.7)) % (width + 40);
          const xx = x < -20 ? x + width + 40 : x;
          const y = b.y + Math.sin((frame + b.phase) * 0.08) * b.amp;
          const f = flap(frame * 0.5 + i);
          return (
            <g key={`bd${i}`} transform={`translate(${xx}, ${y}) scale(${b.dir},1)`} opacity={tod === 'night' ? 0 : 1}>
              {/* simple 3-rect bird with animated wing */}
              <rect x={-3} y={0} width={6} height={1} fill="#1c1c1c" />
              <rect x={-2} y={-1 + (f === 1 ? -1 : f === 3 ? 1 : 0)} width={4} height={1} fill="#2a2a2a" />
              <rect x={3} y={0} width={2} height={1} fill="#444" />
            </g>
          );
        })}

        {/* bats (night) */}
        {batsRef.current.map((b, i) => {
          const x = (b.x + b.dir * b.speed * (frame * 0.7)) % (width + 40);
          const xx = x < -20 ? x + width + 40 : x;
          const y = b.y + Math.sin((frame + b.phase) * 0.1) * b.amp;
          const f = flap(frame * 0.6 + i);
          return (
            <g key={`bt${i}`} transform={`translate(${xx}, ${y}) scale(${b.dir},1)`} opacity={tod === 'night' ? 1 : 0}>
              <rect x={-2} y={0} width={4} height={1} fill="#0b0b0b" />
              <rect x={-4} y={-1 + (f === 1 ? -1 : f === 3 ? 1 : 0)} width={3} height={1} fill="#121212" />
              <rect x={1} y={-1 + (f === 1 ? -1 : f === 3 ? 1 : 0)} width={3} height={1} fill="#121212" />
            </g>
          );
        })}

        {/* butterflies (day, low altitude) */}
        {butterfliesRef.current.map((b, i) => {
          const x = (b.x + b.dir * b.speed * (frame * 0.6)) % (width + 40);
          const xx = x < -20 ? x + width + 40 : x;
          const y = b.y + Math.sin((frame + b.phase) * 0.12) * b.amp;
          return (
            <g key={`bf${i}`} transform={`translate(${xx}, ${y})`}>
              <rect x={-1} y={0} width={1} height={1} fill="#7a3a9e" />
              <rect x={0} y={0} width={1} height={1} fill="#ffb347" />
            </g>
          );
        })}

        {/* fox / hare */}
        {foxRef.current && (
          <g
            transform={`translate(${(foxRef.current.x +
              foxRef.current.dir * foxRef.current.speed * frame) %
              (width + 40)}, ${foxRef.current.y}) scale(${foxRef.current.dir},1)`}
          >
            <rect x={-4} y={-2} width={6} height={2} fill="#6b3a1a" />
            <rect x={2} y={-2} width={2} height={1} fill="#8a4a2a" />
            <rect x={-5} y={-1} width={1} height={1} fill="#000" />
          </g>
        )}

        {/* tiny lizard along stones */}
        {lizardRef.current && (
          <g
            transform={`translate(${(lizardRef.current.x +
              lizardRef.current.dir * lizardRef.current.speed * frame) %
              (width + 20)}, ${lizardRef.current.y}) scale(${lizardRef.current.dir},1)`}
            opacity={0.9}
          >
            <rect x={-2} y={0} width={3} height={1} fill="#3c5a3c" />
            <rect x={1} y={0} width={1} height={1} fill="#2e4d2e" />
          </g>
        )}
      </g>
    );
  };

  const renderPuddleSplashesAndDrips = () => {
    const W = lerpedWRef.current;
    if (!(W.kind === 'rain' || W.kind === 'drizzle' || W.kind === 'sleet')) return null;

    return (
      <g>
        {/* splash rings */}
        {puddlesRef.current.map((p, i) => {
          const t = (frame + i * 13) % 60;
          const on = t > 45; // intermittent
          if (!on) return null;
          const cx = p.x + (p.w * 0.2) + ((i * 17) % ipx(p.w * 0.6));
          const cy = p.y + 1;
          return (
            <g key={`sp${i}`} opacity={0.55}>
              <rect x={cx} y={cy} width={2} height={1} fill="#CFE9F9" />
              <rect x={cx - 1} y={cy + 1} width={4} height={1} fill="#D8EFFB" opacity={0.7} />
            </g>
          );
        })}

        {/* occasional drips from ledges */}
        {ruin.ledges.slice(0, 6).map((l, i) => {
          const phase = (frame + i * 37) % 120;
          if (phase < 116) return null;
          const x = l.x + 1 + ((i * 11) % Math.max(2, l.w - 2));
          const y = l.y + 1;
          return <rect key={`dp${i}`} x={x} y={y} width={1} height={3} fill="#BFDFF7" opacity={0.8} />;
        })}
      </g>
    );
  };

  const renderAtmosphere = () => {
    const W = lerpedWRef.current;
    const hasFxFog =
      !!weather?.fx?.fogDensity ||
      !!weather?.fx?.hazeDensity ||
      weather?.special === 'fog' ||
      weather?.special === 'mist';
    return (
      <g style={{ mixBlendMode: 'soft-light', pointerEvents: 'none' }}>
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={tod === 'night' ? '#080b1a' : '#ffffff'}
          opacity={tod === 'night' ? 0.08 : tod === 'dusk' ? 0.06 : 0.03}
        />
        {(W.kind === 'dust' || climateKey === Climate.ARID) && !weather?.fx?.airborneParticles && (
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill={palette.dust ?? '#C19A6B'}
            opacity={W.kind === 'dust' ? 0.08 + W.precipitation * 0.2 : 0.04}
          />
        )}
        {!hasFxFog && (W.special === 'fog' || W.special === 'mist') && (
          <g opacity={W.special === 'fog' ? 0.2 : 0.13}>
            {[...Array(3)].map((_, i) => (
              <rect key={i} x={0} y={horizonY + i * 14} width={width} height={12} fill="#DFE5EE" />
            ))}
          </g>
        )}
      </g>
    );
  };

  /* ───────────────────────── Compose with TimeAwareBackground ───────────────────────── */
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
      aria-label="Ruin banner"
    >
      {/* Underlying, transparent sky + lighting */}
      <TimeAwareBackground
        gameTimeHours={clockH}
        gameTimeMinutes={clockM}
        weather={weather ?? undefined}
        season={seasonStr}
        climate={climateStr}
      />

      {/* Optional FX (no precip here) */}
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
        <defs>
          {buildPrecipMask()}
          <clipPath id={dripClipId}>
            <rect x="0" y={horizonY} width={width} height={height - horizonY} />
          </clipPath>
        </defs>

        {/* layers */}
        {renderGround()}
        {renderRuin()}
        {renderAtmosphere()}

        {/* critters */}
        {renderCritters()}

        {/* precip particles masked under ledges/voids */}
        <g ref={precipGroupRef as any} mask={`url(#${precipMaskId})`} clipPath={`url(#${dripClipId})`} />

        {/* splash rings & drips when raining */}
        {renderPuddleSplashesAndDrips()}
      </svg>
    </div>
  );
};

export default React.memo(RuinBanner);
