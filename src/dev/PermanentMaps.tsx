import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { travelLocations } from "../content/geography/travel";
import { mapForCoordinate, type PermanentMap, type MapExit } from "../world/travel/network";
const LiveGame = lazy(() => import("../ui/App").then((m) => ({ default: m.App })));
const Preview = lazy(() => import("./GeographyPreview"));
export default function PermanentMaps({ year }: { year: number }) {
  const [playing, setPlaying] = useState<import("../runtime/session").Runtime>();
  const launchAbort = useRef<AbortController>(undefined);
  const worker = useRef<Worker>(undefined),
    request = useRef(0);
  const [id, setId] = useState(() => mapForCoordinate({ lon: -0.12, lat: 51.5 })),
    [map, setMap] = useState<PermanentMap>(),
    [exits, setExits] = useState<MapExit[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState(false);
  const load = (next: string, exit?: MapExit) => {
    setBusy(true);
    setError("");
    setPreview(false);
    worker.current?.postMessage({
      request: ++request.current,
      id: next,
      year,
      exit,
    });
  };
  useEffect(() => {
    const w = new Worker(
      new URL("../world/travel/network-worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.current = w;
    w.onmessage = ({ data }) => {
      if (data.request !== request.current) return;
      setBusy(false);
      if (data.error) {
        setError(data.error);
        return;
      }
      setMap(data.map);
      setId(data.map.networkId);
      setExits(data.exits);
    };
    load(id);
    return () => w.terminate();
  }, [year]);
  useEffect(() => () => {
    launchAbort.current?.abort();
    playing?.dispose();
    if ((window as any).__uhs === playing) delete (window as any).__uhs;
  }, [playing]);
  const play = async () => {
    setBusy(true); setError("");
    const abort = new AbortController(); launchAbort.current = abort;
    try {
      const { MapTravel, prepareTravelMap } = await import("../runtime/map-travel");
      const { Runtime } = await import("../runtime/session");
      const runtime = new Runtime(await prepareTravelMap(id, year, abort.signal));
      new MapTravel(runtime, id, year);
      runtime.zoom = 1; runtime.emit();
      (window as any).__uhs = runtime;
      setPlaying(runtime);
    } catch (e) { if (!abort.signal.aborted) setError(String(e)); }
    finally { setBusy(false); }
  };
  if (playing) return <div className="geo-live-game">
    <button onClick={() => { const current = playing.journey?.id ?? id; setPlaying(undefined); load(current); }}>Back to geography panel</button>
    <Suspense fallback={<p>Opening game…</p>}><LiveGame runtime={playing} writer={true} /></Suspense>
  </div>;
  return (
    <section className="geo-permanent">
      <h2>Permanent maps</h2>
      <p>
        Explore the same map network without choosing a destination. Each map
        is a square of the atlas, and neighbours share their borders.
      </p>
      <label>
        Start at a place{" "}
        <select
          aria-label="Permanent map place"
          value=""
          onChange={(e) => {
            const p = travelLocations.find((x) => x.id === e.target.value);
            if (p) load(mapForCoordinate(p));
          }}
        >
          <option value="" disabled>
            Landscape map
          </option>
          {travelLocations.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {busy && <p role="status">Preparing permanent connections…</p>}
      {error && <p role="alert">{error}</p>}
      {map && (
        <>
          <h3>{map.name}</h3>
          <p>
            <code>{map.networkId}</code> · {map.size} × {map.size} ·{" "}
            {map.environment.ecology}
          </p>
          <div className="geo-neighbors">
            {exits.map((exit) => (
              <button
                disabled={busy}
                key={exit.id}
                onClick={() => load(exit.to, exit)}
              >
                {exit.bearing} · {exit.name}
                <small>
                  {exit.mode === "land"
                    ? "Walking connection"
                    : "Boat required"}{" "}
                  · {Math.round(exit.km)} km direct
                </small>
              </button>
            ))}
          </div>
          {map.water && (
            <p>
              This ocean map has boat connections. Local sailing terrain is
              reserved for vessel gameplay.
            </p>
          )}
          <button
            disabled={busy || map.water || Math.abs(map.lat) > 85}
            onClick={() => setPreview(!preview)}
          >
            Generate bounded map
          </button>
          <button disabled={busy || map.water || Math.abs(map.lat) > 85} onClick={play}>Play connected maps</button>
          {preview && (
            <Suspense fallback={<p>Loading terrain…</p>}>
              <Preview stop={map} year={year} bounded exits={exits} />
            </Suspense>
          )}
        </>
      )}
    </section>
  );
}
