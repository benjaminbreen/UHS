import type { Side } from "../../core/games/knucklebones";
import { cellOf, type UrSide } from "../../core/games/ur";

const INK = "#2a1d14";
const BONE = { hi: "#fbf2dc", base: "#e6d5b0", shade: "#bb9f74", dark: "#7e6040" };

export const BONE_W = 18;
export const BONE_H = 12;
const bones = new Map<Side, HTMLCanvasElement>();

/** A sheep's astragalus seen lying on one of its four sides. */
export function boneCanvas(side: Side): HTMLCanvasElement {
  const hit = bones.get(side);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = BONE_W;
  c.height = BONE_H;
  const ctx = c.getContext("2d")!;
  const broad = side === 3 || side === 4;
  const rx = 8.4;
  const half = (dx: number) => (broad ? 5.2 : 3.4) * (1 - (broad ? 0.22 : 0.14) * Math.exp(-(dx * dx) / 8));
  const inside = (x: number, y: number) => {
    const dx = x - (BONE_W - 1) / 2;
    const dy = y - (BONE_H - 1) / 2;
    return (dx / rx) ** 2 + (dy / half(dx)) ** 2 <= 1;
  };
  for (let y = 0; y < BONE_H; y++)
    for (let x = 0; x < BONE_W; x++) {
      if (!inside(x, y)) continue;
      const dx = x - (BONE_W - 1) / 2;
      const dy = y - (BONE_H - 1) / 2;
      const ry = half(dx);
      let color = dy < -ry * 0.4 && dx < 3 ? BONE.hi : dy > ry * 0.35 ? BONE.shade : BONE.base;
      if (side === 3 && Math.abs(dx) < 1.5 && Math.abs(dy + 0.5) < 1.2) color = BONE.hi;
      if (side === 4 && (dx / 3.4) ** 2 + (dy / 1.8) ** 2 <= 1) color = (dx / 2) ** 2 + (dy / 1) ** 2 <= 1 ? BONE.dark : BONE.shade;
      if (side === 6 && Math.abs(dx) < 5 && Math.abs(dy - dx * 0.4) < 0.7) color = BONE.dark;
      if (side === 1 && dx > 4.5 && Math.abs(dy) < 0.8) color = INK;
      if (side === 1 && dx < -2 && dx > -5 && Math.abs(dy) < 0.6) color = BONE.shade;
      if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) color = INK;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  bones.set(side, c);
  return c;
}

const C = 16;
const F = 3;
export const BOARD_W = 8 * C + F * 2;
export const BOARD_H = 3 * C + F * 2;
const SHELL = "#e8dec4";
const SHELL_SHADE = "#c9bc9b";
const LAPIS = "#2d4f9a";
const LAPIS_HI = "#5677c4";
const RED = "#b0452f";
const BITUMEN = "#1d1612";

type Pattern = "rosette" | "eyes" | "five" | "grid";
// After the British Museum board from the Royal Cemetery: rosettes at the outer corners, the
// middle of the shared row and the near end of the bridge.
const OUTER: (Pattern | undefined)[] = ["rosette", "eyes", "five", "eyes", undefined, undefined, "rosette", "five"];
const MIDDLE: Pattern[] = ["five", "grid", "eyes", "rosette", "five", "grid", "eyes", "five"];
export const exists = (row: number, col: number) => row === 1 || (col !== 4 && col !== 5);

function dot(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++)
    for (let x = Math.floor(cx - r); x <= cx + r; x++)
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
}

