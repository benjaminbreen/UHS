/**
 * components/symbols/buildings/BuddhistTemple3D.tsx - Renders a detailed, painterly East Asian pagoda.
 */
import React from 'react';
import { Tile, HistoricalEra } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface BuddhistTemple3DProps {
  x: number; y: number; width: number; height: number; size: number; seed: number; tile: Tile; era: HistoricalEra;
}

const getEraLevel = (era: HistoricalEra): number => {
    switch (era) {
        case HistoricalEra.ANTIQUITY: return 1;
        case HistoricalEra.MEDIEVAL: return 2;
        case HistoricalEra.RENAISSANCE_EARLY_MODERN: return 3;
        default: return 2;
    }
};

const BuddhistTemple3D: React.FC<BuddhistTemple3DProps> = React.memo(({ x, y, width, height, size, seed, tile, era }) => {
    const rand = new ValueNoise(seed + tile.x * 29 + tile.y * 31).random;
    const eraLevel = getEraLevel(era);
    const tiers = 2 + Math.min(3, eraLevel); // 2 to 5 tiers
    const uniqueId = `pagoda-${tile.x}-${tile.y}`;
    
    // Increased size by 40% for more imposing presence
    const scaleFactor = 1.4;
    const wallColor = `hsl(30, 60%, 80%)`;
    const woodColor = `hsl(20, 50%, 45%)`;
    const roofColor = `hsl(160, 50%, 40%)`;
    const roofHighlight = `hsl(160, 50%, 60%)`;
    const goldColor = `hsl(45, 85%, 60%)`;
    const outlineColor = `hsl(20, 50%, 25%)`;
    const depth = size * 0.45 * scaleFactor;
    
    const elements: JSX.Element[] = [];

    for(let i=0; i<tiers; i++) {
        const tierWidth = width * (1 - i * 0.15) * scaleFactor;
        const tierHeight = (height / (tiers * 1.2)) * scaleFactor;
        // Center building properly after scaling
        const tierX = x + (width * scaleFactor - tierWidth) / 2 - (width * (scaleFactor - 1) / 2);
        const tierY = y + height - (i+1) * (height / (tiers * 1.1)) * scaleFactor;
        const tierDepth = depth * (1 - i * 0.15);

        const roofOverhang = tierWidth * 0.25;
        const roofHeight = tierHeight * 1.8;
        const roofY = tierY;

        // Wall section - Standardized stroke width
        elements.push(<rect key={`wall-${i}`} x={tierX} y={tierY} width={tierWidth} height={tierHeight} fill={wallColor} stroke={outlineColor} strokeWidth="0.5"/>);
        elements.push(<path key={`side-${i}`} d={`M ${tierX+tierWidth} ${tierY} L ${tierX+tierWidth+tierDepth} ${tierY-tierDepth*0.5} L ${tierX+tierWidth+tierDepth} ${tierY+tierHeight-tierDepth*0.5} L ${tierX+tierWidth} ${tierY+tierHeight} Z`} fill={woodColor} stroke={outlineColor} strokeWidth="0.5"/>);
        
        // Roof section
        const roofPath = `M ${tierX-roofOverhang} ${roofY}
                           Q ${tierX+tierWidth/2} ${roofY-roofHeight*0.2}, ${tierX+tierWidth+roofOverhang} ${roofY}
                           Q ${tierX+tierWidth/2} ${roofY-roofHeight*0.4}, ${tierX-roofOverhang} ${roofY}
                           L ${tierX+tierWidth/2} ${roofY - roofHeight} Z`;

        elements.push(<path key={`roof-${i}`} d={roofPath} fill={roofColor} stroke={outlineColor} strokeWidth="0.5"/>);
    }
    
    // Finial on top - Simplified position calculation
    const finialX = x + (width * scaleFactor) / 2 - (width * (scaleFactor - 1) / 2);
    const finialTopY = y - height * 0.1;
    elements.push(<line key="finial" x1={finialX} y1={y} x2={finialX} y2={finialTopY} stroke={goldColor} strokeWidth="2.5"/>);
    elements.push(<circle key="finial-ball" cx={finialX} cy={finialTopY - 2} r="4" fill={goldColor}/>);

    return <g filter="url(#symbolShadow)">{elements}</g>;
});

export default BuddhistTemple3D;