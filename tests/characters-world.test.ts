import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type Phaser from "phaser";
import { originalAppearance } from "../src/core/character";
import { statsOf } from "../src/core/stats";
import { restingExpressionOf } from "../src/core/persona";
import { WorldCharacters } from "../src/render/characters/world";
import { renderers } from "../src/render/characters/renderers";
import type { CharacterFrameRequest, CharacterFrameResponse } from "../src/render/characters/worker";

vi.mock("phaser", () => ({ default: { Textures: { FilterMode: { NEAREST: 0 } } } }));
vi.mock("../src/render/characters/props", () => ({
  loadCarriedArt: () => Promise.resolve(new Map()),
  iconCarriedArt: vi.fn(),
}));
vi.mock("../src/render/characters/renderers", () => ({
  defaultRenderer: "d",
  renderers: Object.fromEntries(["a", "b", "c", "d"].map((id) => [id, { draw: vi.fn() }])),
  outlineCharacter: vi.fn(),
  outlined: () => false,
}));

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage?: (event: MessageEvent<CharacterFrameResponse>) => void;
  onerror?: () => void;
  onmessageerror?: () => void;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() { FakeWorker.instances.push(this); }
  finish() {
    const request = this.postMessage.mock.calls.at(-1)![0] as CharacterFrameRequest;
    this.onmessage?.({ data: { signature: request.signature, pixels: new Uint8ClampedArray(80 * 80 * 4) } } as MessageEvent<CharacterFrameResponse>);
  }
}

const scene = {
  time: { now: 0 },
  sys: { settings: { key: "test" } },
  textures: { addCanvas: vi.fn(() => ({ setFilter: vi.fn() })), remove: vi.fn() },
};
const actor = { id: "player", sprite: "human-0-0", direction: 2, appearance: originalAppearance };
let characters: WorldCharacters;

beforeEach(() => {
  vi.clearAllMocks();
  FakeWorker.instances = [];
  scene.time.now = 0;
  vi.stubGlobal("Worker", FakeWorker);
  vi.stubGlobal("OffscreenCanvas", class {});
  vi.stubGlobal("navigator", { hardwareConcurrency: 8 });
  vi.stubGlobal("ImageData", class { constructor(public data: Uint8ClampedArray) {} });
  vi.stubGlobal("document", { createElement: () => ({ width: 0, height: 0, getContext: () => ({ putImageData: vi.fn() }) }) });
  characters = new WorldCharacters(scene as unknown as Phaser.Scene);
});
afterEach(() => { characters.destroy(); vi.unstubAllGlobals(); });

it("uses the world's personality seed for residents without stored stats", () => {
  characters.destroy();
  characters = new WorldCharacters(scene as unknown as Phaser.Scene, "expression-review");
  characters.frame(actor, "idle", 0);
  const request = FakeWorker.instances[0].postMessage.mock.calls[0][0] as CharacterFrameRequest;
  expect(request.expression).toBe(restingExpressionOf(statsOf("expression-review", actor)));
});

it("separates identical appearances with different expressions and invalidates changed stats", () => {
  const stats = statsOf("seed", actor);
  const neutral = { ...actor, stats: { ...stats, extraversion: 50, agreeableness: 50, neuroticism: 50 } };
  characters.frame(neutral, "idle", 0);
  FakeWorker.instances[0].finish();
  const first = characters.frame(neutral, "idle", 0);
  const smiling = { ...neutral, stats: { ...neutral.stats, extraversion: 80 } };
  expect(characters.frame(smiling, "idle", 0)).toBeUndefined();
  const requests = FakeWorker.instances.flatMap((w) => w.postMessage.mock.calls.map(([r]) => r as CharacterFrameRequest));
  expect(requests.some((r) => r.expression === "smile")).toBe(true);
  const worker = FakeWorker.instances.find((w) => w.postMessage.mock.calls.at(-1)?.[0].expression === "smile")!;
  worker.finish();
  expect(characters.frame(smiling, "idle", 0)).not.toBe(first);
});

