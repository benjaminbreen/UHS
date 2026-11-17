import type { FairArea, FairFind } from "../fairs/types";

const WALL_ART = ["painting", "tapestry", "carpet", "panel", "map"];
/** A thing to look at in a palace. */
export const find = (id: string, name: string, art: FairFind["art"], tags: string[], tier: FairFind["tier"], look: string, text: string, more: Partial<FairFind> = {}): FairFind =>
  ({ id, name, art, on: WALL_ART.includes(art) ? "wall" : "floor", tags, tier, verb: "Look closely", time: 60, look, text, basis: "documented", keeps: true, ...more });

/** Makers for a palace's rooms and courts by their rectangles, peopled from `court` unless a room says otherwise. */
export function palacePlan(court: string[], outdoors: string[] = []) {
  const room = (id: string, name: string, at: [number, number, number, number], tags: string[], n: number, note: string, more: Partial<FairArea> = {}): FairArea =>
    ({ id, name, kind: "gallery", at, floor: "parquet", stands: { tags, n }, people: court, note, basis: "documented", ...more });
  const open = (id: string, name: string, at: [number, number, number, number], note: string, more: Partial<FairArea> = {}): FairArea =>
    ({ id, name, kind: "court", at, stands: { tags: ["garden"], n: 3 }, people: [...court, ...outdoors], note, basis: "documented", ...more });
  return { room, open };
}
