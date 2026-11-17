import { h2, Raster } from "../ship/raster";

/** Things laid out on an exhibition table, each drawn in a 16-pixel cell with its
 * own outline: what a class of exhibit shows, one object at a time. `v` varies
 * the colour so no two on a table are quite alike. */
type Icon = (r: Raster, v: number) => void;

const pick = <T,>(list: readonly T[], v: number) => list[Math.floor(v * list.length) % list.length];
/** A filled round, lit on the upper left: light, mid, dark. */
function ball(r: Raster, cx: number, cy: number, rad: number, c: readonly string[]) {
  for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) {
    if (i * i + j * j > rad * rad + rad * 0.7) continue;
    r.set(cx + i, cy + j, i + j < -rad * 0.6 ? c[0] : i + j > rad * 0.7 ? c[2] : c[1]);
  }
}

function oval(r: Raster, cx: number, cy: number, rx: number, ry: number, c: readonly string[]) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    if (x * x / (rx * rx) + y * y / (ry * ry) > 1.15) continue;
    const light = x / rx + y / ry;
    r.set(cx + x, cy + y, light < -0.55 ? c[0] : light > 0.5 ? c[2] : c[1]);
  }
}
/** A box lit from the upper left. */
function block(r: Raster, x: number, y: number, w: number, h: number, c: readonly string[]) {
  r.fill(x, y, w, h, c[1]); r.fill(x, y, w, 1, c[0]); r.fill(x, y, 1, h, c[0]); r.fill(x, y + h - 1, w, 1, c[2]); r.fill(x + w - 1, y, 1, h, c[2]);
}
/** An upright shape whose half-width at each row is given from the top down. */
function turned(r: Raster, cx: number, top: number, halves: readonly number[], c: readonly string[]) {
  halves.forEach((half, j) => {
    for (let i = -half; i <= half; i++) r.set(cx + i, top + j, i <= -half + (half > 1 ? 1 : 0) && half > 0 ? c[0] : i >= half && half > 0 ? c[2] : c[1]);
  });
}

const BROWN = ["#e2a868", "#b87840", "#7e4c26"], GOLD = ["#fff0a0", "#f0c048", "#b08020"], CREAM = ["#fffaf0", "#eadfc8", "#b8a888"];
const SILVER = ["#f4f6f8", "#c0c8d0", "#7c8894"], COPPER = ["#f8c090", "#d8804a", "#8c4a28"], BLACK = ["#6a6e78", "#3a3e48", "#1c1e26"];
const WHITE = ["#ffffff", "#e8ecf0", "#a8b4c0"], GLASS = ["#e8f8fc", "#a8d8e8", "#6098b0"];
const HUES = [["#f8a090", "#d8483c", "#8c2420"], ["#90b8f0", "#4878c8", "#284888"], ["#a0d890", "#58a050", "#2c6830"], ["#f8e080", "#e0a830", "#987018"], ["#d8a0e0", "#9858b0", "#603070"], ["#90e0d8", "#38a8a0", "#1c6868"]];
const hue = (v: number) => pick(HUES, v);

