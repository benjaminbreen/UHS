export const poses = [
  "idle",
  "breathe",
  "walk",
  "setoff",
  "halt",
  "run",
  "climb",
  "wade",
  "swim",
  "tread",
  "carry",
  "pickup",
  "drop",
  "give",
  "talk",
  "point",
  "beckon",
  "nod",
  "wave",
  "adjust-hat",
  "straighten",
  "touch-face",
  "inspect-held",
  "recover",
  "shrug",
  "swing",
  "chop",
  "dig",
  "reap",
  "till",
  "thrust",
  "spear-thrust",
  "spear-throw",
  "knife-thrust",
  "stick-swing",
  "axe-chop",
  "pick-strike",
  "shovel-dig",
  "rake-pull",
  "sickle-cut",
  "scythe-sweep",
  "pitchfork-jab",
  "spin",
  "plunge",
  "cast",
  "draw",
  "whirl",
  "slash",
  "carve",
  "work",
  "work-stir",
  "work-knead",
  "work-pound",
  "work-quern",
  "work-grind",
  "work-weave",
  "work-scrub",
  "work-rinse",
  "work-fish",
  "work-hang",
  "work-tend",
  "work-sort",
  "work-check",
  "work-hammer",
  "work-saw",
  "work-sweep",
  "work-write",
  "work-pour",
  "work-crank",
  "work-scrape",
  "work-chisel",
  "work-throw",
  "play-strum",
  "play-drum",
  "play-flute",
  "pray",
  /** A censer swung on its chains. */
  "cense",
  /** A hand cupped to the mouth: a hawker crying wares, a crier, a call to prayer. */
  "call",
  // Greetings, by where and when: the scene asks content which.
  "bow",
  /** The cupped fist at the chest, the Chinese yi. */
  "fist-salute",
  /** Palms together at the chest: namaste, the wai, the sampeah. */
  "palms",
  /** The right hand to the heart and a small bow. */
  "salaam",
  /** The hat lifted, or the forelock touched without one. */
  "doff",
  "curtsy",
  "clap",
  "raise-hand",
  /** Arms opened and the face lifted: the death scene. */
  "transcend",
  // Two people together: one listens while the other talks.
  "listen",
  "fold-arms",
  /** Both hands open, explaining. */
  "gesture",
  "shake-head",
  /** Hands out for what is handed over, then drawn in. */
  "receive",
  /** Coins counted out of one hand into the other's palm. */
  "pay",
  /** A guard's flat palm: stop there. */
  "halt-hand",
  "stoop",
  "kneel",
  "sway",
  "tug",
  "lift",
  /** Both hands on a bar ahead and the weight leant into it: a pram, a barrow, a cart. */
  "push",
  "startle",
  "jump",
  "land",
  "stumble",
  "roll",
  "kick",
  "hang",
  "skid",
  "hurt",
  /** Badly hurt: doubled over, sinking to a knee, shoulders heaving. */
  "wince",
  "sit",
  /** On a stool, a chair or a bench, feet on the floor. */
  "sit-seat",
  "drive-cart",
  "guide-plough",
  "ride",
  "ride-gallop",
  "cycle",
  "cycle-tuck",
  "cycle-high",
  "cycle-ape",
  "cycle-scoot",
  "cycle-stand",
  "moto",
] as const;
export type CharacterPose = (typeof poses)[number];
export const fieldPose = {
  weed: "stoop", prepare: "till", bank: "till", plant: "work-tend", harvest: "reap", water: "work-pour",
} as const satisfies Record<import("../../core/work-places").FieldJob, CharacterPose>;
const WORKSITE_STATION_FAMILIES = new Set([
  "worksite-fish-mat",
  "worksite-fish-trays",
  "worksite-fish-table",
  "worksite-seine-pegs",
  "worksite-net-rail",
  "worksite-net-frame",
  "worksite-dye-racks",
  "worksite-pottery-rack",
  "worksite-tanner-rack",
  "worksite-loom-frame",
  "worksite-smith-bench",
  "worksite-carpenter-bench",
  "worksite-mason-bench",
  "worksite-press-yard",
  "worksite-paper-yard",
  "worksite-ropewalk",
  "worksite-foundry-yard",
  "worksite-soap-yard",
  "worksite-silk-yard",
  "worksite-charcoal-yard",
]);

