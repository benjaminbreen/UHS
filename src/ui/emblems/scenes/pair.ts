import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, flame, glow, mix, pen, person, rgb, type Pal } from "../kit";
import { lerp } from "./cradle";

type Kind = "door" | "well" | "gifts" | "wares";
const DARK = new Set(["gone", "cold", "refused", "missed", "broken", "lapsed", "sold"]);
const SHUT = new Set(["gone", "cold", "refused", "broken", "lapsed", "sold", "offended"]);

/** A house front on a lane at lamp-lighting, its door and lantern, and the
 * people in front of it. The door is a household; the well, a meeting; the
 * gifts, a marriage; the bench, something for sale. */
export function pair(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending: string | undefined, kind: Kind) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), amber = rgb(pal.accent);
  const e = ending ?? "", f = Math.floor(t / 120) % 3, lit = !DARK.has(e), shut = SHUT.has(e);
  const GY = 50, lx = 70;
  const sky = [mix(ink, fill, 0.35), mix(ink, fill, 0.7)], wall = [mix(ink, wood, 0.3), mix(fill, wood, 0.5), mix(wood, amber, 0.35)];
  const lane = [mix(ink, fill, 0.6), mix(fill, wood, 0.35), mix(fill, amber, 0.35)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const g = lit ? glow(x, y, lx, 30, 46, 30, f) : 0;
      if (y >= GY) px(x, y, lane[lit ? glow(x, y, lx - 8, GY, 56, 16, f) : 0]);
      else if (x >= 18 && x < 96 && y >= 10) px(x, y, wall[g]);
      else px(x, y, y > 36 && x >= 96 ? mix(ink, fill, 0.5 + (bayer(x, y) > 0.5 ? 0.05 : 0)) : sky[y / 36 + (bayer(x, y) - 0.5) * 0.3 > 0.55 ? 1 : 0]);
    }
  const far = mix(ink, fill, 0.4);
  rect(112, 26, 30, 24, far);
  for (let r = 0; r < 4; r++) rect(110 + r * 2, 25 - r, 34 - r * 4, 1, far);
  rect(120, 34, 4, 4, lit ? mix(amber, ink, 0.35) : mix(ink, fill, 0.25));
  for (let r = 0; r < 4; r++) rect(15 + r, 9 - r * 2, 84 - r * 2, 2, mix(wood, ink, 0.45 - r * 0.08));
  rect(18, GY - 2, 78, 2, mix(wood, ink, 0.5));
  // The door: open on a warm room, or shut.
  const glowIn = lerp(amber, light, 0.25);
  rect(44, 24, 16, 26, mix(wood, ink, 0.4));
  rect(46, 26, 12, 24, shut ? mix(wood, ink, 0.15) : mix(glowIn, glowIn, 0));
  if (shut) for (const x of [49, 53]) rect(x, 26, 1, 24, mix(wood, ink, 0.45));
  rect(24, 26, 10, 9, mix(wood, ink, 0.4));
  rect(25, 27, 8, 7, lit ? mix(amber, wood, 0.25) : mix(ink, fill, 0.4));
  rect(lx - 1, 18, 1, 5, mix(wood, ink, 0.4));
  rect(lx - 2, 23, 4, 5, mix(wood, ink, 0.3));
  if (lit) flame(ctx, lx - 2, 23, f);
  // The people: you in the warm coat, the other in the dark one.
  const skin = mix(wood, light, 0.45), you = mix(amber, ink, 0.3), them = mix(lerp(fill, light, 0.3), wood, 0.3), old = mix(ink, wood, 0.55);
  const stand = (x: number, h: number, c: string, foot = GY + 4) => person(ctx, x, foot, h, c, skin);
  const sit = (x: number, c: string) => {
    rect(x, GY - 6, 5, 7, c);
    rect(x, GY, 9, 2, c);
    rect(x, GY - 10, 4, 4, skin);
  };
  const come = ease(t / 1600);
  if (kind === "door") {
    if (!e || e === "morning") {
      stand(48, 16, you, GY);
      stand(Math.round(128 + 10 * come), 9, them, 44);
    }
    if (e === "again") {
      stand(48, 16, you, GY);
      stand(Math.round(96 - 14 * come), 16, them);
    }
    if (e === "mended") [47, 52].forEach((x, i) => stand(x, 16, i ? them : you, GY));
    if (e === "softened") {
      sit(36, you);
      sit(64, them);
      rect(56, GY, 5, 2, mix(amber, light, 0.2));
    }
    if (e === "shelved") [64, 86].forEach((x, i) => stand(x, 16, i ? them : you));
    if (e === "cold") {
      sit(62, you);
      stand(136, 10, them, 46);
    }
  }
  if (kind === "well") {
    const wx = 116, st = lerp(fill, light, 0.25), stone = mix(st, wood, 0.2);
    rect(wx - 1, 32, 2, 18, mix(wood, ink, 0.2));
    rect(wx + 17, 32, 2, 18, mix(wood, ink, 0.2));
    rect(wx - 2, 31, 22, 2, mix(wood, light, 0.15));
    rect(wx + 8, 33, 1, 6, mix(light, wood, 0.4));
    rect(wx + 6, 39, 5, 4, mix(wood, ink, 0.1));
    rect(wx, 46, 18, 8, stone);
    rect(wx, 46, 18, 1, mix(st, light, 0.3));
    for (const [x, y] of [[wx + 4, 49], [wx + 11, 51], [wx + 7, 53]]) rect(x, y, 3, 1, mix(ink, fill, 0.5));
    const beloved = (x: number) => stand(x, 16, them, GY + 6);
    if (!e || e === "chance") {
      beloved(wx + 22);
      stand(54, 16, you, GY);
    }
    if (e === "spoke") {
      beloved(wx + 22);
      stand(wx - 12, 16, you, GY + 6);
    }
    if (e === "tongue") {
      beloved(wx + 22);
      stand(Math.round(96 - 18 * come), 16, you);
    }
    if (e === "welcome") {
      stand(50, 15, old, GY);
      stand(70, 16, you);
    }
    if (e === "refused") stand(wx - 10, 16, you, GY + 6);
    if (e === "noticed") {
      beloved(wx + 22);
      for (const [x, y] of [[wx + 27, 41], [wx + 28, 40], [wx + 26, 40]]) px(x, y, mix(amber, light, 0.4));
      stand(88, 15, you);
    }
  }
  if (kind === "gifts") {
    const bundle = mix(amber, wood, 0.35), cloth = mix(light, amber, 0.3);
    const gifts = e === "married" || e === "absent" ? 0 : e === "more" ? 2 : !e ? 0 : 3;
    for (let i = 0; i < gifts; i++) {
      rect(64 + i * 8, GY + 2, 7, 5, bundle);
      rect(64 + i * 8, GY + 2, 7, 1, cloth);
    }
    if (!e || e === "more") {
      stand(48, 16, old, GY);
      if (e === "more") rect(54, GY - 10, 5, 2, old);
      stand(Math.round(118 - 16 * come), 16, you);
      stand(Math.round(130 - 16 * come), 15, them);
    }
    if (e === "married" || e === "absent")
      [30, 40, 66, 76, 86, 100, 110].forEach((x, i) => {
        if (e === "absent" && i === 4) return;
        stand(x, i % 3 === 1 ? 14 : 15, i === 4 ? you : i === 2 || i === 3 ? them : old);
      });
    if (e === "married") rect(lx + 22, 23, 3, 4, mix(amber, light, 0.3));
    if (e === "broken" || e === "lapsed") stand(104, 16, you);
  }
  if (kind === "wares") {
    rect(72, GY - 6, 20, 2, mix(wood, light, 0.2));
    for (const x of [73, 89]) rect(x, GY - 4, 2, 6, mix(wood, ink, 0.3));
    const onBench = !["bought", "offended", "sold", "gone"].includes(e);
    const thing = (x: number, y: number) => {
      rect(x, y, 6, 4, mix(lerp(wood, light, 0.5), amber, 0.2));
      rect(x + 1, y, 2, 1, mix(light, light, 0));
      if ((Math.floor(t / 140) % 12) === 0) px(x + 4, y - 1, mix(light, light, 0));
    };
    if (onBench) thing(79, GY - 10);
    if (e !== "gone") stand(e === "offended" ? 58 : 62, 16, them, GY + 2);
    if (!e || e === "price" || e === "rival") stand(104, 16, you);
    if (e === "rival") stand(118, 15, old);
    if (e === "bought") {
      stand(Math.round(104 + 14 * come), 16, you);
      thing(Math.round(108 + 14 * come), GY - 7);
    }
    if (e === "offended") {
      stand(Math.round(126 + 10 * come), 14, old, GY + 1);
      thing(Math.round(130 + 10 * come), GY - 8);
    }
    if (e === "passed") stand(Math.round(110 + 18 * come), 16, you);
  }
  fadeEdges(ctx, pal.ink);
}

export default function pairScene(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  pair(ctx, pal, t, ending, "door");
}
