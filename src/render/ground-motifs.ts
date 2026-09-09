import { waterHash as hash } from "./water-style";

/** Original native-pixel material marks. Each stone has a lit face, side and
 * contact shadow; turf is a small blade cluster rather than independent dots. */
export const stoneMotifs = [
  ["00330000", "03222300", "12222210", "01221100", "00110000"],
  ["00033000", "00322230", "01222220", "00121110", "00011100"],
  ["00330000", "03223000", "02221000", "00111000", "00000000"],
  ["00033000", "03322300", "02222110", "01221100", "00110000"],
];
const turfMotifs = [
  ["00000000", "00300000", "00200300", "01200200", "00122100", "00011000"],
  ["00000000", "00000300", "03000200", "01202200", "00122100", "00011000"],
  ["00000000", "00000000", "00300300", "01201200", "00122100", "00011000"],
  ["00000000", "00300000", "00200000", "01203000", "00122100", "00011000"],
];
const earthMotifs = [
  ["00000000", "00000000", "00330000", "00221000", "00000000", "00000000"],
  ["00000000", "00000000", "00033000", "00021000", "00000000", "00000000"],
  ["00000000", "00000000", "00333000", "00022000", "00000000", "00000000"],
  ["00000000", "00000000", "00030000", "00321000", "00010000", "00000000"],
];
export type GroundMotif = "stone" | "turf" | "earth";
/** Placement varies whole motifs, with quiet cells between them. World anchors
 * preserve the pattern across chunk boundaries, including negative coordinates. */
export function groundMotif(kind: GroundMotif, wx: number, wy: number) {
  const stepX = kind === "stone" ? 13 : 16;
  const stepY = kind === "stone" ? 12 : 15;
  const bx = Math.floor(wx / stepX),
    by = Math.floor(wy / stepY);
  const colony = hash(Math.floor(bx / 4), Math.floor(by / 3), 403);
  const density =
    kind === "stone"
      ? colony > 0.5
        ? 0.84
        : 0.45
      : kind === "earth"
        ? 0.56
        : colony > 0.45
          ? 0.62
          : 0.23;
  if (hash(bx, by, 401) > density) return 0;
  const x = wx - bx * stepX - 1 - Math.floor(hash(bx, by, 405) * (stepX - 9));
  const y = wy - by * stepY - 1 - Math.floor(hash(bx, by, 407) * (stepY - 7));
  const glyphs =
    kind === "stone" ? stoneMotifs : kind === "turf" ? turfMotifs : earthMotifs;
  const glyph = glyphs[Math.floor(hash(bx, by, 409) * glyphs.length)];
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
