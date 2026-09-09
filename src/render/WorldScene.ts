import { natureTreeSprites } from "../content/ecology/vegetation";
import { canopyHidesPlayer } from "./canopy-visibility";
import { WorldCharacters } from "./characters/world";
import { entityInView, npcMotion } from "./entity-presentation";
import { poseTiming, type CharacterPose } from "./characters/poses";
import type { Actor } from "../core/types";
import { waterStyle } from "./water-style";
import { TerrainStream } from "./terrain-stream";
import {
  surfaceElevation,
  pickTerrain,
  TERRAIN_RISE,
} from "./terrain-projection";
import { buildingContains, buildingPlacement } from "./buildings";
import { terrainVariant, type RenderOptions } from "./appearance";
import Phaser from "phaser";
import type { Runtime } from "../runtime/session";
import type { Position, WorldModel } from "../core/types";
import { surfaceAt, hasQuay } from "./materials";
import { hash, random } from "../core/random";
import { heldObject } from "../core/props";
import { windProfile, windSway, type WindProfile } from "./wind";
/** Poll interval while a jump is in the air, matched to the sprite's arc. */
const JUMP_MS = 360;
const DIRECTION_KEYS = [
  "arrowleft",
  "arrowright",
  "arrowup",
  "arrowdown",
  "a",
  "d",
  "w",
  "s",
];
import {
  itineraryAt,
  type Ambient,
  type StationActivity,
} from "../core/itinerary";
import { lightingAt, lightingPreset, shadowFrame } from "./lighting";
import terrainFrames from "./generated/terrain.json" with { type: "json" };
const SCENERY_CACHE_REACH = 8;
/** People drawn at once. Beyond roughly this many the per-head frame cache,
 * not the simulation, is what costs the frame. */
const CROWD_LIMIT = 24;
/** Tiles of slack beyond the view for routine lookups. `entityInView` allows
 * 8 on x and 12 on y, so this must clear 12. */
const AMBIENT_MARGIN = 16;
/** Routines built per rendered frame. Around 3ms each, so this is most of a
 * frame's slack; it lasts a second or two on entering a settlement. */
const ROUTINE_BUILDS_PER_FRAME = 2;
/** Tiles of elbow room between drawn people. */
const SPACING = 0.95;
const ambientPoses: Record<StationActivity, CharacterPose> = {
  rest: "sit",
  work: "work",
  tend: "stoop",
  haul: "carry",
  "draw-water": "tug",
  gather: "stoop",
  visit: "talk",
  graze: "idle",
  play: "sway",
};
const workAlternates: Partial<
  Record<CharacterPose, [CharacterPose, CharacterPose]>
> = {
  work: ["lift", "sway"],
  stoop: ["kneel", "work"],
  tug: ["stoop", "sway"],
};
type WindSprite = {
  image: Phaser.GameObjects.Image;
  baseX: number;
  phase: number;
  profile: WindProfile;
};
export class WorldScene extends Phaser.Scene {
  private runtime: Runtime;
  private characters?: WorldCharacters;
  private heldSprites = new Map<string, string>();
  private humanActors = new Map<
    string,
    Pick<
      Actor,
      "id" | "sprite" | "appearance" | "age" | "direction" | "activity" | "held"
    >
  >();
  private canopies: { image: Phaser.GameObjects.Image; cut: number }[] = [];
  private windSprites: WindSprite[] = [];
  private ambient = new Map<string, Ambient>();
  /** Not drawn: indoors, or waiting on a routine. */
  private indoors = new Set<string>();
  /** Residents in range with no routine yet, nearest first. */
  private pendingRoutines: string[] = [];
  /** A routine was built since the last full pass, so someone is undrawn. */
  private routinesBuilt = false;
  private drawnCrowd = new Set<string>();
  private ambientDrawn = -Infinity;
  private modalOpen = false;
  private poseOffsets = new Map<string, number>();
  private layers: Phaser.GameObjects.GameObject[] = [];
  private ground?: Phaser.Tilemaps.TilemapLayer;
  private tilemap?: Phaser.Tilemaps.Tilemap;
  private shadows = new Map<string, Phaser.GameObjects.Image>();
  private ripples: { image: Phaser.GameObjects.Image; phase: number }[] = [];
  private rippleTime = -1;
  private entities = new Map<string, Phaser.GameObjects.Image>();
  private selection?: Phaser.GameObjects.Graphics;
  private routeOverlay?: Phaser.GameObjects.Graphics;
  private actorFrames = new Map<string, string>();
  private unsubscribe?: () => void;
  private staticKey = "";
  private terrainStream?: TerrainStream;
  private terrainAnchor?: { x: number; y: number };
  private drawnWorld?: WorldModel;
  private buildings = new Map<string, Phaser.GameObjects.Image>();
  private nextInput = 0;
  private motionDuration = 140;
  private heldDirections = new Set<string>();
  private shiftHeld = false;
  /** One throw per press of shift, so holding it does not empty your hands. */
  private throwArmed = false;
  private arcSerial = 0;
  private pendingDirection?: [number, number];
  private destinations = new Map<string, Position>();
  private lastTick = 0;
  private ready = false;

