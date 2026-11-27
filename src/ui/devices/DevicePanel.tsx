import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Runtime } from "../../runtime/session";
import { deviceMessages, radioStation, type DeviceApp, type DeviceModel } from "../../content/devices";
import { talkOf } from "../../content/history/tidings";
import { amountIn } from "../../content/economy/money";
import { skySeed, weatherAt } from "../../core/weather";
import { knowsPlayer } from "../../narrator/dialogue";
import { themes } from "../../audio/score";
import { tone, type Sound } from "../../audio/sfx";
import { timeLabel } from "../components";
import { games, type Game, type Pad } from "./games";
import "./devices.css";

type DeviceAudio = {
  sound(cue: Sound, key?: string): Promise<void>;
  cue(themeId: string): Promise<void>;
};
/** The piezo beeper every one of these had: square waves, one note at a time. */
const beeps = (notes: number[], each = 0.15): Sound =>
  notes.map((midi, i) => tone(i * each, each * 0.85, 0.12, 440 * 2 ** ((midi - 69) / 12), { wave: "square" }));

const LABELS: Record<DeviceApp, string> = {
  call: "Contacts", messages: "Messages", news: "News", weather: "Weather", clock: "Clock", map: "Map", money: "Money",
  tones: "Ring tones", assistant: "Assistant", worm: "Worm", catch: "Parcel Drop", runner: "Roof Cat", radio: "Radio", tape: "Music",
};
const TONES: { name: string; notes: number[] }[] = [
  { name: "Ring ring", notes: [88, 84, 88, 84, 88, 84] },
  { name: "Ascending", notes: [72, 76, 79, 84, 88] },
  { name: "Grasshopper", notes: [91, 91, 86, 91, 91, 86] },
  { name: "Low battery", notes: [79, 72, 67] },
];
const STATIONS = 6;

