import { css, mix, rgb, type CavePalette, type RGB } from "./palette";

type G = CanvasRenderingContext2D;
const K = "#17120f";
const R = (g: G, x: number, y: number, w: number, h: number, c: string) => {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), w, h);
};
const rnd = (v: number, i: number) => {
  const n = Math.sin((v + 1) * 9973.1 + i * 78.233) * 43758.5453;
  return n - Math.floor(n);
};
const OUT: RGB = [22, 10, 24], COOL: RGB = [40, 20, 52], GLOW: RGB = [255, 246, 214];
/** Tones of one colour: outline, shade, base, light, highlight. Shade leans
 * purple and light leans warm, as a painter would rather than by darkening. */
const tones = (h: string) => ramp(rgb(h));
const ramp = (c: RGB) => [css(mix(c, OUT, 0.74)), css(mix(c, COOL, 0.4)), css(c), css(mix(c, GLOW, 0.34)), css(mix(c, GLOW, 0.68))];
/** A soft oval of shadow under something standing on the floor. */
const shadow = (g: G, cx: number, y: number, hw: number) => {
  for (let j = -1; j <= 2; j++) {
    const half = Math.round(hw * Math.sqrt(1 - ((j - 0.5) / 2.4) ** 2));
    R(g, cx - half, y + j, half * 2, 1, "rgba(24,10,30,0.26)");
  }
};
/** One pixel line of outline round every row, above and below, so a shape
 * that widens or narrows is closed all the way round. */
function ring(g: G, cx: number, top: number, rows: readonly number[], c: string, lean?: readonly number[]) {
  rows.forEach((hw, i) => {
    const x = cx + (lean?.[i] ?? 0);
    if (hw > 0) for (const dy of [-1, 0, 1]) R(g, x - hw - (dy ? 0 : 1), top + i + dy, hw * 2 + (dy ? 0 : 2), 1, c);
  });
}
/** A shape turned on a lathe: half-widths row by row from the top, shaded as
 * a cylinder lit from the upper left, with a highlight stripe and a little
 * light bounced back on the shadow side. */
function turned(g: G, cx: number, top: number, rows: readonly number[], t: readonly string[], lean?: readonly number[]) {
  const hi = t[4] ?? t[3];
  ring(g, cx, top, rows, t[0], lean);
  rows.forEach((hw, i) => {
    const ox = cx + (lean?.[i] ?? 0);
    for (let x = -hw; x < hw; x++) {
      const u = (x + 0.5) / hw;
      let c = u < -0.7 ? t[2] : u < -0.1 ? t[3] : u < 0.45 ? t[2] : t[1];
      if (hw >= 3 && u > -0.55 && u < -0.2) c = hi;
      if (hw >= 4 && u > 0.8) c = t[2];
      R(g, ox + x, top + i, 1, 1, c);
    }
  });
}
/** A stalactite or icicle: a turned shape hanging point down. */
const hanging = (g: G, cx: number, top: number, len: number, hw: number, t: readonly string[]) =>
  turned(g, cx, top, Array.from({ length: len }, (_, i) => Math.max(1, Math.round(hw * (1 - i / len) ** 0.8))), t);
/** A box seen from the front and a little above. */
function box(g: G, x: number, y: number, w: number, h: number, t: readonly string[], lid = 3) {
  R(g, x - 1, y - 1, w + 2, h + 2, t[0]);
  R(g, x, y, w, lid, t[3]);
  R(g, x, y, w, 1, t[4] ?? t[3]);
  R(g, x, y + lid, w, h - lid, t[2]);
  R(g, x, y + lid, w, 1, t[1]);
  R(g, x, y + lid + 1, 1, h - lid - 2, t[3]);
  R(g, x + w - 2, y + lid, 2, h - lid, t[1]);
  R(g, x, y + h - 1, w, 1, t[1]);
}
function stamp(g: G, x: number, y: number, rows: readonly string[], ink: Record<string, string>) {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = ink[row[i]];
      if (c) R(g, x + i, y + j, 1, 1, c);
    }
  });
}
/** A lump of rock: wider than tall, shaded as a rounded mass lit from the
 * upper left, with grain, a highlight and a dark seat on the floor. */
function lump(g: G, cx: number, base: number, hw: number, hh: number, t: readonly string[], grain = 0.5) {
  const hi = t[4] ?? t[3];
  const half = (j: number) => Math.max(1, Math.round(hw * Math.sqrt(1 - (1 - (j + 0.5) / hh) ** 2 * 0.9)));
  const rows = Array.from({ length: hh }, (_, j) => half(j));
  ring(g, cx, base - hh, rows, t[0]);
  rows.forEach((hf, j) => {
    for (let x = -hf; x < hf; x++) {
      const nx = (x + 0.5) / hf, ny = ((j + 0.5) / hh) * 2 - 1;
      let l = -nx * 0.55 - ny * 0.85 + (rnd(grain + x * 0.13, j * 7 + x) - 0.5) * 0.3;
      if (j === hh - 1) l -= 0.6;
      const c = l > 0.95 && nx < 0 ? hi : l > 0.35 ? t[3] : l > -0.3 ? t[2] : t[1];
      R(g, cx + x, base - hh + j, 1, 1, c);
    }
  });
}
/** A small pool in a rim of its own deposit, as rimstone dams one. */
function pool(g: G, cx: number, cy: number, rx: number, ry: number, pal: CavePalette, v: number) {
  for (let dy = -ry - 1; dy <= ry + 1; dy++)
    for (let dx = -rx - 1; dx <= rx + 1; dx++) {
      const wob = 1 + Math.sin(Math.atan2(dy, dx) * 3 + v * 9) * 0.12;
      const e = Math.hypot(dx / rx, dy / ry) / wob;
      if (e > 1.3) continue;
      const c = e > 1.1 ? (dy < 0 ? pal.face[1] : pal.face[3]) : e > 0.85 && dy < 0 ? pal.water[0] : dy > 0 && e > 0.6 ? pal.water[2] : pal.water[1];
      R(g, cx + dx, cy + dy, 1, 1, css(c));
    }
  R(g, cx - Math.floor(rx / 2), cy, 3, 1, css(pal.water[3]));
}
const scatter = (_g: G, x: number, y: number, v: number, n: number, draw: (px: number, py: number, i: number) => void) => {
  for (let i = 0; i < n; i++) draw(x + 2 + Math.floor(rnd(v, i * 2) * 12), y + 3 + Math.floor(rnd(v, i * 2 + 1) * 10), i);
};

const BONE = tones("#d8ceb4"), WOOD = tones("#7a5634"), CLAY = tones("#b06a40"), IRON = tones("#5a5e66"), CLOTH = tones("#b9a888"), GOLD = tones("#d8a838");

const GLYPH = {
  bison: ["....#####.......", "..#########.....", ".###########.##.", "#############.#.", "#############...", ".###########....", "..##.....##.....", "..##.....##.....", "..#......#......"],
  horse: ["..........##..", ".........###.#", "..#########...", ".##########...", "###########...", "#.########....", "..##....##....", "..#.....#.....", "..#.....#....."],
  deer: [".#.#......", "#.#.#.....", ".###......", "..##......", "..#######.", "..########", "..##...##.", "..#.....#.", "..#.....#."],
  cow: ["#...#.........", ".#.#..........", ".###..........", "####.########.", ".############.", "..###########.", "..##......##..", "..##......##..", "..#.......#..."],
  hand: ["..#.#..", ".##.#.#", ".##.###", ".######", "#######", "#######", ".#####.", ".#####.", "..###.."],
  man: [".##..", ".##..", "..#..", ".###.", "#.#.#", "..#..", ".#.#.", ".#.#.", "#...#"],
  archer: [".##...#", ".##..#.", "..#.#..", ".####..", "#.#.#..", "..#..#.", ".#.#..#", ".#.#...", "#...#.."],
  spirit: [".###.", "#####", "#.#.#", "#####", ".###.", ".###.", ".###.", ".###.", ".###.", ".#.#.", ".#.#."],
};

/** Everything that stands or lies in a cave. `x, y` is the top-left of its
 * cell; tall things draw up out of it and wall things onto the face above
 * its lower edge. `v` is a 0..1 roll for variety. */
