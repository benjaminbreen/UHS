/** Shop lettering, drawn at runtime rather than baked into the atlas.
 *
 * The building art paints the board and publishes its rect as `signBand`; the
 * word goes on here. That is what lets one storefront sprite read MART in
 * Cheyenne, BOULANGER in Dakar and GUZMAN wherever a shop is named after the
 * family that keeps it.
 *
 * The font is the same 3x5 capital set the atlas used, so nothing about the
 * look changes — only where it is drawn. I and J are narrower than the rest,
 * which buys roughly one more letter on a small shopfront.
 */
const GLYPHS: Record<string, string[]> = {
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["011", "100", "101", "101", "011"],
  H: ["101", "101", "111", "101", "101"],
  I: ["1", "1", "1", "1", "1"],
  J: ["01", "01", "01", "01", "10"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["10001", "11011", "10101", "10101", "10101"],
  N: ["1001", "1101", "1011", "1001", "1001"],
  O: ["010", "101", "101", "101", "010"],
  P: ["110", "101", "110", "100", "100"],
  Q: ["010", "101", "101", "011", "001"],
  R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
  W: ["10101", "10101", "10101", "11011", "01010"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["110", "001", "010", "100", "111"],
  "3": ["110", "001", "010", "001", "110"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "110", "001", "110"],
  "6": ["011", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "110"],
  "&": ["010", "101", "011", "101", "011"],
  "'": ["1", "1", "0", "0", "0"],
  ".": ["0", "0", "0", "0", "1"],
  "-": ["000", "000", "111", "000", "000"],
  " ": ["00", "00", "00", "00", "00"],
};
export const SIGN_HEIGHT = 5;

/** Strip accents and anything the font cannot draw: the set is capitals, and
 * a sign that silently loses a letter is worse than one that says CAFE. */
export function signable(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9&'. -]/g, "");
}

export function signWidth(text: string): number {
  let width = 0;
  for (const char of signable(text)) {
    const glyph = GLYPHS[char];
    width += glyph ? glyph[0].length + 1 : 4;
  }
  return Math.max(0, width - 1);
}

/** The longest prefix of `words` that fits, else the shortest word given. */
export function fitSign(options: string[], budget: number): string | undefined {
  const fits = options.filter((word) => signWidth(word) <= budget);
  return fits.length ? fits[0] : undefined;
}

/**
 * A texture for one word in one ink. Keyed by both, so a street of fifty
 * GROCER signs in the same paint is one texture, not fifty.
 */
export function ensureSignTexture(
  scene: Phaser.Scene,
  text: string,
  ink: string,
): string | undefined {
  const word = signable(text);
  const width = signWidth(word);
  if (!width) return undefined;
  const key = `sign:${word}:${ink}`;
  if (scene.textures.exists(key)) return key;
  const canvas = scene.textures.createCanvas(key, width, SIGN_HEIGHT);
  if (!canvas) return undefined;
  const ctx = canvas.getContext();
  ctx.clearRect(0, 0, width, SIGN_HEIGHT);
  ctx.fillStyle = ink;
  let cursor = 0;
  for (const char of word) {
    const glyph = GLYPHS[char];
    if (!glyph) {
      cursor += 4;
      continue;
    }
    glyph.forEach((row, y) =>
      [...row].forEach((bit, x) => {
        if (bit === "1") ctx.fillRect(cursor + x, y, 1, 1);
      }),
    );
    cursor += glyph[0].length + 1;
  }
  canvas.refresh();
  return key;
}

/** Black or cream, whichever the board can carry. A dark ink on a dark board
 * is the one failure that makes a sign unreadable at 1x. */
export function inkFor(board: string): string {
  const hex = board.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) || 0);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#241c15" : "#f4e7c4";
}
