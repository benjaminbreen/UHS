import { defaultFilmForStyle, filmById, type FilmScene, type FilmScript } from "../../content/interiors/performances";

export const FILM_SCENE_SEC = 4.5;

type Put = (x: number, y: number, c: number) => void;

const mix = (a: number, b: number, t: number) => {
  const k = Math.max(0, Math.min(1, t));
  const r = (((a >> 16) & 255) * (1 - k) + ((b >> 16) & 255) * k) | 0;
  const g = (((a >> 8) & 255) * (1 - k) + ((b >> 8) & 255) * k) | 0;
  const bl = ((a & 255) * (1 - k) + (b & 255) * k) | 0;
  return (r << 16) | (g << 8) | bl;
};

const scale = (c: number, k: number) => {
  const r = Math.max(0, Math.min(255, (((c >> 16) & 255) * k) | 0));
  const g = Math.max(0, Math.min(255, (((c >> 8) & 255) * k) | 0));
  const b = Math.max(0, Math.min(255, ((c & 255) * k) | 0));
  return (r << 16) | (g << 8) | b;
};

const h2 = (x: number, y: number, s: number) => {
  let n = Math.imul(x * 374761393 + y * 668265263 + s * 2246822519, 1274126177);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
};

/** Returns which scene of a film is active at time `t` (seconds). */
export function activeFilmScene(film: FilmScript, t: number, seed = 0): { index: number; scene: FilmScene; localT: number } {
  const n = film.scenes.length;
  const phase = Math.max(0, t + (Math.abs(seed) % n) * FILM_SCENE_SEC);
  const idx = Math.floor(phase / FILM_SCENE_SEC) % n;
  return { index: idx, scene: film.scenes[idx], localT: phase % FILM_SCENE_SEC };
}

