import { places } from "../../content/geography/places";
import { regionalProfiles } from "../../content/geography/regions";
import { containsDate } from "../../content/history/dates";
import { environmentFor } from "../../content/geography/defaults";
import { settingFor } from "../../content/geography/resolve";
import type { AtlasPlace, WorldSetting } from "../../content/geography/types";
import {
  atlasSample,
  broadEnvironment,
  toAtlas,
  fromAtlas,
} from "../geography/atlas";
import { geographicClimate } from "../geography/climate";
import { inBounds, inPolygon } from "../regional/geometry";
import type { Coordinate, TravelStop } from "./types";

export function resolveMapEnvironment(anchor: Coordinate, year: number) {
  const origin = toAtlas(anchor.lon, anchor.lat);
  // Match the existing regional generator's 128-tile ambient blocks.
  const sample = fromAtlas(
    Math.floor(origin.x / 128) * 128 + 64,
    Math.floor(origin.y / 128) * 128 + 64,
  );
  const ambient = broadEnvironment(sample.lon, sample.lat);
  const profiles = regionalProfiles
    .filter(
      (p) =>
        containsDate(p.dates, { year }) &&
        inBounds(anchor.lon, anchor.lat, p.bounds),
    )
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
  const distance = (p: Coordinate) => {
    const longitude = ((p.lon - anchor.lon + 540) % 360) - 180;
    return Math.hypot(
      longitude * Math.cos((anchor.lat * Math.PI) / 180),
      p.lat - anchor.lat,
    );
  };
  const nearby = places.reduce((a, b) => (distance(a) <= distance(b) ? a : b));
  let defaults = {
    climate: geographicClimate(anchor.lat, ambient.moisture),
    relief: ambient.relief,
    culture: nearby.culture,
    architecture: nearby.architecture,
    water: "none" as WorldSetting["water"],
  };
  for (const p of profiles) defaults = { ...defaults, ...p.defaults };
  const named = profiles
    .flatMap((p) => p.places ?? [])
    .filter(
      (p) =>
        containsDate(p.dates, { year }) &&
        (p.footprint
          ? inPolygon(anchor.lon, anchor.lat, p.footprint)
          : Math.max(
              Math.abs(toAtlas(...p.at).x - origin.x),
              Math.abs(toAtlas(...p.at).y - origin.y),
            ) <= p.radius),
    )
    .sort((a, b) => a.radius - b.radius || a.id.localeCompare(b.id))[0];
  if (named) defaults = { ...defaults, ...named.defaults };
  const shore = atlasSample(origin.x, origin.y);
  if (year < -9999 && anchor.lat > 48) defaults.climate = "tundra";
  const ecology = environmentFor({
    ...defaults,
    ...anchor,
    settlement: "camp",
  });
  return {
    anchor: { ...anchor },
    year,
    ...defaults,
    ecology: ecology.ecology,
    landform: ecology.landform,
    surface: shore.coast < 0 ? ("sea" as const) : ("land" as const),
    coastDistance: shore.coast,
    riverDistance: shore.river,
    profiles: profiles.map((p) => p.id),
    placeProfile: named?.id,
    culturalFallback: profiles.some((p) => p.defaults.culture)
      ? undefined
      : nearby.id,
  };
}
export type MapEnvironment = ReturnType<typeof resolveMapEnvironment>;
export function settingForTravelStop(stop: TravelStop, year: number) {
  const e =
    stop.environment.year === year
      ? stop.environment
      : resolveMapEnvironment(stop.environment.anchor, year);
  const place: AtlasPlace = {
    id: stop.locationId ?? `travel-${stop.id}`,
    name: stop.name,
    aliases: [],
    ...e.anchor,
    climate: e.climate,
    relief: e.relief,
    culture: e.culture,
    architecture: e.architecture,
    water: e.water,
    year,
    settlement:
      stop.settlement === "city"
        ? "city"
        : stop.settlement === "town"
          ? "village"
          : "camp",
  };
  const setting = settingFor(place, year);
  setting.geographyMode = "earth";
  setting.environment = environmentFor(setting);
  return setting;
}
export const mapClimateLabel = (e: MapEnvironment) =>
  e.surface === "sea"
    ? "Ocean"
    : e.climate[0].toUpperCase() + e.climate.slice(1);
