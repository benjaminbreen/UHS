/** Greek astragaloi: four sheep's knucklebones, each landing on one of four sides worth 1, 3, 4 or 6. */
export type Side = 1 | 3 | 4 | 6;
export const SIDES: readonly Side[] = [1, 3, 4, 6];

// Throw tests of real sheep astragali land the two broad sides about four times as often as the narrow.
export const FAIR: Record<Side, number> = { 1: 0.1, 3: 0.4, 4: 0.4, 6: 0.1 };
// A bone ground and weighted toward the six; loaded tali turn up at Roman sites.
export const LOADED: Record<Side, number> = { 1: 0.04, 3: 0.26, 4: 0.25, 6: 0.45 };

export function cast(rand: () => number, odds = FAIR): Side {
  let r = rand();
  for (const side of SIDES) if ((r -= odds[side]) < 0) return side;
  return 6;
}

/** Four bones; the first `loaded` of them weighted. */
export function throwBones(rand: () => number, loaded = 0): Side[] {
  return [0, 1, 2, 3].map((i) => cast(rand, i < loaded ? LOADED : FAIR));
}

/** The named throws: all four sides different (Aphrodite to Greeks, Venus to Romans) beats anything; all ones is the Dog. */
export function throwKind(bones: Side[]): "best" | "dog" | undefined {
  if (new Set(bones).size === 4) return "best";
  if (bones.every((b) => b === 1)) return "dog";
}

export function throwScore(bones: Side[]): number {
  return throwKind(bones) === "best" ? 100 : bones.reduce<number>((a, b) => a + b, 0);
}

/** Pleistobolinda, "most-throw": everyone stakes, the highest throw takes the pot, a tied top leaves it lying. */
export function winners(throws: Side[][]): number[] {
  const scores = throws.map(throwScore);
  const top = Math.max(...scores);
  const at = scores.flatMap((s, i) => (s === top ? [i] : []));
  return at.length === 1 ? at : [];
}

/** Augustus's game, from his letter in Suetonius: a coin into the pool for each bone showing one or six;
 * Venus takes the pool. Seat order matters: a Venus pays its own one and six in before it takes. */
export function augustus(throws: (Side[] | undefined)[], pool: number) {
  const pay = throws.map((t) => (t ? t.filter((s) => s === 1 || s === 6).length : 0));
  let pot = pool;
  const take = throws.map(() => 0);
  throws.forEach((t, i) => {
    pot += pay[i];
    if (t && throwKind(t) === "best") {
      take[i] = pot;
      pot = 0;
    }
  });
  return { pay, take, pot };
}
