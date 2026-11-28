import { populateCharacter } from "../content/geography/character";
import { generateCharacter } from "../content/characters/generate";
import { integratedSetting } from "../content/geography/defaults";
import { settingSchema, type WorldSetting } from "../content/geography/types";
import type { TravelWaterwayInputs } from "../world/travel/waterways";
import type { WorldPreparationRequest, WorldPreparationResult } from "../world/worker";
import { stageEntranceSurvey, retainTerrainWorker, warmTerrainPool } from "./terrain-worker-owner";
import { markEvent } from "./vitals";
import { smallMemoryDevice } from "./device";
import { worldWorker } from "./world-worker";
import {
  mapForCoordinate,
  loadTileNames,
  tileCentre,
  permanentMap,
  permanentExits,
  type PermanentMap,
  type MapExit,
} from "../world/travel/network";
import { settingForTravelStop } from "../world/travel/environment";

/** A phone killed for memory takes its worker with it without firing onerror,
 * which used to leave the splash waiting for a message that never came. Long
 * enough that a slow device preparing a large settlement is not cut off. */
const PREPARE_TIMEOUT_MS = 90_000;

/** A world worker with no job yet, its modules possibly still downloading.
 * A start cancelled before its worker loaded leaves it here, so the next
 * start does not fetch them again from the beginning. */
let spare: Worker | undefined;
const takeWorker = () => {
  const worker = spare ?? worldWorker();
  spare = undefined;
  return worker;
};

export type StartingCharacter = ReturnType<typeof generateCharacter> & { age: number };
export type CharacterPrepared = (setting: WorldSetting, character: StartingCharacter) => void;

/** The same generator runs synchronously in Node and prepares cloneable geometry
 * in the browser worker. Phones retire its generation heap before rendering. */
export async function prepareSettingSession(
  setting: WorldSetting,
  seed: string,
  signal?: AbortSignal,
  cachePrepared = true,
  onCharacter?: CharacterPrepared,
  waterways?: TravelWaterwayInputs,
  deferEntrances = false,
) {
  signal?.throwIfAborted();
  const resolved = populateCharacter(
    integratedSetting(settingSchema.parse(setting)),
    seed,
  );
  signal?.throwIfAborted();
  onCharacter?.(resolved, {
    ...generateCharacter(resolved, resolved.character!.appearanceSeed ?? seed,
      "player", resolved.character!.age!, resolved.role, resolved.characterName),
    age: resolved.character!.age!,
  });
  if (typeof Worker === "undefined") {
    if (waterways) {
      const { withTravelWaterways } = await import("../world/travel/waterways");
      resolved.playableMap = withTravelWaterways(resolved.playableMap!, waterways);
    }
    const { createSession } = await import("./session");
    return createSession("atlas", seed, { setting: resolved });
  }
  signal?.throwIfAborted();
  const worker = takeWorker();
  const retire = smallMemoryDevice();
  let owned = true,
    loaded = false;
  try {
    const { prepared, playableMap, entrancePort } = await new Promise<WorldPreparationResult>(
      (resolve, reject) => {
        const abort = () => {
          cleanup();
          reject(signal!.reason);
        };
        const timer = setTimeout(() => {
          cleanup();
          markEvent("world preparation timed out");
          reject(
            Error(
              "Preparing this world took too long and was stopped. This usually means the device ran out of memory.",
            ),
          );
        }, PREPARE_TIMEOUT_MS);
        const cleanup = () => {
          clearTimeout(timer);
          signal?.removeEventListener("abort", abort);
        };
        signal?.addEventListener("abort", abort, { once: true });
        worker.onmessage = ({ data }: MessageEvent<WorldPreparationResult | { error: string } | { hello: true }>) => {
          if ("hello" in data) {
            if (loaded) return;
            loaded = true;
            // The scene's art waits for the worker's script rather than
            // sharing the connection with it.
            void import("../render/scene-assets").then((m) => m.warmSceneAssets());
            worker.postMessage({ prepare: { setting: resolved, seed, cachePrepared, retire, waterways, deferEntrances } } satisfies WorldPreparationRequest);
            return;
          }
          cleanup();
          if ("error" in data) reject(Error(data.error));
          else resolve(data);
        };
        worker.onerror = (e) => {
          cleanup();
          reject(Error(e.message));
        };
        worker.postMessage({ hello: true } satisfies WorldPreparationRequest);
      },
    );
    signal?.throwIfAborted();
    if (retire) {
      worker.terminate();
      owned = false;
    }
    if (playableMap) resolved.playableMap = playableMap;
    // Loaded after a retiring worker ends so phones never hold two copies of
    // the world generator and its tables at the same time.
    const { createSession } = await import("./session");
    const survey = deferEntrances && !prepared.entrances && resolved.playableMap?.exits.length;
    if (survey) prepared.entrances = [];
    const engine = createSession(
      "atlas",
      seed,
      { setting: resolved, prepared },
    );
    if (survey) stageEntranceSurvey(engine.world, prepared.entrances!, entrancePort, entrancePort ? worker : undefined);
    if (!retire) {
      retainTerrainWorker(engine.world, worker);
      owned = false;
    }
    return engine;
  } finally {
    if (owned && !loaded && signal?.aborted && !spare) {
      worker.onmessage = worker.onerror = null;
      spare = worker;
    } else if (owned) worker.terminate();
  }
}

