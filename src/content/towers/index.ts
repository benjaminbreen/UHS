import type { InteriorProfile } from "../interiors/types";
import { moscow } from "./moscow";
import { newYork } from "./new-york";
import { tokyo } from "./tokyo";

/** A tradition of tall building: its lift, its lobby, the rooms its storeys
 * are fitted out as, and how the lift's cutaway draws it. Who rents the rooms
 * is `tenants.ts`. */
export type TowerStyle = {
  id: string;
  label: string;
  /** The building frames that are towers of this style. */
  frames: string;
  storeys: [number, number];
  lift: { name: string; perFloor: number };
  lobby: InteriorProfile;
  /** By the room kind a tenant asks for: offices, a bank, a bar. */
  rooms: Readonly<Record<string, InteriorProfile>>;
  /** How the lift's cutaway draws it: stone as lit, face and shade; the
   * face's half-width from each fraction of the height up; the crown. */
  section: { stone: [string, string, string]; halves: [number, number][]; crown: "step" | "spire" | "gable" };
};

export const towerStyles: readonly TowerStyle[] = [newYork, moscow, tokyo];
export const towerStyleFor = (frame: string | undefined) => (frame ? towerStyles.find((s) => frame.startsWith(s.frames)) : undefined);
