import { useEffect, useRef, useState } from "react";
import { random } from "../../core/random";
import { augustus, throwBones, throwKind, throwScore, winners, type Side } from "../../core/games/knucklebones";
import { HOME, rollUr, urApply, urMoves, urPass, urPick, urStart, type UrMove, type UrState } from "../../core/games/ur";
import type { TableGame } from "../../content/games";

/** What a sitting comes to, settled with the engine when the player gets up. */
export type Sitting = { net: number; minutes: number; outcome?: "caught" | "thrown-out" };
export type Money = (n: number) => string;

function useRand(seed: string) {
  const n = useRef(0);
  return () => random(seed, n.current++);
}

export interface Gambler {
  name: string;
  purse: number;
  loaded: number;
  history: Side[][];
  fromYou: number;
  out?: string;
}

const ROUND_MINUTES = 3;

export function useBones(game: TableGame, seed: string, names: string[], start: number, money: Money) {
  const rand = useRand(seed);
  const [cheat] = useState(() => (game.cheat ? 1 + Math.floor(random(seed, "cheat") * names.length) : -1));
  const [players, setPlayers] = useState<Gambler[]>(() => [
    { name: "You", purse: start, loaded: 0, history: [], fromYou: 0 },
    ...names.map((name, i) => ({ name, purse: 8 + Math.floor(random(seed, "purse", i) * 12), loaded: i + 1 === cheat ? 2 : 0, history: [], fromYou: 0 })),
  ]);
  const [pot, setPot] = useState(0);
  const [inPot, setInPot] = useState(0);
  const [stake, setStake] = useState(1);
  const [rounds, setRounds] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [last, setLast] = useState<{ throws: (Side[] | undefined)[]; win: number[] }>();
  const [outcome, setOutcome] = useState<Sitting["outcome"]>();
  const [over, setOver] = useState<string>();
  const [log, setLog] = useState<string[]>([]);
  const [note, setNote] = useState(game.rule === "augustus" ? "Every one or six you throw costs a coin into the pool. Throw Venus and it is yours." : "Everyone puts in the stake and throws four bones. The highest throw takes the pot.");
  const say = (line: string) => {
    setNote(line);
    setLog((l) => [line, ...l].slice(0, 30));
  };
  const named = (t: Side[]) => (throwKind(t) === "best" ? game.best! : throwKind(t) === "dog" ? "the Dog" : String(throwScore(t)));
  // Under Augustus's rule a throw can cost up to four coins; nobody sits down without them.
  const need = game.rule === "augustus" ? 4 : stake;

  const play = () => {
    if (rolling || over) return;
    if (players[0].purse < need) return say(`You don't have ${money(need)} to play with.`);
    const live = players.map((p) => !p.out && p.purse >= need);
    if (live.filter(Boolean).length < 2) return say("No one is left to play.");
    const throws = players.map((p, i) => (live[i] ? throwBones(rand, p.loaded) : undefined));
    setRolling(true);
    setLast({ throws, win: [] });
    window.setTimeout(() => {
      setRolling(false);
      setRounds((n) => n + 1);
      if (game.rule === "augustus") {
        const r = augustus(throws, pot);
        const w = r.take.findIndex((n) => n > 0);
        setLast({ throws, win: w >= 0 ? [w] : [] });
        setPot(r.pot);
        setPlayers((ps) =>
          ps.map((p, i) => {
            if (!throws[i]) return p;
            const purse = p.purse - r.pay[i] + r.take[i];
            return { ...p, purse, out: i > 0 && !p.out && purse < 4 ? "has run out and goes home" : p.out, history: [throws[i]!, ...p.history] };
          }),
        );
        const mine = r.pay[0];
        say(w === 0 ? `Venus! You take the pool: ${money(r.take[0])}.` : w > 0 ? `${players[w].name} throws Venus and takes ${money(r.take[w])}.` : mine ? `You put ${money(mine)} in the pool. It holds ${money(r.pot)}.` : `Nothing to pay. The pool holds ${money(r.pot)}.`);
        return;
      }
      const inPlay = throws.flatMap((t, i) => (t ? [i] : []));
      const win = winners(inPlay.map((i) => throws[i]!)).map((k) => inPlay[k]);
      const total = pot + stake * inPlay.length;
      setLast({ throws, win });
      setPlayers((ps) =>
        ps.map((p, i) => {
          if (!throws[i]) return p;
          const purse = p.purse - stake + (win[0] === i ? total : 0);
          const out = i > 0 && !p.out && purse < 1 ? "has nothing left and goes home" : p.out;
          return { ...p, purse, out, history: [throws[i]!, ...p.history], fromYou: p.fromYou + (win[0] === i && i > 0 ? inPot + stake : 0) };
        }),
      );
      const w = win[0];
      if (w === undefined) {
        setPot(total);
        setInPot((n) => n + stake);
        say(`A tie at the top. ${money(total)} stay in the pot.`);
      } else {
        setPot(0);
        setInPot(0);
        say(w === 0 ? `You throw ${named(throws[0]!)} and take ${money(total)}.` : `${players[w].name} throws ${named(throws[w]!)} and takes ${money(total)}.`);
      }
    }, 950);
  };

  const accuse = (i: number) => {
    if (rolling || over || !players[i] || players[i].out) return;
    const p = players[i];
    if (p.loaded) {
      setPlayers((ps) => ps.map((q, j) => (j === 0 ? { ...q, purse: q.purse + p.fromYou } : j === i ? { ...q, purse: q.purse - p.fromYou, out: "was caught with weighted bones", fromYou: 0 } : q)));
      setOutcome("caught");
      say(`You grab ${p.name}'s bones. Two are filed flat on the narrow side and heavy with lead. ${p.name} pays back the ${money(p.fromYou)} taken from you and is thrown out.`);
    } else {
      setOutcome("thrown-out");
      setOver(`${p.name}'s bones are honest. The table turns on you and you are shown the door.`);
      say(`${p.name}'s bones are honest.`);
    }
  };

  const sitting = (): Sitting => ({ net: players[0].purse - start, minutes: Math.max(1, rounds * ROUND_MINUTES), outcome });
  return { players, pot, stake, setStake, need, rolling, last, note, log, over, play, accuse, sitting, named };
}

