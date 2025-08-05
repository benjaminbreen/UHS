/**
 * components/symbols/buildings/AfricanRoundHut3D.tsx - Renders a detailed, painterly African round hut.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface AfricanRoundHut3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile; roofColor: string;
}

const AfricanRoundHut3D: React.FC<AfricanRoundHut3DProps> = React.memo(({ x, y, width, height, size, seed, tile, roofColor }) => {
    const rand = new ValueNoise(seed + tile.x * 5 + tile.y * 7).random;
    const cx = x + width / 2;
    const wallRadius = width * 0.4;
    const wallHeight = height * 0.5;
    const wallY = y + height - wallHeight;
    const roofRadius = wallRadius * 1.3;
    const roofHeight = height * 0.6;
    const roofY = wallY;
    const uniqueId = `hut-${tile.x}-${tile.y}`;

    const wallBaseColor = `hsl(25, 35%, ${65 + rand() * 10}%)`;
    const wallShadowColor = `hsl(25, 35%, 45%)`;
    const thatchColor1 = `hsl(40, 50%, ${50 + rand() * 10}%)`;
    const thatchColor2 = `hsl(40, 55%, ${35 + rand() * 10}%)`;
    const thatchHighlight = `hsl(45, 60%, 65%)`;
    const doorColor = '#4a2c17';
    const outlineColor = '#4a2c17';

    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <linearGradient id={`wallGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={wallBaseColor} />
                    <stop offset="40%" stopColor={wallBaseColor} />
                    <stop offset="100%" stopColor={wallShadowColor} />
                </linearGradient>
                <pattern id={`thatchPattern-${uniqueId}`} patternUnits="userSpaceOnUse" width="4" height="4">
                    <path d="M 0 2 L 4 2" stroke={thatchColor2} strokeWidth="0.6" />
                    <path d="M 2 0 L 2 4" stroke={thatchColor2} strokeWidth="0.6" opacity="0.5"/>
                </pattern>
            </defs>
            {/* Cast Shadow */}
            <ellipse cx={cx + 3} cy={y + height + 1} rx={roofRadius * 0.9} ry={roofRadius * 0.3} fill="rgba(0,0,0,0.2)" />
      
            {/* Wall (cylinder) */}
            <path d={`M ${cx - wallRadius} ${wallY + wallHeight} a ${wallRadius} ${wallRadius * 0.3} 0 0 0 ${wallRadius * 2} 0`} fill={wallShadowColor}/>
            <rect x={cx - wallRadius} y={wallY} width={wallRadius * 2} height={wallHeight} fill={`url(#wallGradient-${uniqueId})`} stroke={outlineColor} strokeWidth="0.2" />
            <path d={`M ${cx - wallRadius} ${wallY + wallHeight} a ${wallRadius} ${wallRadius * 0.3} 0 0 1 ${wallRadius * 2} 0`} fill={wallShadowColor}/>
            
            {/* Door */}
            <path d={`M ${cx - wallRadius * 0.25} ${wallY + wallHeight} v -${wallHeight * 0.8} a ${wallRadius * 0.25} ${wallRadius * 0.25} 0 0 1 ${wallRadius * 0.5} 0 v ${wallHeight * 0.8} Z`} fill={doorColor} stroke={outlineColor} strokeWidth="0.3" />
            
            {/* Roof */}
            <path d={`M ${cx - roofRadius} ${roofY} Q ${cx} ${roofY - roofHeight}, ${cx + roofRadius} ${roofY} Z`} fill={thatchColor1} stroke={outlineColor} strokeWidth="0.2" />
            <path d={`M ${cx - roofRadius} ${roofY} Q ${cx} ${roofY - roofHeight}, ${cx + roofRadius} ${roofY} Z`} fill={`url(#thatchPattern-${uniqueId})`} />
            <path d={`M ${cx - roofRadius*0.6} ${roofY - roofHeight*0.7} Q ${cx} ${roofY - roofHeight*1.1}, ${cx + roofRadius*0.6} ${roofY - roofHeight*0.7}`} fill="none" stroke={thatchHighlight} strokeWidth="1.5" opacity="0.7" strokeLinecap="round"/>

            {/* Decorative Patterns */}
            {rand() > 0.4 && [...Array(3)].map((_, i) => (
                <circle key={`deco-${i}`} cx={cx + wallRadius * 0.6 + (rand() - 0.5) * 3} cy={wallY + wallHeight * (0.3 + i * 0.2)} r={size * 0.03} fill={i % 2 === 0 ? "#e11d48" : "#f59e0b"} opacity="0.7"/>
            ))}
        </g>
    );
});

export default AfricanRoundHut3D;
