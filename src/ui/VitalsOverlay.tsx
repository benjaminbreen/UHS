import { useEffect, useState } from "react";
import { currentVitals, lastSession } from "../runtime/vitals";

/**
 * On-device readout for the counters in runtime/vitals. Off unless the URL
 * carries ?vitals=1, which sticks so the page can be reloaded after a crash
 * without losing the instrument. ?vitals=0 turns it back off.
 */
const FLAG = "uhs.vitals.on";

export function vitalsEnabled() {
  const param = new URLSearchParams(window.location.search).get("vitals");
  if (param === "1") localStorage.setItem(FLAG, "1");
  if (param === "0") localStorage.removeItem(FLAG);
  return localStorage.getItem(FLAG) === "1";
}

export function VitalsOverlay() {
  const [vitals, setVitals] = useState(() => currentVitals());
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setVitals(currentVitals()), 1000);
    return () => clearInterval(id);
  }, []);
  const previous = lastSession();
  const crashed = previous && !previous.closed;
  const counts = Object.entries(vitals.counts)
    .map(([k, v]) => `${k} ${v}`)
    .join("  ");
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        position: "fixed",
        left: 4,
        bottom: 4,
        zIndex: 99999,
        maxWidth: "calc(100vw - 8px)",
        maxHeight: open ? "60vh" : undefined,
        overflow: "auto",
        padding: "4px 6px",
        borderRadius: 4,
        background: crashed ? "rgba(90,0,0,.85)" : "rgba(0,0,0,.7)",
        color: "#9f9",
        font: "10px/1.35 ui-monospace, monospace",
        whiteSpace: "pre-wrap",
        pointerEvents: "auto",
      }}
    >
      {`${vitals.uptime}s  ${counts}`}
      {crashed ? "\n⚠ last session died without unload" : ""}
      {open && previous
        ? `\n\n— previous session —\n${previous.uptime}s ${previous.viewport}\n` +
          Object.entries(previous.counts)
            .map(([k, v]) => `${k} ${v}`)
            .join("  ") +
          `\nevents:\n${previous.events.join("\n") || "none"}` +
          `\nerrors:\n${previous.errors.join("\n") || "none"}`
        : ""}
      {open ? `\n\n— now —\nevents:\n${vitals.events.join("\n") || "none"}\nerrors:\n${vitals.errors.join("\n") || "none"}` : ""}
    </div>
  );
}
