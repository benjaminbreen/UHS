import type { WorldObject } from "../core/types";
import type Phaser from "phaser";
import { containerMove, type ContainerTerminal, anchorageAt, type Anchorage, ferryAt, freightAt, freightLift, WHARF_STOPS, type Harbor } from "../world/v3/harbor";
import { railSet } from "../world/v3/railway";
import type { WorldSetting } from "../content/geography/types";

export class HarborLayer {
  private fleet?: { site: string; objects: readonly WorldObject[]; count: number; boats: WorldObject[] };
  private seats=new Map<string,{x:number;y:number;depth:number;moving:boolean;rowing:boolean}>();
  pilotSeat(id:string){return this.seats.get(id);}
  private slingIndex = -1;
  private ferry?: ReturnType<typeof ferryAt>;
  deckAt(x: number, y: number) {
    const f=this.ferry;
    if (!f || Math.abs(x-f.x)>9.6 || Math.abs(y-f.y)>1.4) return;
    return {y:(f.y+.5)*16+(y-f.y)*11-21,depth:(f.y+.5)*16+20+(y-f.y)*2,moving:f.moving};
  }
  private images = new Map<string, Phaser.GameObjects.Image>();
  private water = new Map<string,Phaser.GameObjects.Graphics>();
  private terminalSite?: string;
  private landing?: Phaser.GameObjects.Graphics;
  private steam?: Phaser.GameObjects.Graphics;
  private cast?: Phaser.GameObjects.Graphics;
  private tackle?: Phaser.GameObjects.Graphics;
  constructor(
    private scene: Phaser.Scene,
    private texture: (name: string) => string,
  ) {}
  update(
    h: Harbor | undefined,
    setting: WorldSetting | undefined,
    clock: number,
    tint: number,
    view: Phaser.Geom.Rectangle,
    objects: readonly WorldObject[],
    sun: readonly number[],
    opacity: number,
    anchorage?: Anchorage,
    playerBoat?: string,
    terminal?: ContainerTerminal,
  ) {
    const draw = (
      id: string,
      frame: string,
      x: number,
      y: number,
      depth: number,
      ox?: number,
      oy?: number,
    ) => {
      const texture = this.texture(frame);
      if (
        texture === "__DEFAULT" ||
        !this.scene.textures.get(texture).has(frame)
      )
        return;
      let image = this.images.get(id);
      if (!image) {
        image = this.scene.add.image(x, y, texture, frame);
        this.images.set(id, image);
      } else if (image.frame.name !== frame) image.setTexture(texture, frame);
      if (ox === undefined) image.setOriginFromFrame();
      else image.setOrigin(ox, oy);
      image
        .setPosition(Math.round(x), Math.round(y))
        .setTint(tint)
        .setDepth(depth);
      return image;
    };

    if (terminal) {
      const x=terminal.x*16+8,y=terminal.y*16+8;
      if (view.right<x-840 || view.left>x+840 || view.bottom<y-690 || view.top>y+420) {
        if(this.images.size)this.dispose();
        return;
      }
      if(this.images.size && !this.images.has("gantry-back"))this.dispose();
      const tag=terminal.automated ? "auto" : "manual";
      const m=containerMove(clock);
      const frame=(id:string,name:string,dx:number,dy:number,z:number,depth:number)=>{
        return draw(id,name,x+dx,y+dy-z,y+depth)?.setVisible(true);
      };
      if(this.terminalSite!==terminal.manifest){
        this.terminalSite=terminal.manifest;
        const floor=this.landing ??= this.scene.add.graphics();
        floor.clear().setDepth(y-65);
        for(const rail of [10,80]){
          floor.fillStyle(0x4d5554).fillRect(x-338,y+rail,673,3);
          floor.fillStyle(0xb6b9a8).fillRect(x-338,y+rail,673,1);
          for(let i=-328;i<336;i+=16)floor.fillStyle(0x575c58).fillRect(x+i,y+rail-1,2,6);
        }
        for (const lane of [32,64,145,230]) for(let i=-329;i<330;i+=35)
          floor.fillStyle(lane===32 || lane===64 ? 0xe1c58c : 0xd5d2b7,.9).fillRect(x+i,y+lane,20,2);
        for(let i=-20;i<=20;i+=2){
          floor.fillStyle(i%4===0 ? 0xc79856 : 0x424d50).fillRect(x+i*16-8,y-5,32,4);
          if(i%4===0)floor.fillStyle(0x303d46).fillRoundedRect(x+i*16-6,y-10,13,7,2);
        }
        floor.fillStyle(0x747571).fillRect(x-326,y+110,650,2);
        floor.fillStyle(0xc0b8a4).fillRect(x-326,y+112,650,1);
        for(let i=-305;i<=305;i+=96){
          floor.fillStyle(0x646861).fillRect(x+i,y+107,19,7);
          floor.fillStyle(0x444d4c).fillRect(x+i+1,y+108,17,4);
          for(let j=2;j<17;j+=3)floor.fillStyle(0x92948a).fillRect(x+i+j,y+108,1,4);
        }
        for(let i=-2;i<=2;i++){
          const sx=x+i*110-38;
          floor.lineStyle(2,0xe6c676,.8).strokeRect(sx,y+160,73,39);
          floor.lineStyle(2,0xd3c9a9,.8).strokeRect(sx,y+272,73,39);
        }
        for(let i=0;i<7;i++)floor.lineStyle(2,0xd3ab69,.8).lineBetween(x+183+i*9,y+106,x+194+i*9,y+93);
      }
      const {gx,rackX,carrierX:vehicleX}=m, gy=10,deckY=-55,laneY=51;
      const sx=m.ship.x*16, sy=deckY+m.ship.y*16;
      const wake=this.water.get("feeder") ?? this.scene.add.graphics();
      this.water.set("feeder",wake);wake.clear().setDepth(y+sy-2);
      const a=m.ship.heading*Math.PI/4,dx=Math.sin(a),dy=-Math.cos(a);
      for(let k=0;k<24;k++)for(const side of [-1,1]){
        const u=(k-11.5)*12.4, v=side*(31*Math.sqrt(Math.max(0,1-(u/151)**4))+1.5);
        const px=x+sx+dx*u-dy*v,py=y+sy+(dy*u+dx*v)*.68;
        wake.fillStyle(k%3 ? 0x325c69 : 0xa9c7c3,.83).fillRect(Math.round(px),Math.round(py),5,2);
      }
      const count=m.phase>=2160 ? 3 : 3-m.picked;
      const cargo=(i:number)=>terminal.steel ? "harbor-steel-coil" : "harbor-box-"+[0,1,4][i];
      frame("feeder","harbor-feeder-"+m.ship.heading+"-"+(terminal.steel ? 0 : count),sx,sy,0,sy);
      for(let i=0;i<3;i++){
        const id="deck-coil-"+i,u=-44+58*i;
        if(terminal.steel && i>=3-count)frame(id,cargo(i),sx+dx*u,sy+dy*u*.68,28,sy+.1+i*.01);
        else this.images.get(id)?.setVisible(false);
      }
      const shadow=(this.cast ??=this.scene.add.graphics()).clear().setDepth(y-8);
      const line=(x1:number,y1:number,x2:number,y2:number,z1:number,z2:number,width:number)=>{
        shadow.lineStyle(width,0x262f54,opacity).lineBetween(x+x1+z1*sun[0],y+y1+z1*sun[1],x+x2+z2*sun[0],y+y2+z2*sun[1]);
      };
      for(const side of [-35,35]) {
        const rear=gx+89+side, front=gx+113+side;
        line(rear,gy,rear-6,gy,0,122,7);
        line(front,gy+70,front-10,gy+70,0,117,8);
        line(rear-6,gy,front-10,gy+70,122,117,6);
        line(rear-6,gy,gx-20+side,gy-64,122,122,4);
        line(rear-6,gy,gx+68+side,gy,122,200,4);
        line(gx+68+side,gy,gx-20+side,gy-64,200,122,2);
      }
      line(gx+33,gy,gx+103,gy,200,200,5);
      line(gx+78,gy+70,gx+148,gy+70,52,52,5);
      frame("gantry-back","harbor-gantry-"+tag+"-far",gx,gy,0,gy+1);
      frame("carrier","harbor-chassis-"+tag,vehicleX,laneY,0,laneY+1);
      const tx=gx+103*m.travel, trolleyY=deckY+(laneY-deckY)*m.travel;
      const stackTop=29+(11-29)*m.travel;
      const base=stackTop+m.lift*37, top=trolleyY-base-21;
      const wires=(this.tackle ??=this.scene.add.graphics()).clear().setDepth(y+laneY+4);
      for (const u of [-19,19]) {
        wires.lineStyle(1,0x354854).lineBetween(x+tx+u,y+trolleyY-115,x+tx+u,y+top-3);
        wires.lineStyle(1,0xa4a9a0).lineBetween(x+tx+u+2,y+trolleyY-115,x+tx+u+2,y+top-3);
      }
      const attached=m.t>=32 && m.t<98, onTruck=m.t>=98 && m.t<196;
      const stackTravel=Math.min(1,Math.max(0,(m.t-165)/30));
      frame("yard-hoist","harbor-exchange-"+tag,rackX,laneY+24,0,laneY+2);
      this.images.get("transfer-box")?.setVisible(false);
      if(attached || onTruck){
        const bx=attached ? tx : vehicleX, by=attached ? trolleyY : laneY+24*stackTravel;
        const z=attached ? base : 11+(terminal.steel ? 0 : 21*m.index)*stackTravel+13*Math.sin(stackTravel*Math.PI);
        shadow.fillStyle(0x374454,.24).fillEllipse(x+bx+3+z*sun[0],y+by+4+z*sun[1],56,16);
        frame("transfer-box",cargo(m.index),bx+(terminal.steel && onTruck ? (m.index-1)*30*stackTravel : 0),by,z, laneY+3);
      }
      wires.fillStyle(0x34474d).fillRect(x+tx-26,y+top-5,53,5);
      wires.fillStyle(0xf0b94e).fillRect(x+tx-25,y+top-5,51,2);
      wires.fillStyle(attached ? 0x70ba79 : 0xd7924c).fillRect(x+tx+24,y+top-4,3,2);
      wires.fillStyle(0x425461).fillRect(x+tx-24,y+trolleyY-122,48,8);
      wires.fillStyle(0xe9c67d).fillRect(x+tx-21,y+trolleyY-122,42,2);
      frame("gantry-near","harbor-gantry-"+tag+"-near",gx,gy,0,gy+72);
      // At the exchange rack the carrier clears the box from underneath.
      if(objects[this.slingIndex]?.id!==terminal.store)this.slingIndex=objects.findIndex(o=>o.id===terminal.store);
      const inventory=objects[this.slingIndex]?.inventory;
      const received=terminal.steel ? inventory?.["steel-coil"] ?? 0 : Math.ceil((inventory?.grain ?? 0)/3);
      for(let i=0;i<3;i++){
        const id="received-"+i;
        if(i<received)frame(id,cargo(i),rackX+(terminal.steel ? (i-1)*30 : 0),laneY+24,terminal.steel ? 11 : 11+21*i,laneY+5+i);
        else this.images.get(id)?.setVisible(false);
      }
      return;
    }
    if(this.images.has("gantry-back"))this.dispose();
    if(anchorage && !h) {
      if(this.ferry)this.dispose();
      const schedule=anchorageAt(anchorage,clock);
      if(this.fleet?.site!==anchorage.site || this.fleet.objects!==objects || this.fleet.count!==objects.length)
        this.fleet={site:anchorage.site,objects,count:objects.length,boats:objects.filter(o=>o.vessel?.site===anchorage.site)};
      this.seats.clear();
      for(const boat of this.fleet.boats){
        const v=boat.vessel!,id=v.form,timetable=schedule[id];
        const ship=v.manual ? {...boat.pos,heading:v.heading,moving:!!v.underway} : timetable;
        const length=id==="merchant" ? 87 : 45,beam=id==="merchant" ? 21 : 12;
        const x=ship.x*16+8,y=ship.y*16+8;
        if(x<view.left-120 || x>view.right+120 || y<view.top-110 || y>view.bottom+185) {
          for(const [key,image] of this.images)if(key===id || key.startsWith(id+"/"))image.setVisible(false);
          this.water.get(id)?.setVisible(false);this.water.get(id+"/oars")?.setVisible(false);continue;
        }
        const g=this.water.get(id) ?? this.scene.add.graphics();
        this.water.set(id,g);g.clear().setVisible(true).setDepth(y+3);
        const a=ship.heading*Math.PI/4,dx=Math.sin(a),dy=-Math.cos(a);
        const keel=(u:number,v:number)=>({x:Math.round(x+dx*u-dy*v),y:Math.round(y+(dy*u+dx*v)*.68+beam*.36)});
        const rim=[[1,0],[.72,.57],[.30,.92],[-.28,1],[-.72,.83],[-.95,.31],
          [-.95,-.31],[-.72,-.83],[-.28,-1],[.30,-.92],[.72,-.57]].map(([u,v])=>keel(u*length,v*beam));
        g.fillStyle(0x174756,.31).fillPoints(rim,true);
        for(let k=0;k<rim.length;k++){
          const q=rim[k],r=rim[(k+1)%rim.length];
          if((q.y+r.y)*.5<y)continue;
          for(const f of [.24,.65]){
            const drift=Math.sin(clock*.08+k)*1.5;
            const px=Math.round(q.x+(r.x-q.x)*f+drift),py=Math.round(q.y+(r.y-q.y)*f+2);
            g.fillStyle(0x81b8b7,.70).fillRect(px,py,4+k%4,2);
            if(k%3)g.fillStyle(0xe1ebca,.88).fillRect(px+1,py,3,1);
          }
        }
        for(const side of [-1,1]) for(let k=0;k<14;k++) {
          const u=length*(1-k/7);
          const v=side*(beam*Math.sin(k*Math.PI/14)+2);
          const px=x+dx*u-dy*v, py=y+(dy*u+dx*v)*.68;
          g.fillStyle(k%3 ? 0x285563 : 0xc4d4b5,k%3 ? .5 : .74)
            .fillRect(Math.round(px),Math.round(py),3+k%4,1);
          if(ship.moving && k<10) {
            const trail=(clock*.19+k*2.8)%30;
            g.fillStyle(0xc2d6c4,.52*(1-trail/36)).fillRect(
              Math.round(x-dx*(length+trail)-dy*side*(2+trail*.32)),
              Math.round(y+(-dy*(length+trail)+dx*side*(2+trail*.32))*.68),3,1);
          }
        }
        const fluyt=id==="merchant" && boat.sprite.startsWith("harbor-fluyt-");
        const hull=id==="lighter" ? id : fluyt ? "fluyt" : "dhow";
        const bob=Math.round(Math.sin(clock*.075+length));
        draw(id,`harbor-${hull}-${v.finish}-${ship.heading}`,x,y+bob,y+5)?.setVisible(true);
        const deck=(u:number,v:number,z:number)=>({x:x+dx*u-dy*v,y:y+(dy*u+dx*v)*.68-z+bob});
        for(let i=0;i<3;i++){
          const key=id+"/bale"+i;
          if(i>=(boat.inventory[anchorage.cargo]??0)){this.images.get(key)?.setVisible(false);continue;}
          const at=deck((id==="merchant"?14:4)+(i%2)*15,(i===2?1:-1)*6,id==="merchant"?19:10);
          draw(key,anchorage.cargo==="grain" ? "harbor-grain-sack" : "harbor-cloth-bale",at.x,at.y,y+7+i*.1)?.setVisible(true);
        }
        const player=playerBoat===boat.id,helm=deck(-length*(id==="merchant"?.80:.52),id==="merchant"?6:0,id==="merchant"?26:12);
        const rowing=id==="lighter" && ship.moving;
        if(id==="lighter"){
          const oars=this.water.get(id+"/oars") ?? this.scene.add.graphics();
          this.water.set(id+"/oars",oars);oars.clear().setVisible(rowing).setDepth(y+8);
          if(rowing)for(const side of [-1,1]){
            const stroke=Math.sin(clock*.39),lift=Math.max(0,Math.cos(clock*.39))*3;
            const hand=deck(-length*.52-stroke*3,side*3,16);
            const lock=deck(-length*.38,side*9,13);
            const blade=deck(-length*.16+stroke*9,side*28,2+lift);
            const tip=deck(-length*.12+stroke*12,side*33,lift);
            oars.lineStyle(2,0x72513c,1).lineBetween(hand.x,hand.y,blade.x,blade.y);
            oars.lineStyle(1,0xd2a368,1).lineBetween(lock.x,lock.y-1,blade.x,blade.y-1);
            oars.lineStyle(3,0xab794f,1).lineBetween(blade.x,blade.y,tip.x,tip.y);
          }
        }
        this.seats.set(v.skipper,{...(player?deck(length*.44,0,id==="merchant"?23:12):helm),depth:y+9,moving:ship.moving,rowing:rowing && !player});
        if(player)this.seats.set("player",{...helm,depth:y+9,moving:ship.moving,rowing});
        if(id==="merchant"){
          const rig=fluyt ? "fluyt-rig" : (ship.moving ? "rig-" : "rig-furled-")+(v.canvas??0);
          draw(id+"/rig",`harbor-${rig}-${ship.heading}`,x,y+bob,y+10)?.setVisible(true);
        }
      }
      return;
    }
    if(this.images.has("merchant") || this.images.has("lighter") || this.water.has("merchant") || this.water.has("lighter")) this.dispose();
    if (
      !h ||
      !setting ||
      (view.right < Math.min((h.crossing?.farGate.x ?? h.crane.x),h.roadstead.x,h.shed.x)*16-250 ||
        view.x > Math.max((h.crossing?.farGate.x ?? h.crane.x),h.roadstead.x,h.shed.x)*16+250) ||
      view.bottom < h.roadstead.y * 16 - 220 ||
      view.y > (h.crossing?.gate.y ?? h.shed.y) * 16 + 250
    ) {
      this.ferry=undefined;
      if (this.images.size) this.dispose();
      return;
    }
    if (!h.crossing && this.ferry) this.dispose();
    const smoke = (this.steam ??= this.scene.add.graphics())
      .clear()
      .setDepth(Math.max((h.crossing?.gate.y ?? h.shed.y), h.cargo.y) * 16 + 12);
    const t = (this.tackle ??= this.scene.add.graphics()).clear();
    const ferry = h.crossing && ferryAt(h.crossing, clock),
      freight = freightAt(h, clock);
    this.ferry=ferry;
    for (const [id, ship] of [
      ["harbor-ferry", ferry],
      ["coastal-freighter", freight],
    ] as const) {
      if (!ship) continue;
      const x = ship.x * 16 + 8,
        y = ship.y * 16 + 8,
        theta = (ship.heading * Math.PI) / 4,
        dx = Math.sin(theta),
        dy = -Math.cos(theta);
      const length = id === "harbor-ferry" ? 155 : 150;
      let g=this.water.get(id);
      if(!g) {g=this.scene.add.graphics();this.water.set(id,g);}
      g.clear().setDepth(y+5);
      const waterline=(u:number,v:number)=>({x:Math.round(x+dx*u-dy*v),y:Math.round(y+(dy*u+dx*v)*.68)});
      const patch=(u:number,v:number,l:number,tone:number,alpha:number)=>{
        const a=waterline(u,v),b=waterline(u+l,v);
        g!.lineStyle(2,tone,alpha).lineBetween(a.x,a.y,b.x,b.y);
      };
      for(let k=0;k<16;k++){
        const u=(-.93+.117*k)*length;
        const rim=(id==="harbor-ferry"?32:29)*Math.sqrt(Math.max(0,1-(u/length)**4));
        for(const side of [-1,1]){
          patch(u,side*(rim+1),length*.12,0x183e49,.58);
          if(k%3!==1)patch(u+1,side*(rim+4),4+k%5,0xb8d3bd,.8);
        }
      }

      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 20; i++) {
          const drift = (clock * (ship.moving ? 0.32 : 0.09) + i * 15) % 34;
          const u = ((i - 9) * length) / 10,
            v =
              side *
              ((id === "harbor-ferry" ? 34 : 31) *
                Math.sqrt(Math.max(0, 1 - (u / length) ** 4)) +
                drift * 0.18);
          g.fillStyle(i % 4 ? 0x90b9b2 : 0xdde9d5, i % 4 ? 0.36 : 0.7);
          g.fillRect(
            Math.round(x + dx * u - dy * v),
            Math.round(y + (dy * u + dx * v) * 0.68),
            2 + (i % 5),
            1,
          );
          if (ship.moving && i < 12) {
            const d = length + drift + i * 4;
            g.fillRect(
              Math.round(x - dx * d - dy * side * (i + 3)),
              Math.round(y - dy * d * 0.68 + dx * side * (i + 3)),
              4,
              1,
            );
          }
        }
      }
      const alongside=id==="harbor-ferry" ? ferry && !ferry.moving && !ferry.back
        : Math.abs(freight.x-h.cargo.x)<.01 && !freight.moving;
      if (alongside) for (const dolphin of h.dolphins) {
        if (Math.abs(dolphin.y-ship.y)>4) continue;
        const ex=dolphin.x*16+8, ey=dolphin.y*16-23;
        const side=Math.sign(ex-x), ax=x+side*110, ay=y+5;
        g.lineStyle(2,0x5e4936).lineBetween(ax,ay,ax+side*8,ay+10).lineBetween(ax+side*8,ay+10,ex,ey);
        g.lineStyle(1,0xc4a47b).lineBetween(ax,ay-1,ax+side*8,ay+9).lineBetween(ax+side*8,ay+9,ex,ey-1);
      }
      draw(id, id + "-" + ship.heading, x, y, y + 6);
      const funnel = id === "harbor-ferry" ? 0 : -52;
      for (let i = 0; i < 4; i++) {
        const life = ((clock * 0.08 + i * 5) % 20) / 20;
        const px = Math.round(x + dx * funnel + life * 18),
          py = Math.round(
            y + dy * funnel * 0.68 - (funnel ? 74 : 95) - life * 23,
          );
        const size = 2 + Math.floor(life * 5);
        smoke
          .fillStyle(i % 2 ? 0xa4a9a3 : 0x829294, 0.32 * (1 - life))
          .fillRect(px, py, size + 2, Math.max(2, size - 1));
        smoke.fillRect(px + 1, py - 1, size - 1, size + 1);
      }
    }
    const cx = h.crane.x * 16 + 8, cy = h.crane.y * 16 + 8;
    if (objects[this.slingIndex]?.id !== h.manifest) this.slingIndex=objects.findIndex(o=>o.id===h.manifest);
    const sling=objects[this.slingIndex];
    const lift = freightLift(clock);
    const landed = sling?.freight?.call === Math.floor(clock/3600)
      ? Math.max(lift.landed, 6-(sling.inventory.grain ?? 0)) : lift.landed;
    const loaded = lift.active && landed <= lift.index;
    const crane = draw("crane", "wharf-crane-" + h.sign + "-" + lift.pose, cx, cy, cy+3, 92/185, 124/143);
    if (crane) {
      const socket = (pose: number) => {
        const frame = crane.texture.get("wharf-crane-"+h.sign+"-"+pose);
        return {x: cx+Math.round(frame.pivotX*frame.realWidth)-92, y: cy+Math.round(frame.pivotY*frame.realHeight)-124};
      };
      const tip=socket(lift.pose), hatch=socket(0), target=socket(lift.target);
      const floor = (s: {y:number}, n:number) => s.y+103-Math.floor(n/3)*18;
      const holdFloor = (h.cargo.y-h.crane.y)*16-28+cy;
      const shadow=(this.cast ??= this.scene.add.graphics()).clear().setDepth(cy-45);
      if (opacity>0) {
        const project=(x:number,y:number,z:number)=>({x:Math.round(x+z*sun[0]),y:Math.round(y+z*sun[1])});
        const heel=project(cx+7*h.sign,cy,48), crown=project(cx,cy,74), end=project(tip.x,tip.y+103,103);
        shadow.fillStyle(0x302d31,.22).fillEllipse(cx+2,cy-2,54,14);
        shadow.fillStyle(0x202254,opacity).fillTriangle(cx-20,cy-4,heel.x-14,heel.y,heel.x+13,heel.y);
        shadow.lineStyle(5,0x202254,opacity).lineBetween(heel.x,heel.y,end.x,end.y);
        shadow.lineStyle(2,0x202254,opacity).lineBetween(crown.x,crown.y,end.x,end.y);
        if (loaded && lift.attached) {
          const ground=holdFloor+(floor(target,lift.index)-holdFloor)*lift.travel;
          const hookShade=project(tip.x,ground,lift.height);
          shadow.fillStyle(0x202254,opacity+.08).fillRect(hookShade.x-9,hookShade.y-4,19,7);
        }
      }
      const rest = floor(target,lift.index);
      const base = Math.round(holdFloor+(rest-holdFloor)*lift.travel-lift.height);
      const hook = base-30;
      const depth = (h.cargo.y+.5)*16+9;
      t.setDepth(depth).lineStyle(2,0x383833).lineBetween(tip.x,tip.y+2,tip.x,hook-2);
      t.lineStyle(1,0xa69a81).lineBetween(tip.x+1,tip.y+3,tip.x+1,hook-2);
      const spin=(base-tip.y)*.35;
      t.lineStyle(1,0xd4b17d).lineBetween(tip.x,tip.y,tip.x+Math.round(2*Math.cos(spin)),tip.y+Math.round(2*Math.sin(spin)));
      t.fillStyle(0x423d37).fillRect(tip.x-2,hook-3,5,5);
      t.fillStyle(0xc39760).fillRect(tip.x-1,hook-2,2,2);
      t.lineStyle(1,0x473c32).lineBetween(tip.x,hook+1,tip.x,hook+4).lineBetween(tip.x,hook+4,tip.x+3,hook+3);
      if (loaded && lift.attached) {
        t.lineBetween(tip.x,hook+4,tip.x-8,base-17).lineBetween(tip.x,hook+4,tip.x+9,base-18);
      }
      if (loaded) draw("sling","harbor-case",lift.attached ? tip.x : hatch.x,lift.attached ? base : holdFloor,depth+1);
      this.images.get("sling")?.setVisible(loaded);
      for (let n=0;n<6;n++) {
        const id="landed-"+n;
        const visible = n<landed && freight.phase<1320;
        if (visible) {
          const at=socket(WHARF_STOPS[n%3]);
          draw(id,"harbor-case",at.x,floor(at,n),at.y+104+Math.floor(n/3)*.1);
        }
        this.images.get(id)?.setVisible(visible);
      }
    }
    this.landing?.clear();
    if (ferry && !ferry.moving && h.crossing) {
      const g=(this.landing ??= this.scene.add.graphics()).setDepth(ferry.y*16+15);
      const fx = ferry.x * 16 + 8,
        fy = ferry.y * 16 + 8,
        home = !ferry.back;
      const deckX=home ? fx-h.sign*131 : fx+h.sign*150;
      const landX=home ? deckX : h.crossing.farGate.x*16+8;
      const deckY=home ? fy-18 : fy-1;
      const landY=home ? h.crossing.gate.y*16+12 : fy-1;
      const left=Math.min(deckX,landX)- (home ? 9 : 0);
      const top=Math.min(deckY,landY)- (home ? 0 : 6);
      const width=home ? 18 : Math.abs(deckX-landX), height=home ? Math.abs(deckY-landY) : 14;
      g.fillStyle(0x574a3c).fillRect(left,top,width,height);
      g.fillStyle(0xa68c67).fillRect(left+1,top+1,width-2,height-2);
      g.lineStyle(1,0x74614e);
      for(let n=4;n<(home ? height : width);n+=4)
        if(home)g.lineBetween(left+1,top+n,left+width-2,top+n);
        else g.lineBetween(left+n,top+1,left+n,top+height-2);
      for (const side of [-1, 1]) {
        const ax = home ? fx + side * 108 : fx+h.sign*132,
          ay = home ? fy - 15 : fy+side*8;
        const ex = home ? ax + side * 18 : h.crossing.farGate.x * 16 + 8,
          ey = home ? h.crossing.gate.y * 16 + 13 : fy + side * 17;
        const mx = Math.round((ax + ex) / 2),
          my = Math.round((ay + ey) / 2 + 4);
        g.lineStyle(2, 0x594737)
          .lineBetween(ax, ay, mx, my)
          .lineBetween(mx, my, ex, ey);
        g.lineStyle(1, 0xc5a97c)
          .lineBetween(ax, ay - 1, mx, my - 1)
          .lineBetween(mx, my - 1, ex, ey - 1);
      }
    }
    if (!h.rails) return;
    const shunt = Math.max(
      0,
      Math.min(1, (freight.phase - 900) / 240, (1800 - freight.phase) / 240),
    );
    for (let i = 0; i < 2; i++) {
      const x = (h.rails.x + h.sign*((i ? 2 : 5) + shunt * (i ? -1 : 2))) * 16,
        y = (h.rails.y + (i ? 2.9 : 1)) * 16;
      draw(
        "wagon" + i,
        "train-" + railSet(setting) + "-wagon" + i + "-0",
        x,
        y + 9,
        y + 8,
        0.5,
        1,
      );
    }
  }
  dispose() {
    this.seats.clear();this.fleet=undefined;this.terminalSite=undefined;
    this.ferry=undefined;
    for (const im of this.images.values()) im.destroy();
    this.images.clear();
    this.steam?.destroy();
    this.steam = undefined;
    for(const g of this.water.values())g.destroy();
    this.water.clear();
    this.landing?.destroy();
    this.tackle?.destroy();
    this.cast?.destroy();
    this.cast=undefined;
    this.landing = this.tackle = undefined;
  }
}
