import { stateHash } from "../core/random";
import type { WorldSetting } from "../content/geography/types";
import type { TravelWaterwayInputs } from "../world/travel/waterways";
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
let deferredOpens = 0;

type CachedSettlement = {
  key: string;
  prepared: PreparedSettlement;
  recipe?: string;
  playableMap?: WorldSetting["playableMap"];
};

export const preparedKey = (setting: WorldSetting, seed: string, waterways?: TravelWaterwayInputs) =>
  waterways
    ? `${PREPARED_VERSION}:travel:${stateHash([setting, waterways])}:${seed}`
    : `${PREPARED_VERSION}:${stateHash(setting)}:${seed}`;

function open(): Promise<IDBDatabase | undefined> {
  if (typeof indexedDB === "undefined" || deferredOpens) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const request = indexedDB.open(DB, 3);
    let deferred = false;
    const defer = () => {
      if (deferred) return;
      clearTimeout(deadline);
      deferred = true;
      deferredOpens++;
      resolve(undefined);
    };
    // An older tab can block the upgrade and every open queued behind it.
    const deadline = setTimeout(defer, 2000);
    const finish = (db?: IDBDatabase) => {
      clearTimeout(deadline);
      if (deferred) {
        deferredOpens--;
        db?.close();
      } else resolve(db);
    };
    request.onupgradeneeded = ({ oldVersion }) => {
      const store = oldVersion < 1
        ? request.result.createObjectStore(STORE, { keyPath: "key" })
        : request.transaction!.objectStore(STORE);
      // Pruning walks this index by key alone; reading rows cloned every world.
      if (oldVersion < 2) store.createIndex("at", "at");
      store.createIndex("recipe", "recipe");
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      finish(db);
    };
    request.onerror = () => finish();
    request.onblocked = defer;
  });
}

export async function loadPrepared(
  key: string,
  byRecipe = false,
): Promise<CachedSettlement | undefined> {
  const db = await open();
  if (!db) return;
  return new Promise<CachedSettlement | undefined>((resolve) => {
    const store = db.transaction(STORE).objectStore(STORE);
    const request = (byRecipe ? store.index("recipe") : store).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(undefined);
  }).finally(() => db.close());
}

export async function savePrepared(entry: CachedSettlement) {
  const db = await open().catch(() => undefined);
  if (!db) return;
  try {
    const tx = db.transaction(STORE, "readwrite"),
      store = tx.objectStore(STORE);
    store.put({ ...entry, at: Date.now() });
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
  } finally {
    db.close();
  }
}
