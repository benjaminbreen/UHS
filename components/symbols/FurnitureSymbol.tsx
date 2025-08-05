import React from 'react';
import { InteriorEntity } from '../../../types';

const FurnitureSymbol: React.FC<InteriorEntity> = ({ subType, x, y, width, height, quality, rotation }) => {
    const getSymbol = () => {
        switch (subType) {
            case 'bed': return '🛏️';
            case 'table': return '🍽️';
            case 'chair': return '🪑';
            case 'desk': return '📝';
            case 'kitchen_hearth': return '🔥';
            case 'fireplace': return '🔥';
            case 'bookshelf': return '📚';
            case 'barrel': return '🛢️';
            case 'bar_counter': return '🍻';
            case 'stool': return '🪑';
            case 'rug': return ''; // Rugs should be drawn, not be an emoji on top
            case 'cabinet': return '🗄️';
            case 'window': return '🖼️';
            case 'chest': return '📦';
            case 'throne': return '👑';
            case 'armor_stand': return '🛡️';
            case 'tapestry': return '🎨';
            case 'grand_table': return '🍽️';
            case 'staircase': return '🪜';
            default: return '❓';
        }
    };
    
    // Don't render an emoji for rugs, as they are background elements.
    if (subType === 'rug') {
        return (
            <rect 
                x={x} 
                y={y} 
                width={width} 
                height={height} 
                fill={quality === 'lavish' ? '#8B0000' : '#8B4513'} 
                opacity="0.6"
                transform={`rotate(${rotation || 0} ${x + width / 2} ${y + height / 2})`}
            />
        );
    }

    return (
        <text
            x={x + width / 2}
            y={y + height / 2}
            fontSize={Math.min(width, height) * 0.9}
            textAnchor="middle"
            dominantBaseline="central"
            transform={`rotate(${rotation || 0} ${x + width / 2} ${y + height / 2})`}
        >
            {getSymbol()}
        </text>
    );
};
export default FurnitureSymbol;