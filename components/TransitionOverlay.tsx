/**
 * TransitionOverlay.tsx
 * Full-screen overlay for dramatic world transitions
 * Shows a cold midnight sky that fills the entire viewport during WorldWeaver processing
 */

import React from 'react';
import TimeAwareBackground from './TimeAwareBackground';
import CelestialBodies from './CelestialBodies';

interface TransitionOverlayProps {
  isVisible: boolean;
  isProcessing: boolean;
}

const TransitionOverlay: React.FC<TransitionOverlayProps> = ({ isVisible, isProcessing }) => {
  // Generate random date for occasional special celestial events
  const randomSeed = React.useMemo(() => Math.floor(Math.random() * 1000), []);
  const showAurora = randomSeed % 100 < 20; // 20% chance of aurora
  const showComet = randomSeed % 100 < 5; // 5% chance of comet

  // Use historical comet years for more interesting display
  const cometYear = showComet ? [1066, 1301, 1456, 1577, 1682, 1811, 1882][randomSeed % 7] : 1500;
  const cometMonth = showComet ? [4, 10, 6, 11, 9, 9, 9][randomSeed % 7] : 1;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 60, // Above sidebars but below modals
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 1.5s ease-in-out',
        transitionDelay: isProcessing ? '0s' : '0.5s',
        // Add a subtle vignette effect for extra atmosphere
        background: isVisible ? 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,20,0.3) 100%)' : 'transparent'
      }}
    >
      <TimeAwareBackground
        gameTimeHours={0}
        gameTimeMinutes={0}
        viewMode="standard"
        season="winter"
        climate={showAurora ? "arctic" : "tundra"}
        weather={{
          precipitation: 'none',
          cloudCover: 0.1, // Very clear night for best star visibility
          intensity: 0,
          previousPrecipitation: 'none'
        }}
      />

      {/* Add celestial bodies - moon, planets, shooting stars */}
      <CelestialBodies
        timeOfDay="Night"
        gameTimeHours={0}
        gameTimeMinutes={0}
        weather={{
          precipitation: 'none',
          cloudCover: 0.1,
          intensity: 0,
          previousPrecipitation: 'none'
        }}
        gameDay={15} // Mid-month for interesting moon phase
        gameMonth={showComet ? cometMonth : (showAurora ? 1 : 8)} // January for aurora, August for Perseids
        gameYear={showComet ? cometYear : 1500}
        climate={showAurora ? "COLD" : "TEMPERATE"}
      />

      {/* Optional: Add a subtle loading indicator in the center */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/20 text-sm tracking-widest animate-pulse">
            WEAVING NEW WORLD
          </div>
        </div>
      )}
    </div>
  );
};

export default TransitionOverlay;