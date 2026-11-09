import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";
import { lerp } from "./cradle";

const EVENING = new Set(["stayed", "laughed"]);
const DUSK = new Set(["brought", "forgot", "sulked"]);

/** A path out of the village at first light. `field` runs it between
 * furrows, where a child is learning the work; otherwise it goes out to the
 * river and the graves, where an old one has wandered. */
export function path(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending: string | undefined, field: boolean) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), sun = rgb(pal.accent);
  const e = ending ?? "", HY = 30, dusk = DUSK.has(e), eve = EVENING.has(e);
  const rise = ease(t / 1600), warm = dusk ? 0.25 : eve ? 0.8 : 0.55 + 0.1 * rise;
  const top = lerp(ink, fill, dusk ? 0.3 : 0.6), low = lerp(fill, sun, warm);
  const sky = [mix(top, top, 0), mix(top, low, 0.35), mix(top, low, 0.7), mix(low, light, dusk ? 0 : 0.25)];
  const sunX = eve ? 132 : 68, sunY = HY + 3 - (dusk ? -6 : Math.round(7 * (eve ? 1 : rise)));
  const near = lerp(ink, fill, dusk ? 0.55 : 0.85), far = lerp(fill, wood, dusk ? 0.2 : 0.45);
  const cx = (y: number) => 44 + 72 * ((y - HY) / (EMBLEM_H - HY)) ** 1.5;
  const road = mix(wood, light, dusk ? 0.1 : 0.32), verge = mix(wood, light, dusk ? 0 : 0.12);
  const river = e === "found-river";
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < HY) {
        const h = y / HY + (b - 0.5) * 0.22;
        px(x, y, Math.hypot(x - sunX, y - sunY) < 5 && !dusk ? mix(sun, light, 0.6) : sky[h < 0.35 ? 0 : h < 0.65 ? 1 : h < 0.88 ? 2 : 3]);
        continue;
      }
      const k = (y - HY) / (EMBLEM_H - HY), dx = Math.abs(x - cx(y)), half = 1 + k * 9;
      if (river && y >= 41 && y <= 47 && x > cx(y) + half + 1) {
        const glint = y > 41 && y < 47 && (x * 7 + y * 13 + Math.floor(t / 400) * 5) % 23 === 0;
        px(x, y, y === 41 || y === 47 ? mix(near, ink, 0.3) : glint ? mix(sun, light, 0.5) : mix(lerp(fill, light, 0.25), sun, (y - 41) * 0.04));
        continue;
      }
      const furrow = field && dx > half + 2 && (y + Math.floor(k * 4)) % (2 + Math.floor(k * 3)) === 0;
      px(x, y, dx < half ? road : dx < half + 1.5 && b < 0.6 ? verge : furrow ? mix(near, ink, 0.25) : mix(far, near, Math.min(1, k * 1.6 + (b - 0.5) * 0.3)));
    }
  // The village the path comes from: roofs on the skyline, lit when it is dark.
  const roof = mix(ink, fill, 0.35), lamp = mix(sun, light, 0.3);
  [[10, 7, 6], [19, 9, 8], [30, 6, 5], [38, 10, 7], [50, 7, 5]].forEach(([x, w, h], i) => {
    rect(x, HY - h, w, h, roof);
    for (let r = 0; r < 3; r++) rect(x - 1 + r, HY - h - r - 1, w + 2 - r * 2, 1, roof);
    if (dusk || i === 1) px(x + 2, HY - 3, dusk ? lamp : mix(ink, fill, 0.2));
  });
  const at = (u: number) => {
    const y = Math.round(EMBLEM_H - 1 - u * (EMBLEM_H - 1 - HY));
    return { x: Math.round(cx(y)), y, h: Math.max(3, Math.round(4 + 12 * (1 - u))) };
  };
  const coat = mix(lerp(ink, wood, 0.4), sun, 0.15), you = mix(sun, ink, 0.25), skin = mix(wood, light, 0.45);
  const stand = (x: number, foot: number, h: number, c: string) => person(ctx, x, foot, h, c, skin);
  const sit = (x: number, foot: number, s: number, c: string) => {
    rect(x, foot - 4 * s, 2 * s + 1, 3 * s, c);
    rect(x, foot - s, 4 * s, s, c);
    rect(x, foot - 6 * s, 2 * s, 2 * s, skin);
  };
  const stoop = (x: number, foot: number, h: number) => {
    stand(x, foot, h, coat);
    rect(x + Math.round(h / 3) + 1, foot - Math.round(h * 0.6), 1, Math.round(h * 0.6), mix(wood, light, 0.25));
  };
  const bob = Math.floor(t / 260) % 2;
  if (!field) {
    if (!e || e === "search") stoop(at(0.5).x, at(0.5).y, at(0.5).h);
    if (e === "search") {
      stand(118, 62, 15, you);
      rect(122, 44, 1, 4, you);
    }
    if (e === "found-graves")
      for (const [x, w] of [[102, 12], [120, 10], [136, 11]]) {
        for (let r = 0; r < 4; r++) rect(x + r, 46 - r, w - r * 2, 1, mix(near, wood, 0.4 + r * 0.08));
        rect(x + (w >> 1) - 1, 39, 3, 5, mix(wood, light, 0.35));
      }
    if (e === "found-river" || e === "found-graves") {
      sit(e === "found-river" ? 112 : 116, e === "found-river" ? 40 : 54, 2, coat);
      stand(e === "found-river" ? 124 : 128, e === "found-river" ? 41 : 55, 14, you);
    }
    if (e === "home") {
      const p = at(0.4 + 0.08 * ease(t / 2000));
      stoop(p.x - 3, p.y, p.h);
      stand(p.x + 1, p.y, p.h + 1, you);
    }
    if (e === "stayed") {
      sit(112, 54, 2, coat);
      sit(120, 54, 2, you);
    }
    if (e === "brought") {
      const p = at(0.84);
      stoop(p.x - 2, p.y, p.h);
      stand(p.x + 2, p.y, p.h + 1, mix(ink, wood, 0.5));
    }
  } else {
    const kid = mix(lerp(sun, light, 0.3), ink, 0.1), hoe = mix(wood, light, 0.3);
    if (!e) {
      const p = at(0.32 + 0.08 * ease(t / 2000));
      stand(p.x + 2, p.y, p.h, you);
      rect(p.x + 7, p.y - p.h - 2, 1, p.h, hoe);
      stand(p.x - 5, p.y, Math.round(p.h * 0.65), kid);
    }
    if (e === "slip") {
      stand(98, 60, 15, you);
      sit(80, 60, 2, kid);
      [[72, 59], [75, 61], [70, 61], [77, 58], [73, 62]].forEach(([x, y]) => rect(x, y, 2, 1, mix(sun, light, 0.3)));
    }
    if (e === "learned" || e === "watched") {
      const work = e === "learned" ? kid : you, h = e === "learned" ? 10 : 15;
      stand(126, 58, h, work);
      rect(126 + (h >> 2), 58 - h - 2 + bob * 2, 1, h - 1, hoe);
      if (e === "learned") stand(100, 60, 15, you);
      else sit(104, 60, 2, kid);
    }
    if (e === "sulked") {
      sit(22, 60, 2, kid);
      stand(130, 42, 8, you);
    }
    if (e === "laughed") {
      const p = at(0.36 + 0.1 * ease(t / 2000));
      stand(p.x + 1, p.y, p.h, you);
      stand(p.x - 4, p.y, Math.round(p.h * 0.65), kid);
    }
    if (e === "forgot") stand(at(0.82).x - 8, at(0.82).y, 4, kid);
  }
  fadeEdges(ctx, pal.ink);
}

export default function pathScene(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  path(ctx, pal, t, ending, false);
}
