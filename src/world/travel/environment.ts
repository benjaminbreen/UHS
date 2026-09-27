import { places } from "../../content/geography/places";
import { regionalProfiles } from "../../content/geography/regions";
import { containsDate, glacialTundraLatitude } from "../../content/history/dates";
import { environmentFor } from "../../content/geography/defaults";
import { farms, networkOnset } from "../../content/geography/onsets";
import { settingFor } from "../../content/geography/resolve";
import { populationAt } from "../../content/geography/eras";
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
    climate: geographicClimate(anchor.lon, anchor.lat, ambient.moisture, year),
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
  if (defaults.water === "none" && shore.coast > 0 && shore.river < 40)
    defaults.water =
      Math.abs(shore.riverFlow[0]) >= Math.abs(shore.riverFlow[1])
        ? "river-ew"
        : "river-ns";
  if (anchor.lat > (glacialTundraLatitude(year) ?? 90)) defaults.climate = "tundra";
  const ecology = { ...environmentFor({
    ...defaults,
    ...anchor,
    settlement: "camp",
    ecologyRevision: 2,
    // Travel's arid climate is an explicit map contract; geographic biome
    // lookup may otherwise turn a dry atlas cell into a lush outlier.
    geographyMode: defaults.climate === "arid" ? "configured" : "earth",
  }, ambient.moisture), ...(named?.defaults.ecology ?? [...profiles].reverse().find((p) => p.defaults.ecology)?.defaults.ecology) };
  return {
    anchor: { ...anchor },
    year,
    ...defaults,
    ecology: ecology.ecology,
    colorway: ecology.colorway,
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
// The travel culture can lag a modern date (Los Angeles in 1950 still reads
// as foragers), but once the modern network of places exists, land is farmed.
const tilled = (w: Parameters<typeof farms>[0]) => farms(w) || w.year >= networkOnset(w);
export type MapEnvironment = ReturnType<typeof resolveMapEnvironment>;
export function settingForTravelStop(stop: TravelStop, year: number) {
  const e =
    stop.environment.year === year
      ? stop.environment
      : resolveMapEnvironment(stop.environment.anchor, year);
  // The gazetteer place standing on this ground, if any: a tile inside a
  // modern metropolis is named for its suburb but built as part of the city.
  const gazetteer = places.find(
    (p) =>
      !!p.population &&
      Math.hypot(p.lon - e.anchor.lon, p.lat - e.anchor.lat) < 0.15,
  );
  const place: AtlasPlace = {
    id: stop.locationId ?? `travel-${stop.id}`,
    name: stop.name,
    aliases: [],
    population: gazetteer && populationAt(gazetteer, year),
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
        : stop.settlement === "town" || stop.settlement === "village" || stop.countryside === "settled"
          ? "village"
          : stop.countryside && tilled({ ...e.anchor, culture: e.culture, year })
            ? "farm"
            : "camp",
  };
  const setting = settingFor(place, year);
  // A map is a square of the real Earth, so its coasts are the atlas's own.
  // Open sea has no coast to match and nowhere to stand, so it keeps the
  // drawn ocean with its bars and rocks.
  const open = stop.water && e.surface === "sea";
  setting.geographyMode = open ? "configured" : "earth";
  if (open) setting.water = "ocean";
  setting.ecologyRevision = 2;
  setting.environment = { ...environmentFor(setting, broadEnvironment(setting.lon, setting.lat).moisture), ecology: e.ecology, colorway: e.colorway };
  return setting;
}
export const mapClimateLabel = (e: MapEnvironment) =>
  e.surface === "sea"
    ? "Ocean"
    : e.climate[0].toUpperCase() + e.climate.slice(1);

