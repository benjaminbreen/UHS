import { useEffect, useMemo, useRef, useState } from "react";
import { battles, type Battle, type Ground, type Order } from "../content/arms/battles";
import { kitById, kits, type Kit } from "../content/arms/kits";
import { armours, arms } from "../content/arms/weapons";
import { muster, Skirmish, STEP, type Input } from "../core/skirmish";
import { ArenaView } from "./view";
import "./arena.css";

type Pick = { mode: "battle" | "duel"; battle: string; side: 0 | 1 | "watch"; you: string; allies: number; foe: string; foes: number; ground: Ground };
const ORDERS: [string, Order, string][] = [["1", "hold", "Hold"], ["2", "advance", "Advance"], ["3", "charge", "Charge"], ["4", "fallback", "Fall back"]];
const regions = [...new Set(kits.map((k) => k.region))];

function initial(): Pick {
  const q = new URLSearchParams(window.location.search);
  const side = q.get("side");
  return {
    mode: q.get("battle") ? "battle" : "duel",
    battle: q.get("battle") ?? battles[0].id,
    side: side === "watch" ? "watch" : side === "1" ? 1 : 0,
    you: kitById.has(q.get("you") ?? "") ? q.get("you")! : "samurai",
    allies: Number(q.get("allies") ?? 0),
    foe: kitById.has(q.get("foe") ?? "") ? q.get("foe")! : "man-at-arms",
    foes: Number(q.get("foes") ?? 2),
    ground: (q.get("ground") as Ground) ?? "grass",
  };
}

/** A pair of kits as a battle of its own, so the duel and the set pieces run on the same thing. */
function duel(p: Pick): Battle {
  const you = kitById.get(p.you)!, foe = kitById.get(p.foe)!;
  const far = [you, foe].some((k) => k.mounted || arms[k.main].shot) ? 12 : 7;
  return {
    id: "duel", name: `${you.name} against ${foe.name}`, when: "", note: "", ground: p.ground, size: [far * 2 + 16, 18], sideNames: [you.name, foe.name], player: [0, 0],
    sides: [
      [{ name: you.name, kit: you.id, count: 1 + p.allies, ranks: 1, at: [8, 9], order: "charge", gap: 1.6 }],
      [{ name: foe.name, kit: foe.id, count: p.foes, ranks: p.foes > 6 ? 2 : 1, at: [8 + far * 2, 9], order: "charge", gap: 1.6 }],
    ],
  };
}

type Hud = {
  hp: number; stamina: number; arm: string; arms: { name: string; left?: number }[]; special: string; ready: boolean; loaded?: boolean; ammo?: number; mounted: boolean; braced: boolean;
  counts: [number, number]; units: { name: string; side: number; morale: number; routed: boolean; order: string }[]; result?: string; fell: boolean; time: number;
};

