/**
 * CombatSprite - Enhanced procedurally generated, animated, side-profile combat sprite
 * with historically accurate clothing, weapons, equipment, and detailed combat animations
 * in polished pixel-art style with clear gender differentiation.
 */
import React, { useMemo } from 'react';
import { PlayerCharacter, NpcEntity, Appearance, Item } from '../../types';
import { getItemArchetypeMax } from '../../constants/items/baseSprites';

type Animation = 'idle' | 'attacking' | 'item' | 'damaged' | 'defending' | 'fleeing' | 'power_strike' | 'slashing' | 'chopping' | 'stabbing' | 'crushing' | 'shooting' | 'casting' | 'blocking' | 'dodging' | 'shouting';

interface CombatSpriteProps {
  character: PlayerCharacter | NpcEntity;
  animation: Animation;
  facing: 'left' | 'right';
}

// Enhanced color system with lighting and dithering
const shadeColor = (hex: string, percent: number): string => {
    if (!hex || typeof hex !== 'string' || hex.length < 4) return '#000000';
    try {
        let R = parseInt(hex.substring(1, 3), 16);
        let G = parseInt(hex.substring(3, 5), 16);
        let B = parseInt(hex.substring(5, 7), 16);

        R = Math.floor(R * (100 + percent) / 100);
        G = Math.floor(G * (100 + percent) / 100);
        B = Math.floor(B * (100 + percent) / 100);

        R = Math.max(0, Math.min(255, R));
        G = Math.max(0, Math.min(255, G));
        B = Math.max(0, Math.min(255, B));

        const RR = R.toString(16).padStart(2, '0');
        const GG = G.toString(16).padStart(2, '0');
        const BB = B.toString(16).padStart(2, '0');

        return "#" + RR + GG + BB;
    } catch (e) {
        return hex;
    }
};

// Enhanced pixel with dynamic lighting
const enhancePixelShading = (baseColor: string, position: { x: number, y: number }, lightSource = { x: -5, y: -5 }) => {
    const distance = Math.sqrt(Math.pow(position.x - lightSource.x, 2) + Math.pow(position.y - lightSource.y, 2));
    const shadeFactor = Math.max(0.7, Math.min(1.3, 1 - distance * 0.008));
    return shadeColor(baseColor, (shadeFactor - 1) * 25);
};

// Dithering pattern for gradients
const getDitheredColor = (baseColor: string, shadowColor: string, x: number, y: number, intensity: number = 0.5) => {
    const pattern = ((x + y) % 2) * intensity;
    return pattern > 0.3 ? shadowColor : baseColor;
};

// Enhanced Pixel component with lighting and outline
const Pixel: React.FC<{ 
    x: number; 
    y: number; 
    color: string; 
    w?: number; 
    h?: number;
    enhanced?: boolean;
    dithered?: boolean;
    shadowColor?: string;
    outline?: boolean;
}> = ({ x, y, color, w = 1, h = 1, enhanced = false, dithered = false, shadowColor, outline = false }) => {
    let finalColor = color;
    
    if (enhanced) {
        finalColor = enhancePixelShading(color, { x, y });
    }
    
    if (dithered && shadowColor) {
        finalColor = getDitheredColor(finalColor, shadowColor, x, y);
    }
    
    return (
        <g>
            {outline && (
                <rect 
                    x={x - 0.2} y={y - 0.2} 
                    width={w + 0.4} height={h + 0.4} 
                    fill="#1a1a1a" 
                    opacity="0.8"
                    shapeRendering="crispEdges" 
                />
            )}
            <rect x={x} y={y} width={w} height={h} fill={finalColor} shapeRendering="crispEdges" />
        </g>
    );
};

// Weapon trail effects
const renderWeaponTrail = (startPos: { x: number, y: number }, endPos: { x: number, y: number }, weaponType: string, material: string = '') => {
    const trailColors: Record<string, string> = {
        'blade': '#ffffff',
        'axe': '#fbbf24',
        'blunt': '#94a3b8',
        'polearm': '#e5e7eb',
        'fire': '#f97316',
        'magic': '#8b5cf6',
        'gold': '#fde047',
        'silver': '#f1f5f9'
    };
    
    const trailColor = material.toLowerCase().includes('gold') ? trailColors.gold :
                       material.toLowerCase().includes('silver') ? trailColors.silver :
                       trailColors[weaponType] || '#ffffff';
    
    const midX = (startPos.x + endPos.x) / 2;
    const midY = startPos.y - (weaponType === 'blade' ? 3 : 2);
    
    return (
        <g className="weapon-trail" opacity="0.6">
            <path 
                d={`M ${startPos.x},${startPos.y} Q ${midX},${midY} ${endPos.x},${endPos.y}`} 
                stroke={trailColor} 
                strokeWidth="0.8" 
                fill="none"
                filter="url(#trail-glow)"
            />
            <path 
                d={`M ${startPos.x},${startPos.y} Q ${midX},${midY} ${endPos.x},${endPos.y}`} 
                stroke="#ffffff" 
                strokeWidth="0.3" 
                fill="none"
            />
        </g>
    );
};

// Particle effect for impacts
const renderImpactParticles = (position: { x: number, y: number }, particleType: 'sparks' | 'blood' | 'dust' = 'sparks') => {
    const particleCount = particleType === 'blood' ? 3 : 5;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const distance = 2 + Math.random() * 2;
        const x = position.x + Math.cos(angle) * distance;
        const y = position.y + Math.sin(angle) * distance;
        
        const colors = {
            sparks: '#fbbf24',
            blood: '#dc2626',
            dust: '#a3a3a3'
        };
        
        particles.push(
            <circle
                key={i}
                cx={x}
                cy={y}
                r="0.5"
                fill={colors[particleType]}
                className="impact-particle"
            />
        );
    }
    
    return <g className="impact-particles">{particles}</g>;
};

// Weapon category mapping
const WEAPON_CATEGORIES: Record<string, string[]> = {
    'blade': ['SWORD', 'KATANA', 'SCIMITAR', 'RAPIER', 'CUTLASS', 'FALCHION'],
    'heavy_blade': ['BROADSWORD', 'CLAYMORE', 'ZWEIHANDER'],
    'axe': ['AXE', 'PICKAXE', 'STEEL_PICKAXE', 'BATTLE_AXE', 'HATCHET'],
    'polearm': ['SPEAR', 'FIRE_HARDENED_SPEAR', 'PIKE', 'HALBERD', 'LANCE'],
    'blunt': ['MACE', 'HAMMER', 'CLUB', 'MORNING_STAR', 'WAR_HAMMER'],
    'bow': ['BOW', 'COMPOSITE_BOW', 'CROSSBOW', 'LONGBOW'],
    'dagger': ['DAGGER', 'KNIFE', 'STILETTO', 'DIRK'],
    'staff': ['STAFF', 'QUARTERSTAFF', 'WALKING_STICK'],
    'tool': ['CHISEL', 'TONGS', 'SPINDLE', 'SICKLE', 'SCYTHE', 'PITCHFORK'],
    'improvised': ['STICK', 'STONE', 'BONE', 'WOODEN_BOWL']
};

// Armor category mapping
const ARMOR_CATEGORIES: Record<string, string[]> = {
    'heavy_armor': ['CHAINMAIL', 'BRIGANDINE', 'PLATE_ARMOR', 'SCALE_MAIL', 'LEATHER_APRON'],
    'medium_armor': ['GAMBESON', 'PADDED_ARMOR', 'STUDDED_LEATHER'],
    'light_armor': ['LEATHER_JERKIN', 'RING_MAIL'],
    'robes': ['SIMPLE_ROBE', 'SILK_ROBE', 'LINEN_ROBE', 'WIZARD_ROBE', 'MONK_ROBE'],
    'clothing': ['WOOL_TUNIC', 'CRAFTSMAN_TUNIC', 'WORK_SHIRT', 'SIMPLE_TUNIC'],
    'cultural': ['CITIZEN_TOGA', 'PONCHO', 'DESERT_CLOAK', 'KIMONO', 'KILT', 'PEPLOS'],
    'formal': ['FROCK_COAT', 'MERCHANT_GOWN', 'FINE_CLOTHES', 'DAY_DRESS']
};

// Enhanced Material colors with realistic tones
const MATERIAL_COLORS: Record<string, string> = {
    'Steel': '#b8c5d6',
    'Iron': '#6b7280',
    'Bronze': '#b45309',
    'Wood': '#92400e',
    'Bone': '#f3f4f6',
    'Gold': '#f59e0b',
    'Silver': '#d1d5db',
    'Leather': '#a16207',
    'Stone': '#525252',
    'Damascus': '#4b5563', // Pattern steel
    'Obsidian': '#1f2937', // Volcanic glass
    'Copper': '#ea580c',   // Reddish metal
    'Brass': '#d97706',    // Yellow metal alloy
    'Ivory': '#fefce8',    // Off-white organic
    'Jade': '#16a34a',     // Green stone
    'Lapis': '#1e40af'     // Blue stone
};

// Material highlight colors for metal gleam effects
const MATERIAL_HIGHLIGHTS: Record<string, string> = {
    'Steel': '#e2e8f0',
    'Iron': '#9ca3af',
    'Bronze': '#f59e0b',
    'Damascus': '#6b7280',
    'Gold': '#fbbf24',
    'Silver': '#f1f5f9',
    'Copper': '#fb7185',
    'Brass': '#fbbf24'
};

const getWeaponCategory = (itemId: string): string => {
    if (!itemId) return 'none';
    const upperItemId = itemId.toUpperCase();
    for (const [category, items] of Object.entries(WEAPON_CATEGORIES)) {
        if (items.includes(upperItemId)) return category;
    }
    // Check by name patterns
    const itemName = itemId.toLowerCase();
    if (itemName.includes('sword')) return 'blade';
    if (itemName.includes('axe')) return 'axe';
    if (itemName.includes('spear')) return 'polearm';
    if (itemName.includes('bow')) return 'bow';
    if (itemName.includes('knife') || itemName.includes('dagger')) return 'dagger';
    if (itemName.includes('mace') || itemName.includes('hammer')) return 'blunt';
    if (itemName.includes('staff')) return 'staff';
    return 'improvised';
};

const getArmorCategory = (itemId: string): string => {
    if (!itemId) return 'clothing';
    const upperItemId = itemId.toUpperCase();
    for (const [category, items] of Object.entries(ARMOR_CATEGORIES)) {
        if (items.includes(upperItemId)) return category;
    }
    // Check by name patterns
    const itemName = itemId.toLowerCase();
    if (itemName.includes('plate') || itemName.includes('chainmail') || itemName.includes('scale')) return 'heavy_armor';
    if (itemName.includes('leather') && itemName.includes('armor')) return 'light_armor';
    if (itemName.includes('gambeson') || itemName.includes('padded')) return 'medium_armor';
    if (itemName.includes('robe')) return 'robes';
    if (itemName.includes('toga') || itemName.includes('kimono') || itemName.includes('cloak')) return 'cultural';
    if (itemName.includes('gown') || itemName.includes('dress') || itemName.includes('coat')) return 'formal';
    return 'clothing'; // default
};

// Get armor overlay based on category
const getArmorOverlay = (armorItem: any) => {
    if (!armorItem?.name) return null;
    
    const category = getArmorCategory(armorItem.baseId || armorItem.name);
    const materialColor = MATERIAL_COLORS[armorItem.material] || '#8B4513';
    const isRare = armorItem.rarity === 'Rare' || armorItem.rarity === 'Epic' || armorItem.rarity === 'Legendary';
    
    const overlayProps = {
        opacity: 0.6,
        fill: materialColor
    };
    
    switch (category) {
        case 'heavy_armor':
            return (
                <g className="armor-overlay armor-heavy">
                    {/* Chain mail rings pattern */}
                    {category.includes('CHAINMAIL') ? (
                        <g>
                            {[0, 1, 2, 3].map(row => (
                                <g key={row}>
                                    {[0, 1, 2].map(col => (
                                        <circle
                                            key={col}
                                            cx={20 - 2 + col * 1.5 + (row % 2) * 0.75}
                                            cy={16 + row * 1.5}
                                            r="0.6"
                                            fill="none"
                                            stroke={materialColor}
                                            strokeWidth="0.3"
                                            opacity="0.8"
                                        />
                                    ))}
                                </g>
                            ))}
                        </g>
                    ) : (
                        /* Plate armor segments */
                        <g>
                            <rect x="16" y="15" width="8" height="8" {...overlayProps} />
                            <rect x="17" y="16" width="6" height="6" fill={MATERIAL_COLORS['Steel']} opacity="0.4" />
                            <circle cx="18" cy="16" r="1" fill={materialColor} opacity="0.9" />
                            <circle cx="22" cy="16" r="1" fill={materialColor} opacity="0.9" />
                        </g>
                    )}
                    {isRare && (
                        <ellipse cx="20" cy="19" rx="5" ry="4" fill="#ffd700" opacity="0.2" />
                    )}
                </g>
            );
            
        case 'medium_armor':
            return (
                <g className="armor-overlay armor-medium">
                    {/* Padded/quilted pattern */}
                    <rect x="17" y="16" width="6" height="6" {...overlayProps} />
                    {[0, 1, 2].map(row => (
                        <line
                            key={row}
                            x1="17" y1={17 + row * 2}
                            x2="23" y2={17 + row * 2}
                            stroke={MATERIAL_COLORS['Iron']}
                            strokeWidth="0.5"
                            opacity="0.6"
                        />
                    ))}
                    {isRare && (
                        <ellipse cx="20" cy="19" rx="4" ry="3" fill="#22c55e" opacity="0.2" />
                    )}
                </g>
            );
            
        case 'light_armor':
            return (
                <g className="armor-overlay armor-light">
                    {/* Leather vest with studs */}
                    <rect x="18" y="16" width="4" height="6" {...overlayProps} />
                    <circle cx="19" cy="17" r="0.3" fill={MATERIAL_COLORS['Iron']} />
                    <circle cx="21" cy="17" r="0.3" fill={MATERIAL_COLORS['Iron']} />
                    <circle cx="19" cy="20" r="0.3" fill={MATERIAL_COLORS['Iron']} />
                    <circle cx="21" cy="20" r="0.3" fill={MATERIAL_COLORS['Iron']} />
                    {isRare && (
                        <ellipse cx="20" cy="19" rx="3" ry="3" fill="#a855f7" opacity="0.2" />
                    )}
                </g>
            );
            
        case 'robes':
            return (
                <g className="armor-overlay armor-robes">
                    {/* Flowing robe silhouette */}
                    <ellipse cx="20" cy="21" rx="6" ry="8" {...overlayProps} opacity="0.4" />
                    {armorItem.name.toLowerCase().includes('wizard') && (
                        <g>
                            <circle cx="20" cy="17" r="1" fill="#9333ea" opacity="0.6" />
                            <path d="M 18,17 L 20,15 L 22,17" stroke="#9333ea" strokeWidth="0.5" fill="none" />
                        </g>
                    )}
                    {isRare && (
                        <ellipse cx="20" cy="21" rx="7" ry="9" fill="#4f46e5" opacity="0.15" />
                    )}
                </g>
            );
            
        default:
            return null;
    }
};

// Color ramp generator for pixel art shading
const createColorRamp = (baseColor: string) => ({
    light: shadeColor(baseColor, 20),
    mid: baseColor,
    dark: shadeColor(baseColor, -20),
    outline: shadeColor(baseColor, -40)
});

