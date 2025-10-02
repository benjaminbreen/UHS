/**
 * FishingVisualRenderer.tsx - Renders fish SVG based on actual FishSpecies data
 * Uses species.color, secondaryColor, bellyColor, pattern to create distinct visuals
 * Enhanced with animations, depth perception, and visual polish
 */

import React, { useState, useEffect } from 'react';
import { FishSpecies } from '../services/fishingDataService';

interface FishRenderProps {
  species: FishSpecies;
  x: number;
  y: number;
  size: number;
  direction: 'left' | 'right';
  opacity?: number;
  isHooked?: boolean;
  isNearHook?: boolean;
  depth?: number; // 0-1, where 1 is deepest
}

/**
 * Get SVG path for fish body based on species characteristics
 */
function getFishBodyShape(species: FishSpecies, size: number): string {
  const name = species.name.toLowerCase();
  const s = size; // Scale factor

  // TORPEDO SHAPED (fast swimmers - tuna, marlin, swordfish)
  if (
    name.includes('tuna') ||
    name.includes('marlin') ||
    name.includes('swordfish') ||
    name.includes('mackerel')
  ) {
    return `M${-15 * s},0 Q${-12 * s},${-8 * s} 0,${-8 * s} Q${12 * s},${-8 * s} ${15 * s},0 Q${12 * s},${8 * s} 0,${8 * s} Q${-12 * s},${8 * s} ${-15 * s},0`;
  }

  // FLATFISH (flounder, halibut, sole)
  if (
    name.includes('flounder') ||
    name.includes('halibut') ||
    name.includes('sole') ||
    name.includes('plaice')
  ) {
    return `M${-18 * s},0 Q${-15 * s},${-3 * s} 0,${-3 * s} Q${15 * s},${-3 * s} ${18 * s},0 Q${15 * s},${3 * s} 0,${3 * s} Q${-15 * s},${3 * s} ${-18 * s},0`;
  }

  // ELONGATED (pike, barracuda, eel, needlefish)
  if (
    name.includes('pike') ||
    name.includes('barracuda') ||
    name.includes('eel') ||
    name.includes('needlefish') ||
    name.includes('garfish')
  ) {
    return `M${-20 * s},0 Q${-18 * s},${-4 * s} 0,${-4 * s} Q${18 * s},${-4 * s} ${20 * s},0 Q${18 * s},${4 * s} 0,${4 * s} Q${-18 * s},${4 * s} ${-20 * s},0`;
  }

  // DEEP BODY (bass, carp, bream, perch)
  if (
    name.includes('bass') ||
    name.includes('carp') ||
    name.includes('bream') ||
    name.includes('perch') ||
    name.includes('sunfish')
  ) {
    return `M${-12 * s},0 Q${-10 * s},${-10 * s} 0,${-10 * s} Q${10 * s},${-10 * s} ${12 * s},0 Q${10 * s},${10 * s} 0,${10 * s} Q${-10 * s},${10 * s} ${-12 * s},0`;
  }

  // STREAMLINED (trout, salmon, char)
  if (
    name.includes('trout') ||
    name.includes('salmon') ||
    name.includes('char')
  ) {
    return `M${-14 * s},0 Q${-12 * s},${-6 * s} 0,${-7 * s} Q${12 * s},${-6 * s} ${14 * s},0 Q${12 * s},${6 * s} 0,${7 * s} Q${-12 * s},${6 * s} ${-14 * s},0`;
  }

  // ROUND (parrotfish, angelfish, pufferfish)
  if (
    name.includes('parrot') ||
    name.includes('angel') ||
    name.includes('puffer') ||
    name.includes('discus')
  ) {
    return `M${-10 * s},0 Q${-10 * s},${-10 * s} 0,${-10 * s} Q${10 * s},${-10 * s} ${10 * s},0 Q${10 * s},${10 * s} 0,${10 * s} Q${-10 * s},${10 * s} ${-10 * s},0`;
  }

  // BOTTOM DWELLER (catfish, sturgeon)
  if (name.includes('catfish') || name.includes('sturgeon')) {
    return `M${-14 * s},0 Q${-12 * s},${-5 * s} 0,${-5 * s} Q${12 * s},${-5 * s} ${14 * s},${2 * s} Q${12 * s},${7 * s} 0,${7 * s} Q${-12 * s},${7 * s} ${-14 * s},0`;
  }

  // SHARK SHAPE
  if (name.includes('shark')) {
    return `M${-18 * s},0 Q${-15 * s},${-6 * s} 0,${-7 * s} Q${15 * s},${-6 * s} ${18 * s},${-2 * s} Q${15 * s},${5 * s} 0,${6 * s} Q${-15 * s},${5 * s} ${-18 * s},0`;
  }

  // RAY/SKATE (diamond shape)
  if (name.includes('ray') || name.includes('skate')) {
    return `M0,${-15 * s} L${20 * s},0 L0,${15 * s} L${-20 * s},0 Z`;
  }

  // DEFAULT STANDARD FISH
  return `M${-12 * s},0 Q${-10 * s},${-6 * s} 0,${-6 * s} Q${10 * s},${-6 * s} ${12 * s},0 Q${10 * s},${6 * s} 0,${6 * s} Q${-10 * s},${6 * s} ${-12 * s},0`;
}

