import { useEffect, useRef, useState } from "react";
import { atlasLand, atlasRivers } from "../world/geography/atlas";
import glacialAtlas from "../assets/arrival-atlas-glacial.webp";
import modernAtlas from "../assets/arrival-atlas-modern.webp";
import "./arrival.css";

const W = 720, H = 340;
const project = ([lon, lat]: number[]) => [(lon + 180) * 2, (85 - lat) * 2];

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
  const atlasUrl = year <= -10000 ? glacialAtlas : modernAtlas;
  const [atlas, setAtlas] = useState<{ url: string; image: HTMLImageElement }>();
  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.src = atlasUrl;
    void image.decode().then(() => {
      if (!cancelled) setAtlas({ url: atlasUrl, image });
    }, () => {});
    return () => { cancelled = true; };
  }, [atlasUrl]);
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
    const background = atlas?.url === atlasUrl ? atlas.image : undefined;
    if (background) c.drawImage(background, 0, 0, W, H);
    c.strokeStyle = "#e9d9ae22";
    c.lineWidth = 0.6 / zoom;
    for (let x = 0; x <= W; x += 30) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    for (let y = 0; y <= H; y += 30) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.fillStyle = "#52644e";
    c.strokeStyle = "#1c3c4c";
    c.lineWidth = 1 / zoom;
    for (const ring of atlasLand) {
      c.beginPath();
      ring.forEach((point, i) => { const [x, y] = project(point); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
      if (!background) c.fill();
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
  }, [center, zoom, markX, markY, atlas, atlasUrl, pick?.lon, pick?.lat]);
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