export function moveLabel(m: UrMove) {
  const head = m.from === 0 ? `Enter a piece on square ${m.to}` : m.to === HOME ? `Bear off the piece on ${m.from}` : `Move from ${m.from} to ${m.to}`;
  const tail = [m.capture && "takes theirs", m.rosette && "rosette, throw again"].filter(Boolean).join(" · ");
  return { head, tail };
}

/** `start` undefined: nobody here plays for coin, so the game is played for nothing. */
export function useUr(seed: string, them: string, start: number | undefined, money: Money) {
  const rand = useRand(seed);
  const [game, setGame] = useState<UrState>(urStart);
  const [roll, setRoll] = useState<{ dice: boolean[]; total: number }>();
  const [rolling, setRolling] = useState(false);
  const [purse, setPurse] = useState(start ?? 0);
  const [stake, setStake] = useState(start === undefined ? 0 : 1);
  const [started, setStarted] = useState(false);
  const [turns, setTurns] = useState(0);
  const [note, setNote] = useState(`${them} sets out the pieces.${start === undefined ? " Nobody here plays for coin." : " You each stake on the game."}`);
  const [log, setLog] = useState<string[]>([]);
  const say = (line: string) => {
    setNote(line);
    setLog((l) => [line, ...l].slice(0, 30));
  };
  const moves = roll && !rolling && game.turn === 0 ? urMoves(game, roll.total) : [];

  const finish = (next: UrState) => {
    if (next.winner === undefined) return;
    setStarted(false);
    if (next.winner === 0) setPurse((p) => p + stake * 2);
    say(next.winner === 0 ? `All seven home. You win${stake ? ` ${money(stake * 2)}` : ""}.` : `${them} bears off the last piece${stake ? " and takes the stakes" : ""}.`);
  };

  const throwDice = () => {
    if (rolling || game.turn !== 0 || roll || game.winner !== undefined) return;
    if (!started) {
      if (purse < stake) return say(`You don't have ${money(stake)} to stake.`);
      setPurse((p) => p - stake);
      setStarted(true);
    }
    const r = rollUr(rand);
    setRolling(true);
    setRoll(r);
    setTurns((n) => n + 1);
    window.setTimeout(() => {
      setRolling(false);
      if (!urMoves(game, r.total).length) {
        say(r.total ? `You throw ${r.total}, but nothing can move.` : "You throw 0. Nothing moves.");
        window.setTimeout(() => {
          setRoll(undefined);
          setGame(urPass);
        }, 900);
      } else say(`You throw ${r.total}.`);
    }, 650);
  };

  const move = (m: UrMove) => {
    const next = urApply(game, m);
    setGame(next);
    setRoll(undefined);
    if (m.capture) say("You knock one of theirs back to the start.");
    else if (m.rosette && next.winner === undefined) say("A rosette. Throw again.");
    finish(next);
  };

  useEffect(() => {
    if (game.turn !== 1 || game.winner !== undefined) return;
    const r = rollUr(rand);
    let t = window.setTimeout(() => {
      setRoll(r);
      setRolling(true);
      t = window.setTimeout(() => {
        setRolling(false);
        const options = urMoves(game, r.total);
        t = window.setTimeout(() => {
          setRoll(undefined);
          if (!options.length) {
            say(`${them} throws ${r.total} and can't move.`);
            return setGame(urPass);
          }
          const m = urPick(game, options);
          const next = urApply(game, m);
          say(m.capture ? `${them} throws ${r.total} and sends one of yours back.` : m.rosette ? `${them} throws ${r.total}, lands on a rosette and goes again.` : `${them} throws ${r.total}.`);
          setGame(next);
          finish(next);
        }, 700);
      }, 650);
    }, 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  const again = () => {
    setGame(urStart());
    setRoll(undefined);
    say("The pieces go back in their box and out again.");
  };

  // A game abandoned halfway forfeits the stake, which is already out of the purse.
  const sitting = (): Sitting => ({ net: purse - (start ?? 0), minutes: Math.max(1, turns) });
  return { game, roll, rolling, moves, purse, stake, setStake: (n: number) => !started && setStake(n), started, note, log, throwDice, move, again, sitting };
}
