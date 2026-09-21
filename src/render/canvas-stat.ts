const written = new WeakMap<HTMLCanvasElement, Map<string, string>>();

/**
 * Sets a data attribute on the game canvas only when its value changes. Each
 * write is a DOM mutation on the element Phaser draws into, so per-frame
 * readouts must go through here. Keys written here must not be written
 * directly elsewhere, or the cache goes stale.
 */
export function canvasStat(
  canvas: HTMLCanvasElement,
  key: string,
  value: string | number,
) {
  let seen = written.get(canvas);
  if (!seen) written.set(canvas, (seen = new Map()));
  const text = typeof value === "number" ? String(value) : value;
  if (seen.get(key) === text) return;
  seen.set(key, text);
  canvas.dataset[key] = text;
}
