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
    const request = indexedDB.open(DB, 2);
    request.onupgradeneeded = ({ oldVersion }) => {
      const store = oldVersion < 1
        ? request.result.createObjectStore(STORE, { keyPath: "key" })
        : request.transaction!.objectStore(STORE);
      // Pruning walks this index by key alone; reading rows cloned every world.
      store.createIndex("at", "at");
    };
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
    let kept = 0;
    const cursor = store.index("at").openKeyCursor(null, "prev");
    cursor.onsuccess = () => {
      const row = cursor.result;
      if (!row) return;
      if (++kept > KEEP) store.delete(row.primaryKey);
      row.continue();
    };
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    // Quota or a private window: the world still opens, just slower next time.
  }
}
