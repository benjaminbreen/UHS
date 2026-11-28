import type Phaser from "phaser";
import type { TunnelDepth, TunnelKind } from "../../content/sewers";
import type { TunnelNetwork } from "../../world/sewer";
import { paintCatacombObject } from "./catacomb-art";
import { paintMineObject } from "./mine-art";
import type { SewerPalette } from "./palette";
import { paletteOf } from "./terrain";

type Ctx = CanvasRenderingContext2D;
export const css = (c: readonly number[], a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const r = (g: Ctx, color: string, x: number, y: number, w = 1, h = 1) => {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
};
export const ell = (g: Ctx, color: string, cx: number, cy: number, rx: number, ry: number) => {
  for (let y = -ry; y <= ry; y++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / (ry + 0.5)) ** 2)));
    r(g, color, cx - half, cy + y, half * 2 + 1, 1);
  }
};
export const shadow = (g: Ctx, cx: number, cy: number, rx: number, ry = 2) => ell(g, "rgba(10,6,16,0.35)", cx, cy, rx, ry);

export const IRON = ["#1e1e22", "#34363c", "#55585f", "#7c8088"];
const RUST = ["#3a2216", "#6a3a20", "#965630", "#b8784a"];
export const WOOD = ["#3a2618", "#5c3e26", "#7a5634", "#9a7248"];

/** Things the tunnel is built with or grows on its own, and the things in
 * it. (x, y) is the top-left of the cell; tall things rise above it into the
 * cell above. `v` varies the drawing; `emptied` shows it as taken. */
