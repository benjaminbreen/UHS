import type { Actor, Position, Snapshot, WorldModel } from "./types";
import { distance } from "./types";
import { skySeed, weatherAt } from "./weather";

export function npcDanger(actor: Actor, clock: number) {
  if (actor.dead || (actor.health ?? 100) <= 0) return "none";
  if (actor.terror?.fight && actor.terror.until >= clock)
    return clock >= (actor.terror.strikeAfter ?? 0) ? "attacking" : "threatening";
  return actor.trust <= -4 && clock - (actor.wronged ?? -Infinity) < 3600 ? "hostile" : "none";
}

/** Relative gameplay risk, not a historical crime-rate estimate. */
export function dangerAt(world: WorldModel, s: Snapshot, pos: Position = s.player.pos) {
  const setting = world.pack.setting;
  const near = s.actors.filter((a) => a.kind === "human" && !a.dead && a.pos.space === pos.space && distance(a.pos, pos) <= 12);
  const threats = near.flatMap((a) => {
    const state = npcDanger(a, s.clock);
    return state === "none" ? [] : [{ id: a.id, name: a.name, state, armed: !!a.heldItem }];
  });
  const reasons: string[] = [];
  const cell = world.topography?.(pos.x, pos.y);
  const cover = cell?.habitat?.kind === "woodland" || (cell?.habitat?.cover ?? 0) > 0.55;
  const track = !!(cell?.lane || cell?.track || cell?.pathArt?.length) || world.terrain(pos.x, pos.y, pos.space) === "dirt";
  const nearest = world.places.filter((p) => p.abandonedAt === undefined && (p.structure?.roof ?? 1) >= 0.5).reduce((d, p) => Math.min(d, Math.hypot(p.entrance.x - pos.x, p.entrance.y - pos.y)), Infinity);
  const guard = near.some((a) => a.guard && npcDanger(a, s.clock) === "none");
  const night = weatherAt(skySeed(s.manifest), setting?.climate ?? "temperate", setting?.season ?? "spring", s.clock).night;
  const year = setting?.year ?? 0;
  const settled = !!setting && setting.settlement !== "camp" && year >= -3500;
  let score = 0;
  if (pos.space === "outside" && settled && nearest > 18 && !guard) {
    if (nearest > 40) { score++; reasons.push("Far from houses and help"); }
    if (cover) { score++; reasons.push("Cover beside the route"); }
    if (track) { score++; reasons.push("An isolated track"); }
    if (night) { score++; reasons.push("After dark"); }
    if (near.length >= 2) { score--; reasons.push("Other people nearby"); }
    // Rural robbery is less frequent in the modern baseline; secluded urban ground can still be risky.
    if (year >= 1900 && !night) score--;
  } else if (guard) reasons.push("A guard is nearby");
  else if (pos.space !== "outside") reasons.push("Under a roof");
  else if (nearest <= 18) reasons.push("Close to buildings");
  score = Math.max(0, Math.min(2, score));
  const areaRisk = score;
  if (threats.some((t) => t.state === "attacking")) score = 3;
  else if (threats.some((t) => t.state === "threatening" || t.armed)) score = Math.max(score, 2);
  else if (threats.length) score = Math.max(score, 1);
  const labels = ["low", "raised", "high", "immediate"] as const;
  return {
    score, level: labels[score], areaRisk,
    area: `${Math.floor(pos.x / 32)},${Math.floor(pos.y / 32)}`,
    reasons, threats,
    hourlyRisk: areaRisk === 0 ? 0 : (year >= 1900 ? 0.015 : 0.04) * areaRisk * (night ? 1.5 : 1),
  };
}

export function dangerSummary(danger: ReturnType<typeof dangerAt>) {
  return `Danger: ${danger.level}${danger.reasons.length ? ` — ${danger.reasons.join("; ")}` : ""}.${danger.threats.length ? ` ${danger.threats.map((t) => `${t.name}: ${t.state}${t.armed ? ", armed" : ""}`).join("; ")}.` : ""}`;
}
