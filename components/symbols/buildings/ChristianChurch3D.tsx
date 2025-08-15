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

    // Increased size by 40% for more imposing presence
    const scaleFactor = 1.4;
    const depth = size * 0.5 * scaleFactor;
    const mainHeight = height * 0.95 * scaleFactor;
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
             {/* Main Nave - Enlarged */}
            <rect x={x - width * 0.2} y={mainY} width={width * 1.4} height={mainHeight} fill={stoneColor} stroke={outlineColor} strokeWidth="0.5"/>
            {/* Side - Adjusted for larger size */}
            <path d={`M ${x+width*1.2} ${mainY} L ${x+width*1.2+depth} ${mainY-depth*0.5} L ${x+width*1.2+depth} ${y+height-depth*0.5} L ${x+width*1.2} ${y+height} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.5"/>
            
            {/* Pitched Roof - Taller and wider */}
            <path d={`M ${x-width*0.25} ${mainY} L ${x+width*0.5} ${mainY-height*0.7*scaleFactor} L ${x+width*1.25} ${mainY} Z`} fill={roofColor} stroke={outlineColor} strokeWidth="0.5"/>
            <path d={`M ${x+width*1.25} ${mainY} L ${x+width*1.25+depth} ${mainY-depth*0.5} L ${x+width*0.5+depth} ${mainY-height*0.7*scaleFactor-depth*0.5} L ${x+width*0.5} ${mainY-height*0.7*scaleFactor} Z`} fill={roofColor} style={{filter: 'brightness(0.7)'}} stroke={outlineColor} strokeWidth="0.5"/>
            
            {/* Bell Tower - Taller and wider */}
            <rect x={x+width*0.9} y={y-height*0.3} width={18} height={height*1.5} fill={stoneColor} stroke={outlineColor} strokeWidth="0.5"/>
            <path d={`M ${x+width*0.9+18} ${y-height*0.3} L ${x+width*0.9+18+depth} ${y-height*0.3-depth*0.5} L ${x+width*0.9+18+depth} ${y+height*1.2-depth*0.5} L ${x+width*0.9+18} ${y+height*1.2} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.5"/>
            <path d={`M ${x+width*0.9} ${y-height*0.3} L ${x+width*0.9+9} ${y-height*0.6} L ${x+width*0.9+18} ${y-height*0.3} Z`} fill={roofColor} stroke={outlineColor} strokeWidth="0.5"/>

            {/* Arched Windows */}
            {[...Array(isGothic ? 3 : 2)].map((_, i) => (
                <g key={`window-${i}`}>
                    <rect x={x - width*0.15 + 6 + i*12} y={mainY+15} width="9" height="12" fill={windowColor} />
                    <path d={`M ${x - width*0.15 + 6 + i*12} ${mainY+15} A 4.5 6 0 0 1 ${x - width*0.15 + 15 + i*12} ${mainY+15}`} fill={isGothic ? stainedGlass : windowColor} />
                </g>
            ))}

            {/* Buttresses */}
            {isGothic && [...Array(3)].map((_,i) => (
                 <rect key={`buttress-${i}`} x={x - width*0.2 + i * 16} y={mainY+8} width="5" height={mainHeight-8} fill={shadowColor} opacity="0.6"/>
            ))}
        </g>
    );
});

export default ChristianChurch3D;