export function paintSewerObject(g: Ctx, art: string, x: number, y: number, p: SewerPalette, v = 0.5, emptied = false) {
  if (paintMineObject(g, art, x, y, p, v, emptied) || paintCatacombObject(g, art, x, y, p, v, emptied)) return;
  const cx = x + 8, by = y + 15;
  switch (art) {
    // The ladder under a street lid: iron rungs coming down out of the vault.
    case "ladder": {
      for (const sx of [cx - 5, cx + 4]) {
        r(g, IRON[1], sx, by - 46, 1, 46);
        r(g, IRON[3], sx + 1, by - 46, 1, 46);
      }
      for (let ry = by - 43; ry <= by - 2; ry += 5) {
        r(g, IRON[2], cx - 4, ry, 8, 1);
        r(g, IRON[0], cx - 4, ry + 1, 8, 1);
      }
      return;
    }
    case "up": {
      // Rungs set into the back wall, rusted where the water runs.
      for (let ry = y - 22; ry <= y + 12; ry += 5) {
        r(g, RUST[1], cx - 5, ry, 10, 2);
        r(g, RUST[3], cx - 5, ry, 10, 1);
        r(g, "rgba(0,0,0,0.35)", cx - 5, ry + 2, 10, 1);
      }
      return;
    }
    case "down": {
      // A round shaft with a safety rail, rungs going down into black.
      shadow(g, cx, by - 2, 8, 3);
      ell(g, css(p.coping[1]), cx, by - 6, 7, 5);
      ell(g, "#050406", cx, by - 6, 5, 4);
      for (let i = 0; i < 3; i++) r(g, IRON[2 - (i >> 1)], cx - 3, by - 8 + i * 2, 6, 1);
      r(g, IRON[2], cx - 8, by - 20, 1, 13);
      r(g, IRON[2], cx + 7, by - 20, 1, 13);
      r(g, IRON[3], cx - 8, by - 21, 16, 1);
      r(g, IRON[1], cx - 8, by - 20, 16, 1);
      r(g, "#c8a020", cx - 8, by - 15, 16, 1);
      return;
    }
    case "outfall": {
      // A house drain's pipe mouth in the wall, stained below.
      const ox = x + 3 + Math.floor(v * 8), oy = y + 4;
      const clay = v < 0.5;
      ell(g, clay ? "#6a3e2a" : css(p.pipe[1]), ox + 2, oy, 3, 3);
      ell(g, "#0c0a0c", ox + 2, oy, 2, 2);
      r(g, clay ? "#9a6040" : css(p.pipe[2]), ox, oy - 3, 4, 1);
      for (let k = 3; k < 12; k++) r(g, css(p.slime, 0.5 - k * 0.03), ox + 1, oy + k, 3, 1);
      return;
    }
    case "rungs": {
      for (let ry = y - 18; ry <= y + 10; ry += 6) r(g, RUST[2], cx - 3, ry, 6, 1), r(g, RUST[0], cx - 3, ry + 1, 6, 1);
      return;
    }
    case "stain": {
      for (let k = 0; k < 14; k++) r(g, css(p.slime, 0.35 - k * 0.02), x + 4 + Math.floor(v * 6), y - 6 + k, 2 + (k % 3 === 0 ? 1 : 0), 1);
      return;
    }
    case "roots": {
      g.fillStyle = "#4a3824";
      for (let k = 0; k < 4; k++) {
        let rx = x + 2 + k * 3 + Math.floor(v * 3);
        for (let ry = y - 20; ry < y + 8 - k * 3; ry++) {
          if ((ry + k) % 5 === 0) rx += (k & 1) * 2 - 1;
          g.fillRect(rx, ry, 1, 1);
        }
      }
      r(g, "#3f6a2c", x + 3, y - 20, 9, 2);
      return;
    }
    case "pier": {
      // A brick or concrete pier holding up the hall's vault.
      shadow(g, cx, by, 8, 3);
      const face = p.face;
      r(g, css(face[1]), cx - 6, by - 36, 12, 36);
      r(g, css(face[3]), cx - 6, by - 36, 3, 36);
      r(g, css(face[2]), cx - 3, by - 36, 6, 36);
      for (let k = by - 34; k < by; k += 4) r(g, css(face[0]), cx - 6, k, 12, 1);
      r(g, css(p.slime, 0.7), cx - 6, by - 6, 12, 6);
      return;
    }
    case "rubble": {
      shadow(g, cx, by, 8, 2);
      const stones = [[-6, -3, 5, 4], [-1, -5, 6, 5], [3, -2, 5, 3], [-4, -8, 5, 4], [0, -10, 4, 3]];
      for (const [dx, dy, w, h] of stones) {
        r(g, css(p.face[1]), cx + dx, by + dy, w, h);
        r(g, css(p.face[3]), cx + dx, by + dy, w, 1);
      }
      return;
    }
    case "pump": {
      // A pumping engine: a green casing, a flywheel, a gauge.
      shadow(g, cx, by, 9, 3);
      r(g, "#2c4436", cx - 8, by - 16, 16, 15);
      r(g, "#3e5e4a", cx - 8, by - 16, 16, 2);
      r(g, "#1a2a20", cx - 8, by - 2, 16, 1);
      ell(g, IRON[1], cx + 2, by - 22, 6, 6);
      ell(g, IRON[0], cx + 2, by - 22, 4, 4);
      r(g, IRON[3], cx + 2, by - 28, 1, 12);
      r(g, IRON[3], cx - 4, by - 22, 12, 1);
      ell(g, "#d8d0b0", cx - 4, by - 10, 2, 2);
      r(g, "#a02818", cx - 4, by - 11, 1, 2);
      return;
    }
    case "weir": {
      // A step in the channel the water falls over, white where it breaks.
      r(g, css(p.coping[1]), x + 2, y + 6, 12, 2);
      for (let k = 2; k < 14; k++) if ((k + Math.floor(v * 5)) % 3) r(g, css(p.water[3], 0.8), x + k, y + 8 + (k % 2), 1, 2);
      return;
    }
    case "litter": {
      const kind = Math.floor(v * 4);
      if (kind === 0) r(g, "#c8c0a8", x + 5, y + 9, 4, 3), r(g, "#8e8878", x + 5, y + 11, 4, 1);
      else if (kind === 1) r(g, "#a83828", x + 7, y + 8, 2, 4), r(g, "#d0c8b8", x + 7, y + 8, 2, 1);
      else if (kind === 2) r(g, "#5a7a3a", x + 4, y + 10, 3, 2), r(g, "#7a5a2a", x + 9, y + 7, 2, 2);
      else r(g, "#b0b4b8", x + 6, y + 10, 3, 2);
      return;
    }
    case "puddle":
      ell(g, css(p.water[1], 0.7), x + 4 + v * 6, y + 9, 3, 1);
      r(g, css(p.water[3], 0.6), x + 3 + v * 6, y + 8, 2, 1);
      return;
    case "grit":
      for (let k = 0; k < 6; k++) r(g, css(p.silt[(k % 3) as 0 | 1 | 2]), x + 2 + ((k * 5 + v * 9) % 12), y + 4 + ((k * 7) % 10));
      return;
    case "droppings":
      for (let k = 0; k < 5; k++) r(g, "#241a14", x + 4 + ((k * 3 + v * 7) % 9), y + 6 + ((k * 5) % 7), 1, 1);
      return;
    case "leaves":
      for (let k = 0; k < 4; k++) r(g, ["#5a6a2a", "#7a6a2a", "#4a5a24", "#8a5a24"][k], x + 2 + ((k * 4 + v * 7) % 11), y + 3 + ((k * 5 + v * 3) % 10), 2, 1);
      return;
    case "sludge":
      ell(g, css(p.silt[0]), x + 8, y + 9, 5, 2);
      r(g, css(p.slime), x + 6, y + 8, 2, 1);
      return;
    case "flotsam":
      return;
  }
  paintFind(g, art, x, y, p, v, emptied);
}

