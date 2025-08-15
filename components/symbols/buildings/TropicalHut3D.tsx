/**
 * components/symbols/buildings/TropicalHut3D.tsx - Simple tropical hut with clean lines
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface TropicalHut3DProps {
  x: number; 
  y: number; 
  width: number; 
  height: number; 
  size: number; 
  seed: number; 
  tile: Tile; 
  roofColor?: string; 
  nightIntensity?: number;
}

const TropicalHut3D: React.FC<TropicalHut3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile, nightIntensity = 0 
}) => {
  const rng = new ValueNoise(seed + tile.x * 127 + tile.y * 131);
  const uniqueId = `tropical-${tile.x}-${tile.y}`;

  // Random variations (unchanged in spirit)
  const hutVariant = rng.random();
  const hasWindow = rng.random() > 0.4;
  const roofStyle = rng.random() > 0.5 ? 'pointed' : 'rounded';

  // Slightly bigger
  const hutWidth = width * 0.68;
  const hutHeight = height * 0.56;
  const hutX = x + (width - hutWidth) / 2;
  const hutY = y + height * 0.33;

  // Colors
  const wallColor = `hsl(45, 35%, ${75 + hutVariant * 10}%)`;
  const wallDark  = `hsl(45, 40%, ${60 + hutVariant * 8}%)`;
  const thatchColor = `hsl(50, 50%, ${64 + hutVariant * 8}%)`;
  const thatchDark  = `hsl(40, 45%, ${42 + hutVariant * 8}%)`;
  const doorColor = '#2B1F17';

  // Roof geometry (kept simple)
  const cx = hutX + hutWidth / 2;
  const baseY = hutY + hutHeight * 0.30;

  return (
    <g>
      <defs>
        {/* Removed blur filter for sharper rendering */}
      </defs>

      {/* Dirt clearing behind hut */}
      <ellipse 
        cx={cx}
        cy={hutY + hutHeight * 0.92}
        rx={hutWidth * 0.72}
        ry={hutHeight * 0.36}
        fill={`hsl(36, 35%, 72%)`}
        stroke={`hsl(36, 30%, 58%)`}
        strokeWidth={0.7}
      />

      {/* Ambient ground shadow - no blur for sharpness */}
      <ellipse 
        cx={cx} 
        cy={hutY + hutHeight + 2} 
        rx={hutWidth * 0.54} 
        ry={hutHeight * 0.13}
        fill="rgba(0, 0, 0, 0.25)"
        opacity="0.6"
      />

      {/* Body */}
      <rect 
        x={hutX} 
        y={hutY + hutHeight * 0.32} 
        width={hutWidth} 
        height={hutHeight * 0.68}
        fill={wallColor}
        stroke={wallDark}
        strokeWidth={0.8}
      />

      {/* Simple vertical texture lines */}
      {[0.2, 0.4, 0.6, 0.8].map((xPos, i) => (
        <line 
          key={i}
          x1={hutX + hutWidth * xPos} 
          y1={hutY + hutHeight * 0.36}
          x2={hutX + hutWidth * xPos} 
          y2={hutY + hutHeight * 0.98}
          stroke={wallDark}
          strokeWidth={0.5}
          opacity={0.35}
          />
      ))}

      {/* Door */}
      <rect 
        x={hutX + hutWidth * 0.40} 
        y={hutY + hutHeight * 0.62}
        width={hutWidth * 0.2} 
        height={hutHeight * 0.38}
        fill={doorColor}
        stroke={wallDark}
        strokeWidth={0.8}
      />

      {/* Window (optional) */}
      {hasWindow && (
        <rect 
          x={hutX + hutWidth * 0.70} 
          y={hutY + hutHeight * 0.50}
          width={hutWidth * 0.15} 
          height={hutHeight * 0.16}
          fill={doorColor}
          stroke={wallDark}
          strokeWidth={0.7}
          opacity={0.85}
          />
      )}

      {/* Roofs – same two styles, just a touch more detail */}
      {roofStyle === 'pointed' ? (
        <g>
          {/* Shell */}
          <path 
            d={`M ${hutX - hutWidth * 0.10} ${baseY}
                L ${cx} ${hutY - hutHeight * 0.08}
                L ${hutX + hutWidth * 1.10} ${baseY} Z`}
            fill={thatchColor}
            stroke={thatchDark}
            strokeWidth={0.6}
              />
          {/* Few radial "reeds" */}
          {[0.15, 0.35, 0.5, 0.65, 0.85].map((t, i) => (
            <line
              key={`r${i}`}
              x1={cx}
              y1={hutY - hutHeight * 0.08}
              x2={hutX - hutWidth * 0.10 + (hutWidth * 1.20) * t}
              y2={baseY}
              stroke={thatchDark}
              strokeWidth={0.45}
              opacity={0.5}
                  />
          ))}
          {/* Short fringe */}
          {[...Array(10)].map((_, i) => {
            const t = (i + 0.5) / 10;
            const ex = hutX - hutWidth * 0.10 + (hutWidth * 1.20) * t;
            return (
              <line
                key={`f${i}`}
                x1={ex} y1={baseY}
                x2={ex} y2={baseY + 2}
                stroke={thatchDark}
                strokeWidth={0.6}
                opacity={0.6}
                      />
            );
          })}
        </g>
      ) : (
        <g>
          {/* Dome */}
          <ellipse 
            cx={cx} 
            cy={baseY}
            rx={hutWidth * 0.58} 
            ry={hutHeight * 0.24}
            fill={thatchColor}
            stroke={thatchDark}
            strokeWidth={0.6}
              />
          {/* A few arcs to suggest bundles */}
          {[0.25, 0.5, 0.75].map((p, i) => (
            <path
              key={`a${i}`}
              d={`M ${hutX + hutWidth*0.10} ${baseY - hutHeight*0.10 * (1 - Math.abs(0.5 - p)*1.4)}
                 Q ${cx} ${baseY - hutHeight*0.14}
                   ${hutX + hutWidth*0.90} ${baseY - hutHeight*0.10 * (1 - Math.abs(0.5 - p)*1.4)}`}
              fill="none"
              stroke={thatchDark}
              strokeWidth={0.45}
              opacity={0.5}
                  />
          ))}
          {/* Fringe */}
          {[...Array(10)].map((_, i) => {
            const t = (i + 0.5) / 10;
            const ex = hutX + hutWidth * (0.10 + 0.80 * t);
            return (
              <line
                key={`df${i}`}
                x1={ex} y1={baseY + hutHeight * 0.01}
                x2={ex} y2={baseY + 2}
                stroke={thatchDark}
                strokeWidth={0.6}
                opacity={0.6}
                      />
            );
          })}
        </g>
      )}

      {/* Night lighting */}
      {nightIntensity > 0 && (
        <g>
          <rect 
            x={hutX + hutWidth * 0.40} 
            y={hutY + hutHeight * 0.62}
            width={hutWidth * 0.20} 
            height={hutHeight * 0.38}
            fill="rgba(255, 180, 60, 0.55)"
            opacity={nightIntensity * 0.8}
          />
          {hasWindow && (
            <rect 
              x={hutX + hutWidth * 0.70} 
              y={hutY + hutHeight * 0.50}
              width={hutWidth * 0.15} 
              height={hutHeight * 0.16}
              fill="rgba(255, 200, 100, 0.55)"
              opacity={nightIntensity * 0.7}
            />
          )}
        </g>
      )}
    </g>
  );
});

export default TropicalHut3D;
