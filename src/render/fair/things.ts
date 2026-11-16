import { box, drum } from "../ship/things";
import { h2, Raster } from "../ship/raster";

/** A sprite for a cell-sized thing: its footprint's top-left sits at (ox, oy) in the raster. */
export type FairSprite = { r: Raster; ox: number; oy: number; glow?: { x: number; y: number }[] };

const WOOD = ["#d8a878", "#b8875a", "#946640", "#6e4a2e", "#4a301e"];
const DARKWOOD = ["#9a6a4a", "#7a5036", "#5e3a26", "#44281a", "#2c1a12"];
const BRASS = ["#fff0b0", "#e8c060", "#b8862e", "#7c5422", "#4a3018"];
const IRON = ["#8a8e98", "#6a6e78", "#4e525c", "#363a42", "#22252c"];
const GREEN = ["#9ec08a", "#6e9a5a", "#4e7a40", "#36582e", "#223a1e"];
const STONE = ["#f4f0e6", "#dcd6c8", "#bcb4a2", "#968e7e", "#6a6458"];
const GLASS = ["#eaf6fa", "#c4e0ea", "#98c4d4", "#6a9cb4", "#4a7690"];
const RED = ["#f08a70", "#d0583e", "#a83c2e", "#7a2a24", "#4c1c1a"];
const IRONRED = ["#c07a5a", "#a05a40", "#844630", "#5e3022", "#3a1e18"];

/** Five steps of a tint, light to dark. */
function ramp(hex: string) {
  const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const step = (k: number) => "#" + c.map((v) => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k) + (k < -0.2 ? 18 : 0) * -k).toString(16).padStart(2, "0")).join("");
  return [step(0.4), step(0.15), step(0), step(-0.3), step(-0.55)];
}

