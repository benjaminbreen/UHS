import { formatHistoricalYear } from "../core/calendar";
import { kinWord } from "../core/concerns";
import { kinOf } from "../core/kin";
import type { Runtime } from "../runtime/session";
import { CharacterSprite } from "./CharacterSprite";
import { inWords } from "../core/concerns";
import { typicalDeathAge } from "../core/time/mortality";
import { ItemIcon } from "./components";
import { beliefOf, beliefsForActor } from "../content/beliefs";
import { passage } from "../content/beliefs/afterlife";
import { deeds } from "../core/word";
import { gameAudio } from "../audio/director";
import { drawCharacterG } from "../render/characters/doll/draw";
import type { CharacterAppearance } from "../core/character";
import { useEffect, useRef, useState } from "react";
import "./time/time.css";

const counted = (n: number) => (n === 1 ? "one" : inWords(n));
function children(born: number, living: number) {
  if (born === 1) return living ? "Your only child outlived you." : "Your only child died before you.";
  if (living === born) return `All ${counted(born)} of your children outlived you.`;
  if (!living) return `None of your ${counted(born)} children outlived you.`;
  return `${counted(living).replace(/^./, (c) => c.toUpperCase())} of your ${counted(born)} children outlived you.`;
}

type Stage = "fall" | "rise" | "realm" | "words" | "card";
// When each stage begins, in ms from the death.
const AT: [Stage, number][] = [["rise", 2200], ["realm", 4200], ["words", 6400], ["card", 13000]];

/** The figure in the death scene: arms opening, then a slow breathing hold. */
function Rising({ appearance }: { appearance: CharacterAppearance }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    const draw = () => drawCharacterG(ctx, appearance, 2, "transcend", frame);
    draw();
    const timer = window.setInterval(() => {
      frame = frame < 2 ? frame + 1 : frame === 2 ? 3 : 2;
      draw();
    }, 700);
    return () => window.clearInterval(timer);
  }, [appearance]);
  return <canvas ref={ref} className="passing-figure" width={80} height={80} />;
}

/** The end of a life. A scene first: the dark comes down, the figure rises,
 * and the place their own tradition sent them fills in behind. Then who died,
 * of what, how old, where and when; then going on as one of the household,
 * or closing the life. */
export function DeathCard({ runtime, onClose }: { runtime: Runtime; onClose: () => void }) {
  const engine = runtime.engine, s = engine.state, p = s.player;
  const setting = engine.world.pack.setting;
  const kin = new Map(kinOf(s).map((k) => [k.actor.id, kinWord(k.kind, k.actor)]));
  const heirs = engine.heirs();
  const how = /^(mauled|gored|taken) /.test(p.dead ?? "") ? `, ${p.dead}` : /^(of|in|by|at|under) /.test(p.dead ?? "") ? ` ${p.dead}` : ` from ${p.dead}`;
  const history = s.households?.find((h) => h.id === p.householdId)?.history ?? [];
  const child = (e: { as?: string }) => e.as === "son" || e.as === "daughter";
  const born = history.filter((e) => e.kind === "born" && child(e)).length;
  const lost = history.filter((e) => e.kind === "died" && child(e)).length;
  const partner = kinOf(s).find((k) => k.kind === "partner")?.actor;
  const typical = setting && (p.age ?? 0) >= 20 ? typicalDeathAge(setting.year, setting) : undefined;
  const summary = [
    born ? children(born, Math.max(0, born - lost)) : "",
    partner ? `${partner.name.split(" ")[0]} outlived you.` : "",
    typical ? `Most people here who reached twenty lived to about ${typical}. You lived to ${p.age}.` : "",
  ].filter(Boolean);
  const appearance = runtime.appearanceFor(p);
  const system = beliefsForActor(setting,p);
  const [after] = useState(() =>
    passage(
      {
        cause: p.dead ?? "",
        year: setting?.year ?? 0,
        age: p.age ?? 0,
        mourners: kin.size,
        deeds: deeds(s),
        observance: beliefOf(s.manifest.seed, p, system).observance,
      },
      system,
    ),
  );
  const still = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [stage, setStage] = useState<Stage>(still ? "card" : "fall");
  useEffect(() => {
    if (still) return void gameAudio()?.setSituation("passing");
    void gameAudio()?.event("death");
    const timers = AT.map(([next, ms]) => window.setTimeout(() => {
      setStage((was) => (was === "card" ? was : next));
      if (next === "rise") void gameAudio()?.setSituation("passing");
    }, ms));
    return () => timers.forEach(window.clearTimeout);
  }, [still]);
  const skip = () => {
    if (stage === "card") return;
    if (stage === "fall" || stage === "rise") void gameAudio()?.setSituation("passing");
    setStage("card");
  };
  const best = (s.made ?? [])
    .map((m) => ({ ...m, def: engine.item(m.item) }))
    .filter((m) => m.def && !m.def.made?.flop)
    .sort((a, b) => b.def!.value - a.def!.value)[0];
  return (
    <div
      className={`collapse-notice death-card stage-${stage}`}
      role="alertdialog"
      aria-label={`${p.name} has died`}
      onClick={skip}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " " || e.key === "Escape") && skip()}
    >
      <div className="passing-dark" />
      <div className="passing-realm" style={{ backgroundImage: `url(/backdrops/${after.plate})` }} />
      <div className="passing-vignette" />
      {stage === "fall" && <span className="passing-ellipsis">…</span>}
      {stage !== "card" && <Rising appearance={appearance} />}
      {stage === "words" && (
        <div className="passing-words">
          {after.title && <h2>{after.title}</h2>}
          {after.lines.map((line) => <p key={line}>{line}</p>)}
        </div>
      )}
      {stage === "card" && <div className="death-body">
        <small>A LIFE ENDS</small>
        <span className="death-portrait">
          <CharacterSprite appearance={appearance} age={p.age} portrait />
        </span>
        <h2>{p.name}</h2>
        <p>
          Died{how}, aged {p.age}.
          <br />
          {setting?.location ?? engine.world.pack.name}
          {setting ? `, ${formatHistoricalYear(setting.year)}` : ""}
        </p>
        {after.title && <p className="death-realm">{after.title}. {after.lines[0]}</p>}
        {summary.length > 0 && <p className="death-summary">{summary.join(" ")}</p>}
        {best && (
          <p className="make-death">
            <ItemIcon id={best.item} sprite={best.def!.sprite} scale={4} />
            <span>The best thing you made: {best.def!.name.toLowerCase()}.</span>
            {best.said && <em>“{best.said}”</em>}
          </p>
        )}
        {heirs.length > 0 && (
          <>
            <small>GO ON AS</small>
            <ul className="death-heirs">
              {heirs.map((a) => (
                <li key={a.id}>
                  <button onClick={() => runtime.command({ type: "become", heir: a.id })}>
                    <span className="death-heir-portrait">
                      <CharacterSprite appearance={runtime.appearanceFor(a)} age={a.age} portrait />
                    </span>
                    <span>
                      <b>{a.name.split(" ")[0]}</b>
                      <em>{kin.get(a.id) ? `your ${kin.get(a.id)}` : "of the household"}, {a.age}</em>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <button className="death-close" autoFocus={!heirs.length} onClick={onClose}>
          Close this life
        </button>
      </div>}
    </div>
  );
}
