import { places } from "../../content/geography/places";
import { settingFor } from "../../content/geography/resolve";
import type { WorldSetting, AtlasPlace } from "../../content/geography/types";
import { italianTimeContext } from "../../content/history/time/italy";
import { eraAt } from "../../content/history/dates";
export const YEAR_MIN = -1000000;
export const YEAR_MAX = 10000;
export function timeBounds(year: number) {
  return {
    min: Math.max(YEAR_MIN, year - 1000),
    max: Math.min(YEAR_MAX, year + 1000),
  };
}
export function settingAt(base: WorldSetting, year: number): WorldSetting {
  if (!Number.isInteger(year) || year < YEAR_MIN || year > YEAR_MAX)
    throw Error("Year outside the world chronology");
  const anchor: AtlasPlace = places.find((p) => p.id === base.placeId) ?? {
    id: base.placeId,
    name: base.location,
    aliases: [],
    lon: base.lon,
    lat: base.lat,
    year: base.year,
    culture: base.culture,
    climate: base.climate,
    relief: base.relief,
    water: base.water,
    settlement: base.settlement,
    architecture: base.architecture,
  };
  const resolved = settingFor(anchor, year);
  const local = italianTimeContext({
    ...resolved,
    lon: base.lon,
    lat: base.lat,
  });
  return {
    ...resolved,
    location: local?.name ?? resolved.location,
    community: local?.community ?? resolved.community,
    architecture: local && year < 500 ? "classical" : resolved.architecture,
    lon: base.lon,
    lat: base.lat,
    relief: base.relief,
    water: base.water,
    climate: base.climate,
    environment: base.environment,
    geographyMode: base.geographyMode,
    playableMap: base.playableMap,
    season: base.season,
  };
}
export function timeContext(setting: WorldSetting) {
  return (
    italianTimeContext(setting) ?? {
      name: setting.location,
      community: setting.community,
      text: `${setting.location} is now in ${eraAt({ year: setting.year }).label.toLowerCase()}. The same ground is home to a different generation, with its own work, households and places of gathering.`,
      sources: [] as { title: string; url: string }[],
    }
  );
}
