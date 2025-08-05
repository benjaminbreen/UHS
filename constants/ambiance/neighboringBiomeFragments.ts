import { BiomeType } from '../../types';

export const AMBIANCE_NEIGHBORING_BIOME_FRAGMENTS: Partial<Record<BiomeType, string[]>> = {
  [BiomeType.DEEP_OCEAN]: ["The vastness of the deep ocean can be felt nearby.", "The air carries the scent of distant, open waters."],
  [BiomeType.SHALLOW_OCEAN]: ["The tang of salt and the sound of gentle waves comes from the nearby shallows.", "Seabirds circle where the ocean meets the land."],
  [BiomeType.BEACH]: ["The smell of sand and sea spray drifts from a nearby beach."],
  [BiomeType.FOREST]: ["The cool, earthy scent of a forest is carried on the breeze.", "The murmur of trees can be heard not far off."],
  [BiomeType.DENSE_FOREST]: ["A deep, ancient forest looms nearby, its presence palpable."],
  [BiomeType.MOUNTAIN]: ["The imposing silhouette of mountains can be seen in the distance.", "A cool wind descends from higher elevations."],
  [BiomeType.RIVER]: ["The gentle gurgle of a flowing river can be heard nearby.", "The air feels slightly cooler near the watercourse."],
  [BiomeType.MAJOR_RIVER]: ["The powerful presence of a large river is undeniable nearby."],
  [BiomeType.JUNGLE]: ["The humid, vibrant air of a jungle is close.", "Exotic sounds emanate from the dense nearby growth."],
  [BiomeType.DESERT]: ["The dry, hot air of a desert encroaches from one direction.", "A shimmering haze marks the desert's edge."],
  [BiomeType.WETLANDS]: ["The damp, earthy smell of wetlands is noticeable.", "The croaking of frogs or buzzing of insects suggests marshy land nearby."],
  [BiomeType.ACTIVE_LAVA]: ["A faint smell of sulfur and the oppressive heat of lava can be sensed.", "A dull red glow might be visible over the horizon."],
  [BiomeType.ESTUARY]: ["The mixed scent of fresh and saltwater indicates an estuary is close."],
  [BiomeType.FRESHWATER_LAKE]: ["The calm presence of a large freshwater lake is felt nearby."],
};