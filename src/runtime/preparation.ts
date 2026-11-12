import { populateCharacter } from "../content/geography/character";
import { generateCharacter } from "../content/characters/generate";
import { createSession } from "./session";
import { integratedSetting } from "../content/geography/defaults";
import { settingSchema, type WorldSetting } from "../content/geography/types";
import { withTravelWaterways, type TravelWaterwayInputs } from "../world/travel/waterways";
import type { WorldPreparationRequest, WorldPreparationResult } from "../world/worker";
import { retainTerrainWorker } from "./terrain-worker-owner";
import { markEvent } from "./vitals";
import { smallMemoryDevice } from "./device";

/** A phone killed for memory takes its worker with it without firing onerror,
 * which used to leave the splash waiting for a message that never came. Long
 * enough that a slow device preparing a large settlement is not cut off. */
const PREPARE_TIMEOUT_MS = 90_000;

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
    if (waterways) resolved.playableMap = withTravelWaterways(resolved.playableMap!, waterways);
    return createSession("atlas", seed, { setting: resolved });
  }
  signal?.throwIfAborted();
  const worker = new Worker(new URL("../world/worker.ts", import.meta.url), {
    type: "module",
  });
  const retire = smallMemoryDevice();
  let owned = true;
  try {
    const { prepared, playableMap } = await new Promise<WorldPreparationResult>(
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
        worker.onmessage = ({ data }: MessageEvent<WorldPreparationResult | { error: string }>) => {
          cleanup();
          if ("error" in data) reject(Error(data.error));
          else resolve(data);
        };
        worker.onerror = (e) => {
          cleanup();
          reject(Error(e.message));
        };
        worker.postMessage({ prepare: { setting: resolved, seed, cachePrepared, retire, waterways } } satisfies WorldPreparationRequest);
      },
    );
    signal?.throwIfAborted();
    if (retire) {
      worker.terminate();
      owned = false;
    }
    if (playableMap) resolved.playableMap = playableMap;
    const engine = createSession(
      "atlas",
      seed,
      { setting: resolved, prepared },
    );
    if (!retire) {
      retainTerrainWorker(engine.world, worker);
      owned = false;
    }
    return engine;
  } finally {
    if (owned) worker.terminate();
  }
}