/** What the player can use or take. */
function paintFind(g: Ctx, art: string, x: number, y: number, p: SewerPalette, v: number, emptied: boolean) {
  const cx = x + 8, by = y + 15;
  switch (art) {
    case "glint":
      if (emptied) return;
      ell(g, css(p.silt[0]), cx, by - 4, 4, 2);
      r(g, "#c8a040", cx - 1, by - 5, 2, 1);
      r(g, "#f0dc90", cx, by - 6, 1, 1);
      return;
    case "jewel":
      if (emptied) return;
      ell(g, css(p.silt[0]), cx, by - 4, 4, 2);
      ell(g, "#d8b048", cx, by - 6, 2, 2);
      ell(g, css(p.silt[0]), cx, by - 6, 1, 1);
      r(g, "#80e0d0", cx - 1, by - 8, 2, 1);
      return;
    case "purse":
      if (emptied) return;
      r(g, "#4a2a1a", cx - 4, by - 6, 8, 5);
      r(g, "#6a4228", cx - 4, by - 6, 8, 1);
      r(g, "#c8a050", cx - 1, by - 5, 2, 1);
      return;
    case "bottle":
      if (emptied) return;
      r(g, "#3a6a3a", cx - 4, by - 4, 7, 3);
      r(g, "#5a9a5a", cx - 4, by - 4, 7, 1);
      r(g, "#c8b890", cx + 3, by - 4, 2, 2);
      return;
    case "toy":
      if (emptied) return;
      r(g, "#c83828", cx - 3, by - 6, 6, 4);
      r(g, "#e8c040", cx - 2, by - 8, 4, 2);
      r(g, "#2a2a2a", cx - 3, by - 2, 2, 1), r(g, "#2a2a2a", cx + 1, by - 2, 2, 1);
      return;
    case "bones":
      if (emptied) return;
      r(g, "#d8d0b8", cx - 5, by - 4, 9, 1);
      r(g, "#d8d0b8", cx - 6, by - 5, 2, 3), r(g, "#d8d0b8", cx + 3, by - 5, 2, 3);
      ell(g, "#c8c0a4", cx + 1, by - 8, 3, 2);
      r(g, "#3a3428", cx, by - 8, 1, 1), r(g, "#3a3428", cx + 2, by - 8, 1, 1);
      return;
    case "keys":
      if (emptied) return;
      ell(g, "#a89060", cx - 2, by - 5, 2, 2);
      ell(g, css(p.ledge[1]), cx - 2, by - 5, 1, 1);
      r(g, "#c8b078", cx, by - 5, 5, 1), r(g, "#c8b078", cx + 3, by - 4, 1, 1);
      return;
    case "phone":
      if (emptied) return;
      r(g, "#1a1a1e", cx - 2, by - 8, 5, 8);
      r(g, "#3a6a8a", cx - 1, by - 7, 3, 5);
      r(g, "#a0d0f0", cx - 1, by - 7, 1, 1);
      return;
    case "tin":
      if (emptied) return;
      r(g, "#8a8e94", cx - 3, by - 7, 6, 6);
      r(g, "#b8bcc2", cx - 3, by - 7, 6, 1);
      r(g, "#a83020", cx - 3, by - 5, 6, 2);
      return;
    case "papers":
      if (emptied) return;
      r(g, "#d8d0b4", cx - 5, by - 6, 7, 5);
      r(g, "#c8c0a0", cx - 2, by - 8, 7, 5);
      for (let k = 0; k < 3; k++) r(g, "#6a6458", cx - 1, by - 7 + k * 2, 5, 1);
      return;
    case "crate": {
      shadow(g, cx, by, 8);
      const W = WOOD;
      r(g, W[1], cx - 7, by - 14, 14, 13);
      r(g, W[2], cx - 7, by - 14, 14, 3);
      r(g, W[3], cx - 7, by - 14, 14, 1);
      for (const k of [by - 9, by - 5]) r(g, W[0], cx - 7, k, 14, 1);
      if (!emptied) r(g, "#c8b890", cx - 3, by - 13, 6, 1);
      return;
    }
    case "barrel": {
      shadow(g, cx, by, 6);
      r(g, RUST[1], cx - 5, by - 14, 10, 13);
      r(g, RUST[2], cx - 3, by - 14, 4, 13);
      r(g, RUST[3], cx - 2, by - 14, 1, 13);
      for (const k of [by - 13, by - 8, by - 3]) r(g, RUST[0], cx - 5, k, 10, 1);
      ell(g, RUST[2], cx, by - 15, 5, 1);
      return;
    }
    case "locker": {
      // A crew's steel locker, its door ajar once emptied.
      shadow(g, cx, by, 7);
      r(g, "#3c5a52", cx - 6, by - 26, 12, 25);
      r(g, "#56786c", cx - 6, by - 26, 12, 2);
      r(g, "#2a403a", cx - 6, by - 2, 12, 1);
      for (let k = 0; k < 3; k++) r(g, "#20302c", cx - 4, by - 22 + k * 2, 8, 1);
      r(g, "#c8c0a0", cx + 3, by - 13, 1, 3);
      if (emptied) r(g, "#141c1a", cx - 5, by - 24, 6, 21), r(g, "#56786c", cx - 9, by - 24, 3, 21);
      return;
    }
    case "toolbag": {
      shadow(g, cx, by, 7);
      r(g, "#4a3a28", cx - 6, by - 8, 12, 7);
      r(g, "#6a5438", cx - 6, by - 8, 12, 1);
      r(g, "#2a2018", cx - 3, by - 11, 6, 1), r(g, "#2a2018", cx - 3, by - 11, 1, 3), r(g, "#2a2018", cx + 2, by - 11, 1, 3);
      if (!emptied) r(g, IRON[3], cx - 2, by - 12, 1, 4), r(g, "#a03020", cx + 3, by - 13, 2, 5);
      return;
    }
    case "trolley": {
      shadow(g, cx, by, 8);
      for (let k = 0; k < 4; k++) r(g, IRON[3], cx - 7, by - 14 + k * 3, 13, 1);
      for (let k = 0; k < 5; k++) r(g, IRON[2], cx - 7 + k * 3, by - 14, 1, 10);
      r(g, "#c83030", cx + 5, by - 17, 3, 2);
      r(g, IRON[0], cx - 6, by - 2, 2, 2), r(g, IRON[0], cx + 4, by - 2, 2, 2);
      r(g, css(p.slime, 0.6), cx - 7, by - 6, 13, 2);
      return;
    }
    case "bicycle": {
      shadow(g, cx, by, 9);
      for (const wx of [cx - 5, cx + 5]) {
        ell(g, IRON[1], wx, by - 5, 4, 4);
        ell(g, css(p.ledge[1]), wx, by - 5, 3, 3);
      }
      r(g, "#2a5a8a", cx - 5, by - 9, 10, 1);
      r(g, "#2a5a8a", cx - 1, by - 9, 1, 5);
      r(g, IRON[0], cx + 4, by - 12, 3, 1), r(g, "#3a2a20", cx - 3, by - 11, 3, 1);
      return;
    }
    case "bedroll": {
      shadow(g, cx, by, 8);
      r(g, "#5a4a6a", cx - 7, by - 6, 14, 5);
      r(g, "#7a6888", cx - 7, by - 6, 14, 1);
      r(g, "#8a3a30", cx - 7, by - 6, 4, 5);
      r(g, "#c8b8a0", cx + 3, by - 7, 4, 3);
      return;
    }
    case "camp": {
      // A camp stove, a pan, a crate for a table, a candle.
      shadow(g, cx, by, 8);
      r(g, WOOD[1], cx - 7, by - 8, 8, 7), r(g, WOOD[3], cx - 7, by - 8, 8, 1);
      r(g, "#e8e0c8", cx - 5, by - 11, 1, 3), r(g, "#ffd070", cx - 5, by - 12, 1, 1);
      r(g, IRON[1], cx + 2, by - 6, 6, 5), r(g, IRON[3], cx + 2, by - 6, 6, 1);
      r(g, "#3060c0", cx + 3, by - 7, 4, 1);
      r(g, IRON[0], cx + 2, by - 9, 6, 2);
      return;
    }
    case "shrine": {
      shadow(g, cx, by, 6);
      r(g, WOOD[1], cx - 5, by - 6, 10, 5), r(g, WOOD[3], cx - 5, by - 6, 10, 1);
      r(g, "#d8c8a0", cx - 3, by - 16, 6, 9);
      r(g, "#a04030", cx - 2, by - 14, 4, 5);
      r(g, "#e8d8b0", cx - 4, by - 9, 1, 3), r(g, "#ffd070", cx - 4, by - 10, 1, 1);
      r(g, "#e8d8b0", cx + 4, by - 9, 1, 3), r(g, "#ffd070", cx + 4, by - 10, 1, 1);
      r(g, "#c83050", cx + 1, by - 7, 2, 1);
      return;
    }
    case "fatberg": {
      // A grey-white mass of fat and wipes, glistening.
      shadow(g, cx, by, 9, 3);
      ell(g, "#8a8670", cx, by - 6, 8, 5);
      ell(g, "#b0aa90", cx - 1, by - 7, 6, 4);
      ell(g, "#cac4a8", cx - 2, by - 9, 3, 2);
      r(g, "#e8e4d0", cx - 3, by - 10, 2, 1);
      r(g, "#d8d0c0", cx + 3, by - 5, 3, 2);
      if (emptied) ell(g, "#6a6650", cx, by - 4, 6, 2);
      return;
    }
    case "silt-heap": {
      shadow(g, cx, by, 8);
      ell(g, css(p.silt[0]), cx, by - 4, 8, 4);
      ell(g, css(p.silt[1]), cx - 1, by - 5, 6, 3);
      ell(g, css(p.silt[2]), cx - 2, by - 7, 3, 1);
      if (!emptied) r(g, "#e0c060", cx + 2, by - 6, 1, 1);
      return;
    }
    case "sandbags": {
      shadow(g, cx, by, 8);
      for (const [dx, dy] of [[-7, -5], [0, -5], [-4, -10]]) {
        r(g, "#8a7a52", cx + dx, by + dy, 7, 4);
        r(g, "#a8986a", cx + dx, by + dy, 7, 1);
        r(g, "#5a4e34", cx + dx, by + dy + 3, 7, 1);
      }
      return;
    }
  }
  paintWallFind(g, art, x, y, p, v, emptied);
}

