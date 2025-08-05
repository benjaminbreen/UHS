/**
 * CombatSprite - Enhanced procedurally generated, animated, side-profile combat sprite
 * with historically accurate clothing, weapons, equipment, and detailed combat animations
 * in polished pixel-art style with clear gender differentiation.
 */
import React, { useMemo } from 'react';
import { PlayerCharacter, NpcEntity, Appearance, Item } from '../../types';

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
                        {offHandItem?.name.toLowerCase().includes('shield') && renderShield()}
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
