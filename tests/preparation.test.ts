import { expect, it, vi } from "vitest";
import { prepareSettingSession } from "../src/runtime/preparation";
import { createSession } from "../src/runtime/session";
import { prepareSettlement } from "../src/world/v3/generate";
import { propState } from "../src/content/props/place";
import { integratedSetting } from "../src/content/geography/defaults";
import { packForSetting } from "../src/content/geography/pack";
import { places } from "../src/content/geography/places";
import { settingFor } from "../src/content/geography/resolve";
import * as device from "../src/runtime/device";
import * as session from "../src/runtime/session";
import * as store from "../src/runtime/prepared-store";
import * as travelWaterways from "../src/world/travel/waterways";
import { releaseTerrainWorker, retainTerrainWorker, takeSpareTerrainWorkers, takeTerrainWorker, warmTerrainPool } from "../src/runtime/terrain-worker-owner";
import type { TerrainRequest } from "../src/render/terrain-worker";
import type { WorldModel } from "../src/core/types";
import type { WorldPreparationRequest, WorldPreparationResult } from "../src/world/worker";

it.each([true, false])("hands off a prepared world with phone memory policy %s", async (phone) => {
  const setting = settingFor(places.find((p) => p.id === "konya")!, -6499);
  const engine = createSession("roman", "handoff");
  const prepared = { sites: [], plans: [] } as unknown as WorldPreparationResult["prepared"];
  const order: string[] = [];
  const terminate = vi.fn(() => { order.push("terminate"); });
  const requests: WorldPreparationRequest[] = [];
  vi.spyOn(device, "smallMemoryDevice").mockReturnValue(phone);
  const create = vi.spyOn(session, "createSession").mockImplementation(() => {
    order.push("session");
    return engine;
  });
  vi.stubGlobal("Worker", class {
    terminate = terminate;
    onmessage?: (event: { data: { prepared: typeof prepared } | { hello: true } }) => void;
    postMessage(request: typeof requests[number]) {
      requests.push(request);
      queueMicrotask(() => this.onmessage?.({ data: "hello" in request ? request : { prepared } }));
    }
  });
  try {
    await expect(prepareSettingSession(setting, "handoff", undefined, false)).resolves.toBe(engine);
    expect(requests.map((r) => Object.keys(r)[0])).toEqual(["hello", "prepare"]);
    expect("prepare" in requests[1] && requests[1].prepare).toMatchObject({ retire: phone, setting: { placeId: setting.placeId } });
    expect(create).toHaveBeenCalledWith("atlas", "handoff", expect.objectContaining({ prepared }));
    expect(order).toEqual(phone ? ["terminate", "session"] : ["session"]);
    const retained = takeTerrainWorker(engine.world);
    expect(!!retained).toBe(!phone);
    retained?.terminate();
    expect(terminate).toHaveBeenCalledTimes(1);
  } finally {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  }
}, 60000);

it("starts the terrain pool warm beside the retained worker and ends it with the world", () => {
  const posted = new Map<object, TerrainRequest[]>();
  const terminate = vi.fn();
  vi.spyOn(device, "workerBudget").mockReturnValue(3);
  vi.stubGlobal("Worker", class {
    terminate = terminate;
    postMessage(request: TerrainRequest) { posted.set(this, [...posted.get(this) ?? [], request]); }
  });
  try {
    const world = { pack: {}, spawn: { x: 20, y: -5 }, topography: () => undefined, prepare: () => ({}) } as unknown as WorldModel;
    const retained = new Worker("retained");
    retainTerrainWorker(world, retained);
    warmTerrainPool(world, "pool");
    const ground = { ground: { x: -8, y: -40, size: 64 } };
    expect(posted.get(retained)).toEqual([ground]);
    const spares = [...posted.keys()].filter((w) => w !== retained);
    expect(spares.map((w) => posted.get(w)!.map((r) => Object.keys(r)[0]))).toEqual([["pack", "ground"], ["pack", "ground"]]);
    expect(posted.get(spares[0])![1]).toEqual(ground);
    releaseTerrainWorker(world);
    expect(terminate).toHaveBeenCalledTimes(3);
    expect(takeSpareTerrainWorkers(world)).toEqual([]);
  } finally {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  }
});

