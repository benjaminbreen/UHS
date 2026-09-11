import { scenery } from "./scenery";
import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { addWaterEffects, waterCanvas } from "../../render/water";
import { rasterWaterTile, type WaterEffect } from "../../render/water-raster";
import {
  WIDTH,
  HEIGHT,
  fixture,
  makeField,
  landCanvas,
  light,
  type Settings,
  type System,
} from "./model";
import { createPrototype } from "./render";

export function Preview({
  settings,
  system,
  clock,
}: {
  settings: Settings;
  system: System;
  clock: { time: number };
}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const field = makeField(settings),
      land = landCanvas(field, settings);
    class Study extends Phaser.Scene {
      options = { waterAnimation: !settings.paused };
      paint?: (time: number) => void;
      last = -1;
      create() {
        if (system === "current") {
          const sample = fixture(settings),
            ctx = land.getContext("2d")!,
            effects: WaterEffect[] = [];
          for (let y = 0; y < HEIGHT / 16; y++)
            for (let x = 0; x < WIDTH / 16; x++) {
              if (sample(x, y).waterVisual!.distance > 1.5) continue;
              const tile = rasterWaterTile(sample, x, y, 0, 0);
              for (let py = 0; py < 16; py++)
                for (let px = 0; px < 16; px++) {
                  if (field[(y * 16 + py) * WIDTH + x * 16 + px] < -0.2)
                    tile.pixels[(py * 16 + px) * 4 + 3] = 0;
                }
              ctx.drawImage(waterCanvas(tile), x * 16, y * 16);
              effects.push({ ...tile.effect, x: x * 16, y: y * 16 });
            }
          this.textures.addCanvas("base", land);
          this.add.image(0, 0, "base").setOrigin(0).setDepth(-10000);
          addWaterEffects(this, effects);
          const l = light(settings);
          this.add
            .rectangle(
              0,
              0,
              WIDTH,
              HEIGHT,
              parseInt(l.ambient, 16),
              l.ambientAlpha,
            )
            .setOrigin(0);
        } else {
          const canvas = document.createElement("canvas");
          canvas.width = WIDTH;
          canvas.height = HEIGHT;
          const draw = createPrototype(canvas, field, land, settings, system);
          const texture = this.textures.addCanvas("prototype", canvas)!;
          this.add.image(0, 0, "prototype").setOrigin(0);
          this.paint = (time) => {
            draw(time);
            texture.refresh();
          };
        }
        const objects = system === "current" ? [] : scenery(field, settings);
        this.game.canvas.dataset.rocks = String(
          objects.filter((o) => o.kind === "rock").length,
        );
        this.game.canvas.dataset.plants = String(
          objects.filter((o) => o.kind !== "rock").length,
        );
        this.game.canvas.dataset.ready = "true";
      }
      update() {
        const tick = Math.floor(clock.time * 20);
        if (tick === this.last) return;
        this.last = tick;
        const start = performance.now();
        this.paint?.(clock.time);
        this.game.canvas.dataset.frame = String(tick);
        if (this.paint)
          this.game.canvas.dataset.drawMs = (performance.now() - start).toFixed(
            2,
          );
      }
    }
    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: host.current!,
      width: WIDTH,
      height: HEIGHT,
      pixelArt: true,
      transparent: false,
      banner: false,
      audio: { noAudio: true },
      scene: Study,
      fps: { target: 30, forceSetTimeOut: true },
    });
    return () => {
      game.destroy(true);
    };
  }, [settings, system, clock]);
  return (
    <div
      className="water-preview"
      ref={host}
      aria-label={`${system} water preview`}
    />
  );
}
