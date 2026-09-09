import { waterHash as hash } from "./water-style";

/** Original native-pixel material marks. Each stone has a lit face, side and
 * contact shadow; turf is a small blade cluster rather than independent dots. */
export const stoneMotifs = [
  ["00330000", "03222300", "12222210", "01221100", "00110000"],
  ["00033000", "00322230", "01222220", "00121110", "00011100"],
  ["00330000", "03223000", "02221000", "00111000", "00000000"],
  ["00033000", "03322300", "02222110", "01221100", "00110000"],
];
export type GroundMotifOverrides = {
  turf?: readonly string[][];
  ticks?: readonly string[][];
};
// One well-drawn five-blade tuft, mirrored for variety: 1 shaded left edge
// of each blade, 2 blade body, 3 highlight up the centre blade. Which of the
// three tone levels it is drawn in is chosen per tuft by the raster.
const turfMotifs = [
  [
    "000010000",
    "000013000",
    "100013001",
    "120013021",
    "012113121",
    "012213221",
    "001221221",
    "000122210",
  ],
  [
    "000010000",
    "000310000",
    "100310001",
    "120310021",
    "121311210",
    "122312210",
    "122122100",
    "012221000",
  ],
];
// Round pebbles: 1 shadow, 2 body, 3 lit top.
const pebbleMotifs = [
  ["0330", "3221", "0110"],
  ["0300", "3210", "0100"],
  ["03300", "32221", "01110"],
];
const earthMotifs = [
  ["00000000", "00000000", "00330000", "00221000", "00000000", "00000000"],
  ["00000000", "00000000", "00033000", "00021000", "00000000", "00000000"],
  ["00000000", "00000000", "00333000", "00022000", "00000000", "00000000"],
  ["00000000", "00000000", "00030000", "00321000", "00010000", "00000000"],
];
// Short verge marks mix a blade, a small soil fleck and a quiet highlight.
const swardMotifs = [
  ["00000", "00100", "01200", "01100", "00100"],
  ["00000", "01000", "01200", "01100", "00100"],
  ["00000", "00100", "02200", "01130", "00100"],
  ["00000", "01010", "01200", "01100", "00100"],
];
export type GroundMotif = "stone" | "turf" | "earth" | "pebble" | "sward";
export const TURF_STEP = [24, 20] as const;
/** Placement varies whole motifs, with quiet cells between them. World anchors
 * preserve the pattern across chunk boundaries, including negative coordinates. */
export function groundMotif(
  kind: GroundMotif,
  wx: number,
  wy: number,
  overrides?: GroundMotifOverrides,
) {
  const stepX =
    kind === "stone"
      ? 13
      : kind === "turf"
        ? TURF_STEP[0]
        : kind === "sward"
          ? 14
        : kind === "pebble"
          ? 15
          : 16;
  const stepY =
    kind === "stone"
      ? 12
      : kind === "turf"
        ? TURF_STEP[1]
        : kind === "sward"
          ? 12
        : kind === "pebble"
          ? 14
          : 15;
  const by = Math.floor(wy / stepY);
  // Turf sits on a staggered lattice: odd rows shift half a step.
  const shift = kind === "turf" && by & 1 ? stepX / 2 : 0;
  const bx = Math.floor((wx - shift) / stepX);
  const colony = hash(Math.floor(bx / 4), Math.floor(by / 3), 403);
  const density =
    kind === "stone"
      ? colony > 0.5
        ? 0.84
        : 0.45
      : kind === "earth"
        ? 0.56
      : kind === "pebble"
          ? colony > 0.5
            ? 0.6
            : 0.3
          : kind === "sward"
            ? colony > 0.42
              ? 0.45
              : 0.25
          : colony > 0.2
            ? 0.85
            : 0.5;
  if (hash(bx, by, 401) > density) return 0;
  const glyphs =
    kind === "stone"
      ? stoneMotifs
      : kind === "turf"
      ? (overrides?.turf?.length ? overrides.turf : turfMotifs)
      : kind === "pebble"
        ? pebbleMotifs
        : kind === "sward"
          ? swardMotifs
        : earthMotifs;
  const glyph = glyphs[Math.floor(hash(bx, by, 409) * glyphs.length)];
  const slackX = stepX - glyph[0].length + 1,
    slackY = stepY - glyph.length + 1;
  // Turf keeps to the lattice with a two-pixel wobble; other marks roam.
  const ox =
    kind === "turf"
      ? Math.floor(slackX / 2) + Math.floor(hash(bx, by, 405) * 5) - 2
      : Math.floor(hash(bx, by, 405) * slackX);
  const oy =
    kind === "turf"
      ? Math.floor(slackY / 2) + Math.floor(hash(bx, by, 407) * 5) - 2
      : Math.floor(hash(bx, by, 407) * slackY);
  const x = wx - shift - bx * stepX - ox;
  const y = wy - by * stepY - oy;
  return Number(glyph[y]?.[x] ?? 0);
}