/** Normalizes a worksite equipment sprite (base or -1..-3 variant) to its station family. */
export function worksiteStationFamily(sprite?: string): string | undefined {
  if (!sprite) return undefined;
  const base = sprite.replace(/-[1-3]$/, "");
  return WORKSITE_STATION_FAMILIES.has(base) ? base : undefined;
}

const WORKSITE_POSE: Record<string, CharacterPose> = {
  "worksite-dye-racks": "work-stir",
  "worksite-pottery-rack": "work-throw",
  "worksite-tanner-rack": "work-scrape",
  "worksite-loom-frame": "work-weave",
  "worksite-smith-bench": "work-hammer",
  "worksite-carpenter-bench": "work-saw",
  "worksite-mason-bench": "work-chisel",
  "worksite-press-yard": "work-stir",
  "worksite-paper-yard": "work-scrape",
  "worksite-ropewalk": "work-crank",
  "worksite-foundry-yard": "work-pour",
  "worksite-soap-yard": "work-stir",
  "worksite-silk-yard": "work-crank",
  "worksite-charcoal-yard": "work-tend",
  "worksite-net-frame": "work-weave",
  "worksite-net-rail": "work-weave",
  "worksite-seine-pegs": "work-weave",
  "worksite-fish-table": "work-sort",
  "worksite-fish-trays": "work-sort",
  "worksite-fish-mat": "work-sort",
};

/** A small set of physical verbs shared by trades in every era. */
export function workPoseFor(activity: string, label: string, family = "", trade = "", held = ""): CharacterPose | undefined {
  const task = label.toLowerCase();
  const play = ({ lute: "play-strum", drum: "play-drum", flute: "play-flute" } as const)[held];
  // A musician plays wherever the day stands them, not only at work.
  if (play && (trade === "musician" || trade === "storyteller") && /^(work|play|visit|warm)$/.test(activity)) return play;
  if (activity === "work" && family && WORKSITE_POSE[family]) {
    if (family === "worksite-charcoal-yard" && trade === "sawyer") return "work-saw";
    if (family === "worksite-carpenter-bench" && /^(cooper|wheelwright)$/.test(trade)) return "work-chisel";
    return WORKSITE_POSE[family];
  }
  if (activity === "work" && trade) {
    if (trade === "storyteller") return "talk";
    if (trade === "religious-specialist") return held === "censer" ? "cense" : "pray";
    if (/^(scribe|clerk|bank-clerk|tax-collector|toll-keeper|schoolteacher|stationmaster|headman)$/.test(trade)) return "work-write";
    if (/^(innkeeper|publican|waiter|bronze-caster)$/.test(trade)) return "work-pour";
    if (trade === "knife-grinder") return "work-scrape";
    if (trade === "organ-grinder") return "work-crank";
    if (trade === "lamplighter" && /lamp/.test(task)) return "work-hang";
    if (trade === "juice-seller" || (trade === "water-carrier" && /pouring/.test(task))) return "work-pour";
    if (/^(town-crier|balloon-seller|goldfish-seller|rag-and-bone)$/.test(trade) || (trade === "night-watchman" && /hour|clappers|beating/.test(task))) return "call";
    if (/^(street-hawker|street-vendor|costermonger|hawker|pedlar|chapman)$/.test(trade)) return "call";
    if (/^(sweeper|chimney-sweep|sexton|charwoman|housemaid|scullion|servant|domestic-servant)$/.test(trade)) return "work-sweep";
    if (/^(washerwoman|laundress)$/.test(trade)) return "work-scrub";
    if (trade === "tanner" && family !== "tanning-pits") return "work-scrape";
    if (trade === "potter") return "work-throw";
    if (/^(silk-farmer|rope-maker|cordage-maker)$/.test(trade)) return "work-crank";
    if (trade === "soap-boiler") return "work-stir";
    if (trade === "charcoal-burner") return "work-tend";
    if (/^(cooper|wheelwright|mason|stonemason|bricklayer)$/.test(trade) &&
      !/quern|metate|grinder/.test(family)) return "work-chisel";
    if (/^(smith|blacksmith|armourer|ironworker|boilermaker|toolmaker)$/.test(trade) &&
      !/quern|metate|grinder/.test(family)) return "work-hammer";
    if (/^(sawyer|carpenter|cabinetmaker|boatwright|canoe-builder)$/.test(trade)) return "work-saw";
  }
  if (activity === "draw-water" || (activity === "haul" && family === "seine-rope")) return "tug";
  if (activity === "haul-catch" && family === "drying-rack") return "work-hang";
  if (activity === "cook") return "work-stir";
  if (activity === "gather" && family === "wild-food") return /root/.test(task) ? "till" : /fruit tree/.test(task) ? "work-tend" : "stoop";
  if ((activity === "gather" && /plant|crop|herb|fruit|berry/.test(task)) ||
      (activity === "tend" && (/crop|field|weed|row|plant|garden|farm|flock|herd|animal|water|hive/.test(task) ||
        /crop|stock-pen|trough|beehive|log-hive|pipe-hive/.test(family)))) return "work-tend";
  if (activity !== "work") return undefined;
  if (family === "tanning-pits") return "work-scrub";
  if (family === "hide-frame") return "work-scrape";
  if (family === "quern") return "work-quern";
  if (family === "metate" || family === "grinder") return "work-grind";
  if (family === "fish-weir") return "work-fish";
  if (family === "shallow-water")
    return /working (near )?(the )?water|fishing/.test(task) ? "work-fish" : "work-rinse";
  if (/weav|cloth|loom|spin|thread|fibre|sew|stitch|tailor|clothes|shoes|leather/.test(task)) return "work-weave";
  if (/wash|clean|scrub|fulling|launder/.test(task)) return "work-scrub";
  if (/bake|bread|dough|clay|brick|turning pots|preparing food/.test(task)) return "work-knead";
  if (/brew|cook|boil|stir|dye|\bvat|pressing oil|making candles|keeping the fire/.test(task)) return "work-stir";
  if (/grind|grain|mortar|pound|stone|metal|smith|tool|wood|timber|build|forge|hammer|roof|raising a barrel/.test(task)) return "work-pound";
  if (/field|cultivat|crop|weed|plant|harvest|garden|tend|farm|hive/.test(task)) return "work-tend";
  if (/exchang|stall|market|record|count|weigh|seal|pack|sort|keeping the house|household work|on the line/.test(task)) return "work-sort";
  if (!/^at |^working$|^household craft work$/.test(task)) return undefined;
  if (/loom|warp/.test(family)) return "work-weave";
  if (/wash-tub|tanning/.test(family)) return "work-scrub";
  if (/cooking-pot|hearth|stove|barrel|storage-jar|dye-vat/.test(family)) return "work-stir";
  if (/grinder|mortar|anvil|knapping|grindstone/.test(family)) return "work-pound";
  if (/crop|hoe|rake|sheaf/.test(family)) return "work-tend";
  if (/beam-scale|crate-stack|grain-sacks/.test(family)) return "work-sort";
  return undefined;
}
export const poseFrames = 4;
/** The walk and the run have eight: four beats for each foot. */
export const frameCount = (pose: CharacterPose) =>
  pose === "walk" || pose === "run" || pose === "guide-plough" || pose.startsWith("cycle") ? 8 : poseFrames;
