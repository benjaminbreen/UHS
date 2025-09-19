/**
 * components/POVViewport.tsx - First-person view viewport using combat backgrounds
 */
import React, { useState, useEffect, useMemo } from 'react';
import { ClimateType } from '../types/biomes/climate';
import { CulturalZone, Season } from '../types';
import { WeatherState } from '../services/weatherService';
import {
  getBackgroundPaths,
  loadBackgroundImage,
  isNightTime,
  getNightFilter,
  getNightOverlayGradient,
  getNightOverlayIntensity
} from '../services/backgroundSelectionService';
import WeatherEffects from './WeatherEffects';

interface POVViewportProps {
  visible: boolean;
  biome: string;
  climate?: ClimateType;
  season?: Season;
  culturalZone?: CulturalZone;
  weather?: WeatherState;
  gameTime?: { hours: number; minutes: number };
  onClose?: () => void;
  onObserve?: () => void;
}

const POVViewport: React.FC<POVViewportProps> = ({
  visible,
  biome,
  climate,
  season,
  culturalZone,
  weather,
  gameTime,
  onClose,
  onObserve
}) => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingNightImage, setIsUsingNightImage] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.15 }); // Start near top to show horizon
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0.5, y: 0.15 }); // Match initial position
  const [isHovering, setIsHovering] = useState(false);

  // Calculate night overlay intensity
  const nightIntensity = useMemo(() => {
    return getNightOverlayIntensity(gameTime);
  }, [gameTime]);

  // Only apply tinting if we're not using a custom night image
  const shouldApplyNightTint = useMemo(() => {
    return nightIntensity > 0 && !isUsingNightImage;
  }, [nightIntensity, isUsingNightImage]);

  // Create stable references for weather and time
  const weatherKey = weather ? `${weather.precipitation}-${weather.special}` : 'none';
  const timeKey = gameTime ? `${gameTime.hours}-${Math.floor(gameTime.minutes / 15)}` : 'unknown'; // Only re-render every 15 min

  // Load appropriate background image
  useEffect(() => {
    if (!visible) return;

    const loadBackground = async () => {
      setIsLoading(true);

      // Generate priority-ordered background paths
      const paths = getBackgroundPaths(
        biome,
        weather,
        gameTime,
        culturalZone,
        climate,
        season
      );

      console.log('[POVViewport] Loading background for:', {
        biome,
        climate,
        season,
        culturalZone,
        weather: weather,
        weatherPrecipitation: weather?.precipitation,
        weatherSpecial: weather?.special,
        weatherIntensity: weather?.intensity,
        weatherFullObject: JSON.stringify(weather),
        pathsToCheck: paths.slice(0, 5)
      });

      // Load the background image
      const backgroundUrl = await loadBackgroundImage(paths);

      // Check if we loaded a night-specific image
      const usingNightImage = backgroundUrl ? backgroundUrl.includes('_night') : false;
      setIsUsingNightImage(usingNightImage);

      setBackgroundImage(backgroundUrl);
      setIsLoading(false);
    };

    loadBackground();
  }, [visible, biome, climate, season, culturalZone, weatherKey, timeKey]);

  // Handle mouse movement for panning effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0 to 1
    const y = (e.clientY - rect.top) / rect.height; // 0 to 1
    setMousePosition({ x, y });
    setLastPanPosition({ x, y }); // Store the position
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    // Keep the last pan position instead of resetting to center
    setMousePosition(lastPanPosition);
  };

  // Calculate pan offset based on mouse position
  // Natural panning: cursor up shows upper part, cursor down shows lower part
  // Always use the current mouse position, whether hovering or not
  const panX = (mousePosition.x - 0.5) * 60; // Mouse right = pan right (show right side)
  const panY = (mousePosition.y - 0.5) * 40; // Mouse down = pan down (show lower part)

  if (!visible) return null;

  return (
    <div
      className="w-full relative transition-all duration-500 ease-in-out animate-slideDown px-6"
      style={{ height: '200px' }}
    >
      {/* Outer border with frosted glass effect - matching map viewport */}
      <div
        className="w-full h-full relative"
        style={{
          padding: '10px',
          background: 'linear-gradient(135deg, rgba(40, 50, 70, 0.65), rgba(50, 40, 70, 0.35))',
          borderRadius: '28px',
          boxShadow: `
            0 12px 40px rgba(0, 0, 0, 0.6),
            inset 0 2px 4px rgba(255, 255, 255, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.08),
            0 0 0 2px rgba(100, 120, 160, 0.15)
          `,
          backdropFilter: 'blur(8px)'
        }}
      >
        {/* Inner frame with elegant border - matching map viewport */}
        <div
          className="w-full h-full relative overflow-hidden bg-slate-900"
          style={{
            border: '5px solid rgba(31, 41, 59, 0.7)',
            borderRadius: '28px',
            boxShadow: 'inset 0 4px 12px rgba(0, 0, 0, 0.9), 0 8px 32px rgba(31, 41, 59, 0.9)'
          }}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Background Image with panning */}
          {backgroundImage && (
            <>
              <div
                className="absolute inset-0 transition-all duration-200 ease-out"
                style={{
                  backgroundImage: `url(${backgroundImage})`,
                  backgroundPosition: `${50 + panX}% ${50 + panY}%`, // Now using corrected pan values
                  backgroundSize: '110%', // Zoomed out more to show more of the scene
                  filter: shouldApplyNightTint ? getNightFilter(nightIntensity) : 'none',
                  borderRadius: '24px'
                }}
              />
              {/* Night overlay with blend mode - only if not using custom night image */}
              {shouldApplyNightTint && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: getNightOverlayGradient(nightIntensity),
                    mixBlendMode: 'multiply' as any,
                    borderRadius: '24px',
                    transition: 'opacity 2s ease-in-out'
                  }}
                />
              )}
            </>
          )}

          {/* Weather effects overlay */}
          {weather && (
            <div style={{ borderRadius: '24px', overflow: 'hidden', position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
              <WeatherEffects
                weather={weather}
                width={typeof window !== 'undefined' ? window.innerWidth : 800}
                height={200}
              />
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-slate-800/80 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm opacity-80">Loading view...</p>
              </div>
            </div>
          )}

          {/* POV Label - clickable to trigger Observe */}
          <div className="absolute top-3 left-3 z-20">
            <button
              onClick={onObserve}
              className="bg-slate-900/80 hover:bg-slate-800/90 backdrop-blur-sm border border-slate-600/50 rounded-lg px-3 py-1.5 transition-all duration-200 group"
              title="Click to observe your surroundings"
            >
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-sm group-hover:text-amber-300">👁️</span>
                <span className="text-slate-200 text-sm font-medium group-hover:text-slate-100">First Person View</span>
              </div>
            </button>
          </div>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 w-8 h-8 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-600/50 rounded-lg flex items-center justify-center transition-all duration-200 group"
              title="Close first-person view"
            >
              <span className="text-slate-400 group-hover:text-slate-200 text-lg">×</span>
            </button>
          )}


          {/* Vignette effect overlay - subtle darkening at edges */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse at center,
                  transparent 0%,
                  transparent 35%,
                  rgba(0, 0, 0, 0.05) 55%,
                  rgba(0, 0, 0, 0.1) 70%,
                  rgba(0, 0, 0, 0.15) 85%,
                  rgba(0, 0, 0, 0.2) 100%)
              `,
              borderRadius: '23px',
              zIndex: 10
            }}
          />

          {/* Inner shadow for inset/recessed effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: `
                inset 0 0 40px 20px rgba(0, 0, 0, 0.15),
                inset 0 3px 12px rgba(0, 0, 0, 0.3),
                inset 0 -3px 12px rgba(0, 0, 0, 0.3),
                inset 3px 0 12px rgba(0, 0, 0, 0.25),
                inset -3px 0 12px rgba(0, 0, 0, 0.25)
              `,
              borderRadius: '23px',
              zIndex: 9
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default POVViewport;