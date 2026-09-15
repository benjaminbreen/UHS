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

/** Registers pixels as a texture by uploading them straight to the GPU.
 * Phaser's canvas textures read the whole canvas back in their constructor to
 * keep a pixel buffer we never use, and even writing the pixels through a
 * canvas costs a putImageData; both were most of installing a terrain chunk. */
export function addPixelTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  pixels: Uint8ClampedArray,
) {
  scene.textures.addUint8Array(
    key,
    new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength),
    width,
    height,
  );
}
