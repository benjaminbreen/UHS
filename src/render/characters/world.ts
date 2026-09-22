import { characterShadow } from "./shadow";
import { watchCount } from "../../runtime/vitals";
import { lightingPreset, type LightingId } from "../lighting";
import Phaser from "phaser";
import type { Actor } from "../../core/types";
import {
  actorAppearance,
  type AppearancePalette,
  type CharacterAppearance,
} from "../../core/character";
import { drawCharacter } from "./renderers";
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
  /** Interned appearance descriptions: the per-frame cache key must stay short. */
  private appearanceTokens = new Map<string, number>();
  private appearances = new Map<
    string,
    {
      sprite: string;
      age?: number;
      palette?: AppearancePalette;
      source?: CharacterAppearance;
      appearance: CharacterAppearance;
      signature: string;
      used: number;
    }
  >();
  /** Set by the scene from the running world; an actor spawned without an
   * appearance is drawn from this rather than the unrestricted palette. */
  palette?: AppearancePalette;
  /** The hour the figures are lit for. Frames are cached per phase, so this is
   * six rasters of a pose in the worst case, not one per minute. */
  light: LightingId = "midday";
  private disposed = false;
  private lastPrune = 0;
  constructor(private scene: Phaser.Scene) {
    watchCount("actorFrames", () => this.cache.size);
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
  frame(
    actor: Pick<
      Actor,
      "id" | "sprite" | "appearance" | "age" | "direction" | "facing"
    >,
    pose: CharacterPose,
    frame: number,
    prop?: string,
  ) {
    let resolved = this.appearances.get(actor.id);
    if (
      !resolved ||
      resolved.palette !== this.palette ||
      resolved.sprite !== actor.sprite ||
      resolved.age !== actor.age ||
      resolved.source !== actor.appearance
    ) {
      const appearance = actorAppearance(actor, this.palette);
      resolved = {
        sprite: actor.sprite,
        age: actor.age,
        palette: this.palette,
        source: actor.appearance,
        appearance,
        signature: this.token(JSON.stringify(appearance)),
        used: 0,
      };
      this.appearances.set(actor.id, resolved);
    }
    resolved.used = this.scene.time.now;
    const a = resolved.appearance,
      art = this.carried(prop);
    const signature = `${resolved.signature}:${actor.facing === undefined ? actor.direction : `f${actor.facing}`}:${pose}:${frame}:${art?.sprite ?? ""}:${this.light}`;
    let entry = this.cache.get(signature);
    if (!entry) {
      const key = `character-${this.scene.sys.settings.key}-${++this.serial}`;
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
      drawCharacter(
        c.getContext("2d", { willReadFrequently: true })!,
        a,
        actor.direction,
        pose,
        frame,
        art,
        actor.facing,
      );
      setSpriteLight(undefined);
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
    this.appearanceTokens.clear();
  }
}
