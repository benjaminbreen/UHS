import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

/** The well: a stone ring and its windlass in the middle of the street, and the bucket that tells. */
export default function well(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), stone = rgb(pal.edge), light = rgb(pal.light), water = rgb(pal.accent);
  const clear = ending === "found" || ending === "secret" || ending === "cleaned";
  const evening = ending === "secret" || ending === "unsolved" || ending === "soaked";
  const crowd = !ending || ending === "talk" || ending === "found" || ending === "unsolved";
  const GY = 40, CX = 80;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < 12) px(x, y, mix(fill, light, (evening ? 0.15 : 0.35) + (y / 12 + (b - 0.5) * 0.4 > 0.5 ? 0.1 : 0)));
      else if (y < GY) px(x, y, (x % 40) < 2 ? mix(fill, ink, 0.4) : mix(fill, stone, 0.25 + ((x % 40) > 30 ? -0.1 : 0)));
      else px(x, y, mix(stone, light, (evening ? 0.05 : 0.18) - (y - GY) * 0.004 + (b > 0.8 ? 0.03 : 0)));
    }
  // A row of house fronts behind: eaves, and a dark door in each.
  for (let x = 0; x < EMBLEM_W; x += 40) {
    rect(x, 12, 40, 2, mix(stone, ink, 0.5));
    rect(x + 14, 24, 8, 16, mix(fill, ink, 0.55));
    rect(x + 28, 20, 6, 5, mix(fill, ink, 0.45));
  }
  // The windlass frame, the rope, and the stone ring lit from the right.
  const post = mix(stone, ink, 0.3);
  rect(CX - 15, 18, 2, 26, post);
  rect(CX + 13, 18, 2, 26, post);
  rect(CX - 17, 16, 34, 2, mix(stone, light, 0.1));
  rect(CX - 6, 19, 12, 3, mix(stone, ink, 0.1));
  const pull = ending === "secret" ? 1 - ease(t / 1600) : 0;
  const by = ending === "secret" ? Math.round(28 + 8 * pull) : 0;
  rect(CX, 22, 1, ending === "secret" ? by - 22 : 14, mix(light, stone, 0.4));
  for (let y = 0; y < 14; y++) {
    const w = 15 - (y === 0 ? 1 : 0);
    for (let x = -w; x <= w; x++) px(CX + x, 38 + y, mix(stone, x > 6 ? light : ink, x > 6 ? 0.3 : x < -8 ? 0.4 : 0.15 + ((y >> 2) + (x >> 3)) % 2 * 0.08));
  }
  rect(CX - 16, 36, 33, 2, mix(stone, light, 0.4));
  rect(CX - 13, 37, 27, 1, pal.ink);
  // The bucket on the rim, and what is in it.
  const bucket = (x: number, y: number) => {
    rect(x, y, 8, 6, mix(stone, ink, 0.45));
    rect(x + 1, y, 6, 1, clear ? mix(water, light, (Math.floor(t / 300) % 4) * 0.12) : mix(stone, ink, 0.2));
    rect(x, y + 2, 8, 1, mix(stone, light, 0.1));
  };
  if (ending === "secret") bucket(CX - 4, by);
  else bucket(CX + 10, 30);
  const you = mix(water, ink, 0.45), head = mix(ink, stone, 0.6), folk = [mix(fill, light, 0.3), mix(stone, ink, 0.2), mix(fill, ink, 0.1)];
  if (crowd) {
    const apart = ending === "unsolved" ? 10 : ending === "found" ? -6 : 0;
    [[34, 0], [46, 1], [112, 2], [124, 0]].forEach(([x, c], i) => person(ctx, x + (i < 2 ? -apart : apart), 60 + (i % 2), 21, folk[c], head));
    if (!ending || ending === "talk") rect(52, 44, 5, 1, folk[1]);
    person(ctx, ending === "found" ? 60 : 22, 59, 12, mix(water, light, 0.2), head);
  }
  if (ending === "wrong") {
    person(ctx, 46, 60, 21, you, head);
    person(ctx, 112, 60, 21, folk[0], head);
    rect(108, 48, 4, 5, mix(stone, light, 0.3));
  }
  if (ending === "confess" || ending === "secret") {
    person(ctx, 52, 60, 21, you, head);
    person(ctx, 62, 60, 12, mix(water, light, 0.2), head);
  }
  if (ending === "cleaned" || ending === "soaked") {
    const sit = ending === "soaked";
    person(ctx, 104, 60, sit ? 14 : 21, you, head);
    for (let i = 0; i < 3; i++) if ((Math.floor(t / 250) + i) % 3 === 0) px(103 + i * 4, 52 + i, mix(water, light, 0.4));
  }
  fadeEdges(ctx, pal.ink);
}
