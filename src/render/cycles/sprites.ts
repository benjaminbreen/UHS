import type Phaser from "phaser";
import type { CycleLook, CyclePose } from "../../core/cycles";
import { CYCLE_H, CYCLE_W, paintCycle, type CycleState, type CycleView } from "./paint";

export interface CycleFrame {
  /** Texture drawn behind the rider. */
  under: string;
  /** Texture drawn in front of the rider, when the view has one. */
  over?: string;
  rider: [number, number];
  pose: CyclePose;
  contact: [number, number];
}

/** Painted cycle frames as scene textures, made the first time each is asked for. */
export class CycleSprites {
  private frames = new Map<string, CycleFrame>();
  private looks = new WeakMap<CycleLook, string>();
  constructor(private scene: Phaser.Scene) {}

  frame(look: CycleLook, view: CycleView, st: CycleState = {}): CycleFrame {
    let id = this.looks.get(look);
    if (!id) this.looks.set(look, (id = JSON.stringify(look)));
    const key = `cycle:${id}:${view}:${st.crank ?? 0}:${st.spin ?? 0}:${st.blur ? 1 : 0}${st.parked ? 1 : 0}${st.fallen ? 1 : 0}${st.lit ? 1 : 0}${st.shadow ? 1 : 0}`;
    let frame = this.frames.get(key);
    if (frame) return frame;
    const art = paintCycle(look, view, st);
    const make = (name: string, data: Uint8ClampedArray) => {
      // Textures outlive the scene that made them: a restart finds them already there.
      if (this.scene.textures.exists(name)) return name;
      const canvas = this.scene.textures.createCanvas(name, CYCLE_W, CYCLE_H)!;
      canvas.getContext().putImageData(new ImageData(new Uint8ClampedArray(data), CYCLE_W, CYCLE_H), 0, 0);
      canvas.refresh();
      return name;
    };
    frame = {
      under: make(`${key}:u`, art.under),
      over: art.over.some((v, i) => i % 4 === 3 && v > 0) ? make(`${key}:o`, art.over) : undefined,
      rider: art.rider,
      pose: art.pose,
      contact: art.contact,
    };
    this.frames.set(key, frame);
    return frame;
  }
}
