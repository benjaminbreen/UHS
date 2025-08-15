/**
 * components/symbols/poi/SacredGroveSymbol.tsx - Sacred grove with stone circle and ancient trees
 * Used for pagan, druidic, and nature-worship religions
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface SacredGroveSymbolProps {
  x: number; 
  y: number; 
  size: number; 
  seed: number; 
  tile?: Tile;
}

const SacredGroveSymbol: React.FC<SacredGroveSymbolProps> = ({ x, y, size, seed, tile }) => {
  const tileX = tile?.x ?? Math.floor(x / size);
  const tileY = tile?.y ?? Math.floor(y / size);
  const rng = new ValueNoise(seed + tileX * 211 + tileY * 223);
  const uniqueId = `grove-${tileX}-${tileY}-${seed}`;
  const scaledSize = size * 1.3;
  
  // Pre-calculate random values for consistency
  const stonePositions = Array.from({length: 6}, (_, i) => ({
    angle: (i * 60 + rng.random() * 20 - 10) * Math.PI / 180,
    height: 0.08 + rng.random() * 0.04,
    width: 0.03 + rng.random() * 0.02,
    tilt: rng.random() * 10 - 5
  }));
  
  const treeData = Array.from({length: 3}, () => ({
    xPos: 0.25 + rng.random() * 0.5,
    yPos: 0.35 + rng.random() * 0.15,
    trunkWidth: 0.04 + rng.random() * 0.02,
    foliageSize: 0.12 + rng.random() * 0.06,
    foliageColor: `hsl(${100 + rng.random() * 40}, ${40 + rng.random() * 20}%, ${25 + rng.random() * 15}%)`
  }));
  
  return (
    <g filter="url(#symbolShadow)">
      {/* Ground shadow/clearing */}
      <ellipse 
        cx={x + scaledSize * 0.5} 
        cy={y + scaledSize * 0.75} 
        rx={scaledSize * 0.45} 
        ry={scaledSize * 0.2} 
        fill="rgba(0,0,0,0.15)" 
      />
      
      {/* Grass circle */}
      <ellipse 
        cx={x + scaledSize * 0.5} 
        cy={y + scaledSize * 0.7} 
        rx={scaledSize * 0.4} 
        ry={scaledSize * 0.18} 
        fill="#4A6741" 
        opacity="0.6" 
      />
      
      {/* Standing stones in circle */}
      {stonePositions.map((stone, i) => {
        const stoneX = x + scaledSize * 0.5 + Math.cos(stone.angle) * scaledSize * 0.3;
        const stoneY = y + scaledSize * 0.65 + Math.sin(stone.angle) * scaledSize * 0.12;
        const stoneHeight = scaledSize * stone.height;
        const stoneWidth = scaledSize * stone.width;
        
        return (
          <g key={`stone-${i}`} transform={`rotate(${stone.tilt} ${stoneX} ${stoneY})`}>
            {/* Stone shadow */}
            <ellipse 
              cx={stoneX + 2} 
              cy={stoneY + stoneHeight * 0.5 + 2} 
              rx={stoneWidth * 0.8} 
              ry={stoneWidth * 0.4} 
              fill="rgba(0,0,0,0.2)" 
            />
            
            {/* Stone body */}
            <rect 
              x={stoneX - stoneWidth * 0.5} 
              y={stoneY - stoneHeight * 0.5} 
              width={stoneWidth} 
              height={stoneHeight} 
              fill="#8B7D6B" 
              stroke="#6B5D54" 
              strokeWidth="0.5" 
              rx={stoneWidth * 0.2}
            />
            
            {/* Stone top */}
            <ellipse 
              cx={stoneX} 
              cy={stoneY - stoneHeight * 0.5} 
              rx={stoneWidth * 0.6} 
              ry={stoneWidth * 0.3} 
              fill="#9B8D7B" 
            />
            
            {/* Moss patches */}
            {rng.random() > 0.5 && (
              <ellipse 
                cx={stoneX - stoneWidth * 0.2} 
                cy={stoneY - stoneHeight * 0.2} 
                rx={stoneWidth * 0.25} 
                ry={stoneWidth * 0.15} 
                fill="#5A6B4A" 
                opacity="0.4" 
              />
            )}
          </g>
        );
      })}
      
      {/* Sacred trees */}
      {treeData.map((tree, i) => {
        const treeX = x + scaledSize * tree.xPos;
        const treeY = y + scaledSize * tree.yPos;
        const trunkWidth = scaledSize * tree.trunkWidth;
        const trunkHeight = scaledSize * 0.2;
        const foliageSize = scaledSize * tree.foliageSize;
        
        return (
          <g key={`tree-${i}`}>
            {/* Tree shadow */}
            <ellipse 
              cx={treeX} 
              cy={treeY + trunkHeight * 0.8} 
              rx={foliageSize * 0.8} 
              ry={foliageSize * 0.3} 
              fill="rgba(0,0,0,0.15)" 
            />
            
            {/* Tree trunk */}
            <rect 
              x={treeX - trunkWidth * 0.5} 
              y={treeY} 
              width={trunkWidth} 
              height={trunkHeight} 
              fill="#6B4423" 
              stroke="#4B3213" 
              strokeWidth="0.5" 
            />
            
            {/* Tree roots */}
            <path 
              d={`M ${treeX - trunkWidth} ${treeY + trunkHeight} 
                  Q ${treeX - trunkWidth * 0.5} ${treeY + trunkHeight * 0.9} ${treeX} ${treeY + trunkHeight}
                  M ${treeX + trunkWidth} ${treeY + trunkHeight} 
                  Q ${treeX + trunkWidth * 0.5} ${treeY + trunkHeight * 0.9} ${treeX} ${treeY + trunkHeight}`}
              stroke="#4B3213" 
              strokeWidth="1" 
              fill="none" 
            />
            
            {/* Tree foliage layers */}
            <ellipse 
              cx={treeX} 
              cy={treeY - foliageSize * 0.3} 
              rx={foliageSize} 
              ry={foliageSize * 1.2} 
              fill={tree.foliageColor} 
              opacity="0.8" 
            />
            <ellipse 
              cx={treeX} 
              cy={treeY - foliageSize * 0.5} 
              rx={foliageSize * 0.8} 
              ry={foliageSize * 0.9} 
              fill={tree.foliageColor} 
              opacity="0.7" 
              filter="url(#blur)" 
            />
            
            {/* Ancient tree markings */}
            {i === 0 && (
              <g opacity="0.3">
                <circle cx={treeX} cy={treeY + trunkHeight * 0.3} r="1" fill="#8B7D6B" />
                <circle cx={treeX - 2} cy={treeY + trunkHeight * 0.5} r="0.8" fill="#8B7D6B" />
                <circle cx={treeX + 1.5} cy={treeY + trunkHeight * 0.6} r="0.6" fill="#8B7D6B" />
              </g>
            )}
          </g>
        );
      })}
      
      {/* Central altar stone */}
      <g>
        {/* Altar shadow */}
        <ellipse 
          cx={x + scaledSize * 0.5 + 2} 
          cy={y + scaledSize * 0.68 + 2} 
          rx={scaledSize * 0.08} 
          ry={scaledSize * 0.03} 
          fill="rgba(0,0,0,0.3)" 
        />
        
        {/* Altar base */}
        <rect 
          x={x + scaledSize * 0.42} 
          y={y + scaledSize * 0.64} 
          width={scaledSize * 0.16} 
          height={scaledSize * 0.06} 
          fill="#7B6D5B" 
          stroke="#5B4D44" 
          strokeWidth="1" 
        />
        
        {/* Altar top */}
        <rect 
          x={x + scaledSize * 0.42} 
          y={y + scaledSize * 0.62} 
          width={scaledSize * 0.16} 
          height={scaledSize * 0.02} 
          fill="#8B7D6B" 
        />
        
        {/* Offerings/sacred items */}
        {rng.random() > 0.5 && (
          <>
            <circle 
              cx={x + scaledSize * 0.47} 
              cy={y + scaledSize * 0.61} 
              r={scaledSize * 0.01} 
              fill="#FFD700" 
              opacity="0.7" 
            />
            <ellipse 
              cx={x + scaledSize * 0.53} 
              cy={y + scaledSize * 0.61} 
              rx={scaledSize * 0.015} 
              ry={scaledSize * 0.008} 
              fill="#CD853F" 
              opacity="0.8" 
            />
          </>
        )}
      </g>
      
      {/* Mystical light rays (subtle) */}
      {rng.random() > 0.7 && (
        <g opacity="0.15">
          <path 
            d={`M ${x + scaledSize * 0.3} ${y + scaledSize * 0.3} 
                L ${x + scaledSize * 0.5} ${y + scaledSize * 0.65} 
                L ${x + scaledSize * 0.32} ${y + scaledSize * 0.32}`}
            fill="#FFFACD" 
          />
          <path 
            d={`M ${x + scaledSize * 0.7} ${y + scaledSize * 0.35} 
                L ${x + scaledSize * 0.5} ${y + scaledSize * 0.65} 
                L ${x + scaledSize * 0.68} ${y + scaledSize * 0.37}`}
            fill="#FFFACD" 
          />
        </g>
      )}
    </g>
  );
};

export default React.memo(SacredGroveSymbol);