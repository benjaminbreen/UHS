/** Original 16-pixel transition tiles assembled from authored 8x8 silhouettes.
 * Four corner bits select shape, not a pixel-noise threshold. Rotations share
 * endpoints, so straight, diagonal, concave and convex tiles connect exactly. */
const corner = [
  "11110000",
  "11110000",
  "11100000",
  "11000000",
  "00000000",
  "00000000",
  "00000000",
  "00000000",
];
const straight = [
  "11111111",
  "11111111",
  "11111111",
  "11111111",
  "00000000",
  "00000000",
  "00000000",
  "00000000",
];
const saddle = [
  "11110000",
  "11110000",
  "11100000",
  "11000000",
  "00000011",
  "00000111",
  "00001111",
  "00001111",
];
const rotate = (a: string[]) =>
  Array.from({ length: 8 }, (_, y) =>
    Array.from({ length: 8 }, (_, x) => a[7 - x][y]).join(""),
  );
const rotateBits = (m: number) =>
  ((m & 1) << 1) | ((m & 2) << 2) | ((m & 8) >> 1) | ((m & 4) >> 2);
const templates: string[][] = Array.from({ length: 16 }, () =>
  Array(8).fill("00000000"),
);
templates[15] = Array(8).fill("11111111");
for (const [initial, shape] of [
  [1, corner],
  [3, straight],
  [9, saddle],
] as [number, string[]][]) {
  let bits = initial,
    rows = shape;
  for (let i = 0; i < 4; i++) {
    templates[bits] = rows;
    templates[15 - bits] = rows.map((r) =>
      r.replace(/[01]/g, (c) => (c === "0" ? "1" : "0")),
    );
    rows = rotate(rows);
    bits = rotateBits(bits);
  }
}
// Opposing occupied corners need a connected diagonal, not two isolated caps.
// These two cases are independent rather than complements of one another.
templates[9] = [
  "11110000",
  "11111000",
  "11111100",
  "11111110",
  "01111111",
  "00111111",
  "00011111",
  "00001111",
];
templates[6] = rotate(templates[9]);
export function transitionPixel(mask: number, x: number, y: number) {
  return templates[mask & 15][Math.floor(y / 2)][Math.floor(x / 2)] === "1";
}
// Small original edge-cluster stamp: airy interlocking pixels, not stippled noise.
const fringes = [
  [
    "00000000",
    "00111100",
    "00111000",
    "00000000",
    "00000000",
    "00000110",
    "00000100",
    "00000000",
  ],
  [
    "00000000",
    "00000000",
    "01100000",
    "00100000",
    "00000000",
    "00001100",
    "00011100",
    "00000000",
  ],
  [
    "00000000",
    "00000100",
    "00001100",
    "00000000",
    "00110000",
    "00111000",
    "00000000",
    "00000000",
  ],
  [
    "00000000",
    "00110000",
    "01110000",
    "00000000",
    "00000000",
    "00000110",
    "00000010",
    "00000000",
  ],
];
export function fringePixel(x: number, y: number, variant = 0) {
  return fringes[variant & 3][y & 7][x & 7] === "1";
}
export const terrainTransitionTiles = templates;

/** Compact original plants, anchored at their bottom row. 1 shadow, 2 body, 3 light. */
export const groundClumps = [
  ["0030000", "0020010", "1020020", "1220220", "0122210", "0012110", "0011100"],
  ["0003300", "0001200", "1001200", "2102201", "0222212", "0012210", "0011100"],
  ["0000000", "0300300", "1221220", "0122213", "1222221", "0112210", "0011100"],
  ["0030000", "0030030", "0020020", "1020220", "1222210", "0122100", "0011100"],
];
