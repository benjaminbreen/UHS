import type { InteriorProfile } from "../interiors/types";
import { moscow } from "./moscow";
import { newYork } from "./new-york";
import { tokyo } from "./tokyo";

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
  /** How the lift's cutaway draws it: stone as lit, face and shade; the
   * face's half-width from each fraction of the height up; the crown. */
  section: { stone: [string, string, string]; halves: [number, number][]; crown: "step" | "spire" | "gable" };
};

export const towerStyles: readonly TowerStyle[] = [newYork, moscow, tokyo];
export const towerStyleFor = (frame: string | undefined) => (frame ? towerStyles.find((s) => frame.startsWith(s.frames)) : undefined);
