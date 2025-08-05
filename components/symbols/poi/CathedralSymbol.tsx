/**
 * components/symbols/poi/CathedralSymbol.tsx - Renders a detailed Gothic Cathedral
 */
import React from 'react';
import { Tile } from '../../../types';

interface CathedralSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const CathedralSymbol: React.FC<CathedralSymbolProps> = ({ x, y, size }) => {
    const stoneColor = "#D3D3D3";
    const roofColor = "#2F4F4F";
    const shadowColor = "#A9A9A9";
    const outlineColor = "#696969";
    const depth = size * 0.4;

    return (
        <g filter="url(#symbolShadow)">
            {/* Main Nave Side Wall */}
            <path d={`M ${x + size * 0.8} ${y + size * 0.3} L ${x + size * 0.8 + depth} ${y + size * 0.3 - depth * 0.5} L ${x + size * 0.8 + depth} ${y + size * 0.9 - depth * 0.5} L ${x + size * 0.8} ${y + size * 0.9} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.3" />
            
            {/* Main Nave Front Wall */}
            <rect x={x + size * 0.2} y={y + size * 0.3} width={size * 0.6} height={size * 0.6} fill={stoneColor} stroke={outlineColor} strokeWidth="0.3" />

            {/* Roof */}
            <path d={`M ${x + size * 0.15} ${y + size * 0.3} L ${x + size * 0.5} ${y + size * 0.1} L ${x + size * 0.85} ${y + size * 0.3} Z`} fill={roofColor} stroke={outlineColor} strokeWidth="0.3" />
            <path d={`M ${x + size * 0.85} ${y + size * 0.3} L ${x + size * 0.85 + depth} ${y + size * 0.3 - depth*0.5} L ${x + size * 0.5 + depth} ${y + size*0.1 - depth*0.5} L ${x + size * 0.5} ${y+size*0.1} Z`} fill={roofColor} style={{filter: 'brightness(0.7)'}} stroke={outlineColor} strokeWidth="0.3"/>
            
            {/* Bell Tower */}
            <rect x={x + size * 0.05} y={y + size * 0.1} width={size * 0.2} height={size * 0.8} fill={stoneColor} stroke={outlineColor} strokeWidth="0.3" />
            <path d={`M ${x + size * 0.25} ${y + size * 0.1} L ${x + size * 0.25 + depth*0.3} ${y + size * 0.1 - depth * 0.15} L ${x + size * 0.25 + depth*0.3} ${y + size * 0.9 - depth*0.15} L ${x + size * 0.25} ${y + size * 0.9} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.3" />
            
            {/* Spire */}
            <path d={`M ${x + size * 0.05} ${y + size * 0.1} L ${x + size * 0.15} ${y - size * 0.1} L ${x + size * 0.25} ${y + size * 0.1} Z`} fill={roofColor} stroke={outlineColor} strokeWidth="0.3" />
        </g>
    );
};

export default React.memo(CathedralSymbol);