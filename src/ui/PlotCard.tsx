import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CharacterSprite, npcFacing } from "./CharacterSprite";
import { formatHistoricalYear } from "../core/calendar";
import { seasonAt } from "../core/livelihood";
import { sexOf } from "../core/brief";
import { kinOf } from "../core/kin";
import { plotLine, plotTemplate, type PlotCard as Card } from "../core/plot";
import { settlementName, type IntroSpan } from "../core/intro";
import type { PlotLook } from "../content/plots/types";
import { gameAudio } from "../audio/director";
import { drawEmblem, EMBLEM_H, EMBLEM_W } from "./plot-emblems";
import { patternFor } from "./culture-theme";
import type { Runtime } from "../runtime/session";
import "./plot-card.css";

/** Which dress the story cards wear: the framed slate, or the first pixel card. */
export type StoryLook = "framed" | "pixel";
export const STORY_LOOK_KEY = "uhs.storyCards";

/** A life with no plot gets first light over the hills, in the game's own blues. */
const DAWN: PlotLook = {
  emblem: "dawn",
  palette: { ink: "#0c1226", fill: "#1b2547", edge: "#7a5c34", light: "#eee8dc", accent: "#e3b455" },
};
const KIN: Record<string, [string, string, string]> = {
  partner: ["wife", "husband", "partner"],
  child: ["daughter", "son", "child"],
  parent: ["mother", "father", "parent"],
  sibling: ["sister", "brother", "sibling"],
};
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

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

/** The card's title in the dress of the game's wordmark: condensed Western
 * capitals, cream over pale blue, a navy block under them, at native pixels. */
function Wordmark({ text }: { text: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    const H = 22, squeeze = 0.7, font = (px: number) => `${px}px Rye, Georgia, serif`;
    void document.fonts.load(font(H)).catch(() => {}).then(() => {
      const c = ref.current;
      if (!live || !c) return;
      // Small capitals: each word's first letter full height, the rest smaller.
      const parts = text.split(" ").flatMap((word, i) => [
        ...(i ? [{ t: " ", px: Math.round(H * 0.8) }] : []),
        { t: word.charAt(0).toUpperCase(), px: H },
        { t: word.slice(1).toUpperCase(), px: Math.round(H * 0.8) },
      ]);
      const ink = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
      const width = parts.reduce((w, p) => ((ink.font = font(p.px)), w + ink.measureText(p.t).width + 0.6), 0);
      const W = Math.ceil(width * squeeze) + 6, HT = H + 7;
      ink.canvas.width = W;
      ink.canvas.height = HT;
      ink.scale(squeeze, 1);
      ink.fillStyle = "#fff";
      let at = 2 / squeeze;
      for (const p of parts) {
        ink.font = font(p.px);
        ink.fillText(p.t, at, H + 1);
        at += ink.measureText(p.t).width + 0.6;
      }
      const mask = ink.getImageData(0, 0, W, HT).data;
      const on = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < HT && mask[(y * W + x) * 4 + 3] > 100;
      c.width = W;
      c.height = HT;
      const ctx = c.getContext("2d")!;
      const out = ctx.createImageData(W, HT);
      const put = (x: number, y: number, rgb: number[]) => out.data.set([...rgb, 255], (y * W + x) * 4);
      for (let y = 0; y < HT; y++)
        for (let x = 0; x < W; x++) {
          if (on(x, y)) put(x, y, y < H * 0.55 ? [241, 234, 215] : [201, 208, 222]);
          else if (on(x, y - 1) || on(x, y - 2) || on(x, y - 3)) put(x, y, [44, 47, 110]);
          else if (on(x - 1, y) || on(x + 1, y) || on(x, y + 1)) put(x, y, [22, 24, 46]);
        }
      ctx.putImageData(out, 0, 0);
      c.style.width = `${W * 2}px`;
    });
    return () => {
      live = false;
    };
  }, [text]);
  return (
    <h1 className="plot-title">
      <canvas ref={ref} aria-hidden="true" />
      <span className="visually-hidden">{text}</span>
    </h1>
  );
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
// The sun on the horizon, for a goal with a deadline.
const SUN = ["......X......", "..X.......X..", "....XXXXX....", "...XXXXXXX...", "XX.XXXXXXX.XX", "..XXXXXXXXX..", "XXXXXXXXXXXXX"];

