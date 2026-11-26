import catalog from "../content/graphics/vehicles.generated.json" with { type: "json" };

export interface CarSpec {
  /** Cells per second: what it settles at, and what it reaches with the pedal down. */
  cruise: number;
  top: number;
  /** Cells per second gained, and shed under the brakes, per second. */
  accel: number;
  brake: number;
  /** Share of speed kept through an eighth of a turn taken fast; the rest is the slide. */
  grip: number;
  /** Speed factor off a made road. */
  rough: number;
  /** Fuel tank in cells of driving. */
  range: number;
}

const car = (cruise: number, top: number, accel: number, grip: number, rough = 0.6, brake = 30, range = 2600): CarSpec => ({ cruise, top, accel, brake, grip, rough, range });

/** How each model in the vehicle catalogue drives. Top speeds follow the real cars' order, not their figures. */
export const CAR_SPECS: Readonly<Record<keyof typeof catalog, CarSpec>> = {
  "tourer-1915": car(8, 12, 4, 0.72, 0.8, 16, 1600),
  "sedan-1935": car(10, 16, 5, 0.74, 0.7, 20),
  "fastback-1948": car(11, 18, 6, 0.76, 0.65, 22),
  // A long soft American car: quick in a straight line, a boat in a bend.
  "hardtop-1957": car(12, 23, 9, 0.66, 0.55, 22, 2200),
  "sedan-1968": car(12, 23, 9, 0.76, 0.6, 26),
  "compact-1985": car(12, 21, 9, 0.86, 0.6),
  "sedan-2005": car(13, 25, 11, 0.9, 0.6, 36),
  "suv-2010": car(12, 23, 10, 0.82, 0.92, 34),
  "pickup-1975": car(11, 20, 8, 0.74, 0.88, 24),
  beetle: car(10, 17, 6, 0.8, 0.75, 22),
  "city-car": car(11, 18, 8, 0.93, 0.55, 34, 2000),
  // Soft springs meant to carry eggs across a ploughed field.
  "deux-chevaux": car(8, 13, 4, 0.7, 0.9, 18, 3200),
  mini: car(11, 20, 9, 0.97, 0.5, 28, 2000),
  "cab-uk": car(10, 16, 6, 0.95, 0.6, 26),
  volga: car(11, 18, 6, 0.72, 0.75, 22),
  lada: car(10, 17, 6, 0.78, 0.8, 22),
  ambassador: car(9, 15, 5, 0.72, 0.78, 20),
  kei: car(10, 16, 7, 0.94, 0.55, 30, 2000),
  van: car(10, 16, 5, 0.74, 0.65, 22),
  // Electric: all its pull from a standstill.
  "ev-2030": car(13, 26, 15, 0.92, 0.6, 38, 2400),
  "ev-mini": car(9, 14, 8, 0.9, 0.5, 30, 1400),
  robotaxi: car(10, 18, 9, 0.95, 0.55, 40, 3000),
  "delivery-pod": car(6, 9, 4, 0.95, 0.5, 30, 1500),
};
/** The dock lorry, and anything else with a motor and no model. */
export const LORRY: CarSpec = car(7, 11, 3, 0.8, 0.7, 14, 4000);

export const carSpec = (model: string | undefined): CarSpec => (model && (CAR_SPECS as Record<string, CarSpec>)[model]) || LORRY;

/** The eight facings, north first and clockwise, as the car frames name them. */
export const CAR_HEADINGS = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;
export const CAR_WAYS: readonly (readonly [number, number])[] = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
export const carFrame = (sprite: string, facing: number) => sprite.replace(/-[a-z]+$/, "-" + CAR_HEADINGS[facing & 7]);
export const carFacing = (sprite: string) => Math.max(0, CAR_HEADINGS.indexOf(sprite.slice(sprite.lastIndexOf("-") + 1) as "n"));
/** Cells a model reaches ahead of and behind its middle. */
export const carReach = (model: string) => (((catalog as Record<string, { cells: { x: number } }>)[model]?.cells.x ?? 4) >= 4.6 ? 2 : 1);

