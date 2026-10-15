import type { CharacterAppearance } from "../../core/character";
import type { Material } from "../../content/characters/wardrobe/cloth";

/** How each fibre takes dye, against cotton: silk glows, wool and felt drink
 * the light, hemp and jute stay dull. */
const fibre: Record<Material, number> = {
  hide: 0.78,
  fur: 0.82,
  barkcloth: 0.82,
  felt: 0.86,
  wool: 0.92,
  linen: 0.94,
  hemp: 0.74,
  jute: 0.7,
  cotton: 1,
  ramie: 0.94,
  silk: 1.15,
  synthetic: 1.11,
};
const CLOTH_HATS = new Set(["headscarf", "veil", "hood", "turban", "wrap", "band"]);

function saturate(hex: string, k: number) {
  const v = parseInt(hex.slice(1), 16),
    rgb = [v >> 16, (v >> 8) & 255, v & 255],
    l = 0.3 * rgb[0] + 0.59 * rgb[1] + 0.11 * rgb[2];
  return `#${rgb.map((c) => Math.round(Math.max(0, Math.min(255, l + (c - l) * k))).toString(16).padStart(2, "0")).join("")}`;
}

/** The colours a look is painted in, resolved once so the sprite and the
 * portrait of one person agree on the hat, the under-layer and the cloth. */
export function clothColours(w: CharacterAppearance["wearing"]) {
  const q = w.quality ?? 0;
  return {
    top: saturate(w.color, fibre[w.material ?? "cotton"] + (q >= 2 ? 0.08 : q < 0 ? -0.15 : 0)),
    lower: w.lowerColor,
    trim: w.trim,
    inner: w.innerColor ?? w.trim,
    hat: w.headColor ?? (CLOTH_HATS.has(w.headwear) ? w.trim : w.lowerColor),
    cloak: w.cloakColor,
  };
}
