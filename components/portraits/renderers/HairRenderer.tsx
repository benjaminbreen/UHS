/**
 * Hair renderer for procedural portraits
 * Handles all hair styles, textures, and headgear interactions
 */

import React, { useMemo } from 'react';
import { createShadow, createHighlight } from '../utils/colorUtils';
import { createRandFunction } from '../utils/portraitConstants';

interface HairRendererProps {
  hairLength: string;
  hairStyle: string;
  hairTexture: string;
  baseHair: string;
  hairShadow: string;
  hairDeepShadow: string;
  hairHighlight: string;
  hairBrightHighlight: string;
  headX: number;
  headY: number;
  headDim: { width: number; height: number };
  skinTone: string;
  isOld: boolean;
  isYoung: boolean;
  isFemale: boolean;
  headgearName?: string;
  seed: number;
  appearanceGender: string;
}

export const HairRenderer: React.FC<HairRendererProps> = ({
  hairLength,
  hairStyle,
  hairTexture,
  baseHair,
  hairShadow,
  hairDeepShadow,
  hairHighlight,
  hairBrightHighlight,
  headX,
  headY,
  headDim,
  skinTone,
  isOld,
  isYoung,
  isFemale,
  headgearName,
  seed,
  appearanceGender
}) => {
  const hairElements = useMemo(() => {
    const elements: JSX.Element[] = [];
    const hairLen = hairLength;
    const centerX = headX + headDim.width / 2;
    const isMale = appearanceGender === 'male' || appearanceGender === 'm';
    const rand = createRandFunction(seed);

    const CLIP_HAIR_TO_HEADGEAR = false;
    const hgName = (headgearName || 'none').toLowerCase();

    if (hairLen === 'bald') return [];

    // Helper function to convert RGB color string to object
    const toRGB = (color: string): { r: number; g: number; b: number } => {
      const m = color.match(/rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i);
      if (m) return { r: +m[1], g: +m[2], b: +m[3] };
      return { r: 0, g: 0, b: 0 };
    };

    // Determine headgear coverage for hair clipping
    const getHeadgearCoverage = () => {
      const name = hgName;

      // Full coverage - no hair visible on top or sides
      if (/(helmet|helm|coif|wimple|hijab|hood|biggins|zukin)/.test(name)) {
        return { top: true, sides: true, back: true, front: true };
      }

      // Top coverage only - sideburns and back visible
      if (/(cap|beret|kippah|yarmulke|fez|kufi|beanie|tuque)/.test(name)) {
        return { top: true, sides: false, back: false, front: true };
      }

      // Partial top - allows some front hair (bangs)
      if (/(crown|tiara|circlet|headband|bandana|flower|garland)/.test(name)) {
        return { top: false, sides: false, back: false, front: false };
      }

      // Wide brim hats - top covered but hair visible at sides
      if (/(hat|panama|fedora|sombrero|tricorn|straw)/.test(name)) {
        return { top: true, sides: false, back: false, front: true };
      }

      // Turbans - wraps around but might show some front
      if (/(turban|pagri)/.test(name)) {
        return { top: true, sides: true, back: true, front: false };
      }

      // Default - no coverage
      return { top: false, sides: false, back: false, front: false };
    };

    const coverage = getHeadgearCoverage();

    const getHairPattern = (x: number, y: number): number => {
      switch (hairTexture) {
        case 'straight': return Math.sin(x * 0.1) * 0.15 + Math.sin(y * 0.05) * 0.1;
        case 'wavy':    return Math.sin(x * 0.3 + y * 0.15) * 0.4 + Math.cos(x * 0.2) * 0.2;
        case 'curly':   return Math.sin(x * 0.5 + y * 0.3) * 0.7 + Math.cos(x * 0.4 + y * 0.2) * 0.3;
        case 'coily':   return Math.sin(x * 0.8 + y * 0.5) * 0.9 + Math.sin(x * 0.6 + y * 0.4) * 0.4;
        case 'kinky':   return Math.sin(x * 1.2 + y * 0.8) * 1.1 + Math.cos(x * 0.9 + y * 0.6) * 0.5;
        default:        return 0;
      }
    };

    // More subtle volume parameters based on hair texture
    const getVolumeOffset = (texture: string, y: number, side: 'left' | 'right' | 'top'): number => {
      const relY = y - headY;
      const crownArea = relY < 4;

      switch (texture) {
        case 'straight':
          return side === 'top' && crownArea ? 1 : 0;
        case 'wavy':
          return side === 'top' ? 1.5 : 1;
        case 'curly':
          return side === 'top' ? 2 : (side === 'left' || side === 'right' ? 1.5 : 1);
        case 'coily':
        case 'kinky':
          return side === 'top' ? 2.5 : (side === 'left' || side === 'right' ? 2 : 1.5);
        default:
          return 0.5;
      }
    };

    // Buzz/crew shouldn't carve a gap out of the hairline
    const revealForehead = hairLen === 'short' ? 1 : 0;

    // Lower hairTop for very short to hug scalp instead of floating
    const hairTop = headY - (hairLen === 'very_short' ? 2 : hairLen === 'short' ? 4 : 7);
    const thickness = isOld ? 0.7 : isYoung ? 0.95 : 0.85;

    // Fix unrealistic hair colors - convert oversaturated reds to natural tones
    const naturalizeHairColor = (color: string): string => {
      const rgb = toRGB(color);
      // If it's an oversaturated red (high red, low green/blue), convert to auburn
      if (rgb.r > 150 && rgb.g < 80 && rgb.b < 80) {
        return '#8B4513'; // Natural auburn/saddle brown
      }
      // If it's bright red, make it more orange-brown
      if (rgb.r > 200 && rgb.g < 100 && rgb.b < 100) {
        return '#CD853F'; // Peru/orange-brown
      }
      return color;
    };

    const naturalBaseHair = naturalizeHairColor(baseHair);
    const naturalHairShadow = createShadow(naturalBaseHair, 0.7);
    const naturalHairDeepShadow = createShadow(naturalBaseHair, 0.5);
    const naturalHairHighlight = createHighlight(naturalBaseHair, 1.2);
    const naturalHairBrightHighlight = createHighlight(naturalBaseHair, 1.4);

    // ---- helper: paint scalp cap across the crown (top-of-head) ----
    const paintScalpCap = (opts?: { buzz?: boolean }) => {
      if (hairLen === 'bald') return;

      const buzz = !!opts?.buzz;
      // Use a fuller thickness for cap; for buzz/crew, make it tight to the scalp
      const capThickness = buzz ? 1.0 : 0.95;

      // Reduced volume for more natural appearance
      const volumeBoost = hairTexture === 'kinky' || hairTexture === 'coily' ? 4 :
                         hairTexture === 'curly' ? 3 :
                         hairTexture === 'wavy' ? 2 : 1;

      const capTop = headY - (hairLen === 'very_short' ? 1 : hairLen === 'short' ? 2 :
                              hairLen === 'medium' ? volumeBoost + 1 : volumeBoost + 2);
      const cx = centerX;

      // Add volume layers for depth
      for (let layer = 0; layer < 2; layer++) { // Back to 2 layers for cleaner look
        for (let y = capTop; y < headY + 6; y++) {
          const isTopCrown = y < headY;
          const relY = y - headY;

          // More subtle volume based on texture
          const sideVolume = hairTexture === 'kinky' || hairTexture === 'coily' ? 2 :
                            hairTexture === 'curly' ? 1.5 :
                            hairTexture === 'wavy' ? 1 : 0.5;

          // Natural taper of hair width
          let rowHalf;
          if (y < headY - 2) {
            // Top of head - narrower
            rowHalf = (headDim.width / 2) * 0.8 + sideVolume;
          } else if (y < headY + 2) {
            // Around temples - natural width
            rowHalf = (headDim.width / 2 + 1) + sideVolume;
          } else {
            // Below ears - taper inward
            rowHalf = (headDim.width / 2 - layer) + sideVolume * 0.5;
          }

          const left = Math.round(cx - rowHalf + layer);
          const right = Math.round(cx + rowHalf - layer);

          for (let x = left; x <= right; x++) {
            // Keep face center reasonably clear except at the top hairline
            const relY = y - headY;
            const relX = x - headX;

            // Create more natural hairline with baby hairs and gradual transition
            // Add receding hairline for older men
            const baseHairlineY = isOld && isMale ? 5 : 3; // Higher hairline for old men
            const templeRecession = isOld && isMale && Math.abs(x - cx) > headDim.width * 0.3 ? 2 : 0; // Temple recession
            const hairlineY = baseHairlineY + templeRecession + Math.sin((x - cx) * 0.3) * 0.5; // Slight wave in hairline
            const isHairlineEdge = relY >= hairlineY && relY <= hairlineY + 2;
            const hairlineDensity = isHairlineEdge ? 0.4 + (relY - hairlineY) * 0.3 : 1.0;

            const inFace =
              !buzz &&
              relY >= 4 && relY <= headDim.height - 3 &&
              Math.abs(x - cx) <= (headDim.width / 2 - 2);

            // respect headgear coverage masks
            const isTop = relY < 0;
            const isSides = relX < 2 || relX > headDim.width - 2;
            const isFront = relY < 3 && relX >= 2 && relX <= headDim.width - 2;
            const isBack = relY >= headDim.height - 2;

            const masked =
              (coverage.top && isTop) ||
              (coverage.sides && isSides) ||
              (coverage.front && isFront) ||
              (coverage.back && isBack);

            if (!inFace && !masked) {
              // Use density for hairline edge rendering
              if (isHairlineEdge && Math.random() > hairlineDensity) continue;

              const p = getHairPattern(x, y);

              // Enhanced color depth based on layer
              let col = layer === 0 ? naturalHairDeepShadow :
                       layer === 1 ? naturalHairShadow :
                       naturalBaseHair;

              if (p > 0.35) {
                col = layer === 0 ? naturalHairShadow :
                     layer === 1 ? naturalBaseHair :
                     naturalHairHighlight;
              }

              // Add subtle transparency for edge layers to create softer look
              const opacity = layer === 2 && (x === left || x === right) ? 0.8 : 1;

              elements.push(
                <rect key={`cap-${layer}-${x}-${y}`} x={x} y={y} width="1" height="1"
                     fill={col} opacity={opacity} className="pixel" />
              );
            }
          }
        }
      }

      // Add subtle flyaway hairs for natural look
      if (!buzz && hairTexture !== 'straight') {
        const numFlyaways = hairTexture === 'wavy' ? 3 :
                           hairTexture === 'curly' ? 5 : 7;

        for (let i = 0; i < numFlyaways; i++) {
          const angle = (i / numFlyaways) * Math.PI * 2;
          const distance = 0.5 + Math.random();
          const fx = Math.round(cx + Math.cos(angle) * (headDim.width / 2 + distance));
          const fy = Math.round(headY + Math.sin(angle) * distance);

          if (fy < headY + headDim.height * 0.5 && fy >= headY - 3) { // Only around upper head
            elements.push(
              <rect key={`flyaway-${i}`} x={fx} y={fy} width="1" height="1"
                   fill={naturalHairHighlight} opacity="0.3" className="pixel" />
            );
          }
        }
      }
    };

    // Now it's safe to call paintScalpCap (after centerX, getHairPattern, and natural colors are defined)
    const isBuzz = hairLen === 'very_short' || hairStyle === 'crew' || hairStyle === 'pixie' || hairStyle === 'finger_waves';
    paintScalpCap({ buzz: isBuzz });

    // Add subtle texture-specific strand patterns
    if (!isBuzz && hairLen !== 'bald' && hairTexture !== 'straight') {
      const numStrands = hairTexture === 'wavy' ? 8 :
                        hairTexture === 'curly' ? 12 : 15;

      for (let i = 0; i < numStrands; i++) {
        const strandSeed = i * 137; // Prime number for good distribution
        const strandX = headX + 3 + (strandSeed % (headDim.width - 6));
        const strandStartY = headY - 2 + (strandSeed % 3);
        const strandLength = hairLen === 'short' ? 3 :
                            hairLen === 'medium' ? 5 : 7;

        // Draw strand based on texture
        for (let j = 0; j < strandLength; j++) {
          let x = strandX;
          let y = strandStartY + j;

          // Apply texture-specific patterns - more subtle
          if (hairTexture === 'wavy') {
            x += Math.sin(j * 0.5) * 1;
          } else if (hairTexture === 'curly') {
            x += Math.sin(j * 0.8 + i) * 1.5;
            y += Math.cos(j * 0.6) * 0.3;
          } else if (hairTexture === 'kinky' || hairTexture === 'coily') {
            x += ((j + i) % 3) - 1; // Zigzag pattern
            y += Math.sin(j * 1.2) * 0.2;
          }

          // Skip if outside head area or in face
          const relX = x - headX;
          const relY = y - headY;
          if (relX < 0 || relX >= headDim.width || relY < 0) continue;
          if (relY >= 4 && relY <= headDim.height - 3 && Math.abs(relX - headDim.width/2) <= headDim.width/2 - 2) continue;

          // Subtle color variation
          const strandColor = j % 2 === 0 ? naturalBaseHair : naturalHairShadow;

          elements.push(
            <rect key={`strand-${i}-${j}`} x={Math.round(x)} y={Math.round(y)}
                 width="1" height="1" fill={strandColor} opacity="0.4" className="pixel" />
          );
        }
      }

      // Add highlights on crown for shine
      if (hairTexture === 'straight' || hairTexture === 'wavy') {
        const highlightY = headY - 2;
        for (let x = -3; x <= 3; x++) {
          if (Math.abs(x) <= 1 || Math.random() > 0.5) {
            elements.push(
              <rect key={`crown-highlight-${x}`} x={centerX + x} y={highlightY}
                   width="1" height="1" fill={naturalHairBrightHighlight} opacity="0.6" className="pixel" />
            );
          }
        }
      }
    }

    // Special style rendering

    // Render braids (outside the face + behind/around ears)
    if (hairStyle === 'braided') {
      const braidWidth = 3;
      const numBraids = isFemale ? 2 : 1;

      // helpers
      const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const smooth01 = (t: number) => (t = clamp(t, 0, 1), t * t * (3 - 2 * t)); // smoothstep

      // keep the braids a few pixels OUTSIDE the head rect
      const clearance = 3; // try 3–5 if you still see overlap at some sizes
      const leftLaneBase  = headX - clearance - braidWidth;
      const rightLaneBase = headX + headDim.width + clearance;

      // ear bounds (roughly mid-face)
      const earTop    = headY + Math.round(headDim.height * 0.30);
      const earBottom = headY + Math.round(headDim.height * 0.62);

      // start a bit above the ear; length scales with hairLen
      const yStart = headY + Math.round(headDim.height * 0.14);
      const braidLength =
        hairLen === 'long'   ? Math.round(headDim.height * 1.1) :
        hairLen === 'medium' ? Math.round(headDim.height * 0.75) :
                               Math.round(headDim.height * 0.55);

      // choose lanes per braid and gently approach the ear through the ear band
      const laneX = (b: number, y: number) => {
        // 0 at earTop, 1 at earBottom
        const tEar = y <= earTop ? 0 : y >= earBottom ? 1 : (y - earTop) / (earBottom - earTop);
        const ease = smooth01(tEar);

        // as we pass the ear, come slightly closer to the head (still outside)
        const leftApproach  = Math.round(lerp(leftLaneBase,  headX - braidWidth - 1, ease));
        const rightApproach = Math.round(lerp(rightLaneBase, headX + headDim.width + 1, ease));

        if (numBraids === 1) {
          // single braid: keep it to the right side by default (change to leftApproach if you prefer)
          return rightApproach;
        }
        return b === 0 ? leftApproach : rightApproach;
      };

      for (let b = 0; b < numBraids; b++) {
        for (let y = yStart; y < yStart + braidLength; y++) {
          // gentle sway; lower frequency so it doesn't saw through the outline
          const weave = Math.sin(y * 0.45 + (b * Math.PI / 6)) * 1.2;
          const baseX = laneX(b, y);

          for (let layer = 0; layer < 3; layer++) {
            const col = layer === 0 ? naturalHairDeepShadow
                      : layer === 1 ? naturalBaseHair
                      :               naturalHairHighlight;

            for (let w = 0; w < braidWidth; w++) {
              const px = Math.round(baseX + w + weave);

              // hard guard: never draw inside the face rectangle
              const insideFace = (px >= headX && px < headX + headDim.width);
              if (insideFace) continue;

              elements.push(
                <rect
                  key={`braid-${b}-${layer}-${w}-${y}`}
                  x={px}
                  y={y}
                  width="1"
                  height="1"
                  fill={col}
                  className="pixel"
                />
              );
            }
          }
        }
      }
    }

    // Render bun - needs base hair coverage first, then elevated bun
    if (hairStyle === 'bun') {
      // First render base hair covering the scalp
      for (let layer = 0; layer < 2; layer++) {
        for (let y = hairTop; y < headY + 6; y++) {
          for (let x = headX - 4 + layer; x < headX + headDim.width + 4 - layer; x++) {
            const dist = Math.abs(x - centerX);
            let draw = false;
            const col = layer === 0 ? naturalHairShadow : naturalBaseHair;

            // Cover top and sides of head
            if (y < headY + 2) {
              const allowed = (headDim.width / 2 + 3) * thickness;
              if (dist < allowed - layer) draw = true;
            } else if (y >= headY + 2 && y < headY + 4) {
              if (dist <= headDim.width / 2 + 1 - layer) draw = true;
            }

            // Keep face area clear
            const faceTop = headY + 3;
            const faceCenterWidth = headDim.width / 2 - 2;
            if (y >= faceTop && Math.abs(x - centerX) <= faceCenterWidth) {
              draw = false;
            }

            if (draw) {
              // Check coverage mask
              const relX = x - headX;
              const relY = y - headY;
              const isTop = relY < 0;
              const isSides = relX < 2 || relX > headDim.width - 2;
              const isFront = relY < 3 && relX >= 2 && relX <= headDim.width - 2;
              const isBack = relY >= headDim.height - 2;

            const shouldSkip =
              CLIP_HAIR_TO_HEADGEAR && (
                (coverage.top && isTop) ||
                (coverage.sides && isSides) ||
                (coverage.front && isFront) ||
                (coverage.back && isBack)
              );

              if (!shouldSkip) {
                elements.push(<rect key={`bun-base-${layer}-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
              }
            }
          }
        }
      }

      // Now render the actual bun above the hairline
      const bunY = headY - 6; // Moved higher above head
      const bunSize = 10; // Made slightly larger
      for (let dy = 0; dy < bunSize; dy++) {
        for (let dx = 0; dx < bunSize; dx++) {
          const dist = Math.sqrt((dx - bunSize/2) ** 2 + (dy - bunSize/2) ** 2);
          if (dist < bunSize/2) {
            const shade = dist / (bunSize/2);
            const col = shade < 0.3 ? naturalHairHighlight : shade < 0.7 ? naturalBaseHair : naturalHairShadow;
            elements.push(<rect key={`bun-${dx}-${dy}`} x={centerX - bunSize/2 + dx} y={bunY + dy} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }
    }

    // Render ponytail
    if (hairStyle === 'ponytail') {
      const tieY = headY + 4;
      // Hair tie
      elements.push(<rect key="tie" x={centerX - 2} y={tieY} width="4" height="2" fill={hairDeepShadow} className="pixel" />);

      // Ponytail strands
      const tailLength = hairLen === 'long' ? 20 : 12;
      for (let y = tieY + 2; y < tieY + tailLength; y++) {
        const sway = Math.sin(y * 0.2) * 2;
        const width = Math.max(0, 4 - Math.floor((y - tieY) / 8));
        for (let layer = 0; layer < 3; layer++) {
          const col = layer === 0 ? naturalHairShadow : layer === 1 ? naturalBaseHair : naturalHairHighlight;
          for (let x = -width; x <= width; x++) {
            elements.push(<rect key={`tail-${layer}-${x}-${y}`} x={centerX + x + sway} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }
    }

    // Render afro
    if (hairStyle === 'afro') {
      const afroRadius = headDim.width / 2 + 6;
      for (let y = headY - 8; y < headY + 12; y++) {
        for (let x = centerX - afroRadius; x <= centerX + afroRadius; x++) {
          const dx = x - centerX;
          const dy = y - (headY + 2);
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < afroRadius && dist > 2) {
            // Better face boundary detection - preserve eyes, nose, mouth area
            const faceTop = headY + 3;
            const faceBottom = headY + headDim.height - 3;
            const faceCenterWidth = headDim.width / 2 - 3;
            const isInFaceArea = y >= faceTop && y <= faceBottom && Math.abs(dx) <= faceCenterWidth;

            if (!isInFaceArea) {
              const noise = Math.sin(x * 1.5 + y * 1.5) * 0.5 + Math.cos(x * 2.1 - y * 1.8) * 0.3;
              const layer = dist < afroRadius * 0.6 ? 2 : dist < afroRadius * 0.85 ? 1 : 0;
              const col = layer === 0 ? hairDeepShadow : layer === 1 ? baseHair : noise > 0.2 ? hairHighlight : baseHair;

              // Check coverage mask
              const relX = x - headX;
              const relY = y - headY;
              const isTop = relY < 0;
              const isSides = relX < 2 || relX > headDim.width - 2;
              const isFront = relY < 3 && relX >= 2 && relX <= headDim.width - 2;
              const isBack = relY >= headDim.height - 2;

             const shouldSkip =
               CLIP_HAIR_TO_HEADGEAR && (
                 (coverage.top && isTop) ||
                 (coverage.sides && isSides) ||
                 (coverage.front && isFront) ||
                 (coverage.back && isBack)
               );

              if (!shouldSkip) {
                elements.push(<rect key={`afro-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
              }
            }
          }
        }
      }
    }

    // Default hair rendering for simple/flowing styles
    const defaultCapStyles = new Set([
      'simple','flowing','bob','pixie','crew',
      'wavy','curly','formal','parted','slicked',
      'finger_waves','flapper','pin_curls','pompadour','professional','marcel_waves'
    ]);

    if (defaultCapStyles.has(hairStyle)) {
      // Add helpers for buzz cuts
      const isBuzz = hairLen === 'very_short' || hairStyle === 'crew' || hairStyle === 'pixie';
      const coverThickness = isBuzz ? 1 : thickness;   // ignore age thinning for buzz/crew

      for (let layer = 0; layer < 3; layer++) {
        for (let y = hairTop - layer; y < headY + 10; y++) {
          for (let x = headX - 7 + layer; x < headX + headDim.width + 7 - layer; x++) {
          const dist = Math.abs(x - centerX);
          let draw = false;
          let col = layer === 0 ? naturalHairDeepShadow : layer === 1 ? naturalBaseHair : naturalHairHighlight;

          // FULL SCALP COVERAGE - using coverThickness instead of thickness
          if (y < headY + 3) {
            const topProgress = (headY + 3 - y) / (headY + 3 - hairTop);
            const allowed = (headDim.width / 2 + 5) * coverThickness * (1 - topProgress * 0.3);
            if (dist < allowed - layer) draw = true;
          } else if (y >= headY + 3 && y < headY + 8 - layer) {
            // Ensure sides are covered too
            if (dist <= headDim.width / 2 + 3 - layer) draw = true;
          }

          // Only clear center facial features for non-buzz cuts
          const faceTop = headY + 4;
          const faceBottom = headY + headDim.height - 3;
          const faceCenterWidth = headDim.width / 2 - 2;
          const isInFaceArea = y >= faceTop && y <= faceBottom && Math.abs(x - centerX) <= faceCenterWidth;

          if (!isBuzz && isInFaceArea) {
            draw = false;
          }

          if (draw && (!isOld || rand(x + y * 100 + layer * 1000) > 0.35)) {
            const p = getHairPattern(x, y);
            if (p > 0.3) col = layer === 2 ? hairBrightHighlight : hairHighlight;
            else if (p < -0.3) col = hairDeepShadow;
            if (rand(x * 10 + y * 100 + layer * 500) > 0.8) col = createHighlight(col, 1.1);

            // Check coverage mask
            const relX = x - headX;
            const relY = y - headY;
            const isTop = relY < 0;
            const isSides = relX < 2 || relX > headDim.width - 2;
            const isFront = relY < 3 && relX >= 2 && relX <= headDim.width - 2;
            const isBack = relY >= headDim.height - 2;

            const shouldSkip = CLIP_HAIR_TO_HEADGEAR && (
              (coverage.top && isTop) ||
              (coverage.sides && isSides) ||
              (coverage.front && isFront) ||
              (coverage.back && isBack)
            );

            if (!shouldSkip) {
              elements.push(<rect key={`hair-${layer}-${x}-${y}`} x={x + p * 0.3} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }
      }
    }
    }

    // Long hair flow for medium/long lengths
    if (['medium', 'long', 'very_long'].includes(hairLen) && (hairStyle === 'simple' || hairStyle === 'flowing')) {
      const hairLengthPixels = hairLen === 'very_long' ? 28 : hairLen === 'long' ? 20 : 12;
      for (let y = headY + 5; y < headY + hairLengthPixels; y++) {
        const progress = (y - headY - 5) / hairLengthPixels;
        const widthReduction = Math.floor(progress * 6);
        const flow = Math.sin(y * 0.15) * 2;

        for (let strand = 0; strand < 3; strand++) {
          const strandOffset = strand * 1.5;
          for (let x = headX - 6 + widthReduction + strandOffset; x <= headX + 4 - strandOffset; x++) {
            const p = getHairPattern(x, y);
            const s = Math.sin((x - headX) * 2 + y * 0.3 + strand) * 0.4;
            let col = strand === 0 ? naturalHairShadow : strand === 1 ? naturalBaseHair : naturalHairHighlight;
            if (s > 0.2 && strand === 2) col = naturalHairBrightHighlight;
            if (!isOld || rand(x + y + strand * 1000) > 0.4) {
              // Check coverage mask for side hair
              const relX = (x + s * 0.4 + p + flow) - headX;
              const relY = y - headY;
              const isSides = relX < 2 || relX > headDim.width - 2;

              if (!(coverage.sides && isSides)) {
                elements.push(<rect key={`hair-left-${strand}-${x}-${y}`} x={x + s * 0.4 + p + flow} y={y} width="1" height="1" fill={col} className="pixel" />);
              }
            }
          }
          for (let x = headX + headDim.width - 4 + strandOffset; x < headX + headDim.width + 6 - widthReduction - strandOffset; x++) {
            const p = getHairPattern(x, y);
            const s = Math.sin((x - headX) * 2 + y * 0.3 + strand) * 0.4;
            let col = strand === 0 ? naturalHairShadow : strand === 1 ? naturalBaseHair : naturalHairHighlight;
            if (s > 0.2 && strand === 2) col = naturalHairBrightHighlight;
            if (!isOld || rand(x + y + strand * 1000) > 0.4) {
              // Check coverage mask for side hair
              const relX = (x - s * 0.4 - p - flow) - headX;
              const relY = y - headY;
              const isSides = relX < 2 || relX > headDim.width - 2;

              if (!(coverage.sides && isSides)) {
                elements.push(<rect key={`hair-right-${strand}-${x}-${y}`} x={x - s * 0.4 - p - flow} y={y} width="1" height="1" fill={col} className="pixel" />);
              }
            }
          }
        }
      }
    }

    return elements;
  }, [hairLength, hairStyle, hairTexture, baseHair, hairShadow, hairDeepShadow, hairHighlight, hairBrightHighlight, headX, headY, headDim.width, headDim.height, skinTone, isOld, isYoung, isFemale, headgearName, seed, appearanceGender]);

  return <g key="hair">{hairElements}</g>;
};

export default HairRenderer;