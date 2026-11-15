import type { ShipPalette } from "./palette";
import { h2, Raster } from "./raster";

/** A standing thing's sprite: drawn so its footprint's top-left sits at (ox, oy). */
export type ThingSprite = { r: Raster; ox: number; oy: number; smoke?: { x: number; y: number }[]; glow?: { x: number; y: number; color: number }[] };

const IRON = ["#7a7c86", "#55575f", "#3a3b42", "#26262c", "#16161a"];
const BRASS = ["#fff0b0", "#e8c060", "#b8862e", "#7c5422", "#4a3018"];
const WHITE = ["#ffffff", "#ecebe4", "#cfcdc4", "#a09e96", "#6c6a64"];
const CLAY = ["#d88a5a", "#b86a40", "#8e4e30", "#643624", "#40221a"];

/** A box seen square on with its top from above: top face, front face, edges lit and rolled. */
function box(R: Raster, x: number, y: number, w: number, d: number, hgt: number, top: readonly string[], front: readonly string[]) {
  R.fill(x, y, w, d, top[1]);
  R.fill(x, y, w, 1, top[0]);
  R.fill(x, y, 1, d, top[0]);
  R.fill(x, y + d - 1, w, 1, top[2]);
  R.fill(x, y + d, w, hgt, front[2]);
  R.fill(x, y + d, w, 1, front[1]);
  R.fill(x + w - 1, y + d, 1, hgt, front[3]);
  R.fill(x, y + d + hgt - 1, w, 1, front[4]);
}

/** An upright cylinder on an ellipse, lit from the upper left by its normal. */
function drum(R: Raster, cx: number, foot: number, rx: number, ry: number, hgt: number, ramp: readonly string[], lid?: readonly string[]) {
  for (let y = foot - hgt - ry; y <= foot + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
    const nx = (x - cx) / rx;
    if (Math.abs(nx) > 1) continue;
    const e = Math.sqrt(1 - nx * nx) * ry;
    const topY = foot - hgt;
    if (y < topY - e || y > foot + e) continue;
    const onTop = y <= topY + e && ((y - topY) / ry) ** 2 + nx * nx <= 1;
    if (onTop) {
      const rim = ((y - topY) / ry) ** 2 + nx * nx > 0.7;
      R.set(x, y, (lid ?? ramp)[rim ? (nx < 0 ? 1 : 2) : 1]);
    } else {
      const k = nx < -0.55 ? 0 : nx < -0.1 ? 1 : nx < 0.45 ? 2 : nx < 0.8 ? 3 : 4;
      R.set(x, y, ramp[k]);
    }
  }
}

