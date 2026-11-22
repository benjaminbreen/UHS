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
  pixels: Uint8ClampedArray | Uint8Array,
) {
  return scene.textures.addUint8Array(
    key,
    pixels instanceof Uint8Array
      ? pixels
      : new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength),
    width,
    height,
  );
}

/** Zeroes a canvas's backing store so WebKit releases its native buffer immediately. */
export function releaseCanvas(canvas: HTMLCanvasElement | null | undefined) {
  if (!canvas) return;
  canvas.width = 0;
  canvas.height = 0;
}

/** Removes a Phaser texture and zeroes any non-pooled canvas backing store.
 * Phaser's CanvasPool only shrinks pooled canvases; addCanvas elements otherwise
 * retain their native backing store until JSC collects them. */
export function releaseTexture(scene: Phaser.Scene, key: string) {
  if (scene.textures.exists && !scene.textures.exists(key)) return;
  const tex = scene.textures.get?.(key);
  const canvases: HTMLCanvasElement[] = [];
  for (const s of tex?.source ?? [])
    if (s.isCanvas && typeof HTMLCanvasElement !== "undefined" && s.image instanceof HTMLCanvasElement)
      canvases.push(s.image);
  scene.textures.remove(key);
  for (const c of canvases) if (c.width > 1 || c.height > 1) releaseCanvas(c);
}
