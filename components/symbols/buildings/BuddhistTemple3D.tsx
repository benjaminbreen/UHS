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
    
    const wallColor = `hsl(30, 60%, 80%)`;
    const woodColor = `hsl(20, 50%, 45%)`;
    const roofColor = `hsl(160, 50%, 40%)`;
    const roofHighlight = `hsl(160, 50%, 60%)`;
    const goldColor = `hsl(45, 85%, 60%)`;
    const outlineColor = `hsl(20, 50%, 25%)`;
    const depth = size * 0.35;
    
    const elements: JSX.Element[] = [];

    for(let i=0; i<tiers; i++) {
        const tierWidth = width * (1 - i * 0.15);
        const tierHeight = height / (tiers * 1.2);
        const tierX = x + (width - tierWidth)/2;
        const tierY = y + height - (i+1) * (height / (tiers * 1.1));
        const tierDepth = depth * (1 - i * 0.15);

        const roofOverhang = tierWidth * 0.2;
        const roofHeight = tierHeight * 1.5;
        const roofY = tierY;

        // Wall section
        elements.push(<rect key={`wall-${i}`} x={tierX} y={tierY} width={tierWidth} height={tierHeight} fill={wallColor} stroke={outlineColor} strokeWidth="0.2"/>);
        elements.push(<path key={`side-${i}`} d={`M ${tierX+tierWidth} ${tierY} L ${tierX+tierWidth+tierDepth} ${tierY-tierDepth*0.5} L ${tierX+tierWidth+tierDepth} ${tierY+tierHeight-tierDepth*0.5} L ${tierX+tierWidth} ${tierY+tierHeight} Z`} fill={woodColor} stroke={outlineColor} strokeWidth="0.2"/>);
        
        // Roof section
        const roofPath = `M ${tierX-roofOverhang} ${roofY}
                           Q ${tierX+tierWidth/2} ${roofY-roofHeight*0.2}, ${tierX+tierWidth+roofOverhang} ${roofY}
                           Q ${tierX+tierWidth/2} ${roofY-roofHeight*0.4}, ${tierX-roofOverhang} ${roofY}
                           L ${tierX+tierWidth/2} ${roofY - roofHeight} Z`;

        elements.push(<path key={`roof-${i}`} d={roofPath} fill={roofColor} stroke={outlineColor} strokeWidth="0.3"/>);
    }
    
    // Finial on top
    elements.push(<line key="finial" x1={x+width/2} y1={y+height-tiers*(height/(tiers*1.1))-height*0.25} x2={x+width/2} y2={y-2} stroke={goldColor} strokeWidth="1.5"/>);
    elements.push(<circle key="finial-ball" cx={x+width/2} cy={y-3} r="2" fill={goldColor}/>);

    return <g filter="url(#symbolShadow)">{elements}</g>;
});

export default BuddhistTemple3D;