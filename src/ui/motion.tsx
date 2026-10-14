import { useEffect, useRef, useState, type RefObject } from "react";
import { gameAudio } from "../audio/director";
import type { Sound } from "../audio/sfx";
import type { Inventory } from "../core/types";
import { ItemIcon } from "./components";

export const calm = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Text arriving a letter at a time, with a breath at punctuation and a soft
 * tick as it goes. `skip` shows the rest at once. */
export function useTypewriter(
  text: string,
  instant = false,
  /** True for the default patter, or a maker for this character's own voice. */
  sound: boolean | (() => Sound) = true,
  /** Called with each letter as it lands, for a mouth to follow. */
  onLetter?: (letter: string) => void,
) {
  // Read through a ref so a fresh closure each render does not restart the
  // line, which would type the first word over and over.
  const letter = useRef(onLetter);
  letter.current = onLetter;
  const voice = useRef(sound);
  voice.current = sound;
  const [shown, setShown] = useState(instant || calm() ? text.length : 0);
  useEffect(() => {
    if (instant || calm()) {
      setShown(text.length);
      return;
    }
    setShown(0);
    let at = 0,
      timer = 0;
    const next = () => {
      at++;
      setShown(at);
      if (at >= text.length) return;
      const ch = text[at - 1];
      letter.current?.(ch);
      // The director spaces effects out itself, so this patters, not buzzes.
      const currentSound = voice.current;
      if (currentSound && /\S/.test(ch))
        void (typeof currentSound === "function"
          ? gameAudio()?.sound(currentSound(), "blip")
          : gameAudio()?.event("blip"));
      timer = window.setTimeout(
        next,
        /[.!?…]/.test(ch) ? 260 : /[,;:—]/.test(ch) ? 120 : 24,
      );
    };
    timer = window.setTimeout(next, 120);
    return () => window.clearTimeout(timer);
    // `instant` is read once, at the start of a line: it turns true as the
    // line finishes, and that must not restart anything.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return {
    text: text.slice(0, shown),
    done: shown >= text.length,
    skip: () => setShown(text.length),
  };
}

/** A bar that loses its chunk at once and lets the pale remainder drain after
 * a beat, so a loss can be read as a size. Gains simply grow. */
export function DrainBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const [ghost, setGhost] = useState(clamped);
  useEffect(() => {
    if (clamped >= ghost) {
      setGhost(clamped);
      return;
    }
    const t = window.setTimeout(() => setGhost(clamped), 420);
    return () => window.clearTimeout(t);
  }, [clamped, ghost]);
  return (
    <span className={`drain-bar ${className ?? ""}`}>
      <i className="drain-ghost" style={{ width: `${ghost}%` }} />
      <i className="drain-fill" style={{ width: `${clamped}%` }} />
    </span>
  );
}

type Flight = {
  id: number;
  item: string;
  count: number;
  dx: number;
  dy: number;
  x: number;
  y: number;
  delay: number;
};

/** Whatever has just come into the bag opens the inventory, then flies from
 * the player into its own row, which takes it with a pop and says how many.
 * The row waits dimmed until it lands. */
