/**
 * CombatSprite - Enhanced procedurally generated, animated, side-profile combat sprite
 * with historically accurate clothing, weapons, equipment, and detailed combat animations
 * in polished pixel-art style with clear gender differentiation.
 */
import React, { useMemo } from 'react';
import { PlayerCharacter, NpcEntity, Appearance, Item } from '../../types';
import { getItemArchetypeMax } from '../../constants/items/baseSprites';

type Animation = 'idle' | 'attacking' | 'item' | 'damaged' | 'defending' | 'fleeing';

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
    };
    const animationClass = animationClasses[animation] || 'animate-sprite-idle-bob';

    const isFemale = gender === 'Female';
    const isOld = age && age > 55;
    const finalHairColor = isOld ? '#a0a0a0' : hairColor;

    // --- Proportions based on Build and Gender ---
    const { bodyWidth, shoulderWidth, torsoHeight, legHeight, headSize, bodyYOffset } = useMemo(() => {
        let baseBodyWidth = isFemale ? 5.5 : 6.5;
        let baseShoulderWidth = isFemale ? 6.5 : 8;
        let baseTorsoHeight = 8;
        let baseLegHeight = 9;
        let headSize = { w: 6, h: 6 };

        switch (build) {
            case 'slight': baseBodyWidth *= 0.9; baseShoulderWidth *= 0.9; break;
            case 'stocky': case 'imposing': baseBodyWidth *= 1.1; baseShoulderWidth *= 1.1; break;
            case 'tall': baseTorsoHeight *= 1.1; baseLegHeight *= 1.1; break;
            case 'short': baseTorsoHeight *= 0.9; baseLegHeight *= 0.9; break;
        }

        return { bodyWidth: baseBodyWidth, shoulderWidth: baseShoulderWidth, torsoHeight: baseTorsoHeight, legHeight: baseLegHeight, headSize, bodyYOffset: 24 - baseLegHeight - baseTorsoHeight };
    }, [build, isFemale, character.appearance.height]);

    const skinShadow = shadeColor(skinColor, -15);
    const skinHighlight = shadeColor(skinColor, 10);
    const clothingShadow = shadeColor(clothingColor, -20);
    const clothingHighlight = shadeColor(clothingColor, 15);
    const hairShadow = shadeColor(finalHairColor, -20);
    
    // Enhanced body part rendering for more detail
    const renderArm = (x: number, y: number, width: number, height: number, color: string, isWeaponArm: boolean = false) => {
        const shoulderWidth = width * 1.2;
        const elbowY = y + height * 0.5;
        const wristY = y + height * 0.85;
        
        return (
            <g className={isWeaponArm && animation === 'attacking' ? 'animate-sprite-arm-swing' : ''}>
                {/* Upper arm with shoulder */}
                <Pixel x={x} y={y} w={shoulderWidth} h={height * 0.5} color={color} enhanced />
                <Pixel x={x + shoulderWidth * 0.2} y={y} w={shoulderWidth * 0.6} h={2} color={shadeColor(color, 15)} />
                
                {/* Elbow joint */}
                <Pixel x={x + width * 0.1} y={elbowY} w={width * 0.8} h={2} color={shadeColor(color, -10)} />
                
                {/* Forearm */}
                <Pixel x={x + width * 0.1} y={elbowY} w={width * 0.8} h={height * 0.35} color={color} enhanced />
                
                {/* Hand */}
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
        
        // Enhanced weapon gleam effect for attacking animation
        const showGleam = animation === 'attacking';
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

    return (
        <svg viewBox="0 0 40 40" width="100%" height="100%" style={{ imageRendering: 'pixelated', overflow: 'visible' }}>
            {/* SVG filters for better rendering */}
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
            <g className={animationClass} style={{ transformOrigin: 'center bottom', '--direction': facing === 'left' ? -1 : 1 } as React.CSSProperties}>
                <g style={{ transform: `scaleX(${facing === 'left' ? -1 : 1})`, transformOrigin: 'center' }} filter="url(#sprite-outline)">
                    
                    {/* Shadow */}
                    <ellipse cx="20" cy="35" rx="7" ry="2" fill="rgba(0,0,0,0.3)" />

                    {/* Back Arm with better detail */}
                    <g transform="translate(14, 15)">
                        {offHandItem && (offHandItem.name.toLowerCase().includes('shield') || getItemArchetypeMax(offHandItem.name)?.includes('SHIELD')) && renderShield()}
                    </g>
                    {renderArm(16, 15, 2.5, 8, clothingShadow, false)}
                    
                    {/* Enhanced Legs with knee and boot detail */}
                    {renderLeg(17.5, 24, 2.5, legHeight + 2, shadeColor(secondaryColor, -10), "#4a2c17")}
                    {renderLeg(20.5, 24, 2.5, legHeight + 2, secondaryColor, "#38220f")}

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
                                {/* Base torso */}
                                <rect x={20 - bodyWidth/2} y={15} width={bodyWidth} height={torsoHeight} fill={shadeColor(baseColor, -20)} />
                                <rect x={20 - bodyWidth/2} y={15} width={bodyWidth} height={torsoHeight - 1} fill={baseColor} />
                                
                                {/* Robe/dress extension for flowing garments */}
                                {(armorCategory === 'robes' || armorCategory === 'cultural' || armorCategory === 'formal') && 
                                 (torsoItem?.name.toLowerCase().includes('robe') || torsoItem?.name.toLowerCase().includes('dress') || torsoItem?.name.toLowerCase().includes('gown')) && (
                                    <rect x={20 - bodyWidth/2} y={15 + torsoHeight} width={bodyWidth} height={legHeight - 2} fill={baseColor} opacity="0.8" />
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

                    {/* Head */}
                    <g transform="translate(0, 0)">
                        <rect x={20 - headSize.w/2} y={15 - headSize.h} width={headSize.w} height={headSize.h} fill={skinShadow} />
                        <rect x={20 - headSize.w/2} y={15 - headSize.h} width={headSize.w - 1} height={headSize.h - 1} fill={skinColor} />
                        
                        {/* Hair */}
                        <rect x={20 - headSize.w/2 - 1} y={15 - headSize.h - 1} width={headSize.w + 1} height={3} fill={hairShadow} />
                        <rect x={20 - headSize.w/2 - 1} y={15 - headSize.h - 1} width={headSize.w + 1} height={2} fill={finalHairColor} />
                        {isFemale && (hairLength === 'long' || hairLength === 'very_long') &&
                            <rect x={20 - headSize.w/2 - 2} y={15 - headSize.h + 2} width={2} height={torsoHeight} fill={finalHairColor} />
                        }
                        
                        {/* Headgear */}
                        {headgear && headgear.name && headgear.name.toLowerCase() !== 'none' && (
                            <g>
                                {/* Rare headgear glow effect */}
                                {(headgear.rarity === 'Rare' || headgear.rarity === 'Epic' || headgear.rarity === 'Legendary') && (
                                    <g>
                                        <ellipse cx="20" cy={15 - headSize.h/2} rx={headSize.w/2 + 2} ry={headSize.h/2 + 2} fill="#ffd700" opacity="0.15" />
                                        <ellipse cx="20" cy={15 - headSize.h/2} rx={headSize.w/2 + 1} ry={headSize.h/2 + 1} fill="#fff" opacity="0.05" />
                                        <animateTransform attributeName="transform" type="rotate" values={`0 20 ${15 - headSize.h/2};360 20 ${15 - headSize.h/2}`} dur="8s" repeatCount="indefinite" />
                                    </g>
                                )}
                                {(() => {
                                    const headName = headgear.name.toLowerCase();
                                    const headArchetype = getItemArchetypeMax(headgear.name);
                                    
                                    // Great Helm - full coverage
                                    if (headName.includes('great helm') || headName.includes('crusader')) {
                                        return (
                                            <g>
                                                <rect x={20 - headSize.w/2 - 1} y={15 - headSize.h - 2} width={headSize.w + 2} height={headSize.h + 2} fill="#71717a" />
                                                <rect x={20 - headSize.w/2} y={15 - headSize.h - 1} width={headSize.w} height={headSize.h} fill="#a1a1aa" />
                                                {/* Eye slits */}
                                                <Pixel x={20 + headSize.w/2 - 2} y={15 - headSize.h + 2} w={1} h={0.5} color="#000000" />
                                                {/* Cross pattern */}
                                                <Pixel x={20} y={15 - headSize.h + 2} w={0.5} h={3} color="#71717a" />
                                                <Pixel x={19} y={15 - headSize.h + 3} w={2.5} h={0.5} color="#71717a" />
                                            </g>
                                        );
                                    }
                                    
                                    // Conical/Norman helm with nasal guard
                                    if (headName.includes('conical') || headName.includes('norman') || headName.includes('nasal')) {
                                        return (
                                            <g>
                                                <path d={`M ${20 - headSize.w/2} ${15 - headSize.h + 1} L ${20} ${15 - headSize.h - 3} L ${20 + headSize.w/2} ${15 - headSize.h + 1} Z`} fill="#a1a1aa" />
                                                {/* Nasal guard */}
                                                <Pixel x={20 + headSize.w/2 - 2} y={15 - headSize.h + 1} w={0.5} h={3} color="#71717a" />
                                            </g>
                                        );
                                    }
                                    
                                    // Viking/Spangenhelm with face guard
                                    if (headName.includes('viking') || headName.includes('spangenhelm')) {
                                        return (
                                            <g>
                                                <ellipse cx="20" cy={15 - headSize.h/2} rx={headSize.w/2 + 1} ry={headSize.h/2} fill="#71717a" />
                                                <ellipse cx="20" cy={15 - headSize.h/2} rx={headSize.w/2} ry={headSize.h/2 - 0.5} fill="#a1a1aa" />
                                                {/* Nose guard */}
                                                <Pixel x={20 + headSize.w/2 - 2} y={15 - headSize.h + 2} w={0.5} h={2} color="#71717a" />
                                                {/* Eye guards */}
                                                <Pixel x={20 + headSize.w/2 - 3} y={15 - headSize.h + 2} w={2} h={0.5} color="#71717a" />
                                            </g>
                                        );
                                    }
                                    
                                    // Samurai kabuto
                                    if (headName.includes('kabuto') || headName.includes('samurai')) {
                                        return (
                                            <g>
                                                <ellipse cx="20" cy={15 - headSize.h/2} rx={headSize.w/2 + 1} ry={headSize.h/2} fill="#8b0000" />
                                                {/* Neck guard */}
                                                <rect x={20 - headSize.w/2 - 2} y={15 - 2} width={headSize.w + 4} height={2} fill="#8b0000" opacity="0.7" />
                                                {/* Horn decoration */}
                                                <Pixel x={20 - headSize.w/2} y={15 - headSize.h - 2} w={0.5} h={2} color="#ffd700" />
                                                <Pixel x={20 + headSize.w/2} y={15 - headSize.h - 2} w={0.5} h={2} color="#ffd700" />
                                            </g>
                                        );
                                    }
                                    
                                    // Basic helmet
                                    if (headName.includes('helmet')) {
                                        return <rect x={20 - headSize.w/2 - 1} y={15 - headSize.h - 2} width={headSize.w + 2} height={3} fill={'#a1a1aa'} />;
                                    }
                                    
                                    // Cap
                                    if (headName.includes('cap')) {
                                        return <rect x={20 - headSize.w/2 - 1} y={15 - headSize.h - 2} width={headSize.w + 2} height={2} fill={secondaryColor} />;
                                    }
                                    
                                    // Crown
                                    if (headName.includes('crown')) {
                                        return (
                                            <g>
                                                <rect x={20 - headSize.w/2} y={15 - headSize.h - 2} width={headSize.w} height={2} fill={'#ffd700'} />
                                                {/* Crown points */}
                                                <Pixel x={20 - headSize.w/2 + 1} y={15 - headSize.h - 3} w={0.5} h={1} color="#ffd700" />
                                                <Pixel x={20} y={15 - headSize.h - 3} w={0.5} h={1} color="#ffd700" />
                                                <Pixel x={20 + headSize.w/2 - 1} y={15 - headSize.h - 3} w={0.5} h={1} color="#ffd700" />
                                            </g>
                                        );
                                    }
                                    
                                    // Turban
                                    if (headName.includes('turban') || headArchetype?.includes('TURBAN')) {
                                        return <ellipse cx="20" cy={15 - headSize.h} rx={headSize.w/2 + 1} ry={3} fill={secondaryColor || '#4B0082'} />;
                                    }
                                    
                                    // Hood
                                    if (headName.includes('hood') || headArchetype?.includes('HOOD')) {
                                        return (
                                            <g>
                                                <rect x={20 - headSize.w/2 - 2} y={15 - headSize.h - 1} width={headSize.w + 4} height={headSize.h} 
                                                      fill={secondaryColor || '#2F2F2F'} opacity="0.8" />
                                                <rect x={20 - headSize.w/2} y={15 - headSize.h + 1} width={headSize.w} height={headSize.h - 2} 
                                                      fill={skinColor} />
                                            </g>
                                        );
                                    }
                                    
                                    return null;
                                })()}
                            </g>
                        )}

                        {/* Enhanced Eye & Face */}
                        <Pixel x={20 + headSize.w/2 - 2} y={15 - headSize.h + 2} color="#ffffff" w={1.5} h={1} />
                        <Pixel x={20 + headSize.w/2 - 1.7} y={15 - headSize.h + 2.1} color={eyeColor} w={1} h={0.8} />
                        <Pixel x={20 + headSize.w/2 - 1.5} y={15 - headSize.h + 2.2} color="#000000" w={0.6} h={0.6} />
                        {isFemale && <Pixel x={20 + headSize.w/2 - 2} y={15 - headSize.h + 1.5} w={1.5} h={0.5} color="#27272a" />}
                        
                        {/* Facial Hair */}
                        {facialHair && !isFemale && (
                            <>
                                {(facialHairStyle === 'mustache' || facialHairStyle === 'full_beard') && <rect x={20 + headSize.w/2 - 3.5} y={15 - headSize.h + 4} width={3} height={1} fill={finalHairColor} />}
                                {(facialHairStyle === 'goatee' || facialHairStyle === 'full_beard') && <rect x={20 + headSize.w/2 - 2.5} y={15 - headSize.h + 5} width={1.5} height={2} fill={finalHairColor} />}
                            </>
                        )}

                        {jewelry?.find(j => j.type === 'earrings') && (
                            <g>
                                <circle cx={20 - headSize.w/2 - 0.5} cy={15 - headSize.h + 4} r="0.8" 
                                        fill={jewelry.find(j=>j.type==='earrings')?.material === 'gold' ? '#fcd34d' : '#e5e7eb'} />
                                <circle cx={20 - headSize.w/2 - 0.5} cy={15 - headSize.h + 4} r="0.4" 
                                        fill={jewelry.find(j=>j.type==='earrings')?.material === 'gold' ? '#fbbf24' : '#f3f4f6'} />
                            </g>
                        )}
                    </g>
                    
                    {/* Enhanced Front Arm with weapon */}
                    <g className={animation === 'attacking' ? 'animate-sprite-arm-swing' : ''} style={{ transformOrigin: `${20}px 17px` }}>
                       <g transform={`translate(${animation === 'defending' && offHandItem ? -4 : 0}, 0)`}>
                          {animation === 'defending' && offHandItem?.name.toLowerCase().includes('shield') && renderShield()}
                          {renderArm(22, 15, 2.5, torsoHeight, clothingColor, true)}
                          {mainHandItem && animation !== 'defending' && (
                            <g transform={`translate(23, ${15 + torsoHeight})`}>
                                {renderWeapon(mainHandItem)}
                            </g>
                          )}
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
        </svg>
    );
};

export default CombatSprite;
