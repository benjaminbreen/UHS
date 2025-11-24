/**
 * components/symbols/MountainSymbol.tsx
 * Procedural mountain peaks for mountain terrain tiles
 */
import React, { useMemo } from 'react';
import { ClimateType } from '../../types';
import { Season } from '../../types/game';

interface MountainSymbolProps {
  x: number;
  y: number;
  size: number;
  seed?: number;
  altitude?: number; // 0-1 value for height
  climate?: ClimateType;
  season?: Season;
}

const MountainSymbol: React.FC<MountainSymbolProps> = React.memo(({ x, y, size, seed = 0, altitude = 0.7, climate, season }) => {
  // Generate procedural mountain peaks based on seed and altitude
  const mountains = useMemo(() => {
    const rng = (s: number) => {
      let x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };
    
    // Altitude affects height: 0.5 = low mountains, 1.0 = tall peaks
    const heightMultiplier = 0.5 + altitude * 0.5; // Range from 0.5x to 1.0x height
    
    const peaks = [];
    const numPeaks = 2 + Math.floor(rng(seed) * 2); // 2-3 peaks
    
    for (let i = 0; i < numPeaks; i++) {
      const peakSeed = seed + i * 137;
      const peakX = size * (0.2 + rng(peakSeed) * 0.6); // Position across tile
      const baseHeight = size * (0.3 + rng(peakSeed + 1) * 0.4); // Base varying heights
      const peakHeight = baseHeight * heightMultiplier; // Apply altitude multiplier
      const peakWidth = size * (0.3 + rng(peakSeed + 2) * 0.2); // Varying widths
      const skew = (rng(peakSeed + 3) - 0.5) * 0.3; // Asymmetry
      
      // Create triangular peak path
      const leftBase = peakX - peakWidth / 2;
      const rightBase = peakX + peakWidth / 2;
      const peakTop = size - peakHeight;
      const peakApex = peakX + skew * peakWidth;
      
      peaks.push({
        path: `M ${leftBase} ${size} L ${peakApex} ${peakTop} L ${rightBase} ${size} Z`,
        depth: i, // For layering
        shade: i === 0 ? 0.15 : 0.1, // Front peaks darker
      });
    }
    
    return peaks.reverse(); // Draw back peaks first
  }, [seed, size, altitude]);
  
  // Generate snow caps based on altitude, climate, and season
  const snowCaps = useMemo(() => {
    const rng = (s: number) => {
      let x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    // ALTITUDE-BASED SNOW LINE (primary factor)
    // Different climates have different snow line altitudes
    let snowLineAltitude = 0.70; // Default temperate

    if (climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL) {
      snowLineAltitude = 0.85; // Very high only (like Kilimanjaro, high Andes)
    } else if (climate === ClimateType.COLD || climate === ClimateType.ARCTIC || climate === ClimateType.CONTINENTAL) {
      snowLineAltitude = 0.55; // Snow on moderate peaks
    } else if (climate === ClimateType.TEMPERATE) {
      snowLineAltitude = 0.70; // High peaks only
    } else if (climate === ClimateType.ARID || climate === ClimateType.MEDITERRANEAN) {
      snowLineAltitude = 0.75; // Only very high peaks
    }

    // Seasonal adjustment (lower snow line in winter)
    let seasonalAdjustment = 0;
    if (season === 'winter') {
      seasonalAdjustment = -0.10; // Snow line drops 10% in winter
    } else if (season === 'spring' || season === 'autumn') {
      seasonalAdjustment = -0.05; // Snow line drops 5% in spring/autumn
    }
    // Summer has no adjustment (highest snow line)

    const effectiveSnowLine = snowLineAltitude + seasonalAdjustment;

    // If altitude is below snow line, no snow
    if (altitude < effectiveSnowLine) return [];

    // More altitude = more snow coverage (normalized from snow line to max altitude)
    const snowAmount = Math.min(1.0, (altitude - effectiveSnowLine) / (1.0 - effectiveSnowLine));
    
    return mountains.map((mountain, i) => {
      const snowSeed = seed + i * 241;
      // Snow extends further down on higher mountains
      const snowLine = 0.5 - (snowAmount * 0.3) - rng(snowSeed) * 0.1; // Higher mountains = lower snow line
      
      // Parse the mountain path to get peak coordinates
      const pathParts = mountain.path.split(' ');
      const leftX = parseFloat(pathParts[1]);
      const peakX = parseFloat(pathParts[4]);
      const peakY = parseFloat(pathParts[5]);
      const rightX = parseFloat(pathParts[7]);
      const baseY = parseFloat(pathParts[2]);
      
      const snowY = peakY + (baseY - peakY) * snowLine;
      
      // Create irregular snow cap
      const leftSnowX = leftX + (peakX - leftX) * snowLine;
      const rightSnowX = rightX - (rightX - peakX) * snowLine;
      
      return `M ${leftSnowX} ${snowY} L ${peakX} ${peakY} L ${rightSnowX} ${snowY} Z`;
    });
  }, [mountains, seed, altitude, climate, season]);
  
  return (
    <g transform={`translate(${x}, ${y - size * 0.15})`}>
      {/* Mountain peaks */}
      {mountains.map((mountain, i) => (
        <g key={i}>
          {/* Main peak */}
          <path
            d={mountain.path}
            fill={`rgba(140, 140, 150, ${0.7 + mountain.depth * 0.1})`}
            stroke="rgba(100, 100, 110, 0.3)"
            strokeWidth="0.5"
          />
          
          {/* Shadow side */}
          <path
            d={mountain.path}
            fill={`rgba(80, 80, 90, ${mountain.shade})`}
            style={{
              clipPath: `polygon(0 0, 50% 0, 50% 100%, 0 100%)`,
            }}
          />
        </g>
      ))}
      
      {/* Snow caps */}
      {snowCaps.map((snowPath, i) => (
        <path
          key={`snow-${i}`}
          d={snowPath}
          fill="rgba(255, 255, 255, 0.9)"
          stroke="rgba(220, 230, 240, 0.5)"
          strokeWidth="0.3"
        />
      ))}
      
      {/* Rock texture details */}
      {mountains.map((_, i) => {
        const detailSeed = seed + i * 317;
        const rng = (s: number) => {
          let x = Math.sin(s) * 10000;
          return x - Math.floor(x);
        };
        
        return Array.from({ length: 3 }, (_, j) => {
          const dx = size * (0.2 + rng(detailSeed + j) * 0.6);
          const dy = size * (0.5 + rng(detailSeed + j + 10) * 0.4);
          const lineLength = 2 + rng(detailSeed + j + 20) * 3;
          
          return (
            <line
              key={`detail-${i}-${j}`}
              x1={dx}
              y1={dy}
              x2={dx + lineLength}
              y2={dy + 1}
              stroke="rgba(100, 100, 110, 0.2)"
              strokeWidth="0.5"
            />
          );
        });
      })}
    </g>
  );
});

export default MountainSymbol;