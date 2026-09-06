import { lightingPresets, lightingPreset } from "../render/lighting";
import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { WorldScene } from "../render/WorldScene";
import { buildingModels } from "../render/buildings";
import {
  createLabRuntime,
  labURL,
  parseLabConfig,
  studies,
  type LabConfig,
  type Study,
} from "./fixtures";
import "./graphics-lab.css";

export function GraphicsLab() {
  const [config, setConfig] = useState(() => parseLabConfig(location.search));
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const mount = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | undefined>(undefined);
  const update = (patch: Partial<LabConfig>) => {
    setReady(false);
    setConfig((c) => ({ ...c, ...patch }));
  };
  useEffect(() => {
    const onPop = () => {
      setConfig(parseLabConfig(location.search));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    history.replaceState(null, "", labURL(config));
    const host = mount.current!;
    const runtime = createLabRuntime(config);
    const scene = new WorldScene(runtime, {
      onReady: () => setReady(true),
      lab: true,
      debug: config.debug,
      freeze: config.freeze,
      shadows: config.shadows,
      lighting: config.lighting,
      colorGrade: config.colorGrade,
    });
    const g = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      pixelArt: true,
      roundPixels: true,
      antialias: false,
      render: { preserveDrawingBuffer: true },
      width: host.clientWidth,
      height: host.clientHeight,
      scene,
      audio: { noAudio: true },
      banner: false,
    });
    game.current = g;
    const observer = new ResizeObserver(() =>
      g.scale.resize(host.clientWidth, host.clientHeight),
    );
    observer.observe(host);
    const description = {
      config,
      renderer: "WorldScene",
      lighting: lightingPreset(config.lighting),
      models: runtime.engine.world.places.map((p) => ({
        id: p.id,
        model: buildingModels[p.sprite],
      })),
    };
    Object.assign(window, {
      graphicsLab: {
        describe: () => ({
          ...description,
          renderedShadowFrames: [
            ...new Set(
              (scene.children?.list ?? [])
                .filter(
                  (o): o is Phaser.GameObjects.Image =>
                    o instanceof Phaser.GameObjects.Image &&
                    o.texture.key === "lighting-shadows",
                )
                .map((o) => o.frame.name),
            ),
          ],
        }),
      },
    });
    return () => {
      observer.disconnect();
      g.destroy(true);
      runtime.dispose();
      delete (window as unknown as { graphicsLab?: unknown }).graphicsLab;
    };
  }, [config]);
  const exportPNG = () => {
    if (!game.current || !ready) return;
    game.current.renderer.snapshot((result) => {
      if (!(result instanceof HTMLImageElement)) return;
      const a = document.createElement("a");
      a.href = result.src;
      a.download = `uhs-${config.study}-${config.scene}-${config.lighting}-${config.zoom}x.png`;
      a.click();
    });
  };
  const modelIds = studies[config.study].buildings;
  return (
    <div className="graphics-lab">
      <header className="lab-header">
        <div>
          <a href="/">Universal History Simulator</a>
          <h1>Graphics lab</h1>
        </div>
        <span>Isolated fixtures · your journey stays saved</span>
        <a href="/history-lab">History & content lab →</a>
        <button className="action" onClick={() => window.dispatchEvent(new Event("uhs-open-props"))}>Prop gallery · ⌘2</button>
        <a className="action" href="/">
          Return to world →
        </a>
      </header>
      <div className="lab-body">
        <aside className="lab-controls" aria-label="Graphics controls">
          <label>
            Construction family
            <select
              value={config.study}
              onChange={(e) => update({ study: e.target.value as Study })}
            >
              {Object.entries(studies).map(([id, s]) => (
                <option key={id} value={id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <p className="lab-note">{studies[config.study].note}</p>
          <label>
            Test scene
            <select
              value={config.scene}
              onChange={(e) =>
                update({ scene: e.target.value as LabConfig["scene"] })
              }
            >
              <option value="board">Construction court</option>
              <option value="settlement">Generated settlement</option>
            </select>
          </label>
          <label>
            Landscape
            <select
              aria-label="Landscape"
              value={config.bank}
              onChange={(e) =>
                update({ bank: e.target.value as LabConfig["bank"] })
              }
            >
              <option value="masonry">Stone quay & paving</option>
              <option value="earth">Earth banks & footpaths</option>
            </select>
          </label>
          <label>
            Light treatment
            <select
              value={config.lighting}
              onChange={(e) =>
                update({ lighting: e.target.value as LabConfig["lighting"] })
              }
            >
              {lightingPresets.map((p, i) => (
                <option key={p.id} value={p.id}>
                  {p.label} · {String(p.start).padStart(2, "0")}:00–
                  {String(lightingPresets[(i + 1) % 6].start).padStart(2, "0")}
                  :00
                </option>
              ))}
            </select>
          </label>
          <div className="lab-control-pair">
            <label>
              Pixel scale
              <select
                value={config.zoom}
                onChange={(e) => update({ zoom: Number(e.target.value) })}
              >
                {[1, 2, 3, 4].map((v) => (
                  <option key={v} value={v}>
                    {v}×
                  </option>
                ))}
              </select>
            </label>
            <label>
              Frame
              <select
                aria-label="Frame"
                value={config.format}
                onChange={(e) =>
                  update({ format: e.target.value as LabConfig["format"] })
                }
              >
                <option value="wide">Wide</option>
                <option value="square">Square</option>
                <option value="portrait">Portrait</option>
              </select>
            </label>
          </div>
          <label>
            Fixture seed
            <input
              value={config.seed}
              maxLength={100}
              onChange={(e) =>
                update({ seed: e.target.value || "graphics-01" })
              }
            />
          </label>
          <label className="lab-check">
            <input
              type="checkbox"
              checked={config.debug}
              onChange={(e) => update({ debug: e.target.checked })}
            />
            Show footprints & anchors
          </label>
          <label className="lab-check">
            <input
              type="checkbox"
              checked={config.shadows}
              onChange={(e) => update({ shadows: e.target.checked })}
            />
            Cast & contact shadows
          </label>
          <label className="lab-check">
            <input
              type="checkbox"
              checked={config.colorGrade}
              onChange={(e) => update({ colorGrade: e.target.checked })}
            />
            Time-of-day colors
          </label>
          <label className="lab-check">
            <input
              type="checkbox"
              checked={config.freeze}
              onChange={(e) => update({ freeze: e.target.checked })}
            />
            Freeze water animation
          </label>
          <div className="lab-buttons">
            <button className="action" disabled={!ready} onClick={exportPNG}>
              Save PNG
            </button>
            <button
              className="action"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(location.href);
                  setMessage("Fixture link copied.");
                } catch {
                  setMessage(
                    "The address bar contains the complete fixture link.",
                  );
                }
              }}
            >
              Copy link
            </button>
          </div>
          <p role="status" className="lab-note">
            {message || "Use the same seed and link to reproduce a comparison."}
          </p>
          <details>
            <summary>Rendering contract</summary>
            <p className="lab-note">
              Cyan: collision footprint. Gold: entrance. Pink: visual bounds.
              World sprites and this lab use the same compiled recipes, anchors,
              material transitions and depth ordering.
            </p>
            <p className="lab-note">
              Six local-time presets change shadow direction, length and color.
              The generated settlement preserves the playable generator’s
              geometry; the court deliberately tests a more varied river
              contour.
            </p>
          </details>
        </aside>
        <main className="lab-review">
          <div className="lab-stage" data-format={config.format}>
            <div
              className="lab-canvas"
              ref={mount}
              data-testid="lab-canvas"
              data-ready={ready}
            />
          </div>
          <div className="lab-caption">
            <span>
              {studies[config.study].label}{" "}
              <small>
                · {config.zoom}× · {ready ? "ready" : "loading"}
              </small>
            </span>
            <nav aria-label="Pan preview">
              {[
                ["←", -6, 0],
                ["↑", 0, -6],
                ["↓", 0, 6],
                ["→", 6, 0],
              ].map(([label, x, y]) => (
                <button
                  key={label}
                  aria-label={`Pan ${label}`}
                  onClick={() => {
                    setReady(false);
                    setConfig((c) => ({
                      ...c,
                      panX: Math.max(-100, Math.min(100, c.panX + Number(x))),
                      panY: Math.max(-100, Math.min(100, c.panY + Number(y))),
                    }));
                  }}
                >
                  {label}
                </button>
              ))}
              <button onClick={() => update({ panX: 0, panY: 0 })}>
                Center
              </button>
            </nav>
          </div>
          <div className="lab-models">
            {modelIds.map((id) => {
              const m = buildingModels[id];
              return (
                <article key={id}>
                  <strong>{m.label}</strong>
                  <span>
                    {m.wall} · {m.roof} · {m.roofMaterial}
                  </span>
                  <small>
                    {m.footprint.join(" × ")} cells ·{" "}
                    {m.attachments.join(", ") || "plain facade"}
                  </small>
                </article>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
