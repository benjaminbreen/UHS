/**
 * components/symbols/PlayerIcon.tsx - Data-driven pixel art character sprite
 */
import React, { useMemo, useState, useEffect } from 'react';
import { PlayerCharacter, OverallHealthStatus } from '../../types';
import { detectItemColor, getEquippedItemColor, detectMaterialColor, detectJewelryColor } from '../../utils/colorDetection';
import { eventBus } from '../../services/eventBus';

interface PlayerIconProps {
  x: number;
  y: number;
  character: PlayerCharacter;
  isInteriorMap?: boolean; // Flag to scale up for interior maps
  direction?: 'north' | 'south' | 'east' | 'west'; // Direction player is facing
  walkFrame?: 0 | 1; // Walk animation frame (0 or 1)
  onClick?: () => void; // Optional click handler
  isSwinging?: boolean; // Weapon swing animation state
  swingTimestamp?: number; // Timestamp for swing animation
  isCharging?: boolean; // Charging power swing
  isPowerSwing?: boolean; // Is this a power swing
  hasSnow?: boolean; // Whether to show snow accumulation on character
}

// Helper function to adjust color brightness
const adjustColorBrightness = (color: string, percent: number): string => {
  const num = parseInt(color.replace("#",""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
};

const PlayerIcon: React.FC<PlayerIconProps> = React.memo(({ x, y, character, isInteriorMap = false, direction = 'south', walkFrame = 0, onClick, isSwinging = false, swingTimestamp = 0, isCharging = false, isPowerSwing = false, hasSnow = false }) => {
  // Detect Safari for performance optimizations
  const isSafari = useMemo(() => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }, []);

  // Blinking animation - blink once per minute
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    // Blink once per minute (60000ms)
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      // Blink lasts 150ms
      setTimeout(() => setIsBlinking(false), 150);
    }, 60000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Listen for external blink trigger
  useEffect(() => {
    const handleExternalBlink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };

    eventBus.on('player:blink', handleExternalBlink);
    return () => eventBus.off('player:blink', handleExternalBlink);
  }, []);

  // Handle click - delegate to parent (blink will be triggered externally after zoom)
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling

    console.log('[PlayerIcon] Clicked!');

    // Call onClick handler if provided (parent will handle zoom + delayed blink)
    if (onClick) {
      onClick();
    }
  };

  if (!character.appearance) {
    // Render a fallback or loading state if appearance data is not ready
    return null;
  }
  
  const { gender, equippedItems } = character;
  const {
    skinColor, hairColor, eyeColor, build, facialHair, facialHairStyle, facialHairThickness, hairLength, hairstyle, jewelry,
    // Phase 1 enhancements
    faceShape, hairTexture, skinTexture, eyebrowThickness, markings
  } = character.appearance;
  
  // If equippedItems exists, use that (even if slots are empty)
  // Only fall back to appearance if equippedItems doesn't exist
  let headgear = null;
  let garment = null;
  let cloak = null;
  let boots = null;
  let belt = null;
  let legs = null;

  if (equippedItems !== undefined) {
    // Use equipped items (may be undefined if nothing equipped)
    headgear = equippedItems.head;
    garment = equippedItems.torso;
    cloak = equippedItems.cloak;
    boots = equippedItems.feet;
    belt = equippedItems.belt;
    legs = equippedItems.legs;
  } else {
    // Fall back to appearance only if equippedItems doesn't exist
    headgear = character.appearance.headgear;
    garment = character.appearance.garment;
  }
  
  const isNaked = !garment; // Track if torso is bare
  
  // Use equipped item color if available, otherwise fall back to palette
  // Use shared color detection utility for consistency with procedural portrait
  const clothingColor = useMemo(() => {
    if (garment?.color) {
      return detectItemColor(garment.color, character.appearance.palette.primary);
    }
    return character.appearance.palette.primary;
  }, [garment?.color, character.appearance.palette.primary]);
  const { secondary: secondaryColor, accent: accentColor } = character.appearance.palette;

  // ⚡ PERFORMANCE: Memoize cloak color (replaces 50+ if statements with lookup table)
  const cloakColor = useMemo(() => {
    if (!cloak) return null;
    return getEquippedItemColor(cloak, secondaryColor);
  }, [cloak, secondaryColor]);

  // Get belt color using shared utility
  const beltColor = useMemo(() => {
    if (!belt) return null;
    if (belt.color) {
      return detectItemColor(belt.color, '#654321');
    }
    return detectMaterialColor(belt.material) || '#654321';
  }, [belt?.color, belt?.material]);

  // Get boots color using shared utility
  const bootsColor = useMemo(() => {
    if (!boots) return null;
    if (boots.color) {
      return detectItemColor(boots.color, '#654321');
    }
    return detectMaterialColor(boots.material) || '#8b4513';
  }, [boots?.color, boots?.material]);

  // ⚡ PERFORMANCE: Memoize legs color (replaces 50+ if statements with lookup table)
  const legsColor = useMemo(() => {
    if (!legs) return secondaryColor;
    return getEquippedItemColor(legs, secondaryColor);
  }, [legs, secondaryColor]);
  
  // Determine glow color based on disease state
  let glowColor = '#fbbf24'; // Default amber
  let glowOpacity = 0.9;
  
  // Check diseaseHealth field for player character diseases
  if (character.diseaseHealth && character.diseaseHealth.overallHealthStatus) {
    switch (character.diseaseHealth.overallHealthStatus) {
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
        if (character.diseaseHealth.currentDiseases && character.diseaseHealth.currentDiseases.length > 0) {
          glowColor = '#FFF8DC'; // Pale yellow for minor illness
          glowOpacity = 0.8;
        }
        break;
    }
  }
  
  // Enhanced body size variations based on build (Phase 1)
  const buildConfig = {
    'slight': { shoulderWidth: 4.5, torsoHeight: 5.5, neckLength: 1.5 },
    'average': { shoulderWidth: 5.6, torsoHeight: 5.2, neckLength: 1.0 },
    'athletic': { shoulderWidth: 6.2, torsoHeight: 5.8, neckLength: 1.0 },
    'stocky': { shoulderWidth: 6.5, torsoHeight: 4.8, neckLength: 0.5 },
    'heavy': { shoulderWidth: 7.0, torsoHeight: 5.0, neckLength: 0.5 },
    'tall': { shoulderWidth: 5.6, torsoHeight: 6.5, neckLength: 1.2 },
    'short': { shoulderWidth: 5.2, torsoHeight: 4.5, neckLength: 0.8 },
    'imposing': { shoulderWidth: 7.2, torsoHeight: 6.2, neckLength: 0.8 }
  };
  const config = buildConfig[build] || buildConfig['average'];
  const bodyWidth = config.shoulderWidth;
  const bodyHeight = config.torsoHeight;
  const neckLength = config.neckLength;

  // Face shape variations (Phase 1)
  const faceShapeConfig = {
    'round': { headWidth: 4, jawWidth: 4, chinWidth: 3 },
    'oval': { headWidth: 3, jawWidth: 2.5, chinWidth: 2 },      // Default
    'square': { headWidth: 3.5, jawWidth: 3.5, chinWidth: 3 },
    'long': { headWidth: 2.5, jawWidth: 2, chinWidth: 1.5 },
    'heart': { headWidth: 3.5, jawWidth: 2.5, chinWidth: 1.5 },
    'diamond': { headWidth: 2.8, jawWidth: 3.2, chinWidth: 2.2 }
  };
  const faceConfig = faceShapeConfig[faceShape || 'oval'] || faceShapeConfig['oval'];

  // Hair texture helper (Phase 1)
  const getHairHighlightColor = () => adjustColorBrightness(hairColor, 15);
  const getHairShadowColor = () => adjustColorBrightness(hairColor, -12);

  // Base size multiplier - make player icon 10px tall (NPCs are 7-9px)
  const BASE_SCALE = 1.25; // 1.25x makes the ~8px icon become ~10px

  // Scale factor for interior maps - make icons 3x larger ONLY in interior maps
  const ICON_SCALE = (isInteriorMap ? 3 : 1) * BASE_SCALE;

  // Breathing animation - subtle idle movement
  const [breathOffset, setBreathOffset] = useState(0);

  useEffect(() => {
    let startTime = Date.now();
    const breathingAnimation = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Sine wave for smooth up/down motion over 3.5 seconds
      const offset = Math.sin(elapsed * Math.PI / 1.75) * 0.15;
      setBreathOffset(offset);
    }, 50); // Update 20 times per second

    return () => clearInterval(breathingAnimation);
  }, []);

  // Swing animation - full arm and weapon rotation
  const [swingProgress, setSwingProgress] = useState(0);
  const [chargeProgress, setChargeProgress] = useState(0);

  // Charging animation
  useEffect(() => {
    if (!isCharging) {
      setChargeProgress(0);
      return;
    }

    const chargeLoop = setInterval(() => {
      setChargeProgress(prev => Math.min(prev + 0.05, 1)); // Gradually increase to 1
    }, 16); // ~60fps

    return () => clearInterval(chargeLoop);
  }, [isCharging]);

  // Swing animation
  useEffect(() => {
    if (!isSwinging) {
      setSwingProgress(0);
      return;
    }

    const animationDuration = isPowerSwing ? 600 : 400; // Longer for power swing
    const animationLoop = setInterval(() => {
      const elapsed = Date.now() - swingTimestamp;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Easing function for snappy feel (ease-out-cubic for normal, stronger for power)
      const eased = isPowerSwing
        ? 1 - Math.pow(1 - progress, 4) // More dramatic easing for power swing
        : 1 - Math.pow(1 - progress, 3);
      setSwingProgress(eased);

      if (progress >= 1) {
        setSwingProgress(0);
      }
    }, 16); // ~60fps

    return () => clearInterval(animationLoop);
  }, [isSwinging, swingTimestamp, isPowerSwing]);

  // Calculate arm and weapon rotation based on animation state
  const armRotation = useMemo(() => {
    if (isCharging) {
      // Pull back - rotate arm backwards
      return -45 - (chargeProgress * 30); // Pull back up to -75 degrees
    }
    if (isSwinging) {
      // Swing forward - wide arc
      const maxSwingAngle = isPowerSwing ? 160 : 135; // Bigger arc for power swing
      const startAngle = isPowerSwing ? -75 : -45; // Start from charged position if power swing
      return startAngle + (maxSwingAngle - startAngle) * swingProgress;
    }
    return 0; // Neutral position
  }, [isCharging, chargeProgress, isSwinging, swingProgress, isPowerSwing]);

  // Weapon rotation is slightly ahead of arm for whip-like effect
  const weaponRotation = useMemo(() => {
    if (isCharging) {
      return armRotation - 15; // Slightly more back
    }
    if (isSwinging) {
      const leadAmount = isPowerSwing ? 25 : 15; // More lead for power swing
      return armRotation + leadAmount;
    }
    return 0;
  }, [armRotation, isCharging, isSwinging, isPowerSwing]);

  // Calculate headgear element (will render after head for proper layering)
  const headgearElement = useMemo(() => {
    if (!headgear || headgear.name === 'None' || headgear.name === 'none') return null;

    const name = headgear.name.toLowerCase();

    // Use shared color detection utility for consistency with procedural portrait
    let headgearColor = secondaryColor;

    // Hard-code straw color for straw hats (natural material color)
    if (name.includes('straw')) {
      headgearColor = '#f4e68c'; // Straw color
    } else if (headgear.color) {
      // First check explicit color property
      headgearColor = detectItemColor(headgear.color, secondaryColor);
    } else {
      // Check for color keywords in name
      headgearColor = detectItemColor(name, secondaryColor);

      // If no color found in name, check material
      if (headgearColor === secondaryColor && headgear.material) {
        const materialColor = detectMaterialColor(headgear.material);
        if (materialColor) {
          headgearColor = materialColor;
        }
      }
    }

    if (name.includes('cap') || name.includes('beanie')) {
      return (
        <g key="headgear">
          <rect x="-3" y="-7.0" width="6" height="2.8" fill={headgearColor} rx="0.9" />
          <rect x="-2.5" y="-5.2" width="5" height="0.4" fill="rgba(0,0,0,0.2)" />
        </g>
      );
    } else if (name.includes('helmet')) {
      return (
        <g key="headgear">
          <rect x="-3.5" y="-7" width="7" height="4" fill="#a1a1aa" rx="0.3" />
          <rect x="-2" y="-4.8" width="1" height="0.5" fill="#e5e7eb" />
          <rect x="-0.3" y="-1.5" width="0.6" height="1.8" fill="#a1a1aa" />
        </g>
      );
    } else if (name.includes('crown') || name.includes('tiara')) {
      return (
        <g key="headgear">
          <rect x="-2.8" y="-5.2" width="5.6" height="1.5" fill="#fcd34d" />
          <rect x="-2.3" y="-6.2" width="0.9" height="1" fill="#fcd34d" />
          <rect x="-0.5" y="-6.7" width="1" height="1.5" fill="#fcd34d" />
          <rect x="1.4" y="-6.2" width="0.9" height="1" fill="#fcd34d" />
          <rect x="-0.4" y="-4.9" width="0.8" height="0.7" fill="#DC143C" />
        </g>
      );
    } else if (name.includes('turban')) {
      return (
        <g key="headgear">
          <ellipse cx="0" cy="-4" rx="3.8" ry="2.8" fill={headgearColor} />
          <circle cx="0" cy="-4" r="0.5" fill="#DC143C" />
        </g>
      );
    } else if (name.includes('hood')) {
      return (
        <g key="headgear">
          {/* Hood that covers back/top of head but leaves face visible */}
          <path d="M -3.5 -2 Q -3.8 -5.8, 0 -6.5 Q 3.8 -5.8, 3.5 -2"
                fill={headgearColor}
                stroke={headgearColor}
                strokeWidth="0.3" />
          {/* Hood draping down sides */}
          <path d="M -3.5 -2 L -3.8 1 L -3 0.5 Z" fill={headgearColor} opacity="0.9" />
          <path d="M 3.5 -2 L 3.8 1 L 3 0.5 Z" fill={headgearColor} opacity="0.9" />
          {/* Subtle shadow on hood */}
          <ellipse cx="0" cy="-4.5" rx="2.5" ry="1.5" fill="rgba(0,0,0,0.15)" />
        </g>
      );
    } else if (name.includes('straw') || name.includes('hat')) {
      return (
        <g key="headgear">
          {/* Hat brim */}
          <ellipse cx="0" cy="-4.7" rx="4.5" ry="0.7" fill={headgearColor} />
          {/* Brim highlight (sun-bleached effect) */}
          <ellipse cx="0" cy="-4.8" rx="3.5" ry="0.4" fill={adjustColorBrightness(headgearColor, 15)} opacity="0.6" />
          {/* Brim shadow underside */}
          <ellipse cx="0" cy="-4.6" rx="4.2" ry="0.3" fill="rgba(0,0,0,0.15)" />

          {/* Crown/top */}
          <rect x="-2.2" y="-7" width="4.4" height="2.8" fill={headgearColor} rx="0.5" />
          {/* Crown highlight */}
          <rect x="-2" y="-6.8" width="2" height="2.2" fill={adjustColorBrightness(headgearColor, 12)} opacity="0.5" rx="0.4" />

          {/* Woven texture lines (for straw hats) */}
          {name.includes('straw') && (
            <>
              <line x1="-2" y1="-6.5" x2="2" y2="-6.5" stroke={adjustColorBrightness(headgearColor, -10)} strokeWidth="0.15" opacity="0.4" />
              <line x1="-2" y1="-5.5" x2="2" y2="-5.5" stroke={adjustColorBrightness(headgearColor, -10)} strokeWidth="0.15" opacity="0.4" />
              <line x1="-2" y1="-4.5" x2="2" y2="-4.5" stroke={adjustColorBrightness(headgearColor, -10)} strokeWidth="0.15" opacity="0.4" />
            </>
          )}
        </g>
      );
    } else {
      return <rect key="headgear" x="-3.2" y="-5.2" width="6.4" height="2.3" fill={headgearColor} rx="0.3" />;
    }
  }, [headgear, secondaryColor]);

  // Generate hand-held item visualization based on equipped main_hand
  const handItemElement = useMemo(() => {
    if (!equippedItems?.main_hand) return null;

    const item = equippedItems.main_hand;
    const itemName = item.name.toLowerCase();
    const itemColor = detectItemColor(item.color || item.material || 'brown', '#8b4513');
    const metalColor = '#a1a1aa';
    const woodColor = '#8b4513';
    const goldColor = '#ffd700';

    // SWORDS & BLADES
    if (itemName.includes('sword') || itemName.includes('blade') || itemName.includes('saber')) {
      return {
        south: (
          <g key="hand-item-south">
            {/* Blade */}
            <rect x="4.3" y="0.5" width="0.7" height="6.5" fill={metalColor} rx="0.2" />
            <rect x="4.4" y="0.5" width="0.3" height="6.5" fill="rgba(255,255,255,0.3)" />
            {/* Handle */}
            <rect x="4.2" y="6.8" width="0.9" height="1.8" fill={woodColor} rx="0.2" />
            {/* Cross-guard */}
            <rect x="3.5" y="6.5" width="2.3" height="0.4" fill={goldColor} rx="0.1" />
            {/* Pommel */}
            <circle cx="4.65" cy="8.8" r="0.4" fill={goldColor} />
          </g>
        ),
        north: null, // Hidden when facing away
        east: (
          <g key="hand-item-east">
            <rect x="3.5" y="3" width="0.6" height="5" fill={metalColor} rx="0.2" />
            <rect x="3.4" y="7.8" width="0.8" height="1.2" fill={woodColor} rx="0.2" />
          </g>
        ),
        west: (
          <g key="hand-item-west">
            <rect x="-4.1" y="3" width="0.6" height="5" fill={metalColor} rx="0.2" />
            <rect x="-4.2" y="7.8" width="0.8" height="1.2" fill={woodColor} rx="0.2" />
          </g>
        )
      };
    }

    // AXES
    if (itemName.includes('axe') || itemName.includes('hatchet')) {
      return {
        south: (
          <g key="hand-item-south">
            {/* Handle */}
            <rect x="4.4" y="1.5" width="0.6" height="6" fill={woodColor} rx="0.2" />
            {/* Axe head */}
            <path d="M 3.8 1.5 L 5.6 1.5 L 5.8 0.5 L 5.8 2.5 Z" fill={metalColor} />
            <rect x="5.5" y="0.7" width="0.3" height="1.6" fill="rgba(255,255,255,0.3)" />
          </g>
        ),
        north: null,
        east: (
          <g key="hand-item-east">
            <rect x="3.5" y="4" width="0.5" height="4.5" fill={woodColor} rx="0.2" />
            <path d="M 3.5 4 L 5.2 4 L 5.2 3 L 5.2 5 Z" fill={metalColor} />
          </g>
        ),
        west: (
          <g key="hand-item-west">
            <rect x="-4" y="4" width="0.5" height="4.5" fill={woodColor} rx="0.2" />
            <path d="M -3.5 4 L -5.2 4 L -5.2 3 L -5.2 5 Z" fill={metalColor} />
          </g>
        )
      };
    }

    // STAFFS & STICKS
    if (itemName.includes('staff') || itemName.includes('stick') || itemName.includes('pole')) {
      const staffColor = itemName.includes('magic') || itemName.includes('wizard') ? '#8b5a3c' : woodColor;
      const hasOrb = itemName.includes('magic') || itemName.includes('wizard');

      return {
        south: (
          <g key="hand-item-south">
            <rect x="4.5" y="-2" width="0.6" height="10" fill={staffColor} rx="0.2" />
            <rect x="4.6" y="-1.5" width="0.3" height="9" fill="rgba(255,255,255,0.15)" />
            {hasOrb && (
              <>
                <circle cx="4.8" cy="-2.5" r="0.8" fill="#6366f1" opacity="0.8" />
                <circle cx="4.6" cy="-2.7" r="0.4" fill="rgba(255,255,255,0.6)" />
              </>
            )}
          </g>
        ),
        north: null,
        east: (
          <g key="hand-item-east">
            <rect x="2.5" y="2" width="0.5" height="7" fill={staffColor} rx="0.2" />
            {hasOrb && <circle cx="2.75" cy="1.5" r="0.6" fill="#6366f1" opacity="0.8" />}
          </g>
        ),
        west: (
          <g key="hand-item-west">
            <rect x="-3" y="2" width="0.5" height="7" fill={staffColor} rx="0.2" />
            {hasOrb && <circle cx="-2.75" cy="1.5" r="0.6" fill="#6366f1" opacity="0.8" />}
          </g>
        )
      };
    }

    // BOWS
    if (itemName.includes('bow')) {
      return {
        south: (
          <g key="hand-item-south">
            {/* Bow arc */}
            <path d="M 4.5 1 Q 6 4, 4.5 7" stroke={woodColor} strokeWidth="0.5" fill="none" />
            {/* String */}
            <line x1="4.5" y1="1" x2="4.5" y2="7" stroke="#d4d4d4" strokeWidth="0.15" />
          </g>
        ),
        north: null,
        east: (
          <g key="hand-item-east">
            <path d="M 3 3 Q 4.5 5, 3 7" stroke={woodColor} strokeWidth="0.4" fill="none" />
            <line x1="3" y1="3" x2="3" y2="7" stroke="#d4d4d4" strokeWidth="0.12" />
          </g>
        ),
        west: (
          <g key="hand-item-west">
            <path d="M -3 3 Q -4.5 5, -3 7" stroke={woodColor} strokeWidth="0.4" fill="none" />
            <line x1="-3" y1="3" x2="-3" y2="7" stroke="#d4d4d4" strokeWidth="0.12" />
          </g>
        )
      };
    }

    // SPEARS & LANCES
    if (itemName.includes('spear') || itemName.includes('lance') || itemName.includes('pike')) {
      return {
        south: (
          <g key="hand-item-south">
            <rect x="4.5" y="-1" width="0.5" height="8" fill={woodColor} rx="0.2" />
            {/* Spear tip */}
            <path d="M 4.75 -2.5 L 3.8 -1 L 5.7 -1 Z" fill={metalColor} />
            <path d="M 4.75 -2.3 L 4.3 -1.2 L 5.2 -1.2 Z" fill="rgba(255,255,255,0.4)" />
          </g>
        ),
        north: null,
        east: (
          <g key="hand-item-east">
            <rect x="3" y="1" width="0.4" height="6.5" fill={woodColor} rx="0.2" />
            <path d="M 3.2 0 L 2.5 1 L 3.9 1 Z" fill={metalColor} />
          </g>
        ),
        west: (
          <g key="hand-item-west">
            <rect x="-3.4" y="1" width="0.4" height="6.5" fill={woodColor} rx="0.2" />
            <path d="M -3.2 0 L -2.5 1 L -3.9 1 Z" fill={metalColor} />
          </g>
        )
      };
    }

    // HAMMERS & MACES
    if (itemName.includes('hammer') || itemName.includes('mace') || itemName.includes('club')) {
      return {
        south: (
          <g key="hand-item-south">
            <rect x="4.4" y="2" width="0.6" height="5.5" fill={woodColor} rx="0.2" />
            {/* Hammer head */}
            <rect x="3.5" y="0.5" width="2.4" height="1.8" fill={metalColor} rx="0.3" />
            <rect x="3.7" y="0.7" width="0.8" height="1.4" fill="rgba(255,255,255,0.3)" />
          </g>
        ),
        north: null,
        east: (
          <g key="hand-item-east">
            <rect x="3.5" y="4" width="0.5" height="4" fill={woodColor} rx="0.2" />
            <rect x="3" y="3" width="1.5" height="1.3" fill={metalColor} rx="0.3" />
          </g>
        ),
        west: (
          <g key="hand-item-west">
            <rect x="-4" y="4" width="0.5" height="4" fill={woodColor} rx="0.2" />
            <rect x="-4.5" y="3" width="1.5" height="1.3" fill={metalColor} rx="0.3" />
          </g>
        )
      };
    }

    // TORCHES
    if (itemName.includes('torch') || itemName.includes('lantern')) {
      return {
        south: (
          <g key="hand-item-south">
            <rect x="4.4" y="2" width="0.6" height="5" fill={woodColor} rx="0.2" />
            {/* Flame */}
            <ellipse cx="4.7" cy="0.8" rx="1" ry="1.5" fill="#ff6b35" opacity="0.9" />
            <ellipse cx="4.7" cy="1" rx="0.7" ry="1.1" fill="#ffd60a" opacity="0.8" />
            <circle cx="4.7" cy="1.2" r="0.4" fill="rgba(255,255,255,0.7)" />
          </g>
        ),
        north: null,
        east: (
          <g key="hand-item-east">
            <rect x="3.5" y="4" width="0.5" height="3.5" fill={woodColor} rx="0.2" />
            <ellipse cx="3.75" cy="3" rx="0.8" ry="1.2" fill="#ff6b35" opacity="0.9" />
            <ellipse cx="3.75" cy="3.2" rx="0.5" ry="0.8" fill="#ffd60a" opacity="0.8" />
          </g>
        ),
        west: (
          <g key="hand-item-west">
            <rect x="-4" y="4" width="0.5" height="3.5" fill={woodColor} rx="0.2" />
            <ellipse cx="-3.75" cy="3" rx="0.8" ry="1.2" fill="#ff6b35" opacity="0.9" />
            <ellipse cx="-3.75" cy="3.2" rx="0.5" ry="0.8" fill="#ffd60a" opacity="0.8" />
          </g>
        )
      };
    }

    // SHIELDS (in off-hand)
    if (itemName.includes('shield')) {
      return {
        south: (
          <g key="hand-item-south">
            <ellipse cx="-4" cy="4" rx="1.5" ry="2.2" fill={itemColor} stroke={metalColor} strokeWidth="0.2" />
            <circle cx="-4" cy="4" r="0.6" fill={metalColor} />
            <rect x="-4.3" y="3" width="0.6" height="2" fill="rgba(0,0,0,0.2)" />
          </g>
        ),
        north: null,
        east: null,
        west: (
          <g key="hand-item-west">
            <ellipse cx="-3.5" cy="4" rx="0.8" ry="2" fill={itemColor} stroke={metalColor} strokeWidth="0.15" />
          </g>
        )
      };
    }

    // BOOKS & SCROLLS
    if (itemName.includes('book') || itemName.includes('tome') || itemName.includes('scroll')) {
      return {
        south: (
          <g key="hand-item-south">
            <rect x="3.8" y="4" width="1.8" height="2.5" fill="#8b4513" rx="0.2" />
            <rect x="4" y="4.2" width="1.4" height="2.1" fill="#f4e4c1" />
            <line x1="4.2" y1="4.5" x2="5.2" y2="4.5" stroke="#8b4513" strokeWidth="0.08" />
            <line x1="4.2" y1="5" x2="5.2" y2="5" stroke="#8b4513" strokeWidth="0.08" />
          </g>
        ),
        north: null,
        east: (
          <g key="hand-item-east">
            <rect x="3.2" y="5" width="1.2" height="1.8" fill="#8b4513" rx="0.2" />
            <rect x="3.3" y="5.1" width="1" height="1.6" fill="#f4e4c1" />
          </g>
        ),
        west: (
          <g key="hand-item-west">
            <rect x="-4.4" y="5" width="1.2" height="1.8" fill="#8b4513" rx="0.2" />
            <rect x="-4.3" y="5.1" width="1" height="1.6" fill="#f4e4c1" />
          </g>
        )
      };
    }

    // DEFAULT: Generic tool/item
    return {
      south: (
        <g key="hand-item-south">
          <rect x="4.3" y="3" width="0.8" height="3.5" fill={itemColor} rx="0.3" />
          <rect x="4.4" y="3.2" width="0.4" height="3.1" fill="rgba(255,255,255,0.2)" />
        </g>
      ),
      north: null,
      east: (
        <g key="hand-item-east">
          <rect x="3.4" y="5" width="0.6" height="2.5" fill={itemColor} rx="0.2" />
        </g>
      ),
      west: (
        <g key="hand-item-west">
          <rect x="-4" y="5" width="0.6" height="2.5" fill={itemColor} rx="0.2" />
        </g>
      )
    };
  }, [equippedItems?.main_hand, weaponRotation]);

  // Generate charging glow effect
  const chargeGlow = useMemo(() => {
    if (!isCharging || !equippedItems?.main_hand) return null;

    const glowIntensity = chargeProgress;
    const pulseScale = 1 + (Math.sin(Date.now() / 100) * 0.1 * chargeProgress);

    return (
      <g key="charge-glow">
        {/* Pulsing energy circle around weapon */}
        <circle
          cx="4.5"
          cy="4"
          r={3 * pulseScale}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={0.8 * glowIntensity}
          opacity={0.6 * glowIntensity}
          style={{ filter: 'blur(1px)' }}
        />
        <circle
          cx="4.5"
          cy="4"
          r={2.2 * pulseScale}
          fill="none"
          stroke="#fcd34d"
          strokeWidth={0.5 * glowIntensity}
          opacity={0.8 * glowIntensity}
        />
        {/* Sparks */}
        {chargeProgress > 0.5 && (
          <>
            <circle cx="5.5" cy="2" r="0.3" fill="#fbbf24" opacity={0.7 * chargeProgress} />
            <circle cx="3.5" cy="2.5" r="0.2" fill="#fcd34d" opacity={0.6 * chargeProgress} />
            <circle cx="5.8" cy="5" r="0.25" fill="#fbbf24" opacity={0.8 * chargeProgress} />
          </>
        )}
      </g>
    );
  }, [isCharging, chargeProgress, equippedItems?.main_hand]);

  // Generate Zelda-style swoosh effect for swing animation
  const swingSwoosh = useMemo(() => {
    if (!isSwinging || swingProgress === 0 || !equippedItems?.main_hand) return null;

    const item = equippedItems.main_hand;
    const itemName = item.name.toLowerCase();

    // Determine swoosh color based on weapon type
    let swooshColor = '#ffffff';
    let swooshGlow = '#94a3b8';

    if (itemName.includes('magic') || itemName.includes('wizard')) {
      swooshColor = '#a78bfa'; // Purple for magic
      swooshGlow = '#c4b5fd';
    } else if (itemName.includes('fire') || itemName.includes('flame')) {
      swooshColor = '#f97316'; // Orange for fire
      swooshGlow = '#fb923c';
    } else if (itemName.includes('ice') || itemName.includes('frost')) {
      swooshColor = '#3b82f6'; // Blue for ice
      swooshGlow = '#60a5fa';
    }

    // Calculate arc angle based on progress (larger for power swing)
    const startAngle = isPowerSwing ? -75 : -45; // Power swing starts further back
    const endAngle = isPowerSwing ? 160 : 135; // Power swing goes further forward
    const currentAngle = startAngle + (endAngle - startAngle) * swingProgress;

    // Different arc parameters for different directions
    let arcRadius = isPowerSwing ? 10 : 8; // Bigger radius for power swing
    let arcCenterX = 0;
    let arcCenterY = 2;
    let arcRotation = 0;

    switch (direction) {
      case 'south': // Facing viewer
        arcCenterX = 3;
        arcCenterY = 2;
        arcRotation = 0;
        break;
      case 'north': // Facing away
        return null; // Don't show swoosh when facing away
      case 'east': // Facing right
        arcCenterX = 3;
        arcCenterY = 3;
        arcRotation = -30;
        arcRadius = 7;
        break;
      case 'west': // Facing left
        arcCenterX = -3;
        arcCenterY = 3;
        arcRotation = 30;
        arcRadius = 7;
        break;
    }

    // Calculate the arc path with three progressive segments for trailing effect
    const segments = isPowerSwing ? 4 : 3; // More trail segments for power swing
    const trailLength = isPowerSwing ? 80 : 60; // Longer trail for power swing

    return (
      <g transform={`rotate(${arcRotation} ${arcCenterX} ${arcCenterY})`}>
        {/* Create trailing swoosh effect with multiple arcs */}
        {[...Array(segments)].map((_, i) => {
          const segmentProgress = Math.max(0, swingProgress - (i * 0.15));
          if (segmentProgress <= 0) return null;

          const segmentAngle = startAngle + (endAngle - startAngle) * segmentProgress;
          const segmentEndAngle = Math.min(segmentAngle + trailLength, endAngle);

          // Calculate arc points
          const startRad = (segmentAngle * Math.PI) / 180;
          const endRad = (segmentEndAngle * Math.PI) / 180;

          const x1 = arcCenterX + arcRadius * Math.cos(startRad);
          const y1 = arcCenterY + arcRadius * Math.sin(startRad);
          const x2 = arcCenterX + arcRadius * Math.cos(endRad);
          const y2 = arcCenterY + arcRadius * Math.sin(endRad);

          // Opacity fades out for trailing segments
          const opacity = (1 - i * 0.3) * (1 - segmentProgress * 0.3);
          const baseWidth = isPowerSwing ? 1.8 : 1.2; // Thicker for power swing
          const strokeWidth = baseWidth - i * 0.3;

          return (
            <g key={i}>
              {/* Outer glow */}
              <path
                d={`M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 0 1 ${x2} ${y2}`}
                fill="none"
                stroke={swooshGlow}
                strokeWidth={strokeWidth + 1}
                strokeLinecap="round"
                opacity={opacity * 0.4}
                style={{
                  filter: `blur(${1 + i * 0.5}px)`,
                }}
              />
              {/* Main swoosh line */}
              <path
                d={`M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 0 1 ${x2} ${y2}`}
                fill="none"
                stroke={swooshColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={opacity}
              />
            </g>
          );
        })}

        {/* Speed lines for extra impact */}
        {swingProgress > 0.3 && swingProgress < 0.8 && (
          <>
            <line
              x1={arcCenterX + arcRadius * 0.7}
              y1={arcCenterY - 1}
              x2={arcCenterX + arcRadius * 1.2}
              y2={arcCenterY - 2}
              stroke={swooshColor}
              strokeWidth="0.4"
              opacity={0.6}
              strokeLinecap="round"
            />
            <line
              x1={arcCenterX + arcRadius * 0.8}
              y1={arcCenterY + 1}
              x2={arcCenterX + arcRadius * 1.3}
              y2={arcCenterY + 1.5}
              stroke={swooshColor}
              strokeWidth="0.3"
              opacity={0.4}
              strokeLinecap="round"
            />
          </>
        )}
      </g>
    );
  }, [isSwinging, swingProgress, direction, equippedItems?.main_hand, isPowerSwing]);

  return (
    <g
      transform={`translate(${x}, ${y - 5}) scale(${ICON_SCALE * 1.1})`}
      style={{
        transition: 'transform 0.0s ease-out',
        willChange: 'transform',
        shapeRendering: 'geometricPrecision'
      }}
    >
      <defs>
        <filter id={`playerGlow-${character.id}`} x="-50%" y="-50%" width="200%" height="200%">
          {!isSafari ? (
            <>
              <feGaussianBlur in="SourceAlpha" stdDeviation="2.5"/>
              <feOffset dx="0" dy="0" result="offsetblur"/>
              <feFlood floodColor={glowColor} floodOpacity={glowOpacity}/>
              <feComposite in2="offsetblur" operator="in"/>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </>
          ) : (
            // Simple glow effect for Safari without blur
            <>
              <feFlood floodColor={glowColor} floodOpacity={glowOpacity * 0.3}/>
              <feComposite in2="SourceAlpha" operator="in"/>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </>
          )}
        </filter>

        {/* Enhanced visibility filter with outline and shadow */}
        <filter id={`playerOutline-${character.id}`} x="-50%" y="-50%" width="200%" height="200%">
          {!isSafari ? (
            <>
              {/* Create thick black outline */}
              <feMorphology operator="dilate" radius="0.5" in="SourceAlpha" result="expanded"/>
              <feFlood floodColor="#000000" floodOpacity="0.7"/>
              <feComposite in2="expanded" operator="in" result="outline"/>

              {/* Add drop shadow */}
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="shadowBlur"/>
              <feOffset in="shadowBlur" dx="1" dy="2" result="shadow"/>
              <feFlood floodColor="#000000" floodOpacity="0.8"/>
              <feComposite in2="shadow" operator="in" result="shadowColored"/>

              {/* Combine everything */}
              <feMerge>
                <feMergeNode in="shadowColored"/>
                <feMergeNode in="outline"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </>
          ) : (
            // Simple outline for Safari without blur
            <>
              <feMorphology operator="dilate" radius="0.5" in="SourceAlpha" result="expanded"/>
              <feFlood floodColor="#000000" floodOpacity="0.5"/>
              <feComposite in2="expanded" operator="in" result="outline"/>
              <feOffset in="outline" dx="1" dy="1" result="offsetOutline"/>
              <feMerge>
                <feMergeNode in="offsetOutline"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </>
          )}
        </filter>

        {/* Face gradient for subtle depth */}
        <radialGradient id={`faceGradient-${character.id}`} cx="50%" cy="30%">
          <stop offset="0%" stopColor={adjustColorBrightness(skinColor, 12)} />
          <stop offset="50%" stopColor={skinColor} />
          <stop offset="100%" stopColor={adjustColorBrightness(skinColor, -8)} />
        </radialGradient>

        {/* Jaw shadow gradient */}
        <linearGradient id={`jawGradient-${character.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={skinColor} />
          <stop offset="70%" stopColor={adjustColorBrightness(skinColor, -6)} />
          <stop offset="100%" stopColor={adjustColorBrightness(skinColor, -12)} />
        </linearGradient>
      </defs>

      <g>
        {/* Temporarily removed filter for performance: filter={`url(#playerOutline-${character.id})`} */}
        {/* Pixel shadow */}
        <rect x="-4" y="8" width="8" height="2" fill="rgba(0,0,0,0.4)" rx="1" />

        {/* FRONT VIEW - when facing south/front */}
        {direction !== 'north' && (
        <>
            {/* Z-ORDER: Render body/clothing FIRST (back layer), then head/face (front layer) */}

            {/* Cloak - BACK cape flowing down behind body */}
            {cloakColor && (
              <>
                {/* Main back panel - wide cape from shoulders down */}
                <path
                  d={`M ${-bodyWidth/2 - 0.3} 1.5
                      L ${-bodyWidth/2 - 1.2} ${bodyHeight + 3}
                      Q ${-bodyWidth/2 - 0.8} ${bodyHeight + 4.5}, 0 ${bodyHeight + 5}
                      Q ${bodyWidth/2 + 0.8} ${bodyHeight + 4.5}, ${bodyWidth/2 + 1.2} ${bodyHeight + 3}
                      L ${bodyWidth/2 + 0.3} 1.5
                      Q 0 1.3, ${-bodyWidth/2 - 0.3} 1.5
                      Z`}
                  fill={cloakColor}
                  opacity="0.85"
                />
                {/* Left side drape */}
                <path
                  d={`M ${-bodyWidth/2 - 0.3} 1.5
                      L ${-bodyWidth/2 - 1.5} ${bodyHeight + 3.5}
                      L ${-bodyWidth/2 - 1.2} ${bodyHeight + 3}
                      Z`}
                  fill={adjustColorBrightness(cloakColor, -15)}
                  opacity="0.8"
                />
                {/* Right side drape */}
                <path
                  d={`M ${bodyWidth/2 + 0.3} 1.5
                      L ${bodyWidth/2 + 1.5} ${bodyHeight + 3.5}
                      L ${bodyWidth/2 + 1.2} ${bodyHeight + 3}
                      Z`}
                  fill={adjustColorBrightness(cloakColor, -15)}
                  opacity="0.8"
                />
                {/* Back shading for depth */}
                <ellipse
                  cx="0"
                  cy={bodyHeight + 3}
                  rx={bodyWidth/2 + 0.5}
                  ry="1.5"
                  fill="rgba(0,0,0,0.15)"
                />
              </>
            )}

            {/* Equipped Items on Back/Body - rendered before body so they appear behind */}
            {equippedItems && (
              <>
                {/* Shield on back (off_hand slot) - only show if not wielding weapon */}
                {equippedItems.off_hand && equippedItems.off_hand.category === 'Weapon' &&
                 equippedItems.off_hand.name && equippedItems.off_hand.name.toLowerCase().includes('shield') && (
                  <g>
                    {/* Shield oval shape on back */}
                    <ellipse
                      cx={bodyWidth/2 + 0.8}
                      cy={bodyHeight/2 + 1.5}
                      rx="1.8"
                      ry="2.5"
                      fill={detectItemColor(equippedItems.off_hand.color, '#8B4513')}
                      stroke={adjustColorBrightness(detectItemColor(equippedItems.off_hand.color, '#8B4513'), -25)}
                      strokeWidth="0.2"
                    />
                    {/* Shield boss/center */}
                    <circle
                      cx={bodyWidth/2 + 0.8}
                      cy={bodyHeight/2 + 1.5}
                      r="0.5"
                      fill="#C0C0C0"
                    />
                    {/* Shield strap */}
                    <rect
                      x={bodyWidth/2 - 0.2}
                      y={1.5}
                      width="0.4"
                      height={bodyHeight * 0.4}
                      fill="#654321"
                      opacity="0.7"
                    />
                  </g>
                )}

                {/* Quiver on back (accessory slot) - check for arrows/bolts */}
                {equippedItems.accessory && equippedItems.accessory.name &&
                 (equippedItems.accessory.name.toLowerCase().includes('quiver') ||
                  equippedItems.accessory.name.toLowerCase().includes('arrow')) && (
                  <g>
                    {/* Quiver container */}
                    <rect
                      x={-bodyWidth/2 - 1.2}
                      y={1}
                      width="0.8"
                      height={bodyHeight * 0.6}
                      fill="#654321"
                      rx="0.2"
                    />
                    {/* Arrow fletching sticking out */}
                    <rect x={-bodyWidth/2 - 1.1} y={0.5} width="0.5" height="0.8" fill="#8B4513" />
                    <rect x={-bodyWidth/2 - 1.0} y={0.2} width="0.5" height="0.8" fill="#A0522D" />
                    <rect x={-bodyWidth/2 - 0.9} y={0.4} width="0.5" height="0.8" fill="#654321" />
                  </g>
                )}

                {/* Bag/Pouch on hip (accessory slot) */}
                {equippedItems.accessory && equippedItems.accessory.name &&
                 (equippedItems.accessory.name.toLowerCase().includes('bag') ||
                  equippedItems.accessory.name.toLowerCase().includes('pouch') ||
                  equippedItems.accessory.name.toLowerCase().includes('satchel')) && (
                  <g>
                    {/* Pouch hanging from belt */}
                    <ellipse
                      cx={bodyWidth/2 + 0.5}
                      cy={bodyHeight * 0.7 + 2}
                      rx="0.9"
                      ry="1.1"
                      fill={detectItemColor(equippedItems.accessory.color, '#8B7355')}
                    />
                    {/* Pouch strap */}
                    <rect
                      x={bodyWidth/2 + 0.3}
                      y={bodyHeight * 0.6 + 1}
                      width="0.3"
                      height="1.2"
                      fill="#654321"
                      opacity="0.8"
                    />
                    {/* Pouch closure */}
                    <rect
                      x={bodyWidth/2 + 0.2}
                      y={bodyHeight * 0.7 + 1.8}
                      width="0.6"
                      height="0.2"
                      fill="#C0C0C0"
                    />
                  </g>
                )}

                {/* Tool on belt (main_hand or accessory) - shows hammers, tools, etc. */}
                {((equippedItems.main_hand && equippedItems.main_hand.name &&
                   (equippedItems.main_hand.name.toLowerCase().includes('hammer') ||
                    equippedItems.main_hand.name.toLowerCase().includes('pickaxe') ||
                    equippedItems.main_hand.name.toLowerCase().includes('axe') ||
                    equippedItems.main_hand.name.toLowerCase().includes('shovel'))) ||
                  (equippedItems.accessory && equippedItems.accessory.name &&
                   (equippedItems.accessory.name.toLowerCase().includes('hammer') ||
                    equippedItems.accessory.name.toLowerCase().includes('tool')))) && (
                  <g>
                    {(() => {
                      const toolItem = (equippedItems.main_hand && equippedItems.main_hand.name &&
                                       (equippedItems.main_hand.name.toLowerCase().includes('hammer') ||
                                        equippedItems.main_hand.name.toLowerCase().includes('pickaxe') ||
                                        equippedItems.main_hand.name.toLowerCase().includes('axe') ||
                                        equippedItems.main_hand.name.toLowerCase().includes('shovel')))
                        ? equippedItems.main_hand
                        : equippedItems.accessory;

                      const toolName = toolItem?.name?.toLowerCase() || '';

                      if (toolName.includes('hammer')) {
                        return (
                          <>
                            {/* Hammer head */}
                            <rect x={-bodyWidth/2 - 0.5} y={bodyHeight * 0.7 + 1.5} width="1.2" height="0.6" fill="#808080" rx="0.1" />
                            {/* Hammer handle */}
                            <rect x={-bodyWidth/2 + 0.1} y={bodyHeight * 0.7 + 1.2} width="0.3" height="1.8" fill="#654321" />
                          </>
                        );
                      } else if (toolName.includes('pickaxe')) {
                        return (
                          <>
                            {/* Pickaxe head */}
                            <path d={`M ${-bodyWidth/2 - 0.7} ${bodyHeight * 0.7 + 1.8} L ${-bodyWidth/2 + 0.5} ${bodyHeight * 0.7 + 1.5} L ${-bodyWidth/2 + 0.3} ${bodyHeight * 0.7 + 2.1} Z`} fill="#808080" />
                            {/* Pickaxe handle */}
                            <rect x={-bodyWidth/2 + 0.1} y={bodyHeight * 0.7 + 1.2} width="0.25" height="1.8" fill="#654321" />
                          </>
                        );
                      } else if (toolName.includes('axe')) {
                        return (
                          <>
                            {/* Axe blade */}
                            <path d={`M ${-bodyWidth/2 - 0.2} ${bodyHeight * 0.7 + 1.5} L ${-bodyWidth/2 + 0.5} ${bodyHeight * 0.7 + 1.8} L ${-bodyWidth/2 - 0.2} ${bodyHeight * 0.7 + 2.3} Z`} fill="#C0C0C0" />
                            {/* Axe handle */}
                            <rect x={-bodyWidth/2 + 0.2} y={bodyHeight * 0.7 + 1.2} width="0.3" height="1.9" fill="#8B4513" />
                          </>
                        );
                      }
                      return null;
                    })()}
                  </g>
                )}
              </>
            )}

            {/* Body - pixel art style with subtle rounding and breathing animation */}
            <rect
              x={-bodyWidth/2}
              y={1 + breathOffset}
              width={bodyWidth}
              height={bodyHeight}
              fill={isNaked ? skinColor : clothingColor}
              rx="0.4"
            />
            {/* Blocky shading for depth */}
            <rect
              x={-bodyWidth/2}
              y={1.5 + breathOffset}
              width={bodyWidth * 0.35}
              height={bodyHeight - 1}
              fill="rgba(255,255,255,0.12)"
            />
            <rect
              x={bodyWidth/2 - bodyWidth * 0.3}
              y={1.8 + breathOffset}
              width={bodyWidth * 0.3}
              height={bodyHeight - 1.5}
              fill="rgba(0,0,0,0.1)"
            />

            {/* Belt - rendered on waist with breathing animation */}
            {beltColor && (
              <>
                <rect
                  x={-bodyWidth/2}
                  y={bodyHeight * 0.6 + 1 + breathOffset}
                  width={bodyWidth}
                  height="0.6"
                  fill={beltColor}
                />
                <rect
                  x={-bodyWidth/2 + bodyWidth * 0.3}
                  y={bodyHeight * 0.6 + 1 + breathOffset}
                  width={bodyWidth * 0.4}
                  height="0.6"
                  fill="rgba(0,0,0,0.15)"
                />
                {/* Belt buckle */}
                <rect
                  x={-0.4}
                  y={bodyHeight * 0.6 + 0.9 + breathOffset}
                  width="0.8"
                  height="0.8"
                  fill="#c0c0c0"
                  rx="0.1"
                />
                <rect
                  x={-0.25}
                  y={bodyHeight * 0.6 + 1.05 + breathOffset}
                  width="0.5"
                  height="0.5"
                  fill="rgba(0,0,0,0.3)"
                  rx="0.1"
                />
              </>
            )}

            {/* NOW render head/face ON TOP of body */}
            {/* Head - larger size with gradient for depth */}
            <ellipse cx="0" cy="-2.2" rx="2.8" ry="3.2" fill={`url(#faceGradient-${character.id})`} />
            {/* Subtle shading for depth */}
            <ellipse cx="-1" cy="-3.5" rx="1" ry="1.5" fill="rgba(255,255,255,0.15)" />
            <ellipse cx="1.5" cy="-2" rx="0.8" ry="1.2" fill="rgba(0,0,0,0.08)" />

            {/* Chin/jaw with enhanced definition - very small and subtle */}
            <ellipse cx="0" cy="0.3" rx="1.4" ry="0.4" fill={`url(#jawGradient-${character.id})`} opacity="0.5" />
            {/* Under-chin shadow - very subtle */}
            <ellipse cx="0" cy="0.7" rx="1.0" ry="0.25" fill="rgba(0,0,0,0.08)" opacity="0.4" />

            {/* Eyes - simplified for map visibility */}
            {/* Eye whites */}
            <ellipse cx="-1.2" cy="-2.2" rx="0.7" ry="0.75" fill="#ffffff" />
            <ellipse cx="1.2" cy="-2.2" rx="0.7" ry="0.75" fill="#ffffff" />
            {/* Irises - using character's actual eye color */}
            <circle cx="-1.2" cy="-2.1" r="0.4" fill={eyeColor || '#3a2a1a'} />
            <circle cx="1.2" cy="-2.1" r="0.4" fill={eyeColor || '#3a2a1a'} />
            {/* Pupils - darker center */}
            <circle cx="-1.2" cy="-2.1" r="0.18" fill="#000000" />
            <circle cx="1.2" cy="-2.1" r="0.18" fill="#000000" />
            {/* Eye highlights for depth */}
            <circle cx="-1.1" cy="-2.2" r="0.12" fill="rgba(255,255,255,0.7)" />
            <circle cx="1.3" cy="-2.2" r="0.12" fill="rgba(255,255,255,0.7)" />
            {/* Eyelids - more opaque with smooth blink animation */}
            <ellipse
              cx="-1.2"
              cy={isBlinking ? "-2.2" : "-2.75"}
              rx="0.75"
              ry={isBlinking ? 1.5 : 0.3}
              fill={adjustColorBrightness(skinColor, -10)}
              opacity="0.8"
              style={{ transition: 'cy 0.08s ease-in-out, ry 0.08s ease-in-out' }}
            />
            <ellipse
              cx="1.2"
              cy={isBlinking ? "-2.2" : "-2.75"}
              rx="0.75"
              ry={isBlinking ? 1.5 : 0.3}
              fill={adjustColorBrightness(skinColor, -10)}
              opacity="0.8"
              style={{ transition: 'cy 0.08s ease-in-out, ry 0.08s ease-in-out' }}
            />

            {/* Eyebrows - positioned above eyes with thickness variations */}
            {(() => {
              // Calculate eyebrow thickness based on eyebrowThickness property
              let browHeight = 0.25; // default (medium)
              if (eyebrowThickness === 'thin') browHeight = 0.18;
              else if (eyebrowThickness === 'thick') browHeight = 0.35;
              else if (eyebrowThickness === 'bushy') browHeight = 0.45;

              const browY = -3.1;
              const browColor = hairColor || '#3a2a1a';
              const browShadow = adjustColorBrightness(browColor, -15);

              return (
                <>
                  {/* Left eyebrow */}
                  <rect x="-2.1" y={browY} width="1.8" height={browHeight} fill={browColor} rx="0.12" />
                  {eyebrowThickness === 'bushy' && (
                    <rect x="-2.0" y={browY - 0.15} width="1.5" height="0.2" fill={browShadow} rx="0.1" opacity="0.5" />
                  )}
                  {/* Right eyebrow */}
                  <rect x="0.3" y={browY} width="1.8" height={browHeight} fill={browColor} rx="0.12" />
                  {eyebrowThickness === 'bushy' && (
                    <rect x="0.5" y={browY - 0.15} width="1.5" height="0.2" fill={browShadow} rx="0.1" opacity="0.5" />
                  )}
                </>
              );
            })()}

            {/* Nose - subtle shadow */}
            <ellipse cx="0" cy="-1.2" rx="0.3" ry="0.5" fill="rgba(0,0,0,0.1)" />

            {/* Mouth - curved for more natural look */}
            <ellipse cx="0" cy="-0.2" rx="0.9" ry="0.3" fill="rgba(0,0,0,0.25)" />
            <ellipse cx="0" cy="-0.3" rx="0.6" ry="0.18" fill="rgba(255,255,255,0.1)" />

            {/* Skin Texture Details (Phase 1) - adjusted for larger face */}
            {skinTexture === 'freckled' && (
              <>
                {/* 3-5 small brown dots on cheeks/nose */}
                <rect x="-1.8" y="-2.8" width="0.3" height="0.3" fill="#8B4513" opacity="0.6" />
                <rect x="1.5" y="-2.8" width="0.3" height="0.3" fill="#8B4513" opacity="0.6" />
                <rect x="-0.2" y="-2.2" width="0.3" height="0.3" fill="#8B4513" opacity="0.5" />
                <rect x="-2.2" y="-1.8" width="0.3" height="0.3" fill="#8B4513" opacity="0.5" />
                <rect x="1.9" y="-1.8" width="0.3" height="0.3" fill="#8B4513" opacity="0.5" />
              </>
            )}
            {skinTexture === 'weathered' && (
              <>
                {/* Darker pixels showing sun damage on forehead and cheeks */}
                <rect x="-0.8" y="-4.5" width="0.4" height="0.3" fill={adjustColorBrightness(skinColor, -15)} opacity="0.7" />
                <rect x="0.4" y="-4.5" width="0.4" height="0.3" fill={adjustColorBrightness(skinColor, -15)} opacity="0.7" />
                <rect x="-1.8" y="-2.5" width="0.5" height="0.4" fill={adjustColorBrightness(skinColor, -10)} opacity="0.6" />
                <rect x="1.3" y="-2.5" width="0.5" height="0.4" fill={adjustColorBrightness(skinColor, -10)} opacity="0.6" />
              </>
            )}
            {skinTexture === 'scarred' && (
              <>
                {/* 1-2px white/pink line on face */}
                <rect x="-1.5" y="-3.5" width="0.3" height="1.5" fill="#ffdddd" opacity="0.8" />
                <rect x="-1.8" y="-3.5" width="0.3" height="1.2" fill="#ffeeee" opacity="0.6" />
              </>
            )}
            {skinTexture === 'rough' && (
              <>
                {/* 1-2 darker pixels scattered on face */}
                <rect x="-1.6" y="-3.8" width="0.3" height="0.3" fill={adjustColorBrightness(skinColor, -12)} opacity="0.5" />
                <rect x="1.1" y="-2.8" width="0.3" height="0.3" fill={adjustColorBrightness(skinColor, -12)} opacity="0.5" />
              </>
            )}

            {/* Markings (Phase 1) - Enhanced with piercings and paint */}
            {markings && markings.length > 0 && markings.map((marking, idx) => {
              // Only render first 4 markings for performance
              if (idx >= 4) return null;

              const location = marking.location?.toLowerCase() || '';
              const pattern = (marking as any).pattern?.toLowerCase() || '';

              // Scars
              if (marking.type === 'scar' && location.includes('face')) {
                return (
                  <rect
                    key={`marking-${idx}`}
                    x="-0.8"
                    y="-3.5"
                    width="0.4"
                    height="2"
                    fill={marking.color || '#ffdddd'}
                    opacity="0.7"
                  />
                );
              }

              // Tattoos
              if (marking.type === 'tattoo' && location.includes('face')) {
                return (
                  <rect
                    key={`marking-${idx}`}
                    x="-1.8"
                    y="-2.8"
                    width="0.8"
                    height="1.2"
                    fill={marking.color || '#4169E1'}
                    opacity="0.6"
                  />
                );
              }

              // Face Paint
              if (marking.type === 'paint' && location.includes('face')) {
                // Horizontal stripes on cheeks
                if (pattern.includes('stripe') || pattern.includes('war')) {
                  return (
                    <g key={`marking-${idx}`}>
                      {/* Left cheek stripes */}
                      <rect x="-2.2" y="-2.5" width="1.2" height="0.2" fill={marking.color || '#e63946'} opacity="0.8" />
                      <rect x="-2.2" y="-2.0" width="1.2" height="0.2" fill={marking.color || '#e63946'} opacity="0.8" />
                      {/* Right cheek stripes */}
                      <rect x="1.0" y="-2.5" width="1.2" height="0.2" fill={marking.color || '#e63946'} opacity="0.8" />
                      <rect x="1.0" y="-2.0" width="1.2" height="0.2" fill={marking.color || '#e63946'} opacity="0.8" />
                    </g>
                  );
                }
                // Dots/circles pattern
                if (pattern.includes('dot') || pattern.includes('circle')) {
                  return (
                    <g key={`marking-${idx}`}>
                      <circle cx="-1.8" cy="-2.8" r="0.25" fill={marking.color || '#ffd700'} opacity="0.9" />
                      <circle cx="1.8" cy="-2.8" r="0.25" fill={marking.color || '#ffd700'} opacity="0.9" />
                      <circle cx="0" cy="-3.5" r="0.25" fill={marking.color || '#ffd700'} opacity="0.9" />
                    </g>
                  );
                }
                // Default paint - cheek marks
                return (
                  <g key={`marking-${idx}`}>
                    <rect x="-2.0" y="-2.5" width="0.8" height="1.0" fill={marking.color || '#e63946'} opacity="0.7" rx="0.2" />
                    <rect x="1.2" y="-2.5" width="0.8" height="1.0" fill={marking.color || '#e63946'} opacity="0.7" rx="0.2" />
                  </g>
                );
              }

              // Piercings - Enhanced support
              if ((marking as any).type === 'piercing') {
                const metalColor = marking.color || '#C0C0C0'; // Silver default
                const highlightColor = '#FFFFFF';

                // Nose piercings
                if (location === 'nose') {
                  if (pattern === 'septum' || pattern === 'ring') {
                    // Septum ring
                    return (
                      <g key={`marking-${idx}`}>
                        <rect x="-0.3" y="-0.9" width="0.6" height="0.5" fill={metalColor} rx="0.1" />
                        <rect x="-0.2" y="-0.9" width="0.15" height="0.15" fill={highlightColor} opacity="0.6" />
                      </g>
                    );
                  } else {
                    // Nostril stud
                    return (
                      <g key={`marking-${idx}`}>
                        <circle cx="0.5" cy="-1.0" r="0.18" fill={metalColor} />
                        <circle cx="0.5" cy="-1.0" r="0.08" fill={highlightColor} opacity="0.8" />
                      </g>
                    );
                  }
                }

                // Eyebrow piercings
                if (location === 'eyebrow') {
                  return (
                    <g key={`marking-${idx}`}>
                      <rect x="1.2" y="-3.2" width="0.3" height="0.2" fill={metalColor} rx="0.1" />
                      <rect x="1.2" y="-3.2" width="0.12" height="0.12" fill={highlightColor} opacity="0.7" />
                    </g>
                  );
                }

                // Lip piercings
                if (location === 'lip' || location === 'mouth') {
                  if (pattern === 'labret') {
                    // Center lower lip
                    return (
                      <g key={`marking-${idx}`}>
                        <circle cx="0" cy="0.2" r="0.15" fill={metalColor} />
                        <circle cx="0" cy="0.2" r="0.06" fill={highlightColor} opacity="0.8" />
                      </g>
                    );
                  } else {
                    // Side lip ring
                    return (
                      <g key={`marking-${idx}`}>
                        <circle cx="-0.6" cy="0" r="0.15" fill={metalColor} />
                        <circle cx="-0.6" cy="0" r="0.06" fill={highlightColor} opacity="0.8" />
                      </g>
                    );
                  }
                }

                // Ear piercings (visible from front)
                if (location === 'ear') {
                  return (
                    <g key={`marking-${idx}`}>
                      <circle cx="-2.5" cy="-2.0" r="0.18" fill={metalColor} />
                      <circle cx="2.5" cy="-2.0" r="0.18" fill={metalColor} />
                    </g>
                  );
                }
              }

              // Beauty marks and moles
              if (marking.type === 'beauty_mark') {
                return (
                  <circle
                    key={`marking-${idx}`}
                    cx="1.5"
                    cy="-2"
                    r="0.25"
                    fill="#3a3a3a"
                  />
                );
              }

              if (marking.type === 'mole') {
                return (
                  <circle
                    key={`marking-${idx}`}
                    cx="-1.3"
                    cy="-1.8"
                    r="0.3"
                    fill="#654321"
                  />
                );
              }

              return null;
            })}

            {/* Cloak - FRONT shoulder caps and clasp */}
            {cloakColor && (
              <>
                {/* Left shoulder cap - sits ON the shoulder */}
                <ellipse
                  cx={-bodyWidth/2 - 0.5}
                  cy="1.8"
                  rx="1.2"
                  ry="0.9"
                  fill={cloakColor}
                  opacity="0.75"
                />
                {/* Right shoulder cap - sits ON the shoulder */}
                <ellipse
                  cx={bodyWidth/2 + 0.5}
                  cy="1.8"
                  rx="1.2"
                  ry="0.9"
                  fill={cloakColor}
                  opacity="0.75"
                />
                {/* Optional: Small front drape below torso */}
                {bodyHeight > 5 && (
                  <path
                    d={`M -0.4 ${bodyHeight + 0.8}
                        L -0.5 ${bodyHeight + 2}
                        Q 0 ${bodyHeight + 2.3}, 0.5 ${bodyHeight + 2}
                        L 0.4 ${bodyHeight + 0.8}
                        Z`}
                    fill={cloakColor}
                    opacity="0.5"
                  />
                )}

                {/* Neck clasp/brooch */}
                <circle cx="0" cy="1.5" r="0.35" fill={adjustColorBrightness(cloakColor, -20)} />
                <circle cx="0" cy="1.5" r="0.25" fill="#c0c0c0" />
                <circle cx="0" cy="1.5" r="0.13" fill="#e5e7eb" />
                {/* Clasp highlight */}
                <circle cx="-0.07" cy="1.43" r="0.07" fill="rgba(255,255,255,0.9)" />
              </>
            )}
            
            {/* Arms - blocky pixel art style with breathing animation */}
            {/* Left arm - animated with walk and breathing */}
            <rect x="-4.2" y={1 + breathOffset + (walkFrame === 0 ? -0.5 : 0.5)} width="1.4" height="2" fill={isNaked ? skinColor : clothingColor} rx="0.3" />
            <rect x="-4.2" y={1 + breathOffset + (walkFrame === 0 ? -0.5 : 0.5)} width="0.5" height="2" fill="rgba(255,255,255,0.12)" />
            <rect x="-4" y={3 + breathOffset + (walkFrame === 0 ? -0.5 : 0.5)} width="1.2" height="1.8" fill={skinColor} rx="0.3" />

            {/* Left hand */}
            <rect x="-4" y={4.8 + breathOffset + (walkFrame === 0 ? -0.5 : 0.5)} width="1.2" height="1" fill={skinColor} rx="0.3" />

            {/* Right arm - animated with swing, walk, and breathing */}
            <g transform={`rotate(${armRotation} 3.5 ${1.5 + breathOffset})`}>
              {/* Upper arm (sleeve) */}
              <rect x="2.8" y={1 + breathOffset + (walkFrame === 1 ? -0.5 : 0.5)} width="1.4" height="2" fill={isNaked ? skinColor : clothingColor} rx="0.3" />
              <rect x="3.7" y={1 + breathOffset + (walkFrame === 1 ? -0.5 : 0.5)} width="0.5" height="2" fill="rgba(0,0,0,0.1)" />
              {/* Forearm (skin) */}
              <rect x="2.8" y={3 + breathOffset + (walkFrame === 1 ? -0.5 : 0.5)} width="1.2" height="1.8" fill={skinColor} rx="0.3" />
              {/* Hand */}
              <rect x="2.8" y={4.8 + breathOffset + (walkFrame === 1 ? -0.5 : 0.5)} width="1.2" height="1" fill={skinColor} rx="0.3" />

              {/* Equipped hand item - rendered with arm */}
              {handItemElement?.south}
            </g>
            
            {/* Legs - blocky pixel art style - animated */}
            {/* Left leg */}
            <rect x={-1.5 + (walkFrame === 0 ? 0.15 : -0.15)} y={bodyHeight + 1} width="1.3" height="4.5" fill={legsColor} rx="0.4" />
            <rect x={-1.5 + (walkFrame === 0 ? 0.15 : -0.15)} y={bodyHeight + 1} width="0.4" height="4.5" fill="rgba(255,255,255,0.1)" />
            {/* Right leg */}
            <rect x={0.25 + (walkFrame === 1 ? 0.15 : -0.15)} y={bodyHeight + 1} width="1.3" height="4.5" fill={legsColor} rx="0.4" />
            <rect x={0.25 + (walkFrame === 1 ? 0.15 : -0.15) + 0.9} y={bodyHeight + 1.5} width="0.4" height="4" fill="rgba(0,0,0,0.1)" />

            {/* Feet/Boots - blocky - animated */}
            {bootsColor ? (
              <>
                {/* Left boot - animated */}
                <rect x={-1.8 + (walkFrame === 0 ? 0.15 : -0.15)} y={bodyHeight + 5.5} width="1.8" height="1.3" fill={bootsColor} rx="0.3" />
                <rect x={-1.8 + (walkFrame === 0 ? 0.15 : -0.15)} y={bodyHeight + 5.5} width="0.5" height="1.3" fill="rgba(255,255,255,0.15)" />
                <rect x={-1.8 + (walkFrame === 0 ? 0.15 : -0.15) + 1.5} y={bodyHeight + 5.7} width="0.3" height="0.9" fill="rgba(0,0,0,0.2)" />
                {/* Right boot - animated */}
                <rect x={0.05 + (walkFrame === 1 ? 0.15 : -0.15)} y={bodyHeight + 5.5} width="1.8" height="1.3" fill={bootsColor} rx="0.3" />
                <rect x={0.05 + (walkFrame === 1 ? 0.15 : -0.15) + 1.5} y={bodyHeight + 5.5} width="0.3" height="1.3" fill="rgba(0,0,0,0.15)" />
                <rect x={0.05 + (walkFrame === 1 ? 0.15 : -0.15) + 0.3} y={bodyHeight + 5.7} width="0.3" height="0.9" fill="rgba(0,0,0,0.2)" />
              </>
            ) : (
              <>
                {/* Bare feet or simple shoes - animated */}
                <rect x={-1.8 + (walkFrame === 0 ? 0.15 : -0.15)} y={bodyHeight + 5.5} width="1.8" height="1.2" fill="#654321" rx="0.3" />
                <rect x={0.05 + (walkFrame === 1 ? 0.15 : -0.15)} y={bodyHeight + 5.5} width="1.8" height="1.2" fill="#654321" rx="0.3" />
              </>
            )}

            {/* Hair - rendered AFTER head so it covers forehead, but BEFORE headgear */}
            {(!headgear || headgear.name === 'None' || headgear.name === 'none' ||
              // Show hair with hats but not with full coverage items
              (!headgear.name.toLowerCase().includes('helmet') &&
               !headgear.name.toLowerCase().includes('hood') &&
               !headgear.name.toLowerCase().includes('turban'))) && (
              <>
                {/* Check for specific hairstyles from portrait before falling back to length */}
                {hairstyle?.toLowerCase().includes('bun') ? (
                  <>
                    {/* Hair bun - top knot style */}
                    <rect x="-2" y="-5.5" width="4" height="1.5" fill={hairColor} rx="0.3" />
                    <rect x="-2.5" y="-4.5" width="5" height="1" fill={hairColor} />
                    {/* Bun at back of head */}
                    <circle cx="0" cy="-6.2" r="1.2" fill={hairColor} />
                    <circle cx="0" cy="-6.2" r="0.8" fill={adjustColorBrightness(hairColor, 15)} opacity="0.4" />
                  </>
                ) : hairstyle?.toLowerCase().includes('ponytail') ? (
                  <>
                    {/* Pulled back with ponytail */}
                    <rect x="-2" y="-5.8" width="4" height="1.5" fill={hairColor} rx="0.3" />
                    <rect x="-2.5" y="-4.8" width="5" height="1.2" fill={hairColor} />
                    {/* Ponytail flowing behind */}
                    <rect x="-0.8" y="-6" width="1.6" height="4" fill={hairColor} rx="0.5" opacity="0.85" />
                  </>
                ) : hairstyle?.toLowerCase().includes('braid') ? (
                  <>
                    {/* Braided style - slight texture pattern */}
                    <rect x="-2" y="-5.8" width="4" height="1.2" fill={hairColor} />
                    <rect x="-2.5" y="-4.8" width="5" height="1.3" fill={hairColor} />
                    {/* Braid sides with subtle pattern */}
                    <rect x="-3.2" y="-3.6" width="1" height="5" fill={hairColor} />
                    <rect x="2.2" y="-3.6" width="1" height="5" fill={hairColor} />
                    {/* Braid pattern dots */}
                    <circle cx="-2.7" cy="-2.5" r="0.15" fill={adjustColorBrightness(hairColor, -20)} />
                    <circle cx="-2.7" cy="-1.0" r="0.15" fill={adjustColorBrightness(hairColor, -20)} />
                    <circle cx="2.7" cy="-2.5" r="0.15" fill={adjustColorBrightness(hairColor, -20)} />
                    <circle cx="2.7" cy="-1.0" r="0.15" fill={adjustColorBrightness(hairColor, -20)} />
                  </>
                ) : hairstyle?.toLowerCase().includes('afro') ? (
                  <>
                    {/* Afro - wider, rounder profile */}
                    <circle cx="0" cy="-4.5" r="3.5" fill={hairColor} />
                    <circle cx="0" cy="-4.5" r="2.8" fill={adjustColorBrightness(hairColor, 12)} opacity="0.3" />
                  </>
                ) : hairstyle?.toLowerCase().includes('topknot') || hairstyle?.toLowerCase().includes('top knot') ? (
                  <>
                    {/* Topknot - shaved sides, knot on top */}
                    <rect x="-1.5" y="-5.5" width="3" height="1" fill={hairColor} rx="0.3" />
                    <rect x="-2" y="-4.8" width="4" height="0.8" fill={hairColor} />
                    {/* Knot on top */}
                    <circle cx="0" cy="-7" r="0.9" fill={hairColor} />
                    <circle cx="0" cy="-7" r="0.6" fill={adjustColorBrightness(hairColor, 15)} opacity="0.4" />
                  </>
                ) : hairLength === 'bald' ? (
                  <>
                    {/* Male pattern baldness - hair on sides only (front view) */}
                    <rect x="-2.8" y="-3.8" width="0.7" height="2" fill={hairColor} rx="0.2" />
                    <rect x="2.1" y="-3.8" width="0.7" height="2" fill={hairColor} rx="0.2" />
                  </>
                ) :
                 hairLength === 'very_short' ? (
                   <>
                     {/* Very short hair - covers top of head only */}
                     <rect x="-2" y="-5.5" width="4" height="1.2" fill={hairColor} />
                     <rect x="-2.5" y="-4.8" width="5" height="0.8" fill={hairColor} />
                     <rect x="-2.8" y="-4.2" width="0.6" height="1" fill={hairColor} />
                     <rect x="2.2" y="-4.2" width="0.6" height="1" fill={hairColor} />
                   </>
                 ) : hairLength === 'short' ? (
                   <>
                     {/* Short hair - covers top and forehead without covering eyes */}
                     <rect x="-1.5" y="-6" width="3" height="0.5" fill={hairColor} />
                     <rect x="-2" y="-5.5" width="4" height="0.8" fill={hairColor} />
                     <rect x="-2.5" y="-4.7" width="5" height="1.3" fill={hairColor} />
                     {/* Side hair - can go lower since it's beside the face */}
                     <rect x="-2.8" y="-3.6" width="0.8" height="1.2" fill={hairColor} />
                     <rect x="2" y="-3.6" width="0.8" height="1.2" fill={hairColor} />

                     {/* Hair texture overlays */}
                     {hairTexture === 'curly' || hairTexture === 'coily' ? (
                       <>
                         {/* Circular curl highlights */}
                         <circle cx="-1.5" cy="-5.2" r="0.3" fill={adjustColorBrightness(hairColor, 20)} opacity="0.5" />
                         <circle cx="0" cy="-5.5" r="0.25" fill={adjustColorBrightness(hairColor, 20)} opacity="0.5" />
                         <circle cx="1.5" cy="-5.2" r="0.3" fill={adjustColorBrightness(hairColor, 20)} opacity="0.5" />
                         <circle cx="-2.2" cy="-4.5" r="0.2" fill={adjustColorBrightness(hairColor, -15)} opacity="0.4" />
                         <circle cx="2.2" cy="-4.5" r="0.2" fill={adjustColorBrightness(hairColor, -15)} opacity="0.4" />
                       </>
                     ) : hairTexture === 'wavy' ? (
                       <>
                         {/* Subtle wavy lines */}
                         <path d="M -2 -5.2 Q -1.5 -5.4, -1 -5.2 Q -0.5 -5, 0 -5.2 Q 0.5 -5.4, 1 -5.2 Q 1.5 -5, 2 -5.2"
                               stroke={adjustColorBrightness(hairColor, 25)} strokeWidth="0.15" fill="none" opacity="0.6" />
                         <path d="M -2.3 -4.3 Q -2 -4.5, -1.7 -4.3"
                               stroke={adjustColorBrightness(hairColor, -10)} strokeWidth="0.12" fill="none" opacity="0.5" />
                         <path d="M 1.7 -4.3 Q 2 -4.5, 2.3 -4.3"
                               stroke={adjustColorBrightness(hairColor, -10)} strokeWidth="0.12" fill="none" opacity="0.5" />
                       </>
                     ) : hairTexture === 'kinky' ? (
                       <>
                         {/* Tight texture dots */}
                         <circle cx="-1.8" cy="-5.8" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="-0.9" cy="-5.6" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="0" cy="-5.9" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="0.9" cy="-5.6" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="1.8" cy="-5.8" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="-2.4" cy="-4.8" r="0.12" fill={adjustColorBrightness(hairColor, -12)} opacity="0.5" />
                         <circle cx="2.4" cy="-4.8" r="0.12" fill={adjustColorBrightness(hairColor, -12)} opacity="0.5" />
                       </>
                     ) : null}
                   </>
                 ) : hairLength === 'long' || hairLength === 'very_long' ? (
                   <>
                     {/* Long hair - covers top with longer sides and back */}
                     <rect x="-1.5" y="-6.5" width="3" height="0.5" fill={hairColor} />
                     <rect x="-2" y="-6" width="4" height="0.8" fill={hairColor} />
                     <rect x="-2.5" y="-5.2" width="5" height="0.8" fill={hairColor} />
                     <rect x="-3" y="-4.4" width="6" height="1" fill={hairColor} />
                     {/* Long side hair - flows down beside face, not over it */}
                     <rect x="-3.2" y="-3.6" width="1" height="6" fill={hairColor} />
                     <rect x="2.2" y="-3.6" width="1" height="6" fill={hairColor} />
                     {hairLength === 'very_long' && (
                       <>
                         <rect x="-3.5" y="2.4" width="0.8" height="3.5" fill={hairColor} />
                         <rect x="2.7" y="2.4" width="0.8" height="3.5" fill={hairColor} />
                       </>
                     )}

                     {/* Hair texture overlays for long hair */}
                     {hairTexture === 'curly' || hairTexture === 'coily' ? (
                       <>
                         {/* Circular curl highlights distributed through long hair */}
                         <circle cx="-2.7" cy="-5.5" r="0.35" fill={adjustColorBrightness(hairColor, 20)} opacity="0.5" />
                         <circle cx="2.7" cy="-5.5" r="0.35" fill={adjustColorBrightness(hairColor, 20)} opacity="0.5" />
                         <circle cx="-2.7" cy="-2" r="0.3" fill={adjustColorBrightness(hairColor, 18)} opacity="0.5" />
                         <circle cx="2.7" cy="-2" r="0.3" fill={adjustColorBrightness(hairColor, 18)} opacity="0.5" />
                         <circle cx="-2.7" cy="0.5" r="0.28" fill={adjustColorBrightness(hairColor, 16)} opacity="0.5" />
                         <circle cx="2.7" cy="0.5" r="0.28" fill={adjustColorBrightness(hairColor, 16)} opacity="0.5" />
                       </>
                     ) : hairTexture === 'wavy' ? (
                       <>
                         {/* Flowing wavy patterns in long hair */}
                         <path d="M -2.7 -3 Q -2.8 -2.2, -2.7 -1.4 Q -2.6 -0.6, -2.7 0.2 Q -2.8 1, -2.7 1.8"
                               stroke={adjustColorBrightness(hairColor, 22)} strokeWidth="0.15" fill="none" opacity="0.6" />
                         <path d="M 2.7 -3 Q 2.8 -2.2, 2.7 -1.4 Q 2.6 -0.6, 2.7 0.2 Q 2.8 1, 2.7 1.8"
                               stroke={adjustColorBrightness(hairColor, 22)} strokeWidth="0.15" fill="none" opacity="0.6" />
                       </>
                     ) : hairTexture === 'kinky' ? (
                       <>
                         {/* Dense texture dots throughout */}
                         <circle cx="-2.7" cy="-5.8" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="-2.7" cy="-4.5" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="-2.7" cy="-3.2" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="-2.7" cy="-1.9" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="-2.7" cy="-0.6" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="2.7" cy="-5.8" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="2.7" cy="-4.5" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="2.7" cy="-3.2" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="2.7" cy="-1.9" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="2.7" cy="-0.6" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                       </>
                     ) : null}
                   </>
                 ) : (
                   <>
                     {/* Medium hair - balanced coverage */}
                     <rect x="-1.5" y="-6" width="3" height="0.5" fill={hairColor} />
                     <rect x="-2" y="-5.5" width="4" height="0.8" fill={hairColor} />
                     <rect x="-2.5" y="-4.7" width="5" height="1.2" fill={hairColor} />
                     {/* Medium side hair */}
                     <rect x="-3" y="-3.7" width="0.8" height="2.5" fill={hairColor} />
                     <rect x="2.2" y="-3.7" width="0.8" height="2.5" fill={hairColor} />

                     {/* Hair texture overlays for medium hair */}
                     {hairTexture === 'curly' || hairTexture === 'coily' ? (
                       <>
                         <circle cx="-2.5" cy="-5.2" r="0.32" fill={adjustColorBrightness(hairColor, 20)} opacity="0.5" />
                         <circle cx="2.5" cy="-5.2" r="0.32" fill={adjustColorBrightness(hairColor, 20)} opacity="0.5" />
                         <circle cx="-2.6" cy="-3" r="0.28" fill={adjustColorBrightness(hairColor, 18)} opacity="0.5" />
                         <circle cx="2.6" cy="-3" r="0.28" fill={adjustColorBrightness(hairColor, 18)} opacity="0.5" />
                       </>
                     ) : hairTexture === 'wavy' ? (
                       <>
                         <path d="M -2.5 -4.5 Q -2.6 -3.8, -2.5 -3.1 Q -2.4 -2.4, -2.5 -1.7"
                               stroke={adjustColorBrightness(hairColor, 22)} strokeWidth="0.15" fill="none" opacity="0.6" />
                         <path d="M 2.5 -4.5 Q 2.6 -3.8, 2.5 -3.1 Q 2.4 -2.4, 2.5 -1.7"
                               stroke={adjustColorBrightness(hairColor, 22)} strokeWidth="0.15" fill="none" opacity="0.6" />
                       </>
                     ) : hairTexture === 'kinky' ? (
                       <>
                         <circle cx="-2.6" cy="-5.5" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="-2.6" cy="-4.5" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="-2.6" cy="-3.5" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="-2.6" cy="-2.5" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="2.6" cy="-5.5" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="2.6" cy="-4.5" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="2.6" cy="-3.5" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                         <circle cx="2.6" cy="-2.5" r="0.15" fill={adjustColorBrightness(hairColor, 22)} opacity="0.6" />
                       </>
                     ) : null}
                   </>
                 )}
              </>
            )}

            {/* Headgear - rendered AFTER head so it appears on top */}
            {headgearElement}

            {/* Facial hair with styles - matching portrait approach with thickness and shading */}
            {facialHair && gender === 'Male' && (
              <>
                {/* Mustache */}
                {(facialHairStyle === 'mustache' || facialHairStyle === 'full_beard') && (
                  <>
                    <rect x="-1.4" y="-0.65" width="2.8" height="0.8" fill={adjustColorBrightness(hairColor, -15)} rx="0.25" opacity="0.9" />
                    <rect x="-1.3" y="-0.6" width="2.6" height="0.7" fill={hairColor} rx="0.2" />
                    {facialHairThickness === 'thick' && (
                      <rect x="-1.2" y="-0.55" width="2.4" height="0.5" fill={adjustColorBrightness(hairColor, 10)} opacity="0.4" rx="0.15" />
                    )}
                  </>
                )}

                {/* Beard */}
                {(facialHairStyle === 'goatee' || facialHairStyle === 'full_beard') && (
                  <>
                    {/* Shadow/depth layer */}
                    <rect
                      x="-1.3"
                      y="0.15"
                      width="2.6"
                      height={facialHairStyle === 'full_beard' ? (facialHairThickness === 'thick' ? 2.2 : facialHairThickness === 'sparse' ? 1.4 : 1.8) : 1.6}
                      fill={adjustColorBrightness(hairColor, -20)}
                      rx="0.45"
                      opacity="0.8"
                    />
                    {/* Main beard body */}
                    <rect
                      x="-1.2"
                      y="0.2"
                      width="2.4"
                      height={facialHairStyle === 'full_beard' ? (facialHairThickness === 'thick' ? 2.0 : facialHairThickness === 'sparse' ? 1.2 : 1.6) : 1.4}
                      fill={hairColor}
                      rx="0.4"
                    />
                    {/* Highlight layer for depth */}
                    {facialHairThickness !== 'sparse' && (
                      <rect
                        x="-0.6"
                        y="0.3"
                        width="1.2"
                        height={facialHairStyle === 'full_beard' ? 1.2 : 0.8}
                        fill={adjustColorBrightness(hairColor, 15)}
                        opacity="0.35"
                        rx="0.3"
                      />
                    )}
                  </>
                )}
              </>
            )}
            
            {/* Jewelry - check equipped slots for necklace, rings, accessories */}
            {equippedItems && (
              <>
                {/* Necklace/Amulet - from necklace slot */}
                {equippedItems.necklace && (
                  <>
                    {/* Chain/necklace band around neck - more visible */}
                    <ellipse cx="0" cy="1" rx="1.6" ry="0.2" fill={detectJewelryColor(equippedItems.necklace, '#ffd700')} opacity="0.85" />
                    {/* Pendant hanging down - prominent */}
                    <circle cx="0" cy="1.5" r="0.35" fill={detectJewelryColor(equippedItems.necklace, '#ffd700')} />
                    <circle cx="0" cy="1.5" r="0.25" fill={adjustColorBrightness(detectJewelryColor(equippedItems.necklace, '#ffd700'), 25)} />
                    {/* Gem/highlight on pendant */}
                    <circle cx="-0.08" cy="1.42" r="0.12" fill="rgba(255,255,255,0.9)" />
                  </>
                )}

                {/* Ring1 - from ring1 slot */}
                {equippedItems.ring1 && (
                  <>
                    {/* Ring on left hand - more visible */}
                    <circle cx="-3.7" cy="5.0" r="0.22" fill={detectJewelryColor(equippedItems.ring1, '#c0c0c0')} />
                    <circle cx="-3.7" cy="5.0" r="0.12" fill="rgba(0,0,0,0.3)" />
                    {/* Small gemstone if present */}
                    {equippedItems.ring1.name && equippedItems.ring1.name.toLowerCase().includes('gemstone') && (
                      <circle cx="-3.7" cy="4.9" r="0.1" fill="rgba(255,255,255,0.8)" />
                    )}
                  </>
                )}

                {/* Accessory slot - check for earrings, bracelets, brooches */}
                {equippedItems.accessory && equippedItems.accessory.name && (
                  <>
                    {equippedItems.accessory.name.toLowerCase().includes('earring') ? (
                      <>
                        {/* Earrings - more visible */}
                        <circle cx="-2.6" cy="-1.6" r="0.22" fill={detectJewelryColor(equippedItems.accessory, '#ffd700')} />
                        <circle cx="2.6" cy="-1.6" r="0.22" fill={detectJewelryColor(equippedItems.accessory, '#ffd700')} />
                        {/* Highlights */}
                        <circle cx="-2.55" cy="-1.7" r="0.1" fill="rgba(255,255,255,0.9)" />
                        <circle cx="2.65" cy="-1.7" r="0.1" fill="rgba(255,255,255,0.9)" />
                      </>
                    ) : equippedItems.accessory.name.toLowerCase().includes('bracelet') ? (
                      <>
                        {/* Bracelet on wrist */}
                        <rect x="-4.3" y="4.4" width="1.4" height="0.35" fill={detectJewelryColor(equippedItems.accessory, '#c0c0c0')} rx="0.15" />
                        <rect x="-4.2" y="4.45" width="0.3" height="0.25" fill="rgba(255,255,255,0.5)" rx="0.1" />
                      </>
                    ) : equippedItems.accessory.name.toLowerCase().includes('brooch') ||
                       equippedItems.accessory.name.toLowerCase().includes('pin') ? (
                      <>
                        {/* Brooch on chest */}
                        <circle cx="1.5" cy="2.8" r="0.28" fill={detectJewelryColor(equippedItems.accessory, '#ffd700')} />
                        <circle cx="1.5" cy="2.8" r="0.18" fill={adjustColorBrightness(detectJewelryColor(equippedItems.accessory, '#ffd700'), 30)} />
                        <circle cx="1.42" cy="2.72" r="0.08" fill="rgba(255,255,255,0.9)" />
                      </>
                    ) : null}
                  </>
                )}
              </>
            )}
            
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

            {/* Charge glow effect - rendered below swoosh */}
            {chargeGlow}

            {/* Swing swoosh effect - rendered on top */}
            {swingSwoosh}

            {/* Snow accumulation - frontal view - rendered last so it appears on top */}
            {hasSnow && (
              <>
                {/* Snow on headgear (if present) */}
                {headgear && headgear.name && headgear.name !== 'None' && headgear.name !== 'none' && (
                  <>
                    {/* Snow accumulation on top of hat/headgear */}
                    <ellipse cx="0" cy="-7.0" rx="2.5" ry="0.5" fill="#FFFFFF" opacity="0.9" />
                    <ellipse cx="0" cy="-7.0" rx="2.0" ry="0.35" fill="#F0F8FF" opacity="0.7" />
                    {/* Small snow details on headgear */}
                    <circle cx="-1.5" cy="-6.8" r="0.18" fill="#FFFFFF" opacity="0.95" />
                    <circle cx="1.2" cy="-6.9" r="0.15" fill="#FFFFFF" opacity="0.95" />
                    <circle cx="0.2" cy="-7.1" r="0.12" fill="#FFFFFF" opacity="0.9" />
                  </>
                )}

                {/* Snow on shoulders - frontal view */}
                <>
                  {/* Left shoulder snow pile */}
                  <ellipse cx={-bodyWidth/2 - 0.4} cy={1.5} rx="1.1" ry="0.4" fill="#FFFFFF" opacity="0.85" />
                  <ellipse cx={-bodyWidth/2 - 0.4} cy={1.5} rx="0.8" ry="0.28" fill="#F0F8FF" opacity="0.7" />
                  {/* Right shoulder snow pile */}
                  <ellipse cx={bodyWidth/2 + 0.4} cy={1.5} rx="1.1" ry="0.4" fill="#FFFFFF" opacity="0.85" />
                  <ellipse cx={bodyWidth/2 + 0.4} cy={1.5} rx="0.8" ry="0.28" fill="#F0F8FF" opacity="0.7" />
                  {/* Small snow details on shoulders */}
                  <circle cx={-bodyWidth/2 - 0.8} cy={1.6} r="0.14" fill="#FFFFFF" opacity="0.9" />
                  <circle cx={-bodyWidth/2} cy={1.4} r="0.11" fill="#FFFFFF" opacity="0.9" />
                  <circle cx={bodyWidth/2 + 0.8} cy={1.6} r="0.14" fill="#FFFFFF" opacity="0.9" />
                  <circle cx={bodyWidth/2} cy={1.4} r="0.11" fill="#FFFFFF" opacity="0.9" />
                </>

                {/* Snow on cloak shoulders (if cloak present) - frontal view */}
                {cloakColor && (
                  <>
                    <ellipse cx={-bodyWidth/2 - 0.6} cy={1.7} rx="0.9" ry="0.32" fill="#FFFFFF" opacity="0.8" />
                    <ellipse cx={bodyWidth/2 + 0.6} cy={1.7} rx="0.9" ry="0.32" fill="#FFFFFF" opacity="0.8" />
                  </>
                )}
              </>
            )}
        </>
        )}

        {/* BACK VIEW - when facing north/away */}
        {direction === 'north' && (
        <>
            {/* Back of head with gradient */}
            <ellipse cx="0" cy="-2.2" rx="2.8" ry="3.2" fill={`url(#faceGradient-${character.id})`} />
            {/* Back of neck/lower head - very small and subtle */}
            <ellipse cx="0" cy="0.3" rx="1.4" ry="0.4" fill={`url(#jawGradient-${character.id})`} opacity="0.5" />

            {/* Body - back view */}
            <rect x={-bodyWidth/2} y="1" width={bodyWidth} height={bodyHeight} fill={isNaked ? skinColor : clothingColor} rx="0.4" />
            <rect x={-bodyWidth/2} y="1.5" width={bodyWidth * 0.3} height={bodyHeight - 1} fill="rgba(255,255,255,0.1)" />
            <rect x={bodyWidth/2 - bodyWidth * 0.3} y="1.5" width={bodyWidth * 0.3} height={bodyHeight - 1} fill="rgba(0,0,0,0.12)" />

            {/* Belt from behind */}
            {beltColor && (
              <rect x={-bodyWidth/2} y={bodyHeight * 0.6 + 1} width={bodyWidth} height="0.6" fill={beltColor} opacity="0.9" />
            )}

            {/* Arms - back view - animated with breathing */}
            <rect x="-4.2" y={1.5 + breathOffset + (walkFrame === 0 ? -0.5 : 0.5)} width="1.3" height="1.8" fill={isNaked ? skinColor : clothingColor} rx="0.3" />
            <rect x="2.9" y={1.5 + breathOffset + (walkFrame === 1 ? -0.5 : 0.5)} width="1.3" height="1.8" fill={isNaked ? skinColor : clothingColor} rx="0.3" />
            <rect x="-4" y={3.3 + breathOffset + (walkFrame === 0 ? -0.5 : 0.5)} width="1.1" height="1.5" fill={skinColor} rx="0.3" />
            <rect x="2.9" y={3.3 + breathOffset + (walkFrame === 1 ? -0.5 : 0.5)} width="1.1" height="1.5" fill={skinColor} rx="0.3" />

            {/* Legs - back view - animated */}
            <rect x={-1.5 + (walkFrame === 0 ? 0.15 : -0.15)} y={bodyHeight + 1} width="1.3" height="4.5" fill={legsColor} rx="0.4" />
            <rect x={0.25 + (walkFrame === 1 ? 0.15 : -0.15)} y={bodyHeight + 1} width="1.3" height="4.5" fill={legsColor} rx="0.4" />

            {/* Boots/Feet - back view - animated */}
            {bootsColor ? (
              <>
                <rect x={-1.8 + (walkFrame === 0 ? 0.15 : -0.15)} y={bodyHeight + 5.5} width="1.8" height="1.3" fill={bootsColor} rx="0.3" />
                <rect x={0.05 + (walkFrame === 1 ? 0.15 : -0.15)} y={bodyHeight + 5.5} width="1.8" height="1.3" fill={bootsColor} rx="0.3" />
              </>
            ) : (
              <>
                <rect x={-1.8 + (walkFrame === 0 ? 0.15 : -0.15)} y={bodyHeight + 5.5} width="1.8" height="1.2" fill="#654321" rx="0.3" />
                <rect x={0.05 + (walkFrame === 1 ? 0.15 : -0.15)} y={bodyHeight + 5.5} width="1.8" height="1.2" fill="#654321" rx="0.3" />
              </>
            )}

            {/* Hair - back view */}
            {(!headgear || headgear.name === 'None' || headgear.name === 'none' ||
              (!headgear.name.toLowerCase().includes('helmet') &&
               !headgear.name.toLowerCase().includes('hood') &&
               !headgear.name.toLowerCase().includes('turban'))) && (
              <>
                {hairLength === 'bald' ? (
                  <>
                    {/* Male pattern baldness - hair on sides and back */}
                    <rect x="-2.8" y="-4" width="0.8" height="2.5" fill={hairColor} rx="0.2" />
                    <rect x="2" y="-4" width="0.8" height="2.5" fill={hairColor} rx="0.2" />
                    <rect x="-2.2" y="-2" width="4.4" height="0.6" fill={hairColor} rx="0.2" />
                  </>
                ) :
                 hairLength === 'very_short' ? (
                   <>
                     {/* Very short - top and minimal back */}
                     <rect x="-2.5" y="-5.2" width="5" height="1.5" fill={hairColor} rx="0.3" />
                     <rect x="-2.2" y="-4" width="4.4" height="0.8" fill={hairColor} rx="0.2" />
                   </>
                 ) : hairLength === 'short' ? (
                   <>
                     {/* Top hair */}
                     <rect x="-2.5" y="-5.8" width="5" height="2" fill={hairColor} rx="0.4" />
                     {/* Center back - short but covers back of head */}
                     <rect x="-2.2" y="-4" width="4.4" height="1.5" fill={hairColor} />
                     {/* Side pieces */}
                     <rect x="-2.8" y="-4" width="0.6" height="0.8" fill={hairColor} />
                     <rect x="2.2" y="-4" width="0.6" height="0.8" fill={hairColor} />
                   </>
                 ) : hairLength === 'long' || hairLength === 'very_long' ? (
                   <>
                     {/* Top/crown hair */}
                     <rect x="-2.5" y="-6.2" width="5" height="2.5" fill={hairColor} rx="0.4" />
                     {/* Center back hair - covers back of head */}
                     <rect x="-2.2" y="-4" width="4.4" height="6" fill={hairColor} />
                     {/* Side hair - extends down beside body */}
                     <rect x="-3.2" y="-4" width="1" height="6" fill={hairColor} />
                     <rect x="2.2" y="-4" width="1" height="6" fill={hairColor} />
                     {hairLength === 'very_long' && (
                       <>
                         <rect x="-3.5" y="2" width="0.8" height="3.5" fill={hairColor} />
                         <rect x="2.7" y="2" width="0.8" height="3.5" fill={hairColor} />
                         {/* Extra long center back flow */}
                         <rect x="-2" y="2" width="4" height="3.5" fill={hairColor} />
                       </>
                     )}
                   </>
                 ) : (
                   <>
                     {/* Medium/default hair - top */}
                     <rect x="-2.5" y="-5.8" width="5" height="2" fill={hairColor} rx="0.4" />
                     {/* Center back - medium length */}
                     <rect x="-2.2" y="-4" width="4.4" height="3" fill={hairColor} />
                     {/* Side pieces */}
                     <rect x="-3" y="-4" width="0.8" height="2" fill={hairColor} />
                     <rect x="2.2" y="-4" width="0.8" height="2" fill={hairColor} />
                   </>
                 )}
              </>
            )}

            {/* Cloak - full back view (rendered OVER body/legs) */}
            {cloakColor && (
              <>
                {/* Main back cape - wide and flowing */}
                <path
                  d={`M ${-bodyWidth/2 - 0.5} 1.2
                      L ${-bodyWidth/2 - 1.5} ${bodyHeight + 3}
                      Q ${-bodyWidth/2 - 1} ${bodyHeight + 5}, 0 ${bodyHeight + 5.5}
                      Q ${bodyWidth/2 + 1} ${bodyHeight + 5}, ${bodyWidth/2 + 1.5} ${bodyHeight + 3}
                      L ${bodyWidth/2 + 0.5} 1.2
                      Q 0 1, ${-bodyWidth/2 - 0.5} 1.2
                      Z`}
                  fill={cloakColor}
                  opacity="0.9"
                />
                {/* Cloak shading */}
                <ellipse
                  cx="0"
                  cy={bodyHeight + 2}
                  rx={bodyWidth/2}
                  ry="2"
                  fill="rgba(0,0,0,0.15)"
                />
              </>
            )}

            {/* Jewelry - back view */}
            {equippedItems && (
              <>
                {/* Necklace - visible as chain around back of neck */}
                {equippedItems.necklace && (
                  <>
                    {/* Chain band around back of neck */}
                    <ellipse cx="0" cy="0.8" rx="1.4" ry="0.4" fill={detectJewelryColor(equippedItems.necklace, '#ffd700')} opacity="0.75" />
                    <ellipse cx="0" cy="0.75" rx="1.2" ry="0.3" fill={adjustColorBrightness(detectJewelryColor(equippedItems.necklace, '#ffd700'), 20)} opacity="0.5" />
                  </>
                )}

                {/* Earrings - visible on sides of head from back */}
                {equippedItems.accessory && equippedItems.accessory.name && equippedItems.accessory.name.toLowerCase().includes('earring') && (
                  <>
                    <circle cx="-2.7" cy="-1.6" r="0.2" fill={detectJewelryColor(equippedItems.accessory, '#ffd700')} />
                    <circle cx="2.7" cy="-1.6" r="0.2" fill={detectJewelryColor(equippedItems.accessory, '#ffd700')} />
                  </>
                )}
              </>
            )}

            {/* Headgear - back view (simplified) */}
            {headgearElement && (
              <g opacity="0.9">
                {headgearElement}
              </g>
            )}

            {/* Equipped hand item - back view (north direction) */}
            {handItemElement?.north}

            {/* Snow accumulation - rendered last so it appears on top of everything */}
            {hasSnow && (
              <>
                {/* Snow on headgear (if present) */}
                {headgear && headgear.name && headgear.name !== 'None' && headgear.name !== 'none' && (
                  <>
                    {/* Snow accumulation on top of hat */}
                    <ellipse cx="0" cy="-6.5" rx="2.2" ry="0.4" fill="#FFFFFF" opacity="0.9" />
                    <ellipse cx="0" cy="-6.5" rx="1.8" ry="0.3" fill="#F0F8FF" opacity="0.7" />
                    {/* Small snow details */}
                    <circle cx="-1.2" cy="-6.4" r="0.15" fill="#FFFFFF" opacity="0.95" />
                    <circle cx="1.0" cy="-6.3" r="0.12" fill="#FFFFFF" opacity="0.95" />
                  </>
                )}

                {/* Snow on shoulders */}
                <>
                  {/* Left shoulder snow pile */}
                  <ellipse cx={-bodyWidth/2 - 0.3} cy={1.8} rx="1.0" ry="0.35" fill="#FFFFFF" opacity="0.85" />
                  <ellipse cx={-bodyWidth/2 - 0.3} cy={1.8} rx="0.7" ry="0.25" fill="#F0F8FF" opacity="0.7" />
                  {/* Right shoulder snow pile */}
                  <ellipse cx={bodyWidth/2 + 0.3} cy={1.8} rx="1.0" ry="0.35" fill="#FFFFFF" opacity="0.85" />
                  <ellipse cx={bodyWidth/2 + 0.3} cy={1.8} rx="0.7" ry="0.25" fill="#F0F8FF" opacity="0.7" />
                  {/* Small snow details on shoulders */}
                  <circle cx={-bodyWidth/2 - 0.6} cy={1.9} r="0.12" fill="#FFFFFF" opacity="0.9" />
                  <circle cx={-bodyWidth/2 + 0.2} cy={1.7} r="0.1" fill="#FFFFFF" opacity="0.9" />
                  <circle cx={bodyWidth/2 + 0.6} cy={1.9} r="0.12" fill="#FFFFFF" opacity="0.9" />
                  <circle cx={bodyWidth/2 - 0.2} cy={1.7} r="0.1" fill="#FFFFFF" opacity="0.9" />
                </>

                {/* Snow on cloak shoulders (if cloak present) */}
                {cloakColor && (
                  <>
                    <ellipse cx={-bodyWidth/2 - 0.5} cy={2.0} rx="0.8" ry="0.3" fill="#FFFFFF" opacity="0.8" />
                    <ellipse cx={bodyWidth/2 + 0.5} cy={2.0} rx="0.8" ry="0.3" fill="#FFFFFF" opacity="0.8" />
                  </>
                )}
              </>
            )}
        </>
        )}

        {/* SIDE VIEW - when facing east/west */}
        {(direction === 'east' || direction === 'west') && (
        <g transform={direction === 'west' ? 'scale(-1, 1)' : ''}>
            {/* Profile head with gradient */}
            <ellipse cx="0.5" cy="-2.2" rx="2.5" ry="3.2" fill={`url(#faceGradient-${character.id})`} />
            {/* Cheekbone/facial structure highlight */}
            <ellipse cx="1.5" cy="-1.8" rx="0.8" ry="1.5" fill="rgba(255,255,255,0.08)" />

            {/* Jaw/chin with gradient - very small and subtle */}
            <ellipse cx="0.5" cy="0.3" rx="1.3" ry="0.4" fill={`url(#jawGradient-${character.id})`} opacity="0.5" />
            {/* Under-chin shadow - very subtle */}
            <ellipse cx="0.3" cy="0.7" rx="0.9" ry="0.25" fill="rgba(0,0,0,0.08)" opacity="0.4" />

            {/* Neck - connecting head to body */}
            <rect x="-0.8" y="0.2" width="1.8" height="1.3" fill={skinColor} rx="0.3" />
            <rect x="-0.5" y="0.5" width="1.2" height="0.8" fill={adjustColorBrightness(skinColor, -3)} rx="0.2" opacity="0.4" />

            {/* Ear */}
            <ellipse cx="-1.8" cy="-1.8" rx="0.7" ry="1.2" fill={adjustColorBrightness(skinColor, -5)} />
            <ellipse cx="-1.6" cy="-1.8" rx="0.4" ry="0.7" fill={adjustColorBrightness(skinColor, -2)} />

            {/* Eye (one visible eye in profile) */}
            <ellipse cx="1.5" cy="-2.3" rx="0.7" ry="0.75" fill="#ffffff" />
            {/* Iris - using character's actual eye color */}
            <circle cx="1.5" cy="-2.2" r="0.5" fill={eyeColor || '#3a2a1a'} />
            {/* Pupil */}
            <circle cx="1.5" cy="-2.2" r="0.25" fill="#000000" />
            {/* Eye highlight */}
            <circle cx="1.4" cy="-2.3" r="0.15" fill="#ffffff" opacity="0.9" />
            {/* Upper eyelid - more opaque with smooth blink animation */}
            <ellipse
              cx="1.5"
              cy={isBlinking ? "-2.3" : "-2.85"}
              rx="0.8"
              ry={isBlinking ? 1.2 : 0.35}
              fill={skinColor}
              opacity={isBlinking ? 1 : 0.9}
              style={{ transition: 'cy 0.08s ease-in-out, ry 0.08s ease-in-out' }}
            />
            <ellipse
              cx="1.5"
              cy={isBlinking ? "-2.3" : "-2.75"}
              rx="0.75"
              ry={isBlinking ? 1.0 : 0.2}
              fill={adjustColorBrightness(skinColor, -8)}
              opacity="0.8"
              style={{ transition: 'cy 0.08s ease-in-out, ry 0.08s ease-in-out' }}
            />

            {/* Eyebrow - with thickness variation */}
            {(() => {
              let browHeight = 0.25;
              if (eyebrowThickness === 'thin') browHeight = 0.18;
              else if (eyebrowThickness === 'thick') browHeight = 0.35;
              else if (eyebrowThickness === 'bushy') browHeight = 0.45;

              return <rect x="0.8" y="-3.2" width="1.5" height={browHeight} fill={hairColor} rx="0.1" />;
            })()}

            {/* Nose - side profile */}
            <path
              d="M 2 -2.5 L 3 -1.5 L 2.8 -1 L 2.2 -1.2 Z"
              fill={skinColor}
            />
            <path d="M 2.8 -1 L 3 -1.5 L 3.2 -1.3 Z" fill={adjustColorBrightness(skinColor, -8)} opacity="0.5" />

            {/* Mouth - side view */}
            <ellipse cx="2.5" cy="-0.2" rx="0.6" ry="0.25" fill="rgba(0,0,0,0.2)" />

            {/* Cloak - side drape (rendered before body for back section) */}
            {cloakColor && (
              <>
                {/* Back section of cloak */}
                <path
                  d={`M -1.5 1.5
                      Q -2.5 2, -3 ${bodyHeight + 2}
                      Q -2.5 ${bodyHeight + 4}, -1.5 ${bodyHeight + 5}
                      L -1 ${bodyHeight + 3}
                      Q -0.5 2, -1 1.5
                      Z`}
                  fill={cloakColor}
                  opacity="0.8"
                />
              </>
            )}

            {/* Body - narrower profile */}
            <rect x={-bodyWidth/3} y="1" width={bodyWidth/1.5} height={bodyHeight} fill={isNaked ? skinColor : clothingColor} rx="0.4" />
            <rect x={-bodyWidth/3} y="1.5" width={bodyWidth/4} height={bodyHeight - 1} fill="rgba(255,255,255,0.1)" />
            <rect x={bodyWidth/4} y="1.8" width={bodyWidth/5} height={bodyHeight - 1.5} fill="rgba(0,0,0,0.1)" />

            {/* Belt - side view */}
            {beltColor && (
              <>
                <rect x={-bodyWidth/3} y={bodyHeight * 0.6 + 1} width={bodyWidth/1.5} height="0.6" fill={beltColor} />
                <rect x="0.5" y={bodyHeight * 0.6 + 0.9} width="0.6" height="0.8" fill="#c0c0c0" rx="0.1" />
              </>
            )}

            {/* Cloak - front drape over body */}
            {cloakColor && (
              <>
                <path
                  d={`M 0.5 1.5
                      Q 2 2, 2.5 ${bodyHeight + 1.5}
                      Q 2.3 ${bodyHeight + 3.5}, 1.8 ${bodyHeight + 4.5}
                      L 1 ${bodyHeight + 3}
                      Q 0.5 2, 0.5 1.5
                      Z`}
                  fill={cloakColor}
                  opacity="0.85"
                />
                {/* Clasp visible on shoulder */}
                <circle cx="0.5" cy="1.5" r="0.3" fill="#c0c0c0" />
                <circle cx="0.5" cy="1.5" r="0.15" fill="#e5e7eb" />
              </>
            )}

            {/* Back arm (partial visibility) - animated */}
            <rect x="-1.5" y={2 + (walkFrame === 0 ? -0.4 : 0.4)} width="0.9" height="2.5" fill={isNaked ? skinColor : clothingColor} rx="0.3" opacity="0.5" />
            <rect x="-1.3" y={4.5 + (walkFrame === 0 ? -0.4 : 0.4)} width="0.8" height="2" fill={skinColor} rx="0.3" opacity="0.5" />

            {/* Legs - profile stance - animated */}
            {/* Back leg */}
            <rect x={-0.6 + (walkFrame === 0 ? -0.3 : 0.3)} y={bodyHeight + 1} width="1.2" height="4.5" fill={legsColor} rx="0.4" />
            {/* Front leg */}
            <rect x={0.8 + (walkFrame === 1 ? 0.3 : -0.3)} y={bodyHeight + 1.2} width="1.2" height="4.3" fill={legsColor} rx="0.4" />

            {/* Boots - side view - animated */}
            {bootsColor ? (
              <>
                <rect x={-0.8 + (walkFrame === 0 ? -0.3 : 0.3)} y={bodyHeight + 5.5} width="1.6" height="1.3" fill={bootsColor} rx="0.3" />
                <rect x={0.6 + (walkFrame === 1 ? 0.3 : -0.3)} y={bodyHeight + 5.7} width="1.6" height="1.1" fill={bootsColor} rx="0.3" />
              </>
            ) : (
              <>
                <rect x={-0.8 + (walkFrame === 0 ? -0.3 : 0.3)} y={bodyHeight + 5.5} width="1.6" height="1.2" fill="#654321" rx="0.3" />
                <rect x={0.6 + (walkFrame === 1 ? 0.3 : -0.3)} y={bodyHeight + 5.7} width="1.6" height="1" fill="#654321" rx="0.3" />
              </>
            )}

            {/* Hair - side view profiles */}
            {(!headgear || headgear.name === 'None' || headgear.name === 'none' ||
              (!headgear.name.toLowerCase().includes('helmet') &&
               !headgear.name.toLowerCase().includes('hood') &&
               !headgear.name.toLowerCase().includes('turban'))) && (
              <>
                {hairLength === 'bald' ? (
                  <>
                    {/* Side fringe for bald */}
                    <rect x="-2.2" y="-3.5" width="0.7" height="2" fill={hairColor} rx="0.2" />
                    <rect x="-2.2" y="-2" width="1.5" height="0.5" fill={hairColor} rx="0.2" />
                  </>
                ) : hairLength === 'very_short' ? (
                  <>
                    <rect x="-2.5" y="-5" width="4" height="1.5" fill={hairColor} rx="0.3" />
                    <rect x="-2.2" y="-3.8" width="1" height="1" fill={hairColor} />
                  </>
                ) : hairLength === 'short' ? (
                  <>
                    <rect x="-2.5" y="-5.5" width="4.5" height="2" fill={hairColor} rx="0.4" />
                    <rect x="-2.5" y="-3.8" width="1.2" height="1.5" fill={hairColor} />
                    <rect x="1.2" y="-3.8" width="0.8" height="1" fill={hairColor} />
                  </>
                ) : hairLength === 'long' || hairLength === 'very_long' ? (
                  <>
                    {/* Top/crown */}
                    <rect x="-2.5" y="-6" width="5" height="2.5" fill={hairColor} rx="0.4" />
                    {/* Ponytail or long flow behind head */}
                    <path
                      d={`M -2.5 -3.5
                          Q -3 -2, -3.5 0
                          L -3.5 ${hairLength === 'very_long' ? '4' : '2.5'}
                          Q -3.2 ${hairLength === 'very_long' ? '4.5' : '3'}, -2.5 ${hairLength === 'very_long' ? '4.2' : '2.8'}
                          L -2.2 0
                          Q -2 -2, -2 -3.5
                          Z`}
                      fill={hairColor}
                    />
                    {/* Front side swept */}
                    <rect x="1" y="-4" width="1" height="1.5" fill={hairColor} />
                  </>
                ) : (
                  <>
                    {/* Medium hair */}
                    <rect x="-2.5" y="-5.5" width="4.5" height="2.2" fill={hairColor} rx="0.4" />
                    <rect x="-2.5" y="-3.5" width="1.2" height="2.5" fill={hairColor} />
                    <rect x="1" y="-3.8" width="0.9" height="1.2" fill={hairColor} />
                  </>
                )}
              </>
            )}

            {/* Facial hair - side view with thickness and shading */}
            {facialHair && gender === 'Male' && (
              <>
                {/* Mustache */}
                {(facialHairStyle === 'mustache' || facialHairStyle === 'full_beard') && (
                  <>
                    <rect x="1.75" y="-0.75" width="1.3" height="0.7" fill={adjustColorBrightness(hairColor, -15)} rx="0.25" opacity="0.8" />
                    <rect x="1.8" y="-0.7" width="1.2" height="0.6" fill={hairColor} rx="0.2" />
                  </>
                )}
                {/* Beard */}
                {(facialHairStyle === 'goatee' || facialHairStyle === 'full_beard') && (
                  <>
                    {/* Shadow layer */}
                    <path
                      d={facialHairStyle === 'full_beard'
                        ? `M 2.1 -0.1 L 2.9 0.4 L 2.7 ${facialHairThickness === 'thick' ? '2.0' : facialHairThickness === 'sparse' ? '1.2' : '1.6'} L 1.9 ${facialHairThickness === 'thick' ? '1.8' : facialHairThickness === 'sparse' ? '1.0' : '1.4'} Z`
                        : `M 2.2 0 L 2.8 0.5 L 2.5 1.5 L 2 1.2 Z`}
                      fill={adjustColorBrightness(hairColor, -20)}
                      opacity="0.8"
                    />
                    {/* Main beard */}
                    <path
                      d={facialHairStyle === 'full_beard'
                        ? `M 2.2 0 L 2.8 0.5 L 2.6 ${facialHairThickness === 'thick' ? '1.8' : facialHairThickness === 'sparse' ? '1.0' : '1.4'} L 2.0 ${facialHairThickness === 'thick' ? '1.6' : facialHairThickness === 'sparse' ? '0.8' : '1.2'} Z`
                        : `M 2.2 0 L 2.8 0.5 L 2.5 1.5 L 2 1.2 Z`}
                      fill={hairColor}
                    />
                  </>
                )}
              </>
            )}

            {/* Jewelry - side view (profile) */}
            {equippedItems && (
              <>
                {/* Necklace - visible as chain on side of neck with pendant */}
                {equippedItems.necklace && (
                  <>
                    {/* Chain curve around side of neck */}
                    <path
                      d="M 0.3 0.6 Q 1.2 0.8, 1.5 1.2"
                      stroke={detectJewelryColor(equippedItems.necklace, '#ffd700')}
                      strokeWidth="0.25"
                      fill="none"
                      opacity="0.85"
                    />
                    {/* Pendant hanging down front */}
                    <circle cx="1.8" cy="1.8" r="0.35" fill={detectJewelryColor(equippedItems.necklace, '#ffd700')} />
                    <circle cx="1.8" cy="1.8" r="0.25" fill={adjustColorBrightness(detectJewelryColor(equippedItems.necklace, '#ffd700'), 25)} />
                    {/* Gem highlight on pendant */}
                    <circle cx="1.72" cy="1.72" r="0.12" fill="rgba(255,255,255,0.9)" />
                  </>
                )}

                {/* Earring - visible on the ear in profile */}
                {equippedItems.accessory && equippedItems.accessory.name && equippedItems.accessory.name.toLowerCase().includes('earring') && (
                  <>
                    <circle cx="-1.8" cy="-1.5" r="0.22" fill={detectJewelryColor(equippedItems.accessory, '#ffd700')} />
                    <circle cx="-1.75" cy="-1.6" r="0.1" fill="rgba(255,255,255,0.9)" />
                  </>
                )}

                {/* Ring - visible on front hand */}
                {equippedItems.ring1 && (
                  <>
                    <circle cx="3.5" cy="5.2" r="0.22" fill={detectJewelryColor(equippedItems.ring1, '#c0c0c0')} />
                    <circle cx="3.5" cy="5.2" r="0.12" fill="rgba(0,0,0,0.3)" />
                  </>
                )}

                {/* Bracelet - if accessory is a bracelet */}
                {equippedItems.accessory && equippedItems.accessory.name && equippedItems.accessory.name.toLowerCase().includes('bracelet') && (
                  <>
                    <ellipse cx="3.2" cy="4.8" rx="0.4" ry="0.25" fill={detectJewelryColor(equippedItems.accessory, '#ffd700')} opacity="0.8" />
                    <ellipse cx="3.2" cy="4.75" rx="0.3" ry="0.2" fill={adjustColorBrightness(detectJewelryColor(equippedItems.accessory, '#ffd700'), 20)} opacity="0.6" />
                  </>
                )}
              </>
            )}

            {/* Headgear - side view (improved profile rendering) */}
            {headgear && headgear.name !== 'None' && headgear.name !== 'none' && (
              <g opacity="0.9">
                {headgear.name.toLowerCase().includes('hat') || headgear.name.toLowerCase().includes('sombrero') || headgear.name.toLowerCase().includes('straw') ? (
                  <>
                    {/* Wide brim - extends front and back */}
                    <ellipse cx="0" cy="-4.8" rx="4.5" ry="0.5" fill={detectItemColor(headgear.color || headgear.name, secondaryColor)} />
                    <ellipse cx="0" cy="-5.1" rx="4.5" ry="0.3" fill={adjustColorBrightness(detectItemColor(headgear.color || headgear.name, secondaryColor), 15)} opacity="0.7" />
                    {/* Crown/top */}
                    <rect x="-2.2" y="-6.5" width="4.4" height="1.8" fill={detectItemColor(headgear.color || headgear.name, secondaryColor)} rx="0.5" />
                    <rect x="-2.2" y="-6.5" width="1.5" height="1.8" fill={adjustColorBrightness(detectItemColor(headgear.color || headgear.name, secondaryColor), 10)} rx="0.5" opacity="0.6" />
                  </>
                ) : headgear.name.toLowerCase().includes('cap') || headgear.name.toLowerCase().includes('beret') ? (
                  <>
                    {/* Small brim or no brim */}
                    <ellipse cx="0.5" cy="-5" rx="3.2" ry="2" fill={detectItemColor(headgear.color || headgear.name, secondaryColor)} />
                  </>
                ) : headgear.name.toLowerCase().includes('helmet') ? (
                  <>
                    <path d="M -2.5 -6 Q -3 -4, -2.8 -2 L 2.8 -2 Q 3.2 -4, 2.5 -6 Z" fill="#a1a1aa" opacity="0.9" />
                    <ellipse cx="0" cy="-2.5" rx="2.5" ry="0.4" fill="#8a8a99" opacity="0.7" />
                  </>
                ) : headgear.name.toLowerCase().includes('crown') || headgear.name.toLowerCase().includes('tiara') ? (
                  <>
                    <rect x="-2" y="-5" width="4" height="1.2" fill="#fcd34d" />
                    <rect x="-1.5" y="-6.2" width="0.8" height="1.2" fill="#fcd34d" />
                    <rect x="0.7" y="-6.2" width="0.8" height="1.2" fill="#fcd34d" />
                    <circle cx="-1.1" cy="-6.5" r="0.3" fill="#ff6b6b" />
                    <circle cx="1.1" cy="-6.5" r="0.3" fill="#ff6b6b" />
                  </>
                ) : headgear.name.toLowerCase().includes('turban') || headgear.name.toLowerCase().includes('wrap') ? (
                  <>
                    {/* Wrapped turban - layered effect */}
                    <ellipse cx="0" cy="-4.5" rx="3" ry="2.5" fill={detectItemColor(headgear.color || headgear.name, secondaryColor)} />
                    <ellipse cx="-0.5" cy="-4.8" rx="2.5" ry="2" fill={adjustColorBrightness(detectItemColor(headgear.color || headgear.name, secondaryColor), -10)} opacity="0.6" />
                    <ellipse cx="0.5" cy="-4.2" rx="2.2" ry="1.8" fill={adjustColorBrightness(detectItemColor(headgear.color || headgear.name, secondaryColor), 10)} opacity="0.5" />
                  </>
                ) : headgear.name.toLowerCase().includes('hood') || headgear.name.toLowerCase().includes('cowl') ? (
                  <>
                    {/* Hood draping over head */}
                    <path d="M -2.5 -6 Q -3 -3, -2 -1 L -1.5 -1.5 Q -2 -4, -1.8 -6 Z" fill={detectItemColor(headgear.color || headgear.name, secondaryColor)} opacity="0.8" />
                    <ellipse cx="0" cy="-5" rx="3" ry="2.2" fill={detectItemColor(headgear.color || headgear.name, secondaryColor)} />
                    <path d="M 2.5 -6 Q 3 -3, 2 -1 L 1.5 -1.5 Q 2 -4, 1.8 -6 Z" fill={adjustColorBrightness(detectItemColor(headgear.color || headgear.name, secondaryColor), -15)} opacity="0.7" />
                  </>
                ) : (
                  /* Generic headgear fallback */
                  <ellipse cx="0" cy="-5" rx="3" ry="2" fill={detectItemColor(headgear.color || headgear.name, secondaryColor)} />
                )}
              </g>
            )}

            {/* Equipped hand item - side view (east/west) */}
            {direction === 'east' && handItemElement?.east}
            {direction === 'west' && handItemElement?.west}

            {/* Charge glow effect - rendered below swoosh */}
            {chargeGlow}

            {/* Swing swoosh effect - rendered on top */}
            {swingSwoosh}
        </g>
        )}
      </g>

      {/* Invisible clickable area for blink interaction - rendered LAST so it's on top */}
      <rect
        x="-6"
        y="-10"
        width="12"
        height="18"
        fill="transparent"
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
        pointerEvents="all"
      />
    </g>
  );
});

export default PlayerIcon;