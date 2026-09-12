import { useEffect, useRef } from "react";
import { drawGlyph, GLYPH_SIZE, type GlyphId } from "../render/glyphs";

const palettes = {
  paramount: { edge: "#6a4a2c", base: "#d9b477", light: "#f4e0b4" },
  major: { edge: "#3f5a63", base: "#7fd3c4", light: "#cdf3ea" },
  local: { edge: "#7a3f56", base: "#e98bb0", light: "#ffd2e2" },
} as const;

/** Native pixels, scaled by whole numbers only. */
export function GlyphIcon({
  glyph,
  rank = "major",
  scale = 2,
}: {
  glyph: GlyphId;
  rank?: keyof typeof palettes;
  scale?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, GLYPH_SIZE, GLYPH_SIZE);
    drawGlyph(ctx, glyph, 0, 0, palettes[rank]);
  }, [glyph, rank]);
  return (
    <canvas
      ref={ref}
      width={GLYPH_SIZE}
      height={GLYPH_SIZE}
      aria-hidden="true"
      className="glyph"
      style={{ width: GLYPH_SIZE * scale, height: GLYPH_SIZE * scale }}
    />
  );
}
