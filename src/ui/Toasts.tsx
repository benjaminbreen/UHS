import { useEffect, useRef, useState } from "react";
import type { GameEvent } from "../core/types";

const LIFE_MS = 4200;

/** New events surface briefly at the top of the world, newest first. */
export function Toasts({ events, omitText }: { events: GameEvent[]; omitText?: string }) {
  const [shown, setShown] = useState<(GameEvent & { leaving?: boolean })[]>([]);
  // Events already in the log when the page opened are not news.
  const seen = useRef(events.at(-1)?.id ?? -1);
  const last = events.at(-1);
  useEffect(() => {
    const fresh = events.filter((e) => e.id > seen.current);
    if (!fresh.length) return;
    seen.current = fresh.at(-1)!.id;
    setShown((s) => [...fresh.reverse(), ...s].filter((t, i, all) => all.findIndex((other) => other.text === t.text) === i).slice(0, 3));
    for (const e of fresh) {
      setTimeout(() => setShown((s) => s.map((t) => (t.id === e.id ? { ...t, leaving: true } : t))), LIFE_MS);
      setTimeout(() => setShown((s) => s.filter((t) => t.id !== e.id)), LIFE_MS + 400);
    }
  }, [last?.id]);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {shown.filter((t) => t.text !== omitText).map((t) => (
        <div key={t.id} className="toast" data-kind={t.kind} data-leaving={t.leaving || undefined}>
          <i />
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
