import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CharacterSprite, npcFacing } from "./CharacterSprite";
import { formatHistoricalYear } from "../core/calendar";
import { seasonAt } from "../core/livelihood";
import { sexOf } from "../core/brief";
import { kinOf } from "../core/kin";
import { plotLine, plotTemplate, type PlotCard as Card } from "../core/plot";
import { ROLE_NAMES } from "../content/plots";
import type { PlotLook } from "../content/plots/types";
import { gameAudio } from "../audio/director";
import { drawEmblem, EMBLEM_H, EMBLEM_W } from "./plot-emblems";
import type { Runtime } from "../runtime/session";
import "./plot-card.css";

type Member = { id: string; name: string; role: string; line: string; mark: "kin" | "plot" };

const KIN: Record<string, [string, string, string]> = {
  partner: ["Wife", "Husband", "Partner"],
  child: ["Daughter", "Son", "Child"],
  parent: ["Mother", "Father", "Parent"],
  sibling: ["Sister", "Brother", "Sibling"],
};
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Who the staged version introduces: the plot's people, then the player's own. */
function castOf(runtime: Runtime): Member[] {
  const s = runtime.engine.state, plot = s.plot;
  const byId = new Map(s.actors.map((a) => [a.id, a]));
  const drawn: Member[] = plot
    ? Object.entries(plot.cast).flatMap(([role, id]) => {
        const a = byId.get(id);
        return a ? [{ id, name: a.name, role: ROLE_NAMES[role as keyof typeof ROLE_NAMES] ?? role, line: plotLine(plot, `cast-${role}`), mark: "plot" as const }] : [];
      })
    : [];
  const kin = kinOf(s).flatMap(({ actor: a, kind }) => {
    const names = KIN[kind];
    if (drawn.some((m) => m.id === a.id)) return [];
    const sex = sexOf(a);
    const role = names[sex === "female" ? 0 : sex === "male" ? 1 : 2];
    return [{ id: a.id, name: a.name, role, line: `Your ${role.toLowerCase()}${a.age === undefined ? "" : `, ${a.age}`}.`, mark: "kin" as const }];
  });
  return [...drawn, ...kin].slice(0, 6);
}

function Emblem({ look, marks, ending }: { look: PlotLook; marks: number; ending?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current!.getContext("2d")!;
    const start = performance.now();
    let frame = 0, wait = 0;
    const draw = (now: number) => {
      const t = still() ? 1e5 : now - start;
      drawEmblem(ctx, look, t, { marks, ending });
      if (still()) return;
      // Past the opening only the flame moves, and it needs a few frames a second.
      if (t < 5000) frame = requestAnimationFrame(draw);
      else wait = window.setTimeout(() => (frame = requestAnimationFrame(draw)), 110);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(wait);
    };
  }, [look, marks, ending]);
  return <canvas ref={ref} className="plot-emblem" width={EMBLEM_W} height={EMBLEM_H} aria-hidden="true" />;
}

