/**
 * Mouth renderer for procedural portraits
 * Handles lip shape, expressions, and lip coloring
 */

import React, { useMemo } from 'react';
import { createShadow, createHighlight } from '../utils/colorUtils';

interface MouthRendererProps {
  headX: number;
  headY: number;
  headDimWidth: number;
  headDimHeight: number;
  lipShape: string;
  lipColor?: string;
  skinTone: string;
  skinMidtone: string;
  isFemale: boolean;
  isOld: boolean;
  isYoung: boolean;
  character: {
    fatigue?: number;
    maxFatigue?: number;
    health?: number;
    maxHealth?: number;
    diseaseHealth?: { currentDiseases?: any[] };
  };
  expressionType: number;
  temporaryExpression?: string;
  exprIsSmirk: boolean;
}

export const MouthRenderer: React.FC<MouthRendererProps> = ({
  headX,
  headY,
  headDimWidth,
  headDimHeight,
  lipShape,
  lipColor,
  skinTone,
  skinMidtone,
  isFemale,
  isOld,
  isYoung,
  character,
  expressionType,
  temporaryExpression,
  exprIsSmirk
}) => {
  const mouthElements = useMemo(() => {
    const elements: JSX.Element[] = [];

    const mouthX = headX + Math.floor(headDimWidth / 2);
    const mouthY = headY + Math.floor(headDimHeight * 0.72);

    const isFatigued =
      character.fatigue !== undefined && character.maxFatigue !== undefined &&
      (character.fatigue / character.maxFatigue) < 0.4;

    const isIll =
      (character.health !== undefined && character.maxHealth !== undefined && (character.health / character.maxHealth) < 0.6) ||
      (character.diseaseHealth?.currentDiseases && character.diseaseHealth.currentDiseases.length > 0);

    const baseLip = lipColor || ((): string => {
      const map: Record<string, string> = {
        very_pale: '#E8B4B8', pale: '#E0A5A8', fair: '#D89598', light: '#CE8588',
        medium: '#C47578', olive: '#BA6568', tan: '#B05558', dark: '#A64548', very_dark: '#9C3538'
      };
      // Use skinTone as fallback since we don't have actual skin tone value
      return map['medium'] || '#C47578';
    })();

    let actualLipColor = isIll ? createShadow(baseLip, 0.85) : baseLip;

    if (isOld) {
      actualLipColor = createShadow(actualLipColor, 0.85);
    } else if (isYoung) {
      actualLipColor = createHighlight(actualLipColor, 1.1);
    }

    let actualExpressionType = expressionType;
    if ((isFatigued || isIll) && actualExpressionType !== 1) {
      actualExpressionType = 2;
    }

    let halfW = 3;
    if (lipShape === 'wide') halfW = 4;
    if (lipShape === 'thin') halfW = Math.max(2, halfW);

    if (isOld) {
      halfW = Math.max(2, halfW - 1);
    } else if (isYoung) {
      halfW = halfW + 1;
    }

    if (!isFemale) {
      halfW = Math.floor(halfW * 0.9);
    }

    const px = (dx: number, dy: number, fill: string, opacity?: number) => {
      const rect = <rect key={`m-${dx}-${dy}`} x={mouthX + dx} y={mouthY + dy} width="1" height="1" fill={fill} className="pixel" />;
      if (opacity !== undefined) {
        return React.cloneElement(rect, { opacity });
      }
      elements.push(rect);
    };

    const curve = (dx: number): number => {
      const t = dx / halfW;
      switch (actualExpressionType) {
        case 1:
          if (exprIsSmirk) {
            const rightLift = Math.round(1.5 * (t > 0 ? t : 0));
            return (t < -0.6 ? 0 : t < -0.2 ? 0 : t < 0.2 ? 0 : 1) - rightLift;
          }
          return Math.round(-1.2 * (1 - Math.abs(t)));
        case 2:
          return Math.round(1.2 * (1 - Math.abs(t)));
        case 4:
          return (Math.abs(dx) <= 1) ? 0 : (Math.abs(dx) === halfW ? 0 : 0);
        default:
          return 0;
      }
    };

    // Clear mouth area but preserve the space above for under-nose shadow
    for (let y = -1; y <= 3; y++) {
      for (let x = -halfW - 1; x <= halfW + 1; x++) {
        px(x, y, skinTone);
      }
    }

    // Lip colors
    const upperLipColor = createShadow(actualLipColor, isFemale ? 0.95 : 0.98);
    const lowerLipColor = actualLipColor;

    // Enhanced lip rendering
    for (let dx = -halfW; dx <= halfW; dx++) {
      const cy = curve(dx);

      const isCenter = Math.abs(dx) <= 1;
      const isSide = Math.abs(dx) >= halfW - 1;

      // Upper lip with cupid's bow
      if (isCenter) {
        px(dx, cy - 1, createShadow(upperLipColor, 0.92));
      }
      px(dx, cy, upperLipColor);

      // Lower lip
      px(dx, cy + 1, lowerLipColor);

      // Full lips get extra volume
      if ((lipShape === 'full' || lipShape === 'bow' || isYoung) && !isOld) {
        if (actualExpressionType !== 4 && !isSide) {
          px(dx, cy + 2, createShadow(lowerLipColor, 0.98));
        }
      }
    }

    // Philtrum definition
    px(0, -2, createShadow(skinTone, 0.94));
    px(0, -3, createShadow(skinTone, 0.97));
    px(-1, -2, createShadow(skinTone, 0.96));
    px(1, -2, createShadow(skinTone, 0.96));

    // Mouth corners
    px(-halfW - 1, 1, createShadow(skinTone, 0.94));
    px(halfW + 1, 1, createShadow(skinTone, 0.94));

    // Expression-specific effects
    if (actualExpressionType === 1) {
      if (exprIsSmirk) {
        px(halfW + 2, -1, createShadow(skinTone, 0.88));
      } else {
        px(-halfW - 2, -1, createShadow(skinTone, 0.88));
        px(halfW + 2, -1, createShadow(skinTone, 0.88));
      }
      px(-halfW - 1, -2, createHighlight(skinTone, 1.05));
      px(halfW + 1, -2, createHighlight(skinTone, 1.05));
    } else if (actualExpressionType === 2) {
      if (temporaryExpression === 'scowl') {
        px(-halfW - 1, 3, createShadow(skinTone, 0.82));
        px(halfW + 1, 3, createShadow(skinTone, 0.82));
      }
    } else if (actualExpressionType === 4) {
      px(0, 0, createShadow(actualLipColor, 0.75));
      px(0, 1, createShadow(actualLipColor, 0.75));
    }

    // ENHANCED 3D LIP MODELING

    // Advanced lip volume with proper light/shadow modeling
    if (lipShape !== 'thin' && !isOld) {
      // Central lip highlight - main lip volume
      const centralHighlight = createHighlight(actualLipColor, 1.18);
      const volumeHighlight = createHighlight(actualLipColor, 1.12);
      const lipFormShadow = createShadow(actualLipColor, 0.92);

      // Upper lip volume - creates the lip tubercle
      px(0, 0, volumeHighlight);
      px(-1, 0, lipFormShadow);
      px(1, 0, lipFormShadow);

      // Lower lip main volume - center highlight
      px(0, 1, centralHighlight);
      px(0, 2, volumeHighlight);

      // Lip side form modeling
      if (isFemale || isYoung) {
        const sideVolumeHighlight = createHighlight(lowerLipColor, 1.1);
        const sideFormShadow = createShadow(lowerLipColor, 0.94);

        // Side volume highlights
        px(-1, 1, sideVolumeHighlight);
        px(1, 1, sideVolumeHighlight);
        px(-2, 1, sideFormShadow);
        px(2, 1, sideFormShadow);

        // Lower lip side volume
        px(-1, 2, sideVolumeHighlight);
        px(1, 2, sideVolumeHighlight);
      }

      // Lip edge definition for realism
      const lipEdgeColor = createShadow(actualLipColor, 0.85);
      px(-halfW, 0, lipEdgeColor);
      px(halfW, 0, lipEdgeColor);
      px(-halfW, 1, lipEdgeColor);
      px(halfW, 1, lipEdgeColor);
    }

    // Enhanced cupid's bow definition
    const cupidsBowHighlight = createHighlight(upperLipColor, 1.15);
    const cupidsBowShadow = createShadow(upperLipColor, 0.88);

    px(0, -1, cupidsBowHighlight);
    px(-1, -1, cupidsBowShadow);
    px(1, -1, cupidsBowShadow);

    // Lip commissure (corner) modeling
    const commissureColor = createShadow(skinTone, 0.9);
    const deepCommissureColor = createShadow(skinTone, 0.85);

    px(-halfW - 1, 0, commissureColor);
    px(halfW + 1, 0, commissureColor);
    px(-halfW - 1, 1, deepCommissureColor);
    px(halfW + 1, 1, deepCommissureColor);

    // Mouth corner depth for realism
    if (actualExpressionType !== 1) { // Not smiling
      px(-halfW - 2, 0, deepCommissureColor);
      px(halfW + 2, 0, deepCommissureColor);
    }

    // Re-add under-nose shadow
    for (let dx = -Math.floor(halfW * 0.7); dx <= Math.floor(halfW * 0.7); dx++) {
      px(dx, -2, skinMidtone);
    }

    // Under-lip shadow
    const lipBottomY = lipShape === 'full' || lipShape === 'bow' || isYoung ? 3 : 2;
    for (let dx = -halfW; dx <= halfW; dx++) {
      elements.push(
        <rect key={`under-lip-${dx}`} x={mouthX + dx} y={mouthY + lipBottomY} width="1" height="1" fill={skinMidtone} className="pixel" />
      );
    }

    return elements;
  }, [
    headX, headY, headDimWidth, headDimHeight, lipShape, lipColor, skinTone,
    skinMidtone, isFemale, isOld, isYoung, character, expressionType,
    temporaryExpression, exprIsSmirk
  ]);

  return <g key="mouth">{mouthElements}</g>;
};

export default MouthRenderer;