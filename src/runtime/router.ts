import type { Engine } from "../core/engine";
import { doorApproach } from "../core/doors";
import type { ItemId, Place } from "../core/types";
import { forageByCover, forageByTerrain } from "../content/ecology/forage";
import type { Evaluation, Question } from "../chronicle/jev";
import { edgePlan, type Plan } from "./autopilot";

/** Below this, the line goes to the narrator instead. */
export const SURE = 0.6;
const PLACES = 60;
const EDGES = ["north", "south", "east", "west"] as const;

/**
 * One Jev call that reads a typed line as one of the errands the autopilot
 * can run, picking the target from what this world actually has. Every
 * option comes from the engine, so the answer is always something that can
 * be done.
 */
export function routeQuestion(engine: Engine, input: string) {
  const s = engine.state,
    p = s.player;
  const setting = engine.world.pack.setting;
  const items = new Set<ItemId>();
  for (const rows of Object.values(forageByTerrain)) rows!.forEach(([id]) => items.add(id));
  for (const [, rows] of forageByCover) rows.forEach(([id]) => items.add(id));
  for (const o of s.objects) if (o.resource && !o.owner) items.add(o.resource.item);
  const far = (pl: Place) => {
    const d = doorApproach(pl);
    return Math.hypot(d.x - p.pos.x, d.y - p.pos.y);
  };
  const seen = new Set<string>();
  const places = engine.world.places
    .filter((pl) => pl.access === "public" || pl.owner === p.id)
    .sort((a, b) => far(a) - far(b))
    .filter((pl) => !seen.has(pl.name) && !!seen.add(pl.name))
    .slice(0, PLACES);

  const kinOf = new Map((p.relations ?? []).map((r) => [r.other, r.kind]));
  const people = s.actors
    .filter((a) => a.kind === "human" && a.id !== "player")
    .sort((a, b) => Number(kinOf.has(b.id)) - Number(kinOf.has(a.id)) || Math.hypot(a.pos.x - p.pos.x, a.pos.y - p.pos.y) - Math.hypot(b.pos.x - p.pos.x, b.pos.y - p.pos.y))
    .slice(0, 40);
  const state = {
    said: input.trim().slice(0, 300),
    who: `${p.name}, ${p.role}`,
    where: `${engine.world.pack.region}, ${setting?.year ?? engine.world.pack.date}`,
  };
  const questions: Record<string, Question> = {
    errand: {
      type: "choice",
      instructions:
        "`said` is what a player typed to steer their character. Which standing errand does it ask for, if any?",
      criteria: {
        forage: "Roam the countryside gathering or foraging: berries, herbs, firewood, mushrooms, anything picked up from the land.",
        go: "Walk somewhere: a named building or landmark, a direction, the edge of the land, far away.",
        workday: "Do the character's own trade or job, or the day's work and chores.",
        seek: "Go and find a particular person: family, a friend, someone by name.",
        roam: "Move about on foot with no destination: run around, go for a walk, pace, stretch the legs, play.",
        none: "Anything else: talking, asking a question, a single action here and now, a feeling, or nothing that fits the others.",
      },
    },
    who: {
      type: "choice",
      instructions: "If `said` asks to find a person, which of these is it?",
      criteria: {
        ...Object.fromEntries(people.map((a) => [a.id, `${a.name}${kinOf.get(a.id) ? ` (the player's ${kinOf.get(a.id)})` : ""}`])),
        none: "No one here is meant.",
      },
    },
    pace: {
      type: "choice",
      instructions: "At what pace does `said` ask the character to move?",
      criteria: {
        run: "Running, jogging, dashing, in a hurry.",
        walk: "Walking, strolling, wandering, or no pace given.",
      },
    },
    item: {
      type: "choice",
      instructions: "If `said` names or implies something to gather, which of these is closest?",
      criteria: {
        ...Object.fromEntries([...items].map((id) => [id, engine.item(id)?.name ?? id])),
        none: "Nothing in particular is named.",
      },
    },
    where: {
      type: "choice",
      instructions: "If `said` names a destination, which of these is it closest to?",
      criteria: {
        ...Object.fromEntries(places.map((pl) => [pl.id, pl.name])),
        ...Object.fromEntries(EDGES.map((d) => [`edge-${d}`, `The ${d}ern edge of the land, or heading ${d}`])),
        edge: "The edge of the land or the map, with no direction given.",
        none: "No destination is named.",
      },
    },
  };
  return { state, questions };
}

const pick = (e: Evaluation, key: string) => {
  const a = e.answers[key];
  return a?.type === "choice" ? { choice: a.choice, p: a.probabilities[a.choice] ?? 0 } : undefined;
};

/** The plan Jev's answers describe, or undefined when it is not sure. */
export function planFrom(engine: Engine, e: Evaluation): Plan | undefined {
  const errand = pick(e, "errand");
  if (!errand || errand.choice === "none" || errand.p < SURE) return undefined;
  if (errand.choice === "workday") return { kind: "workday" };
  if (errand.choice === "seek") {
    const who = pick(e, "who");
    const a = who && who.p >= SURE && engine.state.actors.find((x) => x.id === who.choice);
    return a ? { kind: "seek", actor: a.id, label: a.name } : undefined;
  }
  if (errand.choice === "roam") return { kind: "roam", run: pick(e, "pace")?.choice === "run" };
  if (errand.choice === "forage") {
    const item = pick(e, "item");
    return {
      kind: "forage",
      item: item && item.choice !== "none" && item.p >= SURE ? item.choice : undefined,
    };
  }
  const where = pick(e, "where");
  if (!where || where.choice === "none" || where.p < SURE) return undefined;
  if (where.choice === "edge") return edgePlan(engine);
  if (where.choice.startsWith("edge-"))
    return edgePlan(engine, where.choice.slice(5) as (typeof EDGES)[number]);
  const place = engine.world.places.find((pl) => pl.id === where.choice);
  return place && { kind: "go", to: doorApproach(place), label: place.name.toLowerCase().startsWith("the ") ? place.name : `the ${place.name.toLowerCase()}` };
}

let offline = false;
/** Asks the server's Jev for a plan. Undefined on any failure, so the
 * narrator answers as it did before; a server without a key is not asked
 * again this session. */
export async function routePlan(engine: Engine, input: string): Promise<Plan | undefined> {
  if (offline) return undefined;
  try {
    const res = await fetch("/api/jev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(routeQuestion(engine, input)),
    });
    if (res.status === 503 || res.status === 404) offline = true;
    if (!res.ok) return undefined;
    return planFrom(engine, (await res.json()) as Evaluation);
  } catch {
    return undefined;
  }
}
