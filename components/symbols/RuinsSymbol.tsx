/**
 * components/symbols/RuinsSymbol.tsx - Renders a detailed, randomized ruin feature
 */
import React from 'react';
import { Tile, ClimateType } from '../../types';
import { ValueNoise } from '../../utils/noise';
import { shadeColorHSL } from '../../utils/colorUtils';

interface RuinsSymbolProps { 
  x: number; 
  y: number; 
  size: number; 
  seed: number; 
  tile: Tile;
  climate?: ClimateType;
  nightIntensity?: number;
}

// Simplified helper for demo purposes
const getTileRenderColor = (tile: Tile, climate: ClimateType) => tile.isLand ? "#70A050" : "#3b82f6";

const RuinsSymbol: React.FC<RuinsSymbolProps> = ({ x, y, size, seed, tile, climate = ClimateType.TEMPERATE, nightIntensity = 0 }) => {
    const localRand = () => new ValueNoise(seed + tile.x * 11 + tile.y * 37).random();
    const elements: JSX.Element[] = [];
    
    // Use tile data if available, otherwise fallback to random
    const material = tile.ruinMaterial || 'stone';
    const style = tile.ruinStyle || 'tower';
    const culturalZone = tile.culturalZone || 'EUROPEAN';
    
    // Material-based colors
    const materialColors: Record<string, { base: string; shadow: string; highlight: string }> = {
      'sandstone': { base: '#D4A574', shadow: '#A67C52', highlight: '#E8C89F' },
      'red stone': { base: '#A0522D', shadow: '#704214', highlight: '#CD853F' },
      'mudbrick': { base: '#BC9A6A', shadow: '#8B7355', highlight: '#D4B896' },
      'adobe': { base: '#C19A6B', shadow: '#8B6914', highlight: '#DEB887' },
      'stone': { base: '#a9a9a9', shadow: '#696969', highlight: '#C0C0C0' },
      'granite': { base: '#7C7B78', shadow: '#555555', highlight: '#9C9B98' },
      'marble': { base: '#F0E8E0', shadow: '#C0C0C0', highlight: '#FFFFFF' },
      'limestone': { base: '#E3DAC9', shadow: '#C0B09A', highlight: '#F5F5DC' },
    };
    
    const colors = materialColors[material] || materialColors['stone'];
    const baseColor = nightIntensity > 0 ? shadeColorHSL(colors.base, -nightIntensity * 0.5) : colors.base;
    const strokeColor = colors.shadow;
    const highlightColor = colors.highlight;
    
    // Map old style names to new ones
    const ruinStyle = style === 'temple' ? 'Classical' :
                     style === 'fortress' || style === 'keep' ? 'Castle' :
                     style === 'tower' || style === 'minaret' ? 'Watchtower' :
                     style === 'pagoda' ? 'Temple' :
                     style === 'pyramid' ? 'Fort' :
                     tile.ruinType || 'Fort';
    
    // Base rubble shadow
    elements.push(
        <ellipse
            key="ruin-shadow-base"
            cx={x + size * 0.5}
            cy={y + size * 0.75}
            rx={size * 0.4}
            ry={size * 0.2}
            fill="rgba(0,0,0,0.3)"
            filter="url(#buildingShadow)"
        />
    );

    switch (ruinStyle) {
        case 'Classical':
            const colCount = 2 + Math.floor(localRand() * 3);
            for (let i = 0; i < colCount; i++) {
                const colX = x + size * (0.15 + i * 0.7 / (colCount - 1 || 1));
                const isBroken = localRand() < 0.6;
                const colHeight = (isBroken ? size * (0.2 + localRand() * 0.4) : size * (0.5 + localRand() * 0.2));
                const colY = y + size * 0.8 - colHeight;
                elements.push(<rect key={`col-${i}`} x={colX} y={colY} width={size*0.08} height={colHeight} fill={baseColor} stroke={strokeColor} strokeWidth="0.4"/>);
                if (!isBroken) {
                    elements.push(<rect key={`cap-${i}`} x={colX-size*0.02} y={colY-size*0.04} width={size*0.12} height={size*0.04} fill={baseColor} stroke={strokeColor} strokeWidth="0.4"/>);
                }
            }
            break;

        case 'Castle':
        case 'Fort':
            const mainWallHeight = size * (0.3 + localRand() * 0.2);
            elements.push(<rect key="fort-wall" x={x+size*0.1} y={y + size*0.8 - mainWallHeight} width={size*0.8} height={mainWallHeight} fill={baseColor} stroke={strokeColor} strokeWidth="0.5"/>);
            if (localRand() < 0.7) { // Chance for a tower
                const towerHeight = size * (0.4 + localRand() * 0.3);
                const towerWidth = size * 0.3;
                const towerX = x + (localRand() < 0.5 ? size*0.1 : size*0.6);
                elements.push(<rect key="fort-tower" x={towerX} y={y + size*0.8 - towerHeight} width={towerWidth} height={towerHeight} fill={baseColor} stroke={strokeColor} strokeWidth="0.5"/>);
            }
            break;
        
        case 'Watchtower':
            const towerHeight = size * (0.6 + localRand() * 0.3);
            const towerWidth = size * 0.25;
            const towerX = x + size/2 - towerWidth/2;
            elements.push(<rect key="watchtower" x={towerX} y={y + size*0.8 - towerHeight} width={towerWidth} height={towerHeight} fill={baseColor} stroke={strokeColor} strokeWidth="0.5"/>);
            break;
            
        case 'Village':
            const houseCount = 3 + Math.floor(localRand()*3);
            for(let i=0; i<houseCount; i++) {
                const houseSize = size * (0.15 + localRand() * 0.1);
                const houseX = x + size * (0.1 + localRand() * 0.7);
                const houseY = y + size * (0.3 + localRand() * 0.4);
                elements.push(<rect key={`house-${i}`} x={houseX} y={houseY} width={houseSize} height={houseSize} fill={shadeColorHSL(baseColor, 0.9)} stroke={strokeColor} strokeWidth="0.3" />);
            }
            break;

        case 'Temple':
        case 'Shrine':
            const platformHeight = size * 0.1;
            const platformWidth = size * 0.7;
            const platformX = x + size/2 - platformWidth/2;
            const platformY = y + size*0.8 - platformHeight;
            elements.push(<rect key="shrine-platform" x={platformX} y={platformY} width={platformWidth} height={platformHeight} fill={baseColor} stroke={strokeColor} strokeWidth="0.4"/>);
            const centralHeight = size * 0.4;
            const centralWidth = size * 0.2;
            elements.push(<rect key="shrine-central" x={x+size/2-centralWidth/2} y={platformY-centralHeight} width={centralWidth} height={centralHeight} fill={baseColor} stroke={strokeColor} strokeWidth="0.4"/>);
            if (ruinStyle === 'Temple') {
                elements.push(<rect key="shrine-p1" x={platformX+size*0.05} y={platformY-size*0.2} width={size*0.05} height={size*0.2} fill={baseColor} stroke={strokeColor} strokeWidth="0.3"/>);
                elements.push(<rect key="shrine-p2" x={platformX+platformWidth-size*0.1} y={platformY-size*0.2} width={size*0.05} height={size*0.2} fill={baseColor} stroke={strokeColor} strokeWidth="0.3"/>);
            }
            break;
            
        case 'Burial Mound':
            const baseLandColor = getTileRenderColor(tile, ClimateType.TEMPERATE); // Assuming TEMPERATE context for color
            const moundRadiusX = size * (0.3 + localRand()*0.1);
            const moundRadiusY = size * (0.15 + localRand()*0.05);
            elements.push(<ellipse key="mound" cx={x+size/2} cy={y+size*0.7} rx={moundRadiusX} ry={moundRadiusY} fill={shadeColorHSL(baseLandColor, 1.1, 1.0, -0.05)} />);
            // Entrance
            if(localRand() < 0.8) {
                elements.push(<rect key="mound-ent" x={x+size/2 - size*0.05} y={y+size*0.7} width={size*0.1} height={size*0.1} fill="rgba(0,0,0,0.5)"/>);
            }
            break;
    }

    // Common rubble
    const numRubble = 1 + Math.floor(localRand() * 2);
    for (let i = 0; i < numRubble; i++) { 
        const rubbleSize = size * (0.05 + localRand() * 0.1); 
        elements.push( <rect key={`rubble-${i}`} x={x + localRand() * (size-rubbleSize)} y={y + size * (0.6 + localRand() * 0.2)} width={rubbleSize} height={rubbleSize} fill={shadeColorHSL(baseColor, 0.8)} stroke={strokeColor} strokeWidth="0.2" transform={`rotate(${localRand()*90} ${x+size/2} ${y+size/2})`}/> ); 
    }
    
    return <>{elements}</>;
};

export default React.memo(RuinsSymbol);