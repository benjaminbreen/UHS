import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ItemDef } from "../core/types";
import { dyes, parseCloth } from "../content/characters/wardrobe/cloth";
import { voxelTurn, voxelTurntable } from "../render/voxel-items";
import { ItemIcon } from "./components";

const SCALE = 3;
const QUALITY = ["Plain", "Good", "Fine", "Masterwork"];

export function itemKind(def: ItemDef) {
  if (def.wear) return `Worn · ${def.wear.slot}`;
  if (def.edible) return "Food";
  if (def.hand?.edge) return "Blade";
  if (def.hand?.strike) return "Tool";
  return "Goods";
}

/** An item held up to the light: it turns by itself, and drags round under
 * the pointer, sideways for its heading and up and down for its tilt. */
function Turntable({ id, fallback }: { id: string; fallback?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [sheet, setSheet] = useState<HTMLCanvasElement>();
  const turn = voxelTurn();
  useEffect(() => {
    let live = true;
    voxelTurntable(id)?.then((c) => live && setSheet(c));
    return () => {
      live = false;
    };
  }, [id]);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !sheet || !turn) return;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const { size, yaws, pitches } = turn;
    let yaw = 0,
      pitch = 1,
      spin = 1.4,
      held = false,
      last = performance.now(),
      idle = 0,
      frame = 0,
      drawn = "";
    const draw = () => {
      const col = ((Math.round(yaw) % yaws) + yaws) % yaws;
      const row = Math.round(pitch);
      const key = `${col},${row}`;
      if (key === drawn) return;
      drawn = key;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(sheet, col * size, row * size, size, size, 0, 0, size * SCALE, size * SCALE);
    };
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!held) {
        idle += dt;
        // A flick keeps turning and slows; left alone it settles to a drift.
        spin += ((idle > 1.5 ? 1.4 : 0) - spin) * Math.min(1, dt * (idle > 1.5 ? 0.8 : 2.5));
        yaw += spin * dt;
      }
      draw();
      frame = requestAnimationFrame(tick);
    };
    let px = 0,
      py = 0,
      pt = 0;
    const down = (e: PointerEvent) => {
      held = true;
      px = e.clientX;
      py = e.clientY;
      pt = performance.now();
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!held) return;
      const dx = e.clientX - px,
        dy = e.clientY - py,
        now = performance.now();
      yaw -= dx / 16;
      pitch = Math.max(0, Math.min(pitches.length - 1, pitch + dy / 70));
      spin = (-dx / 16 / Math.max(0.008, (now - pt) / 1000)) * 0.5;
      px = e.clientX;
      py = e.clientY;
      pt = now;
    };
    const up = () => {
      held = false;
      idle = 0;
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, [sheet, turn]);
  if (!turn) return <div className="inspect-flat"><ItemIcon id={id} sprite={fallback} scale={6} /></div>;
  return (
    <canvas
      ref={ref}
      className={`inspect-turn${sheet ? " is-ready" : ""}`}
      width={turn.size * SCALE}
      height={turn.size * SCALE}
      aria-label="Drag to turn the item"
    />
  );
}

export function ItemInspect({
  id,
  def,
  count,
  rarity,
  actions = [],
  onClose,
}: {
  id: string;
  def: ItemDef;
  count: number;
  rarity?: { label: string; color: string };
  /** The first answers to E. */
  actions?: { label: string; onClick: () => void }[];
  onClose: () => void;
}) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" || (e.key.toLowerCase() === "e" && actions[0])) {
        e.stopPropagation();
        if (e.key !== "Escape") actions[0].onClick();
        onClose();
      }
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [onClose, actions]);
  const cloth = parseCloth(id)?.cloth;
  const stats: [string, string][] = [["Value", String(def.value)]];
  if (cloth) {
    stats.push(["Cloth", cloth.material]);
    stats.push(["Dye", dyes[cloth.dye].name]);
    stats.push(["Make", QUALITY[Math.max(0, Math.min(3, cloth.quality))]]);
  }
  if (def.edible) stats.push(["Nourishes", `+${def.edible}`]);
  if (def.health) stats.push(["Health", `${def.health > 0 ? "+" : ""}${def.health}`]);
  if (def.hand?.strike) stats.push(["In hand", def.hand.edge ? "Cuts" : "Strikes"]);
  const traits = [def.flammable && "Burns", def.floats && "Floats"].filter(Boolean);
  return createPortal(
    <div className="inspect" role="dialog" aria-modal="true" data-modal="true" aria-label={def.name} onClick={onClose}>
      <div className="inspect-mist" aria-hidden="true" />
      <div className="inspect-stage" onClick={(e) => e.stopPropagation()}>
        <div className="inspect-plinth" aria-hidden="true" />
        <Turntable id={id} fallback={def.sprite} />
      </div>
      <section className="inspect-card" onClick={(e) => e.stopPropagation()}>
        {rarity && (
          <b className="inspect-rarity" style={{ color: rarity.color }}>
            {rarity.label}
          </b>
        )}
        <h2 className={def.name.length > 22 ? "is-long" : undefined}>{def.name}</h2>
        <p className="inspect-kind">
          {itemKind(def)}
          {count > 1 && <> · carrying {count}</>}
        </p>
        <div className="inspect-rule" aria-hidden="true">
          <i />
        </div>
        <dl className="inspect-stats">
          {stats.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        {def.description && <p className="inspect-desc">{def.description}</p>}
        {traits.length > 0 && <p className="inspect-traits">{traits.join(" · ")}</p>}
        <footer>
          {actions.map((a, i) => (
            <button
              key={a.label}
              className="inspect-action"
              onClick={() => {
                a.onClick();
                onClose();
              }}
            >
              {i === 0 && <kbd>E</kbd>}
              {a.label}
            </button>
          ))}
          <button className="inspect-action" onClick={onClose}>
            <kbd>Esc</kbd>
            Close
          </button>
        </footer>
      </section>
      <p className="inspect-hint" aria-hidden="true">
        Drag to turn
      </p>
    </div>,
    document.body,
  );
}
