import type { NamingAudit } from "../world/travel/naming-audit";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { cellToBoundary } from "h3-js";
import {
  travelById,
  travelLocations,
  travelPresets,
} from "../content/geography/travel";
import { atlasLand } from "../world/geography/atlas";
import {
  bearingTo,
  describeCell,
  kilometers,
  neighborsOf,
  wrapLon,
} from "../world/travel/geography";
import { edgeOpen } from "../world/travel/routing";
import type { TravelQuery, TravelResult } from "../world/travel/types";
import "./geography-lab.css";
import { formatHistoricalYear } from "../core/calendar";
const LocalPreview = lazy(() => import("./GeographyPreview"));
const sortedLocations = [...travelLocations].sort((a, b) =>
  a.name.localeCompare(b.name),
);
const colors: Record<string, string> = {
  Arid: "#cfb17c",
  Mediterranean: "#a2b98a",
  Temperate: "#78a89c",
  Tropical: "#449580",
  Boreal: "#7f9aab",
  Tundra: "#c1ccd0",
  Ocean: "#5682ad",
};
type Bounds = { west: number; east: number; south: number; north: number };
function initialQuery(): TravelQuery {
  const q = new URLSearchParams(location.search),
    base =
      travelPresets[q.get("preset") as keyof typeof travelPresets] ??
      travelPresets.britain;
  return {
    from: q.get("from") ?? base.from,
    to: q.get("to") ?? base.to,
    via: q.has("via")
      ? q.get("via")!.split(",").filter(Boolean)
      : q.has("from") || q.has("to")
        ? []
        : [...base.via],
    year: q.has("year") ? Number(q.get("year")) : base.year,
    spacing: q.has("spacing") ? Number(q.get("spacing")) : base.spacing,
    mode:
      q.get("mode") === "sea"
        ? "sea"
        : q.get("mode") === "land"
          ? "land"
          : "mixed",
  };
}
function fit(result: TravelResult): Bounds {
  const first = result.cells[0]?.lon ?? 0;
  const xs = result.cells.map((p) => first + wrapLon(p.lon - first)),
    ys = result.cells.map((p) => p.lat);
  const margin = Math.max(1, (Math.max(...xs) - Math.min(...xs)) * 0.07);
  return {
    west: Math.min(...xs) - margin,
    east: Math.max(...xs) + margin,
    south: Math.max(-90, Math.min(...ys) - margin),
    north: Math.min(90, Math.max(...ys) + margin),
  };
}
export function GeographyLab() {
  const [query, setQuery] = useState<TravelQuery>(initialQuery),
    [result, setResult] = useState<TravelResult>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true);
  const [selected, setSelected] = useState(0),
    [inspection, setInspection] = useState<string>(),
    [showCells, setShowCells] = useState(false),
    [preview, setPreview] = useState(false);
  const [bounds, setBounds] = useState<Bounds>({
    west: -9,
    east: 3,
    south: 49,
    north: 59,
  });
  const [viaText, setViaText] = useState(() =>
    query.via.map((id) => travelById.get(id)?.name ?? id).join(", "),
  );
  const [audit, setAudit] = useState<NamingAudit>();
  const [auditBusy, setAuditBusy] = useState(false);
  const [showCoverage, setShowCoverage] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const pending =
    !error && (busy || JSON.stringify(result?.query) !== JSON.stringify(query));
  const currentResult = !pending && !error ? result : undefined;
  const worker = useRef<Worker>(undefined),
    request = useRef(0),
    drag = useRef<{ x: number; y: number; bounds: Bounds }>(undefined);
  useEffect(() => {
    const w = new Worker(
      new URL("../world/travel/worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.current = w;
    w.onmessage = ({ data }) => {
      if (data.kind === "naming-audit") {
        setAuditBusy(false);
        if (data.error) setAuditError(data.error);
        else {
          setAudit(data.result);
          setShowCoverage(true);
          setBounds({ west: -180, east: 180, south: -85, north: 85 });
        }
        return;
      }
      if (data.id !== request.current) return;
      setBusy(false);
      if (data.error) {
        setResult(undefined);
        setError(data.error);
        return;
      }
      setError("");
      setResult(data.result);
      setSelected(0);
      setInspection(undefined);
      setBounds(fit(data.result));
    };
    w.onerror = (e) => {
      setBusy(false);
      setResult(undefined);
      setError(e.message);
    };
    return () => w.terminate();
  }, []);
  useEffect(() => {
    setBusy(true);
    setError("");
    setPreview(false);
    const id = ++request.current;
    const t = setTimeout(() => worker.current?.postMessage({ id, query }), 220);
    const q = new URLSearchParams({
      from: query.from,
      to: query.to,
      via: query.via.join(","),
      year: String(query.year),
      spacing: String(query.spacing),
      mode: query.mode,
    });
    history.replaceState(null, "", `/geography-lab?${q}`);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => {
    Object.assign(window, {
      geographyLab: {
        describe: () =>
          structuredClone({
            query,
            result,
            error,
            busy: pending,
            selected,
            inspection,
            audit,
          }),
      },
    });
    return () => {
      delete (window as unknown as Record<string, unknown>).geographyLab;
    };
  }, [query, result, error, pending, selected, inspection, audit]);
  const stop = result?.stops[selected],
    active = inspection ? describeCell(inspection, query.year) : stop;
  const adjacent = useMemo(
    () =>
      active
        ? neighborsOf(active.id).map((id) => ({
            ...describeCell(id, query.year),
            open: edgeOpen(active.id, id, query.mode),
          }))
        : [],
    [active?.id, query.year, query.mode],
  );
  const project = useMemo(() => {
    const mid = (bounds.west + bounds.east) / 2,
      cos = Math.max(
        0.2,
        Math.cos((((bounds.north + bounds.south) / 2) * Math.PI) / 180),
      );
    const width = (bounds.east - bounds.west) * cos,
      height = bounds.north - bounds.south,
      scale = Math.min(920 / width, 470 / height);
    return (lon: number, lat: number, wrap = true) => [
      500 + (wrap ? wrapLon(lon - mid) : lon - mid) * cos * scale,
      265 - (lat - (bounds.north + bounds.south) / 2) * scale,
    ];
  }, [bounds]);
  const polygonPaths = (ring: number[][]) => {
    const unwrapped: number[][] = [];
    for (const [lon, lat] of ring) {
      const previous = unwrapped.at(-1)?.[0] ?? lon;
      unwrapped.push([previous + wrapLon(lon - previous), lat]);
    }
    const mid = (bounds.west + bounds.east) / 2;
    const shift = 360 * Math.round((mid - unwrapped[0][0]) / 360);
    return [-360, 0, 360].map(
      (copy) =>
        unwrapped
          .map(
            ([lon, lat], i) =>
              `${i ? "L" : "M"}${project(lon + shift + copy, lat, false).join(",")}`,
          )
          .join("") + "Z",
    );
  };
  const landPaths = useMemo(() => atlasLand.flatMap(polygonPaths), [project]);
  const cellPath = (id: string) =>
    polygonPaths(cellToBoundary(id).map(([lat, lon]) => [lon, lat])).join("");
  const visibleCells = useMemo(
    () => [
      ...new Set([
        ...(result?.cells.map((c) => c.id) ?? []),
        ...adjacent.map((c) => c.id),
      ]),
    ],
    [result, adjacent],
  );
  const zoom = (factor: number) =>
    setBounds((b) => {
      const x = (b.west + b.east) / 2,
        y = (b.south + b.north) / 2,
        w = Math.min(360, (b.east - b.west) * factor) / 2,
        h = Math.min(180, (b.north - b.south) * factor) / 2;
      return {
        west: x - w,
        east: x + w,
        south: Math.max(-90, y - h),
        north: Math.min(90, y + h),
      };
    });
  const patch = (p: Partial<TravelQuery>) => setQuery((q) => ({ ...q, ...p }));
  const choosePreset = (id: keyof typeof travelPresets) => {
    const p = travelPresets[id];
    setQuery({ ...p, via: [...p.via] });
    setViaText(p.via.map((id) => travelById.get(id)?.name ?? id).join(", "));
  };
  const applyVia = () => {
    const names = viaText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      ids = names.map(
        (s) =>
          travelLocations.find(
            (p) => p.id === s || p.name.toLowerCase() === s.toLowerCase(),
          )?.id,
      );
    if (ids.some((id) => !id)) {
      setError(
        "A waypoint was not found. Use a catalog name, separated by commas.",
      );
      return;
    }
    patch({ via: ids as string[] });
  };
  const chooseStop = (index: number) => {
    setSelected(index);
    setInspection(undefined);
    setPreview(false);
  };
  return (
    <main className="geo-lab">
      <header className="geo-header">
        <div>
          <a href="/">Universal History Simulator</a>
          <h1>The geography workshop</h1>
          <p>Connected places. Shorter journeys. The country in between.</p>
        </div>
        <span className="geo-badge">TRAVEL SYSTEM · DEVELOPMENT</span>
      </header>
      <section className="geo-presets" aria-label="Review journeys">
        {Object.entries(travelPresets).map(([id, p]) => (
          <button
            key={id}
            onClick={() => choosePreset(id as keyof typeof travelPresets)}
          >
            {p.label}
          </button>
        ))}
      </section>
      <div className="geo-workbench">
        <aside className="geo-controls">
          <h2>Plan a journey</h2>
          {(["from", "to"] as const).map((key) => (
            <label key={key}>
              {key === "from" ? "Departure" : "Destination"}
              <select
                aria-label={key === "from" ? "Departure" : "Destination"}
                value={query[key]}
                onChange={(e) => {
                  patch({ [key]: e.target.value, via: [] });
                  setViaText("");
                }}
              >
                {sortedLocations.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label>
            Via <span>optional · comma-separated names</span>
            <textarea
              aria-label="Waypoints"
              value={viaText}
              onChange={(e) => setViaText(e.target.value)}
              rows={3}
            />
          </label>
          <button onClick={applyVia}>Apply waypoints</button>
          <div className="geo-pair">
            <label>
              Year
              <input
                aria-label="Year"
                type="number"
                min={-1000000}
                max={10000}
                value={query.year}
                onChange={(e) => {
                  if (e.target.value) patch({ year: Number(e.target.value) });
                }}
              />
            </label>
            <label>
              Travel mode
              <select
                aria-label="Travel mode"
                value={query.mode}
                onChange={(e) =>
                  patch({ mode: e.target.value as TravelQuery["mode"] })
                }
              >
                <option value="mixed">Land and sea</option>
                <option value="land">Walking only</option>
                <option value="sea">Sea only</option>
              </select>
            </label>
          </div>
          <small>
            Negative years use astronomical numbering: −4999 = 5000 BCE.
          </small>
          <label className="geo-spacing">
            Land spacing <strong>{query.spacing} km</strong>
            <input
              aria-label="Landscape spacing"
              type="range"
              min="60"
              max="1000"
              step="10"
              value={query.spacing}
              onChange={(e) => patch({ spacing: +e.target.value })}
            />
          </label>
          <p className="geo-help">
            Closer spacing retains more countryside. Oceans use separate, wider
            spacing across all five oceans. Destinations and persistent climate
            changes stay represented. This changes geographic compression, not
            walking speed.
          </p>
          <div className="geo-pair">
            <button
              onClick={() => {
                const from = query.to,
                  to = query.from,
                  via = [...query.via].reverse();
                setQuery({ ...query, from, to, via });
                setViaText(
                  via.map((id) => travelById.get(id)?.name ?? id).join(", "),
                );
              }}
            >
              Reverse journey
            </button>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(location.href);
                  setCopyStatus("Link copied");
                } catch {
                  setCopyStatus("Copy the URL from your address bar");
                }
              }}
            >
              Copy link
            </button>
          </div>
          {copyStatus && <small role="status">{copyStatus}</small>}
          <details>
            <summary>What this review implements</summary>
            <p>
              A global H3 geographic graph, atlas-based land/sea routing, stable
              cell IDs, dated anchor labels, and adjustable proposed stops. The
              sample journeys supply waypoints, not adjacency tables.
            </p>
            <p>
              Settlement coverage is deliberately scoped. The coarse land mask
              misses some narrow passages. Cultural families and climate are
              existing broad defaults, not researched historical borders.
            </p>
            <p>
              The local game is unchanged. Map crossing and the final global
              compression policy remain to be integrated after review.
            </p>
          </details>
        </aside>
        <section className="geo-main">
          <div className="geo-stats" aria-live="polite">
            <div>
              <strong>
                {pending ? "…" : (currentResult?.stops.length ?? "—")}
              </strong>
              <span>proposed maps</span>
            </div>
            <div>
              <strong>
                {currentResult
                  ? Math.round(currentResult.km).toLocaleString()
                  : "—"}
              </strong>
              <span>geographic km</span>
            </div>
            <div>
              <strong>
                {currentResult
                  ? Math.round(
                      currentResult.stops
                        .filter((s) => !s.water)
                        .reduce((sum, s) => sum + s.size * 0.14, 0) / 60,
                    )
                  : "—"}{" "}
                min
              </strong>
              <span>walking on land maps*</span>
            </div>
            <div>
              <strong>{currentResult?.cells.length ?? "—"}</strong>
              <span>underlying cells</span>
            </div>
          </div>
          {currentResult?.cells.some((c) => c.water) && (
            <p className="geo-status">
              Boat required · gold: walking · blue: sailing · coastal stops mark
              departure and landfall. Sailing time is not yet modeled.
            </p>
          )}
          <details className="geo-limitations">
            <summary>Geographic naming coverage</summary>
            <p>
              Physical regions:{" "}
              <a
                href="https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-physical-labels/"
                target="_blank"
                rel="noreferrer"
              >
                Natural Earth
              </a>
              . Broad land labels:{" "}
              <a
                href="https://ecoregions.appspot.com/"
                target="_blank"
                rel="noreferrer"
              >
                RESOLVE Ecoregions 2017, Dinerstein et al.
              </a>{" "}
              (
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY 4.0
              </a>
              ), simplified and shortened. These modern regional labels do not
              assert historical vegetation.
            </p>
            {currentResult && (
              <p>
                Journey landscape labels:{" "}
                {
                  currentResult.stops.filter(
                    (s) => s.naming.coverage === "specific",
                  ).length
                }{" "}
                specific ·{" "}
                {
                  currentResult.stops.filter(
                    (s) => s.naming.coverage === "broad",
                  ).length
                }{" "}
                broad ·{" "}
                {
                  currentResult.stops.filter(
                    (s) => s.naming.coverage === "missing",
                  ).length
                }{" "}
                missing.
              </p>
            )}
            <button
              disabled={auditBusy}
              onClick={() => {
                setAuditBusy(true);
                setAuditError("");
                worker.current?.postMessage({ kind: "naming-audit" });
              }}
            >
              {auditBusy
                ? "Checking global coverage…"
                : "Check global naming coverage"}
            </button>
            {auditError && <p role="alert">{auditError}</p>}
            {audit && (
              <>
                <p>
                  {audit.samples.length} locations: {audit.counts.specific}{" "}
                  specific · {audit.counts.broad} broad · {audit.counts.missing}{" "}
                  missing.
                </p>
                <p>{audit.method}</p>
                <label>
                  <input
                    type="checkbox"
                    checked={showCoverage}
                    onChange={(e) => setShowCoverage(e.target.checked)}
                  />{" "}
                  Show coverage: green specific · gold broad · red missing
                </label>
              </>
            )}
          </details>
          {pending && (
            <div className="geo-status" role="status">
              Finding a geographic path…
            </div>
          )}
          {error && (
            <div className="geo-error" role="alert">
              {error}
            </div>
          )}
          <div className={`geo-map ${pending || error ? "geo-stale" : ""}`}>
            <div className="geo-map-tools">
              <button onClick={() => result && setBounds(fit(result))}>
                Fit journey
              </button>
              <button
                onClick={() =>
                  setBounds({ west: -180, east: 180, south: -85, north: 85 })
                }
              >
                Earth
              </button>
              <button aria-label="Zoom in" onClick={() => zoom(0.7)}>
                +
              </button>
              <button aria-label="Zoom out" onClick={() => zoom(1.4)}>
                −
              </button>
              <label>
                <input
                  type="checkbox"
                  checked={showCells}
                  onChange={(e) => setShowCells(e.target.checked)}
                />
                Routing cells
              </label>
            </div>
            <svg
              viewBox="0 0 1000 530"
              role="img"
              aria-label="Geographic journey map"
              onPointerDown={(e) => {
                if ((e.target as Element).closest("[data-stop]")) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                drag.current = { x: e.clientX, y: e.clientY, bounds };
              }}
              onPointerMove={(e) => {
                const d = drag.current;
                if (!d) return;
                const r = e.currentTarget.getBoundingClientRect(),
                  dx =
                    ((e.clientX - d.x) / r.width) *
                    (d.bounds.east - d.bounds.west),
                  dy =
                    ((e.clientY - d.y) / r.height) *
                    (d.bounds.north - d.bounds.south);
                setBounds({
                  west: d.bounds.west - dx,
                  east: d.bounds.east - dx,
                  north: Math.min(90, d.bounds.north + dy),
                  south: Math.max(-90, d.bounds.south + dy),
                });
              }}
              onPointerUp={() => {
                drag.current = undefined;
              }}
              onPointerCancel={() => {
                drag.current = undefined;
              }}
            >
              <defs>
                <pattern
                  id="geo-grid"
                  width="50"
                  height="50"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M50 0H0V50"
                    fill="none"
                    stroke="#8eafbc"
                    strokeOpacity=".08"
                  />
                </pattern>
              </defs>
              <rect width="1000" height="530" fill="#122e3b" />
              <rect width="1000" height="530" fill="url(#geo-grid)" />
              <g fill="#294b49" stroke="#71958b" strokeWidth=".6">
                {landPaths.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
              {showCells && (
                <g
                  stroke="#b9c9b0"
                  strokeOpacity=".35"
                  strokeWidth=".6"
                  fill="none"
                >
                  {visibleCells.map((id) => (
                    <path key={id} d={cellPath(id)} />
                  ))}
                </g>
              )}
              {active && (
                <path
                  d={cellPath(active.id)}
                  fill="#eac784"
                  fillOpacity=".2"
                  stroke="#eac784"
                  strokeWidth="1.5"
                />
              )}
              {result?.cells.slice(1).map((c, i) => {
                const previous = result.cells[i];
                const a = project(previous.lon, previous.lat),
                  b = project(c.lon, c.lat);
                if (
                  Math.abs(
                    wrapLon(previous.lon - (bounds.west + bounds.east) / 2) -
                      wrapLon(c.lon - (bounds.west + bounds.east) / 2),
                  ) > 180
                )
                  return null;
                return (
                  <line
                    key={i}
                    x1={a[0]}
                    y1={a[1]}
                    x2={b[0]}
                    y2={b[1]}
                    stroke={c.water || previous.water ? "#72c4ef" : "#dfc493"}
                    strokeWidth="2"
                  />
                );
              })}
              {showCoverage &&
                audit?.samples.map((s) => {
                  const [x, y] = project(s.lon, s.lat);
                  return (
                    <circle
                      key={s.id}
                      cx={x}
                      cy={y}
                      r="3"
                      fill={
                        s.coverage === "specific"
                          ? "#7dd3a3"
                          : s.coverage === "broad"
                            ? "#eac784"
                            : "#ef887c"
                      }
                      opacity=".8"
                      onClick={() => setInspection(s.id)}
                    >
                      <title>
                        {s.name} · {s.coverage}
                      </title>
                    </circle>
                  );
                })}
              {result?.legs
                .flatMap((l) => [l.from, l.to])
                .filter((id, i, a) => a.indexOf(id) === i)
                .map((id) => {
                  const p = travelById.get(id)!,
                    s = result.stops.find((s) => s.locationId === id);
                  return (
                    s && (
                      <line
                        key={id}
                        x1={project(p.lon, p.lat)[0]}
                        y1={project(p.lon, p.lat)[1]}
                        x2={project(s.lon, s.lat)[0]}
                        y2={project(s.lon, s.lat)[1]}
                        stroke="#e8b897"
                        strokeDasharray="3 3"
                      />
                    )
                  );
                })}
              {result?.stops.map((s, i) => {
                const [x, y] = project(s.lon, s.lat);
                return (
                  <g
                    key={`${s.id}-${i}`}
                    data-stop="true"
                    role="button"
                    tabIndex={0}
                    aria-label={`Inspect ${s.name}`}
                    onClick={() => chooseStop(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") chooseStop(i);
                    }}
                    transform={`translate(${x},${y})`}
                    className="geo-marker"
                  >
                    <circle
                      r={i === selected && !inspection ? 12 : 9}
                      fill={
                        i === selected && !inspection ? "#f4d59a" : "#142832"
                      }
                      stroke={colors[s.climate]}
                      strokeWidth="2"
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fontSize="9"
                      fill={
                        i === selected && !inspection ? "#142832" : "#f4e6ce"
                      }
                    >
                      {i + 1}
                    </text>
                    <title>
                      {s.name} · {s.climate}
                    </title>
                  </g>
                );
              })}
            </svg>
            <div className="geo-legend">
              <span>
                <i style={{ background: "#e5c38a" }} />
                Geographic path
              </span>
              <span>Numbered circles: playable-stop proposals</span>
              <span>Drag to pan · use + / − to zoom</span>
            </div>
          </div>
          <div className="geo-review">
            <section className="geo-itinerary">
              <h2>
                The journey{" "}
                <small>
                  {result && formatHistoricalYear(result.query.year)}
                </small>
              </h2>
              <div className="geo-stop-list">
                {result?.stops.map((s, i) => (
                  <button
                    key={`${s.id}-${i}`}
                    className={`geo-stop ${selected === i && !inspection ? "selected" : ""}`}
                    onClick={() => chooseStop(i)}
                  >
                    <span className="geo-index">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <i style={{ background: colors[s.climate] }} />
                    <span>
                      <strong>{s.name}</strong>
                      <small>
                        {s.settlement === "city" || s.settlement === "town"
                          ? s.settlement
                          : "landscape"}{" "}
                        · {s.climate.toLowerCase()}
                        {s.transition === "embark"
                          ? " · Board boat"
                          : s.transition === "disembark"
                            ? " · Landfall"
                            : s.water
                              ? " · Boat required"
                              : ""}
                      </small>
                    </span>
                    <small>
                      {i
                        ? `+${Math.round(s.km - result.stops[i - 1].km)} km`
                        : "Start"}
                    </small>
                  </button>
                ))}
              </div>
            </section>
            <section className="geo-inspector">
              <span className="geo-eyebrow">
                {inspection
                  ? "Adjacent geographic cell"
                  : `Map ${selected + 1} · ${stop?.reason ?? "select a stop"}`}
              </span>
              <h2>{active?.name ?? "Choose a location"}</h2>
              {active && (
                <>
                  <p className="geo-coordinates">
                    {active.lat.toFixed(2)}°, {active.lon.toFixed(2)}°
                  </p>
                  <div className="geo-tags">
                    <span>{active.climate}</span>
                    <span>
                      {active.relief > 0.55
                        ? "High relief"
                        : active.relief > 0.25
                          ? "Rolling ground"
                          : "Low relief"}
                    </span>
                  </div>
                  <p>
                    <strong>Regional library</strong>
                    <br />
                    {active.culture.replaceAll("-", " ")}
                  </p>
                  {!inspection && stop && (
                    <>
                      <p>{stop.note}</p>
                      {stop.settlement === "unresearched" && (
                        <p className="geo-coverage">
                          Named settlement not asserted at this date. The
                          geographic map remains.
                        </p>
                      )}
                      <p>
                        <strong>Proposed local bounds</strong>
                        <br />
                        {stop.size} × {stop.size} tiles · about{" "}
                        {Math.round(stop.size * 0.14)} seconds across*
                      </p>
                      <button
                        disabled={
                          active.water ||
                          Math.abs(active.lat) > 85 ||
                          pending ||
                          !!error
                        }
                        onClick={() => setPreview(true)}
                      >
                        Preview existing terrain
                      </button>
                    </>
                  )}
                  <h3>Adjacent areas</h3>
                  <p className="geo-help">
                    These are actual neighboring routing cells, before travel
                    compression. Water barriers are not turned into land exits.
                  </p>
                  <div className="geo-neighbors">
                    {adjacent.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          setInspection(n.id);
                          setPreview(false);
                        }}
                      >
                        <span>
                          {bearingTo(active, n)} · {n.name}
                        </span>
                        <small>
                          {n.open
                            ? `${Math.round(kilometers(active, n))} km · traversable`
                            : `blocked for ${query.mode}`}
                        </small>
                      </button>
                    ))}
                  </div>
                  {inspection && (
                    <button onClick={() => setInspection(undefined)}>
                      Back to selected stop
                    </button>
                  )}
                  <details>
                    <summary>Geographic identity & provenance</summary>
                    <code>{active.id}</code>
                    <p>
                      Landscape naming:{" "}
                      <strong>{active.naming.coverage}</strong> ·{" "}
                      {active.naming.name}
                      <br />
                      {active.naming.source}
                      {active.naming.sourceName && (
                        <>
                          <br />
                          Source label: {active.naming.sourceName}
                        </>
                      )}
                      <br />
                      {active.naming.regionId}
                    </p>
                    <p>
                      <a
                        href="https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-physical-labels/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Natural Earth physical regions ↗
                      </a>
                    </p>
                    <p>
                      H3 resolution 4. Land/sea from the bundled Natural Earth
                      atlas. Climate and cultural library from existing broad
                      geographic rules.
                    </p>
                    {stop?.locationId &&
                      travelById.get(stop.locationId)?.settlement?.source && (
                        <a
                          href={
                            travelById.get(stop.locationId)!.settlement!.source
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          Scenario source ↗
                        </a>
                      )}
                  </details>
                </>
              )}
            </section>
          </div>
          {result && (
            <details className="geo-limitations">
              <summary>Coverage and interpretation</summary>
              {result.warnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
              <p>
                *Walking estimates use the current 140 ms step cadence and a
                straight crossing. Detours, frame timing, and time spent
                exploring are additional.
              </p>
              <p>
                The Morocco–India journey is an illustrative medieval corridor,
                not a reconstruction of Ibn Battuta’s exact itinerary. Generic
                climate layers do not yet distinguish all monsoon, canyon, or
                local vegetation conditions.
              </p>
            </details>
          )}
        </section>
      </div>
      {preview && stop && (
        <div
          className="geo-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Local terrain preview"
        >
          <button className="geo-close" onClick={() => setPreview(false)}>
            Close preview ×
          </button>
          <Suspense fallback={<p>Loading existing renderer…</p>}>
            <LocalPreview stop={stop} year={query.year} />
          </Suspense>
        </div>
      )}
    </main>
  );
}
