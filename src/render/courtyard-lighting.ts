import type Phaser from "phaser";
import { lightingPreset, type LightingId } from "./lighting";

type Point = [number, number];
export type CourtyardLight = {
  opening: Point[];
  floor: Point[];
  backWall: Point[];
  leftWall: Point[];
  height: number;
};

export function courtyardSun(court: CourtyardLight, phase: LightingId) {
  const light = lightingPreset(phase);
  return {
    offset: light.cast.map((v) => Math.round(v * court.height)) as Point,
    opacity: light.opacity,
  };
}

function path(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.moveTo(...points[0]);
  for (const p of points.slice(1)) ctx.lineTo(...p);
  ctx.closePath();
}

export function paintCourtyardLight(
  ctx: CanvasRenderingContext2D,
  court: CourtyardLight,
  phase: LightingId,
  strength = 1,
) {
  const {
    offset: [dx, dy],
    opacity,
  } = courtyardSun(court, phase);
  const fill = (points: Point[], alpha: number) => {
    ctx.beginPath();
    path(ctx, points);
    ctx.fillStyle = `rgba(24, 30, 43, ${alpha})`;
    ctx.fill();
  };
  ctx.save();
  ctx.beginPath();
  path(ctx, court.opening);
  ctx.clip();
  if (phase === "night") {
    fill(court.opening, 0.32);
  } else {
    fill(
      court.backWall,
      (0.08 + (Math.abs(dx) / court.height) * 0.06) * strength,
    );
    fill(court.leftWall, (dx > 0 ? 0.3 : 0.04) * strength);
    ctx.beginPath();
    path(ctx, court.floor);
    ctx.clip();
    ctx.beginPath();
    // One union fill avoids darker seams where two wall shadows overlap.
    for (let i = 0; i < court.floor.length; i++) {
      const a = court.floor[i],
        b = court.floor[(i + 1) % court.floor.length];
      path(ctx, [a, b, [b[0] + dx, b[1] + dy], [a[0] + dx, a[1] + dy]]);
    }
    ctx.fillStyle = `rgba(24, 30, 43, ${opacity * 1.4 * strength})`;
    ctx.fill();
  }
  ctx.restore();
}

export class CourtyardLighting {
  private cached = new Set<string>();
  private used = new Set<string>();

  constructor(private scene: Phaser.Scene) {}

  begin() {
    this.used.clear();
  }

  apply(
    image: Phaser.GameObjects.Image,
    court: CourtyardLight,
    phase: LightingId,
    strength: number,
  ) {
    const source = image.frame;
    const key = `court:${source.texture.key}:${source.name}:${phase}:${strength}`;
    this.used.add(key);
    if (!this.cached.has(key)) {
      const texture = this.scene.textures.createCanvas(
        key,
        source.realWidth,
        source.realHeight,
      );
      if (!texture) return;
      const ctx = texture.context;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        source.source.image as CanvasImageSource,
        source.cutX,
        source.cutY,
        source.cutWidth,
        source.cutHeight,
        source.x,
        source.y,
        source.cutWidth,
        source.cutHeight,
      );
      paintCourtyardLight(ctx, court, phase, strength);
      texture.refresh();
      this.cached.add(key);
    }
    const { originX, originY } = image;
    image.setTexture(key).setOrigin(originX, originY);
  }

  end() {
    for (const key of this.cached) {
      if (this.used.has(key)) continue;
      this.scene.textures.remove(key);
      this.cached.delete(key);
    }
  }

  dispose() {
    this.used.clear();
    this.end();
  }
}
