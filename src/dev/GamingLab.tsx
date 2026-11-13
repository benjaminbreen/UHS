import { useMemo, useState } from "react";
import { generateAppearance } from "../core/character";
import { tableGames } from "../content/games";
import { GamingTable, type Seat } from "../ui/gaming/GamingTable";
import "./gaming-lab.css";

const PEOPLE = [
  ["Kleon", "soldier", 38],
  ["Harsiese", "potter", 52],
  ["Philon", "sailor", 27],
] as const;

/** Every table game with stand-in players. `/gaming-lab?game=ur`. */
export function GamingLab() {
  const [id, setId] = useState(new URLSearchParams(window.location.search).get("game") ?? tableGames[0].id);
  const [round, setRound] = useState(0);
  const game = tableGames.find((g) => g.id === id) ?? tableGames[0];
  const seats: Seat[] = useMemo(
    () => PEOPLE.slice(0, game.seats).map(([name, trade, age], i) => ({ id: name, name, trade, age, appearance: generateAppearance(`lab:${round}`, i, age, { sex: "male" }) })),
    [game, round],
  );
  const [left, setLeft] = useState<string>();
  const pick = (g: string) => {
    setId(g);
    setLeft(undefined);
    window.history.replaceState(null, "", `?game=${g}`);
  };
  return (
    <div className="g-lab">
      <nav className="g-switch">
        <span>
          {tableGames.map((g) => (
            <button key={g.id} aria-pressed={g.id === id} onClick={() => pick(g.id)}>
              {g.id}
            </button>
          ))}
        </span>
        <button onClick={() => { setRound((n) => n + 1); setLeft(undefined); }}>New table</button>
      </nav>
      {left ? (
        <p className="g-left">{left}</p>
      ) : (
        <GamingTable
          key={`${id}:${round}`}
          game={game}
          seed={`gaming-lab:${round}`}
          place="Gaming lab"
          seats={seats}
          purse={12}
          money={(n) => `${n} ${n === 1 ? "coin" : "coins"}`}
          onLeave={(s) => setLeft(`Got up ${s.net >= 0 ? "+" : ""}${s.net} after ${s.minutes} minutes${s.outcome ? ` (${s.outcome})` : ""}.`)}
        />
      )}
    </div>
  );
}
