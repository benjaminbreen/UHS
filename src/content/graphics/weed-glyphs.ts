/** Weeds for field margins: dry clumps in three tones with a dark base.
 * 0 clear, 1 shadow, 2 body, 3 light, 4 base earth. Anchored at the
 * bottom row's centre. */
export type WeedGlyph = readonly string[];

export const weedGlyphs: WeedGlyph[] = [
  // A dry grass clump, blades fanning out.
  [
    "000300030",
    "003002300",
    "020320320",
    "021322210",
    "002121200",
    "000121000",
    "000414000",
  ],
  // A low rounded bush.
  [
    "000000000",
    "000323000",
    "003232300",
    "023222320",
    "012221210",
    "001111100",
    "000444000",
  ],
  // A couple of tall stalks with seed heads.
  [
    "000030000",
    "000230030",
    "000120230",
    "030120120",
    "023012100",
    "001211100",
    "000141000",
  ],
  // Sprouting tuft, small.
  [
    "000000000",
    "000000000",
    "000030000",
    "003230300",
    "002122100",
    "000121000",
    "000414000",
  ],
];
export const WEED_W = 9;
export const WEED_H = 7;
