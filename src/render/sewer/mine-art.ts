import { css, ell, r, shadow, IRON, WOOD } from "./art";
import type { SewerPalette } from "./palette";

type Ctx = CanvasRenderingContext2D;
const BRASS = ["#5a4418", "#8a6a28", "#c8a040", "#f0dc90"];
const LEATHER = ["#2e1a10", "#4e2e1a", "#6e4428", "#8e5c38"];

/** Things down a mine, and what is found there. Same contract as
 * `paintSewerObject`; false when the art is not a mine's. */
export function paintMineObject(g: Ctx, art: string, x: number, y: number, p: SewerPalette, v: number, emptied: boolean): boolean {
  const cx = x + 8, by = y + 15, top = y - 6;
  const T = (p.timber ?? [[58, 36, 20], [106, 68, 38], [142, 96, 52], [180, 132, 76]]).map((c) => css(c));
  const O = (p.ore ?? [[30, 30, 34], [60, 60, 70], [120, 120, 130], [200, 200, 210]]).map((c) => css(c));
  switch (art) {
    // The shaft bottom: the cage hanging in its guides, its gate of bars, chains up into the dark.
    case "pitcage": {
      const t = y + 16 - 38, l = cx - 13;
      r(g, "#040305", l, t, 26, 38);
      r(g, T[1], l - 3, t, 3, 38), r(g, T[3], l - 3, t, 1, 38);
      r(g, T[1], l + 26, t, 3, 38), r(g, T[0], l + 28, t, 1, 38);
      for (const sx of [cx - 3, cx + 2]) for (let k = 0; k < 4; k++) r(g, IRON[k % 2 ? 1 : 2], sx, t + k * 2, 1, 2);
      r(g, IRON[3], l + 2, t + 8, 22, 1), r(g, IRON[2], l + 2, t + 9, 22, 2);
      r(g, IRON[2], l + 2, t + 11, 2, 26), r(g, IRON[1], l + 22, t + 11, 2, 26);
      r(g, "#141218", l + 4, t + 11, 18, 26);
      for (let k = 0; k < 6; k++) r(g, IRON[3], l + 6 + k * 3, t + 12, 1, 25);
      r(g, IRON[2], l + 4, t + 22, 18, 1);
      r(g, IRON[1], l + 2, t + 36, 22, 2);
      // The signal bell on its bracket.
      r(g, IRON[1], l - 8, t + 12, 5, 1);
      ell(g, BRASS[2], l - 8, t + 15, 2, 2), r(g, BRASS[3], l - 9, t + 13, 1, 1);
      return true;
    }
    // A ventilation door where a district leaves the road, propped open, its trapper's sacking hung back.
    case "airdoor": {
      const h = 24, l = x, w = 32;
      r(g, T[0], l, by - h, 2, h), r(g, T[2], l + 1, by - h, 1, h);
      r(g, T[0], l + w - 2, by - h, 2, h), r(g, T[2], l + w - 2, by - h, 1, h);
      r(g, T[1], l, by - h - 3, w, 3), r(g, T[3], l, by - h - 3, w, 1);
      // The leaf, swung back flat against the left post.
      for (let k = 0; k < 6; k++) r(g, k % 2 ? T[1] : T[2], l + 2, by - h + 1 + k * 4, 5, 4);
      r(g, T[0], l + 6, by - h + 1, 1, h - 1);
      r(g, "#8a7a5a", l + w - 7, by - h, 5, 14), r(g, "#6a5c44", l + w - 7, by - h + 13, 5, 1);
      return true;
    }
    case "brattice":
      r(g, "#7a6a48", cx - 7, top - 4, 14, 19);
      for (let k = 0; k < 4; k++) r(g, k % 2 ? "#5a4c34" : "#9a8a64", cx - 6 + k * 4, top - 3, 1, 18);
      r(g, "#3a3020", cx - 7, top - 5, 14, 1);
      for (const nx of [cx - 6, cx, cx + 6]) r(g, IRON[3], nx, top - 5, 1, 1);
      return true;
    case "airpipe":
      r(g, IRON[0], x, top + 2, 16, 4), r(g, IRON[2], x, top + 2, 16, 1), r(g, IRON[1], x, top + 3, 16, 2);
      r(g, IRON[3], x + Math.floor(v * 10), top + 1, 2, 6);
      return true;
    case "salt-bloom":
      for (let k = 0; k < 7; k++) r(g, k % 3 ? "#f2f0e8" : "#c8c4b8", cx - 6 + ((k * 5 + Math.floor(v * 9)) % 12), top + 4 + ((k * 3) % 9), 2 + (k % 2), 1);
      return true;
    case "drip-stain":
      for (let k = 0; k < 14; k++) r(g, css(p.slime, 0.35 - k * 0.02), cx - 2 + Math.floor(v * 4), top - 4 + k, 2, 1);
      return true;
    // A tub on the rails: planked or iron, heaped with what the face gives.
    case "tub": {
      shadow(g, cx, by - 1, 8, 2);
      for (const wx of [cx - 5, cx + 3]) ell(g, IRON[0], wx, by - 3, 2, 2), r(g, IRON[3], wx, by - 4, 1, 1);
      const iron = v > 0.5;
      r(g, iron ? IRON[1] : T[1], cx - 7, by - 14, 14, 10);
      r(g, iron ? IRON[3] : T[3], cx - 7, by - 14, 14, 1);
      r(g, iron ? IRON[0] : T[0], cx - 7, by - 5, 14, 1);
      if (!iron) for (const sx of [cx - 7, cx + 6]) r(g, IRON[1], sx, by - 14, 1, 10);
      r(g, IRON[2], cx - 7, by - 10, 14, 1);
      if (!emptied && v % 0.5 > 0.12) {
        ell(g, O[1], cx, by - 15, 6, 2);
        for (let k = 0; k < 5; k++) r(g, O[2 + (k % 2)], cx - 5 + k * 2, by - 17 + (k % 2), 2, 2);
      }
      return true;
    }
    case "sleeper":
      for (let k = 0; k < 2; k++) r(g, T[k ? 0 : 1], x + 2 + k * 7, y + 3 + Math.floor(v * 4), 3, 11);
      r(g, "#6a3a20", x + 1, y + 6, 14, 1);
      return true;
    // Pit props stacked ready: log ends in a pyramid.
    case "props": {
      shadow(g, cx, by - 1, 8, 2);
      const end = (ex: number, ey: number) => (ell(g, T[1], ex, ey, 3, 3), ell(g, T[3], ex, ey, 2, 2), r(g, T[2], ex, ey, 1, 1));
      for (let k = 0; k < 3; k++) end(cx - 5 + k * 5, by - 4);
      for (let k = 0; k < 2; k++) end(cx - 2 + k * 5, by - 9);
      end(cx, by - 14);
      return true;
    }
    // Roof come down: slabs and blocks of the face's own rock.
    case "fall": {
      shadow(g, cx, by - 1, 9, 3);
      const F = p.face.map((c) => css(c));
      ell(g, F[0], cx - 3, by - 5, 6, 4), ell(g, F[1], cx - 3, by - 6, 5, 3);
      ell(g, F[0], cx + 4, by - 4, 4, 3), ell(g, F[2], cx + 4, by - 5, 3, 2);
      ell(g, F[1], cx, by - 11, 4, 3), ell(g, F[3], cx - 1, by - 12, 2, 1);
      return true;
    }
    case "spoil":
      for (let k = 0; k < 5; k++) r(g, css(p.face[1 + (k % 3)]), x + 2 + ((k * 5 + Math.floor(v * 7)) % 12), y + 5 + ((k * 7) % 8), 2, 2 - (k % 2));
      return true;
    case "dust":
      ell(g, "rgba(8,8,10,0.35)", cx + Math.floor(v * 4) - 2, y + 9, 6, 2);
      return true;
    // A pony in its stall, looking over the half door. Its name is chalked on a board above.
    case "stall":
    case "stall-empty": {
      r(g, T[0], x, by - 14, 2, 14), r(g, T[0], x + 14, by - 14, 2, 14);
      for (let k = 0; k < 3; k++) r(g, k % 2 ? T[1] : T[2], x + 2, by - 12 + k * 4, 12, 4);
      r(g, T[3], x, by - 15, 16, 1);
      r(g, "#2a2620", x + 3, by - 30, 10, 4), r(g, "#e8e4d8", x + 5, by - 29, 6, 1), r(g, "#e8e4d8", x + 4, by - 27, 4, 1);
      if (art === "stall-empty") {
        for (let k = 0; k < 6; k++) r(g, "#b89a50", x + 3 + k * 2, by - 16 - (k % 3), 1, 2);
        return true;
      }
      // The pony's head and neck over the half door, in profile.
      const coat = ["#6a4428", "#3a2a20", "#9a8a78", "#c8b088"][Math.floor(v * 4)];
      const ink: Record<string, string> = { C: coat, D: v < 0.25 || v >= 0.75 ? "#3a2414" : "#5a524a", M: "#1e140c", N: "#d8c8b0", E: "#0c0806", W: "#f0e8d8" };
      const rows = ["   MC", "  MCC", "  MCCCC", " MMCWECC", " MCCCCCCCC", " MCCCCCCCNN", " MCCC  DNNN", " MCCC   DD", "MMCCC", "MCCCC", "MCCCC", "MCCCCC", "MCCCCCC"];
      const left = v * 10 % 1 < 0.5, ox = left ? cx + 6 : cx - 6;
      rows.forEach((row, ry) => [...row].forEach((ch, rx) => ch !== " " && r(g, ink[ch], left ? ox - rx : ox + rx, by - 28 + ry, 1, 1)));
      r(g, LEATHER[1], left ? ox - 9 : ox + 2, by - 23, 8, 1);
      return true;
    }
    // A pillar of salt left standing and carved by the miners into a saint.
    case "salt-pillar": {
      shadow(g, cx, by - 1, 7, 2);
      r(g, "#9c9888", cx - 5, by - 6, 10, 6), r(g, "#c4c0b0", cx - 5, by - 6, 10, 1);
      r(g, "#b8b4a4", cx - 3, by - 30, 6, 24);
      r(g, "#dcd8cc", cx - 3, by - 30, 2, 24);
      ell(g, "#d8d4c8", cx, by - 33, 3, 3), ell(g, "#f0eee6", cx - 1, by - 34, 1, 1);
      r(g, "#8a8678", cx - 4, by - 20, 8, 1);
      return true;
    }
    case "stull":
      r(g, T[0], x, y + 4, Math.round(v) * 16, 4), r(g, T[2], x, y + 4, Math.round(v) * 16, 1), r(g, T[1], x, y + 5, Math.round(v) * 16, 2);
      return true;
  }
  return paintMineFind(g, art, cx, by, top, p, O, emptied);
}

