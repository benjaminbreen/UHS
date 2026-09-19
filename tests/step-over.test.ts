import { expect, it } from "vitest";
import { createSession, Runtime } from "../src/runtime/session";

function fixture(prop: string) {
  const e = createSession("roman", "step-over");
  const rt = new Runtime(e, { cacheTerrain: false });
  const p = e.state.player.pos;
  // Clear the two cells east of the player, then put the obstacle in the first.
  e.state.objects = e.state.objects.filter(
    (o) => !(o.pos.y === p.y && o.pos.x > p.x && o.pos.x <= p.x + 3),
  );
  e.state.objects.push({
    id: "in-the-way",
    name: prop === "pot" ? "Earthen pot" : "Upright loom",
    kind: "container",
    prop,
    sprite: "study-prop-pithos-0",
    pos: { x: p.x + 1, y: p.y, space: p.space },
    inventory: {},
  });
  return { e, rt, p: { ...p } };
}

it("stops at a pot once, then steps over it", () => {
  const { e, rt, p } = fixture("pot");
  rt.move(1, 0);
  expect(e.state.player.pos.x).toBe(p.x);
  expect(rt.notice).toMatch(/step again/i);
  // Insisting clears it in one hop, landing beyond the pot.
  rt.move(1, 0);
  expect(e.state.player.pos.x).toBe(p.x + 2);
});

it("does not step over what is too big to clear", () => {
  const { e, rt, p } = fixture("loom");
  rt.move(1, 0);
  rt.move(1, 0);
  expect(e.state.player.pos.x).toBe(p.x);
});
