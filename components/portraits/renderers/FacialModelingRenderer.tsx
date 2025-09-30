/**
 * Facial Modeling Renderer - Advanced 3D facial contouring and lighting
 * Creates realistic facial depth through sophisticated shadow and highlight mapping
 */

import React, { useMemo } from 'react';
import { createShadow, createHighlight } from '../utils/colorUtils';

interface FacialModelingRendererProps {
  headX: number;
  headY: number;
  headDimWidth: number;
  headDimHeight: number;
  faceShape: string;
  jawline: string;
  cheekbones: string;
  skinTone: string;
  skinShadow: string;
  skinHighlight: string;
  skinMidtone: string;
  skinDeepShadow: string;
  skinBrightHighlight: string;
  skinSubsurface: string;
  actualSkinTone: string;
  isFemale: boolean;
  isOld: boolean;
  isYoung: boolean;
  stats: { strength: number; constitution: number };
  character: {
    health?: number;
    maxHealth?: number;
    diseaseHealth?: { currentDiseases?: any[] };
  };
  diseaseEffects: {
    hasFever: boolean;
    hasSmallpox: boolean;
    hasMeasles: boolean;
    severity: number;
  };
  appearanceWithDefaults?: {
    skinTexture?: string;
  };
  rand: (seed: number) => number;
}

