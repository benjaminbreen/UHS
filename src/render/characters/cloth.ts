import type { CharacterAppearance } from "../../core/character";
import type { Material } from "../../content/characters/wardrobe/cloth";
import { mix } from "./pixels";
import { luma } from "./v2/pixels";

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
  const n = [...(w.color + w.trim)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 3);
  const pick = (list: readonly string[], salt: number) => list[(n + salt) % list.length];
  // Metal helmets, powdered wigs, glass visors and straw cones keep their own colour.
  const hat = w.headwear === "helmet" ? "#8e9497" : w.headwear === "wig" ? "#e4e0d8" : w.headwear === "visor" ? "#c8d8e0"
    : w.headwear === "conical" ? (w.headColor ?? "#c9a45c")
    : w.headColor ?? (CLOTH_HATS.has(w.headwear) ? w.trim : w.lowerColor);
  return {
    top: saturate(w.color, fibre[w.material ?? "cotton"] + (q >= 2 ? 0.08 : q < 0 ? -0.15 : 0)),
    lower: w.lowerColor,
    trim: w.trim,
    inner: w.innerColor ?? w.trim,
    hat,
    cloak: w.cloakColor,
    // Figured waistcoats in the silks of the day; plain ones a shade off the breeches.
    vest: w.waistcoat === "figured" ? pick(["#8e2234", "#c09a3a", "#2c6448", "#e2d6bc", "#34407e"], 5) : mix(w.lowerColor, "#2a2228", 0.25),
    shawl: pick(["#6a2e4a", "#2e4a5e", "#8a3a28", "#4a5a34", "#d8c8a8", "#3a3040"], 6),
    // A hat's trim: a dark ribbon band, a pale cockade, or a white, black or dyed feather.
    plume: w.hatTrim === "ribbon" ? (luma(hat) < 0.3 ? "#6a2a34" : "#2a2630") : w.hatTrim === "cockade" ? "#ece6d6"
      : pick(["#f2eee4", "#2a2630", "#b8342e", "#3a5aa0"], 3),
  };
}
