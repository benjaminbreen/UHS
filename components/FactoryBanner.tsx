/**
 * components/FactoryBanner.tsx
 * Era and culture-specific factory/plantation/manufactory banner
 * - Stable seeded randomness (no wiggle)
 * - Era-specific factory types (plantation, manufactory, industrial, modern)
 * - Culture zone variations with appropriate worker appearances
 * - Historically accurate animated details
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';

interface FactoryBannerProps {
  width?: number;
  height?: number;
  climate?: string;
  season?: string;
  era?: string;
  culturalZone?: string;
  industryName?: string;
  isRuined?: boolean;
}

/* ----------------------- Seeded RNG & Helpers ----------------------- */

type RNG = { next(): number; range(min:number,max:number): number; pick<T>(a:T[]):T };
class SeededRandom implements RNG {
  private seed:number; constructor(seed:number){ this.seed=seed; }
  next(){ this.seed=(this.seed*9301+49297)%233280; return this.seed/233280; }
  range(min:number,max:number){ return min+this.next()*(max-min); }
  pick<T>(a:T[]){ return a[Math.floor(this.range(0,a.length))]; }
}
const hashSeed = (s:string) => { let h=2166136261>>>0; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619);} return (h%233279)+1; };

const clamp = (v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));

/* ----------------------- Aesthetic Constants ------------------------ */

const GROUND_Y = 110;         // match MiningColony
const SKY_H    = 105;         // taller sky (you asked for more sky)
const ZOOM     = 1.5;

const SKY_COLORS: Record<'dawn'|'day'|'dusk'|'night', string[]> = {
  dawn:['#FF9A8B','#A8E6CF','#FFD3BA'],
  day: ['#87CEEB','#98D8E8','#B8E6B8'],
  dusk:['#FF8C42','#FF6B6B','#C44569'],
  night:['#2C3E50','#34495E','#4A6741']
};
const todFromHour = (hour:number): 'dawn'|'day'|'dusk'|'night' => {
  if (hour < 6 || hour >= 21) return 'night';
  if (hour < 8) return 'dawn';
  if (hour >= 19 && hour < 21) return 'dusk';
  return 'day';
};

const groundPalette = (climate?:string, season?:string) => {
  const c=(climate||'temperate').toLowerCase(), s=(season||'').toLowerCase();
  if (s==='winter'){
    if (c==='cold') return {ground:'#F0F8FF', accent:'#C0D0E0'};
    if (c==='temperate') return {ground:'#E8F0F8', accent:'#B0C0D0'};
    if (c==='mediterranean') return {ground:'#86EFAC', accent:'#16A34A'};
  }
  if (c==='cold') return {ground:'#F0F8FF', accent:'#C0D0E0'};
  if (c==='arid') return {ground:'#D2B48C', accent:'#A0826D'};
  if (c==='mediterranean') return {ground:'#B4C5A0', accent:'#7A8060'};
  if (c==='tropical') return {ground:'#4A7C59', accent:'#047857'};
  if (c==='semitropical') return {ground:'#6EE7B7', accent:'#228B22'};
  return {ground:'#86EFAC', accent:'#16A34A'};
};

const parseEraYear = (era?:string) => {
  if (!era) return 1850;
  const e=era.toLowerCase();
  if (/^\d{3,4}$/.test(e)) return parseInt(e,10);
  if (e.includes('prehistoric')) return -5000;
  if (e.includes('ancient')) return -500;
  if (e.includes('medieval')) return 1200;
  if (e.includes('early modern')) return 1700; // Plantation era
  if (e.includes('industrial')) return 1850;
  if (e.includes('modern')) return 1960;
  return 1850;
};

// Determine factory type based on era
const getFactoryType = (era?: string, industryName?: string) => {
  const year = parseEraYear(era);
  const ind = (industryName || '').toLowerCase();
  
  if (year < 1000) return 'workshop'; // Ancient/medieval workshop
  if (year >= 1500 && year < 1800) {
    // Early modern period - plantations for agricultural products
    if (ind.includes('sugar') || ind.includes('coffee') || ind.includes('tobacco') || 
        ind.includes('cotton') || ind.includes('tea') || ind.includes('rubber')) {
      return 'plantation';
    }
    return 'manufactory'; // Pre-industrial manufacturing
  }
  if (year >= 1800 && year < 1900) return 'industrial';
  if (year >= 1900) return 'modern';
  return 'industrial';
};

// Get worker appearance based on culture zone and era
const getWorkerStyle = (culturalZone?: string, era?: string) => {
  const zone = (culturalZone || 'europe').toLowerCase();
  const year = parseEraYear(era);
  
  // Define skin tones and clothing based on zone
  const styles: Record<string, any> = {
    'africa': {
      skin: '#8B4513',
      hair: '#2F1B0C',
      clothing: year >= 1900 ? '#FF8C00' : '#F5DEB3', // Modern: safety orange, Historical: linen
      hat: year >= 1900 ? '#FFD700' : '#8B4513' // Modern: hard hat, Historical: straw/cloth
    },
    'mena': {
      skin: '#CD853F',
      hair: '#3B2F2F',
      clothing: year >= 1900 ? '#4169E1' : '#FAEBD7',
      hat: year >= 1900 ? '#FFD700' : '#DEB887' // Turban/headwrap colors
    },
    'asia': {
      skin: '#F4C490',
      hair: '#0C0404',
      clothing: year >= 1900 ? '#4169E1' : '#8FBC8F',
      hat: year >= 1900 ? '#FFD700' : '#D2691E' // Conical hat colors
    },
    'europe': {
      skin: '#FFD4B3',
      hair: '#8B7355',
      clothing: year >= 1900 ? '#4169E1' : '#708090',
      hat: year >= 1900 ? '#FFD700' : '#696969'
    },
    'americas': {
      skin: '#D2691E',
      hair: '#2F1B0C',
      clothing: year >= 1900 ? '#FF8C00' : '#DEB887',
      hat: year >= 1900 ? '#FFD700' : '#8B4513'
    },
    'oceania': {
      skin: '#8B4513',
      hair: '#2F1B0C',
      clothing: year >= 1900 ? '#FF8C00' : '#F5DEB3',
      hat: year >= 1900 ? '#FFD700' : '#D2691E'
    }
  };
  
  return styles[zone] || styles['europe'];
};

