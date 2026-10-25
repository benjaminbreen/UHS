import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Compass, History, Info, MessageCircle, X } from "lucide-react";
import type { GameEvent } from "../core/types";

const LIFE_MS = 4200;
type Notice = GameEvent & { count: number };
const icons = { action: ArrowRight, social: MessageCircle, world: Compass, system: Info };

function Toast({ event, paused, onRemove }: { event: Notice; paused: boolean; onRemove: (id: number) => void }) {
  const [leaving, setLeaving] = useState(false);
  const remaining = useRef(Math.min(10000, LIFE_MS + Math.max(0, event.text.length - 70) * 35));
  useEffect(() => {
    if (paused || leaving) return;
    const start = performance.now();
    const timer = setTimeout(() => setLeaving(true), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (performance.now() - start));
    };
  }, [paused, leaving]);
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => onRemove(event.id), 220);
    return () => clearTimeout(timer);
  }, [leaving, event.id, onRemove]);
  const Icon = icons[event.kind];
  return (
    <div className="toast" data-kind={event.kind} data-leaving={leaving || undefined}>
      <div className="toast-clip">
        <div className="toast-body">
          <Icon size={17} className="toast-icon" aria-hidden="true" />
          <span className="toast-text">{event.text}{event.count > 1 && <small className="toast-count" aria-label={`${event.count} times`}>×{event.count}</small>}</span>
          <button className="toast-dismiss" aria-label="Dismiss notification" onClick={() => setLeaving(true)}><X size={14} /></button>
        </div>
      </div>
    </div>
  );
}

/** New events surface briefly at the top of the world, newest first. */
export function Toasts({ events, omit, space, home, onHistory }: {
  events: GameEvent[];
  omit: (string | undefined)[];
  space?: string;
  home?: string;
  onHistory: () => void;
}) {
  const [shown, setShown] = useState<Notice[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Events already in the log when the page opened are not news.
  const seen = useRef(events.at(-1)?.id ?? -1);
  const previousSpace = useRef(space);
  const homeId = useRef(-1);
  const last = events.at(-1);
  const omissionKey = omit.join("\0");
  const remove = useCallback((id: number) => setShown((s) => s.filter((e) => e.id !== id)), []);
  useEffect(() => {
    if (!root.current?.contains(document.activeElement)) setFocused(false);
    if (!root.current?.matches(":hover")) setHovered(false);
  }, [shown]);
  useEffect(() => {
    const entered = previousSpace.current !== space && space === home;
    previousSpace.current = space;
    if (entered) {
      const event: Notice = { id: homeId.current--, time: 0, text: "Your home", kind: "world", count: 1 };
      setShown((s) => [event, ...s.filter((e) => e.text !== event.text)].slice(0, 3));
    }
  }, [space, home]);
  useEffect(() => {
    const fresh = events.filter((e) => e.id > seen.current);
    if (fresh.length) seen.current = fresh.at(-1)!.id;
    setShown((shown) => {
      let next = shown.filter((e) => !omit.includes(e.text));
      for (const e of fresh) {
        if (omit.includes(e.text)) continue;
        const previous = next.find((t) => t.text === e.text);
        next = [{ ...e, count: (previous?.count ?? 0) + 1 }, ...next.filter((t) => t.text !== e.text)];
      }
      return next.slice(0, 3);
    });
  }, [last?.id, omissionKey]);
  return (
    <div ref={root} className="toasts" aria-label="Notifications"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false); }}>
      <div className="toast-list" role="status" aria-live="polite" aria-relevant="additions text">
        {shown.filter((t) => !omit.includes(t.text)).map((event) => <Toast key={event.id} event={event} paused={hovered || focused} onRemove={remove} />)}
      </div>
      {shown.length > 0 && <button className="toasts-history" onClick={onHistory}><History size={13} />Recent events</button>}
    </div>
  );
}
