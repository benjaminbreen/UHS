import type Phaser from "phaser";
/** Exact ownership of a rendered chunk; shared atlases are never included. */
export type RenderResources = {
  objects: Phaser.GameObjects.GameObject[];
  textures: string[];
};
export const renderResources = (): RenderResources => ({
  objects: [],
  textures: [],
});
export function own<T extends Phaser.GameObjects.GameObject>(
  resources: RenderResources,
  object: T,
): T {
  resources.objects.push(object);
  return object;
}
