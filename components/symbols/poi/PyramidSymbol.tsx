/**
 * components/symbols/poi/PyramidSymbol.tsx - Renders a generic Pyramid
 */
import React from 'react';
import { Tile } from '../../../types';

interface PyramidSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const PyramidSymbol: React.FC<PyramidSymbolProps> = ({ x, y, size }) => {
    const baseColor = "#F4A460"; // SandyBrown
    const shadowColor = "#CD853F"; // Peru
    const highlightColor = "#FFEBCD"; // BlanchedAlmond
    const outlineColor = "#8B4513"; // SaddleBrown
    const depth = size * 0.5;

    return (
        <g>
            {/* Main Body */}
            <path 
                d={`M ${x + size * 0.1} ${y + size * 0.9} L ${x + size * 0.5} ${y + size * 0.1} L ${x + size * 0.9} ${y + size * 0.9} Z`}
                fill={baseColor}
                stroke={outlineColor}
                strokeWidth="0.3"
            />
            {/* Shaded Side */}
            <path 
                d={`M ${x + size * 0.9} ${y + size * 0.9} L ${x + size * 0.5} ${y + size * 0.1} L ${x + size * 0.5 + depth} ${y + size * 0.1 - depth * 0.5} L ${x + size * 0.9 + depth} ${y + size * 0.9 - depth * 0.5} Z`}
                fill={shadowColor}
                stroke={outlineColor}
                strokeWidth="0.3"
            />
            {/* Highlight */}
             <path 
                d={`M ${x + size * 0.1} ${y + size * 0.9} L ${x + size * 0.5} ${y + size * 0.1} L ${x + size * 0.5} ${y + size * 0.15} L ${x + size * 0.15} ${y + size * 0.9} Z`}
                fill={highlightColor}
                opacity="0.4"
            />
        </g>
    );
};

export default React.memo(PyramidSymbol);