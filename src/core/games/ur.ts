/**
 * The Royal Game of Ur as Irving Finkel reconstructed it from a Babylonian tablet of 177 BCE:
 * seven pieces a side, four two-marked tetrahedral dice, a 14-square route that shares its middle eight.
 */
export type UrSide = 0 | 1;
export interface UrState {
  pieces: [number[], number[]];
  turn: UrSide;
  winner?: UrSide;
}
export interface UrMove {
  from: number;
  to: number;
  capture: boolean;
  rosette: boolean;
}

export const PIECES = 7;
/** Route positions: 0 waiting, 1–14 on the board, 15 borne off. */
export const HOME = 15;
export const ROSETTES = [4, 8, 14];
const SAFE = 8;

export const shared = (pos: number) => pos >= 5 && pos <= 12;

/** Side 0 runs along the bottom row, side 1 the top; both share the middle row left to right. */
export function cellOf(side: UrSide, pos: number): { row: number; col: number } | undefined {
  if (pos < 1 || pos > 14) return;
  if (shared(pos)) return { row: 1, col: pos - 5 };
  return { row: side === 0 ? 2 : 0, col: pos <= 4 ? 4 - pos : 20 - pos };
}

export function urStart(): UrState {
  return { pieces: [Array(PIECES).fill(0), Array(PIECES).fill(0)], turn: 0 };
}

export function rollUr(rand: () => number) {
  const dice = [0, 1, 2, 3].map(() => rand() < 0.5);
  return { dice, total: dice.filter(Boolean).length };
}

export function urMoves(s: UrState, roll: number): UrMove[] {
  if (roll === 0 || s.winner !== undefined) return [];
  const mine = s.pieces[s.turn];
  const theirs = s.pieces[1 - s.turn];
  const moves: UrMove[] = [];
  for (const from of new Set(mine)) {
    const to = from + roll;
    if (from === HOME || to > HOME) continue;
    if (to < HOME && mine.includes(to)) continue;
    const capture = shared(to) && theirs.includes(to);
    if (capture && to === SAFE) continue;
    moves.push({ from, to, capture, rosette: ROSETTES.includes(to) });
  }
  return moves;
}

export function urApply(s: UrState, m: UrMove): UrState {
  const pieces: [number[], number[]] = [[...s.pieces[0]], [...s.pieces[1]]];
  const mine = pieces[s.turn];
  mine[mine.indexOf(m.from)] = m.to;
  if (m.capture) {
    const theirs = pieces[1 - s.turn];
    theirs[theirs.indexOf(m.to)] = 0;
  }
  const winner = mine.every((p) => p === HOME) ? s.turn : undefined;
  return { pieces, turn: m.rosette || winner !== undefined ? s.turn : ((1 - s.turn) as UrSide), winner };
}

export const urPass = (s: UrState): UrState => ({ ...s, turn: (1 - s.turn) as UrSide });

/** A plain greedy opponent: take, land on a rosette, get out of reach, otherwise press the front piece. */
export function urPick(s: UrState, moves: UrMove[]): UrMove {
  const theirs = s.pieces[1 - s.turn];
  const exposed = (pos: number) => shared(pos) && pos !== SAFE && theirs.some((q) => q > 0 && pos - q >= 1 && pos - q <= 4);
  const score = (m: UrMove) =>
    (m.capture ? 8 : 0) +
    (m.rosette ? 5 : 0) +
    (m.to === HOME ? 4 : 0) +
    (exposed(m.from) ? 3 : 0) -
    (exposed(m.to) ? 4 : 0) -
    (m.from === SAFE ? 2 : 0) +
    m.to * 0.1;
  return moves.reduce((best, m) => (score(m) > score(best) ? m : best));
}
