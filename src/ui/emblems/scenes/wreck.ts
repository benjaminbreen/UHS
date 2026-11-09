import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, flame, glow, mix, pen, person, rgb, type Pal } from "../kit";

/** The wreck: a broken hull on the rocks, cargo along the tide line, a sailor in the surf. */
export default function wreck(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), sea = rgb(pal.fill), sand = rgb(pal.edge), light = rgb(pal.light), amber = rgb(pal.accent);
  const SEA = 18, BEACH = 38, wave = Math.floor(t / 200);
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < SEA) px(x, y, y / SEA + (b - 0.5) * 0.4 < 0.5 ? mix(ink, sea, 0.7) : mix(sea, light, 0.25));
      else if (y < BEACH) {
        const crest = (y - SEA) % 5 === 4 && (x + wave * (y % 2 ? 1 : -1) + y * 7) % 22 < 11;
        px(x, y, crest ? mix(sea, light, 0.55) : mix(ink, sea, 0.7 + (y - SEA) * 0.01));
      } else if (y < BEACH + 2) px(x, y, (x + wave) % 8 < 5 ? mix(sea, light, 0.6) : mix(sand, sea, 0.4));
      else px(x, y, mix(sand, ink, y < 46 && b < 0.5 ? 0.25 : 0.12));
    }
  // The hull broken on the rocks: canted bow-up, its mast snapped, ribs bare where the stern went.
  const hull = mix(sand, ink, 0.45), plank = mix(sand, ink, 0.6);
  for (let i = 0; i < 46; i++) {
    const x = 100 + i, top = 16 + Math.round(i * 0.28), bottom = top + 11 - (i < 9 ? 9 - i : 0);
    if (i > 34 && i % 3) continue;
    for (let y = top; y < bottom; y++) px(x, y, (y - top) % 4 === 3 ? plank : hull);
    px(x, top, mix(sand, light, 0.25));
  }
  for (let i = 0; i < 15; i++) px(114 + Math.round(i * 0.4), 18 - i, mix(sand, ink, 0.2));
  for (let i = 0; i < 12; i++) px(132 + i, 35 - Math.round(i * 0.2), mix(sand, ink, 0.25));
  const rock = mix(ink, sea, 0.6), rockTop = mix(sea, light, 0.3);
  for (const [cx, cy, r] of [[110, 33, 7], [126, 35, 8], [142, 33, 6], [152, 36, 7]])
    for (let y = cy - r; y < BEACH + 1; y++)
      for (let x = cx - r - 2; x <= cx + r + 2; x++)
        if (Math.hypot((x - cx) / (r + 2), (y - cy) / r) < 1) px(x, y, y < cy - r + 2 ? rockTop : rock);
  // Cargo along the tide line, gone up the beach, or stacked by the one whose shore it is.
  const crate = mix(sand, light, 0.35), band = mix(amber, ink, 0.3);
  const piece = (x: number, y: number) => {
    rect(x, y, 5, 4, crate);
    rect(x, y + 1, 5, 1, band);
  };
  const stacked = ending === "reported" || ending === "returned";
  const scattered = !stacked && ending !== "salvaged" && ending !== "washed" && ending !== "found";
  if (scattered) for (const [x, y] of [[48, 41], [60, 44], [78, 42], [96, 45], [22, 41]]) piece(x, y);
  if (stacked) for (const [x, y] of [[84, 50], [90, 50], [96, 50], [87, 46], [93, 46], [90, 42]]) piece(x, y);
  const body = mix(ink, sand, 0.3), head = mix(light, sand, 0.45), you = mix(amber, ink, 0.35), owner = mix(sea, ink, 0.2);
  const walk = ease(t / 1400), sailor = mix(light, sea, 0.35);
  if (ending === "rescued") {
    for (let y = 44; y < EMBLEM_H; y++)
      for (let x = 28; x < 66; x++) {
        const g = glow(x, y, 46, 56, 18, 10);
        if (g) px(x, y, mix(sand, amber, g === 2 ? 0.45 : 0.25));
      }
    flame(ctx, 45, 52, Math.floor(t / 160) % 3);
    person(ctx, 52, 58, 9, sailor, head);
    person(ctx, 36, 58, 13, you, head);
  } else if (ending === "beach" || ending === "survivor" || !ending) {
    rect(30, 44, 8, 2, sailor);
    rect(38, 43, 2, 2, head);
    rect(30, 46, 10, 1, mix(sand, ink, 0.45));
    person(ctx, Math.round(66 - 4 * walk), 56, 13, body, head);
    rect(65, 41, 6, 3, crate);
    person(ctx, 46, 60, 13, you, head);
  } else if (ending === "carry" || ending === "salvaged") {
    person(ctx, 30, 58, 13, body, head);
    person(ctx, 40, 60, 13, you, head);
    rect(28, 42, 6, 3, crate);
    rect(38, 44, 6, 3, crate);
  } else if (ending === "asked" || ending === "found") {
    person(ctx, 44, 58, 13, you, head);
    person(ctx, 60, 58, 14, owner, head);
    if (ending === "found") piece(34, 54);
  } else if (stacked) {
    person(ctx, 104, 56, 14, owner, head);
    person(ctx, 74, 58, 13, you, head);
  }
  fadeEdges(ctx, pal.ink);
}
