import type Phaser from "phaser";

export class Watercraft {
  private image?: Phaser.GameObjects.Image;
  constructor(private scene: Phaser.Scene) {}
  update(
    person: Phaser.GameObjects.Image,
    mode: "raft" | "boat" | "swimming" | undefined,
    tint: number,
    inflatable: boolean,
  ) {
    if (!mode || mode === "swimming") {
      this.image?.setVisible(false);
      return;
    }
    const key = `watercraft-${mode}-${inflatable}`;
    if (!this.scene.textures.exists(key)) {
      const texture = this.scene.textures.createCanvas(key, 48, 28)!;
      const c = texture.context;
      const rect = (
        x: number,
        y: number,
        w: number,
        h: number,
        color: string,
      ) => {
        c.fillStyle = color;
        c.fillRect(x, y, w, h);
      };
      rect(4, 19, 40, 3, "#285866");
      if (mode === "raft" && inflatable) {
        rect(6, 5, 36, 17, "#694b28");
        rect(3, 8, 42, 11, "#9b7330");
        rect(6, 5, 36, 4, "#d5ad4e");
        rect(4, 9, 5, 9, "#bd9138");
        rect(39, 9, 5, 9, "#876129");
        rect(8, 18, 31, 3, "#ba8b34");
        rect(10, 9, 28, 8, "#63583d");
        rect(13, 10, 21, 5, "#927a4d");
        for (const x of [9, 20, 32]) {
          rect(x, 5, 2, 3, "#ead180");
          rect(x, 19, 2, 2, "#665239");
        }
      } else {
        for (let x = 6; x < 42; x += 6) {
          rect(x, 5, 5, 17, "#54412e");
          rect(x, 5, 4, 14, "#947148");
          rect(x, 5, 1, 14, "#c1a16a");
        }
        rect(5, 9, 38, 2, "#514235");
        rect(5, 17, 38, 2, "#514235");
        if (mode === "boat") {
          rect(3, 7, 4, 14, "#5f4430");
          rect(41, 7, 4, 14, "#5f4430");
          rect(7, 3, 34, 3, "#a58455");
        }
      }
      rect(34, 13, 11, 2, "#bfaa78");
      rect(43, 12, 4, 4, "#7d6644");
      texture.refresh();
    }
    this.image ??= this.scene.add.image(0, 0, key).setOrigin(0.5, 0.68);
    this.image
      .setTexture(key)
      .setVisible(true)
      .setTint(tint)
      .setPosition(person.x, person.y + 2)
      .setDepth(person.depth - 0.1);
  }
  dispose() {
    this.image?.destroy();
    this.image = undefined;
  }
}
