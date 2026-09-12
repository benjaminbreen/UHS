import { coreGlyphs } from "./core";
import { householdGlyphs } from "./household";
import { livingGlyphs } from "./living";
import { personGlyphs } from "./person";
import { sacredGlyphs } from "./sacred";
import { skyLandGlyphs } from "./sky-land";

/** Eleven-pixel glyphs for the powers people address. One shared set, matched
 * by what a power is for, because two thousand of them cannot each have art.
 * `.` contour, `o` body, `O` highlight, space empty. */
export const glyphs: Record<string, string[]> = {
  ...coreGlyphs,
  ...skyLandGlyphs,
  ...livingGlyphs,
  ...householdGlyphs,
  ...sacredGlyphs,
  ...personGlyphs,
};
export type GlyphId = string;
export const glyphIds = Object.keys(glyphs);
export const GLYPH_SIZE = 11;

/** Draws at one device pixel per art pixel; the caller scales with CSS. */
export function drawGlyph(
  ctx: CanvasRenderingContext2D,
  id: GlyphId,
  x: number,
  y: number,
  palette: { edge: string; base: string; light: string },
) {
  const rows = glyphs[id];
  if (!rows) return;
  for (let row = 0; row < rows.length; row++)
    for (let column = 0; column < rows[row].length; column++) {
      const cell = rows[row][column];
      if (cell === " ") continue;
      ctx.fillStyle =
        cell === "."
          ? palette.edge
          : cell === "O"
            ? palette.light
            : palette.base;
      ctx.fillRect(x + column, y + row, 1, 1);
    }
}
