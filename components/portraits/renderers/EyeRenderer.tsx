/**
 * Eye renderer for procedural portraits
 * Handles eyes, eyebrows, lashes, and expression-based eye changes
 */

import React, { useMemo } from 'react';
import { createShadow, createHighlight } from '../utils/colorUtils';

interface EyeRendererProps {
  headX: number;
  headY: number;
  headDimWidth: number;
  headDimHeight: number;
  hairLength: string;
  eyeColor: string;
  eyeShape: string;
  eyebrowShape: string;
  eyebrowThickness: string;
  eyelashes: string;
  isFemale: boolean;
  isOld: boolean;
  hasGrayHair: boolean;
  baseHair: string;
  skinTone: string;
  skinShadow: string;
  skinHighlight: string;
  skinMidtone: string;
  skinDeepShadow: string;
  skinBrightHighlight: string;
  stats: { constitution: number };
  character: {
    fatigue?: number;
    maxFatigue?: number;
    health?: number;
    maxHealth?: number;
    diseaseHealth?: { currentDiseases?: any[] };
  };
  expressionType: number;
  temporaryExpression?: string;
  exprIsSmileFamily: boolean;
  exprIsExcited: boolean;
  exprIsScowl: boolean;
  exprIsAnnoyed: boolean;
  exprIsConcern: boolean;
  exprIsConfused: boolean;
  exprIsSkeptical: boolean;
  exprIsThinking: boolean;
  exprIsDetermined: boolean;
  exprIsTired: boolean;
  exprIsSad: boolean;
  exprIsSmirk: boolean;
  exprIsSurprised: boolean;
  gazeDirection: number;
  microExpression: number;
  blinkProgress: number;
}

