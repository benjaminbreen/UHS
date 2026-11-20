import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, flame, mix, pen, person, rgb, type Pal } from "../kit";

/** A street at night: one lit window, and a car with no number plates at the kerb.
 * The bag's moments move indoors, to the room where it is kept. */
export default function nightstreet(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), stone = rgb(pal.edge), light = rgb(pal.light), lamp = rgb(pal.accent);
  const skin = mix(stone, light, 0.4), you = mix(lamp, ink, 0.45), them = mix(fill, light, 0.25);
  if (ending === "bag" || ending === "kept" || ending === "burned" || ending === "returned") {
    room(ending);
    fadeEdges(ctx, pal.ink);
    return;
  }
  const GY = 48;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < 6) px(x, y, mix(ink, fill, 0.35 + (y / 6 + (b - 0.5) * 0.4 > 0.5 ? 0.15 : 0)));
      else if (y < GY) px(x, y, (y - 6) % 14 === 13 ? mix(fill, ink, 0.4) : mix(fill, stone, 0.18));
      else px(x, y, y === GY ? mix(stone, fill, 0.5) : y === GY + 4 ? mix(ink, fill, 0.6) : mix(ink, fill, y > GY + 4 ? 0.45 : 0.7));
    }
  // Three floors of windows; one is lit, the one the neighbours are all watching from behind.
  const lit = ending === "passed" || ending === "gone" ? -1 : 13;
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 8; col++) {
      const x = 8 + col * 19, y = 9 + row * 14, i = row * 8 + col;
      rect(x, y, 8, 9, i === lit ? mix(lamp, light, 0.3) : mix(ink, fill, 0.5));
      rect(x - 1, y + 9, 10, 1, mix(stone, fill, 0.35));
      if (i === lit) rect(x + 3, y + 3, 2, 6, mix(lamp, ink, 0.4));
    }
  // A doorway at street level; at the door moment it stands open, and two people talk in the light.
  const door = ending === "door";
  rect(24, 34, 12, GY - 34, door ? mix(lamp, light, 0.2) : mix(ink, stone, 0.3));
  rect(23, 33, 14, 1, mix(stone, fill, 0.5));
  if (door) {
    for (let y = GY + 1; y < GY + 10; y++)
      for (let x = 18 + (GY - y); x < 42 - (GY - y); x++) if (bayer(x, y) < 0.45 - (y - GY) * 0.04) px(x, y, mix(lamp, fill, 0.55));
    person(ctx, 27, GY, 14, you, skin);
    person(ctx, 39, GY + 3, 14, them, skin);
  }
  // The street lamp.
  rect(58, 18, 1, GY - 16, mix(stone, ink, 0.3));
  rect(56, 16, 5, 2, mix(stone, ink, 0.2));
  rect(57, 18, 3, 1, mix(lamp, light, 0.4));
  rect(55, 18, 7, 1, mix(lamp, fill, 0.5));
  for (let y = GY + 1; y < GY + 8; y++)
    for (let x = 44; x < 74; x++) {
      const d = Math.hypot((x - 58) / 14, (y - GY - 3) / 4.5);
      if (d < 0.7 || (d < 1 && bayer(x, y) < (1 - d) * 1.6)) px(x, y, mix(lamp, fill, 0.65));
    }
  // The car: square-built, dark, no plate where the plate should be, here until the morning.
  if (ending !== "passed" && ending !== "gone") {
    const cx = 86 + (ending === "door" ? Math.round(30 * ease(t / 2200)) : 0), cy = GY + 2;
    const body = mix(ink, fill, 0.55), roof = mix(ink, fill, 0.35), glass = mix(fill, light, 0.12);
    rect(cx, cy - 8, 42, 7, body);
    rect(cx + 1, cy - 9, 40, 1, mix(fill, light, 0.25));
    rect(cx, cy - 3, 42, 1, mix(stone, light, 0.3));
    rect(cx + 10, cy - 14, 22, 6, roof);
    rect(cx + 12, cy - 13, 8, 4, glass);
    rect(cx + 22, cy - 13, 8, 4, glass);
    rect(cx + 6, cy - 2, 7, 3, pal.ink);
    rect(cx + 29, cy - 2, 7, 3, pal.ink);
    rect(cx + 40, cy - 7, 2, 2, mix(lamp, ink, 0.5));
    rect(cx, cy - 6, 1, 3, mix(fill, ink, 0.3));
    // Where the plate should be, only the bracket.
    rect(cx + 1, cy - 4, 1, 1, mix(stone, fill, 0.3));
    rect(cx + 4, cy - 4, 1, 1, mix(stone, fill, 0.3));
  }
  fadeEdges(ctx, pal.ink);

  function room(at: string) {
    const FY = 46;
    for (let y = 0; y < EMBLEM_H; y++)
      for (let x = 0; x < EMBLEM_W; x++) {
        const b = bayer(x, y);
        const d = Math.hypot((x - 80) / 70, (y - 30) / 34);
        const warm = d < 0.5 ? 0.3 : d < 0.7 && (0.7 - d) / 0.2 > b ? 0.3 : 0.12;
        if (y < FY) px(x, y, mix(fill, lamp, warm));
        else px(x, y, (y - FY) % 4 === 3 ? mix(stone, ink, 0.55) : (x + Math.floor((y - FY) / 4) * 9) % 26 === 0 ? mix(stone, ink, 0.45) : mix(stone, ink, 0.25 - warm * 0.2));
      }
    rect(0, FY - 2, EMBLEM_W, 2, mix(stone, ink, 0.35));
    // The table lamp, and the shuttered window behind it.
    rect(96, 14, 22, 18, mix(ink, fill, 0.45));
    for (let y = 15; y < 32; y += 3) rect(97, y, 20, 1, mix(stone, fill, 0.35));
    rect(72, 34, 18, 2, mix(stone, light, 0.2));
    rect(74, 36, 2, FY - 36, mix(stone, ink, 0.3));
    rect(86, 36, 2, FY - 36, mix(stone, ink, 0.3));
    rect(79, 27, 6, 7, mix(lamp, light, 0.35));
    rect(81, 25, 2, 2, mix(stone, ink, 0.3));
    // The bag: canvas, a strap, the corner of a book showing.
    const bag = (x: number, y: number) => {
      rect(x, y - 7, 14, 7, mix(stone, light, 0.15));
      rect(x, y - 1, 14, 1, mix(stone, ink, 0.3));
      rect(x + 3, y - 10, 1, 3, mix(stone, ink, 0.2));
      rect(x + 10, y - 10, 1, 3, mix(stone, ink, 0.2));
      rect(x + 3, y - 10, 8, 1, mix(stone, ink, 0.2));
      rect(x + 9, y - 8, 4, 2, mix(light, lamp, 0.2));
    };
    if (at === "bag") {
      bag(50, FY + 4);
      person(ctx, 30, FY + 6, 16, you, skin);
    } else if (at === "kept") {
      // A floorboard lifted, the bag going into the dark under it.
      const k = ease((t - 200) / 1000);
      rect(46, FY + 6, 26, 5, pal.ink);
      rect(46, FY + 4 - Math.round(6 * (1 - k)), 26, 2, mix(stone, light, 0.1));
      if (k < 1) bag(52, FY + 4 + Math.round(6 * k));
      person(ctx, 30, FY + 6, 16, you, skin);
    } else if (at === "burned") {
      // The stove, its door open, pages going in a few at a time.
      rect(40, 24, 22, FY - 24, mix(ink, stone, 0.3));
      rect(46, 10, 4, 14, mix(ink, stone, 0.35));
      rect(44, 32, 14, 9, pal.ink);
      for (let y = 33; y < 41; y++)
        for (let x = 45; x < 57; x++) if (bayer(x, y) < 0.5 - Math.abs(x - 51) / 14 + (y - 33) / 20) px(x, y, mix(lamp, ink, 0.2));
      flame(ctx, 49, 35, Math.floor(t / 160) % 3);
      if (Math.floor(t / 700) % 2) rect(60, 30, 4, 3, mix(light, lamp, 0.2));
      person(ctx, 68, FY + 6, 16, you, skin);
    } else {
      // The neighbour at your door, taking the bag back.
      rect(14, 12, 20, FY - 12, mix(lamp, light, 0.15));
      person(ctx, 20, FY + 4, 16, them, skin);
      person(ctx, 40, FY + 6, 16, you, skin);
      bag(26 + Math.round(6 * (1 - ease(t / 1000))), FY - 4);
    }
  }
}