function GameScreen({ game, mono, pad }: { game: Game; mono: boolean; pad: { current: Pad } }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  useEffect(() => {
    const ctx = ref.current!.getContext("2d")!;
    let timer = 0;
    const [ink, ghost] = mono ? ["#1c2a1a", "#8a9a76"] : ["#e8f0d8", "#3a4a3a"];
    const tick = () => {
      game.step(pad.current);
      pad.current = { x: 0, y: 0, a: false };
      ctx.clearRect(0, 0, game.width, game.height);
      game.draw(ctx, ink, ghost);
      setScore(game.score());
      if (game.over()) return setOver(true);
      timer = window.setTimeout(tick, game.pace());
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [game, mono, pad]);
  return (
    <div className="device-game">
      <canvas ref={ref} width={game.width} height={game.height} />
      <p>{over ? `Game over · ${score}` : `${score} · ${game.help}`}</p>
    </div>
  );
}

export function DevicePanel({ runtime, model, audio, onClose, onCall, onMap }: {
  runtime: Runtime;
  model: DeviceModel;
  audio?: DeviceAudio | null;
  onClose: () => void;
  onCall: (actorId: string) => void;
  onMap: () => void;
}) {
  const { state } = runtime.engine, setting = runtime.engine.world.pack.setting, p = state.player;
  const only = model.apps.length === 1 ? model.apps[0] : undefined;
  const [app, setApp] = useState<DeviceApp | undefined>(only);
  const [cursor, setCursor] = useState(0);
  const [opened, setOpened] = useState<number>();
  const [round, setRound] = useState(0);
  const pad = useRef<Pad>({ x: 0, y: 0, a: false });
  const mono = !model.colour;

  const contacts = useMemo(
    () => state.actors.filter((a) => a.kind === "human" && !a.dead && a.id !== p.id && knowsPlayer(runtime, a)).slice(0, 12),
    [state.actors, p.id, runtime],
  );
  const news = useMemo(() => (setting ? talkOf(setting, "*") : []), [setting]);
  const balance = setting ? amountIn(setting, p.inventory.coin ?? 0, true) : `${p.inventory.coin ?? 0} coins`;
  const messages = useMemo(
    () => deviceMessages(model, {
      seed: state.manifest.seed, day: Math.floor(state.clock / 86400), year: setting?.year ?? 2000, culture: setting?.culture,
      place: setting?.location ?? "town", people: contacts.map((a) => a.name.split(" ")[0]),
      asks: (state.asks ?? []).flatMap((ask) => {
        const by = state.actors.find((a) => a.id === ask.by);
        return by ? [{ from: by.name.split(" ")[0], what: ask.what }] : [];
      }),
      news, balance,
    }),
    // The clock moves while this is open; the day's messages do not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model, contacts, news],
  );
  const forecast = setting
    ? [0, 1, 2].map((d) => weatherAt(skySeed(state.manifest), setting.climate, setting.season, (Math.floor(state.clock / 86400) + d) * 86400 + 13 * 3600))
    : [];
  const game = useMemo(() => (app && games[app] ? games[app]!(Date.now() + round) : undefined), [app, round]);

  const rows: string[] =
    !app ? model.apps.map((a) => LABELS[a])
    : app === "call" ? contacts.map((a) => a.name)
    : app === "messages" ? messages.map((m) => (m.from ? `${m.from}: ${m.text}` : m.text))
    : app === "news" ? news
    : app === "tones" ? TONES.map((t) => t.name)
    : app === "tape" ? themes.map((t, i) => `${model.from >= 2002 ? `${i + 1}.` : i < 3 ? "A" : "B"} ${t.title}`)
    : [];
  const beep = (midi = 84) => void audio?.sound(beeps([midi], 0.06), "device-key");

  const back = () => {
    if (opened !== undefined) return setOpened(undefined);
    if (app && !only) return setApp(undefined), setCursor(model.apps.indexOf(app));
    onClose();
  };
  const choose = (index = cursor) => {
    beep();
    if (game) return game.over() ? setRound((n) => n + 1) : void (pad.current = { ...pad.current, a: true });
    if (!app) {
      const next = model.apps[index];
      if (next === "map") return onMap();
      return setApp(next), setCursor(0), setOpened(undefined);
    }
    if (app === "call" && contacts[index]) return onCall(contacts[index].id);
    if (app === "messages" || app === "news") return setOpened(opened === undefined ? index : undefined);
    if (app === "tones") return void audio?.sound(beeps(TONES[index].notes), "device-tone");
    if (app === "tape") return void audio?.cue(themes[index].id);
  };
  const move = (dx: number, dy: number) => {
    if (game) return void (pad.current = { x: dx, y: dy, a: pad.current.a });
    if (app === "radio") return setCursor((c) => (c + (dx || dy) + STATIONS) % STATIONS), beep(60 + cursor);
    if (opened !== undefined) return;
    const n = rows.length;
    if (n) setCursor((c) => (c + (dy || dx) + n) % n);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const arrow = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
      if (arrow) move(arrow[0], arrow[1]);
      else if (e.key === "Enter" || e.key === " ") choose();
      else if (e.key === "Backspace" || e.key === "Escape") back();
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("keydown", down, true);
    return () => window.removeEventListener("keydown", down, true);
  });

  const clock = timeLabel(state.clock);
  const message = app === "messages" && opened !== undefined ? messages[opened] : undefined;
  const station = radioStation({ seed: state.manifest.seed, year: setting?.year ?? 1970, place: setting?.location ?? "town", clock: state.clock }, cursor);
  const screen =
    game ? <GameScreen key={round} game={game} mono={mono} pad={pad} />
    : app === "clock" ? <div className="device-big"><b>{clock}</b><span>Day {Math.floor(state.clock / 86400) + 1}{setting ? ` · ${setting.season}` : ""}</span></div>
    : app === "weather" ? (
      <ul className="device-list">
        {forecast.map((w, i) => <li key={i}><span>{["Today", "Tomorrow", "Day after"][i]}</span><b>{w.label} {Math.round(w.tempC)}°</b></li>)}
      </ul>
    )
    : app === "money" ? <div className="device-big"><span>Balance</span><b>{balance}</b><span>{model.shell === "slab" ? "Hold near the reader or show your code to pay." : "Dial the menu to send or withdraw at an agent."}</span></div>
    : app === "assistant" ? (
      <p className="device-text">
        It is {clock}. {forecast[0] ? `${forecast[0].label}, ${Math.round(forecast[0].tempC)} degrees. ` : ""}
        {news[0] ? `People are talking about this: ${news[0]} ` : ""}
        {messages.length ? `You have ${messages.length} messages; ${messages.filter((m) => m.from && !/alert|number|money|network/i.test(m.from)).length} are from people you know. ` : ""}
        {(state.asks ?? []).length ? "You have promised something to someone today." : "Nothing is asked of you today."}
      </p>
    )
    : app === "radio" ? (
      <div className="device-radio">
        <div className="device-dial"><i style={{ left: `${8 + (cursor * 84) / (STATIONS - 1)}%` }} /></div>
        <p className="device-text">{station}</p>
      </div>
    )
    : message ? <p className="device-text">{message.from && <b>{message.from}<br /></b>}{message.text}{message.note && <em><br />{message.note}</em>}</p>
    : app === "news" && opened !== undefined ? <p className="device-text">{news[opened]}</p>
    : rows.length ? (
      <ul className={`device-list${!app && model.shell === "slab" ? " is-grid" : ""}`}>
        {rows.map((row, i) => (
          <li key={i} className={i === cursor ? "is-on" : undefined} onClick={() => { setCursor(i); choose(i); }}>{row}</li>
        ))}
      </ul>
    )
    : <p className="device-text">{app === "call" ? "No numbers saved yet. Meet someone first." : app === "news" ? "No signal. Try again later." : "Nothing new."}</p>;

  return createPortal(
    <div className="device-backdrop" role="dialog" aria-modal="true" data-modal="true" aria-label={model.name} onClick={onClose}>
      <div className={`device device-${model.shell}${mono ? " is-mono" : ""}`} onClick={(e) => e.stopPropagation()}>
        {model.shell === "tape" && !model.colour && <div className="device-reels" data-playing={app === "tape" || undefined}><i /><i /></div>}
        <div className="device-screen">
          <header><span>{app ? LABELS[app] : model.shell === "pager" ? "Pages" : model.name}</span><span>{clock}</span></header>
          {screen}
        </div>
        <div className="device-keys">
          <button aria-label="Back" onClick={back}>{app && !only ? "Back" : "Off"}</button>
          <div className="device-pad">
            <button aria-label="Up" onClick={() => move(0, -1)}>▲</button>
            <button aria-label="Left" onClick={() => move(-1, 0)}>◀</button>
            <button aria-label="Right" onClick={() => move(1, 0)}>▶</button>
            <button aria-label="Down" onClick={() => move(0, 1)}>▼</button>
          </div>
          <button aria-label="Select" onClick={() => choose()}>{game ? "A" : "OK"}</button>
        </div>
        <p className="device-name">{model.name}</p>
      </div>
    </div>,
    document.body,
  );
}
