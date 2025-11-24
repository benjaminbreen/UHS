/**
 * components/symbols/DeciduousTreeSymbol.tsx
 * More naturalistic deciduous tree symbol with variant types
 */
import React from 'react';
import { ValueNoise } from '../../utils/noise';
import { Season, ClimateType } from '../../types';
import { WeatherState } from '../../services/weatherService';

interface DeciduousTreeSymbolProps {
  seed: number;
  season: Season;
  climate?: ClimateType;
  weather?: WeatherState | null;
}

const DeciduousTreeSymbol: React.FC<DeciduousTreeSymbolProps> = ({ seed, season, climate, weather }) => {
  const localRand = React.useMemo(() => new ValueNoise(seed).random, [seed]);

  const isVariant = localRand() < 0.4; // 40% chance of showing the smaller tree variant

  // Only apply seasonal variations for cold and temperate climates
  const useSeasonalVariation = !climate || climate === ClimateType.COLD || climate === ClimateType.TEMPERATE;
  const effectiveSeason = useSeasonalVariation ? season : 'summer';

  const getFoliageColor = (variation: number) => {
    let hue, saturation, lightness;
    
    switch (effectiveSeason) {
      case 'autumn':
        hue = 25 + variation * 30; // Oranges, reds, yellows
        saturation = 70 + variation * 20;
        lightness = 45 + variation * 10;
        break;
      case 'spring':
        hue = 90 + variation * 20; // Lighter, fresher greens
        saturation = 60 + variation * 15;
        lightness = 55 + variation * 10;
        break;
      case 'winter':
        return 'transparent'; // No leaves in winter (only in cold/temperate)
      case 'summer':
      default:
        hue = 95 + variation * 10; // Standard summer green
        saturation = 55 + variation * 20;
        lightness = 30 + variation * 15;
    }
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const trunkColor = `hsl(25, 45%, 28%)`;
  const trunkHighlight = `hsl(25, 45%, 40%)`;

  const trunkWidth = isVariant ? 2.2 + localRand() * 0.4 : 3 + localRand() * 0.6;
  const trunkHeight = isVariant ? 6 + localRand() * 1.5 : 10 + localRand() * 2;
  const trunkX = 12 - trunkWidth / 2;
  const trunkY = 24 - trunkHeight;

  const foliage: Array<{
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    color: string;
    opacity: number;
    z: number;
    key: string;
  }> = [];

  const baseRadius = isVariant ? 5.5 : 7.5;
  const verticalCompression = 0.6;
  const layerCount = isVariant ? 2 : 3; // Reduced from 3/5 to 2/3

  if (effectiveSeason !== 'winter') {
    for (let i = 0; i < layerCount; i++) {
      const angle = (i / layerCount) * 2 * Math.PI + localRand() * 0.4;
      const distance = baseRadius * (0.5 + localRand() * 0.3);
      const rx = baseRadius * (0.7 + localRand() * 0.2);
      const ry = rx * verticalCompression;
      const cx = 12 + Math.cos(angle) * distance * 0.8;
      const cy = 12 + Math.sin(angle) * distance * 0.6;

      foliage.push({
        cx,
        cy,
        rx,
        ry,
        color: getFoliageColor(localRand()),
        opacity: 0.85 + localRand() * 0.1,
        z: cy,
        key: `foliage-${i}`
      });
    }

    // Central top cluster
    foliage.push({
      cx: 12,
      cy: 10.5,
      rx: baseRadius,
      ry: baseRadius * verticalCompression,
      color: getFoliageColor(localRand()),
      opacity: 0.9,
      z: 10.5,
      key: 'foliage-center'
    });
  }

  // Weather-based snow detection
  const isSnowing = weather?.precipitation === 'snow' && weather?.temperature !== undefined && weather.temperature < 2;

  return (
    <g>
      {/* Trunk */}
      <path
        d={`
          M ${trunkX} 24
          C ${trunkX - 0.4} ${trunkY + 3}, ${trunkX + 0.5} ${trunkY + 2}, ${trunkX} ${trunkY}
          L ${trunkX + trunkWidth} ${trunkY}
          C ${trunkX + trunkWidth + 0.4} ${trunkY + 2}, ${trunkX + trunkWidth - 0.5} ${trunkY + 3}, ${trunkX + trunkWidth} 24
          Z
        `}
        fill={trunkColor}
      />
      <path
        d={`
          M ${trunkX + 0.5} ${trunkY + 1}
          L ${trunkX + 0.5} ${trunkY + trunkHeight - 1}
        `}
        stroke={trunkHighlight}
        strokeWidth="0.6"
        strokeLinecap="round"
      />

      {/* Branches */}
      <g stroke={trunkColor} strokeWidth="1" strokeLinecap="round" fill="none">
        <path d={`M ${12} ${trunkY} L ${10} ${trunkY - 2}`} />
        <path d={`M ${12} ${trunkY} L ${14} ${trunkY - 2}`} />
        {isVariant ? null : (
          <>
            <path d={`M ${12} ${trunkY - 1} L ${11} ${trunkY - 3}`} />
            <path d={`M ${12} ${trunkY - 1} L ${13} ${trunkY - 3}`} />
          </>
        )}
      </g>

      {/* Foliage */}
      {foliage
        .sort((a, b) => a.z - b.z)
        .map(layer => (
          <ellipse
            key={layer.key}
            cx={layer.cx}
            cy={layer.cy}
            rx={layer.rx}
            ry={layer.ry}
            fill={layer.color}
            opacity={layer.opacity}
          />
        ))}
        {/* Spring Flowers (only in cold/temperate climates) */}
        {effectiveSeason === 'spring' && [...Array(3)].map((_, i) => {
            const flowerX = 12 + (localRand() - 0.5) * baseRadius * 1.5;
            const flowerY = 12 + (localRand() - 0.5) * baseRadius;
            return <circle key={`flower-${i}`} cx={flowerX} cy={flowerY} r="0.6" fill={localRand() > 0.5 ? '#f9a8d4' : '#c084fc'} opacity="0.8" />;
        })}

        {/* Snow on branches (when tree is bare in winter and snowing) */}
        {isSnowing && effectiveSeason === 'winter' && (
          <g opacity="0.6">
            {/* Snow on branch tips */}
            <circle cx={10} cy={trunkY - 2} r="1.2" fill="white" />
            <circle cx={14} cy={trunkY - 2} r="1.2" fill="white" />
            {!isVariant && (
              <>
                <circle cx={11} cy={trunkY - 3} r="1" fill="white" />
                <circle cx={13} cy={trunkY - 3} r="1" fill="white" />
              </>
            )}
          </g>
        )}

        {/* Snow highlights on foliage (when snowing and tree has leaves) */}
        {isSnowing && effectiveSeason !== 'winter' && foliage.length > 0 && (
          <g opacity="0.4">
            {foliage.slice(0, 2).map((layer, i) => (
              <ellipse
                key={`snow-${layer.key}`}
                cx={layer.cx}
                cy={layer.cy - 0.5}
                rx={layer.rx * 0.6}
                ry={layer.ry * 0.4}
                fill="white"
              />
            ))}
          </g>
        )}
    </g>
  );
};

// Custom comparison to prevent re-renders when weather object reference changes but values are same
const arePropsEqual = (prevProps: DeciduousTreeSymbolProps, nextProps: DeciduousTreeSymbolProps): boolean => {
  return (
    prevProps.seed === nextProps.seed &&
    prevProps.season === nextProps.season &&
    prevProps.climate === nextProps.climate &&
    // Deep compare weather properties instead of object reference
    prevProps.weather?.precipitation === nextProps.weather?.precipitation &&
    prevProps.weather?.temperature === nextProps.weather?.temperature
  );
};

export default React.memo(DeciduousTreeSymbol, arePropsEqual);