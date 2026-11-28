import { populationAt } from "./eras";
import { places } from "./places";
import { populateCharacter } from "./character";
import { environmentFor } from "./defaults";
import { describedRegionAt } from "./region-label";
import {
  normalize,
  resolveSetting,
  settingFor,
  tillersHome,
  weatherSeason,
} from "./resolve";
import { settingSchema, type AtlasPlace, type WorldSetting } from "./types";
import {
  matchesCharacterScope,
  resolveCharacterContext,
} from "../characters/resolve";
import { localLabels } from "../characters/livelihood-labels.generated";
import {
  requestableConditions,
  type RequestedCondition,
} from "../health/conditions";
import { broadEnvironment } from "../../world/geography/atlas";
import { resolveMapEnvironment } from "../../world/travel/environment";

const LEGACY_MODES = new Set([
  "exploration",
  "survival",
  "commerce",
  "diplomacy",
  "scholarship",
  "livelihood",
  "story",
  "sandbox",
  "historical",
  "freeplay",
]);

const SEASONS = new Set<WorldSetting["season"]>([
  "spring",
  "summer",
  "autumn",
  "winter",
]);
const WEATHERS = new Set<NonNullable<WorldSetting["weather"]>>([
  "clear",
  "rain",
  "storm",
  "snow",
  "blizzard",
  "hail",
  "dust",
]);
const CONDITIONS = new Set<string>(requestableConditions);

/** Human URL year (no year zero: -395 is 395 BCE) from internal astronomical year. */
export const urlYear = (year: number) => (year > 0 ? year : -(1 - year));

/** Internal astronomical year (0 is 1 BCE) from human URL year. */
export const fromUrlYear = (raw: number) =>
  raw > 0 ? raw : raw === 0 ? 0 : 1 + raw;

const yearPrompt = (raw: number) =>
  raw > 0 ? `${raw} CE` : `${raw === 0 ? 1 : -raw} BCE`;

const decodeSegment = (s: string) => {
  try {
    return decodeURIComponent(s).replace(/[_+]+/g, " ").trim();
  } catch {
    return;
  }
};

const titleCase = (s: string) =>
  s
    .trim()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

function matchLocalRole(s: WorldSetting, asked: string) {
  const target = normalize(asked).replace(/-/g, " ");
  if (!target) return;
  const ctx = resolveCharacterContext(s);
  const candidates = ctx.livelihoods.flatMap((l) => [
    l.label,
    ...[...(l.labels ?? []), ...(localLabels[l.id] ?? [])]
      .filter(
        (label) =>
          matchesCharacterScope(label.scope, s) &&
          (!label.ecologies ||
            (!!s.environment?.ecology &&
              label.ecologies.includes(s.environment.ecology))),
      )
      .map((label) => label.label),
  ]);
  return candidates.find(
    (label) => normalize(label).replace(/-/g, " ") === target,
  );
}

type Modifiers = {
  season?: WorldSetting["season"];
  weather?: WorldSetting["weather"];
  condition?: RequestedCondition;
};

function applyModifiers(s: WorldSetting, mod: Modifiers): WorldSetting {
  const weather = mod.weather ?? s.weather;
  const season =
    mod.season ?? (mod.weather ? weatherSeason[mod.weather] : undefined) ?? s.season;
  const condition = mod.condition ?? s.condition;
  return {
    ...s,
    season,
    ...(weather ? { weather } : {}),
    ...(condition ? { condition } : {}),
  };
}

function readModifiers(q: URLSearchParams): Modifiers {
  const rawSeason = q.get("season")?.toLowerCase();
  const rawWeather = q.get("weather")?.toLowerCase();
  const rawCondition = q.get("condition")?.toLowerCase();
  return {
    season:
      rawSeason && SEASONS.has(rawSeason as WorldSetting["season"])
        ? (rawSeason as WorldSetting["season"])
        : undefined,
    weather:
      rawWeather &&
      WEATHERS.has(rawWeather as NonNullable<WorldSetting["weather"]>)
        ? (rawWeather as WorldSetting["weather"])
        : undefined,
    condition:
      rawCondition && CONDITIONS.has(rawCondition)
        ? (rawCondition as RequestedCondition)
        : undefined,
  };
}

