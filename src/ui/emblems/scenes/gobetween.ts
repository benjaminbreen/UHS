import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, glow, mix, pen, person, rgb, type Pal } from "../kit";

/** The go-between: two doors across a lane, and the woman who walks between them. */
export default function gobetween(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), rose = rgb(pal.accent);
  const f = Math.floor(t / 120) % 3, eve = ending === "after" || ending === "match" || ending === "arranged";
  const lamps = ending === "match" ? [[30, 22], [130, 22]] : eve ? [[30, 22]] : [];
  const GY = 46;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y), g = Math.max(0, ...lamps.map(([lx, ly]) => glow(x, y, lx, ly, 34, 30, f)));
      const house = x < 46 || x > 114;
      if (y < GY) px(x, y, house ? [mix(fill, eve ? ink : light, eve ? 0.2 : 0.12), mix(fill, rose, 0.2), mix(fill, rose, 0.4)][g]
        : mix(fill, eve ? ink : light, (eve ? 0.35 : 0.3) + (y / GY + (b - 0.5) * 0.3 > 0.5 ? 0.08 : 0)));
      else px(x, y, mix(wood, g ? rose : light, g ? 0.25 : 0.12 + (b > 0.8 ? 0.04 : 0)));
    }
  // Your house on the left, theirs on the right, eaves toward the lane.
  for (const [x0, dir] of [[0, 1], [114, -1]]) {
    rect(x0, 8, 46, 3, mix(wood, ink, 0.5));
    for (let i = 0; i < 4; i++) rect(dir > 0 ? x0 + 46 + i : x0 - 1 - i, 8 + i, 1, 3, mix(wood, ink, 0.5));
    const dx = dir > 0 ? x0 + 30 : x0 + 6;
    const dark = ending === "gone" && dir < 0;
    rect(dx - 1, 22, 12, 24, mix(wood, ink, 0.55));
    rect(dx + 1, 24, 8, 22, dark ? mix(wood, ink, 0.3) : eve ? mix(rose, light, 0.2) : pal.ink);
    if (dark) for (let x = dx + 2; x < dx + 9; x += 3) rect(x, 24, 1, 22, mix(wood, ink, 0.5));
  }
  for (const [lx, ly] of lamps) {
    rect(lx, ly, 4, 6, mix(rose, light, 0.4 + f * 0.1));
    rect(lx - 1, ly - 1, 6, 1, mix(wood, ink, 0.4));
  }
  if (ending === "match")
    for (let x = 34; x < 130; x++) {
      const y = 16 + Math.round(8 * Math.sin(((x - 34) / 96) * Math.PI));
      px(x, y, mix(rose, ink, 0.2));
      if (x % 8 === 2) rect(x, y + 1, 2, 2, x % 16 === 2 ? pal.accent : mix(light, rose, 0.3));
    }
  const elder = mix(rose, ink, 0.45), shawl = mix(rose, light, 0.15), head = mix(ink, wood, 0.55);
  const you = mix(light, wood, 0.35), them = mix(fill, light, 0.35);
  const her = (x: number, back = false) => {
    person(ctx, x, GY + 8, 19, elder, mix(light, wood, 0.6));
    rect(x - 1, GY - 7, 8, 3, shawl);
    if (!back) rect(x + 6, GY - 4, 2, 2, mix(light, wood, 0.6));
  };
  const walk = ease(t / 1600);
  if (!ending || ending === "pitch" || ending === "after" || ending === "other") {
    person(ctx, 32, GY + 6, 19, you, head);
    her(ending === "pitch" || !ending ? Math.round(64 - 18 * walk) : 46);
    if (ending === "other" || ending === "after") rect(53, GY - 5, 2, 4, elder);
  } else if (ending === "met") {
    person(ctx, 66, GY + 9, 19, you, head);
    person(ctx, 90, GY + 9, 19, them, head);
  } else if (ending === "declined") her(Math.round(70 + 40 * walk), true);
  else if (ending === "match") her(77);
  else if (ending === "arranged") {
    person(ctx, Math.round(104 - 24 * walk), GY + 9, 19, them, head);
    person(ctx, Math.round(116 - 24 * walk), GY + 9, 19, mix(fill, wood, 0.6), head);
    rect(Math.round(100 - 24 * walk), GY - 6, 5, 4, pal.accent);
  }
  fadeEdges(ctx, pal.ink);
}
