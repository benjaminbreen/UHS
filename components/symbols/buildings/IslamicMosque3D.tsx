/**
 * components/symbols/buildings/IslamicMosque3D.tsx - Renders a detailed, painterly Islamic mosque.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface IslamicMosque3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile;
}

const IslamicMosque3D: React.FC<IslamicMosque3DProps> = React.memo(({ x, y, width, height, size, seed, tile }) => {
    const rand = new ValueNoise(seed + tile.x * 31 + tile.y * 37).random;
    const uniqueId = `mosque-${tile.x}-${tile.y}`;

    const wallColor = `hsl(45, 50%, ${88 + rand() * 10}%)`;
    const shadowColor = `hsl(45, 50%, 75%)`;
    const domeColor = `hsl(195, 80%, 55%)`;
    const domeHighlight = `hsl(195, 70%, 75%)`;
    const goldColor = `hsl(45, 85%, 60%)`;
    const outlineColor = `hsl(45, 50%, 50%)`;

    // Increased size by 40% for more imposing presence
    const scaleFactor = 1.4;
    const depth = size * 0.5 * scaleFactor;
    const buildingY = y + height * 0.05;
    const buildingHeight = height * 0.95 * scaleFactor;
    const scaledWidth = width * scaleFactor;
    const centerOffset = (scaledWidth - width) / 2;

    return (
        <g filter="url(#symbolShadow)">
            <defs>
                 <radialGradient id={`domeGrad-${uniqueId}`} cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor={domeHighlight} />
                    <stop offset="100%" stopColor={domeColor} />
                </radialGradient>
            </defs>
            {/* Main Courtyard Wall - Properly centered */}
            <rect x={x - centerOffset} y={buildingY} width={scaledWidth} height={buildingHeight} fill={wallColor} stroke={outlineColor} strokeWidth="0.5"/>
            <path d={`M ${x + scaledWidth - centerOffset} ${buildingY} L ${x + scaledWidth - centerOffset + depth} ${buildingY-depth*0.5} L ${x + scaledWidth - centerOffset + depth} ${y+height*1.2-depth*0.5} L ${x + scaledWidth - centerOffset} ${y+height*1.2} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.5"/>

            {/* Main Dome - Larger and more prominent */}
            <ellipse cx={x+width*0.5} cy={buildingY - height*0.1} rx={width*0.35} ry={height*0.3} fill={`url(#domeGrad-${uniqueId})`} stroke={outlineColor} strokeWidth="0.5"/>
            <path d={`M ${x+width*0.47} ${buildingY - height*0.4 - 5} L ${x+width/2} ${buildingY - height*0.4 - 8} L ${x+width*0.53} ${buildingY - height*0.4 - 5}`} fill={goldColor}/>
            
            {/* Minarets - Fixed positioning */}
            {[0, 1].map(i => {
                const minaretX = i === 0 ? x - width * 0.1 : x + width * 1.1;
                return (
                    <g key={`minaret-${i}`}>
                        <rect x={minaretX - 5} y={y - height*0.3} width={10} height={height*1.5} fill={wallColor} stroke={outlineColor} strokeWidth="0.5"/>
                        <ellipse cx={minaretX} cy={y-height*0.3} rx={5} ry={4} fill={`url(#domeGrad-${uniqueId})`} stroke={outlineColor} strokeWidth="0.3"/>
                    </g>
                )
            })}

            {/* Arched Entrance - Centered */}
            <path d={`M ${x+width*0.35} ${y+height*1.2} v -${height*0.6} a ${width*0.15} ${height*0.3} 0 0 1 ${width*0.3} 0 v ${height*0.6} Z`} fill="#2c1e12" stroke={outlineColor} strokeWidth="0.5" />

        </g>
    );
});

export default IslamicMosque3D;