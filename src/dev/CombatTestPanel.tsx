import { useState } from "react";
import { X } from "lucide-react";
import { faunaCombat, faunaProfiles } from "../content/fauna";
import { propDefs } from "../content/props/catalog";
import {
  faunaTiers,
  weaponOf,
  weaponProps,
  type FaunaTier,
} from "../core/combat";

type Props = {
  onSpawn: (species: string, count: number, tier?: FaunaTier) => number;
  onClear: () => void;
  onArm: (prop?: string) => void;
  onHeal: () => void;
  onClose: () => void;
};

/** Summon animals and take up a weapon without leaving the world. The animals
 * are real ones: simulated, saved, and able to be hurt. */
export function CombatTestPanel({
  onSpawn,
  onClear,
  onArm,
  onHeal,
  onClose,
}: Props) {
  const [species, setSpecies] = useState("rabbit");
  const [tier, setTier] = useState<FaunaTier | "random">("random");
  const [count, setCount] = useState(3);
  const [weapon, setWeapon] = useState("stick");
  const [message, setMessage] = useState("");
  const profile = faunaProfiles.find((p) => p.id === species)!;
  const combat = faunaCombat(profile);
  const arm = (prop: string) => {
    setWeapon(prop);
    onArm(prop || undefined);
  };
  const spawn = (id = species, n = count) => {
    const added = onSpawn(id, n, tier === "random" ? undefined : tier);
    setMessage(added ? `${added} added nearby.` : "Go outdoors first.");
  };
  const stats = weaponOf(
    weapon.startsWith("item:") ? undefined : weapon || undefined,
  );
  return (
    <aside
      className="live-graphics-panel combat-test-panel"
      aria-label="Combat test"
    >
      <header>
        <div>
          <span>DEVELOPER</span>
          <strong>Combat test</strong>
        </div>
        <button aria-label="Close combat test" onClick={onClose}>
          <X size={16} />
        </button>
      </header>
      <section className="live-animal-controls">
        <label>
          Weapon
          <select value={weapon} onChange={(e) => arm(e.currentTarget.value)}>
            <option value="">Bare hands</option>
            <option value="item:pebble">Ten pebbles to throw</option>
            <option value="item:bow">Bow and twenty arrows</option>
            {weaponProps.map((id) => (
              <option key={id} value={id}>
                {propDefs[id]?.name ?? id}
              </option>
            ))}
          </select>
        </label>
        <p>
          {weapon === "item:bow"
            ? "Bow · 3–8 damage · 10 tiles. Hold F or right mouse, aim with the cursor, release."
            : `Damage ${stats.damage} · knockback ${stats.knock}. F strikes; hold X or right mouse and aim with the cursor to throw.`}
        </p>
        <div className="live-animal-actions">
          <button onClick={() => arm(weapon)}>Take it in hand</button>
          <button onClick={onHeal}>Heal</button>
        </div>
      </section>
      <section className="live-animal-controls">
        <label>
          Species
          <select
            value={species}
            onChange={(e) => setSpecies(e.currentTarget.value)}
          >
            {faunaProfiles.map((animal) => (
              <option key={animal.id} value={animal.id}>
                {animal.label.replace(/ study$/, "")}
              </option>
            ))}
          </select>
        </label>
        <p>
          {combat.hp} hp · mass {combat.mass} ·{" "}
          {combat.temper === "charge"
            ? `charges for ${combat.damage}`
            : combat.temper === "pack"
              ? `circles and lunges for ${combat.damage}`
              : "bolts"}
        </p>
        <label>
          Tier
          <select
            value={tier}
            onChange={(e) =>
              setTier(e.currentTarget.value as FaunaTier | "random")
            }
          >
            <option value="random">Random</option>
            {faunaTiers.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>
            Count <output>{count}</output>
          </span>
          <input
            aria-label="Animal count"
            type="range"
            min="1"
            max="12"
            value={count}
            onChange={(e) => setCount(Number(e.currentTarget.value))}
          />
        </label>
        <div className="live-animal-actions">
          <button onClick={() => spawn()}>Summon</button>
          <button
            onClick={() => {
              onClear();
              setMessage("Summoned animals cleared.");
            }}
          >
            Clear
          </button>
        </div>
        <div className="live-animal-actions">
          {["rabbit", "sheep", "wild-boar", "gray-wolf", "aurochs"].map(
            (id) => (
              <button key={id} onClick={() => spawn(id, 3)}>
                3 {id.replace(/wild-|gray-/, "")}
              </button>
            ),
          )}
        </div>
        <p role="status">{message || "Animals appear in a ring round you."}</p>
      </section>
    </aside>
  );
}
