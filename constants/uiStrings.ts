/**
 * constants/uiStrings.ts - User-facing strings, including descriptions for UI elements.
 */

import { MapArchetype, ClimateType } from '../types';

export const MAP_ARCHETYPE_DESCRIPTIONS: Record<MapArchetype, string> = {
  [MapArchetype.ALL_LAND]: "A land-locked area, often featuring rolling plains, forests, and river systems. No direct ocean access.",
  [MapArchetype.ISLAND]: "A solitary landmass surrounded by water, often with a central high point.",
  [MapArchetype.RIVER_PORT]: "Features a major navigable river flowing through the map, ideal for inland ports.",
  [MapArchetype.SHOALS]: "Shallow, hazardous waters dotted with small land patches and submerged features.",
  [MapArchetype.OPEN_OCEAN]: "Vast expanses of deep water with minimal or no land.",
  [MapArchetype.ATOLL]: "A ring-shaped coral reef, island, or series of islets surrounding a body of water called a lagoon.",
  [MapArchetype.PENINSULA]: "A piece of land almost surrounded by water or projecting out into a body of water.",
  [MapArchetype.BAY]: "A coastal body of water that directly connects to a larger main body of water, such as an ocean or lake.",
  [MapArchetype.FRESHWATER_LAKE]: "A large inland body of fresh water, serving as the map's central feature.",
  [MapArchetype.STRAITS]: "A narrow waterway connecting two larger bodies of water, flanked by land.",
  [MapArchetype.DELTA]: "A fertile, marshy area where a major river splits into numerous distributaries before emptying into the sea.",
};

export const CLIMATE_TYPE_DESCRIPTIONS: Record<ClimateType, string> = {
  [ClimateType.TEMPERATE]: "Moderate temperatures and distinct seasons, supporting diverse ecosystems.",
  [ClimateType.SEMITROPICAL]: "Warm, humid summers and mild winters, often with lush vegetation.",
  [ClimateType.TROPICAL]: "Consistently high temperatures and rainfall, fostering dense jungles and rich biodiversity.",
  [ClimateType.ARID]: "Dry conditions with sparse vegetation, characterized by deserts and scrublands.",
  [ClimateType.COLD]: "Low temperatures year-round, leading to tundra, taiga, or icy landscapes.",
};