/**
 * Get tail shape for fish
 */
function getTailShape(species: FishSpecies, size: number, direction: 'left' | 'right', wave: number = 0): string {
  const s = size;
  const name = species.name.toLowerCase();
  const tailX = direction === 'right' ? -14 * s : 14 * s;
  const sign = direction === 'right' ? -1 : 1;

  // Tail sway animation - more pronounced
  const sway = Math.sin(wave) * 3.5 * s;

  // Forked tail (tuna, marlin, fast swimmers) - with sway
  if (name.includes('tuna') || name.includes('marlin') || name.includes('mackerel')) {
    return `M${tailX},${sway} L${tailX + sign * -8 * s},${-10 * s + sway * 0.7} M${tailX},${sway} L${tailX + sign * -8 * s},${10 * s + sway * 0.7}`;
  }

  // Small rounded tail (most fish) - with sway
  return `M${tailX},${-6 * s + sway * 0.8} Q${tailX + sign * -6 * s},${sway} ${tailX},${6 * s + sway * 0.8}`;
}

/**
 * Get fin shapes for fish with animation wave
 */
function getFinShapes(species: FishSpecies, size: number, wave: number = 0): { dorsal: string; pectoral: string } {
  const s = size;
  const name = species.name.toLowerCase();

  // Fin wave animation - more visible
  const finWave = Math.sin(wave) * 1.2 * s;
  const pectoralWave = Math.sin(wave * 1.5) * 1.5 * s; // Pectoral fins move faster

  // Large dorsal fin for bass, perch - with wave
  if (name.includes('bass') || name.includes('perch')) {
    return {
      dorsal: `M${-4 * s},${-6 * s} L${-2 * s},${-14 * s + finWave} L0,${-6 * s} M${2 * s},${-6 * s} L${4 * s},${-14 * s + finWave} L${6 * s},${-6 * s}`,
      pectoral: `M${-4 * s},${2 * s} L${-8 * s + pectoralWave},${6 * s} L${-6 * s},${4 * s}`
    };
  }

  // Shark dorsal - with wave
  if (name.includes('shark')) {
    return {
      dorsal: `M0,${-7 * s} L${3 * s},${-15 * s + finWave} L${6 * s},${-7 * s}`,
      pectoral: `M${-6 * s},${2 * s} L${-12 * s + pectoralWave},${8 * s} L${-8 * s},${4 * s}`
    };
  }

  // Default fins - with wave
  return {
    dorsal: `M${-2 * s},${-6 * s} L0,${-12 * s + finWave} L${2 * s},${-6 * s}`,
    pectoral: `M${-4 * s},${2 * s} L${-7 * s + pectoralWave},${5 * s} L${-5 * s},${3 * s}`
  };
}

/**
 * Get pattern overlay for fish
 */