export const FacialModelingRenderer: React.FC<FacialModelingRendererProps> = ({
  headX,
  headY,
  headDimWidth,
  headDimHeight,
  faceShape,
  jawline,
  cheekbones,
  skinTone,
  skinShadow,
  skinHighlight,
  skinMidtone,
  skinDeepShadow,
  skinBrightHighlight,
  skinSubsurface,
  actualSkinTone,
  isFemale,
  isOld,
  isYoung,
  stats,
  character,
  diseaseEffects,
  appearanceWithDefaults = {},
  rand
}) => {
  const facialModelingElements = useMemo(() => {
    const elements: JSX.Element[] = [];

    // Enhanced facial contour mapping with proper 3D modeling
    const centerX = headX + Math.floor(headDimWidth / 2);
    const W = headDimWidth;
    const H = headDimHeight;

    // === FACIAL ASYMMETRY SYSTEM ===
    // Natural faces are never perfectly symmetrical
    const asymmetrySeed = rand(1337) + rand(7331);
    const leftCheekOffset = (asymmetrySeed * 0.02 - 0.01) * W; // -1% to +1% width
    const rightEyeVerticalOffset = Math.floor((rand(2448) - 0.5) * 0.01 * H); // Slight vertical offset
    const noseDeviation = (rand(3559) - 0.5) * 0.015; // Slight nose deviation
    const mouthTilt = (rand(4660) - 0.5) * 0.01; // Slight mouth angle
    const jawAsymmetry = rand(5771) > 0.5 ? 0.03 : -0.03; // One side slightly stronger

    // Helper functions matching renderHead
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const smooth01 = (x: number) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };

    // Face shape parameters - EXACT match from renderHead
    const baseCurve: Record<string, any> = {
      oval:     { crownRoundness: 0.34, cheekTop: 0.40, cheekBot: 0.72, chinTaper: 0.36, jawSoftness: 0.08 },
      round:    { crownRoundness: 0.30, cheekTop: 0.45, cheekBot: 0.78, chinTaper: 0.46, jawSoftness: 0.05 },
      square:   { crownRoundness: 0.36, cheekTop: 0.46, cheekBot: 0.70, chinTaper: 0.50, jawSoftness: 0.03 },
      heart:    { crownRoundness: 0.32, cheekTop: 0.40, cheekBot: 0.68, chinTaper: 0.28, jawSoftness: 0.10 },
      diamond:  { crownRoundness: 0.33, cheekTop: 0.42, cheekBot: 0.70, chinTaper: 0.34, jawSoftness: 0.09 },
      long:     { crownRoundness: 0.36, cheekTop: 0.46, cheekBot: 0.76, chinTaper: 0.38, jawSoftness: 0.07 },
    };

    const widthAnchors: Record<string, { topW: number; cheekW: number; chinW: number }> = {
      oval:    { topW: 0.55, cheekW: 1.00, chinW: 0.68 },
      round:   { topW: 0.60, cheekW: 1.04, chinW: 0.78 },
      square:  { topW: 0.65, cheekW: 1.02, chinW: 0.84 },
      heart:   { topW: 0.58, cheekW: 1.02, chinW: 0.58 },
      diamond: { topW: 0.50, cheekW: 1.06, chinW: 0.66 },
      long:    { topW: 0.52, cheekW: 0.98, chinW: 0.64 },
    };

    const faceShapeLower = (faceShape || 'oval').toLowerCase();
    const curve = baseCurve[faceShapeLower] ?? baseCurve.oval;
    let { topW, cheekW, chinW } = widthAnchors[faceShapeLower] ?? widthAnchors.oval;

    // Jawline modifications
    if (jawline === 'square') chinW += 0.10;
    else if (jawline === 'sharp') chinW -= 0.08;

    // Gender-specific jaw modifications
    if (isFemale) {
      chinW *= 0.65;
      cheekW *= 0.90;
      if (jawline === 'square') chinW -= 0.12;
      else if (jawline === 'sharp') chinW -= 0.08;
      else if (jawline === 'round') chinW -= 0.10;
      else if (jawline === 'oval') chinW -= 0.06;
    }

    // Cheekbone modifications
    if (cheekbones === 'high') cheekW += 0.04;
    else if (cheekbones === 'low') cheekW -= 0.03;

    // Clamp anchors
    topW = clamp(topW, 0.45, 0.70);
    cheekW = clamp(cheekW, 0.94, 1.10);
    chinW = clamp(chinW, 0.52, 0.90);

    // Asymmetry using same seed calculation as renderHead
    const seedVal = ((headX << 2) ^ (headY << 1) ^ (W * 31) ^ (H * 17)) >>> 0;
    const makeRng = (s: number) => {
      let n = s || 1;
      return () => ((n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b)) >>> 0) / 0xffffffff;
    };
    const rng = makeRng(seedVal);
    const leftBias = (rng() * 2 - 1) * 0.8;
    const rightBias = (rng() * 2 - 1) * 0.8;
    const cheekVariance = (rng() * 2 - 1) * 0.5;

    // EXACT halfWidthAtT function from renderHead
    const halfWidthAtT = (t: number) => {
      let wNorm: number;

      if (t < curve.crownRoundness) {
        const u = smooth01(t / curve.crownRoundness);
        const crownCurve = t < 0.1 ? Math.pow(t / 0.1, 0.6) : 1.0;
        wNorm = lerp(topW, cheekW, u) * crownCurve;
      } else if (t < curve.cheekBot) {
        const u = (t - curve.crownRoundness) / (curve.cheekBot - curve.crownRoundness);
        const bulge = 1 - 0.06 * Math.cos(u * Math.PI);
        wNorm = cheekW * bulge;
      } else {
        const u = smooth01((t - curve.cheekBot) / (1 - curve.cheekBot));
        wNorm = lerp(cheekW, chinW, u);
        let jawSoftnessMultiplier = !isFemale ? 1.0 : 1.5;
        wNorm -= curve.jawSoftness * jawSoftnessMultiplier * Math.pow(Math.max(0, t - 0.80), 1.8) * (W / Math.max(W, 24));
      }

      wNorm = clamp(wNorm, 0.50, 1.12);
      const full = Math.max(6, Math.round(W * wNorm * 1.15));
      return Math.floor(full / 2);
    };

    // Enhanced 3D facial modeling - row by row matching renderHead
    for (let yi = 0; yi < H; yi++) {
      const y = headY + yi;
      const t = H > 1 ? yi / (H - 1) : 0;
      const hw = halfWidthAtT(t);

      // Asymmetry matching renderHead
      const asymCurve = (t - 0.25) * 1.2;
      const leftX = Math.round(
        centerX - hw + leftBias * asymCurve + (t > curve.cheekTop && t < curve.cheekBot ? cheekVariance : 0)
      );
      const rightX = Math.round(centerX + hw + rightBias * asymCurve);

      const rowWidth = rightX - leftX + 1;
      for (let x = leftX; x <= rightX; x++) {
        const xLocal = x - leftX;
        const xRatio = rowWidth > 1 ? xLocal / (rowWidth - 1) : 0.5;
        const distFromCenter = Math.abs(xRatio - 0.5) * 2; // 0 at center, 1 at edges

        // Base skin color - start with actual skin tone
        let faceColor = skinTone;

        // === BASE LATERAL SHADING (matching old renderHead) ===
        // This is the foundation - same as the working old code
        if (xRatio < 0.15) faceColor = skinBrightHighlight;
        else if (xRatio < 0.25) faceColor = skinHighlight;
        else if (xRatio < 0.4) faceColor = createHighlight(skinTone, 1.08);
        else if (xRatio > 0.85) faceColor = skinDeepShadow;
        else if (xRatio > 0.75) faceColor = skinShadow;
        else if (xRatio > 0.6) faceColor = skinMidtone;

        // === RIM LIGHT GRADIENT (left edge) ===
        if (xLocal < 3 && t > 0.2 && t < 0.8) {
          if (xLocal === 0) {
            faceColor = skinBrightHighlight;
          } else if (xLocal === 1) {
            faceColor = skinHighlight;
          } else if (xLocal === 2) {
            faceColor = createHighlight(skinTone, 1.05);
          }
        }

        // === FACIAL STRUCTURE MODELING ===

        // CHEEKBONE LIFT - matching old code
        if (cheekbones !== 'low' && t > 0.4 && t < 0.65) {
          const cheekboneIntensity = cheekbones === 'high' ? 0.12 : 0.08;
          if (Math.abs(xRatio - 0.22) < cheekboneIntensity || Math.abs(xRatio - 0.78) < cheekboneIntensity) {
            faceColor = createHighlight(faceColor, xRatio < 0.5 ? 1.1 : 1.05);
          }
        }

        // TEMPLE MODELING - matching old code's subtle temple hollows
        if (t > 0.3 && t < 0.5) {
          if (xLocal < 4 || xLocal > rowWidth - 5) {
            const templeDepth = t > 0.35 && t < 0.45 ? 0.3 : 0.15;
            const edgeDistance = xLocal < 4 ? xLocal : (rowWidth - 1 - xLocal);
            const isRightTemple = xLocal > rowWidth - 5;

            if (isRightTemple) {
              if (edgeDistance === 0) {
                faceColor = createHighlight(faceColor, 1.05);
              } else if (edgeDistance === 1) {
                faceColor = createHighlight(faceColor, 1.03);
              } else if (edgeDistance === 2) {
                faceColor = createHighlight(faceColor, 1.02);
              }
            } else {
              if (edgeDistance === 0) {
                faceColor = createShadow(skinSubsurface, 0.96 - (templeDepth * 0.02));
              } else if (edgeDistance === 1) {
                faceColor = createShadow(skinSubsurface, 0.98 - (templeDepth * 0.01));
              } else if (edgeDistance === 2) {
                faceColor = createShadow(skinSubsurface, 0.99 - (templeDepth * 0.005));
              } else {
                faceColor = skinSubsurface;
              }
            }
          }
        }

        // JAWLINE DEFINITION - Enhanced structure
        if (t > 0.7) {
          const jawStrength = jawline === 'strong' ? 1.2 :
                            jawline === 'soft' ? 0.6 :
                            jawline === 'angular' ? 1.4 : 1.0;

          // Jaw shadow under the jawline
          if (t > 0.8 && (xRatio < 0.25 || xRatio > 0.75)) {
            const jawShadowIntensity = (t - 0.8) / 0.2 * jawStrength;
            faceColor = createShadow(faceColor, 1 - jawShadowIntensity * 0.12);
          }

          // Jaw highlight on the jawline itself
          if (t > 0.75 && t < 0.82 && xRatio > 0.2 && xRatio < 0.8) {
            const jawHighlightIntensity = jawStrength * 0.8;
            faceColor = createHighlight(faceColor, 1 + jawHighlightIntensity * 0.08);
          }
        }

        // NOSE BRIDGE with subtle glow - matching old code
        if (t > 0.25 && t < 0.65) {
          const noseDist = Math.abs(xLocal - rowWidth / 2);
          if (noseDist < 2) {
            faceColor = createHighlight(faceColor, 1.12);
          } else if (noseDist < 3) {
            // Subtle glow around nose bridge
            faceColor = createHighlight(faceColor, 1.06);
          }
        }

        // Nasolabial fold shadows (subtle lines from nose to mouth corners)
        if (t > 0.55 && t < 0.75) {
          const noseToMouthX = Math.abs(xRatio - 0.35) < 0.02 || Math.abs(xRatio - 0.65) < 0.02;
          if (noseToMouthX) {
            faceColor = createShadow(faceColor, 0.96);  // Very subtle shadow
          }
        }

        // Texture and age effects - from old code
        const skinTexture = appearanceWithDefaults?.skinTexture || 'smooth';
        if (skinTexture === 'freckled' && rand(x * 100 + y * 1000) > 0.92) {
          faceColor = createShadow(faceColor, 0.85);
        } else if (skinTexture === 'weathered' && rand(x * 50 + y * 500) > 0.88) {
          faceColor = createShadow(faceColor, 0.92);
        }
        const hasAgeSpots = isOld && rand(202) > 0.5;
        if (hasAgeSpots && t > 0.3 && t < 0.7 && rand(x * 200 + y * 2000) > 0.96) {
          faceColor = createShadow(faceColor, 0.75);
        }
        const hasWrinkles = isOld && rand(200) > 0.2;
        if (hasWrinkles) {
          if ((t > 0.18 && t < 0.32) && yi % 4 === 0) faceColor = createShadow(faceColor, 0.88);
          if ((t > 0.35 && t < 0.45) && (xRatio < 0.15 || xRatio > 0.85) && ((xLocal + yi) % 3 === 0)) faceColor = createShadow(faceColor, 0.9);
          if ((t > 0.55 && t < 0.75) && (xRatio < 0.3 || xRatio > 0.7) && (((xLocal - Math.floor(rowWidth / 2)) % 4) === 0)) faceColor = createShadow(faceColor, 0.89);
        }

        // REMOVE ALL THE COMPLEX SECTIONS BELOW - just draw the face pixel
        /* REMOVED complex eye socket modeling - keeping it simple
        if (false && t > 0.25 && t < 0.54) {
          const baseSocketDepth = isOld ? 0.22 : (isFemale ? 0.12 : 0.18);

          // BROW RIDGE - More pronounced supraorbital ridge
          if (t > 0.25 && t < 0.34) {
            const browRidgeProminence = isFemale ? 0.06 : 0.1;
            const ridgeCenter = Math.abs(xRatio - 0.5) < 0.35;

            if (ridgeCenter) {
              // Central brow bone highlight
              const ridgeHighlight = (0.35 - Math.abs(xRatio - 0.5)) / 0.35;
              faceColor = createHighlight(faceColor, 1 + ridgeHighlight * browRidgeProminence);
            }

            // Glabella (area between eyebrows) definition
            if (Math.abs(xRatio - 0.5) < 0.05 && t > 0.3 && t < 0.34) {
              faceColor = createHighlight(faceColor, 1.08);
            }
          }

          // LEFT EYE SOCKET - Deep orbital cavity
          const leftEyeX = 0.3 + noseDeviation * 0.5;
          const leftEyeDist = Math.abs(xRatio - leftEyeX);

          if (leftEyeDist < 0.18) {
            const socketFalloff = Math.pow((leftEyeDist / 0.18), 0.8);
            const verticalDepth = t < 0.38 ? 1.3 : (t > 0.46 ? 0.8 : 1.0);

            // Upper orbital rim shadow (deep)
            if (t > 0.32 && t < 0.4) {
              const upperOrbitalDepth = baseSocketDepth * (1 - socketFalloff) * 1.4 * verticalDepth;
              faceColor = createShadow(faceColor, 1 - upperOrbitalDepth);
            }

            // Inner corner (tear duct area) - deeper shadow
            if (leftEyeDist < 0.08 && xRatio > leftEyeX && t > 0.38 && t < 0.44) {
              faceColor = createShadow(faceColor, 0.88);
            }

            // Outer corner shadow
            if (leftEyeDist < 0.12 && xRatio < leftEyeX && t > 0.38 && t < 0.44) {
              faceColor = createShadow(faceColor, 0.92);
            }

            // Lower orbital rim (eye bag area)
            if (t > 0.44 && t < 0.5) {
              const lowerOrbitalDepth = baseSocketDepth * (1 - socketFalloff) * 0.6;
              faceColor = createShadow(faceColor, 1 - lowerOrbitalDepth);

              // Eye bag highlight (catches light)
              if (leftEyeDist < 0.1 && t > 0.46 && t < 0.48) {
                faceColor = createHighlight(faceColor, 1.04);
              }
            }
          }

          // RIGHT EYE SOCKET - Similar but adjusted for shadow side - with asymmetry
          const rightEyeX = 0.7 - noseDeviation * 0.5;
          const rightEyeDist = Math.abs(xRatio - rightEyeX);

          if (rightEyeDist < 0.18) {
            const socketFalloff = Math.pow((rightEyeDist / 0.18), 0.8);
            const verticalDepth = t < 0.38 ? 1.2 : (t > 0.46 ? 0.7 : 0.9);

            // Upper orbital rim shadow
            if (t > 0.32 && t < 0.4) {
              const upperOrbitalDepth = baseSocketDepth * (1 - socketFalloff) * 1.2 * verticalDepth;
              faceColor = createShadow(faceColor, 1 - upperOrbitalDepth * 0.85);
            }

            // Inner corner shadow
            if (rightEyeDist < 0.08 && xRatio < rightEyeX && t > 0.38 && t < 0.44) {
              faceColor = createShadow(faceColor, 0.9);
            }

            // Lower orbital rim
            if (t > 0.44 && t < 0.5) {
              const lowerOrbitalDepth = baseSocketDepth * (1 - socketFalloff) * 0.5;
              faceColor = createShadow(faceColor, 1 - lowerOrbitalDepth);
            }
          }
        }
        */

        /* REMOVED complex forehead modeling
        if (t < 0.32) {
          // Frontal eminences (forehead bumps)
          const leftEminenceX = 0.35;
          const rightEminenceX = 0.65;

          if (t > 0.1 && t < 0.25) {
            // Left frontal eminence
            if (Math.abs(xRatio - leftEminenceX) < 0.12) {
              const eminenceFalloff = 1 - (Math.abs(xRatio - leftEminenceX) / 0.12);
              faceColor = createHighlight(faceColor, 1 + eminenceFalloff * 0.1);
            }

            // Right frontal eminence (subtler due to shadow)
            if (Math.abs(xRatio - rightEminenceX) < 0.12) {
              const eminenceFalloff = 1 - (Math.abs(xRatio - rightEminenceX) / 0.12);
              faceColor = createHighlight(faceColor, 1 + eminenceFalloff * 0.06);
            }
          }

          // Central forehead highlight (broader and stronger)
          if (Math.abs(xRatio - 0.5) < 0.25 && t > 0.05 && t < 0.22) {
            const centerDist = Math.abs(xRatio - 0.5);
            const foreheadHighlight = Math.pow((0.25 - centerDist) / 0.25, 1.5) * 0.12;
            faceColor = createHighlight(faceColor, 1 + foreheadHighlight);
          }

          // Temporal hollows (deeper and more defined)
          if ((xRatio < 0.22 || xRatio > 0.78) && t > 0.15) {
            const edgeDist = xRatio < 0.22 ? xRatio : (1 - xRatio);
            const hollowDepth = Math.pow((0.22 - edgeDist) / 0.22, 1.2) * 0.12;
            faceColor = createShadow(faceColor, 1 - hollowDepth);
          }

          // Hairline transition shadow
          if (t < 0.08) {
            const hairlineShadow = (0.08 - t) / 0.08 * 0.1;
            faceColor = createShadow(faceColor, 1 - hairlineShadow);
          }
        }
        */

        /* REMOVED complex mouth modeling
        if (t > 0.56 && t < 0.76) {
          const mouthCenterX = 0.5;
          const mouthDist = Math.abs(xRatio - mouthCenterX);

          // PHILTRUM - Deep central groove with ridges - with asymmetry
          if (t > 0.62 && t < 0.69) {
            // Central philtrum groove (adjusted for mouth tilt)
            const adjustedMouthDist = Math.abs(xRatio - (mouthCenterX + mouthTilt));
            if (adjustedMouthDist < 0.015) {
              const grooveDepth = Math.pow((0.015 - mouthDist) / 0.015, 1.5);
              faceColor = createShadow(faceColor, 1 - grooveDepth * 0.12);
            }

            // Philtrum ridges (columns) - catch light
            if (adjustedMouthDist > 0.01 && adjustedMouthDist < 0.035) {
              const ridgeHeight = Math.pow((0.035 - mouthDist) / 0.025, 2);
              faceColor = createHighlight(faceColor, 1 + ridgeHeight * 0.05);
            }
          }

          // NASOLABIAL FOLDS - More anatomically accurate curves
          if (t > 0.58 && t < 0.74) {
            // Calculate curved path for nasolabial folds
            const foldProgress = (t - 0.58) / 0.16; // 0 at nose, 1 at mouth corner
            const foldCurveX = 0.12 + foldProgress * 0.08; // Curves outward

            // Left nasolabial fold - with natural asymmetry
            const leftFoldX = mouthCenterX - foldCurveX + mouthTilt;
            const leftFoldDist = Math.abs(xRatio - leftFoldX);

            if (leftFoldDist < 0.025) {
              const foldFalloff = Math.pow((0.025 - leftFoldDist) / 0.025, 1.2);
              const ageDepth = isOld ? 1.5 : (isYoung ? 0.5 : 1.0);
              const foldDepth = foldFalloff * 0.15 * ageDepth;

              // Main fold shadow
              if (leftFoldDist < 0.012) {
                faceColor = createShadow(faceColor, 1 - foldDepth);
              }
              // Fold ridge highlight (catches light)
              else if (leftFoldDist < 0.025) {
                faceColor = createHighlight(faceColor, 1 + foldDepth * 0.3);
              }
            }

            // Right nasolabial fold (deeper in shadow) - with asymmetry
            const rightFoldX = mouthCenterX + foldCurveX - mouthTilt;
            const rightFoldDist = Math.abs(xRatio - rightFoldX);

            if (rightFoldDist < 0.025) {
              const foldFalloff = Math.pow((0.025 - rightFoldDist) / 0.025, 1.2);
              const ageDepth = isOld ? 1.4 : (isYoung ? 0.4 : 0.9);
              const foldDepth = foldFalloff * 0.12 * ageDepth;

              if (rightFoldDist < 0.012) {
                faceColor = createShadow(faceColor, 1 - foldDepth);
              }
            }
          }

          // PERIORAL AREA - Around mouth modeling
          if (t > 0.68 && t < 0.73) {
            // Upper lip area shadow (mustache area)
            if (mouthDist < 0.15) {
              const upperLipShadow = Math.pow((0.15 - mouthDist) / 0.15, 1.5) * 0.06;
              faceColor = createShadow(faceColor, 1 - upperLipShadow);
            }

            // Oral commissures (mouth corners)
            if (mouthDist > 0.08 && mouthDist < 0.15 && t > 0.7) {
              const commissureDepth = isOld ? 0.12 : 0.08;
              faceColor = createShadow(faceColor, 1 - commissureDepth);
            }
          }

          // Modiolus area (where muscles converge at mouth corner)
          if (t > 0.69 && t < 0.73 && (Math.abs(xRatio - 0.35) < 0.04 || Math.abs(xRatio - 0.65) < 0.04)) {
            faceColor = createShadow(faceColor, 0.94);
          }
        }
        */

        /* REMOVED complex chin modeling
        if (t > 0.73) {
          const chinCenterX = 0.5;
          const chinDist = Math.abs(xRatio - chinCenterX);

          // MENTOLABIAL SULCUS (chin-lip crease) - More defined
          if (t > 0.73 && t < 0.78) {
            if (chinDist < 0.18) {
              const sulcusFalloff = Math.pow((0.18 - chinDist) / 0.18, 1.3);
              const sulcusDepth = sulcusFalloff * 0.1;
              faceColor = createShadow(faceColor, 1 - sulcusDepth);

              // Central deepening
              if (chinDist < 0.06) {
                faceColor = createShadow(faceColor, 0.94);
              }
            }
          }

          // CHIN BOSS (mental protuberance) - 3D chin volume with asymmetry
          if (t > 0.77 && t < 0.86) {
            // Central chin highlight (slightly off-center)
            const adjustedChinDist = Math.abs(xRatio - (chinCenterX + jawAsymmetry * 0.3));
            if (adjustedChinDist < 0.08) {
              const chinProminence = Math.pow((0.08 - adjustedChinDist) / 0.08, 1.8);
              const verticalFalloff = t < 0.82 ? 1.0 : Math.pow((0.86 - t) / 0.04, 0.7);
              faceColor = createHighlight(faceColor, 1 + chinProminence * 0.15 * verticalFalloff);

              // Chin cleft (dimple) if present
              if (jawline === 'square' && adjustedChinDist < 0.015 && t > 0.79 && t < 0.83) {
                faceColor = createShadow(faceColor, 0.92);
              }
            }

            // Lateral chin shadows (define chin width)
            if (chinDist > 0.06 && chinDist < 0.14) {
              const lateralShadow = (chinDist - 0.06) / 0.08;
              faceColor = createShadow(faceColor, 1 - lateralShadow * 0.08);
            }
          }

          // JAWLINE & MANDIBLE - Strong definition
          if (t > 0.76) {
            // Asymmetric jaw width
            const baseJawWidth = jawline === 'square' ? 0.42 :
                               jawline === 'angular' ? 0.38 :
                               jawline === 'soft' ? 0.35 : 0.37;
            const leftJawWidth = baseJawWidth + (jawAsymmetry > 0 ? 0.02 : 0);
            const rightJawWidth = baseJawWidth + (jawAsymmetry < 0 ? 0.02 : 0);

            // Jaw angle (gonial angle) shadows
            if (t > 0.78 && t < 0.85) {
              const jawAngleDist = Math.abs(xRatio - (0.5 - leftJawWidth/2));
              const jawAngleDistR = Math.abs(xRatio - (0.5 + rightJawWidth/2));

              // Left jaw angle
              if (jawAngleDist < 0.06) {
                const angleShadow = Math.pow((0.06 - jawAngleDist) / 0.06, 1.5);
                faceColor = createShadow(faceColor, 1 - angleShadow * 0.12);
              }

              // Right jaw angle (deeper)
              if (jawAngleDistR < 0.06) {
                const angleShadow = Math.pow((0.06 - jawAngleDistR) / 0.06, 1.5);
                faceColor = createShadow(faceColor, 1 - angleShadow * 0.15);
              }
            }

            // Mandibular body highlight (jaw edge catches light)
            if (t > 0.8 && t < 0.84 && chinDist > 0.15 && chinDist < 0.25) {
              const edgeHighlight = Math.pow((0.25 - chinDist) / 0.1, 2);
              faceColor = createHighlight(faceColor, 1 + edgeHighlight * 0.06);
            }

            // Under-jaw shadow (submental region)
            if (t > 0.85) {
              const submentalShadow = Math.pow((t - 0.85) / 0.15, 1.2);

              // Central under-chin is deepest
              if (chinDist < 0.2) {
                const centralDeepening = Math.pow((0.2 - chinDist) / 0.2, 1.5);
                faceColor = createShadow(faceColor, 1 - submentalShadow * 0.18 * (1 + centralDeepening * 0.3));
              } else {
                faceColor = createShadow(faceColor, 1 - submentalShadow * 0.12);
              }
            }
          }
        }
        */

        // === SIMPLE HEALTH EFFECTS ===

        // Fever flush on cheeks
        if (diseaseEffects.hasFever && diseaseEffects.severity >= 1) {
          if (t > 0.4 && t < 0.65) {
            const cheekCenterLeft = 0.3;
            const cheekCenterRight = 0.7;
            const leftCheekDist = Math.abs(xRatio - cheekCenterLeft);
            const rightCheekDist = Math.abs(xRatio - cheekCenterRight);

            if (leftCheekDist < 0.12 || rightCheekDist < 0.12) {
              const flushIntensity = diseaseEffects.severity >= 2 ? 0.15 : 0.1;
              // Add subtle reddish tint
              faceColor = createHighlight(faceColor, 1 + flushIntensity);
            }
          }
        }

        // Age spots and texture
        if (isOld) {
          if (rand(x * 200 + y * 2000) > 0.96) {
            faceColor = createShadow(faceColor, 0.85);
          }

          // Deeper nasolabial folds
          if (t > 0.5 && t < 0.75) {
            const leftFold = Math.abs(xRatio - 0.35);
            const rightFold = Math.abs(xRatio - 0.65);
            if (leftFold < 0.03 || rightFold < 0.03) {
              faceColor = createShadow(faceColor, 0.9);
            }
          }
        }

        // Strength-based facial structure
        if (stats.strength >= 8) {
          // More defined facial structure for strong characters
          if (t > 0.6 && (xRatio < 0.3 || xRatio > 0.7)) {
            faceColor = createShadow(faceColor, 0.95);
          }
        }

        // Health-based pallor
        const isIll = (character.health !== undefined && character.maxHealth !== undefined &&
                      (character.health / character.maxHealth) < 0.6) ||
                     (character.diseaseHealth?.currentDiseases && character.diseaseHealth.currentDiseases.length > 0);

        if (isIll && stats.constitution <= 4) {
          faceColor = createShadow(faceColor, 0.95);
        }

        // Simple subsurface scattering - don't overcomplicate

        // Draw the face pixel

        elements.push(
          <rect key={`face-${yi}-${x}`} x={x} y={y} width="1" height="1" fill={faceColor} className="pixel" />
        );
      }
    }

    return elements;
  }, [
    headX, headY, headDimWidth, headDimHeight, faceShape, jawline, cheekbones,
    skinTone, skinShadow, skinHighlight, skinMidtone, skinDeepShadow, skinBrightHighlight,
    skinSubsurface, actualSkinTone, isFemale, isOld, isYoung, stats, character,
    diseaseEffects, rand
  ]);

  return <g key="facial-modeling">{facialModelingElements}</g>;
};

export default FacialModelingRenderer;