import { bankStyle, blendBankColor } from "./banks";
import { waterHash, waterNoise } from "../../render/water-style";
import { WIDTH as W, HEIGHT as H, beachExtent, type Settings } from "./model";
export type WaterObject = {
  x: number;
  y: number;
  size: number;
  seed: number;
  kind: "rock" | "reeds" | "lilies" | "seaweed";
};
export function scenery(field: Float32Array, s: Settings): WaterObject[] {
  const items: WaterObject[] = [];
  for (const kind of ["rock", "plant"] as const) {
    const count = kind === "rock" ? s.rocks : s.plants;
    let placed = 0;
    for (let i = 0; i < 4000 && placed < count; i++) {
      const seed = i + (kind === "rock" ? 100 : 7000),
        x = 18 + Math.floor(waterHash(seed, 5) * (W - 36)),
        y = 25 + Math.floor(waterHash(seed, 6) * (H - 45));
      const d = field[y * W + x],
        size =
          kind === "rock"
            ? (5 + waterHash(seed, 7) * 6) * s.rockSize
            : 5 + waterHash(seed, 7) * 4;
      if (d < (kind === "rock" ? 0.6 : 0.25) || d > (kind === "rock" ? 6 : 3.2))
        continue;
      if (
        items.some(
          (o) => Math.hypot(o.x - x, (o.y - y) * 1.3) < o.size + size + 4,
        )
      )
        continue;
      const plant =
        s.kind === "coast"
          ? "seaweed"
          : s.plantType === "auto"
            ? waterHash(seed, 8) > 0.5
              ? "lilies"
              : "reeds"
            : s.plantType;
      items.push({ x, y, size, seed, kind: kind === "rock" ? "rock" : plant });
      placed++;
    }
  }
  return items.sort((a, b) => a.y - b.y);
}
export function obstacleField(items: WaterObject[], s: Settings) {
  const u = new Float32Array(W * H),
    v = new Float32Array(W * H),
    wake = new Float32Array(W * H),
    delay = new Float32Array(W * H),
    solid = new Uint8Array(W * H);
  const dx = s.kind === "river" ? Math.cos((s.direction * Math.PI) / 180) : 0,
    dy = s.kind === "river" ? Math.sin((s.direction * Math.PI) / 180) : -1;
  for (const o of items) {
    const influence = o.kind === "rock" ? 1 : o.kind === "lilies" ? 0.35 : 0.18;
    const r = o.size;
    for (
      let y = Math.max(0, Math.floor(o.y - r * 6));
      y < Math.min(H, o.y + r * 6);
      y++
    )
      for (
        let x = Math.max(0, Math.floor(o.x - r * 6));
        x < Math.min(W, o.x + r * 6);
        x++
      ) {
        const a = x - o.x,
          b = (y - o.y) * 1.3,
          along = a * dx + b * dy,
          across = a * -dy + b * dx;
        const fall = Math.exp(-(a * a + b * b) / (r * r * 5)),
          side = across < 0 ? -1 : 1,
          i = y * W + x;
        delay[i] += r * fall * 1.4 * influence;
        if (
          o.kind === "rock" &&
          (a * a) / (r * r) + (b * b) / (r * r * 0.65) < 1
        )
          solid[i] = 1;
        u[i] += -dy * side * r * fall * 1.8 * influence;
        v[i] += dx * side * r * fall * 1.8 * influence;
        if (along > 0)
          wake[i] +=
            influence *
            Math.exp(-along / (r * 4) - (across * across) / (r * r * 1.5));
      }
  }
  return { u, v, wake, delay, solid };
}
export function bankLayer(field: Float32Array, s: Settings) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const pixel = (x: number, y: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, 1, 1);
  };
  const bank = bankStyle(s);
  const width = s.bankHeight / 16,
    beach = beachExtent(s);
  const boundaryTone =
    "#" +
    [1, 3, 5]
      .map((i) =>
        Math.round(
          parseInt(s.boundaryColor.slice(i, i + 2), 16) *
            (1 - s.boundaryDarkness * 0.8),
        )
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const d = field[y * W + x],
        edge = -beach - width;
      if (width > 0 && d < -beach && d > edge) {
        const z = (-d - beach) / Math.max(0.01, width),
          grain = waterNoise(x * 1.6, y * 2, 5, 92),
          seam = waterNoise(x, y, 8, 93);
        const color =
          grain > 0.65
            ? bank.face[0]
            : grain > 0.43
              ? bank.face[1]
              : bank.face[2];
        pixel(x, y, color);
        if (seam > 0.67) pixel(x, y, bank.face[2]);
        if (z > 0.85) pixel(x, y, grain > 0.5 ? bank.grass : bank.ground);
      }
      if (width > 0 && d < -beach && d > -beach - 0.08) {
        ctx.globalAlpha = s.boundaryOpacity;
        pixel(x, y, boundaryTone);
        ctx.globalAlpha = 1;
      }
      if (d <= 0 && d > -Math.min(beach, s.wetEdgeWidth)) {
        const position = Math.min(
          1,
          -d / Math.max(0.001, Math.min(beach, s.wetEdgeWidth)),
        );
        const step =
          Math.round(position * (s.bankGradientSteps - 1)) /
          (s.bankGradientSteps - 1);
        const tone = s.bankGradient
          ? step < 0.35
            ? blendBankColor(bank.contact, bank.wet, step / 0.35)
            : blendBankColor(bank.wet, bank.dry, (step - 0.35) / 0.65)
          : d > -0.055
            ? bank.contact
            : bank.wet;
        ctx.globalAlpha = s.wetEdgeOpacity;
        pixel(x, y, tone);
        ctx.globalAlpha = 1;
      }
      if (bank.material === "pebbles" && d < -0.25 && d > -beach) {
        const px = (x + Math.floor(y / 9) * 5) % 13,
          py = y % 9;
        if ((px === 3 || px === 4) && py === 3) pixel(x, y, "#a4a69b");
        if (px >= 2 && px <= 5 && py === 4) pixel(x, y, "#808e87");
      }
      if (
        d < edge &&
        d > edge - 1.2 &&
        waterHash(Math.floor(x / 3), Math.floor(y / 3), 62) < s.bankCover
      ) {
        const n = waterNoise(x, y, 5, 63);
        if (n > 0.4) pixel(x, y, n > 0.64 ? bank.grass : bank.ground);
        if (waterHash(x, y, 64) > 0.95) {
          pixel(x, y, "#bad368");
          pixel(x, y + 1, "#386335");
        }
      }
    }
  for (let i = 0; i < 220; i++) {
    if (waterHash(i, 73) > s.bankCover) continue;
    const x = Math.floor(waterHash(i, 71) * W),
      y = Math.floor(waterHash(i, 72) * H),
      d = field[y * W + x];
    if (d > -beach - width || d < -beach - 1.5 - width) continue;
    for (let blade = -2; blade <= 2; blade++) {
      const h = 2 + Math.floor(waterHash(i, blade) * 4);
      for (let j = 0; j < h; j++)
        pixel(x + blade, y - j, blade < 0 ? "#3e682f" : "#8bb544");
    }
    if (i % 7 === 0) {
      pixel(x, y - 3, "#fff1c9");
      pixel(x - 1, y - 2, "#fff1c9");
      pixel(x + 1, y - 2, "#fff1c9");
      pixel(x, y - 2, "#dbad3c");
    }
  }
  return canvas;
}
export function drawScenery(
  ctx: CanvasRenderingContext2D,
  items: WaterObject[],
  s: Settings,
  t: number,
  field: Float32Array,
) {
  const bank = bankStyle(s);
  let rockTint = false;
  const rockColors: Record<string, string> =
    bank.material === "clay"
      ? {
          "#3b4b4a": "#62483d",
          "#c9c393": "#e0b585",
          "#a7ad88": "#c9966b",
          "#899780": "#b88460",
          "#52635e": "#815847",
          "#a0a486": "#c59169",
          "#748475": "#a57557",
          "#ddd2a2": "#f1c895",
          "#8d9e58": "#be995e",
          "#465956": "#765042",
        }
      : bank.material === "pebbles"
        ? {
            "#c9c393": "#d1cec1",
            "#a7ad88": "#b4b6ae",
            "#899780": "#a0a7a2",
            "#a0a486": "#b1b2a9",
            "#748475": "#8a9592",
            "#8d9e58": "#a3a994",
          }
        : {};
  const dot = (
    x: number,
    y: number,
    w: number,
    h: number,
    c: string,
    a = 1,
  ) => {
    ctx.globalAlpha = a;
    ctx.fillStyle = rockTint ? (rockColors[c] ?? c) : c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  for (const o of items) {
    rockTint = o.kind === "rock";
    const { x, y, size: r, seed } = o;
    if (o.kind === "rock") {
      const half = Math.ceil(r),
        base = new Int16Array(half * 2 + 1).fill(-999);
      for (let yy = -r * 0.5; yy < r * 0.75; yy++)
        for (let xx = -r * 1.2; xx < r * 1.2; xx++)
          if ((xx * xx) / (r * r * 1.5) + (yy * yy) / (r * r * 0.45) < 1)
            dot(x + xx + 1, y + yy + 1, 1, 1, "#143f54", 0.22);
      for (let yy = -Math.ceil(r * 1.25); yy < r * 0.4; yy++)
        for (let xx = -Math.ceil(r); xx <= r; xx++) {
          const px = xx / r,
            py = (yy + r * 0.4) / (r * 0.78);
          if (
            Math.abs(px) * (0.55 + waterHash(seed, 26) * 0.15) +
              Math.abs(py) * 0.5 >
              0.98 ||
            px * px + py * py >
              1.02 + Math.sin(Math.atan2(py, px) * 5 + seed) * 0.13
          )
            continue;
          base[xx + half] = yy;
          const n = waterNoise(xx + seed, yy, 3, 16),
            edge = px * px + py * py > 0.83;
          const c = edge
            ? "#3b4b4a"
            : py < -0.35
              ? px < 0.15
                ? "#c9c393"
                : "#a7ad88"
              : px < -0.35
                ? "#899780"
                : px > 0.35
                  ? "#52635e"
                  : n > 0.58
                    ? "#a0a486"
                    : "#748475";
          dot(x + xx, y + yy, 1, 1, c);
          if (
            !edge &&
            py < -0.15 &&
            px < 0.3 &&
            waterNoise(xx + seed, yy, 4, 54) > 0.64
          )
            dot(x + xx, y + yy, 1, 1, "#8d9e58");
          if (
            !edge &&
            py > 0.05 &&
            Math.abs(px - 0.24 * Math.sin(py * 3 + seed)) < 0.06
          )
            dot(x + xx, y + yy, 1, 1, "#465956");
          if (!edge && n > 0.64 && py < -0.25)
            dot(x + xx, y + yy, 1, 1, "#ddd2a2");
        }
      // Use the rendered silhouette's bottom edge, not the object's placement anchor.
      for (let xx = -half; xx <= half; xx++) {
        const bottom = base[xx + half];
        if (bottom === -999) continue;
        const phase = t * (0.7 + s.strength * 0.2) + seed + xx * 0.35;
        if (Math.sin(phase) < -0.35) continue;
        const px = x + xx,
          py = y + bottom + 1 + Math.round((Math.sin(phase) + 1) * 0.5);
        if (
          px >= 0 &&
          px < W &&
          py >= 0 &&
          py < H &&
          field[Math.round(py) * W + Math.round(px)] > 0.05
        )
          dot(px, py, 1, 1, "#d7f3dc", 0.5 + 0.25 * Math.sin(phase) ** 2);
      }
      if (s.kind === "river")
        for (let i = 0; i < 22; i++) {
          const a = i / 22,
            dx = Math.cos((s.direction * Math.PI) / 180),
            dy = Math.sin((s.direction * Math.PI) / 180),
            len = r + ((t * 9 + i * 2) % (r * 4));
          const wx = Math.round(
              x + dx * len - dy * Math.sin(a * 9 + t) * r * 0.6,
            ),
            wy = Math.round(y + dy * len + dx * Math.sin(a * 9 + t) * r * 0.6);
          if (
            wx < 0 ||
            wx >= W ||
            wy < 0 ||
            wy >= H ||
            field[wy * W + wx] < 0.2
          )
            continue;
          dot(
            x + dx * len - dy * Math.sin(a * 9 + t) * r * 0.6,
            y + dy * len + dx * Math.sin(a * 9 + t) * r * 0.6,
            2,
            1,
            "#adede0",
            0.3,
          );
        }
    } else if (o.kind === "lilies") {
      for (let pad = 0; pad < 3; pad++) {
        const cx = x + (pad - 1) * r * 0.9,
          cy = y + Math.sin(pad * 3 + seed) * 4 + Math.sin(t * 0.8 + pad) * 0.5,
          sz = r * (pad === 1 ? 0.72 : 0.5);
        for (let yy = -Math.ceil(sz * 0.65); yy <= sz * 0.65; yy++)
          for (let xx = -Math.ceil(sz); xx <= sz; xx++) {
            if (
              (xx * xx) / (sz * sz) + (yy * yy) / (sz * sz * 0.43) > 1 ||
              (xx > 0 && Math.abs(yy) < xx * 0.35)
            )
              continue;
            dot(cx + xx + 1, cy + yy + 2, 1, 1, "#155d5c", 0.4);
            dot(
              cx + xx,
              cy + yy,
              1,
              1,
              yy > sz * 0.35
                ? "#32612f"
                : xx < 0 && yy < 0
                  ? "#a5bc43"
                  : "#6b9d35",
            );
            if (xx === 0 || yy === 0) dot(cx + xx, cy + yy, 1, 1, "#85b641");
          }
        if (pad === 1 && seed % 3 === 0) {
          dot(cx - 1, cy - 3, 3, 3, "#f9e8ba");
          dot(cx - 2, cy - 2, 5, 1, "#fff1d5");
          dot(cx, cy - 2, 1, 1, "#ebba5e");
        }
      }
    } else {
      const underwater = o.kind === "seaweed",
        alpha = underwater ? 0.4 + s.clarity * 0.4 : 1;
      for (let blade = 0; blade < 7; blade++) {
        const h = 7 + waterHash(seed, blade) * 15,
          bx = x + (blade - 3) * 2;
        for (let j = 0; j < h; j++) {
          const sway =
            Math.sin(t * (underwater ? 1.4 : 0.6) + blade + j * 0.15) *
            (j / h) *
            (underwater ? 4 : 1.5);
          dot(bx + sway, y - j, 2, 1, blade % 2 ? "#276f4e" : "#3d8553", alpha);
          dot(
            bx + sway,
            y - j,
            1,
            1,
            underwater ? "#63b99a" : "#9eb54e",
            alpha,
          );
          if (underwater && j % 5 === 0)
            dot(bx + sway - 2, y - j, 4, 1, "#38987b", alpha);
        }
        if (!underwater && blade % 3 === 0) {
          dot(bx, y - h, 2, 5, "#80532f");
          dot(bx, y - h, 1, 4, "#c09246");
        }
      }
    }
  }
  ctx.globalAlpha = 1;
}
