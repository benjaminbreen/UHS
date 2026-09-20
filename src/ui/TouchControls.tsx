import { useRef, useState, type PointerEvent } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronsUp,
  DoorOpen,
  Eye,
  Gift,
  GlassWater,
  Hand,
  MessageCircle,
  Mountain,
  Search,
  Sword,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { Verb } from "../runtime/session";

const ICONS: Record<Verb["kind"], LucideIcon> = {
  talk: MessageCircle,
  pickup: Hand,
  strike: Sword,
  throw: Target,
  drop: ArrowDownToLine,
  give: Gift,
  "set-down": ArrowDownToLine,
  look: Eye,
  drink: GlassWater,
  climb: Mountain,
  inspect: Search,
  door: DoorOpen,
};

/** The scene's side of the controls. */
export type TouchTarget = {
  setTouchStick(stick?: { dx: number; dy: number; run: boolean }): void;
  touchJump(down: boolean): void;
  touchThrow(down: boolean): void;
};

const RADIUS = 34;
const DEAD = 9;
const RUN_AT = 27;
const buzz = (ms = 8) => navigator.vibrate?.(ms);

/** A thumb stick on the left and what the hands can do on the right. A phone
 * has no F key to hold and no Shift, so the same holds live here: keep the
 * big button down to wind up, the throw button to aim, push the stick to its
 * rim to run. Shown only on touch-sized screens. */
export function TouchControls({
  scene,
  primary,
  alternate,
  holding,
  onPrimaryDown,
  onPrimaryUp,
  onAlternate,
}: {
  scene: () => TouchTarget | undefined;
  primary?: Verb;
  alternate?: Verb;
  holding: boolean;
  onPrimaryDown: () => void;
  onPrimaryUp: () => void;
  onAlternate: () => void;
}) {
  const [knob, setKnob] = useState<{ x: number; y: number; run: boolean }>();
  const centre = useRef({ x: 0, y: 0 });
  const steer = (e: PointerEvent<HTMLDivElement>) => {
    const x = e.clientX - centre.current.x,
      y = e.clientY - centre.current.y;
    const far = Math.hypot(x, y);
    const k = far > RADIUS ? RADIUS / far : 1;
    const run = far >= RUN_AT;
    setKnob({ x: x * k, y: y * k, run });
    if (far < DEAD) return scene()?.setTouchStick(undefined);
    // Eight ways: the nearest of the compass points.
    const step = Math.round(Math.atan2(y, x) / (Math.PI / 4));
    scene()?.setTouchStick({
      dx: Math.round(Math.cos((step * Math.PI) / 4)),
      dy: Math.round(Math.sin((step * Math.PI) / 4)),
      run,
    });
  };
  const hold = (down: () => void, up: () => void) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      buzz();
      down();
    },
    onPointerUp: up,
    onPointerCancel: up,
    onContextMenu: (e: { preventDefault(): void }) => e.preventDefault(),
  });
  const Primary = primary ? ICONS[primary.kind] : Hand;
  const Alternate = alternate ? ICONS[alternate.kind] : ArrowUpFromLine;
  return (
    <div className="touch-controls" aria-label="Touch controls">
      <div
        className="touch-stick"
        data-run={knob?.run || undefined}
        onPointerDown={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          centre.current = {
            x: box.left + box.width / 2,
            y: box.top + box.height / 2,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
          steer(e);
        }}
        onPointerMove={(e) => knob && steer(e)}
        onPointerUp={() => {
          setKnob(undefined);
          scene()?.setTouchStick(undefined);
        }}
        onPointerCancel={() => {
          setKnob(undefined);
          scene()?.setTouchStick(undefined);
        }}
      >
        <i
          style={knob && { transform: `translate(${knob.x}px, ${knob.y}px)` }}
        />
      </div>
      <div className="touch-actions">
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
        {holding && (
          <button
            className="touch-small"
            aria-label="Throw. Hold to aim"
            {...hold(
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
            {...hold(onPrimaryDown, onPrimaryUp)}
          >
            <Primary size={24} />
            <small>{primary.label}</small>
          </button>
        )}
      </div>
    </div>
  );
}
