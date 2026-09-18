import Phaser from "phaser";

let active: Phaser.Game | undefined;

export function registerGame(game: Phaser.Game | undefined) {
  active = game;
}

/**
 * Phaser only honours targetFps when the loop runs on setTimeout, so a cap
 * below the display rate means restarting the driver, not setting a field.
 */
export function applyFrameCap(cap: number) {
  const loop = active?.loop;
  if (!loop?.raf) return;
  loop.targetFps = cap;
  loop.raf.stop();
  if (cap >= 60) loop.raf.start(loop.step.bind(loop), false, 0);
  else loop.raf.start(loop.step.bind(loop), true, 1000 / cap);
}

/** Phaser's own loop rate, which a cap changes even when rAF does not. */
export function engineFps() {
  return Math.round(active?.loop.actualFps ?? 0);
}
