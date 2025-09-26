/**
 * components/symbols/buildings/Igloo3D.tsx - Renders a detailed, painterly Igloo.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface Igloo3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile;
}

const Igloo3D: React.FC<Igloo3DProps> = React.memo(({ x, y, width, height, size, seed, tile }) => {
    const rng = new ValueNoise(seed + tile.x * 43 + tile.y * 47);
    const cx = x + width / 2;
    const cy = y + height * 0.7; // Adjusted for better positioning
    const rx = width * 0.5; // Slightly larger
    const ry = height * 0.45; // Taller dome
    const uniqueId = `igloo-${tile.x}-${tile.y}`;
    
    // Pre-calculate random values
    const rand1 = rng.random();
    const rand2 = rng.random();

    const baseColor = `hsl(200, 70%, ${92 + rand1 * 5}%)`;
    const shadowColor = `hsl(210, 50%, ${75 + rand2 * 5}%)`;
    const highlightColor = `hsl(190, 30%, 98%)`;
    const deepShadowColor = `hsl(220, 40%, 35%)`;
    const lineShadowColor = `hsla(210, 50%, 65%, 0.7)`;
    const outlineColor = `hsl(210, 40%, 70%)`;

    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <radialGradient id={`iglooGradient-${uniqueId}`} cx="30%" cy="25%" r="75%">
                    <stop offset="0%" stopColor={highlightColor} />
                    <stop offset="50%" stopColor={baseColor} />
                    <stop offset="100%" stopColor={shadowColor} />
                </radialGradient>
                <pattern id={`iceBlockPattern-${uniqueId}`} patternUnits="userSpaceOnUse" width="12" height="8">
                    <rect width="12" height="8" fill="none" stroke={lineShadowColor} strokeWidth="0.3" />
                    <line x1="0" y1="4" x2="12" y2="4" stroke={lineShadowColor} strokeWidth="0.2" />
                </pattern>
            </defs>
            
            {/* Cast Shadow - positioned relative to dome base */}
            <ellipse cx={cx + 2} cy={cy + ry + 2} rx={rx * 1.1} ry={rx * 0.3} fill="rgba(0,0,0,0.2)" filter="blur(1px)" />
      
            {/* Main Dome Structure */}
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#iglooGradient-${uniqueId})`} stroke={outlineColor} strokeWidth="0.3"/>
            
            {/* Ice Block Lines - Horizontal rings */}
            {[...Array(5)].map((_, i) => {
                const ringY = cy - i * ry * 0.18;
                const ringRx = rx * (1 - i * 0.18);
                const ringRy = ry * (1 - i * 0.25) * 0.15;
                return (
                    <ellipse 
                        key={`ring-${i}`} 
                        cx={cx} 
                        cy={ringY} 
                        rx={ringRx} 
                        ry={ringRy} 
                        fill="none" 
                        stroke={shadowColor} 
                        strokeWidth="0.5" 
                        opacity={0.8 - i * 0.15}
                    />
                );
            })}
            
            {/* Vertical block seams - fixed dome curvature */}
            {[...Array(8)].map((_, i) => {
                const angle = (i * Math.PI * 2) / 8;
                // Fix seam lines to follow ellipse curvature properly
                const innerRadius = 0.3; // Start seams further from center
                const outerRadius = 0.85; // End before dome edge
                const startX = cx + Math.cos(angle) * rx * innerRadius;
                const startY = cy + Math.sin(angle) * ry * innerRadius;
                const endX = cx + Math.cos(angle) * rx * outerRadius;
                const endY = cy + Math.sin(angle) * ry * outerRadius;
                return (
                    <line
                        key={`seam-${i}`}
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke={lineShadowColor}
                        strokeWidth="0.3"
                        opacity="0.6"
                    />
                );
            })}
            
            {/* Entrance Tunnel - improved perspective */}
            <g>
                {/* Tunnel opening shadow */}
                <ellipse 
                    cx={cx - rx * 0.3} 
                    cy={cy + ry * 0.4} 
                    rx={rx * 0.25} 
                    ry={ry * 0.18} 
                    fill={shadowColor} 
                />
                {/* Tunnel structure */}
                <path 
                    d={`M ${cx - rx * 0.5} ${cy + ry * 0.4} 
                        Q ${cx - rx * 0.35} ${cy + ry * 0.25} ${cx - rx * 0.2} ${cy + ry * 0.3}
                        L ${cx - rx * 0.15} ${cy + ry * 0.5}
                        Q ${cx - rx * 0.35} ${cy + ry * 0.55} ${cx - rx * 0.5} ${cy + ry * 0.4} Z`} 
                    fill={baseColor} 
                    stroke={outlineColor} 
                    strokeWidth="0.3"
                />
                {/* Entrance dark opening */}
                <ellipse 
                    cx={cx - rx * 0.3} 
                    cy={cy + ry * 0.4} 
                    rx={rx * 0.18} 
                    ry={ry * 0.12} 
                    fill={deepShadowColor} 
                    stroke="rgba(0,0,0,0.5)" 
                    strokeWidth="0.3"
                />
            </g>
            
            {/* Highlight on top for 3D effect */}
            <ellipse 
                cx={cx - rx * 0.1} 
                cy={cy - ry * 0.7} 
                rx={rx * 0.25} 
                ry={ry * 0.1} 
                fill={highlightColor} 
                opacity="0.7"
                filter="blur(1px)"
            />
        </g>
    );
});

export default Igloo3D;
