import { KIN_LINES, type KinNeed } from "../content/plots/kin";
import { plotLine, plotTemplate } from "./plot";
import { random } from "./random";
import { sexOf } from "./brief";
import type { Actor, Snapshot } from "./types";

export type KinKind = "partner" | "child" | "parent" | "sibling";

/** What the player's own people remember of them: when each last spoke with
 * the player, when the player was last home, who is waiting on an answer. */
export type KinState = {
  since: number;
  said: Record<string, number>;
  talked: Record<string, number>;
  home?: number;
  last?: number;
  waiting?: { id: string; need: string; at: number };
};

const HOUR = 3600;

export function kinOf(s: Snapshot): { actor: Actor; kind: KinKind }[] {
  const byId = new Map(s.actors.map((a) => [a.id, a]));
  const relations = s.player.relations ?? [];
  const direct = relations.flatMap((r) => {
    const a = byId.get(r.other);
    return a && a.kind === "human" && !a.dead && (r.kind === "partner" || r.kind === "child" || r.kind === "parent")
      ? [{ actor: a, kind: r.kind }]
      : [];
  });
  // No sibling relation is recorded; a shared parent makes one.
  const parents = new Set(relations.filter((r) => r.kind === "parent").map((r) => r.other));
  const siblings = parents.size
    ? s.actors
        .filter((a) => a.id !== s.player.id && !a.dead && a.relations?.some((r) => r.kind === "parent" && parents.has(r.other)))
        .map((actor) => ({ actor, kind: "sibling" as const }))
    : [];
  return [...direct, ...siblings];
}

/** Red for the player's own people, gold for whoever the plot has drawn in. */
export function markOf(s: Snapshot, id: string): "kin" | "plot" | undefined {
  const plot = s.plot;
  if (plot && !plot.ended && Object.values(plot.cast).includes(id)) return "plot";
  if (kinOf(s).some((k) => k.actor.id === id)) return "kin";
}

/** The one of the player's people with the most pressing reason to come over
 * now, and what they say. `food` is what is left in the household store. */
export function kinCall(s: Snapshot, k: KinState, clock: number, food: number) {
  const away = clock - (k.home ?? k.since);
  const hour = Math.floor(clock / HOUR) % 24;
  const plot = s.plot;
  const plotLineFor = plot && !plot.ended && plotTemplate(plot)?.wording[plot.wording]?.lines["kin-partner"];
  const quiet = (id: string) => clock - (k.talked[id] ?? k.since);
  const cooled = (id: string, need: KinNeed) => {
    const at = k.said[`${id}:${need}`];
    return at === undefined || (need !== "plot" && clock - at >= 6 * HOUR);
  };
  // Earlier entries are more pressing.
  const needs: [KinKind, KinNeed, (a: Actor) => boolean][] = [
    ["child", "hungry", (a) => (a.age ?? 0) >= 3 && (a.age ?? 0) < 16 && (a.hunger >= 60 || food === 0)],
    ["partner", "plot", () => !!plotLineFor && clock - plot!.began >= HOUR / 2],
    ["partner", "store", () => food <= 1],
    ["child", "missed", (a) => (a.age ?? 0) >= 3 && (a.age ?? 0) < 11 && away >= 4 * HOUR],
    ["partner", "late", () => hour >= 19 && away >= 3 * HOUR],
    ["parent", "visit", (a) => (a.age ?? 0) >= 55 && quiet(a.id) >= 5 * HOUR],
    ["sibling", "visit", (a) => quiet(a.id) >= 8 * HOUR],
  ];
  const kin = kinOf(s).sort((a, b) => (a.actor.id < b.actor.id ? -1 : 1));
  for (const [kind, need, holds] of needs)
    for (const { actor, kind: is } of kin) {
      if (is !== kind || !cooled(actor.id, need) || !holds(actor)) continue;
      if (need === "plot") return { id: actor.id, need, line: plotLine(plot!, "kin-partner") };
      const young = (actor.age ?? 0) < 9;
      const key = `${kind}:${need}${kind === "child" ? (young ? ":young" : ":old") : ""}`;
      const lines = (KIN_LINES[key] ?? KIN_LINES[`${kind}:${need}:young`])?.({
        parent: sexOf(s.player) === "female" ? "Mother" : "Father",
        name: s.player.name,
      });
      if (!lines?.length) continue;
      const pick = lines[Math.floor(random(s.manifest.seed, "kin", actor.id, need, Object.keys(k.said).length) * lines.length)];
      return { id: actor.id, need, line: pick };
    }
}
