/**
 * components/FarmBanner.tsx - A sophisticated, painterly banner for farm interactions.
 */
import React from 'react';
import { HistoricalEra, CulturalZone, ClimateType as Climate, Season } from '../types';
import { lightenColor, addBlueishShadow } from '../utils/colorUtils';

export type Condition = 'humble' | 'prosperous';
export type CropType = string;

interface FarmBannerProps {
  era: HistoricalEra;
  culturalZone: CulturalZone;
  condition: Condition;
  cropType: CropType;
  climate: Climate;
  season: Season;
  seed?: number;
  width?: number;
  height?: number;
}

const ParticleEffects: React.FC<{ season: Season, climate: Climate, width: number, height: number, seed: number }> = ({ season, climate, width, height, seed }) => {
    const particles = [];
    const particleCount = 20;

    if (season === 'winter' && (climate === 'COLD' || climate === 'TEMPERATE')) {
        for (let i = 0; i < particleCount; i++) {
            const style = {
                left: `${Math.random() * 100}%`,
                animationDuration: `${2 + Math.random() * 3}s`,
                animationDelay: `${Math.random() * 5}s`,
            };
            particles.push(<div key={`snow-${i}`} className="absolute w-1 h-1 bg-white rounded-full animate-snow" style={style}></div>);
        }
    } else if (season === 'fall') {
        const leafColors = ['#d97706', '#b45309', '#facc15'];
         for (let i = 0; i < particleCount / 2; i++) {
            const style = {
                left: `${Math.random() * 100}%`,
                animationDuration: `${3 + Math.random() * 4}s`,
                animationDelay: `${Math.random() * 5}s`,
                backgroundColor: leafColors[i % leafColors.length],
            };
            particles.push(<div key={`leaf-${i}`} className="absolute w-2 h-2 rounded-sm animate-fall-leaves" style={style}></div>);
        }
    } else if (season === 'spring' && Math.random() < 0.3) { // Light rain in spring
        for (let i = 0; i < particleCount; i++) {
            const style = {
                left: `${Math.random() * 100}%`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
                animationDelay: `${Math.random() * 2}s`,
            };
            particles.push(<div key={`rain-${i}`} className="absolute w-px h-4 bg-blue-300/70 animate-rain" style={style}></div>);
        }
    }

    return <div className="absolute inset-0 pointer-events-none">{particles}</div>;
}

