import { hash, mix, scale, stones, vnoise } from "./room";

export type OverlookDraw = {
  s: (x: number, y: number, c: number) => void;
  g: (x: number, y: number, c: number) => void;
  r: (x: number, y: number, w: number, h: number, c: number | ((i: number, j: number) => number)) => void;
  lights: { x: number; y: number; c: number; rad: number; k: number; phase: number }[];
  fires: { x: number; y: number; w: number; h: number; lit: boolean }[];
  notes: { x: number; y: number }[];
  t: number;
};

/** Paints bespoke Overlook Hotel centerpieces (Gold Room bar, Blood Elevator,
 * Room 237 avocado bath, Colorado Lounge stone hearth, REDRUM door, Red Restroom sinks). */
export function paintOverlookAltar(
  d: OverlookDraw,
  style: string,
  X: number,
  Y: number,
  PW: number,
  PD: number,
  seed: number,
): boolean {
  const cx = X + (PW >> 1), base = Y + PD - 2;
  switch (style) {
    case "overlook-bar": {
      // Eight-tile gilded Art Deco backlit bar of The Gold Room.
      const w = Math.min(PW, 128), x0 = cx - (w >> 1), top = base - 52;
      // Outer Art Deco brass-and-mahogany cornice arch.
      d.r(x0, top, w, 40, (i, j) => {
        if (i === 0 || i === w - 1 || j === 0) return 0x3a2012;
        if (i === 1 || i === w - 2 || j === 1 || j === 2) return j === 1 ? 0xf6de84 : 0xc89632;
        return 0x4e2c1a;
      });
      // Luminous golden amber backlit glass panels (3 arched bays).
      const bays = 3, gap = 6, bw = Math.floor((w - 12 - gap * (bays - 1)) / bays);
      for (let b = 0; b < bays; b++) {
        const bx = x0 + 6 + b * (bw + gap);
        const by = top + 5, bh = 28;
        const pulse = 0.96 + 0.04 * Math.sin(d.t * 2.2 + b * 1.4);
        for (let j = 0; j < bh; j++) {
          for (let i = 0; i < bw; i++) {
            const dx = (i - bw / 2) / (bw / 2);
            const arch = j < 5 && dx * dx + ((5 - j) / 5) ** 2 > 1.15;
            if (arch) {
              d.s(bx + i, by + j, (i + j) & 1 ? 0xd4a23a : 0x8e6420);
              continue;
            }
            const grad = mix(0xffeeb4, 0xe89a34, j / bh);
            const pane = i === 0 || i === bw - 1 || j === 0 ? 0x9e6c1e : scale(grad, pulse * (1 - 0.12 * dx * dx));
            if (i === 0 || i === bw - 1 || j === 0) d.s(bx + i, by + j, pane);
            else d.g(bx + i, by + j, pane);
          }
        }
        // Two glass liquor shelves per bay crowded with jewel-toned bourbon & cordial bottles.
        for (const sy of [by + 12, by + 23]) {
          d.r(bx + 1, sy, bw - 2, 1, 0x7c4c18);
          d.r(bx + 1, sy + 1, bw - 2, 1, 0xf8e8a8);
          for (let i = 3; i < bw - 4; i += 4) {
            const h = 5 + ((i * 7 + b * 13) % 4);
            const palette = [0x9e3418, 0x266a3c, 0xc87420, 0x781828, 0x3c527a];
            const col = palette[(i + b * 3) % palette.length];
            const hi = mix(col, 0xfff0c8, 0.45);
            d.s(bx + i + 1, sy - h, 0x3a2012);
            d.s(bx + i + 1, sy - h + 1, hi);
            d.r(bx + i, sy - h + 2, 3, h - 2, (u, v) => (u === 0 ? hi : u === 2 ? scale(col, 0.65) : v === 2 ? 0xf6e6b8 : col));
          }
        }
      }
      // Mahogany bar counter in front with brass rail & warm amber top gleam.
      const cy = base - 16;
      d.r(x0 - 2, cy, w + 4, 17, (i, j) => {
        if (j === 0 || j === 16 || i === 0 || i === w + 3) return 0x2a140c;
        if (j <= 3) return j === 1 ? 0x9e6438 : j === 2 ? 0x7e4824 : 0x5c3018;
        if (j === 4) return 0xe8bc52;
        if (j === 14) return 0xd8a83c;
        if (j === 15) return 0x7a5018;
        const p = i % 16;
        return p === 1 || p === 14 ? 0x3e1e10 : p === 2 ? 0x744022 : 0x542c16;
      });
      // Crystal whiskey glasses & golden ice bucket on the bar top.
      for (const gx of [x0 + 18, x0 + 44, x0 + 76, x0 + 102]) {
        d.r(gx, cy - 3, 3, 4, (i, j) => (j === 0 ? 0xf6f8fc : i === 1 ? 0xd88828 : 0xb8d4e0));
      }
      d.lights.push(
        { x: x0 + 24, y: top + 24, c: 0xffcc64, rad: 112, k: 1.15, phase: -1 },
        { x: cx, y: top + 24, c: 0xffd678, rad: 130, k: 1.25, phase: -1 },
        { x: x0 + w - 24, y: top + 24, c: 0xffcc64, rad: 112, k: 1.15, phase: -1 },
      );
      return true;
    }
    case "overlook-elevator": {
      // Twin bronze-and-crimson Art Deco elevator doors with floor dial and subtle crimson seep.
      const w = 54, x0 = cx - (w >> 1), top = base - 46;
      // Stepped bronze arch frame.
      d.r(x0, top, w, 46, (i, j) => {
        if (i === 0 || i === w - 1 || j === 0) return 0x2a1812;
        if (i < 4 || i >= w - 4 || j < 11) {
          if (i === 1 || j === 1) return 0xe8c05c;
          if (i === 3 || i === w - 4 || j === 10) return 0x5c3618;
          return (i + j) % 7 === 0 ? 0xc49434 : 0x8e6222;
        }
        return 0x381214;
      });
      // Semicircular glowing brass floor indicator dial above the doors.
      const dx0 = cx, dy0 = top + 9;
      for (let j = -7; j <= 0; j++) {
        for (let i = -9; i <= 9; i++) {
          const r2 = i * i + j * j;
          if (r2 > 81) continue;
          if (r2 > 58) d.s(dx0 + i, dy0 + j, 0xf2d478);
          else d.g(dx0 + i, dy0 + j, r2 < 12 ? 0x6a2810 : 0xffecaa);
        }
      }
      // Indicator needle drifting slowly toward floor 2.
      const ang = -Math.PI * 0.5 + Math.sin(d.t * 0.35) * 0.35;
      for (let k = 1; k <= 6; k++) d.s(dx0 + Math.round(Math.cos(ang) * k), dy0 + Math.round(Math.sin(ang) * k), 0x36140c);
      // Twin crimson-bronze Art Deco sliding doors.
      const dw = 20, dh = 34;
      for (const side of [0, 1]) {
        const sx = x0 + 6 + side * (dw + 2), sy = top + 11;
        d.r(sx, sy, dw, dh, (i, j) => {
          if (i === 0 || i === dw - 1 || j === 0 || j === dh - 1) return 0x2c0e10;
          if (i === 2 || i === dw - 3 || j === 2 || j === dh - 3) return 0xc89636;
          if (j === 16 && (i > 3 && i < dw - 4)) return 0xe2b44c;
          const chev = Math.abs(i - dw / 2) + Math.abs((j % 12) - 6);
          if (chev === 5) return 0x9e3226;
          return i < 5 ? 0x7c1c1e : 0x5e1418;
        });
      }
      // Twin frosted brass wall sconces flanking the elevator.
      for (const lx of [x0 - 5, x0 + w + 2]) {
        d.r(lx, top + 14, 3, 6, (_i, j) => (j === 0 || j === 5 ? 0xc89634 : 0xfff0b4));
        d.g(lx + 1, top + 16, 0xfff6cc);
        d.g(lx + 1, top + 17, 0xffe694);
        d.lights.push({ x: lx + 1, y: top + 18, c: 0xffd078, rad: 44, k: 0.72, phase: -1 });
      }
      // Subtle animated crimson sheen pooling softly under the bronze threshold.
      const ripple = 0.85 + 0.15 * Math.sin(d.t * 1.8 + seed);
      for (let j = 0; j < 7; j++) {
        const span = Math.round((20 - j * 2.4) * ripple + Math.sin(j * 1.9 + d.t * 1.1) * 1.5);
        for (let i = -span; i <= span; i++) {
          const edge = Math.abs(i) > span - 2 || j === 6;
          const glint = j === 1 && ((i + Math.floor(d.t * 4)) & 7) === 0;
          d.s(cx + i, base + j, glint ? 0xd8383c : edge ? 0x5c0c12 : 0x8e121a);
        }
      }
      return true;
    }
    case "overlook-bath237": {
      // Room 237 iconic 1970s avocado-green tiled bathroom nook with sunken green tub & mint curtain.
      const w = 60, x0 = cx - (w >> 1), top = base - 44;
      // Glazed avocado-green subway tile surround.
      d.r(x0, top, w, 34, (i, j) => {
        if (i === 0 || i === w - 1 || j === 0) return 0x264428;
        if (j === 1 || i === 1) return 0x8cc078;
        const seam = j % 6 === 0 || ((i + ((j / 6) | 0) * 4) % 8 === 0);
        if (seam) return 0x426e40;
        return (i + j) % 13 === 0 ? 0x80b46c : 0x689e5a;
      });
      // Chrome shower rod & half-drawn pale mint-green patterned curtain on the left.
      d.r(x0 + 2, top + 4, w - 4, 2, (_i, j) => (j === 0 ? 0xe8f2f4 : 0x7e9498));
      d.r(x0 + 3, top + 6, 20, 29, (i, j) => {
        const fold = i % 5;
        if (fold === 0) return 0x6ea684;
        if (fold === 2) return 0xd4f0dc;
        return (i + j) % 6 === 0 ? 0x98cfa8 : 0xb2e0be;
      });
      // Chrome faucet & showerhead on the right wall.
      d.r(x0 + w - 12, top + 10, 4, 3, 0xdce8ec);
      d.r(x0 + w - 10, top + 24, 5, 2, 0xdce8ec);
      d.s(x0 + w - 11, top + 26, 0x92b4bc);
      // Sunken avocado-green porcelain bathtub filled with shimmering pale turquoise water.
      const ty = base - 14;
      d.r(x0 + 2, ty, w - 4, 15, (i, j) => {
        if (i === 0 || i === w - 5 || j === 0 || j === 14) return 0x224024;
        if (j <= 2) return j === 1 ? 0x98cc84 : 0x74a864;
        if (j >= 10) return j === 10 ? 0x56844c : 0x406c3a;
        if (i < 4 || i > w - 9) return 0x78ac68;
        const wave = Math.sin(i * 0.35 + d.t * 2.4 + j) > 0.55;
        return wave ? 0xc4f0e8 : j === 5 ? 0x7ec6be : 0x5ea8a2;
      });
      d.lights.push({ x: cx + 6, y: top + 20, c: 0x98e4c8, rad: 68, k: 0.72, phase: -1 });
      return true;
    }
    case "overlook-redrum": {
      // Torrance Quarters red inner door with splintered axe gouges and crimson REDRUM lettering.
      const w = 32, x0 = cx - (w >> 1), top = base - 44;
      d.r(x0 - 2, top - 2, w + 4, 46, (i, j) => (i < 2 || i >= w + 2 || j < 2 ? 0x58361e : 0x26120c));
      d.r(x0, top, w, 44, (i, j) => {
        if (i === 0 || i === w - 1 || j === 0) return 0x2a0e0e;
        const inset = (i >= 4 && i <= w - 5) && ((j >= 4 && j <= 20) || (j >= 24 && j <= 40));
        if (inset && (i === 4 || j === 4 || j === 24)) return 0x4a1616;
        if (inset && (i === w - 5 || j === 20 || j === 40)) return 0x98362e;
        return inset ? 0x782420 : 0x862a24;
      });
      // Brass doorknob.
      d.r(x0 + w - 7, top + 22, 3, 3, (i, j) => (i === 0 && j === 0 ? 0xfff0a0 : 0xc8942c));
      // Jagged pale-wood splintered axe hole beside the middle panel!
      const gash = [
        "..ss..",
        ".s##s.",
        "s####s",
        ".s###s",
        "..s##s",
        ".s###s",
        "..s#s.",
        "...s..",
      ];
      gash.forEach((row, j) => {
        for (let i = 0; i < row.length; i++) {
          if (row[i] === "s") d.s(x0 + 18 + i, top + 26 + j, 0xe8cfa0);
          else if (row[i] === "#") d.s(x0 + 18 + i, top + 26 + j, 0x1e0e0c);
        }
      });
      // Tiny crimson hand-scrawled "REDRUM" across the upper panel (3px tall micro-glyphs).
      const letters = [
        "110.111.110.110.101.101",
        "110.110.101.110.101.111",
        "101.111.110.101.111.101",
      ];
      const lx = x0 + 5, ly = top + 10;
      letters.forEach((row, j) => {
        for (let i = 0; i < row.length; i++) {
          if (row[i] === "1") d.g(lx + i, ly + j, j === 0 ? 0xe02824 : 0xb81818);
        }
      });
      return true;
    }
    case "overlook-lounge-hearth": {
      // Massive five-tile river-stone fireplace of The Colorado Lounge with cedar mantel & roaring fire.
      const w = 72, x0 = cx - (w >> 1), top = base - 52;
      // River-stone chimney breast built of individually shaded alpine boulders.
      for (let j = 0; j < 52; j++) {
        for (let i = 0; i < w; i++) {
          const bx = x0 + i, by = top + j;
          if (i === 0 || i === w - 1 || j === 0) { d.s(bx, by, 0x2c2420); continue; }
          const st = stones(i, j, 10, 7, seed + 17);
          if (st.e < 1.2) { d.s(bx, by, 0x3e3630); continue; }
          const tone = [0x867c70, 0x9c8e7c, 0x746c64, 0xa89882, 0x68625c][Math.abs(st.id) % 5];
          const lit = st.dy < 0 || st.dx < -1 ? mix(tone, 0xd4c8b4, 0.3) : mix(tone, 0x342c28, 0.28);
          d.s(bx, by, st.e < 2.2 ? lit : tone);
        }
      }
      // Heavy hewn cedar timber mantel shelf across the middle.
      d.r(x0 - 3, top + 21, w + 6, 6, (_i, j) => (j === 0 || j === 5 ? 0x2e1a10 : j === 1 ? 0x9a6236 : j === 2 ? 0x7a4824 : 0x5c3418));
      // Brass mountain-lodge lamps on either end of the mantel + framed Rockies etching center.
      for (const lx of [x0 + 6, x0 + w - 12]) {
        d.r(lx, top + 12, 6, 5, (i, j) => (j === 0 || j === 4 ? 0x8c5a20 : i === 0 || i === 5 ? 0xc88e30 : 0xffe8a0));
        d.g(lx + 2, top + 14, 0xfff4c4);
        d.r(lx + 2, top + 17, 2, 4, 0x8a5e22);
        d.lights.push({ x: lx + 3, y: top + 15, c: 0xffd080, rad: 48, k: 0.7, phase: -1 });
      }
      // Deep arched firebox opening & stone hearth apron.
      const fw = 36, fh = 20, fx = cx - (fw >> 1), fy = base - fh;
      d.r(fx - 2, fy - 2, fw + 4, fh + 2, 0x3a322c);
      d.r(fx, fy, fw, fh, (i, j) => {
        const arch = j < 5 && (i < 5 - j || i >= fw - (5 - j));
        if (arch) return 0x4c423a;
        return mix(0x1e1210, 0x421c12, j / fh);
      });
      // Stacked pine logs & glowing ember bed + animated PixelRoom fire!
      d.r(fx + 5, base - 4, fw - 10, 4, (i, j) => (j === 0 ? 0x5c321a : (i + j) % 3 === 0 ? 0xd8581c : 0x3a1c10));
      d.r(x0 - 2, base, w + 4, 4, (i, j) => (j === 0 ? 0xb4a894 : j === 3 ? 0x3a322c : i % 10 === 0 ? 0x5a5048 : 0x8c8276));
      d.fires.push({ x: fx + 6, y: base - 3, w: fw - 12, h: 14, lit: true });
      d.lights.push(
        { x: cx, y: base - 4, c: 0xff8e34, rad: 120, k: 1.15, phase: 7 },
        { x: cx, y: base + 22, c: 0xffa84c, rad: 95, k: 0.65, phase: 19 },
      );
      return true;
    }
    case "overlook-restroom-sinks": {
      // Gold Room Red Restroom: 3 white porcelain pedestal sinks & glowing chrome Art Deco mirrors on blood-red lacquer.
      const w = 74, x0 = cx - (w >> 1), top = base - 44;
      // Glossy red lacquered back panel with crisp white Art Deco trim.
      d.r(x0, top, w, 44, (i, j) => {
        if (j === 0 || j === 1) return 0xf2eee8;
        if (i === 0 || i === w - 1) return 0x580a10;
        return (i % 12 === 0) ? 0xc4282e : 0xa2141a;
      });
      for (const idx of [0, 1, 2]) {
        const mx = x0 + 6 + idx * 24;
        // Glowing Art Deco chrome-framed mirror.
        d.r(mx, top + 4, 14, 18, (i, j) => {
          if (i === 0 || i === 13 || j === 0 || j === 17) return 0x485058;
          if (i === 1 || i === 12 || j === 1 || j === 16) return 0xf0f4f8;
          return (i + j) % 9 === 0 ? 0xf8fcff : 0xcad8e2;
        });
        // Warm chrome vanity lamp above each mirror.
        d.r(mx + 3, top + 2, 8, 2, 0xfff4d0);
        d.g(mx + 4, top + 2, 0xfff8dc);
        d.g(mx + 9, top + 2, 0xfff8dc);
        // White porcelain pedestal basin & chrome faucet.
        d.r(mx + 1, top + 25, 12, 6, (i, j) => {
          if (j === 0 || j === 5 || i === 0 || i === 11) return 0x8e969e;
          if (j === 1) return 0xffffff;
          if (j === 2 && i >= 3 && i <= 8) return 0xc6d4dc;
          return 0xeaeef2;
        });
        d.r(mx + 6, top + 23, 2, 3, 0x9aa6b0);
        d.r(mx + 5, top + 31, 4, 12, (i) => (i === 0 ? 0xffffff : i === 3 ? 0x98a2aa : 0xdce2e8));
        d.lights.push({ x: mx + 7, y: top + 12, c: 0xffeec8, rad: 46, k: 0.68, phase: -1 });
      }
      return true;
    }
    default:
      return false;
  }
}

