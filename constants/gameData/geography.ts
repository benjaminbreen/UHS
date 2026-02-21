/**
 * constants/gameData/geography.ts - Defines geographical and cultural zones, and their generation data.
 */
import { ZoneDefinition, ClimateType, MapArchetype, CulturalZone } from '../../types';

export const CULTURE_ZONES = [
    "Europe",
    "North America",
    "South America",
    "MENA", // Middle East & North Africa
    "Sub Saharan Africa",
    "South Asia", // Now includes Southeast Asia
    "East Asia", // Now includes Central Asia
    "Oceania"
];

export const GEOGRAPHICAL_DATA: { [zoneName: string]: ZoneDefinition } = {
    "Europe": {

       "European Waters": {
            "Irish Sea": { name: "Irish Sea", climate: ClimateType.TEMPERATE, archetype: MapArchetype.OPEN_OCEAN },
            "North Sea": { name: "North Sea", climate: ClimateType.TEMPERATE, archetype: MapArchetype.OPEN_OCEAN },
            "Baltic Sea": { name: "Baltic Sea", climate: ClimateType.TEMPERATE, archetype: MapArchetype.OPEN_OCEAN },
            "Bay of Biscay": { name: "Bay of Biscay", climate: ClimateType.TEMPERATE, archetype: MapArchetype.OPEN_OCEAN },
            "English Channel": { name: "English Channel", climate: ClimateType.TEMPERATE, archetype: MapArchetype.OPEN_OCEAN },
             "Atlantic Ocean": { name: "Atlantic Ocean", climate: ClimateType.TEMPERATE, archetype: MapArchetype.OPEN_OCEAN },
               
            // Mediterranean
            "Western Mediterranean": { name: "Western Mediterranean", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.OPEN_OCEAN },
            "Eastern Mediterranean": { name: "Eastern Mediterranean", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.OPEN_OCEAN },
            "Aegean Sea": { name: "Aegean Sea", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.OPEN_OCEAN },
            "Adriatic Sea": { name: "Adriatic Sea", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.OPEN_OCEAN },
            "Tyrrhenian Sea": { name: "Tyrrhenian Sea", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.OPEN_OCEAN },
             },

        "British Isles": {
            "London": { name: "London", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT, riverDirection: 'east-west'},
            "Edinburgh": { name: "Edinburgh", climate: ClimateType.TEMPERATE, archetype: MapArchetype.PENINSULA },
            "Leinster Plain": { name: "Leinster Plain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "York": { name: "York", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Hadrian's Wall": { name: "Hadrian's Wall", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Thames Estuary": { name: "Thames Estuary", climate: ClimateType.TEMPERATE, archetype: MapArchetype.DELTA, deltaOutlet: 'east' },
            "Oxfordshire": { name: "Oxfordshire", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Cliffs of Dover": { name: "Cliffs of Dover", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
        },
        "France": {
            "Paris Basin": { name: "Paris Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'low', hasLakes: false },
            "Loire Valley": { name: "Loire Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Marseille Coast": { name: "Marseille Coast", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.BAY },
            "Pyrenees Foothills": { name: "Pyrenees Foothills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Normandy": { name: "Normandy", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Languedoc": { name: "Languedoc", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, hasLakes: false }
        },
        "Iberian Peninsula": {
            "Andalusian Plain": { name: "Andalusian Plain", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Lisbon Coast": { name: "Lisbon Coast", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.BAY },
            "Ebro Valley": { name: "Ebro Valley", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.RIVER_PORT },
            "Toledo Plateau": { name: "Toledo Plateau", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Strait of Gibraltar": { name: "Strait of Gibraltar", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.STRAITS },
            "Catalonian Hills": { name: "Catalonian Hills", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, hasLakes: false },
             "Galicia": { name: "Galicia", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
        },
        "Italy": {
            "Roman Campagna": { name: "Roman Campagna", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Venetian Lagoon": { name: "Venetian Lagoon", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.BAY },
            "Apennine Foothills": { name: "Apennine Foothills", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Bay of Naples": { name: "Bay of Naples", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.BAY, isVolcanic: true },
            "Florence Hills": { name: "Florence Hills", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Po Valley": { name: "Po Valley", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.RIVER_PORT }
        },
        "Germanic Lands": {
            "Rhine Valley": { name: "Rhine Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT, riverDirection: 'north-south' },
            "Black Forest": { name: "Black Forest", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: true },
            "Brandenburg Plain": { name: "Brandenburg Plain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: true },
            "Hamburg Coast": { name: "Hamburg Coast", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Bavarian Highlands": { name: "Bavarian Highlands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Saxon Uplands": { name: "Saxon Uplands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false }
        },
        "Central Europe": {
            "Danube Bend": { name: "Danube Bend", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT, riverDirection: 'east-west' },
            "Bohemian Plateau": { name: "Bohemian Plateau", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Carpathian Foothills": { name: "Carpathian Foothills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Vienna Basin": { name: "Vienna Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Moravian Gate": { name: "Moravian Gate", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Tatra Mountains": { name: "Tatra Mountains", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false }
        },
        "Balkans": {
            "Dinaric Alps": { name: "Dinaric Alps", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Bosporus": { name: "Bosporus", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.STRAITS },
            "Pindus Mountains": { name: "Pindus Mountains", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Thracian Plain": { name: "Thracian Plain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Dalmatian Coast": { name: "Dalmatian Coast", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Vardar Valley": { name: "Vardar Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT }
        },
        "Scandinavia": {
            "Stockholm Archipelago": { name: "Stockholm Archipelago", climate: ClimateType.COLD, archetype: MapArchetype.STRAITS },
            "Norwegian Fjords": { name: "Norwegian Fjords", climate: ClimateType.COLD, archetype: MapArchetype.BAY },
            "Jutland Peninsula": { name: "Jutland Peninsula", climate: ClimateType.TEMPERATE, archetype: MapArchetype.PENINSULA },
            "Lapland": { name: "Lapland", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, hasLakes: true, economicActivityLevel: 1 },
            "Gotland": { name: "Gotland", climate: ClimateType.COLD, archetype: MapArchetype.ISLAND },
            "Øresund Strait": { name: "Øresund Strait", climate: ClimateType.TEMPERATE, archetype: MapArchetype.STRAITS }
        },
        "Eastern Europe": {
            "Moscow Basin": { name: "Moscow Basin", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Dnieper River Valley": { name: "Dnieper River Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Volga Bend": { name: "Volga Bend", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Carpathian Ridge": { name: "Carpathian Ridge", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Steppe Borderlands": { name: "Steppe Borderlands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false, economicActivityLevel: 1 },
            "Novgorod Woods": { name: "Novgorod Woods", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, hasLakes: true }
        },
        "Ural and Arctic Europe": {
            "Ural Mountains": { name: "Ural Mountains", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', economicActivityLevel: 1 },
            "White Sea Coast": { name: "White Sea Coast", climate: ClimateType.COLD, archetype: MapArchetype.BAY }

        },
        "Low Countries": {
            "Rhine–Meuse Delta": { name: "Rhine–Meuse Delta", climate: ClimateType.TEMPERATE, archetype: MapArchetype.DELTA, deltaOutlet: 'west' },
            "Flanders Fields": { name: "Flanders Fields", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'low', hasLakes: false },
            "Zuiderzee Coast": { name: "Zuiderzee Coast", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Brabant Highlands": { name: "Brabant Highlands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Ardennes Forest": { name: "Ardennes Forest", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: true },
            "Scheldt Basin": { name: "Scheldt Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT }
        },
        "Greece and Aegean": {
            "Athens Basin": { name: "Athens Basin", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Peloponnesian Hills": { name: "Peloponnesian Hills", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.PENINSULA },
            "Crete": { name: "Crete", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ISLAND },
            "Sicily": { name: "Sicily", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ISLAND, economicActivityLevel: 3, isVolcanic: true },
            "Cyprus": { name: "Cyprus", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ISLAND, economicActivityLevel: 3 },
            "Delos Archipelago": { name: "Delos Archipelago", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ISLAND },
            "Mount Olympus": { name: "Mount Olympus", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Thessalian Plain": { name: "Thessalian Plain", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, hasLakes: false }
        },

        "Atlantic Islands": {
            "Iceland": { name: "Iceland", climate: ClimateType.COLD, archetype: MapArchetype.ISLAND, economicActivityLevel: 1, isVolcanic: true },
            "Greenland Coast": { name: "Greenland Coast", climate: ClimateType.POLAR, archetype: MapArchetype.BAY, economicActivityLevel: 0 },
            "Azores": { name: "Azores", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ISLAND },
            "Cape Verde": { name: "Cape Verde", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND }
        },
    },
    "North America": {
        "Pacific Coast": {
            "Columbia River Valley": { name: "Columbia River Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT, riverDirection: 'east-west' },
            "Puget Sound": { name: "Puget Sound", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Olympic Peninsula": { name: "Olympic Peninsula", climate: ClimateType.TEMPERATE, archetype: MapArchetype.PENINSULA },
            "Redwood Coast": { name: "Redwood Coast", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
             "Shasta Region": { name: "Shasta Region", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
               "Cascade Range": { name: "Cascade Range", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },

        },
        "Northern California": {
            "San Francisco Bay": { name: "San Francisco Bay", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.BAY, bayOutlet: 'west' },
            "Marin Headlands": { name: "Marin Headlands", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.PENINSULA },
            "Sacramento Valley": { name: "Sacramento Valley", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.DELTA, deltaOutlet: 'west' },
            "Sierra Nevada Foothills": { name: "Sierra Nevada Foothills", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Napa Valley": { name: "Napa Valley", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, altitude: 'low', hasLakes: false },
            "Pacific Coast Ranges": { name: "Pacific Coast Ranges", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
        },
        "Central California Coast": {
            "Monterey Bay": { name: "Monterey Bay", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.BAY, bayOutlet: 'west' },
            "Santa Cruz Mountains": { name: "Santa Cruz Mountains", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, altitude: 'high' },
            "Salinas Valley": { name: "Salinas Valley", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.RIVER_PORT, riverDirection: 'north-south', altitude: 'low' },
            "Big Sur Coast": { name: "Big Sur Coast", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.PENINSULA },
            "San Luis Obispo": { name: "San Luis Obispo", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.BAY, bayOutlet: 'west' }
        },
        "Southern California": {
            "Santa Barbara Channel": { name: "Santa Barbara Channel", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.BAY, bayOutlet: 'south' },
            "Los Angeles Basin": { name: "Los Angeles Basin", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.BAY },
            "Channel Islands": { name: "Channel Islands", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.BARRIER_ISLAND, islandOrientation: 'east-west' },
            "San Diego Bay": { name: "San Diego Bay", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.BAY, bayOutlet: 'west'},
            "Mojave Desert": { name: "Mojave Desert", climate: ClimateType.ARID, archetype: MapArchetype.DESERT, economicActivityLevel: 1 },
            "Central Valley": { name: "Central Valley", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, altitude: 'low' },
        },
        "Southwest": {
            "Sonoran Desert": { name: "Sonoran Desert", climate: ClimateType.ARID, archetype: MapArchetype.DESERT, hasLakes: false },
            "Chaco Canyon": { name: "Chaco Canyon", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Rio Grande Valley": { name: "Rio Grande Valley", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT, riverDirection: 'north-south' },
            "Colorado Plateau": { name: "Colorado Plateau", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Rocky Mountains": { name: "Rocky Mountains", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Ancestral Puebloan Lands": { name: "Ancestral Puebloan Lands", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Mogollon Rim": { name: "Mogollon Rim", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false }
        },
        "Great Plains": {
            "Black Hills": { name: "Black Hills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: true },
            "Platte River Basin": { name: "Platte River Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Flint Hills": { name: "Flint Hills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Badlands": { name: "Badlands", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, hasLakes: false, economicActivityLevel: 1 },
            "Tallgrass Prairie": { name: "Tallgrass Prairie", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Missouri Breaks": { name: "Missouri Breaks", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Texas Hill Country": { name: "Texas Hill Country", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Llano Estacado": { name: "Llano Estacado", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Rio Grande Valley": { name: "Rio Grande Valley", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT, riverDirection: 'north-south' },
            "Gulf Coast Texas": { name: "Gulf Coast Texas", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.BAY }
        },
        "Mississippi Valley": {
            "Cahokia Mounds": { name: "Cahokia Mounds", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Lower Mississippi Delta": { name: "Lower Mississippi Delta", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.DELTA, deltaOutlet: 'south' },
            "Ozark Plateau": { name: "Ozark Plateau", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Natchez Bluffs": { name: "Natchez Bluffs", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Illinois River Valley": { name: "Illinois River Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Driftless Area": { name: "Driftless Area", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false }
        },
        "Northeastern Seaboard": {
            "Hudson River Valley": { name: "Hudson River Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT, riverDirection: 'north-south' },
            "Great Lakes Shoreline": { name: "Great Lakes Shoreline", climate: ClimateType.TEMPERATE, archetype: MapArchetype.FRESHWATER_LAKE },
            "Adirondacks": { name: "Adirondacks", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: true },
            "Finger Lakes": { name: "Finger Lakes", climate: ClimateType.TEMPERATE, archetype: MapArchetype.FRESHWATER_LAKE },
            "Champlain Valley": { name: "Champlain Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.FRESHWATER_LAKE },
            "Mohawk River": { name: "Mohawk River", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "New York Harbor": { name: "New York Harbor", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY, bayOutlet: 'south', economicActivityLevel: 4 },
            "Long Island": { name: "Long Island", climate: ClimateType.TEMPERATE, archetype: MapArchetype.PENINSULA },
            "Cape Cod": { name: "Cape Cod", climate: ClimateType.TEMPERATE, archetype: MapArchetype.PENINSULA },
            "Green Mountains": { name: "Green Mountains", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: true },
            "Connecticut River Valley": { name: "Connecticut River Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT, riverDirection: 'north-south' }
        },
        "Southeast": {
            "Smoky Mountains": { name: "Smoky Mountains", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Okefenokee Swamp": { name: "Okefenokee Swamp", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.SWAMP },
            "Piedmont Uplands": { name: "Piedmont Uplands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Everglades": { name: "Everglades", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.SWAMP },
            "Mississippi Bayou": { name: "Mississippi Bayou", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.SWAMP },
            "Blue Ridge Foothills": { name: "Blue Ridge Foothills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Outer Banks": { name: "Outer Banks", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BARRIER_ISLAND },
            "Chesapeake Bay": { name: "Chesapeake Bay", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Florida Keys": { name: "Florida Keys", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND }
        },
         "Canada": {
            "St. Lawrence River": { name: "St. Lawrence River", climate: ClimateType.COLD, archetype: MapArchetype.RIVER_PORT },
            "Canadian Maritimes": { name: "Canadian Maritimes", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Ontario Shield": { name: "Ontario Shield", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, hasLakes: true },
            "Canadian Prairies": { name: "Canadian Prairies", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Canadian Rockies": { name: "Canadian Rockies", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "British Columbia Coast": { name: "British Columbia Coast", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Canadian North": { name: "Canadian North", climate: ClimateType.POLAR, archetype: MapArchetype.ALL_LAND, hasLakes: true, economicActivityLevel: 1 }
        },
        "Arctic and Subarctic": {
            "Hudson Bay Lowlands": { name: "Hudson Bay Lowlands", climate: ClimateType.COLD, archetype: MapArchetype.BAY },
                        "Hudson Bay": { name: "Hudson Bay", climate: ClimateType.POLAR, archetype: MapArchetype.OPEN_OCEAN },
            "Bering Strait": { name: "Bering Strait", climate: ClimateType.COLD, archetype: MapArchetype.STRAITS },
            "Yukon River Valley": { name: "Yukon River Valley", climate: ClimateType.COLD, archetype: MapArchetype.RIVER_PORT, riverDirection: 'east-west', economicActivityLevel: 1 },
            "Labrador Coast": { name: "Labrador Coast", climate: ClimateType.POLAR, archetype: MapArchetype.BAY },
            "Mackenzie Delta": { name: "Mackenzie Delta", climate: ClimateType.POLAR, archetype: MapArchetype.DELTA, deltaOutlet: 'north', economicActivityLevel: 1 },
            "Aleutian Islands": { name: "Aleutian Islands", climate: ClimateType.POLAR, archetype: MapArchetype.ISLAND },
            "Newfoundland Grand Banks": { name: "Newfoundland Grand Banks", climate: ClimateType.COLD, archetype: MapArchetype.SHOALS },
            "Lake Superior Basin": { name: "Lake Superior Basin", climate: ClimateType.COLD, archetype: MapArchetype.FRESHWATER_LAKE }
        },
        "Mexico and Central Highlands": {
            "Valley of Mexico": { name: "Valley of Mexico", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.FRESHWATER_LAKE },
            "Oaxaca Highlands": { name: "Oaxaca Highlands", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Yucatán Peninsula": { name: "Yucatán Peninsula", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.PENINSULA },
            "Sierra Madre Oriental": { name: "Sierra Madre Oriental", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Isthmus of Tehuantepec": { name: "Isthmus of Tehuantepec", climate: ClimateType.TROPICAL, archetype: MapArchetype.PENINSULA },
            "Lake Texcoco Basin": { name: "Lake Texcoco Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.FRESHWATER_LAKE },
            "Baja California": { name: "Baja California", climate: ClimateType.ARID, archetype: MapArchetype.PENINSULA },
            "Sinaloa Coast": { name: "Sinaloa Coast", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.BAY }
        },
        "Central America": {
            "Mayan Lowlands": { name: "Mayan Lowlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Mosquito Coast": { name: "Mosquito Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Panama Isthmus": { name: "Panama Isthmus", climate: ClimateType.TROPICAL, archetype: MapArchetype.PENINSULA },
             "Darien Swamp": { name: "Darien Swamp", climate: ClimateType.TROPICAL, archetype: MapArchetype.SWAMP, economicActivityLevel: 0 },
            
        },
        "The Caribbean": {
            "Greater Antilles": { name: "Greater Antilles", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Cuba": { name: "Cuba", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND, economicActivityLevel: 4 },
            "Hispaniola": { name: "Hispaniola", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND, economicActivityLevel: 3 },
            "Jamaica": { name: "Jamaica", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND, economicActivityLevel: 3 },
            "Lesser Antilles": { name: "Lesser Antilles", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
             "Gulf of Mexico": { name: "Gulf of Mexico", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.OPEN_OCEAN },
            "Caribbean Sea": { name: "Caribbean Sea", climate: ClimateType.TROPICAL, archetype: MapArchetype.OPEN_OCEAN },
        },
        "Northern Rockies": {
            "Bitterroot Range": { name: "Bitterroot Range", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Yellowstone Basin": { name: "Yellowstone Basin", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: true, economicActivityLevel: 1 },
            "Snake River Plain": { name: "Snake River Plain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Glacier Foothills": { name: "Glacier Foothills", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: true },
            "Salmon River Canyons": { name: "Salmon River Canyons", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Absaroka Range": { name: "Absaroka Range", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false }
        },
        "Atlantic Coast": {
            "Chesapeake Bay": { name: "Chesapeake Bay", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Cape Cod": { name: "Cape Cod", climate: ClimateType.TEMPERATE, archetype: MapArchetype.PENINSULA },
            "Boston Harbor": { name: "Boston Harbor", climate: ClimateType.TEMPERATE, archetype: MapArchetype.PENINSULA },
            "Pine Barrens": { name: "Pine Barrens", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Outer Banks": { name: "Outer Banks", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BARRIER_ISLAND, islandOrientation: 'north-south' },
            "Delaware River Valley": { name: "Delaware River Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Tidewater Region": { name: "Tidewater Region", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Virginia ": { name: "Virginia", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND }
        }
    },
    "South America": {
        "Andes North": {
            "Quito Plateau": { name: "Quito Plateau", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Cajamarca Highlands": { name: "Cajamarca Highlands", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Lake Titicaca Basin": { name: "Lake Titicaca Basin", climate: ClimateType.COLD, archetype: MapArchetype.FRESHWATER_LAKE },
            "Chimborazo Slopes": { name: "Chimborazo Slopes", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Cordillera Blanca": { name: "Cordillera Blanca", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', economicActivityLevel: 0 },
            "Chachapoyas Forest": { name: "Chachapoyas Forest", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false }
        },
        "Andes South": {
            "Cuzco Valley": { name: "Cuzco Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Altiplano": { name: "Altiplano", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Atacama Desert": { name: "Atacama Desert", climate: ClimateType.ARID, archetype: MapArchetype.DESERT, economicActivityLevel: 0 },
            "Mendoza Foothills": { name: "Mendoza Foothills", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Aconcagua Range": { name: "Aconcagua Range", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', economicActivityLevel: 0 },
            "Mapuche Territory": { name: "Mapuche Territory", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: true }
        },
        "Amazon Basin": {
            "Amazon Delta": { name: "Amazon Delta", climate: ClimateType.TROPICAL, archetype: MapArchetype.DELTA, deltaOutlet: 'east', economicActivityLevel: 3 },
            "Manaus Region": { name: "Manaus Region", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Rio Negro Junction": { name: "Rio Negro Junction", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Xingu Headwaters": { name: "Xingu Headwaters", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Acre Rainforest": { name: "Acre Rainforest", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Varzea Floodplains": { name: "Varzea Floodplains", climate: ClimateType.TROPICAL, archetype: MapArchetype.SWAMP },
            "Tapajós Basin": { name: "Tapajós Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT }
        },
        "Gran Chaco and Pampas": {
            "Pampas Grasslands": { name: "Pampas Grasslands", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND },
            "Paraná Delta": { name: "Paraná Delta", climate: ClimateType.TEMPERATE, archetype: MapArchetype.DELTA, deltaOutlet: 'south' },
            "Santa Fe Floodplain": { name: "Santa Fe Floodplain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.DELTA },
            "Gran Chaco": { name: "Gran Chaco", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, economicActivityLevel: 1 },
            "Pantanal": { name: "Pantanal", climate: ClimateType.TROPICAL, archetype: MapArchetype.SWAMP },
            "Córdoba Hills": { name: "Córdoba Hills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Uruguay River Valley": { name: "Uruguay River Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT }
        },
        "Atlantic Coast": {
            "Rio de Janeiro Bay": { name: "Rio de Janeiro Bay", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.BAY },
            "Bahia Coast": { name: "Bahia Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Pernambuco Highlands": { name: "Pernambuco Highlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "São Paulo Plateau": { name: "São Paulo Plateau", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Recôncavo Basin": { name: "Recôncavo Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Espírito Santo Shore": { name: "Espírito Santo Shore", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY }
        },
        "Guiana Shield": {
            "Orinoco Delta": { name: "Orinoco Delta", climate: ClimateType.TROPICAL, archetype: MapArchetype.SWAMP },
            "Guiana Highlands": { name: "Guiana Highlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', economicActivityLevel: 1 },
            "Essequibo Valley": { name: "Essequibo Valley", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Maroni Basin": { name: "Maroni Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Rupununi Savannah": { name: "Rupununi Savannah", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Kaieteur Plateau": { name: "Kaieteur Plateau", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
             "Guyana Highlands": { name: "Guyana Highlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Pantanal Wetlands": { name: "Pantanal Wetlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.SWAMP, hasLakes: true },
            "Maracaibo Basin": { name: "Maracaibo Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY }
        },
        "Patagonia": {
            "Valdés Peninsula": { name: "Valdés Peninsula", climate: ClimateType.TEMPERATE, archetype: MapArchetype.PENINSULA },
            "Andean Foothills": { name: "Andean Foothills", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Magellanic Steppe": { name: "Magellanic Steppe", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, economicActivityLevel: 1 },
            "Tierra del Fuego": { name: "Tierra del Fuego", climate: ClimateType.COLD, archetype: MapArchetype.ISLAND },
            "Strait of Magellan": { name: "Strait of Magellan", climate: ClimateType.COLD, archetype: MapArchetype.STRAITS },
            "Southern Ice Fields": { name: "Southern Ice Fields", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', economicActivityLevel: 0 }
        },
        "Southern Highlands": {
            "Potosí Region": { name: "Potosí Region", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Tarija Valley": { name: "Tarija Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Cochabamba Basin": { name: "Cochabamba Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Santa Cruz Lowlands": { name: "Santa Cruz Lowlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Sucre Uplands": { name: "Sucre Uplands", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND },
            "Yungas Slopes": { name: "Yungas Slopes", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND }
        },
        "Llanos and Orinoco": {
            "Apure Plains": { name: "Apure Plains", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Meta River Basin": { name: "Meta River Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Llanos Floodplain": { name: "Llanos Floodplain", climate: ClimateType.TROPICAL, archetype: MapArchetype.DELTA },
            "Villavicencio Foothills": { name: "Villavicencio Foothills", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Arauca Borderlands": { name: "Arauca Borderlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Orinoco Rapids": { name: "Orinoco Rapids", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT }
        }
    },
    "MENA": {
        "Nile Valley": {
            "Thebes Valley": { name: "Thebes Valley", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT, riverDirection: 'north-south' },
            "Nile Delta": { name: "Nile Delta", climate: ClimateType.ARID, archetype: MapArchetype.DELTA, deltaOutlet: 'north' },
            "Aswan Cataracts": { name: "Aswan Cataracts", climate: ClimateType.ARID, archetype: MapArchetype.SWAMP },
            "Faiyum Oasis": { name: "Faiyum Oasis", climate: ClimateType.ARID, archetype: MapArchetype.FRESHWATER_LAKE },
            "Eastern Desert Wadis": { name: "Eastern Desert Wadis", climate: ClimateType.ARID, archetype: MapArchetype.DESERT, economicActivityLevel: 0 },
            "Alexandria Coast": { name: "Alexandria Coast", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.BAY }
        },
        "Nubian Corridor": {
            "Nubian Desert": { name: "Nubian Desert", climate: ClimateType.ARID, archetype: MapArchetype.DESERT, economicActivityLevel: 0 },
            "Bayuda Desert": { name: "Bayuda Desert", climate: ClimateType.ARID, archetype: MapArchetype.DESERT },
            
        },
        "Levant": {
            "Jerusalem Hills": { name: "Jerusalem Hills", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Bekaa Valley": { name: "Bekaa Valley", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Dead Sea Shore": { name: "Dead Sea Shore", climate: ClimateType.ARID, archetype: MapArchetype.FRESHWATER_LAKE },
            "Golan Heights": { name: "Golan Heights", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND },
            "Galilee Basin": { name: "Galilee Basin", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.FRESHWATER_LAKE },
            "Mount Lebanon Range": { name: "Mount Lebanon Range", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND }
        },
        "Anatolia": {
            "Cappadocian Highlands": { name: "Cappadocian Highlands", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Pontic Coast": { name: "Pontic Coast", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.BAY },
            "Cilician Plain": { name: "Cilician Plain", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Tarsus Foothills": { name: "Tarsus Foothills", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Central Plateau": { name: "Central Plateau", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Bosporus Straits": { name: "Bosporus Straits", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.STRAITS }
        },
        "Mesopotamia": {
            "Tigris–Euphrates Confluence": { name: "Tigris–Euphrates Confluence", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT },
            "Nineveh Plain": { name: "Nineveh Plain", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Marsh Arab Wetlands": { name: "Marsh Arab Wetlands", climate: ClimateType.ARID, archetype: MapArchetype.SWAMP },
            "Babylon Region": { name: "Babylon Region", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT },
            "Zagros Foothills": { name: "Zagros Foothills", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Diyala Valley": { name: "Diyala Valley", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT }
        },
        "Maghreb": {
            "Atlas Mountains": { name: "Atlas Mountains", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Fez Plateau": { name: "Fez Plateau", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND },
            "Tunisian Sahel": { name: "Tunisian Sahel", climate: ClimateType.ARID, archetype: MapArchetype.BAY },
            "Rif Coast": { name: "Rif Coast", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.BAY },
            "Draa Valley": { name: "Draa Valley", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT },
            "Tripolitania": { name: "Tripolitania", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.BAY },
              "Tell Atlas": { 
        name: "Tell Atlas", 
        climate: ClimateType.SEMI_ARID, 
        archetype: MapArchetype.ALL_LAND 
    },
    "Cyrenaica Coast": { 
        name: "Cyrenaica Coast", 
        climate: ClimateType.MEDITERRANEAN, 
        archetype: MapArchetype.BAY 
    }
        },
        "Arabian Peninsula": {
            "Hejaz Interior": { name: "Hejaz Interior", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Empty Quarter": { name: "Empty Quarter", climate: ClimateType.ARID, archetype: MapArchetype.DESERT, economicActivityLevel: 0 },
            "Hadhramaut Valley": { name: "Hadhramaut Valley", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Dhofar Hills": { name: "Dhofar Hills", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Najd Plateau": { name: "Najd Plateau", climate: ClimateType.ARID, archetype: MapArchetype.DESERT, economicActivityLevel: 1, hasLakes: false  },
            "Red Sea Coast": { name: "Red Sea Coast", climate: ClimateType.ARID, archetype: MapArchetype.BAY },
             "Hejaz Mountains": { name: "Hejaz Mountains", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, altitude: 'high' },
        },
        "Persian Plateau": {
            "Isfahan Basin": { name: "Isfahan Basin", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Zagros Highlands": { name: "Zagros Highlands", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Caspian Foothills": { name: "Caspian Foothills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Dasht-e Kavir": { name: "Dasht-e Kavir", climate: ClimateType.ARID, archetype: MapArchetype.DESERT, economicActivityLevel: 0 },
            "Shiraz Valley": { name: "Shiraz Valley", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Alborz Mountains": { name: "Alborz Mountains", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
             "Khuzestan Plain": { name: "Khuzestan Plain", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
        },
        "Caucasus": {
            "Tbilisi Valley": { name: "Tbilisi Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Mount Ararat": { name: "Mount Ararat", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Kura River Basin": { name: "Kura River Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Chechen Highlands": { name: "Chechen Highlands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Black Sea Foothills": { name: "Black Sea Foothills", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Caspian Depression": { name: "Caspian Depression", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, altitude: 'low', hasLakes: false }
        },
        "Eastern Desert and Red Sea": {
            "Eastern Desert Highlands": { name: "Eastern Desert Highlands", climate: ClimateType.ARID, archetype: MapArchetype.DESERT, altitude: 'high', economicActivityLevel: 0 },
            "Sudanese Red Sea": { name: "Sudanese Red Sea", climate: ClimateType.ARID, archetype: MapArchetype.BAY },
            "Wadi Hammamat": { name: "Wadi Hammamat", climate: ClimateType.ARID, archetype: MapArchetype.DESERT },
            "Berenice Hinterland": { name: "Berenice Hinterland", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Suez Isthmus": { name: "Suez Isthmus", climate: ClimateType.ARID, archetype: MapArchetype.PENINSULA },
            "Gebel Elba Region": { name: "Gebel Elba Region", climate: ClimateType.ARID, archetype: MapArchetype.DESERT }
        }
    },
    "Sub Saharan Africa": {
        "Sahel": {
            "Timbuktu Basin": { name: "Timbuktu Basin", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Lake Chad": { name: "Lake Chad", climate: ClimateType.ARID, archetype: MapArchetype.FRESHWATER_LAKE },
            "Niger Bend": { name: "Niger Bend", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT },
            "Gao Region": { name: "Gao Region", climate: ClimateType.ARID, archetype: MapArchetype.DESERT },
            "Sahelian Scrublands": { name: "Sahelian Scrublands", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Dogon Plateau": { name: "Dogon Plateau", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
              "Central Sahara": { name: "Central Sahara", climate: ClimateType.ARID, archetype: MapArchetype.DESERT, economicActivityLevel: 0 },
            "Hoggar Mountains": { name: "Hoggar Mountains", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, altitude: 'high', economicActivityLevel: 0, hasLakes: false  },
            "Tibesti Mountains": { name: "Tibesti Mountains", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, altitude: 'high', economicActivityLevel: 0, hasLakes: false  },
            
        },
        "Upper Guinea": {
            "Fouta Djallon Highlands": { name: "Fouta Djallon Highlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Sierra Leone Coast": { name: "Sierra Leone Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Gambia River Basin": { name: "Gambia River Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Ashanti Forest": { name: "Ashanti Forest", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Bissagos Islands": { name: "Bissagos Islands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Gold Coast Savanna": { name: "Gold Coast Savanna", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Lagos Coastal Belt": { name: "Lagos Coastal Belt", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY, economicActivityLevel: 4 },
            "Ivory Coast": { name: "Ivory Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY, economicActivityLevel: 3 }
        },
        "Lower Guinea and Congo Basin": {
            "Cross River Delta": { name: "Cross River Delta", climate: ClimateType.TROPICAL, archetype: MapArchetype.DELTA },
            "Bantu Uplands": { name: "Bantu Uplands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Kinshasa Hinterland": { name: "Kinshasa Hinterland", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Ituri Rainforest": { name: "Ituri Rainforest", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, economicActivityLevel: 1, hasLakes: false },
            "Congo River Bend": { name: "Congo River Bend", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Kongo Coast": { name: "Kongo Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY }
        },
        "Horn of Africa": {
            "Ethiopian Highlands": { name: "Ethiopian Highlands", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Danakil Depression": { name: "Danakil Depression", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, altitude: 'low', economicActivityLevel: 0 },
            "Rift Valley Lakes": { name: "Rift Valley Lakes", climate: ClimateType.ARID, archetype: MapArchetype.FRESHWATER_LAKE },
            "Harar Plateau": { name: "Harar Plateau", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Red Sea Shore": { name: "Red Sea Shore", climate: ClimateType.ARID, archetype: MapArchetype.BAY },
            "Somali Steppe": { name: "Somali Steppe", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, economicActivityLevel: 1 }
        },
        "East African Rift": {
            "Serengeti Plain": { name: "Serengeti Plain", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Mount Kilimanjaro Foothills": { name: "Mount Kilimanjaro Foothills", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Lake Victoria Basin": { name: "Lake Victoria Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.FRESHWATER_LAKE },
            "Great Rift Escarpment": { name: "Great Rift Escarpment", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Olduvai Gorge": { name: "Olduvai Gorge", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Mara River Valley": { name: "Mara River Valley", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
              "Swahili Coast": { name: "Swahili Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
        },
        "Southern Africa": {
            "Drakensberg Mountains": { name: "Drakensberg Mountains", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Kalahari Basin": { name: "Kalahari Basin", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, economicActivityLevel: 1 },
            "Karoo Plateau": { name: "Karoo Plateau", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Cape Coast": { name: "Cape Coast", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Limpopo Valley": { name: "Limpopo Valley", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Zambezi Floodplain": { name: "Zambezi Floodplain", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.DELTA }
        },
        "Central Africa": {
            "Ubangi Basin": { name: "Ubangi Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Equatorial Rainforest": { name: "Equatorial Rainforest", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Bangui Highlands": { name: "Bangui Highlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Lake Tanganyika Shore": { name: "Lake Tanganyika Shore", climate: ClimateType.TROPICAL, archetype: MapArchetype.FRESHWATER_LAKE },
            "Bateke Plateau": { name: "Bateke Plateau", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Lualaba Headwaters": { name: "Lualaba Headwaters", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Rwanda Burundi Highlands": { name: "Rwanda Burundi Highlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: true },
             "Okavango Delta": { name: "Okavango Delta", climate: ClimateType.TROPICAL, archetype: MapArchetype.SWAMP, hasLakes: true },
        },
        "West African Forests": {
            "Ibo Plateau": { name: "Ibo Plateau", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Niger Delta": { name: "Niger Delta", climate: ClimateType.TROPICAL, archetype: MapArchetype.SWAMP },
            "Benin Lowlands": { name: "Benin Lowlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Oyo Hinterland": { name: "Oyo Hinterland", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Jos Plateau": { name: "Jos Plateau", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Ogun River Basin": { name: "Ogun River Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT }
        },
        "Madagascar and Islands": {
            "Highlands of Madagascar": { name: "Highlands of Madagascar", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Antananarivo Region": { name: "Antananarivo Region", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Mozambique Channel Coast": { name: "Mozambique Channel Coast", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.BAY },
            "Comoros Archipelago": { name: "Comoros Archipelago", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Mascarene Islands": { name: "Mascarene Islands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Mahafaly Plateau": { name: "Mahafaly Plateau", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false }
        }
    },
    "South Asia": {
        "Indus Valley": {
            "Harappa Basin": { name: "Harappa Basin", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT },
            "Punjab Plains": { name: "Punjab Plains", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Thar Desert Margin": { name: "Thar Desert Margin", climate: ClimateType.ARID, archetype: MapArchetype.DESERT },
            "Sindh River Delta": { name: "Sindh River Delta", climate: ClimateType.ARID, archetype: MapArchetype.DELTA, deltaOutlet: 'south' },
            "Salt Range Foothills": { name: "Salt Range Foothills", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Rann of Kutch": { name: "Rann of Kutch", climate: ClimateType.ARID, archetype: MapArchetype.SWAMP }
        },
        "Gangetic Plain": {
            "Varanasi Basin": { name: "Varanasi Basin", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Allahabad Confluence": { name: "Allahabad Confluence", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Patna Lowlands": { name: "Patna Lowlands", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Delhi Region": { name: "Delhi Region", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Awadh Plains": { name: "Awadh Plains", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Bengal Delta": { name: "Bengal Delta", climate: ClimateType.TROPICAL, archetype: MapArchetype.SWAMP },
            "Sundarbans Delta": { name: "Sundarbans Delta", climate: ClimateType.TROPICAL, archetype: MapArchetype.DELTA, deltaOutlet: 'south', economicActivityLevel: 4 }
        },
        "Deccan Plateau": {
            "Hyderabad Highlands": { name: "Hyderabad Highlands", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Western Ghats": { name: "Western Ghats", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Malabar Coast": { name: "Malabar Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Coromandel Coast": { name: "Coromandel Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Karnataka Plateau": { name: "Karnataka Plateau", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Eastern Ghats": { name: "Eastern Ghats", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false }
        },
        "Himalayas and Northeast": {
            "Kashmir Valley": { name: "Kashmir Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: true },
            "Sikkim Highlands": { name: "Sikkim Highlands", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Brahmaputra Valley": { name: "Brahmaputra Valley", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Darjeeling Hills": { name: "Darjeeling Hills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Assam Plains": { name: "Assam Plains", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Naga Hills": { name: "Naga Hills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false }
        },
        "Central India": {
            "Malwa Plateau": { name: "Malwa Plateau", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Vindhya Range": { name: "Vindhya Range", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Chota Nagpur Plateau": { name: "Chota Nagpur Plateau", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Narmada Valley": { name: "Narmada Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Gondwana Forests": { name: "Gondwana Forests", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Satpura Range": { name: "Satpura Range", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false }
        },
        "Sri Lanka": {
            "Central Highlands": { name: "Central Highlands", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Jaffna Peninsula": { name: "Jaffna Peninsula", climate: ClimateType.TROPICAL, archetype: MapArchetype.PENINSULA },
            "Anuradhapura Basin": { name: "Anuradhapura Basin", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Kandy Plateau": { name: "Kandy Plateau", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Galle Coast": { name: "Galle Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Trincomalee Harbor": { name: "Trincomalee Harbor", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Maldives": { name: "Maldives", climate: ClimateType.TROPICAL, archetype: MapArchetype.ATOLL, economicActivityLevel: 2 }
        },
        "Mainland Southeast Asia": {
            "Irrawaddy Valley": { name: "Irrawaddy Valley", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Mekong Delta": { name: "Mekong Delta", climate: ClimateType.TROPICAL, archetype: MapArchetype.SWAMP },
            "Red River Delta": { name: "Red River Delta", climate: ClimateType.TROPICAL, archetype: MapArchetype.DELTA, deltaOutlet: 'east' },
            "Annam Highlands": { name: "Annam Highlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Mekong River Basin": { name: "Mekong River Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Tenasserim Coast": { name: "Tenasserim Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Malay Peninsula": { name: "Malay Peninsula", climate: ClimateType.TROPICAL, archetype: MapArchetype.PENINSULA }
        },
        "Indochina Interior": {
            "Shan Plateau": { name: "Shan Plateau", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Annamite Cordillera": { name: "Annamite Cordillera", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Chao Phraya Basin": { name: "Chao Phraya Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT, riverDirection: 'north-south', economicActivityLevel: 4 },
            "Tonle Sap Basin": { name: "Tonle Sap Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.SWAMP, hasLakes: true, economicActivityLevel: 3 }
        },
        "Maritime Southeast Asia": {
            "Strait of Malacca": { name: "Strait of Malacca", climate: ClimateType.TROPICAL, archetype: MapArchetype.STRAITS },
            "Sumatra Highlands": { name: "Sumatra Highlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Java Sea": { name: "Java Sea", climate: ClimateType.TROPICAL, archetype: MapArchetype.SHOALS },
            "West Java Coast": { name: "West Java Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY, economicActivityLevel: 4 },
            "Central Java": { name: "Central Java", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false, isVolcanic: true },
            "East Java Coast": { name: "East Java Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY, economicActivityLevel: 4 },
            "Bali": { name: "Bali", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND, economicActivityLevel: 2 },
            "Sunda Strait": { name: "Sunda Strait", climate: ClimateType.TROPICAL, archetype: MapArchetype.STRAITS },
            "Borneo": { name: "Borneo", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Makassar Strait": { name: "Makassar Strait", climate: ClimateType.TROPICAL, archetype: MapArchetype.STRAITS },
            "Spice Islands": { name: "Spice Islands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Celebes Sea": { name: "Celebes Sea", climate: ClimateType.TROPICAL, archetype: MapArchetype.SHOALS },
            "Banda Sea": { name: "Banda Sea", climate: ClimateType.TROPICAL, archetype: MapArchetype.SHOALS },
            "Timor Sea": { name: "Timor Sea", climate: ClimateType.TROPICAL, archetype: MapArchetype.SHOALS }
        },
        "Philippines": {
            "Luzon Highlands": { name: "Luzon Highlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Visayan Sea": { name: "Visayan Sea", climate: ClimateType.TROPICAL, archetype: MapArchetype.SHOALS },
            "Mindanao": { name: "Mindanao", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Philippine Sea": { name: "Philippine Sea", climate: ClimateType.TROPICAL, archetype: MapArchetype.OPEN_OCEAN },
            "Palawan": { name: "Palawan", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Sulu Sea": { name: "Sulu Sea", climate: ClimateType.TROPICAL, archetype: MapArchetype.SHOALS }
        },
        "Taiwan and East China Sea": {
            "Taiwan Strait": { name: "Taiwan Strait", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.STRAITS },
            "Ryukyu Islands": { name: "Ryukyu Islands", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ISLAND },
            "East China Sea": { name: "East China Sea", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.OPEN_OCEAN }
        }
    },
    "East Asia": {
        "Siberia": {
            "Western Siberia": { name: "Western Siberia", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Central Siberia": { name: "Central Siberia", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, economicActivityLevel: 1, hasLakes: false },
            "Eastern Siberia": { name: "Eastern Siberia", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Arctic Siberia": { name: "Arctic Siberia", climate: ClimateType.POLAR, archetype: MapArchetype.ALL_LAND, economicActivityLevel: 0 },
            "Kamchatka Peninsula": { name: "Kamchatka Peninsula", climate: ClimateType.COLD, archetype: MapArchetype.PENINSULA },
            "Sakhalin Island": { name: "Sakhalin Island", climate: ClimateType.COLD, archetype: MapArchetype.ISLAND }
        },
        "Kazakh Steppes": {
            "Kazakh Steppes": { name: "Kazakh Steppes", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, economicActivityLevel: 1 },
            "Altai Mountains": { name: "Altai Mountains", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Aral Sea Basin": { name: "Aral Sea Basin", climate: ClimateType.ARID, archetype: MapArchetype.FRESHWATER_LAKE },
            "Tian Shan Range": { name: "Tian Shan Range", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, economicActivityLevel: 0 },
            "Dzungarian Basin": { name: "Dzungarian Basin", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, economicActivityLevel: 0 },
             "Khorasan": { name: "Khorasan", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Transoxiana": { name: "Transoxiana", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
        },
        "Central Asian Oases": {
            "Kyzylkum Desert": { name: "Kyzylkum Desert", climate: ClimateType.ARID, archetype: MapArchetype.DESERT },
            "Ferghana Valley": { name: "Ferghana Valley", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Samarkand Region": { name: "Samarkand Region", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Balkh Plains": { name: "Balkh Plains", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Pamir Mountains": { name: "Pamir Mountains", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', economicActivityLevel: 0 },
            "Hindu Kush": { name: "Hindu Kush", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false }
        },
        "Xinjiang": {
            "Tarim Basin": { name: "Tarim Basin", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Kunlun Mountains": { name: "Kunlun Mountains", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', economicActivityLevel: 0, hasLakes: false },
            "Qaidam Basin": { name: "Qaidam Basin", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, economicActivityLevel: 0 }
        },
        "Mongolia and Manchuria": {
            "Mongolian Steppes": { name: "Mongolian Steppes", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, economicActivityLevel: 1 },
            "Gobi Desert": { name: "Gobi Desert", climate: ClimateType.ARID, archetype: MapArchetype.DESERT, economicActivityLevel: 0 },
            "Manchurian Plain": { name: "Manchurian Plain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false }
        },
        "North China Plain": {
            "Yellow River Valley": { name: "Yellow River Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT, riverDirection: 'east-west' },
            "Shandong Peninsula": { name: "Shandong Peninsula", climate: ClimateType.TEMPERATE, archetype: MapArchetype.PENINSULA },
            "Loess Plateau": { name: "Loess Plateau", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Beijing Basin": { name: "Beijing Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Taihang Mountains": { name: "Taihang Mountains", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Hebei Plain": { name: "Hebei Plain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false }
        },
        "South China": {
            "Yangtze Delta": { name: "Yangtze Delta", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.DELTA, deltaOutlet: 'east', economicActivityLevel: 4 },
            "Pearl River Delta": { name: "Pearl River Delta", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.DELTA, deltaOutlet: 'south' },
            "Fujian Coast": { name: "Fujian Coast", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.BAY },
            "Guangxi Highlands": { name: "Guangxi Highlands", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Yangtze Gorges": { name: "Yangtze Gorges", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Hainan Island": { name: "Hainan Island", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Wuyi Mountains": { name: "Wuyi Mountains", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false }
        },
        "West China and Tibet": {
            "Sichuan Basin": { name: "Sichuan Basin", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Yunnan Plateau": { name: "Yunnan Plateau", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Tibetan Plateau": { name: "Tibetan Plateau", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, economicActivityLevel: 0, hasLakes: false },
            "Himalayan Slopes": { name: "Himalayan Slopes", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, economicActivityLevel: 0 },
            "Kailash Region": { name: "Kailash Region", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, economicActivityLevel: 0 },
            "Eastern Plateau Slopes": { name: "Eastern Plateau Slopes", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false }
        },
        "Japan": {
            "Kyoto Basin": { name: "Kyoto Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Edo Plain": { name: "Edo Plain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Inland Sea Coast": { name: "Inland Sea Coast", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Mount Fuji Region": { name: "Mount Fuji Region", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Tohoku Hills": { name: "Tohoku Hills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Nara Uplands": { name: "Nara Uplands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
             "Hokkaido": { name: "Hokkaido", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ISLAND },
        },
        "Korea": {
            "Han River Valley": { name: "Han River Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Kaesong Foothills": { name: "Kaesong Foothills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Gyeongju Basin": { name: "Gyeongju Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Jeolla Highlands": { name: "Jeolla Highlands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Baekdu Mountain Zone": { name: "Baekdu Mountain Zone", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Busan Coast": { name: "Busan Coast", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY }
        },
        "Taiwan and Ryukyu": {
            "Central Mountains": { name: "Central Mountains", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Taipei Basin": { name: "Taipei Basin", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "East Coast Rift": { name: "East Coast Rift", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Ryukyu Islands": { name: "Ryukyu Islands", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ISLAND },
            "Kenting Peninsula": { name: "Kenting Peninsula", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.PENINSULA },
            "Taitung Highlands": { name: "Taitung Highlands", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false }
        }
    },
    "Oceania": {
        "Australia – Southeast": {
            "Sydney Basin": { name: "Sydney Basin", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.BAY },
            "Blue Mountains": { name: "Blue Mountains", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Gippsland": { name: "Gippsland", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Murray River Valley": { name: "Murray River Valley", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.RIVER_PORT },
            "Victorian Alps": { name: "Victorian Alps", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Snowy Mountains": { name: "Snowy Mountains", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false }
        },
        "Australia – Outback and Center": {
            "Alice Springs Basin": { name: "Alice Springs Basin", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "MacDonnell Ranges": { name: "MacDonnell Ranges", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Lake Eyre Basin": { name: "Lake Eyre Basin", climate: ClimateType.ARID, archetype: MapArchetype.FRESHWATER_LAKE, economicActivityLevel: 1 },
            "Simpson Desert": { name: "Simpson Desert", climate: ClimateType.ARID, archetype: MapArchetype.DESERT, economicActivityLevel: 0 },
            "Uluru Region": { name: "Uluru Region", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Barkly Tableland": { name: "Barkly Tableland", climate: ClimateType.ARID, archetype: MapArchetype.DESERT }
        },
        "Australia – North and Queensland": {
            "Cape York Peninsula": { name: "Cape York Peninsula", climate: ClimateType.TROPICAL, archetype: MapArchetype.PENINSULA },
            "Great Barrier Reef Coast": { name: "Great Barrier Reef Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Daintree Rainforest": { name: "Daintree Rainforest", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Gulf of Carpentaria": { name: "Gulf of Carpentaria", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Arnhem Land": { name: "Arnhem Land", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, economicActivityLevel: 1 },
            "Torres Strait": { name: "Torres Strait", climate: ClimateType.TROPICAL, archetype: MapArchetype.STRAITS }
        },
        "Australia – West and Desert": {
            "Pilbara": { name: "Pilbara", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Kimberley": { name: "Kimberley", climate: ClimateType.ARID, archetype: MapArchetype.BAY },
            "Great Sandy Desert": { name: "Great Sandy Desert", climate: ClimateType.ARID, archetype: MapArchetype.DESERT, economicActivityLevel: 0 },
            "Nullarbor Plain": { name: "Nullarbor Plain", climate: ClimateType.ARID, archetype: MapArchetype.DESERT, economicActivityLevel: 0 },
            "Swan Coastal Plain": { name: "Swan Coastal Plain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Goldfields Region": { name: "Goldfields Region", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND, hasLakes: false }
        },
        "New Zealand": {
            "Canterbury Plains": { name: "Canterbury Plains", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Southern Alps": { name: "Southern Alps", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', economicActivityLevel: 1 },
            "Rotorua Volcanic Zone": { name: "Rotorua Volcanic Zone", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, hasLakes: true },
            "Hawke's Bay": { name: "Hawke's Bay", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Otago Highlands": { name: "Otago Highlands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Wellington Coast": { name: "Wellington Coast", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.BAY }
        },
        "New Guinea and Melanesia": {
            "Sepik River Basin": { name: "Sepik River Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Highlands of Papua": { name: "Highlands of Papua", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false },
            "Bismarck Archipelago": { name: "Bismarck Archipelago", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Solomon Islands Chain": { name: "Solomon Islands Chain", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Coral Sea Coast": { name: "Coral Sea Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Kokoda Plateau": { name: "Kokoda Plateau", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false }
        },
        "Polynesia": {
            "Society Islands": { name: "Society Islands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Marquesas": { name: "Marquesas", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Tuamotu Atolls": { name: "Tuamotu Atolls", climate: ClimateType.TROPICAL, archetype: MapArchetype.ATOLL },
            "Samoa Archipelago": { name: "Samoa Archipelago", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Tonga Ridge": { name: "Tonga Ridge", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Rapa Nui": { name: "Rapa Nui", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ISLAND }
        },
        "Micronesia": {
            "Caroline Islands": { name: "Caroline Islands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Marshall Islands": { name: "Marshall Islands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ATOLL },
            "Northern Mariana Chain": { name: "Northern Mariana Chain", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Palau": { name: "Palau", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Yap Plateau": { name: "Yap Plateau", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Guam and Surroundings": { name: "Guam and Surroundings", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND }
        },
        "Hawaii and Central Pacific": {
            "Big Island Highlands": { name: "Big Island Highlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false, isVolcanic: true },
            "Maui Slopes": { name: "Maui Slopes", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Oahu Basin": { name: "Oahu Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY, isVolcanic: true },
            "Volcanoes National Park": { name: "Volcanoes National Park", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, altitude: 'high', hasLakes: false, isVolcanic: true },
            "Kauai Valleys": { name: "Kauai Valleys", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND, hasLakes: false },
            "Molokai Channel": { name: "Molokai Channel", climate: ClimateType.TROPICAL, archetype: MapArchetype.STRAITS }
        },
     
     
            
   
       
        "Indonesian and Melanesian Islands": {
           
            "Sulawesi": { name: "Sulawesi", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Andaman Islands": { name: "Andaman Islands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Laccadive Islands": { name: "Laccadive Islands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
             "Vanuatu": { name: "Vanuatu", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "New Caledonia": { name: "New Caledonia", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Chatham Islands": { name: "Chatham Islands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ISLAND },
            "Gilbert Islands": { name: "Gilbert Islands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ATOLL },
        },

        "Antarctica": {
        "Antarctic Peninsula": { name: "Antarctic Peninsula", climate: ClimateType.POLAR, archetype: MapArchetype.PENINSULA, economicActivityLevel: 0 },
        "Transantarctic Mountains": { name: "Transantarctic Mountains", climate: ClimateType.POLAR, archetype: MapArchetype.ALL_LAND, altitude: 'high', economicActivityLevel: 0 },
        "East Antarctic Plateau": { name: "East Antarctic Plateau", climate: ClimateType.POLAR, archetype: MapArchetype.DESERT, economicActivityLevel: 0 }
    },
    
        "Major Seas and Oceans": {
            
            
            // Middle Eastern Waters
            "Black Sea": { name: "Black Sea", climate: ClimateType.TEMPERATE, archetype: MapArchetype.OPEN_OCEAN },
            "Caspian Sea": { name: "Caspian Sea", climate: ClimateType.MEDITERRANEAN, archetype: MapArchetype.OPEN_OCEAN },
            "Red Sea": { name: "Red Sea", climate: ClimateType.ARID, archetype: MapArchetype.OPEN_OCEAN },
            "Persian Gulf": { name: "Persian Gulf", climate: ClimateType.ARID, archetype: MapArchetype.OPEN_OCEAN },
            "Arabian Sea": { name: "Arabian Sea", climate: ClimateType.TROPICAL, archetype: MapArchetype.OPEN_OCEAN },
            
            // Asian Waters
            "Yellow Sea": { name: "Yellow Sea", climate: ClimateType.TEMPERATE, archetype: MapArchetype.OPEN_OCEAN },
            "Sea of Japan": { name: "Sea of Japan", climate: ClimateType.TEMPERATE, archetype: MapArchetype.OPEN_OCEAN },
            "East China Sea": { name: "East China Sea", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.OPEN_OCEAN },
            "South China Sea": { name: "South China Sea", climate: ClimateType.TROPICAL, archetype: MapArchetype.OPEN_OCEAN },
            "Bay of Bengal": { name: "Bay of Bengal", climate: ClimateType.TROPICAL, archetype: MapArchetype.OPEN_OCEAN }
        }
   },
   
   // Special contextual zones for realistic WorldWeaver edge cases
   "Special": {
       "Outer Space": {
           "Outer Space": { 
               name: "Outer Space", 
               climate: ClimateType.ARID, // Arid AIR = darkness/stars
               archetype: MapArchetype.ALL_LAND
           }
       },
       "Contextual": {
           "Air": {
               name: "Air",
               climate: ClimateType.TEMPERATE, // Temperate AIR = clouds/atmosphere
               archetype: MapArchetype.ALL_LAND
           },
           "Undersea": { 
               name: "Undersea", 
               climate: ClimateType.TEMPERATE, // For UNDERSEA biome
               archetype: MapArchetype.ALL_LAND
           }
       }
   }
};

// Export geography as an alias for GEOGRAPHICAL_DATA for compatibility
export const geography = GEOGRAPHICAL_DATA;
