import { useEffect, useRef } from "react";

/** Pixel stars that fade in one by one, with an occasional shooting star. */
export function SplashStars() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const scale = 3; // one drawn pixel = 3 screen pixels
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    type Star = {
      x: number;
      y: number;
      /** 0 = dot, 1 = cross, 2 = long cross, 3 = eight-point */
      size: number;
      color: string;
      born: number;
      rise: number;
      phase: number;
    };
    const gold = "233,199,133";
    const tints = [
      gold,
      "255,242,204",
      "196,214,255",
      "246,205,205",
      "204,236,222",
    ];
    let stars: Star[] = [];
    let w = 0,
      h = 0;
    let shooting: {
      x: number;
      y: number;
      t: number;
      dx: number;
      dy: number;
    } | null = null;
    let nextShot = 0;
    const seed = (now: number) => {
      const count = Math.round((w * h) / 15000);
      stars = Array.from({ length: count }, (_, i) => ({
        x: Math.floor(Math.random() * w),
        y: Math.floor(Math.random() * h * 0.62),
        size: Math.random() < 0.22 ? 1 : 0,
        color: gold,
        born: now + (still ? 0 : (i / count) * 24000 + Math.random() * 3000),
        rise: 2500 + Math.random() * 5000,
        phase: Math.random() * Math.PI * 2,
      }));
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width / scale));
      h = Math.max(1, Math.floor(rect.height / scale));
      canvas.width = w;
      canvas.height = h;
      seed(performance.now());
    };
    const px = (x: number, y: number, a: number, c = "233,199,133") => {
      ctx.fillStyle = `rgba(${c},${a})`;
      ctx.fillRect(x, y, 1, 1);
    };
    const drawStar = (s: Star, now: number) => {
      const age = now - s.born;
      if (age < 0) return;
      const fade = Math.min(1, age / s.rise);
      const twinkle = still ? 1 : 0.75 + 0.25 * Math.sin(now / 900 + s.phase);
      const a = fade * twinkle;
      if (s.size === 0) return px(s.x, s.y, a * 0.8, s.color);
      px(s.x, s.y, a, "255,250,235");
      const arm = s.size === 1 ? 2 : s.size === 2 ? 3 : 4;
      for (let i = 1; i <= arm; i++) {
        const k = a * (1 - (i - 0.5) / arm);
        px(s.x + i, s.y, k, s.color);
        px(s.x - i, s.y, k, s.color);
        px(s.x, s.y + i, k, s.color);
        px(s.x, s.y - i, k, s.color);
      }
      if (s.size === 3)
        for (const [dx, dy] of [
          [1, 1],
          [-1, 1],
          [1, -1],
          [-1, -1],
        ])
          px(s.x + dx, s.y + dy, a * 0.45, s.color);
    };
    let frame = 0;
    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) drawStar(s, now);
      if (!still) {
        if (!shooting && now > nextShot) {
          const fromLeft = Math.random() < 0.5;
          shooting = {
            x: fromLeft
              ? Math.random() * w * 0.4
              : w * 0.6 + Math.random() * w * 0.4,
            y: Math.random() * h * 0.25,
            t: now,
            dx: fromLeft ? 1 : -1,
            dy: 0.45,
          };
        }
        if (shooting) {
          const age = (now - shooting.t) / 1000;
          const speed = 55; // drawn pixels per second
          const head = {
            x: shooting.x + shooting.dx * speed * age,
            y: shooting.y + shooting.dy * speed * age,
          };
          const life = 1.1;
          const a = Math.max(0, 1 - age / life);
          for (let i = 0; i < 9; i++) {
            const k = i / 9;
            px(
              Math.round(head.x - shooting.dx * i * 1.2),
              Math.round(head.y - shooting.dy * i * 1.2),
              a * (1 - k) * (i === 0 ? 1 : 0.7),
              i === 0 ? "255,242,204" : "233,199,133",
            );
          }
          if (age > life) {
            shooting = null;
            nextShot = now + 9000 + Math.random() * 16000;
          }
        }
      }
      frame = still ? 0 : requestAnimationFrame(draw);
    };
    // Easter egg: a click on empty sky adds a star of random size and tint.
    const host = canvas.parentElement!;
    const place = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(
          "button, input, a, select, label, img, .splash-more-panel, .modal-backdrop",
        )
      )
        return;
      const rect = canvas.getBoundingClientRect();
      const roll = Math.random();
      stars.push({
        x: Math.floor((e.clientX - rect.left) / scale),
        y: Math.floor((e.clientY - rect.top) / scale),
        size: roll < 0.3 ? 0 : roll < 0.7 ? 1 : roll < 0.9 ? 2 : 3,
        color: tints[Math.floor(Math.random() * tints.length)],
        born: performance.now(),
        rise: 1200,
        phase: Math.random() * Math.PI * 2,
      });
      if (still) draw(performance.now());
    };
    host.addEventListener("click", place);
    resize();
    nextShot = performance.now() + 6000 + Math.random() * 8000;
    const observer = new ResizeObserver(() => {
      resize();
      if (still) draw(performance.now());
    });
    observer.observe(canvas);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("click", place);
    };
  }, []);
  return <canvas ref={ref} className="splash-stars" aria-hidden="true" />;
}
