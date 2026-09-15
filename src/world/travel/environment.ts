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
  const form = mapForm(e.anchor);
  const setting = settingFor(place, year);
  // A small island and open water are drawn as themselves. Everything else
  // keeps real Earth coastlines, which are what a continental map needs.
  if (form === "earth") setting.geographyMode = "earth";
  else {
    setting.geographyMode = "configured";
    setting.water = form;
  }
  setting.ecologyRevision = 2;
  setting.environment = { ...environmentFor(setting, broadEnvironment(setting.lon, setting.lat).moisture), ecology: e.ecology, colorway: e.colorway };
  return setting;
}
export const mapClimateLabel = (e: MapEnvironment) =>
  e.surface === "sea"
    ? "Ocean"
    : e.climate[0].toUpperCase() + e.climate.slice(1);

/** How a map should portray its place. The network is schematic: a map stands
 * for somewhere rather than framing 600 m of it, so a small island is drawn as
 * an island and open water as open water, instead of sampling Earth at true
 * scale and landing in the middle of either. */
export type MapForm = "island" | "ocean" | "earth";
const forms = new Map<string, MapForm>();
export function mapForm(anchor: Coordinate): MapForm {
  const key = `${anchor.lon.toFixed(3)},${anchor.lat.toFixed(3)}`;
  const cached = forms.get(key);
  if (cached) return cached;
  const here = toAtlas(anchor.lon, anchor.lat);
  const KM = 2048 / 111; // atlas tiles per kilometre
  const seaFraction = (km: number, points: number) => {
    let sea = 0;
    for (let i = 0; i < points; i++) {
      const a = (i / points) * Math.PI * 2;
      const p = atlasSample(
        here.x + Math.cos(a) * km * KM,
        here.y + Math.sin(a) * km * KM,
      );
      if (p.coast < 0) sea++;
    }
    return sea / points;
  };
  let form: MapForm = "earth";
  // The anchor can sit a little offshore of a coarse coastline, so judge open
  // water by its surroundings rather than by one sample.
  if (atlasSample(here.x, here.y).coast < 0 && seaFraction(6, 8) === 1)
    form = "ocean";
  else {
    // Require the outer ring to be mostly water. A single nearby coastal
    // island must not turn a continental map into a configured island.
    if (seaFraction(160, 16) >= 0.85) form = "island";
  }
  forms.set(key, form);
  return form;
}