export function paintThing(art: string, w: number, h: number, p: ShipPalette, v: number, year: number): ThingSprite | undefined {
  const W = w * 16, H = h * 16;
  const pad = 8;
  const make = (rise: number, extra = 0) => {
    const r = new Raster(W + pad * 2 + extra, H + rise + pad);
    const s: ThingSprite & { X: number; Y: number } = { r, ox: pad, oy: rise, X: pad, Y: rise };
    return s;
  };
  const wood = p.rail;
  switch (art) {
    case "mast-0":
    case "mast-1":
    case "mast-2":
    case "mast-foot": {
      const s = make(36);
      const { r, X, Y } = s;
      const cx = X + 8, foot = Y + 10;
      if (art !== "mast-foot") {
        // The fife rail round the mast, its pins, and the halyards coiled on them.
        box(r, X - 3, foot - 8, 22, 4, 3, wood, wood);
        for (let i = 0; i < 6; i++) r.fill(X - 2 + i * 4, foot - 11, 1, 3, wood[0]);
        for (const [dx, k] of [[-5, 0], [17, 1]] as const) for (let a = 0; a < Math.PI * 2; a += 0.3) r.set(X + dx + 3 + Math.cos(a) * 3, foot + 2 + Math.sin(a) * 2, (k + Math.floor(a * 2)) % 2 ? "#a8844c" : "#8a6a3c");
      }
      drum(r, cx, foot, art === "mast-foot" ? 5 : 4, 2, art === "mast-foot" ? 34 : 34, wood);
      if (art === "mast-foot") r.fill(cx - 7, foot - 1, 14, 3, wood[3]);
      return s;
    }
    case "wheel": {
      const s = make(30);
      const { r, X, Y } = s;
      const cx = X + 8, cy = Y - 6;
      r.fill(cx - 7, Y + 6, 14, 6, wood[3]);
      r.fill(cx - 2, cy, 4, Y + 8 - cy, wood[2]);
      r.fill(cx - 2, cy, 1, Y + 8 - cy, wood[1]);
      for (let a = 0; a < Math.PI * 2; a += 0.04) {
        r.set(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9, Math.cos(a) < -0.2 ? wood[0] : wood[2]);
        r.set(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, wood[3]);
      }
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + v;
        for (let d = 2; d < 13; d++) r.set(cx + Math.cos(a) * d, cy + Math.sin(a) * d, d > 9 ? wood[1] : wood[2]);
      }
      r.fill(cx - 2, cy - 2, 4, 4, BRASS[1]);
      r.set(cx - 1, cy - 1, BRASS[0]);
      return s;
    }
    case "whipstaff": {
      const s = make(30);
      const { r, X, Y } = s;
      box(r, X + 2, Y + 6, 12, 8, 6, wood, wood);
      r.fill(X + 6, Y - 18, 3, 26, wood[2]);
      r.fill(X + 6, Y - 18, 1, 26, wood[1]);
      r.fill(X + 4, Y - 20, 7, 3, wood[1]);
      return s;
    }
    case "tiller": {
      const s = make(18);
      const { r, X, Y } = s;
      // The rudder head and the long bar across the poop.
      drum(r, X + 6, Y + 18, 5, 3, 10, wood);
      r.fill(X + 6, Y + 6, 26, 4, wood[2]);
      r.fill(X + 6, Y + 6, 26, 1, wood[0]);
      r.fill(X + 6, Y + 9, 26, 1, wood[4]);
      r.fill(X + 30, Y + 4, 3, 8, wood[1]);
      return s;
    }
    case "hand-wheel": {
      const s = make(26);
      const { r, X, Y } = s;
      box(r, X + 4, Y + 6, 8, 4, 8, IRON, IRON);
      for (let a = 0; a < Math.PI * 2; a += 0.05) r.set(X + 8 + Math.cos(a) * 7, Y - 4 + Math.sin(a) * 7, Math.cos(a) < 0 ? wood[0] : wood[2]);
      for (let k = 0; k < 6; k++) for (let d = 1; d < 9; d++) r.set(X + 8 + Math.cos(k + v) * d, Y - 4 + Math.sin(k + v) * d, wood[2]);
      return s;
    }
    case "binnacle": {
      const s = make(22);
      const { r, X, Y } = s;
      box(r, X + 3, Y + 4, 10, 4, 10, wood, wood);
      drum(r, X + 8, Y + 4, 5, 2, 6, BRASS);
      r.fill(X + 5, Y - 4, 6, 3, "#f8e8a0");
      s.glow = [{ x: X + 8, y: Y - 2, color: 0xffd890 }];
      return s;
    }
    case "skylight": {
      const s = make(12);
      const { r, X, Y } = s;
      box(r, X + 2, Y + 2, W - 4, H - 10, 6, wood, wood);
      for (let i = 0; i < 4; i++) r.fill(X + 4 + i * ((W - 8) / 4), Y + 4, (W - 8) / 4 - 2, H - 14, "#5a7a88");
      for (let i = 0; i < 4; i++) r.fill(X + 4 + i * ((W - 8) / 4), Y + 4, 2, 1, "#c8e0e4");
      s.glow = [{ x: X + W / 2, y: Y + H / 2 - 4, color: 0xffc070 }];
      return s;
    }
    case "breast-rail": {
      const s = make(14);
      const { r, X, Y } = s;
      // A turned rail across the deck: posts, balusters and a capping.
      r.fill(X + 5, Y - 6, 6, 3, wood[1]);
      r.fill(X + 5, Y - 6, 6, 1, wood[0]);
      for (let k = 0; k < 2; k++) {
        r.fill(X + 6 + k * 3, Y - 3, 2, 18, k ? wood[2] : wood[1]);
        r.set(X + 6 + k * 3, Y + 4, wood[0]);
      }
      r.fill(X + 5, Y + 14, 6, 2, wood[3]);
      return s;
    }
    case "capstan": {
      const s = make(18);
      const { r, X, Y } = s;
      drum(r, X + 8, Y + 12, 6, 3, 12, wood);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + v;
        for (let d = 6; d < 13; d++) r.set(X + 8 + Math.cos(a) * d, Y + 0 + Math.sin(a) * d * 0.5, wood[d > 10 ? 1 : 2]);
      }
      r.fill(X + 6, Y - 2, 4, 2, wood[0]);
      return s;
    }
    case "pump": {
      const s = make(18);
      const { r, X, Y } = s;
      drum(r, X + 5, Y + 12, 3, 2, 14, wood);
      drum(r, X + 11, Y + 12, 3, 2, 14, wood);
      r.fill(X + 1, Y - 4, 14, 2, IRON[2]);
      r.fill(X + 1, Y - 4, 14, 1, IRON[0]);
      return s;
    }
    case "scuttlebutt":
    case "cask": {
      const s = make(14);
      const { r, X, Y } = s;
      drum(r, X + 8, Y + 12, 6, 3, 12, wood, ["#5a3e2a", "#3e2a1e", "#2e1e16"]);
      for (const hy of [Y + 3, Y + 9]) for (let x = X + 2; x <= X + 14; x++) r.set(x, hy + Math.round(Math.sqrt(Math.max(0, 1 - ((x - X - 8) / 6) ** 2)) * 3), IRON[2]);
      if (art === "scuttlebutt") r.fill(X + 12, Y - 2, 3, 3, IRON[1]);
      return s;
    }
    case "boat": {
      const s = make(14);
      const { r, X, Y } = s;
      // A ship's boat on its chocks, seen from above with its near side showing.
      const L = W - 4, D = H - 10;
      for (let i = 0; i < L; i++) {
        const t = i / (L - 1), half = Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 6)) * (D / 2);
        const cy = Y + 2 + D / 2;
        for (let y = Math.round(cy - half); y <= Math.round(cy + half); y++) r.set(X + 2 + i, y, y <= cy - half + 1 ? wood[1] : "#7a5a3c");
        for (let y = Math.round(cy + half); y < Math.round(cy + half) + 6; y++) r.set(X + 2 + i, y, y < cy + half + 2 ? "#f2eee0" : y < cy + half + 4 ? "#2a2c34" : "#d4c8a8");
        if (i % 12 === 6) for (let y = Math.round(cy - half + 2); y < cy + half; y++) r.set(X + 2 + i, y, wood[2]);
      }
      for (let k = 0; k < 3; k++) r.fill(X + 8 + k * 10, Y + D + 6, 4, 4, wood[3]);
      r.fill(X + 6, Y + 3 + D / 2 - 1, L - 12, 2, wood[0]);
      return s;
    }
    case "coop": {
      const s = make(14);
      const { r, X, Y } = s;
      box(r, X + 1, Y + 2, W - 2, 6, 10, wood, wood);
      for (let x = X + 3; x < X + W - 3; x += 3) r.fill(x, Y + 9, 1, 8, wood[4]);
      // Hens looking out between the slats.
      for (let k = 0; k < 3; k++) {
        const hx = X + 5 + k * 9 + Math.round(v * 3);
        r.fill(hx, Y + 11, 3, 3, k % 2 ? "#a86a3a" : "#f4eedc");
        r.set(hx + 1, Y + 10, "#c8342a");
        r.set(hx + 3, Y + 12, "#e8a83a");
      }
      return s;
    }
    case "stove": {
      const s = make(22);
      const { r, X, Y } = s;
      box(r, X + 2, Y + 2, W - 4, 6, 12, IRON, IRON);
      r.fill(X + 6, Y + 12, 6, 4, "#e8742c");
      r.fill(X + 7, Y + 13, 4, 2, "#ffc858");
      r.fill(X + W - 10, Y - 14, 4, 18, IRON[2]);
      r.fill(X + W - 10, Y - 14, 1, 18, IRON[0]);
      s.smoke = [{ x: X + W - 8, y: Y - 15 }];
      s.glow = [{ x: X + 9, y: Y + 14, color: 0xff8030 }];
      return s;
    }
    case "gun":
    case "gun-below": {
      const s = make(12);
      const { r, X, Y } = s;
      // A carriage gun run out: red carriage, iron barrel pointing outboard.
      box(r, X + 3, Y + 4, 10, 6, 4, ["#c8543c", "#a83e2c", "#82302a", "#5e2420", "#3c1818"], ["#c8543c", "#a83e2c", "#82302a", "#5e2420", "#3c1818"]);
      r.fill(X + 5, Y - 2, 6, 12, IRON[2]);
      r.fill(X + 5, Y - 2, 2, 12, IRON[1]);
      r.fill(X + 6, Y - 3, 4, 2, IRON[3]);
      r.fill(X + 4, Y + 14, 3, 2, IRON[3]);
      r.fill(X + 9, Y + 14, 3, 2, IRON[3]);
      return s;
    }
    case "belfry": {
      const s = make(28);
      const { r, X, Y } = s;
      r.fill(X + 2, Y - 18, 2, 30, wood[2]);
      r.fill(X + 12, Y - 18, 2, 30, wood[3]);
      r.fill(X, Y - 22, 16, 4, wood[1]);
      r.fill(X, Y - 22, 16, 1, wood[0]);
      // The ship's bell, rung every half hour of the watch.
      for (let y = 0; y < 9; y++) r.fill(X + 8 - 1 - y * 0.35, Y - 16 + y, 2 + y * 0.7, 1, y < 2 ? BRASS[1] : y > 6 ? BRASS[3] : BRASS[2]);
      r.set(X + 6, Y - 14, BRASS[0]);
      r.fill(X + 1, Y + 10, 14, 3, wood[3]);
      return s;
    }
    case "windlass": {
      const s = make(14);
      const { r, X, Y } = s;
      box(r, X + 1, Y + 6, 4, 4, 8, wood, wood);
      box(r, X + W - 5, Y + 6, 4, 4, 8, wood, wood);
      for (let x = X + 5; x < X + W - 5; x++) {
        r.fill(x, Y + 6, 1, 8, (x % 6) < 3 ? wood[1] : wood[2]);
        r.set(x, Y + 6, wood[0]);
      }
      // The anchor cable, led forward.
      for (let x = X + 10; x < X + W + 8; x++) r.set(x, Y + 12 + ((x >> 1) % 2), "#3a3430");
      return s;
    }
    case "galley-house":
    case "junk-house":
    case "house":
      return paintHouse(art, w, h, p, v, year);
    case "washing": {
      const s = make(30);
      const { r, X, Y } = s;
      r.fill(X, Y - 22, 2, 36, wood[2]);
      r.fill(X + W - 2, Y - 22, 2, 36, wood[3]);
      for (let x = X; x < X + W; x++) r.set(x, Y - 20 + Math.round(Math.sin(((x - X) / W) * Math.PI) * 3), "#6a5a48");
      const cloth = ["#e8e2d0", "#b84a3a", "#4a6a8a", "#d8c890", "#f2ede0", "#6a8a5a"];
      for (let k = 0; k < Math.floor(W / 10); k++) {
        const cx = X + 4 + k * 10, sag = Math.round(Math.sin(((cx - X) / W) * Math.PI) * 3);
        const c = cloth[(k + Math.floor(v * 6)) % cloth.length];
        r.fill(cx, Y - 19 + sag, 7, k % 2 ? 9 : 12, c);
        r.fill(cx, Y - 19 + sag, 7, 1, "#ffffff");
        r.fill(cx + 6, Y - 18 + sag, 1, k % 2 ? 8 : 11, "#00000022");
      }
      return s;
    }
    case "trunks": {
      const s = make(12);
      const { r, X, Y } = s;
      const cols = [["#8a5a34", "#6e4428", "#52321e"], ["#4a5a6a", "#384654", "#283440"], ["#9a7448", "#7c5a36", "#5a4026"]];
      for (let k = 0; k < Math.max(1, Math.floor(W / 14)); k++) {
        const c = cols[(k + Math.floor(v * 3)) % 3];
        box(r, X + 1 + k * 14, Y + 4 + (k % 2) * 2, 12, 5, 7, [c[0], c[1], c[2], c[2], c[2]], [c[0], c[1], c[1], c[2], c[2]]);
        r.fill(X + 5 + k * 14, Y + 10 + (k % 2) * 2, 4, 2, BRASS[2]);
      }
      return s;
    }
    case "shrine": {
      const s = make(26);
      const { r, X, Y } = s;
      const lac = ["#e05a44", "#c23c2e", "#982a24", "#6a1e1c", "#401416"];
      box(r, X + 1, Y + 4, 14, 4, 10, lac, lac);
      // The little house of Mazu with her figure inside.
      r.fill(X + 3, Y - 14, 10, 18, lac[2]);
      r.fill(X - 1, Y - 17, 18, 4, "#2a2a30");
      r.fill(X - 1, Y - 17, 18, 1, "#5a5a64");
      r.fill(X + 5, Y - 11, 6, 12, "#2a1414");
      r.fill(X + 6, Y - 9, 4, 8, BRASS[1]);
      r.fill(X + 7, Y - 10, 2, 2, "#f4d8b8");
      r.fill(X + 6, Y + 2, 4, 2, BRASS[2]);
      s.smoke = [{ x: X + 8, y: Y }];
      s.glow = [{ x: X + 8, y: Y - 4, color: 0xff9a50 }];
      return s;
    }
    case "crates":
    case "porcelain":
    case "bales":
    case "sacks": {
      const s = make(16);
      const { r, X, Y } = s;
      const n = Math.max(1, Math.round(W / 16)) * Math.max(1, h);
      for (let k = 0; k < n; k++) {
        const cx = X + (k % Math.round(W / 16)) * 16, cy = Y + Math.floor(k / Math.round(W / 16)) * 16;
        if (art === "sacks") {
          for (const [dx, dy] of [[1, 6], [8, 4], [3, -2]]) {
            const c = ["#b8925a", "#a07c48", "#84643a"];
            for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) if (((x - 4) / 4.5) ** 2 + ((y - 4) / 4.5) ** 2 < 1) r.set(cx + dx + x, cy + dy + y, (x + y) % 3 === 0 ? c[2] : y < 3 ? c[0] : c[1]);
          }
        } else if (art === "bales") {
          box(r, cx + 1, cy + 2, 14, 6, 8, ["#d8c8a0", "#c4b088", "#a8946c", "#82704e", "#5a4c38"], ["#d8c8a0", "#c4b088", "#a8946c", "#82704e", "#5a4c38"]);
          r.fill(cx + 5, cy + 2, 1, 14, "#6a5038");
          r.fill(cx + 10, cy + 2, 1, 14, "#6a5038");
        } else {
          box(r, cx + 1, cy + 1, 14, 6, 9, wood, wood);
          r.fill(cx + 1, cy + 11, 14, 1, wood[3]);
          if (art === "porcelain") {
            // Blue-and-white bowls stacked in the open crate, packed in tea.
            r.fill(cx + 2, cy + 2, 12, 4, "#5a4430");
            for (let i = 0; i < 3; i++) {
              r.fill(cx + 3 + i * 4, cy + 1, 3, 3, "#f2f4f6");
              r.set(cx + 4 + i * 4, cy + 2, "#2c4c9c");
            }
          } else {
            // Matting lashed over the top.
            r.fill(cx + 2, cy + 1, 12, 5, "#c8a868");
            for (let i = cx + 2; i < cx + 14; i += 2) r.set(i, cy + 3, "#a88848");
          }
        }
      }
      return s;
    }
    case "jars": {
      const s = make(18);
      const { r, X, Y } = s;
      for (let k = 0; k < Math.max(1, w); k++) {
        // Big glazed storage jars for water and pickles.
        const cx = X + 8 + k * 16;
        for (let y = 0; y < 18; y++) {
          const t = y / 17, rr = Math.round(2 + Math.sin(Math.min(1, t * 1.15) * Math.PI) * 5.5);
          for (let x = -rr; x <= rr; x++) {
            const nx = x / Math.max(1, rr);
            r.set(cx + x, Y - 4 + y, nx < -0.5 ? "#8a6a3c" : nx < 0.1 ? "#6e5230" : nx < 0.6 ? "#523c24" : "#3a2a1a");
          }
        }
        r.fill(cx - 3, Y - 5, 6, 2, "#3a2a1a");
        r.set(cx - 3, Y + 1, "#c8a870");
        r.set(cx - 3, Y + 2, "#b0905a");
      }
      return s;
    }
    case "hearth":
    case "sand-hearth": {
      const s = make(14);
      const { r, X, Y } = s;
      if (art === "hearth") box(r, X + 1, Y + 2, W - 2, 8, 8, CLAY, CLAY);
      else {
        box(r, X + 1, Y + 2, W - 2, 8, 8, wood, wood);
        r.fill(X + 3, Y + 3, W - 6, 6, "#d8c494");
      }
      r.fill(X + 6, Y + 4, 6, 3, "#e8742c");
      r.fill(X + 7, Y + 5, 3, 1, "#ffd060");
      if (art === "hearth") {
        // A wok on the fire.
        for (let x = -6; x <= 6; x++) r.set(X + W - 10 + x, Y + 2 + Math.round((x * x) / 12), IRON[2]);
        r.fill(X + W - 16, Y + 1, 13, 1, IRON[1]);
      } else {
        drum(r, X + W - 9, Y + 8, 4, 2, 5, ["#e8a070", "#c8784a", "#a05a36", "#783e26", "#4e281a"]);
      }
      s.smoke = [{ x: X + 9, y: Y + 2 }];
      s.glow = [{ x: X + 9, y: Y + 5, color: 0xff8030 }];
      return s;
    }
    case "water-tank": {
      const s = make(14);
      const { r, X, Y } = s;
      box(r, X + 1, Y + 2, W - 2, 6, 9, wood, wood);
      for (let x = X + 4; x < X + W - 2; x += 8) r.fill(x, Y + 8, 1, 9, wood[4]);
      return s;
    }
    case "vent": {
      const s = make(24);
      const { r, X, Y } = s;
      // A cowl ventilator: a pipe with a bell mouth turned to the wind, red inside.
      drum(r, X + 8, Y + 12, 3, 2, 18, WHITE);
      for (let y = 0; y < 9; y++) for (let x = 0; x < 11; x++) {
        const d = ((x - 5) / 5.5) ** 2 + ((y - 4) / 4.5) ** 2;
        if (d <= 1) r.set(X + 3 + x, Y - 12 + y, d < 0.45 ? "#9a2a24" : d < 0.65 ? "#c84a3a" : x < 5 ? WHITE[0] : WHITE[2]);
      }
      return s;
    }
    case "bollard": {
      const s = make(10);
      const { r, X, Y } = s;
      drum(r, X + 5, Y + 12, 3, 2, 8, IRON);
      drum(r, X + 11, Y + 12, 3, 2, 8, IRON);
      return s;
    }
    case "ladder": {
      const s = make(30);
      const { r, X, Y } = s;
      // Daylight through the hatch above, and the ladder up into it.
      r.fill(X + 1, Y - 26, 14, 6, "#d8e8ec");
      r.fill(X + 2, Y - 25, 12, 4, "#f4fbfc");
      r.fill(X + 3, Y - 22, 2, 36, wood[2]);
      r.fill(X + 11, Y - 22, 2, 36, wood[3]);
      for (let y = Y - 18; y < Y + 12; y += 5) r.fill(X + 3, y, 10, 2, wood[1]);
      return s;
    }
    case "ladder-down": {
      const s = make(4);
      const { r, X, Y } = s;
      r.fill(X + 1, Y + 1, 14, 14, wood[3]);
      r.fill(X + 3, Y + 3, 10, 10, "#0e0a0a");
      for (let y = Y + 5; y < Y + 13; y += 3) r.fill(X + 5, y, 6, 1, wood[2]);
      return s;
    }
    case "hammock": {
      const s = make(20);
      const { r, X, Y } = s;
      // Slung from the beams, a sleeper's shape in the canvas.
      for (let x = 0; x < W; x++) {
        const sag = Math.round(Math.sin((x / (W - 1)) * Math.PI) * 5);
        for (let y = 0; y < 7; y++) r.set(X + x, Y - 12 + sag + y, y === 0 ? "#efe6cc" : y < 4 ? "#d8cba8" : "#b0a080");
      }
      r.fill(X + 6, Y - 10, 10, 3, "#8a6a52");
      r.fill(X, Y - 16, 1, 6, "#6a5a48");
      r.fill(X + W - 1, Y - 16, 1, 6, "#6a5a48");
      return s;
    }
    case "mess-table":
    case "table": {
      const s = make(12);
      const { r, X, Y } = s;
      box(r, X + 1, Y + 3, W - 2, Math.max(6, H - 14), 4, wood, wood);
      for (let x = X + 4; x < X + W - 4; x += 10) {
        r.fill(x, Y + 3 + Math.max(6, H - 14) + 4, 2, 6, wood[3]);
        r.fill(x + 2, Y + 4, 4, 2, k(x) ? "#d8d4c8" : "#8a8a92");
      }
      return s;
    }
    case "berth": {
      const s = make(26);
      const { r, X, Y } = s;
      // Two tiers of bunks, each with somebody's blanket.
      r.fill(X, Y - 18, W, 32, wood[3]);
      for (const [ty, c] of [[Y - 16, "#6a3a3a"], [Y - 1, "#3a4a6a"]] as const) {
        r.fill(X + 2, ty, W - 4, 12, "#2a1e18");
        r.fill(X + 2, ty + 6, W - 4, 6, c);
        r.fill(X + 2, ty + 6, W - 4, 1, "#ffffff22");
        r.fill(X + 3, ty + 3, 6, 3, "#e8e0cc");
        r.fill(X, ty + 12, W, 2, wood[1]);
      }
      r.fill(X, Y - 18, 2, 32, wood[2]);
      r.fill(X + W - 2, Y - 18, 2, 32, wood[4]);
      return s;
    }
    case "chest": {
      const s = make(10);
      const { r, X, Y } = s;
      box(r, X + 2, Y + 4, 12, 4, 7, wood, wood);
      r.fill(X + 6, Y + 9, 4, 2, BRASS[2]);
      return s;
    }
    case "bulkhead": {
      const s = make(26);
      const { r, X, Y } = s;
      r.fill(X, Y - 22, 16, 38, wood[2]);
      for (let x = X; x < X + 16; x += 4) r.fill(x, Y - 22, 1, 38, wood[3]);
      r.fill(X, Y - 22, 16, 2, wood[1]);
      r.fill(X, Y + 14, 16, 2, wood[4]);
      return s;
    }
    case "boiler": {
      const s = make(30);
      const { r, X, Y } = s;
      // A Scotch boiler's round front, three furnace doors glowing.
      const cx = X + W / 2, cy = Y + H / 2 - 6, R2 = Math.min(W, H + 20) / 2 - 2;
      for (let y = -R2; y <= R2; y++) for (let x = -R2; x <= R2; x++) {
        const d = Math.hypot(x, y) / R2;
        if (d > 1) continue;
        r.set(cx + x, cy + y, d > 0.92 ? IRON[3] : d > 0.86 ? IRON[1] : x + y < -R2 * 0.6 ? IRON[1] : IRON[2]);
        if (d > 0.8 && d < 0.86 && ((Math.atan2(y, x) * 8) | 0) % 2 === 0) r.set(cx + x, cy + y, IRON[0]);
      }
      for (let k = -1; k <= 1; k++) {
        const fx = cx + k * 14 - 4, fy = cy + 6;
        r.fill(fx - 1, fy - 1, 10, 9, IRON[3]);
        r.fill(fx, fy, 8, 7, "#e86a24");
        r.fill(fx + 1, fy + 1, 6, 3, "#ffc050");
        r.fill(fx + 2, fy + 1, 3, 1, "#fff0b0");
      }
      r.fill(cx - R2, Y + H + 2, R2 * 2, 4, IRON[3]);
      s.glow = [-1, 0, 1].map((k) => ({ x: cx + k * 14, y: cy + 10, color: 0xff7020 }));
      return s;
    }
    case "engine": {
      const s = make(30);
      const { r, X, Y } = s;
      for (let k = 0; k < 3; k++) {
        const cx = X + 12 + k * 30;
        drum(r, cx, Y + 26, 10, 4, 34, IRON, ["#9a9ca6", "#7a7c86", "#55575f"]);
        r.fill(cx - 2, Y - 10, 4, 6, BRASS[1]);
      }
      r.fill(X + 2, Y + 40, W - 4, 8, IRON[3]);
      for (let x = X + 6; x < X + W - 6; x += 6) r.fill(x, Y + 42, 3, 3, BRASS[2]);
      return s;
    }
    case "coal": {
      const s = make(10);
      const { r, X, Y } = s;
      for (let y = 0; y < 14; y++) for (let x = 0; x < W; x++) {
        const top = 14 - Math.sin((x / W) * Math.PI) * 12 - h2(x >> 1, 3, 11) * 3;
        if (y + 2 >= top) r.set(X + x, Y + y, h2(x, y, 5) < 0.12 ? "#5a5a66" : h2(x >> 1, y >> 1, 9) < 0.5 ? "#1a1a20" : "#26262e");
      }
      return s;
    }
  }
  return undefined;
}

