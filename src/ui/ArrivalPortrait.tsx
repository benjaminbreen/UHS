import { useEffect, useRef, useState } from "react";
import type { CharacterAppearance } from "../core/character";
import { CharacterSprite, CROP, portraitCanvas } from "./CharacterSprite";

const scatter = (n: number) => {
  const value = Math.sin((n + 1) * 127.1) * 43758.5453;
  return value - Math.floor(value);
};
const stars = Array.from({ length: 46 }, (_, i) => ({
  x: 4 + scatter(i * 3) * (CROP.w - 8),
  y: 4 + scatter(i * 3 + 1) * (CROP.h - 8),
  phase: scatter(i * 3 + 2) * Math.PI * 2,
  color: [[247, 237, 212], [213, 184, 121], [143, 163, 198]][i % 3],
}));

export function ArrivalPortrait({ appearance, age }: {
  appearance?: CharacterAppearance;
  age?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const epoch = useRef<number | undefined>(undefined);
  const [settled, setSettled] = useState(false);
  const key = appearance ? JSON.stringify(appearance) : "";
  useEffect(() => {
    const out = canvas.current?.getContext("2d");
    if (!out) return;
    setSettled(false);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const start = performance.now();
    epoch.current ??= start;
    const pixels: { x: number; y: number; color: number[]; delay: number }[] = [];
    if (appearance) {
      const source = portraitCanvas(appearance, age ?? 30, `${age ?? 30}:${JSON.stringify(appearance)}`);
      const data = source.getContext("2d")!.getImageData(CROP.x, CROP.y, CROP.w, CROP.h).data;
      for (let y = 0; y < CROP.h; y++) for (let x = 0; x < CROP.w; x++) {
        const at = (y * CROP.w + x) * 4;
        if (!data[at + 3]) continue;
        pixels.push({ x, y, color: Array.from(data.slice(at, at + 4)),
          delay: scatter(x + y * CROP.w) * .3 + (y > 17 && y < 33 ? .15 : 0) });
      }
    }
    let frame = 0;
    const paint = (now: number) => {
      const time = (now - epoch.current!) / 1000;
      const progress = appearance ? Math.min(1, (now - start) / 800) : 0;
      out.clearRect(0, 0, CROP.w * 2, CROP.h * 2);
      out.save();
      out.scale(2, 2);
      if (appearance) for (const pixel of pixels) {
        const fade = Math.max(0, Math.min(1, (progress - pixel.delay) / (1 - pixel.delay)));
        out.fillStyle = `rgba(${pixel.color.slice(0, 3).join(",")},${fade * fade * pixel.color[3] / 255})`;
        out.fillRect(pixel.x, pixel.y, 1, 1);
      }
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const pixel = pixels[Math.floor(scatter(i + 500) * pixels.length)];
        const gather = progress * progress * (3 - 2 * progress);
        const drift = Math.sin(time * .3 + star.phase) * .6 * (1 - gather);
        const x = star.x + ((pixel?.x ?? star.x) - star.x) * gather + drift;
        const y = star.y + ((pixel?.y ?? star.y) - star.y) * gather + drift * .5;
        if (i % 9 === 0 && i + 1 < stars.length && !appearance) {
          const next = stars[i + 1];
          out.strokeStyle = `rgba(213,184,121,${.06 + .035 * Math.sin(time * .6 + star.phase)})`;
          out.lineWidth = .35;
          out.beginPath();
          out.moveTo(x + .5, y + .5);
          out.lineTo(next.x + .5, next.y + .5);
          out.stroke();
        }
        const color = star.color.map((value, channel) => Math.round(value + ((pixel?.color[channel] ?? value) - value) * gather));
        const alpha = (.4 + .25 * Math.sin(time * .8 + star.phase)) * (1 - progress);
        out.fillStyle = `rgba(${color.join(",")},${alpha})`;
        out.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
      out.restore();
      if (appearance && (progress === 1 || motion.matches)) {
        setSettled(true);
        return;
      }
      if (!motion.matches) frame = requestAnimationFrame(paint);
    };
    const changeMotion = () => {
      cancelAnimationFrame(frame);
      paint(performance.now());
    };
    paint(start);
    motion.addEventListener("change", changeMotion);
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", changeMotion);
    };
  }, [key, age]);
  return <div className={`arrival-portrait${settled ? " is-settled" : ""}`}>
    <canvas ref={canvas} width={CROP.w * 2} height={CROP.h * 2} aria-hidden="true" hidden={settled} />
    {settled && appearance && <CharacterSprite appearance={appearance} age={age} portrait />}
  </div>;
}