export function settingForCoordinate(
  lat: number,
  lon: number,
  year: number,
  seed = "earth-2",
  role?: string,
): WorldSetting | undefined {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180 ||
    !Number.isInteger(year) ||
    year < -1000000 ||
    year > 10000
  )
    return;
  const e = resolveMapEnvironment({ lon, lat }, year);
  const gazetteer = places.find(
    (p) => !!p.population && Math.hypot(p.lon - lon, p.lat - lat) < 0.15,
  );
  const region = describedRegionAt(lon, lat);
  const coordLabel = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;
  const place: AtlasPlace = {
    id: `coord-${lat.toFixed(3)},${lon.toFixed(3)}`,
    name: gazetteer?.name ?? region?.label ?? coordLabel,
    aliases: [],
    population: gazetteer ? populationAt(gazetteer, year) : undefined,
    lon,
    lat,
    climate: e.climate,
    relief: e.relief,
    culture: e.culture,
    architecture: e.architecture,
    water: e.surface === "sea" ? "ocean" : e.water,
    year,
    settlement: gazetteer ? gazetteer.settlement : "village",
  };
  const base = settingFor(place, year);
  base.geographyMode = e.surface === "sea" ? "configured" : "earth";
  if (e.surface === "sea") base.water = "ocean";
  base.ecologyRevision = 2;
  base.environment = {
    ...environmentFor(base, broadEnvironment(lon, lat).moisture),
    ecology: e.ecology,
    colorway: e.colorway,
  };
  if (role?.trim()) {
    const matched = matchLocalRole(base, role) ?? titleCase(role);
    base.role = matched;
    base.characterName = matched;
    base.settlement = tillersHome(base, matched);
  }
  const parsed = settingSchema.safeParse(populateCharacter(base, seed));
  return parsed.success ? parsed.data : undefined;
}

export type ParsedScenarioUrl = {
  setting?: WorldSetting;
  prompt?: string;
  seed: string;
  explicitSeed: boolean;
  pace?: "quick" | "full";
  autoStart: boolean;
  source: "path" | "query";
};

function resolveNamed(
  place: string,
  yearLabel: string,
  seed: string,
  role?: string,
): WorldSetting | undefined {
  const tryResolve = (text: string) => {
    const r = resolveSetting(text, seed);
    return "setting" in r && !r.needsInterpretation ? r.setting : undefined;
  };
  const placeVariants = place.includes("-")
    ? [place, place.replace(/-/g, " ")]
    : [place];
  if (role) {
    const roleVariants = role.includes("-")
      ? [role.replace(/-/g, " "), role]
      : [role];
    for (const p of placeVariants)
      for (const r of roleVariants) {
        const hit = tryResolve(`${r} in ${p}, ${yearLabel}`);
        if (hit) return hit;
      }
  }
  for (const p of placeVariants) {
    const base = tryResolve(`${p}, ${yearLabel}`);
    if (!base) continue;
    if (!role) return base;
    const matched = matchLocalRole(base, role) ?? titleCase(role);
    const next: WorldSetting = {
      ...base,
      role: matched,
      characterName: matched,
      settlement: tillersHome(base, matched),
    };
    return populateCharacter(next, seed);
  }
  return;
}

