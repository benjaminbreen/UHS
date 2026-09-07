import { expect, it, vi } from "vitest";
import { createSession } from "../src/runtime/session";

it("accepts all eight directions, charges longer diagonals and prevents corner cutting", () => {
  const e = createSession("roman", "movement");
  const blocked = vi.spyOn(e, "blocked").mockReturnValue(false);
  let serial = 0;
  const move = (dx: number, dy: number) =>
    e.act({
      actionId: `movement-${serial++}`,
      expectedRevision: e.state.revision,
      command: { type: "move", dx, dy },
    });
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ]) {
    const before = { ...e.state.player.pos };
    const result = move(dx, dy);
    expect(result.status).toBe("completed");
    expect(result.elapsedSeconds).toBe(dx && dy ? 3 : 2);
    expect(e.state.player.pos).toEqual({
      ...before,
      x: before.x + dx,
      y: before.y + dy,
    });
  }
  const p = { ...e.state.player.pos };
  for (const [x, y] of [
    [p.x + 1, p.y],
    [p.x, p.y + 1],
    [p.x + 1, p.y + 1],
  ]) {
    blocked.mockImplementation((tx, ty) => tx === x && ty === y);
    expect(move(1, 1).status).toBe("rejected");
    expect(e.state.player.pos).toEqual(p);
  }
  for (const [dx, dy] of [
    [0, 0],
    [2, 0],
    [1, 2],
    [0.5, 1],
  ])
    expect(move(dx, dy).status).toBe("rejected");
});
