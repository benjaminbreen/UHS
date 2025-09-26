/**
 * components/symbols/buildings/EastAsianPagoda3D.tsx
 * Cleaner 2.5D pagoda with RIGHT-side depth, thinner strokes, steeper roofs,
 * proper draw order, and tile clipping so no element spills over neighbors.
 */
import React from 'react';
import { Tile, HistoricalEra, BiomeType } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface EastAsianPagoda3DProps {
  x: number;
  y: number;
  width: number;   // kept for compatibility
  height: number;  // kept for compatibility
  size: number;
  seed: number;
  tile: Tile;
  era: HistoricalEra;
}

const getEraLevel = (era: HistoricalEra): number => {
  switch (era) {
    case HistoricalEra.PREHISTORY: return 0;
    case HistoricalEra.ANTIQUITY: return 1;
    case HistoricalEra.MEDIEVAL: return 2;
    case HistoricalEra.RENAISSANCE_EARLY_MODERN: return 3;
    case HistoricalEra.INDUSTRIAL_ERA: return 4;
    case HistoricalEra.MODERN_ERA: return 5;
    case HistoricalEra.FUTURE_ERA: return 6;
    default: return 2;
  }
};

const EastAsianPagoda3D: React.FC<EastAsianPagoda3DProps> = React.memo(
  ({ x, y, size, era, seed, tile }) => {
    const eraLevel = getEraLevel(era);

    // Stable RNG
    const rng = new ValueNoise(seed + tile.x * 313 + tile.y * 317);
    const rand = () => rng.random();

    // Determine building scale and tiers based on density - increased overall size
    let scaleFactor = 1.3; // Base increased from 1.0
    let tiers = 3;
    let isHumbleDwelling = false;
    
    if (tile.biome === BiomeType.CITY_CENTER) {
      tiers = 5;
      scaleFactor = 1.6; // Increased from 1.15
    } else if (tile.biome === BiomeType.HIGH_DENSITY_URBAN) {
      tiers = 4;
      scaleFactor = 1.4; // Increased from 0.95
    } else if (tile.biome === BiomeType.LOW_DENSITY_URBAN) {
      tiers = rand() > 0.5 ? 2 : 3;
      scaleFactor = 1.1 + rand() * 0.15; // Increased from 0.75-0.9 to 1.1-1.25
    } else {
      // Hamlet or rural areas - mix of humble dwellings and small pagodas
      if (rand() > 0.6) {
        // Small humble dwelling/hut
        tiers = 1;
        scaleFactor = 0.8 + rand() * 0.2; // Increased from 0.45-0.65 to 0.8-1.0
        isHumbleDwelling = true;
      } else {
        // Small pagoda
        tiers = rand() > 0.5 ? 1 : 2;
        scaleFactor = 0.9 + rand() * 0.15; // Increased from 0.55-0.7 to 0.9-1.05
      }
    }

    const uid = `pagoda-${tile.x}-${tile.y}-${seed}`;

    // Palette with more variation
    const wallVariant = rand();
    const wallLight = isHumbleDwelling
      ? `hsl(${36 + wallVariant * 10}, ${25 + wallVariant * 10}%, ${70 + wallVariant * 10}%)`
      : `hsl(${36 + wallVariant * 8}, ${35 + wallVariant * 10}%, ${77 + wallVariant * 10}%)`;
    const wallMid   = isHumbleDwelling
      ? `hsl(${34 + wallVariant * 10}, ${23 + wallVariant * 8}%, ${55 + wallVariant * 10}%)`
      : `hsl(${34 + wallVariant * 8}, ${31 + wallVariant * 10}%, ${63 + wallVariant * 10}%)`;
    const wallDark  = isHumbleDwelling
      ? `hsl(${32 + wallVariant * 10}, ${20 + wallVariant * 8}%, ${43 + wallVariant * 10}%)`
      : `hsl(${32 + wallVariant * 8}, ${28 + wallVariant * 10}%, ${51 + wallVariant * 10}%)`;

    // More roof color variations
    const roofVariant = rand();
    const roofColors = isHumbleDwelling
      ? [ // Humble dwelling roofs: browns, grays
          `hsl(${25 + roofVariant * 15}, ${30 + roofVariant * 10}%, ${35 + roofVariant * 8}%)`,
          `hsl(0, 0%, ${35 + roofVariant * 15}%)`, // gray tiles
          `hsl(${30 + roofVariant * 10}, ${25 + roofVariant * 10}%, ${40 + roofVariant * 5}%)`
        ]
      : [ // Pagoda roofs: crimson, blue-gray, dark gray
          `hsl(${8 + roofVariant * 8}, ${60 + roofVariant * 10}%, ${42 + roofVariant * 6}%)`,
          `hsl(210, ${15 + roofVariant * 10}%, ${35 + roofVariant * 10}%)`, // blue-gray
          `hsl(0, 0%, ${30 + roofVariant * 10}%)` // dark gray
        ];
    const roofMain = roofColors[Math.floor(rand() * roofColors.length)];
    const roofDark  = isHumbleDwelling
      ? `hsl(25, 30%, 28%)`
      : `hsl(10, 58%, 34%)`;
    const outline   = 'hsl(12, 40%, 16%)'; // thinner strokes everywhere

    // Adjusted geometry with scaling - properly centered
    const adjustedSize = size * scaleFactor;
    const depth = adjustedSize * 0.22;                // right-side iso depth
    const bodyW = adjustedSize * 0.60;
    const bodyH = adjustedSize * (isHumbleDwelling ? 0.40 : 0.48);
    // Center the building properly within the tile
    const bodyX = x + (size - bodyW) / 2;
    const bodyY = y + (size - adjustedSize) / 2 + adjustedSize * 0.32;

    const doorW = adjustedSize * 0.10;
    const doorH = adjustedSize * 0.15;
    const doorOffset = (rand() - 0.5) * bodyW * 0.3; // Random door position

    const sideQuad = (x0: number, y0: number, w: number, h: number, d = depth) =>
      `M ${x0 + w} ${y0} L ${x0 + w + d} ${y0 - d * 0.5} L ${x0 + w + d} ${y0 + h - d * 0.5} L ${x0 + w} ${y0 + h} Z`;

    const gEls: JSX.Element[] = [];

    // 1) Ground shadow (drawn first, behind everything)
    gEls.push(
      <ellipse
        key="shadow"
        cx={x + size * 0.5}
        cy={y + (size - adjustedSize) / 2 + adjustedSize * 0.86}
        rx={adjustedSize * 0.34}
        ry={adjustedSize * 0.15}
        fill="rgba(0,0,0,0.22)"
        filter={`url(#soft-${uid})`}
      />
    );

    // 2) Body side (behind) then front
    gEls.push(
      <path
        key="body-side"
        d={sideQuad(bodyX, bodyY, bodyW, bodyH)}
        fill={`url(#wallSide-${uid})`}
        stroke={outline}
        strokeWidth={0.55}
        opacity={0.98}
      />
    );
    gEls.push(
      <rect
        key="body-front"
        x={bodyX}
        y={bodyY}
        width={bodyW}
        height={bodyH}
        fill={`url(#wallFront-${uid})`}
        stroke={outline}
        strokeWidth={0.6}
      />
    );

    // Door with position variation
    const isDoorDouble = rand() > 0.7 && !isHumbleDwelling;
    if (isDoorDouble) {
      // Double doors
      gEls.push(
        <g key="door-double">
          <rect
            x={bodyX + bodyW / 2 - doorW * 0.6 + doorOffset}
            y={bodyY + bodyH - doorH}
            width={doorW * 0.5}
            height={doorH}
            rx={size * 0.01}
            fill="rgba(15,15,20,0.85)"
            stroke={outline}
            strokeWidth={0.5}
          />
          <rect
            x={bodyX + bodyW / 2 + doorW * 0.1 + doorOffset}
            y={bodyY + bodyH - doorH}
            width={doorW * 0.5}
            height={doorH}
            rx={size * 0.01}
            fill="rgba(15,15,20,0.85)"
            stroke={outline}
            strokeWidth={0.5}
          />
        </g>
      );
    } else {
      // Single door
      gEls.push(
        <rect
          key="door"
          x={bodyX + bodyW / 2 - doorW / 2 + doorOffset}
          y={bodyY + bodyH - doorH}
          width={doorW}
          height={doorH}
          rx={size * 0.014}
          fill="rgba(15,15,20,0.85)"
          stroke={outline}
          strokeWidth={0.5}
        />
      );
    }

    // Add windows (simple dark rectangles)
    const windowW = adjustedSize * 0.06;
    const windowH = adjustedSize * 0.08;
    if (!isHumbleDwelling || rand() > 0.5) {
      // Left window
      gEls.push(
        <rect
          key="window-left"
          x={bodyX + bodyW * 0.2}
          y={bodyY + bodyH * 0.3}
          width={windowW}
          height={windowH}
          fill="rgba(20,20,25,0.7)"
          stroke={outline}
          strokeWidth={0.4}
        />
      );
      // Right window
      if (!isHumbleDwelling) {
        gEls.push(
          <rect
            key="window-right"
            x={bodyX + bodyW * 0.7}
            y={bodyY + bodyH * 0.3}
            width={windowW}
            height={windowH}
            fill="rgba(20,20,25,0.7)"
            stroke={outline}
            strokeWidth={0.4}
          />
        );
      }
    }

    // Add details for humble dwellings
    if (isHumbleDwelling) {
      // Add a small chimney
      if (rand() > 0.5) {
        gEls.push(
          <rect
            key="chimney"
            x={bodyX + bodyW * 0.75}
            y={bodyY - adjustedSize * 0.05}
            width={adjustedSize * 0.04}
            height={adjustedSize * 0.08}
            fill={wallDark}
            stroke={outline}
            strokeWidth={0.4}
          />
        );
      }
      // Add a small fence
      if (rand() > 0.6) {
        for (let i = 0; i < 3; i++) {
          gEls.push(
            <line
              key={`fence-${i}`}
              x1={bodyX - adjustedSize * 0.08 + i * adjustedSize * 0.04}
              y1={bodyY + bodyH}
              x2={bodyX - adjustedSize * 0.08 + i * adjustedSize * 0.04}
              y2={bodyY + bodyH - adjustedSize * 0.04}
              stroke={wallDark}
              strokeWidth={0.5}
              opacity={0.7}
            />
          );
        }
      }
    }

    // 3) Roof tiers: for each tier, draw side wedge first (behind), then front
    for (let t = 0; t < tiers; t++) {
      const stepY = t * 0.085;
      const roofY = bodyY - adjustedSize * (0.02 + stepY);
      const roofW = adjustedSize * (0.78 - t * 0.12);
      const roofX = x + (size - roofW) / 2;
      const peak  = adjustedSize * (0.11 - t * 0.012); // slightly steeper than before

      // Side wedge (RIGHT) — behind
      gEls.push(
        <path
          key={`roof-side-${t}`}
          d={`M ${roofX + roofW + adjustedSize * 0.04} ${roofY}
              L ${roofX + roofW + adjustedSize * 0.04 + depth} ${roofY - depth * 0.5}
              L ${roofX + roofW / 2 + depth * 0.48} ${roofY - peak - depth * 0.28}
              L ${roofX + roofW / 2} ${roofY - peak} Z`}
          fill={`url(#roofSide-${uid})`}
          stroke={outline}
          strokeWidth={0.55}
        />
      );

      // Front roof with upturned corners
      gEls.push(
        <path
          key={`roof-front-${t}`}
          d={`M ${roofX - adjustedSize * 0.04} ${roofY}
              Q ${roofX - adjustedSize * 0.02} ${roofY - adjustedSize * 0.015}, ${roofX} ${roofY - adjustedSize * 0.008}
              L ${roofX + roofW / 2} ${roofY - peak}
              L ${roofX + roofW} ${roofY - adjustedSize * 0.008}
              Q ${roofX + roofW + adjustedSize * 0.02} ${roofY - adjustedSize * 0.015}, ${roofX + roofW + adjustedSize * 0.04} ${roofY} Z`}
          fill={`url(#tiles-${uid})`}
          stroke={outline}
          strokeWidth={0.6}
        />
      );

      // Add horizontal tile lines
      if (t === 0 || tiers <= 2) { // Only on first tier or small buildings
        for (let i = 1; i <= 2; i++) {
          gEls.push(
            <line
              key={`tile-line-${t}-${i}`}
              x1={roofX + adjustedSize * 0.02}
              y1={roofY - peak * (i * 0.3)}
              x2={roofX + roofW - adjustedSize * 0.02}
              y2={roofY - peak * (i * 0.3)}
              stroke={roofDark}
              strokeWidth={0.3}
              opacity={0.5}
            />
          );
        }
      }

      // Short tips (very subtle)
      gEls.push(
        <line
          key={`tip-L-${t}`}
          x1={roofX - adjustedSize * 0.04}
          y1={roofY}
          x2={roofX - adjustedSize * 0.016}
          y2={roofY - adjustedSize * 0.012}
          stroke={outline}
          strokeWidth={0.55}
          opacity={0.65}
        />
      );
      gEls.push(
        <line
          key={`tip-R-${t}`}
          x1={roofX + roofW + adjustedSize * 0.04}
          y1={roofY}
          x2={roofX + roofW + adjustedSize * 0.02}
          y2={roofY - adjustedSize * 0.012}
          stroke={outline}
          strokeWidth={0.55}
          opacity={0.65}
        />
      );
    }

    // Chinese lanterns for city centers
    if (tile.biome === BiomeType.CITY_CENTER && tiers >= 4) {
      // Add glowing lanterns at corners
      const lanternSize = adjustedSize * 0.025;
      const lanternGlow = `hsl(${15 + rand() * 10}, 85%, 55%)`;
      
      // Left lantern
      gEls.push(
        <g key="lantern-left">
          <circle
            cx={bodyX - adjustedSize * 0.05}
            cy={bodyY + bodyH * 0.3}
            r={lanternSize}
            fill={lanternGlow}
            opacity={0.9}
          />
          <circle
            cx={bodyX - adjustedSize * 0.05}
            cy={bodyY + bodyH * 0.3}
            r={lanternSize * 1.5}
            fill={lanternGlow}
            opacity={0.3}
            filter={`url(#soft-${uid})`}
          />
        </g>
      );
      
      // Right lantern
      gEls.push(
        <g key="lantern-right">
          <circle
            cx={bodyX + bodyW + adjustedSize * 0.05}
            cy={bodyY + bodyH * 0.3}
            r={lanternSize}
            fill={lanternGlow}
            opacity={0.9}
          />
          <circle
            cx={bodyX + bodyW + adjustedSize * 0.05}
            cy={bodyY + bodyH * 0.3}
            r={lanternSize * 1.5}
            fill={lanternGlow}
            opacity={0.3}
            filter={`url(#soft-${uid})`}
          />
        </g>
      );
      
      // Top lantern on highest tier
      gEls.push(
        <g key="lantern-top">
          <circle
            cx={x + size / 2}
            cy={bodyY - adjustedSize * (0.02 + (tiers - 1) * 0.085) - adjustedSize * 0.15}
            r={lanternSize * 0.8}
            fill="hsl(20, 90%, 60%)"
            opacity={0.95}
          />
          <circle
            cx={x + size / 2}
            cy={bodyY - adjustedSize * (0.02 + (tiers - 1) * 0.085) - adjustedSize * 0.15}
            r={lanternSize * 1.2}
            fill="hsl(20, 90%, 60%)"
            opacity={0.25}
            filter={`url(#soft-${uid})`}
          />
        </g>
      );
    }

    // Tiny incense puff (rare and subtle, only medieval+)
    if (eraLevel >= 2 && rand() > 0.75 && !isHumbleDwelling) {
      gEls.push(
        <circle
          key="smoke"
          cx={bodyX + bodyW * 0.56}
          cy={bodyY - adjustedSize * 0.02}
          r={adjustedSize * 0.015}
          fill="rgba(180,180,180,0.5)"
        />
      );
    }

    return (
      <g filter="url(#symbolShadow)">
        <defs>
          {/* Clip to tile so nothing overlaps neighbors */}
          <clipPath id={`tileClip-${uid}`}>
            <rect x={x} y={y} width={size} height={size} />
          </clipPath>

          {/* Soft ground shadow */}
          <filter id={`soft-${uid}`} x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="2.6" />
          </filter>

          {/* Wall front gradient (subtle vertical) */}
          <linearGradient id={`wallFront-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={wallLight} />
            <stop offset="60%"  stopColor={wallMid} />
            <stop offset="100%" stopColor={wallDark} />
          </linearGradient>

          {/* Wall side gradient (darker diagonally) */}
          <linearGradient id={`wallSide-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor={wallMid} />
            <stop offset="100%" stopColor={wallDark} />
          </linearGradient>

          {/* Roof tiles (simple course) */}
          <pattern id={`tiles-${uid}`} patternUnits="userSpaceOnUse" width="8" height="6">
            <rect width="8" height="6" fill={roofMain} />
            <path d="M 0 3 H 8" stroke={roofDark} strokeWidth="0.6" opacity="0.85" />
          </pattern>

          {/* Roof side gradient (darker away from viewer) */}
          <linearGradient id={`roofSide-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor={roofDark} />
            <stop offset="100%" stopColor={roofMain} />
          </linearGradient>
        </defs>

        {/* Everything is clipped to the tile; background bits can't sit on top of neighbors */}
        <g clipPath={`url(#tileClip-${uid})`}>
          {gEls}
        </g>
      </g>
    );
  }
);

export default EastAsianPagoda3D;