export function poseTiming(pose: CharacterPose) {
  if (pose === "wade") return 210;
  if (pose === "swim") return 190;
  if (pose === "tread") return 300;
  // Eight frames in the time the four used to take.
  if (pose === "walk") return 80;
  // A run reads as a run through cadence as much as through the pose. Eight
  // frames at 55ms is a touch slower than the four at 95 it replaced.
  if (pose === "run") return 55;
  // Four frames across the 340ms ledge scramble in animateCommand.
  if (pose === "climb") return 85;
  if (pose === "breathe") return 1000;
  if (pose === "nod" || pose === "wave") return 130;
  if (pose === "adjust-hat" || pose === "straighten" || pose === "touch-face" || pose === "inspect-held") return 160;
  if (pose === "recover") return 55;
  if (pose === "stoop" || pose === "sway") return 320;
  if (pose === "kneel" || pose === "tug" || pose === "lift" || pose === "push") return 240;
  // Crouch, launch, apex, reach for the ground. The scene spreads these over
  // the arc itself; this is the lab's cadence.
  if (pose === "jump") return 90;
  // Impact, hold, rise, settle.
  if (pose === "land" || pose === "roll") return 70;
  // A heavy landing staggers on for two steps.
  if (pose === "stumble") return 85;
  // Run at the wall, plant, push, or slide back down it.
  if (pose === "kick") return 80;
  // Catch, dangle, pull, over the top.
  if (pose === "hang") return 110;
  if (pose === "skid") return 35;
  // A chop is a swing with a heavier head; a dig and a sweep are slower still.
  if (pose === "chop") return 120;
  if (pose === "dig" || pose === "reap" || pose === "till") return 150;
  if (pose === "thrust") return 105;
  if (pose === "spear-thrust") return 105;
  if (pose === "spear-throw") return 100;
  if (pose === "knife-thrust") return 70;
  if (pose === "stick-swing") return 100;
  if (pose === "axe-chop" || pose === "pick-strike") return 125;
  if (pose === "shovel-dig" || pose === "rake-pull") return 150;
  if (pose === "sickle-cut") return 85;
  if (pose === "scythe-sweep") return 135;
  if (pose === "pitchfork-jab") return 110;
  // The scene turns the body through the circle; these only set the arm.
  if (pose === "spin") return 90;
  // Raise and dive are spread over the jump; the impact and rise are quick.
  if (pose === "plunge") return 80;
  if (pose === "cast") return 120;
  if (pose === "draw") return 100;
  // The last of these is the release; the scene loops the first three while aiming.
  if (pose === "whirl") return 90;
  // A knife is quick: the whole cut is over before a swing reaches its top.
  if (pose === "slash") return 65;
  if (pose === "carve") return 200;
  if (pose === "work-stir" || pose === "work-weave" || pose === "work-quern") return 185;
  if (pose === "work-knead" || pose === "work-grind" || pose === "work-scrub" || pose === "work-rinse" || pose === "work-tend") return 175;
  if (pose === "work-fish") return 210;
  if (pose === "work-hang") return 190;
  if (pose === "work-sort") return 180;
  if (pose === "work-pound") return 155;
  if (pose === "work-check") return 230;
  if (pose === "work-hammer") return 140;
  if (pose === "work-chisel") return 150;
  if (pose === "work-saw" || pose === "work-sweep") return 160;
  if (pose === "work-crank") return 170;
  if (pose === "work-scrape") return 175;
  if (pose === "work-throw") return 190;
  if (pose === "work-write") return 210;
  if (pose === "work-pour") return 240;
  // Strum and drum on the beat of a walking tune; the flute's fingers are slower.
  if (pose === "play-strum" || pose === "play-drum") return 150;
  if (pose === "play-flute") return 220;
  if (pose === "pray") return 340;
  if (pose === "transcend") return 420;
  if (pose === "cense") return 260;
  if (pose === "call") return 200;
  if (pose === "listen" || pose === "fold-arms") return 420;
  if (pose === "gesture") return 210;
  if (pose === "shake-head") return 140;
  return pose === "idle"
    ? 360
    : pose === "swing" || pose === "hurt"
      ? 110
      : 160;
}
export const poseContactMs = (pose: CharacterPose) => poseTiming(pose) * 2;