const ICONS = {
  lock: (r, v) => {
    const metal = v < 0.5 ? GOLD : SILVER, shape = Math.floor(v * 6) % 3;
    block(r, 3, 6, shape === 1 ? 7 : 9, 7, metal);
    if (shape === 0) {
      r.fill(4, 2, 1, 5, metal[1]); r.fill(10, 2, 1, 5, metal[2]); r.fill(5, 1, 5, 1, metal[0]);
    } else if (shape === 1) {
      r.fill(3, 3, 7, 3, metal[2]); r.set(4, 4, metal[0]); r.set(8, 4, metal[0]);
    } else {
      r.fill(2, 4, 12, 2, metal[1]); r.fill(3, 4, 10, 1, metal[0]); r.set(13, 5, metal[2]);
    }
    r.fill(6, 8, 2, 2, BLACK[2]); r.set(7, 10, BLACK[2]);
    r.fill(11, 11, 4, 1, metal[1]); r.fill(12, 12, 1, 2, metal[2]); r.set(14, 12, metal[2]);
  },
  cutlery: (r, v) => {
    const metal = v < 0.5 ? SILVER : GOLD, handles = [CREAM, BROWN, BLACK][Math.floor(v * 6) % 3];
    block(r, 2, 4, 12, 10, v < 0.5 ? BROWN : BLACK);
    r.fill(3, 5, 10, 7, "#62545c");
    for (const x of [4, 8, 11]) r.fill(x, 8, 1, 4, handles[1]);
    oval(r, 4, 7, 1, 2, metal);
    r.fill(7, 6, 3, 1, metal[0]); r.set(7, 5, metal[1]); r.set(9, 5, metal[2]);
    r.fill(11, 5, 2, 4, metal[0]); r.set(11, 12, metal[2]);
    r.fill(3, 3, 10, 1, CREAM[1]);
  },
  stockings: (r, v) => {
    const c = v < 1 / 3 ? CREAM : hue(v), top = Math.floor(v * 6) % 2 ? 5 : 2;
    for (const x of [4, 9]) {
      block(r, x, top, 3, 10 - top, c);
      r.fill(x - 1, 10, 4, 3, c[1]); r.fill(x - 1, 12, 4, 1, c[2]);
      r.fill(x, top, 3, 2, c[2]);
    }
  },
  plate: (r, v) => {
    const c = v < 0.5 ? WHITE : SILVER, pattern = hue(v);
    oval(r, 8, 10, 6, 3, c); oval(r, 8, 8, 6, 4, c);
    oval(r, 8, 8, 4, 2, [c[1], c[0], c[2]]);
    if (Math.floor(v * 6) % 2 === 0) {
      for (const [x, y] of [[5, 6], [10, 6], [5, 10], [10, 10]]) r.set(x, y, pattern[1]);
      r.set(8, 8, pattern[2]);
    } else r.fill(5, 8, 6, 1, pattern[1]);
  },
  barrel: (r) => {
    turned(r, 8, 3, [3, 4, 4, 5, 5, 5, 5, 4, 4, 3], BROWN);
    r.fill(4, 5, 9, 2, SILVER[2]); r.fill(4, 10, 9, 2, SILVER[2]);
    r.fill(5, 3, 7, 1, BROWN[0]); r.set(8, 8, BLACK[2]);
  },
  collar: (r) => {
    turned(r, 8, 2, [2, 3, 4, 4, 5, 5, 5, 5, 4, 4, 3, 2], BROWN);
    turned(r, 8, 5, [1, 2, 2, 2, 2, 2, 1], BLACK);
    r.fill(4, 6, 1, 5, GOLD[0]); r.fill(11, 6, 1, 5, BROWN[2]);
    r.fill(6, 13, 5, 1, BROWN[2]);
  },
  pitchfork: (r) => {
    r.fill(7, 6, 2, 9, BROWN[1]); r.fill(7, 6, 1, 9, BROWN[0]);
    r.fill(3, 5, 10, 2, SILVER[1]);
    for (const x of [3, 6, 9, 12]) r.fill(x, 1, 1, 4, SILVER[0]);
    r.fill(6, 7, 4, 1, SILVER[2]);
  },
  necklace: (r, v) => {
    const metal = v < 0.5 ? GOLD : SILVER;
    for (const [x, y] of [[3, 3], [12, 3], [3, 5], [12, 5], [4, 7], [11, 7], [6, 9], [9, 9]]) r.fill(x, y, 2, 2, metal[1]);
    ball(r, 8, 12, 2, metal); ball(r, 8, 12, 1, BROWN);
    r.set(7, 11, CREAM[0]); r.set(4, 3, metal[0]); r.set(12, 4, metal[0]);
  },
  kodak: (r) => {
    block(r, 2, 6, 12, 7, ["#77716a", "#403d43", "#26252e"]);
    r.fill(3, 3, 9, 4, "#5d5754"); r.fill(3, 3, 9, 1, "#8c8170");
    r.fill(11, 5, 3, 8, "#302d35"); oval(r, 12, 9, 2, 3, GOLD);
    oval(r, 12, 9, 1, 2, BLACK); r.set(12, 8, "#8bafbc");
    r.fill(4, 8, 4, 1, "#8e805d"); r.set(4, 11, GOLD[2]);
    r.set(9, 11, GOLD[2]); r.set(7, 4, SILVER[0]);
    r.fill(4, 2, 4, 1, BROWN[2]); r.set(3, 3, BROWN[2]); r.set(8, 3, BROWN[0]);
  },
  longwind: (r) => {
    oval(r, 8, 11, 5, 3, SILVER);
    oval(r, 8, 8, 5, 4, SILVER); oval(r, 8, 8, 4, 3, CREAM);
    oval(r, 8, 8, 2, 2, GOLD); r.set(7, 9, BLACK[1]); r.set(9, 7, BLACK[1]);
    for (const [x, y] of [[8, 5], [4, 8], [12, 8], [8, 11]]) r.set(x, y, BLACK[2]);
    r.fill(8, 6, 1, 3, "#33496c"); r.fill(8, 8, 3, 1, "#33496c");
    r.fill(7, 3, 3, 1, SILVER[2]); r.set(6, 2, SILVER[1]);
    r.fill(7, 1, 3, 1, SILVER[0]); r.set(10, 2, SILVER[2]);
    r.set(13, 12, SILVER[1]); r.set(14, 11, SILVER[0]); r.set(14, 9, SILVER[2]);
  },
  picklejar: (r) => {
    turned(r, 8, 4, [3, 3, 4, 4, 4, 4, 4, 4, 4, 3], GLASS);
    r.fill(4, 3, 9, 2, CREAM[1]); r.fill(5, 3, 7, 1, CREAM[0]);
    r.fill(5, 7, 7, 6, "#75854a");
    for (const x of [5, 8, 10]) {
      r.fill(x, 7 + x % 2, 2, 5, "#3f632e");
      r.set(x, 8 + x % 2, "#a6b463"); r.set(x + 1, 11, "#b2b97a");
    }
    r.fill(6, 8, 5, 3, CREAM[0]); r.fill(7, 9, 3, 1, "#a6382b");
    r.fill(4, 7, 1, 5, "#d7ece0"); r.set(11, 6, WHITE[0]);
  },
  picklecharm: (r) => {
    ball(r, 9, 3, 2, GOLD); r.set(9, 3, BLACK[1]);
    turned(r, 8, 5, [1, 2, 3, 3, 3, 2, 2, 1], ["#91ad67", "#527f3c", "#294b2c"]);
    r.fill(7, 7, 1, 4, "#c1c885"); r.set(10, 8, "#304e29"); r.set(9, 11, "#304e29");
  },
  dentifrice: (r, v) => {
    r.fill(2, 8, 2, 3, SILVER[2]); r.set(2, 8, SILVER[0]);
    block(r, 4, 7, 9, 5, CREAM); r.fill(5, 6, 8, 1, SILVER[0]);
    r.fill(6, 7, 6, 1, hue(v)[1]); r.fill(6, 9, 5, 1, "#785d68");
    r.fill(12, 5, 2, 8, SILVER[1]); r.fill(13, 5, 1, 8, SILVER[2]);
    r.set(11, 11, SILVER[1]);
  },
  wrappedsoap: (r, v) => {
    const c = hue(v);
    block(r, 2, 7, 12, 6, CREAM);
    r.fill(2, 8, 2, 4, CREAM[2]); r.fill(12, 8, 2, 4, CREAM[2]);
    r.fill(5, 7, 6, 6, c[1]); r.fill(5, 7, 6, 1, c[0]);
    r.fill(6, 9, 4, 2, CREAM[0]); r.fill(7, 10, 2, 1, c[2]);
  },
  coffeetin: (r, v) => {
    const c = v < 0.5 ? HUES[0] : HUES[1];
    block(r, 4, 4, 9, 10, c); r.fill(4, 3, 9, 2, SILVER[1]);
    r.fill(5, 3, 7, 1, SILVER[0]); r.fill(5, 7, 7, 4, CREAM[0]);
    r.fill(6, 8, 5, 1, c[2]); r.fill(7, 10, 3, 1, c[2]);
    r.fill(4, 13, 9, 1, SILVER[1]);
  },
  corset: (r, v) => {
    const c = v < 0.5 ? CREAM : HUES[0];
    turned(r, 8, 3, [5, 5, 4, 4, 3, 3, 3, 4, 4, 5], c);
    for (const x of [5, 8, 11]) r.fill(x, 4, 1, 8, c[2]);
    for (const y of [5, 7, 9, 11]) r.set(8, y, GOLD[0]);
    r.set(4, 2, c[1]); r.set(12, 2, c[1]);
  },
  map: (r, v) => {
    block(r, 2, 4, 12, 10, CREAM);
    r.fill(5, 5, 1, 8, CREAM[2]); r.fill(10, 5, 1, 8, CREAM[2]);
    for (const [x, y] of [[4, 6], [5, 7], [8, 6], [9, 8], [8, 9], [11, 11]]) {
      r.fill(x, y, 2, 2, v < 0.5 ? "#8b9c76" : "#bc9472");
    }
    r.fill(3, 12, 4, 1, "#537c9a");
  },
  strop: (r) => {
    r.fill(7, 2, 3, 2, SILVER[1]); r.set(8, 2, BLACK[2]);
    block(r, 5, 4, 7, 8, BROWN);
    r.fill(6, 5, 5, 6, "#643b2e"); r.fill(7, 12, 3, 2, BROWN[1]);
    r.fill(7, 14, 3, 1, SILVER[2]);
  },
  travelfilter: (r) => {
    turned(r, 8, 4, [3, 4, 4, 4, 4, 4, 4, 4, 3], SILVER);
    r.fill(4, 4, 9, 1, SILVER[0]); r.fill(5, 7, 7, 1, BLACK[1]);
    r.fill(7, 8, 3, 3, GOLD[2]); r.fill(4, 12, 9, 1, SILVER[2]);
    r.fill(4, 2, 1, 3, BLACK[1]); r.fill(12, 2, 1, 3, BLACK[1]); r.fill(5, 1, 7, 1, BLACK[1]);
    r.fill(11, 11, 3, 1, GOLD[1]); r.set(13, 12, GOLD[2]);
  },
  bulb: (r, v) => {
    const glass = [GLASS[0], "#b5ced2", "#68939d"];
    turned(r, 8, 2, [1, 3, 4, 4, 4, 3, 2, 1, 1], glass);
    r.fill(7, 6, 3, 1, "#fde29e"); r.fill(7, 7, 1, 3, GOLD[2]);
    r.fill(9, 7, 1, 3, GOLD[2]); block(r, 6, 11, 5, 3, v < 0.5 ? GOLD : SILVER);
    r.set(8, 1, GLASS[0]);
  },
  coil: (r, v) => {
    block(r, 2, 9, 12, 5, BROWN); r.fill(3, 8, 10, 2, BROWN[0]);
    r.fill(4, 5, 8, 5, COPPER[2]);
    for (const x of [5, 7, 9, 11]) {
      r.fill(x, 4, 1, 6, COPPER[1]); r.set(x, 4, COPPER[0]); r.set(x, 8, "#b4663d");
    }
    r.fill(3, 4, 2, 7, BLACK[1]); r.fill(12, 4, 1, 7, BLACK[2]);
    for (const x of [3, 12]) { r.set(x, 11, GOLD[0]); r.set(x, 12, hue(v)[2]); }
  },
  telegraph: (r, v) => {
    block(r, 2, 10, 12, 4, BROWN);
    for (const x of [4, 9]) r.fill(x, 6, 2, 4, GOLD[2]);
    r.fill(4, 6, 8, 1, v < 0.5 ? GOLD[1] : SILVER[1]);
    r.fill(10, 4, 4, 2, BLACK[1]); r.set(5, 8, GOLD[0]);
  },
  chest: (r, v) => {
    block(r, 2, 6, 12, 8, v < 0.5 ? BROWN : BLACK);
    r.fill(6, 4, 5, 2, GOLD[2]); r.fill(7, 4, 3, 1, CREAM[0]);
    for (const x of [4, 11]) r.fill(x, 9, 2, 3, GOLD[1]);
    r.fill(3, 8, 10, 1, GOLD[2]);
  },
  kepler: (r) => {
    block(r, 8, 2, 6, 12, HUES[1]);
    r.fill(9, 4, 4, 5, CREAM[0]); r.fill(9, 11, 3, 1, GOLD[1]);
    turned(r, 5, 4, [1, 1, 1, 2, 2, 3, 3, 3, 3, 3], ["#ce9f65", "#89542c", "#492a20"]);
    r.fill(3, 9, 4, 3, CREAM[0]); r.fill(4, 4, 3, 1, GOLD[2]);
  },
  watch: (r, v) => {
    const metal = v < 0.5 ? GOLD : SILVER;
    oval(r, 8, 11, 5, 3, metal);
    oval(r, 8, 8, 5, 4, metal); oval(r, 8, 8, 3, 2, CREAM);
    r.fill(7, 3, 3, 1, metal[1]); r.fill(7, 1, 3, 1, metal[1]);
    r.set(6, 2, metal[0]); r.set(10, 2, metal[2]);
    r.fill(8, 6, 1, 3, "#3c3b58"); r.set(9, 8, "#3c3b58");
    r.set(5, 8, metal[2]); r.set(11, 8, metal[2]); r.set(8, 10, metal[2]);
  },
  perfume: (r, v) => {
    const liquid = hue(v);
    turned(r, 8, 6, [2, 4, 4, 4, 4, 4, 3], GLASS);
    oval(r, 8, 7, 4, 2, [GLASS[0], liquid[0], GLASS[2]]);
    r.fill(5, 9, 7, 3, liquid[1]); r.fill(5, 9, 1, 3, liquid[0]);
    r.fill(6, 9, 5, 2, CREAM[0]); r.set(8, 10, liquid[2]);
    r.fill(7, 4, 3, 3, GOLD[2]); oval(r, 8, 3, 2, 1, GLASS);
    r.set(7, 2, WHITE[0]); r.set(11, 8, WHITE[0]);
  },
  microscope: (r) => {
    oval(r, 8, 12, 5, 2, BLACK); r.fill(6, 11, 4, 2, GOLD[2]);
    r.fill(10, 5, 2, 7, GOLD[2]); r.fill(10, 6, 1, 5, GOLD[0]);
    oval(r, 7, 9, 4, 1, BLACK); r.set(8, 9, GLASS[0]);
    for (let y = 2; y < 7; y++) {
      const x = 4 + Math.floor(y / 2); r.fill(x, y, 3, 1, GOLD[1]); r.set(x, y, GOLD[0]);
    }
    oval(r, 6, 2, 2, 1, BLACK); r.set(6, 1, BLACK[0]);
    r.fill(7, 7, 2, 1, SILVER[1]); oval(r, 7, 11, 2, 1, GLASS);
    r.set(12, 5, GOLD[0]); r.set(13, 6, GOLD[2]);
  },
  carton: (r, v) => {
    const c = hue(v);
    block(r, 5, 2, 7, 12, c); r.fill(6, 5, 4, 6, CREAM[0]);
    for (const y of [6, 8, 10]) r.fill(7, y, 2, 1, c[2]);
  },
  flask: (r, v) => {
    turned(r, 8, 2, [1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 3], GLASS);
    r.fill(6, 10, 5, 2, hue(v)[1]); r.fill(7, 6, 1, 4, WHITE[0]);
    r.fill(6, 1, 5, 1, GLASS[1]);
  },
  spectacles: (r, v) => {
    const c = v < 0.5 ? GOLD : SILVER;
    for (const x of [4, 11]) { ball(r, x, 9, 3, c); ball(r, x, 9, 2, GLASS); }
    r.fill(6, 8, 4, 1, c[2]); r.set(2, 5, c[2]); r.set(13, 5, c[2]);
  },
  spoon: (r, v) => {
    const c = v < 0.5 ? GOLD : SILVER;
    ball(r, 10, 5, 3, c);
    for (let i = 0; i < 8; i++) r.fill(9 - (i >> 1), 6 + i, 2, 1, c[i % 2]);
    r.set(9, 4, c[0]);
  },
  knife: (r, v) => {
    for (let i = 0; i < 7; i++) r.fill(7 + (i >> 1), 9 - i, i < 5 ? 3 : 2, 1, SILVER[i % 2]);
    for (let i = 0; i < 5; i++) r.fill(4 + (i >> 1), 13 - i, 3, 1, hue(v)[i % 2 + 1]);
    r.fill(6, 9, 4, 1, GOLD[2]);
  },
  pen: (r, v) => {
    const c = hue(v);
    for (let i = 0; i < 8; i++) r.fill(5 + (i >> 1), 12 - i, 2, 1, c[i % 2 + 1]);
    r.fill(8, 5, 3, 1, GOLD[1]); r.fill(9, 3, 2, 2, GOLD[0]); r.set(10, 2, SILVER[0]);
  },
  picture: (r, v) => {
    block(r, 2, 3, 12, 10, BROWN); r.fill(4, 5, 8, 6, CREAM[0]);
    for (let i = 0; i < 6; i++) r.fill(5 + i, 9 - ((i + 1) % 3), 1, 2, hue(v)[2]);
    r.fill(4, 10, 8, 1, GLASS[1]);
  },
  camera: (r, v) => {
    block(r, 3, 4, 10, 8, BROWN); r.fill(5, 5, 6, 5, BLACK[1]);
    ball(r, 9, 8, 3, GOLD); ball(r, 9, 8, 2, GLASS);
    r.fill(6, 12, 4, 2, hue(v)[2]);
  },
  thermometer: (r, v) => {
    block(r, 5, 1, 6, 13, BROWN); r.fill(7, 2, 2, 11, CREAM[0]);
    r.fill(8, 6, 1, 7, hue(v)[1]); ball(r, 8, 12, 1, HUES[0]);
    for (const y of [3, 5, 7, 9]) r.set(9, y, BLACK[1]);
  },
  bowl: (r, v) => {
    const c = hue(v);
    turned(r, 8, 7, [5, 5, 4, 4, 3, 2], c);
    r.fill(3, 7, 11, 1, CREAM[0]); r.fill(5, 8, 7, 1, c[2]);
    r.fill(6, 13, 5, 1, c[2]);
  },
  comb: (r, v) => {
    const c = v < 0.5 ? BROWN : BLACK;
    r.fill(3, 5, 10, 3, c[1]); r.fill(3, 5, 10, 1, c[0]);
    for (let x = 3; x < 13; x += 2) r.fill(x, 8, 1, 5, c[2]);
  },
  threads: (r, v) => {
    const c = hue(v);
    r.fill(5, 3, 7, 2, BROWN[1]); r.fill(5, 12, 7, 2, BROWN[2]);
    for (let y = 5; y < 12; y++) r.fill(6, y, 5, 1, c[y % 2]);
    r.set(3, 12, c[1]); r.set(4, 11, c[1]); r.set(5, 10, c[1]);
  },
  frame: (r, v) => {
    block(r, 3, 2, 10, 12, BROWN); r.fill(5, 4, 6, 8, GLASS[1]);
    r.fill(5, 7, 6, 1, hue(v)[1]); r.fill(7, 4, 1, 8, BROWN[0]);
  },
  loaf: (r) => { for (let j = 0; j < 7; j++) r.fill(3 + (j === 0 || j === 6 ? 1 : 0), 6 + j, 10 - (j === 0 || j === 6 ? 2 : 0), 1, j < 2 ? BROWN[0] : j > 4 ? BROWN[2] : BROWN[1]); for (const x of [5, 8, 11]) r.fill(x, 7, 1, 3, "#f8d8a0"); },
  cheese: (r) => { for (let j = 0; j < 7; j++) r.fill(3, 6 + j, 4 + j + (j > 3 ? 3 - (j - 3) : 3), 1, j < 2 ? GOLD[0] : j > 4 ? GOLD[2] : GOLD[1]); r.set(6, 9, GOLD[2]); r.set(9, 11, GOLD[2]); r.set(5, 11, GOLD[2]); },
  ham: (r) => { ball(r, 7, 9, 4, ["#f8b0a0", "#e07868", "#a84838"]); r.fill(11, 8, 3, 2, CREAM[0]); r.fill(13, 7, 2, 4, CREAM[1]); r.fill(5, 8, 3, 2, "#f8d0c0"); },
  tin: (r, v) => { block(r, 4, 5, 8, 9, SILVER); r.fill(4, 8, 8, 4, hue(v)[1]); r.fill(6, 9, 4, 2, CREAM[0]); r.fill(4, 5, 8, 1, WHITE[0]); },
  jar: (r, v) => {
    const wide = Math.floor(v * 6) % 2 === 0, x = wide ? 3 : 5, w = wide ? 10 : 7, top = wide ? 7 : 4, c = hue(v);
    block(r, x, top + 2, w, 12 - top, GLASS);
    r.fill(x + 1, top + 4, w - 2, 9 - top, c[1]); r.fill(x + 1, top + 3, 1, 10 - top, c[0]);
    r.fill(x - 1, top + 1, w + 2, 2, CREAM[1]); oval(r, 8, top + 1, Math.floor(w / 2) + 1, 1, CREAM);
    r.fill(x + 2, top + 5, w - 4, 2, CREAM[0]); r.set(x + w - 2, top + 3, WHITE[0]);
  },
  bottle: (r, v) => {
    const c = pick([["#90c0a0", "#4b8167", "#2d514b"], ["#c89868", "#7c4c28", "#4c2c24"], GLASS], v);
    const shape = Math.floor(v * 6) % 3;
    const profiles = [
      [1, 1, 1, 1, 2, 3, 3, 3, 3, 3, 3, 3],
      [1, 1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [2, 2, 2, 3, 4, 4, 4, 4, 4, 4],
    ];
    const top = shape === 2 ? 4 : 2;
    turned(r, 8, top, profiles[shape], c);
    oval(r, 8, top, shape === 2 ? 2 : 1, 1, BROWN);
    r.fill(6, 9, 5, 3, CREAM[0]); r.fill(7, 10, 3, 1, "#8e7774");
    r.set(6, 7, c[0]); r.set(6, 8, c[0]); r.set(10, 12, c[2]);
  },
  fish: (r) => { for (let i = 0; i < 10; i++) { const half = i < 2 ? 1 : i < 7 ? 2 : i < 8 ? 1 : 2; r.fill(3 + i, 9 - half, 1, half * 2 + 1, i % 2 ? SILVER[1] : SILVER[0]); } r.fill(3, 12, 11, 1, SILVER[2]); r.set(5, 8, BLACK[2]); r.fill(2, 13, 13, 1, WHITE[2]); },
  apples: (r, v) => { const c = pick([HUES[0], HUES[2], HUES[3]], v); ball(r, 5, 10, 3, c); ball(r, 11, 10, 3, c); ball(r, 8, 6, 3, c); for (const [x, y] of [[5, 6], [11, 6], [8, 2]]) r.set(x, y, BROWN[2]); },
  sack: (r) => { turned(r, 8, 3, [2, 1, 3, 4, 5, 5, 5, 5, 5, 5, 4], CREAM); r.fill(6, 4, 5, 1, BROWN[2]); r.fill(6, 9, 4, 2, "#8a7a5c"); },
  sugarloaf: (r) => { turned(r, 8, 2, [0, 1, 1, 2, 2, 3, 3, 4, 4, 4], WHITE); r.fill(4, 11, 9, 3, "#4868a8"); r.fill(4, 11, 9, 1, "#7898d0"); },
  teachest: (r) => { block(r, 3, 5, 10, 9, BROWN); r.fill(5, 7, 6, 4, CREAM[0]); r.fill(6, 8, 4, 1, "#b02820"); r.fill(6, 10, 3, 1, BLACK[1]); r.fill(3, 5, 10, 1, SILVER[1]); },
  pie: (r) => { ball(r, 8, 9, 5, ["#f8dc98", "#e0b060", "#a87830"]); for (let a = 0; a < 6; a++) r.set(8 + Math.round(Math.cos(a) * 4), 9 + Math.round(Math.sin(a) * 4), "#a87830"); r.fill(7, 8, 3, 1, "#a87830"); },
  eggs: (r) => { block(r, 3, 8, 10, 6, BROWN); for (const x of [5, 8, 11]) ball(r, x, 7, 1, CREAM); r.fill(3, 8, 10, 1, "#f8d8a0"); },
  hat: (r, v) => { const c = pick([BLACK, ["#b08860", "#7c5c3c", "#4c3420"], ["#a0a8b0", "#687078", "#40464c"]], v); block(r, 5, 3, 6, 8, c); r.fill(2, 11, 12, 2, c[1]); r.fill(2, 11, 12, 1, c[0]); r.fill(5, 9, 6, 1, hue(v)[1]); },
  bonnet: (r, v) => { const c = hue(v); ball(r, 8, 8, 5, CREAM); r.fill(3, 9, 10, 2, c[1]); r.fill(11, 10, 3, 4, c[1]); r.fill(11, 10, 1, 4, c[0]); ball(r, 5, 5, 1, c); },
  boot: (r) => { block(r, 5, 2, 5, 9, BLACK); r.fill(5, 10, 9, 4, BLACK[1]); r.fill(5, 10, 9, 1, BLACK[0]); r.fill(5, 13, 9, 1, BROWN[2]); for (const y of [4, 6, 8]) r.set(8, y, GOLD[1]); },
  glove: (r) => { block(r, 5, 6, 6, 8, CREAM); for (const x of [5, 7, 9]) r.fill(x, 2, 1, 4, CREAM[1]); r.fill(11, 7, 2, 3, CREAM[1]); r.fill(5, 12, 6, 2, BROWN[1]); },
  bolt: (r, v) => {
    const c = hue(v);
    if (Math.floor(v * 6) % 2 === 0) {
      for (let k = 0; k < 3; k++) {
        block(r, 3 + k % 2, 5 + k * 3, 10, 3, c);
        r.fill(6, 6 + k * 3, 4, 1, CREAM[1]);
      }
    } else {
      r.fill(3, 5, 8, 8, c[1]); r.fill(3, 5, 8, 1, c[0]);
      r.fill(4, 8, 7, 1, c[2]); r.fill(4, 11, 7, 1, CREAM[1]);
      oval(r, 11, 8, 2, 5, c); oval(r, 11, 8, 1, 3, CREAM);
      r.set(11, 8, BROWN[2]);
    }
  },
  shoe: (r, v) => { const c = pick([HUES[0], BLACK, ["#e8c8a0", "#c09060", "#805830"]], v); r.fill(3, 9, 10, 4, c[1]); r.fill(3, 9, 10, 1, c[0]); r.fill(3, 6, 4, 3, c[1]); r.fill(11, 12, 2, 2, c[2]); r.fill(3, 13, 8, 1, c[2]); r.set(9, 10, GOLD[1]); },
  parasol: (r, v) => { const c = hue(v); for (let j = 0; j < 5; j++) r.fill(8 - j - 1, 3 + j, j * 2 + 3, 1, j % 2 ? c[1] : c[0]); r.fill(8, 8, 1, 6, BROWN[2]); r.fill(8, 13, 3, 1, BROWN[2]); for (const x of [3, 6, 10, 13]) r.set(x, 8, c[2]); },
  fan: (r, v) => { const c = hue(v); for (let a = -3; a <= 3; a++) for (let d = 3; d < 9; d++) r.set(8 + Math.round(Math.sin(a * 0.33) * d), 13 - Math.round(Math.cos(a * 0.33) * d), a % 2 ? c[1] : CREAM[0]); r.fill(7, 12, 3, 2, BROWN[2]); },
  lamp: (r) => { turned(r, 8, 2, [1, 2, 2, 2, 1], GLASS); turned(r, 8, 7, [1, 3, 4, 4, 3, 1, 2, 3], GOLD); r.set(8, 4, "#ffd060"); },
  vase: (r, v) => {
    const c = pick([WHITE, HUES[1], HUES[5]], v), tall = Math.floor(v * 6) % 2 === 0;
    turned(r, 8, tall ? 2 : 5, tall ? [2, 1, 1, 2, 3, 4, 4, 4, 3, 2, 1, 2] : [3, 2, 3, 4, 5, 5, 4, 3, 2], c);
    oval(r, 8, tall ? 2 : 5, tall ? 2 : 3, 1, [c[0], c[2], c[1]]);
    for (const [x, y] of [[7, 8], [9, 9], [8, 11]]) r.set(x, y, hue((v + 0.5) % 1)[1]);
    r.set(5, 9, c[0]); r.fill(6, 13, 5, 1, c[2]);
  },
  clock: (r) => { block(r, 4, 4, 9, 10, BROWN); for (let j = 0; j < 3; j++) r.fill(5 + j, 3 - j, 7 - j * 2, 1, BROWN[1]); ball(r, 8, 8, 2, WHITE); r.set(8, 8, BLACK[2]); r.set(8, 7, BLACK[2]); r.set(9, 8, BLACK[2]); r.fill(4, 13, 9, 1, GOLD[2]); },
  teapot: (r, v) => { const c = pick([WHITE, HUES[1], COPPER, ["#c8a878", "#8c6840", "#583c20"]], v); ball(r, 8, 9, 4, c); r.fill(6, 4, 5, 2, c[1]); r.set(8, 3, c[0]); r.fill(12, 8, 2, 1, c[1]); r.fill(13, 6, 1, 2, c[1]); r.fill(2, 7, 1, 4, c[2]); r.fill(3, 6, 1, 1, c[2]); r.fill(3, 11, 1, 1, c[2]); },
  candlestick: (r) => { r.fill(7, 3, 2, 5, CREAM[0]); r.set(7, 2, "#ffb030"); r.set(8, 1, "#fff090"); turned(r, 8, 8, [2, 1, 1, 2, 1, 3, 4], GOLD); },
  tiles: (r, v) => { const c = hue(v); block(r, 3, 4, 10, 10, CREAM); for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { r.fill(4 + i * 5, 5 + j * 5, 3, 3, c[1]); r.set(5 + i * 5, 6 + j * 5, c[0]); } r.fill(8, 4, 1, 10, CREAM[2]); r.fill(3, 9, 10, 1, CREAM[2]); },
  kettle: (r) => { ball(r, 8, 9, 4, COPPER); r.fill(5, 13, 7, 1, COPPER[2]); r.fill(12, 7, 3, 1, COPPER[1]); r.fill(14, 6, 1, 1, COPPER[1]); for (let a = 0; a < 7; a++) r.set(5 + a, 3 + Math.abs(a - 3) - 0, BLACK[1]); r.fill(7, 4, 3, 1, COPPER[0]); },
  tap: (r) => { r.fill(7, 6, 2, 8, GOLD[1]); r.fill(7, 6, 1, 8, GOLD[0]); r.fill(4, 4, 8, 2, GOLD[1]); r.fill(4, 4, 8, 1, GOLD[0]); r.fill(9, 8, 4, 2, GOLD[1]); r.fill(12, 10, 1, 2, GOLD[2]); r.fill(5, 13, 6, 1, GOLD[2]); },
  pipe: (r) => { const c = ["#c8ccd0", "#8c9298", "#585e64"]; r.fill(3, 4, 4, 9, c[1]); r.fill(3, 4, 1, 9, c[0]); r.fill(3, 10, 10, 4, c[1]); r.fill(3, 10, 10, 1, c[0]); r.fill(2, 3, 6, 2, c[2]); r.fill(12, 9, 2, 6, c[2]); },
  soap: (r, v) => { const c = pick([HUES[0], HUES[2], CREAM, HUES[3]], v); block(r, 3, 8, 10, 5, c); r.fill(5, 10, 6, 1, c[2]); ball(r, 6, 5, 1, WHITE); ball(r, 10, 4, 2, GLASS); },
  sponge: (r) => { ball(r, 8, 9, 5, ["#fff0a8", "#e8c860", "#a88828"]); for (const [x, y] of [[6, 7], [9, 8], [7, 11], [11, 10], [5, 10]]) r.set(x, y, "#a88828"); },
  brush: (r) => { block(r, 2, 8, 12, 3, BROWN); for (let x = 3; x < 13; x += 2) r.fill(x, 11, 1, 3, CREAM[1]); r.fill(2, 8, 12, 1, BROWN[0]); },
  scuttle: (r) => { for (let j = 0; j < 7; j++) r.fill(4 + (j >> 2), 7 + j, 9 - (j >> 1), 1, j === 0 ? BLACK[0] : BLACK[1]); for (const x of [5, 7, 9, 11]) ball(r, x, 6, 1, BLACK); r.set(7, 5, "#f07030"); for (let a = 0; a < 7; a++) r.set(5 + a, 2 + Math.abs(a - 3), SILVER[2]); },
  bellows: (r) => { for (let j = 0; j < 8; j++) r.fill(8 - Math.min(4, j + 1), 3 + j, Math.min(4, j + 1) * 2 + 1, 1, j % 2 ? BROWN[1] : BROWN[0]); r.fill(7, 11, 3, 3, COPPER[1]); r.fill(8, 13, 1, 2, COPPER[2]); r.fill(6, 5, 5, 1, "#b02820"); },
  iron: (r) => { for (let j = 0; j < 4; j++) r.fill(3 + (3 - j), 9 + j, 10 - (3 - j), 1, j === 0 ? BLACK[0] : BLACK[1]); r.fill(5, 5, 7, 1, BROWN[1]); r.fill(5, 5, 1, 4, BLACK[1]); r.fill(11, 5, 1, 4, BLACK[1]); r.fill(3, 13, 10, 1, BLACK[2]); },
  book: (r, v) => {
    const c = hue(v);
    if (Math.floor(v * 6) % 2 === 0) {
      block(r, 4, 3, 8, 11, c); r.fill(4, 3, 2, 11, c[2]);
      r.fill(7, 5, 4, 1, GOLD[1]); r.fill(7, 7, 3, 1, GOLD[1]); r.fill(12, 4, 1, 10, CREAM[0]);
    } else {
      block(r, 2, 5, 12, 9, c); r.fill(3, 4, 5, 8, CREAM[0]); r.fill(8, 5, 5, 8, CREAM[1]);
      r.fill(7, 5, 1, 8, CREAM[2]);
      for (const y of [6, 8, 10]) { r.fill(4, y, 2, 1, "#ab9b86"); r.fill(9, y + 1, 3, 1, "#a49781"); }
    }
  },
  globe: (r) => { ball(r, 8, 6, 4, ["#b0d8f8", "#5890d0", "#2c5898"]); for (const [x, y] of [[6, 5], [7, 5], [7, 6], [9, 7], [10, 6], [9, 4]]) r.set(x, y, "#68b068"); r.fill(8, 11, 1, 2, BROWN[2]); r.fill(5, 13, 7, 1, BROWN[1]); r.fill(3, 6, 1, 3, GOLD[1]); },
  slate: (r) => { block(r, 3, 3, 10, 11, BROWN); r.fill(5, 5, 6, 7, "#3a4048"); for (const [x, y, w] of [[6, 6, 4], [6, 8, 3], [6, 10, 4]]) r.fill(x, y, w, 1, "#d8dce0"); },
  inkwell: (r) => { block(r, 4, 8, 6, 6, GLASS); r.fill(5, 9, 4, 4, "#283878"); r.fill(5, 7, 4, 1, BLACK[1]); for (let k = 0; k < 8; k++) r.set(8 + k / 1.6, 8 - k, k < 5 ? CREAM[0] : CREAM[1]); r.set(12, 2, WHITE[0]); },
  abacus: (r, v) => { block(r, 2, 3, 12, 11, BROWN); r.fill(3, 4, 10, 9, CREAM[0]); for (let j = 0; j < 3; j++) { r.fill(3, 5 + j * 3, 10, 1, BLACK[1]); for (let i = 0; i < 4; i++) r.set(4 + i * 2 + (j % 2) * 2, 5 + j * 3, pick(HUES, v + j * 0.3)[1]); } },
  bell: (r) => { turned(r, 8, 5, [1, 2, 3, 3, 4, 4, 5], GOLD); r.fill(7, 2, 2, 3, BROWN[2]); r.set(8, 12, GOLD[2]); },
  gear: (r) => { ball(r, 8, 8, 4, SILVER); for (let a = 0; a < 8; a++) ball(r, 8 + Math.round(Math.cos((a * Math.PI) / 4) * 5), 8 + Math.round(Math.sin((a * Math.PI) / 4) * 5), 1, SILVER); ball(r, 8, 8, 1, BLACK); },
  gauge: (r) => { ball(r, 8, 7, 5, GOLD); ball(r, 8, 7, 3, WHITE); r.set(8, 7, BLACK[2]); r.set(9, 6, "#c02820"); r.set(10, 5, "#c02820"); r.fill(7, 12, 3, 2, GOLD[2]); },
  valve: (r) => { for (let a = 0; a < 16; a++) r.set(8 + Math.round(Math.cos((a * Math.PI) / 8) * 5), 6 + Math.round(Math.sin((a * Math.PI) / 8) * 4), "#c83028"); r.fill(3, 6, 11, 1, "#e85848"); r.fill(8, 2, 1, 9, "#e85848"); r.fill(7, 10, 3, 4, GOLD[1]); },
  oilcan: (r) => { for (let j = 0; j < 6; j++) r.fill(8 - 2 - (j >> 1), 8 + j, 5 + (j >> 1) * 2, 1, j === 0 ? COPPER[0] : COPPER[1]); for (let k = 0; k < 7; k++) r.set(9 + k * 0.8, 8 - k, COPPER[1]); r.fill(4, 13, 9, 1, COPPER[2]); },
  lantern: (r) => { turned(r, 8, 4, [2, 4, 5, 5, 5, 5, 4, 2], ["#f88070", "#d83828", "#881810"]); r.fill(6, 3, 5, 1, BLACK[1]); r.fill(6, 12, 5, 1, BLACK[1]); r.fill(8, 1, 1, 2, GOLD[1]); r.fill(8, 13, 1, 2, GOLD[1]); for (const y of [6, 8, 10]) r.fill(4, y, 9, 1, "#f8a060"); },
  idol: (r) => { ball(r, 8, 4, 2, GOLD); turned(r, 8, 6, [2, 3, 4, 4, 3, 4, 5, 5], GOLD); r.fill(4, 13, 9, 1, GOLD[2]); r.set(8, 4, GOLD[2]); },
  carpet: (r, v) => { const c = hue(v); for (let j = 0; j < 6; j++) r.fill(2, 6 + j, 12, 1, j === 0 ? c[0] : j === 5 ? c[2] : c[1]); for (let x = 3; x < 13; x += 2) r.set(x, 8, GOLD[1]), r.set(x, 10, CREAM[0]); ball(r, 2, 8, 2, c); ball(r, 2, 8, 1, CREAM); },
  lacquer: (r) => { block(r, 3, 6, 10, 8, ["#e85848", "#a82018", "#600c08"]); r.fill(3, 6, 10, 2, BLACK[1]); for (const [x, y] of [[5, 10], [8, 9], [10, 11], [7, 12]]) r.set(x, y, GOLD[1]); r.fill(7, 7, 2, 1, GOLD[1]); },
  decanter: (r) => { turned(r, 8, 2, [1, 1, 1, 2, 3, 4, 4, 4, 4, 4, 3], GLASS); r.fill(7, 1, 3, 1, GLASS[0]); for (const [x, y] of [[6, 8], [9, 9], [7, 10], [10, 7]]) r.set(x, y, WHITE[0]); r.fill(6, 9, 5, 3, "#c06878"); },
  lace: (r) => { block(r, 3, 4, 10, 9, ["#5868a0", "#384878", "#202c50"]); for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if ((i + j) % 2 === 0) r.set(5 + i * 2, 5 + j * 2, WHITE[0]); r.fill(4, 12, 8, 1, WHITE[0]); },
  chocolates: (r) => { block(r, 3, 6, 10, 8, ["#f0d8a0", "#d0a858", "#886828"]); for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) ball(r, 5 + i * 3, 8 + j * 3, 1, ["#a06840", "#684020", "#3c200c"]); },
  flowerpot: (r, v) => { for (let j = 0; j < 5; j++) r.fill(5 + (j >> 1), 9 + j, 7 - (j >> 1) * 2, 1, j === 0 ? COPPER[0] : COPPER[1]); const c = hue(v); for (const [x, y] of [[5, 5], [8, 3], [11, 5], [8, 6]]) ball(r, x, y, 1, c); for (const [x, y] of [[6, 7], [8, 8], [10, 7]]) r.set(x, y, "#488838"); },
  seeds: (r, v) => { block(r, 4, 3, 8, 11, CREAM); ball(r, 8, 7, 2, hue(v)); r.fill(8, 9, 1, 3, "#488838"); r.fill(6, 12, 5, 1, BLACK[1]); },
  shell: (r) => { ball(r, 8, 8, 5, ["#fff0f0", "#f0c0c0", "#b87878"]); for (let a = -2; a <= 2; a++) for (let d = 1; d < 6; d++) r.set(8 + Math.round(Math.sin(a * 0.5) * d), 12 - d, "#b87878"); },
  fishbowl: (r) => { ball(r, 8, 8, 5, GLASS); r.fill(5, 3, 7, 1, GLASS[0]); r.fill(7, 8, 3, 2, "#f08030"); r.set(10, 8, "#f08030"); r.set(6, 11, "#488838"); },
  sword: (r) => { for (let k = 0; k < 10; k++) r.set(4 + k, 12 - k, k % 3 ? SILVER[0] : SILVER[1]), r.set(5 + k, 12 - k, SILVER[2]); r.fill(3, 11, 4, 1, GOLD[1]); r.fill(2, 12, 2, 2, GOLD[2]); r.fill(5, 9, 1, 4, GOLD[1]); },
  helmet: (r) => { ball(r, 8, 8, 5, SILVER); r.fill(3, 9, 11, 2, SILVER[2]); r.fill(7, 9, 3, 5, BLACK[2]); for (let k = 0; k < 5; k++) r.set(8, 2 - 0 + k - 1, "#c83028"); r.fill(7, 1, 3, 2, "#e85848"); },
  crown: (r) => { block(r, 3, 8, 10, 5, GOLD); for (const x of [3, 6, 9, 12]) r.fill(x, 5, 1, 3, GOLD[1]), r.set(x, 4, x % 2 ? "#d83848" : "#3868c8"); r.fill(4, 10, 8, 1, "#a82838"); for (const x of [5, 8, 11]) r.set(x, 10, WHITE[0]); },
  chalice: (r) => { turned(r, 8, 3, [4, 4, 3, 3, 2, 1, 1, 1, 2, 3, 4], GOLD); r.fill(5, 3, 7, 1, "#a82838"); r.set(8, 8, "#d83848"); },
  coffer: (r) => { block(r, 2, 6, 12, 8, BROWN); for (let j = 0; j < 3; j++) r.fill(2 + j, 5 - j, 12 - j * 2, 1, BROWN[1]); for (const x of [4, 11]) r.fill(x, 3, 1, 11, BLACK[1]); r.fill(7, 8, 2, 3, GOLD[1]); for (const [x, y] of [[6, 5], [9, 4], [8, 5]]) r.set(x, y, GOLD[0]); },
  bust: (r) => { ball(r, 8, 5, 3, WHITE); turned(r, 8, 8, [2, 4, 5, 5, 3], WHITE); block(r, 5, 12, 7, 3, ["#c8ccd4", "#9098a4", "#606874"]); r.set(7, 5, WHITE[2]); r.set(9, 5, WHITE[2]); },
} satisfies Record<string, Icon>;

