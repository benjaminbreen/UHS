import { useEffect, useRef, useState } from "react";
import { atlasLand, atlasRivers } from "../world/geography/atlas";
import { climateAt } from "../content/geography/climate-map";
import { mountainBelts } from "../content/geography/landforms";
import { noise, segmentDistance } from "../world/geography/noise";
import "./arrival.css";

const W = 720, H = 340;
const project = ([lon, lat]: number[]) => [(lon + 180) * 2, (85 - lat) * 2];
// Terrain raster at 4 px per degree, twice the map's base scale.
const RES = 4, TW = 360 * RES, TH = 170 * RES;

const biome: Record<string, [number, number, number]> = {
  tropical: [52, 96, 52], monsoon: [88, 114, 58], temperate: [104, 128, 72],
  mediterranean: [150, 144, 92], arid: [196, 164, 106], boreal: [66, 92, 68],
  tundra: [138, 142, 118],
};
// Rough peak height against the Himalaya, so only real alpine belts carry snow.
const peaks: Record<string, number> = {
  Himalaya: 1.1, "Tibetan highlands": 0.95, Andes: 1, Alps: 0.9, "Rocky Mountains": 0.85, Altai: 0.8,
  "Taurus and Zagros": 0.7, Pyrenees: 0.7, "Ethiopian highlands": 0.65, "East African highlands": 0.65,
  "Atlas Mountains": 0.65, "Japanese mountains": 0.6, Balkans: 0.5, Apennines: 0.5, "Burmese highlands": 0.55,
};
const terrains = new Map<boolean, HTMLCanvasElement>();

