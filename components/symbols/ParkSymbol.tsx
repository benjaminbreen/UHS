/**
 * components/symbols/ParkSymbol.tsx - Renders parks with climate-specific gardens and features
 */
import React from 'react';
import { Tile, ClimateType } from '../../types';
import { ValueNoise } from '../../utils/noise';

interface ParkSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  climate: ClimateType;
}

const ParkSymbol: React.FC<ParkSymbolProps> = React.memo(({ x, y, size, seed, tile, climate }) => {
  // Use pure calculation without useMemo to ensure stability across mounts
  const localRand = (offset = 0) => new ValueNoise(seed + tile.x * 23 + tile.y * 29 + offset).random();
  const staticValues = {
    hasGeometricGarden: localRand(0) < 0.6, // 60% chance of formal garden
    gardenPattern: Math.floor(localRand(1) * 3), // 0: parterre, 1: radial, 2: grid
    hasFountain: localRand(2) < 0.3, // 30% chance of fountain
    hasBenches: localRand(3) < 0.5, // 50% chance of benches
    treeCount: Math.floor(localRand(4) * 3) + 2, // 2-4 trees
    flowerColors: [
      `hsl(${localRand(5) * 60}, 70%, 60%)`, // Primary flower color
      `hsl(${localRand(6) * 60 + 180}, 70%, 60%)`, // Complementary color
    ],
    pathRotation: localRand(7) * 45, // 0, 45, 90, 135, etc.
  };

  const elements: JSX.Element[] = [];

  // Base grass/ground
  elements.push(
    <rect
      key="base"
      x={x}
      y={y}
      width={size}
      height={size}
      fill="#4a8a3a"
      opacity="0.9"
    />
  );

  // Climate-specific geometric garden patterns
  const renderGeometricGarden = () => {
    const gardens: JSX.Element[] = [];
    const centerX = x + size/2;
    const centerY = y + size/2;
    
    switch(climate) {
      case ClimateType.TEMPERATE:
        // French formal garden style - parterre design
        if (staticValues.gardenPattern === 0) {
          // Classic parterre with box hedges
          const boxSize = size * 0.15;
          const positions = [
            {x: centerX - boxSize * 1.5, y: centerY - boxSize * 1.5},
            {x: centerX + boxSize * 0.5, y: centerY - boxSize * 1.5},
            {x: centerX - boxSize * 1.5, y: centerY + boxSize * 0.5},
            {x: centerX + boxSize * 0.5, y: centerY + boxSize * 0.5},
          ];
          
          positions.forEach((pos, i) => {
            // Hedge outline
            gardens.push(
              <rect
                key={`hedge-${i}`}
                x={pos.x}
                y={pos.y}
                width={boxSize}
                height={boxSize}
                fill="none"
                stroke="#2d5a1f"
                strokeWidth="2"
              />
            );
            // Flower bed interior
            gardens.push(
              <rect
                key={`flowers-${i}`}
                x={pos.x + 3}
                y={pos.y + 3}
                width={boxSize - 6}
                height={boxSize - 6}
                fill={staticValues.flowerColors[i % 2]}
                opacity="0.7"
              />
            );
          });
          
          // Central focal point
          gardens.push(
            <circle
              key="center"
              cx={centerX}
              cy={centerY}
              r={size * 0.08}
              fill="#6a9abd"
              stroke="#5a7a8d"
              strokeWidth="1"
              opacity="0.8"
            />
          );
        } else if (staticValues.gardenPattern === 1) {
          // Radial design with paths
          for (let angle = 0; angle < 360; angle += 45) {
            const rad = (angle * Math.PI) / 180;
            const endX = centerX + Math.cos(rad) * size * 0.35;
            const endY = centerY + Math.sin(rad) * size * 0.35;
            
            // Gravel paths
            gardens.push(
              <line
                key={`path-${angle}`}
                x1={centerX}
                y1={centerY}
                x2={endX}
                y2={endY}
                stroke="#c0b090"
                strokeWidth="2"
                opacity="0.6"
              />
            );
            
            // Flower beds between paths
            if (angle % 90 === 0) {
              const flowerX = centerX + Math.cos(rad) * size * 0.2;
              const flowerY = centerY + Math.sin(rad) * size * 0.2;
              gardens.push(
                <circle
                  key={`flower-${angle}`}
                  cx={flowerX}
                  cy={flowerY}
                  r={size * 0.06}
                  fill={staticValues.flowerColors[0]}
                  opacity="0.8"
                />
              );
            }
          }
        }
        break;
      
      case ClimateType.MEDITERRANEAN:
        // Italian Renaissance garden style - symmetrical with cypress trees
        const cypressWidth = size * 0.04;
        const cypressHeight = size * 0.12;
        const cypressPositions = [
          {x: x + size * 0.2, y: centerY},
          {x: x + size * 0.8, y: centerY},
          {x: centerX, y: y + size * 0.2},
          {x: centerX, y: y + size * 0.8},
        ];
        
        cypressPositions.forEach((pos, i) => {
          // Cypress tree silhouettes
          gardens.push(
            <ellipse
              key={`cypress-${i}`}
              cx={pos.x}
              cy={pos.y}
              rx={cypressWidth}
              ry={cypressHeight}
              fill="#1a4d2e"
              opacity="0.9"
            />
          );
        });
        
        // Central water feature
        gardens.push(
          <rect
            key="pool"
            x={centerX - size * 0.15}
            y={centerY - size * 0.08}
            width={size * 0.3}
            height={size * 0.16}
            fill="#6a9abd"
            stroke="#8a7a5a"
            strokeWidth="1"
            opacity="0.7"
          />
        );
        
        // Gravel paths
        gardens.push(
          <path
            key="cross-path"
            d={`M ${x} ${centerY} L ${x + size} ${centerY} M ${centerX} ${y} L ${centerX} ${y + size}`}
            stroke="#d4c4a0"
            strokeWidth="3"
            opacity="0.5"
          />
        );
        break;
      
      case ClimateType.SEMITROPICAL:
      case ClimateType.TROPICAL:
        // Tropical garden with palm trees and bright flowers
        const palmPositions = [
          {x: x + size * 0.25, y: y + size * 0.25},
          {x: x + size * 0.75, y: y + size * 0.25},
          {x: x + size * 0.25, y: y + size * 0.75},
          {x: x + size * 0.75, y: y + size * 0.75},
        ];
        
        palmPositions.forEach((pos, i) => {
          // Palm tree trunks
          gardens.push(
            <line
              key={`palm-trunk-${i}`}
              x1={pos.x}
              y1={pos.y + size * 0.08}
              x2={pos.x}
              y2={pos.y}
              stroke="#8b6914"
              strokeWidth="2"
            />
          );
          // Palm fronds
          for (let angle = 0; angle < 360; angle += 60) {
            const rad = (angle * Math.PI) / 180;
            const frondX = pos.x + Math.cos(rad) * size * 0.06;
            const frondY = pos.y + Math.sin(rad) * size * 0.04;
            gardens.push(
              <line
                key={`frond-${i}-${angle}`}
                x1={pos.x}
                y1={pos.y}
                x2={frondX}
                y2={frondY}
                stroke="#2d5a1f"
                strokeWidth="1.5"
              />
            );
          }
        });
        
        // Bright tropical flowers in organic curves
        const flowerPath = `M ${centerX - size * 0.2} ${centerY} 
                          Q ${centerX} ${centerY - size * 0.15} ${centerX + size * 0.2} ${centerY}
                          Q ${centerX} ${centerY + size * 0.15} ${centerX - size * 0.2} ${centerY}`;
        gardens.push(
          <path
            key="flower-bed"
            d={flowerPath}
            fill="none"
            stroke={staticValues.flowerColors[0]}
            strokeWidth="4"
            opacity="0.8"
          />
        );
        break;
      
      case ClimateType.ARID:
        // Desert garden with succulents and rock features
        const rockPositions = [
          {x: centerX - size * 0.15, y: centerY, r: size * 0.08},
          {x: centerX + size * 0.1, y: centerY - size * 0.1, r: size * 0.06},
          {x: centerX, y: centerY + size * 0.15, r: size * 0.07},
        ];
        
        rockPositions.forEach((rock, i) => {
          gardens.push(
            <ellipse
              key={`rock-${i}`}
              cx={rock.x}
              cy={rock.y}
              rx={rock.r}
              ry={rock.r * 0.6}
              fill="#a08070"
              stroke="#907060"
              strokeWidth="1"
              opacity="0.8"
            />
          );
        });
        
        // Cacti/succulents
        const cactiPositions = [
          {x: x + size * 0.3, y: y + size * 0.3},
          {x: x + size * 0.7, y: y + size * 0.4},
          {x: x + size * 0.4, y: y + size * 0.7},
        ];
        
        cactiPositions.forEach((pos, i) => {
          gardens.push(
            <circle
              key={`cactus-${i}`}
              cx={pos.x}
              cy={pos.y}
              r={size * 0.03}
              fill="#4a7c4e"
              stroke="#3a5c3e"
              strokeWidth="0.5"
            />
          );
        });
        
        // Sand/gravel paths
        gardens.push(
          <circle
            key="sand-circle"
            cx={centerX}
            cy={centerY}
            r={size * 0.35}
            fill="none"
            stroke="#e8d4a0"
            strokeWidth="2"
            strokeDasharray="4,4"
            opacity="0.6"
          />
        );
        break;
      
      case ClimateType.COLD:
        // Northern garden with evergreens and simple geometry
        const pinePositions = [
          {x: x + size * 0.2, y: y + size * 0.5},
          {x: x + size * 0.5, y: y + size * 0.2},
          {x: x + size * 0.5, y: y + size * 0.8},
          {x: x + size * 0.8, y: y + size * 0.5},
        ];
        
        pinePositions.forEach((pos, i) => {
          // Coniferous tree shapes
          gardens.push(
            <polygon
              key={`pine-${i}`}
              points={`${pos.x},${pos.y - size * 0.08} ${pos.x - size * 0.04},${pos.y + size * 0.04} ${pos.x + size * 0.04},${pos.y + size * 0.04}`}
              fill="#0d3d20"
              opacity="0.9"
            />
          );
        });
        
        // Simple stone path cross
        gardens.push(
          <path
            key="stone-path"
            d={`M ${x + size * 0.3} ${centerY} L ${x + size * 0.7} ${centerY} M ${centerX} ${y + size * 0.3} L ${centerX} ${y + size * 0.7}`}
            stroke="#808080"
            strokeWidth="4"
            opacity="0.6"
          />
        );
        break;
      
      default:
        // Generic garden for unspecified climates
        gardens.push(
          <circle
            key="generic-garden"
            cx={centerX}
            cy={centerY}
            r={size * 0.25}
            fill="none"
            stroke="#5a8a4a"
            strokeWidth="2"
            strokeDasharray="3,3"
          />
        );
    }
    
    return gardens;
  };

  // Add geometric garden if present
  if (staticValues.hasGeometricGarden) {
    elements.push(...renderGeometricGarden());
  }

  // Add benches if present
  if (staticValues.hasBenches) {
    const benchPositions = [
      {x: x + size * 0.15, y: y + size * 0.5, horizontal: true},
      {x: x + size * 0.85, y: y + size * 0.5, horizontal: true},
    ];
    
    benchPositions.forEach((bench, i) => {
      const benchWidth = bench.horizontal ? size * 0.08 : size * 0.02;
      const benchHeight = bench.horizontal ? size * 0.02 : size * 0.08;
      
      elements.push(
        <rect
          key={`bench-${i}`}
          x={bench.x - benchWidth/2}
          y={bench.y - benchHeight/2}
          width={benchWidth}
          height={benchHeight}
          fill="#8b6914"
          stroke="#6b4904"
          strokeWidth="0.5"
        />
      );
    });
  }

  // Add fountain if present and not already added by garden
  if (staticValues.hasFountain && !staticValues.hasGeometricGarden) {
    const centerX = x + size/2;
    const centerY = y + size/2;
    
    elements.push(
      <g key="fountain">
        <ellipse
          cx={centerX}
          cy={centerY}
          rx={size * 0.1}
          ry={size * 0.06}
          fill="#6a9abd"
          stroke="#5a7a8d"
          strokeWidth="0.5"
          opacity="0.8"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={size * 0.03}
          fill="#8a8a8a"
          stroke="#6a6a6a"
          strokeWidth="0.5"
        />
      </g>
    );
  }

  // Add walking paths
  const pathWidth = size * 0.03;
  elements.push(
    <path
      key="walking-paths"
      d={`M ${x} ${y + size/2} L ${x + size} ${y + size/2} M ${x + size/2} ${y} L ${x + size/2} ${y + size}`}
      stroke="#c0b090"
      strokeWidth={pathWidth}
      opacity="0.3"
    />
  );

  return <>{elements}</>;
});

export default ParkSymbol;