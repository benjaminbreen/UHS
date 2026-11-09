import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, glow, hash, mix, pen, person, rgb, type Pal } from "../kit";

/** The cove: a ship standing off, a boat run up the sand, a shaded lantern. */
export default function cove(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), sea = rgb(pal.edge), light = rgb(pal.light), lamp = rgb(pal.accent);
  const f = Math.floor(t / 120) % 3, tq = Math.floor(t / 160);
  const landing = !ending || ending === "decide";
  const search = ending === "search" || ending === "informed" || ending === "unseen" || ending === "missed" || ending === "caught";
  const ship = landing || ending === "run" || ending === "ran";
  const lights = landing ? [[96, 44]] : search ? [[70, 46], [104, 42], [128, 47]] : [];
  const shore = (x: number) => 36 + Math.round(x * 0.05);
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y), g = Math.max(0, ...lights.map(([lx, ly]) => glow(x, y, lx, ly, 22, 12, f)));
      if (y < 22) {
        const m = Math.hypot(x - 126, y - 8);
        px(x, y, m < 4 ? mix(light, fill, 0.1) : y / 22 + (b - 0.5) * 0.3 - (m < 30 ? (30 - m) / 90 : 0) > 0.55 ? mix(ink, fill, 0.6) : mix(ink, fill, 0.35));
      } else if (y < shore(x)) {
        // The moon's road on the water, broken by the swell.
        const road = Math.abs(x - 126) < 2 + (y - 22) * 0.3 && (y * 3 + Math.floor(x / 4) + tq) % 5 === 0;
        px(x, y, road ? mix(light, sea, 0.35) : mix(ink, sea, 0.25 + (y - 22) * 0.012 + (b > 0.85 ? 0.08 : 0)));
      } else if (y === shore(x)) px(x, y, (x + tq) % 7 < 4 ? mix(light, sea, 0.45) : mix(sea, light, 0.15));
      else px(x, y, g ? mix(fill, lamp, g === 2 ? 0.45 : 0.25) : mix(fill, light, 0.08 + (y - 36) * 0.004 + (b > 0.8 ? 0.03 : 0)));
    }
  for (let i = 0; i < 12; i++) {
    const sx = Math.floor(hash(i) * EMBLEM_W), sy = Math.floor(hash(i + 30) * 14);
    if (Math.hypot(sx - 126, sy - 8) > 12 && (tq + i) % 9) px(sx, sy, mix(light, fill, 0.35));
  }
  // The headland, black against the sky.
  for (let x = 136; x < EMBLEM_W; x++) rect(x, 30 - Math.round((x - 136) * 0.8), 1, 40, pal.ink);
  if (ship) {
    const sx = ending === "ran" ? 30 : 34;
    rect(sx, 27, 22, 3, pal.ink);
    rect(sx + 2, 30, 18, 1, pal.ink);
    for (let r = 0; r < 14; r++) rect(sx + 6 + Math.round(r / 3), 13 + r, 2 + Math.round(r * 0.6), 1, mix(ink, fill, 0.15));
    rect(sx + 10, 11, 1, 16, pal.ink);
  }
  const boat = (x: number, y: number) => {
    rect(x, y, 16, 1, mix(sea, light, 0.35));
    rect(x, y + 1, 16, 2, mix(sea, ink, 0.35));
    rect(x + 2, y + 3, 12, 1, mix(sea, ink, 0.6));
    rect(x - 1, y - 1, 2, 2, mix(sea, light, 0.2));
  };
  const cask = (x: number, foot: number) => {
    rect(x, foot - 5, 5, 5, mix(fill, light, 0.3));
    rect(x, foot - 3, 5, 1, mix(fill, ink, 0.3));
  };
  const body = mix(ink, fill, 0.3), head = mix(ink, sea, 0.4), you = mix(lamp, ink, 0.35);
  if (ending === "ran") boat(66, 32);
  else if (ending !== "silent" && ending !== "warned" && ending !== "gone") boat(48, 42);
  if (landing) {
    const w = ease(t / 1800);
    [70, 86, 112].forEach((x0, i) => {
      const x = Math.round(x0 + 8 * w), foot = 52 + i;
      person(ctx, x, foot, 15, body, head);
      cask(x + 3, foot - 13);
    });
  }
  if (ending === "run") person(ctx, 62, 50, 16, you, head);
  if (search) for (const [lx, ly] of lights) {
    person(ctx, lx - 2, ly + 10, 16, mix(fill, light, 0.25), head);
    rect(lx, ly, 3, 4, mix(lamp, light, 0.4 + f * 0.1));
  }
  if (landing) rect(96, 44, 3, 4, mix(lamp, light, 0.35 + f * 0.1));
  if (ending === "informed" || ending === "unseen") for (const [x, y] of [[88, 58], [94, 58], [91, 53], [100, 58]]) cask(x, y);
  if (ending === "missed") for (const x of [86, 116]) rect(x, 56, 7, 2, pal.ink);
  if (ending === "caught") person(ctx, 40, 54, 16, you, head);
  if (ending === "cask") cask(80, 58);
  if (ending === "silent" || ending === "warned" || ending === "gone")
    for (let i = 0; i < 8; i++) px(60 + i * 9, 46 + i + (i % 2), mix(fill, ink, 0.35));
  fadeEdges(ctx, pal.ink);
}