export function paintCaveObject(g: G, key: string, x: number, y: number, pal: CavePalette, v = 0.5, done = false) {
  const [art, variant] = key.split(":");
  const cx = x + 8, base = y + 14;
  const rock = [css(mix(pal.face[0], OUT, 0.5)), css(pal.face[1]), css(pal.face[2]), css(pal.face[3]), css(pal.face[4])];
  const pale = [css(mix(pal.face[0], OUT, 0.5)), css(pal.face[2]), css(pal.face[3]), css(pal.face[4]), css(mix(pal.face[4], GLOW, 0.5))];
  const fl = pal.floor.map((c) => css(c));
  const gone = () => {
    R(g, x + 3, y + 8, 10, 5, css(pal.floor[0], 0.55));
    R(g, x + 5, y + 7, 6, 1, css(pal.floor[0], 0.4));
  };
  switch (art) {
    // What the rock grows.
    case "stalagmite": {
      const hgt = 14 + Math.floor(v * 12), tilt = rnd(v, 1) < 0.5 ? -1 : 1;
      shadow(g, cx, base - 1, 8);
      // Built of drips: it swells and pinches as it rises, and leans a little.
      const rows = Array.from({ length: hgt }, (_, i) => {
        const f = i / hgt;
        return Math.max(1, Math.round(0.7 + f ** 1.15 * 4.6 + Math.sin(i * 0.8 + v * 9) * 0.7 * f));
      });
      const lean = rows.map((_, i) => Math.round((1 - i / hgt) * tilt * 1.6));
      turned(g, cx, base - hgt - 1, rows, pale, lean);
      // A skirt of flowstone where the drips spread at its foot.
      lump(g, cx, base + 1, 7, 3, pale, v);
      R(g, cx - 1 + lean[0], base - hgt - 1, 1, 1, pale[4]);
      R(g, cx + lean[0], base - hgt - 2, 1, 1, "rgba(220,240,250,0.85)");
      break;
    }
    case "column": {
      shadow(g, cx, base - 1, 9);
      // A stalactite and stalagmite grown together: thick at both ends,
      // pinched where they met, with draperies down its sides.
      const rows = Array.from({ length: 34 }, (_, i) => Math.max(2, Math.round(2.4 + Math.abs(i - 14) ** 1.5 / 15 + Math.sin(i * 0.7 + v * 5) * 0.8)));
      const lean = rows.map((_, i) => Math.round(Math.sin(i / 6 + v * 5) * 1.2));
      turned(g, cx, base - 34, rows, pale, lean);
      lump(g, cx, base + 1, 8, 3, pale, v);
      for (let i = 0; i < 4; i++) {
        const from = 4 + Math.floor(rnd(v, i + 4) * 14), len = 5 + Math.floor(rnd(v, i) * 9), side = i % 2 ? 1 : -1;
        for (let j = 0; j < len; j++) R(g, cx + lean[from + j] + side * (rows[from + j] - 1 - (i >> 1)), base - 34 + from + j, 1, 1, side < 0 ? pale[4] : pale[1]);
      }
      break;
    }
    case "boulder": {
      shadow(g, cx, base - 1, 8);
      const hw = 5 + Math.floor(v * 3), hh = 8 + Math.floor(v * 4);
      lump(g, cx, base, hw, hh, rock, v);
      // A crack down from the crown, and a chip off the lit shoulder.
      for (let j = 0, px = cx + 1; j < hh - 3; j++) {
        R(g, px, base - hh + 1 + j, 1, 1, rock[1]);
        if (rnd(v, j + 40) < 0.4) px += rnd(v, j + 50) < 0.5 ? -1 : 1;
      }
      R(g, cx - hw + 2, base - hh + 3, 2, 1, rock[4]);
      lump(g, cx + hw + 1, base + 1, 2, 3, rock, v + 1);
      break;
    }
    case "lavarock":
      shadow(g, cx, base - 1, 7);
      lump(g, cx, base, 6, 6 + Math.floor(v * 5), rock);
      for (let i = 0; i < 6; i++) R(g, cx - 4 + Math.floor(rnd(v, i) * 8), base - 2 - Math.floor(rnd(v, i + 9) * 6), 1, 1, K);
      break;
    case "searock":
      shadow(g, cx, base - 1, 7);
      lump(g, cx, base, 6, 8, rock);
      for (let i = 0; i < 7; i++) R(g, cx - 5 + Math.floor(rnd(v, i) * 10), base - 1 - Math.floor(rnd(v, i + 5) * 4), 1, 1, "#d8d4c0");
      R(g, cx - 5, base - 2, 10, 1, css(pal.stain));
      break;
    case "icecolumn": {
      const t = tones("#a8d4ee");
      shadow(g, cx, base - 1, 6);
      turned(g, cx, base - 26, Array.from({ length: 26 }, (_, i) => Math.round(2 + (i / 26) ** 2 * 4 + (i < 4 ? 2 - i / 2 : 0))), t);
      R(g, cx - 1, base - 22, 1, 14, "#f4fcff");
      break;
    }
    // Litter underfoot.
    case "pebbles":
      scatter(g, x, y, v, 5, (px, py, i) => lump(g, px + 1, py + 2, 1 + (i % 2), 2, rock, v + i));
      break;
    case "scree":
      scatter(g, x, y, v, 6, (px, py, i) => lump(g, px + 1, py + 2, 1 + (i % 3 === 0 ? 1 : 0), 2 + (i % 2), rock, v + i));
      break;
    case "crack":
      for (let i = 0, px = x + 2, py = y + 4 + Math.floor(v * 6); i < 11; i++) {
        R(g, px, py, 1, 1, fl[0]);
        px += 1;
        py += rnd(v, i) < 0.35 ? 1 : rnd(v, i) > 0.75 ? -1 : 0;
      }
      break;
    case "puddle":
      pool(g, cx + Math.round((v - 0.5) * 4), y + 9, 5 + Math.floor(v * 3), 3, pal, v);
      break;
    case "straws":
      for (let i = 0; i < 5; i++) {
        const px = x + 2 + Math.floor(rnd(v, i) * 12), py = y + 4 + Math.floor(rnd(v, i + 9) * 9), len = 2 + (i % 3);
        R(g, px - 1, py, len + 2, 3, pale[0]);
        R(g, px, py + 1, len, 1, i % 2 ? pale[3] : pale[2]);
      }
      break;
    case "ropes":
      for (let i = 0; i < 4; i++) {
        R(g, x + 2 + i, y + 3 + i * 3, 10 - i, 1, fl[3]);
        R(g, x + 3 + i, y + 4 + i * 3, 10 - i, 1, fl[0]);
      }
      break;
    case "cinders":
      scatter(g, x, y, v, 6, (px, py, i) => R(g, px, py, 2, 1, i % 3 ? fl[0] : css(pal.stain)));
      break;
    case "snow":
      R(g, x + 2, y + 6, 12, 5, "#e8f4fa");
      R(g, x + 4, y + 5, 7, 1, "#ffffff");
      R(g, x + 3, y + 11, 10, 1, "#a8c8dc");
      break;
    case "frost":
      scatter(g, x, y, v, 8, (px, py) => R(g, px, py, 1, 1, "#f4fcff"));
      break;
    case "weed":
      for (let i = 0; i < 4; i++) {
        const px = x + 2 + Math.floor(rnd(v, i) * 10), py = y + 4 + Math.floor(rnd(v, i + 4) * 7);
        R(g, px, py, 4, 1, "#3d5a2c");
        R(g, px + 1, py + 1, 4, 1, "#5a7a34");
        R(g, px + 3, py - 1, 1, 1, "#8a9a44");
      }
      break;
    case "sandripple":
      for (let i = 0; i < 3; i++) {
        R(g, x + 1 + i * 2, y + 4 + i * 4, 9, 1, fl[3]);
        R(g, x + 2 + i * 2, y + 5 + i * 4, 9, 1, fl[0]);
      }
      break;
    case "dust":
      scatter(g, x, y, v, 6, (px, py) => R(g, px, py, 2, 1, fl[3]));
      break;
    case "moss":
      scatter(g, x, y, v, 5, (px, py, i) => {
        R(g, px, py, 3, 2, i % 2 ? "#4f6a34" : "#3d5a2c");
        R(g, px, py, 1, 1, "#7a9a48");
      });
      break;
    case "droppings":
      R(g, x + 3, y + 6, 10, 6, "rgba(20,14,10,0.5)");
      scatter(g, x, y, v, 6, (px, py) => R(g, px, py, 1, 1, "#d8ceb4"));
      break;
    // On the rock face.
    case "flowstone": {
      // Draperies poured down the face, and a stalactite at its lip.
      for (let i = 0; i < 5; i++) {
        const len = 9 + Math.floor(rnd(v, i) * 12), fx = x + 1 + i * 3;
        R(g, fx - 1, y - 7, 4, len + 1, pale[0]);
        R(g, fx, y - 7, 2, len, i % 2 ? pale[2] : pale[3]);
        R(g, fx, y - 7, 1, len - 2, pale[4]);
        R(g, fx + 1, y - 7 + len - 1, 1, 2, pale[1]);
      }
      hanging(g, x + 14, y - 8, 7, 2, pale);
      break;
    }
    case "icicles": {
      const t = tones("#bfe4f6");
      for (let i = 0; i < 5; i++) hanging(g, x + 2 + i * 3, y - 7, 6 + Math.floor(rnd(v, i) * 10), 1 + (i % 2), t);
      break;
    }
    case "barnacles":
      for (let i = 0; i < 14; i++) R(g, x + Math.floor(rnd(v, i) * 15), y + 4 + Math.floor(rnd(v, i + 20) * 10), 2, 1, i % 3 ? "#cfcab4" : "#4a7a4a");
      break;
    case "lavadrip":
      for (let i = 0; i < 4; i++) hanging(g, x + 3 + i * 4, y - 6, 4 + Math.floor(rnd(v, i) * 8), 2, rock);
      break;
    case "roots":
      for (let i = 0; i < 4; i++) {
        let px = x + 2 + i * 4;
        for (let j = 0, len = 8 + Math.floor(rnd(v, i) * 10); j < len; j++) {
          R(g, px, y - 6 + j, 1, 1, j % 5 === 4 ? "#8a6a44" : "#5a4028");
          if (rnd(v, i * 31 + j) < 0.3) px += rnd(v, i * 17 + j) < 0.5 ? -1 : 1;
        }
      }
      break;
    case "stain":
      for (let i = 0; i < 3; i++) R(g, x + 2 + i * 5, y - 4, 2, 10 + Math.floor(rnd(v, i) * 8), css(pal.stain, 0.45));
      break;
    // The way on.
    case "down": {
      // A shaft in the floor: a ring of rim stones, the far wall falling away
      // inside, and the rope pegged at the lip and running down.
      const ox = x + 8, oy = y + 8, rx = 9, ry = 6;
      for (let dy = -ry - 2; dy <= ry + 2; dy++)
        for (let dx = -rx - 2; dx <= rx + 2; dx++) {
          const e = (dx / rx) ** 2 + (dy / ry) ** 2;
          let c: string | undefined;
          if (e < 1) {
            const far = dy < 0 && e > 0.42;
            c = far ? (dx < -2 ? rock[2] : rock[1]) : e > 0.25 && dy < 2 ? "#120c10" : "#050406";
            if (far && (dx + 30) % 4 === 0) c = rock[0];
          } else if (e < 1.7) {
            const a = (Math.atan2(dy, dx) + Math.PI) * 2.6;
            const edge = e > 1.5 || a % 1 < 0.14;
            c = edge ? rock[0] : dy < 0 ? (dx < 0 ? rock[4] : rock[3]) : rnd(Math.floor(a), 3) < 0.5 ? rock[2] : rock[3];
          }
          if (c) R(g, ox + dx, oy + dy, 1, 1, c);
        }
      box(g, ox + 6, oy - 9, 3, 5, WOOD, 1);
      for (let j = 0; j < 10; j++) R(g, ox + 6 - Math.floor(j / 3), oy - 4 + j, 1, 1, j % 2 ? "#a8905c" : "#d8c088");
      break;
    }
    case "up": {
      // A rope hung from a ledge above, knotted for the hands, coiled at the foot.
      for (let j = 0; j < 30; j++) {
        const sway = Math.round(Math.sin(j / 6) * 0.6);
        R(g, x + 7 + sway, y - 16 + j, 3, 1, "#3a2a18");
        R(g, x + 8 + sway, y - 16 + j, 1, 1, j % 3 ? "#c8a868" : "#e8d098");
        if (j % 6 === 4) R(g, x + 6 + sway, y - 17 + j, 5, 3, "#3a2a18"), R(g, x + 7 + sway, y - 16 + j, 3, 1, "#d8bc80");
      }
      for (let j = 0; j < 3; j++) {
        R(g, x + 3 + j, y + 11 + j, 10 - j * 2, 2, "#3a2a18");
        R(g, x + 4 + j, y + 11 + j, 8 - j * 2, 1, j % 2 ? "#a8905c" : "#d8bc80");
      }
      break;
    }
    // Nodes.
    case "flint":
      if (done) return gone();
      // Nodules weathered out of the chalk: black glassy cores in white rind.
      for (const [dx, dy, r] of [[-3, 0, 3], [3, 2, 2], [0, 4, 2]] as const) {
        lump(g, cx + dx, base - 2 + dy, r + 1, r + 1, tones("#e2dccb"), v + dx);
        lump(g, cx + dx, base - 3 + dy, r, r, tones("#2a2830"), v + dy);
      }
      break;
    case "salt": {
      if (done) return gone();
      const t = tones(variant === "grey" ? "#b8b4a8" : "#ebe8e0");
      shadow(g, cx, base - 1, 7);
      lump(g, cx, base, 7, 5, t, v);
      // Cubes of salt growing out of the crust.
      for (let i = 0; i < 5; i++) {
        const px = cx - 5 + Math.floor(rnd(v, i) * 9), py = base - 4 - Math.floor(rnd(v, i + 5) * 4);
        R(g, px - 1, py - 1, 4, 4, t[0]);
        R(g, px, py, 2, 2, t[3]);
        R(g, px, py, 1, 1, "#ffffff");
        R(g, px + 1, py + 1, 1, 1, t[1]);
      }
      break;
    }
    case "guano":
      if (done) return gone();
      lump(g, cx, base, 6, 5, tones("#3a2e24"));
      scatter(g, x, y + 2, v, 5, (px, py) => R(g, px, py, 1, 1, "#d8ceb4"));
      break;
    case "crystal": {
      if (done) return gone();
      const t = tones(variant === "honey" ? "#e0a848" : variant === "amber" ? "#e88a20" : "#a8dcf4");
      shadow(g, cx, base - 1, 7);
      lump(g, cx, base + 1, 6, 3, rock, v);
      // Prisms, each with a lit face, a shadowed face and a pointed cap.
      for (const [dx, hgt, lean, hw] of [[-5, 8, -2, 2], [4, 9, 2, 2], [0, 14, 0, 3], [-2, 6, -1, 2]] as const) {
        const rows = Array.from({ length: hgt }, (_, j) => (j < hw ? j + 1 : hw));
        const at = (j: number) => cx + dx + Math.round((lean * (hgt - j)) / hgt);
        rows.forEach((wd, j) => R(g, at(j) - wd - 1, base - hgt + j - 1, wd * 2 + 2, 3, t[0]));
        rows.forEach((wd, j) => {
          const px = at(j), py = base - hgt + j;
          R(g, px - wd, py, wd, 1, j < hw ? t[4] : t[3]);
          R(g, px, py, wd, 1, j < hw ? t[2] : t[1]);
          if (j > hw && j % 4 === 1) R(g, px - wd, py, 1, 1, t[4]);
        });
      }
      R(g, cx - 1, base - 13, 1, 3, "#ffffff");
      break;
    }
    case "pearls":
      pool(g, cx, y + 9, 6, 4, pal, v);
      if (!done) for (let i = 0; i < 4; i++) {
        const px = cx - 4 + Math.floor(rnd(v, i) * 7), py = y + 7 + Math.floor(rnd(v, i + 4) * 3);
        R(g, px, py + 1, 2, 1, "#a8a28e");
        R(g, px, py, 2, 1, "#ece6d4");
        R(g, px, py, 1, 1, "#ffffff");
      }
      break;
    case "sulphur":
      if (done) return gone();
      lump(g, cx, base, 6, 5, tones("#d8c830"));
      R(g, cx - 2, base - 3, 4, 2, "#1a1410");
      scatter(g, x, y + 3, v, 5, (px, py) => R(g, px, py, 1, 1, "#f8f080"));
      break;
    case "obsidian":
      if (done) return gone();
      shadow(g, cx, base - 1, 6);
      lump(g, cx, base, 5, 7, tones("#26222c"));
      R(g, cx - 3, base - 6, 1, 4, "#c8c0e0");
      R(g, cx + 1, base - 4, 2, 1, "#8a84a8");
      break;
    case "clay": {
      const t = tones("#8e8a80");
      lump(g, cx, base, 7, 5, t, v);
      R(g, cx - 4, base - 4, 5, 1, t[4]);
      if (done) R(g, cx - 2, base - 4, 5, 3, t[0]);
      else for (let i = 0; i < 3; i++) R(g, cx - 3 + i * 3, base - 2, 2, 1, t[1]);
      break;
    }
    case "mushrooms": {
      if (done) return gone();
      const cap = tones("#e8dcc0"), stem = tones("#d0c4a4");
      for (let i = 0; i < 4; i++) {
        const px = x + 3 + i * 3 + (i % 2), py = y + 5 + ((i * 5) % 6), r = i % 3 === 0 ? 3 : 2;
        R(g, px - 1, py + 1, 3, 4, stem[0]);
        R(g, px, py + 1, 1, 3, stem[3]);
        turned(g, px, py - 1, r === 3 ? [2, 3, 3] : [1, 2, 2], cap);
        R(g, px - r + 1, py + 2 - (r === 3 ? 0 : 1), r * 2 - 2, 1, cap[1]);
      }
      break;
    }
    case "spring":
      lump(g, cx, base, 7, 6, rock);
      R(g, cx - 5, base - 5, 10, 3, css(pal.water[2]));
      R(g, cx - 4, base - 5, 4, 1, css(pal.water[3]));
      R(g, cx - 5, base - 2, 10, 1, css(pal.water[0]));
      break;
    case "ice": {
      if (done) return gone();
      // A block of clear ice: a lit top, two faces, a frozen bubble or two.
      const t = tones("#9cd0ee");
      shadow(g, cx, base - 1, 7);
      box(g, x + 2, y + 3, 12, 11, t, 4);
      R(g, x + 3, y + 8, 1, 4, t[4]);
      R(g, x + 9, y + 7, 2, 2, t[4]);
      R(g, x + 6, y + 10, 1, 1, "#ffffff");
      R(g, x + 4, y + 4, 6, 1, "#ffffff");
      break;
    }
    case "carcass": {
      // An animal caught in the ice: a dark shape seen through a frozen mound.
      const t = tones("#a8cce0");
      shadow(g, cx, base - 1, 8);
      lump(g, cx, base, 8, 7, t, v);
      R(g, cx - 5, base - 5, 8, 3, done ? t[1] : "#6a4a30");
      R(g, cx + 2, base - 6, 3, 2, done ? t[1] : "#4a3020");
      R(g, cx - 4, base - 4, 6, 1, done ? t[2] : "#8a6a48");
      R(g, cx - 5, base - 7, 5, 1, t[4]);
      break;
    }
    case "shells":
      if (done) return gone();
      scatter(g, x, y, v, 7, (px, py, i) => {
        const t = tones(["#f0e4d0", "#e8b8a0", "#d8d0c0", "#c8a890"][i % 4]);
        R(g, px - 1, py - 1, 5, 4, t[0]);
        R(g, px, py, 3, 2, t[2]);
        R(g, px, py, 1, 1, t[4]);
        R(g, px + 1, py + 1, 1, 1, t[1]);
      });
      break;
    case "driftwood": {
      if (done) return gone();
      const t = tones("#cfc6b2");
      shadow(g, cx, base - 1, 8);
      // A bleached log with a snapped branch, its grain running along it.
      R(g, x, y + 7, 16, 6, t[0]);
      R(g, x + 1, y + 8, 14, 4, t[2]);
      R(g, x + 1, y + 8, 14, 1, t[4]);
      R(g, x + 1, y + 11, 14, 1, t[1]);
      for (let i = 0; i < 3; i++) R(g, x + 3 + i * 4, y + 9 + (i % 2), 3, 1, t[1]);
      R(g, x + 9, y + 3, 4, 5, t[0]);
      R(g, x + 10, y + 3, 2, 5, t[3]);
      R(g, x + 15, y + 8, 1, 4, t[1]);
      break;
    }
    case "ambergris":
      if (done) return gone();
      R(g, x + 2, y + 9, 12, 3, "#3d5a2c");
      lump(g, cx, base - 1, 4, 4, tones("#9a968a"));
      break;
    case "tidepool":
      pool(g, cx, y + 9, 7, 4, pal, v);
      R(g, cx - 4, y + 9, 2, 2, "#e86a4a"), R(g, cx - 4, y + 9, 1, 1, "#ffb090");
      R(g, cx + 2, y + 8, 3, 3, "#6a3a88"), R(g, cx + 3, y + 9, 1, 1, "#e0b0f0");
      R(g, cx - 1, y + 11, 3, 1, "#4a7a3a");
      break;
    // What animals and people left.
    case "bones": {
      // Long bones with knuckled ends, and a small skull among them.
      const bone = (bx: number, by: number, len: number, up: boolean) => {
        const [bw, bh] = up ? [1, len] : [len, 1];
        R(g, bx - 1, by - 1, bw + 2, bh + 2, BONE[0]);
        for (const [ex, ey] of up ? [[bx, by], [bx, by + len - 1]] : [[bx, by], [bx + len - 1, by]]) {
          R(g, ex - 1, ey - 1, 3, 3, BONE[0]);
          R(g, ex - (up ? 1 : 0), ey - (up ? 0 : 1), up ? 3 : 1, up ? 1 : 3, BONE[2]);
        }
        R(g, bx, by, bw, bh, BONE[3]);
      };
      bone(x + 2 + Math.floor(v * 3), y + 5, 8, false);
      bone(x + 4, y + 10, 6, false);
      bone(x + 13, y + 3 + Math.floor(v * 3), 6, true);
      R(g, x + 8, y + 7, 5, 5, BONE[0]);
      R(g, x + 9, y + 8, 3, 3, BONE[2]);
      R(g, x + 9, y + 8, 2, 1, BONE[4]);
      R(g, x + 9, y + 9, 1, 1, K), R(g, x + 11, y + 9, 1, 1, K);
      break;
    }
    case "bearskull": {
      // A cave bear's skull: long snout, high domed crown, the eye sockets dark.
      shadow(g, cx, base - 1, 8);
      lump(g, cx - 2, base - 2, 6, 8, BONE, v);
      lump(g, cx + 4, base - 1, 4, 5, BONE, v + 1);
      R(g, cx - 3, base - 7, 2, 2, K), R(g, cx + 1, base - 6, 2, 2, K);
      R(g, cx + 6, base - 4, 1, 1, K);
      R(g, cx + 3, base - 1, 1, 3, done ? BONE[1] : BONE[4]);
      R(g, cx + 6, base - 1, 1, 3, done ? BONE[1] : BONE[4]);
      R(g, cx - 6, base - 3, 9, 1, BONE[1]);
      break;
    }
    case "tusk": {
      if (done) return gone();
      // A curved tusk, thick at the root and fining to the tip.
      const pts = Array.from({ length: 13 }, (_, i) => ({ px: x + 1 + i, py: y + 12 - Math.round(Math.sin((i / 12) * Math.PI * 0.9) * 8), r: Math.max(1, Math.round(2.4 - i * 0.16)) }));
      for (const { px, py, r } of pts) R(g, px - 1, py - r, 3, r * 2 + 1, BONE[0]);
      for (const { px, py, r } of pts) {
        R(g, px, py - r + 1, 1, r * 2 - 1, BONE[2]);
        R(g, px, py - r + 1, 1, 1, BONE[4]);
        R(g, px, py + r - 1, 1, 1, BONE[1]);
      }
      break;
    }
    case "lamp": {
      if (done) return gone();
      // A stone lamp: a hollowed bowl with a handle, soot-black in the cup.
      const t = ramp(pal.face[2]);
      shadow(g, cx, base - 1, 6);
      lump(g, cx - 1, base - 1, 5, 4, t, v);
      R(g, cx - 4, base - 5, 6, 2, "#1a1210");
      R(g, cx - 3, base - 5, 3, 1, "#3a2a20");
      R(g, cx + 4, base - 4, 3, 2, t[0]), R(g, cx + 4, base - 4, 2, 1, t[3]);
      break;
    }
    case "figure":
      if (done) return gone();
      R(g, x + 3, y + 11, 10, 3, css(pal.face[1]));
      R(g, x + 3, y + 11, 10, 1, css(pal.face[3]));
      turned(g, cx, y + 1, [1, 1, 1, 2, 3, 3, 2, 3, 3, 2], tones("#e0d4b8"));
      break;
    case "hearth": {
      // A ring of fire-cracked stones round ash and charcoal.
      R(g, cx - 5, y + 6, 10, 5, "#2a2220");
      R(g, cx - 4, y + 7, 8, 3, "#5a5450");
      R(g, cx - 2, y + 8, 4, 1, "#8a8680");
      if (!done) R(g, cx - 3, y + 7, 2, 1, "#1a1410"), R(g, cx + 1, y + 9, 3, 1, "#1a1410"), R(g, cx, y + 8, 1, 1, "#c8501c");
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        lump(g, cx + Math.round(Math.cos(a) * 6.5), y + 10 + Math.round(Math.sin(a) * 4), 2, 3, rock, v + i);
      }
      if (variant === "trident") {
        R(g, x + 13, y - 11, 3, 23, IRON[0]);
        R(g, x + 14, y - 6, 1, 18, IRON[2]);
        R(g, x + 12, y - 6, 5, 1, IRON[2]);
        R(g, x + 12, y - 9, 1, 3, IRON[3]);
        R(g, x + 16, y - 9, 1, 3, IRON[3]);
        R(g, x + 14, y - 10, 1, 4, IRON[4]);
        R(g, x + 13, y - 3, 3, 1, "#e06a28");
      }
      break;
    }
    case "burial": {
      // A grave cut in the floor, the body laid out in it.
      const red = variant !== "plain" && variant !== "crystal";
      for (let dy = -6; dy <= 6; dy++)
        for (let dx = -12; dx <= 12; dx++) {
          const e = (dx / 12) ** 2 + (dy / 6) ** 2;
          if (e > 1) continue;
          const c = e > 0.75 ? (dy < 0 ? pal.floor[0] : pal.floor[3]) : red ? [138, 58, 36] : variant === "crystal" ? pal.face[3] : pal.floor[1];
          R(g, cx + dx, y + 8 + dy, 1, 1, css(c as RGB));
        }
      const b = variant === "crystal" ? ramp([200, 230, 244]) : BONE;
      R(g, cx - 10, y + 5, 5, 5, b[0]), R(g, cx - 9, y + 6, 3, 3, b[2]), R(g, cx - 9, y + 6, 2, 1, b[4]), R(g, cx - 9, y + 7, 1, 1, K);
      R(g, cx - 5, y + 7, 10, 2, b[0]), R(g, cx - 5, y + 7, 10, 1, b[3]);
      for (let i = 0; i < 4; i++) R(g, cx - 4 + i * 2, y + 5, 1, 6, b[2]);
      R(g, cx + 5, y + 6, 6, 1, b[2]), R(g, cx + 5, y + 9, 6, 1, b[2]);
      R(g, cx + 10, y + 5, 2, 2, b[3]), R(g, cx + 10, y + 9, 2, 2, b[3]);
      if (variant === "crystal") for (let i = 0; i < 6; i++) R(g, cx - 9 + Math.floor(rnd(v, i) * 18), y + 4 + Math.floor(rnd(v, i + 7) * 8), 1, 1, "#ffffff");
      else if (!done && red) for (let i = 0; i < 7; i++) R(g, cx - 7 + i * 2, y + 11, 1, 1, i % 2 ? "#f0e8d8" : "#c8a040");
      break;
    }
    case "ossuary":
      shadow(g, cx, base - 1, 8);
      for (let i = 0; i < 4; i++) {
        R(g, x + i * 4, y + 3, 4, 4, BONE[0]);
        R(g, x + i * 4, y + 3, 3, 3, BONE[2]);
        R(g, x + i * 4, y + 3, 2, 1, BONE[3]);
        R(g, x + i * 4 + 1, y + 4, 1, 1, K);
      }
      for (let j = 0; j < 3; j++) {
        R(g, x, y + 8 + j * 2, 16, 1, BONE[2]);
        R(g, x, y + 9 + j * 2, 16, 1, BONE[1]);
      }
      break;
    case "midden":
      lump(g, cx, base, 7, 5, tones("#9a948a"));
      scatter(g, x, y + 3, v, 9, (px, py, i) => R(g, px, py, 2, 1, i % 3 ? "#e0d8c8" : "#5a5650"));
      if (done) R(g, cx - 2, base - 3, 5, 2, "#4a4640");
      break;
    case "axes": {
      const t = variant === "bronze" ? tones("#5a9a7a") : tones("#5a7a5a");
      lump(g, cx, base, 7, 4, rock);
      if (!done) for (let i = 0; i < 3; i++) {
        R(g, x + 2 + i * 4, y + 2, 4, 7, t[0]);
        R(g, x + 3 + i * 4, y + 3, 2, 5, t[2]);
        R(g, x + 3 + i * 4, y + 3, 1, 5, t[3]);
      }
      break;
    }
    case "pots": {
      const tall = variant === "tall";
      shadow(g, cx, base - 1, 8);
      for (const [dx, s] of [[-5, 0], [1, 1], [5, 0]] as const) {
        const rows = tall ? [1, 2, 2, 3, 3, 3, 3, 3, 3, 2, 2, 1] : [1, 2, 3, 4, 4, 4, 3, 2];
        turned(g, cx + dx, base - rows.length - s, rows, s ? tones("#c88050") : CLAY);
        if (!done) R(g, cx + dx - 1, base - rows.length - s, 2, 1, "#1a1410");
      }
      break;
    }
    case "jar": {
      shadow(g, cx, base - 1, 7);
      for (const dx of [-4, 4]) {
        turned(g, cx + dx, base - 17, [2, 2, 1, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 3, 3, 2, 2], CLAY);
        if (done && dx > 0) R(g, cx + dx - 2, base - 18, 4, 2, "#1a1410");
        else R(g, cx + dx - 3, base - 18, 6, 2, CLAY[3]);
      }
      if (variant === "scrolls" && !done) for (let i = 0; i < 4; i++) R(g, x + 3 + i * 3, y + 10 - (i % 2) * 2, 2, 4, "#e8dcb8");
      break;
    }
    case "hoard":
      shadow(g, cx, base - 1, 5);
      turned(g, cx, base - 9, [2, 3, 4, 5, 5, 5, 4, 3, 3], CLAY);
      if (!done) {
        R(g, cx - 2, base - 10, 5, 2, GOLD[2]);
        R(g, cx - 1, base - 11, 2, 1, GOLD[3]);
        R(g, cx + 5, base - 1, 2, 1, GOLD[2]);
        R(g, cx - 7, base, 2, 1, GOLD[3]);
      } else R(g, cx - 2, base - 9, 4, 1, "#1a1410");
      break;
    case "coffin": {
      shadow(g, cx, base - 1, 9);
      if (variant === "log") {
        R(g, x - 2, y + 1, 1, 14, WOOD[1]);
        R(g, x + 17, y + 1, 1, 14, WOOD[1]);
        box(g, x - 3, y + 3, 22, 7, WOOD, 3);
        for (let i = 0; i < 5; i++) R(g, x - 1 + i * 4, y + 4, 2, 1, WOOD[1]);
        if (done) R(g, x + 2, y + 5, 12, 3, "#1a1410");
        break;
      }
      for (const [dy, c] of [[6, "#b8863c"], [0, "#c89a48"]] as const) {
        const t = tones(c);
        box(g, x - 3, y + dy, 22, 7, t, 3);
        R(g, x - 3, y + dy, 5, 7, "#2a4a8a");
        R(g, x - 2, y + dy + 2, 3, 3, "#e8c890");
        for (let i = 0; i < 5; i++) R(g, x + 4 + i * 3, y + dy + 1, 1, 5, i % 2 ? "#a8382c" : "#2a6a5a");
      }
      if (done) R(g, x + 2, y + 1, 14, 3, "#1a1410");
      break;
    }
    case "mummy":
      shadow(g, cx, base - 1, 9);
      for (const dx of [-6, 0, 6]) {
        turned(g, cx + dx, base - 13, [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2], dx ? CLOTH : tones("#a85a3c"));
        R(g, cx + dx - 1, base - 12, 2, 2, "#3a2a20");
        R(g, cx + dx - 3, base - 6, 6, 1, dx ? "#a8382c" : "#e8c060");
      }
      if (done) R(g, cx - 2, base - 4, 5, 3, "#3a2a20");
      break;
    case "tools":
      if (variant === "cart") {
        box(g, x + 1, y + 4, 11, 7, WOOD, 2);
        R(g, x + 12, y + 6, 5, 1, WOOD[1]);
        R(g, x + 3, y + 11, 4, 4, IRON[0]);
        R(g, x + 4, y + 12, 2, 2, IRON[3]);
        for (let i = 0; i < 2; i++) box(g, x - 3 + i * 3, y + 9, 4, 5, CLOTH, 2);
        break;
      }
      R(g, x + 2, y + 12, 12, 1, WOOD[1]);
      R(g, x + 2, y + 3, 1, 10, WOOD[2]);
      R(g, x, y + 3, 6, 2, IRON[2]);
      R(g, x, y + 3, 6, 1, IRON[3]);
      turned(g, x + 11, y + 6, [3, 4, 4, 4, 3], tones("#a8905c"));
      if (!done) R(g, x + 9, y + 5, 5, 2, css(pal.stain));
      break;
    case "bedroll": {
      R(g, x - 2, y + 5, 20, 8, variant === "stone" ? css(pal.face[2]) : "#8a7a4c");
      R(g, x - 2, y + 5, 20, 1, variant === "stone" ? css(pal.face[4]) : "#b0a068");
      R(g, x - 2, y + 12, 20, 1, variant === "stone" ? css(pal.face[0]) : "#5a4e30");
      R(g, x - 1, y + 6, 5, 4, variant === "stone" ? css(pal.face[3]) : "#b8a888");
      if (variant !== "stone") for (let i = 0; i < 4; i++) R(g, x + 5 + i * 3, y + 6, 1, 6, "#6a5c38");
      if (variant === "cross") {
        R(g, x + 14, y - 4, 1, 7, WOOD[3]);
        R(g, x + 12, y - 2, 5, 1, WOOD[3]);
      }
      if (variant === "radio") {
        box(g, x + 11, y, 7, 5, tones("#4a5a3c"), 1);
        R(g, x + 17, y - 6, 1, 6, IRON[3]);
        R(g, x + 12, y + 2, 2, 2, "#1a1a1a");
      }
      if (!done) {
        turned(g, x + 13, y + 8, [1, 2, 2, 2, 1], CLAY);
        R(g, x + 6, y + 10, 3, 2, "#d8c8a0");
      }
      break;
    }
    case "basket":
      shadow(g, cx, base - 1, 7);
      for (const dx of [-4, 4]) {
        turned(g, cx + dx, base - 8, [3, 4, 4, 4, 4, 3, 3, 3], tones("#b89858"));
        for (let j = 0; j < 4; j++) R(g, cx + dx - 3, base - 7 + j * 2, 6, 1, "#8a6c38");
        if (!done) R(g, cx + dx - 2, base - 9, 4, 1, "#d8c080");
      }
      break;
    case "altar":
      if (variant === "sticks") {
        for (let i = 0; i < 5; i++) {
          R(g, x + 1 + i * 3, y + 1 + (i % 2) * 2, 1, 12, ["#2a6a9a", "#e8c040", "#a8382c", "#2a6a9a", "#e8e0d0"][i]);
          R(g, x + i * 3, y + (i % 2) * 2, 3, 2, "#f0ece0");
        }
        if (!done) R(g, x + 5, y + 13, 2, 1, "#40c0c0"), R(g, x + 10, y + 13, 2, 1, "#40c0c0");
        break;
      }
      shadow(g, cx, base - 1, 6);
      turned(g, cx, base - 20, Array.from({ length: 20 }, (_, i) => Math.round(2 + (i / 20) ** 1.4 * 4)), pale);
      if (!done) for (let i = 0; i < 6; i++) {
        const px = cx - 6 + Math.floor(rnd(v, i) * 11), py = base - 3 - Math.floor(rnd(v, i + 6) * 12);
        R(g, px, py, 1, 3, "#5a9a7a");
        R(g, px - 1, py + 1, 3, 1, "#7ac09a");
      }
      for (let i = 0; i < 3; i++) R(g, x + 1 + i * 5, y + 13, 3, 2, CLAY[2]);
      break;
    case "chest": {
      shadow(g, cx, base - 1, 8);
      box(g, x + 1, y + 4, 14, 10, WOOD, 4);
      R(g, x + 1, y + 7, 14, 1, IRON[1]);
      R(g, x + 3, y + 4, 2, 10, IRON[2]);
      R(g, x + 11, y + 4, 2, 10, IRON[2]);
      R(g, x + 7, y + 7, 2, 3, done ? "#1a1410" : GOLD[2]);
      if (done) R(g, x + 2, y + 3, 12, 2, "#1a1410");
      break;
    }
    case "barrel":
      shadow(g, cx, base - 1, 9);
      for (const [dx, dy] of [[-5, 0], [5, 0], [0, -8]] as const) {
        if (done && dy) continue;
        turned(g, cx + dx, base - 10 + dy, [3, 4, 4, 5, 5, 5, 4, 4, 3, 3], WOOD);
        R(g, cx + dx - 4, base - 8 + dy, 8, 1, IRON[2]);
        R(g, cx + dx - 4, base - 3 + dy, 8, 1, IRON[2]);
      }
      break;
    case "still": {
      shadow(g, cx, base - 1, 9);
      if (variant === "clay") {
        turned(g, cx, base - 14, [2, 2, 3, 4, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6], CLAY);
        R(g, cx - 2, base - 4, 4, 3, "#1a1410");
        if (!done) R(g, cx - 1, base - 3, 2, 1, "#e06a28");
        for (let i = 0; i < 3; i++) turned(g, x - 3 + i * 10, base - 4, [1, 2, 2, 1], tones("#8a4a30"));
        break;
      }
      const cu = tones("#c8703a");
      R(g, x - 2, y + 9, 10, 5, css(pal.face[1]));
      R(g, x, y + 11, 5, 3, "#1a1410");
      R(g, x + 1, y + 12, 3, 1, "#e06a28");
      turned(g, x + 3, y - 4, [1, 1, 2, 3, 4, 5, 5, 5, 5, 5, 4, 4, 3], cu);
      R(g, x + 4, y - 5, 9, 1, cu[2]);
      R(g, x + 12, y - 5, 1, 9, cu[2]);
      turned(g, x + 13, y + 4, [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], WOOD);
      if (!done) for (let i = 0; i < 3; i++) R(g, x + 7 + i * 3, y + 14, 2, 2, "#d8ecf0");
      break;
    }
    case "ingots":
      if (done) return gone();
      R(g, x + 2, y + 9, 12, 4, "#5a4e3c");
      for (let i = 0; i < 3; i++) {
        R(g, x + 2 + i * 4, y + 6 - (i % 2), 4, 4, "#6a6e76");
        R(g, x + 2 + i * 4, y + 6 - (i % 2), 4, 2, "#e8ecf0");
        R(g, x + 3 + i * 4, y + 7 - (i % 2), 2, 1, "#a8acb4");
      }
      break;
    case "vats":
      shadow(g, cx, base - 1, 9);
      for (const dx of [-9, 3]) {
        box(g, x + dx + 3, y + 1, 11, 11, WOOD, 3);
        R(g, x + dx + 4, y + 2, 9, 2, done ? "#3a2e24" : "#e8e6de");
        for (let i = 0; i < 3; i++) R(g, x + dx + 5 + i * 3, y + 5, 1, 7, WOOD[1]);
      }
      R(g, x - 4, y + 12, 22, 2, WOOD[1]);
      break;
    case "crate": {
      shadow(g, cx, base - 1, 9);
      const t = tones(variant === "arms" ? "#5a6a44" : "#a8824c");
      if (variant === "arms") {
        box(g, x - 4, y + 6, 22, 8, t, 2);
        box(g, x - 2, y - 1, 20, 7, t, 2);
        for (let i = 0; i < 4; i++) R(g, x + 1 + i * 4, y + 9, 2, 1, "#e8e0c0");
        if (done) {
          R(g, x, y, 16, 2, "#1a1410");
          R(g, x + 16, y - 4, 5, 2, t[2]);
        } else R(g, x + 3, y + 2, 8, 1, "#e8e0c0");
      } else {
        box(g, x + 2, y + 5, 12, 9, t, 3);
        R(g, x + 4, y + 9, 8, 3, "#b8281c");
        R(g, x + 5, y + 10, 6, 1, "#f0e0c0");
        if (done) R(g, x + 3, y + 5, 10, 2, "#1a1410");
      }
      break;
    }
    case "bale": {
      shadow(g, cx, base - 1, 9);
      const t = tones("#2a2c30");
      for (const [dx, dy] of [[-5, 6], [5, 6], [0, 0]] as const) {
        if (done && !dy) continue;
        box(g, x + dx + 2, y + dy, 11, 8, t, 2);
        R(g, x + dx + 2, y + dy + 3, 11, 1, "#b89858");
        R(g, x + dx + 7, y + dy, 1, 8, "#b89858");
        R(g, x + dx + 4, y + dy + 5, 2, 2, "#c8281c");
      }
      R(g, x - 4, y - 2, 1, 16, "rgba(90,110,70,0.5)");
      R(g, x + 19, y - 1, 1, 15, "rgba(90,110,70,0.5)");
      break;
    }
    case "racks":
      R(g, x - 5, y - 8, 1, 22, WOOD[2]);
      R(g, x + 20, y - 8, 1, 22, WOOD[2]);
      R(g, x - 5, y - 6, 26, 1, "#c8c0a0");
      if (!done) for (let i = 0; i < 8; i++) {
        R(g, x - 3 + i * 3, y - 5, 2, 7 + (i % 3) * 2, "#4a7a30");
        R(g, x - 3 + i * 3, y - 5, 1, 5, "#6a9a44");
      }
      break;
    case "pack": {
      shadow(g, cx, base - 1, 8);
      turned(g, x + 4, base - 12, [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4], tones("#2a6ab8"));
      R(g, x, base - 13, 8, 2, "#1a1a20");
      for (let i = 0; i < 3; i++) {
        R(g, x + 9, base - 2 - i * 2, 7, 2, i % 2 ? "#e8802a" : "#f09a40");
        R(g, x + 9, base - 1 - i * 2, 7, 1, "#a85a18");
      }
      if (done) R(g, x + 1, base - 12, 6, 1, "#1a1a20");
      break;
    }
    case "skeleton":
      shadow(g, cx, base - 1, 7);
      R(g, x + 4, y - 2, 8, 5, "#e8c020");
      R(g, x + 4, y - 2, 8, 1, "#fff080");
      R(g, x + 11, y, 3, 2, "#d8dce0");
      R(g, x + 5, y + 3, 6, 4, BONE[2]);
      R(g, x + 6, y + 4, 1, 1, K), R(g, x + 9, y + 4, 1, 1, K);
      R(g, x + 3, y + 7, 10, 6, "#3a4a6a");
      R(g, x + 3, y + 7, 10, 1, "#5a6a8a");
      R(g, x + 1, y + 12, 5, 2, "#2a2420");
      R(g, x + 10, y + 12, 5, 2, "#2a2420");
      break;
    case "drums": {
      shadow(g, cx, base - 1, 9);
      if (variant === "jerry") {
        for (let i = 0; i < 3; i++) {
          box(g, x - 3 + i * 6, y + 3 + (i % 2), 5, 10, tones(i === 1 ? "#4a5a3c" : "#8a3028"), 2);
          R(g, x - 2 + i * 6, y + 1 + (i % 2), 3, 2, IRON[2]);
        }
        box(g, x + 15, y + 6, 6, 8, tones("#c8b890"), 2);
        break;
      }
      for (const [dx, c] of [[-5, "#3a6a8a"], [5, "#8a6a2a"]] as const) {
        const t = tones(c);
        turned(g, cx + dx, base - 14, [4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5], t);
        R(g, cx + dx - 5, base - 10, 10, 1, t[1]);
        R(g, cx + dx - 5, base - 5, 10, 1, t[1]);
        R(g, cx + dx - 3, base - 8, 3, 6, "#7a4a2a");
      }
      R(g, x - 2, y + 13, 16, 2, "rgba(120,200,60,0.55)");
      break;
    }
    case "tins":
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        R(g, cx - 1 + Math.round(Math.cos(a) * 5), y + 8 + Math.round(Math.sin(a) * 3), 2, 2, css(pal.face[2]));
      }
      R(g, cx - 3, y + 7, 6, 3, "#1c1816");
      scatter(g, x - 2, y + 1, v, 5, (px, py, i) => {
        R(g, px, py, 3, 2, ["#c83028", "#d8dce0", "#3a7ab8", "#d8dce0", "#e8c020"][i]);
        R(g, px, py, 3, 1, "#f0f4f8");
      });
      break;
    case "radio":
      turned(g, cx, base - 14, [1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4], pale);
      box(g, cx - 3, base - 11, 6, 5, tones("#8a8e92"), 1);
      R(g, cx - 4, base - 9, 8, 1, "#e8802a");
      R(g, cx + 1, base - 9, 1, 1, "#40ff60");
      break;
    // On the wall.
    case "seam": {
      const c = { ochre: "#b8402a", ore: "#8a6a4a", copper: "#3aa888", tin: "#9a9aa8", iron: "#8a3a24", silver: "#d8dce4", gold: "#e8c040" }[variant ?? "ore"] ?? "#8a6a4a";
      const t = tones(c);
      for (let i = 0; i < 16; i++) {
        const py = y + 2 + Math.round(Math.sin(i / 2.5 + v * 6) * 2.5) + Math.floor(i / 5);
        if (done) R(g, x + i, py - 1, 1, 4, "#141010");
        else {
          R(g, x + i, py, 1, 3, t[2]);
          R(g, x + i, py, 1, 1, t[3]);
          if (rnd(v, i) < 0.35) R(g, x + i, py + 3 + Math.floor(rnd(v, i + 3) * 4), 1, 1, t[2]);
        }
      }
      break;
    }
    case "fossil":
      if (done) {
        R(g, x + 2, y - 1, 12, 9, "#141010");
        break;
      }
      for (let i = 0; i < 5; i++) {
        R(g, x + 2 + i * 2, y - 1 + i, 1, 7 - i, BONE[2]);
        R(g, x + 2 + i * 2, y - 1 + i, 1, 1, BONE[3]);
      }
      R(g, x + 2, y + 6, 11, 1, BONE[2]);
      R(g, x + 11, y, 4, 3, BONE[2]);
      R(g, x + 12, y + 1, 1, 1, K);
      break;
    case "nests":
      for (let i = 0; i < 6; i++) {
        const px = x - 2 + Math.floor(rnd(v, i) * 18), py = y - 5 + Math.floor(rnd(v, i + 6) * 10);
        if (!done || i % 3 === 0) {
          R(g, px, py, 4, 2, "#e8e4d8");
          R(g, px + 1, py + 2, 2, 1, "#b8b4a8");
          if (i % 2) R(g, px + 1, py - 1, 2, 1, "#2a2a30");
        }
      }
      break;
    case "hive":
      for (let i = 0; i < 4; i++) {
        if (done && i > 0) continue;
        R(g, x + 2 + i * 3, y - 4, 3, 9 + (i % 2) * 3, "#c88a20");
        R(g, x + 2 + i * 3, y - 4, 1, 9 + (i % 2) * 3, "#f0c040");
        for (let j = 0; j < 4; j++) R(g, x + 3 + i * 3, y - 3 + j * 3, 1, 1, "#7a4a10");
      }
      break;
    case "paint": {
      const red = "#a83a22", black = "#1c1814", ochre = "#c8822a", white = "#ece4d0";
      const ink = (c: string) => ({ "#": c });
      if (variant === "beasts") {
        stamp(g, x - 14, y - 2, GLYPH.bison, ink(black));
        R(g, x - 11, y, 7, 3, red);
        stamp(g, x + 3, y - 5, GLYPH.horse, ink(ochre));
        R(g, x + 3, y - 4, 1, 3, black), R(g, x + 12, y - 6, 3, 1, black);
        stamp(g, x + 18, y, GLYPH.deer, ink(red));
        stamp(g, x + 1, y + 5, GLYPH.horse, ink(black));
        for (let i = 0; i < 5; i++) R(g, x - 12 + i * 3, y + 9, 1, 1, red);
      } else if (variant === "hands") {
        for (let i = 0; i < 5; i++) {
          const px = x - 12 + i * 8, py = y - 4 + ((i * 5) % 7);
          for (let a = 0; a < 26; a++) R(g, px - 2 + Math.floor(rnd(v, a + i * 30) * 11), py - 2 + Math.floor(rnd(v, a + i * 30 + 100) * 13), 1, 1, i === 3 ? ochre : red);
          stamp(g, px, py, GLYPH.hand, { "#": css(pal.face[3]) });
        }
      } else if (variant === "cattle") {
        stamp(g, x - 14, y - 3, GLYPH.cow, ink(red));
        R(g, x - 8, y + 1, 4, 2, white), R(g, x - 3, y + 2, 2, 1, white);
        stamp(g, x + 3, y + 1, GLYPH.cow, ink(white));
        R(g, x + 9, y + 5, 3, 2, red);
        stamp(g, x + 19, y - 3, GLYPH.cow, ink(red));
        stamp(g, x - 2, y - 6, GLYPH.man, ink(red));
        stamp(g, x + 22, y + 4, GLYPH.archer, ink(red));
      } else if (variant === "hunt") {
        for (let i = 0; i < 4; i++) stamp(g, x - 13 + i * 7, y - 4 + (i % 2) * 5, i % 2 ? GLYPH.man : GLYPH.archer, ink(red));
        stamp(g, x + 16, y - 2, GLYPH.deer, ink(red));
        stamp(g, x + 14, y + 6, GLYPH.deer, ink("#7a2a18"));
      } else {
        for (let i = 0; i < 4; i++) {
          stamp(g, x - 10 + i * 9, y - 6 + (i % 2), GLYPH.spirit, { "#": i % 2 ? white : red });
          R(g, x - 9 + i * 9, y - 4 + (i % 2), 1, 1, black), R(g, x - 7 + i * 9, y - 4 + (i % 2), 1, 1, black);
          R(g, x - 11 + i * 9, y - 7 + (i % 2), 7, 1, ochre);
        }
        for (let i = 0; i < 4; i++) R(g, x + 2 + i * 2, y + 8, 1, 1, red);
      }
      break;
    }
    case "petroglyph": {
      const c = css(pal.face[4]);
      for (let i = 0; i < 9; i++) R(g, x + 2 + Math.round(Math.cos(i * 0.9) * (1 + i * 0.5)), y + 2 + Math.round(Math.sin(i * 0.9) * (1 + i * 0.5)), 1, 1, c);
      stamp(g, x - 10, y - 3, GLYPH.deer, { "#": c });
      stamp(g, x + 12, y - 2, GLYPH.man, { "#": c });
      for (let i = 0; i < 4; i++) R(g, x - 8 + i * 3, y + 9, 2, 2, css(pal.face[0]));
      break;
    }
    case "inscription": {
      if (variant === "graffiti") {
        const soot = "#141010";
        for (let i = 0; i < 5; i++) R(g, x - 10 + i * 3, y - 3, 2, 4 + (i % 2), soot);
        R(g, x + 8, y - 2, 2, 1, "#c8281c"), R(g, x + 11, y - 2, 2, 1, "#c8281c"), R(g, x + 8, y - 1, 5, 2, "#c8281c"), R(g, x + 9, y + 1, 3, 1, "#c8281c"), R(g, x + 10, y + 2, 1, 1, "#c8281c");
        for (let i = 0; i < 4; i++) R(g, x - 6 + i * 4, y + 5, 3, 3, i % 2 ? "#e8e4d8" : soot);
        R(g, x + 12, y + 5, 8, 1, "#e8e4d8"), R(g, x + 12, y + 7, 5, 1, "#e8e4d8");
        break;
      }
      const c = variant === "hieratic" ? "#a8301c" : variant === "maya" ? "#141010" : css(pal.face[0]);
      const hi = css(pal.face[4]);
      if (variant === "han") {
        for (let col = 0; col < 5; col++) for (let row = 0; row < 3; row++) {
          const px = x - 10 + col * 7, py = y - 5 + row * 6;
          for (let k = 0; k < 9; k++) if (rnd(v, col * 31 + row * 7 + k) < 0.62) R(g, px + (k % 3) * 2, py + Math.floor(k / 3) * 2 - (k % 2), 2, 1, c);
          R(g, px, py + 5, 5, 1, hi);
        }
      } else if (variant === "maya") {
        for (let col = 0; col < 4; col++) for (let row = 0; row < 2; row++) {
          const px = x - 10 + col * 8, py = y - 4 + row * 8;
          R(g, px, py, 6, 6, c);
          R(g, px + 1, py + 1, 4, 4, css(pal.face[3]));
          R(g, px + 2 + ((col + row) % 2), py + 2, 2, 2, c);
          R(g, px + 1, py + 7 - row * 9, 1, 1, c), R(g, px + 3, py + 7 - row * 9, 1, 1, c);
        }
      } else {
        for (let row = 0; row < 3; row++) for (let i = 0; i < 11; i++) {
          if (rnd(v, row * 13 + i) < 0.18) continue;
          const px = x - 12 + i * 3.5, py = y - 4 + row * 6;
          R(g, px, py, 1, 4, c);
          if (rnd(v, row * 17 + i) < 0.6) R(g, px, py + Math.floor(rnd(v, i + row) * 3), 3, 1, c);
          if (variant !== "hieratic") R(g, px + 1, py + 4, 2, 1, hi);
        }
      }
      break;
    }
    case "relief": {
      R(g, x - 10, y - 7, 36, 20, css(pal.face[0]));
      R(g, x - 9, y - 6, 34, 18, css(pal.face[3]));
      R(g, x - 9, y - 6, 34, 1, css(pal.face[4]));
      if (variant === "cross") {
        R(g, x + 7, y - 5, 3, 16, css(pal.face[1])), R(g, x + 2, y - 1, 13, 3, css(pal.face[1]));
        for (const dx of [-6, 19]) {
          R(g, x + dx - 2, y - 3, 6, 6, "#e8b060");
          R(g, x + dx - 1, y - 2, 4, 5, "#c8905c");
          R(g, x + dx - 1, y, 1, 1, K), R(g, x + dx + 2, y, 1, 1, K);
          R(g, x + dx - 2, y + 4, 6, 7, dx < 0 ? "#a8281c" : "#2a4a8a");
          R(g, x + dx - 3, y - 4, 8, 1, "#e8c040");
        }
      } else {
        const d = css(pal.face[1]);
        R(g, x - 2, y + 1, 16, 7, d), R(g, x - 5, y, 4, 4, d), R(g, x - 6, y - 2, 1, 3, d), R(g, x - 1, y + 8, 2, 4, d), R(g, x + 10, y + 8, 2, 4, d);
        R(g, x + 3, y - 4, 5, 6, css(pal.face[2])), R(g, x + 4, y - 6, 3, 2, "#a8382c"), R(g, x + 1, y - 2, 3, 1, css(pal.face[2]));
        R(g, x + 17, y + 6, 5, 2, d), R(g, x - 8, y + 9, 6, 1, d);
      }
      break;
    }
    case "buddha": {
      R(g, x - 3, y - 7, 22, 21, "#100c0c");
      R(g, x - 1, y - 9, 18, 2, "#100c0c");
      const t = tones("#b8a078");
      turned(g, cx, y - 6, [2, 3, 3, 3, 2, 3, 5, 6, 6, 6, 6, 7, 8, 9, 9, 8], t);
      R(g, cx - 1, y - 7, 2, 1, t[3]);
      R(g, cx - 2, y - 4, 1, 1, K), R(g, cx + 1, y - 4, 1, 1, K);
      R(g, cx - 4, y + 1, 2, 4, "#d8a838"), R(g, cx + 3, y + 3, 2, 2, "#3a6a9a");
      R(g, cx - 6, y + 9, 12, 1, "#d8a838");
      R(g, cx + 5, y, 2, 3, t[3]);
      break;
    }
    default:
      if (!done) lump(g, cx, base, 5, 5, rock);
  }
}

