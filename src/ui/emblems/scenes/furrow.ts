import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

/** Your furrows, the old marker stone, and the strip of ground beyond it that someone else is working. */
export default function furrow(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), sun = rgb(pal.accent);
  const HY = 22, lost = ending === "lost";
  const sky = [mix(fill, light, 0.3), mix(sun, light, 0.35)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < HY) {
        px(x, y, sky[y / HY + (b - 0.5) * 0.3 < 0.6 ? 0 : 1]);
        continue;
      }
      // Ploughed ground runs in diagonal furrows up to the stone; past it, rough grass.
      const yours = x < 58 + (y - HY) * 0.3 || (lost && x < 120);
      const row = (x + (y - HY) * 2) % 6;
      px(x, y, yours ? (row < 2 ? mix(wood, ink, 0.25) : row < 4 ? mix(wood, sun, 0.15) : mix(wood, light, 0.2))
        : mix(fill, sun, 0.3 + (b < 0.3 ? 0.08 : 0) + (y - HY) * 0.004));
    }
  for (let x = 0; x < EMBLEM_W; x++) {
    const h = 2 + Math.round(2 * Math.sin(x / 11) + Math.sin(x / 4.3));
    rect(x, HY - h, 1, h, mix(fill, wood, 0.3));
  }
  // The marker stone.
  const lit = ending === "upheld" ? ease((t - 300) / 700) : 0;
  rect(60, 36, 7, 10, mix(light, fill, 0.45 - lit * 0.2));
  rect(61, 34, 5, 2, mix(light, fill, 0.35 - lit * 0.2));
  rect(66, 36, 1, 10, mix(light, ink, 0.6));
  rect(59, 46, 9, 1, mix(ink, wood, 0.4));
  if (lit >= 1 && Math.floor(t / 140) % 6 === 0) px(62, 35, pal.light);
  // Stakes: the newcomer's, along the far edge or pushed into your strip; a new line down the middle if halved.
  const stake = (x: number, y: number) => {
    rect(x, y - 7, 1, 7, mix(wood, light, 0.35));
    px(x, y - 8, mix(sun, light, 0.3));
  };
  if (ending !== "upheld" && ending !== "driven" && ending !== "gone")
    for (let i = 0; i < 5; i++) stake(lost ? 120 - i * 3 : 76 + i * 2, 30 + i * 8);
  if (ending === "halved") for (let i = 0; i < 5; i++) if (t > 300 + i * 150) stake(100 + i, 30 + i * 8);
  if (ending === "turns") {
    rect(104, 26, 1, 20, mix(wood, light, 0.3));
    const flap = Math.floor(t / 220) % 2;
    rect(105, 26 + flap, 5, 3, mix(sun, light, 0.2));
  }
  // Fresh-turned earth where they have been digging.
  if (ending !== "upheld" && ending !== "gone" && ending !== "driven")
    for (let y = 40; y < 52; y++) for (let x = 84; x < 112; x++) if (bayer(x, y) < 0.5 - Math.abs(y - 46) / 14) px(x, y, mix(wood, ink, 0.2));
  // The newcomer at work with a hoe; driven off; or face to face with you.
  const claimant = mix(ink, wood, 0.45), head = mix(light, wood, 0.4);
  if (ending === "scuffle") {
    person(ctx, 90, 56, 18, claimant, head);
    person(ctx, 98, 56, 18, mix(light, sun, 0.15), head);
    for (let i = 0; i < 6; i++) if ((Math.floor(t / 110) + i) % 3) px(88 + i * 3, 57 - (i % 2), mix(wood, light, 0.4));
  } else if (ending !== "gone") {
    const off = ending === "driven" || ending === "upheld" ? ease((t - 400) / 1200) : 0;
    const fx = 100 + Math.round(70 * off), dig = !ending || ending === "answer" ? Math.floor(t / 300) % 2 : 0;
    person(ctx, fx, 54, 18, claimant, head);
    for (let k = 0; k < 9; k++) px(fx - 2 - Math.round(k * 0.5), 40 + k + dig * (k > 5 ? 1 : 0), mix(wood, light, 0.3));
  }
  if (ending === "walk" || ending === "upheld" || ending === "halved") {
    person(ctx, 66, 56, 19, mix(light, wood, 0.5), head);
    rect(73, 36, 1, 20, mix(wood, light, 0.3));
  }
  if (ending === "shared")
    [0, 1, 2].forEach((i) => {
      const c = ease((t - 400 - i * 160) / 600);
      rect(Math.round(40 + 50 * c), 54 - Math.round(6 * Math.sin(Math.PI * c)), 2, 1, mix(sun, light, 0.5));
    });
  fadeEdges(ctx, pal.ink);
}
