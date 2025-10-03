/**
 * components/symbols/HarborDistrictSymbol.tsx
 * Large, clean quay with extending docks and boats moored PARALLEL to dock faces.
 * Era/culture variants preserved; in-tile content is clipped; docks/boats extend over water.
 */
import React, { useMemo } from 'react';
import { Tile, HistoricalEra } from '../../types';
import { ValueNoise } from '../../utils/noise';

interface HarborDistrictSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  era?: HistoricalEra;
  culturalStyle?: string;
  mapTiles?: Tile[][]; // 2D array of tiles for water detection
}

type Dir = 'north'|'south'|'east'|'west';

const HarborDistrictSymbol: React.FC<HarborDistrictSymbolProps> = React.memo(({ 
  x, y, size, seed, tile, era, culturalStyle, mapTiles 
}) => {
  // Animation state for boat bobbing
  const [animTick, setAnimTick] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setAnimTick(t => t + 1), 100);
    return () => clearInterval(interval);
  }, []);
  // --------- deterministic per-tile values (same key names) ----------
  const staticValues = useMemo(() => {
    const localRand = (offset = 0) => new ValueNoise(seed + tile.x * 31 + tile.y * 37 + offset).random();

    let waterDirection: Dir = 'south';
    let hasWaterNorth = false, hasWaterSouth = false, hasWaterEast = false, hasWaterWest = false, waterCount = 0;
    if (mapTiles && tile) {
      const tx = tile.x, ty = tile.y;
      const maxY = mapTiles.length - 1;
      const maxX = mapTiles[0]?.length - 1 || 0;
      if (ty > 0 && mapTiles[ty - 1]?.[tx]) { hasWaterNorth = !mapTiles[ty - 1][tx].isLand; if (hasWaterNorth) waterCount++; }
      if (ty < maxY && mapTiles[ty + 1]?.[tx]) { hasWaterSouth = !mapTiles[ty + 1][tx].isLand; if (hasWaterSouth) waterCount++; }
      if (tx < maxX && mapTiles[ty]?.[tx + 1]) { hasWaterEast  = !mapTiles[ty][tx + 1].isLand;  if (hasWaterEast)  waterCount++; }
      if (tx > 0  && mapTiles[ty]?.[tx - 1]) { hasWaterWest  = !mapTiles[ty][tx - 1].isLand;  if (hasWaterWest)  waterCount++; }

      if (hasWaterNorth) waterDirection = 'north';
      else if (hasWaterSouth) waterDirection = 'south';
      else if (hasWaterEast)  waterDirection = 'east';
      else if (hasWaterWest)  waterDirection = 'west';
    }
    return {
      hasCrane: era === HistoricalEra.INDUSTRIAL_ERA || era === HistoricalEra.MODERN_ERA,
      hasContainers: era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA,
      warehouseCount: Math.floor(localRand(0) * 3) + 1, // 1-3 buildings for variety
      pierRotation: localRand(1) * 30 - 15,
      shipCount: Math.floor(localRand(2) * 3) + 1, // 1-3 boats
      boxPattern: Math.floor(localRand(3) * 3),
      waterDirection,
      hasWaterNorth, hasWaterSouth, hasWaterEast, hasWaterWest, waterCount,
    };
  }, [seed, tile.x, tile.y, era, mapTiles, tile]);

  const uniqueId = `harbor-${tile.x}-${tile.y}-${seed}`;
  const clipId = `clip-${uniqueId}`;
  const depth = size * 0.22;

  const culture = (culturalStyle || '').toLowerCase();

  // palettes—muted so they match your city set
  const quayPalette = useMemo(() => {
    if (culture.includes('mediterranean') || culture.includes('mena')) return { face:'#bcae97', top:'#d8c9b2', line:'#8f8576' };
    if (culture.includes('asian')) return { face:'#b6a483', top:'#ccb792', line:'#8a7a63' };
    if (culture.includes('northern') || culture.includes('europe')) return { face:'#b7ae9c', top:'#cbc2af', line:'#8a8273' };
    if (culture.includes('african')) return { face:'#b89d7d', top:'#cfb896', line:'#8a735a' };
    if (culture.includes('american')) return { face:'#b9b4a7', top:'#cec6b9', line:'#8f8576' };
    return { face:'#b9b4a7', top:'#cec6b9', line:'#8f8576' };
  }, [culture]);

  const dockStyle = useMemo(() => {
    if (culture.includes('mediterranean') || culture.includes('mena')) return { color:'#d4c4b0', stroke:'#a09080', width:0.08 };
    if (culture.includes('asian')) return { color:'#8b6914', stroke:'#6b4904', width:0.06 };
    if (culture.includes('northern') || culture.includes('europe')) return { color:'#7a5a14', stroke:'#5a3a04', width:0.1 };
    if (culture.includes('african')) return { color:'#a0826d', stroke:'#806050', width:0.07 };
    if (culture.includes('american')) return { color:'#8b7355', stroke:'#6b5335', width:0.09 };
    return { color:'#8b6914', stroke:'#6b4904', width:0.08 };
  }, [culture]);

  const crisp = { shapeRendering: 'geometricPrecision' as const };

  // helpers
  const sideQuad = (x0: number, y0: number, w: number, h: number, d = depth) =>
    `M ${x0 + w} ${y0} L ${x0 + w + d} ${y0 - d * 0.5} L ${x0 + w + d} ${y0 + h - d * 0.5} L ${x0 + w} ${y0 + h} Z`;
  const shade = (hex: string, amt: number) => {
    const h = hex.replace('#',''); const n = parseInt(h.length===3? h.split('').map(c=>c+c).join('') : h,16);
    const r=(n>>16)&255, g=(n>>8)&255, b=n&255;
    const clamp=(v:number)=>Math.max(0,Math.min(255,Math.round(v)));
    const to=(v:number)=>clamp(v).toString(16).padStart(2,'0');
    return `#${to(r+amt)}${to(g+amt)}${to(b+amt)}`;
  };

  // quay fills ~75% of tile adjacent to water
  const quay = useMemo(() => {
    const frac = 0.75, m = size * 0.04;
    const side = staticValues.waterDirection;
    if (side === 'north') { const w=size-m*2, h=size*frac; return { side, x0:x+m, y0:y+m, w, h }; }
    if (side === 'south') { const w=size-m*2, h=size*frac; return { side, x0:x+m, y0:y+size-h-m, w, h }; }
    if (side === 'east')  { const w=size*frac, h=size-m*2; return { side, x0:x+size-w-m, y0:y+m, w, h }; }
    const w=size*frac, h=size-m*2; return { side, x0:x+m, y0:y+m, w, h };
  }, [x, y, size, staticValues.waterDirection]);

  // ----------
  const els: JSX.Element[] = [];

  els.push(
    <defs key={`defs-${uniqueId}`}>
      <clipPath id={clipId}><rect x={x} y={y} width={size} height={size} /></clipPath>
      {/* soft shadow + subtle glow for shiny water edges & boats */}
      <filter id={`softShadow-${uniqueId}`} x="-120%" y="-120%" width="340%" height="340%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="rgba(0,0,0,0.35)"/>
      </filter>
      <filter id={`softBlur-${uniqueId}`} x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="0.8"/>
      </filter>
      {/* gentle vertical gradient for quay face */}
      <linearGradient id={`quayFace-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={shade(quayPalette.face, 10)} />
        <stop offset="100%" stopColor={shade(quayPalette.face, -12)} />
      </linearGradient>
    </defs>
  );

  // -------------------- IN-TILE CONTENT (clean + spaced) ---------------------
  els.push(
    <g key="inTile" clipPath={`url(#${clipId})`} filter="url(#softShadow-${uniqueId})" {...crisp}>
      {/* Quay slab */}
      {(() => {
        const { x0, y0, w, h, side } = quay;
        const face = <rect x={x0} y={y0} width={w} height={h} fill={`url(#quayFace-${uniqueId})`} stroke={quayPalette.line} strokeWidth={0.6} rx={1.5} />;
        const sideFace = <path d={sideQuad(x0, y0, w, h)} fill={shade(quayPalette.face,-10)} stroke={shade(quayPalette.face,-30)} strokeWidth={0.5} />;
        const top = (side === 'east' || side === 'west')
          ? <path d={`M ${x0} ${y0} L ${x0 + depth} ${y0 - depth*0.5} L ${x0 + depth} ${y0 + h - depth*0.5} L ${x0} ${y0 + h} Z`} fill={quayPalette.top} stroke={shade(quayPalette.top,-30)} strokeWidth={0.5}/>
          : <path d={`M ${x0} ${y0} L ${x0 + w} ${y0} L ${x0 + w + depth} ${y0 - depth*0.5} L ${x0 + depth} ${y0 - depth*0.5} Z`} fill={quayPalette.top} stroke={shade(quayPalette.top,-30)} strokeWidth={0.5}/>;
        // subtle joints—no clutter
        const joints: JSX.Element[] = [];
        if (era && (era >= HistoricalEra.INDUSTRIAL_ERA)) {
          for (let i=1;i<4;i++){
            const lx = x0 + (w/4)*i;
            joints.push(<line key={`j${i}`} x1={lx} y1={y0+2} x2={lx} y2={y0+h-2} stroke={shade(quayPalette.face,-18)} strokeWidth={0.5} opacity={0.28}/>);
          }
        } else {
          for (let i=1;i<5;i++){
            const ly = y0 + (h/5)*i;
            joints.push(<line key={`c${i}`} x1={x0+2} y1={ly} x2={x0+w-2} y2={ly} stroke={shade(quayPalette.face,-22)} strokeWidth={0.6} opacity={0.28}/>);
          }
        }
        return <g key="quay">{(side==='north') ? <>{top}{face}{sideFace}{joints}</> : <>{face}{sideFace}{top}{joints}</>}</g>;
      })()}

      {/* Minimal hardware: a few bollards + one ladder */}
      {(() => {
        const { x0, y0, w, h, side } = quay;
        const g: JSX.Element[] = [];
        const bollards = 3;
        for (let i=0;i<bollards;i++){
          const t=(i+1)/(bollards+1);
          const cx=(side==='east'||side==='west')? x0+w*0.5 : x0+w*t;
          const cy=(side==='east'||side==='west')? y0+h*t : y0+h*0.5;
          g.push(<circle key={`b${i}`} cx={cx} cy={cy} r={size*0.012} fill="#2b2b2b" stroke="#000" strokeWidth={0.35}/>);
        }
        // single ladder near center
        const lx=(side==='east'||side==='west')? x0+w*0.7 : x0+w*0.5;
        const ly=(side==='east'||side==='west')? y0+h*0.5 : y0+h*0.28;
        const len=(side==='east'||side==='west')? size*0.12 : h*0.55;
        g.push(
          <g key="ladder" opacity={0.9}>
            <line x1={lx-2} y1={ly} x2={lx-2} y2={ly+len} stroke="#4c4c4c" strokeWidth={0.55}/>
            <line x1={lx+2} y1={ly} x2={lx+2} y2={ly+len} stroke="#4c4c4c" strokeWidth={0.55}/>
            {[0.25,0.5,0.75].map(k => <line key={k} x1={lx-2} y1={ly+len*k} x2={lx+2} y2={ly+len*k} stroke="#6a6a6a" strokeWidth={0.45}/>)}
          </g>
        );
        return <g key="hardware">{g}</g>;
      })()}

      {/* Harbor buildings with better rendering and variation */}
      {(() => {
        const { x0, y0, w, h, side } = quay;
        const count = staticValues.warehouseCount;
        const items: JSX.Element[] = [];
        
        for (let i=0;i<count;i++){
          const t=(i+0.5)/count; // Better spacing
          const sizeVar = 0.8 + (staticValues.boxPattern + i) * 0.1; // Size variation
          const bw=size*0.28 * sizeVar, bh=size*0.22 * sizeVar;
          const bx=x0 + w*t - bw/2;
          const by= side==='north'? y0 + h*0.44 : side==='south'? y0 + h*0.12 : y0 + h*0.3;

          // Better shadow with gradient
          items.push(
            <ellipse key={`shadow-${i}`} cx={bx + bw/2} cy={by + bh + 1} rx={bw/2} ry={2} fill="rgba(0,0,0,0.15)" filter={`url(#softBlur-${uniqueId})`}/>
          );

          // Building with better 3D effect
          const buildingColor = i % 2 === 0 ? '#f4ebe0' : '#e8dfd3';
          items.push(<path key={`shed-s-${i}`} d={sideQuad(bx,by,bw,bh,depth*0.8)} fill={shade(buildingColor, -20)} stroke="rgba(0,0,0,0.4)" strokeWidth={0.6}/>);
          items.push(<rect key={`shed-f-${i}`} x={bx} y={by} width={bw} height={bh} fill={buildingColor} stroke="rgba(0,0,0,0.35)" strokeWidth={0.7} rx={1}/>);

          // Culture-specific roof styles with highlights
          const roofTint = culture.includes('asian') ? '#5d4a3b'
                         : culture.includes('mediterranean') || culture.includes('mena') ? '#c0744a'
                         : culture.includes('african') ? '#8a5d36'
                         : '#6f5859';
          const roofY = by - size*0.015, peak = size*0.1 * sizeVar;
          
          // Roof with highlight
          items.push(<path key={`roof-${i}`} d={`M ${bx - bw*0.05} ${roofY} L ${bx + bw/2} ${roofY - peak} L ${bx + bw*1.05} ${roofY} Z`} fill={roofTint} stroke="rgba(0,0,0,0.5)" strokeWidth={0.7}/>);
          items.push(<line key={`roof-h-${i}`} x1={bx + bw*0.1} y1={roofY - peak*0.7} x2={bx + bw*0.4} y2={roofY - peak*0.9} stroke={shade(roofTint, 30)} strokeWidth={0.8} opacity={0.6}/>);

          // Better doors and windows with depth
          const doorW = bw*0.16, doorH = bh*0.48;
          items.push(<rect key={`door-${i}`} x={bx + bw*0.1} y={by + bh - doorH} width={doorW} height={doorH} fill="#8a7660" stroke="#5a4630" strokeWidth={0.6}/>);
          items.push(<rect key={`door-h-${i}`} x={bx + bw*0.12} y={by + bh - doorH + 2} width={doorW - 2} height={2} fill="#6a5640" opacity={0.6}/>);
          
          // Multiple windows for larger buildings
          if (sizeVar > 0.9) {
            items.push(<rect key={`win1-${i}`} x={bx + bw*0.35} y={by + bh*0.25} width={bw*0.12} height={bh*0.2} fill="#a0c4e4" stroke="rgba(0,0,0,0.3)" strokeWidth={0.5}/>);
            items.push(<rect key={`win2-${i}`} x={bx + bw*0.55} y={by + bh*0.25} width={bw*0.12} height={bh*0.2} fill="#a0c4e4" stroke="rgba(0,0,0,0.3)" strokeWidth={0.5}/>);
            items.push(<rect key={`win3-${i}`} x={bx + bw*0.75} y={by + bh*0.25} width={bw*0.12} height={bh*0.2} fill="#a0c4e4" stroke="rgba(0,0,0,0.3)" strokeWidth={0.5}/>);
          } else {
            items.push(<rect key={`win-${i}`} x={bx + bw*0.65} y={by + bh*0.3} width={bw*0.15} height={bh*0.22} fill="#a0c4e4" stroke="rgba(0,0,0,0.3)" strokeWidth={0.5}/>);
          }
          
          // Add chimney for some buildings
          if (i % 2 === 1) {
            items.push(<rect key={`chimney-${i}`} x={bx + bw*0.8} y={by - peak*0.8} width={bw*0.08} height={peak*0.9} fill="#7a6a5a" stroke="rgba(0,0,0,0.4)" strokeWidth={0.5}/>);
          }
        }
        return <g key="sheds">{items}</g>;
      })()}

      {/* Simple era gear—tidy, not stacked */}
      {renderEraGear(quay, size, era, uniqueId)}
    </g>
  );

  // ----------------------- EXTENDING DOCKS (not clipped) ---------------------
  const dockRects = buildExtendingDocks(x, y, size, dockStyle, staticValues, uniqueId, culture);
  els.push(dockRects.group);

  // ----------------------- BOATS (moored PARALLEL, in water) -----------------
  els.push(renderMooredBoats(dockRects.rects, x, y, size, staticValues, era, culture, uniqueId, animTick));

  return <>{els}</>;
});

