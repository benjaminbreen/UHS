import { mix, scale } from "./room";

export type BackroomDraw = {
  s: (x: number, y: number, c: number) => void;
  g: (x: number, y: number, c: number) => void;
  r: (x: number, y: number, w: number, h: number, c: number | ((i: number, j: number) => number)) => void;
  lights: { x: number; y: number; c: number; rad: number; k: number; phase: number }[];
  fires: { x: number; y: number; w: number; h: number; lit: boolean }[];
  flames: { x: number; y: number }[];
  smoke: { x: number; y: number }[];
  notes: { x: number; y: number }[];
  birds: { x: number; y: number; seed: number; singing: boolean }[];
  t: number;
};

/** Paints bespoke wall centerpieces for procedural secret back-rooms. */
export function paintBackroomAltar(
  d: BackroomDraw,
  style: string,
  X: number,
  Y: number,
  PW: number,
  PD: number,
  seed: number,
): boolean {
  const cx = X + (PW >> 1), base = Y + PD - 2;
  switch (style) {
    case "backroom-speakeasy-bar": {
      // Intimate 1920s Art Deco speakeasy bar: dark walnut frame, glowing backlit amber bottle niches, mahogany counter & brass rail.
      const w = Math.min(PW, 96), x0 = cx - (w >> 1), top = base - 48;
      d.r(x0, top, w, 34, (i, j) => {
        if (i === 0 || i === w - 1 || j === 0) return 0x241214;
        if (i === 1 || i === w - 2 || j === 1) return 0xdcb04c;
        if (j === 2) return 0x8a5e1e;
        return 0x3c1e1c;
      });
      const bays = 2, gap = 6, bw = Math.floor((w - 12 - gap) / bays);
      for (let b = 0; b < bays; b++) {
        const bx = x0 + 6 + b * (bw + gap), by = top + 4, bh = 25;
        const pulse = 0.95 + 0.05 * Math.sin(d.t * 2 + b * 1.7);
        for (let j = 0; j < bh; j++) {
          for (let i = 0; i < bw; i++) {
            const dx = (i - bw / 2) / (bw / 2);
            if (j < 4 && dx * dx + ((4 - j) / 4) ** 2 > 1.15) {
              d.s(bx + i, by + j, (i + j) & 1 ? 0xc89834 : 0x6a441a);
              continue;
            }
            const col = scale(mix(0xffe6a4, 0xd88428, j / bh), pulse * (1 - 0.14 * dx * dx));
            if (i === 0 || i === bw - 1 || j === 0) d.s(bx + i, by + j, 0x7c4c1c);
            else d.g(bx + i, by + j, col);
          }
        }
        for (const sy of [by + 11, by + 21]) {
          d.r(bx + 1, sy, bw - 2, 1, 0x6a3c16);
          d.r(bx + 1, sy + 1, bw - 2, 1, 0xf6de98);
          for (let i = 3; i < bw - 4; i += 4) {
            const h = 5 + ((i * 5 + b * 9 + seed) % 3);
            const col = [0x9e2c1a, 0x246e42, 0xc87a24, 0x6c1c36, 0x385880][(i + b * 2) % 5];
            const hi = mix(col, 0xfff4d0, 0.45);
            d.s(bx + i + 1, sy - h, 0x2a1410);
            d.s(bx + i + 1, sy - h + 1, hi);
            d.r(bx + i, sy - h + 2, 3, h - 2, (u, v) => (u === 0 ? hi : u === 2 ? scale(col, 0.65) : v === 2 ? 0xf6e8bc : col));
          }
        }
      }
      const cy = base - 15;
      d.r(x0 - 2, cy, w + 4, 16, (i, j) => {
        if (j === 0 || j === 15 || i === 0 || i === w + 3) return 0x201010;
        if (j <= 2) return j === 1 ? 0x8e5230 : 0x5c301c;
        if (j === 3 || j === 13) return 0xe0b248;
        if (j === 14) return 0x7a5018;
        const p = i % 14;
        return p === 1 || p === 12 ? 0x321614 : p === 2 ? 0x683624 : 0x4a221c;
      });
      // Silver cocktail shaker & coupe glasses on the bar.
      d.r(cx - 10, cy - 5, 3, 6, (i, j) => (j === 0 ? 0xf2f6fa : i === 0 ? 0xd0dae2 : 0x86929c));
      for (const gx of [cx + 4, cx + 18, x0 + 14]) {
        d.r(gx, cy - 3, 3, 2, 0xf2f6fa);
        d.s(gx + 1, cy - 1, 0xc8d4dc);
        d.r(gx, cy, 3, 1, 0xc8d4dc);
      }
      d.lights.push(
        { x: x0 + 24, y: top + 20, c: 0xffba5c, rad: 82, k: 0.95, phase: -1 },
        { x: x0 + w - 24, y: top + 20, c: 0xffba5c, rad: 82, k: 0.95, phase: -1 },
      );
      return true;
    }
    case "backroom-wunderkammer": {
      // Cabinet of Curiosities: dark carved walnut vitrine stuffed with glowing amber specimen jars,
      // red coral, spiraling narwhal horn, brass astrolabe, skull, and a preserved crocodile hung overhead!
      const w = Math.min(PW, 92), x0 = cx - (w >> 1), top = base - 48;
      // Preserved crocodile suspended by twin brass chains above the cabinet cornice!
      const crocY = top + 2;
      d.r(cx - 18, top - 2, 1, 5, 0xe8bc52);
      d.r(cx + 16, top - 2, 1, 5, 0xe8bc52);
      for (let i = -24; i <= 24; i++) {
        const thick = i < -16 ? 1 : i < -10 ? 2 : i < 12 ? 4 : i < 19 ? 3 : 2;
        for (let j = 0; j < thick; j++) {
          const ridge = j === 0 && (i & 1) === 0;
          d.s(cx + i, crocY + j + (i < -14 ? 1 : 0), ridge ? 0x82be62 : j === thick - 1 && thick >= 3 ? 0xc8bc8e : j === 1 ? 0x589444 : 0x386630);
        }
      }
      d.s(cx + 17, crocY + 1, 0xffe878); // tiny glass bead eye
      d.s(cx + 21, crocY + 2, 0xf4eee0); // tooth glint
      // Carved walnut curiosity cabinet with 3 deep illuminated specimen shelves.
      const cabTop = top + 9;
      d.r(x0, cabTop, w, 39, (i, j) => {
        if (i === 0 || i === w - 1 || j === 0 || j === 38) return 0x241610;
        if (i <= 2 || i >= w - 3 || j <= 2) return j === 1 || i === 1 ? 0x7c502e : 0x4e2e1a;
        if (j === 13 || j === 25 || j === 35) return 0x8a5a34;
        if (j === 14 || j === 26 || j === 36) return 0x382014;
        return (i % 22 === 0) ? 0x4e2e1a : 0x261a16;
      });
      // Top shelf (y = cabTop + 13): glowing amber & turquoise specimen jars + red coral branch + pale skull.
      const s1 = cabTop + 13;
      for (const [jx, col] of [[x0 + 6, 0xf0b238], [x0 + 13, 0x52c8a8], [x0 + 20, 0xe49234], [x0 + w - 14, 0x72c2e0]] as const) {
        d.r(jx, s1 - 8, 5, 8, (u, v) => (v === 0 ? 0x8a5e2c : u === 0 || u === 4 || v === 7 ? 0xa8c6cc : col));
        d.g(jx + 2, s1 - 5, mix(col, 0xfff8dc, 0.5));
        d.g(jx + 2, s1 - 3, col);
      }
      // Red coral fan & ivory skull in middle bay.
      const corX = cx - 8;
      for (const [dx, dy] of [[0, -1], [0, -2], [-1, -3], [1, -3], [-2, -5], [0, -5], [2, -5], [-3, -7], [1, -7], [3, -6]]) {
        d.s(corX + dx, s1 + dy, 0xd83c32);
      }
      d.r(cx + 6, s1 - 7, 6, 6, (u, v) => ((u === 1 || u === 4) && v === 3 ? 0x241610 : v === 0 || u === 0 ? 0xf4eee0 : 0xd4cab4));
      // Middle shelf (y = cabTop + 25): spiraling ivory narwhal tusk across the shelf + brass astrolabe + violet geode!
      const s2 = cabTop + 25;
      for (let k = 0; k < 28; k++) {
        d.s(x0 + 6 + k, s2 - 2 - (k >> 4), (k % 3 === 0) ? 0xc2b69c : 0xf4eee0);
        if (k < 18) d.s(x0 + 6 + k, s2 - 1 - (k >> 4), 0xd8ccb4);
      }
      // Brass astrolabe ring & amethyst crystal cluster.
      for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) {
        const r2 = i * i + j * j;
        if (r2 >= 10 && r2 <= 18) d.s(cx + 10 + i, s2 - 5 + j, 0xe8bc4c);
      }
      d.r(x0 + w - 16, s2 - 6, 7, 6, (u, v) => ((u + v) % 2 ? 0xa858d8 : 0x6a2c96));
      d.g(x0 + w - 13, s2 - 4, 0xd898f8);
      // Lower shelf (y = cabTop + 35): leather folios, nautilus shell & brass hourglass.
      const s3 = cabTop + 35;
      for (let k = 0; k < 5; k++) {
        const bc = [0x8c2424, 0x264c78, 0x2a663e, 0x7c4a1c, 0x5c2860][k];
        d.r(x0 + 7 + k * 4, s3 - 7 - (k & 1), 3, 7 + (k & 1), (_u, v) => (v === 2 ? 0xe8c052 : bc));
      }
      d.r(cx + 2, s3 - 7, 5, 7, (u, v) => (v === 0 || v === 6 ? 0xd8a838 : Math.abs(u - 2) <= Math.abs(v - 3) ? 0xeef6fa : 0x261a16));
      d.s(cx + 4, s3 - 2, 0xf2d478);
      d.lights.push(
        { x: x0 + 18, y: s1 - 4, c: 0xffc864, rad: 56, k: 0.72, phase: -1 },
        { x: cx + 14, y: s2 - 4, c: 0xd0e8c8, rad: 52, k: 0.58, phase: -1 },
      );
      return true;
    }
    case "backroom-press": {
      // Clandestine wooden screw printing press with overhead drying line of fresh broadsheets!
      const w = Math.min(PW, 76), x0 = cx - (w >> 1), top = base - 46;
      // Overhead drying cord stretched across the wall with 5 gently swaying broadsheets.
      d.r(x0 + 2, top + 4, w - 4, 1, 0x8e7c64);
      for (let k = 0; k < 5; k++) {
        const px = x0 + 7 + k * 13;
        const sway = Math.round(Math.sin(d.t * 1.6 + k * 1.3) * 0.7);
        d.r(px + sway, top + 5, 9, 11, (i, j) => {
          if (i === 0 || i === 8 || j === 0 || j === 10) return 0x9c9282;
          if ((j === 2 || j === 4 || j === 6 || j === 8) && i >= 2 && i <= 6 && ((i + k) % 3 !== 0)) return 0x2a2624;
          return 0xf4eee0;
        });
      }
      // Heavy timber screw printing press on the left/center.
      const px0 = x0 + 8, py0 = base - 28;
      // Twin massive oak cheeks & crossbeam.
      d.r(px0, py0, 4, 28, (i) => (i === 0 ? 0x865630 : i === 3 ? 0x2c180e : 0x623a1e));
      d.r(px0 + 24, py0, 4, 28, (i) => (i === 0 ? 0x865630 : i === 3 ? 0x2c180e : 0x623a1e));
      d.r(px0 - 2, py0, 32, 4, (_i, j) => (j === 0 ? 0x9c683c : j === 3 ? 0x2c180e : 0x6c4222));
      // Central wooden screw shaft & iron pull-bar lever.
      d.r(px0 + 12, py0 + 4, 4, 12, (i, j) => ((i + j) % 3 === 0 ? 0x3c2214 : 0x8e5c34));
      d.r(px0 + 15, py0 + 9, 14, 2, 0x48505a);
      d.r(px0 + 27, py0 + 8, 3, 4, 0x865630);
      // Inked press bed & fresh damp printed sheet.
      d.r(px0 + 3, py0 + 16, 22, 6, (_i, j) => (j === 0 || j === 5 ? 0x241812 : j === 1 ? 0x484e56 : 0x5c361c));
      d.r(px0 + 7, py0 + 15, 13, 3, (i, j) => (j === 1 && (i & 1) ? 0x242020 : 0xf4eee0));
      // Stacked paper reams & ink barrel on the right.
      const rx = x0 + 44;
      d.r(rx, base - 14, 14, 14, (i, j) => (i === 0 || i === 13 || j === 0 || j === 13 ? 0x7c7264 : (j & 1) ? 0xf2ece0 : 0xd8d0c0));
      d.r(rx + 16, base - 12, 9, 12, (i, j) => (i === 0 || i === 8 || j === 0 || j === 11 ? 0x1a181c : j === 3 || j === 8 ? 0x5c646e : 0x2e2c32));
      // Warm brass oil lamp beside the press.
      d.r(rx + 4, base - 19, 4, 5, (i, j) => (j < 2 ? 0xffea98 : i === 0 ? 0xc89832 : 0x8e6220));
      d.g(rx + 5, base - 18, 0xfff6cc);
      d.lights.push({ x: rx + 6, y: base - 17, c: 0xffc668, rad: 78, k: 0.9, phase: 5 });
      return true;
    }
    case "backroom-alembic": {
      // Alchemist's brick Athanor furnace, hammered copper alembic & luminous glowing emerald/violet glass retorts!
      const w = Math.min(PW, 76), x0 = cx - (w >> 1), top = base - 46;
      // Hand-inked celestial star chart tapestry pinned to upper right wall.
      d.r(x0 + 42, top + 3, 24, 18, (i, j) => {
        if (i === 0 || i === 23 || j === 0 || j === 17) return 0xc89634;
        const r2 = (i - 12) ** 2 + (j - 9) ** 2;
        if (Math.abs(r2 - 36) < 6) return 0xdcb04c;
        if ((i * 7 + j * 13) % 19 === 0) return 0xfff0b0;
        return 0x1c2444;
      });
      // Domed brick athanor furnace on the left with glowing firebox.
      const fx = x0 + 6, fy = base - 26;
      for (let j = 0; j < 26; j++) {
        const inset = j < 5 ? 5 - j : 0;
        for (let i = inset; i < 24 - inset; i++) {
          const edge = i === inset || i === 23 - inset || j === 0 || j === 25;
          const mortar = j % 4 === 0 || ((i + ((j >> 2) & 1) * 4) % 8 === 0);
          d.s(fx + i, fy + j, edge ? 0x2e1812 : mortar ? 0x5c3c30 : (i < 8 ? 0x9c4c34 : 0x7a3826));
        }
      }
      d.r(fx + 6, base - 11, 12, 10, 0x24100c);
      d.fires.push({ x: fx + 7, y: base - 2, w: 10, h: 8, lit: true });
      // Hammered copper alembic dome atop the furnace + swan-neck coil leading to glowing flasks!
      d.r(fx + 7, fy - 7, 10, 8, (i, j) => (i === 0 || i === 9 || j === 0 ? 0x4e2612 : i <= 3 ? 0xe8984c : 0xb86428));
      for (let k = 0; k < 16; k++) {
        d.s(fx + 16 + k, fy - 5 + Math.round(k * 0.45), 0xd8883c);
        d.s(fx + 16 + k, fy - 4 + Math.round(k * 0.45), 0x8c4a1c);
      }
      // Stone distillation bench with 3 luminous bubbling glass flasks (emerald, amber, arcane violet).
      const bx = x0 + 34, by = base - 14;
      d.r(bx, by, 36, 14, (i, j) => (i === 0 || i === 35 || j === 0 || j === 13 ? 0x2a2420 : j <= 2 ? 0x8e887e : 0x5c5650));
      const flasks: [number, number][] = [[bx + 4, 0x42e088], [bx + 15, 0xf2b438], [bx + 26, 0xb864f0]];
      for (const [k, [rx, col]] of flasks.entries()) {
        const bub = Math.sin(d.t * 4 + k * 2) > 0.3;
        d.r(rx + 2, by - 9, 3, 4, 0xc8e4ec);
        d.r(rx, by - 5, 7, 6, (i, j) => (i === 0 || i === 6 || j === 5 ? 0x94b8c4 : j === 0 ? 0xdcf0f6 : col));
        d.g(rx + 3, by - 3, mix(col, 0xffffff, bub ? 0.55 : 0.25));
        d.g(rx + 2, by - 2, col);
        d.g(rx + 4, by - 2, col);
        d.smoke.push({ x: rx + 3, y: by - 10 });
      }
      d.lights.push(
        { x: fx + 12, y: base - 6, c: 0xff8c34, rad: 78, k: 0.95, phase: 3 },
        { x: bx + 18, y: by - 4, c: 0x6ce8a8, rad: 64, k: 0.72, phase: 11 },
      );
      return true;
    }
    case "backroom-stillroom": {
      // Herbalist's drying loft: rafter hung with colorful bundles of lavender, sage, chamomile & red peppers
      // above glowing jewel-colored apothecary tincture shelves.
      const w = Math.min(PW, 76), x0 = cx - (w >> 1), top = base - 46;
      // Overhead timber drying beam with hanging botanical bundles.
      d.r(x0 + 2, top + 3, w - 4, 3, (_i, j) => (j === 0 ? 0x8e5c34 : j === 2 ? 0x361e10 : 0x623c20));
      const herbs: [number, number][] = [
        [0x8c5cc4, 0x6a3c9e], // lavender
        [0x548c52, 0x36643a], // sage
        [0xe8c448, 0xc29224], // chamomile
        [0xc83028, 0x8e1c1a], // dried peppers
        [0x7650b4, 0x4e3282], // lavender
        [0x4c844c, 0x2e5c32], // rosemary
      ];
      for (let k = 0; k < 6; k++) {
        const hx = x0 + 8 + k * 11, [hi, lo] = herbs[k];
        d.r(hx + 2, top + 6, 1, 2, 0xc8a468);
        d.r(hx + 1, top + 8, 3, 3, 0x4e7c44);
        d.r(hx, top + 11, 5, 6, (i, j) => (j === 5 && (i === 0 || i === 4) ? 0x324e2c : (i + j) & 1 ? hi : lo));
      }
      // Walnut apothecary shelf below with jewel-colored glowing tincture bottles.
      const sy0 = base - 24;
      d.r(x0 + 4, sy0, w - 8, 24, (i, j) => {
        if (i === 0 || i === w - 9 || j === 0 || j === 23) return 0x2c180e;
        if (j === 1 || j === 11 || j === 21) return 0x8a5832;
        if (j === 12 || j === 22) return 0x3e2214;
        return 0x2c1e18;
      });
      for (const shelfY of [sy0 + 11, sy0 + 21]) {
        for (let i = 0; i < w - 16; i += 6) {
          const bx = x0 + 8 + i;
          const col = [0x3868d4, 0x36a868, 0xe29828, 0xc83444, 0x8a4cc8][(i + shelfY) % 5];
          d.s(bx + 1, shelfY - 7, 0xb89660);
          d.r(bx, shelfY - 6, 4, 6, (u, v) => (u === 0 ? mix(col, 0xffffff, 0.4) : u === 3 ? scale(col, 0.65) : v === 3 ? 0xf4eee0 : col));
          if (i % 12 === 0) d.g(bx + 1, shelfY - 4, mix(col, 0xfff8dc, 0.45));
        }
      }
      d.lights.push({ x: cx, y: sy0 + 10, c: 0xffd288, rad: 70, k: 0.72, phase: -1 });
      return true;
    }
    case "backroom-vault": {
      // Smuggler's vault: stacked rum & brandy casks, brass-bound sea chest, sea chart & hanging ship's lantern.
      const w = Math.min(PW, 76), x0 = cx - (w >> 1), top = base - 46;
      // Unrolled maritime sea chart on the upper wall.
      d.r(x0 + 10, top + 6, 26, 15, (i, j) => {
        if (i === 0 || i === 25 || j === 0 || j === 14) return 0x7a5c38;
        if (j === 7 && i > 2 && i < 23 && (i % 4 === 0)) return 0xa82424; // plotted smuggling route
        if (i === 18 && j === 7) return 0xc82424;
        return (i + j) % 9 === 0 ? 0xd4c29a : 0xeadcb8;
      });
      // Hanging brass ship's lantern on the upper right.
      const lx = x0 + w - 18, ly = top + 6;
      d.r(lx + 3, top + 1, 1, 5, 0x5c4c34);
      d.r(lx, ly, 7, 9, (i, j) => (j === 0 || j === 8 || i === 0 || i === 6 ? 0xc89632 : 0xfff2b4));
      for (let j = 2; j <= 6; j++) for (let i = 2; i <= 4; i++) d.g(lx + i, ly + j, 0xfff6cc);
      d.lights.push({ x: lx + 3, y: ly + 5, c: 0xffc660, rad: 88, k: 0.95, phase: 9 });
      // Stacked iron-banded rum & brandy casks on the left.
      for (const [cx0, cy0] of [[x0 + 6, base - 13], [x0 + 19, base - 13], [x0 + 12, base - 23]] as const) {
        d.r(cx0, cy0, 12, 13, (i, j) => {
          if (i === 0 || i === 11 || j === 0 || j === 12) return 0x26140c;
          if (j === 3 || j === 9) return 0x4e5864;
          return i <= 3 ? 0x945c32 : i >= 9 ? 0x563018 : 0x764424;
        });
      }
      // Brass-bound smuggler's strongbox overflowing with a glint of coin on the right.
      const tx = x0 + 40, ty = base - 15;
      d.r(tx, ty, 24, 15, (i, j) => {
        if (i === 0 || i === 23 || j === 0 || j === 14) return 0x22140e;
        if (i === 4 || i === 19 || j === 5) return 0xd8a838;
        if (j === 4 && i > 5 && i < 18) return (i & 1) ? 0xffe474 : 0xd49a28;
        return j < 5 ? 0x6e3e22 : 0x4c2816;
      });
      return true;
    }
    default:
      return false;
  }
}

