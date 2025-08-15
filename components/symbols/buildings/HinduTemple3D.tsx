/**
 * components/symbols/buildings/HinduTemple3D.tsx - Renders a detailed, painterly South Asian temple.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface HinduTemple3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile;
}

const HinduTemple3D: React.FC<HinduTemple3DProps> = React.memo(({ x, y, width, height, size, seed, tile }) => {
    const rand = new ValueNoise(seed + tile.x * 137 + tile.y * 149).random;
    const uniqueId = `temple-${tile.x}-${tile.y}`;
    const elements = [];

    // Increased size by 40% for more imposing presence
    const scaleFactor = 1.4;
    const stoneColor = `hsl(35, 40%, ${80 + rand() * 10}%)`;
    const stoneShadow = `hsl(35, 40%, 65%)`;
    const goldColor = `hsl(45, 80%, 60%)`;
    const accentColor = `hsl(5, 70%, 55%)`;
    const highlightColor = `hsl(40, 40%, 90%)`;
    const outlineColor = `hsl(35, 40%, 40%)`;

    const depth = size * 0.4 * scaleFactor;

    // Cast Shadow
    elements.push(
      <path key="shadow-soft" d={`M ${x + depth * 0.5} ${y + height + depth * 0.2} l ${width} 0 l ${-depth*0.5} ${depth*0.3} l ${-width} 0 Z`} fill="rgba(0,0,0,0.2)" />,
      <path key="shadow-hard" d={`M ${x + depth} ${y + height + depth*0.5} L ${x + width + depth} ${y + height + depth*0.5} L ${x + width} ${y + height} L ${x} ${y + height} Z`} fill="rgba(0,0,0,0.15)" filter="url(#buildingShadow)" />
    );


    // Base Platform - Enlarged
    const platformHeight = height * 0.25 * scaleFactor;
    elements.push(<rect x={x - width * 0.2} y={y + height * 0.75} width={width * 1.4} height={platformHeight} fill={`url(#stoneGrad-${uniqueId})`} stroke={outlineColor} strokeWidth="0.5"/>);
    elements.push(<path d={`M ${x+width*1.2} ${y+height*0.75} L ${x+width*1.2+depth} ${y+height*0.75-depth*0.5} L ${x+width*1.2+depth} ${y+height*1.25-depth*0.5} L ${x+width*1.2} ${y+height*1.25} Z`} fill={stoneShadow} stroke={outlineColor} strokeWidth="0.5"/>);

    // Main Structure (Mandapa) - Larger
    const mandapaHeight = height * 0.6 * scaleFactor;
    const mandapaY = y + height * 0.75 - mandapaHeight;
    elements.push(<rect x={x - width * 0.1} y={mandapaY} width={width * 1.2} height={mandapaHeight} fill={stoneColor} stroke={outlineColor} strokeWidth="0.5"/>);
    elements.push(<path d={`M ${x+width*1.1} ${mandapaY} L ${x+width*1.1+depth*0.8} ${mandapaY-depth*0.4} L ${x+width*1.1+depth*0.8} ${y+height*0.75-depth*0.4} L ${x+width*1.1} ${y+height*0.75} Z`} fill={stoneShadow} stroke={outlineColor} strokeWidth="0.5"/>);
    
    // Shikhara (Tower) - Taller and more prominent
    const shikharaY = mandapaY;
    const shikharaHeight = height * 0.7 * scaleFactor;
    elements.push(
        <path 
            d={`M ${x + width*0.2} ${shikharaY} C ${x + width*0.2} ${shikharaY - shikharaHeight*0.8}, ${x + width*0.8} ${shikharaY - shikharaHeight*0.8}, ${x + width*0.8} ${shikharaY} L ${x+width*0.65} ${y - height*0.2} L ${x+width*0.35} ${y - height*0.2} Z`}
            fill={accentColor}
            stroke={outlineColor}
            strokeWidth="0.6"
        />
    );
    // Shikhara carving pattern - More detailed
    for(let i = 0; i < 7; i++) {
        const lineY = shikharaY - i * 5;
        if (lineY > y - height*0.15) {
             elements.push(<path d={`M ${x+width*0.25} ${lineY} C ${x+width/2} ${lineY-4}, ${x+width*0.75} ${lineY}`} stroke={goldColor} strokeWidth="0.8" fill="none" opacity="0.7"/>);
        }
    }
    
    // Finial (Kalasha) on top - Larger and more prominent
    elements.push(<circle cx={x + width/2} cy={y-height*0.2-3} r={5} fill={goldColor} stroke="black" strokeWidth="0.4"/>);
    elements.push(<line x1={x+width/2} y1={y-height*0.2-3} x2={x+width/2} y2={y-height*0.2-10} stroke={goldColor} strokeWidth="2"/>);

    // Entrance - Larger
    elements.push(<rect x={x + width/2 - 8} y={y + height * 0.55} width={16} height={height*0.45} fill="#4a2c17" stroke="black" strokeWidth="0.5"/>);

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

export default HinduTemple3D;