function Pixels({ rows, className, size }: { rows: string[]; className: string; size: [number, number] }) {
  return (
    <svg className={className} viewBox={`0 0 ${rows[0].length} ${rows.length}`} width={size[0]} height={size[1]} aria-hidden="true" shapeRendering="crispEdges">
      {rows.flatMap((row, y) => [...row].flatMap((c, x) =>
        c === "." ? [] : [<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" className={`px-${c}`} />]))}
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
          {i === on && <Pixels rows={HAND} className="plot-hand" size={[28, 18]} />}
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

/** The wooden frame of the framed look: four stepped rims, outermost first. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="pf">
      <div className="pf-lit">
        <div className="pf-wood">
          <div className="pf-dark">
            <div className="pf-body">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

type Asked = { span: IntroSpan; x: number; y: number };

/** What a named person or a glossed term is, under the word that named it. */
function Ask({ runtime, asked }: { runtime: Runtime; asked: Asked }) {
  const s = runtime.engine.state, plot = s.plot;
  const a = asked.span.ref ? s.actors.find((x) => x.id === asked.span.ref) : undefined;
  const role = plot && a && Object.entries(plot.cast).find(([, id]) => id === a.id)?.[0];
  const kin = a && kinOf(s).find((k) => k.actor.id === a.id);
  const sex = a && sexOf(a);
  const line = role ? plotLine(plot!, `cast-${role}`)
    : kin ? `Your ${KIN[kin.kind][sex === "female" ? 0 : sex === "male" ? 1 : 2]}.` : asked.span.note;
  return (
    <div className="plot-ask" data-mark={asked.span.mark} style={{ left: asked.x, top: asked.y }} role="note">
      {a && (
        <div className="plot-ask-face">
          <CharacterSprite appearance={runtime.appearanceFor(a)} age={a.age} portrait facing={npcFacing(a.id)} />
        </div>
      )}
      <div>
        <strong>{a?.name ?? asked.span.text}</strong>
        {a && <small>{a.role}{a.age === undefined ? "" : `, ${a.age}`}</small>}
        {line && <p>{line}</p>}
      </div>
    </div>
  );
}

function Prose({ body, uncommon, onAsk }: {
  body: IntroSpan[][];
  uncommon?: string;
  onAsk: (span: IntroSpan, at: HTMLElement) => void;
}) {
  return (
    <div className="plot-prose">
      {body.map((p, i) => (
        <p key={i}>
          {p.map((span, j) =>
            span.ref || span.note ? (
              <button key={j} type="button" className="plot-ref" data-mark={span.mark} onClick={(e) => onAsk(span, e.currentTarget)}>
                {span.text}
              </button>
            ) : (
              span.text
            ))}
        </p>
      ))}
      {uncommon && <p className="plot-uncommon">{uncommon}</p>}
    </div>
  );
}

/** The goal, with its deadline picked out. */
function Goal({ aim, due }: { aim: string; due?: string }) {
  const at = due ? aim.lastIndexOf(due) : -1;
  return (
    <p className="plot-goal">
      {at < 0 ? aim : <>{aim.slice(0, at)}<em>{due}</em>{aim.slice(at + due!.length)}</>}
    </p>
  );
}

export function PlotCard({ runtime, card, look: dress, onLook, onAnswer, onClose }: {
  runtime: Runtime;
  card: Card;
  look: StoryLook;
  /** Points the camera at someone, or back at the player with none. */
  onLook: (id?: string) => void;
  /** Opens the conversation with whoever just spoke. */
  onAnswer: (id: string) => void;
  onClose: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const [asked, setAsked] = useState<Asked>();
  const begin = useRef<HTMLButtonElement>(null);
  const section = useRef<HTMLElement>(null);
  const plot = runtime.engine.state.plot;
  const look = (plot && plotTemplate(plot)?.look) ?? DAWN;
  const setting = runtime.engine.world.pack.setting;
  const colours = {
    "--ink": look.palette.ink,
    "--fill": look.palette.fill,
    "--edge": look.palette.edge,
    "--light": look.palette.light,
    "--accent": look.palette.accent,
    "--culture-pattern": patternFor(setting?.culture),
  } as CSSProperties;
  const season = setting && seasonAt(setting.season, runtime.engine.state.clock);
  const name = settlementName(runtime.engine.world.pack.name);
  const when = setting ? `${season ? `${season}, ` : ""}${formatHistoricalYear(setting.year)}` : "";
  // A card titled with the place need not name it twice.
  const where = setting ? (card.title === name ? when.charAt(0).toUpperCase() + when.slice(1) : `${name} · ${when}`) : "";
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
  const ask = (span: IntroSpan, at: HTMLElement) => {
    if (asked?.span === span) return setAsked(undefined);
    const box = section.current!.getBoundingClientRect(), r = at.getBoundingClientRect();
    setAsked({ span, x: Math.max(8, Math.min(r.left - box.left, box.width - 288)), y: r.bottom - box.top + 6 });
    if (span.ref) onLook(span.ref);
  };
  useEffect(() => {
    begin.current?.focus();
    onLook(card.focus ?? card.speaker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") asked ? setAsked(undefined) : close();
      else if (!done && (e.key === "Enter" || e.key === " ")) finish();
      else return;
      e.preventDefault();
    };
    const away = (e: MouseEvent) => {
      if (!(e.target as Element).closest?.(".plot-ask, .plot-ref")) setAsked(undefined);
    };
    window.addEventListener("keydown", key);
    window.addEventListener("mousedown", away);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("mousedown", away);
    };
  });

  if (card.kind === "speech" || card.kind === "turn") {
    const body = (
      <>
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
      </>
    );
    return (
      <div className="plot-floor" data-look={dress} style={colours} data-leaving={leaving || undefined}>
        <section
          className="plot-speech"
          data-portrait={speaker ? true : undefined}
          role="dialog"
          aria-label={speaker ? `${speaker.name} speaks` : card.title}
          onClick={() => !done && finish()}
        >
          {dress === "framed" ? <Frame><div className="plot-speech-row">{body}</div></Frame> : <div className="plot-frame plot-speech-row">{body}</div>}
        </section>
      </div>
    );
  }

  const intro = card.intro;
  const text = intro
    ? <Prose body={intro.body} uncommon={intro.uncommon} onAsk={ask} />
    : <div className="plot-prose"><p>{card.text}</p></div>;
  const choices = (
    <Choices
      focus={begin}
      items={[{ label: card.kind === "ending" ? "Go on living" : "Continue", pick: () => close(), primary: true }]}
    />
  );
  const emblem = (
    <div className="plot-scene">
      <Emblem look={look} marks={Math.max(1, Math.min(15, plot?.total ?? 5))} ending={card.ending} />
    </div>
  );
  const place = card.kind === "ending" ? `${where} · the end` : where;
  return (
    <div className="plot-veil" data-look={dress} style={colours} data-leaving={leaving || undefined}>
      <section ref={section} className="plot-card" data-kind={card.kind} role="dialog" aria-label={card.title}>
        {dress === "framed" ? (
          <Frame>
            <i className="plot-band" aria-hidden="true" />
            {emblem}
            <div className="plot-copy">
              <header className="plot-head">
                <Wordmark text={card.title} />
                {place && <small>{place}</small>}
              </header>
              {text}
              <footer className="plot-foot">
                {card.aim && <Pixels rows={SUN} className="plot-sun" size={[26, 14]} />}
                {card.aim ? <Goal aim={card.aim} due={plot?.words.due} /> : <span className="plot-goal" />}
                {choices}
              </footer>
            </div>
            <i className="plot-band" aria-hidden="true" />
          </Frame>
        ) : (
          <div className="plot-frame plot-old">
            {emblem}
            {place && <small className="plot-where">{place}</small>}
            <Wordmark text={card.title} />
            {text}
            {card.aim && <div className="plot-aim"><small>What you must do</small><Goal aim={card.aim} due={plot?.words.due} /></div>}
            <div className="plot-actions">{choices}</div>
          </div>
        )}
        {asked && <Ask runtime={runtime} asked={asked} />}
      </section>
    </div>
  );
}
