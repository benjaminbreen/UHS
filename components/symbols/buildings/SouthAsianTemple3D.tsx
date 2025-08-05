/**
 * components/symbols/buildings/SouthAsianTemple3D.tsx - Renders a detailed, painterly South Asian temple.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface SouthAsianTemple3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile;
}

const SouthAsianTemple3D: React.FC<SouthAsianTemple3DProps> = React.memo(({ x, y, width, height, size, seed, tile }) => {
    const rand = new ValueNoise(seed + tile.x * 137 + tile.y * 149).random;
    const uniqueId = `temple-${tile.x}-${tile.y}`;
    const elements = [];

    const stoneColor = `hsl(35, 40%, ${80 + rand() * 10}%)`;
    const stoneShadow = `hsl(35, 40%, 65%)`;
    const goldColor = `hsl(45, 80%, 60%)`;
    const accentColor = `hsl(5, 70%, 55%)`;
    const highlightColor = `hsl(40, 40%, 90%)`;
    const outlineColor = `hsl(35, 40%, 40%)`;

    const depth = size * 0.3;

    // Cast Shadow
    elements.push(
      <path key="shadow-soft" d={`M ${x + depth * 0.5} ${y + height + depth * 0.2} l ${width} 0 l ${-depth*0.5} ${depth*0.3} l ${-width} 0 Z`} fill="rgba(0,0,0,0.2)" />,
      <path key="shadow-hard" d={`M ${x + depth} ${y + height + depth*0.5} L ${x + width + depth} ${y + height + depth*0.5} L ${x + width} ${y + height} L ${x} ${y + height} Z`} fill="rgba(0,0,0,0.15)" filter="url(#buildingShadow)" />
    );


    // Base Platform
    const platformHeight = height * 0.2;
    elements.push(<rect x={x} y={y + height * 0.8} width={width} height={platformHeight} fill={`url(#stoneGrad-${uniqueId})`} stroke={outlineColor} strokeWidth="0.3"/>);
    elements.push(<path d={`M ${x+width} ${y+height*0.8} L ${x+width+depth} ${y+height*0.8-depth*0.5} L ${x+width+depth} ${y+height-depth*0.5} L ${x+width} ${y+height} Z`} fill={stoneShadow} stroke={outlineColor} strokeWidth="0.3"/>);

    // Main Structure (Mandapa)
    const mandapaHeight = height * 0.5;
    const mandapaY = y + height - platformHeight - mandapaHeight;
    elements.push(<rect x={x + width * 0.1} y={mandapaY} width={width * 0.8} height={mandapaHeight} fill={stoneColor} stroke={outlineColor} strokeWidth="0.3"/>);
    elements.push(<path d={`M ${x+width*0.9} ${mandapaY} L ${x+width*0.9+depth*0.8} ${mandapaY-depth*0.4} L ${x+width*0.9+depth*0.8} ${y+height*0.8-depth*0.4} L ${x+width*0.9} ${y+height*0.8} Z`} fill={stoneShadow} stroke={outlineColor} strokeWidth="0.3"/>);
    
    // Shikhara (Tower)
    const shikharaY = mandapaY;
    const shikharaHeight = height * 0.5;
    elements.push(
        <path 
            d={`M ${x + width*0.3} ${shikharaY} C ${x + width*0.3} ${shikharaY - shikharaHeight*0.8}, ${x + width*0.7} ${shikharaY - shikharaHeight*0.8}, ${x + width*0.7} ${shikharaY} L ${x+width*0.6} ${y} L ${x+width*0.4} ${y} Z`}
            fill={accentColor}
            stroke={outlineColor}
            strokeWidth="0.4"
        />
    );
    // Shikhara carving pattern
    for(let i = 0; i < 5; i++) {
        const lineY = shikharaY - i * 3.5;
        if (lineY > y + 2) {
             elements.push(<path d={`M ${x+width*0.35} ${lineY} C ${x+width/2} ${lineY-2.5}, ${x+width*0.65} ${lineY}`} stroke={goldColor} strokeWidth="0.6" fill="none" opacity="0.7"/>);
        }
    }
    
    // Finial (Kalasha) on top
    elements.push(<circle cx={x + width/2} cy={y-2} r={3} fill={goldColor} stroke="black" strokeWidth="0.2"/>);
    elements.push(<line x1={x+width/2} y1={y-2} x2={x+width/2} y2={y-6} stroke={goldColor} strokeWidth="1.2"/>);

    // Entrance
    elements.push(<rect x={x + width/2 - 5} y={y + height * 0.6} width={10} height={height*0.4} fill="#4a2c17" stroke="black" strokeWidth="0.3"/>);

    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <linearGradient id={`stoneGrad-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={highlightColor} />
                    <stop offset="50%" stopColor={stoneColor} />
                    <stop offset="100%" stopColor={stoneShadow} />
                </linearGradient>
            </defs>
            {elements}
        </g>
    );
});

export default SouthAsianTemple3D;
