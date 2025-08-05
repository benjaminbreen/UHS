/**
 * components/symbols/poi/GenericChurchSymbol.tsx - Renders a simple church
 */
import React from 'react';
import { Tile } from '../../../types';

interface GenericChurchSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const GenericChurchSymbol: React.FC<GenericChurchSymbolProps> = ({ x, y, size }) => {
    const stoneColor = "#E0E0E0";
    const roofColor = "#A0522D";
    const shadowColor = "#C0C0C0";
    const outlineColor = "#696969";
    const depth = size * 0.3;

    return (
        <g>
            {/* Main Body */}
            <rect x={x + size * 0.2} y={y + size * 0.4} width={size * 0.6} height={size * 0.5} fill={stoneColor} stroke={outlineColor} strokeWidth="0.2" />
            <path d={`M ${x + size * 0.8} ${y + size * 0.4} L ${x + size * 0.8 + depth} ${y + size * 0.4 - depth * 0.5} L ${x + size * 0.8 + depth} ${y + size * 0.9 - depth * 0.5} L ${x + size * 0.8} ${y + size * 0.9} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.2" />

            {/* Roof */}
            <path d={`M ${x + size * 0.15} ${y + size * 0.4} L ${x + size * 0.5} ${y + size * 0.2} L ${x + size * 0.85} ${y + size * 0.4} Z`} fill={roofColor} stroke={outlineColor} strokeWidth="0.2" />
            
            {/* Steeple */}
            <rect x={x + size * 0.4} y={y + size * 0.05} width={size * 0.2} height={size * 0.35} fill={stoneColor} stroke={outlineColor} strokeWidth="0.2" />
            <path d={`M ${x + size * 0.4} ${y + size * 0.05} L ${x + size * 0.5} ${y - size * 0.05} L ${x + size * 0.6} ${y + size * 0.05} Z`} fill={roofColor} stroke={outlineColor} strokeWidth="0.2" />
        </g>
    );
};

export default React.memo(GenericChurchSymbol);