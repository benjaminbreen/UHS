import { useEffect, useState } from "react";
import { currentVitals, lastSession } from "../runtime/vitals";

/** On-device readout for the counters in runtime/vitals, shown only when
 * vitalsEnabled(). Tapping cycles, so the readout never sits on the command bar for good. */
type View = "bar" | "full" | "dot";
const NEXT: Record<View, View> = { bar: "full", full: "dot", dot: "bar" };

export function VitalsOverlay() {
  const [vitals, setVitals] = useState(() => currentVitals());
  const [view, setView] = useState<View>("bar");
  useEffect(() => {
    const id = setInterval(() => setVitals(currentVitals()), 1000);
    return () => clearInterval(id);
  }, []);
  const previous = lastSession();
  const crashed = previous && !previous.closed;
  const counts = Object.entries(vitals.counts)
    .map(([k, v]) => `${k} ${v}`)
    .join("  ");
  const shell: React.CSSProperties = {
    position: "fixed",
    left: 4,
    bottom: "calc(4px + env(safe-area-inset-bottom))",
    zIndex: 99999,
    width: "fit-content",
    padding: view === "dot" ? "6px 8px" : "4px 6px",
    borderRadius: 4,
    background: crashed ? "rgba(90,0,0,.85)" : "rgba(0,0,0,.72)",
    color: "#9f9",
    font: "10px/1.35 ui-monospace, monospace",
    whiteSpace: "pre-wrap",
  };
  if (view === "dot")
    return (
      <div onClick={() => setView("bar")} style={shell}>
        {crashed ? "⚠" : "·"}
      </div>
    );
  const report = (label: string, v: typeof vitals | undefined) =>
    v
      ? `\n\n— ${label} —\n${v.uptime}s ${v.viewport}\n` +
        Object.entries(v.counts)
          .map(([k, n]) => `${k} ${n}`)
          .join("  ") +
        `\nevents:\n${v.events.join("\n") || "none"}` +
        `\nerrors:\n${v.errors.join("\n") || "none"}`
      : "";
  return (
    <div
      onClick={() => setView(NEXT[view])}
      style={{
        ...shell,
        maxWidth: "calc(100vw - 8px)",
        maxHeight: view === "full" ? "60vh" : undefined,
        overflow: "auto",
      }}
    >
      {`${vitals.uptime}s  ${counts}`}
      {crashed ? "\n⚠ last session died without unload — tap for detail" : ""}
      {view === "full" ? report("previous session", previous) : ""}
      {view === "full" ? report("now", vitals) : ""}
    </div>
  );
}