export type ExhibitIcon = keyof typeof ICONS;

export function isExhibitIcon(kind: string): kind is ExhibitIcon {
  return kind in ICONS;
}

/** What each class of exhibit lays out. A class with no list of its own shows household things. */
const BY_CLASS: Record<string, readonly ExhibitIcon[]> = {
  food: ["loaf", "cheese", "ham", "tin", "jar", "bottle", "fish", "apples", "sack", "sugarloaf", "teachest", "pie", "eggs", "plate"],
  refreshments: ["bottle", "pie", "teapot", "loaf", "jar", "cheese", "sugarloaf"],
  cocoa: ["teapot", "tin", "sugarloaf", "chocolates", "jar"],
  dress: ["hat", "bonnet", "boot", "glove", "bolt", "shoe", "parasol", "fan", "stockings"],
  dwelling: ["lamp", "vase", "clock", "teapot", "candlestick", "tiles", "kettle", "book", "cutlery", "plate"],
  sanitary: ["tap", "pipe", "soap", "tiles", "brush"],
  baths: ["soap", "sponge", "brush", "tap", "bottle"],
  heating: ["kettle", "scuttle", "bellows", "iron", "candlestick", "lamp"],
  school: ["book", "globe", "slate", "inkwell", "abacus", "bell"],
  machinery: ["gear", "gauge", "valve", "oilcan", "pipe", "tap"],
  electricity: ["bulb", "coil", "gauge", "telegraph", "bell"],
  india: ["carpet", "teachest", "idol", "vase", "bolt", "lacquer"],
  china: ["vase", "lantern", "fan", "teachest", "lacquer", "bolt", "idol"],
  japan: ["fan", "lacquer", "lantern", "vase", "book", "parasol"],
  belgium: ["lace", "decanter", "chocolates", "book", "bottle"],
  france: ["bottle", "decanter", "chocolates", "cheese", "jar", "bonnet"],
  garden: ["flowerpot", "seeds", "vase", "book"],
  aquarium: ["fishbowl", "shell", "fish", "book"],
  entrance: ["book", "seeds", "bell", "clock"],
  state: ["vase", "clock", "candlestick", "bust", "decanter", "lacquer", "book", "idol"],
  dining: ["pie", "ham", "decanter", "bottle", "apples", "loaf", "candlestick", "fish", "cheese"],
  arms: ["sword", "helmet", "sword", "boot", "glove", "bell"],
  chapel: ["candlestick", "chalice", "book", "bell", "candlestick"],
  kitchen: ["ham", "loaf", "fish", "eggs", "kettle", "jar", "apples", "sack", "pie"],
  treasury: ["crown", "coffer", "chalice", "idol", "decanter", "lacquer"],
  office: ["book", "inkwell", "candlestick", "clock", "book", "bell"],
};

