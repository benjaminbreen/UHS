export const poses = [
  "idle",
  "breathe",
  "walk",
  "carry",
  "pickup",
  "drop",
  "give",
  "talk",
  "point",
  "beckon",
  "shrug",
  "swing",
  "thrust",
  "work",
  "stoop",
  "kneel",
  "sway",
  "tug",
  "lift",
  "startle",
  "jump",
  "hurt",
  "sit",
] as const;
export type CharacterPose = (typeof poses)[number];
export const poseFrames = 4;
export function poseTiming(pose: CharacterPose) {
  if (pose === "breathe") return 1000;
  if (pose === "stoop" || pose === "sway") return 320;
  if (pose === "kneel" || pose === "tug" || pose === "lift") return 240;
  // Four frames across a ~360ms arc: crouch, launch, apex, land.
  if (pose === "jump") return 90;
  return pose === "idle"
    ? 360
    : pose === "swing" || pose === "hurt"
      ? 110
      : 160;
}
