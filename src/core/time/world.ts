import { venueOfClaim, venuesFor } from "../../content/venues";
import { doorCell } from "../doors";
import type { Actor, Place, WorldModel, WorldObject } from "../types";
import type { WorldSetting } from "../../content/geography/types";
import { packForSetting } from "../../content/geography/pack";
import { buildingModel } from "../../content/graphics/models";
import { random } from "../random";
import { generateCharacter } from "../../content/characters/generate";
import {
  ageStructure,
  conditionOf,
  fabricOf,
  structureBlocks,
  isRuin,
} from "./structure";
import { settingAt } from "./setting";
import { ageObject } from "./objects";
import { terrainStep } from "../topography";

export type BuildingPhase = {
  siteId: string;
  incarnation: number;
  built: number;
  abandoned: number;
  replaced: number;
  sprite: string;
  place: Place;
};
export function buildingAt(
  base: Place,
  seed: string,
  setting: WorldSetting,
  year: number,
): BuildingPhase {
  const original = buildingModel(base.sprite);
  const fabric = fabricOf(original.wall);
  const service = Math.round(
    { masonry: 160, earth: 65, timber: 80 }[fabric] *
      (0.7 + random(seed, base.id, "service")),
  );
  const interval =
    service +
    (random(seed, base.id, "archaeology") < 0.12
      ? 360
      : 18 + Math.floor(random(seed, base.id, "vacancy") * 60));
  const origin =
    setting.year -
    15 -
    Math.floor(random(seed, base.id, "initial-age") * service * 0.45);
  const incarnation = Math.floor((year - origin) / interval);
  const built = origin + incarnation * interval,
    abandoned = built + service;
  let sprite = base.sprite;
  if (incarnation !== 0) {
    const pack = packForSetting(
      settingAt(setting, Math.max(-1000000, Math.min(10000, built))),
    );
    const candidates = pack.buildings.filter((frame) => {
      const model = buildingModel(frame);
      return model.footprint[0] <= base.w && model.footprint[1] <= base.h;
    });
    if (candidates.length) {
      candidates.sort((a, b) => {
        const aa = buildingModel(a).footprint,
          bb = buildingModel(b).footprint;
        return bb[0] * bb[1] - aa[0] * aa[1];
      });
      const largest = buildingModel(candidates[0]).footprint;
      const fit = candidates.filter(
        (x) =>
          buildingModel(x).footprint[0] * buildingModel(x).footprint[1] >=
          largest[0] * largest[1] * 0.8,
      );
      sprite =
        fit[
          Math.floor(
            random(seed, base.id, "replacement", incarnation) * fit.length,
          )
        ];
    }
  }
  const model = buildingModel(sprite),
    w = model.footprint[0],
    h = model.footprint[1];
  const place: Place = {
    ...base,
    sprite,
    w,
    h,
    x: base.x + Math.floor((base.w - w) / 2),
    y: base.y + base.h - h,
    structure: ageStructure(
      seed,
      `${base.id}:${incarnation}`,
      fabricOf(model.wall),
      built,
      abandoned,
      year,
      setting.climate === "arid"
        ? 0.18
        : setting.climate === "tropical" || setting.climate === "monsoon"
          ? 0.95
          : 0.68,
    ),
    baselineYear: setting.year,
  };
  place.entrance = {
    x: place.x + model.entrance[0],
    y: place.y + model.entrance[1],
  };
  place.condition = conditionOf(place.structure);
  if (year > abandoned) {
    place.abandonedAt = abandoned;
    place.name = `Remains of ${base.name.toLowerCase()}`;
    place.description =
      "Surviving walls and buried foundations mark an earlier building on this site.";
  }
  return {
    siteId: base.id,
    incarnation,
    built,
    abandoned,
    replaced: built + interval,
    sprite,
    place,
  };
}
export function temporalWorld(
  base: WorldModel,
  seed: string,
  origin: WorldSetting,
  year: number,
): { world: WorldModel; phases: BuildingPhase[] } {
  const setting = settingAt(origin, year),
    pack = packForSetting(setting);
  const phases = base.places.map((p) => buildingAt(p, seed, origin, year));
  const venues = venuesFor(setting, base.places.length);
  for (const phase of phases) {
    if (isRuin(phase.place)) continue;
    const old = venueOfClaim(phase.place.claim);
    if (!old) continue;
    const next = venues.find(v => v.kind === old.kind);
    phase.place.claim = next ? `venue-${next.id}` : "";
    phase.place.name = next?.label ?? "House";
    phase.place.description = next?.note ?? "An inhabited building on an older site.";
  }
  const places = phases.map((p) => p.place),
    byId = new Map(places.map((p) => [p.id, p]));
  const cells = new Map<string, Place>();
  for (const place of base.places)
    for (let y = place.y; y < place.y + place.h; y++)
      for (let x = place.x; x < place.x + place.w; x++)
        cells.set(`${x},${y}`, byId.get(place.id)!);
  const at = (x: number, y: number) => cells.get(`${x},${y}`);
  const ruined = isRuin;
  const objects: WorldObject[] = base.initialObjects.flatMap((o) => {
    const p =
      byId.get(o.placeId ?? o.pos.space) ??
      (o.id.endsWith("-frontage") ? byId.get(o.id.slice(0, -9)) : undefined) ??
      (o.pos.space === "outside" ? at(o.pos.x, o.pos.y) : undefined);
    if (p && ruined(p)) {
      if (o.pos.space !== "outside") return [];
      const remains = ageObject(o, year - (p.structure!.abandoned ?? year));
      return remains ? [remains] : [];
    }
    if (o.sprite?.includes("sacred-marker") && p) {
      const marker = venueOfClaim(p.claim)?.marker;
      if (!marker) return [];
      return [{...structuredClone(o), name: marker.name, description: marker.description, sprite: `study-propb-sacred-marker-${marker.variant}`}];
    }
    if (o.kind === "door" && p)
      return [{ ...o, pos: { ...o.pos, ...doorCell(p) } }];
    return [structuredClone(o)];
  });
  const actors: Actor[] = base.initialActors
    .filter((a) => !byId.get(a.home.space) || !ruined(byId.get(a.home.space)!))
    .map((a) =>
      a.kind !== "human"
        ? structuredClone(a)
        : {
            ...structuredClone(a),
            ...generateCharacter(
              setting,
              seed,
              `${a.id}@${Math.floor(year / 28)}`,
              a.age ?? 34,
            ),
            memories: [],
          },
    );
  const world: WorldModel = {
    ...base,
    temporal: { origin, year },
    pack,
    places,
    initialActors: actors,
    initialObjects: objects,
    place: (id) => byId.get(id),
    activate: undefined,
    restoreDistricts: undefined,
    overrideDecoration: undefined,
    itinerary: undefined,
    routinePending: undefined,
    dormant: undefined,
    rotateRoutines: undefined,
    geography: base.geography
      ? { ...base.geography, packAt: () => pack }
      : undefined,
    blocked: (x, y, space) => {
      if (space !== "outside") return base.blocked(x, y, space);
      const p = at(x, y);
      if (!p) return base.blocked(x, y, space);
      const door = doorCell(p);
      if (x === door.x && y === door.y) return false;
      return ruined(p)
        ? structureBlocks(p, x, y)
        : x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h;
    },
    terrain: (x, y, space) => {
      const p = space && space !== "outside" ? undefined : at(x, y);
      return p && ruined(p)
        ? p.structure!.vegetation > 0.4
          ? "grass"
          : "dirt"
        : base.terrain(x, y, space);
    },
    topography: base.topography
      ? (x, y) => {
          const cell = base.topography!(x, y),
            p = at(x, y);
          if (!p) return cell;
          return {
            ...cell,
            solid: world.blocked(x, y, "outside"),
            ...(ruined(p)
              ? {
                  surface:
                    p.structure!.vegetation > 0.4
                      ? ("grass" as const)
                      : ("soil" as const),
                  feature: undefined,
                  field: undefined,
                  pathArt: undefined,
                  pavement: undefined,
                }
              : {}),
          };
        }
      : undefined,
    canCross: base.topography
      ? (from, to) => terrainStep(world.topography!, from, to).allowed
      : base.canCross,
    chunk: (cx, cy) =>
      Array.from({ length: 4096 }, (_, i) =>
        world.terrain(cx * 64 + (i % 64), cy * 64 + Math.floor(i / 64)),
      ),
  };
  return { world, phases };
}
