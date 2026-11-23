import { besideTeam, deliveryAt, vehicleAt } from "../world/v3/conveyances";
import { loadVoxelItems, voxelIcon, voxelItemsReady } from "./voxel-items";
import { shopArt, walkableRoof, waterborneFrames } from "../content/graphics/models";
import { socialLabels } from "../core/bonds";
import { shownStock } from "../core/economy";
import { keepsShop } from "../core/shop";
import { carryKit, parseLoad } from "../content/economy/carrying";
import { propDefs } from "../content/props/catalog";
import { portableProps } from "./characters/props";
import { drawGarmentIcon } from "./garment-icons";
import { Watercraft, drawBoatGrounding, drawMooring, mooredBoatFrame, boatPosture, boatCraft } from "./watercraft";
import { FishingGear, type Gear } from "./fishing-gear";
import { fishingWaterfront } from "../content/settlements/waterfronts";
import { HarborLayer } from "./harbor";
import { TrainLayer } from "./trains";
import { CabLayer } from "./cabs";
import { BabyEffects } from "./baby-effects";
import { VehicleLayer, crewFrame, crewPlace, ploughStep, vehiclePose } from "./vehicles";
import type { CharacterAppearance } from "../core/character";
import type { SettlementPlan } from "../world/v3/types";
import { ruinTexture, releaseRuins } from "./ruins";
import { Burning, TorchFlame } from "./burning";
import { BUILDING_BURN } from "../content/ecology/metals";
import { oreOverlay } from "./ore-art";
import { showsWear, stillStanding, StructureDecay } from "./structure-decay";
import { isRuin } from "../core/time/structure";
import { townGateShut } from "../core/doors";
import {
  waterDepthAt,
  wadingCost,
  MAX_WADING_DEPTH,
} from "../core/water-field";
import { WadingEffects } from "./characters/wading";
import { shorePolishDefaults } from "./living-water/polish";
import { updateLivingWater } from "./living-water/game";
import { addPixelTexture, releaseCanvas, releaseTexture } from "./resources";
import { perf, open, mark, span, timed } from "./perf-switches";
import { isGrassTuft, natureTreeSprites } from "../content/ecology/vegetation";
import { grassTuftFrame, TUFT_ATLAS } from "./ground-motifs";
import { Mycelium } from "./mycelium";
import { rockFrame } from "../content/ecology/rocks";
import { propVariety, reviewedPropFrame, worksiteVariantFrame, groundedRockTexture, mangroveRootCollar } from "./prop-variety";
import { beachTint } from "./habitat-raster";
import { waterPalette } from "./water-style";
import { keeperTrade, secondLanguage, signLanguage, signOptions, signPaints, streetTrade } from "../content/settlements/signs";
import { drawShopSign, fitWord, SIGN_GLOW, type SignSlot } from "./shop-signs";
/** Trades for a shopfront the kit did not name. */
import type { Place } from "../core/types";
import type { WorldSetting } from "../content/geography/types";
import { aerialStates, type FaunaGroup, type FaunaState } from "../core/fauna";
import { MUD_DRIES, wallowable } from "../core/fauna-sim";
import {
  faunaArtStem,
  faunaCoats,
  faunaLook,
  faunaAt,
  faunaProfile,
  type FaunaFacing,
  type FaunaProfile,
  eightWay,
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
/** The sling hand overhead, from the player sprite's origin; tuned by eye. */
const WHIRL_HAND = { x: 7, y: -33 };
const FAUNA_DUST = [0xb9a27a, 0x9c8762, 0xd2c09a];
const FAUNA_FEATHERS = [0xf4efe4, 0xd8c7a6, 0xa8743f];
/** Wet mud on a coat; it pales back to the coat as it dries. */
const MUD = 0x9c8064;
const muddied = (t: number) => {
  const ch = (shift: number) => Math.round(255 + (((MUD >> shift) & 255) - 255) * t) << shift;
  return ch(16) | ch(8) | ch(0);
};
/** Dust in a low sun, gold rather than grey. */
const DUSK_DUST = [0xe2b878, 0xcf9d62, 0xf2d29a];
/** Sun strength below which shadows are cloud-soft: overcast, mist, rain, snow. */
const CLOUDED = 0.5;
/** States whose art already shows the animal travelling. */
const STRIDING = new Set<FaunaState>([...URGENT, "wander", "stalk", "carry"]);
/** The nearest pose an animal has for one it was not drawn in. */
const FALLBACK: Partial<Record<FaunaState, FaunaState>> = {
  chase: "flee",
  pounce: "flee",
  stalk: "wander",
  carry: "wander",
  flee: "wander",
  forage: "idle",
  graze: "idle",
  wander: "idle",
  rest: "idle",
};
/** A feather lifted off a kill, by the colour of the feathers lying there. */
const FEATHER_COLOURS: Record<string, number> = {
  white: 0xeeece4,
  grey: 0xb7c0c2,
  brown: 0xb3834c,
  dark: 0x5a4a3c,
};
import { canopyHidesPlayer } from "./canopy-visibility";
import { WorldCharacters } from "./characters/world";
import { entityInView, npcMotion } from "./entity-presentation";
import { FaunaMotion } from "./fauna-motion";
import { spriteShadow } from "./characters/shadow";
import { fieldPose, frameCount, heldFrame, poseTiming, workPoseFor, worksiteStationFamily, type CharacterPose } from "./characters/poses";
import type { Actor, Stats } from "../core/types";
import { statsOf } from "../core/stats";
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
import { CYCLE_AIR, jumpMs, JUMP_CHARGE_MS, type Runtime } from "../runtime/session";
import type { Position, WorldModel, WorldObject } from "../core/types";
import { surfaceAt, hasQuay } from "./materials";
import { gameAudio } from "../audio/director";
import { slingWhirl } from "../audio/sfx";
import { TreeFinds } from "./tree-finds";
import {
  bumpAnimal,
  bumpPerson,
  cockCrow,
  thump,
  scrape,
  footstep,
  type DungStep,
  type FungusStep,
  landing,
  scramble,
  strike,
  takeoff,
  hoofbeat,
  mountVoice,
  spurSnap,
  mountSkid,
  mountLeap,
  mountLand,
  cycleTick,
  cycleRoll,
  cycleSkid,
  ice as iceSound,
  motorPutt,
  trickChime,
} from "../audio/sfx";
import { mountSpec, type MountGait } from "../core/riding";
import { CYCLE_SPECS, cycleStep, cycleTrick, type CycleLook } from "../core/cycles";
import { CycleRider, WHEELIE_MS } from "./cycles/rider";
import { beastVoiceOf, voiceOf } from "../audio/voices";
import { DUNG_DRY_HOURS, DUNG_FRESH_HOURS } from "../content/fauna/dung";
import type { HitClass } from "../core/reactions";
import { hash, random } from "../core/random";
import { VoxelLife, voxelLamps, voxelWeather, type VoxelModel } from "./voxel-life";
import {
  defaultLiveGraphicsSettings,
  type LiveGraphicsSettings,
} from "./live-graphics";
import { ToolEffects, ROLL_MS, projectileArrowTexture } from "./tool-effects";
const LAUNCHERS = new Set(["bow", "sling", "crossbow", "musket", "pistol", "rifle", "blowgun", "hawk"]);
/** Hunting gear drawn from its item icon, not from a prop atlas. */
const HUNT_ICONS = ["bow", "arrow", "sling", "throwing-stick", "blowgun", "dart", "bolt", "shot", "cartridge", "snare", "hawk"];
import { CombatEffects, faunaSpriteId, mixTint } from "./combat-effects";
import { PlayerFeel } from "./player-feel";
import { sexOf } from "../core/brief";
import { kinOf } from "../core/kin";
import { plotRoleKnown } from "../core/plot";
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
  stinkhorn: "slime",
  "wood-ear": "slime",
  "cup-fungus": "pop",
  "fairy-ring": "pop",
  psilocybe: "pop",
};
const DUST = [0x9c8c6a, 0xbcae8c, 0x7d7054];
/** A jump pressed this long before the previous move ends still fires, so a
 * landing never eats the next input. */
const JUMP_BUFFER_MS = 90;
/** A jump this soon after a running step counts as a running jump. */
/** Ground items borrow scenery art, which is drawn far larger than a handful. */
const ITEM_SCALE = 0.4;
const RUN_GRACE_MS = 200;
/** How long each intermediate facing is held while someone turns around. */
const TURN_HOLD_MS = 60;
/** The lean into a first step, and the rock back and settle out of a walk. */
const SETOFF_MS = 80;
/** A limp: the half of the stride on the bad leg hurried, the good leg's
 * half drawn out, over the same cycle so the feet do not slide. */
function limpFrame(steps: number, n: number, lame: number) {
  const quick = lame === 2 ? 0.5 : 0.65, half = n / 2, u = steps % n;
  return u < half * quick ? Math.floor(u / quick) : Math.min(n - 1, half + Math.floor((u - half * quick) / (2 - quick)));
}
const HALT_MS = 200;
/** A gap between steps shorter than this is still one walk, not a stop and a start. */
const GAIT_GAP_MS = 60;
/** The rock back as a walk swings round three eighths or more. */
const PIVOT_MS = 90;
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
/** The conversation's reply box with nothing typed in it yet: the arrows
 * still walk from there, so the player can turn their back mid-talk. */
const walkableBox = (el: Element | null) =>
  el instanceof HTMLInputElement && el.dataset.walkable !== undefined && !el.value;
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
  siestaOf,
  type Ambient,
  type StationActivity,
} from "../core/itinerary";
import { SNOW_SHADOW } from "./shadow-style";
import { cloudWash, gradeAt, lightingAt, lightingPreset, shadowFrame, tintAt, washAt } from "./lighting";
import { windowGlow, windowHalo } from "./window-light";
import { greetingFor, twoHanded } from "../content/characters/greetings";
import { buildingSnowBank, buildingWear } from "./building-wear";
import { CourtyardLighting, type CourtyardLight } from "./courtyard-lighting";
import { Drift } from "./drift";
import { Mist } from "./mist";
import { CloudShadows } from "./cloud-shadows";
import { Reflections } from "./reflections";
import { accentFor, AmbientLife, critterFor, type CritterKind } from "./ambient-life";
import { SmallCreatures } from "./small-creatures";
import { Monkeys } from "./monkeys";
import { itemColors } from "./item-art";
import { Flies, type FlySource } from "./flies";
import { IceEffects } from "./ice-effects";
import { ICE_THIN } from "../core/ice";
import { freshDung } from "../core/dung";
import { freshCarcass } from "../core/remains";
import { RemainsLife, type RemainsSource } from "./remains-life";
import {
  groundState,
  snowCover,
  skySeed, weatherAt,
  type Weather,
} from "../core/weather";
import { puddleUnder, reflectIn, setGroundState, splashPuddle, updatePuddles } from "./puddles";
import { meltPatch, openSnow, setFrost, setSnowCover, snowSteps } from "./snow-cover";
import { tideAt } from "../content/geography/waterscapes";
import { setWind } from "./wind";
import { addPlume, type SmokeKind } from "./smoke";

import {
  driftStyle,
  foliageTint,
  namedShrub,
  trodden,
  seasonFrame,
  treeVariant,
  crateFrame,
  LEAF_COLOURS,
  LITTER_H,
  LITTER_W,
  leafLitter,
  turnsColour,
} from "./season-art";
import { foodPatch, seasonAt, seasonIndex } from "../core/livelihood";
import {
  FIRE_FRAME_MS,
  LIGHT_FLICKER,
  animatedBase,
  motionFrames,
  motionPeriod,
  animatedFrames,
  ensureDoorGlow,
  ensureEmber,
  ensureFireLight,
  ensureGroundSpill,
  ensureHalo,
  ensureLightCone,
  ensurePorchLamp,
  ensureLightMask,
  lampLight,
  lampOn,
  type Lamp,
  lightAlpha,
} from "./fire";
import terrainFrames from "./generated/terrain.json" with { type: "json" };
import { bloomAt, setBloomCut } from "./flowers";
import { FLOOR_X, FLOOR_Y, PixelRoom } from "./interiors/pixel";
import { CaveView } from "./cave/view";
import { SewerView } from "./sewer/view";
import { FairView } from "./fair/view";
import { palacePropPicture } from "./fair/palace";
import { exhibitPicture } from "./fair/things";
import { TombView } from "./tomb/view";
import { PrisonView } from "./prison/view";
import type { FairLevel } from "../world/fair";
import type { TombLevel } from "../world/tomb";
import type { PrisonLevel } from "../world/prison";
import { ShipView } from "./ship/view";
import { paintOpenLid } from "./sewer/art";
import { laneLids } from "./carriageway";
import { caveLight } from "../content/caves";
import type { Kind, Prop } from "./interiors/room";
import { ROOM_ORIGIN, roomAt } from "../world/interior";
import { addCrops, cropsAt, setCropSelector, setCropCut, setCropsIndoors } from "./crops";
import { fieldRidge } from "./field-raster";
import { setFloraRegion } from "../content/ecology/blooms";
import { floraRegion } from "../content/ecology/flora";
import { alternateTrees, lazySheets, pageImage, pagedSheets, sceneAssets } from "./scene-assets";
import { TiltShiftPipeline } from "./tilt-shift";
import { NightGradePipeline } from "./night-grade";
import { ailing, healthPerson, symptomsShown, type Symptoms } from "../core/health";
import type { RestingExpression } from "../core/persona";
import { smokingFrom, smokingHabit, type SmokeForm } from "../content/characters/smoking";
import { Smokers } from "./smoking";
import { RainCovers, coverFor, coverItem, shawlTint, type Cover } from "./rain-cover";
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
/** Where someone up on a town wall stands, in pixels above the ground: a
 * little way back from the front edge of the wall top, a tower top or a
 * gatehouse span. From WALL_H, TOWER_FACE and the span face in
 * scripts/art/urban.py; a flight's step k is at k * WALL_H / 3. */
const WALK_RISE = { wall: 44, tower: 58, gate: 74 } as const;
const STAIR_RISE = [0, 15, 28, 42];
/** How far off the cell centre a diagonal's band runs, by the corner it crosses. */
const WALK_CORNER = { nw: [-4, -4], ne: [4, -4], se: [4, 4], sw: [-4, 4] } as const;
/** Someone minding a stall or a shop counter, who serves whoever stops at it. */
const keeps = (a: Ambient) => a.activity === "work" && /sell|stall|market|shop|trading/i.test(a.label);
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
  fish: "work",
  hunt: "stoop",
  skate: "idle",
};
/** Rows of a character frame shown above the covers: the head and a little of the shoulders. */
const HEAD_ROWS = 13;
const PRIVY_DOOR = /^study-propb-privy-(shed|stone|outhouse|nightsoil)-\d+-open$/;
/** The motion each piece of a room's work asks for. */
const INDOOR_WORK: Partial<Record<Kind, CharacterPose>> = {
  loom: "work-weave", spinwheel: "work-weave", basket: "work-weave", bolts: "work-sort", vat: "work-stir",
  counter: "work-sort", jars: "work-sort", crate: "work-sort", sacks: "work-sort", potrack: "work-sort", icebox: "work-sort",
  throw: "work-knead", claybin: "work-knead", table: "work-knead", lowtable: "work-knead",
  desk: "work-check", scrolls: "work-check", hides: "work-scrub", quern: "work-quern", range: "work-stir",
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
const workTargets: Partial<Record<CharacterPose, readonly string[]>> = {
  tug: ["well", "framed-well", "town-well", "trough", "seine-rope", "worksite-ropewalk"],
  push: ["worksite-press-yard"],
  "work-stir": ["cooking-pot", "hearth", "camp-hearth", "communal-hearth", "three-stone-hearth", "firepit", "stove", "barrel", "storage-jar", "dye-vats", "worksite-dye-racks", "worksite-soap-yard", "worksite-press-yard"],
  "work-knead": ["oven", "earth-oven", "tannur", "bench", "mud-bricks", "earthen-pot", "worksite-pottery-rack"],
  "work-throw": ["worksite-pottery-rack", "earthen-pot", "bench"],
  "work-pound": ["anvil", "knapping-floor", "pounding-mortar", "grinder", "metate", "quern", "grindstone", "woodpile", "chopping-block", "worksite-paper-yard"],
  "work-hammer": ["anvil", "worksite-smith-bench"],
  "work-chisel": ["worksite-mason-bench", "worksite-carpenter-bench", "worksite-foundry-yard", "bench"],
  "work-saw": ["worksite-carpenter-bench", "worksite-charcoal-yard", "woodpile", "bench"],
  "work-crank": ["worksite-silk-yard", "worksite-ropewalk", "grindstone", "well"],
  "work-scrape": ["worksite-tanner-rack", "worksite-paper-yard", "worksite-carpenter-bench", "hide-frame"],
  "work-pour": ["worksite-foundry-yard", "worksite-press-yard", "crop", "barrel", "storage-jar"],
  "work-quern": ["quern"],
  "work-grind": ["grinder", "metate"],
  "work-weave": ["loom", "warp-loom", "backstrap-loom", "open-basket", "hide-frame", "bench", "worksite-loom-frame", "worksite-net-frame", "worksite-net-rail", "worksite-seine-pegs"],
  "work-scrub": ["wash-tub", "washing-line", "tanning-pits", "hide-frame"],
  "work-rinse": ["shallow-water"],
  "work-fish": ["shallow-water", "fish-weir"],
  "work-hang": ["drying-rack", "worksite-dye-racks", "worksite-paper-yard", "worksite-silk-yard"],
  "work-tend": ["crop", "wild-food", "hoe", "rake", "sheaf", "stock-pen", "trough", "beehive", "log-hive", "pipe-hive", "chicken-coop", "worksite-silk-yard", "worksite-charcoal-yard"],
  "work-sort": ["market-counter", "beam-scale", "crate-stack", "grain-sacks", "bench", "barrel", "storage-jar", "worksite-fish-table", "worksite-fish-trays", "worksite-fish-mat", "worksite-soap-yard", "worksite-pottery-rack"],
};
const STATION_ALTERNATE: Partial<Record<string, CharacterPose>> = {
  "worksite-dye-racks": "work-hang",
  "worksite-silk-yard": "work-tend",
  "worksite-soap-yard": "work-sort",
  "worksite-paper-yard": "work-hang",
  "worksite-press-yard": "push",
  "worksite-carpenter-bench": "work-scrape",
  "worksite-foundry-yard": "work-chisel",
  "worksite-pottery-rack": "work-sort",
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
/** Hour and minute hands on a painted dial, a pixel at a time so they stay
 * pixel art at any angle. */
function drawClockHands(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  r: number,
  minute: number,
) {
  g.clear().fillStyle(0x2a2630);
  const m = ((minute % 1440) + 1440) % 1440;
  for (const [turn, length] of [
    [(m / 720) % 1, 0.5],
    [(m % 60) / 60, 0.8],
  ]) {
    const a = turn * Math.PI * 2;
    for (let t = 0; t <= r * length; t += 0.5)
      g.fillRect(Math.floor(cx + Math.sin(a) * t), Math.floor(cy - Math.cos(a) * t), 1, 1);
  }
}
/** Seven shades of a character's colour for the rider's keyed greys: the
 * fourth is the colour itself, shadows cool toward violet, lights warm. */
function riderRamp(hex: string): [number, number, number][] {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const mix = (to: number[], t: number) => c.map((v, i) => Math.round(v + (to[i] - v) * t)) as [number, number, number];
  return [0, 1, 2, 3, 4, 5, 6].map((l) =>
    l < 4 ? mix([28, 20, 40], Math.min(0.85, (4 - l) * 0.21)) : mix([255, 240, 216], (l - 4) * 0.16),
  );
}
type BuildingAnimation = {
  image: Phaser.GameObjects.Image;
  kind: string;
  period: number;
  phase: number;
  /** An aviation light or a neon tube: shown only after dark. */
  light?: boolean;
};
type FireEffect = {
  image: Phaser.GameObjects.Image;
  base: string;
  frames: number;
  phase: number;
  glow: Phaser.GameObjects.Image;
  /** Off the display list: stamped into the night wash each frame. */
  pool: Phaser.GameObjects.Image;
  smoke: Phaser.GameObjects.Image[];
  embers?: Phaser.GameObjects.Particles.ParticleEmitter;
  melt?: Phaser.GameObjects.Image;
};
const WINDOW_TONE: [number, number, number] = [255, 196, 128];
const PORCH_TONE: [number, number, number] = [255, 220, 168];
const HEARTH_TONE: [number, number, number] = [255, 178, 92];
type StreetLight = {
  pool: Phaser.GameObjects.Image;
  flames: Phaser.GameObjects.Image[];
  /** The light falling from a shaded head; it does not flicker. */
  cones: Phaser.GameObjects.Image[];
  lamp: Lamp;
  phase: number;
  /** Its place on the lamplighter's round, 0 to 1. */
  order: number;
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
type TokenFace = "coin" | "cash" | "barter";
const TOKEN_INK: Record<string, number> = {
  k: 0x3a2410, d: 0xa8761f, m: 0xd9a63e, g: 0xf2cf6b, l: 0xffe39a, w: 0xfffbe8,
  K: 0x4a3420, D: 0xa88a5c, M: 0xcdb487, G: 0xe8dcbc, L: 0xf6efda, a: 0x6b4a1e,
  b: 0x2f4f9e, r: 0xb8382c,
};
const RIM = ["....kkkk....", "..kkllllkk..", ".kllwggggmk.", ".klwgggggmk."];
const BASE = [".kgggggggmk.", ".kmggggmmdk.", "..kkddddkk..", "....kkkk...."];
/** Twelve-pixel tokens lit from the top left. A struck coin has a raised
 * boss; cast cash a bevelled square hole; a barter token is pale wood. */
const TOKENS: Record<TokenFace, string[]> = {
  coin: [
    ...RIM.slice(0, 3), ".klgmmmmgmk.", "klgmgggglgdk", "klgmgwlglgdk",
    "klgmglmglgdk", "klgmgggglgdk", ".kggllllgmk.", ...BASE.slice(1),
  ],
  cash: [...RIM, "klgglllmggdk", "klgglkkdggdk", "klgglkkdggdk", "klggmdddggdk", ...BASE],
  barter: [
    "....KKKK....", "..KKLLLLKK..", ".KLLGGGGGMK.", ".KLGaGGGGMK.",
    "KLGaaaaaaGDK", "KLGGaGGGGGDK", "KLGGGGGaGGDK", "KLGaaaaaaGDK",
    ".KGGGGGaGMK.", ".KMGGGGGMDK.", "..KKDDDDKK..", "....KKKK....",
  ],
};
const tokenPixels = (face: TokenFace) => TOKENS[face];
/** Over a street game: a bone-white die where the game is thrown, an Ur rosette where it is raced. */
const GAME_TOKENS = {
  knucklebones: [
    ".kkkkkkkkkk.", "kwLLLLLLLLGk", "kLkkLLLLkkGk", "kLkkLLLLkkGk", "kLLLLLLLLLGk", "kLLLLkkLLLGk",
    "kLLLLkkLLLGk", "kLLLLLLLLLGk", "kLkkLLLLkkGk", "kLkkLLLLkkGk", "kGGGGGGGGGMk", ".kkkkkkkkkk.",
  ],
  ur: [
    "kkkkkkkkkkkk", "kLLLLbbLLLLk", "kLLLLbbLLLLk", "kLLrLLLLrLLk", "kLLLLrrLLLLk", "kbbLrrrrLbbk",
    "kbbLrrrrLbbk", "kLLLLrrLLLLk", "kLLrLLLLrLLk", "kLLLLbbLLLLk", "kMMMMbbMMMMk", "kkkkkkkkkkkk",
  ],
};
/** Draws a token centred on x, y; `sx` below 1 is the token turned toward
 * its edge, down to a thin bar. */
function paintToken(g: Phaser.GameObjects.Graphics, rows: string[], x: number, y: number, sx: number) {
  const w = rows[0].length, h = rows.length, top = y - h / 2;
  if (sx < 0.2) {
    g.fillStyle(TOKEN_INK.k, 1).fillRect(x - 1, top + 1, 3, h - 2);
    g.fillStyle(TOKEN_INK.d, 1).fillRect(x, top + 2, 1, h - 4);
    return;
  }
  for (let r = 0; r < h; r++)
    for (let c = 0; c < w; c++) {
      const ink = rows[r][c];
      if (ink === ".") continue;
      const left = x + (c - w / 2) * sx;
      g.fillStyle(TOKEN_INK[ink], 1).fillRect(left, top + r, Math.max(1, sx), 1);
    }
}

export class WorldScene extends Phaser.Scene {
  private runtime: Runtime;
  private characters?: WorldCharacters;
  private wading?: WadingEffects;
  private heldSprites = new Map<string, string>();
  private loadWeights = new Map<string, number>();
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
      | "heldItem"
      | "origin"
      | "fatigue"
      | "trust"
      | "pos"
      | "errand"
      | "riding"
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
  private monkeySwing = -1;
  /** One plant per selectable crop cell, so a selected crop can be outlined
   * the way a tree or a person is. */
  private cropImages = new Map<string, Phaser.GameObjects.Image>();
  private pickedRevision = -1;
  private toolEffects?: ToolEffects;
  private burning?: Burning;
  private torchFlame?: TorchFlame;
  private structureDecay?: StructureDecay;
  private combatEffects?: CombatEffects;
  private effectsSpace?: string;
  private cueFx?: CueEffects;
  /** How people show what they make of things. */
  private get cues() {
    return (this.cueFx ??= new CueEffects(this, {
      entityAt: (id) => this.entities.get(id),
      playerPose: (pose) => this.runtime.playPose(pose),
      hit: (who, blocked) => {
        this.combat().personHit(who, blocked);
        const player = this.entities.get("player");
        if (who === "player" && !blocked && player) this.feel.blink(player);
      },
      collided: (who, dx, dy, run) => this.collided(who, dx, dy, run),
      greeting: (who) => {
        const a = this.humanActors.get(who);
        const pose = greetingFor(this.runtime.engine.state.manifest.setting, a?.origin?.sex === "female");
        return twoHanded.has(pose) && (this.heldSprites.has(who) || (this.loadWeights.get(who) ?? 0) > 0) ? "bow" : pose;
      },
    }));
  }
  private babyFx?: BabyEffects;
  private feelFx?: PlayerFeel;
  private get feel() {
    return (this.feelFx ??= new PlayerFeel(this));
  }
  private smokersFx?: Smokers;
  private get smokers() {
    return (this.smokersFx ??= new Smokers(
      this,
      (im, x, y, dx, depth) => this.feel.sneeze(im, x, y, dx, depth),
      (x, y) => this.feel.bleed(x, y, this.printDepth(), 0x8c2a1c),
    ));
  }
  private habits = new Map<string, SmokeForm | null>();
  private rainFx?: RainCovers;
  private covers = new Map<string, { cover?: Cover; tint: number; item?: string }>();
  private coverOf(id: string, age: number) {
    let c = this.covers.get(id);
    if (!c) {
      const { state, world } = this.runtime.engine, seed = state.manifest.seed, pack = world.pack;
      const cover = coverFor(pack.setting, pack.year, random(seed, "rain-cover", id), age < 13);
      const culture = pack.setting?.culture;
      c = { cover, tint: shawlTint(random(seed, "rain-tint", id)), item: cover && coverItem(cover, culture, pack.year) };
      this.covers.set(id, c);
    }
    return c;
  }
  private emberGlow = 0;
  private habitOf(id: string) {
    if (id === "player") return smokingFrom(this.runtime.engine.state.player.inventory, this.runtime.engine.world.pack.setting)?.form;
    let form = this.habits.get(id);
    if (form === undefined) {
      const { state, world } = this.runtime.engine;
      const actor = state.actors.find((a) => a.id === id);
      const seed = state.manifest.seed;
      form = (actor?.kind === "human" && smokingHabit(world.pack.setting, healthPerson(actor), random(seed, "smokes", id), random(seed, "smoke-form", id))) || null;
      this.habits.set(id, form);
    }
    return form ?? undefined;
  }
  /** Animals knocked silly by something thrown: stars go round their heads. */
  private stunned = new Set<string>();
  /** Last drawn pose frame per person, so a footfall fires once per contact. */
  private footfalls = new Map<string, number>();
  /** Facing actually drawn, which chases the real one a step at a time. */
  private turning = new Map<string, { facing: number; until: number; next?: number; started?: number; sign?: number }>();
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
  private treeFinds?: TreeFinds;
  private smallLife?: SmallCreatures;
  private monkeys?: Monkeys;
  private findsDirty = true;
  private treeFindSerial = 0;
  /** Hanging layers drawn over a prop's rigid frame, swayed by the same wind.
   * Kept per entity rather than in windSprites, which only clears on a full
   * rebuild and would hold sprites of objects that have gone. */
  private hangings = new Map<
    string,
    { image: Phaser.GameObjects.Image; phase: number; baseX: number }
  >();
  private ambient = new Map<string, Ambient>();
  private workObjects = new Map<string, { id: string; x: number; y: number; family: string }>();
  private workBeats = new Map<string, string>();
  /** Not drawn: indoors, or waiting on a routine. */
  private indoors = new Set<string>();
  /** Residents in range with no routine yet, nearest first. */
  private pendingRoutines: string[] = [];
  /** A routine was built since the last full pass, so someone is undrawn. */
  private routinesBuilt = false;
  private drawnCrowd = new Set<string>();
  private ambientDrawn = -Infinity;
  private modalOpen = false;
  private playerContact?: Phaser.GameObjects.Ellipse;
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
      /** Lying in a wallow: only its back shows above the mud. */
      sunk: boolean;
      young: boolean;
      /** The one of a feeding herd that keeps its head up. */
      sentinel: boolean;
    }
  >();
  /** Egrets and crows riding on the backs of grazing stock, by the beast's id. */
  private riders = new Map<string, Phaser.GameObjects.Image>();
  private riderArt?: string;
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
  /** Time after which a cock may crow again. */
  private crowAt = 0;
  private jostleSerial = 0;
  private shied = new Map<string, number>();
  private faunaMotion = new FaunaMotion();
  private faunaSeen = new Map<string, number>();
  /** Cast shadows by pose, facing and lighting phase. */
  private faunaShadows = new Map<
    string,
    { key: string; origin: readonly [number, number] }
  >();
  private testFauna: FaunaGroup[] = [];
  private testFaunaSerial = 0;
  private layers: Phaser.GameObjects.GameObject[] = [];
  private snowyCasts = false;
  private breathAt = new Map<string, number>();
  private symptoms = new Map<string, { s: Symptoms; at: number; next: number; sweat: number }>();
  private sickPose = new Map<string, { pose: CharacterPose; from: number; until: number }>();
  private bledAt = 0;
  private frost = 0;
  private rained = false;
  /** Golden-hour rim light: a warm copy of each figure a pixel toward the sun, behind it. */
  private rims = new Map<string, { rim: Phaser.GameObjects.Image; owner: Phaser.GameObjects.Image }>();
  private rainbow?: Phaser.GameObjects.Graphics;
  /** Where fallen leaves lie, for feet to kick through. */
  private leafPiles: { x: number; y: number }[] = [];
  /** Broadleaf trees in the scene, for the season's leaves and petals to fall from. */
  private broadleaves: Phaser.GameObjects.Image[] = [];
  private ground?: Phaser.Tilemaps.TilemapLayer;
  private tilemap?: Phaser.Tilemaps.Tilemap;
  private shadows = new Map<string, Phaser.GameObjects.Image>();
  private ripples: { image: Phaser.GameObjects.Image; phase: number }[] = [];
  private rippleTime = -1;
  private entities = new Map<string, Phaser.GameObjects.Image>();
  /** Where a sleeper's head lies, in world pixels, and how deep to draw it. */
  private pillows = new Map<string, { x: number; y: number; depth: number }>();
  /** The first opaque row of a character frame: the top of the head. */
  private crowns = new Map<string, number>();
  /** The generated room the player is standing in, if their space has one. */
  private caveView?: CaveView;
  private sewerView?: SewerView;
  private shipView?: ShipView;
  /** The view of a fair's or a tomb's area: the kinds walked from area to area. */
  private areaView?: FairView | TombView | PrisonView;
  /** A space that draws and lights itself: a generated room or a cave. */
  private selfLit(space: string) {
    const e = this.runtime.engine;
    return space !== "outside" && (!!e.interiorOf?.(space) || !!e.caveOf?.(space) || !!e.sewerOf?.(space) || !!e.shipOf?.(space) || !!e.areaOf?.(space));
  }
  private roomView?: {
    space: string;
    pixel: PixelRoom;
    /** The room's light, multiplied and added over it and everyone in it, then its own glow. */
    light: Phaser.GameObjects.Image[];
    key: string;
    texture: Phaser.Textures.CanvasTexture;
    image: Phaser.GameObjects.Image;
    litAt: number;
    /** The room's own copy of its pieces, moved and broken as the engine's are. */
    props: Prop[];
    sheet: Phaser.Textures.CanvasTexture;
    cutouts: Map<number, Phaser.GameObjects.Image>;
    /** What the furniture looked like at the last relight. */
    stamp: string;
    wait: number;
  };
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
  private watercraft = new Watercraft(this, frame=>this.texture(frame));
  private fieldSeason?: string;
  private fieldTide = 0;
  /** Hulls under residents out fishing, by resident. */
  private crafts = new Map<string, Watercraft>();
  private fishingGear = new FishingGear(this);
  private craftOf(id: string) {
    if (id === "player") return this.watercraft;
    let craft = this.crafts.get(id);
    if (!craft) this.crafts.set(id, (craft = new Watercraft(this, (frame) => this.texture(frame))));
    return craft;
  }
  private harbor = new HarborLayer(this, frame => this.texture(frame));
  private trains = new TrainLayer(this, (frame) => this.texture(frame));
  private cabs = new CabLayer(this, (frame) => this.texture(frame));
  private vehicleLayer = new VehicleLayer(this, (frame) => this.texture(frame));
  /** Crew in their vehicles: sitting or standing, which way the vehicle
   * faces, and the depth that puts them between its two layers. */
  private mounted = new Map<string, { role: CharacterPose; frame: number; facing: number; depth: number }>();
  private mountedActors = new Map<string, Actor>();
  private courtyardLighting = new CourtyardLighting(this);
  private buildings = new Map<string, Phaser.GameObjects.Image>();
  private buildingAnimations = new Map<string, BuildingAnimation>();
  private voxelLife = new VoxelLife();
  /** Station and tower clocks, whose hands keep the game's hour. */
  private clockHands: { g: Phaser.GameObjects.Graphics; x: number; y: number; r: number; minute: number }[] = [];
  /** Town gates' leaves, shown while the gates are shut for the night. */
  private gateDoors: Phaser.GameObjects.Graphics[] = [];
  private actorTorches = new Map<string, TorchFlame>();
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
  private lamps: {
    pane: Phaser.GameObjects.Image;
    halo?: Phaser.GameObjects.Image;
    /** A room on its own hours; otherwise lit whenever lamps are. */
    lit?: (hour: number) => boolean;
    /** Light thrown out onto the street: from ground-floor windows, a sign, a porch lamp. */
    pools?: Phaser.GameObjects.Image[];
    /** Additive warm pools resting on the ground/doorstep, boosted when wet. */
    ground?: Phaser.GameObjects.Image[];
    /** Strength of the pane, the halo, wash pools and additive ground spill at full dark. */
    glass?: number;
    glow?: number;
    spill?: number;
    groundSpill?: number;
  }[] = [];
  private washKey = "";
  private fires = new Map<string, FireEffect>();
  private streetLights = new Map<string, StreetLight>();
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
  /** The night wash with the lights cut into it, multiplied over the scene. */
  private night?: Phaser.GameObjects.RenderTexture;
  private washTint = 0xffffff;
  private drift?: Drift;
  private mist?: Mist;
  private clouds?: CloudShadows;
  private reflections?: Reflections;
  private reflectedWorld?: WorldModel;
  private life?: AmbientLife;
  private accent?: AmbientLife;
  private weather?: Weather;
  private flies?: Flies;
  private ice?: IceEffects;
  private remainsLife?: RemainsLife;
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
      this.load.json(`${a.key}-index`, a.data);
      // Queued inside preload, so the places already sited arrive drawn.
      this.load.once(
        `filecomplete-json-${a.key}-index`,
        (_key: string, _type: string, json: { frames: object } | object[]) => {
          const pages = Array.isArray(json) ? json : [json.frames];
          pages.forEach((frames, i) => {
            if (!Object.keys(frames).some((f) => sprites.has(f))) return;
            const key = Array.isArray(json) ? `${a.key}@${i}` : a.key;
            const image = Array.isArray(json) ? pageImage(a.key, i) : a.image;
            this.sheetLoading.add(key);
            this.load.atlas(key, image, { frames });
          });
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
    this.input.mouse?.disableContextMenu();
    for (const id of HUNT_ICONS) {
      if (this.textures.exists(id)) continue;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 24;
      drawGarmentIcon(canvas.getContext("2d")!, id, 0, 0);
      this.textures.addCanvas(id, canvas)?.add(id, 0, 0, 0, 24, 24);
    }
    this.useFlora();
    setCropSelector(this, (image, id) => {
      this.makeSelectable(image, id);
      this.cropImages.set(id, image);
      image.once("destroy", () => {
        if (this.cropImages.get(id) === image) this.cropImages.delete(id);
      });
    });
    this.characters = new WorldCharacters(this, this.runtime.engine.state.manifest.seed);
    this.characters.palette = this.runtime.palette();
    this.wading = new WadingEffects(this);
    this.prepareTreeStudySheet();
    this.events.once("shutdown", () => this.wading?.destroy());
    this.events.once("shutdown", () => {
      this.toolEffects?.dispose();
      this.treeFinds?.dispose();
      this.smallLife?.clear();
      this.monkeys?.clear();
      this.findsDirty = true;
      this.combatEffects?.dispose();
      this.combatEffects = undefined;
      this.feelFx?.dispose();
      this.smokersFx?.dispose();
      this.habits.clear();
      this.rainFx?.dispose();
      this.covers.clear();
      this.cueFx?.dispose();
      this.babyFx?.dispose();
      this.babyFx = undefined;
    });
    this.events.once("shutdown", () => this.characters?.destroy());
    this.events.once("destroy", () => this.characters?.destroy());
    this.events.once("shutdown", () => this.releaseDynamicTextures());
    this.fireFrames = animatedFrames(
      this.textures.get("props").getFrameNames(),
    );
    const harborIndex = this.cache.json.get("harbor-index");
    const harborFrames = Array.isArray(harborIndex)
      ? harborIndex.flatMap((page: Record<string, unknown>) => Object.keys(page))
      : Object.keys(harborIndex?.frames ?? {});
    this.motionFrames = motionFrames([
      ...this.textures.get("props").getFrameNames(),
      ...harborFrames,
    ]);
    // Watched rather than queried: the input gate runs on every frame.
    const watchModals = new MutationObserver(() => {
      this.modalOpen = !!document.querySelector('[data-modal="true"], [data-world-input-blocked="true"]');
    });
    watchModals.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-modal", "data-world-input-blocked"],
    });
    this.modalOpen = !!document.querySelector('[data-modal="true"], [data-world-input-blocked="true"]');
    this.events.once("shutdown", () => watchModals.disconnect());
    this.events.once("destroy", () => watchModals.disconnect());
    this.cameras.main.setBackgroundColor("#819253");
    this.applyLiveGraphics(
      this.options.lab ? { roundPixels: true, zoomDuration: 0, tiltShift: false } : {},
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
    this.night = this.washTexture(16, 16);
    this.drift = new Drift(this, () => this.fallingFrom());
    this.mist = new Mist(this);
    this.clouds = new CloudShadows(this);
    this.life = new AmbientLife(this, (kind, x, y) => this.critterGround(kind, x, y));
    this.accent = new AmbientLife(this, (kind, x, y) => this.critterGround(kind, x, y), "accent");
    this.smallLife = new SmallCreatures(this, {
      cell: (x, y) => this.runtime.engine.world.topography?.(x, y),
      player: () => this.entities.get("player"),
      plants: () => this.plantImages,
      seed: () => hashSeed(this.runtime.engine.state.manifest.seed),
    });
    this.monkeys = new Monkeys(this, {
      player: () => this.entities.get("player"),
      people: () =>
        this.runtime.engine.state.actors
          .filter((a) => a.kind === "human" && !a.dead && a.pos.space === "outside")
          .flatMap((a) => this.entities.get(a.id) ?? []),
      plants: () => this.plantImages,
      seed: () => hashSeed(this.runtime.engine.state.manifest.seed),
      steal: () => {
        const e = this.runtime.engine;
        const item = Object.keys(e.state.player.inventory).find(
          (id) => (e.state.player.inventory[id] ?? 0) > 0 && e.item(id)?.edible && e.item(id)?.sprite !== "water",
        );
        if (!item) return undefined;
        this.runtime.command({ type: "snatched", item });
        return itemColors[item]?.[0] ?? "#e8c040";
      },
    });
    this.flies = new Flies(this);
    this.ice = new IceEffects(this);
    this.remainsLife = new RemainsLife(this);
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
      const key = event.key.toLowerCase();
      if (
        ((active instanceof HTMLInputElement && !(walkableBox(active) && key.startsWith("arrow"))) ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        (active instanceof HTMLElement && active.isContentEditable) ||
        this.modalOpen)
      )
        return;
      const steering = DIRECTION_KEYS.includes(key);
      if (steering) {
        event.preventDefault();
        this.heldDirections.add(key);
        if (!event.repeat) this.pendingDirection = this.direction();
        if (!event.repeat) this.cycleTrickKey(key);
      }
      this.shiftHeld = event.shiftKey;
      if (
        (event.code === "ShiftLeft" || event.code === "ShiftRight") &&
        !event.repeat &&
        this.runtime.engine.state.player.riding &&
        (this.heldDirections.size > 0 || performance.now() < this.runtime.rideMovingUntil)
      ) {
        this.runtime.spurMount();
      }
      if (event.code === "Space" && !(active instanceof HTMLButtonElement)) {
        event.preventDefault();
        if (event.repeat || this.spaceDown) return;
        const mount = this.runtime.engine.state.player.riding;
        if (mount) {
          this.spaceDown = true;
          if (this.cycleTrickKey("space")) return;
          if (mount.bucking) {
            this.runtime.command({ type: "interact", action: "calm-mount", target: "mount" });
          } else if (this.heldDirections.size === 0 && performance.now() >= this.runtime.rideMovingUntil) {
            this.runtime.rearMount();
          } else {
            this.jumpRunning = this.runtime.rideGait >= 3 || this.shiftHeld;
            this.queuedJump = "long";
          }
          return;
        }
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
        if (player.held || (player.heldItem && !this.launcher()))
          this.beginAim("throw", "mouse", "keyboard");
      }
      if (event.code === "KeyF" && !event.repeat && this.launcher()) {
        event.preventDefault();
        this.beginAim("bow", "mouse", "keyboard");
      }
      if (event.code === "Escape" && this.aimStarted !== undefined)
        this.cancelAim();
    });
    this.input.keyboard!.on("keyup", (event: KeyboardEvent) => {
      this.shiftHeld = event.shiftKey;
      this.heldDirections.delete(event.key.toLowerCase());
      if (event.code === "KeyX" && this.aimKind === "throw" && this.aimTrigger === "keyboard") this.finishAim();
      if (event.code === "KeyF" && this.aimKind === "bow" && this.aimTrigger === "keyboard") this.finishAim();
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
      this.rowGoal = undefined;
      this.plantDrag = false;
      this.heldDirections.clear();
      this.touchStick = undefined;
      this.shiftHeld = this.spaceDown = false;
      this.jumpStarted = this.queuedJump = undefined;
      this.jumpRunning = false;
      this.runSteps = 0;
      this.pendingDirection = undefined;
      this.cancelAim();
      this.runtime.stop();
    };
    this.game.events.on("blur", clearInput);
    this.events.once("shutdown", () =>
      this.game.events.off("blur", clearInput),
    );
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.options.lab || this.modalOpen || pointer.event?.target !== this.game.canvas) return;
      // With a bow or sling in hand, a click shoots where it points; hold to draw harder.
      if (this.launcher() && !phoneLayout() && (pointer.leftButtonDown() || pointer.rightButtonDown())) {
        this.mouseTarget = this.pointerCell(pointer);
        this.beginAim("bow", "mouse", "mouse");
        return;
      }
      const thrown = this.runtime.engine.state.player.heldItem;
      if (pointer.rightButtonDown() || (!phoneLayout() && (thrown === "throwing-stick" || thrown === "harpoon"))) {
        this.mouseTarget = this.pointerCell(pointer);
        const player = this.runtime.engine.state.player;
        if (player.held || player.heldItem) this.beginAim("throw", "mouse", "mouse");
        return;
      }
      // A second finger means a pinch, not a walk order.
      if (this.pinchSpread() !== undefined) return;
      const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const { x, y } = this.pointerCell(pointer);
      const native = pointer.event as MouseEvent | undefined;
      if (native?.metaKey || native?.ctrlKey) {
        this.runtime.inspectCell(x, y);
        return;
      }
      if (pointer.leftButtonDown()) {
        const engine = this.runtime.engine, player = engine.state.player;
        const mark = this.fieldPrompt?.visible && this.fieldPrompt.getBounds().contains(p.x, p.y);
        const farmer = player.guidingPlough && engine.state.actors.find(a => a.id === player.guidingPlough);
        const v = farmer && farmer.plough && engine.world.vehicle?.(farmer.plough.vehicle);
        if (v && farmer && farmer.plough) {
          const step = farmer.plough.step;
          const end = step < v.rowLength! - 1 ? v.rowLength! - 1 : step === v.rowLength! - 1 ? step + 1 : v.path.length - 1;
          const goal = mark ? end : v.path.findIndex((q, i) => i > step && i <= end && q.x === x && q.y === y);
          if (goal > step) this.rowGoal = { farmer: farmer.id, step: goal };
          return;
        }
        const field = this.runtime.fieldVerb(mark ? undefined : { x, y })?.command;
        if (field) {
          this.runtime.stop(false);
          this.runtime.command(field);
          this.plantDrag = field.action === "sow-strip";
          return;
        }
      }
      // A finger is a blunt pointer and walking is what it is mostly for: on a
      // phone a tap goes where it points instead of opening a panel over the
      // world. The Inspect button and the Around you list still select.
      if (phoneLayout()) {
        this.runtime.select(undefined);
        this.walkFromPointer(x, y);
        return;
      }
      const obs = this.runtime.getSnapshot().observation;
      const actor = obs.actors.find(
        (a) => Math.abs(a.pos.x - x) <= 0.7 && Math.abs(a.pos.y - y) <= 0.7,
      );
      const object = obs.objects.find(
        (o) => Math.abs(o.pos.x - x) <= 0.8 && Math.abs(o.pos.y - y) <= 0.8,
      );
      const place = obs.player.pos.space === "outside"
        ? this.runtime.engine.world.places.find((b) => buildingContains(b, p.x, p.y))
        : undefined;
      if (actor || object || place)
        this.runtime.select((actor || object || place)!.id);
      else {
        this.runtime.select(undefined);
        this.walkFromPointer(x, y);
      }
    });
    this.input.on(
      "pointermove",
      (pointer: Phaser.Input.Pointer, over: unknown[]) => {
        if (this.plantDrag && pointer.isDown && !this.modalOpen && this.pinchSpread() === undefined) {
          const cmd = this.runtime.fieldVerb(this.pointerCell(pointer))?.command;
          if (cmd?.action === "sow-strip") this.runtime.command(cmd);
        }
        if (pointer.event instanceof MouseEvent) {
          this.mouseTarget = this.pointerCell(pointer);
          if (this.aimStarted !== undefined && this.aimInput === "mouse")
            this.aimTarget = this.mouseTarget;
        }
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
      this.plantDrag = false;
      this.pinchStart = undefined;
    };
    this.input.on("pointerup", endPinch);
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      const button = (pointer.event as MouseEvent)?.button;
      if ((button === 2 || button === 0) && this.aimTrigger === "mouse")
        this.finishAim();
    });
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
      this.crafts.forEach((c) => c.dispose());
      this.fishingGear.dispose();
      this.crafts.clear();
      this.harbor.dispose();
      this.trains.dispose();
      this.cabs.dispose();
      this.vehicleLayer.dispose();
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
    if (!w.topography || this.runtime.engine.state.player.pos.space !== "outside")
      return 0;
    const own = surfaceElevation(w.topography, x / 16 - 0.5, y / 16 - 1);
    // Feet on low ground just behind a higher row would sit in the strip that
    // row hides, so they stop at its lip instead of showing on the plateau.
    const row = Math.ceil(y / 16),
      front = w.topography(Math.floor(x / 16), row);
    if (!front || front.ramp || front.height <= own) return own * TERRAIN_RISE;
    return Math.max(own * TERRAIN_RISE, y - (row * 16 - front.height * TERRAIN_RISE));
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
  /** Where on a town wall someone stands: the walk under them if they are up
   * there, or the step of a flight they are on. */
  private wallFooting(id: string) {
    const engine = this.runtime.engine;
    const a = id === "player" ? engine.state.player : this.watchers().get(id);
    const pos = id === "player" ? engine.state.player.pos : a?.pos ?? this.destinations.get(id);
    if (!pos || pos.space !== "outside") return undefined;
    const stair = engine.stairAt(pos.x, pos.y);
    if (stair) return { rise: STAIR_RISE[stair.step], dx: 0, dy: 0 };
    const up = id === "player" ? engine.onWall() : !!a;
    const walk = up ? engine.walkAt(pos.x, pos.y) : undefined;
    if (!walk) return undefined;
    const [dx, dy] = walk.corner ? WALK_CORNER[walk.corner] : [0, 0];
    return { rise: WALK_RISE[walk.kind], dx, dy };
  }
  /** On a roof the player draws over the building, whose depth is its front
   * edge rather than the row they stand on. */
  private roofDepth() {
    const perch = this.runtime.engine.state.player.perch;
    const place = perch?.at && this.runtime.engine.world.place(perch.on);
    return place ? Math.max(0, (place.y + place.h) * 16 - (perch.at!.y * 16 + 16)) : 0;
  }
  private watching?: { frame: number; by: Map<string, Actor> };
  /** The watch, by id, rebuilt once a frame. */
  private watchers() {
    const frame = this.game.loop.frame;
    if (this.watching?.frame !== frame)
      this.watching = {
        frame,
        by: new Map(this.runtime.engine.state.actors.filter((a) => a.watch).map((a) => [a.id, a])),
      };
    return this.watching.by;
  }
  /** A perched player renders on top of whatever they climbed, and anyone on
   * a town wall on its walk. The tile position is unchanged, so collision and
   * pathfinding never see the lift. */
  private perchRise(id: string) {
    const perch = id === "player" ? this.runtime.engine.state.player.perch : undefined;
    if (!perch) return this.wallFooting(id)?.rise ?? 0;
    // The thing's own sprite is the honest height: a firewood stack stands
    // three times a pot. Overlap a couple of pixels so the feet sit in it
    // rather than float above the silhouette.
    if (perch.at && this.runtime.engine.world.place(perch.on)) return this.roofRise(perch.on, perch.at);
    const on = this.entities.get(perch.on);
    if (on) return Math.max(4, Math.round(on.displayHeight) - 3);
    // Up a tree you sit in the fork, not on the canopy.
    const plant = this.plantHeights.get(perch.on);
    return plant ? Math.max(6, Math.round(plant * 0.45)) : perch.rise;
  }
  /** How far above its own cell a roof cell's surface is drawn. A flat roof's
   * rows spread between the top of the sprite and the top of the front wall;
   * a pitched one is sat on at the ridge. */
  private roofRise(id: string, at: { x: number; y: number }) {
    const place = this.runtime.engine.world.place(id)!;
    const { model, y: base } = buildingPlacement(place);
    const m = model as { anchor: number[]; occlusion: number[]; visible?: number[]; height?: number };
    const top = base - m.anchor[1] + (m.visible?.[1] ?? m.occlusion[1]);
    const front = base - (m.height ?? 32);
    const row = at.y - place.y;
    const feet = walkableRoof(place.sprite) && front > top
      ? top + ((row + 0.8) / place.h) * (front - top)
      : top + 6;
    return Math.round(at.y * 16 + 16 - feet);
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
    let trailAt = 0;
    const flight = this.tweens.add({
      targets: im,
      x: ex,
      y: ey,
      duration: arc.duration,
      ease: "Linear",
      onUpdate: (tween: Phaser.Tweens.Tween) => {
        // Sine, not a parabola, flattened on top so a jump hangs at its apex.
        const rise = arc.height * Math.sin(Math.PI * tween.progress) ** 0.7;
        im.y -= rise;
        im.setData("arcLift", rise);
        // Stretch off the ground, square at the apex, squash into the landing.
        const p = tween.progress;
        const shape = p < 0.25 ? p / 0.25 : p > 0.8 ? -(p - 0.8) / 0.2 : 0;
        im.setScale(1 - 0.12 * shape, 1 + 0.16 * shape);
        // A long jump streaks.
        if (isPlayer && arc.height >= 30 && this.time.now >= trailAt && !this.runtime.engine.state.player.riding?.cycle) {
          trailAt = this.time.now + 45;
          this.afterimage(im, 0.22);
        }
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
    if (engine.state.player.perch || !engine.vaultAhead(dx, dy)) return false;
    const ditch = engine.ditchAhead(dx, dy);
    if ((!this.shiftHeld || this.runSteps < 2) && !engine.fenceAhead(dx, dy) && !ditch) return false;
    const before = { ...engine.state.player.pos };
    // A standing jump lands on the far bank; a running one would overshoot it.
    const cleared = this.runtime.jump(dx, dy, "short", !ditch || this.shiftHeld);
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
  private targetImage?: Phaser.GameObjects.Image;
  private targetShown = false;
  private walkGoal?: number;
  private missedWalk?: { x: number; y: number; at: number; space: string };
  private walkFromPointer(x: number, y: number) {
    const reached = this.runtime.walkTo({ x, y });
    this.walkGoal = reached ? this.time.now : undefined;
    this.missedWalk = reached ? undefined : { x, y, at: this.time.now, space: this.runtime.engine.state.player.pos.space };
  }
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
      // Brush and crops cover green country; marked bare-handed, every step
      // lands on one and the marker stops meaning anything.
      const tool = engine.heldTool();
      const blade = tool === "scythe" || tool === "axe";
      const worth =
        !p.perch &&
        (alternate?.kind === "pickup" ||
          (alternate?.kind === "climb" && !p.perch) ||
          (primary?.kind === "strike" && !!primary.command) ||
          primary?.kind === "talk" ||
          primary?.kind === "door" ||
          ["rock", "trunk", "tree", "pottery", "timber"].includes(hit) ||
          (blade && ["brush", "fiber", "crop"].includes(hit)));
      const id =
        primary?.kind === "talk"
          ? primary.actor
          : alternate?.kind === "pickup"
            ? alternate.command?.target
            : primary?.kind === "strike"
              ? primary.command?.target
              : undefined;
      const on = (o: { pos: { x: number; y: number; space?: string } }) =>
        o.pos.x === cell.x && o.pos.y === cell.y && o.pos.space === p.pos.space;
      const animal = engine.state.actors.find((a) => a.kind !== "human" && !a.dead && on(a));
      const crop = engine.state.objects.find((o) => o.kind === "crop" && !o.depleted && on(o));
      const image =
        worth && id
          ? (this.entities.get(id) ?? this.cropImages.get(id))
          : animal
            ? this.entities.get(animal.id)
            : crop && this.cropImages.get(crop.id);
      this.targetImage = image?.active ? image : undefined;
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
    // Only once the player stands: walking, it would chase every tile.
    const still = this.gaits.get("player")?.still;
    const settled = still !== undefined && time - still > 250;
    this.targetShown = settled;
    // A clicked walk marks where it ends until the player arrives.
    const route = this.runtime.route;
    if (!route.length) this.walkGoal = undefined;
    const end = this.walkGoal !== undefined ? route[route.length - 1] : undefined;
    if (this.missedWalk && (time - this.missedWalk.at > 480 || this.missedWalk.space !== engine.state.player.pos.space)) this.missedWalk = undefined;
    const at = this.missedWalk ?? (end
      ? { ...end, at: this.walkGoal! }
      : settled && !this.targetImage && time >= this.nextInput - 40
        ? this.targetCell
        : undefined);
    if (!at) return;
    const cx = at.x * 16 + 8,
      cy = at.y * 16 + 8 - this.lift(at.x * 16 + 8, at.y * 16 + 16);
    // Snaps in from wide when it first lands on a cell, then breathes.
    const settle = Math.min(1, (time - at.at) / 140);
    const r = 9 + (1 - settle) * 5 + Math.sin(time / 180) * 0.8;
    const miss = this.missedWalk ? Math.min(1, (time - at.at) / 160) : 0;
    const arm = 3;
    mark.setDepth(cy + 8 + 4050).setAlpha(this.missedWalk ? 1 - Math.max(0, time - at.at - 300) / 180 : 0.35 + 0.55 * settle);
    for (const [color, w] of [
      [0x1a1410, 3],
      [this.missedWalk ? 0xffab83 : 0xfff4d0, 1],
    ] as const) {
      mark.lineStyle(w, color, 1);
      for (const [sx, sy] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]) {
        const x = cx + sx * r * (1 - miss),
          y = cy + sy * r * 0.8 * (1 - miss);
        mark.beginPath();
        mark.moveTo(x - sx * arm, y - sy * arm * miss);
        mark.lineTo(x, y);
        mark.lineTo(x - sx * arm * miss, y - sy * arm);
        mark.strokePath();
      }
    }
  }
  /** Takes the camera off the player to someone the plot names, or, with no
   * one, gives it back. Only the people in sight are drawn, so anyone else
   * leaves the camera on the player. */
  lookAt(id?: string): void {
    const c = this.cameras?.main;
    const player = this.entities.get("player");
    if (!c || !player) return;
    const ms = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1;
    if (!id) {
      c.pan(player.x, player.y, 650 * ms, "Sine.easeInOut", true, (_c, t) => {
        if (t === 1) c.startFollow(player, this.liveGraphics.roundPixels, this.liveGraphics.followLerp, this.liveGraphics.followLerp);
      });
      return;
    }
    const im = this.entities.get(id);
    if (!im?.visible) return this.lookAt();
    c.stopFollow();
    c.pan(im.x, im.y - 12, 900 * ms, "Sine.easeInOut", true);
  }
  /** Both speakers in view, held above the conversation board along the foot of the screen. */
  frameConversation(id: string): void {
    const c = this.cameras?.main;
    const player = this.entities.get("player");
    const im = this.entities.get(id);
    if (!c || !player || !im?.visible) return;
    const ms = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1;
    c.stopFollow();
    c.pan((player.x + im.x) / 2, (player.y + im.y) / 2 + (c.height * 0.16) / c.zoom, 700 * ms, "Sine.easeInOut", true);
  }
  private castMarks?: Phaser.GameObjects.Graphics;
  private castState?: Runtime["engine"]["state"];
  private castRevision = -1;
  private castPeople = new Map<string, "plot" | "kin">();
  private castMarkKey = "";
  private familyPeople: ReturnType<typeof kinOf> = [];
  private relationshipLabels = new Map<string, string>();
  private familyLabels = new Map<string, Phaser.GameObjects.Text>();
  /** A small diamond over the people who matter to this life. */
  private drawCastMarks(time: number) {
    const s = this.runtime.engine.state;
    if (s !== this.castState || s.revision !== this.castRevision) {
      this.castState = s;
      this.castRevision = s.revision;
      this.castPeople.clear();
      if (s.plot && !s.plot.ended)
        for (const id of Object.values(s.plot.cast)) if (plotRoleKnown(s.plot, id)) this.castPeople.set(id, "plot");
      this.familyPeople = kinOf(s);
      this.relationshipLabels = socialLabels(s);
      for (const k of this.familyPeople)
        if (!this.castPeople.has(k.actor.id)) this.castPeople.set(k.actor.id, "kin");
    }
    for (const label of this.familyLabels.values()) label.setVisible(false);
    const words = new Map(this.relationshipLabels);
    for (const { actor, kind } of this.familyPeople) {
      const im = this.entities.get(actor.id);
      if (!im?.visible) continue;
      const sex = sexOf(actor);
      const word = kind === "partner" ? sex === "female" ? "WIFE" : sex === "male" ? "HUSBAND" : "PARTNER"
        : kind === "parent" ? sex === "female" ? "MOTHER" : sex === "male" ? "FATHER" : "PARENT"
        : kind === "child" ? sex === "female" ? "DAUGHTER" : sex === "male" ? "SON" : "CHILD"
        : sex === "female" ? "SISTER" : sex === "male" ? "BROTHER" : "SIBLING";
      words.set(actor.id, word);
    }
    const player = this.entities.get("player");
    let nearest: string | undefined, best = 40 ** 2;
    for (const id of words.keys()) {
      const im = this.entities.get(id);
      if (!im?.visible || !player) continue;
      const d = (im.x - player.x) ** 2 + (im.y - player.y) ** 2;
      if (d < best) { best = d; nearest = id; }
    }
    const shown = [nearest, this.hoverId, this.runtime.engine.conversing]
      .filter((id, i, all): id is string => !!id && words.has(id) && all.indexOf(id) === i && !!this.entities.get(id)?.visible)
      .sort((a, b) => this.entities.get(b)!.y - this.entities.get(a)!.y);
    const placed: { l: number; r: number; t: number; b: number }[] = [];
    for (const id of shown) {
      const im = this.entities.get(id)!;
      let label = this.familyLabels.get(id);
      if (!label || !label.scene) {
        label = this.add.text(0, 0, "", { fontFamily: 'Silkscreen, monospace', fontSize: "8px", color: "#ffe0bd", stroke: "#1a1410", strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(1e7);
        this.familyLabels.set(id, label);
      }
      label.setText(`YOUR ${words.get(id)}`);
      const x = Math.round(im.x), w = label.width / 2, h = label.height;
      let y = this.headTop(im) - 7;
      // Front people keep their place; anyone behind steps up above them.
      for (let hit = true; hit; ) {
        hit = false;
        for (const p of placed)
          if (x - w < p.r && x + w > p.l && y - h < p.b && y > p.t) { y = p.t; hit = true; }
      }
      placed.push({ l: x - w, r: x + w, t: y - h, b: y });
      label.setPosition(x, y).setVisible(true);
    }
    const bob = Math.round(Math.sin(time / 420));
    let key = "";
    for (const [id, mark] of this.castPeople) {
      const im = this.entities.get(id);
      if (im?.visible) key += `${id}:${mark}:${Math.round(im.x)},${this.headTop(im) + bob}|`;
    }
    if (this.castMarks && key === this.castMarkKey) return;
    this.castMarkKey = key;
    const g = (this.castMarks ??= this.add.graphics());
    g.clear().setDepth(1e7 - 1);
    for (const [id, mark] of this.castPeople) {
      const im = this.entities.get(id);
      if (!im?.visible) continue;
      const x = Math.round(im.x), y = this.headTop(im) - 3 + bob;
      g.fillStyle(0x1a1410, 0.9).fillPoints([{ x, y: y - 4 }, { x: x + 4, y }, { x, y: y + 4 }, { x: x - 4, y }], true);
      g.fillStyle(mark === "kin" ? 0xd9523f : 0xf2cf6b, 1).fillPoints([{ x, y: y - 3 }, { x: x + 3, y }, { x, y: y + 3 }, { x: x - 3, y }], true);
    }
  }
  private fightBars?: Phaser.GameObjects.Graphics;
  /** Health over everyone in a fight, the player included, while it lasts. */
  private drawFightBars() {
    const e = this.runtime.engine, g = (this.fightBars ??= this.add.graphics().setDepth(1e7 - 2));
    g.clear();
    if (!e.fighting()) return;
    const p = e.state.player;
    const people = [{ id: "player", health: p.health ?? 100 }, ...e.state.actors
      .filter((a) => a.terror?.fight && a.pos.space === p.pos.space)
      .map((a) => ({ id: a.id, health: a.health ?? 100 }))];
    for (const { id, health } of people) {
      const im = this.entities.get(id);
      if (!im?.visible) continue;
      const x = Math.round(im.x) - 8, y = this.headTop(im) - 6, w = Math.round((16 * Math.max(0, health)) / 100);
      g.fillStyle(0x1a1410, 0.9).fillRect(x - 1, y - 1, 18, 4);
      g.fillStyle(health > 50 ? 0x6fbf4a : health > 25 ? 0xe0b040 : 0xd9523f, 1).fillRect(x, y, w, 2);
    }
  }
  /** The top of the head as drawn: the frame is taller than the body, and a sleeper is only a head on the pillow. */
  private headTop(im: Phaser.GameObjects.Image): number {
    if (im.angle) return Math.round(im.y - HEAD_ROWS / 2);
    return Math.round(im.y - (im.height - this.crownOf(im.texture.key)) * im.scaleY);
  }
  private guideMark?: Phaser.GameObjects.Graphics;
  private guideAt?: { x: number; y: number };
  private guideChecked = 0;
  /** A bobbing arrow over where the guide points, or at the edge of the
   * view, aimed at it, while it is out of sight. */
  private drawGuide(time: number) {
    if (time - this.guideChecked > 200) {
      this.guideChecked = time;
      const g = this.preview && (!this.preview.id || !this.selectedImage()?.visible) ? this.preview : this.runtime.guideTarget();
      this.guideAt = g && g.pos.space === this.runtime.engine.state.player.pos.space ? g.pos : undefined;
    }
    const mark = (this.guideMark ??= this.add.graphics());
    mark.clear();
    const at = this.guideAt;
    if (!at) return;
    const still = (this.reducedMotion ??= matchMedia("(prefers-reduced-motion: reduce)")).matches;
    const view = this.cameras.main.worldView;
    const tx = at.x * 16 + 8,
      ty = at.y * 16 + 8 - this.lift(at.x * 16 + 8, at.y * 16 + 16);
    const pad = 18;
    const inView = tx > view.left + pad && tx < view.right - pad && ty > view.top + pad && ty < view.bottom - pad;
    const gold = 0xf2cf6b,
      ink = 0x1a1410;
    mark.setDepth(1e7);
    if (inView) {
      const pulse = still ? 0.35 : (time % 1400) / 1400;
      mark.lineStyle(1.5, gold, 0.9 * (1 - pulse));
      mark.strokeEllipse(tx, ty + 5, 10 + pulse * 14, 5 + pulse * 7);
      // A little hop with a hang at the top, like a quest marker.
      const bob = still ? 0 : Math.abs(Math.sin(time / 260)) * 5;
      const y = ty - 22 - bob;
      mark.fillStyle(ink, 1).fillTriangle(tx - 7, y - 6, tx + 7, y - 6, tx, y + 4);
      mark.fillStyle(gold, 1).fillTriangle(tx - 5, y - 5, tx + 5, y - 5, tx, y + 2);
      mark.fillStyle(0xfff4d0, 1).fillRect(tx - 3, y - 5, 2, 2);
      return;
    }
    const cx = view.centerX,
      cy = view.centerY;
    const a = Math.atan2(ty - cy, tx - cx);
    const k = Math.min(
      (view.width / 2 - pad) / Math.abs(Math.cos(a) || 1e-6),
      (view.height / 2 - pad) / Math.abs(Math.sin(a) || 1e-6),
    );
    const nudge = still ? 0 : Math.sin(time / 220) * 2;
    const ex = cx + Math.cos(a) * (k + nudge),
      ey = cy + Math.sin(a) * (k + nudge);
    const tip = (d: number, r: number) => [ex + Math.cos(a + r) * d, ey + Math.sin(a + r) * d] as const;
    mark.fillStyle(ink, 0.55).fillCircle(ex, ey, 9);
    mark.lineStyle(1.5, gold, 1).strokeCircle(ex, ey, 9);
    const [ax, ay] = tip(6, 0),
      [bx, by] = tip(5, 2.4),
      [dx, dy] = tip(5, -2.4);
    mark.fillStyle(gold, 1).fillTriangle(ax, ay, bx, by, dx, dy);
  }
  private traderMark?: Phaser.GameObjects.Graphics;
  private traders: { id: string; door?: { x: number; y: number } }[] = [];
  private tradersChecked = 0;
  /** A coin over everyone nearby who will sell, or over the door they sell
   * behind; two arrows instead where nobody pays in coin. */
  private drawTraders(time: number) {
    const engine = this.runtime.engine;
    if (time - this.tradersChecked > 600) {
      this.tradersChecked = time;
      const p = engine.state.player.pos;
      this.traders = engine.traders()
        .filter((t) => Math.abs(t.at.x - p.x) + Math.abs(t.at.y - p.y) < 24 &&
          (t.actor.pos.space === p.space || (!!t.door && (p.space ?? "outside") === "outside")))
        .map((t) => ({ id: t.actor.id, door: t.actor.pos.space === p.space ? undefined : t.at, house: t.actor.householdId ?? t.actor.id, keeps: keepsShop(engine.world.pack, t.actor) }))
        // A shop reads as one seller, not a family each with a coin: one per household, two indoors at most.
        .sort((a, b) => Number(b.keeps) - Number(a.keeps))
        .filter((t, i, all) => all.findIndex((o) => o.house === t.house) === i)
        .slice(0, (p.space ?? "outside") === "outside" ? undefined : 2);
    }
    const mark = (this.traderMark ??= this.add.graphics());
    mark.clear().setDepth(1e7 - 1);
    const setting = engine.world.pack.setting;
    // Cast cash with a square hole in East Asia until modern coinage.
    const face: TokenFace = !engine.coined() ? "barter"
      : (setting?.culture === "east-asian" || setting?.culture === "southeast-asian") && engine.world.pack.year >= -300 && engine.world.pack.year < 1900 ? "cash" : "coin";
    for (const t of this.traders) {
      let x: number, y: number;
      const bob = Math.abs(Math.sin(time / 420 + (t.door?.x ?? 0))) * 2;
      if (t.door) {
        x = t.door.x * 16 + 8;
        y = t.door.y * 16 - 36 - this.lift(x, t.door.y * 16 + 16) - bob;
      } else {
        const image = this.entities.get(t.id);
        if (!image?.visible) continue;
        x = image.x;
        y = this.headTop(image) - (this.castPeople.has(t.id) ? 15 : 8) - bob;
      }
      const seed = t.id.length * 7 + (t.door?.x ?? 0);
      // Now and then the coin turns over once on its edge.
      const turn = ((time / 1000 + seed * 0.37) % 5) / 0.7;
      const sx = turn < 1 ? Math.abs(Math.cos(turn * Math.PI)) : 1;
      paintToken(mark, tokenPixels(face), Math.round(x), Math.round(y), sx);
      // A glint off the rim, a few times a minute.
      const glint = ((time / 1000 + seed * 0.61) % 3.2) / 0.36;
      if (glint < 1 && sx === 1) {
        const r = glint < 0.5 ? 1 : glint < 0.8 ? 2 : 1, gx = Math.round(x) + 4, gy = Math.round(y) - 5;
        mark.fillStyle(0xfffbe8, 1).fillRect(gx, gy - r, 1, 2 * r + 1).fillRect(gx - r, gy, 2 * r + 1, 1);
      }
    }
  }
  private gameMark?: Phaser.GameObjects.Graphics;
  private boards?: Phaser.GameObjects.Graphics;
  private games: ReturnType<WorldScene["runtime"]["engine"]["gameCircles"]> = [];
  private gamesChecked = 0;
  /** A token bobbing over each street game nearby, and the board or bones on the ground between the players. */
  private drawGames(time: number) {
    const engine = this.runtime.engine, p = engine.state.player.pos;
    if (time - this.gamesChecked > 500) {
      this.gamesChecked = time;
      this.games = p.space === "outside" ? engine.gameCircles().filter((c) => Math.abs(c.at.x - p.x) + Math.abs(c.at.y - p.y) < 24) : [];
    }
    const mark = (this.gameMark ??= this.add.graphics()).clear().setDepth(1e7 - 1);
    const boards = (this.boards ??= this.add.graphics()).clear();
    for (const c of this.games) {
      const seated = c.players.filter((a) => a.pos.x === a.errand?.to.x && a.pos.y === a.errand.to.y);
      if (seated.length < 2) continue;
      const x = c.at.x * 16 + 8, y = c.at.y * 16 + 12 - this.lift(c.at.x * 16 + 8, c.at.y * 16 + 16);
      boards.setDepth(c.at.y * 16 + 4);
      if (c.game.engine === "ur") {
        // The twenty squares in their two blocks and bridge, a pixel a square.
        boards.fillStyle(0x2a1d14, 1).fillRect(x - 9, y - 3, 18, 7);
        for (let col = 0; col < 8; col++)
          for (let row = 0; row < 3; row++)
            if (row === 1 || col < 4 || col > 5) boards.fillStyle((col + row) % 3 ? 0xf2e6c8 : 0x3d5aa6, 1).fillRect(x - 8 + col * 2, y - 2 + row * 2, 1, 1);
      } else {
        boards.fillStyle(0x5a3a22, 0.45).fillEllipse(x, y, 16, 6);
        for (const [dx, dy] of [[-4, -1], [-1, 1], [2, -1], [4, 1]]) boards.fillStyle(0xf6efda, 1).fillRect(x + dx, y + dy, 2, 1);
      }
      const bob = Math.abs(Math.sin(time / 420 + c.at.x)) * 2;
      const head = seated.map((a) => this.entities.get(a.id)).filter((im) => im?.visible).map((im) => this.headTop(im!));
      if (!head.length) continue;
      paintToken(mark, GAME_TOKENS[c.game.engine], Math.round(x), Math.round(Math.min(...head) - 10 - bob), 1);
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
    if (this.runtime.engine.iceUnder(cell.x, cell.y, cell.space) !== undefined) return iceSound.step(running);
    const ground = this.underfoot(cell, puddle);
    const engine = this.runtime.engine;
    if (cell.space !== "outside") {
      const layout = engine.interiorOf(cell.space),
        room = roomAt(layout, cell.x, cell.y),
        floor = (room && layout!.plan.rooms[layout!.rooms.indexOf(room)])?.floorPattern ?? layout?.params.floorPattern;
      if (floor)
        return footstep(
          floor === "earth" ? "soil"
          : floor === "sand" ? "sand"
          : floor === "flag" || floor === "tile" || floor === "terrazzo" ? "stone"
          : floor === "plank" || floor === "parquet" ? "timber"
          : "fiber",
          running,
        );
      // Underground there is only rock to walk on.
      return footstep(ground, running) ?? footstep("rock", running);
    }
    if (ground === "snow") return footstep(ground, running);
    if (engine.world.terrain(cell.x, cell.y, cell.space) === "rock") return footstep("rock", running);
    const field = engine.world.topography?.(cell.x, cell.y)?.field;
    const { hit } = engine.hitClass(cell.x, cell.y, cell.space);
    // Grass tufts stay silent: they cover every meadow.
    const through =
      this.dungUnderfoot(cell) ??
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
    const sprite = engine.world.decoration(cell.x, cell.y)?.sprite;
    if (sprite !== "nature-understory-fungi") return undefined;
    const id = engine.plantSpecies(sprite, cell.x, cell.y)?.id;
    return id ? (fungusSteps[id] ?? "squish") : undefined;
  }
  /** What dung a foot comes down in, by kind and how far it has dried. */
  private dungUnderfoot(cell: { x: number; y: number }): DungStep | FungusStep | undefined {
    const { objects, clock } = this.runtime.engine.state;
    const dung = objects.find(
      (o) => o.dung && !o.carriedBy && o.pos.space === "outside" && o.pos.x === cell.x && o.pos.y === cell.y,
    );
    if (!dung) return undefined;
    const hours = (clock - (dung.laid ?? clock)) / 3600;
    if (dung.dung === "pellets") return "pellets";
    if (dung.dung === "droppings") return "squish";
    if (hours >= DUNG_DRY_HOURS) return "crumble";
    if (dung.dung === "pile") return "squelch";
    return hours >= DUNG_FRESH_HOURS ? "crust" : "splat";
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
  /** Walked into a midden: down in it, a splat, and muck thrown up. */
  private fellInMuck(dx: number, dy: number, time: number) {
    this.runSteps = 0;
    this.lastRunDir = undefined;
    this.nextInput = time + 700;
    this.play({ pose: "stumble", ms: 85, first: 0, last: 3 }, 600);
    const im = this.entities.get("player");
    if (im) this.feel.puff(im.x + dx * 8, im.y + dy * 4, [0x33251a, 0x5a4430, 0x846848], 8, 1);
    void gameAudio()?.sound([...landing("marsh", 1.3), ...(footstep("soil", true, "splat") ?? [])], "step");
  }
  /** What the engine said the last step did on frozen water. */
  private onIce(impact: "slide" | "slip" | "creak" | "plunge", time: number) {
    const im = this.entities.get("player"), audio = gameAudio();
    this.runSteps = 0;
    this.lastRunDir = undefined;
    if (impact === "creak") {
      void audio?.sound(iceSound.creak(), "step");
      this.nextInput = time + this.motionDuration + 260;
      return;
    }
    if (impact === "plunge") {
      void audio?.sound(iceSound.plunge(), "step");
      this.cameras.main.shake(140, 0.004);
      if (im) this.feel.puff(im.x, im.y - 2, [0xffffff, 0xc4f1f9, 0x58a3df], 14, 1.5);
      return;
    }
    const fell = impact === "slip";
    this.nextInput = time + this.motionDuration + (fell ? 760 : 200);
    this.time.delayedCall(this.motionDuration * 0.6, () => {
      const last = this.runtime.engine.state.player.pos;
      void audio?.sound(fell ? [...iceSound.slide(), ...landing("stone", 1.7).map((l) => ({ ...l, at: l.at + 0.16 }))] : iceSound.slide(), "step");
      this.play(
        fell
          ? { pose: "skid", ms: 35, first: 0, last: 3, then: { pose: "stumble", ms: 85, first: 0, last: 3, for: 560 } }
          : { pose: "skid", ms: 45, first: 0, last: 3 },
        fell ? 300 : 180,
      );
      if (im) {
        this.feel.puff(im.x, im.y, [0xffffff, 0xe4f5f8, 0xc4f1f9], fell ? 9 : 5, 0.9);
        const way = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]][this.runtime.engine.state.player.facing ?? 4];
        for (const side of [-3, 3]) this.ice?.scratch(last.x * 16 + 8 + side, last.y * 16 + 13, way[0], way[1], time);
        if (fell) this.cameras.main.shake(90, 0.0025);
      }
    });
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
  /** The wound-up swing turns the body through the circle, the wind-up
   * coils for it, and a jump with F in it comes down overhead. */
  private swingMotion(
    action: Runtime["characterAction"],
    elapsed: number,
    human: Parameters<WorldCharacters["frame"]>[0],
    held: string | undefined,
    condition: number,
  ): { pose: CharacterPose; index: number; facing?: number } | undefined {
    const charge = this.runtime.charge;
    if (charge && !this.runtime.chargeSwung) {
      const since = performance.now() - charge.at;
      // A tap is a plain swing; a spear winds up its own way.
      if (since < 110 || (action && THRUSTS.has(action.pose))) return undefined;
      // Draw the circle while the player is still winding, so the spin does
      // not wait on the workers for its first turn.
      if (this.spinWarmed !== charge.at) {
        this.spinWarmed = charge.at;
        for (let f = 0; f < 8; f++)
          for (const frame of [1, 2, 3, 4])
            this.characters?.frame({ ...human, id: "player~spin", facing: f }, "spin", frame, held, 0, condition);
      }
      // Drawn back over two beats, then held, the tip flashing once full.
      if (since < 170) return { pose: "swing", index: 0 };
      return { pose: "spin", index: since >= charge.full && Math.floor(since / 110) % 2 ? 4 : 0 };
    }
    if (!action) return undefined;
    if (action.pose === "jump" && action.plunge && action.arc && elapsed < action.arc.duration)
      return { pose: "plunge", index: elapsed < action.arc.duration * 0.45 ? 0 : 1 };
    const power = this.runtime.swingEffect?.power ?? 0;
    if (action.pose !== "spin" || !power) return undefined;
    const steps = power === 2 ? 8 : 4;
    const k = Math.floor(elapsed / SPIN_STEP_MS);
    if (k > steps + 2) return undefined;
    const start = (this.runtime.swingEffect?.facing ?? 0) * 2 - (power === 2 ? 0 : 2);
    const facing = (start + Math.min(k, steps) + 8) % 8;
    return { pose: "spin", index: k === 0 ? 1 : k < steps ? 2 : 3, facing };
  }
  private spinWarmed = 0;
  /** A pale copy of the figure left where it just was, fading. */
  private afterimage(im: Phaser.GameObjects.Image, alpha = 0.45) {
    const ghost = this.add
      .image(im.x, im.y, im.texture.key, im.frame.name)
      .setOrigin(im.originX, im.originY)
      .setDepth(im.depth - 1)
      .setTintFill(0xfff4c8)
      .setAlpha(alpha);
    this.tweens.add({
      targets: ghost,
      alpha: 0,
      duration: 160,
      onComplete: () => ghost.destroy(),
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
    selectOnPhone = false,
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
        if (this.modalOpen || pointer.event?.target !== this.game.canvas || pointer.rightButtonDown()) return;
        // Ordinary taps walk. Exhibit taps open the source card.
        if (phoneLayout() && !selectOnPhone) return;
        event.stopPropagation();
        const clickedFauna = this.runtime.engine.state.fauna?.find((g) => g.id === id);
        if (clickedFauna && (clickedFauna.speciesId === "horse" || clickedFauna.speciesId === "wild-horse" || clickedFauna.speciesId === "pony")) {
          void gameAudio()?.sound(mountVoice("horse", "rear"), "mount");
          this.feel.spring(image, 1.08, 0.94, 160);
        }
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
    const action = seen.affordances.find(a => a.enabled && a.command.type === "interact" &&
      !["strike", "topple", "follow", "climb"].includes(a.command.action));
    tip.textContent = action ? `${seen.name} · ${action.label}` : seen.name;
    tip.classList.toggle("has-source", !!(seen.source || seen.exhibits));
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
  preview?: { id?: string; pos: Position };
  private reducedMotion?: MediaQueryList;
  private selectedImage() {
    const id = this.preview?.id ?? this.runtime.selected;
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
    const selected = this.selectedImage();
    const still = (this.reducedMotion ??= matchMedia("(prefers-reduced-motion: reduce)")).matches;
    this.drawGlow(this.glowSprites, selected, 0xffd9a0, still ? 1 : 0.78 + 0.22 * Math.sin(time / 420));
    // The thing F or E would act on, fainter than a selection and never both.
    const aimed = this.targetShown && this.targetImage !== selected ? this.targetImage : undefined;
    this.drawGlow(this.targetGlow, aimed, 0xfff4d0, still ? 0.5 : 0.4 + 0.1 * Math.sin(time / 300));
  }
  private targetGlow: Phaser.GameObjects.Image[] = [];
  private drawGlow(
    sprites: Phaser.GameObjects.Image[],
    target: Phaser.GameObjects.Image | undefined,
    tint: number,
    pulse: number,
  ) {
    if (!target || !target.visible) {
      for (const g of sprites) g.setVisible(false);
      return;
    }
    GLOW_RING.forEach((offset, i) => {
      let g = sprites[i];
      if (!g) {
        g = this.add.image(0, 0, target.texture.key, target.frame.name);
        g.setBlendMode(Phaser.BlendModes.ADD);
        sprites[i] = g;
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
        .setTint(tint)
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
    const { door: rect, doorLeaf } = placement.model as typeof placement.model & {
      door?: number[];
      doorLeaf?: boolean;
    };
    // Tents and huts hang a curtain or flap: there is no leaf to swing.
    if (!rect || doorLeaf === false) return;
    const image = this.add
      .image(
        placement.x - placement.model.anchor[0] + rect[0],
        baseY - placement.model.anchor[1] + rect[1],
        this.texture("door-leaf-1"),
        "door-leaf-1",
      )
      .setOrigin(0, 0)
      // Front-on buildings publish doors larger than the shared leaf.
      .setDisplaySize(rect[2], rect[3])
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
  /** Where someone in a vehicle is drawn: their crew place in it, turned
   * with it, in tile units as the ambient crowd is placed. */
  private mountAt(a: Actor, clock: number, player = false): Ambient | undefined {
    const e = this.runtime.engine, v = a.mount && e.world.vehicle?.(a.mount.vehicle);
    if (!v || !a.mount) return undefined;
    if (v.delivery) {
      const motor=this.entities.get(v.id)?.getData("motor") as WorldObject["motor"];
      if(motor?.taken || a.pos.space!=="outside")return;
      const at=deliveryAt(v,clock-(motor?.delay??0));
      if(!at.cab && !at.inOffice)return {x:at.x,y:at.y,activity:"visit",label:a.activity,moving:at.walking,direction:a.direction};
      return;
    }
    const p = e.state.player, step = a.plough && ploughStep(a.plough, clock);
    const t = e.cartClock(v.id, clock), pose = vehiclePose(v, t, step);
    const place = crewPlace(v, pose, a.mount.place);
    if (!place) return undefined;
    const at = vehicleAt(v, t, step), walking = at.moving && !(p.drivingCart?.vehicle === v.id && p.drivingCart.haltedAt !== undefined);
    const beside = !player && a.mount.place === 0 && (p.guidingPlough === a.id || p.drivingCart?.vehicle === v.id);
    const helper = beside && besideTeam(at);
    const x = helper ? helper.x * 16 + 8 : place.x;
    const y = helper ? helper.y * 16 + 16 : place.y;
    const role = beside ? (walking ? "walk" : "idle") : place.role;
    this.mounted.set(player ? "player" : a.id, { role, frame: crewFrame(role, at.along, at.moving), facing: pose.facing, depth: beside ? y : place.depth });
    return { x: (x - 8) / 16, y: (y - 16) / 16, activity: "visit", label: v.doing, moving: walking, direction: Math.round(pose.facing / 2) % 4 };
  }
  /** Sitting down: on a prop, drawn on it facing out, in front of it; with
   * nothing under them, on the ground where they stand. */
  private seatPlayer(im: Phaser.GameObjects.Image, time: number) {
    const p = this.runtime.engine.state.player, seated = p.seated;
    const on = seated?.on ? this.entities.get(seated.on) : undefined;
    if (!seated || (seated.on && !on)) return false;
    // Blink like anyone sitting still.
    const frame = time % 4200 < 140 ? 3 : 0;
    if (!on) {
      this.mounted.set("player", { role: seated.pose, frame, facing: p.facing ?? facingFromDirection(p.direction), depth: im.y });
      return true;
    }
    const privy = PRIVY_DOOR.test(on.frame.name);
    im.setPosition(on.x, on.y + (privy ? -2 : 1));
    this.mounted.set("player", { role: seated.pose, frame, facing: facingFromDirection(2), depth: on.depth + 0.5 });
    return true;
  }
  private lastRideSerial = 0;
  private cycle = new CycleRider(this);
  private cycleAir = false;
  private cycleSoundAt = 0;
  /** Keys pressed for a trick are not steering until this time. */
  private cycleGraceUntil = 0;
  /** Progress through the jump an image is in, or -1 on the ground. */
  private airProgress(im: Phaser.GameObjects.Image) {
    const arc = im.getData("arc") as Phaser.Tweens.Tween | undefined;
    return arc?.isActive() ? arc.progress : -1;
  }
  /** One cell of the player's cycle: the held way against its momentum. */
  private cycleInput(dx: number, dy: number, time: number) {
    const rt = this.runtime, e = rt.engine, p = e.state.player, c = this.cycle;
    const spec = CYCLE_SPECS[p.riding!.cycle!.look.kind], now = performance.now();
    if (time < this.cycleGraceUntil) dx = dy = 0;
    if (!dx && !dy && c.speed <= 0) return;
    const way = dx || dy ? ([dx, dy] as const) : c.dir;
    if (!way) return;
    const sample = e.world.topography, nx = p.pos.x + way[0], ny = p.pos.y + way[1];
    const hit = e.groundClass(nx, ny, "outside");
    let ground = hit === "stone" || hit === "timber" ? 1 : hit === "soil" ? (1 + spec.rough) / 2 : spec.rough;
    if (p.riding!.cycle!.tuned) ground *= 1.08;
    if (sample && waterDepthAt(sample, nx + 0.5, ny + 0.5) > 0.02) ground *= 0.6;
    const fall = sample ? Math.max(-1, Math.min(1, ((sample(p.pos.x, p.pos.y)?.height ?? 0) - (sample(nx, ny)?.height ?? 0)))) : 0;
    const was = c.speed;
    const step = cycleStep(c, [dx, dy], spec, { sprint: this.shiftHeld, surge: now < rt.rideSpurUntil, ground, fall });
    c.speed = step.speed;
    c.dir = step.dir;
    c.pedalling = step.pedalling;
    const im = this.entities.get("player");
    if (im && (step.beat === "skid" || step.beat === "drift")) this.cycleSkidFx(im, step.beat, way);
    if (!step.move) {
      rt.rideGait = 0;
      if (step.beat === "skid") this.nextInput = time + 180;
      return;
    }
    rt.rideGait = c.speed > spec.cruise * 1.08 ? (now < rt.rideSpurUntil ? 4 : 3) : c.speed > spec.cruise * 0.7 ? 2 : 1;
    rt.rideMovingUntil = now + 380;
    const [mx, my] = step.move;
    // A ramp under the wheels at speed throws the machine whether asked or not.
    if (c.speed >= 7 && e.cycleRampAt(p.pos.x, p.pos.y) && !e.validate({ type: "move", dx: mx, dy: my, jump: "long", run: true })) {
      rt.face(mx, my);
      this.jumpRunning = true;
      this.queuedJump = "long";
      return;
    }
    const ms = (1000 / c.speed) * Math.hypot(mx, my);
    this.motionDuration = ms;
    this.nextInput = time + ms;
    this.lastTick = time;
    const moved = rt.move(mx, my, false, c.speed > spec.cruise * 1.05);
    if (moved?.status !== "rejected") return;
    rt.face(mx, my);
    c.halt();
    rt.rideGait = 0;
    rt.rideCombo = 0;
    this.nextInput = time + 220;
    if (was > spec.cruise * (spec.tall ? 0.75 : 1.12)) rt.command({ type: "interact", action: "cycle-spill", target: spec.tall ? "header" : "crash" });
    else if (was > 6 && im) {
      this.kickDust(im.x + mx * 6, im.y, 5, 0.9);
      this.cameras.main.shake(80, 0.002);
      void gameAudio()?.sound(mountLand(false), "land");
    }
  }
  /** Locked or sliding tyres: the noise, the dust, the marks left on the ground and the lean. */
  private cycleSkidFx(im: Phaser.GameObjects.Image, beat: "skid" | "drift", way: readonly [number, number]) {
    const p = this.runtime.engine.state.player.pos;
    void gameAudio()?.sound(cycleSkid(this.runtime.engine.groundClass(p.x, p.y, "outside")), "skid");
    this.kickDust(im.x - way[0] * 6, im.y, beat === "skid" ? 8 : 5, 1.1);
    for (let i = 0; i < 5; i++) {
      const mark = this.add
        .rectangle(im.x - way[0] * i * 4 + (way[0] ? 0 : i % 2 ? 2 : -2), im.y - 3 - way[1] * i * 4, way[0] ? 4 : 2, way[0] ? 1 : 4, 0x2a2630, 0.5)
        .setDepth(im.depth - 14);
      this.tweens.add({ targets: mark, alpha: 0, delay: 900, duration: 2200, onComplete: () => mark.destroy() });
    }
    const proxy = { t: 0 };
    this.tweens.add({
      targets: proxy,
      t: (way[0] >= 0 ? -1 : 1) * (beat === "skid" ? 13 : 9),
      duration: 110,
      yoyo: true,
      onUpdate: () => { this.cycle.lean = proxy.t; },
      onComplete: () => { this.cycle.lean = 0; },
    });
  }
  /** Asks for the rider's frames in every heading at once, so a spin in the air has them ready. */
  private warmCyclePoses() {
    const p = this.runtime.engine.state.player, look = p.riding?.cycle?.look;
    if (!look || !this.characters) return;
    for (const pose of new Set([this.cycle.sprites.frame(look, "side").pose, "cycle-stand"] as const))
      for (let face = 0; face < 8; face++)
        for (let f = 0; f < (pose === "moto" ? 1 : 8); f++) this.characters.frame({ ...p, id: "player", direction: face >> 1, facing: face } as never, pose, f);
  }
  /** A key in the air asks for a trick. True while airborne, so the key does nothing else. */
  private cycleTrickKey(key: string) {
    const p = this.runtime.engine.state.player, im = this.entities.get("player"), look = p.riding?.cycle?.look;
    const air = look && im ? this.airProgress(im) : -1;
    if (!look || air < 0) return false;
    const [dx, dy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][p.direction]!;
    const kx = key === "arrowright" || key === "d" ? 1 : key === "arrowleft" || key === "a" ? -1 : 0;
    const ky = key === "arrowdown" || key === "s" ? 1 : key === "arrowup" || key === "w" ? -1 : 0;
    const trick = cycleTrick(CYCLE_SPECS[look.kind], Math.sign(kx * dx + ky * dy) as -1 | 0 | 1, key === "space");
    if (trick && this.cycle.tryTrick(trick, air)) {
      this.cycleGraceUntil = this.time.now + 900;
      void gameAudio()?.sound(mountLeap(false), "leap");
    }
    return true;
  }
  /** Wheels back on the ground: pay out the tricks, or throw the rider if one was unfinished. */
  private cycleTouchdown(im: Phaser.GameObjects.Image, look: CycleLook) {
    const c = this.cycle, now = this.time.now, { tricks, bail } = c.touchdown();
    void gameAudio()?.sound(mountLand(false), "land");
    this.kickDust(im.x, im.y, 6, 1);
    if (bail) {
      c.halt();
      c.chain = 0;
      this.runtime.command({ type: "interact", action: "cycle-spill", target: "trick" });
      return;
    }
    if (!tricks.length) return;
    c.chain = now < c.chainUntil ? c.chain + 1 : 1;
    c.chainUntil = now + 9000;
    const points = Math.round(tricks.reduce((n, t) => n + t.points, 0) * c.chain * (tricks.length > 1 ? 1.5 : 1));
    c.style += points;
    this.runtime.rideStyle = c.style;
    c.speed = Math.min(CYCLE_SPECS[look.kind].sprint * 1.2, c.speed + 2.5);
    this.feel.puff(im.x, im.y - 10, [0xffe478, 0xffbe3d, 0xfff5c0, 0x8ee6ff], 9, 1.2);
    void gameAudio()?.sound(trickChime(c.chain), "spur");
    const label = this.add
      .text(im.x, im.y - 46, `${tricks.map((t) => t.name).join(" + ")}  +${points}${c.chain > 1 ? `  x${c.chain}` : ""}`, { fontFamily: "Silkscreen, monospace", fontSize: "8px", color: "#ffe478", stroke: "#1a1410", strokeThickness: 3 })
      .setOrigin(0.5, 1)
      .setDepth(1e7);
    this.tweens.add({ targets: label, y: label.y - 18, alpha: 0, delay: 500, duration: 900, onComplete: () => label.destroy() });
    this.runtime.command({ type: "interact", action: "cycle-trick", target: tricks.map((t) => t.name).join(" into a ") });
  }
  /** What a moving cycle sounds like and throws up: chain and tyres, a clicking freewheel, an engine. */
  private cycleSounds(im: Phaser.GameObjects.Image, look: CycleLook, moving: boolean, time: number, wet: boolean) {
    const c = this.cycle, spec = CYCLE_SPECS[look.kind], audio = gameAudio();
    if (time < this.cycleSoundAt) return;
    const p = this.runtime.engine.state.player;
    const surface = wet ? "water" : this.runtime.engine.groundClass(p.pos.x, p.pos.y, "outside");
    const hard = surface === "stone" || surface === "timber";
    if (spec.motor) {
      const rev = moving ? Math.min(1, c.speed / spec.sprint) : 0;
      this.cycleSoundAt = time + 1000 / (9 + rev * 20);
      const pitch = look.kind === "scooter" ? 1.7 : look.kind === "cub" ? 1.45 : look.kind === "dirtbike" ? 1.3 : look.kind === "sportbike" ? 1.15 : 0.82;
      void audio?.sound(motorPutt(pitch, rev), "motor");
      if (Math.random() < 0.12 + rev * 0.2) {
        const [dx, dy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][p.direction]!;
        this.feel.puff(im.x - dx * 16, im.y - 5 - dy * 6, [0xb8b4b0, 0x8a8684, 0xd8d4d0], 1, 0.35);
      }
    } else if (moving) {
      this.cycleSoundAt = time + (c.pedalling ? 250 - c.speed * 7 : Math.max(42, 170 - c.speed * 8));
      void audio?.sound(c.pedalling ? cycleRoll(surface, c.speed / spec.sprint) : cycleTick(), c.pedalling ? "cycle-roll" : "cycle-tick");
    }
    if (!moving) return;
    if (wet) splashPuddle(this, im.x, im.y - 1, p.direction, c.speed > spec.cruise, im.depth, time);
    else if (!hard && c.speed > spec.cruise * 0.9 && Math.random() < 0.5) this.kickDust(im.x, im.y, 2, 0.6);
  }
  private rideTilt = 0;
  private rideLift = 0;
  private rideHoofFrame = -1;
  private rideStridePhase = 0;
  private rideLastDir?: [number, number];
  private rideGallopSteps = 0;
  private rideBowUntil = 0;
  private rideRearUntil = 0;
  private stableDoorState = new Map<string, { state: "closed" | "half" | "open"; at: number }>();
  private nextStableDoorCheck = 0;
  /** Dynamically animates yard-stable doors between closed (night), half-open (day),
   * and wide-open when the player or a horse approaches the entrance. */
  private syncStableDoors(time: number) {
    if (time < this.nextStableDoorCheck) return;
    this.nextStableDoorCheck = time + 140;
    const e = this.runtime.engine;
    const p = e.state.player;
    if (p.pos.space !== "outside") return;
    const hour = ((e.state.clock % 86400) / 3600 + 24) % 24;
    const night = hour >= 19 || hour < 7;
    const fauna = e.state.fauna ?? [];
    for (const place of e.world.places) {
      if (!place.sprite.startsWith("yard-stable-")) continue;
      const image = this.buildings.get(place.id);
      if (!image || !image.active) continue;
      const base = place.sprite.replace(/-(closed|open)$/, "");
      const ex = place.entrance.x, ey = place.entrance.y;
      let near = Math.hypot(p.pos.x - ex, p.pos.y - ey) <= 3.2;
      if (!near) {
        for (const g of fauna) {
          if (g.burrowed !== undefined || !["horse", "pony", "donkey"].includes(g.speciesId)) continue;
          if (g.members.some((m) => Math.hypot(m.x - ex, m.y - ey) <= 2.8)) {
            near = true;
            break;
          }
        }
      }
      const target: "closed" | "half" | "open" = near ? "open" : night ? "closed" : "half";
      const cur = this.stableDoorState.get(place.id) ?? { state: "half" as const, at: 0 };
      if (cur.state === target || time - cur.at < 120) continue;
      // Step through "half" so closed <-> open visibly animates!
      const next: "closed" | "half" | "open" =
        (cur.state === "closed" && target === "open") || (cur.state === "open" && target === "closed")
          ? "half"
          : target;
      const frame = next === "half" ? base : `${base}-${next}`;
      const tex = this.texture(frame);
      if (tex !== "__DEFAULT" && this.textures.exists(tex) && this.textures.get(tex).has(frame) && (image.texture.key !== tex || image.frame.name !== frame)) {
        image.setTexture(tex, frame);
      }
      this.stableDoorState.set(place.id, { state: next, at: time });
    }
  }
  /** The horse or mounted rider frame: gait from momentum (idle/walk/trot/gallop),
   * heading from 8-way facing, eight frames a stride. */
  private horseFrame(moving: boolean, facing: number, time: number, gaitLevel?: MountGait) {
    const g = gaitLevel ?? (moving ? (this.shiftHeld ? 3 : 2) : 0);
    const gait = g >= 3 ? "gallop" : g === 2 ? "trot" : g === 1 ? "walk" : "idle";
    const period = g >= 4 ? 320 : g === 3 ? 410 : g === 2 ? 520 : g === 1 ? 680 : 2600;
    return `${gait}-${facing}-${Math.floor((time / period) * 8) % 8}`;
  }
  private riderImage?: Phaser.GameObjects.Image;
  private mountedRiders = new Map<string, Phaser.GameObjects.Image>();
  /** The player in the saddle: the sheet's rider drawn in keyed greys,
   * recoloured from their own skin, hair, clothes and hat. Works on both the
   * voxel horse and any four-direction mount species via saddle offsets. */
  private ride(
    horse: Phaser.GameObjects.Image,
    appearance: CharacterAppearance | undefined,
    frame: string,
    offsetX = 0,
    offsetY = 0,
    tilt = 0,
    baseOriginY?: number,
  ) {
    const w = appearance?.wearing;
    const hat = !!w?.headwear && w.headwear !== "none";
    const colours = [
      appearance?.skin ?? "#c08a64",
      appearance?.hairColor ?? "#3a2a20",
      w?.color ?? "#4a4038",
      w?.lowerColor ?? "#3a3430",
      "#2a1c16",
      // A hat of its own colour where the wardrobe gives one.
      (w as { headColor?: string } | undefined)?.headColor ?? "#221e24",
    ];
    const source = `vrider-${hat ? "hat" : "bare"}-${frame}`;
    const sheet = this.texture(source);
    if (sheet === "__DEFAULT") return;
    const key = `rider:${colours.join("")}:${source}`;
    if (!this.textures.exists(key)) {
      const src = this.textures.getFrame(sheet, source);
      const scratch = document.createElement("canvas");
      scratch.width = src.cutWidth;
      scratch.height = src.cutHeight;
      const ctx = scratch.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(src.source.image as CanvasImageSource, src.cutX, src.cutY, src.cutWidth, src.cutHeight, 0, 0, src.cutWidth, src.cutHeight);
      const data = ctx.getImageData(0, 0, src.cutWidth, src.cutHeight);
      releaseCanvas(scratch);
      const ramps = colours.map(riderRamp);
      for (let i = 0; i < data.data.length; i += 4) {
        if (!data.data[i + 3]) continue;
        const r = data.data[i];
        const [cr, cg, cb] = ramps[Math.min(5, r >> 5)][Math.min(6, r & 31)];
        data.data[i] = cr;
        data.data[i + 1] = cg;
        data.data[i + 2] = cb;
      }
      addPixelTexture(this, key, src.cutWidth, src.cutHeight, data.data);
      this.dynamicTextures.add(key);
    }
    this.riderImage ??= this.add.image(0, 0, key);
    this.riderImage
      .setTexture(key)
      .setOrigin(0.5, baseOriginY ?? horse.originY)
      .setPosition(horse.x + offsetX, horse.y + offsetY)
      .setScale(horse.scaleX, horse.scaleY)
      .setAngle(tilt)
      .setDepth(horse.depth + 0.05)
      .setTint(this.tint)
      .setVisible(true);
  }
  /** Sparkle, dust, tilt, camera thump and sound reactions to every riding event. */
  private syncRideEvents(im: Phaser.GameObjects.Image) {
    const ev = this.runtime.engine.lastRideEvent;
    if (!ev || ev.serial === this.lastRideSerial) return;
    this.lastRideSerial = ev.serial;
    const spec = mountSpec(ev.speciesId);
    const heavy = !!spec?.heavy;
    const audio = gameAudio();
    const tiltTween = (peak: number, lift: number, dur: number) => {
      const proxy = { t: 0, l: 0 };
      this.tweens.add({
        targets: proxy,
        t: peak,
        l: lift,
        duration: dur * 0.42,
        ease: "Quad.easeOut",
        yoyo: true,
        hold: dur * 0.16,
        onUpdate: () => {
          this.rideTilt = proxy.t;
          this.rideLift = proxy.l;
        },
        onComplete: () => {
          this.rideTilt = 0;
          this.rideLift = 0;
        },
      });
    };
    const facing = this.runtime.engine.state.player.direction;
    const sign = facing === 3 ? 1 : -1;
    const machine = ev.voice === "bike" || ev.voice === "motor";
    switch (ev.kind) {
      case "mount":
        if (machine) this.warmCyclePoses();
        this.rideBowUntil = this.time.now + 650;
        this.feel.spring(im, 1.16, 0.86, 220);
        this.kickDust(im.x, im.y, 5, 0.8);
        audio?.sound(mountVoice(ev.voice, "mount"), "mount");
        break;
      case "dismount":
        this.feel.spring(im, 1.12, 0.88, 180);
        this.kickDust(im.x, im.y, 4, 0.7);
        break;
      case "spur":
        this.feel.spring(im, 1.18, 0.86, 170);
        this.kickDust(im.x, im.y, ev.perfect ? 9 : 5, ev.perfect ? 1.15 : 0.85);
        if (ev.perfect) {
          // Golden cadence sparkle burst off the hooves!
          this.feel.puff(im.x, im.y - 6, [0xffe478, 0xffbe3d, 0xfff5c0], 7, 1.1);
          this.cameras.main.shake(90, 0.0022);
        }
        audio?.sound(spurSnap(!!ev.perfect, ev.combo ?? 1), "spur");
        if ((ev.combo ?? 1) >= 3) audio?.sound(mountVoice(ev.voice, "spur"), "mount");
        break;
      case "calm":
      case "feed":
        this.rideBowUntil = this.time.now + 750;
        this.feel.spring(im, 1.08, 0.94, 180);
        this.feel.puff(im.x, im.y - (machine ? 26 : 18), ev.kind === "feed" || machine ? [0x8ee672, 0xffe478, 0xfff4c2] : [0xff9eb8, 0xffd1dc, 0xfff0f5], machine ? 3 : ev.kind === "feed" ? 7 : 5, 0.8);
        audio?.sound(mountVoice(ev.voice, "calm"), "mount");
        break;
      case "break":
        this.feel.spring(im, 1.18, 0.84, 240);
        this.feel.puff(im.x, im.y - 14, [0xffe478, 0xffbe3d, 0xffffff], 11, 1.2);
        this.cameras.main.shake(120, 0.003);
        audio?.sound(spurSnap(true, 5), "spur");
        audio?.sound(mountVoice(ev.voice, "mount"), "mount");
        break;
      case "rear":
        this.rideRearUntil = this.time.now + 760;
        if (machine) this.cycle.wheelieUntil = this.time.now + WHEELIE_MS;
        else if (ev.speciesId !== "horse" && ev.speciesId !== "wild-horse") tiltTween(sign * 16, 7, 520);
        this.feel.spring(im, 0.9, 1.16, 240);
        this.kickDust(im.x, im.y, 8, 1.0);
        this.cameras.main.shake(130, heavy ? 0.005 : 0.003);
        audio?.sound(mountVoice(ev.voice, "rear"), "mount");
        break;
      case "stubborn":
        if (!machine) tiltTween(sign * -10, 2, 340);
        this.kickDust(im.x, im.y, 6, 0.9);
        audio?.sound(mountVoice(ev.voice, "stubborn"), "mount");
        break;
      case "buck":
        this.feel.spring(im, 1.24, 0.78, 280);
        this.kickDust(im.x, im.y, 12, 1.25);
        this.feel.puff(im.x, im.y - 10, [0xffe08a, 0xd8c8a8, 0xffffff], 8, 1.0);
        this.cameras.main.shake(220, 0.006);
        audio?.sound(mountVoice(ev.voice, "buck"), "mount");
        audio?.sound(mountLand(true), "land");
        break;
      case "leap":
        this.feel.spring(im, 0.92, 1.14, 180);
        this.kickDust(im.x, im.y, ev.perfect ? 9 : 5, 1.0);
        if (ev.perfect) this.feel.puff(im.x, im.y - 8, [0xffe478, 0xfff5c0], 5, 0.9);
        audio?.sound(mountLeap(heavy), "leap");
        if (!machine) this.time.delayedCall(260, () => { void gameAudio()?.sound(mountLand(heavy), "land"); });
        break;
    }
  }
  /** The railway of the town the player is in, and of any town beside it
   * whose line runs into view. */
  private fieldPrompt?: Phaser.GameObjects.Text;
  private rowGoal?: { farmer: string; step: number };
  private nextFieldStep = 0;
  private plantDrag = false;
  private lastPloughBeat = new Map<string, number>();

  private drawFieldPrompt(time: number) {
    const e = this.runtime.engine, p = e.state.player;
    const guide = p.guidingPlough && e.state.actors.find(a => a.id === p.guidingPlough);
    const v = guide && guide.plough && e.world.vehicle?.(guide.plough.vehicle);
    let label = "", x = p.pos.x, y = p.pos.y, offset = 36;
    if (v && guide && guide.plough) {
      const step = guide.plough.step, next = v.path[step + 1];
      if (next) {
        const turn = step + 1 === v.rowLength;
        const q = turn ? next : v.path[step < v.rowLength! - 1 ? v.rowLength! - 1 : v.path.length - 1];
        x = q.x; y = q.y; offset = 13;
        const direction = turn ? (next.x > p.pos.x ? "↱" : next.x < p.pos.x ? "↰" : next.y > p.pos.y ? "↴" : "↱") :
          next.x > p.pos.x ? "→" : next.x < p.pos.x ? "←" : next.y > p.pos.y ? "↓" : "↑";
        label = turn ? direction + " Turn" : direction;
        if (this.rowGoal?.farmer === guide.id && step < this.rowGoal.step && time >= this.nextFieldStep) {
          this.nextFieldStep = time + 260;
          this.runtime.command({ type: "move", dx: next.x - p.pos.x, dy: next.y - p.pos.y });
        } else if (this.rowGoal && step >= this.rowGoal.step) this.rowGoal = undefined;
      }
    } else {
      this.rowGoal = undefined;
      const farmer = p.pos.space === "outside" && e.state.actors.find(a => a.plough && a.mount && Math.hypot(a.pos.x - p.pos.x, a.pos.y - p.pos.y) <= 2.5);
      if (farmer && !p.drivingCart && !p.held && !p.heldItem && e.state.fauna?.some(g => g.hitch === farmer.plough?.vehicle)) {
        x = farmer.pos.x; y = farmer.pos.y; label = phoneLayout() ? "Take handles" : "F  Take handles";
      }
    }
    if (!label || this.modalOpen || this.options.lab) { this.fieldPrompt?.setVisible(false); return; }
    const text = this.fieldPrompt ??= this.add.text(0, 0, "", { fontFamily: "sans-serif", fontSize: "9px", color: "#fff2c9", backgroundColor: "#364034", padding: { x: 3, y: 1 } }).setOrigin(0.5, 1).setDepth(1e7);
    text.setText(label).setVisible(true).setPosition(x * 16 + 8, y * 16 + 12 - offset - this.lift(x * 16 + 8, y * 16 + 12));
  }
  private driveTrains(time: number) {
    const e = this.runtime.engine;
    const w = e.world as typeof e.world & { planAt?: (x: number, y: number) => SettlementPlan | undefined };
    const p = e.state.player.pos;
    const plan = p.space === "outside" ? w.planAt?.(Math.round(p.x), Math.round(p.y)) : undefined;
    const lines = plan?.railway
      ? [{ key: plan.site.id, line: plan.railway, radius: plan.site.profile.radius }]
      : [];
    const clock = this.runtime.displayClock(), light = lightingPreset(this.shadowPhase);
    const harbor = p.space === "outside" ? w.harbor?.() : undefined;
    this.harbor.update(harbor,w.pack.setting,clock,this.tint,this.cameras.main.worldView,e.state.objects,
      light.cast,this.options.shadows === false ? 0 : light.opacity*this.sunStrength(),plan?.anchorage ?? (p.space==="outside" ? w.anchorage?.() : undefined),e.state.player.boat,p.space==="outside" ? w.terminal?.() : undefined);
    this.trains.update(
      lines,
      w.pack.setting,
      e.state.manifest.seed,
      this.runtime.displayClock(),
      time,
      this.cameras.main.worldView,
      this.tint,
      !!this.options.freeze,
      this.options.colorGrade !== false ? washAt(this.runtime.displayClock()).lamps : 0,
      p,
    );
    this.cabs.update(plan, w.pack.setting, e.state.manifest.seed, this.runtime.displayClock(), this.cameras.main.worldView, this.tint);
    const vehicles = [...(plan?.vehicles ?? [])];
    for (const v of vehicles) {
      if (!v.delivery) continue;
      const image = this.entities.get(v.id),
        motor = image?.getData("motor") as WorldObject["motor"];
      if (!image || !motor || motor.taken || motor.yielding) continue;
      const pose = vehicleAt(v, clock - (motor.delay ?? 0));
      const x = pose.x * 16 + 8,
        y = pose.y * 16 + 16 - this.lift(x, pose.y * 16 + 16);
      const frame = v.model.replace(/-\d$/, "-" + pose.facing);
      const tex = this.texture(frame);
      if (image.frame.name !== frame && tex !== "__DEFAULT")
        image.setTexture(tex, frame).setOriginFromFrame();
      image.setPosition(x, y).setDepth(pose.y * 16 + 10);
      const shadow = this.shadows.get(v.id);
      const key = shadowFrame(this.shadowPhase, frame);
      const stex = this.texture(key);
      if (shadow && shadow.frame.name !== key && stex !== "__DEFAULT" && this.textures.get(stex).has(key))
        shadow.setTexture(stex, key).setOriginFromFrame();
      shadow?.setPosition(x, y);
    }
    const teams = new Map<string, FaunaGroup>();
    if (p.space === "outside") for (const group of e.state.fauna ?? []) {
      if (!group.hitch || Math.abs(group.pos.x - p.x) > 100 || Math.abs(group.pos.y - p.y) > 100) continue;
      teams.set(group.hitch, group);
      if (!vehicles.some(v => v.id === group.hitch)) {
        const v = w.vehicle?.(group.hitch);
        if (v) vehicles.push(v);
      }
    }
    this.vehicleLayer.update(vehicles,
      v => {
        if (!v.rowLength) return;
        const work = e.state.actors.find(a => a.id === v.crew[0])?.plough;
        if (!work) return 0;
        const previous = this.lastPloughBeat.get(v.id);
        this.lastPloughBeat.set(v.id, work.step);
        const q = v.path[work.step], range = Math.hypot(q.x - p.x, q.y - p.y);
        if (previous !== undefined && work.step > previous && range < 11 && !this.options.freeze) {
          const wet = v.seedCrop === "rice", turn = work.step === v.rowLength;
          void gameAudio()?.sound(() => (turn ? scrape("timber", "wheels") :
            [...scrape(wet ? "water" : "soil"), ...(footstep(wet ? "paddy" : "furrow", false) ?? [])])
            .map(l => ({ ...l, gain: l.gain * (1 - range / 12) * 0.55 })), "field-work", Math.max(-1, Math.min(1, (q.x - p.x) / 8)), 150);
        }
        return ploughStep(work, clock);
      },
      (v, i) => {
        const g = teams.get(v.id), member = g?.members[i];
        return g && member ? this.animalArt(g, faunaSpriteId(g.id, member.n ?? i)) : undefined;
      }, clock, this.cameras.main.worldView, this.tint, (x, y) => this.lift(x, y),
      light.cast, light.opacity * this.sunStrength(), this.options.shadows !== false,
      (id, t) => e.cartClock(id, t),
      v => e.state.player.guidingPlough === v.crew[0] || e.state.player.drivingCart?.vehicle === v.id
        ? e.state.player : this.mountedActors.get(v.crew[0]));
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
      const light = kind === "beacon" || kind.startsWith("chase-");
      if (!kind.startsWith("flame") && !light && kind !== "led") image.setTint(this.tint);
      if (light) image.setVisible(false);
      this.layers.push(image);
      this.buildingAnimations.set(`${id}-overlay-${i}`, {
        image,
        kind,
        period: kind.startsWith("flame")
          ? 110
          : kind === "ball"
            ? 150
            : kind === "pigeons"
              ? 700
              : kind === "flapboard"
                ? 420
                : kind === "pennant" || kind.startsWith("flag-")
                  ? 170
                  : kind === "acfan"
                    ? 70
                    : kind === "turbine"
                      ? 130
                      : kind === "beacon"
                        ? 380
                        : kind.startsWith("chase-")
                          ? 160
                          : kind === "led"
                            ? 2400
                            : 240,
        phase: random(seed, "building-overlay", id, i) * 4,
        light,
      });
    });
  }
  /** Every sign spot the art left on a front: a trade, a language, a paint
   * and words for each, or nothing. A building's first spot carries its own
   * trade; the others are neighbours renting the rest of the ground floor. */
  private addShopSigns(
    place: Place,
    placement: ReturnType<typeof buildingPlacement>,
    setting: WorldSetting | undefined,
    top: number,
  ) {
    const model = placement.model as typeof placement.model & { shopSigns?: SignSlot[]; business?: string; signPaint?: string };
    if (!model.shopSigns?.length || !setting) return;
    // A lot nobody keeps, a ruin among them, has no boards up.
    const keeper = this.ownerRole(place);
    if (!keeper) return;
    const first = signLanguage(setting);
    if (!first) return;
    const second = secondLanguage(setting);
    const paints = signPaints(setting);
    const seed = this.runtime.engine.state.manifest.seed;
    model.shopSigns.forEach(([sx, sy, w, h, kind, hint], i) => {
      const r = (k: string) => random(seed, "shop-sign", k, place.id, i);
      // The first board is the keeper's own: the business the art names, or
      // what the keeper's work is. A private house hangs none.
      if (i === 0 && !model.business && place.access !== "public") return;
      const art = shopArt(place.sprite);
      // The town's cycle shop is an ordinary front; its name is what says what it sells.
      const own = i === 0 ? (/\b(bicycle|cycle)\b/i.test(place.name) ? "bicycles" : model.business ?? (art && art !== "shop" ? art : keeperTrade(keeper))) : undefined;
      if (own?.startsWith("residential") || r("bare") < (i === 0 ? 0 : 0.12)) return;
      const year = this.runtime.engine.world.pack.year;
      const trade = hint || own || streetTrade(year, r("trade"));
      const language = second && r("language") < second[1] ? second[0] : first;
      const options = signOptions(trade, language, year, this.ownerSurname(place), r("name") < 0.3);
      const fit = fitWord(options, language, w, h, kind, r("word"));
      if (!fit) return;
      const paint = kind === "band" && model.signPaint ? model.signPaint : paints[Math.floor(r("paint") * paints.length)];
      const made = drawShopSign(this, w, h, kind, paint, language, fit.word, fit.text, Math.floor(r("accent") * 15));
      if (!made) return;
      const x = Math.round(placement.x - model.anchor[0] + sx), y = Math.round(top - model.anchor[1] + sy);
      const image = this.add.image(x, y, made.key).setOrigin(0, 0).setTint(this.tint).setDepth(placement.depth + 1);
      this.layers.push(image);
      // Signs go off when the shop shuts, a few burn on into the night.
      const off = 21.5 + r("off") * 3;
      const lit = (h: number) => (h >= 17.5 || h < 6) && (h >= 12 ? h : h + 24) < off;
      const ground = Math.round(top + 3);
      // From mid-century a shopfront is lit for passers-by, whatever its sign.
      if (!made.lit && year >= 1950) {
        const pool = this.make.image({ x: x + w / 2, y: ground, key: ensureLightMask(this, Math.min(36, Math.max(16, Math.round((w * 0.6) / 4) * 4)), PORCH_TONE), frame: "0" }, false);
        const quiet = this.add.image(x, y, made.key).setOrigin(0, 0).setDepth(placement.depth + 1.1).setVisible(false);
        this.layers.push(pool, quiet);
        this.lamps.push({ pane: quiet, pools: [pool], glass: 0.25, spill: 0.55, lit });
        this.washKey = "";
      }
      if (!made.lit) return;
      const pane = this.add.image(x, y, made.lit).setOrigin(0, 0).setDepth(placement.depth + 1.1).setVisible(false);
      const halo = this.add
        .image(x - SIGN_GLOW, y - SIGN_GLOW, made.glow!)
        .setOrigin(0, 0)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(19001)
        .setVisible(false);
      // Neon colours the pavement under it.
      const pool = this.make.image({ x: x + w / 2, y: ground, key: ensureLightMask(this, Math.min(40, Math.max(16, Math.round((w * 0.7) / 4) * 4)), made.tone!), frame: "0" }, false);
      this.layers.push(pane, halo, pool);
      this.lamps.push({ pane, halo, pools: [pool], glow: kind === "neon" ? 0.85 : 0.55, spill: 0.5, lit });
      this.washKey = "";
    });
  }

  /** The family name of whoever keeps this place, where the culture and the
   * century give people family names at all. Generation already decides that,
   * so a one-word name simply yields nothing here. */
  private ownerRole(place: Place): string {
    return this.runtime.engine.state.actors.find((actor) => actor.id === place.owner)?.role ?? "";
  }

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
    // The light reaches well past the fire's own width either side.
    const radius = Math.max(56, Math.round((image.width * 1.6) / 4) * 4);
    const pool = this.make.image({ x: Math.round(x), y: Math.round(y - 6), key: ensureLightMask(this, Math.round(radius * 1.5)), frame: "0" }, false);
    const glow = this.add
      .image(
        Math.round(x),
        Math.round(y - image.height * 0.35),
        ensureFireLight(this, Math.round(radius * 0.6)),
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
    const frames = this.fireFrames.get(base) ?? 4;
    // Sparks off an open fire or a brazier; an oven keeps its fire inside.
    const embers =
      this.options.freeze || (frames < 8 && !base.includes("brazier"))
        ? undefined
        : this.add
            .particles(Math.round(x), Math.round(y - image.height * 0.45), ensureEmber(this), {
              speedY: { min: -30, max: -12 },
              speedX: { min: -6, max: 6 },
              accelerationX: { min: -8, max: 8 },
              lifespan: { min: 700, max: 1700 },
              frequency: 150,
              alpha: { start: 1, end: 0 },
              tint: [0xffe08a, 0xffa040, 0xff6a28],
              blendMode: Phaser.BlendModes.ADD,
            })
            .setDepth(19002);
    // An open fire thaws a ring round itself; an oven keeps its heat in.
    const across = Math.min(48, Math.max(24, Math.round(image.width * 1.3))) & ~1;
    const melt =
      this.snow >= 0.34 && frames >= 8
        ? this.add
            .image(Math.round(x), Math.round(y - 3), meltPatch(this, across, Math.round(across * 0.55)))
            .setTint(this.tint)
            .setDepth(this.printDepth() - 0.5)
        : undefined;
    this.fires.set(id, { image, base, frames, phase, glow, pool, smoke, embers, melt });
  }
  /** A street lamp or a door lantern: a pool on the ground and the flame
   * itself, both over the night wash. */
  private lightLamp(
    id: string,
    image: Phaser.GameObjects.Image,
    lamp: Lamp,
    x: number,
    y: number,
  ) {
    // A lamp that can be carried is lit again where it is put down.
    const lit = this.streetLights.get(id);
    if (lit?.lamp.tech === lamp.tech && (!lamp.always || (lit.pool.getData("at") as string) === `${x},${y}`)) return;
    this.douseLamp(id);
    const seed = this.runtime.engine.state.manifest.seed;
    // Frame pixels to world, mirrored about the origin when the prop is flipped.
    const heads = lamp.heads.map(([hx, hy]) => [
      x + (image.flipX ? image.displayOriginX - hx - 0.5 : hx + 0.5 - image.displayOriginX),
      y + hy + 0.5 - image.displayOriginY,
    ]);
    const under = heads.reduce((sum, [hx]) => sum + hx, 0) / heads.length;
    this.streetLights.set(id, {
      // A shade spreads its light over more ground than a lantern does.
      pool: this.make.image({ x: Math.round(under), y: Math.round(y - 4), key: ensureLightMask(this, Math.round(lamp.radius * (lamp.cone ? 2 : lamp.tech === "fire" ? 1.6 : 1.8)), lamp.tone), frame: "0" }, false),
      flames: heads.map(([hx, hy]) =>
        this.add
          .image(
            Math.round(hx),
            Math.round(hy),
            lamp.tech === "fire"
              ? ensureFireLight(this, 16)
              : lamp.cone
                ? ensureFireLight(this, 10, lamp.tone)
                : ensureHalo(this, 30, lamp.tone),
            "0",
          )
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0)
          .setDepth(19001),
      ),
      cones: lamp.cone
        ? heads.map(([hx, hy]) =>
            this.add
              .image(Math.round(hx), Math.round(hy) + 1, ensureLightCone(this, Math.max(16, Math.round(y - hy)), lamp.tone))
              .setOrigin(0.5, 0)
              .setBlendMode(Phaser.BlendModes.ADD)
              .setAlpha(0)
              .setDepth(19000),
          )
        : [],
      lamp,
      phase: Math.floor(this.poseOffset(id) % 8),
      // A lighter works street by street across the town, so neighbours light
      // in turn rather than in a random sparkle.
      order: ((((x + y * 0.6) / 700 + random(seed, "lamp-round", id) * 0.08) % 1) + 1) % 1,
    });
    this.streetLights.get(id)!.pool.setData("at", `${x},${y}`);
  }
  private douseLamp(id: string) {
    const lamp = this.streetLights.get(id);
    if (!lamp) return;
    lamp.pool.destroy();
    for (const glow of [...lamp.flames, ...lamp.cones]) glow.destroy();
    this.streetLights.delete(id);
  }
  private quenchFire(id: string) {
    const fire = this.fires.get(id);
    if (!fire) return;
    fire.glow.destroy();
    fire.pool.destroy();
    fire.embers?.destroy();
    fire.melt?.destroy();
    for (const puff of fire.smoke) puff.destroy();
    this.fires.delete(id);
  }
  /** The texture (a sheet, or a page of one) each lazy frame sits on, read off
   * the indexes. A name test would need every recipe prefix. */
  private sheetFrames?: Map<string, string>;
  private sheetImages = new Map<string, [string, object]>();
  private sheetLoading = new Set<string>();
  private sheetRetried = new Set<string>();
  private sheetUsed = new Map<string, number>();
  private lastSheetPrune = 0;
  private dynamicTextures = new Set<string>();
  private releaseDynamicTextures() {
    for (const k of this.dynamicTextures) releaseTexture(this, k);
    this.dynamicTextures.clear();
    if (smallMemoryDevice()) {
      for (const key of this.sheetImages.keys()) releaseTexture(this, key);
      this.sheetLoading.clear();
      this.sheetUsed.clear();
    }
  }
  /** On phones, evict old lazy atlas pages once loaded pages pass the budget
   * so long walks and map travel cannot climb texture memory indefinitely. */
  private pruneLazySheets(now: number) {
    if (!smallMemoryDevice() || now - this.lastSheetPrune < 10000) return;
    this.lastSheetPrune = now;
    const loaded: string[] = [];
    for (const key of this.sheetImages.keys())
      if (this.textures.exists(key)) loaded.push(key);
    if (loaded.length <= 16) return;
    const inUse = new Set<string>();
    const markObj = (o: Phaser.GameObjects.GameObject) => {
      const tex = (o as Partial<Phaser.GameObjects.Image>).texture?.key;
      if (tex) inUse.add(tex);
      if (o instanceof Phaser.GameObjects.Container)
        for (const child of o.list) markObj(child);
    };
    for (const o of this.children.list) markObj(o);
    loaded.sort((a, b) => (this.sheetUsed.get(a) ?? 0) - (this.sheetUsed.get(b) ?? 0));
    let remaining = loaded.length;
    for (const key of loaded) {
      if (remaining <= 16) break;
      if (inUse.has(key) || now - (this.sheetUsed.get(key) ?? 0) < 20000) continue;
      releaseTexture(this, key);
      this.sheetLoading.delete(key);
      this.sheetUsed.delete(key);
      remaining--;
    }
  }
  /** Fetches a building sheet the preload did not, then redraws the scenery
   * that stood in for it. */
  private loadSheet(key: string) {
    const sheet = this.sheetImages.get(key);
    if (!sheet || this.sheetLoading.has(key)) return;
    this.sheetLoading.add(key);
    const [image, frames] = sheet;
    this.load.atlas(key, image, { frames });
    this.load.once(`filecomplete-atlasjson-${key}`, () => {
      this.staticKey = "";
      if (this.scene?.isActive()) this.draw();
    });
    // Phaser drops a file added while it winds up a batch (loadComplete clears
    // the list), which left that sheet's houses invisible but solid for good.
    this.load.once("complete", () => {
      if (this.textures.exists(key) || !this.scene?.isActive()) return;
      this.sheetLoading.delete(key);
      if (!this.sheetRetried.has(key)) {
        this.sheetRetried.add(key);
        this.loadSheet(key);
      }
    });
    if (!this.load.isLoading()) this.load.start();
  }
  /** A coat is the species' frames with the colours swapped, built the first
   * time an animal wears it. Frames keep their names, with the coat in them. */
  private coatTexture(frame: string) {
    const plus = frame.indexOf("+");
    // "faunab-", or "faunac-" and the other four-direction sets.
    const set = frame.slice(0, 6);
    const art = frame.slice(7, plus);
    const slug = frame.slice(plus + 1, frame.indexOf("-", plus));
    const key = `${set}+${art}+${slug}`;
    if (this.textures.exists(key)) return key;
    const swap = faunaCoats(art.split(".")[0], slug.replace(/_/g, "-"));
    const stem = `${set}-${art}-`;
    const isPaged = (pagedSheets as readonly string[]).includes(set);
    let frames: Phaser.Textures.Frame[] = [];
    if (isPaged && this.sheetFrames) {
      const pages = new Set<string>();
      for (const [name, pageKey] of this.sheetFrames)
        if (name.startsWith(stem)) pages.add(pageKey);
      let missing = false;
      for (const pageKey of pages) {
        this.sheetUsed.set(pageKey, this.time.now);
        if (!this.textures.exists(pageKey)) {
          this.loadSheet(pageKey);
          missing = true;
        }
      }
      if (missing) return "__DEFAULT";
      for (const pageKey of pages) {
        const atlas = this.textures.get(pageKey);
        for (const name of atlas.getFrameNames())
          if (name.startsWith(stem)) frames.push(atlas.get(name));
      }
    } else {
      if (!this.textures.exists(set)) return "__DEFAULT";
      const atlas = this.textures.get(set);
      frames = atlas
        .getFrameNames()
        .filter((name) => name.startsWith(stem))
        .map((name) => atlas.get(name));
    }
    if (!swap || !frames.length) return isPaged ? "__DEFAULT" : set;
    const w = Math.max(...frames.map((f) => f.cutWidth)) + 2,
      h = Math.max(...frames.map((f) => f.cutHeight)) + 2;
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
    const cw = canvas.width, ch = canvas.height;
    const image = ctx.getImageData(0, 0, cw, ch);
    releaseCanvas(canvas);
    const d = image.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const to = swap.get((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
      if (to === undefined) continue;
      d[i] = to >> 16;
      d[i + 1] = (to >> 8) & 255;
      d[i + 2] = to & 255;
    }
    const texture = addPixelTexture(this, key, cw, ch, d)!;
    this.dynamicTextures.add(key);
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
  /** A hand-made thing set down: its own icon, in the colours of what went into it. */
  private madeTexture(frame: string) {
    if (this.textures.exists(frame)) return frame;
    if (frame.startsWith("made:palace:") || frame.startsWith("made:exhibit:")) {
      const picture = (frame.startsWith("made:exhibit:") ? exhibitPicture(frame) : palacePropPicture(frame))?.canvas();
      if (!picture) return "__DEFAULT";
      this.textures.addCanvas(frame, picture)?.add(frame, 0, 0, 0, picture.width, picture.height);
      return frame;
    }
    const icon = voxelItemsReady() ? voxelIcon(frame.slice(5)) : undefined;
    if (!icon) {
      void loadVoxelItems();
      return "__DEFAULT";
    }
    this.textures.addCanvas(frame, icon)?.add(frame, 0, 0, 0, icon.width, icon.height);
    return frame;
  }
  private texture(frame: string) {
    if (HUNT_ICONS.includes(frame)) return frame;
    if (frame.startsWith("made:")) return this.madeTexture(frame);
    if (frame.startsWith("tuft-kit-")) return frame.slice(0, frame.lastIndexOf("-"));
    if (frame.startsWith("tuft-")) return TUFT_ATLAS;
    if (!this.sheetFrames) {
      this.sheetFrames = new Map();
      const { atlases } = sceneAssets();
      for (const sheet of lazySheets) {
        const indexKey = `${sheet}-index`;
        const json = this.cache.json.get(indexKey);
        if (!json) continue;
        const pages: Record<string, unknown>[] =
          (pagedSheets as readonly string[]).includes(sheet) ? json : [json.frames];
        pages.forEach((frames, i) => {
          const key = pages === json ? `${sheet}@${i}` : sheet;
          const image = pages === json
            ? pageImage(sheet, i)
            : atlases.find((a) => a.key === sheet)!.image;
          this.sheetImages.set(key, [image, frames]);
          for (const f in frames) if (!this.sheetFrames!.has(f)) this.sheetFrames!.set(f, key);
        });
        // Indexed into sheetFrames/sheetImages; drop the raw JSON cache copy.
        this.cache.json.remove(indexKey);
      }
    }
    const lazy = this.sheetFrames.get(frame);
    if (lazy) {
      this.sheetUsed.set(lazy, this.time.now);
      if (this.textures.exists(lazy)) return lazy;
      this.loadSheet(lazy);
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
    // Lazy fauna sets; plain frames were found in sheetFrames above, while
    // coated frames (+slug) build from the species' pages.
    if (/^fauna[cmrfguwokehx]-/.test(frame)) {
      if (frame.includes("+")) return this.coatTexture(frame);
      const set = frame.slice(0, 6);
      if (this.textures.exists(set)) return set;
      this.loadSheet(set);
      return "__DEFAULT";
    }
    if (frame.startsWith("ecology-")) return "ecology";
    // "study-propb-" is the same atlas: match the prefix without the hyphen.
    return frame.startsWith("study-prop") || frame.startsWith("prop-broken-")
      ? "props"
      : "atlas";
  }
  /** A prop whose hangings are a separate frame: the entity draws the rigid
   * part and the hangings ride over it. The whole sprite stays in the atlas
   * for the lab, the UI and the shadow mask. */
  private layerOf(frame: string, layer: string) {
    if (!frame.startsWith("study-propb-")) return undefined;
    const key = `${frame}-${layer}`;
    return this.textures.get("props").has(key) ? key : undefined;
  }
  /** How a prop has been used, where that is drawn: lid off, dented, a fire out. */
  private propState(o: WorldObject) {
    // An oven or stove goes cold between meals, on the hearths' own schedule,
    // but not while someone is baking at it or for two hours after you fire it.
    if (!this.options.freeze && this.fireFrames.has(o.sprite) && !this.hearthLit(o.id) &&
        !(o.fired !== undefined && this.runtime.engine.state.clock - o.fired < 7200) &&
        ![...this.ambient.values()].some((at) => at.target?.id === o.id && Math.hypot(at.x - o.pos.x, at.y - o.pos.y) < 3.5)) {
      const out = `${o.sprite}-out`;
      if (this.textures.get("props").has(out)) return out;
    }
    if (o.broken || !(o.damage || o.open)) return undefined;
    return (o.damage && o.open ? this.layerOf(o.sprite, "dented-open") : undefined) ??
      (o.open ? this.layerOf(o.sprite, "open") : undefined) ??
      (o.damage ? this.layerOf(o.sprite, "dented") : undefined);
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
    camera.setLerp(this.liveGraphics.followLerp);
    this.game.canvas.style.imageRendering = this.liveGraphics.canvasSampling;
    this.textures.each(
      (texture: Phaser.Textures.Texture) =>
        texture.setFilter(this.textureFilter()),
      this,
    );
    Object.assign(this.game.canvas.dataset, {
      roundPixels: String(this.liveGraphics.roundPixels),
      occlusion: String(this.liveGraphics.occlusion),
      tiltShift: String(this.liveGraphics.tiltShift),
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
    if (patch.occlusion !== undefined && this.ready && this.scene.isActive()) this.draw();
  }
  private tiltShift?: TiltShiftPipeline;
  private nightGrade?: NightGradePipeline;
  /** The hour's grade outdoors, blue moonlight after dark, grey under cloud.
   * Off indoors, where a room has its own light. */
  private nightLevel = 0;
  private applyGrade(amount: number, dull = 0, grade?: ReturnType<typeof gradeAt>, floor = 1) {
    this.nightLevel = amount;
    const renderer = this.game.renderer;
    if (!(renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return;
    const camera = this.cameras.main;
    if (amount <= 0 && dull <= 0 && !grade) {
      if (this.nightGrade) camera.removePostPipeline("NightGrade");
      this.nightGrade = undefined;
      return;
    }
    if (!this.nightGrade) {
      if (!renderer.pipelines.postPipelineClasses.has("NightGrade"))
        renderer.pipelines.addPostPipeline("NightGrade", NightGradePipeline);
      camera.setPostPipeline("NightGrade");
      this.nightGrade = camera.getPostPipeline("NightGrade") as NightGradePipeline;
    }
    this.nightGrade.night = amount;
    this.nightGrade.dull = dull;
    this.nightGrade.shadow = grade?.shadow ?? [1, 1, 1];
    this.nightGrade.light = grade?.light ?? [1, 1, 1];
    this.nightGrade.curve = grade?.curve ?? 0;
    this.nightGrade.floor = floor;
    this.nightGrade.snow = Math.min(1, this.snow * 3 + this.frost);
    // Sprites and ground carry the hour's tint under the wash: both multiply.
    this.nightGrade.wash = [16, 8, 0].map(
      (shift) => (((this.washTint >> shift) & 255) * ((this.tint >> shift) & 255)) / 65025,
    );
  }
  private applyTiltShift() {
    const renderer = this.game.renderer;
    if (!(renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return;
    const camera = this.cameras.main;
    const g = this.liveGraphics;
    if (!g.tiltShift || this.runtime.engine.state.player.pos.space !== "outside") {
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
  private aimKind?: "bow" | "throw";
  private aimInput?: "mouse" | "touch";
  private aimTrigger?: "keyboard" | "mouse" | "touch";
  private aimTarget?: { x: number; y: number };
  private mouseTarget?: { x: number; y: number };
  private aimRunning = false;
  private touchDragged = false;
  private touchOffset?: { x: number; y: number };
  private pointerCell(pointer: Phaser.Input.Pointer) {
    const at = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    let x = Math.floor(at.x / 16), y = Math.floor(at.y / 16);
    const world = this.runtime.engine.world;
    if (world.topography && this.runtime.engine.state.player.pos.space === "outside") {
      const ox = x - 4, oy = y - 4;
      const hit = pickTerrain(
        (a, b) => world.topography!(a + ox, b + oy),
        9, 13, at.x - ox * 16, at.y - oy * 16,
      );
      if (hit) { x = hit.x + ox; y = hit.y + oy; }
    }
    return { x, y };
  }
  private launcher() {
    const item = this.runtime.engine.state.player.heldItem;
    return !!item && LAUNCHERS.has(item);
  }
  /** Turns of the sling so far: slow at first, winding up to a steady hum. */
  private slingTurns(ms: number) {
    const ramp = Math.min(ms, 900);
    return ms / 300 + ramp * ramp / 600000 + Math.max(0, ms - 900) * 0.0033;
  }
  private slingTurn = 0;
  private whirlRing?: Phaser.GameObjects.Graphics;
  /** The blur of the pouch going round, which three frames cannot show. */
  private whirl(time: number) {
    const player = this.entities.get("player");
    const slinging = player && this.aimKind === "bow" && this.aimStarted !== undefined &&
      this.runtime.engine.state.player.heldItem === "sling";
    if (!slinging) {
      this.whirlRing?.destroy();
      this.whirlRing = undefined;
      return;
    }
    const turns = this.slingTurns(time - this.aimStarted!);
    if (Math.floor(turns) !== this.slingTurn) {
      this.slingTurn = Math.floor(turns);
      void gameAudio()?.sound(slingWhirl(Math.min(1, turns / 6)), "air");
    }
    const g = (this.whirlRing ??= this.add.graphics()).clear();
    g.setDepth(player.y + 4300);
    // The renderer mirrors a west-facing figure itself, not through flipX.
    const side = this.runtime.engine.state.player.direction === 3 ? -1 : 1;
    const cx = player.x + side * WHIRL_HAND.x, cy = player.y + WHIRL_HAND.y;
    const speed = Math.min(1, turns / 5);
    const head = (turns % 1) * Math.PI * 2;
    for (let i = 1; i <= 6; i++) {
      const a = head - i * 0.28;
      g.fillStyle(0xf2e8d2, (0.8 - i * 0.12) * (0.5 + speed * 0.5))
        .fillRect(Math.round(cx + Math.cos(a) * 8 * side), Math.round(cy + Math.sin(a) * 3), 2, 1);
    }
  }
  private beginAim(kind: "bow" | "throw", input: "mouse" | "touch", trigger: "keyboard" | "mouse" | "touch") {
    if (this.aimStarted !== undefined) return;
    const p = this.runtime.engine.state.player;
    if (kind === "bow" && !this.runtime.engine.ammo() && p.heldItem !== "hawk") return;
    if (kind === "throw" && !(p.held || p.heldItem)) return;
    const [dx, dy] = this.jumpDirection();
    this.aimStarted = this.time.now;
    this.aimKind = kind;
    this.aimInput = input;
    this.aimTrigger = trigger;
    this.touchDragged = false;
    this.touchOffset = undefined;
    this.aimRunning = this.shiftHeld || this.runtime.running ||
      this.time.now - this.lastRunStep < RUN_GRACE_MS;
    this.aimTarget = input === "mouse" && this.mouseTarget
      ? this.mouseTarget
      : { x: p.pos.x + dx * 3, y: p.pos.y + dy * 3 };
    this.runtime.stop(false);
  }
  private finishAim() {
    if (this.aimStarted === undefined || !this.aimTarget) return;
    this.aimPath();
    const kind = this.aimKind;
    const target = this.aimTarget;
    const elapsed = this.time.now - this.aimStarted;
    this.cancelAim();
    const p = this.runtime.engine.state.player.pos;
    const dx = Math.sign(target.x - p.x), dy = Math.sign(target.y - p.y);
    if (!dx && !dy) return;
    if (kind === "bow") {
      this.runtime.shootBow(target, Math.min(1, 0.6 + elapsed / 500));
      const player = this.entities.get("player");
      // The kick of the string: a jolt back, then square again.
      if (player) this.feel.spring(player, 0.9, 1.08, 170);
    }
    else this.runtime.throwHeld(dx, dy, this.aimRunning, undefined, target);
  }
  cancelAim() {
    this.aimStarted = undefined;
    this.aimKind = undefined;
    this.aimInput = undefined;
    this.aimTrigger = undefined;
    this.aimTarget = undefined;
    this.touchDragged = false;
    this.touchOffset = undefined;
    this.runtime.aiming = false;
  }
  private aimPath() {
    if (this.aimStarted === undefined || !this.aimTarget) return undefined;
    if (this.aimInput === "touch" && this.touchOffset) {
      const p = this.runtime.engine.state.player.pos;
      this.aimTarget = { x: p.x + this.touchOffset.x, y: p.y + this.touchOffset.y };
    }
    const range = this.aimKind === "bow" ? this.runtime.engine.bowRange() : this.runtime.engine.missile().range;
    return this.runtime.engine.projectilePath(this.aimTarget, range);
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
      leapFauna: (id, height, span) => this.faunaMotion.leap(id, height, span),
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
  /** The wires from one utility pole's crossarm to the next, sagging between
   * them. Drawn above the ground at the nearer pole's depth. */
  private wires(x: number, y: number, to: { x: number; y: number }) {
    const g = this.add.graphics();
    const x0 = x * 16 + 8,
      y0 = y * 16 + 16 - this.lift(x * 16 + 8, y * 16 + 16),
      x1 = to.x * 16 + 8,
      y1 = to.y * 16 + 16 - this.lift(to.x * 16 + 8, to.y * 16 + 16);
    const sag = Math.min(10, Math.hypot(x1 - x0, y1 - y0) * 0.06);
    // The crossarm's two outer insulators, above the pole's foot.
    for (const [dx, tone] of [
      [-10, 0x23262a],
      [9, 0x2e3236],
    ] as const) {
      g.lineStyle(1, tone, 0.9);
      g.beginPath();
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const px = x0 + dx + (x1 - x0) * t,
          py = y0 - 78 + (y1 - y0) * t + sag * 4 * t * (1 - t);
        if (i) g.lineTo(Math.round(px), Math.round(py));
        else g.moveTo(Math.round(px), Math.round(py));
      }
      g.strokePath();
    }
    return g.setDepth(Math.max(y, to.y) * 16 + 13);
  }
  private natureShadows(key: string) {
    return this.textures.get("nature-shadows").has(key)
      ? "nature-shadows"
      : "nature-shadows-2";
  }
  private propShadows(key: string) {
    return this.textures.get("prop-shadows").has(key) ? "prop-shadows" : "prop-shadows-2";
  }
  private shadow(frame: string, x: number, y: number, transient = false) {
    if (this.options.shadows === false || waterborneFrames.has(frame)) return undefined;
    let key = shadowFrame(this.shadowPhase, frame);
    const source = this.texture(frame);
    // A building turned to face its street is the south frame's art, cast once under that name.
    const south = key.replace(/-(north|east|west)$/, "");
    if (!this.sheetFrames?.has(key) && this.sheetFrames?.has(south)) key = south;
    const paged = this.sheetFrames?.has(key) ? this.texture(key) : undefined;
    if (paged === "__DEFAULT") return undefined;
    const texture = paged ??
      (source === "nature"
        ? this.natureShadows(key)
        : source === "props"
          ? this.propShadows(key)
          : frame.startsWith("vehicle-")
            ? "vehicle-shadows"
            : source.startsWith("street-buildings@")
              ? "street-shadows"
              : "lighting-shadows");
    if (!this.textures.get(texture).has(key)) key = south;
    if (!this.textures.get(texture).has(key)) return undefined;
    const image = this.add
      .image(x, transient ? y : y - this.lift(x, y), texture, key)
      .setOriginFromFrame()
      .setDepth(this.runtime.engine.world.topography ? -1000 : -60000);
    const sun = this.sunStrength();
    // Under cloud the cast is the short midday one (see draw), kept dark enough to ground.
    if (sun < 1) image.setAlpha(sun < CLOUDED ? 0.6 : sun);
    if (!transient) this.layers.push(image);
    this.snowCast(image.setName("cast"));
    return image;
  }
  /** Sun on lying snow, or on dew or frost on a clear morning's grass: now
   * and then a crystal or a drop catches it and flashes. */
  private glint(delta: number) {
    const dew = this.snow < 0.34 && this.light.id === "early-morning" && this.season !== "winter";
    if (
      this.options.freeze ||
      this.roomView ||
      this.caveView ||
      this.sewerView ||
      this.areaView ||
      this.shipView ||
      (this.snow < 0.34 && !dew) ||
      this.light.id === "night" ||
      this.light.id === "dusk" ||
      this.sunStrength() < 0.85 ||
      Math.random() > delta * 0.014
    )
      return;
    const view = this.cameras.main.worldView;
    const x = Math.floor(view.x + Math.random() * view.width),
      y = Math.floor(view.y + Math.random() * view.height);
    const cell = this.runtime.engine.world.topography?.(Math.floor(x / 16), Math.floor(y / 16));
    const lift = this.lift(x, y);
    if (
      !cell ||
      cell.solid ||
      cell.surface === "water" ||
      cell.feature === "paving" ||
      cell.pathArt?.length ||
      (dew ? cell.surface !== "grass" || !!cell.field : cell.surface !== "snow" && !openSnow(x, y))
    )
      return;
    if (!this.textures.exists("snow-glint")) {
      const tex = this.textures.createCanvas("snow-glint", 3, 3)!;
      const ctx = tex.getContext();
      ctx.fillStyle = "#d8e8ff";
      ctx.fillRect(1, 0, 1, 3);
      ctx.fillRect(0, 1, 3, 1);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(1, 1, 1, 1);
      tex.refresh();
    }
    const star = this.add.image(x, y - lift, "snow-glint").setDepth(y - 12).setAlpha(0);
    this.tweens.add({
      targets: star,
      alpha: 1,
      duration: 160 + Math.random() * 140,
      yoyo: true,
      hold: 120,
      onComplete: () => star.destroy(),
    });
  }
  /** The hour after a shower: drops still falling from the trees, the wet
   * ground steaming where the sun is back on it, and some days a rainbow. */
  private afterRain(delta: number) {
    const out = !this.options.freeze && !this.roomView && !this.caveView && !this.sewerView && !this.shipView && !this.areaView && this.light.id !== "night";
    const wet = out && (this.rained || ((this.weather?.wetness ?? 0) > 0.3 && this.weather?.condition !== "rain"));
    const sun = this.sunStrength() >= 0.85;
    const view = this.cameras.main.worldView;
    if (wet && this.canopies.length && Math.random() < delta * 0.006) {
      const tree = this.canopies[Math.floor(Math.random() * this.canopies.length)].image;
      if (view.contains(tree.x, tree.y)) {
        const x = Math.round(tree.x + (Math.random() - 0.5) * tree.displayWidth * 0.6),
          y = Math.round(tree.y - tree.displayHeight * (0.3 + Math.random() * 0.2));
        const drop = this.add.rectangle(x, y, 1, 2, 0xd8ecff, 0.9).setDepth(tree.depth + 1);
        this.tweens.add({
          targets: drop,
          y: y + 10 + Math.random() * 8,
          duration: 260,
          ease: "Quad.easeIn",
          onComplete: () => {
            drop.setSize(3, 1).setAlpha(0.6);
            this.tweens.add({ targets: drop, alpha: 0, duration: 200, onComplete: () => drop.destroy() });
          },
        });
      }
    }
    if (wet && sun && (this.weather?.tempC ?? 0) > 6 && Math.random() < delta * 0.008) {
      const x = view.x + Math.random() * view.width,
        y = view.y + Math.random() * view.height;
      const cell = this.runtime.engine.world.topography?.(Math.floor(x / 16), Math.floor(y / 16));
      if (cell && cell.surface !== "water" && !cell.solid) {
        const wisp = this.add.rectangle(x, y, 4, 2, 0xf2f4f6, 0.22).setDepth(y + 4000);
        this.tweens.add({
          targets: wisp,
          y: y - 10 - Math.random() * 8,
          x: x + (Math.random() - 0.5) * 6,
          scaleX: 2.5,
          scaleY: 2.5,
          alpha: 0,
          duration: 1800 + Math.random() * 900,
          ease: "Sine.easeOut",
          onComplete: () => wisp.destroy(),
        });
      }
    }
    // Opposite a low sun only, and not after every shower.
    const bow =
      out &&
      this.rained &&
      sun &&
      this.light.id !== "midday" &&
      random(this.runtime.engine.state.manifest.seed, "rainbow", Math.floor(this.runtime.engine.state.clock / 86400)) < 0.5;
    if (bow && !this.rainbow) {
      this.rainbow = this.add.graphics().setDepth(18990).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      this.tweens.add({ targets: this.rainbow, alpha: 1, duration: 4000 });
    } else if (!bow && this.rainbow) {
      const g = this.rainbow;
      this.rainbow = undefined;
      this.tweens.add({ targets: g, alpha: 0, duration: 3000, onComplete: () => g.destroy() });
    }
    if (this.rainbow) {
      // Morning sun is in the east, so the bow stands in the west, and the reverse.
      const side = this.light.id === "early-morning" || this.light.id === "morning" ? -0.25 : 0.25;
      const r = view.width * 0.62;
      this.rainbow.clear().setPosition(view.centerX + view.width * side, view.bottom + r * 0.35);
      const bands = [0xff4a4a, 0xff9a3a, 0xffe25a, 0x6ad86a, 0x5a9aff, 0x8a6aff];
      bands.forEach((colour, i) => {
        this.rainbow!.lineStyle(3, colour, 0.13);
        this.rainbow!.beginPath();
        this.rainbow!.arc(0, 0, r - i * 3, Math.PI, Math.PI * 2);
        this.rainbow!.strokePath();
      });
    }
  }
  /** Which way a low sun lights edges: east at sunrise, west at dusk, else 0. */
  private rimSide() {
    if (this.roomView || this.caveView || this.sewerView || this.shipView || this.areaView || this.options.shadows === false || this.sunStrength() < 0.85) return 0;
    return this.light.id === "early-morning" ? 1 : this.light.id === "dusk" ? -1 : 0;
  }
  private rimColour(side: number) {
    return side > 0 ? 0xffdca6 : 0xffb46e;
  }
  /** The edge light on people and animals: the low sun's, or after dark a pale
   * one, so a figure the night has greyed stands off ground of the same value. */
  private figureRim() {
    const side = this.rimSide();
    if (side) return { side, colour: this.rimColour(side), alpha: 0.85 };
    return !this.roomView && !this.caveView && !this.sewerView && !this.shipView && !this.areaView && (this.nightGrade?.night ?? 0) > 0.35
      ? { side: -1, colour: 0xd4e2ff, alpha: 0.5 }
      : undefined;
  }
  private rimLight(id: string, owner: Phaser.GameObjects.Image) {
    const entry = this.rims.get(id);
    if (entry && entry.owner === owner) return;
    entry?.rim.destroy();
    this.rims.set(id, { rim: this.add.image(owner.x, owner.y, owner.texture.key, owner.frame.name), owner });
  }
  private syncRims() {
    const light = this.figureRim();
    for (const [id, { rim, owner }] of this.rims) {
      if (!light || !owner.active) {
        rim.destroy();
        this.rims.delete(id);
        continue;
      }
      rim
        .setTexture(owner.texture.key, owner.frame.name)
        .setOrigin(owner.originX, owner.originY)
        .setFlip(owner.flipX, owner.flipY)
        .setScale(owner.scaleX, owner.scaleY)
        .setPosition(owner.x + light.side, owner.y)
        .setDepth(owner.depth - 0.01)
        .setVisible(owner.visible)
        .setAlpha(light.alpha * owner.alpha)
        .setTintFill(light.colour);
    }
  }
  /** Just over the ground, under everything standing on it. */
  private printDepth() {
    return (this.runtime.engine.world.topography ? -1000 : -60000) - 1;
  }
  private snowCast(image: Phaser.GameObjects.Image) {
    return this.snowyCasts ? image.setTintFill(SNOW_SHADOW) : image.clearTint();
  }
  /** Trees, houses and people mirrored in the water beside them. */
  private reflect(time: number) {
    if (smallMemoryDevice()) return;
    const e = this.runtime.engine,
      w = e.world;
    const outdoors = e.state.player.pos.space === "outside" && !!w.topography && !this.options.lab;
    if (w !== this.reflectedWorld) {
      this.reflections?.clear();
      this.reflections = undefined;
      this.reflectedWorld = w;
    }
    if (!outdoors) return void this.reflections?.clear();
    this.reflections ??= new Reflections(this, (cx, cy) => w.topography!(cx, cy)?.surface === "water");
    // Darker and bluer than what stands above it, in the hour's light.
    const t = multiplyTint(this.tint, 0x8ea6b8);
    this.reflections.update(
      [
        ...this.buildings.values(),
        ...this.entities.values(),
        ...this.canopies.map((c) => c.image),
        ...[...this.plantImages.values()].flat(),
      ],
      t,
      time,
    );
  }
  private fadeFrom?: { world: WorldModel; space: string; clock: number };
  private fadingOut = false;
  /** Through a door or through the night the old view goes down to black
   * before the new one is built, then comes up out of it. Across the map only
   * the arrival fades: the world under the old view has already been swapped.
   * True while the old frame is being held. */
  private fallingFrom() {
    const trees = [...this.broadleaves];
    for (const image of this.entities.values()) {
      const name = image.frame?.name;
      if (name === "ecology-fruit-tree" || name === "oak" || (natureTreeSprites.includes(name) && turnsColour(name)))
        trees.push(image);
    }
    return trees;
  }

  private critterGround(kind: CritterKind, x: number, y: number) {
    const cell = this.runtime.engine.world.topography?.(Math.floor(x / 16), Math.floor(y / 16));
    if (!cell) return false;
    const water = cell.surface === "water";
    if (kind === "gull") return cell.waterVisual?.kind === "sea";
    if (kind === "dragonfly")
      return (water && cell.waterVisual?.kind !== "sea") || cell.habitat?.kind === "hollow";
    if (kind === "fluff") return !water && cell.feature !== "paving";
    if (kind === "butterfly") return !water && !cell.pavement && cell.feature !== "paving";
    if (kind === "firefly") return !water || cell.waterVisual?.kind !== "sea";
    return true;
  }

  private holdForFade(world: WorldModel, space: string, clock: number): boolean {
    const was = this.fadeFrom;
    if (!was || this.options.lab || this.options.freeze) {
      this.fadeFrom = { world, space, clock };
      return false;
    }
    if (this.fadingOut) return true;
    const camera = this.cameras.main;
    if (world !== was.world) {
      this.fadeFrom = { world, space, clock };
      camera.fadeIn(900, 6, 8, 14);
      return false;
    }
    const slept = clock - was.clock > 2 * 3600;
    if (!slept && space === was.space) {
      this.fadeFrom = { world, space, clock };
      return false;
    }
    this.fadingOut = true;
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.fadingOut = false;
      this.fadeFrom = undefined;
      this.draw();
      camera.fadeIn(slept ? 600 : 260, 6, 8, 14);
    });
    camera.fadeOut(slept ? 420 : 180, 6, 8, 14);
    return true;
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
    if (this.holdForFade(w, p.space, e.state.clock)) return;
    if (this.hoverId) this.showHover(this.hoverId, this.input.activePointer);
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
        : this.options.lighting
          ? parseInt(this.light.tint, 16)
          : tintAt(rt.timeVisualClock ?? e.state.clock);
    // A generated room lights its people with its own layer.
    const lit = this.selfLit(p.space);
    if (lit) this.tint = 0xffffff;
    this.shadowPhase = p.space === "outside" ? this.light.id : lit ? "midday" : "night";
    // The figures are lit for the same hour their shadows are cast for.
    if (this.characters) this.characters.light = this.shadowPhase;
    const setting = w.pack.setting;
    const season = setting
      ? (seasonAt(setting.season, e.state.clock) ?? setting.season)
      : "summer";
    // A moulting coat is chosen for the season, so the choices go with it.
    if (season !== this.season) this.faunaArt.clear();
    this.season = season;
    // The year has turned: fields stand at the new season's stage, so the
    // ground under them is drawn again.
    const tide = setting ? tideAt(setting, e.state.clock) : 0;
    if (setting && (w !== this.drawnWorld || this.fieldSeason !== season || this.fieldTide !== tide)) {
      w.setSeason?.(season, tide);
      if (w === this.drawnWorld) this.terrainStream?.setSeason(season, tide);
      this.fieldSeason = season;
      this.fieldTide = tide;
    }
    this.weather = setting
      ? weatherAt(
          skySeed(e.state.manifest),
          setting.climate,
          setting.season,
          e.state.clock,
        )
      : undefined;
    // A shower in the last two hours, now over.
    this.rained =
      !!setting &&
      this.weather?.condition !== "rain" &&
      this.weather?.condition !== "snow" &&
      [3600, 7200].some(
        (ago) =>
          weatherAt(skySeed(e.state.manifest), setting.climate, setting.season, e.state.clock - ago)
            .condition === "rain",
      );
    // No sun behind the cloud to throw a long shadow; only the soft one under each thing.
    if (p.space === "outside" && this.shadowPhase !== "night" && this.sunStrength() < CLOUDED)
      this.shadowPhase = "midday";
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
    // Hoar frost wants a still, clear night at freezing; the morning sun takes it.
    const hour = (((e.state.clock / 3600) % 24) + 24) % 24;
    const air = this.weather;
    this.frost =
      air && !this.options.lab && !this.snow && hour < 10 && ["clear", "light-clouds", "mist"].includes(air.condition)
        ? air.tempC <= -1
          ? 1
          : air.tempC <= 2
            ? 0.7
            : 0
        : 0;
    setFrost(this.frost);
    this.terrainStream?.setFrost(this.frost);
    if (this.snowyCasts !== this.snow >= 0.34) {
      this.snowyCasts = !this.snowyCasts;
      for (const layer of this.layers)
        if (layer.name === "cast") this.snowCast(layer as Phaser.GameObjects.Image);
      for (const shade of this.shadows.values()) this.snowCast(shade);
    }
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
            this.weather.rain,
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
    const small =
      outdoors && setting && this.weather && perf.fauna && this.runtime.engine.world.topography
        ? {
            climate: setting.climate,
            ecology: setting.environment?.ecology ?? "grassland",
            season: this.season,
            tempC: this.weather.tempC,
            day: this.light.id !== "night" && this.light.id !== "dusk",
            coast: setting.water.startsWith("coast"),
            tint: this.tint,
          }
        : undefined;
    this.smallLife?.set(small);
    this.monkeys?.set(small && setting ? { ...small, lat: setting.lat, lon: setting.lon, night: this.light.id === "night", dawn: this.light.id === "early-morning" } : undefined);
    this.accent?.set(
      outdoors && setting && this.weather && perf.fauna
        ? accentFor(
            this.season,
            setting.environment?.ecology ?? "grassland",
            this.light.id,
            this.weather.condition,
            this.weather.tempC,
            setting.water,
            hashSeed(`${e.state.manifest.seed}:${Math.floor(e.state.clock / 86400)}:${this.light.id}`),
          )
        : undefined,
      hashSeed(e.state.manifest.seed) + 0.5,
    );
    const coastal = setting?.water?.startsWith("coast") ?? false;
    const dawnMist = hour >= 4.5 && hour < 7.3;
    this.mist?.set(
      outdoors && this.weather && this.options.colorGrade !== false
        ? this.weather.condition === "mist"
          ? 0.28
          : this.weather.condition === "rain"
            ? coastal
              ? 0.21
              : 0.16
            : this.weather.condition === "snow"
              ? 0.3
            : this.weather.condition === "overcast"
              ? coastal && dawnMist
                ? 0.13
                : 0.08
              : coastal && dawnMist
                ? 0.09
                : 0
        : 0,
    );
    // Broken cloud needs sun behind it to cast anything.
    this.clouds?.set(
      outdoors && this.weather && this.options.colorGrade !== false && this.light.id !== "night"
        ? (this.weather.condition === "light-clouds" ? 0.26 : 0) *
            (this.light.id === "dusk" || this.light.id === "early-morning" ? 0.6 : 1)
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
    else if (!this.selfLit(p.space)) c.removeBounds();
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
      this.treeFinds?.dispose();
      this.smallLife?.clear();
      this.monkeys?.clear();
      this.findsDirty = true;
      this.combatEffects?.dispose();
      this.combatEffects = undefined;
      this.terrainStream?.dispose();
      this.terrainStream = undefined;
      this.terrainAnchor = undefined;
    } else if (p.space !== this.effectsSpace) {
      // Indoors the street is only out of sight. Rasterising it again on the
      // way back out is what made a settlement fill in a quadrant at a time.
      this.toolEffects?.dispose();
      this.treeFinds?.dispose();
      this.smallLife?.clear();
      this.monkeys?.clear();
      this.findsDirty = true;
      this.combatEffects?.dispose();
      this.terrainStream?.setHidden(p.space !== "outside");
      this.terrainAnchor = undefined;
    }
    if (p.space !== this.effectsSpace) this.applyTiltShift();
    this.effectsSpace = p.space;
    // A life begun underground has no street to wait for.
    if (p.space !== "outside" && !this.terrainStream) this.game.canvas.dataset.terrainPlayable = this.game.canvas.dataset.terrainReady = "true";
    if (w.topography && p.space === "outside") {
      if (!this.terrainStream) {
        this.terrainStream = new TerrainStream(
          this,
          w,
          e.state.manifest.seed,
          !this.options.lab ? p : undefined,
          this.fieldSeason ? { season: this.fieldSeason, tide: this.fieldTide } : undefined,
        );
      }
      this.terrainStream.setHidden(false);
      this.terrainStream.setView(
        viewX,
        viewY,
        Math.ceil(this.scale.width / rt.zoom / 32),
        Math.ceil(this.scale.height / rt.zoom / 32),
      );
      this.terrainStream.setTint(this.tint);
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
      seasonIndex(e.state.clock),
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
      this.snow,
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
    const thisSeason = seasonIndex(e.state.clock);
    const pickedNow = (x: number | string, y: number | string) => {
      const at = tiles?.[`${x},${y}`]?.picked;
      return at !== undefined && seasonIndex(at) === thisSeason;
    };
    setCropCut(pickedNow);
    // Chunks already on screen keep their sprites; a picked plant has to go
    // now rather than when its chunk next streams.
    const picks = e.state.tilesRevision ?? 0;
    if (picks !== this.pickedRevision) {
      this.pickedRevision = picks;
      for (const [id, image] of this.cropImages) {
        const at = /^crop-(-?\d+)-(-?\d+)$/.exec(id);
        if (at && pickedNow(at[1], at[2])) image.destroy();
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
      for (const id of [...this.streetLights.keys()])
        if (id.startsWith("road-lamp-")) this.douseLamp(id);
      this.leafPiles = [];
      this.broadleaves = [];
      this.courtyardLighting.begin();
      this.canopies = [];
      this.plantHeights.clear();
      this.plantImages.clear();
      this.findsDirty = true;
      this.windSprites = [];
      this.ripples = [];
      this.buildings.clear();
      this.buildingAnimations.clear();
      this.voxelLife.clear();
      this.voxelLife.siesta = siestaOf(this.runtime.engine.world.pack.setting);
      this.clockHands = [];
      this.gateDoors = [];
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
      if (p.space === "outside" && w.topography && tiles) {
        const spots = [];
        for (const [key, edit] of Object.entries(tiles)) {
          if (!edit.sowing) continue;
          const [x, y] = key.split(",").map(Number);
          if (x < startX || x >= startX + width || y < startY || y >= startY + height) continue;
          const top = y * 16 - w.topography(x, y).height * TERRAIN_RISE;
          spots.push(...cropsAt(w.topography, x, y, 0, 0, top));
        }
        addCrops(this, spots, { objects: this.layers, textures: [] });
      }
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
            const port=w.harbor?.()?.crossing;
            if(port && Math.abs(e.point.x-port.gate.x)<14 && Math.abs(e.point.y-port.gate.y)<6){
              const x=e.point.x*16+8,y=e.point.y*16+8;
              g.fillStyle(0x675b49).fillRect(x-1,y-13,3,15);
              g.fillStyle(0x374e49).fillRect(x-7,y-17,15,8);
              g.fillStyle(0xe8cf99).fillRect(x-4,y-14,8,1).fillRect(x+2,y-15,1,3);
            }else g.fillCircle(e.point.x * 16 + 8, e.point.y * 16 + 8, 14);
          }
        this.layers.push(g);
      }
      if ((!w.topography || p.space !== "outside") && !this.selfLit(p.space)) {
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
        // Tiles sit edge to edge in terrain.png; at sub-pixel scroll the GPU
        // samples the neighbour and draws 1px seams. Extrude each tile by 1px.
        if (!this.textures.exists("terrain-extruded")) {
          const src = this.textures.get("terrain").getSourceImage() as HTMLImageElement;
          const n = Math.floor(src.width / 16);
          const out = this.textures.createCanvas("terrain-extruded", n * 18, 18)!;
          const ctx = out.getContext();
          ctx.imageSmoothingEnabled = false;
          for (let i = 0; i < n; i++) {
            const sx = i * 16, dx = i * 18 + 1;
            ctx.drawImage(src, sx, 0, 16, 16, dx, 1, 16, 16);
            ctx.drawImage(src, sx, 0, 16, 1, dx, 0, 16, 1);
            ctx.drawImage(src, sx, 15, 16, 1, dx, 17, 16, 1);
            ctx.drawImage(out.canvas, dx, 0, 1, 18, dx - 1, 0, 1, 18);
            ctx.drawImage(out.canvas, dx + 15, 0, 1, 18, dx + 16, 0, 1, 18);
          }
          out.refresh();
          out.setFilter(this.textureFilter());
        }
        const ts = this.tilemap.addTilesetImage(
          "terrain",
          "terrain-extruded",
          16,
          16,
          1,
          2,
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
              const tuft = isGrassTuft(originalName);
              const seed = e.state.manifest.seed;
              const tuftField = tuft ? w.topography?.(x, y)?.field : undefined;
              const rim = tuftField?.margin ?? 0;
              const tuftX = tuft ? Math.floor(random(seed, "tuft-x", x, y) * 7) - 3 + (rim & 2 ? 4 : 0) - (rim & 8 ? 4 : 0) : 0;
              const tuftY = tuft ? 2 + Math.floor(random(seed, "tuft-y", x, y) * 6) + (rim & 1 ? 7 : 0) - (rim & 4 ? 2 : 0) : 0;
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
              const plainShrub = !tuft && !!w.pack.setting &&
                (/^nature-dry-scrub-(small|medium)/.test(spriteName) ||
                  random(seed, "named-shrub-art", Math.floor(x / 4), Math.floor(y / 4)) < 0.55);
              const frameAndDress =
                tuft ? grassTuftFrame(this, w.topography?.(x, y)?.habitat,
                  spriteName === "dry-grass-tuft", this.season, random(seed, "tuft-art", x, y))
                : spriteName === "rock"
                  ? rockFrame(
                      w.topography?.(x, y)?.habitat,
                      random(e.state.manifest.seed, "rock-art", x, y),
                      w.topography?.(x, y)?.rock,
                    )
                  : seasonFrame(
                      treeVariant(
                        trodden(
                          namedShrub(
                            spriteName,
                            e.plantSpecies(spriteName, x, y)?.id,
                            (f) => (!plainShrub || !f.startsWith("nature-shrub-")) && this.textures.get("nature").has(f),
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
              if (!tuft) this.shadow(frame, x * 16 + 8, y * 16 + 16);
              const decoration = this.sprite(
                frame,
                x * 16 + 8 + tuftX,
                y * 16 + 16 - tuftY,
                y * 16 + 12 - tuftY,
              );
              const cell = w.topography?.(x, y);
              if (
                spriteName === "rock" ||
                frame.startsWith("nature-rock-") ||
                frame.startsWith("nature-boulder-")
              ) {
                const coastal =
                  !!cell &&
                  (cell.surface === "sand" ||
                    cell.surface === "gravel" ||
                    cell.habitat?.site?.primary === "shore" ||
                    (cell.waterVisual?.kind === "sea" &&
                      cell.waterVisual.distance < (cell.waterVisual.shoreWidth ?? 3) + 1.5));
                let sandRgb: number[] | undefined;
                if (coastal && cell) {
                  const hex = waterPalette(cell.habitat?.ecology ?? "grassland", "sea").bank[2];
                  const base = [
                    parseInt(hex.slice(1, 3), 16),
                    parseInt(hex.slice(3, 5), 16),
                    parseInt(hex.slice(5, 7), 16),
                  ];
                  const bt = beachTint(cell, base);
                  sandRgb = bt ? base.map((v, k) => Math.min(255, Math.round(v * bt[k]))) : base;
                }
                const rockGround = groundedRockTexture(
                  this,
                  decoration.texture.key,
                  frame,
                  coastal,
                  sandRgb,
                  decoration.originX,
                  decoration.originY,
                );
                if (rockGround)
                  decoration
                    .setTexture(rockGround.key)
                    .setOrigin(rockGround.originX, rockGround.originY);
              }
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
              if (d?.flipX !== undefined) decoration.setFlipX(d.flipX);
              else if (variety.flip) decoration.setFlipX(true);
              if (variety.tint !== 0xffffff)
                tint = blendTint(tint, variety.tint);
              if (
                (originalName === "nature-mangrove" || frame.startsWith("nature-mangrove")) &&
                cell &&
                (cell.surface === "sand" ||
                  cell.surface === "water" ||
                  (cell.waterVisual &&
                    cell.waterVisual.distance < (cell.waterVisual.shoreWidth ?? 3) + 1.5))
              ) {
                const wetWater =
                  cell.surface === "water" || (cell.waterVisual?.distance ?? 9) < 1.35;
                const collar = mangroveRootCollar(
                  this,
                  decoration.texture.key,
                  frame,
                  wetWater,
                  decoration.originX,
                  decoration.originY,
                );
                if (collar)
                  this.layers.push(
                    this.add
                      .image(decoration.x, decoration.y, collar.key)
                      .setOrigin(collar.originX, collar.originY)
                      .setFlipX(decoration.flipX)
                      .setTint(this.tint)
                      .setDepth(decoration.depth - 0.5),
                  );
              }
              const worked = e.state.tiles?.[`${x},${y}`];
              if (worked?.tended && worked.furrow && /^vv-(furrow|puddled)-/.test(originalName)) {
                const field = w.topography?.(x, y).field;
                if (field) {
                  const horizontal = field.axis === "x", slope = field.rowSlope ?? 0;
                  const { crest } = fieldRidge(field)(x * 16 + 8, y * 16 + 8);
                  decoration.setOrigin(0.5).setPosition(decoration.x - (horizontal ? 0 : crest),
                    decoration.y - 8 - (horizontal ? crest : 0)).setRotation(Math.atan(horizontal ? slope : -slope));
                }
              }
              if (worked?.burnt) tint = blendTint(tint, 0x4a3f36);
              if (tint !== this.tint) decoration.setTint(tint);
              const ecology = w.pack.setting?.environment?.ecology ?? "grassland";
              if (originalIsTree && turnsColour(originalName) && !worked?.burnt)
                this.broadleaves.push(decoration);
              if (
                originalIsTree &&
                this.season === "autumn" &&
                turnsColour(originalName) &&
                ecology !== "tropical-woodland" &&
                ecology !== "desert" &&
                !worked?.burnt
              ) {
                this.leafPiles.push({ x: decoration.x, y: decoration.y - 3 });
                this.layers.push(
                  this.add
                    .image(decoration.x, decoration.y - 3, leafLitter(this, Math.floor(random(e.state.manifest.seed, "litter", x, y) * 4)))
                    .setTint(this.tint)
                    .setDepth(this.printDepth() - 0.5),
                );
              }
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
              // The next pole is near where the spacing puts it, not always on it.
              const next =
                d?.wire &&
                [0, -1, 1]
                  .flatMap((j) => [0, -1, 1].map((i) => w.decoration(d.wire!.x + i, d.wire!.y + j)))
                  .find((n) => n?.id.startsWith("pole-"));
              if (next) this.layers.push(this.wires(x, y, next));
              if (d?.id.startsWith("road-lamp-")) {
                const decoLamp = lampLight(
                  spriteName,
                  w.pack.year,
                  random(e.state.manifest.seed, "lamp-kind", d.id),
                  w.pack.setting?.culture,
                );
                if (decoLamp)
                  this.lightLamp(d.id, decoration, decoLamp, decoration.x, decoration.y);
              }
              if (d) {
                const key = `${x},${y}`;
                this.plantImages.set(key, [
                  ...(this.plantImages.get(key) ?? []),
                  decoration,
                ]);
                if (rim && random(seed, "margin-clump", x, y) < 0.65) {
                  const alongY = !!(rim & 10), side = variety.flip ? -1 : 1;
                  const px = Math.max(1, Math.min(15, 8 + tuftX + (alongY ? 2 : 6) * side));
                  const py = Math.max(1, Math.min(15, 16 - tuftY + (alongY ? 6 : -2) * side));
                  const second = grassTuftFrame(this, w.topography?.(x, y)?.habitat, spriteName === "dry-grass-tuft",
                    this.season, random(seed, "margin-blades", x, y));
                  const blades = this.sprite(second, x * 16 + px, y * 16 + py, y * 16 + py - 4)
                    .setFlipX(!variety.flip).setTint(tint);
                  this.plantImages.get(key)!.push(blades);
                  this.makeSelectable(blades, d.id, !variety.flip);
                }
              }
              if (d && d.sprite !== "rock")
                this.makeSelectable(decoration, d.id, variety.flip);
              if (
                !!w.pack.setting &&
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
                const side = this.rimSide();
                if (side) {
                  const rim = this.add
                    .image(decoration.x + side, decoration.y, decoration.texture.key, decoration.frame.name)
                    .setOrigin(decoration.originX, decoration.originY)
                    .setScale(decoration.scaleX, decoration.scaleY)
                    .setFlipX(decoration.flipX)
                    .setCrop(0, 0, decoration.width, cut)
                    .setDepth(decoration.depth - 0.01)
                    .setAlpha(0.85)
                    .setTintFill(this.rimColour(side));
                  this.layers.push(rim);
                  decoration.setData("rim", rim);
                  this.addWind(rim, frame, random(e.state.manifest.seed, "wind-phase", x, y), true);
                }
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
            // Voxel casts use the canvas bottom; silhouette casts use the building's pivot.
            this.shadow(
              (placement.model as { shadowFrame?: string }).shadowFrame ??
                b.sprite,
              placement.x,
              placement.y + ("voxel" in placement.model && placement.model.voxel
                ? placement.model.bounds[3] - placement.model.anchor[1]
                : 0),
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
            // Raised ground lifts the drawn building off its cells.
            const drawn = { ...placement, y: image.y };
            if (animation)
              this.addBuildingAnimation(b.id, drawn, animation);
            const overlays = (
              placement.model as { overlays?: [string, number, number][] }
            ).overlays;
            if (overlays) this.addBuildingOverlays(b.id, drawn, overlays);
            const clocks = (placement.model as { clocks?: [number, number, number][] }).clocks;
            for (const [x, y, r] of clocks ?? []) {
              const g = this.add.graphics().setDepth(placement.depth + 1);
              this.layers.push(g);
              this.clockHands.push({
                g,
                x: placement.x - placement.model.anchor[0] + x,
                y: image.y - placement.model.anchor[1] + y,
                r,
                minute: -1,
              });
            }
            this.addDoor(b, placement, image.y);
            this.lightWindows(b, placement, image);
            this.lightPorch(b, placement, image);
            this.lightDoorway(b, placement, image);
            const model = placement.model as { smoke?: [number, number, string][]; door?: number[] };
            const frontCell = w.topography?.(b.x + Math.floor(b.w / 2), b.y + b.h);
            const weeds = frontCell
              ? frontCell.feature !== "paving" &&
                !frontCell.bridge &&
                frontCell.surface !== "water"
              : !["city", "port"].includes(w.pack.setting?.settlement ?? "");
            const wear = buildingWear(this, image.texture.key, image.frame.name, {
              climate: w.pack.setting?.climate,
              neglect: 1 - (b.condition ?? 0.7),
              smoke: model.smoke ?? [],
              forge: /smith|forge/i.test(b.name) ? model.door : undefined,
              weeds,
              door: model.door,
            });
            if (wear) {
              const wearH =
                (this.textures.get(wear).getSourceImage() as HTMLCanvasElement)?.height ||
                image.frame.cutHeight;
              this.layers.push(
                this.add
                  .image(image.x, image.y, wear)
                  .setOrigin(image.originX, (image.originY * image.frame.cutHeight) / wearH)
                  .setTint(this.tint)
                  .setDepth(image.depth + 0.3),
              );
            }
            const weathered = voxelWeather(this, image, placement.model as VoxelModel, this.snow,
              this.weather?.wetness ?? 0, (frame) => this.texture(frame));
            if (weathered) this.layers.push(weathered.setTint(this.tint));
            if (this.snow >= 0.34) {
              const warm =
                (b.access === "household" || !!model.smoke?.length) && this.hearthLit(b.id);
              // A lived-in house thaws the ground along its front; anything
              // cold catches a drift against the wall.
              const bank = warm ? undefined : buildingSnowBank(this, image.texture.key, image.frame.name, model.door);
              if (bank)
                this.layers.push(
                  this.add
                    .image(image.x, image.y, bank)
                    .setOrigin(image.originX, image.originY)
                    .setTint(this.tint)
                    .setDepth(image.depth + 0.35),
                );
              else if (warm) {
                const w = Math.max(8, b.w * 16 - 6) & ~1;
                this.layers.push(
                  this.add
                    .image(placement.x, image.y + 3, meltPatch(this, w, 6))
                    .setTint(this.tint)
                    .setDepth(this.printDepth() - 0.5),
                );
              }
            }
            this.layers.push(
              ...this.voxelLife.add(this, image, (placement.model as VoxelModel).life,
                this.runtime.engine.state.manifest.seed, b.id, (frame) => this.texture(frame), this.tint),
            );
            this.addChurchBanner(b, placement, w.pack.setting, image.y);
            this.addShopSigns(b, placement, w.pack.setting, image.y);
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
            const contact = fence.gates?.length ? this.add.graphics().setDepth(this.printDepth() - .6) : undefined;
            if (contact) this.layers.push(contact);
            for (const part of fence.parts) {
              if (Math.abs(part.x - p.x) > 100 || Math.abs(part.y - p.y) > 100)
                continue;
              if (part.frame === "wall-none") continue;
              const x = part.x * 16, y = part.y * 16;
              if (contact) {
                const foot = y + 16 - this.lift(x + 8, y + 16);
                const wall = /^wall-\w+-(\d+)-/.exec(part.frame);
                if (wall) {
                  const mask = Number(wall[1]);
                  contact.fillStyle(0x443d39, .21);
                  if (!(mask & 4)) contact.fillRect(x + 3, foot - 1, 16, 5);
                  if (!(mask & 2)) contact.fillRect(x + 16, foot - 14, 4, 15);
                } else if (part.frame.startsWith("tower-") || part.frame.includes("-pier-")) {
                  contact.fillStyle(0x39353a, .24).fillEllipse(x + 12, foot, 31, 9);
                }
              }
              this.sprite(part.frame, x + 8, y + 16, y + 10);
            }
            for (const gate of fence.gates ?? []) {
              const gap = gate.opening;
              const mid = gap[gap.length >> 1], lift = this.lift(mid.x * 16 + 8, mid.y * 16 + 16);
              if (gate.covered) {
                const shade = this.add.graphics().setDepth(this.printDepth() - .5).setY(-lift);
                const side = gate.outward.x !== 0, x = gap[0].x * 16, y = gap[0].y * 16;
                const w = side ? 40 : gap.length * 16, h = side ? gap.length * 16 : 21;
                shade.fillStyle(0x443b45, .20).fillRect(x + (side ? -9 : 2), y + 4, w, h);
                shade.fillStyle(0x443b45, .12).fillRect(x + (side ? -5 : 4), y + 6, w - 7, h - 4);
                this.layers.push(shade);
              }
              const g = this.add.graphics().setY(-lift).setDepth(gap[gap.length - 1].y * 16 + 11).setVisible(false);
              drawGateLeaves(g, gap, gate.outward.x !== 0);
              this.layers.push(g);
              this.gateDoors.push(g);
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
      } else if (this.selfLit(p.space)) {
        this.courtyardLighting.end();
        // The generated room draws its own walls; around it is only dark.
        const dark = this.add.graphics().setDepth(-99995);
        dark.fillStyle(0x0c0a10, 1);
        dark.fillRect((startX - 1) * 16, (startY - 1) * 16, (width + 2) * 16, (height + 2) * 16);
        this.layers.push(dark);
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
    // See-through only when the player stands behind a building and its own
    // pixels cover them; the box test alone faded a tall roof's empty sky.
    const feetX = p.x * 16 + 8,
      feetY = p.y * 16 + 15;
    for (const [id, image] of this.buildings) {
      const b = w.place(id)!;
      const hides =
        this.liveGraphics.occlusion &&
        !this.options.lab &&
        this.runtime.engine.state.player.perch?.on !== id &&
        p.y * 16 + 14 < image.depth &&
        buildingContains(b, feetX, feetY - 12) &&
        [[0, -4], [0, -12], [0, -22], [-4, -14], [4, -14]].filter(([dx, dy]) => {
          const lx = Math.floor(feetX + dx - (image.x - image.displayOriginX)),
            ly = Math.floor(feetY + dy - (image.y - image.displayOriginY));
          return (this.textures.getPixelAlpha(lx, ly, image.texture.key, image.frame.name) ?? 0) > 0;
        }).length >= 2;
      image.setAlpha(hides ? 0.45 : 1);
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
      if (a.id === e.conversing) continue;
      // In a vehicle: placed in their crew place from the vehicle's clock,
      // wherever the simulation last left them.
      if (a.mount && a.kind === "human") {
        const at = this.mountAt(a, drawnClock);
        if (at && Math.abs(at.x - p.x) <= range && Math.abs(at.y - p.y) <= range) {
          this.mountedActors.set(a.id, a);
          this.ambient.set(a.id, at);
          continue;
        }
      }
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
      this.mounted.delete(a.id);
      this.mountedActors.delete(a.id);
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
    this.workObjects.clear();
    for (const o of obs.objects) {
      if (o.pos.space !== "outside" || o.carriedBy) continue;
      const family = o.kind === "crop" ? "crop" : foodPatch(o,this.season) ? "wild-food"
        : o.kind === "well" ? propDefs[o.prop ?? ""]?.family ?? "well"
        : propDefs[o.prop ?? ""]?.family ?? worksiteStationFamily(o.sprite);
      if (!family) continue;
      this.workObjects.set(o.id, { id: o.id, x: o.pos.x, y: o.pos.y, family });
    }
    this.separate(p);
    // Figures take a third less of the hour's tint, as Stardew keeps its
    // people lit: under the full night multiply a dark face goes to a blank.
    const kept = 0.35 + 0.15 * (this.nightGrade?.night ?? 0);
    const lift = (c: number) => c + Math.round((255 - c) * kept);
    const figureTint =
      (lift((this.tint >> 16) & 255) << 16) | (lift((this.tint >> 8) & 255) << 8) | lift(this.tint & 255);

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
      frame = reviewedPropFrame(frame, random(e.state.manifest.seed, "reviewed-prop", id));
      let im = this.entities.get(id);
      const on = this.perchCell(id) ?? pos;
      const footing = this.perchCell(id) ? undefined : this.wallFooting(id);
      let tx = on.x * 16 + 8 + (footing?.dx ?? 0),
        ty =
          on.y * 16 +
          16 +
          (footing?.dy ?? 0) -
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
            this.liveGraphics.roundPixels,
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
      if (im.frame.customPivot) im.setOriginFromFrame();
      else im.setOrigin(0.5, 1);
      if(id==="player" || this.crafts.has(id))this.craftOf(id).placeCrew(im);
      const fire = frame === "fire" || this.fireFrames.has(frame);
      if (this.fireFrames.has(frame)) this.lightFire(id, im, frame, tx, ty);
      else if (this.fires.has(id)) this.quenchFire(id);
      const lamp = fire ? undefined : lampLight(frame, w.pack.year, random(e.state.manifest.seed, "lamp-kind", id), w.pack.setting?.culture);
      if (lamp) this.lightLamp(id, im, lamp, tx, ty);
      else if (this.streetLights.has(id)) this.douseLamp(id);
      // A fire keeps its own colour at night.
      const tint = fire ? 0xffffff : actor ? figureTint : this.tint;
      if (im.tintTopLeft !== tint) im.setTint(tint);
      const depth = pos.y * 16 + (actor ? 14 : 10);
      if (im.depth !== depth) im.setDepth(depth);
      if (texture !== "__DEFAULT" && this.motionFrames.has(drawn)) {
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
            .setOriginFromFrame();
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
        texture === "harbor" ? texture : texture === "nature"
          ? this.natureShadows(shadowKey)
          : texture === "props"
            ? this.propShadows(shadowKey)
            : frame.startsWith("vehicle-")
              ? "vehicle-shadows"
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
      const perch = id === "player" ? this.runtime.engine.state.player.perch : undefined;
      const perchKey =
        id === "player"
          ? (perch?.roof ? "roof" : perch?.on ??
            (this.runtime.engine.onWall() ? "wall" : ""))
          : "";
      const wasPerched = (im.getData("perch") as string | undefined) ?? "";
      const roofAt = perch?.roof && perch.at ? `${perch.at.x},${perch.at.y}` : "";
      const moved =
        (im.getData("roofAt") ?? "") !== roofAt ||
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
      im.setData("roofAt", roofAt);
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
    const room = p.space === "outside" ? undefined : e.interiorOf?.(p.space);
    // The room draws its own bed, chest, work and way out.
    const drawnByRoom = room
      ? new Set([...["exit", "bed", "chest", "work"].map((k) => `${p.space}-${k}`), ...room.furniture.map((f) => `${p.space}-room-${f.propId}`)])
      : undefined;
    const cycleSeen = new Set<string>();
    for (const o of obs.objects) {
      if (o.carriedBy || o.id === flying) continue;
      if (o.cycle) {
        const cx = o.pos.x * 16 + 8, cy = o.pos.y * 16 + 16;
        this.cycle.drawParked(o, cx, cy - this.lift(cx, cy), o.pos.y * 16 + 10, this.tint, (im) => this.makeSelectable(im, o.id));
        cycleSeen.add(o.id);
        continue;
      }
      if (drawnByRoom?.has(o.id)) continue;
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
      if (o.away || o.vessel || o.terminalVehicle) continue;
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
          : o.resource && (o.inventory[o.resource.item] ?? 0) <= 3 && ["ecology-greens", "ecology-roots", "ecology-acorns"].includes(o.sprite)
            ? o.sprite + "-thin"
          : o.resource && o.depleted && o.sprite === "ecology-berry-bush"
            ? "ecology-berry-bush-picked"
            : o.kind === "gate"
              ? o.sprite.replace(/-open$/, "") + (o.open ? "-open" : "")
              : o.tipped
                ? this.layerOf(o.sprite, "fallen") ?? o.sprite
                : o.lean
                  ? this.layerOf(o.sprite, o.lean < 0 ? "lean-left" : "lean-right") ?? o.sprite
                  : this.propState(o)
                    ? this.propState(o)!
                  : o.sprite === "crate"
                    ? crateFrame(random(e.state.manifest.seed, "crate-art", o.id))
                    : o.curing ? "harbor-fish-shed-"+(!o.curing.fish ? 0 : o.curing.count!+(e.state.clock>=o.curing.ready! ? 3 : 0))
                    : o.quayGoods ? o.sprite.slice(0,-1)+o.quayGoods.reduce((mask,id,i)=>mask|Number((o.inventory[id]??0)>0)<<i,0)
                    : o.quayStock ? o.sprite.slice(0,-1)+Math.min(2,Math.ceil((o.inventory[o.quayStock.item]??0)/3))
                    : o.prop==="fishCounter" && o.sprite.startsWith("harbor-fish-") ? "harbor-fish-counter-"+Number(Object.entries(o.inventory).some(([id,n])=>id.startsWith("fish-") && n!>0))
                    : o.prop==="grainHoist" && o.hoistedAt!==undefined && e.state.clock-o.hoistedAt<42 ? "harbor-grain-hoist-"+(1+Math.min(6,Math.floor(Math.max(0,e.state.clock-o.hoistedAt)/6)))
                    : o.prop==="clothCounter" ? "harbor-cloth-counter-"+(Number((o.inventory.cloth??0)>0)*2 + Number((o.inventory["cloth-bolt"]??0)>0))
                    : o.lighterage ? o.sprite.slice(0,-1)+Math.min(3,o.inventory[o.lighterage.cargo]??0)
                    : worksiteVariantFrame(
                        mooredBoatFrame(o.sprite, random(e.state.manifest.seed, "boat-finish", o.owner ?? o.id)),
                        random(e.state.manifest.seed, "worksite-art", o.id),
                        (f) => this.sheetFrames?.has(f) || this.textures.get(this.texture(f)).has(f),
                      ),
        o.prop === "outcrop" && o.size
          ? { ...o.pos, x: o.pos.x + (o.size[0] - 1) / 2, y: o.pos.y + o.size[1] - 1 }
          : o.pos,
      );
      if(o.motor)this.entities.get(o.id)?.setData("motor",o.motor);
      if (boatCraft(o.sprite) || o.sprite.startsWith("boat-")) {
        const hull = this.entities.get(o.id);
        if (hull) {
          const bCell = w.topography?.(Math.round(o.pos.x), Math.round(o.pos.y));
          const inWater = bCell
            ? bCell.surface === "water" || (bCell.waterVisual?.distance ?? 9) < 1.4
            : w.terrain(Math.round(o.pos.x), Math.round(o.pos.y)) === "water";
          drawBoatGrounding(this, hull, inWater);
        }
      }
      if (o.mooring) {
        const hull=this.entities.get(o.id)!;
        const x=o.mooring.x*16+8, y=o.mooring.y*16+8;
        const mCell = w.topography?.(o.mooring.x, o.mooring.y);
        const stake = mCell ? !mCell.bridge : w.terrain(o.mooring.x, o.mooring.y) !== "bridge";
        drawMooring(this,hull,x,y-this.lift(x,y)-(stake ? 0 : 5),o.sprite,!!this.options.freeze,stake);
      }
      // A sign off the wall drops its shadow on the wall behind it.
      if (o.prop?.startsWith("wallsign-")) {
        renderEntity(`${o.id}:wall`, o.sprite, o.pos, false, o.id, false, true);
        const sign = this.entities.get(o.id), cast = this.entities.get(`${o.id}:wall`);
        if (sign && cast)
          cast.setPosition(sign.x + 2, sign.y + 3).setTintFill(0x342246).setAlpha(0.38).setDepth(sign.depth - 0.5);
      }
      // Dung and remains are drawn at world size and lie too flat to cast a shadow.
      if (o.dung || o.remains) this.shadows.get(o.id)?.setVisible(false);
      if (o.prop && propDefs[o.prop]?.underfoot) this.entities.get(o.id)?.setData("underfoot", true);
      // A pebble on the ground is a pebble, not the boulder its art was cut from.
      else if (o.kind === "item") {
        this.entities.get(o.id)?.setScale(ITEM_SCALE);
        this.shadows.get(o.id)?.setScale(ITEM_SCALE);
      }
      if (o.projectile) {
        const im = this.entities.get(o.id);
        if (im) {
          this.tweens.killTweensOf(im);
          const shaft = o.item === "arrow" || o.item === "bolt" || o.item === "dart";
          if (shaft) im.setTexture(projectileArrowTexture(this, o.item as "arrow"));
          im.setData("projectile", true);
          im.setOrigin(0.5, 0.5)
            .setScale(shaft ? 1 : (o.item === "stick" || o.prop === "stick" ? 14 : 24) / im.height)
            .setRotation(Math.atan2(o.projectile.dy, o.projectile.dx) + (shaft ? 0 : Math.PI / 2))
            .setPosition(o.pos.x * 16 + 8, o.pos.y * 16 + 11 - this.lift(o.pos.x * 16 + 8, o.pos.y * 16 + 16));
          this.shadows.get(o.id)?.setVisible(false);
        }
      } else if (this.entities.get(o.id)?.getData("projectile")) {
        this.entities.get(o.id)!.setData("projectile", false)
          .setOrigin(0.5, 1).setRotation(0).setScale(o.kind === "item" ? ITEM_SCALE : 1)
          .setPosition(o.pos.x * 16 + 8, o.pos.y * 16 + 16 - this.lift(o.pos.x * 16 + 8, o.pos.y * 16 + 16));
        this.shadows.get(o.id)?.setVisible(true);
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
      else if (freshCarcass(o, e.state.clock)) at(o.id, o.pos, 8);
      else if (o.item === "meat" || o.item === "fish") at(o.id, o.pos, 4);
      else if (o.prop && flyProps[o.prop]) at(o.id, o.pos, flyProps[o.prop]);
    }
    if (economy)
      for (const h of e.state.households ?? []) {
        const store = obs.objects.find((o) => o.id === h.storeId);
        if (store?.pos.space === "outside" && shownStock(economy, h).some((i) => i === "meat" || i === "fish"))
          at(`${store.id}:stall`, store.pos, 5);
      }
    const remains: RemainsSource[] = [];
    for (const o of obs.objects)
      if (
        o.pos.space === "outside" &&
        !o.carriedBy &&
        (o.remains === "feathers" ||
          freshCarcass(o, e.state.clock) ||
          o.sprite === "nature-remains-carcass-picked")
      )
        remains.push({
          id: o.id,
          x: o.pos.x * 16 + 8,
          y: o.pos.y * 16 + (o.remains === "feathers" ? 12 : 6),
          kind: o.remains === "feathers" ? "feathers" : "carcass",
          colour: FEATHER_COLOURS[o.sprite.split("-").pop()!],
        });
    this.remainsLife?.set(remains, this.light.id !== "night");
    const sky = this.weather;
    this.flies?.set(
      flySources,
      !sky || this.light.id === "night" || sky.condition === "rain" || sky.condition === "snow"
        ? 0
        : Math.max(0, Math.min(1, (sky.tempC - 8) / 14)),
    );
    this.heldSprites.clear();
    this.loadWeights.clear();
    // An item taken in hand is drawn the same way a carried prop is, but a
    // real object in the hand wins.
    const fieldLoad = e.fieldLoad(e.state.workday?.field?.job);
    for (const a of [e.state.player, ...e.state.actors]) {
      const held = (a.deliveryLoad ? (e.world.anchorage?.()?.cargo==="grain" ? "prop:sack@hand" : carryKit(e.world.pack).bundle) : a.heldItem) ?? (a.id === "player" && (a.basket || e.state.workday?.patch && e.state.economy?.work?.stage === 1) ? e.gatheringBasket() : a.id === "player" ? fieldLoad : undefined);
      if (!held) continue;
      const load = parseLoad(held);
      const sprite = load && portableProps.find(p => p.id === load.prop)?.sprite.replace(/-0$/, `-${load.variant}`);
      this.heldSprites.set(a.id, sprite ? `${sprite}${a.basket && load?.prop === "basket" ? `+${a.basket.item}+${a.basket.count >= 4 ? 2 : 1}` : ""}@${load!.style}` : `icon:${held}`);
      if (load || /^(wood|basket|vessel|bundle|grain|water)$/.test(held)) this.loadWeights.set(a.id, 1);
    }
    for (const object of e.state.objects)
      if (object.carriedBy) {
        this.heldSprites.set(object.carriedBy, object.sprite);
        this.loadWeights.set(object.carriedBy, (propDefs[object.prop ?? ""]?.shove?.mass ?? 1) >= 2 ? 2 : 1);
      }
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
    this.entities.get("player")?.setVisible(!e.state.player.drivingVehicle);
    this.shadows.get("player")?.setVisible(!e.state.player.drivingVehicle);
    this.faunaSprites.clear();
    this.stunned.clear();
    const struck = this.combat().pending(rt.swingEffect, rt.throwEffect);
    for (const g of [...(e.state.fauna ?? []), ...this.testFauna]) {
      if (
        g.hitch || Math.abs(g.pos.x - p.x) > range ||
        Math.abs(g.pos.y - p.y) > range ||
        (g.burrowed ?? 0) > e.state.clock
      )
        continue;
      // Four-direction species have an authored frame per facing; the rest
      // are side views flipped for west.
      const turns = Boolean(faunaProfile(g.speciesId)?.directions);
      for (const [i, m] of g.members.entries()) {
        const id =
          m.n === undefined ? `${g.id}-${i}` : faunaSpriteId(g.id, m.n);
        const at = { x: m.x, y: m.y, space: "outside" };
        const drawn = this.faunaMotion.walking(id) && this.faunaMotion.at(id);
        if (!visible(at) && !(drawn && visible({ x: drawn.x / 16, y: drawn.y / 16, space: "outside" }))) continue;
        const trail = e.faunaTrails.get(id), seen = this.faunaSeen.get(id);
        const fresh = trail && seen !== undefined ? trail.filter((q) => q.clock > seen) : [];
        if (trail) this.faunaSeen.set(id, trail.at(-1)!.clock);
        // Fright runs through a herd from the side the player is on.
        const fright = Math.hypot(m.x - p.x, m.y - p.y);
        this.faunaMotion.aim(
          id,
          m.x * 16 + 8,
          m.y * 16 + 16,
          URGENT.has(g.state),
          !!this.options.freeze || !this.entities.has(id),
          Math.min(0.5, Math.max(0, fright - 2) * 0.07),
          // A block of several ticks is walked in the real time it stands for.
          fresh.length > 1
            ? {
                points: fresh.map((q) => ({ x: q.x * 16 + 8, y: q.y * 16 + 16 })),
                seconds: Math.min(4, (fresh.at(-1)!.clock - fresh[0].clock + 6) / rt.ambientRate),
              }
            : undefined,
        );
        const phase = this.poseOffset(id) % 8;
        const facing = FACINGS[m.direction] ?? "east";
        const art = this.animalArt(g, id);
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
        // Shied off by someone walking through: a flapping hop away.
        const shied = m.shy?.until ?? 0, wasShy = this.shied.get(id);
        if (wasShy !== undefined && shied > wasShy && shied > e.state.clock) {
          this.faunaMotion.hurry(id);
          this.faunaMotion.leap(id, 5, 0.26);
          this.feel.puff(im.x, im.y, FAUNA_DUST, 2);
        }
        this.shied.set(id, shied);
        // Not until whatever did it has actually arrived.
        if ((m.stun ?? 0) > e.state.clock + 6 && !struck.has(id))
          this.stunned.add(id);
        const tier = TIERS[m.tier ?? "ordinary"];
        const scale = tier.scale * (faunaProfile(g.speciesId)?.scale ?? 1) * (m.young ? 0.6 : 1);
        if (im.getData("tier") !== scale)
          im.setData("tier", scale).setScale(scale);
        if (tier.tint !== 0xffffff) im.setTint(mixTint(this.tint, tier.tint));
        const wet = (m.muddy ?? 0) - e.state.clock;
        if (wet > 0) im.setTint(mixTint(this.tint, muddied(wet / MUD_DRIES)));
        // A mad dog's coat goes dull and staring.
        if (g.rabid) im.setTint(mixTint(this.tint, 0xc8c2a0));
        const flip = !turns && m.direction === 3;
        if (im.flipX !== flip) im.setFlipX(flip);
        // Three clear rows under the hooves in every study frame.
        im.setOrigin(0.5, (im.frame.height - 3) / im.frame.height);
        this.faunaSprites.set(id, {
          species: g.speciesId,
          state: m.pose ?? g.state,
          phase,
          facing,
          scale,
          art,
          sunk:
            !!faunaProfile(g.speciesId)?.wallows &&
            (g.state === "rest" || g.state === "idle") &&
            wallowable(w.topography?.(m.x, m.y)),
          young: !!m.young,
          sentinel:
            i === 0 &&
            g.members.length > 1 &&
            faunaProfile(g.speciesId)?.category === "wild" &&
            faunaProfile(g.speciesId)?.social === "herd" &&
            (g.state === "graze" || g.state === "forage"),
        });
      }
    }
    this.faunaMotion.keep(this.faunaSprites);
    for (const id of this.faunaMood.keys())
      if (!this.faunaSprites.has(id)) this.faunaMood.delete(id);
    for (const id of this.faunaSeen.keys())
      if (!this.faunaSprites.has(id)) this.faunaSeen.delete(id);
    for (const id of this.shied.keys()) if (!this.faunaSprites.has(id)) this.shied.delete(id);
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
      c.startFollow(this.entities.get("player")!, this.liveGraphics.roundPixels, 0.4, 0.4);
    this.cycle.sweepParked(cycleSeen);
    for (const [id, image] of this.entities)
      if (!keep.has(id)) {
        this.cycle.drop(id);
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
        this.mountedRiders.get(id)?.destroy();
        this.mountedRiders.delete(id);
        this.motions.delete(id);
        this.quenchFire(id);
        this.douseLamp(id);
        this.crafts.get(id)?.dispose();
        this.fishingGear.remove(id);
        this.crafts.delete(id);
        this.entities.delete(id);
        this.destinations.delete(id);
        this.actorFrames.delete(id);
        this.footfalls.delete(id);
        this.workBeats.delete(id);
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
    this.placeLodgedProjectiles();
    this.washKey = "";
    this.paintWash();
    this.game.canvas.dataset.lighting = this.light.id;
  }
  /** A house with a generated room is drawn from it: the hand-drawn pixels,
   * with a light layer over the room and its people, redrawn for fire, light and weather. */
  private syncRoom(delta: number) {
    const e = this.runtime.engine, space = e.state.player.pos.space;
    const room = space === "outside" ? undefined : e.interiorOf?.(space);
    setCropsIndoors(this, space !== "outside");
    if (!room) return this.dropRoom();
    let v = this.roomView;
    if (!v || v.space !== space) {
      this.dropRoom();
      const canvas = document.createElement("canvas"), cut = document.createElement("canvas");
      const pixel = new PixelRoom(canvas, cut);
      pixel.lighting = "layer";
      const layer = () => document.createElement("canvas").getContext("2d")!;
      pixel.layers = { light: layer(), add: layer(), glow: layer() };
      const props = room.props.map((q) => ({ ...q }));
      pixel.set(room.params, props, room.plan);
      // Sized before Phaser takes them as textures, which keep the size they start with.
      for (const c of Object.values(pixel.layers)) (c.canvas.width = pixel.W), (c.canvas.height = pixel.H);
      const key = `interior-room-${space}`;
      for (const k of [key, `${key}-cut`, `${key}-light`, `${key}-add`, `${key}-glow`]) releaseTexture(this, k);
      const texture = this.textures.addCanvas(key, canvas)!;
      const sheet = this.textures.addCanvas(`${key}-cut`, cut)!;
      const image = this.add
        .image(ROOM_ORIGIN * 16 - FLOOR_X, ROOM_ORIGIN * 16 - FLOOR_Y, key)
        .setOrigin(0, 0)
        .setDepth(-99990);
      const cutouts = new Map(
        pixel.cutouts.map((c) => {
          sheet.add(String(c.id), 0, c.ax, c.ay, c.w, c.h);
          return [c.id, this.add.image(0, 0, sheet.key, String(c.id)).setOrigin(0, 0)] as const;
        }),
      );
      // Over everyone in the room but under the markers and labels drawn at y + 4000.
      const light = (["light", "add", "glow"] as const).map((k, i) =>
        this.add
          .image(image.x, image.y, this.textures.addCanvas(`${key}-${k}`, pixel.layers![k].canvas)!.key)
          .setOrigin(0, 0)
          .setDepth(3000 + i)
          .setBlendMode([Phaser.BlendModes.MULTIPLY, Phaser.BlendModes.ADD, Phaser.BlendModes.NORMAL][i]),
      );
      v = this.roomView = { space, pixel, light, key, texture, image, litAt: -99, props, sheet, cutouts, stamp: "", wait: 0 };
      // A room has its own light; the moon stays outside.
      this.applyGrade(0);
    }
    const camera = this.cameras.main;
    const width = Math.max(v.pixel.W + 32, camera.displayWidth);
    const height = Math.max(v.pixel.H + 32, camera.displayHeight);
    camera.setBounds(
      v.image.x + (v.pixel.W - width) / 2,
      v.image.y + (v.pixel.H - height) / 2,
      width,
      height,
    );
    // Furniture stands where the engine has it, and lies as the engine left it.
    const byId = new Map(e.state.objects.filter((o) => o.prop).map((o) => [o.id, o]));
    const external = new Map<number, WorldObject>();
    const atlasPiece = (id: number, o: WorldObject | undefined) => {
      const q = v!.props[id];
      q.external = !!o && !!propDefs[o.prop ?? ""]?.sprite && !o.broken;
      if (q.external && o) external.set(id,o);
    };
    let stamp = "";
    for (const f of room.furniture) {
      const o = byId.get(`${space}-room-${f.propId}`), q = v.props[f.propId];
      q.x = (o?.pos.x ?? f.pos.x) - ROOM_ORIGIN;
      q.y = (o?.pos.y ?? f.pos.y) - ROOM_ORIGIN;
      // A lamp has its own broken look; everything else goes to pieces.
      q.wrecked = (!o || !!o.broken) && q.kind !== "lamp";
      if (q.kind === "lamp" && (!o || o.broken)) (q.broken = true), (q.on = false);
      q.tipped = !!o?.tipped;
      q.lean = o?.lean;
      atlasPiece(f.propId,o);
      if (q.external && (o?.carriedBy || o?.pos.space !== space)) q.wrecked=true;
      stamp += `${q.x},${q.y},${q.wrecked ? 1 : 0}${q.broken ? 1 : 0}${q.tipped ? 1 : 0}${q.external ? 1 : 0};`;
    }
    const store = byId.get(`${space}-chest`);
    const storePiece = room.props.find(q => ["chest","jars","crate","sacks"].includes(q.kind) &&
      room.store.x-ROOM_ORIGIN >= q.x && room.store.x-ROOM_ORIGIN < q.x+q.w &&
      room.store.y-ROOM_ORIGIN >= q.y && room.store.y-ROOM_ORIGIN < q.y+Math.max(1,q.d));
    if (storePiece) {
      atlasPiece(storePiece.id,store);
      const q = v.props[storePiece.id];
      if (q.external && store) {
        q.x=store.pos.x-ROOM_ORIGIN; q.y=store.pos.y-ROOM_ORIGIN;
        q.wrecked=!!store.carriedBy || store.pos.space !== space;
      }
      stamp += `store:${q.x},${q.y},${q.external ? 1 : 0},${q.wrecked ? 1 : 0};`;
    }
    const work = byId.get(`${space}-work`), workCell = room.benchCell ?? room.workCell;
    const workPiece = room.props.find(q => ["fixture","anvil","throw"].includes(q.kind) &&
      workCell.x-ROOM_ORIGIN >= q.x-1 && workCell.x-ROOM_ORIGIN <= q.x+q.w &&
      workCell.y-ROOM_ORIGIN >= q.y-1 && workCell.y-ROOM_ORIGIN <= q.y+Math.max(1,q.d));
    if (workPiece) {
      atlasPiece(workPiece.id,work);
      const q = v.props[workPiece.id];
      if (q.external && work) {
        q.x=work.pos.x-workCell.x+workPiece.x; q.y=work.pos.y-workCell.y+workPiece.y;
        q.wrecked=!!work.carriedBy || work.pos.space !== space;
      }
      stamp += `work:${q.x},${q.y},${q.external ? 1 : 0},${q.wrecked ? 1 : 0};`;
    }
    // Sleepers: the room draws them under the covers, and each head goes on its pillow.
    for (const q of v.props) q.sleepers = undefined;
    v.pixel.floorSleepers = [];
    this.pillows.clear();
    for (const a of e.state.actors) {
      if (a.pos.space !== space || a.kind !== "human") continue;
      const use = e.indoorUse(a.id, a.pos);
      if (use?.role !== "bed") continue;
      const q = v.props[use.propId];
      const k = q ? (q.sleepers = (q.sleepers ?? 0) + 1) - 1 : 0;
      if (q && k > 1) continue;
      const cell = { x: a.pos.x - ROOM_ORIGIN, y: a.pos.y - ROOM_ORIGIN };
      if (!q) v.pixel.floorSleepers.push(cell);
      const at = v.pixel.pillow(q ? { propId: q.id, k } : cell);
      const row = q ? q.y + Math.max(1, q.d) - 1 : cell.y;
      this.pillows.set(a.id, { x: v.image.x + at.x, y: v.image.y + at.y, depth: (ROOM_ORIGIN + row) * 16 + 9 - k * 0.1 });
    }
    const hour = (this.runtime.displayClock() / 3600) % 24;
    room.params.hour = hour;
    const relit = v.litAt === -99 || stamp !== v.stamp;
    v.litAt = hour;
    v.stamp = stamp;
    for (const c of v.pixel.cutouts) {
      const at = v.pixel.cutoutAt(c), q = v.props[c.id];
      const o = external.get(c.id), image = v.cutouts.get(c.id)!;
      if (o) {
        image.setTexture(this.texture(o.sprite),o.sprite);
        if (image.getData("room-target") !== o.id) {
          this.makeSelectable(image,o.id);
          image.setData("room-target",o.id);
        }
        if (image.frame.customPivot) image.setOriginFromFrame();
        else image.setOrigin(.5,1);
        image.setPosition(v.image.x+at.x+8+q.w*8,v.image.y+at.y+c.h-2)
          .setDepth((ROOM_ORIGIN+q.y+Math.max(1,q.d)-1)*16+8)
          .setVisible(!o.carriedBy && !q.wrecked);
        continue;
      }
      image.setTexture(v.sheet.key,String(c.id)).setOrigin(0,0);
      // In front of anyone a row back; behind anyone level with it, who is sat on it or beside it.
      v.cutouts.get(c.id)!
        .setPosition(v.image.x + at.x, v.image.y + at.y)
        .setDepth((ROOM_ORIGIN + q.y + Math.max(1, q.d) - 1) * 16 + 8)
        .setVisible(!q.wrecked);
    }
    // Firelight flickers well at thirty frames a second, and the room is repainted whole.
    const dt = this.options.freeze ? 0 : Math.min(0.1, delta / 1000);
    v.wait += dt;
    if (v.wait < 1 / 30 && !relit) return;
    v.pixel.frame(v.wait);
    v.wait = 0;
    v.texture.refresh();
    v.sheet.refresh();
    for (const im of v.light) (im.texture as Phaser.Textures.CanvasTexture).refresh();
  }
  /** Underground the level paints and lights itself; the scene lends it the
   * player's position, the animals' drawn frames and the sound. */
  private syncCave(delta: number) {
    const e = this.runtime.engine, space = e.state.player.pos.space;
    const level = e.caveOf?.(space), run = e.state.complex?.kind === "cave" ? e.state.complex : undefined;
    if (!level || !run) {
      if (this.caveView) gameAudio()?.setUnderground(undefined);
      this.caveView?.destroy();
      this.caveView = undefined;
      return;
    }
    let v = this.caveView;
    if (!v || v.space !== space) {
      v?.destroy();
      v = this.caveView = new CaveView(this, level);
      v.sound = (what, volume) => void gameAudio()?.caveCue(what, volume);
      if (import.meta.env.DEV) (window as unknown as { uhsCave?: typeof CaveView }).uhsCave = CaveView;
      this.applyGrade(0);
    }
    const camera = this.cameras.main;
    const W = level.w * 16, H = level.h * 16;
    const width = Math.max(W, camera.displayWidth), height = Math.max(H, camera.displayHeight);
    camera.setBounds((W - width) / 2, (H - height) / 2, width, height);
    const me = this.entities.get("player");
    const p = e.state.player;
    const carried: { x: number; y: number }[] = [];
    for (const a of e.state.actors)
      if (a.underground && a.heldItem === "torch" && a.pos.space === space) {
        const im = this.entities.get(a.id);
        carried.push({ x: im?.x ?? a.pos.x * 16 + 8, y: im?.y ?? a.pos.y * 16 + 16 });
      }
    v.update({
      x: me?.x ?? p.pos.x * 16 + 8,
      y: me?.y ?? p.pos.y * 16 + 16,
      facing: p.direction,
      run,
      carried,
      done: e.state.complexes?.[`cave:${level.cave}`]?.done ?? [],
      light: caveLight(run.light),
      hour: (((e.state.clock / 3600) % 24) + 24) % 24,
      time: this.time.now,
      delta,
      beast: (species, state, dir, stride) => {
        const frame = this.faunaFrame(species, state as FaunaState, 0, (["north", "east", "south", "west"] as const)[dir] ?? "south", stride);
        const texture = this.texture(frame);
        return texture === "__DEFAULT" || !this.textures.get(texture).has(frame) ? undefined : { texture, frame };
      },
    });
    // The stream is loud where it runs close; still caves have far drips, and
    // lava tubes and fissures a draught.
    const cx = Math.floor((me?.x ?? p.pos.x * 16 + 8) / 16), cy = Math.floor(((me?.y ?? p.pos.y * 16 + 16) - 1) / 16);
    let near = 99;
    for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) {
      const x = cx + dx, y = cy + dy;
      if (x >= 0 && y >= 0 && x < level.w && y < level.h && level.flow[y * level.w + x] >= 0) near = Math.min(near, Math.hypot(dx, dy));
    }
    const room = { karst: 0.75, sandstone: 0.45, lava: 0.6, fissure: 0.55, sea: 0.5, ice: 0.85 }[level.kind];
    gameAudio()?.setUnderground({
      place: "cave",
      flow: level.stream ? Math.max(0.1, 1 - near / 9) : 0,
      echo: Math.min(1, room + level.depth * 0.05),
      surge: 0,
      drips: level.kind === "lava" || level.kind === "sandstone" ? 0.25 : 0.8,
      draught: { karst: 0.1, sandstone: 0.2, lava: 0.8, fissure: 0.5, sea: 0.35, ice: 0.3 }[level.kind],
    });
  }
  private lidHoles = new Map<string, Phaser.GameObjects.Image>();
  /** Manholes left open in the street: the hole, and the lid lying beside it. */
  private syncLids() {
    const e = this.runtime.engine;
    const open = e.state.player.pos.space === "outside" ? e.state.lids ?? {} : {};
    for (const [k, im] of this.lidHoles) if (!(k in open)) im.destroy(), this.lidHoles.delete(k);
    for (const k of Object.keys(open)) {
      if (this.lidHoles.has(k)) continue;
      const [x, y] = k.split(",").map(Number);
      const lane = e.world.topography?.(x, y)?.lane;
      const lid = lane && laneLids(lane, x, y)[0];
      if (!lid) continue;
      if (!this.textures.exists("sewer-open-lid")) paintOpenLid(this.textures.createCanvas("sewer-open-lid", 32, 16)!);
      // Above the ground strips (row*16 - 7) the hole overlaps.
      this.lidHoles.set(k, this.add.image(Math.round(lid.cx) - 8, Math.round(lid.cy - this.lift(lid.cx, lid.cy)) - 8, "sewer-open-lid").setOrigin(0, 0).setDepth(Math.floor((lid.cy + 8) / 16) * 16 - 6.6));
    }
  }
  private syncSewer(delta: number) {
    const e = this.runtime.engine, space = e.state.player.pos.space;
    const level = e.sewerOf?.(space), run = e.state.complex?.kind === "sewer" || e.state.complex?.kind === "mine" ? e.state.complex : undefined;
    if (!level || !run) {
      if (this.sewerView) gameAudio()?.setUnderground(undefined);
      this.sewerView?.destroy();
      this.sewerView = undefined;
      return;
    }
    let v = this.sewerView;
    if (!v || v.space !== space) {
      v?.destroy();
      v = this.sewerView = new SewerView(this, level, e.state.manifest.setting?.year ?? 1950);
      v.sound = (what, volume) => void gameAudio()?.sewerCue(what, volume);
      if (import.meta.env.DEV) (window as unknown as { uhsSewer?: typeof SewerView }).uhsSewer = SewerView;
      this.applyGrade(0);
    }
    const camera = this.cameras.main;
    const W = level.w * 16, H = level.h * 16;
    const width = Math.max(W, camera.displayWidth), height = Math.max(H, camera.displayHeight);
    camera.setBounds((W - width) / 2, (H - height) / 2, width, height);
    const me = this.entities.get("player");
    const p = e.state.player;
    const carried: { x: number; y: number }[] = [];
    for (const a of e.state.actors)
      if (a.underground && a.heldItem === "torch" && a.pos.space === space) {
        const im = this.entities.get(a.id);
        carried.push({ x: im?.x ?? a.pos.x * 16 + 8, y: im?.y ?? a.pos.y * 16 + 16 });
      }
    const x = me?.x ?? p.pos.x * 16 + 8, y = me?.y ?? p.pos.y * 16 + 16;
    v.update({
      x, y, facing: p.direction, run,
      done: e.state.complexes?.[`${level.network}:${level.site}`]?.done ?? [],
      light: caveLight(run.light),
      hour: (((e.state.clock / 3600) % 24) + 24) % 24,
      time: this.time.now,
      delta,
      open: new Set(Object.keys(e.state.lids ?? {})),
      carried,
      clock: this.runtime.displayClock(),
      solid: e.sewerSolid(space),
      falls: e.state.mineFalls?.[space] ?? [],
    });
    // The water is loud where it runs close, and the trunk is a big room.
    const cx = Math.floor(x / 16), cy = Math.floor((y - 1) / 16);
    let near = 9;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const c = level.cells[(cy + dy) * level.w + cx + dx];
      if (c === 2 || c === 3) near = Math.min(near, Math.hypot(dx, dy));
    }
    // A working mine: its gutter, far picks and pumps, the ventilation drawing through; the old workings dead still.
    if (level.network === "mine") gameAudio()?.setUnderground({ place: "mine", flow: Math.max(0.1, 1 - near / 6) * 0.6, echo: level.kind === "salt" ? 0.9 : 0.45, surge: level.depth < 3 ? 0.7 : 0, drips: level.depth === 3 ? 0.8 : 0.35, draught: level.depth < 3 ? 0.5 : 0.1 });
    else gameAudio()?.setUnderground({ place: "sewer", drips: 0, draught: 0, flow: Math.max(0.15, 1 - near / 7) * (level.layer === "old" ? 0.5 : 1), echo: level.layer === "trunk" ? 1 : level.layer === "old" ? 0.6 : 0.35, surge: run.surge });
  }
  /** A fair's or a tomb's area paints itself; the scene lends it the player's position and the lamp. */
  private syncArea(delta: number) {
    const e = this.runtime.engine, space = e.state.player.pos.space;
    const level = e.areaOf?.(space);
    if (!level) {
      if (this.areaView instanceof TombView) gameAudio()?.setUnderground(undefined);
      this.areaView?.destroy();
      this.areaView = undefined;
      return;
    }
    let v = this.areaView;
    if (!v || v.space !== space) {
      v?.destroy();
      v = this.areaView = "fair" in level
        ? new FairView(this, level as FairLevel, (frame) => this.texture(frame), (image, id) => this.makeSelectable(image, id, false, true))
        : "prison" in level
          ? new PrisonView(this, level as PrisonLevel)
          : new TombView(this, level as TombLevel);
      if (import.meta.env.DEV) (window as unknown as { uhsTomb?: typeof TombView }).uhsTomb = TombView;
      this.applyGrade(0);
    }
    const camera = this.cameras.main;
    const b = v.bounds, width = Math.max(b.w, camera.displayWidth), height = Math.max(b.h, camera.displayHeight);
    camera.setBounds(b.x + (b.w - width) / 2, b.y + (b.h - height) / 2, width, height);
    if (v instanceof FairView) return void v.update({ clock: this.runtime.displayClock(), time: this.time.now });
    if (v instanceof PrisonView) {
      const pr = e.state.complex?.kind === "prison" ? e.state.complex : undefined;
      return void v.update({
        done: pr ? e.state.complexes?.[`prison:${pr.site}`]?.done ?? [] : [],
        pry: pr?.pry ?? 0,
        grate: pr?.grate ?? 0,
        hasKey: !!pr?.hasKey,
        clock: this.runtime.displayClock(),
        time: this.time.now,
      });
    }
    const run = e.state.complex?.kind === "tomb" ? e.state.complex : undefined, me = this.entities.get("player"), p = e.state.player;
    if (!run) return;
    v.update({
      x: me?.x ?? p.pos.x * 16 + 8, y: me?.y ?? p.pos.y * 16 + 16, facing: p.direction, light: caveLight(run.light), left: run.left,
      done: e.state.complexes?.[`tomb:${run.site}`]?.done ?? [], hour: (((e.state.clock / 3600) % 24) + 24) % 24, time: this.time.now, delta,
    });
    gameAudio()?.setUnderground({ place: "cave", flow: 0, echo: 0.55, surge: 0, drips: 0, draught: 0.05 });
  }
  /** Aboard ship the deck paints and lights itself, with the sea going by round it. */
  private syncShip(delta: number) {
    const e = this.runtime.engine, space = e.state.player.pos.space;
    const level = e.shipOf?.(space), look = e.shipLook?.();
    if (!level || !look) {
      this.shipView?.destroy();
      this.shipView = undefined;
      return;
    }
    let v = this.shipView;
    if (!v || v.space !== space) {
      v?.destroy();
      const s = e.state.manifest.setting;
      v = this.shipView = new ShipView(this, level, look, s?.year ?? 1800, s?.lat ?? 40);
      this.applyGrade(0);
    }
    const camera = this.cameras.main;
    const W = level.w * 16, H = level.h * 16;
    const width = Math.max(W, camera.displayWidth), height = Math.max(H, camera.displayHeight);
    camera.setBounds((W - width) / 2, (H - height) / 2, width, height);
    const me = this.entities.get("player"), p = e.state.player;
    v.update({ x: me?.x ?? p.pos.x * 16 + 8, y: me?.y ?? p.pos.y * 16 + 16, clock: this.runtime.displayClock(), time: this.time.now, delta });
  }
  private dropRoom() {
    const v = this.roomView;
    if (!v) return;
    v.image.destroy();
    for (const im of [...v.cutouts.values(), ...v.light]) im.destroy();
    for (const k of [v.key, v.sheet.key, ...["light", "add", "glow"].map((k) => `${v.key}-${k}`)]) releaseTexture(this, k);
    this.roomView = undefined;
    this.washKey = "";
  }

  private paintWash() {
    const clock = this.options.lighting
      ? lightingPreset(this.options.lighting).hour * 3600
      : this.runtime.displayClock();
    const w = washAt(clock);
    // Orbit, the deep and the mist keep their own light, whatever the hour at the port.
    const graded = this.options.colorGrade !== false && !this.shipView?.level.hull.medium;
    // Fog and falling snow already lift and grey the view; the grade's own
    // lift and overcast grey on top of them flattened it to slate.
    const haze = graded && (this.weather?.condition === "mist" || this.weather?.condition === "snow") ? 1 : 0;
    const weather = this.weatherWash() * (1 - 0.67 * haze);
    const night = graded ? Phaser.Math.Clamp((w.alpha - 0.14) / 0.28, 0, 1) : 0;
    // Low sun is lost behind cloud.
    const golden = graded ? w.golden * 0.14 * (1 - weather / 0.3) : 0;
    const rainLamp = weather > 0.14 ? Math.min(1, (weather - 0.14) * 2.2) : 0;
    const lamps = graded ? Math.min(1, Math.max(w.lamps, rainLamp * 0.42)) : 0;
    const wetness = this.weather?.wetness ?? 0;
    const wetBoost = 1 + Math.min(0.32, wetness * 0.35);
    this.emberGlow = lamps;
    // Rooms go dark one at a time, so the hour is part of the key.
    const key = `${w.color}:${w.alpha.toFixed(3)}:${golden.toFixed(3)}:${weather.toFixed(3)}:${haze}:${lamps.toFixed(2)}:${Math.round(wetness * 10)}:${Math.floor(clock / 900)}:${this.snow}`;
    if (key === this.washKey) return;
    this.washKey = key;
    // Stacked multiply fills over white come to one colour: their product.
    const layers: [number, number][] = [[w.color, graded ? w.alpha : 0], [0xff9a4a, golden], [0x666d78, weather * 0.6]];
    this.washTint = [16, 8, 0].reduce(
      (tint, shift) =>
        tint | (Math.round(layers.reduce((v, [c, a]) => v * (1 - a + (a * ((c >> shift) & 255)) / 255), 255)) << shift),
      0,
    );
    // Night proper only: dusk keeps its colour.
    this.applyGrade(night, graded ? Math.min(1, weather / 0.3) : 0, graded ? gradeAt(clock) : undefined, 1 - haze);
    this.mist?.tint(night, graded ? w.golden * (1 - weather / 0.3) : 0);
    const hour = (((clock / 3600) % 24) + 24) % 24;
    for (const l of this.lamps) {
      const on = lamps > 0 && (l.lit?.(hour) ?? true);
      l.pane.setAlpha(lamps * (l.glass ?? 1)).setVisible(on);
      l.halo?.setAlpha(lamps * (l.glow ?? 0.6)).setVisible(on);
      for (const pool of l.pools ?? []) pool.setAlpha(lamps * (l.spill ?? 0.45)).setVisible(on);
      for (const g of l.ground ?? []) g.setAlpha(Math.min(1, lamps * (l.groundSpill ?? 0.45) * wetBoost)).setVisible(on);
    }
  }
  /** The wash over the camera's view with each fire and lamp's pool laid
   * into it, so where the light falls the scene is warmed, not darkened, and
   * the night grade, which spares warm colour, leaves it lit. Redrawn every
   * frame for the flicker; padded because the view is last frame's. */
  private washTexture(width: number, height: number) {
    return this.add
      .renderTexture(0, 0, width, height)
      .setOrigin(0)
      .setDepth(19000)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setVisible(false);
  }
  private paintLight() {
    if (this.washTint === 0xffffff) {
      this.night!.setVisible(false);
      return;
    }
    const v = this.cameras.main.worldView,
      pad = 48;
    // Quantize to 64px steps and only grow (or shrink when > 256px oversize)
    // so smooth zooming does not reallocate WebGL FBOs every frame.
    const w = Math.ceil((v.width + pad * 2) / 64) * 64,
      h = Math.ceil((v.height + pad * 2) / 64) * 64;
    const nw = this.night!.width,
      nh = this.night!.height;
    if (nw < w || nh < h || nw - w > 256 || nh - h > 256) {
      this.night!.destroy();
      this.night = this.washTexture(w, h);
    }
    const night = this.night!;
    const ox = Math.floor(v.x) - pad,
      oy = Math.floor(v.y) - pad;
    night.setPosition(ox, oy).setVisible(true).fill(this.washTint);
    const pools = [
      ...[...this.fires.values()].map((f) => f.pool),
      ...[...this.streetLights.values()].map((l) => l.pool),
      ...this.lamps.flatMap((l) => l.pools ?? []),
    ];
    for (const pool of pools) {
      if (!pool.visible || !pool.alpha) continue;
      const x = pool.x - ox,
        y = pool.y - oy;
      if (x < -pool.width / 2 || y < -pool.height / 2 || x > w + pool.width / 2 || y > h + pool.height / 2) continue;
      night.stamp(pool.texture.key, pool.frame.name, x, y, { alpha: pool.alpha });
    }
  }
  /** Lamps behind the glass of an occupied house after dark: most of them
   * in the evening, a few kept burning late. */
  private lightWindows(
    place: Place,
    placement: ReturnType<typeof buildingPlacement>,
    image: Phaser.GameObjects.Image,
  ) {
    // A voxel building lights a floor or a shop at a time, each on its hours.
    if ((placement.model as VoxelModel).lights) {
      const rooms = voxelLamps(this, image, placement.model as VoxelModel, this.runtime.engine.state.manifest.seed, place.id, (f) => this.texture(f));
      this.layers.push(...rooms.flatMap((r) => [r.pane, r.halo]));
      this.lamps.push(...rooms);
      this.washKey = "";
      return;
    }
    if ((placement.model as { unglazed?: boolean }).unglazed) return;
    const h = (((this.runtime.displayClock() / 3600) % 24) + 24) % 24;
    // Light cost money until it came down a wire: a candle-lit town went to
    // bed with the dark, and paraffin and gas kept it up later.
    const year = this.runtime.engine.world.pack.year;
    const [evening, bed, early, late] =
      year < 1700 ? [0.45, 21, 0.45, 0.06] : year < 1860 ? [0.55, 22, 0.5, 0.08] : year < 1910 ? [0.7, 22.5, 0.45, 0.12] : [0.8, 23.5, 0.5, 0.15];
    const share = h >= 17 && h < bed ? evening : h >= 4.5 && h < 8 ? early : late;
    if (random(this.runtime.engine.state.manifest.seed, "lamp", place.id) >= share) return;
    // A painter that draws its own lit rooms ships them as a frame beside the
    // building's; the rest are found in the art's glass.
    const authored = (placement.model as { glow?: string }).glow;
    // Not the building's own page: houses share one glow, packed beside the first.
    const [key, frame] = authored
      ? [this.texture(authored), authored]
      : [windowGlow(this, image.texture.key, image.frame.name, (placement.model as { door?: number[] }).door), undefined];
    if (!key) return;
    const soft = windowHalo(this, key, frame);
    const left = image.x - image.displayOriginX,
      top = image.y - image.displayOriginY;
    const at = (texture: string, depth: number) =>
      this.add.image(left - soft.pad, top - soft.pad, texture).setOrigin(0).setDepth(depth).setVisible(false);
    const pane = at(soft.pane, image.depth + 0.5);
    const halo = at(soft.key, 19001).setBlendMode(Phaser.BlendModes.ADD);
    const pools = soft.pools.map(({ x, w }) =>
      this.make.image(
        {
          x: Math.round(left + x),
          y: Math.round(top + image.height + 3),
          key: ensureLightMask(this, Math.min(40, Math.max(12, Math.round((w * 0.7) / 4) * 4)), WINDOW_TONE),
          frame: "0",
        },
        false,
      ),
    );
    const ground = soft.pools.map(({ x, w }) =>
      this.add
        .image(
          Math.round(left + x),
          Math.round(top + image.height + 5),
          ensureGroundSpill(this, Math.min(34, Math.max(16, Math.round((w * 0.9) / 4) * 4)), WINDOW_TONE),
          "0",
        )
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(image.depth + 0.15)
        .setVisible(false),
    );
    this.layers.push(pane, halo, ...pools, ...ground);
    // Glass found in the art keeps its mullions and reflections under the light.
    this.lamps.push({ pane, halo, pools, ground, glass: 0.65, glow: 0.58, spill: 0.55, groundSpill: 0.46 });
    this.washKey = "";
  }
  /** A lamp on the wall beside the door, from the years every house had one
   * wired: a fixture by day, and at night a glow and a pool on the step. Some
   * are left on all night; most go off when the house goes to bed. */
  private lightPorch(
    place: Place,
    placement: ReturnType<typeof buildingPlacement>,
    image: Phaser.GameObjects.Image,
  ) {
    const model = placement.model as { door?: number[]; doorLeaf?: boolean; unglazed?: boolean };
    const rect = model.door;
    if (!rect || model.doorLeaf === false || model.unglazed || this.runtime.engine.world.pack.year < 1950) return;
    const r = (k: string) => random(this.runtime.engine.state.manifest.seed, "porch", k, place.id);
    if (r("has") > 0.7) return;
    const left = image.x - image.displayOriginX,
      top = image.y - image.displayOriginY;
    // Beside the door at head height, on whichever side has wall.
    const side = rect[0] >= 6 ? rect[0] - 4 : rect[0] + rect[2] + 1;
    const x = Math.round(left + side),
      y = Math.round(top + rect[1] + 2);
    const fixture = this.add.image(x, y, ensurePorchLamp(this), "0").setOrigin(0, 0).setTint(this.tint).setDepth(image.depth + 1.05);
    const pane = this.add.image(x, y, ensurePorchLamp(this), "1").setOrigin(0, 0).setDepth(image.depth + 1.1).setVisible(false);
    const halo = this.add
      .image(x + 1.5, y + 2.5, ensureHalo(this, 14, PORCH_TONE), "0")
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(19001)
      .setVisible(false);
    const pool = this.make.image(
      { x: x + 1, y: Math.round(top + rect[1] + rect[3] + 3), key: ensureLightMask(this, 24, PORCH_TONE), frame: "0" },
      false,
    );
    const allNight = r("night") < 0.3,
      off = 22.5 + r("off") * 2;
    this.layers.push(fixture, pane, halo, pool);
    this.lamps.push({
      pane,
      halo,
      pools: [pool],
      glow: 0.7,
      spill: 0.7,
      lit: (h) => (h >= 17.8 || h < 6.2) && (allNight || (h >= 12 ? h : h + 24) < off),
    });
    this.washKey = "";
  }
  /** Warm hearth or oil-lamp light spilling from an occupied building's doorway
   * at dawn, evening, night, or gloomy rain — giving pre-modern and unglazed
   * dwellings warm pools on their doorsteps against cool weather. */
  private lightDoorway(
    place: Place,
    placement: ReturnType<typeof buildingPlacement>,
    image: Phaser.GameObjects.Image,
  ) {
    const model = placement.model as { door?: number[]; doorLeaf?: boolean; smoke?: unknown[] };
    const rect = model.door;
    if (!rect || rect[2] < 4 || rect[3] < 6) return;
    if (place.access !== "household" && !model.smoke?.length) return;
    const share = place.access === "household" ? 0.8 : 0.6;
    if (random(this.runtime.engine.state.manifest.seed, "door-hearth", place.id) >= share) return;
    const left = image.x - image.displayOriginX,
      top = image.y - image.displayOriginY;
    const dx = Math.round(left + rect[0]),
      dy = Math.round(top + rect[1]),
      dw = Math.round(rect[2]),
      dh = Math.round(rect[3]);
    const open = model.doorLeaf === false || !!this.runtime.engine.doorOf(place.id)?.open;
    const pane = this.add
      .image(dx, dy, ensureDoorGlow(this, dw, dh, HEARTH_TONE))
      .setOrigin(0, 0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(image.depth + 0.45)
      .setVisible(false);
    const radius = Math.min(36, Math.max(20, Math.round((dw * 1.6) / 4) * 4));
    const ground = this.add
      .image(dx + dw / 2, dy + dh + 5, ensureGroundSpill(this, radius, HEARTH_TONE), "0")
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(image.depth + 0.15)
      .setVisible(false);
    const pool = this.make.image(
      { x: Math.round(dx + dw / 2), y: Math.round(dy + dh + 4), key: ensureLightMask(this, radius + 6, HEARTH_TONE), frame: "0" },
      false,
    );
    this.layers.push(pane, ground, pool);
    this.lamps.push({
      pane,
      pools: [pool],
      ground: [ground],
      glass: open ? 0.85 : 0.52,
      spill: open ? 0.6 : 0.38,
      groundSpill: open ? 0.54 : 0.36,
      lit: (h) => h >= 16.8 || h < 7.6 || (this.weather?.condition === "rain" && (this.weather?.wetness ?? 0) > 0.25),
    });
    this.washKey = "";
  }
  /** Cloud and wet ground both take the light out of a scene. Ground the
   * player can see is soaked long after the shower has passed. */
  private weatherWash() {
    const w = this.weather;
    return w && this.options.colorGrade !== false ? cloudWash(w) : 0;
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
    const profile = faunaProfile(species);
    // A hen that runs down a mouse has no chase of its own: it runs as it flees.
    while (profile && !profile.art[state] && FALLBACK[state]) state = FALLBACK[state]!;
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
    const count = profile?.art[state]?.length || 8;
    const n = this.options.freeze
      ? 0
      : state === "pounce" && began !== undefined
        ? Math.min(count - 1, Math.floor((this.time.now - began) / ms))
        : Math.floor((stride ?? this.time.now / ms) + phase) % count;
    // A profile drawn with another species' study names that species in its
    // frames: "faunac-horse-idle-south-0" for a wild horse, "fauna-crow-forage-0"
    // for a rook.
    const first = profile?.art[state]?.[0]?.split("-");
    if (first && art === species)
      art = first.slice(1, profile?.directions ? -3 : -2).join("-");
    return profile?.directions
      ? `${first?.[0] ?? "faunac"}-${art}-${state}-${facing}-${n}`
      : `faunab-${art}-${state}-${n}`;
  }
  /** Walks each animal towards its cell and dresses it for where it is. */
  /** A cattle egret on the back of a grazing beast, or a crow where there
   * are no egrets: a third of the big stock carry one by day, and it is off
   * the moment the beast bolts. */
  private perchOnBack(
    id: string,
    im: Phaser.GameObjects.Image,
    state: FaunaState,
    young: boolean,
    profile: FaunaProfile | undefined,
  ) {
    let bird = this.riders.get(id);
    const hour = (this.runtime.displayClock() / 3600) % 24;
    const carries =
      !!profile?.art.graze &&
      (profile.body?.[0] ?? 0) > 0 &&
      !young &&
      !URGENT.has(state) &&
      hour >= 6.5 &&
      hour < 18.5 &&
      this.poseOffset(`${id}-rider`) % 3 === 0;
    if (!carries) {
      bird?.destroy();
      this.riders.delete(id);
      return;
    }
    const setting = this.runtime.engine.world.pack?.setting;
    const art = (this.riderArt ??=
      setting && faunaAt(setting).some((p) => p.id === "cattle-egret") ? "cattle-egret" : "crow");
    const frame = `faunab-${art}-perch-${Math.floor(this.time.now / 300 + this.poseOffset(id)) % 8}`;
    if (!bird) {
      bird = this.add.image(0, 0, this.texture(frame), frame).setOrigin(0.5, 1);
      this.riders.set(id, bird);
    } else if (bird.frame.name !== frame) bird.setFrame(frame);
    // Toward the rump on a side view; square on the middle from ahead or behind.
    const name = im.frame.name;
    const along = name.includes("-north-") || name.includes("-south-") ? 0 : im.flipX ? 5 : -5;
    bird
      .setScale((art === "crow" ? 0.8 : 0.6) * im.scaleX)
      .setPosition(im.x + along * im.scaleX, im.y - im.displayHeight * 0.68)
      .setFlipX(im.flipX)
      .setDepth(im.depth + 0.5)
      .setTint(this.tint);
  }
  private placeFauna(dt: number) {
    for (const [id, bird] of this.riders)
      if (!this.faunaSprites.has(id)) {
        bird.destroy();
        this.riders.delete(id);
      }
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
        !!profile?.directions?.includes("southeast"),
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
        if (profile?.locomotion === "ground" && profile.social === "flock")
          this.feel.puff(im.x, im.y - 6, FAUNA_FEATHERS, 4, 0.7);
        if (profile?.burrows) void gameAudio()?.sound(thump(), "thump");
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
      if (f.sentinel && !pose.moving) state = "idle";
      if (pose.moving && !STRIDING.has(state)) state = "wander";
      else if (!pose.moving && state === "wander") state = "idle";
      if (watching && player) {
        state = "idle";
        const dx = player.x - im.x,
          dy = player.y - im.y;
        if (profile?.directions?.includes("southeast")) facing = eightWay(dx, dy, facing);
        else if (profile?.directions)
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
      if (
        profile?.swims &&
        !aerial &&
        topo?.(Math.floor(pose.x / 16), Math.floor((pose.y - 8) / 16))?.surface === "water"
      )
        state = state === "forage" && !pose.moving ? "dabble" : "swim";
      // Godhuli, the cow-dust hour: stock walking home at sundown raises a
      // haze off dry lanes that catches the light.
      if (pose.moving && !aerial && dt && profile?.category === "domestic" && profile.art.graze) {
        const hour = (this.runtime.displayClock() / 3600) % 24;
        const ground = topo?.(Math.floor(pose.x / 16), Math.floor((pose.y - 8) / 16));
        if (
          hour >= 16.5 &&
          hour < 19 &&
          (this.weather?.wetness ?? 0) < 0.3 &&
          ground &&
          (ground.surface === "dry" || ground.surface === "soil" || ground.surface === "gravel") &&
          !ground.field?.wet &&
          Math.random() < dt * 5
        )
          this.feel.trail(pose.x, pose.y, DUSK_DUST);
      }
      if (this.figureRim()) this.rimLight(id, im);
      if (pose.moving && !aerial && dt && profile && this.snow >= 0.34) {
        const ground = topo?.(Math.floor(pose.x / 16), Math.floor((pose.y - 8) / 16));
        if (ground && ground.surface !== "water")
          this.feel.track(
            id,
            pose.x,
            pose.y,
            "snow",
            /east/.test(facing) ? 1 : /west/.test(facing) ? 3 : facing === "north" ? 0 : 2,
            false,
            this.printDepth(),
            profile.locomotion === "ground-and-flight" || profile.social === "flock"
              ? "bird"
              : profile.gait === "hop"
                ? "hop"
                : profile.art.graze
                  ? "hoof"
                  : "paw",
            this.weather?.condition === "snow",
          );
      }
      if (profile?.category === "domestic" && profile.social === "flock" && !profile.swims && dt) {
        const hour = (this.runtime.displayClock() / 3600) % 24;
        const ground = topo?.(Math.floor(pose.x / 16), Math.floor((pose.y - 8) / 16));
        // Hens dust-bathe through the midday heat, throwing it over their backs.
        if (
          !pose.moving &&
          hour >= 11 &&
          hour < 15 &&
          (ground?.surface === "dry" || ground?.surface === "soil") &&
          Math.random() < dt * 0.8
        )
          this.feel.puff(pose.x, pose.y, FAUNA_DUST, 2, 0.4);
        if (profile.id === "chicken" && hour >= 5 && hour < 7 && player && now > this.crowAt) {
          const d = Math.hypot(player.x - im.x, player.y - im.y);
          this.crowAt = now + 8000 + Math.random() * 14000;
          if (d < 480)
            void gameAudio()?.sound(
              cockCrow(1 - d / 480),
              "rooster",
              Math.max(-1, Math.min(1, (im.x - player.x) / 240)),
            );
        }
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
      if (f.sunk && !pose.moving)
        im.setCrop(0, 0, im.frame.width, Math.round(im.frame.height * 0.6));
      else if (im.isCropped) im.setCrop();
      this.perchOnBack(id, im, f.state, f.young, profile);
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
      // A fixed nudge off the cell centre, so a flock is not laid out on the grid.
      const jx = (this.poseOffset(id) % 7) - 3,
        jy = (Math.floor(this.poseOffset(id) / 7) % 5) - 2;
      const ground = pose.y + jy - this.lift(pose.x, pose.y);
      im.setPosition(pose.x + jx, ground - pose.alt - pose.hop);
      const depth = pose.y + jy - 2;
      if (im.depth !== depth) im.setDepth(depth);
      this.shadeFauna(
        id,
        im,
        pose.x + jx,
        ground,
        pose.alt,
        f.scale,
        topo && pose.alt < 1
          ? waterDepthAt(topo, pose.x / 16, (pose.y - 8) / 16)
          : 0,
      );
    }
  }
  private animalArt(g: FaunaGroup, id: string) {
    let art = this.faunaArt.get(id);
    if (!art) {
      const e = this.runtime.engine;
      const look = faunaLook(g.speciesId, e.state.manifest.seed, g.id, id, e.world.pack.setting, this.season);
      const artStem = g.form ? faunaArtStem(g.speciesId, g.form) : (look?.art ?? g.speciesId);
      const coat = g.coat ?? look?.coat;
      art = coat ? `${artStem}+${coat.replace(/-/g, "_")}` : artStem;
      this.faunaArt.set(id, art);
    }
    return art;
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
      releaseCanvas(canvas);
      const texture = `fauna-shadow-${key}`;
      // The texture manager outlives the scene; this map does not.
      releaseTexture(this, texture);
      this.textures
        .addCanvas(texture, made.canvas)
        ?.setFilter(Phaser.Textures.FilterMode.NEAREST);
      this.dynamicTextures.add(texture);
      cast = { key: texture, origin: made.origin };
      this.faunaShadows.set(key, cast);
    }
    let shade = this.shadows.get(id);
    if (!shade) {
      shade = this.snowCast(this.add.image(x, y, cast.key));
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
    this.pruneLazySheets(time);
    this.syncStableDoors(time);
    this.drift?.update(time, !!this.options.freeze);
    this.mist?.update(time, !!this.options.freeze);
    this.clouds?.update(time, !!this.options.freeze);
    this.life?.update(time, !!this.options.freeze);
    this.accent?.update(time, !!this.options.freeze);
    this.remainsLife?.update(
      time,
      delta / 1000,
      [...this.humanActors.keys()].flatMap((id) => {
        const im = this.entities.get(id);
        return im?.visible ? [{ x: im.x, y: im.y }] : [];
      }),
      !!this.options.freeze,
    );
    this.flies?.update(
      delta / 1000,
      [...this.humanActors.keys()].flatMap((id) => {
        const im = this.entities.get(id);
        return im?.visible ? [{ x: im.x, y: im.y }] : [];
      }),
      !!this.options.freeze,
    );
    updatePuddles(this, time);
    {
      const engine = this.runtime.engine, outside = engine.state.player.pos.space === "outside";
      this.ice?.update(time, outside ? engine.iceBreaks.values() : [], (x, y) => outside && engine.iceUnder(x, y) !== undefined, !!this.options.freeze);
    }
    // The old view holds while it fades out; the room is built after.
    if (!this.fadingOut) this.syncRoom(delta);
    if (!this.fadingOut) this.syncCave(delta);
    if (!this.fadingOut) this.syncSewer(delta);
    if (!this.fadingOut) this.syncShip(delta);
    if (!this.fadingOut) this.syncArea(delta);
    this.syncLids();
    this.reflect(time);
    this.glint(delta);
    this.afterRain(delta);
    if (this.night && !this.roomView && !this.caveView && !this.sewerView && !this.shipView && !this.areaView) {
      this.paintWash();
      this.paintLight();
    }
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
      this.tint,
      this.light.id === "night" ? 0 : this.sunStrength(),
    );
    mark("water");
    this.terrainStream?.update();
    const landing = this.terrainStream && this.runtime.journey?.landing();
    if (landing) this.terrainStream?.prefetchLanding(landing.world, landing.point, this.runtime.engine.state.clock);
    if (this.runtime.timeVisualClock !== undefined && lightingAt(this.runtime.timeVisualClock).id !== this.light.id) this.draw();
    mark("terrain");
    if (!this.options.lab && this.ready && perf.ambientPeople && !this.runtime.timeTravelLocked && !this.runtime.workInProgress) {
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
        const alpha = lightAlpha[this.light.id];
        for (const glow of [fire.glow, fire.pool]) {
          if (glow.frame.name !== size) glow.setFrame(size);
          if (glow.alpha !== alpha) glow.setAlpha(alpha);
          if (glow.visible !== alpha > 0) glow.setVisible(alpha > 0);
        }
        fire.embers?.setVisible(alpha > 0);
      }
    const lampClock = this.runtime.timeVisualClock ?? this.runtime.engine.state.clock;
    const lampHour = (((lampClock / 3600) % 24) + 24) % 24;
    const lampDark = this.options.lighting ? lightAlpha[this.light.id] : washAt(lampClock).lamps;
    if (perf.fires)
      for (const lamp of this.streetLights.values()) {
        const alpha = Math.max(lamp.lamp.power * (lamp.lamp.always ?? 0), lampDark
          ? lamp.lamp.power *
            lampDark *
            (this.options.lighting ? 1 : lampOn(lamp.lamp.tech, lampHour, lamp.order))
          : 0);
        const { flicker } = lamp.lamp;
        const step = this.options.freeze
          ? 0
          : Math.floor(time / (FIRE_FRAME_MS * (flicker === 1 ? 3 : 1)) + lamp.phase);
        const size = flicker ? String(Math.min(flicker, LIGHT_FLICKER[step % LIGHT_FLICKER.length])) : "0";
        for (const glow of [lamp.pool, ...lamp.flames]) {
          if (glow.frame.name !== size) glow.setFrame(size);
          if (glow.alpha !== alpha) glow.setAlpha(alpha);
          if (glow.visible !== alpha > 0) glow.setVisible(alpha > 0);
        }
        for (const cone of lamp.cones) {
          if (cone.alpha !== alpha) cone.setAlpha(alpha);
          if (cone.visible !== alpha > 0) cone.setVisible(alpha > 0);
        }
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
    if (perf.buildingAnimations) {
      const clock = this.runtime.displayClock();
      this.voxelLife.update(time, (((clock / 3600) % 24) + 24) % 24, washAt(clock).lamps);
    }
    if (perf.buildingAnimations)
      for (const animation of this.buildingAnimations.values()) {
        const frame = this.options.freeze
          ? 0
          : Math.floor(time / animation.period + animation.phase) % 4;
        const name = `animation-${animation.kind}-${frame}`;
        if (animation.image.frame.name !== name) animation.image.setFrame(name);
        if (animation.light) {
          if (animation.image.visible !== lampDark > 0) animation.image.setVisible(lampDark > 0);
          if (animation.image.alpha !== lampDark) animation.image.setAlpha(lampDark);
        }
      }
    if (
      this.game.canvas.dataset.buildingAnimations !==
      String(this.buildingAnimations.size)
    )
      this.game.canvas.dataset.buildingAnimations = String(
        this.buildingAnimations.size,
      );
    const shut = townGateShut(this.runtime.engine.state.clock);
    for (const g of this.gateDoors) g.setVisible(shut);
    const minute = Math.floor(this.runtime.displayClock() / 60);
    for (const hand of this.clockHands)
      if (hand.minute !== minute) {
        hand.minute = minute;
        drawClockHands(hand.g, hand.x, hand.y, hand.r, minute);
      }
    mark("building animations");
    this.driveTrains(time);
    this.drawFieldPrompt(time);
    mark("trains");
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
      entityAt: (id) => this.entities.get(id) ?? this.combatEffects?.bodyOf(id),
      texture: (frame) => this.texture(frame),
      frame: (frame) => this.textureFrame(frame),
      redraw: () => this.draw(),
      playerCell: () => this.runtime.engine.state.player.pos,
    });
    this.toolEffects.consume(this.runtime.toolEffect);
    const swing = this.runtime.swingEffect;
    if (swing && swing.serial !== this.monkeySwing) {
      this.monkeySwing = swing.serial;
      this.monkeys?.swung(swing.from.x * 16 + 8, swing.from.y * 16 + 8, this.time.now);
    }
    this.toolEffects.consumeSwing(swing);
    this.toolEffects.consumeThrow(this.runtime.throwEffect);
    this.toolEffects.consumeShove(this.runtime.shoveEffect);
    const heave = this.runtime.heaveEffect;
    if (heave && heave.serial !== this.heaveSerial) {
      this.heaveSerial = heave.serial;
      this.heaveUp(heave);
    }
    this.toolEffects.update(time);
    this.treeFinds ??= new TreeFinds(this, {
      treeFind: (x, y) => this.runtime.engine.treeFind(x, y),
      fallenHives: () => this.runtime.engine.fallenHives(),
      swarming: () => !!this.runtime.engine.state.player.bees,
      player: () => this.entities.get("player"),
      brush: (cell, dx, dy, force) => this.toolEffects?.brush(cell, dx, dy, force),
      spill: (at, loot) => this.toolEffects?.spill(at, loot),
    });
    if (this.findsDirty) {
      this.findsDirty = false;
      this.treeFinds.sync(this.plantImages);
    }
    const find = this.runtime.treeFindEffect;
    if (find && find.serial !== this.treeFindSerial) {
      this.treeFindSerial = find.serial;
      this.treeFinds.drop(find);
    }
    this.treeFinds.update(time);
    mark("tool effects");
    this.smallLife?.update(time);
    this.monkeys?.update(time);
    mark("small life");
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
    for (const a of this.runtime.engine.state.actors) {
      const lit = a.heldItem === "torch" && !a.dead;
      const flame = this.actorTorches.get(a.id);
      if (!lit && !flame) continue;
      const holder = this.entities.get(a.id);
      (flame ?? this.actorTorches.set(a.id, new TorchFlame(this, true)).get(a.id)!)
        .update(lit && holder?.visible ? holder : undefined, lit, a.direction, lightAlpha[this.light.id]);
      if (!lit) this.actorTorches.delete(a.id);
    }
    this.drawTarget(time);
    this.drawGuide(time);
    this.drawTraders(time);
    this.drawGames(time);
    this.drawCastMarks(time);
    this.drawFightBars();
    this.combat().consume(this.runtime.swingEffect);
    this.combat().consumeThrow(this.runtime.throwEffect);
    this.combat().consumeEvents(this.runtime.engine.signals);
    this.cues.consume(this.runtime.engine.signals);
    this.cues.update();
    this.cues.angry(this.runtime.engine.state.actors);
    this.cues.sleeping(
      [...this.humanActors]
        .filter(([, a]) => /sleep/i.test(a.activity))
        .map(([id]) => id),
      time,
    );
    const baby = this.runtime.engine.state.baby;
    (this.babyFx ??= new BabyEffects(this, (id) => this.entities.get(id))).update(
      baby, baby ? (this.humanActors.get(baby.with)?.direction ?? 2) : 2, time, baby && this.humanActors.get(baby.with)?.appearance?.wearing.infantCarry);
    this.combat().charging(this.runtime.charge);
    this.runtime.aiming = this.aimStarted !== undefined;
    const aimed = this.aimPath();
    const last = aimed?.at(-1);
    this.combat().aiming(aimed, time,
      !!last && this.runtime.engine.hitClass(last.x, last.y,
        this.runtime.engine.state.player.pos.space).hit === "creature",
      this.aimKind === "bow");
    this.whirl(time);
    this.combat().dazed(this.stunned, time);
    this.combat().update(time);
    mark("wind");
    const active = document.activeElement;
    const typing =
      (active instanceof HTMLInputElement && !walkableBox(active)) ||
      active instanceof HTMLTextAreaElement ||
      active instanceof HTMLSelectElement ||
      (active instanceof HTMLElement && active.isContentEditable) ||
      this.modalOpen || this.runtime.workInProgress;
    if (typing) {
      this.heldDirections.clear();
      this.touchStick = undefined;
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
    if (!this.options.lab && !this.runtime.workInProgress && (!typing || this.runtime.running)) {
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
          ) * (this.runtime.engine.state.player.riding?.cycle ? CYCLE_AIR : 1);
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
        if (this.runtime.engine.state.player.riding?.cycle) this.cycleInput(dx, dy, time);
        else if ((dx || dy) && this.runtime.engine.state.player.drivingVehicle) {
          this.nextInput=time+95*Math.hypot(dx,dy);
          this.motionDuration=this.nextInput-time;
          this.lastTick=time;
          this.runtime.move(dx,dy,false);
        } else if ((dx || dy) && this.runtime.engine.state.player.riding) {
          const mount = this.runtime.engine.state.player.riding;
          const spec = mountSpec(mount.speciesId, mount.form)!;
          const now = performance.now();
          const prev = this.rideLastDir;
          // Reversing direction at gallop or spur triggers a dramatic skid-stop!
          if (
            this.rideGallopSteps >= 2 &&
            prev &&
            dx === -prev[0] &&
            dy === -prev[1]
          ) {
            this.rideGallopSteps = 0;
            this.rideLastDir = undefined;
            this.runtime.rideGait = 1;
            this.runtime.rideCombo = 0;
            this.nextInput = time + 210;
            const im = this.entities.get("player");
            if (im) {
              this.kickDust(im.x - dx * 6, im.y, 10, 1.15);
              this.feel.spring(im, 1.16, 0.86, 200);
              const proxy = { t: 0 };
              this.tweens.add({
                targets: proxy,
                t: (dx > 0 ? -1 : 1) * 14,
                duration: 100,
                yoyo: true,
                onUpdate: () => { this.rideTilt = proxy.t; },
                onComplete: () => { this.rideTilt = 0; },
              });
            }
            gameAudio()?.sound(mountSkid(), "skid");
          } else {
            const surging = now < this.runtime.rideSpurUntil;
            const gait: MountGait = surging
              ? 4
              : this.shiftHeld
                ? 3
                : this.rideGallopSteps >= 2
                  ? 2
                  : 1;
            this.runtime.rideGait = gait;
            this.runtime.rideMovingUntil = now + 380;
            this.rideLastDir = [dx, dy];
            this.rideGallopSteps = Math.min(8, this.rideGallopSteps + 1);
            const riderBonus = this.runtime.engine.knows("rider") ? 0.88 : 1;
            let ms = spec.stepMs[gait - 1] * Math.hypot(dx, dy) * riderBonus;
            const p = this.runtime.engine.state.player.pos;
            const sample = this.runtime.engine.world.topography;
            if (sample && p.space === "outside") {
              const depth = Math.max(
                waterDepthAt(sample, p.x + 0.5, p.y + 0.5),
                waterDepthAt(sample, p.x + dx + 0.5, p.y + dy + 0.5),
              );
              const ahead = sample(p.x + dx, p.y + dy);
              if (depth > 0 && !spec.amphibious) ms *= 1 + depth * 1.4;
              else if (
                !spec.snowSure &&
                this.snow > 0.5 &&
                ahead &&
                !ahead.pathArt?.length &&
                ahead.feature !== "paving"
              ) {
                ms *= 1 + (this.snow - 0.5) * 0.7;
              }
            }
            this.motionDuration = ms;
            this.nextInput = time + ms;
            this.lastTick = time;
            const moved = this.runtime.move(dx, dy, false, gait >= 3);
            if (moved?.status === "rejected") {
              this.runtime.face(dx, dy);
              this.rideGallopSteps = 0;
              this.runtime.rideGait = 0;
              this.runtime.rideCombo = 0;
              if (gait >= 3) {
                const im = this.entities.get("player");
                if (im) this.kickDust(im.x + dx * 6, im.y, 7, 1.0);
                this.cameras.main.shake(100, 0.003);
                gameAudio()?.sound(mountSkid(), "skid");
              }
            } else if (spec.heavy && gait >= 3) {
              this.cameras.main.shake(55, 0.0014);
            }
          }
        } else if (
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
            (this.shiftHeld ? RUN_RAMP[this.runSteps] : this.touchStick ? 260 - 80 * (this.touchStick.strength ?? 1) : 140) *
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
          this.motionDuration *= 1 + (this.runtime.engine.state.player.fatigue > 65 ? 0.14 : 0) + (this.loadWeights.get("player") ?? 0) * 0.12;
          this.nextInput = time + this.motionDuration;
          this.lastTick = time;
          if (!this.vault(dx, dy, time)) {
            const beforeMove = { ...this.runtime.engine.state.player.pos };
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
            const shoulderTarget = this.runtime.engine.shoveTargetId(dx, dy);
            const shouldered = moved?.status === "completed" &&
              this.runtime.engine.state.player.pos.x === beforeMove.x &&
              this.runtime.engine.state.player.pos.y === beforeMove.y &&
              this.runtime.engine.state.objects.some(o => o.id === shoulderTarget && (o.lean || o.tipped));
            const collided = moved?.status === "completed" && this.runtime.engine.lastImpact === "collision";
            const p0 = this.runtime.engine.state.player.pos;
            if (moved?.status === "completed" && this.runtime.engine.lastImpact === "muck") {
              this.blockedFacing = undefined;
              this.pushingAt = undefined;
              this.fellInMuck(dx, dy, time);
            } else if (moved?.status === "rejected" || shouldered || collided) {
              if (
                this.pushingAt === undefined &&
                this.toolEffects?.brush({ x: p0.x + dx, y: p0.y + dy }, dx, dy, this.shiftHeld ? 1.6 : 1)
              )
                gameAudio()?.sound(scramble("brush", true), "bump");
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
              this.toolEffects?.brush(at, dx, dy, this.shiftHeld ? 0.8 : 0.45);
              const impact = this.runtime.engine.lastImpact;
              if (impact === "slide" || impact === "slip" || impact === "creak" || impact === "plunge") this.onIce(impact, time);
              else if (
                at.space === "outside" &&
                puddleUnder(this, at.x * 16 + 8, at.y * 16 + 12, 4) === "ice" &&
                Math.random() < (this.shiftHeld ? 0.65 : 0.25)
              )
                this.slip(dx, dy, time);
            }
            if (
              (moved?.status === "rejected" || shouldered || collided) &&
              this.shiftHeld &&
              this.runSteps >= 2
            )
              this.bonkAt(dx, dy, time);
          }
        }
      }
      const stride = this.runtime.quick && this.runtime.autopilot?.plan.kind === "go" ? 35 : 140;
      if (
        time >= this.nextInput &&
        time - this.lastTick >= stride &&
        this.jumpStarted === undefined
      ) {
        this.lastTick = time;
        this.motionDuration = stride;
        if (perf.worldTicks) this.runtime.tick();
        if (this.runtime.running) {
          const p = this.runtime.engine.state.player.pos,
            sample = this.runtime.engine.world.topography;
          if (sample && p.space === "outside")
            this.nextInput =
              time +
              stride * wadingCost(waterDepthAt(sample, p.x + 0.5, p.y + 0.5));
        }
      }
    }
    // Depth and the selection marker follow the displayed position, not the next tile.
    for (const [id, im] of this.entities) {
      if(id==="player" && this.runtime.engine.state.player.drivingVehicle) {
        im.setVisible(false);
        this.shadows.get(id)?.setVisible(false);
        continue;
      }
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
      if (id === "player") {
        const e = this.runtime.engine, p = e.state.player;
        const owner = p.guidingPlough ?? (p.drivingCart && e.world.vehicle?.(p.drivingCart.vehicle)?.crew[0]);
        const driver = owner && (this.mountedActors.get(owner) ?? e.state.actors.find(a => a.id === owner));
        const at = driver && this.mountAt(driver, this.runtime.displayClock(), true);
        if (at) {
          const x = at.x * 16 + 8, y = at.y * 16 + 16;
          im.setPosition(x, y - this.lift(x, y));
        } else if (!this.seatPlayer(im, this.time.now)) this.mounted.delete(id);
      }
      const seat = this.mounted.get(id), under = im.getData("underfoot") as boolean | undefined;
      const rider=this.ambient.get(id);
      const pilotSeat=this.harbor.pilotSeat(id);
      const deck=pilotSeat ?? (rider?.boat==="harbor-ferry" ? this.harbor.deckAt(rider.x,rider.y) : undefined);
      if(pilotSeat)im.setPosition(Math.round(pilotSeat.x),Math.round(pilotSeat.y));
      else if(deck && rider) im.setPosition(Math.round(rider.x*16+8),Math.round(deck.y));
      this.shadows.get(id)?.setVisible(!seat && !under && !deck);
      // Anchored at its near edge, so everyone standing on it would sort behind it.
      const depth = deck ? deck.depth : under ? im.y - 6 * 16 : seat ? seat.depth :
        im.y +
        arcLift +
        // Standing on the thing means drawing in front of it, foliage and
        // all, so the lift comes back off the depth. On a wall the walker is
        // drawn just in front of their own cell's masonry and behind the next
        // cell south, whose top would otherwise hide nothing.
        (perched
          ? id === "player" && this.runtime.engine.state.player.perch
            ? perched + 4 + this.roofDepth()
            : perched + 2 - (this.wallFooting(id)?.dy ?? 0)
          : 0) +
        this.lift(im.x, (this.destinations.get(id)?.y ?? 0) * 16 + 16) -
        (frame ? 2 : 6);
      if (im.depth !== depth) im.setDepth(depth);
      // The camera tracks the sprite, so cancel the arc or the world bobs.
      if (id === "player" && !this.options.lab) {
        const p = this.runtime.engine.state.player.pos;
        const aim = phoneLayout() && this.aimStarted !== undefined ? this.aimTarget : undefined;
        const x = aim ? Phaser.Math.Clamp((p.x - aim.x) * 8, -88, 88) : 0;
        const y = aim ? Phaser.Math.Clamp((p.y - aim.y) * 8, -88, 88) : 0;
        this.cameras.main.setFollowOffset(x, y - arcLift);
      }
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
        const moving = (!deck?.moving && (at ? at.moving : this.tweens.isTweening(im))) || pushing;
        const action =
          id === "player" ? this.runtime.characterAction : undefined;
        const elapsed = action ? performance.now() - action.at : Infinity;
        const winding =
          id === "player" && !!this.runtime.charge && !this.runtime.chargeSwung;
        // A jump is spread over its own arc, so the apex frame is drawn at
        // the apex whatever the distance, and a landing follows it. The
        // landing gives way to walking after its first frame.
        const arcMs =
          action?.pose === "jump" ? (action.arc?.duration ?? 360) : undefined;
        const active =
          action && elapsed < (arcMs ?? poseTiming(action.pose) * 4);
        const sinceLanding = arcMs === undefined ? -1 : elapsed - arcMs;
        const recoveryAge = action && /^(swing|chop|slash|thrust|spear-thrust|spear-throw|knife-thrust|stick-swing|axe-chop|pick-strike|shovel-dig|rake-pull|sickle-cut|scythe-sweep|pitchfork-jab|reap|till|dig)$/.test(action.pose)
          ? elapsed - poseTiming(action.pose) * 4
          : Infinity;
        const recovering = id === "player" && recoveryAge >= 0 && recoveryAge < 220 && !moving;
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
        const outFishing = id !== "player" && at?.boat && at.boat!=="harbor-ferry" && sample && wetPos?.space === "outside" &&
          waterDepthAt(sample, at.x + 0.5, at.y + 0.5) > 0.2;
        const craft = pilotSeat ? undefined : outFishing ? "boat" as const
          : id === "player" && wetPos?.space === "outside" ? this.runtime.engine.state.player.afloat : undefined;
        const boatSetting=this.runtime.engine.state.manifest.setting;
        const boatId = outFishing ? at!.boat : id === "player" ? this.runtime.engine.state.player.boat : undefined;
        const boatObject = craft === "boat" && boatId ? this.runtime.engine.state.objects.find((o) => o.id === boatId) : undefined;
        const boatType=craft==="boat" ? boatCraft(boatObject?.sprite) ??
          (boatSetting ? fishingWaterfront(boatSetting)?.craft : undefined) : undefined;
        const under = this.sewerView?.wading(im.x, im.y, wetPos?.space) ?? this.caveView?.wading(im.x, im.y, wetPos?.space);
        const water = deck ? 0 : under
          ? under.depth
          : !(craft && craft !== "swimming") && sample && wetPos?.space === "outside" && !arcLift
            ? waterDepthAt(
                sample,
                im.x / 16,
                (im.y + this.lift(im.x, wetPos.y * 16 + 16) - 8) / 16,
              )
            : 0;
        // A puddle wets the feet without making anyone wade.
        const puddle =
          !deck && water <= 0.025 && !arcLift && wetPos?.space === "outside"
            ? puddleUnder(this, im.x, im.y - 1)
            : undefined;
        if (!deck && wetPos?.space === "outside" && !arcLift && water <= 0.025 && !(craft && craft !== "swimming"))
          reflectIn(this, id, im);
        const heldSprite = this.heldSprites.get(id);
        const loadWeight = this.loadWeights.get(id) ?? 0;
        const tired = human.fatigue > 65;
        const condition = loadWeight + (tired ? 3 : 0);
        const work = id !== "player" && at && !moving && !this.options.freeze
          ? this.workMotion(id, at, time, human.origin?.livelihood, human.heldItem) : undefined;
        const use = (id !== "player" || human.activity === "Sitting and listening") && !moving && wetPos && wetPos.space !== "outside" ? this.runtime.engine.indoorUse?.(id, wetPos) : undefined;
        const pair = !moving && !active && !winding && !landed && !stunt && !seat && !use ? this.together(id, at, time) : undefined;
        const romp = pair && "romp" in pair ? (pair.romp as { x: number; y: number }) : undefined;
        this.standApart(id, im, romp ? undefined : pair?.im, moving);
        this.romp(im, romp, moving);
        if (at && !at.moving && /^(Calling|Waiting) for /.test(at.label)) this.doorGreet(id, im, time);
        let pose: CharacterPose = moving ? "walk" : "idle";
        if (active || winding) pose = action!.pose;
        else if (landed) pose = after;
        else if (recovering) pose = "recover";
        else if (moving)
          pose = id === "player" && this.shiftHeld ? "run" : "walk";
        else if (seat) pose = seat.role;
        else if (human.errand?.pose && human.pos.x === human.errand.to.x && human.pos.y === human.errand.to.y) pose = human.errand.pose;
        else if (pair) pose = pair.pose;
        else if (at) pose = work?.pose ?? this.ambientPose(id, at, time);
        else if (use) pose = use.role === "bed" ? "idle" : this.indoorPose(use, human.activity, wetPos!.space);
        else if (/rest|sleep/i.test(human.activity)) pose = "sit";
        else if (/gathering|working/i.test(human.activity)) pose = "work";
        else if (/eating/i.test(human.activity)) pose = "give";
        // Breathing has no blink frame: the player stays plain idle for idle's blink.
        if (id === "player" && pose === "idle" && this.poseFrame(id, "idle", time) !== 3) pose = "breathe";
        if (moving && water > 0.025 && !active && !winding) pose = "wade";
        const swimming = craft === "swimming" && water > 0.025 && !active && !winding;
        if (swimming) pose = moving ? "swim" : "tread";
        if (pilotSeat?.rowing) pose = "sit";
        else if (craft && craft !== "swimming") pose = boatPosture(boatType);
        // Someone reacting stops what they were doing to do it.
        const cued =
          id !== "player" && !moving ? this.cues.poseFor(id) : undefined;
        if (cued) pose = cued.pose;
        const asleep = use?.role === "bed" && this.pillows.has(id);
        const free = !this.options.freeze && !swimming && !(craft && craft !== "swimming");
        const smoking = this.smokers.update(id, this.habitOf(id), im, human.direction,
          free && !asleep && !work && !use && !/work|gather|sleep/i.test(human.activity) && this.cameras.main.worldView.contains(im.x, im.y),
          this.emberGlow, time);
        const raining = this.weather?.condition === "rain" && (this.weather.rain ?? 0) >= 0.15 && wetPos?.space === "outside";
        const cover = raining && free && !asleep && !work && !use && this.cameras.main.worldView.contains(im.x, im.y)
          ? this.coverOf(id, human.age ?? 30) : undefined;
        const headLoad = /@head$/.test(human.heldItem ?? "");
        const hands = !heldSprite && loadWeight === 0;
        const over = cover?.cover && !headLoad && (cover.cover === "cloth" || hands) ? cover.cover : undefined;
        (this.rainFx ??= new RainCovers(this)).update(id, over, cover?.tint ?? 0, im, this.headTop(im), human.direction, time);
        const rainProp = over && over !== "cloth" ? `icon:${cover!.item}` : undefined;
        const sick = (free ? this.showSymptoms(id, human.direction, im, moving, asleep, time) : undefined) ?? smoking;
        const sickPose = sick && !moving && !cued && !asleep && (pose === "idle" || pose === "breathe") ? sick : undefined;
        if (sickPose) pose = sickPose.pose;
        const npcGesture = id !== "player" && !moving && !cued && !asleep && pose === "idle" && !this.options.freeze
          ? this.idleGesture(id, time, !!heldSprite, !!human.appearance?.wearing.headwear && human.appearance.wearing.headwear !== "none", loadWeight,
            () => statsOf(this.runtime.engine.state.manifest.seed, human))
          : undefined;
        if (npcGesture) pose = npcGesture.pose;
        const me = this.runtime.engine.state.player;
        const fidget =
          id === "player" && !this.options.freeze
            ? this.feel.idle(
                time,
                pose === "breathe" && !pair && loadWeight < 2 && !this.runtime.charge && !this.aimStarted,
                {
                  injured: !!me.injury,
                  tired: me.fatigue > 65,
                  cold: (this.weather?.tempC ?? 20) < 4,
                  hat: !!human.appearance?.wearing.headwear && human.appearance.wearing.headwear !== "none",
                  held: !!heldSprite,
                  burden: loadWeight > 0,
                },
                Math.random,
              )
            : undefined;
        if (fidget?.pose) pose = fidget.pose;
        if (stunt) pose = stunt.pose;
        const motion = id === "player" ? this.swingMotion(action, elapsed, human, heldSprite, condition) : undefined;
        if (motion) pose = motion.pose;
        const drawing = id === "player" && this.aimKind === "bow" && this.aimStarted !== undefined;
        const slinging = drawing && me.heldItem === "sling";
        const hawking = drawing && me.heldItem === "hawk";
        if (drawing) pose = slinging ? "whirl" : hawking ? "cast" : "draw";
        // Something heavy in the arms shortens the stride.
        const laden = loadWeight > 0;
        // Quicker, shorter steps to get out of the rain.
        const cadence = (raining ? 1.2 : 1) / (1 + loadWeight * 0.12 + (tired ? 0.14 : 0));
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
        // Down to half health the player favours a leg; under a quarter, badly.
        const lame = id === "player" && (me.health ?? 100) < 50 ? ((me.health ?? 100) < 25 ? 2 : 1) : 0;
        if (!active && !landed && !recovering && !stunt && !cued && !fidget?.pose && !npcGesture && !sickPose) {
          const still = g.still === undefined ? 0 : time - g.still,
            walked = (g.still ?? time) - g.since;
          if (
            (pose === "walk" || pose === "run") && moving &&
            time - g.since < SETOFF_MS
          ) {
            pose = "setoff";
            gaitFrame = 0;
          } else if (pose === "walk" && time - (g.pivot ?? -Infinity) < PIVOT_MS) {
            pose = "halt";
            gaitFrame = 0;
          } else if ((pose === "walk" || pose === "run") && moving) {
            // From the push-off, so every walk starts on the same foot.
            const steps = ((time - g.since - SETOFF_MS) * cadence) / poseTiming(pose);
            gaitFrame = lame ? limpFrame(steps, frameCount(pose), lame) : Math.floor(steps) % frameCount(pose);
            // The dip onto the bad leg, mid-stance.
            if (lame && (gaitFrame === 1 || gaitFrame === 2) && time >= this.feel.springUntil)
              im.setScale(1 + 0.015 * lame, 1 - 0.035 * lame);
          }
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
        if (seat) pose = seat.role;
        const index =
          seat ? seat.frame : motion
            ? motion.index
            : slinging
            ? Math.floor(this.slingTurns(time - this.aimStarted!) * 3) % 3
            : hawking
            ? 0
            : drawing
            ? Math.min(2, Math.floor((time - this.aimStarted!) / poseTiming("draw")))
            : winding
            ? Math.min(1, Math.floor(elapsed / poseTiming(pose)))
            : gaitFrame ??
              (stunt
                ? stunt.first === 0
                  ? heldFrame(stunt.pose, this.time.now - stunt.from, stunt.ms, stunt.last)
                  : Math.min(
                      stunt.last,
                      stunt.first + Math.floor((this.time.now - stunt.from) / stunt.ms),
                    )
                : active
                  ? arcMs
                    ? // Crouch, launch, a long apex, then the reach for the ground.
                      [0.12, 0.4, 0.8].filter((t) => elapsed / arcMs >= t).length
                    : heldFrame(pose, elapsed)
                  : landed
                    ? heldFrame(after, sinceLanding)
                    : recovering
                      ? Math.min(3, Math.floor(recoveryAge / 55))
                    : work && pose === work.pose
                      ? work.index
                    : pair && pose === pair.pose
                      ? pair.index
                    : this.options.freeze
                      ? 0
                      : cued
                        ? cued.index
                        : sickPose
                          ? Math.min(3, Math.floor(((time - sickPose.from) / (sickPose.until - sickPose.from)) * 4))
                        : npcGesture
                          ? npcGesture.index
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
                            : this.poseFrame(id, pose, (tired || laden) ? time * cadence : time));
        if (work?.beat && pose === work.pose && index === 2)
          this.workBeat(id, pose, work.beat, work.site, im);
        if (id === "player" && active && pose.startsWith("work-") && pose !== "work-check" && index === 2 && action) {
          const target = action.target && this.runtime.engine.state.objects.find((o) => o.id === action.target);
          const nearStation = !target && wetPos?.space === "outside"
            ? [...this.workObjects.values()].find((s) => s.family.startsWith("worksite-") && Math.hypot(s.x - wetPos.x, s.y - wetPos.y) < 3.5)
            : undefined;
          const site = target && target.pos.space === "outside"
            ? { id: target.id, x: target.pos.x, y: target.pos.y, family: target.kind === "crop" ? "crop" : propDefs[target.prop ?? ""]?.family ?? worksiteStationFamily(target.sprite) ?? "" }
            : nearStation;
          this.workBeat(id, pose, String(action.serial), site, im);
        }
        const prop = seat ? undefined :
          heldSprite ??
          rainProp ??
          (at?.activity === "haul-catch" && (!work || work.pose === "work-hang" && work.index < 2) ? CATCH : undefined) ??
          // A thrown object stays in the hand through the windup. Striking
          // also swings, but then the hand is still full and this never runs.
          (active &&
          (action.pose === "drop" || action.pose === "swing" || action.pose === "cast" || action.pose === "spear-throw") &&
          index < 2
            ? action.prop
            : undefined);
        // Turning is drawn through the facings in between. Without it a
        // half turn is a single frame, which the eight-way sprites make
        // more obvious than the four-way ones did.
        const workFacing = work?.site && pose === work.pose &&
          Math.hypot(work.site.x - at!.x, work.site.y - at!.y) > 0.35
            ? facingFromStep(work.site.x - at!.x, work.site.y - at!.y, at!.direction)
            : undefined;
        const ahead = asleep ? 4 :
          seat?.facing ?? motion?.facing ??
          (id === "player" ? this.blockedFacing : undefined) ??
          cued?.facing ??
          (pair && pose === pair.pose ? pair.facing : undefined) ??
          (!pair && at?.activity === "visit" && !at.moving ? this.crowdFacing(id, time) : undefined) ??
          workFacing ??
          human.facing ??
          facingFromDirection(human.direction);
        if (id === "player" || craft || this.crafts.has(id)) {
          const setting=this.runtime.engine.state.manifest.setting;
          const owner = boatObject?.owner;
          this.craftOf(id).update(im,craft,this.tint,(setting?.year??0)>=1930,ahead,
            boatType,
            random(this.runtime.engine.state.manifest.seed,"boat-finish",id === "player" && !boatId ? "player" : owner ?? id));
        }
        im.setData("aboard",!!deck || craft==="boat" || craft==="raft");
        const family = at && !at.moving ? at.target?.family : undefined;
        const gear = outFishing && family?.startsWith("fishing-") ? family.slice(8) as Gear : family === "seine-rope" ? "rope" : undefined;
        if (gear) this.fishingGear.draw(id, gear, im.x, im.y, { x: at!.target!.x * 16 + 8, y: at!.target!.y * 16 + 8 }, im.depth, time, this.poseOffset(id));
        else this.fishingGear.hide(id);
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
        else if (seat) { turn.facing = seat.facing; turn.next = turn.sign = undefined; }
        else if (motion?.facing !== undefined) {
          // A spin is the turn itself: no easing between facings.
          if (turn.facing !== wanted) this.afterimage(im);
          turn.facing = wanted;
          turn.next = turn.sign = undefined;
        } else {
          if (turn.next !== undefined && time - (turn.started ?? time) >= 25) {
            turn.facing = turn.next;
            turn.next = undefined;
          }
          if (turn.facing !== wanted && time >= turn.until) {
          // Reversing at a run digs the heels in.
          if (pose === "run" && Math.abs(turn.facing - wanted) === 4)
            this.kickDust(im.x, im.y, 4, 0.8);
          // A walk swung hard round rocks back on the old heading first.
          const swing = (wanted - turn.facing + 8) % 8;
          if (pose === "walk" && swing >= 3 && swing <= 5) {
            g.pivot = time;
            if (id === "player") this.kickDust(im.x, im.y, 2, 0.5);
          }
          turn.sign = ((turnToward(turn.facing, wanted) - turn.facing + 8) % 8) === 1 ? 1 : -1;
          turn.started = time;
          turn.next = turnToward(turn.facing, wanted);
          turn.until = time + TURN_HOLD_MS + 30;
          }
        }
        const turnAge = time - (turn.started ?? -Infinity);
        const turnMotion = turnAge < 90 && turn.sign
          ? turn.sign * (turnAge < 25 ? 3 : turnAge < 58 ? 2 : 1)
          : 0;
        const passBy = moving && id !== "player" && !craft ? this.glanceAt(id, im, turn.facing, time) : 0;
        const texture = this.characters.frame(
          // Their own facing, or wherever a cue or a glance has turned them.
          asleep
            ? { ...human, facing: 4, appearance: this.bareHeaded(human.appearance) }
            : turn.facing === (human.facing ?? facingFromDirection(human.direction))
              ? human
              : { ...human, facing: turn.facing },
          pose,
          // Eyes shut: the blink frame.
          asleep ? 3 : index,
          prop,
          turnMotion || passBy * 3,
          condition,
          asleep ? undefined : this.feeling(id, human),
        );
        // A hit-stop holds the figures too, not only what is tweened.
        im.setVisible(!!texture);
        if (asleep) this.shadows.get(id)?.setVisible(false);
        const ridingMount = human.riding;
        const mountSpecNow = ridingMount ? mountSpec(ridingMount.speciesId, ridingMount.form) : undefined;
        if (id === "player") {
          this.syncRideEvents(im);
          if (!ridingMount?.cycle && (this.cycle.speed || this.cycle.style)) {
            this.cycle.halt();
            this.cycle.style = this.cycle.chain = this.runtime.rideStyle = 0;
          }
          if (!ridingMount) {
            this.rideGallopSteps = 0;
            this.rideTilt = 0;
            this.rideLift = 0;
            if (this.runtime.rideGait !== 0) {
              this.runtime.rideGait = 0;
              this.runtime.rideCombo = 0;
            }
          } else if (!moving && performance.now() >= this.runtime.rideMovingUntil) {
            this.rideGallopSteps = 0;
            if (this.runtime.rideGait !== 0) {
              this.runtime.rideGait = 0;
              if (performance.now() > this.runtime.rideSpurUntil + 250) this.runtime.rideCombo = 0;
            }
          }
        }
        const activeGait: MountGait = ridingMount
          ? moving
            ? Math.max(1, id === "player" ? this.runtime.rideGait : 2) as MountGait
            : 0
          : moving
            ? (this.shiftHeld ? 3 : 2)
            : 0;
        const cycleLook = ridingMount?.cycle?.look ?? (id !== "player" && human.pos.space === "outside" ? (human as Actor).cycle : undefined);
        const devHorseFrame =
          id === "player" && !ridingMount && this.runtime.devHorse
            ? this.horseFrame(moving, turn.facing, time)
            : undefined;
        if (devHorseFrame) {
          const base = `vhorse-ride-${devHorseFrame}`;
          if (im.frame.name !== base) im.setTexture(this.texture(base), base);
          im.setFlipX(false);
          const originY = (im.height - 4) / im.height;
          im.setOrigin(0.5, originY).setVisible(true);
          this.ride(im, human.appearance, devHorseFrame, 0, 0, 0, originY);
          this.mountedRiders.get(id)?.setVisible(false);
        } else if (cycleLook) {
          if (id === "player") this.riderImage?.setVisible(false);
          const look = cycleLook;
          let riderImg = this.mountedRiders.get(id);
          if (!riderImg) this.mountedRiders.set(id, (riderImg = this.add.image(im.x, im.y, im.texture.key)));
          const air = id === "player" ? this.airProgress(im) : -1;
          const dolls = this.characters;
          if (id === "player") {
            if (this.cycleAir && air < 0) this.cycleTouchdown(im, look);
            this.cycleAir = air >= 0;
            if (air < 0) this.cycleSounds(im, look, moving, time, water > 0.02);
          }
          this.cycle.draw(id, im, riderImg, look, {
            dir8: turn.facing,
            time,
            delta: this.game.loop.delta,
            moving,
            player: id === "player",
            air,
            standing: id === "player" && moving && (this.shiftHeld || performance.now() < this.runtime.rideSpurUntil),
            lit: this.nightLevel > 0.4,
            tint: this.tint,
            riderTexture: (pose, frame, dir8) =>
              dolls.frame({ ...human, direction: dir8 >> 1, facing: dir8 }, pose, frame, prop, 0, condition, this.feeling(id, human)),
          });
        } else if (ridingMount && mountSpecNow) {
          this.cycle.hide(id);
          // Real directional pixel-art animal + real animated pixel-art character doll in the saddle!
          if (id === "player") this.riderImage?.setVisible(false);
          const dir4 = human.direction;
          const has8 = !!faunaProfile(ridingMount.speciesId)?.directions?.includes("southeast");
          const facing8Idx = ((turn.facing % 8) + 8) % 8;
          const facing4: FaunaFacing = has8
            ? ((["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"] as const)[facing8Idx] ?? "south")
            : ((["north", "east", "south", "west"] as const)[dir4] ?? "south");
          const isHorseRig = ridingMount.speciesId === "horse" || ridingMount.speciesId === "wild-horse";
          const rearing = isHorseRig && ((id === "player" && time < this.rideRearUntil) || !!ridingMount.bucking);
          const bowing = !moving && !rearing && isHorseRig && id === "player" && time < this.rideBowUntil;
          const faunaState: FaunaState = rearing
            ? "rear"
            : bowing
              ? "graze"
              : activeGait >= 3
                ? "flee"
                : activeGait === 2 && isHorseRig
                  ? "trot"
                  : activeGait >= 1
                    ? "wander"
                    : "idle";
          const artStem = faunaArtStem(ridingMount.speciesId, ridingMount.form);
          const artFull =
            ridingMount.coat && ridingMount.coat !== "default" && ridingMount.coat !== "natural"
              ? `${artStem}+${ridingMount.coat.replace(/-/g, "_")}`
              : artStem;
          const speedMul = activeGait >= 4 ? 1.55 : activeGait === 3 ? 1.2 : activeGait === 2 ? 1.05 : 0.85;
          if (id === "player" && moving) this.rideStridePhase += (this.game.loop.delta / 110) * speedMul;
          const customPhase = bowing
            ? 1 // Smooth mid-height head-dip while mounting/patting/feeding
            : rearing
              ? ((time / 95) % 8)
              : id === "player" && moving
                ? this.rideStridePhase
                : undefined;
          let animalFrame = this.faunaFrame(
            ridingMount.speciesId,
            faunaState,
            0,
            facing4,
            customPhase,
            artFull,
          );
          let tex = this.texture(animalFrame);
          // If a coat swap returned the base atlas (or missed), fall back to the plain frame so Phaser never drops to frame 0.
          if (tex !== "__DEFAULT" && (!this.textures.exists(tex) || !this.textures.get(tex).has(animalFrame))) {
            animalFrame = this.faunaFrame(ridingMount.speciesId, faunaState, 0, facing4, customPhase, artStem);
            tex = this.texture(animalFrame);
          }
          if (tex !== "__DEFAULT" && this.textures.exists(tex) && this.textures.get(tex).has(animalFrame)) {
            if (im.texture.key !== tex || im.frame.name !== animalFrame) {
              im.setTexture(tex, animalFrame);
            }
          }
          im.setOrigin(0.5, (im.frame.height - 3) / im.frame.height).setFlipX(false).setVisible(true);
          const buckWobble = ridingMount.bucking ? Math.sin(time * 0.034) * 14 : 0;
          const tilt = (id === "player" ? this.rideTilt : 0) + buckWobble;
          const lift = (id === "player" ? this.rideLift : 0) + (ridingMount.bucking ? Math.abs(Math.sin(time * 0.034)) * 5 : 0);
          im.setAngle(tilt);
          if (lift) im.setY(im.y - lift);
          const ridePose: CharacterPose = activeGait >= 3 ? "ride-gallop" : "ride";
          const riderFrameIdx = moving
            ? Math.floor(time / (activeGait >= 4 ? 75 : activeGait >= 3 ? 95 : 150)) % 4
            : Math.floor(time / 1200) % 4;
          const riderTex = this.characters.frame(
            turn.facing === (human.facing ?? facingFromDirection(human.direction))
              ? human
              : { ...human, facing: turn.facing },
            ridePose,
            riderFrameIdx,
            prop,
            turnMotion || passBy * 3,
            condition,
            this.feeling(id, human),
          );
          let riderImg = this.mountedRiders.get(id);
          if (riderTex) {
            if (!riderImg) {
              riderImg = this.add.image(0, 0, riderTex);
              this.mountedRiders.set(id, riderImg);
            }
            const shift = mountSpecNow.sideShift ?? 0;
            const sideX = has8
              ? facing8Idx === 2 ? shift : facing8Idx === 6 ? -shift : facing8Idx === 1 || facing8Idx === 3 ? Math.round(shift * 0.7) : facing8Idx === 5 || facing8Idx === 7 ? Math.round(-shift * 0.7) : 0
              : dir4 === 1 ? shift : dir4 === 3 ? -shift : 0;
            const bob = moving ? Math.round(Math.sin(time * (activeGait >= 3 ? 0.024 : 0.015)) * (activeGait >= 3 ? 1.5 : 1)) : 0;
            riderImg
              .setTexture(riderTex)
              .setOrigin(0.5, 1)
              .setPosition(Math.round(im.x + mountSpecNow.saddle[0] + sideX), Math.round(im.y - mountSpecNow.saddle[1] + bob))
              .setScale(im.scaleX, im.scaleY)
              .setAngle(tilt)
              .setDepth(im.depth + 0.05)
              .setTint(this.tint)
              .setVisible(true);
          } else {
            riderImg?.setVisible(false);
          }
        } else {
          if (id === "player") this.riderImage?.setVisible(false);
          this.mountedRiders.get(id)?.setVisible(false);
          this.cycle.hide(id);
          if (im.angle !== 0) im.setAngle(0);
          if (im.flipX) im.setFlipX(false);
          if (texture && this.tweens.timeScale && im.texture.key !== texture) {
            im.setTexture(texture);
            im.setOrigin(0.5, 1);
          }
          if(id==="player" || this.crafts.has(id))this.craftOf(id).placeCrew(im);
        }
        // Mounted hoofbeats, hoofprints, dust plumes & water spray!
        if (id === "player" && ridingMount && !ridingMount.cycle && mountSpecNow && moving && !arcLift) {
          const hoofIdx = Math.floor((time / (activeGait >= 4 ? 145 : activeGait === 3 ? 190 : activeGait === 2 ? 260 : 340))) % 4;
          if (this.rideHoofFrame !== hoofIdx) {
            this.rideHoofFrame = hoofIdx;
            const cell = this.destinations.get(id);
            const surface = cell
              ? this.runtime.engine.hitClass(cell.x, cell.y, cell.space).hit
              : "grass";
            void gameAudio()?.sound(hoofbeat(water > 0.02 ? "water" : surface, activeGait, !!mountSpecNow.heavy), "step");
            if (cell) {
              this.feel.step(im, water > 0.02 ? "marsh" : surface);
            }
            if (water > 0.02 || puddle === "water") {
              splashPuddle(this, im.x, im.y - 1, human.direction, activeGait >= 3, im.depth, time);
            } else if (activeGait >= 3) {
              this.kickDust(im.x, im.y, activeGait >= 4 ? 5 : 3, activeGait >= 4 ? 0.95 : 0.7);
              if (activeGait >= 4) {
                this.feel.puff(im.x, im.y - 4, [0xffe478, 0xfff5c0], 2, 0.7);
              }
            }
          }
        }
        // Dust off a run's contact frames. Walking raises none, or a quiet
        // street would be permanently hazy; jumps are covered by `launch`.
        if (!ridingMount && this.footfalls.get(id) !== index) {
          this.footfalls.set(id, index);
          const afoot =
            pose === "run" && index % 4 === 1 && water <= 0.025 && !arcLift;
          // Heel strikes: frames 2 and 6 of the walk, 1 and 5 of the run.
          const heel = (!seat || pose === "guide-plough" || pose === "walk") && moving && index % 4 === (pose === "run" ? 1 : 2);
          if (
            heel &&
            !arcLift &&
            this.leafPiles.some((p) => ((im.x - p.x) / (LITTER_W / 2)) ** 2 + ((im.y - p.y) / (LITTER_H / 2)) ** 2 < 0.6)
          )
            this.feel.puff(im.x, im.y, LEAF_COLOURS, pose === "run" ? 5 : 2, pose === "run" ? 0.8 : 0.4);
          if (puddle === "water" && heel)
            splashPuddle(this, im.x, im.y - 1, human.direction, pose === "run", im.depth, time);
          const cell = this.destinations.get(id);
          if (heel && id === "player" && cell && !arcLift) {
            void gameAudio()?.sound(
              () => this.footstepAt(cell, puddle, water, pose === "run"),
              "step",
            );
            const fungus = this.fungusUnderfoot(cell);
            const kind = fungus && this.runtime.engine.plantSpecies("nature-understory-fungi", cell.x, cell.y);
            if (fungus && kind) this.stirFungus(im.x, im.y, fungus, kind.id);
          }
          if (heel && id === "player" && cell && !arcLift && water <= 0.025 && this.underfoot(cell, puddle) === "grass")
            this.feel.part(im.x, im.y, im.depth);
          if (afoot && id === "player" && cell)
            this.feel.step(im, this.underfoot(cell, puddle));
          else if (afoot) this.kickDust(im.x, im.y, 2, 0.5);
        }
        {
          const cell = this.destinations.get(id);
          const ground = moving && cell && water <= 0.025 && !arcLift ? this.underfoot(cell, puddle) : undefined;
          if (
            cell?.space === "outside" &&
            ((this.weather?.tempC ?? 20) < 2 || this.snow >= 0.34) &&
            time >= (this.breathAt.get(id) ?? 0) &&
            this.cameras.main.worldView.contains(im.x, im.y)
          ) {
            const pace = pose === "run" ? 900 : 2300;
            this.breathAt.set(id, time + pace + Math.random() * pace * 0.5);
            const dx = [0, 1, 0, -1][human.direction];
            this.feel.breath(im.x + dx * 4, im.y - 31, dx, im.depth + (human.direction ? 0.1 : -0.1));
          }
          if (this.figureRim()) this.rimLight(id, im);
          // Townsfolk mark only snow: a wet street under a crowd would be all prints.
          if (ground && (id === "player" || ground === "snow"))
            this.feel.track(
              id,
              im.x,
              im.y,
              ground,
              human.direction,
              (this.weather?.wetness ?? 0) > 0.4,
              this.printDepth(),
              "boot",
              this.weather?.condition === "snow",
            );
        }
        if (id === "player") {
          if (this.options.shadows === false) {
            const contact = this.playerContact ??= this.add.ellipse(0, 0, 11, 4, 0x07100c, 0.28);
            contact.setPosition(im.x, im.y + arcLift - 1).setDepth(im.depth - 1)
              .setVisible(!craft && water <= 0.025 && !me.perch)
              .setScale(1 - Math.min(0.5, arcLift / 40))
              .setAlpha(0.28 * (1 - Math.min(0.7, arcLift / 40)));
          }
          if (
            this.feel.stoppedRun(pose === "run", moving, time) &&
            !active &&
            !this.direction().some(Boolean)
          )
            this.feel.skid(im, this.shadows.get(id), human.direction, DUST);
          if (lame === 2 && time >= this.bledAt && wetPos && !craft) {
            this.bledAt = time + (moving ? 260 + Math.random() * 420 : 2500 + Math.random() * 2500);
            this.feel.bleed(im.x, im.y, this.printDepth());
          }
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
          under?.flow ??
            (sample && wetPos
              ? sample(wetPos.x, wetPos.y)?.waterVisual?.flow
              : undefined),
          swimming && (pose === "swim" || pose === "tread") ? index : undefined,
          !!under && !!this.sewerView,
        );
        // Asleep, only the head shows, on the pillow; the room draws the rest
        // under the covers. After wading, which uncrops anyone on dry ground.
        const pillow = asleep ? this.pillows.get(id) : undefined;
        if (pillow && texture) {
          // Turned a quarter, crown to the bolster: lying on their back, face up.
          const crown = this.crownOf(texture);
          im.setCrop(0, crown, im.width, HEAD_ROWS)
            .setOrigin(0.5, (crown + HEAD_ROWS / 2) / im.height)
            .setAngle(-90)
            .setPosition(pillow.x, pillow.y)
            .setDepth(pillow.depth);
        } else if (im.angle) im.setAngle(0).setOrigin(0.5, 1);
        // In a privy, only what shows in the doorway: the jambs and lintel hide the rest.
        const stall = id === "player" && seat && this.runtime.engine.state.player.seated?.on;
        if (stall && PRIVY_DOOR.test(this.entities.get(stall)?.frame.name ?? "") && texture)
          im.setCrop(im.width / 2 - 6, im.height - 30, 13, 30);
        if (!texture || swimming) this.shadows.get(id)?.setVisible(false);
        if (texture && !swimming && !deck && seat?.role !== "drive-cart" && seat?.role !== "sit-seat" && this.options.shadows !== false) {
          const shadowTexture = this.characters.shadow(
            texture,
            this.shadowPhase,
          );
          let shade = this.shadows.get(id);
          if (!shade) {
            shade = this.snowCast(this.add.image(im.x, im.y, shadowTexture));
            this.shadows.set(id, shade);
          }
          shade.setVisible(true);
          // Darkened with the ground, or a fixed blue over dusk grass lightens it.
          if (!this.snowyCasts && shade.tintTopLeft !== this.tint) shade.setTint(this.tint);
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
      if (!this.liveGraphics.occlusion) {
        if (image.alpha !== 1) image.setAlpha(1);
        continue;
      }
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
      if (alpha !== image.alpha) {
        image.setAlpha(alpha);
        (image.getData("rim") as Phaser.GameObjects.Image | undefined)?.setAlpha(alpha * 0.85);
      }
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
    this.syncRims();
    this.placeLodgedProjectiles();
    mark("scene update tail");
  }
  private placeLodgedProjectiles() {
    for (const o of this.runtime.engine.state.objects) {
      const inAnimal = o.projectile?.lodgedIn;
      if (!inAnimal) continue;
      const shaft = this.entities.get(o.id);
      const animal = this.combat().bodyOf(faunaSpriteId(inAnimal.group, inAnimal.n));
      if (!shaft) continue;
      if (!animal) {
        const x = o.pos.x * 16 + 8, y = o.pos.y * 16 + 16;
        shaft.setPosition(x, y - 5 - this.lift(x, y)).setDepth(y + 10);
        continue;
      }
      const dx = o.projectile!.dx, dy = o.projectile!.dy;
      const length = Math.hypot(dx, dy) || 1;
      const thin = o.item === "arrow" || o.item === "bolt" || o.item === "dart";
      const reach = thin ? 4 : 8;
      shaft.setPosition(Math.round(animal.x - dx / length * reach),
        Math.round(animal.y - animal.displayHeight * 0.53 - dy / length * reach * 0.5));
      shaft.setRotation(Math.atan2(dy, dx) + (thin ? 0 : Math.PI / 2) + animal.rotation);
      shaft.setDepth(animal.depth + 1);
    }
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
      if (this.mounted.has(id)) continue;
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
      if (id === this.runtime.engine.conversing) {
        const a = this.runtime.engine.state.actors.find((actor) => actor.id === id);
        if (a) this.ambient.set(id, { ...this.ambient.get(id)!, ...a.pos, direction: a.direction, moving: false });
        continue;
      }
      const rider = this.mountedActors.get(id);
      if (rider?.mount) {
        const at = this.mountAt(rider, clock);
        if (at) this.ambient.set(id, at);
        continue;
      }
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
  private workSite(at: Ambient, pose?: CharacterPose) {
    const assigned = at.target;
    if (assigned) {
      const site = assigned.id ? this.workObjects.get(assigned.id) : assigned;
      if (!site || pose && workTargets[pose] && !workTargets[pose]!.includes(site.family)) return undefined;
      return Math.hypot(site.x - at.x, site.y - at.y) < 3.5 ? site : undefined;
    }
    if (at.activity !== "work") return undefined;
    let best: { id: string; x: number; y: number; family: string } | undefined;
    let bestDist = 3.5;
    for (const site of this.workObjects.values()) {
      if (!site.family.startsWith("worksite-")) continue;
      if (pose && workTargets[pose] && !workTargets[pose]!.includes(site.family)) continue;
      const d = Math.hypot(site.x - at.x, site.y - at.y);
      if (d < bestDist) { bestDist = d; best = site; }
    }
    return best;
  }
  private workMotion(id: string, at: Ambient, time: number, trade?: string, held?: string) {
    const rawSite = this.workSite(at);
    let pose = workPoseFor(at.activity, at.label, rawSite?.family, trade, held);
    if (!pose) return undefined;
    const offset = this.poseOffset(id);
    const cycle = 3500 + offset % 650;
    const age = (time + offset) % cycle;
    const round = Math.floor((time + offset) / cycle);
    // Outdoor craft yards alternate naturally between two authentic gestures across rounds.
    const altPose = rawSite ? STATION_ALTERNATE[rawSite.family] : undefined;
    if (altPose && round % 3 === 1) pose = altPose;
    const site = this.workSite(at, pose) ?? rawSite;
    const field = site?.family === "crop" && !site.id && this.runtime.engine.state.tiles?.[`${site.x},${site.y}`]?.tended;
    if (field && this.runtime.engine.state.clock - field.at < 30 * 60) pose = fieldPose[field.job];
    // A hoe in hand chops at the rows rather than miming.
    if (pose === "work-tend" && /weed|hoe|till|dig|plant/i.test(at.label) && this.heldSprites.get(id)?.includes("-hoe-"))
      pose = "pick-strike";
    const stroke = poseTiming(pose) * 4;
    // Music, prayer, writing, sweeping, cranking and sawing flow without craft pauses.
    if (/^(play-|pray|cense|call|work-(write|sweep|saw|crank))/.test(pose)) {
      const loop = Math.floor((time + offset) / stroke);
      if (pose === "call" && loop % 3) return { pose: "idle" as CharacterPose, index: 0, site };
      return { pose, index: Math.floor(((time + offset) % stroke) / poseTiming(pose)), beat: `${pose}:${loop}`, site };
    }
    const second = stroke + 190;
    if (age < stroke) return { pose, index: Math.floor(age / poseTiming(pose)), beat: `${pose}:${round}:0`, site };
    if (age < second) return { pose, index: 3, site };
    if (age < second + stroke) return { pose, index: Math.floor((age - second) / poseTiming(pose)), beat: `${pose}:${round}:1`, site };
    if (round % 3 === 0 && age < second + stroke + 920)
      return { pose: "work-check" as CharacterPose, index: Math.min(3, Math.floor((age - second - stroke) / poseTiming("work-check"))), site };
    return { pose: "idle" as CharacterPose, index: 0, site };
  }
  private workBeat(id: string, pose: CharacterPose, beat: string, site: ReturnType<WorldScene["workSite"]>, actor: Phaser.GameObjects.Image) {
    if (this.workBeats.get(id) === beat) return;
    this.workBeats.set(id, beat);
    const player = this.entities.get("player");
    if (!actor.visible || player && Math.hypot(actor.x - player.x, actor.y - player.y) > 16 * 12) return;
    const image = site?.id ? this.entities.get(site.id) : undefined;
    const x = image?.x ?? (site ? site.x * 16 + 8 : actor.x + 5);
    const y = image ? image.y - Math.min(10, image.displayHeight * 0.32)
      : site ? site.y * 16 + 8 : actor.y - 10;
    const mark = (dx: number, dy: number, width: number, height: number, color: number, driftX: number, driftY: number, duration = 320) => {
      const dot = this.add.rectangle(x + dx, y + dy, width, height, color).setDepth(actor.depth + 1);
      this.tweens.add({ targets: dot, x: dot.x + driftX, y: dot.y + driftY, alpha: 0,
        duration, ease: "Quad.easeOut", onComplete: () => dot.destroy() });
    };
    if (pose === "work-stir") {
      if (site?.family === "worksite-dye-racks") {
        mark(-3, -1, 2, 2, 0x3b6ca8, -3, -6, 460);
        mark(2, -2, 2, 2, 0xb8484c, 3, -5, 480);
      } else if (site?.family === "worksite-soap-yard") {
        mark(-3, -1, 2, 2, 0xf4f2e6, -2, -8, 520);
        mark(2, -2, 2, 2, 0xced7b4, 2, -9, 600);
      } else if (site?.family === "worksite-press-yard") {
        mark(-2, -1, 2, 2, 0xe4b856, -2, -7, 500);
        mark(2, -2, 1, 2, 0xf0e6c8, 2, -9, 600);
      } else {
        mark(-3, 0, 2, 2, 0xe9e1bd, -2, -9, 550);
        mark(2, -2, 1, 3, 0xd8d4b6, 2, -11, 690);
      }
    } else if (pose === "tug" && site) {
      const dry = site.family === "worksite-ropewalk";
      mark(-1, -3, 2, 2, dry ? 0xd8bf8a : 0xb5e2e8, -2, dry ? -2 : 5, 400);
      mark(2, -2, 1, 2, dry ? 0xc2a26a : 0xd6eff0, 2, dry ? 3 : 6, 480);
    } else if (pose === "work-knead") {
      mark(-2, 0, 2, 2, 0xe3cfab, -5, -3);
      mark(2, 0, 2, 2, 0xe3cfab, 5, -2);
    } else if (pose === "work-throw") {
      mark(-2, 0, 2, 2, 0xc47b52, -4, -3, 340);
      mark(2, -1, 1, 2, 0xa8613d, 4, -2, 360);
    } else if (pose === "work-crank") {
      const silk = site?.family === "worksite-silk-yard";
      mark(-2, -2, 2, 1, silk ? 0xf7f2de : 0xd8bf8a, 4, -4, 340);
      mark(2, -1, 1, 1, silk ? 0xeac968 : 0xc0a06a, -3, -3, 360);
    } else if (pose === "work-scrape") {
      const paper = site?.family === "worksite-paper-yard";
      const wood = site?.family === "worksite-carpenter-bench";
      const c1 = paper ? 0xf3eee0 : wood ? 0xe5ca92 : 0xd9c29e;
      const c2 = paper ? 0xd0e2e4 : wood ? 0xd1ad70 : 0xb89468;
      mark(-2, -2, 2, 1, c1, -3, 5, 360);
      mark(2, -1, 1, 2, c2, 3, 6, 400);
    } else if (pose === "work-chisel") {
      const stone = site?.family === "worksite-mason-bench";
      const bronze = site?.family === "worksite-foundry-yard";
      const c1 = stone ? 0xe5dfd0 : bronze ? 0xdfb15a : 0xe3c48e;
      const c2 = stone ? 0xbdb7a7 : bronze ? 0x7eb29d : 0xc9a368;
      mark(-2, 0, 2, 1, c1, -5, -4, 300);
      mark(2, -1, 1, 1, c2, 5, -5, 320);
      mark(0, 1, 1, 1, c1, 2, 4, 280);
    } else if (pose === "work-pour") {
      if (site?.family === "worksite-foundry-yard") {
        mark(-1, -1, 2, 2, 0xffd97d, -4, -6, 360);
        mark(1, 0, 2, 1, 0xff8f3d, 4, -7, 420);
        mark(0, -2, 1, 1, 0xfff3be, 1, -9, 320);
      } else if (site?.family === "worksite-press-yard") {
        mark(0, -4, 1, 2, 0xdca83e, 2, 5, 340);
        mark(2, -3, 1, 2, 0xc38f2c, 3, 4, 340);
      } else if (site?.family === "crop") {
        mark(0, -5, 1, 2, 0xabced0, 2, 5);
        mark(2, -4, 1, 2, 0x8baeb7, 3, 4);
      }
    } else if (pose === "work-pound") {
      const metal = site?.family === "anvil";
      const color = metal ? 0xffd17a : 0xc9ad83;
      mark(-2, 0, 2, 1, color, -6, metal ? -5 : 2, 260);
      mark(2, -1, 1, 2, color, 5, metal ? -7 : -2, 300);
      mark(0, 1, 1, 1, metal ? 0xffedaa : color, 1, 4, 240);
    } else if (pose === "work-quern") {
      if (image) {
        const peg = this.add.rectangle(x + 3, y, 2, 3, 0xb99b68).setDepth(image.depth + 1);
        const turn = { angle: 0 };
        this.tweens.add({ targets: turn, angle: Math.PI * 2, duration: 560,
          onUpdate: () => peg.setPosition(x + Math.round(Math.cos(turn.angle) * 3), y + Math.round(Math.sin(turn.angle) * 2)),
          onComplete: () => peg.destroy() });
      }
      mark(-2, 1, 1, 1, 0xd2bd8e, -3, 2, 260);
    } else if (pose === "work-grind") {
      mark(-3, 1, 2, 1, 0xc8b99b, -4, 1, 300);
      mark(3, 1, 1, 1, 0xd8c9a8, 3, 1, 300);
    } else if (pose === "work-weave") {
      mark(-4, 0, 5, 1, 0xdcc18a, 8, -1, 280);
      mark(1, -2, 1, 2, 0xf0ddaa, 4, -4, 300);
    } else if (pose === "work-scrub") {
      mark(-2, -1, 2, 2, 0xb8dce1, -4, 5, 360);
      mark(2, 0, 1, 2, 0xd4edf0, 3, 6, 400);
      mark(3, -2, 1, 1, 0xb8dce1, 5, 3, 330);
    } else if (pose === "work-rinse") {
      mark(-2, -2, 2, 2, 0xb4dfe4, -4, 6, 440);
      mark(2, -3, 1, 2, 0xd0eef0, 3, 7, 480);
      mark(0, 0, 1, 1, 0x91c4d2, 1, 5, 380);
    } else if (pose === "work-fish") {
      mark(-3, 0, 2, 1, 0xc7e8ec, -5, 1, 340);
      mark(2, 0, 2, 1, 0xa0d6dc, 5, 1, 420);
      mark(0, -2, 1, 1, 0xe2eeee, 0, -5, 370);
    } else if (pose === "work-hang") {
      const dye = site?.family === "worksite-dye-racks";
      mark(-2, -4, 3, 1, dye ? 0x3b6ca8 : 0xc59d69, -1, 4, 380);
      mark(2, -3, 2, 1, dye ? 0xb8484c : 0x8f7355, 2, 4, 420);
    } else if ((site?.family === "crop" || site?.family === "wild-food") && (pose === "till" || pose === "reap" || pose === "stoop" || pose === "pick-strike")) {
      const color = pose === "reap" ? 0xc3a057 : pose === "stoop" ? 0x91ac57 : 0x967346;
      mark(-1, 1, 2, 1, color, -4, -2);
      mark(1, 0, 1, 2, color, 4, -3);
    } else if (pose === "work-tend") {
      if (site?.family === "worksite-charcoal-yard") {
        mark(-1, -2, 2, 2, 0xadb4be, -2, -10, 680);
        mark(1, 0, 1, 1, 0xff9d47, 2, -5, 360);
      } else {
        mark(-2, 0, 2, 1, 0x816841, -4, 3);
        mark(2, -1, 1, 2, 0x9fba69, 3, -5, 480);
      }
    } else if (pose === "work-sort") {
      mark(-1, -1, 2, 1, 0xd9bf87, 3, -3, 280);
      mark(1, 1, 1, 1, 0xbba175, -3, 2, 260);
    } else if (pose === "work-hammer") {
      mark(-1, 0, 1, 1, 0xffedaa, -6, -6, 260);
      mark(1, -1, 1, 1, 0xffd17a, 5, -8, 300);
      mark(0, 0, 1, 1, 0xffb84a, 2, 4, 220);
    } else if (pose === "work-saw") {
      mark(2, 3, 1, 1, 0xe3c48e, 2, 6, 420);
      mark(3, 3, 1, 1, 0xd2ae74, -1, 7, 480);
    } else if (pose === "work-sweep") {
      mark(-4, 9, 2, 1, 0xc9b896, -6, -2, 420);
      mark(-2, 9, 1, 1, 0xb8a886, -4, -3, 500);
    } else if (pose.startsWith("play-")) {
      // A note: head and stem, drifting up and away.
      const side = Number(beat.split(":")[1]) % 2 ? 1 : -1;
      mark(side * 6, -12, 2, 2, 0x2a2232, side * 4, -10, 900);
      mark(side * 6 + 1, -14, 1, 3, 0x2a2232, side * 4, -10, 900);
    } else if (pose === "cense") {
      mark(-2, 2, 2, 2, 0xe8e4dc, -3, -12, 1100);
      mark(1, 0, 1, 1, 0xd8d4cc, 2, -14, 1300);
    }
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
  /** Two people together: whoever the player is talking to and the player,
   * or two people stopped at the same errand. They face each other and take
   * turns, and at a market one sells to the other. */
  /** The face someone wears for the moment: what they just said, how they
   * take the player standing near, or being ill. */
  private feeling(id: string, human: Pick<Actor, "trust" | "pos">): RestingExpression | undefined {
    const engine = this.runtime.engine, s = engine.state;
    const said = id === engine.conversing ? this.runtime.conversingMood : undefined;
    if (said === "smile" || said === "happy" || said === "laugh") return "smile";
    if (said === "angry" || said === "stern") return "serious";
    if (said === "sad" || said === "worried") return "concerned";
    if (said === "wry") return "soft";
    if (ailing(s, id, s.clock) > 0.3) return "concerned";
    if (id === "player") return undefined;
    const trust = human.trust ?? 0;
    if (id !== engine.conversing && Math.hypot(human.pos.x - s.player.pos.x, human.pos.y - s.player.pos.y) > 3) return undefined;
    return trust >= 2 ? "smile" : trust < 0 ? "serious" : undefined;
  }
  private together(id: string, at: Ambient | undefined, time: number) {
    const engine = this.runtime.engine, talking = engine.conversing;
    const me = this.entities.get(id);
    if (!me) return undefined;
    if (at && !at.moving && at.activity === "skate" && id !== "player") return this.skating(id, at, me, time);
    let other: string | undefined, kind: "chat" | "sale" = "chat", sells = false;
    if (talking && (id === talking || id === "player")) other = id === "player" ? talking : "player";
    else if (at && !at.moving && (at.activity === "visit" || at.activity === "play" || keeps(at)) && id !== "player") {
      other = this.partnerOf(id, at, time);
      const there = other && this.ambient.get(other);
      if (!there) return undefined;
      const selling = (a: Ambient) => keeps(a) || !!a.carry || /selling|sharing/i.test(a.label);
      if (keeps(at) || keeps(there) || /market|trading|square|shop|selling|sharing|landing/i.test(at.label + there.label)) {
        kind = "sale";
        sells = selling(at) === selling(there) ? id < other! : selling(at);
      }
    }
    const im = other && this.entities.get(other);
    if (!im) return undefined;
    const facing = facingFromStep((im.x - me.x) / 16, (im.y - me.y) / 16, at?.direction ?? this.humanActors.get(id)?.direction ?? 2);
    const first = id < other!;
    if (at?.activity === "play") return this.playGame(id, other!, me, im, first, time);
    const offset = this.poseOffset(first ? id : other!);
    const loop = (pose: CharacterPose) => ({ pose, index: Math.floor((time + this.poseOffset(id)) / poseTiming(pose)) % 4, facing, im });
    // Walked up to each other: the greeting first, once.
    const gait = this.gaits.get(id);
    const still = id === "player" || talking === id || !gait || gait.since === -Infinity ? Infinity : time - (gait.still ?? time);
    if (still < 1100) {
      const pose = this.cues.greetingOf(id);
      return { pose, index: Math.min(3, Math.floor(still / 275)), facing, im };
    }
    const beat = kind === "sale" ? 1800 : 2600 + (offset % 1200);
    const turn = Math.floor((time + offset) / beat), into = (time + offset) % beat;
    const once = (pose: CharacterPose) => ({ pose, index: Math.min(3, Math.floor(into / (beat / 4))), facing, im });
    const wary = (id === "player" ? 0 : this.humanActors.get(id)?.trust ?? 0) < 0;
    if (kind === "chat") {
      const speaking = (turn % 2 === 0) === first;
      const seed = engine.state.manifest.seed, pair = first ? `${id}|${other}` : `${other}|${id}`;
      // One pair in a dozen is having words.
      const quarrel = other !== "player" && id !== "player" && random(seed, "quarrel", pair) < 0.08;
      if (speaking && other !== "player" && id !== "player" && this.chatBeat.get(id) !== turn) {
        this.chatBeat.set(id, turn);
        if (this.cameras.main.worldView.contains(me.x, me.y)) {
          const roll = random(seed, "chat", id, turn);
          const kin = this.fondOf(id, other!);
          const mark = quarrel ? (roll < 0.45 ? "grumble" : undefined)
            : kin && roll < 0.3 ? "fond"
            : roll < 0.3 ? "chatter" : roll < 0.38 ? "wonder" : undefined;
          if (mark) this.cues.react(id, mark);
        }
      }
      if (speaking) return loop(quarrel ? (turn % 2 ? "point" : "gesture") : turn % 3 === 2 ? "gesture" : "talk");
      return wary || quarrel || this.poseOffset(id) % 5 === 0 ? loop("fold-arms") : turn % 4 === 3 ? once("nod") : loop("listen");
    }
    // A sale: the buyer points at what they want, the two argue the price,
    // the coin goes over and the goods come back.
    const step = turn % 8;
    if (sells && (step === 4 || step === 5) && into < 40 && this.saleBeat.get(id) !== turn) {
      this.saleBeat.set(id, turn);
      if (step === 4) this.cues.pass(im.x, im.y, me, "coin");
      else this.cues.pass(me.x, me.y, im, "goods");
    }
    if (sells)
      return [loop("gesture"), loop("talk"), loop("gesture"), loop("talk"), once("receive"), once("give"), once("nod"), loop("listen")][step];
    return [once("point"), loop("listen"), loop("shake-head"), loop("fold-arms"), loop("pay"), once("receive"), loop("talk"), once("nod")][step];
  }
  /** The nearest other person stopped at an errand beside this one. A
   * stall keeper only looks for customers. */
  private partnerOf(id: string, at: Ambient, time: number) {
    const known = this.partners.get(id);
    if (known && time < known.until) return known.partner;
    let partner: string | undefined, best = at.activity === "play" ? 2.6 : 2.2;
    for (const [other, there] of this.ambient) {
      if (other === id || there.moving) continue;
      if (at.activity === "play" ? there.activity !== "play" : !(there.activity === "visit" || (!keeps(at) && keeps(there)))) continue;
      const d = Math.hypot(there.x - at.x, there.y - at.y);
      if (d < best) (best = d), (partner = other);
    }
    this.partners.set(id, { partner, until: time + 800 + (this.poseOffset(id) % 400) });
    return partner;
  }
  private partners = new Map<string, { partner?: string; until: number }>();
  /** Someone out on the ice: long figures of eight round their spot, as wide
   * as sound ice allows, with a push every stride and now and then a wobble.
   * On the bank, or where it is too thin, they stand and watch. */
  private skating(id: string, at: Ambient, me: Phaser.GameObjects.Image, time: number) {
    const engine = this.runtime.engine, offset = this.poseOffset(id);
    let room = this.rinks.get(id);
    if (!room || room.x !== at.x || room.y !== at.y) {
      const sound = (dx: number, dy: number) => (engine.iceUnder(Math.round(at.x + dx), Math.round(at.y + dy)) ?? 0) >= ICE_THIN + 0.04;
      const fits = (r: number) => [0, 1, 2, 3, 4, 5, 6, 7].every((k) => sound((Math.cos(k * Math.PI / 4) * r * 34) / 16, (Math.sin(k * Math.PI / 4) * r * 18) / 16));
      room = { x: at.x, y: at.y, r: !sound(0, 0) ? 0 : fits(1) ? 1 : fits(0.6) ? 0.6 : 0.3 };
      this.rinks.set(id, room);
    }
    if (!room.r) return undefined;
    const lap = 5200 + (offset % 1700), turn = Math.floor((time + offset * 7) / 11000);
    const wobble = random(engine.state.manifest.seed, "skate-wobble", id, turn) < 0.1 && (time + offset * 7) % 11000 < 620;
    const t = ((wobble ? time - ((time + offset * 7) % 11000) : time) / lap) * Math.PI * 2 + offset;
    const way = offset % 2 ? 1 : -1;
    const romp = { x: Math.round(Math.sin(t) * 34 * room.r), y: Math.round(Math.sin(2 * t) * 9 * room.r * way + Math.cos(t) * 6 * room.r) };
    const vx = Math.cos(t) * 34, vy = Math.cos(2 * t) * 18 * way - Math.sin(t) * 6;
    const stride = Math.floor(time / 640 + offset);
    if (!wobble && this.skateBeat.get(id) !== stride && this.cameras.main.worldView.contains(me.x, me.y)) {
      this.skateBeat.set(id, stride);
      this.ice?.scratch(me.x, me.y - 1, Math.sign(Math.round(vx / 20)), Math.sign(Math.round(vy / 12)), time);
      const p = engine.state.player.pos;
      if (Math.hypot(at.x - p.x, at.y - p.y) < 7 && stride % 2 === 0) void gameAudio()?.sound(iceSound.skate(), "step");
    }
    const pose: CharacterPose = wobble ? "stumble" : "walk";
    return { pose, index: wobble ? Math.min(3, Math.floor(((time + offset * 7) % 11000) / 155)) : Math.floor(time / 320 + offset) % 4, facing: facingFromStep(Math.abs(vx) > Math.abs(vy) * 0.6 ? vx : 0, Math.abs(vy) > Math.abs(vx) * 0.35 ? vy : 0, 2), im: me, romp };
  }
  private rinks = new Map<string, { x: number; y: number; r: number }>();
  private skateBeat = new Map<string, number>();
  /** Two children at play: tag round and round the spot between them, one a
   * little behind the other, or a clapping game with a jump on the last beat. */
  private playGame(id: string, other: string, me: Phaser.GameObjects.Image, im: Phaser.GameObjects.Image, first: boolean, time: number) {
    const pair = first ? `${id}|${other}` : `${other}|${id}`;
    if (random(this.runtime.engine.state.manifest.seed, "game", pair) < 0.55) {
      const mine = this.romped.get(me) ?? { x: 0, y: 0 }, theirs = this.romped.get(im) ?? { x: 0, y: 0 };
      const mid = { x: ((im.x - theirs.x) - (me.x - mine.x)) / 2, y: ((im.y - theirs.y) - (me.y - mine.y)) / 2 };
      const t = (time / 1700 + (first ? 0 : 0.36)) * Math.PI * 2;
      const romp = { x: Math.round(mid.x + Math.cos(t) * 13), y: Math.round(mid.y + Math.sin(t) * 6) };
      return { pose: "run" as CharacterPose, index: Math.floor(time / poseTiming("run")) % frameCount("run"), facing: facingFromStep(-Math.sin(t), Math.cos(t) * 0.5, 2), im, romp };
    }
    const facing = facingFromStep((im.x - me.x) / 16, (im.y - me.y) / 16, 2);
    const pose: CharacterPose = Math.floor((time + (first ? 0 : 150)) / 1300) % 4 === 3 ? "jump" : "clap";
    return { pose, index: Math.floor(time / poseTiming(pose)) % 4, facing, im };
  }
  /** Moves a child along their game, two pixels a frame at most, and back to
   * their spot when it ends. A walk tween owns the position, so it is dropped then. */
  private romp(im: Phaser.GameObjects.Image, to: { x: number; y: number } | undefined, moving: boolean) {
    const was = this.romped.get(im);
    if (moving) return void this.romped.delete(im);
    if (!was && !to) return;
    const from = was ?? { x: 0, y: 0 }, aim = to ?? { x: 0, y: 0 };
    const step = (a: number, b: number) => a + Math.max(-2, Math.min(2, b - a));
    const next = { x: step(from.x, aim.x), y: step(from.y, aim.y) };
    im.setPosition(im.x - from.x + next.x, im.y - from.y + next.y);
    if (next.x || next.y || to) this.romped.set(im, next);
    else this.romped.delete(im);
  }
  private romped = new WeakMap<Phaser.GameObjects.Image, { x: number; y: number }>();
  /** Where someone in a crowd looks: at the middle of everyone stood there
   * for the same thing, so a festival or a gathering faces in. */
  private crowdFacing(id: string, time: number) {
    if (time >= this.crowdsAt) {
      this.crowdsAt = time + 1000;
      this.crowds.clear();
      const stood = [...this.ambient].filter(([, a]) => !a.moving && a.activity === "visit");
      for (const [who, a] of stood) {
        let x = 0, y = 0, n = 0;
        for (const [, b] of stood)
          if (b.label === a.label && Math.hypot(b.x - a.x, b.y - a.y) < 5) (x += b.x), (y += b.y), n++;
        if (n < 4 || Math.hypot(x / n - a.x, y / n - a.y) < 0.7) continue;
        this.crowds.set(who, facingFromStep(x / n - a.x, y / n - a.y, a.direction));
      }
    }
    return this.crowds.get(id);
  }
  private crowds = new Map<string, number>();
  private crowdsAt = 0;
  /** Waiting at a door for someone: a greeting as they come out to go together. */
  private doorGreet(id: string, im: Phaser.GameObjects.Image, time: number) {
    for (const [other, there] of this.ambient) {
      const them = other !== id && there.moving ? this.entities.get(other) : undefined;
      if (!them || Math.hypot(them.x - im.x, them.y - im.y) > 40) continue;
      const key = `door|${id}|${other}`;
      if (time - (this.passed.get(key) ?? -Infinity) < 120000) continue;
      this.passed.set(key, time);
      this.cues.react(id, this.fondOf(id, other) ? "wave" : "greet", { x: (them.x - 8) / 16, y: (them.y - 16) / 16 });
      return;
    }
  }
  private chatBeat = new Map<string, number>();
  private glances = new Map<string, { other?: string; until: number; scan: number }>();
  private passed = new Map<string, number>();
  /** Kin, household or a friend: who gets a wave and a heart, not a nod. */
  private fondOf(id: string, other: string) {
    const kind = this.runtime.engine.state.actors.find((a) => a.id === id)?.relations?.find((r) => r.other === other)?.kind;
    return !!kind && kind !== "servant" && kind !== "master" && kind !== "apprentice";
  }
  /** Walking past someone: the head turns to them as they go by. Someone
   * standing nods to a passer-by, or waves to kin and friends; two friends
   * passing in the street show a heart. Returns which way the head turns. */
  private glanceAt(id: string, im: Phaser.GameObjects.Image, face: number, time: number) {
    let g = this.glances.get(id);
    if (!g) this.glances.set(id, (g = { until: 0, scan: time + Math.random() * 300 }));
    if (time >= g.until && time >= g.scan) {
      g.scan = time + 300;
      g.other = undefined;
      if (!this.cameras.main.worldView.contains(im.x, im.y)) return 0;
      for (const other of [...this.humanActors.keys(), "player"]) {
        const there = other === id ? undefined : this.entities.get(other);
        if (!there?.visible) continue;
        const dx = (there.x - im.x) / 16, dy = (there.y - im.y) / 16, d = Math.hypot(dx, dy);
        if (d > 1.8 || d < 0.4) continue;
        const ahead = (facingFromStep(dx, dy, face) - face + 8) % 8;
        if (ahead > 1 && ahead < 7) continue;
        const pair = id < other ? `${id}|${other}` : `${other}|${id}`;
        if (time - (this.passed.get(pair) ?? -Infinity) < 30000) continue;
        this.passed.set(pair, time);
        g.other = other;
        g.until = time + 1000;
        const fond = other !== "player" && this.fondOf(id, other);
        const amb = this.ambient.get(other);
        const toward = { x: (im.x - 8) / 16, y: (im.y - 16) / 16 };
        if (amb && !amb.moving && !/work|gather|sleep|rest/i.test(amb.activity)) this.cues.react(other, fond ? "wave" : "nod", toward);
        if (fond) this.cues.react(id, "fond");
        break;
      }
    }
    const there = time < g.until && g.other ? this.entities.get(g.other) : undefined;
    if (!there) return 0;
    const turn = (facingFromStep((there.x - im.x) / 16, (there.y - im.y) / 16, face) - face + 8) % 8;
    return turn >= 1 && turn <= 3 ? 1 : turn >= 5 ? -1 : 0;
  }
  /** A figure is wider than its tile, so two people talking from neighbouring
   * tiles touch faces. Each steps back a pixel a frame, and the offset is taken
   * back before the next frame; the player stays put under the camera. */
  private standApart(id: string, im: Phaser.GameObjects.Image, other: Phaser.GameObjects.Image | undefined, moving: boolean) {
    const was = this.apart.get(im) ?? { x: 0, y: 0 };
    // A walk tween owns the position, so the offset is dropped, not undone.
    if (moving) return void this.apart.delete(im);
    let tx = 0, ty = 0;
    if (other && id !== "player") {
      const off = this.apart.get(other) ?? { x: 0, y: 0 };
      const dx = im.x - was.x - (other.x - off.x), dy = im.y - was.y - (other.y - off.y), d = Math.hypot(dx, dy);
      const gap = d ? Math.min(10, Math.max(0, 26 - d)) * (other === this.entities.get("player") ? 1 : 0.5) : 0;
      tx = Math.round((dx / (d || 1)) * gap);
      ty = Math.round((dy / (d || 1)) * gap * 0.5);
    }
    const x = was.x + Math.sign(tx - was.x), y = was.y + Math.sign(ty - was.y);
    if (x === was.x && y === was.y) return;
    im.setPosition(im.x - was.x + x, im.y - was.y + y);
    if (x || y) this.apart.set(im, { x, y });
    else this.apart.delete(im);
  }
  private apart = new WeakMap<Phaser.GameObjects.Image, { x: number; y: number }>();
  private saleBeat = new Map<string, number>();
  /** Coughs, sneezes, a fever's sweat and queasiness, as often as the illness
   * runs to: a mild case up and about once a minute or so, the worst, in bed,
   * every few seconds. Returns a pose to hold while standing. */
  private showSymptoms(id: string, direction: number, im: Phaser.GameObjects.Image, moving: boolean, asleep: boolean, time: number) {
    if (!this.cameras.main.worldView.contains(im.x, im.y)) return undefined;
    let sick = this.symptoms.get(id);
    if (!sick || time - sick.at > 4000) {
      const { state, world } = this.runtime.engine;
      const actor = id === "player" ? state.player : state.actors.find((a) => a.id === id);
      const s = actor ? symptomsShown(state, actor, world.pack.setting, state.clock) : { cough: 0, sneeze: 0, fever: 0, nausea: 0 };
      sick = { s, at: time, next: sick?.next ?? 0, sweat: sick?.sweat ?? 0 };
      this.symptoms.set(id, sick);
    }
    const { cough, sneeze, fever, nausea } = sick.s;
    const fits = cough + sneeze + nausea;
    if (!fits && fever < 0.2) return undefined;
    const dx = asleep ? 0 : [0, 1, 0, -1][direction];
    const mouth = asleep ? { x: im.x, y: im.y - 2 } : { x: im.x + dx * 4, y: im.y - 26 };
    const depth = im.depth + (asleep || direction ? 0.1 : -0.1);
    if (fever >= 0.2 && time >= sick.sweat) {
      if (sick.sweat) this.feel.sweat(im.x, asleep ? im.y - 4 : im.y - 34, depth);
      sick.sweat = time + (2200 + Math.random() * 2600) / fever;
    }
    // Spread out, so a street of the sick does not cough in chorus.
    if (fits && !sick.next) sick.next = time + (Math.random() * 20000) / fits;
    if (fits && time >= sick.next) {
      sick.next = time + (14000 + Math.random() * 20000) / Math.max(0.25, fits);
      let r = Math.random() * fits;
      const still = !moving && !asleep;
      if ((r -= cough) < 0) {
        this.feel.cough(im, mouth.x, mouth.y, dx, depth, cough > 0.6 ? 3 : 2);
        if (still) this.sickPose.set(id, { pose: "touch-face", from: time, until: time + 640 });
      } else if ((r -= sneeze) < 0) {
        this.feel.sneeze(im, mouth.x, mouth.y, dx, depth);
        if (still) this.sickPose.set(id, { pose: "touch-face", from: time + 380, until: time + 900 });
      } else {
        this.feel.queasy(im.x, asleep ? im.y - 8 : im.y - 42, depth);
        if (still) this.sickPose.set(id, { pose: "stoop", from: time, until: time + 1300 });
      }
    }
    const held = this.sickPose.get(id);
    if (held && time >= held.until) this.sickPose.delete(id);
    return held && time >= held.from && time < held.until ? held : undefined;
  }
  private idleGesture(id: string, time: number, held: boolean, hat: boolean, load: number, temperament?: () => Stats) {
    if (load >= 2) return undefined;
    const offset = this.poseOffset(id), cycle = 16000 + offset % 14000;
    const beat = (time + offset) % cycle;
    if (beat >= 640) return undefined;
    // The habits a temperament runs to, taken in turn from one pause to the next.
    const habits: CharacterPose[] = ["sway"];
    const stats = temperament?.();
    if (held && !load) habits.push("inspect-held");
    if (hat && !held) habits.push("adjust-hat");
    if (stats) {
      if (stats.neuroticism > 60 && !held) habits.push("touch-face", "touch-face");
      if (stats.conscientiousness > 60) habits.push("straighten", "straighten");
      if (stats.extraversion > 65) habits.push("shrug");
      if (stats.agreeableness > 65) habits.push("nod");
    } else habits.push("straighten");
    const pose = habits[(Math.floor((time + offset) / cycle) + offset) % habits.length];
    return { pose, index: heldFrame(pose, beat, 160) };
  }
  private bare = new WeakMap<object, Actor["appearance"]>();
  /** Hat and hood off for bed. */
  private bareHeaded(a: Actor["appearance"]) {
    if (!a || a.wearing.headwear === "none") return a;
    let out = this.bare.get(a);
    if (!out) this.bare.set(a, (out = { ...a, wearing: { ...a.wearing, headwear: "none" } }));
    return out;
  }
  private crownOf(key: string) {
    let top = this.crowns.get(key);
    if (top === undefined) {
      const src = this.textures.get(key).getSourceImage() as HTMLCanvasElement;
      const data = src.getContext?.("2d")?.getImageData(0, 0, src.width, src.height).data;
      top = 0;
      if (data) for (let i = 3; i < data.length; i += 4) if (data[i]) { top = Math.floor((i >> 2) / src.width); break; }
      this.crowns.set(key, top);
      if (this.crowns.size > 512) this.crowns.delete(this.crowns.keys().next().value!);
    }
    return top;
  }
  /** What someone is doing at the piece of their room they are at. */
  private indoorPose(use: NonNullable<ReturnType<Runtime["engine"]["indoorUse"]>>, activity: string, space: string): CharacterPose {
    const meal = /eat|meal|supper|breakfast|dinner/i.test(activity);
    if (use.role === "seat") return use.on === "seat" ? "sit-seat" : use.on === "floor" ? "sit" : meal ? "give" : "idle";
    if (use.role === "fire")
      return use.cooking || /cook|brew/i.test(activity) || meal ? "work-stir"
        : this.runtime.engine.interiorOf(space)?.params.seating === "floor" ? "sit" : "idle";
    return INDOOR_WORK[use.kind] ?? "work-sort";
  }
  /** Idle draws only two things: eyes open, and the blink on frame three. Both
   * the rate and the phase are per-actor, so a street does not wink in unison,
   * and an idle crowd caches two textures a head instead of four. */
  private poseFrame(id: string, pose: CharacterPose, time: number) {
    const offset = this.poseOffset(id);
    if (pose === "idle") {
      const cycle = 3400 + (offset % 3800);
      if ((time + offset) % cycle < 130) return 3;
      if ((time + offset * 7) % (9000 + (offset % 6000)) < 2600) return 2;
      return (time + offset) % 3600 < 1500 ? 1 : 0;
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
  private touchStick?: { dx: number; dy: number; run: boolean; strength?: number };
  /** The stick supplies direction and walking pace; the Run button supplies Shift. */
  setTouchStick(stick?: { dx: number; dy: number; run: boolean; strength?: number }) {
    const was = this.touchStick;
    this.touchStick = stick;
    if (stick) {
      this.shiftHeld = stick.run;
      if (!was) this.pendingDirection = [stick.dx, stick.dy];
    } else if (was) {
      this.shiftHeld = false;
      this.pendingDirection = undefined;
      this.runSteps = 0;
    }
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
  touchThrow(down: boolean) {
    if (down) this.beginAim("throw", "touch", "touch");
    else if (this.aimKind === "throw" && this.aimTrigger === "touch") this.finishAim();
  }
  touchBow(down: boolean) {
    if (down) this.beginAim("bow", "touch", "touch");
    else if (this.aimKind === "bow" && this.aimTrigger === "touch") this.finishAim();
  }
  touchAim(dx: number, dy: number) {
    if (this.aimStarted === undefined || this.aimInput !== "touch") return;
    const dist = Math.hypot(dx, dy);
    if (dist < 9) {
      if (this.touchDragged) {
        const p = this.runtime.engine.state.player.pos;
        this.touchOffset = { x: 0, y: 0 };
        this.aimTarget = { x: p.x, y: p.y };
      }
      return;
    }
    this.touchDragged = true;
    const range = this.aimKind === "bow" ? this.runtime.engine.bowRange() : this.runtime.engine.missile().range;
    const reach = 2 + (range - 2) * Math.min(1, dist / 70);
    const p = this.runtime.engine.state.player.pos;
    this.touchOffset = { x: Math.round(dx / dist * reach), y: Math.round(dy / dist * reach) };
    this.aimTarget = { x: p.x + this.touchOffset.x, y: p.y + this.touchOffset.y };
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

const THRUSTS = new Set<CharacterPose>(["thrust", "spear-thrust", "knife-thrust", "pitchfork-jab", "rake-pull"]);
/** How long a spin holds each of the eight facings. */
const SPIN_STEP_MS = 36;

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

function drawGateLeaves(g: Phaser.GameObjects.Graphics, gap: { x: number; y: number }[], side: boolean) {
  if (side) {
    const x = gap[0].x * 16 + 8, y = gap[0].y * 16, h = gap.length * 16;
    g.fillStyle(0x473324).fillRect(x - 2, y - 26, 4, h + 26);
    g.fillStyle(0x987957).fillRect(x - 2, y - 26, 1, h);
    for (let i = 0; i <= h; i += 8) g.fillStyle(0x302c29).fillRect(x - 2, y - 26 + i, 4, 2);
    return;
  }
  const x0 = Math.min(...gap.map((q) => q.x)) * 16, x1 = (Math.max(...gap.map((q) => q.x)) + 1) * 16;
  const top = (gap[0].y + 1) * 16 - 36;
  g.fillStyle(0x5c3f27).fillRect(x0, top, x1 - x0, 36);
  g.fillStyle(0x3f2b1b);
  for (let x = x0 + 4; x < x1; x += 4) g.fillRect(x, top, 1, 36);
  g.fillStyle(0x7a5636).fillRect(x0, top, x1 - x0, 1);
  g.fillStyle(0x2c2a29).fillRect(x0, top + 7, x1 - x0, 2).fillRect(x0, top + 26, x1 - x0, 2);
  g.fillStyle(0x1e1610).fillRect((x0 + x1) / 2 - 1, top, 2, 36);
  g.fillStyle(0x8c8f92).fillRect((x0 + x1) / 2 - 4, top + 17, 2, 2).fillRect((x0 + x1) / 2 + 2, top + 17, 2, 2);
}