export function paintFairThing(art: string, w: number, h: number, v: number, tint?: string): FairSprite | undefined {
  const W = w * 16, H = h * 16, pad = 6;
  const make = (rise: number): FairSprite & { X: number; Y: number } => ({ r: new Raster(W + pad * 2, H + rise + pad), ox: pad, oy: rise, X: pad, Y: rise });
  const t = tint ? ramp(tint) : undefined;
  const block = (rise: number, top: readonly string[], front: readonly string[], inset = 1) => {
    const s = make(rise);
    box(s.r, s.X + inset, s.Y + 3 - rise, W - inset * 2, H - 4, rise, top, front);
    return s;
  };
  switch (art) {
    case "vitrine": {
      // A glazed case on a plinth, its goods in rows behind the glass.
      const s = block(16, GLASS, DARKWOOD);
      const { r, X, Y } = s;
      r.fill(X + 2, Y - 12, W - 4, 8, GLASS[2]);
      const goods = t ?? BRASS;
      for (let i = 0; i < W - 8; i += 4) {
        r.fill(X + 4 + i, Y - 9, 3, 2, goods[1 + (i % 8 ? 0 : 1)]);
        r.set(X + 4 + i, Y - 9, goods[0]);
      }
      r.fill(X + 2, Y - 13, W - 4, 1, GLASS[0]);
      for (let k = 0; k < 4; k++) r.set(X + 4 + k, Y - 12 + k, "#ffffff");
      r.fill(X + 1, Y + 4, W - 2, 1, BRASS[2]);
      return s;
    }
    case "counter": {
      const s = block(10, WOOD, DARKWOOD);
      const { r, X, Y } = s, goods = t ?? RED;
      for (let i = 0; i < W - 8; i += 6) {
        r.fill(X + 4 + i, Y - 9, 4, 3, goods[2]);
        r.fill(X + 4 + i, Y - 9, 4, 1, goods[0]);
      }
      r.fill(X + 2, Y + 4, W - 4, 2, goods[1]);
      return s;
    }
    case "bales":
    case "sacks": {
      const s = make(14), { r, X, Y } = s, c = t ?? (art === "bales" ? ["#f4ead4", "#e0d0b0", "#c4b08a", "#9a8664", "#6a5a44"] : ["#d8c49a", "#c4ab7c", "#a48a5e", "#7c6444", "#54422e"]);
      for (let k = 0; k < Math.max(2, W / 9); k++) {
        const x = X + 2 + k * 8 + (k % 2) * 2, y = Y + 10 - (k % 2) * 6;
        box(r, x, y - 6, 9, 4, art === "bales" ? 7 : 6, c, c);
        if (art === "sacks") r.fill(x + 3, y - 7, 3, 2, c[3]);
        else r.fill(x, y - 1, 9, 1, IRON[2]);
      }
      return s;
    }
    case "barrels": {
      const s = make(14), { r, X, Y } = s;
      for (let k = 0; k < Math.max(2, W / 7); k++) {
        drum(r, X + 5 + k * 7, Y + 11, 3, 2, 9, WOOD, DARKWOOD);
        r.fill(X + 2 + k * 7, Y + 5, 7, 1, IRON[3]);
      }
      if (t) r.fill(X + 3, Y - 2, W - 6, 2, t[2]);
      return s;
    }
    case "ingots": {
      const s = block(5, STONE, STONE), { r, X, Y } = s, metal = t ?? BRASS;
      for (let i = 0; i < W - 8; i += 5) for (let j = 0; j < 2; j++) {
        r.fill(X + 4 + i + j * 2, Y - 3 - j * 3, 4, 2, metal[1]);
        r.set(X + 4 + i + j * 2, Y - 3 - j * 3, metal[0]);
        r.fill(X + 4 + i + j * 2, Y - 1 - j * 3, 4, 1, metal[3]);
      }
      return s;
    }
    case "statue": {
      const s = make(40), { r, X, Y } = s, m = t ?? (v < 0.5 ? STONE : ["#8ab0a0", "#5e8a7a", "#46705e", "#2e5040", "#1c3428"]);
      box(r, X + 2, Y - 8, W - 4, 4, 10, STONE, STONE);
      const cx = X + W / 2;
      // A standing figure, lit down its left side, one arm raised.
      drum(r, cx, Y - 9, 3, 1, 14, m);
      drum(r, cx, Y - 23, 2.5, 1, 6, m);
      drum(r, cx, Y - 29, 2, 1.5, 3, m);
      r.fill(cx + 3, Y - 34, 2, 10, m[2]);
      r.fill(cx - 5, Y - 22, 2, 7, m[1]);
      r.fill(cx - 3, Y - 12, 6, 3, m[1]);
      return s;
    }
    case "vase": {
      const s = make(26), { r, X, Y } = s, m = t ?? ["#a8c8f0", "#6a98d8", "#3e6ab0", "#2a4a84", "#1a2e58"];
      box(r, X + 3, Y - 4, W - 6, 4, 6, DARKWOOD, DARKWOOD);
      const cx = X + W / 2;
      for (let k = 0; k < 18; k++) {
        const rad = 3 + Math.sin((k / 18) * Math.PI) * 4;
        drum(r, cx, Y - 4 - k, rad, 1, 1, m);
      }
      for (let i = -5; i <= 5; i += 2) r.set(cx + i, Y - 13, BRASS[1]);
      return s;
    }
    case "engine": {
      // A beam or horizontal steam engine: flywheel, cylinder, polished rods.
      const s = make(30), { r, X, Y } = s;
      box(r, X + 1, Y - 2, W - 2, H - 6, 6, STONE, STONE);
      const cy = Y - 14, rad = Math.min(14, H / 2 + 4);
      for (let a = 0; a < 64; a++) {
        const ang = (a / 64) * Math.PI * 2;
        for (const k of [0, 1, 2]) r.set(X + 14 + Math.cos(ang) * (rad - k), cy + Math.sin(ang) * (rad - k), k === 0 ? IRON[3] : IRON[1 + (Math.cos(ang) < 0 ? 0 : 2)]);
      }
      for (let k = 0; k < 6; k++) { const ang = (k / 6) * Math.PI * 2; for (let d = 2; d < rad; d++) r.set(X + 14 + Math.cos(ang) * d, cy + Math.sin(ang) * d, IRON[2]); }
      drum(r, X + 14, cy + 2, 2, 2, 2, BRASS);
      box(r, X + W - 22, Y - 16, 16, 6, 10, ["#a8c0a0", "#86a07e", "#688464", "#4a6248", "#30422e"], ["#86a07e", "#688464", "#4a6248", "#30422e", "#1e2a1c"]);
      r.fill(X + 16, cy, W - 36, 2, BRASS[1]);
      r.set(X + 16, cy, BRASS[0]);
      return s;
    }
    case "dynamo": {
      const s = make(22), { r, X, Y } = s;
      box(r, X + 2, Y - 2, W - 4, H - 6, 4, IRON, IRON);
      drum(r, X + W / 2, Y - 2, W / 2 - 5, 3, 14, ["#c88a5a", "#a86a3e", "#8a4e2c", "#663620", "#3e2014"], IRON);
      for (let x = X + 6; x < X + W - 6; x += 3) r.fill(x, Y - 14, 1, 12, BRASS[2]);
      r.fill(X + 4, Y - 18, W - 8, 2, IRON[1]);
      return s;
    }
    case "locomotive": {
      const s = make(32), { r, X, Y } = s, body = t ?? GREEN;
      r.fill(X, Y + H - 8, W, 2, IRON[3]);
      drum(r, X + W * 0.42, Y + 2, W * 0.36, 0, 0, body);
      box(r, X + 6, Y - 10, W - 30, 6, 12, body, body);
      box(r, X + W - 26, Y - 22, 20, 8, 22, body, body);
      r.fill(X + W - 24, Y - 18, 6, 6, GLASS[2]);
      drum(r, X + 10, Y - 10, 3, 1.5, 12, IRON);
      for (const wx of [X + 14, X + 30, X + 46].filter((x) => x < X + W - 8)) {
        for (let a = 0; a < 24; a++) r.set(wx + Math.cos((a / 24) * Math.PI * 2) * 6, Y + 6 + Math.sin((a / 24) * Math.PI * 2) * 6, RED[2]);
        r.fill(wx - 1, Y + 5, 3, 3, BRASS[1]);
      }
      r.fill(X + 10, Y + 6, W - 24, 2, IRON[1]);
      r.fill(X + 6, Y - 11, W - 30, 1, BRASS[1]);
      return s;
    }
    case "phonograph": case "telephone": {
      const s = block(12, WOOD, DARKWOOD, 2), { r, X, Y } = s;
      if (art === "phonograph") {
        for (let k = 0; k < 10; k++) r.fill(X + 6 + k, Y - 12 - k, 2 + k, 2, BRASS[k < 4 ? 2 : 1]);
        r.fill(X + 3, Y - 7, 7, 2, IRON[2]);
      } else {
        r.fill(X + 5, Y - 14, 6, 10, DARKWOOD[2]);
        r.fill(X + 6, Y - 13, 4, 1, BRASS[1]);
        drum(r, X + 12, Y - 10, 1.5, 1, 4, IRON);
      }
      return s;
    }
    case "piano": {
      const s = block(16, ["#4a3a3a", "#382a2a", "#2a1e1e", "#1c1414", "#120c0c"], ["#3a2c2c", "#2a1e1e", "#1e1414", "#140e0e", "#0c0808"]);
      const { r, X, Y } = s;
      for (let i = 0; i < W - 8; i++) r.set(X + 4 + i, Y + 4, i % 3 === 2 ? "#1a1414" : "#f4f0e6");
      r.fill(X + 3, Y - 12, W - 6, 1, "#6a5656");
      return s;
    }
    case "model": case "pyramid": {
      const s = make(art === "pyramid" ? 30 : 18), { r, X, Y } = s, m = t ?? STONE;
      box(r, X + 1, Y - 3, W - 2, H - 5, 5, DARKWOOD, DARKWOOD);
      if (art === "pyramid") for (let k = 0; k < 24; k++) {
        const half = (W / 2 - 3) * (1 - k / 26);
        r.fill(X + W / 2 - half, Y - 4 - k, half, 1, m[1]);
        r.fill(X + W / 2, Y - 4 - k, half, 1, m[3]);
      }
      else {
        box(r, X + 5, Y - 10, W - 14, 4, 6, RED, m);
        box(r, X + W - 12, Y - 14, 6, 3, 10, RED, m);
        r.fill(X + 3, Y - 2, W - 6, 1, GREEN[2]);
      }
      return s;
    }
    case "loom": case "press": {
      const s = make(26), { r, X, Y } = s, frame = art === "loom" ? WOOD : IRON;
      box(r, X + 2, Y - 2, W - 4, H - 6, 6, frame, frame);
      for (const x of [X + 3, X + W - 6]) { r.fill(x, Y - 22, 3, 20, frame[2]); r.set(x, Y - 22, frame[0]); }
      r.fill(X + 3, Y - 22, W - 6, 3, frame[1]);
      if (art === "loom") { const c = t ?? RED; for (let x = X + 7; x < X + W - 7; x++) r.fill(x, Y - 18, 1, 10, (x % 2 ? c[1] : c[2])); }
      else { r.fill(X + 7, Y - 12, W - 14, 5, IRON[1]); drum(r, X + W / 2, Y - 18, 4, 1, 3, BRASS); }
      return s;
    }
    case "lamp-standard": {
      const s = make(44), { r, X, Y } = s, cx = X + W / 2;
      drum(r, cx, Y + 8, 3, 1.5, 4, IRON);
      r.fill(cx - 1, Y - 34, 2, 40, IRON[2]); r.fill(cx - 1, Y - 34, 1, 40, IRON[1]);
      r.fill(cx - 6, Y - 34, 12, 1, IRON[2]);
      for (const dx of [-6, 5]) { r.fill(cx + dx - 1, Y - 40, 3, 5, "#fff6d0"); r.set(cx + dx, Y - 40, "#ffffff"); }
      s.glow = [{ x: cx - 6, y: Y - 38 }, { x: cx + 6, y: Y - 38 }];
      return s;
    }
    case "kiosk": {
      // A round kiosk under a striped canopy.
      const s = make(34), { r, X, Y } = s, c = t ?? RED, cx = X + W / 2, rad = W / 2 - 2;
      drum(r, cx, Y + H - 6, rad - 2, 3, 16, WOOD, WOOD);
      r.fill(cx - 5, Y + H - 20, 10, 10, DARKWOOD[3]);
      for (let k = 0; k < 10; k++) {
        const rr = rad * (0.3 + k / 14);
        for (let x = -rr; x <= rr; x++) r.set(cx + x, Y + H - 34 + k, Math.floor((x + rad) / 4) % 2 ? c[1 + (k > 7 ? 1 : 0)] : "#f6f0e2");
      }
      r.fill(cx - 1, Y + H - 38, 2, 4, BRASS[1]);
      for (let x = -rad; x <= rad; x += 3) r.set(cx + x, Y + H - 24, c[3]);
      return s;
    }
    case "lift": {
      const s = make(40), { r, X, Y } = s;
      box(r, X + 1, Y - 26, W - 2, 4, 30, IRONRED, IRONRED);
      r.fill(X + 4, Y - 18, W - 8, 22, "#2a2026");
      for (let x = X + 4; x < X + W - 4; x += 3) r.fill(x, Y - 18, 1, 22, IRON[1]);
      r.fill(X + 2, Y - 26, W - 4, 2, BRASS[1]);
      return s;
    }
    // On the back wall: drawn above the cell in front of it.
    case "painting": case "tapestry": case "carpet": case "panel": case "map": {
      const s = { r: new Raster(W, 40), ox: 0, oy: 22 };
      const { r } = s, c = t ?? ramp(["#6a8ab8", "#b86a4a", "#7a9a5a", "#c8a050"][Math.floor(v * 4)]);
      const fw = W - 2, fh = art === "carpet" || art === "tapestry" ? 30 : art === "map" ? 22 : 20, y0 = 4;
      if (art === "painting" || art === "map") {
        r.fill(1, y0, fw, fh, BRASS[2]); r.fill(1, y0, fw, 1, BRASS[0]); r.fill(1, y0 + fh - 1, fw, 1, BRASS[4]);
        for (let y = y0 + 2; y < y0 + fh - 2; y++) for (let x = 3; x < fw - 1; x++) {
          const n = h2(x >> 1, y >> 1, Math.floor(v * 99));
          const sky = y < y0 + fh * 0.45;
          r.set(x, y, art === "map" ? (n > 0.55 ? "#d8c89a" : "#a8c4d0") : sky ? (n > 0.8 ? c[0] : "#c8d8e0") : n > 0.7 ? c[1] : n < 0.2 ? c[3] : c[2]);
        }
      } else {
        for (let y = y0; y < y0 + fh; y++) for (let x = 1; x < fw + 1; x++) {
          const d = Math.abs(x - W / 2) / (W / 2) + Math.abs(y - y0 - fh / 2) / (fh / 2);
          r.set(x, y, x < 3 || x > fw - 2 || y < y0 + 2 || y > y0 + fh - 3 ? c[3] : d < 0.5 ? c[0] : (Math.floor(d * 6) % 2 ? c[2] : c[1]));
        }
        if (art === "tapestry") r.fill(0, y0 - 1, W, 2, WOOD[3]);
        if (art === "panel") r.fill(2, y0 + fh, fw - 2, 2, c[4]);
      }
      return s;
    }
  }
  return undefined;
}