/* ----------------------- Industry Specs ----------------------------- */

type Spec = {
  chimneys: number;
  chimneyHeight: number;
  buildingHeight: number;
  roof: 'peaked'|'sawtooth'|'flat'|'curved'|'complex';
  smoke: string;
  // toggles
  hasBlast?: boolean;      // steel: blast furnaces / arc flashes
  hasWaterWheel?: boolean; // textile: water power annex
  hasTanks?: boolean;      // chemical: tanks
  hasConveyor?: boolean;   // auto: conveyors
  hasCleanRoom?: boolean;  // electronics: neon strips
  hasHangar?: boolean;     // aircraft
  hasCrane?: boolean;      // shipyard crane
  hasSlipway?: boolean;    // ship slipway
  hasTowers?: boolean;     // refinery towers + flare
  hasKiln?: boolean;       // glassworks/cement kilns
  hasDryers?: boolean;     // paper mill dryer cans
  hasBrew?: boolean;       // brewery: kettles & stack
  hasSawmill?: boolean;    // lumber: log deck & saw house
  hasFood?: boolean;       // food processing: silos & vents
};

const specFor = (industryName?:string): Spec => {
  const n=(industryName||'default').toLowerCase();
  const base: Spec = {
    chimneys:2, chimneyHeight:36, buildingHeight:34, roof:'peaked', smoke:'#5a5a5a'
  };
  if (n.includes('steel'))       return {...base, chimneys:3, chimneyHeight:50, buildingHeight:36, roof:'peaked', smoke:'#444', hasBlast:true};
  if (n.includes('textile'))     return {...base, chimneys:2, chimneyHeight:34, buildingHeight:30, roof:'sawtooth', smoke:'#666', hasWaterWheel:true};
  if (n.includes('chemical'))    return {...base, chimneys:3, chimneyHeight:42, buildingHeight:28, roof:'flat', smoke:'#5a5a3a', hasTanks:true};
  if (n.includes('auto')||n.includes('automobile')) return {...base, chimneys:1, chimneyHeight:30, buildingHeight:32, roof:'flat', hasConveyor:true};
  if (n.includes('electronic'))  return {...base, chimneys:1, chimneyHeight:26, buildingHeight:28, roof:'flat', hasCleanRoom:true};
  if (n.includes('aircraft'))    return {...base, chimneys:0, chimneyHeight:0, buildingHeight:44, roof:'curved', hasHangar:true};
  if (n.includes('ship'))        return {...base, chimneys:2, chimneyHeight:35, buildingHeight:30, roof:'flat', hasCrane:true, hasSlipway:true};
  if (n.includes('oil')||n.includes('refin')) return {...base, chimneys:5, chimneyHeight:52, buildingHeight:26, roof:'complex', smoke:'#2f2f2f', hasTowers:true};
  if (n.includes('glass'))       return {...base, chimneys:2, chimneyHeight:44, buildingHeight:30, roof:'peaked', hasKiln:true, smoke:'#494949'};
  if (n.includes('paper'))       return {...base, chimneys:2, chimneyHeight:34, buildingHeight:30, roof:'sawtooth', hasDryers:true, smoke:'#7a7a7a'};
  if (n.includes('cement'))      return {...base, chimneys:3, chimneyHeight:46, buildingHeight:28, roof:'flat', hasKiln:true, smoke:'#5b5b5b'};
  if (n.includes('brew')||n.includes('distill')) return {...base, chimneys:1, chimneyHeight:30, buildingHeight:28, roof:'peaked', hasBrew:true, smoke:'#6b6b6b'};
  if (n.includes('lumber')||n.includes('sawmill')) return {...base, chimneys:1, chimneyHeight:24, buildingHeight:28, roof:'peaked', hasSawmill:true, smoke:'#6b6b6b'};
  if (n.includes('food'))        return {...base, chimneys:1, chimneyHeight:28, buildingHeight:28, roof:'flat', hasFood:true, smoke:'#7a7a7a'};
  return base;
};

/* ----------------------- Component ---------------------------------- */

