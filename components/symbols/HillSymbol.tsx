/**
 * components/symbols/HillSymbol.tsx - Renders a stylized, altitude-dependent hill symbol.
 */
import React from 'react';
import { Tile, ClimateType, Season } from '../../types';
import { ValueNoise } from '../../utils/noise';
import { shadeColorHSL, getTileRenderColor } from '../../utils/colorUtils';

interface HillSymbolProps {
    x: number;
    y: number;
    size: number;
    seed: number;
    tile: Tile;
    climate: ClimateType;
    season: Season;
}

const HillSymbol: React.FC<HillSymbolProps> = React.memo(({ x, y, size, seed, tile, climate, season }) => {
    const localRand = (offset: number = 0) => new ValueNoise(seed + tile.x * 29 + tile.y * 37 + offset).random();
    const elements: JSX.Element[] = [];

    let baseColor = getTileRenderColor(tile, climate, seed);

    if (season === 'summer' && (climate === ClimateType.ARID || climate === ClimateType.SEMITROPICAL)) {
        baseColor = shadeColorHSL(baseColor, 1.0, 0.8, 0.05); // More tan/dry
    } else if (climate === ClimateType.COLD) {
        baseColor = '#a8b8a8'; // A colder, more tundra-like green-gray
    }
    
    let highlightColor = shadeColorHSL(baseColor, 1.08);
    let shadowColor = shadeColorHSL(baseColor, 0.92);

    const hillCount = 1 + Math.floor(localRand() * 2); // 1 or 2 hills per tile
    const baseY = y + size * 0.9; 

    for (let i = 0; i < hillCount; i++) {
        // Height is based on altitude. Low altitude = flat hill, high altitude = tall hill
        const hillHeight = size * 0.15 + (tile.altitude * size * 0.6); 
        
        // Randomize position and width
        const hillWidth = size * (0.5 + localRand(i*2) * 0.5);
        const hillX = x + (size - hillWidth) * localRand(i*3);
        const hillTopY = baseY - hillHeight * (0.8 + localRand(i*4) * 0.2);

        // A nice rounded path for the hill
        const pathD = `M ${hillX} ${baseY} Q ${hillX + hillWidth / 2} ${hillTopY}, ${hillX + hillWidth} ${baseY} Z`;

        // Create a shadow/highlight effect for 3D appearance
        const highlightPathD = `M ${hillX + size*0.05} ${baseY - size*0.02} Q ${hillX + hillWidth / 2} ${hillTopY}, ${hillX + hillWidth - size*0.05} ${baseY - size*0.02}`;
        
        // Main hill shape
        elements.push(
            <path key={`hill-main-${i}`} d={pathD} fill={baseColor} />
        );
        // Shadow on the right side
        elements.push(
             <path key={`hill-shadow-${i}`} d={`M ${hillX + hillWidth / 2} ${baseY} Q ${hillX + hillWidth * 0.75} ${hillTopY + hillHeight*0.2}, ${hillX + hillWidth} ${baseY} Z`} fill={shadowColor} />
        );
        // Highlight on the left side
        elements.push(
            <path key={`hill-highlight-${i}`} d={highlightPathD} stroke={highlightColor} strokeWidth={size * 0.08} fill="none" opacity="0.6" strokeLinecap="round"/>
        );
        
        // Add snow caps in cold climates during winter
        if (season === 'winter' && (climate === ClimateType.COLD || climate === ClimateType.TEMPERATE) && tile.altitude > 0.4) {
            const capHeight = hillHeight * (0.15 + localRand(i*5) * 0.1);
            const capWidth = hillWidth * (0.2 + localRand(i*6) * 0.15);
            const capPathD = `M ${hillX + hillWidth / 2 - capWidth/2} ${hillTopY + capHeight} L ${hillX + hillWidth/2} ${hillTopY} L ${hillX + hillWidth / 2 + capWidth/2} ${hillTopY + capHeight} Z`;
            elements.push(
                <path key={`snow-cap-${i}`} d={capPathD} fill="rgba(255, 255, 255, 0.85)" />
            );
        }
    }
    return <g>{elements}</g>;
});

export default HillSymbol;