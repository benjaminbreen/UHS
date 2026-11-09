import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, glow, mix, pen, person, rgb, type Pal } from "../kit";

/** The run: a boat on the shoal, from first light to after dark. */
export default function shoal(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), sea = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), sun = rgb(pal.accent);
  const night = ending === "full" || ending === "swamped", dusk = ending === "light" || ending === "sold" || ending === "missed";
  const ashore = ending === "sold" || ending === "missed", HY = 30;
  const sky = night ? [mix(ink, sea, 0.1), mix(ink, sea, 0.25), mix(ink, sea, 0.4)]
    : dusk ? [mix(ink, sea, 0.6), mix(sea, sun, 0.35), mix(sun, light, 0.15)]
    : [mix(sea, light, 0.25), mix(sea, light, 0.5), mix(sea, light, 0.7)];
  const sunX = 126, sunY = night ? 10 : dusk ? HY - 1 : HY - 10;
  const lamp = { x: 50, y: 34 }, f = Math.floor(t / 180) % 3;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < HY) {
        const h = y / HY + (b - 0.5) * 0.3;
        px(x, y, Math.hypot(x - sunX, (y - sunY) * 1.2) < (night ? 3.5 : 5) ? (night ? pal.light : mix(sun, light, 0.5)) : sky[h < 0.4 ? 0 : h < 0.75 ? 1 : 2]);
        continue;
      }
      const k = (y - HY) / (EMBLEM_H - HY);
      const g = night ? glow(x, y, lamp.x, lamp.y, 22, 12, f) : 0;
      // The light's path on the water: short dashes that drift.
      const path = Math.abs(x - sunX) < 2 + k * 8 && y % 2 === 0 && (x * 3 + y * 5 + Math.floor(t / 500)) % 7 < 3;
      px(x, y, g === 2 ? mix(sun, sea, 0.6) : g === 1 ? mix(sun, sea, 0.8)
        : path ? mix(night ? light : sun, sea, night ? 0.6 : 0.3)
        : k + (b - 0.5) * 0.3 < 0.3 ? mix(sea, light, night ? 0.05 : 0.18) : mix(sea, ink, 0.2 + k * 0.2));
    }
  if (ashore)
    for (let y = 46; y < EMBLEM_H; y++) {
      const w = 62 + (y - 46) * 4;
      rect(0, y, w, 1, mix(wood, light, y < 48 ? 0.2 : 0.3));
      rect(w, y, 3, 1, mix(wood, sea, 0.45));
    }
  const bx = ashore ? 18 : 40, wl = ashore ? 52 : 44;
  const sink = ending === "light" ? 2 : ending === "full" ? 3 : 0, heel = ending === "swamped" ? 1 : 0;
  const hull = mix(wood, ink, 0.3), rail = mix(wood, light, 0.3), coat = mix(ink, sea, 0.45), skin = mix(wood, light, 0.4);
  rect(bx + 13, wl - 26 + sink, 1, 20, mix(wood, ink, 0.15));
  if (!ashore) rect(bx + 9, wl - 25 + sink, 9, 2, mix(light, wood, 0.35));
  if (ending === "snag") {
    // Leaning back against the net, its line taut down into the dark.
    person(ctx, bx + 30, wl - 6, 12, coat, skin);
    for (let i = 0; i < 20; i++) px(bx + 37 + Math.round(i * 0.8), wl - 5 + i, mix(light, sea, 0.3));
    rect(bx + 50, wl + 15, 7, 3, mix(ink, sea, 0.15));
  } else if (!ashore) person(ctx, bx + 25, wl - 6 + sink, 12, coat, skin);
  if (ending === "light" || ending === "full")
    for (let i = 0; i < 26; i++) {
      const hgt = i > 3 && i < 22 ? (i > 8 && i < 18 ? 3 : 2) : 1;
      rect(bx + 6 + i, wl - 6 + sink - hgt, 1, hgt, (i * 7) % 5 ? mix(light, sea, 0.3) : pal.light);
    }
  for (let r = 0; r < 6; r++) {
    const inset = r < 2 ? 0 : (r - 1) * 2;
    rect(bx + inset, wl - 6 + sink + r - (heel && r < 3 ? 1 : 0), 40 - inset * 2, 1, r === 0 ? rail : hull);
  }
  if (night) {
    rect(lamp.x - 1, wl - 16 + sink, 3, 4, pal.accent);
    px(lamp.x, wl - 15 + sink, pal.light);
  }
  if (ending === "swamped") {
    const s = ease(t / 1200);
    for (let i = 0; i < 12; i++) rect(bx + 34 + i, wl - 6 - Math.round(Math.sin(i / 3.6) * 6 * s), 1, 2, mix(light, sea, 0.15));
    [[bx + 54, wl + 4], [bx + 62, wl + 8], [bx - 8, wl + 5], [bx + 8, wl + 10]].forEach(([x, y]) => rect(x, y, 3, 1, mix(light, sea, 0.35)));
  }
  if (ashore) {
    // The catch in baskets on the sand; a buyer counting out coin.
    [[bx + 44, 50], [bx + 50, 51], [bx + 47, 54]].forEach(([x, y]) => {
      rect(x, y, 5, 4, mix(wood, ink, 0.1));
      if (ending === "sold") rect(x + 1, y - 1, 3, 1, pal.light);
    });
    person(ctx, bx + 36, 56, 13, coat, skin);
    if (ending === "sold") {
      person(ctx, bx + 58, 57, 13, mix(sun, ink, 0.4), skin);
      for (let i = 0; i < 3; i++) if (t > 400 + i * 250) px(bx + 54 - i, 49 + i, pal.accent);
    }
  }
  if (!ending || ending === "light" || ending === "snag")
    for (let i = 0; i < 24; i++) {
      const x = 92 + ((i * 37) % 26), y = 36 + ((i * 13) % 16);
      if ((Math.floor(t / 300) + i) % 4) px(x - (y - 36), y, i % 3 ? mix(light, sea, 0.25) : pal.light);
    }
  if (!night)
    [[98, 12], [108, 7], [88, 17]].forEach(([x, y], i) => {
      const up = (Math.floor(t / 320) + i) % 2;
      px(x - 1, y - up, pal.ink); px(x + 1, y - up, pal.ink); px(x, y + 1 - up, pal.ink);
    });
  fadeEdges(ctx, pal.ink);
}
