import { useMemo } from "react";
import type { Engine } from "../core/engine";
import type { WorldSetting } from "../content/geography/types";
import { resolveCharacterContext } from "../content/characters/resolve";
import { sexFromName } from "../content/characters/name-sex";
import { actorAppearance } from "../core/character";
import { formatHistoricalYear } from "../core/calendar";
import { CharacterSprite } from "./CharacterSprite";
import { ArrivalMap } from "./ArrivalMap";
import { arrivalBackdrop, birthPercentile } from "./arrival-data";
import "./arrival.css";

export function Arrival({ setting, engine, onEnter, onCancel }: {
  setting: WorldSetting;
  engine?: Engine;
  onEnter: () => void;
  onCancel: () => void;
}) {
  const player = engine?.state.player;
  const age = player?.age ?? 34;
  const appearance = useMemo(() => actorAppearance(player ?? {
    id: "player", sprite: "human-0-0", age,
  }, resolveCharacterContext(setting).appearance), [player, setting, age]);
  const sex = player?.origin?.sex && player.origin.sex !== "unspecified"
    ? player.origin.sex : appearance.physique?.sex ?? sexFromName(setting.characterName);
  const birth = birthPercentile(setting.year);
  const goal = engine?.dailyGoals()[0]?.text;
  return <div className="arrival" role="dialog" aria-modal="true" aria-label={`Begin ${setting.characterName}'s life`}>
    <div className="arrival-scene" style={{ backgroundImage: `url(${arrivalBackdrop(setting)})` }} />
    <div className="arrival-top"><span>Universal History Simulator</span><button type="button" onClick={onCancel}>Back</button></div>
    <section className="arrival-strip">
      <div className="arrival-person">
        <div className="arrival-portrait"><CharacterSprite appearance={appearance} age={age} portrait /></div>
        <div className="arrival-identity"><h1>{player?.name ?? setting.characterName}</h1><p>{age} · {sex === "female" ? "Woman" : sex === "male" ? "Man" : "Person"} · {player?.role ?? setting.role}</p>{goal && <p className="arrival-goal">{goal}</p>}</div>
      </div>
      <div className="arrival-location"><ArrivalMap lon={setting.lon} lat={setting.lat} year={setting.year} place={setting.location} /><p>{setting.location} · {formatHistoricalYear(setting.year)}</p></div>
      <div className="arrival-time">
        {birth !== null && <><div className="arrival-ring" style={{ background: `conic-gradient(#ddb66e ${birth}%, #5d6370 ${birth}% 100%)` }}><div><strong>{birth}%</strong></div></div><p>of all estimated human births came before this life</p><a href="https://www.prb.org/news/how-many-people-have-ever-lived-on-earth/" target="_blank" rel="noreferrer">Population Reference Bureau</a></>}
        <button className="arrival-enter" type="button" disabled={!engine} onClick={onEnter}>{engine ? "Enter life →" : "Creating world…"}</button>
      </div>
      <div className={engine ? "arrival-progress is-ready" : "arrival-progress"} aria-hidden="true" />
    </section>
  </div>;
}
