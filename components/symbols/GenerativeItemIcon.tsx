/**
 * components/symbols/GenerativeItemIcon.tsx - Renders a procedural SVG icon for an item.
 */
import React from 'react';
import { Item } from '../../types';
import { BASE_SPRITES, getItemArchetype } from '../../constants/items/baseSprites';
import { MATERIAL_PALETTES } from '../../constants/items/materialPalettes';

interface GenerativeItemIconProps {
    item: Item;
    size?: number;
}

const getSpriteKeyForItem = (item: Item): string => {
    return getItemArchetype(item.name);
};

const GenerativeItemIcon: React.FC<GenerativeItemIconProps> = ({ item, size = 48 }) => {
    const spriteKey = getSpriteKeyForItem(item);
    const spritePaths = spriteKey ? BASE_SPRITES[spriteKey] : null;

    if (!spritePaths) {
        return <span style={{ fontSize: `${size * 0.6}px` }}>{item.emoji}</span>;
    }

    // Enhanced color matching logic
    const getMaterialKey = (): keyof typeof MATERIAL_PALETTES => {
        const itemName = item.name.toLowerCase();
        const itemColor = item.color?.toLowerCase();
        const itemMaterial = item.material?.toUpperCase();
        
        // Specific food item coloring
        if (itemName.includes('bread') || itemName.includes('loaf')) {
            return 'BREAD_CRUST';
        }
        if (itemName.includes('meat') || itemName.includes('venison') || itemName.includes('pork') || itemName.includes('beef')) {
            return 'FRESH_MEAT';
        }
        
        // Color-based matching for clothing
        if (itemColor) {
            if (itemColor.includes('brown') || itemColor === 'saddle brown') return 'SADDLE_BROWN';
            if (itemColor.includes('green') || itemColor === 'forest green') return 'FOREST_GREEN';
            if (itemColor.includes('blue') || itemColor === 'deep blue') return 'DEEP_BLUE';
            if (itemColor.includes('burgundy') || itemColor === 'burgundy') return 'BURGUNDY';
            if (itemColor.includes('charcoal') || itemColor === 'charcoal') return 'CHARCOAL';
            if (itemColor.includes('cream') || itemColor === 'cream') return 'CREAM';
            if (itemColor.includes('rust') || itemColor === 'rust red') return 'RUST_RED';
        }
        
        // Material-based matching
        if (itemMaterial && MATERIAL_PALETTES[itemMaterial]) {
            return itemMaterial as keyof typeof MATERIAL_PALETTES;
        }
        
        return 'DEFAULT';
    };
    
    const materialKey = getMaterialKey();
    const palette = MATERIAL_PALETTES[materialKey];

    const renderPattern = (patternType: string, patternId: string) => {
        switch (patternType) {
            case 'wood_grain':
                return (
                    <pattern id={patternId} patternUnits="userSpaceOnUse" width="4" height="4">
                        <rect width="4" height="4" fill={palette.base}/>
                        <path d="M0,1 L4,1 M0,3 L4,3" stroke={palette.shadow} strokeWidth="0.3" opacity="0.4"/>
                    </pattern>
                );
            case 'metal_shine':
                return (
                    <linearGradient id={patternId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={palette.highlight}/>
                        <stop offset="50%" stopColor={palette.base}/>
                        <stop offset="100%" stopColor={palette.shadow}/>
                    </linearGradient>
                );
            case 'fabric_weave':
                return (
                    <pattern id={patternId} patternUnits="userSpaceOnUse" width="2" height="2">
                        <rect width="2" height="2" fill={palette.base}/>
                        <rect width="1" height="1" fill={palette.shadow} opacity="0.2"/>
                        <rect x="1" y="1" width="1" height="1" fill={palette.shadow} opacity="0.2"/>
                    </pattern>
                );
            case 'stone_texture':
                return (
                    <pattern id={patternId} patternUnits="userSpaceOnUse" width="3" height="3">
                        <rect width="3" height="3" fill={palette.base}/>
                        <circle cx="1" cy="1" r="0.3" fill={palette.shadow} opacity="0.3"/>
                        <circle cx="2.5" cy="2.5" r="0.2" fill={palette.highlight} opacity="0.3"/>
                    </pattern>
                );
            case 'gem_facets':
                return (
                    <radialGradient id={patternId} cx="50%" cy="30%" r="70%">
                        <stop offset="0%" stopColor={palette.highlight}/>
                        <stop offset="60%" stopColor={palette.base}/>
                        <stop offset="100%" stopColor={palette.shadow}/>
                    </radialGradient>
                );
            default:
                return null;
        }
    };

    const renderPaths = () => {
        const patternId = `pattern-${item.id || 'default'}-${Date.now()}`;
        const hasPattern = palette.pattern;
        const fillColor = hasPattern ? `url(#${patternId})` : palette.base;

        return Object.entries(spritePaths).map(([key, pathData]) => {
            let layerFill = fillColor;
            let strokeColor = palette.shadow;
            
            // Layer-specific coloring
            if (key.includes('shadow') || key.includes('sole') || key.includes('binding')) {
                layerFill = palette.shadow;
            } else if (key.includes('highlight') || key.includes('blade') || key.includes('edge')) {
                layerFill = palette.highlight;
                strokeColor = palette.base;
            } else if (key.includes('accent') || key.includes('trim') || key.includes('guard') || key.includes('gem')) {
                layerFill = palette.accent || palette.highlight;
            } else if (key.includes('cork') || key.includes('haft') || key.includes('grip')) {
                layerFill = MATERIAL_PALETTES.WOOD.base;
                strokeColor = MATERIAL_PALETTES.WOOD.shadow;
            } else if (key === 'crust' && materialKey === 'BREAD_CRUST') {
                // Special handling for bread crust - make it more golden
                layerFill = '#d4a574'; // Golden brown crust
                strokeColor = '#b8956b';
            } else if (key === 'base' && materialKey === 'BREAD_CRUST') {
                // Bread interior should be lighter
                layerFill = MATERIAL_PALETTES.BREAD_DOUGH.base;
            }
            
            return (
                <path 
                    key={key} 
                    d={pathData} 
                    fill={layerFill} 
                    stroke={strokeColor} 
                    strokeWidth="0.5"
                />
            );
        });
    };

    const rarityGlows: Partial<Record<Item['rarity'], string>> = {
        'Uncommon': 'url(#uncommonGlow)',
        'Rare': 'url(#rareGlow)',
        'Ultra-rare': 'url(#ultrarareGlow)',
        'Unique': 'url(#uniqueGlow)',
    };
    const glowFilter = rarityGlows[item.rarity];

    const patternId = `pattern-${item.id || 'default'}-${Date.now()}`;

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ imageRendering: 'pixelated', overflow: 'visible' }}>
            <defs>
                {palette.pattern && renderPattern(palette.pattern, patternId)}
                <filter id="uncommonGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#22c55e" floodOpacity="0.7"/>
                </filter>
                <filter id="rareGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#3b82f6" floodOpacity="0.8"/>
                </filter>
                <filter id="ultrarareGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#a855f7" floodOpacity="0.9"/>
                </filter>
                <filter id="uniqueGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="1"/>
                </filter>
            </defs>
            <g filter={glowFilter}>{renderPaths()}</g>
        </svg>
    );
};

export default GenerativeItemIcon;