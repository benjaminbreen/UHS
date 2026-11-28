import { useState } from "react";
import { createPortal } from "react-dom";
import type { Runtime } from "../runtime/session";
import { coinsFor, type Dish } from "../content/economy/menus";
import { amountIn } from "../content/economy/money";
import { gameAudio } from "../audio/director";
import "./menu.css";

const LOOK: Record<string, string> = { cafe: "chalk", ale: "chalk", beer: "chalk", diner: "letters" };

export function MenuPanel({ runtime, actorId, onClose, onGoods }: { runtime: Runtime; actorId: string; onClose: () => void; onGoods?: () => void }) {
  const engine = runtime.engine, served = engine.menuOf(actorId), setting = engine.world.pack.setting;
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [note, setNote] = useState<string>();
  if (!served || !setting) return null;
  const { actor, menu } = served, bar = menu.bars[0];
  const picked: Dish[] = menu.dishes.flatMap((d) => Array<Dish>(counts[d.name] ?? 0).fill(d));
  const coins = picked.length ? coinsFor(menu, picked) : 0, purse = engine.state.player.inventory.coin ?? 0;
  const bump = (name: string, n: number) => setCounts((c) => ({ ...c, [name]: Math.max(0, Math.min(6, (c[name] ?? 0) + n)) }));
  const order = () => {
    const result = runtime.command({ type: "order", target: actorId, dishes: picked.map((d) => d.name) });
    if (result?.status === "completed") { setCounts({}); setNote(engine.state.events.at(-1)?.text); }
    else { setNote(result?.reason ?? "They do not serve you."); void gameAudio()?.interfaceSound("deny"); }
  };

  return createPortal(
    <div className="menu-backdrop" role="dialog" aria-modal="true" data-modal="true" aria-label={menu.heading} onClick={onClose}>
      <div className={`menu menu-${LOOK[bar] ?? "card"}`} onClick={(e) => e.stopPropagation()}>
        <header><h2>{menu.heading}</h2><span>{actor.name} · {actor.role}</span></header>
        <ul>
          {menu.dishes.map((d) => (
            <li key={d.name} data-on={counts[d.name] ? true : undefined}>
              <span className="menu-dish">{d.name}{d.note && <em>{d.note}</em>}</span>
              {menu.money && <span className="menu-price">{menu.money(d.price)}</span>}
              <span className="menu-count">
                <button aria-label={`One less ${d.name}`} disabled={!counts[d.name]} onClick={() => bump(d.name, -1)}>−</button>
                <b>{counts[d.name] ?? 0}</b>
                <button aria-label={`One more ${d.name}`} onClick={() => bump(d.name, 1)}>+</button>
              </span>
            </li>
          ))}
        </ul>
        <footer>
          <span>{coins ? `${amountIn(setting, coins, true)} · ` : ""}You have {amountIn(setting, purse, true)}</span>
          {note && <span className="menu-note">{note}</span>}
          <div>
            {onGoods && <button onClick={onGoods}>Goods</button>}
            <button onClick={onClose}>Leave</button>
            <button className="primary" disabled={!coins || coins > purse} onClick={order}>Order</button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
