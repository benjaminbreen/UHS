import { random } from "../core/random";
import type { Position } from "../core/types";

/** Drawing follows the viewport, independently of player knowledge/interaction range.
 * Overscan covers sprites, relief lift, and the camera's in-flight movement. */
export function entityInView(
  pos: Position,
  center: Position,
  width: number,
  height: number,
  zoom: number,
) {
  return (
    pos.space === center.space &&
    Math.abs(pos.x - center.x) <= width / zoom / 32 + 8 &&
    Math.abs(pos.y - center.y) <= height / zoom / 32 + 12
  );
}

/** Presentation only: no additional simulation ticks or per-actor timers. */
export function npcMotion(
  seed: string,
  id: string,
  human: boolean,
  clock: number,
) {
  return {
    delay: Math.round(
      random(seed, id, "step-delay", clock) * (human ? 160 : 70),
    ),
    duration: Math.round(
      (human ? 420 : 180) + random(seed, id, "gait") * (human ? 260 : 100),
    ),
  };
}
