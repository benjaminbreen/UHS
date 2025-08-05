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

    const depth = size * 0.4;
    const buildingY = y + height * 0.1;
    const buildingHeight = height * 0.9;
    
    return (
        <g filter="url(#symbolShadow)">
            <defs>
                 <radialGradient id={`domeGrad-${uniqueId}`} cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor={domeHighlight} />
                    <stop offset="100%" stopColor={domeColor} />
                </radialGradient>
            </defs>
            {/* Main Courtyard Wall */}
            <rect x={x} y={buildingY} width={width} height={buildingHeight} fill={wallColor} stroke={outlineColor} strokeWidth="0.2"/>
            <path d={`M ${x+width} ${buildingY} L ${x+width+depth} ${buildingY-depth*0.5} L ${x+width+depth} ${y+height-depth*0.5} L ${x+width} ${y+height} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.2"/>

            {/* Main Dome */}
            <ellipse cx={x+width/2} cy={buildingY} rx={width*0.25} ry={height*0.2} fill={`url(#domeGrad-${uniqueId})`} stroke={outlineColor} strokeWidth="0.3"/>
            <path d={`M ${x+width*0.48} ${buildingY - height*0.2 - 3} L ${x+width/2} ${buildingY - height*0.2 - 5} L ${x+width*0.52} ${buildingY - height*0.2 - 3}`} fill={goldColor}/>
            
            {/* Minarets */}
            {[0, 1].map(i => {
                const minaretX = x + (i === 0 ? width * 0.1 : width * 0.9);
                return (
                    <g key={`minaret-${i}`}>
                        <rect x={minaretX - 3} y={y - 5} width={6} height={height} fill={wallColor} stroke={outlineColor} strokeWidth="0.2"/>
                        <ellipse cx={minaretX} cy={y-5} rx={3} ry={2} fill={`url(#domeGrad-${uniqueId})`} />
                    </g>
                )
            })}

            {/* Arched Entrance */}
            <path d={`M ${x+width*0.4} ${y+height} v -${height*0.4} a ${width*0.1} ${height*0.2} 0 0 1 ${width*0.2} 0 v ${height*0.4} Z`} fill="#2c1e12" stroke={outlineColor} strokeWidth="0.3" />

        </g>
    );
});

export default IslamicMosque3D;