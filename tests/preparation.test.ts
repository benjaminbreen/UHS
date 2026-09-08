import { expect, it } from "vitest";
import { createSession } from "../src/runtime/session";
import { createSettlementWorld } from "../src/world/v3/generate";
import { integratedSetting } from "../src/content/geography/defaults";
import { packForSetting } from "../src/content/geography/pack";
import { places } from "../src/content/geography/places";
import { settingFor } from "../src/content/geography/resolve";

it.each(["konya", "alexandria"])(
  "prepared %s preserves initial state, geometry and command outcomes",
  (place) => {
    const setting = integratedSetting(
      settingFor(
        places.find((p) => p.id === place)!,
        place === "konya" ? -6499 : -225,
      ),
    );
    const seed = "tiber-100";
    const world = createSettlementWorld(packForSetting(setting), seed);
    const prepared = structuredClone(world.prepare());
    const engine = createSession(
      "atlas",
      seed,
      undefined,
      setting,
      2,
      3,
      prepared,
    );
    const reference = createSession("atlas", seed, undefined, setting);
    expect(engine.state).toEqual(reference.state);
    for (const [x, y] of [
      [0, 0],
      [-30, 20],
      [50, 30],
      [120, -5],
      [-192, -64],
    ]) {
      expect(engine.world.topography!(x, y)).toEqual(
        reference.world.topography!(x, y),
      );
      expect(engine.world.decoration(x, y)).toEqual(
        reference.world.decoration(x, y),
      );
    }
    for (let i = 0; i < 8; i++) {
      const request = {
        actionId: `prepared-${i}`,
        expectedRevision: engine.state.revision,
        command: { type: "wait" as const, seconds: 6 },
      };
      expect(engine.act(request)).toEqual(reference.act(request));
    }
    expect(engine.state).toEqual(reference.state);
  },
  60000,
);