export function BagFlights({
  inventory,
  world,
  from,
  bag: button,
  fallback,
  sprite,
  onGain,
  slot,
}: {
  inventory: Inventory;
  /** Changes when the world does, so a fresh bag is not read as a haul. */
  world: string;
  from: RefObject<HTMLElement | null>;
  bag: RefObject<HTMLElement | null>;
  /** Where things land when the bag button is folded away, as on a phone. */
  fallback?: RefObject<HTMLElement | null>;
  sprite: (item: string) => string | undefined;
  onGain?: () => void;
  /** The inventory row an item belongs in, when it is on screen. */
  slot?: (item: string) => HTMLElement | null;
}) {
  const shown = (ref?: RefObject<HTMLElement | null>) =>
    ref?.current?.getBoundingClientRect().width ? ref : undefined;
  const bag = shown(button) ?? shown(fallback) ?? button;
  const before = useRef<{ world: string; bag: Inventory }>(undefined);
  const serial = useRef(0);
  const timers = useRef(new Set<number>());
  const [flights, setFlights] = useState<Flight[]>([]);
  const [gained, setGained] = useState<{ id: number; n: number; x: number; y: number }[]>([]);
  const later = (ms: number, fn: () => void) => {
    const t = window.setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  };
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  useEffect(() => {
    const last = before.current;
    before.current = { world, bag: { ...inventory } };
    if (!last || last.world !== world) return;
    const gains = Object.entries(inventory)
      .map(([item, n]) => ({ item, count: (n ?? 0) - (last.bag[item] ?? 0) }))
      .filter((g) => g.count > 0)
      .slice(0, 4);
    if (!gains.length) return;
    onGain?.();
    if (calm()) return;
    // The tab opens at once; the rows it shows wait for their goods.
    requestAnimationFrame(() => gains.forEach((g) => slot?.(g.item)?.classList.add("slot-arriving")));
    // Long enough for the pickup in the world to finish flying to the player.
    later(WORLD_SHOW_MS, () => {
      const a = from.current?.getBoundingClientRect();
      if (!a) return;
      const x = a.left + a.width / 2,
        y = a.top + a.height / 2 - 20;
      gains.forEach((g, i) => {
        const row = slot?.(g.item);
        const target = row?.querySelector(".inventory-well") ?? bag.current;
        const b = target?.getBoundingClientRect();
        if (!b) return row?.classList.remove("slot-arriving");
        const flight = {
          ...g,
          id: ++serial.current,
          x,
          y,
          dx: b.left + b.width / 2 - x,
          dy: b.top + b.height / 2 - y,
          delay: i * 110,
        };
        setFlights((f) => [...f, flight]);
        later(FLIGHT_MS + flight.delay, () => {
          setFlights((f) => f.filter((o) => o.id !== flight.id));
          const hit = row ?? bag.current;
          row?.classList.remove("slot-arriving");
          hit?.classList.remove(row ? "slot-pop" : "bag-bounce");
          // Reflow, so a second haul in quick succession pops again.
          void hit?.offsetWidth;
          hit?.classList.add(row ? "slot-pop" : "bag-bounce");
          const id = ++serial.current;
          setGained((all) => [...all, { id, n: g.count, x: b.right - 4, y: b.top - 4 }]);
          later(1100, () => setGained((all) => all.filter((o) => o.id !== id)));
        });
      });
    });
    // Keyed on the bag's contents, not the object, which is new every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(inventory), world]);
  return (
    <>
      {flights.map((f) => (
        <span
          key={f.id}
          className="bag-flight"
          style={
            {
              left: f.x,
              top: f.y,
              "--dx": `${f.dx}px`,
              "--dy": `${f.dy}px`,
              animationDelay: `${f.delay}ms`,
            } as object
          }
        >
          <ItemIcon id={f.item} sprite={sprite(f.item)} scale={2} />
        </span>
      ))}
      {gained.map((g) => (
        <span key={g.id} className="bag-gain" style={{ left: g.x, top: g.y }}>
          +{g.n}
        </span>
      ))}
    </>
  );
}
const WORLD_SHOW_MS = 900;
const FLIGHT_MS = 620;

/** An on-screen key prompt. It slides in when what it offers changes, and
 * goes down with the key it stands for. */
export function KeyPrompt({
  code,
  letter,
  label,
  className,
  kind,
  hold,
  onClick,
}: {
  code: string;
  letter: string;
  label: string;
  className?: string;
  kind?: string;
  /** When a held run began; the keycap's ring fills from then. */
  hold?: number;
  onClick: () => void;
}) {
  const [down, setDown] = useState(false);
  useEffect(() => {
    const press = (e: KeyboardEvent) => e.code === code && setDown(true);
    const release = (e: KeyboardEvent) => e.code === code && setDown(false);
    const drop = () => setDown(false);
    window.addEventListener("keydown", press);
    window.addEventListener("keyup", release);
    window.addEventListener("blur", drop);
    return () => {
      window.removeEventListener("keydown", press);
      window.removeEventListener("keyup", release);
      window.removeEventListener("blur", drop);
    };
  }, [code]);
  return (
    <button
      className={`key-prompt ${className ?? ""}`}
      data-down={down || undefined}
      data-kind={kind}
      data-holding={hold !== undefined || undefined}
      onClick={onClick}
    >
      <kbd>
        {letter}
        {hold !== undefined && <i className="key-ring" key={hold} />}
      </kbd>
      <span className="key-label">{label}</span>
    </button>
  );
}
