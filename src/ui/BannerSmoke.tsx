import { useEffect, useRef } from "react";

type Emitter = readonly [x: number, y: number, strength: number];

/** Pixel smoke puffs rising from banner chimneys, drawn over the image. */
export function BannerSmoke({
  img,
  emitters,
}: {
  img: React.RefObject<HTMLImageElement | null>;
  emitters: readonly Emitter[];
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const image = img.current;
    if (!canvas || !image || !emitters.length) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d")!;
    const cell = 3;
    type Puff = {
      x: number;
      y: number;
      born: number;
      life: number;
      drift: number;
      size: number;
    };
    let puffs: Puff[] = [];
    let w = 0,
      h = 0;
    // Where each emitter lands on screen, allowing for object-fit: cover crop.
    let sources: { x: number; y: number; strength: number }[] = [];
    const layout = () => {
      if (!image.naturalWidth) return;
      const rect = image.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width / cell));
      h = Math.max(1, Math.floor(rect.height / cell));
      canvas.width = w;
      canvas.height = h;
      const scale = rect.width / image.naturalWidth;
      const full = image.naturalHeight * scale;
      const crop = Math.max(0, full - rect.height);
      sources = emitters.map(([x, y, strength]) => ({
        x: (x * rect.width) / cell,
        y: (y * full - crop) / cell,
        strength,
      }));
    };
    let last = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      for (const s of sources)
        if (Math.random() < dt * 2.2 * s.strength)
          puffs.push({
            x: s.x + (Math.random() - 0.5) * 2,
            y: s.y,
            born: now,
            life: 5000 + Math.random() * 3000,
            drift: 3 + Math.random() * 4,
            size: 1 + Math.random(),
          });
      ctx.clearRect(0, 0, w, h);
      puffs = puffs.filter((p) => now - p.born < p.life);
      for (const p of puffs) {
        const t = (now - p.born) / p.life;
        const y = p.y - t * 26;
        const x = p.x + t * p.drift + Math.sin(t * 6 + p.x) * 1.2;
        const r = Math.round(p.size + t * 3);
        const a = (1 - t) * 0.55 * (t < 0.15 ? t / 0.15 : 1);
        ctx.fillStyle = `rgba(205,205,215,${a})`;
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++)
            if (dx * dx + dy * dy <= r * r + (r > 1 ? 1 : 0))
              ctx.fillRect(Math.round(x) + dx, Math.round(y) + dy, 1, 1);
      }
      frame = requestAnimationFrame(draw);
    };
    // The load event may already have fired; run the loop regardless and let
    // layout pick up the dimensions when they exist.
    layout();
    image.addEventListener("load", layout);
    const observer = new ResizeObserver(layout);
    observer.observe(image);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      image.removeEventListener("load", layout);
      observer.disconnect();
    };
  }, [img, emitters]);
  return <canvas ref={ref} className="banner-smoke" aria-hidden="true" />;
}
