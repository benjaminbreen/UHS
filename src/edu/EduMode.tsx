import { lazy, Suspense, useEffect, useState } from "react";
import type { Engine } from "../core/engine";
import type { EduEvent, EduSession } from "./events";
import { activeEduSession, EduRecorder, rememberEduSession } from "./recorder";
import "./edu.css";

const Game = lazy(() => import("../runtime/bootstrap").then((m) => ({ default: m.Game })));
const Splash = lazy(() => import("../ui/Splash").then((m) => ({ default: m.Splash })));

function download(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function EduMode() {
  const [available, setAvailable] = useState<boolean>();
  const [prior, setPrior] = useState(activeEduSession);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recorder, setRecorder] = useState<EduRecorder>();
  const [, refresh] = useState(0);
  const [engine, setEngine] = useState<Engine>();
  const [entered, setEntered] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void fetch("/api/edu?view=config").then((r) => r.json())
      .then((data) => setAvailable(!!data.available))
      .catch(() => setAvailable(false));
  }, []);
  useEffect(() => {
    if (!recorder) return;
    recorder.onStatus = () => refresh((n) => n + 1);
    return () => recorder.dispose();
  }, [recorder]);

  const start = async () => {
    if (!agreed || !name.trim() || !code.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/edu?view=start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), code, consent: true }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error ?? "Could not start the session.");
      const credentials = { sessionId: data.sessionId as string, token: data.token as string, name: name.trim() };
      rememberEduSession(credentials);
      setPrior(credentials);
      setRecorder(new EduRecorder(credentials));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start the session.");
    } finally { setBusy(false); }
  };
  const resume = async () => {
    if (!prior || !agreed || name.trim().toLowerCase() !== prior.name.toLowerCase() || !code.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/edu?view=resume", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${prior.token}` },
        body: JSON.stringify({ sessionId: prior.sessionId, code }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error ?? "Could not resume this session.");
      setRecorder(new EduRecorder(prior));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not resume this session.");
    } finally { setBusy(false); }
  };
  const finish = async () => {
    if (!recorder) return;
    setBusy(true);
    const saved = await recorder.finish();
    setBusy(false);
    if (!saved) { setError("Some work is still waiting to sync. Keep this page open and try again."); return; }
    setEngine(undefined);
    setEntered(false);
    setRecorder(undefined);
    setPrior(undefined);
    setName("");
    setCode("");
    setAgreed(false);
  };

  if (!recorder) return <main className="edu-entry">
    <div className="edu-card">
      <a href="/">← Standard UHS</a>
      <h1>Classroom mode</h1>
      <p>Your teacher can review your actions, submitted text and conversations, notebook entries, and the outcomes of your choices. Recording begins only after you start a session here.</p>
      <p>Your name is attached to the session. If you lose connection, the browser keeps unsent events and retries. If model narration is enabled, text you submit may also be processed by its provider. Ask your teacher how long the class will keep the record.</p>
      {available === false && <p role="alert">Classroom collection is not configured on this site yet.</p>}
      {prior && available && <p>This browser has an unfinished record for {prior.name}. Enter that name and the class code to continue recording in a new game world.</p>}
      <form onSubmit={(e) => { e.preventDefault(); void start(); }}>
        <label>Your name<input autoComplete="name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>Class code<input type="password" maxLength={200} value={code} onChange={(e) => setCode(e.target.value)} /></label>
        <label className="edu-check"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> I agree to share this session with my teacher.</label>
        <button disabled={!available || !agreed || !name.trim() || !code.trim() || busy}>Start recorded session</button>
        {prior && <button type="button" disabled={!available || !agreed || !code.trim() || name.trim().toLowerCase() !== prior.name.toLowerCase() || busy} onClick={() => { void resume(); }}>Continue recording as {prior.name}</button>}
      </form>
      {error && <p role="alert">{error}</p>}
    </div>
  </main>;

  return <>
    <div className="edu-status" role="status">
      <strong>Classroom recording · {recorder.credentials.name}</strong>
      <span>{recorder.pending ? `${recorder.pending} events waiting to sync` : "Saved"}</span>
      {recorder.error && <span>{recorder.error}</span>}
      <button disabled={busy} onClick={() => { void finish(); }}>Finish session</button>
      {error && <span>{error}</span>}
    </div>
    {engine && <div className="prepared-game" inert={!entered || busy}>
      <Suspense fallback={null}><Game engine={engine} active={entered && !busy} onReady={() => setReady(true)} edu={recorder} /></Suspense>
    </div>}
    {!entered && <Suspense fallback={null}><Splash ready={ready}
      onPrepared={(next) => { setReady(false); setEngine(next); }}
      onStart={() => setEntered(true)}
      onCancel={() => { setEngine(undefined); setReady(false); }} /></Suspense>}
  </>;
}

