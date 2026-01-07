import React, { useMemo } from 'react';
import HorizonLayer from './HorizonLayer';
import InteriorHorizon from './InteriorHorizon';
import { BiomeType } from '../types';
import type { AtmosphereState } from '../hooks/useAtmosphereState';

interface GlobalHorizonLayerProps {
  atmosphere: AtmosphereState;
}

const GlobalHorizonLayer: React.FC<GlobalHorizonLayerProps> = ({ atmosphere }) => {
  const { atmosphereMode, mapData, currentTimeOfDay, currentWeather, specialMapData } = atmosphere;

  const horizonData = useMemo(() => {
    if (!mapData?.tiles?.length) return null;
    const tiles = mapData.tiles;
    const biomes = Array.from(new Set(tiles.flat().map(tile => tile.biome)));

    const hasWater = tiles.some(row =>
      row.some(tile =>
        tile.biome === BiomeType.DEEP_OCEAN ||
        tile.biome === BiomeType.SHALLOW_OCEAN ||
        tile.biome === BiomeType.RIVER ||
        tile.biome === BiomeType.MAJOR_RIVER ||
        tile.biome === BiomeType.FRESHWATER_LAKE
      )
    );

    const hasCities = tiles.some(row =>
      row.some(tile => tile.biome === BiomeType.URBAN || tile.biome === BiomeType.DENSE_CITY)
    );

    const hasVolcano = tiles.some(row => row.some(tile => tile.biome === BiomeType.VOLCANIC));

    return {
      biomes,
      hasWater,
      hasCities,
      hasVolcano
    };
  }, [mapData]);

  if (atmosphereMode === 'interior' || atmosphereMode === 'roguelike') return null;

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: '120px', zIndex: 1 }}>
      {atmosphereMode === 'special' && specialMapData ? (
        <InteriorHorizon config={specialMapData.specialConfig} timeOfDay={currentTimeOfDay || 'Morning'} />
      ) : horizonData && mapData ? (
        <HorizonLayer
          climate={mapData.climate}
          mapType={mapData.archetype}
          timeOfDay={currentTimeOfDay || 'Morning'}
          weather={currentWeather || undefined}
          width={typeof window !== 'undefined' ? window.innerWidth : 1920}
          height={120}
          hasWater={horizonData.hasWater}
          hasCities={horizonData.hasCities}
          hasVolcano={horizonData.hasVolcano}
          biomes={horizonData.biomes}
        />
      ) : null}
    </div>
  );
};

export default GlobalHorizonLayer;