it("passes the same resting expression to synchronous rendering", () => {
  characters.renderer = "b";
  const stats = { ...statsOf("seed", actor), extraversion: 80 };
  characters.frame({ ...actor, stats }, "idle", 0);
  expect(renderers.b.draw).toHaveBeenLastCalledWith(
    expect.anything(), originalAppearance, 2, "idle", 0, undefined, undefined, "smile",
  );
});

it("deduplicates missing frames, prefetches the next, and draws off thread", () => {
  expect(characters.frame(actor, "walk", 0)).toBeUndefined();
  expect(characters.frame(actor, "walk", 0)).toBeUndefined();
  expect(renderers.d.draw).not.toHaveBeenCalled();
  expect(FakeWorker.instances.flatMap((w) => w.postMessage.mock.calls)).toHaveLength(2);
  FakeWorker.instances[0].finish();
  const first = characters.frame(actor, "walk", 0);
  expect(first).toMatch(/^character-test-/);
  expect(characters.frame(actor, "walk", 3)).toBe(first);
});

it("can display the first completed frame after the requested pose advances", () => {
  characters.frame(actor, "walk", 0);
  characters.frame(actor, "walk", 3);
  FakeWorker.instances[0].finish();
  expect(characters.frame(actor, "walk", 3)).toMatch(/^character-test-/);
});

it("does not show an old appearance while its replacement is pending", () => {
  characters.frame(actor, "idle", 0);
  FakeWorker.instances[0].finish();
  const changed = { ...actor, appearance: { ...originalAppearance, skin: "#987654" } };
  expect(characters.frame(changed, "idle", 0)).toBeUndefined();
  characters.frame(changed, "walk", 3);
  FakeWorker.instances[0].finish();
  expect(characters.frame(changed, "walk", 3)).toMatch(/^character-test-/);
});

it("retains reusable poses past three seconds and evicts unused frames later", () => {
  characters.renderer = "b";
  const first = characters.frame(actor, "walk", 0);
  characters.frame(actor, "idle", 0);
  scene.time.now = 5000;
  characters.prune();
  expect(scene.textures.remove).not.toHaveBeenCalledWith(first);
  expect(characters.frame(actor, "walk", 0)).toBe(first);
  characters.frame(actor, "idle", 0);
  scene.time.now = 70000;
  characters.prune();
  expect(scene.textures.remove).toHaveBeenCalledWith(first);
});

it("bounds retained textures while keeping the frame currently displayed", () => {
  characters.renderer = "b";
  const pinned = characters.frame(actor, "idle", 0);
  for (let i = 0; i < 450; i++) {
    scene.time.now = i;
    characters.frame({ ...actor, id: "npc", appearance: { ...originalAppearance, skin: `#${i.toString(16).padStart(6, "0")}` } }, "idle", 0);
  }
  expect(scene.textures.addCanvas.mock.calls.length - scene.textures.remove.mock.calls.length).toBeLessThanOrEqual(384);
  expect(scene.textures.remove).not.toHaveBeenCalledWith(pinned);
});

it("bounds queued work and discards results after scene destruction", () => {
  for (let i = 0; i < 200; i++) characters.frame({ ...actor, facing: i }, "walk", 0);
  const queued = (characters as unknown as { pending: Map<string, unknown> }).pending;
  expect(queued.size).toBeLessThanOrEqual(128);
  characters.destroy();
  FakeWorker.instances[0].finish();
  expect(scene.textures.addCanvas).not.toHaveBeenCalled();
  expect(FakeWorker.instances.every((w) => w.terminate.mock.calls.length > 0)).toBe(true);
});

it("falls back to the original renderer if worker startup or rendering fails", () => {
  characters.frame(actor, "idle", 0);
  FakeWorker.instances[0].onerror?.();
  expect(characters.frame(actor, "idle", 0)).toMatch(/^character-test-/);
  expect(renderers.d.draw).toHaveBeenCalledOnce();
  expect(FakeWorker.instances.every((w) => w.terminate.mock.calls.length > 0)).toBe(true);
});
