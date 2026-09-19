import { dyes, type Cloth } from "../content/characters/wardrobe/cloth";
import { GARMENT_ICON, garmentArt, type IconArt } from "./garment-art";
import { itemArt, itemColors } from "./item-art";

export { GARMENT_ICON };

/** Item id to drawing. Two slots can want the same word — a head wrap is not
 * a wrapped cloth, a wide belt is not wide trousers — so the slot decides. */
const byId: Record<string, string> = {
  "headwear-wrap": "wrap_head",
  "belt-wide": "belt-wide",
  "belt-cord": "cord",
  "belt-sash": "sash",
  "belt-leather": "leather",
};
export function garmentIconFor(baseId: string): string | undefined {
  const mapped = byId[baseId];
  if (mapped) return mapped;
  const key = baseId.replace(
    /^(garment|headwear|leggings|footwear|belt)-/,
    "",
  );
  return key in garmentArt ? key : undefined;
}

/** An item's own drawing, for the things that are not clothes. */
export function itemIconFor(id: string): string | undefined {
  return id in itemArt ? id : undefined;
}

function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
}
function css([r, g, b]: readonly number[]) {
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
/** `f` above 1 lightens towards white, below 1 darkens towards black. */
function shift(hex: string, f: number) {
  const [r, g, b] = rgb(hex);
  return f >= 1
    ? ([r, g, b].map((c) => c + (255 - c) * (f - 1)) as number[])
    : ([r, g, b].map((c) => c * f) as number[]);
}
function mute([r, g, b]: readonly number[], amount: number) {
  const grey = (r + g + b) / 3;
  return [r, g, b].map((c) => c + (grey - c) * amount);
}

export type IconPalette = {
  outline: string;
  deep: string;
  seam: string;
  shade: string;
  base: string;
  light: string;
  trim: string;
  trimLight: string;
  leather: string;
  leatherLight: string;
  metal: string;
  metalLight: string;
};
/** The tones drawn off one colour, with `accent` for the trim channels. */
function tones(hex: string, accent: string, worn = 0, gold = false): IconPalette {
  const tone = (f: number) => css(mute(shift(hex, f), worn));
  const other = (f: number) => css(mute(shift(accent, f), worn));
  return {
    outline: tone(0.34),
    deep: tone(0.56),
    seam: tone(0.68),
    shade: tone(0.78),
    base: tone(worn ? 0.9 : 1),
    light: tone(1.25),
    trim: gold ? "#c8a24a" : other(1),
    trimLight: gold ? "#e0c078" : other(1.25),
    leather: "#6b4a2e",
    leatherLight: "#8a6440",
    metal: "#8d949c",
    metalLight: "#ccd2d8",
  };
}
/** An item's own two colours. Unknown things fall back to a dull stone. */
export function itemPalette(id: string): IconPalette {
  const [base, accent] = itemColors[id] ?? ["#9a9690", "#6e6b66"];
  return tones(base, accent);
}

/** The cloth's colour, plus the four tones drawn off it. Worn cloth loses its
 * colour before it loses its shape, so quality mutes rather than reshapes. */
export function garmentPalette(cloth?: Cloth): IconPalette {
  const hex = cloth ? dyes[cloth.dye].hex : "#b6ac97";
  // Fine work shows at the hem: gold thread on the best, a darker band of the
  // same cloth on everything else. Worn cloth loses its colour before it
  // loses its shape, so quality mutes rather than reshapes.
  const quality = cloth?.quality ?? 0;
  const p = tones(hex, hex, quality < 0 ? 0.45 : 0, quality >= 2);
  return quality >= 2 ? p : { ...p, trim: p.deep, trimLight: p.shade };
}

/** Fibre, drawn rather than named: a speckle for spun wool, a weave line for
 * bast, a sheen for silk, nothing for cotton, a flat gloss for polyester. */
function texture(
  material: Cloth["material"] | undefined,
  column: number,
  row: number,
): "light" | "shade" | undefined {
  switch (material) {
    case "wool":
    case "felt":
      return (column * 7 + row * 5) % 7 === 0 ? "shade" : undefined;
    case "linen":
    case "hemp":
    case "jute":
    case "ramie":
      return row % 4 === 0 ? "shade" : undefined;
    case "silk":
      return column === 9 || column === 10
        ? "light"
        : column === 15
          ? "shade"
          : undefined;
    case "synthetic":
      return row < 8 && (column + row) % 7 === 0 ? "light" : undefined;
    case "hide":
    case "fur":
      return (column * 3 + row * row) % 7 === 0
        ? "shade"
        : (column + row * 3) % 11 === 0
          ? "light"
          : undefined;
    case "barkcloth":
      return column % 4 === 0 ? "shade" : undefined;
    default:
      return undefined;
  }
}

/** One device pixel per art pixel; the caller scales by whole numbers. */
export function drawGarmentIcon(
  ctx: CanvasRenderingContext2D,
  icon: string,
  x: number,
  y: number,
  cloth?: Cloth,
) {
  const rows: IconArt | undefined = garmentArt[icon] ?? itemArt[icon];
  if (!rows) return;
  const p = garmentArt[icon] ? garmentPalette(cloth) : itemPalette(icon);
  const ink: Record<string, string> = {
    ".": p.outline,
    "#": p.deep,
    ":": p.seam,
    x: p.shade,
    O: p.light,
    t: p.trim,
    T: p.trimLight,
    k: p.leather,
    K: p.leatherLight,
    m: p.metal,
    M: p.metalLight,
  };
  for (let row = 0; row < rows.length; row++)
    for (let column = 0; column < rows[row].length; column++) {
      const cell = rows[row][column];
      if (cell === " ") continue;
      let color = ink[cell] ?? p.base;
      if (cell === "o" && garmentArt[icon]) {
        const t = texture(cloth?.material, column, row);
        if (t) color = t === "light" ? p.light : p.shade;
      }
      ctx.fillStyle = color;
      ctx.fillRect(x + column, y + row, 1, 1);
    }
}