const FarmBanner: React.FC<FarmBannerProps> = ({ 
  era, 
  culturalZone, 
  condition,
  cropType,
  climate,
  season,
  seed, 
  width = 600, 
  height = 150 
}) => {
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000) + Date.now() % 1000000;
  
  const seededRandom = (s: number) => {
    let x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const isProsperous = condition === 'prosperous';

  // Enhanced block renderer with painterly shading
  const renderBlock = (x: number, y: number, blockWidth: number, blockHeight: number, color: string, key: string, addShading: boolean = true) => {
    const elements = [];
    
    // Main block
    elements.push(
      <rect 
        key={key} 
        x={x} 
        y={y} 
        width={blockWidth} 
        height={blockHeight} 
        fill={color} 
        style={{ shapeRendering: 'crispEdges' }}
      />
    );
    
    if (addShading && blockWidth > 4 && blockHeight > 4) {
      // Top highlight
      elements.push(
        <rect 
          key={`${key}-highlight-top`} 
          x={x} 
          y={y} 
          width={blockWidth} 
          height={Math.max(1, Math.floor(blockHeight * 0.15))} 
          fill={lightenColor(color, 0.25)} 
          style={{ shapeRendering: 'crispEdges' }}
        />
      );
      
      // Left highlight
      elements.push(
        <rect 
          key={`${key}-highlight-left`} 
          x={x} 
          y={y} 
          width={Math.max(1, Math.floor(blockWidth * 0.1))} 
          height={blockHeight} 
          fill={lightenColor(color, 0.15)} 
          style={{ shapeRendering: 'crispEdges' }}
        />
      );
      
      // Bottom shadow
      elements.push(
        <rect 
          key={`${key}-shadow-bottom`} 
          x={x} 
          y={y + blockHeight - Math.max(1, Math.floor(blockHeight * 0.15))} 
          width={blockWidth} 
          height={Math.max(1, Math.floor(blockHeight * 0.15))} 
          fill={addBlueishShadow(color, 0.25)} 
          style={{ shapeRendering: 'crispEdges' }}
        />
      );
      
      // Right shadow
      elements.push(
        <rect 
          key={`${key}-shadow-right`} 
          x={x + blockWidth - Math.max(1, Math.floor(blockWidth * 0.1))} 
          y={y} 
          width={Math.max(1, Math.floor(blockWidth * 0.1))} 
          height={blockHeight} 
          fill={addBlueishShadow(color, 0.15)} 
          style={{ shapeRendering: 'crispEdges' }}
        />
      );
    }
    
    return elements;
  };

  // Comprehensive theme system
  const getTheme = () => {
    const culturalBase = {
      'EUROPEAN': {
        buildingMain: '#D2691E',
        buildingDark: '#A0522D',
        roof: '#8B0000',
        roofDark: '#654321'
      },
      'EAST_ASIAN': {
        buildingMain: '#CD853F',
        buildingDark: '#A0522D',
        roof: '#DC143C',
        roofDark: '#8B0000'
      },
      'MENA': {
        buildingMain: '#F5DEB3',
        buildingDark: '#DEB887',
        roof: '#8B4513',
        roofDark: '#654321'
      },
      'SUB_SAHARAN_AFRICAN': {
        buildingMain: '#D2691E',
        buildingDark: '#A0522D',
        roof: '#8B4513',
        roofDark: '#654321'
      },
      'SOUTH_ASIAN': {
        buildingMain: '#CD853F',
        buildingDark: '#A0522D',
        roof: '#FF4500',
        roofDark: '#DC143C'
      },
      'SOUTH_AMERICAN': {
        buildingMain: '#D2691E',
        buildingDark: '#A0522D',
        roof: '#DC143C',
        roofDark: '#8B0000'
      },
      'NORTH_AMERICAN_PRE_COLUMBIAN': {
        buildingMain: '#D2691E',
        buildingDark: '#A0522D',
        roof: '#8B4513',
        roofDark: '#654321'
      },
      'OCEANIA': {
        buildingMain: '#CD853F',
        buildingDark: '#A0522D',
        roof: '#228B22',
        roofDark: '#006400'
      }
    };

    const climateBase = {
      'ARID': {
        terrain: '#D2B48C',
        terrainDark: '#CD853F',
        vegetation: '#8B7355',
        mountains: ['#CD853F', '#DEB887', '#F4A460']
      },
      'COLD': {
        terrain: '#F0F8FF',
        terrainDark: '#E6E6FA',
        vegetation: '#2F4F4F',
        mountains: ['#708090', '#778899', '#B0C4DE']
      },
      'TEMPERATE': {
        terrain: '#228B22',
        terrainDark: '#006400',
        vegetation: '#32CD32',
        mountains: ['#696969', '#778899', '#708090']
      },
      'TROPICAL': {
        terrain: '#228B22',
        terrainDark: '#006400',
        vegetation: '#00FF00',
        mountains: ['#2F4F4F', '#228B22', '#32CD32']
      },
      'SEMITROPICAL': {
        terrain: '#32CD32',
        terrainDark: '#228B22',
        vegetation: '#00FF7F',
        mountains: ['#228B22', '#32CD32', '#90EE90']
      }
    };

    const seasonalEffects = {
      'spring': {
        skyTop: '#87CEEB',
        skyBottom: '#E0F6FF',
        weatherEffect: 'light_rain',
        foliageMultiplier: 1.0
      },
      'summer': {
        skyTop: '#4169E1',
        skyBottom: '#87CEEB',
        weatherEffect: 'clear',
        foliageMultiplier: 1.2
      },
      'fall': {
        skyTop: '#B8860B',
        skyBottom: '#FFE4B5',
        weatherEffect: 'wind',
        foliageMultiplier: 0.8
      },
      'winter': {
        skyTop: '#708090',
        skyBottom: '#F0F8FF',
        weatherEffect: climate === 'COLD' ? 'snow' : 'overcast',
        foliageMultiplier: 0.4
      }
    };

    const cBase = culturalBase[culturalZone as keyof typeof culturalBase] || culturalBase['EUROPEAN'];
    const clBase = climateBase[climate] || climateBase['TEMPERATE'];
    const sBase = seasonalEffects[season] || seasonalEffects['summer'];
    
    return { ...cBase, ...clBase, ...sBase };
  };

  const theme = getTheme();

  // Regional topology system
  const getRegionalTopology = () => {
    switch (culturalZone) {
      case 'EUROPEAN': return 'rolling_hills';
      case 'EAST_ASIAN': return 'mountain_peaks';
      case 'MENA': return 'desert_mesas';
      case 'SUB_SAHARAN_AFRICAN': return 'savanna_plains';
      case 'SOUTH_ASIAN': return 'river_valley';
      case 'SOUTH_AMERICAN': return 'mountain_range';
      case 'NORTH_AMERICAN_PRE_COLUMBIAN': return 'great_plains';
      case 'OCEANIA': return 'coastal_hills';
      default: return 'rolling_hills';
    }
  };

  // Enhanced climate background with regional topology
  const renderClimateBackground = () => {
    const elements = [];
    const topology = getRegionalTopology();
    
    
    // Enhanced mountain/background rendering based on topology
    if (topology === 'mountain_range' || topology === 'mountain_peaks') {
      const numPeaks = 6;
      for (let i = 0; i < numPeaks; i++) {
        const peakX = (width / numPeaks) * i;
        const peakWidth = width / numPeaks + 15;
        const peakHeight = 35 + seededRandom(actualSeed + i) * 25;
        const mountainColor = theme.mountains[i % theme.mountains.length];
        
        const points = `${peakX},${height * 0.6} ${peakX + peakWidth/2},${height * 0.6 - peakHeight} ${peakX + peakWidth},${height * 0.6}`;
        elements.push(
          <polygon 
            key={`mountain-${i}`} 
            points={points} 
            fill={mountainColor} 
            style={{ shapeRendering: 'crispEdges' }} 
          />
        );
        
        // Mountain highlights
        const highlightPoints = `${peakX},${height * 0.6} ${peakX + peakWidth/2},${height * 0.6 - peakHeight} ${peakX + peakWidth/3},${height * 0.6}`;
        elements.push(
          <polygon 
            key={`mountain-highlight-${i}`} 
            points={highlightPoints} 
            fill={lightenColor(mountainColor, 0.2)} 
            style={{ shapeRendering: 'crispEdges' }} 
          />
        );
      }
    } else if (topology === 'rolling_hills') {
      for (let i = 0; i < 4; i++) {
        const hillX = i * (width / 3);
        const hillWidth = width / 3 + 20;
        const hillHeight = 20 + seededRandom(actualSeed + i + 10) * 15;
        const hillColor = theme.mountains[i % theme.mountains.length];
        
        const points = `${hillX},${height * 0.6} ${hillX + hillWidth/3},${height * 0.6 - hillHeight/2} ${hillX + 2*hillWidth/3},${height * 0.6 - hillHeight} ${hillX + hillWidth},${height * 0.6 - hillHeight/3} ${hillX + hillWidth + 15},${height * 0.6}`;
        elements.push(
          <polygon 
            key={`hill-${i}`} 
            points={points} 
            fill={hillColor} 
            style={{ shapeRendering: 'crispEdges' }} 
          />
        );
      }
    } else if (topology === 'great_plains') {
      elements.push(
        <rect 
          key="horizon" 
          x="0" 
          y={height * 0.58} 
          width={width} 
          height={height * 0.02} 
          fill={theme.mountains[0]} 
          style={{ shapeRendering: 'crispEdges' }}
        />
      );
    } else if (topology === 'desert_mesas') {
      for (let i = 0; i < 3; i++) {
        const mesaX = 40 + i * 180;
        const mesaWidth = 60 + seededRandom(actualSeed + i + 20) * 30;
        const mesaHeight = 25 + seededRandom(actualSeed + i + 30) * 20;
        const mesaColor = theme.mountains[i % theme.mountains.length];
        
        elements.push(...renderBlock(mesaX, height * 0.6 - mesaHeight, mesaWidth, mesaHeight, mesaColor, `mesa-${i}`));
      }
    }
    
    // Climate-specific vegetation
    if (climate === 'TROPICAL' || climate === 'SEMITROPICAL') {
      for (let i = 0; i < 6; i++) {
        const treeX = i * 95 + seededRandom(actualSeed + i + 40) * 25;
        const treeHeight = 20 + seededRandom(actualSeed + i + 50) * 10;
        const jungleGreen = lightenColor(theme.vegetation, -0.2);
        
        elements.push(...renderBlock(treeX, height * 0.6 - treeHeight, 3, treeHeight, '#8B4513', `jungle-trunk-${i}`, false));
        elements.push(...renderBlock(treeX - 5, height * 0.6 - treeHeight - 6, 13, 9, jungleGreen, `jungle-canopy-${i}`, false));
      }
    } else if (climate === 'ARID') {
      for (let i = 0; i < 3; i++) {
        const cactusX = 80 + i * 150 + seededRandom(actualSeed + i + 60) * 40;
        const cactusHeight = 8 + seededRandom(actualSeed + i + 70) * 6;
        
        elements.push(...renderBlock(cactusX, height * 0.6 - cactusHeight, 2, cactusHeight, theme.vegetation, `cactus-${i}`, false));
      }
    } else if (climate === 'COLD') {
      for (let i = 0; i < 5; i++) {
        const treeX = i * 110 + seededRandom(actualSeed + i + 80) * 30;
        const treeHeight = 15 + seededRandom(actualSeed + i + 90) * 8;
        
        elements.push(...renderBlock(treeX, height * 0.6 - 4, 2, 6, '#654321', `pine-trunk-${i}`, false));
        
        for (let layer = 0; layer < 3; layer++) {
          const layerWidth = 10 - layer * 2;
          const layerY = height * 0.6 - 6 - layer * 4;
          elements.push(...renderBlock(treeX - layerWidth/2, layerY, layerWidth, 4, theme.vegetation, `pine-layer-${i}-${layer}`, false));
        }
      }
    }
    
    // Terrain base
    let terrainColor = theme.terrain;
    if (climate === 'COLD' && season === 'winter') {
      terrainColor = '#F0F8FF';
    }
    
    elements.push(...renderBlock(0, height * 0.6, width, height * 0.4, terrainColor, 'terrain-base', false));
    elements.push(
      <rect 
        key="terrain-shadow" 
        x="0" 
        y={height * 0.6} 
        width={width} 
        height="2" 
        fill={theme.terrainDark} 
        style={{ shapeRendering: 'crispEdges' }}
      />
    );
    
    return elements;
  };

  // Enhanced building renderer with era-specific details
  const renderPainterlyBuilding = () => {
    const elements = [];
    const buildingX = 60;
    const buildingY = height * 0.45;
    const buildingWidth = isProsperous ? 80 : 60;
    const buildingHeight = isProsperous ? 60 : 45;
    
    // Cast shadow first
    elements.push(
      <rect 
        key="building-cast-shadow" 
        x={buildingX + buildingWidth} 
        y={buildingY} 
        width="6" 
        height={buildingHeight} 
        fill={addBlueishShadow(theme.buildingMain, 0.6)} 
        style={{ shapeRendering: 'crispEdges' }}
      />
    );
    elements.push(
      <rect 
        key="building-ground-shadow" 
        x={buildingX} 
        y={buildingY + buildingHeight} 
        width={buildingWidth + 6} 
        height="6" 
        fill={addBlueishShadow(theme.terrain, 0.4)} 
        style={{ shapeRendering: 'crispEdges' }}
      />
    );

    if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN') {
      // Main building with enhanced details
      elements.push(...renderBlock(buildingX, buildingY, buildingWidth, buildingHeight, theme.buildingMain, 'main-building'));
      
      // Roof
      const roofHeight = 30;
      const roofPoints = `${buildingX - 6},${buildingY} ${buildingX + buildingWidth/2},${buildingY - roofHeight} ${buildingX + buildingWidth + 6},${buildingY}`;
      elements.push(
        <polygon 
          key="roof" 
          points={roofPoints} 
          fill={theme.roof} 
          style={{ shapeRendering: 'crispEdges' }} 
        />
      );
      
      // Roof highlight
      const roofHighlightPoints = `${buildingX - 6},${buildingY} ${buildingX + buildingWidth/2},${buildingY - roofHeight} ${buildingX + buildingWidth/4},${buildingY - 8}`;
      elements.push(
        <polygon 
          key="roof-highlight" 
          points={roofHighlightPoints} 
          fill={lightenColor(theme.roof, 0.3)} 
          style={{ shapeRendering: 'crispEdges' }} 
        />
      );
      
      // Roof shadow
      const roofShadowPoints = `${buildingX + buildingWidth/2},${buildingY - roofHeight} ${buildingX + buildingWidth + 6},${buildingY} ${buildingX + buildingWidth + 10},${buildingY + 4}`;
      elements.push(
        <polygon 
          key="roof-shadow" 
          points={roofShadowPoints} 
          fill={addBlueishShadow(theme.roof, 0.4)} 
          style={{ shapeRendering: 'crispEdges' }} 
        />
      );
      
      // Windows
      elements.push(...renderBlock(buildingX + 12, buildingY + 12, 10, 10, '#1a1a2e', 'window-1'));
      elements.push(...renderBlock(buildingX + buildingWidth - 22, buildingY + 12, 10, 10, '#1a1a2e', 'window-2'));
      
      // Window glass highlights
      elements.push(
        <rect 
          key="window-1-highlight" 
          x={buildingX + 12} 
          y={buildingY + 12} 
          width="3" 
          height="3" 
          fill="#4a4a6e" 
          style={{ shapeRendering: 'crispEdges' }}
        />
      );
      elements.push(
        <rect 
          key="window-2-highlight" 
          x={buildingX + buildingWidth - 22} 
          y={buildingY + 12} 
          width="3" 
          height="3" 
          fill="#4a4a6e" 
          style={{ shapeRendering: 'crispEdges' }}
        />
      );
      
      // Door with frame
      elements.push(...renderBlock(buildingX + buildingWidth/2 - 10, buildingY + buildingHeight - 22, 20, 22, lightenColor(theme.buildingMain, 0.2), 'door-frame'));
      elements.push(...renderBlock(buildingX + buildingWidth/2 - 8, buildingY + buildingHeight - 20, 16, 20, '#654321', 'door'));
      
      // Door handle
      elements.push(
        <rect 
          key="door-handle" 
          x={buildingX + buildingWidth/2 + 4} 
          y={buildingY + buildingHeight - 10} 
          width="2" 
          height="2" 
          fill="#DAA520" 
          style={{ shapeRendering: 'crispEdges' }}
        />
      );
      
      // Timber framing
      elements.push(...renderBlock(buildingX, buildingY + 15, buildingWidth, 2, addBlueishShadow(theme.buildingMain, 0.3), 'timber-h1'));
      elements.push(...renderBlock(buildingX, buildingY + 35, buildingWidth, 2, addBlueishShadow(theme.buildingMain, 0.3), 'timber-h2'));
      elements.push(...renderBlock(buildingX + 20, buildingY, 2, buildingHeight, addBlueishShadow(theme.buildingMain, 0.3), 'timber-v1'));
      elements.push(...renderBlock(buildingX + buildingWidth - 22, buildingY, 2, buildingHeight, addBlueishShadow(theme.buildingMain, 0.3), 'timber-v2'));
      
      if (isProsperous) {
        // Chimney with animated smoke
        elements.push(...renderBlock(buildingX + buildingWidth * 0.7, buildingY - roofHeight - 15, 8, 25, theme.buildingDark, 'chimney'));
        elements.push(...renderBlock(buildingX + buildingWidth * 0.7 - 2, buildingY - roofHeight - 20, 12, 5, theme.roofDark, 'chimney-cap'));
        
        // Animated smoke
        for (let s = 0; s < 6; s++) {
          const smokeX = buildingX + buildingWidth * 0.7 + 4 + Math.sin(s * 0.5) * 3;
          const smokeY = buildingY - roofHeight - 25 - s * 4;
          elements.push(
            <rect 
              key={`smoke-${s}`} 
              x={smokeX} 
              y={smokeY} 
              width="3" 
              height="3" 
              fill="#E0E0E0" 
              style={{ shapeRendering: 'crispEdges', '--delay': s } as React.CSSProperties}
              className="animate-smoke"
            />
          );
        }
        
        // Second building
        elements.push(...renderBlock(buildingX + buildingWidth + 15, buildingY + 15, 50, 45, theme.buildingMain, 'second-building'));
        
        const secondRoofPoints = `${buildingX + buildingWidth + 10},${buildingY + 15} ${buildingX + buildingWidth + 40},${buildingY} ${buildingX + buildingWidth + 70},${buildingY + 15}`;
        elements.push(
          <polygon 
            key="second-roof" 
            points={secondRoofPoints} 
            fill={theme.roof} 
            style={{ shapeRendering: 'crispEdges' }} 
          />
        );
      }
    }
    
    else if (era === 'INDUSTRIAL_ERA' || era === 'MODERN_ERA') {
      // Industrial/modern building
      elements.push(...renderBlock(buildingX, buildingY, buildingWidth, buildingHeight, theme.buildingMain, 'industrial-main'));
      
      // Metal gambrel roof
      elements.push(...renderBlock(buildingX - 4, buildingY - 12, buildingWidth + 8, 12, theme.roof, 'gambrel-lower'));
      elements.push(...renderBlock(buildingX + 12, buildingY - 24, buildingWidth - 24, 12, theme.roof, 'gambrel-upper'));
      
      // Metal siding lines
      for (let i = 6; i < buildingWidth; i += 8) {
        elements.push(
          <rect 
            key={`siding-${i}`} 
            x={buildingX + i} 
            y={buildingY} 
            width="1" 
            height={buildingHeight} 
            fill={addBlueishShadow(theme.buildingMain, 0.2)} 
            style={{ shapeRendering: 'crispEdges' }}
          />
        );
        elements.push(
          <rect 
            key={`siding-highlight-${i}`} 
            x={buildingX + i + 2} 
            y={buildingY} 
            width="1" 
            height={buildingHeight} 
            fill={lightenColor(theme.buildingMain, 0.1)} 
            style={{ shapeRendering: 'crispEdges' }}
          />
        );
      }
      
      // Large barn doors
      elements.push(...renderBlock(buildingX + buildingWidth/2 - 15, buildingY + buildingHeight - 30, 30, 30, '#654321', 'barn-doors'));
      
      if (isProsperous) {
        // Silo
        elements.push(...renderBlock(buildingX + buildingWidth + 20, buildingY - 15, 16, buildingHeight + 15, '#C0C0C0', 'silo'));
        elements.push(
          <rect 
            key="silo-highlight" 
            x={buildingX + buildingWidth + 20} 
            y={buildingY - 15} 
            width="2" 
            height={buildingHeight + 15} 
            fill="#E0E0E0" 
            style={{ shapeRendering: 'crispEdges' }}
          />
        );
        elements.push(
          <rect 
            key="silo-shadow" 
            x={buildingX + buildingWidth + 34} 
            y={buildingY - 15} 
            width="2" 
            height={buildingHeight + 15} 
            fill="#A0A0A0" 
            style={{ shapeRendering: 'crispEdges' }}
          />
        );
        elements.push(...renderBlock(buildingX + buildingWidth + 18, buildingY - 20, 20, 6, '#A0A0A0', 'silo-top'));
      }
    }
    
    else {
      // Basic building for other eras
      elements.push(...renderBlock(buildingX, buildingY, buildingWidth, buildingHeight, theme.buildingMain, 'basic-building'));
      
      const roofPoints = `${buildingX - 4},${buildingY} ${buildingX + buildingWidth/2},${buildingY - 25} ${buildingX + buildingWidth + 4},${buildingY}`;
      elements.push(
        <polygon 
          key="basic-roof" 
          points={roofPoints} 
          fill={theme.roof} 
          style={{ shapeRendering: 'crispEdges' }} 
        />
      );
      
      elements.push(...renderBlock(buildingX + buildingWidth/2 - 6, buildingY + buildingHeight - 16, 12, 16, '#654321', 'basic-door'));
      elements.push(...renderBlock(buildingX + 12, buildingY + 16, 8, 8, '#1a1a2e', 'basic-window'));
    }
    
    return elements;
  };

  // Enhanced seasonal crop rendering
  const renderSeasonalCrops = () => {
    const elements = [];
    const fieldX = width * 0.45;
    const fieldY = height * 0.7;
    const fieldWidth = width * 0.5;
    const fieldHeight = height * 0.2;
    
    // Seasonal field base
    let fieldBaseColor = theme.terrainDark;
    if (season === 'winter' && climate === 'COLD') {
      fieldBaseColor = '#F0F8FF';
    } else if (season === 'fall') {
      fieldBaseColor = addBlueishShadow(theme.terrainDark, 0.15);
    }
    
    elements.push(...renderBlock(fieldX, fieldY, fieldWidth, fieldHeight, fieldBaseColor, 'field-base', false));
    
    // Crop-specific rendering with seasonal variations
    const cropMultiplier = theme.foliageMultiplier;
    
    if (cropType.toLowerCase().includes('barley') || cropType.toLowerCase().includes('grain')) {
      const blockSize = 10;
      const rows = Math.floor(fieldHeight / blockSize);
      const cols = Math.floor(fieldWidth / blockSize);
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = fieldX + col * blockSize;
          const y = fieldY + row * blockSize;
          
          let barleyColor = '#DAA520';
          let grainColor = '#F4A460';
          
          if (season === 'spring') {
            barleyColor = '#9ACD32';
            grainColor = lightenColor('#9ACD32', 0.2);
          } else if (season === 'fall') {
            barleyColor = '#B8860B';
            grainColor = '#DAA520';
          } else if (season === 'winter' && climate === 'COLD') {
            continue;
          }
          
          if ((row + col) % 2 === 0) {
            elements.push(...renderBlock(x, y, blockSize, blockSize, barleyColor, `barley-${row}-${col}`));
            elements.push(
              <rect 
                key={`grain-${row}-${col}`} 
                x={x + 2} 
                y={y} 
                width={blockSize - 4} 
                height="2" 
                fill={grainColor} 
                style={{ shapeRendering: 'crispEdges' }}
              />
            );
          }
        }
      }
    }
    
    else if (cropType.toLowerCase().includes('corn') || cropType.toLowerCase().includes('maize')) {
      const rowSpacing = 12;
      const numRows = Math.floor(fieldHeight / rowSpacing);
      
      for (let row = 0; row < numRows; row++) {
        const y = fieldY + row * rowSpacing;
        
        elements.push(
          <rect 
            key={`corn-furrow-${row}`} 
            x={fieldX} 
            y={y} 
            width={fieldWidth} 
            height="1" 
            fill={theme.buildingDark} 
            style={{ shapeRendering: 'crispEdges' }}
          />
        );
        
        for (let x = fieldX + 6; x < fieldX + fieldWidth; x += 10) {
          let stalkColor = '#228B22';
          let earColor = '#FFD700';
          
          if (season === 'spring') {
            stalkColor = '#32CD32';
            earColor = '#ADFF2F';
          } else if (season === 'fall') {
            stalkColor = '#8B7355';
            earColor = '#DAA520';
          } else if (season === 'winter' && climate === 'COLD') {
            continue;
          }
          
          elements.push(...renderBlock(x, y - 10, 3, 10, stalkColor, `corn-stalk-${row}-${x}`));
          elements.push(...renderBlock(x + 1, y - 6, 2, 4, earColor, `corn-ear-${row}-${x}`));
        }
      }
    }
    
    else if (cropType.toLowerCase().includes('grape') || cropType.toLowerCase().includes('wine')) {
      const postSpacing = 16;
      const numPosts = Math.floor(fieldWidth / postSpacing);
      
      for (let row = 0; row < 2; row++) {
        const y = fieldY + row * (fieldHeight / 2);
        
        for (let post = 0; post < numPosts; post++) {
          const x = fieldX + post * postSpacing;
          elements.push(...renderBlock(x, y - 12, 2, 12, '#8B4513', `post-${row}-${post}`));
        }
        
        elements.push(
          <rect 
            key={`wire-${row}`} 
            x={fieldX} 
            y={y - 6} 
            width={fieldWidth} 
            height="1" 
            fill="#696969" 
            style={{ shapeRendering: 'crispEdges' }}
          />
        );
        
        for (let x = fieldX + 8; x < fieldX + fieldWidth; x += 12) {
          let grapeColor = '#8B008B';
          let leafColor = '#228B22';
          
          if (season === 'spring') {
            grapeColor = '#90EE90';
            leafColor = '#32CD32';
          } else if (season === 'fall') {
            grapeColor = '#4B0082';
            leafColor = '#8B4513';
          } else if (season === 'winter') {
            leafColor = '#654321';
            grapeColor = '#654321';
          }
          
          if (season !== 'spring' && season !== 'winter') {
            elements.push(...renderBlock(x, y - 4, 3, 4, grapeColor, `grapes-${row}-${x}`));
          }
          elements.push(...renderBlock(x - 2, y - 8, 6, 2, leafColor, `leaves-${row}-${x}`));
        }
      }
    }
    
    else if (cropType.toLowerCase().includes('rice')) {
      const paddySize = 25;
      const paddiesX = Math.floor(fieldWidth / paddySize);
      const paddiesY = Math.floor(fieldHeight / paddySize);
      
      for (let py = 0; py < paddiesY; py++) {
        for (let px = 0; px < paddiesX; px++) {
          const x = fieldX + px * paddySize;
          const y = fieldY + py * paddySize;
          
          elements.push(...renderBlock(x + 1, y + 1, paddySize - 2, paddySize - 2, '#4682B4', `rice-water-${py}-${px}`));
          elements.push(...renderBlock(x + 4, y + 4, paddySize - 8, paddySize - 8, '#32CD32', `rice-plants-${py}-${px}`));
          
          elements.push(...renderBlock(x, y, paddySize, 1, '#8B4513', `paddy-wall-top-${py}-${px}`));
          elements.push(...renderBlock(x, y, 1, paddySize, '#8B4513', `paddy-wall-left-${py}-${px}`));
        }
      }
    }
    
    else {
      // Generic crop pattern
      const blockSize = 8;
      const rows = Math.floor(fieldHeight / blockSize);
      const cols = Math.floor(fieldWidth / blockSize);
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if ((row + col) % 3 === 0) {
            const x = fieldX + col * blockSize;
            const y = fieldY + row * blockSize;
            
            let cropColor = '#32CD32';
            if (season === 'fall') cropColor = '#DAA520';
            if (season === 'winter' && climate === 'COLD') continue;
            
            elements.push(...renderBlock(x, y, blockSize, blockSize, cropColor, `generic-crop-${row}-${col}`));
          }
        }
      }
    }
    
    return elements;
  };

  // Enhanced atmospheric elements
  const renderSeasonalAtmosphere = () => {
    const elements = [];
    
    // Clouds with seasonal variations
    const numClouds = theme.weatherEffect === 'overcast' ? 4 : 2;
    for (let i = 0; i < numClouds; i++) {
      const cloudX = 40 + i * 150 + seededRandom(actualSeed + i) * 60;
      const cloudY = 15 + seededRandom(actualSeed + i + 10) * 20;
      
      let cloudColor = '#FFFFFF';
      if (season === 'winter') cloudColor = '#F0F8FF';
      if (season === 'fall') cloudColor = '#F5F5DC';
      if (theme.weatherEffect === 'overcast') cloudColor = '#D3D3D3';
      
      elements.push(...renderBlock(cloudX, cloudY, 25, 12, cloudColor, `cloud-main-${i}`));
      elements.push(...renderBlock(cloudX + 16, cloudY - 4, 20, 10, cloudColor, `cloud-right-${i}`));
      elements.push(...renderBlock(cloudX + 8, cloudY - 6, 16, 8, cloudColor, `cloud-top-${i}`));
    }
    
    // Seasonal trees
    const treePositions = [25, width - 40];
    treePositions.forEach((treeX, i) => {
      const treeY = height * 0.65;
      
      elements.push(...renderBlock(treeX, treeY, 4, 15, '#8B4513', `tree-trunk-${i}`));
      
      let foliageColor = '#228B22';
      if (season === 'spring') foliageColor = '#32CD32';
      if (season === 'summer') foliageColor = '#006400';
      if (season === 'fall') foliageColor = '#FF8C00';
      if (season === 'winter') foliageColor = climate === 'COLD' ? '#2F4F4F' : '#8B7355';
      
      elements.push(...renderBlock(treeX - 6, treeY - 10, 16, 12, foliageColor, `tree-canopy-${i}`));
    });
    
    return elements;
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`}
        style={{ 
          imageRendering: 'pixelated'
        }}
      >
        <defs>
          <linearGradient id={`skyGradient-${actualSeed}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={theme.skyTop} />
            <stop offset="60%" stopColor={theme.skyBottom} />
            <stop offset="100%" stopColor={lightenColor(theme.skyBottom, 0.1)} />
          </linearGradient>
          
          <style>
            {`
              * { 
                shape-rendering: crispEdges; 
              }
            `}
          </style>
        </defs>
        
        {/* Sky background */}
        <rect 
          x="0" 
          y="0" 
          width={width} 
          height={height} 
          fill={`url(#skyGradient-${actualSeed})`} 
        />
        
        {/* Climate background with regional topology */}
        {renderClimateBackground()}
        
        {/* Seasonal atmosphere */}
        {renderSeasonalAtmosphere()}
        
        {/* Painterly building */}
        {renderPainterlyBuilding()}
        
        {/* Seasonal crops */}
        {renderSeasonalCrops()}
        
        {/* Enhanced border */}
        <rect 
          x="1" 
          y="1" 
          width={width - 2} 
          height={height - 2} 
          fill="none" 
          stroke="rgba(0,0,0,0.15)" 
          strokeWidth="2" 
        />
        <rect 
          x="0" 
          y="0" 
          width={width} 
          height={height} 
          fill="none" 
          stroke={addBlueishShadow(theme.roofDark, 0.2)} 
          strokeWidth="1" 
          opacity="0.6"
        />
        
      </svg>
      <ParticleEffects season={season} climate={climate} width={width} height={height} seed={actualSeed} />
    </div>
  );
};

export default FarmBanner;