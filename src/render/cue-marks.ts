import type { CueKind } from "../core/combat";

/** 5x7 glyphs, one bit per pixel, rows top to bottom. */
export const CUE_GLYPHS = {
  bang: [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
  query: [0b01110, 0b10001, 0b00001, 0b00110, 0b00100, 0b00000, 0b00100],
  heart: [0b00000, 0b01010, 0b11111, 0b11111, 0b01110, 0b00100, 0b00000],
  vein: [0b10001, 0b01010, 0b00000, 0b00000, 0b00000, 0b01010, 0b10001],
  dots: [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b10101, 0b00000],
} as const;
export type CueGlyph = keyof typeof CUE_GLYPHS;

/**
 * The mark a cue puts over someone's head, and the bubble it sits in. Shared
 * so the portrait in a conversation can show the same thing the world shows:
 * a player who has learnt what the red mark means over a villager's head
 * should not have to learn it twice.
 */
export const CUE_MARKS: Partial<Record<CueKind, { glyph: CueGlyph; color: number }>> = {
  alarm: { glyph: "bang", color: 0xd9523f },
  question: { glyph: "query", color: 0x4a78b8 },
  anger: { glyph: "vein", color: 0xc23a2e },
  fury: { glyph: "vein", color: 0xc23a2e },
  warm: { glyph: "heart", color: 0xd9527a },
  refuse: { glyph: "dots", color: 0x5c6470 },
};
export const CUE_BUBBLE = { shell: 0x1a1410, fill: 0xfff4d6 };
export const hex = (value: number) => `#${value.toString(16).padStart(6, "0")}`;

/** Pixels of a glyph, as [column, row] pairs. */
export function glyphPixels(glyph: CueGlyph): [number, number][] {
  const out: [number, number][] = [];
  CUE_GLYPHS[glyph].forEach((row, r) => {
    for (let c = 0; c < 5; c++) if (row & (1 << (4 - c))) out.push([c, r]);
  });
  return out;
}
