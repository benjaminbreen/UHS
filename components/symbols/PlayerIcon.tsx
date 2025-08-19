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
  
  const { gender } = character;
  const {
    skinColor, hairColor, build, facialHair
  } = character.appearance;
  
  const { primary: clothingColor, secondary: secondaryColor } = character.appearance.palette;
  
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
            {/* Hair */}
            <rect x="-3" y="-7" width="6" height="4" fill={hairColor} />
            
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

            {/* Facial hair */}
            {facialHair && gender === 'Male' && <rect x="-1.5" y="-2" width="3" height="1.2" fill={hairColor} />}
        </>
      </g>
    </g>
  );
});

export default PlayerIcon;