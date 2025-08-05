/**
 * generation/interiorMap/layouts/roomLayoutGenerator.ts - BSP Tree for Room Layouts
 */
import { Room, InteriorTile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

class Leaf {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public leftChild: Leaf | null = null;
  public rightChild: Leaf | null = null;
  public room: Room | null = null;
  private noise: ValueNoise;

  public readonly MIN_LEAF_SIZE = 5;

  constructor(x: number, y: number, width: number, height: number, noise: ValueNoise) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.noise = noise;
  }

  public split(): boolean {
    if (this.leftChild || this.rightChild) {
      return false; // Already split
    }

    // Tweak for more layout diversity
    const splitH = this.width > this.height && this.width / this.height >= 1.25 ? false :
                   this.height > this.width && this.height / this.width >= 1.25 ? true :
                   this.noise.random() > 0.5;

    const max = (splitH ? this.height : this.width) - this.MIN_LEAF_SIZE;
    if (max <= this.MIN_LEAF_SIZE) {
      return false; // Area too small to split
    }

    const split = Math.floor(this.noise.random() * (max - this.MIN_LEAF_SIZE)) + this.MIN_LEAF_SIZE;

    if (splitH) {
      this.leftChild = new Leaf(this.x, this.y, this.width, split, this.noise);
      this.rightChild = new Leaf(this.x, this.y + split, this.width, this.height - split, this.noise);
    } else {
      this.leftChild = new Leaf(this.x, this.y, split, this.height, this.noise);
      this.rightChild = new Leaf(this.x + split, this.y, this.width - split, this.height, this.noise);
    }

    return true;
  }

  public createRooms(): void {
    if (this.leftChild || this.rightChild) {
      if(this.leftChild) this.leftChild.createRooms();
      if(this.rightChild) this.rightChild.createRooms();
    } else {
      const roomWidth = Math.max(3, Math.floor(this.width * (0.6 + this.noise.random() * 0.3)));
      const roomHeight = Math.max(3, Math.floor(this.height * (0.6 + this.noise.random() * 0.3)));
      const roomX = this.x + Math.floor(this.noise.random() * (this.width - roomWidth));
      const roomY = this.y + Math.floor(this.noise.random() * (this.height - roomHeight));
      
      this.room = {
        id: this.noise.random(),
        x: roomX,
        y: roomY,
        width: roomWidth,
        height: roomHeight,
        purpose: 'living', // default
      };
    }
  }

  public getRoom(): Room | null {
    if (this.room) {
        return this.room;
    }
    let lRoom: Room | null = null;
    let rRoom: Room | null = null;

    if (this.leftChild) lRoom = this.leftChild.getRoom();
    if (this.rightChild) rRoom = this.rightChild.getRoom();

    if (!lRoom && !rRoom) return null;
    if (!rRoom) return lRoom;
    if (!lRoom) return rRoom;
    
    return this.noise.random() > 0.5 ? lRoom : rRoom;
  }

  private connectRooms(room1: Room | null, room2: Room | null, tiles: InteriorTile[][]): void {
    if (!room1 || !room2) return;

    const r1x = room1.x + Math.floor(room1.width / 2);
    const r1y = room1.y + Math.floor(room1.height / 2);
    const r2x = room2.x + Math.floor(room2.width / 2);
    const r2y = room2.y + Math.floor(room2.height / 2);

    for (let x = Math.min(r1x, r2x); x <= Math.max(r1x, r2x); x++) {
        if (tiles[r1y]?.[x] && tiles[r1y][x].type === 'wall') {
            tiles[r1y][x] = { ...tiles[r1y][x], type: 'floor', texture: 'wood_plank_hall', color: '#9d876a', isWalkable: true };
        }
    }
    for (let y = Math.min(r1y, r2y); y <= Math.max(r1y, r2y); y++) {
         if (tiles[y]?.[r2x] && tiles[y][r2x].type === 'wall') {
            tiles[y][r2x] = { ...tiles[y][r2x], type: 'floor', texture: 'wood_plank_hall', color: '#9d876a', isWalkable: true };
        }
    }
    
    const doorX = r1x;
    if(tiles[room1.y - 1]?.[doorX]?.type === 'floor' || tiles[room1.y + room1.height]?.[doorX]?.type === 'floor') {
        tiles[room1.y][doorX].type = 'door';
        tiles[room1.y][doorX].isWalkable = true;
    }
  }
  
  public createHallways(tiles: InteriorTile[][]): void {
    if (this.leftChild && this.rightChild) {
      this.leftChild.createHallways(tiles);
      this.rightChild.createHallways(tiles);
      this.connectRooms(this.leftChild.getRoom(), this.rightChild.getRoom(), tiles);
    }
  }
}

export function generateRoomLayouts(width: number, height: number, noise: ValueNoise): { root: Leaf, leafs: Leaf[] } {
  const root = new Leaf(1, 1, width - 2, height - 2, noise);
  const leafs: Leaf[] = [root];

  let didSplit = true;
  while(didSplit) {
    didSplit = false;
    const tempLeafs = [...leafs];
    for (const l of tempLeafs) {
      if (!l.leftChild && !l.rightChild) {
        if (l.width > l.MIN_LEAF_SIZE * 1.5 || l.height > l.MIN_LEAF_SIZE * 1.5) {
          if (l.split()) {
            leafs.push(l.leftChild!);
            leafs.push(l.rightChild!);
            leafs.splice(leafs.indexOf(l), 1);
            didSplit = true;
          }
        }
      }
    }
  }
  
  root.createRooms();
  return { root, leafs };
}