/** Paints bespoke fixtures for secret back-rooms (`backroom:*`) and quirky everyday homes (`quirk:*`). */
export function paintBackroomFixture(
  d: BackroomDraw,
  item: string,
  X: number,
  Y: number,
  PW: number,
  PD: number,
  seed: number,
  on = false,
): boolean {
  const cx = X + (PW >> 1), base = Y + PD - 2;
  switch (item) {
    case "backroom:speakeasy-piano":
    case "quirk:piano": {
      // Warm mahogany upright parlor / speakeasy piano with ivory keys, music stand & floating notes.
      const x0 = X, top = base - 26;
      d.r(x0 + 2, top, 28, 25, (i, j) => {
        if (i === 0 || i === 27 || j === 0 || j === 24) return 0x24120c;
        if (j <= 2) return j === 1 ? 0x8e5230 : 0x5e321a;
        if (j >= 12 && j <= 15 && i >= 3 && i <= 24) {
          return j === 12 ? 0x24120c : (i & 1) ? 0xf6f2e6 : j === 13 ? 0x221e24 : 0xe4dfd0;
        }
        if (j === 22 && i >= 11 && i <= 16) return 0xdca838; // brass pedals
        if (j > 16 && (i < 4 || i > 23)) return 0x5c3018;
        return (j === 6 || j === 18) ? 0x482214 : 0x6c3c22;
      });
      // Sheet music propped on top + tiny brass sconces!
      d.r(x0 + 11, top + 3, 10, 7, (i, j) => (i === 0 || i === 9 ? 0xc2b8a4 : (j === 2 || j === 4) && i > 1 && i < 8 ? 0x383230 : 0xf4eee0));
      if (item === "backroom:speakeasy-piano" || on) d.notes.push({ x: x0 + 15, y: top - 2 });
      return true;
    }
    case "backroom:card-table": {
      // Round green-baize gaming / poker table with cards, chips, glass & overhead green lamp glow!
      const x0 = X, top = base - 18;
      d.r(x0 + 2, top + 4, 28, 12, (i, j) => {
        const corner = (i < 2 || i > 25) && (j < 2 || j > 9);
        if (corner) return 0x4a2a16;
        if (i === 0 || i === 27 || j === 0 || j === 11) return 0x26140c;
        if (i <= 2 || i >= 25 || j <= 1 || j >= 10) return 0x7c4a26;
        return (i + j) % 7 === 0 ? 0x247244 : 0x1c5c36;
      });
      // Scattered white playing cards & red/ivory chip stacks.
      for (const [kx, ky] of [[x0 + 8, top + 7], [x0 + 14, top + 9], [x0 + 20, top + 7]] as const) {
        d.r(kx, ky, 3, 4, (i, j) => (i === 1 && j === 1 ? 0xc82424 : 0xf6f2e8));
      }
      d.r(x0 + 11, top + 11, 2, 3, 0xd83232);
      d.r(x0 + 19, top + 11, 2, 3, 0xf2de88);
      d.r(x0 + 6, top + 16, 3, 3, 0x4e2c18);
      d.r(x0 + 23, top + 16, 3, 3, 0x4e2c18);
      d.lights.push({ x: cx, y: top + 8, c: 0x9ef0b0, rad: 62, k: 0.72, phase: -1 });
      return true;
    }
    case "backroom:globe":
    case "quirk:globe": {
      // Antique floor celestial / terrestrial globe in a gleaming brass meridian ring!
      const top = base - 22;
      d.r(cx - 4, base - 3, 8, 3, (i, j) => (j === 0 ? 0x8e5a32 : i === 0 || i === 7 ? 0x2a160c : 0x5e381e));
      d.r(cx - 1, base - 9, 2, 6, 0x6e4424);
      for (let j = -6; j <= 6; j++) {
        for (let i = -6; i <= 6; i++) {
          const r2 = i * i + j * j;
          if (r2 > 42) continue;
          if (r2 > 28) {
            if (i >= -1 || j >= 3) d.s(cx + i, top + 7 + j, 0xdca838); // brass meridian arc
            continue;
          }
          const land = ((i * 3 + j * 5 + seed) & 7) < 3;
          const hi = i < -1 && j < -1;
          d.s(cx + i, top + 7 + j, land ? (hi ? 0xc4a864 : 0x8e7c44) : hi ? 0x5c92b0 : 0x346482);
        }
      }
      return true;
    }
    case "backroom:typecase": {
      // Slanted compositor's wooden type-case desk divided into tiny lead-type boxes & stacked pamphlets.
      const x0 = X, top = base - 18;
      d.r(x0 + 1, top + 4, 30, 14, (i, j) => {
        if (i === 0 || i === 29 || j === 0 || j === 13) return 0x2a180e;
        if (j <= 7 && i >= 2 && i <= 18) {
          if (i % 4 === 0 || j % 3 === 0) return 0x6e4422;
          return 0x484e58; // tiny lead type pieces!
        }
        if (j >= 9 && i >= 4 && i <= 25) return 0x1e120c;
        return 0x7c4e2a;
      });
      // Stack of damp broadsheets & candle on the right.
      d.r(x0 + 21, top + 3, 7, 7, (i, j) => (i === 0 || i === 6 || j === 0 ? 0x9c9280 : (j & 1) ? 0xf6f0e2 : 0xdcd4c2));
      d.r(x0 + 24, top - 1, 2, 4, 0xf2ead0);
      d.flames.push({ x: x0 + 24, y: top - 2 });
      d.lights.push({ x: x0 + 24, y: top - 1, c: 0xffc668, rad: 48, k: 0.65, phase: 7 });
      return true;
    }
    case "backroom:armillary": {
      // Gleaming brass armillary sphere on an oak lectern with open star atlas.
      const top = base - 24;
      d.r(cx - 5, base - 10, 10, 11, (i, j) => (i === 0 || i === 9 || j === 0 || j === 10 ? 0x2c180e : j === 1 ? 0x966036 : 0x683e20));
      d.r(cx - 4, base - 11, 8, 3, (i) => (i === 4 ? 0x5c361a : 0xf2ead6));
      for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) {
        const r2 = i * i + j * j;
        if ((r2 >= 26 && r2 <= 38) || (Math.abs(i - j) <= 1 && r2 <= 32) || (j === 0 && Math.abs(i) <= 6)) {
          d.s(cx + i, top + 7 + j, (i + j) < 0 ? 0xf6dc7c : 0xc4902c);
        }
      }
      d.g(cx, top + 7, 0xffe888);
      return true;
    }
    case "backroom:still": {
      // Simmering hammered copper herb still with rising aromatic steam wisps!
      const top = base - 22;
      d.r(cx - 5, base - 7, 10, 8, (i, j) => (i === 0 || i === 9 || j === 7 ? 0x2c1810 : j >= 5 && i >= 3 && i <= 6 ? 0xff8c2c : 0x6e4438));
      d.r(cx - 4, top + 7, 8, 8, (i, j) => (i === 0 || i === 7 || j === 0 ? 0x4c2410 : i <= 2 ? 0xe89c52 : 0xbc682a));
      d.r(cx - 2, top + 3, 4, 4, 0xd8883c);
      for (let k = 0; k < 6; k++) d.s(cx + 2 + k, top + 4 + (k >> 1), 0xd8883c);
      d.r(cx + 5, base - 5, 4, 5, (i) => (i === 0 ? 0xc8ece4 : 0x48b892));
      d.smoke.push({ x: cx, y: top + 2 });
      d.lights.push({ x: cx, y: base - 3, c: 0xff9438, rad: 44, k: 0.6, phase: 13 });
      return true;
    }
    case "quirk:lute": {
      // Hand-carved pear-shaped wooden lute / oud resting upright on a small stand!
      const top = base - 19;
      d.r(cx - 1, top, 2, 9, 0x5c341a);
      d.s(cx - 2, top + 1, 0xd8a838);
      d.s(cx + 1, top + 2, 0xd8a838);
      for (let j = 0; j < 10; j++) {
        const hw = j < 2 ? 2 : j < 7 ? 4 : 3;
        for (let i = -hw; i <= hw; i++) {
          const edge = Math.abs(i) === hw || j === 9;
          const hole = i === 0 && (j === 4 || j === 5);
          d.s(cx + i, top + 8 + j, edge ? 0x2c160c : hole ? 0x381e12 : i < 0 ? 0xd89a56 : 0xb27234);
        }
      }
      if (on || (seed & 3) === 0) d.notes.push({ x: cx, y: top - 2 });
      return true;
    }
    case "quirk:guitar": {
      // Honey-spruce acoustic guitar on a stand beside a tiny crate of records!
      const top = base - 20;
      d.r(cx - 3, top, 2, 9, 0x4e2c18);
      for (let j = 0; j < 11; j++) {
        const hw = j < 4 ? 3 : j === 4 ? 2 : j < 9 ? 4 : 3;
        for (let i = -hw; i <= hw; i++) {
          const edge = Math.abs(i) === hw || j === 0 || j === 10;
          const hole = Math.abs(i) <= 1 && j === 4;
          d.s(cx - 2 + i, top + 9 + j, edge ? 0x2e180c : hole ? 0x28140c : i < 0 ? 0xe4ad64 : 0xc0823c);
        }
      }
      // Small vinyl record crate next to the guitar.
      d.r(cx + 2, base - 6, 6, 7, (i, j) => (i === 0 || i === 5 || j === 6 ? 0x2e1a10 : j === 0 ? ((i & 1) ? 0xd83c34 : 0x3c78b8) : 0x7a4e2c));
      if (on || (seed & 3) === 0) d.notes.push({ x: cx - 2, y: top - 2 });
      return true;
    }
    case "quirk:easel": {
      // Painter's wooden A-frame easel holding a miniature pixel landscape painting & palette!
      const top = base - 24;
      for (let j = 0; j < 24; j++) {
        d.s(cx - 4 + Math.floor((24 - j) * 0.16), top + j, 0x7a4c28);
        d.s(cx + 4 - Math.floor((24 - j) * 0.16), top + j, 0x5c361a);
      }
      // Framed canvas with tiny Stardew hills, blue sky, and golden sun!
      d.r(cx - 5, top + 3, 11, 13, (i, j) => {
        if (i === 0 || i === 10 || j === 0 || j === 12) return 0x382012;
        if (j === 2 && (i === 7 || i === 8)) return 0xffe478;
        if (j < 6) return 0x7eb2dc;
        if (j < 9) return (i + j) % 3 === 0 ? 0x4c8a52 : 0x366c40;
        return 0x628c46;
      });
      d.r(cx - 6, top + 16, 13, 2, 0x8e5c34);
      return true;
    }
    case "quirk:birdcage": {
      // Ornate brass parlor birdcage on a slender stand; live songbird is animated on the perch each frame!
      const top = base - 25;
      d.r(cx - 3, base - 2, 6, 3, (i, j) => (j === 0 ? 0xc49430 : i === 0 || i === 5 ? 0x4e3210 : 0x8a6020));
      d.r(cx - 1, top + 14, 2, 10, (i) => (i === 0 ? 0xe4b848 : 0x9c6e22));
      d.s(cx, top, 0xf2cc58); // hanging ring finial
      for (let j = 0; j < 13; j++) {
        for (let i = 0; i < 9; i++) {
          if (j === 0 && (i === 0 || i === 8)) continue;
          const rim = i === 0 || i === 8 || j === 0 || j === 12;
          const bar = i % 2 === 0;
          const perch = j === 8 && i >= 1 && i <= 7;
          const cup = j === 10 && i >= 1 && i <= 2;
          const c = rim ? 0xe4b848 : perch ? 0x8e5c34 : cup ? 0xf2ece0 : bar ? 0xb4842c : 0x2e2420;
          d.s(cx - 4 + i, top + 1 + j, c);
        }
      }
      d.birds.push({ x: cx, y: top + 9, seed, singing: on });
      if (on) d.notes.push({ x: cx, y: top - 1 });
      return true;
    }
    case "quirk:terrarium": {
      // Glass Wardian case / parlor terrarium with lush ferns, a basking frog, and a toggleable brass heat lamp!
      const top = base - 21;
      d.r(cx - 6, base - 6, 12, 7, (i, j) => (i === 0 || i === 11 || j === 6 ? 0x2c1a10 : j === 0 ? 0x8e5c34 : 0x643e22));
      // Brass gooseneck heat lamp curving up over the glass lid.
      d.r(cx + 4, top + 1, 1, 4, 0x9c7228);
      d.r(cx - 1, top, 6, 1, 0xc89834);
      d.r(cx - 3, top + 1, 5, 2, (_i, j) => (j === 0 ? 0x8a6020 : on ? 0xffd868 : 0x563c18));
      if (on) d.g(cx - 1, top + 2, 0xfff4b8);
      const glassHi = on ? 0xf6fce8 : 0xc4dce2;
      const glassBg = on ? 0x8ec4ae : 0x5c8490;
      d.r(cx - 5, top + 4, 10, 11, (i, j) => {
        if (i === 0 || i === 9 || j === 0 || j === 10) return 0x44585c;
        if (j >= 8) return i === 4 || i === 5 ? 0x7e7668 : 0x5c3e26; // soil & warm basking stone
        const fern = (j >= 4 && ((i === 2 || i === 7) || (j === 6 && i >= 2 && i <= 7))) || (j === 5 && i === 6);
        if (fern) return (i + j) & 1 ? (on ? 0x6cd074 : 0x489a54) : (on ? 0x368c4c : 0x246036);
        if (on && j === 7 && (i === 4 || i === 5)) return i === 4 ? 0x88e85c : 0x5ec040; // tiny basking frog!
        if (!on && j === 7 && i === 2) return 0x44903c; // frog tucked under fern in the cool shade
        return (i === 1 && j <= 4) ? glassHi : glassBg;
      });
      if (on) {
        d.g(cx - 1, top + 5, 0xffe896);
        d.lights.push({ x: cx, y: top + 5, c: 0xffc864, rad: 46, k: 0.82, phase: 5 });
      }
      return true;
    }
    case "quirk:samovar": {
      // Gleaming brass samovar / tea kettle on a low stand with gentle rising steam wisps!
      const top = base - 19;
      d.r(cx - 4, base - 6, 8, 7, (i, j) => (i === 0 || i === 7 || j === 6 ? 0x2c180e : j === 0 ? 0x8c5a30 : 0x60381e));
      d.r(cx - 3, top + 5, 6, 8, (i, j) => (i === 0 || i === 5 || j === 0 ? 0x6c4814 : i === 1 ? 0xf6dc7c : 0xd49c2e));
      d.r(cx - 2, top + 2, 4, 3, 0xe8bc4c);
      d.smoke.push({ x: cx, y: top + 1 });
      return true;
    }
    case "quirk:herb-rack": {
      // Compact rustic kitchen rack of hanging dried herbs & garlic.
      const top = base - 18;
      d.r(cx - 6, top + 2, 12, 2, 0x6a4020);
      for (const [hx, c1, c2] of [[cx - 4, 0x8e5ec4, 0x5a348c], [cx, 0x508c4e, 0x2e5e32], [cx + 4, 0xd4382c, 0x941e18]] as const) {
        d.r(hx - 1, top + 4, 3, 6, (i, j) => ((i + j) & 1 ? c1 : c2));
      }
      return true;
    }
    default:
      return false;
  }
}

