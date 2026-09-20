import { useEffect, useMemo, useRef, type RefObject } from "react";
import type { CharacterAppearance } from "../core/character";
import { drawCharacter } from "../render/characters/renderers";
import {
  drawConstructedPortrait,
  PORTRAIT_HEIGHT,
  PORTRAIT_WIDTH,
  type Blink,
  type Expression,
  type Viseme,
} from "../render/portraits/constructed";

type PortraitSource = {
  source: HTMLCanvasElement;
  x0: number;
  y0: number;
  width: number;
  height: number;
};
const sources = new Map<string, PortraitSource>();
const SOURCE_LIMIT = 192;
function portraitSource(appearance: CharacterAppearance, key: string) {
  const cached = sources.get(key);
  if (cached) {
    sources.delete(key);
    sources.set(key, cached);
    return cached;
  }
  const source = document.createElement("canvas");
  source.width = source.height = 80;
  const ctx = source.getContext("2d", { willReadFrequently: true })!;
  drawCharacter(ctx, appearance, 2, "idle", 0);
  const pixels = ctx.getImageData(0, 0, 80, 80).data;
  let x0 = 80,
    y0 = 80,
    x1 = 0,
    y1 = 0;
  for (let y = 0; y < 80; y++)
    for (let x = 0; x < 80; x++)
      if (pixels[(y * 80 + x) * 4 + 3]) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  const width = x1 - x0 + 1,
    height = y1 - y0 + 1;
  const result = { source, x0, y0, width, height };
  sources.set(key, result);
  if (sources.size > SOURCE_LIMIT) sources.delete(sources.keys().next().value!);
  return result;
}

const portraits = new Map<string, HTMLCanvasElement>();
/** Region of the 64×80 bust shown in the UI: hair top to the shoulders. */
const CROP = { x: 2, y: 2, w: 60, h: 70 };
/**
 * Three-quarter bust from the same recipe, cached per appearance, age and
 * blink frame. A blink is then two drawImage calls, not a re-render: the shut
 * frame is only ever painted for the faces that actually blink.
 */
function portraitCanvas(
  appearance: CharacterAppearance,
  age: number,
  key: string,
  blink: Blink = 0,
  speaking = false,
  expression: Expression = "neutral",
  intensity = 1,
  viseme: Viseme = "narrow",
  glance = 0,
) {
  const resting = expression === "neutral" || intensity === 0;
  const id =
    blink || speaking || !resting || glance
      ? `${key}|${blink}${speaking ? `s${viseme[0]}` : ""}${glance}${resting ? "" : `${expression}${intensity}`}`
      : key;
  const cached = portraits.get(id);
  if (cached) {
    portraits.delete(id);
    portraits.set(id, cached);
    return cached;
  }
  const source = document.createElement("canvas");
  source.width = PORTRAIT_WIDTH;
  source.height = PORTRAIT_HEIGHT;
  drawConstructedPortrait(source.getContext("2d")!, appearance, age, {
    blink,
    speaking,
    expression,
    intensity,
    viseme,
    glance,
  });
  portraits.set(id, source);
  if (portraits.size > SOURCE_LIMIT)
    portraits.delete(portraits.keys().next().value!);
  return source;
}

/** Shut for about this long, with the half-lidded frame either side of it. */
const SHUT_MS = 90;
const LID_MS = 45;
const GAP_MIN = 5000;
const GAP_SPAN = 5000;

