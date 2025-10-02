/**
 * HexWorldGlobe - 3D globe visualization with regional geography
 * Using D3 + TopoJSON for accurate world map rendering (same approach as CityMapGlobe)
 * Enhanced with beautiful typography, visual effects, and region/area toggle
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { buildRegionalMap, RegionHex, getRegionAreas } from '../utils/regionalGeography';
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';
import { FACTION_DATA } from '../constants/gameData/factions';
import { X, Globe, Info, ZoomIn, ZoomOut, RotateCcw, Search, Map, MapPin, Users } from 'lucide-react';

interface HexWorldGlobeProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MapAreaPoint {
  name: string;
  region: string;
  zone: string;
  lat: number;
  lng: number;
  climate: string;
}

// Map area coordinates lookup (from CityMapGlobe REGION_COORDINATES)
const AREA_COORDINATES: Record<string, [number, number]> = {
  // Europe - Western
  'London': [-0.1276, 51.5074],
  'Thames Estuary': [-0.1276, 51.5074],
  'Paris Basin': [2.3522, 48.8566],
  'Loire Valley': [-0.5, 47.5],
  'Marseille Coast': [5.3698, 43.2965],
  'Rome': [12.4964, 41.9028],
  'Roman Campagna': [12.4964, 41.9028],
  'Rhine Valley': [7.5886, 50.1109],
  'Rhine–Meuse Delta': [4.4, 51.9],
  'Iberian Peninsula': [-3.7038, 40.4168],
  'Andalusian Plain': [-5.98, 37.39],
  'Lisbon Coast': [-9.14, 38.72],
  'Toledo Plateau': [-4.03, 39.86],
  'Edinburgh': [-3.19, 55.95],
  'British Isles': [-3.44, 53.41],
  'Leinster Plain': [-6.26, 53.35],
  'York': [-1.08, 53.96],
  'Hadrian\'s Wall': [-2.3, 55.0],
  'Oxfordshire': [-1.26, 51.75],
  'Cliffs of Dover': [1.32, 51.13],
  'Pyrenees Foothills': [1.0, 42.5],
  'Normandy': [-0.5, 49.3],
  'Languedoc': [3.0, 43.5],
  'Ebro Valley': [-0.9, 41.6],
  'Catalonian Hills': [2.17, 41.6],
  'Galicia': [-8.55, 42.88],
  'Venetian Lagoon': [12.34, 45.44],
  'Apennine Foothills': [13.0, 42.5],
  'Bay of Naples': [14.26, 40.85],
  'Florence Hills': [11.26, 43.77],
  'Po Valley': [11.0, 45.0],
  'Black Forest': [8.15, 48.5],
  'Brandenburg Plain': [13.41, 52.52],
  'Hamburg Coast': [9.99, 53.55],
  'Bavarian Highlands': [11.5, 48.0],
  'Saxon Uplands': [13.5, 51.0],
  'Danube Bend': [19.04, 47.79],
  'Bohemian Plateau': [14.44, 50.08],
  'Carpathian Foothills': [22.0, 48.0],
  'Vienna Basin': [16.37, 48.21],
  'Moravian Gate': [18.0, 49.5],
  'Tatra Mountains': [20.0, 49.2],
  'Dinaric Alps': [16.0, 44.0],
  'Bosporus': [29.0, 41.0],
  'Pindus Mountains': [21.0, 40.0],
  'Thracian Plain': [26.0, 41.5],
  'Dalmatian Coast': [16.44, 43.51],
  'Vardar Valley': [22.0, 41.5],
  'Stockholm Archipelago': [18.07, 59.33],
  'Norwegian Fjords': [6.0, 61.0],
  'Jutland Peninsula': [9.5, 56.0],
  'Lapland': [25.0, 68.0],
  'Gotland': [18.5, 57.5],
  'Øresund Strait': [12.68, 55.68],
  'Moscow Basin': [37.62, 55.75],
  'Dnieper River Valley': [30.52, 50.45],
  'Volga Bend': [44.5, 48.71],
  'Carpathian Ridge': [25.0, 47.0],
  'Steppe Borderlands': [35.0, 48.0],
  'Novgorod Woods': [31.28, 58.52],
  'Ural Mountains': [60.0, 60.0],
  'White Sea Coast': [40.0, 66.0],
  'Flanders Fields': [3.13, 50.82],
  'Zuiderzee Coast': [5.38, 52.63],
  'Brabant Highlands': [5.0, 51.5],
  'Ardennes Forest': [5.5, 50.0],
  'Scheldt Basin': [4.35, 51.22],
  'Athens Basin': [23.73, 37.98],
  'Peloponnesian Hills': [22.0, 37.5],
  'Crete': [25.13, 35.31],
  'Delos Archipelago': [25.3, 37.4],
  'Mount Olympus': [22.35, 40.08],
  'Thessalian Plain': [22.0, 39.5],

  // North America
  'Columbia River Valley': [-118.0, 46.0],
  'Puget Sound': [-122.33, 47.6],
  'Olympic Peninsula': [-124.0, 47.8],
  'Redwood Coast': [-124.0, 41.0],
  'Shasta Region': [-122.3, 41.3],
  'Cascade Range': [-121.5, 44.0],
  'San Francisco Bay': [-122.42, 37.77],
  'Marin Headlands': [-122.5, 37.85],
  'Sacramento Valley': [-121.5, 38.6],
  'Sierra Nevada Foothills': [-120.8, 38.5],
  'Napa Valley': [-122.3, 38.5],
  'Pacific Coast Ranges': [-123.0, 40.0],
  'Monterey Bay': [-121.89, 36.62],
  'Santa Cruz Mountains': [-122.0, 37.2],
  'Salinas Valley': [-121.3, 36.5],
  'Big Sur Coast': [-121.8, 36.2],
  'San Luis Obispo': [-120.66, 35.28],
  'Santa Barbara Channel': [-119.7, 34.4],
  'Los Angeles Basin': [-118.24, 34.05],
  'Channel Islands': [-119.8, 34.0],
  'San Diego Bay': [-117.16, 32.72],
  'Mojave Desert': [-116.0, 35.0],
  'Central Valley': [-121.0, 36.7],
  'Sonoran Desert': [-113.0, 32.0],
  'Chaco Canyon': [-107.95, 36.06],
  'Rio Grande Valley': [-106.5, 34.0],
  'Colorado Plateau': [-111.0, 37.0],
  'Rocky Mountains': [-105.5, 40.0],
  'Ancestral Puebloan Lands': [-109.0, 36.5],
  'Mogollon Rim': [-111.0, 34.5],
  'Black Hills': [-103.5, 44.0],
  'Platte River Basin': [-100.0, 41.0],
  'Flint Hills': [-96.5, 38.5],
  'Badlands': [-102.5, 43.5],
  'Tallgrass Prairie': [-96.0, 38.0],
  'Missouri Breaks': [-108.0, 47.5],
  'Texas Hill Country': [-99.0, 30.0],
  'Llano Estacado': [-102.0, 34.0],
  'Gulf Coast Texas': [-95.37, 29.76],
  'Cahokia Mounds': [-90.06, 38.66],
  'Lower Mississippi Delta': [-90.08, 29.95],
  'Ozark Plateau': [-92.5, 36.5],
  'Natchez Bluffs': [-91.4, 31.55],
  'Illinois River Valley': [-90.0, 40.0],
  'Driftless Area': [-90.5, 43.0],

  // North America - Additional Eastern Areas
  'Hudson River Valley': [-73.9, 42.3],
  'Great Lakes Shoreline': [-83.0, 44.0],
  'Adirondacks': [-74.2, 43.9],
  'Finger Lakes': [-76.9, 42.6],
  'Champlain Valley': [-73.3, 44.5],
  'Mohawk River': [-74.7, 43.0],
  'Long Island': [-73.0, 40.8],
  'Cape Cod': [-70.0, 41.7],
  'Green Mountains': [-72.8, 44.0],
  'Connecticut River Valley': [-72.6, 42.0],
  'Smoky Mountains': [-83.5, 35.6],
  'Okefenokee Swamp': [-82.3, 30.7],
  'Piedmont Uplands': [-78.9, 35.0],
  'Everglades': [-80.9, 25.3],
  'Mississippi Bayou': [-90.7, 29.6],
  'Blue Ridge Foothills': [-82.0, 36.0],
  'Outer Banks': [-75.7, 35.5],
  'Chesapeake Bay': [-76.1, 37.5],
  'Cape Cod': [-70.0, 41.7],
  'Boston Harbor': [-71.0, 42.4],
  'Pine Barrens': [-74.5, 39.9],
  'Delaware River Valley': [-75.2, 40.0],
  'Tidewater Region': [-76.5, 37.0],
  'Virginia': [-78.7, 37.5],

  // North America - Northern Rockies
  'Bitterroot Range': [-114.2, 45.7],
  'Yellowstone Basin': [-110.5, 44.6],
  'Snake River Plain': [-114.5, 43.0],
  'Glacier Foothills': [-113.5, 48.7],
  'Salmon River Canyons': [-116.0, 45.3],
  'Absaroka Range': [-109.5, 44.5],

  // North America - Canada
  'Florida Keys': [-81.0, 24.7],
  'St. Lawrence River': [-71.0, 47.0],
  'Canadian Maritimes': [-63.0, 46.0],
  'Ontario Shield': [-81.0, 49.0],
  'Canadian Prairies': [-106.0, 52.0],
  'Canadian Rockies': [-117.0, 52.0],
  'British Columbia Coast': [-127.0, 52.0],
  'Canadian North': [-105.0, 65.0],
  'Hudson Bay Lowlands': [-85.0, 55.0],
  'Hudson Bay': [-85.0, 60.0],
  'Bering Strait': [-169.0, 65.5],
  'Yukon River Valley': [-140.0, 64.0],
  'Labrador Coast': [-60.0, 54.0],
  'Mackenzie Delta': [-134.0, 69.0],
  'Aleutian Islands': [-175.0, 52.0],
  'Newfoundland Grand Banks': [-50.0, 45.5],
  'Lake Superior Basin': [-88.0, 47.5],

  // North America - Mexico and Central America
  'Valley of Mexico': [-99.1, 19.4],
  'Oaxaca Highlands': [-96.7, 17.1],
  'Yucatán Peninsula': [-89.0, 20.0],
  'Sierra Madre Oriental': [-100.0, 24.0],
  'Isthmus of Tehuantepec': [-95.0, 16.5],
  'Lake Texcoco Basin': [-99.0, 19.5],
  'Baja California': [-113.0, 28.0],
  'Sinaloa Coast': [-107.4, 25.0],
  'Mayan Lowlands': [-90.0, 17.5],
  'Mosquito Coast': [-84.0, 14.0],
  'Panama Isthmus': [-80.0, 9.0],
  'Darien Swamp': [-77.5, 8.0],

  // North America - Caribbean
  'Greater Antilles': [-75.0, 20.0],
  'Lesser Antilles': [-61.0, 15.0],
  'Gulf of Mexico': [-90.0, 25.0],
  'Caribbean Sea': [-75.0, 15.0],

  // Europe - British Isles
  'Irish Sea': [-4.5, 53.5],
  'North Sea': [4.0, 56.0],
  'English Channel': [-1.0, 50.0],
  'Oxfordshire': [-1.26, 51.75],
  'Cliffs of Dover': [1.32, 51.13],

  // Europe - France (additional)
  'Bay of Biscay': [-3.0, 45.0],

  // Europe - Iberian Peninsula (additional)
  'Strait of Gibraltar': [-5.4, 36.0],

  // Europe - Italy (additional)
  'Tyrrhenian Sea': [12.0, 40.0],
  'Adriatic Sea': [15.0, 43.0],

  // Europe - Greece (additional)
  'Aegean Sea': [25.0, 38.0],
  'Western Mediterranean': [3.0, 38.0],
  'Eastern Mediterranean': [30.0, 34.0],

  // Europe - Scandinavia (additional)
  'Baltic Sea': [18.0, 58.0],
  'Iceland': [-18.0, 65.0],
  'Greenland Coast': [-42.0, 72.0],
  'Azores': [-28.0, 38.5],
  'Cape Verde': [-24.0, 16.0],

  // South America - Andes North
  'Quito Plateau': [-78.5, -0.2],
  'Cajamarca Highlands': [-78.5, -7.2],
  'Lake Titicaca Basin': [-69.0, -16.0],
  'Chimborazo Slopes': [-78.8, -1.5],
  'Cordillera Blanca': [-77.5, -9.0],
  'Chachapoyas Forest': [-77.9, -6.2],

  // South America - Andes South
  'Cuzco Valley': [-71.97, -13.53],
  'Altiplano': [-68.0, -18.0],
  'Atacama Desert': [-69.5, -23.5],
  'Mendoza Foothills': [-68.8, -33.0],
  'Aconcagua Range': [-70.0, -32.7],
  'Mapuche Territory': [-72.0, -38.5],

  // South America - Amazon Basin
  'Amazon Delta': [-50.5, -1.5],
  'Manaus Region': [-60.0, -3.1],
  'Rio Negro Junction': [-61.0, -3.0],
  'Xingu Headwaters': [-53.0, -7.0],
  'Acre Rainforest': [-70.0, -9.0],
  'Varzea Floodplains': [-58.0, -3.5],
  'Tapajós Basin': [-55.0, -4.0],

  // South America - Gran Chaco and Pampas
  'Pampas Grasslands': [-60.0, -34.5],
  'Paraná Delta': [-58.5, -34.2],
  'Santa Fe Floodplain': [-60.7, -31.6],
  'Gran Chaco': [-61.0, -24.0],
  'Pantanal': [-57.0, -17.5],
  'Córdoba Hills': [-64.2, -31.4],
  'Uruguay River Valley': [-57.0, -32.5],

  // South America - Southern Highlands
  'Rio de Janeiro Bay': [-43.2, -22.9],
  'Bahia Coast': [-38.5, -13.0],
  'Pernambuco Highlands': [-35.9, -8.3],
  'São Paulo Plateau': [-46.6, -23.5],
  'Recôncavo Basin': [-38.5, -12.7],
  'Espírito Santo Shore': [-40.3, -19.6],
  'Potosí Region': [-65.8, -19.6],
  'Tarija Valley': [-64.7, -21.5],
  'Cochabamba Basin': [-66.2, -17.4],
  'Santa Cruz Lowlands': [-63.2, -17.8],

  // South America - Guiana Shield
  'Orinoco Delta': [-60.0, 9.0],
  'Guiana Highlands': [-61.0, 5.5],
  'Essequibo Valley': [-58.5, 6.0],
  'Maroni Basin': [-54.0, 4.5],
  'Rupununi Savannah': [-59.0, 3.0],
  'Kaieteur Plateau': [-59.5, 5.2],
  'Guyana Highlands': [-61.5, 5.0],
  'Pantanal Wetlands': [-57.0, -17.0],
  'Maracaibo Basin': [-71.5, 9.8],

  // South America - Patagonia
  'Valdés Peninsula': [-64.3, -42.5],
  'Andean Foothills': [-71.0, -45.0],
  'Magellanic Steppe': [-69.0, -50.0],
  'Tierra del Fuego': [-68.5, -54.5],
  'Strait of Magellan': [-70.5, -53.5],
  'Southern Ice Fields': [-73.0, -49.5],

  // South America - Llanos and Orinoco
  'Apure Plains': [-69.0, 7.5],
  'Meta River Basin': [-71.0, 4.0],

  // Sub-Saharan Africa - Sahel
  'Timbuktu Basin': [-3.0, 16.8],
  'Lake Chad': [14.5, 13.0],
  'Niger Bend': [-2.0, 16.5],
  'Gao Region': [-0.5, 16.3],
  'Sahelian Scrublands': [8.0, 14.0],
  'Dogon Plateau': [-3.5, 14.3],

  // Sub-Saharan Africa - Upper Guinea
  'Fouta Djallon Highlands': [-11.5, 10.5],
  'Sierra Leone Coast': [-13.2, 8.5],
  'Gambia River Basin': [-15.3, 13.4],
  'Ashanti Forest': [-1.5, 6.7],
  'Bissagos Islands': [-16.0, 11.3],
  'Gold Coast Savanna': [-1.2, 7.5],

  // Sub-Saharan Africa - West African Forests
  'Lagos Coastal Belt': [3.4, 6.5],
  'Ivory Coast': [-5.5, 7.5],
  'Cross River Delta': [8.3, 4.8],
  'Niger Delta': [6.0, 5.0],
  'Benin Lowlands': [2.3, 6.5],
  'Oyo Hinterland': [4.0, 8.0],
  'Jos Plateau': [8.9, 9.9],
  'Ogun River Basin': [3.5, 7.2],

  // Sub-Saharan Africa - Lower Guinea and Congo Basin
  'Bantu Uplands': [15.0, -2.0],
  'Kinshasa Hinterland': [15.3, -4.3],
  'Ituri Rainforest': [28.0, 1.5],
  'Congo River Bend': [18.3, -2.9],
  'Kongo Coast': [12.5, -5.5],

  // Sub-Saharan Africa - Central Africa
  'Ubangi Basin': [20.0, 4.0],
  'Equatorial Rainforest': [22.0, 0.5],
  'Bangui Highlands': [18.6, 4.4],
  'Lake Tanganyika Shore': [29.3, -6.0],
  'Bateke Plateau': [15.8, -2.5],
  'Lualaba Headwaters': [26.0, -8.0],
  'Rwanda Burundi Highlands': [29.5, -2.5],
  'Okavango Delta': [22.5, -19.0],
  'Ibo Plateau': [17.0, 3.0],

  // Sub-Saharan Africa - East African Rift
  'Serengeti Plain': [34.8, -2.3],
  'Mount Kilimanjaro Foothills': [37.3, -3.1],
  'Lake Victoria Basin': [33.0, -1.0],
  'Great Rift Escarpment': [36.0, -3.5],
  'Olduvai Gorge': [35.3, -3.0],
  'Mara River Valley': [35.0, -1.5],
  'Swahili Coast': [39.7, -6.8],

  // Sub-Saharan Africa - Horn of Africa
  'Ethiopian Highlands': [38.7, 9.0],
  'Danakil Depression': [40.3, 14.2],
  'Rift Valley Lakes': [38.5, 7.5],
  'Harar Plateau': [42.1, 9.3],
  'Red Sea Shore': [42.0, 12.0],
  'Somali Steppe': [45.0, 6.0],

  // Sub-Saharan Africa - Southern Africa
  'Drakensberg Mountains': [29.0, -29.5],
  'Kalahari Basin': [23.0, -23.0],
  'Karoo Plateau': [22.0, -32.0],
  'Cape Coast': [18.4, -34.0],
  'Limpopo Valley': [29.5, -23.5],
  'Zambezi Floodplain': [25.5, -17.5],

  // Sub-Saharan Africa - Madagascar and Islands
  'Highlands of Madagascar': [47.5, -19.0],
  'Antananarivo Region': [47.5, -18.9],
  'Mozambique Channel Coast': [44.5, -23.0],
  'Comoros Archipelago': [43.4, -11.6],
  'Mascarene Islands': [57.5, -20.3],
  'Mahafaly Plateau': [44.5, -24.0],

  // South Asia - Indus Valley
  'Harappa Basin': [72.9, 30.6],
  'Punjab Plains': [74.0, 31.0],
  'Thar Desert Margin': [72.0, 27.0],
  'Sindh River Delta': [68.0, 24.8],
  'Salt Range Foothills': [73.0, 32.6],
  'Rann of Kutch': [70.5, 23.8],

  // South Asia - Gangetic Plain
  'Varanasi Basin': [83.0, 25.3],
  'Allahabad Confluence': [81.8, 25.4],
  'Patna Lowlands': [85.1, 25.6],
  'Delhi Region': [77.2, 28.6],
  'Awadh Plains': [81.0, 26.8],
  'Bengal Delta': [90.4, 23.7],
  'Sundarbans Delta': [89.0, 22.0],

  // South Asia - Deccan Plateau
  'Hyderabad Highlands': [78.5, 17.4],
  'Western Ghats': [73.9, 15.5],
  'Malabar Coast': [75.8, 11.2],
  'Coromandel Coast': [80.3, 11.4],
  'Karnataka Plateau': [76.6, 14.5],
  'Eastern Ghats': [79.8, 16.0],

  // South Asia - Himalayas and Northeast
  'Kashmir Valley': [75.0, 34.1],
  'Sikkim Highlands': [88.6, 27.3],
  'Brahmaputra Valley': [91.7, 26.2],
  'Darjeeling Hills': [88.3, 27.0],
  'Assam Plains': [92.9, 26.2],
  'Naga Hills': [94.1, 25.7],

  // South Asia - Central India
  'Malwa Plateau': [76.0, 23.2],
  'Vindhya Range': [78.5, 24.5],
  'Chota Nagpur Plateau': [85.3, 23.3],
  'Narmada Valley': [76.5, 22.5],
  'Gondwana Forests': [80.0, 22.0],
  'Satpura Range': [77.8, 22.3],

  // South Asia - Sri Lanka
  'Central Highlands': [80.6, 7.3],
  'Jaffna Peninsula': [80.0, 9.7],
  'Anuradhapura Basin': [80.4, 8.3],
  'Kandy Plateau': [80.6, 7.3],
  'Galle Coast': [80.2, 6.0],
  'Trincomalee Harbor': [81.2, 8.6],

  // Southeast Asia - Mainland Southeast Asia
  'Irrawaddy Valley': [95.9, 21.9],
  'Mekong Delta': [105.8, 10.0],
  'Red River Delta': [106.0, 20.5],
  'Annam Highlands': [108.0, 16.0],
  'Mekong River Basin': [105.0, 14.0],
  'Tenasserim Coast': [98.6, 10.5],
  'Malay Peninsula': [100.5, 7.0],

  // Southeast Asia - Indochina Interior
  'Shan Plateau': [97.5, 21.0],
  'Annamite Cordillera': [107.0, 17.5],
  'Chao Phraya Basin': [100.5, 13.7],
  'Tonle Sap Basin': [104.0, 12.5],

  // Southeast Asia - Maritime Southeast Asia
  'Strait of Malacca': [100.0, 3.0],
  'Sumatra Highlands': [101.0, 0.5],
  'Java Sea': [110.0, -6.0],
  'West Java Coast': [106.8, -6.2],
  'Central Java': [110.0, -7.5],
  'East Java Coast': [113.0, -7.2],
  'Sunda Strait': [105.5, -6.0],
  'Borneo': [114.0, 1.0],
  'Makassar Strait': [118.0, -2.0],
  'Spice Islands': [127.5, -3.0],
  'Celebes Sea': [121.0, 3.0],
  'Banda Sea': [129.0, -5.0],
  'Timor Sea': [127.0, -11.0],

  // Southeast Asia - Philippines
  'Luzon Highlands': [121.0, 16.0],
  'Visayan Sea': [123.5, 11.0],
  'Mindanao': [125.0, 8.0],
  'Philippine Sea': [130.0, 15.0],
  'Palawan': [118.5, 9.5],
  'Sulu Sea': [120.5, 8.0],

  // East Asia - Taiwan and East China Sea
  'Taiwan Strait': [119.5, 24.5],
  'Ryukyu Islands': [127.0, 26.5],
  'East China Sea': [125.0, 29.0],
  'Central Mountains': [121.0, 23.8],
  'Taipei Basin': [121.5, 25.0],
  'East Coast Rift': [121.5, 23.5],
  'Kenting Peninsula': [120.8, 22.0],
  'Taitung Highlands': [121.0, 22.8],

  // East Asia - Siberia
  'Western Siberia': [75.0, 62.0],
  'Central Siberia': [100.0, 65.0],
  'Eastern Siberia': [130.0, 65.0],
  'Arctic Siberia': [110.0, 75.0],
  'Kamchatka Peninsula': [158.0, 56.0],
  'Sakhalin Island': [143.0, 51.0],

  // East Asia - Kazakh Steppes
  'Kazakh Steppes': [68.0, 50.0],
  'Altai Mountains': [88.0, 49.0],
  'Aral Sea Basin': [60.0, 45.0],
  'Tian Shan Range': [80.0, 42.0],
  'Dzungarian Basin': [87.0, 45.5],

  // East Asia - Central Asian Oases
  'Khorasan': [59.0, 36.0],
  'Transoxiana': [66.0, 40.0],
  'Kyzylkum Desert': [64.0, 43.0],
  'Ferghana Valley': [71.7, 40.4],
  'Samarkand Region': [66.9, 39.7],
  'Balkh Plains': [67.0, 36.8],
  'Pamir Mountains': [73.0, 38.5],
  'Hindu Kush': [70.0, 36.0],

  // East Asia - Xinjiang
  'Tarim Basin': [83.0, 40.0],
  'Kunlun Mountains': [81.0, 36.0],
  'Qaidam Basin': [95.0, 37.0],

  // East Asia - Mongolia and Manchuria
  'Mongolian Steppes': [105.0, 47.0],
  'Gobi Desert': [106.0, 43.0],
  'Manchurian Plain': [125.0, 44.0],

  // East Asia - North China Plain
  'Yellow River Valley': [112.0, 35.0],
  'Shandong Peninsula': [121.0, 37.0],
  'Loess Plateau': [108.0, 36.5],
  'Beijing Basin': [116.4, 39.9],
  'Taihang Mountains': [113.5, 37.5],
  'Hebei Plain': [116.0, 38.0],

  // East Asia - South China
  'Yangtze Delta': [121.5, 31.2],
  'Pearl River Delta': [113.3, 23.1],
  'Fujian Coast': [119.3, 26.1],
  'Guangxi Highlands': [108.0, 24.0],
  'Yangtze Gorges': [110.8, 30.8],
  'Hainan Island': [110.0, 19.2],
  'Wuyi Mountains': [118.0, 27.5],

  // East Asia - West China and Tibet
  'Sichuan Basin': [104.0, 30.5],
  'Yunnan Plateau': [101.0, 25.0],
  'Tibetan Plateau': [88.0, 32.0],
  'Himalayan Slopes': [85.0, 28.5],
  'Kailash Region': [81.0, 31.0],
  'Eastern Plateau Slopes': [100.0, 31.0],

  // East Asia - Japan
  'Kyoto Basin': [135.8, 35.0],
  'Edo Plain': [139.7, 35.7],
  'Inland Sea Coast': [133.5, 34.0],
  'Mount Fuji Region': [138.7, 35.4],
  'Tohoku Hills': [140.5, 39.0],
  'Nara Uplands': [135.8, 34.5],
  'Hokkaido': [143.0, 43.0],

  // East Asia - Korea
  'Han River Valley': [127.0, 37.5],
  'Kaesong Foothills': [126.6, 38.0],
  'Gyeongju Basin': [129.2, 35.8],
  'Jeolla Highlands': [127.0, 35.0],
  'Baekdu Mountain Zone': [128.0, 42.0],
  'Busan Coast': [129.1, 35.1],

  // Oceania - Australia Southeast
  'Sydney Basin': [151.2, -33.9],
  'Blue Mountains': [150.3, -33.7],
  'Gippsland': [147.0, -38.0],
  'Murray River Valley': [144.0, -34.5],
  'Victorian Alps': [147.0, -37.0],
  'Snowy Mountains': [148.3, -36.5],

  // Oceania - Australia Outback and Center
  'Alice Springs Basin': [133.9, -23.7],
  'MacDonnell Ranges': [133.3, -23.5],
  'Lake Eyre Basin': [137.4, -28.5],
  'Simpson Desert': [137.0, -25.0],
  'Uluru Region': [131.0, -25.3],
  'Barkly Tableland': [135.0, -19.5],

  // Oceania - Australia North and Queensland
  'Cape York Peninsula': [142.5, -14.0],
  'Great Barrier Reef Coast': [147.0, -19.0],
  'Daintree Rainforest': [145.4, -16.3],
  'Gulf of Carpentaria': [139.0, -15.5],
  'Arnhem Land': [133.0, -12.5],
  'Torres Strait': [142.2, -10.5],

  // Oceania - Australia West and Desert
  'Pilbara': [118.6, -22.0],
  'Kimberley': [125.5, -17.0],
  'Great Sandy Desert': [123.0, -21.0],
  'Nullarbor Plain': [130.0, -31.0],
  'Swan Coastal Plain': [115.9, -32.0],
  'Goldfields Region': [121.5, -30.8],

  // Oceania - New Zealand
  'Canterbury Plains': [171.5, -43.5],
  'Southern Alps': [170.0, -43.5],
  'Rotorua Volcanic Zone': [176.3, -38.1],
  'Hawke\'s Bay': [176.9, -39.5],
  'Otago Highlands': [169.4, -45.0],
  'Wellington Coast': [174.8, -41.3],

  // Oceania - New Guinea and Melanesia
  'Sepik River Basin': [143.6, -4.2],
  'Highlands of Papua': [143.9, -6.0],
  'Bismarck Archipelago': [150.0, -5.0],
  'Solomon Islands Chain': [160.0, -8.0],
  'Coral Sea Coast': [147.0, -9.0],
  'Kokoda Plateau': [147.7, -9.1],

  // Oceania - Polynesia
  'Society Islands': [-149.6, -17.5],
  'Marquesas': [-139.0, -9.0],
  'Tuamotu Atolls': [-145.0, -16.0],
  'Samoa Archipelago': [-172.0, -13.8],
  'Tonga Ridge': [-175.2, -21.2],
  'Rapa Nui': [-109.4, -27.1],

  // Oceania - Micronesia
  'Caroline Islands': [150.0, 7.0],
  'Marshall Islands': [171.0, 7.1],
  'Northern Mariana Chain': [145.7, 15.2],
  'Palau': [134.5, 7.5],
  'Yap Plateau': [138.1, 9.5],
  'Guam and Surroundings': [144.8, 13.4],

  // Oceania - Hawaii and Central Pacific
  'Big Island Highlands': [-155.5, 19.6],
  'Maui Slopes': [-156.3, 20.8],
  'Oahu Basin': [-157.9, 21.3],
  'Volcanoes National Park': [-155.3, 19.4],
  'Kauai Valleys': [-159.5, 22.0],
  'Molokai Channel': [-157.0, 21.1],

  // Oceania - Additional Islands
  'Sulawesi': [120.0, -2.0],
  'Andaman Islands': [92.7, 11.7],
  'Laccadive Islands': [73.0, 10.0],
  'Vanuatu': [167.0, -16.0],
  'New Caledonia': [165.6, -21.5],
  'Chatham Islands': [-176.5, -44.0],
  'Gilbert Islands': [173.0, 1.4],

  // More regions... (I'll add more as needed)
};

const HexWorldGlobe: React.FC<HexWorldGlobeProps> = ({ isOpen, onClose }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const worldDataRef = useRef<any>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionHex | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rotation, setRotation] = useState<[number, number, number]>([0, -20, 0]);
  const [scale, setScale] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<RegionHex | null>(null);
  const [hoveredArea, setHoveredArea] = useState<MapAreaPoint | null>(null);
  const [hoveredFaction, setHoveredFaction] = useState<{name: string; factionName: string; zone: string; lng: number; lat: number; x: number; y: number} | null>(null);
  const [displayMode, setDisplayMode] = useState<'regions' | 'areas' | 'factions'>('regions');
  const [selectedEra, setSelectedEra] = useState<string>('MEDIEVAL');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing geographic data...');

  // Build region points from regional data
  const regionPoints = useMemo(() => {
    return buildRegionalMap();
  }, []);

  // Build map area points - generate coordinates for ALL areas
  const areaPoints = useMemo(() => {
    const points: MapAreaPoint[] = [];
    const regionMap = buildRegionalMap();

    // Create a lookup for region coordinates
    const regionCoordLookup: { [key: string]: { lat: number; lng: number } } = {};
    regionMap.forEach(region => {
      regionCoordLookup[region.name] = { lat: region.lat, lng: region.lng };
    });

    Object.entries(GEOGRAPHICAL_DATA).forEach(([zone, zoneData]) => {
      Object.entries(zoneData).forEach(([regionName, regionData]) => {
        if (typeof regionData === 'object' && !Array.isArray(regionData)) {
          const regionCoords = regionCoordLookup[regionName];

          // Get all areas in this region
          const areas = Object.entries(regionData).filter(([_, area]) =>
            area && typeof area === 'object' && 'name' in area
          );

          areas.forEach(([areaKey, area], index) => {
            if (area && typeof area === 'object' && 'name' in area) {
              // First check if we have specific coordinates
              const specificCoords = AREA_COORDINATES[area.name];

              let lng, lat;
              if (specificCoords && specificCoords[0] !== 0 && specificCoords[1] !== 0) {
                // Use specific coordinates
                lng = specificCoords[0];
                lat = specificCoords[1];
              } else if (regionCoords) {
                // Generate approximate coordinates based on region center
                // Distribute areas in a circle around the region center
                const areaCount = areas.length;
                const radius = Math.min(3, Math.max(1, areaCount * 0.15)); // Radius based on area count
                const angle = (index / areaCount) * 2 * Math.PI;
                const offsetRadius = radius * (0.5 + Math.random() * 0.5); // Vary the distance

                lng = regionCoords.lng + Math.cos(angle) * offsetRadius;
                lat = regionCoords.lat + Math.sin(angle) * offsetRadius;
              } else {
                // Skip if no coordinates available
                return;
              }

              points.push({
                name: area.name,
                region: regionName,
                zone: zone,
                lng: lng,
                lat: lat,
                climate: area.climate || 'temperate'
              });
            }
          });
        }
      });
    });

    console.log('Generated', points.length, 'map area points');
    return points;
  }, []);

  // Build faction points from faction data and area coordinates
  const factionPoints = useMemo(() => {
    const points: Array<{
      name: string;
      factionName: string;
      zone: string;
      lng: number;
      lat: number;
    }> = [];

    // Iterate through all cultural zones in FACTION_DATA
    Object.entries(FACTION_DATA).forEach(([culturalZone, zoneData]) => {
      if (typeof zoneData === 'object' && zoneData !== null) {
        Object.entries(zoneData).forEach(([regionName, regionData]) => {
          if (typeof regionData === 'object' && regionData !== null) {
            // Check if this era has faction data for this region
            const eraData = (regionData as any)[selectedEra];
            if (eraData && eraData.dominantPower) {
              // Try to find coordinates for this region from regionPoints
              const regionPoint = regionPoints.find(p => p.name === regionName);
              if (regionPoint) {
                points.push({
                  name: regionName,
                  factionName: eraData.dominantPower,
                  zone: culturalZone,
                  lng: regionPoint.lng,
                  lat: regionPoint.lat
                });
              }

              // Also check for area-specific overrides (mapAreaOverrides)
              if (eraData.mapAreaOverrides) {
                Object.entries(eraData.mapAreaOverrides).forEach(([areaName, overrideData]: [string, any]) => {
                  if (overrideData && overrideData.dominantPower) {
                    const areaPoint = areaPoints.find(p => p.name === areaName);
                    if (areaPoint) {
                      points.push({
                        name: areaName,
                        factionName: overrideData.dominantPower,
                        zone: culturalZone,
                        lng: areaPoint.lng,
                        lat: areaPoint.lat
                      });
                    }
                  }
                });
              }
            }
          }
        });
      }
    });

    console.log('Generated', points.length, 'faction points for era', selectedEra);
    return points;
  }, [areaPoints, regionPoints, selectedEra]);

  // Filter based on search and display mode
  const filteredPoints = useMemo(() => {
    if (displayMode === 'regions') {
      if (!searchTerm) return regionPoints;
      return regionPoints.filter(region =>
        region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        region.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        region.dominantClimate.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (displayMode === 'areas') {
      if (!searchTerm) return areaPoints;
      return areaPoints.filter(area =>
        area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.zone.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      // Factions mode
      if (!searchTerm) return factionPoints;
      return factionPoints.filter(faction =>
        faction.factionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faction.zone.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }, [regionPoints, areaPoints, factionPoints, searchTerm, displayMode]);

  // SimCity-style loading sequence
  useEffect(() => {
    if (!isOpen) return;

    // Reset loading state when modal opens
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingText('Initializing geographic data...');

    const loadingMessages = [
      'Loading geographic data...',
      'Processing regions...',
      'Building globe...',
      'Ready!'
    ];

    let messageIndex = 0;
    let progress = 0;

    const progressInterval = setInterval(() => {
      progress += 25;
      setLoadingProgress(Math.min(progress, 100));

      if (messageIndex < loadingMessages.length) {
        setLoadingText(loadingMessages[messageIndex]);
        messageIndex++;
      }

      if (progress >= 100) {
        clearInterval(progressInterval);
        setTimeout(() => setIsLoading(false), 150);
      }
    }, 350); // Reduced from 2000ms to 350ms (completes in ~1.4 seconds)

    return () => clearInterval(progressInterval);
  }, [isOpen]);

  // Preload world data immediately on mount
  useEffect(() => {
    if (!worldDataRef.current) {
      // Start loading immediately, even before globe is opened
      d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(data => {
        worldDataRef.current = data;
      }).catch(err => {
        console.error('Failed to load world data:', err);
      });
    }
  }, []); // Run once on mount

  // Draw globe
  useEffect(() => {
    if (!svgRef.current || !isOpen || !worldDataRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll('*').remove();

    // Create projection
    const projection = d3.geoOrthographic()
      .scale(Math.min(width, height) * 0.45 * scale)
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .rotate(rotation);

    const path = d3.geoPath().projection(projection);

    const g = svg.append('g');

    // Add defs for gradients and effects
    const defs = svg.append('defs');

    // Ocean gradient with shimmer
    const oceanGradient = defs.append('radialGradient')
      .attr('id', 'oceanGradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    oceanGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#1a4d7a')
      .attr('stop-opacity', 1);
    oceanGradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#0a2463')
      .attr('stop-opacity', 1);
    oceanGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#04152d')
      .attr('stop-opacity', 1);

    // Highlight gradient for sphere (very subtle, no color tint)
    const highlightGradient = defs.append('radialGradient')
      .attr('id', 'highlightGradient')
      .attr('cx', '35%')
      .attr('cy', '35%')
      .attr('r', '65%');
    highlightGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', 0.03);  // Reduced from 0.08
    highlightGradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#ffffff')
      .attr('stop-opacity', 0.01);  // Reduced from 0.02
    highlightGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ffffff')  // Changed from #000000 to remove dark tint
      .attr('stop-opacity', 0);  // Changed from 0.1

    // Shadow for globe
    const shadowFilter = defs.append('filter')
      .attr('id', 'globeShadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    shadowFilter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3);
    shadowFilter.append('feOffset')
      .attr('dx', 3)
      .attr('dy', 3);
    const feMerge = shadowFilter.append('feMerge');
    feMerge.append('feMergeNode');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    // Draw ocean with gradient
    g.append('path')
      .datum({ type: 'Sphere' })
      .attr('class', 'ocean')
      .attr('d', path as any)
      .attr('fill', 'url(#oceanGradient)')
      .attr('stroke', '#2a5f8f')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#globeShadow)');

    // Draw highlight overlay
    g.append('path')
      .datum({ type: 'Sphere' })
      .attr('class', 'highlight')
      .attr('d', path as any)
      .attr('fill', 'url(#highlightGradient)')
      .attr('stroke', 'none')
      .style('pointer-events', 'none');

    // Draw graticule (latitude/longitude lines)
    const graticule = d3.geoGraticule().step([20, 20]);
    g.append('path')
      .datum(graticule())
      .attr('class', 'graticule')
      .attr('d', path as any)
      .attr('fill', 'none')
      .attr('stroke', '#1e3a5f')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.2);

    // Draw actual world map from TopoJSON data
    const countries = topojson.feature(worldDataRef.current, worldDataRef.current.objects.countries) as any;

    g.selectAll('.land')
      .data(countries.features)
      .enter().append('path')
      .attr('class', 'land')
      .attr('d', path as any)
      .attr('fill', (d: any) => {
        // Make Antarctica white
        const countryName = d.properties?.name || '';
        if (countryName === 'Antarctica') {
          return '#ffffff';
        }
        return '#2d5a2d';
      })
      .attr('stroke', (d: any) => {
        const countryName = d.properties?.name || '';
        if (countryName === 'Antarctica') {
          return '#e0e0e0';
        }
        return '#1a3a1a';
      })
      .attr('stroke-width', 0.5)
      .attr('opacity', (d: any) => {
        const countryName = d.properties?.name || '';
        if (countryName === 'Antarctica') {
          return 0.95;
        }
        return 0.85;
      });

    // Enhanced color scheme
    const getRegionColor = (climate: string, name: string): string => {
      const isWater = name.includes('Sea') || name.includes('Ocean') ||
                     name.includes('Bay') || name.includes('Strait') ||
                     name.includes('Channel') || name.includes('Gulf') ||
                     name === 'European Waters' || name === 'Major Seas and Oceans';

      if (isWater) return '#1e4a7f';
      if (name === 'Antarctica') return '#e8f5e9';
      if (name === 'Arctic and Subarctic') return '#e1f5fe';

      const colors: { [key: string]: string } = {
        'temperate': '#4a7c59',
        'mediterranean': '#7fb069',
        'arid': '#d4a574',
        'desert': '#c19a6b',
        'tropical': '#2d5016',
        'subtropical': '#3d6a3d',
        'semitropical': '#3d6a3d',
        'continental': '#5d8055',
        'savanna': '#8bc34a',
        'rainforest': '#1b4332',
        'monsoon': '#00695c',
        'steppe': '#9ccc65',
        'tundra': '#cfd8dc',
        'oceanic': '#4db6ac',
        'arctic': '#e0e7ef',
        'cold': '#b8d4e3'
      };
      return colors[climate.toLowerCase()] || '#4a7c59';
    };

    if (displayMode === 'regions') {
      // Draw region markers
      const visibleRegions = (filteredPoints as RegionHex[]).filter(region => {
        const coords: [number, number] = [region.lng, region.lat];
        const projected = projection(coords);
        if (!projected) return false;

        const centerPoint = [-rotation[0], -rotation[1]];
        const regionPoint: [number, number] = [region.lng, region.lat];
        const distance = d3.geoDistance(centerPoint, regionPoint);
        return distance <= Math.PI / 2;
      });

      g.selectAll('.region')
        .data(visibleRegions)
        .enter().append('circle')
        .attr('class', 'region')
        .attr('cx', d => {
          const coords: [number, number] = [d.lng, d.lat];
          return projection(coords)?.[0] || 0;
        })
        .attr('cy', d => {
          const coords: [number, number] = [d.lng, d.lat];
          return projection(coords)?.[1] || 0;
        })
        .attr('r', d => hoveredRegion === d ? 16 : 10)
        .attr('fill', d => getRegionColor(d.dominantClimate, d.name))
        .attr('stroke', d => hoveredRegion === d ? '#ffd700' : '#fff')
        .attr('stroke-width', d => hoveredRegion === d ? 3 : 2)
        .attr('opacity', 0.95)
        .style('cursor', 'pointer')
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))')
        .on('click', (event, d) => {
          setSelectedRegion(d);
        })
        .on('mouseover', function(event, d) {
          setHoveredRegion(d);
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 16)
            .attr('stroke-width', 3);
        })
        .on('mouseout', function() {
          setHoveredRegion(null);
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 10)
            .attr('stroke-width', 2);
        });

      // Beautiful region label for hovered region
      if (hoveredRegion) {
        const coords: [number, number] = [hoveredRegion.lng, hoveredRegion.lat];
        const projected = projection(coords);
        if (projected) {
          const labelG = g.append('g')
            .attr('class', 'region-label')
            .attr('transform', `translate(${projected[0]}, ${projected[1] - 25})`);

          // Background with shadow
          labelG.append('rect')
            .attr('x', -70)
            .attr('y', -35)
            .attr('width', 140)
            .attr('height', 50)
            .attr('fill', 'rgba(15, 23, 42, 0.98)')
            .attr('stroke', 'rgba(100, 116, 139, 0.8)')
            .attr('stroke-width', 1.5)
            .attr('rx', 6)
            .attr('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))');

          // Region name with beautiful typography
          labelG.append('text')
            .attr('x', 0)
            .attr('y', -15)
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .attr('font-size', '13px')
            .attr('font-weight', '700')
            .attr('font-family', "'Inter', -apple-system, system-ui, sans-serif")
            .attr('letter-spacing', '0.3px')
            .text(hoveredRegion.name);

          // Metadata with refined typography
          labelG.append('text')
            .attr('x', 0)
            .attr('y', 3)
            .attr('text-anchor', 'middle')
            .attr('fill', '#94a3b8')
            .attr('font-size', '10px')
            .attr('font-weight', '500')
            .attr('font-family', "'Inter', -apple-system, system-ui, sans-serif")
            .text(`${hoveredRegion.areaCount} areas`);

          labelG.append('text')
            .attr('x', 0)
            .attr('y', 18)
            .attr('text-anchor', 'middle')
            .attr('fill', '#64748b')
            .attr('font-size', '9px')
            .attr('font-weight', '400')
            .attr('font-family', "'Inter', -apple-system, system-ui, sans-serif")
            .attr('font-style', 'italic')
            .text(hoveredRegion.dominantClimate);
        }
      }
    } else if (displayMode === 'areas') {
      // Draw area markers (smaller dots)
      const visibleAreas = (filteredPoints as MapAreaPoint[]).filter(area => {
        const coords: [number, number] = [area.lng, area.lat];
        const projected = projection(coords);
        if (!projected) return false;

        const centerPoint = [-rotation[0], -rotation[1]];
        const areaPoint: [number, number] = [area.lng, area.lat];
        const distance = d3.geoDistance(centerPoint, areaPoint);
        return distance <= Math.PI / 2;
      });

      g.selectAll('.area')
        .data(visibleAreas)
        .enter().append('circle')
        .attr('class', 'area')
        .attr('cx', d => {
          const coords: [number, number] = [d.lng, d.lat];
          return projection(coords)?.[0] || 0;
        })
        .attr('cy', d => {
          const coords: [number, number] = [d.lng, d.lat];
          return projection(coords)?.[1] || 0;
        })
        .attr('r', d => hoveredArea === d ? 10 : 6)
        .attr('fill', d => getRegionColor(d.climate, d.name))
        .attr('stroke', d => hoveredArea === d ? '#ffd700' : '#fff')
        .attr('stroke-width', d => hoveredArea === d ? 2.5 : 1.2)
        .attr('opacity', 0.9)
        .style('cursor', 'pointer')
        .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))')
        .on('mouseover', function(event, d) {
          setHoveredArea(d);
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 10)
            .attr('stroke-width', 2.5);
        })
        .on('mouseout', function() {
          setHoveredArea(null);
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 6)
            .attr('stroke-width', 1.2);
        });

      // Beautiful area label for hovered area
      if (hoveredArea) {
        const coords: [number, number] = [hoveredArea.lng, hoveredArea.lat];
        const projected = projection(coords);
        if (projected) {
          const labelG = g.append('g')
            .attr('class', 'area-label')
            .attr('transform', `translate(${projected[0]}, ${projected[1] - 20})`);

          labelG.append('rect')
            .attr('x', -60)
            .attr('y', -30)
            .attr('width', 120)
            .attr('height', 42)
            .attr('fill', 'rgba(15, 23, 42, 0.98)')
            .attr('stroke', 'rgba(100, 116, 139, 0.8)')
            .attr('stroke-width', 1.5)
            .attr('rx', 6)
            .attr('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))');

          labelG.append('text')
            .attr('x', 0)
            .attr('y', -12)
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .attr('font-size', '11px')
            .attr('font-weight', '700')
            .attr('font-family', "'Inter', -apple-system, system-ui, sans-serif")
            .attr('letter-spacing', '0.2px')
            .text(hoveredArea.name);

          labelG.append('text')
            .attr('x', 0)
            .attr('y', 3)
            .attr('text-anchor', 'middle')
            .attr('fill', '#94a3b8')
            .attr('font-size', '9px')
            .attr('font-weight', '500')
            .attr('font-family', "'Inter', -apple-system, system-ui, sans-serif")
            .text(hoveredArea.region);

          labelG.append('text')
            .attr('x', 0)
            .attr('y', 15)
            .attr('text-anchor', 'middle')
            .attr('fill', '#64748b')
            .attr('font-size', '8px')
            .attr('font-weight', '400')
            .attr('font-family', "'Inter', -apple-system, system-ui, sans-serif")
            .attr('font-style', 'italic')
            .text(hoveredArea.climate);
        }
      }
    } else {
      // Factions mode - Draw faction markers and labels
      const visibleFactions = (filteredPoints as Array<{name: string; factionName: string; zone: string; lng: number; lat: number}>).filter(faction => {
        const coords: [number, number] = [faction.lng, faction.lat];
        const projected = projection(coords);
        if (!projected) return false;

        const centerPoint = [-rotation[0], -rotation[1]];
        const factionPoint: [number, number] = [faction.lng, faction.lat];
        const distance = d3.geoDistance(centerPoint, factionPoint);
        return distance <= Math.PI / 2;
      });

      // Determine if each faction matches search
      const allFactionPoints = factionPoints;
      const matchesSearch = (faction: any) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return faction.factionName.toLowerCase().includes(term) ||
               faction.name.toLowerCase().includes(term) ||
               faction.zone.toLowerCase().includes(term);
      };

      // Draw faction markers with hover interaction and search highlighting
      g.selectAll('.faction-marker')
        .data(visibleFactions)
        .enter().append('circle')
        .attr('class', 'faction-marker')
        .attr('cx', d => {
          const coords: [number, number] = [d.lng, d.lat];
          return projection(coords)?.[0] || 0;
        })
        .attr('cy', d => {
          const coords: [number, number] = [d.lng, d.lat];
          return projection(coords)?.[1] || 0;
        })
        .attr('r', d => matchesSearch(d) ? 6 : 5)
        .attr('fill', d => matchesSearch(d) ? '#fbbf24' : '#78716c')
        .attr('stroke', d => matchesSearch(d) ? '#fff' : '#a8a29e')
        .attr('stroke-width', d => matchesSearch(d) ? 2 : 1)
        .attr('opacity', d => matchesSearch(d) ? 1 : 0.3)
        .style('filter', d => matchesSearch(d) ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))' : 'none')
        .style('cursor', 'pointer')
        .style('animation', d => matchesSearch(d) && searchTerm ? 'pulse 2s ease-in-out infinite' : 'none')
        .on('mouseenter', function(event, d) {
          const coords: [number, number] = [d.lng, d.lat];
          const projected = projection(coords);
          if (projected) {
            setHoveredFaction({
              ...d,
              x: projected[0],
              y: projected[1]
            });
          }
          d3.select(this)
            .attr('r', 7)
            .attr('fill', '#f59e0b');
        })
        .on('mouseleave', function() {
          setHoveredFaction(null);
          d3.select(this)
            .attr('r', 5)
            .attr('fill', '#fbbf24');
        });

      // Draw faction labels with aggressive fade-out and search highlighting
      visibleFactions.forEach(faction => {
        const coords: [number, number] = [faction.lng, faction.lat];
        const projected = projection(coords);
        if (!projected) return;

        // Calculate distance from globe center for fade-out
        const centerPoint = [-rotation[0], -rotation[1]];
        const factionPoint: [number, number] = [faction.lng, faction.lat];
        const distance = d3.geoDistance(centerPoint, factionPoint);

        // Normalize distance (0 at center, 1 at edge of visible hemisphere)
        const normalizedDistance = distance / (Math.PI / 2);

        // Fade only at edges: full opacity for most of globe, only fade at outer 20%
        // If distance < 0.75, full opacity. If > 0.75, aggressive fade
        let opacity = 1.0;
        if (normalizedDistance > 0.75) {
          const edgeFactor = (normalizedDistance - 0.75) / 0.25; // 0 to 1 in outer 25%
          opacity = Math.pow(1 - edgeFactor, 3); // Cubic falloff
        }

        // Apply search dimming
        const isMatch = matchesSearch(faction);
        if (!isMatch && searchTerm) {
          opacity *= 0.2; // Dim non-matching factions to 20%
        }

        // Skip rendering if too faded
        if (opacity < 0.05) return;

        const labelG = g.append('g')
          .attr('class', 'faction-label')
          .attr('transform', `translate(${projected[0]}, ${projected[1] + 20})`)
          .attr('opacity', opacity)
          .style('cursor', 'pointer');

        // Calculate text metrics for better box sizing
        const textWidth = faction.factionName.length * 6.2;
        const padding = 6;

        // Background box with enhanced styling (highlight if matching search)
        labelG.append('rect')
          .attr('x', -textWidth / 2 - padding)
          .attr('y', -11)
          .attr('width', textWidth + padding * 2)
          .attr('height', 20)
          .attr('fill', isMatch && searchTerm ? 'rgba(217, 119, 6, 1)' : 'rgba(217, 119, 6, 0.98)')
          .attr('stroke', isMatch && searchTerm ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.9)')
          .attr('stroke-width', isMatch && searchTerm ? 2 : 1.5)
          .attr('rx', 4)
          .attr('filter', isMatch && searchTerm ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))' : 'drop-shadow(0 3px 8px rgba(0,0,0,0.6))');

        // Faction name text with improved typography
        labelG.append('text')
          .attr('x', 0)
          .attr('y', 3)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '11px')
          .attr('font-weight', '700')
          .attr('font-family', "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif")
          .attr('letter-spacing', '0.3px')
          .style('text-shadow', '0 1px 3px rgba(0,0,0,0.5)')
          .text(faction.factionName);
      });
    }

  }, [filteredPoints, isOpen, rotation, scale, hoveredRegion, hoveredArea, displayMode, selectedEra, worldDataRef.current]);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    setRotation(prev => [
      prev[0] - dx * 0.5,
      Math.max(-90, Math.min(90, prev[1] + dy * 0.5)),
      prev[2]
    ]);

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const resetView = useCallback(() => {
    setScale(1);
    setRotation([0, -20, 0]);
  }, []);

  if (!isOpen) return null;

  const waterRegions = regionPoints.filter(r =>
    r.name.includes('Sea') || r.name.includes('Ocean') ||
    r.name.includes('Bay') || r.name.includes('Strait')
  ).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* SimCity-style Loading Screen */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center">
          <div className="w-96 space-y-6">
            {/* Title */}
            <div className="text-center mb-8">
              <Globe className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
                World Geography Globe
              </h2>
              <p className="text-sm text-slate-400" style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
                Loading geographic data...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>

              {/* Loading Text */}
              <div className="text-center">
                <p
                  className="text-sm text-emerald-400 font-medium animate-pulse"
                  style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}
                >
                  {loadingText}
                </p>
                <p className="text-xs text-slate-500 mt-1" style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
                  {Math.round(loadingProgress)}% complete
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-900/95">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-emerald-500" />
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
              World Geography Globe
            </h2>
            <p className="text-xs text-slate-400" style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
              Interactive 3D visualization • {displayMode === 'regions' ? `${regionPoints.length} regions` : displayMode === 'areas' ? `${areaPoints.length} map areas` : `${factionPoints.length} factions`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Display mode toggle */}
          <div className="flex items-center gap-2 bg-slate-800/80 rounded-xl p-1.5 border border-slate-600/50 shadow-lg">
            <button
              onClick={() => setDisplayMode('regions')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                displayMode === 'regions'
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
            >
              <Map className="w-4 h-4" />
              <span className="tracking-tight">Regions</span>
            </button>
            <button
              onClick={() => setDisplayMode('areas')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                displayMode === 'areas'
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
            >
              <MapPin className="w-4 h-4" />
              <span className="tracking-tight">Areas</span>
            </button>
            <button
              onClick={() => setDisplayMode('factions')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                displayMode === 'factions'
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
            >
              <Users className="w-4 h-4" />
              <span className="tracking-tight">Factions</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={displayMode === 'regions' ? 'Search regions...' : displayMode === 'areas' ? 'Search areas...' : 'Search factions...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 w-full shadow-lg transition-all"
              style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
            />
            {searchTerm && displayMode === 'factions' && (
              <div className="absolute -bottom-6 left-0 text-xs text-amber-400 font-semibold">
                {filteredPoints.length} of {factionPoints.length} factions
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 rounded-xl p-1.5 border border-slate-600/50 shadow-lg">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
              className="p-2.5 bg-slate-700/50 hover:bg-slate-600 rounded-lg transition-all hover:shadow-md"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setScale(s => Math.min(3, s + 0.2))}
              className="p-2.5 bg-slate-700/50 hover:bg-slate-600 rounded-lg transition-all hover:shadow-md"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={resetView}
              className="p-2.5 bg-slate-700/50 hover:bg-slate-600 rounded-lg transition-all hover:shadow-md"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4 text-white" />
            </button>
          </div>

          <button onClick={onClose} className="p-2.5 hover:bg-slate-700/50 rounded-xl transition-all">
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Historical Era Timeline (only visible in Factions mode) */}
      {displayMode === 'factions' && (
        <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white tracking-tight" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", letterSpacing: '-0.01em' }}>
                Historical Era Timeline
              </h3>
              <div className="text-xs text-amber-400 font-semibold px-3 py-1 bg-amber-950/30 rounded-full border border-amber-800/40" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                {factionPoints.length} factions
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {[
                { key: 'PREHISTORY', label: 'Prehistory', years: '~3000 BCE', color: 'amber' },
                { key: 'ANTIQUITY', label: 'Antiquity', years: '500 BCE - 500', color: 'orange' },
                { key: 'MEDIEVAL', label: 'Medieval', years: '500 - 1500', color: 'red' },
                { key: 'RENAISSANCE_EARLY_MODERN', label: 'Renaissance', years: '1500 - 1800', color: 'purple' },
                { key: 'INDUSTRIAL_ERA', label: 'Industrial', years: '1800 - 1900', color: 'blue' },
                { key: 'MODERN_ERA', label: 'Modern', years: '1900 - 2025', color: 'cyan' },
                { key: 'FUTURE_ERA', label: 'Future', years: '2025+', color: 'emerald' }
              ].map((era) => (
                <button
                  key={era.key}
                  onClick={() => setSelectedEra(era.key)}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                    selectedEra === era.key
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xl shadow-amber-500/40 scale-105 border-2 border-amber-300/50'
                      : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600 hover:text-white border-2 border-transparent'
                  }`}
                  style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
                >
                  <div className="font-extrabold tracking-tight" style={{ letterSpacing: '-0.02em' }}>{era.label}</div>
                  <div className={`text-[10px] mt-0.5 font-medium ${selectedEra === era.key ? 'opacity-90' : 'opacity-60'}`}>{era.years}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Globe Container */}
      <div className="flex-1 relative">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Info panel */}
        <div className="absolute top-4 right-4 bg-slate-800/90 rounded-lg p-3 max-w-xs shadow-xl border border-slate-700/50">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1" style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
              <div className="font-semibold text-white">3D Geography Globe</div>
              <div>
                {displayMode === 'regions'
                  ? 'Real-world map with geographic regions'
                  : displayMode === 'areas'
                  ? 'Real-world map with individual map areas'
                  : 'Historical factions across different eras'}
              </div>
              <div>Drag to rotate • Scroll to zoom • Hover for details</div>
              <div>
                {displayMode === 'factions'
                  ? 'Switch eras to see how political powers changed over time'
                  : 'Toggle between regions, areas, and factions for different views'}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-800/90 rounded-lg p-3 shadow-xl border border-slate-700/50">
          <div className="text-xs text-white font-semibold mb-2" style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
            Climate Zones
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs" style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
            {[
              { climate: 'Tropical', color: '#2d5016' },
              { climate: 'Arid', color: '#d4a574' },
              { climate: 'Temperate', color: '#4a7c59' },
              { climate: 'Continental', color: '#5d8055' },
              { climate: 'Arctic', color: '#e0e7ef' },
              { climate: 'Oceanic', color: '#1e4a7f' }
            ].map(({ climate, color }) => (
              <div key={climate} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-300 font-medium">{climate}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected region details */}
        {selectedRegion && (
          <div className="absolute bottom-4 right-4 bg-slate-800/95 border border-slate-600 rounded-lg p-4 min-w-64 shadow-xl">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-white" style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
                {selectedRegion.name}
              </h3>
              <button
                onClick={() => setSelectedRegion(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-1" style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
              <div className="flex justify-between">
                <span>Cultural Zone:</span>
                <span className="text-emerald-400 font-semibold">{selectedRegion.zone}</span>
              </div>
              <div className="flex justify-between">
                <span>Climate:</span>
                <span className="text-blue-400 font-semibold">{selectedRegion.dominantClimate}</span>
              </div>
              <div className="flex justify-between">
                <span>Areas:</span>
                <span className="text-amber-400 font-semibold">{selectedRegion.areaCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Coordinates:</span>
                <span className="text-gray-400 font-mono text-[10px]">{selectedRegion.lat.toFixed(1)}°, {selectedRegion.lng.toFixed(1)}°</span>
              </div>
            </div>
          </div>
        )}

        {/* Faction tooltip on hover */}
        {hoveredFaction && (() => {
          // Get full faction data from FACTION_DATA
          const culturalZone = hoveredFaction.zone as keyof typeof FACTION_DATA;
          const zoneData = FACTION_DATA[culturalZone];

          // Try to find the faction in region data or area overrides
          let factionData: any = null;

          if (zoneData && typeof zoneData === 'object') {
            // Search through regions
            Object.entries(zoneData).forEach(([regionName, regionData]) => {
              if (regionData && typeof regionData === 'object') {
                const eraData = (regionData as any)[selectedEra];

                // Check if this is the right region
                if (eraData && eraData.dominantPower === hoveredFaction.factionName && regionName === hoveredFaction.name) {
                  factionData = eraData;
                }

                // Check area overrides
                if (eraData && eraData.mapAreaOverrides) {
                  Object.entries(eraData.mapAreaOverrides).forEach(([areaName, overrideData]: [string, any]) => {
                    if (overrideData && overrideData.dominantPower === hoveredFaction.factionName && areaName === hoveredFaction.name) {
                      factionData = overrideData;
                    }
                  });
                }
              }
            });
          }

          if (!factionData) return null;

          return (
            <div
              className="absolute bg-gradient-to-br from-amber-900 to-amber-950 border-2 border-amber-400/70 rounded-xl p-5 min-w-96 max-w-lg shadow-2xl pointer-events-none z-50"
              style={{
                left: `${hoveredFaction.x + 20}px`,
                top: `${hoveredFaction.y - 100}px`,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              }}
            >
              {/* Faction Name */}
              <div className="mb-4 pb-3 border-b-2 border-amber-500/40">
                <h3 className="font-bold text-2xl text-amber-50 tracking-tight leading-tight" style={{ letterSpacing: '-0.01em' }}>
                  {hoveredFaction.factionName}
                </h3>
                <div className="text-xs text-amber-300/80 font-medium mt-1.5 flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  {hoveredFaction.name}
                </div>
              </div>

              {/* Faction Details */}
              <div className="text-sm text-amber-100/95 space-y-3">
                {/* Era Context */}
                {factionData.eraContextSentence && (
                  <div className="italic text-amber-100/90 text-xs leading-relaxed bg-gradient-to-r from-amber-950/50 to-amber-900/30 p-3 rounded-lg border border-amber-700/30">
                    "{factionData.eraContextSentence}"
                  </div>
                )}

                {/* Dominant Power Description */}
                {factionData.dominantPowerDescription && (
                  <div>
                    <span className="text-amber-300 font-semibold text-xs block mb-1.5 uppercase tracking-wide">Overview</span>
                    <p className="text-amber-50/95 text-xs leading-relaxed">
                      {factionData.dominantPowerDescription}
                    </p>
                  </div>
                )}

                {/* Allegiance Groups */}
                {factionData.allegianceGroups && factionData.allegianceGroups.length > 0 && (
                  <div>
                    <span className="text-amber-300 font-semibold text-xs block mb-2 uppercase tracking-wide">Allegiances</span>
                    <div className="flex flex-wrap gap-1.5">
                      {factionData.allegianceGroups.map((group: any, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs bg-amber-800/50 px-2.5 py-1 rounded-md text-amber-100 font-medium border border-amber-700/30"
                        >
                          {typeof group === 'string' ? group : group?.name || JSON.stringify(group)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Structures */}
                {factionData.structureNames && factionData.structureNames.length > 0 && (
                  <div>
                    <span className="text-amber-300 font-semibold text-xs block mb-1.5 uppercase tracking-wide">Notable Structures</span>
                    <div className="text-xs text-amber-50/90 leading-relaxed">
                      {factionData.structureNames.slice(0, 4).map((s: any) => typeof s === 'string' ? s : s?.name || '').filter(Boolean).join(' • ')}
                    </div>
                  </div>
                )}

                {/* Court Roles */}
                {factionData.courtRoles && Object.keys(factionData.courtRoles).length > 0 && (
                  <div>
                    <span className="text-amber-300 font-semibold text-xs block mb-2 uppercase tracking-wide">Court Positions</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.keys(factionData.courtRoles).slice(0, 6).map((role: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs bg-amber-700/40 px-2.5 py-1 rounded-md text-amber-100 font-medium border border-amber-600/30"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Stats */}
        <div className="absolute top-4 left-4 bg-slate-800/90 rounded-lg p-3 shadow-xl border border-slate-700/50">
          <div className="text-xs text-slate-300 space-y-1" style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
            <div className="text-white font-semibold">
              {displayMode === 'regions' ? 'Regional View' : displayMode === 'areas' ? 'Local Map View' : 'Historical Factions'}
            </div>
            {displayMode === 'regions' ? (
              <>
                <div>Total Regions: <span className="text-emerald-400 font-semibold">{regionPoints.length}</span></div>
                <div>Land Regions: <span className="text-green-400 font-semibold">{regionPoints.length - waterRegions}</span></div>
                <div>Water Bodies: <span className="text-blue-400 font-semibold">{waterRegions}</span></div>
              </>
            ) : displayMode === 'areas' ? (
              <>
                <div>Total Areas: <span className="text-emerald-400 font-semibold">{areaPoints.length}</span></div>
                <div>Visible: <span className="text-blue-400 font-semibold">{filteredPoints.length}</span></div>
              </>
            ) : (
              <>
                <div>Current Era: <span className="text-amber-400 font-semibold">{selectedEra.replace(/_/g, ' ')}</span></div>
                <div>Total Factions: <span className="text-emerald-400 font-semibold">{factionPoints.length}</span></div>
                <div>Visible: <span className="text-blue-400 font-semibold">{filteredPoints.length}</span></div>
              </>
            )}
            {searchTerm && (
              <div>Filtered: <span className="text-yellow-400 font-semibold">{filteredPoints.length}</span></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HexWorldGlobe;
