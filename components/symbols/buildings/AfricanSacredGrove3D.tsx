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
             {/* Clearing Base */}
            <ellipse cx={x+width/2} cy={y+height*0.75} rx={width/2} ry={height/4} fill={groundColor} />

            {/* Central Sacred Tree */}
            <g>
                <rect x={x+width/2 - 2} y={y+height*0.2} width={4} height={height*0.6} fill={treeTrunk} />
                <circle cx={x+width/2} cy={y+height*0.2} r={8} fill={treeCanopy} />
                <circle cx={x+width/2-2} cy={y+height*0.2-2} r={4} fill={treeHighlight} />
            </g>

            {/* Surrounding smaller trees */}
            {[...Array(5)].map((_, i) => (
                <g key={`small-tree-${i}`}>
                    <rect x={x + 5 + i * 4 + rand()*2} y={y+height*0.4+rand()*5} width={2} height={height*0.4} fill={treeTrunk} opacity="0.8"/>
                    <circle cx={x + 6 + i * 4 + rand()*2} cy={y+height*0.4+rand()*5} r={4} fill={treeCanopy} opacity="0.8"/>
                </g>
            ))}

            {/* Standing Stones */}
             {[...Array(4)].map((_, i) => (
                <ellipse key={`stone-${i}`} cx={x + 10 + i * 4 + rand()*3} cy={y+height*0.7} rx={1.5} ry={3} fill={stoneColor} />
            ))}
        </g>
    );
});

export default AfricanSacredGrove3D;