function getFishPattern(
  species: FishSpecies,
  size: number
): { path: string; color: string; strokeWidth?: number } | null {
  if (!species.pattern || species.pattern === 'none') return null;

  const s = size;
  const color = species.patternColor || '#000000';

  switch (species.pattern) {
    case 'spotted':
      return {
        path: `
          M${-8 * s},${-4 * s} m${-1.5 * s},0 a${1.5 * s},${1.5 * s} 0 1,0 ${3 * s},0 a${1.5 * s},${1.5 * s} 0 1,0 ${-3 * s},0
          M${-2 * s},${2 * s} m${-1 * s},0 a${1 * s},${1 * s} 0 1,0 ${2 * s},0 a${1 * s},${1 * s} 0 1,0 ${-2 * s},0
          M${4 * s},${-2 * s} m${-1.5 * s},0 a${1.5 * s},${1.5 * s} 0 1,0 ${3 * s},0 a${1.5 * s},${1.5 * s} 0 1,0 ${-3 * s},0
          M${6 * s},${4 * s} m${-1 * s},0 a${1 * s},${1 * s} 0 1,0 ${2 * s},0 a${1 * s},${1 * s} 0 1,0 ${-2 * s},0
        `,
        color
      };

    case 'striped':
      return {
        path: `M${-10 * s},${-6 * s} L${-10 * s},${6 * s} M${-5 * s},${-6 * s} L${-5 * s},${6 * s} M0,${-6 * s} L0,${6 * s} M${5 * s},${-6 * s} L${5 * s},${6 * s} M${10 * s},${-6 * s} L${10 * s},${6 * s}`,
        color,
        strokeWidth: 1.5 * s
      };

    case 'bars':
      return {
        path: `
          M${-8 * s},${-8 * s} L${-8 * s},${8 * s} L${-6 * s},${8 * s} L${-6 * s},${-8 * s} Z
          M${-2 * s},${-8 * s} L${-2 * s},${8 * s} L0,${8 * s} L0,${-8 * s} Z
          M${4 * s},${-8 * s} L${4 * s},${8 * s} L${6 * s},${8 * s} L${6 * s},${-8 * s} Z
        `,
        color
      };

    case 'lateral_line':
      return {
        path: `M${-12 * s},0 L${12 * s},0`,
        color,
        strokeWidth: 1 * s
      };

    case 'mottled':
      return {
        path: `
          M${-10 * s},${-4 * s} Q${-8 * s},${-6 * s} ${-6 * s},${-4 * s} Q${-8 * s},${-2 * s} ${-10 * s},${-4 * s}
          M${-2 * s},0 Q0,${-2 * s} ${2 * s},0 Q0,${2 * s} ${-2 * s},0
          M${6 * s},${-3 * s} Q${8 * s},${-5 * s} ${10 * s},${-3 * s} Q${8 * s},${-1 * s} ${6 * s},${-3 * s}
          M${4 * s},${4 * s} Q${6 * s},${2 * s} ${8 * s},${4 * s} Q${6 * s},${6 * s} ${4 * s},${4 * s}
        `,
        color
      };

    case 'rainbow':
      // Multiple colored stripes (for tropical fish)
      return {
        path: `
          M${-10 * s},${-8 * s} L${10 * s},${-8 * s}
          M${-10 * s},${-4 * s} L${10 * s},${-4 * s}
          M${-10 * s},0 L${10 * s},0
          M${-10 * s},${4 * s} L${10 * s},${4 * s}
          M${-10 * s},${8 * s} L${10 * s},${8 * s}
        `,
        color,
        strokeWidth: 1.5 * s
      };

    case 'patches':
      return {
        path: `
          M${-8 * s},${-5 * s} Q${-6 * s},${-7 * s} ${-4 * s},${-5 * s} Q${-6 * s},${-3 * s} ${-8 * s},${-5 * s}
          M0,${-2 * s} Q${2 * s},${-4 * s} ${4 * s},${-2 * s} Q${2 * s},0 0,${-2 * s}
          M${6 * s},${2 * s} Q${8 * s},0 ${10 * s},${2 * s} Q${8 * s},${4 * s} ${6 * s},${2 * s}
          M${-6 * s},${4 * s} Q${-4 * s},${2 * s} ${-2 * s},${4 * s} Q${-4 * s},${6 * s} ${-6 * s},${4 * s}
        `,
        color
      };

    case 'scales':
      // Scale pattern
      return {
        path: `
          M${-10 * s},${-6 * s} a${2 * s},${2 * s} 0 0,1 ${4 * s},0
          M${-6 * s},${-6 * s} a${2 * s},${2 * s} 0 0,1 ${4 * s},0
          M${-2 * s},${-6 * s} a${2 * s},${2 * s} 0 0,1 ${4 * s},0
          M${2 * s},${-6 * s} a${2 * s},${2 * s} 0 0,1 ${4 * s},0
          M${6 * s},${-6 * s} a${2 * s},${2 * s} 0 0,1 ${4 * s},0
          M${-10 * s},0 a${2 * s},${2 * s} 0 0,1 ${4 * s},0
          M${-6 * s},0 a${2 * s},${2 * s} 0 0,1 ${4 * s},0
          M${-2 * s},0 a${2 * s},${2 * s} 0 0,1 ${4 * s},0
          M${2 * s},0 a${2 * s},${2 * s} 0 0,1 ${4 * s},0
          M${6 * s},0 a${2 * s},${2 * s} 0 0,1 ${4 * s},0
          M${-10 * s},${6 * s} a${2 * s},${2 * s} 0 0,1 ${4 * s},0
          M${-6 * s},${6 * s} a${2 * s},${2 * s} 0 0,1 ${4 * s},0
          M${-2 * s},${6 * s} a${2 * s},${2 * s} 0 0,1 ${4 * s},0
          M${2 * s},${6 * s} a${2 * s},${2 * s} 0 0,1 ${4 * s},0
          M${6 * s},${6 * s} a${2 * s},${2 * s} 0 0,1 ${4 * s},0
        `,
        color,
        strokeWidth: 0.5 * s
      };

    default:
      return null;
  }
}

