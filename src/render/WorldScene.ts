import { shownStock } from "../core/economy";
import { parseLoad } from "../content/economy/carrying";
import { portableProps } from "./characters/props";
import { Watercraft } from "./watercraft";
import { ruinTexture, releaseRuins } from "./ruins";
import { Burning, TorchFlame } from "./burning";
import { BUILDING_BURN } from "../content/ecology/metals";
import { oreOverlay } from "./ore-art";
import { showsWear, stillStanding, StructureDecay } from "./structure-decay";
import { isRuin } from "../core/time/structure";
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
import { Mycelium } from "./mycelium";
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
import {
  faunaCoats,
  faunaLook,
  faunaProfile,
  type FaunaFacing,
} from "../content/fauna";

/** Actor facing numbers as the art names them. */
const FACINGS: readonly FaunaFacing[] = ["north", "east", "south", "west"];
/** States in which an animal is in a hurry: the sprite keeps up with the
 * simulation instead of ambling after it. */
const URGENT = new Set<FaunaState>([
  "flee",
  "chase",
  "pounce",
  "flight",
  "takeoff",
  "landing",
  "approach",
]);
/** States an animal will look up from. One lying down does not bother. */
const WATCHFUL = new Set<FaunaState>(["idle", "graze", "forage", "perch"]);
const FAUNA_DUST = [0xb9a27a, 0x9c8762, 0xd2c09a];
/** States whose art already shows the animal travelling. */
const STRIDING = new Set<FaunaState>([...URGENT, "wander", "stalk"]);
import { canopyHidesPlayer } from "./canopy-visibility";
import { WorldCharacters } from "./characters/world";
import { entityInView, npcMotion } from "./entity-presentation";
import { FaunaMotion } from "./fauna-motion";
import { spriteShadow } from "./characters/shadow";
import { frameCount, poseTiming, type CharacterPose } from "./characters/poses";
import type { Actor } from "../core/types";
import { waterStyle } from "./water-style";
import { TerrainStream, restyleTerrain } from "./terrain-stream";
import { defaultGroundStyle } from "./ground-style";
import {
  surfaceElevation,
  pickTerrain,
  TERRAIN_RISE,
} from "./terrain-projection";
import { buildingContains, buildingPlacement, multiplyTint } from "./buildings";
import { churchBanner } from "../content/settlements/religious/banners";
import { terrainVariant, type RenderOptions } from "./appearance";
import { phoneLayout, smallMemoryDevice } from "../runtime/device";
import Phaser from "phaser";
import { jumpMs, JUMP_CHARGE_MS, type Runtime } from "../runtime/session";
import type { Position, WorldModel } from "../core/types";
import { surfaceAt, hasQuay } from "./materials";
import { gameAudio } from "../audio/director";
import {
  bumpAnimal,
  bumpPerson,
  footstep,
  type FungusStep,
  landing,
  scramble,
  strike,
  takeoff,
} from "../audio/sfx";
import { beastVoiceOf, voiceOf } from "../audio/voices";
import type { HitClass } from "../core/reactions";
import { hash, random } from "../core/random";
import {
  defaultLiveGraphicsSettings,
  type LiveGraphicsSettings,
} from "./live-graphics";
import { ToolEffects, ROLL_MS } from "./tool-effects";
import { CombatEffects, faunaSpriteId, mixTint } from "./combat-effects";
import { PlayerFeel } from "./player-feel";
import { CueEffects } from "./cue-effects";
import { TIERS, type CueKind } from "../core/combat";
import {
  facingFromDirection,
  facingFromStep,
  turnToward,
} from "../core/facing";
import { HANGING, windProfile, windSway, type WindProfile } from "./wind";
/** Grit thrown up by a take-off or a landing. */
// Flies each draws on a warm day: privies, middens and the tanner's pits.
const flyProps: Record<string, number> = {
  privyShed: 4,
  privyScreen: 5,
  privyBench: 5,
  privyStone: 4,
  privyNightSoil: 5,
  privyOuthouse: 4,
  privyMidden: 6,
  privyDung: 6,
  communalMidden: 7,
  shellMidden: 5,
  tanningPits: 6,
};
// The rest squish.
const fungusSteps: Record<string, FungusStep> = {
  puffball: "puff",
  "reindeer-lichen": "lichen",
};
const DUST = [0x9c8c6a, 0xbcae8c, 0x7d7054];
/** A jump pressed this long before the previous move ends still fires, so a
 * landing never eats the next input. */
const JUMP_BUFFER_MS = 90;
/** A jump this soon after a running step counts as a running jump. */
/** Ground items borrow scenery art, which is drawn far larger than a handful. */
const ITEM_SCALE = 0.4;
/** Under this, X is a snap throw; over it, the mark starts walking out. */
const AIM_TAP_MS = 170;
const AIM_MS = 650;
const RUN_GRACE_MS = 200;
/** How long each intermediate facing is held while someone turns around. */
const TURN_HOLD_MS = 60;
/** The lean into a first step, and the rock back and settle out of a walk. */
const SETOFF_MS = 80;
const HALT_MS = 200;
/** A gap between steps shorter than this is still one walk, not a stop and a start. */
const GAIT_GAP_MS = 60;
/** The rock back as a walk swings round three eighths or more. */
const PIVOT_MS = 90;
/** Tiles within which someone notices the player, and beyond which they
 * forget they have; how long before the same person notices again, and the
 * least gap between any two, so a crowd does not go off like a flashbulb. */
const NOTICE_TILES = 3;
const FORGET_TILES = 5;
const NOTICE_AGAIN_MS = 60000;
const NOTICE_GAP_MS = 1500;
/** A shove into whatever blocked the way: out two pixels and back. */
const BUMP_MS = 110;
/** Knocked back off a wall at a run. */
const BONK_MS = 340;
/** A tap shorter than this turns in place; a hold walks. */
const TURN_MS = 95;
/** Only from standing: mid-walk a new direction steps at once. */
const TURN_IDLE_MS = 60;
/** How long after a refused step the player still reads as pushing. Longer
 * than an input tick, so holding a key against a wall keeps the walk going. */
const PUSH_MS = 240;
/** Step times as a run gets up to speed. */
const RUN_RAMP = [120, 100, 88, 78, 72];
/** A reversed run: the plant and lean before the first step back. */
const SKID_MS = 140;
/** Run up the wall, then how long the foot stays planted waiting for Space. */
const WALL_RUN_MS = 150,
  WALL_KICK_WINDOW_MS = 320;
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
import { lightingAt, lightingPreset, shadowFrame, washAt } from "./lighting";
import { windowGlow } from "./window-light";
import { buildingWear } from "./building-wear";
import { CourtyardLighting, type CourtyardLight } from "./courtyard-lighting";
import { Drift } from "./drift";
import { Mist } from "./mist";
import { AmbientLife, critterFor } from "./ambient-life";
import { Flies, type FlySource } from "./flies";
import { freshDung } from "../core/dung";
import {
  groundState,
  snowCover,
  skySeed, weatherAt,
  type Weather,
} from "../core/weather";
import { puddleUnder, reflectIn, setGroundState, splashPuddle, updatePuddles } from "./puddles";
import { setSnowCover, snowSteps } from "./snow-cover";
import { setWind } from "./wind";
import { addPlume, type SmokeKind } from "./smoke";

import {
  driftStyle,
  foliageTint,
  namedShrub,
  trodden,
  seasonFrame,
  treeVariant,
} from "./season-art";
import { seasonAt } from "../core/livelihood";
import {
  FIRE_FRAME_MS,
  LIGHT_FLICKER,
  animatedBase,
  motionFrames,
  motionPeriod,
  animatedFrames,
  ensureFireLight,
  lightAlpha,
} from "./fire";
import terrainFrames from "./generated/terrain.json" with { type: "json" };
import { bloomAt, setBloomCut } from "./flowers";
import { setCropSelector, setCropCut } from "./crops";
import { setFloraRegion } from "../content/ecology/blooms";
import { floraRegion } from "../content/ecology/flora";
import { alternateTrees, lazySheets, sceneAssets } from "./scene-assets";
import { TiltShiftPipeline } from "./tilt-shift";
/** People drawn at once. Beyond roughly this many the per-head frame cache,
 * not the simulation, is what costs the frame. */
const CROWD_LIMIT = 24;
/** A hearth plume: fewer, slower and taller than a campfire's. */
/** Tiles of slack beyond the view for routine lookups. `entityInView` allows
 * 8 on x and 12 on y, so this must clear 12. */
