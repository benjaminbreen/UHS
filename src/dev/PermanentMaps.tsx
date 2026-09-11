import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { travelLocations } from "../content/geography/travel";
import type { PermanentMap, MapExit } from "../world/travel/network";
const Preview = lazy(() => import("./GeographyPreview"));
export default function PermanentMaps({ year }: { year: number }) {
  const worker = useRef<Worker>(undefined),
    request = useRef(0);
  const [id, setId] = useState("place:london"),
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
  return (
    <section className="geo-permanent">
      <h2>Permanent maps</h2>
      <p>
        Explore the same map network without choosing a destination. Small maps
        are standard; dated cities use medium.
      </p>
      <label>
        Start at a place{" "}
        <select
          aria-label="Permanent map place"
          value={id.startsWith("place:") ? id : ""}
          onChange={(e) => load(e.target.value)}
        >
          <option value="" disabled>
            Landscape map
          </option>
          {travelLocations.map((p) => (
            <option key={p.id} value={"place:" + p.id}>
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
