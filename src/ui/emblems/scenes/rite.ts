import { EMBLEM_H, EMBLEM_W, ease, fadeEdges, flame, glow, mix, pen, person, rgb, sealAt, type Pal } from "../kit";
import { lerp } from "./cradle";

type Kind = "table" | "lararium" | "naming" | "desk";
const DIM = new Set(["late", "missed", "refused"]);

/** A room before the household's dead or its gods, by candle and lamp: the
 * memorial table, the Roman household shrine, a naming before the hearth, or
 * a candidate's desk under the ancestors' tablets. */
export function rite(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending: string | undefined, kind: Kind) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), amber = rgb(pal.accent);
  const e = ending ?? "", f = Math.floor(t / 120) % 3, dim = DIM.has(e), FY = 48, cx = 80;
  const r = dim ? 0.6 : 1;
  const wall = [pal.ink, mix(ink, wood, 0.28), mix(fill, wood, 0.55)];
  const floor = [mix(ink, fill, 0.55), mix(fill, wood, 0.35), mix(wood, amber, 0.3)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) px(x, y, (y < FY ? wall : floor)[glow(x, y, cx, 34, 90 * r, 40 * r, f)]);
  const paper = mix(light, wood, 0.12), screen = mix(wood, light, 0.42), line = mix(wood, ink, 0.35), dark = mix(wood, ink, 0.45);
  const skin = mix(wood, light, 0.45), you = mix(amber, ink, 0.3), robe = mix(lerp(fill, light, 0.35), wood, 0.25), old = mix(ink, wood, 0.6);
  const candle = (x: number, low: boolean) => {
    rect(x, low ? 42 : 36, 2, low ? 4 : 10, paper);
    rect(x - 1, 46, 4, 2, dark);
    if (!dim || f) flame(ctx, x - 1, low ? 38 : 32, f);
  };
  const smoke = (x: number, y: number) => {
    for (let i = 0; i < 14; i++) {
      const k = ((t / 2400 + i / 14) % 1);
      px(Math.round(x + 2 * Math.sin(k * 9 + i * 0.3)), Math.round(y - k * 22), mix(lerp(fill, light, 0.5), wood, k * 0.6));
    }
  };
  const bow = (x: number, c: string) => {
    rect(x, 52, 12, 4, c);
    rect(x + 11, 54, 4, 3, skin);
    rect(x - 2, 55, 4, 2, c);
  };
  const kneel = (x: number, c: string, slump = 0) => {
    rect(x, 42 + slump, 7, 10 - slump, c);
    rect(x - 1, 50, 11, 3, c);
    rect(x + 2 + slump, 37 + slump * 2, 5, 5, skin);
  };
  const come = ease(t / 1800);
  if (kind === "table") {
    for (let i = 0; i < 6; i++) {
      rect(48 + i * 11, 8, 10, 30, screen);
      rect(50 + i * 11, 12, 6, 1, line);
      rect(52 + i * 11, 16 + (i % 3) * 4, 1, 12 - (i % 3) * 3, line);
    }
    rect(76, 22, 8, 16, mix(wood, ink, 0.2));
    rect(77, 23, 6, 14, mix(light, amber, 0.15));
    rect(79, 25, 2, 10, line);
    rect(46, 40, 68, 3, mix(wood, light, 0.1));
    rect(46, 43, 68, 1, dark);
    for (const x of [48, 110]) rect(x, 44, 2, 5, dark);
    const fruit = [rgb("#c8402e"), lerp(light, amber, 0.1), rgb("#c8402e"), lerp(wood, amber, 0.4), lerp(light, amber, 0.1), rgb("#c8402e"), lerp(wood, light, 0.3)];
    fruit.forEach((c, i) => {
      const x = 52 + i * 8, laid = e || come * 7 > i;
      rect(x, 38, 5, 2, dark);
      if (!laid || (e === "store" && (i === 1 || i === 4)) || (e === "spare" && i === 4)) return;
      const k = e === "filled" && i === 4 ? lerp(amber, rgb("#d06a20"), 0.7) : c;
      rect(x, 35, 5, 3, mix(k, k, 0));
      rect(x + 1, 33, 3, 2, mix(k, light, 0.15));
    });
    candle(42, e === "late");
    candle(116, e === "late");
    smoke(79, 21);
    if (["full", "filled", "spare"].includes(e)) bow(64, you);
    else if (e === "late") kneel(60, you, 2);
    else if (e === "missed") bow(64, robe);
    else kneel(120, robe);
  }
  if (kind === "lararium") {
    rect(0, 38, EMBLEM_W, 10, mix(rgb("#8a2e22"), ink, dim ? 0.55 : 0.3));
    for (let r2 = 0; r2 < 5; r2++) rect(64 + r2 * 2, 6 + r2, 32 - r2 * 4, 1, paper);
    rect(64, 11, 32, 2, paper);
    rect(66, 13, 2, 18, paper);
    rect(92, 13, 2, 18, paper);
    rect(68, 13, 24, 18, mix(ink, wood, 0.3));
    rect(64, 31, 32, 3, paper);
    for (const x of [72, 85]) person(ctx, x, 30, 9, mix(amber, wood, 0.4), mix(amber, light, 0.3));
    const hung = !!e && e !== "escort";
    const gold = mix(amber, light, 0.2);
    if (hung) {
      rect(79, 14, 1, 6, gold);
      rect(77, 20, 5, 5, gold);
    }
    candle(58, false);
    candle(100, false);
    const toga = mix(light, light, 0), border = mix(rgb("#8a2a5a"), ink, 0.1);
    const youth = (x: number) => {
      person(ctx, x, 60, 18, toga, skin);
      if (!hung) rect(x, 46, 6, 1, border);
      else rect(x + 1, 46, 4, 6, mix(lerp(light, wood, 0.15), wood, 0));
      if (!hung) rect(x + 2, 46, 2, 2, gold);
    };
    youth(77);
    const crowd = e === "honoured" ? [40, 52, 104, 116, 128] : e === "man" ? [52, 104, 116] : e === "missed" ? [104, 116] : [104];
    crowd.forEach((x, i) => person(ctx, x, 60, i === 0 && e === "honoured" ? 18 : 16, i === 0 && e === "honoured" ? toga : i === crowd.length - 1 && e !== "missed" ? you : robe, skin));
    if (e === "honoured") rect(40, 46, 6, 1, border);
  }
  if (kind === "naming") {
    rect(70, 30, 20, 18, mix(wood, ink, 0.2));
    rect(72, 32, 16, 4, mix(amber, wood, 0.3));
    candle(64, false);
    candle(95, false);
    const babe = mix(light, amber, 0.1);
    const named = ["named", "yours", "guarded", "missed"].includes(e);
    if (!named) {
      rect(74, 54, 12, 5, mix(wood, light, 0.2));
      rect(77, 52, 6, 3, babe);
      kneel(52, robe);
      person(ctx, 102, 60, 17, you, skin);
      person(ctx, 120, 60, 15, old, skin);
    } else {
      const holder = e === "yours" ? you : e === "named" ? robe : old;
      person(ctx, 77, 60, 17, holder, skin);
      rect(76, 40, 2, 4, holder);
      rect(82, 40, 2, 4, holder);
      rect(77, Math.round(39 - 2 * come), 6, 3, babe);
      if (e === "guarded") px(80, Math.round(42 - 2 * come), mix(amber, light, 0.4));
      [40, 54, 104, 118, 132].forEach((x, i) => {
        if (e === "missed" && i === 2) return;
        person(ctx, x, 60, 14 + (i % 2), i === 2 && e !== "yours" ? you : i === 1 && e !== "named" ? robe : old, skin);
      });
    }
  }
  if (kind === "desk") {
    rect(56, 8, 48, 3, dark);
    [64, 76, 88].forEach((x) => {
      rect(x, 13, 5, 10, mix(light, amber, 0.15));
      rect(x + 1, 12, 3, 1, mix(light, amber, 0.15));
      rect(x + 2, 15, 1, 3, line);
      rect(x - 1, 23, 7, 2, dark);
    });
    rect(44, 44, 40, 3, mix(wood, light, 0.1));
    for (const x of [46, 80]) rect(x, 47, 2, 6, dark);
    rect(52, 42, 14, 2, paper);
    rect(70, 42, 4, 2, mix(ink, fill, 0.2));
    rect(76, 39, 1, 5, mix(wood, light, 0.3));
    rect(88, 38, 10, 8, mix(wood, ink, 0.2));
    rect(89, 37, 8, 1, mix(wood, light, 0.2));
    candle(42, dim);
    const won = ["vouched", "favoured", "pleaded"].includes(e);
    if (won) {
      rect(108, 12, 26, 30, paper);
      for (let y = 16; y < 34; y += 4) rect(112, y, 18, 1, line);
      sealAt(ctx, pal, 121, 34);
    }
    if (e === "favoured") rect(86, 34, 8, 4, mix(amber, wood, 0.3));
    kneel(28, you, dim ? 3 : 0);
    if (!e || e === "terms" || e === "pleaded") {
      const x = e === "pleaded" ? 132 : Math.round(136 - 8 * come);
      person(ctx, x, 60, 20, robe, skin);
      rect(x - 1, 39, 9, 2, dark);
    }
  }
  fadeEdges(ctx, pal.ink);
}

export default function riteScene(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  rite(ctx, pal, t, ending, "table");
}
