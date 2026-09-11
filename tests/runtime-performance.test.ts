import { afterEach, expect, it, vi } from "vitest";
import { createSession, Runtime } from "../src/runtime/session";
import { prepareSettingSession } from "../src/runtime/preparation";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";

afterEach(() => vi.unstubAllGlobals());

it("reuses visibility for presentation changes and isolates public observations", () => {
  const engine = createSession("roman", "presentation-cache");
  const observe = vi.spyOn(engine, "observe");
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.select("player");
  runtime.setZoom(2);
  runtime.stop();
  expect(observe).toHaveBeenCalledTimes(1);
  const result = runtime.act({
    actionId: "cached-observation",
    expectedRevision: 0,
    command: { type: "wait", seconds: 6 },
  });
  expect(observe).toHaveBeenCalledTimes(2);
  expect(result.observation.clock).toBe(engine.state.clock);
  result.observation.player.name = "External edit";
  expect(runtime.getSnapshot().observation.player.name).not.toBe(
    "External edit",
  );
  expect(engine.state.player.name).not.toBe("External edit");
  runtime.dispose();
});

it("does not start a tile worker until terrain is requested", () => {
  const worker = vi.fn(function () {
    return { terminate: vi.fn() };
  });
  vi.stubGlobal("Worker", worker);
  const runtime = new Runtime(createSession("roman", "idle-worker"));
  expect(worker).not.toHaveBeenCalled();
  runtime.dispose();
});

it("terminates world preparation when the loading view is cancelled", async () => {
  const terminate = vi.fn();
  vi.stubGlobal(
    "Worker",
    vi.fn(function () {
      return {
        terminate,
        postMessage: vi.fn(),
        onmessage: null,
        onerror: null,
      };
    }),
  );
  const controller = new AbortController();
  const pending = prepareSettingSession(
    settingFor(places.find((p) => p.id === "alexandria")!, -225),
    "cancel-world",
    controller.signal,
  );
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  expect(terminate).toHaveBeenCalled();
});

it("matches full-world visibility after movement, interiors and building changes", () => {
  const engine = createSession("roman", "visibility-candidates");
  const check = () => {
    const observation = engine.observe();
    expect(observation.actors.map((a) => a.id)).toEqual(
      engine.state.actors.filter((a) => engine.visible(a.pos)).map((a) => a.id),
    );
    expect(observation.objects.map((o) => o.id)).toEqual(
      engine.state.objects
        .filter((o) => engine.visible(o.pos))
        .map((o) => o.id),
    );
    expect(observation.places.map((p) => p.id)).toEqual(
      engine.world.places
        .filter((p) => engine.visible({ ...p.entrance, space: "outside" }))
        .map((p) => p.id),
    );
  };
  const places = [...engine.world.places];
  for (const place of places) {
    for (const offset of [-19, -1, 0, 1, 19]) {
      engine.state.player.pos = {
        x: place.x + offset,
        y: place.y,
        space: "outside",
      };
      check();
    }
    engine.state.player.pos = { x: 2, y: 2, space: place.id };
    check();
  }
  engine.state.player.pos = { ...places[0].entrance, space: "outside" };
  check();
  engine.world.places.push({
    ...places[0],
    id: "new-visibility-wall",
    x: engine.state.player.pos.x + 1,
    y: engine.state.player.pos.y - 10,
    w: 1,
    h: 20,
  });
  check();
  engine.world.places.pop();
  check();
});
