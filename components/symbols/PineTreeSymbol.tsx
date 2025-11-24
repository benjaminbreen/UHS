/**
 * components/symbols/PineTreeSymbol.tsx - Renders a stylized pine tree
 */
import React from 'react';
import { ValueNoise } from '../../utils/noise';
import { Season, ClimateType } from '../../types';
import { WeatherState } from '../../services/weatherService';

interface PineTreeSymbolProps {
  seed: number;
  season: Season;
  climate: ClimateType;
  weather?: WeatherState | null;
}

const PineTreeSymbol: React.FC<PineTreeSymbolProps> = ({ seed, season, climate, weather }) => {
  const localRand = React.useMemo(() => new ValueNoise(seed).random, [seed]);

  const y1 = 2 + localRand() * 1.5;
  
  const p1_x1 = 4 + localRand() - 0.5;
  const p1_y1 = 18 + localRand() - 0.5;
  const p1_x2 = 20 - (localRand() - 0.5);
  const p1_y2 = 18 + localRand() - 0.5;
  
  const p2_x1 = 6 + localRand() - 0.5;
  const p2_y1 = 14 + localRand() - 0.5;
  const p2_x2 = 18 - (localRand() - 0.5);
  const p2_y2 = 14 + localRand() - 0.5;
  
  const p3_x1 = 8 + localRand() - 0.5;
  const p3_y1 = 10 + localRand() - 0.5;
  const p3_x2 = 16 - (localRand() - 0.5);
  const p3_y2 = 10 + localRand() - 0.5;
  
  const trunkWidth = 3.5 + localRand();
  const trunkHeight = 4 + localRand();
  
  const trunkX = 12 - trunkWidth / 2;
  const trunkY = 18;

  // Show snow in winter (seasonal) or when it's currently snowing (weather-based)
  const isWinterSnow = season === 'winter' && (climate === ClimateType.COLD || climate === ClimateType.TEMPERATE);
  const isWeatherSnow = weather?.precipitation === 'snow' && weather?.temperature !== undefined && weather.temperature < 2;
  const showSnow = isWinterSnow || isWeatherSnow;

  // Heavy snow in winter, light dusting when weather-based
  const snowOpacity = isWinterSnow ? 0.85 : 0.5;

  return (
    <g>
      <polygon points={`12,${y1} ${p1_x1},${p1_y1} ${p1_x2},${p1_y2}`} fill="#22543d" />
      <polygon points={`12,${y1} ${p2_x1},${p2_y1} ${p2_x2},${p2_y2}`} fill="#2f855a" />
      <polygon points={`12,${y1} ${p3_x1},${p3_y1} ${p3_x2},${p3_y2}`} fill="#48bb78" />
      <rect x={trunkX} y={trunkY} width={trunkWidth} height={trunkHeight} fill="#693c24" />

      {showSnow && (
          <g opacity={snowOpacity}>
              <polygon points={`12,${y1 + 1} ${p1_x1 + 1},${p1_y1} ${p1_x2 - 1},${p1_y1}`} fill="white" />
              <polygon points={`12,${y1 + 1} ${p2_x1 + 1},${p2_y1} ${p2_x2 - 1},${p2_y1}`} fill="white" />
              <polygon points={`12,${y1 + 1} ${p3_x1 + 1},${p3_y1} ${p3_x2 - 1},${p3_y1}`} fill="white" />
          </g>
      )}
    </g>
  );
};

// Custom comparison to prevent re-renders when weather object reference changes but values are same
const arePropsEqual = (prevProps: PineTreeSymbolProps, nextProps: PineTreeSymbolProps): boolean => {
  return (
    prevProps.seed === nextProps.seed &&
    prevProps.season === nextProps.season &&
    prevProps.climate === nextProps.climate &&
    prevProps.weather?.precipitation === nextProps.weather?.precipitation &&
    prevProps.weather?.temperature === nextProps.weather?.temperature
  );
};

export default React.memo(PineTreeSymbol, arePropsEqual);