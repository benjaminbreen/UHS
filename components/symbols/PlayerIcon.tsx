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
    skinColor, hairColor, build, facialHair, facialHairStyle, hairLength, headgear, jewelry, garment
  } = character.appearance;
  
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
            {/* Hair - varied shapes based on hairLength */}
            {(!headgear || headgear.name === 'None' || headgear.name === 'none') && (
              <>
                {hairLength === 'bald' ? null : 
                 hairLength === 'very_short' || hairLength === 'short' ? (
                   <rect x="-2.5" y="-7" width="5" height="2.5" fill={hairColor} />
                 ) : hairLength === 'long' || hairLength === 'very_long' ? (
                   <>
                     <rect x="-3" y="-7" width="6" height="4" fill={hairColor} />
                     {/* Long hair flowing down */}
                     <rect x="-3.5" y="-3" width="1" height="3" fill={hairColor} />
                     <rect x="2.5" y="-3" width="1" height="3" fill={hairColor} />
                   </>
                 ) : (
                   /* Medium hair (default) */
                   <rect x="-3" y="-7" width="6" height="4" fill={hairColor} />
                 )}
              </>
            )}
            
            {/* Headgear - different shapes for different types */}
            {headgear && headgear.name !== 'None' && headgear.name !== 'none' && (
              <>
                {headgear.name.toLowerCase().includes('cap') ? (
                  <rect x="-3" y="-8" width="6" height="2.5" fill={secondaryColor} rx="0.5" />
                ) : headgear.name.toLowerCase().includes('helmet') ? (
                  <>
                    <rect x="-3.5" y="-8" width="7" height="3.5" fill="#a1a1aa" rx="0.3" />
                    <rect x="-2" y="-7" width="1" height="0.5" fill="#e5e7eb" />
                  </>
                ) : headgear.name.toLowerCase().includes('crown') ? (
                  <>
                    <rect x="-2.5" y="-7.5" width="5" height="1.5" fill="#fcd34d" />
                    <rect x="-2" y="-8.5" width="1" height="1" fill="#fcd34d" />
                    <rect x="0" y="-8.5" width="1" height="1" fill="#fcd34d" />
                    <rect x="1" y="-8.5" width="1" height="1" fill="#fcd34d" />
                  </>
                ) : headgear.name.toLowerCase().includes('turban') ? (
                  <ellipse cx="0" cy="-6" rx="3.5" ry="2.5" fill={secondaryColor} />
                ) : (
                  /* Default hat */
                  <ellipse cx="0" cy="-6.5" rx="3.5" ry="1.5" fill={secondaryColor} />
                )}
              </>
            )}
            
            {/* Head */}
            <rect x="-2.5" y="-4.5" width="5" height="5" fill={skinColor} />
            
            {/* Eyes */}
            <rect x="-1.5" y="-4" width="0.8" height="0.8" fill="#000" />
            <rect x="0.7" y="-4" width="0.8" height="0.8" fill="#000" />
            <rect x="-1.3" y="-3.8" width="0.3" height="0.3" fill="#fff" />
            <rect x="0.9" y="-3.8" width="0.3" height="0.3" fill="#fff" />
            
            {/* Body */}
            <rect x={-bodyWidth/2} y="-0.5" width={bodyWidth} height={bodyHeight} fill={clothingColor} />
            
            {/* Arms */}
            <rect x="-4.2" y="0" width="1.4" height="4" fill={clothingColor} />
            <rect x="2.8" y="0" width="1.4" height="4" fill={clothingColor} />
            
            {/* Hands */}
            <rect x="-4" y="3.8" width="1.2" height="1.2" fill={skinColor} />
            <rect x="3" y="3.8" width="1.2" height="1.2" fill={skinColor} />
            
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