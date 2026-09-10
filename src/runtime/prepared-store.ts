import { stateHash } from "../core/random";
import type { WorldSetting } from "../content/geography/types";
import {
  PREPARED_VERSION,
  type PreparedSettlement,
} from "../world/v3/prepared";

/** Prepared settlements kept in IndexedDB, so a world visited before opens
 * without generating again. Keyed on the generator version, the setting and
 * the seed; a handful of the most recent are kept. */
const DB = "uhs-prepared",
  STORE = "settlements",
  KEEP = 6;

export const preparedKey = (setting: WorldSetting, seed: string) =>
  `${PREPARED_VERSION}:${stateHash(setting)}:${seed}`;

function open(): Promise<IDBDatabase | undefined> {
  if (typeof indexedDB === "undefined") return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore(STORE, { keyPath: "key" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(undefined);
    request.onblocked = () => resolve(undefined);
  });
}

export async function loadPrepared(
  key: string,
): Promise<PreparedSettlement | undefined> {
  const db = await open();
  if (!db) return;
  return new Promise((resolve) => {
    const request = db.transaction(STORE).objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result?.prepared);
    request.onerror = () => resolve(undefined);
  });
}

export async function savePrepared(key: string, prepared: PreparedSettlement) {
  const db = await open();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, "readwrite"),
      store = tx.objectStore(STORE);
    store.put({ key, prepared, at: Date.now() });
    // Oldest entries go once the store is over its keep.
    const all = store.getAll();
    all.onsuccess = () => {
      const rows = (all.result as { key: string; at: number }[]).sort(
        (a, b) => b.at - a.at,
      );
      for (const row of rows.slice(KEEP)) store.delete(row.key);
    };
  } catch {
    // Quota or a private window: the world still opens, just slower next time.
  }
}
