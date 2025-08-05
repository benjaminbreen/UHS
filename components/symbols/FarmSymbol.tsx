/**
 * components/symbols/FarmSymbol.tsx - Renders visually distinct farmland based on crop type.
 */
import React from 'react';
import { Tile } from '../../types/index';
import { ValueNoise } from '../../utils/noise';

interface FarmSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
}

const FarmSymbol: React.FC<FarmSymbolProps> = React.memo(({ x, y, size, tile }) => {
    const { cropType } = tile;

    const renderVineyard = () => (
        <>
            {[...Array(4)].map((_, i) => (
                <rect key={`post-row-${i}`} x={x + i * (size / 4) + 1} y={y + 2} width="1" height={size - 4} fill="#6b4a24" />
            ))}
            {[...Array(5)].map((_, i) => (
                <g key={`vine-row-${i}`}>
                    <line x1={x} y1={y + i * (size/5) + 2} x2={x+size} y2={y + i * (size/5) + 2} stroke="#5d4a33" strokeWidth="0.5" />
                    {[...Array(6)].map((_, j) => (
                         <circle key={`grape-${i}-${j}`} cx={x + j * (size/6) + 1} cy={y + i * (size/5) + 2} r="0.8" fill="#4b0082" />
                    ))}
                </g>
            ))}
        </>
    );

    const renderOliveGrove = () => (
         <>
            {[...Array(3)].map((_, row) =>
                [...Array(3)].map((_, col) => {
                    const treeX = x + (col + 0.5) * (size / 3);
                    const treeY = y + (row + 0.5) * (size / 3);
                    return (
                        <g key={`olive-${row}-${col}`}>
                            <rect x={treeX - 1} y={treeY} width="2" height="3" fill="#8B4513" />
                            <circle cx={treeX} cy={treeY} r="3" fill="#808000" />
                        </g>
                    );
                })
            )}
        </>
    );

    const renderGenericField = (color1: string, color2: string) => (
        <>
            {[...Array(6)].map((_, i) => (
                 <rect key={`row-${i}`} x={x} y={y + i * (size / 6)} width={size} height={size / 12} fill={i % 2 === 0 ? color1 : color2} />
            ))}
        </>
    );

    switch (cropType) {
        case 'Vineyard':
            return renderVineyard();
        case 'Olive Grove':
            return renderOliveGrove();
        case 'Wheat':
        case 'Barley':
        case 'Rye':
            return renderGenericField('#DAA520', '#B8860B'); // GoldenRod, DarkGoldenRod
        case 'Sugar Cane':
        case 'Corn':
            return renderGenericField('#90EE90', '#3CB371'); // LightGreen, MediumSeaGreen
        case 'Cotton':
            return renderGenericField('#FFFAFA', '#F0F8FF'); // Snow, AliceBlue
        default:
            return renderGenericField('#DAA520', '#B8860B');
    }
});

export default FarmSymbol;