  private light = lightingAt(9 * 3600);
  private tint = 0xffffff;
  private shadowPhase = this.light.id;
  private night?: Phaser.GameObjects.Graphics;
  constructor(
    runtime: Runtime,
    private options: RenderOptions = {},
  ) {
    super("world");
    this.runtime = runtime;
  }
  preload() {
    this.load.atlas("nature", "/nature/atlas.png", "/nature/atlas.json");
    this.load.atlas(
      "nature-shadows",
      "/nature/shadows.png",
      "/nature/shadows.json",
    );
    this.load.atlas("ecology", "/ecology/atlas.png", "/ecology/atlas.json");
    this.load.atlas("props", "/props/atlas.png", "/props/atlas.json");
    this.load.atlas(
      "prop-shadows",
      "/props/shadows.png",
      "/props/shadows.json",
    );
    this.load.atlas("atlas", "/packs/atlas.png", "/packs/atlas.json");
    this.load.atlas(
      "lighting-shadows",
      "/packs/lighting-shadows.png",
      "/packs/lighting-shadows.json",
    );
    this.load.atlas(
      "topography",
      "/topography/atlas.png",
      "/topography/atlas.json",
    );
    this.load.image("terrain", "/packs/terrain.png");
  }
  create() {
    this.ready = true;
    this.characters = new WorldCharacters(this);
    this.events.once("shutdown", () => this.characters?.destroy());
    // Watched rather than queried: the input gate runs on every frame.
    const watchModals = new MutationObserver(() => {
      this.modalOpen = !!document.querySelector('[data-modal="true"]');
    });
    watchModals.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-modal"],
    });
    this.modalOpen = !!document.querySelector('[data-modal="true"]');
    this.events.once("shutdown", () => watchModals.disconnect());
    this.events.once("destroy", () => watchModals.disconnect());
    this.cameras.main.setBackgroundColor("#819253");
    this.cameras.main.roundPixels = !!this.options.lab;
    this.selection = this.add.graphics().setDepth(20000);
    this.routeOverlay = this.add.graphics().setDepth(20000);
    this.night = this.add.graphics().setDepth(19000).setScrollFactor(0);
    this.input.keyboard!.removeCapture([
      "UP",
      "DOWN",
      "LEFT",
      "RIGHT",
      "SPACE",
    ]);
    this.game.canvas.setAttribute("data-ready", "true");
    this.input.keyboard!.on("keydown", (event: KeyboardEvent) => {
      if (this.options.lab || event.metaKey || event.ctrlKey || event.altKey)
        return;
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        (active instanceof HTMLElement && active.isContentEditable) ||
        document.querySelector('[data-modal="true"]')
      )
        return;
      const key = event.key.toLowerCase();
      const steering = DIRECTION_KEYS.includes(key);
      if (steering) {
        event.preventDefault();
        this.heldDirections.add(key);
        if (!event.repeat) this.pendingDirection = this.direction();
      }
      // Shift pressed with nothing else held is a jump on the spot. Shift with
      // a direction is a traversal or a throw, and the movement poll has those.
      if (this.syncShift(event) && !steering && !this.direction().some(Boolean))
        this.runtime.hop();
    });
    this.input.keyboard!.on("keyup", (event: KeyboardEvent) => {
      this.syncShift(event);
      this.heldDirections.delete(event.key.toLowerCase());
    });
    const clearInput = () => {
      this.heldDirections.clear();
      this.shiftHeld = this.throwArmed = false;
      this.pendingDirection = undefined;
      this.runtime.stop();
    };
    this.game.events.on("blur", clearInput);
    this.events.once("shutdown", () =>
      this.game.events.off("blur", clearInput),
    );
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown() || this.options.lab) return;
      const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      let x = Math.floor(p.x / 16),
        y = Math.floor(p.y / 16);
      const world = this.runtime.engine.world;
      if (
        world.topography &&
        this.runtime.engine.state.player.pos.space === "outside"
      ) {
        const ox = x - 4,
          oy = y - 4;
        const hit = pickTerrain(
          (a, b) => world.topography!(a + ox, b + oy),
          9,
          13,
          p.x - ox * 16,
          p.y - oy * 16,
        );
        if (hit) {
          x = hit.x + ox;
          y = hit.y + oy;
        }
      }
      const obs = this.runtime.getSnapshot().observation;
      const actor = obs.actors.find(
        (a) => Math.abs(a.pos.x - x) <= 0.7 && Math.abs(a.pos.y - y) <= 0.7,
      );
      const object = obs.objects.find(
        (o) => Math.abs(o.pos.x - x) <= 0.8 && Math.abs(o.pos.y - y) <= 0.8,
      );
      const place = obs.places.find((b) => buildingContains(b, p.x, p.y));
      if (actor || object || place)
        this.runtime.select((actor || object || place)!.id);
      else {
        this.runtime.select(undefined);
        this.runtime.walkTo({ x, y });
      }
    });
    this.input.on(
      "wheel",
      (_p: unknown, _g: unknown, _dx: number, dy: number) => {
        if (dy && !this.options.lab)
          this.runtime.setZoom(this.runtime.zoom + (dy < 0 ? 1 : -1));
      },
    );
    const onResize = () => this.draw();
    this.scale.on("resize", onResize);
    this.unsubscribe = this.runtime.subscribe(() => this.draw());
    const cleanup = () => {
      this.ready = false;
      this.scale.off("resize", onResize);
      this.unsubscribe?.();
      this.terrainStream?.dispose();
      this.terrainStream = undefined;
    };
    this.events.once("shutdown", cleanup);
    this.events.once("destroy", cleanup);
    this.draw();
    this.options.onReady?.();
  }
  private lift(x: number, y: number) {
    const w = this.runtime.engine.world;
    return w.topography &&
      this.runtime.engine.state.player.pos.space === "outside"
      ? surfaceElevation(w.topography, x / 16 - 0.5, y / 16 - 1) * TERRAIN_RISE
      : 0;
  }
  /** Sends a sprite along a parabola to its landing tile. The height above the
   * ground is published as `arcLift`, which is what keeps the shadow behind. */
  private launch(
    im: Phaser.GameObjects.Image,
    arc: { height: number; duration: number },
    tx: number,
    ty: number,
  ) {
    this.tweens.killTweensOf(im);
    this.tweens.add({
      targets: im,
      x: tx,
      y: ty,
      duration: arc.duration,
      ease: "Linear",
      onUpdate: (tween: Phaser.Tweens.Tween) => {
        // Sine, not a parabola: it leaves and meets the ground less abruptly.
        const rise = arc.height * Math.sin(Math.PI * tween.progress);
        im.y -= rise;
        im.setData("arcLift", rise);
      },
      onComplete: () => {
        im.setPosition(tx, ty);
        im.setData("arcLift", 0);
      },
    });
  }
  private sprite(frame: string, x: number, y: number, depth: number) {
    const image = this.add
      .image(x, y - this.lift(x, y), this.texture(frame), frame)
      .setOrigin(0.5, 1)
      .setTint(this.tint)
      .setDepth(depth);
    this.layers.push(image);
    return image;
  }
  private addWind(
    image: Phaser.GameObjects.Image,
    frame: string,
    phase: number,
    isTree = false,
  ) {
    const profile = windProfile(frame, isTree);
    if (profile)
      this.windSprites.push({ image, baseX: image.x, phase, profile });
  }
  private texture(frame: string) {
    if (frame.startsWith("nature-")) return "nature";
    if (frame.startsWith("ecology-")) return "ecology";
    return frame.startsWith("study-prop-") || frame.startsWith("prop-broken-")
      ? "props"
      : "atlas";
  }
  private shadow(frame: string, x: number, y: number, transient = false) {
    if (this.options.shadows === false) return undefined;
    const key = shadowFrame(this.shadowPhase, frame);
    const texture =
      this.texture(frame) === "nature"
        ? "nature-shadows"
        : this.texture(frame) === "props"
          ? "prop-shadows"
          : "lighting-shadows";
    if (!this.textures.get(texture).has(key)) return undefined;
    const image = this.add
      .image(x, transient ? y : y - this.lift(x, y), texture, key)
      .setOriginFromFrame()
      .setDepth(this.runtime.engine.world.topography ? -1000 : -60000);
    if (!transient) this.layers.push(image);
    return image;
  }
  draw() {
    if (!this.ready || !this.cameras?.main) return;
    const rt = this.runtime,
      e = rt.engine,
      p =
        this.options.overview && this.options.center
          ? { ...this.options.center, space: "outside" }
          : e.state.player.pos,
      w = e.world;
    this.light = this.options.lighting
      ? lightingPreset(this.options.lighting)
      : lightingAt(e.state.clock);
    this.tint =
      this.options.colorGrade === false
        ? 0xffffff
        : parseInt(this.light.tint, 16);
    this.shadowPhase = p.space === "outside" ? this.light.id : "night";
    const c = this.cameras.main;
    c.setZoom(rt.zoom);
    if (!this.entities.has("player") && !this.options.overview)
      c.centerOn(p.x * 16 + 8, p.y * 16 + 8);
    if (w !== this.drawnWorld || p.space !== "outside") {
      this.terrainStream?.dispose();
      this.terrainStream = undefined;
      this.terrainAnchor = undefined;
    }
    if (w.topography && p.space === "outside") {
      this.terrainStream ??= new TerrainStream(this, w, e.state.manifest.seed);
      this.terrainStream.setView(
        p.x,
        p.y,
        Math.ceil(this.scale.width / rt.zoom / 32),
        Math.ceil(this.scale.height / rt.zoom / 32),
      );
    }
    // Scenery has a small movement allowance; the expensive ground and
    // contour textures are owned independently by TerrainStream.
    if (
      w.topography &&
      (!this.terrainAnchor ||
        Math.abs(p.x - this.terrainAnchor.x) > SCENERY_CACHE_REACH ||
        Math.abs(p.y - this.terrainAnchor.y) > SCENERY_CACHE_REACH)
    )
      this.terrainAnchor = { x: p.x, y: p.y };
    const bx = w.topography ? this.terrainAnchor!.x : Math.floor(p.x / 16) * 16,
      by = w.topography ? this.terrainAnchor!.y : Math.floor(p.y / 16) * 16;
    const key = [
      e.state.manifest.seed,
      w.pack.id,
      p.space,
      bx,
      by,
      rt.zoom,
      this.light.id,
      this.tint,
      this.scale.width,
      this.scale.height,
    ].join(":");
    if (key !== this.staticKey || w !== this.drawnWorld) {
      const sceneryStart = performance.now();
      this.drawnWorld = w;
      this.staticKey = key;
      for (const l of this.layers) l.destroy();
      this.layers = [];
      this.canopies = [];
      this.windSprites = [];
      this.ripples = [];
      this.buildings.clear();
      this.ground?.destroy();
      this.tilemap?.destroy();
      const margin = w.topography ? SCENERY_CACHE_REACH + 6 : 20;
      const halfX = Math.ceil(this.scale.width / rt.zoom / 32) + margin,
        halfY = Math.ceil(this.scale.height / rt.zoom / 32) + margin;
      const startX = bx - halfX,
        startY = by - halfY;
      const width = halfX * 2 + 16,
        height = halfY * 2 + 16;
      if (!w.topography || p.space !== "outside") {
        const data = Array.from({ length: height }, (_, iy) =>
          Array.from({ length: width }, (_, ix) => {
            const x = startX + ix,
              y = startY + iy;
            const t =
              p.space === "outside"
                ? surfaceAt(w, x, y, rt.terrainAt(x, y, p.space))
                : rt.terrainAt(x, y, p.space);
            const rendered =
              t === "snow"
                ? "sand"
                : t === "rock"
                  ? "dirt"
                  : t === "marsh"
                    ? "grass"
                    : t;
            const variant = terrainVariant(
              e.state.manifest.seed,
              rendered,
              x,
              y,
            );
            return (
              (terrainFrames as Record<string, number>)[
                t === "bridge"
                  ? w.pack.landscape.bridge === "stone"
                    ? `paving${variant}`
                    : "bridge"
                  : `${t === "water" ? w.pack.landscape.water : rendered}${variant}`
              ] ?? 0
            );
          }),
        );
        this.tilemap = this.make.tilemap({
          data,
          tileWidth: 16,
          tileHeight: 16,
        });
        const ts = this.tilemap.addTilesetImage(
          "terrain",
          "terrain",
          16,
          16,
          0,
          0,
        )!;
        this.ground = this.tilemap
          .createLayer(0, ts, startX * 16, startY * 16)!
          .setDepth(-100000)
          .setTint(this.tint);

        if (w.pack.setting && p.space === "outside") {
          this.ground.forEachTile((tile) => {
            const x = startX + tile.x,
              y = startY + tile.y,
              t = w.terrain(x, y);
            tile.tint =
              t === "snow"
                ? 0xe6edf3
                : t === "rock"
                  ? 0x99978b
                  : t === "marsh"
                    ? 0x668b76
                    : this.tint;
          });
        }
      }
      if (p.space === "outside") {
        const neighbors = [
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 0],
          [1, -1],
          [1, 1],
          [-1, 1],
          [-1, -1],
        ] as const;
        for (let y = startY; y < startY + height; y++)
          for (let x = startX; x < startX + width; x++) {
            const t = w.topography ? "grass" : surfaceAt(w, x, y);
            if (t === "water") {
              let mask = 0;
              neighbors.forEach(([dx, dy], i) => {
                const n = w.terrain(x + dx, y + dy);
                if (n !== "water" && n !== "bridge") mask |= 1 << i;
              });
              if (mask && !hasQuay(w, x, y))
                this.sprite(`bank-${mask}`, x * 16 + 8, y * 16 + 16, -70000);
              if (
                !mask &&
                random(e.state.manifest.seed, "ripple", x, y) < 0.28
              ) {
                const phase = Math.floor(
                  random(e.state.manifest.seed, "ripple-phase", x, y) * 4,
                );
                const image = this.sprite(
                  `ripple-${phase}`,
                  x * 16 + 8,
                  y * 16 + 16,
                  -85000,
                );
                this.ripples.push({ image, phase });
              }
            } else if (["dirt", "paving", "sand", "field"].includes(t)) {
              let mask = 0;
              neighbors.forEach(([dx, dy], i) => {
                if (surfaceAt(w, x + dx, y + dy) === w.pack.ground)
                  mask |= 1 << i;
              });
              if (mask)
                this.sprite(
                  `edge-${w.pack.ground}-${mask}`,
                  x * 16 + 8,
                  y * 16 + 16,
                  -80000,
                );
            }
            if (
              !w.topography &&
              w.terrain(x, y) === "water" &&
              w.terrain(x, y - 1) === "bridge" &&
              hasQuay(w, x, y)
            ) {
              let left = x;
              while (
                w.terrain(left - 1, y) === "water" &&
                w.terrain(left - 1, y - 1) === "bridge" &&
                x - left < 16
              )
                left--;
              if (
                (x - left) % 3 === 0 &&
                [0, 1, 2].every(
                  (dx) =>
                    w.terrain(x + dx, y) === "water" &&
                    w.terrain(x + dx, y - 1) === "bridge",
                )
              )
                this.sprite("bridge-arch", x * 16 + 24, y * 16 + 30, -65000);
            }
            if (
              !w.topography &&
              w.terrain(x, y) === "water" &&
              hasQuay(w, x, y)
            ) {
              for (const [side, dx, dy] of [
                ["east", 1, 0],
                ["west", -1, 0],
                ["north", 0, -1],
                ["south", 0, 1],
              ] as const) {
                if (w.terrain(x + dx, y + dy) !== "water")
                  this.sprite(`quay-${side}`, x * 16 + 8, y * 16 + 16, -70000);
              }
            }
            if (
              !w.topography &&
              w.terrain(x, y) === "sand" &&
              !hasQuay(w, x, y) &&
              surfaceAt(w, x, y) === "sand" &&
              random(e.state.manifest.seed, "reeds", x, y) <
                w.pack.landscape.reeds
            ) {
              const reeds = this.sprite(
                "reeds",
                x * 16 + 8,
                y * 16 + 16,
                y * 16 + 11,
              );
              this.addWind(
                reeds,
                "reeds",
                random(e.state.manifest.seed, "wind-phase", x, y),
              );
            }
            const d = w.decoration(x, y);
            if (d) {
              const frame =
                d.sprite === "rock"
                  ? ["rock", "rock-1", "rock-2"][
                      Math.floor(
                        random(e.state.manifest.seed, "rock-art", x, y) * 3,
                      )
                    ]
                  : d.sprite;
              this.shadow(frame, x * 16 + 8, y * 16 + 16);
              const decoration = this.sprite(
                frame,
                x * 16 + 8,
                y * 16 + 16,
                y * 16 + 12,
              );
              if (d.sprite !== "rock" && !this.options.lab) {
                decoration.setInteractive({
                  pixelPerfect: true,
                  useHandCursor: true,
                });
                decoration.on(
                  "pointerdown",
                  (
                    pointer: Phaser.Input.Pointer,
                    _x: number,
                    _y: number,
                    event: Phaser.Types.Input.EventData,
                  ) => {
                    if (pointer.rightButtonDown()) return;
                    event.stopPropagation();
                    this.runtime.select(d.id);
                  },
                );
              }
              if (
                (w.pack.setting?.vegetationRevision ?? 0) >= 2 &&
                (natureTreeSprites.includes(frame) ||
                  w.pack.trees.includes(frame))
              ) {
                const cut = Math.floor(decoration.height * 0.72);
                decoration.setCrop(0, 0, decoration.width, cut);
                this.canopies.push({ image: decoration, cut });
                this.addWind(
                  decoration,
                  frame,
                  random(e.state.manifest.seed, "wind-phase", x, y),
                  true,
                );
                const trunk = this.sprite(
                  frame,
                  x * 16 + 8,
                  y * 16 + 16,
                  y * 16 + 12,
                );
                trunk.setCrop(0, cut, trunk.width, trunk.height - cut);
              }
              if (d.sprite === "rock" && w.topography) {
                const cell = w.topography(x, y);
                if (
                  cell?.waterVisual &&
                  cell.waterVisual.distance < cell.waterVisual.shoreWidth + 4
                )
                  decoration.setTint(waterStyle(cell).rockTint);
              }
            }
          }
        for (const b of w.places)
          if (
            b.x + b.w > startX - 8 &&
            b.x < startX + width + 8 &&
            b.y + b.h > startY - 8 &&
            b.y < startY + height + 16
          ) {
            const placement = buildingPlacement(b);
            // The cast texture uses the source canvas's bottom anchor; model owns its offset.
            this.shadow(
              b.sprite,
              placement.x,
              placement.y +
                placement.model.bounds[3] -
                placement.model.anchor[1],
            );
            const image = this.sprite(
              b.sprite,
              placement.x,
              placement.y,
              placement.depth,
            ).setOrigin(placement.originX, placement.originY);
            this.buildings.set(b.id, image);
          }
        for (const fence of w.enclosures) {
          // A city circuit is far wider than a pen, so the cull tests the whole
          // rectangle rather than only its origin.
          if (
            fence.x - p.x > 100 ||
            p.x - (fence.x + fence.w) > 100 ||
            fence.y - p.y > 100 ||
            p.y - (fence.y + fence.h) > 100
          )
            continue;
          if (fence.parts) {
            for (const part of fence.parts) {
              if (Math.abs(part.x - p.x) > 100 || Math.abs(part.y - p.y) > 100)
                continue;
              this.sprite(
                part.frame,
                part.x * 16 + 8,
                part.y * 16 + 16,
                part.y * 16 + 10,
              );
            }
            continue;
          }
          for (let x = fence.x; x < fence.x + fence.w; x++)
            for (let y = fence.y; y < fence.y + fence.h; y++)
              if (
                (x === fence.x ||
                  x === fence.x + fence.w - 1 ||
                  y === fence.y ||
                  y === fence.y + fence.h - 1) &&
                !(x === fence.gate.x && y === fence.gate.y)
              )
                this.sprite("fence", x * 16 + 8, y * 16 + 16, y * 16 + 10);
        }
      } else {
        const dark = this.add.graphics().setDepth(-50000);
        dark.fillStyle(0x252923, 1);
        dark.fillRect(
          (startX - 1) * 16,
          (startY - 1) * 16,
          (width + 2) * 16,
          (1 - startY) * 16,
        );
        dark.fillRect(
          (startX - 1) * 16,
          10 * 16,
          (width + 2) * 16,
          (height + 1) * 16,
        );
        dark.fillRect((startX - 1) * 16, 16, (2 - startX) * 16, 9 * 16);
        dark.fillRect(12 * 16, 16, width * 16, 9 * 16);
        dark.lineStyle(6, 0x8c7959);
        dark.strokeRect(16, 16, 11 * 16, 9 * 16);
        this.layers.push(dark);
        this.sprite("oven", 9 * 16, 7 * 16, 7 * 16);
        this.sprite("mat", 5 * 16, 5 * 16, 5 * 16);
      }
      this.game.canvas.dataset.sceneryDrawMs = String(
        Math.round(performance.now() - sceneryStart),
      );
      this.game.canvas.dataset.sceneryDrawCount = String(
        Number(this.game.canvas.dataset.sceneryDrawCount ?? 0) + 1,
      );
    }
    for (const [id, image] of this.buildings) {
      const b = w.place(id)!;
      image.setAlpha(
        !this.options.lab && buildingContains(b, p.x * 16 + 8, p.y * 16 + 8)
          ? 0.45
          : 1,
      );
    }
    const visible = (pos: Position) =>
      entityInView(pos, p, this.scale.width, this.scale.height, rt.zoom);
    // Drawn time runs on while the player stands still, so a resident on their
    // routine is placed from the schedule rather than from the last tick.
    const drawnClock = rt.displayClock();
    this.ambientDrawn = drawnClock;
    this.ambient.clear();
    this.indoors.clear();
    this.routinesBuilt = false;
    const pending: { id: string; d2: number }[] = [];
    // Must cover everything `visible` accepts, or a resident between the two
    // is drawn from a stale simulated position and never placed indoors. The
    // margin lets people walk in from off screen rather than appear at the edge.
    const range =
      Math.max(this.scale.width, this.scale.height) / rt.zoom / 32 +
      AMBIENT_MARGIN;
    for (const a of e.state.actors) {
      if (
        a.offRoutine ||
        a.kind !== "human" ||
        a.pos.space !== "outside" ||
        Math.abs(a.pos.x - p.x) > range ||
        Math.abs(a.pos.y - p.y) > range
      )
        continue;
      // Asked before itinerary(), because itinerary() builds one on demand at
      // around 3ms. Queued for buildRoutines to spend a couple per frame; until
      // then the resident is held back rather than drawn standing still.
      if (w.routinePending?.(a.id)) {
        this.indoors.add(a.id);
        pending.push({
          id: a.id,
          d2: (a.pos.x - p.x) ** 2 + (a.pos.y - p.y) ** 2,
        });
        continue;
      }
      // The routine decides who is out, not a.pos: the engine barely ticks
      // while the player stands still.
      const routine = w.itinerary?.(a.id);
      // Past the routine budget a resident stays indoors rather than loitering
      // at the door on the needs loop.
      if (!routine) {
        this.indoors.add(a.id);
        continue;
      }
      const at = itineraryAt(routine, drawnClock);
      if (at.activity === "rest" && !at.moving) this.indoors.add(a.id);
      else this.ambient.set(a.id, at);
    }
    pending.sort((x, y) => x.d2 - y.d2);
    this.pendingRoutines = pending.map((r) => r.id);
    const where = (a: Actor): Position => {
      const at = this.ambient.get(a.id);
      return at ? { x: at.x, y: at.y, space: "outside" } : a.pos;
    };
    const obs = {
        player: e.state.player,
        actors: this.crowd(
          e.state.actors.filter(
            (a) => !this.indoors.has(a.id) && visible(where(a)),
          ),
          p,
          where,
        ),
        objects: e.state.objects.filter((o) => visible(o.pos)),
      },
      keep = new Set<string>();
    this.separate(p);

    const renderEntity = (
      id: string,
      frame: string,
      pos: Position,
      actor = false,
      target = id,
      smooth = false,
    ) => {
      keep.add(id);
      let im = this.entities.get(id);
      const tx = pos.x * 16 + 8,
        ty = pos.y * 16 + 16 - this.lift(pos.x * 16 + 8, pos.y * 16 + 16);
      if (!im) {
        im = this.add
          .image(tx, ty, this.texture(frame), frame)
          .setOrigin(0.5, 1);
        this.entities.set(id, im);
        if (id === "player" && !this.options.lab)
          c.startFollow(im, false, 1, 1);
        const shade = frame.startsWith("human-")
          ? undefined
          : this.shadow(frame, tx, ty, true);
        if (shade) this.shadows.set(id, shade);
        if (id !== "player" && !this.options.lab) {
          im.setInteractive({ pixelPerfect: true, useHandCursor: true });
          im.on(
            "pointerdown",
            (
              _pointer: Phaser.Input.Pointer,
              _x: number,
              _y: number,
              event: Phaser.Types.Input.EventData,
            ) => {
              event.stopPropagation();
              rt.select(target);
            },
          );
        }
      }
      // One source pixel is one world pixel, for objects and their shadows.
      const texture = this.texture(frame);
      if (im.texture.key !== texture || im.frame.name !== frame)
        im.setTexture(texture, frame);
      const tint = frame === "fire" ? 0xffffff : this.tint;
      if (im.tintTopLeft !== tint) im.setTint(tint);
      const depth = pos.y * 16 + (actor ? 14 : 10);
      if (im.depth !== depth) im.setDepth(depth);
      const shade = this.shadows.get(id);
      const shadowKey = shadowFrame(this.shadowPhase, frame);
      const shadowTexture =
        texture === "nature"
          ? "nature-shadows"
          : texture === "props"
            ? "prop-shadows"
            : "lighting-shadows";
      if (
        shade &&
        !frame.startsWith("human-") &&
        (shade.texture.key !== shadowTexture ||
          shade.frame.name !== shadowKey) &&
        this.textures.get(shadowTexture).has(shadowKey)
      )
        shade.setTexture(shadowTexture, shadowKey).setOriginFromFrame();
      // A routine gives a position between tiles every frame, so there is
      // nothing to interpolate: tweening it would only lag the schedule.
      if (smooth) {
        this.tweens.killTweensOf(im);
        if (shade) this.tweens.killTweensOf(shade);
        im.setPosition(tx, ty);
        shade?.setPosition(tx, ty);
        this.destinations.set(id, {
          x: Math.round(pos.x),
          y: Math.round(pos.y),
          space: pos.space,
        });
        return;
      }
      const previous = this.destinations.get(id);
      const moved =
        !previous ||
        previous.x !== pos.x ||
        previous.y !== pos.y ||
        previous.space !== pos.space;
      const pending = id === "player" ? rt.characterAction : undefined;
      const arc =
        pending?.arc && pending.serial !== this.arcSerial
          ? ((this.arcSerial = pending.serial), pending.arc)
          : undefined;
      // A jump on the spot still needs its arc, so it runs as a tween that
      // travels nowhere.
      if (arc && !moved) this.launch(im, arc, im.x, im.y);
      if (!moved) return;
      this.destinations.set(id, { ...pos });
      if (
        previous?.space === pos.space &&
        (im.x !== tx || im.y !== ty) &&
        Math.hypot(im.x - tx, im.y - ty) < 65
      ) {
        this.tweens.killTweensOf(im);
        if (shade) this.tweens.killTweensOf(shade);
        if (arc) {
          this.launch(im, arc, tx, ty);
          if (shade)
            this.tweens.add({
              targets: shade,
              x: tx,
              y: ty,
              duration: arc.duration,
              ease: "Linear",
            });
          return;
        }
        this.tweens.add({
          targets: shade ? [im, shade] : im,
          x: tx,
          y: ty,
          ...(actor && id !== "player" && !this.options.lab
            ? npcMotion(
                e.state.manifest.seed,
                id,
                frame.startsWith("human-"),
                e.state.clock,
              )
            : { duration: this.motionDuration }),
          ease: "Linear",
        });
      } else {
        this.tweens.killTweensOf(im);
        if (shade) this.tweens.killTweensOf(shade);
        im.setPosition(tx, ty);
        shade?.setPosition(tx, ty);
      }
    };
    for (const o of obs.objects) {
      if (o.carriedBy) continue;
      if (
        o.depleted &&
        (o.kind !== "tree" ||
          (o.resource &&
            !["ecology-fruit-tree", "ecology-berry-bush"].includes(o.sprite)))
      )
        continue;
      if (o.kind === "crop") {
        // Visual clumps share one authoritative harvest target, including depletion.
        for (const row of [-2, 0, 2]) {
          if (row !== 0 && w.terrain(o.pos.x, o.pos.y + row) !== "field")
            continue;
          renderEntity(
            `${o.id}:row:${row}`,
            o.sprite,
            { ...o.pos, y: o.pos.y + row },
            false,
            o.id,
          );
        }
        continue;
      }
      renderEntity(
        o.id,
        o.resource && o.depleted && o.sprite === "ecology-fruit-tree"
          ? "oak"
          : o.resource && o.depleted && o.sprite === "ecology-berry-bush"
            ? "bush"
            : o.kind === "gate"
              ? o.open
                ? "gate-open"
                : "gate"
              : o.sprite,
        o.pos,
      );
    }
    this.heldSprites.clear();
    for (const object of e.state.objects)
      if (object.carriedBy)
        this.heldSprites.set(object.carriedBy, object.sprite);
    this.humanActors.clear();
    for (const a of [obs.player, ...obs.actors]) {
      if (a.kind === "human")
        this.humanActors.set(a.id, {
          ...a,
          direction: this.ambient.get(a.id)?.direction ?? a.direction,
          appearance: rt.appearanceFor(a),
        });
      this.actorFrames.set(
        a.id,
        a.kind === "human" ? `${a.sprite}-${a.direction}-` : a.sprite,
      );
      const frame =
        a.kind === "human"
          ? `${a.sprite}-${a.direction}-${this.options.lab ? e.state.revision % 2 : 0}`
          : `${a.sprite}${this.options.lab ? e.state.revision % 2 : 0}`;
      const at = this.ambient.get(a.id);
      renderEntity(
        a.id,
        frame,
        at ? { x: at.x, y: at.y, space: a.pos.space } : a.pos,
        true,
        a.id,
        !!at,
      );
    }
    if (this.options.lab && !this.options.overview)
      c.startFollow(this.entities.get("player")!, true, 0.4, 0.4);
    for (const [id, image] of this.entities)
      if (!keep.has(id)) {
        this.tweens.killTweensOf(image);
        const shade = this.shadows.get(id);
        if (shade) this.tweens.killTweensOf(shade);
        image.destroy();
        this.entities.delete(id);
        this.destinations.delete(id);
        this.actorFrames.delete(id);
        shade?.destroy();
        this.shadows.delete(id);
      }
    let g = this.selection!;
    g.clear();
    const selected = rt.selected ? e.inspect(rt.selected) : undefined;
    const mark = selected?.pos ?? p;
    const sx = mark.x * 16,
      sy = mark.y * 16 + 9;
    g.lineStyle(1, selected ? 0xf0cf8d : 0xf2e2b6, 0.9);
    for (const [x, y, dx, dy] of [
      [sx, sy, 1, 1],
      [sx + 15, sy, -1, 1],
      [sx, sy + 8, 1, -1],
      [sx + 15, sy + 8, -1, -1],
    ]) {
      g.lineBetween(x, y, x + dx * 4, y);
      g.lineBetween(x, y, x, y + dy * 3);
    }
    g = this.routeOverlay!;
    g.clear();
    if (rt.route.length) {
      g.fillStyle(0xf2dfb4, 0.45);
      for (const step of rt.route.filter((_, i) => i % 3 === 0))
        g.fillRect(step.x * 16 + 7, step.y * 16 + 7, 2, 2);
    }
    if (this.options.debug) {
      for (const place of w.places) {
        g.lineStyle(1, 0x73d8ed, 0.8);
        g.strokeRect(place.x * 16, place.y * 16, place.w * 16, place.h * 16);
        g.fillStyle(0xffcb6e, 1);
        g.fillRect(place.entrance.x * 16 + 5, place.entrance.y * 16 + 5, 6, 6);
        const bp = buildingPlacement(place);
        g.lineStyle(1, 0xf3a6cc, 0.6);
        g.strokeRect(
          bp.x - bp.model.anchor[0],
          bp.y - bp.model.anchor[1],
          bp.model.bounds[2],
          bp.model.bounds[3],
        );
      }
    }
    this.night!.clear()
      .fillStyle(
        parseInt(this.light.ambient, 16),
        this.options.colorGrade === false ? 0 : this.light.ambientAlpha,
      )
      .fillRect(
        -this.scale.width * 4,
        -this.scale.height * 4,
        this.scale.width * 9,
        this.scale.height * 9,
      );
    this.game.canvas.dataset.lighting = this.light.id;
  }
  update(time: number) {
    this.terrainStream?.update();
    if (!this.options.lab && this.ready) {
      const clock = this.runtime.displayClock();
      this.buildRoutines();
      // A full pass now and then lets people walk into and out of view; in
      // between, the ones on screen are just repositioned. Someone whose routine
      // was just built has no sprite until the next full pass, so redraw sooner.
      if (clock - this.ambientDrawn > (this.routinesBuilt ? 20 : 90))
        this.draw();
      else this.moveAmbient(clock);
    }
    const phase = this.options.freeze ? 0 : Math.floor(time / 800) % 4;
    if (phase !== this.rippleTime) {
      this.rippleTime = phase;
      for (const r of this.ripples)
        r.image.setFrame(`ripple-${(phase + r.phase) % 4}`);
    }
    for (const wind of this.windSprites) {
      const sway = this.options.freeze
        ? { x: 0, angle: 0 }
        : windSway(time, wind.phase, wind.profile);
      const x = wind.baseX + sway.x;
      if (wind.image.x !== x) wind.image.setX(x);
      if (wind.image.rotation !== sway.angle)
        wind.image.setRotation(sway.angle);
    }
    const active = document.activeElement;
    const typing =
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      active instanceof HTMLSelectElement ||
      (active instanceof HTMLElement && active.isContentEditable) ||
      this.modalOpen;
    if (typing) {
      this.heldDirections.clear();
      this.shiftHeld = this.throwArmed = false;
      this.pendingDirection = undefined;
    }
    if (!this.options.lab && !typing && time >= this.nextInput) {
      const held = this.direction();
      const [dx, dy] = held.some(Boolean)
        ? held
        : (this.pendingDirection ?? held);
      this.pendingDirection = undefined;
      if (dx || dy) {
        const carrying = !!heldObject(this.runtime.engine.state);
        if (this.shiftHeld && carrying) {
          if (this.throwArmed) {
            this.throwArmed = false;
            this.nextInput = time + 280;
            this.lastTick = time;
            this.runtime.throwHeld(dx, dy);
          }
        } else if (this.shiftHeld) {
          this.motionDuration = JUMP_MS;
          this.nextInput = time + JUMP_MS;
          this.lastTick = time;
          this.runtime.move(dx, dy, true);
        } else {
          this.motionDuration = 140 * Math.hypot(dx, dy);
          this.nextInput = time + this.motionDuration;
          this.lastTick = time;
          this.runtime.move(dx, dy);
        }
      }
    }
    if (!this.options.lab && time - this.lastTick >= 140 && !typing) {
      this.lastTick = time;
      this.motionDuration = 140;
      this.runtime.tick();
    }
    // Depth and the selection marker follow the displayed position, not the next tile.
    for (const [id, im] of this.entities) {
      const frame = this.actorFrames.get(id);
      // Height above the tile, mid-jump. Depth sorts on where the feet would
      // be, or a jumper passes behind whatever they are jumping over.
      const arcLift = (im.getData("arcLift") as number) ?? 0;
      const depth =
        im.y +
        arcLift +
        this.lift(im.x, (this.destinations.get(id)?.y ?? 0) * 16 + 16) -
        (frame ? 2 : 6);
      if (im.depth !== depth) im.setDepth(depth);
      // The camera tracks the sprite, so cancel the arc or the world bobs.
      if (id === "player" && !this.options.lab)
        this.cameras.main.setFollowOffset(0, -arcLift);
      const human = this.humanActors.get(id);
      if (human && this.characters) {
        const at = this.ambient.get(id);
        const moving = at ? at.moving : this.tweens.isTweening(im);
        const action =
          id === "player" ? this.runtime.characterAction : undefined;
        const elapsed = action ? performance.now() - action.at : Infinity;
        const active = action && elapsed < poseTiming(action.pose) * 4;
        const heldSprite = this.heldSprites.get(id);
        let pose: CharacterPose = moving ? "walk" : "idle";
        if (active) pose = action.pose;
        else if (moving) pose = "walk";
        else if (at) pose = this.ambientPose(id, at, time);
        else if (/rest|sleep/i.test(human.activity)) pose = "sit";
        else if (/gathering|working/i.test(human.activity)) pose = "work";
        else if (/eating/i.test(human.activity)) pose = "give";
        if (id === "player" && pose === "idle") pose = "breathe";
        const index = active
          ? Math.min(3, Math.floor(elapsed / poseTiming(pose)))
          : this.options.freeze
            ? 0
            : this.poseFrame(id, pose, time);
        const prop =
          heldSprite ??
          // A thrown object stays in the hand through the windup. Striking
          // also swings, but then the hand is still full and this never runs.
          (active &&
          (action.pose === "drop" || action.pose === "swing") &&
          index < 2
            ? action.prop
            : undefined);
        const texture = this.characters.frame(human, pose, index, prop);
        if (im.texture.key !== texture) im.setTexture(texture);
        if (this.options.shadows !== false) {
          const shadowTexture = this.characters.shadow(
            texture,
            this.shadowPhase,
          );
          let shade = this.shadows.get(id);
          if (!shade) {
            shade = this.add.image(im.x, im.y, shadowTexture);
            this.shadows.set(id, shade);
          }
          if (shade.texture.key !== shadowTexture)
            shade.setTexture(shadowTexture);
          if (shade.originY !== 32 / 96) shade.setOrigin(0.5, 32 / 96);
          // Mid-jump the sprite is lifted off its tile; the shadow is not, and
          // it draws in a little to sell the height.
          shade.setPosition(im.x, im.y + arcLift);
          const shrink = arcLift ? 1 - Math.min(0.3, arcLift / 48) : 1;
          if (shade.scaleX !== shrink) shade.setScale(shrink);
          const fade = arcLift ? 1 - Math.min(0.4, arcLift / 36) : 1;
          if (shade.alpha !== fade) shade.setAlpha(fade);
          const shadowDepth = this.runtime.engine.world.topography
            ? -1000
            : -60000;
          if (shade.depth !== shadowDepth) shade.setDepth(shadowDepth);
          if (
            id === "player" &&
            this.game.canvas.dataset.characterShadow !== this.shadowPhase
          )
            this.game.canvas.dataset.characterShadow = this.shadowPhase;
        }
        if (im.getData("characterPose") !== pose)
          im.setData("characterPose", pose);
        if (im.getData("heldSprite") !== (prop ?? null))
          im.setData("heldSprite", prop ?? null);
        if (id === "player") {
          if (this.game.canvas.dataset.heldSprite !== (prop ?? ""))
            this.game.canvas.dataset.heldSprite = prop ?? "";
          if (this.game.canvas.dataset.characterPose !== pose)
            this.game.canvas.dataset.characterPose = pose;
        }
      } else if (frame && !this.options.lab)
        im.setFrame(
          `${frame}${this.tweens.isTweening(im) ? Math.floor(time / 140) % 2 : 0}`,
        );
    }
    const player = this.entities.get("player");
    for (const { image, cut } of this.canopies) {
      // Distant trees at full alpha have nothing to do; only ones near the
      // player can hide it, and only a fading one still needs stepping.
      const near =
        player &&
        Math.abs(image.x - player.x) < image.width &&
        player.y > image.y - image.height - 24 &&
        player.y < image.y + 24;
      if (!near && image.alpha === 1) continue;
      const faded =
        near &&
        canopyHidesPlayer(
          {
            x: image.x,
            y: image.y,
            width: image.width,
            height: image.height,
            cut,
          },
          player!,
        );
      const target = faded ? 0.32 : 1;
      const alpha =
        Math.abs(image.alpha - target) < 0.02
          ? target
          : image.alpha + (target - image.alpha) * 0.25;
      if (alpha !== image.alpha) image.setAlpha(alpha);
    }
    this.characters?.prune();
    const selected = this.runtime.selected;
    const marker = this.entities.get(selected ?? "player");
    const destination = this.destinations.get(selected ?? "player");
    this.selection?.setPosition(
      marker && destination ? marker.x - (destination.x * 16 + 8) : 0,
      marker && destination ? marker.y - (destination.y * 16 + 16) : 0,
    );
  }
  /** Nudges drawn people out of each other. Presentation only: the schedule
   * still says where somebody is standing, this only decides how they stand
   * around one another, so two people crossing slide past instead of merging.
   * The player repels as well, which parts a crowd around them. */
  private separate(player: { x: number; y: number }) {
    // The drawn crowd, not every resident in range: this runs every frame and
    // is O(n²), and nobody off screen needs to stand nicely.
    const people: Ambient[] = [];
    for (const id of this.drawnCrowd) {
      const at = this.ambient.get(id);
      if (at) people.push(at);
    }
    if (people.length < 2) return;
    for (let pass = 0; pass < 3; pass++)
      for (let i = 0; i < people.length; i++) {
        const a = people[i];
        for (let j = i + 1; j <= people.length; j++) {
          const b = j === people.length ? player : people[j];
          let dx = a.x - b.x,
            dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 >= SPACING * SPACING) continue;
          if (d2 < 1e-4) {
            // Exactly stacked: pick a fixed direction so they do not shiver.
            dx = (i % 2 ? 1 : -1) * 0.05;
            dy = (i % 3 ? 1 : -1) * 0.05;
          }
          const d = Math.hypot(dx, dy) || 1;
          const push = ((SPACING - d) / d) * 0.5;
          a.x += dx * push;
          a.y += dy * push;
          if (j < people.length) {
            b.x -= dx * push;
            b.y -= dy * push;
          }
        }
      }
  }
  /** Builds a couple of the queued routines. A build is a path search per
   * station, around 3ms, and a city wants a couple of hundred of them, so they
   * are spent a frame at a time from the nearest resident outward. This is
   * presentation: the engine builds its own on a fixed per-tick budget, and the
   * result is the same itinerary whoever asks first. */
  private buildRoutines() {
    const w = this.runtime.engine.world;
    for (let i = 0; i < ROUTINE_BUILDS_PER_FRAME; i++) {
      const id = this.pendingRoutines.shift();
      if (id === undefined) return;
      // Already built by the engine: drop it and let the next frame continue.
      if (!w.routinePending?.(id)) continue;
      w.itinerary?.(id);
      this.routinesBuilt = true;
    }
  }
  /** Moves the people already on screen along their routines. The full pass is
   * driven by player commands, which is far too rare a beat for a village that
   * keeps going while the player stands still. */
  private moveAmbient(clock: number) {
    for (const id of this.ambient.keys()) {
      if (!this.entities.has(id)) continue;
      const routine = this.runtime.engine.world.itinerary?.(id);
      if (!routine) continue;
      const at = itineraryAt(routine, clock);
      this.ambient.set(id, at);
      const human = this.humanActors.get(id);
      if (human && human.direction !== at.direction)
        this.humanActors.set(id, { ...human, direction: at.direction });
    }
    this.separate(this.runtime.engine.state.player.pos);
    this.placeAmbient();
  }
  private placeAmbient() {
    for (const [id, at] of this.ambient) {
      const im = this.entities.get(id);
      if (!im) continue;
      const tx = at.x * 16 + 8,
        ty = at.y * 16 + 16 - this.lift(tx, at.y * 16 + 16);
      im.setPosition(tx, ty);
      this.shadows.get(id)?.setPosition(tx, ty);
      this.destinations.set(id, {
        x: Math.round(at.x),
        y: Math.round(at.y),
        space: "outside",
      });
    }
  }
  /** Every drawn head keeps its own cached frames and shadow, so the crowd is
   * capped and the nearest people win it. Already-drawn residents get a small
   * bonus, which stops the pair at the edge trading places every step. */
  private crowd(
    actors: Actor[],
    centre: Position,
    where: (a: Actor) => Position,
  ) {
    const humans = actors.filter((a) => a.kind === "human");
    if (humans.length <= CROWD_LIMIT) {
      this.drawnCrowd = new Set(humans.map((a) => a.id));
      return actors;
    }
    const keep = new Set(
      humans
        .map((a) => {
          const at = where(a);
          return {
            id: a.id,
            rank:
              Math.hypot(at.x - centre.x, at.y - centre.y) -
              (this.drawnCrowd.has(a.id) ? 3 : 0),
          };
        })
        .sort((x, y) => x.rank - y.rank || (x.id < y.id ? -1 : 1))
        .slice(0, CROWD_LIMIT)
        .map((r) => r.id),
    );
    if (this.runtime.selected) keep.add(this.runtime.selected);
    this.drawnCrowd = keep;
    return actors.filter((a) => a.kind !== "human" || keep.has(a.id));
  }
  /** Per-actor animation phase offset; stable, so it is hashed once.
   * A mixed hash, because sibling ids differ by a character or two and a
   * character sum put them within a few milliseconds of each other. */
  private poseOffset(id: string) {
    let offset = this.poseOffsets.get(id);
    if (offset === undefined) {
      offset = hash(id) % 100000;
      this.poseOffsets.set(id, offset);
    }
    return offset;
  }
  /** A knot of people is not a chorus. Each takes a turn talking and a longer
   * turn listening, on their own beat. */
  private ambientPose(id: string, at: Ambient, time: number): CharacterPose {
    const offset = this.poseOffset(id);
    if (at.activity !== "visit") {
      const base = ambientPoses[at.activity];
      const alt = workAlternates[base];
      if (!alt) return base;
      // Every 20-30s a worker changes what they are doing, so a yard is not
      // a row of people doing the same thing in unison.
      const beat = 20000 + (offset % 10000);
      const n = Math.floor((time + offset) / beat) % 4;
      return n === 0 ? alt[0] : n === 2 ? alt[1] : base;
    }
    const beat = 2600 + (offset % 2400);
    return Math.floor((time + offset) / beat) % 3 ? "idle" : "talk";
  }
  /** Idle draws only two things: eyes open, and the blink on frame three. Both
   * the rate and the phase are per-actor, so a street does not wink in unison,
   * and an idle crowd caches two textures a head instead of four. */
  private poseFrame(id: string, pose: CharacterPose, time: number) {
    const offset = this.poseOffset(id);
    if (pose === "idle") {
      const cycle = 3400 + (offset % 3800);
      return (time + offset) % cycle < 130 ? 3 : 0;
    }
    if (pose === "sit") return 0;
    return Math.floor((time + offset) / poseTiming(pose)) % 4;
  }
  /** Shift is read from every key event, not only its own, so a swallowed
   * press or a focus change cannot leave the flag stuck. Returns the edge. */
  private syncShift(event: KeyboardEvent) {
    if (event.shiftKey === this.shiftHeld) return false;
    this.shiftHeld = this.throwArmed = event.shiftKey;
    return event.shiftKey;
  }
  private direction(): [number, number] {
    const has = (arrow: string, letter: string) =>
      Number(this.heldDirections.has(arrow) || this.heldDirections.has(letter));
    return [
      has("arrowright", "d") - has("arrowleft", "a"),
      has("arrowdown", "s") - has("arrowup", "w"),
    ];
  }
}
