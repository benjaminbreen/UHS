import { useEffect, useMemo, useState } from "react";
import type { Engine } from "../core/engine";
import type { WorldSetting } from "../content/geography/types";
import { resolveCharacterContext } from "../content/characters/resolve";
import { sexFromName } from "../content/characters/name-sex";
import { actorAppearance, appearanceForAge } from "../core/character";
import type { StartingCharacter } from "../runtime/preparation";
import { formatHistoricalYear } from "../core/calendar";
import { ArrivalPortrait } from "./ArrivalPortrait";
import { ArrivalMap } from "./ArrivalMap";
import { arrivalBackdrop, birthPercentile } from "./arrival-data";
import "./arrival.css";

export function Arrival({ setting, engine, character, ready = !!engine, onEnter, onCancel }: {
  setting: WorldSetting;
  engine?: Engine;
  character?: StartingCharacter;
  ready?: boolean;
  onEnter: () => void;
  onCancel: () => void;
}) {
  const [requested, setRequested] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (!requested || !ready) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) onEnter();
    else setLeaving(true);
  }, [requested, ready, onEnter]);
  const player = engine?.state.player ?? character;
  const age = player?.age;
  const appearance = useMemo(() => engine
    ? actorAppearance(engine.state.player, resolveCharacterContext(setting).appearance)
    : character ? appearanceForAge(character.appearance, character.age) : undefined,
  [engine, character, setting]);
  const sex = player?.origin?.sex && player.origin.sex !== "unspecified"
    ? player.origin.sex : appearance?.physique?.sex ?? sexFromName(setting.characterName);
  const birth = birthPercentile(setting.year);
  const work = engine?.dailyGoals().find((g) => g.slot === "work")?.text;
  const aim = engine?.state.lifeAim?.text;
  return <div className={`arrival${leaving ? " is-leaving" : ""}`} data-modal="true" inert={leaving} role="dialog" aria-modal="true" aria-label={`Begin ${setting.characterName}'s life`} onAnimationEnd={(event) => {
    if (event.target === event.currentTarget && event.animationName === "arrival-depart") onEnter();
  }}>
    <div className="arrival-scene" style={{ backgroundImage: `url(${arrivalBackdrop(setting)})` }} />
    <div className="arrival-top"><span>Universal History Simulator</span><button type="button" onClick={onCancel}>Back</button></div>
    <section className="arrival-strip">
      <div className="arrival-person" aria-busy={!player}>
        <ArrivalPortrait appearance={appearance} age={age} />
        <div className="arrival-identity">
          <h1>{player?.name ?? setting.characterName}</h1>
          {player ? <div className="arrival-details is-ready">
            <p>{age} · {sex === "female" ? "Woman" : sex === "male" ? "Man" : "Person"} · {player.role}</p>
            {!engine && <p className="arrival-loading arrival-goal" role="status">Preparing your world…</p>}
            {work && <p className="arrival-goal"><small>Today's work</small>{work}</p>}
            {aim && <p className="arrival-aim"><small>Life aim</small>{aim}</p>}
          </div> : <div className="arrival-details">
            <p className="arrival-loading" role="status">Preparing life…</p>
            <div className="arrival-text-stars" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ left: `${8 + (i * 37) % 85}%`, top: `${15 + (i * 23) % 80}px`, animationDelay: `${i * -.7}s` }} />)}</div>
          </div>}
        </div>
      </div>
      <div className="arrival-location"><ArrivalMap lon={setting.lon} lat={setting.lat} year={setting.year} place={setting.location} /><p>{setting.location} · {formatHistoricalYear(setting.year)}</p></div>
      <div className="arrival-time">
        {birth !== null && <><div className="arrival-ring" style={{ background: `conic-gradient(#ddb66e ${birth}%, #5d6370 ${birth}% 100%)` }}><div><strong>{birth}%</strong></div></div><p>of all estimated human births came before this life</p><a href="https://www.prb.org/news/how-many-people-have-ever-lived-on-earth/" target="_blank" rel="noreferrer">Population Reference Bureau</a></>}
        <button className="arrival-enter" type="button" disabled={!engine || requested} onClick={() => setRequested(true)}>{requested ? "Entering life…" : engine ? "Enter life →" : "Preparing life…"}</button>
      </div>
      <div className={ready ? "arrival-progress is-ready" : "arrival-progress"} aria-hidden="true" />
    </section>
  </div>;
}
