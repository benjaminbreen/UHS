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
  "hurt",
  "sit",
] as const;
export type CharacterPose = (typeof poses)[number];
export const poseFrames = 4;
export function poseTiming(pose: CharacterPose) {
  if (pose === "wade") return 210;
  // A run reads as a run through cadence as much as through the pose.
  if (pose === "run") return 95;
  // Four frames across the 340ms ledge scramble in animateCommand.
  if (pose === "climb") return 85;
  if (pose === "breathe") return 1000;
  if (pose === "stoop" || pose === "sway") return 320;
  if (pose === "kneel" || pose === "tug" || pose === "lift") return 240;
  // Crouch, launch, apex, reach for the ground. The scene spreads these over
  // the arc itself; this is the lab's cadence.
  if (pose === "jump") return 90;
  // Impact, hold, rise, settle.
  if (pose === "land") return 70;
  // A chop is a swing with a heavier head; a dig and a sweep are slower still.
  if (pose === "chop") return 120;
  if (pose === "dig" || pose === "reap" || pose === "till") return 150;
  return pose === "idle"
    ? 360
    : pose === "swing" || pose === "hurt"
      ? 110
      : 160;
}
