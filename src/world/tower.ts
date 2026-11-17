import { towerStyleFor, type FloorKind, type TowerStyle } from "../content/towers";
import type { InteriorProfile } from "../content/interiors/types";
import type { Place } from "../core/types";
import { random } from "../core/random";

export type TowerFloor = { n: number; kind: string; name: string; profile: InteriorProfile; colorway: number };
export type Tower = { place: string; style: TowerStyle; floors: TowerFloor[] };

/** Storey n of a building is its own space: the street floor is the building's own id. */
export const floorSpace = (place: string, n: number) => (n ? `${place}@${n}` : place);
export function parseFloor(space: string) {
  const i = space.lastIndexOf("@");
  return i < 0 ? { place: space, n: 0 } : { place: space.slice(0, i), n: Number(space.slice(i + 1)) };
}

/** A storey as the lift names it, the American way: the street floor is the first. */
export function floorName(n: number) {
  const k = n + 1, t = k % 100;
  return n ? `the ${k}${t >= 11 && t <= 13 ? "th" : ["th", "st", "nd", "rd"][k % 10] ?? "th"} floor` : "the lobby";
}

/** The storeys of a tower, planned from its seed: the lobby, runs of floors
 * let to one firm at a time by the kinds' weights and bands, and the top. */
export function towerPlan(place: Place, seed: string): Tower | undefined {
  const style = towerStyleFor(place.sprite);
  if (!style) return undefined;
  const r = (...k: (string | number)[]) => random(seed, "tower", place.id, ...k);
  const [lo, hi] = style.storeys;
  const count = lo + Math.floor(r("storeys") * (hi - lo + 1));
  const floors: TowerFloor[] = [{ n: 0, kind: "lobby", name: "Lobby", profile: style.lobby, colorway: Math.floor(r("lobby") * 3) }];
  const used = new Set<string>();
  const take = (k: FloorKind, key: number) => {
    const free = k.tenants.filter((t) => !used.has(t));
    const name = (free.length ? free : k.tenants)[Math.floor(r("tenant", key) * (free.length || k.tenants.length))];
    used.add(name);
    return { kind: k.id, name, profile: k.profile, colorway: Math.floor(r("colour", key) * k.profile.colorways.length) };
  };
  for (let n = 1; n < count - 1; ) {
    const at = n / count;
    const fits = style.floors.filter((k) => !k.band || (at >= k.band[0] && at <= k.band[1]));
    let pick = r("kind", n) * fits.reduce((t, k) => t + k.weight, 0);
    const k = fits.find((f) => (pick -= f.weight) < 0) ?? fits[fits.length - 1];
    const run = Math.min(count - 1 - n, k.run[0] + Math.floor(r("run", n) * (k.run[1] - k.run[0] + 1)));
    const firm = take(k, n);
    for (let i = 0; i < run; i++) floors.push({ n: n + i, ...firm });
    n += run;
  }
  floors.push({ n: count - 1, ...take(style.top, -1) });
  return { place: place.id, style, floors };
}
