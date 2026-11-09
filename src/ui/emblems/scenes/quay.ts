import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

/** The strangers' landing: their boat in at the shore, goods spread on a mat, and a bargain to be made. */
export default function quay(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), sea = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), gold = rgb(pal.accent);
  const HY = 24, SHORE = 42, wave = Math.floor(t / 220);
  const gone = ending === "left";
  const sky = [mix(sea, light, 0.35), mix(sea, gold, 0.4), mix(gold, light, 0.35)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < HY) px(x, y, Math.hypot(x - 70, y - HY - 2) < 6 ? mix(gold, light, 0.6) : sky[Math.min(2, Math.floor(y / 9 + (b - 0.5) * 0.4))]);
      else if (y < SHORE) {
        const glitter = Math.abs(x - 70) < 3 + (y - HY) * 0.3 && y % 2 === 0 && (x + wave) % 5 < 2;
        px(x, y, glitter ? mix(gold, light, 0.4) : (y - HY) % 4 === 3 && (x + wave * (y % 2 ? 1 : -1)) % 17 < 6 ? mix(sea, light, 0.25) : mix(ink, sea, 0.75));
      } else px(x, y, y === SHORE ? mix(sea, light, 0.45) : mix(wood, light, y < 48 && b < 0.5 ? 0.15 : 0.25));
    }
  // The strangers' boat, drawn up at the shore with its sail furled, or far out on the evening wind.
  if (gone) {
    rect(124, HY + 1, 6, 2, mix(ink, wood, 0.4));
    rect(126, HY - 6, 1, 7, mix(ink, wood, 0.4));
    rect(127, HY - 5, 3, 4, mix(light, gold, 0.3));
  } else {
    const hull = mix(wood, ink, 0.45);
    for (let i = 0; i < 44; i++) {
      const lift = i < 6 ? 6 - i : i > 38 ? i - 38 : 0;
      rect(106 + i, 34 - lift, 1, 8 + lift - (i < 3 || i > 41 ? 2 : 0), hull);
      px(106 + i, 34 - lift, mix(wood, light, 0.25));
    }
    rect(127, 6, 1, 28, mix(wood, ink, 0.3));
    rect(118, 9, 19, 2, mix(light, gold, 0.25));
    rect(119, 11, 17, 1, mix(wood, light, 0.2));
    for (let i = 0; i < 12; i++) px(128 + i, 7 + i * 2, mix(ink, wood, 0.5));
  }
  // The mat of goods: bolts of cloth, jars, a sack; fuller or emptier as the bargains go.
  const mat = mix(wood, gold, 0.35), cloth = mix(gold, light, 0.2), cloth2 = mix(sea, light, 0.4), jar = mix(wood, ink, 0.2);
  if (!gone) {
    rect(54, 52, 30, 4, mat);
    rect(54, 52, 30, 1, mix(wood, light, 0.45));
    const bolts = ending === "took" || ending === "brokered" ? 2 : ending === "bargain" ? 1 : 3;
    for (let i = 0; i < bolts; i++) rect(56 + i * 6, 48, 5, 4, i % 2 ? cloth2 : cloth);
    for (let i = 0; i < 2; i++) {
      rect(76 + i * 5, 46, 4, 6, jar);
      rect(77 + i * 5, 45, 2, 1, jar);
    }
  }
  const body = mix(ink, sea, 0.35), head = mix(light, wood, 0.45), stranger = mix(sea, light, 0.15), you = mix(gold, ink, 0.45);
  const walk = ease(t / 1400);
  if (!gone) {
    rect(88, 48, 6, 6, stranger);
    rect(89, 44, 4, 4, head);
    rect(87, 53, 9, 2, stranger);
  }
  const yx = !ending || ending === "arrive" ? Math.round(20 + 16 * walk) : ending === "brokered" ? 28 : 44;
  person(ctx, yx, 60, 15, you, head);
  if (ending === "offer") rect(50, 47, 6, 3, cloth);
  if (ending === "took" || ending === "bargain") rect(yx - 2, 48, 7, 3, cloth2);
  if (ending === "bargain") {
    rect(yx + 5, 47, 4, 3, cloth2);
    if (Math.floor(t / 400) % 3 === 0) px(yx + 6, 46, pal.light);
  }
  if (ending === "brokered" || ending === "arrive" || !ending) person(ctx, 44, 60, 16, body, head);
  if (ending === "walked") person(ctx, 100, 60, 15, body, head);
  if (ending === "supplied")
    for (let i = 0; i < 3; i++) rect(98 + i * 5, 52, 4, 5, mix(wood, light, 0.35));
  fadeEdges(ctx, pal.ink);
}
