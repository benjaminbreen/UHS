import { useEffect, useState } from "react";

type Sample = {
  fps: number;
  low: number;
  frame: number;
  chunks: string;
  install: string;
};

/** Frame timing readout for the live render-tuning panel. */
export function FpsMeter() {
  const [sample, setSample] = useState<Sample>({
    fps: 0,
    low: 0,
    frame: 0,
    chunks: "-",
    install: "-",
  });
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const frames: number[] = [];
    let reported = last;
    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      frames.push(delta);
      if (frames.length > 600) frames.shift();
      if (now - reported > 400) {
        reported = now;
        const recent = frames.slice(-120);
        const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
        // The worst frame in the window matters more than the average: a
        // hitch on a chunk install is what a smooth average hides.
        const worst = Math.max(...recent);
        const canvas = document.querySelector(
          ".game-container canvas",
        ) as HTMLCanvasElement | null;
        setSample({
          fps: Math.round(1000 / mean),
          low: Math.round(1000 / worst),
          frame: Math.round(mean * 10) / 10,
          chunks: canvas?.dataset.terrainChunkCount ?? "-",
          install: canvas?.dataset.terrainInstallMaxMs ?? "-",
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="fps-meter" data-testid="fps-meter">
      <strong>{sample.fps} fps</strong>
      <span>{sample.frame} ms/frame</span>
      <span>{sample.low} fps worst</span>
      <span>
        {sample.chunks} chunks · {sample.install} ms install
      </span>
    </div>
  );
}
