/**
 * components/symbols/buildings/AfricanSacredGrove3D.tsx - Renders a detailed, painterly sacred grove.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface AfricanSacredGrove3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile;
}

const AfricanSacredGrove3D: React.FC<AfricanSacredGrove3DProps> = React.memo(({ x, y, width, height, size, seed, tile }) => {
    // Increased size by 40% for more imposing presence
    const scaleFactor = 1.4;
    const rand = new ValueNoise(seed + tile.x * 193 + tile.y * 197).random;
    const uniqueId = `grove-${tile.x}-${tile.y}`;
    
    const groundColor = `hsl(30, 30%, ${40 + rand()*10}%)`;
    const grassColor = `hsl(80, 40%, 35%)`;
    const treeTrunk = `hsl(25, 45%, 30%)`;
    const treeCanopy = `hsl(120, 60%, 25%)`;
    const treeHighlight = `hsl(120, 50%, 45%)`;
    const stoneColor = `hsl(0, 0%, 50%)`;

    return (
        <g filter="url(#symbolShadow)">
             {/* Clearing Base - Enlarged */}
            <ellipse cx={x+width/2} cy={y+height*0.75} rx={width/2 * scaleFactor} ry={height/4 * scaleFactor} fill={groundColor} />

            {/* Central Sacred Tree - Larger and more majestic */}
            <g>
                <rect x={x+width/2 - 3} y={y+height*0.15} width={6} height={height*0.65} fill={treeTrunk} strokeWidth="0.5" stroke="#2d1810" />
                <circle cx={x+width/2} cy={y+height*0.15} r={12} fill={treeCanopy} />
                <circle cx={x+width/2-3} cy={y+height*0.15-3} r={6} fill={treeHighlight} />
                <circle cx={x+width/2+2} cy={y+height*0.15+2} r={3} fill={treeHighlight} opacity="0.7" />
            </g>

            {/* Surrounding smaller trees - More and larger */}
            {[...Array(8)].map((_, i) => {
                const treeX = x + width * 0.15 + (i % 3) * width * 0.25 + rand()*width*0.1;
                const treeY = y + height * 0.35 + Math.floor(i/3) * height * 0.15 + rand()*height*0.08;
                return (
                    <g key={`small-tree-${i}`}>
                        <rect x={treeX - 1.5} y={treeY} width={3} height={height*0.45} fill={treeTrunk} opacity="0.8" stroke="#2d1810" strokeWidth="0.3"/>
                        <circle cx={treeX} cy={treeY} r={5 + i % 2} fill={treeCanopy} opacity="0.8"/>
                        <circle cx={treeX - 1} cy={treeY - 1} r={2} fill={treeHighlight} opacity="0.6"/>
                    </g>
                );
            })}

            {/* Standing Stones - Larger and more imposing */}
             {[...Array(6)].map((_, i) => {
                const angle = (i / 6) * Math.PI * 2;
                const radius = width * 0.3;
                const stoneX = x + width/2 + Math.cos(angle) * radius;
                const stoneY = y + height * 0.7 + Math.sin(angle) * radius * 0.3;
                return (
                    <ellipse key={`stone-${i}`} 
                        cx={stoneX} cy={stoneY} 
                        rx={2.5} ry={5} 
                        fill={stoneColor} 
                        stroke="#3d3d3d" 
                        strokeWidth="0.3" 
                    />
                );
            })}
        </g>
    );
});

export default AfricanSacredGrove3D;