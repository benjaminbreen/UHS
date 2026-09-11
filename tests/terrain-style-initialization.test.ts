import { expect, it, vi } from "vitest";

it("starts ground and worker banks at the same altitude scale", async () => {
  vi.resetModules();
  const { groundStyle, setGroundStyle } = await import(
    "../src/render/ground-style"
  );
  const projection = await import("../src/render/terrain-projection");
  const style = groundStyle()!;
  expect(projection.TERRAIN_RISE).toBe(style.bank.rise);
  const initial = projection.TERRAIN_RISE;
  setGroundStyle(style);
  expect(projection.TERRAIN_RISE).toBe(initial);
  setGroundStyle(undefined);
  expect(projection.TERRAIN_RISE).toBe(projection.DEFAULT_TERRAIN_RISE);
});
