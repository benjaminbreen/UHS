import type { CharacterAppearance } from "../../core/character";
import type { CharacterPose } from "./poses";
import type { CarriedArt } from "./props";
import { drawCharacter as drawA } from "./draw";
import { drawCharacter as drawB } from "./v2/draw";
export type CharacterRenderer = (
  ctx: CanvasRenderingContext2D,
  a: CharacterAppearance,
  direction: number,
  pose: CharacterPose,
  frame: number,
  prop?: CarriedArt,
  /** Eight-way facing; renderers that only have four views ignore it. */
  facing?: number,
) => void;
export const rendererIds = ["a", "b"] as const;
export type RendererId = (typeof rendererIds)[number];
export const renderers: Record<
  RendererId,
  { label: string; draw: CharacterRenderer }
> = {
  a: { label: "A · legacy", draw: drawA },
  b: { label: "B · default", draw: drawB },
};
/** The renderer the game draws with. The lab can select either; everything
 * else should import `drawCharacter` from here rather than a variant directly,
 * so switching back is one line. */
export const defaultRenderer: RendererId = "b";
export const drawCharacter = renderers[defaultRenderer].draw;