/** On the back wall: (x, y) is the wall cell above the floor it is read from. */
function paintWallFind(g: Ctx, art: string, x: number, y: number, p: SewerPalette, v: number, emptied: boolean) {
  const cx = x + 8, top = y - 6;
  switch (art) {
    case "plaque": {
      // An enamel name plate, white on blue, or a cast date stone.
      r(g, "#1c2c6a", cx - 9, top, 18, 9);
      r(g, "#e8e8f0", cx - 8, top + 1, 16, 7);
      r(g, "#1c3c9a", cx - 7, top + 2, 14, 5);
      for (let k = 0; k < 5; k++) r(g, "#e8e8f0", cx - 6 + k * 3, top + 4, 2, 1);
      return;
    }
    case "notice": {
      r(g, "#d8d0b0", cx - 6, top, 12, 10);
      r(g, "#c03020", cx - 6, top, 12, 2);
      for (let k = 0; k < 3; k++) r(g, "#4a4438", cx - 4, top + 4 + k * 2, 8 - (k & 1) * 3, 1);
      return;
    }
    case "valve": {
      // A sluice wheel on its spindle.
      r(g, IRON[1], cx - 1, top - 4, 2, 18);
      ell(g, "#a02818", cx, top + 4, 6, 6);
      ell(g, css(p.face[1]), cx, top + 4, 4, 4);
      r(g, "#a02818", cx - 6, top + 4, 12, 1), r(g, "#a02818", cx, top - 2, 1, 12);
      r(g, "#d04830", cx - 4, top - 1, 3, 1);
      return;
    }
    case "gauge": {
      ell(g, IRON[2], cx, top + 3, 5, 5);
      ell(g, "#e8e0c8", cx, top + 3, 4, 4);
      r(g, "#202020", cx, top, 1, 3);
      r(g, "#c02818", cx, top + 3, 3, 1);
      r(g, IRON[1], cx - 1, top + 8, 2, 8);
      return;
    }
    case "fusebox": {
      r(g, "#5a5e44", cx - 6, top - 2, 12, 14);
      r(g, "#747a58", cx - 6, top - 2, 12, 1);
      r(g, "#e8c020", cx - 2, top + 2, 4, 4);
      r(g, "#202020", cx - 1, top + 3, 2, 2);
      r(g, IRON[0], cx + 2, top + 12, 1, 8);
      return;
    }
    case "niche": {
      r(g, "#0a0808", cx - 5, top - 2, 10, 12);
      r(g, css(p.face[3]), cx - 6, top - 3, 12, 1);
      if (!emptied) r(g, WOOD[2], cx - 3, top + 6, 6, 4), r(g, WOOD[3], cx - 3, top + 6, 6, 1);
      return;
    }
    case "graffiti":
    case "mural": {
      const hue = ["#e04060", "#40c0e0", "#f0c030", "#60e070", "#c060f0"];
      const a = hue[Math.floor(v * 5)], b = hue[(Math.floor(v * 5) + 2) % 5];
      const w = art === "mural" ? 28 : 18;
      g.fillStyle = a;
      // Fat letters: a few blocky strokes with a light outline.
      for (let k = 0; k < (art === "mural" ? 5 : 3); k++) {
        const lx = cx - w / 2 + k * 6, h = 6 + ((k * 3 + Math.floor(v * 7)) % 4);
        r(g, b, lx - 1, top + 9 - h, 6, h + 2);
        r(g, a, lx, top + 10 - h, 4, h);
        r(g, "#ffffff", lx, top + 10 - h, 1, 1);
      }
      if (art === "mural") for (let k = 0; k < 6; k++) r(g, hue[k % 5], cx - 14 + k * 5, top + 12, 3, 1);
      return;
    }
  }
}

