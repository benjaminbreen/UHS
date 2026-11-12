import { useEffect, useRef, useState } from "react";
import { gameAudio } from "../audio/director";
import { baby as voice, hum } from "../audio/sfx";
import { her, she, type Baby } from "../core/baby";
import type { CharacterAppearance } from "../core/character";
import { SETTLE_H, SETTLE_W, drawSettle } from "./settle-art";

/** A lullaby's notes by where it is sung: five tones, low in a woman's voice. */
const SCALES: Record<string, number[]> = {
  "east-asian": [220, 247, 294, 330, 370],
  "southeast-asian": [220, 233, 294, 330, 349],
  andean: [220, 262, 294, 330, 392],
  mesoamerican: [196, 220, 262, 294, 330],
};
const DEFAULT_SCALE = [175, 196, 220, 262, 294];
const TUNE = [2, 3, 4, 3, 2, 1, 2, 0, 2, 3, 4, 3, 2, 1, 0, 0];
const LIMIT_MS = 50_000;

/**
 * The night's settling. The baby breathes; hold as it breathes in and let go
 * as it breathes out, and the rocking carries it under. There is no bar: the
 * wrap, the eyes, the fire and the stars say how it is going.
 */
export function SettleScene({ baby, appearance, culture, onDone }: {
  baby: Baby;
  appearance: CharacterAppearance;
  culture?: string;
  onDone: (quality: number) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const held = useRef(false);
  const done = useRef(onDone);
  done.current = onDone;
  const [asleep, setAsleep] = useState(false);
  const finish = useRef<(q?: number) => void>(() => {});

  useEffect(() => {
    const ctx = canvas.current!.getContext("2d")!;
    const w = appearance.wearing;
    const look = { skin: appearance.skin, hair: appearance.hairColor, cloth: w.color, wrap: w.trim, head: w.headwear !== "none" ? w.headColor : undefined };
    const scale = SCALES[culture ?? ""] ?? DEFAULT_SCALE;
    const s = { phase: 0, sway: 0, calm: 0, stir: 0, match: 0, span: 0, half: 0, halves: 0, stirs: 0, note: 0, over: 0 };
    const start = performance.now();
    let last = start, frame = 0, ended = false;
    const end = (q?: number) => {
      if (ended) return;
      ended = true;
      cancelAnimationFrame(frame);
      done.current(q ?? Math.max(0, Math.min(1, s.calm - s.stirs * 0.04)));
    };
    finish.current = end;
    const tick = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      const period = 3000 + 1400 * s.calm;
      if (!s.over) {
        s.phase += dt / period;
        const half = Math.floor(s.phase * 2), want = half % 2 === 0;
        if (held.current === want) s.match += dt;
        s.span += dt;
        if (half !== s.half) {
          const ratio = s.match / Math.max(1, s.span);
          // The first breath is free: it is for watching.
          if (s.halves >= 2 && ratio < 0.4) {
            s.calm = Math.max(0, s.calm - 0.07);
            s.stirs++;
            s.stir = 1;
            void gameAudio()?.sound(voice.fuss(), "baby-fuss");
          } else if (ratio >= 0.55) {
            s.calm = Math.min(1, s.calm + 0.11);
            void gameAudio()?.sound(hum(scale[TUNE[s.note++ % TUNE.length]], s.calm > 0.6), "hum");
          }
          s.half = half;
          s.halves++;
          s.match = s.span = 0;
        }
        if (s.calm >= 1) {
          s.over = now;
          setAsleep(true);
          void gameAudio()?.sound(voice.sigh(), "baby-sigh");
        } else if (now - start > LIMIT_MS) return end();
      } else if (now - s.over > 2600) return end(Math.max(0.7, 1 - s.stirs * 0.06));
      s.sway += ((s.over ? 0 : held.current ? 1 : -1) - s.sway) * Math.min(1, dt / 420);
      s.stir = Math.max(0, s.stir - dt / 900);
      const breath = (1 - Math.cos(s.phase * 2 * Math.PI)) / 2;
      drawSettle(ctx, look, { breath: s.over ? 0.5 + Math.sin(now / 900) * 0.3 : breath, sway: s.sway, calm: s.calm, stir: s.stir, time: now });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const key = (down: boolean) => (e: KeyboardEvent) => {
      if (e.code === "Escape" && down) return end();
      if (e.code !== "Space" && e.code !== "KeyB") return;
      e.preventDefault();
      e.stopPropagation();
      held.current = down;
    };
    const press = key(true), release = key(false);
    window.addEventListener("keydown", press, true);
    window.addEventListener("keyup", release, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", press, true);
      window.removeEventListener("keyup", release, true);
    };
  }, [appearance, culture]);

  return (
    <div className="settle" data-modal="true" role="dialog" aria-modal="true" aria-label={`Settle ${baby.name} for the night`}
      onPointerDown={(e) => { if (!(e.target as HTMLElement).closest("button")) held.current = true; }}
      onPointerUp={() => (held.current = false)} onPointerCancel={() => (held.current = false)}>
      <div className="settle-frame" data-asleep={asleep || undefined}>
        <canvas ref={canvas} width={SETTLE_W} height={SETTLE_H} />
      </div>
      <p className="settle-line">
        {asleep ? `${baby.name} is asleep.` : `Night. ${baby.name} will not go down until ${she(baby)} is rocked.`}
      </p>
      {!asleep && (
        <p className="settle-hint">
          Hold <kbd>Space</kbd> as {she(baby)} breathes in. Let go as {she(baby)} breathes out.
        </p>
      )}
      {!asleep && <button className="settle-skip" onClick={() => finish.current()}>Lie down and let {her(baby)} fuss</button>}
    </div>
  );
}
