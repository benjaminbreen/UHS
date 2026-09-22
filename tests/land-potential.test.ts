import { expect, it } from "vitest";
import type { LandSample } from "../src/world/geography/landscape";
import type { Habitat } from "../src/world/v3/habitats";
import { landPotential } from "../src/world/v3/land-potential";

const land = (overrides: Partial<LandSample> = {}): LandSample => ({
  elevation: 0,
  kind: "river",
  moisture: 0.58,
  snow: false,
  water: 18,
  drainage: { saturation: 0.28, slope: 0.04, lowland: 0.6, waterDistance: 18 },
  ...overrides,
});
const habitat = (overrides: Partial<Habitat> = {}): Habitat => ({
  ecology: "grassland",
  kind: "meadow",
  wet: 0.35,
  cover: 0.12,
  exposed: 0.08,
  season: "summer",
  ...overrides,
});

it("keeps resource potentials distinct instead of collapsing them to one value", () => {
  const field = landPotential(land(), habitat());
  const rock = landPotential(
    land({
      moisture: 0.16,
      water: 70,
      drainage: {
        saturation: 0.04,
        slope: 0.5,
        lowland: 0.05,
        waterDistance: 70,
      },
    }),
    habitat({
      ecology: "dry-scrub",
      kind: "exposed",
      wet: 0.04,
      cover: 0.03,
      exposed: 0.92,
    }),
  );
  expect(field.yields.arable).toBeGreaterThan(rock.yields.arable);
  expect(field.yields.pasture).toBeGreaterThan(rock.yields.pasture);
  expect(rock.yields.stone).toBeGreaterThan(field.yields.stone);
  expect(field.subsistence).toBeGreaterThan(rock.subsistence);
});

it("recognizes freshwater margins without treating mineral prospectivity as ore", () => {
  const marsh = landPotential(
    land({
      water: 1,
      moisture: 0.9,
      drainage: { saturation: 0.88, slope: 0.01, lowland: 1, waterDistance: 1 },
    }),
    habitat({
      ecology: "wetland",
      kind: "hollow",
      wet: 0.92,
      cover: 0.18,
      exposed: 0.02,
    }),
  );
  expect(marsh.yields.reeds).toBeGreaterThan(0.75);
  expect(marsh.yields.clay).toBeGreaterThan(0.5);
  expect(marsh.yields.fish).toBeGreaterThan(0);
  expect(marsh.yields.mineral).toBeLessThan(0.1);
});

it("keeps every normalized score bounded", () => {
  const potential = landPotential(land(), habitat());
  for (const value of [
    ...Object.values(potential.yields),
    potential.subsistence,
    potential.materials,
    potential.buildability,
  ]) {
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
  }
});