export default HarborDistrictSymbol;

// ----------------------------- Era gear (tidy) -------------------------------

function renderEraGear(
  quay: {x0:number;y0:number;w:number;h:number;side:Dir},
  size:number,
  era: HistoricalEra | undefined,
  uid: string
){
  const {x0,y0,w,h,side} = quay;
  const g: JSX.Element[] = [];

  if (era === HistoricalEra.INDUSTRIAL_ERA) {
    // one set of rails + one steam crane (less clutter)
    if (side === 'north' || side === 'south') {
      g.push(
        <g key="rails" opacity={0.9}>
          <line x1={x0 + size*0.08} y1={y0 + h*0.38} x2={x0 + w - size*0.08} y2={y0 + h*0.38} stroke="#454545" strokeWidth={1.4}/>
          <line x1={x0 + size*0.08} y1={y0 + h*0.51} x2={x0 + w - size*0.08} y2={y0 + h*0.51} stroke="#454545" strokeWidth={1.4}/>
        </g>
      );
    } else {
      g.push(
        <g key="rails-v" opacity={0.9}>
          <line x1={x0 + w*0.38} y1={y0 + size*0.08} x2={x0 + w*0.38} y2={y0 + h - size*0.08} stroke="#454545" strokeWidth={1.4}/>
          <line x1={x0 + w*0.51} y1={y0 + size*0.08} x2={x0 + w*0.51} y2={y0 + h - size*0.08} stroke="#454545" strokeWidth={1.4}/>
        </g>
      );
    }
    const cx = x0 + w*0.63, cy = y0 + h*0.36;
    g.push(
      <g key="steam-crane" filter={`url(#softShadow-${uid})`}>
        <rect x={cx - size*0.03} y={cy - size*0.02} width={size*0.06} height={size*0.08} fill="#585858" stroke="#303030" strokeWidth={1}/>
        <rect x={cx - size*0.01} y={cy - size*0.05} width={size*0.02} height={size*0.03} fill="#2f2f2f"/>
        <line x1={cx} y1={cy - size*0.02} x2={cx + size*0.15} y2={cy - size*0.1} stroke="#303030" strokeWidth={3}/>
        <line x1={cx + size*0.15} y1={cy - size*0.1} x2={cx + size*0.15} y2={cy - size*0.04} stroke="#202020" strokeWidth={1.1}/>
      </g>
    );
  } else if (era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA) {
    // neat container stacks + small gantry hint
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];
    for (let c=0;c<2;c++){
      const cx = x0 + w*(0.18 + c*0.26);
      for (let r=0;r<2;r++){
        const cy = y0 + h*(0.3 + r*0.24);
        g.push(<rect key={`cont-${c}-${r}`} x={cx - size*0.06} y={cy - size*0.015} width={size*0.12} height={size*0.03} fill={colors[(c+r)%colors.length]} stroke="#3f3f3f" strokeWidth={0.55} rx={1.5}/>);
      }
    }
    const gx = x0 + w*0.72, gy = y0 + size*0.02;
    g.push(<g key="gantry"><rect x={gx} y={gy} width={size*0.02} height={size*0.12} fill="#4a5568"/><rect x={gx - size*0.12} y={gy - size*0.016} width={size*0.14} height={size*0.02} fill="#4a5568"/><line x1={gx - size*0.05} y1={gy + size*0.02} x2={gx - size*0.05} y2={gy + size*0.08} stroke="#1a202c" strokeWidth={1}/></g>);
  } else if (era === HistoricalEra.MEDIEVAL || era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
    const cx = x0 + w*0.62, cy = y0 + h*0.38;
    g.push(
      <g key="treadwheel">
        <rect x={cx - size*0.02} y={cy - size*0.01} width={size*0.04} height={size*0.06} fill="#a07c4a" stroke="#5a3a04" strokeWidth={0.7}/>
        <line x1={cx} y1={cy - size*0.01} x2={cx + size*0.12} y2={cy - size*0.08} stroke="#5a3a04" strokeWidth={2}/>
        <circle cx={cx} cy={cy + size*0.015} r={size*0.018} fill="none" stroke="#5a3a04" strokeWidth={1}/>
        <line x1={cx + size*0.12} y1={cy - size*0.08} x2={cx + size*0.12} y2={cy - size*0.03} stroke="#2e2e2e" strokeWidth={1.1}/>
      </g>
    );
  } else {
    // Ancient/Classical: a couple cargo piles—clean
    [0.33,0.66].forEach((t,i)=> {
      g.push(<rect key={`blk-${i}`} x={x0 + w*t - size*0.03} y={y0 + h*0.66} width={size*0.06} height={size*0.03} fill="#9a8a7a" stroke="#6f5f50" strokeWidth={0.55}/>);
    });
  }
  return <g key="gear">{g}</g>;
}

