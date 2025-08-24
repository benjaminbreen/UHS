/**
 * components/FactoryBanner.tsx
 * Consistent with MiningColonyBanner (GROUND_Y=110, gradients, zoom, pixel shapes).
 * Shows a centered, detailed factory per industry + animated era-appropriate trains.
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

type RNG = { next(): number; range(min:number,max:number): number; pick<T>(a:T[]):T };
class SeededRandom implements RNG {
  private seed:number; constructor(seed:number){ this.seed=seed; }
  next(){ this.seed=(this.seed*9301+49297)%233280; return this.seed/233280; }
  range(min:number,max:number){ return min+this.next()*(max-min); }
  pick<T>(a:T[]){ return a[Math.floor(this.range(0,a.length))]; }
}
const hashSeed = (s:string) => { let h=2166136261>>>0; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619);} return (h%233279)+1; };

const SKY_COLORS: Record<'dawn'|'day'|'dusk'|'night', string[]> = {
  dawn:['#FF9A8B','#A8E6CF','#FFD3BA'],
  day: ['#87CEEB','#98D8E8','#B8E6B8'],
  dusk:['#FF8C42','#FF6B6B','#C44569'],
  night:['#2C3E50','#34495E','#4A6741']
};
const categorizeTOD = (hour:number): 'dawn'|'day'|'dusk'|'night' => {
  if (hour < 6 || hour >= 21) return 'night';
  if (hour < 8) return 'dawn';
  if (hour >= 19 && hour < 21) return 'dusk';
  return 'day';
};

const groundPalette = (climate?:string, season?:string) => {
  const c=(climate||'temperate').toLowerCase(), s=(season||'').toLowerCase();
  if (s==='winter'){
    if (c==='cold') return {ground:'#F0F8FF', vegetation:'#E0E8EF', accent:'#C0D0E0'};
    if (c==='temperate') return {ground:'#E8F0F8', vegetation:'#D0E0F0', accent:'#B0C0D0'};
    if (c==='mediterranean') return {ground:'#86EFAC', vegetation:'#22C55E', accent:'#16A34A'};
  }
  if (c==='cold') return {ground:'#F0F8FF', vegetation:'#E0E8EF', accent:'#C0D0E0'};
  if (c==='arid') return {ground:'#D2B48C', vegetation:'#CD853F', accent:'#A0826D'};
  if (c==='mediterranean') return {ground:'#B4C5A0', vegetation:'#8B9070', accent:'#7A8060'};
  if (c==='tropical') return {ground:'#4A7C59', vegetation:'#059669', accent:'#047857'};
  if (c==='semitropical') return {ground:'#6EE7B7', vegetation:'#32CD32', accent:'#228B22'};
  return {ground:'#86EFAC', vegetation:'#22C55E', accent:'#16A34A'};
};

const parseEraYear = (era?:string) => {
  if (!era) return 1850;
  const e=era.toLowerCase();
  if (/^\d{3,4}$/.test(e)) return parseInt(e,10);
  if (e.includes('early')) return 1700;        // early modern
  if (e.includes('industrial')) return 1850;
  if (e.includes('modern')) return 1960;
  if (e.includes('medieval')) return 1200;
  return 1850;
};

const getSpec = (industryName?: string) => {
  const n=(industryName||'default').toLowerCase();
  const base = {
    chimneys:2, chimneyHeight:36, buildingHeight:34, smoke:'#5a5a5a', roof:'peaked',
    hasBlast:false, hasWaterWheel:false, hasTanks:false, hasConveyor:false,
    hasCleanRoom:false, hasHangar:false, hasCrane:false, hasTowers:false, hasSlipway:false
  };
  if (n.includes('steel'))       return {...base, chimneys:3, chimneyHeight:50, buildingHeight:36, hasBlast:true,  roof:'peaked', smoke:'#444'};
  if (n.includes('textile'))     return {...base, chimneys:2, chimneyHeight:34, buildingHeight:30, hasWaterWheel:true, roof:'sawtooth', smoke:'#666'};
  if (n.includes('chemical'))    return {...base, chimneys:3, chimneyHeight:42, buildingHeight:28, hasTanks:true,  roof:'flat', smoke:'#5a5a3a'};
  if (n.includes('automobile'))  return {...base, chimneys:1, chimneyHeight:30, buildingHeight:32, hasConveyor:true, roof:'flat'};
  if (n.includes('electronic'))  return {...base, chimneys:1, chimneyHeight:26, buildingHeight:28, hasCleanRoom:true, roof:'flat'};
  if (n.includes('aircraft'))    return {...base, chimneys:0, chimneyHeight:0,  buildingHeight:44, hasHangar:true,  roof:'curved'};
  if (n.includes('ship'))        return {...base, chimneys:2, chimneyHeight:35, buildingHeight:30, hasCrane:true, hasSlipway:true, roof:'flat'};
  if (n.includes('oil')||n.includes('refin')) return {...base, chimneys:5, chimneyHeight:52, buildingHeight:26, hasTowers:true, roof:'complex', smoke:'#2f2f2f'};
  return base;
};

// Layout consistent with MiningColony
const GROUND_Y = 110;
const SKY_H = 105;

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
  // stable seed → stable scene
  const seed = useMemo(() => hashSeed([width,height,climate,season,era,culturalZone,industryName].join('|')), [width,height,climate,season,era,culturalZone,industryName]);
  const rng = useMemo(()=>new SeededRandom(seed),[seed]);
  const staticRng = useMemo(()=>new SeededRandom(seed+777),[seed]);

  const [frame,setFrame] = useState(0);
  useEffect(()=>{ if(isRuined) return; const id=setInterval(()=>setFrame(f=>f+1),60); return ()=>clearInterval(id); },[isRuined]);

  const zoom=1.5, viewW=width/zoom, viewH=height/zoom, viewX=(width-viewW)/2, viewY=(height-viewH)/3;

  const year = parseEraYear(era);
  const isEarly = year <= 1800;
  const isIndustrial = year > 1800 && year < 1900;
  const isModern = year >= 1900;

  const tod = categorizeTOD(new Date().getHours());
  const sky = SKY_COLORS[tod];
  const pal = groundPalette(climate,season);

  const clouds=useRef<{x:number;y:number;w:number;}[]>([]);
  const stars =useRef<{x:number;y:number;}[]>([]);
  const pebbles=useRef<{x:number;y:number;w:number;h:number;}[]>([]);
  const skyline=useRef<{x:number;w:number;h:number;o:number;stack?:boolean;}[]>([]);
  const windowPhase=useRef<number[]>([]);
  if (!clouds.current.length) for(let i=0;i<5;i++) clouds.current.push({x:-80+i*160+staticRng.range(-18,18),y:18+staticRng.range(-8,8),w:staticRng.range(16,26)});
  if (tod==='night' && !stars.current.length) for(let i=0;i<24;i++) stars.current.push({x:staticRng.range(6,width-6),y:staticRng.range(6,88)});
  if (!pebbles.current.length){ const n=Math.floor(width/12); for(let i=0;i<n;i++) pebbles.current.push({x:i*12+staticRng.range(-3,3),y:GROUND_Y+staticRng.range(0,3),w:staticRng.range(2,4),h:staticRng.range(1,3)}); }
  if (!skyline.current.length){ const n=Math.floor(width/90)+1; for(let i=0;i<n;i++) skyline.current.push({x:i*(width/n)+staticRng.range(-22,22),w:staticRng.range(18,36),h:staticRng.range(14,30),o:staticRng.range(0.25,0.55),stack:staticRng.next()>0.6}); }
  if (!windowPhase.current.length){ for(let i=0;i<40;i++) windowPhase.current.push(staticRng.range(0,Math.PI*2)); }

  // --- SKY ---
  const renderSky=()=> {
    const cloudDrift=(frame*0.10)%(width+120);
    return (
      <g>
        <defs>
          <linearGradient id="f_sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={sky[0]} /><stop offset="50%" stopColor={sky[1]} /><stop offset="100%" stopColor={sky[2]||sky[1]} />
          </linearGradient>
          <filter id="softGlow"><feGaussianBlur stdDeviation="1.2"/></filter>
        </defs>
        <rect x="0" y="0" width={width} height={SKY_H} fill="url(#f_sky)" />
        {tod!=='night' ? <circle cx={width-40} cy={22} r={10} fill="#FFD700" opacity="0.95"/> :
          <g><circle cx={width-42} cy={20} r={7} fill="#F2F2F2"/><circle cx={width-42} cy={20} r={10} fill="#F2F2F2" opacity="0.15" filter="url(#softGlow)"/></g>}
        {tod==='night' && stars.current.map((s,i)=><rect key={i} x={s.x} y={s.y} width="1" height="1" fill="#fff" opacity="0.9" shapeRendering="crispEdges"/>)}
        {clouds.current.map((c,i)=>{ const x=c.x+cloudDrift-100; return (
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

  // --- GROUND ---
  const renderGround=()=>(
    <g>
      <defs>
        <linearGradient id="f_ground" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={pal.ground} stopOpacity="1"/><stop offset="55%" stopColor={pal.ground} stopOpacity="0.96"/><stop offset="100%" stopColor={pal.accent} stopOpacity="0.92"/>
        </linearGradient>
      </defs>
      <rect x="0" y={GROUND_Y} width={width} height={height-GROUND_Y} fill="url(#f_ground)"/>
      {pebbles.current.map((p,i)=><rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill="#756B5A" opacity="0.4"/>)}
    </g>
  );

  // --- WINDOWS with era-aware glow ---
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

  // --- CENTER FACTORY (detailed but pixel-art) ---
  const spec = useMemo(()=>getSpec(industryName),[industryName]);
  const renderFactory = ()=>{
    // centered mass sized to viewport
    const bw = Math.min(0.5*width, 220);
    const bx = (width - bw)/2;
    const by = GROUND_Y - spec.buildingHeight;

    // roof
    const roof = (() => {
      switch(spec.roof){
        case 'peaked': return <polygon points={`${bx-6},${by} ${bx+bw/2},${by-16} ${bx+bw+6},${by}`} fill="#4a4a4a"/>;
        case 'sawtooth': return (<>{[0,1,2,3].map(i=><polygon key={i} points={`${bx+i*(bw/4)},${by} ${bx+i*(bw/4)+bw/8},${by-8} ${bx+i*(bw/4)+bw/4},${by}`} fill="#4a4a4a"/>)}</>);
        case 'flat': return <rect x={bx} y={by-3} width={bw} height={3} fill="#3a3a3a"/>;
        case 'curved': return <ellipse cx={bx+bw/2} cy={by} rx={bw/2} ry={8} fill="#4a4a4a"/>;
        case 'complex': return (<><rect x={bx} y={by-4} width={bw} height={4} fill="#3a3a3a"/><polygon points={`${bx},${by-4} ${bx+12},${by-12} ${bx+24},${by-4}`} fill="#555"/><polygon points={`${bx+34},${by-4} ${bx+52},${by-13} ${bx+70},${by-4}`} fill="#555"/></>);
        default: return null;
      }
    })();

    // subtle brick stripes
    const Brick = () => (
      <defs>
        <pattern id="brick" x="0" y="0" width="8" height="4" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="8" height="2" fill={isRuined?'#555':'#8b4513'}/>
          <rect x="0" y="2" width="8" height="2" fill={isRuined?'#444':'#a0522d'}/>
        </pattern>
      </defs>
    );

    // helper smoke puffs rising
    const Smoke: React.FC<{x:number; yTop:number; col:string; dense?:boolean}> = ({x,yTop,col,dense})=>(
      <>
        <ellipse cx={x} cy={yTop - ((frame*0.6)%80)} rx={4} ry={6} fill={col} opacity={dense?0.6:0.45}/>
        <ellipse cx={x} cy={yTop - ((frame*0.6+12)%80)} rx={5} ry={8} fill={col} opacity={dense?0.45:0.35}/>
        <ellipse cx={x} cy={yTop - ((frame*0.6+24)%80)} rx={6} ry={10} fill={col} opacity={dense?0.3:0.2}/>
      </>
    );

    return (
      <g>
        <Brick/>
        {/* main block */}
        <rect x={bx} y={by} width={bw} height={spec.buildingHeight} fill="url(#brick)"/>
        {roof}
        {/* windows */}
        {renderWindows(bx+10, by, bw-20, [6, 22])}
        {/* doors */}
        <rect x={bx+bw/2-7} y={GROUND_Y-12} width="14" height="12" fill={isRuined?'#2a2a2a':'#3a2a1a'}/>

        {/* chimneys */}
        {Array.from({length:spec.chimneys}).map((_,i)=>{
          const cx = bx + 12 + i*(bw/Math.max(1,spec.chimneys));
          const topY = by - spec.chimneyHeight;
          return (
            <g key={i}>
              <rect x={cx} y={topY} width="7" height={spec.chimneyHeight} fill="url(#brick)"/>
              <rect x={cx-1} y={topY-2} width="9" height="4" fill="#2a2a2a"/>
              {!isRuined && <Smoke x={cx+3.5} yTop={topY-8} col={spec.smoke} dense={isEarly}/>}
            </g>
          );
        })}

        {/* Industry extras */}
        {spec.hasBlast && (
          <g>
            {/* two blast furnaces + hot stoves */}
            {[0,1].map(i=>(
              <g key={i}>
                <polygon points={`${bx-26+i*18},${GROUND_Y} ${bx-18+i*18},${GROUND_Y-30} ${bx-8+i*18},${GROUND_Y}`} fill="#6b4a3e" stroke="#3b2a22" strokeWidth="1"/>
                {!isRuined && <rect x={bx-22+i*18} y={GROUND_Y-12} width="6" height="4" fill="#ff6b35" opacity={0.8+0.2*Math.sin(frame*0.2+i)}/>}
              </g>
            ))}
            {/* rolling mill shed hint */}
            <rect x={bx+bw+6} y={GROUND_Y-20} width="24" height="20" fill="url(#brick)"/>
            {renderWindows(bx+bw+8, GROUND_Y-20, 20, [6])}
          </g>
        )}

        {spec.hasWaterWheel && (
          <g transform={`translate(${bx+bw+10}, ${GROUND_Y-14})`}>
            <circle cx="0" cy="0" r="12" fill="#8b4513" stroke="#654321" strokeWidth="1"/>
            <g transform={`rotate(${isRuined?0:(frame*3)%360} 0 0)`}>
              {[0,45,90,135,180,225,270,315].map(a=><rect key={a} x={-1} y={-12} width={2} height={24} fill="#654321" transform={`rotate(${a} 0 0)`}/>)}
            </g>
          </g>
        )}

        {spec.hasTanks && (
          <>
            <ellipse cx={bx-24} cy={GROUND_Y-10} rx={9} ry={11} fill="#4a5a6a"/><ellipse cx={bx-24} cy={GROUND_Y-21} rx={9} ry={3} fill="#5a6a7a"/>
            <ellipse cx={bx+bw+24} cy={GROUND_Y-10} rx={9} ry={11} fill="#4a5a6a"/><ellipse cx={bx+bw+24} cy={GROUND_Y-21} rx={9} ry={3} fill="#5a6a7a"/>
            <rect x={bx-15} y={GROUND_Y-13} width={20} height={2} fill="#3a3a3a"/><rect x={bx+bw-5} y={GROUND_Y-13} width={20} height={2} fill="#3a3a3a"/>
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
          Array.from({length:6}).map((_,i)=>(
            <rect key={i} x={bx+6} y={by+4+i*3} width={bw-12} height={1.2} fill="#7DF9FF" opacity={0.35+0.35*Math.sin(frame*0.18+windowPhase.current[i])}/>
          ))
        )}

        {spec.hasHangar && (
          <g>
            <rect x={bx+6} y={GROUND_Y-20} width={bw-12} height={20} fill="#5a5a5a" opacity="0.75"/>
            {!isRuined && <rect x={bx+6} y={GROUND_Y-20} width={bw-12} height={20*(0.15+0.85*(0.5+0.5*Math.sin(frame*0.01)))} fill="#2f2f2f"/>}
          </g>
        )}

        {spec.hasCrane && (
          <g>
            <rect x={bx+bw+12} y={GROUND_Y-44} width={3} height={44} fill="#4a4a4a"/>
            <line x1={bx+bw+13.5} y1={GROUND_Y-44} x2={bx+bw-10+Math.sin(frame*0.02)*6} y2={GROUND_Y-28} stroke="#3a3a3a" strokeWidth="2"/>
            <rect x={bx+bw-12+Math.sin(frame*0.02)*6} y={GROUND_Y-28} width={4} height={6} fill="#5a5a5a"/>
          </g>
        )}

        {spec.hasSlipway && (
          <g>
            <rect x={bx+bw+26} y={GROUND_Y-4} width={40} height={4} fill="#6b5a3e"/>
            <rect x={bx+bw+22} y={GROUND_Y-8} width={48} height={4} fill="#6b5a3e"/>
          </g>
        )}

        {spec.hasTowers && (
          <>
            {/* distillation towers + flare */}
            <rect x={bx-30} y={GROUND_Y-38} width={9} height={38} fill="#5a6a7a"/>
            <rect x={bx-31} y={GROUND_Y-32} width={11} height={2} fill="#4a5a6a"/>
            <rect x={bx-31} y={GROUND_Y-22} width={11} height={2} fill="#4a5a6a"/>
            <rect x={bx+bw+20} y={GROUND_Y-42} width={9} height={42} fill="#5a6a7a"/>
            <rect x={bx+bw+19} y={GROUND_Y-36} width={11} height={2} fill="#4a5a6a"/>
            <rect x={bx+bw+19} y={GROUND_Y-26} width={11} height={2} fill="#4a5a6a"/>
            {tod==='night' && !isRuined && <polygon points={`${bx+bw+24},${GROUND_Y-44} ${bx+bw+28},${GROUND_Y-54} ${bx+bw+20},${GROUND_Y-54}`} fill="#FFA94D" opacity={0.6+0.3*Math.sin(frame*0.2)}/>}
          </>
        )}
      </g>
    );
  };

  // --- TRACK + ERA TRAINS (animated) ---
  const renderRail=()=>{
    const y = SKY_H + 2; // sits just below horizon line
    return (
      <g>
        {/* rails */}
        <rect x="0" y={y} width={width} height="2" fill="#4A4A4A"/>
        <rect x="0" y={y+4} width={width} height="2" fill="#4A4A4A"/>
        {Array.from({length:Math.floor(width/20)}).map((_,i)=><rect key={i} x={i*20} y={y-1} width="3" height="10" fill="#654321"/>)}

        {/* overhead wire for electric era */}
        {isModern && <line x1="0" y1={y-6} x2={width} y2={y-6} stroke="#555" strokeWidth="1"/>}
      </g>
    );
  };

  const renderTrain=()=>{
    const y = SKY_H + 2;
    const t = ((frame * (isEarly?0.4:isIndustrial?0.9:1.2)) % (width+140)) - 140; // offscreen start
    if (isEarly){
      // hand cart with two workers
      return (
        <g transform={`translate(${t},0)`}>
          <rect x="10" y={y-2} width="24" height="6" fill="#8b4513"/>
          <circle cx="16" cy={y+6} r="2" fill="#2a2a2a"/><circle cx="28" cy={y+6} r="2" fill="#2a2a2a"/>
          {/* workers pumping handle */}
          <rect x="18" y={y-8+Math.sin(frame*0.25)*2} width="8" height="2" fill="#4a4a4a"/>
          <rect x="14" y={y-12} width="2" height="8" fill="#2a2a2a"/><rect x="28" y={y-12} width="2" height="8" fill="#2a2a2a"/>
        </g>
      );
    }
    if (isIndustrial){
      // steam loco + tender + car
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
          <rect x="44" y={y-8} width="24" height="8" fill="#444"/><circle cx="50" cy={y+6} r="2.5" fill="#1c1c1c"/><circle cx="60" cy={y+6} r="2.5" fill="#1c1c1c"/>
          {/* car */}
          <rect x="70" y={y-8} width="28" height="8" fill="#555"/><circle cx="76" cy={y+6} r="2.5" fill="#1c1c1c"/><circle cx="88" cy={y+6} r="2.5" fill="#1c1c1c"/>
        </g>
      );
    }
    // modern electric
    return (
      <g transform={`translate(${t},0)`}>
        <rect x="10" y={y-8} width="80" height="8" fill="#3c5568"/>
        <rect x="14" y={y-12} width="12" height="4" fill="#4b6b84"/>{/* cab */}
        <rect x="42" y={y-11} width="14" height="3" fill="#4b6b84"/>{/* pantograph base */}
        <polygon points={`${49},${y-11} ${45},${y-16} ${53},${y-16}`} fill="#666"/>{/* pantograph */}
        {/* wheels */}
        {[18,32,46,60,74].map((wx,i)=><circle key={i} cx={wx} cy={y+6} r="2.2" fill="#1c1c1c"/>)}
        {/* windows light at night */}
        {tod==='night' && <rect x="20" y={y-6} width="64" height="3" fill="#FFF49A" opacity="0.6"/>}
      </g>
    );
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
      style={{ imageRendering: 'pixelated' }}
      className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-t-lg"
    >
      {renderSky()}
      {renderRail()}
      {renderGround()}
      {renderFactory()}
      {renderTrain()}
    </svg>
  );
};

export default React.memo(FactoryBanner);