/**
 * Get colors for fish rendering with depth-based color temperature shift
 */
function getFishColors(species: FishSpecies, depth: number = 0) {
  let primary = species.color || '#888888';
  let secondary = species.secondaryColor || species.color || '#666666';
  let belly = species.bellyColor || '#FFFFFF';

  // Apply blue-green tint for deeper fish (water color absorption)
  if (depth > 0.3) {
    primary = blendColorWithWater(primary, depth);
    secondary = blendColorWithWater(secondary, depth);
  }

  return { primary, secondary, belly };
}

/**
 * Blend color with blue-green water tint based on depth
 */
function blendColorWithWater(color: string, depth: number): string {
  const waterColor = { r: 20, g: 100, b: 120 }; // Deep water blue-green
  const blendAmount = Math.min(depth * 0.4, 0.35); // Max 35% blend

  const num = parseInt(color.replace('#', ''), 16);
  const r = (num >> 16) & 0xFF;
  const g = (num >> 8) & 0xFF;
  const b = num & 0xFF;

  const blendedR = Math.round(r * (1 - blendAmount) + waterColor.r * blendAmount);
  const blendedG = Math.round(g * (1 - blendAmount) + waterColor.g * blendAmount);
  const blendedB = Math.round(b * (1 - blendAmount) + waterColor.b * blendAmount);

  return '#' + ((1 << 24) + (blendedR << 16) + (blendedG << 8) + blendedB).toString(16).slice(1);
}

/**
 * Main fish rendering component
 */
