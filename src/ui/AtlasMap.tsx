import { useEffect, useRef } from "react";
import { atlasLand, atlasRivers } from "../world/geography/atlas";
import { featuredPlaces, places } from "../content/geography/places";
export function AtlasMap({
  lon,
  lat,
  onChoose,
}: {
  lon: number;
  lat: number;
  onChoose?: (id: string) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext("2d");
    if (!c) return;
    const point = (p: number[]) => [
      ((p[0] + 180) * 720) / 360,
      ((85 - p[1]) * 340) / 170,
    ];
    c.fillStyle = "#244952";
    c.fillRect(0, 0, 720, 340);
    c.fillStyle = "#7e8859";
    c.strokeStyle = "#a1ab75";
    c.lineWidth = 0.6;
    for (const ring of atlasLand) {
      c.beginPath();
      ring.forEach((p, i) => {
        const [x, y] = point(p);
        if (i) c.lineTo(x, y);
        else c.moveTo(x, y);
      });
      c.fill();
      c.stroke();
    }
    c.strokeStyle = "#427d8e";
    c.lineWidth = 0.6;
    for (const r of atlasRivers) {
      c.beginPath();
      r.points.forEach((p, i) => {
        const [x, y] = point(p);
        if (i) c.lineTo(x, y);
        else c.moveTo(x, y);
      });
      c.stroke();
    }
    c.fillStyle = "#d9c895";
    for (const p of featuredPlaces) {
      const [x, y] = point([p.lon, p.lat]);
      c.fillRect(x - 1, y - 1, 3, 3);
    }
    const [x, y] = point([lon, lat]);
    c.strokeStyle = "#fff0b3";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(x, y, 5, 0, Math.PI * 2);
    c.stroke();
  }, [lon, lat]);
  return (
    <canvas
      ref={ref}
      width={720}
      height={340}
      className="atlas-map"
      aria-label="Earth atlas showing your location"
      onClick={(event) => {
        if (!onChoose) return;
        const r = event.currentTarget.getBoundingClientRect();
        const lon = ((event.clientX - r.left) / r.width) * 360 - 180,
          lat = 85 - ((event.clientY - r.top) / r.height) * 170;
        const p = [...places].sort(
          (a, b) =>
            Math.hypot(a.lon - lon, a.lat - lat) -
            Math.hypot(b.lon - lon, b.lat - lat),
        )[0];
        if (p) onChoose(p.id);
      }}
    />
  );
}
