/**
 * Background gradient utilities for procedural portraits
 * Handles cultural themes and high-status gradients
 */

import React from 'react';
import { createHighlight, createShadow } from './colorUtils';

// Cultural background themes
export const CULTURAL_THEMES: Record<string, string[]> = {
  // Blue/lavender family - European
  EUROPEAN: [
    '#A8C8F0',  // Premodern male: sky blue pastel
    '#F0B8F0',  // Premodern female: bright lavender
    '#98B8E8',  // Modern male: steel blue
    '#E8A8E8',  // Modern female: violet pastel
  ],
  // Jade/peach family - East Asian
  EAST_ASIAN: [
    '#B8E8C8',  // Premodern male: jade green
    '#FFD0C0',  // Premodern female: bright peach
    '#A8E0B8',  // Modern male: mint green
    '#FFB8B0',  // Modern female: coral peach
  ],
  // Sand/terracotta family - MENA
  MENA: [
    '#F0D8A8',  // Premodern male: golden sand
    '#F0B8A8',  // Premodern female: rose clay
    '#E8D0A0',  // Modern male: desert sand
    '#F0A898',  // Modern female: terracotta pink
  ],
  // Saffron/teal family - South Asian
  SOUTH_ASIAN: [
    '#F8E0A0',  // Premodern male: bright saffron
    '#A8E8E8',  // Premodern female: bright teal
    '#F0D890',  // Modern male: golden yellow
    '#98E0E8',  // Modern female: aqua teal
  ],
  // Earth/amber family - Sub-Saharan African
  SUB_SAHARAN_AFRICAN: [
    '#E0C8A0',  // Premodern male: earth brown
    '#F8D8B0',  // Premodern female: golden amber
    '#D8C098',  // Modern male: deep earth
    '#F0C8A8',  // Modern female: honey gold
  ],
  // Turquoise/ochre family - North American Pre-Columbian
  NORTH_AMERICAN_PRE_COLUMBIAN: [
    '#98E8E8',  // Premodern male: bright turquoise
    '#F0C890',  // Premodern female: ochre gold
    '#88E0E0',  // Modern male: deep turquoise
    '#E8B888',  // Modern female: adobe orange
  ],
  // Slate/rose family - North American Colonial
  NORTH_AMERICAN_COLONIAL: [
    '#B0C0D8',  // Premodern male: blue slate
    '#F8C0D0',  // Premodern female: rose pink
    '#A8B8D0',  // Modern male: gray slate
    '#F0B8C8',  // Modern female: dusty rose
  ],
  // Jungle green/coral family - South American
  SOUTH_AMERICAN: [
    '#A8E8B8',  // Premodern male: bright jungle green
    '#F8B8A8',  // Premodern female: coral orange
    '#98E0A8',  // Modern male: deep green
    '#F0A898',  // Modern female: bright coral
  ],
  // Seafoam/sunset family - Oceania
  OCEANIA: [
    '#A8F0D8',  // Premodern male: bright seafoam
    '#F8C0B8',  // Premodern female: sunset orange
    '#98E8D0',  // Modern male: ocean green
    '#F0B8B0',  // Modern female: coral sunset
  ]
};

export interface BackgroundProps {
  culturalZone: string;
  era?: string;
  isFemale: boolean;
  isHighStatus: boolean;
  gradientId: string;
  textureId: string;
  seed: number;
}

export const createBackgroundGradient = ({
  culturalZone,
  era,
  isFemale,
  isHighStatus,
  gradientId,
  textureId,
  seed
}: BackgroundProps): JSX.Element => {
  // Determine if modern era
  const isModernEra = era && ['INDUSTRIAL_ERA', 'MODERN_ERA', 'FUTURE_ERA'].includes(era);

  // Select color based on era and gender
  const colors = CULTURAL_THEMES[culturalZone] || CULTURAL_THEMES.EUROPEAN;
  const colorIndex = (isModernEra ? 2 : 0) + (isFemale ? 1 : 0);
  const baseColor = colors[colorIndex];

  // Create gradient colors
  const bg1 = baseColor;
  const bg2 = createShadow(baseColor, 0.95);

  // Special gradient for high-status characters
  if (isHighStatus) {
    const topColor = createHighlight(bg1, 1.15);
    const bottomColor = createShadow(bg2, 0.9);

    return (
      <>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={topColor} />
          <stop offset="40%" stopColor={bg1} />
          <stop offset="60%" stopColor={bg2} />
          <stop offset="100%" stopColor={bottomColor} />
        </linearGradient>
        <filter id={textureId}>
          <feTurbulence baseFrequency="0.9" numOctaves="4" result="noise" seed={seed} />
          <feComposite operator="over" in2="noise" />
        </filter>
      </>
    );
  }

  // Regular gradient for non-elite characters
  return (
    <>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={bg1} />
        <stop offset="50%" stopColor={createHighlight(bg1, 0.98)} />
        <stop offset="100%" stopColor={bg2} />
      </linearGradient>
      <filter id={textureId}>
        <feTurbulence baseFrequency="0.9" numOctaves="4" result="noise" seed={seed} />
        <feComposite operator="over" in2="noise" />
      </filter>
    </>
  );
};