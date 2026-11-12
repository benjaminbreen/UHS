import { bankStyle, blendBankColor } from "./banks";
import { waterHash, waterNoise } from "../water-style";
import { WIDTH as W, HEIGHT as H, beachExtent, type Settings } from "./model";
export type WaterObject = {
  x: number;
  y: number;
  size: number;
  seed: number;
  existing?: boolean;
  ecology?: string;
  colorway?: string;
  season?: string;
  kind: "rock" | "reeds" | "lilies" | "seaweed" | "herb";
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
    if (o.existing) continue;
    rockTint = o.kind === "rock";
    const { x, y, size: r, seed } = o;
    if (o.kind === "rock") {
      const half = Math.ceil(r),
        base = new Int16Array(half * 2 + 1).fill(-999);
      for (let yy = -r * 0.5; yy < r * 0.75; yy++)
        for (let xx = -r * 1.2; xx < r * 1.2; xx++)
          if ((xx * xx) / (r * r * 1.5) + (yy * yy) / (r * r * 0.45) < 1)
            dot(x + xx + 1, y + yy + 1, 1, 1, "#143f54", 0.22);
      // Light from the upper left: a pale cap, a mid body, a shaded right
      // and foot, a dark wet line where it meets the water.
      const w = Math.max(2, Math.round(r * 0.9)),
        h = Math.max(2, Math.round(r * 1.1)),
        lean = waterHash(seed, 26) - 0.5,
        mossy = seed % 3 === 0 && w >= 5;
      const span = (yy: number) => {
        const v = (-yy / h) * 0.92;
        return Math.max(0, Math.round(w * Math.sqrt(1 - v ** 2.4)) - (yy === 0 && w >= 4 ? 1 : 0));
      };
      for (let yy = -h; yy <= 0; yy++) {
        const v = -yy / h,
          wide = span(yy),
          shift = Math.round(lean * 2 * v);
        for (let xx = -wide; xx <= wide; xx++) {
          const u = wide ? xx / wide : 0,
            top = yy === -h || Math.abs(xx) > span(yy - 1),
            side = Math.abs(xx) === wide;
          if (yy === 0 && Math.abs(xx + shift) <= half) base[xx + shift + half] = 0;
          const c =
            yy === 0
              ? side ? "#3b4b4a" : "#465956"
              : side || top
                ? u > 0.1 || (side && v < 0.4) ? "#3b4b4a" : "#52635e"
                : v > 0.5 && u < 0.35
                  ? mossy && u < 0 && v > 0.65 ? "#8d9e58" : "#c9c393"
                  : u > 0.45 || v < 0.28
                    ? "#748475"
                    : "#a0a486";
          dot(x + xx + shift, y + yy, 1, 1, c);
        }
      }
      if (w >= 4) dot(x - Math.round(w * 0.45) + Math.round(lean * 1.6), y - Math.round(h * 0.72), 2, 1, mossy ? "#c9c393" : "#ddd2a2");
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
    } else if (o.kind === "herb") {
      const sprites = [
        [
          "..h......",
          "..lh...h.",
          "...lh.hh.",
          "h..llhl..",
          "hl.lll...",
          ".hllll.h.",
          "..lllldl.",
          "..dsdsd..",
        ],
        [
          "......h..",
          ".h...hl..",
          ".hl..ll.h",
          "..lhlllhl",
          "h..lllll.",
          ".hllllld.",
          "..dlldd..",
          "...ddd...",
        ],
        [
          "...h.....",
          "...lh....",
          ".h.ll..h.",
          ".lhll.hl.",
          "..llllll.",
          "h.llllld.",
          ".lldldd..",
          "..dddd...",
        ],
      ];
      const colors: Record<string, string> = {
        h: "#c6ce70",
        l: "#83a747",
        d: "#285a3e",
        s: "#b59b60",
      };
      if (
        o.ecology === "desert" ||
        o.ecology === "dry-scrub" ||
        o.season === "autumn"
      ) {
        colors.h = "#d7c585";
        colors.l = "#9c9f57";
        colors.d = "#5f7146";
      }
      if (o.season === "winter" && o.ecology !== "tropical-woodland") {
        colors.h = "#c7bd95";
        colors.l = "#8f8864";
        colors.d = "#5a654f";
      }
      const sprite = sprites[seed % 3];
      for (let yy = 0; yy < sprite.length; yy++)
        for (let xx = 0; xx < sprite[yy].length; xx++) {
          const c = colors[sprite[yy][xx]];
          if (c) dot(x + xx - 4, y + yy - 7, 1, 1, c);
        }
      if (seed % 5 === 0 && o.season !== "winter") {
        dot(x - 2, y - 7, 3, 1, "#f4eacc");
        dot(x - 1, y - 8, 1, 3, "#f4eacc");
        dot(x - 1, y - 7, 1, 1, "#e4b85d");
      }
    } else if (o.kind === "lilies") {
      const arid = o.ecology === "desert" || o.ecology === "dry-scrub" || o.colorway === "papyrus",
        lotus = o.ecology === "tropical-woodland",
        boreal = o.ecology === "boreal-woodland";
      // White water lily; pink lotus in the tropics; the Nile's blue lotus; the north's yellow pond-lily.
      const petal = lotus ? "#f2a6b8" : arid ? "#9db0ee" : boreal ? "#f0d040" : "#fff4dc",
        heart = boreal ? "#c98f2a" : "#ebba5e";
      const pads = 3 + Math.floor(waterHash(seed, 31) * 3);
      for (let pad = 0; pad < pads; pad++) {
        const a = pad === 0 ? (lotus ? 4 : 3) : 1 + Math.floor(waterHash(seed, 40 + pad) * (lotus ? 3.5 : 2.6)),
          b = Math.max(1, Math.round(a * 0.6)),
          angle = waterHash(seed, 50 + pad) * 6.283,
          reach = pad === 0 ? 0 : 4 + waterHash(seed, 60 + pad) * 6,
          cx = Math.round(x + Math.cos(angle) * reach * 1.3),
          cy = Math.round(y + Math.sin(angle) * reach * 0.7 + Math.sin(t * 0.8 + pad) * 0.5),
          notch = waterHash(seed, 70 + pad) < 0.5 ? 1 : -1;
        for (let yy = -b; yy <= b; yy++)
          for (let xx = -a; xx <= a; xx++) {
            if ((xx * xx) / ((a + 0.4) * (a + 0.4)) + (yy * yy) / ((b + 0.4) * (b + 0.4)) > 1) continue;
            // A lily pad is cut to its stalk; a lotus leaf is whole.
            if (!lotus && a > 1 && xx * notch > 0 && yy === 0) continue;
            dot(cx + xx + 1, cy + yy + 1, 1, 1, "#155d5c", 0.35);
          }
        for (let yy = -b; yy <= b; yy++)
          for (let xx = -a; xx <= a; xx++) {
            if ((xx * xx) / ((a + 0.4) * (a + 0.4)) + (yy * yy) / ((b + 0.4) * (b + 0.4)) > 1) continue;
            if (!lotus && a > 1 && xx * notch > 0 && yy === 0) continue;
            dot(
              cx + xx,
              cy + yy,
              1,
              1,
              yy === b || (yy > 0 && Math.abs(xx) === a)
                ? "#2f6a35"
                : yy < 0 && xx <= 0
                  ? "#8fbf48"
                  : "#5f9a3a",
            );
          }
        if (lotus && a >= 3) dot(cx, cy, 1, 1, "#2f6a35");
        if (a >= 3 && o.season !== "winter" && waterHash(seed, 80 + pad) < 0.6) {
          const fx = cx - notch * 2, fy = cy - 1;
          dot(fx - 1, fy, 3, 1, petal);
          dot(fx, fy - 1, 1, 3, petal);
          dot(fx, fy, 1, 1, heart);
        }
      }
      if (o.ecology === "wetland")
        for (let i = 0; i < 12; i++)
          dot(
            x + Math.round((waterHash(seed, 90 + i) - 0.5) * 22),
            y + Math.round((waterHash(seed, 110 + i) - 0.5) * 12),
            1,
            1,
            i % 3 ? "#9fc94a" : "#7fb040",
          );
    } else if (o.kind === "reeds") {
      const sway = (j: number, h: number, i: number) => Math.sin(t * 0.6 + i + j * 0.15) * (j / h) * 1.5;
      dot(x - 5, y + 1, 11, 1, "#143f54", 0.25);
      if (o.ecology === "tropical-woodland") {
        // Broad arrowhead leaves on single stalks, the taro and arums of wet tropical ground.
        const leaf = [".ll..", "lhlll", "llhll", ".lld.", "..d.."];
        for (let i = 0; i < 4; i++) {
          const lx = x + [-5, -1, 3, 6][i] + Math.round((waterHash(seed, i) - 0.5) * 2),
            h = 5 + Math.floor(waterHash(seed, 10 + i) * 6);
          for (let j = 0; j < h; j++) dot(lx + 2, y - j, 1, 1, j < 2 ? "#226b3c" : "#2f7a40");
          leaf.forEach((line, yy) =>
            [...line].forEach((ch, xx) => {
              if (ch !== ".")
                dot(lx + (i % 2 ? 4 - xx : xx), y - h - 4 + yy, 1, 1, ch === "h" ? "#7fc45a" : ch === "d" ? "#226b3c" : "#3f9a4a");
            }),
          );
        }
      } else if (o.colorway === "papyrus") {
        for (let i = 0; i < 5; i++) {
          const bx = x + (i - 2) * 3 + Math.round((waterHash(seed, i) - 0.5) * 2),
            h = 10 + Math.floor(waterHash(seed, 10 + i) * 8);
          for (let j = 0; j < h; j++) dot(bx + sway(j, h, i), y - j, 1, 1, j < 2 ? "#3c6b34" : "#5f8f3f");
          // The umbel: a green starburst at the head of each stem.
          dot(bx - 2, y - h, 5, 1, "#8fb54a");
          dot(bx - 1, y - h - 1, 3, 1, "#8fb54a");
          dot(bx - 2, y - h - 2, 1, 1, "#c9d27a");
          dot(bx, y - h - 2, 1, 1, "#c9d27a");
          dot(bx + 2, y - h - 2, 1, 1, "#c9d27a");
          dot(bx - 3, y - h + 1, 1, 1, "#6f9a40");
          dot(bx + 3, y - h + 1, 1, 1, "#6f9a40");
        }
      } else if (o.ecology === "boreal-woodland" || o.ecology === "tundra") {
        // A sedge tussock: short stiff blades off one crown.
        for (let i = -4; i <= 4; i++) {
          const h = 3 + Math.floor(waterHash(seed, i + 9) * 4) - Math.abs(i) / 2;
          for (let j = 0; j < h; j++)
            dot(x + i + Math.round((i / 4) * (j / 3)), y - j, 1, 1, j >= h - 1 ? "#9aa55a" : (i + 9) % 3 ? "#3f6b3c" : "#567a40");
        }
        dot(x - 2, y, 5, 1, "#6f6238");
      } else {
        const plumes = o.ecology === "grassland" || o.ecology === "dry-scrub" || o.ecology === "desert",
          dry = plumes || o.season === "autumn" || o.season === "winter";
        const stems = 6 + Math.floor(waterHash(seed, 3) * 3);
        for (let i = 0; i < stems; i++) {
          const bx = x + Math.round((i - (stems - 1) / 2) * 1.6 + (waterHash(seed, i) - 0.5)),
            h = 8 + Math.floor(waterHash(seed, 10 + i) * 9),
            lean = (waterHash(seed, 20 + i) - 0.5) * 4;
          for (let j = 0; j < h; j++)
            dot(
              bx + (lean * j) / h + sway(j, h, i),
              y - j,
              1,
              1,
              j < 2 ? "#285a3e" : i % 3 === 0 ? (dry ? "#b7ae62" : "#9eb54e") : i % 3 === 1 ? (dry ? "#7f8a48" : "#4f8a45") : "#2f6a43",
            );
          if (i % 3 !== 0) continue;
          const tx = Math.round(bx + lean);
          if (plumes) {
            // Common reed: a soft tan plume drooping off the tip.
            dot(tx, y - h - 2, 2, 1, "#e0d1a4");
            dot(tx, y - h - 1, 3, 1, "#d2c08e");
            dot(tx + 1, y - h, 2, 1, "#b9a26a");
          } else {
            // Cattail: a brown head below a bare spike.
            dot(tx, y - h - 1, 1, 1, "#9eb54e");
            dot(tx, y - h + 1, 1, 4, "#7a4a2a");
            dot(tx, y - h + 1, 1, 1, "#b98a4a");
          }
        }
      }
    } else {
      const alpha = 0.4 + s.clarity * 0.4;
      for (let blade = 0; blade < 7; blade++) {
        const h = 7 + waterHash(seed, blade) * 15,
          bx = x + (blade - 3) * 2;
        for (let j = 0; j < h; j++) {
          const sway = Math.sin(t * 1.4 + blade + j * 0.15) * (j / h) * 4;
          dot(bx + sway, y - j, 2, 1, blade % 2 ? "#276f4e" : "#3d8553", alpha);
          dot(bx + sway, y - j, 1, 1, "#63b99a", alpha);
          if (j % 5 === 0) dot(bx + sway - 2, y - j, 4, 1, "#38987b", alpha);
        }
      }
    }
  }
  ctx.globalAlpha = 1;
}