const cache = new Map<string, Raster>();
/** One exhibit object for a class, as a 16-pixel sprite with its outline. `k` picks which, and its colouring. */
export function exhibitItem(cls: string, k: number): Raster {
  const list = BY_CLASS[cls] ?? BY_CLASS.dwelling, name = list[Math.floor(h2(k, 3, 11) * list.length)], v = Math.floor(h2(k, 7, 5) * 6) / 6;
  return exhibitIcon(name, v);
}

export function exhibitIcon(name: ExhibitIcon, v: number): Raster {
  const key = `${name}:${v}`;
  let r = cache.get(key);
  if (!r) {
    r = new Raster(16, 16);
    ICONS[name](r, v);
    r.finish();
    cache.set(key, r);
  }
  return r;
}

/** Copies a small sprite onto a larger one, its clear pixels left alone. */
export function stamp(dst: Raster, src: Raster, x: number, y: number) {
  for (let j = 0; j < src.h; j++) for (let i = 0; i < src.w; i++) {
    const s = (j * src.w + i) * 4, dx = x + i, dy = y + j;
    if (!src.data[s + 3] || dx < 0 || dy < 0 || dx >= dst.w || dy >= dst.h) continue;
    dst.data.set(src.data.subarray(s, s + 4), (dy * dst.w + dx) * 4);
  }
}