export const EyeRenderer: React.FC<EyeRendererProps> = ({
  headX,
  headY,
  headDimWidth,
  headDimHeight,
  hairLength,
  eyeColor,
  eyeShape,
  eyebrowShape,
  eyebrowThickness,
  eyelashes,
  isFemale,
  isOld,
  hasGrayHair,
  baseHair,
  skinTone,
  skinShadow,
  skinHighlight,
  skinMidtone,
  skinDeepShadow,
  skinBrightHighlight,
  stats,
  character,
  expressionType,
  temporaryExpression,
  exprIsSmileFamily,
  exprIsExcited,
  exprIsScowl,
  exprIsAnnoyed,
  exprIsConcern,
  exprIsConfused,
  exprIsSkeptical,
  exprIsThinking,
  exprIsDetermined,
  exprIsTired,
  exprIsSad,
  exprIsSmirk,
  exprIsSurprised,
  gazeDirection,
  microExpression,
  blinkProgress
}) => {
  const eyeElements = useMemo(() => {
    const elements: JSX.Element[] = [];

    const isFatigued =
      character.fatigue !== undefined && character.maxFatigue !== undefined &&
      (character.fatigue / character.maxFatigue) < 0.4;

    const isIll =
      (character.health !== undefined && character.maxHealth !== undefined && (character.health / character.maxHealth) < 0.6) ||
      (character.diseaseHealth?.currentDiseases && character.diseaseHealth.currentDiseases.length > 0);

    const eyeRatioBase = hairLength === 'bald' ? 0.42 : hairLength === 'very_short' ? 0.4 : hairLength === 'short' ? 0.36 : 0.35;
    const eyeY = headY + Math.floor(headDimHeight * eyeRatioBase);

    const eyeSpacing = Math.floor(headDimWidth * 0.24);
    const centerX = headX + Math.floor(headDimWidth / 2);
    const leftEyeX = centerX - eyeSpacing - 2;
    const rightEyeX = centerX + eyeSpacing - 1;

    // Eye socket shadows with enhanced depth
    const socketDepth = eyeShape === 'hooded' ? 0.55 : (isFatigued ? 0.45 : 0.7);
    const socketShadowColor = socketDepth < 0.6 ? skinDeepShadow : skinShadow;

    elements.push(
      <rect key="socket-l" x={leftEyeX - 3} y={eyeY - 2} width="7" height="1" fill={socketShadowColor} className="pixel" />,
      <rect key="socket-r" x={rightEyeX - 3} y={eyeY - 2} width="7" height="1" fill={socketShadowColor} className="pixel" />
    );

    let eyeWidth = 4;
    let eyeHeight = 2;

    // Fatigue bags under eyes
    if (isFatigued) {
      elements.push(
        <rect key="bag-l1" x={leftEyeX - 2} y={eyeY + eyeHeight + 1} width="6" height="1" fill={createShadow(skinTone, 0.75)} className="pixel" />,
        <rect key="bag-r1" x={rightEyeX - 2} y={eyeY + eyeHeight + 1} width="6" height="1" fill={createShadow(skinTone, 0.75)} className="pixel" />,
        <rect key="bag-l2" x={leftEyeX - 1} y={eyeY + eyeHeight + 2} width="4" height="1" fill={createShadow(skinTone, 0.85)} className="pixel" />,
        <rect key="bag-r2" x={rightEyeX - 1} y={eyeY + eyeHeight + 2} width="4" height="1" fill={createShadow(skinTone, 0.85)} className="pixel" />
      );
    }

    // Surprise: widen eyes
    if (exprIsSurprised) {
      eyeWidth += 1;
      eyeHeight += 1;
    }

    // Eye shape adjustments
    switch (eyeShape) {
      case 'round': eyeWidth = Math.max(eyeWidth, 4); eyeHeight = Math.max(eyeHeight, 3); break;
      case 'narrow': eyeWidth = Math.max(eyeWidth, 3); eyeHeight = Math.min(eyeHeight, 2); break;
      case 'wide': eyeWidth = Math.max(eyeWidth, 5); break;
      case 'hooded':
        eyeHeight = Math.min(eyeHeight, 2);
        elements.push(
          <rect key="hood-l" x={leftEyeX - 1} y={eyeY - 1} width="5" height="1" fill={createShadow(skinTone, 0.95)} className="pixel" />,
          <rect key="hood-r" x={rightEyeX - 1} y={eyeY - 1} width="5" height="1" fill={createShadow(skinTone, 0.95)} className="pixel" />
        );
        break;
    }

    // Eye whites
    const eyeWhiteColor = isIll ? '#FFF5F0' : (isFatigued ? '#FFF8F5' : (stats.constitution >= 8 ? '#FFFFFF' : '#FDFDFB'));
    elements.push(
      <rect key="eye-white-l" x={leftEyeX} y={eyeY} width={eyeWidth} height={eyeHeight} fill={eyeWhiteColor} className="pixel" />,
      <rect key="eye-white-r" x={rightEyeX} y={eyeY} width={eyeWidth} height={eyeHeight} fill={eyeWhiteColor} className="pixel" />
    );

    // Tear ducts
    const tearDuctColor = '#FFB6C1';
    elements.push(
      <rect key="tear-duct-l" x={leftEyeX + eyeWidth} y={eyeY} width="1" height="1" fill={tearDuctColor} className="pixel" />,
      <rect key="tear-duct-r" x={rightEyeX - 1} y={eyeY} width="1" height="1" fill={tearDuctColor} className="pixel" />
    );

    // Red veins for tired/ill characters
    if (isFatigued || isIll) {
      const veinColor = 'rgba(255, 192, 192, 0.3)';
      elements.push(
        <rect key="vein-l" x={leftEyeX + 1} y={eyeY + eyeHeight - 1} width="1" height="1" fill={veinColor} className="pixel" />,
        <rect key="vein-r" x={rightEyeX + eyeWidth - 2} y={eyeY + eyeHeight - 1} width="1" height="1" fill={veinColor} className="pixel" />
      );
    }

    // Iris and pupil
    let irisSize = 2;
    let irisOffset = 1;
    if (gazeDirection === 0) irisOffset = 0;
    else if (gazeDirection === 2) irisOffset = eyeWidth - irisSize;

    const irisY = eyeShape === 'round' ? eyeY + 0.5 : eyeY;
    const irisHighlight = createHighlight(eyeColor, 1.2);
    const irisShadow = createShadow(eyeColor, 0.85);

    // Main iris
    elements.push(
      <rect key="iris-l" x={leftEyeX + irisOffset} y={irisY} width={irisSize} height={eyeHeight} fill={eyeColor} className="pixel" />,
      <rect key="iris-r" x={rightEyeX + irisOffset} y={irisY} width={irisSize} height={eyeHeight} fill={eyeColor} className="pixel" />
    );

    // Iris edge definition
    if (irisSize >= 2) {
      elements.push(
        <rect key="iris-edge-l" x={leftEyeX + irisOffset + irisSize - 1} y={irisY} width="1" height={eyeHeight} fill={irisShadow} opacity="0.5" className="pixel" />,
        <rect key="iris-edge-r" x={rightEyeX + irisOffset + irisSize - 1} y={irisY} width="1" height={eyeHeight} fill={irisShadow} opacity="0.5" className="pixel" />
      );
    }

    // Pupils
    let pupilSize = microExpression === 0 ? 1 : 1.5;
    if (exprIsSurprised || exprIsExcited) {
      pupilSize = 2;
    } else if (exprIsDetermined || exprIsAnnoyed) {
      pupilSize = 1;
    } else if (exprIsSkeptical) {
      pupilSize = 1.2;
    }

    const pupilOffset = irisOffset + Math.floor((irisSize - pupilSize) / 2);
    elements.push(
      <rect key="pupil-l" x={leftEyeX + pupilOffset} y={irisY} width={pupilSize} height={Math.min(pupilSize, eyeHeight)} fill="#000000" className="pixel" />,
      <rect key="pupil-r" x={rightEyeX + pupilOffset} y={irisY} width={pupilSize} height={Math.min(pupilSize, eyeHeight)} fill="#000000" className="pixel" />
    );

    // Iris highlights
    elements.push(
      <rect key="iris-highlight-l" x={leftEyeX + irisOffset} y={irisY} width="1" height="1" fill={irisHighlight} className="pixel" />,
      <rect key="iris-highlight-r" x={rightEyeX + irisOffset} y={irisY} width="1" height="1" fill={irisHighlight} className="pixel" />
    );

    // Eye outline for definition (thin line around eye)
    if (exprIsSad || exprIsTired || expressionType === 2 || exprIsAnnoyed || exprIsScowl) {
      const outlineColor = skinDeepShadow;
      elements.push(
        <rect key="outline-l-top" x={leftEyeX - 1} y={eyeY - 1} width={eyeWidth + 2} height="1" fill={outlineColor} className="pixel" />,
        <rect key="outline-r-top" x={rightEyeX - 1} y={eyeY - 1} width={eyeWidth + 2} height="1" fill={outlineColor} className="pixel" />
      );
    }

    // Eye micro-details with age, health effects
    if (isOld || stats.constitution <= 3) {
      const ageLineColor = skinShadow;
      elements.push(
        <rect key="age-l" x={leftEyeX - 2} y={eyeY - 1} width="1" height="1" fill={ageLineColor} className="pixel" />,
        <rect key="age-r" x={rightEyeX + eyeWidth + 1} y={eyeY - 1} width="1" height="1" fill={ageLineColor} className="pixel" />
      );
    }

    // Blood vessel for high stress situations
    if (stats.constitution <= 2 || character.health !== undefined && character.maxHealth !== undefined && character.health / character.maxHealth < 0.3) {
      const vesselColor = 'rgba(200, 100, 100, 0.6)';
      elements.push(
        <rect key="vessel-l" x={leftEyeX} y={eyeY} width="1" height="1" fill={vesselColor} className="pixel" />,
        <rect key="vessel-r" x={rightEyeX + eyeWidth - 1} y={eyeY} width="1" height="1" fill={vesselColor} className="pixel" />
      );
    }

    return elements;
  }, [
    headX, headY, headDimWidth, headDimHeight, hairLength, eyeColor, eyeShape,
    eyebrowShape, eyebrowThickness, eyelashes, isFemale, isOld, hasGrayHair,
    baseHair, skinTone, skinShadow, skinHighlight, skinMidtone, skinDeepShadow,
    skinBrightHighlight, stats, character, expressionType, temporaryExpression,
    exprIsSmileFamily, exprIsExcited, exprIsScowl, exprIsAnnoyed, exprIsConcern,
    exprIsConfused, exprIsSkeptical, exprIsThinking, exprIsDetermined, exprIsTired,
    exprIsSad, exprIsSmirk, exprIsSurprised, gazeDirection, microExpression, blinkProgress
  ]);

  const browElements = useMemo(() => {
    const elements: JSX.Element[] = [];

    const browColor = hasGrayHair ? 'rgb(169,169,169)' : baseHair;
    const eyeRatioBase = hairLength === 'bald' ? 0.42 : hairLength === 'very_short' ? 0.4 : hairLength === 'short' ? 0.36 : 0.35;
    const eyeY = headY + Math.floor(headDimHeight * eyeRatioBase);
    const eyeSpacing = Math.floor(headDimWidth * 0.24);
    const centerX = headX + Math.floor(headDimWidth / 2);
    const leftEyeX = centerX - eyeSpacing - 2;
    const rightEyeX = centerX + eyeSpacing - 1;

    const isSmiling = exprIsSmileFamily || expressionType === 1;
    const browLift = isSmiling ? 2 : exprIsExcited ? 3 : 0;
    const scowlDrop = exprIsScowl ? 2 : exprIsAnnoyed ? 1 : 0;
    const concernDrop = exprIsConcern ? 1 : exprIsConfused ? 2 : 0;

    const smirkRightLift = exprIsSmirk ? 1 : 0;
    const smirkLeftLift = 0;
    const skepticalLeftOnly = exprIsSkeptical ? 2 : 0;
    const confusedAsymmetry = exprIsConfused ? 1 : 0;
    const thinkingLift = exprIsThinking ? 1 : 0;
    const determinedDrop = exprIsDetermined ? 1 : 0;
    const tiredDrop = exprIsTired ? 2 : 0;

    const browYBase = eyeY - 3 - (microExpression === 2 ? 1 : 0);
    const browYLeft = browYBase - browLift + scowlDrop + concernDrop + determinedDrop + tiredDrop - smirkLeftLift - skepticalLeftOnly - thinkingLift;
    const browYRight = browYBase - browLift + scowlDrop + concernDrop + determinedDrop + tiredDrop - smirkRightLift - confusedAsymmetry - thinkingLift;

    const browT = eyebrowThickness === 'thick' ? 2 : eyebrowThickness === 'bushy' ? 3 : 1;

    for (let t = 0; t < browT; t++) {
      switch (eyebrowShape) {
        case 'straight':
          elements.push(
            <rect key={`brow-l-${t}`} x={leftEyeX - 1} y={browYLeft - t} width="5" height="1" fill={browColor} className="pixel" />,
            <rect key={`brow-r-${t}`} x={rightEyeX - 1} y={browYRight - t} width="5" height="1" fill={browColor} className="pixel" />
          );
          break;
        case 'arched':
          for (let x = 0; x < 5; x++) {
            const arch = x < 3 ? x * 0.5 : (4 - x) * 0.5;
            const lY = browYLeft - t - arch;
            const rY = browYRight - t - arch;
            elements.push(
              <rect key={`brow-l-${t}-${x}`} x={leftEyeX - 1 + x} y={lY - (exprIsSad ? (x <= 2 ? 1 : 0) : 0)} width="1" height="1" fill={browColor} className="pixel" />,
              <rect key={`brow-r-${t}-${x}`} x={rightEyeX - 1 + x} y={rY - (exprIsSad ? (x >= 2 ? 1 : 0) : 0)} width="1" height="1" fill={browColor} className="pixel" />
            );
          }
          break;
        case 'angular':
          for (let x = 0; x < 5; x++) {
            const angleY = x < 3 ? 0 : x - 3;
            const lY = browYLeft - t + angleY - (exprIsSad ? 1 : 0);
            const rY = browYRight - t - angleY - (exprIsSad ? 1 : 0);
            elements.push(
              <rect key={`brow-l-${t}-${x}`} x={leftEyeX - 1 + x} y={lY} width="1" height="1" fill={browColor} className="pixel" />,
              <rect key={`brow-r-${t}-${x}`} x={rightEyeX - 1 + x} y={rY} width="1" height="1" fill={browColor} className="pixel" />
            );
          }
          break;
        default:
          elements.push(
            <rect key={`brow-l-def-${t}`} x={leftEyeX - 1} y={browYLeft - t} width="5" height="1" fill={browColor} className="pixel" />,
            <rect key={`brow-r-def-${t}`} x={rightEyeX - 1} y={browYRight - t} width="5" height="1" fill={browColor} className="pixel" />
          );
      }
    }

    // Furrow between brows for certain expressions
    if (exprIsScowl || exprIsConcern || exprIsAnnoyed || exprIsDetermined) {
      elements.push(
        <rect key="furrow-1" x={centerX - 1} y={browYBase - 1} width="2" height="1" fill={createShadow(skinTone, 0.7)} className="pixel" />,
        <rect key="furrow-2" x={centerX - 1} y={browYBase} width="2" height="1" fill={createShadow(skinTone, 0.8)} className="pixel" />
      );
    }

    // Crow's feet for smiling/excited
    if (exprIsSmileFamily || exprIsExcited) {
      const crowsFeetColor = createShadow(skinTone, 0.9);
      elements.push(
        <rect key="crows-l1" x={leftEyeX - 3} y={eyeY} width="1" height="1" fill={crowsFeetColor} className="pixel" />,
        <rect key="crows-l2" x={leftEyeX - 3} y={eyeY + 1} width="1" height="1" fill={crowsFeetColor} className="pixel" />,
        <rect key="crows-r1" x={rightEyeX + 5} y={eyeY} width="1" height="1" fill={crowsFeetColor} className="pixel" />,
        <rect key="crows-r2" x={rightEyeX + 5} y={eyeY + 1} width="1" height="1" fill={crowsFeetColor} className="pixel" />
      );
    }

    // Under-eye shadows for tired
    if (exprIsTired) {
      const shadowColor = createShadow(skinTone, 0.85);
      const eyeWidth = 4; // Default eye width
      elements.push(
        <rect key="tired-l1" x={leftEyeX - 1} y={eyeY + 2 + 1} width="4" height="1" fill={shadowColor} className="pixel" />,
        <rect key="tired-l2" x={leftEyeX} y={eyeY + 2 + 2} width="3" height="1" fill={shadowColor} opacity={0.5} className="pixel" />,
        <rect key="tired-r1" x={rightEyeX - 1} y={eyeY + 2 + 1} width="4" height="1" fill={shadowColor} className="pixel" />,
        <rect key="tired-r2" x={rightEyeX} y={eyeY + 2 + 2} width="3" height="1" fill={shadowColor} opacity={0.5} className="pixel" />
      );
    }

    // Sad droop
    if (exprIsSad) {
      const lidColorTop = createShadow(skinTone, 0.94);
      const eyeWidth = 4;
      elements.push(
        <rect key="sad-lid-l" x={leftEyeX - 1} y={eyeY - 1} width={eyeWidth + 2} height={1} fill={lidColorTop} className="pixel" />,
        <rect key="sad-lid-r" x={rightEyeX - 1} y={eyeY - 1} width={eyeWidth + 2} height={1} fill={lidColorTop} className="pixel" />
      );
    }

    return elements;
  }, [
    headX, headY, headDimWidth, headDimHeight, hairLength, hasGrayHair, baseHair,
    skinTone, skinShadow, skinHighlight, skinMidtone, skinDeepShadow,
    skinBrightHighlight, expressionType, exprIsSmileFamily, exprIsExcited, exprIsScowl,
    exprIsAnnoyed, exprIsConcern, exprIsConfused, exprIsSkeptical, exprIsThinking,
    exprIsDetermined, exprIsTired, exprIsSad, exprIsSmirk, microExpression,
    eyebrowShape, eyebrowThickness
  ]);

  const lashElements = useMemo(() => {
    const elements: JSX.Element[] = [];

    if (isFemale) {
      const browColor = hasGrayHair ? 'rgb(169,169,169)' : baseHair;
      const lashTop = createShadow(browColor, 0.6);
      const lashBottom = createShadow(browColor, 0.75);

      const eyeRatioBase = hairLength === 'bald' ? 0.42 : hairLength === 'very_short' ? 0.4 : hairLength === 'short' ? 0.36 : 0.35;
      const eyeY = headY + Math.floor(headDimHeight * eyeRatioBase);
      const eyeSpacing = Math.floor(headDimWidth * 0.24);
      const centerX = headX + Math.floor(headDimWidth / 2);
      const leftEyeX = centerX - eyeSpacing - 2;
      const rightEyeX = centerX + eyeSpacing - 1;

      let eyeWidth = 4;
      let eyeHeight = 2;

      if (exprIsSurprised) {
        eyeWidth += 1;
        eyeHeight += 1;
      }

      switch (eyeShape) {
        case 'round': eyeWidth = Math.max(eyeWidth, 4); eyeHeight = Math.max(eyeHeight, 3); break;
        case 'narrow': eyeWidth = Math.max(eyeWidth, 3); eyeHeight = Math.min(eyeHeight, 2); break;
        case 'wide': eyeWidth = Math.max(eyeWidth, 5); break;
        case 'hooded': eyeHeight = Math.min(eyeHeight, 2); break;
      }

      // Upper lashes
      elements.push(
        <rect key="lash-l-top" x={leftEyeX} y={eyeY - 1} width={eyeWidth} height="1" fill={lashTop} className="pixel" />,
        <rect key="lash-r-top" x={rightEyeX} y={eyeY - 1} width={eyeWidth} height="1" fill={lashTop} className="pixel" />
      );

      // Lower lashes
      elements.push(
        <rect key="lash-l-bottom" x={leftEyeX + 1} y={eyeY + eyeHeight} width={eyeWidth - 2} height="1" fill={lashBottom} opacity="0.5" className="pixel" />,
        <rect key="lash-r-bottom" x={rightEyeX + 1} y={eyeY + eyeHeight} width={eyeWidth - 2} height="1" fill={lashBottom} opacity="0.5" className="pixel" />
      );

      if (eyelashes === 'long') {
        // Extra corner lashes
        elements.push(
          <rect key="lash-l-side" x={leftEyeX - 1} y={eyeY} width="1" height="1" fill={lashTop} className="pixel" />,
          <rect key="lash-r-side" x={rightEyeX + eyeWidth} y={eyeY} width="1" height="1" fill={lashTop} className="pixel" />,
          <rect key="lash-l-outer" x={leftEyeX - 1} y={eyeY - 1} width="1" height="1" fill={lashTop} opacity="0.7" className="pixel" />,
          <rect key="lash-r-outer" x={rightEyeX + eyeWidth} y={eyeY - 1} width="1" height="1" fill={lashTop} opacity="0.7" className="pixel" />
        );
      }
    }

    return elements;
  }, [isFemale, hasGrayHair, baseHair, headX, headY, headDimWidth, headDimHeight, hairLength, eyeShape, eyelashes, exprIsSurprised]);

  const ageElements = useMemo(() => {
    const elements: JSX.Element[] = [];

    if (isOld) {
      const eyeRatioBase = hairLength === 'bald' ? 0.42 : hairLength === 'very_short' ? 0.4 : hairLength === 'short' ? 0.36 : 0.35;
      const eyeY = headY + Math.floor(headDimHeight * eyeRatioBase);
      const eyeSpacing = Math.floor(headDimWidth * 0.24);
      const centerX = headX + Math.floor(headDimWidth / 2);
      const leftEyeX = centerX - eyeSpacing - 2;
      const rightEyeX = centerX + eyeSpacing - 1;

      let eyeWidth = 4;
      const skinShadow = createShadow(skinTone, 0.85);

      elements.push(
        <rect key="crow-l1" x={leftEyeX - 3} y={eyeY} width="1" height="1" fill={skinShadow} className="pixel" />,
        <rect key="crow-l2" x={leftEyeX - 3} y={eyeY + 2} width="1" height="1" fill={skinShadow} className="pixel" />,
        <rect key="crow-r1" x={rightEyeX + eyeWidth + 2} y={eyeY} width="1" height="1" fill={skinShadow} className="pixel" />,
        <rect key="crow-r2" x={rightEyeX + eyeWidth + 2} y={eyeY + 2} width="1" height="1" fill={skinShadow} className="pixel" />,
        <rect key="bag-l" x={leftEyeX + 1} y={eyeY + 3} width="2" height="1" fill={createShadow(skinTone, 0.88)} className="pixel" />,
        <rect key="bag-r" x={rightEyeX + 1} y={eyeY + 3} width="2" height="1" fill={createShadow(skinTone, 0.88)} className="pixel" />
      );
    }

    return elements;
  }, [isOld, headX, headY, headDimWidth, headDimHeight, hairLength, skinTone]);

  const blinkElements = useMemo(() => {
    const elements: JSX.Element[] = [];

    if (blinkProgress > 0) {
      const eyeRatioBase = hairLength === 'bald' ? 0.42 : hairLength === 'very_short' ? 0.4 : hairLength === 'short' ? 0.36 : 0.35;
      const eyeY = headY + Math.floor(headDimHeight * eyeRatioBase);
      const eyeSpacing = Math.floor(headDimWidth * 0.24);
      const centerX = headX + Math.floor(headDimWidth / 2);
      const leftEyeX = centerX - eyeSpacing - 2;
      const rightEyeX = centerX + eyeSpacing - 1;

      let eyeWidth = 4;
      let eyeHeight = 2;

      if (exprIsSurprised) {
        eyeWidth += 1;
        eyeHeight += 1;
      }

      switch (eyeShape) {
        case 'round': eyeWidth = Math.max(eyeWidth, 4); eyeHeight = Math.max(eyeHeight, 3); break;
        case 'narrow': eyeWidth = Math.max(eyeWidth, 3); eyeHeight = Math.min(eyeHeight, 2); break;
        case 'wide': eyeWidth = Math.max(eyeWidth, 5); break;
        case 'hooded': eyeHeight = Math.min(eyeHeight, 2); break;
      }

      const lidH = Math.max(1, Math.floor((eyeHeight + 2) * blinkProgress));
      const lidColorTop = createShadow(skinTone, 0.92);
      const lidColorBot = createShadow(skinTone, 0.97);
      const lashLine = createShadow(hasGrayHair ? 'rgb(90,90,90)' : baseHair, 0.7);

      elements.push(
        // Left
        <rect key="blink-l-top" x={leftEyeX - 1} y={eyeY - 1} width={eyeWidth + 2} height={lidH} fill={lidColorTop} className="pixel" />,
        <rect key="blink-l-bot" x={leftEyeX - 1} y={eyeY + eyeHeight - Math.max(0, lidH - 1)} width={eyeWidth + 2} height={lidH} fill={lidColorBot} className="pixel" />,
        blinkProgress > 0.7 ? <rect key="blink-l-line" x={leftEyeX - 1} y={eyeY + Math.floor(eyeHeight / 2)} width={eyeWidth + 2} height="1" fill={lashLine} className="pixel" /> : null,
        // Right
        <rect key="blink-r-top" x={rightEyeX - 1} y={eyeY - 1} width={eyeWidth + 2} height={lidH} fill={lidColorTop} className="pixel" />,
        <rect key="blink-r-bot" x={rightEyeX - 1} y={eyeY + eyeHeight - Math.max(0, lidH - 1)} width={eyeWidth + 2} height={lidH} fill={lidColorBot} className="pixel" />,
        blinkProgress > 0.7 ? <rect key="blink-r-line" x={rightEyeX - 1} y={eyeY + Math.floor(eyeHeight / 2)} width={eyeWidth + 2} height="1" fill={lashLine} className="pixel" /> : null
      );
    }

    return elements;
  }, [blinkProgress, headX, headY, headDimWidth, headDimHeight, hairLength, eyeShape, exprIsSurprised, skinTone, hasGrayHair, baseHair]);

  return (
    <g key="eyes-complete">
      {eyeElements}
      {browElements}
      {lashElements}
      {ageElements}
      {blinkElements}
    </g>
  );
};

export default EyeRenderer;