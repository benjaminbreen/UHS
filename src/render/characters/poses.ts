export const poses = [
  "idle",
  "breathe",
  "walk",
  "setoff",
  "halt",
  "run",
  "climb",
  "wade",
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
  "stoop",
  "kneel",
  "sway",
  "tug",
  "lift",
  "startle",
  "jump",
  "land",
  "stumble",
  "roll",
  "kick",
  "hang",
  "skid",
  "hurt",
  "sit",
] as const;
export type CharacterPose = (typeof poses)[number];
/** A small set of physical verbs shared by trades in every era. */
export function workPoseFor(activity: string, label: string, family = ""): CharacterPose | undefined {
  const task = label.toLowerCase();
  if (activity === "draw-water") return "tug";
  if (activity === "haul-catch" && family === "drying-rack") return "work-hang";
  if (activity === "cook") return "work-stir";
  if ((activity === "gather" && /plant|crop|herb|fruit|berry/.test(task)) ||
      (activity === "tend" && (/crop|field|weed|row|plant|garden|farm|flock|herd|animal|water|hive/.test(task) ||
        /crop|stock-pen|trough|beehive|log-hive|pipe-hive/.test(family)))) return "work-tend";
  if (activity !== "work") return undefined;
  if (family === "tanning-pits" || family === "hide-frame") return "work-scrub";
  if (family === "quern") return "work-quern";
  if (family === "metate" || family === "grinder") return "work-grind";
  if (family === "fish-weir") return "work-fish";
  if (family === "shallow-water")
    return /working (near )?(the )?water|fishing/.test(task) ? "work-fish" : "work-rinse";
  if (/weav|cloth|loom|spin|thread|fibre|sew|stitch|tailor|clothes|shoes|leather/.test(task)) return "work-weave";
  if (/wash|clean|scrub|fulling|launder/.test(task)) return "work-scrub";
  if (/bake|bread|dough|clay|brick|turning pots|preparing food/.test(task)) return "work-knead";
  if (/brew|cook|boil|stir|dye|vat|pressing oil|making candles|keeping the fire/.test(task)) return "work-stir";
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
  pose === "walk" || pose === "run" ? 8 : poseFrames;
export function poseTiming(pose: CharacterPose) {
  if (pose === "wade") return 210;
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
  if (pose === "kneel" || pose === "tug" || pose === "lift") return 240;
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
  if (pose === "draw") return 140;
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
  return pose === "idle"
    ? 360
    : pose === "swing" || pose === "hurt"
      ? 110
      : 160;
}
export const poseContactMs = (pose: CharacterPose) => poseTiming(pose) * 2;
