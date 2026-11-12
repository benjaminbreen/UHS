import { bayer, mix, rgb, type RGB } from "./emblems/kit";

export const SETTLE_W = 160;
export const SETTLE_H = 96;

export type SettleLook = { skin: string; hair: string; cloth: string; wrap: string; head?: string };
export type SettleFrame = {
  /** 0 breathed out to 1 breathed in. */
  breath: number;
  /** -1 rocked forward to 1 rocked back. */
  sway: number;
  /** 0 wide awake to 1 asleep. */
  calm: number;
  /** 0-1, fading: the baby has just been jarred. */
  stir: number;
  time: number;
};

const STARS = [[18, 24], [30, 31], [23, 40], [33, 22], [27, 51], [17, 35], [34, 44]];

/** Night, a low fire, and the two of them on the mat. Everything that tells
 * the player how it is going is in the picture: the wrap rising and falling,
 * the eyes closing, the room warming, the stars coming out in the doorway. */
export function drawSettle(ctx: CanvasRenderingContext2D, look: SettleLook, s: SettleFrame) {
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const ink: RGB = [22, 18, 32], night: RGB = [20, 26, 52], ember: RGB = [232, 133, 58], gold: RGB = [248, 220, 122];
  const skin = rgb(look.skin), hair = rgb(look.hair), cloth = rgb(look.cloth), wrap = rgb(look.wrap);
  const warm = 0.25 + s.calm * 0.5;
  const tone = (c: RGB, lit: number) => {
    const k = Math.max(0, 0.62 - lit * 0.5);
    return mix(c.map((v, i) => v + (ink[i] - v) * k) as RGB, ember, Math.min(1, lit) * warm * 0.35);
  };

  // The room, lit from the fire: three bands of light, dithered at the rims.
  const fx = 136, fy = 74, reach = 68 + s.breath * 9 + s.calm * 16;
  const wall: RGB = [46, 38, 56], floor: RGB = [64, 50, 54];
  for (let y = 0; y < SETTLE_H; y++)
    for (let x = 0; x < SETTLE_W; x++) {
      const d = Math.hypot(x - fx, (y - fy) * 1.5) / reach, b = bayer(x, y);
      const step = Math.max(0, 1 - d / 1.5) * 4, lit = Math.min(1, (Math.floor(step) + (step % 1 > b ? 1 : 0)) / 3);
      rect(x, y, 1, 1, tone(y < 70 ? wall : floor, lit));
    }

  // The doorway, and the stars that come out as the baby goes under.
  rect(10, 14, 30, 56, mix(ink, [70, 52, 44], 0.5));
  rect(13, 17, 24, 53, mix(night, ink, 0.2));
  STARS.forEach(([x, y], i) => {
    if (s.calm * STARS.length > i) rect(x, y, 1, 1, mix(gold, [255, 255, 255], (Math.sin(s.time / 400 + i * 2) + 1) / 4));
  });
  rect(13, 62, 24, 8, mix(night, ink, 0.55));

  // The fire: a bed of embers and two tongues.
  const f = Math.floor(s.time / 140) % 3;
  rect(126, 76, 22, 3, mix(ink, ember, 0.35));
  for (let i = 0; i < 7; i++) rect(127 + i * 3, 76 + ((i + f) % 2), 2, 1, mix(ember, gold, ((i * 5 + f) % 3) / 3));
  rect(133 + (f === 1 ? 1 : 0), 69 - (f === 2 ? 1 : 0), 4, 7 + (f === 2 ? 1 : 0), mix(ember, ink, 0.05));
  rect(134 + (f === 1 ? 1 : 0), 71, 2, 5, mix(gold, ember, 0.2));
  rect(140 - (f === 2 ? 1 : 0), 72, 3, 4, mix(ember, ink, 0.1));

  // The mat.
  rect(44, 84, 78, 4, tone([150, 120, 72], 0.7));
  for (let x = 46; x < 120; x += 4) rect(x, 85, 1, 2, tone([110, 84, 50], 0.6));

  // The two of them rock about the hips.
  const lean = s.sway * 3;
  const at = (y: number) => Math.round(lean * Math.max(0, (82 - y) / 50));
  const lit = (c: RGB, k = 1) => tone(c, k);
  const row = (x: number, y: number, w: number, c: string) => rect(x + at(y), y, w, 1, c);
  const block = (x: number, y: number, w: number, h: number, c: RGB, shade = 4) => {
    for (let r = 0; r < h; r++) {
      row(x, y + r, w, lit(c, 0.55));
      row(x + shade, y + r, w - shade, lit(c, 1));
    }
  };
  // Lap and crossed legs.
  for (let r = 0; r < 12; r++) {
    const w = 46 + Math.min(r, 4) * 2;
    rect(80 - w / 2, 72 + r, w, 1, lit(cloth, 0.5));
    rect(84 - w / 2 + 6, 72 + r, w - 8, 1, lit(cloth, r > 9 ? 0.6 : 0.95));
  }
  rect(98, 81, 9, 3, lit(skin, 0.9));
  // Back and shoulders, rounded over the baby.
  for (let r = 0; r < 30; r++) {
    const y = 43 + r, w = r < 4 ? 16 + r * 3 : 28, x = 80 - w / 2 - (r < 4 ? 0 : 1);
    row(x, y, w, lit(cloth, 0.5));
    row(x + 6, y, w - 6, lit(cloth, 1));
  }
  // Head, bent to look down; hair or a headcloth over it.
  const hx = 74, hy = 24;
  block(hx + 3, hy + 15, 8, 5, skin, 3);
  for (let r = 0; r < 17; r++) {
    const inset = r < 2 ? 3 - r : r > 14 ? r - 14 : 0;
    row(hx + inset, hy + r, 17 - inset * 2, lit(skin, 0.6));
    row(hx + inset + 5, hy + r, 12 - inset * 2, lit(skin, 1.05));
  }
  const top = look.head ? rgb(look.head) : hair;
  for (let r = 0; r < 8; r++) {
    const inset = r < 2 ? 2 - r : 0;
    row(hx - 2 + inset, hy - 2 + r, (r < 6 ? 21 : 11) - inset * 2, lit(top, 0.55));
    row(hx + 4, hy - 2 + r, (r < 6 ? 15 : 5) - inset, lit(top, 1));
  }
  for (let r = 0; r < 10; r++) row(hx - 2, hy + 6 + r, r < 6 ? 5 : 4, lit(look.head ? hair : top, 0.5));
  // Her face: eyes lowered, a small smile once the baby is nearly asleep.
  row(hx + 10, hy + 9, 4, mix(ink, skin, 0.15));
  row(hx + 13, hy + 10, 1, mix(ink, skin, 0.15));
  row(hx + 15, hy + 11, 2, lit(skin, 0.75));
  row(hx + 11, hy + 14, 3, mix([150, 60, 70], skin, 0.35));
  if (s.calm > 0.7) row(hx + 14, hy + 13, 1, mix([150, 60, 70], skin, 0.35));

  // The baby across her arms: the wrap swells with each breath.
  const rise = Math.round(s.breath * 3), jar = s.stir > 0.05 ? Math.round(Math.sin(s.time / 45) * s.stir * 2) : 0;
  const bx = 84, by = 58 - rise;
  for (let r = 0; r < 12 + rise; r++) {
    const y = by + r, k = r / (11 + rise), inset = Math.round(Math.abs(k - 0.5) ** 2 * 14);
    row(bx + inset, y, 28 - inset * 2, lit(wrap, 0.6));
    row(bx + inset + 3, y, 22 - inset * 2, lit(wrap, k < 0.35 ? 1.1 : 0.9));
    if (r % 3 === 1 && r > 1) row(bx + inset + 5, y, 16 - inset * 2, lit(wrap, 0.7));
  }
  // Its head in the crook of her arm, turned up to her.
  const cx = 104 + jar, cy = 51 - rise;
  for (let r = 0; r < 9; r++) {
    const inset = r === 0 || r === 8 ? 2 : r === 1 || r === 7 ? 1 : 0;
    row(cx + inset, cy + r, 10 - inset * 2, lit(skin, 0.7));
    row(cx + inset + 2, cy + r, 8 - inset * 2, lit(skin, 1.1));
  }
  row(cx + 2, cy, 6, lit(hair, 0.9));
  row(cx + 1, cy + 1, 8, lit(hair, 0.9));
  const eye = mix(ink, skin, 0.1);
  if (s.stir > 0.3) {
    row(cx + 2, cy + 4, 2, eye); row(cx + 6, cy + 4, 2, eye);
    row(cx + 4, cy + 6, 2, mix([120, 30, 40], ink, 0.3));
  } else if (s.calm < 0.4) {
    rect(cx + 2 + at(cy + 3), cy + 3, 2, 2, eye); rect(cx + 6 + at(cy + 3), cy + 3, 2, 2, eye);
    row(cx + 3, cy + 3, 1, "#fff8e8"); row(cx + 7, cy + 3, 1, "#fff8e8");
  } else if (s.calm < 0.75) {
    row(cx + 2, cy + 4, 2, eye); row(cx + 6, cy + 4, 2, eye);
    row(cx + 2, cy + 3, 2, lit(skin, 0.7)); row(cx + 6, cy + 3, 2, lit(skin, 0.7));
  } else {
    row(cx + 2, cy + 4, 2, mix(ink, skin, 0.35)); row(cx + 6, cy + 4, 2, mix(ink, skin, 0.35));
  }
  if (s.stir <= 0.3) row(cx + 4, cy + 6, 2, mix([170, 80, 80], skin, 0.4));
  // A fist out of the wrap, flung up when jarred.
  rect(cx - 4 + at(by), by + 2 - (s.stir > 0.3 ? 5 : 0) + jar, 3, 3, lit(skin, 1));
  // Her arms round it.
  for (let i = 0; i < 26; i++) {
    const k = i / 25, x = 70 + k * 42, y = 62 + Math.sin(k * Math.PI) * 7 + (k > 0.8 ? (k - 0.8) * -30 : 0);
    rect(x + at(y), y, 3, 4, lit(i < 9 ? cloth : skin, i < 9 ? 0.75 : 0.95));
  }
  // Breathed out: a faint curl of breath, and a z once it is done.
  if (s.calm >= 1) {
    const t = (s.time / 2200) % 1;
    ctx.globalAlpha = 1 - t;
    const zx = cx + 12 + t * 6, zy = cy - 4 - t * 10;
    rect(zx, zy, 4, 1, "#f0e6cf"); rect(zx + 2, zy + 1, 1, 1, "#f0e6cf"); rect(zx + 1, zy + 2, 1, 1, "#f0e6cf"); rect(zx, zy + 3, 4, 1, "#f0e6cf");
    ctx.globalAlpha = 1;
  }
}
