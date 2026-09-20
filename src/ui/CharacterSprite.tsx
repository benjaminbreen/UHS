import { useEffect, useMemo, useRef } from "react";
import type { CharacterAppearance } from "../core/character";
import { drawCharacter } from "../render/characters/renderers";
import {
  drawConstructedPortrait,
  PORTRAIT_HEIGHT,
  PORTRAIT_WIDTH,
  type Blink,
} from "../render/portraits/constructed";

type PortraitSource = {
  source: HTMLCanvasElement;
  x0: number;
  y0: number;
  width: number;
  height: number;
};
const sources = new Map<string, PortraitSource>();
const SOURCE_LIMIT = 128;
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
) {
  const id = blink || speaking ? `${key}|${blink}${speaking ? "s" : ""}` : key;
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
}: {
  appearance: CharacterAppearance;
  portrait?: boolean;
  /** Ages the portrait: children and elders draw differently. */
  age?: number;
  /** Multiplies the drawn size only; the raster stays at native pixels. */
  scale?: number;
  /** Portraits only: the mouth works while this is set. */
  speaking?: boolean;
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
  const repaint = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!portrait || !speaking) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Uneven, so it reads as talk rather than chewing.
    let timer = 0;
    const flap = () => {
      mouth.current = !mouth.current;
      repaint.current?.();
      timer = window.setTimeout(flap, mouth.current ? 90 : 60 + Math.random() * 110);
    };
    flap();
    return () => {
      window.clearTimeout(timer);
      mouth.current = false;
      repaint.current?.();
    };
  }, [speaking, portrait]);
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
          portraitCanvas(appearance, age, key, blink, mouth.current),
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
    const wait = () =>
      at(GAP_MIN + Math.random() * GAP_SPAN, () =>
        blink(Math.random() < 0.22),
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
      window.clearTimeout(timer);
    };
  }, [key, portrait]);
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
