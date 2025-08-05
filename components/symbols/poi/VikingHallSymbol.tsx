/**
 * components/symbols/poi/VikingHallSymbol.tsx - Renders a Viking Longhouse/Hall
 */
import React from 'react';
import { Tile } from '../../../types';

interface VikingHallSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const VikingHallSymbol: React.FC<VikingHallSymbolProps> = ({ x, y, size }) => {
    const woodColor = "#8B4513";
    const roofColor = "#A0522D";
    const shadowColor = "#654321";
    const outlineColor = "#5D4037";
    const depth = size * 0.4;
    
    return (
        <g filter="url(#symbolShadow)">
            {/* Main Hall */}
            <rect x={x + size * 0.1} y={y + size * 0.4} width={size * 0.8} height={size * 0.5} fill={woodColor} stroke={outlineColor} strokeWidth="0.3" />
            
            {/* Curved Roof */}
            <path d={`M ${x + size * 0.05} ${y + size * 0.4} Q ${x + size * 0.5} ${y + size * 0.2}, ${x + size * 0.95} ${y + size * 0.4} Z`} fill={roofColor} stroke={outlineColor} strokeWidth="0.3" />

            {/* Door */}
            <rect x={x + size*0.45} y={y+size*0.7} width={size*0.1} height={size*0.2} fill={shadowColor} />
        </g>
    );
};

export default React.memo(VikingHallSymbol);