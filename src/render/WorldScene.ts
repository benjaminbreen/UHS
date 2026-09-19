import {
  waterDepthAt,
  wadingCost,
  MAX_WADING_DEPTH,
} from "../core/water-field";
import { WadingEffects } from "./characters/wading";
import { shorePolishDefaults } from "./living-water/polish";
import { updateLivingWater } from "./living-water/game";
import { perf, open, mark, span, timed } from "./perf-switches";
import { natureTreeSprites } from "../content/ecology/vegetation";
import { rockFrame } from "../content/ecology/rocks";
import { propVariety } from "./prop-variety";
import { ensureSignTexture, inkFor, signWidth } from "./sign-texture";
import { signLanguage, signOptions } from "../content/settlements/signs";
/** Trades for a shopfront the kit did not name. */
const GENERIC_TRADES = [
  "grocery",
  "cafe",
  "bakery",
  "barber",
  "tailor",
  "hardware",
  "pharmacy",
  "shop",
];
import type { Place } from "../core/types";
import type { WorldSetting } from "../content/geography/types";
import { aerialStates, type FaunaGroup, type FaunaState } from "../core/fauna";
import { faunaProfile, type FaunaFacing } from "../content/fauna";

/** Actor facing numbers as the art names them. */
const FACINGS: readonly FaunaFacing[] = ["north", "east", "south", "west"];
import { canopyHidesPlayer } from "./canopy-visibility";
import { WorldCharacters } from "./characters/world";
import { entityInView, npcMotion } from "./entity-presentation";
import { poseTiming, type CharacterPose } from "./characters/poses";
import type { Actor } from "../core/types";
import { waterStyle } from "./water-style";
import { TerrainStream, restyleTerrain } from "./terrain-stream";
import { defaultGroundStyle } from "./ground-style";
import {
  surfaceElevation,
  pickTerrain,
  TERRAIN_RISE,
} from "./terrain-projection";
import { buildingContains, buildingPlacement } from "./buildings";
import { terrainVariant, type RenderOptions } from "./appearance";
import Phaser from "phaser";
import { jumpMs, JUMP_CHARGE_MS, type Runtime } from "../runtime/session";
import type { Position, WorldModel } from "../core/types";
import { surfaceAt, hasQuay } from "./materials";
import { hash, random } from "../core/random";
import {
  defaultLiveGraphicsSettings,
  type LiveGraphicsSettings,
} from "./live-graphics";
import { ToolEffects, ROLL_MS } from "./tool-effects";
import {
  facingFromDirection,
  facingFromStep,
  turnToward,
} from "../core/facing";
import { HANGING, windProfile, windSway, type WindProfile } from "./wind";
/** Grit thrown up by a take-off or a landing. */
const DUST = [0x9c8c6a, 0xbcae8c, 0x7d7054];
/** A jump pressed this long before the previous move ends still fires, so a
 * landing never eats the next input. */
const JUMP_BUFFER_MS = 90;
/** A jump this soon after a running step counts as a running jump. */
const RUN_GRACE_MS = 200;
/** How long each intermediate facing is held while someone turns around. */
const TURN_HOLD_MS = 60;
/** A shove into whatever blocked the way: out two pixels and back. */
const BUMP_MS = 110;
/** How long after a refused step the player still reads as pushing. Longer
 * than an input tick, so holding a key against a wall keeps the walk going. */
const PUSH_MS = 240;
/** Step times as a run gets up to speed. */
const RUN_RAMP = [120, 100, 88, 78, 72];
/** Poll interval while a jump is in the air, matched to the sprite's arc. */
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
import { Drift } from "./drift";
import { Mist } from "./mist";
import { AmbientLife, critterFor } from "./ambient-life";
import { weatherAt, type Weather } from "../core/weather";
import { setWind, wind } from "./wind";

import { driftStyle, foliageTint } from "./season-art";
import { seasonAt } from "../core/livelihood";
import {
  FIRE_FRAME_MS,
  SMOKE_MS,
  SMOKE_PUFFS,
  animatedBase,
  motionFrames,
  motionPeriod,
  animatedFrames,
  ensureFireTextures,
  ensureHearthSmoke,
  HEARTH_FRAMES,
  glowAlpha,
} from "./fire";
import terrainFrames from "./generated/terrain.json" with { type: "json" };
import artVersion from "./generated/art-version.json" with { type: "json" };
/** Moves when the packed art moves, so a rebuild is not hidden by a cached
 *  texture. The atlases are served from public/ by plain path, which the
 *  browser is entitled to hold on to indefinitely without it. */
const artStamp = artVersion.stamp;
/** People drawn at once. Beyond roughly this many the per-head frame cache,
 * not the simulation, is what costs the frame. */
const CROWD_LIMIT = 24;
/** A hearth plume: fewer, slower and taller than a campfire's. */
const HEARTH_PUFFS = 4;
const HEARTH_MS = 3400;
/** Tiles of slack beyond the view for routine lookups. `entityInView` allows
 * 8 on x and 12 on y, so this must clear 12. */
const AMBIENT_MARGIN = 16;
const alternateTrees = {
  oak: ["Oak Tree.png", 7],
  birch: ["Birch Tree 1.png", 6],
  cedar: ["Cedar Tree.png", 6],
  fir: ["Fir Tree.png", 5],
  hazel: ["Hazel Tree.png", 5],
  maple: ["Maple Tree.png", 5],
  willow: ["Willow Tree.png", 5],
  apple: ["Apple Tree.png", 6],
  cherry: ["Cherry Blossom Tree.png", 6],
} as const;
/** Milliseconds of a frame spent building routines. A build is around 3ms but
 * varies with the path search, so the budget is time rather than a count. */
const ROUTINE_BUILD_BUDGET_MS = 2;
/** Tiles of elbow room between drawn people. */
const SPACING = 0.95;
/** How far a town wall's coping stands above the ground it runs across. */
const WALL_WALK_RISE = 11;
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
  cook: "stoop",
  warm: "sit",
  "haul-catch": "carry",
};
/** What an actor on the catch errand is holding. */
const CATCH = "study-propb-catch-0";
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
type BuildingAnimationRecipe = {
  kind: string;
  xRatio: number;
  y: number;
  period?: number;
  phase?: number;
  chance?: number;
};
type BuildingAnimation = {
  image: Phaser.GameObjects.Image;
  period: number;
  phase: number;
};
type FireEffect = {
  image: Phaser.GameObjects.Image;
  base: string;
  phase: number;
  glow: Phaser.GameObjects.Image;
  smoke: Phaser.GameObjects.Image[];
};
const GLOW_RING = [1, 2].flatMap((r) =>
  [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].map(([dx, dy]) => ({
    dx: dx * r,
    dy: dy * r,
    alpha: r === 1 ? 0.85 : 0.3,
  })),
);
export class WorldScene extends Phaser.Scene {
  private runtime: Runtime;
  private characters?: WorldCharacters;
  private wading?: WadingEffects;
  private heldSprites = new Map<string, string>();
  private humanActors = new Map<
    string,
    Pick<
      Actor,
      | "id"
      | "sprite"
      | "appearance"
      | "age"
      | "direction"
      | "facing"
      | "activity"
      | "held"
    >
  >();
  private canopies: { image: Phaser.GameObjects.Image; cut: number }[] = [];
  /** Drawn height of each solid plant, so a climber sits at its fork rather
   * than at a guessed offset. Decorations are not entities, so their sprites
   * cannot be looked up later. */
  private plantHeights = new Map<string, number>();
  /** The images standing on a cell, so a blow can rock the right plant. */
  private plantImages = new Map<string, Phaser.GameObjects.Image[]>();
  private toolEffects?: ToolEffects;
  /** Last drawn pose frame per person, so a footfall fires once per contact. */
  private footfalls = new Map<string, number>();
  /** Facing actually drawn, which chases the real one a step at a time. */
  private turning = new Map<string, { facing: number; until: number }>();
  /** Where the player is pushing while the way is blocked. The engine never
   * saw the move, so the turn is the renderer's to remember. */
  private blockedFacing?: number;
  /** When the last step was refused, so pushing ends shortly after the key
   * is released while the facing itself stays put. */
  private pushingAt?: number;
  private bump?: { dx: number; dy: number; at: number };
  private windSprites: WindSprite[] = [];
  /** Hanging layers drawn over a prop's rigid frame, swayed by the same wind.
   * Kept per entity rather than in windSprites, which only clears on a full
   * rebuild and would hold sprites of objects that have gone. */
  private hangings = new Map<
    string,
    { image: Phaser.GameObjects.Image; phase: number; baseX: number }
  >();
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
  /** Drawn animals, for the frame cycle in update(). */
  private faunaSprites = new Map<
    string,
    { species: string; state: FaunaState; phase: number; facing: FaunaFacing }
  >();
  private testFauna: FaunaGroup[] = [];
  private testFaunaSerial = 0;
  private layers: Phaser.GameObjects.GameObject[] = [];
  private ground?: Phaser.Tilemaps.TilemapLayer;
  private tilemap?: Phaser.Tilemaps.Tilemap;
  private shadows = new Map<string, Phaser.GameObjects.Image>();
  private ripples: { image: Phaser.GameObjects.Image; phase: number }[] = [];
  private rippleTime = -1;
  private entities = new Map<string, Phaser.GameObjects.Image>();
  private glowSprites: Phaser.GameObjects.Image[] = [];
  private hoverTip?: HTMLDivElement;
  private hoverId?: string;
  private routeOverlay?: Phaser.GameObjects.Graphics;
  private actorFrames = new Map<string, string>();
  private wheelAccum = 0;
  private pinchStart?: { spread: number; zoom: number };
  private unsubscribe?: () => void;
  private staticKey = "";
  private terrainStream?: TerrainStream;
  private terrainAnchor?: { x: number; y: number };
  private drawnWorld?: WorldModel;
  private buildings = new Map<string, Phaser.GameObjects.Image>();
  private buildingAnimations = new Map<string, BuildingAnimation>();
  /** One leaf per drawn building, hidden while shut. */
  private doors = new Map<
    string,
    {
      image: Phaser.GameObjects.Image;
      openness: number;
      shut: boolean;
      knockSeen?: number;
      rattleUntil?: number;
    }
  >();
  private hearths = new Map<string, Phaser.GameObjects.Image[]>();
  private fires = new Map<string, FireEffect>();
  private fireFrames = new Set<string>();
  private motionFrames = new Map<string, number>();
  /** Props that animate on their own, keyed by entity. */
  private motions = new Map<
    string,
    {
      image: Phaser.GameObjects.Image;
      base: string;
      phase: number;
      frames: number;
    }
  >();
  private nextInput = 0;
  private motionDuration = 140;
  private heldDirections = new Set<string>();
  private shiftHeld = false;
  private spaceDown = false;
  private jumpStarted?: number;
  private queuedJump?: "short" | "long";
  /** Whether the player was running when Space went down: a running jump
   * clears an extra tile. */
  private jumpRunning = false;
  /** When the last running step went out, so a jump a moment after letting go
   * of Shift still counts as a running jump. */
  private lastRunStep = -Infinity;
  /** Consecutive steps held in one direction, for the run-up ramp. */
  private runSteps = 0;
  /** Set once the held jump has reached full charge, so the tell fires once. */
  private chargeArmed = false;
  private arcSerial = 0;
  private pendingDirection?: [number, number];
  private destinations = new Map<string, Position>();
  /** The last roll animated, so a later shove of the same stone is a step. */
  private rolledSerial = -1;
  private lastTick = 0;
  private ready = false;
  private liveGraphics = { ...defaultLiveGraphicsSettings };
  private zoomTarget?: number;

