import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";
import { lerp } from "./cradle";

/** The family graves on a spring hillside under a willow: grown over, or
 * swept with fresh earth, food set out and paper burning; kites when it is done. */
export default function graves(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), sun = rgb(pal.accent);
  const e = ending ?? "", dusk = e === "unswept", HY = 24;
  const swept = !["", "go", "unswept"].includes(e), stranger = e === "tended";
  const top = lerp(fill, light, dusk ? 0.1 : 0.45), low = lerp(light, sun, dusk ? 0.6 : 0.25);
  const hill = lerp(fill, wood, 0.3), grass = lerp(fill, sun, dusk ? 0.05 : 0.2);
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y), ridge = HY - 4 + Math.round(3 * Math.sin(x / 17) + 2 * Math.sin(x / 7));
      if (y < ridge) px(x, y, mix(top, low, y / HY + (b - 0.5) * 0.3 > 0.6 ? 0.7 : 0.15));
      else if (y < HY + 4) px(x, y, mix(hill, top, 0.25));
      else px(x, y, mix(grass, ink, Math.max(0, (y - HY) / 60 + (b - 0.5) * 0.15) > 0.3 ? 0.35 : 0.1));
    }
  // The willow, which everyone hangs a sprig of today.
  const leaf = mix(fill, sun, 0.3), leafLit = mix(fill, sun, 0.5);
  rect(18, 14, 3, 36, mix(wood, ink, 0.35));
  rect(8, 8, 26, 6, leaf);
  for (let x = 7; x < 36; x += 3) rect(x, 14, 2, 8 + ((x * 7) % 11), x % 2 ? leaf : leafLit);
  // The mounds: weeds, or fresh earth with paper weighted on top.
  const earth = lerp(wood, light, 0.25), weed = lerp(grass, ink, 0.45), tuft = mix(grass, sun, 0.3);
  const mound = (x: number, w: number, clean: boolean, sunk = false) => {
    const h = sunk ? 3 : 7;
    for (let j = 0; j < h; j++) {
      const half = Math.round((w / 2) * Math.sqrt(1 - (j / h) ** 2));
      rect(x + (w >> 1) - half, 51 - j, half * 2, 1, clean ? mix(lerp(wood, light, 0.3), wood, j / h * 0.3) : mix(weed, earth, j === h - 1 ? 0.15 : 0));
    }
    if (!clean) for (let i = 3; i < w - 3; i += 3) rect(x + i, 50 - h + ((i * 5) % 3), 1, 3, tuft);
    else rect(x + (w >> 1) + 2, 52 - h, 3, 2, mix(light, light, 0));
    rect(x + (w >> 1) - 2, 46 - h, 4, 6, mix(lerp(fill, light, 0.4), wood, 0.2));
  };
  mound(52, 22, swept);
  mound(78, 18, swept);
  mound(120, 20, stranger, true);
  if (swept) [58, 84].forEach((x) => {
    rect(x, 53, 6, 2, mix(wood, ink, 0.2));
    rect(x + 1, 52, 4, 1, mix(sun, light, 0.2));
  });
  if (["tended", "swept"].includes(e))
    for (let i = 0; i < 12; i++) {
      const k = (t / 2600 + i / 12) % 1;
      px(Math.round(106 + 2 * Math.sin(k * 8 + i)), Math.round(52 - k * 26), mix(lerp(light, fill, 0.3), top, k));
    }
  if (["tended", "swept"].includes(e)) {
    rect(104, 52, 5, 2, mix(sun, light, 0.3));
    const kx = 132 + Math.round(3 * Math.sin(t / 700)), ky = 8;
    rect(kx, ky, 3, 3, mix(sun, ink, 0.2));
    px(kx + 1, ky - 1, mix(sun, ink, 0.2));
    for (let i = 1; i < 9; i++) px(kx + 1 - Math.round(Math.sin(i / 2 + t / 400)), ky + 3 + i, mix(sun, light, 0.3));
  }
  // The family, and others on the road below the hill.
  const you = mix(sun, ink, 0.35), kin = mix(lerp(fill, light, 0.3), wood, 0.3), skin = mix(wood, light, 0.45);
  const come = ease(t / 1800);
  if (!e || e === "go") {
    person(ctx, 30, 62, 16, you, skin);
    person(ctx, 40, 62, 14, kin, skin);
    rect(46, 50, 6, 4, mix(wood, light, 0.15));
    for (let i = 0; i < 4; i++) person(ctx, Math.round(100 + i * 9 + 10 * come), 30, 5, mix(ink, fill, 0.5), mix(ink, fill, 0.6));
  }
  if (e === "stranger") {
    person(ctx, 104, 60, 16, you, skin);
    person(ctx, 94, 60, 14, kin, skin);
  }
  if (e === "tended" || e === "swept") {
    for (const [x, c] of [[56, you], [80, kin]] as const) {
      rect(x, 57, 6, 4, c);
      rect(x - 2, 59, 4, 2, c);
      rect(x + 6, 58, 3, 3, skin);
    }
  }
  if (e === "sent") person(ctx, 102, 60, 14, kin, skin);
  fadeEdges(ctx, pal.ink);
}