/** Paints bespoke Overlook Hotel & Hedge Maze fixtures (`q.item?.startsWith("overlook:")`). */
export function paintOverlookFixture(
  d: OverlookDraw,
  item: string,
  X: number,
  Y: number,
  PW: number,
  PD: number,
  seed: number,
): boolean {
  const base = Y + PD - 2;
  if (item.startsWith("overlook:hedge:")) {
    // Neighbor-aware 3D Stardew snow-capped evergreen hedge run (`masks`: 1 hex char per tile, N=1 E=2 S=4 W=8).
    const masks = item.slice("overlook:hedge:".length);
    const nTiles = Math.max(1, Math.min(masks.length, Math.round(PW / 16)));
    const H = 26; // rises 10px above footprint for lush 3D Stardew depth
    const y0 = Y - 10;
    for (let ti = 0; ti < nTiles; ti++) {
      const m = parseInt(masks[ti] ?? "0", 16) || 0;
      const hasN = (m & 1) !== 0, hasE = (m & 2) !== 0, hasS = (m & 4) !== 0, hasW = (m & 8) !== 0;
      const tx = X + ti * 16;
      for (let j = 0; j < H; j++) {
        for (let i = 0; i < 16; i++) {
          const wx = tx + i, wy = y0 + j;
          // Rounded organic topiary corners on exposed sides.
          const cornerNW = !hasN && !hasW && i + j < 3;
          const cornerNE = !hasN && !hasE && (15 - i) + j < 3;
          const cornerSW = !hasS && !hasW && i + (H - 1 - j) < 2;
          const cornerSE = !hasS && !hasE && (15 - i) + (H - 1 - j) < 2;
          if (cornerNW || cornerNE || cornerSW || cornerSE) continue;

          // Subtle scalloped silhouette on exposed outer edges.
          const leafNoise = hash(wx >> 1, wy >> 1, seed + 91);
          const tuft = vnoise(wx, wy, 4, seed + 31);
          // Continuous vertical walls (hasN) flow seamlessly as a single snow-crowned evergreen ridge
          // rather than repeating horizontal snow bands on every row.
          const snowLine = hasN
            ? (hasS ? 0 : 0)
            : 11 + Math.round(Math.sin(wx * 0.45) * 1.4 + (tuft - 0.5) * 3.2);
          // For vertical hedge segments (hasN && !hasE && !hasW), snow rides down the center crown while
          // rich evergreen pine needles frame both sides, seamlessly joining the tile to the north.
          const vertCrown = hasN && i >= 3 && i <= 12 && (hasS ? j < H : j < H - 9 + Math.round((tuft - 0.5) * 2.5));
          const isTop = j < snowLine || vertCrown;
          const leftRim = !hasW && i === 0;
          const rightRim = !hasE && i === 15;
          const topRim = !hasN && j === 0;
          const botRim = !hasS && j === H - 1;

          if (isTop) {
            // Thick winter snow cap resting on the top of the evergreen hedge!
            if (topRim || leftRim || rightRim) {
              d.s(wx, wy, topRim || leftRim ? 0x9ab4ce : 0x6c88a8);
              continue;
            }
            // Crisp snow overhang lip where snow meets green pine needles.
            const snowEdge = (!hasN && j === snowLine - 1)
              || (vertCrown && (i === 3 || i === 12 || (!hasS && j >= H - 10)));
            if (snowEdge) {
              d.s(wx, wy, i === 3 ? 0xc0d8ec : 0x98b4d2);
              continue;
            }
            const drift = vnoise(wx, wy, 7, seed + 13);
            const c = j <= 2 && !hasN
              ? 0xffffff
              : drift > 0.62 ? 0xf6fbff
              : drift > 0.36 ? 0xe0eef8
              : 0xc6dcf0;
            d.s(wx, wy, c);
          } else {
            // Rich Stardew Valley evergreen spruce/pine foliage wall!
            if (botRim) {
              d.s(wx, wy, 0x102218);
              continue;
            }
            if (leftRim || rightRim) {
              d.s(wx, wy, leftRim ? 0x1e402c : 0x12281c);
              continue;
            }
            // Shadow cast just under the snow overhang lip.
            if (!hasN && (j === snowLine || j === snowLine + 1)) {
              d.s(wx, wy, j === snowLine ? 0x142c20 : 0x1c3c2a);
              continue;
            }
            // Deep layered Stardew pine needle clusters.
            const depthShade = !hasS && j > H - 5 ? 0.72 : 1;
            const cluster = vnoise(wx + (j & 2), wy, 3.5, seed + 57);
            const raw = cluster > 0.68 ? 0x4a8658
              : cluster > 0.5 ? 0x356b45
              : cluster > 0.3 ? 0x255034
              : 0x1a3b26;
            // Occasional tiny white frost speck caught on a pine needle.
            const frost = leafNoise < 0.045 && (!hasN ? j < snowLine + 5 : true) ? 0xd4e6f4 : scale(raw, depthShade);
            d.s(wx, wy, frost);
          }
        }
      }
    }
    return true;
  }

  switch (item) {
    case "overlook:maze-arch": {
      // Heavy snow-draped timber archway with carved "MAZE" signboard & twin frosted lanterns.
      const w = Math.max(48, PW), cx = X + (w >> 1), top = base - 38;
      // Left and right heavy cedar timber posts.
      for (const px of [X + 2, X + w - 7]) {
        d.r(px, top + 10, 5, 29, (i, j) => (i === 0 || i === 4 || j === 28 ? 0x2c1a10 : i === 1 ? 0x865632 : 0x623c20));
      }
      // Crossbeam & carved dark-green signboard with golden "MAZE" lettering.
      d.r(X, top + 4, w, 11, (i, j) => {
        if (i === 0 || i === w - 1 || j === 0 || j === 10) return 0x2a180e;
        if (j === 1) return 0xa47042;
        if (j >= 3 && j <= 8 && i >= 6 && i < w - 6) return (i === 6 || i === w - 7 || j === 3 || j === 8) ? 0xd8a83a : 0x1d402c;
        return 0x6e4424;
      });
      // Golden pixel letters "MAZE" centered on the sign.
      const mazeWord = [
        "10001.0110.1111.1111",
        "11011.1001.0010.1000",
        "10101.1111.0100.1110",
        "10001.1001.1111.1111",
      ];
      const wx0 = cx - 10, wy0 = top + 8;
      mazeWord.forEach((row, j) => {
        for (let i = 0; i < row.length; i++) if (row[i] === "1") d.g(wx0 + i, wy0 + j - 1, 0xf6de84);
      });
      // Snow drift piled along the top ridge of the timber arch!
      for (let i = 1; i < w - 1; i++) {
        const sh = 3 + Math.round(Math.sin(i * 0.25) * 1.1);
        for (let j = 0; j < sh; j++) d.s(X + i, top + 4 - sh + j, j === 0 ? 0xffffff : j === sh - 1 ? 0xa6c0dc : 0xe4f0fa);
      }
      // Twin frosted globe lanterns hanging beside the posts.
      for (const lx of [X + 8, X + w - 11]) {
        d.r(lx, top + 15, 3, 2, 0x2c3038);
        d.r(lx - 1, top + 17, 5, 5, (i, j) => (i === 0 || i === 4 || j === 0 || j === 4 ? 0xd8a848 : 0xfff6cc));
        d.g(lx, top + 18, 0xfff8dc);
        d.g(lx + 1, top + 19, 0xfff8dc);
        d.g(lx + 2, top + 18, 0xfff8dc);
        d.lights.push({ x: lx + 1, y: top + 20, c: 0xffcf78, rad: 74, k: 0.9, phase: -1 });
      }
      return true;
    }
    case "overlook:maze-sign": {
      // Snow-capped wooden Overlook Maze map kiosk signboard!
      const cx = X + 8, top = base - 24;
      d.r(cx - 2, base - 10, 4, 11, (i) => (i === 0 || i === 3 ? 0x2e1c12 : 0x744a28));
      d.r(cx - 8, top + 3, 16, 13, (i, j) => {
        if (i === 0 || i === 15 || j === 0 || j === 12) return 0x2e1c12;
        if (i === 1 || i === 14 || j === 1 || j === 11) return 0x8c5a30;
        // Crisp concentric Overlook Maze diagram with red "YOU ARE HERE" dot at south entrance!
        const ix = i - 2, iy = j - 2; // 12x9 inner board
        if (iy === 8 && (ix === 5 || ix === 6)) return 0xd82828;
        const wall = ix === 0 || ix === 11 || iy === 0 || (iy === 8 && ix !== 5 && ix !== 6)
          || (iy === 2 && ix >= 2 && ix <= 9 && ix !== 5)
          || (iy === 6 && ix >= 2 && ix <= 9)
          || ((ix === 2 || ix === 9) && iy >= 2 && iy <= 6)
          || ((ix === 4 || ix === 7) && iy >= 4 && iy <= 6);
        return wall ? 0x245836 : 0xeef6fc;
      });
      // Snow-covered pitched cap on the signboard.
      d.r(cx - 9, top, 18, 3, (_i, j) => (j === 0 ? 0xffffff : j === 1 ? 0xdcebf8 : 0x9cb8d4));
      return true;
    }
    case "overlook:pine": {
      // Lush snow-laden Colorado Blue Spruce tree in Stardew pixel style.
      const cx = X + 8, top = base - 34;
      // Cedar trunk.
      d.r(cx - 2, base - 8, 4, 9, (i) => (i === 0 ? 0x623c24 : i === 3 ? 0x26140c : 0x4a2a18));
      // Four layered evergreen bough tiers, each tipped with crisp snow pillows!
      const tiers = [
        { y: top, h: 8, hw: 4 },
        { y: top + 6, h: 9, hw: 6 },
        { y: top + 13, h: 9, hw: 8 },
        { y: top + 20, h: 8, hw: 9 },
      ];
      for (const tier of tiers) {
        for (let j = 0; j < tier.h; j++) {
          const half = Math.max(1, Math.round((tier.hw * (j + 2)) / (tier.h + 1)));
          for (let i = -half; i <= half; i++) {
            const wx = cx + i, wy = tier.y + j;
            const edge = Math.abs(i) === half || j === tier.h - 1;
            const snow = j < 3 + ((Math.abs(i) + seed) & 1) && Math.abs(i) <= half - (j === 0 ? 0 : 1);
            if (snow) {
              d.s(wx, wy, j === 0 ? 0xffffff : j === 1 ? 0xe4f0fa : 0xb6cde4);
            } else if (edge) {
              d.s(wx, wy, 0x10241c);
            } else {
              const n = hash(wx, wy, seed + 4);
              d.s(wx, wy, i < 0 && n > 0.3 ? 0x32624c : n > 0.5 ? 0x224a3a : 0x18362a);
            }
          }
        }
      }
      return true;
    }
    case "overlook:lantern-post": {
      // Alpine wrought-iron frosted globe lantern post glowing warmly over the winter snow.
      const cx = X + 8, top = base - 30;
      d.r(cx - 3, base - 3, 6, 4, (i, j) => (j === 0 ? 0x5c6874 : i === 0 || i === 5 ? 0x1e2228 : 0x363e48));
      d.r(cx - 1, top + 8, 2, 19, (i) => (i === 0 ? 0x4c5864 : 0x222830));
      d.r(cx - 4, top + 10, 8, 2, 0x2c343c);
      // Frosted lantern globe & snow-dusted iron cap.
      d.r(cx - 3, top + 2, 6, 6, (i, j) => (i === 0 || i === 5 || j === 0 || j === 5 ? 0xd8a840 : 0xfff6cc));
      for (let j = 3; j <= 6; j++) for (let i = -2; i <= 2; i++) d.g(cx + i, top + j, 0xfff6d0);
      d.r(cx - 4, top, 8, 2, (_i, j) => (j === 0 ? 0xffffff : 0x9cb8d4));
      d.lights.push({ x: cx, y: top + 6, c: 0xffcc6e, rad: 92, k: 1.05, phase: -1 });
      return true;
    }
    case "overlook:typewriter": {
      // Jack Torrance's oak writing table in the Colorado Lounge: Adler typewriter, towering manuscript stack, banker's lamp & yellow tennis ball.
      const w = 32, x0 = X, top = base - 20;
      // Heavy oak table legs & surface.
      d.r(x0 + 1, top + 8, w - 2, 12, (i, j) => {
        if (i === 0 || i === w - 3 || j === 0 || j === 11) return 0x2c180e;
        if (j <= 5) return j === 1 ? 0xa46c3c : j === 5 ? 0x5c3418 : 0x84522a;
        if (j >= 7 && i >= 3 && i <= w - 6) return 0x1e120c; // open leg space underneath
        return i < 3 || i > w - 6 ? 0x623a1c : 0x4a2814;
      });
      // Detailed dark-grey Adler typewriter with white sheet sticking out!
      d.r(x0 + 11, top + 2, 10, 8, (i, j) => {
        if (i === 0 || i === 9 || j === 0 || j === 7) return 0x24262c;
        if (j === 1 || j === 2) return 0x4e545e;
        if (j >= 5) return (i & 1) ? 0xdedad0 : 0x363a42; // typewriter keys!
        return 0x68707c;
      });
      d.r(x0 + 13, top - 3, 6, 6, (i, j) => (i === 0 || i === 5 || j === 0 ? 0xc2bcae : (j === 2 || j === 4) && i > 0 && i < 5 ? 0x3a3836 : 0xf6f2e8));
      // Towering 500-page manuscript stack ("All work and no play...") on the right!
      d.r(x0 + 23, top + 1, 6, 9, (i, j) => (i === 0 || i === 5 || j === 0 || j === 8 ? 0x9c9282 : (j & 1) ? 0xf6f2e8 : 0xded8ca));
      // Glowing emerald-glass banker's lamp on the left.
      d.r(x0 + 3, top, 6, 3, (_i, j) => (j === 0 ? 0x1e5c3c : 0x40b872));
      d.g(x0 + 4, top + 2, 0x90f0b4);
      d.g(x0 + 7, top + 2, 0x90f0b4);
      d.r(x0 + 5, top + 3, 2, 5, 0xc89832);
      d.r(x0 + 4, top + 8, 4, 1, 0x9c6e1e);
      // Bright yellow rubber tennis ball sitting right at the table's corner!
      d.r(x0 + 8, top + 9, 3, 3, (i, j) => (i === 1 && j === 1 ? 0xfff898 : 0xe4cc28));
      d.lights.push({ x: x0 + 6, y: top + 3, c: 0xb8f09c, rad: 48, k: 0.65, phase: -1 });
      return true;
    }
    case "overlook:maze-model": {
      // Polished oak pedestal table holding the miniature green replica of the Overlook Hedge Maze!
      const w = 32, x0 = X, top = base - 18;
      // Oak base & bevelled rim.
      d.r(x0 + 1, top + 4, w - 2, 15, (i, j) => {
        if (i === 0 || i === w - 3 || j === 0 || j === 14) return 0x2c180e;
        if (j === 1 || j === 11) return 0x9e6638;
        if (j > 11) return (i < 4 || i > w - 7) ? 0x5c3418 : 0x2a1810;
        return 0x6c4020;
      });
      // Miniature overhead green-and-cream Overlook Hedge Maze inset!
      d.r(x0 + 3, top + 5, w - 6, 9, (i, j) => {
        const edge = i === 0 || i === w - 7 || j === 0 || j === 8;
        const ring = (j === 2 && i > 1 && i < w - 8) || (j === 6 && i > 1 && i < w - 8)
          || ((i === 4 || i === w - 11) && j > 1 && j < 7)
          || ((i === 9 || i === w - 16) && j > 2 && j < 6);
        const center = Math.abs(i - (w - 6) / 2) < 2 && j === 4;
        if (center) return 0xf6de84;
        return edge || ring ? ((i + j) & 1 ? 0x2a663c : 0x1e4c2c) : 0xdce6d4;
      });
      return true;
    }
    case "overlook:tricycle": {
      // Danny's unmistakable red-and-blue Big Wheel tricycle on the hexagon carpet!
      const cx = X + 8, ty = base - 11;
      // Big front black wheel + red fork + chrome handlebars.
      d.r(cx - 6, ty + 4, 5, 7, (i, j) => ((i === 0 || i === 4) && (j === 0 || j === 6) ? 0x3a1c12 : i === 2 && j === 3 ? 0xe0e4e8 : 0x22242a));
      d.r(cx - 5, ty, 3, 5, 0xd02626);
      d.r(cx - 7, ty - 1, 7, 2, (i) => (i === 0 || i === 6 ? 0x22242a : 0xdce4ea));
      // Low-slung red plastic frame & blue bucket seat + rear wheels.
      d.r(cx - 2, ty + 6, 7, 3, 0xd82828);
      d.r(cx + 1, ty + 2, 5, 5, (i, j) => (j === 0 || i === 4 ? 0x1e488a : 0x3474c8));
      d.r(cx + 4, ty + 7, 4, 4, (i, j) => (i === 1 && j === 1 ? 0x9aa4ae : 0x22242a));
      return true;
    }
    case "overlook:piano": {
      // Glossy ebony Gold Room grand piano with ivory keyboard & floating 1920s jazz notes!
      const x0 = X, top = base - 22;
      // Curved ebony baby grand body & propped lid.
      for (let j = 0; j < 12; j++) {
        const right = j < 5 ? 19 + j * 2 : 28;
        for (let i = 0; i < right; i++) {
          const edge = i === 0 || i === right - 1 || j === 0 || j === 11;
          const c = edge ? 0x141218 : (j === 1 || j === 2) ? (i < 14 ? 0x4e4c5c : 0x343242) : 0x22202a;
          d.s(x0 + 2 + i, top + 2 + j, c);
        }
      }
      d.r(x0 + 2, top + 12, 26, 4, (i, j) => {
        if (j === 0 || j === 3 || i === 0 || i === 25) return 0x141218;
        // Ivory & ebony keys!
        return i >= 3 && i <= 22 ? ((i & 1) ? 0xf6f2e6 : j === 1 ? 0x1e1c24 : 0xe4dfd0) : 0x2a2832;
      });
      // Three slender legs & brass pedal lyre.
      for (const lx of [x0 + 4, x0 + 14, x0 + 24]) d.r(lx, top + 16, 2, 6, 0x1e1c24);
      d.r(x0 + 13, top + 20, 4, 2, 0xd8a838);
      d.notes.push({ x: x0 + 14, y: top });
      return true;
    }
    case "overlook:tv": {
      // 1970s woodgrain console CRT television in Torrance Quarters with animated blue-white screen glow!
      const cx = X + 8, top = base - 16;
      // Rabbit-ear antennas.
      for (let k = 0; k < 4; k++) {
        d.s(cx - 2 - k, top - k, 0xb8c2cc);
        d.s(cx + 2 + k, top - k, 0xb8c2cc);
      }
      // Walnut cabinet.
      d.r(cx - 7, top + 1, 14, 13, (i, j) => (i === 0 || i === 13 || j === 0 || j === 12 ? 0x2c180e : i === 1 || j === 1 ? 0x8a5832 : 0x623a1c));
      // Flickering CRT screen & chrome tuning dials.
      const fl = 0.88 + 0.12 * Math.sin(d.t * 17 + seed);
      for (let j = 3; j <= 10; j++) {
        for (let i = -5; i <= 2; i++) {
          const scan = ((j + Math.floor(d.t * 8)) & 1) ? 0xd4ecff : 0x90bce0;
          d.g(cx + i, top + j, scale(scan, fl));
        }
      }
      d.s(cx + 4, top + 5, 0xd8dce0);
      d.s(cx + 4, top + 8, 0xd8dce0);
      d.r(cx - 5, base - 2, 2, 3, 0x3a2012);
      d.r(cx + 3, base - 2, 2, 3, 0x3a2012);
      d.lights.push({ x: cx - 1, y: top + 7, c: 0x8cc4f0, rad: 48, k: 0.65, phase: 11 });
      return true;
    }
    case "overlook:axe": {
      // Snow-dusted timber stump with a gleaming red-backed hickory fire axe embedded upright!
      const cx = X + 8, top = base - 16;
      // Stump.
      d.r(cx - 4, base - 6, 8, 7, (i, j) => (i === 0 || i === 7 || j === 6 ? 0x2c1a10 : j === 0 ? 0xd8e8f4 : j === 1 ? 0xb48454 : 0x6c4224));
      // Diagonal hickory handle & crimson/steel fireman's axe head.
      for (let k = 0; k < 10; k++) {
        d.s(cx - 3 + k, top + 2 + k, 0xb8844c);
        d.s(cx - 2 + k, top + 2 + k, 0x88582c);
      }
      d.r(cx - 5, top + 1, 5, 5, (i, j) => (i === 0 ? 0xe8eef4 : i === 1 ? 0xb4c0cc : j === 0 || j === 4 ? 0x6e1418 : 0xb82228));
      return true;
    }
    default:
      return false;
  }
}

/** Paints Overlook floor clutter (snow bootprints in the maze, stray yellow tennis ball). */
export function paintOverlookClutter(
  d: Pick<OverlookDraw, "s" | "r">,
  item: string,
  X: number,
  Y: number,
  seed: number,
): boolean {
  if (item === "overlook:prints") {
    // Crisp staggered bootprints pressed into the snowy maze paths.
    const dx = (seed & 1) ? 1 : -1;
    d.r(X + 4, Y + 4, 3, 4, (i, j) => (j === 0 ? 0x8aa6c4 : i === 2 ? 0xffffff : 0xa6c0dc));
    d.r(X + 9 + dx, Y + 9, 3, 4, (i, j) => (j === 0 ? 0x8aa6c4 : i === 2 ? 0xffffff : 0xa6c0dc));
    return true;
  }
  if (item === "overlook:tennis-ball") {
    d.r(X + 6, Y + 6, 4, 4, (i, j) => {
      if ((i === 0 || i === 3) && (j === 0 || j === 3)) return 0x5c2012;
      if (i === 1 && j === 1) return 0xfff8a0;
      return 0xe6ce2a;
    });
    return true;
  }
  return false;
}
