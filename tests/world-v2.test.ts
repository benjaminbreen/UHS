import { describe, it, expect } from "vitest";
import { resolveSetting, settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import {
  createSession,
  restoreSession,
  Runtime,
} from "../src/runtime/session";
import { findPath } from "../src/core/pathfinding";
import { worldWeaver } from "../server/world-weaver";
import { createAtlasWorld } from "../src/world/v2/generate";
import { packForSetting } from "../src/content/geography/pack";
import { settingSchema } from "../src/content/geography/types";
// Generator v2 fixtures deliberately stay on v2 as new starts advance to v3.
const createSettingSession = (setting: import("../src/content/geography/types").WorldSetting, seed="earth-2") => createSession("atlas",seed,undefined,setting,2,2);
const get = (text: string) => {
  const r = resolveSetting(text);
  if ("error" in r) throw Error(r.error);
  return r.setting;
};
describe("shared World Weaver / procedural geography", () => {
  it("resolves aliases, periods, explicit BCE dates, centuries, roles and climate treatments locally", () => {
    expect(get("Elizabethan London")).toMatchObject({
      placeId: "london",
      water: "river-ew",
    });
    expect(get("Hellenistic Alexandria")).toMatchObject({
      placeId: "alexandria",
      water: "coast-n",
    });
    expect(get("ancient roman legionary in umbria")).toMatchObject({
      placeId: "umbria",
      role: "Legionary",
      settlement: "camp",
    });
    expect(get("free black farmer in 19th century Haiti")).toMatchObject({
      placeId: "haiti",
      role: "Farmer",
      community: "Free Black household",
    });
    expect(get("paleolithic shaman siberia")).toMatchObject({
      climate: "tundra",
      settlement: "camp",
    });
    expect(get("Normandy 100 BCE").year).toBe(-99);
    expect(get("Beijing 14th century").year).toBeGreaterThanOrEqual(1301);
    expect(get("Beijing 14th century").year).toBeLessThanOrEqual(1400);
    expect(get("medieval").placeId).toBe("normandy");
    expect(resolveSetting("a place not in the catalog")).toHaveProperty(
      "error",
    );
    expect(new Set(places.map((p) => p.id)).size).toBe(places.length);
    for (const place of places) expect(() => settingFor(place)).not.toThrow();
    expect(get("19th-century Haiti").year).toBeGreaterThanOrEqual(1801);
    expect(get("19th-century Haiti").year).toBeLessThanOrEqual(1900);
    expect(get("Roman farmer in Haiti").placeId).toBe("haiti");
  });
  it("keeps north sea and east-west river geometry independent of request order, including negative chunks", () => {
    for (const query of [
      "Elizabethan London",
      "Hellenistic Alexandria",
      "Haiti",
      "Siberia",
    ]) {
      const setting = get(query),
        a = createSettingSession(setting, "seams"),
        b = createSettingSession(setting, "seams");
      const coords = [
        [-1, -1],
        [0, -1],
        [-1, 0],
        [0, 0],
        [1, 1],
      ];
      const chunks = coords.map(([x, y]) => a.world.chunk(x, y));
      for (const [x, y] of [...coords].reverse()) b.world.chunk(x, y);
      coords.forEach(([x, y], i) =>
        expect(b.world.chunk(x, y)).toEqual(chunks[i]),
      );
      expect(a.world.chunk(-1, 0)[63]).toBe(a.world.terrain(-1, 0));
      expect(a.world.blocked(a.world.spawn.x, a.world.spawn.y, "outside")).toBe(
        false,
      );
    }
    const alex = createSettingSession(get("Alexandria"), "sea").world;
    expect(alex.terrain(0, -250)).toBe("water");
    expect(alex.terrain(0, 80)).not.toBe("water");
    const london = createSettingSession(get("London"), "river").world;
    for (const x of [-300, -150, 0, 150, 300])
      expect(
        Array.from({ length: 130 }, (_, y) => london.terrain(x, y)).some(
          (t) => t === "water" || t === "bridge",
        ),
      ).toBe(true);
  }, 20000);
  it("has usable nearby entrances and conserves layout through saves, worker construction and replay", () => {
    for (const query of ["London", "Alexandria", "Haiti", "Siberia"]) {
      const setting = get(query),
        e = createSettingSession(setting, "doors");
      for (const p of e.world.places.filter((p) => Math.hypot(p.x, p.y) < 120))
        expect(
          findPath(
            e.state.player.pos,
            p.entrance,
            (x, y) => e.blocked(x, y),
            5000,
          ).length,
          p.id,
        ).toBeGreaterThan(0);
      const workerWorld = createAtlasWorld(packForSetting(setting), "doors");
      expect(workerWorld.chunk(0, 0)).toEqual(e.world.chunk(0, 0));
      const commands = [
        {
          actionId: "wait",
          expectedRevision: 0,
          command: { type: "wait" as const, seconds: 60 },
        },
      ];
      e.act(commands[0]);
      const restored = restoreSession(e.snapshot());
      expect(restored.hash()).toBe(e.hash());
      const step = {
        actionId: "step",
        expectedRevision: 1,
        command: { type: "move" as const, dx: 1, dy: 0 },
      };
      expect(restored.act(step)).toEqual(e.act(step));
      expect(restored.hash()).toBe(e.hash());
      commands.push(step as any);
      const rt = new Runtime(createSettingSession(setting, "unused"), {
        cacheTerrain: false,
      });
      rt.loadReplay({
        manifest: e.state.manifest,
        commands,
        finalHash: e.hash(),
      });
      commands.forEach(() => rt.stepReplay());
      expect(rt.engine.hash()).toBe(e.hash());
      rt.seekReplay(0);
      commands.forEach(() => rt.stepReplay());
      expect(rt.engine.hash()).toBe(e.hash());
      rt.dispose();
    }
  }, 20000);
  it("refuses incompatible manifests instead of silently regenerating them", () => {
    const saved = createSettingSession(get("London"), "version").snapshot();
    expect(() =>
      restoreSession({
        ...saved,
        manifest: { ...saved.manifest, generator: 3 },
      }),
    ).toThrow();
    expect(() =>
      restoreSession({
        ...saved,
        manifest: { ...saved.manifest, setting: undefined },
      }),
    ).toThrow();
    expect(() => settingSchema.parse({ ...get("London"), lat: 999 })).toThrow();
  });
  it("never calls a provider in free mode; protects and validates the optional World Weaver boundary", async () => {
    let calls = 0;
    const setting = settingFor(places.find((p) => p.id === "london")!);
    const provider = (async () => {
      calls++;
      return new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: JSON.stringify(setting) }] } },
          ],
        }),
      );
    }) as typeof fetch;
    const request = (code = "class") =>
      new Request("http://local/api/world-weaver", {
        method: "POST",
        headers: { "X-World-Weaver-Code": code },
        body: JSON.stringify({ prompt: "Elizabethan London" }),
      });
    const env = {
      UHS_WORLD_WEAVER_ENABLED: "1",
      GEMINI_API_KEY: "test-key",
      UHS_WORLD_WEAVER_ACCESS_CODE: "class",
    };
    expect((await worldWeaver(request(), {}, provider)).status).toBe(503);
    expect((await worldWeaver(request("wrong"), env, provider)).status).toBe(
      401,
    );
    expect(calls).toBe(0);
    const response = await worldWeaver(request(), env, provider);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.setting).toEqual(setting);
    expect(calls).toBe(1);
    const legacyRequest = new Request("http://local/api/world-weaver", {
      method: "POST",
      headers: { "X-Classroom-Code": "class" },
      body: JSON.stringify({ prompt: "Elizabethan London" }),
    });
    expect(
      (
        await worldWeaver(
          legacyRequest,
          {
            UHS_WORLD_WEAVER_ENABLED: "1",
            GEMINI_API_KEY: "test-key",
            UHS_CLASSROOM_CODE: "class",
          },
          provider,
        )
      ).status,
    ).toBe(200);
    const local = createSettingSession(setting, "parity"),
      enhanced = createSettingSession(body.setting, "parity");
    expect(local.hash()).toBe(enhanced.hash());
    const malformed = (async () =>
      new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: '{"version":2,"lat":999}' }] } },
          ],
        }),
      )) as typeof fetch;
    expect((await worldWeaver(request(), env, malformed)).status).toBe(502);
  });
});
