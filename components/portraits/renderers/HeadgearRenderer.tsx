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

    // CROWNS / CIRCLETS / DIadems / WREATHS - IMPROVED: 3D curved band, proper metalwork
    if (nameContains('crown', 'circlet', 'tiara', 'coronet', 'diadem', 'laurel')) {
      const isLaurel = name.includes('laurel');
      const isCirclet = nameContains('circlet', 'diadem');
      const isTiara = name.includes('tiara');

      // Metal colors with proper shading
      const goldBase = '#FFD700';
      const goldBright = '#FFEC8B';
      const goldLight = '#FFE066';
      const goldShade = '#DAA520';
      const goldDeep = '#B8860B';
      const goldDark = '#8B6914';

      const wreathBase = isLaurel ? '#3E8E41' : goldBase;
      const wreathLight = isLaurel ? '#4CAF50' : goldLight;
      const wreathShade = isLaurel ? '#2E7D32' : goldShade;
      const wreathDeep = isLaurel ? '#1B5E20' : goldDeep;

      // Crown band follows curved head shape (arc) - 3 rows thick for depth
      const bandHeight = isCirclet ? 2 : 3;
      const bandWidth = headDim.width + 2; // Slightly wider than head

      for (let row = 0; row < bandHeight; row++) {
        for (let i = 0; i < bandWidth; i++) {
          const xPos = headX - 1 + i;
          const xNorm = i / bandWidth;

          // Curved arc - rises in the center
          const arcOffset = Math.round(Math.sin(xNorm * Math.PI) * 1.5);
          const yPos = headY - 1 - row - arcOffset;

          // Skip corners for rounded shape
          if (row === 0 && (i === 0 || i === bandWidth - 1)) continue;

          // Metal shading based on position
          let bandColor = wreathBase;
          if (xNorm < 0.12) bandColor = wreathDeep;
          else if (xNorm < 0.22) bandColor = wreathShade;
          else if (xNorm > 0.88) bandColor = wreathDeep;
          else if (xNorm > 0.78) bandColor = wreathShade;
          else if (xNorm > 0.4 && xNorm < 0.6) bandColor = wreathLight;

          // Top row brighter, bottom row darker
          if (row === 0) bandColor = createHighlight(bandColor, 1.08);
          else if (row === bandHeight - 1) bandColor = createShadow(bandColor, 0.85);

          // Metallic texture
          if ((i * 3 + row * 7) % 5 === 0) bandColor = createHighlight(bandColor, 1.06);

          elements.push(
            <rect key={`crown-band-${i}-${row}`} x={xPos} y={yPos} width="1" height="1" fill={bandColor} className="pixel" />
          );

          // Jewels embedded in band for crowns
          if (!isLaurel && row === 1 && ((i - 1) % 5 === 2) && (isNoble || nameContains('jeweled', 'gem', 'ruby', 'emerald', 'sapphire', 'pearl', 'diamond'))) {
            let jewel = '#DC143C';
            let jewelHL = '#FF6B6B';
            if (name.includes('emerald')) { jewel = '#50C878'; jewelHL = '#7CFC00'; }
            else if (name.includes('sapphire')) { jewel = '#0F52BA'; jewelHL = '#4169E1'; }
            else if (name.includes('diamond')) { jewel = '#E0FFFF'; jewelHL = '#FFFFFF'; }
            else if (name.includes('pearl')) { jewel = '#FFF8DC'; jewelHL = '#FFFAFA'; }
            elements.push(
              <rect key={`crown-jewel-${i}`} x={xPos} y={yPos} width="1" height="1" fill={jewel} className="pixel" />,
              <rect key={`crown-jewel-shine-${i}`} x={xPos} y={yPos - 1} width="1" height="1" fill={jewelHL} opacity={0.4} className="pixel" />
            );
          }
        }
      }

      // Crown points (skip for circlet/wreath)
      if (!nameContains('circlet', 'wreath') && !isTiara) {
        const points = 5;
        for (let i = 0; i < points; i++) {
          const px = headX + Math.floor((i + 0.5) * (headDim.width / points));
          const isCenterPoint = i === Math.floor(points / 2);
          const baseHeight = isCenterPoint ? 8 : (i === 0 || i === points - 1 ? 4 : 5 + (i % 2));

          // Each point is 2-3 pixels wide with proper shading
          const pointWidth = isCenterPoint ? 3 : 2;

          for (let h = 0; h < baseHeight; h++) {
            const taperWidth = Math.max(1, pointWidth - Math.floor(h / 3));
            const startX = px - Math.floor(taperWidth / 2);

            for (let pw = 0; pw < taperWidth; pw++) {
              let pointColor = goldBase;
              // Left edge darker, right edge lighter for 3D
              if (pw === 0) pointColor = goldShade;
              else if (pw === taperWidth - 1) pointColor = goldLight;
              // Top lighter
              if (h < 2) pointColor = createHighlight(pointColor, 1.1);
              // Very top bright
              if (h === baseHeight - 1) pointColor = goldBright;

              elements.push(
                <rect key={`crown-pt-${i}-${h}-${pw}`} x={startX + pw} y={headY - 4 - h} width="1" height="1" fill={pointColor} className="pixel" />
              );
            }
          }

          // Jewel at top of center point
          if (isCenterPoint && (isNoble || isWealthy)) {
            elements.push(
              <rect key="crown-top-j-base" x={px - 1} y={headY - 4 - baseHeight} width="3" height="2" fill={goldDeep} className="pixel" />,
              <rect key="crown-top-j" x={px} y={headY - 3 - baseHeight} width="1" height="1" fill="#0F52BA" className="pixel" />,
              <rect key="crown-top-j-shine" x={px} y={headY - 4 - baseHeight} width="1" height="1" fill="#87CEEB" opacity={0.6} className="pixel" />
            );
          }
        }
      }

      // Tiara - delicate upswept arc with filigree
      if (isTiara) {
        const tiaraHeight = 6;
        for (let i = 0; i < headDim.width; i++) {
          const xPos = headX + i;
          const xNorm = i / headDim.width;
          // Arc shape - highest in center
          const arcHeight = Math.round(Math.sin(xNorm * Math.PI) * tiaraHeight);

          if (arcHeight > 0) {
            // Thin elegant wire frame
            for (let h = 0; h < arcHeight; h++) {
              // Only draw at edges and peaks for filigree look
              const isEdge = h === 0 || h === arcHeight - 1;
              const isFrame = (i % 3 === 0) || isEdge;

              if (isFrame) {
                let color = goldBase;
                if (h === arcHeight - 1) color = goldBright;
                else if (xNorm < 0.2 || xNorm > 0.8) color = goldShade;
                elements.push(
                  <rect key={`tiara-${i}-${h}`} x={xPos} y={headY - 3 - h} width="1" height="1" fill={color} className="pixel" />
                );
              }
            }

            // Gems at peaks
            if (arcHeight > 3 && i % 4 === 2 && (isNoble || isWealthy)) {
              elements.push(
                <rect key={`tiara-gem-${i}`} x={xPos} y={headY - 3 - arcHeight + 1} width="1" height="1" fill="#DC143C" className="pixel" />
              );
            }
          }
        }
      }

      // Laurel wreath - realistic overlapping leaves
      if (isLaurel) {
        const leafPairs = 4;
        for (let i = 0; i < leafPairs; i++) {
          const baseX = headX + Math.floor((i + 0.5) * (headDim.width / leafPairs));

          // Left-angled leaf
          for (let ly = 0; ly < 4; ly++) {
            const lx = baseX - ly;
            let leafColor = ly === 0 ? wreathLight : (ly === 3 ? wreathDeep : wreathBase);
            elements.push(
              <rect key={`leaf-l-${i}-${ly}`} x={lx} y={headY - 3 - ly} width="1" height="1" fill={leafColor} className="pixel" />
            );
          }

          // Right-angled leaf
          for (let ly = 0; ly < 4; ly++) {
            const lx = baseX + ly;
            let leafColor = ly === 0 ? wreathLight : (ly === 3 ? wreathDeep : wreathBase);
            elements.push(
              <rect key={`leaf-r-${i}-${ly}`} x={lx} y={headY - 3 - ly} width="1" height="1" fill={leafColor} className="pixel" />
            );
          }
        }

        // Central tie/ribbon
        elements.push(
          <rect key="laurel-tie" x={headX + Math.floor(headDim.width / 2) - 1} y={headY - 2} width="2" height="1" fill="#8B0000" className="pixel" />
        );
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
            elements.push(<rect key={`peak-${i}-${j}`} x={px + j} y={peakY - i} width="1" height="1" fill={turbanLight} className="pixel" />);
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

    // COIF & MEDIEVAL FITTED CAPS (coif, biggins, topi/pith helmet, zukin)
    else if (nameContains('coif', 'biggins', 'topi', 'pith', 'zukin')) {
      const isCoif = nameContains('coif');
      const isBiggins = nameContains('biggins');
      const isTopi = nameContains('topi', 'pith'); // Topi = pith helmet
      const isZukin = nameContains('zukin');

      // Different base colors for different types
      let coifColor = base;
      if (isCoif && (material.includes('white') || material.includes('linen'))) {
        coifColor = '#F5F5DC'; // Natural linen for medieval coif
      } else if (isTopi) {
        coifColor = '#F5DEB3'; // Tan/khaki for pith helmet
      } else if (isZukin) {
        coifColor = '#1A1A2E'; // Deep navy/black for ninja hood
      }

      const coifShade = createShadow(coifColor, 0.75);
      const coifDeepShade = createShadow(coifColor, 0.6);
      const coifHighlight = createHighlight(coifColor, 1.15);
      const coifBrightHighlight = createHighlight(coifColor, 1.25);

      if (isTopi) {
        // === PITH HELMET / TOPI - Colonial sun helmet ===
        // High domed crown with wide brim
        const topiTop = headY - 8;
        const domeHeight = 8;
        const crownWidth = headDim.width + 4;

        // Dome crown - high rounded shape
        for (let y = topiTop; y < topiTop + domeHeight; y++) {
          const yProgress = (y - topiTop) / domeHeight;
          // Elliptical dome shape
          const rowWidth = Math.floor(crownWidth * Math.sin(Math.acos(1 - yProgress)));
          const startX = centerX - Math.floor(rowWidth / 2);

          for (let x = 0; x < rowWidth; x++) {
            const xNorm = x / rowWidth;
            let col = coifColor;

            // 3D shading on dome
            const sphereX = (xNorm - 0.5) * 2;
            const sphereY = (yProgress - 0.3);
            const intensity = Math.sqrt(Math.max(0, 1 - sphereX * sphereX - sphereY * sphereY));

            if (intensity > 0.85) col = coifBrightHighlight;
            else if (intensity > 0.6) col = coifHighlight;
            else if (xNorm < 0.15 || xNorm > 0.85) col = coifDeepShade;
            else if (xNorm < 0.25 || xNorm > 0.75) col = coifShade;

            elements.push(<rect key={`topi-dome-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Wide brim - flat with slight curve
        const brimY = topiTop + domeHeight;
        const brimWidth = headDim.width + 10;
        const brimDepth = 3;

        for (let by = 0; by < brimDepth; by++) {
          const brimRowWidth = brimWidth - by; // Slight taper
          const startX = centerX - Math.floor(brimRowWidth / 2);

          for (let bx = 0; bx < brimRowWidth; bx++) {
            const xNorm = bx / brimRowWidth;
            let col = coifShade;

            if (by === 0 && xNorm > 0.3 && xNorm < 0.7) col = coifColor;
            if (by === brimDepth - 1) col = coifDeepShade;
            if (bx === 0 || bx === brimRowWidth - 1) col = coifDeepShade;

            elements.push(<rect key={`topi-brim-${bx}-${by}`} x={startX + bx} y={brimY + by} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Hat band
        for (let bx = 0; bx < crownWidth - 2; bx++) {
          elements.push(<rect key={`topi-band-${bx}`} x={centerX - Math.floor((crownWidth - 2) / 2) + bx} y={brimY - 1} width="1" height="1" fill="#654321" className="pixel" />);
        }

      } else if (isZukin) {
        // === ZUKIN - Japanese hood/head covering ===
        // Fitted to head, covers forehead, ties under chin
        const zukinTop = headY - 4;
        const zukinHeight = headDim.height + 6;

        for (let y = zukinTop; y < zukinTop + zukinHeight; y++) {
          const yProgress = (y - zukinTop) / zukinHeight;

          // Calculate width - fitted to head shape
          let width;
          if (yProgress < 0.15) {
            // Top - rounded
            width = Math.floor(headDim.width * (0.5 + yProgress * 3));
          } else if (yProgress < 0.7) {
            // Main head area
            width = headDim.width + 2;
          } else {
            // Bottom - tapers for chin area
            width = Math.floor((headDim.width + 2) * (1 - (yProgress - 0.7) * 1.5));
          }

          const startX = centerX - Math.floor(width / 2);

          for (let x = 0; x < width; x++) {
            const xNorm = x / width;

            // Face opening - larger than coif
            if (yProgress > 0.25 && yProgress < 0.85) {
              const faceMargin = 3;
              if (x > faceMargin && x < width - faceMargin) continue;
            }

            let col = coifColor;

            // Subtle shading for dark fabric
            if (x === 0 || x === width - 1) col = coifDeepShade;
            else if (xNorm < 0.2) col = coifShade;
            else if (xNorm > 0.8) col = createShadow(coifColor, 0.65);
            else if (yProgress < 0.1 && xNorm > 0.35 && xNorm < 0.65) col = coifHighlight;

            elements.push(<rect key={`zukin-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Ties hanging down
        const tieY = zukinTop + zukinHeight - 2;
        for (let ty = 0; ty < 4; ty++) {
          elements.push(
            <rect key={`zukin-tie-l-${ty}`} x={centerX - 6} y={tieY + ty} width="1" height="1" fill={coifShade} className="pixel" />,
            <rect key={`zukin-tie-r-${ty}`} x={centerX + 5} y={tieY + ty} width="1" height="1" fill={coifShade} className="pixel" />
          );
        }

      } else {
        // === COIF / BIGGINS - Medieval fitted cap ===
        // Soft linen cap that follows natural head shape with chin strap
        const coifTop = headY - 6;
        const coifHeight = headDim.height + (isBiggins ? 3 : 8);

        // First pass: render the main coif body
        for (let y = coifTop; y < coifTop + coifHeight; y++) {
          const yProgress = (y - coifTop) / coifHeight;

          // Natural skull-following curve using semicircle formula for dome
          let width;
          if (yProgress < 0.25) {
            // Top dome - semicircular curve following skull
            const domeT = yProgress / 0.25;
            const domeWidth = Math.sqrt(1 - Math.pow(1 - domeT, 2)); // Semicircle
            width = Math.floor((headDim.width + 2) * (0.3 + domeWidth * 0.75));
          } else if (yProgress < 0.55) {
            // Temple/ear area - widest part, slight bulge for gathering
            const bulge = Math.sin((yProgress - 0.25) / 0.3 * Math.PI) * 2;
            width = headDim.width + 4 + Math.floor(bulge);
          } else if (yProgress < 0.75) {
            // Cheek area - starts to narrow
            const taperProgress = (yProgress - 0.55) / 0.2;
            width = Math.floor((headDim.width + 4) * (1 - taperProgress * 0.15));
          } else {
            // Chin area - significant taper for chin strap
            const chinProgress = (yProgress - 0.75) / 0.25;
            width = Math.floor((headDim.width + 2) * (0.85 - chinProgress * 0.4));
          }

          const startX = centerX - Math.floor(width / 2);

          for (let x = 0; x < width; x++) {
            const xNorm = x / width;

            // Face opening - elliptical for natural framing
            if (yProgress > 0.28 && yProgress < 0.78) {
              const faceMargin = isBiggins ? 3 : 4;
              // Curved face opening (not rectangular)
              const faceCenterProgress = Math.abs(yProgress - 0.53) / 0.25;
              const adjustedMargin = faceMargin + Math.floor((1 - faceCenterProgress) * 2);
              if (x > adjustedMargin && x < width - adjustedMargin) continue;
            }

            let col = coifColor;

            // Strong cylindrical 3D shading for fabric depth
            if (xNorm < 0.08) col = coifDeepShade;
            else if (xNorm < 0.18) col = coifShade;
            else if (xNorm > 0.92) col = coifDeepShade;
            else if (xNorm > 0.82) col = coifShade;
            else if (xNorm > 0.4 && xNorm < 0.6 && yProgress < 0.2) col = coifBrightHighlight;
            else if (xNorm > 0.35 && xNorm < 0.65 && yProgress < 0.28) col = coifHighlight;

            // Horizontal stitch lines every 3 rows for linen texture
            const isStitchRow = (y - coifTop) % 3 === 0;
            if (isStitchRow && yProgress > 0.1 && yProgress < 0.9) {
              if (col === coifColor) col = createShadow(coifColor, 0.88);
            }

            // Vertical gathered folds at temples (sides)
            if (yProgress > 0.3 && yProgress < 0.7) {
              const foldPattern = (y + x * 2) % 5;
              if ((xNorm < 0.25 || xNorm > 0.75) && foldPattern === 0) {
                col = createShadow(col, 0.85);
              } else if ((xNorm < 0.25 || xNorm > 0.75) && foldPattern === 2) {
                col = createHighlight(col, 1.08);
              }
            }

            // Subtle linen weave texture
            if (isCoif) {
              const weaveX = x % 2;
              const weaveY = y % 2;
              if (weaveX === weaveY && col === coifColor) {
                col = createShadow(coifColor, 0.95);
              }
            }

            elements.push(<rect key={`coif-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Chin strap for coif (wraps under chin)
        if (isCoif) {
          const chinStrapY = headY + headDim.height - 2;
          const strapWidth = headDim.width - 4;
          const strapHeight = 3;

          // Main chin strap band
          for (let sy = 0; sy < strapHeight; sy++) {
            const rowWidth = strapWidth - sy; // Slight taper
            const startX = centerX - Math.floor(rowWidth / 2);

            for (let sx = 0; sx < rowWidth; sx++) {
              const sxNorm = sx / rowWidth;
              let col = coifColor;

              // Curved shading for strap depth
              if (sy === 0) col = coifShade;
              else if (sy === strapHeight - 1) col = coifDeepShade;
              else if (sxNorm < 0.15 || sxNorm > 0.85) col = coifShade;
              else col = coifColor;

              // Stitch detail on strap
              if (sx % 3 === 0 && sy === 1) col = createShadow(col, 0.9);

              elements.push(<rect key={`coif-strap-${sx}-${sy}`} x={startX + sx} y={chinStrapY + sy} width="1" height="1" fill={col} className="pixel" />);
            }
          }

          // Tie ends hanging down from sides
          const tieStartY = chinStrapY + strapHeight;
          const tieLength = 4;

          // Left tie
          for (let ty = 0; ty < tieLength; ty++) {
            const sway = Math.sin(ty * 0.5) * 0.5;
            const tieCol = ty === 0 ? coifShade : ty === tieLength - 1 ? coifDeepShade : coifColor;
            elements.push(<rect key={`coif-tie-l-${ty}`} x={centerX - 5 + sway} y={tieStartY + ty} width="2" height="1" fill={tieCol} className="pixel" />);
          }

          // Right tie
          for (let ty = 0; ty < tieLength; ty++) {
            const sway = Math.sin(ty * 0.5 + 1) * 0.5;
            const tieCol = ty === 0 ? coifShade : ty === tieLength - 1 ? coifDeepShade : coifColor;
            elements.push(<rect key={`coif-tie-r-${ty}`} x={centerX + 3 + sway} y={tieStartY + ty} width="2" height="1" fill={tieCol} className="pixel" />);
          }

          // Small knot detail at center of strap
          elements.push(
            <rect key={`coif-knot-1`} x={centerX - 1} y={chinStrapY + 1} width="2" height="1" fill={coifDeepShade} className="pixel" />,
            <rect key={`coif-knot-2`} x={centerX} y={chinStrapY + 2} width="1" height="1" fill={coifShade} className="pixel" />
          );
        }

        // Biggins gets simpler treatment - just a fitted cap without ties
        if (isBiggins) {
          // Add a simple hem at the bottom edge
          const hemY = coifTop + coifHeight - 1;
          for (let hx = -3; hx <= 3; hx++) {
            elements.push(<rect key={`biggins-hem-${hx}`} x={centerX + hx} y={hemY} width="1" height="1" fill={coifDeepShade} className="pixel" />);
          }
        }
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
        // === HEAD WRAP / GELE - Towering wrapped fabric headdress ===
        // African-style head wrap with height, volume, and elaborate folds

        const wrapTop = headY - 10; // Start high above head
        const wrapHeight = 12;      // Tall wrap
        const wrapBaseWidth = headDim.width + 4;

        // Main wrap body - horizontal wrapped layers
        for (let y = wrapTop; y < wrapTop + wrapHeight; y++) {
          const yProgress = (y - wrapTop) / wrapHeight;
          const wrapLayer = Math.floor((y - wrapTop) / 2); // Which wrap band we're in

          // Width varies - creates sculptural dome shape
          let width;
          if (yProgress < 0.25) {
            // Top - narrower, rounded
            width = wrapBaseWidth + 2 + Math.floor(yProgress * 16);
          } else if (yProgress < 0.6) {
            // Middle - widest
            width = wrapBaseWidth + 6;
          } else {
            // Lower - tapers to head
            const taper = (yProgress - 0.6) / 0.4;
            width = wrapBaseWidth + 6 - Math.floor(taper * 4);
          }

          const startX = centerX - Math.floor(width / 2);

          for (let x = 0; x < width; x++) {
            const xPos = startX + x;
            const xNorm = x / width;

            // Strong cylindrical 3D shading
            let col;
            if (xNorm < 0.08) {
              col = wrapDarkest;
            } else if (xNorm < 0.18) {
              col = wrapDeep;
            } else if (xNorm < 0.30) {
              col = wrapShade;
            } else if (xNorm > 0.92) {
              col = wrapDarkest;
            } else if (xNorm > 0.82) {
              col = wrapDeep;
            } else if (xNorm > 0.70) {
              col = wrapShade;
            } else if (xNorm > 0.42 && xNorm < 0.58) {
              col = wrapVeryLight; // Center highlight stripe
            } else if (xNorm > 0.35 && xNorm < 0.65) {
              col = wrapLight;
            } else {
              col = wrapBase;
            }

            // Horizontal wrap seams - every 2 rows alternate light/dark
            const isSeamRow = (y - wrapTop) % 2 === 1;
            if (isSeamRow) {
              col = createShadow(col, 0.7); // Strong shadow for seam
            }

            // Vertical gathered folds
            const foldIndex = Math.abs(x - width / 2);
            if (foldIndex % 4 === 0 && !isSeamRow) {
              col = createShadow(col, 0.8);
            } else if (foldIndex % 4 === 2 && !isSeamRow) {
              col = createHighlight(col, 1.15);
            }

            // Decorative accent band in middle section
            if (wrapLayer === 2 || wrapLayer === 3) {
              if (x % 3 === 0) {
                col = accentColor;
              } else if (x % 3 === 1) {
                col = createShadow(accentColor, 0.8);
              }
            }

            elements.push(<rect key={`wrap-main-${x}-${y}`} x={xPos} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Side wings/draping (fabric extending outward)
        for (let side = 0; side < 2; side++) {
          const sideSign = side === 0 ? -1 : 1;
          const wingBaseX = centerX + sideSign * Math.floor(wrapBaseWidth / 2 + 2);
          const wingTop = wrapTop + 3;
          const wingHeight = 8;

          for (let wy = 0; wy < wingHeight; wy++) {
            const y = wingTop + wy;
            // Wing gets narrower as it goes down
            const wingWidth = Math.max(1, 5 - Math.floor(wy / 2));

            for (let wx = 0; wx < wingWidth; wx++) {
              const x = wingBaseX + sideSign * wx;

              // Shading based on position
              let col;
              if (wx === 0) {
                col = side === 0 ? wrapLight : wrapShade;
              } else if (wx === wingWidth - 1) {
                col = wrapDeep;
              } else {
                col = wrapBase;
              }

              // Fold lines
              if ((wy + wx) % 2 === 0) {
                col = createShadow(col, 0.85);
              }

              elements.push(<rect key={`wing-${side}-${wx}-${wy}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }

        // Top gathered knot/rosette
        const knotCenterX = centerX;
        const knotCenterY = wrapTop + 1;
        const knotRadius = 3;

        for (let ky = -knotRadius; ky <= knotRadius; ky++) {
          for (let kx = -knotRadius; kx <= knotRadius; kx++) {
            const dist = Math.sqrt(kx * kx + ky * ky);
            if (dist <= knotRadius) {
              const normalizedDist = dist / knotRadius;
              let knotCol;
              if (normalizedDist < 0.3) {
                knotCol = wrapVeryLight;
              } else if (normalizedDist < 0.6) {
                knotCol = wrapLight;
              } else {
                knotCol = wrapBase;
              }
              // Spiral texture
              const angle = Math.atan2(ky, kx);
              if (Math.floor(angle * 3 + dist * 2) % 2 === 0) {
                knotCol = createShadow(knotCol, 0.85);
              }
              elements.push(<rect key={`knot-${kx}-${ky}`} x={knotCenterX + kx} y={knotCenterY + ky} width="1" height="1" fill={knotCol} className="pixel" />);
            }
          }
        }

        // Dark outline for definition
        const outlineColor = createShadow(wrapBase, 0.4);
        // Top edge
        for (let x = -Math.floor(wrapBaseWidth / 2 + 1); x <= Math.floor(wrapBaseWidth / 2 + 1); x++) {
          elements.push(<rect key={`outline-top-${x}`} x={centerX + x} y={wrapTop - 1} width="1" height="1" fill={outlineColor} className="pixel" />);
        }
        // Side edges
        for (let y = wrapTop; y < wrapTop + wrapHeight; y++) {
          elements.push(
            <rect key={`outline-left-${y}`} x={centerX - Math.floor(wrapBaseWidth / 2) - 3} y={y} width="1" height="1" fill={outlineColor} className="pixel" />,
            <rect key={`outline-right-${y}`} x={centerX + Math.floor(wrapBaseWidth / 2) + 3} y={y} width="1" height="1" fill={outlineColor} className="pixel" />
          );
        }

      } else if (isKeffiyeh) {
        // === KEFFIYEH - Traditional Middle Eastern headdress ===
        // Square cloth folded diagonally, draped over head with agal (rope)
        const keffiyehTop = headY - 5;
        const keffiyehHeight = headDim.height + 8;

        // Main head covering
        for (let y = keffiyehTop; y < keffiyehTop + keffiyehHeight; y++) {
          const yProgress = (y - keffiyehTop) / keffiyehHeight;

          // Width expands as it drapes down shoulders
          let width;
          if (yProgress < 0.25) {
            // Top - fitted to head
            width = headDim.width + 4;
          } else {
            // Draping down - widens
            width = headDim.width + 4 + Math.floor((yProgress - 0.25) * 16);
          }

          const startX = centerX - Math.floor(width / 2);

          for (let x = 0; x < width; x++) {
            const xPos = startX + x;
            const xNorm = x / width;
            const dx = xPos - centerX;

            // Face opening (front only)
            if (yProgress > 0.15 && yProgress < 0.65) {
              const faceWidth = headDim.width / 2 - 2;
              if (Math.abs(dx) < faceWidth) continue;
            }

            let col = wrapBase;

            // Keffiyeh checkered pattern
            const checkX = Math.floor((x + y) / 3) % 2;
            const checkY = Math.floor((y) / 3) % 2;
            if ((checkX + checkY) % 2 === 1) {
              col = createShadow(wrapBase, 0.6); // Dark squares
            }

            // Side shading
            if (xNorm < 0.1) col = createShadow(col, 0.7);
            else if (xNorm > 0.9) col = createShadow(col, 0.6);
            else if (xNorm < 0.2) col = createShadow(col, 0.85);
            else if (xNorm > 0.8) col = createShadow(col, 0.8);

            // Draping fold shadows
            if (yProgress > 0.5 && Math.abs(dx) % 5 === 0) {
              col = createShadow(col, 0.9);
            }

            elements.push(<rect key={`keffiyeh-${x}-${y}`} x={xPos} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Agal (black rope holding keffiyeh)
        const agalY = headY - 2;
        const agalWidth = headDim.width + 2;
        for (let ax = 0; ax < agalWidth; ax++) {
          const xPos = centerX - Math.floor(agalWidth / 2) + ax;
          const xNorm = ax / agalWidth;

          // Double rope effect
          for (let row = 0; row < 2; row++) {
            let col = '#1A1A1A';
            if (xNorm > 0.4 && xNorm < 0.6) col = '#333333'; // Highlight on top
            if (ax % 3 === 0) col = createHighlight(col, 1.2); // Rope texture

            elements.push(<rect key={`agal-${ax}-${row}`} x={xPos} y={agalY + row} width="1" height="1" fill={col} className="pixel" />);
          }
        }

      } else if (nameContains('mantilla')) {
        // === MANTILLA - Spanish lace veil ===
        // Delicate lace draped over head, often over a comb
        const mantillaTop = headY - 4;
        const mantillaHeight = headDim.height + 10;

        for (let y = mantillaTop; y < mantillaTop + mantillaHeight; y++) {
          const yProgress = (y - mantillaTop) / mantillaHeight;

          // Elegant draping shape
          let width = headDim.width + 6 + Math.floor(yProgress * 8);
          const startX = centerX - Math.floor(width / 2);

          for (let x = 0; x < width; x++) {
            const xPos = startX + x;
            const xNorm = x / width;
            const dx = xPos - centerX;

            // Face opening
            if (yProgress > 0.15 && yProgress < 0.6) {
              if (Math.abs(dx) < headDim.width / 2 - 1) continue;
            }

            // Lace pattern - semi-transparent with pattern
            const lacePattern = ((x * 2 + y * 3) % 5 === 0) || ((x + y * 2) % 4 === 0);
            if (!lacePattern && yProgress > 0.3) continue; // Holes in lace

            let col = wrapBase;

            // Delicate shading
            if (xNorm < 0.15 || xNorm > 0.85) col = wrapShade;
            else if (yProgress < 0.1 && xNorm > 0.35 && xNorm < 0.65) col = wrapVeryLight;

            // Scalloped edge effect
            if (yProgress > 0.9) {
              const scallop = Math.sin((x / 3) * Math.PI);
              if (scallop < 0.3) continue;
            }

            elements.push(<rect key={`mantilla-${x}-${y}`} x={xPos} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Ornate hair comb
        const combY = headY - 3;
        for (let cx = -3; cx <= 3; cx++) {
          elements.push(
            <rect key={`comb-base-${cx}`} x={centerX + cx} y={combY} width="1" height="2" fill="#8B4513" className="pixel" />,
            <rect key={`comb-teeth-${cx}`} x={centerX + cx} y={combY + 2} width="1" height="2" fill="#654321" className="pixel" />
          );
        }

      } else {
        // === HIJAB / DUPATTA / GENERIC VEIL - Smooth draped covering ===
        const hijabTop = headY - 5;
        const hijabHeight = headDim.height + 10;

        for (let y = hijabTop; y < hijabTop + hijabHeight; y++) {
          const yProgress = (y - hijabTop) / hijabHeight;

          // Smooth draping shape
          let width;
          if (yProgress < 0.2) {
            // Top - fitted
            width = headDim.width + 2;
          } else if (yProgress < 0.5) {
            // Middle - slightly wider
            width = headDim.width + 4;
          } else {
            // Bottom - drapes down shoulders
            width = headDim.width + 4 + Math.floor((yProgress - 0.5) * 12);
          }

          const startX = centerX - Math.floor(width / 2);

          for (let x = 0; x < width; x++) {
            const xPos = startX + x;
            const xNorm = x / width;
            const dx = xPos - centerX;

            // Face opening (oval shape)
            if (yProgress > 0.12 && yProgress < 0.6) {
              const faceWidth = headDim.width / 2 - 1;
              if (Math.abs(dx) < faceWidth) continue;
            }

            let col = wrapBase;

            // Smooth fabric shading
            if (x === 0 || x === width - 1) col = wrapDarkest;
            else if (xNorm < 0.1) col = wrapDeep;
            else if (xNorm > 0.9) col = wrapDeep;
            else if (xNorm < 0.2) col = wrapShade;
            else if (xNorm > 0.8) col = wrapShade;
            else if (yProgress < 0.15 && xNorm > 0.35 && xNorm < 0.65) col = wrapVeryLight;
            else if (xNorm > 0.4 && xNorm < 0.6) col = wrapLight;

            // Subtle fabric texture
            const textureNoise = (x * 11 + y * 7) % 23;
            if (textureNoise === 0) col = createHighlight(col, 1.05);
            else if (textureNoise === 11) col = createShadow(col, 0.95);

            // Gentle draping folds
            if (yProgress > 0.4 && Math.abs(dx) % 7 === 0) {
              col = createShadow(col, 0.92);
            }

            elements.push(<rect key={`hijab-${x}-${y}`} x={xPos} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Decorative pin for wealthy
        if (isWealthy) {
          const pinY = headY + 2;
          const pinX = centerX - headDim.width / 2 + 2;
          // Ornate pin
          elements.push(
            <rect key="hijab-pin-1" x={pinX} y={pinY} width="2" height="2" fill="#FFD700" className="pixel" />,
            <rect key="hijab-pin-2" x={pinX} y={pinY} width="1" height="1" fill="#FFFFFF" opacity={0.7} className="pixel" />,
            <rect key="hijab-pin-gem" x={pinX + 1} y={pinY + 1} width="1" height="1" fill={accentColor} className="pixel" />
          );
        }
      }
    }

    // HOODS / WIMPLE
    else if (nameContains('hood', 'wimple')) {
      // Hood/wimple with proper fabric draping, 3D depth, and cloth texture
      const hoodBase = base || '#4A4A4A';
      const hoodVeryLight = createHighlight(hoodBase, 1.2);
      const hoodLight = createHighlight(hoodBase, 1.1);
      const hoodShade = createShadow(hoodBase, 0.82);
      const hoodDeep = createShadow(hoodBase, 0.65);
      const hoodDarkest = createShadow(hoodBase, 0.5);

      const isWimple = name.includes('wimple');
      const hoodDepth = isWimple ? 12 : 10;
      const hoodWidth = headDim.width / 2 + 6;

      for (let y = headY - 7; y < headY + hoodDepth; y++) {
        const dTop = y - (headY - 7);
        const yNorm = dTop / (hoodDepth + 7);

        for (let x = headX - 7; x < headX + headDim.width + 7; x++) {
          const dx = Math.abs(x - centerX);
          const xFromCenter = x - centerX;

          // Hood shape expands as it goes down
          const currentHoodW = hoodWidth + Math.min(5, dTop * 0.4);

          // Face opening (elliptical shape)
          const faceOpenYStart = headY + 1;
          const faceOpenYEnd = headY + headDim.height - 3;
          const faceOpenWidth = headDim.width / 2 - 2;
          const inFaceArea = y > faceOpenYStart && y < faceOpenYEnd && dx < faceOpenWidth;

          if (!inFaceArea && dx < currentHoodW) {
            const depthFromEdge = currentHoodW - dx;
            const xNorm = dx / currentHoodW;
            let col = hoodBase;

            // 3D shading based on position
            // Outer edges are darkest (depth)
            if (depthFromEdge < 2) {
              col = hoodDarkest;
            } else if (depthFromEdge < 4) {
              col = hoodDeep;
            }
            // Top of hood catches light
            else if (dTop < 4 && xNorm < 0.6) {
              col = hoodLight;
              if (dTop < 2 && xNorm < 0.4) col = hoodVeryLight;
            }
            // Side shading (light from left)
            else if (xFromCenter > 0 && xNorm > 0.4) {
              col = hoodShade; // Right side in shadow
            }

            // Inner rim around face opening - very dark
            if (y > faceOpenYStart - 1 && y < faceOpenYEnd + 1) {
              if (dx >= faceOpenWidth - 1 && dx < faceOpenWidth + 2) {
                col = hoodDarkest; // Deep shadow at face opening edge
              }
            }
            // Top rim of face opening
            if (y >= faceOpenYStart - 2 && y <= faceOpenYStart && dx < faceOpenWidth + 3) {
              col = hoodDeep;
            }

            // Cloth fold/drape texture
            const foldPattern = ((x + y * 2) % 8);
            if (foldPattern === 0 || foldPattern === 4) {
              col = createHighlight(col, 1.06); // Fold ridge
            } else if (foldPattern === 2 || foldPattern === 6) {
              col = createShadow(col, 0.94); // Fold valley
            }

            // Fabric weave texture
            if ((x * 3 + y * 5) % 11 === 0) {
              col = createHighlight(col, 1.04);
            } else if ((x * 7 + y * 3) % 13 === 0) {
              col = createShadow(col, 0.97);
            }

            elements.push(<rect key={`hood-${x}-${y}`} x={x} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }

      // Decorative trim for wealthy
      if (isWealthy) {
        const trimColor = '#FFD700';
        const trimHL = createHighlight(trimColor, 1.2);
        for (let y = headY + 2; y < headY + headDim.height - 3; y++) {
          const trimShade = y % 2 === 0 ? trimColor : trimHL;
          elements.push(
            <rect key={`hood-trim-l-${y}`} x={headX - 4} y={y} width="1" height="1" fill={trimShade} className="pixel" />,
            <rect key={`hood-trim-r-${y}`} x={headX + headDim.width + 3} y={y} width="1" height="1" fill={trimShade} className="pixel" />
          );
        }
      }

      // Wimple chin drape
      if (isWimple) {
        const chinY = headY + headDim.height - 2;
        for (let x = headX - 2; x < headX + headDim.width + 2; x++) {
          const xNorm = (x - headX) / headDim.width;
          let col = hoodBase;
          if (xNorm < 0.3 || xNorm > 0.7) col = hoodShade;
          if (xNorm > 0.4 && xNorm < 0.6) col = hoodLight;
          elements.push(<rect key={`wimple-chin-${x}`} x={x} y={chinY} width="1" height="2" fill={col} className="pixel" />);
        }
      }
    }

    // MODERN HELMETS (army helmet, combat helmet, motorcycle helmet)
    else if (name.includes('army helmet') || name.includes('combat helmet') || name.includes('military helmet') || name.includes('motorcycle helmet') || name.includes('bike helmet')) {
      const isMotorcycle = name.includes('motorcycle') || name.includes('bike');
      const isCombat = name.includes('combat');

      // Different colors for different helmet types
      let helmetColor;
      if (isMotorcycle) {
        helmetColor = '#1A1A1A'; // Black for motorcycle
      } else if (isCombat) {
        helmetColor = '#4A5F3E'; // Olive drab
      } else {
        helmetColor = '#5C6B4A'; // Army green
      }

      const helmetBright = createHighlight(helmetColor, 1.35);
      const helmetHighlight = createHighlight(helmetColor, 1.2);
      const helmetShade = createShadow(helmetColor, 0.8);
      const helmetDeep = createShadow(helmetColor, 0.6);

      if (isMotorcycle) {
        // === MOTORCYCLE HELMET - Full face coverage with visor ===
        const helmTop = headY - 7;
        const helmHeight = headDim.height + 5;

        for (let y = helmTop; y < helmTop + helmHeight; y++) {
          const yProgress = (y - helmTop) / helmHeight;

          // Rounded aerodynamic shape
          let width;
          if (yProgress < 0.15) {
            // Top dome
            width = Math.floor(headDim.width * (0.6 + yProgress * 2.5));
          } else if (yProgress < 0.8) {
            // Main body
            width = headDim.width + 6;
          } else {
            // Chin bar tapers
            width = Math.floor((headDim.width + 6) * (1 - (yProgress - 0.8) * 2));
          }

          const startX = centerX - Math.floor(width / 2);

          for (let x = 0; x < width; x++) {
            const xNorm = x / width;
            const dx = startX + x - centerX;

            // Visor opening (eye area only)
            if (yProgress > 0.3 && yProgress < 0.55) {
              if (Math.abs(dx) < headDim.width / 2 - 1) {
                // Draw tinted visor
                elements.push(<rect key={`visor-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill="#2A2A3A" opacity={0.85} className="pixel" />);
                continue;
              }
            }

            let col = helmetColor;

            // Smooth 3D shading
            const sphereX = (xNorm - 0.5) * 2;
            const sphereY = (yProgress - 0.3);
            const intensity = Math.sqrt(Math.max(0, 1 - sphereX * sphereX * 0.8 - sphereY * sphereY * 0.5));

            if (intensity > 0.85) col = helmetBright;
            else if (intensity > 0.65) col = helmetHighlight;
            else if (xNorm < 0.1 || xNorm > 0.9) col = helmetDeep;
            else if (xNorm < 0.2 || xNorm > 0.8) col = helmetShade;

            // Glossy highlight streak
            if (yProgress < 0.25 && xNorm > 0.3 && xNorm < 0.5) {
              col = helmetBright;
            }

            elements.push(<rect key={`moto-helm-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }

      } else {
        // === ARMY/COMBAT HELMET - Classic dome shape ===
        const helmTop = headY - 6;
        const helmHeight = 10;

        for (let y = helmTop; y < helmTop + helmHeight; y++) {
          const yProgress = (y - helmTop) / helmHeight;

          // Characteristic rounded dome with slight flare at bottom
          let width;
          if (yProgress < 0.3) {
            // Rounded top
            width = Math.floor((headDim.width + 4) * (0.5 + yProgress * 1.5));
          } else if (yProgress < 0.8) {
            // Full width
            width = headDim.width + 6;
          } else {
            // Slight flare at rim
            width = headDim.width + 6 + Math.floor((yProgress - 0.8) * 4);
          }

          const startX = centerX - Math.floor(width / 2);

          for (let x = 0; x < width; x++) {
            const xNorm = x / width;
            let col = helmetColor;

            // 3D dome shading
            if (x === 0 || x === width - 1) col = helmetDeep;
            else if (xNorm < 0.15) col = helmetShade;
            else if (xNorm > 0.85) col = helmetDeep;
            else if (yProgress < 0.2 && xNorm > 0.3 && xNorm < 0.6) col = helmetBright;
            else if (xNorm > 0.25 && xNorm < 0.45) col = helmetHighlight;

            // Matte texture
            const textureNoise = (x * 7 + y * 11) % 19;
            if (textureNoise === 0) col = createShadow(col, 0.95);

            elements.push(<rect key={`army-helm-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Helmet rim
        const rimY = helmTop + helmHeight - 1;
        const rimWidth = headDim.width + 8;
        for (let rx = 0; rx < rimWidth; rx++) {
          elements.push(<rect key={`helm-rim-${rx}`} x={centerX - Math.floor(rimWidth / 2) + rx} y={rimY} width="1" height="1" fill={helmetShade} className="pixel" />);
        }

        // Chin strap
        for (let sy = 0; sy < 4; sy++) {
          elements.push(
            <rect key={`chin-l-${sy}`} x={headX + 1} y={headY + headDim.height - 6 + sy} width="1" height="1" fill="#3A3A2A" className="pixel" />,
            <rect key={`chin-r-${sy}`} x={headX + headDim.width - 2} y={headY + headDim.height - 6 + sy} width="1" height="1" fill="#3A3A2A" className="pixel" />
          );
        }

        // Combat helmet extras (NVG mount, camo cover)
        if (isCombat) {
          // NVG mount on front
          elements.push(
            <rect key="nvg-mount-1" x={centerX - 2} y={helmTop + 2} width="4" height="2" fill="#2A2A2A" className="pixel" />,
            <rect key="nvg-mount-2" x={centerX - 1} y={helmTop + 1} width="2" height="1" fill="#1A1A1A" className="pixel" />
          );
        }
      }
    }
    // MEDIEVAL HELMETS (metallic) - with proper metal sheen and 3D form
    else if (nameContains('helmet', 'helm', 'spangenhelm', 'salet', 'sallet', 'great helm', 'norman', 'knight', 'kabuto', 'samurai')) {
      const isGreatHelm = nameContains('great helm', 'great');
      const isSpangenhelm = nameContains('spangenhelm', 'spangen');
      const isSallet = nameContains('salet', 'sallet');
      const isNorman = nameContains('norman');
      const isKabuto = nameContains('kabuto', 'samurai');

      const metalBase =
        material.includes('bronze') ? '#CD7F32' :
        material.includes('brass') ? '#B5A642' :
        isKabuto ? '#2A2A2A' : // Dark iron for kabuto
        '#9A9EA4';
      const metalBright = createHighlight(metalBase, 1.35);
      const metalLight = createHighlight(metalBase, 1.18);
      const metalShade = createShadow(metalBase, 0.78);
      const metalDeep = createShadow(metalBase, 0.6);
      const metalDark = createShadow(metalBase, 0.45);

      if (isGreatHelm) {
        // === GREAT HELM - Cylindrical barrel helm with flat top ===
        const helmTop = headY - 6;
        const helmHeight = headDim.height + 4;

        for (let y = helmTop; y < helmTop + helmHeight; y++) {
          const yProgress = (y - helmTop) / helmHeight;

          // Cylindrical shape - consistent width
          const width = headDim.width + 6;
          const startX = centerX - Math.floor(width / 2);

          for (let x = 0; x < width; x++) {
            const xNorm = x / width;
            const dx = Math.abs(startX + x - centerX);

            // Eye slit only (narrow horizontal opening)
            if (yProgress > 0.35 && yProgress < 0.45) {
              if (dx < headDim.width / 2 - 2) continue; // Narrow slit
            }

            // Breathing holes below eye slit
            if (yProgress > 0.55 && yProgress < 0.7) {
              if ((x % 4 === 1 || x % 4 === 2) && dx < headDim.width / 3) continue;
            }

            let col = metalBase;

            // Cylindrical 3D shading
            const cylX = Math.abs(xNorm - 0.5) * 2;
            const cylShade = 1 - cylX * cylX * 0.6;

            if (cylShade > 0.9) col = metalBright;
            else if (cylShade > 0.7) col = metalLight;
            else if (cylShade > 0.5) col = metalBase;
            else if (cylShade > 0.3) col = metalShade;
            else col = metalDeep;

            // Flat top
            if (yProgress < 0.08) col = metalShade;

            // Reinforcing cross
            if (Math.abs(x - width / 2) < 2 || (yProgress > 0.1 && yProgress < 0.15)) {
              col = createShadow(col, 0.9);
            }

            elements.push(<rect key={`greathelm-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }

      } else if (isSpangenhelm) {
        // === SPANGENHELM - Conical with nose guard and cheek plates ===
        const helmTop = headY - 8;
        const helmHeight = headDim.height + 3;

        for (let y = helmTop; y < helmTop + helmHeight; y++) {
          const yProgress = (y - helmTop) / helmHeight;

          // Conical shape - narrows toward top
          const width = Math.floor((headDim.width + 4) * (0.3 + yProgress * 0.7));
          const startX = centerX - Math.floor(width / 2);

          for (let x = 0; x < width; x++) {
            const xNorm = x / width;
            const dx = Math.abs(startX + x - centerX);

            // Face opening with cheek plates
            if (yProgress > 0.5 && yProgress < 0.9) {
              if (dx < headDim.width / 2 - 4) continue;
            }

            let col = metalBase;

            // Conical shading
            if (x === 0 || x === width - 1) col = metalDeep;
            else if (xNorm < 0.2) col = metalShade;
            else if (xNorm > 0.8) col = metalDeep;
            else if (yProgress < 0.15 && xNorm > 0.35 && xNorm < 0.65) col = metalBright;
            else if (xNorm > 0.3 && xNorm < 0.5) col = metalLight;

            // Spangenhelm segments (4-6 plates)
            const segment = Math.floor(x / (width / 4));
            if (x % Math.floor(width / 4) < 1 && yProgress > 0.1) {
              col = metalDark; // Seam between plates
            }

            // Rivets
            if (x % Math.floor(width / 4) < 1 && y % 3 === 0 && yProgress > 0.15) {
              col = metalBright;
            }

            elements.push(<rect key={`spangen-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Nose guard
        for (let ny = 0; ny < 10; ny++) {
          const nasalY = headY + ny;
          const nasalWidth = ny < 3 ? 3 : 2;
          const nasalX = centerX - Math.floor(nasalWidth / 2);
          for (let nx = 0; nx < nasalWidth; nx++) {
            let col = metalBase;
            if (nx === 0) col = metalLight;
            else if (nx === nasalWidth - 1) col = metalShade;
            elements.push(<rect key={`spangen-nasal-${ny}-${nx}`} x={nasalX + nx} y={nasalY} width="1" height="1" fill={col} className="pixel" />);
          }
        }

      } else if (isSallet) {
        // === SALLET - Rounded with tail, visor ===
        const helmTop = headY - 5;
        const helmHeight = headDim.height;

        for (let y = helmTop; y < helmTop + helmHeight; y++) {
          const yProgress = (y - helmTop) / helmHeight;

          // Rounded dome with flared tail
          let width;
          if (yProgress < 0.2) {
            width = Math.floor((headDim.width + 4) * (0.6 + yProgress * 2));
          } else if (yProgress < 0.7) {
            width = headDim.width + 6;
          } else {
            // Tail extends back
            width = headDim.width + 6 + Math.floor((yProgress - 0.7) * 8);
          }

          const startX = centerX - Math.floor(width / 2);

          for (let x = 0; x < width; x++) {
            const xNorm = x / width;
            const dx = Math.abs(startX + x - centerX);

            // Visor opening
            if (yProgress > 0.35 && yProgress < 0.55) {
              if (dx < headDim.width / 2 - 2) continue;
            }

            let col = metalBase;

            // Smooth rounded shading
            const sphereX = (xNorm - 0.5) * 2;
            const intensity = 1 - sphereX * sphereX * 0.7;

            if (intensity > 0.9) col = metalBright;
            else if (intensity > 0.7) col = metalLight;
            else if (intensity > 0.4) col = metalBase;
            else col = metalDeep;

            // Visor ridge
            if (yProgress > 0.3 && yProgress < 0.38 && dx < headDim.width / 2) {
              col = metalDark;
            }

            elements.push(<rect key={`sallet-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }

      } else if (isKabuto) {
        // === KABUTO - Japanese samurai helmet with distinctive crest ===
        const helmTop = headY - 6;
        const helmHeight = headDim.height + 2;

        for (let y = helmTop; y < helmTop + helmHeight; y++) {
          const yProgress = (y - helmTop) / helmHeight;

          // Bowl shape
          let width;
          if (yProgress < 0.25) {
            width = Math.floor((headDim.width + 4) * (0.5 + yProgress * 2));
          } else {
            width = headDim.width + 6;
          }

          const startX = centerX - Math.floor(width / 2);

          for (let x = 0; x < width; x++) {
            const xNorm = x / width;
            const dx = Math.abs(startX + x - centerX);

            // Face opening (larger)
            if (yProgress > 0.4 && yProgress < 0.85) {
              if (dx < headDim.width / 2 - 2) continue;
            }

            let col = metalBase;

            // Kabuto plate segments
            const plates = 8;
            const plateWidth = width / plates;
            const plateIndex = Math.floor(x / plateWidth);
            const inPlate = (x % plateWidth) / plateWidth;

            if (inPlate < 0.1 && yProgress > 0.1) col = metalDark;
            else if (inPlate < 0.3) col = metalShade;
            else if (inPlate > 0.7) col = metalDeep;
            else col = metalLight;

            // Rivets at plate edges
            if (inPlate < 0.1 && y % 4 === 0 && yProgress > 0.15) {
              col = '#FFD700'; // Gold rivets
            }

            elements.push(<rect key={`kabuto-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Maedate (front crest)
        const crestBase = '#FFD700';
        for (let cy = 0; cy < 8; cy++) {
          const crestWidth = Math.max(1, 4 - cy);
          for (let cx = 0; cx < crestWidth; cx++) {
            elements.push(<rect key={`maedate-${cy}-${cx}`} x={centerX - Math.floor(crestWidth / 2) + cx} y={helmTop - 2 - cy} width="1" height="1" fill={createShadow(crestBase, 0.9 - cy * 0.05)} className="pixel" />);
          }
        }

        // Shikoro (neck guard)
        for (let sy = 0; sy < 4; sy++) {
          const shikoroWidth = headDim.width + 4 + sy * 2;
          for (let sx = 0; sx < shikoroWidth; sx++) {
            const xNorm = sx / shikoroWidth;
            let col = metalShade;
            if (sy === 0) col = metalBase;
            if (xNorm < 0.1 || xNorm > 0.9) col = metalDeep;
            elements.push(<rect key={`shikoro-${sy}-${sx}`} x={centerX - Math.floor(shikoroWidth / 2) + sx} y={helmTop + helmHeight + sy} width="1" height="1" fill={col} className="pixel" />);
          }
        }

      } else {
        // === DEFAULT / NORMAN HELM - Open face with nose guard ===
        const helmTop = headY - 5;
        const helmHeight = headDim.height + 2;

        for (let y = helmTop; y < helmTop + helmHeight; y++) {
          const yFromTop = y - helmTop;
          const yNorm = yFromTop / helmHeight;

          let rowWidth = headDim.width + 4;
          if (yFromTop < 4) {
            rowWidth = headDim.width + 4 - (4 - yFromTop);
          }

          const startX = centerX - Math.floor(rowWidth / 2);

          for (let x = 0; x < rowWidth; x++) {
            const xNorm = x / rowWidth;
            const xPos = startX + x;
            const dx = Math.abs(xPos - centerX);

            // Face opening
            const faceOpenYStart = headY + 3;
            const faceOpenYEnd = headY + headDim.height - 5;
            const faceOpenWidth = headDim.width / 2 - 4;
            const inFaceArea = y > faceOpenYStart && y < faceOpenYEnd && dx < faceOpenWidth;

            if (inFaceArea) continue;

            let col = metalBase;

            // Strong metallic 3D shading
            if (xNorm < 0.08) col = metalDeep;
            else if (xNorm < 0.15) col = metalShade;
            else if (xNorm < 0.25) col = metalLight;
            else if (xNorm < 0.35) col = metalBright;
            else if (xNorm < 0.45) col = metalLight;
            else if (xNorm > 0.92) col = metalDark;
            else if (xNorm > 0.85) col = metalDeep;
            else if (xNorm > 0.75) col = metalShade;

            if (yFromTop < 3 && xNorm > 0.3 && xNorm < 0.55) {
              col = metalBright;
            }

            // Metal panel seams
            const panelSeam = (x % 6 === 0) && yFromTop > 2;
            if (panelSeam) col = createShadow(col, 0.85);
            if (panelSeam && yFromTop % 4 === 0 && yFromTop > 2) col = metalLight;

            // Wear texture
            if ((x * 7 + y * 5) % 17 === 0) col = createShadow(col, 0.95);
            else if ((x * 5 + y * 3) % 13 === 0) col = createHighlight(col, 1.05);

            if (y > faceOpenYStart - 1 && y < faceOpenYEnd + 1) {
              if (dx >= faceOpenWidth - 1 && dx < faceOpenWidth + 2) {
                col = metalDark;
              }
            }

            elements.push(<rect key={`helm-${x}-${y}`} x={xPos} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Nose guard for Norman helm
        if (isNorman || nameContains('knight', 'nasal')) {
          for (let ny = 0; ny < 8; ny++) {
            const nasalY = headY + 2 + ny;
            const nasalWidth = ny < 2 ? 3 : 2;
            const nasalX = centerX - Math.floor(nasalWidth / 2);
            for (let nx = 0; nx < nasalWidth; nx++) {
              let col = metalBase;
              if (nx === 0) col = metalLight;
              else if (nx === nasalWidth - 1) col = metalShade;
              elements.push(<rect key={`nasal-${ny}-${nx}`} x={nasalX + nx} y={nasalY} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }
      }

      // Crest/plume for nobles (except kabuto which has its own)
      if (isNoble && !isKabuto) {
        const plumeBase = '#DC143C';
        const plumeLight = createHighlight(plumeBase, 1.2);
        const plumeShade = createShadow(plumeBase, 0.7);
        const helmTop = headY - (isGreatHelm ? 6 : 5);
        for (let p = 0; p < 12; p++) {
          const plumeWidth = p < 2 ? 1 : (p < 6 ? 3 : 2);
          const plumeX = centerX - Math.floor(plumeWidth / 2) + Math.floor(Math.sin(p * 0.4) * 1.5);
          const plumeY = helmTop - 2 - p;
          for (let px = 0; px < plumeWidth; px++) {
            const col = px === 0 ? plumeLight : (px === plumeWidth - 1 ? plumeShade : plumeBase);
            elements.push(<rect key={`plume-${p}-${px}`} x={plumeX + px} y={plumeY} width="1" height="1" fill={col} className="pixel" />);
          }
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
          // Top hat with proper 3D shading and silk sheen
          const topBase = '#1C1C1C';
          const topVeryLight = '#4A4A4A'; // Silk sheen highlight
          const topLight = '#383838';
          const topMid = '#282828';
          const topShade = '#1A1A1A';
          const topDeep = '#0C0C0C';

          const crownHeight = 13;
          const crownWidth = headDim.width + 2;

          // Tall cylindrical crown
          for (let y = 0; y < crownHeight; y++) {
            const rowY = headY - crownHeight + y;
            const startX = centerX - Math.floor(crownWidth / 2);
            const yNorm = y / crownHeight;

            for (let x = 0; x < crownWidth; x++) {
              const xNorm = x / crownWidth;
              let col = topBase;

              // Strong 3D cylindrical shading
              if (xNorm < 0.1) col = topDeep;
              else if (xNorm < 0.2) col = topShade;
              else if (xNorm > 0.9) col = topDeep;
              else if (xNorm > 0.8) col = topShade;
              // Center silk sheen (vertical highlight)
              else if (xNorm > 0.4 && xNorm < 0.6) {
                col = topLight;
                if (xNorm > 0.45 && xNorm < 0.55 && yNorm > 0.2 && yNorm < 0.7) {
                  col = topVeryLight; // Silk shine
                }
              }

              // Top curve (darker at very top edges)
              if (y < 3) {
                if (xNorm < 0.15 || xNorm > 0.85) col = topDeep;
                else if (xNorm > 0.4 && xNorm < 0.6) col = topLight;
              }

              // Bottom shadow where it meets brim
              if (y >= crownHeight - 2) {
                col = createShadow(col, 0.8);
              }

              elements.push(<rect key={`tophat-crown-${y}-${x}`} x={startX + x} y={rowY} width="1" height="1" fill={col} className="pixel" />);
            }
          }

          // Wide brim with depth
          const brimWidth = headDim.width + 12;
          for (let brimRow = 0; brimRow < 3; brimRow++) {
            const brimY = headY + brimRow;
            const brimX = centerX - Math.floor(brimWidth / 2);

            for (let x = 0; x < brimWidth; x++) {
              const xNorm = x / brimWidth;
              let col = topMid;

              // Top of brim catches light
              if (brimRow === 0) {
                col = topBase;
                if (xNorm > 0.4 && xNorm < 0.6) col = topLight;
              } else if (brimRow === 2) {
                col = topDeep; // Bottom shadow
              }

              // Edge curl
              if (xNorm < 0.08 || xNorm > 0.92) col = topDeep;

              // Skip center on lower rows (hat sits on head)
              if (brimRow >= 1 && Math.abs(x - brimWidth/2) < crownWidth/2 - 1) continue;

              elements.push(<rect key={`tophat-brim-${brimRow}-${x}`} x={brimX + x} y={brimY} width="1" height="1" fill={col} className="pixel" />);
            }
          }

          // Decorative band
          const bandColor = isWealthy ? (appearanceWithDefaults.palette.accent || '#8B0000') : '#2A2A2A';
          const bandHL = createHighlight(bandColor, 1.2);
          const bandWidth = headDim.width + 2;
          const bandX = centerX - Math.floor(bandWidth / 2);

          for (let x = 0; x < bandWidth; x++) {
            const xNorm = x / bandWidth;
            let bc = bandColor;
            if (xNorm > 0.4 && xNorm < 0.6) bc = bandHL;
            elements.push(<rect key={`tophat-band-${x}`} x={bandX + x} y={headY - 4} width="1" height="2" fill={bc} className="pixel" />);
          }

          break;
        }
        case 'beret': {
          // Beret with proper slouchy shape, wool texture, and 3D shading
          const beretBase = base || '#2C2C2C';
          const beretVeryLight = createHighlight(beretBase, 1.25);
          const beretLight = createHighlight(beretBase, 1.15);
          const beretShade = createShadow(beretBase, 0.82);
          const beretDeep = createShadow(beretBase, 0.65);

          const beretRadius = Math.floor(headDim.width * 0.85);

          for (let y = headY - 7; y < headY + 3; y++) {
            const yFromCenter = y - (headY - 2);
            // Asymmetric slouch - wider and lower on one side
            const baseWidth = Math.round(beretRadius * Math.sqrt(Math.max(0, 1 - Math.pow(yFromCenter / 7, 2))) * 2.2);
            if (baseWidth <= 0) continue;

            // Slouch offset increases as we go down
            const slouchOffset = y > headY - 2 ? Math.floor((y - (headY - 2)) * 0.8) : 0;
            const startX = centerX - Math.floor(baseWidth / 2) + slouchOffset;

            for (let x = 0; x < baseWidth; x++) {
              const xNorm = x / baseWidth;
              const yNorm = (y - (headY - 7)) / 10;
              let col = beretBase;

              // 3D spherical shading
              if (xNorm < 0.1) col = beretDeep;
              else if (xNorm < 0.2) col = beretShade;
              else if (xNorm > 0.9) col = beretDeep;
              else if (xNorm > 0.8) col = beretShade;
              // Top-center highlight (light from above-left)
              else if (yNorm < 0.4 && xNorm > 0.3 && xNorm < 0.6) {
                col = beretLight;
                if (yNorm < 0.25 && xNorm > 0.35 && xNorm < 0.55) col = beretVeryLight;
              }

              // Wool texture (knit pattern)
              const knitRow = Math.floor((y + x) / 2);
              const knitStitch = (x + y) % 3;
              if (knitStitch === 0) {
                col = createHighlight(col, 1.06);
              } else if (knitStitch === 2) {
                col = createShadow(col, 0.94);
              }

              // Bottom edge shadow (sits on head)
              if (y >= headY + 1) {
                col = createShadow(col, 0.75);
              }

              // Slouch crease line
              if (y > headY - 1 && y < headY + 2 && xNorm > 0.6 && xNorm < 0.8) {
                col = createShadow(col, 0.85);
              }

              elements.push(<rect key={`beret-${x}-${y}`} x={startX + x} y={y} width="1" height="1" fill={col} className="pixel" />);
            }
          }

          // Stem/nub on top (characteristic beret feature)
          const stemX = centerX;
          const stemY = headY - 8;
          elements.push(
            <rect key="beret-stem-base" x={stemX - 1} y={stemY + 1} width="3" height="1" fill={beretShade} className="pixel" />,
            <rect key="beret-stem-top" x={stemX} y={stemY} width="1" height="1" fill={beretBase} className="pixel" />
          );

          break;
        }
        case 'fez': {
          // Fez with proper cylindrical 3D shading and felt texture
          const fezBase = name.includes('red') || name.includes('fez') ? '#8B0000' : base;
          const fezVeryLight = createHighlight(fezBase, 1.3);
          const fezLight = createHighlight(fezBase, 1.15);
          const fezShade = createShadow(fezBase, 0.78);
          const fezDeep = createShadow(fezBase, 0.6);

          const fezHeight = 10;
          const fezTopY = headY - fezHeight + 2;

          for (let y = 0; y < fezHeight; y++) {
            const rowY = fezTopY + y;
            const yNorm = y / fezHeight;

            // Slight taper toward top (fez shape)
            const taperAmount = yNorm < 0.3 ? (0.3 - yNorm) * 4 : 0;
            const width = Math.floor(headDim.width + 3 - taperAmount);
            const startX = centerX - Math.floor(width / 2);

            for (let x = 0; x < width; x++) {
              const xNorm = x / width;
              let col = fezBase;

              // Strong cylindrical 3D shading
              if (xNorm < 0.1) col = fezDeep;
              else if (xNorm < 0.2) col = fezShade;
              else if (xNorm > 0.9) col = fezDeep;
              else if (xNorm > 0.8) col = fezShade;
              // Center highlight (cylinder catches light)
              else if (xNorm > 0.4 && xNorm < 0.6) {
                col = fezLight;
                if (xNorm > 0.45 && xNorm < 0.55) col = fezVeryLight;
              }

              // Top flat surface is lighter
              if (y < 2 && xNorm > 0.2 && xNorm < 0.8) {
                col = createHighlight(col, 1.1);
              }

              // Felt texture
              if ((x * 5 + y * 7) % 11 === 0) {
                col = createHighlight(col, 1.05);
              } else if ((x * 7 + y * 3) % 13 === 0) {
                col = createShadow(col, 0.96);
              }

              // Bottom shadow where it sits on head
              if (y >= fezHeight - 2) {
                col = createShadow(col, 0.8);
              }

              elements.push(<rect key={`fez-${y}-${x}`} x={startX + x} y={rowY} width="1" height="1" fill={col} className="pixel" />);
            }
          }

          // Tassel - more detailed
          const tasselBase = '#1A1A1A';
          const tasselHL = '#3A3A3A';
          const tasselTopY = fezTopY - 1;
          const tasselTopX = centerX;

          // Tassel button/knot at top
          elements.push(
            <rect key="fez-knot-1" x={tasselTopX - 1} y={tasselTopY} width="3" height="1" fill={tasselBase} className="pixel" />,
            <rect key="fez-knot-2" x={tasselTopX} y={tasselTopY - 1} width="1" height="1" fill={tasselHL} className="pixel" />
          );

          // Tassel strands hanging
          for (let t = 0; t < 6; t++) {
            const swayX = Math.floor(Math.sin(t * 0.8) * 1.5);
            const col = t % 2 === 0 ? tasselBase : tasselHL;
            elements.push(
              <rect key={`fez-tassel-${t}`} x={tasselTopX + 2 + swayX} y={tasselTopY + t} width="1" height="1" fill={col} className="pixel" />
            );
          }
          // Tassel end (thicker)
          elements.push(
            <rect key="fez-tassel-end" x={tasselTopX + 1} y={tasselTopY + 6} width="2" height="1" fill={tasselBase} className="pixel" />
          );

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

          // Wide brim (extends clearly beyond head)
          const brimRows = 2;
          for (let y = 0; y < brimRows; y++) {
            const brimWidth = headDim.width + 14; // Wider brim for visibility
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
              } else {
                // Bottom of brim - shadow
                brimColor = fedoraDeep;
              }

              // Edge curl - slightly upturned edges
              if (xNorm < 0.12 || xNorm > 0.88) {
                brimColor = createShadow(brimColor, 0.75);
                // Skip some bottom row pixels at edges for curl effect
                if (y === 1 && (xNorm < 0.08 || xNorm > 0.92)) continue;
              }

              // Only skip center area where face shows through
              if (y >= 1 && Math.abs(xPos - centerX) < headDim.width / 2 - 3) continue;

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
          // Fur hat (Russian ushanka style) - IMPROVED: Proper 3D form, fluffy texture, ear flaps
          const furBase = base || '#8B4513';
          const furLight = createHighlight(furBase, 1.25);
          const furMid = createHighlight(furBase, 1.1);
          const furShade = createShadow(furBase, 0.8);
          const furDeep = createShadow(furBase, 0.6);
          const furDark = createShadow(furBase, 0.45);

          // Crown - rounded dome shape
          const crownHeight = 10;
          const crownWidth = headDim.width + 6;

          for (let row = 0; row < crownHeight; row++) {
            const rowY = headY - crownHeight + 3 + row;
            const yNorm = row / crownHeight;

            // Dome shape - narrows at top
            let rowWidth = crownWidth;
            if (row < 3) rowWidth = crownWidth - (3 - row) * 2;
            else if (row < 5) rowWidth = crownWidth - 1;

            const startX = centerX - Math.floor(rowWidth / 2);

            for (let x = 0; x < rowWidth; x++) {
              const xNorm = x / rowWidth;
              let col = furBase;

              // 3D shading for round form
              if (xNorm < 0.1) col = furDark;
              else if (xNorm < 0.2) col = furDeep;
              else if (xNorm < 0.3) col = furShade;
              else if (xNorm > 0.9) col = furDark;
              else if (xNorm > 0.8) col = furDeep;
              else if (xNorm > 0.7) col = furShade;
              else if (xNorm > 0.35 && xNorm < 0.55 && yNorm < 0.5) col = furLight;
              else if (xNorm > 0.3 && xNorm < 0.6) col = furMid;

              // Top dome highlight
              if (row < 3 && xNorm > 0.3 && xNorm < 0.7) col = furLight;

              // Fluffy fur texture - random spiky pattern
              const textureSeed = x * 7 + row * 13;
              if (textureSeed % 5 === 0) col = createHighlight(col, 1.15);
              else if (textureSeed % 7 === 0) col = createShadow(col, 0.85);
              else if (textureSeed % 11 === 0) col = furLight;
              else if (textureSeed % 13 === 0) col = furDeep;

              // Bottom shadow
              if (row >= crownHeight - 2) col = createShadow(col, 0.8);

              elements.push(<rect key={`fur-crown-${row}-${x}`} x={startX + x} y={rowY} width="1" height="1" fill={col} className="pixel" />);
            }
          }

          // Fur trim band (fluffy edge around bottom of crown)
          const trimY = headY - 1;
          const trimWidth = crownWidth + 2;
          for (let x = 0; x < trimWidth; x++) {
            const trimX = centerX - Math.floor(trimWidth / 2) + x;
            const xNorm = x / trimWidth;

            let col = furMid;
            if (xNorm < 0.15 || xNorm > 0.85) col = furShade;
            if (xNorm > 0.4 && xNorm < 0.6) col = furLight;

            // Fluffy edge texture
            if ((x * 3) % 5 === 0) col = createHighlight(col, 1.1);

            for (let ty = 0; ty < 2; ty++) {
              elements.push(<rect key={`fur-trim-${x}-${ty}`} x={trimX} y={trimY + ty} width="1" height="1" fill={ty === 0 ? col : createShadow(col, 0.85)} className="pixel" />);
            }
          }

          // Ear flaps - thick and fluffy
          const flapHeight = 6;
          const flapWidth = 4;

          // Left ear flap
          for (let fy = 0; fy < flapHeight; fy++) {
            const flapY = headY + 1 + fy;
            const taperWidth = Math.max(2, flapWidth - Math.floor(fy / 2));
            const flapX = headX - 3;

            for (let fx = 0; fx < taperWidth; fx++) {
              let col = furBase;
              if (fx === 0) col = furShade;
              else if (fx === taperWidth - 1) col = furLight;
              if (fy >= flapHeight - 1) col = createShadow(col, 0.75);

              // Fluffy texture
              if ((fx + fy * 3) % 4 === 0) col = createHighlight(col, 1.1);

              elements.push(<rect key={`fur-flap-l-${fy}-${fx}`} x={flapX + fx} y={flapY} width="1" height="1" fill={col} className="pixel" />);
            }
          }

          // Right ear flap
          for (let fy = 0; fy < flapHeight; fy++) {
            const flapY = headY + 1 + fy;
            const taperWidth = Math.max(2, flapWidth - Math.floor(fy / 2));
            const flapX = headX + headDim.width - 1;

            for (let fx = 0; fx < taperWidth; fx++) {
              let col = furBase;
              if (fx === 0) col = furLight;
              else if (fx === taperWidth - 1) col = furShade;
              if (fy >= flapHeight - 1) col = createShadow(col, 0.75);

              // Fluffy texture
              if ((fx + fy * 3) % 4 === 0) col = createHighlight(col, 1.1);

              elements.push(<rect key={`fur-flap-r-${fy}-${fx}`} x={flapX + fx} y={flapY} width="1" height="1" fill={col} className="pixel" />);
            }
          }

          // Front flap (tied up on top) - small bump on forehead
          elements.push(
            <rect key="fur-front-flap-1" x={centerX - 2} y={headY} width="4" height="1" fill={furMid} className="pixel" />,
            <rect key="fur-front-flap-2" x={centerX - 1} y={headY + 1} width="2" height="1" fill={furShade} className="pixel" />
          );

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

    // TRICORN / PIRATE / COLONIAL HATS - IMPROVED: Proper 3D shape with upturned brims
    else if (nameContains('tricorn', 'pirate', 'colonial hat', 'cocked hat')) {
      const hatBase = name.includes('pirate') ? '#1A1A1A' : (base || '#2A2A2A');
      const hatLight = createHighlight(hatBase, 1.2);
      const hatMid = hatBase;
      const hatShade = createShadow(hatBase, 0.82);
      const hatDeep = createShadow(hatBase, 0.65);
      const hatDark = createShadow(hatBase, 0.5);

      const crownHeight = 8;
      const crownWidth = headDim.width + 4;

      // Crown with proper rounded 3D shading
      for (let row = 0; row < crownHeight; row++) {
        const rowY = headY - crownHeight + row;
        // Crown narrows slightly at top
        const rowWidth = row < 2 ? crownWidth - (2 - row) : crownWidth;
        const startX = centerX - Math.floor(rowWidth / 2);

        for (let x = 0; x < rowWidth; x++) {
          const xNorm = x / rowWidth;
          let col = hatMid;

          // 3D cylindrical shading
          if (xNorm < 0.1) col = hatDark;
          else if (xNorm < 0.2) col = hatDeep;
          else if (xNorm < 0.3) col = hatShade;
          else if (xNorm > 0.9) col = hatDark;
          else if (xNorm > 0.8) col = hatDeep;
          else if (xNorm > 0.7) col = hatShade;
          else if (xNorm > 0.4 && xNorm < 0.6) col = hatLight;

          // Top curve highlight
          if (row < 2 && xNorm > 0.3 && xNorm < 0.7) col = hatLight;

          // Bottom shadow
          if (row >= crownHeight - 2) col = createShadow(col, 0.85);

          // Felt texture
          if ((x * 5 + row * 7) % 11 === 0) col = createHighlight(col, 1.04);

          elements.push(<rect key={`tricorn-crown-${row}-${x}`} x={startX + x} y={rowY} width="1" height="1" fill={col} className="pixel" />);
        }
      }

      // Upturned brim - three distinct sections creating triangle shape
      // The front brim turns UP, side brims curve up and back

      // Left upturned brim section
      for (let i = 0; i < 6; i++) {
        const brimX = headX - 5 + i;
        const brimY = headY - i; // Curves upward
        const brimWidth = 4 - Math.floor(i / 2);
        for (let w = 0; w < brimWidth; w++) {
          let col = hatShade;
          if (w === 0) col = hatDeep;
          else if (w === brimWidth - 1) col = hatLight;
          elements.push(<rect key={`tricorn-brim-l-${i}-${w}`} x={brimX + w} y={brimY} width="1" height="1" fill={col} className="pixel" />);
        }
      }

      // Right upturned brim section
      for (let i = 0; i < 6; i++) {
        const brimX = headX + headDim.width + 1 - i;
        const brimY = headY - i;
        const brimWidth = 4 - Math.floor(i / 2);
        for (let w = 0; w < brimWidth; w++) {
          let col = hatShade;
          if (w === 0) col = hatLight;
          else if (w === brimWidth - 1) col = hatDeep;
          elements.push(<rect key={`tricorn-brim-r-${i}-${w}`} x={brimX + w} y={brimY} width="1" height="1" fill={col} className="pixel" />);
        }
      }

      // Front brim (turns upward toward viewer - shows underside)
      for (let row = 0; row < 3; row++) {
        const brimY = headY + 1 + row;
        const brimWidth = headDim.width + 6 - row * 2;
        const startX = centerX - Math.floor(brimWidth / 2);

        for (let x = 0; x < brimWidth; x++) {
          const xNorm = x / brimWidth;
          // Front brim shows lighter underside
          let col = row === 0 ? hatMid : (row === 1 ? hatShade : hatDeep);

          // Edge darkening
          if (xNorm < 0.15 || xNorm > 0.85) col = createShadow(col, 0.8);

          // Center lighter
          if (row === 0 && xNorm > 0.4 && xNorm < 0.6) col = hatLight;

          elements.push(<rect key={`tricorn-brim-f-${row}-${x}`} x={startX + x} y={brimY} width="1" height="1" fill={col} className="pixel" />);
        }
      }

      // Decorative elements
      // Hat cockade (ribbon rosette) on left side
      const cockadeX = headX - 3;
      const cockadeY = headY - 3;
      const cockadeColor = isWealthy ? '#DC143C' : '#2A2A2A';
      elements.push(
        <rect key="cockade-1" x={cockadeX} y={cockadeY} width="2" height="2" fill={cockadeColor} className="pixel" />,
        <rect key="cockade-2" x={cockadeX - 1} y={cockadeY + 1} width="1" height="1" fill={createShadow(cockadeColor, 0.8)} className="pixel" />,
        <rect key="cockade-3" x={cockadeX + 2} y={cockadeY + 1} width="1" height="1" fill={createHighlight(cockadeColor, 1.2)} className="pixel" />
      );

      // Gold trim for wealthy/officers
      if (isWealthy || name.includes('officer')) {
        // Gold braid along crown base
        for (let x = 0; x < crownWidth; x += 2) {
          const trimX = centerX - Math.floor(crownWidth / 2) + x;
          elements.push(
            <rect key={`tricorn-trim-${x}`} x={trimX} y={headY - 1} width="1" height="1" fill="#FFD700" className="pixel" />
          );
        }

        // Feather plume
        const featherBase = '#FFFFFF';
        const featherShade = '#E0E0E0';
        for (let f = 0; f < 10; f++) {
          const fX = headX - 4 + Math.floor(Math.sin(f * 0.4) * 2);
          const fY = headY - crownHeight - 2 + f;
          const fColor = f % 2 === 0 ? featherBase : featherShade;
          const fWidth = f < 2 ? 1 : (f < 6 ? 2 : 1);
          for (let fw = 0; fw < fWidth; fw++) {
            elements.push(<rect key={`tricorn-feather-${f}-${fw}`} x={fX + fw} y={fY} width="1" height="1" fill={fColor} className="pixel" />);
          }
        }
      }
    }
    
    // MILITARY CAPS (officer, garrison, kepi) - IMPROVED: Proper 3D form, authentic structure
    else if (nameContains('officer', 'garrison', 'kepi', 'military cap', 'forage cap')) {
      const capBase = material.includes('blue') ? '#000080' : material.includes('gray') ? '#606060' : (base || '#2A2A4A');
      const capLight = createHighlight(capBase, 1.25);
      const capMid = createHighlight(capBase, 1.1);
      const capShade = createShadow(capBase, 0.82);
      const capDeep = createShadow(capBase, 0.65);
      const capDark = createShadow(capBase, 0.5);
      const visorColor = '#1A1A1A';
      const visorShade = '#0A0A0A';
      const visorHighlight = '#2A2A2A';

      const isKepi = name.includes('kepi');
      const crownHeight = isKepi ? 10 : 8;
      const crownWidth = headDim.width + 4;

      // Crown with proper cylindrical 3D form
      for (let row = 0; row < crownHeight; row++) {
        const rowY = headY - crownHeight + 2 + row;
        const yNorm = row / crownHeight;

        // Kepi has flat top that slopes forward, regular caps are rounder
        let rowWidth = crownWidth;
        if (isKepi) {
          // Kepi - flat top, slight forward slope
          if (row < 2) rowWidth = crownWidth - 1;
        } else {
          // Round top
          if (row < 3) rowWidth = crownWidth - (3 - row);
        }

        const forwardSlope = isKepi ? Math.floor(row * 0.15) : 0;
        const startX = centerX - Math.floor(rowWidth / 2) + forwardSlope;

        for (let x = 0; x < rowWidth; x++) {
          const xNorm = x / rowWidth;
          let col = capBase;

          // 3D cylindrical shading
          if (xNorm < 0.08) col = capDark;
          else if (xNorm < 0.15) col = capDeep;
          else if (xNorm < 0.25) col = capShade;
          else if (xNorm > 0.92) col = capDark;
          else if (xNorm > 0.85) col = capDeep;
          else if (xNorm > 0.75) col = capShade;
          else if (xNorm > 0.4 && xNorm < 0.55) col = capLight;
          else if (xNorm > 0.35 && xNorm < 0.6) col = capMid;

          // Top highlight for kepi flat top
          if (isKepi && row < 3 && xNorm > 0.25 && xNorm < 0.75) {
            col = capLight;
          }

          // Bottom where it meets visor - darker
          if (row >= crownHeight - 2) col = createShadow(col, 0.85);

          // Wool/felt texture
          if ((x * 5 + row * 7) % 11 === 0) col = createHighlight(col, 1.05);
          else if ((x * 7 + row * 5) % 13 === 0) col = createShadow(col, 0.97);

          elements.push(<rect key={`mil-crown-${row}-${x}`} x={startX + x} y={rowY} width="1" height="1" fill={col} className="pixel" />);
        }
      }

      // Hat band (leather or braid)
      const bandY = headY;
      const bandWidth = crownWidth;
      const bandX = centerX - Math.floor(bandWidth / 2);
      for (let x = 0; x < bandWidth; x++) {
        const xNorm = x / bandWidth;
        let bandCol = '#2A2A2A';
        if (xNorm > 0.4 && xNorm < 0.6) bandCol = '#3A3A3A';
        if (xNorm < 0.1 || xNorm > 0.9) bandCol = '#1A1A1A';
        elements.push(<rect key={`mil-band-${x}`} x={bandX + x} y={bandY} width="1" height="1" fill={bandCol} className="pixel" />);
      }

      // Prominent visor with proper curve and shading
      for (let row = 0; row < 4; row++) {
        const visorY = headY + 1 + row;
        const visorWidth = headDim.width + 8 - row;
        const visorStartX = centerX - Math.floor(visorWidth / 2);

        for (let x = 0; x < visorWidth; x++) {
          const xNorm = x / visorWidth;
          // Skip rounded corners
          if (row >= 2 && (x < 2 || x >= visorWidth - 2)) continue;
          if (row >= 3 && (x < 3 || x >= visorWidth - 3)) continue;

          let col = visorColor;
          // Top of visor catches light
          if (row === 0) {
            col = visorHighlight;
            if (xNorm > 0.4 && xNorm < 0.6) col = '#3A3A3A';
          }
          // Bottom very dark
          else if (row >= 2) col = visorShade;

          // Edge curve
          if (xNorm < 0.1 || xNorm > 0.9) col = visorShade;

          elements.push(<rect key={`mil-visor-${row}-${x}`} x={visorStartX + x} y={visorY} width="1" height="1" fill={col} className="pixel" />);
        }
      }

      // Chin strap buttons
      elements.push(
        <rect key="mil-strap-btn-l" x={headX} y={headY + 2} width="1" height="1" fill="#FFD700" className="pixel" />,
        <rect key="mil-strap-btn-r" x={headX + headDim.width - 1} y={headY + 2} width="1" height="1" fill="#FFD700" className="pixel" />
      );

      // Badge/insignia for officers - more detailed
      if (isWealthy || name.includes('officer')) {
        const badgeY = headY - Math.floor(crownHeight / 2);
        // Gold eagle/star badge
        elements.push(
          <rect key="mil-badge-bg" x={centerX - 2} y={badgeY - 1} width="5" height="4" fill="#B8860B" className="pixel" />,
          <rect key="mil-badge-center" x={centerX - 1} y={badgeY} width="3" height="2" fill="#FFD700" className="pixel" />,
          <rect key="mil-badge-star" x={centerX} y={badgeY - 1} width="1" height="1" fill="#FFFACD" className="pixel" />,
          <rect key="mil-badge-detail" x={centerX} y={badgeY + 1} width="1" height="1" fill="#8B0000" className="pixel" />
        );

        // Gold braid on cap band
        for (let x = 0; x < bandWidth; x += 3) {
          elements.push(
            <rect key={`mil-braid-${x}`} x={bandX + x} y={bandY} width="2" height="1" fill="#DAA520" className="pixel" />
          );
        }
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
        const eyeSpacing = Math.floor(headDim.width * 0.2);

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
    else if (nameContains('bandana', 'headband', 'sweatband', 'kerchief', 'do-rag', 'dorag')) {
      const bandColor = base;
      const bandHighlight = createHighlight(bandColor, 1.2);
      const bandShade = createShadow(bandColor, 0.85);
      const bandDeep = createShadow(bandColor, 0.7);

      const isPaisley = name.includes('paisley');
      const isKerchief = name.includes('kerchief');
      const isBandana = name.includes('bandana');
      const isDoRag = name.includes('do-rag') || name.includes('dorag');
      const isSweatband = name.includes('sweatband');

      if (isKerchief) {
        // === KERCHIEF - Triangle head covering tied under chin ===
        const kerchiefTop = headY - 4;
        const kerchiefHeight = headDim.height + 4;

        for (let y = kerchiefTop; y < kerchiefTop + kerchiefHeight; y++) {
          const yProgress = (y - kerchiefTop) / kerchiefHeight;

          // Triangle shape - narrow at top, wide at sides
          let width;
          if (yProgress < 0.3) {
            // Top point - narrow
            width = Math.floor(headDim.width * (0.3 + yProgress * 2));
          } else if (yProgress < 0.7) {
            // Middle - full coverage
            width = headDim.width + 4;
          } else {
            // Bottom - tapers for chin
            width = Math.floor((headDim.width + 4) * (1 - (yProgress - 0.7) * 1.5));
          }

          const startX = centerX - Math.floor(width / 2);

          for (let x = 0; x < width; x++) {
            const xPos = startX + x;
            const xNorm = x / width;
            const dx = xPos - centerX;

            // Face opening
            if (yProgress > 0.25 && yProgress < 0.75) {
              if (Math.abs(dx) < headDim.width / 2 - 2) continue;
            }

            let col = bandColor;

            // Fabric shading
            if (x === 0 || x === width - 1) col = bandDeep;
            else if (xNorm < 0.15) col = bandShade;
            else if (xNorm > 0.85) col = bandDeep;
            else if (yProgress < 0.15 && xNorm > 0.4 && xNorm < 0.6) col = bandHighlight;

            // Dotted/floral pattern
            if ((x * 3 + y * 2) % 7 === 0) {
              col = bandHighlight;
            }

            elements.push(<rect key={`kerchief-${x}-${y}`} x={xPos} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Chin tie and knot
        const tieY = kerchiefTop + kerchiefHeight - 2;
        elements.push(
          <rect key="kerchief-tie-l" x={centerX - 3} y={tieY} width="2" height="1" fill={bandShade} className="pixel" />,
          <rect key="kerchief-tie-r" x={centerX + 1} y={tieY} width="2" height="1" fill={bandShade} className="pixel" />,
          <rect key="kerchief-knot" x={centerX - 1} y={tieY + 1} width="2" height="2" fill={bandDeep} className="pixel" />
        );

      } else if (isDoRag) {
        // === DO-RAG - Fitted cap with ties at back ===
        const doragTop = headY - 4;
        const doragHeight = headDim.height - 2;

        for (let y = doragTop; y < doragTop + doragHeight; y++) {
          const yProgress = (y - doragTop) / doragHeight;

          // Fitted to head shape
          let width;
          if (yProgress < 0.2) {
            // Top - rounded
            width = Math.floor(headDim.width * (0.6 + yProgress * 2));
          } else {
            // Full width
            width = headDim.width + 2;
          }

          const startX = centerX - Math.floor(width / 2);

          for (let x = 0; x < width; x++) {
            const xPos = startX + x;
            const xNorm = x / width;
            const dx = xPos - centerX;

            // Face opening - stop at forehead
            if (yProgress > 0.5) {
              if (Math.abs(dx) < headDim.width / 2 - 2) continue;
            }

            let col = bandColor;

            // Silky sheen
            if (xNorm < 0.1) col = bandDeep;
            else if (xNorm > 0.9) col = bandDeep;
            else if (xNorm > 0.3 && xNorm < 0.5) col = bandHighlight;
            else if (xNorm < 0.25) col = bandShade;

            elements.push(<rect key={`dorag-${x}-${y}`} x={xPos} y={y} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Hanging ties at back
        const tieX = centerX + Math.floor(headDim.width / 2) + 1;
        for (let ty = 0; ty < 6; ty++) {
          elements.push(
            <rect key={`dorag-tie-1-${ty}`} x={tieX} y={doragTop + 4 + ty} width="1" height="1" fill={bandShade} className="pixel" />,
            <rect key={`dorag-tie-2-${ty}`} x={tieX + 1} y={doragTop + 5 + ty} width="1" height="1" fill={bandColor} className="pixel" />
          );
        }

      } else if (isBandana) {
        // === BANDANA - Folded triangle tied at back of head ===
        const bandanaY = headY - 2;
        const bandanaHeight = 5;
        const bandanaWidth = headDim.width + 4;

        for (let y = 0; y < bandanaHeight; y++) {
          const rowY = bandanaY + y;
          const yProgress = y / bandanaHeight;

          // Narrower band at top, wider at bottom
          let width = Math.floor(bandanaWidth * (0.8 + yProgress * 0.2));
          const startX = centerX - Math.floor(width / 2);

          for (let x = 0; x < width; x++) {
            const xNorm = x / width;
            let col = bandColor;

            // 3D fold shading
            if (y === 0) col = bandHighlight;
            else if (y === bandanaHeight - 1) col = bandShade;
            else if (xNorm < 0.1 || xNorm > 0.9) col = bandDeep;
            else if (xNorm < 0.2 || xNorm > 0.8) col = bandShade;

            // Paisley pattern
            if (isPaisley) {
              const paisley = ((x * 2 + y) % 5 === 0) || ((x + y * 3) % 7 === 0);
              if (paisley) col = createHighlight(col, 1.15);
            }

            elements.push(<rect key={`bandana-band-${x}-${y}`} x={startX + x} y={rowY} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Knot and tails at back
        const knotX = headX + headDim.width + 1;
        const knotY = bandanaY + 1;

        // Knot
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            const dist = Math.abs(kx - 1) + Math.abs(ky - 1);
            if (dist <= 1) {
              let col = bandShade;
              if (kx === 1 && ky === 0) col = bandHighlight;
              elements.push(<rect key={`bandana-knot-${kx}-${ky}`} x={knotX + kx} y={knotY + ky} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }

        // Trailing tails
        for (let t = 0; t < 5; t++) {
          const tailSway = Math.floor(Math.sin(t * 0.8) * 1);
          elements.push(
            <rect key={`bandana-tail1-${t}`} x={knotX + 1 + tailSway} y={knotY + 3 + t} width="1" height="1" fill={bandColor} className="pixel" />,
            <rect key={`bandana-tail2-${t}`} x={knotX + 2 + tailSway} y={knotY + 4 + t} width="1" height="1" fill={bandShade} className="pixel" />
          );
        }

      } else {
        // === HEADBAND / SWEATBAND - Simple elastic band ===
        const bandY = headY - 1;
        const bandHeight = isSweatband ? 4 : 3;
        const bandWidth = headDim.width + 4;

        for (let y = 0; y < bandHeight; y++) {
          const rowY = bandY + y;
          const startX = centerX - Math.floor(bandWidth / 2);

          for (let x = 0; x < bandWidth; x++) {
            const xNorm = x / bandWidth;
            let col = bandColor;

            // Elastic stretch shading
            if (y === 0) col = bandHighlight;
            else if (y === bandHeight - 1) col = bandShade;
            else if (xNorm < 0.1 || xNorm > 0.9) col = bandDeep;
            else if (xNorm < 0.2 || xNorm > 0.8) col = bandShade;
            else if (xNorm > 0.4 && xNorm < 0.6) col = bandHighlight;

            // Terry cloth texture for sweatband
            if (isSweatband && (x + y) % 2 === 0) {
              col = createShadow(col, 0.95);
            }

            elements.push(<rect key={`headband-${x}-${y}`} x={startX + x} y={rowY} width="1" height="1" fill={col} className="pixel" />);
          }
        }
      }
    }
    
    // ACADEMIC CAPS (mortarboard, biretta, doctoral cap) - IMPROVED: Proper 3D forms
    else if (nameContains('mortarboard', 'biretta', 'doctoral', 'academic', 'graduation')) {
      const isDoctoral = name.includes('doctoral');
      const capBase = isDoctoral ? '#8B0000' : '#1A1A1A';
      const capLight = createHighlight(capBase, 1.25);
      const capMid = createHighlight(capBase, 1.1);
      const capShade = createShadow(capBase, 0.8);
      const capDeep = createShadow(capBase, 0.6);

      if (name.includes('mortarboard') || name.includes('graduation') || name.includes('academic')) {
        // Mortarboard - square board with 3D perspective and skullcap

        // Skullcap base (rounded) - under the board
        const skullHeight = 6;
        const skullWidth = headDim.width + 2;

        for (let row = 0; row < skullHeight; row++) {
          const rowY = headY - skullHeight + 3 + row;
          let rowWidth = skullWidth;
          if (row < 2) rowWidth = skullWidth - (2 - row);

          const startX = centerX - Math.floor(rowWidth / 2);

          for (let x = 0; x < rowWidth; x++) {
            const xNorm = x / rowWidth;
            let col = capBase;

            // 3D shading
            if (xNorm < 0.12) col = capDeep;
            else if (xNorm < 0.22) col = capShade;
            else if (xNorm > 0.88) col = capDeep;
            else if (xNorm > 0.78) col = capShade;
            else if (xNorm > 0.4 && xNorm < 0.6) col = capMid;

            elements.push(<rect key={`mort-skull-${row}-${x}`} x={startX + x} y={rowY} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Square board on top with 3D perspective (diamond shape from 3/4 view)
        const boardSize = headDim.width + 8;
        const boardY = headY - skullHeight;

        // Board rendered as tilted square
        for (let row = 0; row < 3; row++) {
          const rowY = boardY - 2 + row;
          const rowWidth = boardSize - Math.abs(row - 1);
          const startX = centerX - Math.floor(rowWidth / 2);

          for (let x = 0; x < rowWidth; x++) {
            const xNorm = x / rowWidth;
            let col = capBase;

            // Top row bright, bottom row in shadow
            if (row === 0) {
              col = capMid;
              if (xNorm > 0.3 && xNorm < 0.7) col = capLight;
            } else if (row === 2) {
              col = capDeep;
            }

            // Edge shading
            if (xNorm < 0.1 || xNorm > 0.9) col = capDeep;

            elements.push(<rect key={`mort-board-${row}-${x}`} x={startX + x} y={rowY} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Button at center of board
        elements.push(
          <rect key="mort-button" x={centerX - 1} y={boardY - 1} width="2" height="1" fill={capShade} className="pixel" />
        );

        // Tassel - more detailed with proper drape
        const tasselColor = isDoctoral ? '#FFD700' : '#FFD700';
        const tasselDark = createShadow(tasselColor, 0.75);
        const tasselStartX = centerX + 3;
        const tasselStartY = boardY - 1;

        // Tassel cord to board
        elements.push(
          <rect key="tassel-cord-1" x={centerX} y={tasselStartY} width="3" height="1" fill={tasselDark} className="pixel" />
        );

        // Tassel button/knot
        elements.push(
          <rect key="tassel-knot" x={tasselStartX} y={tasselStartY + 1} width="2" height="2" fill={tasselColor} className="pixel" />
        );

        // Tassel strands hanging
        for (let t = 0; t < 6; t++) {
          const swing = Math.floor(Math.sin(t * 0.5) * 1.5);
          const col = t % 2 === 0 ? tasselColor : tasselDark;
          elements.push(<rect key={`tassel-strand-${t}`} x={tasselStartX + swing} y={tasselStartY + 3 + t} width="2" height="1" fill={col} className="pixel" />);
        }

      } else if (name.includes('biretta')) {
        // Biretta - four-ridged square cap with 3D form
        const birettaHeight = 8;
        const birettaWidth = headDim.width + 4;

        // Main body with ridges forming cross pattern on top
        for (let row = 0; row < birettaHeight; row++) {
          const rowY = headY - birettaHeight + 2 + row;
          const yNorm = row / birettaHeight;

          // Shape: square base, ridges at top
          let rowWidth = birettaWidth;
          if (row < 3) rowWidth = birettaWidth - (3 - row);

          const startX = centerX - Math.floor(rowWidth / 2);

          for (let x = 0; x < rowWidth; x++) {
            const xNorm = x / rowWidth;
            let col = capBase;

            // 3D shading
            if (xNorm < 0.1) col = capDeep;
            else if (xNorm < 0.2) col = capShade;
            else if (xNorm > 0.9) col = capDeep;
            else if (xNorm > 0.8) col = capShade;
            else if (xNorm > 0.4 && xNorm < 0.6) col = capMid;

            // Ridge lines (cross pattern at top)
            if (row < 4) {
              const distFromCenter = Math.abs(xNorm - 0.5);
              const onVertRidge = distFromCenter < 0.1;
              const onHorizRidge = row === 1 || row === 2;

              if (onVertRidge || onHorizRidge) {
                col = capLight;
                if (onVertRidge && onHorizRidge) col = createHighlight(col, 1.1);
              }
            }

            // Bottom darker
            if (row >= birettaHeight - 2) col = createShadow(col, 0.85);

            // Skip corners at top
            if (row < 2 && (x < 1 || x >= rowWidth - 1)) continue;

            elements.push(<rect key={`biretta-${row}-${x}`} x={startX + x} y={rowY} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Pom-pom on top - fluffy
        const pomColor = isDoctoral ? '#DC143C' : '#DC143C';
        const pomLight = createHighlight(pomColor, 1.3);
        const pomShade = createShadow(pomColor, 0.7);

        for (let py = 0; py < 3; py++) {
          for (let px = 0; px < 3; px++) {
            const dist = Math.abs(px - 1) + Math.abs(py - 1);
            if (dist <= 1) {
              let col = pomColor;
              if (px === 1 && py === 0) col = pomLight;
              else if (py === 2) col = pomShade;
              elements.push(<rect key={`biretta-pom-${py}-${px}`} x={centerX - 1 + px} y={headY - birettaHeight + py} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }
      }
    }
    
    // RELIGIOUS HEADWEAR (mitre, zucchetto, kippah) - IMPROVED: Proper 3D forms
    else if (nameContains('mitre', 'zucchetto', 'kippah', 'yarmulke', 'skullcap')) {
      const isWhite = material.includes('white') || name.includes('white');
      const isRed = material.includes('red') || name.includes('red') || name.includes('cardinal');
      const isPurple = material.includes('purple') || name.includes('purple') || name.includes('bishop');

      const relBase = isWhite ? '#F5F5F5' : isRed ? '#DC143C' : isPurple ? '#800080' : '#1A1A1A';
      const relLight = createHighlight(relBase, 1.2);
      const relMid = createHighlight(relBase, 1.08);
      const relShade = createShadow(relBase, 0.82);
      const relDeep = createShadow(relBase, 0.65);

      if (name.includes('mitre')) {
        // Bishop's mitre - tall two-pointed ceremonial hat with proper 3D form
        const mitreHeight = 14;
        const mitreBaseWidth = headDim.width + 4;

        for (let row = 0; row < mitreHeight; row++) {
          const rowY = headY - mitreHeight + 3 + row;
          const yNorm = row / mitreHeight;

          // Mitre shape - two peaks with valley in center
          let rowWidth;
          if (row < 3) {
            // Top peaks (two points)
            rowWidth = 2; // Very narrow at peaks
          } else if (row < 6) {
            // Upper section - widening
            rowWidth = Math.floor(mitreBaseWidth * 0.4 + (row - 3) * 1.5);
          } else {
            // Main body - full width
            rowWidth = mitreBaseWidth;
          }

          const startX = centerX - Math.floor(rowWidth / 2);

          // Draw two peaks at top
          if (row < 4) {
            // Left peak
            for (let x = 0; x < 3 - row; x++) {
              const px = centerX - 4 + x;
              let col = relBase;
              if (x === 0) col = relShade;
              else col = relLight;
              elements.push(<rect key={`mitre-lpeak-${row}-${x}`} x={px} y={rowY} width="1" height="1" fill={col} className="pixel" />);
            }
            // Right peak
            for (let x = 0; x < 3 - row; x++) {
              const px = centerX + 2 + x;
              let col = relBase;
              if (x === 0) col = relLight;
              else col = relShade;
              elements.push(<rect key={`mitre-rpeak-${row}-${x}`} x={px} y={rowY} width="1" height="1" fill={col} className="pixel" />);
            }
          } else {
            // Main body with 3D shading
            for (let x = 0; x < rowWidth; x++) {
              const xNorm = x / rowWidth;
              let col = relBase;

              // Cylindrical 3D shading
              if (xNorm < 0.1) col = relDeep;
              else if (xNorm < 0.2) col = relShade;
              else if (xNorm > 0.9) col = relDeep;
              else if (xNorm > 0.8) col = relShade;
              else if (xNorm > 0.4 && xNorm < 0.6) col = relLight;

              // Valley between peaks
              if (row < 8 && xNorm > 0.4 && xNorm < 0.6) {
                col = createShadow(col, 0.85);
              }

              // Bottom shadow
              if (row >= mitreHeight - 2) col = createShadow(col, 0.8);

              // Fabric texture
              if ((x * 5 + row * 7) % 11 === 0) col = createHighlight(col, 1.04);

              elements.push(<rect key={`mitre-body-${row}-${x}`} x={startX + x} y={rowY} width="1" height="1" fill={col} className="pixel" />);
            }
          }
        }

        // Decorative cross and bands
        const crossColor = '#FFD700';
        const crossShade = '#DAA520';

        // Vertical band (orphrey)
        for (let row = 4; row < mitreHeight - 1; row++) {
          const bandY = headY - mitreHeight + 3 + row;
          elements.push(
            <rect key={`mitre-band-${row}`} x={centerX - 1} y={bandY} width="2" height="1" fill={crossColor} className="pixel" />
          );
        }

        // Cross at center
        if (isWealthy || isNoble) {
          const crossY = headY - 6;
          elements.push(
            <rect key="mitre-cross-v1" x={centerX} y={crossY - 2} width="1" height="5" fill={crossColor} className="pixel" />,
            <rect key="mitre-cross-h1" x={centerX - 2} y={crossY} width="5" height="1" fill={crossColor} className="pixel" />,
            <rect key="mitre-cross-gem" x={centerX} y={crossY} width="1" height="1" fill="#DC143C" className="pixel" />
          );
        }

        // Lappets (hanging ribbons at back)
        for (let lap = 0; lap < 4; lap++) {
          elements.push(
            <rect key={`mitre-lappet-l-${lap}`} x={centerX - 3} y={headY + 1 + lap} width="1" height="1" fill={lap % 2 === 0 ? relBase : relShade} className="pixel" />,
            <rect key={`mitre-lappet-r-${lap}`} x={centerX + 2} y={headY + 1 + lap} width="1" height="1" fill={lap % 2 === 0 ? relBase : relShade} className="pixel" />
          );
        }

      } else {
        // Kippah/Zucchetto - small rounded skullcap with proper dome shading
        const isZucchetto = name.includes('zucchetto');
        const radius = Math.floor(headDim.width * (isZucchetto ? 0.5 : 0.4));
        const capHeight = isZucchetto ? 5 : 4;

        for (let row = 0; row < capHeight; row++) {
          const rowY = headY - capHeight + 2 + row;
          const yNorm = row / capHeight;

          // Dome shape using circle equation
          const arcWidth = Math.round(Math.sqrt(1 - Math.pow(1 - yNorm, 2)) * radius * 2);
          const startX = centerX - Math.floor(arcWidth / 2);

          for (let x = 0; x < arcWidth; x++) {
            const xNorm = x / arcWidth;
            let col = relBase;

            // 3D dome shading
            if (xNorm < 0.15) col = relDeep;
            else if (xNorm < 0.25) col = relShade;
            else if (xNorm > 0.85) col = relDeep;
            else if (xNorm > 0.75) col = relShade;
            else if (xNorm > 0.4 && xNorm < 0.6 && row < 2) col = relLight;
            else if (xNorm > 0.35 && xNorm < 0.65) col = relMid;

            // Fabric panel lines (typical kippah construction)
            if (!isZucchetto && (x % 4 === 0) && row > 0) {
              col = createShadow(col, 0.9);
            }

            // Satin sheen for zucchetto
            if (isZucchetto && row < 2 && xNorm > 0.35 && xNorm < 0.55) {
              col = relLight;
            }

            elements.push(<rect key={`cap-${row}-${x}`} x={startX + x} y={rowY} width="1" height="1" fill={col} className="pixel" />);
          }
        }

        // Small stem/button on top for zucchetto
        if (isZucchetto) {
          elements.push(
            <rect key="zuc-stem" x={centerX} y={headY - capHeight + 1} width="1" height="1" fill={relShade} className="pixel" />
          );
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