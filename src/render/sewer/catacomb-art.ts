import { css, ell, r, shadow, IRON, WOOD } from "./art";
import type { SewerPalette } from "./palette";

type Ctx = CanvasRenderingContext2D;
const MARBLE = ["#6e675a", "#a8a092", "#d2cabb", "#ece6d8", "#fbf8f0"];
const TERRA = ["#4e2414", "#8a4a2e", "#b4623c", "#d88a5c"];
const BONE = ["#4a4034", "#bca986", "#dccca6", "#f2e8cc"];
const BRONZE = ["#4a3a1c", "#8a6a30", "#c8a050"];
const SKIN = "#d8a084", RED = "#a8402c", GREEN = "#5a7a48", OCHRE = "#c8a060", GOLD = "#f0c858";

const h = (a: number, b: number) => {
  const n = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263);
  return ((Math.imul(n ^ (n >>> 13), 1274126177) >>> 0) % 1000) / 1000;
};

/** The catacombs' things: graves and their paintings on the walls, what was
 * left on the floor. Same contract as `paintSewerObject`; false when the art is
 * not a catacomb's. Wall art takes (x, y) as the wall cell over the floor. */
export function paintCatacombObject(g: Ctx, art: string, x: number, y: number, p: SewerPalette, v: number, emptied: boolean): boolean {
  const cx = x + 8, by = y + 15;
  const F = p.face.map((c) => css(c)), lit = css(p.face[3]), P = (p.plaster ?? p.face).map((c) => css(c));
  switch (art) {
    case "arcosolium":
    case "martyr-arch": {
      // An arch cut over a grave: a thick lit rim, the painted lunette set back in shadow, the grave's marble front below.
      const martyr = art === "martyr-arch", spring = y - 6, sill = y + 3;
      const inside = (dx: number, yy: number, R: number, H: number) => (yy >= spring ? Math.abs(dx + 0.5) <= R : ((dx + 0.5) / R) ** 2 + ((spring - yy) / H) ** 2 <= 1);
      for (let yy = y - 22; yy <= by; yy++)
        for (let dx = -18; dx <= 17; dx++) {
          if (!inside(dx, yy, 18, 16)) continue;
          let c: string;
          if (!inside(dx, yy, 14, 12)) {
            const edge = !inside(dx, yy, 17, 15);
            c = edge ? F[0] : dx < 0 && yy < spring + 4 ? lit : dx < -13 || yy < spring ? F[2] : F[1];
          } else if (yy < sill) {
            const deep = !inside(dx, yy - 2, 14, 12) || !inside(dx + 2, yy, 14, 12);
            c = deep ? P[0] : P[h(dx >> 2, yy >> 2) < 0.15 ? 2 : 1];
            if (inside(dx, yy, 14, 12) && !inside(dx, yy, 12, 10) && !deep) c = martyr ? P[1] : RED;
            if (yy > sill - 5 && h(dx, yy * 3) < 0.25) c = OCHRE;
          } else {
            c = yy === sill ? MARBLE[4] : yy === sill + 1 ? MARBLE[3] : yy >= by - 1 ? MARBLE[0] : (dx + 18) % 12 === 0 ? MARBLE[1] : MARBLE[2];
          }
          r(g, c, cx + dx, yy);
        }
      if (martyr) {
        // Pilgrims' names scratched all over the plaster, and Damasus's square letters on the slab.
        for (let k = 0; k < 40; k++) {
          const sx = cx - 11 + Math.floor(h(k, 1) * 22), sy = y - 16 + Math.floor(h(k, 2) * 18);
          if (((sx - cx + 0.5) / 12) ** 2 + ((spring - sy) / 10) ** 2 > 1 && sy < spring) continue;
          r(g, F[1], sx, sy, 1 + Math.floor(h(k, 3) * 3), 1);
          if (h(k, 4) < 0.3) r(g, F[1], sx, sy - 1, 1, 3);
        }
        for (const row of [sill + 4, sill + 8]) for (let k = -12; k < 12; k += 2) if (h(k >> 2, row) < 0.8 && (k + 14) % 10 !== 0) r(g, "#4a4440", cx + k, row, 1, 3), h(k, row) < 0.4 && r(g, "#4a4440", cx + k, row, 2, 1);
        r(g, "#5a2a5a", cx - 2, sill + 10, 4, 2);
        return true;
      }
      // An orant between two trees: a woman in a red-ochre dress with her arms raised in prayer.
      const fy = y - 14;
      r(g, "#6a4430", cx - 2, fy, 4, 2), r(g, SKIN, cx - 2, fy + 2, 4, 3), r(g, "#3a2a20", cx - 1, fy + 3, 1, 1), r(g, "#3a2a20", cx + 1, fy + 3, 1, 1);
      r(g, OCHRE, cx - 3, fy + 5, 7, 2), r(g, RED, cx - 3, fy + 7, 7, 8), r(g, "#7a2a1c", cx + 2, fy + 7, 2, 8), r(g, OCHRE, cx - 1, fy + 7, 1, 8);
      for (const [ax, hx, sx] of [[cx - 5, cx - 6, cx - 5], [cx + 4, cx + 5, cx + 3]]) r(g, SKIN, ax, fy + 1, 1, 4), r(g, SKIN, hx, fy - 1, 1, 2), r(g, RED, sx, fy + 5, 2, 2);
      for (const tx of [cx - 10, cx + 9]) {
        r(g, "#6a4a2a", tx, fy + 6, 1, 9);
        ell(g, GREEN, tx, fy + 4, 2, 3);
        r(g, "#7a9a5a", tx - 1, fy + 2, 2, 1);
      }
      return true;
    }
    case "loculus":
    case "open-loculus": {
      // A grave shelf the length of a body, its lip catching the light.
      const l = cx - 12, t = y - 6, w = 24, hh = 9, open = art === "open-loculus";
      r(g, F[0], l - 1, t - 1, w + 2, 1);
      r(g, lit, l - 1, t + hh, w + 2, 1), r(g, F[1], l - 1, t + hh + 1, w + 2, 1);
      if (open) {
        r(g, "#0e0a08", l, t, w, hh), r(g, "#241a14", l, t + 4, w, hh - 4);
        r(g, BONE[2], l + 4, t + 7, 9, 1), r(g, BONE[3], l + 3, t + 6, 2, 2), r(g, BONE[3], l + 12, t + 6, 2, 2);
        r(g, BONE[1], l + 15, t + 7, 6, 1), r(g, BONE[2], l + 2, t + 8, 4, 1);
        for (const [sx, sy, sw] of [[l, t, 3], [l + 19, t + 1, 5], [l, t + 6, 2]]) r(g, TERRA[2], sx, sy, sw, 2), r(g, TERRA[3], sx, sy, sw, 1);
        return true;
      }
      for (let k = 0; k < 3; k++) {
        const tx = l + k * 8;
        r(g, TERRA[k === 1 ? 1 : 2], tx, t, 8, hh), r(g, TERRA[3], tx, t, 8, 1), r(g, TERRA[0], tx + 7, t + 1, 1, hh - 1);
      }
      r(g, "#d8ccb0", l, t + 4, w, 1);
      // What the family pressed into the wet mortar to know the grave again: a gold glass, a couple of coins.
      if (!emptied) {
        ell(g, "#2a3a6a", l + 6, t + 4, 2, 2), r(g, GOLD, l + 5, t + 3, 3, 3), r(g, "#fff2b0", l + 5, t + 3, 1, 1);
        ell(g, BRONZE[1], l + 17, t + 4, 1, 1), r(g, BRONZE[2], l + 17, t + 3, 1, 1), ell(g, BRONZE[1], l + 20, t + 5, 1, 1);
      } else r(g, "#2a1c14", l + 5, t + 3, 3, 3), r(g, "#2a1c14", l + 17, t + 3, 2, 2);
      return true;
    }
    case "epitaph": {
      // A marble slab held by four bronze pins: a name in red letters, a dove with a branch, the Chi-Rho.
      const l = cx - 11, t = y - 16, w = 22, hh = 14;
      r(g, "rgba(10,6,16,0.4)", l + 1, t + hh, w, 1);
      r(g, MARBLE[3], l, t, w, hh), r(g, MARBLE[4], l, t, w, 1), r(g, MARBLE[4], l, t, 1, hh), r(g, MARBLE[1], l + w - 1, t + 1, 1, hh - 1), r(g, MARBLE[1], l + 1, t + hh - 1, w - 1, 1);
      for (const [px, py] of [[l + 1, t + 1], [l + w - 3, t + 1], [l + 1, t + hh - 3], [l + w - 3, t + hh - 3]]) r(g, BRONZE[1], px, py, 2, 2), r(g, BRONZE[2], px, py, 1, 1);
      for (let k = l + 4; k < l + w - 4; k += 2) if (h(k, 1) < 0.8) r(g, RED, k, t + 3, 1, 2);
      for (let k = l + 5; k < l + w - 6; k += 2) if (h(k, 2) < 0.7) r(g, RED, k, t + 6, 1, 1);
      r(g, "#f8f4ea", l + 4, t + 9, 4, 2), r(g, "#f8f4ea", l + 7, t + 8, 2, 2), r(g, "#3a3430", l + 8, t + 8, 1, 1), r(g, GREEN, l + 9, t + 9, 3, 1);
      r(g, RED, l + 15, t + 8, 1, 4), r(g, RED, l + 14, t + 9, 3, 1), r(g, RED, l + 16, t + 8, 1, 1), r(g, RED, l + 14, t + 11, 1, 1), r(g, RED, l + 16, t + 11, 1, 1);
      return true;
    }
    case "lamp-niche":
    case "soot-niche": {
      // A little arched niche at head height, with a clay lamp in it; soot fanning up the rock above.
      const l = cx - 5, t = y - 16, burning = art === "lamp-niche";
      for (let k = 0; k < 10; k++) r(g, `rgba(14,10,8,${(burning ? 0.3 : 0.45) - k * 0.03})`, cx - 2 - (k >> 1), t - 1 - k, 4 + k, 1);
      for (let j = 0; j < 12; j++) {
        const half = j < 3 ? [2, 4, 5][j] : 5;
        r(g, burning ? (j < 4 ? "#3a2014" : "#5a3018") : "#120c0a", cx - half, t + j, half * 2, 1);
      }
      r(g, F[0], l - 1, t + 12, 12, 1), r(g, lit, l - 1, t + 12, 12, 1), r(g, F[1], l - 1, t + 13, 12, 1);
      r(g, TERRA[2], cx - 3, t + 9, 6, 3), r(g, TERRA[3], cx - 3, t + 9, 6, 1), r(g, TERRA[1], cx + 3, t + 10, 2, 1);
      if (burning && !emptied) {
        r(g, "#ffb040", cx + 3, t + 7, 1, 3), r(g, "#fff2b0", cx + 3, t + 8, 1, 2), r(g, "#ff8020", cx + 4, t + 8, 1, 1);
        r(g, "rgba(255,170,80,0.35)", cx - 4, t + 4, 9, 5);
      }
      return true;
    }
    case "scratchings": {
      // A patch of plaster scored all over: names, crosses, a palm, a boat.
      const l = cx - 15, t = y - 20;
      for (let j = 0; j < 20; j++) {
        const ragged = Math.floor(h(j, 7) * 3);
        r(g, P[1], l + ragged, t + j, 30 - ragged - Math.floor(h(j, 8) * 3), 1);
      }
      for (let k = 0; k < 34; k++) {
        const sx = l + 3 + Math.floor(h(k, 11) * 24), sy = t + 2 + Math.floor(h(k, 12) * 16);
        r(g, P[0], sx, sy, 1 + Math.floor(h(k, 13) * 4), 1);
        if (h(k, 14) < 0.35) r(g, P[0], sx + 1, sy - 1, 1, 3);
      }
      r(g, "#6a5848", l + 20, t + 4, 1, 7), r(g, "#6a5848", l + 18, t + 6, 5, 1), r(g, "#6a5848", l + 21, t + 4, 1, 1);
      r(g, "#6a5848", l + 5, t + 14, 8, 1), r(g, "#6a5848", l + 6, t + 15, 6, 1), r(g, "#6a5848", l + 9, t + 10, 1, 4);
      for (let k = 0; k < 30; k++) if (h(k, 15) < 0.3) r(g, OCHRE, l + k, t + 17 + Math.floor(h(k, 16) * 3), 1, 1);
      return true;
    }
    case "tablet": {
      // A stone tablet framed in black, set into the bones.
      const l = cx - 11, t = y - 22, w = 22, hh = 16;
      r(g, "rgba(10,6,16,0.45)", l + 1, t + 1, w, hh);
      r(g, "#1c1a18", l, t, w, hh), r(g, "#efe8d4", l + 2, t + 2, w - 4, hh - 4), r(g, "#fbf6e8", l + 2, t + 2, w - 4, 1);
      r(g, "#1c1a18", cx - 1, t + 3, 1, 3), r(g, "#1c1a18", cx - 2, t + 4, 3, 1);
      for (const row of [t + 7, t + 9, t + 11]) for (let k = l + 4; k < l + w - 4; k += 2) if (h(k, row) < 0.75) r(g, "#2a2622", k, row, 1, 1);
      return true;
    }
    case "street-mark": {
      // The quarry inspectors' mark: a street name and a date cut in a panel, and the black guide line along the roof.
      r(g, "#141210", x - 16, y - 23, 48, 2);
      r(g, "#141210", x + 26, y - 25, 1, 6), r(g, "#141210", x + 27, y - 24, 1, 4), r(g, "#141210", x + 28, y - 23, 1, 2);
      const l = cx - 12, t = y - 14;
      r(g, F[0], l, t, 24, 10), r(g, F[3], l + 1, t + 1, 22, 8), r(g, css(p.face[2]), l + 1, t + 8, 22, 1);
      for (let k = l + 3; k < l + 21; k += 2) if (h(k, 3) < 0.85) r(g, "#2a2620", k, t + 3, 1, 2);
      for (let k = l + 7; k < l + 17; k += 2) r(g, "#2a2620", k, t + 6, 1, 1);
      return true;
    }
    case "sarcophagus": {
      // White marble: a lid seen from above, the front fluted in S-curves either side of a round portrait of a couple.
      shadow(g, cx, by, 21, 3);
      const l = cx - 20, w = 40, top = by - 28;
      r(g, MARBLE[3], l, top, w, 8), r(g, MARBLE[4], l, top, w, 1), r(g, MARBLE[2], l, top + 4, w, 1);
      for (const ex of [l, l + w - 4]) r(g, MARBLE[4], ex, top - 2, 4, 3), r(g, MARBLE[2], ex, top + 1, 4, 1);
      r(g, MARBLE[1], l, top + 8, w, 1);
      for (let j = 0; j < 18; j++) {
        const yy = top + 9 + j;
        r(g, MARBLE[2], l, yy, w, 1);
        for (let k = 0; k < w; k++) {
          const left = k < w / 2, bend = Math.round(Math.sin((j / 17) * Math.PI) * 3) * (left ? 1 : -1);
          if (k > 4 && k < w - 5 && Math.abs(k - w / 2) > 7 && (k + bend) % 3 === 0) r(g, MARBLE[1], l + k, yy, 1, 1);
        }
      }
      r(g, MARBLE[3], l, top + 9, 4, 18), r(g, MARBLE[3], l + w - 4, top + 9, 4, 18), r(g, MARBLE[1], l + w - 1, top + 9, 1, 18);
      ell(g, MARBLE[1], cx, top + 17, 6, 6), ell(g, MARBLE[3], cx, top + 17, 5, 5);
      r(g, MARBLE[2], cx - 4, top + 14, 3, 3), r(g, MARBLE[2], cx + 1, top + 14, 3, 3), r(g, MARBLE[1], cx - 4, top + 17, 8, 4);
      r(g, MARBLE[0], l, by - 1, w, 1);
      return true;
    }
    case "amphora": {
      // Two wine jars leaned in the corner and a cup, left from the funeral meal.
      shadow(g, cx, by, 12, 2);
      for (const [ax, lean] of [[cx - 6, -1], [cx + 3, 1]] as const) {
        for (let j = 0; j < 20; j++) {
          const half = j < 3 ? 1 : j < 5 ? 2 : j < 15 ? 4 - Math.floor(Math.abs(j - 9) / 4) : j < 18 ? 2 : 1;
          const sx = ax + Math.round((j - 10) * lean * -0.12);
          r(g, TERRA[1], sx - half, by - 21 + j, half * 2 + 1, 1), r(g, TERRA[2], sx - half, by - 21 + j, half + 1, 1), r(g, TERRA[3], sx - half, by - 21 + j, 1, 1);
        }
        r(g, TERRA[2], ax - 3, by - 21, 1, 4), r(g, TERRA[2], ax + 3, by - 21, 1, 4), r(g, TERRA[3], ax - 1, by - 22, 3, 1);
      }
      ell(g, "#7a2a1c", cx + 9, by - 2, 3, 2), r(g, "#c0603a", cx + 6, by - 4, 7, 1), r(g, "#3a1a10", cx + 7, by - 3, 5, 1);
      return true;
    }
    case "clay-lamps": {
      // Three oil lamps on the floor by a grave, one with a cross on it.
      for (const [lx, ly, cross] of [[cx - 7, by - 4, false], [cx + 2, by - 6, true], [cx + 4, by - 1, false]] as const) {
        shadow(g, lx + 2, ly + 3, 4, 1);
        ell(g, TERRA[1], lx, ly, 3, 2), ell(g, TERRA[2], lx, ly - 1, 3, 1), r(g, TERRA[3], lx - 2, ly - 2, 3, 1);
        r(g, TERRA[2], lx + 3, ly - 1, 3, 2), r(g, "#1a0e08", lx + 5, ly - 1, 1, 1), r(g, TERRA[1], lx - 5, ly - 1, 2, 1);
        if (cross) r(g, TERRA[0], lx, ly - 2, 1, 3), r(g, TERRA[0], lx - 1, ly - 1, 3, 1);
      }
      return true;
    }
    case "skulls": {
      // Long bones tipped in a heap, skulls rolled on top.
      shadow(g, cx, by, 15, 3);
      for (let k = 0; k < 9; k++) {
        const bx = cx - 13 + Math.floor(h(k, 21) * 22), byy = by - 3 - Math.floor(h(k, 22) * 7), len = 8 + Math.floor(h(k, 23) * 5);
        r(g, BONE[1], bx, byy + 1, len, 1), r(g, BONE[2], bx, byy, len, 1), r(g, BONE[3], bx - 1, byy - 1, 2, 2), r(g, BONE[2], bx + len - 1, byy - 1, 2, 3);
      }
      for (const [sx, sy] of [[cx - 8, by - 9], [cx - 1, by - 12], [cx + 6, by - 8], [cx + 1, by - 5], [cx - 6, by - 3]]) {
        ell(g, BONE[2], sx, sy, 3, 3), r(g, BONE[3], sx - 2, sy - 3, 3, 1), r(g, BONE[1], sx + 2, sy - 1, 1, 3);
        r(g, "#2a2018", sx - 2, sy, 2, 2), r(g, "#2a2018", sx + 1, sy, 2, 2), r(g, "#2a2018", sx, sy + 2, 1, 1), r(g, BONE[1], sx - 1, sy + 3, 3, 1);
      }
      return true;
    }
    case "fire-basin": {
      // A stone basin on a column with a fire in it, kept burning to draw air through the galleries.
      shadow(g, cx, by, 9, 3);
      r(g, MARBLE[2], cx - 7, by - 5, 14, 5), r(g, MARBLE[3], cx - 7, by - 5, 14, 1), r(g, MARBLE[1], cx + 6, by - 4, 1, 4);
      r(g, MARBLE[2], cx - 3, by - 22, 6, 17), r(g, MARBLE[4], cx - 3, by - 22, 2, 17), r(g, MARBLE[1], cx + 2, by - 22, 1, 17);
      r(g, MARBLE[1], cx - 10, by - 27, 20, 5), r(g, MARBLE[3], cx - 10, by - 27, 20, 1), r(g, MARBLE[2], cx - 9, by - 23, 18, 1);
      r(g, "#2a1a10", cx - 8, by - 28, 16, 2);
      if (!emptied) {
        for (const [fx, fh] of [[-5, 4], [-2, 8], [1, 6], [4, 4]]) r(g, "#e05a18", cx + fx, by - 28 - fh, 3, fh), r(g, "#ffb040", cx + fx + 1, by - 28 - fh + 2, 1, fh - 2);
        r(g, "#fff2b0", cx - 1, by - 32, 1, 3), r(g, "#ff8020", cx - 7, by - 29, 14, 1);
      }
      return true;
    }
    case "cache": {
      // A chest pushed into a dead end, a sack thrown over it, a keg beside.
      shadow(g, cx, by, 14, 3);
      r(g, WOOD[1], cx - 12, by - 13, 18, 12), r(g, WOOD[2], cx - 12, by - 16, 18, 4), r(g, WOOD[3], cx - 12, by - 16, 18, 1), r(g, WOOD[0], cx - 12, by - 2, 18, 1);
      for (const bx of [cx - 9, cx + 1]) r(g, IRON[1], bx, by - 16, 2, 15), r(g, IRON[3], bx, by - 16, 1, 1);
      r(g, IRON[2], cx - 4, by - 11, 3, 3);
      for (let j = 0; j < 9; j++) r(g, j < 2 ? "#b8a478" : "#9c8a60", cx - 13 + Math.floor(j / 3), by - 17 + j, 10 - j, 1);
      for (let j = 0; j < 12; j++) {
        const half = j < 2 || j > 9 ? 3 : 4;
        r(g, WOOD[2], cx + 9 - half, by - 12 + j, half * 2, 1), r(g, WOOD[3], cx + 9 - half, by - 12 + j, 1, 1);
      }
      r(g, IRON[1], cx + 5, by - 9, 8, 1), r(g, IRON[1], cx + 5, by - 3, 8, 1);
      return true;
    }
    case "tuff-dust":
    case "lime-dust": {
      const pale = art === "lime-dust", n = Math.floor(v * 97);
      for (let k = 0; k < 7; k++) r(g, css(pale ? p.face[3] : p.face[k & 1 ? 1 : 3], 0.7), x + 2 + ((n * (k + 3)) % 12), y + 3 + ((n * (k + 5)) % 11), 1 + (k & 1), 1);
      return true;
    }
    case "sherds": {
      const n = Math.floor(v * 97);
      for (let k = 0; k < 3; k++) {
        const sx = x + 2 + ((n * (k + 2)) % 10), sy = y + 4 + ((n * (k + 7)) % 8);
        r(g, TERRA[k ? 2 : 3], sx, sy, 3, 2), r(g, TERRA[0], sx + 1, sy + 2, 2, 1);
      }
      return true;
    }
    case "bone-bits": {
      const n = Math.floor(v * 97), bx = x + 3 + (n % 7), byy = y + 5 + ((n >> 3) % 7);
      r(g, BONE[2], bx, byy, 6, 1), r(g, BONE[1], bx, byy + 1, 6, 1), r(g, BONE[3], bx - 1, byy - 1, 2, 2), r(g, BONE[2], bx + 6, byy, 1, 2);
      if (n & 1) r(g, BONE[2], bx + 3, byy + 3, 3, 1);
      return true;
    }
    case "quarry-pillar": {
      // A pillar of rough limestone blocks the quarrymen built to hold the roof up.
      shadow(g, cx, by, 10, 3);
      for (let j = 0; j < 7; j++) {
        const yy = by - 6 - j * 6, off = j & 1 ? 3 : 0;
        for (const [bx, bw] of [[cx - 9 + off, 9], [cx + off, 9 - off]] as const) {
          const k = h(bx, j);
          r(g, css(p.face[k < 0.5 ? 2 : 3]), bx, yy, bw, 5), r(g, css(p.face[3]), bx, yy, bw, 1), r(g, css(p.face[1]), bx + bw - 1, yy + 1, 1, 4);
          r(g, css(p.face[0]), bx, yy + 5, bw, 1);
        }
      }
      r(g, "rgba(10,6,16,0.3)", cx + 5, by - 42, 4, 42);
      return true;
    }
  }
  return false;
}