function cell(ctx: CanvasRenderingContext2D, x0: number, y0: number, pattern: Pattern) {
  ctx.fillStyle = BITUMEN;
  ctx.fillRect(x0, y0, C, C);
  ctx.fillStyle = SHELL;
  ctx.fillRect(x0 + 1, y0 + 1, C - 2, C - 2);
  ctx.fillStyle = SHELL_SHADE;
  ctx.fillRect(x0 + 1, y0 + C - 2, C - 2, 1);
  ctx.fillRect(x0 + C - 2, y0 + 1, 1, C - 2);
  const cx = x0 + C / 2;
  const cy = y0 + C / 2;
  if (pattern === "rosette") {
    for (let y = y0 + 1; y < y0 + C - 1; y++)
      for (let x = x0 + 1; x < x0 + C - 1; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const r = Math.hypot(dx, dy);
        const petal = Math.cos(8 * Math.atan2(dy, dx)) > 0.2;
        const color = r < 1.8 ? RED : r < 5.6 && petal ? (r < 3.4 ? LAPIS_HI : LAPIS) : r > 6.2 && r < 7 ? RED : undefined;
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
  } else if (pattern === "eyes") {
    for (const [ox, oy] of [[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]]) {
      dot(ctx, cx + ox, cy + oy, 2.6, LAPIS);
      dot(ctx, cx + ox, cy + oy, 1.6, SHELL);
      dot(ctx, cx + ox, cy + oy, 0.8, RED);
    }
  } else if (pattern === "five") {
    for (const [ox, oy] of [[-4, -4], [4, -4], [0, 0], [-4, 4], [4, 4]]) {
      dot(ctx, cx + ox, cy + oy, 2, LAPIS);
      dot(ctx, cx + ox, cy + oy, 0.8, RED);
    }
  } else {
    for (const oy of [-4, 0, 4]) for (const ox of [-4, 0, 4]) dot(ctx, cx + ox, cy + oy, 1.2, (ox + oy) % 8 ? LAPIS : RED);
  }
}

let board: HTMLCanvasElement | undefined;
export function boardCanvas(): HTMLCanvasElement {
  if (board) return board;
  board = document.createElement("canvas");
  board.width = BOARD_W;
  board.height = BOARD_H;
  const ctx = board.getContext("2d")!;
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 8; col++) {
      if (!exists(row, col)) continue;
      ctx.fillStyle = BITUMEN;
      ctx.fillRect(col * C, row * C, C + F * 2, C + F * 2);
    }
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 8; col++) {
      const pattern = row === 1 ? MIDDLE[col] : OUTER[col];
      if (pattern) cell(ctx, F + col * C, F + row * C, pattern);
    }
  return board;
}

export const PIECE = 13;
const pieces = new Map<UrSide, HTMLCanvasElement>();
/** White shell inlaid with lapis for the near side, black shale with shell dots for the far. */
export function pieceCanvas(side: UrSide): HTMLCanvasElement {
  const hit = pieces.get(side);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = PIECE;
  const ctx = c.getContext("2d")!;
  const m = PIECE / 2;
  dot(ctx, m, m + 0.5, 6.3, INK);
  dot(ctx, m, m, 5.4, side === 0 ? "#f3ecda" : "#3a302a");
  dot(ctx, m - 1, m - 1, 3, side === 0 ? "#fffaf0" : "#4b3f37");
  const pip = side === 0 ? LAPIS : "#e0d4b4";
  for (const [ox, oy] of [[-2.5, -2.5], [2.5, -2.5], [0, 0], [-2.5, 2.5], [2.5, 2.5]]) dot(ctx, m + ox, m + oy, 0.9, pip);
  pieces.set(side, c);
  return c;
}

export function cellBox(side: UrSide, pos: number) {
  const at = cellOf(side, pos);
  return at && { x: F + at.col * C, y: F + at.row * C, size: C };
}
export function cellAt(px: number, py: number) {
  const col = Math.floor((px - F) / C);
  const row = Math.floor((py - F) / C);
  return row >= 0 && row < 3 && col >= 0 && col < 8 && exists(row, col) ? { row, col } : undefined;
}

export const DIE = 12;
const dice = new Map<boolean, HTMLCanvasElement>();
/** A tetrahedral die seen from above, its tip marked or plain. */
export function dieCanvas(marked: boolean): HTMLCanvasElement {
  const hit = dice.get(marked);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = DIE;
  const ctx = c.getContext("2d")!;
  for (let y = 1; y < DIE; y++) {
    const half = (y / (DIE - 1)) * (DIE / 2 - 0.5);
    for (let x = 0; x < DIE; x++) {
      const dx = Math.abs(x + 0.5 - DIE / 2);
      if (dx > half) continue;
      const edge = dx > half - 1 || y === DIE - 1;
      ctx.fillStyle = edge ? INK : x + 0.5 < DIE / 2 ? "#4a3a2e" : "#33281f";
      ctx.fillRect(x, y, 1, 1);
    }
  }
  if (marked) dot(ctx, DIE / 2, 4.5, 1.4, "#f3ecda");
  dice.set(marked, c);
  return c;
}
