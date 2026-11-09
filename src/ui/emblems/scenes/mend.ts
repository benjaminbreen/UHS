import { EMBLEM_H, EMBLEM_W, ease, fadeEdges, glow, hash, mix, pen, person, rgb, type Pal } from "../kit";

/** Your workshop: tools on the wall, and on the bench the piece that came back broken. */
export default function mend(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), blue = rgb(pal.accent);
  const dim = ending === "faulted" || ending === "spread" ? 0.35 : 0;
  const wall = [pal.ink, mix(ink, wood, 0.3 - dim * 0.4), mix(fill, wood, 0.5 - dim)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) px(x, y, y < 44 ? wall[glow(x, y, 46, 22, 70, 40)] : mix(ink, wood, 0.25));
  // The window the light comes in by.
  rect(30, 8, 22, 16, mix(wood, ink, 0.4));
  rect(32, 10, 18, 12, mix(light, blue, 0.35 + dim));
  rect(40, 10, 1, 12, mix(wood, ink, 0.4));
  rect(32, 15, 18, 1, mix(wood, ink, 0.4));
  // Tools on pegs: a saw, a mallet, a pair of tongs.
  const iron = mix(light, fill, 0.45), haft = mix(wood, light, 0.25);
  rect(64, 12, 14, 5, iron);
  for (let x = 64; x < 78; x += 2) px(x, 17, iron);
  rect(78, 12, 4, 3, haft);
  rect(90, 10, 2, 12, haft);
  rect(87, 8, 8, 4, mix(wood, light, 0.1));
  for (let k = 0; k < 11; k++) px(102 + Math.round(k * 0.3), 9 + k, iron), px(106 - Math.round(k * 0.3), 9 + k, iron);
  // The door, the customer in it holding up a piece.
  const there = ending !== "gone" && ending !== "vouched" && ending !== "stood" && ending !== "remade";
  rect(124, 14, 22, 30, mix(wood, ink, 0.45));
  rect(126, 16, 18, 28, mix(fill, light, 0.45 - dim * 0.6));
  if (there) {
    const fx = 129 + Math.round(6 * (1 - ease(t / 500)));
    person(ctx, fx, 44, 24, mix(ink, fill, 0.4), mix(ink, wood, 0.5));
    if (ending !== "refunded") rect(fx - 3, 26, 4, 3, mix(blue, light, 0.2));
  }
  if (ending === "spread")
    for (let i = 0; i < 4; i++) if ((Math.floor(t / 160) + i) % 3) px(118 - i * 3, 18 + (i % 2) * 2, mix(light, blue, 0.4));
  // The bench.
  rect(10, 36, 108, 3, mix(wood, light, 0.35));
  rect(10, 39, 108, 2, mix(wood, ink, 0.3));
  rect(16, 41, 4, 13, mix(wood, ink, 0.35));
  rect(106, 41, 4, 13, mix(wood, ink, 0.35));
  for (let i = 0; i < 9; i++) px(14 + Math.floor(hash(i) * 100), 37, mix(wood, light, 0.5));
  // A jar, whole or split down the middle with the halves leaning apart.
  const jar = (x: number, split: number, c: string, hi: string) => {
    [6, 6, 8, 11, 13, 14, 14, 14, 13, 12, 10, 8].forEach((w, i) => {
      const lx = x + ((14 - w) >> 1), y = 24 + i;
      for (let k = 0; k < w; k++) {
        const side = lx + k < x + 7 ? -1 : 1;
        px(lx + k + side * Math.round(split * ((11 - i) / 11) * 2), y, k === 1 ? hi : c);
      }
    });
  };
  const fresh = ending === "remade" ? ease((t - 300) / 700) : 0;
  const pot = mix(blue, wood, 0.45), shine = mix(blue, light, 0.35);
  if (fresh < 1) jar(56 - Math.round(fresh * 30), 1, pot, shine);
  if (!fresh) for (const [x, y] of [[50, 35], [72, 35], [75, 34]]) rect(x, y, 2, 1, pot);
  if (fresh) {
    jar(62, 0, mix(blue, light, 0.15), mix(blue, light, 0.55));
    if (fresh >= 1 && Math.floor(t / 140) % 7 === 0) px(66, 26, pal.light);
  }
  if (ending === "refunded")
    [0, 1, 2].forEach((i) => {
      const c = ease((t - 400 - i * 160) / 600);
      rect(Math.round(86 + 30 * c), 35 - Math.round(5 * Math.sin(Math.PI * c)), 2, 1, mix(light, blue, 0.2));
    });
  fadeEdges(ctx, pal.ink);
}
