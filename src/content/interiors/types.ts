import type { DateRange } from "../history/dates";
import type {
  Door, Fire, FloorPattern, Kind, RoomParams, Shape, Trade, WallPattern, WindowStyle,
} from "../../render/interiors/room";

export type Colorway = { name: string; wall: string; trim: string; floor: string; wood: string; accent: string };
/** How a humble, common or elite household of this profile finishes its room. */
export type Look = {
  wall: WallPattern;
  floor: FloorPattern;
  dado?: WallPattern;
  wear: number;
  soot: number;
  /** Added to the profile's furnishings, before them in priority. */
  furnish?: Kind[];
  windows?: number;
};
/** One room of a building: a lobby, a parlour, a kitchen. Anything it sets
 * replaces the profile's value; `looks` entries merge over the profile's. */
/** What a room is for. Entries, halls, kitchens and workrooms face the
 * street in a front row; sleeping rooms and stores lie behind them, and a
 * sleeping room is private. A lobby belongs to a building, not a household. */
export type RoomRole = "entry" | "hall" | "kitchen" | "work" | "sleep" | "store" | "lobby" | "sanctum";
export type RoomTemplate = {
  id: string;
  label: string;
  role?: RoomRole;
  size: [number, number];
  shapes?: Shape[];
  door?: Door;
  windowStyle?: WindowStyle;
  fire?: Fire;
  smokehole?: boolean;
  seating?: RoomParams["seating"];
  sleep?: RoomParams["sleep"];
  pole?: boolean;
  trades?: Trade[];
  furnish?: Kind[];
  looks?: [Partial<Look>, Partial<Look>, Partial<Look>];
  styles?: Partial<Record<Kind, string>>;
  kits?: Partial<Record<Trade, Kind[]>>;
  clutter?: string[];
  program?: RoomParams["program"];
};
export type Basis = "documented" | "archaeological" | "reconstructed" | "modern";
export type InteriorProfile = {
  id: string;
  label: string;
  region: string;
  period: string;
  when: DateRange;
  basis: Basis;
  /** What the look rests on and where it guesses. One or two sentences. */
  note: string;
  shapes: Shape[];
  /** Typical floor in tiles for a common household. */
  size: [number, number];
  door: Door;
  windowStyle: WindowStyle;
  fire: Fire;
  smokehole: boolean;
  seating: RoomParams["seating"];
  sleep: RoomParams["sleep"];
  pole?: boolean;
  trades: Trade[];
  furnish: Kind[];
  looks: [Look, Look, Look];
  colorways: Colorway[];
  styles?: Partial<Record<Kind, string>>;
  /** Culturally fitting work pieces for a trade, replacing the default kit. */
  kits?: Partial<Record<Trade, Kind[]>>;
  clutter?: string[];
  /** For a single-room public building; a building of rooms sets it on the room. */
  program?: RoomParams["program"];
  /** Rooms of a larger building; a profile without them is a single room. */
  rooms?: RoomTemplate[];
  /** The buildings this interior fills, as `venue.alehouse`, `religious.gothic-parish`,
   * `civic.english-market-hall` (see `buildingUse`); absent for a dwelling. */
  uses?: string[];
  /** When residents who are not being simulated still come in, and what
   * share of the seats they fill: the evening's drinkers, a service's
   * congregation. Hours may run past midnight, as [17, 1]. */
  regulars?: { hours: [number, number]; fill: number };
};
