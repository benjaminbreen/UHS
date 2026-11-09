import type { Rank } from "../../content/characters/context-types";

/**
 * How likely someone is to die in a year, by age and date. Adults follow
 * Gompertz-Makeham, `a·e^(b·x) + c`, with `a` solved so that the years left at
 * twenty match the period's target; children take the period's infant and
 * child losses. Targets after GENERATIONS.md: e20 of 38 before 1800 (Wrigley
 * and Schofield's England), 45 to 1900, 52 to 1950, 58 after; deep prehistory
 * lower, after skeletal estimates. Elsewhere the fall in deaths came after
 * 1950 (Riley's global life expectancy series), so the old rates hold till then.
 */
const B = 0.085;
const MAKEHAM = 0.004;

type Place = { lon: number; lat: number };
const EARLY: [number, number, number, number][] = [[-12, 35, 45, 72], [-130, 24, -52, 60], [110, -48, 180, -10], [129.5, 30, 146, 46]];
/** Whether deaths fell here from the nineteenth century: Europe, North America, Australasia, Japan. */
const early = (at?: Place) => !at || EARLY.some((b) => at.lon >= b[0] && at.lat >= b[1] && at.lon <= b[2] && at.lat <= b[3]);

export function remainingAt20(year: number, at?: Place) {
  if (!early(at)) return year < -1000 ? 33 : year < 1950 ? 38 : year < 1990 ? 48 : 55;
  return year < -1000 ? 33 : year < 1800 ? 38 : year < 1900 ? 45 : year < 1950 ? 52 : 58;
}

const solved = new Map<number, number>();
/** Expected years left at twenty for a given `a`. */
function e20(a: number) {
  let alive = 1, years = 0;
  for (let x = 20; x < 120; x++) {
    const q = Math.min(1, 1 - Math.exp(-(a * Math.exp(B * x) + MAKEHAM)));
    years += alive * (1 - q / 2);
    alive *= 1 - q;
  }
  return years;
}
function gompertzA(target: number) {
  const known = solved.get(target);
  if (known !== undefined) return known;
  let lo = 1e-7, hi = 1e-1;
  for (let i = 0; i < 60; i++) {
    const mid = Math.sqrt(lo * hi);
    if (e20(mid) > target) lo = mid;
    else hi = mid;
  }
  solved.set(target, lo);
  return lo;
}

/** Infant, ages one to four, and five to fourteen, a year's chance each. */
function childLoss(year: number, at?: Place) {
  if (!early(at)) return year < 1950 ? [0.18, 0.025, 0.006] : year < 1990 ? [0.1, 0.012, 0.003] : [0.04, 0.003, 0.001];
  return year < 1800 ? [0.18, 0.025, 0.006] : year < 1900 ? [0.15, 0.02, 0.005] : year < 1950 ? [0.08, 0.008, 0.002] : [0.02, 0.001, 0.0005];
}

const RANK: Record<Rank, number> = { destitute: 1.35, labouring: 1.1, middling: 1, gentry: 0.85, elite: 0.78 };

/** The chance of dying within the year at `age`, before anything particular to this life. */
export function yearlyRisk(age: number, year: number, rank: Rank = "labouring", factor = 1, at?: Place) {
  const [infant, small, child] = childLoss(year, at);
  const base = age < 1 ? infant : age < 5 ? small : age < 15 ? child
    : 1 - Math.exp(-(gompertzA(remainingAt20(year, at)) * Math.exp(B * age) + MAKEHAM));
  return Math.min(0.95, base * RANK[rank] * factor);
}

/** Dying in childbirth, per birth. */
export function childbedRisk(year: number, at?: Place) {
  if (!early(at)) return year < 1950 ? 0.012 : year < 1990 ? 0.005 : 0.002;
  return year < 1900 ? 0.012 : year < 1950 ? 0.003 : 0.0001;
}

/** "Most people born here then who reached twenty lived to about 58." */
export function typicalDeathAge(year: number, at?: Place) {
  return 20 + Math.round(e20(gompertzA(remainingAt20(year, at))));
}
