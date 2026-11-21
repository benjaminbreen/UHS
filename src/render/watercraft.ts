import type Phaser from "phaser";
import { valueNoise } from "../core/noise";
import boats from "../content/graphics/boats.generated.json" with { type: "json" };

export type Boat = keyof typeof boats;
export function boatPosture(craft?:Boat):"kneel"|"sit" {
  return craft && boats[craft].posture==="kneel" ? "kneel" : "sit";
}
export function boatFrame(craft:Boat,facing:number,variation=0) {
  const finishes=boats[craft].finishes;
  const finish=finishes[Math.max(0,Math.min(finishes.length-1,Math.floor(variation*finishes.length)))];
  return `boat-${craft}${finish}-${facing}`;
}
/** The hull a moored boat's sprite stands for. */
export function boatCraft(sprite?:string):Boat|undefined {
  return sprite ? (Object.keys(boats) as Boat[]).find(craft=>Object.keys(boats[craft].moorings).some(k=>sprite.startsWith(k))) : undefined;
}
export function mooredBoatFrame(frame:string,variation=0) {
  for(const craft of Object.keys(boats) as Boat[]){
    const facing=(boats[craft].moorings as Record<string,number>)[frame];
    if(facing!==undefined)return boatFrame(craft,facing,variation);
  }
  return frame;
}

/** Contact shadow and broken waterline surf lap seated directly beneath a boat hull. */
export function drawBoatGrounding(
  scene: Phaser.Scene,
  hull: Phaser.GameObjects.Image,
  inWater: boolean,
) {
  const frameName = hull.frame?.name;
  if (!frameName || frameName === "__BASE") return;
  const key = `boat-ground:${frameName}:${inWater ? 1 : 0}`;
  const f = scene.textures.getFrame(hull.texture.key, frameName);
  if (!f || !f.cutWidth || !f.cutHeight) return;
  const w = f.cutWidth, h = f.cutHeight, pad = 3;
  if (!scene.textures.exists(key)) {
    const read = document.createElement("canvas");
    read.width = w;
    read.height = h;
    const rctx = read.getContext("2d", { willReadFrequently: true })!;
    rctx.drawImage(f.source.image as CanvasImageSource, f.cutX, f.cutY, w, h, 0, 0, w, h);
    const px = rctx.getImageData(0, 0, w, h).data;
    const solid = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < w && y < h && px[(y * w + x) * 4 + 3] > 180;
    let minY = h, maxY = -1;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (solid(x, y)) {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
    const gw = w + pad * 2, gh = h + pad * 2;
    const tex = scene.textures.createCanvas(key, gw, gh)!;
    const ctx = tex.getContext();
    const out = ctx.createImageData(gw, gh);
    const put = (gx: number, gy: number, rgba: number[]) =>
      out.data.set(rgba, (gy * gw + gx) * 4);
    const near = (x: number, y: number, r: number) => {
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++)
          if (dx * dx + dy * dy <= r * r && solid(x + dx, y + dy)) return true;
      return false;
    };
    const lapStart = minY + (maxY - minY) * 0.22;
    for (let gy = 0; gy < gh; gy++)
      for (let gx = 0; gx < gw; gx++) {
        const x = gx - pad, y = gy - pad;
        if (solid(x, y)) continue;
        // Contact shadow cast slightly down-right beneath the hull's keel and flanks.
        const tight = solid(x, y - 1) || solid(x - 1, y - 1);
        const soft =
          solid(x, y - 2) ||
          solid(x - 1, y - 2) ||
          solid(x + 1, y - 1) ||
          solid(x - 2, y - 1) ||
          (y > lapStart && (solid(x + 1, y) || solid(x - 1, y)));
        if (tight) {
          put(gx, gy, inWater ? [14, 36, 48, 132] : [30, 24, 18, 120]);
          continue;
        }
        if (soft) {
          put(gx, gy, inWater ? [18, 44, 56, 68] : [38, 32, 24, 58]);
          continue;
        }
        // Broken pale foam/lap collar just outside the hull's waterline shadow.
        if (inWater && y >= lapStart && near(x, y, 2) && !near(x, y, 1)) {
          const n = valueNoise(x, y, 4, 919);
          if (n > 0.44)
            put(gx, gy, n > 0.62 ? [240, 250, 248, 175] : [214, 236, 234, 118]);
        }
      }
    ctx.putImageData(out, 0, 0);
    tex.refresh();
  }
  const existing = hull.getData("grounding") as Phaser.GameObjects.Image | undefined;
  const ox = (hull.originX * w + pad) / (w + pad * 2);
  const oy = (hull.originY * h + pad) / (h + pad * 2);
  if (existing && existing.scene) {
    if (existing.texture.key !== key) existing.setTexture(key);
    existing.setOrigin(ox, oy).setPosition(hull.x, hull.y).setDepth(hull.depth - 0.8);
    return;
  }
  const ground = scene.add
    .image(hull.x, hull.y, key)
    .setOrigin(ox, oy)
    .setDepth(hull.depth - 0.8);
  hull.setData("grounding", ground);
  hull.once("destroy", () => ground.destroy());
}

