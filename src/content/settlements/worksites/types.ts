import type { CharacterScope } from "../../characters/context-types";
import type { WorldSetting } from "../../geography/types";

export type WorksiteProfile = {
  id: string;
  kind: import("../../characters/workplace").Institution;
  revision?: 2 | 3;
  launch?: {fleet?:"lateen"; frame:string; wayFrame?:string; width:number; dryLength:number; reach:number; waterLength:number; label?:string; description?:string};
  /** true needs a river nearby; "sea" needs salt water, as coastal salt pans do. */
  waterSupply?: boolean | "sea";
  /** Work every town of its kind has: placed first and outside the cap of two processing yards. */
  essential?: boolean;
  supplies?: readonly {prop: string; label: string}[];
  label: string;
  scope: Omit<CharacterScope, "communities">;
  urban?: boolean;
  siting: "urban" | "fringe" | "waterside" | "shoreline";
  power?: "water" | "animal" | "wind";
  frame: string;
  outbuilding: { frame: string; label: string };
  capacity: number;
  roles?: readonly string[];
  /** What a mine works: "coal", "tin", "silver", "salt". */
  ore?: string;
  /** Taken on while the worksite stands; where it does not, they work on their own. */
  hires?: readonly string[];
  ward?: { plan: "hall" | "court" | "passage"; cells?: number; bedding: "bed" | "mat"; wall: import("../../../render/interiors/room").WallPattern; floor: import("../../../render/interiors/room").FloorPattern };
  inn?: {
    plan: "hall" | "court" | "passage" | "corridor";
    rooms?: number;
    bedding: "bed" | "mat";
    wall: import("../../../render/interiors/room").WallPattern;
    floor: import("../../../render/interiors/room").FloorPattern;
    fire: import("../../../render/interiors/room").Fire;
    seating: "chair" | "floor";
    endowment?: "free" | "gift" | "paid";
    modern?: boolean;
  };
  basis: "documented" | "reconstructed";
  sources: readonly string[];
  note: string;
};
export function worksiteFits(p: WorksiteProfile, s: WorldSetting) {
  const { years, bounds, except, cultures, places } = p.scope;
  const inBox = (b: readonly number[]) => s.lon >= b[0] && s.lat >= b[1] && s.lon <= b[2] && s.lat <= b[3];
  return (!p.revision || (s.worksiteRevision ?? 1) >= p.revision) && s.year >= years[0] && s.year < years[1] &&
    (!bounds || inBox(bounds)) && !except?.some(inBox) &&
    (!cultures || cultures.includes(s.culture)) &&
    (!places || places.includes(s.placeId)) &&
    (!p.urban || s.settlement === "city" || s.settlement === "port");
}
