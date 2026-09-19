import { expect, it } from "vitest";
import { createSession, Runtime } from "../src/runtime/session";

function fixture() {
  const e = createSession("roman", "hand-items");
  const rt = new Runtime(e, { cacheTerrain: false });
  e.state.player.inventory.bread = 1;
  return { rt, e };
}

it("sets an item down where anyone can pick it up again", () => {
  const { rt, e } = fixture();
  rt.command({ type: "hold", item: "bread" });
  expect(e.state.player.heldItem).toBe("bread");
  rt.command({ type: "drop" });
  const loose = e.state.objects.find((o) => o.kind === "item");
  expect(loose?.item).toBe("bread");
  expect(e.state.player.heldItem).toBeUndefined();
  expect(e.state.player.inventory.bread ?? 0).toBe(0);
  // And back: the ground is not a hole.
  rt.command({ type: "interact", target: loose!.id, action: "pickup" });
  expect(e.state.player.heldItem).toBe("bread");
  expect(e.state.objects.some((o) => o.kind === "item")).toBe(false);
});

it("hands an item to somebody, who keeps it", () => {
  const { rt, e } = fixture();
  const other = e.state.actors.find((a) => a.kind === "human")!;
  other.pos = { ...e.state.player.pos };
  other.trust = 0;
  const before = other.inventory.bread ?? 0;
  rt.command({ type: "hold", item: "bread" });
  rt.command({ type: "give", target: other.id, item: "bread" });
  expect(other.inventory.bread).toBe(before + 1);
  expect(e.state.player.heldItem).toBeUndefined();
  expect(other.trust).toBe(1);
});

it("will not take a gift from somebody it has a grievance with", () => {
  const { rt, e } = fixture();
  const other = e.state.actors.find((a) => a.kind === "human")!;
  other.pos = { ...e.state.player.pos };
  other.trust = -1;
  rt.command({ type: "hold", item: "bread" });
  expect(
    e.validate({ type: "give", target: other.id, item: "bread" }),
  ).toBeTruthy();
});
