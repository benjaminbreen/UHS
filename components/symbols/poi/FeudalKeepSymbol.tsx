/**
 * components/symbols/poi/FeudalKeepSymbol.tsx - Renders a detailed Feudal Keep
 */
import React from 'react';
import { Tile } from '../../../types';

interface FeudalKeepSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const FeudalKeepSymbol: React.FC<FeudalKeepSymbolProps> = ({ x, y, size }) => {
    const stoneColor = "#A9A9A9";
    const roofColor = "#654321";
    const shadowColor = "#808080";
    const outlineColor = "#696969";
    const depth = size * 0.3;

    return (
        <g filter="url(#symbolShadow)">
            {/* Main Keep Side Wall */}
            <path d={`M ${x + size * 0.75} ${y + size * 0.1} L ${x + size * 0.75 + depth} ${y + size * 0.1 - depth * 0.5} L ${x + size * 0.75 + depth} ${y + size * 0.9 - depth * 0.5} L ${x + size * 0.75} ${y + size * 0.9} Z`} fill={shadowColor} stroke={outlineColor} strokeWidth="0.3" />
            
            {/* Main Keep Front Wall */}
            <rect x={x + size * 0.25} y={y + size * 0.1} width={size * 0.5} height={size * 0.8} fill={stoneColor} stroke={outlineColor} strokeWidth="0.3" />
            
            {/* Crenellations */}
            {Array.from({ length: 4 }, (_, i) => (
                <g key={`cren-group-${i}`}>
                    <path d={`M ${x + size * 0.25 + i * (size * 0.125) + size*0.06} ${y+size*0.05} L ${x + size * 0.25 + i * (size * 0.125) + size*0.06 + depth*0.3} ${y+size*0.05-depth*0.15} L ${x + size * 0.25 + i * (size * 0.125) + size*0.06 + depth*0.3} ${y+size*0.1-depth*0.15} L ${x + size * 0.25 + i * (size * 0.125) + size*0.06} ${y+size*0.1} Z`} fill={shadowColor} />
                    <rect x={x + size * 0.25 + i * (size * 0.125)} y={y + size * 0.05} width={size * 0.06} height={size * 0.05} fill={stoneColor} />
                </g>
            ))}
            
            {/* Corner Turret */}
            <rect x={x + size * 0.65} y={y} width={size * 0.15} height={size * 0.4} fill={stoneColor} stroke={outlineColor} strokeWidth="0.2" />
            <path d={`M ${x + size * 0.65} ${y} L ${x + size * 0.725} ${y - size * 0.1} L ${x + size * 0.8} ${y} Z`} fill={roofColor} stroke={outlineColor} strokeWidth="0.2" />
        </g>
    );
};

export default React.memo(FeudalKeepSymbol);