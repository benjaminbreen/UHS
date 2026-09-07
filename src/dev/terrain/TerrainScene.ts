import Phaser from "phaser";
import { drawTopography } from "../../render/topography";
import {
  terrainFoot,
  pickTerrain,
  TERRAIN_RISE,
} from "../../render/terrain-projection";
import {
  directions,
  terrainStep,
  type TerrainPoint,
  type Direction,
} from "../../core/topography";
import {
  studyRoute,
  terrainFixture,
  type TerrainFixture,
  type TerrainStudy,
} from "./fixture";
export type StudyStatus = {
  x: number;
  y: number;
  height: number;
  surface: string;
  message: string;
  walking: boolean;
};
export class TerrainScene extends Phaser.Scene {
  readonly fixture: TerrainFixture;
  private actor!: Phaser.GameObjects.Image;
  private shade!: Phaser.GameObjects.Ellipse;
  private marker!: Phaser.GameObjects.Graphics;
  private debugLayer!: Phaser.GameObjects.Container;
  private pos: TerrainPoint;
  private route: TerrainPoint[] = [];
  private moving = false;
  private facing = 0;
  private generation = 0;
  private pendingDirection?: Direction;
  private nextAttempt = 0;
  private keys?: Record<string, Phaser.Input.Keyboard.Key>;
  private message = "Choose a destination, or walk with WASD / arrows.";
  constructor(
    study: TerrainStudy,
    private onStatus: (s: StudyStatus) => void,
    private onReady: () => void,
  ) {
    super("terrain-study");
    this.fixture = terrainFixture(study);
    this.pos = { ...this.fixture.spawn };
  }
  preload() {
    this.load.atlas(
      "topography",
      "/topography/atlas.png",
      "/topography/atlas.json",
    );
    this.load.atlas("world-art", "/packs/atlas.png", "/packs/atlas.json");
  }
  create() {
    const f = this.fixture;
    drawTopography(this, f.sample, f.width, f.height);
    for (const p of f.props) {
      const lift = (f.sample(p.x, p.y)?.height ?? 0) * TERRAIN_RISE;
      if (!p.texture)
        this.add
          .ellipse(
            p.x * 16 + 12,
            p.y * 16 + 14 - lift,
            p.frame === "oak" ? 35 : 18,
            8,
            0x243b2b,
            0.22,
          )
          .setDepth(p.y * 16 + 2);
      this.add
        .image(
          p.x * 16 + 8,
          p.y * 16 + 16 - lift,
          p.texture ?? "world-art",
          p.frame,
        )
        .setOrigin(0.5, 1)
        .setDepth((p.y + 1) * 16);
    }
    this.debugLayer = this.add
      .container(0, 0)
      .setDepth(10000)
      .setVisible(false);
    const colors = [0x529095, 0xc3d285, 0xe4b86a, 0xe6d7b2];
    for (let y = 0; y < f.height; y++)
      for (let x = 0; x < f.width; x++) {
        const c = f.sample(x, y)!;
        const g = this.add
          .graphics()
          .lineStyle(1, colors[c.height], 0.45)
          .strokeRect(x * 16, y * 16 - c.height * TERRAIN_RISE, 16, 16);
        this.debugLayer.add(g);
        this.debugLayer.add(
          this.add.text(
            x * 16 + 4,
            y * 16 + 3 - c.height * TERRAIN_RISE,
            c.ramp
              ? `${c.height}${{ n: "↑", e: "→", s: "↓", w: "←" }[c.ramp]}`
              : String(c.height),
            {
              fontSize: "9px",
              fontFamily: "monospace",
              color: "#ffffff",
              backgroundColor: "#243b2b",
            },
          ),
        );
      }
    this.marker = this.add.graphics();
    const start = terrainFoot(f.sample, this.pos);
    this.shade = this.add
      .ellipse(start.x, start.y - 2, 12, 5, 0x203326, 0.4)
      .setDepth(this.pos.y * 16 + 2);
    this.actor = this.add
      .image(start.x, start.y, "world-art", "human-1-1-0-0")
      .setOrigin(0.5, 1)
      .setDepth((this.pos.y + 1) * 16 + 0.5);
    this.keys = this.input.keyboard?.addKeys(
      "W,A,S,D,UP,DOWN,LEFT,RIGHT",
    ) as typeof this.keys;
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      const focused = document.activeElement?.tagName;
      if (["SELECT", "INPUT", "BUTTON"].includes(focused ?? "") || event.repeat)
        return;
      const keyDirections: Record<string, Direction> = {
        ArrowUp: "n",
        w: "n",
        ArrowDown: "s",
        s: "s",
        ArrowLeft: "w",
        a: "w",
        ArrowRight: "e",
        d: "e",
      };
      this.pendingDirection =
        keyDirections[event.key] ?? keyDirections[event.key.toLowerCase()];
    });
    let drag:
      | { x: number; y: number; sx: number; sy: number; moved: boolean }
      | undefined;
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      drag = {
        x: p.x,
        y: p.y,
        sx: this.cameras.main.scrollX,
        sy: this.cameras.main.scrollY,
        moved: false,
      };
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!drag || !p.isDown) return;
      if (Math.hypot(p.x - drag.x, p.y - drag.y) > 6) drag.moved = true;
      if (drag.moved)
        this.cameras.main.setScroll(
          drag.sx - (p.x - drag.x) / this.cameras.main.zoom,
          drag.sy - (p.y - drag.y) / this.cameras.main.zoom,
        );
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (drag && !drag.moved) {
        const world = this.cameras.main.getWorldPoint(p.x, p.y);
        const target = pickTerrain(
          f.sample,
          f.width,
          f.height,
          world.x,
          world.y,
        );
        if (target) this.walkTo(target);
      }
      drag = undefined;
    });
    this.input.on(
      "wheel",
      (_p: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
        this.cameras.main.setZoom(
          Phaser.Math.Clamp(this.cameras.main.zoom - Math.sign(dy), 1, 4),
        );
      },
    );
    const fit = () => {
      const zoom = Math.max(
        1,
        Math.floor(
          Math.min(
            this.scale.width / (f.width * 16),
            this.scale.height / (f.height * 16),
          ),
        ),
      );
      this.cameras.main.setZoom(zoom).centerOn(f.width * 8, f.height * 8);
    };
    fit();
    this.scale.on("resize", fit);
    this.game.canvas.setAttribute("aria-label", "Walkable terrain study");
    this.game.canvas.setAttribute("data-ready", "true");
    this.publish();
    this.onReady();
  }
  describe() {
    return {
      position: { ...this.pos },
      feet: { x: this.actor?.x, y: this.actor?.y },
      cell: { ...this.fixture.sample(this.pos.x, this.pos.y)! },
      moving: this.moving,
      routeLength: this.route.length,
      renderer: "Phaser terrain study",
      camera: {
        x: this.cameras.main.scrollX,
        y: this.cameras.main.scrollY,
        zoom: this.cameras.main.zoom,
        worldX: this.cameras.main.worldView.x,
        worldY: this.cameras.main.worldView.y,
      },
      width: this.fixture.width,
      height: this.fixture.height,
    };
  }
  setDebug(show: boolean) {
    this.debugLayer?.setVisible(show);
  }
  reset() {
    this.generation++;
    this.pendingDirection = undefined;
    this.nextAttempt = 0;
    this.tweens.killAll();
    this.route = [];
    this.moving = false;
    this.pos = { ...this.fixture.spawn };
    const start = terrainFoot(this.fixture.sample, this.pos);
    this.actor
      .setPosition(start.x, start.y)
      .setDepth((this.pos.y + 1) * 16 + 0.5);
    this.shade.setPosition(start.x, start.y - 2).setDepth(this.pos.y * 16 + 2);
    this.marker.clear();
    this.message = "Back at the start.";
    this.publish();
  }
  walkTo(to: TerrainPoint) {
    if (this.moving) return;
    this.route = studyRoute(this.fixture, this.pos, to);
    this.marker.clear();
    if (this.route.length) {
      const foot = terrainFoot(this.fixture.sample, to);
      this.marker
        .setDepth((to.y + 1) * 16 + 0.4)
        .lineStyle(1, 0xede0b1, 0.75)
        .strokeRect(foot.x - 6, foot.y - 10, 12, 12);
      this.message = "Following the accessible route.";
    } else
      this.message =
        to.x === this.pos.x && to.y === this.pos.y
          ? "Already here."
          : "No accessible route to that tile.";
    this.publish();
  }
  step(dx: number, dy: number) {
    if (this.moving) return;
    this.route = [];
    this.move({ x: this.pos.x + dx, y: this.pos.y + dy });
  }
  private move(to: TerrainPoint) {
    const check = terrainStep(this.fixture.sample, this.pos, to);
    this.message = check.reason;
    if (!check.allowed) {
      this.route = [];
      this.publish();
      return;
    }
    const dx = to.x - this.pos.x,
      dy = to.y - this.pos.y;
    this.facing = dy > 0 ? 0 : dx < 0 ? 1 : dx > 0 ? 2 : 3;
    this.moving = true;
    const token = this.generation;
    this.actor.setFrame(`human-1-1-${this.facing}-1`);
    const walking = { ...this.pos };
    this.tweens.add({
      targets: walking,
      x: to.x,
      y: to.y,
      duration: 125,
      onUpdate: () => {
        const foot = terrainFoot(this.fixture.sample, walking);
        this.actor
          .setPosition(foot.x, foot.y)
          .setDepth((walking.y + 1) * 16 + 0.5);
        this.shade.setPosition(foot.x, foot.y - 2).setDepth(walking.y * 16 + 2);
      },
      onComplete: () => {
        if (token !== this.generation) return;
        this.pos = to;
        this.moving = false;
        this.actor.setFrame(`human-1-1-${this.facing}-0`);
        this.publish();
      },
    });
    this.publish();
  }
  private publish() {
    const c = this.fixture.sample(this.pos.x, this.pos.y)!;
    this.onStatus({
      ...this.pos,
      height: c.height,
      surface: c.surface,
      message: this.message,
      walking: this.moving || this.route.length > 0,
    });
  }
  update() {
    if (this.moving || !this.actor || this.time.now < this.nextAttempt) return;
    const focused = document.activeElement?.tagName;
    const typing =
      focused === "SELECT" || focused === "INPUT" || focused === "BUTTON";
    const k = this.keys;
    const held =
      !typing &&
      k &&
      (k.UP.isDown || k.W.isDown
        ? "n"
        : k.DOWN.isDown || k.S.isDown
          ? "s"
          : k.LEFT.isDown || k.A.isDown
            ? "w"
            : k.RIGHT.isDown || k.D.isDown
              ? "e"
              : undefined);
    const dir = this.pendingDirection || held;
    this.pendingDirection = undefined;
    if (dir) {
      this.nextAttempt = this.time.now + 125;
      this.route = [];
      const d = directions[dir];
      this.move({ x: this.pos.x + d.x, y: this.pos.y + d.y });
    } else if (this.route.length) this.move(this.route.shift()!);
  }
}
