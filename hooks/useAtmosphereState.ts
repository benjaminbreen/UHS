import { useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import { useMap } from '../contexts/MapContext';
import { usePlayer } from '../contexts/PlayerContext';
import type { GameDate, MapData } from '../types';
import type { SpecialMapData } from '../types/specialMapTypes';
import { weatherService } from '../services/weatherService';
import { getDayOfYear } from '../utils/dateUtils';

export type AtmosphereMode = 'outdoor' | 'interior' | 'special' | 'roguelike';

export type AtmosphereState = {
  gameTimeHours: number;
  gameTimeMinutes: number;
  gameDate: GameDate | null;
  season: string | null;
  currentTimeOfDay: string | null;
  climate: MapData['climate'] | null;
  mapData: MapData | null;
  specialMapData: SpecialMapData | null;
  currentWeather: ReturnType<typeof weatherService.getWeather> | null;
  viewMode: string;
  atmosphereMode: AtmosphereMode;
};

const toSpecialMapData = (mapData: MapData | null, isSpecialMap: boolean): SpecialMapData | null => {
  if (!mapData || !isSpecialMap) return null;
  return mapData as SpecialMapData;
};

export const useAtmosphereState = (): AtmosphereState => {
  const { gameTimeHours, gameTimeMinutes, season, currentTimeOfDay, gameDate } = useGame();
  const { mapData, isSpecialMap } = useMap();
  const { viewMode } = usePlayer();

  const specialMapData = useMemo(() => toSpecialMapData(mapData, isSpecialMap), [mapData, isSpecialMap]);

  const currentWeather = useMemo(() => {
    if (!mapData || !mapData.tiles?.length) return null;

    const mapCenterX = Math.floor(mapData.tiles[0].length / 2);
    const mapCenterY = Math.floor(mapData.tiles.length / 2);
    const centerTile = mapData.tiles[mapCenterY]?.[mapCenterX];
    if (!centerTile) return null;

    return weatherService.getWeather(
      mapData.climate,
      centerTile.biome,
      season,
      currentTimeOfDay,
      centerTile.altitude || 0.5,
      gameDate ? getDayOfYear(gameDate) : 180,
      { x: mapCenterX, y: mapCenterY }
    );
  }, [mapData, season, currentTimeOfDay, gameDate, Math.floor(gameTimeHours)]);

  const atmosphereMode: AtmosphereMode = useMemo(() => {
    if (viewMode === 'interior') return 'interior';
    if (mapData?.mapType === 'special' || specialMapData) return 'special';
    // TODO: Wire roguelike/minigame background mode when available.
    return 'outdoor';
  }, [viewMode, mapData?.mapType, specialMapData]);

  return {
    gameTimeHours,
    gameTimeMinutes,
    gameDate: gameDate ?? null,
    season,
    currentTimeOfDay,
    climate: mapData?.climate ?? null,
    mapData: mapData ?? null,
    specialMapData,
    currentWeather,
    viewMode,
    atmosphereMode
  };
};