  private light = lightingAt(9 * 3600);
  private tint = 0xffffff;
  private shadowPhase = this.light.id;
  private night?: Phaser.GameObjects.Graphics;
  private drift?: Drift;
  private mist?: Mist;
  private life?: AmbientLife;
  private weather?: Weather;
  private season = "summer";
  constructor(
    runtime: Runtime,
    private options: RenderOptions = {},
  ) {
    super("world");
    this.runtime = runtime;
    this.options.waterRenderer ??= "living";
    this.options.shorePolish ??= { ...shorePolishDefaults };
  }
  preload() {
    this.load.atlas(
      "nature",
      `/nature/atlas.png?v=${artStamp}`,
      `/nature/atlas.json?v=${artStamp}`,
    );
    this.load.atlas(
      "faunab",
      `/fauna-b/atlas.png?v=${artStamp}`,
      `/fauna-b/atlas.json?v=${artStamp}`,
    );
    this.load.atlas(
      "faunac",
      `/fauna-c/atlas.png?v=${artStamp}`,
      `/fauna-c/atlas.json?v=${artStamp}`,
    );
    this.load.atlas(
      "nature-shadows",
      `/nature/shadows.png?v=${artStamp}`,
      `/nature/shadows.json?v=${artStamp}`,
    );
    this.load.atlas(
      "ecology",
      `/ecology/atlas.png?v=${artStamp}`,
      `/ecology/atlas.json?v=${artStamp}`,
    );
    this.load.atlas(
      "props",
      `/props/atlas.png?v=${artStamp}`,
      `/props/atlas.json?v=${artStamp}`,
    );
    this.load.atlas(
      "prop-shadows",
      `/props/shadows.png?v=${artStamp}`,
      `/props/shadows.json?v=${artStamp}`,
    );
    this.load.atlas(
      "atlas",
      `/packs/atlas.png?v=${artStamp}`,
      `/packs/atlas.json?v=${artStamp}`,
    );
    this.load.atlas(
      "buildings",
      `/packs/buildings.png?v=${artStamp}`,
      `/packs/buildings.json?v=${artStamp}`,
    );
    this.load.atlas(
      "lighting-shadows",
      `/packs/lighting-shadows.png?v=${artStamp}`,
      `/packs/lighting-shadows.json?v=${artStamp}`,
    );
    this.load.atlas(
      "topography",
      `/topography/atlas.png?v=${artStamp}`,
      `/topography/atlas.json?v=${artStamp}`,
    );
    this.load.image("terrain", `/packs/terrain.png?v=${artStamp}`);
    this.load.image(
      "tree-study-source",
      new URL("../../trees.png", import.meta.url).href,
    );
    for (const [id, [file]] of Object.entries(alternateTrees))
      this.load.spritesheet(
        `study-tree-${id}`,
        new URL(`../../trees pngs/${file}`, import.meta.url).href,
        { frameWidth: 64, frameHeight: 96 },
      );
  }
  create() {
    this.ready = true;
    this.characters = new WorldCharacters(this);
    this.characters.palette = this.runtime.palette();
    this.wading = new WadingEffects(this);
    this.prepareTreeStudySheet();
    this.events.once("shutdown", () => this.wading?.destroy());
    this.events.once("shutdown", () => this.toolEffects?.dispose());
    this.events.once("shutdown", () => this.characters?.destroy());
    ensureFireTextures(this);
    this.fireFrames = animatedFrames(
      this.textures.get("props").getFrameNames(),
    );
    this.motionFrames = motionFrames(
      this.textures.get("props").getFrameNames(),
    );
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
    this.applyLiveGraphics(
      this.options.lab ? { roundPixels: true, zoomDuration: 0 } : {},
    );
    const filterTexture = (_key: string, texture: Phaser.Textures.Texture) =>
      texture.setFilter(this.textureFilter());
    this.textures.on(Phaser.Textures.Events.ADD, filterTexture);
    this.events.once("shutdown", () =>
      this.textures.off(Phaser.Textures.Events.ADD, filterTexture),
    );
    this.createHoverTip();
    this.routeOverlay = this.add.graphics().setDepth(20000);
    this.night = this.add.graphics().setDepth(19000).setScrollFactor(0);
    this.drift = new Drift(this);
    this.mist = new Mist(this);
    this.life = new AmbientLife(this);
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
      this.shiftHeld = event.shiftKey;
      if (event.code === "Space" && !(active instanceof HTMLButtonElement)) {
        event.preventDefault();
        if (event.repeat || this.spaceDown) return;
        this.spaceDown = true;
        this.jumpRunning =
          this.shiftHeld ||
          this.runtime.running ||
          this.time.now - this.lastRunStep < RUN_GRACE_MS;
        this.runtime.stop(false);
        this.jumpStarted = this.time.now;
      }
      if (
        event.code === "KeyX" &&
        !event.repeat &&
        !(active instanceof HTMLButtonElement)
      ) {
        event.preventDefault();
        const [dx, dy] = this.jumpDirection();
        // A throw taken at a sprint carries twice as far, on the same terms
        // a running jump does.
        this.runtime.throwHeld(
          dx,
          dy,
          this.shiftHeld ||
            this.runtime.running ||
            this.time.now - this.lastRunStep < RUN_GRACE_MS,
        );
      }
    });
    this.input.keyboard!.on("keyup", (event: KeyboardEvent) => {
      this.shiftHeld = event.shiftKey;
      this.heldDirections.delete(event.key.toLowerCase());
      if (event.code === "Space") {
        this.spaceDown = false;
        if (this.jumpStarted !== undefined) {
          this.queuedJump =
            this.time.now - this.jumpStarted >= JUMP_CHARGE_MS
              ? "long"
              : "short";
          this.jumpStarted = undefined;
        }
      }
    });
    const clearInput = () => {
      this.heldDirections.clear();
      this.shiftHeld = this.spaceDown = false;
      this.jumpStarted = this.queuedJump = undefined;
      this.jumpRunning = false;
      this.runSteps = 0;
      this.pendingDirection = undefined;
      this.runtime.stop();
    };
    this.game.events.on("blur", clearInput);
    this.events.once("shutdown", () =>
      this.game.events.off("blur", clearInput),
    );
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown() || this.options.lab) return;
      // A second finger means a pinch, not a walk order.
      if (this.pinchSpread() !== undefined) return;
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
      const native = pointer.event as MouseEvent | undefined;
      if (native?.metaKey || native?.ctrlKey) {
        this.runtime.inspectCell(x, y);
        return;
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
    this.input.on("pointermove", () => {
      if (this.options.lab) return;
      const spread = this.pinchSpread();
      if (spread === undefined) {
        this.pinchStart = undefined;
        return;
      }
      if (!this.pinchStart) {
        // The first finger already issued a walk order; a pinch cancels it.
        this.runtime.stop();
        this.pinchStart = { spread, zoom: this.runtime.zoom };
        return;
      }
      this.runtime.setZoom(
        this.pinchStart.zoom * (spread / this.pinchStart.spread),
      );
    });
    const endPinch = () => {
      this.pinchStart = undefined;
    };
    this.input.on("pointerup", endPinch);
    this.input.on("pointerupoutside", endPinch);
    this.input.on(
      "wheel",
      (_p: unknown, _g: unknown, _dx: number, dy: number) => {
        if (!dy || this.options.lab) return;
        // Trackpads fire many small deltas; accumulate and step one notch at a
        // time so a light flick doesn't run to the end of the range.
        this.wheelAccum += dy;
        const notch = 90;
        while (Math.abs(this.wheelAccum) >= notch) {
          const dir = this.wheelAccum > 0 ? 1 : -1;
          this.wheelAccum -= dir * notch;
          this.runtime.stepZoom(-dir);
        }
      },
    );
    const onResize = () => this.draw();
    this.scale.on("resize", onResize);
    this.unsubscribe = this.runtime.subscribe(() =>
      timed("scene draw", () => this.draw()),
    );
    // Phaser's own render pass, which the scene update does not cover.
    let renderStart = 0;
    const preRender = () => {
      renderStart = performance.now();
    };
    const postRender = () =>
      span("phaser render", performance.now() - renderStart);
    this.game.events.on("prerender", preRender);
    this.game.events.on("postrender", postRender);
    this.events.once("shutdown", () => {
      this.game.events.off("prerender", preRender);
      this.game.events.off("postrender", postRender);
    });
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
  /** Distance between the two active touches, or undefined when not pinching. */
  private pinchSpread() {
    const touches = this.input.manager.pointers.filter(
      (p) => p.isDown && p.wasTouch,
    );
    if (touches.length < 2) return undefined;
    const [a, b] = touches;
    return Math.hypot(a.x - b.x, a.y - b.y) || undefined;
  }

  private lift(x: number, y: number) {
    const w = this.runtime.engine.world;
    return w.topography &&
      this.runtime.engine.state.player.pos.space === "outside"
      ? surfaceElevation(w.topography, x / 16 - 0.5, y / 16 - 1) * TERRAIN_RISE
      : 0;
  }
  /** A perched player renders on top of whatever they climbed. The tile
   * position is unchanged, so collision and pathfinding never see the lift. */
  private perchRise(id: string) {
    if (id !== "player") return 0;
    const perch = this.runtime.engine.state.player.perch;
    // A wall walk has no perch target: the player's own cell is the wall, and
    // the lift is the drawn height of its masonry.
    if (!perch) return this.runtime.engine.onWall() ? WALL_WALK_RISE : 0;
    // The thing's own sprite is the honest height: a firewood stack stands
    // three times a pot. Overlap a couple of pixels so the feet sit in it
    // rather than float above the silhouette.
    const on = this.entities.get(perch.on);
    if (on) return Math.max(4, Math.round(on.displayHeight) - 3);
    // Up a tree you sit in the fork, not on the canopy.
    const plant = this.plantHeights.get(perch.on);
    return plant ? Math.max(6, Math.round(plant * 0.45)) : perch.rise;
  }
  /** The cell a perched player is drawn over, which is the thing they climbed
   * rather than the ground they walked in from. */
  private perchCell(id: string) {
    return id === "player"
      ? this.runtime.engine.state.player.perch?.at
      : undefined;
  }
  /** Grit kicked up off a take-off or a landing. */
  private kickDust(x: number, y: number, count: number, spread = 1) {
    for (let i = 0; i < count; i++) {
      const size = i % 3 ? 2 : 3;
      const rect = this.add
        .rectangle(
          x + (Math.random() - 0.5) * 8,
          y - 1 - Math.random() * 3,
          size,
          size,
          DUST[i % DUST.length],
        )
        .setDepth(y * 16 + 4000);
      this.tweens.add({
        targets: rect,
        x: rect.x + (Math.random() - 0.5) * 22 * spread,
        y: rect.y - 4 - Math.random() * 7,
        alpha: 0,
        duration: 260 + Math.random() * 120,
        ease: "Quad.easeOut",
        onComplete: () => rect.destroy(),
      });
    }
  }
  /** Crouch deeper as the jump charges, and pop once it is fully charged, so
   * the player can see the long jump is armed before they let go. */
  private chargeTell(time: number) {
    const im = this.entities.get("player");
    if (!im) return;
    if (this.jumpStarted === undefined) {
      if (im.scaleY !== 1 || im.scaleX !== 1) im.setScale(1, 1);
      this.chargeArmed = false;
      return;
    }
    const t = Math.min(1, (time - this.jumpStarted) / JUMP_CHARGE_MS);
    im.setScale(1 + 0.12 * t, 1 - 0.16 * t);
    if (t >= 1 && !this.chargeArmed) {
      this.chargeArmed = true;
      const foot = im.y + ((im.getData("arcLift") as number) ?? 0);
      this.kickDust(im.x, foot, 5, 0.7);
      this.tweens.add({
        targets: im,
        scaleX: 0.94,
        scaleY: 1.1,
        duration: 90,
        yoyo: true,
        ease: "Quad.easeOut",
      });
    }
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
        // Stretch off the ground, square at the apex, squash into the landing.
        const p = tween.progress;
        const shape = p < 0.25 ? p / 0.25 : p > 0.8 ? -(p - 0.8) / 0.2 : 0;
        im.setScale(1 - 0.12 * shape, 1 + 0.16 * shape);
      },
      onComplete: () => {
        im.setPosition(tx, ty);
        im.setData("arcLift", 0);
        im.setScale(1, 1);
        this.kickDust(tx, ty, arc.height > 26 ? 7 : 4, arc.height / 24);
      },
    });
  }
  private sprite(frame: string, x: number, y: number, depth: number) {
    const image = this.add
      .image(
        x,
        y - this.lift(x, y),
        this.texture(frame),
        this.textureFrame(frame),
      )
      .setOrigin(0.5, 1)
      .setTint(this.tint)
      .setDepth(depth);
    this.layers.push(image);
    return image;
  }
  /** One pixel-accurate hit area, a hand cursor, a hover label and a click that
   * selects — everything the player can point at gets the same treatment. */
  private makeSelectable(
    image: Phaser.GameObjects.Image,
    id: string,
    mirrored = false,
  ) {
    if (this.options.lab) return;
    image.setInteractive(
      mirrored
        ? this.mirroredHitArea()
        : { pixelPerfect: true, useHandCursor: true },
    );
    image.on(
      "pointerdown",
      (
        pointer: Phaser.Input.Pointer,
        _x: number,
        _y: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        if (pointer.rightButtonDown()) return;
        event.stopPropagation();
        this.runtime.select(id);
      },
    );
    image.on("pointerover", (pointer: Phaser.Input.Pointer) =>
      this.showHover(id, pointer),
    );
    image.on("pointermove", (pointer: Phaser.Input.Pointer) =>
      this.moveHover(pointer),
    );
    image.on("pointerout", () => this.hideHover());
    image.once("destroy", () => {
      if (this.hoverId === id) this.hideHover();
    });
  }
  private createHoverTip() {
    const parent = this.game.canvas.parentElement;
    if (!parent || this.options.lab) return;
    const tip = document.createElement("div");
    tip.className = "world-tooltip";
    tip.setAttribute("aria-hidden", "true");
    parent.appendChild(tip);
    this.hoverTip = tip;
    this.events.once("shutdown", () => tip.remove());
  }
  private showHover(id: string, pointer: Phaser.Input.Pointer) {
    const tip = this.hoverTip;
    if (!tip) return;
    this.hoverId = id;
    const name = this.runtime.engine.inspect(id)?.name;
    if (!name) {
      this.hideHover();
      return;
    }
    tip.textContent = name;
    tip.classList.add("is-shown");
    this.moveHover(pointer);
  }
  private moveHover(pointer: Phaser.Input.Pointer) {
    const tip = this.hoverTip;
    if (!tip || !this.hoverId) return;
    // Left of the cursor once the label would otherwise run off the canvas.
    const flip = pointer.x + tip.offsetWidth + 22 > this.scale.width;
    tip.style.left = `${Math.round(flip ? pointer.x - tip.offsetWidth - 14 : pointer.x + 14)}px`;
    tip.style.top = `${Math.round(pointer.y + 14)}px`;
  }
  private hideHover() {
    this.hoverId = undefined;
    this.hoverTip?.classList.remove("is-shown");
  }
  private selectedImage() {
    const id = this.runtime.selected;
    if (!id) return undefined;
    const decor = /^decor-(-?\d+)-(-?\d+)$/.exec(id);
    const image = decor
      ? this.plantImages.get(`${decor[1]},${decor[2]}`)?.[0]
      : (this.entities.get(id) ?? this.buildings.get(id));
    return image?.active ? image : undefined;
  }
  /** A ring of tinted copies behind the sprite: the fringe that shows past its
   * own silhouette is the outline, and additive blending makes it glow. */
  private drawSelectionGlow(time: number) {
    const target = this.selectedImage();
    if (!target || !target.visible) {
      for (const g of this.glowSprites) g.setVisible(false);
      return;
    }
    const pulse = 0.78 + 0.22 * Math.sin(time / 420);
    GLOW_RING.forEach((offset, i) => {
      let g = this.glowSprites[i];
      if (!g) {
        g = this.add.image(0, 0, target.texture.key, target.frame.name);
        g.setBlendMode(Phaser.BlendModes.ADD);
        this.glowSprites[i] = g;
      }
      if (
        g.texture.key !== target.texture.key ||
        g.frame.name !== target.frame.name
      )
        g.setTexture(target.texture.key, target.frame.name);
      g.setOrigin(target.originX, target.originY)
        .setFlipX(target.flipX)
        .setScale(target.scaleX, target.scaleY)
        .setPosition(target.x + offset.dx, target.y + offset.dy)
        .setDepth(target.depth - 1)
        .setTint(0xffd9a0)
        .setAlpha(offset.alpha * pulse * target.alpha)
        .setVisible(true);
      // Trees are cropped below the canopy; the outline has to stop there too.
      const crop = (
        target as unknown as {
          _crop: { x: number; y: number; width: number; height: number };
        }
      )._crop;
      if (target.isCropped) g.setCrop(crop.x, crop.y, crop.width, crop.height);
      else if (g.isCropped) g.setCrop();
    });
  }
  /** Phaser reads the alpha mask straight off the texture and knows nothing
   * about flipX, so a mirrored sprite stays clickable along its old
   * silhouette. Mirror the probe back before it reaches the mask. */
  private mirroredHit?: Phaser.Types.Input.HitAreaCallback;
  private mirroredHitArea() {
    if (!this.mirroredHit) {
      const pixel = this.input.makePixelPerfect() as (
        ...args: Parameters<Phaser.Types.Input.HitAreaCallback>
      ) => boolean;
      this.mirroredHit = (hitArea, x, y, gameObject) =>
        pixel(
          hitArea,
          (gameObject as Phaser.GameObjects.Image).width - x,
          y,
          gameObject,
        );
    }
    return {
      hitArea: {},
      hitAreaCallback: this.mirroredHit,
      useHandCursor: true,
    };
  }
  private addWind(
    image: Phaser.GameObjects.Image,
    frame: string,
    phase: number,
    isTree = false,
  ) {
    const profile = windProfile(frame, isTree);
    if (profile) {
      image.setData("wind", true);
      this.windSprites.push({ image, baseX: image.x, phase, profile });
    }
  }
  /** The leaf over a baked-shut door.
   *
   * The building art paints the door shut and publishes its rect; the leaf is
   * a single four-frame sprite shared by every building, drawn over that rect
   * only while somebody is at the threshold.
   */
  private addDoor(
    place: Place,
    placement: ReturnType<typeof buildingPlacement>,
    /** The drawn top of the building, which on sloped ground is not its
     * cell position: the sign does the same. */
    baseY: number,
  ) {
    const rect = (
      placement.model as typeof placement.model & { door?: number[] }
    ).door;
    if (!rect) return;
    const image = this.add
      .image(
        placement.x - placement.model.anchor[0] + rect[0],
        baseY - placement.model.anchor[1] + rect[1],
        this.texture("door-leaf-1"),
        "door-leaf-1",
      )
      .setOrigin(0, 0)
      .setTint(this.tint)
      .setDepth(placement.depth + 1)
      .setVisible(false);
    this.layers.push(image);
    // Born at the state it is already in. Scenery is rebuilt every few steps,
    // and easing from shut each time made every open door blink.
    const shut = !this.runtime.engine.doorOf(place.id)?.open;
    const openness = shut ? 0 : 1;
    if (!shut) image.setFrame("door-leaf-3").setVisible(true);
    this.doors.set(place.id, { image, openness, shut });
  }
  /** Doors swing to follow the door objects the engine owns.
   *
   * The scene holds no opinion about who may open what: it reads `open` and
   * eases the leaf toward it, so the animation can never disagree with what
   * the simulation and the pathfinder believe.
   */
  private swingDoors() {
    if (!this.doors.size) return;
    const now = this.time.now;
    for (const o of this.runtime.engine.state.objects) {
      if (o.kind !== "door" || !o.placeId) continue;
      const door = this.doors.get(o.placeId);
      if (!door) continue;
      door.shut = !o.open;
      // A knock is answered on the game clock, which only moves when the
      // player acts; the shudder is wall time, so it plays once and stops.
      if (o.knocked !== undefined && o.knocked !== door.knockSeen) {
        door.knockSeen = o.knocked;
        door.rattleUntil = now + 700;
      }
    }
    // A tenth of a second from shut to wide; the walk to a door is slower.
    const step = this.options.freeze ? 1 : 0.16;
    let open = 0;
    for (const door of this.doors.values()) {
      const rattling = !this.options.freeze && now < (door.rattleUntil ?? 0);
      if (rattling) {
        // Shut, but shaken in its frame: an inch of daylight, four times over.
        door.openness = Math.sin(now / 45) > 0 ? 0.34 : 0;
      } else {
        const target = door.shut ? 0 : 1;
        if (door.openness !== target)
          door.openness =
            target > door.openness
              ? Math.min(1, door.openness + step)
              : Math.max(0, door.openness - step);
      }
      if (door.openness > 0) open++;
      const frame = Math.min(3, Math.round(door.openness * 3));
      if (!frame) door.image.setVisible(false);
      else {
        const name = `door-leaf-${frame}`;
        if (door.image.frame.name !== name) door.image.setFrame(name);
        door.image.setVisible(true);
      }
    }
    const count = `${open}/${this.doors.size}`;
    if (this.game.canvas.dataset.doors !== count)
      this.game.canvas.dataset.doors = count;
  }
  private addBuildingAnimation(
    id: string,
    placement: ReturnType<typeof buildingPlacement>,
    animation: BuildingAnimationRecipe,
  ) {
    if (animation.kind !== "roof-fan") return;
    const chance = Math.max(0, Math.min(1, animation.chance ?? 1));
    if (
      chance < 1 &&
      random(
        this.runtime.engine.state.manifest.seed,
        "building-animation",
        id,
      ) >= chance
    )
      return;
    const frame = "animation-roof-fan-0";
    const image = this.add
      .image(
        placement.x -
          placement.model.anchor[0] +
          placement.model.bounds[2] * animation.xRatio,
        placement.y - placement.model.anchor[1] + animation.y,
        this.texture(frame),
        frame,
      )
      .setOrigin(0.5, 0.5)
      .setTint(this.tint)
      .setDepth(placement.depth + 1);
    this.layers.push(image);
    this.buildingAnimations.set(id, {
      image,
      period: Math.max(120, animation.period ?? 280),
      phase: animation.phase ?? 0,
    });
  }
  /** The word over a shop door.
   *
   * The building art paints the board and publishes its rect; the word is
   * chosen here, from the trade, the language the street writes in, and — for
   * the trades a family puts its own name over — the surname of whoever keeps
   * it. The shortest word that fits the board wins, so a narrow frontage says
   * PAIN where a wide one says BOULANGER.
   */
  private addBuildingSign(
    place: Place,
    placement: ReturnType<typeof buildingPlacement>,
    setting: WorldSetting | undefined,
    // The building's own drawn y: `sprite()` lifts it by the ground height,
    // and a sign that ignores that slides down the facade on any slope.
    top: number,
  ) {
    const model = placement.model as typeof placement.model & {
      signBand?: [number, number, number, number];
      signPaint?: string;
      business?: string;
    };
    const band = model.signBand;
    if (!band || !setting) return;
    const language = signLanguage(setting);
    if (!language) return;
    const seed = this.runtime.engine.state.manifest.seed;
    // The kit's own shopfronts carry no trade, and a street of them all
    // reading SHOP is worse than no sign. Give each one a trade of its own.
    const trade =
      model.business ||
      GENERIC_TRADES[
        Math.floor(random(seed, "sign-trade", place.id) * GENERIC_TRADES.length)
      ];
    if (trade.startsWith("residential")) return;
    const personal = random(seed, "sign-name", place.id) < 0.38;
    const options = signOptions(
      trade,
      language,
      this.ownerSurname(place),
      personal,
    );
    const budget = band[2] - 6;
    const word = options.find((option) => signWidth(option) <= budget);
    if (!word) return;
    const ink = inkFor(model.signPaint ?? "#b69b58");
    const key = ensureSignTexture(this, word, ink);
    if (!key) return;
    const image = this.add
      .image(
        Math.round(placement.x - model.anchor[0] + band[0] + band[2] / 2),
        Math.round(top - model.anchor[1] + band[1] + band[3] / 2),
        key,
      )
      .setOrigin(0.5, 0.5)
      .setTint(this.tint)
      .setDepth(placement.depth + 1);
    this.layers.push(image);
  }

  /** The family name of whoever keeps this place, where the culture and the
   * century give people family names at all. Generation already decides that,
   * so a one-word name simply yields nothing here. */
  private ownerSurname(place: Place): string | undefined {
    if (!place.owner) return undefined;
    const owner = this.runtime.engine.state.actors.find(
      (actor) => actor.id === place.owner,
    );
    const parts = owner?.name.trim().split(/\s+/) ?? [];
    const family = parts.length > 1 ? parts[parts.length - 1] : undefined;
    // Three letters is a syllable, not a name over a door.
    return family && family.length >= 4 ? family : undefined;
  }

  /** Whether this household has a fire in today. Hearths are lit to cook
   * morning and evening, and kept in all day when it is cold; not every
   * house at once, so a village is not a row of identical chimneys. */
  private hearthLit(id: string) {
    if (this.options.freeze || !perf.fires) return false;
    const hour = Math.floor(
      (((this.runtime.engine.state.clock / 3600) % 24) + 24) % 24,
    );
    const cooking = (hour >= 5 && hour < 10) || (hour >= 16 && hour < 22);
    const cold = (this.weather?.tempC ?? 20) < 9;
    if (!cooking && !cold) return false;
    const share = cooking ? 0.7 : 0.45;
    return (
      random(this.runtime.engine.state.manifest.seed, "hearth", id) < share
    );
  }
  /** A thread of smoke off the roof, leaning downwind. Anchored at the ridge
   * rather than the middle of the sprite: a thatched house vents through the
   * roof, not out of its front wall. */
  private lightHearth(
    id: string,
    placement: ReturnType<typeof buildingPlacement>,
  ) {
    if (this.hearths.has(id)) return;
    const key = ensureHearthSmoke(this);
    const x =
      placement.x -
      placement.model.anchor[0] +
      placement.model.bounds[2] * 0.62;
    // Just clear of the ridge: a puff drawn on the roofline reads as part of
    // the roof rather than as something leaving it.
    const y = placement.y - placement.model.anchor[1] - 2;
    const puffs: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < HEARTH_PUFFS; i++) {
      const puff = this.add
        .image(x, y, key, HEARTH_FRAMES[0])
        .setAlpha(0)
        .setDepth(placement.depth + 2);
      this.layers.push(puff);
      const rise = () => {
        // The scenery cache can be thrown away between the delayed call being
        // booked and its firing, taking the puff with it.
        if (!puff.scene || this.hearths.get(id) !== puffs) return;
        // Read the wind each cycle, so a plume leans over as the day gets up.
        const air = wind();
        const lean = Math.cos(air.angle) * (16 + air.strength * 52);
        const jitter = (Math.random() - 0.5) * 5;
        puff
          .setPosition(x + jitter, y)
          .setAlpha(0.72)
          .setFrame(HEARTH_FRAMES[0]);
        this.tweens.add({
          targets: puff,
          y: y - 58 - Math.random() * 14,
          x: x + jitter + lean,
          alpha: 0,
          duration: HEARTH_MS,
          ease: "Sine.easeOut",
          // The puff widens by changing frame, never by scaling: a scaled
          // pixel blob stops matching the grid everything else sits on.
          onUpdate: (tween) =>
            puff.setFrame(
              HEARTH_FRAMES[Math.min(2, Math.floor(tween.progress * 3))],
            ),
          onComplete: rise,
        });
      };
      this.time.delayedCall((i * HEARTH_MS) / HEARTH_PUFFS, rise);
      puffs.push(puff);
    }
    this.hearths.set(id, puffs);
    this.game.canvas.dataset.hearths = String(this.hearths.size);
  }
  /** Flame frames, a ground glow and a few drifting puffs of smoke. */
  private lightFire(
    id: string,
    image: Phaser.GameObjects.Image,
    base: string,
    x: number,
    y: number,
  ) {
    const existing = this.fires.get(id);
    if (existing && existing.base === base) return;
    if (existing) this.quenchFire(id);
    const phase = Math.floor(this.poseOffset(id) % 4);
    const glow = this.add
      .image(x, y - 10, "fire-glow")
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.4, 1)
      .setAlpha(glowAlpha[this.light.id])
      .setDepth(image.depth - 1);
    const smoke: Phaser.GameObjects.Image[] = [];
    if (!this.options.freeze)
      for (let i = 0; i < SMOKE_PUFFS; i++) {
        const puff = this.add
          .image(x, y - 34, "fire-smoke")
          .setAlpha(0)
          .setDepth(image.depth + 1);
        const drift = () => {
          const dx = (Math.random() - 0.5) * 6;
          puff
            .setPosition(x + dx, y - 32)
            .setAlpha(0.32)
            .setScale(0.5);
          this.tweens.add({
            targets: puff,
            y: y - 60,
            x: x + dx + (Math.random() - 0.3) * 10,
            alpha: 0,
            scale: 1.7,
            duration: SMOKE_MS,
            ease: "Sine.easeOut",
            onComplete: drift,
          });
        };
        this.time.delayedCall((i * SMOKE_MS) / SMOKE_PUFFS, drift);
        smoke.push(puff);
      }
    this.fires.set(id, { image, base, phase, glow, smoke });
  }
  private quenchFire(id: string) {
    const fire = this.fires.get(id);
    if (!fire) return;
    fire.glow.destroy();
    for (const puff of fire.smoke) {
      this.tweens.killTweensOf(puff);
      puff.destroy();
    }
    this.fires.delete(id);
  }
  /** Frames that live in the buildings atlas, read off the texture once it is
   * loaded. A name test would need every recipe prefix; the atlas already
   * knows what it holds. */
  private buildingFrames?: Set<string>;
  private civicFrames?: Set<string>;
  private texture(frame: string) {
    if (!this.buildingFrames && this.textures.exists("buildings"))
      this.buildingFrames = new Set(
        this.textures.get("buildings").getFrameNames(),
      );
    if (!this.civicFrames && this.textures.exists("civic"))
      this.civicFrames = new Set(this.textures.get("civic").getFrameNames());
    if (this.buildingFrames?.has(frame)) return "buildings";
    if (this.civicFrames?.has(frame)) return "civic";
    if (frame.startsWith("study-sheet-tree-")) return "tree-study";
    if (frame.startsWith("study-tree-"))
      return frame.slice(0, frame.lastIndexOf("-"));
    if (frame.startsWith("study-litter-")) return "tree-study";
    if (frame.startsWith("nature-")) return "nature";
    if (frame.startsWith("faunab-")) return "faunab";
    if (frame.startsWith("faunac-")) return "faunac";
    if (frame.startsWith("ecology-")) return "ecology";
    // "study-propb-" is the same atlas: match the prefix without the hyphen.
    return frame.startsWith("study-prop") || frame.startsWith("prop-broken-")
      ? "props"
      : "atlas";
  }
  /** A prop whose hangings are a separate frame: the entity draws the rigid
   * part and the hangings ride over it. The whole sprite stays in the atlas
   * for the lab, the UI and the shadow mask. */
  private layerOf(frame: string, layer: "frame" | "hang" | "fallen") {
    if (!frame.startsWith("study-propb-")) return undefined;
    const key = `${frame}-${layer}`;
    return this.textures.get("props").has(key) ? key : undefined;
  }
  private textureFrame(frame: string): string | number {
    if (frame.startsWith("study-sheet-tree-")) return frame.slice(17);
    if (frame.startsWith("study-tree-"))
      return Number(frame.slice(frame.lastIndexOf("-") + 1));
    if (frame.startsWith("study-litter-")) return frame.slice(13);
    return frame;
  }
  private prepareTreeStudySheet() {
    if (this.textures.exists("tree-study")) return;
    const source = this.textures
      .get("tree-study-source")
      .getSourceImage() as HTMLImageElement;
    const texture = this.textures.createCanvas("tree-study", 128, 128);
    if (!texture) return;
    const context = texture.getContext();
    context.drawImage(source, 0, 0);
    const data = context.getImageData(0, 0, 128, 128);
    for (let i = 0; i < data.data.length; i += 4)
      if (
        data.data[i] > 245 &&
        data.data[i + 1] > 245 &&
        data.data[i + 2] > 245
      )
        data.data[i + 3] = 0;
    context.putImageData(data, 0, 0);
    texture.add("pine", 0, 0, 0, 16, 48);
    texture.add("broadleaf", 0, 48, 0, 48, 48);
    texture.add("log-a", 0, 64, 48, 32, 16);
    texture.add("log-b", 0, 96, 48, 32, 16);
    texture.add("brush", 0, 32, 48, 32, 32);
    texture.add("grass-a", 0, 64, 96, 16, 16);
    texture.add("grass-b", 0, 80, 96, 16, 16);
    texture.add("grass-c", 0, 96, 96, 16, 16);
    texture.add("grass-d", 0, 112, 96, 16, 16);
    texture.refresh();
  }
  private textureFilter() {
    return this.liveGraphics.textureSampling === "nearest"
      ? Phaser.Textures.FilterMode.NEAREST
      : Phaser.Textures.FilterMode.LINEAR;
  }
  applyLiveGraphics(patch: Partial<LiveGraphicsSettings>) {
    this.liveGraphics = { ...this.liveGraphics, ...patch };
    const terrainKeys = [
      "groundDetailDensity",
      "groundDetailSpacing",
      "groundDetailClustering",
      "pathWidth",
      "pathWobble",
      "pathEdgeBreakup",
      "pathFringe",
    ] as const;
    if (terrainKeys.some((key) => key in patch)) {
      const style = defaultGroundStyle();
      style.composition = {
        motifDensity: this.liveGraphics.groundDetailDensity,
        motifSpacing: this.liveGraphics.groundDetailSpacing,
        motifClustering: this.liveGraphics.groundDetailClustering,
        pathWidth: this.liveGraphics.pathWidth,
        pathWobble: this.liveGraphics.pathWobble,
        pathEdgeBreakup: this.liveGraphics.pathEdgeBreakup,
        pathFringe: this.liveGraphics.pathFringe,
      };
      restyleTerrain(style);
    }
    if (
      [
        "previewRockDistribution",
        "rockDensity",
        "rockAltitudeBias",
        "rockDrynessBias",
        "rockClustering",
        "rockClusterScale",
        "treePalette",
        "treeScale",
        "litterPalette",
        "litterDensity",
      ].some((key) => key in patch)
    ) {
      this.staticKey = "";
      if (this.scene?.isActive()) this.draw();
    }
    if (!this.cameras?.main || !this.game?.canvas) return;
    const camera = this.cameras.main;
    camera.roundPixels = this.liveGraphics.roundPixels;
    camera.setLerp(this.liveGraphics.followLerp);
    this.game.canvas.style.imageRendering = this.liveGraphics.canvasSampling;
    this.textures.each(
      (texture: Phaser.Textures.Texture) =>
        texture.setFilter(this.textureFilter()),
      this,
    );
    Object.assign(this.game.canvas.dataset, {
      roundPixels: String(this.liveGraphics.roundPixels),
      textureSampling: this.liveGraphics.textureSampling,
      canvasSampling: this.liveGraphics.canvasSampling,
      zoomDuration: String(this.liveGraphics.zoomDuration),
      zoomEase: this.liveGraphics.zoomEase,
      followLerp: String(this.liveGraphics.followLerp),
      rockPreview: String(this.liveGraphics.previewRockDistribution),
      rockDensity: String(this.liveGraphics.rockDensity),
      pathWidth: String(this.liveGraphics.pathWidth),
      pathWobble: String(this.liveGraphics.pathWobble),
      pathEdgeBreakup: String(this.liveGraphics.pathEdgeBreakup),
      treePalette: this.liveGraphics.treePalette,
      litterPalette: this.liveGraphics.litterPalette,
    });
    if (!this.liveGraphics.zoomDuration && this.zoomTarget !== undefined) {
      camera.zoomEffect.reset();
      camera.setZoom(this.zoomTarget);
      this.game.canvas.dataset.cameraZoom = String(this.zoomTarget);
    }
  }
  addTestFauna(speciesId: string, state: FaunaState, count: number) {
    const player = this.runtime.engine.state.player;
    if (player.pos.space !== "outside") return 0;
    const world = this.runtime.engine.world;
    const cells: { x: number; y: number }[] = [];
    const used = new Set(
      this.testFauna.flatMap((group) =>
        group.members.map((member) => `${member.x},${member.y}`),
      ),
    );
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ] as const;
    for (let ring = 3; ring <= 12 && cells.length < count; ring += 3)
      for (const [dx, dy] of directions) {
        const x = player.pos.x + dx * ring,
          y = player.pos.y + dy * ring;
        if (!used.has(`${x},${y}`) && !world.blocked(x, y, "outside"))
          cells.push({ x, y });
        if (cells.length >= count) break;
      }
    if (!cells.length) return 0;
    const id = `dev-fauna-${++this.testFaunaSerial}`;
    const members = cells
      .slice(0, Math.max(1, Math.min(12, count)))
      .map(({ x, y }, index) => ({
        x,
        y,
        direction: (index % 2 ? 3 : 1) as 1 | 3,
      }));
    const pos = { ...members[0], space: "outside" as const };
    this.testFauna.push({
      id,
      speciesId,
      members,
      pos,
      home: { ...pos },
      homeRadius: 8,
      state,
      nextDecisionAt: Infinity,
      stride: 0,
      since: this.runtime.engine.state.clock,
    });
    this.game.canvas.dataset.testFaunaCount = String(
      this.testFauna.reduce((total, group) => total + group.members.length, 0),
    );
    this.draw();
    return members.length;
  }
  clearTestFauna() {
    this.testFauna = [];
    if (this.game?.canvas) this.game.canvas.dataset.testFaunaCount = "0";
    this.draw();
  }
  private setCameraZoom(target: number) {
    const camera = this.cameras.main;
    if (this.zoomTarget === target) return;
    const initial = this.zoomTarget === undefined;
    this.zoomTarget = target;
    this.game.canvas.dataset.cameraZoomTarget = String(target);
    if (initial || !this.liveGraphics.zoomDuration || this.options.lab) {
      camera.setZoom(target);
      this.game.canvas.dataset.cameraZoom = String(target);
      return;
    }
    camera.zoomTo(
      target,
      this.liveGraphics.zoomDuration,
      this.liveGraphics.zoomEase,
      true,
      (_camera, _progress, zoom) => {
        this.game.canvas.dataset.cameraZoom = zoom.toFixed(4);
      },
    );
  }
  /** How much direct sun reaches the ground. Cloud takes the edge off a cast
   * shadow and a downpour removes it: there is no sun behind the rain. */
  private sunStrength() {
    switch (this.weather?.condition) {
      case "rain":
        return 0.12;
      case "overcast":
        return 0.28;
      case "mist":
        return 0.45;
      case "light-clouds":
        return 0.85;
      default:
        return 1;
    }
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
    const sun = this.sunStrength();
    if (sun < 1) image.setAlpha(sun);
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
    if (this.drawnWorld && w !== this.drawnWorld && this.testFauna.length) {
      this.testFauna = [];
      this.game.canvas.dataset.testFaunaCount = "0";
    }
    this.light = this.options.lighting
      ? lightingPreset(this.options.lighting)
      : lightingAt(e.state.clock);
    this.tint =
      this.options.colorGrade === false
        ? 0xffffff
        : parseInt(this.light.tint, 16);
    this.shadowPhase = p.space === "outside" ? this.light.id : "night";
    const setting = w.pack.setting;
    this.season = setting
      ? (seasonAt(setting.season, e.state.clock) ?? setting.season)
      : "summer";
    this.weather = setting
      ? weatherAt(
          e.state.manifest.seed,
          setting.climate,
          setting.season,
          e.state.clock,
        )
      : undefined;
    // One wind for the scene: grass, canopies and anything airborne read it.
    if (this.weather) setWind(this.weather.wind);
    const outdoors =
      p.space === "outside" && (!this.options.overview || this.options.lab);
    this.drift?.set(
      outdoors && setting && this.weather
        ? driftStyle(
            this.season,
            setting.environment?.ecology ?? "grassland",
            setting.climate,
            this.weather.condition,
            this.weather.tempC,
          )
        : undefined,
      hashSeed(e.state.manifest.seed),
    );
    this.life?.set(
      outdoors && setting && this.weather && perf.fauna
        ? critterFor(
            this.season,
            setting.environment?.ecology ?? "grassland",
            setting.climate,
            this.light.id,
            this.weather.condition,
            this.weather.tempC,
            this.weather.wetness,
          )
        : undefined,
      hashSeed(e.state.manifest.seed),
    );
    this.mist?.set(
      outdoors && this.weather && this.options.colorGrade !== false
        ? this.weather.condition === "mist"
          ? 0.55
          : this.weather.condition === "rain"
            ? 0.16
            : this.weather.condition === "overcast"
              ? 0.08
              : 0
        : 0,
    );
    const c = this.cameras.main;
    this.setCameraZoom(rt.zoom);
    const footprint =
      p.space === "outside" && !this.options.overview
        ? w.pack.setting?.playableMap?.size
        : undefined;
    const margin = 20 / rt.zoom;
    if (footprint)
      c.setBounds(
        -footprint * 8 - margin,
        -footprint * 8 - margin,
        footprint * 16 + margin * 2,
        footprint * 16 + margin * 2,
      );
    else c.removeBounds();
    const viewCenter = (value: number, pixels: number) => {
      if (!footprint) return value;
      const reach = Math.max(
        0,
        footprint / 2 - pixels / rt.zoom / 32 + margin / 16,
      );
      return Math.max(-reach, Math.min(reach, value));
    };
    const viewX = viewCenter(p.x, this.scale.width),
      viewY = viewCenter(p.y, this.scale.height);
    if (w !== this.drawnWorld) {
      this.pendingDirection = undefined;
      c.centerOn(p.x * 16 + 8, p.y * 16 + 8);
      this.entities
        .get("player")
        ?.setPosition(
          p.x * 16 + 8,
          p.y * 16 + 16 - this.lift(p.x * 16 + 8, p.y * 16 + 16),
        );
    }
    if (!this.entities.has("player") && !this.options.overview)
      c.centerOn(p.x * 16 + 8, p.y * 16 + 8);
    if (w !== this.drawnWorld) {
      this.toolEffects?.dispose();
      this.terrainStream?.dispose();
      this.terrainStream = undefined;
      this.terrainAnchor = undefined;
    } else if (p.space !== "outside") {
      // Indoors the street is only out of sight. Rasterising it again on the
      // way back out is what made a settlement fill in a quadrant at a time.
      this.toolEffects?.dispose();
      this.terrainStream?.setHidden(true);
      this.terrainAnchor = undefined;
    }
    if (w.topography && p.space === "outside") {
      this.terrainStream ??= new TerrainStream(this, w, e.state.manifest.seed);
      this.terrainStream.setHidden(false);
      this.terrainStream.setView(
        viewX,
        viewY,
        Math.ceil(this.scale.width / rt.zoom / 32),
        Math.ceil(this.scale.height / rt.zoom / 32),
      );
      this.terrainStream.setSun({
        id: this.shadowPhase,
        cast: lightingPreset(this.shadowPhase).cast as [number, number],
        opacity: lightingPreset(this.shadowPhase).opacity * this.sunStrength(),
      });
    }
    // Scenery has a small movement allowance; the expensive ground and
    // contour textures are owned independently by TerrainStream.
    if (
      w.topography &&
      (!this.terrainAnchor ||
        (perf.sceneryRebuilds &&
          (Math.abs(viewX - this.terrainAnchor.x) > perf.sceneryReach ||
            Math.abs(viewY - this.terrainAnchor.y) > perf.sceneryReach)))
    )
      this.terrainAnchor = { x: Math.floor(viewX), y: Math.floor(viewY) };
    const bx = w.topography ? this.terrainAnchor!.x : Math.floor(p.x / 16) * 16,
      by = w.topography ? this.terrainAnchor!.y : Math.floor(p.y / 16) * 16;
    const key = [
      e.state.manifest.seed,
      w.pack.id,
      p.space,
      // Felled trees, cut growth and fresh furrows change the scenery.
      e.state.tilesRevision ?? 0,
      bx,
      by,
      rt.zoom,
      this.light.id,
      this.tint,
      // Shadow strength is baked into the cached sprites, so a shower has to
      // invalidate them the way an hour change does.
      this.sunStrength(),
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
      this.plantHeights.clear();
      this.plantImages.clear();
      this.windSprites = [];
      this.ripples = [];
      this.buildings.clear();
      this.buildingAnimations.clear();
      this.doors.clear();
      for (const puffs of this.hearths.values())
        for (const puff of puffs) this.tweens.killTweensOf(puff);
      this.hearths.clear();
      this.game.canvas.dataset.hearths = "0";
      this.ground?.destroy();
      this.tilemap?.destroy();
      const margin = w.topography ? perf.sceneryReach + 6 : 20;
      const halfX = Math.ceil(this.scale.width / rt.zoom / 32) + margin,
        halfY = Math.ceil(this.scale.height / rt.zoom / 32) + margin;
      const mapHalf =
        p.space === "outside" ? w.pack.setting?.playableMap?.size : undefined;
      const limit = mapHalf === undefined ? Infinity : mapHalf / 2 + 16;
      const startX = Math.max(bx - halfX, -limit),
        startY = Math.max(by - halfY, -limit);
      const width = Math.max(0, Math.min(bx + halfX + 16, limit) - startX),
        height = Math.max(0, Math.min(by + halfY + 16, limit) - startY);
      if (mapHalf !== undefined) {
        const g = this.add.graphics().setDepth(1000000),
          h = mapHalf * 8,
          extent = 100000;
        g.fillStyle(0x101c20);
        g.fillRect(-extent, -extent, extent * 2, extent - h);
        g.fillRect(-extent, h, extent * 2, extent - h);
        g.fillRect(-extent, -h, extent - h, h * 2);
        g.fillRect(h, -h, extent - h, h * 2);
        g.lineStyle(2 / rt.zoom, 0xf0ca82);
        g.strokeRect(-h, -h, h * 2, h * 2);
        for (const e of rt.journey?.entrances ?? [])
          if (e.point) {
            g.fillStyle(e.mode === "land" ? 0xf0ca82 : 0x64c3d4);
            g.fillCircle(e.point.x * 16 + 8, e.point.y * 16 + 8, 14);
          }
        this.layers.push(g);
      }
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
            let d = w.decoration(x, y);
            let previewRock = false;
            if (this.liveGraphics.previewRockDistribution && w.topography) {
              if (d?.sprite === "rock") d = undefined;
              const cell = w.topography(x, y);
              if (
                !d &&
                cell?.habitat &&
                !cell.feature &&
                !cell.pathArt?.length &&
                !cell.bridge &&
                !cell.ramp &&
                !["water", "damp", "snow"].includes(cell.surface)
              ) {
                const altitude = Math.min(1, Math.max(0, cell.height / 7));
                const dryness = Math.max(
                  cell.habitat.exposed,
                  1 - cell.habitat.wet,
                );
                const ecology = Math.max(
                  0.08,
                  1 +
                    this.liveGraphics.rockAltitudeBias *
                      (altitude - 0.35) *
                      1.7 +
                    this.liveGraphics.rockDrynessBias * (dryness - 0.5) * 1.35,
                );
                const scale = this.liveGraphics.rockClusterScale;
                const cluster = random(
                  e.state.manifest.seed,
                  "rock-preview-cluster",
                  Math.floor(x / scale),
                  Math.floor(y / scale),
                );
                const clustered =
                  1 + this.liveGraphics.rockClustering * (cluster - 0.5) * 2;
                const chance = Math.min(
                  0.22,
                  (this.liveGraphics.rockDensity / 100) * ecology * clustered,
                );
                previewRock =
                  random(e.state.manifest.seed, "rock-preview", x, y) < chance;
              }
            }
            if (d || previewRock) {
              const originalName = previewRock ? "rock" : d!.sprite;
              const originalIsTree =
                natureTreeSprites.includes(originalName) ||
                w.pack.trees.includes(originalName);
              const alternate = this.liveGraphics.treePalette;
              const spriteName =
                originalIsTree && alternate !== "native"
                  ? alternate === "sheet-pine"
                    ? "study-sheet-tree-pine"
                    : alternate === "sheet-broadleaf"
                      ? "study-sheet-tree-broadleaf"
                      : `study-tree-${alternate}-${alternateTrees[alternate][1] - 1}`
                  : originalName;
              const frame =
                spriteName === "rock"
                  ? rockFrame(
                      w.topography?.(x, y)?.habitat,
                      random(e.state.manifest.seed, "rock-art", x, y),
                    )
                  : spriteName;
              this.shadow(frame, x * 16 + 8, y * 16 + 16);
              const decoration = this.sprite(
                frame,
                x * 16 + 8,
                y * 16 + 16,
                y * 16 + 12,
              );
              if (
                spriteName.startsWith("study-tree-") ||
                spriteName.startsWith("study-sheet-tree-")
              )
                decoration.setScale(this.liveGraphics.treeScale);
              // sprite() already carries the hour-of-day grade; the season and
              // the per-prop tone multiply into it.
              let tint = this.tint;
              if (originalIsTree && w.pack.setting) {
                const turn = foliageTint(
                  originalName,
                  this.season,
                  w.pack.setting.environment?.ecology ?? "grassland",
                  random(e.state.manifest.seed, "foliage", x, y),
                );
                if (turn) tint = blendTint(tint, turn);
              }
              const variety = propVariety(e.state.manifest.seed, frame, x, y);
              if (variety.flip) decoration.setFlipX(true);
              if (variety.tint !== 0xffffff)
                tint = blendTint(tint, variety.tint);
              if (tint !== this.tint) decoration.setTint(tint);
              if (d?.solid)
                this.plantHeights.set(d.id, decoration.displayHeight);
              if (d) {
                const key = `${x},${y}`;
                this.plantImages.set(key, [
                  ...(this.plantImages.get(key) ?? []),
                  decoration,
                ]);
              }
              if (d && d.sprite !== "rock")
                this.makeSelectable(decoration, d.id, variety.flip);
              if (
                (w.pack.setting?.vegetationRevision ?? 0) >= 2 &&
                (originalIsTree ||
                  natureTreeSprites.includes(frame) ||
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
                if (
                  spriteName.startsWith("study-tree-") ||
                  spriteName.startsWith("study-sheet-tree-")
                )
                  trunk.setScale(this.liveGraphics.treeScale);
                // The canopy above it is the same sprite: a trunk that does
                // not mirror with it splits the tree down the middle.
                if (variety.flip) trunk.setFlipX(true);
                if (tint !== this.tint) trunk.setTint(tint);
                trunk.setCrop(0, cut, trunk.width, trunk.height - cut);
                this.plantImages.get(`${x},${y}`)?.push(trunk);
              }
              if (spriteName === "rock" && w.topography) {
                const cell = w.topography(x, y);
                if (
                  cell?.waterVisual &&
                  cell.waterVisual.distance < cell.waterVisual.shoreWidth + 4
                )
                  decoration.setTint(waterStyle(cell).rockTint);
              }
            }
            if (
              !d &&
              !previewRock &&
              w.topography &&
              this.liveGraphics.litterPalette !== "none"
            ) {
              const cell = w.topography(x, y);
              const h = cell?.habitat;
              const woodland =
                !!h?.layeredForest || !!h?.ecology.includes("woodland");
              const allowed =
                this.liveGraphics.litterPalette === "mixed" ||
                (this.liveGraphics.litterPalette === "woodland" && woodland) ||
                (this.liveGraphics.litterPalette === "grassland" && !woodland);
              if (
                allowed &&
                h &&
                !cell.feature &&
                !cell.pathArt?.length &&
                !cell.bridge &&
                !cell.ramp &&
                !["water", "snow"].includes(cell.surface) &&
                random(e.state.manifest.seed, "study-litter", x, y) <
                  this.liveGraphics.litterDensity / 100
              ) {
                const frames = woodland
                  ? ["log-a", "log-b", "brush"]
                  : ["grass-a", "grass-b", "grass-c", "grass-d"];
                const frame =
                  frames[
                    Math.floor(
                      random(e.state.manifest.seed, "study-litter-art", x, y) *
                        frames.length,
                    )
                  ];
                this.sprite(
                  `study-litter-${frame}`,
                  x * 16 + 8,
                  y * 16 + 16,
                  y * 16 + 8,
                );
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
            this.makeSelectable(image, b.id);
            const animation = (
              placement.model as typeof placement.model & {
                animation?: BuildingAnimationRecipe;
              }
            ).animation;
            if (animation)
              this.addBuildingAnimation(b.id, placement, animation);
            this.addDoor(b, placement, image.y);
            this.addBuildingSign(b, placement, w.pack.setting, image.y);
            if (b.access === "household" && this.hearthLit(b.id))
              this.lightHearth(b.id, placement);
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
      this.game.canvas.dataset.sceneryDrawAt = String(Math.round(sceneryStart));
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
      const on = this.perchCell(id) ?? pos;
      let tx = on.x * 16 + 8,
        ty =
          on.y * 16 +
          16 -
          this.lift(on.x * 16 + 8, on.y * 16 + 16) -
          this.perchRise(id);
      if (id === "player" && this.bump) {
        const t = (this.time.now - this.bump.at) / BUMP_MS;
        if (t >= 1) this.bump = undefined;
        else {
          const push = Math.sin(Math.PI * t) * 2;
          tx += this.bump.dx * push;
          ty += this.bump.dy * push;
        }
      }
      if (!im) {
        im = this.add
          .image(tx, ty, this.texture(frame), frame)
          .setOrigin(0.5, 1);
        this.entities.set(id, im);
        if (id === "player" && !this.options.lab)
          c.startFollow(
            im,
            false,
            this.liveGraphics.followLerp,
            this.liveGraphics.followLerp,
          );
        const shade = frame.startsWith("human-")
          ? undefined
          : this.shadow(frame, tx, ty, true);
        if (shade) this.shadows.set(id, shade);
        if (id !== "player") this.makeSelectable(im, target);
      }
      // One source pixel is one world pixel, for objects and their shadows.
      const texture = this.texture(frame);
      const rigid = this.layerOf(frame, "frame");
      const drawn = rigid ?? frame;
      if (im.texture.key !== texture || animatedBase(im.frame.name) !== drawn)
        im.setTexture(texture, drawn);
      const fire = frame === "fire" || this.fireFrames.has(frame);
      if (this.fireFrames.has(frame)) this.lightFire(id, im, frame, tx, ty);
      else if (this.fires.has(id)) this.quenchFire(id);
      // A fire keeps its own colour at night.
      const tint = fire ? 0xffffff : this.tint;
      if (im.tintTopLeft !== tint) im.setTint(tint);
      const depth = pos.y * 16 + (actor ? 14 : 10);
      if (im.depth !== depth) im.setDepth(depth);
      if (this.motionFrames.has(drawn)) {
        const motion = this.motions.get(id);
        if (!motion || motion.base !== drawn)
          this.motions.set(id, {
            image: im,
            base: drawn,
            phase: this.poseOffset(id) % 4,
            frames: this.motionFrames.get(drawn) ?? 4,
          });
      } else if (this.motions.has(id)) this.motions.delete(id);
      const swinging = rigid && this.layerOf(frame, "hang");
      if (swinging) {
        let hang = this.hangings.get(id);
        if (!hang) {
          const image = this.add
            .image(tx, ty, texture, swinging)
            .setOrigin(0.5, 1);
          hang = {
            image,
            baseX: tx,
            phase: random(e.state.manifest.seed, "hang-phase", id) * 6.3,
          };
          // Not a static layer: this follows its entity's life, and the
          // scenery rebuild would destroy it behind this map's back.
          this.hangings.set(id, hang);
        }
        if (hang.image.frame.name !== swinging)
          hang.image.setTexture(texture, swinging);
        hang.baseX = tx;
        hang.image.setY(ty);
        if (hang.image.depth !== depth + 1) hang.image.setDepth(depth + 1);
        if (hang.image.tintTopLeft !== this.tint) hang.image.setTint(this.tint);
      }
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
      // Climbing moves the sprite without moving the tile, so the tile alone
      // cannot say whether there is anything to redraw.
      const perchKey =
        id === "player"
          ? (this.runtime.engine.state.player.perch?.on ??
            (this.runtime.engine.onWall() ? "wall" : ""))
          : "";
      const moved =
        !previous ||
        previous.x !== pos.x ||
        previous.y !== pos.y ||
        previous.space !== pos.space ||
        im.getData("perch") !== perchKey;
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
      im.setData("perch", perchKey);
      const roll =
        rt.shoveEffect?.path &&
        rt.shoveEffect.serial !== this.rolledSerial &&
        rt.shoveEffect.ids.includes(id)
          ? rt.shoveEffect.path.length
          : 0;
      if (roll) this.rolledSerial = rt.shoveEffect!.serial;
      if (
        previous?.space === pos.space &&
        (im.x !== tx || im.y !== ty) &&
        Math.hypot(im.x - tx, im.y - ty) < (arc ? 120 : roll ? 16 * 22 : 65)
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
            : roll
              ? { duration: ROLL_MS * roll }
              : {
                  duration:
                    actor && w.topography && pos.space === "outside"
                      ? Math.max(
                          this.motionDuration,
                          140 *
                            wadingCost(
                              waterDepthAt(
                                w.topography,
                                pos.x + 0.5,
                                pos.y + 0.5,
                              ),
                            ),
                        )
                      : this.motionDuration,
                }),
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
      // The building art already paints the door; the leaf overlay animates it.
      if (o.kind === "door") continue;
      if (
        o.depleted &&
        (o.kind !== "tree" ||
          (o.resource &&
            !["ecology-fruit-tree", "ecology-berry-bush"].includes(o.sprite)))
      )
        continue;
      if (o.seasons && !o.seasons.includes(this.season)) continue;
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
      if (o.submerged) {
        renderEntity(o.id, o.sprite, o.pos);
        const under = this.entities.get(o.id);
        under?.setTint(0x4a6f86).setAlpha(0.72);
        this.shadows.get(o.id)?.setVisible(false);
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
    // An item taken in hand is drawn the same way a carried prop is, but a
    // real object in the hand wins.
    if (e.state.player.heldItem)
      this.heldSprites.set("player", `icon:${e.state.player.heldItem}`);
    for (const a of e.state.actors)
      if (a.heldItem) this.heldSprites.set(a.id, `icon:${a.heldItem}`);
    for (const object of e.state.objects)
      if (object.carriedBy)
        this.heldSprites.set(object.carriedBy, object.sprite);
    this.humanActors.clear();
    for (const a of [obs.player, ...obs.actors]) {
      if (a.kind === "human")
        this.humanActors.set(a.id, {
          ...a,
          // An ambient itinerary only reports a cardinal direction, so drop
          // any eight-way facing it overrides.
          direction: this.ambient.get(a.id)?.direction ?? a.direction,
          facing: this.ambient.get(a.id) ? undefined : a.facing,
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
    this.faunaSprites.clear();
    for (const g of [...(e.state.fauna ?? []), ...this.testFauna]) {
      if (Math.abs(g.pos.x - p.x) > range || Math.abs(g.pos.y - p.y) > range)
        continue;
      // In the air the sprite rides a cell and a quarter above its ground cell.
      const lift = aerialStates.has(g.state) ? 1.25 : 0;
      // Four-direction species have an authored frame per facing; the rest
      // are side views flipped for west.
      const turns = Boolean(faunaProfile(g.speciesId)?.directions);
      for (const [i, m] of g.members.entries()) {
        const id = `${g.id}-${i}`;
        const at = { x: m.x, y: m.y - lift, space: "outside" };
        if (!visible(at)) continue;
        const phase = this.poseOffset(id) % 8;
        const facing = FACINGS[m.direction] ?? "east";
        renderEntity(
          id,
          this.faunaFrame(g.speciesId, g.state, phase, facing),
          at,
          true,
          g.id,
        );
        const im = this.entities.get(id)!;
        if (g.id.startsWith("dev-fauna-")) im.disableInteractive();
        const flip = !turns && m.direction === 3;
        if (im.flipX !== flip) im.setFlipX(flip);
        // Three clear rows under the hooves in every study frame.
        im.setOrigin(0.5, (im.frame.height - 3) / im.frame.height);
        this.faunaSprites.set(id, {
          species: g.speciesId,
          state: g.state,
          phase,
          facing,
        });
      }
    }
    if (this.options.lab && !this.options.overview)
      c.startFollow(this.entities.get("player")!, true, 0.4, 0.4);
    for (const [id, image] of this.entities)
      if (!keep.has(id)) {
        this.tweens.killTweensOf(image);
        const shade = this.shadows.get(id);
        if (shade) this.tweens.killTweensOf(shade);
        this.wading?.remove(id);
        image.destroy();
        this.hangings.get(id)?.image.destroy();
        this.hangings.delete(id);
        this.motions.delete(id);
        this.quenchFire(id);
        this.entities.delete(id);
        this.destinations.delete(id);
        this.actorFrames.delete(id);
        this.footfalls.delete(id);
        this.turning.delete(id);
        shade?.destroy();
        this.shadows.delete(id);
      }
    const g = this.routeOverlay!;
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
    const wash = this.weatherWash();
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
    if (wash > 0)
      this.night!.fillStyle(0x2a3a55, wash).fillRect(
        -this.scale.width * 4,
        -this.scale.height * 4,
        this.scale.width * 9,
        this.scale.height * 9,
      );
    this.game.canvas.dataset.lighting = this.light.id;
  }
  /** Cloud and wet ground both take the light out of a scene. Ground the
   * player can see is soaked long after the shower has passed. */
  private weatherWash() {
    const w = this.weather;
    if (!w || this.options.colorGrade === false) return 0;
    const cloud =
      w.condition === "rain"
        ? 1
        : w.condition === "overcast"
          ? 0.45
          : w.condition === "mist"
            ? 0.2
            : 0;
    return Math.min(0.3, cloud * 0.16 + w.wetness * 0.12);
  }
  /** Frame of an animal's eight-step cycle at scene time; states share the
   * lab's timings so a walk in the world matches the walk in the lab. */
  private faunaFrame(
    species: string,
    state: FaunaState,
    phase: number,
    facing: FaunaFacing,
  ) {
    const ms =
      state === "flight"
        ? 85
        : state === "flee" ||
            state === "chase" ||
            state === "takeoff" ||
            state === "landing"
          ? 95
          : state === "wander" || state === "stalk" || state === "approach"
            ? 140
            : 260;
    const n = this.options.freeze
      ? 0
      : Math.floor(this.time.now / ms + phase) % 8;
    return faunaProfile(species)?.directions
      ? `faunac-${species}-${state}-${facing}-${n}`
      : `faunab-${species}-${state}-${n}`;
  }
  update(time: number) {
    open();
    this.drift?.update(time, !!this.options.freeze);
    this.mist?.update(time, !!this.options.freeze);
    this.life?.update(time, !!this.options.freeze);
    mark("weather");
    if (perf.fauna)
      for (const [id, f] of this.faunaSprites) {
        const im = this.entities.get(id);
        if (!im) continue;
        const name = this.faunaFrame(f.species, f.state, f.phase, f.facing);
        if (im.frame.name !== name) im.setFrame(name);
      }
    mark("fauna");
    updateLivingWater(
      this,
      time,
      this.light.id,
      !perf.livingWater ||
        this.options.waterAnimation === false ||
        (!!this.options.freeze && this.options.waterAnimation !== true),
    );
    mark("water");
    this.terrainStream?.update();
    mark("terrain");
    if (!this.options.lab && this.ready && perf.ambientPeople) {
      const clock = this.runtime.displayClock();
      this.buildRoutines(clock);
      // A full pass now and then lets people walk into and out of view; in
      // between, the ones on screen are just repositioned. Someone whose routine
      // was just built has no sprite until the next full pass, so redraw sooner.
      if (clock - this.ambientDrawn > (this.routinesBuilt ? 20 : 90))
        this.draw();
      else this.moveAmbient(clock);
    }
    mark("ambient people");
    const phase =
      this.options.freeze || !perf.ripples ? 0 : Math.floor(time / 800) % 4;
    if (phase !== this.rippleTime) {
      this.rippleTime = phase;
      for (const r of this.ripples)
        r.image.setFrame(`ripple-${(phase + r.phase) % 4}`);
    }
    if (perf.fires)
      for (const fire of this.fires.values()) {
        const n = this.options.freeze
          ? 0
          : Math.floor(time / FIRE_FRAME_MS + fire.phase) % 4;
        const name = n ? `${fire.base}-f${n}` : fire.base;
        if (fire.image.frame.name !== name) fire.image.setFrame(name);
        const pulse = this.options.freeze
          ? 1
          : 0.88 + 0.12 * Math.sin(time / 210 + fire.phase * 1.7);
        const alpha = glowAlpha[this.light.id] * pulse;
        if (fire.glow.alpha !== alpha) fire.glow.setAlpha(alpha);
        if (fire.glow.depth !== fire.image.depth - 1)
          fire.glow.setDepth(fire.image.depth - 1);
      }
    if (perf.fires)
      for (const motion of this.motions.values()) {
        const n = this.options.freeze
          ? 0
          : Math.floor(time / motionPeriod(motion.frames) + motion.phase) %
            motion.frames;
        const name = n ? `${motion.base}-m${n}` : motion.base;
        if (motion.image.frame.name !== name) motion.image.setFrame(name);
      }
    mark("fires");
    this.swingDoors();
    mark("doors");
    if (perf.buildingAnimations)
      for (const animation of this.buildingAnimations.values()) {
        const frame = this.options.freeze
          ? 0
          : Math.floor(time / animation.period + animation.phase) % 4;
        const name = `animation-roof-fan-${frame}`;
        if (animation.image.frame.name !== name) animation.image.setFrame(name);
      }
    if (
      this.game.canvas.dataset.buildingAnimations !==
      String(this.buildingAnimations.size)
    )
      this.game.canvas.dataset.buildingAnimations = String(
        this.buildingAnimations.size,
      );
    mark("building animations");
    if (perf.wind)
      for (const wind of this.windSprites) {
        const sway = this.options.freeze
          ? { x: 0, angle: 0 }
          : windSway(time, wind.phase, wind.profile, wind.baseX, wind.image.y);
        const x = wind.baseX + sway.x;
        if (wind.image.x !== x) wind.image.setX(x);
        if (wind.image.rotation !== sway.angle)
          wind.image.setRotation(sway.angle);
      }
    if (perf.wind)
      for (const [, hang] of this.hangings) {
        const sway = this.options.freeze
          ? { x: 0 }
          : windSway(time, hang.phase, HANGING, hang.baseX, hang.image.y);
        const x = hang.baseX + sway.x;
        if (hang.image.x !== x) hang.image.setX(x);
      }
    this.toolEffects ??= new ToolEffects(this, {
      tint: () => this.tint,
      lift: (x, y) => this.lift(x, y),
      plantAt: (x, y) => this.plantImages.get(`${x},${y}`) ?? [],
      entityAt: (id) => this.entities.get(id),
      texture: (frame) => this.texture(frame),
      frame: (frame) => this.textureFrame(frame),
    });
    this.toolEffects.consume(this.runtime.toolEffect);
    this.toolEffects.consumeSwing(this.runtime.swingEffect);
    this.toolEffects.consumeThrow(this.runtime.throwEffect);
    this.toolEffects.consumeShove(this.runtime.shoveEffect);
    this.toolEffects.update(time);
    mark("wind");
    const active = document.activeElement;
    const typing =
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      active instanceof HTMLSelectElement ||
      (active instanceof HTMLElement && active.isContentEditable) ||
      this.modalOpen;
    if (typing) {
      this.heldDirections.clear();
      this.shiftHeld = this.spaceDown = false;
      this.jumpStarted = this.queuedJump = undefined;
      this.pendingDirection = undefined;
    }
    if (!this.options.lab && !typing) {
      this.chargeTell(time);
      if (
        this.jumpStarted !== undefined &&
        time - this.jumpStarted >= JUMP_CHARGE_MS
      ) {
        this.jumpStarted = undefined;
        this.queuedJump = "long";
      }
      if (time >= this.nextInput - JUMP_BUFFER_MS && this.queuedJump) {
        const power = this.queuedJump;
        this.queuedJump = undefined;
        const [dx, dy] = this.jumpDirection();
        this.pendingDirection = undefined;
        const running = this.jumpRunning;
        this.jumpRunning = false;
        const player = this.entities.get("player");
        if (player) this.kickDust(player.x, player.y, running ? 6 : 3, 0.8);
        this.motionDuration = jumpMs(this.runtime.jump(dx, dy, power, running));
        this.nextInput = time + this.motionDuration;
        this.lastTick = time;
      } else if (time >= this.nextInput && this.jumpStarted === undefined) {
        const held = this.direction();
        const [dx, dy] = held.some(Boolean)
          ? held
          : (this.pendingDirection ?? held);
        this.pendingDirection = undefined;
        if (dx || dy) {
          if (this.shiftHeld) {
            this.runSteps = Math.min(RUN_RAMP.length - 1, this.runSteps + 1);
            this.lastRunStep = time;
          } else this.runSteps = 0;
          this.motionDuration =
            (this.shiftHeld ? RUN_RAMP[this.runSteps] : 140) *
            Math.hypot(dx, dy);
          const p = this.runtime.engine.state.player.pos,
            sample = this.runtime.engine.world.topography;
          if (sample && p.space === "outside") {
            const depth = Math.max(
              waterDepthAt(sample, p.x + 0.5, p.y + 0.5),
              waterDepthAt(sample, p.x + dx + 0.5, p.y + dy + 0.5),
            );
            if (depth > 0)
              this.motionDuration =
                140 * Math.hypot(dx, dy) * wadingCost(depth);
          }
          this.nextInput = time + this.motionDuration;
          this.lastTick = time;
          let moved = this.runtime.move(dx, dy, false, this.shiftHeld);
          // A diagonal into a corner slides along whichever wall is open,
          // rather than stopping dead. The engine is right to refuse the
          // diagonal; it is the input that should try the other way.
          if (moved?.status === "rejected" && dx && dy) {
            const at = this.runtime.engine.state.player.pos;
            const freeX = !this.runtime.engine.blocked(at.x + dx, at.y);
            const freeY = !this.runtime.engine.blocked(at.x, at.y + dy);
            if (freeX !== freeY)
              moved = this.runtime.move(
                freeX ? dx : 0,
                freeX ? 0 : dy,
                false,
                this.shiftHeld,
              );
          }
          // Pushing into a wall still turns you to face it, and shoves.
          if (moved?.status === "rejected") {
            this.blockedFacing = facingFromStep(
              dx,
              dy,
              this.runtime.engine.state.player.direction,
            );
            this.pushingAt = time;
            this.bump = { dx, dy, at: time };
          } else {
            this.blockedFacing = undefined;
            this.pushingAt = undefined;
          }
        }
      }
      if (
        time >= this.nextInput &&
        time - this.lastTick >= 140 &&
        this.jumpStarted === undefined
      ) {
        this.lastTick = time;
        this.motionDuration = 140;
        if (perf.worldTicks) this.runtime.tick();
        if (this.runtime.running) {
          const p = this.runtime.engine.state.player.pos,
            sample = this.runtime.engine.world.topography;
          if (sample && p.space === "outside")
            this.nextInput =
              time +
              140 * wadingCost(waterDepthAt(sample, p.x + 0.5, p.y + 0.5));
        }
      }
    }
    // Depth and the selection marker follow the displayed position, not the next tile.
    for (const [id, im] of this.entities) {
      const frame = this.actorFrames.get(id);
      // Height above the tile, mid-jump. Depth sorts on where the feet would
      // be, or a jumper passes behind whatever they are jumping over.
      let arcLift = (im.getData("arcLift") as number) ?? 0;
      // A launch interrupted mid-flight never reaches its onComplete, which
      // is what reset the lift. Left alone the figure hangs in the air until
      // the next jump lands and clears it.
      if (arcLift && !this.tweens.isTweening(im)) {
        im.setData("arcLift", 0);
        im.setScale(1, 1);
        arcLift = 0;
      }
      const perched = this.perchRise(id);
      const depth =
        im.y +
        arcLift +
        // A fixed nudge, not the lift: a perched player shares the cell with
        // what they climbed and only has to sort in front of it.
        (perched ? 4 : 0) +
        this.lift(im.x, (this.destinations.get(id)?.y ?? 0) * 16 + 16) -
        (frame ? 2 : 6);
      if (im.depth !== depth) im.setDepth(depth);
      // The camera tracks the sprite, so cancel the arc or the world bobs.
      if (id === "player" && !this.options.lab)
        this.cameras.main.setFollowOffset(0, -arcLift);
      const human = this.humanActors.get(id);
      if (human && this.characters && perf.characterPoses) {
        const at = this.ambient.get(id);
        const pushing =
          id === "player" &&
          this.pushingAt !== undefined &&
          time - this.pushingAt < PUSH_MS;
        const moving = (at ? at.moving : this.tweens.isTweening(im)) || pushing;
        const action =
          id === "player" ? this.runtime.characterAction : undefined;
        const elapsed = action ? performance.now() - action.at : Infinity;
        const active = action && elapsed < poseTiming(action.pose) * 4;
        const sample = this.runtime.engine.world.topography;
        const wetPos = this.destinations.get(id);
        const water =
          sample && wetPos?.space === "outside" && !arcLift
            ? waterDepthAt(
                sample,
                im.x / 16,
                (im.y + this.lift(im.x, wetPos.y * 16 + 16) - 8) / 16,
              )
            : 0;
        const heldSprite = this.heldSprites.get(id);
        let pose: CharacterPose = moving ? "walk" : "idle";
        if (active) pose = action.pose;
        else if (moving)
          pose = id === "player" && this.shiftHeld ? "run" : "walk";
        else if (at) pose = this.ambientPose(id, at, time);
        else if (/rest|sleep/i.test(human.activity)) pose = "sit";
        else if (/gathering|working/i.test(human.activity)) pose = "work";
        else if (/eating/i.test(human.activity)) pose = "give";
        if (id === "player" && pose === "idle") pose = "breathe";
        if (moving && water > 0.025 && !active) pose = "wade";
        const index = active
          ? Math.min(3, Math.floor(elapsed / poseTiming(pose)))
          : this.options.freeze
            ? 0
            : pose === "wade"
              ? (this.wading?.frame(id) ?? 0)
              : this.poseFrame(id, pose, time);
        const prop =
          heldSprite ??
          (at?.activity === "haul-catch" ? CATCH : undefined) ??
          // A thrown object stays in the hand through the windup. Striking
          // also swings, but then the hand is still full and this never runs.
          (active &&
          (action.pose === "drop" || action.pose === "swing") &&
          index < 2
            ? action.prop
            : undefined);
        // Turning is drawn through the facings in between. Without it a
        // half turn is a single frame, which the eight-way sprites make
        // more obvious than the four-way ones did.
        const wanted =
          (id === "player" ? this.blockedFacing : undefined) ??
          human.facing ??
          facingFromDirection(human.direction);
        let turn = this.turning.get(id);
        if (!turn) this.turning.set(id, (turn = { facing: wanted, until: 0 }));
        else if (turn.facing !== wanted && time >= turn.until) {
          turn.facing = turnToward(turn.facing, wanted);
          turn.until = time + TURN_HOLD_MS;
        }
        const texture = this.characters.frame(
          turn.facing === wanted ? human : { ...human, facing: turn.facing },
          pose,
          index,
          prop,
        );
        if (im.texture.key !== texture) im.setTexture(texture);
        // Dust off a run's contact frames. Walking raises none, or a quiet
        // street would be permanently hazy; jumps are covered by `launch`.
        if (this.footfalls.get(id) !== index) {
          this.footfalls.set(id, index);
          if (pose === "run" && index % 2 === 1 && water <= 0.025 && !arcLift)
            this.kickDust(im.x, im.y, 2, 0.5);
        }
        this.wading?.update(
          id,
          im,
          // Legacy water and canals report an unbounded depth; wading still
          // has to draw something, so clamp rather than fall back to dry land.
          Number.isFinite(water) ? water : MAX_WADING_DEPTH,
          this.options.freeze ? 0 : time,
          moving,
          sample && wetPos
            ? sample(wetPos.x, wetPos.y)?.waterVisual?.flow
            : undefined,
        );
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
          const shrink = arcLift ? 1 - Math.min(0.45, arcLift / 32) : 1;
          if (shade.scaleX !== shrink) shade.setScale(shrink);
          const fade =
            water > 0.025 ? 0 : arcLift ? 1 - Math.min(0.55, arcLift / 26) : 1;
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
    mark("actors");
    this.drawSelectionGlow(time);
    mark("scene update tail");
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
    if (people.length < 2 || !perf.crowdSeparation) return;
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
  /** Builds queued routines within a frame's budget. A build is a path search
   * per station, and a city wants a couple of hundred of them, so they are
   * spent a frame at a time from the nearest resident outward. This is
   * presentation: the engine builds its own on a fixed per-tick budget, and the
   * result is the same itinerary whoever asks first. */
  private buildRoutines(clock: number) {
    if (!this.pendingRoutines.length || !perf.routineBuilding) return;
    const w = this.runtime.engine.world,
      p = this.runtime.engine.state.player.pos,
      range =
        Math.max(this.scale.width, this.scale.height) / this.runtime.zoom / 32 +
        AMBIENT_MARGIN,
      start = performance.now();
    do {
      const id = this.pendingRoutines.shift();
      if (id === undefined) return;
      // Already built by the engine: drop it and let the next frame continue.
      if (!w.routinePending?.(id)) continue;
      const routine = w.itinerary?.(id);
      if (!routine) continue;
      // Only a build that actually puts someone on screen needs the early full
      // pass; most resolve to resting indoors or out of range.
      const at = itineraryAt(routine, clock);
      if (
        (at.activity !== "rest" || at.moving) &&
        Math.abs(at.x - p.x) <= range &&
        Math.abs(at.y - p.y) <= range
      )
        this.routinesBuilt = true;
    } while (performance.now() - start < ROUTINE_BUILD_BUDGET_MS);
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
        this.humanActors.set(id, {
          ...human,
          direction: at.direction,
          facing: undefined,
        });
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
  private jumpDirection(): [number, number] {
    const direction = this.direction();
    if (direction.some(Boolean)) return direction;
    if (this.pendingDirection?.some(Boolean)) return this.pendingDirection;
    return (
      [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ] as [number, number][]
    )[this.runtime.engine.state.player.direction];
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

/** Multiply two tints channel-wise, as a shader would. */
function blendTint(a: number, b: number) {
  let out = 0;
  for (let shift = 16; shift >= 0; shift -= 8) {
    const v = Math.round((((a >> shift) & 255) * ((b >> shift) & 255)) / 255);
    out |= v << shift;
  }
  return out;
}

function hashSeed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}
