import type { CueKind } from "../core/combat";
import { CUE_BUBBLE, CUE_MARKS, glyphPixels, hex } from "../render/cue-marks";

/**
 * The same little bubble the world pops over someone's head, drawn in the
 * page so a portrait can show it too. A player who has learnt what the red
 * mark over a villager means should not have to learn it twice.
 *
 * The geometry is the Phaser one, moved so the tail's point is the origin:
 * an 11 x 15 box, the bubble on top and the tail hanging off its lower left.
 */
export function CueMark({ cue, size = 4 }: { cue: CueKind; size?: number }) {
  const mark = CUE_MARKS[cue];
  if (!mark) return null;
  const shell = hex(CUE_BUBBLE.shell);
  return (
    <svg
      className="cue-mark"
      width={11 * size}
      height={15 * size}
      viewBox="0 0 11 15"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <rect x="0" y="0" width="11" height="12" rx="3" fill={shell} />
      <path d="M2 11 L5 11 L1 15 Z" fill={shell} />
      <rect x="1" y="1" width="9" height="10" rx="2" fill={hex(CUE_BUBBLE.fill)} />
      <path d="M3 10 L5 10 L2 13 Z" fill={hex(CUE_BUBBLE.fill)} />
      {glyphPixels(mark.glyph).map(([c, r]) => (
        <rect
          key={`${c}-${r}`}
          x={3 + c}
          y={2 + r}
          width="1"
          height="1"
          fill={hex(mark.color)}
        />
      ))}
    </svg>
  );
}