function paintMineFind(g: Ctx, art: string, cx: number, by: number, top: number, p: SewerPalette, O: string[], emptied: boolean): boolean {
  switch (art) {
    case "ore":
      if (emptied) {
        for (let k = 0; k < 3; k++) r(g, O[1], cx - 4 + k * 3, by - 3 + (k % 2), 1, 1);
        return true;
      }
      ell(g, O[0], cx, by - 3, 6, 2);
      for (let k = 0; k < 7; k++) r(g, O[1 + (k % 3)], cx - 5 + ((k * 3) % 10), by - 6 + ((k * 2) % 4), 2 + (k % 2), 2);
      r(g, O[3], cx - 1, by - 7, 1, 1);
      return true;
    case "snap": {
      shadow(g, cx, by - 1, 5);
      r(g, IRON[2], cx - 5, by - 6, 10, 5), r(g, IRON[3], cx - 5, by - 6, 10, 1), r(g, IRON[1], cx - 5, by - 2, 10, 1);
      if (emptied) r(g, IRON[3], cx - 5, by - 9, 10, 2);
      else r(g, IRON[2], cx - 5, by - 7, 10, 1);
      r(g, "#a83228", cx - 2, by - 4, 3, 1);
      return true;
    }
    case "tools":
      if (emptied) return true;
      // A pick and a shovel, crossed.
      r(g, WOOD[2], cx - 6, by - 3, 12, 1), r(g, WOOD[3], cx - 6, by - 4, 12, 1);
      r(g, IRON[2], cx + 4, by - 8, 2, 9), r(g, IRON[3], cx + 4, by - 8, 1, 2);
      r(g, WOOD[1], cx - 4, by - 9, 1, 8);
      r(g, IRON[1], cx - 6, by - 11, 5, 3), r(g, IRON[3], cx - 6, by - 11, 5, 1);
      return true;
    case "candles":
      if (emptied) return true;
      for (let k = 0; k < 3; k++) {
        const kx = cx - 5 + k * 5;
        ell(g, "#8a5a3a", kx, by - 2, 2, 1);
        r(g, "#e8dcb0", kx, by - 5 - (k % 2) * 2, 1, 3 + (k % 2) * 2);
      }
      return true;
    case "tally":
      if (emptied) return true;
      ell(g, BRASS[1], cx, by - 4, 2, 2), r(g, BRASS[3], cx - 1, by - 5, 1, 1), r(g, "#1a1408", cx, by - 4, 1, 1);
      return true;
    case "crust":
      ell(g, "#b88a48", cx, by - 4, 4, 2);
      for (let k = 0; k < 4; k++) r(g, "#e0b870", cx - 3 + k * 2, by - 6, 1, 1);
      return true;
    case "nugget":
      if (emptied) return true;
      ell(g, BRASS[1], cx, by - 4, 3, 2), ell(g, BRASS[2], cx - 1, by - 5, 2, 1), r(g, "#fff8d0", cx - 1, by - 6, 1, 1);
      return true;
    case "harness":
      for (let k = 0; k < 3; k++) r(g, LEATHER[1 + k], cx - 6 + k, by - 6 + k * 2, 12 - k * 2, 1);
      ell(g, BRASS[2], cx + 4, by - 4, 1, 1), ell(g, BRASS[2], cx - 4, by - 2, 1, 1);
      return true;
    // A safety lamp: brass foot, the glass and gauze, the hook on top.
    case "lamp":
      shadow(g, cx, by - 1, 4);
      r(g, BRASS[1], cx - 3, by - 5, 6, 4), r(g, BRASS[3], cx - 3, by - 5, 6, 1);
      r(g, "#d8e0d0", cx - 2, by - 12, 4, 7), r(g, "#8a9088", cx - 2, by - 12, 1, 7);
      if (!emptied) r(g, "#ffd060", cx, by - 9, 1, 2);
      r(g, BRASS[2], cx - 3, by - 14, 6, 2), r(g, BRASS[1], cx - 1, by - 17, 1, 3);
      return true;
    case "cage": {
      shadow(g, cx, by - 1, 5);
      r(g, BRASS[1], cx - 5, by - 3, 10, 2);
      for (let k = 0; k < 5; k++) r(g, BRASS[2], cx - 4 + k * 2, by - 13 + (k === 0 || k === 4 ? 2 : 0), 1, 10 - (k === 0 || k === 4 ? 2 : 0));
      r(g, BRASS[3], cx - 3, by - 14, 6, 1), r(g, BRASS[2], cx, by - 16, 1, 2);
      if (!emptied) r(g, "#f6d846", cx - 2, by - 8, 3, 3), r(g, "#f6d846", cx, by - 10, 2, 2), r(g, "#1a1a1a", cx + 1, by - 10, 1, 1), r(g, "#e8822a", cx + 2, by - 9, 1, 1);
      return true;
    }
    case "rucksack":
      if (emptied) return true;
      shadow(g, cx, by - 1, 6);
      r(g, LEATHER[2], cx - 5, by - 11, 10, 10), r(g, LEATHER[3], cx - 5, by - 11, 10, 1);
      r(g, LEATHER[1], cx - 5, by - 6, 10, 1);
      r(g, WOOD[1], cx - 6, by - 14, 1, 13), r(g, WOOD[1], cx + 5, by - 14, 1, 13);
      return true;
    case "powder":
      shadow(g, cx, by - 1, 6);
      r(g, WOOD[2], cx - 5, by - 13, 10, 12), r(g, WOOD[3], cx - 5, by - 13, 2, 12);
      for (const hy of [by - 12, by - 7, by - 3]) r(g, IRON[1], cx - 5, hy, 10, 1);
      r(g, "#1a1414", cx - 2, by - 10, 4, 2);
      return true;
    // El Tío: the horned owner of the mine's depths, in clay, with what the miners leave him.
    case "tio": {
      shadow(g, cx, by - 1, 7, 2);
      r(g, "#8a3424", cx - 5, by - 14, 10, 12), r(g, "#a84a30", cx - 5, by - 14, 3, 12);
      ell(g, "#b84a30", cx, by - 18, 4, 4);
      r(g, "#e8dcc0", cx - 4, by - 25, 1, 5), r(g, "#e8dcc0", cx + 3, by - 25, 1, 5);
      r(g, "#f0d040", cx - 2, by - 19, 1, 1), r(g, "#f0d040", cx + 1, by - 19, 1, 1);
      r(g, "#2a1008", cx - 2, by - 16, 4, 1), r(g, "#f0f0e8", cx + 2, by - 16, 3, 1);
      for (let k = 0; k < 5; k++) r(g, "#4a8a3a", cx - 6 + k * 3, by - 2, 2, 1);
      return true;
    }
    case "vein": {
      const lit = emptied ? O[0] : O[2];
      for (let k = 0; k < 18; k++) r(g, k % 4 === 0 ? (emptied ? O[0] : O[3]) : lit, cx - 9 + k, top + 2 + Math.round(k * 0.4 + Math.sin(k) * 1.2), 1, 2 + (k % 3 === 0 ? 1 : 0));
      return true;
    }
    case "fossil":
      r(g, css(p.face[0]), cx - 7, top - 2, 14, 12);
      r(g, "#9a948a", cx - 4, top + 8, 1, 1);
      for (let k = 0; k < 8; k++) r(g, "#a8a296", cx - 4 + k, top + 8 - k, 1, 1), r(g, "#8a847a", cx - 4 + k, top + 5 - k + (k % 2), 1, 2), r(g, "#8a847a", cx - 2 + k, top + 9 - k, 2, 1);
      return true;
    case "chalk":
      for (let k = 0; k < 5; k++) r(g, "#e8e4dc", cx - 7 + k * 2, top, 1, 5);
      r(g, "#e8e4dc", cx - 8, top + 2, 10, 1);
      r(g, "#e8e4dc", cx + 4, top - 1, 3, 1), r(g, "#e8e4dc", cx + 5, top, 1, 4);
      r(g, "#e8e4dc", cx - 6, top + 7, 9, 1);
      return true;
    case "barbara":
      r(g, "#0a0808", cx - 6, top - 4, 12, 15);
      r(g, css(p.face[3]), cx - 7, top - 5, 14, 1);
      r(g, "#a82828", cx - 2, top + 1, 4, 9), r(g, "#e8c890", cx - 1, top - 2, 2, 3), r(g, "#f0d040", cx - 2, top - 3, 4, 1);
      r(g, "#9a9488", cx + 3, top + 3, 2, 7), r(g, "#7a7468", cx + 3, top + 2, 1, 1);
      if (!emptied) r(g, "#e8dcb0", cx - 5, top + 7, 1, 3), r(g, "#ffd060", cx - 5, top + 5, 1, 2);
      return true;
    case "relief":
      r(g, "#8a8678", cx - 10, top - 4, 20, 15), r(g, "#c8c4b6", cx - 9, top - 3, 18, 13);
      for (const fx of [cx - 6, cx, cx + 5]) r(g, "#a8a496", fx - 1, top + 1, 3, 8), ell(g, "#a8a496", fx, top - 1, 1, 1), r(g, "#e4e0d4", fx - 1, top + 1, 1, 8);
      return true;
    case "crystals":
      ell(g, "#0c0a10", cx, top + 4, 7, 5);
      if (!emptied) for (let k = 0; k < 6; k++) r(g, k % 2 ? "#e8e0f8" : "#a890d0", cx - 5 + k * 2, top + 3 + (k % 3), 1, 4 - (k % 3)), r(g, "#ffffff", cx - 5 + k * 2, top + 3 + (k % 3), 1, 1);
      return true;
    case "board":
      r(g, WOOD[1], cx - 8, top - 3, 16, 12), r(g, "#1e2420", cx - 7, top - 2, 14, 10);
      for (let k = 0; k < 4; k++) r(g, "#d8d4c8", cx - 6, top + k * 2, 12 - (k * 3) % 7, 1);
      return true;
    case "wheel": {
      ell(g, "#0a0808", cx, top + 2, 13, 13);
      for (let a = 0; a < 16; a++) {
        const t = (a / 16) * Math.PI * 2;
        r(g, WOOD[2], Math.round(cx + Math.cos(t) * 11), Math.round(top + 2 + Math.sin(t) * 11), 2, 2);
      }
      for (let a = 0; a < 4; a++) {
        const t = (a / 4) * Math.PI;
        for (let k = -10; k <= 10; k += 2) r(g, WOOD[1], Math.round(cx + Math.cos(t) * k), Math.round(top + 2 + Math.sin(t) * k), 1, 1);
      }
      ell(g, WOOD[3], cx, top + 2, 2, 2);
      return true;
    }
  }
  return false;
}
