import {
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { ChevronDown, ScrollText } from "lucide-react";
import { PHONE_QUERY } from "./use-phone";
export function turnTime(clock: number) {
  const day = Math.floor(clock / 86400) + 1,
    h = Math.floor(clock / 3600) % 24,
    m = Math.floor(clock / 60) % 60;
  return `Day ${day}, ${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}
/** Rises from the footprint of the action input, which stays where it is. */
export function NarratorPanel({
  anchor,
  open,
  busy,
  error,
  last,
  onClose,
  onLog,
}: {
  anchor: RefObject<HTMLElement | null>;
  open: boolean;
  busy: boolean;
  error: string;
  last?: { input: string; text: string };
  onClose: () => void;
  onLog: () => void;
}) {
  const [style, setStyle] = useState<CSSProperties>();
  useLayoutEffect(() => {
    const place = () => {
      const a = anchor.current,
        pane = a?.closest(".world-pane");
      if (!a || !pane) return;
      const r = a.getBoundingClientRect(),
        p = pane.getBoundingClientRect();
      // The action input is a narrow slot on a phone; a column that shape puts
      // three words on a line and covers the stick. Take the whole pane there.
      if (window.matchMedia?.(PHONE_QUERY).matches)
        setStyle({
          left: 0,
          width: (pane as HTMLElement).clientWidth,
          bottom: p.bottom - r.top,
        });
      else
        setStyle({
          left: r.left - p.left,
          width: r.width,
          bottom: p.bottom - r.top,
        });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [anchor, open]);
  return (
    <section
      className={`narrator-panel${open ? " open" : ""}`}
      style={style}
      aria-label="Narrator"
      aria-hidden={!open}
    >
      <header>
        <span className="narrator-title">
          <i aria-hidden="true">✦</i> Narrator
        </span>
        <span className="narrator-tools">
          <button
            aria-label="Narration log"
            title="Narration log"
            onClick={onLog}
          >
            <ScrollText size={17} />
          </button>
          <button aria-label="Close narrator" onClick={onClose}>
            <ChevronDown size={19} />
          </button>
        </span>
      </header>
      <div className="narrator-body">
        {busy ? (
          <p className="narrator-busy" aria-live="polite">
            <span />
            <span />
            <span />
          </p>
        ) : error ? (
          <p className="narrator-error">{error}</p>
        ) : last ? (
          <>
            <p className="narrator-said">{last.input}</p>
            <p>{last.text}</p>
          </>
        ) : (
          <p className="narrator-hint">
            Say what you try to do. The narrator tells you what comes of it.
          </p>
        )}
      </div>
    </section>
  );
}
