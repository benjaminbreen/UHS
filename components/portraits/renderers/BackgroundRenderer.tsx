/**
 * Background renderer for procedural portraits
 * Handles cultural themes and gradients
 */

import React, { useMemo } from 'react';
import { createBackgroundGradient, BackgroundProps } from '../utils/backgroundUtils';

interface BackgroundRendererProps extends BackgroundProps {
  size: number;
}

export const BackgroundRenderer: React.FC<BackgroundRendererProps> = ({
  culturalZone,
  era,
  isFemale,
  isHighStatus,
  gradientId,
  textureId,
  seed,
  size
}) => {
  const backgroundDefs = useMemo(() => {
    return createBackgroundGradient({
      culturalZone,
      era,
      isFemale,
      isHighStatus,
      gradientId,
      textureId,
      seed
    });
  }, [culturalZone, era, isFemale, isHighStatus, gradientId, textureId, seed]);

  return (
    <>
      <defs>{backgroundDefs}</defs>

      {/* Background */}
      <rect x="0" y="0" width={size} height={size} fill={`url(#${gradientId})`} />
      <rect
        x="0"
        y="0"
        width={size}
        height={size}
        fill={`url(#${gradientId})`}
        style={{ filter: `url(#${textureId})`, opacity: 0.05 }}
      />
    </>
  );
};

export default BackgroundRenderer;