export interface CarMotion {
  /** Cells per second; negative in reverse. */
  speed: number;
  /** 0 north, clockwise by eighths. */
  heading: number;
}
export type CarBeat = "start" | "brake" | "skid" | "drift" | "slide" | "reverse" | "stop";

const START = 3.2, REVERSE = 5.5, STOP = 2.4;

/** One cell of driving. The held way is where the driver wants to go: the car
 * swings an eighth toward it each cell, sliding if it is going too fast to hold
 * the turn; the way back is the brake, and from a standstill, reverse. */
export function carStep(
  m: CarMotion,
  input: readonly [number, number],
  spec: CarSpec,
  env: { boost?: boolean; handbrake?: boolean; ground?: number } = {},
): CarMotion & { move?: readonly [number, number]; beat?: CarBeat; slip: number } {
  const ground = env.ground ?? 1;
  let { speed, heading } = m, beat: CarBeat | undefined, slip = 0;
  const held = input[0] || input[1];
  const want = held ? CAR_WAYS.findIndex((w) => w[0] === Math.sign(input[0]) && w[1] === Math.sign(input[1])) : heading;
  const dt = 1 / Math.max(STOP, Math.abs(speed));
  const out = () => {
    heading &= 7;
    if (Math.abs(speed) < STOP) return { speed: 0, heading, beat: beat ?? (m.speed ? "stop" as const : undefined), slip };
    return { speed, heading, move: CAR_WAYS[speed > 0 ? heading : (heading + 4) & 7], beat, slip };
  };
  if (speed < 0) {
    // Backing: the held way is where the tail should go.
    const tail = (heading + 4) & 7, turn = ((want - tail + 12) % 8) - 4;
    if (!held || Math.abs(turn) === 4) {
      speed = Math.min(0, speed + spec.brake * dt);
      if (speed > -STOP) speed = held ? START : 0;
      return out();
    }
    heading += Math.sign(turn);
    speed = Math.max(-REVERSE, speed - spec.accel * dt);
    return out();
  }
  const turn = ((want - heading + 12) % 8) - 4;
  if (!held || env.handbrake && !turn) {
    speed = Math.max(0, speed - (env.handbrake ? spec.brake * 1.4 : 5 + speed * 0.25) * dt);
    if (env.handbrake && m.speed > spec.cruise * 0.7) beat = "skid";
    return out();
  }
  if (Math.abs(turn) === 4) {
    if (speed < STOP) return { speed: -START, heading, move: CAR_WAYS[(heading + 4) & 7], beat: "reverse", slip };
    speed = Math.max(0, speed - spec.brake * dt);
    beat = m.speed > spec.cruise * 0.9 ? "skid" : "brake";
    return out();
  }
  if (speed < STOP) {
    speed = START;
    beat = "start";
  }
  if (turn) {
    // The handbrake throws the tail round two eighths at once.
    const swing = env.handbrake && Math.abs(turn) >= 2 && speed > spec.cruise * 0.6 ? 2 : 1;
    heading += Math.sign(turn) * swing;
    const fast = speed > spec.cruise * 0.8;
    if (swing === 2) {
      beat = "slide";
      slip = 2;
      speed *= 0.8;
    } else if (fast && Math.abs(turn) >= 2) {
      beat = "drift";
      slip = 1;
      speed *= 0.6 + spec.grip * 0.4;
    } else if (fast) speed *= 0.85 + spec.grip * 0.15;
    if (Math.abs(turn) === 3 && speed > spec.cruise) speed -= spec.brake * 0.5 * dt;
  }
  const target = (env.boost ? spec.top : spec.cruise) * ground;
  speed = speed < target ? Math.min(target, speed + spec.accel * dt * (speed < spec.cruise ? 1.6 : 1)) : Math.max(target, speed - 9 * dt);
  speed = Math.max(START, speed);
  return out();
}
