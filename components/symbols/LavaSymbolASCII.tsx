/**
 * components/symbols/LavaSymbolASCII.tsx
 * Simplified ASCII lava with volcanic rock base and sparse glowing characters
 */
import React, { useMemo } from 'react';
import { ValueNoise } from '../../utils/noise';

interface LavaSymbolASCIIProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

// Simpler ASCII characters for better performance
const LAVA_CHARS = ['◉', '●', '○', '◌'];

// Minimal color palette - mostly volcanic rock with hot spots
const LAVA_COLORS = {
  rock: '#4a4a4a',      // Volcanic rock base
  amber: '#ff8533',     // Amber glow
  red: '#cc3311',       // Red hot spots
};

// Reduced grid for performance
const GRID_SIZE = 3; // Only 3x3 grid per tile

interface CharCell {
  char: string;
  color: 'rock' | 'amber' | 'red';
  phase: number;
  show: boolean;
}

const LavaSymbolASCII: React.FC<LavaSymbolASCIIProps> = React.memo(
  ({ x, y, size, seed }) => {
    const id = useMemo(() => `lava-${Math.round(x)}-${Math.round(y)}`, [x, y]);
    
    // Generate sparse character grid
    const charGrid = useMemo(() => {
      const noise = new ValueNoise(seed);
      const grid: CharCell[][] = [];
      
      for (let gy = 0; gy < GRID_SIZE; gy++) {
        const row: CharCell[] = [];
        for (let gx = 0; gx < GRID_SIZE; gx++) {
          // Use world coordinates for consistency across tiles
          const worldX = (x + gx / GRID_SIZE) / 5;
          const worldY = (y + gy / GRID_SIZE) / 5;
          const heat = noise.noise(worldX, worldY) * 0.5 + 0.5;
          
          // Most cells are volcanic rock color (invisible on rock background)
          // Only show hot spots sparsely
          const show = heat > 0.7; // Only 30% of cells show hot spots
          
          // Determine color based on heat
          let color: CharCell['color'] = 'rock';
          if (show) {
            color = heat > 0.85 ? 'red' : 'amber';
          }
          
          // Simple character selection
          const charIndex = Math.floor(heat * 4) % LAVA_CHARS.length;
          
          row.push({
            char: LAVA_CHARS[charIndex],
            color,
            phase: heat * 2, // Animation offset
            show
          });
        }
        grid.push(row);
      }
      
      return grid;
    }, [x, y, seed]);
    
    const charSize = size / GRID_SIZE;
    
    return (
      <g transform={`translate(${x}, ${y})`} pointerEvents="none">
        {/* Volcanic rock base - matches surrounding terrain */}
        <rect 
          width={size} 
          height={size} 
          fill={LAVA_COLORS.rock}
        />
        
        {/* Sparse glowing ASCII characters */}
        {charGrid.map((row, gy) => 
          row.map((cell, gx) => {
            if (!cell.show) return null; // Most cells are invisible
            
            const cellX = gx * charSize + charSize / 2;
            const cellY = gy * charSize + charSize / 2;
            const color = LAVA_COLORS[cell.color];
            
            return (
              <g key={`${gx}-${gy}`}>
                {/* Blurred glow layer for fuzzy appearance */}
                <text
                  x={cellX}
                  y={cellY}
                  fontSize={charSize * 0.8}
                  fontFamily="monospace"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={color}
                  opacity={0.4}
                  style={{ filter: 'blur(3px)' }}
                >
                  {cell.char}
                </text>
                
                {/* Main character with simple fade animation */}
                <text
                  x={cellX}
                  y={cellY}
                  fontSize={charSize * 0.8}
                  fontFamily="monospace"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={color}
                  opacity={0.7}
                >
                  {cell.char}
                  {/* Single simple animation for flowing effect */}
                  <animate
                    attributeName="opacity"
                    values="0.3;0.8;0.3"
                    dur={`${3 + cell.phase}s`}
                    repeatCount="indefinite"
                  />
                </text>
              </g>
            );
          })
        )}
      </g>
    );
  }
);

export default LavaSymbolASCII;