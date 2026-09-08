import { portableProps } from "../render/characters/props";
import { useEffect, useRef } from "react";
import Phaser from "phaser";
import {
  generateAppearance,
  originalAppearance,
  type CharacterAppearance,
} from "../core/character";
import { WorldScene } from "../render/WorldScene";
import type { LightingId } from "../render/lighting";
import { createLabRuntime, parseLabConfig } from "./fixtures";
/** A small real WorldScene, not a separate approximation of the game renderer. */
export function CharacterVillage({
  appearance,
  age,
  lighting,
  prop,
}: {
  appearance: CharacterAppearance;
  age: number;
  lighting: LightingId;
  prop: string;
}) {
  const mount = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = mount.current!;
    const config = {
      ...parseLabConfig("?study=courtyard&scene=board"),
      lighting,
    };
    const runtime = createLabRuntime(config);
    runtime.engine.world.places = runtime.engine.world.places.filter(
      (p) => p.y < 0,
    );
    const base = runtime.engine.state.player;
    const adult = generateAppearance("village", 1, 40, {
      strength: 90,
      sex: "male",
    });
    const elder = generateAppearance("village", 2, 75, {
      strength: 30,
      sex: "female",
    });
    const child = generateAppearance("village", 3, 10);
    const tall = generateAppearance("village", 4, 30);
    const people: CharacterAppearance[] = [
      appearance,
      originalAppearance,
      {
        ...adult,
        height: 0,
        head: "broad",
        jaw: "square",
        hair: "cropped",
        beard: "stubble",
        bodyShape: "tapered",
        posture: "hand-on-hip",
        wearing: {
          ...adult.wearing,
          garment: "long-tunic",
          sleeves: "short",
          headwear: "none",
          cloak: false,
        },
      },
      {
        ...elder,
        height: 0,
        head: "oval",
        jaw: "small",
        beard: "none",
        hair: "bob",
        posture: "stooped",
        wearing: {
          ...elder.wearing,
          garment: "robe",
          sleeves: "loose",
          cloak: false,
        },
      },
      {
        ...child,
        height: -1,
        head: "round",
        jaw: "soft",
        posture: "attentive",
        wearing: { ...child.wearing, garment: "skirt", cloak: false },
      },
      {
        ...tall,
        height: 1,
        posture: "hands-together",
        wearing: {
          ...tall.wearing,
          garment: "wrap",
          shoulderCloth: true,
          cloak: false,
        },
      },
    ];
    const positions = [
      [-3, 3],
      [0, 3],
      [3, 3],
      [-3, 6],
      [0, 6],
      [3, 6],
    ];
    const actors = people.map((a, i) => ({
      ...base,
      id: i ? `study-person-${i}` : "player",
      name: [
        "Selected",
        "Original",
        "Strong adult",
        "Elder",
        "Child",
        "Tall adult",
      ][i],
      appearance: a,
      age: [age, 30, 40, 75, 10, 30][i],
      direction: [2, 2, 1, 3, 2, 1][i],
      activity: "idle",
      pos: { x: positions[i][0], y: positions[i][1], space: "outside" },
      inventory: {},
    }));
    runtime.engine.state.player = actors[0];
    const held = portableProps.find((p) => p.sprite === prop);
    if (held) {
      runtime.engine.state.player.held = "village-held";
      runtime.engine.state.objects.push({
        id: "village-held",
        name: held.name,
        kind: "container",
        prop: held.id,
        sprite: held.sprite,
        pos: { ...actors[0].pos },
        inventory: {},
        carriedBy: "player",
      });
    }
    runtime.engine.state.actors = actors.slice(1);
    runtime.zoom = 3;
    const scene = new WorldScene(runtime, {
      lab: true,
      freeze: false,
      lighting,
      shadows: true,
      colorGrade: true,
    });
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: host.clientWidth,
      height: host.clientHeight,
      pixelArt: true,
      roundPixels: true,
      antialias: false,
      render: { preserveDrawingBuffer: true },
      scene,
      audio: { noAudio: true },
      banner: false,
    });
    const observer = new ResizeObserver(() =>
      game.scale.resize(host.clientWidth, host.clientHeight),
    );
    observer.observe(host);
    return () => {
      observer.disconnect();
      game.destroy(true);
    };
  }, [appearance, age, lighting, prop]);
  return (
    <section className="cl-section">
      <h2>Village study · six characters</h2>
      <p>
        Selected recipe, original adult, strong adult, elder, child, and tall
        adult. Uses the game renderer and the lighting selected above.
      </p>
      <div ref={mount} className="cl-village" data-testid="character-village" />
    </section>
  );
}
