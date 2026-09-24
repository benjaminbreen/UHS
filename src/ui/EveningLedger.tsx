import { useEffect, useState, type ReactNode } from "react";
import { gameAudio } from "../audio/director";
import { formatHistoricalYear } from "../core/calendar";
import { shownAs } from "../core/economy";
import type { Evening } from "../core/types";
import type { Weather } from "../core/weather";
import { goods } from "../content/economy/goods";
import type { Runtime } from "../runtime/session";
import { CharacterSprite } from "./CharacterSprite";
import { ItemIcon } from "./components";
import { calm } from "./motion";
import { SplashStars } from "./SplashStars";
import { SkyScene } from "./WeatherPanel";
import { bannerFor } from "./splash-banner";
import { regionAt } from "../content/geography/region-label";

const ROW_MS = 520;
const noun = (good: string) => goods.find((g) => g.id === good)?.noun ?? good;
/** Days since a new moon, for a day number; any fixed start will do. */
const moonAge = (day: number) => (day + 11) % 29.53;
const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A number that counts up once its row has arrived. */
function Tally({ to, on }: { to: number; on: boolean }) {
  const [n, setN] = useState(calm() ? to : 0);
  useEffect(() => {
    if (!on || calm()) return setN(to);
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - start) / 700);
      setN(to * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [to, on]);
  return <span className="tally">{Math.round(n)}</span>;
}

function Good({ runtime, good }: { runtime: Runtime; good: string }) {
  // A good the town trades, or an item carried home.
  const item = shownAs[good] ?? (runtime.engine.item(good) ? good : undefined);
  const sprite = item && runtime.engine.item(item)?.sprite;
  return (
    <span
      className="ledger-good"
      title={runtime.engine.item(good)?.name ?? noun(good)}
    >
      {item ? (
        <ItemIcon id={item} sprite={sprite} scale={2} />
      ) : (
        <span className="ledger-good-letter">{noun(good).charAt(0)}</span>
      )}
    </span>
  );
}

/**
 * The day's account on waking, after Stardew Valley's shipping tally: the
 * night sky, then the day set down a line at a time, each with its sound.
 */
