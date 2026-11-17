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

const ICONS: Record<string, Icon> = {
  loaf: (r) => { for (let j = 0; j < 7; j++) r.fill(3 + (j === 0 || j === 6 ? 1 : 0), 6 + j, 10 - (j === 0 || j === 6 ? 2 : 0), 1, j < 2 ? BROWN[0] : j > 4 ? BROWN[2] : BROWN[1]); for (const x of [5, 8, 11]) r.fill(x, 7, 1, 3, "#f8d8a0"); },
  cheese: (r) => { for (let j = 0; j < 7; j++) r.fill(3, 6 + j, 4 + j + (j > 3 ? 3 - (j - 3) : 3), 1, j < 2 ? GOLD[0] : j > 4 ? GOLD[2] : GOLD[1]); r.set(6, 9, GOLD[2]); r.set(9, 11, GOLD[2]); r.set(5, 11, GOLD[2]); },
  ham: (r) => { ball(r, 7, 9, 4, ["#f8b0a0", "#e07868", "#a84838"]); r.fill(11, 8, 3, 2, CREAM[0]); r.fill(13, 7, 2, 4, CREAM[1]); r.fill(5, 8, 3, 2, "#f8d0c0"); },
  tin: (r, v) => { block(r, 4, 5, 8, 9, SILVER); r.fill(4, 8, 8, 4, hue(v)[1]); r.fill(6, 9, 4, 2, CREAM[0]); r.fill(4, 5, 8, 1, WHITE[0]); },
  jar: (r, v) => { block(r, 5, 6, 7, 8, GLASS); r.fill(6, 8, 5, 5, hue(v)[1]); r.fill(6, 8, 1, 5, hue(v)[0]); r.fill(4, 4, 9, 3, CREAM[1]); r.fill(4, 4, 9, 1, CREAM[0]); r.fill(5, 7, 7, 1, BROWN[2]); },
  bottle: (r, v) => { const c = pick([["#90d090", "#3c8848", "#1c5028"], ["#c89868", "#7c4c28", "#4c2c14"], GLASS], v); turned(r, 8, 2, [1, 1, 1, 1, 2, 3, 3, 3, 3, 3, 3, 3], c); r.fill(6, 9, 5, 3, CREAM[0]); r.fill(7, 1, 3, 1, BROWN[2]); },
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
  bolt: (r, v) => { const c = hue(v); for (let k = 0; k < 3; k++) { r.fill(3, 4 + k * 4, 10, 3, pick(HUES, v + k * 0.37)[1]); r.fill(3, 4 + k * 4, 10, 1, pick(HUES, v + k * 0.37)[0]); ball(r, 13, 5 + k * 4, 1, CREAM); } void c; },
  shoe: (r, v) => { const c = pick([HUES[0], BLACK, ["#e8c8a0", "#c09060", "#805830"]], v); r.fill(3, 9, 10, 4, c[1]); r.fill(3, 9, 10, 1, c[0]); r.fill(3, 6, 4, 3, c[1]); r.fill(11, 12, 2, 2, c[2]); r.fill(3, 13, 8, 1, c[2]); r.set(9, 10, GOLD[1]); },
  parasol: (r, v) => { const c = hue(v); for (let j = 0; j < 5; j++) r.fill(8 - j - 1, 3 + j, j * 2 + 3, 1, j % 2 ? c[1] : c[0]); r.fill(8, 8, 1, 6, BROWN[2]); r.fill(8, 13, 3, 1, BROWN[2]); for (const x of [3, 6, 10, 13]) r.set(x, 8, c[2]); },
  fan: (r, v) => { const c = hue(v); for (let a = -3; a <= 3; a++) for (let d = 3; d < 9; d++) r.set(8 + Math.round(Math.sin(a * 0.33) * d), 13 - Math.round(Math.cos(a * 0.33) * d), a % 2 ? c[1] : CREAM[0]); r.fill(7, 12, 3, 2, BROWN[2]); },
  lamp: (r) => { turned(r, 8, 2, [1, 2, 2, 2, 1], GLASS); turned(r, 8, 7, [1, 3, 4, 4, 3, 1, 2, 3], GOLD); r.set(8, 4, "#ffd060"); },
  vase: (r, v) => { const c = pick([["#f8fcff", "#d0e0f0", "#7890b8"], HUES[1], HUES[5], HUES[0]], v); turned(r, 8, 2, [2, 1, 1, 2, 3, 4, 4, 4, 3, 2, 1, 2], c); for (const [x, y] of [[7, 7], [9, 8], [8, 10]]) r.set(x, y, pick(HUES, v + 0.5)[1]); },
  clock: (r) => { block(r, 4, 4, 9, 10, BROWN); for (let j = 0; j < 3; j++) r.fill(5 + j, 3 - j, 7 - j * 2, 1, BROWN[1]); ball(r, 8, 8, 2, WHITE); r.set(8, 8, BLACK[2]); r.set(8, 7, BLACK[2]); r.set(9, 8, BLACK[2]); r.fill(4, 13, 9, 1, GOLD[2]); },
  teapot: (r, v) => { const c = pick([WHITE, HUES[1], COPPER, ["#c8a878", "#8c6840", "#583c20"]], v); ball(r, 8, 9, 4, c); r.fill(6, 4, 5, 2, c[1]); r.set(8, 3, c[0]); r.fill(12, 8, 2, 1, c[1]); r.fill(13, 6, 1, 2, c[1]); r.fill(2, 7, 1, 4, c[2]); r.fill(3, 6, 1, 1, c[2]); r.fill(3, 11, 1, 1, c[2]); },
  candlestick: (r) => { r.fill(7, 3, 2, 5, CREAM[0]); r.set(7, 2, "#ffb030"); r.set(8, 1, "#fff090"); turned(r, 8, 8, [2, 1, 1, 2, 1, 3, 4], GOLD); },
  tiles: (r, v) => { const c = hue(v); block(r, 3, 4, 10, 10, CREAM); for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { r.fill(4 + i * 5, 5 + j * 5, 3, 3, c[1]); r.set(5 + i * 5, 6 + j * 5, c[0]); } r.fill(8, 4, 1, 10, CREAM[2]); r.fill(3, 9, 10, 1, CREAM[2]); },
  kettle: (r) => { ball(r, 8, 9, 4, COPPER); r.fill(5, 13, 7, 1, COPPER[2]); r.fill(12, 7, 3, 1, COPPER[1]); r.fill(14, 6, 1, 1, COPPER[1]); for (let a = 0; a < 7; a++) r.set(5 + a, 3 + Math.abs(a - 3) - 0, BLACK[1]); r.fill(7, 4, 3, 1, COPPER[0]); },
  basin: (r) => { for (let j = 0; j < 5; j++) r.fill(3 + j, 7 + j, 10 - j * 2, 1, j === 0 ? WHITE[0] : WHITE[1]); r.fill(4, 7, 8, 1, "#a0d0e0"); r.fill(6, 12, 4, 2, WHITE[2]); r.fill(2, 6, 12, 1, WHITE[0]); },
  tap: (r) => { r.fill(7, 6, 2, 8, GOLD[1]); r.fill(7, 6, 1, 8, GOLD[0]); r.fill(4, 4, 8, 2, GOLD[1]); r.fill(4, 4, 8, 1, GOLD[0]); r.fill(9, 8, 4, 2, GOLD[1]); r.fill(12, 10, 1, 2, GOLD[2]); r.fill(5, 13, 6, 1, GOLD[2]); },
  pipe: (r) => { const c = ["#c8ccd0", "#8c9298", "#585e64"]; r.fill(3, 4, 4, 9, c[1]); r.fill(3, 4, 1, 9, c[0]); r.fill(3, 10, 10, 4, c[1]); r.fill(3, 10, 10, 1, c[0]); r.fill(2, 3, 6, 2, c[2]); r.fill(12, 9, 2, 6, c[2]); },
  soap: (r, v) => { const c = pick([HUES[0], HUES[2], CREAM, HUES[3]], v); block(r, 3, 8, 10, 5, c); r.fill(5, 10, 6, 1, c[2]); ball(r, 6, 5, 1, WHITE); ball(r, 10, 4, 2, GLASS); },
  sponge: (r) => { ball(r, 8, 9, 5, ["#fff0a8", "#e8c860", "#a88828"]); for (const [x, y] of [[6, 7], [9, 8], [7, 11], [11, 10], [5, 10]]) r.set(x, y, "#a88828"); },
  brush: (r) => { block(r, 2, 8, 12, 3, BROWN); for (let x = 3; x < 13; x += 2) r.fill(x, 11, 1, 3, CREAM[1]); r.fill(2, 8, 12, 1, BROWN[0]); },
  filter: (r) => { turned(r, 8, 2, [3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5], ["#e0d0b0", "#b8a078", "#7c6848"]); r.fill(5, 5, 7, 1, "#4868a8"); r.fill(11, 10, 3, 1, GOLD[1]); r.fill(4, 2, 9, 1, "#f0e4c8"); },
  scuttle: (r) => { for (let j = 0; j < 7; j++) r.fill(4 + (j >> 2), 7 + j, 9 - (j >> 1), 1, j === 0 ? BLACK[0] : BLACK[1]); for (const x of [5, 7, 9, 11]) ball(r, x, 6, 1, BLACK); r.set(7, 5, "#f07030"); for (let a = 0; a < 7; a++) r.set(5 + a, 2 + Math.abs(a - 3), SILVER[2]); },
  bellows: (r) => { for (let j = 0; j < 8; j++) r.fill(8 - Math.min(4, j + 1), 3 + j, Math.min(4, j + 1) * 2 + 1, 1, j % 2 ? BROWN[1] : BROWN[0]); r.fill(7, 11, 3, 3, COPPER[1]); r.fill(8, 13, 1, 2, COPPER[2]); r.fill(6, 5, 5, 1, "#b02820"); },
  iron: (r) => { for (let j = 0; j < 4; j++) r.fill(3 + (3 - j), 9 + j, 10 - (3 - j), 1, j === 0 ? BLACK[0] : BLACK[1]); r.fill(5, 5, 7, 1, BROWN[1]); r.fill(5, 5, 1, 4, BLACK[1]); r.fill(11, 5, 1, 4, BLACK[1]); r.fill(3, 13, 10, 1, BLACK[2]); },
  grate: (r) => { block(r, 3, 4, 10, 10, BLACK); r.fill(5, 7, 6, 5, "#f08030"); r.fill(6, 8, 4, 3, "#ffd060"); for (const x of [5, 7, 9]) r.fill(x, 7, 1, 5, BLACK[2]); r.fill(3, 4, 10, 2, BLACK[0]); },
  book: (r, v) => { const c = hue(v); block(r, 4, 3, 8, 11, c); r.fill(4, 3, 2, 11, c[2]); r.fill(7, 5, 4, 1, GOLD[1]); r.fill(7, 7, 3, 1, GOLD[1]); r.fill(12, 4, 1, 10, CREAM[0]); },
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
};

