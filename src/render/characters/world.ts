import { characterShadow } from "./shadow";
import type { LightingId } from "../lighting";
import Phaser from "phaser";
import type { Actor } from "../../core/types";
import {
  actorAppearance,
  type CharacterAppearance,
} from "../../core/character";
import { drawCharacter } from "./draw";
import { loadCarriedArt, type CarriedArt } from "./props";
import type { CharacterPose } from "./poses";
/** Bounded scene-owned frame cache. Only current visible combinations are retained. */
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
  private serial = 0;
  private appearances = new Map<
    string,
    {
      sprite: string;
      age?: number;
      source?: CharacterAppearance;
      appearance: CharacterAppearance;
      signature: string;
      used: number;
    }
  >();
  private disposed = false;
  private lastPrune = 0;
  constructor(private scene: Phaser.Scene) {
    void loadCarriedArt()
      .then((p) => {
        if (!this.disposed) this.props = p;
      })
      .catch(console.error);
  }
  frame(
    actor: Pick<Actor, "id" | "sprite" | "appearance" | "age" | "direction">,
    pose: CharacterPose,
    frame: number,
    prop?: string,
  ) {
    let resolved = this.appearances.get(actor.id);
    if (
      !resolved ||
      resolved.sprite !== actor.sprite ||
      resolved.age !== actor.age ||
      resolved.source !== actor.appearance
    ) {
      const appearance = actorAppearance(actor);
      resolved = {
        sprite: actor.sprite,
        age: actor.age,
        source: actor.appearance,
        appearance,
        signature: JSON.stringify(appearance),
        used: 0,
      };
      this.appearances.set(actor.id, resolved);
    }
    resolved.used = this.scene.time.now;
    const a = resolved.appearance,
      art = prop ? this.props.get(prop) : undefined;
    const signature = `${resolved.signature}:${actor.direction}:${pose}:${frame}:${art?.sprite ?? ""}`;
    let entry = this.cache.get(signature);
    if (!entry) {
      const key = `character-${this.scene.sys.settings.key}-${++this.serial}`;
      const c = document.createElement("canvas");
      c.width = 80;
      c.height = 80;
      // Shadows and Phaser's CanvasTexture read these pixels immediately.
      // Keep the tiny source on the CPU to avoid synchronous GPU readbacks.
      drawCharacter(
        c.getContext("2d", { willReadFrequently: true })!,
        a,
        actor.direction,
        pose,
        frame,
        art,
      );
      this.scene.textures
        .addCanvas(key, c)
        ?.setFilter(Phaser.Textures.FilterMode.NEAREST);
      entry = { key, used: 0, canvas: c, shadows: new Map() };
      this.cache.set(signature, entry);
      this.frameSignatures.set(key, signature);
    }
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
    if (this.scene.time.now - this.lastPrune < 1000) return;
    this.lastPrune = this.scene.time.now;
    for (const [id, appearance] of this.appearances)
      if (this.scene.time.now - appearance.used > 3000)
        this.appearances.delete(id);
    for (const [signature, entry] of this.cache)
      if (this.scene.time.now - entry.used > 3000) {
        this.scene.textures.remove(entry.key);
        for (const key of entry.shadows.values())
          this.scene.textures.remove(key);
        this.cache.delete(signature);
        this.frameSignatures.delete(entry.key);
      }
  }
  destroy() {
    this.disposed = true;
    for (const entry of this.cache.values()) {
      this.scene.textures.remove(entry.key);
      for (const key of entry.shadows.values()) this.scene.textures.remove(key);
    }
    this.cache.clear();
    this.frameSignatures.clear();
    this.appearances.clear();
  }
}
