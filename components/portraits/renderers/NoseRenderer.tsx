/**
 * Nose renderer for procedural portraits
 * Handles nose shape, cultural variations, and illness effects
 */

import React, { useMemo } from 'react';
import { createShadow, createHighlight } from '../utils/colorUtils';

interface NoseRendererProps {
  headX: number;
  headY: number;
  headDimWidth: number;
  headDimHeight: number;
  hairLength: string;
  noseShape: string;
  culturalZone: string;
  isFemale: boolean;
  isOld: boolean;
  skinTone: string;
  skinHighlight: string;
  skinMidtone: string;
  skinShadow: string;
  skinBrightHighlight: string;
  skinDeepShadow: string;
  actualSkinTone: string;
  character: {
    health?: number;
    maxHealth?: number;
    diseaseHealth?: { currentDiseases?: any[] };
  };
  rand: (seed: number) => number;
}

export const NoseRenderer: React.FC<NoseRendererProps> = ({
  headX,
  headY,
  headDimWidth,
  headDimHeight,
  hairLength,
  noseShape,
  culturalZone,
  isFemale,
  isOld,
  skinTone,
  skinHighlight,
  skinMidtone,
  skinShadow,
  skinBrightHighlight,
  skinDeepShadow,
  actualSkinTone,
  character,
  rand
}) => {
  const noseElements = useMemo(() => {
    const elements: JSX.Element[] = [];

    const isIll =
      (character.health !== undefined && character.maxHealth !== undefined && (character.health / character.maxHealth) < 0.6) ||
      (character.diseaseHealth?.currentDiseases && character.diseaseHealth.currentDiseases.length > 0);

    const zoneBias = (() => {
      switch (culturalZone) {
        case 'MENA': return { longProb: 0.35, broadProb: 0.25 };
        case 'SOUTH_ASIAN': return { longProb: 0.32, broadProb: 0.2 };
        case 'EAST_ASIAN': return { longProb: 0.25, broadProb: 0.18 };
        case 'SUB_SAHARAN_AFRICAN': return { longProb: 0.28, broadProb: 0.3 };
        case 'EUROPEAN': return { longProb: 0.3, broadProb: 0.22 };
        default: return { longProb: 0.3, broadProb: 0.22 };
      }
    })();

    const rW = rand(901) + (isOld ? 0.05 : 0) + (isFemale ? -0.02 : 0);
    const rL = rand(902) + (isOld ? 0.08 : 0);
    const wide = rW < zoneBias.broadProb ? 1 : 0;
    const long = rL < zoneBias.longProb ? 1 : 0;

    const declared = noseShape || 'straight';
    let widthMul = 1, lengthMul = 1, bump = 0, tipUp = 0;
    switch (declared) {
      case 'aquiline': bump = 1; lengthMul += 0.2; break;
      case 'broad': widthMul += 0.25; break;
      case 'button': tipUp = 1; widthMul -= 0.1; lengthMul -= 0.15; break;
      case 'roman': bump = 1; lengthMul += 0.15; break;
    }
    if (wide) widthMul += 0.15;
    if (long) lengthMul += 0.15;

    const noseX = headX + Math.floor(headDimWidth / 2) - 1;
    const mouthY = headY + Math.floor(headDimHeight * 0.72);
    const eyeY = headY + Math.floor(headDimHeight * (hairLength === 'bald' ? 0.42 : hairLength === 'very_short' ? 0.4 : hairLength === 'short' ? 0.36 : 0.35));

    const noseStartY = eyeY + 4;
    const maxLenToPhiltrum = Math.max(3, mouthY - 2 - noseStartY);
    const noseLen = Math.min(maxLenToPhiltrum, Math.round((5 + (long ? 2 : 0) + (isOld ? 1 : 0)) * lengthMul));
    const noseWidth = Math.max(3, Math.round((declared === 'broad' ? 4 : 3) * widthMul));

    // Nose bridge highlights
    for (let i = 0; i < Math.max(1, noseLen - 2); i++) {
      elements.push(
        <rect key={`nbh-${i}`} x={noseX + 1} y={noseStartY - 1 + i} width="1" height="1" fill={i < 2 ? skinHighlight : skinMidtone} className="pixel" />
      );
    }

    // Nose bump for aquiline/roman noses
    if (bump) {
      elements.push(
        <rect key="bump-1" x={noseX + 1} y={noseStartY + Math.floor(noseLen / 3)} width="2" height="1" fill={skinTone} className="pixel" />
      );
    }

    // Main nose body
    elements.push(
      <rect key="nose-body" x={noseX} y={noseStartY} width={Math.max(1, noseWidth - 1)} height={noseLen} fill={skinTone} className="pixel" />
    );

    // Nose sides
    elements.push(
      <rect key="nose-side-l" x={noseX - 1} y={noseStartY + 1} width="1" height={Math.max(1, noseLen - 1)} fill={skinShadow} className="pixel" />,
      <rect key="nose-side-r" x={noseX + noseWidth - 1} y={noseStartY + 1} width="1" height={Math.max(1, noseLen - 2)} fill={skinHighlight} className="pixel" />
    );

    const tipY = noseStartY + noseLen - 1;
    const tipHL = tipUp ? skinHighlight : skinBrightHighlight;

    // Illness effects
    if (isIll) {
      elements.push(
        <rect key="red-nose-tip" x={noseX + Math.floor(noseWidth / 2) - 1} y={tipY} width="2" height="1" fill="rgba(255, 120, 120, 0.6)" className="pixel" />,
        <rect key="red-nose-area" x={noseX} y={tipY - 1} width={noseWidth} height="2" fill="rgba(255, 140, 140, 0.3)" className="pixel" />
      );
    }

    // Nose tip
    elements.push(
      <rect key="nose-tip" x={noseX + Math.floor(noseWidth / 2) - 1} y={tipY} width="2" height="1" fill={isIll ? "rgba(255, 180, 180, 0.8)" : tipHL} className="pixel" />,
      <rect key="nose-tip-extra" x={noseX + Math.floor(noseWidth / 2) + 1} y={tipY} width="1" height="1" fill={skinHighlight} opacity="0.8" className="pixel" />
    );

    // Nostrils
    const nostrilY = Math.min(tipY + (tipUp ? 0 : 1), mouthY - 2);
    elements.push(
      <rect key="nostril-l" x={noseX} y={nostrilY} width="1" height="1" fill={skinDeepShadow} className="pixel" />,
      <rect key="nostril-r" x={noseX + noseWidth - 2} y={nostrilY} width="1" height="1" fill={skinDeepShadow} className="pixel" />,
      <rect key="subnasal-shadow" x={noseX + 1} y={nostrilY + 1} width={Math.max(1, noseWidth - 3)} height="1" fill={isIll ? "rgba(255, 160, 160, 0.4)" : skinShadow} className="pixel" />
    );

    // Enhanced nostril definition
    const nostrilShadow = createShadow(actualSkinTone, 0.85);
    const noseBridgeHighlight = createHighlight(actualSkinTone, 1.15);
    const nostrilSubtle = createShadow(actualSkinTone, 0.92);

    elements.push(
      <rect key="nostril-depth-l" x={noseX} y={nostrilY - 1} width="1" height="1" fill={nostrilShadow} opacity="0.4" className="pixel" />,
      <rect key="nostril-depth-r" x={noseX + noseWidth - 2} y={nostrilY - 1} width="1" height="1" fill={nostrilShadow} opacity="0.4" className="pixel" />
    );

    // Under-nose shadow
    const underNoseShadow = skinMidtone;
    elements.push(
      <rect key="under-nose-shadow" x={noseX} y={nostrilY + 2} width={noseWidth - 1} height="1" fill={underNoseShadow} className="pixel" />
    );

    // Subtle nostril rim highlighting
    if (!isIll) {
      elements.push(
        <rect key="nostril-rim-l" x={noseX + 1} y={nostrilY} width="1" height="1" fill={nostrilSubtle} opacity="0.3" className="pixel" />,
        <rect key="nostril-rim-r" x={noseX + noseWidth - 3} y={nostrilY} width="1" height="1" fill={nostrilSubtle} opacity="0.3" className="pixel" />
      );
    }

    // ENHANCED 3D NOSE MODELING

    // Nose bridge highlight gradient - More sophisticated
    const bridgeStartY = noseStartY + 1;
    const bridgeLength = Math.min(4, Math.floor(noseLen * 0.7));

    // Central bridge highlight - creates the main nose ridge
    for (let i = 0; i < bridgeLength; i++) {
      const intensity = 1 - (i / bridgeLength) * 0.5;
      const width = i < 2 ? 1 : 2; // Wider at the bottom

      for (let w = 0; w < width; w++) {
        elements.push(
          <rect key={`bridge-highlight-${i}-${w}`}
            x={noseX + 1 + w} y={bridgeStartY + i} width="1" height="1"
            fill={noseBridgeHighlight} opacity={0.15 * intensity} className="pixel" />
        );
      }
    }

    // Side plane definition - Creates 3D nose volume
    const sidePlaneColor = createShadow(actualSkinTone, 0.93);
    const deepSidePlaneColor = createShadow(actualSkinTone, 0.88);

    for (let i = 1; i < noseLen - 1; i++) {
      const y = noseStartY + i;
      const widthAtHeight = Math.min(noseWidth, 2 + Math.floor(i * 0.3));

      // Left side plane (darker due to lighting)
      if (noseX - 2 >= 0) {
        elements.push(
          <rect key={`nose-plane-l-${i}`} x={noseX - 2} y={y} width="1" height="1"
            fill={i > noseLen * 0.6 ? deepSidePlaneColor : sidePlaneColor} className="pixel" />
        );
      }

      // Right side plane (lighter due to lighting)
      if (noseX + widthAtHeight < noseX + noseWidth + 2) {
        const rightPlaneColor = createHighlight(sidePlaneColor, 1.05);
        elements.push(
          <rect key={`nose-plane-r-${i}`} x={noseX + widthAtHeight + 1} y={y} width="1" height="1"
            fill={rightPlaneColor} className="pixel" />
        );
      }
    }

    // Nostril cavity depth - Enhanced 3D nostrils
    const nostrilDepthColor = createShadow(actualSkinTone, 0.75);
    const nostrilCavityColor = createShadow(actualSkinTone, 0.65);

    // Create nostril cavities with proper depth
    elements.push(
      // Left nostril cavity
      <rect key="nostril-cavity-l1" x={noseX - 1} y={nostrilY - 1} width="2" height="2"
        fill={nostrilCavityColor} opacity="0.6" className="pixel" />,
      <rect key="nostril-cavity-l2" x={noseX} y={nostrilY} width="1" height="1"
        fill={nostrilDepthColor} className="pixel" />,

      // Right nostril cavity
      <rect key="nostril-cavity-r1" x={noseX + noseWidth - 2} y={nostrilY - 1} width="2" height="2"
        fill={nostrilCavityColor} opacity="0.6" className="pixel" />,
      <rect key="nostril-cavity-r2" x={noseX + noseWidth - 2} y={nostrilY} width="1" height="1"
        fill={nostrilDepthColor} className="pixel" />
    );

    // Nostril wing definition - Creates nostril flare
    const nostrilWingHighlight = createHighlight(actualSkinTone, 1.08);
    const nostrilWingShadow = createShadow(actualSkinTone, 0.92);

    elements.push(
      // Left nostril wing highlights and shadows
      <rect key="nostril-wing-highlight-l" x={noseX - 1} y={nostrilY - 2} width="1" height="1"
        fill={nostrilWingHighlight} className="pixel" />,
      <rect key="nostril-wing-shadow-l" x={noseX - 2} y={nostrilY} width="1" height="2"
        fill={nostrilWingShadow} className="pixel" />,

      // Right nostril wing highlights and shadows
      <rect key="nostril-wing-highlight-r" x={noseX + noseWidth} y={nostrilY - 2} width="1" height="1"
        fill={nostrilWingHighlight} className="pixel" />,
      <rect key="nostril-wing-shadow-r" x={noseX + noseWidth + 1} y={nostrilY} width="1" height="2"
        fill={nostrilWingShadow} className="pixel" />
    );

    // Nose tip volume and form
    const tipVolumeColor = createHighlight(actualSkinTone, 1.12);
    const tipFormShadow = createShadow(actualSkinTone, 0.95);

    // Create nose tip volume
    const tipCenterX = noseX + Math.floor(noseWidth / 2);
    elements.push(
      // Main tip highlight
      <rect key="nose-tip-volume" x={tipCenterX} y={tipY - 1} width="1" height="2"
        fill={tipVolumeColor} className="pixel" />,
      // Tip form shadows
      <rect key="nose-tip-form-l" x={tipCenterX - 1} y={tipY} width="1" height="1"
        fill={tipFormShadow} className="pixel" />,
      <rect key="nose-tip-form-r" x={tipCenterX + 1} y={tipY} width="1" height="1"
        fill={tipFormShadow} className="pixel" />
    );

    // Septum definition for realism
    if (noseWidth >= 4) {
      const septumColor = createShadow(actualSkinTone, 0.88);
      elements.push(
        <rect key="septum" x={tipCenterX} y={nostrilY + 1} width="1" height="1"
          fill={septumColor} opacity="0.7" className="pixel" />
      );
    }

    return elements;
  }, [
    headX, headY, headDimWidth, headDimHeight, hairLength, noseShape, culturalZone,
    isFemale, isOld, skinTone, skinHighlight, skinMidtone, skinShadow,
    skinBrightHighlight, skinDeepShadow, actualSkinTone, character, rand
  ]);

  return <g key="nose">{noseElements}</g>;
};

export default NoseRenderer;