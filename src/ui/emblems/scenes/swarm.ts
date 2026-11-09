import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, hash, mix, pen, person, rgb, type Pal } from "../kit";

/** The swarm: a field of ripe grain, and a dark cloud on the horizon that is not cloud. */
export default function swarm(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), earth = rgb(pal.edge), light = rgb(pal.light), gold = rgb(pal.accent);
  const HY = 30, landed = ["stripped", "saved", "reaped", "eaten", "landed"].includes(ending ?? "");
  const smoke = ending === "fight" || ending === "fires" || ending === "saved" || ending === "stripped";
  const near = ending === "cloud" || ending === "near" ? 0.6 : 0.05 + 0.15 * ease(t / 1800);
  const sky = [mix(fill, light, 0.35), mix(fill, light, 0.55), mix(gold, light, 0.5)];
  // How much of the field still stands, from the left: all of it, the strip behind the smoke, or none.
  const standing = (x: number) => !landed || (ending === "saved" && x > 92);
  const cx = 30 + 30 * near, cy = 26 - 12 * near, rx = 18 + 60 * near, ry = 5 + 14 * near;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < HY) {
        const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
        const dark = landed ? 0 : 1.05 - d;
        px(x, y, dark > 0.35 + b * 0.3 ? mix(ink, fill, 0.35) : dark > b * 0.35 ? mix(fill, ink, 0.1) : sky[Math.min(2, Math.floor(y / 11 + (b - 0.5) * 0.4))]);
      } else if (y === HY) px(x, y, mix(fill, ink, 0.3));
      else {
        const k = (y - HY) / (EMBLEM_H - HY), row = Math.floor(Math.sqrt(y - HY) * 3);
        if (standing(x)) px(x, y, row % 2 ? mix(gold, earth, 0.25 + 0.2 * k) : mix(gold, light, 0.15 - 0.1 * k));
        else px(x, y, (x + row * 3) % 6 === 0 && row % 2 ? mix(earth, light, 0.2) : mix(ink, earth, 0.55 + (row % 2) * 0.1));
      }
    }
  // Grain heads along the near rows, where it still stands.
  for (let y = HY + 12; y < EMBLEM_H; y += 4)
    for (let x = (y * 3) % 5; x < EMBLEM_W; x += 5) if (standing(x)) rect(x, y - 2, 1, 2, mix(gold, light, 0.45));
  // Locusts: specks over the field once they are down, drifting with the wind.
  if (landed || ending === "cloud" || ending === "near")
    for (let i = 0; i < (landed ? 70 : 24); i++) {
      const x = Math.floor((hash(i) * EMBLEM_W + Math.min(t, 2000) / 40) % EMBLEM_W), y = Math.floor((landed ? 4 : 12) + hash(i + 31) * (landed ? 56 : 18));
      if (!standing(x) || y < HY) px(x, y, mix(ink, earth, 0.4));
    }
  if (smoke)
    for (const sx of [66, 90]) {
      for (let i = 0; i < 5; i++) {
        const r = 3 + Math.round(i * 1.6), px0 = sx + i * 3 + Math.round(Math.sin(Math.min(t, 2000) / 500 + i) * 1), py0 = 47 - i * 6;
        for (let y = py0 - r; y <= py0 + r; y++)
          for (let x = px0 - r; x <= px0 + r; x++) {
            const d = Math.hypot(x - px0, y - py0) / r;
            if (d < 0.7 || (d < 1 && bayer(x, y) < (ending === "stripped" ? 0.2 : 0.5))) px(x, y, mix(light, fill, 0.3 + i * 0.08));
          }
      }
      rect(sx - 2, 51, 5, 2, mix(gold, light, 0.2));
    }
  if (ending === "reaped")
    for (const x of [96, 108, 120]) {
      rect(x, 44, 5, 10, mix(gold, earth, 0.2));
      rect(x + 1, 42, 3, 2, mix(gold, light, 0.4));
      rect(x, 48, 5, 1, mix(earth, ink, 0.3));
    }
  if (ending === "eaten" || ending === "catch")
    for (const x of [104, 112]) {
      rect(x, 50, 6, 7, mix(earth, light, 0.35));
      rect(x + 1, 49, 4, 1, mix(earth, ink, 0.2));
    }
  const body = mix(ink, earth, 0.3), head = mix(light, earth, 0.4), you = mix(earth, ink, 0.05);
  person(ctx, 76, 58, 13, body, head);
  person(ctx, 120, 60, 14, you, head);
  if (ending === "fight" || ending === "saved") rect(118, 44, 1, 12, mix(earth, light, 0.4));
  fadeEdges(ctx, pal.ink);
}