/**
 * How long each frame is held, as shares of the pose's even beat: an action
 * reads by the pose it holds and the ones it snaps through. Shares sum to the
 * frame count, and anything with a contact frame keeps frame 2 starting at
 * two beats, so strike effects still land on it.
 */
const holds: Partial<Record<CharacterPose, readonly number[]>> = {
  land: [1.8, 1.2, 0.5, 0.5],
  startle: [0.5, 1.8, 1, 0.7],
  hurt: [0.6, 1.6, 1, 0.8],
  stumble: [0.8, 1.4, 1, 0.8],
  skid: [0.8, 1.6, 1, 0.6],
  roll: [0.6, 1.4, 1.2, 0.8],
  kick: [0.8, 0.8, 1.4, 1],
  // Wind up long, snap to the top, hit, recover.
  ...Object.fromEntries(
    ["swing", "chop", "axe-chop", "pick-strike", "stick-swing", "slash", "dig", "shovel-dig", "till", "reap", "sickle-cut",
      "scythe-sweep", "rake-pull", "thrust", "spear-thrust", "spear-throw", "knife-thrust", "pitchfork-jab", "cast"]
      .map((pose) => [pose, [1.4, 0.6, 1.2, 0.8]]),
  ),
  "adjust-hat": [0.7, 1.5, 1.1, 0.7],
  "touch-face": [0.7, 1.6, 1, 0.7],
  "inspect-held": [0.6, 1.6, 1.2, 0.6],
};
/** The frame showing `elapsed` ms into a pose played at `ms` a frame. */
export function heldFrame(pose: CharacterPose, elapsed: number, ms = poseTiming(pose), last = frameCount(pose) - 1) {
  const shares = holds[pose];
  if (!shares) return Math.min(last, Math.floor(elapsed / ms));
  let t = elapsed / ms;
  for (let i = 0; i < shares.length; i++) if ((t -= shares[i]) < 0) return Math.min(i, last);
  return last;
}
