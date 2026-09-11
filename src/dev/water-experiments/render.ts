import { scenery, bankLayer, drawScenery, obstacleField } from "./scenery";
import { animatedSurface } from "./surface";
import { waterHash } from "../../render/water-style";
import {
  WIDTH as W,
  HEIGHT as H,
  palettes,
  light,
  mod,
  type Settings,
} from "./model";

export function createPrototype(
  canvas: HTMLCanvasElement,
  field: Float32Array,
  land: HTMLCanvasElement,
  s: Settings,
  system: "tiles" | "depth",
) {
  const objects = scenery(field, s),
    banks = bankLayer(field, s),
    obstacles = obstacleField(objects, s);
  const ctx = canvas.getContext("2d")!,
    surface = document.createElement("canvas");
  surface.width = W;
  surface.height = H;
  const surfaceCtx = surface.getContext("2d")!,
    paintSurface = animatedSurface(field, s, system),
    p = palettes[s.palette];
  const mark = (
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    alpha = 1,
  ) => {
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    for (let yy = Math.round(y); yy < Math.round(y) + height; yy++)
      for (let xx = Math.round(x); xx < Math.round(x) + width; xx++) {
        if (
          xx >= 0 &&
          yy >= 0 &&
          xx < W &&
          yy < H &&
          field[yy * W + xx] > 0.05 &&
          !obstacles.solid[yy * W + xx]
        )
          ctx.fillRect(xx, yy, 1, 1);
      }
  };
  return (t: number) => {
    ctx.globalAlpha = 1;
    ctx.drawImage(land, 0, 0);
    surfaceCtx.putImageData(paintSurface(t), 0, 0);
    ctx.drawImage(surface, 0, 0);
    const strength =
      s.strength * (s.kind === "pond" ? 0.13 : s.kind === "lake" ? 0.4 : 1);
    const phase = system === "tiles" ? Math.floor(t * 8) / 8 : t;
    const dx = Math.cos((s.direction * Math.PI) / 180),
      dy = Math.sin((s.direction * Math.PI) / 180);
    if (s.fish && system === "depth" && s.clarity > 0) {
      for (let i = 0; i < 13; i++) {
        const x =
            190 + Math.sin(t * 0.14 + i * 6.2) * (s.kind === "river" ? 37 : 94),
          y = 144 + Math.cos(t * 0.2 + i * 2) * 48;
        const facing = Math.cos(t * 0.14 + i * 6.2) > 0 ? 1 : -1;
        const opacity =
          s.clarity *
          Math.max(
            0.12,
            Math.exp(
              -Math.max(0, field[Math.round(y) * W + Math.round(x)]) * 0.18,
            ),
          );
        mark(x, y + 3, 7, 2, "#234f64", opacity * 0.24);
        mark(x, y, 6, 2, i % 3 ? "#245b69" : "#e8bc64", opacity);
        mark(
          x - facing * 2,
          y + Math.round(Math.sin(t * 7 + i)),
          2,
          3,
          "#327e84",
          opacity,
        );
        mark(x + (facing > 0 ? 5 : 0), y, 1, 1, "#163d55", opacity);
      }
    }
    if (system === "tiles" || s.surfaceRipples) {
      for (let row = -1; row < 18; row++)
        for (let col = -1; col < 26; col++) {
          const n = waterHash(col, row, 9),
            speed = s.kind === "river" ? 11 : 2;
          const x = mod(
              col * 22 + n * 13 + phase * (s.kind === "coast" ? 0 : dx) * speed,
              W,
            ),
            y = mod(
              row * 19 + n * 8 + phase * (s.kind === "coast" ? -1 : dy) * speed,
              H,
            );
          const pulse = (Math.sin(phase * 1.8 + n * 20) + 1) / 2;
          if (
            strength === 0 ||
            n < (system === "tiles" ? 0.45 : 1 - s.rippleAmount * 0.75) ||
            pulse < 0.25
          )
            continue;
          const i = Math.floor(y) * W + Math.floor(x);
          const wx = x + obstacles.u[i] * 0.3,
            wy = y + obstacles.v[i] * 0.3;
          const w = 3 + Math.floor(pulse * (3 + strength));
          mark(wx, wy, w, 1, p.colors[1], 0.35 + strength * 0.07);
          mark(wx + w, wy - 1, 3, 1, p.foam, pulse * (0.18 + strength * 0.07));
          if (strength > 1) mark(wx + 2, wy + 3, w - 1, 1, p.colors[4], 0.25);
        }
    }
    if (strength > 0) {
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const d = field[y * W + x];
          if (d <= 0 || d > 1.7) continue;
          const wave = mod(
            phase * (s.kind === "pond" ? 0.15 : 0.35) +
              Math.sin((s.kind === "river" ? y : x) / 27) * 0.12,
            1,
          );
          const target = (1 - wave) * (s.kind === "coast" ? 1.4 : 0.28);
          if (
            Math.abs(d - target) <
              Math.max(
                s.kind === "coast" ? 0 : 0.045,
                0.018 + s.foamWidth * 0.09,
              ) &&
            waterHash(Math.floor(x / 4), Math.floor(y / 3), 41) > 0.16
          )
            mark(
              x,
              y,
              1,
              1,
              p.foam,
              Math.sin(wave * Math.PI) *
                Math.min(0.9, 0.3 + strength * 0.23) *
                s.foamOpacity *
                (s.kind === "coast" ? 1 : s.bankLapping * 1.5),
            );
        }
    }
    if (s.kind === "coast" && s.strength >= 2) {
      for (let i = 0; i < s.strength * 45; i++) {
        const x = waterHash(i, 71) * W,
          y = 65 + 14 * Math.sin(x / 67) + 8 * Math.sin(x / 28);
        const age = mod(t * 0.7 + waterHash(i, 72), 1),
          height = (s.strength - 1) * (5 + waterHash(i, 73) * 12);
        ctx.globalAlpha = (1 - age) * 0.65;
        ctx.fillStyle = p.foam;
        ctx.fillRect(
          Math.round(x + age * 12),
          Math.round(y + 6 - Math.sin(age * Math.PI) * height),
          i % 4 === 0 ? 2 : 1,
          1,
        );
      }
    }
    if (s.fish && s.kind === "pond") {
      const age = mod(t / 6, 1),
        x = 205,
        y = 144;
      if (age < 0.28) {
        for (let a = 0; a < 6.28; a += 0.18)
          mark(
            x + Math.cos(a) * age * 50,
            y + Math.sin(a) * age * 22,
            1,
            1,
            p.foam,
            (1 - age / 0.28) * 0.7,
          );
        if (age < 0.1)
          for (let i = -1; i <= 1; i++)
            mark(
              x + i * age * 50,
              y - Math.sin(age * 31.4) * 7,
              1,
              2,
              p.foam,
              0.8,
            );
      }
    }
    drawScenery(ctx, objects, s, t, field);
    ctx.drawImage(banks, 0, 0);
    const lighting = light(s);
    ctx.globalAlpha = lighting.ambientAlpha;
    ctx.fillStyle = "#" + lighting.ambient;
    ctx.fillRect(0, 0, W, H);
    if (s.glitters) {
      const sunset = lighting.id === "dusk" || lighting.id === "early-morning";
      const tint = sunset
        ? "#ffe6ae"
        : lighting.id === "night"
          ? "#c4dbf3"
          : "#f6ffdc";
      for (let i = 0; i < 230; i++) {
        const x = waterHash(i, 81) * W,
          y = waterHash(i, 82) * H;
        const axis =
          W * (0.5 - lighting.cast[0] * 0.24) +
          (y - 128) * lighting.cast[0] * 0.4;
        const pulse = Math.sin(t * 2.3 + i * 4.1);
        if (Math.abs(x - axis) < 18 + y * 0.19 && pulse > 0.83) {
          mark(x, y, sunset ? 7 : 3, 1, tint, ((pulse - 0.83) / 0.17) * 0.85);
          if (pulse > 0.985) mark(x + 1, y - 1, 1, 3, tint, 0.7);
        }
      }
    }
    ctx.globalAlpha = 1;
  };
}
