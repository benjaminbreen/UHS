import { z } from "zod";
import { Engine } from "../core/engine";
import { commandSchema } from "../runtime/schema";
import type { CommandRequest, CommandResult } from "../core/types";
export const requestSchema = z
  .object({
    actionId: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
    expectedRevision: z.number().int().nonnegative(),
    command: commandSchema,
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
  constructor(readonly engine: Engine) {}
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
  act(input: unknown) {
    const request = requestSchema.parse(input);
    const observation = this.observe();
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