export function EveningLedger({
  runtime,
  evening,
  onClose,
}: {
  runtime: Runtime;
  evening: Evening;
  onClose: () => void;
}) {
  const engine = runtime.engine;
  const s = engine.state;
  const setting = engine.world.pack.setting;
  const rows: { label: string; body: (on: boolean) => ReactNode }[] = [];
  const { work } = evening;

  if (work)
    rows.push({
      label: "Your work",
      body: (on) => (
        <>
          <span className="ledger-detail">
            {work.activity}
            <span className="ledger-pips" aria-label={`${work.done} of ${work.stages} stages`}>
              {Array.from({ length: work.stages }, (_, i) => (
                <i key={i} className={i < work.done ? "done" : ""} />
              ))}
            </span>
          </span>
          <span className="ledger-values">
            {Object.keys(work.made).length ? (
              Object.entries(work.made).map(([good, n]) => (
                <span key={good} className="ledger-value">
                  <Good runtime={runtime} good={good} />
                  <Tally to={n} on={on} />
                </span>
              ))
            ) : (
              <span className="ledger-none">
                {work.done ? "Unfinished" : "Left undone"}
              </span>
            )}
          </span>
        </>
      ),
    });

  if (evening.stock.length)
    rows.push({
      label: "The house holds",
      body: (on) => (
        <span className="ledger-values ledger-stock">
          {evening.stock.map(({ good, n, cap }) => (
            <span key={good} className="ledger-value">
              <Good runtime={runtime} good={good} />
              <span className="ledger-bar" title={`${Math.round(n)} ${noun(good)}`}>
                <i style={{ width: on ? `${Math.min(100, (100 * n) / cap)}%` : 0 }} />
              </span>
            </span>
          ))}
        </span>
      ),
    });

  const people = evening.regard
    .map((r) => ({ ...r, actor: s.actors.find((a) => a.id === r.id) }))
    .filter((r) => r.actor)
    .slice(0, 6);
  if (people.length)
    rows.push({
      label: "Neighbours",
      body: () => (
        <span className="ledger-values ledger-people">
          {people.map(({ id, delta, actor }) => (
            <span key={id} className={`ledger-person ${delta > 0 ? "warmer" : "cooler"}`}>
              <span className="ledger-portrait">
                <CharacterSprite
                  appearance={runtime.appearanceFor(actor!)}
                  age={actor!.age}
                  portrait
                />
              </span>
              <span className="ledger-person-name">
                {delta > 0 ? "▲" : "▼"} {actor!.name.split(" ")[0]}
              </span>
            </span>
          ))}
        </span>
      ),
    });

  if (evening.households) {
    const short = Object.entries(evening.short).sort((a, b) => b[1] - a[1]);
    rows.push({
      label: "The town",
      body: (on) =>
        short.length ? (
          <>
            <span className="ledger-detail">
              Going without, of {evening.households} households
            </span>
            <span className="ledger-values">
              {short.slice(0, 4).map(([good, n]) => (
                <span key={good} className="ledger-value short">
                  <Good runtime={runtime} good={good} />
                  <Tally to={n} on={on} />
                </span>
              ))}
            </span>
          </>
        ) : (
          <span className="ledger-detail">
            All {evening.households} households had what they needed.
          </span>
        ),
    });
  }

  const sky: Weather = {
    condition: evening.tomorrow.condition as Weather["condition"],
    label: evening.tomorrow.label,
    tempC: evening.tomorrow.tempC,
    night: false,
    wind: { angle: 0, strength: 0.2 },
    wetness: 0,
  };
  rows.push({
    label: "Tomorrow",
    body: () => (
      <>
        <SkyScene className="ledger-sky" weather={sky} lighting="early-morning" />
        <span className="ledger-detail">
          {evening.tomorrow.label}, {evening.tomorrow.tempC}°C
        </span>
      </>
    ),
  });

  const [shown, setShown] = useState(calm() ? rows.length : 0);
  useEffect(() => {
    if (shown >= rows.length) {
      gameAudio()?.event("warm");
      return;
    }
    const t = setTimeout(() => {
      gameAudio()?.event("select");
      setShown((n) => n + 1);
    }, shown ? ROW_MS : 700);
    return () => clearTimeout(t);
  }, [shown, rows.length]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!["Enter", " ", "Escape"].includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      // A first press finishes the tally; a second goes to sleep.
      if (shown < rows.length) setShown(rows.length);
      else onClose();
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [shown, rows.length, onClose]);

  const dayOfSeason = (evening.day % 28) + 1;
  const year = setting?.year ?? engine.world.pack.year;
  return (
    <div className="evening" role="dialog" aria-modal="true" aria-label="The day's account">
      <SplashStars />
      <div
        className="evening-moon"
        aria-hidden="true"
        style={{ ["--phase" as string]: moonAge(evening.day) / 29.53 }}
      />
      <div className="evening-horizon" aria-hidden="true">
        <img
          src={bannerFor(
            setting?.culture,
            year,
            setting && regionAt(setting.lon, setting.lat)?.id,
          )}
          alt=""
        />
      </div>
      <div className="evening-hearth" aria-hidden="true" />
      <div className="evening-card">
        <div className="evening-ribbon">
          Day {dayOfSeason} of {upper(evening.season ?? "the year")}
          {Number.isInteger(year) ? ` · ${formatHistoricalYear(year)}` : ""}
        </div>
        <h2>Night falls on {setting?.location ?? engine.world.pack.name}</h2>
        <ol className="evening-rows">
          {rows.map((row, i) => (
            <li key={row.label} className={i < shown ? "in" : ""}>
              <span className="ledger-label">{row.label}</span>
              <span className="ledger-body">{row.body(i < shown)}</span>
            </li>
          ))}
        </ol>
        <button
          className={`evening-sleep ${shown >= rows.length ? "ready" : ""}`}
          onClick={() => (shown < rows.length ? setShown(rows.length) : onClose())}
        >
          {shown < rows.length ? "Skip" : "Sleep"} <kbd>↵</kbd>
        </button>
      </div>
    </div>
  );
}
