/**
 * Headgear renderer for procedural portraits
 * Complete sophisticated headgear system with cultural variations and era-appropriate styles
 * Extracted from ProceduralPortrait.tsx - preserves all original sophistication
 */

import React, { useMemo } from 'react';
import { createShadow, createHighlight } from '../utils/colorUtils';
import { createRandFunction } from '../utils/portraitConstants';

interface HeadgearRendererProps {
  useEquippedItems: boolean;
  character: any;
  appearanceWithDefaults: any;
  headX: number;
  headY: number;
  headDim: { width: number; height: number };
  culturalZone: string;
  era: string;
  baseHair: string;
  isWealthy: boolean;
  isNoble: boolean;
  skinTone: string;
  seed: number;
}

export const HeadgearRenderer: React.FC<HeadgearRendererProps> = ({
  useEquippedItems,
  character,
  appearanceWithDefaults,
  headX,
  headY,
  headDim,
  culturalZone,
  era,
  baseHair,
  isWealthy,
  isNoble,
  skinTone,
  seed
}) => {
  const headgearElements = useMemo(() => {
    // Choose source (equipped vs appearance) without changing your prop contract
    let headItem: { name: string; material?: string; color?: string } | null = null;
    if (useEquippedItems && character.equippedItems !== undefined) {
      headItem = character.equippedItems.head ?? null;
    } else {
      headItem = appearanceWithDefaults.headgear ?? null;
    }

    if (!headItem || !headItem.name || headItem.name.toLowerCase() === 'none') {
      return [];
    }

    const elements: JSX.Element[] = [];
    const name = (headItem.name || '').toLowerCase();
    const material = (headItem.material || '').toLowerCase();

    const centerX = headX + Math.floor(headDim.width / 2);
    const topY = headY - 1;
    const rand = createRandFunction(seed);

    // Helpers
    const nameContains = (...keywords: string[]) => keywords.some(k => name.includes(k));

    const resolveHeadgearColor = (): string => {
      // First check if the equipped item has its own color
      if (headItem?.color) {
        // Handle both hex colors and color names
        if (headItem.color.startsWith('#')) {
          return headItem.color;
        }

        // Convert color names to hex
        const colorMap: Record<string, string> = {
          'Navy': '#001f3f',
          'Blue': '#4169e1',
          'Crimson': '#dc143c',
          'Green': '#228b22',
          'Gold': '#ffd700',
          'Purple': '#800080',
          'Black': '#1a1a1a',
          'White': '#f8f8f8',
          'Gray': '#808080',
          'Grey': '#808080',
          'Silver': '#c0c0c0',
          'Bronze': '#cd7f32',
          'Copper': '#b87333',
          'Brown': '#8b4513',
          'Tan': '#d2b48c',
          'Orange': '#ff8c00',
          'Pink': '#ffc0cb',
          'Red': '#dc143c',
          'Yellow': '#ffd700',
          'Burgundy': '#800020',
          'Forest Green': '#228b22',
          'Teal': '#008080',
          'Cyan': '#00ffff',
          'Turquoise': '#40e0d0',
          'Wheat': '#f5deb3',
          'Beige': '#f5f5dc'
        };

        const mappedColor = colorMap[headItem.color];
        if (mappedColor) return mappedColor;
      }

      // 1) explicit color tokens in the name OR material
      const tokens: Array<[string, string]> = [
        ['navy', '#000080'], ['crimson', '#DC143C'], ['scarlet', '#FF2400'], ['red', '#DC143C'],
        ['blue', '#4169E1'], ['azure', '#007FFF'], ['green', '#228B22'], ['emerald', '#50C878'],
        ['forest', '#0B6623'], ['gold', '#FFD700'], ['yellow', '#FFD700'], ['purple', '#800080'],
        ['violet', '#8B00FF'], ['indigo', '#4B0082'], ['pink', '#FFC0CB'], ['orange', '#FF8C00'],
        ['brown', '#8B4513'], ['tan', '#D2B48C'], ['black', '#1C1C1C'], ['white', '#F8F8F8'],
        ['gray', '#808080'], ['grey', '#808080'], ['silver', '#C0C0C0'], ['bronze', '#CD7F32'],
        ['brass', '#B5A642'], ['copper', '#B87333'], ['obsidian', '#0C0C0C'], ['ivory', '#FFFFF0'],
        ['pearl', '#FFF8DC'], ['jade', '#00A86B'], ['sapphire', '#0F52BA'], ['amethyst', '#9966CC'],
        ['ruby', '#E0115F'],
      ];
      // Check name first, then material (prioritize explicit color over material type)
      const nameToken = tokens.find(([t]) => name.includes(t));
      if (nameToken) return nameToken[1];

      const materialToken = tokens.find(([t]) => material.includes(t));
      if (materialToken) return materialToken[1];

      // 2) material defaults (only apply if no color keyword found)
      if (material.includes('leather')) return '#8B4513';
      if (material.includes('felt')) return '#6D6D75';
      if (material.includes('wool')) return '#A0A0A8';
      if (material.includes('linen') || material.includes('cotton')) return '#E8E2D1';
      if (material.includes('silk') || material.includes('velvet') || material.includes('satin')) return appearanceWithDefaults.palette.accent;
      if (material.includes('gold')) return '#FFD700';
      if (material.includes('bronze')) return '#CD7F32';
      if (material.includes('brass')) return '#B5A642';
      if (material.includes('iron') || material.includes('steel') || material.includes('mail') || material.includes('plate') || material.includes('metal')) return '#C0C0C0';
      if (material.includes('straw') || material.includes('bamboo') || material.includes('reed') || material.includes('sedge')) return '#D4A76A';

      // 3) fallback - use neutral brown instead of palette secondary
      return '#8B4513'; // Brown fallback instead of yellow palette secondary
    };

    const base = resolveHeadgearColor();
    const shade = createShadow(base, 0.82);
    const deep = createShadow(base, 0.65);
    const hl = createHighlight(base, 1.18);

    // ========= SHAPES =========

    // CROWNS / CIRCLETS / DIadems / WREATHS
    if (nameContains('crown', 'circlet', 'tiara', 'coronet', 'diadem', 'laurel')) {
      const isLaurel = name.includes('laurel');
      const gold = '#FFD700';
      const wreath = isLaurel ? '#3E8E41' : gold;

      // Band along the top of forehead
      for (let x = headX; x < headX + headDim.width; x++) {
        elements.push(
          <rect key={`crown-band-${x}`} x={x} y={headY - 2} width="1" height="2" fill={wreath} className="pixel" />
        );
        if (!isLaurel && ((x - headX) % 4 === 2) && (isNoble || nameContains('jeweled', 'gem', 'ruby', 'emerald', 'sapphire', 'pearl', 'diamond'))) {
          // small in-band jewels
          let jewel = '#DC143C';
          if (name.includes('emerald')) jewel = '#50C878';
          else if (name.includes('sapphire')) jewel = '#0F52BA';
          else if (name.includes('diamond')) jewel = '#E0FFFF';
          else if (name.includes('pearl')) jewel = '#FFF8DC';
          elements.push(<rect key={`crown-jewel-${x}`} x={x} y={headY - 1} width="1" height="1" fill={jewel} className="pixel" />);
        }
      }

      // Points (skip for circlet)
      if (!nameContains('circlet', 'wreath')) {
        const points = 5;
        for (let i = 0; i < points; i++) {
          const px = headX + 1 + Math.floor(i * ((headDim.width - 2) / (points - 1)));
          const ph = i === Math.floor(points / 2) ? 7 : i === 0 || i === points - 1 ? 4 : 5 + (i % 2);
          for (let h = 0; h < ph; h++) {
            elements.push(
              <rect key={`crown-pt-${i}-${h}`} x={px} y={headY - 3 - h} width="1" height="1" fill={createHighlight(gold, 1 - h * 0.03)} className="pixel" />
            );
          }
          // top jewel on middle point if fancy
          if (i === Math.floor(points / 2) && (isNoble || isWealthy)) {
            elements.push(<rect key="crown-top-j" x={px} y={headY - 3 - ph} width="1" height="1" fill="#0F52BA" className="pixel" />);
          }
        }
      }

      // Laurel leaves detail
      if (isLaurel) {
        for (let i = 0; i < headDim.width; i += 3) {
          const lx = headX + i;
          elements.push(
            <rect key={`leaf-${i}-a`} x={lx} y={headY - 3} width="2" height="1" fill={createHighlight('#2E7D32', 1.05)} className="pixel" />,
            <rect key={`leaf-${i}-b`} x={lx + 1} y={headY - 4} width="1" height="1" fill={'#2E7D32'} className="pixel" />
          );
        }
      }
    }

    // TURBANS / PAGRI / SAFA - IMPROVED: Larger, more realistic with wrapped cloth texture
    else if (nameContains('turban', 'pagri', 'safa', 'peta')) {
      const turbanBase = base || '#F5F5DC';
      const turbanLight = createHighlight(turbanBase, 1.25);
      const turbanShade = createShadow(turbanBase, 0.8);
      const turbanDeep = createShadow(turbanBase, 0.65);
      const turbanDarkest = createShadow(turbanBase, 0.5);

      // MUCH larger turban - increased from 10 to 16 rows height
      const turbanHeight = 16;
      const turbanTopY = headY - 14; // Start higher up

      // Main turban body with large, prominent bulbous shape
      for (let y = 0; y < turbanHeight; y++) {
        const yPos = turbanTopY + y;

        // Calculate width for much larger, more impressive shape
        let width;
        const yProgress = y / turbanHeight;
        if (yProgress < 0.25) {
          // Top dome - gradually widening, starting narrow
          width = headDim.width + Math.floor(y * 1.2);
        } else if (yProgress < 0.65) {
          // Fullest middle section - MUCH wider
          width = headDim.width + 10;
        } else {
          // Gradual taper at bottom where it wraps around head
          const taperAmount = Math.floor((yProgress - 0.65) * 8);
          width = headDim.width + 10 - taperAmount;
        }

        const startX = centerX - Math.floor(width / 2);

        for (let x = 0; x < width; x++) {
          // Skip extreme corners for rounded look
          if ((y === 0 || y === turbanHeight - 1) && (x === 0 || x === width - 1)) continue;
          if (y === 0 && (x === 1 || x === width - 2)) continue; // Extra corner softening

          const xPos = startX + x;
          const xProgress = x / width;

          // Realistic wrapped cloth shading and texture
          let pixelColor = turbanBase;

          // Create visible horizontal wrap layers (cloth wraps)
          const wrapLayer = Math.floor(y / 3); // Each wrap is ~3 pixels tall
          const posInWrap = y % 3;

          // Base color varies by wrap layer for depth
          if (wrapLayer % 2 === 0) {
            pixelColor = turbanBase;
          } else {
            pixelColor = createShadow(turbanBase, 0.95);
          }

          // Shadows between wraps (seams)
          if (posInWrap === 2) {
            pixelColor = createShadow(pixelColor, 0.88);
          }

          // Strong side shading for 3D roundness
          if (xProgress < 0.12) {
            pixelColor = turbanDarkest;
          } else if (xProgress < 0.22) {
            pixelColor = turbanDeep;
          } else if (xProgress < 0.35) {
            pixelColor = turbanShade;
          }
          // Right side shadow (opposite light source)
          else if (xProgress > 0.88) {
            pixelColor = turbanDarkest;
          } else if (xProgress > 0.78) {
            pixelColor = turbanDeep;
          }
          // Center-left highlight for light catching on rounded surface
          else if (xProgress > 0.4 && xProgress < 0.55 && y < turbanHeight - 3) {
            pixelColor = turbanLight;
          }
          // Secondary highlight
          else if (xProgress > 0.38 && xProgress < 0.42 && y > 2 && y < turbanHeight - 4) {
            pixelColor = createHighlight(turbanBase, 1.15);
          }

          // Subtle fabric texture
          if ((x * 5 + y * 3) % 11 === 0) {
            pixelColor = createHighlight(pixelColor, 1.05);
          } else if ((x * 7 + y * 5) % 13 === 0) {
            pixelColor = createShadow(pixelColor, 0.97);
          }

          // Bottom shadow to show turban sits on head
          if (y >= turbanHeight - 2) {
            pixelColor = createShadow(pixelColor, 0.82);
          }

          elements.push(<rect key={`turban-${x}-${y}`} x={xPos} y={yPos} width="1" height="1" fill={pixelColor} className="pixel" />);
        }
      }

      // Simple central fold/peak for Sikh-style turbans
      if (nameContains('sikh', 'pagri')) {
        const peakY = turbanTopY + 1;
        // Small triangular peak
        for (let i = 0; i < 3; i++) {
          const w = 4 - i;
          const px = centerX - Math.floor(w / 2);
          for (let j = 0; j < w; j++) {
            elements.push(<rect key={`peak-${i}-${j}`} x={px + j} y={peakY - i} width="1" height="1" fill={turbanHighlight} className="pixel" />);
          }
        }
      }

      // Ornamental elements for wealthy turbans
      if (isWealthy) {
        // Simple jeweled ornament (kalgi)
        const ornamentY = turbanTopY + 3;

        // Central jewel
        const jewelColor = rand(295) > 0.5 ? '#DC143C' : '#50C878';
        elements.push(
          // Gold setting
          <rect key="ornament-base" x={centerX - 1} y={ornamentY} width="3" height="3" fill="#FFD700" className="pixel" />,
          // Jewel
          <rect key="ornament-jewel" x={centerX} y={ornamentY + 1} width="1" height="1" fill={jewelColor} className="pixel" />,
          // Highlight
          <rect key="ornament-shine" x={centerX} y={ornamentY} width="1" height="1" fill="#FFFFFF" opacity={0.6} className="pixel" />
        );

        // Simple feather plume (3-4 pixels)
        if (isNoble) {
          for (let i = 0; i < 4; i++) {
            const plumeColor = i % 2 === 0 ? '#FF6B6B' : '#4ECDC4';
            elements.push(<rect key={`plume-${i}`} x={centerX + 2} y={ornamentY - 2 + i} width="2" height="1" fill={plumeColor} className="pixel" />);
          }
        }
      }
    }

    // COIF & MEDIEVAL FITTED CAPS (coif, biggins, topi, zukin)
    else if (nameContains('coif', 'biggins', 'topi', 'zukin')) {
      // Use two colors for depth and texture
      const coifColor = material.includes('white') || material.includes('linen') ? '#F5F5DC' : base;
      const coifShade = createShadow(coifColor, 0.75);
      const coifDeepShade = createShadow(coifColor, 0.6);
      const coifHighlight = createHighlight(coifColor, 1.15);
      const coifBrightHighlight = createHighlight(coifColor, 1.25);

      // Create a properly rounded bonnet shape with depth
      // Top dome of the coif - rounded like a real bonnet
      for (let y = headY - 5; y <= headY + headDim.height - 3; y++) {
        const yFromTop = y - (headY - 5);
        const yFromBottom = (headY + headDim.height - 3) - y;
        const yNorm = yFromTop / (headDim.height + 2);

        // Calculate width based on dome curvature
        let width;
        if (y < headY) {
          // Top dome - narrows towards top
          const domeProgress = (y - (headY - 5)) / 5;
          width = Math.floor(headDim.width * (0.6 + domeProgress * 0.5));
        } else if (y < headY + 8) {
          // Main bonnet area - full width plus padding
          width = headDim.width + 6;
        } else {
          // Lower area - tapers slightly
          const taperProgress = (y - (headY + 8)) / (headDim.height - 11);
          width = headDim.width + 6 - Math.floor(taperProgress * 3);
        }

        const startX = centerX - Math.floor(width / 2);

        for (let x = 0; x < width; x++) {
          const xPos = startX + x;
          const xNorm = x / width;

          // Skip center area for face opening
          if (y >= headY + 4 && y < headY + headDim.height - 4) {
            const faceOpeningLeft = 4;
            const faceOpeningRight = width - 4;
            if (x > faceOpeningLeft && x < faceOpeningRight) continue;
          }

          // Calculate shading for rounded 3D effect
          let color = coifColor;

          // Top highlight for dome
          if (y < headY && xNorm > 0.3 && xNorm < 0.7) {
            color = coifBrightHighlight;
          }
          // Edge shadows for depth
          else if (x === 0 || x === width - 1) {
            color = coifDeepShade;
          }
          // Side shadows
          else if (x === 1 || x === width - 2) {
            color = coifShade;
          }
          // Top edge shadow
          else if (y === headY - 5) {
            color = coifShade;
          }
          // Center-top highlight strip
          else if (y < headY + 2 && Math.abs(xNorm - 0.5) < 0.15) {
            color = coifHighlight;
          }
          // Side panel shading
          else if (xNorm < 0.2) {
            color = coifShade;
          }
          else if (xNorm > 0.8) {
            color = coifDeepShade;
          }

          // Add texture variation
          const textureNoise = (x * 7 + y * 13) % 17;
          if (textureNoise === 0 && color === coifColor) {
            color = coifHighlight;
          } else if (textureNoise === 8 && color === coifColor) {
            color = coifShade;
          }

          elements.push(<rect key={`coif-${x}-${y}`} x={xPos} y={y} width="1" height="1" fill={color} className="pixel" />);
        }
      }

      // Add subtle chin tie/string
      if (!nameContains('biggins')) {  // Biggins don't have ties
        const chinY = headY + headDim.height - 2;
        elements.push(
          <rect key={`coif-tie-l`} x={headX + 2} y={chinY} width="1" height="1" fill={coifDeepShade} className="pixel" />,
          <rect key={`coif-tie-r`} x={headX + headDim.width - 3} y={chinY} width="1" height="1" fill={coifDeepShade} className="pixel" />
        );
      }
    }
    
    // VEILS / HIJAB / WRAPS / SCARF - Simplified and elegant
    else if (nameContains('veil', 'hijab', 'keffiyeh', 'dupatta', 'gele', 'mantilla', 'ghoonghat',
                          'head wrap', 'headwrap', 'scarf', 'bonnet', 'tichel')) {
      const fullCover = nameContains('hijab', 'dupatta', 'mantilla', 'ghoonghat');
      const isHeadWrap = nameContains('head wrap', 'headwrap', 'gele');
      const isKeffiyeh = nameContains('keffiyeh');
      const depth = fullCover ? 12 : 8;

      const wrapBase = base || '#F5F5F5';
      const wrapVeryLight = createHighlight(wrapBase, 1.25);
      const wrapLight = createHighlight(wrapBase, 1.15);
      const wrapShade = createShadow(wrapBase, 0.82);
      const wrapDeep = createShadow(wrapBase, 0.65);
      const wrapDarkest = createShadow(wrapBase, 0.5);
      const accentColor = appearanceWithDefaults.palette.accent || createHighlight(wrapBase, 1.3);

      if (isHeadWrap) {
        // IMPROVED HEAD WRAP: Realistic wrapped fabric with layers, draping, and texture

        // Define wrap layers (horizontal bands wrapping around head)
        const wrapLayers = [
          { startY: headY - 5, height: 3, offset: 0 },     // Top layer
          { startY: headY - 3, height: 3, offset: 1 },     // Middle layer (offset for overlap)
          { startY: headY - 1, height: 4, offset: 0 },     // Bottom layer
          { startY: headY + 2, height: 3, offset: -1 },    // Side draping layer
        ];

        for (const layer of wrapLayers) {
          for (let ly = 0; ly < layer.height; ly++) {
            const y = layer.startY + ly;
            const yInLayer = ly / layer.height;

            // Width varies by layer and height within layer for rounded wrapping effect
            const baseWidth = headDim.width + 8;
            const layerTaper = Math.sin(yInLayer * Math.PI) * 2; // Bulge in middle
            const width = Math.floor(baseWidth + layerTaper + layer.offset);
            const startX = centerX - Math.floor(width / 2);

            for (let lx = 0; lx < width; lx++) {
              const x = startX + lx;
              const xNorm = lx / width;
              const dx = x - centerX;

              // Skip face area (oval cutout)
              const faceOpenX = Math.abs(dx) < headDim.width / 2 - 2;
              const faceOpenY = y > headY + 1 && y < headY + headDim.height - 3;
              if (faceOpenX && faceOpenY) continue;

              // Start with base shading based on position
              let wrapColor;
              if (xNorm < 0.08) {
                wrapColor = wrapDarkest;
              } else if (xNorm < 0.15) {
                wrapColor = wrapDeep;
              } else if (xNorm < 0.25) {
                wrapColor = wrapShade;
              } else if (xNorm > 0.92) {
                wrapColor = wrapDarkest;
              } else if (xNorm > 0.85) {
                wrapColor = wrapDeep;
              } else if (xNorm > 0.75) {
                wrapColor = wrapShade;
              } else if (xNorm > 0.42 && xNorm < 0.58) {
                wrapColor = wrapLight; // Center highlight
              } else {
                wrapColor = wrapBase;
              }

              // Woven fabric texture
              const weaveX = lx % 4;
              const weaveY = ly % 4;
              if ((weaveX + weaveY) % 4 === 0) {
                wrapColor = createHighlight(wrapColor, 1.1);
              } else if ((weaveX + weaveY) % 4 === 2) {
                wrapColor = createShadow(wrapColor, 0.9);
              }

              // Decorative pattern (stripes or geometric)
              if (ly === 1 || ly === layer.height - 2) {
                // Accent stripe along layer edges
                if (lx % 3 === 0) {
                  wrapColor = createShadow(accentColor, 0.9);
                }
              }
              // Scattered geometric pattern
              if ((lx + ly * 3) % 7 === 0) {
                wrapColor = createHighlight(accentColor, 1.15);
              }

              // Layer shadows (bottom edge of each wrap is darker)
              if (ly === layer.height - 1) {
                wrapColor = createShadow(wrapColor, 0.75);
              } else if (ly === 0) {
                // Top edge slightly lighter
                wrapColor = createHighlight(wrapColor, 1.08);
              }

              // Draping folds (vertical shadows for fabric gathering)
              const foldPattern = Math.abs(dx) % 6;
              if (foldPattern === 0 || foldPattern === 5) {
                wrapColor = createShadow(wrapColor, 0.88);
              }

              elements.push(<rect key={`wrap-${layer.startY}-${ly}-${lx}`} x={x} y={y} width="1" height="1" fill={wrapColor} className="pixel" />);
            }
          }
        }

        // Prominent side knot with draping tails
        const knotX = centerX + Math.floor(headDim.width / 2) + 2;
        const knotY = headY - 1;

        // Knot body (larger, more detailed)
        for (let ky = 0; ky < 4; ky++) {
          for (let kx = 0; kx < 4; kx++) {
            const dist = Math.abs(kx - 2) + Math.abs(ky - 2);
            if (dist < 4) {
              let knotColor = wrapBase;
              if (dist === 0) {
                knotColor = wrapVeryLight; // Center highlight
              } else if (dist === 1) {
                knotColor = wrapLight;
              } else if (dist === 3) {
                knotColor = wrapShade;
              }
              elements.push(<rect key={`knot-${ky}-${kx}`} x={knotX + kx} y={knotY + ky} width="1" height="1" fill={knotColor} className="pixel" />);
            }
          }
        }

        // Draping tails from knot
        for (let t = 0; t < 3; t++) {
          elements.push(
            <rect key={`tail1-${t}`} x={knotX + 2} y={knotY + 4 + t} width="2" height="1" fill={createShadow(wrapBase, 0.85 - t * 0.05)} className="pixel" />,
            <rect key={`tail2-${t}`} x={knotX + 1} y={knotY + 4 + t} width="1" height="1" fill={createShadow(wrapBase, 0.75 - t * 0.05)} className="pixel" />
          );
        }

      } else {
        // Keep original code for other veil types (hijab, keffiyeh, etc.)
        const veilColor = wrapBase;
        const veilShade = wrapShade;
        const veilDeep = wrapDeep;
        const veilHighlight = wrapLight;

        for (let y = headY - 6; y < headY + depth; y++) {
          const yFromTop = y - (headY - 6);

          for (let x = headX - 6; x < headX + headDim.width + 6; x++) {
            const dx = x - centerX;
            const dy = y - headY;

            const distFromCenter = Math.sqrt(dx * dx + dy * dy * 0.8);

            const faceOpenX = Math.abs(dx) < headDim.width / 2 - 1;
            const faceOpenY = y > headY + 1 && y < headY + headDim.height - 3;
            const isFaceArea = faceOpenX && faceOpenY;

            const maxRadius = headDim.width / 2 + 4;
            if (distFromCenter <= maxRadius && !isFaceArea) {
              const xNorm = (x - (headX - 6)) / (headDim.width + 12);

              let pixelColor = veilColor;

              if (xNorm < 0.2) {
                pixelColor = veilShade;
              } else if (xNorm > 0.8) {
                pixelColor = veilDeep;
              } else if (yFromTop < 3 && Math.abs(xNorm - 0.5) < 0.2) {
                pixelColor = veilHighlight;
              }

              if (isKeffiyeh) {
                const check = (Math.floor(x / 3) + Math.floor(y / 3)) % 2;
                if (check === 1) {
                  pixelColor = createShadow(pixelColor, 0.7);
                }
              } else if (fullCover) {
                if ((x * 2 + y) % 7 === 0) {
                  pixelColor = createShadow(pixelColor, 0.97);
                }
              }

              if (Math.abs(dx) % 8 === 0 && y > headY) {
                pixelColor = createShadow(pixelColor, 0.93);
              }

              elements.push(<rect key={`veil-${x}-${y}`} x={x} y={y} width="1" height="1" fill={pixelColor} className="pixel" />);
            }
          }
        }

        if (fullCover && isWealthy) {
          const pinY = headY + 2;
          elements.push(
            <rect key="hijab-pin" x={centerX - 5} y={pinY} width="2" height="2" fill="#FFD700" className="pixel" />,
            <rect key="hijab-pin-shine" x={centerX - 5} y={pinY} width="1" height="1" fill="#FFFFFF" opacity={0.6} className="pixel" />
          );
        }
      }
    }

    // HOODS / WIMPLE
    else if (nameContains('hood', 'wimple')) {
      const hoodDepth = name.includes('wimple') ? 12 : 10;
      for (let y = headY - 6; y < headY + hoodDepth; y++) {
        for (let x = headX - 6; x < headX + headDim.width + 6; x++) {
          const dx = Math.abs(x - centerX);
          const dTop = y - (headY - 6);
          const hoodW = headDim.width / 2 + 2 + Math.min(4, dTop * 0.3);
          const faceOpen = y > headY && y < headY + headDim.height - 2 && dx < headDim.width / 2 - 1;
          if (!faceOpen && dx < hoodW) {
            const depthFromEdge = hoodW - dx;
            const isDeep = depthFromEdge < 2 || y < headY - 2;
            const isMid = depthFromEdge < 4 || dTop < 3;
            let col = base;
            if (isDeep) col = deep;
            else if (isMid) col = shade;
            // inner rim
            if (dx > hoodW - 2 && y > headY - 2) col = createShadow(base, 0.6);
            elements.push(<rect key={`hood-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }
      // subtle golden trim for wealthy
      if (isWealthy) {
        for (let y = headY + 2; y < headY + headDim.height - 2; y++) {
          elements.push(
            <rect key={`hood-trim-l-${y}`} x={headX - 3} y={y} width="1" height="1" fill="#FFD700" className="pixel" />,
            <rect key={`hood-trim-r-${y}`} x={headX + headDim.width + 2} y={y} width="1" height="1" fill="#FFD700" className="pixel" />
          );
        }
      }
    }

    // MODERN HELMETS (pith helmet, army helmet)
    else if (name.includes('pith helmet') || name.includes('army helmet') || name.includes('combat helmet') || name.includes('military helmet')) {
      const isPith = name.includes('pith');
      const helmetColor = isPith ? '#F5DEB3' : '#4A5F3E'; // Tan/khaki for pith, olive drab for army
      const helmetHighlight = createHighlight(helmetColor, 1.2);
      const helmetShadow = createShadow(helmetColor, 0.8);

      // Dome-shaped crown that sits on top of head, not covering face
      const helmetTop = headY - 6;
      const helmetBottom = headY + 4;  // Stop at forehead level, not covering face

      for (let y = helmetTop; y < helmetBottom; y++) {
        const yFromTop = y - helmetTop;
        // Calculate dome width based on height
        let width;
        if (yFromTop < 3) {
          // Rounded top - narrower
          width = headDim.width - (3 - yFromTop) * 3;
        } else if (yFromTop < 7) {
          // Full width middle section
          width = headDim.width + 4;
        } else {
          // Bottom edge - full width
          width = headDim.width + 4;
        }

        // Don't render if width is too small or negative
        if (width <= 0) continue;

        const startX = centerX - Math.floor(width / 2);
        for (let x = 0; x < width; x++) {
          let col = helmetColor;
          // Add highlight on top center
          if (yFromTop < 3 && Math.abs(x - width/2) < 2) {
            col = helmetHighlight;
          }
          // Shadow on sides
          else if (x < 1 || x >= width - 1) {
            col = helmetShadow;
          }
          elements.push(<rect key={`modern-helm-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={col} className="pixel" />);
        }
      }

      // Brim for pith helmet
      if (isPith) {
        // Pith helmets have a distinctive all-around brim
        for (let brimY = 0; brimY < 2; brimY++) {
          for (let x = headX - 5; x < headX + headDim.width + 5; x++) {
            const dx = Math.abs(x - centerX);
            // Skip center on second row for depth
            if (brimY === 1 && dx < headDim.width / 2 - 1) continue;
            elements.push(<rect key={`pith-brim-${x}-${brimY}`} x={x} y={headY + 1 + brimY} width="1" height="1" fill={helmetShadow} className="pixel" />);
          }
        }
        // Ventilation holes (characteristic of pith helmets)
        for (let v = 0; v < 3; v++) {
          elements.push(<rect key={`vent-${v}`} x={centerX - 4 + v * 4} y={headY - 2} width="1" height="1" fill={helmetShadow} className="pixel" />);
        }
      } else {
        // Army helmet - shorter brim, only front
        for (let x = headX - 2; x < headX + headDim.width + 2; x++) {
          elements.push(<rect key={`army-brim-${x}`} x={x} y={headY + 1} width="1" height="1" fill={helmetShadow} className="pixel" />);
        }
        // Chin strap indication
        elements.push(
          <rect key="chin-strap-l" x={headX} y={headY + headDim.height - 5} width="1" height="3" fill={helmetShadow} className="pixel" />,
          <rect key="chin-strap-r" x={headX + headDim.width - 1} y={headY + headDim.height - 5} width="1" height="3" fill={helmetShadow} className="pixel" />
        );
      }
    }
    // MEDIEVAL HELMETS (metallic)
    else if (nameContains('helmet', 'helm', 'spangenhelm', 'salet', 'sallet', 'great helm', 'norman', 'knight')) {
      const metal =
        material.includes('bronze') ? '#CD7F32' :
        material.includes('brass') ? '#B5A642' :
        '#AEB4B8';

      // Shell
      for (let y = headY - 3; y < headY + headDim.height - 3; y++) {
        for (let x = headX - 2; x < headX + headDim.width + 2; x++) {
          const dx = Math.abs(x - centerX);
          const faceOpen = y > headY + 2 && y < headY + headDim.height - 4 && dx < headDim.width / 2 - 3;
          if (!faceOpen) {
            const edge = dx < 2 || x === headX - 2 || x === headX + headDim.width + 1;
            const col = edge ? createHighlight(metal, 1.22) : metal;
            elements.push(<rect key={`helm-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }

      // Nose guard for Norman/knight
      if (nameContains('norman', 'knight', 'nasal')) {
        for (let y = headY + 2; y < headY + 10; y++) {
          elements.push(<rect key={`nasal-${y}`} x={centerX} y={y} width="2" height="1" fill={createShadow(metal, 0.9)} className="pixel" />);
        }
      }

      // Crest/plume for nobles
      if (isNoble) {
        for (let p = 0; p < 10; p++) {
          elements.push(<rect key={`plume-${p}`} x={centerX + Math.sin(p * 0.3) * 2} y={headY - 5 - p} width="2" height="1" fill={p % 2 === 0 ? '#DC143C' : '#8B0000'} className="pixel" />);
        }
      }
    }

    // HATS & CAPS (various styles including flat caps)
    else if (nameContains('cap', 'beret', 'fez', 'kufi', 'fedora', 'homburg', 'chullo', 'beanie',
                          'tuque', 'snapback', 'petasos', 'chaperon', 'flat cap',
                          'cheese-cutter', 'gandhi cap', 'kofia', 'mao cap', 'futou',
                          'hardhat', 'hard hat', 'construction helmet', 'surgical cap', 'surgical', 'visor', 'sun visor',
                          'coonskin', 'fur cap', 'police cap', 'fur hat', 'merchant cap', 'wool cap')) {
      const hatStyle =
        (nameContains('coonskin')) ? 'coonskin' :
        (nameContains('police cap', 'police')) ? 'police' :
        (nameContains('fur cap', 'fur hat')) ? 'fur' :
        (nameContains('merchant cap')) ? 'merchant' :
        (nameContains('wool cap')) ? 'wool' :
        (nameContains('hardhat', 'hard hat', 'construction helmet')) ? 'hardhat' :
        (nameContains('surgical cap', 'surgical')) ? 'surgical' :
        (nameContains('visor', 'sun visor')) && !name.includes('cap') ? 'visor' :
        (name.includes('baseball') || name.includes('snapback')) ? 'baseball' :
        name.includes('top') ? 'top' :
        name.includes('beret') ? 'beret' :
        (name.includes('fez') || name.includes('kufi')) ? 'fez' :
        (nameContains('fedora', 'homburg', 'petasos')) ? 'brimmed' :
        (nameContains('chullo', 'beanie', 'tuque')) ? 'knit' :
        'generic';

      switch (hatStyle) {
        case 'top': {
          // Tall crown - much taller and wider to cover hair
          for (let y = headY - 12; y < headY + 1; y++) {
            for (let x = headX - 1; x < headX + headDim.width + 1; x++) {
              elements.push(<rect key={`tophat-${x}-${y}`} x={x} y={y} width="1" height="1" fill="#000000" className="pixel" />);
            }
          }
          // Wide brim
          for (let x = headX - 6; x < headX + headDim.width + 6; x++) {
            elements.push(<rect key={`tophat-brim-${x}`} x={x} y={headY} width="1" height="3" fill="#000000" className="pixel" />);
          }
          // Band around middle
          if (isWealthy) {
            for (let x = headX - 1; x < headX + headDim.width + 1; x++) {
              elements.push(<rect key={`tophat-band-${x}`} x={x} y={headY - 4} width="1" height="2" fill={appearanceWithDefaults.palette.accent} className="pixel" />);
            }
          }
          break;
        }
        case 'beret': {
          // Beret with proper slouchy shape that covers hair
          const beretRadius = Math.floor(headDim.width * 0.75);
          for (let y = headY - 6; y < headY + 3; y++) {
            const yOffset = y - (headY - 2);
            const width = Math.round(beretRadius * Math.sqrt(Math.max(0, 1 - Math.pow(yOffset / 6, 2))) * 2.2);
            if (width > 0) {
              const startX = centerX - Math.floor(width / 2) + (y > headY ? 2 : 0); // slight tilt
              for (let x = 0; x < width; x++) {
                elements.push(<rect key={`beret-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={base} className="pixel" />);
              }
            }
          }
          // Small stem on top
          elements.push(<rect key="beret-stem" x={centerX + 2} y={headY - 7} width="2" height="2" fill={shade} className="pixel" />);
          break;
        }
        case 'fez': {
          // Cylindrical fez that fully covers head
          const fezColor = name.includes('red') || name.includes('fez') ? '#8B0000' : base;
          for (let y = headY - 8; y < headY + 2; y++) {
            const taper = Math.max(0, (headY - 4 - y) / 4); // slight taper at top
            const width = headDim.width + 2 - Math.floor(taper * 2);
            const startX = centerX - Math.floor(width / 2);
            for (let x = 0; x < width; x++) {
              elements.push(<rect key={`fez-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={fezColor} className="pixel" />);
            }
          }
          // Tassel hanging from top
          for (let t = 0; t < 5; t++) {
            const tasselX = centerX + Math.floor(Math.sin(t * 0.5));
            elements.push(<rect key={`fez-tassel-${t}`} x={tasselX} y={headY - 8 - t} width="1" height="1" fill="#000000" className="pixel" />);
          }
          break;
        }
        case 'brimmed': {
          // IMPROVED Fedora/Panama with realistic felt texture, center crease, and proper shading
          const fedoraBase = base || '#3B3B3B';
          const fedoraVeryLight = createHighlight(fedoraBase, 1.25);
          const fedoraLight = createHighlight(fedoraBase, 1.15);
          const fedoraShade = createShadow(fedoraBase, 0.82);
          const fedoraDeep = createShadow(fedoraBase, 0.68);
          const fedoraDarkest = createShadow(fedoraBase, 0.55);

          // Crown with center crease (8 rows tall)
          for (let y = 0; y < 8; y++) {
            const rowY = headY - 7 + y;
            const crownWidth = headDim.width + 4;
            const startX = centerX - Math.floor(crownWidth / 2);
            const yNorm = y / 8;

            for (let x = 0; x < crownWidth; x++) {
              const xNorm = x / crownWidth;
              const xPos = startX + x;
              const distFromCenter = Math.abs(xPos - centerX);

              // Base shading - strong 3D roundness
              let crownColor;
              if (xNorm < 0.08) {
                crownColor = fedoraDarkest;
              } else if (xNorm < 0.15) {
                crownColor = fedoraDeep;
              } else if (xNorm < 0.25) {
                crownColor = fedoraShade;
              } else if (xNorm > 0.92) {
                crownColor = fedoraDarkest;
              } else if (xNorm > 0.85) {
                crownColor = fedoraDeep;
              } else if (xNorm > 0.75) {
                crownColor = fedoraShade;
              } else {
                crownColor = fedoraBase;
              }

              // Center crease (iconic fedora feature)
              if (distFromCenter < 2 && y < 6) {
                crownColor = createShadow(crownColor, 0.75); // Dark crease line
              } else if (distFromCenter === 2 && y < 6) {
                crownColor = createHighlight(crownColor, 1.1); // Raised edge of crease
              }

              // Front pinch (two indents on sides)
              const pinchDist = Math.abs(distFromCenter - 4);
              if (pinchDist < 2 && y < 4 && y > 1) {
                crownColor = createShadow(crownColor, 0.85); // Pinch indents
              }

              // Top highlight (light hits top of crown)
              if (yNorm < 0.25 && xNorm > 0.3 && xNorm < 0.7) {
                crownColor = createHighlight(crownColor, 1.12);
              }

              // Felt texture (subtle)
              if ((x * 5 + y * 7) % 11 === 0) {
                crownColor = createHighlight(crownColor, 1.05);
              } else if ((x * 7 + y * 5) % 13 === 0) {
                crownColor = createShadow(crownColor, 0.97);
              }

              // Bottom shadow (where crown meets brim)
              if (y >= 7) {
                crownColor = createShadow(crownColor, 0.85);
              }

              elements.push(<rect key={`fed-crown-${y}-${x}`} x={xPos} y={rowY} width="1" height="1" fill={crownColor} className="pixel" />);
            }
          }

          // Wide brim (3 rows for better depth)
          for (let y = 0; y < 3; y++) {
            const brimWidth = headDim.width + 10 - y; // Tapers slightly
            const brimX = centerX - Math.floor(brimWidth / 2);
            const brimY = headY + y;

            for (let x = 0; x < brimWidth; x++) {
              const xNorm = x / brimWidth;
              const xPos = brimX + x;

              // Brim shading - top lighter, bottom darker
              let brimColor = fedoraShade;

              if (y === 0) {
                // Top of brim - catches light
                brimColor = fedoraBase;
                if (xNorm > 0.4 && xNorm < 0.6) {
                  brimColor = fedoraLight; // Center highlight
                }
              } else if (y === 2) {
                // Bottom of brim - dark shadow
                brimColor = fedoraDarkest;
              }

              // Edge curl darkening
              if (xNorm < 0.1 || xNorm > 0.9) {
                brimColor = createShadow(brimColor, 0.82);
              }

              // Skip center on bottom rows for depth effect
              if (y >= 1 && Math.abs(xPos - centerX) < headDim.width / 2 - 2) continue;

              // Felt texture on brim
              if ((x * 3 + y * 5) % 9 === 0) {
                brimColor = createShadow(brimColor, 0.95);
              }

              elements.push(<rect key={`fed-brim-${y}-${x}`} x={xPos} y={brimY} width="1" height="1" fill={brimColor} className="pixel" />);
            }
          }

          // Hat band (ribbon around base of crown)
          const bandColor = deep || '#000000';
          const bandHighlight = createHighlight(bandColor, 1.15);
          const bandWidth = headDim.width + 4;
          const bandX = centerX - Math.floor(bandWidth / 2);

          for (let x = 0; x < bandWidth; x++) {
            const xNorm = x / bandWidth;
            let bandPixelColor = bandColor;

            // Band texture/shine
            if (xNorm > 0.35 && xNorm < 0.65) {
              bandPixelColor = bandHighlight; // Ribbon sheen
            }

            // Subtle pattern on band
            if (x % 3 === 0) {
              bandPixelColor = createShadow(bandPixelColor, 0.92);
            }

            elements.push(<rect key={`fed-band-${x}`} x={bandX + x} y={headY - 1} width="1" height="1" fill={bandPixelColor} className="pixel" />);
          }

          // Small feather detail (optional, adds character)
          if (isWealthy || rand(100) > 0.6) {
            const featherX = centerX - Math.floor(headDim.width / 2) - 2;
            const featherY = headY - 3;
            elements.push(
              <rect key="fed-feather-1" x={featherX} y={featherY} width="1" height="3" fill="#228B22" className="pixel" />,
              <rect key="fed-feather-2" x={featherX - 1} y={featherY + 1} width="1" height="2" fill="#32CD32" className="pixel" />
            );
          }

          break;
        }
        case 'knit': {
          // Enhanced knit cap with realistic knit patterns and texture
          const isBeanie = name.includes('beanie');
          const isTuque = name.includes('tuque');
          const isChullo = name.includes('chullo');

          for (let y = headY - 8; y < headY + 3; y++) {
            const yFromTop = y - (headY - 8);
            // Rounded top
            let width = headDim.width + 4;
            if (yFromTop < 3) {
              width = headDim.width + 4 - (3 - yFromTop) * 2;
            }
            const startX = centerX - Math.floor(width / 2);

            for (let x = 0; x < width; x++) {
              let knitColor = base;

              // Enhanced knit texture patterns
              const knitRow = Math.floor(y / 2);
              const knitStitch = Math.floor(x / 2);

              // Create realistic knit stitch pattern
              if (isChullo) {
                // Andean geometric patterns
                const pattern = ((knitRow % 4) * 4 + (knitStitch % 4));
                if (pattern === 0 || pattern === 5 || pattern === 10 || pattern === 15) {
                  knitColor = createHighlight(base, 1.4); // Bright pattern
                } else if (pattern === 2 || pattern === 7 || pattern === 8 || pattern === 13) {
                  knitColor = createShadow(base, 0.6); // Dark pattern
                }
              } else {
                // Standard knit texture
                if ((knitRow + knitStitch) % 2 === 0) {
                  knitColor = base; // Base knit color
                } else {
                  knitColor = createShadow(base, 0.85); // Shadow between stitches
                }

                // Add cable knit pattern for beanies
                if (isBeanie && Math.abs(x - width / 2) < 4) {
                  if ((knitRow % 6 < 3 && Math.abs(x - width / 2) < 2) ||
                      (knitRow % 6 >= 3 && Math.abs(x - width / 2) >= 2 && Math.abs(x - width / 2) < 4)) {
                    knitColor = createHighlight(base, 1.15); // Raised cable
                  }
                }
              }

              // Add ribbing texture at the bottom
              if (y >= headY - 1) {
                if (x % 4 < 2) {
                  knitColor = createShadow(knitColor, 0.9); // Ribbing valleys
                } else {
                  knitColor = createHighlight(knitColor, 1.1); // Ribbing ridges
                }
              }

              elements.push(<rect key={`knit-${startX + x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={knitColor} className="pixel" />);
            }
          }

          // Enhanced pom-pom with fluffy texture
          if (isBeanie || isTuque) {
            const pomRadius = 2;
            for (let dy = -pomRadius; dy <= pomRadius; dy++) {
              for (let dx = -pomRadius; dx <= pomRadius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= pomRadius) {
                  // Fluffy texture
                  let pomColor = hl;
                  if ((dx + dy) % 2 === 0) {
                    pomColor = createHighlight(hl, 1.2);
                  } else if (Math.abs(dx) === pomRadius || Math.abs(dy) === pomRadius) {
                    pomColor = createShadow(hl, 0.8);
                  }
                  elements.push(<rect key={`pom-${dx}-${dy}`} x={centerX + dx} y={headY - 10 + dy} width="1" height="1" fill={pomColor} className="pixel" />);
                }
              }
            }
          }

          // Enhanced ear flaps for chullo with traditional patterns
          if (isChullo) {
            for (let f = 0; f < 6; f++) {
              elements.push(
                <rect key={`flap-l-${f}`} x={headX - 2 - Math.floor(f/3)} y={headY + 2 + f} width="2" height="1" fill={shade} className="pixel" />,
                <rect key={`flap-r-${f}`} x={headX + headDim.width + Math.floor(f/3)} y={headY + 2 + f} width="2" height="1" fill={shade} className="pixel" />
              );
            }
          }
          break;
        }
        case 'baseball': {
          // Enhanced baseball cap with larger crown and logo
          // Taller, fuller crown that properly covers hair
          for (let y = 0; y < 10; y++) {
            let w;
            if (y < 2) {
              w = headDim.width + 2; // Start narrower at top
            } else if (y < 5) {
              w = headDim.width + 4; // Expand in middle
            } else {
              w = headDim.width + 5; // Full width at bottom
            }
            const sx = centerX - Math.floor(w / 2);
            for (let x = 0; x < w; x++) {
              // Round the very top
              if (y === 0 && (x < 2 || x >= w - 2)) continue;
              if (y === 1 && (x === 0 || x === w - 1)) continue;
              elements.push(<rect key={`bb-crown-${y}-${x}`} x={sx + x} y={headY - 8 + y} width="1" height="1" fill={base} className="pixel" />);
            }
          }

          // Logo/emblem on front (simple geometric shape or letter)
          const logoY = headY - 4;
          const logoStyle = rand(seed * 17) > 0.5 ? 'letter' : 'symbol';
          if (logoStyle === 'letter') {
            // Simple letter logo (like NY Yankees style)
            const logoColor = isWealthy ? '#FFD700' : createHighlight(base, 1.5);
            // Vertical line
            for (let ly = 0; ly < 3; ly++) {
              elements.push(<rect key={`logo-v-${ly}`} x={centerX - 1} y={logoY + ly} width="1" height="1" fill={logoColor} className="pixel" />);
            }
            // Diagonal line
            elements.push(
              <rect key="logo-d1" x={centerX} y={logoY} width="1" height="1" fill={logoColor} className="pixel" />,
              <rect key="logo-d2" x={centerX + 1} y={logoY + 1} width="1" height="1" fill={logoColor} className="pixel" />
            );
          } else {
            // Star or diamond symbol
            const symbolColor = createHighlight(base, 1.4);
            elements.push(
              <rect key="logo-c" x={centerX} y={logoY} width="1" height="1" fill={symbolColor} className="pixel" />,
              <rect key="logo-l" x={centerX - 1} y={logoY + 1} width="1" height="1" fill={symbolColor} className="pixel" />,
              <rect key="logo-m" x={centerX} y={logoY + 1} width="1" height="1" fill={symbolColor} className="pixel" />,
              <rect key="logo-r" x={centerX + 1} y={logoY + 1} width="1" height="1" fill={symbolColor} className="pixel" />,
              <rect key="logo-b" x={centerX} y={logoY + 2} width="1" height="1" fill={symbolColor} className="pixel" />
            );
          }

          // Prominent curved brim/visor
          for (let y = 0; y < 4; y++) {
            const visorW = headDim.width + 6 - Math.floor(y * 0.5); // Wider and more prominent
            const visorX = centerX - Math.floor(visorW / 2);
            for (let x = 0; x < visorW; x++) {
              // Add curve to visor edges
              if (y > 1 && (x < 2 || x >= visorW - 2)) continue;
              const visorColor = y === 0 ? createShadow(base, 0.85) : createShadow(base, 0.7);
              elements.push(<rect key={`bb-visor-${y}-${x}`} x={visorX + x} y={headY + 2 + y} width="1" height="1" fill={visorColor} className="pixel" />);
            }
          }

          // Adjustable strap button on top
          elements.push(
            <rect key="bb-button" x={centerX} y={headY - 9} width="1" height="1" fill={shade} className="pixel" />,
            <rect key="bb-button-hl" x={centerX - 1} y={headY - 9} width="1" height="1" fill={hl} className="pixel" />
          );

          // Panel seams for authenticity
          for (let s = 0; s < 3; s++) {
            elements.push(<rect key={`seam-${s}`} x={centerX - 4 + s * 4} y={headY - 6} width="1" height="4" fill={shade} className="pixel" />);
          }
          break;
        }
        case 'coonskin': {
          // Coonskin cap with distinctive tail and fur texture
          const furColor = base || '#8B4513'; // Brown fur
          const furShade = createShadow(furColor, 0.7);
          const furDeep = createShadow(furColor, 0.5);
          const tailColor = name.includes('raccoon') ? '#404040' : '#2F1B14';

          // Main cap body that covers hair
          for (let y = headY - 8; y < headY + 2; y++) {
            let width = headDim.width + 4;
            if (y < headY - 5) {
              width = headDim.width + 2; // Taper at top
            }
            const startX = centerX - Math.floor(width / 2);
            for (let x = 0; x < width; x++) {
              // Fur texture pattern
              const furPattern = ((x + y * 3) % 4 === 0) ? furShade :
                                ((x * 2 + y) % 5 === 0) ? furDeep : furColor;
              elements.push(<rect key={`coonskin-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={furPattern} className="pixel" />);
            }
          }

          // Raccoon tail hanging down back
          const tailStartX = centerX + Math.floor(headDim.width / 2) + 2;
          const tailStartY = headY - 2;
          for (let t = 0; t < 12; t++) {
            const tailY = tailStartY + t;
            const tailX = tailStartX + (t > 6 ? 1 : 0); // Slight curve
            const tailW = t < 8 ? 2 : 1; // Taper

            // Striped tail pattern (dark/light bands)
            const stripColor = (Math.floor(t / 2) % 2 === 0) ? tailColor : furColor;
            for (let w = 0; w < tailW; w++) {
              elements.push(<rect key={`tail-${t}-${w}`} x={tailX + w} y={tailY} width="1" height="1" fill={stripColor} className="pixel" />);
            }
          }
          break;
        }

        case 'police': {
          // Police cap with badge and structured crown
          const capColor = base || '#000080'; // Navy blue
          const capShade = createShadow(capColor, 0.8);
          const badgeColor = '#FFD700'; // Gold badge

          // Structured crown
          for (let y = headY - 7; y < headY + 1; y++) {
            const width = headDim.width + 2;
            const startX = centerX - Math.floor(width / 2);
            for (let x = 0; x < width; x++) {
              elements.push(<rect key={`police-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={capColor} className="pixel" />);
            }
          }

          // Visor
          for (let y = 0; y < 3; y++) {
            const visorW = headDim.width + 4 - y;
            const visorX = centerX - Math.floor(visorW / 2);
            for (let x = 0; x < visorW; x++) {
              elements.push(<rect key={`police-visor-${y}-${x}`} x={visorX + x} y={headY + 1 + y} width="1" height="1" fill={capShade} className="pixel" />);
            }
          }

          // Badge on front
          elements.push(
            <rect key="police-badge" x={centerX - 1} y={headY - 4} width="2" height="3" fill={badgeColor} className="pixel" />,
            <rect key="police-badge-center" x={centerX} y={headY - 3} width="1" height="1" fill="#FFFFFF" className="pixel" />
          );
          break;
        }

        case 'fur': {
          // Fur hat (Russian ushanka style)
          const furColor = base || '#8B4513';
          const furShade = createShadow(furColor, 0.7);

          // Main hat body with ear flaps
          for (let y = headY - 6; y < headY + 3; y++) {
            let width = headDim.width + 4;
            if (y > headY) {
              width += 2; // Wider at bottom for ear flaps
            }
            const startX = centerX - Math.floor(width / 2);
            for (let x = 0; x < width; x++) {
              // Fur texture
              const furPattern = ((x + y * 2) % 3 === 0) ? furShade : furColor;
              elements.push(<rect key={`fur-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={furPattern} className="pixel" />);
            }
          }

          // Ear flaps
          for (let f = 0; f < 4; f++) {
            const flapY = headY + 1 + f;
            // Left flap
            elements.push(<rect key={`flap-l-${f}`} x={headX - 2} y={flapY} width="3" height="1" fill={furColor} className="pixel" />);
            // Right flap
            elements.push(<rect key={`flap-r-${f}`} x={headX + headDim.width - 1} y={flapY} width="3" height="1" fill={furColor} className="pixel" />);
          }
          break;
        }

        case 'merchant': {
          // Renaissance merchant cap (floppy felt hat)
          const feltColor = base || '#6D6D75';
          const feltShade = createShadow(feltColor, 0.8);

          // Soft, slouchy crown
          for (let y = headY - 8; y < headY + 1; y++) {
            let width = headDim.width + 3;
            // Asymmetric slouch
            const slouch = y < headY - 4 ? Math.floor((headY - 4 - y) / 2) : 0;
            const startX = centerX - Math.floor(width / 2) + slouch;

            for (let x = 0; x < width; x++) {
              // Soft edges
              if (y === headY - 8 && (x < 1 || x >= width - 1)) continue;
              elements.push(<rect key={`merchant-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={feltColor} className="pixel" />);
            }
          }

          // Soft brim that droops slightly
          for (let x = headX - 4; x < headX + headDim.width + 4; x++) {
            const distFromCenter = Math.abs(x - centerX);
            const droop = distFromCenter > 8 ? 1 : 0;
            elements.push(<rect key={`merchant-brim-${x}`} x={x} y={headY + 1 + droop} width="1" height="2" fill={feltShade} className="pixel" />);
          }

          // Small feather (optional decorative element)
          if (name.includes('feather') || rand(100) > 0.7) {
            elements.push(
              <rect key="feather-1" x={centerX + 2} y={headY - 6} width="1" height="3" fill="#228B22" className="pixel" />,
              <rect key="feather-2" x={centerX + 3} y={headY - 5} width="1" height="2" fill="#32CD32" className="pixel" />
            );
          }
          break;
        }

        case 'wool': {
          // IMPROVED Knitted wool cap with realistic knit stitch pattern, ribbed brim, and pompom
          const woolColor = base || '#8B4513'; // Default warm brown wool
          const woolVeryLight = createHighlight(woolColor, 1.3);
          const woolLight = createHighlight(woolColor, 1.15);
          const woolShade = createShadow(woolColor, 0.85);
          const woolDeep = createShadow(woolColor, 0.7);
          const woolDarkest = createShadow(woolColor, 0.55);

          // Main body of cap (13 rows) with stockinette stitch pattern
          for (let y = 0; y < 13; y++) {
            // Rounded cap shape
            let w;
            if (y < 3) {
              w = headDim.width + Math.floor(y * 0.8); // Gradual rounded top
            } else if (y < 9) {
              w = headDim.width + 3; // Full body width
            } else {
              w = headDim.width + 4; // Slightly wider before brim
            }

            const sx = centerX - Math.floor(w / 2);
            const rowY = headY - 14 + y;

            for (let x = 0; x < w; x++) {
              const xNorm = x / w;

              // Create realistic knit stitch pattern (V-shaped stitches)
              let capColor = woolColor;

              // Stockinette stitch: alternating V patterns
              const stitchRow = Math.floor(y / 2); // Each stitch row is 2 pixels tall
              const stitchCol = Math.floor(x / 3); // Each stitch is 3 pixels wide
              const xInStitch = x % 3;
              const yInStitch = y % 2;

              // Create V-shaped knit stitches
              if (yInStitch === 0) {
                // Top of V - darker at edges, lighter in center
                if (xInStitch === 0 || xInStitch === 2) {
                  capColor = woolShade; // V edges
                } else {
                  capColor = woolLight; // V center raised
                }
              } else {
                // Bottom of V - inverse shading
                if (xInStitch === 1) {
                  capColor = woolShade; // V bottom point
                } else {
                  capColor = woolColor; // Base color
                }
              }

              // Add decorative Fair Isle pattern band in middle
              if (y >= 5 && y <= 7) {
                // Simple geometric pattern
                if ((stitchCol + stitchRow) % 3 === 0) {
                  capColor = createHighlight(woolColor, 1.35); // Accent color (lighter)
                } else if ((stitchCol + stitchRow) % 3 === 1) {
                  capColor = woolDeep; // Dark accent
                }
              }

              // Subtle yarn fiber texture
              if ((x * 7 + y * 11) % 17 === 0) {
                capColor = createHighlight(capColor, 1.06);
              }

              // Strong side shading for 3D roundness
              if (xNorm < 0.12) {
                capColor = woolDarkest;
              } else if (xNorm < 0.2) {
                capColor = woolDeep;
              } else if (xNorm > 0.88) {
                capColor = woolDarkest;
              } else if (xNorm > 0.8) {
                capColor = woolDeep;
              }

              // Top highlight for wool texture
              if (y < 4 && xNorm > 0.4 && xNorm < 0.6) {
                capColor = createHighlight(capColor, 1.12);
              }

              // Bottom shadow
              if (y >= 11) {
                capColor = createShadow(capColor, 0.85);
              }

              // Soft rounded corners
              if (y === 0 && (x === 0 || x === w - 1)) continue;
              if (y === 1 && x === 0) continue;

              elements.push(<rect key={`wool-cap-${y}-${x}`} x={sx + x} y={rowY} width="1" height="1" fill={capColor} className="pixel" />);
            }
          }

          // Ribbed brim with 1x1 rib knit pattern (alternating knit/purl stitches)
          for (let y = 0; y < 3; y++) {
            const brimW = headDim.width + 4;
            const brimX = centerX - Math.floor(brimW / 2);
            const brimY = headY - 1 + y;

            for (let x = 0; x < brimW; x++) {
              // Ribbing pattern: vertical columns alternate raised/recessed
              let brimColor = woolColor;

              if (x % 2 === 0) {
                // Knit stitch (raised)
                brimColor = woolLight;
              } else {
                // Purl stitch (recessed)
                brimColor = woolShade;
              }

              // Horizontal ridge lines between rows
              if (y % 2 === 1) {
                brimColor = createShadow(brimColor, 0.92);
              }

              // Bottom row darkest (shadow under brim)
              if (y === 2) {
                brimColor = createShadow(brimColor, 0.78);
              }

              elements.push(<rect key={`wool-brim-${y}-${x}`} x={brimX + x} y={brimY} width="1" height="1" fill={brimColor} className="pixel" />);
            }
          }

          // Pompom on top (fluffy ball of yarn)
          const pompomY = headY - 15;
          const pompomSize = 4;

          for (let py = 0; py < pompomSize; py++) {
            for (let px = 0; px < pompomSize; px++) {
              // Create circular pompom shape
              const distFromCenter = Math.sqrt(Math.pow(px - pompomSize/2, 2) + Math.pow(py - pompomSize/2, 2));
              if (distFromCenter < pompomSize/2) {
                let pompomColor = woolColor;

                // Fluffy texture - random highlights and shadows
                const rand1 = (px * 13 + py * 17) % 7;
                if (rand1 === 0) {
                  pompomColor = woolVeryLight;
                } else if (rand1 === 1) {
                  pompomColor = woolLight;
                } else if (rand1 === 5 || rand1 === 6) {
                  pompomColor = woolShade;
                }

                // Top highlight
                if (py < 2 && px > 0 && px < pompomSize - 1) {
                  pompomColor = createHighlight(pompomColor, 1.15);
                }

                // Bottom shadow
                if (py >= pompomSize - 1) {
                  pompomColor = createShadow(pompomColor, 0.8);
                }

                elements.push(
                  <rect
                    key={`pompom-${px}-${py}`}
                    x={centerX - Math.floor(pompomSize/2) + px}
                    y={pompomY + py}
                    width="1"
                    height="1"
                    fill={pompomColor}
                    className="pixel"
                  />
                );
              }
            }
          }

          break;
        }

        default: {
          // IMPROVED generic cloth cap with strong shading, fabric texture, and depth
          const capBase = base || '#4A4A4A'; // Default dark gray
          const capVeryLight = createHighlight(capBase, 1.25);
          const capLight = createHighlight(capBase, 1.12);
          const capShade = createShadow(capBase, 0.82);
          const capDeep = createShadow(capBase, 0.68);
          const capDarkest = createShadow(capBase, 0.55);

          // Main crown (12 rows for better proportions)
          for (let y = 0; y < 12; y++) {
            // Proper rounded cap shape
            let w;
            if (y < 3) {
              w = headDim.width + Math.floor(y * 0.9); // Gradual rounded top
            } else if (y < 8) {
              w = headDim.width + 4; // Full crown width
            } else {
              w = headDim.width + 5; // Slightly wider at bottom
            }

            const sx = centerX - Math.floor(w / 2);
            const rowY = headY - 9 + y; // Adjusted to sit properly on head

            for (let x = 0; x < w; x++) {
              // Soft rounded corners
              if (y === 0 && (x < 2 || x >= w - 2)) continue;
              if (y === 1 && (x === 0 || x === w - 1)) continue;

              const xNorm = x / w;
              const yNorm = y / 12;

              // Start with base shading tier based on position
              let baseShade;
              if (xNorm < 0.08) {
                baseShade = capDarkest;
              } else if (xNorm < 0.15) {
                baseShade = capDeep;
              } else if (xNorm < 0.25) {
                baseShade = capShade;
              } else if (xNorm > 0.92) {
                baseShade = capDarkest;
              } else if (xNorm > 0.85) {
                baseShade = capDeep;
              } else if (xNorm > 0.75) {
                baseShade = capShade;
              } else if (xNorm > 0.45 && xNorm < 0.55) {
                baseShade = capLight; // Center highlight
              } else if (xNorm > 0.4 && xNorm < 0.45) {
                baseShade = capVeryLight; // Brightest highlight
              } else {
                baseShade = capBase;
              }

              let capColor = baseShade;

              // VISIBLE cloth weave texture (applied on top of base shading)
              const weaveX = x % 3;
              const weaveY = y % 3;

              // Stronger weave pattern that shows through
              if ((weaveX + weaveY) % 3 === 0) {
                capColor = createHighlight(capColor, 1.12); // Raised thread
              } else if ((weaveX + weaveY) % 3 === 2) {
                capColor = createShadow(capColor, 0.88); // Recessed thread
              }

              // More visible fabric texture variation
              if ((x * 3 + y * 7) % 9 === 0) {
                capColor = createHighlight(capColor, 1.1);
              } else if ((x * 5 + y * 3) % 11 === 0) {
                capColor = createShadow(capColor, 0.92);
              }

              // Vertical shading gradient - top lighter, bottom darker
              if (yNorm < 0.2) {
                capColor = createHighlight(capColor, 1.12);
              } else if (yNorm < 0.4) {
                capColor = createHighlight(capColor, 1.06);
              } else if (yNorm > 0.8) {
                capColor = createShadow(capColor, 0.85);
              } else if (yNorm > 0.6) {
                capColor = createShadow(capColor, 0.93);
              }

              // Visible seam/panel lines for structure
              if (y % 3 === 2 && xNorm > 0.15 && xNorm < 0.85) {
                capColor = createShadow(capColor, 0.82);
              }

              elements.push(<rect key={`cap-c-${y}-${x}`} x={sx + x} y={rowY} width="1" height="1" fill={capColor} className="pixel" />);
            }
          }

          // Subtle curved brim with texture and shading
          for (let y = 0; y < 2; y++) { // Reduced to 2 rows for subtle brim
            const brimW = headDim.width + 4 - Math.floor(y * 0.5);
            const brimX = centerX - Math.floor(brimW / 2);
            const brimY = headY + 3 + y; // Start at headY + 3

            for (let x = 0; x < brimW; x++) {
              const xNorm = x / brimW;

              // Brim base color
              let brimColor = capShade;

              // Continue cloth weave texture on brim
              const weaveX = x % 3;
              if (weaveX === 0) {
                brimColor = createHighlight(capShade, 1.08);
              } else if (weaveX === 2) {
                brimColor = createShadow(capShade, 0.92);
              }

              // Visible stitch detail every few pixels
              if (x % 4 === 0) {
                brimColor = createShadow(brimColor, 0.85);
              }

              // Bottom row is much darker (shadow underneath)
              if (y === 1) {
                brimColor = createShadow(brimColor, 0.7);
              }

              // Subtle edge curve darkening
              if (xNorm < 0.12 || xNorm > 0.88) {
                brimColor = createShadow(brimColor, 0.82);
              }

              elements.push(<rect key={`cap-v-${y}-${x}`} x={brimX + x} y={brimY} width="1" height="1" fill={brimColor} className="pixel" />);
            }
          }

          // Top button detail with strong depth
          elements.push(
            <rect key="cap-btn-base" x={centerX - 1} y={headY - 11} width="3" height="3" fill={capDeep} className="pixel" />,
            <rect key="cap-btn-main" x={centerX} y={headY - 11} width="2" height="2" fill={capShade} className="pixel" />,
            <rect key="cap-btn-highlight" x={centerX} y={headY - 11} width="1" height="1" fill={capLight} className="pixel" />
          );
          break;
        }

        case 'hardhat': {
          // Construction hardhat with distinctive shape
          const hardhatColor = '#FFD700'; // Safety yellow
          const hardhatShade = createShadow(hardhatColor, 0.8);

          // Dome shape that covers hair
          for (let y = headY - 8; y < headY + 2; y++) {
            let width = headDim.width + 6;
            if (y < headY - 5) {
              width = headDim.width + 2 + (headY - 5 - y) * 2; // Taper at top
            }
            const startX = centerX - Math.floor(width / 2);
            for (let x = 0; x < width; x++) {
              // Skip corners for rounded look
              if (y === headY - 8 && (x < 2 || x >= width - 2)) continue;
              elements.push(<rect key={`hardhat-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={hardhatColor} className="pixel" />);
            }
          }

          // Wide brim all around
          for (let x = headX - 8; x < headX + headDim.width + 8; x++) {
            elements.push(<rect key={`hardhat-brim-${x}`} x={x} y={headY + 2} width="1" height="2" fill={hardhatShade} className="pixel" />);
          }

          // Front ridge/reinforcement
          for (let y = headY - 6; y < headY; y++) {
            elements.push(<rect key={`hardhat-ridge-${y}`} x={centerX - 1} y={y} width="2" height="1" fill={hardhatShade} className="pixel" />);
          }
          break;
        }

        case 'surgical': {
          // Surgical cap that covers all hair
          const surgicalColor = '#87CEEB'; // Light blue
          const surgicalShade = createShadow(surgicalColor, 0.9);

          // Puffy top that covers all hair
          for (let y = headY - 7; y < headY + 4; y++) {
            let width = headDim.width + 6;
            // Elastic gathering at bottom
            if (y >= headY + 2) {
              width = headDim.width + 4;
            }
            const startX = centerX - Math.floor(width / 2);
            for (let x = 0; x < width; x++) {
              // Textured appearance
              const isGathered = (x + y) % 3 === 0 && y >= headY;
              const color = isGathered ? surgicalShade : surgicalColor;
              elements.push(<rect key={`surgical-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={color} className="pixel" />);
            }
          }

          // Elastic band at bottom
          for (let x = headX - 2; x < headX + headDim.width + 2; x++) {
            elements.push(<rect key={`surgical-elastic-${x}`} x={x} y={headY + 3} width="1" height="1" fill={surgicalShade} className="pixel" />);
          }
          break;
        }

        case 'visor': {
          // Sun visor (no crown, just brim and band)
          const visorColor = base;
          const visorShade = createShadow(visorColor, 0.7);

          // Headband
          for (let y = headY - 2; y < headY + 2; y++) {
            for (let x = headX - 1; x < headX + headDim.width + 1; x++) {
              elements.push(<rect key={`visor-band-${x}-${y}`} x={x} y={y} width="1" height="1" fill={visorColor} className="pixel" />);
            }
          }

          // Large curved visor/brim
          for (let y = 0; y < 4; y++) {
            const visorW = headDim.width + 8 - Math.floor(y * 0.5);
            const visorX = centerX - Math.floor(visorW / 2);
            for (let x = 0; x < visorW; x++) {
              // Curve edges
              if (y > 2 && (x < 2 || x >= visorW - 2)) continue;
              elements.push(<rect key={`visor-brim-${y}-${x}`} x={visorX + x} y={headY + 2 + y} width="1" height="1" fill={visorShade} className="pixel" />);
            }
          }
          break;
        }
      }
    }

    // TRICORN / PIRATE / COLONIAL HATS
    else if (nameContains('tricorn', 'pirate', 'colonial hat', 'cocked hat')) {
      const hatColor = name.includes('pirate') ? '#000000' : base;
      const hatShade = createShadow(hatColor, 0.8);
      
      // Crown - larger and covers hair
      for (let y = headY - 6; y < headY + 1; y++) {
        for (let x = headX - 1; x < headX + headDim.width + 1; x++) {
          elements.push(<rect key={`tricorn-crown-${x}-${y}`} x={x} y={y} width="1" height="1" fill={hatColor} className="pixel" />);
        }
      }
      
      // Wide brim base
      for (let x = headX - 6; x < headX + headDim.width + 6; x++) {
        for (let y = 0; y < 2; y++) {
          elements.push(<rect key={`tricorn-brim-${x}-${y}`} x={x} y={headY + y} width="1" height="1" fill={hatShade} className="pixel" />);
        }
      }
      
      // Three upturned corners (cocked hat effect)
      const corners = [
        { x: centerX - headDim.width/2 - 5, y: headY - 2 }, // left corner up
        { x: centerX, y: headY + 3 }, // front corner down
        { x: centerX + headDim.width/2 + 5, y: headY - 2 } // right corner up
      ];
      
      for (let i = 0; i < corners.length; i++) {
        const corner = corners[i];
        for (let dx = -4; dx <= 4; dx++) {
          for (let dy = -2; dy <= 2; dy++) {
            const dist = Math.abs(dx) + Math.abs(dy);
            if (dist <= 4) {
              elements.push(<rect key={`tricorn-corner-${i}-${dx}-${dy}`} x={corner.x + dx} y={corner.y + dy} width="1" height="1" fill={hatShade} className="pixel" />);
            }
          }
        }
      }
      
      // Gold trim and feather for wealthy
      if (isWealthy) {
        // Trim around crown
        for (let x = headX - 1; x < headX + headDim.width + 1; x++) {
          if ((x - headX) % 2 === 0) {
            elements.push(<rect key={`tricorn-trim-${x}`} x={x} y={headY - 1} width="1" height="1" fill="#FFD700" className="pixel" />);
          }
        }
        // Feather
        for (let f = 0; f < 6; f++) {
          elements.push(<rect key={`tricorn-feather-${f}`} x={centerX - 4} y={headY - 7 + f} width="1" height="1" fill={f % 2 === 0 ? '#2E7D32' : createHighlight('#2E7D32', 1.1)} className="pixel" />);
        }
      }
    }
    
    // MILITARY CAPS (officer, garrison, kepi)
    else if (nameContains('officer', 'garrison', 'kepi', 'military cap', 'forage cap')) {
      const capColor = material.includes('blue') ? '#000080' : material.includes('gray') ? '#808080' : base;
      const visorColor = '#000000';
      
      // Crown - taller and covers all hair
      for (let y = 0; y < 9; y++) {
        const width = headDim.width + 2 - Math.floor(y / 3); // gradual taper
        const sx = centerX - Math.floor(width / 2) - (y > 4 ? 1 : 0); // slight forward tilt
        for (let x = 0; x < width; x++) {
          elements.push(<rect key={`mil-crown-${y}-${x}`} x={sx + x} y={headY - 6 + y} width="1" height="1" fill={capColor} className="pixel" />);
        }
      }
      
      // Wider, more prominent visor
      for (let y = 0; y < 3; y++) {
        const visorWidth = headDim.width + 6 - y;
        const visorStartX = centerX - Math.floor(visorWidth / 2);
        for (let x = 0; x < visorWidth; x++) {
          elements.push(<rect key={`mil-visor-${y}-${x}`} x={visorStartX + x} y={headY + 3 + y} width="1" height="1" fill={visorColor} className="pixel" />);
        }
      }
      
      // Chin strap
      elements.push(
        <rect key="mil-strap-l" x={headX - 1} y={headY + headDim.height - 2} width="1" height="2" fill={visorColor} className="pixel" />,
        <rect key="mil-strap-r" x={headX + headDim.width} y={headY + headDim.height - 2} width="1" height="2" fill={visorColor} className="pixel" />
      );
      
      // Badge/insignia for officers
      if (isWealthy || name.includes('officer')) {
        elements.push(
          <rect key="mil-badge-1" x={centerX - 2} y={headY - 2} width="4" height="3" fill="#FFD700" className="pixel" />,
          <rect key="mil-badge-2" x={centerX - 1} y={headY - 1} width="2" height="1" fill="#DC143C" className="pixel" />,
          <rect key="mil-eagle" x={centerX} y={headY} width="1" height="1" fill="#000000" className="pixel" />
        );
      }
    }
    
    // STRAW / CONICAL HATS (including Asian & tropical styles)
    else if (nameContains('straw', 'rice hat', 'conical', 'bamboo hat', 'sedge hat', 'coolie',
                          'douli', 'li', 'sugegasa', 'panama hat', 'lauhala', 'harvest cap',
                          'rush hat', 'sun visor', 'bamboo dou li', 'toquilla', 'sun hat', 'sunhat')) {

      // Check if this is specifically a bamboo/rice farmer hat
      const isBambooHat = nameContains('bamboo', 'rice hat', 'conical', 'douli', 'li', 'sugegasa', 'coolie', 'sedge');

      if (isBambooHat) {
        // PROPER BAMBOO/RICE HAT - tall conical shape with bamboo texture
        // Always use natural bamboo colors regardless of item color
        const bambooLight = '#F4E4BC';  // Light bamboo
        const bambooMed = '#DEB887';    // Medium bamboo
        const bambooDark = '#BC9A6A';   // Dark bamboo
        const bambooDeep = '#8B7355';   // Deep shadow bamboo

        // Tall conical shape parameters
        const hatHeight = 16;  // Much taller for proper conical shape
        const topY = headY - 10;  // Start well above head
        const maxWidth = headDim.width * 2.5;  // Very wide brim

        // Draw the conical hat from top to bottom
        for (let i = 0; i < hatHeight; i++) {
          const y = topY + i;
          const progress = i / hatHeight;

          // Exponential width increase for proper cone shape
          const width = Math.floor(2 + (maxWidth - 2) * Math.pow(progress, 1.5));
          const startX = centerX - Math.floor(width / 2);

          for (let x = 0; x < width; x++) {
            const xNorm = x / width;

            // Bamboo weave pattern
            const weavePattern = ((x + i * 2) % 4);
            const radialPattern = ((x - width/2) * 2 + i) % 6;

            let color = bambooMed;

            // Create radial bamboo strips effect
            if (radialPattern === 0 || radialPattern === 3) {
              color = bambooLight;
            } else if (radialPattern === 1 || radialPattern === 4) {
              color = bambooDark;
            }

            // Edge shading for 3D effect
            if (xNorm < 0.1 || xNorm > 0.9) {
              color = bambooDeep;
            } else if (xNorm < 0.2 || xNorm > 0.8) {
              color = bambooDark;
            }

            // Top highlight
            if (i < 3 && xNorm > 0.4 && xNorm < 0.6) {
              color = bambooLight;
            }

            // Weave texture overlay
            if (weavePattern === 0) {
              color = createHighlight(color, 1.15);
            } else if (weavePattern === 2) {
              color = createShadow(color, 0.9);
            }

            // Under-brim shadow (last few rows)
            if (i >= hatHeight - 2) {
              color = createShadow(color, 0.75);
            }

            elements.push(
              <rect key={`bamboo-hat-${i}-${x}`} x={startX + x} y={y} width="1" height="1" fill={color} className="pixel" />
            );
          }
        }

        // Add chin strap ties
        const chinStrapY = headY + Math.floor(headDim.height * 0.9);
        elements.push(
          // Left tie
          <rect key="bamboo-tie-l1" x={headX - 1} y={headY + 2} width="1" height="1" fill={bambooDeep} className="pixel" />,
          <rect key="bamboo-tie-l2" x={headX - 1} y={headY + 4} width="1" height="1" fill={bambooDeep} className="pixel" />,
          <rect key="bamboo-tie-l3" x={headX} y={chinStrapY} width="1" height="1" fill={bambooDeep} className="pixel" />,
          // Right tie
          <rect key="bamboo-tie-r1" x={headX + headDim.width} y={headY + 2} width="1" height="1" fill={bambooDeep} className="pixel" />,
          <rect key="bamboo-tie-r2" x={headX + headDim.width} y={headY + 4} width="1" height="1" fill={bambooDeep} className="pixel" />,
          <rect key="bamboo-tie-r3" x={headX + headDim.width - 1} y={chinStrapY} width="1" height="1" fill={bambooDeep} className="pixel" />
        );

      } else {
        // Regular straw hat (panama, sun hat, etc) - IMPROVED: BIGGER with taller crown, lower brim, better shadows
        // Natural straw colors
        const strawVeryLight = '#FAEBD7'; // Very light wheat
        const strawLight = '#F5DEB3';     // Light wheat
        const strawBase = '#D2B48C';      // Tan/wheat base
        const strawMed = '#C19A6B';       // Medium straw
        const strawDark = '#A0826D';      // Dark straw
        const strawDeep = '#8B7355';      // Deep shadow
        const strawDarkest = '#6B5742';   // Very dark shadow

        // BIGGER dimensions: taller crown, lower position
        const brimY = headY + 2;  // Lower brim (moved down from headY - 1)
        const brimThickness = 3;  // Thicker brim (increased from 2)
        const brimExtra = Math.floor(headDim.width / 2) + 4; // Wider brim

        const crownHeight = 12; // TALLER crown (increased from 8)
        const crownBaseWidth = headDim.width + 4; // Wider base

        // Draw taller crown with realistic woven straw texture
        for (let i = 0; i < crownHeight; i++) {
          const rowY = brimY - crownHeight + i;
          const taper = i / crownHeight;
          const rowW = Math.max(4, Math.floor(crownBaseWidth * (0.4 + 0.6 * taper))); // Better taper
          const sx = centerX - Math.floor(rowW / 2);

          for (let x = 0; x < rowW; x++) {
            const xPos = sx + x;
            const xNorm = x / rowW;

            // Create woven basket-weave pattern
            const weaveX = x % 6;
            const weaveY = i % 6;

            let col = strawBase;

            // Diagonal weave pattern
            if ((weaveX + weaveY) % 6 < 3) {
              // Horizontal strands
              col = (weaveY % 2 === 0) ? strawLight : strawMed;
            } else {
              // Vertical strands
              col = (weaveX % 2 === 0) ? strawMed : strawDark;
            }

            // Add texture variation for natural straw
            if ((x * 3 + i * 5) % 11 === 0) {
              col = createHighlight(col, 1.08);
            } else if ((x * 7 + i * 3) % 13 === 0) {
              col = createShadow(col, 0.93);
            }

            // STRONGER side shading for 3D roundness
            if (xNorm < 0.1) {
              col = strawDarkest; // Very dark left edge
            } else if (xNorm < 0.18) {
              col = strawDeep; // Dark left side
            } else if (xNorm < 0.28) {
              col = strawDark; // Shaded left
            } else if (xNorm > 0.9) {
              col = strawDarkest; // Very dark right edge
            } else if (xNorm > 0.82) {
              col = strawDeep; // Dark right side
            } else if (xNorm > 0.72) {
              col = strawDark; // Shaded right
            }

            // Strong top highlight
            if (i < 3 && xNorm > 0.35 && xNorm < 0.65) {
              col = strawVeryLight;
            } else if (i < 4 && xNorm > 0.4 && xNorm < 0.6) {
              col = strawLight;
            }

            // Strong bottom shadow to show it sits on head
            if (i >= crownHeight - 2) {
              col = createShadow(col, 0.75);
            } else if (i >= crownHeight - 3) {
              col = createShadow(col, 0.88);
            }

            elements.push(
              <rect key={`straw-crown-${i}-${x}`} x={xPos} y={rowY} width="1" height="1" fill={col} className="pixel" />
            );
          }
        }

        // Draw THICKER brim with stronger shadows underneath
        for (let t = 0; t < brimThickness; t++) {
          const y = brimY + t;
          const left = headX - 1 - (brimExtra - Math.floor(t * 0.8)); // Better taper
          const right = headX + headDim.width + 1 + (brimExtra - Math.floor(t * 0.8));

          for (let x = left; x < right; x++) {
            // Continued weave pattern on brim
            const weaveX = x % 6;
            const weaveY = t % 3;

            let col = strawBase;

            // Radial weave pattern for brim
            if ((weaveX + weaveY) % 4 < 2) {
              col = (weaveX % 2 === 0) ? strawLight : strawMed;
            } else {
              col = (weaveX % 3 === 0) ? strawDark : strawMed;
            }

            // Natural texture variation
            if ((x * 5 + t * 7) % 13 === 0) {
              col = createHighlight(col, 1.06);
            }

            // MUCH STRONGER shadow gradient from top to bottom of brim
            if (t === 0) {
              // Top of brim - lightest
              col = createHighlight(col, 1.05);
            } else if (t === 1) {
              // Middle - slight shadow
              col = createShadow(col, 0.92);
            } else if (t === 2) {
              // Bottom - VERY dark shadow underneath
              col = createShadow(col, 0.6);
            }

            // Edge darkening for depth and curl
            const distFromCenter = Math.abs(x - centerX);
            if (distFromCenter > headDim.width * 1.0) {
              col = createShadow(col, 0.82);
            } else if (distFromCenter > headDim.width * 0.85) {
              col = createShadow(col, 0.9);
            }

            elements.push(
              <rect key={`straw-brim-${t}-${x}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />
            );
          }
        }
      }
}


    // HAIR ORNAMENTS / TIKKA / FLOWERS / FEATHER HEADDRESS / COMB
    else if (nameContains('flower', 'garland', 'lei', 'hairpiece', 'hairpin', 'tikka', 'maang', 'passa', 'rakhdi', 'sheesh', 'comb', 'feather crown', 'feather band', 'feather headdress')) {
      if (nameContains('feather crown', 'feather band', 'feather headdress')) {
        // Beautiful multicolored feather headdress
        const featherColors = [
          '#DC143C', // Red
          '#FF8C00', // Orange
          '#FFD700', // Gold
          '#32CD32', // Green
          '#1E90FF', // Blue
          '#9370DB', // Purple
          '#FF1493', // Pink
          '#8B4513', // Brown
          '#000000', // Black
          '#FFFFFF'  // White
        ];

        // Main headband base
        for (let x = headX + 1; x < headX + headDim.width - 1; x++) {
          elements.push(<rect key={`feather-band-${x}`} x={x} y={headY - 2} width="1" height="2" fill="#8B4513" className="pixel" />);
        }

        // Large upright feathers across the head
        const numFeathers = 7;
        for (let i = 0; i < numFeathers; i++) {
          const featherX = headX + 2 + Math.floor(i * ((headDim.width - 4) / (numFeathers - 1)));
          const featherColor = featherColors[i % featherColors.length];
          const featherShade = createShadow(featherColor, 0.8);
          const featherHighlight = createHighlight(featherColor, 1.2);

          // Feather shaft (center spine)
          for (let y = 0; y < 8; y++) {
            elements.push(<rect key={`feather-shaft-${i}-${y}`} x={featherX} y={headY - 3 - y} width="1" height="1" fill="#654321" className="pixel" />);
          }

          // Feather barbs (fluffy parts on sides)
          for (let y = 1; y < 7; y++) {
            const barbWidth = Math.min(3, y); // Wider in middle, narrower at top/bottom

            // Left side barbs
            for (let b = 1; b <= barbWidth; b++) {
              if (featherX - b >= headX) {
                const barbColor = (b === 1) ? featherColor : (b === 2) ? featherShade : featherHighlight;
                // Add some natural irregularity to feather edges
                if (rand((i * 100 + y * 10 + b) * 17) > 0.3) {
                  elements.push(<rect key={`feather-l-${i}-${y}-${b}`} x={featherX - b} y={headY - 3 - y} width="1" height="1" fill={barbColor} className="pixel" />);
                }
              }
            }

            // Right side barbs
            for (let b = 1; b <= barbWidth; b++) {
              if (featherX + b < headX + headDim.width) {
                const barbColor = (b === 1) ? featherColor : (b === 2) ? featherShade : featherHighlight;
                // Add some natural irregularity to feather edges
                if (rand((i * 100 + y * 10 + b + 50) * 17) > 0.3) {
                  elements.push(<rect key={`feather-r-${i}-${y}-${b}`} x={featherX + b} y={headY - 3 - y} width="1" height="1" fill={barbColor} className="pixel" />);
                }
              }
            }
          }

          // Feather tip accent
          elements.push(<rect key={`feather-tip-${i}`} x={featherX} y={headY - 11} width="1" height="1" fill={featherHighlight} className="pixel" />);
        }

        // Additional decorative elements
        if (isWealthy || name.includes('chief') || name.includes('ceremonial')) {
          // Add beadwork to the headband
          for (let x = headX + 2; x < headX + headDim.width - 2; x += 3) {
            const beadColor = featherColors[Math.floor((x - headX) / 3) % featherColors.length];
            elements.push(<rect key={`bead-${x}`} x={x} y={headY - 1} width="1" height="1" fill={beadColor} className="pixel" />);
          }

          // Add small hanging elements (ties or ornaments)
          if (rand(100) > 0.6) {
            elements.push(
              <rect key="tie-l" x={headX} y={headY + 1} width="1" height="3" fill="#8B4513" className="pixel" />,
              <rect key="tie-r" x={headX + headDim.width - 1} y={headY + 1} width="1" height="3" fill="#8B4513" className="pixel" />
            );
          }
        }
      } else if (nameContains('flower', 'garland', 'lei')) {
        // Enhanced flower crown
        const flowerColors = ['#FF69B4', '#FFD700', '#FF6347', '#9370DB', '#32CD32', '#FF1493'];
        for (let i = 0; i < 5; i++) {
          const fx = headX + 1 + i * Math.floor((headDim.width - 2) / 4);
          const fy = headY - 2;
          const flowerColor = flowerColors[i % flowerColors.length];

          // Multi-petaled flowers
          elements.push(
            <rect key={`flower-${i}-center`} x={fx} y={fy} width="1" height="1" fill="#FFD700" className="pixel" />, // Center
            <rect key={`flower-${i}-n`} x={fx} y={fy - 1} width="1" height="1" fill={flowerColor} className="pixel" />, // North petal
            <rect key={`flower-${i}-s`} x={fx} y={fy + 1} width="1" height="1" fill={flowerColor} className="pixel" />, // South petal
            <rect key={`flower-${i}-e`} x={fx + 1} y={fy} width="1" height="1" fill={flowerColor} className="pixel" />, // East petal
            <rect key={`flower-${i}-w`} x={fx - 1} y={fy} width="1" height="1" fill={flowerColor} className="pixel" />, // West petal
          );

          // Add leaves between flowers
          if (i < 4) {
            const leafX = fx + Math.floor((headDim.width - 2) / 8);
            elements.push(<rect key={`leaf-${i}`} x={leafX} y={fy} width="1" height="1" fill="#228B22" className="pixel" />);
          }
        }
      } else if (nameContains('tikka', 'maang', 'passa')) {
        elements.push(
          <rect key="tikka-chain" x={centerX - 1} y={headY - 1} width="2" height="1" fill="#FFD700" className="pixel" />,
          <rect key="tikka-pendant" x={centerX - 1} y={headY + 2} width="2" height="2" fill="#DC143C" className="pixel" />
        );
      } else {
        const cx = headX + headDim.width - 3;
        const metal = material.includes('gold') ? '#FFD700' : '#C0C0C0';
        elements.push(<rect key="comb-base" x={cx} y={headY - 2} width="3" height="1" fill={metal} className="pixel" />);
        if (nameContains('jewel')) elements.push(<rect key="comb-gem" x={cx + 1} y={headY - 3} width="1" height="1" fill="#DC143C" className="pixel" />);
      }
    }
    
    // CROWNED HEADS (crowns, tiaras, diadems, coronets)
    else if (nameContains('crown', 'tiara', 'diadem', 'coronet', 'circlet')) {
      const metalColor = material.includes('gold') ? '#FFD700' : 
                        material.includes('silver') ? '#C0C0C0' : 
                        material.includes('copper') ? '#B87333' : '#FFD700';
      const gemColor = name.includes('ruby') ? '#DC143C' : 
                      name.includes('emerald') ? '#50C878' : 
                      name.includes('sapphire') ? '#0F52BA' : 
                      name.includes('diamond') ? '#B9F2FF' : '#DC143C';
      
      // Base band
      for (let x = headX + 2; x < headX + headDim.width - 2; x++) {
        elements.push(<rect key={`crown-base-${x}`} x={x} y={headY - 3} width="1" height="2" fill={metalColor} className="pixel" />);
      }
      
      // Crown points/peaks
      const peaks = name.includes('tiara') ? 3 : 5;
      const spacing = Math.floor(headDim.width / (peaks + 1));
      for (let i = 1; i <= peaks; i++) {
        const peakX = headX + i * spacing;
        const peakHeight = i === Math.ceil(peaks/2) ? 5 : 3; // Center peak taller
        for (let h = 0; h < peakHeight; h++) {
          elements.push(<rect key={`crown-peak-${i}-${h}`} x={peakX} y={headY - 4 - h} width="1" height="1" fill={metalColor} className="pixel" />);
        }
        // Gem at peak
        if (isWealthy || isNoble) {
          elements.push(<rect key={`crown-gem-${i}`} x={peakX} y={headY - 4 - peakHeight} width="1" height="1" fill={gemColor} className="pixel" />);
        }
      }
    }
    
    // MODERN ACCESSORIES - HEADSET, SUNGLASSES, MASKS
    else if (nameContains('headset', 'headphones', 'earbuds', 'sunglasses', 'shades', 'guy fawkes', 'anonymous mask', 'glasses')) {
      if (nameContains('headset', 'headphones')) {
        // Over-ear headset/headphones
        const headsetColor = '#2C2C2C'; // Dark gray/black
        const headsetPadding = '#505050'; // Lighter gray for padding

        // Headband arc over top of head
        for (let angle = Math.PI; angle > 0; angle -= 0.15) {
          const hx = Math.round(centerX + Math.cos(angle) * (headDim.width * 0.7));
          const hy = Math.round(headY - 6 + Math.sin(angle) * 8);
          elements.push(<rect key={`headset-band-${angle}`} x={hx} y={hy} width="2" height="2" fill={headsetColor} className="pixel" />);
        }

        // Ear cups
        const earY = headY + Math.floor(headDim.height * 0.4);
        // Left ear cup
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -2; dx <= 1; dx++) {
            const isPadding = Math.abs(dy) < 3 && Math.abs(dx) < 1;
            elements.push(<rect key={`headset-l-${dx}-${dy}`} x={headX - 2 + dx} y={earY + dy} width="1" height="1"
              fill={isPadding ? headsetPadding : headsetColor} className="pixel" />);
          }
        }
        // Right ear cup
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -1; dx <= 2; dx++) {
            const isPadding = Math.abs(dy) < 3 && Math.abs(dx + 1) < 1;
            elements.push(<rect key={`headset-r-${dx}-${dy}`} x={headX + headDim.width + dx} y={earY + dy} width="1" height="1"
              fill={isPadding ? headsetPadding : headsetColor} className="pixel" />);
          }
        }

        // Microphone boom (left side)
        for (let my = 0; my < 6; my++) {
          elements.push(<rect key={`headset-mic-${my}`} x={headX - 3 - Math.floor(my/2)} y={earY + 2 + my} width="1" height="1" fill={headsetColor} className="pixel" />);
        }
        // Mic tip
        elements.push(<rect key="headset-mic-tip" x={headX - 6} y={earY + 8} width="2" height="2" fill="#FF0000" className="pixel" />);
      }
      else if (nameContains('sunglasses', 'shades')) {
        // Cool sunglasses
        const frameColor = '#000000';
        const lensColor = '#1a1a1a'; // Very dark tinted
        const eyeY = headY + Math.floor(headDim.height * 0.35);
        const eyeSpacing = Math.floor(headDim.width * 0.24);
        const leftX = centerX - eyeSpacing - 2;
        const rightX = centerX + eyeSpacing - 1;

        // Aviator style frames
        // Left lens
        for (let dy = -2; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            const isFrame = Math.abs(dy) === 2 || Math.abs(dx) === 3 || (dy === 3 && Math.abs(dx) <= 2);
            const color = isFrame ? frameColor : lensColor;
            if (!(dy === -2 && Math.abs(dx) === 3)) { // Round top corners
              elements.push(<rect key={`sunglass-l-${dx}-${dy}`} x={leftX + dx + 1} y={eyeY + dy} width="1" height="1" fill={color} className="pixel" />);
            }
          }
        }
        // Right lens
        for (let dy = -2; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            const isFrame = Math.abs(dy) === 2 || Math.abs(dx) === 3 || (dy === 3 && Math.abs(dx) <= 2);
            const color = isFrame ? frameColor : lensColor;
            if (!(dy === -2 && Math.abs(dx) === 3)) { // Round top corners
              elements.push(<rect key={`sunglass-r-${dx}-${dy}`} x={rightX + dx + 1} y={eyeY + dy} width="1" height="1" fill={color} className="pixel" />);
            }
          }
        }

        // Bridge
        for (let bx = leftX + 5; bx < rightX - 2; bx++) {
          elements.push(<rect key={`sunglass-bridge-${bx}`} x={bx} y={eyeY} width="1" height="1" fill={frameColor} className="pixel" />);
        }

        // Temple arms
        for (let tx = 0; tx < 4; tx++) {
          elements.push(
            <rect key={`sunglass-temple-l-${tx}`} x={headX - tx} y={eyeY} width="1" height="1" fill={frameColor} className="pixel" />,
            <rect key={`sunglass-temple-r-${tx}`} x={headX + headDim.width + tx} y={eyeY} width="1" height="1" fill={frameColor} className="pixel" />
          );
        }
      }
      else if (nameContains('guy fawkes', 'anonymous mask')) {
        // Guy Fawkes / V for Vendetta mask - covers entire face
        const maskColor = '#FFFFF0'; // Ivory white
        const lineColor = '#000000';

        // Full face coverage
        for (let y = headY - 2; y < headY + headDim.height + 2; y++) {
          for (let x = headX - 2; x < headX + headDim.width + 2; x++) {
            // Tapered chin
            if (y > headY + headDim.height - 2) {
              const chinTaper = y - (headY + headDim.height - 2);
              if (Math.abs(x - centerX) > headDim.width / 2 - chinTaper) continue;
            }
            elements.push(<rect key={`mask-base-${x}-${y}`} x={x} y={y} width="1" height="1" fill={maskColor} className="pixel" />);
          }
        }

        // Iconic features
        // Eyebrows (upward slant)
        const eyebrowY = headY + Math.floor(headDim.height * 0.25);
        for (let ex = -4; ex <= 4; ex++) {
          const eySlant = Math.floor(Math.abs(ex) * 0.5);
          elements.push(
            <rect key={`mask-brow-l-${ex}`} x={centerX - eyeSpacing + ex} y={eyebrowY - eySlant} width="1" height="1" fill={lineColor} className="pixel" />,
            <rect key={`mask-brow-r-${ex}`} x={centerX + eyeSpacing + ex} y={eyebrowY - eySlant} width="1" height="1" fill={lineColor} className="pixel" />
          );
        }

        // Eyes (narrow slits)
        const eyeY = headY + Math.floor(headDim.height * 0.35);
        const eyeSpacing = Math.floor(headDim.width * 0.2);
        for (let ex = -2; ex <= 2; ex++) {
          elements.push(
            <rect key={`mask-eye-l-${ex}`} x={centerX - eyeSpacing + ex} y={eyeY} width="1" height="1" fill={lineColor} className="pixel" />,
            <rect key={`mask-eye-r-${ex}`} x={centerX + eyeSpacing + ex} y={eyeY} width="1" height="1" fill={lineColor} className="pixel" />
          );
        }

        // Mustache
        const mustacheY = headY + Math.floor(headDim.height * 0.6);
        for (let mx = -5; mx <= 5; mx++) {
          const curl = Math.floor(Math.abs(mx) * 0.3);
          elements.push(<rect key={`mask-mustache-${mx}`} x={centerX + mx} y={mustacheY - curl} width="1" height="2" fill={lineColor} className="pixel" />);
        }

        // Goatee
        const goateeY = headY + Math.floor(headDim.height * 0.75);
        for (let gy = 0; gy < 4; gy++) {
          const width = 3 - Math.floor(gy * 0.7);
          for (let gx = -width; gx <= width; gx++) {
            elements.push(<rect key={`mask-goatee-${gx}-${gy}`} x={centerX + gx} y={goateeY + gy} width="1" height="1" fill={lineColor} className="pixel" />);
          }
        }

        // Rosy cheeks
        const cheekY = headY + Math.floor(headDim.height * 0.45);
        for (let cy = 0; cy < 2; cy++) {
          for (let cx = 0; cx < 3; cx++) {
            elements.push(
              <rect key={`mask-cheek-l-${cx}-${cy}`} x={centerX - eyeSpacing - 3 + cx} y={cheekY + cy} width="1" height="1" fill="#FFB3BA" className="pixel" />,
              <rect key={`mask-cheek-r-${cx}-${cy}`} x={centerX + eyeSpacing + 1 + cx} y={cheekY + cy} width="1" height="1" fill="#FFB3BA" className="pixel" />
            );
          }
        }
      }
      else if (nameContains('glasses') && !nameContains('sunglasses')) {
        // Regular prescription glasses (as equipped item)
        const frameColor = '#4A4A4A'; // Dark gray frame
        const eyeY = headY + Math.floor(headDim.height * 0.35);
        const eyeSpacing = Math.floor(headDim.width * 0.24);
        const leftX = centerX - eyeSpacing - 2;
        const rightX = centerX + eyeSpacing - 1;

        // Rectangular frames
        // Left lens
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            const isFrame = Math.abs(dy) === 2 || Math.abs(dx) === 3;
            if (isFrame) {
              elements.push(<rect key={`glasses-l-${dx}-${dy}`} x={leftX + dx + 1} y={eyeY + dy} width="1" height="1" fill={frameColor} className="pixel" />);
            }
          }
        }
        // Right lens
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            const isFrame = Math.abs(dy) === 2 || Math.abs(dx) === 3;
            if (isFrame) {
              elements.push(<rect key={`glasses-r-${dx}-${dy}`} x={rightX + dx + 1} y={eyeY + dy} width="1" height="1" fill={frameColor} className="pixel" />);
            }
          }
        }

        // Bridge
        for (let bx = leftX + 5; bx < rightX - 2; bx++) {
          elements.push(<rect key={`glasses-bridge-${bx}`} x={bx} y={eyeY} width="1" height="1" fill={frameColor} className="pixel" />);
        }

        // Temple arms
        for (let tx = 0; tx < 4; tx++) {
          elements.push(
            <rect key={`glasses-temple-l-${tx}`} x={headX - tx} y={eyeY} width="1" height="1" fill={frameColor} className="pixel" />,
            <rect key={`glasses-temple-r-${tx}`} x={headX + headDim.width + tx} y={eyeY} width="1" height="1" fill={frameColor} className="pixel" />
          );
        }

        // Lens shine effect
        elements.push(
          <rect key="glasses-shine-l" x={leftX - 1} y={eyeY - 1} width="1" height="1" fill="#FFFFFF" opacity="0.5" className="pixel" />,
          <rect key="glasses-shine-r" x={rightX - 1} y={eyeY - 1} width="1" height="1" fill="#FFFFFF" opacity="0.5" className="pixel" />
        );
      }
    }

    // BANDANAS, HEADBANDS & KERCHIEFS
    else if (nameContains('bandana', 'headband', 'sweatband', 'kerchief')) {
      const bandColor = base;
      const pattern = name.includes('paisley') || name.includes('bandana');
      const isKerchief = name.includes('kerchief');
      
      if (isKerchief) {
        // Kerchief: Triangle shape covering hair, tied under chin
        const bandShade = createShadow(bandColor, 0.9);
        for (let y = headY - 2; y < headY + headDim.height - 3; y++) {
          for (let x = headX - 3; x < headX + headDim.width + 3; x++) {
            const dx = Math.abs(x - centerX);
            const dy = y - (headY - 2);
            // Triangle shape that widens as it goes down
            const maxWidth = Math.min(headDim.width / 2 + 2, dy * 1.5 + 1);
            if (dx < maxWidth && y < headY + 8) {
              // Don't cover face area except edges
              const faceArea = y > headY + 2 && y < headY + headDim.height - 4 && dx < headDim.width / 2 - 3;
              if (!faceArea) {
                const col = (x + y) % 4 === 0 ? bandShade : bandColor;
                elements.push(<rect key={`kerchief-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
              }
            }
          }
        }
        // Simple tie under chin
        const chinY = headY + headDim.height - 3;
        elements.push(
          <rect key="kerchief-knot" x={centerX} y={chinY} width="2" height="1" fill={bandShade} className="pixel" />
        );
      } else {
        // Regular bandana/headband
        for (let y = headY - 1; y < headY + 3; y++) {
          for (let x = headX - 1; x < headX + headDim.width + 1; x++) {
            const dx = x - centerX;
            const dy = y - headY;

            // Only draw where it would be visible (not covered by hair in center)
            if (Math.abs(dx) > headDim.width * 0.3 || dy < 1) {
              // Add pattern
              let color = bandColor;
              if (pattern && ((x + y) % 3 === 0)) {
                color = createHighlight(bandColor, 1.2);
              }
              elements.push(<rect key={`band-${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} className="pixel" />);
            }
          }
        }
      }
      
      // Knot at back/side for bandana
      if (name.includes('bandana')) {
        const knotX = headX + headDim.width;
        elements.push(
          <rect key="bandana-knot-1" x={knotX} y={headY} width="2" height="2" fill={createShadow(bandColor, 0.8)} className="pixel" />,
          <rect key="bandana-tail-1" x={knotX + 1} y={headY + 2} width="1" height="3" fill={bandColor} className="pixel" />,
          <rect key="bandana-tail-2" x={knotX + 2} y={headY + 2} width="1" height="2" fill={bandColor} className="pixel" />
        );
      }
    }
    
    // ACADEMIC CAPS (mortarboard, biretta, doctoral cap)
    else if (nameContains('mortarboard', 'biretta', 'doctoral', 'academic', 'graduation')) {
      const capColor = name.includes('doctoral') ? '#DC143C' : '#000000';
      
      if (name.includes('mortarboard')) {
        // Square board on top
        for (let y = headY - 5; y < headY - 3; y++) {
          for (let x = headX - 3; x < headX + headDim.width + 3; x++) {
            elements.push(<rect key={`board-${x}-${y}`} x={x} y={y} width="1" height="1" fill={capColor} className="pixel" />);
          }
        }
        // Cap underneath
        for (let y = headY - 3; y < headY + 2; y++) {
          for (let x = headX; x < headX + headDim.width; x++) {
            elements.push(<rect key={`cap-${x}-${y}`} x={x} y={y} width="1" height="1" fill={capColor} className="pixel" />);
          }
        }
        // Tassel
        const tasselX = centerX + Math.floor(headDim.width * 0.3);
        for (let t = 0; t < 4; t++) {
          elements.push(<rect key={`tassel-${t}`} x={tasselX} y={headY - 5 + t} width="1" height="1" fill="#FFD700" className="pixel" />);
        }
      } else if (name.includes('biretta')) {
        // Three or four ridged square cap
        for (let ridge = 0; ridge < 3; ridge++) {
          const ridgeY = headY - 4 + ridge;
          for (let x = headX + ridge; x < headX + headDim.width - ridge; x++) {
            elements.push(<rect key={`biretta-${ridge}-${x}`} x={x} y={ridgeY} width="1" height="1" fill={capColor} className="pixel" />);
          }
        }
        // Pom-pom on top
        elements.push(<rect key="biretta-pom" x={centerX} y={headY - 5} width="1" height="1" fill="#DC143C" className="pixel" />);
      }
    }
    
    // RELIGIOUS HEADWEAR (mitre, zucchetto, kippah)
    else if (nameContains('mitre', 'zucchetto', 'kippah', 'yarmulke', 'skullcap')) {
      const relColor = material.includes('white') ? '#FFFFFF' : 
                      material.includes('red') ? '#DC143C' : 
                      material.includes('purple') ? '#800080' : '#000000';
      
      if (name.includes('mitre')) {
        // Tall pointed bishop's hat
        const mitreHeight = 8;
        for (let h = 0; h < mitreHeight; h++) {
          const width = Math.max(2, mitreHeight - h);
          const startX = centerX - Math.floor(width / 2);
          for (let w = 0; w < width; w++) {
            elements.push(<rect key={`mitre-${h}-${w}`} x={startX + w} y={headY - mitreHeight + h} width="1" height="1" fill={relColor} className="pixel" />);
          }
        }
        // Cross decoration
        if (isWealthy) {
          elements.push(
            <rect key="mitre-cross-v" x={centerX} y={headY - 5} width="1" height="3" fill="#FFD700" className="pixel" />,
            <rect key="mitre-cross-h" x={centerX - 1} y={headY - 4} width="3" height="1" fill="#FFD700" className="pixel" />
          );
        }
      } else {
        // Simple skullcap (kippah/zucchetto)
        const radius = Math.floor(headDim.width * 0.4);
        for (let y = -radius; y <= 0; y++) {
          const width = Math.round(Math.sqrt(radius * radius - y * y) * 2);
          const startX = centerX - Math.floor(width / 2);
          for (let x = 0; x < width; x++) {
            elements.push(<rect key={`skull-${x}-${y}`} x={startX + x} y={headY + y} width="1" height="1" fill={relColor} className="pixel" />);
          }
        }
      }
    }

    // Otherwise, simple band as a safe default
    else {
      for (let x = headX; x < headX + headDim.width; x++) {
        elements.push(<rect key={`band-${x}`} x={x} y={topY} width="1" height="2" fill={base} className="pixel" />);
        if ((x - headX) % 5 === 0) {
          elements.push(<rect key={`band-hl-${x}`} x={x} y={topY} width="1" height="1" fill={hl} className="pixel" />);
        }
      }
    }

    return elements;
  }, [
    useEquippedItems,
    character.equippedItems,
    appearanceWithDefaults.headgear,
    appearanceWithDefaults.palette.accent,
    appearanceWithDefaults.palette.secondary,
    headDim.width,
    headDim.height,
    headX,
    headY,
    isWealthy,
    isNoble,
    skinTone,
    seed
  ]);

  return <g key="headgear">{headgearElements}</g>;
};

export default HeadgearRenderer;