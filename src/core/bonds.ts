import { OPEN_SAME_SEX, SAME_SEX_CHANCE } from "../content/bonds";
import { matchesCharacterScope } from "../content/characters/resolve";
import { kinOf } from "./kin";
import { sexOf } from "./brief";
import { random } from "./random";
import type { Actor, Snapshot } from "./types";
import type { WorldSetting } from "../content/geography/types";

/** Someone the player is drawn to, matched with, at odds with or cut off
 * from. Fixed when the life begins; plain data so a save can keep it. */
export type Bond = {
  kind: "beloved" | "match" | "rival" | "estranged";
  with: string;
  /** For love: they feel the same. */
  mutual?: boolean;
  /** For love: nobody else knows, or could be told. */
  secret?: boolean;
  /** For love: their family would not have it. */
  opposed?: boolean;
};

const unpartnered = (a: Actor) => !a.relations?.some((r) => r.kind === "partner");

export function bondsFor(s: Snapshot, setting: WorldSetting | undefined): Bond[] {
  const p = s.player, seed = s.manifest.seed, age = p.age ?? 30;
  const r = (...k: string[]) => random(seed, "bond", ...k);
  const pick = <T,>(xs: T[], key: string) => xs[Math.floor(r(key, "pick") * xs.length)];
  const kin = new Set(kinOf(s).map((k) => k.actor.id));
  const others = s.actors.filter((a) =>
    a.kind === "human" && !a.dead && a.id !== p.id && !kin.has(a.id) && a.householdId !== p.householdId);
  const households = new Map((s.households ?? []).map((h) => [h.id, h]));
  const sex = sexOf(p);
  const bonds: Bond[] = [];

  const near = (a: Actor) => {
    const d = (a.age ?? 30) - age;
    return (a.age ?? 0) >= 16 && d >= -8 && d <= 8 && unpartnered(a);
  };
  if (unpartnered(p) && age >= 15 && age <= 40 && sex) {
    const open = setting && OPEN_SAME_SEX.find((o) => o.sex === sex && matchesCharacterScope(o.scope, setting));
    const same = r("same") < (open?.chance ?? SAME_SEX_CHANCE);
    const want = same ? sex : sex === "female" ? "male" : "female";
    const one = pick(others.filter((a) => near(a) && sexOf(a) === want), "beloved");
    if (one && r("beloved") < 0.4) {
      const mine = households.get(p.householdId ?? ""), theirs = households.get(one.householdId ?? "");
      bonds.push({
        kind: "beloved",
        with: one.id,
        mutual: r("mutual") < 0.5,
        secret: same && !open,
        opposed: !same && Math.abs((mine?.fortune ?? 0.5) - (theirs?.fortune ?? 0.5)) > 0.35,
      });
    }
    // Before 1900 a young person living with a parent was likely being matched.
    const parent = kinOf(s).some((k) => k.kind === "parent" && k.actor.householdId === p.householdId);
    const match = parent && age <= 28 && (setting?.year ?? 1500) < 1900 &&
      pick(others.filter((a) => near(a) && sexOf(a) === (sex === "female" ? "male" : "female") && a.id !== bonds[0]?.with), "match");
    if (match && r("match") < 0.35) bonds.push({ kind: "match", with: match.id });
  }
  const rival = pick(others.filter((a) => a.role === p.role && (a.age ?? 0) >= 16), "rival");
  if (rival && r("rival") < 0.3) bonds.push({ kind: "rival", with: rival.id });
  const sibling = kinOf(s).filter((k) => k.kind === "sibling").sort((a, b) => (b.actor.age ?? 0) - (a.actor.age ?? 0))[0];
  if (sibling && r("estranged") < 0.2) bonds.push({ kind: "estranged", with: sibling.actor.id });
  return bonds;
}

export type Relationship = {
  status: "neutral" | "friend" | "best friend" | "enemy";
  since: number;
  pending?: Relationship["status"];
  began?: number;
};

export function updateRelationships(s: Snapshot, actor?: Actor) {
  const records = (s.relationships ??= {});
  const friends = new Set(s.player.relations?.filter((r) => r.kind === "friend").map((r) => r.other));
  for (const a of actor ? [actor] : s.actors) {
    if (a.kind !== "human" || a.dead || a.id === s.player.id) continue;
    const r = (records[a.id] ??= { status: friends.has(a.id) ? "friend" : "neutral", since: s.clock });
    const next: Relationship["status"] = a.trust <= -6 ? "enemy"
      : r.status === "enemy" && a.trust < -1 ? "enemy"
      : (r.status === "friend" && a.trust >= 8) || (r.status === "best friend" && a.trust >= 5) ? "best friend"
      : a.trust >= 3 || ((r.status === "friend" || r.status === "best friend") && a.trust > 0) ? "friend" : "neutral";
    if (next === r.status) {
      delete r.pending;
      delete r.began;
    } else if (r.pending !== next) {
      r.pending = next;
      r.began = s.clock;
    } else if (s.clock - r.began! >= (next === "best friend" ? 3 : 1) * 86400) {
      r.status = next;
      r.since = s.clock;
      delete r.pending;
      delete r.began;
    }
  }
}

export function socialLabels(s: Snapshot): Map<string, string> {
  const labels = new Map<string, string>();
  const alive = new Set(s.actors.filter((a) => a.kind === "human" && !a.dead).map((a) => a.id));
  for (const r of s.player.relations ?? [])
    if (r.kind === "friend" && alive.has(r.other) && !s.relationships?.[r.other]) labels.set(r.other, "FRIEND");
  const reserved = new Set([...kinOf(s).map((k) => k.actor.id), ...(s.bonds ?? []).filter((b) => b.kind === "rival").map((b) => b.with)]);
  const best = Object.entries(s.relationships ?? {}).filter(([id, r]) => alive.has(id) && !reserved.has(id) && r.status === "best friend")
    .sort(([a, x], [b, y]) => x.since - y.since || a.localeCompare(b))[0]?.[0];
  for (const [id, r] of Object.entries(s.relationships ?? {})) {
    if (!alive.has(id) || r.status === "neutral") continue;
    labels.set(id, r.status === "enemy" ? "ENEMY" : id === best ? "BEST FRIEND" : "FRIEND");
  }
  for (const b of s.bonds ?? [])
    if (b.kind === "rival" && alive.has(b.with) && labels.get(b.with) !== "ENEMY") labels.set(b.with, "RIVAL");
  return labels;
}