/** What each class of exhibit lays out. A class with no list of its own shows household things. */
const BY_CLASS: Record<string, readonly string[]> = {
  food: ["loaf", "cheese", "ham", "tin", "jar", "bottle", "fish", "apples", "sack", "sugarloaf", "teachest", "pie", "eggs"],
  refreshments: ["bottle", "pie", "teapot", "loaf", "jar", "cheese", "sugarloaf"],
  cocoa: ["teapot", "tin", "sugarloaf", "chocolates", "jar"],
  dress: ["hat", "bonnet", "boot", "glove", "bolt", "shoe", "parasol", "fan"],
  dwelling: ["lamp", "vase", "clock", "teapot", "candlestick", "tiles", "kettle", "book"],
  sanitary: ["basin", "tap", "pipe", "soap", "filter", "tiles", "brush"],
  baths: ["soap", "sponge", "brush", "basin", "tap", "bottle"],
  heating: ["kettle", "scuttle", "bellows", "iron", "grate", "candlestick", "lamp"],
  school: ["book", "globe", "slate", "inkwell", "abacus", "bell"],
  machinery: ["gear", "gauge", "valve", "oilcan", "pipe", "tap"],
  india: ["carpet", "teachest", "idol", "vase", "bolt", "lacquer"],
  china: ["vase", "lantern", "fan", "teachest", "lacquer", "bolt", "idol"],
  japan: ["fan", "lacquer", "lantern", "vase", "book", "parasol"],
  belgium: ["lace", "decanter", "chocolates", "grate", "book", "bottle"],
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