function KitSelect({ value, onChange, label }: { value: string; onChange: (id: string) => void; label: string }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.currentTarget.value)}>
        {regions.map((r) => (
          <optgroup key={r} label={r}>
            {kits.filter((k) => k.region === r).map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
function KitCard({ kit }: { kit: Kit }) {
  const a = arms[kit.main], b = kit.side ? arms[kit.side] : undefined;
  const worn = kit.wear?.armour === "cuirass" ? "plate" : (kit.wear?.armour ?? "none");
  return (
    <div className="cl-kit">
      <strong>{kit.name}</strong>
      <span>{[a, b, ...(kit.more ?? []).map((id) => arms[id])].filter(Boolean).map((x) => x!.name).join(" · ")} · {armours[worn as keyof typeof armours].label.toLowerCase()}{kit.wear?.shield && kit.wear.shield !== "none" ? ` · ${kit.wear.shield} shield` : ""}{kit.mounted ? " · mounted" : ""}</span>
      <p>{kit.note}</p>
      <p><em>{a.name}.</em> {a.note} <b>E: {a.specialName}.</b></p>
    </div>
  );
}

/** Fights to play: any two kinds of fighter against each other, or a set
 * battle with the player in the line. `/arena?battle=agincourt`. */
export function Arena() {
  const [pick, setPick] = useState(initial);
  const [round, setRound] = useState(0);
  const [hud, setHud] = useState<Hud>();
  const [log, setLog] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [slow, setSlow] = useState(false);
  const [immune, setImmune] = useState(false);
  const [mute, setMute] = useState(false);
  const [auto, setAuto] = useState(() => new URLSearchParams(window.location.search).has("auto"));
  const [open, setOpen] = useState(true);
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({ paused, slow, immune, mute, auto });
  live.current = { paused, slow, immune, mute, auto };

  const battle = useMemo(() => (pick.mode === "duel" ? duel(pick) : battles.find((b) => b.id === pick.battle)!), [pick]);
  const set = (change: Partial<Pick>) => {
    const next = { ...pick, ...change };
    setPick(next);
    const q = next.mode === "battle" ? `?battle=${next.battle}&side=${next.side}` : `?you=${next.you}&foe=${next.foe}&foes=${next.foes}&allies=${next.allies}&ground=${next.ground}`;
    window.history.replaceState(null, "", q);
  };

  useEffect(() => {
    const el = canvas.current!;
    const side = pick.mode === "duel" ? 0 : pick.side;
    const sim = new Skirmish(muster(battle, `arena-${round}`, side === "watch" ? undefined : [side, side === battle.player[0] ? battle.player[1] : 0]));
    const kitOf = new Map(sim.fighters.map((f) => {
      const [s, n] = f.unit.split("-").map(Number);
      return [f.id, kitById.get(battle.sides[s][n].kit)!];
    }));
    const view = new ArenaView(el, sim, battle.ground, kitOf);
    view.zoom = pick.mode === "battle" && el.clientWidth < 1500 ? 2 : 3;
    (window as unknown as { __arena?: unknown }).__arena = { sim, view };
    setLog([]);

    const keys = new Set<string>();
    const mouse = { x: 0, y: 0, moved: false, left: false, right: false };
    const edge = { jump: false, special: false, swap: false };
    let lastMove = 0;
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("select,input")) return;
      const k = e.key.toLowerCase();
      if (k === " ") edge.jump = true, e.preventDefault();
      else if (k === "e") edge.special = true;
      else if (k === "x" || k === "q") edge.swap = true;
      else if (k === "r") setRound((n) => n + 1);
      else if (k === "p") setPaused((p) => !p);
      else if (k === "z") view.zoom = view.zoom === 3 ? 2 : view.zoom === 2 ? 4 : 3;
      else if (side !== "watch") for (const [key, order] of ORDERS) if (k === key) sim.order(side, order);
      keys.add(k);
    };
    const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.moved = true;
    };
    const press = (e: MouseEvent) => {
      if (e.button === 0) mouse.left = true;
      if (e.button === 2) mouse.right = true;
      move(e);
    };
    const release = (e: MouseEvent) => {
      if (e.button === 0) mouse.left = false;
      if (e.button === 2) mouse.right = false;
    };
    const menu = (e: Event) => e.preventDefault();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    // Keys held when the window loses focus never send their release.
    const blur = () => { keys.clear(); mouse.left = mouse.right = false; };
    window.addEventListener("blur", blur);
    el.addEventListener("mousemove", move);
    el.addEventListener("mousedown", press);
    window.addEventListener("mouseup", release);
    el.addEventListener("contextmenu", menu);

    const input = (): Input | undefined => {
      const me = sim.fighters.find((f) => f.player);
      if (!me) return undefined;
      const mx = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
      const my = (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0);
      if (mx || my) lastMove = Math.atan2(my, mx);
      let aim = lastMove, aimDist = 6;
      if (mouse.moved) {
        const wx = (mouse.x / view.zoom + view.origin.x) / 16, wy = (mouse.y / view.zoom + view.origin.y + 10) / 16;
        aim = Math.atan2(wy - me.y, wx - me.x);
        aimDist = Math.hypot(wx - me.x, wy - me.y);
      } else {
        // No mouse: face the nearest of them.
        let best = 7;
        for (const e of sim.fighters) {
          const d = Math.hypot(e.x - me.x, e.y - me.y);
          if (e.side !== me.side && sim.alive(e) && d < best) best = d, (aim = Math.atan2(e.y - me.y, e.x - me.x)), (aimDist = d);
        }
      }
      const out: Input = { mx, my, aim, aimDist, attack: mouse.left || keys.has("f"), guard: mouse.right || keys.has("g"), run: keys.has("shift"), ...edge };
      // A press made mid-blow waits for the hands to be free.
      edge.jump = false;
      if (me.act === "ready") edge.special = edge.swap = false;
      return out;
    };

    let raf = 0, last = performance.now(), acc = 0, freeze = 0, tick = 0, over = 0;
    let inHand = sim.fighters.find((f) => f.player)?.arm.id;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      view.mute = live.current.mute;
      // Once it is decided the field keeps moving for a breath, then holds.
      if (!over && sim.winner() !== undefined) over = sim.time + 2.5;
      if (!live.current.paused && !(over && sim.time > over)) {
        if (freeze > 0) freeze -= dt;
        else acc += dt * (live.current.slow ? 0.4 : 1);
        while (acc >= STEP) {
          acc -= STEP;
          sim.step(live.current.auto ? undefined : input());
          const me = sim.fighters.find((f) => f.player);
          if (me && live.current.immune && me.act !== "dead") me.hp = 100;
          if (me && me.arm.id !== inHand) {
            inHand = me.arm.id;
            view.say(me.x, me.y, me.arm.name.toUpperCase(), "#ffe06a");
          }
          const fb = view.consume();
          if (fb.log.length) setLog((l) => [...l, ...fb.log].slice(-5));
          if (fb.freeze > 0) {
            freeze = fb.freeze;
            acc = 0;
          }
        }
      }
      view.draw(dt);
      if (++tick % 6 === 0) {
        const me = sim.fighters.find((f) => f.player), w = sim.winner();
        setHud({
          hp: me?.hp ?? 0, stamina: me?.stamina ?? 0, arm: me?.arm.name ?? "",
          arms: me ? [me.arm, me.other, ...me.rest].filter((a) => !!a).map((a) => ({ name: a!.name, left: a!.shot ? me.ammo[a!.id] : undefined })) : [], special: me?.arm.specialName ?? "", ready: !!me && sim.time >= me.cooldown && (me.stamina >= 30 || me.arm.special === "brace"),
          loaded: me?.arm.shot ? me.loaded : undefined, ammo: me?.arm.shot ? me.ammo[me.arm.id] : undefined, mounted: !!me && me.horse > 0, braced: !!me?.braced,
          counts: [sim.standing(0), sim.standing(1)], time: sim.time, fell: !!me && me.act === "dead",
          units: [...sim.units.values()].map((u) => ({ name: u.name, side: u.side, morale: u.morale, routed: u.routed, order: u.order })),
          result: w === undefined ? undefined : side === "watch" ? `${battle.sideNames[w]} hold the field` : w === side ? "Victory" : "Defeat",
        });
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      window.removeEventListener("mouseup", release);
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mousedown", press);
      el.removeEventListener("contextmenu", menu);
    };
  }, [battle, round, pick.mode, pick.side]);

  const mine = pick.mode === "duel" ? 0 : pick.side;
  return (
    <div className="arena">
      <canvas ref={canvas} />
      <aside className={`cl-panel${open ? "" : " shut"}`}>
        <header>
          <span>ANY CENTURY</span>
          <strong>The battlefield</strong>
          <button onClick={() => setOpen(!open)}>{open ? "Hide" : "Set up"}</button>
        </header>
        {open && (
          <>
            <nav>
              <button aria-pressed={pick.mode === "duel"} onClick={() => set({ mode: "duel" })}>Match-up</button>
              <button aria-pressed={pick.mode === "battle"} onClick={() => set({ mode: "battle" })}>Battle</button>
            </nav>
            {pick.mode === "duel" ? (
              <>
                <KitSelect label="You" value={pick.you} onChange={(you) => set({ you })} />
                <label>Friends beside you <output>{pick.allies}</output>
                  <input type="range" min="0" max="10" value={pick.allies} onChange={(e) => set({ allies: Number(e.currentTarget.value) })} />
                </label>
                <KitSelect label="Against" value={pick.foe} onChange={(foe) => set({ foe })} />
                <label>How many <output>{pick.foes}</output>
                  <input type="range" min="1" max="16" value={pick.foes} onChange={(e) => set({ foes: Number(e.currentTarget.value) })} />
                </label>
                <label>Ground
                  <select value={pick.ground} onChange={(e) => set({ ground: e.currentTarget.value as Ground })}>
                    {["grass", "dirt", "sand", "mud", "snow"].map((g) => <option key={g}>{g}</option>)}
                  </select>
                </label>
                <KitCard kit={kitById.get(pick.you)!} />
                <KitCard kit={kitById.get(pick.foe)!} />
              </>
            ) : (
              <>
                <label>Battle
                  <select value={pick.battle} onChange={(e) => set({ battle: e.currentTarget.value })}>
                    {battles.map((b) => <option key={b.id} value={b.id}>{b.name} · {b.when}</option>)}
                  </select>
                </label>
                <nav>
                  <button aria-pressed={pick.side === 0} onClick={() => set({ side: 0 })}>{battle.sideNames[0]}</button>
                  <button aria-pressed={pick.side === 1} onClick={() => set({ side: 1 })}>{battle.sideNames[1]}</button>
                  <button aria-pressed={pick.side === "watch"} onClick={() => set({ side: "watch" })}>Watch</button>
                </nav>
                <p className="cl-note">{battle.note}</p>
                {battle.sides.map((side, s) => (
                  <ul key={s} className={`cl-side s${s}`}>
                    {side.map((u, n) => <li key={n}>{u.count} × {kitById.get(u.kit)!.name}</li>)}
                  </ul>
                ))}
              </>
            )}
            <div className="cl-row">
              <button className="go" onClick={() => setRound((n) => n + 1)}>Restart (R)</button>
              <button aria-pressed={paused} onClick={() => setPaused(!paused)}>Pause (P)</button>
            </div>
            <div className="cl-row">
              <button aria-pressed={slow} onClick={() => setSlow(!slow)}>Slow motion</button>
              <button aria-pressed={immune} onClick={() => setImmune(!immune)}>Cannot die</button>
              <button aria-pressed={mute} onClick={() => setMute(!mute)}>Mute</button>
            </div>
            <div className="cl-row">
              <button aria-pressed={auto} onClick={() => setAuto(!auto)}>Let the computer fight for you</button>
            </div>
          </>
        )}
      </aside>

      {hud && (
        <>
          <div className="cl-score">
            <span className="s0">{battle.sideNames[0]} <b>{hud.counts[0]}</b></span>
            <span className="s1"><b>{hud.counts[1]}</b> {battle.sideNames[1]}</span>
          </div>
          {pick.mode === "battle" && (
            <ul className="cl-units">
              {hud.units.map((u, i) => (
                <li key={i} className={`s${u.side}${u.routed ? " routed" : ""}`}>
                  <span>{u.name}</span>
                  <i><b style={{ width: `${Math.max(0, u.morale)}%` }} /></i>
                  <em>{u.routed ? "routed" : u.order}</em>
                </li>
              ))}
            </ul>
          )}
          {mine !== "watch" && (
            <div className="cl-me">
              <strong>{hud.arm}{hud.mounted ? " · mounted" : ""}{hud.braced ? " · braced" : ""}</strong>
              <i className="hp"><b style={{ width: `${Math.max(0, hud.hp)}%` }} /></i>
              <i className="wind"><b style={{ width: `${hud.stamina}%` }} /></i>
              <span className={hud.ready ? "ready" : ""}>E · {hud.special}</span>
              {hud.loaded !== undefined && <span>{hud.loaded ? "Loaded" : "Reloading"} · {hud.ammo} left</span>}
              {hud.arms?.length > 1 && (
                <ol className="cl-arms">
                  {hud.arms.map((a, i) => <li key={a.name} aria-current={i === 0}>{i === 1 && <kbd>X</kbd>}{a.name}{a.left !== undefined && <b>{a.left}</b>}</li>)}
                </ol>
              )}
            </div>
          )}
          <ul className="cl-log">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
          {(hud.result || hud.fell) && (
            <div className="cl-result">
              <strong>{hud.result ?? "You are down"}</strong>
              <span>{hud.result ? `${Math.round(hud.time)} seconds` : "The fight goes on without you."}</span>
              <button onClick={() => setRound((n) => n + 1)}>Again (R)</button>
            </div>
          )}
        </>
      )}
      <div className="cl-keys">
        <b>WASD</b> walk <b>Shift</b> run <b>Space</b> jump, or leap on a horse <b>F / click</b> strike; keep it held to wind up a wide swing, or to draw a bow <b>G / right click</b> guard; raise it as the blow lands to parry
        <b>E</b> special <b>X</b> other weapon{mine !== "watch" && <> <b>1–4</b> order your side</>} <b>Z</b> zoom
      </div>
    </div>
  );
}
