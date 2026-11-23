import Phaser from "phaser";
import { gameAudio } from "../audio/director";
import type { Signal } from "../core/combat";
import { INJURY_SCENE_MS, injuryDef, type InjuryPart } from "../content/health/injuries";
import type { CharacterPose } from "./characters/poses";

const ZOOM = 1.6;

/** Where on a standing figure (feet at 0) the hurt is, in pixels up. */
const PART_Y: Record<InjuryPart, number> = { leg: 6, arm: 17, hand: 13, ribs: 18, head: 27, face: 25, skin: 16 };

/** A serious injury, the way an old RPG takes a blow: the world stops, the
 * view closes in on the player and darkens round them, they double over and
 * sink to a knee, and a lament plays. The card follows (`SetbackCard`). */
export class InjuryScene {
  private seen = 0;
  private at = -Infinity;
  private part: InjuryPart = "skin";
  private zoomFrom = 1;
  private shade?: Phaser.GameObjects.Image;
  private fx?: Phaser.GameObjects.Graphics;

  constructor(private scene: Phaser.Scene) {}

  /** True when a scene starts. */
  consume(signals: readonly Signal[], time: number) {
    let started = false;
    for (const s of signals) {
      if (s.serial <= this.seen) continue;
      this.seen = s.serial;
      if (s.kind !== "injured") continue;
      this.at = time;
      this.part = injuryDef(s.id)?.part ?? "skin";
      this.zoomFrom = this.scene.cameras.main.zoom;
      this.scene.cameras.main.shake(140, 0.006);
      gameAudio()?.injured(injuryDef(s.id));
      started = true;
    }
    return started;
  }

  get active() {
    return this.at > -Infinity;
  }

  /** The player's pose while it plays: struck, doubled over, down on a knee,
   * shoulders heaving. */
  pose(time: number): { pose: CharacterPose; frame: number } | undefined {
    const t = time - this.at;
    if (t < 0 || t > INJURY_SCENE_MS + 700) return undefined;
    if (t < 360) return { pose: "hurt", frame: Math.floor(t / 90) };
    if (t < 560) return { pose: "wince", frame: 0 };
    if (t < 800) return { pose: "wince", frame: 1 };
    return { pose: "wince", frame: 2 + (Math.floor((t - 800) / 420) & 1) };
  }

  /** `player` is the player's sprite; `zoom` the zoom to come back to. */
  update(time: number, player: Phaser.GameObjects.Image | undefined, zoom: number) {
    const t = time - this.at;
    const cam = this.scene.cameras.main;
    if (!this.active) return;
    const end = INJURY_SCENE_MS + 700;
    if (t > end || !player) {
      this.at = -Infinity;
      cam.setZoom(zoom);
      this.shade?.setVisible(false);
      this.fx?.clear();
      return;
    }
    const ease = (k: number) => 1 - (1 - Math.min(1, Math.max(0, k))) ** 3;
    const closing = ease(t / 650), opening = ease((t - INJURY_SCENE_MS) / 700);
    const level = closing * (1 - opening);
    cam.setZoom(this.zoomFrom + (this.zoomFrom * ZOOM - this.zoomFrom) * level + (zoom - this.zoomFrom) * opening);

    // In the world, on the player, so it zooms with the view.
    const shade = (this.shade ??= this.scene.add.image(0, 0, this.vignette()).setDepth(19000.5));
    const span = (Math.max(this.scene.scale.width, this.scene.scale.height) * 2.6) / cam.zoom;
    shade.setVisible(true).setAlpha(0.9 * level).setPosition(player.x, player.y - 14).setDisplaySize(span, span);

    const g = (this.fx ??= this.scene.add.graphics().setDepth(19001));
    g.clear();
    if (t < 300 || level < 0.3) return;
    const x = Math.round(player.x), foot = Math.round(player.y);
    // The hurt itself throbs: a red ring on the part, beating.
    const beat = ((t - 300) % 700) / 700;
    const y = foot - PART_Y[this.part] + (t > 800 ? 4 : 0);
    g.lineStyle(1, 0xe04848, (1 - beat) * 0.9 * level).strokeCircle(x + 3, y, 2 + beat * 5);
    if (this.part === "head") {
      // Stars round the head.
      for (let i = 0; i < 3; i++) {
        const a = (t / 380 + (i * Math.PI * 2) / 3) % (Math.PI * 2);
        const px = Math.round(x + Math.cos(a) * 7), py = Math.round(foot - 30 + Math.sin(a) * 2.5);
        g.fillStyle(0xfff2a0, level).fillRect(px, py - 1, 1, 3).fillRect(px - 1, py, 3, 1);
      }
    }
    // A bead of sweat runs down the brow, and again.
    const drop = ((t - 900) % 1100) / 1100;
    if (t > 900 && drop < 0.8) {
      const dy = Math.round(foot - 28 + drop * 6);
      g.fillStyle(0xa8d8f0, level * (1 - drop)).fillRect(x - 5, dy, 1, 2).fillRect(x - 6, dy + 1, 1, 1);
    }
  }

  /** A dark that thickens toward the edges, clear round the middle. */
  private vignette() {
    const key = "injury-vignette";
    if (this.scene.textures.exists(key)) return key;
    const size = 256, tex = this.scene.textures.createCanvas(key, size, size)!;
    const ctx = tex.getContext(), r = size / 2;
    const grad = ctx.createRadialGradient(r, r, r * 0.05, r, r, r);
    grad.addColorStop(0, "rgba(8,6,20,0)");
    grad.addColorStop(0.09, "rgba(8,6,20,0.1)");
    grad.addColorStop(0.2, "rgba(8,6,20,0.85)");
    grad.addColorStop(1, "rgba(8,6,20,1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
    return key;
  }

  dispose() {
    this.shade?.destroy();
    this.fx?.destroy();
  }
}