export function travelSettings(
  map: PermanentMap,
  exits: MapExit[],
  year: number,
) {
  const setting = settingForTravelStop(map, year);
  const waterways: TravelWaterwayInputs = { source: { ...setting }, neighbors: [] };
  setting.playableMap = {
    id: map.networkId,
    name: map.name,
    size: 384,
    exits: exits.map(({ id, to, bearing, mode, seam }) => {
      const destination = permanentMap(to, year);
      const next = settingForTravelStop(destination, year);
      const peer = permanentExits(to, year).find((e) => e.id === id)?.seam;
      waterways.neighbors.push(next);
      return {
        id, to, bearing, mode, seam,
        name: destination.name, settlement: destination.settlement,
        peer: peer ? { side: peer.side, start: peer.start, end: peer.end } : undefined,
        neighbor: {
          lon: next.lon, lat: next.lat, relief: next.relief,
          climate: next.climate, water: next.water,
          ecology: next.environment!.ecology,
          colorway: next.environment!.colorway,
          landform: next.environment!.landform,
          size: 384,
          geographyMode: next.geographyMode ?? "earth",
        },
      };
    }),
  };
  setting.environment = {
    ...setting.environment!,
    population: map.settlement === "city" || map.settlement === "town" || map.settlement === "village"
      ? "settled"
      : (map.countryside ?? "none"),
    start: "wanderer",
  };
  return { setting, waterways };
}

/** Fresh playable start for browser and agents, with map bounds and exits. */
export async function prepareConnectedStart(
  setting: WorldSetting,
  seed: string,
  signal?: AbortSignal,
  onCharacter?: CharacterPrepared,
) {
  if (setting.situation) {
    const engine = await prepareSettingSession(setting, seed, signal, true, onCharacter);
    warmTerrainPool(engine.world, seed);
    return engine;
  }
  const id = mapForCoordinate({ lon: setting.lon, lat: setting.lat });
  await loadTileNames([id]);
  signal?.throwIfAborted();
  const map = permanentMap(id, setting.year);
  const exits = permanentExits(id, setting.year);
  const { setting: travel, waterways } = travelSettings(map, exits, setting.year);
  const bounded = {
    ...setting,
    // The world is generated about the square's centre so that its borders
    // are the same lines of Earth its neighbours see.
    ...tileCentre(id),
    // A wilderness start is otherwise labelled "Countryside" while the map it
    // sits on has a real geographic name. A chosen place keeps its own name,
    // even where its square is named for a feature beside the town.
    location:
      map.locationId ||
      (setting.location !== "Countryside" && !setting.placeId?.startsWith("area-"))
        ? setting.location
        : map.name,
    playableMap: travel.playableMap,
  };
  const engine = await prepareSettingSession(bounded, seed, signal, true, onCharacter, waterways, true);
  warmTerrainPool(engine.world, seed);
  return engine;
}
