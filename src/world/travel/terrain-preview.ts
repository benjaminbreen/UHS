import type { WorldSetting } from "../../content/geography/types";
import { createRegionalContext } from "../regional/context";
import { createEnvironment } from "../v3/environment";
import { habitatAt } from "../v3/habitats";

export function adjacentTerrain(setting: WorldSetting) {
  const cache = new Map<string, ReturnType<typeof createEnvironment>>();
  const contexts = new Map<string, ReturnType<typeof createRegionalContext>>();
  return (x: number, y: number) => {
    const map = setting.playableMap;
    if (!map) return undefined;
    const half = map.size / 2;
    if (x >= -half && x < half && y >= -half && y < half) return undefined;
    const side = y < -half ? "N" : y >= half ? "S" : x < -half ? "W" : "E";
    const horizontal = side === "N" || side === "S";
    const u = ((horizontal ? x : y) + half) / (map.size - 1);
    const exit = map.exits.find(
      (e) =>
        e.neighbor &&
        (e.seam?.side ?? e.bearing[0]) === side &&
        u >= (e.seam?.start ?? 0) &&
        u <= (e.seam?.end ?? 1),
    );
    if (!exit?.neighbor) return undefined;
    const n = exit.neighbor;
    const next: WorldSetting = {
      ...setting,
      ...n,
      playableMap: {
        id: exit.to,
        size: n.size === 384 ? 384 : 304,
        exits: [
          {
            ...exit,
            to: map.id,
            bearing: { N: "S", S: "N", E: "W", W: "E" }[side],
            seam: undefined,
            neighbor: {
              lon: setting.lon,
              lat: setting.lat,
              relief: setting.relief,
              climate: setting.climate,
              water: setting.water,
              ...setting.environment!,
              size: map.size,
              geographyMode: setting.geographyMode ?? "earth",
            },
          },
        ],
      },
      environment: {
        ...setting.environment!,
        ecology: n.ecology,
        colorway: n.colorway,
        landform: n.landform,
      },
    };
    let land = cache.get(exit.id);
    if (!land) {
      const region = createRegionalContext(next);
      contexts.set(exit.id, region);
      land = createEnvironment(next, "travel-review:" + exit.to, region);
      cache.set(exit.id, land);
    }
    const depth =
      side === "N"
        ? -half - y
        : side === "S"
          ? y - half
          : side === "W"
            ? -half - x
            : x - half;
    const along = (u - 0.5) * (n.size - 1);
    const across =
      side === "N" || side === "W"
        ? n.size / 2 - 1 - depth
        : -n.size / 2 + depth;
    const nx = horizontal ? along : across,
      ny = horizontal ? across : along;
    const f = land.sample(nx, ny);
    const ecology = contexts.get(exit.id)!.ecologyAt(nx, ny);
    const h = habitatAt(
      ecology.selected.ecology,
      setting.season,
      "travel-review:" + exit.to,
      nx + land.origin.x,
      ny + land.origin.y,
      f,
      ecology.selected.colorway,
    );
    h.blend = ecology.parts;
    return {
      terrain:
        f.water < 0
          ? ("water" as const)
          : f.snow
            ? ("snow" as const)
            : ("grass" as const),
      habitat: h,
    };
  };
}
