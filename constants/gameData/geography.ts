/**
 * constants/gameData/geography.ts - Defines geographical and cultural zones, and their generation data.
 */
import { ZoneDefinition, ClimateType, MapArchetype } from '../../types';
import { CulturalZone } from '../characterData/names';

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
        "British Isles": {
            "London": { name: "London", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Edinburgh": { name: "Edinburgh", climate: ClimateType.TEMPERATE, archetype: MapArchetype.PENINSULA },
            "Dublin": { name: "Dublin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "York": { name: "York", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Hadrian's Wall": { name: "Hadrian's Wall", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Thames Estuary": { name: "Thames Estuary", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Oxfordshire": { name: "Oxfordshire", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND }
        },
        "France": {
            "Paris Basin": { name: "Paris Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Loire Valley": { name: "Loire Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Marseille Coast": { name: "Marseille Coast", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.BAY },
            "Pyrenees Foothills": { name: "Pyrenees Foothills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Normandy": { name: "Normandy", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Languedoc": { name: "Languedoc", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND }
        },
        "Iberian Peninsula": {
            "Andalusian Plain": { name: "Andalusian Plain", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Lisbon Coast": { name: "Lisbon Coast", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.BAY },
            "Ebro Valley": { name: "Ebro Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Toledo Plateau": { name: "Toledo Plateau", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Strait of Gibraltar": { name: "Strait of Gibraltar", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.STRAITS },
            "Catalonian Hills": { name: "Catalonian Hills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND }
        },
        "Italy": {
            "Roman Campagna": { name: "Roman Campagna", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Venetian Lagoon": { name: "Venetian Lagoon", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Apennine Foothills": { name: "Apennine Foothills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Bay of Naples": { name: "Bay of Naples", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.BAY },
            "Florence Hills": { name: "Florence Hills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Po Valley": { name: "Po Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT }
        },
        "Germanic Lands": {
            "Rhine Valley": { name: "Rhine Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Black Forest": { name: "Black Forest", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Brandenburg Plain": { name: "Brandenburg Plain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Hamburg Coast": { name: "Hamburg Coast", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Bavarian Highlands": { name: "Bavarian Highlands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Saxon Uplands": { name: "Saxon Uplands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND }
        },
        "Central Europe": {
            "Danube Bend": { name: "Danube Bend", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Bohemian Plateau": { name: "Bohemian Plateau", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Carpathian Foothills": { name: "Carpathian Foothills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Vienna Basin": { name: "Vienna Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Moravian Gate": { name: "Moravian Gate", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Tatra Mountains": { name: "Tatra Mountains", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND }
        },
        "Balkans": {
            "Dinaric Alps": { name: "Dinaric Alps", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Bosporus": { name: "Bosporus", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.STRAITS },
            "Pindus Mountains": { name: "Pindus Mountains", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Thracian Plain": { name: "Thracian Plain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Dalmatian Coast": { name: "Dalmatian Coast", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Vardar Valley": { name: "Vardar Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT }
        },
        "Scandinavia": {
            "Stockholm Archipelago": { name: "Stockholm Archipelago", climate: ClimateType.COLD, archetype: MapArchetype.STRAITS },
            "Norwegian Fjords": { name: "Norwegian Fjords", climate: ClimateType.COLD, archetype: MapArchetype.BAY },
            "Jutland Peninsula": { name: "Jutland Peninsula", climate: ClimateType.TEMPERATE, archetype: MapArchetype.PENINSULA },
            "Lapland": { name: "Lapland", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Gotland": { name: "Gotland", climate: ClimateType.COLD, archetype: MapArchetype.ISLAND },
            "Øresund Strait": { name: "Øresund Strait", climate: ClimateType.TEMPERATE, archetype: MapArchetype.STRAITS }
        },
        "Eastern Europe": {
            "Moscow Basin": { name: "Moscow Basin", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Dnieper River Valley": { name: "Dnieper River Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Volga Bend": { name: "Volga Bend", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Carpathian Ridge": { name: "Carpathian Ridge", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Steppe Borderlands": { name: "Steppe Borderlands", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Novgorod Woods": { name: "Novgorod Woods", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND }
        },
        "Low Countries": {
            "Rhine–Meuse Delta": { name: "Rhine–Meuse Delta", climate: ClimateType.TEMPERATE, archetype: MapArchetype.DELTA },
            "Flanders Fields": { name: "Flanders Fields", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Zuiderzee Coast": { name: "Zuiderzee Coast", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Brabant Highlands": { name: "Brabant Highlands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Ardennes Forest": { name: "Ardennes Forest", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Scheldt Basin": { name: "Scheldt Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT }
        },
        "Greece and Aegean": {
            "Athens Basin": { name: "Athens Basin", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Peloponnesian Hills": { name: "Peloponnesian Hills", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.PENINSULA },
            "Crete": { name: "Crete", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ISLAND },
            "Delos Archipelago": { name: "Delos Archipelago", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ISLAND },
            "Mount Olympus": { name: "Mount Olympus", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Thessalian Plain": { name: "Thessalian Plain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND }
        }
    },
    "North America": {
        "Pacific Coast": {
            "Columbia River Valley": { name: "Columbia River Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Puget Sound": { name: "Puget Sound", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "San Francisco Bay": { name: "San Francisco Bay", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Santa Barbara Channel": { name: "Santa Barbara Channel", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.BAY },
            "Olympic Peninsula": { name: "Olympic Peninsula", climate: ClimateType.TEMPERATE, archetype: MapArchetype.PENINSULA },
            "Redwood Coast": { name: "Redwood Coast", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY }
        },
        "Southwest": {
            "Sonoran Desert": { name: "Sonoran Desert", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Chaco Canyon": { name: "Chaco Canyon", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Rio Grande Valley": { name: "Rio Grande Valley", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT },
            "Colorado Plateau": { name: "Colorado Plateau", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Ancestral Puebloan Lands": { name: "Ancestral Puebloan Lands", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Mogollon Rim": { name: "Mogollon Rim", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND }
        },
        "Great Plains": {
            "Black Hills": { name: "Black Hills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Platte River Basin": { name: "Platte River Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Flint Hills": { name: "Flint Hills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Badlands": { name: "Badlands", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Tallgrass Prairie": { name: "Tallgrass Prairie", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Missouri Breaks": { name: "Missouri Breaks", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND }
        },
        "Mississippi Valley": {
            "Cahokia Mounds": { name: "Cahokia Mounds", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Lower Mississippi Delta": { name: "Lower Mississippi Delta", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.DELTA },
            "Ozark Plateau": { name: "Ozark Plateau", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Natchez Bluffs": { name: "Natchez Bluffs", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Illinois River Valley": { name: "Illinois River Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Driftless Area": { name: "Driftless Area", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND }
        },
        "Northeast Woodlands": {
            "Hudson River Valley": { name: "Hudson River Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Great Lakes Shoreline": { name: "Great Lakes Shoreline", climate: ClimateType.TEMPERATE, archetype: MapArchetype.FRESHWATER_LAKE },
            "Adirondacks": { name: "Adirondacks", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Finger Lakes": { name: "Finger Lakes", climate: ClimateType.TEMPERATE, archetype: MapArchetype.FRESHWATER_LAKE },
            "Champlain Valley": { name: "Champlain Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.FRESHWATER_LAKE },
            "Mohawk River": { name: "Mohawk River", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT }
        },
        "Southeast": {
            "Smoky Mountains": { name: "Smoky Mountains", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Okefenokee Swamp": { name: "Okefenokee Swamp", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.SHOALS },
            "Piedmont Uplands": { name: "Piedmont Uplands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Everglades": { name: "Everglades", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.SHOALS },
            "Mississippi Bayou": { name: "Mississippi Bayou", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.BAY },
            "Blue Ridge Foothills": { name: "Blue Ridge Foothills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND }
        },
        "Arctic and Subarctic": {
            "Hudson Bay Lowlands": { name: "Hudson Bay Lowlands", climate: ClimateType.COLD, archetype: MapArchetype.BAY },
            "Bering Strait": { name: "Bering Strait", climate: ClimateType.COLD, archetype: MapArchetype.STRAITS },
            "Yukon River Valley": { name: "Yukon River Valley", climate: ClimateType.COLD, archetype: MapArchetype.RIVER_PORT },
            "Labrador Coast": { name: "Labrador Coast", climate: ClimateType.COLD, archetype: MapArchetype.BAY },
            "Mackenzie Delta": { name: "Mackenzie Delta", climate: ClimateType.COLD, archetype: MapArchetype.DELTA },
            "Aleutian Islands": { name: "Aleutian Islands", climate: ClimateType.COLD, archetype: MapArchetype.ISLAND }
        },
        "Mexico and Central Highlands": {
            "Valley of Mexico": { name: "Valley of Mexico", climate: ClimateType.TEMPERATE, archetype: MapArchetype.FRESHWATER_LAKE },
            "Oaxaca Highlands": { name: "Oaxaca Highlands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Yucatán Peninsula": { name: "Yucatán Peninsula", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.PENINSULA },
            "Sierra Madre Oriental": { name: "Sierra Madre Oriental", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Isthmus of Tehuantepec": { name: "Isthmus of Tehuantepec", climate: ClimateType.TROPICAL, archetype: MapArchetype.PENINSULA },
            "Lake Texcoco Basin": { name: "Lake Texcoco Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.FRESHWATER_LAKE }
        },
        "Northern Rockies": {
            "Bitterroot Range": { name: "Bitterroot Range", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Yellowstone Basin": { name: "Yellowstone Basin", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Snake River Plain": { name: "Snake River Plain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Glacier Foothills": { name: "Glacier Foothills", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Salmon River Canyons": { name: "Salmon River Canyons", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Absaroka Range": { name: "Absaroka Range", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND }
        },
        "Atlantic Coast": {
            "Chesapeake Bay": { name: "Chesapeake Bay", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Cape Cod": { name: "Cape Cod", climate: ClimateType.TEMPERATE, archetype: MapArchetype.PENINSULA },
            "Pine Barrens": { name: "Pine Barrens", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Outer Banks": { name: "Outer Banks", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ISLAND },
            "Delaware River Valley": { name: "Delaware River Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Tidewater Region": { name: "Tidewater Region", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY }
        }
    },
    "South America": {
        "Andes North": {
            "Quito Plateau": { name: "Quito Plateau", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Cajamarca Highlands": { name: "Cajamarca Highlands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Lake Titicaca Basin": { name: "Lake Titicaca Basin", climate: ClimateType.COLD, archetype: MapArchetype.FRESHWATER_LAKE },
            "Chimborazo Slopes": { name: "Chimborazo Slopes", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Cordillera Blanca": { name: "Cordillera Blanca", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Chachapoyas Forest": { name: "Chachapoyas Forest", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND }
        },
        "Andes South": {
            "Cuzco Valley": { name: "Cuzco Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Altiplano": { name: "Altiplano", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Atacama Desert": { name: "Atacama Desert", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Mendoza Foothills": { name: "Mendoza Foothills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Aconcagua Range": { name: "Aconcagua Range", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Mapuche Territory": { name: "Mapuche Territory", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND }
        },
        "Amazon Basin": {
            "Manaus Region": { name: "Manaus Region", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Rio Negro Junction": { name: "Rio Negro Junction", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Xingu Headwaters": { name: "Xingu Headwaters", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Acre Rainforest": { name: "Acre Rainforest", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Varzea Floodplains": { name: "Varzea Floodplains", climate: ClimateType.TROPICAL, archetype: MapArchetype.DELTA },
            "Tapajós Basin": { name: "Tapajós Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT }
        },
        "Gran Chaco and Pampas": {
            "Pampas Grasslands": { name: "Pampas Grasslands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Paraná Delta": { name: "Paraná Delta", climate: ClimateType.TEMPERATE, archetype: MapArchetype.DELTA },
            "Santa Fe Floodplain": { name: "Santa Fe Floodplain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.DELTA },
            "Gran Chaco": { name: "Gran Chaco", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
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
            "Orinoco Delta": { name: "Orinoco Delta", climate: ClimateType.TROPICAL, archetype: MapArchetype.DELTA },
            "Guiana Highlands": { name: "Guiana Highlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Essequibo Valley": { name: "Essequibo Valley", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Maroni Basin": { name: "Maroni Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Rupununi Savannah": { name: "Rupununi Savannah", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Kaieteur Plateau": { name: "Kaieteur Plateau", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND }
        },
        "Patagonia": {
            "Valdés Peninsula": { name: "Valdés Peninsula", climate: ClimateType.TEMPERATE, archetype: MapArchetype.PENINSULA },
            "Andean Foothills": { name: "Andean Foothills", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Magellanic Steppe": { name: "Magellanic Steppe", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Tierra del Fuego": { name: "Tierra del Fuego", climate: ClimateType.COLD, archetype: MapArchetype.ISLAND },
            "Strait of Magellan": { name: "Strait of Magellan", climate: ClimateType.COLD, archetype: MapArchetype.STRAITS },
            "Southern Ice Fields": { name: "Southern Ice Fields", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND }
        },
        "Southern Highlands": {
            "Potosí Region": { name: "Potosí Region", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Tarija Valley": { name: "Tarija Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Cochabamba Basin": { name: "Cochabamba Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Santa Cruz Lowlands": { name: "Santa Cruz Lowlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Sucre Uplands": { name: "Sucre Uplands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
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
            "Thebes Valley": { name: "Thebes Valley", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT },
            "Nile Delta": { name: "Nile Delta", climate: ClimateType.ARID, archetype: MapArchetype.DELTA },
            "Aswan Cataracts": { name: "Aswan Cataracts", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT },
            "Faiyum Oasis": { name: "Faiyum Oasis", climate: ClimateType.ARID, archetype: MapArchetype.FRESHWATER_LAKE },
            "Eastern Desert Wadis": { name: "Eastern Desert Wadis", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Alexandria Coast": { name: "Alexandria Coast", climate: ClimateType.ARID, archetype: MapArchetype.BAY }
        },
        "Levant": {
            "Jerusalem Hills": { name: "Jerusalem Hills", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Bekaa Valley": { name: "Bekaa Valley", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Dead Sea Shore": { name: "Dead Sea Shore", climate: ClimateType.ARID, archetype: MapArchetype.FRESHWATER_LAKE },
            "Golan Heights": { name: "Golan Heights", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Galilee Basin": { name: "Galilee Basin", climate: ClimateType.ARID, archetype: MapArchetype.FRESHWATER_LAKE },
            "Mount Lebanon Range": { name: "Mount Lebanon Range", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND }
        },
        "Anatolia": {
            "Cappadocian Highlands": { name: "Cappadocian Highlands", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Pontic Coast": { name: "Pontic Coast", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Cilician Plain": { name: "Cilician Plain", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Tarsus Foothills": { name: "Tarsus Foothills", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Central Plateau": { name: "Central Plateau", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Bosporus Straits": { name: "Bosporus Straits", climate: ClimateType.TEMPERATE, archetype: MapArchetype.STRAITS }
        },
        "Mesopotamia": {
            "Tigris–Euphrates Confluence": { name: "Tigris–Euphrates Confluence", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT },
            "Nineveh Plain": { name: "Nineveh Plain", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Marsh Arab Wetlands": { name: "Marsh Arab Wetlands", climate: ClimateType.ARID, archetype: MapArchetype.SHOALS },
            "Babylon Region": { name: "Babylon Region", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT },
            "Zagros Foothills": { name: "Zagros Foothills", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Diyala Valley": { name: "Diyala Valley", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT }
        },
        "Maghreb": {
            "Atlas Mountains": { name: "Atlas Mountains", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Fez Plateau": { name: "Fez Plateau", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Tunisian Sahel": { name: "Tunisian Sahel", climate: ClimateType.ARID, archetype: MapArchetype.BAY },
            "Rif Coast": { name: "Rif Coast", climate: ClimateType.ARID, archetype: MapArchetype.BAY },
            "Draa Valley": { name: "Draa Valley", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT },
            "Tripolitania": { name: "Tripolitania", climate: ClimateType.ARID, archetype: MapArchetype.BAY }
        },
        "Arabian Peninsula": {
            "Hijaz Mountains": { name: "Hijaz Mountains", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Empty Quarter": { name: "Empty Quarter", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Hadhramaut Valley": { name: "Hadhramaut Valley", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Dhofar Hills": { name: "Dhofar Hills", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Najd Plateau": { name: "Najd Plateau", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Red Sea Coast": { name: "Red Sea Coast", climate: ClimateType.ARID, archetype: MapArchetype.BAY }
        },
        "Persian Plateau": {
            "Isfahan Basin": { name: "Isfahan Basin", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Zagros Highlands": { name: "Zagros Highlands", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Caspian Foothills": { name: "Caspian Foothills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Dasht-e Kavir": { name: "Dasht-e Kavir", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Shiraz Valley": { name: "Shiraz Valley", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Alborz Mountains": { name: "Alborz Mountains", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND }
        },
        "Caucasus": {
            "Tbilisi Valley": { name: "Tbilisi Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Mount Ararat": { name: "Mount Ararat", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Kura River Basin": { name: "Kura River Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Chechen Highlands": { name: "Chechen Highlands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Black Sea Foothills": { name: "Black Sea Foothills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Caspian Depression": { name: "Caspian Depression", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND }
        },
        "Eastern Desert and Red Sea": {
            "Eastern Desert Highlands": { name: "Eastern Desert Highlands", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Sudanese Red Sea": { name: "Sudanese Red Sea", climate: ClimateType.ARID, archetype: MapArchetype.BAY },
            "Wadi Hammamat": { name: "Wadi Hammamat", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Berenice Hinterland": { name: "Berenice Hinterland", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Suez Isthmus": { name: "Suez Isthmus", climate: ClimateType.ARID, archetype: MapArchetype.PENINSULA },
            "Gebel Elba Region": { name: "Gebel Elba Region", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND }
        }
    },
    "Sub Saharan Africa": {
        "Sahel": {
            "Timbuktu Basin": { name: "Timbuktu Basin", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Lake Chad": { name: "Lake Chad", climate: ClimateType.ARID, archetype: MapArchetype.FRESHWATER_LAKE },
            "Niger Bend": { name: "Niger Bend", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT },
            "Gao Region": { name: "Gao Region", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Sahelian Scrublands": { name: "Sahelian Scrublands", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Dogon Plateau": { name: "Dogon Plateau", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND }
        },
        "Upper Guinea": {
            "Fouta Djallon Highlands": { name: "Fouta Djallon Highlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Sierra Leone Coast": { name: "Sierra Leone Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Gambia River Basin": { name: "Gambia River Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Ashanti Forest": { name: "Ashanti Forest", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Bissagos Islands": { name: "Bissagos Islands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Gold Coast Savanna": { name: "Gold Coast Savanna", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND }
        },
        "Lower Guinea and Congo Basin": {
            "Cross River Delta": { name: "Cross River Delta", climate: ClimateType.TROPICAL, archetype: MapArchetype.DELTA },
            "Bantu Uplands": { name: "Bantu Uplands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Kinshasa Hinterland": { name: "Kinshasa Hinterland", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Ituri Rainforest": { name: "Ituri Rainforest", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Congo River Bend": { name: "Congo River Bend", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Kongo Coast": { name: "Kongo Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY }
        },
        "Horn of Africa": {
            "Ethiopian Highlands": { name: "Ethiopian Highlands", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Danakil Depression": { name: "Danakil Depression", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Rift Valley Lakes": { name: "Rift Valley Lakes", climate: ClimateType.ARID, archetype: MapArchetype.FRESHWATER_LAKE },
            "Harar Plateau": { name: "Harar Plateau", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Red Sea Shore": { name: "Red Sea Shore", climate: ClimateType.ARID, archetype: MapArchetype.BAY },
            "Somali Steppe": { name: "Somali Steppe", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND }
        },
        "East African Rift": {
            "Serengeti Plain": { name: "Serengeti Plain", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Mount Kilimanjaro Foothills": { name: "Mount Kilimanjaro Foothills", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Lake Victoria Basin": { name: "Lake Victoria Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.FRESHWATER_LAKE },
            "Great Rift Escarpment": { name: "Great Rift Escarpment", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Olduvai Gorge": { name: "Olduvai Gorge", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Mara River Valley": { name: "Mara River Valley", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT }
        },
        "Southern Africa": {
            "Drakensberg Mountains": { name: "Drakensberg Mountains", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Kalahari Basin": { name: "Kalahari Basin", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Karoo Plateau": { name: "Karoo Plateau", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Cape Coast": { name: "Cape Coast", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Limpopo Valley": { name: "Limpopo Valley", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Zambezi Floodplain": { name: "Zambezi Floodplain", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.DELTA }
        },
        "Central Africa": {
            "Ubangi Basin": { name: "Ubangi Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Equatorial Rainforest": { name: "Equatorial Rainforest", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Bangui Highlands": { name: "Bangui Highlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Lake Tanganyika Shore": { name: "Lake Tanganyika Shore", climate: ClimateType.TROPICAL, archetype: MapArchetype.FRESHWATER_LAKE },
            "Bateke Plateau": { name: "Bateke Plateau", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Lualaba Headwaters": { name: "Lualaba Headwaters", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT }
        },
        "West African Forests": {
            "Ibo Plateau": { name: "Ibo Plateau", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Niger Delta": { name: "Niger Delta", climate: ClimateType.TROPICAL, archetype: MapArchetype.DELTA },
            "Benin Lowlands": { name: "Benin Lowlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Oyo Hinterland": { name: "Oyo Hinterland", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Jos Plateau": { name: "Jos Plateau", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Ogun River Basin": { name: "Ogun River Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT }
        },
        "Madagascar and Islands": {
            "Highlands of Madagascar": { name: "Highlands of Madagascar", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Antananarivo Region": { name: "Antananarivo Region", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Mozambique Channel Coast": { name: "Mozambique Channel Coast", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.BAY },
            "Comoros Archipelago": { name: "Comoros Archipelago", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Mascarene Islands": { name: "Mascarene Islands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Mahafaly Plateau": { name: "Mahafaly Plateau", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND }
        }
    },
    "South Asia": {
        "Indus Valley": {
            "Harappa Basin": { name: "Harappa Basin", climate: ClimateType.ARID, archetype: MapArchetype.RIVER_PORT },
            "Punjab Plains": { name: "Punjab Plains", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Thar Desert Margin": { name: "Thar Desert Margin", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Sindh River Delta": { name: "Sindh River Delta", climate: ClimateType.ARID, archetype: MapArchetype.DELTA },
            "Salt Range Foothills": { name: "Salt Range Foothills", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Rann of Kutch": { name: "Rann of Kutch", climate: ClimateType.ARID, archetype: MapArchetype.DELTA }
        },
        "Gangetic Plain": {
            "Varanasi Basin": { name: "Varanasi Basin", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Allahabad Confluence": { name: "Allahabad Confluence", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Patna Lowlands": { name: "Patna Lowlands", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Delhi Region": { name: "Delhi Region", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Awadh Plains": { name: "Awadh Plains", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Bengal Delta": { name: "Bengal Delta", climate: ClimateType.TROPICAL, archetype: MapArchetype.DELTA }
        },
        "Deccan Plateau": {
            "Hyderabad Highlands": { name: "Hyderabad Highlands", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Western Ghats": { name: "Western Ghats", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Malabar Coast": { name: "Malabar Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Coromandel Coast": { name: "Coromandel Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Karnataka Plateau": { name: "Karnataka Plateau", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Eastern Ghats": { name: "Eastern Ghats", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND }
        },
        "Himalayas and Northeast": {
            "Kashmir Valley": { name: "Kashmir Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Sikkim Highlands": { name: "Sikkim Highlands", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Brahmaputra Valley": { name: "Brahmaputra Valley", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Darjeeling Hills": { name: "Darjeeling Hills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Assam Plains": { name: "Assam Plains", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Naga Hills": { name: "Naga Hills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND }
        },
        "Central India": {
            "Malwa Plateau": { name: "Malwa Plateau", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Vindhya Range": { name: "Vindhya Range", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Chota Nagpur Plateau": { name: "Chota Nagpur Plateau", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Narmada Valley": { name: "Narmada Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Gondwana Forests": { name: "Gondwana Forests", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Satpura Range": { name: "Satpura Range", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND }
        },
        "Sri Lanka": {
            "Central Highlands": { name: "Central Highlands", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Jaffna Peninsula": { name: "Jaffna Peninsula", climate: ClimateType.TROPICAL, archetype: MapArchetype.PENINSULA },
            "Anuradhapura Basin": { name: "Anuradhapura Basin", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Kandy Plateau": { name: "Kandy Plateau", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Galle Coast": { name: "Galle Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Trincomalee Harbor": { name: "Trincomalee Harbor", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY }
        },
        "Mainland Southeast Asia": {
            "Irrawaddy Valley": { name: "Irrawaddy Valley", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Mekong Delta": { name: "Mekong Delta", climate: ClimateType.TROPICAL, archetype: MapArchetype.DELTA },
            "Red River Delta": { name: "Red River Delta", climate: ClimateType.TROPICAL, archetype: MapArchetype.DELTA },
            "Annam Highlands": { name: "Annam Highlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Mekong River Basin": { name: "Mekong River Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Tenasserim Coast": { name: "Tenasserim Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Malay Peninsula": { name: "Malay Peninsula", climate: ClimateType.TROPICAL, archetype: MapArchetype.PENINSULA }
        },
        "Maritime Southeast Asia": {
            "Strait of Malacca": { name: "Strait of Malacca", climate: ClimateType.TROPICAL, archetype: MapArchetype.STRAITS },
            "Sumatra Highlands": { name: "Sumatra Highlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Java Sea": { name: "Java Sea", climate: ClimateType.TROPICAL, archetype: MapArchetype.SHOALS },
            "Central Java": { name: "Central Java", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Sunda Strait": { name: "Sunda Strait", climate: ClimateType.TROPICAL, archetype: MapArchetype.STRAITS },
            "Makassar Strait": { name: "Makassar Strait", climate: ClimateType.TROPICAL, archetype: MapArchetype.STRAITS },
            "Spice Islands": { name: "Spice Islands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Celebes Sea": { name: "Celebes Sea", climate: ClimateType.TROPICAL, archetype: MapArchetype.SHOALS },
            "Banda Sea": { name: "Banda Sea", climate: ClimateType.TROPICAL, archetype: MapArchetype.SHOALS },
            "Timor Sea": { name: "Timor Sea", climate: ClimateType.TROPICAL, archetype: MapArchetype.SHOALS }
        },
        "Philippines and Taiwan Strait": {
            "Philippine Archipelago": { name: "Philippine Archipelago", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Taiwan Strait": { name: "Taiwan Strait", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.STRAITS }
        }
    },
    "East Asia": {
        "Siberia": {
            "Western Siberia": { name: "Western Siberia", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Central Siberia": { name: "Central Siberia", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Eastern Siberia": { name: "Eastern Siberia", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Arctic Siberia": { name: "Arctic Siberia", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Kamchatka Peninsula": { name: "Kamchatka Peninsula", climate: ClimateType.COLD, archetype: MapArchetype.PENINSULA },
            "Sakhalin Island": { name: "Sakhalin Island", climate: ClimateType.COLD, archetype: MapArchetype.ISLAND }
        },
        "Kazakh Steppes": {
            "Kazakh Steppes": { name: "Kazakh Steppes", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Altai Mountains": { name: "Altai Mountains", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Aral Sea Basin": { name: "Aral Sea Basin", climate: ClimateType.ARID, archetype: MapArchetype.FRESHWATER_LAKE },
            "Tian Shan Range": { name: "Tian Shan Range", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Dzungarian Basin": { name: "Dzungarian Basin", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND }
        },
        "Central Asian Oases": {
            "Kyzylkum Desert": { name: "Kyzylkum Desert", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Ferghana Valley": { name: "Ferghana Valley", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Samarkand Region": { name: "Samarkand Region", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Balkh Plains": { name: "Balkh Plains", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Pamir Mountains": { name: "Pamir Mountains", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Hindu Kush": { name: "Hindu Kush", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND }
        },
        "Xinjiang": {
            "Tarim Basin": { name: "Tarim Basin", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Kunlun Mountains": { name: "Kunlun Mountains", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Qaidam Basin": { name: "Qaidam Basin", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND }
        },
        "Mongolia and Manchuria": {
            "Mongolian Steppes": { name: "Mongolian Steppes", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Gobi Desert": { name: "Gobi Desert", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Manchurian Plain": { name: "Manchurian Plain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND }
        },
        "North China Plain": {
            "Yellow River Valley": { name: "Yellow River Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Shandong Peninsula": { name: "Shandong Peninsula", climate: ClimateType.TEMPERATE, archetype: MapArchetype.PENINSULA },
            "Loess Plateau": { name: "Loess Plateau", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Beijing Basin": { name: "Beijing Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Taihang Mountains": { name: "Taihang Mountains", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Hebei Plain": { name: "Hebei Plain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND }
        },
        "South China": {
            "Pearl River Delta": { name: "Pearl River Delta", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.DELTA },
            "Fujian Coast": { name: "Fujian Coast", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.BAY },
            "Guangxi Highlands": { name: "Guangxi Highlands", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Yangtze Gorges": { name: "Yangtze Gorges", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Hainan Island": { name: "Hainan Island", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Wuyi Mountains": { name: "Wuyi Mountains", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND }
        },
        "West China and Tibet": {
            "Sichuan Basin": { name: "Sichuan Basin", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Yunnan Plateau": { name: "Yunnan Plateau", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Tibetan Plateau": { name: "Tibetan Plateau", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Himalayan Slopes": { name: "Himalayan Slopes", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Kailash Region": { name: "Kailash Region", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Eastern Plateau Slopes": { name: "Eastern Plateau Slopes", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND }
        },
        "Japan": {
            "Kyoto Basin": { name: "Kyoto Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Edo Plain": { name: "Edo Plain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Inland Sea Coast": { name: "Inland Sea Coast", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Mount Fuji Region": { name: "Mount Fuji Region", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Tohoku Hills": { name: "Tohoku Hills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Nara Uplands": { name: "Nara Uplands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND }
        },
        "Korea": {
            "Han River Valley": { name: "Han River Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Kaesong Foothills": { name: "Kaesong Foothills", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Gyeongju Basin": { name: "Gyeongju Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Jeolla Highlands": { name: "Jeolla Highlands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Baekdu Mountain Zone": { name: "Baekdu Mountain Zone", climate: ClimateType.COLD, archetype: MapArchetype.ALL_LAND },
            "Busan Coast": { name: "Busan Coast", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY }
        },
        "Taiwan and Ryukyu": {
            "Central Mountains": { name: "Central Mountains", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Taipei Basin": { name: "Taipei Basin", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "East Coast Rift": { name: "East Coast Rift", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND },
            "Ryukyu Islands": { name: "Ryukyu Islands", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ISLAND },
            "Kenting Peninsula": { name: "Kenting Peninsula", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.PENINSULA },
            "Taitung Highlands": { name: "Taitung Highlands", climate: ClimateType.SEMITROPICAL, archetype: MapArchetype.ALL_LAND }
        }
    },
    "Oceania": {
        "Australia – Southeast": {
            "Sydney Basin": { name: "Sydney Basin", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Blue Mountains": { name: "Blue Mountains", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Gippsland": { name: "Gippsland", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Murray River Valley": { name: "Murray River Valley", climate: ClimateType.TEMPERATE, archetype: MapArchetype.RIVER_PORT },
            "Victorian Alps": { name: "Victorian Alps", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Snowy Mountains": { name: "Snowy Mountains", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND }
        },
        "Australia – Outback and Center": {
            "Alice Springs Basin": { name: "Alice Springs Basin", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "MacDonnell Ranges": { name: "MacDonnell Ranges", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Lake Eyre Basin": { name: "Lake Eyre Basin", climate: ClimateType.ARID, archetype: MapArchetype.FRESHWATER_LAKE },
            "Simpson Desert": { name: "Simpson Desert", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Uluru Region": { name: "Uluru Region", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Barkly Tableland": { name: "Barkly Tableland", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND }
        },
        "Australia – North and Queensland": {
            "Cape York Peninsula": { name: "Cape York Peninsula", climate: ClimateType.TROPICAL, archetype: MapArchetype.PENINSULA },
            "Great Barrier Reef Coast": { name: "Great Barrier Reef Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Daintree Rainforest": { name: "Daintree Rainforest", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Gulf of Carpentaria": { name: "Gulf of Carpentaria", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Arnhem Land": { name: "Arnhem Land", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Torres Strait": { name: "Torres Strait", climate: ClimateType.TROPICAL, archetype: MapArchetype.STRAITS }
        },
        "Australia – West and Desert": {
            "Pilbara": { name: "Pilbara", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Kimberley": { name: "Kimberley", climate: ClimateType.ARID, archetype: MapArchetype.BAY },
            "Great Sandy Desert": { name: "Great Sandy Desert", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Nullarbor Plain": { name: "Nullarbor Plain", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND },
            "Swan Coastal Plain": { name: "Swan Coastal Plain", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Goldfields Region": { name: "Goldfields Region", climate: ClimateType.ARID, archetype: MapArchetype.ALL_LAND }
        },
        "New Zealand": {
            "Canterbury Plains": { name: "Canterbury Plains", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Southern Alps": { name: "Southern Alps", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Rotorua Volcanic Zone": { name: "Rotorua Volcanic Zone", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Hawke's Bay": { name: "Hawke's Bay", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY },
            "Otago Highlands": { name: "Otago Highlands", climate: ClimateType.TEMPERATE, archetype: MapArchetype.ALL_LAND },
            "Wellington Coast": { name: "Wellington Coast", climate: ClimateType.TEMPERATE, archetype: MapArchetype.BAY }
        },
        "New Guinea and Melanesia": {
            "Sepik River Basin": { name: "Sepik River Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.RIVER_PORT },
            "Highlands of Papua": { name: "Highlands of Papua", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Bismarck Archipelago": { name: "Bismarck Archipelago", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Solomon Islands Chain": { name: "Solomon Islands Chain", climate: ClimateType.TROPICAL, archetype: MapArchetype.ISLAND },
            "Coral Sea Coast": { name: "Coral Sea Coast", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Kokoda Plateau": { name: "Kokoda Plateau", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND }
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
            "Big Island Highlands": { name: "Big Island Highlands", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Maui Slopes": { name: "Maui Slopes", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Oahu Basin": { name: "Oahu Basin", climate: ClimateType.TROPICAL, archetype: MapArchetype.BAY },
            "Volcanoes National Park": { name: "Volcanoes National Park", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Kauai Valleys": { name: "Kauai Valleys", climate: ClimateType.TROPICAL, archetype: MapArchetype.ALL_LAND },
            "Molokai Channel": { name: "Molokai Channel", climate: ClimateType.TROPICAL, archetype: MapArchetype.STRAITS }
        }
    }
};