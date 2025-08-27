/**
 * components/symbols/ruins/ColonialRuinsSymbol.tsx
 * Renders colonial era ruins: missions, forts, plantations, trading posts (1500-1960)
 * Historical accuracy: Spanish, Portuguese, British, French, Dutch, Belgian colonial architecture
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface ColonialRuinsSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  preservationLevel: number;
  empire?: string; // Spanish, Portuguese, British, French, Dutch
}

const ColonialRuinsSymbol: React.FC<ColonialRuinsSymbolProps> = ({ 
  x, y, size, seed, tile, preservationLevel, empire = 'Spanish'
}) => {
  const rng = new ValueNoise(seed + tile.x * 101 + tile.y * 103);
  const elements: JSX.Element[] = [];
  
  // Building types by empire
  const buildingTypes = {
    Spanish: ['mission', 'presidio', 'hacienda'],
    Portuguese: ['fort', 'church', 'fazenda'],
    British: ['fort', 'trading_post', 'plantation'],
    French: ['trading_post', 'church', 'plantation'],
    Dutch: ['fort', 'trading_post', 'warehouse']
  };
  
  const availableTypes = buildingTypes[empire] || buildingTypes.Spanish;
  const buildingType = availableTypes[Math.floor(rng.random() * availableTypes.length)];
  
  // Material colors by empire and region
  const colorSchemes = {
    Spanish: {
      stucco: '#F5DEB3', // Wheat - whitewashed adobe
      tile: '#D2691E', // Red clay tiles
      wood: '#8B4513', // Dark wood
      stone: '#DEB887', // Sandstone
      accent: '#CD853F' // Peru
    },
    Portuguese: {
      stucco: '#FAEBD7', // Antique white
      tile: '#B22222', // Fire brick red
      wood: '#654321', // Dark brown
      stone: '#F5F5DC', // Beige limestone
      accent: '#4682B4' // Azulejo blue
    },
    British: {
      brick: '#8B4513', // Red brick
      stone: '#808080', // Grey stone
      wood: '#654321', // Dark timber
      slate: '#708090', // Slate roof
      accent: '#F5F5F5' // White trim
    },
    French: {
      stucco: '#FFF8DC', // Cornsilk
      tile: '#A0522D', // Sienna tiles
      wood: '#8B4513', // Brown
      stone: '#D3D3D3', // Light grey
      accent: '#6495ED' // Cornflower blue
    },
    Dutch: {
      brick: '#CD5C5C', // Indian red brick
      tile: '#FF6347', // Orange-red tiles
      wood: '#8B4513', // Brown
      stone: '#696969', // Dim grey
      accent: '#F5F5F5' // White trim
    }
  };
  
  const colors = colorSchemes[empire] || colorSchemes.Spanish;
  
  // Base shadow
  elements.push(
    <ellipse
      key="shadow"
      cx={x + size * 0.5}
      cy={y + size * 0.85}
      rx={size * 0.45}
      ry={size * 0.15}
      fill="rgba(0,0,0,0.3)"
    />
  );
  
  if (buildingType === 'mission') {
    // Spanish mission with bell tower and arcade
    
    const churchX = x + size * 0.25;
    const churchY = y + size * 0.45;
    const churchWidth = size * 0.4;
    const churchHeight = size * 0.25;
    
    // Main church building
    elements.push(
      <g key="mission-church">
        <rect
          x={churchX}
          y={churchY}
          width={churchWidth}
          height={churchHeight}
          fill={colors.stucco}
          stroke={colors.stone}
          strokeWidth="0.5"
        />
        
        {/* Baroque facade with curved parapet */}
        <path
          d={`M ${churchX} ${churchY}
              Q ${churchX + churchWidth * 0.25} ${churchY - size * 0.03}
                ${churchX + churchWidth * 0.5} ${churchY - size * 0.04}
              Q ${churchX + churchWidth * 0.75} ${churchY - size * 0.03}
                ${churchX + churchWidth} ${churchY}`}
          fill={colors.stucco}
          stroke={colors.stone}
          strokeWidth="0.4"
        />
        
        {/* Main entrance */}
        <g>
          <path
            d={`M ${churchX + churchWidth * 0.35} ${churchY + churchHeight}
                L ${churchX + churchWidth * 0.35} ${churchY + churchHeight * 0.4}
                Q ${churchX + churchWidth * 0.5} ${churchY + churchHeight * 0.3}
                  ${churchX + churchWidth * 0.65} ${churchY + churchHeight * 0.4}
                L ${churchX + churchWidth * 0.65} ${churchY + churchHeight}`}
            fill="rgba(0,0,0,0.6)"
            stroke={colors.accent}
            strokeWidth="0.4"
          />
        </g>
        
        {/* Rose window (if preserved) */}
        {preservationLevel > 0.5 && (
          <circle
            cx={churchX + churchWidth * 0.5}
            cy={churchY + churchHeight * 0.25}
            r={size * 0.025}
            fill="none"
            stroke={colors.accent}
            strokeWidth="0.4"
          />
        )}
      </g>
    );
    
    // Bell tower (campanario)
    const towerX = churchX + churchWidth * 0.85;
    const towerHeight = preservationLevel > 0.4 ? size * (0.35 + preservationLevel * 0.1) : size * 0.2;
    const towerWidth = size * 0.08;
    const towerY = y + size * 0.7 - towerHeight;
    
    elements.push(
      <g key="bell-tower">
        <rect
          x={towerX}
          y={towerY}
          width={towerWidth}
          height={towerHeight}
          fill={colors.stucco}
          stroke={colors.stone}
          strokeWidth="0.4"
        />
        
        {/* Bell openings (if preserved) */}
        {preservationLevel > 0.5 && (
          <>
            {[0.2, 0.35].map((yOff) => (
              <path
                key={`bell-opening-${yOff}`}
                d={`M ${towerX + towerWidth * 0.2} ${towerY + towerHeight * yOff}
                    Q ${towerX + towerWidth * 0.5} ${towerY + towerHeight * (yOff - 0.05)}
                      ${towerX + towerWidth * 0.8} ${towerY + towerHeight * yOff}`}
                fill="rgba(0,0,0,0.5)"
                stroke={colors.accent}
                strokeWidth="0.2"
              />
            ))}
            
            {/* Cross on top */}
            {preservationLevel > 0.7 && (
              <g>
                <line
                  x1={towerX + towerWidth * 0.5}
                  y1={towerY - size * 0.02}
                  x2={towerX + towerWidth * 0.5}
                  y2={towerY}
                  stroke={colors.accent}
                  strokeWidth="0.5"
                />
                <line
                  x1={towerX + towerWidth * 0.35}
                  y1={towerY - size * 0.015}
                  x2={towerX + towerWidth * 0.65}
                  y2={towerY - size * 0.015}
                  stroke={colors.accent}
                  strokeWidth="0.5"
                />
              </g>
            )}
          </>
        )}
      </g>
    );
    
    // Arcade/cloister (if preserved)
    if (preservationLevel > 0.4) {
      const arcadeY = churchY + churchHeight * 0.7;
      const numArches = 3;
      
      for (let i = 0; i < numArches; i++) {
        const archX = churchX - size * 0.12 + i * size * 0.06;
        const archWidth = size * 0.04;
        const archHeight = size * 0.05;
        
        elements.push(
          <path
            key={`arcade-arch-${i}`}
            d={`M ${archX} ${arcadeY}
                L ${archX} ${arcadeY - archHeight * 0.7}
                Q ${archX + archWidth * 0.5} ${arcadeY - archHeight}
                  ${archX + archWidth} ${arcadeY - archHeight * 0.7}
                L ${archX + archWidth} ${arcadeY}`}
            fill="none"
            stroke={colors.stone}
            strokeWidth="0.3"
            opacity={0.7}
          />
        );
      }
    }
    
  } else if (buildingType === 'fort' || buildingType === 'presidio') {
    // Colonial fort with bastions
    
    const fortX = x + size * 0.25;
    const fortY = y + size * 0.5;
    const fortSize = size * 0.5;
    
    // Star fort outline (simplified)
    const bastions = preservationLevel > 0.5 ? 4 : 2;
    
    // Main walls
    elements.push(
      <rect
        key="fort-walls"
        x={fortX}
        y={fortY}
        width={fortSize}
        height={fortSize * 0.6}
        fill="none"
        stroke={empire === 'British' ? colors.stone : colors.stucco}
        strokeWidth="2"
        opacity={0.8}
      />
    );
    
    // Bastions at corners
    const bastionSize = size * 0.06;
    const corners = [
      { x: fortX, y: fortY },
      { x: fortX + fortSize, y: fortY },
      { x: fortX + fortSize, y: fortY + fortSize * 0.6 },
      { x: fortX, y: fortY + fortSize * 0.6 }
    ];
    
    corners.slice(0, bastions).forEach((corner, idx) => {
      const isCollapsed = rng.random() > preservationLevel + 0.3;
      
      if (!isCollapsed) {
        elements.push(
          <polygon
            key={`bastion-${idx}`}
            points={`${corner.x},${corner.y}
                     ${corner.x + (idx % 2 === 0 ? -bastionSize : bastionSize)},${corner.y + (idx < 2 ? -bastionSize * 0.7 : bastionSize * 0.7)}
                     ${corner.x + (idx % 2 === 0 ? 0 : bastionSize)},${corner.y + bastionSize * 0.5}
                     ${corner.x + (idx % 2 === 0 ? bastionSize : 0)},${corner.y + bastionSize * 0.5}`}
            fill={empire === 'British' ? colors.stone : colors.stucco}
            stroke={colors.accent}
            strokeWidth="0.4"
            opacity={0.7}
          />
        );
      } else {
        // Rubble from collapsed bastion
        elements.push(
          <ellipse
            key={`bastion-rubble-${idx}`}
            cx={corner.x}
            cy={corner.y}
            rx={bastionSize}
            ry={bastionSize * 0.5}
            fill={colors.stone}
            opacity={0.5}
          />
        );
      }
    });
    
    // Gate house
    if (preservationLevel > 0.3) {
      const gateX = fortX + fortSize * 0.4;
      const gateY = fortY + fortSize * 0.6;
      const gateWidth = fortSize * 0.2;
      const gateHeight = size * 0.06;
      
      elements.push(
        <g key="gatehouse">
          <rect
            x={gateX}
            y={gateY - gateHeight}
            width={gateWidth}
            height={gateHeight}
            fill={colors.stone}
            stroke={colors.accent}
            strokeWidth="0.3"
          />
          <rect
            x={gateX + gateWidth * 0.3}
            y={gateY - gateHeight * 0.6}
            width={gateWidth * 0.4}
            height={gateHeight * 0.6}
            fill="rgba(0,0,0,0.6)"
          />
        </g>
      );
    }
    
  } else if (buildingType === 'plantation' || buildingType === 'hacienda' || buildingType === 'fazenda') {
    // Colonial plantation house with verandah
    
    const houseX = x + size * 0.2;
    const houseY = y + size * 0.5;
    const houseWidth = size * 0.6;
    const houseHeight = size * 0.2;
    
    // Main house
    elements.push(
      <g key="plantation-house">
        <rect
          x={houseX}
          y={houseY}
          width={houseWidth}
          height={houseHeight}
          fill={empire === 'British' ? colors.brick : colors.stucco}
          stroke={colors.accent}
          strokeWidth="0.5"
        />
        
        {/* Roof (if preserved) */}
        {preservationLevel > 0.4 && (
          <polygon
            points={`${houseX - size * 0.03},${houseY}
                     ${houseX + houseWidth * 0.5},${houseY - houseHeight * 0.5}
                     ${houseX + houseWidth + size * 0.03},${houseY}`}
            fill={empire === 'Spanish' ? colors.tile : colors.slate}
            stroke={colors.accent}
            strokeWidth="0.4"
            opacity={0.8}
          />
        )}
        
        {/* Verandah columns */}
        {preservationLevel > 0.3 && (
          <>
            {[0.15, 0.35, 0.55, 0.75].map((xOff, idx) => {
              const colX = houseX + houseWidth * xOff;
              const colHeight = houseHeight * (preservationLevel > 0.6 ? 1 : 0.7);
              const isStanding = rng.random() < preservationLevel + 0.4;
              
              if (isStanding) {
                return (
                  <g key={`column-${idx}`}>
                    <rect
                      x={colX}
                      y={houseY + houseHeight - colHeight}
                      width={size * 0.015}
                      height={colHeight}
                      fill="white"
                      stroke={colors.accent}
                      strokeWidth="0.2"
                    />
                    {/* Capital */}
                    {preservationLevel > 0.6 && (
                      <rect
                        x={colX - size * 0.003}
                        y={houseY + houseHeight - colHeight - size * 0.01}
                        width={size * 0.021}
                        height={size * 0.01}
                        fill="white"
                        stroke={colors.accent}
                        strokeWidth="0.2"
                      />
                    )}
                  </g>
                );
              }
              return null;
            })}
          </>
        )}
        
        {/* Windows with shutters */}
        {preservationLevel > 0.4 && (
          <>
            {[0.25, 0.5, 0.75].map((xOff) => (
              <g key={`window-${xOff}`}>
                <rect
                  x={houseX + houseWidth * xOff - size * 0.02}
                  y={houseY + houseHeight * 0.3}
                  width={size * 0.04}
                  height={size * 0.05}
                  fill="rgba(0,0,0,0.5)"
                  stroke={colors.accent}
                  strokeWidth="0.2"
                />
                {/* Shutters */}
                {preservationLevel > 0.6 && (
                  <>
                    <rect
                      x={houseX + houseWidth * xOff - size * 0.03}
                      y={houseY + houseHeight * 0.3}
                      width={size * 0.008}
                      height={size * 0.05}
                      fill={colors.wood}
                      opacity={0.7}
                    />
                    <rect
                      x={houseX + houseWidth * xOff + size * 0.02}
                      y={houseY + houseHeight * 0.3}
                      width={size * 0.008}
                      height={size * 0.05}
                      fill={colors.wood}
                      opacity={0.7}
                    />
                  </>
                )}
              </g>
            ))}
          </>
        )}
      </g>
    );
    
    // Outbuildings (slave quarters, sugar mill, etc.)
    if (preservationLevel > 0.2) {
      const outbuildingX = houseX + houseWidth * 0.7;
      const outbuildingY = houseY + houseHeight * 1.2;
      
      elements.push(
        <rect
          key="outbuilding"
          x={outbuildingX}
          y={outbuildingY}
          width={size * 0.12}
          height={size * 0.08}
          fill={colors.wood}
          stroke={colors.accent}
          strokeWidth="0.3"
          opacity={0.6}
        />
      );
    }
    
  } else if (buildingType === 'trading_post' || buildingType === 'warehouse') {
    // Trading post/warehouse with Dutch gables
    
    const warehouseX = x + size * 0.25;
    const warehouseY = y + size * 0.45;
    const warehouseWidth = size * 0.5;
    const warehouseHeight = size * 0.25;
    
    elements.push(
      <g key="warehouse">
        <rect
          x={warehouseX}
          y={warehouseY}
          width={warehouseWidth}
          height={warehouseHeight}
          fill={empire === 'Dutch' ? colors.brick : colors.stone}
          stroke={colors.accent}
          strokeWidth="0.5"
        />
        
        {/* Dutch stepped gable (if Dutch and preserved) */}
        {empire === 'Dutch' && preservationLevel > 0.5 && (
          <g>
            {[0, 0.2, 0.4].map((yOff, idx) => (
              <rect
                key={`gable-step-${idx}`}
                x={warehouseX + warehouseWidth * (0.3 + idx * 0.1)}
                y={warehouseY - size * (0.03 + yOff * 0.02)}
                width={warehouseWidth * 0.4 / (idx + 1)}
                height={size * 0.02}
                fill={colors.brick}
                stroke={colors.accent}
                strokeWidth="0.3"
              />
            ))}
          </g>
        )}
        
        {/* Loading doors */}
        {[0.2, 0.5, 0.8].map((xOff) => (
          <rect
            key={`door-${xOff}`}
            x={warehouseX + warehouseWidth * xOff - size * 0.03}
            y={warehouseY + warehouseHeight * 0.5}
            width={size * 0.06}
            height={warehouseHeight * 0.5}
            fill="rgba(0,0,0,0.6)"
            stroke={colors.wood}
            strokeWidth="0.3"
          />
        ))}
        
        {/* Hoist beam (if preserved) */}
        {preservationLevel > 0.6 && (
          <g>
            <rect
              x={warehouseX + warehouseWidth * 0.5 - size * 0.005}
              y={warehouseY - size * 0.04}
              width={size * 0.08}
              height={size * 0.01}
              fill={colors.wood}
              stroke={colors.accent}
              strokeWidth="0.2"
            />
            {/* Pulley */}
            <circle
              cx={warehouseX + warehouseWidth * 0.5 + size * 0.06}
              cy={warehouseY - size * 0.035}
              r={size * 0.008}
              fill="none"
              stroke={colors.accent}
              strokeWidth="0.3"
            />
          </g>
        )}
      </g>
    );
  }
  
  // Colonial debris
  const numDebris = 4 + Math.floor((1 - preservationLevel) * 5);
  for (let i = 0; i < numDebris; i++) {
    const debrisX = x + size * (0.1 + rng.random() * 0.8);
    const debrisY = y + size * (0.73 + rng.random() * 0.12);
    
    if (i % 3 === 0) {
      // Roof tile
      const tileSize = size * (0.015 + rng.random() * 0.01);
      elements.push(
        <rect
          key={`tile-${i}`}
          x={debrisX}
          y={debrisY}
          width={tileSize}
          height={tileSize * 0.6}
          fill={colors.tile || colors.slate || '#D2691E'}
          stroke="#8B4513"
          strokeWidth="0.1"
          transform={`rotate(${rng.random() * 360} ${debrisX + tileSize/2} ${debrisY})`}
          opacity={0.7}
        />
      );
    } else if (i % 3 === 1 && empire === 'Portuguese') {
      // Azulejo tile fragment
      const tileSize = size * (0.012 + rng.random() * 0.008);
      elements.push(
        <g key={`azulejo-${i}`}>
          <rect
            x={debrisX}
            y={debrisY}
            width={tileSize}
            height={tileSize}
            fill="white"
            stroke={colors.accent}
            strokeWidth="0.1"
          />
          <rect
            x={debrisX + tileSize * 0.25}
            y={debrisY + tileSize * 0.25}
            width={tileSize * 0.5}
            height={tileSize * 0.5}
            fill={colors.accent}
            opacity={0.7}
          />
        </g>
      );
    } else {
      // Stone/brick rubble
      const rubbleSize = size * (0.02 + rng.random() * 0.015);
      elements.push(
        <rect
          key={`rubble-${i}`}
          x={debrisX}
          y={debrisY}
          width={rubbleSize}
          height={rubbleSize * 0.6}
          fill={colors.stone || colors.brick || colors.stucco}
          stroke="#696969"
          strokeWidth="0.1"
          transform={`rotate(${rng.random() * 360} ${debrisX + rubbleSize/2} ${debrisY})`}
          opacity={0.6}
        />
      );
    }
  }
  
  // Tropical vegetation overtaking ruins
  if (preservationLevel < 0.7) {
    const numVines = 3 + Math.floor(rng.random() * 3);
    for (let i = 0; i < numVines; i++) {
      const vineX = x + size * (0.2 + rng.random() * 0.6);
      const vineY = y + size * (0.4 + rng.random() * 0.3);
      
      elements.push(
        <g key={`vine-${i}`} opacity={0.4}>
          <path
            d={`M ${vineX} ${vineY}
                Q ${vineX + size * 0.03} ${vineY + size * 0.05}
                  ${vineX - size * 0.02} ${vineY + size * 0.15}
                Q ${vineX + size * 0.04} ${vineY + size * 0.2}
                  ${vineX} ${vineY + size * 0.25}`}
            stroke="#228B22"
            strokeWidth="1"
            fill="none"
          />
          {/* Leaves */}
          {[0.3, 0.6, 0.9].map((offset) => (
            <ellipse
              key={offset}
              cx={vineX + (rng.random() - 0.5) * size * 0.03}
              cy={vineY + size * 0.25 * offset}
              rx={size * 0.008}
              ry={size * 0.005}
              fill="#228B22"
            />
          ))}
        </g>
      );
    }
  }
  
  return <g>{elements}</g>;
};

export default React.memo(ColonialRuinsSymbol);