/** UI and world read the identical appearance recipe; no legacy portrait lookup. */
export function CharacterSprite({
  appearance,
  portrait = false,
  age = 30,
  scale = 1,
  speaking = false,
  expression = "neutral",
  viseme,
}: {
  appearance: CharacterAppearance;
  portrait?: boolean;
  /** Ages the portrait: children and elders draw differently. */
  age?: number;
  /** Multiplies the drawn size only; the raster stays at native pixels. */
  scale?: number;
  /** Portraits only: the mouth works while this is set. */
  speaking?: boolean;
  /** Portraits only: what the face is doing. Changing it plays the change. */
  expression?: Expression;
  /**
   * Portraits only: which mouth shape to hold while speaking, written by
   * whoever is producing the words. A ref rather than a prop value, because
   * a letter arrives every few dozen milliseconds and re-rendering the
   * conversation that often to move a lip is not a trade worth making.
   */
  viseme?: RefObject<Viseme>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  // The key is the identity of the drawing. Deriving it here rather than
  // inside the effect keeps the blink timer from restarting every time the
  // parent re-renders with an equal-but-new appearance object.
  const key = useMemo(
    () =>
      portrait
        ? `${age}:${JSON.stringify(appearance)}`
        : JSON.stringify(appearance),
    [appearance, portrait, age],
  );
  // Equal key means an identical drawing, so the effect can depend on the key
  // alone and read the latest record through a ref. Depending on `appearance`
  // would restart the timer on every parent render and it would never blink.
  const latest = useRef({ appearance, age });
  latest.current = { appearance, age };
  // Set by the effect while the timer is live, so a click can interrupt it.
  // Left null under reduced motion, which is what makes the click a no-op too.
  const poke = useRef<(() => void) | null>(null);
  // The mouth and the lids move on their own clocks and share one canvas.
  const lids = useRef<Blink>(0);
  const mouth = useRef(false);
  const glance = useRef(0);
  const repaint = useRef<(() => void) | null>(null);
  // The pose being drawn right now, which trails the prop while the change
  // plays out.
  const shown = useRef<{ expression: Expression; intensity: number }>({
    expression,
    intensity: 1,
  });
  useEffect(() => {
    if (!portrait || !speaking) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // With a viseme to follow, the shape is the letter's and the only job
    // here is to sample it often enough to keep up. Without one, the mouth
    // works on its own uneven clock so it reads as talk rather than chewing.
    let timer = 0;
    const led = !!viseme;
    const flap = () => {
      mouth.current = led ? true : !mouth.current;
      repaint.current?.();
      timer = window.setTimeout(
        flap,
        led ? 55 : mouth.current ? 90 : 60 + Math.random() * 110,
      );
    };
    flap();
    return () => {
      window.clearTimeout(timer);
      mouth.current = false;
      repaint.current?.();
    };
  }, [speaking, portrait, viseme]);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const { appearance, age } = latest.current;
    const out = canvas.getContext("2d")!;
    out.imageSmoothingEnabled = false;
    const paint = (blink: Blink = lids.current) => {
      lids.current = blink;
      out.clearRect(0, 0, canvas.width, canvas.height);
      if (portrait) {
        // Bust crop at two whole pixels per native pixel.
        out.drawImage(
          portraitCanvas(
            appearance,
            age,
            key,
            blink,
            mouth.current,
            shown.current.expression,
            shown.current.intensity,
            viseme?.current ?? "narrow",
            glance.current,
          ),
          CROP.x,
          CROP.y,
          CROP.w,
          CROP.h,
          0,
          0,
          CROP.w * 2,
          CROP.h * 2,
        );
      } else {
        const { source, x0, y0, width, height } = portraitSource(
          appearance,
          key,
        );
        out.drawImage(
          source,
          x0,
          y0,
          width,
          height,
          Math.floor((32 - width) / 2),
          40 - height,
          width,
          height,
        );
      }
    };
    paint(0);
    repaint.current = () => paint();
    if (!portrait) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let timer = 0;
    const at = (ms: number, then: () => void) => {
      timer = window.setTimeout(then, ms);
    };
    // Now and then a second blink follows close behind the first, which is
    // what stops the loop reading as a metronome.
    const blink = (again: boolean) =>
      at(LID_MS, () => {
        paint(1);
        at(LID_MS, () => {
          paint(2);
          at(SHUT_MS, () => {
            paint(1);
            at(LID_MS, () => {
              paint(0);
              if (again) blink(false);
              else wait();
            });
          });
        });
      });
    // Between blinks the eyes wander. One pixel, held for about a second:
    // it is the difference between a portrait and a portrait staring.
    const look = (then: () => void) => {
      glance.current = Math.random() < 0.5 ? -1 : 1;
      paint();
      at(700 + Math.random() * 700, () => {
        glance.current = 0;
        paint();
        then();
      });
    };
    const wait = () =>
      at(GAP_MIN + Math.random() * GAP_SPAN, () =>
        Math.random() < 0.45
          ? look(() => blink(Math.random() < 0.22))
          : blink(Math.random() < 0.22),
      );
    // A click gets a double blink, cutting short whatever was pending.
    poke.current = () => {
      window.clearTimeout(timer);
      paint(0);
      blink(true);
    };
    wait();
    return () => {
      poke.current = null;
      glance.current = 0;
      window.clearTimeout(timer);
    };
  }, [key, portrait]);
  // Changing expression plays through the resting face rather than cutting to
  // the new one: out of the old pose, into the new one, then all the way. At
  // three frames it is barely a fifth of a second, which is what makes a face
  // look like it changed its mind rather than like it was swapped.
  useEffect(() => {
    if (!portrait) return;
    if (shown.current.expression === expression && shown.current.intensity === 1)
      return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      shown.current = { expression, intensity: 1 };
      repaint.current?.();
      return;
    }
    const steps: { expression: Expression; intensity: number }[] = [];
    if (shown.current.expression !== "neutral")
      steps.push({ expression: shown.current.expression, intensity: 0.5 });
    if (expression !== "neutral") steps.push({ expression, intensity: 0.5 });
    steps.push({ expression, intensity: 1 });
    let timer = 0;
    let index = 0;
    const step = () => {
      shown.current = steps[index];
      repaint.current?.();
      if (++index < steps.length) timer = window.setTimeout(step, 55);
    };
    step();
    return () => window.clearTimeout(timer);
  }, [expression, portrait, key]);
  return (
    <canvas
      ref={ref}
      width={portrait ? CROP.w * 2 : 32}
      height={portrait ? CROP.h * 2 : 40}
      aria-label={portrait ? "Character appearance" : "Person appearance"}
      onClick={portrait ? () => poke.current?.() : undefined}
      data-skin={appearance.skin}
      style={{
        width: portrait ? "100%" : 24 * scale,
        height: portrait ? "100%" : 30 * scale,
        imageRendering: "pixelated",
        objectFit: "contain",
        flexShrink: 0,
      }}
    />
  );
}
