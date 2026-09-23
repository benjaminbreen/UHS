export const poses = [
  "idle",
  "breathe",
  "walk",
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
  "shrug",
  "swing",
  "chop",
  "dig",
  "reap",
  "till",
  "thrust",
  "work",
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
  return pose === "idle"
    ? 360
    : pose === "swing" || pose === "hurt"
      ? 110
      : 160;
}
