import type { Household, HouseholdEvent, Position } from "./types";

type Marker = { id: string; prop?: string; sprite?: string; pos: Position };
export type Burial = HouseholdEvent & { household: Household };

const near = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.y - b.y);
/** Who lies under each grave marker. A household buries in the nearest
 * ground; a ground fills in order of death and is then dug over again, so the
 * newest dead keep their markers and the oldest have lost theirs. */
export function burials(households: Household[], objects: Marker[]) {
  const grounds: Marker[][] = [];
  for (const o of objects) {
    if (o.prop !== "graveMound" || o.pos.space !== "outside") continue;
    const g = grounds.find((g) => near(g[0].pos, o.pos) < 30);
    if (g) g.push(o);
    else grounds.push([o]);
  }
  const dead: Burial[][] = grounds.map(() => []);
  for (const household of households) {
    const died = household.history?.filter((e) => e.kind === "died");
    if (!died?.length) continue;
    let best = -1, d = 220;
    grounds.forEach((g, i) => {
      const n = near(g[0].pos, household.home);
      if (n < d) (d = n), (best = i);
    });
    if (best >= 0) for (const e of died) dead[best].push({ ...e, household });
  }
  const out = new Map<string, Burial>();
  grounds.forEach((g, i) => {
    g.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    dead[i]
      .sort((a, b) => a.year - b.year || a.household.id.localeCompare(b.household.id))
      .forEach((b, k) => out.set(g[k % g.length].id, b));
  });
  return out;
}

/** Where a household's most recent dead lie. */
export function kinGraves(households: Household[], objects: Marker[]) {
  const at: Record<string, Position> = {};
  const pos = new Map(objects.map((o) => [o.id, o.pos]));
  const year: Record<string, number> = {};
  for (const [id, b] of burials(households, objects))
    if (b.year >= (year[b.household.id] ?? -Infinity)) (year[b.household.id] = b.year), (at[b.household.id] = pos.get(id)!);
  return at;
}

// The Chinese stele, the Ottoman headstone, the gorinto and the headstone.
const INSCRIBED = new Set(["0", "4", "6", "8"]);
const ago = (n: number) => (n <= 0 ? "this year" : n === 1 ? "last year" : `${n} years ago`);
/** What someone who lives here can say about a grave. `head` is the living
 * householder's name; `mine` when the player heads the house. */
export function graveLine(marker: Marker, b: Burial | undefined, year: number, head?: string, mine = false) {
  const cut = INSCRIBED.has(marker.sprite?.match(/-(\d+)$/)?.[1] ?? "");
  if (!b) return cut ? "Whatever was cut into it has worn away." : "Nobody living remembers whose it is.";
  const house = mine ? "your" : head ? `${head}'s` : "a";
  const who = b.name
    ? `${b.name}, ${b.as ? `your ${b.as}` : `of ${house} household`}`
    : mine ? `your ${b.as}` : head ? `the ${b.as} of ${head}` : `a ${b.as} of a house that has no head now`;
  const c = b.cause;
  const how = !c ? "" : /^(mauled|gored|taken) /.test(c) ? `, ${c}` : /^(of|from|in) /.test(c) ? ` ${c}` : ` from ${c}`;
  const died = `, who died ${ago(year - b.year)}${how}`;
  return cut ? `It marks ${who}${died}.` : `There is no writing on it, but people here know it is ${who}${died}.`;
}