const CombatSprite: React.FC<CombatSpriteProps> = ({ character, animation, facing }) => {
    const { gender, age, appearance, equippedItems } = character;
    const {
        skinColor, hairColor, eyeColor, build, facialHair, facialHairStyle, garment, jewelry, headgear, hairLength
    } = appearance as Appearance;
    const { primary: clothingColor, secondary: secondaryColor } = appearance.palette;

    const mainHandItem = equippedItems?.main_hand;
    const offHandItem = equippedItems?.off_hand;
    const armorItem = equippedItems?.armor || equippedItems?.chest || equippedItems?.torso;

    // Determine weapon-specific attack animation
    const getAttackAnimation = () => {
        if (animation !== 'attacking') return '';
        
        const weaponName = mainHandItem?.name.toLowerCase() || '';
        
        // Thrusting weapons
        if (weaponName.includes('spear') || weaponName.includes('rapier')) {
            return 'animate-sprite-thrust';
        }
        // Slashing weapons
        if (weaponName.includes('katana') || weaponName.includes('scimitar') || weaponName.includes('sword')) {
            return 'animate-sprite-slash';
        }
        // Overhead weapons
        if (weaponName.includes('axe') || weaponName.includes('mace') || weaponName.includes('hammer')) {
            return 'animate-sprite-overhead';
        }
        // Stabbing weapons
        if (weaponName.includes('dagger') || weaponName.includes('knife')) {
            return 'animate-sprite-stab';
        }
        // Swinging weapons
        if (weaponName.includes('flail') || weaponName.includes('whip')) {
            return 'animate-sprite-swing';
        }
        // Staff weapons
        if (weaponName.includes('staff')) {
            return 'animate-sprite-sweep';
        }
        // Default attack
        return 'animate-sprite-attack-forward';
    };

    const animationClasses: Record<Animation, string> = {
        idle: 'animate-sprite-idle-bob',
        attacking: getAttackAnimation(),
        damaged: 'animate-damaged-recoil',
        item: 'animate-item-use-hop',
        defending: 'animate-defend-stance',
        fleeing: 'animate-flee-anim',
        power_strike: 'animate-sprite-power-strike',
        slashing: 'animate-sprite-slash',
        chopping: 'animate-sprite-chop',
        stabbing: 'animate-sprite-stab',
        crushing: 'animate-sprite-crush',
        shooting: 'animate-sprite-shoot',
        casting: 'animate-sprite-cast',
        blocking: 'animate-sprite-block',
        dodging: 'animate-sprite-dodge',
        shouting: 'animate-sprite-shout'
    };
    const animationClass = animationClasses[animation] || 'animate-sprite-idle-bob';

    const isFemale = gender === 'Female';
    const isOld = age && age > 55;
    const finalHairColor = isOld ? '#a0a0a0' : hairColor;

    // Determine facing direction
    const facingRight = facing === 'right';

    // Create color ramps for pixel art shading
    const skinRamp = createColorRamp(skinColor);
    const hairRamp = createColorRamp(isOld ? '#808080' : hairColor);
    const clothingRamp = createColorRamp(clothingColor);
    const pantsRamp = createColorRamp(secondaryColor || clothingColor);

    // Pixel-perfect sprite dimensions (integers only)
    const spriteHeight = 24; // Total sprite height in pixels
    const headSize = 5;       // 5x5 pixel head
    const torsoWidth = isFemale ? 5 : 6;
    const torsoHeight = 7;
    const armWidth = 2;
    const legWidth = 2;
    const legHeight = 8;

    // Calculate sprite center position
    const centerX = 20; // Center of 40px viewBox
    const baseY = 32;   // Ground level

    // Render pixel art head
    const renderPixelHead = () => {
        const headX = centerX - 2;
        const headY = baseY - spriteHeight + 2;

        return (
            <>
                {/* Head outline */}
                <Pixel x={headX - 1} y={headY - 1} w={headSize + 2} h={headSize + 2} color={skinRamp.outline} />

                {/* Head base */}
                <Pixel x={headX} y={headY} w={headSize} h={headSize} color={skinRamp.dark} />
                <Pixel x={headX} y={headY} w={headSize - 1} h={headSize - 1} color={skinRamp.mid} />
                <Pixel x={headX + 1} y={headY + 1} w={headSize - 2} h={headSize - 3} color={skinRamp.light} />

                {/* Face features - minimal but effective */}
                {/* Eyes */}
                <Pixel x={headX + 1} y={headY + 2} w={1} h={1} color="#ffffff" />
                <Pixel x={headX + 3} y={headY + 2} w={1} h={1} color="#ffffff" />
                <Pixel x={headX + 1.3} y={headY + 2.2} w={0.4} h={0.4} color={eyeColor} />
                <Pixel x={headX + 3.3} y={headY + 2.2} w={0.4} h={0.4} color={eyeColor} />

                {/* Mouth */}
                <Pixel x={headX + 2} y={headY + 3.5} w={1} h={0.5} color={shadeColor(skinRamp.mid, -10)} />
            </>
        );
    };

    // Render pixel art hair
    const renderPixelHair = () => {
        const headX = centerX - 2;
        const headY = baseY - spriteHeight + 2;

        return (
            <>
                {/* Hair base layer */}
                <Pixel x={headX - 1} y={headY - 2} w={headSize + 2} h={3} color={hairRamp.dark} />
                <Pixel x={headX} y={headY - 1} w={headSize} h={2} color={hairRamp.mid} />
                <Pixel x={headX + 1} y={headY - 1} w={3} h={1} color={hairRamp.light} />

                {/* Side hair for longer styles */}
                {isFemale && (hairLength === 'long' || hairLength === 'very_long') && (
                    <>
                        <Pixel x={headX - 1} y={headY + 2} w={1} h={4} color={hairRamp.dark} />
                        <Pixel x={headX + headSize} y={headY + 2} w={1} h={4} color={hairRamp.dark} />
                    </>
                )}
            </>
        );
    };

    // Render pixel art body
    const renderPixelBody = () => {
        const bodyX = centerX - Math.floor(torsoWidth / 2);
        const bodyY = baseY - spriteHeight + headSize + 3;

        return (
            <>
                {/* Torso outline */}
                <Pixel x={bodyX - 1} y={bodyY - 1} w={torsoWidth + 2} h={torsoHeight + 2} color={clothingRamp.outline} />

                {/* Torso base */}
                <Pixel x={bodyX} y={bodyY} w={torsoWidth} h={torsoHeight} color={clothingRamp.dark} />
                <Pixel x={bodyX} y={bodyY} w={torsoWidth - 1} h={torsoHeight} color={clothingRamp.mid} />
                <Pixel x={bodyX + 1} y={bodyY + 1} w={torsoWidth - 2} h={torsoHeight - 2} color={clothingRamp.light} />

                {/* Gender-specific chest shading */}
                {isFemale && (
                    <>
                        <Pixel x={bodyX + 1} y={bodyY + 2} w={1} h={1} color={clothingRamp.dark} opacity={0.3} />
                        <Pixel x={bodyX + torsoWidth - 2} y={bodyY + 2} w={1} h={1} color={clothingRamp.dark} opacity={0.3} />
                    </>
                )}
            </>
        );
    };

    // Render pixel art legs
    const renderPixelLegs = () => {
        const leftLegX = centerX - 2;
        const rightLegX = centerX + 1;
        const legY = baseY - legHeight;

        return (
            <>
                {/* Left leg */}
                <Pixel x={leftLegX} y={legY} w={legWidth} h={legHeight} color={pantsRamp.dark} />
                <Pixel x={leftLegX} y={legY} w={legWidth - 1} h={legHeight} color={pantsRamp.mid} />

                {/* Right leg */}
                <Pixel x={rightLegX} y={legY} w={legWidth} h={legHeight} color={pantsRamp.dark} />
                <Pixel x={rightLegX + 1} y={legY} w={legWidth - 1} h={legHeight} color={pantsRamp.light} />

                {/* Feet */}
                <Pixel x={leftLegX - 1} y={baseY - 1} w={legWidth + 1} h={1} color="#3d2314" />
                <Pixel x={rightLegX} y={baseY - 1} w={legWidth + 1} h={1} color="#3d2314" />
            </>
        );
    };

    // Render pixel art arms
    const renderPixelArms = () => {
        const leftArmX = centerX - Math.floor(torsoWidth / 2) - armWidth;
        const rightArmX = centerX + Math.floor(torsoWidth / 2);
        const armY = baseY - spriteHeight + headSize + 4;
        const armHeight = 6;

        return (
            <>
                {/* Left arm */}
                <Pixel x={leftArmX} y={armY} w={armWidth} h={armHeight} color={clothingRamp.dark} />
                <Pixel x={leftArmX} y={armY} w={armWidth - 1} h={armHeight} color={clothingRamp.mid} />

                {/* Right arm (weapon arm) */}
                <Pixel x={rightArmX} y={armY} w={armWidth} h={armHeight} color={clothingRamp.dark} />
                <Pixel x={rightArmX + 1} y={armY} w={armWidth - 1} h={armHeight} color={clothingRamp.light} />

                {/* Hands */}
                <Pixel x={leftArmX} y={armY + armHeight} w={armWidth} h={1} color={skinRamp.mid} />
                <Pixel x={rightArmX} y={armY + armHeight} w={armWidth} h={1} color={skinRamp.mid} />
            </>
        );
    };
    
    // Ultra-detailed arm rendering with anatomy and physics
    const renderArmJointed = (x: number, y: number, width: number, height: number, color: string, isWeaponArm: boolean = false) => {
        const shoulderWidth = width * 1.3;
        const upperArmLength = height * 0.45;
        const forearmLength = height * 0.4;
        const handLength = height * 0.15;
        const elbowY = y + upperArmLength;
        const wristY = elbowY + forearmLength;
        const bicepWidth = width * 1.1;
        const forearmWidth = width * 0.9;

        return (
            <g className="arm-assembly">
                {/* Dynamic shadow that follows arm movement */}
                <g className="arm-shadow" opacity="0.2">
                    <ellipse cx={x + width/2} cy={y + height/2} rx={width * 1.5} ry={height/2}
                             fill="#000000" filter="blur(2px)" />
                </g>

                {/* Upper arm segment with muscle definition */}
                <g className="upper-arm-segment" style={{ transformOrigin: `${x + shoulderWidth/2}px ${y}px` }}>
                    {/* Shoulder muscle */}
                    <ellipse cx={x + shoulderWidth/2} cy={y + 1} rx={shoulderWidth/2} ry={2}
                             fill={shadeColor(color, 20)} opacity="0.6" />

                    {/* Upper arm base */}
                    <Pixel x={x} y={y} w={shoulderWidth} h={upperArmLength} color={color} enhanced />

                    {/* Bicep definition */}
                    <ellipse cx={x + shoulderWidth/2} cy={y + upperArmLength * 0.3}
                             rx={bicepWidth/2} ry={upperArmLength * 0.15}
                             fill={shadeColor(color, 15)} opacity="0.4" />

                    {/* Deltoid highlight */}
                    <Pixel x={x + shoulderWidth * 0.3} y={y + 1} w={shoulderWidth * 0.4} h={1}
                           color={shadeColor(color, 25)} />

                    {/* Forearm segment with anatomical detail */}
                    <g className="forearm-segment" style={{ transformOrigin: `${x + width/2}px ${elbowY}px` }}>
                        {/* Elbow joint with realistic bend */}
                        <ellipse cx={x + width/2} cy={elbowY} rx={width * 0.5} ry={1.5}
                                 fill={shadeColor(color, -15)} />
                        <Pixel x={x + width * 0.2} y={elbowY - 1} w={width * 0.6} h={2}
                               color={shadeColor(skinColor, -10)} />

                        {/* Forearm with taper */}
                        <polygon points={`${x + width * 0.15},${elbowY} ${x + forearmWidth},${elbowY} ${x + forearmWidth * 0.9},${wristY} ${x + width * 0.25},${wristY}`}
                                 fill={color} />

                        {/* Forearm muscle definition */}
                        <ellipse cx={x + width/2} cy={elbowY + forearmLength * 0.3}
                                 rx={forearmWidth * 0.4} ry={forearmLength * 0.12}
                                 fill={shadeColor(color, 10)} opacity="0.3" />

                        {/* Hand with finger detail */}
                        <g className="hand-segment" style={{ transformOrigin: `${x + width/2}px ${wristY}px` }}>
                            {/* Wrist */}
                            <Pixel x={x + width * 0.25} y={wristY - 1} w={width * 0.5} h={1}
                                   color={shadeColor(skinColor, -5)} />

                            {/* Palm */}
                            <Pixel x={x + width * 0.2} y={wristY} w={width * 0.6} h={handLength * 0.6}
                                   color={skinColor} />

                            {/* Fingers (simplified but visible) */}
                            <Pixel x={x + width * 0.15} y={wristY + handLength * 0.5} w={width * 0.15} h={handLength * 0.5}
                                   color={skinColor} />
                            <Pixel x={x + width * 0.35} y={wristY + handLength * 0.5} w={width * 0.15} h={handLength * 0.5}
                                   color={skinColor} />
                            <Pixel x={x + width * 0.55} y={wristY + handLength * 0.5} w={width * 0.15} h={handLength * 0.5}
                                   color={skinColor} />

                            {/* Knuckles */}
                            <Pixel x={x + width * 0.2} y={wristY + handLength * 0.4} w={width * 0.6} h={0.5}
                                   color={shadeColor(skinColor, -8)} />
                        </g>
                    </g>
                </g>
            </g>
        );
    };

    // Keep old renderArm for back arm which doesn't need complex animation
    const renderArm = (x: number, y: number, width: number, height: number, color: string, isWeaponArm: boolean = false) => {
        const shoulderWidth = width * 1.2;
        const elbowY = y + height * 0.5;
        const wristY = y + height * 0.85;

        return (
            <g>
                <Pixel x={x} y={y} w={shoulderWidth} h={height * 0.5} color={color} enhanced />
                <Pixel x={x + shoulderWidth * 0.2} y={y} w={shoulderWidth * 0.6} h={2} color={shadeColor(color, 15)} />
                <Pixel x={x + width * 0.1} y={elbowY} w={width * 0.8} h={2} color={shadeColor(color, -10)} />
                <Pixel x={x + width * 0.1} y={elbowY} w={width * 0.8} h={height * 0.35} color={color} enhanced />
                <Pixel x={x + width * 0.2} y={wristY} w={width * 0.6} h={height * 0.15} color={skinColor} />
            </g>
        );
    };
    
    const renderLeg = (x: number, y: number, width: number, height: number, primaryColor: string, bootColor: string) => {
        const kneeY = y + height * 0.45;
        const ankleY = y + height * 0.85;
        
        return (
            <g>
                {/* Thigh */}
                <Pixel x={x} y={y} w={width} h={height * 0.45} color={primaryColor} enhanced />
                <Pixel x={x + width * 0.1} y={y} w={width * 0.8} h={2} color={shadeColor(primaryColor, 10)} />
                
                {/* Knee */}
                <Pixel x={x + width * 0.1} y={kneeY - 1} w={width * 0.8} h={3} color={shadeColor(primaryColor, -15)} />
                
                {/* Shin */}
                <Pixel x={x + width * 0.1} y={kneeY + 2} w={width * 0.8} h={height * 0.4} color={primaryColor} enhanced />
                
                {/* Boot/Foot */}
                <Pixel x={x - width * 0.1} y={ankleY} w={width * 1.2} h={height * 0.15} color={bootColor} />
                <Pixel x={x - width * 0.2} y={ankleY + height * 0.12} w={width * 1.4} h={height * 0.08} color={shadeColor(bootColor, -20)} />
            </g>
        );
    };

    const renderWeapon = (item: Item) => {
        // Add weapon motion trail for attacks
        const showTrail = animation === 'attacking' || animation === 'slashing' || animation === 'chopping';

        const name = item.name.toLowerCase();
        const archetype = getItemArchetypeMax(item.baseId || name);
        const category = getWeaponCategory(item.baseId || name);
        const material = item.material || 'Iron';
        const color = MATERIAL_COLORS[material] || '#808080';
        const isRare = item.rarity === 'Rare' || item.rarity === 'Epic' || item.rarity === 'Legendary';
        
        // Enhanced material variations with highlights
        const getMaterialVariation = (baseColor: string, material: string) => {
            const variations: Record<string, { primary: string; secondary: string; accent: string; highlight: string }> = {
                'Steel': { primary: '#b8c5d6', secondary: '#e2e8f0', accent: '#f8fafc', highlight: '#ffffff' },
                'Iron': { primary: '#6b7280', secondary: '#9ca3af', accent: '#d1d5db', highlight: '#e5e7eb' },
                'Bronze': { primary: '#b45309', secondary: '#d97706', accent: '#f59e0b', highlight: '#fbbf24' },
                'Gold': { primary: '#f59e0b', secondary: '#fbbf24', accent: '#fde047', highlight: '#fef3c7' },
                'Silver': { primary: '#d1d5db', secondary: '#e5e7eb', accent: '#f3f4f6', highlight: '#ffffff' },
                'Bone': { primary: '#f3f4f6', secondary: '#fef7cd', accent: '#fffbeb', highlight: '#ffffff' },
                'Stone': { primary: '#525252', secondary: '#737373', accent: '#a3a3a3', highlight: '#d4d4d4' },
                'Wood': { primary: '#92400e', secondary: '#a16207', accent: '#ca8a04', highlight: '#eab308' },
                'Damascus': { primary: '#4b5563', secondary: '#6b7280', accent: '#9ca3af', highlight: '#e5e7eb' },
                'Obsidian': { primary: '#1f2937', secondary: '#374151', accent: '#4b5563', highlight: '#6b7280' }
            };
            
            return variations[material] || { 
                primary: baseColor, 
                secondary: shadeColor(baseColor, 20), 
                accent: shadeColor(baseColor, 40),
                highlight: shadeColor(baseColor, 60)
            };
        };
        
        const materialColors = getMaterialVariation(color, material);
        
        // Enhanced weapon gleam effect for attack animations
        const showGleam = animation === 'attacking' || animation === 'slashing' || animation === 'chopping' || 
                         animation === 'stabbing' || animation === 'crushing' || animation === 'power_strike';
        const gleamOpacity = showGleam ? 0.8 : 0;
        
        // Category-based weapon rendering with material colors
        // Blade weapons (swords, katanas, scimitars)
        if (category === 'blade') {
            const bladeLength = name.includes('katana') ? 15 : (name.includes('scimitar') ? 13 : 12);
            const isCurved = name.includes('scimitar') || name.includes('cutlass');
            return (
                <g>
                    {isCurved ? (
                        <>
                            <path d="M 10,7 Q 11,-4 13,-8" fill="none" stroke={color} strokeWidth="1"/>
                            <path d="M 10.5,7 Q 11.5,-4 13.5,-8" fill="none" stroke={shadeColor(color, 20)} strokeWidth="0.5"/>
                        </>
                    ) : (
                        <>
                            <Pixel x={10} y={-8} w={1} h={bladeLength} color={materialColors.primary} enhanced />
                            <Pixel x={11} y={-8} w={0.5} h={bladeLength-3} color={materialColors.secondary} />
                            <Pixel x={10.5} y={-8 + bladeLength/2} w={0.3} h={bladeLength/4} color={materialColors.accent} />
                            {/* Metal highlight line */}
                            <Pixel x={10.8} y={-7} w={0.2} h={bladeLength-2} color={materialColors.highlight} />
                            {/* Gleam effect during attack */}
                            {showGleam && (
                                <g opacity={gleamOpacity}>
                                    <line x1="10.5" y1={-8} x2="10.5" y2={-8 + bladeLength} 
                                          stroke={materialColors.highlight} strokeWidth="0.3" />
                                    <circle cx="10.5" cy={-8 + bladeLength/3} r="0.5" 
                                            fill={materialColors.highlight} opacity="0.8" />
                                </g>
                            )}
                        </>
                    )}
                    <Pixel x={8} y={7} w={5} h={1} color={shadeColor(color, -40)} enhanced /> {/* Guard */}
                    <Pixel x={9} y={8} w={3} h={3} color="#654321" dithered shadowColor="#432818" /> {/* Handle */}
                    <Pixel x={10} y={-9} w={1} h={1} color={materialColors.highlight} /> {/* Tip */}
                    {isRare && (
                        <g>
                            <ellipse cx="10.5" cy="0" rx="8" ry="4" fill="#ffd700" opacity="0.2"/>
                            <ellipse cx="10.5" cy="0" rx="6" ry="3" fill="#fff" opacity="0.1"/>
                            <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2s" repeatCount="indefinite" />
                        </g>
                    )}
                </g>
            );
        }
        
        // Axe weapons
        if (category === 'axe') {
            const headSize = name.includes('battle') ? 6 : 4;
            return (
                <g>
                    <Pixel x={10} y={-6} w={1.5} h={11} color="#8b4513" /> {/* Handle */}
                    <Pixel x={8} y={-8} w={headSize} h={4} color={color} /> {/* Blade */}
                    <Pixel x={7} y={-7} w={1} h={2} color={shadeColor(color, 20)} /> {/* Edge */}
                    {isRare && (
                        <g>
                            <ellipse cx="10" cy="-6" rx="6" ry="3" fill="#ff6b6b" opacity="0.25"/>
                            <ellipse cx="10" cy="-6" rx="4" ry="2" fill="#ffaaaa" opacity="0.15"/>
                            <animate attributeName="opacity" values="0.25;0.45;0.25" dur="2.5s" repeatCount="indefinite" />
                        </g>
                    )}
                </g>
            );
        }
        
        // Polearm weapons
        if (category === 'polearm') {
            return (
                <g>
                    <Pixel x={10} y={-12} w={1} h={15} color="#8b4513" /> {/* Shaft */}
                    <Pixel x={9} y={-13} w={3} h={2} color={color} /> {/* Head */}
                    <Pixel x={10} y={-14} w={1} h={1} color={shadeColor(color, 40)} /> {/* Point */}
                    {isRare && (
                        <g>
                            <ellipse cx="10" cy="-10" rx="4" ry="8" fill="#4dabf7" opacity="0.25"/>
                            <ellipse cx="10" cy="-10" rx="3" ry="6" fill="#87ceeb" opacity="0.15"/>
                            <animate attributeName="opacity" values="0.25;0.4;0.25" dur="3s" repeatCount="indefinite" />
                        </g>
                    )}
                </g>
            );
        }
        
        // Blunt weapons
        if (category === 'blunt') {
            const isMace = name.includes('mace');
            const isFlail = name.includes('flail');
            
            if (isFlail) {
                return (
                    <g>
                        <Pixel x={10} y={0} w={1} h={5} color={material === 'Steel' ? '#654321' : '#8b4513'} /> {/* Handle */}
                        <Pixel x={10} y={-2} w={1} h={1} color={materialColors.primary} /> {/* Chain */}
                        <Pixel x={11} y={-3} w={1} h={1} color={materialColors.primary} /> {/* Chain */}
                        <Pixel x={10} y={-4} w={1} h={1} color={materialColors.primary} /> {/* Chain */}
                        <Pixel x={9} y={-6} w={3} h={3} color={materialColors.primary} /> {/* Spiked ball */}
                        <Pixel x={8} y={-5} w={1} h={1} color={materialColors.secondary} /> {/* Spike */}
                        <Pixel x={12} y={-5} w={1} h={1} color={materialColors.secondary} /> {/* Spike */}
                        <Pixel x={10} y={-6} w={1} h={1} color={materialColors.accent} /> {/* Top shine */}
                    </g>
                );
            }
            
            return (
                <g>
                    <Pixel x={10} y={-6} w={2} h={9} color={material === 'Steel' ? '#654321' : '#8b4513'} /> {/* Handle */}
                    <Pixel x={9} y={-8} w={4} h={4} color={materialColors.primary} /> {/* Head */}
                    <Pixel x={9.5} y={-7.5} w={3} h={3} color={materialColors.secondary} /> {/* Inner head */}
                    {isMace && (
                        <>
                            <Pixel x={8} y={-7} w={1} h={2} color={materialColors.secondary} /> {/* Spike */}
                            <Pixel x={13} y={-7} w={1} h={2} color={materialColors.secondary} /> {/* Spike */}
                            <Pixel x={10} y={-9} w={2} h={1} color={materialColors.secondary} /> {/* Top spike */}
                            <Pixel x={8} y={-6.5} w={0.5} h={1} color={materialColors.accent} /> {/* Spike shine */}
                            <Pixel x={13} y={-6.5} w={0.5} h={1} color={materialColors.accent} /> {/* Spike shine */}
                        </>
                    )}
                    {isRare && (
                        <g>
                            <ellipse cx="10.5" cy="-6" rx="5" ry="5" fill="#845ef7" opacity="0.25"/>
                            <ellipse cx="10.5" cy="-6" rx="3" ry="3" fill="#c4b5fd" opacity="0.15"/>
                            <animate attributeName="opacity" values="0.25;0.45;0.25" dur="2.1s" repeatCount="indefinite" />
                        </g>
                    )}
                </g>
            );
        }
        
        // Bow weapons
        if (category === 'bow') {
            const isCrossbow = name.includes('crossbow');
            if (isCrossbow) {
                return (
                    <g>
                        {/* Crossbow body */}
                        <Pixel x={7} y={0} w={10} h={2} color={color} />
                        <Pixel x={11} y={-1} w={2} h={4} color="#8b4513" /> {/* Stock */}
                        {/* Bow arms */}
                        <line x1="5" y1="1" x2="8" y2="1" stroke={color} strokeWidth="1.5"/>
                        <line x1="16" y1="1" x2="19" y2="1" stroke={color} strokeWidth="1.5"/>
                        {/* String */}
                        <line x1="5" y1="1" x2="19" y2="1" stroke="#d4d4d8" strokeWidth="0.5"/>
                        {/* Bolt */}
                        <Pixel x={11} y={1} w={6} h={0.5} color="#8b4513" />
                        <Pixel x={17} y={1} w={1} h={0.5} color={shadeColor(color, 40)} />
                    </g>
                );
            }
            return (
                <g>
                    {/* Bow curve */}
                    <path d="M 8,-8 Q 6,0 8,8" fill="none" stroke={material === 'Gold' ? materialColors.primary : '#8b4513'} strokeWidth="1.5"/>
                    {/* Bow string */}
                    <line x1="8" y1="-8" x2="8" y2="8" stroke="#d4d4d8" strokeWidth="0.5"/>
                    {/* Arrow */}
                    <Pixel x={10} y={0} w={8} h={1} color="#8b4513" />
                    <Pixel x={18} y={0} w={2} h={0.5} color={materialColors.primary} /> {/* Arrowhead */}
                    <Pixel x={18.5} y={0} w={0.5} h={0.3} color={materialColors.accent} /> {/* Arrowhead shine */}
                    {/* Fletching */}
                    <Pixel x={10} y={-0.5} w={2} h={2} color="#dc2626" />
                    {isRare && (
                        <g>
                            <ellipse cx="14" cy="0" rx="8" ry="3" fill="#22c55e" opacity="0.25"/>
                            <ellipse cx="14" cy="0" rx="6" ry="2" fill="#66ff66" opacity="0.15"/>
                            <animate attributeName="opacity" values="0.25;0.4;0.25" dur="2.2s" repeatCount="indefinite" />
                        </g>
                    )}
                </g>
            );
        }
        
        // Dagger weapons
        if (category === 'dagger') {
            return (
                <g>
                    <Pixel x={10} y={-2} w={1} h={5} color={materialColors.primary} /> {/* Blade */}
                    <Pixel x={10.3} y={-1} w={0.4} h={4} color={materialColors.secondary} /> {/* Blade edge */}
                    <Pixel x={9} y={3} w={3} h={1} color={material === 'Gold' ? materialColors.secondary : '#8b4513'} /> {/* Guard */}
                    <Pixel x={9.5} y={4} w={2} h={2} color="#654321" /> {/* Handle */}
                    <Pixel x={10} y={-3} w={1} h={1} color={materialColors.accent} /> {/* Tip */}
                    {isRare && (
                        <g>
                            <ellipse cx="10" cy="0" rx="3" ry="5" fill="#a855f7" opacity="0.25"/>
                            <ellipse cx="10" cy="0" rx="2" ry="3" fill="#d8b4fe" opacity="0.15"/>
                            <animate attributeName="opacity" values="0.25;0.45;0.25" dur="1.8s" repeatCount="indefinite" />
                        </g>
                    )}
                </g>
            );
        }
 
        // Default check for old weapon types
        
        // Katana - distinct curved blade
        if (name.includes('katana')) {
            return (
                <g>
                    <path d="M 10,2 Q 11,-3 10,-8" fill="none" stroke="#c0c0c0" strokeWidth="1.5"/>
                    <Pixel x={9} y={2} w={3} h={2} color="#2c1810" /> {/* Guard */}
                    <Pixel x={10} y={4} w={1} h={3} color="#8b4513" /> {/* Handle */}
                    <Pixel x={10} y={-9} w={1} h={1} color="#ffffff" /> {/* Tip shine */}
                </g>
            );
        }
        
        // Scimitar - curved Middle Eastern blade
        if (name.includes('scimitar')) {
            return (
                <g>
                    <path d="M 10,2 Q 12,-2 11,-7" fill="none" stroke="#c0c0c0" strokeWidth="2"/>
                    <Pixel x={8} y={2} w={4} h={1} color="#ffd700" /> {/* Golden guard */}
                    <Pixel x={10} y={3} w={1} h={3} color="#8b4513" /> {/* Handle */}
                    <Pixel x={11} y={-8} w={1} h={1} color="#e5e5e5" /> {/* Tip */}
                </g>
            );
        }
        
        // Regular sword
        if (name.includes('sword') || name.includes('blade')) {
            return (
                <g>
                    <Pixel x={10} y={-8} w={1} h={10} color="#c0c0c0" />
                    <Pixel x={9} y={2} w={3} h={1} color="#8b4513" />
                    <Pixel x={10} y={-9} w={1} h={1} color="#e5e5e5" />
                </g>
            );
        }
        
        // Dagger/Knife - shorter blade
        if (name.includes('dagger') || name.includes('knife') || archetype?.includes('DAGGER')) {
            return (
                <g>
                    <Pixel x={10} y={-2} w={1} h={4} color="#c0c0c0" />
                    <Pixel x={9} y={2} w={3} h={1} color="#654321" /> {/* Small guard */}
                    <Pixel x={10} y={3} w={1} h={2} color="#8b4513" /> {/* Short handle */}
                    <Pixel x={10} y={-3} w={1} h={1} color="#ffffff" /> {/* Blade shine */}
                </g>
            );
        }
        
        // Battle Axe - larger head
        if (name.includes('axe')) {
            return (
                <g>
                    <Pixel x={10} y={-7} w={1} h={10} color="#8b4513" />
                    <Pixel x={7} y={-8} w={6} h={3} color="#71717a" /> {/* Axe head */}
                    <Pixel x={6} y={-7} w={1} h={2} color="#a1a1aa" /> {/* Blade edge */}
                    <Pixel x={13} y={-7} w={1} h={2} color="#a1a1aa" /> {/* Back edge */}
                </g>
            );
        }
        
        // Mace - spiked head
        if (name.includes('mace')) {
            return (
                <g>
                    <Pixel x={10} y={-6} w={2} h={9} color="#8b4513" /> {/* Handle */}
                    <Pixel x={9} y={-8} w={4} h={4} color="#52525b" /> {/* Head */}
                    <Pixel x={8} y={-7} w={1} h={2} color="#71717a" /> {/* Spike */}
                    <Pixel x={13} y={-7} w={1} h={2} color="#71717a" /> {/* Spike */}
                    <Pixel x={10} y={-9} w={2} h={1} color="#71717a" /> {/* Top spike */}
                </g>
            );
        }
        
        // Club - simple wooden
        if (name.includes('club') || name.includes('stick')) {
            return (
                <g>
                    <Pixel x={10} y={-5} w={2} h={8} color="#8b4513" />
                    <Pixel x={9} y={-7} w={4} h={3} color="#654321" /> {/* Thicker end */}
                </g>
            );
        }
        
        // Flail - chain weapon
        if (name.includes('flail')) {
            return (
                <g>
                    <Pixel x={10} y={0} w={1} h={5} color="#8b4513" /> {/* Handle */}
                    <Pixel x={10} y={-2} w={1} h={1} color="#71717a" /> {/* Chain */}
                    <Pixel x={11} y={-3} w={1} h={1} color="#71717a" /> {/* Chain */}
                    <Pixel x={10} y={-4} w={1} h={1} color="#71717a" /> {/* Chain */}
                    <Pixel x={9} y={-6} w={3} h={3} color="#52525b" /> {/* Spiked ball */}
                    <Pixel x={8} y={-5} w={1} h={1} color="#71717a" /> {/* Spike */}
                    <Pixel x={12} y={-5} w={1} h={1} color="#71717a" /> {/* Spike */}
                </g>
            );
        }
        
        // Staff/Quarterstaff - longer wooden pole
        if (name.includes('staff') || name.includes('quarterstaff') || archetype?.includes('STAFF')) {
            return (
                <g>
                    <Pixel x={10} y={-10} w={1.5} h={16} color="#8b4513" />
                    <Pixel x={9} y={-11} w={3} h={1} color="#654321" /> {/* Top cap */}
                    <Pixel x={9} y={6} w={3} h={1} color="#654321" /> {/* Bottom cap */}
                    {name.includes('magic') && (
                        <ellipse cx="10.75" cy="-11" rx="2" ry="2" fill="#9333ea" opacity="0.6"/>
                    )}
                </g>
            );
        }
        
        // Use baseSprites archetype for additional weapon types
        if (name.includes('claw') || archetype?.includes('CLAW')) {
            // Render claws attached to hand
            return (
                <g>
                    <Pixel x={10} y={0} w={1} h={3} color="#d4d4d8" />
                    <Pixel x={11} y={0} w={1} h={3} color="#d4d4d8" />
                    <Pixel x={12} y={0} w={1} h={3} color="#d4d4d8" />
                    <Pixel x={10} y={-1} w={3} h={1} color="#e4e4e7" />
                </g>
            );
        }
        if (name.includes('spear') || archetype?.includes('SPEAR')) {
            return (
                <g>
                    <Pixel x={10} y={-12} w={1} h={15} color="#8b4513" />
                    <Pixel x={9} y={-13} w={3} h={2} color="#a1a1aa" />
                    <Pixel x={10} y={-14} w={1} h={1} color="#e5e5e5" />
                </g>
            );
        }
        if (name.includes('hammer') || archetype?.includes('HAMMER')) {
            return (
                <g>
                    <Pixel x={10} y={-6} w={1} h={9} color="#8b4513" />
                    <Pixel x={8} y={-8} w={5} h={4} color="#52525b" />
                    <Pixel x={9} y={-9} w={3} h={1} color="#71717a" />
                </g>
            );
        }
        if (name.includes('dagger') || name.includes('knife') || archetype?.includes('DAGGER')) {
            return (
                <g>
                    <Pixel x={10} y={-2} w={1} h={5} color="#c0c0c0" />
                    <Pixel x={9} y={3} w={3} h={1} color="#8b4513" />
                    <Pixel x={10} y={-3} w={1} h={1} color="#e5e5e5" />
                </g>
            );
        }
        if (name.includes('bow') || archetype?.includes('BOW')) {
            return (
                <g>
                    {/* Bow curve */}
                    <path d="M 8,-8 Q 6,0 8,8" fill="none" stroke="#8b4513" strokeWidth="1.5"/>
                    {/* Bow string */}
                    <line x1="8" y1="-8" x2="8" y2="8" stroke="#d4d4d8" strokeWidth="0.5"/>
                    {/* Arrow */}
                    <Pixel x={10} y={0} w={8} h={1} color="#8b4513" />
                    <Pixel x={18} y={0} w={2} h={1} color="#a1a1aa" />
                </g>
            );
        }
        if (name.includes('staff') || archetype?.includes('STAFF')) {
            return (
                <g>
                    <Pixel x={10} y={-10} w={1.5} h={18} color="#8b4513" />
                    <ellipse cx="10.75" cy="-10" rx="2" ry="2" fill="#60a5fa" opacity="0.6"/>
                </g>
            );
        }
        if (name.includes('whip') || archetype?.includes('WHIP')) {
            return (
                <g>
                    <path d="M 10,2 Q 12,-2 10,-6 Q 8,-10 10,-14" fill="none" stroke="#8b4513" strokeWidth="1"/>
                    <Pixel x={9} y={2} w={2} h={2} color="#52525b" />
                </g>
            );
        }
        if (name.includes('crossbow') || archetype?.includes('CROSSBOW')) {
            return (
                <g>
                    <Pixel x={8} y={0} w={7} h={1} color="#8b4513" />
                    <Pixel x={10} y={-2} w={1} h={4} color="#8b4513" />
                    <line x1="8" y1="0" x2="15" y2="0" stroke="#d4d4d8" strokeWidth="0.5"/>
                    <Pixel x={15} y={0} w={3} h={1} color="#52525b" />
                </g>
            );
        }
        
        // Fallback for any unrecognized weapon - show a generic weapon indicator
        if (archetype && archetype !== 'GENERIC') {
            return (
                <g>
                    <Pixel x={10} y={-4} w={1} h={7} color="#8b7355" />
                    <Pixel x={9} y={3} w={3} h={1} color="#52525b" />
                </g>
            );
        }
        
        return null;
    };

    const renderShield = () => {
        const shieldName = offHandItem?.name.toLowerCase() || '';
        
        // Tower shield - rectangular, tall
        if (shieldName.includes('tower') || shieldName.includes('kite')) {
            return (
                <g>
                    <rect x="-3" y="2" width="6" height="10" fill="#8b4513" />
                    <rect x="-2" y="3" width="4" height="8" fill="#a16207" />
                    <Pixel x={-1} y={6} w={2} h={1} color="#fcd34d" />
                    <Pixel x={-1} y={8} w={2} h={1} color="#fcd34d" />
                </g>
            );
        }
        
        // Round shield - circular
        if (shieldName.includes('round') || shieldName.includes('buckler')) {
            return (
                <g>
                    <circle cx="0" cy="8" r="4" fill="#8b4513" />
                    <circle cx="0" cy="8" r="3" fill="#a16207" />
                    <circle cx="0" cy="8" r="1" fill="#fcd34d" />
                </g>
            );
        }
        
        // Viking/Norse shield - round with boss
        if (shieldName.includes('viking') || shieldName.includes('norse')) {
            return (
                <g>
                    <circle cx="0" cy="8" r="5" fill="#654321" />
                    <circle cx="0" cy="8" r="4" fill="#8b4513" />
                    <circle cx="0" cy="8" r="1.5" fill="#71717a" />
                    <Pixel x={-3} y={8} w={1} h={3} color="#a16207" />
                    <Pixel x={2} y={8} w={1} h={3} color="#a16207" />
                </g>
            );
        }
        
        // Default heater shield
        return (
            <g>
                <ellipse cx="0" cy="8" rx="4" ry="6" fill="#8b4513" />
                <ellipse cx="0" cy="8" rx="3" ry="5" fill="#a16207" />
                <Pixel x={-1} y={7} w={2} h={2} color="#fcd34d" />
            </g>
        );
    };

    // Render simple pixel weapon
    const renderPixelWeapon = () => {
        if (!mainHandItem) return null;

        const weaponX = facingRight ? centerX + 4 : centerX - 6;
        const weaponY = baseY - 18;

        return (
            <>
                {/* Simple sword shape */}
                <Pixel x={weaponX} y={weaponY} w={1} h={8} color="#c0c0c0" /> {/* Blade */}
                <Pixel x={weaponX} y={weaponY + 8} w={1} h={2} color="#8B4513" /> {/* Hilt */}
                <Pixel x={weaponX - 1} y={weaponY + 8} w={3} h={1} color="#FFD700" /> {/* Guard */}
            </>
        );
    };

    return (
        <svg viewBox="0 0 40 40" width="100%" height="100%"
             style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}>
            {/* No filters needed for pixel art */}
            <defs>
                <filter id="trail-glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                <filter id="sprite-outline" x="-20%" y="-20%" width="140%" height="140%">
                    <feMorphology in="SourceAlpha" result="dilated" operator="dilate" radius="0.5"/>
                    <feFlood floodColor="#1a1a1a" floodOpacity="0.8" result="outlineColor"/>
                    <feComposite in="outlineColor" in2="dilated" operator="in" result="outline"/>
                    <feMerge>
                        <feMergeNode in="outline"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            {/* Main sprite container */}
            <g className={animationClass} style={{ transformOrigin: `${centerX}px ${baseY}px` }}>
                <g style={{ transform: `scaleX(${facingRight ? 1 : -1})`, transformOrigin: `${centerX}px ${baseY}px` }}>
                    
                    {/* Pixel shadow */}
                    <Pixel x={centerX - 3} y={baseY} w={6} h={1} color="#000000" opacity={0.3} />
                    <Pixel x={centerX - 2} y={baseY + 1} w={4} h={1} color="#000000" opacity={0.2} />

                    {/* Render sprite layers in proper order */}
                    {renderPixelLegs()}
                    {renderPixelArms()}
                    {renderPixelBody()}
                    {renderPixelHead()}
                    {renderPixelHair()}
                    {renderPixelWeapon()}

                    {/* Old complex rendering to be removed */}
                    {/* Left Arm (back/non-weapon arm) positioned for combat stance */}
                    <g className={`left-arm-assembly ${animation}`}>
                        <g transform="translate(-2, 0)">
                            {/* Shield held forward in defensive position */}
                            {offHandItem && (offHandItem.name.toLowerCase().includes('shield') || getItemArchetypeMax(offHandItem.name)?.includes('SHIELD')) && (
                                <g transform="translate(12, 17) rotate(-15)">
                                    {renderShield()}
                                </g>
                            )}

                            {/* Left arm with gender-appropriate positioning */}
                            <g className="jointed-left-arm">
                                {renderArmJointed(isFemale ? 15 : 14, 15, isFemale ? 2 : 2.5, torsoHeight, clothingShadow, false)}
                            </g>
                        </g>
                    </g>
                    
                    {/* Natural leg positioning with slight bend */}
                    {(() => {
                        // More natural stance - closer together, slight knee bend
                        const leftLegX = isFemale ? 18.5 : 18;
                        const rightLegX = isFemale ? 21.5 : 22;
                        const legY = 15 + torsoHeight;

                        return (
                            <>
                                {/* Left leg with slight bend */}
                                <g>
                                    {/* Thigh */}
                                    <rect x={leftLegX} y={legY} width={isFemale ? 1.8 : 2.2} height={legHeight * 0.55} fill={shadeColor(secondaryColor, -10)} />
                                    {/* Knee bend */}
                                    <rect x={leftLegX - 0.2} y={legY + legHeight * 0.55} width={isFemale ? 2 : 2.4} height={0.5} fill={shadeColor(secondaryColor, -15)} rx={0.2} />
                                    {/* Shin */}
                                    <rect x={leftLegX} y={legY + legHeight * 0.55} width={isFemale ? 1.8 : 2.2} height={legHeight * 0.45} fill={shadeColor(secondaryColor, -10)} />
                                    {/* Foot */}
                                    <rect x={leftLegX - 0.3} y={24 - 0.5} width={isFemale ? 2.4 : 2.8} height={0.5} fill="#4a2c17" />
                                </g>

                                {/* Right leg slightly forward */}
                                <g>
                                    {/* Thigh */}
                                    <rect x={rightLegX} y={legY} width={isFemale ? 1.8 : 2.2} height={legHeight * 0.55} fill={secondaryColor} />
                                    {/* Knee */}
                                    <rect x={rightLegX - 0.2} y={legY + legHeight * 0.55} width={isFemale ? 2 : 2.4} height={0.5} fill={shadeColor(secondaryColor, -5)} rx={0.2} />
                                    {/* Shin */}
                                    <rect x={rightLegX} y={legY + legHeight * 0.55} width={isFemale ? 1.8 : 2.2} height={legHeight * 0.45} fill={secondaryColor} />
                                    {/* Foot */}
                                    <rect x={rightLegX - 0.3} y={24 - 0.5} width={isFemale ? 2.4 : 2.8} height={0.5} fill="#38220f" />
                                </g>
                            </>
                        );
                    })()}

                    {/* Torso & Clothing with Category System */}
                    {(() => {
                        const torsoItem = armorItem || equippedItems?.torso || garment;
                        const armorCategory = torsoItem ? getArmorCategory(torsoItem.baseId || torsoItem.name) : 'clothing';
                        const armorMaterial = torsoItem?.material || 'Wool';
                        const armorColor = MATERIAL_COLORS[armorMaterial] || clothingColor;
                        const isRareArmor = torsoItem?.rarity === 'Rare' || torsoItem?.rarity === 'Epic' || torsoItem?.rarity === 'Legendary';
                        
                        // Base clothing layer color based on category
                        const baseColor = armorCategory === 'heavy_armor' ? shadeColor(armorColor, -30) : 
                                         armorCategory === 'cultural' ? armorColor :
                                         armorCategory === 'robes' ? shadeColor(armorColor, -10) :
                                         clothingColor;
                        
                        return (
                            <>
                                {/* Enhanced torso with breathing and physics */}
                                <g className="torso-breathing">
                                    {/* Enhanced torso with gender-specific shaping */}
                                    {isFemale ? (
                                        <>
                                            {/* Female torso with waist and hip definition */}
                                            <rect x={20 - shoulderWidth/2} y={15} width={shoulderWidth} height={1} fill={shadeColor(baseColor, -20)} />
                                            {/* Upper torso */}
                                            <rect x={20 - bodyWidth/2} y={16} width={bodyWidth} height={torsoHeight * 0.4} fill={shadeColor(baseColor, -20)} />
                                            {/* Waist (narrower) */}
                                            <rect x={20 - bodyWidth * 0.4} y={16 + torsoHeight * 0.4} width={bodyWidth * 0.8} height={torsoHeight * 0.2} fill={shadeColor(baseColor, -20)} />
                                            {/* Hips (wider) */}
                                            <rect x={20 - hipWidth/2} y={16 + torsoHeight * 0.6} width={hipWidth} height={Math.max(0, torsoHeight * 0.4 - 2)} fill={shadeColor(baseColor, -20)} />

                                            {/* Light layer */}
                                            <rect x={20 - shoulderWidth/2 + 0.5} y={15} width={Math.max(0, shoulderWidth - 1)} height={0.8} fill={baseColor} />
                                            <rect x={20 - bodyWidth/2} y={15.8} width={bodyWidth} height={torsoHeight * 0.4} fill={baseColor} />
                                            <rect x={20 - bodyWidth * 0.4} y={15.8 + torsoHeight * 0.4} width={bodyWidth * 0.8} height={torsoHeight * 0.2} fill={baseColor} />
                                            <rect x={20 - hipWidth/2} y={15.8 + torsoHeight * 0.6} width={hipWidth} height={Math.max(0, torsoHeight * 0.4 - 1.5)} fill={baseColor} />
                                        </>
                                    ) : (
                                        <>
                                            {/* Male torso - straighter lines */}
                                            <rect x={20 - shoulderWidth/2} y={15} width={shoulderWidth} height={1.5} fill={shadeColor(baseColor, -20)} />
                                            <rect x={20 - bodyWidth/2} y={16} width={bodyWidth} height={torsoHeight - 2} fill={shadeColor(baseColor, -20)} />
                                            <rect x={20 - shoulderWidth/2} y={15} width={shoulderWidth} height={1.2} fill={baseColor} />
                                            <rect x={20 - bodyWidth/2} y={16} width={bodyWidth} height={torsoHeight - 2.5} fill={baseColor} />
                                        </>
                                    )}

                                    {/* Chest definition with gender differences */}
                                    {!isFemale ? (
                                        <>
                                            {/* Male pectoral definition */}
                                            <ellipse cx={20 - bodyWidth * 0.2} cy={15 + torsoHeight * 0.25} rx={bodyWidth * 0.2} ry={torsoHeight * 0.1}
                                                     fill={shadeColor(baseColor, 10)} opacity="0.2" />
                                            <ellipse cx={20 + bodyWidth * 0.2} cy={15 + torsoHeight * 0.25} rx={bodyWidth * 0.2} ry={torsoHeight * 0.1}
                                                     fill={shadeColor(baseColor, 10)} opacity="0.2" />
                                        </>
                                    ) : (
                                        <>
                                            {/* Female bust definition - subtle */}
                                            <ellipse cx={20 - bodyWidth * 0.2} cy={15 + torsoHeight * 0.35} rx={bodyWidth * 0.25} ry={torsoHeight * 0.15}
                                                     fill={shadeColor(baseColor, 8)} opacity="0.25" />
                                            <ellipse cx={20 + bodyWidth * 0.2} cy={15 + torsoHeight * 0.35} rx={bodyWidth * 0.25} ry={torsoHeight * 0.15}
                                                     fill={shadeColor(baseColor, 8)} opacity="0.25" />
                                        </>
                                    )}

                                    {/* Cultural clothing patterns */}
                                    {torsoItem && (() => {
                                        const itemName = torsoItem.name.toLowerCase();
                                        const culturalZone = character.culturalZone;

                                        // Add cultural patterns based on item and zone
                                        if (culturalZone === 'EAST_ASIAN' && (itemName.includes('kimono') || itemName.includes('hanfu'))) {
                                            return (
                                                <g opacity="0.4">
                                                    {/* Floral pattern */}
                                                    <circle cx={20 - bodyWidth/3} cy={15 + torsoHeight/2} r="0.8" fill={shadeColor(baseColor, 20)} />
                                                    <circle cx={20 + bodyWidth/3} cy={15 + torsoHeight/3} r="0.8" fill={shadeColor(baseColor, 20)} />
                                                </g>
                                            );
                                        } else if (culturalZone === 'SOUTH_ASIAN' && itemName.includes('sari')) {
                                            return (
                                                <g opacity="0.3">
                                                    {/* Border pattern */}
                                                    <rect x={20 - bodyWidth/2} y={15 + torsoHeight - 2} width={bodyWidth} height="0.5" fill={shadeColor(baseColor, 30)} />
                                                    <rect x={20 - bodyWidth/2} y={15 + torsoHeight - 1} width={bodyWidth} height="0.3" fill="#fbbf24" />
                                                </g>
                                            );
                                        } else if ((culturalZone === 'SUB_SAHARAN_AFRICAN' || culturalZone === 'MENA') && itemName.includes('robe')) {
                                            return (
                                                <g opacity="0.3">
                                                    {/* Geometric pattern */}
                                                    <rect x={20 - bodyWidth/3} y={15 + torsoHeight/2} width={bodyWidth/3} height="0.5" fill={shadeColor(baseColor, 25)} />
                                                    <rect x={20} y={15 + torsoHeight/2 + 1} width={bodyWidth/3} height="0.5" fill={shadeColor(baseColor, 25)} />
                                                </g>
                                            );
                                        }
                                        return null;
                                    })()}
                                </g>

                                {/* Flowing garments with physics */}
                                {(armorCategory === 'robes' || armorCategory === 'cultural' || armorCategory === 'formal') &&
                                 (torsoItem?.name.toLowerCase().includes('robe') || torsoItem?.name.toLowerCase().includes('dress') || torsoItem?.name.toLowerCase().includes('gown')) && (
                                    <g className="flowing-garment">
                                        {/* Main flowing section */}
                                        <path d={`M${20 - bodyWidth/2} ${15 + torsoHeight} Q${20} ${15 + torsoHeight + legHeight/2} ${20 + bodyWidth/2} ${15 + torsoHeight + legHeight - 2}`}
                                              fill={baseColor} opacity="0.8" />

                                        {/* Cape/cloak physics */}
                                        {torsoItem?.name.toLowerCase().includes('cape') || torsoItem?.name.toLowerCase().includes('cloak') && (
                                            <g className="cape-flutter">
                                                <path d={`M${20 - bodyWidth/2 - 2} ${15} Q${20 - bodyWidth} ${15 + torsoHeight/2} ${20 - bodyWidth/2 - 1} ${15 + torsoHeight + legHeight}`}
                                                      fill={shadeColor(baseColor, -10)} opacity="0.7" />
                                                <path d={`M${20 + bodyWidth/2 + 2} ${15} Q${20 + bodyWidth} ${15 + torsoHeight/2} ${20 + bodyWidth/2 + 1} ${15 + torsoHeight + legHeight}`}
                                                      fill={shadeColor(baseColor, -10)} opacity="0.7" />
                                            </g>
                                        )}
                                    </g>
                                )}
                                
                                {/* Cultural garment patterns */}
                                {armorCategory === 'cultural' && (
                                    <g>
                                        {torsoItem?.name.includes('toga') && (
                                            <>
                                                <rect x={20 - bodyWidth/2} y={15} width={1} height={torsoHeight} fill="#9333ea" opacity="0.5" />
                                                <rect x={20 + bodyWidth/2 - 1} y={15} width={1} height={torsoHeight} fill="#9333ea" opacity="0.5" />
                                            </>
                                        )}
                                        {torsoItem?.name.includes('kimono') && (
                                            <>
                                                <rect x={20 - bodyWidth/2} y={18} width={bodyWidth} height={1} fill="#dc2626" opacity="0.6" />
                                                <rect x={20 - bodyWidth/2} y={20} width={bodyWidth} height={0.5} fill="#dc2626" opacity="0.4" />
                                            </>
                                        )}
                                        {torsoItem?.name.includes('cloak') && (
                                            <ellipse cx="20" cy={15 + torsoHeight/2} rx={bodyWidth/2 + 1} ry={torsoHeight/2} fill={baseColor} opacity="0.7" />
                                        )}
                                    </g>
                                )}
                                
                                {/* Rare armor glow effect */}
                                {isRareArmor && (
                                    <g>
                                        <ellipse cx="20" cy="19" rx={bodyWidth + 1} ry={torsoHeight/2 + 1} fill="#ffd700" opacity="0.12" />
                                        <ellipse cx="20" cy="19" rx={bodyWidth + 2} ry={torsoHeight/2 + 2} fill="#fff" opacity="0.05" />
                                        <animate attributeName="opacity" values="0.12;0.2;0.12" dur="3.5s" repeatCount="indefinite" />
                                    </g>
                                )}
                                
                                {/* Armor overlay system */}
                                {torsoItem && getArmorOverlay(torsoItem)}
                            </>
                        );
                    })()}
                    
                    {/* Armor/Hide Overlays based on baseSprites archetypes */}
                    {armorItem && (() => {
                        const armorName = armorItem.name.toLowerCase();
                        const armorArchetype = getItemArchetypeMax(armorItem.name);
                        const armorCategory = getArmorCategory(armorItem.baseId || armorItem.name);
                        
                        // Skip rendering old armor overlays if we're using the new system
                        if (['heavy_armor', 'medium_armor', 'light_armor', 'robes'].includes(armorCategory)) {
                            return null;
                        }
                        
                        // Chain mail - interlocking rings pattern
                        if (armorName.includes('chain') || armorName.includes('mail') || armorArchetype?.includes('CHAIN')) {
                            return (
                                <g>
                                    {/* Chain mail texture */}
                                    {[0, 1, 2, 3, 4].map(row => (
                                        <g key={row}>
                                            {[0, 1, 2, 3].map(col => (
                                                <circle 
                                                    key={col}
                                                    cx={20 - bodyWidth/2 + col * 1.5 + (row % 2) * 0.75}
                                                    cy={15.5 + row * 1.5}
                                                    r="0.7"
                                                    fill="none"
                                                    stroke="#71717a"
                                                    strokeWidth="0.3"
                                                    opacity="0.8"
                                                />
                                            ))}
                                        </g>
                                    ))}
                                </g>
                            );
                        }
                        
                        // Plate armor - segmented metal plates
                        if (armorName.includes('plate') || armorArchetype?.includes('PLATE')) {
                            return (
                                <g>
                                    {/* Chest plate */}
                                    <rect x={20 - bodyWidth/2} y={15} width={bodyWidth} height={torsoHeight * 0.6} fill="#a1a1aa" opacity="0.8" />
                                    <rect x={20 - bodyWidth/2 + 0.5} y={15.5} width={bodyWidth - 1} height={torsoHeight * 0.6 - 1} fill="#d4d4d8" opacity="0.7" />
                                    {/* Pauldrons */}
                                    <rect x={20 - shoulderWidth/2} y={14} width={shoulderWidth * 0.3} height={3} fill="#a1a1aa" opacity="0.8" />
                                    <rect x={20 + shoulderWidth/2 - shoulderWidth * 0.3} y={14} width={shoulderWidth * 0.3} height={3} fill="#a1a1aa" opacity="0.8" />
                                    {/* Plate details */}
                                    <Pixel x={20} y={17} w={1} h={2} color="#71717a" />
                                </g>
                            );
                        }
                        
                        // Samurai armor - lamellar plates
                        if (armorName.includes('samurai') || armorName.includes('lamellar') || armorArchetype?.includes('SAMURAI')) {
                            return (
                                <g>
                                    {/* Horizontal lamellar plates */}
                                    {[0, 1, 2, 3].map(row => (
                                        <rect 
                                            key={row}
                                            x={20 - bodyWidth/2} 
                                            y={15 + row * 2} 
                                            width={bodyWidth} 
                                            height={1.5} 
                                            fill={row % 2 ? '#8b0000' : '#dc143c'} 
                                            opacity="0.7" 
                                        />
                                    ))}
                                    {/* Shoulder guards */}
                                    <rect x={20 - shoulderWidth/2} y={13} width={shoulderWidth} height={2} fill="#8b0000" opacity="0.8" />
                                </g>
                            );
                        }
                        
                        // Viking/Norse armor - with fur trim
                        if (armorName.includes('viking') || armorName.includes('norse')) {
                            return (
                                <g>
                                    <rect x={20 - bodyWidth/2} y={15} width={bodyWidth} height={torsoHeight} fill="#654321" opacity="0.7" />
                                    {/* Fur trim at shoulders */}
                                    <rect x={20 - shoulderWidth/2} y={14} width={shoulderWidth} height={2} fill="#8B4513" opacity="0.8" />
                                    {/* Metal studs */}
                                    <Pixel x={20 - bodyWidth/2 + 1} y={17} w={1} h={1} color="#71717a" />
                                    <Pixel x={20 + bodyWidth/2 - 2} y={17} w={1} h={1} color="#71717a" />
                                    <Pixel x={20 - bodyWidth/2 + 1} y={20} w={1} h={1} color="#71717a" />
                                    <Pixel x={20 + bodyWidth/2 - 2} y={20} w={1} h={1} color="#71717a" />
                                </g>
                            );
                        }
                        
                        // Bear hide or fur armor
                        if (armorName.includes('bear') || armorName.includes('hide') || armorArchetype?.includes('HIDE') || armorArchetype?.includes('FUR')) {
                            return (
                                <g>
                                    {/* Fur texture over torso */}
                                    <rect x={20 - bodyWidth/2} y={15} width={bodyWidth} height={torsoHeight} fill="#8B4513" opacity="0.7" />
                                    <rect x={20 - bodyWidth/2} y={15} width={bodyWidth} height={1} fill="#654321" opacity="0.8" />
                                    <rect x={20 - bodyWidth/2} y={17} width={bodyWidth} height={1} fill="#654321" opacity="0.6" />
                                    <rect x={20 - bodyWidth/2} y={19} width={bodyWidth} height={1} fill="#654321" opacity="0.5" />
                                    {/* Fur shoulders */}
                                    <rect x={20 - shoulderWidth/2} y={14} width={shoulderWidth} height={2} fill="#8B4513" opacity="0.6" />
                                </g>
                            );
                        }
                        
                        // Leather armor
                        if (armorName.includes('leather') || armorArchetype?.includes('LEATHER')) {
                            return (
                                <g>
                                    <rect x={20 - bodyWidth/2 + 0.5} y={15.5} width={bodyWidth - 1} height={torsoHeight - 1} fill="#654321" opacity="0.6" />
                                    <rect x={20 - bodyWidth/2 + 1} y={16} width={bodyWidth - 2} height={1} fill="#8B4513" opacity="0.4" />
                                    <rect x={20 - bodyWidth/2 + 1} y={18} width={bodyWidth - 2} height={1} fill="#8B4513" opacity="0.4" />
                                </g>
                            );
                        }
                        
                        // Scale or bone armor
                        if (armorName.includes('scale') || armorName.includes('bone') || armorArchetype?.includes('SCALE') || armorArchetype?.includes('BONE')) {
                            return (
                                <g>
                                    {/* Scale pattern */}
                                    {[0, 1, 2, 3].map(row => (
                                        <g key={row}>
                                            {[0, 1, 2].map(col => (
                                                <rect 
                                                    key={col} 
                                                    x={20 - bodyWidth/2 + col * 2} 
                                                    y={16 + row * 2} 
                                                    width={1.5} 
                                                    height={1.5} 
                                                    fill={armorName.includes('bone') ? '#F5F5DC' : '#A9A9A9'} 
                                                    opacity="0.7" 
                                                />
                                            ))}
                                        </g>
                                    ))}
                                </g>
                            );
                        }
                        // Cloth/fabric armor like robes
                        if (armorName.includes('robe') || armorName.includes('cloth') || armorArchetype?.includes('ROBE')) {
                            return (
                                <g>
                                    <rect x={20 - bodyWidth/2 - 1} y={15} width={bodyWidth + 2} height={torsoHeight + legHeight/2} 
                                          fill={armorItem.archetype?.includes('magic') ? '#4B0082' : '#2F4F4F'} opacity="0.5" />
                                    <rect x={20 - bodyWidth/2} y={15} width={1} height={torsoHeight + legHeight/2} fill="#1C1C1C" opacity="0.3" />
                                </g>
                            );
                        }
                        // Shell or carapace armor
                        if (armorName.includes('shell') || armorName.includes('carapace') || armorArchetype?.includes('SHELL')) {
                            return (
                                <g>
                                    <ellipse cx="20" cy={15 + torsoHeight/2} rx={bodyWidth/2 + 1} ry={torsoHeight/2} 
                                             fill="#556B2F" opacity="0.7" />
                                    <ellipse cx="20" cy={15 + torsoHeight/2} rx={bodyWidth/2} ry={torsoHeight/2 - 1} 
                                             fill="#6B8E23" opacity="0.5" />
                                </g>
                            );
                        }
                        
                        return null;
                    })()}

                    {/* Profile Head - viewed from the side */}
                    <g transform="translate(0, 0)">
                        {/* Back of hair (behind head) */}
                        {(() => {
                            const hairTexture = character.appearance.hairTexture || 'straight';
                            const headCenterY = 14 - headSize.h/2;

                            if (hairTexture === 'curly' || hairTexture === 'coily' || hairTexture === 'kinky') {
                                return (
                                    <ellipse cx={19} cy={headCenterY - 1} rx={headSize.w/1.5} ry={headSize.h/1.8}
                                            fill={hairShadow} />
                                );
                            } else {
                                return (
                                    <rect x={18 - headSize.w/2} y={14 - headSize.h - 1} width={headSize.w + 1} height={headSize.h + 2}
                                          fill={hairShadow} />
                                );
                            }
                        })()}

                        {/* Profile head shape */}
                        <ellipse cx={20} cy={14 - headSize.h/2} rx={headSize.w/2} ry={headSize.h/2}
                                fill={skinShadow} />
                        <ellipse cx={20} cy={14 - headSize.h/2} rx={headSize.w/2 - 0.3} ry={headSize.h/2 - 0.3}
                                fill={skinColor} />

                        {/* Profile nose */}
                        <path d={`M${22},${14 - headSize.h/2} L${23},${14 - headSize.h/2 + 1} L${22},${14 - headSize.h/2 + 2}`}
                              fill={shadeColor(skinColor, -10)} />
                        
                        {/* Hair with texture variations */}
                        {(() => {
                            const hairTexture = character.appearance.hairTexture || 'straight';
                            const headCenterY = 16 - headSize.h/2;

                            switch(hairTexture) {
                                case 'curly':
                                case 'coily':
                                case 'kinky':
                                    // Afro-textured hair
                                    return (
                                        <>
                                            <ellipse cx={20} cy={headCenterY - headSize.h/2.2} rx={headSize.w/1.6 + 1} ry={headSize.h/2.2 + 1} fill={hairShadow} />
                                            <ellipse cx={20} cy={headCenterY - headSize.h/2.2} rx={headSize.w/1.6} ry={headSize.h/2.2} fill={finalHairColor} />
                                            {/* Texture detail */}
                                            {[...Array(5)].map((_, i) => (
                                                <circle key={i} cx={20 + (i - 2) * 1.2} cy={headCenterY - headSize.h/2.2 + (i % 2) * 0.5}
                                                        r="0.3" fill={hairShadow} opacity="0.3" />
                                            ))}
                                        </>
                                    );

                                case 'wavy':
                                    // Wavy hair with curves
                                    return (
                                        <>
                                            <path d={`M${20 - headSize.w/2 - 1},${16 - headSize.h} Q${20 - headSize.w/4},${16 - headSize.h - 1.5} ${20},${16 - headSize.h} Q${20 + headSize.w/4},${16 - headSize.h - 1.5} ${20 + headSize.w/2 + 1},${16 - headSize.h}`}
                                                  fill={hairShadow} />
                                            <path d={`M${20 - headSize.w/2 - 1},${16 - headSize.h} Q${20 - headSize.w/4},${16 - headSize.h - 1.2} ${20},${16 - headSize.h} Q${20 + headSize.w/4},${16 - headSize.h - 1.2} ${20 + headSize.w/2 + 1},${16 - headSize.h}`}
                                                  fill={finalHairColor} />
                                            {isFemale && (hairLength === 'long' || hairLength === 'very_long') && (
                                                <>
                                                    <path d={`M${20 - headSize.w/2 - 1},${16 - headSize.h + 2} Q${20 - headSize.w/2 - 2},${16} ${20 - headSize.w/2 - 1.5},${16 + torsoHeight/2}`}
                                                          stroke={finalHairColor} strokeWidth="2" fill="none" />
                                                    <path d={`M${20 + headSize.w/2 + 1},${16 - headSize.h + 2} Q${20 + headSize.w/2 + 2},${16} ${20 + headSize.w/2 + 1.5},${16 + torsoHeight/2}`}
                                                          stroke={finalHairColor} strokeWidth="2" fill="none" />
                                                </>
                                            )}
                                        </>
                                    );

                                case 'straight':
                                default:
                                    // Straight hair (default)
                                    return (
                                        <>
                                            <rect x={20 - headSize.w/2 - 1} y={16 - headSize.h - 1} width={headSize.w + 2} height={3} fill={hairShadow} />
                                            <rect x={20 - headSize.w/2 - 1} y={16 - headSize.h - 1} width={headSize.w + 2} height={2.5} fill={finalHairColor} />
                                            {/* Shine effect for straight hair */}
                                            <rect x={20 - headSize.w/4} y={16 - headSize.h - 0.5} width={headSize.w/2} height={0.3} fill={shadeColor(finalHairColor, 20)} opacity="0.3" />
                                            {isFemale && (hairLength === 'long' || hairLength === 'very_long') && (
                                                <>
                                                    <rect x={20 - headSize.w/2 - 2} y={16 - headSize.h + 2} width={2} height={torsoHeight} fill={finalHairColor} />
                                                    <rect x={20 + headSize.w/2} y={16 - headSize.h + 2} width={2} height={torsoHeight} fill={finalHairColor} />
                                                    {/* Hair shine */}
                                                    <rect x={20 - headSize.w/2 - 1.5} y={16 - headSize.h + 4} width={0.5} height={torsoHeight - 2} fill={shadeColor(finalHairColor, 20)} opacity="0.3" />
                                                </>
                                            )}
                                        </>
                                    );
                            }
                        })()}
                        
                        {/* Headgear */}
                        {headgear && headgear.name && headgear.name.toLowerCase() !== 'none' && (
                            <g>
                                {/* Rare headgear glow effect */}
                                {(headgear.rarity === 'Rare' || headgear.rarity === 'Epic' || headgear.rarity === 'Legendary') && (
                                    <g>
                                        <ellipse cx="20" cy={16 - headSize.h/2} rx={headSize.w/2 + 2} ry={headSize.h/2 + 2} fill="#ffd700" opacity="0.15" />
                                        <ellipse cx="20" cy={16 - headSize.h/2} rx={headSize.w/2 + 1} ry={headSize.h/2 + 1} fill="#fff" opacity="0.05" />
                                        <animateTransform attributeName="transform" type="rotate" values={`0 20 ${16 - headSize.h/2};360 20 ${16 - headSize.h/2}`} dur="8s" repeatCount="indefinite" />
                                    </g>
                                )}
                                {(() => {
                                    const headName = headgear.name.toLowerCase();
                                    const headArchetype = getItemArchetypeMax(headgear.name);
                                    
                                    // Great Helm - full coverage
                                    if (headName.includes('great helm') || headName.includes('crusader')) {
                                        return (
                                            <g>
                                                <rect x={20 - headSize.w/2 - 1} y={16 - headSize.h - 2} width={headSize.w + 2} height={headSize.h + 2} fill="#71717a" />
                                                <rect x={20 - headSize.w/2} y={16 - headSize.h - 1} width={headSize.w} height={headSize.h} fill="#a1a1aa" />
                                                {/* Eye slits */}
                                                <Pixel x={20 + headSize.w/2 - 2} y={16 - headSize.h + 2} w={1} h={0.5} color="#000000" />
                                                {/* Cross pattern */}
                                                <Pixel x={20} y={16 - headSize.h + 2} w={0.5} h={3} color="#71717a" />
                                                <Pixel x={19} y={16 - headSize.h + 3} w={2.5} h={0.5} color="#71717a" />
                                            </g>
                                        );
                                    }
                                    
                                    // Conical/Norman helm with nasal guard
                                    if (headName.includes('conical') || headName.includes('norman') || headName.includes('nasal')) {
                                        return (
                                            <g>
                                                <path d={`M ${20 - headSize.w/2} ${15 - headSize.h + 1} L ${20} ${15 - headSize.h - 3} L ${20 + headSize.w/2} ${15 - headSize.h + 1} Z`} fill="#a1a1aa" />
                                                {/* Nasal guard */}
                                                <Pixel x={20 + headSize.w/2 - 2} y={16 - headSize.h + 1} w={0.5} h={3} color="#71717a" />
                                            </g>
                                        );
                                    }
                                    
                                    // Viking/Spangenhelm with face guard
                                    if (headName.includes('viking') || headName.includes('spangenhelm')) {
                                        return (
                                            <g>
                                                <ellipse cx="20" cy={16 - headSize.h/2} rx={headSize.w/2 + 1} ry={headSize.h/2} fill="#71717a" />
                                                <ellipse cx="20" cy={16 - headSize.h/2} rx={headSize.w/2} ry={headSize.h/2 - 0.5} fill="#a1a1aa" />
                                                {/* Nose guard */}
                                                <Pixel x={20 + headSize.w/2 - 2} y={16 - headSize.h + 2} w={0.5} h={2} color="#71717a" />
                                                {/* Eye guards */}
                                                <Pixel x={20 + headSize.w/2 - 3} y={16 - headSize.h + 2} w={2} h={0.5} color="#71717a" />
                                            </g>
                                        );
                                    }
                                    
                                    // Samurai kabuto
                                    if (headName.includes('kabuto') || headName.includes('samurai')) {
                                        return (
                                            <g>
                                                <ellipse cx="20" cy={16 - headSize.h/2} rx={headSize.w/2 + 1} ry={headSize.h/2} fill="#8b0000" />
                                                {/* Neck guard */}
                                                <rect x={20 - headSize.w/2 - 2} y={15 - 2} width={headSize.w + 4} height={2} fill="#8b0000" opacity="0.7" />
                                                {/* Horn decoration */}
                                                <Pixel x={20 - headSize.w/2} y={16 - headSize.h - 2} w={0.5} h={2} color="#ffd700" />
                                                <Pixel x={20 + headSize.w/2} y={16 - headSize.h - 2} w={0.5} h={2} color="#ffd700" />
                                            </g>
                                        );
                                    }
                                    
                                    // Basic helmet
                                    if (headName.includes('helmet')) {
                                        return <rect x={20 - headSize.w/2 - 1} y={16 - headSize.h - 2} width={headSize.w + 2} height={3} fill={'#a1a1aa'} />;
                                    }
                                    
                                    // Cap
                                    if (headName.includes('cap')) {
                                        return <rect x={20 - headSize.w/2 - 1} y={16 - headSize.h - 2} width={headSize.w + 2} height={2} fill={secondaryColor} />;
                                    }
                                    
                                    // Crown
                                    if (headName.includes('crown')) {
                                        return (
                                            <g>
                                                <rect x={20 - headSize.w/2} y={16 - headSize.h - 2} width={headSize.w} height={2} fill={'#ffd700'} />
                                                {/* Crown points */}
                                                <Pixel x={20 - headSize.w/2 + 1} y={16 - headSize.h - 3} w={0.5} h={1} color="#ffd700" />
                                                <Pixel x={20} y={16 - headSize.h - 3} w={0.5} h={1} color="#ffd700" />
                                                <Pixel x={20 + headSize.w/2 - 1} y={16 - headSize.h - 3} w={0.5} h={1} color="#ffd700" />
                                            </g>
                                        );
                                    }
                                    
                                    // Turban
                                    if (headName.includes('turban') || headArchetype?.includes('TURBAN')) {
                                        return <ellipse cx="20" cy={16 - headSize.h} rx={headSize.w/2 + 1} ry={3} fill={secondaryColor || '#4B0082'} />;
                                    }
                                    
                                    // Hood
                                    if (headName.includes('hood') || headArchetype?.includes('HOOD')) {
                                        return (
                                            <g>
                                                <rect x={20 - headSize.w/2 - 2} y={16 - headSize.h - 1} width={headSize.w + 4} height={headSize.h} 
                                                      fill={secondaryColor || '#2F2F2F'} opacity="0.8" />
                                                <rect x={20 - headSize.w/2} y={16 - headSize.h + 1} width={headSize.w} height={headSize.h - 2} 
                                                      fill={skinColor} />
                                            </g>
                                        );
                                    }
                                    
                                    return null;
                                })()}
                            </g>
                        )}

                        {/* Profile Facial Features - only one eye visible */}
                        {(() => {
                            const headCenterY = 14 - headSize.h/2;
                            const eyeY = headCenterY - 1;
                            const mouthY = headCenterY + headSize.h/3;

                            return (
                                <>
                                    {/* Single visible eye in profile */}
                                    <g>
                                        {/* Eye white */}
                                        <ellipse cx={21} cy={eyeY} rx={0.8} ry={0.7} fill="#ffffff" />
                                        {/* Iris with actual eye color */}
                                        <ellipse cx={21.2} cy={eyeY} rx={0.5} ry={0.6} fill={eyeColor} />
                                        {/* Pupil */}
                                        <ellipse cx={21.3} cy={eyeY} rx={0.25} ry={0.3} fill="#000000" />
                                    </g>

                                    {/* Single eyebrow in profile */}
                                    <rect x={20} y={eyeY - 1} width={1.5} height={0.3} fill={hairColor} />

                                    {/* Profile mouth */}
                                    <line x1={21} y1={mouthY} x2={22.5} y2={mouthY}
                                          stroke={shadeColor(skinColor, 10)} strokeWidth="0.3" />
                                </>
                            );
                        })()}

                        {/* Cultural Markings System */}
                        {character.appearance.markings && character.appearance.markings.map((marking, idx) => {
                            if (!marking.location.includes('face') && !marking.location.includes('forehead') && !marking.location.includes('cheek')) {
                                return null;
                            }

                            const headCenterY = 16 - headSize.h/2;
                            const markingColor = marking.color || '#000000';

                            switch(marking.type) {
                                case 'tattoo':
                                    // Cultural tattoo patterns
                                    if (marking.pattern === 'tribal_lines') {
                                        return (
                                            <g key={idx}>
                                                <line x1={20 - headSize.w/3} y1={headCenterY - headSize.h/3}
                                                      x2={20 - headSize.w/3} y2={headCenterY}
                                                      stroke={markingColor} strokeWidth="0.4" opacity="0.7" />
                                                <line x1={20 + headSize.w/3} y1={headCenterY - headSize.h/3}
                                                      x2={20 + headSize.w/3} y2={headCenterY}
                                                      stroke={markingColor} strokeWidth="0.4" opacity="0.7" />
                                            </g>
                                        );
                                    } else if (marking.pattern === 'dots') {
                                        return (
                                            <g key={idx}>
                                                <circle cx={20} cy={headCenterY - headSize.h/3} r="0.3" fill={markingColor} opacity="0.7" />
                                                <circle cx={20 - 1} cy={headCenterY - headSize.h/3} r="0.3" fill={markingColor} opacity="0.7" />
                                                <circle cx={20 + 1} cy={headCenterY - headSize.h/3} r="0.3" fill={markingColor} opacity="0.7" />
                                            </g>
                                        );
                                    }
                                    break;

                                case 'scar':
                                    // Battle scars
                                    const scarY = marking.location.includes('forehead') ? headCenterY - headSize.h/3 :
                                                 marking.location.includes('cheek') ? headCenterY : headCenterY - headSize.h/6;
                                    return (
                                        <line key={idx}
                                              x1={20 - (marking.size === 'large' ? 2 : 1)} y1={scarY - 0.5}
                                              x2={20 + (marking.size === 'large' ? 2 : 1)} y2={scarY + 0.5}
                                              stroke={shadeColor(skinColor, -30)} strokeWidth="0.3" opacity="0.6" />
                                    );

                                case 'paint':
                                    // War paint or ceremonial paint
                                    if (marking.pattern === 'stripes') {
                                        return (
                                            <g key={idx}>
                                                <rect x={20 - headSize.w/2.5} y={headCenterY - headSize.h/4}
                                                      width={headSize.w/5} height={headSize.h/2}
                                                      fill={markingColor} opacity="0.5" />
                                                <rect x={20 + headSize.w/2.5 - headSize.w/5} y={headCenterY - headSize.h/4}
                                                      width={headSize.w/5} height={headSize.h/2}
                                                      fill={markingColor} opacity="0.5" />
                                            </g>
                                        );
                                    } else if (marking.pattern === 'mask') {
                                        return (
                                            <ellipse key={idx}
                                                    cx={20} cy={headCenterY - headSize.h/6}
                                                    rx={headSize.w/2} ry={headSize.h/4}
                                                    fill={markingColor} opacity="0.4" />
                                        );
                                    }
                                    break;

                                case 'freckles':
                                    // Natural freckles
                                    return (
                                        <g key={idx}>
                                            {[...Array(5)].map((_, i) => (
                                                <circle key={i}
                                                        cx={20 + (i - 2) * 0.8}
                                                        cy={headCenterY - headSize.h/6 + (i % 2) * 0.5}
                                                        r="0.15" fill={shadeColor(skinColor, 20)} opacity="0.3" />
                                            ))}
                                        </g>
                                    );

                                case 'beauty_mark':
                                    return (
                                        <circle key={idx}
                                                cx={20 + (marking.location.includes('left') ? -headSize.w/4 : headSize.w/4)}
                                                cy={headCenterY + headSize.h/6}
                                                r="0.2" fill="#3d2314" />
                                    );
                            }
                            return null;
                        })}

                        {/* Expression/Affect System */}
                        {(() => {
                            const affect = character.appearance.affect || 'neutral';
                            const headCenterY = 16 - headSize.h/2;
                            const mouthY = headCenterY + headSize.h/4;

                            // Modify mouth based on affect
                            if (affect === 'friendly') {
                                // Slight smile
                                return (
                                    <path d={`M${20 - 1.5},${mouthY} Q${20},${mouthY + 0.5} ${20 + 1.5},${mouthY}`}
                                          stroke={shadeColor(skinColor, 10)} strokeWidth="0.2" fill="none" opacity="0.5" />
                                );
                            } else if (affect === 'guarded' || affect === 'anxious') {
                                // Tense/straight mouth
                                return (
                                    <line x1={20 - 1} y1={mouthY + 0.2} x2={20 + 1} y2={mouthY + 0.2}
                                          stroke={shadeColor(skinColor, 10)} strokeWidth="0.2" opacity="0.5" />
                                );
                            } else if (affect === 'intimidating') {
                                // Slight frown
                                return (
                                    <path d={`M${20 - 1.5},${mouthY + 0.2} Q${20},${mouthY - 0.2} ${20 + 1.5},${mouthY + 0.2}`}
                                          stroke={shadeColor(skinColor, 10)} strokeWidth="0.2" fill="none" opacity="0.5" />
                                );
                            }
                            return null;
                        })()}

                        {/* Age-Based Effects */}
                        {age && age > 40 && (
                            <g opacity="0.3">
                                {/* Wrinkles around eyes */}
                                {age > 50 && (
                                    <>
                                        <line x1={20 - headSize.w/4 - 1} y1={16 - headSize.h/2 - headSize.h/6 - 0.5}
                                              x2={20 - headSize.w/4 - 1.5} y2={16 - headSize.h/2 - headSize.h/6}
                                              stroke={shadeColor(skinColor, -10)} strokeWidth="0.15" />
                                        <line x1={20 + headSize.w/4 + 1} y1={16 - headSize.h/2 - headSize.h/6 - 0.5}
                                              x2={20 + headSize.w/4 + 1.5} y2={16 - headSize.h/2 - headSize.h/6}
                                              stroke={shadeColor(skinColor, -10)} strokeWidth="0.15" />
                                    </>
                                )}
                                {/* Forehead lines */}
                                {age > 60 && (
                                    <>
                                        <line x1={20 - headSize.w/3} y1={16 - headSize.h + 1}
                                              x2={20 + headSize.w/3} y2={16 - headSize.h + 1}
                                              stroke={shadeColor(skinColor, -10)} strokeWidth="0.15" />
                                        <line x1={20 - headSize.w/3} y1={16 - headSize.h + 1.5}
                                              x2={20 + headSize.w/3} y2={16 - headSize.h + 1.5}
                                              stroke={shadeColor(skinColor, -10)} strokeWidth="0.15" />
                                    </>
                                )}
                            </g>
                        )}

                        {/* Skin Texture/Weathering Effects */}
                        {character.appearance.skinTexture && (
                            <g opacity="0.2">
                                {character.appearance.skinTexture === 'weathered' && (
                                    <>
                                        {/* Sun damage/weathering */}
                                        <ellipse cx={20 - headSize.w/4} cy={16 - headSize.h/2}
                                                rx={0.5} ry={0.3} fill={shadeColor(skinColor, 15)} />
                                        <ellipse cx={20 + headSize.w/4} cy={16 - headSize.h/2}
                                                rx={0.5} ry={0.3} fill={shadeColor(skinColor, 15)} />
                                    </>
                                )}
                                {character.appearance.skinTexture === 'rough' && (
                                    <>
                                        {/* Rough texture dots */}
                                        {[...Array(3)].map((_, i) => (
                                            <circle key={i} cx={20 + (i - 1)} cy={16 - headSize.h/2 + (i % 2) * 0.3}
                                                    r="0.1" fill={shadeColor(skinColor, -5)} />
                                        ))}
                                    </>
                                )}
                            </g>
                        )}
                        
                        {/* Facial Hair aligned with new face position */}
                        {facialHair && !isFemale && (
                            <>
                                {(facialHairStyle === 'mustache' || facialHairStyle === 'full_beard') && <rect x={20 - 1.5} y={16 - headSize.h/4} width={3} height={0.8} fill={finalHairColor} />}
                                {(facialHairStyle === 'goatee' || facialHairStyle === 'full_beard') && <rect x={20 - 0.75} y={16 - headSize.h/4 + 1} width={1.5} height={1.5} fill={finalHairColor} />}
                            </>
                        )}

                        {/* Enhanced Jewelry System */}
                        {jewelry && jewelry.map((item, idx) => {
                            const material = item.material || 'silver';
                            const materialColor = material === 'gold' ? '#fbbf24' :
                                                 material === 'silver' ? '#e5e7eb' :
                                                 material === 'copper' ? '#ea580c' :
                                                 material === 'jade' ? '#16a34a' :
                                                 material === 'pearl' ? '#fef3c7' : '#e5e7eb';
                            const headCenterY = 16 - headSize.h/2;

                            switch(item.type) {
                                case 'earrings':
                                    return (
                                        <g key={idx}>
                                            {/* Left ear */}
                                            <circle cx={20 - headSize.w/2 - 0.5} cy={headCenterY} r="0.6"
                                                    fill={shadeColor(materialColor, -20)} />
                                            <circle cx={20 - headSize.w/2 - 0.5} cy={headCenterY} r="0.4"
                                                    fill={materialColor} />
                                            {item.style === 'hoop' && (
                                                <circle cx={20 - headSize.w/2 - 0.5} cy={headCenterY} r="0.3"
                                                        fill="none" stroke={materialColor} strokeWidth="0.1" />
                                            )}
                                            {/* Right ear */}
                                            <circle cx={20 + headSize.w/2 + 0.5} cy={headCenterY} r="0.6"
                                                    fill={shadeColor(materialColor, -20)} />
                                            <circle cx={20 + headSize.w/2 + 0.5} cy={headCenterY} r="0.4"
                                                    fill={materialColor} />
                                        </g>
                                    );

                                case 'necklace':
                                    return (
                                        <g key={idx}>
                                            <path d={`M${20 - headSize.w/2},${16 - 1} Q${20},${16} ${20 + headSize.w/2},${16 - 1}`}
                                                  stroke={materialColor} strokeWidth="0.3" fill="none" />
                                            {item.style === 'pendant' && (
                                                <circle cx={20} cy={16 + 0.5} r="0.4" fill={materialColor} />
                                            )}
                                            {item.style === 'beaded' && (
                                                [...Array(5)].map((_, i) => (
                                                    <circle key={i} cx={20 + (i - 2) * 1.5} cy={16 - 0.5 + Math.abs(i - 2) * 0.2}
                                                            r="0.2" fill={materialColor} />
                                                ))
                                            )}
                                        </g>
                                    );

                                case 'nose_ring':
                                    return (
                                        <circle key={idx} cx={20 - 0.3} cy={16 - headSize.h/2 + headSize.h/3}
                                                r="0.3" fill="none" stroke={materialColor} strokeWidth="0.1" />
                                    );

                                case 'face_piercings':
                                    if (item.location === 'eyebrow') {
                                        return (
                                            <circle key={idx} cx={20 - headSize.w/4} cy={16 - headSize.h/2 - headSize.h/6 - 1}
                                                    r="0.15" fill={materialColor} />
                                        );
                                    } else if (item.location === 'lip') {
                                        return (
                                            <circle key={idx} cx={20 - 0.8} cy={16 - headSize.h/2 + headSize.h/4}
                                                    r="0.15" fill={materialColor} />
                                        );
                                    }
                                    break;
                            }
                            return null;
                        })}

                        {/* Glasses/Spectacles if present */}
                        {character.appearance.hasGlasses && (
                            <g>
                                {(() => {
                                    const glassesStyle = character.appearance.glassesStyle || 'round';
                                    const headCenterY = 16 - headSize.h/2;
                                    const eyeY = headCenterY - headSize.h/6;

                                    if (glassesStyle === 'round') {
                                        return (
                                            <>
                                                <circle cx={20 - headSize.w/4} cy={eyeY} r="1.5"
                                                        fill="none" stroke="#525252" strokeWidth="0.1" />
                                                <circle cx={20 + headSize.w/4} cy={eyeY} r="1.5"
                                                        fill="none" stroke="#525252" strokeWidth="0.1" />
                                                <line x1={20 - headSize.w/4 + 1.5} y1={eyeY}
                                                      x2={20 + headSize.w/4 - 1.5} y2={eyeY}
                                                      stroke="#525252" strokeWidth="0.1" />
                                            </>
                                        );
                                    } else if (glassesStyle === 'square') {
                                        return (
                                            <>
                                                <rect x={20 - headSize.w/4 - 1.5} y={eyeY - 1} width="3" height="2"
                                                      fill="none" stroke="#525252" strokeWidth="0.1" />
                                                <rect x={20 + headSize.w/4 - 1.5} y={eyeY - 1} width="3" height="2"
                                                      fill="none" stroke="#525252" strokeWidth="0.1" />
                                                <line x1={20 - headSize.w/4 + 1.5} y1={eyeY}
                                                      x2={20 + headSize.w/4 - 1.5} y2={eyeY}
                                                      stroke="#525252" strokeWidth="0.1" />
                                            </>
                                        );
                                    }
                                    return null;
                                })()}
                            </g>
                        )}
                    </g>
                    
                    {/* Ultra-enhanced weapon arm with physics and effects */}
                    <g className={`weapon-arm-assembly ${animation}`}>
                       {/* Anticipation ghost for power attacks */}
                       {animation === 'power_strike' && (
                           <g className="anticipation-ghost" opacity="0.3">
                               {/* Right arm with slight bend */}
                           <g transform={`rotate(${animation === 'idle' ? -3 : 0} ${22} ${15})`}>
                               {renderArmJointed(isFemale ? 22.5 : 23, 15, isFemale ? 1.8 : 2.2, torsoHeight, clothingColor, true)}
                           </g>
                           </g>
                       )}

                       <g transform={`translate(${animation === 'defending' || animation === 'blocking' && offHandItem ? -4 : 0}, 0)`}>
                          {animation === 'defending' && offHandItem?.name.toLowerCase().includes('shield') && renderShield()}

                          {/* Main weapon arm positioned forward for combat */}
                          <g className="jointed-weapon-arm">
                              {renderArmJointed(24, 15, 2.5, torsoHeight, clothingColor, true)}

                              {/* Weapon with motion effects */}
                              {mainHandItem && animation !== 'defending' && (
                                <g className="weapon-system">
                                    {/* Motion blur for fast attacks */}
                                    {(animation === 'slashing' || animation === 'chopping') && (
                                        <g className="motion-blur" opacity="0.4">
                                            <g transform={`translate(20, ${15 + torsoHeight * 0.85}) rotate(-30)`}>
                                                {renderWeapon(mainHandItem)}
                                            </g>
                                            <g transform={`translate(24, ${15 + torsoHeight * 0.85}) rotate(30)`} opacity="0.2">
                                                {renderWeapon(mainHandItem)}
                                            </g>
                                        </g>
                                    )}

                                    {/* Main weapon properly gripped in hand at combat position */}
                                    <g
                                        className="weapon-in-hand"
                                        transform={`translate(25, ${15 + torsoHeight * 0.7})`}
                                        style={{
                                            transformOrigin: 'center center',
                                            filter: animation === 'power_strike' ? 'drop-shadow(0 0 4px #fbbf24)' : 'none'
                                        }}
                                    >
                                        {/* Weapon held at combat angle pointing toward opponent */}
                                        <g transform="translate(2, -3) rotate(-45)">
                                            {renderWeapon(mainHandItem)}
                                        </g>

                                        {/* Hand gripping effect - fingers wrapping around weapon */}
                                        <g className="grip-effect">
                                            <rect x="-0.5" y="-2" width="0.8" height="2.5" fill={shadeColor(skinColor, -20)} opacity="0.6" rx="0.2" />
                                            <rect x="0.5" y="-1.5" width="0.6" height="2" fill={shadeColor(skinColor, -15)} opacity="0.5" rx="0.2" />
                                            <rect x="-1" y="-1" width="0.4" height="1.5" fill={shadeColor(skinColor, -25)} opacity="0.4" rx="0.1" />
                                        </g>

                                        {/* Weapon gleam effect during attacks */}
                                        {(animation === 'attacking' || animation === 'slashing') && (
                                            <g className="weapon-gleam">
                                                <line x1="0" y1="-8" x2="0" y2="-2"
                                                      stroke="#ffffff" strokeWidth="0.5" opacity="0.8"
                                                      style={{
                                                          animation: 'gleamFlash 0.3s ease-out'
                                                      }} />
                                            </g>
                                        )}
                                    </g>
                                </g>
                              )}
                          </g>
                       </g>
                    </g>

                    {jewelry?.find(j => j.type === 'necklace') && (
                        <g>
                            <ellipse cx="20" cy="15.5" rx="3" ry="0.8" fill="none" 
                                     stroke={jewelry.find(j=>j.type==='necklace')?.material === 'gold' ? '#fcd34d' : '#e5e7eb'} 
                                     strokeWidth="0.5" />
                            <circle cx="20" cy="16.5" r="1" 
                                    fill={jewelry.find(j=>j.type==='necklace')?.material === 'gold' ? '#fcd34d' : '#e5e7eb'} />
                            <circle cx="20" cy="16.5" r="0.5" 
                                    fill={jewelry.find(j=>j.type==='necklace')?.material === 'gold' ? '#fbbf24' : '#f3f4f6'} />
                        </g>
                    )}
                </g>
            </g>
            <style>
                {`
                    /* Realistic Combat Stance Animations */
                    @keyframes combat-stance-sway {
                        0%, 100% {
                            transform: translateX(0) translateY(0) rotate(0deg);
                        }
                        25% {
                            transform: translateX(-0.3px) translateY(-0.2px) rotate(-0.3deg);
                        }
                        50% {
                            transform: translateX(0) translateY(-0.3px) rotate(0deg);
                        }
                        75% {
                            transform: translateX(0.3px) translateY(-0.2px) rotate(0.3deg);
                        }
                    }

                    .animate-sprite-idle-bob {
                        animation: combat-stance-sway 5s ease-in-out infinite;
                        transform-origin: 20px 35px;
                    }

                    @keyframes weight-shift {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(0.2px); }
                    }

                    .legs {
                        animation: weight-shift 5s ease-in-out infinite;
                    }

                    /* Advanced physics-based animations with anticipation */
                    .attacking .upper-arm-segment {
                        animation: attackUpperArmAdvanced 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    }
                    .attacking .forearm-segment {
                        animation: attackForearmAdvanced 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    }
                    .attacking .weapon-in-hand {
                        animation: attackWeaponAdvanced 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    }
                    .attacking .arm-shadow {
                        animation: shadowFollowAttack 0.8s ease-out;
                    }

                    @keyframes attackUpperArmAdvanced {
                        0% { transform: rotate(0deg) scale(1); }
                        15% { transform: rotate(8deg) scale(1.02); } /* anticipation */
                        30% { transform: rotate(-35deg) scale(0.98); } /* wind-up */
                        45% { transform: rotate(-40deg) scale(0.97); } /* pause */
                        65% { transform: rotate(50deg) scale(1.05); } /* strike */
                        80% { transform: rotate(45deg) scale(1.03); } /* follow-through */
                        100% { transform: rotate(0deg) scale(1); } /* settle */
                    }

                    @keyframes attackForearmAdvanced {
                        0% { transform: rotate(0deg); }
                        15% { transform: rotate(-5deg); } /* anticipation */
                        30% { transform: rotate(-65deg); } /* wind-up */
                        45% { transform: rotate(-70deg); } /* pause */
                        65% { transform: rotate(95deg); } /* strike */
                        80% { transform: rotate(85deg); } /* follow-through */
                        100% { transform: rotate(0deg); } /* settle */
                    }

                    @keyframes attackWeaponAdvanced {
                        0% { transform: rotate(0deg); }
                        15% { transform: rotate(3deg); } /* anticipation */
                        30% { transform: rotate(-18deg); } /* wind-up */
                        45% { transform: rotate(-20deg); } /* pause */
                        65% { transform: rotate(35deg); } /* strike */
                        80% { transform: rotate(30deg); } /* follow-through */
                        100% { transform: rotate(0deg); } /* settle */
                    }

                    @keyframes shadowFollowAttack {
                        0% { transform: translateX(0) translateY(0) scale(1); opacity: 0.2; }
                        30% { transform: translateX(-2px) translateY(-1px) scale(0.9); opacity: 0.3; }
                        65% { transform: translateX(3px) translateY(1px) scale(1.1); opacity: 0.1; }
                        100% { transform: translateX(0) translateY(0) scale(1); opacity: 0.2; }
                    }

                    /* Weapon effects */
                    @keyframes gleamFlash {
                        0% { opacity: 0; transform: translateY(5px); }
                        50% { opacity: 1; transform: translateY(-2px); }
                        100% { opacity: 0; transform: translateY(-8px); }
                    }

                    .motion-blur {
                        animation: blurTrail 0.4s ease-out;
                    }

                    @keyframes blurTrail {
                        0% { opacity: 0; }
                        30% { opacity: 0.6; }
                        100% { opacity: 0; }
                    }

                    .anticipation-ghost {
                        animation: ghostAnticipation 1.2s ease-in-out;
                    }

                    @keyframes ghostAnticipation {
                        0% { opacity: 0; transform: scale(1); }
                        25% { opacity: 0.4; transform: scale(1.05) rotate(-5deg); }
                        50% { opacity: 0.2; transform: scale(0.95) rotate(10deg); }
                        100% { opacity: 0; transform: scale(1); }
                    }

                    /* Slashing with smooth arc */
                    .slashing .upper-arm-segment {
                        animation: slashUpperArm 0.7s ease-in-out;
                    }
                    .slashing .forearm-segment {
                        animation: slashForearm 0.7s ease-in-out;
                    }

                    @keyframes slashUpperArm {
                        0% { transform: rotate(0deg); }
                        25% { transform: rotate(-45deg); }
                        50% { transform: rotate(60deg); }
                        75% { transform: rotate(30deg); }
                        100% { transform: rotate(0deg); }
                    }

                    @keyframes slashForearm {
                        0% { transform: rotate(0deg); }
                        25% { transform: rotate(-30deg); }
                        50% { transform: rotate(120deg); }
                        75% { transform: rotate(45deg); }
                        100% { transform: rotate(0deg); }
                    }

                    /* Chopping with overhead arc */
                    .chopping .upper-arm-segment {
                        animation: chopUpperArm 0.9s ease-in-out;
                    }
                    .chopping .forearm-segment {
                        animation: chopForearm 0.9s ease-in-out;
                    }

                    @keyframes chopUpperArm {
                        0% { transform: rotate(0deg); }
                        30% { transform: rotate(-90deg); }
                        60% { transform: rotate(80deg); }
                        100% { transform: rotate(0deg); }
                    }

                    @keyframes chopForearm {
                        0% { transform: rotate(0deg); }
                        30% { transform: rotate(-45deg); }
                        60% { transform: rotate(110deg); }
                        100% { transform: rotate(0deg); }
                    }

                    /* Stabbing with thrust motion */
                    .stabbing .upper-arm-segment {
                        animation: stabUpperArm 0.6s ease-in-out;
                    }
                    .stabbing .forearm-segment {
                        animation: stabForearm 0.6s ease-in-out;
                    }

                    @keyframes stabUpperArm {
                        0% { transform: rotate(0deg); }
                        30% { transform: rotate(-20deg); }
                        60% { transform: rotate(15deg) translateX(10px); }
                        100% { transform: rotate(0deg); }
                    }

                    @keyframes stabForearm {
                        0% { transform: rotate(0deg); }
                        30% { transform: rotate(20deg); }
                        60% { transform: rotate(-10deg) translateX(15px); }
                        100% { transform: rotate(0deg); }
                    }

                    /* Power strike with wind-up */
                    .power_strike .upper-arm-segment {
                        animation: powerUpperArm 1.2s ease-in-out;
                    }
                    .power_strike .forearm-segment {
                        animation: powerForearm 1.2s ease-in-out;
                    }

                    @keyframes powerUpperArm {
                        0% { transform: rotate(0deg); }
                        30% { transform: rotate(-100deg) scale(1.05); }
                        60% { transform: rotate(90deg) scale(1.1); }
                        100% { transform: rotate(0deg) scale(1); }
                    }

                    @keyframes powerForearm {
                        0% { transform: rotate(0deg); }
                        30% { transform: rotate(-80deg); }
                        60% { transform: rotate(130deg); }
                        100% { transform: rotate(0deg); }
                    }

                    /* Shooting bow animation */
                    .shooting .upper-arm-segment {
                        animation: shootUpperArm 0.8s ease-in-out;
                    }
                    .shooting .forearm-segment {
                        animation: shootForearm 0.8s ease-in-out;
                    }

                    @keyframes shootUpperArm {
                        0% { transform: rotate(0deg); }
                        40% { transform: rotate(-25deg) translateX(-5px); }
                        60% { transform: rotate(-30deg) translateX(-7px); }
                        100% { transform: rotate(0deg); }
                    }

                    @keyframes shootForearm {
                        0% { transform: rotate(0deg); }
                        40% { transform: rotate(-40deg); }
                        60% { transform: rotate(-45deg); }
                        80% { transform: rotate(10deg); }
                        100% { transform: rotate(0deg); }
                    }

                    /* Idle animation - subtle breathing */
                    .idle .upper-arm-segment {
                        animation: idleUpperArm 3s ease-in-out infinite;
                    }

                    @keyframes idleUpperArm {
                        0%, 100% { transform: rotate(0deg); }
                        50% { transform: rotate(2deg); }
                    }

                    /* Damaged recoil */
                    .damaged .upper-arm-segment {
                        animation: damagedUpperArm 0.6s ease-out;
                    }
                    .damaged .forearm-segment {
                        animation: damagedForearm 0.6s ease-out;
                    }

                    @keyframes damagedUpperArm {
                        0% { transform: rotate(0deg); }
                        30% { transform: rotate(-20deg) translateX(-5px); }
                        100% { transform: rotate(0deg); }
                    }

                    @keyframes damagedForearm {
                        0% { transform: rotate(0deg); }
                        30% { transform: rotate(-30deg); }
                        100% { transform: rotate(0deg); }
                    }

                    /* Enhanced idle animations with micro-movements */
                    .idle .upper-arm-segment {
                        animation: idleUpperArm 4s ease-in-out infinite;
                    }
                    .idle .torso-breathing {
                        animation: chestBreathing 3s ease-in-out infinite;
                    }
                    .idle .flowing-garment {
                        animation: gentleClothPhysics 5s ease-in-out infinite;
                    }
                    .idle .cape-flutter {
                        animation: capeIdle 4s ease-in-out infinite;
                    }

                    @keyframes chestBreathing {
                        0%, 100% { transform: scale(1) translateY(0); }
                        50% { transform: scale(1.02) translateY(-0.5px); }
                    }

                    @keyframes gentleClothPhysics {
                        0%, 100% { transform: translateX(0) skewX(0deg); }
                        33% { transform: translateX(0.5px) skewX(0.5deg); }
                        66% { transform: translateX(-0.5px) skewX(-0.5deg); }
                    }

                    @keyframes capeIdle {
                        0%, 100% { transform: translateX(0) rotate(0deg); }
                        25% { transform: translateX(1px) rotate(1deg); }
                        50% { transform: translateX(0) rotate(0deg); }
                        75% { transform: translateX(-1px) rotate(-1deg); }
                    }

                    /* Enhanced damage reactions */
                    .damaged .torso-breathing {
                        animation: damagedTorso 0.8s ease-out;
                    }
                    .damaged .flowing-garment {
                        animation: clothDamagePhysics 0.8s ease-out;
                    }

                    @keyframes damagedTorso {
                        0% { transform: scale(1) translateX(0); }
                        20% { transform: scale(0.95) translateX(-3px) skewX(-2deg); }
                        40% { transform: scale(0.9) translateX(-5px) skewX(-3deg); }
                        70% { transform: scale(1.02) translateX(1px) skewX(1deg); }
                        100% { transform: scale(1) translateX(0) skewX(0deg); }
                    }

                    @keyframes clothDamagePhysics {
                        0% { transform: translateX(0) skewX(0deg); }
                        30% { transform: translateX(-4px) skewX(-5deg); }
                        60% { transform: translateX(2px) skewX(3deg); }
                        100% { transform: translateX(0) skewX(0deg); }
                    }

                    /* Combat breathing */
                    .attacking .torso-breathing,
                    .slashing .torso-breathing,
                    .chopping .torso-breathing {
                        animation: combatBreathing 0.8s ease-in-out;
                    }

                    @keyframes combatBreathing {
                        0% { transform: scale(1) translateY(0); }
                        20% { transform: scale(1.05) translateY(-1px); }
                        50% { transform: scale(1.08) translateY(-2px); }
                        100% { transform: scale(1) translateY(0); }
                    }

                    /* Cape physics during combat */
                    .slashing .cape-flutter,
                    .chopping .cape-flutter {
                        animation: combatCapePhysics 0.7s ease-out;
                    }

                    @keyframes combatCapePhysics {
                        0% { transform: translateX(0) rotate(0deg); }
                        30% { transform: translateX(-5px) rotate(-8deg); }
                        60% { transform: translateX(8px) rotate(12deg); }
                        100% { transform: translateX(0) rotate(0deg); }
                    }\n\n                    /* Left arm (non-weapon) animations for balance */\n                    .attacking .left-arm-assembly .upper-arm-segment {\n                        animation: leftArmAttack 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);\n                    }\n                    .attacking .left-arm-assembly .forearm-segment {\n                        animation: leftForearmAttack 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);\n                    }\n\n                    @keyframes leftArmAttack {\n                        0% { transform: rotate(0deg); }\n                        15% { transform: rotate(-5deg); }\n                        30% { transform: rotate(15deg); }\n                        45% { transform: rotate(18deg); }\n                        65% { transform: rotate(-20deg); }\n                        80% { transform: rotate(-15deg); }\n                        100% { transform: rotate(0deg); }\n                    }\n\n                    @keyframes leftForearmAttack {\n                        0% { transform: rotate(0deg); }\n                        15% { transform: rotate(10deg); }\n                        30% { transform: rotate(-25deg); }\n                        45% { transform: rotate(-30deg); }\n                        65% { transform: rotate(35deg); }\n                        80% { transform: rotate(25deg); }\n                        100% { transform: rotate(0deg); }\n                    }\n\n                    /* Left arm idle breathing */\n                    .idle .left-arm-assembly .upper-arm-segment {\n                        animation: leftIdleArm 4s ease-in-out infinite;\n                    }\n\n                    @keyframes leftIdleArm {\n                        0%, 100% { transform: rotate(0deg); }\n                        25% { transform: rotate(-1deg); }\n                        50% { transform: rotate(-2deg); }\n                        75% { transform: rotate(-1deg); }\n                    }\n\n                    /* Left arm damage reaction */\n                    .damaged .left-arm-assembly .upper-arm-segment {\n                        animation: leftArmDamaged 0.8s ease-out;\n                    }\n                    .damaged .left-arm-assembly .forearm-segment {\n                        animation: leftForearmDamaged 0.8s ease-out;\n                    }\n\n                    @keyframes leftArmDamaged {\n                        0% { transform: rotate(0deg); }\n                        15% { transform: rotate(25deg) translateX(5px); }\n                        30% { transform: rotate(30deg) translateX(6px); }\n                        60% { transform: rotate(-10deg) translateX(-1px); }\n                        100% { transform: rotate(0deg); }\n                    }\n\n                    @keyframes leftForearmDamaged {\n                        0% { transform: rotate(0deg); }\n                        15% { transform: rotate(-25deg); }\n                        30% { transform: rotate(-30deg); }\n                        60% { transform: rotate(10deg); }\n                        100% { transform: rotate(0deg); }\n                    }\n                `}\n            </style>
        </svg>
    );
};

export default CombatSprite;
