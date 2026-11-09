import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, hash, mix, pen, person, rgb, type Pal, type RGB } from "../kit";

const blend = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => v + (b[i] - v) * t) as RGB;

/** The boundary: two fields at dawn, the stone, and where it used to stand. */
export default function stone(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), sun = rgb(pal.accent);
  const HY = 24, rise = ease(t / 1800), late = ending === "silent" || ending === "bought" ? 0.5 : 0;
  const sunX = 132, sunY = HY + 3 - Math.round((7 + 10 * late) * rise);
  const sky = [mix(ink, fill, 0.55), mix(fill, sun, 0.15 + late * 0.2), mix(fill, sun, 0.4 + late * 0.2), mix(sun, light, 0.25)];
  // The balk between the two fields runs from the hedge down past your feet.
  const balk = (y: number) => 116 - (y - HY) * 1.6;
  const soils = [blend(fill, wood, 0.12), blend(fill, wood, 0.34), blend(fill, wood, 0.48), blend(fill, wood, 0.72)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < HY) {
        const h = y / HY + (b - 0.5) * 0.25 - Math.max(0, 1 - Math.hypot(x - sunX, (y - sunY) * 2) / 60) * 0.3;
        px(x, y, Math.hypot(x - sunX, y - sunY) < 5 ? mix(sun, light, 0.6) : sky[h < 0.35 ? 0 : h < 0.62 ? 1 : h < 0.85 ? 2 : 3]);
        continue;
      }
      const k = (y - HY) / (EMBLEM_H - HY), theirs = x > balk(y);
      // One field ploughed toward the hedge, the other across it.
      const furrow = theirs ? Math.floor(Math.sqrt(k) * 12) & 1 : k < 0.3 ? 0 : Math.floor(((x - 116) / (y - HY + 6)) * 3) & 1;
      const soil = soils[(theirs ? 2 : 0) + furrow];
      const lit = Math.max(0, 1 - Math.hypot(x - sunX, (y - HY) * 3) / 80) * 0.5;
      px(x, y, Math.abs(x - balk(y)) < 1 + k * 2.5 ? mix(fill, light, 0.14 + 0.12 * k) : mix(soil, sun, lit > b ? lit * 0.6 : 0));
    }
  for (let x = 0; x < EMBLEM_W; x++) {
    const h = Math.round(hash(x >> 2) * 3 + (x > 24 && x < 64 ? 3 : 0));
    if (h) rect(x, HY - h, 1, h, mix(ink, fill, 0.5));
  }
  const back = ending === "returned" || ending === "sworn" || ending === "judged" || ending === "gone";
  const hole = { x: Math.round(balk(54)) - 4, y: 54 }, at = { x: Math.round(balk(54)) + 12, y: 54 };
  const pos = back ? hole : at, scar = back ? at : hole;
  // The empty hole and its heap of turned earth; long grown over by silence.
  if (back) rect(scar.x + 1, scar.y - 1, 7, 2, mix(wood, light, 0.2));
  else if (ending !== "silent") {
    rect(scar.x - 2, scar.y - 3, 12, 4, mix(wood, sun, 0.35));
    rect(scar.x - 1, scar.y - 4, 10, 1, mix(wood, sun, 0.5));
    rect(scar.x + 1, scar.y - 2, 6, 2, pal.ink);
  }
  // The stone, lit on the sun side, its shadow thrown toward you.
  rect(pos.x - 7, pos.y - 1, 8, 2, mix(ink, fill, 0.45));
  rect(pos.x + 1, pos.y - 15, 6, 1, mix(light, fill, 0.3));
  rect(pos.x, pos.y - 14, 8, 14, mix(light, fill, 0.5));
  rect(pos.x + 5, pos.y - 14, 3, 14, mix(light, sun, 0.4));
  rect(pos.x, pos.y - 14, 1, 14, mix(ink, fill, 0.55));
  rect(pos.x + 2, pos.y - 10, 3, 1, mix(ink, fill, 0.6));
  rect(pos.x + 3, pos.y - 11, 1, 3, mix(ink, fill, 0.6));
  const you = mix(sun, ink, 0.2), them = mix(ink, wood, 0.35), head = mix(ink, wood, 0.65), rim = mix(sun, light, 0.3);
  const figure = (x: number, foot: number, h: number, body: string) => {
    person(ctx, x, foot, h, body, head);
    rect(x + Math.round(h / 3) - 1, foot - h + Math.round(h / 5), 1, h - 2 * Math.round(h / 5), rim);
  };
  figure(16, 48, 15, you);
  const walk = ease((t - 200) / 1400);
  if (!ending) {
    // Bent over the spade at the new hole.
    rect(at.x + 13, at.y - 13, 5, 7, them);
    rect(at.x + 17, at.y - 13, 1, 7, rim);
    rect(at.x + 10, at.y - 15, 4, 4, head);
    rect(at.x + 14, at.y - 6, 1, 6, them);
    rect(at.x + 17, at.y - 6, 1, 6, them);
    rect(at.x + 9, at.y - 12, 1, 12, mix(wood, light, 0.25));
    rect(at.x + 8, at.y, 3, 1, mix(wood, light, 0.4));
  } else if (ending === "decide") {
    const x = Math.round(at.x + 16 + 14 * walk);
    figure(x, 48, 16, them);
    rect(x - 2, 33, 1, 12, mix(wood, light, 0.25));
  } else if (ending === "offer") figure(Math.round(60 - 32 * walk), 50, 16, them);
  else if (ending === "brushed" || ending === "doubted") figure(at.x + 12, 58, 17, them);
  if (ending === "swear" || ending === "sworn" || ending === "judged") {
    figure(pos.x - 10, 58, 18, mix(light, wood, 0.45));
    rect(pos.x - 12, 38, 1, 20, mix(wood, light, 0.2));
  }
  if (ending === "swear") {
    figure(pos.x + 14, 60, 18, them);
    figure(pos.x + 24, 61, 18, mix(fill, light, 0.3));
  }
  if (ending === "bought") {
    rect(26, 44, 9, 4, mix(wood, light, 0.35));
    rect(27, 43, 7, 1, mix(sun, light, 0.3));
    rect(27, 48, 7, 1, mix(wood, ink, 0.3));
  }
  fadeEdges(ctx, pal.ink);
}