// ------------------------- Docks (return rects for boats) --------------------

function buildExtendingDocks(
  x:number, y:number, size:number,
  dockStyle:{color:string; stroke:string; width:number},
  sv:{hasWaterNorth:boolean; hasWaterSouth:boolean; hasWaterEast:boolean; hasWaterWest:boolean},
  uid:string,
  culture:string
){
  const rects: {dir:Dir; x:number;y:number;w:number;h:number}[] = [];
  const g: JSX.Element[] = [];
  const add = (dir:Dir, dx:number, dy:number, w:number, h:number) => {
    rects.push({dir, x:dx, y:dy, w, h});
    g.push(
      <g key={`dock-${dir}`} filter={`url(#softShadow-${uid})`}>
        <rect x={dx} y={dy} width={w} height={h} fill={dockStyle.color} stroke={dockStyle.stroke} strokeWidth={0.9} rx={1.2}/>
      </g>
    );
  };

  if (sv.hasWaterNorth) add('north', x + size*0.46, y - size*0.5, size*dockStyle.width, size*0.55);
  if (sv.hasWaterSouth) add('south', x + size*0.46, y + size*0.95, size*dockStyle.width, size*0.55);
  if (sv.hasWaterEast)  add('east',  x + size*0.95, y + size*0.46, size*0.55, size*dockStyle.width);
  if (sv.hasWaterWest)  add('west',  x - size*0.55, y + size*0.46, size*0.55, size*dockStyle.width);

  // optional cultural ornament: lantern on asian docks (clean, just one)
  if (culture.includes('asian')) {
    const lantern = (lx:number, ly:number, key:string) => (
      <g key={`lantern-${key}`} filter={`url(#softShadow-${uid})`}>
        <rect x={lx - size*0.012} y={ly - size*0.018} width={size*0.024} height={size*0.036} fill="#e95858" stroke="#8b0000" strokeWidth={0.6} rx={1.2}/>
        <circle cx={lx} cy={ly - size*0.024} r={size*0.006} fill="#ffd966" opacity={0.85}/>
      </g>
    );
    if (sv.hasWaterNorth) g.push(lantern(x + size*0.5, y - size*0.18, 'n'));
    if (sv.hasWaterSouth) g.push(lantern(x + size*0.5, y + size*1.18, 's'));
    if (sv.hasWaterEast)  g.push(lantern(x + size*1.18, y + size*0.5, 'e'));
    if (sv.hasWaterWest)  g.push(lantern(x - size*0.18, y + size*0.5, 'w'));
  }

  return { rects, group: <g key="extending-docks">{g}</g> };
}

