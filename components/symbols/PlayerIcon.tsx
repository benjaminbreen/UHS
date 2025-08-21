/**
 * components/symbols/PlayerIcon.tsx - Data-driven pixel art character sprite
 */
import React from 'react';
import { PlayerCharacter, OverallHealthStatus } from '../../types';

interface PlayerIconProps {
  x: number;
  y: number;
  character: PlayerCharacter;
}

const PlayerIcon: React.FC<PlayerIconProps> = React.memo(({ x, y, character }) => {
  if (!character.appearance) {
    // Render a fallback or loading state if appearance data is not ready
    return null; 
  }
  
  const { gender, equippedItems } = character;
  const {
    skinColor, hairColor, build, facialHair, facialHairStyle, hairLength, jewelry
  } = character.appearance;
  
  // Debug logging
  console.log('[PlayerIcon] Equipment Debug:', {
    hasEquippedItems: !!equippedItems,
    equippedHead: equippedItems?.head,
    equippedTorso: equippedItems?.torso,
    appearanceHeadgear: character.appearance.headgear,
    appearanceGarment: character.appearance.garment,
  });
  
  // If equippedItems exists, use that (even if slots are empty)
  // Only fall back to appearance if equippedItems doesn't exist
  let headgear = null;
  let garment = null;
  
  if (equippedItems !== undefined) {
    // Use equipped items (may be undefined if nothing equipped)
    headgear = equippedItems.head;
    garment = equippedItems.torso;
  } else {
    // Fall back to appearance only if equippedItems doesn't exist
    headgear = character.appearance.headgear;
    garment = character.appearance.garment;
  }
  
  const isNaked = !garment; // Track if torso is bare
  
  console.log('[PlayerIcon] Using:', {
    headgear: headgear?.name || 'none',
    garment: garment?.name || 'none (naked)',
    isNaked,
  });
  
  const { primary: clothingColor, secondary: secondaryColor, accent: accentColor } = character.appearance.palette;
  
  // Determine glow color based on disease state
  let glowColor = '#fbbf24'; // Default amber
  let glowOpacity = 0.9;
  
  if (character.health && typeof character.health === 'object' && 'overallHealthStatus' in character.health) {
    const diseaseHealth = character.health as any; // TODO: Fix typing once PlayerCharacter is updated
    switch (diseaseHealth.overallHealthStatus) {
      case 'critical':
        glowColor = '#8B0000'; // Dark red with red tinge
        glowOpacity = 1.0;
        break;
      case 'sick':
        glowColor = '#228B22'; // Sickly green
        glowOpacity = 0.95;
        break;
      case 'mild':
        glowColor = '#9ACD32'; // Yellow-green
        glowOpacity = 0.85;
        break;
      case 'healthy':
      default:
        // Check for any active diseases even if overall status is healthy
        if (diseaseHealth.currentDiseases && diseaseHealth.currentDiseases.length > 0) {
          glowColor = '#FFF8DC'; // Pale yellow for minor illness
          glowOpacity = 0.8;
        }
        break;
    }
  }
  
  // Body size variations based on build
  const isBroad = build === 'stocky' || build === 'imposing';
  const bodyWidth = isBroad ? 6.0 : 5.6;
  const bodyHeight = isBroad ? 4.4 : 5.2;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <filter id={`playerGlow-${character.id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5"/>
          <feOffset dx="0" dy="0" result="offsetblur"/>
          <feFlood floodColor={glowColor} floodOpacity={glowOpacity}/>
          <feComposite in2="offsetblur" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <style>
          {`
            @keyframes pixelBob-${character.id} {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-1px); }
            }
            .pixelBob-${character.id} {
              animation: pixelBob-${character.id} 2.5s ease-in-out infinite;
              transform-origin: center;
            }
          `}
        </style>
      </defs>
      
      <g className={`pixelBob-${character.id}`} filter={`url(#playerGlow-${character.id})`}>
        {/* Pixel shadow */}
        <rect x="-4" y="8" width="8" height="2" fill="rgba(0,0,0,0.4)" rx="1" />
        
        {/* FRONT VIEW (default for now) */}
        <>
            {/* Hair - improved pixel art rendering with curved edges */}
            {(!headgear || headgear.name === 'None' || headgear.name === 'none' || 
              // Show hair with hats but not with full coverage items
              (!headgear.name.toLowerCase().includes('helmet') && 
               !headgear.name.toLowerCase().includes('hood') &&
               !headgear.name.toLowerCase().includes('turban'))) && (
              <>
                {hairLength === 'bald' ? null : 
                 hairLength === 'very_short' ? (
                   <>
                     {/* Very short hair - pixelated edges */}
                     <rect x="-2" y="-6.8" width="4" height="0.8" fill={hairColor} />
                     <rect x="-2.5" y="-6.3" width="5" height="0.5" fill={hairColor} />
                     <rect x="-2.8" y="-5.8" width="0.6" height="1.5" fill={hairColor} />
                     <rect x="2.2" y="-5.8" width="0.6" height="1.5" fill={hairColor} />
                   </>
                 ) : hairLength === 'short' ? (
                   <>
                     {/* Short hair with rounded top */}
                     <rect x="-1.5" y="-7.3" width="3" height="0.3" fill={hairColor} />
                     <rect x="-2" y="-7" width="4" height="0.5" fill={hairColor} />
                     <rect x="-2.5" y="-6.5" width="5" height="1.5" fill={hairColor} />
                     <rect x="-2.8" y="-5" width="0.8" height="1.5" fill={hairColor} />
                     <rect x="2" y="-5" width="0.8" height="1.5" fill={hairColor} />
                   </>
                 ) : hairLength === 'long' || hairLength === 'very_long' ? (
                   <>
                     {/* Long hair with curved top and flowing sides */}
                     <rect x="-1.5" y="-7.8" width="3" height="0.3" fill={hairColor} />
                     <rect x="-2" y="-7.5" width="4" height="0.5" fill={hairColor} />
                     <rect x="-2.5" y="-7" width="5" height="0.5" fill={hairColor} />
                     <rect x="-3" y="-6.5" width="6" height="2.5" fill={hairColor} />
                     {/* Long hair flowing down sides */}
                     <rect x="-3.2" y="-4" width="1" height="4" fill={hairColor} />
                     <rect x="2.2" y="-4" width="1" height="4" fill={hairColor} />
                     {hairLength === 'very_long' && (
                       <>
                         <rect x="-3.5" y="0" width="0.8" height="2" fill={hairColor} />
                         <rect x="2.7" y="0" width="0.8" height="2" fill={hairColor} />
                       </>
                     )}
                   </>
                 ) : (
                   /* Medium hair with pixel curves */
                   <>
                     <rect x="-1.5" y="-7.3" width="3" height="0.3" fill={hairColor} />
                     <rect x="-2" y="-7" width="4" height="0.5" fill={hairColor} />
                     <rect x="-2.5" y="-6.5" width="5" height="1" fill={hairColor} />
                     <rect x="-3" y="-5.5" width="6" height="1.5" fill={hairColor} />
                     <rect x="-3" y="-4" width="0.8" height="1.5" fill={hairColor} />
                     <rect x="2.2" y="-4" width="0.8" height="1.5" fill={hairColor} />
                   </>
                 )}
              </>
            )}
            
            {/* Headgear - better rendering with color parsing */}
            {headgear && headgear.name !== 'None' && headgear.name !== 'none' && (() => {
              const name = headgear.name.toLowerCase();
              
              // Parse color from name
              let headgearColor = secondaryColor;
              const colorMap: Record<string, string> = {
                'silver-white': '#E8E8E8',
                'silver': '#C0C0C0',
                'gold': '#FFD700',
                'golden': '#FFD700',
                'black': '#1C1C1C',
                'white': '#F8F8F8',
                'red': '#DC143C',
                'blue': '#4169E1',
                'green': '#228B22',
                'brown': '#8B4513',
                'orchid': '#DA70D6',
                'crimson': '#DC143C',
                'azure': '#007FFF',
                'emerald': '#50C878',
              };
              
              for (const [colorName, colorHex] of Object.entries(colorMap)) {
                if (name.includes(colorName)) {
                  headgearColor = colorHex;
                  break;
                }
              }
              
              // Material fallbacks
              if (headgear.material) {
                const mat = headgear.material.toLowerCase();
                if (mat.includes('leather') && !name.match(/silver|gold|white|black/)) headgearColor = '#8B4513';
                else if (mat.includes('straw')) headgearColor = '#F4E68C';
                else if (mat.includes('felt')) headgearColor = '#708090';
              }
              
              return (
                <>
                  {name.includes('cap') || name.includes('beanie') ? (
                    <>
                      <rect x="-3" y="-8" width="6" height="3" fill={headgearColor} rx="0.5" />
                      {/* Add detail line */}
                      <rect x="-2.5" y="-6" width="5" height="0.3" fill="rgba(0,0,0,0.2)" />
                    </>
                  ) : name.includes('helmet') ? (
                    <>
                      <rect x="-3.5" y="-8.5" width="7" height="4.5" fill="#a1a1aa" rx="0.3" />
                      <rect x="-2" y="-7.5" width="1" height="0.5" fill="#e5e7eb" />
                      {/* Nose guard */}
                      <rect x="-0.3" y="-4.5" width="0.6" height="1.5" fill="#a1a1aa" />
                    </>
                  ) : (name.includes('crown') || name.includes('tiara')) ? (
                    <>
                      <rect x="-2.5" y="-7.5" width="5" height="1.5" fill="#fcd34d" />
                      {/* Crown points */}
                      <rect x="-2" y="-8.5" width="0.8" height="1" fill="#fcd34d" />
                      <rect x="-0.4" y="-9" width="0.8" height="1.5" fill="#fcd34d" />
                      <rect x="1.2" y="-8.5" width="0.8" height="1" fill="#fcd34d" />
                      {/* Jewel */}
                      <rect x="-0.3" y="-7.2" width="0.6" height="0.6" fill="#DC143C" />
                    </>
                  ) : name.includes('turban') ? (
                    <>
                      <ellipse cx="0" cy="-6.5" rx="3.5" ry="2.8" fill={headgearColor} />
                      {/* Turban jewel */}
                      <circle cx="0" cy="-6.5" r="0.4" fill="#DC143C" />
                    </>
                  ) : name.includes('hood') ? (
                    <>
                      {/* Hood shape */}
                      <path d="M -3.5 -4 Q -3.5 -8, 0 -8.5 Q 3.5 -8, 3.5 -4 L 3 -3 L -3 -3 Z" fill={headgearColor} />
                      {/* Shadow inside hood */}
                      <rect x="-2" y="-6" width="4" height="2" fill="rgba(0,0,0,0.3)" />
                    </>
                  ) : name.includes('straw') || name.includes('hat') ? (
                    <>
                      {/* Wide brim hat */}
                      <ellipse cx="0" cy="-6" rx="5" ry="0.8" fill={headgearColor} />
                      {/* Crown */}
                      <rect x="-2" y="-8" width="4" height="2.5" fill={headgearColor} rx="0.5" />
                    </>
                  ) : (
                    /* Default simple cap */
                    <rect x="-3" y="-7.5" width="6" height="2" fill={headgearColor} rx="0.3" />
                  )}
                </>
              );
            })()}
            
            {/* Head - pixel art curves for less blocky appearance */}
            {/* Top of head - curved */}
            <rect x="-1.5" y="-4.8" width="3" height="0.3" fill={skinColor} />
            <rect x="-2" y="-4.5" width="4" height="0.5" fill={skinColor} />
            {/* Main head */}
            <rect x="-2.5" y="-4" width="5" height="3.5" fill={skinColor} />
            {/* Chin area - narrower for rounded bottom */}
            <rect x="-2" y="-0.5" width="4" height="0.5" fill={skinColor} />
            <rect x="-1.5" y="0" width="3" height="0.3" fill={skinColor} />
            
            {/* Eyes */}
            <rect x="-1.5" y="-3.5" width="0.8" height="0.8" fill="#000" />
            <rect x="0.7" y="-3.5" width="0.8" height="0.8" fill="#000" />
            <rect x="-1.3" y="-3.3" width="0.3" height="0.3" fill="#fff" />
            <rect x="0.9" y="-3.3" width="0.3" height="0.3" fill="#fff" />
            
            {/* Nose - simple indication */}
            <rect x="-0.2" y="-2.5" width="0.4" height="0.6" fill={skinColor} style={{filter: 'brightness(0.9)'}} />
            
            {/* Mouth - simple line or shape */}
            <rect x="-0.8" y="-1.5" width="1.6" height="0.3" fill="rgba(0,0,0,0.3)" />
            
            {/* Body - slightly rounded shoulders */}
            {/* Render bare skin if no garment, otherwise use clothing color */}
            <rect x={-bodyWidth/2 + 0.3} y="0.3" width={bodyWidth - 0.6} height="0.3" fill={isNaked ? skinColor : clothingColor} />
            <rect x={-bodyWidth/2} y="0.6" width={bodyWidth} height={bodyHeight - 0.6} fill={isNaked ? skinColor : clothingColor} />
            
            {/* Arms - show full arm if naked, otherwise show sleeves */}
            {/* Left arm */}
            <rect x="-4.2" y="0.6" width="1.4" height="1.8" fill={isNaked ? skinColor : clothingColor} /> {/* Upper arm/Sleeve */}
            <rect x="-4" y="2.4" width="1.2" height="1.6" fill={skinColor} /> {/* Forearm */}
            {/* Right arm */}
            <rect x="2.8" y="0.6" width="1.4" height="1.8" fill={isNaked ? skinColor : clothingColor} /> {/* Upper arm/Sleeve */}
            <rect x="2.8" y="2.4" width="1.2" height="1.6" fill={skinColor} /> {/* Forearm */}
            
            {/* Hands - connected to forearms */}
            <rect x="-4" y="4" width="1.2" height="1" fill={skinColor} />
            <rect x="2.8" y="4" width="1.2" height="1" fill={skinColor} />
            
            {/* Legs */}
            <rect x="-1.5" y="4" width="1.3" height="5" fill={secondaryColor} />
            <rect x="0.2" y="4" width="1.3" height="5" fill={secondaryColor} />
            
            {/* Feet */}
            <rect x="-1.8" y="9" width="1.8" height="1.2" fill="#654321" />
            <rect x="0" y="9" width="1.8" height="1.2" fill="#654321" />

            {/* Facial hair with styles */}
            {facialHair && gender === 'Male' && (
              <>
                {(facialHairStyle === 'mustache' || facialHairStyle === 'full_beard') && (
                  <rect x="-1.5" y="-2" width="3" height="0.6" fill={hairColor} />
                )}
                {(facialHairStyle === 'goatee' || facialHairStyle === 'full_beard') && (
                  <rect x="-1" y="-1.5" width="2" height="1.5" fill={hairColor} rx="0.3" />
                )}
              </>
            )}
            
            {/* Jewelry */}
            {jewelry && jewelry.length > 0 && jewelry.map((item, idx) => (
              <React.Fragment key={`jewelry-${idx}`}>
                {item.type === 'necklace' && (
                  <rect x="-1" y="0.5" width="2" height="0.4" fill={item.material === 'gold' ? '#fcd34d' : '#e5e7eb'} />
                )}
                {item.type === 'earrings' && (
                  <>
                    <circle cx="-2.5" cy="-2.5" r="0.3" fill={item.material === 'gold' ? '#fcd34d' : '#e5e7eb'} />
                    <circle cx="2.5" cy="-2.5" r="0.3" fill={item.material === 'gold' ? '#fcd34d' : '#e5e7eb'} />
                  </>
                )}
              </React.Fragment>
            ))}
            
            {/* Simple clothing patterns */}
            {garment && garment.material && (
              <>
                {(garment.material.toLowerCase().includes('silk') || garment.material.toLowerCase().includes('fine')) && (
                  <circle cx="0" cy="2" r="0.3" fill="rgba(255,255,255,0.5)" />
                )}
                {garment.material.toLowerCase().includes('striped') && (
                  <>
                    <rect x={-bodyWidth/2} y="1" width={bodyWidth} height="0.3" fill={accentColor} opacity="0.7" />
                    <rect x={-bodyWidth/2} y="2.5" width={bodyWidth} height="0.3" fill={accentColor} opacity="0.7" />
                  </>
                )}
              </>
            )}
            
            {/* Equipped weapon */}
            {equippedItems?.main_hand && (
              <>
                {equippedItems.main_hand.name.toLowerCase().includes('sword') || equippedItems.main_hand.name.toLowerCase().includes('blade') ? (
                  <>
                    <rect x="4.5" y="1" width="0.6" height="6" fill="#a1a1aa" />
                    <rect x="4.2" y="1" width="1.2" height="0.8" fill="#8b4513" />
                  </>
                ) : equippedItems.main_hand.name.toLowerCase().includes('axe') ? (
                  <>
                    <rect x="4.5" y="1" width="0.5" height="5" fill="#8b4513" />
                    <rect x="4" y="0.5" width="1.5" height="1.5" fill="#a1a1aa" />
                  </>
                ) : (equippedItems.main_hand.name.toLowerCase().includes('staff') || equippedItems.main_hand.name.toLowerCase().includes('stick')) ? (
                  <rect x="4.5" y="-1" width="0.7" height="8" fill="#8b4513" />
                ) : null}
              </>
            )}
        </>
      </g>
    </g>
  );
});

export default PlayerIcon;