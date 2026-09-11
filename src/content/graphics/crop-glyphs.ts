/** Small ground-raster plants stamped on furrow ridges. The 16x24 standing
 * crop sprites still carry mid and tall crops once grown; these fill the
 * rows underneath and are all a low crop ever gets.
 *
 * Rows are screen-vertical, anchored so row 4 (0-based) sits on the ridge
 * centre. 0 clear, 1 leaf shadow, 2 leaf, 3 leaf light, 4 ripe accent. */
export type CropGlyph = readonly string[];

/** Two blades: a grain or fibre crop a few weeks up. */
export const bladeGlyphs: CropGlyph[] = [
  ["00300", "01300", "02320", "02220", "01210", "00100"],
  ["00030", "00230", "02230", "02220", "01210", "00100"],
  ["03000", "03200", "02220", "02220", "01210", "00100"],
];

/** A leaf rosette: beans, potato, squash, vegetables in the green. */
export const rosetteGlyphs: CropGlyph[] = [
  ["00000", "00300", "03230", "23232", "12221", "01110"],
  ["00000", "03000", "02330", "22322", "12221", "01110"],
  ["00000", "00030", "03320", "22322", "12221", "00110"],
];

/** The rosette carrying fruit or a bushier top. */
export const rosetteRipeGlyphs: CropGlyph[] = [
  ["00000", "00300", "03230", "24242", "12221", "01410"],
  ["00000", "03000", "02330", "42324", "12221", "01110"],
  ["00000", "00030", "03320", "22422", "14241", "00110"],
];

/** One sprout: a sown field a week on, sparse. */
export const sproutGlyphs: CropGlyph[] = [
  ["00000", "00000", "00000", "03200", "00100", "00000"],
  ["00000", "00000", "00000", "00230", "00100", "00000"],
];

export const GLYPH_W = 5;
export const GLYPH_H = 6;
/** Row of the glyph that sits on the ridge centre. */
export const GLYPH_BASE = 4;
