import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, Compass, Hammer, MapPin, Sparkles, Sprout, X } from "lucide-react";
import { TILE_METRES } from "../core/types";
import { moneyFor } from "../content/economy/money";
import { WORK_STAGE_MS, type Runtime } from "../runtime/session";

/** The day's work as a strip of stages: what to do next, where, how far, and
 * a hand-off to autopilot for anyone who would rather watch. */
export function WorkCard({ runtime }: { runtime: Runtime }) {
  // Folded to one line on a phone until tapped; open on a desk.
  const [open, setOpen] = useState(() => !matchMedia("(max-width: 640px), (pointer: coarse) and (max-width: 1024px)").matches);
  const [closedOn, setClosedOn] = useState<number>();
  const [cheer, setCheer] = useState<number>();
  const plan = runtime.engine.workPlan();
  const day = Math.floor(runtime.engine.state.clock / 86400);
  const mainDone = !!plan && plan.done >= plan.stages.length;
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
  const p = runtime.engine.state.player.pos;
  const station = plan.station;
  const step = plan.steps[Math.min(plan.done, plan.steps.length - 1)];
  const near = (at: { x: number; y: number; space: string }) => at.space === p.space && Math.hypot(at.x - p.x, at.y - p.y) < 1.6;
  const here = garden ? near(garden.pos) : station && near(station.pos);
  const inside = !garden && station && station.pos.space !== "outside" && p.space === station.pos.space;
  const target = garden ? garden.pos : inside ? station.pos : plan.door;
  const metres = target && target.space === p.space ? Math.round(Math.hypot(target.x - p.x, target.y - p.y) * TILE_METRES) : undefined;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const piloting = runtime.autopilot?.plan.kind === "workday";
  const guiding = runtime.guide === "work";
  const holding = runtime.workHold !== undefined;
  return (
    <section
      className="work-card"
      data-open={open || undefined}
      data-here={here || undefined}
      data-holding={holding || undefined}
      data-finished={finished || undefined}
      aria-label="Today's work"
      style={{ "--stage-ms": `${WORK_STAGE_MS}ms`, "--progress": plan.done / plan.stages.length } as CSSProperties}
    >
      <button className="work-card-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="work-icon">{finished ? <Sparkles size={15} /> : garden ? <Sprout size={15} /> : <Hammer size={15} />}</span>
        <span className="work-title">
          <small>{finished || garden ? "Today's work" : `Today's work · ${plan.done + 1} of ${plan.stages.length}`}</small>
          <b key={finished ? "done" : garden ? "garden" : plan.done}>{finished ? "All done for today!" : garden ? garden.task : step.task}</b>
        </span>
      </button>
      <button className="work-close" onClick={() => setClosedOn(day)} aria-label="Hide until tomorrow" title="Hide until tomorrow">
        <X size={14} />
      </button>
      <div className="work-body">
        <ol className="work-stages" aria-label={`${plan.done} of ${plan.stages.length} done`}>
          {plan.stages.map((s, i) => (
            <li key={s} data-done={i < plan.done || undefined} data-now={i === plan.done || undefined}>
              <i>{holding && i === plan.done && <em key={runtime.workHold} />}</i>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        {side && !garden && !finished && (
          <p className="work-side" data-done={side.done || undefined}>
            {side.done ? <Check size={13} /> : <Sprout size={13} />}
            <span>Then: {side.task.toLowerCase()}</span>
          </p>
        )}
        {finished ? (
          <p className="work-where work-cheer">
            {runtime.engine.state.today?.made.coin
              ? `You earned ${runtime.engine.state.today.made.coin} ${runtime.engine.world.pack.setting ? moneyFor(runtime.engine.world.pack.setting).unit : "coins"}. `
              : ""}
            Rest, eat, or see who is about.
          </p>
        ) : here && garden ? (
          <div className="work-actions">
            <button className="primary" onClick={() => runtime.command({ type: "interact", target: garden.id, action: "tend-plot" })}>
              <Sprout size={14} />
              Tend the garden
            </button>
          </div>
        ) : here ? (
          <p className="work-where work-hold">
            <kbd>{coarse ? "Work" : "F"}</kbd>
            <span>{coarse ? "Hold the work button" : "Hold F to work"}</span>
          </p>
        ) : station || garden ? (
          <p className="work-where">
            <MapPin size={14} />
            <span>{garden ? "Your garden" : inside ? "Here, at the bench" : plan.where}</span>
            {metres !== undefined && metres > 2 && <small>{metres} m</small>}
          </p>
        ) : (
          <p className="work-where">Nowhere to do this work nearby.</p>
        )}
        {!finished && !(here && garden) && (
          <div className="work-actions">
            {piloting ? (
              <button onClick={() => runtime.stop()}>Take over</button>
            ) : (
              <>
                {(station || garden) && !here && (
                  <button data-on={guiding || undefined} onClick={() => runtime.setGuide(guiding ? undefined : "work")}>
                    <Compass size={14} />
                    {guiding ? "Hide the way" : "Show the way"}
                  </button>
                )}
                <button className="primary" onClick={() => runtime.setOff({ kind: "workday" })}>Do it for me</button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
