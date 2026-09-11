import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { WorldScene } from "../render/WorldScene";
import type { RenderOptions } from "../render/appearance";
import { Runtime } from "../runtime/session";
import { prepareSettingSession } from "../runtime/preparation";
import { settingForTravelStop } from "../world/travel/environment";
import type { TravelStop } from "../world/travel/types";
export default function GeographyPreview({
  stop,
  year,
  bounded = false,
  exits = [],
}: {
  stop: TravelStop;
  year: number;
  bounded?: boolean;
  exits?: import("../world/travel/network").MapExit[];
}) {
  const [entrances, setEntrances] = useState<import("../world/travel/entrances").MapEntrance[]>([]);
  const entranceRef = useRef<import("../world/travel/entrances").MapEntrance[]>([]);
  const mount = useRef<HTMLDivElement>(null),
    sceneRef = useRef<WorldScene>(undefined),
    runtimeRef = useRef<Runtime>(undefined);
  const [status, setStatus] = useState(
      "Preparing with the existing world generator…",
    ),
    [size, setSize] = useState(stop.size);
  const overlay = useRef<Phaser.GameObjects.Graphics>(undefined),
    center = useRef({ x: 0, y: 0 });
  const paintBounds = (width: number) => {
    const g = overlay.current;
    if (!g) return;
    g.clear();
    if (bounded) {
      const h = width * 8, extent = 100000;
      g.fillStyle(0x101c20, 1);
      g.fillRect(-extent, -extent, extent * 2, extent - h);
      g.fillRect(-extent, h, extent * 2, extent - h);
      g.fillRect(-extent, -h, extent - h, h * 2);
      g.fillRect(h, -h, extent - h, h * 2);
    }
    for (const entry of entranceRef.current) if (entry.point) {
      g.fillStyle(entry.shore ? 0x64c3d4 : 0xf0ca82);
      g.fillCircle(entry.point.x * 16, entry.point.y * 16, 24);
    }
    g.lineStyle(3 / (runtimeRef.current?.zoom ?? 1), 0xf0ca82, 1);
    g.strokeRect(
      (center.current.x - width / 2) * 16,
      (center.current.y - width / 2) * 16,
      width * 16,
      width * 16,
    );
  };
  useEffect(() => {
    paintBounds(size);
  }, [size]);
  useEffect(() => {
    const abort = new AbortController();
    let game: Phaser.Game | undefined,
      runtime: Runtime | undefined,
      resize: ResizeObserver | undefined;
    const setting = settingForTravelStop(stop, year);
    if (bounded) {
      setting.playableMap = { id: ("networkId" in stop ? String(stop.networkId) : stop.id), size: stop.size === 512 ? 512 : 384, exits: exits.map(({id, to, bearing, mode}) => ({id, to, bearing, mode})) };
      setting.environment!.population = stop.settlement === "city" || stop.settlement === "town" ? "settled" : "none";
      setting.environment!.start = "wanderer";
    }
    prepareSettingSession(setting, "travel-review:" + ("networkId" in stop ? String(stop.networkId) : stop.id), abort.signal)
      .then((engine) => {
        runtime = new Runtime(engine);
        if (abort.signal.aborted) {
          runtime.dispose();
          return;
        }
        if (bounded) {
          const entries = (engine.world as import("../world/v3/generate").SettlementWorld).entrances();
          entranceRef.current = entries; setEntrances(entries);
        }
        runtimeRef.current = runtime;
        const host = mount.current!;
        center.current = bounded ? { x: 0, y: 0 } : { ...engine.state.player.pos };
        runtime.zoom = 0.5;
        const options: RenderOptions = {
          lab: true,
          overview: true,
          center: center.current,
          freeze: true,
          waterAnimation: true,
        };
        const scene = new WorldScene(runtime, options);
        sceneRef.current = scene;
        options.onReady = () => {
          scene.cameras.main.stopFollow();
          scene.cameras.main.centerOn(
            center.current.x * 16,
            center.current.y * 16,
          );
          overlay.current = scene.add.graphics().setDepth(1000000);
          paintBounds(size);
          setStatus(
            "Existing generator and renderer · gold outline shows proposed bounds",
          );
          let drag:
            | { x: number; y: number; sx: number; sy: number }
            | undefined;
          scene.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
            drag = {
              x: p.x,
              y: p.y,
              sx: scene.cameras.main.scrollX,
              sy: scene.cameras.main.scrollY,
            };
          });
          scene.input.on("pointermove", (p: Phaser.Input.Pointer) => {
            if (drag && p.isDown)
              scene.cameras.main.setScroll(
                drag.sx - (p.x - drag.x) / scene.cameras.main.zoom,
                drag.sy - (p.y - drag.y) / scene.cameras.main.zoom,
              );
          });
          scene.input.on("pointerup", () => {
            drag = undefined;
            options.center = {
              x: Math.round(scene.cameras.main.midPoint.x / 16),
              y: Math.round(scene.cameras.main.midPoint.y / 16),
            };
            scene.draw();
          });
        };
        game = new Phaser.Game({
          type: Phaser.AUTO,
          parent: host,
          width: host.clientWidth,
          height: host.clientHeight,
          pixelArt: true,
          roundPixels: true,
          antialias: false,
          backgroundColor: "#26342e",
          scene,
          audio: { noAudio: true },
          banner: false,
          render: { preserveDrawingBuffer: true },
        });
        resize = new ResizeObserver(() =>
          game?.scale.resize(host.clientWidth, host.clientHeight),
        );
        resize.observe(host);
      })
      .catch((e) => {
        if (!abort.signal.aborted)
          setStatus(`Preview unavailable: ${String(e)}`);
      });
    return () => {
      abort.abort();
      resize?.disconnect();
      game?.destroy(true);
      runtime?.dispose();
      overlay.current = undefined;
      sceneRef.current = undefined;
      runtimeRef.current = undefined;
    };
  }, [stop.id, year, bounded]);
  const zoom = (delta: number) => {
    const rt = runtimeRef.current;
    if (!rt) return;
    rt.zoom = Math.max(0.125, Math.min(2, rt.zoom + delta));
    sceneRef.current?.draw();
    paintBounds(size);
  };
  return (
    <section className="geo-preview">
      <h2>{stop.name}</h2>
      <p>{status}</p>
      <div className="geo-preview-controls">
        <label>
          Boundary size
          <select
            aria-label="Boundary size"
            disabled={bounded}
            value={size}
            onChange={(e) => setSize(+e.target.value)}
          >
            <option value={384}>Small · 384 tiles · 54 sec</option>
            <option value={512}>Medium · 512 tiles · 72 sec</option>

          </select>
        </label>
        <button onClick={() => zoom(-0.125)}>Zoom out</button>
        <button onClick={() => zoom(0.125)}>Zoom in</button>
        <button
          onClick={() => {
            const rt = runtimeRef.current,
              scene = sceneRef.current;
            if (!rt || !scene || !mount.current) return;
            rt.zoom =
              Math.min(mount.current.clientWidth, mount.current.clientHeight) /
              (size * 16 * 1.15);
            scene.cameras.main.centerOn(
              center.current.x * 16,
              center.current.y * 16,
            );
            scene.draw();
            paintBounds(size);
          }}
        >
          Fit bounds
        </button>
      </div>
      <div ref={mount} className="geo-preview-canvas" />
      {bounded && <ul>{entrances.map((e) => <li key={e.id}>{e.bearing} · {exits.find((x) => x.id === e.id)?.name} · {e.point ? (e.shore ? "Reachable shore landing" : "Reachable boundary entrance") : "No reachable entrance — terrain blocks this connection"} · {e.path.length} steps</li>)}</ul>}
      <small>
        {bounded ? "Bounded generation. Live crossing is the next stage." : "Drag to look around. Bounds are a review overlay, not movement barriers."}
        {bounded ? "Entrances are checked against the generated terrain; gold marks walking exits and blue marks shore access." : "Existing generation still controls local settlement placement; the proposed travel population and exits are not applied here."}
      </small>
    </section>
  );
}