/** Trees, lamps, benches and columns in the grounds and halls. */
export function paintFairDecor(type: string, v: number): FairSprite | undefined {
  const make = (w: number, h: number, ox: number, oy: number) => ({ r: new Raster(w, h), ox, oy });
  if (type === "tree") {
    // A pollarded plane or chestnut: a round crown of leaf clusters on a pale trunk.
    const s = make(48, 64, 16, 48), { r } = s, cx = 24, cy = 24, rad = 16 + Math.floor(v * 4);
    const leaf = v < 0.5 ? ["#a8d06a", "#82b450", "#62963e", "#467630", "#2e5424"] : ["#b8d878", "#8cbc58", "#6a9c44", "#4c7c34", "#325a26"];
    r.fill(cx - 2, cy + 6, 5, 28, "#b8ac94"); r.fill(cx - 2, cy + 6, 1, 28, "#d8ccb4"); r.fill(cx + 2, cy + 6, 1, 28, "#8a7c66");
    for (let y = -rad; y <= rad; y++) for (let x = -rad - 2; x <= rad + 2; x++) {
      const d = (x / (rad + 2)) ** 2 + (y / rad) ** 2;
      const lump = h2((x + 40) >> 2, (y + 40) >> 2, Math.floor(v * 50)) * 0.25;
      if (d > 1 - lump * 0.6) continue;
      const lit = (-x - y) / rad;
      const k = lit > 0.7 ? 0 : lit > 0.1 ? 1 : lit > -0.5 ? 2 : 3;
      r.set(cx + x, cy + y, d > 0.86 - lump && k > 1 ? leaf[4] : leaf[k]);
    }
    return s;
  }
  if (type === "lamp") {
    const s = make(16, 48, 0, 34), { r } = s;
    r.fill(6, 44, 4, 3, IRON[3]);
    r.fill(7, 8, 2, 38, IRON[2]); r.fill(7, 8, 1, 38, IRON[1]);
    r.fill(4, 2, 8, 7, "#fff4c8"); r.fill(4, 2, 8, 1, IRON[2]); r.fill(4, 8, 8, 1, IRON[3]);
    r.set(5, 3, "#ffffff"); r.fill(6, 0, 4, 2, IRON[2]);
    return { ...s, glow: [{ x: 8, y: 5 }] };
  }
  if (type === "bench") {
    const s = make(32, 24, 8, 8), { r } = s;
    r.fill(8, 4, 16, 3, GREEN[2]); r.fill(8, 4, 16, 1, GREEN[0]);
    r.fill(8, 10, 16, 3, GREEN[1]); r.fill(8, 13, 16, 1, GREEN[3]);
    for (const x of [9, 22]) r.fill(x, 7, 1, 13, IRON[3]);
    return s;
  }
  if (type === "column") {
    const s = make(16, 72, 0, 56), { r } = s;
    r.fill(2, 64, 12, 6, IRON[2]); r.fill(2, 64, 12, 1, IRON[1]);
    for (let y = 4; y < 64; y++) { r.fill(5, y, 6, 1, IRON[2]); r.set(5, y, IRON[0]); r.set(6, y, IRON[1]); r.set(10, y, IRON[3]); }
    r.fill(3, 0, 10, 4, IRON[1]); r.fill(3, 3, 10, 1, IRON[3]);
    return s;
  }
  return undefined;
}
