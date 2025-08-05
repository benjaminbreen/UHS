/**
 * components/symbols/buildings/ChristianChurch3D.tsx - Renders a detailed, painterly Christian church.
 */
import React from 'react';
import { Tile, HistoricalEra } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface ChristianChurch3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile; era: HistoricalEra;
}

const getEraLevel = (era: HistoricalEra): number => {
    switch (era) {
        case HistoricalEra.ANTIQUITY: return 1;
        case HistoricalEra.MEDIEVAL: return 2;
        case HistoricalEra.RENAISSANCE_EARLY_MODERN: return 3;
        default: return 2;
    }
};

const ChristianChurch3D: React.FC<ChristianChurch3DProps> = React.memo(({ x, y, width, height, size, seed, tile, era }) => {
    const rand = new ValueNoise(seed + tile.x * 17 + tile.y * 23).random;
    const uniqueId = `church-${tile.x}-${tile.y}`;
    const eraLevel = getEraLevel(era);
    const isGothic = eraLevel >= 2;

    const stoneColor = `hsl(30, 15%, ${70 + rand() * 10}%)`;
    const roofColor = `hsl(210, 20%, 45%)`;
    const highlightColor = `hsl(30, 20%, 85%)`;
    const shadowColor = `hsl(30, 15%, 55%)`;
    const outlineColor = `hsl(30, 15%, 35%)`;
    const windowColor = `hsl(200, 40%, 30%)`;
    const stainedGlass = `url(#stainedGlass-${uniqueId})`;

    const depth = size * 0.4;
    const mainHeight = height * 0.9;
    const mainY = y + height - mainHeight;

    return (
        <g filter="url(#symbolShadow)">
            <defs>
                 <linearGradient id={`stainedGlass-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="50%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
            </defs>
             {/* Main Nave */}
            <rect x={x} y={mainY} width={width} height={mainHeight} fill={stoneColor} stroke={outlineColor} strokeWidth="0.3"/>
            {/* Side */}
            <path d={`M ${x+width} ${mainY} L ${x+width+depth} ${mainY-depth*0.5} L ${x+width+depth} ${y+height-depth*0.5} L ${x+width} ${y+height} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.3"/>
            
            {/* Pitched Roof */}
            <path d={`M ${x-2} ${mainY} L ${x+width/2} ${mainY-height*0.5} L ${x+width+2} ${mainY} Z`} fill={roofColor} stroke={outlineColor} strokeWidth="0.3"/>
            <path d={`M ${x+width+2} ${mainY} L ${x+width+2+depth} ${mainY-depth*0.5} L ${x+width/2+depth} ${mainY-height*0.5-depth*0.5} L ${x+width/2} ${mainY-height*0.5} Z`} fill={roofColor} style={{filter: 'brightness(0.7)'}} stroke={outlineColor} strokeWidth="0.3"/>
            
            {/* Bell Tower */}
            <rect x={x+width-10} y={y} width={12} height={height} fill={stoneColor} stroke={outlineColor} strokeWidth="0.3"/>
            <path d={`M ${x+width+2} ${y} L ${x+width+2+depth} ${y-depth*0.5} L ${x+width+2+depth} ${y+height-depth*0.5} L ${x+width+2} ${y+height} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.3"/>
            <path d={`M ${x+width-10} ${y} L ${x+width/2+10} ${y-height*0.2} L ${x+width+2} ${y} Z`} fill={roofColor} stroke={outlineColor} strokeWidth="0.3" transform="translate(14, 0)"/>

            {/* Arched Windows */}
            {[...Array(isGothic ? 3 : 2)].map((_, i) => (
                <g key={`window-${i}`}>
                    <rect x={x + 4 + i*8} y={mainY+10} width="6" height="8" fill={windowColor} />
                    <path d={`M ${x+4+i*8} ${mainY+10} A 3 4 0 0 1 ${x+10+i*8} ${mainY+10}`} fill={isGothic ? stainedGlass : windowColor} />
                </g>
            ))}

            {/* Buttresses */}
            {isGothic && [...Array(3)].map((_,i) => (
                 <rect key={`buttress-${i}`} x={x + i * 11} y={mainY+5} width="3" height={mainHeight-5} fill={shadowColor} opacity="0.6"/>
            ))}
        </g>
    );
});

export default ChristianChurch3D;