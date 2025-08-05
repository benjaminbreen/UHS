/**
 * components/symbols/poi/JapaneseCastleSymbol.tsx - Renders a Japanese Castle keep
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface JapaneseCastleSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const JapaneseCastleSymbol: React.FC<JapaneseCastleSymbolProps> = ({ x, y, size, seed, tile }) => {
    const localRand = (offset = 0) => new ValueNoise(seed + tile.x * 23 + tile.y * 29 + offset).random();
    const wallColor = "#F5F5DC";
    const roofColor = "#2F4F4F";
    const outlineColor = "#000000";
    const tiers = 3 + Math.floor(localRand() * 2);

    const elements = [];

    // Stone base
    elements.push(<path key="base" d={`M ${x + size*0.1} ${y+size*0.9} L ${x+size*0.2} ${y+size*0.6} L ${x+size*0.8} ${y+size*0.6} L ${x+size*0.9} ${y+size*0.9} Z`} fill="#A9A9A9" stroke={outlineColor} strokeWidth="0.3"/>);

    for(let i=0; i<tiers; i++) {
        const tierY = y + size * 0.6 - i * (size * 0.2);
        const tierWidth = size * (0.6 - i * 0.1);
        const tierX = x + (size - tierWidth) / 2;
        const roofHeight = size * 0.1;
        const roofWidth = tierWidth * 1.3;
        const roofX = x + (size - roofWidth) / 2;

        elements.push(<rect key={`wall-${i}`} x={tierX} y={tierY-size*0.1} width={tierWidth} height={size*0.1} fill={wallColor} stroke={outlineColor} strokeWidth="0.2" />);

        elements.push(
            <path key={`roof-${i}`}
                d={`M ${roofX} ${tierY-size*0.1} Q ${roofX + roofWidth/2} ${tierY-size*0.1 - roofHeight*0.4}, ${roofX + roofWidth} ${tierY-size*0.1} Q ${roofX + roofWidth/2} ${tierY-size*0.1 - roofHeight*0.6}, ${roofX} ${tierY-size*0.1} L ${roofX + roofWidth/2} ${tierY - size*0.1 - roofHeight} Z`}
                fill={roofColor} stroke={outlineColor} strokeWidth="0.2"
            />
        );
    }
    
    return <g filter="url(#symbolShadow)">{elements}</g>;
};

export default React.memo(JapaneseCastleSymbol);