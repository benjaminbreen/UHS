/** Uses actual screen-space actor position, including movement and terrain lift. */
export function canopyHidesPlayer(
  tree: { x: number; y: number; width: number; height: number; cut: number },
  player: { x: number; y: number },
) {
  return (
    player.y < tree.y - 8 &&
    player.y > tree.y - tree.height - 8 &&
    player.y - 20 < tree.y - tree.height + tree.cut &&
    Math.abs(player.x - tree.x) < tree.width * 0.43
  );
}
