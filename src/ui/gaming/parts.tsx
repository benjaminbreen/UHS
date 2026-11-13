import { useEffect, useRef, useState } from "react";
import type { CharacterAppearance } from "../../core/character";
import { SIDES, type Side } from "../../core/games/knucklebones";
import { cellOf, HOME, type UrMove, type UrSide, type UrState } from "../../core/games/ur";
import { CharacterSprite } from "../CharacterSprite";
import { boardCanvas, boneCanvas, BOARD_H, BOARD_W, cellAt, cellBox, dieCanvas, PIECE, pieceCanvas } from "./art";

export function Sprite({ src, scale, className }: { src: HTMLCanvasElement; scale: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current!.getContext("2d")!;
    ctx.clearRect(0, 0, src.width, src.height);
    ctx.drawImage(src, 0, 0);
  }, [src]);
  return <canvas ref={ref} className={`g-pixel ${className ?? ""}`} width={src.width} height={src.height} style={{ width: src.width * scale, height: src.height * scale }} />;
}

/** Four bones; while `tumbling`, they flicker through their sides and roll. */
export function BoneThrow({ bones, scale, tumbling }: { bones?: Side[]; scale: number; tumbling?: boolean }) {
  const [flicker, setFlicker] = useState(0);
  useEffect(() => {
    if (!tumbling) return;
    const t = window.setInterval(() => setFlicker((n) => n + 1), 90);
    return () => window.clearInterval(t);
  }, [tumbling]);
  if (!bones) return <div className="g-bones is-empty" style={{ height: 12 * scale }} />;
  return (
    <div className={`g-bones${tumbling ? " is-tumbling" : ""}`}>
      {bones.map((side, i) => (
        <span key={i} style={{ ["--i" as string]: i }}>
          <Sprite src={boneCanvas(tumbling ? SIDES[(flicker + i * 3) % 4] : side)} scale={scale} />
        </span>
      ))}
    </div>
  );
}

export function Dice({ roll, scale, tumbling }: { roll?: { dice: boolean[]; total: number }; scale: number; tumbling?: boolean }) {
  const [flicker, setFlicker] = useState(0);
  useEffect(() => {
    if (!tumbling) return;
    const t = window.setInterval(() => setFlicker((n) => n + 1), 80);
    return () => window.clearInterval(t);
  }, [tumbling]);
  const dice = roll?.dice ?? [false, false, false, false];
  return (
    <div className={`g-dice${tumbling ? " is-tumbling" : ""}${roll ? "" : " is-idle"}`}>
      {dice.map((d, i) => (
        <span key={i} style={{ ["--i" as string]: i }}>
          <Sprite src={dieCanvas(tumbling ? (flicker + i) % 3 === 0 : d)} scale={scale} />
        </span>
      ))}
    </div>
  );
}

const GOLD = "#f2c35b";

/** The board with both sides' pieces; your movable pieces ringed, their landing squares marked on hover. */
export function UrBoard({ game, moves, onMove, scale }: { game: UrState; moves: UrMove[]; onMove: (m: UrMove) => void; scale: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<UrMove>();
  useEffect(() => {
    const ctx = ref.current!.getContext("2d")!;
    ctx.clearRect(0, 0, BOARD_W, BOARD_H);
    ctx.drawImage(boardCanvas(), 0, 0);
    for (const side of [0, 1] as UrSide[])
      for (const pos of game.pieces[side]) {
        const box = cellBox(side, pos);
        if (!box) continue;
        const x = box.x + (box.size - PIECE) / 2;
        const y = box.y + (box.size - PIECE) / 2;
        ctx.filter = "brightness(0)";
        ctx.globalAlpha = 0.45;
        ctx.drawImage(pieceCanvas(side), x + 1, y + 2);
        ctx.filter = "none";
        ctx.globalAlpha = 1;
        ctx.drawImage(pieceCanvas(side), x, y - 1);
      }
    ctx.fillStyle = GOLD;
    for (const m of moves) {
      const box = cellBox(0, m.from);
      if (box) ring(ctx, box.x, box.y, box.size);
    }
    const target = hover && cellBox(0, hover.to);
    if (target) {
      ctx.globalAlpha = 0.55;
      ctx.drawImage(pieceCanvas(0), target.x + (target.size - PIECE) / 2, target.y + (target.size - PIECE) / 2);
      ctx.globalAlpha = 1;
      ring(ctx, target.x, target.y, target.size);
    }
  }, [game, moves, hover]);
  const pick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const at = cellAt(((e.clientX - r.left) / r.width) * BOARD_W, ((e.clientY - r.top) / r.height) * BOARD_H);
    if (!at) return;
    const same = (pos: number) => cellOf(0, pos)?.row === at.row && cellOf(0, pos)?.col === at.col;
    return moves.find((m) => same(m.from)) ?? moves.find((m) => same(m.to));
  };
  return (
    <canvas
      ref={ref}
      className="g-pixel g-board"
      width={BOARD_W}
      height={BOARD_H}
      style={{ width: BOARD_W * scale, height: BOARD_H * scale, cursor: hover ? "pointer" : "default" }}
      onMouseMove={(e) => setHover(pick(e))}
      onMouseLeave={() => setHover(undefined)}
      onClick={(e) => {
        const m = pick(e);
        if (m) {
          setHover(undefined);
          onMove(m);
        }
      }}
    />
  );
}

function ring(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillRect(x, y, size, 1);
  ctx.fillRect(x, y + size - 1, size, 1);
  ctx.fillRect(x, y, 1, size);
  ctx.fillRect(x + size - 1, y, 1, size);
}

/** Pieces off the board: those still to enter, or those borne off. */
export function Pool({ side, game, where, scale, move, onMove }: { side: UrSide; game: UrState; where: "waiting" | "home"; scale: number; move?: UrMove; onMove?: (m: UrMove) => void }) {
  const n = game.pieces[side].filter((p) => (where === "home" ? p === HOME : p === 0)).length;
  return (
    <button className={`g-pool${move ? " is-live" : ""}`} disabled={!move} onClick={() => move && onMove?.(move)} aria-label={`${n} ${where}`}>
      {Array.from({ length: n }, (_, i) => (
        <Sprite key={i} src={pieceCanvas(side)} scale={scale} />
      ))}
      {n === 0 && <small>none {where}</small>}
    </button>
  );
}

export function Coins({ n, max = 18 }: { n: number; max?: number }) {
  return (
    <span className="g-coins" aria-label={`${n}`}>
      {Array.from({ length: Math.min(n, max) }, (_, i) => (
        <i key={i} style={{ ["--i" as string]: i }} />
      ))}
    </span>
  );
}

export function Face({ appearance, age, scale = 2 }: { appearance: CharacterAppearance; age: number; scale?: number }) {
  return <CharacterSprite appearance={appearance} portrait age={age} scale={scale} facing="front" motion="npc" />;
}