// --------------------- Boats (moored parallel to dock) -----------------------

function renderMooredBoats(
  docks: {dir:Dir; x:number;y:number;w:number;h:number}[],
  x:number, y:number, size:number,
  sv:{shipCount:number},
  era: HistoricalEra | undefined,
  culture: string,
  uid:string,
  animTick: number
){
  const boats: JSX.Element[] = [];
  if (!docks.length) return <g key="boats"/>;

  // place boats alongside dock faces on the WATER side
  const n = Math.max(1, sv.shipCount);
  for (let i=0;i<n;i++){
    const d = docks[i % docks.length];
    const along = 0.70 - (n>1 ? (0.4*(n-1)/2 - 0.4*i) : 0); // spread along the dock
    let cx = d.x, cy = d.y;
    
    // Boats should ALWAYS be horizontal (rot = 0) regardless of dock orientation
    const rot = 0; // Always horizontal orientation for realistic boats
    
    // Gentle bobbing animation
    const bobOffset = Math.sin((animTick * 0.1) + (i * Math.PI / 2)) * 1.5;
    const swayAngle = Math.sin((animTick * 0.08) + (i * Math.PI / 3)) * 2;

    if (d.dir === 'north' || d.dir === 'south') {
      // vertical dock → boat to the side of dock
      cx = d.x + d.w + size*0.08;          // clearance from dock edge
      cy = d.y + d.h * along + bobOffset;  // Add bobbing
    } else {
      // horizontal dock → boat below/above dock
      cx = d.x + d.w * along;
      cy = (d.dir === 'north' ? d.y - size*0.08 : d.y + d.h + size*0.08) + bobOffset;
    }

    // small mooring line to the dock edge (stretches with boat motion)
    const line = (d.dir === 'north' || d.dir === 'south')
      ? <line x1={cx - size*0.06} y1={cy} x2={d.x + d.w} y2={d.y + d.h * along} stroke="rgba(0,0,0,0.35)" strokeWidth={0.6}/>
      : <line x1={cx} y1={cy - size*0.05} x2={d.x + d.w * along} y2={d.y + d.h} stroke="rgba(0,0,0,0.35)" strokeWidth={0.6}/>;

    boats.push(
      <g key={`m-boat-${i}`} filter={`url(#softShadow-${uid})`}>
        {line}
        <g transform={`rotate(${swayAngle} ${cx} ${cy})`}>
          {renderBoatVariant(`boat-${i}`, cx, cy, rot, size, era, culture, uid)}
        </g>
      </g>
    );
  }
  return <g key="boats">{boats}</g>;
}

