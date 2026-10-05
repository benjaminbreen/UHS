import { useEffect, useState } from "react";

// [label, CSS family, Google Fonts query or null if already loaded/system]
const SERIFS: [string, string, string | null][] = [
  ["Baskervville", '"Baskervville", Georgia, serif', null],
  ["Libre Baskerville", '"Libre Baskerville", Georgia, serif', "Libre+Baskerville:ital,wght@0,400;0,700;1,400"],
  ["Baskerville (macOS)", "Baskerville, Georgia, serif", null],
  ["Cormorant Garamond", '"Cormorant Garamond", Georgia, serif', "Cormorant+Garamond:ital,wght@0,400;0,600;1,400"],
  ["EB Garamond", '"EB Garamond", Georgia, serif', "EB+Garamond:ital,wght@0,400;0,600;1,400"],
  ["Crimson Pro", '"Crimson Pro", Georgia, serif', "Crimson+Pro:ital,wght@0,400;0,600;1,400"],
  ["Spectral", '"Spectral", Georgia, serif', "Spectral:ital,wght@0,300;0,400;0,600;1,400"],
  ["Cormorant SC", '"Cormorant SC", Georgia, serif', "Cormorant+SC:wght@400;600"],
];
const SANS: [string, string, string | null][] = [
  ["DM Sans", '"DM Sans", system-ui, sans-serif', null],
  ["Figtree", '"Figtree", system-ui, sans-serif', "Figtree:wght@300;400;500;600"],
  ["Manrope", '"Manrope", system-ui, sans-serif', "Manrope:wght@300;400;500;600"],
  ["Instrument Sans", '"Instrument Sans", system-ui, sans-serif', "Instrument+Sans:wght@400;500;600"],
  ["Albert Sans", '"Albert Sans", system-ui, sans-serif', "Albert+Sans:wght@300;400;500;600"],
  ["IBM Plex Sans", '"IBM Plex Sans", system-ui, sans-serif', "IBM+Plex+Sans:wght@300;400;500;600"],
  ["Gentium Book Plus", '"Gentium Book Plus", Georgia, serif', "Gentium+Book+Plus:ital,wght@0,400;0,700;1,400"],
];

// The intro card's canvas wordmark; the number is its horizontal squeeze.
const MARKS: [string, string, string | null, number][] = [
  ["Rye", "Rye, Georgia, serif", null, 0.7],
  ["Pixelify Sans", '"Pixelify Sans"', null, 1],
  ["Silkscreen", "Silkscreen", null, 1],
  ["Jersey 10", '"Jersey 10"', "Jersey+10", 1],
  ["Jacquard 12", '"Jacquard 12"', "Jacquard+12", 1],
  ["VT323", "VT323", "VT323", 1],
  ["Micro 5", '"Micro 5"', "Micro+5", 1],
];

const KEY = "uhs-font-picker";

function load(query: string | null) {
  if (!query || document.querySelector(`link[data-font="${query}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.dataset.font = query;
  link.href = `https://fonts.googleapis.com/css2?family=${query}&display=swap`;
  document.head.append(link);
}

export function FontPicker() {
  const [pick, setPick] = useState<[number, number, number]>(() => {
    try {
      const [a = 0, b = 0, c = 0] = JSON.parse(localStorage.getItem(KEY) ?? "");
      return [a, b, c];
    } catch {
      return [0, 0, 0];
    }
  });
  const [open, setOpen] = useState(false);
  const [s, n, m] = pick;

  useEffect(() => {
    load(SERIFS[s][2]);
    load(SANS[n][2]);
    load(MARKS[m][2]);
    let style = document.getElementById("font-picker-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "font-picker-style";
      document.head.append(style);
    }
    // Screens redeclare these tokens on their own roots, so override everywhere.
    style.textContent = `* { ${s ? `--serif: ${SERIFS[s][1]} !important;` : ""} ${n ? `--sans: ${SANS[n][1]} !important;` : ""} }
      :root { --wordmark: ${MARKS[m][1]}; --wordmark-squeeze: ${MARKS[m][3]}; }`;
    void document.fonts.load(`22px ${MARKS[m][1]}`).finally(() => window.dispatchEvent(new Event("fontpick")));
    try {
      localStorage.setItem(KEY, JSON.stringify(pick));
    } catch {}
  }, [s, n, m]);

  const row = (opts: [string, string, ...unknown[]][], i: number, set: (i: number) => void) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
      {opts.map(([label, family], j) => (
        <button
          key={label}
          onClick={() => set(j)}
          style={{
            font: `13px ${family}`,
            padding: "3px 7px",
            background: i === j ? "#e8c27e" : "#1a1f36",
            color: i === j ? "#1a1f36" : "#f0e6cf",
            border: "1px solid #d9b47799",
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ position: "fixed", left: 8, bottom: 8, zIndex: 99999, font: "11px system-ui", color: "#f0e6cf" }}>
      {open && (
        <div style={{ background: "#080b1aee", border: "1px solid #d9b47799", padding: 8, marginBottom: 4, maxWidth: 420 }}>
          <div>Display / names (--serif)</div>
          {row(SERIFS, s, (j) => setPick([j, n, m]))}
          <div>Body (--sans)</div>
          {row(SANS, n, (j) => setPick([s, j, m]))}
          <div>Intro card title</div>
          {row(MARKS, m, (j) => setPick([s, n, j]))}
        </div>
      )}
      <button onClick={() => setOpen(!open)} style={{ font: "11px system-ui", padding: "2px 6px", opacity: 0.7 }}>
        Aa
      </button>
    </div>
  );
}