export function parseScenarioUrl(
  pathname: string,
  search = "",
  defaultSeed = "earth-2",
): ParsedScenarioUrl | undefined {
  const q = new URLSearchParams(search);
  const explicitSeed = !!q.get("seed")?.trim();
  const seed = q.get("seed")?.trim() || defaultSeed;
  const rawPace = q.get("pace")?.toLowerCase();
  const pace =
    rawPace === "quick" ? "quick" : rawPace === "full" ? "full" : undefined;
  const go = q.get("go")?.toLowerCase() ?? q.get("play")?.toLowerCase();
  const autoStart = go === "1" || go === "true";
  const mod = readModifiers(q);
  const queryRole = q.get("role")?.trim() || undefined;

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 2 && parts.length <= 3 && /^-?\d{1,7}$/.test(parts[0])) {
    const rawYear = Number(parts[0]);
    const rawPlace = decodeSegment(parts[1]);
    if (Number.isSafeInteger(rawYear) && rawPlace) {
      const third = parts[2] ? decodeSegment(parts[2]) : undefined;
      const pathRole =
        third && !LEGACY_MODES.has(third.toLowerCase()) ? third : undefined;
      const role = queryRole ?? pathRole;
      const coord = /^@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(rawPlace);
      const setting = coord
        ? settingForCoordinate(
            Number(coord[1]),
            Number(coord[2]),
            fromUrlYear(rawYear),
            seed,
            role,
          )
        : resolveNamed(rawPlace, yearPrompt(rawYear), seed, role);
      if (setting) {
        return {
          setting: applyModifiers(setting, mod),
          seed,
          explicitSeed,
          pace,
          autoStart,
          source: "path",
        };
      }
    }
  }

  if (q.has("lat") && q.has("lon")) {
    const lat = Number(q.get("lat"));
    const lon = Number(q.get("lon"));
    const rawYear = q.has("year") ? Number(q.get("year")) : 1500;
    if (Number.isSafeInteger(rawYear)) {
      const setting = settingForCoordinate(
        lat,
        lon,
        fromUrlYear(rawYear),
        seed,
        queryRole,
      );
      if (setting) {
        return {
          setting: applyModifiers(setting, mod),
          seed,
          explicitSeed,
          pace,
          autoStart,
          source: "query",
        };
      }
    }
  }

  const startPrompt = q.get("start")?.trim();
  if (startPrompt) {
    const resolved = resolveSetting(startPrompt, seed);
    if ("setting" in resolved && !resolved.needsInterpretation) {
      return {
        setting: applyModifiers(resolved.setting, mod),
        seed,
        explicitSeed,
        pace,
        autoStart,
        source: "query",
      };
    }
    return {
      prompt: startPrompt,
      seed,
      explicitSeed,
      pace,
      autoStart: false,
      source: "query",
    };
  }

  if (pace) {
    return { seed, explicitSeed, pace, autoStart: false, source: "query" };
  }
  return;
}

export function resolvePathSetting(
  pathname: string,
  seed = "earth-2",
): WorldSetting | undefined {
  return parseScenarioUrl(pathname, "", seed)?.setting;
}

export type ScenarioUrlOptions = {
  seed?: string;
  pace?: "quick" | "full";
  exactCoords?: boolean;
  includeRole?: boolean;
  autoStart?: boolean;
};

export function scenarioUrl(
  setting: WorldSetting,
  options: ScenarioUrlOptions = {},
): string {
  const year = urlYear(setting.year);
  const useCoords =
    options.exactCoords || setting.placeId.startsWith("coord-");
  const placeSeg = useCoords
    ? `@${setting.lat.toFixed(2)},${setting.lon.toFixed(2)}`
    : encodeURIComponent(setting.location);
  const roleSlug =
    options.includeRole !== false && setting.role && setting.role !== "Traveler"
      ? `/${encodeURIComponent(setting.role.toLowerCase().replace(/\s+/g, "-"))}`
      : "";
  const params = new URLSearchParams();
  if (options.seed) params.set("seed", options.seed);
  if (options.pace === "quick") params.set("pace", "quick");
  if (setting.weather) params.set("weather", setting.weather);
  if (setting.condition) params.set("condition", setting.condition);
  if (options.autoStart) params.set("go", "1");
  const qs = params.toString();
  return `/${year}/${placeSeg}${roleSlug}${qs ? `?${qs}` : ""}`;
}
