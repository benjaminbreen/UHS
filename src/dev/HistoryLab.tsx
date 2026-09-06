import { useEffect, useMemo, useState } from "react";
import { historyRegistry, resolveHistory } from "../content/history";
import {
  eras,
  formatDate,
  type HistoricalDate,
} from "../content/history/dates";
import {
  categories,
  cultures,
  type CultureId,
  type Evidence,
  type ResolveInput,
} from "../content/history/types";
import atlas from "../render/generated/atlas.json" with { type: "json" };
import "./history-lab.css";

function readInput(): ResolveInput {
  const q = new URLSearchParams(location.search);
  const placeId = q.has("place")
    ? q.get("place")!
    : q.size
      ? undefined
      : "tiber";
  const place = historyRegistry.places.find((p) => p.id === placeId);
  const culture = q.get("culture") ?? place?.culture ?? "european";
  const sample = place?.sample ?? { year: 100 };
  return {
    culture: culture as CultureId,
    place: placeId || undefined,
    date: {
      year: q.has("year") ? Number(q.get("year")) : sample.year,
      month: q.has("month") ? Number(q.get("month")) : sample.month,
      day: q.has("day") ? Number(q.get("day")) : sample.day,
    },
    context: q.get("context") || undefined,
    hypotheses: q.get("hypotheses") !== "0",
    capabilities: q.get("capabilities")?.split(",").filter(Boolean),
  };
}
function inputURL(input: ResolveInput) {
  const q = new URLSearchParams({
    culture: input.culture,
    place: input.place ?? "",
    year: String(input.date.year),
    hypotheses: input.hypotheses === false ? "0" : "1",
  });
  if (input.date.month !== undefined) q.set("month", String(input.date.month));
  if (input.date.day !== undefined) q.set("day", String(input.date.day));
  if (input.context) q.set("context", input.context);
  if (input.capabilities?.length)
    q.set("capabilities", input.capabilities.join(","));
  return `/history-lab?${q}`;
}
function EvidenceView({ evidence }: { evidence: Evidence }) {
  return (
    <div className="history-evidence">
      <strong className={`evidence-${evidence.status}`}>
        {evidence.status}
      </strong>
      <p>{evidence.claim}</p>
      <p className="history-muted">{evidence.limitation}</p>
      {evidence.sources.map((id) => {
        const source = historyRegistry.sources.find((s) => s.id === id)!;
        return (
          <a key={id} href={source.url} target="_blank" rel="noreferrer">
            {source.title} ↗
          </a>
        );
      })}
    </div>
  );
}
function Sprite({ id }: { id?: string }) {
  const frame = id
    ? (
        atlas.frames as Record<
          string,
          { frame: { x: number; y: number; w: number; h: number } }
        >
      )[id]?.frame
    : undefined;
  if (!frame) return <span className="history-muted">—</span>;
  return (
    <svg
      className="history-sprite"
      viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`}
      aria-label={`${id} existing sprite`}
      role="img"
    >
      <image
        href="/packs/atlas.png"
        width={atlas.meta.size.w}
        height={atlas.meta.size.h}
      />
    </svg>
  );
}
export function HistoryLab() {
  const [input, setInput] = useState(readInput);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const resolved = useMemo(() => {
    try {
      return { result: resolveHistory(historyRegistry, input), error: "" };
    } catch (error) {
      return {
        result: undefined,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [input]);
  const result = resolved.result;
  useEffect(() => {
    history.replaceState(null, "", inputURL(input));
    Object.assign(window, {
      historyLab: { describe: () => structuredClone(resolved) },
    });
    return () => {
      delete (window as unknown as { historyLab?: unknown }).historyLab;
    };
  }, [input, resolved]);
  useEffect(() => {
    const pop = () => setInput(readInput());
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  const change = (patch: Partial<ResolveInput>) =>
    setInput((old) => ({ ...old, ...patch }));
  const date = (patch: Partial<HistoricalDate>) =>
    change({ date: { ...input.date, ...patch } });
  const entries =
    result?.entries.filter(
      (e) =>
        (category === "all" || e.definition.category === category) &&
        `${e.definition.label} ${e.id} ${e.reason}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    ) ?? [];
  const exportJSON = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `uhs-history-${input.place ?? input.culture}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="history-lab">
      <header className="history-header">
        <div>
          <a href="/">Universal History Simulator</a>
          <h1>History & content lab</h1>
          <p>Fixed eras · dated selections · visible evidence</p>
        </div>
        <nav>
          <a href="/graphics-lab">Graphics lab</a>
          <a href="/">Return to world</a>
        </nav>
      </header>
      <div className="history-layout">
        <aside aria-label="Historical context">
          <label>
            Culture family
            <select
              value={input.culture}
              onChange={(e) =>
                change({
                  culture: e.target.value as CultureId,
                  place: undefined,
                })
              }
            >
              {cultures.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Local profile
            <select
              value={input.place ?? ""}
              onChange={(e) => {
                const place = historyRegistry.places.find(
                  (p) => p.id === e.target.value,
                );
                change(
                  place
                    ? {
                        place: place.id,
                        culture: place.culture,
                        date: place.sample,
                      }
                    : { place: undefined },
                );
              }}
            >
              <option value="">Broad defaults only</option>
              {historyRegistry.places
                .filter((p) => p.culture === input.culture)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Era
            <select
              value={result?.era.id ?? ""}
              onChange={(e) => {
                const era = eras.find((era) => era.id === e.target.value);
                if (era) change({ date: era.sample });
              }}
            >
              <option value="" disabled>
                Invalid date
              </option>
              {eras.map((era) => (
                <option key={era.id} value={era.id}>
                  {era.label}
                </option>
              ))}
            </select>
          </label>
          <div className="history-date">
            <label>
              Year
              <input
                type="number"
                min="1"
                max="10000000"
                value={
                  input.date.year > 0 ? input.date.year : 1 - input.date.year
                }
                onChange={(e) =>
                  date({
                    year:
                      input.date.year > 0
                        ? Number(e.target.value)
                        : 1 - Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Calendar
              <select
                value={input.date.year > 0 ? "CE" : "BCE"}
                onChange={(e) => {
                  const magnitude =
                    input.date.year > 0 ? input.date.year : 1 - input.date.year;
                  date({
                    year: e.target.value === "CE" ? magnitude : 1 - magnitude,
                  });
                }}
              >
                <option>CE</option>
                <option>BCE</option>
              </select>
            </label>
          </div>
          <div className="history-date">
            <label>
              Month
              <input
                type="number"
                min="1"
                max="12"
                placeholder="1"
                value={input.date.month ?? ""}
                onChange={(e) =>
                  date({
                    month: e.target.value ? Number(e.target.value) : undefined,
                    day: undefined,
                  })
                }
              />
            </label>
            <label>
              Day
              <input
                type="number"
                min="1"
                max="31"
                placeholder="1"
                value={input.date.day ?? ""}
                onChange={(e) =>
                  date({
                    month: input.date.month ?? 1,
                    day: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </label>
          </div>
          <p className="history-muted">
            Blank month/day means the first day. Dates select historical
            starting conditions; they do not run events or advance your saved
            game.
          </p>
          <label>
            Placement context
            <select
              value={input.context ?? ""}
              onChange={(e) => change({ context: e.target.value || undefined })}
            >
              <option value="">All contexts</option>
              {["household", "market", "storehouse", "workshop", "field"].map(
                (c) => (
                  <option key={c}>{c}</option>
                ),
              )}
            </select>
          </label>
          <label>
            Local capabilities
            <input
              placeholder="e.g. electricity, kiln"
              value={input.capabilities?.join(",") ?? ""}
              onChange={(e) =>
                change({
                  capabilities: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
          <label className="history-check">
            <input
              type="checkbox"
              checked={input.hypotheses !== false}
              onChange={(e) => change({ hypotheses: e.target.checked })}
            />
            Allow hypotheses & game assumptions
          </label>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(location.href);
                setMessage("Review link copied.");
              } catch {
                setMessage("Copy the address bar to share this context.");
              }
            }}
          >
            Copy review link
          </button>
          <button disabled={!result} onClick={exportJSON}>
            Export resolved JSON
          </button>
          <p role="status">{message}</p>
          <details>
            <summary>All twelve era boundaries</summary>
            {eras.map((era) => (
              <p key={era.id}>
                <strong>{era.label}</strong>
                <br />
                {era.start
                  ? formatDate(era.start)
                  : "Earlier prehistory"} →{" "}
                {era.end ? formatDate(era.end) : "present / open boundary"}
              </p>
            ))}
          </details>
        </aside>
        <section
          className="history-results"
          aria-label="Resolved historical content"
        >
          {resolved.error && <p role="alert">{resolved.error}</p>}
          {result && (
            <>
              <div className="history-summary">
                <div>
                  <span className="history-muted">
                    {formatDate(input.date)} · registry v{result.version}
                  </span>
                  <h2>{result.era.label}</h2>
                </div>
                <strong data-testid="history-coverage">
                  {result.coverage === "unresearched"
                    ? "Unresearched combination"
                    : "Partial coverage"}
                </strong>
              </div>
              <div className="history-notes">
                {result.notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
              <div className="history-facts">
                {result.facts.map((fact) => (
                  <article key={fact.key} data-testid={`fact-${fact.key}`}>
                    <span className="history-muted">{fact.key}</span>
                    <h3>{fact.label}</h3>
                    {!fact.selected && (
                      <p className="history-warning">
                        Not adopted while exploratory interpretations are
                        disabled.
                      </p>
                    )}
                    <EvidenceView evidence={fact.evidence} />
                    {fact.alternatives?.map((a) => (
                      <details key={a.label}>
                        <summary>Alternative: {a.label}</summary>
                        <EvidenceView evidence={a.evidence} />
                      </details>
                    ))}
                  </article>
                ))}
              </div>
              {!result.facts.length && (
                <p className="history-muted">
                  Authority and language have not been researched for this
                  context. Nothing is silently borrowed from a neighboring
                  profile.
                </p>
              )}
              <div className="history-filters">
                <label>
                  Content category
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="all">All categories</option>
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Find content
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name, ID, or reason"
                  />
                </label>
              </div>
              <p>
                {entries.length} matching selections ·{" "}
                {result.entries.filter((e) => e.status === "included").length}{" "}
                included overall. Reference entries are not implemented
                gameplay.
              </p>
              <div className="history-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Existing art</th>
                      <th>Definition</th>
                      <th>Selection</th>
                      <th>Evidence & explanation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} data-testid={`content-${entry.id}`}>
                        <td>
                          <Sprite id={entry.definition.sprite} />
                        </td>
                        <td>
                          <strong>{entry.definition.label}</strong>
                          <small>{entry.id}</small>
                          <small>
                            {entry.definition.category} ·{" "}
                            {entry.definition.delivery}
                          </small>
                        </td>
                        <td>
                          <strong>{entry.status}</strong>
                          <small>
                            {entry.frequency} · {entry.supply}
                          </small>
                          <small>{entry.contexts.join(", ")}</small>
                        </td>
                        <td>
                          <p>{entry.reason}</p>
                          <details>
                            <summary>Why this selection?</summary>
                            <EvidenceView evidence={entry.evidence} />
                            <ol>
                              {entry.trace.map((t) => (
                                <li key={t.rule}>
                                  <strong>{t.rule}</strong>
                                  <p>{t.note}</p>
                                </li>
                              ))}
                            </ol>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!entries.length && (
                <p>
                  No selected definitions in this view. This is a coverage gap,
                  not evidence that the society lacked these things.
                </p>
              )}
              <details>
                <summary>Matched rules ({result.matchedRules.length})</summary>
                {result.matchedRules.map((r) => (
                  <p key={r.id}>
                    <strong>{r.id}</strong> — {r.note}
                  </p>
                ))}
              </details>
              <details>
                <summary>
                  Catalog definitions not researched here (
                  {result.unresearched.length})
                </summary>
                <p className="history-muted">
                  These are not generation candidates unless a scoped rule
                  explicitly selects them.
                </p>
                <ul>
                  {result.unresearched.map((id) => (
                    <li key={id}>{id}</li>
                  ))}
                </ul>
              </details>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
