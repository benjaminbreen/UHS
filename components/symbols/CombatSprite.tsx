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

// Helper function for color shading
const shadeColor = (hex: string, percent: number): string => {
    if (!hex || typeof hex !== 'string' || hex.length < 4) return '#000000';
    try {
        let R = parseInt(hex.substring(1, 3), 16);
        let G = parseInt(hex.substring(3, 5), 16);
        let B = parseInt(hex.substring(5, 7), 16);

        R = Math.floor(R * (100 + percent) / 100);
        G = Math.floor(G * (100 + percent) / 100);
        B = Math.floor(B * (100 + percent) / 100);

        R = (R < 255) ? R : 255;
        G = (G < 255) ? G : 255;
        B = (B < 255) ? B : 255;
        
        R = (R > 0) ? R : 0;
        G = (G > 0) ? G : 0;
        B = (B > 0) ? B : 0;

        const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
        const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
        const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

        return "#" + RR + GG + BB;
    } catch (e) {
        return hex;
    }
};

const Pixel: React.FC<{ x: number; y: number; color: string; w?: number; h?: number; }> = ({ x, y, color, w = 1, h = 1 }) => (
    <rect x={x} y={y} width={w} height={h} fill={color} shapeRendering="crispEdges" />
);

const CombatSprite: React.FC<CombatSpriteProps> = ({ character, animation, facing }) => {
    const { gender, age, appearance, equippedItems } = character;
    const {
        skinColor, hairColor, eyeColor, build, facialHair, facialHairStyle, garment, jewelry, headgear, hairLength
    } = appearance as Appearance;
    const { primary: clothingColor, secondary: secondaryColor } = appearance.palette;

    const mainHandItem = equippedItems?.main_hand;
    const offHandItem = equippedItems?.off_hand;
    const armorItem = equippedItems?.armor || equippedItems?.chest;

    const animationClasses: Record<Animation, string> = {
        idle: 'animate-sprite-idle-bob',
        attacking: 'animate-sprite-attack-forward',
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
    
    const renderWeapon = (item: Item) => {
        const name = item.name.toLowerCase();
        const archetype = getItemArchetypeMax(name);
        
        // Check for specific weapon types first
        if (name.includes('sword') || name.includes('blade')) {
            return (
                <g>
                    <Pixel x={10} y={-8} w={1} h={10} color="#c0c0c0" />
                    <Pixel x={9} y={2} w={3} h={1} color="#8b4513" />
                    <Pixel x={10} y={-9} w={1} h={1} color="#e5e5e5" />
                </g>
            );
        }
        if (name.includes('axe')) {
            return (
                <g>
                    <Pixel x={10} y={-7} w={1} h={10} color="#8b4513" />
                    <Pixel x={8} y={-8} w={5} h={3} color="#a1a1aa" />
                    <Pixel x={9} y={-9} w={3} h={1} color="#e5e5e5" />
                </g>
            );
        }
        if (name.includes('stick') || name.includes('club') || name.includes('mace')) {
            return <Pixel x={10} y={-8} w={1.5} h={12} color="#8b4513" />;
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
            <g className={animationClass} style={{ transformOrigin: 'center bottom', '--direction': facing === 'left' ? -1 : 1 } as React.CSSProperties}>
                <g style={{ transform: `scaleX(${facing === 'left' ? -1 : 1})`, transformOrigin: 'center' }}>
                    
                    {/* Shadow */}
                    <ellipse cx="20" cy="35" rx="7" ry="2" fill="rgba(0,0,0,0.3)" />

                    {/* Back Arm */}
                    <g transform="translate(14, 15)">
                        {offHandItem && (offHandItem.name.toLowerCase().includes('shield') || getItemArchetypeMax(offHandItem.name)?.includes('SHIELD')) && renderShield()}
                    </g>
                    <Pixel x={16} y={15} w={2} h={7} color={clothingShadow} />
                    <Pixel x={16} y={22} w={2} h={3} color={skinShadow} />
                    
                    {/* Legs & Feet */}
                    <Pixel x={17.5} y={24} w={2.5} h={legHeight} color={shadeColor(secondaryColor, -10)} />
                    <Pixel x={20.5} y={24} w={2.5} h={legHeight} color={secondaryColor} />
                    <Pixel x={17} y={24 + legHeight} w={3} h={2} color="#4a2c17" />
                    <Pixel x={20.5} y={24 + legHeight} w={3} h={2} color="#38220f" />

                    {/* Torso & Clothing */}
                    <rect x={20 - bodyWidth/2} y={15} width={bodyWidth} height={torsoHeight} fill={clothingShadow} />
                    <rect x={20 - bodyWidth/2} y={15} width={bodyWidth} height={torsoHeight - 1} fill={clothingColor} />
                    {(garment.name.toLowerCase().includes('robe') || garment.name.toLowerCase().includes('dress')) && (
                        <rect x={20 - bodyWidth/2} y={15 + torsoHeight} width={bodyWidth} height={legHeight - 2} fill={clothingColor} />
                    )}
                    {(garment.material?.toLowerCase().includes('plate') || garment.material?.toLowerCase().includes('chainmail')) && (
                        <rect x={20 - bodyWidth/2 + 1} y={16} width={1.5} height={torsoHeight-2} fill="#e5e7eb" opacity="0.4" />
                    )}
                    
                    {/* Armor/Hide Overlays based on baseSprites archetypes */}
                    {armorItem && (() => {
                        const armorName = armorItem.name.toLowerCase();
                        const armorArchetype = getItemArchetypeMax(armorItem.name);
                        
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
                                {headgear.name.toLowerCase().includes('cap') && <rect x={20 - headSize.w/2 - 1} y={15 - headSize.h - 2} width={headSize.w + 2} height={2} fill={secondaryColor} />}
                                {headgear.name.toLowerCase().includes('helmet') && <rect x={20 - headSize.w/2 - 1} y={15 - headSize.h - 2} width={headSize.w + 2} height={3} fill={'#a1a1aa'} />}
                                {headgear.name.toLowerCase().includes('crown') && <rect x={20 - headSize.w/2} y={15 - headSize.h - 2} width={headSize.w} height={2} fill={'#fcd34d'} />}
                                {/* Additional headgear from baseSprites */}
                                {(() => {
                                    const headArchetype = getItemArchetypeMax(headgear.name);
                                    if (headgear.name.toLowerCase().includes('turban') || headArchetype?.includes('TURBAN')) {
                                        return <ellipse cx="20" cy={15 - headSize.h} rx={headSize.w/2 + 1} ry={3} fill={secondaryColor || '#4B0082'} />;
                                    }
                                    if (headgear.name.toLowerCase().includes('hood') || headArchetype?.includes('HOOD')) {
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

                        {/* Eye & Face */}
                        <Pixel x={20 + headSize.w/2 - 2} y={15 - headSize.h + 2} color={eyeColor} w={1} />
                        {isFemale && <Pixel x={20 + headSize.w/2 - 2} y={15 - headSize.h + 1.5} w={1.5} h={0.5} color="#27272a" />}
                        
                        {/* Facial Hair */}
                        {facialHair && !isFemale && (
                            <>
                                {(facialHairStyle === 'mustache' || facialHairStyle === 'full_beard') && <rect x={20 + headSize.w/2 - 3.5} y={15 - headSize.h + 4} width={3} height={1} fill={finalHairColor} />}
                                {(facialHairStyle === 'goatee' || facialHairStyle === 'full_beard') && <rect x={20 + headSize.w/2 - 2.5} y={15 - headSize.h + 5} width={1.5} height={2} fill={finalHairColor} />}
                            </>
                        )}

                        {jewelry?.find(j => j.type === 'earrings') && (
                            <Pixel x={20 - headSize.w/2} y={15 - headSize.h + 4} color={jewelry.find(j=>j.type==='earrings')?.material === 'gold' ? '#fcd34d' : '#e5e7eb'} />
                        )}
                    </g>
                    
                    {/* Front Arm & Weapon */}
                    <g className={animation === 'attacking' ? 'animate-sprite-arm-swing' : ''} style={{ transformOrigin: `${20}px 17px` }}>
                       <g transform={`translate(${animation === 'defending' && offHandItem ? -4 : 0}, 0)`}>
                          {animation === 'defending' && offHandItem?.name.toLowerCase().includes('shield') && renderShield()}
                          <Pixel x={22} y={15} w={2.5} h={torsoHeight * 0.8} color={clothingColor} />
                          <Pixel x={22} y={15 + torsoHeight * 0.8} w={2.5} h={torsoHeight * 0.3} color={skinColor} />
                          {mainHandItem && animation !== 'defending' && (
                            <g transform={`translate(23, ${15 + torsoHeight})`}>
                                {renderWeapon(mainHandItem)}
                            </g>
                          )}
                       </g>
                    </g>

                    {jewelry?.find(j => j.type === 'necklace') && (
                        <Pixel x={20 - 1} y={15} color={jewelry.find(j=>j.type==='necklace')?.material === 'gold' ? '#fcd34d' : '#e5e7eb'} w={2} />
                    )}
                </g>
            </g>
        </svg>
    );
};

export default CombatSprite;