// --------------------- Culture/Era boat variants (clean palettes) ------------

function boatWake(w:number){ return <path d={`M ${-w*0.35},${w*0.05} Q 0,${w*0.14} ${w*0.35},${w*0.05}`} fill="none" stroke="rgba(170,210,255,0.35)" strokeWidth={1.1} />; }

function triremeBoat(key:string, cx:number, cy:number, rot:number, size:number, uid:string){
  const w = size*0.22, h = size*0.05;
  return (
    <g key={key} transform={`translate(${cx},${cy}) rotate(${rot})`} >
      <defs>
        <linearGradient id={`triHull-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c88946"/><stop offset="100%" stopColor="#8a5530"/>
        </linearGradient>
      </defs>
      <path d={`M ${-w/2},0 L ${w/2},0 L ${w*0.36},${h} L ${-w*0.36},${h} Z`} fill={`url(#triHull-${uid})`} stroke="#6a3f1f" strokeWidth={0.9}/>
      <rect x={-w*0.4} y={h*0.15} width={w*0.8} height={h*0.18} fill="#a3473a" opacity={0.7}/>
      <rect x={-w*0.08} y={-h*1.45} width={w*0.16} height={h*1.15} fill="#efe5cf" stroke="#c4b99f" strokeWidth={0.8}/>
      <line x1={0} y1={0} x2={0} y2={-h*1.55} stroke="#6a3f1f" strokeWidth={1.1}/>
      {boatWake(w)}
    </g>
  );
}
function longshipBoat(key:string, cx:number, cy:number, rot:number, size:number, uid:string){
  const w=size*0.22, h=size*0.048;
  return (
    <g key={key} transform={`translate(${cx},${cy}) rotate(${rot})`}>
      <defs>
        <linearGradient id={`longHull-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a4744d"/><stop offset="100%" stopColor="#6c4428"/>
        </linearGradient>
      </defs>
      <path d={`M ${-w/2},0 L ${w/2},0 L ${w*0.33},${h} L ${-w*0.33},${h} Z`} fill={`url(#longHull-${uid})`} stroke="#4e2e1b" strokeWidth={0.9}/>
      <rect x={-w*0.09} y={-h*1.35} width={w*0.18} height={h*1.05} fill="#fff5f2" stroke="#caa" strokeWidth={0.8}/>
      <line x1={-w*0.09} y1={-h*1.1} x2={w*0.09} y2={-h*1.1} stroke="#d05a5a" strokeWidth={1.8}/>
      <line x1={0} y1={0} x2={0} y2={-h*1.5} stroke="#4e2e1b" strokeWidth={1.1}/>
      {boatWake(w)}
    </g>
  );
}
function caravelBoat(key:string, cx:number, cy:number, rot:number, size:number, uid:string){
  const w=size*0.2, h=size*0.046;
  return (
    <g key={key} transform={`translate(${cx},${cy}) rotate(${rot})`}>
      <path d={`M ${-w/2},0 L ${w/2},0 L ${w*0.34},${h} L ${-w*0.34},${h} Z`} fill="#7c5236" stroke="#3f2416" strokeWidth={0.9}/>
      <path d={`M 0,${-h*1.45} Q ${w*0.1},${-h*0.7} 0,0`} fill="#ede1c8" stroke="#c7b48f" strokeWidth={0.8}/>
      <path d={`M ${-w*0.06},${-h*1.05} Q ${w*0.02},${-h*0.5} ${-w*0.06},0`} fill="#f3ead7" stroke="#c7b48f" strokeWidth={0.8}/>
      {boatWake(w)}
    </g>
  );
}
function dhowBoat(key:string, cx:number, cy:number, rot:number, size:number, uid:string){
  const w=size*0.22, h=size*0.055;
  return (
    <g key={key} transform={`translate(${cx},${cy}) rotate(${rot})`}>
      <path d={`M ${-w/2},0 L ${w/2},0 L ${w*0.32},${h} L ${-w*0.36},${h} Z`} fill="#94623f" stroke="#4a2e1c" strokeWidth={0.9}/>
      <line x1={-w*0.1} y1={0} x2={-w*0.1} y2={-h*1.75} stroke="#4a2e1c" strokeWidth={1.1}/>
      <path d={`M ${-w*0.1},${-h*1.75} Q ${w*0.28},${-h*1.35} ${-w*0.1},0`} fill="#efe7d3" stroke="#c0b391" strokeWidth={0.9}/>
      {boatWake(w)}
    </g>
  );
}
function junkBoat(key:string, cx:number, cy:number, rot:number, size:number, uid:string, hull='#6a4a35'){
  const w=size*0.21, h=size*0.055;
  return (
    <g key={key} transform={`translate(${cx},${cy}) rotate(${rot})`}>
      <path d={`M ${-w/2},0 L ${w/2},0 L ${w*0.34},${h} L ${-w*0.32},${h} Z`} fill={hull} stroke="#2a1c15" strokeWidth={0.9}/>
      <path d={`M ${-w*0.05},${-h*1.65} L ${w*0.08},${-h*0.9} L ${-w*0.05},0 Z`} fill="#d1a37e" stroke="#a17a5d" strokeWidth={0.8}/>
      <path d={`M ${w*0.02},${-h*1.2} L ${w*0.17},${-h*0.55} L ${w*0.02},0 Z`} fill="#c89a74" stroke="#a17a5d" strokeWidth={0.8}/>
      {boatWake(w)}
    </g>
  );
}
function pirogueBoat(key:string, cx:number, cy:number, rot:number, size:number, uid:string, hasSail:boolean){
  const w=size*0.17, h=size*0.042;
  return (
    <g key={key} transform={`translate(${cx},${cy}) rotate(${rot})`}>
      <path d={`M ${-w/2},0 L ${w/2},0 L ${w*0.28},${h} L ${-w*0.28},${h} Z`} fill="#b57f41" stroke="#5a3a1e" strokeWidth={0.85}/>
      {hasSail && <path d={`M 0,${-h*1.15} Q ${w*0.12},${-h*0.48} 0,0`} fill="#efe0c9" stroke="#c4b48f" strokeWidth={0.8}/>}
      {boatWake(w)}
    </g>
  );
}
function pirogueMotorBoat(key:string, cx:number, cy:number, rot:number, size:number){
  const w=size*0.18, h=size*0.042;
  return (
    <g key="pi-motor" transform={`translate(${cx},${cy}) rotate(${rot})`}>
      <path d={`M ${-w/2},0 L ${w/2},0 L ${w*0.3},${h} L ${-w*0.3},${h} Z`} fill="#c08a43" stroke="#5a3a1e" strokeWidth={0.85}/>
      <rect x={-w*0.08} y={-h*0.55} width={w*0.16} height={h*0.55} fill="#f4f4f4" stroke="#a3a3a3" strokeWidth={0.7}/>
      <circle cx={w*0.28} cy={h*0.2} r={h*0.18} fill="#2a2a2a"/>
      {boatWake(w)}
    </g>
  );
}
function tugBoat(key:string, cx:number, cy:number, rot:number, size:number, uid:string, hull='#d24646'){
  const w=size*0.2, h=size*0.055;
  return (
    <g key={key} transform={`translate(${cx},${cy}) rotate(${rot})`}>
      <path d={`M ${-w/2},0 L ${w/2},0 L ${w*0.38},${h} L ${-w*0.34},${h} Z`} fill={hull} stroke="#732c2c" strokeWidth={0.9}/>
      <rect x={-w*0.1} y={-h*0.7} width={w*0.2} height={h*0.7} fill="#e7e7e7" stroke="#9aa3ad" strokeWidth={0.7}/>
      <circle cx={-w*0.02} cy={-h*0.35} r={h*0.15} fill="#9ec5e6" stroke="#7ea7cc" strokeWidth={0.55}/>
      {boatWake(w)}
    </g>
  );
}
function trawlerBoat(key:string, cx:number, cy:number, rot:number, size:number, stripe='#2c6a7c'){
  const w=size*0.2, h=size*0.055;
  return (
    <g key={key} transform={`translate(${cx},${cy}) rotate(${rot})`}>
      <path d={`M ${-w/2},0 L ${w/2},0 L ${w*0.36},${h} L ${-w*0.32},${h} Z`} fill="#e8e8e8" stroke="#9aa3ad" strokeWidth={0.85}/>
      <rect x={-w*0.1} y={-h*0.72} width={w*0.2} height={h*0.72} fill="#f6f6f6" stroke="#a3a3a3" strokeWidth={0.7}/>
      <rect x={-w*0.12} y={h*0.02} width={w*0.24} height={h*0.18} fill={stripe} opacity={0.92}/>
      {boatWake(w)}
    </g>
  );
}
function coastalFeederShip(key:string, cx:number, cy:number, rot:number, size:number, uid:string, hull='#2f63a6'){
  const w=size*0.24, h=size*0.06;
  return (
    <g key={key} transform={`translate(${cx},${cy}) rotate(${rot})`}>
      <path d={`M ${-w/2},0 L ${w/2},0 L ${w*0.4},${h} L ${-w*0.36},${h} Z`} fill={hull} stroke="#1e3e6a" strokeWidth={0.85}/>
      <rect x={-w*0.11} y={-h*0.78} width={w*0.22} height={h*0.78} fill="#f2f2f2" stroke="#a3a3a3" strokeWidth={0.7}/>
      <rect x={-w*0.06} y={-h*0.25} width={w*0.12} height={h*0.2} fill="#ff6b6b"/><rect x={w*0.02} y={-h*0.25} width={w*0.12} height={h*0.2} fill="#45b7d1"/>
      {boatWake(w)}
    </g>
  );
}

// Dispatcher with culture/era logic (same idea as before, just passes uid for gradients)
function renderBoatVariant(
  key:string, cx:number, cy:number, rotation:number, size:number,
  era: HistoricalEra | undefined, culture: string, uid:string
){
  const C = culture.toLowerCase();
  if (era === HistoricalEra.ANTIQUITY || era === HistoricalEra.ANTIQUITY) {
    if (C.includes('mediterranean') || C.includes('mena')) return triremeBoat(key,cx,cy,rotation,size,uid);
    if (C.includes('asian')) return junkBoat(key,cx,cy,rotation,size,uid,'#805a3f');
    if (C.includes('northern') || C.includes('europe')) return longshipBoat(key,cx,cy,rotation,size,uid);
    if (C.includes('african')) return pirogueBoat(key,cx,cy,rotation,size,uid,true);
    return caravelBoat(key,cx,cy,rotation,size,uid);
  }
  if (era === HistoricalEra.MEDIEVAL || era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
    if (C.includes('asian')) return junkBoat(key,cx,cy,rotation,size,uid);
    if (C.includes('mediterranean') || C.includes('mena')) return dhowBoat(key,cx,cy,rotation,size,uid);
    if (C.includes('northern') || C.includes('europe')) return caravelBoat(key,cx,cy,rotation,size,uid);
    if (C.includes('african')) return pirogueBoat(key,cx,cy,rotation,size,uid,false);
    return caravelBoat(key,cx,cy,rotation,size,uid);
  }
  if (era === HistoricalEra.INDUSTRIAL_ERA) {
    if (C.includes('american') || C.includes('northern') || C.includes('europe')) return tugBoat(key,cx,cy,rotation,size,uid);
    return trawlerBoat(key,cx,cy,rotation,size);
  }
  if (era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA) {
    if (C.includes('asian')) return coastalFeederShip(key,cx,cy,rotation,size,uid,'#2f6aa6');
    if (C.includes('mediterranean') || C.includes('mena')) return trawlerBoat(key,cx,cy,rotation,size,'#2d6a6d');
    if (C.includes('american')) return tugBoat(key,cx,cy,rotation,size,uid,'#d23d3d');
    if (C.includes('african')) return pirogueMotorBoat(key,cx,cy,rotation,size);
    return coastalFeederShip(key,cx,cy,rotation,size,uid,'#3f63aa');
  }
  return caravelBoat(key,cx,cy,rotation,size,uid);
}
