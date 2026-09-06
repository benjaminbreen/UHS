import Dexie, { type EntityTable } from "dexie";
import type { Snapshot } from "../core/types";
const db = new Dexie("uhs-worlds") as Dexie & {
  saves: EntityTable<{ id: string; snapshot: Snapshot }, "id">;
};
db.version(1).stores({ saves: "id" });
let writes = Promise.resolve();
export const save = (snapshot: Snapshot) => {
  writes = writes
    .catch(() => {})
    .then(() => db.saves.put({ id: "current", snapshot }))
    .then(() => {});
  return writes;
};
export const preserveRecovery = async (snapshot: unknown) => {
  await db.table("saves").put({ id: `recovery-${Date.now()}`, snapshot });
};
export const load = async () => (await db.saves.get("current"))?.snapshot;
export function download(name: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/** A tab must own this lock before replacing the shared local save. Other tabs use copies. */
export async function claimWriter(): Promise<boolean> {
  if (!navigator.locks) return false;
  return new Promise((resolve) => {
    void navigator.locks.request(
      "uhs-save-writer",
      { ifAvailable: true },
      async (lock) => {
        resolve(!!lock);
        if (lock)
          await new Promise<void>((release) =>
            window.addEventListener("pagehide", () => release(), {
              once: true,
            }),
          );
      },
    );
  });
}
