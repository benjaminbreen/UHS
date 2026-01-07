import React from 'react';
import TimeAwareBackground from './TimeAwareBackground';
import CloudSystem from './CloudSystem';
import WeatherEffects from './WeatherEffects';
import CelestialBodies from './CelestialBodies';
import SpecialMapBackground from './SpecialMapBackground';
import type { AtmosphereState } from '../hooks/useAtmosphereState';

interface AppAtmosphereProps {
  atmosphere: AtmosphereState;
}

const AppAtmosphere: React.FC<AppAtmosphereProps> = ({ atmosphere }) => {
  const {
    atmosphereMode,
    gameTimeHours,
    gameTimeMinutes,
    gameDate,
    season,
    climate,
    currentWeather,
    viewMode,
    currentTimeOfDay,
    specialMapData
  } = atmosphere;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {atmosphereMode === 'special' && specialMapData ? (
        <SpecialMapBackground
          config={specialMapData.specialConfig}
          timeOfDay={currentTimeOfDay || 'Morning'}
        />
      ) : atmosphereMode === 'roguelike' ? (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 20% 20%, rgba(30, 41, 59, 0.55), rgba(8, 10, 18, 0.9))'
          }}
        />
      ) : (
        <TimeAwareBackground
          gameTimeHours={gameTimeHours}
          gameTimeMinutes={gameTimeMinutes}
          viewMode={viewMode === 'interior' ? 'interior' : 'standard'}
          season={season as any}
          climate={climate as any}
          weather={currentWeather}
        />
      )}

      {atmosphereMode === 'outdoor' && (
        <>
          {currentWeather && currentWeather.cloudCover > 0 && (
            <CloudSystem
              weather={currentWeather}
              timeOfDay={currentTimeOfDay || 'Morning'}
              windSpeed={currentWeather.windSpeed || 0}
            />
          )}
          <CelestialBodies
            timeOfDay={currentTimeOfDay || 'Morning'}
            gameTimeHours={gameTimeHours}
            gameTimeMinutes={gameTimeMinutes}
            weather={currentWeather}
            gameDay={gameDate?.day || 1}
            gameMonth={gameDate?.month || 1}
            gameYear={gameDate?.year || 1500}
            climate={climate || undefined}
          />
          <WeatherEffects
            weather={
              currentWeather || {
                temperature: 20,
                feelsLike: 20,
                humidity: 0.5,
                precipitation: 'none',
                intensity: 0,
                windSpeed: 0,
                windDirection: 0,
                pressure: 1013,
                cloudCover: 0.3,
                special: null
              }
            }
          />
        </>
      )}
    </div>
  );
};

export default AppAtmosphere;