export const FishingVisualRenderer: React.FC<FishRenderProps> = ({
  species,
  x,
  y,
  size,
  direction,
  opacity = 1,
  isHooked = false,
  isNearHook = false,
  depth = 0
}) => {
  // Animation state for fin movement and bubbles
  const [finWave, setFinWave] = useState(0);
  const [tailWave, setTailWave] = useState(0);
  const [bubbleTimer, setBubbleTimer] = useState(Math.random() * 100);

  // Animate fins and tail with realistic swimming motion
  useEffect(() => {
    const interval = setInterval(() => {
      setFinWave(prev => (prev + 0.18) % (Math.PI * 2));
      setTailWave(prev => (prev + 0.3) % (Math.PI * 2));
      setBubbleTimer(prev => prev + 1);
    }, 40); // Faster frame rate for smoother animation
    return () => clearInterval(interval);
  }, []);

  const colors = getFishColors(species, depth);
  const bodyPath = getFishBodyShape(species, size);
  const tailPath = getTailShape(species, size, direction, tailWave);
  const fins = getFinShapes(species, size, finWave);
  const pattern = getFishPattern(species, size);

  // CRITICAL: scaleX must be -1 for left, +1 for right to flip fish correctly
  const scaleX = direction === 'left' ? -1 : 1;

  // Depth-based scaling (deeper fish appear slightly smaller)
  const depthScale = 1 - (depth * 0.12);

  // Glow effect when near hook
  const glowFilter = isNearHook ? 'url(#fishGlow)' : undefined;

  // Check if this is a rare/valuable fish for special effects
  const isRare = species.rarity === 'rare' || species.rarity === 'ultra-rare' || species.rarity === 'unique';
  const isMetallic = species.name.toLowerCase().includes('salmon') ||
                     species.name.toLowerCase().includes('trout') ||
                     species.name.toLowerCase().includes('char') ||
                     species.name.toLowerCase().includes('mackerel');

  return (
    <g transform={`translate(${x},${y}) scale(${scaleX * depthScale}, ${depthScale})`} opacity={opacity}>
      {/* Define filters and gradients */}
      <defs>
        {isNearHook && (
          <filter id="fishGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}

        {/* Rare fish sparkle effect */}
        {isRare && (
          <filter id={`rareSparkle_${species.id}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feComponentTransfer in="blur" result="bright">
              <feFuncA type="linear" slope="1.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="bright" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}

        {/* Enhanced shadow gradient with depth blur */}
        <radialGradient id={`fishShadow_${species.id}`}>
          <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
          <stop offset="70%" stopColor="rgba(0,0,0,0.2)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>

        {/* Body gradient for depth - metallic if applicable */}
        <linearGradient id={`fishBody_${species.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isMetallic ? adjustColorBrightness(colors.primary, 20) : colors.primary} stopOpacity="0.9" />
          <stop offset="50%" stopColor={colors.primary} stopOpacity="1" />
          <stop offset="100%" stopColor={adjustColorBrightness(colors.primary, -15)} stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* Shadow beneath fish */}
      <ellipse
        cx="2"
        cy={8 * size}
        rx={10 * size}
        ry={3 * size}
        fill={`url(#fishShadow_${species.id})`}
        opacity={0.4}
      />

      {/* Fish body with gradient */}
      <path
        d={bodyPath}
        fill={`url(#fishBody_${species.id})`}
        stroke={isHooked ? '#FFD700' : 'rgba(0,0,0,0.25)'}
        strokeWidth={isHooked ? 1.5 : 0.4}
        filter={glowFilter}
      />

      {/* Belly highlight (lighter underbelly) */}
      <ellipse
        cx="0"
        cy={5 * size}
        rx={7 * size}
        ry={3.5 * size}
        fill={colors.belly}
        opacity={0.6}
      />

      {/* Top highlight (light reflection) */}
      <ellipse
        cx={-3 * size}
        cy={-2 * size}
        rx={5 * size}
        ry={2 * size}
        fill="rgba(255,255,255,0.4)"
        opacity={0.7}
      />

      {/* Pattern overlay - enhanced visibility */}
      {pattern && (
        <path
          d={pattern.path}
          fill={pattern.strokeWidth ? 'none' : pattern.color}
          stroke={pattern.strokeWidth ? pattern.color : 'none'}
          strokeWidth={pattern.strokeWidth || 0}
          opacity={0.65}
        />
      )}

      {/* Dorsal fin with gradient */}
      <path
        d={fins.dorsal}
        fill={colors.secondary}
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={0.3}
        opacity={0.9}
      />

      {/* Pectoral fin with gradient */}
      <path
        d={fins.pectoral}
        fill={adjustColorBrightness(colors.secondary, 10)}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={0.3}
        opacity={0.75}
      />

      {/* Tail with gradient */}
      <path
        d={tailPath}
        fill={colors.secondary}
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={0.3}
        opacity={0.9}
      />

      {/* Eye (white outer, black pupil, white highlight) */}
      <circle
        cx={direction === 'right' ? 9 * size : -9 * size}
        cy={-2 * size}
        r={1.8 * size}
        fill="#FFFFFF"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={0.3}
      />
      <circle
        cx={direction === 'right' ? 9 * size : -9 * size}
        cy={-2 * size}
        r={1.2 * size}
        fill="#000000"
      />
      <circle
        cx={direction === 'right' ? 9.5 * size : -8.5 * size}
        cy={-2.5 * size}
        r={0.5 * size}
        fill="#FFFFFF"
        opacity={0.8}
      />

      {/* Hooked indicator */}
      {isHooked && (
        <circle
          cx="0"
          cy="0"
          r={12 * size}
          fill="none"
          stroke="#FFD700"
          strokeWidth="1.5"
          strokeDasharray="3,3"
          opacity={0.7}
        />
      )}

      {/* Rare fish sparkle indicators */}
      {isRare && bubbleTimer % 60 < 30 && (
        <>
          <circle cx={6 * size} cy={-4 * size} r={0.5 * size} fill="#FFD700" opacity={0.8} />
          <circle cx={-6 * size} cy={-5 * size} r={0.4 * size} fill="#FFF" opacity={0.6} />
          <circle cx={4 * size} cy={-8 * size} r={0.3 * size} fill="#FFD700" opacity={0.7} />
        </>
      )}

      {/* Occasional bubbles rising from fish */}
      {bubbleTimer % 80 < 20 && (
        <>
          <circle
            cx={-2 * size}
            cy={2 * size - (bubbleTimer % 20)}
            r={0.8 * size}
            fill="rgba(255,255,255,0.4)"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth={0.2}
          />
          <circle
            cx={1 * size}
            cy={3 * size - (bubbleTimer % 20) * 0.8}
            r={0.6 * size}
            fill="rgba(255,255,255,0.3)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={0.2}
          />
        </>
      )}

      {/* Metallic shimmer effect for salmon/trout */}
      {isMetallic && Math.sin(finWave * 2) > 0.5 && (
        <ellipse
          cx={0}
          cy={-1 * size}
          rx={8 * size}
          ry={3 * size}
          fill="rgba(255,255,255,0.3)"
          opacity={0.4}
        />
      )}
    </g>
  );
};

// Helper function to adjust color brightness
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export default FishingVisualRenderer;
