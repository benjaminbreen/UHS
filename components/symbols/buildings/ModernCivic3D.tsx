/**
 * components/symbols/buildings/ModernCivic3D.tsx - Versatile 20th century building archetype
 * Adapts to different biomes: tract house (hamlet), row home (low density), apartment block (high density)
 */
import React from 'react';
import { Tile, BiomeType, HistoricalEra } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface ModernCivic3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile;
  roofColor?: string; hasTimberFrame?: boolean; era: HistoricalEra; nightIntensity?: number;
}

const ModernCivic3D: React.FC<ModernCivic3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile, roofColor = '#8b7355', nightIntensity = 0 
}) => {
  const rand = new ValueNoise(seed + tile.x * 127 + tile.y * 131).random;
  const uniqueId = `modern-civic-${tile.x}-${tile.y}`;
  
  // Adaptive building type based on tile biome
  const buildingType = tile.biome === BiomeType.HAMLET ? 'tract_house' :
                      tile.biome === BiomeType.LOW_DENSITY_CITY ? 'row_home' : 'apartment_block';
  
  // Base colors - mid-20th century palette
  const baseColors = [
    '#f5f5dc', // beige
    '#dcdcdc', // light gray  
    '#d2b48c', // tan
    '#cd853f', // peru
    '#bc9a6a'  // khaki
  ];
  const wallColor = baseColors[Math.floor(rand() * baseColors.length)];
  const trimColor = `hsl(0, 0%, ${20 + rand() * 20}%)`;
  const windowColor = nightIntensity > 0.5 ? `rgba(255, 220, 120, ${0.6 + rand() * 0.3})` : '#87ceeb';
  
  // Adaptive dimensions
  const stories = buildingType === 'tract_house' ? 1 + Math.floor(rand() * 2) : // 1-2 stories
                  buildingType === 'row_home' ? 2 + Math.floor(rand() * 2) : // 2-3 stories
                  3 + Math.floor(rand() * 3); // 3-5 stories for apartments
                  
  const buildingHeight = height * (0.7 + stories * 0.2);
  const buildingY = y + height - buildingHeight;
  const depth = size * 0.25;
  
  const storyHeight = buildingHeight / stories;
  const windowWidth = width * 0.12;
  const windowHeight = storyHeight * 0.5;
  
  return (
    <g filter="url(#symbolShadow)">
      <defs>
        <linearGradient id={`modernWallGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={wallColor} />
          <stop offset="100%" stopColor={trimColor} />
        </linearGradient>
      </defs>
      
      {/* Cast Shadow */}
      <ellipse cx={x + width/2 + depth*0.3} cy={y + height + 2} rx={width*0.6} ry={width*0.2} fill="rgba(0,0,0,0.2)" />

      {/* Main Building */}
      <rect 
        x={x} y={buildingY} width={width} height={buildingHeight} 
        fill={`url(#modernWallGradient-${uniqueId})`} 
        stroke={trimColor} strokeWidth="0.4"
      />
      
      {/* Side face for 3D effect */}
      <path 
        d={`M ${x + width} ${buildingY} L ${x + width + depth} ${buildingY - depth*0.3} L ${x + width + depth} ${y + height - depth*0.3} L ${x + width} ${y + height} Z`} 
        fill={trimColor} stroke={trimColor} strokeWidth="0.3"
      />
      
      {/* Top face */}
      <path 
        d={`M ${x} ${buildingY} L ${x + depth} ${buildingY - depth*0.3} L ${x + width + depth} ${buildingY - depth*0.3} L ${x + width} ${buildingY} Z`} 
        fill={roofColor} stroke={trimColor} strokeWidth="0.3"
      />

      {/* Windows - adaptive grid based on building type */}
      {Array.from({ length: stories }, (_, storyIndex) => (
        <g key={`story-${storyIndex}`}>
          {Array.from({ 
            length: buildingType === 'tract_house' ? 2 + Math.floor(rand() * 2) : 
                    buildingType === 'row_home' ? 3 : 4 
          }, (_, windowIndex) => {
            const windowX = x + windowWidth/2 + (windowIndex * (width - windowWidth) / (buildingType === 'tract_house' ? 2 : buildingType === 'row_home' ? 3 : 4));
            const windowY = buildingY + storyIndex * storyHeight + storyHeight/2 - windowHeight/2;
            
            return (
              <g key={`window-${storyIndex}-${windowIndex}`}>
                <rect 
                  x={windowX} y={windowY} 
                  width={windowWidth} height={windowHeight}
                  fill={windowColor} 
                  stroke={trimColor} strokeWidth="0.2"
                />
                {/* Window cross divider for period authenticity */}
                <line 
                  x1={windowX + windowWidth/2} y1={windowY} 
                  x2={windowX + windowWidth/2} y2={windowY + windowHeight} 
                  stroke={trimColor} strokeWidth="0.15"
                />
                <line 
                  x1={windowX} y1={windowY + windowHeight/2} 
                  x2={windowX + windowWidth} y2={windowY + windowHeight/2} 
                  stroke={trimColor} strokeWidth="0.15"
                />
              </g>
            );
          })}
        </g>
      ))}
      
      {/* Front door (ground level only) */}
      {buildingType !== 'apartment_block' && (
        <rect 
          x={x + width*0.1} y={y + height - storyHeight*0.8} 
          width={width*0.15} height={storyHeight*0.8}
          fill={trimColor} stroke="#654321" strokeWidth="0.3"
        />
      )}
      
      {/* Architectural details based on building type */}
      {buildingType === 'tract_house' && (
        // Simple front porch/overhang
        <path 
          d={`M ${x} ${y + height} L ${x + width*0.3} ${y + height} L ${x + width*0.3} ${y + height - storyHeight*0.2} L ${x} ${y + height - storyHeight*0.2} Z`}
          fill="none" stroke={trimColor} strokeWidth="0.5"
        />
      )}
      
      {buildingType === 'row_home' && (
        // Front steps
        <rect 
          x={x - 2} y={y + height - 3} 
          width={width*0.4} height={3}
          fill={trimColor} stroke="none"
        />
      )}
      
      {buildingType === 'apartment_block' && (
        // Building name/number plaque
        <rect 
          x={x + width*0.4} y={y + height - storyHeight*0.3} 
          width={width*0.2} height={storyHeight*0.15}
          fill="#ffffff" stroke={trimColor} strokeWidth="0.2"
        />
      )}
      
      {/* Night lighting effects */}
      {nightIntensity > 0.3 && (
        <g opacity={nightIntensity}>
          {/* Window glow */}
          <g filter="url(#glow)">
            {Array.from({ length: Math.floor(stories * (buildingType === 'tract_house' ? 2 : 3) * rand()) }, (_, i) => (
              <circle 
                key={`light-${i}`}
                cx={x + (i % 3 + 1) * (width/4)} 
                cy={buildingY + (Math.floor(i/3) + 0.5) * storyHeight}
                r={windowWidth*0.3} 
                fill={windowColor} 
                opacity="0.6"
              />
            ))}
          </g>
        </g>
      )}
    </g>
  );
});

export default ModernCivic3D;