const AMBIENT_MARGIN = 16;
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
  kind: string;
  period: number;
  phase: number;
};
type FireEffect = {
  image: Phaser.GameObjects.Image;
  base: string;
  frames: number;
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
  private canopies: {
    image: Phaser.GameObjects.Image;
    cut: number;
    id?: string;
  }[] = [];
  /** Drawn height of each solid plant, so a climber sits at its fork rather
   * than at a guessed offset. Decorations are not entities, so their sprites
   * cannot be looked up later. */
  private plantHeights = new Map<string, number>();
  /** The images standing on a cell, so a blow can rock the right plant. */
  private plantImages = new Map<string, Phaser.GameObjects.Image[]>();
  /** One plant per selectable crop cell, so a selected crop can be outlined
   * the way a tree or a person is. */
  private cropImages = new Map<string, Phaser.GameObjects.Image>();
  private pickedRevision = -1;
  private toolEffects?: ToolEffects;
  private burning?: Burning;
  private torchFlame?: TorchFlame;
  private structureDecay?: StructureDecay;
  private combatEffects?: CombatEffects;
  private cueFx?: CueEffects;
  /** How people show what they make of things. */
  private get cues() {
    return (this.cueFx ??= new CueEffects(this, {
      entityAt: (id) => this.entities.get(id),
      playerPose: (pose) => this.runtime.playPose(pose),
      collided: (who, dx, dy, run) => this.collided(who, dx, dy, run),
    }));
  }
  private feelFx?: PlayerFeel;
  private get feel() {
    return (this.feelFx ??= new PlayerFeel(this));
  }
  /** Animals knocked silly by something thrown: stars go round their heads. */
  private stunned = new Set<string>();
  /** Last drawn pose frame per person, so a footfall fires once per contact. */
  private footfalls = new Map<string, number>();
  /** Facing actually drawn, which chases the real one a step at a time. */
  private turning = new Map<string, { facing: number; until: number }>();
  /** When each person set off and came to rest, and the last walking frame
   * drawn, held through a gap between steps. */
  private gaits = new Map<
    string,
    {
      since: number;
      still?: number;
      frame: number;
      pose: CharacterPose;
      pivot?: number;
    }
  >();
  private near = new Set<string>();
  private noticedAt = new Map<string, number>();
  private lastNotice = -Infinity;
  /** When each engine-stepped NPC last got a new tile, to pace the next. */
  private stepAt = new Map<string, number>();
  /** Where the player is pushing while the way is blocked. The engine never
   * saw the move, so the turn is the renderer's to remember. */
  private blockedFacing?: number;
  /** A player pose the scene plays on its own account, over everything else:
   * frames `first` to `last`, `ms` apiece, until `until`, then `then`. */
  private stunt?: Stunt;
  /** Up against something tall after a jump at it. Space before `until`
   * kicks off; holding toward it goes up and over instead. */
  private wallRun?: {
    dx: number;
    dy: number;
    contact: number;
    until: number;
    able: boolean;
    label: string;
    x: number;
    y: number;
  };
  private lastRunDir?: [number, number];
  /** When the last step was refused, so pushing ends shortly after the key
   * is released while the facing itself stays put. */
  private pushingAt?: number;
  private bump?: { dx: number; dy: number; at: number };
  private bonk?: { dx: number; dy: number; at: number };
  /** A heavy lift in progress: the player trembles until it goes up. */
  private strain?: { at: number; until: number };
  private heaveSerial = 0;
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
    {
      species: string;
      state: FaunaState;
      phase: number;
      facing: FaunaFacing;
      scale: number;
      /** Frame-name stem: the species, or its form and coat. */
      art: string;
    }
  >();
  private faunaArt = new Map<string, string>();
  /** What each animal was doing last frame, to catch the moment it bolts,
   * and whether it has its head up watching the player. */
  private faunaMood = new Map<
    string,
    {
      state: FaunaState;
      from: number;
      until: number;
      squashed: boolean;
      began: number;
    }
  >();
  private playerSeen = { x: 0, y: 0, movedAt: -Infinity };
  private jostleSerial = 0;
  private faunaMotion = new FaunaMotion();
  /** Cast shadows by pose, facing and lighting phase. */
  private faunaShadows = new Map<
    string,
    { key: string; origin: readonly [number, number] }
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
  private mycelium?: Mycelium;
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
  private watercraft = new Watercraft(this);
  private courtyardLighting = new CourtyardLighting(this);
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
  /** Lit panes and their halo over the night wash, faded in with the hour. */
  private lamps: { pane: Phaser.GameObjects.Image; halo: Phaser.GameObjects.Image }[] = [];
  private washKey = "";
  private fires = new Map<string, FireEffect>();
  private fireFrames = new Map<string, number>();
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
  private flies?: Flies;
  /** Lying snow, in the raster's steps. */
  private snow = 0;
  private season = "summer";
  constructor(
    runtime: Runtime,
    private options: RenderOptions = {},
  ) {
    super("world");
    this.runtime = runtime;
    if (smallMemoryDevice()) this.options.shadows = false;
    this.options.waterRenderer ??= "living";
    this.options.shorePolish ??= { ...shorePolishDefaults };
  }
  preload() {
    const { atlases, images, sheets } = sceneAssets(
      this.options.shadows !== false,
    );
    const sprites = new Set(
      this.runtime.engine.world.places.map((b) => b.sprite),
    );
    for (const a of atlases) {
      if (!(lazySheets as readonly string[]).includes(a.key)) {
        this.load.atlas(a.key, a.image, a.data);
        continue;
      }
      this.sheetImages.set(a.key, a.image);
      this.load.json(`${a.key}-index`, a.data);
      // Queued inside preload, so the places already sited arrive drawn.
      this.load.once(
        `filecomplete-json-${a.key}-index`,
        (_key: string, _type: string, json: { frames: object }) => {
          if (Object.keys(json.frames).some((f) => sprites.has(f)))
            this.load.atlas(a.key, a.image, json);
        },
      );
    }
    for (const i of images) this.load.image(i.key, i.url);
    for (const sh of sheets)
      this.load.spritesheet(sh.key, sh.url, {
        frameWidth: 64,
        frameHeight: 96,
      });
  }
  create() {
    this.ready = true;
    this.useFlora();
    setCropSelector(this, (image, id) => {
      this.makeSelectable(image, id);
      this.cropImages.set(id, image);
      image.once("destroy", () => {
        if (this.cropImages.get(id) === image) this.cropImages.delete(id);
      });
    });
    this.characters = new WorldCharacters(this);
    this.characters.outline = this.liveGraphics.characterOutline;
    this.characters.palette = this.runtime.palette();
    this.wading = new WadingEffects(this);
    this.prepareTreeStudySheet();
    this.events.once("shutdown", () => this.wading?.destroy());
    this.events.once("shutdown", () => {
      this.toolEffects?.dispose();
      this.combatEffects?.dispose();
      this.combatEffects = undefined;
      this.feelFx?.dispose();
      this.cueFx?.dispose();
    });
    this.events.once("shutdown", () => this.characters?.destroy());
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
    // Multiply, not a flat fill: a wash that lifts the darks greys the scene.
    this.night = this.add
      .graphics()
      .setDepth(19000)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.drift = new Drift(this);
    this.mist = new Mist(this);
    this.life = new AmbientLife(this);
    this.flies = new Flies(this);
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
        if (this.wallKick()) return;
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
        const player = this.runtime.engine.state.player;
        // Held, X walks a mark out along the ground; let go and it flies there.
        if (player.held || player.heldItem) {
          this.aimStarted = this.time.now;
          // A throw taken at a sprint carries further, on the same terms a
          // running jump does.
          this.aimRunning =
            this.shiftHeld ||
            this.runtime.running ||
            this.time.now - this.lastRunStep < RUN_GRACE_MS;
        } else this.runtime.throwHeld(...this.jumpDirection());
      }
    });
    this.input.keyboard!.on("keyup", (event: KeyboardEvent) => {
      this.shiftHeld = event.shiftKey;
      this.heldDirections.delete(event.key.toLowerCase());
      if (event.code === "KeyX" && this.aimStarted !== undefined) {
        const reach = this.aimReach();
        this.aimStarted = undefined;
        const [dx, dy] = this.jumpDirection();
        this.runtime.throwHeld(dx, dy, this.aimRunning, reach);
      }
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
      // A finger is a blunt pointer and walking is what it is mostly for: on a
      // phone a tap goes where it points instead of opening a panel over the
      // world. The Inspect button and the Around you list still select.
      if (phoneLayout()) {
        this.runtime.select(undefined);
        this.runtime.walkTo({ x, y });
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
    this.input.on(
      "pointermove",
      (pointer: Phaser.Input.Pointer, over: unknown[]) => {
        if (this.options.lab || over.length) return;
        const spot = bloomAt(this, pointer.worldX, pointer.worldY);
        const id = spot && `bloom-${spot.tx}-${spot.ty}`;
        if (id && id === this.hoverId) this.moveHover(pointer);
        else if (id) this.showHover(id, pointer);
        else if (this.hoverId?.startsWith("bloom-")) this.hideHover();
      },
    );
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
      this.courtyardLighting.dispose();
      this.watercraft.dispose();
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
  /** What the last thing climbed sounds like, kept so the way down matches
   * the way up: the perch is already cleared by the time the sprite moves. */
  private climbedSurface: HitClass = "timber";
  /** Up a trunk or down off it. Not the jump arc: a climb keeps contact, so
   * the reach across comes first and the haul up follows it. */
  private climbTween(
    im: Phaser.GameObjects.Image,
    shade: Phaser.GameObjects.Image | undefined,
    tx: number,
    ty: number,
    up: boolean,
  ) {
    const ms = poseTiming("climb") * 4;
    const e = this.runtime.engine;
    const at = e.state.player.perch?.at;
    if (up)
      this.climbedSurface = at
        ? e.hitClass(at.x, at.y, e.state.player.pos.space).hit
        : "stone";
    this.tweens.killTweensOf(im);
    if (shade) this.tweens.killTweensOf(shade);
    this.play(
      { pose: up ? "climb" : "hang", ms: poseTiming("climb"), first: 0, last: 3 },
      ms,
    );
    this.nextInput = this.lastTick = this.time.now;
    this.nextInput += ms;
    void gameAudio()?.sound(scramble(this.climbedSurface, !up), "climb");
    this.tweens.add({
      targets: shade ? [im, shade] : im,
      // The hands go across before the feet leave, and the last of the haul
      // is the slowest part of it.
      x: { value: tx, duration: Math.round(ms * 0.45), ease: "Quad.easeOut" },
      y: {
        value: ty,
        duration: Math.round(ms * 0.85),
        delay: up ? Math.round(ms * 0.15) : 0,
        ease: up ? "Quad.easeOut" : "Quad.easeIn",
      },
      duration: ms,
      onComplete: () => {
        im.setPosition(tx, ty);
        if (!up) {
          this.feel.land(im, 8, tx, ty);
          this.kickDust(tx, ty, 3, 0.6);
          void gameAudio()?.sound(
            landing(this.groundUnderPlayer(), 0.7),
            "land",
          );
        }
      },
    });
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
        .setDepth(y + 4000);
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
  /** What the player is standing on, for the sound of it. */
  private groundUnderPlayer() {
    const p = this.runtime.engine.state.player.pos;
    return this.runtime.engine.groundClass(p.x, p.y, p.space);
  }
  /** Crouch deeper as the jump charges, and pop once it is fully charged, so
   * the player can see the long jump is armed before they let go. */
  private chargeTell(time: number) {
    const im = this.entities.get("player");
    if (!im) return;
    if (this.jumpStarted === undefined) {
      // A landing or a skid is still springing back.
      if (this.time.now < this.feel.springUntil) return;
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
   * ground is published as `arcLift`, which is what keeps the shadow behind.
   * A heavy landing comes down short and staggers or rolls the rest of the
   * way; a caught ledge ends hanging below it and is hauled up. */
  private launch(
    im: Phaser.GameObjects.Image,
    arc: { height: number; duration: number },
    tx: number,
    ty: number,
    after: "land" | "stumble" | "roll" | "hang" = "land",
  ) {
    this.tweens.killTweensOf(im);
    const isPlayer = im === this.entities.get("player");
    if (isPlayer) {
      // The engine has already moved the player, so the take-off cell is the
      // one the sprite is still drawn in.
      const p = this.runtime.engine.state.player.pos;
      const ground = this.runtime.engine.groundClass(
        Math.floor(im.x / 16),
        Math.floor((im.y - 1) / 16),
        p.space,
      );
      void gameAudio()?.sound(takeoff(ground), "jump");
    }
    const travel = Math.hypot(tx - im.x, ty - im.y) || 1;
    const short = after === "roll" ? 9 : after === "stumble" ? 6 : 0;
    const ex = tx - ((tx - im.x) / travel) * short,
      ey = ty - ((ty - im.y) / travel) * short + (after === "hang" ? 11 : 0);
    const carry = poseTiming(after) * (after === "hang" ? 4 : 3);
    const flight = this.tweens.add({
      targets: im,
      x: ex,
      y: ey,
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
        im.setPosition(ex, ey);
        im.setData("arcLift", 0);
        if (after === "hang") {
          im.setScale(1, 1);
          // Dangle for two frames, then up over the edge.
          this.tweens.add({
            targets: im,
            y: ty,
            delay: poseTiming("hang") * 2,
            duration: poseTiming("hang") * 2,
            ease: "Quad.easeOut",
          });
          return;
        }
        const heavy = after !== "land";
        if (isPlayer)
          void gameAudio()?.sound(
            landing(
              this.groundUnderPlayer(),
              heavy ? 2 : 0.7 + arc.height / 40,
            ),
            "land",
          );
        this.feel.land(im, arc.height + (heavy ? 18 : 0), ex, ey);
        this.kickDust(
          ex,
          ey,
          heavy ? 9 : arc.height > 26 ? 7 : 4,
          heavy ? 1.6 : arc.height / 24,
        );
        if (heavy)
          this.tweens.add({
            targets: im,
            x: tx,
            y: ty,
            duration: carry,
            ease: "Quad.easeOut",
          });
        if (im === this.entities.get("player"))
          this.onlookers(tx, ty, heavy ? 4 : 1.5, heavy ? "alarm" : "question");
      },
    });
    im.setData("arc", flight);
  }
  /** At a run, a rock or a pot is cleared without a key press. */
  private vault(dx: number, dy: number, time: number) {
    const engine = this.runtime.engine;
    if (!engine.vaultAhead(dx, dy)) return false;
    if ((!this.shiftHeld || this.runSteps < 2) && !engine.fenceAhead(dx, dy)) return false;
    const before = { ...engine.state.player.pos };
    const cleared = this.runtime.jump(dx, dy, "short", true);
    const now = engine.state.player.pos;
    if (now.x === before.x && now.y === before.y) return false;
    const im = this.entities.get("player");
    if (im) this.kickDust(im.x, im.y, 5, 0.8);
    this.motionDuration = jumpMs(cleared);
    this.nextInput = time + this.motionDuration + this.afterHold();
    return true;
  }
  /** From standing, a tap turns the player without a step, for lining up
   * a lift or a swing. Holding on walks after TURN_MS. */
  private turnInPlace(dx: number, dy: number, time: number) {
    const p = this.runtime.engine.state.player;
    const direction = dx === 0 ? (dy < 0 ? 0 : 2) : dx > 0 ? 1 : 3;
    if (
      this.shiftHeld ||
      p.perch ||
      p.direction === direction ||
      time - this.nextInput < TURN_IDLE_MS
    )
      return false;
    this.runtime.face(dx, dy);
    this.blockedFacing = undefined;
    this.nextInput = time + TURN_MS;
    this.lastTick = time;
    return true;
  }
  private targetMark?: Phaser.GameObjects.Graphics;
  private targetCell?: { x: number; y: number; at: number };
  private targetChecked = 0;
  /** Corner brackets on the cell F or E would act on. */
  private drawTarget(time: number) {
    const engine = this.runtime.engine;
    if (time - this.targetChecked > 120) {
      this.targetChecked = time;
      const p = engine.state.player;
      const cell = engine.facingCell();
      const { primary, alternate } = this.runtime.verbs();
      const hit =
        p.pos.space === "outside" || !p.pos.space
          ? engine.hitClass(cell.x, cell.y, p.pos.space).hit
          : "air";
      const worth =
        !p.perch &&
        (alternate?.kind === "pickup" ||
          (alternate?.kind === "climb" && !p.perch) ||
          (primary?.kind === "strike" && !!primary.command) ||
          primary?.kind === "talk" ||
          primary?.kind === "door" ||
          [
            "rock",
            "trunk",
            "tree",
            "brush",
            "pottery",
            "timber",
            "fiber",
            "crop",
          ].includes(hit));
      const same =
        this.targetCell?.x === cell.x && this.targetCell?.y === cell.y;
      this.targetCell = worth
        ? same
          ? this.targetCell
          : { ...cell, at: time }
        : undefined;
    }
    const mark = (this.targetMark ??= this.add.graphics());
    mark.clear();
    const at = this.targetCell;
    if (!at || time < this.nextInput - 40) return;
    const cx = at.x * 16 + 8,
      cy = at.y * 16 + 8 - this.lift(at.x * 16 + 8, at.y * 16 + 16);
    // Snaps in from wide when it first lands on a cell, then breathes.
    const settle = Math.min(1, (time - at.at) / 140);
    const r = 9 + (1 - settle) * 5 + Math.sin(time / 180) * 0.8;
    const arm = 3;
    mark.setDepth(cy + 8 + 4050).setAlpha(0.35 + 0.55 * settle);
    for (const [color, w] of [
      [0x1a1410, 3],
      [0xfff4d0, 1],
    ] as const) {
      mark.lineStyle(w, color, 1);
      for (const [sx, sy] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]) {
        const x = cx + sx * r,
          y = cy + sy * r * 0.8;
        mark.beginPath();
        mark.moveTo(x - sx * arm, y);
        mark.lineTo(x, y);
        mark.lineTo(x, y - sy * arm);
        mark.strokePath();
      }
    }
  }
  /** Squat, tremble, sweat, heave: a rock going up over the head. */
  private heaveUp(heave: NonNullable<Runtime["heaveEffect"]>) {
    const now = this.time.now;
    const strain = heave.boulder ? 620 : 440;
    this.strain = { at: now, until: now + strain };
    this.nextInput = Math.max(this.nextInput, now + strain + 260);
    this.play(
      {
        pose: "stoop",
        ms: strain / 4,
        first: 0,
        last: 3,
        then: { pose: "lift", ms: 65, first: 0, last: 3, for: 260 },
      },
      strain,
    );
    for (const [i, t] of [0.3, 0.65].entries())
      this.time.delayedCall(strain * t, () => {
        const im = this.entities.get("player");
        if (im) this.sweat(im.x + (i ? -4 : 4), im.y - 26, i ? -1 : 1);
      });
    const x = heave.at.x * 16 + 8,
      y =
        heave.at.y * 16 +
        16 -
        this.lift(heave.at.x * 16 + 8, heave.at.y * 16 + 16);
    this.time.delayedCall(strain, () => {
      this.kickDust(x, y, heave.boulder ? 9 : 6, 1.1);
      this.cameras.main.shake(90, heave.boulder ? 0.003 : 0.0018);
      void gameAudio()?.sound(strike("blunt", "stone", "thud", true), "slam");
      if (heave.loot.length) this.toolEffects?.spill({ x, y }, heave.loot);
    });
  }
  /** One drop of sweat flicked off the brow. */
  private sweat(x: number, y: number, side: number) {
    const drop = this.add
      .rectangle(x, y, 2, 3, 0xbfe6ff)
      .setStrokeStyle(1, 0x3d6f94, 0.6)
      .setDepth(y + 4800);
    this.tweens.add({
      targets: drop,
      x: x + side * 7,
      duration: 380,
    });
    this.tweens.add({
      targets: drop,
      y: y - 5,
      duration: 150,
      ease: "Quad.easeOut",
      yoyo: false,
      onComplete: () =>
        this.tweens.add({
          targets: drop,
          y: y + 6,
          alpha: 0,
          duration: 230,
          ease: "Quad.easeIn",
          onComplete: () => drop.destroy(),
        }),
    });
  }
  /** Running full tilt into something solid knocks the player back. */
  /** Whatever stopped the step, if it was alive: people and animals each get
   * their own protest. */
  private bumpedInto(dx: number, dy: number) {
    const p = this.runtime.engine.state.player.pos;
    const hit = this.runtime.engine.creatureAt(p.x + dx, p.y + dy, p.space);
    if (!hit) return;
    gameAudio()?.sound(
      hit.actor
        ? bumpPerson(voiceOf(hit.actor))
        : bumpAnimal(beastVoiceOf(hit.species!)),
      "bump",
    );
  }
  /** Walked into someone, or walked into by them: both are thrown apart. */
  private collided(who: string, dx: number, dy: number, run: boolean) {
    const im = this.entities.get("player");
    const actor = this.runtime.engine.state.actors.find((a) => a.id === who);
    if (actor)
      gameAudio()?.sound(bumpPerson(voiceOf(actor), run), "bump");
    if (!im) return;
    const time = this.time.now;
    this.bump = undefined;
    this.bonk = { dx, dy, at: time };
    this.nextInput = Math.max(this.nextInput, time + BONK_MS);
    this.play({ pose: "stumble", ms: BONK_MS / 4, first: 0, last: 3 }, BONK_MS);
    this.feel.spring(im, 1.18, 0.84);
    this.cameras.main.shake(90, 0.0025);
    this.kickDust(im.x + dx * 8, im.y, 5, 0.8);
  }
  private bonkAt(dx: number, dy: number, time: number) {
    this.bump = undefined;
    this.bonk = { dx, dy, at: time };
    this.runSteps = 0;
    this.lastRunDir = undefined;
    this.nextInput = time + BONK_MS;
    this.play({ pose: "hurt", ms: BONK_MS / 4, first: 0, last: 3 }, BONK_MS);
    const im = this.entities.get("player");
    if (im) {
      this.combat().bonk(im.x + dx * 6, im.y - 14 + dy * 4);
      this.kickDust(im.x + dx * 5, im.y, 4, 0.7);
    }
  }
  /** What a foot lands on: snow lies over any open ground, and a puddle is
   * water whatever it stands in. */
  private underfoot(
    cell: { x: number; y: number; space: string },
    puddle?: "water" | "ice",
  ): HitClass {
    if (puddle === "water") return "water";
    if (puddle === "ice") return "stone";
    const outside = cell.space === "outside";
    const ground =
      outside &&
      this.runtime.engine.world.topography?.(cell.x, cell.y)?.streetMaterial ===
        "plank"
        ? "timber"
        : this.runtime.engine.groundClass(cell.x, cell.y, cell.space);
    return outside &&
      this.snow >= 0.34 &&
      ["soil", "grass", "sand", "stone", "timber"].includes(ground)
      ? "snow"
      : ground;
  }
  private footstepAt(
    cell: { x: number; y: number; space: string },
    puddle: "water" | "ice" | undefined,
    water: number,
    running: boolean,
  ) {
    if (water > 0.025) return footstep("water", running);
    const ground = this.underfoot(cell, puddle);
    if (cell.space !== "outside" || ground === "snow")
      return footstep(ground, running);
    const engine = this.runtime.engine;
    const field = engine.world.topography?.(cell.x, cell.y)?.field;
    const { hit } = engine.hitClass(cell.x, cell.y, cell.space);
    // Grass tufts stay silent: they cover every meadow.
    const through =
      this.fungusUnderfoot(cell) ??
      (hit === "brush" || hit === "crop"
        ? hit
        : engine.bloomSpecies(cell.x, cell.y)
          ? "bloom"
          : undefined);
    const surface =
      field?.wet || field?.ditch
        ? "paddy"
        : field && ground === "soil"
          ? "furrow"
          : (this.weather?.wetness ?? 0) > 0.4 && (ground === "soil" || ground === "grass")
            ? "sodden"
            : ground;
    return footstep(surface, running, through);
  }
  /** The fungus a foot comes down on, by how it answers. Brackets on logs
   * and the termite mound are not trodden on. */
  private fungusUnderfoot(cell: { x: number; y: number; space: string }) {
    if (cell.space !== "outside") return undefined;
    const engine = this.runtime.engine;
    if (
      engine.state.objects.some(
        (o) => o.dung === "pat" && !o.carriedBy && o.pos.space === "outside" && o.pos.x === cell.x && o.pos.y === cell.y,
      )
    )
      return "squish";
    const sprite = engine.world.decoration(cell.x, cell.y)?.sprite;
    if (sprite !== "nature-understory-fungi") return undefined;
    const id = engine.plantSpecies(sprite, cell.x, cell.y)?.id;
    return id ? (fungusSteps[id] ?? "squish") : undefined;
  }
  /** Spores and flies stirred by a foot on a fungus. */
  private stirFungus(x: number, y: number, step: FungusStep, id: string) {
    const flies = id === "stinkhorn";
    const motes =
      step === "puff"
        ? { count: 9, colours: [0x7a6a48, 0x8e7c54, 0x6a5c40], rise: 14, drift: 16, ms: 1400, alpha: 0.8 }
        : flies
          ? { count: 3, colours: [0x2a2a22], rise: 18, drift: 26, ms: 900, alpha: 1 }
          : { count: 3, colours: [0xe8e0cc, 0xd8ccb0], rise: 8, drift: 10, ms: 1100, alpha: 0.5 };
    for (let i = 0; i < motes.count; i++) {
      const mote = this.add
        .rectangle(x + (Math.random() - 0.5) * 6, y - 2 - Math.random() * 3, 1, 1, motes.colours[i % motes.colours.length])
        .setAlpha(motes.alpha)
        .setDepth(y + 4000);
      this.tweens.add({
        targets: mote,
        x: mote.x + (Math.random() - 0.5) * motes.drift,
        y: mote.y - motes.rise * (0.5 + Math.random() * 0.5),
        alpha: 0,
        duration: motes.ms * (0.7 + Math.random() * 0.6),
        ease: "Sine.easeOut",
        onComplete: () => mote.destroy(),
      });
      // Flies do not rise in a line: they jink.
      if (flies)
        this.tweens.add({ targets: mote, x: `+=${Math.random() < 0.5 ? -4 : 4}`, duration: 90, yoyo: true, repeat: 4 });
    }
  }
  /** Feet gone on ice: a skid, a stagger to keep upright, and at a run the
   * slide carries on a cell before it stops. */
  private slip(dx: number, dy: number, time: number) {
    const running = this.shiftHeld;
    this.runSteps = 0;
    this.lastRunDir = undefined;
    this.nextInput = time + this.motionDuration + (running ? 900 : 600);
    this.time.delayedCall(this.motionDuration, () => {
      const p = this.runtime.engine.state.player.pos;
      if (running && !this.runtime.engine.playerBlocked(p.x + dx, p.y + dy))
        this.runtime.move(dx, dy, false, false);
      this.play(
        {
          pose: "skid",
          ms: 35,
          first: 0,
          last: 3,
          then: { pose: "stumble", ms: 85, first: 0, last: 3, for: 520 },
        },
        running ? 320 : 160,
      );
      const im = this.entities.get("player");
      if (im) this.feel.puff(im.x, im.y, [0xffffff, 0xe3ecf5, 0xc9d8e6], 6, 0.9);
      void gameAudio()?.sound(landing("stone", running ? 1.8 : 1.1), "step");
      this.runtime.engine.event("You slip on the ice.");
    });
  }
  /** Plays a pose on the player over whatever else would be showing. */
  private play(
    stunt: Pick<Stunt, "pose" | "ms" | "first" | "last"> & {
      then?: Stunt["then"];
    },
    ms: number,
  ) {
    const from = this.time.now;
    this.stunt = { ...stunt, from, until: from + ms };
  }
  /** Extra input delay when the action just started ends in more than a
   * landing: the stagger, the roll, the haul up over an edge. */
  private heldSerial = 0;
  private afterHold() {
    const action = this.runtime.characterAction;
    if (!action?.after || action.serial === this.heldSerial) return 0;
    this.heldSerial = action.serial;
    return action.after === "land" ? 0 : poseTiming(action.after) * 4;
  }
  /** People near enough to have seen it react. Show only. */
  /** Someone idle or walking by looks round at the player coming close. */
  private notice(
    id: string,
    im: Phaser.GameObjects.Image,
    pose: CharacterPose,
    time: number,
  ) {
    const me = this.entities.get("player");
    if (!me) return;
    const tiles = Math.hypot(im.x - me.x, im.y - me.y) / 16;
    if (tiles > FORGET_TILES) this.near.delete(id);
    if (tiles > NOTICE_TILES || this.near.has(id)) return;
    this.near.add(id);
    if (pose !== "idle" && pose !== "breathe" && pose !== "walk") return;
    if (
      time - this.lastNotice < NOTICE_GAP_MS ||
      time - (this.noticedAt.get(id) ?? -Infinity) < NOTICE_AGAIN_MS
    )
      return;
    this.lastNotice = time;
    this.noticedAt.set(id, time);
    this.cues.react(id, "notice", { x: (me.x - 8) / 16, y: (me.y - 16) / 16 });
  }
  private onlookers(x: number, y: number, tiles: number, kind: CueKind) {
    const toward = { x: (x - 8) / 16, y: (y - 16) / 16 };
    for (const id of this.humanActors.keys()) {
      if (id === "player") continue;
      const im = this.entities.get(id);
      if (!im || Math.hypot(im.x - x, im.y - y) > tiles * 16) continue;
      this.cues.react(id, kind, toward);
    }
  }
  /** A jump at something tall: a step up it, a planted foot, and a moment in
   * which Space kicks off. The engine hears nothing unless the kick comes. */
  private runAtWall(
    im: Phaser.GameObjects.Image,
    wall: { label: string; able: boolean },
    dx: number,
    dy: number,
    time: number,
  ) {
    const now = this.time.now;
    const wait = wall.able ? WALL_KICK_WINDOW_MS : 60;
    this.wallRun = {
      dx,
      dy,
      contact: now + WALL_RUN_MS,
      until: now + WALL_RUN_MS + wait,
      able: wall.able,
      label: wall.label,
      x: im.x,
      y: im.y,
    };
    this.blockedFacing = facingFromStep(
      dx,
      dy,
      this.runtime.engine.state.player.direction,
    );
    this.play(
      { pose: "kick", ms: WALL_RUN_MS, first: 0, last: 1 },
      WALL_RUN_MS + wait,
    );
    this.nextInput = time + WALL_RUN_MS + wait + 200;
    const rise = 9;
    this.tweens.killTweensOf(im);
    this.tweens.add({
      targets: im,
      x: im.x + dx * 6,
      y: im.y + dy * 6 - rise,
      duration: WALL_RUN_MS,
      ease: "Quad.easeOut",
      onUpdate: (tween: Phaser.Tweens.Tween) =>
        im.setData("arcLift", rise * tween.progress),
      onComplete: () => this.kickDust(im.x + dx * 5, im.y - 2, 4, 0.6),
    });
  }
  /** Space with a foot on the wall. Holding toward it goes up and over;
   * anything else pushes off, the way held or straight back. */
  private wallKick() {
    const run = this.wallRun,
      now = this.time.now,
      im = this.entities.get("player");
    if (!run || !im || !run.able || now < run.contact - 60 || now > run.until)
      return false;
    this.wallRun = undefined;
    this.blockedFacing = undefined;
    const held = this.direction();
    this.tweens.killTweensOf(im);
    if (held[0] === run.dx && held[1] === run.dy) {
      im.setData("arcLift", 0);
      this.runtime.climb();
      this.play(
        { pose: "hang", ms: poseTiming("hang"), first: 0, last: 3 },
        poseTiming("hang") * 4,
      );
      this.nextInput = this.lastTick + poseTiming("hang") * 4;
      this.onlookers(run.x, run.y, 5, "point");
      return true;
    }
    const [kx, ky] = held.some(Boolean) ? held : [-run.dx, -run.dy];
    // The push: grit off the wall where the foot was.
    this.kickDust(im.x + run.dx * 5, im.y + 2, 8, 1.2);
    this.feel.spring(im, 0.86, 1.16, 140);
    let cleared = 0;
    for (const power of ["long", "short"] as const) {
      this.runtime.jump(kx, ky, power, false, 8);
      cleared = this.runtime.engine.lastLeap
        ? this.runtime.engine.leapDistance()
        : 0;
      if (cleared) break;
    }
    if (!cleared) {
      this.slideDown(run, im);
      return true;
    }
    this.play({ pose: "kick", ms: 90, first: 2, last: 2 }, 90);
    this.nextInput = this.lastTick = this.time.now;
    this.nextInput += jumpMs(cleared) + this.afterHold();
    this.onlookers(run.x, run.y, 5, "point");
    return true;
  }
  /** Nothing came of it: back down the face and onto the feet. */
  private slideDown(
    run: NonNullable<WorldScene["wallRun"]>,
    im: Phaser.GameObjects.Image,
  ) {
    this.wallRun = undefined;
    this.blockedFacing = undefined;
    this.play(
      {
        pose: "kick",
        ms: 180,
        first: 3,
        last: 3,
        then: {
          pose: "land",
          ms: poseTiming("land"),
          first: 0,
          last: 3,
          for: poseTiming("land") * 4,
        },
      },
      180,
    );
    this.tweens.killTweensOf(im);
    this.tweens.add({
      targets: im,
      x: run.x,
      y: run.y,
      duration: 180,
      ease: "Quad.easeIn",
      onUpdate: (tween: Phaser.Tweens.Tween) =>
        im.setData("arcLift", 9 * (1 - tween.progress)),
      onComplete: () => {
        im.setData("arcLift", 0);
        this.feel.land(im, 10, run.x, run.y);
        void gameAudio()?.sound(landing(this.groundUnderPlayer(), 0.8), "land");
        this.kickDust(run.x, run.y, 3, 0.6);
      },
    });
    if (!run.able)
      this.runtime.remark(`You scrabble at ${run.label} and slide back down.`);
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
        // Let the tap through to the scene, which walks.
        if (phoneLayout()) return;
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
  /** Blooms are drawn in the ground chunks, which never see the pack. */
  private useFlora() {
    const a = this.runtime.engine.world.pack.anchor;
    if (a) setFloraRegion(floraRegion(a.lon, a.lat));
  }
  private showHover(id: string, pointer: Phaser.Input.Pointer) {
    const tip = this.hoverTip;
    if (!tip) return;
    this.hoverId = id;
    const seen = this.runtime.engine.inspect(id);
    if (!seen?.name) {
      this.hideHover();
      return;
    }
    tip.textContent = seen.name;
    if (seen.latin) {
      const latin = document.createElement("i");
      latin.textContent = ` ${seen.latin}`;
      tip.appendChild(latin);
    }
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
      : (this.entities.get(id) ??
        this.buildings.get(id) ??
        this.cropImages.get(id));
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
  /** The art leaves a bare pole; the cloth and its cross are tinted here, so
   * one sprite serves every realm. */
  private addChurchBanner(
    place: Place,
    placement: ReturnType<typeof buildingPlacement>,
    setting: WorldSetting | undefined,
    baseY: number,
  ) {
    const rect = (placement.model as { banner?: number[] }).banner;
    if (!rect || !setting) return;
    const seed = this.runtime.engine.state.manifest.seed;
    const banner = churchBanner(
      setting,
      random(seed, "church-banner", place.id),
    );
    for (const [frame, colour] of [
      ["church-banner-cloth", banner.field],
      ["church-banner-cross", banner.cross],
    ] as const) {
      const image = this.add
        .image(
          placement.x - placement.model.anchor[0] + rect[0],
          baseY - placement.model.anchor[1] + rect[1],
          this.texture(frame),
          frame,
        )
        .setOrigin(0, 0)
        // Dyed, then dimmed with the hour like the wall behind it.
        .setTint(multiplyTint(colour, this.tint))
        .setDepth(placement.depth + 1);
      this.layers.push(image);
    }
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
      kind: "roof-fan",
      period: Math.max(120, animation.period ?? 280),
      phase: animation.phase ?? 0,
    });
  }
  /** Four-frame loops the art publishes at points on a building: a brazier's
   * fire, a banner, a ball in play. Fire gives its own light, so only cloth
   * and the ball dim with the hour. */
  private addBuildingOverlays(
    id: string,
    placement: ReturnType<typeof buildingPlacement>,
    overlays: [string, number, number][],
  ) {
    const seed = this.runtime.engine.state.manifest.seed;
    overlays.forEach(([kind, x, y], i) => {
      const frame = `animation-${kind}-0`;
      const image = this.add
        .image(
          placement.x - placement.model.anchor[0] + x,
          placement.y - placement.model.anchor[1] + y,
          this.texture(frame),
          frame,
        )
        .setOrigin(0, 0)
        .setDepth(placement.depth + 1);
      if (!kind.startsWith("flame")) image.setTint(this.tint);
      this.layers.push(image);
      this.buildingAnimations.set(`${id}-overlay-${i}`, {
        image,
        kind,
        period: kind.startsWith("flame") ? 110 : kind === "ball" ? 150 : 240,
        phase: random(seed, "building-overlay", id, i) * 4,
      });
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
  private hearthHour() {
    return (((this.runtime.engine.state.clock / 3600) % 24) + 24) % 24;
  }
  /** How hard the fires are burning, 0..1: breakfast and the evening meal,
   * a little at midday, banked overnight and between. */
  private hearthStrength() {
    const h = this.hearthHour();
    if ((h >= 5 && h < 9) || (h >= 16.5 && h < 21)) return 1;
    if (h >= 11 && h < 13.5) return 0.7;
    return 0.3;
  }
  /** Which households have a fire going. Nearly all of them at the two meals,
   * a third at midday, a few at any hour; a cold day keeps more alight and a
   * cold night keeps half of them banked. */
  private hearthLit(id: string) {
    if (this.options.freeze || !perf.fires) return false;
    const h = this.hearthHour();
    const cold = (this.weather?.tempC ?? 20) < 9;
    const meal = (h >= 5 && h < 9) || (h >= 16.5 && h < 21);
    const share = meal
      ? 0.85
      : h >= 11 && h < 13.5
        ? 0.4
        : h >= 22 || h < 5
          ? cold
            ? 0.5
            : 0.08
          : cold
            ? 0.55
            : 0.15;
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
    const model = placement.model as typeof placement.model & {
      smoke?: [number, number, SmokeKind][];
    };
    const left = placement.x - model.anchor[0],
      top = placement.y - model.anchor[1];
    // A painter says where its smoke leaves; older art vents at the ridge.
    const points: [number, number, SmokeKind][] = model.smoke?.length
      ? model.smoke
      : [[model.bounds[2] * 0.62, -2, "vent"]];
    const strength = this.hearthStrength();
    const puffs = points.flatMap(([x, y, kind], n) =>
      // A second stack draws only when the house is cooking.
      n > 0 && strength < 0.5
        ? []
        : addPlume(
            this,
            left + x,
            top + y,
            kind,
            strength,
            placement.depth + 2,
            this.tint,
          ),
    );
    for (const puff of puffs) this.layers.push(puff);
    this.hearths.set(id, puffs);
    this.game.canvas.dataset.hearths = String(this.hearths.size);
  }
  /** Flame frames, a pool of light over the night wash, and smoke. */
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
    const phase = Math.floor(this.poseOffset(id) % 8);
    // The light reaches a little past the fire's own width either side.
    const radius = Math.max(32, Math.round((image.width * 0.85) / 4) * 4);
    const glow = this.add
      .image(
        Math.round(x),
        Math.round(y - 10),
        ensureFireLight(this, radius),
        "0",
      )
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(lightAlpha[this.light.id])
      .setDepth(19001);
    // Smoke leaves from the top of the flame, not the middle of the sprite.
    const smoke = this.options.freeze
      ? []
      : addPlume(
          this,
          Math.round(x),
          Math.round(y - image.height * 0.72),
          "fire",
          1,
          image.depth + 2,
          this.tint,
        );
    for (const puff of smoke) this.layers.push(puff);
    this.fires.set(id, {
      image,
      base,
      frames: this.fireFrames.get(base) ?? 4,
      phase,
      glow,
      smoke,
    });
  }
  private quenchFire(id: string) {
    const fire = this.fires.get(id);
    if (!fire) return;
    fire.glow.destroy();
    for (const puff of fire.smoke) puff.destroy();
    this.fires.delete(id);
  }
  /** Frames each building sheet holds, read off its index. A name test would
   * need every recipe prefix; the index already knows what it holds. */
  private sheetFrames?: [string, Set<string>][];
  private sheetImages = new Map<string, string>();
  private sheetLoading = new Set<string>();
  /** Fetches a building sheet the preload did not, then redraws the scenery
   * that stood in for it. */
  private loadSheet(key: string) {
    if (this.sheetLoading.has(key)) return;
    this.sheetLoading.add(key);
    this.load.atlas(
      key,
      this.sheetImages.get(key)!,
      this.cache.json.get(`${key}-index`),
    );
    this.load.once(`filecomplete-atlasjson-${key}`, () => {
      this.staticKey = "";
      if (this.scene?.isActive()) this.draw();
    });
    if (!this.load.isLoading()) this.load.start();
  }
  /** A coat is the species' frames with the colours swapped, built the first
   * time an animal wears it. Frames keep their names, with the coat in them. */
  private coatTexture(frame: string) {
    const plus = frame.indexOf("+");
    // "faunab-" or "faunac-": the side-view atlas or the four-direction one.
    const set = frame.slice(0, 6);
    const art = frame.slice(7, plus);
    const slug = frame.slice(plus + 1, frame.indexOf("-", plus));
    const key = `${set}+${art}+${slug}`;
    if (this.textures.exists(key)) return key;
    const swap = faunaCoats(art.split(".")[0], slug.replace(/_/g, "-"));
    const atlas = this.textures.get(set);
    const stem = `${set}-${art}-`;
    const frames = atlas
      .getFrameNames()
      .filter((name) => name.startsWith(stem))
      .map((name) => atlas.get(name));
    if (!swap || !frames.length) return set;
    const w = frames[0].cutWidth + 2,
      h = frames[0].cutHeight + 2;
    const canvas = document.createElement("canvas");
    canvas.width = w * 8;
    canvas.height = h * Math.ceil(frames.length / 8);
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    frames.forEach((f, i) =>
      ctx.drawImage(
        f.source.image as CanvasImageSource,
        f.cutX,
        f.cutY,
        f.cutWidth,
        f.cutHeight,
        (i % 8) * w,
        Math.floor(i / 8) * h,
        f.cutWidth,
        f.cutHeight,
      ),
    );
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = image.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const to = swap.get((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
      if (to === undefined) continue;
      d[i] = to >> 16;
      d[i + 1] = (to >> 8) & 255;
      d[i + 2] = to & 255;
    }
    ctx.putImageData(image, 0, 0);
    const texture = this.textures.addCanvas(key, canvas)!;
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    frames.forEach((f, i) =>
      texture.add(
        `${set}-${art}+${slug}-${f.name.slice(stem.length)}`,
        0,
        (i % 8) * w,
        Math.floor(i / 8) * h,
        f.cutWidth,
        f.cutHeight,
      ),
    );
    return key;
  }
  private texture(frame: string) {
    this.sheetFrames ??= lazySheets.map((key) => [
      key,
      new Set(Object.keys(this.cache.json.get(`${key}-index`)?.frames ?? {})),
    ]);
    for (const [key, frames] of this.sheetFrames)
      if (frames.has(frame)) {
        if (this.textures.exists(key)) return key;
        this.loadSheet(key);
        // Transparent until the sheet lands and the scenery redraws.
        return "__DEFAULT";
      }
    if (frame.startsWith("study-sheet-tree-")) return "tree-study";
    if (frame.startsWith("study-tree-"))
      return frame.slice(0, frame.lastIndexOf("-"));
    if (frame.startsWith("study-litter-")) return "tree-study";
    if (frame.startsWith("nature-")) return "nature";
    if (frame.startsWith("faunab-"))
      return frame.includes("+") ? this.coatTexture(frame) : "faunab";
    if (frame.startsWith("faunac-"))
      return frame.includes("+") ? this.coatTexture(frame) : "faunac";
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
      "groundMottle",
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
        mottle: this.liveGraphics.groundMottle,
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
    if (this.characters)
      this.characters.outline = this.liveGraphics.characterOutline;
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
    this.applyTiltShift();
  }
  private tiltShift?: TiltShiftPipeline;
  private applyTiltShift() {
    const renderer = this.game.renderer;
    if (!(renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return;
    const camera = this.cameras.main;
    const g = this.liveGraphics;
    if (!g.tiltShift) {
      if (this.tiltShift) camera.removePostPipeline("TiltShift");
      this.tiltShift = undefined;
      return;
    }
    if (!this.tiltShift) {
      if (!renderer.pipelines.postPipelineClasses.has("TiltShift"))
        renderer.pipelines.addPostPipeline("TiltShift", TiltShiftPipeline);
      camera.setPostPipeline("TiltShift");
      this.tiltShift = camera.getPostPipeline("TiltShift") as TiltShiftPipeline;
    }
    Object.assign(this.tiltShift.uniforms, {
      focus: g.tiltFocus,
      band: g.tiltBand,
      falloff: g.tiltFalloff,
      blur: g.tiltBlur,
      topBias: g.tiltTopBias,
      saturation: g.tiltSaturation,
      contrast: g.tiltContrast,
      vignette: g.tiltVignette,
    });
  }
  private followTiltFocus() {
    const player = this.entities.get("player");
    if (!this.tiltShift || !this.liveGraphics.tiltFollow || !player) return;
    const view = this.cameras.main.worldView;
    const target = Phaser.Math.Clamp((player.y - view.y) / view.height, 0.1, 0.9);
    const u = this.tiltShift.uniforms;
    u.focus += (target - u.focus) * 0.1;
  }
  private aimStarted?: number;
  private aimRunning = false;
  /** A tap is a snap throw. Held, the mark runs out to the missile's range in
   * about two thirds of a second and waits there. */
  private aimReach() {
    const held = this.time.now - (this.aimStarted ?? this.time.now);
    if (held < AIM_TAP_MS) return undefined;
    const range = this.runtime.engine.missile().range;
    return Math.max(
      2,
      Math.min(range, 2 + Math.floor(((held - AIM_TAP_MS) / AIM_MS) * range)),
    );
  }
  /** The cells the throw would cross right now, for the mark on the ground. */
  private aimPath() {
    if (this.aimStarted === undefined) return undefined;
    const reach = this.aimReach();
    if (!reach) return undefined;
    const [dx, dy] = this.jumpDirection();
    return this.runtime.engine.throwPath(dx, dy, reach, this.aimRunning);
  }
  private combat() {
    return (this.combatEffects ??= new CombatEffects(this, {
      tint: () => this.tint,
      lift: (x, y) => this.lift(x, y),
      entityAt: (id) => this.entities.get(id),
      shadowOf: (id) => this.shadows.get(id),
      hurt: () => {
        this.runtime.playPose("hurt");
        const player = this.entities.get("player");
        if (player) this.feel.blink(player);
      },
    }));
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
      case "snow":
        return 0.2;
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
    // Sprite ids repeat from world to world; their coats should not.
    if (w !== this.drawnWorld) this.faunaArt.clear();
    if (this.drawnWorld && w !== this.drawnWorld && this.testFauna.length) {
      this.testFauna = [];
      this.game.canvas.dataset.testFaunaCount = "0";
    }
    this.light = this.options.lighting
      ? lightingPreset(this.options.lighting)
      : lightingAt(rt.timeVisualClock ?? e.state.clock);
    this.tint =
      this.options.colorGrade === false
        ? 0xffffff
        : parseInt(this.light.tint, 16);
    this.shadowPhase = p.space === "outside" ? this.light.id : "night";
    // The figures are lit for the same hour their shadows are cast for.
    if (this.characters) this.characters.light = this.shadowPhase;
    const setting = w.pack.setting;
    const season = setting
      ? (seasonAt(setting.season, e.state.clock) ?? setting.season)
      : "summer";
    // A moulting coat is chosen for the season, so the choices go with it.
    if (season !== this.season) this.faunaArt.clear();
    this.season = season;
    this.weather = setting
      ? weatherAt(
          skySeed(e.state.manifest),
          setting.climate,
          setting.season,
          e.state.clock,
        )
      : undefined;
    // One wind for the scene: grass, canopies and anything airborne read it.
    if (this.weather) setWind(this.weather.wind);
    this.snow =
      setting && !this.options.lab
        ? snowSteps(
            snowCover(
              e.state.manifest.seed,
              setting.climate,
              setting.season,
              e.state.clock,
            ),
          )
        : 0;
    setSnowCover(this.snow);
    this.terrainStream?.setSnow(this.snow);
    setGroundState(
      this,
      setting && this.weather
        ? groundState(setting.climate, this.season, this.weather, this.snow)
        : undefined,
      this.weather,
    );
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
            : this.weather.condition === "snow"
              ? 0.3
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
      this.combatEffects?.dispose();
      this.combatEffects = undefined;
      this.terrainStream?.dispose();
      this.terrainStream = undefined;
      this.terrainAnchor = undefined;
    } else if (p.space !== "outside") {
      // Indoors the street is only out of sight. Rasterising it again on the
      // way back out is what made a settlement fill in a quadrant at a time.
      this.toolEffects?.dispose();
      this.combatEffects?.dispose();
      this.combatEffects = undefined;
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
    const tiles = e.state.tiles;
    setBloomCut(
      this,
      `${e.state.manifest.seed}:${e.state.tilesRevision ?? 0}`,
      (x, y) => {
        const t = tiles?.[`${x},${y}`];
        return !!(t && (t.cut || t.dug || t.stage));
      },
    );
    setCropCut((x, y) => !!tiles?.[`${x},${y}`]?.picked);
    // Chunks already on screen keep their sprites; a picked plant has to go
    // now rather than when its chunk next streams.
    const picks = e.state.tilesRevision ?? 0;
    if (picks !== this.pickedRevision) {
      this.pickedRevision = picks;
      for (const [id, image] of this.cropImages) {
        const at = /^crop-(-?\d+)-(-?\d+)$/.exec(id);
        if (at && tiles?.[`${at[1]},${at[2]}`]?.picked) image.destroy();
      }
    }
    if (key !== this.staticKey || w !== this.drawnWorld) {
      if (w !== this.drawnWorld) this.useFlora();
      const sceneryStart = performance.now();
      const worldChanged = w !== this.drawnWorld;
      this.drawnWorld = w;
      this.staticKey = key;
      for (const l of this.layers) l.destroy();
      if (worldChanged) {
        releaseRuins(this);
        this.structureDecay?.release();
      }
      this.layers = [];
      this.courtyardLighting.begin();
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
      this.lamps = [];
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
              const frameAndDress =
                spriteName === "rock"
                  ? rockFrame(
                      w.topography?.(x, y)?.habitat,
                      random(e.state.manifest.seed, "rock-art", x, y),
                    )
                  : seasonFrame(
                      treeVariant(
                        trodden(
                          namedShrub(
                            spriteName,
                            e.plantSpecies(spriteName, x, y)?.id,
                            (f) => this.textures.get("nature").has(f),
                          ),
                          !!e.state.tiles?.[`${x},${y}`]?.trodden,
                          (f) => this.textures.get("nature").has(f),
                        ),
                        random(e.state.manifest.seed, "tree-variant", x, y),
                        (f) => this.textures.get("nature").has(f),
                      ),
                      this.season,
                      w.pack.setting?.environment?.ecology ?? "grassland",
                      (f) => this.textures.get("nature").has(f),
                    );
              const frame = Array.isArray(frameAndDress)
                ? frameAndDress[0]
                : frameAndDress;
              const dressed = Array.isArray(frameAndDress) && frameAndDress[1];
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
              // A drawn seasonal frame is already dressed; the wash is for the rest.
              if (originalIsTree && w.pack.setting && !dressed) {
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
              const worked = e.state.tiles?.[`${x},${y}`];
              if (worked?.burnt) tint = blendTint(tint, 0x4a3f36);
              if (tint !== this.tint) decoration.setTint(tint);
              const ore = d && !worked?.stage && spriteName === "rock" ? e.oreAt({ x, y }) : undefined;
              if (ore)
                this.layers.push(
                  this.add
                    .image(
                      decoration.x,
                      decoration.getCenter().y,
                      oreOverlay(this, ore.metal, ore.grade),
                    )
                    .setOrigin(0.5, 0.5)
                    .setDepth(y * 16 + 12.1)
                    .setTint(tint),
                );
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
                this.canopies.push({ image: decoration, cut, id: d?.id });
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
            if (isRuin(b) && !stillStanding(b)) {
              const image = this.add.image(b.x * 16 - 32, b.y * 16 - 32 - this.lift((b.x + b.w / 2) * 16, (b.y + b.h) * 16), ruinTexture(this, b))
                .setOrigin(0, 0).setTint(this.tint).setDepth((b.y + b.h) * 16 - 2);
              this.layers.push(image);
              this.buildings.set(b.id, image);
              this.makeSelectable(image, b.id);
              continue;
            }
            const placement = buildingPlacement(b);
            // The cast texture uses the source canvas's bottom anchor; model owns its offset.
            this.shadow(
              (placement.model as { shadowFrame?: string }).shadowFrame ??
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
            const court = (
              placement.model as { courtyardLight?: CourtyardLight }
            ).courtyardLight;
            if (court)
              this.courtyardLighting.apply(
                image,
                court,
                this.light.id,
                this.options.shadows === false ? 0 : this.sunStrength(),
              );
            this.buildings.set(b.id, image);
            this.makeSelectable(image, b.id);
            // Abandoned or burnt: its own art, decayed, and no lit windows,
            // smoke or signs, since nobody keeps it.
            if (isRuin(b) || b.structure?.char) {
              // A building alight is the fire's to draw until it goes out.
              const burning = e.state.fires?.some((f) => f.place === b.id);
              if (showsWear(b) && !burning) (this.structureDecay ??= new StructureDecay(this)).request(b, image);
              continue;
            }
            const animation = (
              placement.model as typeof placement.model & {
                animation?: BuildingAnimationRecipe;
              }
            ).animation;
            if (animation)
              this.addBuildingAnimation(b.id, placement, animation);
            const overlays = (
              placement.model as { overlays?: [string, number, number][] }
            ).overlays;
            if (overlays) this.addBuildingOverlays(b.id, placement, overlays);
            this.addDoor(b, placement, image.y);
            this.lightWindows(b, placement, image);
            const model = placement.model as { smoke?: [number, number, string][]; door?: number[] };
            const wear = buildingWear(this, image.texture.key, image.frame.name, {
              climate: w.pack.setting?.climate,
              neglect: 1 - (b.condition ?? 0.7),
              smoke: model.smoke ?? [],
              forge: /smith|forge/i.test(b.name) ? model.door : undefined,
            });
            if (wear)
              this.layers.push(
                this.add
                  .image(image.x, image.y, wear)
                  .setOrigin(image.originX, image.originY)
                  .setTint(this.tint)
                  .setDepth(image.depth + 0.3),
              );
            this.addChurchBanner(b, placement, w.pack.setting, image.y);
            this.addBuildingSign(b, placement, w.pack.setting, image.y);
            if (
              (b.access === "household" ||
                (placement.model as { smoke?: unknown[] }).smoke?.length) &&
              this.hearthLit(b.id)
            )
              this.lightHearth(b.id, placement);
          }
        this.courtyardLighting.end();
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
        this.courtyardLighting.end();
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
      // Placed every frame by something else; this only creates and dresses it.
      own = false,
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
      if (id === "player" && this.strain) {
        const now = this.time.now;
        if (now >= this.strain.until) this.strain = undefined;
        else tx += Math.round(Math.sin((now - this.strain.at) * 0.11));
      }
      if (id === "player" && this.bonk) {
        const t = (this.time.now - this.bonk.at) / BONK_MS;
        if (t >= 1) this.bonk = undefined;
        else {
          // Thrown back and up, then settling onto the tile.
          const back = Math.sin(Math.PI * Math.min(1, t * 1.3)) * 7;
          tx -= this.bonk.dx * back;
          ty -= this.bonk.dy * back + Math.sin(Math.PI * t) * 5;
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
      if (own) return;
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
      const wasPerched = (im.getData("perch") as string | undefined) ?? "";
      const moved =
        !previous ||
        previous.x !== pos.x ||
        previous.y !== pos.y ||
        previous.space !== pos.space ||
        wasPerched !== perchKey;
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
      // Going up something, or coming back down it, is hand over hand rather
      // than a walk or a jump; a jump off the edge already has its arc.
      if (
        id === "player" &&
        previous &&
        wasPerched !== perchKey &&
        !arc &&
        previous.space === pos.space
      ) {
        this.climbTween(im, shade, tx, ty, !!perchKey);
        return;
      }
      if (
        previous?.space === pos.space &&
        (im.x !== tx || im.y !== ty) &&
        Math.hypot(im.x - tx, im.y - ty) < (arc ? 120 : roll ? 16 * 22 : 65)
      ) {
        this.tweens.killTweensOf(im);
        if (shade) this.tweens.killTweensOf(shade);
        if (arc) {
          this.launch(im, arc, tx, ty, pending?.after);
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
            ? this.npcPace(
                id,
                npcMotion(
                  e.state.manifest.seed,
                  id,
                  frame.startsWith("human-"),
                  e.state.clock,
                ),
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
    // Whatever was just thrown is still in the air: the effect draws it
    // until it lands, then asks for this pass again.
    const flying = this.toolEffects?.flying(rt.throwEffect);
    for (const o of obs.objects) {
      if (o.carriedBy || o.id === flying) continue;
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
      // Dung is drawn at world size and lies too flat to cast a shadow.
      if (o.dung) this.shadows.get(o.id)?.setVisible(false);
      // A pebble on the ground is a pebble, not the boulder its art was cut from.
      else if (o.kind === "item") {
        this.entities.get(o.id)?.setScale(ITEM_SCALE);
        this.shadows.get(o.id)?.setScale(ITEM_SCALE);
      }
    }
    // Goods set out beside a household's store: a full house shows three.
    const economy = e.state.economy;
    if (economy) {
      const seen = new Map(obs.objects.map((o) => [o.id, o]));
      for (const h of e.state.households ?? []) {
        const store = seen.get(h.storeId);
        if (!store) continue;
        shownStock(economy, h).forEach((item, i) => {
          const sprite = e.item(item)?.sprite;
          if (!sprite) return;
          const id = `${store.id}:stock:${i}`;
          renderEntity(id, sprite, store.pos);
          const im = this.entities.get(id);
          im?.setScale(ITEM_SCALE).setX(im.x + 9 + 5 * i);
          this.shadows.get(id)?.setVisible(false);
        });
      }
    }
    const flySources: FlySource[] = [];
    const at = (id: string, pos: Position, n: number) =>
      flySources.push({ id, x: pos.x * 16 + 8, y: pos.y * 16 + 14, n });
    for (const o of obs.objects) {
      if (o.pos.space !== "outside" || o.carriedBy) continue;
      if (o.dung && o.dung !== "droppings" && freshDung(o, e.state.clock))
        at(o.id, o.pos, o.dung === "pellets" ? 2 : 4);
      else if (o.item === "meat" || o.item === "fish") at(o.id, o.pos, 4);
      else if (o.prop && flyProps[o.prop]) at(o.id, o.pos, flyProps[o.prop]);
    }
    if (economy)
      for (const h of e.state.households ?? []) {
        const store = obs.objects.find((o) => o.id === h.storeId);
        if (store?.pos.space === "outside" && shownStock(economy, h).some((i) => i === "meat" || i === "fish"))
          at(`${store.id}:stall`, store.pos, 5);
      }
    const sky = this.weather;
    this.flies?.set(
      flySources,
      !sky || this.light.id === "night" || sky.condition === "rain" || sky.condition === "snow"
        ? 0
        : Math.max(0, Math.min(1, (sky.tempC - 8) / 14)),
    );
    this.heldSprites.clear();
    // An item taken in hand is drawn the same way a carried prop is, but a
    // real object in the hand wins.
    if (e.state.player.heldItem)
      this.heldSprites.set("player", `icon:${e.state.player.heldItem}`);
    for (const a of e.state.actors)
      if (a.heldItem) {
        const load = parseLoad(a.heldItem);
        const sprite =
          load && portableProps.find((p) => p.id === load.prop)?.sprite;
        this.heldSprites.set(
          a.id,
          sprite ? `${sprite}@${load!.style}` : `icon:${a.heldItem}`,
        );
      }
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
    this.stunned.clear();
    const struck = this.combat().pending(rt.swingEffect, rt.throwEffect);
    for (const g of [...(e.state.fauna ?? []), ...this.testFauna]) {
      if (Math.abs(g.pos.x - p.x) > range || Math.abs(g.pos.y - p.y) > range)
        continue;
      // Four-direction species have an authored frame per facing; the rest
      // are side views flipped for west.
      const turns = Boolean(faunaProfile(g.speciesId)?.directions);
      for (const [i, m] of g.members.entries()) {
        const id =
          m.n === undefined ? `${g.id}-${i}` : faunaSpriteId(g.id, m.n);
        const at = { x: m.x, y: m.y, space: "outside" };
        if (!visible(at)) continue;
        // Fright runs through a herd from the side the player is on.
        const fright = Math.hypot(m.x - p.x, m.y - p.y);
        this.faunaMotion.aim(
          id,
          m.x * 16 + 8,
          m.y * 16 + 16,
          URGENT.has(g.state),
          !!this.options.freeze || !this.entities.has(id),
          Math.min(0.5, Math.max(0, fright - 2) * 0.07),
        );
        const phase = this.poseOffset(id) % 8;
        const facing = FACINGS[m.direction] ?? "east";
        let art = this.faunaArt.get(id);
        if (!art) {
          const look = faunaLook(
            g.speciesId,
            e.state.manifest.seed,
            g.id,
            id,
            w.pack?.setting,
            this.season,
          );
          art = look
            ? `${look.art}+${look.coat.replace(/-/g, "_")}`
            : g.speciesId;
          this.faunaArt.set(id, art);
        }
        renderEntity(
          id,
          this.faunaFrame(
            g.speciesId,
            m.pose ?? g.state,
            phase,
            facing,
            undefined,
            art,
          ),
          at,
          true,
          g.id,
          false,
          true,
        );
        const im = this.entities.get(id)!;
        // Not until whatever did it has actually arrived.
        if ((m.stun ?? 0) > e.state.clock + 6 && !struck.has(id))
          this.stunned.add(id);
        const tier = TIERS[m.tier ?? "ordinary"];
        if (im.getData("tier") !== tier.scale)
          im.setData("tier", tier.scale).setScale(tier.scale);
        if (tier.tint !== 0xffffff) im.setTint(mixTint(this.tint, tier.tint));
        const flip = !turns && m.direction === 3;
        if (im.flipX !== flip) im.setFlipX(flip);
        // Three clear rows under the hooves in every study frame.
        im.setOrigin(0.5, (im.frame.height - 3) / im.frame.height);
        this.faunaSprites.set(id, {
          species: g.speciesId,
          state: m.pose ?? g.state,
          phase,
          facing,
          scale: tier.scale,
          art,
        });
      }
    }
    this.faunaMotion.keep(this.faunaSprites);
    for (const id of this.faunaMood.keys())
      if (!this.faunaSprites.has(id)) this.faunaMood.delete(id);
    // Walked into: it hops out of the way, and the player feels the bump.
    const jostle = rt.jostleEffect;
    if (jostle && jostle.serial !== this.jostleSerial) {
      this.jostleSerial = jostle.serial;
      const id = faunaSpriteId(jostle.group, jostle.n);
      this.faunaMotion.hurry(id);
      this.faunaMotion.leap(
        id,
        jostle.small ? 5 : 3,
        jostle.small ? 0.26 : 0.2,
      );
      const im = this.entities.get(id);
      if (im) this.feel.puff(im.x, im.y, FAUNA_DUST, jostle.small ? 3 : 5);
      gameAudio()?.sound(bumpAnimal(beastVoiceOf(jostle.species)), "bump");
      if (!jostle.small) {
        const d = e.state.player.direction;
        this.bump = {
          dx: d === 1 ? 1 : d === 3 ? -1 : 0,
          dy: d === 2 ? 1 : d === 0 ? -1 : 0,
          at: this.time.now,
        };
      }
    }
    this.placeFauna(0);
    if (this.options.lab && !this.options.overview)
      c.startFollow(this.entities.get("player")!, true, 0.4, 0.4);
    for (const [id, image] of this.entities)
      if (!keep.has(id)) {
        this.tweens.killTweensOf(image);
        const shade = this.shadows.get(id);
        if (shade) this.tweens.killTweensOf(shade);
        // Killed by the swing in flight: the body is the effect's to drop.
        const dying = struck.get(id)?.killed;
        if (dying) this.combat().adopt(id, image, shade);
        this.wading?.remove(id);
        if (!dying) image.destroy();
        this.hangings.get(id)?.image.destroy();
        this.hangings.delete(id);
        this.motions.delete(id);
        this.quenchFire(id);
        this.entities.delete(id);
        this.destinations.delete(id);
        this.actorFrames.delete(id);
        this.footfalls.delete(id);
        this.turning.delete(id);
        this.stepAt.delete(id);
        if (!dying) shade?.destroy();
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
    this.washKey = "";
    this.paintWash();
    this.game.canvas.dataset.lighting = this.light.id;
  }
  private paintWash() {
    const clock = this.options.lighting
      ? lightingPreset(this.options.lighting).hour * 3600
      : this.runtime.displayClock();
    const w = washAt(clock);
    const weather = this.weatherWash();
    const graded = this.options.colorGrade !== false;
    // Low sun is lost behind cloud.
    const golden = graded ? w.golden * 0.14 * (1 - weather / 0.3) : 0;
    const lamps = graded ? w.lamps : 0;
    const key = `${w.color}:${w.alpha.toFixed(3)}:${golden.toFixed(3)}:${weather.toFixed(3)}:${lamps.toFixed(2)}`;
    if (key === this.washKey) return;
    this.washKey = key;
    const x = -this.scale.width * 4,
      y = -this.scale.height * 4,
      width = this.scale.width * 9,
      height = this.scale.height * 9;
    this.night!.clear().fillStyle(w.color, graded ? w.alpha : 0).fillRect(x, y, width, height);
    if (golden > 0) this.night!.fillStyle(0xff9a4a, golden).fillRect(x, y, width, height);
    if (weather > 0) this.night!.fillStyle(0x4a5f80, weather).fillRect(x, y, width, height);
    for (const l of this.lamps) {
      l.pane.setAlpha(lamps).setVisible(lamps > 0);
      l.halo.setAlpha(lamps * 0.45).setVisible(lamps > 0);
    }
  }
  /** Lamps behind the glass of an occupied house after dark: most of them
   * in the evening, a few kept burning late. */
  private lightWindows(
    place: Place,
    placement: ReturnType<typeof buildingPlacement>,
    image: Phaser.GameObjects.Image,
  ) {
    const h = (((this.runtime.displayClock() / 3600) % 24) + 24) % 24;
    const share = h >= 17 && h < 22.5 ? 0.8 : h >= 4.5 && h < 8 ? 0.45 : 0.15;
    if (random(this.runtime.engine.state.manifest.seed, "lamp", place.id) >= share) return;
    const key = windowGlow(
      this,
      image.texture.key,
      image.frame.name,
      (placement.model as { door?: number[] }).door,
    );
    if (!key) return;
    const at = (depth: number) =>
      this.add
        .image(image.x, image.y, key)
        .setOrigin(image.originX, image.originY)
        .setDepth(depth)
        .setVisible(false);
    const pane = at(image.depth + 0.5);
    const halo = at(19001).setBlendMode(Phaser.BlendModes.ADD);
    this.layers.push(pane, halo);
    this.lamps.push({ pane, halo });
    this.washKey = "";
  }
  /** Cloud and wet ground both take the light out of a scene. Ground the
   * player can see is soaked long after the shower has passed. */
  private weatherWash() {
    const w = this.weather;
    if (!w || this.options.colorGrade === false) return 0;
    const cloud =
      w.condition === "rain" || w.condition === "snow"
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
    /** Frames walked so far. A moving animal's legs follow the ground it
     * covers, not the clock, or the feet slide. */
    stride?: number,
    art = species,
    /** When the state began: a pounce plays once and holds its last frame. */
    began?: number,
  ) {
    const ms =
      state === "flight"
        ? 85
        : state === "pounce"
          ? 110
        : state === "flee" ||
            state === "chase" ||
            state === "takeoff" ||
            state === "landing"
          ? 95
          : state === "wander" || state === "stalk" || state === "approach"
            ? 140
            : 260;
    const profile = faunaProfile(species);
    const count = profile?.art[state]?.length || 8;
    const n = this.options.freeze
      ? 0
      : state === "pounce" && began !== undefined
        ? Math.min(count - 1, Math.floor((this.time.now - began) / ms))
        : Math.floor((stride ?? this.time.now / ms) + phase) % count;
    return profile?.directions
      ? `faunac-${art}-${state}-${facing}-${n}`
      : `faunab-${art}-${state}-${n}`;
  }
  /** Walks each animal towards its cell and dresses it for where it is. */
  private placeFauna(dt: number) {
    const topo = this.runtime.engine.world.topography;
    const struck = this.combat().pending(
      this.runtime.swingEffect,
      this.runtime.throwEffect,
    );
    const player = this.entities.get("player");
    if (
      player &&
      (Math.abs(player.x - this.playerSeen.x) > 0.5 ||
        Math.abs(player.y - this.playerSeen.y) > 0.5)
    )
      this.playerSeen = { x: player.x, y: player.y, movedAt: this.time.now };
    for (const [id, f] of this.faunaSprites) {
      const im = this.entities.get(id);
      if (!im) continue;
      const now = this.time.now;
      // A blow is about to throw this one: the knockback moves the sprite,
      // and goes on moving it for a moment after the blow lands.
      if (struck.has(id)) this.faunaMotion.hold(id, now + 450);
      if (this.faunaMotion.held(id, now)) continue;
      if (this.faunaMotion.released(id, now))
        this.faunaMotion.adopt(id, im.x, im.y + this.lift(im.x, im.y));
      const profile = faunaProfile(f.species);
      const aerial = aerialStates.has(f.state);
      const pose = this.faunaMotion.step(
        id,
        dt,
        URGENT.has(f.state),
        profile?.gait ?? "walk",
        // In the air the sprite rides a cell and a quarter above its cell.
        aerial ? 20 : 0,
        !profile?.directions,
        !!player && Math.hypot(player.x - im.x, player.y - im.y) < 72,
      );
      if (!pose) continue;
      let mood = this.faunaMood.get(id);
      if (!mood)
        this.faunaMood.set(
          id,
          (mood = {
            state: f.state,
            from: 0,
            until: 0,
            squashed: false,
            began: this.time.now,
          }),
        );
      // The moment it bolts: a start, and dust from under it.
      if (URGENT.has(f.state) && !URGENT.has(mood.state) && !aerial && dt) {
        this.faunaMotion.leap(id, 2.5, 0.18);
        this.feel.puff(im.x, im.y, FAUNA_DUST, 3);
      }
      if (mood.state !== f.state) mood.began = this.time.now;
      mood.state = f.state;
      // Someone moving close by: after a beat the head comes up and follows
      // them, and goes down again once they have stood still a while. Not
      // every animal bothers, and none of them at the same instant.
      const near = player
        ? Math.hypot(player.x - im.x, player.y - im.y)
        : Infinity;
      const reach = Math.min(
        112,
        Math.max(56, ((profile?.alertRadius ?? 1) + 3) * 16),
      );
      const calm = WATCHFUL.has(f.state) && !pose.moving;
      if (calm && near < reach && now - this.playerSeen.movedAt < 400) {
        if (
          now > mood.until &&
          this.poseOffset(id + Math.floor(now / 6000)) % 4 < 3
        )
          mood.from = now + 120 + ((this.poseOffset(id) * 97) % 520);
        if (now >= mood.from || now <= mood.until)
          mood.until = Math.max(
            mood.until,
            now + 1400 + ((this.poseOffset(id) * 53) % 1600),
          );
      }
      const watching = calm && now >= mood.from && now < mood.until;
      let facing = profile?.directions ? (pose.heading ?? f.facing) : f.facing;
      let state = f.state;
      if (pose.moving && !STRIDING.has(state)) state = "wander";
      else if (!pose.moving && state === "wander") state = "idle";
      if (watching && player) {
        state = "idle";
        const dx = player.x - im.x,
          dy = player.y - im.y;
        if (profile?.directions)
          facing =
            Math.abs(dx) >= Math.abs(dy)
              ? dx < 0
                ? "west"
                : "east"
              : dy < 0
                ? "north"
                : "south";
        else if (Math.abs(dx) > 4 && im.flipX !== dx < 0) im.setFlipX(dx < 0);
      }
      const pace = Math.max(2, im.frame.height / 12);
      let name = this.faunaFrame(
        f.species,
        state,
        f.phase,
        facing,
        pose.moving && !aerial
          ? pose.travelled / (URGENT.has(state) ? pace * 1.6 : pace)
          : undefined,
        f.art,
        mood.began,
      );
      if (state !== f.state && !this.textures.get(this.texture(name)).has(name))
        name = this.faunaFrame(
          f.species,
          f.state,
          f.phase,
          facing,
          undefined,
          f.art,
        );
      if (im.frame.name !== name) {
        im.setFrame(name);
        // Three clear rows under the hooves in every study frame.
        im.setOrigin(0.5, (im.frame.height - 3) / im.frame.height);
      }
      if (!profile?.directions && pose.heading) {
        const flip = pose.heading === "west";
        if (im.flipX !== flip) im.setFlipX(flip);
      }
      if (pose.sx !== 1 || pose.sy !== 1) {
        im.setScale(f.scale * pose.sx, f.scale * pose.sy);
        mood.squashed = true;
      } else if (mood.squashed) {
        im.setScale(f.scale);
        mood.squashed = false;
      }
      const ground = pose.y - this.lift(pose.x, pose.y);
      im.setPosition(pose.x, ground - pose.alt - pose.hop);
      const depth = pose.y - 2;
      if (im.depth !== depth) im.setDepth(depth);
      this.shadeFauna(
        id,
        im,
        pose.x,
        ground,
        pose.alt,
        f.scale,
        topo && pose.alt < 1
          ? waterDepthAt(topo, pose.x / 16, (pose.y - 8) / 16)
          : 0,
      );
    }
  }
  /** One cast per pose and facing rather than per frame: legs moving inside a
   * shadow are not worth eight textures. */
  private shadeFauna(
    id: string,
    im: Phaser.GameObjects.Image,
    x: number,
    y: number,
    alt: number,
    scale: number,
    water: number,
  ) {
    if (this.options.shadows === false) return;
    const still = im.frame.name.replace(/-\d+$/, "-0");
    // Every coat of a form casts the same shadow.
    const key = `${this.shadowPhase}:${still.replace(/\+[^-]+/, "")}:${im.flipX ? "w" : "e"}:${alt > 1 ? "air" : ""}`;
    let cast = this.faunaShadows.get(key);
    if (!cast) {
      const frame = this.textures.getFrame(im.texture.key, still) ?? im.frame;
      const w = frame.cutWidth,
        h = frame.cutHeight;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      if (im.flipX) ctx.setTransform(-1, 0, 0, 1, w, 0);
      ctx.drawImage(
        frame.source.image as CanvasImageSource,
        frame.cutX,
        frame.cutY,
        w,
        h,
        0,
        0,
        w,
        h,
      );
      const made = spriteShadow(
        ctx.getImageData(0, 0, w, h).data,
        w,
        h,
        h - 4,
        this.shadowPhase,
        alt <= 1,
      );
      const texture = `fauna-shadow-${key}`;
      // The texture manager outlives the scene; this map does not.
      if (this.textures.exists(texture)) this.textures.remove(texture);
      this.textures
        .addCanvas(texture, made.canvas)
        ?.setFilter(Phaser.Textures.FilterMode.NEAREST);
      cast = { key: texture, origin: made.origin };
      this.faunaShadows.set(key, cast);
    }
    let shade = this.shadows.get(id);
    if (!shade) {
      shade = this.add.image(x, y, cast.key);
      this.shadows.set(id, shade);
    }
    if (shade.texture.key !== cast.key) shade.setTexture(cast.key);
    shade.setOrigin(cast.origin[0], cast.origin[1]);
    shade.setPosition(x, y);
    // Off the ground the shadow stays behind, smaller and fainter.
    const size = scale * (1 - Math.min(0.45, alt / 32));
    if (shade.scaleX !== size) shade.setScale(size);
    // Like a person's, not dimmed by cloud.
    const fade = water > 0.025 ? 0 : 1 - Math.min(0.55, alt / 26);
    if (shade.alpha !== fade) shade.setAlpha(fade);
    const depth = this.runtime.engine.world.topography ? -1000 : -60000;
    if (shade.depth !== depth) shade.setDepth(depth);
  }
  update(time: number, delta = 16) {
    open();
    this.drift?.update(time, !!this.options.freeze);
    this.mist?.update(time, !!this.options.freeze);
    this.life?.update(time, !!this.options.freeze);
    this.flies?.update(
      delta / 1000,
      [...this.humanActors.keys()].flatMap((id) => {
        const im = this.entities.get(id);
        return im?.visible ? [{ x: im.x, y: im.y }] : [];
      }),
      !!this.options.freeze,
    );
    updatePuddles(this, time);
    if (this.night) this.paintWash();
    this.followTiltFocus();
    mark("weather");
    if (perf.fauna)
      this.placeFauna(this.options.freeze ? 0 : Math.min(delta, 100) / 1000);
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
    if (this.runtime.timeVisualClock !== undefined && lightingAt(this.runtime.timeVisualClock).id !== this.light.id) this.draw();
    mark("terrain");
    if (!this.options.lab && this.ready && perf.ambientPeople && !this.runtime.timeTravelLocked) {
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
        const step = this.options.freeze
          ? 0
          : Math.floor(time / FIRE_FRAME_MS + fire.phase);
        const n = step % fire.frames;
        const name = n ? `${fire.base}-f${n}` : fire.base;
        if (fire.image.frame.name !== name) fire.image.setFrame(name);
        const size = String(LIGHT_FLICKER[step % LIGHT_FLICKER.length]);
        if (fire.glow.frame.name !== size) fire.glow.setFrame(size);
        const alpha = lightAlpha[this.light.id];
        if (fire.glow.alpha !== alpha) fire.glow.setAlpha(alpha);
        if (fire.glow.visible !== alpha > 0) fire.glow.setVisible(alpha > 0);
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
        const name = `animation-${animation.kind}-${frame}`;
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
      redraw: () => this.draw(),
    });
    this.toolEffects.consume(this.runtime.toolEffect);
    this.toolEffects.consumeSwing(this.runtime.swingEffect);
    this.toolEffects.consumeThrow(this.runtime.throwEffect);
    this.toolEffects.consumeShove(this.runtime.shoveEffect);
    const heave = this.runtime.heaveEffect;
    if (heave && heave.serial !== this.heaveSerial) {
      this.heaveSerial = heave.serial;
      this.heaveUp(heave);
    }
    this.toolEffects.update(time);
    const fires = this.runtime.engine.state.fires ?? [];
    if (fires.length || this.burning)
      (this.burning ??= new Burning(this)).update(
        fires,
        (f) => (f.place ? this.buildings.get(f.place) : this.plantImages.get(`${f.x},${f.y}`)?.at(-1)),
        (f) => {
          const s = f.place ? this.runtime.engine.world.place(f.place)?.structure : undefined;
          if (!s) return undefined;
          // The engine's clock only moves when the player acts; carry the
          // roof loss on at the drawn clock so the fire never stalls.
          const ahead = Math.max(0, this.runtime.displayClock() - this.runtime.engine.state.clock);
          return Math.min(1, 1 - s.roof + (ahead / BUILDING_BURN[s.fabric]) * 1.1);
        },
        this.runtime.engine.state.player.pos,
        time,
        delta,
        lightAlpha[this.light.id],
      );
    this.structureDecay?.update();
    const bearer = this.runtime.engine.state.player;
    if (bearer.heldItem === "torch" || this.torchFlame)
      (this.torchFlame ??= new TorchFlame(this)).update(
        this.entities.get("player"),
        bearer.heldItem === "torch",
        bearer.direction,
        lightAlpha[this.light.id],
      );
    this.drawTarget(time);
    this.combat().consume(this.runtime.swingEffect);
    this.combat().consumeThrow(this.runtime.throwEffect);
    this.combat().consumeEvents(this.runtime.engine.signals);
    this.cues.consume(this.runtime.engine.signals);
    this.cues.update();
    this.cues.sleeping(
      [...this.humanActors]
        .filter(([, a]) => /sleep/i.test(a.activity))
        .map(([id]) => id),
      time,
    );
    this.combat().charging(this.runtime.charge);
    this.runtime.aiming = this.aimStarted !== undefined;
    this.combat().aiming(this.aimPath(), time);
    this.combat().dazed(this.stunned, time);
    this.combat().update(time);
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
    if (this.wallRun && this.time.now > this.wallRun.until) {
      const im = this.entities.get("player");
      if (im) this.slideDown(this.wallRun, im);
      else this.wallRun = undefined;
    }
    // A walk begun from the command box ("find the cat") runs with focus still there.
    if (!this.options.lab && (!typing || this.runtime.running)) {
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
        const engine = this.runtime.engine;
        const aloft = !!engine.state.player.perch || engine.onWall();
        const wall = !aloft && player && this.runtime.wallAhead(dx, dy);
        if (wall) this.runAtWall(player, wall, dx, dy, time);
        else if (aloft) {
          // Space up a tree or on a wall is a jump off it, the way held.
          this.runtime.climb(dx, dy);
          this.motionDuration = 300;
          this.nextInput = time + this.motionDuration + this.afterHold();
        } else {
          this.motionDuration = jumpMs(
            this.runtime.jump(dx, dy, power, running),
          );
          this.nextInput = time + this.motionDuration + this.afterHold();
        }
        this.lastTick = time;
      } else if (time >= this.nextInput && this.jumpStarted === undefined) {
        const held = this.direction();
        const [dx, dy] = held.some(Boolean)
          ? held
          : (this.pendingDirection ?? held);
        this.pendingDirection = undefined;
        const back = this.lastRunDir;
        if (
          (dx || dy) &&
          this.shiftHeld &&
          this.runSteps >= 2 &&
          back &&
          dx === -back[0] &&
          dy === -back[1]
        ) {
          // Reversing a run costs a planted foot before the first step back.
          this.lastRunDir = undefined;
          this.runSteps = 0;
          this.nextInput = time + SKID_MS;
          this.play(
            { pose: "skid", ms: SKID_MS / 4, first: 0, last: 3 },
            SKID_MS,
          );
          const im = this.entities.get("player");
          if (im) this.kickDust(im.x - dx * 5, im.y, 5, 0.9);
        } else if ((dx || dy) && this.turnInPlace(dx, dy, time)) {
          // Turned without stepping; a held key walks on the next poll.
        } else if (dx || dy) {
          if (this.shiftHeld) {
            this.runSteps = Math.min(RUN_RAMP.length - 1, this.runSteps + 1);
            this.lastRunStep = time;
            this.lastRunDir = [dx, dy];
          } else {
            this.runSteps = 0;
            this.lastRunDir = undefined;
          }
          this.motionDuration =
            (this.shiftHeld ? RUN_RAMP[this.runSteps] : 140) *
            Math.hypot(dx, dy);
          const p = this.runtime.engine.state.player.pos,
            sample = this.runtime.engine.world.topography;
          if (sample && p.space === "outside" && !this.runtime.engine.state.player.afloat) {
            const depth = Math.max(
              waterDepthAt(sample, p.x + 0.5, p.y + 0.5),
              waterDepthAt(sample, p.x + dx + 0.5, p.y + dy + 0.5),
            );
            const ahead = sample(p.x + dx, p.y + dy);
            if (depth > 0)
              this.motionDuration =
                140 * Math.hypot(dx, dy) * wadingCost(depth);
            // Deep snow drags at every step off the beaten track.
            else if (
              this.snow > 0.5 &&
              ahead &&
              !ahead.pathArt?.length &&
              ahead.feature !== "paving"
            )
              this.motionDuration *= 1 + (this.snow - 0.5) * 1.2;
          }
          this.nextInput = time + this.motionDuration;
          this.lastTick = time;
          if (!this.vault(dx, dy, time)) {
            let moved = this.runtime.move(dx, dy, false, this.shiftHeld);
            // A diagonal into a corner slides along whichever wall is open,
            // rather than stopping dead. The engine is right to refuse the
            // diagonal; it is the input that should try the other way.
            if (moved?.status === "rejected" && dx && dy) {
              const at = this.runtime.engine.state.player.pos;
              const freeX = !this.runtime.engine.playerBlocked(at.x + dx, at.y);
              const freeY = !this.runtime.engine.playerBlocked(at.x, at.y + dy);
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
              this.runtime.face(dx, dy);
              this.blockedFacing = facingFromStep(
                dx,
                dy,
                this.runtime.engine.state.player.direction,
              );
              this.pushingAt = time;
              this.bump = { dx, dy, at: time };
              this.bumpedInto(dx, dy);
            } else {
              this.blockedFacing = undefined;
              this.pushingAt = undefined;
              // A walked drop can land as badly as a jumped one.
              this.nextInput += this.afterHold();
              const at = this.runtime.engine.state.player.pos;
              if (
                at.space === "outside" &&
                puddleUnder(this, at.x * 16 + 8, at.y * 16 + 12, 4) === "ice" &&
                Math.random() < (this.shiftHeld ? 0.65 : 0.25)
              )
                this.slip(dx, dy, time);
            }
            if (
              moved?.status === "rejected" &&
              this.shiftHeld &&
              this.runSteps >= 2
            )
              this.bonkAt(dx, dy, time);
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
      // the next jump lands and clears it. A walk tween that replaced it
      // still counts as tweening, so ask after the flight itself.
      if (
        arcLift &&
        !(im.getData("arc") as Phaser.Tweens.Tween | undefined)?.isActive()
      ) {
        im.setData("arcLift", 0);
        im.setScale(1, 1);
        arcLift = 0;
      }
      const perched = this.perchRise(id);
      const depth =
        im.y +
        arcLift +
        // Standing on the thing means drawing in front of it, foliage and
        // all, so the lift comes back off the depth. A wall walk only needs
        // the nudge: the masonry is the cell the player is in.
        (perched
          ? (id === "player" && this.runtime.engine.state.player.perch
              ? perched
              : 0) + 4
          : 0) +
        this.lift(im.x, (this.destinations.get(id)?.y ?? 0) * 16 + 16) -
        (frame ? 2 : 6);
      if (im.depth !== depth) im.setDepth(depth);
      // The camera tracks the sprite, so cancel the arc or the world bobs.
      if (id === "player" && !this.options.lab)
        this.cameras.main.setFollowOffset(0, -arcLift);
      const human = this.humanActors.get(id);
      if (human && this.characters && perf.characterPoses) {
        // The live camera scrolls by fractions of a pixel; a figure on a
        // half pixel shimmers against the ground, which sits on whole ones.
        im.setPosition(Math.round(im.x), Math.round(im.y));
        const shadow = this.shadows.get(id);
        shadow?.setPosition(Math.round(shadow.x), Math.round(shadow.y));
        const at = this.ambient.get(id);
        const pushing =
          id === "player" &&
          this.pushingAt !== undefined &&
          time - this.pushingAt < PUSH_MS;
        const moving = (at ? at.moving : this.tweens.isTweening(im)) || pushing;
        const action =
          id === "player" ? this.runtime.characterAction : undefined;
        const elapsed = action ? performance.now() - action.at : Infinity;
        // A jump is spread over its own arc, so the apex frame is drawn at
        // the apex whatever the distance, and a landing follows it. The
        // landing gives way to walking after its first frame.
        const arcMs =
          action?.pose === "jump" ? (action.arc?.duration ?? 360) : undefined;
        const active =
          action && elapsed < (arcMs ?? poseTiming(action.pose) * 4);
        const sinceLanding = arcMs === undefined ? -1 : elapsed - arcMs;
        // A plain landing gives way to walking; a stagger, a roll or a haul
        // up over an edge plays out.
        const after = action?.after ?? "land";
        const landed =
          sinceLanding >= 0 &&
          sinceLanding <
            poseTiming(after) * (moving && after === "land" ? 1 : 4);
        let stunt = id === "player" ? this.stunt : undefined;
        if (stunt && this.time.now >= stunt.until) {
          const next = stunt.then;
          stunt = this.stunt = next && {
            ...next,
            from: stunt.until,
            until: stunt.until + next.for,
            then: undefined,
          };
        }
        const sample = this.runtime.engine.world.topography;
        const wetPos = this.destinations.get(id);
        const craft = id === "player" && wetPos?.space === "outside" ? this.runtime.engine.state.player.afloat : undefined;
        const water =
          !(craft && craft !== "swimming") && sample && wetPos?.space === "outside" && !arcLift
            ? waterDepthAt(
                sample,
                im.x / 16,
                (im.y + this.lift(im.x, wetPos.y * 16 + 16) - 8) / 16,
              )
            : 0;
        // A puddle wets the feet without making anyone wade.
        const puddle =
          water <= 0.025 && !arcLift && wetPos?.space === "outside"
            ? puddleUnder(this, im.x, im.y - 1)
            : undefined;
        if (wetPos?.space === "outside" && !arcLift && water <= 0.025)
          reflectIn(this, id, im);
        const heldSprite = this.heldSprites.get(id);
        let pose: CharacterPose = moving ? "walk" : "idle";
        if (active) pose = action.pose;
        else if (landed) pose = after;
        else if (moving)
          pose = id === "player" && this.shiftHeld ? "run" : "walk";
        else if (at) pose = this.ambientPose(id, at, time);
        else if (/rest|sleep/i.test(human.activity)) pose = "sit";
        else if (/gathering|working/i.test(human.activity)) pose = "work";
        else if (/eating/i.test(human.activity)) pose = "give";
        if (id === "player" && pose === "idle") pose = "breathe";
        if (moving && water > 0.025 && !active) pose = "wade";
        if (craft && craft !== "swimming") pose = "sit";
        if (id === "player") this.watercraft.update(im, craft, this.tint,
          (this.runtime.engine.state.manifest.setting?.year ?? 0) >= 1930);
        if (id !== "player") this.notice(id, im, pose, time);
        // Someone reacting stops what they were doing to do it.
        const cued =
          id !== "player" && !moving ? this.cues.poseFor(id) : undefined;
        if (cued) pose = cued.pose;
        const me = this.runtime.engine.state.player;
        const fidget =
          id === "player" && !this.options.freeze
            ? this.feel.idle(
                time,
                pose === "breathe" && !this.runtime.charge && !this.aimStarted,
                {
                  injured: !!me.injury,
                  tired: me.fatigue > 65,
                  cold: (this.weather?.tempC ?? 20) < 4,
                },
                Math.random,
              )
            : undefined;
        if (fidget?.pose) pose = fidget.pose;
        if (stunt) pose = stunt.pose;
        // Something heavy in the arms shortens the stride.
        const laden =
          id === "player" && !!me.held && !this.runtime.engine.armed();
        let g = this.gaits.get(id);
        if (!g)
          this.gaits.set(
            id,
            // Someone first drawn mid-stride has no set-off; an infinite
            // `since` made their walk frame NaN, drawn high off the ground.
            (g = moving
              ? { since: time - SETOFF_MS, frame: 0, pose }
              : { since: -Infinity, still: time, frame: 0, pose }),
          );
        if (moving) {
          if (g.still !== undefined && time - g.still > GAIT_GAP_MS)
            g.since = time;
          g.still = undefined;
        } else g.still ??= time;
        let gaitFrame: number | undefined;
        if (!active && !landed && !stunt && !cued && !fidget?.pose) {
          const still = g.still === undefined ? 0 : time - g.still,
            walked = (g.still ?? time) - g.since;
          if (
            (pose === "walk" || pose === "run") &&
            time - g.since < SETOFF_MS
          ) {
            pose = "setoff";
            gaitFrame = 0;
          } else if (pose === "walk" && time - (g.pivot ?? -Infinity) < PIVOT_MS) {
            pose = "halt";
            gaitFrame = 0;
          } else if (pose === "walk" || pose === "run")
            // From the push-off, so every walk starts on the same foot.
            gaitFrame =
              Math.floor(
                ((time - g.since - SETOFF_MS) * (laden ? 0.72 : 1)) /
                  poseTiming(pose),
              ) % frameCount(pose);
          else if (
            (pose === "idle" || pose === "breathe") &&
            walked > 300 &&
            still < GAIT_GAP_MS + HALT_MS
          ) {
            if (still < GAIT_GAP_MS) [pose, gaitFrame] = [g.pose, g.frame];
            else {
              pose = "halt";
              gaitFrame = still - GAIT_GAP_MS < HALT_MS / 2 ? 0 : 1;
            }
          }
        }
        if (moving && gaitFrame !== undefined && pose !== "halt") {
          g.frame = gaitFrame;
          g.pose = pose;
        }
        const index =
          gaitFrame ??
          (stunt
          ? Math.min(
              stunt.last,
              stunt.first + Math.floor((this.time.now - stunt.from) / stunt.ms),
            )
          : active
            ? arcMs
              ? // Crouch, launch, a long apex, then the reach for the ground.
                [0.12, 0.4, 0.8].filter((t) => elapsed / arcMs >= t).length
              : Math.min(3, Math.floor(elapsed / poseTiming(pose)))
            : landed
              ? Math.min(3, Math.floor(sinceLanding / poseTiming(after)))
              : this.options.freeze
                ? 0
                : cued
                  ? cued.index
                  : fidget?.pose
                    ? Math.min(
                        3,
                        Math.floor(
                          ((time - fidget.from) /
                            (fidget.until - fidget.from)) *
                            4,
                        ),
                      )
                    : pose === "wade"
                      ? (this.wading?.frame(id) ?? 0)
                      : this.poseFrame(id, pose, laden ? time * 0.72 : time));
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
        const ahead =
          (id === "player" ? this.blockedFacing : undefined) ??
          cued?.facing ??
          human.facing ??
          facingFromDirection(human.direction);
        // A glance aside and back, in the second and third quarters of it.
        const glance = fidget?.look
          ? (time - fidget.from) / (fidget.until - fidget.from)
          : 0;
        const wanted =
          glance > 0.15 && glance < 0.85
            ? (ahead + (glance < 0.5 ? fidget!.look! : -fidget!.look!) + 8) % 8
            : ahead;
        let turn = this.turning.get(id);
        if (!turn) this.turning.set(id, (turn = { facing: wanted, until: 0 }));
        else if (turn.facing !== wanted && time >= turn.until) {
          // Reversing at a run digs the heels in.
          if (pose === "run" && Math.abs(turn.facing - wanted) === 4)
            this.kickDust(im.x, im.y, 4, 0.8);
          // A walk swung hard round rocks back on the old heading first.
          const swing = (wanted - turn.facing + 8) % 8;
          if (pose === "walk" && swing >= 3 && swing <= 5) {
            g.pivot = time;
            if (id === "player") this.kickDust(im.x, im.y, 2, 0.5);
          }
          turn.facing = turnToward(turn.facing, wanted);
          turn.until = time + TURN_HOLD_MS;
        }
        const texture = this.characters.frame(
          // Their own facing, or wherever a cue or a glance has turned them.
          turn.facing === (human.facing ?? facingFromDirection(human.direction))
            ? human
            : { ...human, facing: turn.facing },
          pose,
          index,
          prop,
        );
        // A hit-stop holds the figures too, not only what is tweened.
        if (this.tweens.timeScale && im.texture.key !== texture)
          im.setTexture(texture);
        // Dust off a run's contact frames. Walking raises none, or a quiet
        // street would be permanently hazy; jumps are covered by `launch`.
        if (this.footfalls.get(id) !== index) {
          this.footfalls.set(id, index);
          const afoot =
            pose === "run" && index % 4 === 1 && water <= 0.025 && !arcLift;
          // Heel strikes: frames 2 and 6 of the walk, 1 and 5 of the run.
          const heel = moving && index % 4 === (pose === "run" ? 1 : 2);
          if (puddle === "water" && heel)
            splashPuddle(this, im.x, im.y - 1, human.direction, pose === "run", im.depth, time);
          const cell = this.destinations.get(id);
          // Only ground that gives underfoot is heard.
          if (heel && id === "player" && cell && !arcLift) {
            void gameAudio()?.sound(
              this.footstepAt(cell, puddle, water, pose === "run"),
              "step",
            );
            const fungus = this.fungusUnderfoot(cell);
            const kind = fungus && this.runtime.engine.plantSpecies("nature-understory-fungi", cell.x, cell.y);
            if (fungus && kind) this.stirFungus(im.x, im.y, fungus, kind.id);
          }
          if (afoot && id === "player" && cell)
            this.feel.step(im, this.underfoot(cell, puddle));
          else if (afoot) this.kickDust(im.x, im.y, 2, 0.5);
        }
        if (id === "player") {
          const cell = this.destinations.get(id);
          if (moving && cell && water <= 0.025 && !arcLift)
            this.feel.track(
              im,
              this.underfoot(cell, puddle),
              human.direction,
              (this.weather?.wetness ?? 0) > 0.4,
              (this.runtime.engine.world.topography ? -1000 : -60000) - 1,
            );
          if (
            this.feel.stoppedRun(pose === "run", moving, time) &&
            !active &&
            !this.direction().some(Boolean)
          )
            this.feel.skid(im, this.shadows.get(id), human.direction, DUST);
          if (fidget?.shiver) {
            const nudge = Math.floor(time / 50) % 2 ? 0.6 : -0.6;
            im.x = Math.round(im.x) + nudge;
            // The camera tracks the sprite, so cancel the shiver or the whole
            // world shakes with it.
            if (id === "player" && !this.options.lab)
              this.cameras.main.setFollowOffset(nudge, -arcLift);
          }
        }
        this.wading?.update(
          id,
          im,
          // Legacy water and canals report an unbounded depth; wading still
          // has to draw something, so clamp rather than fall back to dry land.
          Number.isFinite(water)
            ? Math.max(water, puddle === "water" ? 0.035 : 0)
            : MAX_WADING_DEPTH,
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
    // Up a tree you are in the foliage, not behind it: the canopy stays solid
    // and the player draws among the branches.
    const perchedOn = this.runtime.engine.state.player.perch?.on;
    for (const { image, cut, id: canopyId } of this.canopies) {
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
        (!perchedOn || canopyId !== perchedOn) &&
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
    // Just above the cast shadows, under every sprite.
    this.mycelium ??= new Mycelium(
      this,
      this.runtime.engine.world.topography ? -999 : -59999,
    );
    const selected = this.selectedImage();
    const trees = this.canopies.map((c) => c.image);
    // The web reaches whatever roots nearby, not only other trees.
    const plants = [...this.plantImages.values()]
      .map((images) => images[0])
      .filter((image) => image && !String(image.frame.name).includes("rock"));
    this.mycelium.update(
      time,
      this.runtime.engine.state.manifest.seed,
      selected &&
        (trees.includes(selected) ||
          natureTreeSprites.includes(selected.frame.name) ||
          this.runtime.engine.world.pack.trees.includes(selected.frame.name))
        ? selected
        : undefined,
      plants,
    );
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
    return Math.floor((time + offset) / poseTiming(pose)) % frameCount(pose);
  }
  /** Someone mid-route has no pause before each tile, and takes as long
   * over it as the last one took to come, so the walk does not surge. */
  private npcPace(id: string, motion: { delay: number; duration: number }) {
    const now = this.time.now,
      since = now - (this.stepAt.get(id) ?? -Infinity);
    this.stepAt.set(id, now);
    if (since > 1200) return motion;
    return {
      delay: 0,
      duration: Math.min(1000, Math.max(motion.duration * 0.7, since)),
    };
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
  private touchStick?: { dx: number; dy: number; run: boolean };
  /** The on-screen stick. It stands in for held arrow keys, and for Shift
   * when pushed to its rim. Undefined lets go. */
  setTouchStick(stick?: { dx: number; dy: number; run: boolean }) {
    const was = this.touchStick;
    this.touchStick = stick;
    if (stick) {
      this.shiftHeld = stick.run;
      if (!was) this.pendingDirection = [stick.dx, stick.dy];
    } else if (was) this.shiftHeld = false;
  }
  /** The on-screen jump: down and up, as Space is. */
  touchJump(down: boolean) {
    if (down && !this.spaceDown && this.wallKick()) return;
    if (down && !this.spaceDown) {
      this.spaceDown = true;
      this.jumpRunning = this.shiftHeld || this.runtime.running;
      this.runtime.stop(false);
      this.jumpStarted = this.time.now;
    } else if (!down && this.spaceDown) {
      this.spaceDown = false;
      if (this.jumpStarted !== undefined) {
        this.queuedJump =
          this.time.now - this.jumpStarted >= JUMP_CHARGE_MS ? "long" : "short";
        this.jumpStarted = undefined;
      }
    }
  }
  /** The on-screen throw: held to aim, let go to throw, as X is. */
  touchThrow(down: boolean) {
    const player = this.runtime.engine.state.player;
    if (down && (player.held || player.heldItem)) {
      this.aimStarted = this.time.now;
      this.aimRunning = this.shiftHeld || this.runtime.running;
    } else if (!down && this.aimStarted !== undefined) {
      const reach = this.aimReach();
      this.aimStarted = undefined;
      const [dx, dy] = this.jumpDirection();
      this.runtime.throwHeld(dx, dy, this.aimRunning, reach);
    }
  }
  private direction(): [number, number] {
    if (this.touchStick) return [this.touchStick.dx, this.touchStick.dy];
    const has = (arrow: string, letter: string) =>
      Number(this.heldDirections.has(arrow) || this.heldDirections.has(letter));
    return [
      has("arrowright", "d") - has("arrowleft", "a"),
      has("arrowdown", "s") - has("arrowup", "w"),
    ];
  }
}

type Stunt = {
  pose: CharacterPose;
  from: number;
  ms: number;
  first: number;
  last: number;
  until: number;
  then?: Omit<Stunt, "from" | "until"> & { for: number };
};

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
