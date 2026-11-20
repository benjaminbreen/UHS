import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

const DOOR = 96, GROUND = 50;

/** A front door with an official paper pinned to it: an eviction, a sale, a call-up. */
export default function notice(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), accent = rgb(pal.accent), lamp = rgb("#f0c878");
  const night = ending === "fled" || ending === "alone" || ending === "evicted";
  const out = ending === "evicted" || ending === "alone";
  const lit = ending === "delayed" || ending === "deferred" || ending === "sent" || ending === "sendoff" || ending === "organised";
  const open = ending === "sent" || ending === "sendoff";
  // A call-up comes by post: the letter is in hand, not on the door.
  const letter = ["papers", "board", "passed", "missed", "fled"].includes(ending ?? "");
  const papered = !(ending === "delayed" || ending === "deferred" || open || letter);

  // Sky above the eaves, then clapboard, then the pavement.
  const sky = night ? [mix(ink, fill, 0.35), mix(ink, fill, 0.55)] : [mix(fill, light, 0.35), mix(fill, light, 0.5)];
  const board = mix(fill, light, night ? 0.06 : 0.2), seam = mix(fill, ink, 0.3);
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      if (y < 8) px(x, y, sky[y / 8 + (bayer(x, y) - 0.5) * 0.4 < 0.5 ? 0 : 1]);
      else if (y < 10) px(x, y, mix(wood, ink, 0.45));
      else if (y < GROUND) px(x, y, (y - 10) % 5 === 4 ? seam : board);
      else if (y < 53) px(x, y, mix(wood, light, y === GROUND ? 0.3 : 0.12));
      else px(x, y, (x + (y > 58 ? 7 : 0)) % 22 === 0 ? mix(fill, ink, 0.3) : mix(fill, wood, 0.3));
    }

  // The window, warm when someone is home with good news.
  const wx = 58, wy = 22;
  rect(wx - 1, wy - 1, 20, 15, mix(wood, light, 0.3));
  for (let y = 0; y < 13; y++)
    for (let x = 0; x < 18; x++) {
      const pane = lit ? (bayer(x, y) < 0.7 ? mix(lamp, light, 0.35) : mix(lamp, wood, 0.2)) : mix(ink, fill, 0.45 + (y < 4 && x > 10 ? 0.15 : 0));
      px(wx + x, wy + y, x === 8 || x === 9 || y === 6 ? mix(wood, light, 0.3) : pane);
    }
  rect(wx - 2, wy + 14, 22, 2, mix(wood, light, 0.2));

  // The door in its frame, ajar onto lamplight at a send-off.
  rect(DOOR - 2, 18, 20, 32, mix(wood, light, 0.3));
  rect(DOOR, 20, 16, 30, mix(wood, ink, 0.15));
  if (open) {
    rect(DOOR, 20, 11, 30, mix(lamp, light, 0.3));
    rect(DOOR + 11, 20, 5, 30, mix(wood, ink, 0.3));
  } else {
    rect(DOOR + 2, 23, 5, 9, mix(wood, ink, 0.35));
    rect(DOOR + 9, 23, 5, 9, mix(wood, ink, 0.35));
    rect(DOOR + 2, 36, 5, 11, mix(wood, ink, 0.35));
    rect(DOOR + 9, 36, 5, 11, mix(wood, ink, 0.35));
    rect(DOOR + 13, 34, 2, 2, mix(accent, light, 0.3));
  }
  // The paper itself, a red stamp in its corner, flapping a little.
  if (papered) {
    const lift = Math.floor(t / 500) % 4 === 1 ? 1 : 0;
    rect(DOOR + 4, 25, 9, 11 - lift, mix(light, wood, 0.05));
    rect(DOOR + 4, 36 - lift, 9, 1, mix(light, ink, 0.3));
    for (let y = 27; y < 34; y += 2) rect(DOOR + 5, y, y === 27 ? 7 : 5, 1, mix(ink, light, 0.45));
    rect(DOOR + 10, 31, 2, 2, ending === "again" || ending === "board" ? mix(accent, ink, 0.1) : mix(accent, light, 0.15));
  }
  rect(DOOR - 3, GROUND, 22, 2, mix(wood, light, 0.35));
  // The lamp by the door, the plant in its pot, the mailbox.
  rect(DOOR + 19, 24, 3, 4, night ? mix(lamp, light, 0.2) : mix(wood, light, 0.4));
  rect(DOOR + 20, 22, 1, 2, mix(wood, ink, 0.3));
  rect(44, 44, 6, 6, mix(wood, ink, 0.1));
  rect(45, 43, 4, 1, mix(wood, light, 0.25));
  for (let i = 0; i < 5; i++) rect(43 + i * 2, 38 + (i % 2) * 2, 2, 6 - (i % 2) * 2, mix(fill, rgb("#6a8a4a"), 0.7));
  rect(DOOR + 24, 30, 6, 4, mix(fill, ink, 0.4));
  rect(DOOR + 26, 34, 2, 16, mix(fill, ink, 0.4));


  const body = mix(ink, fill, 0.5), head = mix(light, wood, 0.4), you = mix(accent, ink, 0.45), uniform = mix(ink, wood, 0.25);
  const walk = ease(t / 1800);
  const crowd = (xs: number[]) => xs.forEach((x, i) => person(ctx, x, GROUND + 7 + (i % 3), 14 + (i % 2), body, head));
  const bag = (x: number, foot: number) => rect(x, foot - 8, 4, 4, mix(wood, light, 0.25));
  // Furniture out on the pavement: a bed end, a table, a chair.
  const furniture = () => {
    const f = mix(wood, light, 0.15), dark = mix(wood, ink, 0.35);
    rect(20, 46, 2, 14, f);
    rect(20, 52, 18, 3, mix(light, fill, 0.35));
    rect(36, 49, 2, 11, f);
    rect(44, 50, 12, 2, f);
    rect(45, 52, 1, 8, dark);
    rect(54, 52, 1, 8, dark);
    rect(126, 48, 1, 12, f);
    rect(126, 53, 6, 2, f);
    rect(131, 55, 1, 5, dark);
  };

  if (!ending || ending === "notice" || ending === "papers") {
    person(ctx, DOOR - 12, GROUND + 8, 16, you, head);
    person(ctx, 126, GROUND + 10, 14, body, head);
  } else if (ending === "again" || ending === "board" || ending === "remind") {
    person(ctx, DOOR - 12, GROUND + 8, 16, you, head);
    person(ctx, DOOR - 22, GROUND + 9, 15, body, head);
  } else if (ending === "organised" || ending === "blocked") {
    crowd(ending === "blocked" ? [62, 70, 78, 86, 100, 108] : [66, 74, 82, 90, 100, 108, 116, 124]);
    person(ctx, DOOR + 4, GROUND + 6, 16, you, head);
    if (ending === "blocked") person(ctx, Math.round(118 + 16 * walk), GROUND + 10, 14, uniform, mix(light, ink, 0.2));
  } else if (out) {
    furniture();
    if (ending === "evicted") {
      rect(DOOR - 6, 54, 9, 2, mix(wood, light, 0.15));
      person(ctx, DOOR - 5, GROUND + 4, 10, you, head);
    } else person(ctx, 72, GROUND + 8, 16, you, head);
  } else if (ending === "moved") {
    const x = Math.round(118 + 10 * walk);
    rect(x, 44, 16, 8, mix(wood, ink, 0.2));
    rect(x + 16, 40, 7, 12, mix(accent, ink, 0.35));
    rect(x + 18, 42, 4, 4, mix(fill, light, 0.4));
    rect(x + 1, 38, 8, 6, mix(light, fill, 0.3));
    rect(x + 9, 40, 6, 4, mix(wood, light, 0.25));
    rect(x + 3, 52, 4, 4, mix(ink, fill, 0.3));
    rect(x + 15, 52, 4, 4, mix(ink, fill, 0.3));
    person(ctx, x - 8, GROUND + 8, 16, you, head);
  } else if (ending === "delayed" || ending === "deferred") {
    person(ctx, DOOR - 12, GROUND + 8, 16, you, head);
    person(ctx, DOOR - 20, GROUND + 9, 15, body, head);
  } else if (ending === "sent" || ending === "sendoff") {
    crowd([70, 78, 86, 118, 126]);
    person(ctx, DOOR + 3, GROUND + 6, 16, you, head);
    const x = ending === "sent" ? Math.round(104 + 30 * walk) : 108;
    person(ctx, x, GROUND + 9, 16, uniform, head);
    bag(x + 5, GROUND + 9);
  } else if (ending === "missed" || ending === "passed") {
    const x = Math.round(118 + 18 * walk), h = ending === "missed" ? 10 : 15;
    person(ctx, x, GROUND + 4 + (h > 10 ? 4 : 0), h, uniform, head);
    if (ending === "passed") person(ctx, DOOR - 12, GROUND + 8, 16, you, head);
  } else if (ending === "fled") {
    const x = Math.round(52 - 20 * walk);
    person(ctx, x, GROUND + 9, 15, mix(ink, fill, 0.3), mix(light, wood, 0.55));
    bag(x - 3, GROUND + 9);
    person(ctx, DOOR - 6, GROUND + 6, 16, you, head);
  }
  if (letter && ending !== "missed" && ending !== "fled") rect(DOOR - 7, GROUND - 5, 3, 4, mix(light, wood, 0.05));
  fadeEdges(ctx, pal.ink);
}
