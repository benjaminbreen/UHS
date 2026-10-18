import { useEffect, useRef, useState } from "react";
import { ChevronRight, Clock3, Coins, EyeOff, Hammer, MessageCircle, Sparkles, Sprout } from "lucide-react";
import type { Runtime } from "../runtime/session";

/** "½h", "7h", "1½h": a step's length at a glance. */
const span = (hours: number) => {
  const half = Math.round(hours * 2) / 2;
  if (half < 1) return "½h";
  return `${Math.floor(half)}${half % 1 ? "½" : ""}h`;
};
const seen = (hint: string) => {
  try {
    return localStorage.getItem(`uhs.hint.${hint}`) === "1";
  } catch {
    return true;
  }
};
const see = (hint: string) => {
  try {
    localStorage.setItem(`uhs.hint.${hint}`, "1");
  } catch {
    /* Hints come back without storage; nothing else depends on it. */
  }
};

/** Today's work: the step in hand, where, how long, and one thing to press.
 * Opened, the day's steps, how it is going and what it should pay. */
export function WorkCard({ runtime, onDetails, carded }: { runtime: Runtime; onDetails: () => void; carded: boolean }) {
  const [open, setOpen] = useState(false);
  const [closedOn, setClosedOn] = useState<number>();
  const [cheer, setCheer] = useState<number>();
  const engine = runtime.engine;
  const plan = engine.workPlan();
  const day = Math.floor(engine.state.clock / 86400);
  const mainDone = !!plan && plan.done >= plan.stages.length && !plan.waiting;
  const side = plan?.side;
  // The trade first, then the garden; the day is done when both are.
  const garden = mainDone && side && !side.done ? side : undefined;
  const finished = mainDone && !garden;
  const was = useRef(finished);
  useEffect(() => {
    if (finished && was.current === false) setCheer(day);
    was.current = finished;
  }, [finished, day]);
  useEffect(() => {
    if (cheer === undefined) return;
    const t = setTimeout(() => setCheer(undefined), 3600);
    return () => clearTimeout(t);
  }, [cheer]);
  if (!plan || closedOn === day || (finished && cheer !== day)) return null;
  const p = engine.state.player.pos;
  const station = plan.station;
  const now = Math.min(plan.done, plan.steps.length - 1);
  const near = (at: { x: number; y: number; space: string }) => at.space === p.space && Math.hypot(at.x - p.x, at.y - p.y) < 1.6;
  const here = garden ? near(garden.pos) : !!engine.workHere() || (!!station && near(station.pos));
  // Indoors, Go goes through the door to the bench itself.
  const target = garden ? garden.pos : station && station.pos.space !== "outside" ? station.pos : plan.door;
  const place = garden ? "your garden" : plan.where;
  const task = finished ? "Done for today" : garden ? garden.task : plan.steps[now].task;
  const hours = finished || garden || plan.steps[now].scene === "hunt" ? undefined : plan.hours[now];
  const late = hours !== undefined && plan.deadline !== undefined && engine.state.clock < plan.deadline &&
    engine.state.clock + hours * 3600 > plan.deadline;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const walking = runtime.autopilot?.plan.kind === "go";
  const hint = finished || walking || carded ? undefined
    : here ? (seen("hold") || plan.done > 0 ? undefined : "hold")
    : target && !seen("go") ? "go" : undefined;
  if (plan.done > 0 && !seen("hold")) see("hold");
  const go = () => {
    if (!target) return;
    see("go");
    runtime.setOff({ kind: "go", to: target, label: place ?? task });
  };
  const hunting = plan.activity === "Looking for game" && !finished;
  const quick = hunting && !plan.waiting ? (
    <button className="primary" onClick={() => runtime.autopilot ? runtime.stop() : runtime.setOff({ kind: "workday" })}>
      {runtime.autopilot ? "Stop" : "Hunt"}
    </button>
  ) : finished || (plan.waiting && carded) ? undefined
    : plan.waiting ? (
      <button className="primary" onClick={() => { engine.reofferCard(); runtime.emit(false); }} aria-label="Answer" title="Answer">
        <MessageCircle size={14} />
      </button>
    )
    : here && garden ? (
      <button className="primary" onClick={() => runtime.command({ type: "interact", target: garden.id, action: "tend-plot" })}>
        <Sprout size={13} />
        Tend
      </button>
    )
    : here ? <span className="work-hold" data-hint={hint === "hold" || undefined}><kbd>{coarse ? "Work" : "F"}</kbd>hold</span>
    : walking ? <button onClick={() => runtime.stop()}>Stop</button>
    : target ? <button className="primary" data-hint={hint === "go" || undefined} onClick={go}>Go</button>
    : undefined;
  const earned = engine.state.today?.made.coin;
  return (
    <section
      className="work-card"
      data-open={open || undefined}
      data-here={here || undefined}
      data-holding={runtime.workHold !== undefined || undefined}
      data-finished={finished || undefined}
      aria-label="Today's work"
    >
      <div className="work-row">
        <button className="work-card-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className="work-icon">{finished ? <Sparkles size={15} /> : garden ? <Sprout size={15} /> : <Hammer size={15} />}</span>
          <span className="work-title">
            <b key={task}>{task}</b>
            {!finished && place && <span className="work-sub">{place}</span>}
          </span>
          {hours !== undefined && (
            <span className="work-span" data-late={late || undefined} title={late ? "This runs past your deadline" : undefined}>
              <Clock3 size={11} />
              {span(hours)}
            </span>
          )}
          {finished && earned ? <span className="work-span"><Coins size={11} />{earned}</span> : null}
        </button>
        {quick && <div className="work-quick work-actions">{quick}</div>}
      </div>
      {hint && <p className="work-hint" role="status">{hint === "go" ? "Start here" : `Hold ${coarse ? "Work" : "F"} to work`}</p>}
      <div className="work-body">
        <ol className="work-steps" aria-label={`${plan.done} of ${plan.stages.length} done`}>
          {plan.steps.map((s, i) => (
            <li key={s.name} data-done={i < plan.done || undefined} data-now={(i === plan.done && !garden) || undefined}>
              <i />
              <span>{s.task}</span>
              <em>{span(plan.hours[i])}</em>
              {plan.places[i] && <small>{plan.places[i]!.label}</small>}
            </li>
          ))}
          {side && (
            <li data-done={side.done || undefined} data-now={garden ? true : undefined}>
              <i />
              <span>{side.task}</span>
            </li>
          )}
        </ol>
        <div className="work-foot">
          <span className="work-meter" title="How the day is going" aria-label={`How the day is going: ${plan.quality + 3} of 5`}>
            {[0, 1, 2, 3, 4].map((n) => <i key={n} data-on={n <= plan.quality + 2 || undefined} />)}
          </span>
          {plan.expect !== undefined && <span className="work-span" title="Expected pay"><Coins size={11} />{plan.expect}</span>}
          <button className="work-more" onClick={() => setClosedOn(day)} aria-label="Hide until tomorrow" title="Hide until tomorrow">
            <EyeOff size={14} />
          </button>
          <button className="work-more" onClick={onDetails} aria-label="About today's work" title="About today's work">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
