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

    // Single soft shadow for performance
    elements.push(
      <ellipse key="shadow" cx={x + width/2} cy={y + height + 2} rx={width * 0.6} ry={height * 0.15} fill="rgba(0,0,0,0.25)" filter="blur(1px)" />
    );


    // Base Platform - Properly centered after scaling
    const platformHeight = height * 0.25 * scaleFactor;
    const scaledWidth = width * scaleFactor;
    const centerOffset = (scaledWidth - width) / 2;
    elements.push(<rect x={x - centerOffset} y={y + height * 0.75} width={scaledWidth} height={platformHeight} fill={`url(#stoneGrad-${uniqueId})`} stroke={outlineColor} strokeWidth="0.5"/>);
    elements.push(<path d={`M ${x + scaledWidth - centerOffset} ${y+height*0.75} L ${x + scaledWidth - centerOffset + depth} ${y+height*0.75-depth*0.5} L ${x + scaledWidth - centerOffset + depth} ${y+height*1.25-depth*0.5} L ${x + scaledWidth - centerOffset} ${y+height*1.25} Z`} fill={stoneShadow} stroke={outlineColor} strokeWidth="0.5"/>);

    // Main Structure (Mandapa) - Properly centered
    const mandapaHeight = height * 0.6 * scaleFactor;
    const mandapaY = y + height * 0.75 - mandapaHeight;
    const mandapaWidth = width * 1.2 * scaleFactor;
    const mandapaOffset = (mandapaWidth - width) / 2;
    elements.push(<rect x={x - mandapaOffset} y={mandapaY} width={mandapaWidth} height={mandapaHeight} fill={stoneColor} stroke={outlineColor} strokeWidth="0.5"/>);
    elements.push(<path d={`M ${x + mandapaWidth - mandapaOffset} ${mandapaY} L ${x + mandapaWidth - mandapaOffset + depth*0.8} ${mandapaY-depth*0.4} L ${x + mandapaWidth - mandapaOffset + depth*0.8} ${y+height*0.75-depth*0.4} L ${x + mandapaWidth - mandapaOffset} ${y+height*0.75} Z`} fill={stoneShadow} stroke={outlineColor} strokeWidth="0.5"/>);
    
    // Shikhara (Tower) - Fixed pyramid shape
    const shikharaY = mandapaY;
    const shikharaHeight = height * 0.7 * scaleFactor;
    elements.push(
        <path
            d={`M ${x + width*0.3} ${shikharaY} L ${x + width*0.5} ${shikharaY - shikharaHeight} L ${x + width*0.7} ${shikharaY} Z`}
            fill={accentColor}
            stroke={outlineColor}
            strokeWidth="0.5"
        />
    );
    // Shikhara carving pattern - More detailed
    for(let i = 0; i < 7; i++) {
        const lineY = shikharaY - i * 5;
        if (lineY > y - height*0.15) {
             elements.push(<path d={`M ${x+width*0.25} ${lineY} C ${x+width/2} ${lineY-4}, ${x+width*0.75} ${lineY}`} stroke={goldColor} strokeWidth="0.3" fill="none" opacity="0.7"/>);
        }
    }
    
    // Finial (Kalasha) on top - Standardized stroke
    elements.push(<circle cx={x + width/2} cy={y-height*0.2-3} r={5} fill={goldColor} stroke="black" strokeWidth="0.3"/>);
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