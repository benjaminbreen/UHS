/**
 * components/AnimalPortrait.tsx
 * Smart animal portrait that uses PNG images when available, falls back to emoji
 */

import React, { useState, useEffect } from 'react';
import { AnimalEntity } from '../types';
import { ANIMAL_DATA } from '../constants';

interface AnimalPortraitProps {
  animal: AnimalEntity;
  size?: number;
  className?: string;
}

// Shared cache with AnimalCombatSprite for PNG availability
const portraitPngCache = new Map<string, boolean>();

/**
 * Check if an animal image exists in public/animals/
 */
function getAnimalImagePath(baseId: string): string | null {
  // Convert baseId to lowercase for filename
  const filename = baseId.toLowerCase();
  return `/animals/${filename}.png`;
}

const AnimalPortrait: React.FC<AnimalPortraitProps> = ({ animal, size = 300, className = '' }) => {
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const animalData = ANIMAL_DATA[animal.baseId];
  const emoji = animalData?.emoji || animal.emoji || '🦌';

  useEffect(() => {
    const filename = animal.baseId.toLowerCase();
    const cacheKey = filename;

    // Check cache first
    if (portraitPngCache.has(cacheKey)) {
      const isAvailable = portraitPngCache.get(cacheKey);
      if (isAvailable) {
        setImagePath(`/animals/${filename}.png`);
        setImageError(false);
      } else {
        setImageError(true);
        setImagePath(null);
      }
      return;
    }

    // Not in cache, check if image exists
    const path = getAnimalImagePath(animal.baseId);
    if (path) {
      // Preload image to check if it exists
      const img = new Image();
      img.onload = () => {
        portraitPngCache.set(cacheKey, true);
        setImagePath(path);
        setImageError(false);
      };
      img.onerror = () => {
        portraitPngCache.set(cacheKey, false);
        setImageError(true);
        setImagePath(null);
      };
      img.src = path;
    }
  }, [animal.baseId]);

  // Show emoji while loading or if image doesn't exist
  if (!imagePath || imageError) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <span style={{ fontSize: `${size * 0.3}px` }}>{emoji}</span>
      </div>
    );
  }

  // Show actual animal image
  return (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
      <img
        src={imagePath}
        alt={animalData?.name || animal.baseId}
        className="object-contain w-full h-full"
        style={{ maxWidth: `${size}px`, maxHeight: `${size}px` }}
        onError={() => {
          setImageError(true);
          setImagePath(null);
        }}
      />
    </div>
  );
};

export default AnimalPortrait;
