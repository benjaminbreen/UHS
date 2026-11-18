import type Phaser from "phaser";
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

/** The rope belongs to the moored hull and leaves the scene when the boat puts out. */
export function drawMooring(scene: Phaser.Scene, hull: Phaser.GameObjects.Image, x: number, y: number, frame: string, still: boolean) {
  if (hull.getData("mooring")) return;
  const rope = scene.add.graphics().setDepth(hull.depth + 1);
  hull.setData("mooring", rope);
  const horizontal = /-(east|west)$/.test(frame);
  x += /-(east|south)$/.test(frame) ? 8 : -8;
  y += /-(south|west)$/.test(frame) ? 7 : -7;
  const restY = hull.y;
  const endX = Math.round(hull.x + Math.sign(x - hull.x) * (horizontal ? 35 : 9));
  const paint = () => {
    hull.y = restY + (still ? 0 : Math.round(Math.sin(scene.time.now / 900 + endX)));
    const endY = Math.round(hull.y + (horizontal ? -6 : Math.sign(y - hull.y) * 24 - 6));
    const length = Math.max(1, Math.abs(endX-x), Math.abs(endY-y));
    rope.clear();
    for (let i=0;i<=length;i++) {
      const t=i/length, px=Math.round(x+(endX-x)*t), py=Math.round(y+(endY-y)*t+20*t*(1-t));
      rope.fillStyle(0x715235).fillRect(px,py+1,2,1);
      rope.fillStyle(i%4===0 ? 0xb88c58 : 0xd6b77c).fillRect(px,py,2,1);
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
