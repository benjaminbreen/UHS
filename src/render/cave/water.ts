import Phaser from "phaser";
import { A, L, waterTexture, type FloatSprite } from "../flowing-water";
import { mix, type CavePalette, type RGB } from "./palette";

const TAU = Math.PI * 2;

/** One tile of clear cave water, the same however deep: the mask over it and
 * the bed under it carry the depth. Seamless both ways and
 * laid long along the current: a few close tones in slow bands, and the bright net that light
 * throws through rippled water onto itself. */
function paintTile(p: CavePalette): Uint8ClampedArray {
  const [, w1, w2, w3] = p.water;
  const tones: RGB[] = [mix(w1, w2, 0.25), mix(w1, w2, 0.55), w2, mix(w2, w3, 0.2)];
  const out = new Uint8ClampedArray(L * A * 4);
  for (let y = 0; y < A; y++)
    for (let x = 0; x < L; x++) {
      const u = x / L, v = y / A;
      // Integer frequencies keep every term periodic over the tile.
      const warp = 0.06 * Math.sin(TAU * (v + 2 * u)) + 0.04 * Math.sin(TAU * 3 * u + 1.1);
      const band = Math.sin(TAU * (2 * u + warp)) * Math.cos(TAU * (v + warp)) * 0.6 + 0.4 * Math.sin(TAU * (u + 2 * v) + 0.8);
      let col = tones[Math.max(0, Math.min(3, Math.floor((band + 1) * 2)))];
      const a = Math.sin(TAU * (4 * u + 0.35 * Math.sin(TAU * (2 * v + u))));
      const b = Math.sin(TAU * (2 * v + 0.3 * Math.sin(TAU * (3 * u - v)) + 0.25));
      const net = Math.abs(a + b);
      if (net < 0.1) col = mix(col, w3, 0.45);
      else if (net < 0.22) col = mix(col, w3, 0.2);
      const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      if (h - Math.floor(h) < 0.006) col = mix(col, [240, 244, 236], 0.55);
      out.set([col[0], col[1], col[2], 255], (y * L + x) * 4);
    }
  return out;
}

export function caveTile(scene: Phaser.Scene, p: CavePalette, kind: string, across: boolean) {
  return waterTexture(scene, `cave-water-${kind}`, across, () => paintTile(p));
}

/** What a cave stream carries in from outside, and what it washes out of the cave. */
export const caveFloats: Record<string, FloatSprite> = {
  leaf: {
    weight: 4,
    ink: { ".": "#3a2a12", o: "#a86a24", O: "#d89a40", y: "#e8c060" },
    rows: ["   ...  ", " ..OOy. ", ".oOOOO..", " .oooo. ", "  ...   "],
  },
  green: {
    weight: 2,
    ink: { ".": "#1e3414", g: "#4a7a2a", G: "#7aac44" },
    rows: ["  ...   ", " .GGG.. ", ".gGGGGg.", " ..ggg. ", "   ...  "],
  },
  twig: {
    weight: 3,
    ink: { ".": "#2a1c10", k: "#6a4a2a", K: "#9a7048" },
    rows: ["       .. ", ".......k. ", ".kkKkkkk...", "..........  "],
  },
  foam: {
    weight: 4,
    ink: { ".": "#7a9a9c", f: "#cfe2de", F: "#f4fbf6" },
    rows: [" .. ..  ", ".FF.Ff. ", ".fFFff. ", " .. ..  "],
  },
  bone: {
    weight: 0.6,
    ink: { ".": "#5a5040", b: "#d8ccae", B: "#f2ead2" },
    rows: [".. ....  ..", ".B.bBBbb.B.", " .bbbbbbb. ", ".b.......b.", "..       .."],
  },
  feather: {
    weight: 0.8,
    ink: { ".": "#3a3a40", w: "#b8b8c0", W: "#e8e8ee" },
    rows: ["      ..  ", "  ...WW.  ", ".wwwWWw.  ", " ....ww.  ", "     ..   "],
  },
};
