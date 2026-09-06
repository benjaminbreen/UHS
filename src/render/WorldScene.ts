import { buildingContains, buildingPlacement } from "./buildings";
import { terrainVariant, type RenderOptions } from "./appearance";
import Phaser from "phaser";
import type { Runtime } from "../runtime/session";
import type { Position } from "../core/types";
import { surfaceAt, hasQuay } from "./materials";
import { random } from "../core/random";
import { lightingAt, lightingPreset, shadowFrame } from "./lighting";
import terrainFrames from "./generated/terrain.json" with { type: "json" };
export class WorldScene extends Phaser.Scene {
  private runtime: Runtime;
  private layers: Phaser.GameObjects.GameObject[] = [];
  private ground?: Phaser.Tilemaps.TilemapLayer;
  private tilemap?: Phaser.Tilemaps.Tilemap;
  private shadows = new Map<string, Phaser.GameObjects.Image>();
  private ripples: { image: Phaser.GameObjects.Image; phase: number }[] = [];
  private rippleTime = -1;
  private entities = new Map<string, Phaser.GameObjects.Image>();
  private selection?: Phaser.GameObjects.Graphics;
  private unsubscribe?: () => void;
  private staticKey = "";
  private buildings = new Map<string, Phaser.GameObjects.Image>();
  private lastInput = 0;
  private lastTick = 0;
  private ready = false;
  private lastRevision = -1;
  private light = lightingAt(9 * 3600);
  private tint = 0xffffff;
  private shadowPhase = this.light.id;
  private night?: Phaser.GameObjects.Graphics;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<string, Phaser.Input.Keyboard.Key>;
  constructor(
    runtime: Runtime,
    private options: RenderOptions = {},
  ) {
    super("world");
    this.runtime = runtime;
  }
  preload() {
    this.load.atlas("atlas", "/packs/atlas.png", "/packs/atlas.json");
    this.load.atlas(
      "lighting-shadows",
      "/packs/lighting-shadows.png",
      "/packs/lighting-shadows.json",
    );
    this.load.image("terrain", "/packs/terrain.png");
  }
  create() {
    this.ready = true;
    this.cameras.main.setBackgroundColor("#819253");
    this.cameras.main.roundPixels = true;
    this.selection = this.add.graphics().setDepth(20000);
    this.night = this.add.graphics().setDepth(19000).setScrollFactor(0);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    this.input.keyboard!.removeCapture([
      "UP",
      "DOWN",
      "LEFT",
      "RIGHT",
      "SPACE",
    ]);
    this.game.canvas.setAttribute("data-ready", "true");
    this.input.keyboard!.on("keydown", (event: KeyboardEvent) => {
      if (this.options.lab) return;
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        document.querySelector('[data-modal="true"]')
      )
        return;
      const step: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        a: [-1, 0],
        ArrowRight: [1, 0],
        d: [1, 0],
        ArrowUp: [0, -1],
        w: [0, -1],
        ArrowDown: [0, 1],
        s: [0, 1],
      };
      const direction = step[event.key] ?? step[event.key.toLowerCase()];
      if (direction) {
        event.preventDefault();
        if (!event.repeat) {
          this.lastInput = this.time.now;
          this.runtime.move(...direction);
        }
      }
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown() || this.options.lab) return;
      const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const x = Math.floor(p.x / 16),
        y = Math.floor(p.y / 16);
      const obs = this.runtime.engine.observe();
      const actor = obs.actors.find(
        (a) => Math.abs(a.pos.x - x) <= 0.7 && Math.abs(a.pos.y - y) <= 0.7,
      );
      const object = obs.objects.find(
        (o) => Math.abs(o.pos.x - x) <= 0.8 && Math.abs(o.pos.y - y) <= 0.8,
      );
      const place = obs.places.find((b) => buildingContains(b, p.x, p.y));
      if (actor || object || place)
        this.runtime.select((actor || object || place)!.id);
      else {
        this.runtime.select(undefined);
        this.runtime.walkTo({ x, y });
      }
    });
    this.input.on(
      "wheel",
      (_p: unknown, _g: unknown, _dx: number, dy: number) => {
        if (dy && !this.options.lab)
          this.runtime.setZoom(this.runtime.zoom + (dy < 0 ? 1 : -1));
      },
    );
    this.scale.on("resize", () => this.draw());
    this.unsubscribe = this.runtime.subscribe(() => this.draw());
    this.events.once("shutdown", () => this.unsubscribe?.());
    this.draw();
    this.options.onReady?.();
  }
  private sprite(frame: string, x: number, y: number, depth: number) {
    const image = this.add
      .image(x, y, "atlas", frame)
      .setOrigin(0.5, 1)
      .setTint(this.tint)
      .setDepth(depth);
    this.layers.push(image);
    return image;
  }
  private shadow(frame: string, x: number, y: number, transient = false) {
    if (this.options.shadows === false) return undefined;
    const key = shadowFrame(this.shadowPhase, frame);
    if (!this.textures.get("lighting-shadows").has(key)) return undefined;
    const image = this.add
      .image(x, y, "lighting-shadows", key)
      .setOriginFromFrame()
      .setDepth(-60000);
    if (!transient) this.layers.push(image);
    return image;
  }
  draw() {
    if (!this.ready) return;
    const rt = this.runtime,
      e = rt.engine,
      p = e.state.player.pos,
      w = e.world;
    this.light = this.options.lighting
      ? lightingPreset(this.options.lighting)
      : lightingAt(e.state.clock);
    this.tint =
      this.options.colorGrade === false
        ? 0xffffff
        : parseInt(this.light.tint, 16);
    this.shadowPhase = p.space === "outside" ? this.light.id : "night";
    const c = this.cameras.main;
    c.setZoom(rt.zoom);
    if (!this.entities.has("player")) c.centerOn(p.x * 16 + 8, p.y * 16 + 8);
    const bx = Math.floor(p.x / 16) * 16,
      by = Math.floor(p.y / 16) * 16;
    const key = [
      e.state.manifest.seed,
      w.pack.id,
      p.space,
      bx,
      by,
      rt.zoom,
      this.light.id,
      this.tint,
      this.scale.width,
      this.scale.height,
    ].join(":");
    if (key !== this.staticKey) {
      this.staticKey = key;
      for (const l of this.layers) l.destroy();
      this.layers = [];
      this.ripples = [];
      this.buildings.clear();
      this.ground?.destroy();
      this.tilemap?.destroy();
      const halfX = Math.ceil(this.scale.width / rt.zoom / 32) + 20,
        halfY = Math.ceil(this.scale.height / rt.zoom / 32) + 20;
      const startX = bx - halfX,
        startY = by - halfY;
      const width = halfX * 2 + 16,
        height = halfY * 2 + 16;
      const data = Array.from({ length: height }, (_, iy) =>
        Array.from({ length: width }, (_, ix) => {
          const x = startX + ix,
            y = startY + iy;
          const t =
            p.space === "outside"
              ? surfaceAt(w, x, y, rt.terrainAt(x, y, p.space))
              : rt.terrainAt(x, y, p.space);
          const variant = terrainVariant(e.state.manifest.seed, t, x, y);
          return (
            (terrainFrames as Record<string, number>)[
              t === "bridge"
                ? w.pack.landscape.bridge === "stone"
                  ? `paving${variant}`
                  : "bridge"
                : `${t === "water" ? w.pack.landscape.water : t}${variant}`
            ] ?? 0
          );
        }),
      );
      this.tilemap = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
      const ts = this.tilemap.addTilesetImage(
        "terrain",
        "terrain",
        16,
        16,
        0,
        0,
      )!;
      this.ground = this.tilemap
        .createLayer(0, ts, startX * 16, startY * 16)!
        .setDepth(-100000)
        .setTint(this.tint);
      if (p.space === "outside") {
        const neighbors = [
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 0],
          [1, -1],
          [1, 1],
          [-1, 1],
          [-1, -1],
        ] as const;
        for (let y = startY; y < startY + height; y++)
          for (let x = startX; x < startX + width; x++) {
            const t = surfaceAt(w, x, y);
            if (t === "water") {
              let mask = 0;
              neighbors.forEach(([dx, dy], i) => {
                const n = w.terrain(x + dx, y + dy);
                if (n !== "water" && n !== "bridge") mask |= 1 << i;
              });
              if (mask && !hasQuay(w, x, y))
                this.sprite(`bank-${mask}`, x * 16 + 8, y * 16 + 16, -70000);
              if (
                !mask &&
                random(e.state.manifest.seed, "ripple", x, y) < 0.28
              ) {
                const phase = Math.floor(
                  random(e.state.manifest.seed, "ripple-phase", x, y) * 4,
                );
                const image = this.sprite(
                  `ripple-${phase}`,
                  x * 16 + 8,
                  y * 16 + 16,
                  -85000,
                );
                this.ripples.push({ image, phase });
              }
            } else if (["dirt", "paving", "sand", "field"].includes(t)) {
              let mask = 0;
              neighbors.forEach(([dx, dy], i) => {
                if (surfaceAt(w, x + dx, y + dy) === w.pack.ground)
                  mask |= 1 << i;
              });
              if (mask)
                this.sprite(
                  `edge-${w.pack.ground}-${mask}`,
                  x * 16 + 8,
                  y * 16 + 16,
                  -80000,
                );
            }
            if (
              w.terrain(x, y) === "water" &&
              w.terrain(x, y - 1) === "bridge" &&
              hasQuay(w, x, y)
            ) {
              let left = x;
              while (
                w.terrain(left - 1, y) === "water" &&
                w.terrain(left - 1, y - 1) === "bridge" &&
                x - left < 16
              )
                left--;
              if (
                (x - left) % 3 === 0 &&
                [0, 1, 2].every(
                  (dx) =>
                    w.terrain(x + dx, y) === "water" &&
                    w.terrain(x + dx, y - 1) === "bridge",
                )
              )
                this.sprite("bridge-arch", x * 16 + 24, y * 16 + 30, -65000);
            }
            if (w.terrain(x, y) === "water" && hasQuay(w, x, y)) {
              for (const [side, dx, dy] of [
                ["east", 1, 0],
                ["west", -1, 0],
                ["north", 0, -1],
                ["south", 0, 1],
              ] as const) {
                if (w.terrain(x + dx, y + dy) !== "water")
                  this.sprite(`quay-${side}`, x * 16 + 8, y * 16 + 16, -70000);
              }
            }
            if (
              w.terrain(x, y) === "sand" &&
              !hasQuay(w, x, y) &&
              surfaceAt(w, x, y) === "sand" &&
              random(e.state.manifest.seed, "reeds", x, y) <
                w.pack.landscape.reeds
            )
              this.sprite("reeds", x * 16 + 8, y * 16 + 16, y * 16 + 11);
            const d = w.decoration(x, y);
            if (d) {
              const frame =
                d.sprite === "rock"
                  ? ["rock", "rock-1", "rock-2"][
                      Math.floor(
                        random(e.state.manifest.seed, "rock-art", x, y) * 3,
                      )
                    ]
                  : d.sprite;
              this.shadow(frame, x * 16 + 8, y * 16 + 16);
              this.sprite(frame, x * 16 + 8, y * 16 + 16, y * 16 + 12);
            }
          }
        for (const b of w.places)
          if (
            b.x > startX - 8 &&
            b.x < startX + width + 8 &&
            b.y > startY - 8 &&
            b.y < startY + height + 8
          ) {
            const placement = buildingPlacement(b);
            // The cast texture uses the source canvas's bottom anchor; model owns its offset.
            this.shadow(
              b.sprite,
              placement.x,
              placement.y +
                placement.model.bounds[3] -
                placement.model.anchor[1],
            );
            const image = this.sprite(
              b.sprite,
              placement.x,
              placement.y,
              placement.depth,
            ).setOrigin(placement.originX, placement.originY);
            this.buildings.set(b.id, image);
          }
        for (const fence of w.enclosures) {
          if (Math.abs(fence.x - p.x) > 100 || Math.abs(fence.y - p.y) > 100)
            continue;
          for (let x = fence.x; x < fence.x + fence.w; x++)
            for (let y = fence.y; y < fence.y + fence.h; y++)
              if (
                (x === fence.x ||
                  x === fence.x + fence.w - 1 ||
                  y === fence.y ||
                  y === fence.y + fence.h - 1) &&
                !(x === fence.gate.x && y === fence.gate.y)
              )
                this.sprite("fence", x * 16 + 8, y * 16 + 16, y * 16 + 10);
        }
      } else {
        const dark = this.add.graphics().setDepth(-50000);
        dark.fillStyle(0x252923, 1);
        dark.fillRect(
          (startX - 1) * 16,
          (startY - 1) * 16,
          (width + 2) * 16,
          (1 - startY) * 16,
        );
        dark.fillRect(
          (startX - 1) * 16,
          10 * 16,
          (width + 2) * 16,
          (height + 1) * 16,
        );
        dark.fillRect((startX - 1) * 16, 16, (2 - startX) * 16, 9 * 16);
        dark.fillRect(12 * 16, 16, width * 16, 9 * 16);
        dark.lineStyle(6, 0x8c7959);
        dark.strokeRect(16, 16, 11 * 16, 9 * 16);
        this.layers.push(dark);
        this.sprite("oven", 9 * 16, 7 * 16, 7 * 16);
        this.sprite("mat", 5 * 16, 5 * 16, 5 * 16);
      }
    }
    for (const [id, image] of this.buildings) {
      const b = w.place(id)!;
      image.setAlpha(
        !this.options.lab && buildingContains(b, p.x * 16 + 8, p.y * 16 + 8)
          ? 0.45
          : 1,
      );
    }
    const obs = e.observe(),
      keep = new Set<string>();
    const changed = e.state.revision !== this.lastRevision;
    const renderEntity = (
      id: string,
      frame: string,
      pos: Position,
      actor = false,
      target = id,
    ) => {
      keep.add(id);
      let im = this.entities.get(id);
      const tx = pos.x * 16 + 8,
        ty = pos.y * 16 + 16;
      if (!im) {
        im = this.add.image(tx, ty, "atlas", frame).setOrigin(0.5, 1);
        this.entities.set(id, im);
        const shade = this.shadow(frame, tx, ty, true);
        if (shade) this.shadows.set(id, shade);
        if (id !== "player" && !this.options.lab) {
          im.setInteractive({ pixelPerfect: true, useHandCursor: true });
          im.on(
            "pointerdown",
            (
              _pointer: Phaser.Input.Pointer,
              _x: number,
              _y: number,
              event: Phaser.Types.Input.EventData,
            ) => {
              event.stopPropagation();
              rt.select(target);
            },
          );
        }
      }
      im.setFrame(frame)
        .setTint(frame === "fire" ? 0xffffff : this.tint)
        .setDepth(pos.y * 16 + (actor ? 14 : 10));
      const shade = this.shadows.get(id);
      const shadowKey = shadowFrame(this.shadowPhase, frame);
      if (shade && this.textures.get("lighting-shadows").has(shadowKey))
        shade.setTexture("lighting-shadows", shadowKey).setOriginFromFrame();
      if (
        changed &&
        (im.x !== tx || im.y !== ty) &&
        Math.hypot(im.x - tx, im.y - ty) < 65
      ) {
        this.tweens.killTweensOf(im);
        if (shade) this.tweens.killTweensOf(shade);
        this.tweens.add({
          targets: shade ? [im, shade] : im,
          x: tx,
          y: ty,
          duration: 110,
          ease: "Linear",
        });
      } else {
        im.setPosition(tx, ty);
        shade?.setPosition(tx, ty);
      }
    };
    for (const o of obs.objects) {
      if (o.depleted && o.kind !== "tree") continue;
      if (o.kind === "crop") {
        // Visual clumps share one authoritative harvest target, including depletion.
        for (const row of [-2, 0, 2]) {
          if (row !== 0 && w.terrain(o.pos.x, o.pos.y + row) !== "field")
            continue;
          renderEntity(
            `${o.id}:row:${row}`,
            o.sprite,
            { ...o.pos, y: o.pos.y + row },
            false,
            o.id,
          );
        }
        continue;
      }
      renderEntity(
        o.id,
        o.kind === "gate" ? (o.open ? "gate-open" : "gate") : o.sprite,
        o.pos,
      );
    }
    for (const a of [obs.player, ...obs.actors]) {
      const frame =
        a.kind === "human"
          ? `${a.sprite}-${a.direction}-${e.state.revision % 2}`
          : `${a.sprite}${e.state.revision % 2}`;
      renderEntity(a.id, frame, a.pos, true);
    }
    c.startFollow(this.entities.get("player")!, true, 0.4, 0.4);
    for (const [id, image] of this.entities)
      if (!keep.has(id)) {
        image.destroy();
        this.entities.delete(id);
        this.shadows.get(id)?.destroy();
        this.shadows.delete(id);
      }
    const g = this.selection!;
    g.clear();
    const selected = rt.selected ? e.inspect(rt.selected) : undefined;
    const mark = selected?.pos ?? p;
    const sx = mark.x * 16,
      sy = mark.y * 16 + 9;
    g.lineStyle(1, selected ? 0xf0cf8d : 0xf2e2b6, 0.9);
    for (const [x, y, dx, dy] of [
      [sx, sy, 1, 1],
      [sx + 15, sy, -1, 1],
      [sx, sy + 8, 1, -1],
      [sx + 15, sy + 8, -1, -1],
    ]) {
      g.lineBetween(x, y, x + dx * 4, y);
      g.lineBetween(x, y, x, y + dy * 3);
    }
    if (rt.route.length) {
      g.fillStyle(0xf2dfb4, 0.45);
      for (const step of rt.route.filter((_, i) => i % 3 === 0))
        g.fillRect(step.x * 16 + 7, step.y * 16 + 7, 2, 2);
    }
    if (this.options.debug) {
      for (const place of w.places) {
        g.lineStyle(1, 0x73d8ed, 0.8);
        g.strokeRect(place.x * 16, place.y * 16, place.w * 16, place.h * 16);
        g.fillStyle(0xffcb6e, 1);
        g.fillRect(place.entrance.x * 16 + 5, place.entrance.y * 16 + 5, 6, 6);
        const bp = buildingPlacement(place);
        g.lineStyle(1, 0xf3a6cc, 0.6);
        g.strokeRect(
          bp.x - bp.model.anchor[0],
          bp.y - bp.model.anchor[1],
          bp.model.bounds[2],
          bp.model.bounds[3],
        );
      }
    }
    this.night!.clear()
      .fillStyle(
        parseInt(this.light.ambient, 16),
        this.options.colorGrade === false ? 0 : this.light.ambientAlpha,
      )
      .fillRect(
        -this.scale.width * 4,
        -this.scale.height * 4,
        this.scale.width * 9,
        this.scale.height * 9,
      );
    this.game.canvas.dataset.lighting = this.light.id;
    this.lastRevision = e.state.revision;
  }
  update(time: number) {
    const phase = this.options.freeze ? 0 : Math.floor(time / 800) % 4;
    if (phase !== this.rippleTime) {
      this.rippleTime = phase;
      for (const r of this.ripples)
        r.image.setFrame(`ripple-${(phase + r.phase) % 4}`);
    }
    const active = document.activeElement;
    const typing =
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      active instanceof HTMLSelectElement ||
      !!document.querySelector('[data-modal="true"]');
    if (!this.options.lab && !typing && time - this.lastInput > 130) {
      const c = this.cursors!,
        w = this.wasd!;
      let dx = 0,
        dy = 0;
      if (c.left.isDown || w.A.isDown) dx = -1;
      else if (c.right.isDown || w.D.isDown) dx = 1;
      else if (c.up.isDown || w.W.isDown) dy = -1;
      else if (c.down.isDown || w.S.isDown) dy = 1;
      if (dx || dy) {
        this.lastInput = time;
        this.runtime.move(dx, dy);
      }
    }
    if (!this.options.lab && time - this.lastTick > 95 && !typing) {
      this.lastTick = time;
      this.runtime.tick();
    }
  }
}