function terrain(glacial: boolean) {
  const cached = terrains.get(glacial);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = TW; canvas.height = TH;
  const c = canvas.getContext("2d")!;
  c.scale(RES / 2, RES / 2);
  c.fillStyle = "#fff";
  for (const ring of atlasLand) {
    c.beginPath();
    ring.forEach((point, i) => { const [x, y] = project(point); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.fill();
  }
  const image = c.getImageData(0, 0, TW, TH), px = image.data;
  const land = new Float32Array(TW * TH);
  for (let i = 0; i < land.length; i++) land[i] = px[i * 4 + 3] > 127 ? 1 : 0;
  // Three box blurs of the land mask stand in for distance from shore.
  let shelf = land;
  for (let pass = 0; pass < 3; pass++) shelf = boxBlur(shelf, TW, TH, 7);
  const height = new Float32Array(TW * TH);
  const belts = mountainBelts.map((b) => {
    const xs = b.points.map((p) => p[0]), ys = b.points.map((p) => p[1]);
    return { ...b, peak: peaks[b.name] ?? 0.45, x0: Math.min(...xs) - b.width, x1: Math.max(...xs) + b.width, y0: Math.min(...ys) - b.width, y1: Math.max(...ys) + b.width };
  });
  for (let y = 0; y < TH; y++)
    for (let x = 0; x < TW; x++) {
      const i = y * TW + x;
      if (!land[i]) continue;
      const lon = x / RES - 180, lat = 85 - y / RES;
      let relief = 0;
      for (const b of belts) {
        if (lon < b.x0 || lon > b.x1 || lat < b.y0 || lat > b.y1) continue;
        for (let k = 1; k < b.points.length; k++)
          relief = Math.max(relief, b.peak * (1 - segmentDistance(lon, lat, b.points[k - 1], b.points[k]) / b.width));
      }
      const rough = noise("arrival", x, y, 9) * 0.6 + noise("arrival", x, y, 3) * 0.4;
      height[i] = relief * (0.55 + 0.6 * rough) + 0.12 * noise("arrival", x, y, 40) + 0.05 * rough;
    }
  for (let y = 0; y < TH; y++)
    for (let x = 0; x < TW; x++) {
      const i = y * TW + x, o = i * 4;
      const grain = noise("arrival-sea", x, y, 5) * 0.06;
      if (!land[i]) {
        const s = Math.min(1, shelf[i] * 2.2) + grain;
        px[o] = 18 + 38 * s; px[o + 1] = 44 + 70 * s; px[o + 2] = 68 + 58 * s; px[o + 3] = 255;
        continue;
      }
      const lon = x / RES - 180, lat = 85 - y / RES;
      // Jitter the climate lookup so biome edges dither instead of stepping.
      const jx = (noise("arrival-j", x, y, 4) - 0.5) * 1.6, jy = (noise("arrival-k", x, y, 4) - 0.5) * 1.6;
      const zone = climateAt(lon + jx, lat + jy)
        ?? (Math.abs(lat) > 66 ? "tundra" : Math.abs(lat) > 55 ? "boreal" : Math.abs(lat) < 18 ? "tropical" : "temperate");
      let [r, g, b] = biome[zone];
      const h = height[i];
      const rock = Math.max(0, Math.min(1, (h - 0.4) * 2));
      r += (128 - r) * rock; g += (112 - g) * rock; b += (92 - b) * rock;
      const ice = (glacial && lat > 50 + 8 * noise("arrival-ice", x, y, 30) && (lon < -50 || (lon > -10 && lon < 60)))
        || Math.abs(lat) > 80 || lat < -60
        // The Greenland ice sheet, which every era has had; its coast is bare.
        || (lat > 60 && lon > -55 && lon < -20 && shelf[i] > 0.93);
      const snow = ice ? 1 : Math.max(0, Math.min(1, (h - 0.8 + Math.abs(lat) / 200) * 5));
      r += (236 - r) * snow; g += (238 - g) * snow; b += (240 - b) * snow;
      const nw = height[Math.max(0, i - TW - 1)], se = height[Math.min(height.length - 1, i + TW + 1)];
      // Quantised light from the north-west keeps the relief reading as pixel art.
      const shade = 1 + Math.round(Math.max(-0.5, Math.min(0.5, (nw - se) * 6)) * 8) / 12 + (grain - 0.03);
      px[o] = r * shade; px[o + 1] = g * shade; px[o + 2] = b * shade; px[o + 3] = 255;
    }
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.putImageData(image, 0, 0);
  terrains.set(glacial, canvas);
  return canvas;
}

export function boxBlur(src: Float32Array, TW: number, TH: number, r: number) {
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length);
  for (let y = 0; y < TH; y++) {
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += src[y * TW + Math.max(0, Math.min(TW - 1, x))];
    for (let x = 0; x < TW; x++) {
      tmp[y * TW + x] = sum / (2 * r + 1);
      sum += src[y * TW + Math.min(TW - 1, x + r + 1)] - src[y * TW + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < TW; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += tmp[Math.max(0, Math.min(TH - 1, y)) * TW + x];
    for (let y = 0; y < TH; y++) {
      out[y * TW + x] = sum / (2 * r + 1);
      sum += tmp[Math.min(TH - 1, y + r + 1) * TW + x] - tmp[Math.max(0, y - r) * TW + x];
    }
  }
  return out;
}

export function ArrivalMap({ lon, lat, year, place, pick, onPick }: {
  lon: number;
  lat: number;
  year: number;
  place: string;
  /** A chosen destination, marked and joined to the traveller. */
  pick?: { lon: number; lat: number };
  onPick?: (p: { lon: number; lat: number }) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved?: boolean } | null>(null);
  const [zoom, setZoom] = useState(3);
  const [center, setCenter] = useState(() => project([lon, lat]));
  const [markX, markY] = project([lon, lat]);
  useEffect(() => { setCenter(project([lon, lat])); setZoom(3); }, [lon, lat]);
  useEffect(() => {
    const c = canvas.current?.getContext("2d");
    if (!c) return;
    c.fillStyle = "#12304a";
    c.fillRect(0, 0, W, H);
    c.save();
    c.translate(W / 2 - center[0] * zoom, H / 2 - center[1] * zoom);
    c.scale(zoom, zoom);
    c.imageSmoothingEnabled = false;
    c.drawImage(terrain(year <= -10000), 0, 0, W, H);
    c.strokeStyle = "#e9d9ae22";
    c.lineWidth = 0.6 / zoom;
    for (let x = 0; x <= W; x += 30) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    for (let y = 0; y <= H; y += 30) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.strokeStyle = "#1c3c4c";
    c.lineWidth = 1 / zoom;
    for (const ring of atlasLand) {
      c.beginPath();
      ring.forEach((point, i) => { const [x, y] = project(point); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
      c.stroke();
    }
    c.strokeStyle = "#6fa6b8";
    c.lineWidth = Math.max(0.35, 1.1 / zoom);
    for (const river of atlasRivers) {
      c.beginPath();
      river.points.forEach((point, i) => { const [x, y] = project(point); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
      c.stroke();
    }
    c.restore();
    const vignette = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
    vignette.addColorStop(0, "#0000");
    vignette.addColorStop(1, "#08121c88");
    c.fillStyle = vignette;
    c.fillRect(0, 0, W, H);
    const sx = W / 2 + (markX - center[0]) * zoom;
    const sy = H / 2 + (markY - center[1]) * zoom;
    if (pick) {
      const [px, py] = project([pick.lon, pick.lat]);
      const tx = W / 2 + (px - center[0]) * zoom,
        ty = H / 2 + (py - center[1]) * zoom;
      c.strokeStyle = "#f3d38f";
      c.lineWidth = 2;
      c.setLineDash([6, 5]);
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(tx, ty); c.stroke();
      c.setLineDash([]);
      c.fillStyle = "#f3d38f";
      c.beginPath(); c.arc(tx, ty, 4, 0, Math.PI * 2); c.fill();
    }
    if (sx >= 0 && sx <= W && sy >= 0 && sy <= H) {
      c.fillStyle = "#e8be71";
      c.strokeStyle = "#fff1ce";
      c.lineWidth = 2;
      c.shadowColor = "#000a";
      c.shadowBlur = 6;
      c.beginPath(); c.arc(sx, sy, 5, 0, Math.PI * 2); c.fill(); c.stroke();
      c.shadowBlur = 0;
      c.beginPath(); c.arc(sx, sy, 12, 0, Math.PI * 2); c.stroke();
    }
  }, [center, zoom, markX, markY, year, pick?.lon, pick?.lat]);
  const changeZoom = (factor: number) => setZoom((z) => Math.max(1, Math.min(12, z * factor)));
  return <div className="arrival-map">
    <canvas ref={canvas} width={W} height={H} aria-label={`Zoomable world map showing ${place}`}
      onWheel={(event) => { event.preventDefault(); changeZoom(event.deltaY < 0 ? 1.25 : 0.8); }}
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, cx: center[0], cy: center[1] }; }}
      onPointerMove={(event) => { if (!drag.current) return; if (Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) > 4) drag.current.moved = true; const r = event.currentTarget.getBoundingClientRect(); setCenter([Math.max(0, Math.min(W, drag.current.cx - (event.clientX - drag.current.x) * W / r.width / zoom)), Math.max(0, Math.min(H, drag.current.cy - (event.clientY - drag.current.y) * H / r.height / zoom))]); }}
      onPointerUp={(event) => {
        const moved = drag.current?.moved;
        drag.current = null;
        if (moved || !onPick) return;
        const r = event.currentTarget.getBoundingClientRect();
        const x = center[0] + ((event.clientX - r.left) * W / r.width - W / 2) / zoom,
          y = center[1] + ((event.clientY - r.top) * H / r.height - H / 2) / zoom;
        onPick({ lon: x / 2 - 180, lat: 85 - y / 2 });
      }} onPointerCancel={() => { drag.current = null; }} />
    <div className="arrival-map-controls"><button type="button" aria-label="Zoom in" onClick={() => changeZoom(1.5)}>+</button><button type="button" aria-label="Zoom out" onClick={() => changeZoom(1 / 1.5)}>−</button><button type="button" aria-label="Center map on your location" onClick={() => setCenter([markX, markY])}>⌖</button></div>
  </div>;
}
