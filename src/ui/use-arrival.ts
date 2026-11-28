import { useEffect, useMemo, useState } from "react";
import type { Engine } from "../core/engine";
import type { WorldSetting } from "../content/geography/types";
import type { StartingCharacter } from "../runtime/preparation";
import { resolveCharacterContext } from "../content/characters/resolve";
import { sexFromName } from "../content/characters/name-sex";
import { actorAppearance, appearanceForAge, type CharacterAppearance } from "../core/character";

/** Who is arriving and the walk out of the screen, shared by both arrival layouts. */
export function useArrival({ setting, engine, character, ready, onEnter }: {
  setting: WorldSetting;
  engine?: Engine;
  character?: StartingCharacter;
  ready: boolean;
  onEnter: () => void;
}) {
  const [requested, setRequested] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [opening] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (!requested || !ready) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) onEnter();
    else setLeaving(true);
  }, [requested, ready, onEnter]);
  const player = engine?.state.player ?? character;
  const age = player?.age;
  const baseAppearance = useMemo(() => engine
    ? actorAppearance(engine.state.player, resolveCharacterContext(setting).appearance)
    : character ? appearanceForAge(character.appearance, character.age) : undefined,
  [engine, character, setting]);
  const [resolved, setResolved] = useState<{ engine: Engine; appearance: CharacterAppearance }>();
  useEffect(() => {
    if (!engine || !baseAppearance) return;
    let active = true;
    void import("../runtime/session").then(({ resolvedAppearance }) => {
      if (active) setResolved({ engine, appearance: resolvedAppearance(engine, engine.state.player, baseAppearance) });
    });
    return () => { active = false; };
  }, [engine, baseAppearance]);
  const appearance = resolved && resolved.engine === engine ? resolved.appearance : baseAppearance;
  const sex = player?.origin?.sex && player.origin.sex !== "unspecified"
    ? player.origin.sex : appearance?.physique?.sex ?? sexFromName(setting.characterName);
  return { requested, setRequested, leaving, opening, player, age, appearance, sex };
}