/** Paints rich lived-in clutter vignettes (`books`, `bottles`, `candles`, `potted-herb`, `letters`, `tea-set`, `chess`). */
export function paintQuirkClutter(
  d: Pick<BackroomDraw, "s" | "r" | "flames" | "lights">,
  item: string,
  X: number,
  Y: number,
  seed: number,
): boolean {
  const ox = X + 3 + (seed % 4), oy = Y + 4 + ((seed >> 2) % 4);
  switch (item) {
    case "books": {
      // Three stacked colorful hardcover volumes with cream pages & gold spine bands.
      const cols = [0x8c2428, 0x284e7e, 0x2c6840];
      for (let k = 0; k < 3; k++) {
        const y = oy + 4 - k * 2, dx = (k === 1 ? 1 : 0);
        d.r(ox + dx, y, 7, 2, (i, j) => (j === 1 ? 0xebe4d0 : i === 2 ? 0xe8bc4c : cols[(k + seed) % 3]));
      }
      return true;
    }
    case "bottles": {
      // Pair of jewel-toned green & amber glass bottles.
      d.s(ox + 1, oy, 0x947044);
      d.r(ox, oy + 1, 3, 5, (i) => (i === 0 ? 0x58a868 : i === 2 ? 0x1e4c2a : 0x327844));
      d.s(ox + 5, oy + 1, 0x947044);
      d.r(ox + 4, oy + 2, 3, 4, (i) => (i === 0 ? 0xe8a444 : i === 2 ? 0x6c3c14 : 0xb86e24));
      return true;
    }
    case "candles": {
      // Melted beeswax candles in a brass saucer with tiny flickering flame & cozy glow!
      d.r(ox, oy + 5, 7, 2, (_i, j) => (j === 0 ? 0xdca838 : 0x7c541a));
      d.r(ox + 1, oy + 2, 2, 3, 0xf4ecd8);
      d.r(ox + 4, oy + 3, 2, 2, 0xe8dec4);
      d.flames.push({ x: ox + 1, y: oy + 1 });
      d.lights.push({ x: ox + 2, y: oy + 2, c: 0xffc664, rad: 30, k: 0.48, phase: (seed % 37) + 1 });
      return true;
    }
    case "potted-herb": {
      // Cute Stardew terracotta pot with blooming rosemary/basil.
      d.r(ox + 1, oy + 3, 5, 4, (i, j) => (j === 0 ? 0xd07448 : i === 4 || j === 3 ? 0x7c3620 : 0xb45634));
      d.r(ox, oy, 7, 3, (i, j) => ((i === 0 || i === 6) && j === 0 ? 0x2e6434 : (i + j) & 1 ? 0x5ab060 : 0x34783e));
      d.s(ox + 3, oy, 0xc492f0);
      return true;
    }
    case "letters": {
      // Cream wax-sealed letter & white goose quill.
      d.r(ox, oy + 2, 7, 5, (i, j) => (i === 0 || i === 6 || j === 0 || j === 4 ? 0xb4a890 : (i === 3 && j === 2) ? 0xb82428 : 0xf6f0e2));
      d.s(ox + 6, oy + 1, 0xf4f4f0);
      d.s(ox + 7, oy, 0xf8f8f4);
      return true;
    }
    case "tea-set": {
      // Tiny porcelain teapot & two cups on a dark wooden tray.
      d.r(ox, oy + 3, 8, 4, (i, j) => (i === 0 || i === 7 || j === 0 || j === 3 ? 0x422614 : 0x6e4424));
      d.r(ox + 1, oy + 1, 3, 3, (i) => (i === 0 ? 0xf8f6f0 : 0x5c8ab4));
      d.r(ox + 5, oy + 3, 2, 2, 0xf4f0e8);
      return true;
    }
    case "chess": {
      // Miniature wooden checkered board with tiny ivory & ebony pieces.
      d.r(ox, oy + 1, 7, 6, (i, j) => {
        if (i === 0 || i === 6 || j === 0 || j === 5) return 0x4e2e18;
        return ((i + j) & 1) ? 0xefe4cc : 0x6e4628;
      });
      d.s(ox + 2, oy + 2, 0xf8f6f0);
      d.s(ox + 4, oy + 3, 0x241c1a);
      return true;
    }
    default:
      return false;
  }
}
