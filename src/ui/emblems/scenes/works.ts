import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, flame, hash, mix, pen, person, rgb, type Pal } from "../kit";

const COLD = ["signed", "moved", "absent", "passed", "fought", "gate", "confront", "held", "broken", "stood", "stayed"];
const PICKET = ["gate", "confront", "held", "broken", "stood", "stayed"];

/** The works gate: sawtooth sheds and chimneys behind a brick wall, where notices go up and pickets stand. */
export default function works(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), brick = rgb(pal.edge), light = rgb(pal.light), lamp = rgb(pal.accent);
  const ROAD = 52, WALL = 36, gx = 84, gw = 30;
  const open = ending === "broken" || ending === "stood" || ending === "confront" || ending === "crossed" || ending === "scab";
  const sky = [mix(fill, light, 0.22), mix(fill, light, 0.34), mix(fill, light, 0.46)];
  const roof = (x: number) => 15 + Math.floor((x % 14) / 2);
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y >= ROAD) px(x, y, y === ROAD ? mix(brick, ink, 0.55) : (x * 3 + y * 7) % 23 === 0 ? mix(fill, ink, 0.45) : mix(fill, ink, 0.25));
      else if (y >= WALL) px(x, y, (y - WALL) % 4 === 3 || (x + (Math.floor((y - WALL) / 4) % 2) * 4) % 8 === 0 ? mix(brick, ink, 0.45) : mix(brick, light, 0.06));
      else if (x > 10 && x < 150 && y >= roof(x) && y < WALL) {
        // The sheds: the glazed north face of each tooth, then brick with a row of windows.
        const glazed = x % 14 === 13 || x % 14 === 0;
        const win = y >= 26 && y < 32 && x % 8 > 2 && x % 8 < 6;
        px(x, y, glazed ? mix(fill, light, 0.5) : win ? mix(ink, fill, 0.5) : y === roof(x) ? mix(brick, ink, 0.2) : mix(brick, fill, 0.45));
      } else px(x, y, sky[y / 16 + (b - 0.5) * 0.35 < 0.5 ? 0 : y / 16 + (b - 0.5) * 0.35 < 1 ? 1 : 2]);
    }
  // Two stacks, smoking while the works runs.
  const cold = COLD.includes(ending ?? "") && ending !== "crossed";
  for (const cx of [34, 52]) {
    rect(cx, 7, 5, 10, mix(brick, ink, 0.25));
    rect(cx - 1, 7, 7, 2, mix(brick, light, 0.15));
    rect(cx + 4, 9, 1, 8, mix(brick, ink, 0.45));
    if (cold && ending !== "scab") continue;
    for (let i = 0; i < 6; i++) {
      const p = (t / 2400 + i / 6 + hash(cx + i) * 0.1) % 1;
      const ox = cx + 2 + Math.round(p * 34), oy = 5 - Math.round(p * 3), r = 1.5 + p * 3;
      for (let y = Math.floor(oy - r); y <= oy + r; y++)
        for (let x = Math.floor(ox - r); x <= ox + r; x++)
          if (y >= 0 && Math.hypot(x - ox, (y - oy) * 1.4) < r && bayer(x, y) > p * 0.9) px(x, y, mix(fill, light, 0.62 - p * 0.2));
    }
  }
  // The gate posts with their lamps, and the yard seen through the gate.
  rect(gx - 4, WALL - 8, 4, ROAD - WALL + 8, mix(brick, light, 0.12));
  rect(gx + gw, WALL - 8, 4, ROAD - WALL + 8, mix(brick, light, 0.12));
  rect(gx - 3, WALL - 11, 2, 3, pal.accent);
  rect(gx + gw + 1, WALL - 11, 2, 3, pal.accent);
  rect(gx, WALL - 2, gw, ROAD - WALL + 2, mix(fill, brick, 0.3));
  rect(gx, ROAD - 4, gw, 4, mix(fill, ink, 0.15));
  const bars = (x0: number, w: number) => {
    for (let x = x0; x < x0 + w; x += 3) rect(x, WALL - 4, 1, ROAD - WALL + 4, mix(ink, brick, 0.25));
    rect(x0, WALL - 1, w, 1, mix(ink, brick, 0.25));
    rect(x0, WALL + 9, w, 1, mix(ink, brick, 0.25));
  };
  if (open) {
    bars(gx - 1, 5);
    bars(gx + gw - 4, 5);
  } else {
    bars(gx, gw);
    // The notice on the gate.
    if (!PICKET.includes(ending ?? "") && ending !== "fought") {
      rect(gx + 11, WALL + 2, 8, 10, mix(light, lamp, 0.15));
      for (let y = WALL + 4; y < WALL + 11; y += 2) rect(gx + 12, y, 6, 1, mix(ink, light, 0.55));
    }
  }
  const body = mix(ink, fill, 0.5), head = mix(light, brick, 0.42), you = mix(lamp, ink, 0.35), police = mix(ink, fill, 0.15);
  const FOOT = 61;
  const crowd = (xs: number[], c = body) => xs.forEach((x, i) => person(ctx, x, FOOT - (i % 2), 14, c, head));
  const placard = (x: number, y: number) => {
    rect(x + 2, y + 6, 1, 6, mix(brick, light, 0.3));
    rect(x - 1, y, 7, 6, mix(light, lamp, 0.1));
    rect(x, y + 2, 5, 1, pal.accent);
  };
  const brazier = (x: number) => {
    rect(x, FOOT - 7, 6, 5, mix(ink, brick, 0.3));
    for (let i = 0; i < 3; i++) rect(x + 1 + i * 2, FOOT - 6, 1, 1, pal.accent);
    rect(x + 1, FOOT - 2, 1, 2, mix(ink, brick, 0.3));
    rect(x + 4, FOOT - 2, 1, 2, mix(ink, brick, 0.3));
    flame(ctx, x + 1, FOOT - 12, Math.floor(t / 160) % 3);
  };
  const vehicle = (x: number) => {
    rect(x, 40, 26, 14, mix(light, fill, 0.45));
    rect(x, 52, 26, 2, mix(ink, fill, 0.3));
    for (let w = x + 2; w < x + 24; w += 6) rect(w, 42, 4, 5, mix(fill, ink, 0.2));
    rect(x + 3, 53, 4, 3, mix(ink, fill, 0.1));
    rect(x + 19, 53, 4, 3, mix(ink, fill, 0.1));
  };
  const k = ease(t / 1600);
  switch (ending) {
    case undefined: case "notice": case "word": case "call":
      crowd([66, 74, 120, 128, 136]);
      person(ctx, 94, FOOT - 3, 13, body, head);
      person(ctx, 46, FOOT, 15, you, head);
      break;
    case "fought": {
      crowd([40, 48, 56, 70, 78, 86, 94, 102, 110, 120]);
      // The banner held up over the crowd.
      rect(54, 34, 1, 14, mix(brick, light, 0.3));
      rect(96, 34, 1, 14, mix(brick, light, 0.3));
      rect(55, 34, 41, 7, pal.accent);
      for (let x = 58; x < 93; x += 4) rect(x, 37, 2, 1, mix(lamp, light, 0.6));
      person(ctx, 62, FOOT + 1, 15, you, head);
      break;
    }
    case "signed": person(ctx, Math.round(70 - 40 * k), FOOT, 15, you, head); break;
    case "moved": {
      const x = Math.round(118 + 26 * k);
      person(ctx, x, FOOT, 15, you, head);
      rect(x + 6, FOOT - 7, 5, 4, mix(brick, ink, 0.1));
      rect(x + 7, FOOT - 8, 3, 1, mix(brick, ink, 0.3));
      break;
    }
    case "gate": case "held": case "stayed":
      brazier(gx + 4);
      crowd(ending === "stayed" ? [gx - 8, gx + 14] : [gx - 16, gx - 8, gx + 14, gx + 22, gx + 30]);
      if (ending !== "stayed") {
        placard(gx - 15, 36);
        placard(gx + 23, 35);
        person(ctx, gx - 24, FOOT + 1, 15, you, head);
      }
      if (ending === "held") placard(gx - 23, 34);
      break;
    case "confront": case "broken": case "stood": {
      const into = ending === "confront" ? 0 : k;
      vehicle(gx + 2 - Math.round(into * 6));
      crowd(ending === "confront" ? [gx - 18, gx - 10, gx + 34, gx + 42] : [gx - 30, gx - 22, gx + 40, gx + 48]);
      for (const x of [gx - 2, gx + 6, gx + 14, gx + 22]) {
        person(ctx, x, FOOT + 1, 15, police, head);
        rect(x + 1, FOOT - 16, 3, 1, police);
      }
      if (ending === "broken") person(ctx, gx - 34, FOOT + 2, 10, you, head);
      else person(ctx, ending === "confront" ? gx - 26 : gx - 40, FOOT + 1, 15, you, head);
      break;
    }
    case "crossed": case "scab":
      person(ctx, gx + 13, ROAD - 1, 12, you, head);
      crowd([gx - 18, gx - 10, gx + 36, gx + 44]);
      placard(gx - 9, 36);
      break;
    default: break;
  }
  fadeEdges(ctx, pal.ink);
}
