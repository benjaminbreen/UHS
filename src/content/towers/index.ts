import type { InteriorProfile } from "../interiors/types";
import { newYork } from "./new-york";

/** A kind of storey: what it is, the room it is, and who takes it. */
export type FloorKind = {
  id: string;
  profile: InteriorProfile;
  /** Firms that take a run of these floors; one is picked per run. */
  tenants: readonly string[];
  weight: number;
  /** How many storeys one tenant takes. */
  run: [number, number];
  /** Where in the height it stands, as fractions from the street to the top. */
  band?: [number, number];
};

/** A tradition of tall building: where and when, its lift, and the storeys it is let in. */
export type TowerStyle = {
  id: string;
  label: string;
  /** The building frames that are towers of this style. */
  frames: string;
  storeys: [number, number];
  lift: { name: string; perFloor: number; operator: string };
  lobby: InteriorProfile;
  floors: readonly FloorKind[];
  /** The top storey: a suite or a lookout. */
  top: FloorKind;
};

export const towerStyles: readonly TowerStyle[] = [newYork];
export const towerStyleFor = (frame: string | undefined) => (frame ? towerStyles.find((s) => frame.startsWith(s.frames)) : undefined);
