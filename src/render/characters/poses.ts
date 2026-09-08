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
  "startle",
  "hurt",
  "sit",
] as const;
export type CharacterPose = (typeof poses)[number];
export const poseFrames = 4;
export function poseTiming(pose: CharacterPose) {
  if (pose === "breathe") return 1000;
  return pose === "idle"
    ? 360
    : pose === "swing" || pose === "hurt"
      ? 110
      : 160;
}
