import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { Runtime } from "../../runtime/session";
import { Engine } from "../../core/engine";
import { temporalWorld } from "../../core/time/world";
import { TimeTravel, type Arrival } from "../../runtime/time-travel";
import { timeBounds } from "../../core/time/setting";
import { formatHistoricalYear } from "../../core/calendar";
import { lineBetween, relative, type Relative } from "../../core/time/lineage";
import { gameAudio } from "../../audio/director";
import { timeSound } from "../../audio/time";
import { CharacterSprite } from "../CharacterSprite";
import "./time.css";

type Stage = "choose" | "prepare" | "travel" | "arrive" | "family";
export function TimeModal({
  runtime,
  onClose,
  onNewWorld,
}: {
  runtime: Runtime;
  onClose(): void;
  onNewWorld(): void;
}) {
  const [travel] = useState(
    () => runtime.timeTravel ?? (runtime.timeTravel = new TimeTravel(runtime)),
  );
  const [year, setYear] = useState(travel.currentYear);
  const [stage, setStage] = useState<Stage>("choose");
  const [arrival, setArrival] = useState<Arrival | undefined>(travel.arrival);
  const [focus, setFocus] = useState<Relative>();
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [shownYear, setShownYear] = useState(travel.currentYear);
  const panel = useRef<HTMLDivElement>(null);
  const active = useRef(true);
  const frame = useRef(0);
  const source = useRef(runtime.engine);
  const committed = useRef(false);
  const { min, max } = timeBounds(travel.currentYear);
  const busy = stage === "prepare" || stage === "travel";
  useEffect(() => {
    if (stage !== "choose") panel.current?.focus();
    if (stage === "family") panel.current?.querySelector(".time-relative.selected")?.scrollIntoView({ block: "nearest" });
  }, [stage]);
  useEffect(() => {
    active.current = true;
    runtime.flushAmbient();
    runtime.stop(false);
    runtime.timeTravelLocked = true;
    const trigger = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => {
      active.current = false;
      cancelAnimationFrame(frame.current);
      if (!committed.current) runtime.engine = source.current;
      runtime.timeVisualClock = undefined;
      runtime.timeTravelLocked = false;
      runtime.resumeAmbient();
      runtime.emit(false);
      trigger?.focus();
    };
  }, [runtime]);
  const close = () => {
    if (!busy) onClose();
  };
  const start = async () => {
    setError("");
    setStage("prepare");
    await new Promise((resolve) => setTimeout(resolve, 40));
    if (!active.current) return;
    try {
      const prepared = travel.prepare(year);
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (!reduced)
        void gameAudio()?.sound(
          timeSound(year < travel.currentYear),
          "time-travel",
        );
      setStage("travel");
      const duration = reduced ? 650 : 8200;
      let step = -1;
      const visualWorlds = reduced
        ? []
        : [0.2, 0.4, 0.65].map((fraction) => {
            const intermediate = Math.round(
              travel.currentYear + (year - travel.currentYear) * fraction,
            );
            const result = temporalWorld(
              travel.origin.world,
              travel.lineage.seed,
              travel.origin.world.pack.setting!,
              intermediate,
            );
            const snapshot = prepared.engine.snapshot();
            return new Engine(result.world, prepared.engine.items, snapshot);
          });
      const started = performance.now();
      const animate = (now: number) => {
        if (!active.current) return;
        const t = Math.min(1, (now - started) / duration);
        const eased = t * t * (3 - 2 * t);
        setProgress(t);
        setShownYear(
          Math.round(travel.currentYear + (year - travel.currentYear) * eased),
        );
        // Presentation time only: the actor does not spend centuries hungry.
        runtime.timeVisualClock = reduced
          ? source.current.state.clock
          : source.current.state.clock +
            (year > travel.currentYear ? 1 : -1) * 86400 * 7 * eased;
        const nextStep =
          t < 0.22 ? -1 : t < 0.4 ? 0 : t < 0.6 ? 1 : t < 0.78 ? 2 : 3;
        if (nextStep !== step && nextStep >= 0) {
          runtime.engine =
            nextStep === 3 || reduced
              ? prepared.engine
              : visualWorlds[nextStep];
          runtime.emit();
          step = nextStep;
        }
        if (t < 1) frame.current = requestAnimationFrame(animate);
        else {
          runtime.timeVisualClock = undefined;
          travel.commit(prepared);
          committed.current = true;
          source.current = runtime.engine;
          setArrival(prepared.arrival);
          setStage("arrive");
          void improveArrival(prepared.arrival);
        }
      };
      frame.current = requestAnimationFrame(animate);
    } catch (e) {
      runtime.engine = source.current;
      runtime.timeVisualClock = undefined;
      setError(
        e instanceof Error ? e.message : "Time travel could not be prepared.",
      );
      setStage("choose");
    }
  };
  async function improveArrival(value: Arrival) {
    try {
      const status = await fetch("/api/time-arrival", {
        signal: AbortSignal.timeout(3000),
      });
      if (!status.ok || !(await status.json()).available) return;
      const response = await fetch("/api/time-arrival", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          place: runtime.engine.world.pack.name,
          from: value.fromYear,
          to: value.year,
          context: value.text,
          person: value.person.name,
          relationship: value.relationship,
        }),
      });
      if (!response.ok) return;
      const data = await response.json();
      if (
        active.current &&
        typeof data.text === "string" &&
        data.text.length <= 1600
      ) {
        value.text = data.text;
        setArrival({ ...value });
      }
    } catch {
      /* The committed arrival account remains available offline. */
    }
  }
  const family = () => {
    const current = arrival?.person ?? relative(travel.lineage, 0);
    setFocus(current);
    setStage("family");
  };
  const members = lineBetween(
    travel.lineage,
    Math.min(...travel.lineage.members.keys()),
    Math.max(...travel.lineage.members.keys()),
  );
  return (
    <div
      className={`time-veil time-${stage}`}
      data-modal="true"
      data-testid="time-modal"
      style={{ "--passage": progress } as React.CSSProperties}
    >
      <div className="time-atmosphere" aria-hidden="true" />
      <div
        className="time-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Move through time"
        tabIndex={-1}
        ref={panel}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            close();
          }
          if (e.key === "Tab") {
            const items = [
              ...panel.current!.querySelectorAll<HTMLElement>(
                "button:not(:disabled), input:not(:disabled), a[href]",
              ),
            ];
            if (!items.length) { e.preventDefault(); return; }
            const first = items[0],
              last = items.at(-1);
            if (
              e.shiftKey &&
              (document.activeElement === first ||
                document.activeElement === panel.current)
            ) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        {!busy && (
          <button
            className="time-close"
            onClick={close}
            aria-label="Close time"
          >
            <X size={20} />
          </button>
        )}
        {stage === "choose" && (
          <>
            <div className="time-place">{runtime.engine.world.pack.name}</div>
            <div className="time-date">
              <span>{year > 0 ? year : 1 - year}</span>
              <small>{year > 0 ? "CE" : "BCE"}</small>
            </div>
            <div className="time-rule" aria-hidden="true">
              <i />
            </div>
            <div className="time-timeline">
              <div className="time-ticks" aria-hidden="true">
                {Array.from({ length: 41 }, (_, i) => (
                  <i key={i} className={i % 5 === 0 ? "major" : ""} />
                ))}
              </div>
              <input
                aria-label="Destination year"
                type="range"
                min={min}
                max={max}
                step={1}
                value={year}
                onChange={(e) => setYear(+e.target.value)}
              />
              <div className="time-range-labels">
                <span>{formatHistoricalYear(min)}</span>
                <span>{formatHistoricalYear(max)}</span>
              </div>
            </div>
            <div className="time-year-entry">
              <label htmlFor="time-exact-year">Year</label>
              <input
                id="time-exact-year"
                aria-label="Exact destination year"
                type="number"
                min={min}
                max={max}
                value={year}
                onChange={(e) => {
                  if (e.target.value)
                    setYear(
                      Math.max(min, Math.min(max, Number(e.target.value))),
                    );
                }}
              />
              <button onClick={() => setYear(travel.currentYear)}>
                {formatHistoricalYear(travel.currentYear)} <span>↶</span>
              </button>
            </div>
            <blockquote>
              “Our little life
              <br />
              Is rounded with a sleep.”
              <cite>William Shakespeare · The Tempest</cite>
            </blockquote>
            {error && (
              <p role="alert" className="time-error">
                {error}
              </p>
            )}
            <button
              className="time-start"
              disabled={year === travel.currentYear || !Number.isInteger(year)}
              onClick={() => void start()}
            >
              Start <ArrowRight size={19} />
            </button>
            <div className="time-other">
              <button onClick={onNewWorld}>Choose another world</button>
              <button onClick={family}>Family tree</button>
            </div>
          </>
        )}
        {busy && (
          <div className="time-passage" aria-live="polite">
            <div className="time-date">
              <span>{shownYear > 0 ? shownYear : 1 - shownYear}</span>
              <small>{shownYear > 0 ? "CE" : "BCE"}</small>
            </div>
            <div className="time-orbit" aria-hidden="true">
              <i />
            </div>
            {stage === "prepare" && <p>Preparing…</p>}
          </div>
        )}
        {stage === "arrive" && arrival && (
          <div className="time-arrival">
            <div className="time-place">{runtime.engine.world.pack.name}</div>
            <h1>{formatHistoricalYear(arrival.year)}</h1>
            <p className="time-account">{arrival.text}</p>
            <div className="time-person">
              {arrival.person.character.appearance && (
                <div className="time-portrait">
                  <CharacterSprite
                    appearance={arrival.person.character.appearance}
                    age={arrival.year - arrival.person.born}
                    portrait
                  />
                </div>
              )}
              <div>
                <h2>{arrival.person.name}</h2>
                <p>{arrival.relationship}</p>
              </div>
            </div>
            <button className="time-family-link" onClick={family}>
              Trace your family <ArrowRight size={15} />
            </button>
            <button className="time-start" onClick={onClose}>
              Continue <ArrowRight size={19} />
            </button>
            {arrival.sources.length > 0 && (
              <details className="time-sources">
                <summary>Historical context</summary>
                {arrival.sources.map((s) => (
                  <a href={s.url} target="_blank" rel="noreferrer" key={s.url}>
                    {s.title}
                  </a>
                ))}
                <p>
                  The family and individual building histories are procedural
                  reconstructions.
                </p>
              </details>
            )}
          </div>
        )}
        {stage === "family" && (
          <div className="time-family">
            <button
              className="time-back"
              onClick={() => setStage(arrival ? "arrive" : "choose")}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <h1>{focus?.name}</h1>
            {focus && (
              <p className="time-family-dates">
                {formatHistoricalYear(focus.born)} —{" "}
                {formatHistoricalYear(focus.died)}
                <span>{focus.role}</span>
              </p>
            )}
            <div className="time-family-scroll">
              {members.map((member) => (
                <button
                  key={member.id}
                  className={`time-relative ${focus?.id === member.id ? "selected" : ""}`}
                  onClick={() => setFocus(member)}
                >
                  <span className="time-node" />
                  <strong>{member.name}</strong>
                  <span>{formatHistoricalYear(member.born)}</span>
                </button>
              ))}
            </div>
            <p className="time-family-note">
              A reconstructed family line. Each person is the parent of the
              next.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
