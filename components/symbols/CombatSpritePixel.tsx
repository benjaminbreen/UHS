import React from 'react';
import { PlayerCharacter } from '../../types/character';
import { Appearance } from '../../types/appearance';

interface CombatSpriteProps {
    character: PlayerCharacter;
    animation: 'idle' | 'attacking' | 'damaged' | 'fleeing' | 'defending' | 'item' | 'burn';
    facing: 'left' | 'right';
    enhancement?: 'elite' | 'strong' | 'enraged' | null;
    isPlayer?: boolean;
}

// Utility to darken/lighten colors
const shadeColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
};

// Pixel art helper to create clean rectangles
const Pixel: React.FC<{x: number, y: number, w?: number, h?: number, color: string, opacity?: number}> =
    ({x, y, w = 1, h = 1, color, opacity = 1}) => (
    <rect x={Math.floor(x)} y={Math.floor(y)} width={w} height={h}
          fill={color} opacity={opacity} shapeRendering="crispEdges" />
);

// Color ramp generator for pixel art shading
const createColorRamp = (baseColor: string) => ({
    light: shadeColor(baseColor, 20),
    mid: baseColor,
    dark: shadeColor(baseColor, -20),
    outline: shadeColor(baseColor, -40)
});

const CombatSpritePixel: React.FC<CombatSpriteProps> = ({ character, animation, facing, enhancement, isPlayer }) => {
    const { gender, age, appearance, equippedItems, statusEffects } = character;
    const {
        skinColor, hairColor, eyeColor, build
    } = appearance as Appearance;
    const { primary: clothingColor, secondary: secondaryColor } = appearance.palette;

    const mainHandItem = equippedItems?.main_hand;
    const armorItem = equippedItems?.armor;
    const helmetItem = equippedItems?.helmet;

    // Determine weapon type for animation
    const getWeaponType = (item: any): string => {
        if (!item) return 'fist';
        const baseId = item.baseId || '';
        const name = item.name?.toLowerCase() || '';

        // Check by baseId first for accuracy
        if (['SWORD', 'KATANA', 'SCIMITAR', 'GLADIUS', 'RAPIER', 'KHOPESH'].includes(baseId)) return 'sword';
        if (['AXE', 'TOMAHAWK', 'HALBERD'].includes(baseId)) return 'axe';
        if (['CLUB', 'CUDGEL', 'MACE', 'WAR_HAMMER', 'BATON', 'NIGHTSTICK'].includes(baseId)) return 'club';
        if (['FIRE_HARDENED_SPEAR', 'JAVELIN', 'PILUM', 'ASSEGAI', 'SPEAR'].includes(baseId)) return 'spear';
        if (['COMPOSITE_BOW', 'CROSSBOW', 'SLING', 'ATLATL'].includes(baseId)) return 'bow';
        if (['STONE_KNIFE', 'KRIS', 'BONE_NEEDLE'].includes(baseId)) return 'dagger';
        if (['QUARTERSTAFF', 'WALKING_STAFF', 'HERDING_STAFF', 'SHEPHERDS_CROOK', 'WALKING_CANE'].includes(baseId)) return 'staff';
        if (['HAMMER', 'PICKAXE', 'STEEL_PICKAXE', 'WHETSTONE'].includes(baseId)) return 'tool-heavy';
        if (['SPINDLE', 'QUILL', 'BONE_NEEDLE', 'CLAY_LAMP', 'SCALE'].includes(baseId)) return 'tool-light';
        if (['NUNCHAKU', 'COMBAT_FLAIL'].includes(baseId)) return 'flail';
        if (['STICK', 'THROWING_STICK', 'BOOMERANG', 'UMBRELLA'].includes(baseId)) return 'improvised';

        // Fallback to name checking if baseId not found
        if (name.includes('sword') || name.includes('blade') || name.includes('saber')) return 'sword';
        if (name.includes('axe') || name.includes('hatchet')) return 'axe';
        if (name.includes('spear') || name.includes('lance') || name.includes('pike')) return 'spear';
        if (name.includes('bow') || name.includes('crossbow')) return 'bow';
        if (name.includes('club') || name.includes('mace') || name.includes('hammer') || name.includes('cudgel')) return 'club';
        if (name.includes('dagger') || name.includes('knife') || name.includes('dirk')) return 'dagger';
        if (name.includes('staff') || name.includes('stick') || name.includes('cane') || name.includes('rod')) return 'staff';
        if (name.includes('flail') || name.includes('chain')) return 'flail';

        // Default to improvised weapon instead of sword
        return 'improvised';
    };

    const weaponType = getWeaponType(mainHandItem);

    // Determine facing direction
    const facingRight = facing === 'right';
    const isFemale = gender === 'Female';
    const isOld = age && age > 55;

    // Create color ramps for pixel art shading
    const skinRamp = createColorRamp(skinColor);
    const hairRamp = createColorRamp(isOld ? '#808080' : hairColor);

    // Use armor/equipment colors if available, fallback to appearance palette
    const getArmorColor = () => {
        if (armorItem?.color) return armorItem.color;
        if (armorItem?.culturalStyle) {
            // Cultural armor colors
            const culturalColors = {
                'Roman': '#8B0000',     // Deep red
                'Medieval': '#4A4A4A',  // Steel gray
                'Japanese': '#2F4F4F',  // Dark slate gray
                'Celtic': '#8B4513',    // Saddle brown
                'Viking': '#556B2F',    // Dark olive green
            };
            return culturalColors[armorItem.culturalStyle as keyof typeof culturalColors] || clothingColor;
        }
        return clothingColor;
    };

    const clothingRamp = createColorRamp(getArmorColor());
    const pantsRamp = createColorRamp(secondaryColor || clothingColor);

    // Pixel-perfect sprite dimensions (integers only)
    const centerX = 20; // Center of 40px viewBox
    const baseY = 32;   // Ground level

    // Render static body parts (everything except arms)
    const renderBody = () => {
        return (
            <>
                {/* Shadow */}
                <Pixel x={centerX - 3} y={baseY} w={6} h={1} color="#000000" opacity={0.3} />
                <Pixel x={centerX - 2} y={baseY + 1} w={4} h={1} color="#000000" opacity={0.2} />

                {/* Legs */}
                <Pixel x={centerX - 3} y={baseY - 8} w={2} h={8} color={pantsRamp.dark} />
                <Pixel x={centerX - 2} y={baseY - 8} w={1} h={8} color={pantsRamp.mid} />
                <Pixel x={centerX + 1} y={baseY - 8} w={2} h={8} color={pantsRamp.dark} />
                <Pixel x={centerX + 1} y={baseY - 8} w={1} h={8} color={pantsRamp.light} />

                {/* Feet */}
                <Pixel x={centerX - 3} y={baseY - 1} w={2} h={1} color="#3d2314" />
                <Pixel x={centerX + 1} y={baseY - 1} w={2} h={1} color="#3d2314" />

                {/* Torso */}
                <Pixel x={centerX - 3} y={baseY - 15} w={6} h={7} color={clothingRamp.dark} />
                <Pixel x={centerX - 2} y={baseY - 15} w={4} h={7} color={clothingRamp.mid} />
                <Pixel x={centerX - 1} y={baseY - 14} w={2} h={5} color={clothingRamp.light} />

                {/* Armor overlay if equipped */}
                {armorItem && renderArmor()}

                {/* Gender-specific chest */}
                {isFemale && (
                    <>
                        <Pixel x={centerX - 2} y={baseY - 13} w={1} h={1} color={clothingRamp.dark} opacity={0.3} />
                        <Pixel x={centerX + 1} y={baseY - 13} w={1} h={1} color={clothingRamp.dark} opacity={0.3} />
                    </>
                )}

                {/* Head outline */}
                <Pixel x={centerX - 3} y={baseY - 21} w={6} h={6} color={skinRamp.outline} />

                {/* Head */}
                <Pixel x={centerX - 2} y={baseY - 20} w={4} h={4} color={skinRamp.dark} />
                <Pixel x={centerX - 2} y={baseY - 20} w={3} h={3} color={skinRamp.mid} />
                <Pixel x={centerX - 1} y={baseY - 19} w={2} h={2} color={skinRamp.light} />

                {/* Enhanced hair with cultural/style variations */}
                {renderHair()}

                {/* Face - single eye like animal sprites */}
                <Pixel x={centerX + 1} y={baseY - 18} w={1} h={1} color={eyeColor} />
                <Pixel x={centerX - 0.5} y={baseY - 17} w={1} h={0.5} color={shadeColor(skinRamp.mid, -10)} />

                {/* Facial hair for male characters */}
                {!isFemale && appearance.facialHair && renderFacialHair()}

                {/* Helmet/headgear if equipped */}
                {helmetItem && renderHelmet()}

                {/* Simple jewelry indicators */}
                {renderJewelry()}

            </>
        );
    };

    // Render hair with cultural and style variations
    const renderHair = () => {
        // Don't render hair if wearing a helmet that covers it
        if (helmetItem && helmetItem.name?.toLowerCase().includes('helmet')) {
            return null; // Full helmet covers hair
        }

        const hairStyle = appearance.hairStyle || 'short';
        const culturalZone = character.culturalZone;

        // Cultural hair variations
        const getCulturalHairModification = () => {
            switch (culturalZone) {
                case 'EAST_ASIAN':
                    return isFemale ? 'bun' : 'topknot';
                case 'SUB_SAHARAN_AFRICAN':
                    return 'braided';
                case 'NORTH_AMERICAN_PRE_COLUMBIAN':
                    return 'long_braided';
                case 'OCEANIA':
                    return 'decorated';
                default:
                    return hairStyle;
            }
        };

        const finalHairStyle = getCulturalHairModification();

        switch (finalHairStyle) {
            case 'bun':
                return (
                    <g className="hair-bun">
                        <Pixel x={centerX - 2} y={baseY - 22} w={4} h={2} color={hairRamp.dark} />
                        <Pixel x={centerX - 1} y={baseY - 21} w={2} h={1} color={hairRamp.mid} />
                        {/* Hair bun at back */}
                        <Pixel x={centerX - 1} y={baseY - 23} w={2} h={2} color={hairRamp.mid} />
                        <Pixel x={centerX} y={baseY - 23} w={1} h={1} color={hairRamp.light} />
                    </g>
                );
            case 'topknot':
                return (
                    <g className="hair-topknot">
                        <Pixel x={centerX - 2} y={baseY - 21} w={4} h={1} color={hairRamp.dark} />
                        <Pixel x={centerX - 1} y={baseY - 21} w={2} h={1} color={hairRamp.mid} />
                        {/* Top knot */}
                        <Pixel x={centerX} y={baseY - 24} w={1} h={2} color={hairRamp.mid} />
                        <Pixel x={centerX} y={baseY - 23} w={1} h={1} color={hairRamp.light} />
                    </g>
                );
            case 'braided':
            case 'long_braided':
                return (
                    <g className="hair-braided">
                        <Pixel x={centerX - 3} y={baseY - 22} w={6} h={2} color={hairRamp.dark} />
                        <Pixel x={centerX - 2} y={baseY - 21} w={4} h={1} color={hairRamp.mid} />
                        {/* Braided pattern indicators */}
                        <Pixel x={centerX - 2} y={baseY - 20} w={1} h={1} color={hairRamp.light} />
                        <Pixel x={centerX} y={baseY - 20} w={1} h={1} color={hairRamp.light} />
                        <Pixel x={centerX + 2} y={baseY - 20} w={1} h={1} color={hairRamp.light} />
                    </g>
                );
            case 'decorated':
                return (
                    <g className="hair-decorated">
                        <Pixel x={centerX - 3} y={baseY - 22} w={6} h={3} color={hairRamp.dark} />
                        <Pixel x={centerX - 2} y={baseY - 21} w={4} h={2} color={hairRamp.mid} />
                        <Pixel x={centerX - 1} y={baseY - 21} w={2} h={1} color={hairRamp.light} />
                        {/* Cultural decorations - feathers or shells */}
                        <Pixel x={centerX - 2} y={baseY - 23} w={1} h={1} color="#8B4513" />
                        <Pixel x={centerX + 2} y={baseY - 23} w={1} h={1} color="#FF4500" />
                    </g>
                );
            case 'long':
                return (
                    <g className="hair-long">
                        <Pixel x={centerX - 3} y={baseY - 22} w={6} h={4} color={hairRamp.dark} />
                        <Pixel x={centerX - 2} y={baseY - 21} w={4} h={3} color={hairRamp.mid} />
                        <Pixel x={centerX - 1} y={baseY - 21} w={2} h={2} color={hairRamp.light} />
                        {/* Long hair extends down */}
                        <Pixel x={centerX - 3} y={baseY - 18} w={1} h={2} color={hairRamp.dark} />
                        <Pixel x={centerX + 3} y={baseY - 18} w={1} h={2} color={hairRamp.dark} />
                    </g>
                );
            case 'short':
            default:
                return (
                    <g className="hair-short">
                        <Pixel x={centerX - 3} y={baseY - 22} w={6} h={3} color={hairRamp.dark} />
                        <Pixel x={centerX - 2} y={baseY - 21} w={4} h={2} color={hairRamp.mid} />
                        <Pixel x={centerX - 1} y={baseY - 21} w={2} h={1} color={hairRamp.light} />
                    </g>
                );
        }
    };

    // Render facial hair based on character appearance
    const renderFacialHair = () => {
        if (!appearance.facialHair || isFemale) return null;

        const facialHairStyle = appearance.facialHairStyle || 'stubble';
        const beardColor = isOld ? '#808080' : hairColor;
        const beardRamp = createColorRamp(beardColor);

        switch (facialHairStyle) {
            case 'stubble':
                return (
                    <g className="facial-hair-stubble">
                        <Pixel x={centerX - 1} y={baseY - 16} w={1} h={1} color={beardRamp.dark} opacity={0.6} />
                        <Pixel x={centerX + 1} y={baseY - 16} w={1} h={1} color={beardRamp.dark} opacity={0.6} />
                        <Pixel x={centerX} y={baseY - 15} w={1} h={1} color={beardRamp.dark} opacity={0.5} />
                        <Pixel x={centerX - 2} y={baseY - 15} w={1} h={1} color={beardRamp.dark} opacity={0.4} />
                        <Pixel x={centerX + 2} y={baseY - 15} w={1} h={1} color={beardRamp.dark} opacity={0.4} />
                    </g>
                );
            case 'mustache':
                return (
                    <g className="facial-hair-mustache">
                        <Pixel x={centerX - 2} y={baseY - 17} w={4} h={1} color={beardRamp.mid} />
                        <Pixel x={centerX - 1} y={baseY - 17} w={2} h={1} color={beardRamp.light} />
                    </g>
                );
            case 'goatee':
                return (
                    <g className="facial-hair-goatee">
                        {/* Mustache */}
                        <Pixel x={centerX - 2} y={baseY - 17} w={4} h={1} color={beardRamp.mid} />
                        {/* Chin beard */}
                        <Pixel x={centerX - 1} y={baseY - 15} w={2} h={2} color={beardRamp.mid} />
                        <Pixel x={centerX} y={baseY - 13} w={1} h={1} color={beardRamp.light} />
                    </g>
                );
            case 'full_beard':
                return (
                    <g className="facial-hair-full">
                        {/* Mustache */}
                        <Pixel x={centerX - 2} y={baseY - 17} w={4} h={1} color={beardRamp.mid} />
                        {/* Beard coverage */}
                        <Pixel x={centerX - 2} y={baseY - 16} w={4} h={3} color={beardRamp.dark} />
                        <Pixel x={centerX - 1} y={baseY - 15} w={2} h={2} color={beardRamp.mid} />
                        <Pixel x={centerX} y={baseY - 14} w={1} h={1} color={beardRamp.light} />
                    </g>
                );
            default:
                // Default stubble
                return (
                    <g className="facial-hair-default">
                        <Pixel x={centerX - 1} y={baseY - 16} w={2} h={1} color={beardRamp.dark} opacity={0.5} />
                    </g>
                );
        }
    };

    // Render helmet/headgear based on equipped item
    const renderHelmet = () => {
        if (!helmetItem) return null;

        const helmetName = helmetItem.name?.toLowerCase() || '';
        const helmetColors = {
            metal: helmetItem.culturalStyle === 'Roman' ? '#CD7F32' : // Bronze
                   helmetItem.culturalStyle === 'Medieval' ? '#4A4A4A' : // Steel
                   helmetItem.culturalStyle === 'Greek' ? '#CD7F32' : '#696969',
            accent: '#C0C0C0',
            dark: '#2F2F2F'
        };

        if (helmetName.includes('cap') || helmetName.includes('hat')) {
            // Simple cap/hat
            return (
                <g className="helmet-cap">
                    <Pixel x={centerX - 3} y={baseY - 23} w={6} h={2} color={clothingColor} />
                    <Pixel x={centerX - 2} y={baseY - 22} w={4} h={1} color={shadeColor(clothingColor, 20)} />
                </g>
            );
        } else if (helmetName.includes('helmet')) {
            // Metal helmet
            return (
                <g className="helmet-metal">
                    <Pixel x={centerX - 3} y={baseY - 23} w={6} h={3} color={helmetColors.metal} />
                    <Pixel x={centerX - 2} y={baseY - 22} w={4} h={2} color={helmetColors.accent} />
                    <Pixel x={centerX - 1} y={baseY - 21} w={2} h={1} color={helmetColors.dark} />
                    {/* Simple crest or plume */}
                    <Pixel x={centerX} y={baseY - 24} w={1} h={1} color="#FF0000" />
                </g>
            );
        } else if (helmetName.includes('crown')) {
            // Crown/royal headgear
            return (
                <g className="helmet-crown">
                    <Pixel x={centerX - 3} y={baseY - 22} w={6} h={1} color="#FFD700" />
                    <Pixel x={centerX - 2} y={baseY - 23} w={1} h={1} color="#FFD700" />
                    <Pixel x={centerX} y={baseY - 23} w={1} h={1} color="#FFD700" />
                    <Pixel x={centerX + 2} y={baseY - 23} w={1} h={1} color="#FFD700" />
                    {/* Gems */}
                    <Pixel x={centerX} y={baseY - 22} w={1} h={1} color="#0000FF" />
                </g>
            );
        } else {
            // Generic headwear
            return (
                <g className="helmet-generic">
                    <Pixel x={centerX - 2} y={baseY - 22} w={4} h={1} color={helmetColors.metal} />
                    <Pixel x={centerX - 1} y={baseY - 22} w={2} h={1} color={helmetColors.accent} />
                </g>
            );
        }
    };

    // Render simple jewelry indicators
    const renderJewelry = () => {
        const jewelry = [];

        // Check all equipment slots for jewelry items
        const allEquippedItems = [
            equippedItems?.accessory,
            equippedItems?.accessory_2,
            equippedItems?.jewelry,
            equippedItems?.trinket,
            ...(Array.isArray(equippedItems?.jewelry) ? equippedItems.jewelry : [])
        ].filter(Boolean);

        // Find earrings and necklaces/amulets
        const earringItem = allEquippedItems.find(item =>
            item?.name?.toLowerCase().includes('earring') ||
            item?.name?.toLowerCase().includes('ear ring'));

        const necklaceItem = allEquippedItems.find(item =>
            item?.name?.toLowerCase().includes('necklace') ||
            item?.name?.toLowerCase().includes('amulet') ||
            item?.name?.toLowerCase().includes('pendant') ||
            item?.name?.toLowerCase().includes('chain'));

        // Determine colors from items or materials
        const getJewelryColor = (item: any) => {
            if (item?.color) return item.color;
            const name = item?.name?.toLowerCase() || '';
            const material = item?.material?.toLowerCase() || '';

            // Check for specific materials/colors in name
            if (name.includes('turquoise') || material.includes('turquoise')) return '#40E0D0';
            if (name.includes('gold') || material.includes('gold')) return '#FFD700';
            if (name.includes('silver') || material.includes('silver')) return '#C0C0C0';
            if (name.includes('copper') || material.includes('copper')) return '#B87333';
            if (name.includes('jade') || material.includes('jade')) return '#00A86B';
            if (name.includes('ruby') || material.includes('ruby')) return '#E0115F';
            if (name.includes('sapphire') || material.includes('sapphire')) return '#0F52BA';
            if (name.includes('emerald') || material.includes('emerald')) return '#50C878';
            if (name.includes('pearl') || material.includes('pearl')) return '#F8F8FF';
            if (name.includes('bronze') || material.includes('bronze')) return '#CD7F32';

            return '#FFD700'; // Default to gold
        };

        if (earringItem) {
            const earringColor = getJewelryColor(earringItem);
            jewelry.push(
                <g key="earrings" className="jewelry-earrings">
                    <Pixel x={centerX - 3} y={baseY - 18} w={1} h={1} color={earringColor} />
                    <Pixel x={centerX + 3} y={baseY - 18} w={1} h={1} color={earringColor} />
                    {/* Small highlights */}
                    <Pixel x={centerX - 3} y={baseY - 18.5} w={0.5} h={0.5} color="#FFFFFF" opacity={0.7} />
                    <Pixel x={centerX + 3} y={baseY - 18.5} w={0.5} h={0.5} color="#FFFFFF" opacity={0.7} />
                </g>
            );
        }

        if (necklaceItem) {
            const necklaceColor = getJewelryColor(necklaceItem);
            jewelry.push(
                <g key="necklace" className="jewelry-necklace">
                    {/* Chain around neck */}
                    <Pixel x={centerX - 2} y={baseY - 15} w={0.5} h={0.5} color={necklaceColor} opacity={0.8} />
                    <Pixel x={centerX - 1} y={baseY - 15.5} w={0.5} h={0.5} color={necklaceColor} opacity={0.8} />
                    <Pixel x={centerX} y={baseY - 15.5} w={1} h={1} color={necklaceColor} />
                    <Pixel x={centerX + 1} y={baseY - 15.5} w={0.5} h={0.5} color={necklaceColor} opacity={0.8} />
                    <Pixel x={centerX + 2} y={baseY - 15} w={0.5} h={0.5} color={necklaceColor} opacity={0.8} />
                    {/* Central gem/pendant */}
                    <Pixel x={centerX} y={baseY - 14} w={0.8} h={0.8} color={necklaceColor} />
                    <Pixel x={centerX} y={baseY - 14.3} w={0.4} h={0.4} color="#FFFFFF" opacity={0.6} />
                </g>
            );
        }

        return jewelry.length > 0 ? <g className="jewelry-group">{jewelry}</g> : null;
    };

    // Render weapon based on equipped item
    const renderWeapon = () => {
        if (!mainHandItem) return null;

        const weaponColors = {
            blade: mainHandItem.culturalStyle === 'Damascus' ? '#C0C0C0' :
                   mainHandItem.culturalStyle === 'Japanese' ? '#E6E6FA' : '#C0C0C0',
            handle: '#8B4513', // Brown handle
            metal: '#FFD700'   // Gold fittings
        };

        switch (weaponType) {
            case 'sword':
                return (
                    <g className="weapon-sword">
                        <Pixel x={centerX + 4} y={baseY - 16} w={1} h={8} color={weaponColors.blade} />
                        <Pixel x={centerX + 4} y={baseY - 8} w={1} h={2} color={weaponColors.handle} />
                        <Pixel x={centerX + 3} y={baseY - 8} w={3} h={1} color={weaponColors.metal} />
                    </g>
                );
            case 'axe':
                return (
                    <g className="weapon-axe">
                        <Pixel x={centerX + 4} y={baseY - 12} w={1} h={6} color={weaponColors.handle} />
                        <Pixel x={centerX + 3} y={baseY - 15} w={3} h={2} color={weaponColors.blade} />
                        <Pixel x={centerX + 2} y={baseY - 14} w={2} h={1} color={weaponColors.metal} />
                    </g>
                );
            case 'spear':
                return (
                    <g className="weapon-spear">
                        <Pixel x={centerX + 4} y={baseY - 18} w={1} h={12} color={weaponColors.handle} />
                        <Pixel x={centerX + 4} y={baseY - 18} w={1} h={3} color={weaponColors.blade} />
                        <Pixel x={centerX + 3} y={baseY - 17} w={1} h={1} color={weaponColors.blade} />
                        <Pixel x={centerX + 5} y={baseY - 17} w={1} h={1} color={weaponColors.blade} />
                    </g>
                );
            case 'bow':
                return (
                    <g className="weapon-bow">
                        <Pixel x={centerX + 3} y={baseY - 16} w={1} h={8} color={weaponColors.handle} />
                        <Pixel x={centerX + 2} y={baseY - 15} w={1} h={6} color={weaponColors.handle} />
                        <Pixel x={centerX + 1} y={baseY - 13} w={1} h={2} color="#8B4513" />
                    </g>
                );
            case 'club':
                return (
                    <g className="weapon-club">
                        <Pixel x={centerX + 4} y={baseY - 12} w={1} h={6} color={weaponColors.handle} />
                        <Pixel x={centerX + 3} y={baseY - 15} w={3} h={3} color={weaponColors.handle} />
                    </g>
                );
            case 'dagger':
                return (
                    <g className="weapon-dagger">
                        <Pixel x={centerX + 4} y={baseY - 12} w={1} h={4} color={weaponColors.blade} />
                        <Pixel x={centerX + 4} y={baseY - 8} w={1} h={1} color={weaponColors.handle} />
                        <Pixel x={centerX + 3} y={baseY - 8} w={3} h={1} color={weaponColors.metal} />
                    </g>
                );
            case 'staff':
                return (
                    <g className="weapon-staff">
                        <Pixel x={centerX + 4} y={baseY - 20} w={1} h={14} color={weaponColors.handle} />
                        <Pixel x={centerX + 4} y={baseY - 20} w={1} h={1} color="#654321" /> {/* Top knob */}
                        <Pixel x={centerX + 4} y={baseY - 6} w={1} h={1} color="#654321" /> {/* Bottom cap */}
                    </g>
                );
            case 'tool-heavy':
                return (
                    <g className="weapon-tool-heavy">
                        <Pixel x={centerX + 4} y={baseY - 12} w={1} h={6} color={weaponColors.handle} />
                        <Pixel x={centerX + 3} y={baseY - 14} w={3} h={2} color="#696969" /> {/* Metal head */}
                        <Pixel x={centerX + 2} y={baseY - 13} w={1} h={1} color="#808080" /> {/* Highlight */}
                    </g>
                );
            case 'tool-light':
                return (
                    <g className="weapon-tool-light">
                        <Pixel x={centerX + 4} y={baseY - 10} w={0.5} h={4} color={weaponColors.handle} />
                        <Pixel x={centerX + 3.5} y={baseY - 10} w={1.5} h={1} color="#8B4513" /> {/* Whorl/weight */}
                        <Pixel x={centerX + 4} y={baseY - 11} w={0.5} h={1} color="#696969" /> {/* Needle/point */}
                    </g>
                );
            case 'flail':
                return (
                    <g className="weapon-flail">
                        <Pixel x={centerX + 4} y={baseY - 10} w={1} h={4} color={weaponColors.handle} />
                        <Pixel x={centerX + 3.5} y={baseY - 11} w={0.5} h={2} color="#696969" /> {/* Chain */}
                        <Pixel x={centerX + 3} y={baseY - 12} w={0.5} h={1} color="#696969" /> {/* Chain link */}
                        <Pixel x={centerX + 2} y={baseY - 13} w={2} h={2} color="#4B4B4B" /> {/* Spiked ball */}
                        <Pixel x={centerX + 1.5} y={baseY - 13.5} w={0.5} h={0.5} color="#C0C0C0" /> {/* Spike */}
                        <Pixel x={centerX + 3.5} y={baseY - 12.5} w={0.5} h={0.5} color="#C0C0C0" /> {/* Spike */}
                    </g>
                );
            case 'improvised':
                return (
                    <g className="weapon-improvised">
                        <Pixel x={centerX + 4} y={baseY - 11} w={1} h={5} color="#8B4513" />
                        <Pixel x={centerX + 3} y={baseY - 12} w={2} h={1} color="#8B4513" />
                        <Pixel x={centerX + 3.5} y={baseY - 11} w={1} h={0.5} color="#654321" /> {/* Variation */}
                    </g>
                );
            case 'fist':
                // No weapon to render
                return null;
            default:
                // Default sword for unknown weapons
                return (
                    <g className="weapon-default">
                        <Pixel x={centerX + 4} y={baseY - 16} w={1} h={8} color={weaponColors.blade} />
                        <Pixel x={centerX + 4} y={baseY - 8} w={1} h={2} color={weaponColors.handle} />
                        <Pixel x={centerX + 3} y={baseY - 8} w={3} h={1} color={weaponColors.metal} />
                    </g>
                );
        }
    };

    // Render armor based on equipped item
    const renderArmor = () => {
        if (!armorItem) return null;

        const armorColors = {
            metal: armorItem.culturalStyle === 'Roman' ? '#8B0000' :
                   armorItem.culturalStyle === 'Medieval' ? '#4A4A4A' :
                   armorItem.culturalStyle === 'Japanese' ? '#2F4F4F' : '#696969',
            accent: '#C0C0C0', // Silver accents
            dark: '#2F2F2F'    // Dark edges
        };

        const armorName = armorItem.name?.toLowerCase() || '';

        if (armorName.includes('chain') || armorName.includes('mail')) {
            // Chain mail - small overlapping pixels
            return (
                <g className="armor-chainmail">
                    <Pixel x={centerX - 2} y={baseY - 14} w={1} h={1} color={armorColors.metal} />
                    <Pixel x={centerX} y={baseY - 14} w={1} h={1} color={armorColors.metal} />
                    <Pixel x={centerX + 1} y={baseY - 14} w={1} h={1} color={armorColors.metal} />
                    <Pixel x={centerX - 1} y={baseY - 13} w={1} h={1} color={armorColors.accent} />
                    <Pixel x={centerX + 1} y={baseY - 12} w={1} h={1} color={armorColors.metal} />
                    <Pixel x={centerX - 2} y={baseY - 11} w={1} h={1} color={armorColors.accent} />
                </g>
            );
        } else if (armorName.includes('plate')) {
            // Plate armor - solid coverage
            return (
                <g className="armor-plate">
                    <Pixel x={centerX - 2} y={baseY - 15} w={4} h={1} color={armorColors.accent} />
                    <Pixel x={centerX - 2} y={baseY - 14} w={1} h={5} color={armorColors.dark} />
                    <Pixel x={centerX + 1} y={baseY - 14} w={1} h={5} color={armorColors.dark} />
                    <Pixel x={centerX - 1} y={baseY - 13} w={2} h={3} color={armorColors.metal} />
                    <Pixel x={centerX} y={baseY - 11} w={1} h={1} color={armorColors.accent} />
                </g>
            );
        } else if (armorName.includes('leather')) {
            // Leather armor - brown/tan coloring
            return (
                <g className="armor-leather">
                    <Pixel x={centerX - 2} y={baseY - 14} w={4} h={2} color="#8B4513" />
                    <Pixel x={centerX - 1} y={baseY - 13} w={2} h={1} color="#A0522D" />
                    <Pixel x={centerX} y={baseY - 12} w={1} h={1} color="#CD853F" />
                </g>
            );
        } else if (armorName.includes('robe') || armorName.includes('cloth')) {
            // Cloth/robe - flowing fabric effect
            return (
                <g className="armor-cloth">
                    <Pixel x={centerX - 2} y={baseY - 15} w={4} h={3} color={armorColors.metal} opacity={0.8} />
                    <Pixel x={centerX - 1} y={baseY - 12} w={2} h={2} color={armorColors.accent} opacity={0.6} />
                </g>
            );
        } else {
            // Generic armor overlay
            return (
                <g className="armor-generic">
                    <Pixel x={centerX - 1} y={baseY - 14} w={2} h={3} color={armorColors.metal} opacity={0.7} />
                    <Pixel x={centerX} y={baseY - 13} w={1} h={1} color={armorColors.accent} />
                </g>
            );
        }
    };

    // Render status effect overlays
    const renderStatusEffects = () => {
        if (!statusEffects || statusEffects.length === 0) return null;

        return statusEffects.map((effect, index) => {
            const effectKey = `${effect.type}-${index}`;

            switch (effect.type) {
                case 'poison':
                    return (
                        <g key={effectKey} className="status-poison">
                            <Pixel x={centerX - 1} y={baseY - 20} w={1} h={1} color="#00FF00" opacity={0.8} />
                            <Pixel x={centerX + 1} y={baseY - 18} w={1} h={1} color="#32CD32" opacity={0.6} />
                            <Pixel x={centerX} y={baseY - 22} w={1} h={1} color="#228B22" opacity={0.7} />
                        </g>
                    );
                case 'bleeding':
                    return (
                        <g key={effectKey} className="status-bleeding">
                            <Pixel x={centerX - 2} y={baseY - 16} w={1} h={1} color="#FF0000" opacity={0.9} />
                            <Pixel x={centerX + 2} y={baseY - 14} w={1} h={1} color="#DC143C" opacity={0.8} />
                            <Pixel x={centerX} y={baseY - 19} w={1} h={1} color="#B22222" opacity={0.7} />
                        </g>
                    );
                case 'on_fire':
                case 'burn':
                case 'burning':
                    // Check if this is a fresh burn (high duration) or smoldering (low duration)
                    const isInitialBurn = effect.duration && effect.duration >= 3;
                    return (
                        <g key={effectKey} className={isInitialBurn ? "status-fire-initial" : "status-fire-smolder"}>
                            {/* Flame base - larger and brighter for initial burn */}
                            <Pixel x={centerX - 2} y={baseY - 5} w={1.5} h={1} color="#FF0000" opacity={isInitialBurn ? 0.9 : 0.5} />
                            <Pixel x={centerX + 1} y={baseY - 5} w={1.5} h={1} color="#DC143C" opacity={isInitialBurn ? 0.8 : 0.4} />

                            {/* Mid flames - animated height */}
                            <Pixel x={centerX - 1} y={baseY - 8} w={1.2} h={2} color="#FF4500" opacity={isInitialBurn ? 0.9 : 0.6} />
                            <Pixel x={centerX + 1} y={baseY - 9} w={1.2} h={2} color="#FF6347" opacity={isInitialBurn ? 0.85 : 0.5} />
                            <Pixel x={centerX} y={baseY - 10} w={1} h={3} color="#FF8C00" opacity={isInitialBurn ? 0.8 : 0.5} />

                            {/* Flame tips - yellow/white hot spots */}
                            <Pixel x={centerX} y={baseY - 12} w={0.8} h={1.5} color="#FFD700" opacity={isInitialBurn ? 0.9 : 0.4} />
                            <Pixel x={centerX - 1} y={baseY - 11} w={0.6} h={1} color="#FFFF00" opacity={isInitialBurn ? 0.7 : 0.3} />
                            <Pixel x={centerX + 1} y={baseY - 11} w={0.6} h={1} color="#FFA500" opacity={isInitialBurn ? 0.8 : 0.4} />

                            {/* Extra flames for initial burn */}
                            {isInitialBurn && (
                                <>
                                    <Pixel x={centerX - 3} y={baseY - 7} w={0.8} h={1.5} color="#FF4500" opacity={0.6} />
                                    <Pixel x={centerX + 3} y={baseY - 6} w={0.8} h={1.5} color="#FF6347" opacity={0.6} />
                                    <Pixel x={centerX - 2} y={baseY - 13} w={0.5} h={0.8} color="#FFFF99" opacity={0.5} />
                                    <Pixel x={centerX + 2} y={baseY - 13} w={0.5} h={0.8} color="#FFFACD" opacity={0.5} />

                                    {/* Spark particles */}
                                    <Pixel x={centerX - 1.5} y={baseY - 14} w={0.3} h={0.3} color="#FFFFFF" opacity={0.9} />
                                    <Pixel x={centerX + 1.5} y={baseY - 15} w={0.3} h={0.3} color="#FFFFE0" opacity={0.8} />
                                    <Pixel x={centerX} y={baseY - 16} w={0.3} h={0.3} color="#FFFACD" opacity={0.7} />
                                </>
                            )}

                            {/* Smoke for smoldering effect */}
                            {!isInitialBurn && (
                                <>
                                    <Pixel x={centerX} y={baseY - 14} w={0.8} h={0.8} color="#696969" opacity={0.3} />
                                    <Pixel x={centerX - 1} y={baseY - 15} w={0.6} h={0.6} color="#808080" opacity={0.2} />
                                    <Pixel x={centerX + 1} y={baseY - 16} w={0.6} h={0.6} color="#A9A9A9" opacity={0.15} />
                                </>
                            )}
                        </g>
                    );
                case 'defending':
                    return (
                        <g key={effectKey} className="status-defending">
                            <Pixel x={centerX - 2} y={baseY - 17} w={1} h={1} color="#0000FF" opacity={0.7} />
                            <Pixel x={centerX + 2} y={baseY - 17} w={1} h={1} color="#4169E1" opacity={0.7} />
                            <Pixel x={centerX} y={baseY - 20} w={1} h={1} color="#6495ED" opacity={0.6} />
                        </g>
                    );
                case 'stunned':
                    return (
                        <g key={effectKey} className="status-stunned">
                            <Pixel x={centerX - 1} y={baseY - 24} w={1} h={1} color="#FFFF00" opacity={0.8} />
                            <Pixel x={centerX + 1} y={baseY - 22} w={1} h={1} color="#FFD700" opacity={0.7} />
                            <Pixel x={centerX} y={baseY - 25} w={1} h={1} color="#FFA500" opacity={0.6} />
                        </g>
                    );
                default:
                    return null;
            }
        });
    };

    // Render arms separately for animation
    const renderArms = () => {
        return (
            <>
                {/* Left arm (back arm) */}
                <g className="left-arm">
                    <Pixel x={centerX - 4} y={baseY - 14} w={2} h={5} color={clothingRamp.dark} />
                    <Pixel x={centerX - 4} y={baseY - 14} w={1} h={5} color={clothingRamp.mid} />
                    <Pixel x={centerX - 4} y={baseY - 9} w={2} h={1} color={skinRamp.mid} />
                </g>

                {/* Right arm (weapon arm) */}
                <g className="right-arm">
                    <Pixel x={centerX + 3} y={baseY - 14} w={2} h={5} color={clothingRamp.dark} />
                    <Pixel x={centerX + 3} y={baseY - 14} w={1} h={5} color={clothingRamp.light} />
                    <Pixel x={centerX + 3} y={baseY - 9} w={2} h={1} color={skinRamp.mid} />

                    {/* Dynamic weapon rendering */}
                    {mainHandItem && renderWeapon()}
                </g>
            </>
        );
    };

    // Create unique filter IDs to avoid conflicts
    const filterIdPrefix = `sprite-${facing}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Determine which glow effects to apply based on status effects
    const hasPoison = statusEffects?.some(e => e.type === 'poisoned');
    const hasBurn = statusEffects?.some(e => e.type === 'burning');
    const hasBleeding = statusEffects?.some(e => e.type === 'bleeding');
    const hasStunned = statusEffects?.some(e => e.type === 'stunned');

    // Select the active filter (prioritize enhancement > burn > poison > bleeding > stunned > player)
    let activeFilter = '';
    if (enhancement === 'elite') activeFilter = `url(#${filterIdPrefix}-elite)`;
    else if (enhancement === 'strong') activeFilter = `url(#${filterIdPrefix}-strong)`;
    else if (enhancement === 'enraged') activeFilter = `url(#${filterIdPrefix}-enraged)`;
    else if (hasBurn) activeFilter = `url(#${filterIdPrefix}-burn)`;
    else if (hasPoison) activeFilter = `url(#${filterIdPrefix}-poison)`;
    else if (hasBleeding) activeFilter = `url(#${filterIdPrefix}-bleed)`;
    else if (hasStunned) activeFilter = `url(#${filterIdPrefix}-stun)`;
    else if (isPlayer) activeFilter = `url(#${filterIdPrefix}-player)`;

    return (
        <svg viewBox="0 0 40 40" width="100%" height="100%"
             style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
             className={animation}>

            <defs>
                {/* Define SVG filters for glow effects that follow sprite shape */}
                {/* Enhancement glows for powerful enemies */}
                {enhancement === 'elite' && (
                    <filter id={`${filterIdPrefix}-elite`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blurredAlpha"/>
                        <feOffset dx="0" dy="0" result="offsetBlur"/>
                        <feFlood floodColor="#a855f7" floodOpacity="0.9"/>
                        <feComposite in2="blurredAlpha" operator="in" result="innerGlow"/>

                        <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="outerBlur"/>
                        <feFlood floodColor="#a855f7" floodOpacity="0.5"/>
                        <feComposite in2="outerBlur" operator="in" result="outerGlow"/>

                        <feMerge>
                            <feMergeNode in="outerGlow"/>
                            <feMergeNode in="innerGlow"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                )}
                {enhancement === 'strong' && (
                    <filter id={`${filterIdPrefix}-strong`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blurredAlpha"/>
                        <feOffset dx="0" dy="0" result="offsetBlur"/>
                        <feFlood floodColor="#f59e0b" floodOpacity="0.8"/>
                        <feComposite in2="blurredAlpha" operator="in" result="innerGlow"/>

                        <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="outerBlur"/>
                        <feFlood floodColor="#f59e0b" floodOpacity="0.4"/>
                        <feComposite in2="outerBlur" operator="in" result="outerGlow"/>

                        <feMerge>
                            <feMergeNode in="outerGlow"/>
                            <feMergeNode in="innerGlow"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                )}
                {enhancement === 'enraged' && (
                    <filter id={`${filterIdPrefix}-enraged`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blurredAlpha"/>
                        <feOffset dx="0" dy="0" result="offsetBlur"/>
                        <feFlood floodColor="#dc2626" floodOpacity="0.9"/>
                        <feComposite in2="blurredAlpha" operator="in" result="innerGlow"/>

                        <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="outerBlur"/>
                        <feFlood floodColor="#dc2626" floodOpacity="0.5"/>
                        <feComposite in2="outerBlur" operator="in" result="outerGlow"/>

                        <feMerge>
                            <feMergeNode in="outerGlow"/>
                            <feMergeNode in="innerGlow"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                )}

                {/* Subtle glow for player */}
                {isPlayer && (
                    <filter id={`${filterIdPrefix}-player`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blurredAlpha"/>
                        <feOffset dx="0" dy="0" result="offsetBlur"/>
                        <feFlood floodColor="#60a5fa" floodOpacity="0.4"/>
                        <feComposite in2="blurredAlpha" operator="in" result="glow"/>
                        <feMerge>
                            <feMergeNode in="glow"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                )}

                {hasPoison && (
                    <filter id={`${filterIdPrefix}-poison`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
                        <feOffset dx="0" dy="0" result="offsetblur"/>
                        <feFlood floodColor="#4ade80" floodOpacity="0.8"/>
                        <feComposite in2="offsetblur" operator="in"/>
                        <feMerge>
                            <feMergeNode/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                )}
                {hasBurn && (
                    <filter id={`${filterIdPrefix}-burn`} x="-50%" y="-50%" width="200%" height="200%">
                        {/* Enhanced multi-layer glow for burning effect */}
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blurredAlpha"/>
                        <feOffset dx="0" dy="-1" result="offsetBlur"/>

                        {/* Inner bright glow */}
                        <feFlood floodColor="#FFD700" floodOpacity="0.8"/>
                        <feComposite in2="blurredAlpha" operator="in" result="innerGlow"/>

                        {/* Outer red glow */}
                        <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="outerBlur"/>
                        <feFlood floodColor="#FF4500" floodOpacity="0.6"/>
                        <feComposite in2="outerBlur" operator="in" result="outerGlow"/>

                        {/* Combine all layers */}
                        <feMerge>
                            <feMergeNode in="outerGlow"/>
                            <feMergeNode in="innerGlow"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                )}
                {hasBleeding && (
                    <filter id={`${filterIdPrefix}-bleed`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
                        <feOffset dx="0" dy="0" result="offsetblur"/>
                        <feFlood floodColor="#dc2626" floodOpacity="0.7"/>
                        <feComposite in2="offsetblur" operator="in"/>
                        <feMerge>
                            <feMergeNode/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                )}
                {hasStunned && (
                    <filter id={`${filterIdPrefix}-stun`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
                        <feOffset dx="0" dy="0" result="offsetblur"/>
                        <feFlood floodColor="#fbbf24" floodOpacity="0.6"/>
                        <feComposite in2="offsetblur" operator="in"/>
                        <feMerge>
                            <feMergeNode/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                )}
            </defs>

            <g style={{
                transform: `scaleX(${facingRight ? 1 : -1})`,
                transformOrigin: `${centerX}px ${baseY}px`,
                filter: activeFilter
            }}>
                {renderBody()}
                {renderArms()}
            </g>

            {/* Status effects rendered on top, not flipped */}
            {renderStatusEffects()}

            <style>{`
                @keyframes pixel-idle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-1px); }
                }

                .idle {
                    animation: pixel-idle 3s ease-in-out infinite;
                    transform-origin: 20px 32px;
                }

                /* Weapon-specific attack animations */
                @keyframes sword-swing {
                    0% { transform: rotate(0deg); transform-origin: 23px 18px; }
                    30% { transform: rotate(-30deg) translateY(-2px); transform-origin: 23px 18px; }
                    50% { transform: rotate(45deg) translateY(1px); transform-origin: 23px 18px; }
                    100% { transform: rotate(0deg); transform-origin: 23px 18px; }
                }

                @keyframes axe-chop {
                    0% { transform: rotate(0deg); transform-origin: 23px 18px; }
                    25% { transform: rotate(-60deg) translateY(-4px); transform-origin: 23px 18px; }
                    50% { transform: rotate(90deg) translateY(3px); transform-origin: 23px 18px; }
                    100% { transform: rotate(0deg); transform-origin: 23px 18px; }
                }

                @keyframes spear-thrust {
                    0% { transform: translateX(0) rotate(0deg); transform-origin: 23px 18px; }
                    30% { transform: translateX(-8px) rotate(-10deg); transform-origin: 23px 18px; }
                    50% { transform: translateX(15px) rotate(10deg); transform-origin: 23px 18px; }
                    100% { transform: translateX(0) rotate(0deg); transform-origin: 23px 18px; }
                }

                @keyframes bow-draw {
                    0% { transform: rotate(0deg) scaleX(1); transform-origin: 23px 18px; }
                    40% { transform: rotate(-20deg) scaleX(0.8); transform-origin: 23px 18px; }
                    60% { transform: rotate(-15deg) scaleX(0.9); transform-origin: 23px 18px; }
                    100% { transform: rotate(0deg) scaleX(1); transform-origin: 23px 18px; }
                }

                @keyframes club-swing {
                    0% { transform: rotate(0deg); transform-origin: 23px 18px; }
                    25% { transform: rotate(-45deg) translateY(-3px); transform-origin: 23px 18px; }
                    50% { transform: rotate(60deg) translateY(2px); transform-origin: 23px 18px; }
                    100% { transform: rotate(0deg); transform-origin: 23px 18px; }
                }

                @keyframes dagger-stab {
                    0% { transform: rotate(0deg); transform-origin: 23px 18px; }
                    40% { transform: rotate(-20deg) translateY(-1px); transform-origin: 23px 18px; }
                    60% { transform: rotate(30deg) translateX(5px); transform-origin: 23px 18px; }
                    100% { transform: rotate(0deg); transform-origin: 23px 18px; }
                }

                @keyframes staff-swing {
                    0% { transform: rotate(0deg); transform-origin: 23px 18px; }
                    25% { transform: rotate(-45deg) translateY(-3px); transform-origin: 23px 18px; }
                    50% { transform: rotate(60deg) translateY(2px); transform-origin: 23px 18px; }
                    75% { transform: rotate(30deg); transform-origin: 23px 18px; }
                    100% { transform: rotate(0deg); transform-origin: 23px 18px; }
                }

                @keyframes tool-swing {
                    0% { transform: rotate(0deg); transform-origin: 23px 18px; }
                    30% { transform: rotate(-50deg) translateY(-2px); transform-origin: 23px 18px; }
                    60% { transform: rotate(20deg) translateY(3px); transform-origin: 23px 18px; }
                    100% { transform: rotate(0deg); transform-origin: 23px 18px; }
                }

                @keyframes flail-spin {
                    0% { transform: rotate(0deg); transform-origin: 23px 18px; }
                    25% { transform: rotate(-180deg); transform-origin: 23px 18px; }
                    50% { transform: rotate(-360deg); transform-origin: 23px 18px; }
                    75% { transform: rotate(-180deg); transform-origin: 23px 18px; }
                    100% { transform: rotate(0deg); transform-origin: 23px 18px; }
                }

                @keyframes improvised-bash {
                    0% { transform: rotate(0deg); transform-origin: 23px 18px; }
                    30% { transform: rotate(-25deg) translateY(-1px); transform-origin: 23px 18px; }
                    50% { transform: rotate(35deg) translateY(2px); transform-origin: 23px 18px; }
                    100% { transform: rotate(0deg); transform-origin: 23px 18px; }
                }

                @keyframes left-arm-balance {
                    0% { transform: rotate(0deg); transform-origin: 17px 18px; }
                    30% { transform: rotate(15deg); transform-origin: 17px 18px; }
                    50% { transform: rotate(-10deg); transform-origin: 17px 18px; }
                    100% { transform: rotate(0deg); transform-origin: 17px 18px; }
                }

                .attacking .right-arm {
                    animation: ${weaponType === 'sword' ? 'sword-swing' :
                                weaponType === 'axe' ? 'axe-chop' :
                                weaponType === 'spear' ? 'spear-thrust' :
                                weaponType === 'bow' ? 'bow-draw' :
                                weaponType === 'club' ? 'club-swing' :
                                weaponType === 'dagger' ? 'dagger-stab' :
                                weaponType === 'staff' ? 'staff-swing' :
                                weaponType === 'tool-heavy' ? 'tool-swing' :
                                weaponType === 'tool-light' ? 'dagger-stab' :
                                weaponType === 'flail' ? 'flail-spin' :
                                weaponType === 'improvised' ? 'improvised-bash' :
                                weaponType === 'fist' ? 'club-swing' :
                                'sword-swing'} 0.5s ease-out;
                }

                .attacking .left-arm {
                    animation: left-arm-balance 0.5s ease-out;
                }

                /* Subtle body lean during attack */
                @keyframes body-attack {
                    0% { transform: translateX(0); }
                    30% { transform: translateX(-1px) rotate(-1deg); }
                    50% { transform: translateX(1px) rotate(1deg); }
                    100% { transform: translateX(0); }
                }

                .attacking {
                    animation: body-attack 0.5s ease-out;
                    transform-origin: 20px 32px;
                }

                /* Burn attack - intense fire casting */
                .burn {
                    animation: burn-cast 0.8s ease-out;
                    transform-origin: 20px 32px;
                }

                @keyframes burn-cast {
                    0% { transform: scale(1) translateX(0); }
                    20% { transform: scale(1.1) translateX(-3px) translateY(-2px); }
                    40% { transform: scale(1.15) translateX(2px) translateY(-4px); }
                    60% { transform: scale(1.12) translateX(-1px) translateY(-3px); }
                    80% { transform: scale(1.05) translateX(1px) translateY(-1px); }
                    100% { transform: scale(1) translateX(0); }
                }

                /* Damage reaction - arms flail */
                @keyframes damage-flail {
                    0% { transform: rotate(0deg); }
                    25% { transform: rotate(-20deg) translateX(-2px); }
                    50% { transform: rotate(20deg) translateX(2px); }
                    75% { transform: rotate(-10deg); }
                    100% { transform: rotate(0deg); }
                }

                .damaged .right-arm,
                .damaged .left-arm {
                    animation: damage-flail 0.4s ease-out;
                    transform-origin: center;
                }

                .damaged {
                    animation: pixel-damage 0.4s ease-out;
                }

                @keyframes pixel-damage {
                    0% { transform: translateX(0); }
                    25% { transform: translateX(-2px); }
                    50% { transform: translateX(2px); }
                    75% { transform: translateX(-1px); }
                    100% { transform: translateX(0); }
                }

                /* Defending stance - arms up */
                @keyframes defend-arms {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(-15deg) translateY(-1px); }
                }

                .defending .right-arm,
                .defending .left-arm {
                    animation: defend-arms 0.3s ease-out forwards;
                    transform-origin: center top;
                }

                /* Status effect animations */
                @keyframes poison-drip {
                    0%, 100% { opacity: 0.8; transform: translateY(0); }
                    50% { opacity: 0.4; transform: translateY(2px); }
                }

                @keyframes blood-drop {
                    0%, 100% { opacity: 0.9; transform: translateY(0); }
                    50% { opacity: 0.5; transform: translateY(3px); }
                }

                /* Enhanced fire animations */
                @keyframes fire-flicker-intense {
                    0% {
                        opacity: 1;
                        transform: translateY(0) scale(1) skewX(0deg);
                    }
                    15% {
                        opacity: 0.9;
                        transform: translateY(-2px) scale(1.15) skewX(-3deg);
                    }
                    30% {
                        opacity: 0.95;
                        transform: translateY(-1px) scale(1.1) skewX(2deg);
                    }
                    45% {
                        opacity: 0.85;
                        transform: translateY(-3px) scale(1.2) skewX(-2deg);
                    }
                    60% {
                        opacity: 1;
                        transform: translateY(0) scale(1.05) skewX(1deg);
                    }
                    75% {
                        opacity: 0.9;
                        transform: translateY(-1px) scale(1.12) skewX(-1deg);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1) skewX(0deg);
                    }
                }

                @keyframes fire-smolder {
                    0%, 100% {
                        opacity: 0.6;
                        transform: translateY(0) scale(1);
                    }
                    50% {
                        opacity: 0.4;
                        transform: translateY(-1px) scale(1.05);
                    }
                }

                @keyframes shield-shimmer {
                    0%, 100% { opacity: 0.7; }
                    50% { opacity: 1.0; }
                }

                @keyframes stars-twinkle {
                    0%, 100% { opacity: 0.8; transform: rotate(0deg); }
                    50% { opacity: 0.4; transform: rotate(180deg); }
                }

                .status-poison { animation: poison-drip 2s ease-in-out infinite; }
                .status-bleeding { animation: blood-drop 1.5s ease-in-out infinite; }
                .status-fire-initial { animation: fire-flicker-intense 0.5s ease-in-out infinite; }
                .status-fire-smolder { animation: fire-smolder 2s ease-in-out infinite; }
                .status-defending { animation: shield-shimmer 2s ease-in-out infinite; }
                .status-stunned { animation: stars-twinkle 1s ease-in-out infinite; }

                /* Fleeing Animation - Run away and disappear */
                @keyframes flee-sequence {
                    0% {
                        transform: translateX(0) scale(1);
                        opacity: 1;
                    }
                    20% {
                        transform: translateX(${facingRight ? '40px' : '-40px'}) scale(0.95);
                        opacity: 1;
                    }
                    40% {
                        transform: translateX(${facingRight ? '80px' : '-80px'}) scale(0.9);
                        opacity: 0.8;
                    }
                    60% {
                        transform: translateX(${facingRight ? '120px' : '-120px'}) scale(0.85);
                        opacity: 0.6;
                    }
                    80% {
                        transform: translateX(${facingRight ? '160px' : '-160px'}) scale(0.8);
                        opacity: 0.3;
                    }
                    100% {
                        transform: translateX(${facingRight ? '200px' : '-200px'}) scale(0.7);
                        opacity: 0;
                    }
                }

                .fleeing {
                    animation: flee-sequence 2s ease-out forwards;
                    transform-origin: center bottom;
                }

                /* Running body animation during flee */
                @keyframes running-bob {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-2px); }
                }

                .fleeing .pixel {
                    animation: running-bob 0.3s ease-in-out infinite;
                }
            `}</style>
        </svg>
    );
};

export default CombatSpritePixel;