// Low-contrast supporting marks form interlocking patches beneath the larger
// motifs. Whole 2–4px shapes repeat with varied offsets; no independent pixel snow.
const grainTiles = [
  [
    "00022000",
    "00222100",
    "02221000",
    "00200000",
    "00000110",
    "11001100",
    "12200000",
    "02000000",
  ],
  [
    "01100000",
    "01220000",
    "00222000",
    "00000010",
    "00000122",
    "02200012",
    "02210000",
    "00100000",
  ],
  [
    "00000000",
    "00122000",
    "01222000",
    "01100000",
    "00000022",
    "22000122",
    "21000010",
    "00000000",
  ],
  [
    "02200000",
    "02210000",
    "00100000",
    "00001100",
    "00012220",
    "00002200",
    "11000000",
    "12000000",
  ],
];
export function materialGrain(wx: number, wy: number) {
  const bx = Math.floor(wx / 8),
    by = Math.floor(wy / 8);
  const choice = Math.floor(hash(bx, by, 423) * 32);
  let x = wx - bx * 8,
    y = wy - by * 8;
  if (choice & 4) x = 7 - x;
  if (choice & 8) y = 7 - y;
  if (choice & 16) [x, y] = [y, x];
  return Number(grainTiles[choice & 3][y][x]);
}

// Faint lighter strokes on a regular 8x8 lattice under the dark tufts; the
// two variants alternate by cell so the lattice never reads as a grid.
const tickTiles = [
  [
    "00000000",
    "00100000",
    "01000000",
    "00000000",
    "00000010",
    "00000100",
    "00000000",
    "00000000",
  ],
  [
    "00000000",
    "00000100",
    "00001000",
    "00000000",
    "00100000",
    "01000000",
    "00000000",
    "00000000",
  ],
];
export function turfTick(
  wx: number,
  wy: number,
  overrides?: GroundMotifOverrides,
) {
  const bx = Math.floor(wx / 8),
    by = Math.floor(wy / 8);
  const v = (bx + by + Math.floor(hash(bx, by, 431) * 2)) & 1;
  const tiles = overrides?.ticks?.length ? overrides.ticks : tickTiles;
  const tile = tiles[v % tiles.length];
  return tile[((wy % 8) + 8) % 8]?.[((wx % 8) + 8) % 8] === "1";
}
// Regular sparse dark speckle for bare earth.
export function earthSpeckle(wx: number, wy: number) {
  const x = ((wx % 8) + 8) % 8,
    y = ((wy % 8) + 8) % 8;
  return (x === 2 && y === 1) || (x === 6 && y === 5) || (x === 4 && y === 7);
}

/** Small original blade clusters for path margins. Anchored at their bottom
 * row so a tuft roots on the verge and leans out over the worn ground.
 * 1 blade shadow, 2 blade body, 3 lit tip. */
export const edgeTufts = [
  ["003000", "002000", "102000", "122100", "011100"],
  ["030000", "020300", "020200", "122100", "011100"],
  ["000300", "003200", "102200", "122100", "011100"],
  ["300030", "202020", "022200", "012100", "001100"],
  ["000300", "000200", "301200", "221210", "011100"],
  ["030000", "020000", "020103", "122202", "011110"],
];
