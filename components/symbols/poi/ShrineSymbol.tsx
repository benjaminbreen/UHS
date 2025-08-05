/**
 * components/symbols/poi/ShrineSymbol.tsx - Renders a small, simple shrine
 */
import React from 'react';
import { Tile } from '../../../types';

interface ShrineSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const ShrineSymbol: React.FC<ShrineSymbolProps> = ({ x, y, size }) => {
    const woodColor = "#8B4513";
    const roofColor = "#A0522D";
    const outlineColor = "#5D4037";

    return (
        <g filter="url(#symbolShadow)">
            {/* Posts */}
            <rect x={x + size * 0.2} y={y + size * 0.3} width={size * 0.1} height={size * 0.6} fill={woodColor} stroke={outlineColor} strokeWidth="0.2" />
            <rect x={x + size * 0.7} y={y + size * 0.3} width={size * 0.1} height={size * 0.6} fill={woodColor} stroke={outlineColor} strokeWidth="0.2" />
            
            {/* Roof */}
            <rect x={x + size * 0.1} y={y + size * 0.2} width={size * 0.8} height={size * 0.1} fill={roofColor} stroke={outlineColor} strokeWidth="0.2" />
            
            {/* Small platform */}
            <rect x={x + size * 0.3} y={y + size * 0.6} width={size * 0.4} height={size * 0.1} fill={woodColor} />
        </g>
    );
};

export default React.memo(ShrineSymbol);