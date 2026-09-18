import { z } from "zod";
import { Engine } from "../core/engine";
import { commandSchema } from "../runtime/schema";
import { worldFacts, sceneDigest } from "../narrator/prompt";
import { findPath } from "../core/pathfinding";
import {
  startChronicle,
  trimScene,
  type Chronicle,
} from "../chronicle/chronicle";
import type {
  CommandRequest,
  CommandResult,
  Point,
  Position,
} from "../core/types";
export const rationaleSchema = z
  .object({
    intent: z.string().max(200).optional(),
    reasoning: z.string().max(2000).optional(),
    expectation: z.string().max(400).optional(),
  })
  .strict();
export const requestSchema = z
  .object({
    actionId: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
    expectedRevision: z.number().int().nonnegative(),
    command: commandSchema,
    /** Recorded in the chronicle and ignored by the engine, so it never
     * changes a replay. */
    rationale: rationaleSchema.optional(),
  })
  .strict();
export const gotoSchema = z
  .object({
    actionId: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
    /** A visible person, object or entrance. */
    target: z.string().optional(),
    x: z.number().int().optional(),
    y: z.number().int().optional(),
    maxSteps: z.number().int().min(1).max(400).default(200),
    rationale: rationaleSchema.optional(),
  })
  .strict();

export type TrajectoryEntry = {
  observation: ReturnType<PlayerAdapter["observe"]>;
  request: CommandRequest;
  result: CommandResult;
  hash: string;
};
export class PlayerAdapter {
  readonly trajectory: TrajectoryEntry[] = [];
  readonly chronicle: Chronicle;
  constructor(readonly engine: Engine) {
    this.chronicle = startChronicle(engine, "agent");
  }
  /** The scene as prose: far cheaper to read than `observe`, and it names the
   * actions each target actually allows. */
  digest() {
    return `${this.world()}\n\n${this.scene()}`;
  }
  /** Stable for the session: worth putting in a system prompt once. */
  world() {
    return worldFacts(this.engine);
  }
  /** This moment only. The revision goes in so acting needs no second,
   * heavier call. */
  scene() {
    return `${trimScene(sceneDigest(this.engine, ""), true)}\n\nRevision: ${
      this.engine.state.revision
    } (pass this as expectedRevision).`;
  }
  observe() {
    const observation = this.engine.observe(),
      p = observation.player.pos;
    const radius = 10,
      rows: string[] = [];
    for (let y = p.y - radius; y <= p.y + radius; y++) {
      let row = "";
      for (let x = p.x - radius; x <= p.x + radius; x++) {
        row += !this.engine.visible({ x, y, space: p.space })
          ? "?"
          : this.engine.blocked(x, y, p.space)
            ? "#"
            : this.engine.world.terrain(x, y, p.space) === "water"
              ? "~"
              : ".";
      }
      rows.push(row);
    }
    return {
      ...observation,
      localMap: {
        origin: { x: p.x - radius, y: p.y - radius },
        space: p.space,
        rows,
        legend: {
          ".": "walkable",
          "#": "blocked",
          "?": "unseen",
          "~": "water",
        },
      },
      nearbyActions: [
        ...observation.actors,
        ...observation.objects,
        ...observation.places,
      ].map((e) => ({
        id: e.id,
        actions: this.engine.inspect(e.id)?.affordances ?? [],
      })),
    };
  }
  inspect(targetId: string) {
    return (
      this.engine.inspect(targetId) ?? {
        error: "This target is not visible or known.",
      }
    );
  }
  /**
   * Walk to a visible target. One call instead of one per tile: a day of play
   * is a few hundred steps and only a dozen decisions, and every step still
   * goes through the same validated command, so the record and the replay are
   * unchanged.
   */
  goto(input: unknown) {
    const { actionId, target, x, y, maxSteps, rationale } =
      gotoSchema.parse(input);
    const start = { ...this.engine.state.player.pos };
    const destination = target
      ? this.engine.inspect(target)?.pos
      : x !== undefined && y !== undefined
        ? { x, y, space: start.space }
        : undefined;
    if (!destination)
      return {
        status: "unknown" as const,
        steps: 0,
        reason: target
          ? "That target is not visible or known."
          : "Name a target, or give x and y.",
        digest: this.digest(),
      };
    if (destination.space !== start.space)
      return {
        status: "unreachable" as const,
        steps: 0,
        reason: "That is not in the space you are in; use an entrance first.",
        digest: this.digest(),
      };

    const path = this.route(start, destination);
    if (!path.length)
      return {
        status: "unreachable" as const,
        steps: 0,
        reason: "No walkable route to that spot.",
        digest: this.digest(),
      };

    let steps = 0;
    let reason: string | undefined;
    for (const step of path.slice(0, maxSteps)) {
      const pos = this.engine.state.player.pos;
      const result = this.act({
        actionId: `${actionId}-${steps}`,
        expectedRevision: this.engine.state.revision,
        command: {
          type: "move",
          dx: Math.sign(step.x - pos.x),
          dy: Math.sign(step.y - pos.y),
        },
        // The reasoning belongs to the walk, not to each tile of it.
        ...(steps === 0 && rationale ? { rationale } : {}),
      });
      if (result.status !== "completed") {
        reason = result.reason;
        break;
      }
      steps++;
    }
    const pos = this.engine.state.player.pos;
    const distance =
      Math.abs(pos.x - destination.x) + Math.abs(pos.y - destination.y);
    return {
      status: reason
        ? ("interrupted" as const)
        : steps < path.length
          ? ("partial" as const)
          : ("arrived" as const),
      steps,
      distance,
      reason,
      digest: this.digest(),
    };
  }

  /** The same route the human runtime walks, including the neighbouring tile
   * when the target itself is solid. */
  private route(start: Position, destination: Point): Point[] {
    const ends = this.engine.blocked(destination.x, destination.y)
      ? [
          { x: destination.x, y: destination.y + 1 },
          { x: destination.x + 1, y: destination.y },
          { x: destination.x - 1, y: destination.y },
          { x: destination.x, y: destination.y - 1 },
        ]
      : [destination];
    for (const end of ends) {
      if (this.engine.blocked(end.x, end.y)) continue;
      const path =
        this.engine.state.manifest.simulation === 2
          ? this.engine.findRoute(start, end).path
          : findPath(start, end, (x, y) => this.engine.blocked(x, y));
      if (path.length) return path;
    }
    return [];
  }

  act(input: unknown) {
    const { rationale, ...request } = requestSchema.parse(input);
    const observation = this.observe();
    this.chronicle.explain(rationale);
    const result = this.engine.act(request);
    this.trajectory.push({
      observation,
      request,
      result,
      hash: this.engine.hash(),
    });
    return { ...result, observation: this.observe() };
  }
}