const detail = (event: EduEvent) => {
  if (event.kind === "command") {
    const request = event.data.request as { command?: { type?: string; action?: string } } | undefined;
    const result = event.data.result as { status?: string; reason?: string } | undefined;
    return `${request?.command?.type ?? "Action"}${request?.command?.action ? `: ${request.command.action}` : ""} · ${result?.status ?? ""}${result?.reason ? ` · ${result.reason}` : ""}`;
  }
  if (event.kind === "text") return String(event.data.input ?? "");
  if (event.kind === "note") return String((event.data.note as { text?: string } | undefined)?.text ?? "");
  if (event.kind === "selection") return `Inspected ${String(event.data.targetId ?? "nothing")}`;
  if (event.kind === "dialogue") return `${String(event.data.input ?? "Opened conversation")} · ${String(event.data.response ?? event.data.opening ?? event.data.error ?? "")}`;
  return "World started or changed";
};

export function EduTeacher() {
  const [token, setToken] = useState(() => sessionStorage.getItem("uhs-edu-teacher") ?? "");
  const [sessions, setSessions] = useState<EduSession[]>([]);
  const [selected, setSelected] = useState<{ session: EduSession; events: EduEvent[] }>();
  const [error, setError] = useState("");
  const headers = { Authorization: `Bearer ${token}` };
  const load = async () => {
    setError("");
    const response = await fetch("/api/edu?view=sessions", { headers });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "Could not load sessions."); return; }
    sessionStorage.setItem("uhs-edu-teacher", token);
    setSessions(data.sessions);
  };
  const open = async (id: string) => {
    const response = await fetch(`/api/edu?view=session&id=${encodeURIComponent(id)}`, { headers });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "Could not load session."); return; }
    setSelected(data);
  };
  const remove = async () => {
    if (!selected || !window.confirm(`Delete ${selected.session.name}'s recorded session?`)) return;
    const response = await fetch(`/api/edu?view=session&id=${selected.session.id}`, { method: "DELETE", headers });
    if (!response.ok) { setError("Could not delete session."); return; }
    setSelected(undefined);
    void load();
  };
  const replay = () => {
    if (!selected) return;
    const first = selected.events.find((e) => e.kind === "world");
    const next = selected.events.find((e) => e.kind === "world" && e.seq > (first?.seq ?? 0));
    if (!first) return;
    const commands = selected.events
      .filter((e) => e.kind === "command" && e.seq > first.seq && (!next || e.seq < next.seq))
      .map((e) => e.data.request);
    download("uhs-classroom-replay.json", JSON.stringify({ manifest: first.data.manifest, commands }, null, 2), "application/json");
  };
  const exportCsv = () => {
    if (!selected) return;
    const rows = [["session_id", "name", "seq", "wall_time", "sim_time", "kind", "detail"], ...selected.events.map((e) =>
      [selected.session.id, selected.session.name, String(e.seq), e.wallTime, String(e.simTime), e.kind, detail(e)])];
    download("uhs-classroom-session.csv", rows.map((r) => r.map((v) => `"${v.replaceAll('"', '""')}"`).join(",")).join("\n"), "text/csv");
  };
  const shown = selected?.events.filter((e) =>
    e.kind !== "command" || (e.data.request as { command?: { type?: string } } | undefined)?.command?.type !== "pass") ?? [];
  return <main className="edu-teacher">
    <div className="edu-card">
      <a href="/edumode">← Classroom entry</a>
      <h1>Classroom sessions</h1>
      <form onSubmit={(e) => { e.preventDefault(); void load(); }}>
        <label>Teacher token<input type="password" value={token} onChange={(e) => setToken(e.target.value)} /></label>
        <button disabled={!token}>Load sessions</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <div className="edu-teacher-grid">
        <section><h2>Students</h2>{sessions.map((s) => <button key={s.id} onClick={() => { void open(s.id); }}>
          {s.name} · {s.eventCount} events · {new Date(s.createdAt).toLocaleString()}
        </button>)}</section>
        <section><h2>{selected?.session.name ?? "Choose a session"}</h2>
          {selected && <>
            <div className="edu-actions">
              <button onClick={() => download("uhs-classroom-session.jsonl", [JSON.stringify({ session: selected.session }), ...selected.events.map((e) => JSON.stringify(e))].join("\n") + "\n", "application/x-ndjson")}>Export JSONL</button>
              <button onClick={exportCsv}>Export CSV</button>
              <button onClick={replay}>Download first world replay</button>
              <button onClick={() => { void remove(); }}>Delete</button>
            </div>
            <p>Import the replay in UHS Settings → Replay a journey. Later world changes remain in the event timeline and exports.</p>
            <p>{selected.events.length - shown.length} automatic time ticks hidden from this view; exports include them for replay.</p>
            <ol className="edu-events">{shown.map((e) => <li key={e.seq}>
              <small>{new Date(e.wallTime).toLocaleString()} · game time {Math.floor(e.simTime / 3600)}:{String(Math.floor(e.simTime / 60) % 60).padStart(2, "0")}</small>
              <strong>{e.kind}</strong> {detail(e)}
              {e.kind === "text" && <p>Response: {String(e.data.response ?? e.data.error ?? "")}</p>}
            </li>)}</ol>
          </>}
        </section>
      </div>
    </div>
  </main>;
}
