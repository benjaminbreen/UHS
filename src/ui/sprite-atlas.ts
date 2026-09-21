import { useSyncExternalStore } from "react";
import artVersion from "../render/generated/art-version.json" with { type: "json" };

// Same URLs as WorldScene.preload, query string included, so the UI and Phaser
// share one download. Importing the JSON instead put 1.5MB of frames in the
// bundle on top of the copy Phaser fetches.
const sheets = {
  fauna: "/fauna/atlas",
  faunaB: "/fauna-b/atlas",
  faunaC: "/fauna-c/atlas",
  nature: "/nature/atlas",
  ecology: "/ecology/atlas",
  props: "/props/atlas",
  buildings: "/packs/buildings",
  civic: "/packs/civic",
  atlas: "/packs/atlas",
} as const;

export type SheetName = keyof typeof sheets;
export type Sheet = {
  image: string;
  frames: Record<
    string,
    { frame: { x: number; y: number; w: number; h: number } }
  >;
  meta: { size: { w: number; h: number } };
};
export type Sheets = Record<SheetName, Sheet>;

const stamp = `?v=${artVersion.stamp}`;
export const sheetImage = (name: SheetName) => `${sheets[name]}.png${stamp}`;

let loaded: Sheets | null = null;
let pending: Promise<Sheets> | undefined;
const listeners = new Set<() => void>();

export function loadSheets() {
  pending ??= Promise.all(
    (Object.keys(sheets) as SheetName[]).map(async (name) => {
      const res = await fetch(`${sheets[name]}.json${stamp}`);
      if (!res.ok) throw new Error(`${sheets[name]}.json: ${res.status}`);
      const json = await res.json();
      return [name, { ...json, image: sheetImage(name) }] as const;
    }),
  ).then((entries) => {
    loaded = Object.fromEntries(entries) as Sheets;
    for (const l of listeners) l();
    return loaded;
  });
  // A failed fetch may be retried by the next caller.
  pending.catch(() => (pending = undefined));
  return pending;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  void loadSheets().catch(() => {});
  return () => listeners.delete(listener);
}

/** The sprite sheets, or null until they arrive. */
export function useSheets() {
  return useSyncExternalStore(subscribe, () => loaded);
}
export const currentSheets = () => loaded;
