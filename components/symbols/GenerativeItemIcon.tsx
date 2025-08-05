/**
 * components/symbols/GenerativeItemIcon.tsx - Renders a procedural SVG icon for an item.
 */
import React from 'react';
import { Item } from '../../types';
import { BASE_SPRITES } from '../../constants/items/baseSprites';
import { MATERIAL_PALETTES } from '../../constants/items/materialPalettes';

interface GenerativeItemIconProps {
    item: Item;
    size?: number;
}

const getSpriteKeyForItem = (item: Item): string | null => {
    const name = item.name.toLowerCase();
    const category = item.category;

    if (category === 'Consumable' && name.includes('potion')) return 'POTION';
    if (category === 'Document' && (name.includes('book') || name.includes('tome'))) return 'BOOK';
    if (category === 'Document' && (name.includes('scroll') || name.includes('letter'))) return 'SCROLL';
    if (category === 'Food') return 'FOOD';

    if (category === 'Weapon') {
        if (name.includes('sword') || name.includes('blade')) return 'SWORD';
        if (name.includes('axe')) return 'AXE';
    }
    if (category === 'Apparel') {
        if (item.equipmentSlot === 'head') return 'HELMET';
        if (item.equipmentSlot === 'torso') return 'CHEST_ARMOR';
        if (item.equipmentSlot === 'feet') return 'BOOTS';
        if (item.equipmentSlot === 'off_hand' && name.includes('shield')) return 'SHIELD';
        if (item.equipmentSlot === 'ring1' || item.equipmentSlot === 'ring2') return 'RING';
        if (item.equipmentSlot === 'amulet') return 'AMULET';
    }
    
    return null; // Fallback for unsupported items
};

const GenerativeItemIcon: React.FC<GenerativeItemIconProps> = ({ item, size = 48 }) => {
    const spriteKey = getSpriteKeyForItem(item);
    const spritePaths = spriteKey ? BASE_SPRITES[spriteKey] : null;

    if (!spritePaths) {
        return <span style={{ fontSize: `${size * 0.6}px` }}>{item.emoji}</span>;
    }

    const materialKey = (item.material?.toUpperCase() || 'DEFAULT') as keyof typeof MATERIAL_PALETTES;
    const palette = MATERIAL_PALETTES[materialKey] || MATERIAL_PALETTES.DEFAULT;

    const renderPaths = () => {
        return Object.entries(spritePaths).map(([key, pathData]) => {
            let fillColor = palette.base;
            if (key.includes('shadow') || key.includes('haft') || key.includes('hilt') || key.includes('binding')) {
                fillColor = palette.shadow;
            } else if (key.includes('highlight') || key.includes('blade') || key.includes('boss')) {
                fillColor = palette.highlight;
            } else if (key.includes('trim') || key.includes('guard') || key.includes('tie')) {
                fillColor = palette.accent || palette.shadow;
            } else if (key.includes('sole')) {
                 fillColor = palette.shadow;
            } else if (key.includes('cork')) {
                fillColor = MATERIAL_PALETTES.WOOD.base;
            }
            return <path key={key} d={pathData} fill={fillColor} stroke={palette.shadow} strokeWidth="0.5" />;
        });
    };

    const rarityGlows: Partial<Record<Item['rarity'], string>> = {
        'Uncommon': 'url(#uncommonGlow)',
        'Rare': 'url(#rareGlow)',
        'Ultra-rare': 'url(#ultrarareGlow)',
        'Unique': 'url(#uniqueGlow)',
    };
    const glowFilter = rarityGlows[item.rarity];

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ imageRendering: 'pixelated', overflow: 'visible' }}>
            <defs>
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