/** The rope belongs to the moored hull and leaves the scene when the boat puts out. */
export function drawMooring(
  scene: Phaser.Scene,
  hull: Phaser.GameObjects.Image,
  x: number,
  y: number,
  frame: string,
  still: boolean,
  stake = false,
) {
  if (hull.getData("mooring")) return;
  const rope = scene.add.graphics().setDepth(Math.max(hull.depth, y + 14) + 1);
  hull.setData("mooring", rope);
  const horizontal = /-(east|west)$/.test(frame);
  if (!stake) {
    x += /-(east|south)$/.test(frame) ? 8 : -8;
    y += /-(south|west)$/.test(frame) ? 7 : -7;
  }
  const restY = hull.y;
  const tieX = x;
  const tieY = stake ? y - 3 : y;
  const endX = Math.round(hull.x + Math.sign(x - hull.x) * (horizontal ? 35 : stake ? 6 : 9));
  const sag = stake ? 7 : 20;
  const paint = () => {
    hull.y = restY + (still ? 0 : Math.round(Math.sin(scene.time.now / 900 + endX)));
    const endY = Math.round(
      hull.y + (horizontal ? -6 : Math.sign(y - hull.y) * (stake ? 28 : 24) - (stake ? 0 : 6)),
    );
    const length = Math.max(1, Math.abs(endX - tieX), Math.abs(endY - tieY));
    rope.clear();
    if (stake) {
      rope.fillStyle(0x2a241d, 0.42).fillRect(x - 2, y + 2, 5, 2);
      rope.fillStyle(0x4a3423, 1).fillRect(x - 1, y - 4, 3, 7);
      rope.fillStyle(0x7c5b3b, 1).fillRect(x - 1, y - 4, 2, 6);
      rope.fillStyle(0xa88459, 1).fillRect(x - 1, y - 4, 2, 1);
    }
    for (let i = 0; i <= length; i++) {
      const t = i / length,
        px = Math.round(tieX + (endX - tieX) * t),
        py = Math.round(tieY + (endY - tieY) * t + sag * t * (1 - t));
      rope.fillStyle(0x5d452e, stake ? 0.72 : 1).fillRect(px, py + 1, stake ? 1 : 2, 1);
      rope.fillStyle(i % 4 === 0 ? 0xb48a58 : 0xcfb27c, 1).fillRect(px, py, stake ? 1 : 2, 1);
    }
  };
  paint();
  const wave = !still && scene.time.addEvent({delay:440,loop:true,callback:paint});
  hull.once("destroy", () => { if (wave) wave.remove(); rope.destroy(); });
}

export class Watercraft {
  private image?: Phaser.GameObjects.Image;
  private crewSeat?: readonly number[];
  private wasCrew=false;
  private hull: Phaser.GameObjects.Image[] = [];
  constructor(private scene: Phaser.Scene, private texture:(frame:string)=>string) {}
  update(
    person: Phaser.GameObjects.Image,
    mode: "raft" | "boat" | "swimming" | undefined,
    tint: number,
    inflatable: boolean,
    facing = 4,
    craft?: Boat,
    variation = 0,
  ) {
    this.crewSeat=undefined;
    person.setData("aboard",!!mode && mode!=="swimming");
    this.hull.forEach(im=>im.setVisible(false));
    if (mode === "boat" && craft) {
      this.image?.setVisible(false);
      const spec=boats[craft];
      this.crewSeat=spec.seat[String(facing) as keyof typeof spec.seat];
      for (const [i,layer] of ["back","front"].entries()) {
        const frame=`${boatFrame(craft,facing,variation)}-${layer}`, texture=this.texture(frame);
        if (!this.scene.textures.get(texture).has(frame)) continue;
        const im=this.hull[i] ??= this.scene.add.image(0,0,texture,frame);
        im.setTexture(texture,frame).setOriginFromFrame().setVisible(true).setTint(tint)
          .setPosition(person.x,person.y).setDepth(person.depth+(i ? .5 : -.5));
      }
      return;
    }
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
  placeCrew(person:Phaser.GameObjects.Image) {
    if(this.crewSeat){
      person.setOrigin(.5-this.crewSeat[0]/person.width,1-this.crewSeat[1]/person.height);
      this.wasCrew=true;
    }else if(this.wasCrew){
      person.setOrigin(.5,1);
      this.wasCrew=false;
    }
  }
  dispose() {
    this.hull.forEach(im=>im.destroy());
    this.hull=[];
    this.image?.destroy();
    this.image = undefined;
  }
}
