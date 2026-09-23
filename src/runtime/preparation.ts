import { populateCharacter } from "../content/geography/character";
import { createSession } from "./session";
import { integratedSetting } from "../content/geography/defaults";
import { packForSetting } from "../content/geography/pack";
import { settingSchema, type WorldSetting } from "../content/geography/types";
import type { PreparedSettlement } from "../world/v3/prepared";
import { retainTerrainWorker } from "./terrain-worker-owner";
import { loadPrepared, preparedKey, savePrepared } from "./prepared-store";
import { markEvent } from "./vitals";

/** A phone killed for memory takes its worker with it without firing onerror,
 * which used to leave the splash waiting for a message that never came. Long
 * enough that a slow device preparing a large settlement is not cut off. */
const PREPARE_TIMEOUT_MS = 90_000;

/** The same generator runs synchronously in Node and prepares cloneable geometry
 * in the browser worker. The renderer takes over that already-warm worker. */
export async function prepareSettingSession(
  setting: WorldSetting,
  seed: string,
  signal?: AbortSignal,
  cachePrepared = true,
) {
  const resolved = populateCharacter(
    integratedSetting(settingSchema.parse(setting)),
    seed,
  );
  if (typeof Worker === "undefined")
    return createSession("atlas", seed, undefined, resolved);
  signal?.throwIfAborted();
  const worker = new Worker(new URL("../world/worker.ts", import.meta.url), {
    type: "module",
  });
  try {
    // A world seen before is handed to the worker ready-made, so it only has
    // to rebuild the functions around the geometry.
    const key = preparedKey(resolved, seed);
    const cached = cachePrepared
      ? await loadPrepared(key).catch(() => undefined)
      : undefined;
    signal?.throwIfAborted();
    const prepared = await new Promise<PreparedSettlement>(
      (resolve, reject) => {
        const abort = () => {
          worker.terminate();
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
        worker.onmessage = ({ data }) => {
          cleanup();
          if (data.error) reject(Error(data.error));
          else resolve(data.prepared);
        };
        worker.onerror = (e) => {
          cleanup();
          reject(Error(e.message));
        };
        worker.postMessage({
          prepare: { pack: packForSetting(resolved), seed, prepared: cached },
        });
      },
    );
    signal?.throwIfAborted();
    if (!cached && cachePrepared) void savePrepared(key, prepared);
    const engine = createSession(
      "atlas",
      seed,
      undefined,
      resolved,
      2,
      3,
      prepared,
    );
    retainTerrainWorker(engine.world, worker);
    return engine;
  } catch (error) {
    worker.terminate();
    throw error;
  }
}
