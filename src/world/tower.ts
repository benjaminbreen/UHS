import { towerStyleFor, type TowerStyle } from "../content/towers";
import { lobbyStaff, overtime, tenants, type Staff, type Tenant } from "../content/towers/tenants";
import { characterNameParts } from "../content/characters/generate";
import { matchesCharacterScope, resolveCharacterContext, type CharacterContext } from "../content/characters/resolve";
import type { WorldSetting } from "../content/geography/types";
import type { InteriorProfile } from "../content/interiors/types";
import type { Place } from "../core/types";
import { random } from "../core/random";

/** One storey: the room it is fitted out as, the firm in it and who works there. */
export type TowerFloor = {
  n: number; kind: string; name: string; profile: InteriorProfile; colorway: number; tenant?: string; staff: readonly Staff[]; customers?: boolean;
  /** The staff's hours; `late` is the share of them still working for a few hours after. */
  hours: readonly [number, number]; late: number;
  stay?: Tenant["stay"];
};
export type Tower = { place: string; style: TowerStyle; floors: TowerFloor[] };

/** Storey n of a building is its own space: the street floor is the building's own id. */
export const floorSpace = (place: string, n: number) => (n ? `${place}@${n}` : place);
export function parseFloor(space: string) {
  const i = space.lastIndexOf("@");
  return i < 0 ? { place: space, n: 0 } : { place: space.slice(0, i), n: Number(space.slice(i + 1)) };
}

/** A storey as the lift names it, the street floor the first, as in New York, Moscow and Tokyo. */
export function floorName(n: number) {
  const k = n + 1, t = k % 100;
  return n ? `the ${k}${t >= 11 && t <= 13 ? "th" : ["th", "st", "nd", "rd"][k % 10] ?? "th"} floor` : "the lobby";
}

/** A firm's name from its kind's patterns, with local surnames. */
export function firmName(t: Pick<Tenant, "names">, s: WorldSetting, seed: string, key: string, context: CharacterContext) {
  const r = (...k: (string | number)[]) => random(seed, "firm", key, ...k);
  const say = (t.names.find((n) => !n.where || n.where.some((w) => matchesCharacterScope(w, s, "*"))) ?? t.names[t.names.length - 1]).say;
  const taken = new Set<string>();
  let i = 0;
  return say[Math.floor(r("say") * say.length)].replace(/\{S\}|\{N\}|\[([^\]]+)\]/g, (m, alts?: string) => {
    const k = i++;
    if (m === "{N}") return String(1 + Math.floor(r("n", k) * 40));
    if (alts) {
      const o = alts.split("|");
      return o[Math.floor(r("word", k) * o.length)];
    }
    for (let tries = 0; ; tries++) {
      const name = characterNameParts(s, seed, `firm-${key}-${k}-${tries}`, context);
      const surname = name.families[0] ?? name.personal;
      if (!taken.has(surname) || tries > 4) return taken.add(surname), surname;
    }
  });
}

/** The storeys of a tower, planned from its seed: the lobby, runs of floors
 * let to one firm at a time from the kinds that fit this place and year,
 * and the top. */
export function towerPlan(place: Place, seed: string, s: WorldSetting): Tower | undefined {
  const style = towerStyleFor(place.sprite);
  if (!style) return undefined;
  const context = resolveCharacterContext(s);
  const found = new Set(context.livelihoods.map((l) => l.id));
  const kept = (w: Staff) => found.has(w.work) && (!w.until || s.year < w.until);
  const fits = tenants.flatMap((t) => {
    const room = t.room.find((k) => style.rooms[k]);
    const staff = t.staff.filter(kept);
    return room && found.has(t.staff[0].work) && t.where.some((w) => matchesCharacterScope(w, s, "*")) ? [{ ...t, room, staff }] : [];
  });
  const middle = fits.filter((t) => !t.top);
  if (!middle.length) return undefined;
  const r = (...k: (string | number)[]) => random(seed, "tower", place.id, ...k);
  const [lo, hi] = style.storeys;
  const count = lo + Math.floor(r("storeys") * (hi - lo + 1));
  const late = overtime.find((o) => o.where.some((w) => matchesCharacterScope(w, s, "*")))?.share ?? 0;
  const floors: TowerFloor[] = [{
    n: 0, kind: "lobby", name: "Lobby", profile: style.lobby, colorway: Math.floor(r("lobby") * 3), staff: lobbyStaff.filter(kept), customers: true,
    hours: style.lobby.regulars?.hours ?? [8, 19], late: 0,
  }];
  const used = new Set<string>();
  const take = (t: (typeof fits)[number], key: number) => {
    let name = "";
    for (let tries = 0; tries < 4 && (!name || used.has(name)); tries++) name = firmName(t, s, seed, `${place.id}-${key}-${tries}`, context);
    used.add(name);
    const profile = style.rooms[t.room];
    return { kind: t.room, name, profile, colorway: Math.floor(r("colour", key) * profile.colorways.length), tenant: t.id, staff: t.staff, customers: t.customers,
      hours: t.hours ?? profile.regulars?.hours ?? [9, 17], late: t.customers || t.stay ? 0 : late, stay: t.stay };
  };
  const pick = (from: typeof fits, u: number) => {
    let roll = u * from.reduce((n, t) => n + t.weight, 0);
    return from.find((t) => (roll -= t.weight) < 0) ?? from[from.length - 1];
  };
  for (let n = 1; n < count - 1; ) {
    const at = n / count;
    const banded = middle.filter((t) => !t.band || (at >= t.band[0] && at <= t.band[1]));
    const t = pick(banded.length ? banded : middle, r("kind", n));
    const run = Math.min(count - 1 - n, t.run[0] + Math.floor(r("run", n) * (t.run[1] - t.run[0] + 1)));
    const firm = take(t, n);
    for (let i = 0; i < run; i++) floors.push({ n: n + i, ...firm });
    n += run;
  }
  const tops = fits.filter((t) => t.top);
  floors.push({ n: count - 1, ...take(pick(tops.length ? tops : middle, r("top")), -1) });
  return { place: place.id, style, floors };
}
