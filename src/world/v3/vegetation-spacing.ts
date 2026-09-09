/** Local priority thinning: deterministic, bounded and independent of chunk order. */
export type TreeCandidate = {
  sprite: string;
  radius: number;
  priority: number;
};
export function retainsTree(
  x: number,
  y: number,
  own: TreeCandidate,
  candidate: (x: number, y: number) => TreeCandidate | undefined,
  spacing = 0.45,
) {
  const reach = Math.ceil((own.radius + 4.5) * spacing);
  for (let dy = -reach; dy <= reach; dy++)
    for (let dx = -reach; dx <= reach; dx++) {
      if (!dx && !dy) continue;
      const other = candidate(x + dx, y + dy);
      if (!other || Math.hypot(dx, dy) >= (own.radius + other.radius) * spacing)
        continue;
      if (
        other.priority > own.priority ||
        (other.priority === own.priority && (dy < 0 || (!dy && dx < 0)))
      )
        return false;
    }
  return true;
}
export function broadleafAge(roll: number) {
  return roll < 0.16
    ? "nature-broadleaf-sapling"
    : roll < 0.55
      ? "nature-broadleaf-young"
      : roll < 0.94
        ? "nature-broadleaf-mature"
        : "nature-broadleaf-giant";
}
export function crownRadius(sprite: string) {
  return sprite === "nature-teak"
    ? 2.75
    : sprite.endsWith("giant")
      ? 4.5
      : sprite.endsWith("mature")
        ? 3.5
        : sprite.endsWith("sapling")
          ? 1.2
          : sprite.endsWith("young")
            ? 2.25
            : sprite.includes("broadleaf")
              ? 3
              : sprite.includes("pine") || sprite.includes("willow")
                ? 2.5
                : 1.8;
}
