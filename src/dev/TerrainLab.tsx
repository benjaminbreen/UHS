import { ProceduralLab } from "./terrain/ProceduralLab";
import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { TerrainScene, type StudyStatus } from "./terrain/TerrainScene";
import type { TerrainStudy } from "./terrain/fixture";
import "./terrain-lab.css";

export function FixedTerrainLab() {
  const [study, setStudy] = useState<TerrainStudy>(() =>
    new URLSearchParams(location.search).get("study") === "contours"
      ? "contours"
      : "meadow",
  );
  const [debug, setDebug] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<StudyStatus>();
  const mount = useRef<HTMLDivElement>(null);
  const scene = useRef<TerrainScene | undefined>(undefined);
  const game = useRef<Phaser.Game | undefined>(undefined);
  useEffect(() => {
    setReady(false);
    setDebug(false);
    history.replaceState(null, "", `/terrain-lab?study=${study}`);
    const host = mount.current!;
    const s = new TerrainScene(study, setStatus, () => setReady(true));
    scene.current = s;
    const g = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: host.clientWidth,
      height: host.clientHeight,
      backgroundColor: "#252d27",
      pixelArt: true,
      roundPixels: true,
      antialias: false,
      render: { preserveDrawingBuffer: true },
      scene: s,
      audio: { noAudio: true },
      banner: false,
    });
    game.current = g;
    const resize = new ResizeObserver(() =>
      g.scale.resize(host.clientWidth, host.clientHeight),
    );
    resize.observe(host);
    // Fixture-only diagnostics. No live runtime, storage, writer lock or player API.
    Object.assign(window, { terrainLab: { describe: () => s.describe() } });
    return () => {
      resize.disconnect();
      g.destroy(true);
      delete (window as unknown as { terrainLab?: unknown }).terrainLab;
    };
  }, [study]);
  const exportImage = () =>
    game.current?.renderer.snapshot((image) => {
      if (!(image instanceof HTMLImageElement)) return;
      const a = document.createElement("a");
      a.href = image.src;
      a.download = `uhs-terrain-${study}.png`;
      a.click();
    });
  return (
    <div className="terrain-lab">
      <header className="terrain-header">
        <div>
          <a href="/">Universal History Simulator</a>
          <h1>Terrain study</h1>
        </div>
        <span>01 / Ground, water & relief</span>
        <a href="/terrain-lab">Procedural explorer ↗</a>
      </header>
      <div className="terrain-layout">
        <aside className="terrain-controls">
          <div className="terrain-eyebrow">Landscape studies</div>
          <label>
            Scene
            <select
              aria-label="Terrain scene"
              value={study}
              onChange={(e) => setStudy(e.target.value as TerrainStudy)}
            >
              <option value="meadow">River meadow</option>
              <option value="contours">Slopes & corners</option>
            </select>
          </label>
          <p>
            {study === "meadow"
              ? "A river, damp margins and sunlit terraces. A composed landscape for reviewing the new terrain vocabulary."
              : "Four height tiers, slopes in every direction, inward corners and exposed ledges."}
          </p>
          <div className="terrain-rule" />
          <div className="terrain-eyebrow">Explore on foot</div>
          <p>
            Click the ground to walk there. Use <kbd>WASD</kbd> or arrow keys
            for individual steps. Ledges block movement; earth slopes connect
            levels. Drag to pan; scroll to zoom.
          </p>
          <div className="terrain-stops">
            {Object.entries(scene.current?.fixture.stops ?? {}).map(
              ([label, p]) => (
                <button
                  key={label}
                  disabled={!ready}
                  onClick={(e) => {
                    scene.current?.walkTo(p);
                    e.currentTarget.blur();
                  }}
                >
                  {label}
                  <span>→</span>
                </button>
              ),
            )}
          </div>
          <button
            disabled={!ready}
            onClick={(e) => {
              scene.current?.reset();
              e.currentTarget.blur();
            }}
          >
            Return to start
          </button>
          <div className="terrain-rule" />
          <label className="terrain-check">
            <input
              type="checkbox"
              checked={debug}
              onChange={(e) => {
                setDebug(e.target.checked);
                scene.current?.setDebug(e.target.checked);
                e.currentTarget.blur();
              }}
            />
            Show height grid
          </label>
          <button disabled={!ready} onClick={exportImage}>
            Export scene PNG
          </button>
          <a href="/topography/atlas.png" target="_blank" rel="noreferrer">
            Open terrain atlas ↗
          </a>
          <div className="terrain-swatches" aria-label="Terrain palette">
            <i style={{ background: "#456e46" }} />
            <i style={{ background: "#788f42" }} />
            <i style={{ background: "#a6a45c" }} />
            <i style={{ background: "#ba9459" }} />
            <i style={{ background: "#197e99" }} />
          </div>
          <p className="terrain-caption">
            24 terrain colors · 16 px tiles
            <br />
            Fixed review fixture. Procedural landforms follow in stage 2.
          </p>
        </aside>
        <main className="terrain-main">
          <div
            ref={mount}
            className="terrain-canvas"
            data-testid="terrain-canvas"
            data-ready={ready}
          />
          <div className="terrain-status" role="status">
            <span>{status?.message ?? "Loading terrain…"}</span>
            <strong data-testid="terrain-position">
              {status
                ? `Tier ${status.height} · ${status.surface} · ${status.x}, ${status.y}`
                : ""}
            </strong>
          </div>
        </main>
      </div>
    </div>
  );
}

export function TerrainLab() {
  return new URLSearchParams(location.search).has("study") ? (
    <FixedTerrainLab />
  ) : (
    <ProceduralLab />
  );
}
