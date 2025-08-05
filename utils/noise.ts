
// Basic seeded pseudo-random number generator (PRNG) - Mulberry32
function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Store random generators for different seeds to allow multiple noise instances
const randomGenerators: { [seed: number]: () => number } = {};

function getSeededRandom(seed: number): () => number {
  if (!randomGenerators[seed]) {
    randomGenerators[seed] = mulberry32(seed);
  }
  return randomGenerators[seed];
}


// Simple 2D Value Noise
export class ValueNoise {
  private permutation: number[] = [];
  public random: () => number; // Changed from private to public

  constructor(seed: number) {
    this.random = getSeededRandom(seed);
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }
    // Shuffle permutation table using the seeded random
    for (let i = this.permutation.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
    }
    // Double the permutation table to avoid buffer overflows with `p[p[x] + y]`
    this.permutation.push(...this.permutation);
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10); // 6t^5 - 15t^4 + 10t^3 (smootherstep)
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15; // Use bottom 4 bits of hash
    // Create simple gradient vectors (axis-aligned and diagonals)
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
  
  // This is more like Perlin noise's core logic, not simple value noise
  // For actual "value" noise, you'd typically have random values at grid points and interpolate.
  // This uses gradients, which is closer to Perlin.
  public noise(x: number, y: number): number {
    const p = this.permutation;
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    // Hash coordinates of the 4 cube corners
    const aa = p[p[X] + Y];
    const ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y];
    const bb = p[p[X + 1] + Y + 1];
    
    // Add blended results from 4 corners of the square
    const n1 = this.grad(aa, xf, yf);
    const n2 = this.grad(ba, xf - 1, yf);
    const n3 = this.lerp(n1, n2, u);

    const n4 = this.grad(ab, xf, yf - 1);
    const n5 = this.grad(bb, xf - 1, yf - 1);
    const n6 = this.lerp(n4, n5, u);

    // Range of Perlin noise is approx -sqrt(N/4) to sqrt(N/4) where N is dimensions (2D here, so -0.7 to 0.7)
    // We normalize it to 0-1 range.
    return (this.lerp(n3, n6, v) + 0.707) / 1.414; 
  }

  // Octave noise (Fractal Brownian Motion - FBM)
  public octaveNoise(x: number, y: number, octaves: number, persistence: number, lacunarity: number): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0; // Used for normalizing result to 0-1

    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return total / maxValue;
  }
}