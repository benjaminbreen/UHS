import Phaser from "phaser";
import { waterTexture, L, A } from "../flowing-water";
import { mix, type RGB, type SewerPalette } from "./palette";

const TAU = Math.PI * 2;
const SHEEN: RGB[] = [[124, 104, 160], [84, 150, 150], [176, 160, 92]];

/** One tile of foul water, seamless both ways and laid long along the
 * current: murk in a few close flat tones, streaks drawn out downstream,
 * brown silt clouds, a little oil and scum. */
function paintTile(p: SewerPalette, deep: boolean): Uint8ClampedArray {
  const [w0, w1, w2, w3] = p.water;
  const tones: RGB[] = deep
    ? [mix(w0, w1, 0.45), mix(w0, w1, 0.75), w1, mix(w1, w2, 0.3)]
    : [mix(w1, w2, 0.15), mix(w1, w2, 0.45), mix(w1, w2, 0.7), w2];
  const murk = mix(w2, p.silt[2], 0.5);
  const out = new Uint8ClampedArray(L * A * 4);
  const slicks = [[0.2, 0.3, 0.07], [0.68, 0.8, 0.05]];
  for (let y = 0; y < A; y++)
    for (let x = 0; x < L; x++) {
      const u = x / L, v = y / A;
      // Integer frequencies keep every term periodic over the tile.
      const warp = 0.05 * Math.sin(TAU * (v + 2 * u)) + 0.04 * Math.sin(TAU * (3 * u) + 1.3);
      const streak = Math.sin(TAU * (4 * v + warp + 0.15 * Math.sin(TAU * 2 * u)));
      const blob = Math.sin(TAU * (2 * u + warp)) * Math.cos(TAU * (v + warp)) * 0.7 + 0.3 * Math.sin(TAU * (3 * u + 2 * v) + 2.1);
      const f = blob * 0.6 + streak * 0.4;
      let col = tones[Math.max(0, Math.min(3, Math.floor((f + 1) * 2)))];
      const cloud = Math.sin(TAU * (u * 3 + warp * 3) + 0.7) * Math.sin(TAU * (v + 0.2 * Math.sin(TAU * u * 2)));
      if (!deep && cloud > 0.6) col = mix(col, murk, cloud > 0.82 ? 0.4 : 0.22);
      if (streak > 0.96 && blob > 0) col = mix(col, w3, 0.22);
      for (const [cx, cy, r] of slicks) {
        const dx = Math.min(Math.abs(u - cx), 1 - Math.abs(u - cx)) * (L / A) * 0.5, dy = Math.min(Math.abs(v - cy), 1 - Math.abs(v - cy));
        const d = Math.hypot(dx, dy) / r;
        if (d > 0.6 && d < 1) col = mix(col, SHEEN[Math.min(2, Math.floor((d - 0.6) / 0.14))], 0.2);
      }
      const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      if (h - Math.floor(h) < 0.01) col = mix(col, p.slime, 0.6);
      out.set([col[0], col[1], col[2], 255], (y * L + x) * 4);
    }
  return out;
}

/** The sewer's tile, laid along the current or turned to run across it. */
export function sewerTile(scene: Phaser.Scene, p: SewerPalette, name: string, deep: boolean, across: boolean) {
  return waterTexture(scene, `sewer-water-${name}-${deep ? "deep" : "wet"}`, across, () => paintTile(p, deep));
}
