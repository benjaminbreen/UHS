import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

/** The flood: a brown river up to the top of its bank, fields and two houses below it. */
export default function flood(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), earth = rgb(pal.edge), light = rgb(pal.light), blue = rgb(pal.accent);
  const CREST = 30, FOOT = 38;
  const clearing = ending === "held" || ending === "denied" || ending === "owned";
  const sky = [mix(ink, fill, 0.7), mix(fill, light, 0.2), mix(fill, light, clearing ? 0.5 : 0.35)];
  const river = [mix(earth, blue, 0.3), mix(earth, blue, 0.45), mix(blue, light, 0.4)];
  const field = [mix(ink, earth, 0.42), mix(fill, earth, 0.6)];
  const sheet = mix(earth, blue, 0.45), sheen = mix(blue, light, 0.45);
  const breach = ending === "broke" ? [40, 50] : ending === "dry" ? [138, 148] : ["cut", "found", "owned", "denied", "caught"].includes(ending ?? "") ? [20, 28] : undefined;
  const wet = (x: number, y: number) => y > FOOT && (ending === "broke" ? x < 86 + (y - FOOT) * 1.5 || x > 112
    : ending === "dry" ? x > 100 - (y - FOOT) : breach ? x < 58 - (y - FOOT) * 0.8 : false);
  const flow = Math.floor(t / 140);
  const crestRows = [mix(earth, light, 0.5), mix(earth, light, 0.25), mix(earth, light, 0.12)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < 16) px(x, y, sky[Math.min(2, Math.floor(y / 6 + (b - 0.5) * 0.6))]);
      else if (y < 18) px(x, y, mix(ink, fill, 0.45));
      else if (y < CREST) {
        const ripple = (x + flow * 2 + y * 7) % 31 < 3 && y % 3 === 0;
        px(x, y, ripple ? river[2] : river[y < 23 ? 0 : 1]);
      } else if (y < FOOT) {
        const inGap = breach && x >= breach[0] && x < breach[1];
        if (inGap) px(x, y, (y * 3 - flow * 2 + x) % 5 < 2 ? sheen : sheet);
        else px(x, y, y - CREST < 3 ? crestRows[y - CREST] : y === FOOT - 1 ? mix(ink, earth, 0.35) : mix(ink, earth, 0.62 + (b > 0.6 ? 0.05 : 0)));
      } else if (wet(x, y)) px(x, y, (x + y * 5 + (flow >> 1)) % 19 < 2 ? sheen : sheet);
      else {
        const row = Math.floor(Math.sqrt((y - FOOT) * 6));
        px(x, y, row % 2 ? field[0] : field[1]);
      }
    }
  if (!breach || ending === "dry") for (let x = 0; x < EMBLEM_W; x++) if ((x + flow) % 9 < 6) px(x, CREST - 1, river[2]);
  // The far shore's trees, drowned to the knees.
  for (const x of [12, 30, 52, 96, 118, 141]) {
    rect(x, 12, 5, 4, mix(ink, fill, 0.3));
    rect(x + 1, 11, 3, 1, mix(ink, fill, 0.3));
    rect(x + 2, 16, 1, 3, mix(ink, fill, 0.3));
  }
  const house = (x: number, foot: number, w: number, flooded: boolean, jars: boolean) => {
    rect(x, foot - 9, w, 9, mix(earth, light, 0.25));
    rect(x - 1, foot - 11, w + 2, 2, mix(ink, earth, 0.6));
    rect(x + 3, foot - 5, 3, 5, pal.ink);
    rect(x + w - 6, foot - 7, 2, 2, mix(blue, ink, 0.4));
    if (flooded) rect(x - 1, foot - 3, w + 2, 3, sheet);
    if (jars) for (let i = 0; i < 3; i++) rect(x + 2 + i * 4, foot - 14, 3, 3, mix(earth, light, 0.45));
  };
  house(66, 54, 14, false, ending === "dry");
  house(118, 52, 14, ending === "broke" || ending === "dry", false);
  const you = mix(blue, light, 0.15), them = mix(earth, light, 0.4), head = mix(light, earth, 0.4);
  const basket = (x: number, foot: number) => rect(x - 1, foot - 13, 6, 2, mix(earth, light, 0.15));
  const up = ease(t / 900);
  if (!breach || ending === "broke") {
    person(ctx, 94, CREST + 1, 12, them, head);
    basket(94, CREST + 1);
    if (ending === "broke" || ending === "held" || ending === "dyke") {
      person(ctx, 84, CREST + 1, 12, you, head);
      basket(84, CREST + 1);
    } else if (!ending || ending === "rising") person(ctx, 48, 56 - Math.round(2 * up), 12, you, head);
  }
  if (breach && ending !== "broke" && ending !== "dry") {
    const owner = mix(blue, ink, 0.1);
    if (ending !== "cut") person(ctx, ending === "denied" ? 30 + Math.round(30 * up) : 30, CREST + 1, 12, owner, head);
    if (ending === "cut" || ending === "owned" || ending === "caught") {
      person(ctx, ending === "cut" ? 30 : 40, CREST + 1, 12, you, head);
      rect(ending === "cut" ? 34 : 44, CREST - 10, 1, 10, mix(earth, light, 0.5));
    }
    if (ending === "caught") person(ctx, 60, 50, 12, them, head);
  }
  fadeEdges(ctx, pal.ink);
}
