import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronsUp,
  DoorOpen,
  Eye,
  Gift,
  GlassWater,
  Hammer,
  Hand,
  MessageCircle,
  Mountain,
  PersonStanding,
  Search,
  Sword,
  Target,
  TrainFront,
  type LucideIcon,
} from "lucide-react";
import type { Verb } from "../runtime/session";

const ICONS: Record<Verb["kind"], LucideIcon> = {
  talk: MessageCircle,
  pickup: Hand,
  strike: Sword,
  shoot: Target,
  throw: Target,
  drop: ArrowDownToLine,
  give: Gift,
  "set-down": ArrowDownToLine,
  look: Eye,
  drink: GlassWater,
  climb: Mountain,
  inspect: Search,
  door: DoorOpen,
  board: TrainFront,
  work: Hammer,
  use: Hand,
};

/** The scene's side of the controls. */
export type TouchTarget = {
  setTouchStick(stick?: { dx: number; dy: number; run: boolean; strength?: number }): void;
  touchJump(down: boolean): void;
  touchThrow(down: boolean): void;
  touchBow(down: boolean): void;
  touchAim(dx: number, dy: number): void;
  cancelAim(): void;
};

const RADIUS = 34;
const DEAD = 9;
const buzz = (ms = 8) => navigator.vibrate?.(ms);

/** A thumb stick on the left and what the hands can do on the right. A phone
 * has no F key to hold and no Shift, so the same holds live here: keep the
 * big button down to wind up, the throw button to aim, and Run to sprint. */
export function TouchControls({
  scene,
  enabled,
  primary,
  alternate,
  holding,
  onPrimaryDown,
  onPrimaryUp,
  onAlternate,
}: {
  scene: () => TouchTarget | undefined;
  enabled: boolean;
  primary?: Verb;
  alternate?: Verb;
  holding: boolean;
  onPrimaryDown: () => void;
  onPrimaryUp: () => void;
  onAlternate: () => void;
}) {
  const [knob, setKnob] = useState<{ x: number; y: number; run: boolean }>();
  const [running, setRunning] = useState(false);
  const sprint = useRef(false);
  const pointer = useRef<number | undefined>(undefined);
  const stick = useRef<{ dx: number; dy: number; run: boolean; strength: number } | undefined>(undefined);
  const latest = useRef({ scene, onPrimaryUp });
  latest.current = { scene, onPrimaryUp };
  const centre = useRef({ x: 0, y: 0 });
  const aimCentre = useRef({ x: 0, y: 0 });
  const releaseStick = () => {
    pointer.current = undefined;
    stick.current = undefined;
    setKnob(undefined);
    scene()?.setTouchStick(undefined);
  };
  const setSprint = (run: boolean) => {
    sprint.current = run;
    setRunning(run);
    setKnob((k) => k && { ...k, run });
    if (stick.current) {
      stick.current.run = run;
      scene()?.setTouchStick(stick.current);
    }
  };
  useEffect(() => {
    const cancel = () => {
      pointer.current = undefined;
      stick.current = undefined;
      sprint.current = false;
      setKnob(undefined);
      setRunning(false);
      const target = latest.current.scene();
      target?.setTouchStick(undefined);
      target?.touchJump(false);
      target?.cancelAim();
      latest.current.onPrimaryUp();
    };
    const visibility = () => { if (document.hidden) cancel(); };
    if (!enabled) cancel();
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancel();
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [enabled]);
  const steer = (e: PointerEvent<HTMLDivElement>) => {
    const x = e.clientX - centre.current.x,
      y = e.clientY - centre.current.y;
    const far = Math.hypot(x, y);
    const k = far > RADIUS ? RADIUS / far : 1;
    const run = sprint.current;
    setKnob({ x: x * k, y: y * k, run });
    if (far < DEAD) {
      stick.current = undefined;
      return scene()?.setTouchStick(undefined);
    }
    // Eight ways: the nearest of the compass points.
    const step = Math.round(Math.atan2(y, x) / (Math.PI / 4));
    stick.current = {
      dx: Math.round(Math.cos((step * Math.PI) / 4)),
      dy: Math.round(Math.sin((step * Math.PI) / 4)),
      run,
      strength: Math.min(1, (far - DEAD) / (RADIUS - DEAD)),
    };
    scene()?.setTouchStick(stick.current);
  };
  const hold = (down: () => void, up: () => void) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      buzz();
      down();
    },
    onPointerUp: up,
    onPointerCancel: up,
    onLostPointerCapture: up,
    onContextMenu: (e: { preventDefault(): void }) => e.preventDefault(),
  });
  const aimHold = (down: () => void, up: () => void) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const box = e.currentTarget.getBoundingClientRect();
      aimCentre.current = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      buzz();
      down();
    },
    onPointerMove: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.buttons) scene()?.touchAim(e.clientX - aimCentre.current.x, e.clientY - aimCentre.current.y);
    },
    onPointerUp: up,
    onPointerCancel: () => scene()?.cancelAim(),
    onLostPointerCapture: () => scene()?.cancelAim(),
    onContextMenu: (e: { preventDefault(): void }) => e.preventDefault(),
  });
  const Primary = primary ? ICONS[primary.kind] : Hand;
  const Alternate = alternate ? ICONS[alternate.kind] : ArrowUpFromLine;
  return (
    <div className="touch-controls" aria-label="Touch controls" hidden={!enabled} inert={!enabled}>
      <div
        className="touch-stick"
        aria-label="Movement joystick"
        data-run={knob?.run || undefined}
        onPointerDown={(e) => {
          if (pointer.current !== undefined) return;
          pointer.current = e.pointerId;
          centre.current = {
            x: e.clientX,
            y: e.clientY,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
          steer(e);
        }}
        onPointerMove={(e) => pointer.current === e.pointerId && steer(e)}
        onPointerUp={releaseStick}
        onPointerCancel={releaseStick}
        onLostPointerCapture={releaseStick}
        onContextMenu={(e) => e.preventDefault()}
      >
        <i
          style={knob && { transform: `translate(${knob.x}px, ${knob.y}px)` }}
        />
      </div>
      <div className="touch-actions">
        <button className="touch-small touch-run" aria-label="Run. Hold while moving" aria-pressed={running}
          {...hold(() => setSprint(true), () => setSprint(false))}>
          <PersonStanding size={18} /><span>Run</span>
        </button>
        <button
          className="touch-small"
          aria-label="Jump"
          {...hold(
            () => scene()?.touchJump(true),
            () => scene()?.touchJump(false),
          )}
        >
          <ChevronsUp size={18} />
        </button>
        {holding && primary?.kind !== "shoot" && (
          <button
            className="touch-small"
            aria-label="Throw. Hold to aim"
            {...aimHold(
              () => scene()?.touchThrow(true),
              () => scene()?.touchThrow(false),
            )}
          >
            <Target size={18} />
          </button>
        )}
        {alternate && (
          <button
            key={alternate.label}
            className="touch-small touch-alternate"
            aria-label={alternate.label}
            onClick={() => {
              buzz();
              onAlternate();
            }}
          >
            <Alternate size={18} />
          </button>
        )}
        {primary && (
          <button
            key={primary.label}
            className="touch-primary"
            data-kind={primary.kind}
            aria-label={primary.label}
            {...(primary.kind === "shoot"
              ? aimHold(() => scene()?.touchBow(true), () => scene()?.touchBow(false))
              : hold(onPrimaryDown, onPrimaryUp))}
          >
            <Primary size={24} />
            <small>{primary.label}</small>
          </button>
        )}
      </div>
    </div>
  );
}