// A pointing hand at native pixels: X outline, W glove, s its shade.
const HAND = [
  "...XXXXX......",
  "..XWWWWWXXXXX.",
  "XXWWWWWWWWWWWX",
  "XsWWWWWWXXXXX.",
  "XsWWWWWWWX....",
  "XsWWWWWWX.....",
  "XXsWWWWWX.....",
  "..XssssX......",
  "...XXXX.......",
];
function Hand() {
  return (
    <svg className="plot-hand" viewBox="0 0 14 9" width="28" height="18" aria-hidden="true" shapeRendering="crispEdges">
      {HAND.flatMap((row, y) => [...row].flatMap((c, x) =>
        c === "." ? [] : [<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" className={`hand-${c}`} />]))}
    </svg>
  );
}

/** Choices as a menu of words with the hand beside the one in play, the way
 * the old console games asked. The first `primary` choice takes focus. */
function Choices({ items, focus }: {
  items: { label: string; pick: () => void; primary?: boolean }[];
  focus: React.RefObject<HTMLButtonElement | null>;
}) {
  const first = Math.max(0, items.findIndex((i) => i.primary));
  const [on, setOn] = useState(first);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div
      className="plot-choices"
      role="group"
      onKeyDown={(e) => {
        const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        e.stopPropagation();
        refs.current[(on + step + items.length) % items.length]?.focus();
      }}
    >
      {items.map((item, i) => (
        <button
          key={item.label}
          ref={(el) => {
            refs.current[i] = el;
            if (i === first) focus.current = el;
          }}
          className="plot-choice"
          data-on={i === on || undefined}
          onMouseEnter={() => setOn(i)}
          onFocus={() => setOn(i)}
          onClick={item.pick}
        >
          {i === on && <Hand />}
          {item.label}
        </button>
      ))}
    </div>
  );
}

/** Text that types itself out with a voice under it; a press finishes it. */
function useTyped(text: string) {
  const [shown, setShown] = useState(() => (still() ? text.length : 0));
  useEffect(() => {
    if (shown >= text.length) return;
    const id = window.setTimeout(() => {
      setShown((n) => n + 1);
      if (shown % 3 === 0 && /\w/.test(text[shown])) void gameAudio()?.event("blip");
    }, /[,.;:?!”]/.test(text[shown - 1] ?? "") ? 170 : 26);
    return () => window.clearTimeout(id);
  }, [shown, text]);
  return [text.slice(0, shown), shown >= text.length, () => setShown(text.length)] as const;
}

export function PlotCard({ runtime, card, onLook, onAnswer, onClose }: {
  runtime: Runtime;
  card: Card;
  /** Points the camera at someone, or back at the player with none. */
  onLook: (id?: string) => void;
  /** Opens the conversation with whoever just spoke. */
  onAnswer: (id: string) => void;
  onClose: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const [staged, setStaged] = useState(false);
  const [step, setStep] = useState(0);
  const cast = useMemo(() => castOf(runtime), [runtime]);
  const begin = useRef<HTMLButtonElement>(null);
  const plot = runtime.engine.state.plot;
  const look = (plot && plotTemplate(plot)?.look) ?? {
    emblem: "slate" as const,
    palette: { ink: "#10141c", fill: "#1b2330", edge: "#4a3a2a", light: "#ece4d0", accent: "#b8483a" },
  };
  const colours = {
    "--ink": look.palette.ink,
    "--fill": look.palette.fill,
    "--edge": look.palette.edge,
    "--light": look.palette.light,
    "--accent": look.palette.accent,
  } as CSSProperties;
  const setting = runtime.engine.world.pack.setting;
  const season = setting && seasonAt(setting.season, runtime.engine.state.clock);
  const where = setting
    ? `${setting.location} · ${season ? `${season}, ` : ""}${formatHistoricalYear(setting.year)}`
    : "";
  const speaker = card.speaker ? runtime.engine.state.actors.find((a) => a.id === card.speaker) : undefined;
  const [typed, done, finish] = useTyped(card.kind === "speech" || card.kind === "turn" ? card.text : "");
  const close = (then?: () => void) => {
    if (leaving) return;
    setLeaving(true);
    onLook();
    window.setTimeout(() => {
      onClose();
      then?.();
    }, still() ? 0 : 180);
  };
  useEffect(() => {
    begin.current?.focus();
    onLook(card.focus ?? card.speaker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!staged) return;
    onLook(cast[step]?.id);
    if (step >= cast.length - 1) return;
    const t = window.setTimeout(() => setStep((i) => i + 1), 3400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staged, step]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (!done && (e.key === "Enter" || e.key === " ")) finish();
      else if (staged && e.key === "ArrowRight") setStep((i) => Math.min(cast.length - 1, i + 1));
      else if (staged && e.key === "ArrowLeft") setStep((i) => Math.max(0, i - 1));
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  if (card.kind === "speech" || card.kind === "turn")
    return (
      <div className="plot-floor" style={colours} data-leaving={leaving || undefined}>
        <section
          className="plot-frame plot-speech"
          data-portrait={speaker ? true : undefined}
          role="dialog"
          aria-label={speaker ? `${speaker.name} speaks` : card.title}
          onClick={() => !done && finish()}
        >
          {speaker && (
            <div className="plot-portrait">
              <CharacterSprite
                appearance={runtime.appearanceFor(speaker)}
                age={speaker.age}
                portrait
                speaking={!done}
                facing={npcFacing(speaker.id)}
              />
            </div>
          )}
          <div className="plot-speech-body">
            <span className="plot-name">{speaker?.name ?? card.title}</span>
            <p aria-live="polite">
              {typed}
              {!done && <span className="plot-rest" aria-hidden="true">{card.text.slice(typed.length)}</span>}
            </p>
            <div className="plot-speech-actions" data-ready={done || undefined}>
              <Choices
                focus={begin}
                items={[
                  ...(speaker && runtime.engine.approacher?.id === speaker.id
                    ? [{ label: "Answer", pick: () => close(() => onAnswer(speaker.id)), primary: true }]
                    : []),
                  { label: speaker ? "Later" : "Continue", pick: () => (done ? close() : finish()) },
                ]}
              />
            </div>
          </div>
        </section>
      </div>
    );

  if (staged) {
    const m = cast[step];
    return (
      <div className="plot-stage" style={colours} data-leaving={leaving || undefined} role="dialog" aria-label={`${card.title}: the people`}>
        <div className="plot-bar plot-bar-top"><span>{card.title}</span><small>{where}</small></div>
        {m && (
          <div className="plot-frame plot-who" key={m.id} data-mark={m.mark} aria-live="polite">
            <small>{m.role}</small>
            <strong>{m.name}</strong>
            <p>{m.line}</p>
          </div>
        )}
        <div className="plot-bar plot-bar-bottom">
          <ol className="plot-row">
            {cast.map((c, i) => {
              const a = runtime.engine.state.actors.find((x) => x.id === c.id);
              return (
                <li key={c.id} data-mark={c.mark} data-on={i === step || undefined} style={{ animationDelay: `${i * 90}ms` }}>
                  <button onClick={() => setStep(i)} aria-label={`${c.role}: ${c.name}`}>
                    {a && <CharacterSprite appearance={runtime.appearanceFor(a)} age={a.age} portrait />}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="plot-stage-actions">
            <Choices
              focus={begin}
              items={[
                ...(step < cast.length - 1 ? [{ label: "Next", pick: () => setStep(step + 1) }] : []),
                { label: "Begin", pick: () => close(), primary: true },
              ]}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="plot-veil" style={colours} data-leaving={leaving || undefined}>
      <section className="plot-frame plot-card" data-kind={card.kind} role="dialog" aria-label={card.title}>
        <div className="plot-scene">
          <Emblem look={look} marks={Math.max(1, Math.min(15, plot?.total ?? 5))} ending={card.ending} />
          {where && <small className="plot-where">{card.kind === "ending" ? `${where} · the end` : where}</small>}
        </div>
        <h1 aria-label={card.title}>
          {[...card.title].map((ch, i) => (
            <span key={i} aria-hidden="true" style={{ animationDelay: `${200 + i * 45}ms` }}>{ch === " " ? " " : ch}</span>
          ))}
        </h1>
        <p className="plot-text">{card.text}</p>
        {card.aim && <p className="plot-aim"><small>What you must do</small>{card.aim}</p>}
        <div className="plot-actions">
          <Choices
            focus={begin}
            items={[
              { label: card.kind === "title" ? "Begin" : "Go on living", pick: () => close(), primary: true },
              ...(card.kind === "title" && cast.length > 0
                ? [{ label: `More · ${cast.length} ${cast.length === 1 ? "person" : "people"}`, pick: () => setStaged(true) }]
                : []),
            ]}
          />
        </div>
      </section>
    </div>
  );
}