it("keeps a worker cancelled while loading for the next start, and terminates one cancelled at work", async () => {
  let controller = new AbortController();
  const terminate = vi.fn();
  let created = 0,
    loaded = false;
  vi.useFakeTimers();
  vi.stubGlobal("Worker", class {
    terminate = terminate;
    onmessage?: (event: { data: { hello: true } }) => void;
    constructor() { created++; }
    postMessage(request: WorldPreparationRequest) {
      if ("prepare" in request || !loaded) controller.abort();
      else queueMicrotask(() => this.onmessage?.({ data: { hello: true } }));
    }
  });
  try {
    const setting = settingFor(places.find((p) => p.id === "konya")!, -6499);
    await expect(prepareSettingSession(setting, "cancel", controller.signal, false))
      .rejects.toMatchObject({ name: "AbortError" });
    expect(terminate).not.toHaveBeenCalled();
    controller = new AbortController();
    loaded = true;
    await expect(prepareSettingSession(setting, "cancel", controller.signal, false))
      .rejects.toMatchObject({ name: "AbortError" });
    expect(created).toBe(1);
    expect(terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  }
});

it("indexes an existing prepared map by its inputs so the next load skips river sampling", async () => {
  const setting = settingFor(places.find((p) => p.id === "konya")!, -6499);
  const playableMap = { id: "tile:175,-201", size: 384 as const, exits: [{ id: "edge", to: "tile:175,-202", bearing: "N", mode: "land" }] };
  const resolved = { ...playableMap, exits: [{ ...playableMap.exits[0], waterways: [{ at: 0.5, width: 0.02, flow: 1 }] }] };
  const seed = "cache-test";
  const prepared = { props: propState() } as WorldPreparationResult["prepared"];
  const key = store.preparedKey({ ...setting, playableMap: resolved }, seed);
  let row: Parameters<typeof store.savePrepared>[0] = { key, prepared };
  const sample = vi.spyOn(travelWaterways, "withTravelWaterways").mockReturnValue(resolved);
  vi.spyOn(store, "loadPrepared").mockImplementation(async (lookup, byRecipe) =>
    lookup === (byRecipe ? row.recipe : row.key) ? row : undefined);
  const save = vi.spyOn(store, "savePrepared").mockImplementation(async (entry) => { row = entry; });
  const generator = await import("../src/world/v3/generate");
  const build = vi.spyOn(generator, "prepareSettlement").mockReturnValue({ world: {} as ReturnType<typeof prepareSettlement>["world"], prepared });
  const worker = { onmessage: (_event: { data: WorldPreparationRequest }) => {}, postMessage: (_data: WorldPreparationResult) => {} };
  vi.stubGlobal("self", worker);
  try {
    await import("../src/world/worker");
    const request = { prepare: { setting: { ...setting, playableMap }, seed, retire: true, cachePrepared: true, waterways: { source: setting, neighbors: [setting] } } };
    const load = () => new Promise((resolve) => {
      worker.postMessage = resolve;
      worker.onmessage({ data: structuredClone(request) });
    });
    await expect(load()).resolves.toEqual({ prepared, playableMap: resolved });
    await expect(load()).resolves.toEqual({ prepared, playableMap: resolved });
    expect(sample).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(row.key).toBe(key);
    expect(build.mock.calls.map(([, , cached]) => cached)).toEqual([prepared, prepared]);
  } finally {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  }
});

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
    const prepared = structuredClone(prepareSettlement(packForSetting(setting), seed).prepared);
    const engine = createSession(
      "atlas",
      seed,
      { setting, prepared },
    );
    const reference = createSession("atlas", seed, { setting });
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
    for (const world of [engine.world, reference.world]) world.activate?.(150, -150);
    expect(engine.world.initialObjects).toEqual(reference.world.initialObjects);
    expect(engine.world.fauna?.(150, -150)).toEqual(reference.world.fauna?.(150, -150));
  },
  60000,
);