/** A lid dragged off its manhole: the frame and the dark shaft at (8, 8), the
 * lid itself lying on the road to the east, with the scrape between them. */
export function paintOpenLid(t: Phaser.Textures.CanvasTexture) {
  const g = t.context;
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 32; x++) {
      const dx = x - 7.5, dy = y - 7.5, d = Math.hypot(dx, dy);
      const lx = x - 22.5, ly = y - 8.5, l = Math.hypot(lx, ly);
      const sx = x - 23.5, sy = y - 10, s = Math.hypot(sx, sy);
      let c: string | undefined;
      if (d <= 5.6) c = d > 4.4 ? (dx + dy < -1 ? "#7c7e78" : dx + dy > 1 ? "#26282c" : "#55575a") : y < 5 && Math.abs(dx) < 3 && (y === 3 || y === 6) ? "#3a3c40" : y <= 3 + (4.4 - d) * 0.4 ? "#141416" : "#050506";
      else if (l <= 5.6) {
        if (l > 4.6) c = lx + ly < -1 ? "#7c7e78" : lx + ly > 1 ? "#2c2e32" : "#585a5c";
        else c = (Math.round(lx) + Math.round(ly)) % 3 === 0 ? "#6a6c6a" : (Math.round(lx) - Math.round(ly)) % 3 === 0 ? "#3c3e40" : "#505254";
      } else if (s <= 6) c = "rgba(10,8,14,0.35)";
      else if (x > 12 && x < 18 && (y === 8 || y === 10)) c = "rgba(170,170,160,0.35)";
      if (!c) continue;
      g.fillStyle = c;
      g.fillRect(x, y, 1, 1);
    }
  t.refresh();
}

