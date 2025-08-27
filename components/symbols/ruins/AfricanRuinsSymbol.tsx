/**
 * components/symbols/ruins/AfricanRuinsSymbol.tsx
 * Renders African architectural ruins: Great Zimbabwe, Swahili coral cities, Ethiopian rock churches, Nubian pyramids
 * Historical accuracy: Based on diverse African architectural traditions from different regions and periods
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface AfricanRuinsSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  preservationLevel: number;
  region?: string; // East, West, South, North Africa
}

const AfricanRuinsSymbol: React.FC<AfricanRuinsSymbolProps> = ({ 
  x, y, size, seed, tile, preservationLevel, region = 'SOUTH'
}) => {
  const rng = new ValueNoise(seed + tile.x * 71 + tile.y * 73);
  const elements: JSX.Element[] = [];
  
  // Regional architectural styles
  const styles = {
    SOUTH: 'zimbabwe', // Great Zimbabwe stone enclosures
    EAST: rng.random() < 0.5 ? 'swahili' : 'ethiopian', // Swahili coral or Ethiopian rock-hewn
    WEST: rng.random() < 0.5 ? 'sudanic' : 'yoruba', // Mud architecture or Yoruba compounds
    NORTH: 'nubian' // Nubian pyramids and temples
  };
  
  const architectureStyle = styles[region] || 'zimbabwe';
  
  // Material colors by style
  const colorSchemes = {
    zimbabwe: {
      stone: '#8B7355', // Granite brown
      mortar: '#6B5D54', // Dark brown
      accent: '#5C4033', // Dark sienna
      earth: '#A0826D' // Tan
    },
    swahili: {
      stone: '#F5DEB3', // Coral/limestone
      mortar: '#DEB887', // Burlywood
      accent: '#FFE4B5', // Moccasin
      earth: '#F4A460' // Sandy
    },
    ethiopian: {
      stone: '#8B4513', // Volcanic rock
      mortar: '#A0522D', // Sienna
      accent: '#6B4423', // Dark brown
      earth: '#CD853F' // Peru
    },
    sudanic: {
      stone: '#D2691E', // Mud brick
      mortar: '#A0826D', // Adobe
      accent: '#8B7355', // Brown
      earth: '#DEB887' // Tan
    },
    yoruba: {
      stone: '#BC8F8F', // Rosy brown (laterite)
      mortar: '#A0826D', // Tan
      accent: '#8B7355', // Brown
      earth: '#CD853F' // Peru
    },
    nubian: {
      stone: '#DEB887', // Sandstone
      mortar: '#D2691E', // Chocolate
      accent: '#CD853F', // Peru
      earth: '#F4A460' // Sandy brown
    }
  };
  
  const colors = colorSchemes[architectureStyle] || colorSchemes.zimbabwe;
  
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
  
  if (architectureStyle === 'zimbabwe') {
    // Great Zimbabwe style - curved stone walls without mortar
    
    // Great Enclosure elliptical wall
    const enclosureX = x + size * 0.5;
    const enclosureY = y + size * 0.6;
    const enclosureRX = size * 0.35;
    const enclosureRY = size * 0.25;
    
    // Outer wall (may be partially collapsed)
    const wallSegments = preservationLevel > 0.5 ? 12 : 8;
    for (let i = 0; i < wallSegments; i++) {
      const angle = (i / wallSegments) * Math.PI * 2;
      const nextAngle = ((i + 1) / wallSegments) * Math.PI * 2;
      
      const isCollapsed = rng.random() > preservationLevel + 0.3;
      
      if (!isCollapsed) {
        const x1 = enclosureX + Math.cos(angle) * enclosureRX;
        const y1 = enclosureY + Math.sin(angle) * enclosureRY;
        const x2 = enclosureX + Math.cos(nextAngle) * enclosureRX;
        const y2 = enclosureY + Math.sin(nextAngle) * enclosureRY;
        
        // Wall segment with height variation
        const wallHeight = size * (0.08 + preservationLevel * 0.05 + rng.random() * 0.03);
        
        elements.push(
          <g key={`wall-segment-${i}`}>
            <path
              d={`M ${x1} ${y1 + size * 0.1}
                  L ${x1} ${y1 + size * 0.1 - wallHeight}
                  L ${x2} ${y2 + size * 0.1 - wallHeight}
                  L ${x2} ${y2 + size * 0.1}
                  Z`}
              fill={colors.stone}
              stroke={colors.mortar}
              strokeWidth="0.4"
            />
            
            {/* Chevron pattern decoration (Zimbabwe's signature) */}
            {preservationLevel > 0.6 && i % 3 === 0 && (
              <>
                {[0.3, 0.5, 0.7].map((offset, idx) => (
                  <path
                    key={`chevron-${idx}`}
                    d={`M ${x1 + (x2 - x1) * offset} ${y1 + size * 0.08}
                        L ${x1 + (x2 - x1) * (offset + 0.1)} ${y1 + size * 0.07}
                        L ${x1 + (x2 - x1) * (offset + 0.2)} ${y1 + size * 0.08}`}
                    stroke={colors.accent}
                    strokeWidth="0.3"
                    fill="none"
                  />
                ))}
              </>
            )}
          </g>
        );
      } else {
        // Rubble from collapsed section
        const rubbleX = enclosureX + Math.cos(angle) * enclosureRX;
        const rubbleY = enclosureY + Math.sin(angle) * enclosureRY + size * 0.1;
        
        elements.push(
          <ellipse
            key={`rubble-${i}`}
            cx={rubbleX}
            cy={rubbleY}
            rx={size * 0.03}
            ry={size * 0.015}
            fill={colors.stone}
            opacity={0.6}
          />
        );
      }
    }
    
    // Conical tower (if preserved)
    if (preservationLevel > 0.5) {
      const towerX = enclosureX - enclosureRX * 0.5;
      const towerY = enclosureY;
      const towerHeight = size * (0.15 + preservationLevel * 0.05);
      const towerRadius = size * 0.04;
      
      elements.push(
        <g key="conical-tower">
          <path
            d={`M ${towerX - towerRadius} ${towerY + size * 0.1}
                L ${towerX} ${towerY + size * 0.1 - towerHeight}
                L ${towerX + towerRadius} ${towerY + size * 0.1}
                Q ${towerX} ${towerY + size * 0.12} ${towerX - towerRadius} ${towerY + size * 0.1}`}
            fill={colors.stone}
            stroke={colors.mortar}
            strokeWidth="0.4"
          />
          
          {/* Stone coursing lines */}
          {[0.3, 0.5, 0.7].map((offset, idx) => (
            <line
              key={`course-${idx}`}
              x1={towerX - towerRadius * (1 - offset)}
              y1={towerY + size * 0.1 - towerHeight * offset}
              x2={towerX + towerRadius * (1 - offset)}
              y2={towerY + size * 0.1 - towerHeight * offset}
              stroke={colors.mortar}
              strokeWidth="0.2"
              opacity={0.5}
            />
          ))}
        </g>
      );
    }
    
  } else if (architectureStyle === 'swahili') {
    // Swahili coral stone architecture - mosques and houses with carved doors
    
    const buildingX = x + size * 0.3;
    const buildingY = y + size * 0.55;
    const buildingWidth = size * 0.4;
    const buildingHeight = size * 0.25;
    
    // Main structure
    elements.push(
      <rect
        key="main-building"
        x={buildingX}
        y={buildingY}
        width={buildingWidth}
        height={buildingHeight}
        fill={colors.stone}
        stroke={colors.mortar}
        strokeWidth="0.5"
      />
    );
    
    // Mihrab niche (prayer niche)
    if (preservationLevel > 0.4) {
      const mihrabX = buildingX + buildingWidth * 0.5;
      const mihrabY = buildingY + buildingHeight * 0.3;
      
      elements.push(
        <g key="mihrab">
          <path
            d={`M ${mihrabX - size * 0.03} ${mihrabY + size * 0.08}
                L ${mihrabX - size * 0.03} ${mihrabY}
                Q ${mihrabX} ${mihrabY - size * 0.02} ${mihrabX + size * 0.03} ${mihrabY}
                L ${mihrabX + size * 0.03} ${mihrabY + size * 0.08}`}
            fill="rgba(0,0,0,0.4)"
            stroke={colors.accent}
            strokeWidth="0.3"
          />
          
          {/* Decorative arch frame */}
          <path
            d={`M ${mihrabX - size * 0.035} ${mihrabY + size * 0.08}
                Q ${mihrabX} ${mihrabY - size * 0.03} ${mihrabX + size * 0.035} ${mihrabY + size * 0.08}`}
            fill="none"
            stroke={colors.accent}
            strokeWidth="0.4"
          />
        </g>
      );
    }
    
    // Carved doorway (Swahili signature)
    if (preservationLevel > 0.3) {
      const doorX = buildingX + buildingWidth * 0.2;
      const doorY = buildingY + buildingHeight * 0.5;
      const doorWidth = size * 0.06;
      const doorHeight = size * 0.12;
      
      elements.push(
        <g key="carved-door">
          <rect
            x={doorX}
            y={doorY}
            width={doorWidth}
            height={doorHeight}
            fill="rgba(0,0,0,0.5)"
            stroke={colors.accent}
            strokeWidth="0.4"
          />
          
          {/* Carved details */}
          {preservationLevel > 0.5 && (
            <>
              {/* Geometric patterns */}
              {[0.2, 0.5, 0.8].map((yOff) => 
                [0.25, 0.75].map((xOff) => (
                  <circle
                    key={`detail-${xOff}-${yOff}`}
                    cx={doorX + doorWidth * xOff}
                    cy={doorY + doorHeight * yOff}
                    r={size * 0.003}
                    fill={colors.accent}
                    opacity={0.6}
                  />
                ))
              )}
            </>
          )}
        </g>
      );
    }
    
    // Coral stone texture
    const numTextures = 5 + Math.floor(rng.random() * 5);
    for (let i = 0; i < numTextures; i++) {
      const texX = buildingX + rng.random() * buildingWidth;
      const texY = buildingY + rng.random() * buildingHeight;
      
      elements.push(
        <circle
          key={`coral-texture-${i}`}
          cx={texX}
          cy={texY}
          r={size * 0.003}
          fill={colors.mortar}
          opacity={0.3}
        />
      );
    }
    
  } else if (architectureStyle === 'ethiopian') {
    // Ethiopian rock-hewn church (like Lalibela)
    
    const churchX = x + size * 0.35;
    const churchY = y + size * 0.55;
    const churchSize = size * 0.3;
    
    // Sunken courtyard
    elements.push(
      <rect
        key="courtyard"
        x={churchX - size * 0.05}
        y={churchY - size * 0.05}
        width={churchSize + size * 0.1}
        height={churchSize + size * 0.1}
        fill="rgba(0,0,0,0.2)"
        stroke={colors.earth}
        strokeWidth="0.5"
      />
    );
    
    // Greek cross plan
    const crossCenter = { x: churchX + churchSize/2, y: churchY + churchSize/2 };
    const armLength = churchSize * 0.35;
    const armWidth = churchSize * 0.2;
    
    // Cross arms
    ['north', 'south', 'east', 'west'].forEach((dir, idx) => {
      let armX, armY, width, height;
      
      if (dir === 'north' || dir === 'south') {
        armX = crossCenter.x - armWidth/2;
        armY = dir === 'north' ? 
          crossCenter.y - armLength : 
          crossCenter.y;
        width = armWidth;
        height = armLength;
      } else {
        armX = dir === 'west' ? 
          crossCenter.x - armLength : 
          crossCenter.x;
        armY = crossCenter.y - armWidth/2;
        width = armLength;
        height = armWidth;
      }
      
      const isCollapsed = rng.random() > preservationLevel + 0.3;
      
      if (!isCollapsed) {
        elements.push(
          <rect
            key={`cross-arm-${dir}`}
            x={armX}
            y={armY}
            width={width}
            height={height}
            fill={colors.stone}
            stroke={colors.mortar}
            strokeWidth="0.4"
          />
        );
      }
    });
    
    // Windows (Ethiopian cross shape)
    if (preservationLevel > 0.4) {
      const windowX = crossCenter.x;
      const windowY = crossCenter.y - armLength * 0.5;
      const winSize = size * 0.03;
      
      elements.push(
        <g key="cross-window">
          <line x1={windowX - winSize/2} y1={windowY} x2={windowX + winSize/2} y2={windowY} 
            stroke="rgba(0,0,0,0.6)" strokeWidth="0.8" />
          <line x1={windowX} y1={windowY - winSize/2} x2={windowX} y2={windowY + winSize/2} 
            stroke="rgba(0,0,0,0.6)" strokeWidth="0.8" />
        </g>
      );
    }
    
  } else if (architectureStyle === 'sudanic') {
    // Sudano-Sahelian mud architecture (like Djenne, Timbuktu)
    
    const mosqueX = x + size * 0.3;
    const mosqueY = y + size * 0.5;
    const mosqueWidth = size * 0.4;
    const mosqueHeight = size * 0.3;
    
    // Main structure with buttresses
    elements.push(
      <g key="mud-mosque">
        {/* Base */}
        <rect
          x={mosqueX}
          y={mosqueY}
          width={mosqueWidth}
          height={mosqueHeight}
          fill={colors.stone}
          stroke={colors.mortar}
          strokeWidth="0.5"
        />
        
        {/* Characteristic buttresses */}
        {[0.2, 0.5, 0.8].map((offset, idx) => {
          const buttX = mosqueX + mosqueWidth * offset;
          const buttHeight = mosqueHeight * (0.4 + preservationLevel * 0.3);
          
          return (
            <g key={`buttress-${idx}`}>
              <polygon
                points={`${buttX - size * 0.02},${mosqueY + mosqueHeight}
                         ${buttX - size * 0.01},${mosqueY + mosqueHeight - buttHeight}
                         ${buttX + size * 0.01},${mosqueY + mosqueHeight - buttHeight}
                         ${buttX + size * 0.02},${mosqueY + mosqueHeight}`}
                fill={colors.stone}
                stroke={colors.mortar}
                strokeWidth="0.3"
              />
              
              {/* Toron (wooden support beams) sticking out */}
              {preservationLevel > 0.5 && (
                <>
                  {[0.3, 0.6].map((h) => (
                    <line
                      key={`toron-${h}`}
                      x1={buttX}
                      y1={mosqueY + mosqueHeight - buttHeight * h}
                      x2={buttX + size * 0.03}
                      y2={mosqueY + mosqueHeight - buttHeight * h - size * 0.01}
                      stroke="#8B4513"
                      strokeWidth="0.5"
                    />
                  ))}
                </>
              )}
            </g>
          );
        })}
        
        {/* Pinnacles with ostrich eggs (traditional) */}
        {preservationLevel > 0.6 && (
          <>
            {[0.2, 0.5, 0.8].map((offset, idx) => (
              <circle
                key={`pinnacle-${idx}`}
                cx={mosqueX + mosqueWidth * offset}
                cy={mosqueY - size * 0.02}
                r={size * 0.008}
                fill="white"
                stroke={colors.accent}
                strokeWidth="0.2"
                opacity={0.8}
              />
            ))}
          </>
        )}
      </g>
    );
    
  } else if (architectureStyle === 'nubian') {
    // Nubian pyramid (steeper and smaller than Egyptian)
    
    const pyramidX = x + size * 0.35;
    const pyramidY = y + size * 0.45;
    const baseWidth = size * 0.3;
    const pyramidHeight = size * (0.35 + preservationLevel * 0.1);
    
    // Steep pyramid
    elements.push(
      <g key="nubian-pyramid">
        <polygon
          points={`${pyramidX},${pyramidY + pyramidHeight}
                   ${pyramidX + baseWidth/2},${pyramidY}
                   ${pyramidX + baseWidth},${pyramidY + pyramidHeight}`}
          fill={colors.stone}
          stroke={colors.mortar}
          strokeWidth="0.5"
        />
        
        {/* Pyramid chapel at east side */}
        {preservationLevel > 0.4 && (
          <rect
            x={pyramidX + baseWidth}
            y={pyramidY + pyramidHeight * 0.7}
            width={size * 0.06}
            height={size * 0.08}
            fill={colors.stone}
            stroke={colors.mortar}
            strokeWidth="0.3"
          />
        )}
        
        {/* Entrance */}
        <rect
          x={pyramidX + baseWidth * 0.45}
          y={pyramidY + pyramidHeight * 0.8}
          width={baseWidth * 0.1}
          height={pyramidHeight * 0.2}
          fill="rgba(0,0,0,0.6)"
        />
      </g>
    );
  }
  
  // Common rubble and stones
  const numRubble = 4 + Math.floor((1 - preservationLevel) * 5);
  for (let i = 0; i < numRubble; i++) {
    const rubbleX = x + size * (0.1 + rng.random() * 0.8);
    const rubbleY = y + size * (0.72 + rng.random() * 0.13);
    const rubbleSize = size * (0.015 + rng.random() * 0.025);
    
    elements.push(
      <rect
        key={`rubble-${i}`}
        x={rubbleX}
        y={rubbleY}
        width={rubbleSize}
        height={rubbleSize * (0.6 + rng.random() * 0.4)}
        fill={i % 2 === 0 ? colors.stone : colors.mortar}
        stroke={colors.accent}
        strokeWidth="0.1"
        transform={`rotate(${rng.random() * 360} ${rubbleX + rubbleSize/2} ${rubbleY})`}
        opacity={0.6 + rng.random() * 0.4}
      />
    );
  }
  
  // Vegetation (region-appropriate)
  if (preservationLevel < 0.7) {
    const vegetationType = region === 'EAST' ? 'baobab' : 'acacia';
    
    if (vegetationType === 'baobab') {
      // Baobab roots growing through ruins
      const rootX = x + size * (0.6 + rng.random() * 0.3);
      const rootY = y + size * 0.5;
      
      elements.push(
        <g key="baobab" opacity={0.4}>
          <rect
            x={rootX}
            y={rootY}
            width={size * 0.03}
            height={size * 0.3}
            fill="#8B7355"
          />
          <ellipse
            cx={rootX + size * 0.015}
            cy={rootY}
            rx={size * 0.04}
            ry={size * 0.02}
            fill="#556B2F"
          />
        </g>
      );
    } else {
      // Acacia thorns
      const thornX = x + size * (0.2 + rng.random() * 0.6);
      const thornY = y + size * (0.6 + rng.random() * 0.2);
      
      elements.push(
        <g key="acacia" opacity={0.3}>
          {[0, 30, -30].map((angle, idx) => (
            <line
              key={`thorn-${idx}`}
              x1={thornX}
              y1={thornY}
              x2={thornX + Math.cos(angle * Math.PI / 180) * size * 0.04}
              y2={thornY + Math.sin(angle * Math.PI / 180) * size * 0.04}
              stroke="#8B7355"
              strokeWidth="0.5"
            />
          ))}
        </g>
      );
    }
  }
  
  return <g>{elements}</g>;
};

export default React.memo(AfricanRuinsSymbol);