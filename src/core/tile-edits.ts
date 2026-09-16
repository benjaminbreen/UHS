import { fellingSwings, plantClass } from "../content/ecology/vegetation";
import type { Decoration } from "./types";

/** What the player has done to one cell of ground. Held in the snapshot, so a
 * felled tree survives a save and a replay. */
export type TileEdit = {
  /** Axe blows landed so far on the plant standing here. */
  chops?: number;
  /** How far the plant has been taken down. */
  stage?: "logs" | "stump" | "stems" | "rubble" | "clear";
  /** Firewood still lying in the felled trunk. */
  wood?: number;
  /** Low vegetation taken off with the scythe. */
  cut?: boolean;
  dug?: boolean;
};
export type TileEdits = Record<string, TileEdit>;
/** What each tool does to the ground in front of it. */
export const TOOL_ACTIONS = {
  axe: "chop",
  spade: "dig",
  scythe: "reap",
  pick: "mine",
} as const;
export type ToolAction = (typeof TOOL_ACTIONS)[keyof typeof TOOL_ACTIONS];
export const tileKey = (x: number, y: number) => `${x},${y}`;
export const FURROW_SPRITE = "nature-furrow";
export const STUMP_SPRITE = "nature-stump";
export const STUBBLE_SPRITE = "nature-stubble";
export const LOGS_SPRITE = "nature-logs";
export const STEMS_SPRITE = "nature-cut-stems";
export const THORNS_SPRITE = "nature-cut-thorns";
export const RUBBLE_SPRITE = "nature-rubble";
/** The generator names every boulder "rock"; the renderer picks the art. */
export const isRock = (sprite: string | undefined) =>
  sprite === "rock" || !!sprite?.startsWith("nature-rock");
/** Dry growth leaves grey sticks behind, green growth leaves sappy ones. */
const stemsFor = (sprite: string | undefined) =>
  sprite && /dry|thorn|sage|saguaro/.test(sprite)
    ? THORNS_SPRITE
    : STEMS_SPRITE;
/** The generated decoration as the player has left it. A furrow covers
 * whatever grew here, since the ground was cleared to dig it. */
export function editedDecoration(
  base: Decoration | undefined,
  edit: TileEdit | undefined,
  x: number,
  y: number,
): Decoration | undefined {
  if (!edit) return base;
  const at = { x, y, id: `decor-${x}-${y}`, solid: false };
  if (edit.dug) return { ...at, sprite: FURROW_SPRITE };
  if (edit.stage === "clear") return undefined;
  if (edit.stage === "logs") return { ...at, sprite: LOGS_SPRITE };
  if (edit.stage === "stump") return { ...at, sprite: STUMP_SPRITE };
  if (edit.stage === "rubble") return { ...at, sprite: RUBBLE_SPRITE };
  if (edit.stage === "stems") return { ...at, sprite: stemsFor(base?.sprite) };
  if (edit.cut && base) return { ...at, sprite: STUBBLE_SPRITE };
  return base;
}
const workedNames: Record<string, string> = {
  [RUBBLE_SPRITE]: "broken rock",
  [LOGS_SPRITE]: "fallen trunk",
  [STUMP_SPRITE]: "stump",
  [STEMS_SPRITE]: "cut stems",
  [THORNS_SPRITE]: "cut stems",
  [FURROW_SPRITE]: "turned earth",
  [STUBBLE_SPRITE]: "cut stubble",
};
/** What to call what is standing on a cell, in a sentence. */
export function plantName(sprite: string | undefined) {
  if (!sprite) return "it";
  return (
    workedNames[sprite] ??
    sprite
      .replace(/^(nature-understory|nature|ecology)-/, "")
      .replaceAll("-", " ")
  );
}
/** True for ground the player has worked rather than anything growing. */
export const isWorkedGround = (sprite: string | undefined) =>
  !!sprite && sprite in workedNames;
/** What one more axe blow here would do. Undefined means the axe has no
 * business with it. */
export function axeWork(
  sprite: string | undefined,
): "buck" | "clear" | "fell" | undefined {
  if (!sprite) return undefined;
  if (sprite === LOGS_SPRITE) return "buck";
  if (sprite === STEMS_SPRITE || sprite === THORNS_SPRITE) return "clear";
  return fellingSwings(sprite) ? "fell" : undefined;
}
/** What one more blow of a pick would do here. */
export function pickWork(
  sprite: string | undefined,
): "break" | "clear" | "grub" | undefined {
  if (!sprite) return undefined;
  if (isRock(sprite)) return "break";
  if (sprite === RUBBLE_SPRITE) return "clear";
  return sprite === STUMP_SPRITE ? "grub" : undefined;
}
/** Blows to break a boulder open. */
export const ROCK_BLOWS = 4;
/** Blows to work a stump out of the ground. */
export const STUMP_BLOWS = 3;
/** Firewood in a standing plant, by how big it is. */
export function woodYield(sprite: string | undefined) {
  return (
    { none: 0, grass: 0, shrub: 1, small: 2, medium: 3, large: 5 }[
      plantClass(sprite)
    ] ?? 0
  );
}
export { fellingSwings, plantClass };
