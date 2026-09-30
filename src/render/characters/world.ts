import { characterShadow } from "./shadow";
import { watchCount } from "../../runtime/vitals";
import { lightingPreset, type LightingId } from "../lighting";
import Phaser from "phaser";
import { statsOf } from "../../core/stats";
import { restingExpressionOf, type RestingExpression } from "../../core/persona";
import type { Actor, Stats } from "../../core/types";
import {
  actorAppearance,
  type AppearancePalette,
  type CharacterAppearance,
} from "../../core/character";
import {
  defaultRenderer,
  outlineCharacter,
  outlined,
  renderers,
  type RendererId,
} from "./renderers";
import { setSpriteLight, spriteLightFor } from "./v2/pixels";
import { iconCarriedArt, loadCarriedArt, type CarriedArt } from "./props";
import {
  drawGarmentIcon,
  garmentIconFor,
  itemIconFor,
  GARMENT_ICON,
} from "../garment-icons";
import { parseCloth } from "../../content/characters/wardrobe/cloth";
import type { CharacterPose } from "./poses";
import { frameCount } from "./poses";
import { smallMemoryDevice } from "../../runtime/device";
import { timed } from "../perf-switches";
import type { CharacterFrameRequest, CharacterFrameResponse } from "./worker";

/** Scene-owned frames, retained for backtracking and bounded by texture count. */
export class WorldCharacters {
  private props = new Map<string, CarriedArt>();
  private cache = new Map<
    string,
    {
      key: string;
      used: number;
      canvas: HTMLCanvasElement;
      shadows: Map<LightingId, string>;
    }
  >();
  private frameSignatures = new Map<string, string>();
  private lastFrames = new Map<string, string>();
  private wanted = new Map<string, string>();
  private pending = new Map<string, {
    request: Omit<CharacterFrameRequest, "prop">;
    prop?: CarriedArt;
    used: number;
    ahead: boolean;
  }>();
  private propPixels = new WeakMap<CarriedArt, Uint8ClampedArray>();
  private pool: { worker: Worker; busy?: string }[] = [];
  private workersStarted = false;
  private limit = smallMemoryDevice() ? 128 : 384;
  private serial = 0;
  /** Interned appearance descriptions: the per-frame cache key must stay short. */
  private appearanceTokens = new Map<string, number>();
  private appearances = new Map<
    string,
    {
      sprite: string;
      age?: number;
      stats?: Stats;
      palette?: AppearancePalette;
      source?: CharacterAppearance;
      appearance: CharacterAppearance;
      signature: string;
      expression: RestingExpression;
      used: number;
    }
  >();
  /** Set by the scene from the running world; an actor spawned without an
   * appearance is drawn from this rather than the unrestricted palette. */
  palette?: AppearancePalette;
  /** The hour the figures are lit for. Frames are cached per phase, so this is
   * six rasters of a pose in the worst case, not one per minute. */
  light: LightingId = "midday";
  outline = true;
  renderer: RendererId = defaultRenderer;
  private disposed = false;
  private lastPrune = 0;
  constructor(private scene: Phaser.Scene, private seed = "") {
    watchCount("actorFrames", () => this.cache.size);
    watchCount("actorFrameQueue", () => this.pending.size);
    void loadCarriedArt()
      .then((p) => {
        if (!this.disposed) this.props = p;
      })
      .catch(console.error);
  }
  /** `icon:<item id>` is drawn from the icon art the first time it is asked
   * for, then cached beside the prop art. */
  private carried(prop: string | undefined): CarriedArt | undefined {
    if (!prop) return undefined;
    // `sprite@style` is the same art borne another way: on the head or back.
    const [key, style] = prop.split("@");
    if (style) {
      let art = this.props.get(prop);
      if (art) return art;
      const plain = this.carried(key);
      if (!plain) return undefined;
      art =
        style === "head" || style === "back"
          ? { ...plain, sprite: prop, kind: style }
          : plain;
      this.props.set(prop, art);
      return art;
    }
    const known = this.props.get(prop);
    if (known || !prop.startsWith("icon:")) return known;
    const id = prop.slice(5);
    const parsed = parseCloth(id);
    const base = parsed?.base ?? id;
    const icon = garmentIconFor(base) ?? itemIconFor(base);
    if (!icon) return undefined;
    const art = iconCarriedArt(
      prop,
      (ctx) => drawGarmentIcon(ctx, icon, 0, 0, parsed?.cloth),
      GARMENT_ICON,
    );
    if (art) this.props.set(prop, art);
    return art;
  }
  private token(description: string) {
    let id = this.appearanceTokens.get(description);
    if (id === undefined)
      this.appearanceTokens.set(description, (id = this.appearanceTokens.size));
    return String(id);
  }
  private startWorkers() {
    if (this.workersStarted) return;
    this.workersStarted = true;
    if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined")
      return;
    try {
      const count = smallMemoryDevice() ? 1 : Math.min(2, Math.max(1, (navigator.hardwareConcurrency ?? 4) - 1));
      for (let i = 0; i < count; i++) {
        const slot: { worker: Worker; busy?: string } = {
          worker: new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
        };
        this.pool.push(slot);
        slot.worker.onmessage = (event: MessageEvent<CharacterFrameResponse>) => {
          if (this.disposed) return;
          const { signature, pixels, error } = event.data;
          if (error || !pixels) {
            this.stopWorkers();
            return;
          }
          const pending = this.pending.get(signature);
          this.pending.delete(signature);
          slot.busy = undefined;
          if (pending && this.scene.time.now - pending.used < 2000) {
            timed("character install", () => {
              const canvas = document.createElement("canvas");
              canvas.width = canvas.height = 80;
              canvas.getContext("2d", { willReadFrequently: true })!.putImageData(
                new ImageData(new Uint8ClampedArray(pixels), 80, 80), 0, 0,
              );
              this.install(signature, canvas);
              const token = signature.split(":")[0];
              const renderer = signature.split(":").at(-1);
              for (const [id, wanted] of this.wanted) {
                const previous = this.lastFrames.get(id);
                if (wanted.startsWith(`${token}:`) && wanted.endsWith(`:${renderer}`) &&
                  (!previous?.startsWith(`${token}:`) || !previous.endsWith(`:${renderer}`)))
                  this.lastFrames.set(id, signature);
              }
            });
          }
          this.pump();
        };
        slot.worker.onerror = () => this.stopWorkers();
        slot.worker.onmessageerror = () => this.stopWorkers();
      }
    } catch {
      this.stopWorkers();
    }
  }
  private stopWorkers() {
    for (const slot of this.pool) slot.worker.terminate();
    this.pool = [];
    this.pending.clear();
  }
  private pump() {
    const wanted = new Set(this.wanted.values());
    const player = this.wanted.get("player");
    const busy = new Set(this.pool.map((slot) => slot.busy));
    for (const [signature, job] of this.pending)
      if (!busy.has(signature) && this.scene.time.now - job.used >= 2000)
        this.pending.delete(signature);
    for (const slot of this.pool) {
      if (slot.busy) continue;
      let selected: string | undefined;
      let best = -1;
      for (const [signature, job] of this.pending) {
        if (busy.has(signature)) continue;
        const priority = signature === player ? 3 : wanted.has(signature) ? 2 : job.ahead ? 1 : 0;
        if (priority > best) [selected, best] = [signature, priority];
      }
      if (!selected) continue;
      const job = this.pending.get(selected)!;
      let prop: CharacterFrameRequest["prop"];
      if (job.prop) {
        let pixels = this.propPixels.get(job.prop);
        if (!pixels) {
          pixels = job.prop.image.getContext("2d")!.getImageData(0, 0, job.prop.width, job.prop.height).data;
          this.propPixels.set(job.prop, pixels);
        }
        const { image: _image, ...art } = job.prop;
        prop = { ...art, pixels };
      }
      slot.busy = selected;
      busy.add(selected);
      try {
        slot.worker.postMessage({ ...job.request, prop });
      } catch {
        this.stopWorkers();
        return;
      }
    }
  }
  private install(signature: string, canvas: HTMLCanvasElement) {
    const key = `character-${this.scene.sys.settings.key}-${++this.serial}`;
    this.scene.textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    const entry = { key, used: this.scene.time.now, canvas, shadows: new Map<LightingId, string>() };
    this.cache.set(signature, entry);
    this.frameSignatures.set(key, signature);
    if (this.cache.size > this.limit) this.prune();
    return entry;
  }
  frame(
    actor: Pick<
      Actor,
      "id" | "sprite" | "appearance" | "age" | "direction" | "facing" | "stats"
    >,
    pose: CharacterPose,
    frame: number,
    prop?: string,
    turn = 0,
    condition = 0,
  ) {
    let resolved = this.appearances.get(actor.id);
    if (
      !resolved ||
      resolved.palette !== this.palette ||
      resolved.sprite !== actor.sprite ||
      resolved.age !== actor.age ||
      resolved.stats !== actor.stats ||
      resolved.source !== actor.appearance
    ) {
      const appearance = actorAppearance(actor, this.palette);
      const expression = restingExpressionOf(statsOf(this.seed, actor));
      resolved = {
        sprite: actor.sprite,
        age: actor.age,
        stats: actor.stats,
        palette: this.palette,
        source: actor.appearance,
        appearance,
        expression,
        signature: this.token(`${JSON.stringify(appearance)}:${expression}`),
        used: 0,
      };
      this.appearances.set(actor.id, resolved);
    }
    resolved.used = this.scene.time.now;
    const a = resolved.appearance,
      art = this.carried(prop);
    const signature = `${resolved.signature}:${actor.facing === undefined ? actor.direction : `f${actor.facing}`}:${pose}:${frame}:${art?.sprite ?? ""}:${this.light}:${this.outline ? 1 : 0}:${turn}:${condition}:${this.renderer}`;
    this.wanted.set(actor.id, signature);
    if (this.renderer === "c" || this.renderer === "d") this.startWorkers();
    if (this.pool.length && (this.renderer === "c" || this.renderer === "d")) {
      const preset = lightingPreset(this.light);
      const request: CharacterFrameRequest = {
        signature, renderer: this.renderer, appearance: a,
        direction: actor.direction, facing: actor.facing, expression: resolved.expression, pose, frame, turn, condition,
        outline: this.outline,
        light: {
          ...spriteLightFor(preset.cast, this.light === "night"),
          warm: `#${preset.tint}`,
          cool: preset.ambientAlpha ? `#${preset.ambient}` : "#241c38",
        },
      };
      for (const ahead of turn ? [false] : [false, true]) {
        const next = ahead ? (frame + 1) % frameCount(pose) : frame;
        const key = ahead
          ? `${resolved.signature}:${actor.facing === undefined ? actor.direction : `f${actor.facing}`}:${pose}:${next}:${art?.sprite ?? ""}:${this.light}:${this.outline ? 1 : 0}:${turn}:${condition}:${this.renderer}`
          : signature;
        if (this.cache.has(key)) continue;
        const pending = this.pending.get(key);
        if (pending) {
          pending.used = this.scene.time.now;
          if (!ahead) pending.ahead = false;
        } else if (this.pending.size < 128)
          this.pending.set(key, { request: { ...request, signature: key, frame: next }, prop: art, used: this.scene.time.now, ahead });
      }
      this.pump();
      let entry = this.cache.get(signature);
      if (entry) this.lastFrames.set(actor.id, signature);
      else {
        const previous = this.lastFrames.get(actor.id);
        if (previous?.startsWith(`${resolved.signature}:`) && previous.endsWith(`:${this.renderer}`))
          entry = this.cache.get(previous);
      }
      if (entry) entry.used = this.scene.time.now;
      return entry?.key;
    }
    let entry = this.cache.get(signature);
    if (!entry) {
      const c = document.createElement("canvas");
      c.width = 80;
      c.height = 80;
      // Shadows and Phaser's CanvasTexture read these pixels immediately.
      // Keep the tiny source on the CPU to avoid synchronous GPU readbacks.
      const preset = lightingPreset(this.light);
      setSpriteLight({
        ...spriteLightFor(preset.cast, this.light === "night"),
        warm: `#${preset.tint}`,
        cool: preset.ambientAlpha ? `#${preset.ambient}` : "#241c38",
      });
      renderers[this.renderer].draw(
        c.getContext("2d", { willReadFrequently: true })!,
        a,
        actor.direction,
        pose,
        frame,
        art,
        actor.facing,
        resolved.expression,
        ...((turn || condition ? [turn, condition] : []) as [turn?: number, condition?: number]),
      );
      if (this.outline && !outlined(this.renderer)) outlineCharacter(c.getContext("2d")!);
      setSpriteLight(undefined);
      entry = this.install(signature, c);
    }
    this.lastFrames.set(actor.id, signature);
    entry.used = this.scene.time.now;
    return entry.key;
  }
  shadow(key: string, phase: LightingId) {
    const entry = this.cache.get(this.frameSignatures.get(key)!)!;
    let texture = entry.shadows.get(phase);
    if (!texture) {
      texture = `${key}-shadow-${phase}`;
      this.scene.textures
        .addCanvas(texture, characterShadow(entry.canvas, phase))
        ?.setFilter(Phaser.Textures.FilterMode.NEAREST);
      entry.shadows.set(phase, texture);
    }
    return texture;
  }
  prune() {
    if (this.cache.size <= this.limit && this.scene.time.now - this.lastPrune < 1000) return;
    this.lastPrune = this.scene.time.now;
    for (const [id, appearance] of this.appearances)
      if (this.scene.time.now - appearance.used > 3000) {
        this.appearances.delete(id);
        this.lastFrames.delete(id);
        this.wanted.delete(id);
      }
    const pinned = new Set(this.lastFrames.values());
    const entries = [...this.cache].sort((a, b) => a[1].used - b[1].used);
    for (const [signature, entry] of entries)
      if (!pinned.has(signature) &&
        (this.scene.time.now - entry.used > 60000 || this.cache.size > this.limit)) {
        this.scene.textures.remove(entry.key);
        for (const key of entry.shadows.values())
          this.scene.textures.remove(key);
        this.cache.delete(signature);
        this.frameSignatures.delete(entry.key);
      }
  }
  destroy() {
    this.disposed = true;
    this.stopWorkers();
    for (const entry of this.cache.values()) {
      this.scene.textures.remove(entry.key);
      for (const key of entry.shadows.values()) this.scene.textures.remove(key);
    }
    this.cache.clear();
    this.frameSignatures.clear();
    this.lastFrames.clear();
    this.wanted.clear();
    this.appearances.clear();
    this.appearanceTokens.clear();
  }
}
