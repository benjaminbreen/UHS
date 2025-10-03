/**
 * StudyStarsOverlay.tsx
 * Full-screen overlay for studying the night sky while camping
 * Shows a clear midnight sky that fills the entire viewport
 */

import React from 'react';
import TimeAwareBackground from './TimeAwareBackground';
import CelestialBodies from './CelestialBodies';

interface StudyStarsOverlayProps {
  isVisible: boolean;
  gameTimeHours: number;
  gameDate: { year: number; month: number; day: number };
  climate?: string;
  season?: string;
  onReturnToCamp: () => void;
}

const StudyStarsOverlay: React.FC<StudyStarsOverlayProps> = ({
  isVisible,
  gameTimeHours,
  gameDate,
  climate = "TEMPERATE",
  season = "summer",
  onReturnToCamp
}) => {
  // Determine if we should show special celestial events based on actual game date
  const showMeteorShower = React.useMemo(() => {
    // Perseids (August 11-13), Leonids (November 17-18), Geminids (December 13-14)
    if (gameDate.month === 8 && gameDate.day >= 11 && gameDate.day <= 13) return "Perseid";
    if (gameDate.month === 11 && gameDate.day >= 17 && gameDate.day <= 18) return "Leonid";
    if (gameDate.month === 12 && gameDate.day >= 13 && gameDate.day <= 14) return "Geminid";
    return null;
  }, [gameDate]);

  // Famous historical comet years
  const isHistoricalComet = React.useMemo(() => {
    const cometYears = [1066, 1301, 1456, 1577, 1682, 1758, 1835, 1910];
    return cometYears.includes(gameDate.year);
  }, [gameDate.year]);

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 60, // Above sidebars but below modals
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease-in-out',
        background: isVisible ? 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,15,0.4) 100%)' : 'transparent'
      }}
    >
      <TimeAwareBackground
        gameTimeHours={gameTimeHours}
        gameTimeMinutes={0}
        viewMode="standard"
        season={season as any}
        climate={climate as any}
        weather={{
          precipitation: 'none',
          cloudCover: 0.05, // Nearly clear for optimal stargazing
          intensity: 0,
          previousPrecipitation: 'none'
        }}
      />

      {/* Add celestial bodies - use actual game time and date */}
      <CelestialBodies
        timeOfDay={gameTimeHours >= 18 || gameTimeHours < 6 ? "Night" : "Dusk"}
        gameTimeHours={gameTimeHours}
        gameTimeMinutes={0}
        weather={{
          precipitation: 'none',
          cloudCover: 0.05,
          intensity: 0,
          previousPrecipitation: 'none'
        }}
        gameDay={gameDate.day}
        gameMonth={gameDate.month}
        gameYear={gameDate.year}
        climate={climate as any}
      />

      {/* Center text with meteor shower or comet name if applicable */}
      {isVisible && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-white/80 text-2xl tracking-widest font-light mb-2 animate-pulse">
              
            </div>
            {showMeteorShower && (
              <div className="text-blue-200/60 text-sm tracking-wider animate-pulse" style={{ animationDelay: '0.5s' }}>
                {showMeteorShower} Meteor Shower Active
              </div>
            )}
            {isHistoricalComet && (
              <div className="text-yellow-200/60 text-sm tracking-wider animate-pulse" style={{ animationDelay: '0.5s' }}>
                Halley's Comet Visible
              </div>
            )}
          </div>
        </div>
      )}

      {/* Return to Camp button - enable pointer events just for this button */}
      {isVisible && (
        <div className="absolute inset-0 flex items-end justify-center pb-24 pointer-events-auto">
          <button
            onClick={onReturnToCamp}
            className="p-4 rounded-xl text-base transition-all border-2 flex items-center justify-center gap-2 bg-blue-500/20 text-blue-200 border-blue-500/40 hover:bg-blue-500/30 hover:border-blue-400/60 backdrop-blur-sm"
          >
            ← Return to Camp
          </button>
        </div>
      )}
    </div>
  );
};

export default StudyStarsOverlay;
