import { EMBLEM_H, EMBLEM_W, bayer, fadeEdges, flame, glow, hash, mix, pen, person, rgb, type Pal } from "../kit";

/** The batch: a kiln at night, its fire mouth glowing, and what comes out of it. */
export default function kiln(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), fire = rgb(pal.accent);
  const lit = !ending || ending === "care", cold = ending === "spoiled";
  const opened = !lit && !cold, GY = 50, KX = 50;
  const f = Math.floor(t / 160) % 3, hot = ending === "care" ? 1.25 : 1;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y), g = lit ? glow(x, y, KX, GY - 4, 46 * hot, 26 * hot, f) : opened ? glow(x, y, 122, GY - 10, 30, 22) : 0;
      if (y < GY) {
        const ridge = GY - 8 - Math.round(3 * Math.sin(x / 19) + 2 * Math.sin(x / 7 + 1));
        const base = y > ridge ? mix(ink, fill, 0.55) : y / GY + (b - 0.5) * 0.3 > 0.6 ? mix(ink, fill, 0.4) : mix(ink, fill, 0.15);
        px(x, y, g === 2 ? mix(fire, fill, 0.55) : g === 1 ? mix(fire, fill, 0.75) : base);
      } else px(x, y, g === 2 ? mix(wood, fire, 0.35) : g === 1 ? mix(wood, fire, 0.15) : y === GY ? mix(wood, light, 0.1) : mix(wood, ink, 0.45));
    }
  for (let i = 0; i < 9; i++) if (hash(i * 3.1) > 0.3) px(10 + Math.round(hash(i) * 140), 3 + Math.round(hash(i + 9) * 16), mix(light, fill, 0.5));
  // The kiln: a brick dome with a vent on top and a fire mouth at the foot.
  const brick = mix(wood, ink, cold ? 0.45 : 0.2), joint = mix(wood, ink, 0.6), lip = mix(wood, light, 0.25);
  for (let y = GY - 24; y < GY; y++) {
    const half = Math.round(18 * Math.sqrt(1 - ((GY - y) / 25) ** 2));
    rect(KX - half, y, half * 2, 1, (GY - y) % 4 === 0 ? joint : brick);
    for (let x = KX - half + ((GY - y) % 8 < 4 ? 2 : 6); x < KX + half; x += 8) if ((GY - y) % 4) px(x, y, joint);
    px(KX - half, y, lip);
  }
  rect(KX - 3, GY - 25, 6, 2, joint);
  if (ending === "care") flame(ctx, KX - 1, GY - 29, f);
  if (opened) rect(KX - 6, GY - 9, 12, 9, mix(ink, fill, 0.1));
  else {
    rect(KX - 5, GY - 7, 10, 7, cold ? mix(ink, fill, 0.2) : mix(fire, ink, 0.3));
    rect(KX - 4, GY - 8, 8, 1, cold ? joint : mix(fire, ink, 0.3));
    if (!cold) {
      flame(ctx, KX - 3, GY - 5, f);
      flame(ctx, KX + 1, GY - 4, (f + 1) % 3);
      rect(KX - 4, GY - 1, 8, 1, pal.light);
    }
  }
  // Smoke from the vent: thin and pale while it burns, grey when it has died.
  for (let i = 0; i < 6; i++) {
    const y = GY - 29 - i * 5 - (Math.floor(t / 500) % 5), x = KX - 2 + i * 2 + Math.round(Math.sin(i * 1.7) * 2);
    if (y > 0) rect(x, y, 3 + (i % 3), 2, mix(fill, light, cold ? 0.22 : 0.1));
  }
  // The ware: in a row on the ground once the kiln is open.
  const pot = (x: number, broken: boolean, warm: boolean) => {
    const body = warm ? mix(wood, fire, 0.55) : mix(wood, light, 0.2), shade = mix(wood, ink, 0.25);
    [3, 5, 6, 6, 5, 3].forEach((w, r) => rect(x - (w >> 1), GY - 6 + r, w, 1, r > 3 ? shade : body));
    rect(x - 2, GY - 7, 4, 1, warm ? mix(fire, light, 0.4) : mix(wood, light, 0.4));
    if (broken) {
      rect(x, GY - 7, 3, 3, mix(wood, ink, 0.5));
      px(x - 1, GY - 3, joint); px(x, GY - 2, joint);
    }
  };
  const xs = [76, 84, 92, 100, 108];
  if (ending === "good") xs.forEach((x) => pot(x, false, (Math.floor(t / 300) + x) % 9 !== 0));
  if (ending === "out" || ending === "cheap" || ending === "keep") xs.forEach((x, i) => pot(x, i % 2 === 1, false));
  if (ending === "dump")
    [[80, 0], [86, 1], [90, 0], [96, 1], [83, 2], [93, 2]].forEach(([x, r]) => rect(x, GY - 2 - r, 4 - r, 2, r === 2 ? brick : mix(wood, light, 0.2)));
  const coat = mix(ink, wood, 0.4), skin = mix(wood, light, 0.4);
  if (ending === "cheap") {
    person(ctx, 66, GY + 4, 13, mix(fire, ink, 0.45), skin);
    for (let i = 0; i < 3; i++) if (t > 400 + i * 220) px(72 + i * 2, GY - 7, pal.accent);
  }
  // Home: a wall with a door, lit once the work is out.
  rect(120, GY - 22, 34, 22, mix(fill, wood, 0.35));
  rect(117, GY - 25, 40, 3, mix(wood, ink, 0.3));
  rect(128, GY - 16, 9, 16, opened ? mix(fire, light, ending === "keep" ? 0.3 : 0.1) : mix(ink, fill, 0.3));
  rect(144, GY - 14, 5, 4, opened || lit ? mix(fire, ink, 0.2) : mix(ink, fill, 0.3));
  if (lit) person(ctx, KX + 22, GY + 3, 13, coat, skin);
  else if (ending === "dump") person(ctx, 70, GY + 4, 13, coat, skin);
  else if (!cold) person(ctx, 116, GY + 4, 13, coat, skin);
  else person(ctx, KX - 30, GY + 4, 13, mix(ink, wood, 0.2), skin);
  fadeEdges(ctx, pal.ink);
}
