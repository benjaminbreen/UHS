import React, { useState, useEffect } from 'react';
import { SpecialMapConfig } from '../types/specialMapTypes';
import { specialMapBackgroundService } from '../services/specialMapBackgroundService';

interface SpecialMapBackgroundProps {
  config: SpecialMapConfig;
  timeOfDay?: 'Dawn' | 'Day' | 'Dusk' | 'Night';
}

const SpecialMapBackground: React.FC<SpecialMapBackgroundProps> = ({
  config,
  timeOfDay = 'Day'
}) => {
  const [backgroundStyle, setBackgroundStyle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const loadBackground = async () => {
      setIsLoading(true);
      setOpacity(0);
      
      try {
        const background = await specialMapBackgroundService.getBackground(config);
        
        // Set background style without mixing shorthand and specific properties
        setBackgroundStyle(background);
        
        // Fade in the background
        setTimeout(() => setOpacity(1), 100);
      } catch (error) {
        console.error('[SpecialMapBackground] Failed to load background:', error);
        // Use a default gradient on error
        setBackgroundStyle('linear-gradient(180deg, #2D3748 0%, #4A5568 50%, #2D3748 100%)');
        setOpacity(1);
      } finally {
        setIsLoading(false);
      }
    };

    loadBackground();
  }, [config]);

  // Apply time-of-day lighting overlay (reduced intensity)
  const getLightingOverlay = () => {
    switch (timeOfDay) {
      case 'Dawn':
        return 'rgba(255, 230, 200, 0.08)'; // Much more subtle warm tint
      case 'Day':
        return 'rgba(255, 255, 255, 0.02)'; // Barely perceptible
      case 'Dusk':
        return 'rgba(255, 180, 140, 0.12)'; // Reduced orange intensity
      case 'Night':
        return 'rgba(20, 30, 60, 0.25)'; // Reduced night overlay
      default:
        return 'transparent';
    }
  };

  return (
    <>
      {/* Main background layer */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: backgroundStyle.startsWith('linear-gradient') ? backgroundStyle : backgroundStyle.startsWith('url(') ? backgroundStyle : `url(${backgroundStyle})`,
          backgroundSize: backgroundStyle.startsWith('linear-gradient') ? 'auto' : 'cover',
          backgroundPosition: backgroundStyle.startsWith('linear-gradient') ? 'initial' : 'center',
          backgroundRepeat: 'no-repeat',
          opacity,
          transition: 'opacity 1s ease-in-out',
          filter: timeOfDay === 'Night' ? 'brightness(0.7)' : 'brightness(1)'
        }}
      />
      
      {/* Time-of-day lighting overlay */}
      <div
        className="absolute inset-0 z-1 pointer-events-none"
        style={{
          backgroundColor: getLightingOverlay(),
          mixBlendMode: 'overlay'
        }}
      />
      
      {/* Vignette effect for depth (reduced intensity) */}
      <div
        className="absolute inset-0 z-2 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 60%, rgba(0,0,0,0.15) 100%)'
        }}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/50">
          <div className="text-white text-lg animate-pulse">
            Loading interior...
          </div>
        </div>
      )}
    </>
  );
};

export default SpecialMapBackground;