const k = (x: number) => x % 20 < 10;

/** Deckhouses: walls square on, roofs from above, as the buildings are drawn. */
function paintHouse(art: string, w: number, h: number, p: ShipPalette, v: number, year: number): ThingSprite {
  const W = w * 16, H = h * 16, pad = 8;
  const wall = art === "house" ? 38 : art === "junk-house" ? 26 : 16;
  const roofD = H - wall;
  const extra = art === "house" ? 110 : 26;
  const r = new Raster(W + pad * 2, H + wall + extra + pad);
  const X = pad, Y = extra + 8;
  const s: ThingSprite = { r, ox: pad, oy: Y, smoke: [], glow: [] };
  const front = Y + roofD;
  if (art === "junk-house") {
    // A curved roof of matting over a lacquered cabin, red lanterns at the eaves.
    const roof = ["#e8c27a", "#d0a660", "#b08648", "#865f34", "#5a3e24"];
    for (let x = 0; x < W + 4; x++) {
      const t = x / (W + 3), lift = Math.round(Math.abs(t - 0.5) ** 2 * 10);
      for (let y = -lift; y < roofD + 2; y++) {
        const yy = Y - 4 + y;
        r.set(X - 2 + x, yy, y < 1 - lift ? roof[0] : (x % 6 === 0 ? roof[3] : y > roofD - 2 ? roof[3] : (y + x) % 9 === 0 ? roof[2] : roof[1]));
      }
    }
    for (let x = 0; x < W; x++) for (let y = 0; y < wall; y++) {
      const post = x % 24 < 3;
      r.set(X + x, front + 2 + y, post ? p.band![2] : y < 3 ? p.band![3] : (x % 24 > 6 && x % 24 < 20 && y > 6 && y < 18) ? ((x + y) % 4 === 0 ? "#3a2a1e" : "#f0d8a0") : p.house[2]);
    }
    for (const lx of [X + 4, X + W - 8]) {
      r.fill(lx, front + 4, 5, 7, "#e0402c");
      r.fill(lx + 1, front + 5, 3, 1, "#ff9a6a");
      r.fill(lx + 2, front + 11, 1, 2, "#e8c060");
      s.glow!.push({ x: lx + 2, y: front + 7, color: 0xff6a3a });
    }
    r.fill(X + W / 2 - 5, front + 8, 10, wall - 8, "#3a2418");
    return s;
  }
  if (art === "galley-house") {
    box(r, X, Y, W, roofD, wall, ["#5a5a62", "#4a4a52", "#3a3a42", "#2a2a30", "#1a1a20"], p.house);
    r.fill(X + 6, front + 6, 10, wall - 6, "#5a3e2a");
    r.fill(X + W - 18, front + 6, 10, 8, "#2c3440");
    r.fill(X + W - 14, Y - 14, 4, 16, "#3a3a42");
    s.smoke!.push({ x: X + W - 12, y: Y - 15 });
    s.glow!.push({ x: X + W - 13, y: front + 10, color: 0xffb060 });
    return s;
  }
  // The steamer's midships house: white steel, portholes, a boat deck on the roof, the funnel.
  const steel = p.house;
  for (let x = 0; x < W; x++) for (let y = 0; y < wall; y++) {
    let c = y < 2 ? steel[1] : y > wall - 3 ? steel[3] : steel[2];
    if (x === W - 1) c = steel[3];
    r.set(X + x, front + y, c);
  }
  for (let x = X + 8; x < X + W - 8; x += 12) {
    const doorHere = (x - X) % 72 === 32;
    if (doorHere) {
      r.fill(x, front + 8, 8, wall - 8, "#8a6a4a");
      r.fill(x + 1, front + 9, 6, 1, "#a88a64");
      continue;
    }
    for (const py of [front + 8, front + 19]) {
      r.fill(x, py, 4, 4, BRASS[2]);
      r.fill(x + 1, py + 1, 2, 2, "#2c3848");
      r.set(x, py, BRASS[0]);
    }
  }
  s.glow!.push(...[0.25, 0.5, 0.75].map((t) => ({ x: X + W * t, y: front + 12, color: 0xffd890 })));
  // The roof: a planked boat deck with a white rail.
  for (let x = 0; x < W; x++) for (let y = 0; y < roofD; y++) {
    const edge = Math.min(x, W - 1 - x, y, roofD - 1 - y);
    r.set(X + x, Y + y, edge < 3 ? steel[edge === 0 ? 3 : edge === 1 ? 1 : 0] : y % 4 === 3 ? p.deck[3] : p.deck[(x + y * 7) % 23 === 0 ? 3 : 2]);
  }
  for (let x = 0; x < W; x++) {
    r.set(X + x, Y, steel[0]);
    r.set(X + x, Y - 4, steel[1]);
    if (x % 6 === 0) r.fill(X + x, Y - 4, 1, 4, steel[2]);
  }
  // Lifeboats on their chocks, both sides.
  for (const by of [Y + 2, Y + roofD - 12]) for (let k2 = 0; k2 < 2; k2++) {
    const bx = X + 10 + k2 * (W / 2 - 6);
    for (const dx of [4, 40]) r.fill(bx + dx, by - 2, 2, 14, "#3a3a40");
    for (let i = 0; i < 46; i++) {
      const t = i / 45, half = Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 6)) * 6;
      for (let y = -half; y <= half + 2; y++) r.set(bx + i, by + 5 + y, y > half ? "#00000040" : y < -half + 1 ? "#ffffff" : y > half - 1.5 ? "#b8bcb8" : "#f0eee6");
    }
    r.fill(bx + 5, by + 4, 36, 3, "#c8b898");
    r.fill(bx + 5, by + 4, 36, 1, "#e0d4b8");
  }
  // The bridge forward: a wheelhouse with windows looking ahead.
  box(r, X + W - 26, Y + 6, 22, roofD - 12, 10, steel, steel);
  for (let k2 = 0; k2 < 4; k2++) r.fill(X + W - 24 + k2 * 5, Y + roofD - 4, 3, 5, "#2c3848");
  // Funnel: a cylinder in the company's colours, smoke from the top.
  const companies = [["#c8402c", "#a83224", "#802620"], ["#e0c088", "#c8a468", "#a6844c"], ["#2a2a30", "#1c1c22", "#121216"], ["#f2f2ec", "#d8d8d2", "#b0b0aa"]];
  const co = companies[Math.floor(v * companies.length)];
  const funnels = year >= 1890 && W > 180 ? 2 : 1;
  for (let f = 0; f < funnels; f++) {
    const fx = X + (funnels === 2 ? W * (0.36 + f * 0.26) : W * 0.48), foot = Y + roofD / 2 + 4, rx = 11, top = 74;
    for (let y = foot - top; y <= foot + 3; y++) for (let x = -rx; x <= rx; x++) {
      const nx = x / rx;
      const e = Math.sqrt(1 - nx * nx) * 4;
      if (y > foot + e) continue;
      const band = foot - y > top - 14 ? 2 : foot - y > top - 18 ? 3 : 0;
      const ramp = band === 2 ? ["#3a3a40", "#26262c", "#16161a"] : band === 3 ? ["#f2f2ec", "#d8d8d2", "#b0b0aa"] : co;
      r.set(fx + x, y, ramp[nx < -0.4 ? 0 : nx < 0.5 ? 1 : 2]);
    }
    for (let x = -rx; x <= rx; x++) {
      const e = Math.sqrt(1 - (x / rx) ** 2) * 4;
      for (let y = -e; y <= e; y++) r.set(fx + x, foot - top + y, Math.abs(y) > e - 1.2 ? "#3a3a40" : "#0c0c0e");
    }
    s.smoke!.push({ x: fx, y: foot - top - 2 });
  }
  return s;
}
