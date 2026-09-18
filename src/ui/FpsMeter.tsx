import { useEffect, useState } from "react";
import {
  HITCH_MS,
  frameTick,
  resetProfile,
  sampleProfile,
  setProfiling,
  type FrameBreakdown,
} from "../render/perf-switches";
import { engineFps } from "../render/frame-cap";

type Sample = {
  fps: number;
  engine: number;
  frame: number;
  low: number;
  chunks: string;
  install: string;
  hitches: number;
  sinceHitch: number;
  log: FrameBreakdown[];
  history: number[];
  scenery: number;
  sceneryAgo: number;
  sceneryCount: number;
  mapBuilds: string;
};

const EMPTY: Sample = {
  fps: 0,
  engine: 0,
  frame: 0,
  low: 0,
  chunks: "-",
  install: "-",
  hitches: 0,
  sinceHitch: 0,
  log: [],
  history: [],
  scenery: 0,
  sceneryAgo: 0,
  sceneryCount: 0,
  mapBuilds: "-",
};

/** Frame timing readout for the live render-tuning panel. */
export function FpsMeter() {
  const [sample, setSample] = useState<Sample>(EMPTY);
  useEffect(() => {
    setProfiling(true);
    let raf = 0;
    let reported = performance.now();
    let frames = 0;
    const history: number[] = [];
    const tick = (now: number) => {
      frameTick(now);
      frames++;
      if (now - reported > 400) {
        const elapsed = now - reported;
        reported = now;
        const profile = sampleProfile(now);
        // Each bar is the worst frame since the previous bar. Sampling a
        // trailing window instead would smear one hitch across five bars.
        history.push(profile.worst);
        if (history.length > 40) history.shift();
        const canvas = document.querySelector(
          ".game-container canvas",
        ) as HTMLCanvasElement | null;
        setSample({
          fps: Math.round((frames / elapsed) * 1000),
          engine: engineFps(),
          frame: Math.round((elapsed / frames) * 10) / 10,
          low: Math.round(profile.worst * 10) / 10,
          chunks: canvas?.dataset.terrainChunkCount ?? "-",
          install: canvas?.dataset.terrainInstallMaxMs ?? "-",
          hitches: profile.hitches,
          sinceHitch: Math.round(profile.sinceHitch / 100) / 10,
          log: [...profile.log],
          history: [...history],
          scenery: Number(canvas?.dataset.sceneryDrawMs ?? 0),
          sceneryAgo: canvas?.dataset.sceneryDrawAt
            ? Math.round((now - Number(canvas.dataset.sceneryDrawAt)) / 100) /
              10
            : 0,
          sceneryCount: Number(canvas?.dataset.sceneryDrawCount ?? 0),
          mapBuilds:
            (
              document.querySelector(
                "canvas[data-map-builds]",
              ) as HTMLCanvasElement | null
            )?.dataset.mapBuilds ?? "-",
        });
        frames = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setProfiling(false);
    };
  }, []);
  const peak = Math.max(33, ...sample.history);
  return (
    <div className="fps-meter" data-testid="fps-meter">
      <div className="fps-meter-top">
        <strong>{sample.fps} fps</strong>
        <span>{sample.engine} engine</span>
        <span>{sample.frame} ms/frame</span>
        <span data-warn={sample.low >= HITCH_MS || undefined}>
          {sample.low} ms worst
        </span>
      </div>
      <div
        className="fps-spark"
        aria-label={`Worst frame per 400 ms, peak ${Math.round(peak)} ms`}
      >
        {sample.history.map((ms, i) => (
          <i
            key={i}
            style={{ height: `${Math.min(100, (ms / peak) * 100)}%` }}
            data-hitch={ms >= HITCH_MS || undefined}
          />
        ))}
      </div>
      <div className="fps-meter-rows">
        <span>
          {sample.hitches} hitch{sample.hitches === 1 ? "" : "es"} / 10s (&gt;
          {HITCH_MS} ms) · {sample.sinceHitch}s since last
        </span>
        <span>
          {sample.chunks} chunks · {sample.install} ms install
        </span>
        <span data-warn={sample.scenery >= HITCH_MS || undefined}>
          scenery rebuild {sample.scenery} ms · {sample.sceneryAgo}s ago ·{" "}
          {sample.sceneryCount} total
        </span>
        <span>{sample.mapBuilds} minimap rebuilds</span>
      </div>
      <details className="fps-worst">
        <summary>
          Last hitches
          <button
            onClick={() => {
              resetProfile();
              setSample((s) => ({ ...s, log: [] }));
            }}
          >
            reset
          </button>
        </summary>
        {!sample.log.length && <p>none yet</p>}
        {sample.log.map((hitch) => (
          <div key={hitch.at} className="fps-hitch">
            <b>
              {hitch.total.toFixed(1)} ms
              <em>
                {hitch.gap ? `+${(hitch.gap / 1000).toFixed(1)}s` : "first"}
              </em>
            </b>
            <ul>
              {hitch.sections.map(([name, ms]) => (
                <li key={name}>
                  <span>{name}</span>
                  <em>{ms.toFixed(1)}</em>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </details>
    </div>
  );
}
