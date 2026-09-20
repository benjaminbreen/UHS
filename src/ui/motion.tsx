import { useEffect, useRef, useState, type RefObject } from "react";
import { gameAudio } from "../audio/director";
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
  sound = true,
  /** Called with each letter as it lands, for a mouth to follow. */
  onLetter?: (letter: string) => void,
) {
  // Read through a ref so a fresh closure each render does not restart the
  // line, which would type the first word over and over.
  const letter = useRef(onLetter);
  letter.current = onLetter;
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
      if (sound && /\S/.test(ch)) void gameAudio()?.effect("blip");
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
  }, [text, sound]);
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

/** Whatever has just come into the bag flies from the player to the bag
 * button, which takes it with a bounce and says how many. */
export function BagFlights({
  inventory,
  world,
  from,
  bag: button,
  fallback,
  sprite,
}: {
  inventory: Inventory;
  /** Changes when the world does, so a fresh bag is not read as a haul. */
  world: string;
  from: RefObject<HTMLElement | null>;
  bag: RefObject<HTMLElement | null>;
  /** Where things land when the bag button is folded away, as on a phone. */
  fallback?: RefObject<HTMLElement | null>;
  sprite: (item: string) => string | undefined;
}) {
  const shown = (ref?: RefObject<HTMLElement | null>) =>
    ref?.current?.getBoundingClientRect().width ? ref : undefined;
  const bag = shown(button) ?? shown(fallback) ?? button;
  const before = useRef<{ world: string; bag: Inventory }>(undefined);
  const serial = useRef(0);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [gained, setGained] = useState<{ id: number; n: number }>();
  useEffect(() => {
    const last = before.current;
    before.current = { world, bag: { ...inventory } };
    if (!last || last.world !== world || calm()) return;
    const gains = Object.entries(inventory)
      .map(([item, n]) => ({ item, count: (n ?? 0) - (last.bag[item] ?? 0) }))
      .filter((g) => g.count > 0)
      .slice(0, 4);
    const a = from.current?.getBoundingClientRect(),
      b = bag.current?.getBoundingClientRect();
    if (!gains.length || !a || !b) return;
    const x = a.left + a.width / 2,
      y = a.top + a.height / 2 - 20;
    const made = gains.map((g, i) => ({
      ...g,
      id: ++serial.current,
      x,
      y,
      dx: b.left + b.width / 2 - x,
      dy: b.top + b.height / 2 - y,
      delay: i * 90,
    }));
    setFlights((f) => [...f, ...made]);
    const total = gains.reduce((n, g) => n + g.count, 0);
    const land = window.setTimeout(
      () => {
        setGained({ id: serial.current, n: total });
        bag.current?.classList.remove("bag-bounce");
        // Reflow, so a second haul in quick succession bounces again.
        void bag.current?.offsetWidth;
        bag.current?.classList.add("bag-bounce");
        setFlights((f) => f.filter((x) => !made.includes(x)));
      },
      520 + (made.length - 1) * 90,
    );
    return () => window.clearTimeout(land);
    // Keyed on the bag's contents, not the object, which is new every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(inventory), world]);
  useEffect(() => {
    if (!gained) return;
    const t = window.setTimeout(() => setGained(undefined), 1100);
    return () => window.clearTimeout(t);
  }, [gained]);
  const at = bag.current?.getBoundingClientRect();
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
          <ItemIcon id={f.item} sprite={sprite(f.item)} scale={1} />
        </span>
      ))}
      {gained && at && (
        <span
          key={gained.id}
          className="bag-gain"
          style={{ left: at.left + at.width - 18, top: at.top - 6 }}
        >
          +{gained.n}
        </span>
      )}
    </>
  );
}

/** An on-screen key prompt. It slides in when what it offers changes, and
 * goes down with the key it stands for. */
export function KeyPrompt({
  code,
  letter,
  label,
  className,
  onClick,
}: {
  code: string;
  letter: string;
  label: string;
  className?: string;
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
      onClick={onClick}
    >
      <kbd>{letter}</kbd>
      {" · "}
      {label}
    </button>
  );
}
