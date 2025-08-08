/**
 * components/symbols/buildings/PolynesianHouse3D.tsx
 * Clean, readable 2.5D Polynesian stilt house with opaque roof and minimal detail.
 * Auto-scales by biome (hamlet < low density < dense/city center).
 */
import React from 'react';
import { Tile, HistoricalEra, BiomeType } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface PolynesianHouse3DProps {
  x: number;
  y: number;
  width: number;
  height: number;
  size: number;
  seed: number;
  tile: Tile;
  roofColor: string;
  era: HistoricalEra;
}

const PolynesianHouse3D: React.FC<PolynesianHouse3DProps> = React.memo(
  ({ x, y, width, height, size, seed, tile, roofColor }) => {
    // ---- Biome scaling (smaller in hamlets/low density) ---------------------
    let scale = 1;
    switch (tile.biome) {
      case BiomeType.HAMLET: scale = 0.75; break;
      case BiomeType.LOW_DENSITY_CITY: scale = 0.85; break;
      default: scale = 1; break;
    }

    // ---- RNG (subtle, but pre-sampled) --------------------------------------
    const noise = new ValueNoise(seed + tile.x * 11 + tile.y * 23);
    const rvals = React.useMemo(() => Array.from({ length: 8 }, () => noise.random()), []); // eslint-disable-line
    const uid = `poly-simpler-${tile.x}-${tile.y}-${seed}`;

    // ---- Palette -------------------------------------------------------------
    const bamboo = `hsl(50, 30%, ${48 + rvals[0] * 8}%)`;
    const bambooDeep = `hsl(46, 28%, 32%)`;
    const wood = `hsl(28, 34%, 26%)`;
    const wallMat = `hsl(38, 32%, ${50 + rvals[1] * 6}%)`;
    const wallShade = `hsl(36, 28%, 40%)`;

    // Roof: opaque thatch based on provided color; darker side variant
    const thatchMain = roofColor || `hsl(${36 + rvals[2] * 8}, 44%, 44%)`;
    const thatchSideDark = `hsl(36, 42%, 30%)`;

    // ---- Geometry (simple 2.5D to the right) --------------------------------
    const depth = size * 0.24 * scale;   // right-side iso wedge
    const bodyW = width * 1.0 * scale;
    const bodyH = height * 0.56 * scale;
    const stiltsH = size * 0.16 * scale;
    const deckT = Math.max(3, size * 0.035 * scale);

    const bodyX = x + (width - bodyW) / 2;
    const bodyY = y + height - (bodyH + stiltsH);

    // Roof
    const roofY = bodyY + bodyH * 0.08;
    const roofH = Math.max(12 * scale, bodyH * 0.46);
    const roofOver = size * 0.06 * scale;

    // Door (centered)
    const doorW = Math.max(10 * scale, bodyW * 0.22);
    const doorH = Math.max(16 * scale, bodyH * 0.36);
    const doorX = bodyX + bodyW / 2 - doorW / 2;
    const doorY = bodyY + bodyH - doorH;

    // ---- Helpers -------------------------------------------------------------
    const sideQuad = (x0: number, y0: number, w: number, h: number, d = depth) =>
      `M ${x0 + w} ${y0} L ${x0 + w + d} ${y0 - d * 0.5} L ${x0 + w + d} ${y0 + h - d * 0.5} L ${x0 + w} ${y0 + h} Z`;

    // Roof polygons (front + side) – fully opaque
    const roofFront = `M ${bodyX - roofOver} ${roofY}
      L ${bodyX + bodyW / 2} ${roofY - roofH}
      L ${bodyX + bodyW + roofOver} ${roofY}
      Z`;
    const roofSide = `M ${bodyX + bodyW + roofOver} ${roofY}
      L ${bodyX + bodyW + roofOver + depth} ${roofY - depth * 0.5}
      L ${bodyX + bodyW / 2 + depth * 0.5} ${roofY - roofH - depth * 0.3}
      L ${bodyX + bodyW / 2} ${roofY - roofH}
      Z`;

    // ---- Build ---------------------------------------------------------------
    const els: JSX.Element[] = [];

    // Ground shadow (single, soft)
    els.push(
      <ellipse
        key="shadow"
        cx={bodyX + bodyW * 0.55}
        cy={y + height + depth * 0.08}
        rx={Math.max(12, bodyW * 0.66)}
        ry={Math.max(6, bodyH * 0.26)}
        fill="rgba(0,0,0,0.22)"
        filter={`url(#soft-${uid})`}
      />
    );

    // Stilts (4 posts, simple)
    const postXs = [bodyX + bodyW * 0.15, bodyX + bodyW * 0.45, bodyX + bodyW * 0.55, bodyX + bodyW * 0.85];
    for (let i = 0; i < postXs.length; i++) {
      const px = postXs[i];
      const py = bodyY + bodyH + deckT;
      els.push(
        <rect key={`stilt-${i}`} x={px - 1.6} y={py} width={3.2} height={stiltsH} fill={bamboo} stroke={wood} strokeWidth={0.6} />
      );
      // slight side duplicate for isometric feel
      els.push(
        <rect
          key={`stilt-side-${i}`}
          x={px - 1.6 + depth * 0.1}
          y={py - depth * 0.05}
          width={3}
          height={stiltsH}
          fill={bambooDeep}
          opacity={0.9}
        />
      );
    }

    // Deck (front + side)
    els.push(
      <rect
        key="deck-front"
        x={bodyX}
        y={bodyY + bodyH}
        width={bodyW}
        height={deckT}
        fill={`url(#deck-${uid})`}
        stroke={wood}
        strokeWidth={0.8}
      />
    );
    els.push(
      <path
        key="deck-side"
        d={sideQuad(bodyX, bodyY + bodyH, bodyW, deckT)}
        fill={bambooDeep}
        stroke={wood}
        strokeWidth={0.7}
        opacity={0.95}
      />
    );

    // Wall (front + side) — **no extraneous slats/ornaments**
    els.push(
      <rect
        key="wall-front"
        x={bodyX}
        y={bodyY}
        width={bodyW}
        height={bodyH}
        fill={`url(#mat-${uid})`}
        stroke={wood}
        strokeWidth={0.8}
      />
    );
    els.push(
      <path
        key="wall-side"
        d={sideQuad(bodyX, bodyY, bodyW, bodyH)}
        fill={wallShade}
        stroke={wood}
        strokeWidth={0.7}
        opacity={0.96}
      />
    );

    // Door (single dark opening)
    els.push(
      <rect
        key="door"
        x={doorX}
        y={doorY}
        width={doorW}
        height={doorH}
        fill="rgba(15,15,20,0.85)"
        stroke={wood}
        strokeWidth={0.8}
        rx={2 * scale}
      />
    );

    // Roof — **opaque**, simple eave line
    els.push(
      <path key="roof-front" d={roofFront} fill={thatchMain} stroke={wood} strokeWidth={0.9} />
    );
    els.push(
      <path key="roof-side" d={roofSide} fill={thatchSideDark} stroke={wood} strokeWidth={0.9} />
    );
    els.push(
      <line
        key="eave"
        x1={bodyX - roofOver + 4}
        y1={roofY - 1}
        x2={bodyX + bodyW + roofOver - 4}
        y2={roofY - 1}
        stroke="rgba(0,0,0,0.28)"
        strokeWidth={1.4}
      />
    );

    // Short ladder (tiny, not fussy) — optional, 50%
    if (rvals[3] > 0.5) {
      const lx = doorX + doorW * 0.15;
      const top = bodyY + bodyH + 1;
      const bottom = top + stiltsH * 0.6;
      els.push(<line key="ladder-L" x1={lx} y1={top} x2={lx - 8 * scale} y2={bottom} stroke={wood} strokeWidth={1.1} />);
      els.push(<line key="ladder-R" x1={lx + 10 * scale} y1={top} x2={lx + 2 * scale} y2={bottom} stroke={wood} strokeWidth={1.1} />);
      for (let i = 0; i < 3; i++) {
        const ry = top + (i / 2) * (bottom - top);
        els.push(<line key={`r${i}`} x1={lx + 10 * (1 - i / 2) * scale} y1={ry} x2={lx + 2 * (1 - i / 2) * scale} y2={ry} stroke={bambooDeep} strokeWidth={1} />);
      }
    }

    return (
      <g filter="url(#symbolShadow)">
        <defs>
          {/* soft shadow */}
          <filter id={`soft-${uid}`} x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="3.0" />
          </filter>

          {/* deck planks (subtle, fully opaque) */}
          <pattern id={`deck-${uid}`} patternUnits="userSpaceOnUse" width="10" height="4">
            <rect width="10" height="4" fill={bamboo} />
            <rect x="0" y="2" width="10" height="1" fill={bambooDeep} opacity="0.35" />
          </pattern>

          {/* simple woven wall (opaque) */}
          <pattern id={`mat-${uid}`} patternUnits="userSpaceOnUse" width="6" height="6">
            <rect width="6" height="6" fill={wallMat} />
            <rect x="0" y="3" width="6" height="1" fill={wallShade} opacity="0.25" />
            <rect x="3" y="0" width="1" height="6" fill={wallShade} opacity="0.22" />
          </pattern>
        </defs>

        {els}
      </g>
    );
  }
);

export default PolynesianHouse3D;