/** Paints an animated pixel-art film frame into `(sx, sy, sw, sh)` and returns the auditorium glow color. */
export function paintFilmScreen(
  glow: Put,
  style: string,
  filmId: string | undefined,
  t: number,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  seed: number,
  forcedScene?: number,
): number {
  const film = filmById(filmId) ?? defaultFilmForStyle(style, seed);
  const active =
    forcedScene !== undefined
      ? { index: forcedScene % film.scenes.length, scene: film.scenes[forcedScene % film.scenes.length], localT: t % FILM_SCENE_SEC }
      : activeFilmScene(film, t, seed);
  const { scene, localT } = active;
  const [cBg, cMid, cAcc, cHi] = scene.palette;
  const cDark = scale(cBg, 0.42);
  const flicker = film.silent ? 0.92 + 0.08 * Math.sin(t * 27 + seed) : 0.97 + 0.03 * Math.sin(t * 14 + seed);
  // Brief dark shutter cut between scenes.
  const cut = forcedScene === undefined && (localT < 0.14 || localT > FILM_SCENE_SEC - 0.12) ? 0.25 : 1;
  const gain = flicker * cut;

  const px = (x: number, y: number, c: number) => {
    const ix = x | 0, iy = y | 0;
    if (ix < 0 || iy < 0 || ix >= sw || iy >= sh) return;
    glow(sx + ix, sy + iy, gain === 1 ? c : scale(c, gain));
  };
  const rect = (x: number, y: number, w: number, h: number, c: number) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c);
  };
  const disc = (cx: number, cy: number, rad: number, c: number) => {
    for (let j = -rad; j <= rad; j++)
      for (let i = -rad; i <= rad; i++) if (i * i + j * j <= rad * rad) px(cx + i, cy + j, c);
  };
  const sky = (top: number, bot: number, rows = sh) => {
    for (let j = 0; j < rows; j++) {
      const c = mix(top, bot, j / Math.max(1, rows - 1));
      for (let i = 0; i < sw; i++) px(i, j, c);
    }
  };
  const figure = (cx: number, footY: number, c: number, pose = 0, hat = false) => {
    px(cx, footY - 6, c); px(cx + 1, footY - 6, c);
    rect(cx, footY - 5, 2, 3, c);
    if (hat) rect(cx - 1, footY - 7, 4, 1, c);
    px(cx - (pose ? 1 : 0), footY - 2, c); px(cx + 1 + (pose ? 1 : 0), footY - 2, c);
    px(cx - (pose ? 1 : 0), footY - 1, c); px(cx + 1, footY - 1, c);
  };
  const stars = (n: number, speed = 0) => {
    for (let k = 0; k < n; k++) {
      const x = ((Math.floor(h2(k, 1, seed) * sw) - Math.floor(t * speed)) % sw + sw) % sw;
      const y = Math.floor(h2(k, 2, seed) * (sh - 5));
      px(x, y, k % 3 === 0 ? cHi : mix(cAcc, cHi, 0.5));
    }
  };

  switch (scene.visual) {
    case "title-card": {
      sky(cBg, scale(cBg, 0.7));
      // Ornate silent-era double border & corner flourishes.
      rect(3, 2, sw - 6, 1, cAcc); rect(3, sh - 3, sw - 6, 1, cAcc);
      rect(3, 2, 1, sh - 4, cAcc); rect(sw - 4, 2, 1, sh - 4, cAcc);
      rect(5, 4, sw - 10, 1, cMid); rect(5, sh - 5, sw - 10, 1, cMid);
      rect(5, 4, 1, sh - 8, cMid); rect(sw - 6, 4, 1, sh - 8, cMid);
      for (const [cx, cy] of [[5, 4], [sw - 6, 4], [5, sh - 5], [sw - 6, sh - 5]]) rect(cx - 1, cy - 1, 3, 3, cHi);
      // Stylized miniature title and subtitle bars.
      const midY = sh >> 1;
      for (let i = 12; i < sw - 12; i++) {
        if (i % 7 !== 0) px(i, midY - 4, cHi);
        if (i % 5 !== 0 && i > 16 && i < sw - 16) px(i, midY - 3, cHi);
        if (i % 4 !== 0 && i > 18 && i < sw - 18) px(i, midY + 1, cAcc);
        if (i % 6 !== 0 && i > 24 && i < sw - 24) px(i, midY + 4, cAcc);
      }
      break;
    }
    case "train-chase": {
      const hor = Math.floor(sh * 0.58);
      sky(cBg, cAcc, hor);
      // Scrolling distant hills and telegraph poles.
      const scroll = Math.floor(t * 22);
      for (let i = 0; i < sw; i++) {
        const hill = Math.floor(2 + Math.sin((i + scroll * 0.4) * 0.08) * 2.5 + Math.cos((i + scroll * 0.2) * 0.14) * 1.5);
        rect(i, hor - hill, 1, hill, cMid);
      }
      rect(0, hor, sw, sh - hor, cDark);
      for (let p = 0; p < sw; p += 18) {
        const px0 = ((p - scroll) % sw + sw) % sw;
        rect(px0, hor - 6, 1, 6, scale(cMid, 0.7));
        rect(px0 - 1, hor - 5, 3, 1, scale(cMid, 0.7));
      }
      // Trestle bridge rail.
      rect(0, hor + 2, sw, 1, cMid);
      for (let x = ((0 - scroll) % 8 + 8) % 8; x < sw; x += 8) rect(x, hor + 3, 1, sh - hor - 3, scale(cMid, 0.65));
      // Steam locomotive + 2 carriages.
      const tx = Math.floor(sw * 0.22 + Math.sin(t * 2) * 3);
      rect(tx + 34, hor - 6, 16, 6, cDark); // engine boiler
      rect(tx + 46, hor - 9, 3, 3, cDark); // smokestack
      rect(tx + 30, hor - 8, 6, 8, cDark); // cab
      rect(tx + 50, hor - 2, 3, 2, cMid); // cowcatcher
      px(tx + 50, hor - 5, cHi); // headlamp
      for (let c = 0; c < 2; c++) {
        const cx = tx + c * 15 - 2;
        rect(cx, hor - 6, 13, 6, cDark);
        for (let w = 2; w < 11; w += 3) rect(cx + w, hor - 4, 2, 2, cHi);
      }
      // Billowing smoke puffs.
      for (let s = 0; s < 5; s++) {
        const age = ((t * 14 + s * 6) % 28);
        disc(tx + 47 - age, hor - 10 - Math.floor(age * 0.25), s % 2 ? 2 : 1, mix(cHi, cAcc, age / 28));
      }
      break;
    }
    case "moon-rocket": {
      sky(cBg, mix(cBg, cMid, 0.45));
      stars(26, 2);
      const mx = Math.floor(sw * 0.72), my = Math.floor(sh * 0.48), mr = Math.min(9, Math.floor(sh * 0.34));
      disc(mx, my, mr, cHi);
      disc(mx - 2, my - 2, 1, cMid); disc(mx + 2, my - 2, 1, cMid);
      rect(mx - 2, my + 2, 5, 1, cMid);
      // Rocket shell gliding into the moon!
      const prog = (localT / FILM_SCENE_SEC);
      const rx = Math.floor(8 + prog * (mx - 12));
      const ry = Math.floor(sh * 0.72 - prog * (sh * 0.26));
      rect(rx, ry - 1, 7, 3, cAcc);
      rect(rx + 7, ry, 2, 1, cHi);
      px(rx - 2, ry, cHi); px(rx - 4, ry + ((t * 12) & 1), cAcc);
      break;
    }
    case "star-voyage": {
      sky(cBg, scale(cBg, 0.65));
      stars(34, 18);
      // Ringed planet on right.
      const px0 = Math.floor(sw * 0.76), py0 = Math.floor(sh * 0.44);
      disc(px0, py0, 6, cMid);
      disc(px0 - 1, py0 - 1, 4, cAcc);
      for (let i = -10; i <= 10; i++) px(px0 + i, py0 + Math.round(i * 0.25), cHi);
      // Sleek starship with glowing ion engine.
      const sx0 = Math.floor(sw * 0.22 + Math.sin(t * 2.2) * 4);
      const sy0 = Math.floor(sh * 0.52 + Math.cos(t * 1.8) * 2);
      rect(sx0, sy0 - 1, 14, 3, cHi);
      rect(sx0 + 14, sy0, 4, 1, cHi);
      rect(sx0 + 2, sy0 - 3, 5, 2, cAcc);
      rect(sx0 + 2, sy0 + 2, 5, 2, cAcc);
      const thrust = 3 + ((t * 18) | 0) % 4;
      rect(sx0 - thrust, sy0, thrust, 1, cAcc);
      px(sx0 - 1, sy0, 0xffffff);
      break;
    }
    case "space-battle": {
      sky(cBg, scale(cBg, 0.7));
      stars(28, 12);
      const f1x = Math.floor(sw * 0.24 + Math.sin(t * 3.2) * 6);
      const f1y = Math.floor(sh * 0.46 + Math.cos(t * 2.6) * 4);
      const f2x = Math.floor(sw * 0.74 + Math.cos(t * 2.8) * 5);
      const f2y = Math.floor(sh * 0.5 + Math.sin(t * 3.1) * 4);
      // Hero fighter & rival craft.
      rect(f1x, f1y, 7, 2, 0xe8f4ff); rect(f1x + 1, f1y - 2, 3, 1, cAcc); rect(f1x + 1, f1y + 3, 3, 1, cAcc);
      rect(f2x, f2y, 6, 2, cMid); rect(f2x + 2, f2y - 2, 2, 6, cHi);
      // Laser bolts streaking across.
      for (let b = 0; b < 3; b++) {
        const p = ((t * 2.2 + b * 0.33) % 1);
        const lx = Math.floor(f1x + 8 + p * (f2x - f1x - 10));
        const ly = Math.floor(f1y + p * (f2y - f1y));
        rect(lx, ly, 5, 1, b % 2 ? cAcc : cHi);
      }
      if (((t * 6) | 0) % 3 === 0) disc(f2x - 1, f2y, 2, cHi);
      break;
    }
    case "alien-horizon": {
      const hor = Math.floor(sh * 0.62);
      sky(cBg, cAcc, hor);
      disc(Math.floor(sw * 0.34), Math.floor(hor * 0.52), 5, cHi);
      disc(Math.floor(sw * 0.52), Math.floor(hor * 0.38), 3, mix(cAcc, cHi, 0.6));
      for (let i = 0; i < sw; i++) {
        const ridge = Math.floor(2 + Math.abs(Math.sin(i * 0.11 + 1)) * 5);
        rect(i, hor - ridge, 1, ridge, cMid);
      }
      rect(0, hor, sw, sh - hor, cDark);
      // Glowing vertical beacon & explorer silhouette.
      const bx = Math.floor(sw * 0.68);
      rect(bx, hor - 10, 2, 10, cHi);
      if (((t * 5) | 0) % 2 === 0) disc(bx, hor - 11, 2, 0xffffff);
      figure(Math.floor(sw * 0.28), sh - 2, cDark, 0);
      break;
    }
    case "noir-rain": {
      sky(cBg, cMid, Math.floor(sh * 0.68));
      rect(0, Math.floor(sh * 0.68), sw, sh, cDark);
      // Glowing streetlamp cone & wet reflections.
      const lx = Math.floor(sw * 0.3);
      rect(lx, 4, 1, sh - 6, cDark);
      rect(lx - 1, 3, 3, 2, cHi);
      for (let j = 5; j < sh - 2; j++) {
        const span = Math.floor((j - 4) * 0.55);
        for (let i = -span; i <= span; i++)
          if (((i + j) & 1) === 0) px(lx + i, j, mix(cBg, cHi, 0.35));
      }
      // Fedora detective + mysterious figure.
      figure(lx + 10, sh - 3, cDark, 0, true);
      figure(Math.floor(sw * 0.66), sh - 3, scale(cDark, 0.8), 1, false);
      // Animated diagonal silver rain streaks.
      for (let k = 0; k < 28; k++) {
        const rx = (Math.floor(h2(k, 3, seed) * sw - t * 18) % sw + sw) % sw;
        const ry = (Math.floor(h2(k, 4, seed) * sh + t * 28) % sh + sh) % sh;
        px(rx, ry, cHi); px(rx - 1, ry + 1, cAcc);
      }
      break;
    }
    case "harbor-pier": {
      const hor = Math.floor(sh * 0.58);
      sky(cBg, cMid, hor);
      // Lighthouse sweeping beam.
      const lhX = Math.floor(sw * 0.82);
      rect(lhX, hor - 11, 3, 11, cDark);
      px(lhX + 1, hor - 11, cHi);
      const sweep = Math.sin(t * 2.1);
      for (let d = 2; d < 28; d++) {
        const bx = lhX - Math.round(d * Math.cos(sweep * 0.35));
        const by = hor - 11 + Math.round(d * Math.sin(sweep * 0.25));
        px(bx, by, mix(cMid, cHi, 1 - d / 32));
      }
      // Freighter silhouette & lit portholes.
      const fx = Math.floor(sw * 0.16);
      rect(fx, hor - 5, 26, 5, cDark);
      rect(fx + 6, hor - 9, 8, 4, cDark);
      for (let p = 3; p < 23; p += 5) px(fx + p, hor - 3, cHi);
      // Shimmering water.
      for (let j = hor; j < sh; j++) {
        const rowPhase = h2(j, 5, seed) * 19;
        for (let i = 0; i < sw; i++) {
          const wave = ((i + ((t * 6 + rowPhase) | 0)) % (7 + (j % 4)) < 2) && ((j & 1) === 0);
          px(i, j, wave ? cHi : mix(cDark, cMid, (j - hor) / Math.max(1, sh - hor)));
        }
      }
      break;
    }
    case "western-ridge": {
      const hor = Math.floor(sh * 0.56);
      sky(cBg, cAcc, hor);
      disc(Math.floor(sw * 0.5), hor - 3, 5, cHi);
      // Layered desert mesas.
      rect(4, hor - 8, 18, 8, cMid); rect(8, hor - 10, 10, 2, cMid);
      rect(sw - 26, hor - 9, 22, 9, cMid); rect(sw - 22, hor - 11, 12, 2, cMid);
      rect(0, hor, sw, sh - hor, scale(cMid, 0.58));
      // Galloping riders silhouette.
      const rx = ((Math.floor(t * 16) % (sw + 18)) - 9);
      for (const off of [0, -13]) {
        const x = rx + off, y = hor + 4 + ((Math.floor(t * 10 + off) & 1));
        rect(x, y - 2, 6, 2, cDark); // horse body
        px(x + 6, y - 3, cDark); // head
        px(x + 2, y - 4, cDark); rect(x + 1, y - 5, 3, 1, cDark); // rider + hat
        px(x, y, cDark); px(x + 5, y, cDark);
      }
      break;
    }
    case "canyon-standoff": {
      const hor = Math.floor(sh * 0.55);
      sky(cBg, cHi, hor);
      rect(0, hor, sw, sh - hor, scale(cMid, 0.65));
      // Wooden western facades on edges.
      rect(0, hor - 10, 12, 12, cDark); rect(sw - 12, hor - 10, 12, 12, cDark);
      // Two gunslingers facing off.
      figure(Math.floor(sw * 0.28), sh - 3, cDark, 0, true);
      figure(Math.floor(sw * 0.7), sh - 3, cDark, 0, true);
      // Rolling tumbleweed.
      const tw = (Math.floor(t * 12) % sw);
      disc(tw, hor + 5 + Math.round(Math.abs(Math.sin(t * 7)) * -2), 1, cMid);
      break;
    }
    case "palace-dance": {
      sky(cBg, cMid);
      // Scalloped arches across back wall.
      for (let a = 6; a < sw - 8; a += 18) {
        rect(a, 3, 2, sh - 7, cDark);
        rect(a + 2, 3, 12, 2, cDark);
        disc(a + 8, 9, 4, cAcc);
        px(a + 8, 8, cHi); // hanging brass lamp
      }
      rect(0, sh - 6, sw, 6, mix(cMid, cHi, 0.35));
      // Twin whirling dancers in vivid skirts.
      const sway = Math.round(Math.sin(t * 4.5) * 4);
      for (const [bx, col] of [[Math.floor(sw * 0.38) + sway, cAcc], [Math.floor(sw * 0.62) - sway, cHi]] as const) {
        figure(bx, sh - 3, cDark, ((t * 6) | 0) & 1);
        rect(bx - 2, sh - 6, 6, 3, col);
      }
      break;
    }
    case "samurai-bridge": {
      const hor = Math.floor(sh * 0.62);
      sky(cBg, cAcc, hor);
      disc(Math.floor(sw * 0.5), Math.floor(hor * 0.45), 6, cHi);
      // Arched timber bridge.
      for (let i = 8; i < sw - 8; i++) {
        const arch = Math.round(Math.sin(((i - 8) / (sw - 16)) * Math.PI) * 5);
        rect(i, hor - arch, 1, 2, cDark);
        if (i % 6 === 0) rect(i, hor - arch - 2, 1, 2, cDark);
      }
      // Two swordsmen on the bridge.
      figure(Math.floor(sw * 0.38), hor - 4, cDark, 0, true);
      figure(Math.floor(sw * 0.6), hor - 4, cDark, 1, true);
      rect(Math.floor(sw * 0.42), hor - 7, 6, 1, cHi); // glint of drawn blade
      rect(0, hor + 2, sw, sh - hor - 2, cMid);
      break;
    }
    case "bamboo-duel": {
      sky(cBg, cAcc);
      // Swaying vertical bamboo stalks.
      for (let x = 4; x < sw; x += 8) {
        const lean = Math.round(Math.sin(t * 2 + x) * 1);
        for (let j = 0; j < sh; j++) {
          const sx0 = x + (j < sh / 2 ? lean : 0);
          px(sx0, j, j % 5 === 0 ? cHi : x % 16 === 4 ? cDark : cMid);
        }
      }
      const hop = Math.round(Math.abs(Math.sin(t * 5.5)) * 4);
      const mid = sw >> 1;
      figure(mid - 9, sh - 3 - hop, cDark, 1);
      figure(mid + 7, sh - 3 - (4 - hop), cDark, 1);
      if (((t * 8) | 0) % 2 === 0) {
        px(mid, sh - 9, 0xffffff); px(mid - 1, sh - 10, cHi); px(mid + 1, sh - 8, cHi);
      }
      break;
    }
    case "cafe-street": {
      sky(cBg, cAcc, Math.floor(sh * 0.65));
      rect(0, Math.floor(sh * 0.65), sw, sh, cMid);
      // Striped Parisian cafe awning on left.
      for (let i = 2; i < Math.floor(sw * 0.46); i++)
        rect(i, 6, 1, 4, (i >> 1) & 1 ? cHi : cDark);
      rect(8, sh - 9, 10, 1, cHi); rect(12, sh - 8, 2, 4, cDark); // bistro table
      figure(6, sh - 4, cDark); figure(19, sh - 4, cDark);
      // Vintage car gliding down street on right.
      const cx = Math.floor(sw * 0.55 + ((t * 14) % (sw * 0.5)));
      rect(cx, sh - 8, 12, 4, cDark); rect(cx + 2, sh - 10, 7, 2, cMid);
      px(cx + 12, sh - 6, cHi);
      break;
    }
    case "factory-montage": {
      sky(cBg, cAcc);
      // Constructivist diagonal searchlights & steel girders.
      for (let j = 0; j < sh; j++) {
        px(Math.floor(j * 1.4 + ((t * 10) % 12)), j, cHi);
        px(sw - Math.floor(j * 1.2), j, cDark);
        px(sw - Math.floor(j * 1.2) - 1, j, cDark);
      }
      // Spinning gear wheels.
      for (const [gx, gy, gr] of [[Math.floor(sw * 0.3), Math.floor(sh * 0.58), 6], [Math.floor(sw * 0.66), Math.floor(sh * 0.5), 7]] as const) {
        disc(gx, gy, gr, cDark);
        disc(gx, gy, gr - 2, cMid);
        for (let k = 0; k < 6; k++) {
          const ang = t * 2.5 + (k * Math.PI) / 3;
          px(gx + Math.round(Math.cos(ang) * (gr + 1)), gy + Math.round(Math.sin(ang) * (gr + 1)), cHi);
        }
      }
      break;
    }
    case "neon-chase": {
      const hor = Math.floor(sh * 0.5);
      sky(cBg, cMid, hor);
      // Striped synthwave sun.
      const sunX = sw >> 1;
      for (let j = -6; j <= 5; j++)
        for (let i = -6; i <= 6; i++)
          if (i * i + j * j <= 36 && (j < 0 || (j & 1) === 0)) px(sunX + i, hor - 4 + j, j < 0 ? 0xffe478 : cAcc);
      // Perspective neon highway grid.
      rect(0, hor, sw, sh - hor, cDark);
      for (let j = hor; j < sh; j++) {
        const yNorm = (j - hor) / Math.max(1, sh - hor);
        if (Math.floor((yNorm * 6 + t * 5) % 1 * 4) === 0) rect(0, j, sw, 1, cMid);
        const road = Math.floor(4 + yNorm * (sw * 0.36));
        px(sunX - road, j, cHi); px(sunX + road, j, cHi);
      }
      // Speeding sports car with twin glowing tail lights.
      const cx = sunX - 5 + Math.round(Math.sin(t * 3) * 3);
      rect(cx, sh - 7, 10, 4, cDark); rect(cx + 2, sh - 9, 6, 2, cMid);
      rect(cx + 1, sh - 5, 2, 1, cAcc); rect(cx + 7, sh - 5, 2, 1, cAcc);
      break;
    }
    case "neon-alley": {
      sky(cBg, cDark);
      // Dark buildings framing alley + glowing neon vertical signs.
      rect(0, 0, Math.floor(sw * 0.25), sh, cDark);
      rect(Math.floor(sw * 0.75), 0, sw, sh, cDark);
      const blink = ((t * 5) | 0) % 4 !== 0;
      rect(Math.floor(sw * 0.22), 4, 3, 11, blink ? cAcc : cMid);
      rect(Math.floor(sw * 0.75), 6, 3, 10, cHi);
      // Wet reflections on alley floor.
      for (let j = sh - 6; j < sh; j++) {
        rect(Math.floor(sw * 0.22), j, 4, 1, mix(cDark, cAcc, 0.55));
        rect(Math.floor(sw * 0.74), j, 4, 1, mix(cDark, cHi, 0.55));
      }
      figure(Math.floor(sw * 0.44), sh - 3, cMid, 0);
      figure(Math.floor(sw * 0.56), sh - 3, cMid, 1);
      break;
    }
    case "galleon-sea": {
      const hor = Math.floor(sh * 0.58);
      sky(cBg, cAcc, hor);
      // Rolling emerald waves.
      for (let j = hor; j < sh; j++) {
        const rowPhase = h2(j, 6, seed) * 17;
        for (let i = 0; i < sw; i++) {
          const crest = Math.sin(i * 0.28 + t * 4.5 + rowPhase) > 0.78 && ((j & 1) === 0);
          px(i, j, crest ? cHi : j % 2 ? cMid : cDark);
        }
      }
      // Tall-masted galleon rocking gently.
      const gx = Math.floor(sw * 0.42), bob = Math.round(Math.sin(t * 3.2) * 1);
      rect(gx, hor - 3 + bob, 20, 4, cDark);
      rect(gx + 6, hor - 14 + bob, 1, 11, cDark);
      rect(gx + 13, hor - 12 + bob, 1, 9, cDark);
      rect(gx + 3, hor - 12 + bob, 6, 7, cHi);
      rect(gx + 11, hor - 10 + bob, 5, 5, cHi);
      break;
    }
    case "jungle-temple": {
      sky(cBg, cAcc, Math.floor(sh * 0.65));
      rect(0, Math.floor(sh * 0.65), sw, sh, cDark);
      // Stepped stone pyramid in center.
      const cx = sw >> 1;
      for (let tier = 0; tier < 5; tier++) {
        const tw = 28 - tier * 5;
        rect(cx - (tw >> 1), sh - 5 - tier * 3, tw, 3, tier % 2 ? cMid : scale(cMid, 0.8));
      }
      // Glowing artifact beam & twin torches.
      rect(cx - 1, 2, 2, sh - 18, ((t * 7) | 0) % 2 ? cHi : cAcc);
      px(cx - 9, sh - 8, 0xffd060); px(cx + 9, sh - 8, 0xffd060);
      break;
    }
    case "rooftop-duel": {
      sky(cBg, cMid, Math.floor(sh * 0.66));
      disc(Math.floor(sw * 0.5), 8, 5, cHi);
      // City rooftop silhouettes.
      rect(0, sh - 9, Math.floor(sw * 0.32), 9, cDark);
      rect(Math.floor(sw * 0.36), sh - 11, Math.floor(sw * 0.28), 11, cDark);
      rect(Math.floor(sw * 0.68), sh - 8, sw, 8, cDark);
      const mid = sw >> 1, leap = Math.round(Math.abs(Math.sin(t * 5)) * 3);
      figure(mid - 7, sh - 11 - leap, cAcc, 1);
      figure(mid + 5, sh - 11, cHi, 0);
      break;
    }
    case "lantern-festival": {
      const hor = Math.floor(sh * 0.62);
      sky(cBg, cMid, hor);
      rect(0, hor, sw, sh - hor, cDark);
      // Drifting glowing paper lanterns + water reflections.
      for (let k = 0; k < 14; k++) {
        const lx = Math.floor((h2(k, 7, seed) * sw + t * (3 + (k % 3))) % sw);
        const ly = Math.floor((h2(k, 8, seed) * (hor - 3) - t * 2.5 + hor * 4) % (hor - 2));
        rect(lx, ly, 2, 3, k % 2 ? cHi : cAcc);
        px(lx, hor + Math.min(sh - hor - 1, (hor - ly) >> 1), mix(cDark, cAcc, 0.7));
      }
      break;
    }
    case "nile-dusk": {
      const hor = Math.floor(sh * 0.58);
      sky(cBg, cAcc, hor);
      // Crescent moon + distant pyramids.
      disc(Math.floor(sw * 0.78), 7, 3, cHi); disc(Math.floor(sw * 0.78) + 1, 6, 3, cBg);
      for (let p = 0; p < 7; p++) rect(14 + p, hor - p, 14 - p * 2, 1, cMid);
      for (let p = 0; p < 5; p++) rect(30 + p, hor - p, 10 - p * 2, 1, scale(cMid, 0.85));
      // Shimmering river & gliding felucca sail.
      for (let j = hor; j < sh; j++) {
        const rowPhase = h2(j, 7, seed) * 23;
        for (let i = 0; i < sw; i++)
          px(i, j, Math.sin(i * 0.3 + t * 3 + rowPhase) > 0.82 && ((j & 1) === 0) ? cHi : mix(cDark, cMid, 0.5));
      }
      const bx = Math.floor(((sw * 0.2 + t * 5) % (sw - 16)) + 6);
      rect(bx, hor + 2, 10, 2, cDark);
      for (let k = 0; k < 7; k++) rect(bx + 4, hor + 1 - k, Math.max(1, 5 - (k >> 1)), 1, cHi);
      break;
    }
    case "clock-tower": {
      sky(cBg, cMid);
      // Skyscraper facade on right + distant street below.
      const bx = Math.floor(sw * 0.42);
      rect(bx, 0, sw - bx, sh, cMid);
      rect(bx, 0, 2, sh, cDark);
      // Giant luminous clock face + ticking hand + dangling climber silhouette!
      const cx = Math.floor(sw * 0.64), cy = Math.floor(sh * 0.46), cr = Math.min(10, Math.floor(sh * 0.38));
      disc(cx, cy, cr + 1, cDark);
      disc(cx, cy, cr, cHi);
      for (let k = 0; k < 12; k++) {
        const a = (k * Math.PI) / 6;
        px(cx + Math.round(Math.cos(a) * (cr - 1)), cy + Math.round(Math.sin(a) * (cr - 1)), cDark);
      }
      const sag = 0.25 + Math.sin(t * 2.2) * 0.14;
      const hx = cx - Math.round(Math.cos(sag) * (cr - 2)), hy = cy + Math.round(Math.sin(sag) * (cr - 2));
      for (let s = 0; s <= cr - 2; s++) px(cx - Math.round(Math.cos(sag) * s), cy + Math.round(Math.sin(sag) * s), cDark);
      rect(cx, cy - cr + 3, 1, cr - 2, cDark);
      // Little figure hanging from the dipping minute hand!
      figure(hx - 1, hy + 7, cDark, ((t * 5) | 0) & 1, true);
      // Tiny cars moving far below on the left street.
      rect(0, sh - 3, bx, 3, cDark);
      const car = (Math.floor(t * 14) % Math.max(8, bx - 4));
      rect(car, sh - 4, 4, 2, cHi);
      break;
    }
    case "metropolis-tower": {
      sky(cBg, cMid);
      // Sweeping diagonal searchlights behind the city.
      const sweep = Math.sin(t * 1.4) * 14;
      for (let j = 0; j < sh; j++) {
        px(Math.floor(sw * 0.25 + j * 0.6 + sweep * 0.4), j, mix(cMid, cHi, 0.5));
        px(Math.floor(sw * 0.75 - j * 0.6 - sweep * 0.4), j, mix(cMid, cHi, 0.5));
      }
      // Monumental stepped Art Deco spire & flanking towers.
      const cx = sw >> 1;
      rect(cx - 12, 12, 24, sh - 12, cDark);
      rect(cx - 8, 6, 16, 6, cDark);
      rect(cx - 4, 2, 8, 4, cDark);
      rect(cx - 1, 0, 2, 3, cHi);
      rect(4, 9, 14, sh - 9, cDark);
      rect(sw - 18, 9, 14, sh - 9, cDark);
      // Lit Art Deco window strips & elevated skybridges.
      for (let j = 8; j < sh - 2; j += 3) {
        px(cx - 5, j, cHi); px(cx, j, cHi); px(cx + 5, j, cHi);
        px(9, j + 2, cAcc); px(sw - 10, j + 2, cAcc);
      }
      rect(18, Math.floor(sh * 0.48), sw - 36, 2, cAcc);
      rect(18, Math.floor(sh * 0.72), sw - 36, 2, cMid);
      // Tiny biplane gliding across the canyon.
      const px0 = ((Math.floor(t * 18) % (sw + 10)) - 5);
      rect(px0, 7, 5, 1, cHi); rect(px0 + 1, 9, 3, 1, cAcc);
      break;
    }
    case "nosferatu-shadow": {
      sky(cAcc, cMid);
      // Stark expressionist arched doorway & diagonal stone staircase.
      const archX = Math.floor(sw * 0.72);
      rect(archX, 3, 14, sh - 3, cDark);
      disc(archX + 7, 6, 6, cDark);
      for (let s = 0; s < 7; s++) rect(0, sh - 3 - s * 3, Math.floor(sw * 0.22 + s * 9), 3, cDark);
      // Looming hooked shadow creeping up the illuminated wall!
      const creep = Math.floor(Math.sin(t * 1.1) * 4 + sw * 0.38);
      const sy0 = Math.floor(sh * 0.44 - Math.sin(t * 1.1) * 2);
      disc(creep + 3, sy0 - 5, 3, cDark); // bald skull
      rect(creep, sy0 - 2, 7, 13, cDark); // stooped cloak
      // Long outstretched clawed fingers reaching toward the doorway.
      rect(creep + 7, sy0 - 2, 8, 2, cDark);
      px(creep + 15, sy0 - 3, cDark); px(creep + 16, sy0 - 2, cDark); px(creep + 15, sy0, cDark);
      break;
    }
    case "odessa-steps": {
      sky(cBg, cAcc, 6);
      // Descending monumental white stone steps.
      for (let j = 6; j < sh; j++) {
        const step = ((j - 6) % 3 === 0);
        rect(0, j, sw, 1, step ? cHi : j % 3 === 1 ? cAcc : cMid);
      }
      // Diagonal shadow wall on left & silhouetted marching soldiers along top.
      for (let j = 6; j < sh; j++) rect(0, j, Math.max(2, Math.floor((sh - j) * 0.9)), 1, cDark);
      for (let k = 0; k < 5; k++) figure(Math.floor(sw * 0.24 + k * 9), 11, cDark);
      // Runaway baby carriage bouncing down the steps!
      const prog = (localT / FILM_SCENE_SEC);
      const cx = Math.floor(sw * 0.34 + prog * (sw * 0.46));
      const cy = Math.floor(11 + prog * (sh - 14) - Math.abs(Math.sin(prog * Math.PI * 8)) * 1.5);
      rect(cx, cy - 3, 5, 3, cDark);
      px(cx + 1, cy - 4, cHi); px(cx + 2, cy - 4, cHi);
      px(cx, cy, cHi); px(cx + 4, cy, cHi);
      break;
    }
    case "airfield-fog": {
      const hor = Math.floor(sh * 0.62);
      sky(cBg, cMid, hor);
      rect(0, hor, sw, sh - hor, cDark);
      // Hangar spotlight cone cutting through the mist.
      const sx0 = Math.floor(sw * 0.78);
      for (let j = 3; j < hor + 6; j++) {
        const span = Math.floor((j - 2) * 0.7);
        for (let i = -span; i <= span; i++)
          if (((i + j) & 1) === 0) px(sx0 + i - (j >> 1), j, mix(cMid, cHi, 0.38));
      }
      // Twin-propeller airliner silhouette on tarmac.
      const ax = Math.floor(sw * 0.42);
      rect(ax, hor - 6, 26, 4, cDark); // fuselage
      rect(ax + 18, hor - 10, 5, 4, cDark); // tail fin
      rect(ax - 6, hor - 4, 34, 2, cDark); // wings
      for (let w = 4; w < 18; w += 3) px(ax + w, hor - 5, cHi);
      // Spinning propeller blurs.
      const blur = ((t * 24) | 0) & 1 ? cHi : cAcc;
      rect(ax - 3, hor - 6, 1, 5, blur); rect(ax + 11, hor - 6, 1, 5, blur);
      // Two trench-coat silhouettes in foreground.
      figure(Math.floor(sw * 0.2), sh - 2, cDark, 0, true);
      figure(Math.floor(sw * 0.28), sh - 2, scale(cDark, 0.85), 0, false);
      break;
    }
    case "kaiju-harbor": {
      const hor = Math.floor(sh * 0.68);
      sky(cBg, cMid, hor);
      // Tokyo skyline silhouettes on left with tiny lit windows.
      for (let b = 2; b < Math.floor(sw * 0.45); b += 7) {
        const bh = 6 + ((b * 7) % 10);
        rect(b, hor - bh, 5, bh, cDark);
        for (let wy = hor - bh + 2; wy < hor - 1; wy += 2) px(b + 2, wy, cHi);
      }
      // Giant kaiju rising from Tokyo Bay on right!
      const kx = Math.floor(sw * 0.68);
      rect(kx - 4, hor - 14, 10, 14, cDark); // torso
      rect(kx - 7, hor - 18, 7, 5, cDark); // head & jaw
      rect(kx + 6, hor - 6, 9, 4, cDark); // tail
      // Pulsing glowing dorsal fins & atomic heat beam!
      const pulse = ((t * 6) | 0) % 2 === 0;
      for (let f = 0; f < 4; f++) rect(kx + 6, hor - 15 + f * 3, 2, 2, pulse ? cHi : cAcc);
      if (((t * 3) | 0) % 2 === 0) {
        for (let d = 0; d < 32; d++) {
          const bx = kx - 8 - d, by = hor - 16 + Math.floor(d * 0.22);
          rect(bx, by, 2, 2, d % 3 === 0 ? cHi : cAcc);
        }
      }
      // Shimmering bay water.
      for (let j = hor; j < sh; j++)
        for (let i = 0; i < sw; i++)
          px(i, j, ((i + ((t * 6 + j * 3) | 0)) % 9 === 0) && (j & 1) === 0 ? cAcc : cDark);
      break;
    }
    case "kash-train": {
      const hor = Math.floor(sh * 0.56);
      sky(cHi, cAcc, hor);
      rect(0, hor, sw, sh - hor, cMid);
      // Distant black steam locomotive & plume racing across the horizon.
      const tx = ((Math.floor(t * 20) % (sw + 36)) - 26);
      rect(tx, hor - 4, 24, 4, cDark);
      rect(tx + 20, hor - 7, 2, 3, cDark);
      for (let s = 0; s < 5; s++) disc(tx + 19 - s * 4, hor - 8 - (s >> 1), 2, mix(cMid, cHi, 0.45));
      // Tall white swaying kash grass plumes across the foreground.
      for (let x = 2; x < sw; x += 5) {
        const sway = Math.round(Math.sin(t * 3 + x * 0.4) * 1.5);
        const h = 7 + ((x * 5) % 6);
        for (let k = 0; k < h; k++) px(x + Math.round((sway * k) / h), sh - 1 - k, k > h - 4 ? cHi : cDark);
      }
      break;
    }
    case "chinampa-boats": {
      const hor = Math.floor(sh * 0.58);
      sky(cBg, cAcc, hor);
      // Tall slender ahuejote cypress trees framing both banks of the Xochimilco canal.
      for (const tx of [6, 15, 24, sw - 26, sw - 17, sw - 8]) {
        rect(tx, 5, 3, hor - 3, cDark);
        rect(tx + 1, 2, 1, 3, cDark);
      }
      // Glowing canal water down the center.
      for (let j = hor; j < sh; j++) {
        const rowPhase = h2(j, 4, seed) * 17;
        for (let i = 0; i < sw; i++)
          px(i, j, Math.sin(i * 0.25 + t * 2.5 + rowPhase) > 0.8 && (j & 1) === 0 ? cHi : mix(cDark, cMid, 0.55));
      }
      // Slender wooden trajinera flower boat gliding forward.
      const bx = Math.floor(sw * 0.36 + Math.sin(t * 1.3) * 6);
      rect(bx, hor + 4, 18, 3, cDark);
      rect(bx + 3, hor + 1, 11, 3, cHi); // flower canopy
      px(bx + 16, hor + 1, cDark); // boatman with pole
      rect(bx + 17, hor + 1, 1, 6, cAcc);
      break;
    }
    case "dino-lagoon": {
      const hor = Math.floor(sh * 0.62);
      sky(cBg, cAcc, hor);
      // Distant volcanic ridge & tropical canopy.
      for (let i = 0; i < sw; i++) {
        const ridge = Math.floor(2 + Math.sin(i * 0.09) * 3 + Math.cos(i * 0.17) * 2);
        rect(i, hor - ridge, 1, ridge, cMid);
      }
      // Towering graceful sauropod silhouette lifting its long neck!
      const dx = Math.floor(sw * 0.52), nod = Math.round(Math.sin(t * 2.2) * 1);
      rect(dx, hor - 7, 14, 6, cDark); // body
      rect(dx + 1, hor - 1, 2, 4, cDark); rect(dx + 10, hor - 1, 2, 4, cDark); // legs
      rect(dx + 14, hor - 4, 9, 2, cDark); // tail
      for (let k = 0; k < 12; k++) rect(dx - 1 - Math.floor(k * 0.35), hor - 7 - k, 2, 2, cDark); // long curving neck
      rect(dx - 7, hor - 19 + nod, 5, 2, cDark); // head
      // Rippling misty lagoon water.
      for (let j = hor; j < sh; j++)
        for (let i = 0; i < sw; i++)
          px(i, j, Math.sin(i * 0.3 + t * 3 + h2(j, 3, seed) * 15) > 0.8 && (j & 1) === 0 ? cHi : mix(cDark, cMid, 0.45));
      break;
    }
    case "zigzag-hill": {
      const hor = Math.floor(sh * 0.44);
      sky(cBg, cAcc, hor);
      // Rolling Iranian hillside.
      for (let i = 0; i < sw; i++) {
        const hill = Math.floor(hor + Math.sin(i * 0.05) * 3);
        rect(i, hill, 1, sh - hill, cMid);
      }
      // Crisp pale Z-shaped zigzag footpath climbing the slope!
      for (let s = 0; s < 3; s++) {
        const y0 = sh - 3 - s * 5, xStart = s % 2 === 0 ? 14 : sw - 18, xEnd = s % 2 === 0 ? sw - 18 : 14;
        for (let k = 0; k <= 36; k++) {
          const px0 = Math.round(xStart + ((xEnd - xStart) * k) / 36);
          const py0 = Math.round(y0 - (5 * k) / 36);
          px(px0, py0, cHi);
        }
      }
      // Solitary olive tree on the crest + tiny running child!
      const tx = Math.floor(sw * 0.62), ty = hor;
      rect(tx, ty - 3, 1, 4, cDark);
      disc(tx, ty - 5, 3, cDark);
      const prog = (localT / FILM_SCENE_SEC);
      const rx = Math.floor(20 + prog * (sw - 44));
      const ry = Math.floor(sh - 3 - prog * (sh - hor - 4));
      rect(rx, ry - 3, 2, 3, cDark);
      break;
    }
  }

  // Subtle vertical dust scratch on silent films.
  if (film.silent && ((t * 8) | 0) % 5 === 0) {
    const sx0 = Math.floor(h2((t * 8) | 0, 9, seed) * sw);
    for (let j = 0; j < sh; j += 2) px(sx0, j, cHi);
  }

  return gain === 1 ? scene.glow : scale(scene.glow, Math.max(0.45, gain));
}
