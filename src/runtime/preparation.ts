import { createSession } from "./session";
import { integratedSetting } from "../content/geography/defaults";
import { packForSetting } from "../content/geography/pack";
import { settingSchema, type WorldSetting } from "../content/geography/types";
import type { PreparedSettlement } from "../world/v3/prepared";
import { retainTerrainWorker } from "./terrain-worker-owner";

/** The same generator runs synchronously in Node and prepares cloneable geometry
 * in the browser worker. The renderer takes over that already-warm worker. */
export async function prepareSettingSession(
  setting: WorldSetting,
  seed: string,
  signal?: AbortSignal,
) {
  const resolved = integratedSetting(settingSchema.parse(setting));
  if (typeof Worker === "undefined")
    return createSession("atlas", seed, undefined, resolved);
  signal?.throwIfAborted();
  const worker = new Worker(new URL("../world/worker.ts", import.meta.url), {
    type: "module",
  });
  try {
    const prepared = await new Promise<PreparedSettlement>(
      (resolve, reject) => {
        const abort = () => {
          worker.terminate();
          reject(signal!.reason);
        };
        const cleanup = () => signal?.removeEventListener("abort", abort);
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
          prepare: { pack: packForSetting(resolved), seed },
        });
      },
    );
    signal?.throwIfAborted();
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