/** A snake coiled on the floor: two turns of a banded body, head raised. */
export function paintSnake(g: G, x: number, y: number) {
  const t = tones("#8a7a4a");
  for (const [rx, ry, cy] of [[6, 3.4, 10], [4, 2.4, 9]] as const)
    for (let a = 0; a < 40; a++) {
      const th = (a / 40) * Math.PI * 2, px = Math.round(x + 8 + Math.cos(th) * rx), py = Math.round(y + cy + Math.sin(th) * ry);
      R(g, px - 1, py - 1, 3, 3, t[0]);
    }
  for (const [rx, ry, cy] of [[6, 3.4, 10], [4, 2.4, 9]] as const)
    for (let a = 0; a < 40; a++) {
      const th = (a / 40) * Math.PI * 2, px = Math.round(x + 8 + Math.cos(th) * rx), py = Math.round(y + cy + Math.sin(th) * ry);
      R(g, px, py, 1, 1, a % 6 < 2 ? "#3a2c18" : Math.sin(th) < 0 ? t[3] : t[2]);
    }
  R(g, x + 11, y + 3, 4, 4, t[0]);
  R(g, x + 12, y + 4, 2, 2, t[3]);
  R(g, x + 12, y + 7, 1, 2, t[2]);
  R(g, x + 13, y + 4, 1, 1, K);
  R(g, x + 15, y + 5, 2, 1, "#c8281c");
}
