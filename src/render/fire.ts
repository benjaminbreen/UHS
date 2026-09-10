import type { LightingId } from "./lighting";
/** Animated fire props: frame `x` has siblings `x-f1..x-f3` in the atlas. */
export const animatedBase = (frame: string) => frame.replace(/-f\d+$/, "");
export const animatedFrames = (names: string[]) =>
  new Set(names.filter((n) => /-f1$/.test(n)).map(animatedBase));
/** Local light from a fire, by band. A little even at midday, so the glow
 * does not pop on at dusk. */
export const glowAlpha: Record<LightingId, number> = {
  "early-morning": 0.22,
  morning: 0.08,
  midday: 0.06,
  afternoon: 0.1,
  dusk: 0.4,
  night: 0.62,
};
export const FIRE_FRAME_MS = 130;
export const SMOKE_PUFFS = 3;
export const SMOKE_MS = 2400;
/** Radial glow and a soft smoke disc, drawn once per scene. */
export function ensureFireTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists("fire-glow")) {
    const size = 112;
    const canvas = scene.textures.createCanvas("fire-glow", size, size)!;
    const ctx = canvas.context;
    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      2,
      size / 2,
      size / 2,
      size / 2,
    );
    g.addColorStop(0, "rgba(255,190,90,0.85)");
    g.addColorStop(0.35, "rgba(255,140,50,0.38)");
    g.addColorStop(0.7, "rgba(200,80,20,0.1)");
    g.addColorStop(1, "rgba(120,40,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    canvas.refresh();
  }
  if (!scene.textures.exists("fire-smoke")) {
    const size = 14;
    const canvas = scene.textures.createCanvas("fire-smoke", size, size)!;
    const ctx = canvas.context;
    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      1,
      size / 2,
      size / 2,
      size / 2,
    );
    g.addColorStop(0, "rgba(150,145,135,0.9)");
    g.addColorStop(0.6, "rgba(150,145,135,0.45)");
    g.addColorStop(1, "rgba(150,145,135,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    canvas.refresh();
  }
}