const FactoryBanner: React.FC<FactoryBannerProps> = ({
  width = 600,
  height = 250,
  climate = 'temperate',
  season = 'summer',
  era = 'industrial',
  culturalZone = 'europe',
  industryName = 'Steel Production',
  isRuined = false
}) => {
  const seed = useMemo(()=>hashSeed([width,height,climate,season,era,culturalZone,industryName].join('|')), [width,height,climate,season,era,culturalZone,industryName]);
  const rng = useMemo(()=>new SeededRandom(seed),[seed]);
  const staticRng = useMemo(()=>new SeededRandom(seed+777),[seed]);

  const [frame,setFrame] = useState(0);
  useEffect(()=>{ if(isRuined) return; const id=setInterval(()=>setFrame(f=>f+1),60); return ()=>clearInterval(id); },[isRuined]);

  const viewW=width/ZOOM, viewH=height/ZOOM, viewX=(width-viewW)/2, viewY=(height-viewH)/3;

  const year = parseEraYear(era);
  const factoryType = getFactoryType(era, industryName);
  const workerStyle = getWorkerStyle(culturalZone, era);
  const isPlantation = factoryType === 'plantation';
  const isWorkshop = factoryType === 'workshop';
  const isManufactory = factoryType === 'manufactory';
  const isIndustrial = factoryType === 'industrial';
  const isModern = factoryType === 'modern';
  const isEarly = isWorkshop || isManufactory || isPlantation || year < 1800;

  const tod = todFromHour(new Date().getHours());
  const sky = SKY_COLORS[tod];
  const pal = groundPalette(climate,season);

  /* ---------- Stable random scene caches (no wiggle) ---------- */
  const clouds=useRef<{x:number;y:number;w:number;}[]>([]);
  const stars =useRef<{x:number;y:number;}[]>([]);
  const pebbles=useRef<{x:number;y:number;w:number;h:number;}[]>([]);
  const skyline=useRef<{x:number;w:number;h:number;o:number;stack?:boolean;}[]>([]);
  const hills  =useRef<{x:number;w:number;h:number;o:number;color:string;}[]>([]);
  const windowPhase=useRef<number[]>([]);
  const neonPhase=useRef<number[]>([]);
  const sparkPhase=useRef<number[]>([]);

  if (!clouds.current.length) for(let i=0;i<6;i++) clouds.current.push({x:-90+i*150+staticRng.range(-18,18),y:18+staticRng.range(-8,8),w:staticRng.range(16,28)});
  if (tod==='night' && !stars.current.length) for(let i=0;i<28;i++) stars.current.push({x:staticRng.range(6,width-6),y:staticRng.range(6,88)});
  if (!pebbles.current.length){ const n=Math.floor(width/12); for(let i=0;i<n;i++) pebbles.current.push({x:i*12+staticRng.range(-3,3),y:GROUND_Y+staticRng.range(0,3),w:staticRng.range(2,4),h:staticRng.range(1,3)}); }
  if (!skyline.current.length){ const n=Math.floor(width/90)+2; for(let i=0;i<n;i++) skyline.current.push({x:i*(width/n)+staticRng.range(-24,24),w:staticRng.range(18,36),h:staticRng.range(14,30),o:staticRng.range(0.25,0.55),stack:staticRng.next()>0.6}); }
  if (!hills.current.length){ const n=Math.floor(width/140)+2; for(let i=0;i<n;i++) hills.current.push({x:i*(width/n)+staticRng.range(-30,30),w:staticRng.range(80,140),h:staticRng.range(18,34),o:0.25, color: rng.pick(['#8B9DC3','#6B8CAF','#4A6B8A'])}); }
  if (!windowPhase.current.length){ for(let i=0;i<60;i++) windowPhase.current.push(staticRng.range(0,Math.PI*2)); }
  if (!neonPhase.current.length){ for(let i=0;i<10;i++) neonPhase.current.push(staticRng.range(0,Math.PI*2)); }
  if (!sparkPhase.current.length){ for(let i=0;i<12;i++) sparkPhase.current.push(staticRng.range(0,Math.PI*2)); }

  /* --------------------------- Sky ---------------------------- */

  const renderSky=()=> {
    const cloudDrift=(frame*0.10)%(width+160);
    return (
      <g>
        <defs>
          <linearGradient id="sky_grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={sky[0]} /><stop offset="50%" stopColor={sky[1]} /><stop offset="100%" stopColor={sky[2]||sky[1]} />
          </linearGradient>
          <filter id="softGlow"><feGaussianBlur stdDeviation="1.2"/></filter>
        </defs>
        <rect x="0" y="0" width={width} height={SKY_H} fill="url(#sky_grad)" />
        {tod!=='night' ? <circle cx={width-40} cy={22} r={10} fill="#FFD700" opacity="0.95"/> :
          <g><circle cx={width-42} cy={20} r={7} fill="#F2F2F2"/><circle cx={width-42} cy={20} r={10} fill="#F2F2F2" opacity="0.15" filter="url(#softGlow)"/></g>}
        {hills.current.map((h,i)=><rect key={`hill-${i}`} x={h.x} y={SKY_H-h.h} width={h.w} height={h.h} fill={h.color} opacity={0.28}/>)}
        {tod==='night' && stars.current.map((s,i)=><rect key={i} x={s.x} y={s.y} width="1" height="1" fill="#fff" opacity="0.9" shapeRendering="crispEdges"/>)}
        {clouds.current.map((c,i)=>{ const x=c.x+cloudDrift-120; return (
          <g key={i} opacity={tod==='night'?0.35:0.8}>
            <rect x={x} y={c.y} width={c.w} height={c.w*0.45} rx="4" fill="#F1F5F9"/>
            <rect x={x+9} y={c.y-2} width={c.w+6} height={c.w*0.45} rx="4" fill="#F1F5F9"/>
            <rect x={x+5} y={c.y+4} width={c.w-6} height={c.w*0.35} rx="3" fill="#F1F5F9"/>
          </g>
        );})}
        {skyline.current.map((b,i)=><g key={i} opacity={b.o}><rect x={b.x} y={GROUND_Y-b.h} width={b.w} height={b.h} fill="#3a3a3a"/>{b.stack&&<rect x={b.x+b.w/2-1} y={GROUND_Y-b.h-10} width={2} height={10} fill="#2a2a2a"/>}</g>)}
      </g>
    );
  };

  /* -------------------------- Ground -------------------------- */

  const renderGround=()=>(
    <g>
      <defs>
        <linearGradient id="ground_grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={pal.ground} stopOpacity="1"/><stop offset="55%" stopColor={pal.ground} stopOpacity="0.96"/><stop offset="100%" stopColor={pal.accent} stopOpacity="0.92"/>
        </linearGradient>
      </defs>
      <rect x="0" y={GROUND_Y} width={width} height={height-GROUND_Y} fill="url(#ground_grad)"/>
      {pebbles.current.map((p,i)=><rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill="#756B5A" opacity="0.4"/>)}
    </g>
  );

  /* ----------------------- Track + Trains ---------------------- */

  const trackY = SKY_H + 2;

  const renderTrack=()=>(
    <g>
      <rect x="0" y={trackY} width={width} height="2" fill="#4A4A4A"/>
      <rect x="0" y={trackY+4} width={width} height="2" fill="#4A4A4A"/>
      {Array.from({length:Math.floor(width/20)}).map((_,i)=><rect key={i} x={i*20} y={trackY-1} width="3" height="10" fill="#654321"/>)}
      {isModern && <line x1="0" y1={trackY-6} x2={width} y2={trackY-6} stroke="#555" strokeWidth="1"/>}
    </g>
  );

  const renderTrain=()=>{
    // 40% chance to skip a train on any given render cycle (still deterministic per seed+frame loop)
    const appear = (Math.floor(frame/600) % 2) === 0; // periodic
    if (!appear) return null;

    const offsetSpeed = isEarly?0.4:isIndustrial?0.9:1.2;
    const t = ((frame * offsetSpeed) % (width+200)) - 200;
    const y = trackY;

    if (isWorkshop || isManufactory || isPlantation){
      // string of 2–3 hand carts
      const carts = 2 + (seed % 2);
      return (
        <g transform={`translate(${t},0)`}>
          {Array.from({length:carts}).map((_,k)=>{
            const dx = k*40;
            return (
              <g key={k}>
                <rect x={10+dx} y={y-2} width="24" height="6" fill="#8b4513"/>
                <circle cx={16+dx} cy={y+6} r="2" fill="#2a2a2a"/><circle cx={28+dx} cy={y+6} r="2" fill="#2a2a2a"/>
                {/* workers pumping handle */}
                <rect x={18+dx} y={y-8+Math.sin(frame*0.25+dx*0.02)*2} width="8" height="2" fill="#4a4a4a"/>
                <rect x={14+dx} y={y-12} width="2" height="8" fill="#2a2a2a"/><rect x={28+dx} y={y-12} width="2" height="8" fill="#2a2a2a"/>
              </g>
            );
          })}
        </g>
      );
    }

    if (isIndustrial){
      // steam loco + tender + several cars (ore/box)
      const cars = 2 + (seed % 3);
      return (
        <g transform={`translate(${t},0)`}>
          {/* locomotive */}
          <rect x="10" y={y-10} width="30" height="10" fill="#2f2f2f"/>
          <rect x="28" y={y-16} width="12" height="6" fill="#3a3a3a"/>
          <circle cx="16" cy={y+6} r="3" fill="#1c1c1c"/><circle cx="24" cy={y+6} r="3" fill="#1c1c1c"/><circle cx="32" cy={y+6} r="3" fill="#1c1c1c"/>
          {/* smoke */}
          <ellipse cx={30} cy={y-18-((frame*0.6)%20)} rx="4" ry="6" fill="#666" opacity="0.6"/>
          <ellipse cx={34} cy={y-24-((frame*0.6)%20)} rx="5" ry="7" fill="#666" opacity="0.4"/>
          {/* tender */}
          <rect x="44" y={y-8} width="26" height="8" fill="#444"/><circle cx="50" cy={y+6} r="2.5" fill="#1c1c1c"/><circle cx="62" cy={y+6} r="2.5" fill="#1c1c1c"/>
          {/* cars */}
          {Array.from({length:cars}).map((_,i)=>(
            <g key={i}>
              <rect x={72+i*30} y={y-8} width="28" height="8" fill={i%2===0?'#5a5a5a':'#6b4a3e'}/>
              <circle cx={78+i*30} cy={y+6} r="2.5" fill="#1c1c1c"/><circle cx={90+i*30} cy={y+6} r="2.5" fill="#1c1c1c"/>
            </g>
          ))}
        </g>
      );
    }

    // Modern electric multiple unit
    const cars = 3 + (seed % 2);
    return (
      <g transform={`translate(${t},0)`}>
        {Array.from({length:cars}).map((_,i)=>{
          const dx = 10 + i*56;
          return (
            <g key={i}>
              <rect x={dx} y={y-8} width="52" height="8" fill="#3c5568"/>
              {i===0 && <>
                <rect x={dx+4} y={y-12} width="12" height="4" fill="#4b6b84"/>{/* cab */}
                <rect x={dx+24} y={y-11} width="12" height="3" fill="#4b6b84"/>{/* pantograph base */}
                <polygon points={`${dx+30},${y-11} ${dx+26},${y-16} ${dx+34},${y-16}`} fill="#666"/>
              </>}
              {[dx+12,dx+26,dx+40,dx+52].map((wx,j)=><circle key={j} cx={wx} cy={y+6} r="2.2" fill="#1c1c1c"/>)}
              {tod==='night' && <rect x={dx+8} y={y-6} width="36" height="3" fill="#FFF49A" opacity="0.6"/>}
            </g>
          );
        })}
      </g>
    );
  };

  /* -------------------- Windows / Lighting --------------------- */

  const renderWindows = (x:number,y:number,w:number,rowYs:number[])=>{
    const cols = Math.max(6, Math.floor((w-10)/10));
    const colW = Math.min(10, Math.max(8, (w-10)/cols));
    const lightOn = tod==='night' && !isRuined;
    const electric = lightOn && (isIndustrial || isModern);
    const torch = lightOn && !electric;
    return (
      <g>
        <filter id="wGlow"><feGaussianBlur stdDeviation="1.2"/></filter>
        {rowYs.map((ry,ri)=>Array.from({length:cols}).map((_,ci)=>{
          const wx=x+5+ci*colW, wy=y+ry, idx=(ri*cols+ci)%windowPhase.current.length, ph=windowPhase.current[idx];
          const alpha = lightOn ? (electric ? 0.7+0.25*Math.sin(frame*0.12+ph) : 0.65+0.25*Math.sin(frame*0.18+ph)) : 0.9;
          const fill = lightOn ? (electric ? '#FFF49A' : '#FFB35A') : '#87CEEB';
          return (
            <g key={`${ri}-${ci}`}>
              <rect x={wx} y={wy} width={colW-2} height={6} fill={isRuined?'#1a1a1a':fill} opacity={isRuined?1:alpha}/>
              {lightOn && <rect x={wx-1} y={wy-1} width={colW} height={8} fill={electric?'#FFF49A':'#FF9B4A'} opacity="0.25" filter="url(#wGlow)"/>}
              {torch && <polygon points={`${wx+colW/2},${wy+3} ${wx+colW/2-1},${wy+6} ${wx+colW/2+1},${wy+6}`} fill="#FF7A2A" opacity="0.8"/>}
            </g>
          );
        }))}
      </g>
    );
  };

  /* ------------------ Factory Core + Extras -------------------- */

  const spec = useMemo(()=>specFor(industryName),[industryName]);

  const BrickDef = () => (
    <defs>
      <pattern id="brick" x="0" y="0" width="8" height="4" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="8" height="2" fill={isRuined?'#555':'#8b4513'}/>
        <rect x="0" y="2" width="8" height="2" fill={isRuined?'#444':'#a0522d'}/>
      </pattern>
      <pattern id="sheet" x="0" y="0" width="6" height="4" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="6" height="4" fill="#5b646b"/>
        <rect x="0" y="1.5" width="6" height="1" fill="#4a535a" />
      </pattern>
    </defs>
  );

  const Smoke: React.FC<{x:number; yTop:number; col:string; dense?:boolean}> = ({x,yTop,col,dense})=>(
    <>
      <ellipse cx={x} cy={yTop - ((frame*0.6)%80)} rx={4} ry={6} fill={col} opacity={dense?0.6:0.45}/>
      <ellipse cx={x} cy={yTop - ((frame*0.6+12)%80)} rx={5} ry={8} fill={col} opacity={dense?0.45:0.35}/>
      <ellipse cx={x} cy={yTop - ((frame*0.6+24)%80)} rx={6} ry={10} fill={col} opacity={dense?0.3:0.2}/>
    </>
  );

  const ArcFlash: React.FC<{x:number;y:number;phase:number}> = ({x,y,phase})=>{
    const p = 0.5+0.5*Math.sin(frame*0.35+phase);
    return <rect x={x} y={y} width="10" height="6" fill="#9EF2FF" opacity={0.15+0.55*p}/>;
  };

  const WeldSpark: React.FC<{x:number;y:number;phase:number}> = ({x,y,phase})=>{
    const p = Math.max(0,Math.sin(frame*0.4+phase));
    return (
      <>
        <rect x={x} y={y} width="2" height="2" fill="#FFF49A" opacity={0.3+0.5*p}/>
        <rect x={x+2} y={y+1} width="1" height="1" fill="#FFD36E" opacity={0.3*p}/>
      </>
    );
  };

  // Animated workers
  const renderWorker = (x: number, y: number, action: 'walk' | 'carry' | 'work', index: number) => {
    const bobPhase = Math.sin(frame * 0.15 + index * 0.5) * 2;
    const walkPhase = (frame * 2 + index * 30) % 60;
    const isWalking = action === 'walk';
    const legOffset = isWalking ? Math.sin(walkPhase * 0.2) * 3 : 0;
    
    return (
      <g transform={`translate(${x}, ${y + bobPhase})`}>
        {/* Body */}
        <rect x="-2" y="-8" width="4" height="6" fill={workerStyle.clothing} />
        {/* Head */}
        <circle cx="0" cy="-10" r="2" fill={workerStyle.skin} />
        {/* Hat/Hair */}
        {isModern ? (
          // Hard hat for modern era
          <path d="M-2.5,-12 L2.5,-12 L2,-13 L-2,-13 Z" fill={workerStyle.hat} />
        ) : isPlantation ? (
          // Straw hat for plantation
          <ellipse cx="0" cy="-12" rx="3" ry="1" fill={workerStyle.hat} />
        ) : (
          // Hair for other eras
          <rect x="-2" y="-12" width="4" height="2" fill={workerStyle.hair} />
        )}
        {/* Arms */}
        <rect x="-3" y="-7" width="1" height="4" fill={workerStyle.skin} />
        <rect x="2" y="-7" width="1" height="4" fill={workerStyle.skin} />
        {/* Legs with walking animation */}
        <rect x="-1.5" y="-2" width="1" height="4" fill={workerStyle.clothing} transform={`translate(0, ${legOffset})`} />
        <rect x="0.5" y="-2" width="1" height="4" fill={workerStyle.clothing} transform={`translate(0, ${-legOffset})`} />
        
        {/* Carrying items for plantation/early workers */}
        {action === 'carry' && (
          <rect x="-3" y="-9" width="6" height="3" fill="#8B4513" opacity="0.8" />
        )}
      </g>
    );
  };
  
  const renderPlantationScene = () => {
    const fieldRows = 4;
    const workers = 3 + (seed % 2);
    
    return (
      <g>
        {/* Plantation fields */}
        {Array.from({ length: fieldRows }).map((_, i) => (
          <g key={`field-${i}`}>
            {/* Rows of crops */}
            <rect 
              x="0" 
              y={GROUND_Y - 20 + i * 5} 
              width={width} 
              height="3" 
              fill={i % 2 === 0 ? '#4A7C59' : '#6EE7B7'} 
              opacity="0.6"
            />
            {/* Individual plants */}
            {Array.from({ length: Math.floor(width / 15) }).map((_, j) => (
              <circle
                key={`plant-${i}-${j}`}
                cx={j * 15 + 7}
                cy={GROUND_Y - 20 + i * 5}
                r="2"
                fill="#228B22"
                opacity="0.8"
              />
            ))}
          </g>
        ))}
        
        {/* Plantation house */}
        <rect x={width / 2 - 40} y={GROUND_Y - 35} width="80" height="35" fill="#F5DEB3" />
        <polygon 
          points={`${width/2 - 45},${GROUND_Y - 35} ${width/2},${GROUND_Y - 50} ${width/2 + 45},${GROUND_Y - 35}`} 
          fill="#8B4513" 
        />
        {/* Colonial-style columns */}
        {[-30, -10, 10, 30].map(offset => (
          <rect key={`col-${offset}`} x={width/2 + offset - 1} y={GROUND_Y - 30} width="2" height="25" fill="#FFF" />
        ))}
        {/* Windows */}
        {renderWindows(width/2 - 40, GROUND_Y - 35, 80, [8, 20])}
        
        {/* Workers in fields */}
        {Array.from({ length: workers }).map((_, i) => {
          const wx = 50 + i * 100 + Math.sin(frame * 0.1 + i) * 20;
          const action = i % 2 === 0 ? 'carry' : 'work';
          return renderWorker(wx, GROUND_Y, action, i);
        })}
        
        {/* Overseer on horseback (if not modern) */}
        {!isModern && (
          <g transform={`translate(${width - 100}, ${GROUND_Y - 15})`}>
            {/* Horse */}
            <ellipse cx="0" cy="0" rx="12" ry="8" fill="#8B4513" />
            <rect x="-10" y="0" width="2" height="10" fill="#654321" />
            <rect x="8" y="0" width="2" height="10" fill="#654321" />
            {/* Rider */}
            <circle cx="0" cy="-10" r="2" fill={workerStyle.skin} />
            <rect x="-2" y="-8" width="4" height="6" fill="#2F4F4F" />
          </g>
        )}
      </g>
    );
  };
  
  const renderFactory = ()=>{
    // For plantations, render the plantation scene instead
    if (isPlantation) {
      return renderPlantationScene();
    }
    
    const bw = clamp(Math.min(0.58*width, 240), 160, 260);
    const bx = (width - bw)/2;
    const by = GROUND_Y - spec.buildingHeight;

    const roof = (() => {
      switch(spec.roof){
        case 'peaked': return <polygon points={`${bx-6},${by} ${bx+bw/2},${by-16} ${bx+bw+6},${by}`} fill="#4a4a4a"/>;
        case 'sawtooth': return (<>{[0,1,2,3].map(i=><polygon key={i} points={`${bx+i*(bw/4)},${by} ${bx+i*(bw/4)+bw/8},${by-8} ${bx+i*(bw/4)+bw/4},${by}`} fill="#4a4a4a"/>)}</>);
        case 'flat': return <rect x={bx} y={by-3} width={bw} height={3} fill="#3a3a3a"/>;
        case 'curved': return <ellipse cx={bx+bw/2} cy={by} rx={bw/2} ry={8} fill="#4a4a4a"/>;
        case 'complex': return (<><rect x={bx} y={by-4} width={bw} height={4} fill="#3a3a3a"/><polygon points={`${bx},${by-4} ${bx+12},${by-12} ${bx+24},${by-4}`} fill="#555"/><polygon points={`${bx+34},${by-4} ${bx+52},${by-13} ${bx+70},${by-4}`} fill="#555"/></>);
      }
    })();

    // Annex wings for variety
    const annexLeftW = Math.min(30, Math.max(20, bw*0.18));
    const annexRightW= Math.min(34, Math.max(24, bw*0.22));

    return (
      <g>
        <BrickDef/>
        {/* Left annex */}
        <rect x={bx - annexLeftW - 6} y={GROUND_Y - 22} width={annexLeftW} height={22} fill="url(#brick)"/>
        {renderWindows(bx - annexLeftW - 6 + 6, GROUND_Y - 22, annexLeftW - 12, [6])}
        <rect x={bx - annexLeftW - 2} y={GROUND_Y - 24} width={annexLeftW - 4} height={2} fill="#4a4a4a"/>

        {/* Main block */}
        <rect x={bx} y={by} width={bw} height={spec.buildingHeight} fill="url(#brick)"/>
        {roof}
        {/* skylights if sawtooth/flat */}
        {(spec.roof==='sawtooth'||spec.roof==='flat') && Array.from({length:4}).map((_,i)=>(
          <rect key={`sky-${i}`} x={bx+6+i*(bw/4)} y={by-6} width={bw/5-4} height={3} fill="#7d9fb8" opacity="0.7"/>
        ))}

        {/* catwalk + ladder on right side */}
        <rect x={bx+bw-6} y={by+4} width="2" height={spec.buildingHeight-8} fill="#6b6b6b"/>
        <rect x={bx+bw-10} y={by+10} width="16" height="2" fill="#6b6b6b"/>

        {/* Windows */}
        {renderWindows(bx+10, by, bw-20, [6, 22])}

        {/* Doors */}
        <rect x={bx+bw/2-7} y={GROUND_Y-12} width="14" height="12" fill={isRuined?'#2a2a2a':'#3a2a1a'}/>
        <rect x={bx+8} y={GROUND_Y-12} width="10" height="12" fill={isRuined?'#2a2a2a':'#3a2a1a'}/>

        {/* Chimneys */}
        {Array.from({length:spec.chimneys}).map((_,i)=>{
          const cx = bx + 10 + i*(bw/Math.max(1,spec.chimneys));
          const topY = by - spec.chimneyHeight;
          return (
            <g key={`chim-${i}`}>
              <rect x={cx} y={topY} width="7" height={spec.chimneyHeight} fill="url(#brick)"/>
              <rect x={cx-1} y={topY-2} width="9" height="4" fill="#2a2a2a"/>
              {!isRuined && <Smoke x={cx+3.5} yTop={topY-8} col={spec.smoke} dense={isEarly}/>}
            </g>
          );
        })}

        {/* Right annex / service bay */}
        <rect x={bx+bw+6} y={GROUND_Y - 24} width={annexRightW} height={24} fill="url(#sheet)"/>
        {renderWindows(bx+bw+8, GROUND_Y - 24, annexRightW-16, [6])}

        {/* Add workers for industrial/modern factories */}
        {(isIndustrial || isModern) && !isRuined && (
          <>
            {/* Workers near entrance */}
            {renderWorker(bx + 20, GROUND_Y, 'walk', 0)}
            {renderWorker(bx + bw - 30, GROUND_Y, 'work', 1)}
            {/* Worker on catwalk */}
            {renderWorker(bx + bw - 2, by + 10, 'work', 2)}
          </>
        )}
        
        {/* For manufactory, show craftsmen at work */}
        {isManufactory && !isRuined && (
          <>
            {/* Craftsmen at windows */}
            {Array.from({ length: 3 }).map((_, i) => (
              renderWorker(bx + 30 + i * 40, GROUND_Y, 'work', i)
            ))}
          </>
        )}
        
        {/* Industry extras */}
        {spec.hasBlast && (
          <g>
            {/* blast furnaces with hot stoves */}
            {[0,1].map(i=>(
              <g key={i}>
                <polygon points={`${bx-34+i*20},${GROUND_Y} ${bx-24+i*20},${GROUND_Y-32} ${bx-12+i*20},${GROUND_Y}`} fill="#6b4a3e" stroke="#3b2a22" strokeWidth="1"/>
                {!isRuined && <rect x={bx-28+i*20} y={GROUND_Y-12} width="8" height="5" fill="#ff6b35" opacity={0.8+0.2*Math.sin(frame*0.2+i)}/>}
              </g>
            ))}
            {/* occasional arc flash from EAF (modern steel) */}
            {isModern && !isRuined && <ArcFlash x={bx+Math.floor(bw*0.35)} y={GROUND_Y-16} phase={sparkPhase.current[0]} />}
          </g>
        )}

        {spec.hasWaterWheel && (
          <g transform={`translate(${bx-10}, ${GROUND_Y-12})`}>
            <circle cx="0" cy="0" r="12" fill="#8b4513" stroke="#654321" strokeWidth="1"/>
            <g transform={`rotate(${isRuined?0:(frame*3)%360} 0 0)`}>
              {[0,45,90,135,180,225,270,315].map(a=><rect key={a} x={-1} y={-12} width={2} height={24} fill="#654321" transform={`rotate(${a} 0 0)`}/>)}
            </g>
          </g>
        )}

        {spec.hasTanks && (
          <>
            <ellipse cx={bx-26} cy={GROUND_Y-10} rx={9} ry={11} fill="#4a5a6a"/><ellipse cx={bx-26} cy={GROUND_Y-21} rx={9} ry={3} fill="#5a6a7a"/>
            <ellipse cx={bx+bw+34} cy={GROUND_Y-10} rx={10} ry={12} fill="#4a5a6a"/><ellipse cx={bx+bw+34} cy={GROUND_Y-22} rx={10} ry={3} fill="#5a6a7a"/>
            <rect x={bx-16} y={GROUND_Y-13} width={20} height={2} fill="#3a3a3a"/><rect x={bx+bw+12} y={GROUND_Y-13} width={22} height={2} fill="#3a3a3a"/>
          </>
        )}

        {spec.hasConveyor && (
          <g>
            <rect x={bx-10} y={GROUND_Y-6} width={bw+20} height={2} fill="#2a2a2a"/>
            <rect x={bx-10} y={GROUND_Y-4} width={bw+20} height={1} fill="#4a4a4a"/>
            {!isRuined && Array.from({length:6}).map((_,i)=>(
              <rect key={i} x={bx-10+((i*28+(frame*2)%(bw+20))%(bw+20))} y={GROUND_Y-8} width={4} height={3} fill="#6a6a6a"/>
            ))}
          </g>
        )}

        {spec.hasCleanRoom && isModern && tod==='night' && !isRuined && (
          Array.from({length:8}).map((_,i)=>(
            <rect key={i} x={bx+6} y={by+4+i*3} width={bw-12} height={1.2} fill="#7DF9FF" opacity={0.35+0.35*Math.sin(frame*0.18+neonPhase.current[i%neonPhase.current.length])}/>
          ))
        )}

        {spec.hasHangar && (
          <g>
            <rect x={bx+6} y={GROUND_Y-22} width={bw-12} height={22} fill="#5a5a5a" opacity="0.78"/>
            {!isRuined && <rect x={bx+6} y={GROUND_Y-22} width={bw-12} height={22*(0.15+0.85*(0.5+0.5*Math.sin(frame*0.01)))} fill="#2f2f2f"/>}
          </g>
        )}

        {spec.hasCrane && (
          <g>
            <rect x={bx+bw+22} y={GROUND_Y-52} width={3} height={52} fill="#4a4a4a"/>
            <line x1={bx+bw+23.5} y1={GROUND_Y-52} x2={bx+bw-8+Math.sin(frame*0.02)*8} y2={GROUND_Y-34} stroke="#3a3a3a" strokeWidth="2"/>
            <rect x={bx+bw-10+Math.sin(frame*0.02)*8} y={GROUND_Y-34} width={5} height={7} fill="#5a5a5a"/>
            {/* ship weld spark at slipway area */}
            {spec.hasSlipway && isModern && !isRuined && <WeldSpark x={bx+bw+30} y={GROUND_Y-10} phase={sparkPhase.current[2]} />}
          </g>
        )}

        {spec.hasSlipway && (
          <g>
            <rect x={bx+bw+28} y={GROUND_Y-4} width={44} height={4} fill="#6b5a3e"/>
            <rect x={bx+bw+24} y={GROUND_Y-8} width={52} height={4} fill="#6b5a3e"/>
          </g>
        )}

        {spec.hasTowers && (
          <>
            {/* distillation towers + flare */}
            <rect x={bx-34} y={GROUND_Y-40} width={9} height={40} fill="#5a6a7a"/>
            <rect x={bx-35} y={GROUND_Y-34} width={11} height={2} fill="#4a5a6a"/>
            <rect x={bx-35} y={GROUND_Y-24} width={11} height={2} fill="#4a5a6a"/>
            <rect x={bx+bw+18} y={GROUND_Y-44} width={9} height={44} fill="#5a6a7a"/>
            <rect x={bx+bw+17} y={GROUND_Y-38} width={11} height={2} fill="#4a5a6a"/>
            <rect x={bx+bw+17} y={GROUND_Y-28} width={11} height={2} fill="#4a5a6a"/>
            {/* flare at night */}
            {tod==='night' && !isRuined && <polygon points={`${bx+bw+22},${GROUND_Y-46} ${bx+bw+26},${GROUND_Y-56} ${bx+bw+18},${GROUND_Y-56}`} fill="#FFA94D" opacity={0.6+0.3*Math.sin(frame*0.2)}/>}
          </>
        )}

        {spec.hasKiln && (
          <g>
            {/* cone kilns (glass) or rotary kiln (cement) */}
            {industryName?.toLowerCase().includes('cement') ? (
              <>
                <rect x={bx-30} y={GROUND_Y-18} width="60" height="6" fill="#6a6a6a"/>
                <rect x={bx-30+((frame*1.2)%60)} y={GROUND_Y-18} width="6" height="6" fill="#5a5a5a"/>{/* kiln rotation hint */}
                <rect x={bx-36} y={GROUND_Y-30} width="12" height="30" fill="#4a4a4a"/>{/* preheater tower */}
              </>
            ) : (
              <>
                <polygon points={`${bx-20},${GROUND_Y} ${bx-8},${GROUND_Y-34} ${bx+4},${GROUND_Y}`} fill="#6b5a4a"/>
                <polygon points={`${bx+bw+8},${GROUND_Y} ${bx+bw+20},${GROUND_Y-30} ${bx+bw+32},${GROUND_Y}`} fill="#6b5a4a"/>
              </>
            )}
          </g>
        )}

        {spec.hasDryers && (
          <g>
            {/* paper dryer cans */}
            {[0,1,2].map(i=>(
              <g key={i} transform={`translate(${bx-18+i*18}, ${GROUND_Y-12})`}>
                <ellipse cx={0} cy={0} rx={6} ry={6} fill="#b0b0b0"/>
                <rect x={-6} y={-1} width="12" height="2" fill="#8f8f8f"/>
              </g>
            ))}
          </g>
        )}

        {spec.hasBrew && (
          <g>
            {/* kettles + small stack */}
            <ellipse cx={bx-18} cy={GROUND_Y-8} rx={8} ry={10} fill="#AA7A3A"/>
            <ellipse cx={bx-18} cy={GROUND_Y-18} rx={8} ry={3} fill="#C8924C"/>
            <rect x={bx-2} y={GROUND_Y-26} width="6" height="26" fill="url(#brick)"/>
            {!isRuined && <Smoke x={bx+1} yTop={GROUND_Y-28} col="#6b6b6b" />}
          </g>
        )}

        {spec.hasSawmill && (
          <g>
            {/* log deck */}
            {[0,1,2,3].map(i=>(
              <rect key={i} x={bx-28+i*8} y={GROUND_Y-6-i} width="10" height="6" fill="#8b5a2c"/>
            ))}
            {/* saw house windows */}
            {renderWindows(bx+10, by, bw-20, [14])}
          </g>
        )}

        {spec.hasFood && (
          <g>
            {/* grain silos */}
            <ellipse cx={bx-24} cy={GROUND_Y-10} rx={9} ry={12} fill="#b8b8b8"/>
            <ellipse cx={bx-10} cy={GROUND_Y-10} rx={9} ry={12} fill="#b8b8b8"/>
            <rect x={bx-30} y={GROUND_Y-22} width="40" height="2" fill="#9a9a9a"/>
          </g>
        )}
      </g>
    );
  };

  /* ----------------------------- Render ------------------------------ */

  return (
    <svg
      width={width}
      height={height}
      viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
      style={{ imageRendering: 'pixelated' }}
      className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-t-lg"
    >
      {renderSky()}
      {renderTrack()}
      {renderGround()}
      {renderFactory()}
      {renderTrain()}
    </svg>
  );
};

export default React.memo(FactoryBanner);