/** A stair going down through a floor, 16 by 24: a low iron rail behind, a
 * stone lip, and steps falling away into the dark. Grey for a crypt, brown tuff for the catacombs. */
export function paintStairDown(t: Phaser.Textures.CanvasTexture, tuff: boolean) {
  const g = t.context, w = t.width, stone = tuff ? ["#b08c66", "#86644a", "#5e4430"] : ["#cfcabf", "#a29d92", "#706c64"];
  r(g, stone[0], 0, 6, w, 2), r(g, stone[1], 0, 8, 2, 16), r(g, stone[1], w - 2, 8, 2, 16), r(g, stone[2], 1, 8, 1, 16), r(g, stone[2], w - 2, 8, 1, 16);
  r(g, "#060508", 2, 8, w - 4, 16);
  for (let k = 0; k < 4; k++) {
    const y = 21 - k * 3, a = 1 - k * 0.27;
    r(g, `rgba(${tuff ? "176,140,102" : "207,202,191"},${a})`, 2, y, w - 4, 1);
    r(g, `rgba(${tuff ? "110,80,56" : "130,126,118"},${a})`, 2, y + 1, w - 4, 2);
  }
  r(g, stone[0], 0, 22, 2, 2), r(g, stone[0], w - 2, 22, 2, 2);
  for (const x of [0, w - 2]) {
    r(g, IRON[1], x, 0, 1, 7), r(g, IRON[2], x + 1, 0, 1, 7), r(g, IRON[3], x, 0, 2, 1);
  }
  r(g, IRON[3], 0, 0, w, 1), r(g, IRON[1], 0, 1, w, 1);
  t.refresh();
}

/** A sewer, mine or catacomb find's canvas from its sprite name, `made:sewer:<network>:<kind>:<layer>:<v>:<art>[:done]`. */
export function sewerPicture(frame: string) {
  const done = frame.endsWith(":done");
  const m = /^made:sewer:([^:]+):([^:]+):([^:]+):(\d+):(.+)$/.exec(done ? frame.slice(0, -5) : frame);
  if (!m) return undefined;
  const pal = paletteOf({ network: m[1] as TunnelNetwork, kind: m[2] as TunnelKind, layer: m[3] as TunnelDepth });
  if (!pal) return undefined;
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 56;
  paintSewerObject(canvas.getContext("2d")!, m[5], 16, 40, pal, Number(m[4]) / 10, done);
  return canvas;
}
