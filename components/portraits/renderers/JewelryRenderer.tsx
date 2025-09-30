/**
 * Jewelry renderer for procedural portraits
 * Complete sophisticated jewelry system with materials, styles, and cultural variations
 * Extracted from ProceduralPortrait.tsx - preserves all original sophistication
 */

import React, { useMemo } from 'react';
import { createShadow, createHighlight } from '../utils/colorUtils';

interface JewelryRendererProps {
  appearanceWithDefaults: any;
  headX: number;
  headY: number;
  headDim: { width: number; height: number };
  isWealthy: boolean;
}

export const JewelryRenderer: React.FC<JewelryRendererProps> = ({
  appearanceWithDefaults,
  headX,
  headY,
  headDim,
  isWealthy
}) => {
  const jewelryElements = useMemo(() => {
    if (!appearanceWithDefaults.jewelry || appearanceWithDefaults.jewelry.length === 0) return [];

    const elements: JSX.Element[] = [];

    appearanceWithDefaults.jewelry.forEach((piece: any, index: number) => {
      const material = piece.material;
      const style = piece.style;

      const materialColors: Record<string, string> = {
        gold: '#FFD700',
        silver: '#C0C0C0',
        bronze: '#CD7F32',
        pearl: '#FFF8DC',
        bone: '#FFFFF0',
        wood: '#8B4513',
        gems: '#FFD700'
      };
      const jewelryColor = materialColors[material] || '#FFD700';
      const gemColors = piece.gems || ['#DC143C', '#4169E1', '#50C878'];

      switch (piece.type) {
        case 'necklace': {
          const necklaceY = headY + headDim.height + 2; // Closer to neck
          const centerX = headX + Math.floor(headDim.width / 2);

          // Different chain styles based on style attribute
          if (style === 'delicate') {
            // Delicate chain - thin links
            for (let x = centerX - 12; x <= centerX + 12; x++) {
              const distFromCenter = Math.abs(x - centerX);
              const yOffset = Math.floor(Math.sqrt(144 - distFromCenter * distFromCenter) * 0.12); // Natural curve
              if (x % 2 === 0) {
                elements.push(<rect key={`necklace-${index}-${x}`} x={x} y={necklaceY + yOffset} width="1" height="1" fill={jewelryColor} className="pixel" />);
              }
            }
          } else if (style === 'chunky') {
            // Chunky chain - thick linked appearance
            for (let x = centerX - 10; x <= centerX + 10; x++) {
              const distFromCenter = Math.abs(x - centerX);
              const yOffset = Math.floor(Math.sqrt(100 - distFromCenter * distFromCenter) * 0.15);
              if (x % 3 <= 1) {
                elements.push(<rect key={`necklace-${index}-${x}`} x={x} y={necklaceY + yOffset} width="2" height="2" fill={jewelryColor} className="pixel" />);
                if (x % 3 === 0) {
                  elements.push(<rect key={`necklace-sh-${index}-${x}`} x={x + 1} y={necklaceY + yOffset + 1} width="1" height="1" fill={createShadow(jewelryColor, 0.8)} className="pixel" />);
                }
              }
            }
          } else {
            // Standard chain with proper links
            for (let x = centerX - 11; x <= centerX + 11; x++) {
              const distFromCenter = Math.abs(x - centerX);
              const yOffset = Math.floor(Math.sqrt(121 - distFromCenter * distFromCenter) * 0.13);

              // Create interlocking link pattern
              if (x % 3 === 0) {
                elements.push(<rect key={`necklace-${index}-${x}`} x={x} y={necklaceY + yOffset} width="1" height="1" fill={jewelryColor} className="pixel" />);
                elements.push(<rect key={`necklace-l-${index}-${x}`} x={x} y={necklaceY + yOffset + 1} width="1" height="1" fill={jewelryColor} className="pixel" />);
              } else if (x % 3 === 1) {
                elements.push(<rect key={`necklace-${index}-${x}`} x={x} y={necklaceY + yOffset + 1} width="1" height="1" fill={jewelryColor} className="pixel" />);
              }
            }
          }

          // Add beads or gems if specified
          if (material === 'gems' || material === 'pearl') {
            for (let x = centerX - 9; x <= centerX + 9; x += 4) {
              const distFromCenter = Math.abs(x - centerX);
              const yOffset = Math.floor(Math.sqrt(81 - distFromCenter * distFromCenter) * 0.15);
              const gemColor = material === 'pearl' ? '#FFF8DC' : gemColors[Math.abs(Math.floor(x / 4)) % gemColors.length];
              // Bead/gem with highlight
              elements.push(
                <rect key={`bead-${index}-${x}`} x={x} y={necklaceY + yOffset} width="2" height="2" fill={gemColor} className="pixel" />,
                <rect key={`bead-hl-${index}-${x}`} x={x} y={necklaceY + yOffset} width="1" height="1" fill={createHighlight(gemColor, 1.3)} className="pixel" />
              );
            }
          }

          // Ornate pendant
          if (style === 'ornate') {
            const pendantY = necklaceY + 6;
            // Detailed ornate pendant
            elements.push(
              // Bail (connector to chain)
              <rect key={`bail-${index}`} x={centerX} y={pendantY - 1} width="1" height="2" fill={jewelryColor} className="pixel" />,
              // Pendant body
              <rect key={`pendant-t-${index}`} x={centerX - 2} y={pendantY + 1} width="5" height="1" fill={jewelryColor} className="pixel" />,
              <rect key={`pendant-m-${index}`} x={centerX - 3} y={pendantY + 2} width="7" height="3" fill={jewelryColor} className="pixel" />,
              <rect key={`pendant-b-${index}`} x={centerX - 2} y={pendantY + 5} width="5" height="1" fill={jewelryColor} className="pixel" />,
              // Highlight and shadow
              <rect key={`pendant-hl-${index}`} x={centerX - 2} y={pendantY + 2} width="1" height="1" fill={createHighlight(jewelryColor, 1.3)} className="pixel" />,
              <rect key={`pendant-sh-${index}`} x={centerX + 2} y={pendantY + 4} width="1" height="1" fill={createShadow(jewelryColor, 0.7)} className="pixel" />,
              // Central gem
              <rect key={`pendant-gem-${index}`} x={centerX - 1} y={pendantY + 3} width="3" height="1" fill={gemColors[0]} className="pixel" />,
              <rect key={`pendant-gem-hl-${index}`} x={centerX} y={pendantY + 3} width="1" height="1" fill={createHighlight(gemColors[0], 1.4)} className="pixel" />
            );
          }
          break;
        }
        case 'earrings': {
          // Calculate ear positions based on face shape
          const earMidRatio = 0.45; // Middle of the ear
          const earY = headY + Math.floor(headDim.height * earMidRatio);

          // Use face shape calculations for accurate ear placement
          const faceShape = (appearanceWithDefaults.faceShape || 'oval').toLowerCase();
          const baseCurve: Record<string, { crownRoundness: number }> = {
            oval:     { crownRoundness: 0.34 },
            round:    { crownRoundness: 0.30 },
            square:   { crownRoundness: 0.36 },
            heart:    { crownRoundness: 0.32 },
            diamond:  { crownRoundness: 0.33 },
            long:     { crownRoundness: 0.36 },
          };
          const widthAnchors: Record<string, { topW: number; cheekW: number; chinW: number }> = {
            oval:    { topW: 0.55, cheekW: 1.00, chinW: 0.68 },
            round:   { topW: 0.60, cheekW: 1.04, chinW: 0.78 },
            square:  { topW: 0.65, cheekW: 1.02, chinW: 0.84 },
            heart:   { topW: 0.58, cheekW: 1.02, chinW: 0.58 },
            diamond: { topW: 0.50, cheekW: 1.06, chinW: 0.66 },
            long:    { topW: 0.52, cheekW: 0.98, chinW: 0.64 },
          };

          const curve = baseCurve[faceShape] ?? baseCurve.oval;
          const { cheekW } = widthAnchors[faceShape] ?? widthAnchors.oval;

          // Calculate face width at ear level
          const earT = 0.45;
          const earWidth = Math.floor(headDim.width * cheekW);
          const centerX = headX + Math.floor(headDim.width / 2);

          const earLX = centerX - Math.floor(earWidth / 2) - 2;
          const earRX = centerX + Math.floor(earWidth / 2) + 2;

          if (style === 'simple') {
            // Stud earrings with highlight
            elements.push(
              <rect key={`earring-l-${index}`} x={earLX} y={earY} width="2" height="2" fill={jewelryColor} className="pixel" />,
              <rect key={`earring-l-hl-${index}`} x={earLX} y={earY} width="1" height="1" fill={createHighlight(jewelryColor, 1.3)} className="pixel" />,
              <rect key={`earring-r-${index}`} x={earRX} y={earY} width="2" height="2" fill={jewelryColor} className="pixel" />,
              <rect key={`earring-r-hl-${index}`} x={earRX} y={earY} width="1" height="1" fill={createHighlight(jewelryColor, 1.3)} className="pixel" />
            );

            if (material === 'gems' || material === 'pearl') {
              const gemCol = material === 'pearl' ? '#FFF8DC' : gemColors[0];
              elements.push(
                <rect key={`earring-l-gem-${index}`} x={earLX} y={earY} width="1" height="1" fill={gemCol} className="pixel" />,
                <rect key={`earring-r-gem-${index}`} x={earRX} y={earY} width="1" height="1" fill={gemCol} className="pixel" />
              );
            }
          } else if (style === 'ornate' || style === 'delicate') {
            // Dangling earrings
            const length = style === 'ornate' ? 5 : 3;

            // Hook/post
            elements.push(
              <rect key={`earring-l-hook-${index}`} x={earLX} y={earY - 1} width="1" height="2" fill={jewelryColor} className="pixel" />,
              <rect key={`earring-r-hook-${index}`} x={earRX} y={earY - 1} width="1" height="2" fill={jewelryColor} className="pixel" />
            );

            // Dangling elements
            for (let d = 0; d < length; d++) {
              const isGem = d === length - 1 && material === 'gems';
              const col = isGem ? gemColors[0] : jewelryColor;
              const width = (d === length - 1) ? 2 : 1;

              elements.push(
                <rect key={`earring-l-drop-${index}-${d}`} x={earLX - Math.floor(d * 0.2)} y={earY + d + 1} width={width} height="1" fill={col} className="pixel" />,
                <rect key={`earring-r-drop-${index}-${d}`} x={earRX - Math.floor(d * 0.2)} y={earY + d + 1} width={width} height="1" fill={col} className="pixel" />
              );

              if (isGem) {
                elements.push(
                  <rect key={`earring-l-gem-hl-${index}`} x={earLX} y={earY + d + 1} width="1" height="1" fill={createHighlight(col, 1.4)} className="pixel" />,
                  <rect key={`earring-r-gem-hl-${index}`} x={earRX} y={earY + d + 1} width="1" height="1" fill={createHighlight(col, 1.4)} className="pixel" />
                );
              }
            }
          } else if (style === 'chunky') {
            // Hoop earrings
            const hoopSize = 3;
            for (let h = 0; h < hoopSize; h++) {
              elements.push(
                <rect key={`earring-l-hoop-${index}-${h}`} x={earLX - h} y={earY + h} width="1" height="1" fill={jewelryColor} className="pixel" />,
                <rect key={`earring-l-hoop-b-${index}-${h}`} x={earLX - h + 1} y={earY + hoopSize} width="1" height="1" fill={jewelryColor} className="pixel" />,
                <rect key={`earring-r-hoop-${index}-${h}`} x={earRX + h} y={earY + h} width="1" height="1" fill={jewelryColor} className="pixel" />,
                <rect key={`earring-r-hoop-b-${index}-${h}`} x={earRX + h - 1} y={earY + hoopSize} width="1" height="1" fill={jewelryColor} className="pixel" />
              );
            }
            elements.push(
              <rect key={`earring-l-hoop-hl-${index}`} x={earLX} y={earY} width="1" height="1" fill={createHighlight(jewelryColor, 1.3)} className="pixel" />,
              <rect key={`earring-r-hoop-hl-${index}`} x={earRX} y={earY} width="1" height="1" fill={createHighlight(jewelryColor, 1.3)} className="pixel" />
            );
          }
          break;
        }
        case 'bracelet': {
          const wristY = 58;
          const leftWristX = 16;
          const rightWristX = 44;
          const braceletWidth = style === 'chunky' ? 3 : style === 'delicate' ? 1 : 2;
          for (let w = 0; w < braceletWidth; w++) {
            for (let x = 0; x < 6; x++) {
              if (style === 'ornate' && x % 2 === 0) {
                elements.push(
                  <rect key={`bracelet-l-gem-${index}-${w}-${x}`} x={leftWristX + x} y={wristY + w} width="1" height="1" fill={gemColors[0]} className="pixel" />,
                  <rect key={`bracelet-r-gem-${index}-${w}-${x}`} x={rightWristX + x} y={wristY + w} width="1" height="1" fill={gemColors[0]} className="pixel" />
                );
              } else {
                elements.push(
                  <rect key={`bracelet-l-${index}-${w}-${x}`} x={leftWristX + x} y={wristY + w} width="1" height="1" fill={jewelryColor} className="pixel" />,
                  <rect key={`bracelet-r-${index}-${w}-${x}`} x={rightWristX + x} y={wristY + w} width="1" height="1" fill={jewelryColor} className="pixel" />
                );
              }
            }
          }
          break;
        }
        case 'circlet': {
          const circletY = headY + 2;
          for (let x = headX + 2; x < headX + headDim.width - 2; x++) {
            if (style === 'ornate' && (x - headX) % 4 === 0) {
              elements.push(<rect key={`circlet-gem-${index}-${x}`} x={x} y={circletY} width="1" height="1" fill={gemColors[0]} className="pixel" />);
            } else if ((x - headX) % 2 === 0 || style !== 'delicate') {
              elements.push(<rect key={`circlet-${index}-${x}`} x={x} y={circletY} width="1" height="1" fill={jewelryColor} className="pixel" />);
            }
          }
          if (style === 'ornate') {
            const centerX = headX + Math.floor(headDim.width / 2);
            elements.push(
              <rect key={`circlet-center-${index}`} x={centerX - 1} y={circletY - 1} width="3" height="3" fill={jewelryColor} className="pixel" />,
              <rect key={`circlet-center-gem-${index}`} x={centerX} y={circletY} width="1" height="1" fill={gemColors[0]} className="pixel" />
            );
          }
          break;
        }
        case 'ring': {
          const handY = 60;
          const leftHandX = 18;
          const rightHandX = 42;
          elements.push(
            <rect key={`ring-l-${index}`} x={leftHandX} y={handY} width="1" height="1" fill={jewelryColor} className="pixel" />,
            <rect key={`ring-r-${index}`} x={rightHandX} y={handY} width="1" height="1" fill={jewelryColor} className="pixel" />
          );
          break;
        }
      }

    });

    return elements;
  }, [
    appearanceWithDefaults.jewelry,
    headDim.height,
    headDim.width,
    headX,
    headY,
    isWealthy
  ]);

  return <g key="jewelry">{jewelryElements}</g>;
};

export default JewelryRenderer;