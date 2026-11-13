import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CharacterAppearance } from "../../core/character";
import type { TableGame } from "../../content/games";
import { boneCanvas } from "./art";
import { BoneThrow, Coins, Dice, Face, Pool, Sprite, UrBoard } from "./parts";
import { useBones, useUr, type Money, type Sitting } from "./play";
import "./gaming.css";

/** Someone at the table: a person from the room, drawn as the world draws them. */
export type Seat = { id: string; name: string; trade: string; age: number; appearance: CharacterAppearance };

type Props = {
  game: TableGame;
  seed: string;
  /** Where and when, under the title: "The gaming house · Alexandria, 332 BCE". */
  place: string;
  seats: Seat[];
  /** Undefined where nobody plays for coin. */
  purse?: number;
  /** "four obols" */
  money: Money;
  onLeave: (sitting: Sitting) => void;
};

function useKey(key: string, f: () => void) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key !== key || (e.target as HTMLElement).tagName === "INPUT") return;
      e.preventDefault();
      e.stopPropagation();
      f();
    };
    window.addEventListener("keydown", on, true);
    return () => window.removeEventListener("keydown", on, true);
  });
}

function Rail({ game, place, children, log, onLeave }: { game: TableGame; place: string; children: React.ReactNode; log: string[]; onLeave: () => void }) {
  const [tab, setTab] = useState<"table" | "rules">("table");
  return (
    <aside className="g-rail">
      <header>
        <h2>{game.title}</h2>
        <p>
          {game.aka} · {place}
        </p>
        <div className="side-tabs g-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "table"} onClick={() => setTab("table")}>
            Table
          </button>
          <button role="tab" aria-selected={tab === "rules"} onClick={() => setTab("rules")}>
            Rules
          </button>
        </div>
      </header>
      {tab === "table" ? (
        <>
          {children}
          <button className="g-leave" onClick={onLeave}>
            <kbd>Esc</kbd> Get up from the table
          </button>
          <ol className="g-log">
            {log.map((line, i) => (
              <li key={log.length - i}>{line}</li>
            ))}
          </ol>
        </>
      ) : (
        <div className="g-rules">
          {game.sides && (
            <div className="g-sides">
              {game.sides.map(([side, name, gloss]) => (
                <div key={side}>
                  <Sprite src={boneCanvas(side)} scale={3} />
                  <b>{name}</b>
                  <small>{gloss}</small>
                </div>
              ))}
            </div>
          )}
          <dl>
            {game.lines.map(([name, text]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
          <h3>What we know</h3>
          <dl className="g-evidence">
            {game.evidence.map(([kind, text]) => (
              <div key={kind} data-kind={kind}>
                <dt>{kind}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </aside>
  );
}

function Plaque({ seat, scale = 2, children, onClick, disabled }: { seat: Seat; scale?: number; children?: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  const body = (
    <>
      <span className="portrait g-face">
        <Face appearance={seat.appearance} age={seat.age} scale={scale} />
      </span>
      <span>
        <b>{seat.name}</b>
        <small>{children ?? seat.trade}</small>
      </span>
    </>
  );
  return onClick ? (
    <button className="g-plaque" onClick={onClick} disabled={disabled}>
      {body}
    </button>
  ) : (
    <div className="g-plaque">{body}</div>
  );
}

function Bones({ game, seed, place, seats, purse, money, onLeave }: Props) {
  const g = useBones(game, seed, seats.map((s) => s.name), purse ?? 0, money);
  const [asking, setAsking] = useState<number>();
  const leave = () => onLeave(g.sitting());
  useKey(" ", g.play);
  useKey("Escape", leave);
  const you = g.players[0];
  return (
    <div className="g-room">
      <div className="g-table">
        <div className="g-seats" style={{ gridTemplateColumns: `repeat(${seats.length}, 1fr)` }}>
          {seats.map((seat, k) => {
            const i = k + 1;
            const p = g.players[i];
            const t = g.last?.throws[i];
            return (
              <div key={seat.id} className={`g-seat${p.out ? " is-out" : ""}${g.last?.win[0] === i && !g.rolling ? " is-winner" : ""}`}>
                <Plaque seat={seat} onClick={game.cheat ? () => setAsking(asking === i ? undefined : i) : undefined} disabled={!!p.out || !!g.over}>
                  {p.out ? p.out : seat.trade}
                </Plaque>
                {asking === i && !p.out && (
                  <div className="g-ask">
                    <button
                      onClick={() => {
                        setAsking(undefined);
                        g.accuse(i);
                      }}
                    >
                      Grab {seat.name}'s bones and look
                    </button>
                    <small>If they're honest, you're the one thrown out.</small>
                  </div>
                )}
                <Coins n={p.purse} />
                <div className="g-spot">
                  <BoneThrow bones={p.out ? undefined : t} scale={3} tumbling={g.rolling && !!t} />
                  {t && !g.rolling && <span className="g-call">{g.named(t)}</span>}
                </div>
                <div className="g-strip" title="Earlier throws">
                  {p.history.slice(t && !g.rolling ? 1 : 0, 6).map((h, j) => (
                    <span key={j}>
                      {h.map((s, n) => (
                        <Sprite key={n} src={boneCanvas(s)} scale={1} />
                      ))}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="g-pot">
          <Coins n={g.pot} max={40} />
          <span>{g.pot ? `${money(g.pot)} in the ${game.rule === "augustus" ? "pool" : "pot"}` : `the ${game.rule === "augustus" ? "pool" : "pot"}`}</span>
        </div>
        <div className={`g-seat g-you${g.last?.win[0] === 0 && !g.rolling ? " is-winner" : ""}`}>
          <div className="g-spot">
            <BoneThrow bones={g.last?.throws[0]} scale={5} tumbling={g.rolling} />
            {g.last?.throws[0] && !g.rolling && <span className="g-call">{g.named(g.last.throws[0])}</span>}
          </div>
          <Coins n={you.purse} max={40} />
        </div>
      </div>
      <Rail game={game} place={place} log={g.log} onLeave={leave}>
        <div className="g-purse">
          <div>
            <small>Your purse</small>
            <b>{money(you.purse)}</b>
          </div>
          {game.rule === "most" && (
            <div>
              <small>Stake</small>
              <span className="g-seg">
                {[1, 3].map((n) => (
                  <button key={n} aria-pressed={g.stake === n} onClick={() => g.setStake(n)} disabled={g.rolling}>
                    {n}
                  </button>
                ))}
              </span>
            </div>
          )}
        </div>
        <p className="g-note" aria-live="polite">
          {g.over ?? g.note}
        </p>
        {!g.over && (
          <div className="g-actions">
            <button className="filled-button" onClick={g.play} disabled={g.rolling || you.purse < g.need}>
              Throw <kbd>Space</kbd>
            </button>
          </div>
        )}
        {game.cheat && !g.over && <p className="g-hint">Click a player to accuse them.</p>}
      </Rail>
    </div>
  );
}

function Ur({ game, seed, place, seats, purse, money, onLeave }: Props) {
  const them = seats[0];
  const g = useUr(seed, them.name, purse, money);
  const leave = () => onLeave(g.sitting());
  useKey(" ", g.throwDice);
  useKey("Escape", leave);
  const enter = g.moves.find((m) => m.from === 0);
  const done = g.game.winner !== undefined;
  return (
    <div className="g-room">
      <div className="g-table is-ur">
        <div className={`g-seat g-them${g.game.turn === 1 && !done ? " is-turn" : ""}`}>
          <Plaque seat={them} />
        </div>
        <div className="g-ur">
          <div className="g-ur-pools">
            <Pool side={1} game={g.game} where="waiting" scale={3} />
            <Pool side={1} game={g.game} where="home" scale={3} />
          </div>
          <div className="g-ur-board">
            <UrBoard game={g.game} moves={g.moves} onMove={g.move} scale={5} />
            <Dice roll={g.roll} scale={4} tumbling={g.rolling} />
          </div>
          <div className="g-ur-pools">
            <Pool side={0} game={g.game} where="waiting" scale={3} move={enter} onMove={g.move} />
            <Pool side={0} game={g.game} where="home" scale={3} />
          </div>
        </div>
        {purse !== undefined && (
          <div className="g-pot">
            <Coins n={g.started ? g.stake * 2 : 0} />
            <span>{g.started ? `${money(g.stake * 2)} staked` : "no stake yet"}</span>
          </div>
        )}
      </div>
      <Rail game={game} place={place} log={g.log} onLeave={leave}>
        {purse !== undefined && (
          <div className="g-purse">
            <div>
              <small>Your purse</small>
              <b>{money(g.purse)}</b>
            </div>
            <div>
              <small>Stake</small>
              <span className="g-seg">
                {[1, 2].map((n) => (
                  <button key={n} aria-pressed={g.stake === n} onClick={() => g.setStake(n)} disabled={g.started}>
                    {n}
                  </button>
                ))}
              </span>
            </div>
          </div>
        )}
        <p className="g-note" aria-live="polite">
          {g.note}
        </p>
        <div className="g-actions">
          {done ? (
            <button className="filled-button" onClick={g.again}>
              Play again
            </button>
          ) : (
            <button className="filled-button" onClick={g.throwDice} disabled={g.game.turn !== 0 || !!g.roll}>
              Throw <kbd>Space</kbd>
            </button>
          )}
        </div>
        <p className="g-hint">{g.moves.length ? "Click a ringed piece, or your waiting pieces, to move." : g.started ? "Getting up now forfeits your stake." : " "}</p>
      </Rail>
    </div>
  );
}

/** A table game in a gaming house or tavern: the people and the board are the interface, the rail keeps the books. */
export function GamingTable(props: Props) {
  return createPortal(
    <div className="g-overlay" role="dialog" aria-modal="true" data-modal="true" aria-label={props.game.title}>
      {props.game.engine === "ur" ? <Ur {...props} /> : <Bones {...props} />}
    </div>,
    document.body,
  );
}
