import type { DeviceApp } from "../../content/devices";

/** What the player is pressing this tick: a direction, and whether the action button went down since the last one. */
export type Pad = { x: number; y: number; a: boolean };
export type Game = {
  width: number;
  height: number;
  /** Milliseconds between steps; read every step, so a game can speed up. */
  pace(): number;
  step(pad: Pad): void;
  draw(ctx: CanvasRenderingContext2D, ink: string, ghost: string): void;
  score(): number;
  over(): boolean;
};

function dice(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** A worm that grows as it eats and dies when it meets a wall or itself. */
function worm(seed: number): Game {
  const W = 21, H = 12, CELL = 4, rand = dice(seed);
  let body = [{ x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 }];
  let dir = { x: 1, y: 0 }, dead = false, eaten = 0;
  const place = () => {
    for (;;) {
      const p = { x: Math.floor(rand() * W), y: Math.floor(rand() * H) };
      if (!body.some((b) => b.x === p.x && b.y === p.y)) return p;
    }
  };
  let food = place();
  return {
    width: W * CELL + 2, height: H * CELL + 2,
    pace: () => Math.max(70, 170 - eaten * 5),
    step(pad) {
      if (dead) return;
      if ((pad.x || pad.y) && !(pad.x === -dir.x && pad.y === -dir.y) && !(pad.x && pad.y)) dir = { x: pad.x, y: pad.y };
      const head = { x: body[0].x + dir.x, y: body[0].y + dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= W || head.y >= H || body.some((b) => b.x === head.x && b.y === head.y)) return void (dead = true);
      body.unshift(head);
      if (head.x === food.x && head.y === food.y) eaten++, (food = place());
      else body.pop();
    },
    draw(ctx, ink) {
      ctx.fillStyle = ink;
      ctx.fillRect(0, 0, W * CELL + 2, 1), ctx.fillRect(0, H * CELL + 1, W * CELL + 2, 1);
      ctx.fillRect(0, 0, 1, H * CELL + 2), ctx.fillRect(W * CELL + 1, 0, 1, H * CELL + 2);
      for (const b of body) ctx.fillRect(1 + b.x * CELL, 1 + b.y * CELL, CELL - 1, CELL - 1);
      ctx.fillRect(2 + food.x * CELL, 1 + food.y * CELL, 1, 3), ctx.fillRect(1 + food.x * CELL, 2 + food.y * CELL, 3, 1);
    },
    score: () => eaten,
    over: () => dead,
  };
}

/** A one-game liquid-crystal toy: every figure is printed on the glass and only blinks on or off.
 * A porter under four windows catches what is dropped; three on the ground ends it. */
function catcher(seed: number): Game {
  const LANES = 4, ROWS = 4, rand = dice(seed);
  let at = 1, caught = 0, missed = 0, tick = 0;
  let drops: { lane: number; row: number }[] = [];
  const laneX = (lane: number) => 14 + lane * 22;
  const parcel = (ctx: CanvasRenderingContext2D, lane: number, row: number) => {
    const x = laneX(lane), y = 8 + row * 9;
    ctx.fillRect(x, y + 1, 5, 4), ctx.fillRect(x + 2, y, 1, 6);
  };
  const porter = (ctx: CanvasRenderingContext2D, lane: number) => {
    const x = laneX(lane) - 2;
    ctx.fillRect(x, 44, 9, 2), ctx.fillRect(x, 42, 1, 2), ctx.fillRect(x + 8, 42, 1, 2);
    ctx.fillRect(x + 3, 47, 3, 3), ctx.fillRect(x + 2, 50, 5, 4), ctx.fillRect(x + 2, 54, 2, 2), ctx.fillRect(x + 5, 54, 2, 2);
  };
  return {
    width: 96, height: 58,
    pace: () => Math.max(160, 420 - caught * 8),
    step(pad) {
      if (missed >= 3) return;
      at = Math.max(0, Math.min(LANES - 1, at + Math.sign(pad.x)));
      if (++tick % 2) return;
      for (const d of drops) d.row++;
      for (const d of drops.filter((d) => d.row >= ROWS)) d.lane === at ? caught++ : missed++;
      drops = drops.filter((d) => d.row < ROWS);
      if (rand() < 0.55 && !drops.some((d) => d.row === 0)) drops.push({ lane: Math.floor(rand() * LANES), row: 0 });
    },
    draw(ctx, ink, ghost) {
      ctx.fillStyle = ghost;
      for (let lane = 0; lane < LANES; lane++) {
        for (let row = 0; row < ROWS; row++) parcel(ctx, lane, row);
        porter(ctx, lane);
      }
      for (let i = 0; i < 3; i++) ctx.fillRect(78 + i * 5, 2, 3, 3);
      ctx.fillStyle = ink;
      for (let lane = 0; lane < LANES; lane++) ctx.fillRect(laneX(lane) - 3, 5, 11, 1);
      ctx.fillRect(0, 56, 96, 1);
      for (const d of drops) parcel(ctx, d.lane, d.row);
      porter(ctx, at);
      for (let i = 0; i < missed; i++) ctx.fillRect(78 + i * 5, 2, 3, 3);
    },
    score: () => caught,
    over: () => missed >= 3,
  };
}

/** A cat on the rooftops: jump the chimneys for as long as you can. */
function runner(seed: number): Game {
  const rand = dice(seed), GROUND = 46;
  let y = 0, vy = 0, far = 0, dead = false, gap = 40;
  let stacks: { x: number; h: number }[] = [];
  return {
    width: 96, height: 58,
    pace: () => 40,
    step(pad) {
      if (dead) return;
      const speed = 2 + Math.min(2, far / 600);
      if ((pad.a || pad.y < 0) && y === 0) vy = 6.2;
      y = Math.max(0, y + vy);
      vy = y > 0 ? vy - 0.7 : 0;
      far += speed;
      for (const s of stacks) s.x -= speed;
      stacks = stacks.filter((s) => s.x > -8);
      if ((gap -= speed) <= 0) stacks.push({ x: 100, h: 6 + Math.floor(rand() * 8) }), (gap = 44 + rand() * 50);
      dead = stacks.some((s) => s.x < 22 && s.x + 5 > 13 && y < s.h - 1);
    },
    draw(ctx, ink) {
      ctx.fillStyle = ink;
      ctx.fillRect(0, GROUND, 96, 1);
      for (let x = -(Math.floor(far) % 12); x < 96; x += 12) ctx.fillRect(x, GROUND + 3, 6, 1);
      for (const s of stacks) ctx.fillRect(Math.round(s.x), GROUND - s.h, 5, s.h), ctx.fillRect(Math.round(s.x) - 1, GROUND - s.h, 7, 2);
      const top = GROUND - 7 - Math.round(y), stride = y === 0 && Math.floor(far / 6) % 2;
      ctx.fillRect(13, top + 2, 8, 3), ctx.fillRect(19, top, 4, 4), ctx.fillRect(19, top - 1, 1, 1), ctx.fillRect(22, top - 1, 1, 1);
      ctx.fillRect(11, top, 1, 3), ctx.fillRect(12, top + 2, 1, 1);
      ctx.fillRect(stride ? 13 : 14, top + 5, 1, 2), ctx.fillRect(stride ? 20 : 19, top + 5, 1, 2);
    },
    score: () => Math.floor(far / 10),
    over: () => dead,
  };
}

export const games: Partial<Record<DeviceApp, (seed: number) => Game>> = { worm, catch: catcher, runner };
