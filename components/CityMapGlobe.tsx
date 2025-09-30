/**
 * City Map Globe - 3D Globe visualization of cities
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { CITIES_DATA } from '../constants/gameData/cities';
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';
import { FACTION_ICONS } from '../constants/gameData/factionIcons';
import CityDetailPanel from './CityDetailPanel';
import {
  X, ZoomIn, ZoomOut, Calendar, Play, Pause, Home, Globe, Hexagon, Info, Flag, ChevronUp, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';

interface CityMapProps {
  isOpen: boolean;
  onClose: () => void;
  currentGameYear?: number;
  playerLocation?: string;
}

interface CityNode {
  id: string;
  name: string;
  mapArea: string;
  coordinates: [number, number];
  foundingYear: number;
  declineYear?: number;
  zone: string;
  region: string;
  isActive: boolean;
  importance: number;
  allegiance?: string;
  allegianceHistory?: { [year: number]: string };
  economicFocus?: string[];
}

// Individual city coordinates for accurate mapping [latitude, longitude]
const CITY_COORDINATES: Record<string, [number, number]> = {
  // Europe
  'Rome': [41.9, 12.5],
  'Constantinople': [41.0, 28.95],
  'Athens': [37.98, 23.73],
  'Venice': [45.44, 12.32],
  'Milan': [45.46, 9.19],
  'Paris': [48.86, 2.35],
  'London': [51.51, -0.13],
  'Madrid': [40.42, -3.70],
  'Lisbon': [38.72, -9.14],
  'Vienna': [48.21, 16.37],
  'Amsterdam': [52.37, 4.90],
  'Copenhagen': [55.68, 12.57],
  'Stockholm': [59.33, 18.07],
  'Dublin': [53.35, -6.26],
  'Warsaw': [52.23, 21.01],
  'Kiev': [50.45, 30.52],
  'Moscow': [55.75, 37.62],
  'Seville': [37.39, -5.98],

  // Asia
  'Beijing': [39.90, 116.41],
  'Xi\'an': [34.27, 108.90],
  'Nanjing': [32.06, 118.80],
  'Shanghai': [31.23, 121.47],
  'Guangzhou': [23.13, 113.26],
  'Kyoto': [35.01, 135.77],
  'Tokyo': [35.68, 139.69],
  'Seoul': [37.57, 126.98],
  'Delhi': [28.61, 77.21],
  'Varanasi': [25.32, 82.97],
  'Mumbai': [19.08, 72.88],
  'Isfahan': [32.65, 51.67],
  'Baghdad': [33.31, 44.36],
  'Damascus': [33.51, 36.31],
  'Jerusalem': [31.78, 35.23],
  'Mecca': [21.43, 39.83],
  'Cairo': [30.04, 31.24],
  'Alexandria': [31.20, 29.92],
  'Babylon': [32.54, 44.42],
  'Persepolis': [29.93, 52.89],
  'Samarkand': [39.66, 66.98],
  'Bangkok': [13.75, 100.50],

  // Americas
  'Mexico City': [19.43, -99.13],
  'Tenochtitlan': [19.43, -99.13],
  'Cusco': [-13.52, -71.97],
  'Lima': [-12.05, -77.04],
  'Montreal': [45.50, -73.57],
  'New York': [40.71, -74.01],
  'Philadelphia': [39.95, -75.16],
  'Boston': [42.36, -71.06],
  'Havana': [23.11, -82.37],

  // Africa & Oceania
  'Timbuktu': [16.78, -3.01],
  'Cape Town': [-33.92, 18.42],
  'Sydney': [-33.87, 151.21],

  // Additional cities to cover more regions
  'Ur': [30.96, 46.10],
  'Uruk': [31.32, 45.64],
  'Nineveh': [36.37, 43.09],
  'Carthage': [36.85, 10.33],
  'Syracuse': [37.08, 15.29],
  'Cordoba': [37.88, -4.78],
  'Granada': [37.18, -3.60],
  'Florence': [43.77, 11.26],
  'Genoa': [44.41, 8.95],
  'Naples': [40.85, 14.26],
  'Cologne': [50.94, 6.96],
  'Hamburg': [53.55, 9.99],
  'Prague': [50.08, 14.44],
  'Budapest': [47.50, 19.04],
  'Bucharest': [44.43, 26.10],
  'Belgrade': [44.82, 20.47],
  'Athens': [37.98, 23.73],
  'Thessalonica': [40.64, 22.94],
  'Antioch': [36.20, 36.16],
  'Aleppo': [36.20, 37.16],
  'Palmyra': [34.55, 38.27],
  'Petra': [30.33, 35.44],
  'Aden': [12.80, 45.04],
  'Muscat': [23.59, 58.41],
  'Hormuz': [27.10, 56.47],
  'Basra': [30.52, 47.78],
  'Hamadan': [34.80, 48.52],
  'Tabriz': [38.08, 46.29],
  'Bukhara': [39.77, 64.42],
  'Kashgar': [39.47, 75.98],
  'Khotan': [37.10, 79.92],
  'Lhasa': [29.65, 91.13],
  'Chengdu': [30.57, 104.07],
  'Hangzhou': [30.27, 120.15],
  'Kaifeng': [34.79, 114.31],
  'Luoyang': [34.68, 112.45],
  'Chang\'an': [34.27, 108.90], // Same as Xi'an
  'Osaka': [34.69, 135.50],
  'Nara': [34.69, 135.80],
  'Kolkata': [22.57, 88.36],
  'Chennai': [13.08, 80.27],
  'Goa': [15.30, 73.91],
  'Agra': [27.18, 78.02],
  'Lahore': [31.55, 74.34],
  'Kabul': [34.52, 69.17],
  'Kandahar': [31.61, 65.71],
  'Saigon': [10.82, 106.63],
  'Hanoi': [21.03, 105.85],
  'Manila': [14.60, 120.98],
  'Jakarta': [-6.21, 106.85],
  'Singapore': [1.29, 103.85],
  'Malacca': [2.19, 102.25],
  'Ayutthaya': [14.35, 100.58],
  'Angkor': [13.41, 103.87],
  'Pagan': [21.17, 94.86],
  'Colombo': [6.93, 79.84],
  'Zanzibar': [-6.17, 39.19],
  'Mogadishu': [2.05, 45.34],
  'Axum': [14.13, 38.72],
  'Meroe': [16.94, 33.75],
  'Great Zimbabwe': [-20.27, 30.93],
  'Kilwa': [-8.96, 39.52],
  'Mombasa': [-4.05, 39.66],
  'Sofala': [-20.17, 34.73],
  'Benin City': [6.34, 5.63],
  'Ife': [7.48, 4.56],
  'Kano': [12.00, 8.52],
  'Gao': [16.27, -0.04],
  'Djenne': [13.91, -4.56],
  'Marrakech': [31.63, -7.98],
  'Fez': [34.04, -5.00],
  'Tunis': [36.82, 10.17],
  'Tripoli': [32.89, 13.19],
  'Quebec City': [46.81, -71.21],
  'Mexico City': [19.43, -99.13], // Already included but repeated for clarity
  'Veracruz': [19.18, -96.13],
  'Panama City': [8.98, -79.52],
  'Cartagena': [10.39, -75.51],
  'Quito': [-0.23, -78.52],
  'La Paz': [-16.50, -68.15],
  'Santiago': [-33.45, -70.67],
  'Buenos Aires': [-34.61, -58.38],
  'Rio de Janeiro': [-22.91, -43.17],
  'Salvador': [-12.97, -38.51],
  'Caracas': [10.48, -66.90],
  'Santo Domingo': [18.47, -69.93],

  // More European cities
  'Berlin': [52.52, 13.41],
  'Munich': [48.14, 11.58],
  'Frankfurt': [50.11, 8.68],
  'Lyon': [45.76, 4.84],
  'Marseille': [43.30, 5.37],
  'Barcelona': [41.39, 2.17],
  'Valencia': [39.47, -0.38],
  'Toledo': [39.86, -4.03],
  'Salamanca': [40.97, -5.66],
  'Porto': [41.16, -8.63],
  'Bordeaux': [44.84, -0.58],
  'Tours': [47.39, 0.69],
  'Orleans': [47.90, 1.91],
  'Reims': [49.26, 4.03],
  'Strasbourg': [48.58, 7.75],
  'Brussels': [50.85, 4.35],
  'Antwerp': [51.22, 4.40],
  'Rotterdam': [51.92, 4.48],
  'Utrecht': [52.09, 5.12],
  'Edinburgh': [55.95, -3.19],
  'Glasgow': [55.86, -4.25],
  'Manchester': [53.48, -2.24],
  'Birmingham': [52.49, -1.90],
  'York': [53.96, -1.08],
  'Canterbury': [51.28, 1.08],
  'Oxford': [51.75, -1.26],
  'Cambridge': [52.21, 0.12],
  'Zurich': [47.38, 8.54],
  'Geneva': [46.20, 6.15],
  'Bern': [46.95, 7.45],
  'Basel': [47.56, 7.59],
  'Turin': [45.07, 7.69],
  'Bologna': [44.49, 11.34],
  'Padua': [45.41, 11.88],
  'Verona': [45.44, 10.99],
  'Pisa': [43.72, 10.40],
  'Siena': [43.32, 11.33],
  'Ravenna': [44.42, 12.20],
  'Palermo': [38.12, 13.36],
  'Oslo': [59.91, 10.75],
  'Bergen': [60.39, 5.32],
  'Helsinki': [60.17, 24.94],
  'Tallinn': [59.44, 24.75],
  'Riga': [56.95, 24.11],
  'Vilnius': [54.69, 25.28],
  'Krakow': [50.06, 19.94],
  'Gdansk': [54.35, 18.65],
  'Ljubljana': [46.06, 14.51],
  'Zagreb': [45.81, 15.98],
  'Sarajevo': [43.86, 18.41],
  'Sofia': [42.70, 23.32],
  'Skopje': [42.00, 21.43],
  'Tirana': [41.33, 19.82],

  // Asian cities expansion
  'Ankara': [39.93, 32.86],
  'Istanbul': [41.01, 28.98], // Modern Constantinople
  'Izmir': [38.42, 27.14],
  'Bursa': [40.18, 29.06],
  'Edirne': [41.68, 26.56],
  'Konya': [37.87, 32.48],
  'Tehran': [35.69, 51.39],
  'Shiraz': [29.59, 52.54],
  'Kerman': [30.28, 57.08],
  'Yazd': [31.90, 54.37],
  'Qom': [34.64, 50.88],
  'Mashhad': [36.32, 59.57],
  'Herat': [34.35, 62.20],
  'Balkh': [36.76, 66.90],
  'Merv': [37.66, 61.83],
  'Khiva': [41.38, 60.36],
  'Tashkent': [41.30, 69.24],
  'Almaty': [43.26, 76.93],
  'Bishkek': [42.87, 74.59],
  'Dushanbe': [38.54, 68.78],
  'Ashgabat': [37.96, 58.33],
  'Baku': [40.41, 49.87],
  'Tbilisi': [41.72, 44.83],
  'Yerevan': [40.18, 44.52],

  // Indian subcontinent
  'Karachi': [24.86, 67.00],
  'Islamabad': [33.73, 73.04],
  'Peshawar': [34.02, 71.58],
  'Quetta': [30.18, 66.99],
  'Multan': [30.20, 71.48],
  'Faisalabad': [31.42, 73.08],
  'Rawalpindi': [33.60, 73.06],
  'Srinagar': [34.09, 74.80],
  'Amritsar': [31.64, 74.87],
  'Jaipur': [26.91, 75.79],
  'Jodhpur': [26.30, 73.02],
  'Udaipur': [24.59, 73.71],
  'Ahmedabad': [23.03, 72.59],
  'Surat': [21.19, 72.83],
  'Pune': [18.52, 73.86],
  'Hyderabad': [17.39, 78.49],
  'Bangalore': [12.97, 77.59],
  'Mysore': [12.30, 76.64],
  'Kochi': [9.93, 76.27],
  'Trivandrum': [8.52, 76.94],
  'Madurai': [9.93, 78.12],
  'Thanjavur': [10.79, 79.14],
  'Pondicherry': [11.93, 79.83],
  'Visakhapatnam': [17.69, 83.22],
  'Bhubaneswar': [20.30, 85.82],
  'Patna': [25.59, 85.14],
  'Bodh Gaya': [24.70, 84.99],
  'Lucknow': [26.85, 80.95],
  'Kanpur': [26.45, 80.33],
  'Allahabad': [25.45, 81.84],
  'Bhopal': [23.26, 77.40],
  'Indore': [22.72, 75.83],
  'Nagpur': [21.15, 79.09],
  'Raipur': [21.25, 81.63],
  'Guwahati': [26.14, 91.74],
  'Dhaka': [23.81, 90.41],
  'Chittagong': [22.36, 91.78],
  'Kathmandu': [27.72, 85.32],
  'Pokhara': [28.21, 83.99],
  'Thimphu': [27.47, 89.64],

  // East Asian expansion
  'Harbin': [45.80, 126.53],
  'Shenyang': [41.81, 123.43],
  'Dalian': [38.91, 121.61],
  'Tianjin': [39.34, 117.36],
  'Qingdao': [36.07, 120.38],
  'Jinan': [36.65, 117.12],
  'Zhengzhou': [34.76, 113.66],
  'Wuhan': [30.59, 114.31],
  'Changsha': [28.20, 112.97],
  'Nanchang': [28.68, 115.89],
  'Fuzhou': [26.07, 119.30],
  'Xiamen': [24.48, 118.09],
  'Shenzhen': [22.54, 114.06],
  'Hong Kong': [22.40, 114.11],
  'Macau': [22.20, 113.54],
  'Taipei': [25.03, 121.57],
  'Kaohsiung': [22.63, 120.27],
  'Kunming': [25.04, 102.73],
  'Guiyang': [26.65, 106.63],
  'Chongqing': [29.43, 106.91],
  'Lanzhou': [36.06, 103.79],
  'Xining': [36.62, 101.78],
  'Urumqi': [43.83, 87.62],
  'Hohhot': [40.84, 111.75],
  'Pyongyang': [39.04, 125.76],
  'Busan': [35.18, 129.08],
  'Incheon': [37.46, 126.71],
  'Daegu': [35.87, 128.60],
  'Gwangju': [35.16, 126.85],
  'Daejeon': [36.35, 127.39],
  'Sapporo': [43.06, 141.35],
  'Sendai': [38.27, 140.87],
  'Yokohama': [35.44, 139.64],
  'Nagoya': [35.18, 136.91],
  'Kobe': [34.69, 135.20],
  'Hiroshima': [34.40, 132.46],
  'Fukuoka': [33.61, 130.42],
  'Nagasaki': [32.74, 129.87],
  'Kagoshima': [31.60, 130.56],

  // Southeast Asian expansion
  'Yangon': [16.87, 96.20],
  'Mandalay': [21.98, 96.09],
  'Naypyidaw': [19.75, 96.13],
  'Vientiane': [17.98, 102.63],
  'Luang Prabang': [19.88, 102.13],
  'Phnom Penh': [11.56, 104.93],
  'Siem Reap': [13.36, 103.86],
  'Ho Chi Minh City': [10.82, 106.63], // Saigon
  'Da Nang': [16.05, 108.20],
  'Hue': [16.47, 107.60],
  'Chiang Mai': [18.79, 98.99],
  'Phuket': [7.88, 98.40],
  'Kuala Lumpur': [3.14, 101.70],
  'Penang': [5.41, 100.33],
  'Ipoh': [4.60, 101.08],
  'Johor Bahru': [1.49, 103.74],
  'Bandar Seri Begawan': [4.94, 114.95],
  'Surabaya': [-7.26, 112.75],
  'Bandung': [-6.91, 107.61],
  'Yogyakarta': [-7.80, 110.36],
  'Semarang': [-6.97, 110.42],
  'Medan': [3.60, 98.68],
  'Palembang': [-2.92, 104.75],
  'Makassar': [-5.15, 119.43],
  'Denpasar': [-8.67, 115.21],
  'Dili': [-8.56, 125.57],
  'Port Moresby': [-9.45, 147.19],
  'Darwin': [-12.46, 130.85],
  'Perth': [-31.95, 115.86],
  'Adelaide': [-34.93, 138.60],
  'Melbourne': [-37.81, 144.96],
  'Brisbane': [-27.47, 153.03],
  'Auckland': [-36.84, 174.74],
  'Wellington': [-41.29, 174.78],
  'Christchurch': [-43.53, 172.64],
  'Suva': [-18.14, 178.44],
  'Nouméa': [-22.28, 166.46],
  'Papeete': [-17.54, -149.57],
  'Honolulu': [21.31, -157.86],

  // Middle Eastern expansion
  'Kuwait City': [29.38, 47.98],
  'Doha': [25.29, 51.53],
  'Manama': [26.23, 50.59],
  'Abu Dhabi': [24.47, 54.37],
  'Dubai': [25.20, 55.27],
  'Riyadh': [24.71, 46.68],
  'Jeddah': [21.29, 39.24],
  'Medina': [24.47, 39.61],
  'Sanaa': [15.35, 44.21],
  'Amman': [31.96, 35.95],
  'Beirut': [33.89, 35.51],
  'Latakia': [35.52, 35.78],
  'Homs': [34.73, 36.71],
  'Mosul': [36.34, 43.12],
  'Kirkuk': [35.47, 44.39],
  'Erbil': [36.19, 44.01],
  'Sulaymaniyah': [35.56, 45.44],
  'Najaf': [32.01, 44.34],
  'Karbala': [32.62, 44.02],
  'Nasiriyah': [31.06, 46.27],

  // African expansion
  'Casablanca': [33.57, -7.59],
  'Rabat': [34.01, -6.83],
  'Tangier': [35.76, -5.83],
  'Algiers': [36.74, 3.06],
  'Oran': [35.70, -0.63],
  'Constantine': [36.37, 6.61],
  'Benghazi': [32.12, 20.09],
  'Aswan': [24.09, 32.90],
  'Luxor': [25.69, 32.64],
  'Port Said': [31.26, 32.30],
  'Suez': [29.97, 32.55],
  'Khartoum': [15.50, 32.56],
  'Omdurman': [15.64, 32.48],
  'Port Sudan': [19.62, 37.22],
  'Asmara': [15.32, 38.93],
  'Addis Ababa': [9.15, 38.77],
  'Dire Dawa': [9.60, 41.87],
  'Harar': [9.31, 42.12],
  'Djibouti City': [11.83, 42.59],
  'Berbera': [10.44, 45.01],
  'Hargeisa': [9.56, 44.07],
  'Nairobi': [-1.29, 36.82],
  'Mombasa': [-4.05, 39.66],
  'Kampala': [0.35, 32.58],
  'Entebbe': [0.05, 32.48],
  'Kigali': [-1.97, 30.10],
  'Bujumbura': [-3.36, 29.36],
  'Dar es Salaam': [-6.82, 39.27],
  'Dodoma': [-6.16, 35.75],
  'Lusaka': [-15.39, 28.32],
  'Harare': [-17.82, 31.03],
  'Bulawayo': [-20.15, 28.58],
  'Maputo': [-25.97, 32.59],
  'Beira': [-19.84, 34.84],
  'Antananarivo': [-18.88, 47.51],
  'Toamasina': [-18.17, 49.40],
  'Port Louis': [-20.16, 57.50],
  'Windhoek': [-22.56, 17.08],
  'Gaborone': [-24.66, 25.91],
  'Johannesburg': [-26.20, 28.05],
  'Pretoria': [-25.75, 28.19],
  'Durban': [-29.86, 31.03],
  'Port Elizabeth': [-33.92, 25.57],
  'Luanda': [-8.84, 13.23],
  'Kinshasa': [-4.44, 15.27],
  'Lubumbashi': [-11.66, 27.48],
  'Brazzaville': [-4.27, 15.24],
  'Yaoundé': [3.87, 11.52],
  'Douala': [4.05, 9.77],
  'Libreville': [0.42, 9.45],
  'Lagos': [6.52, 3.38],
  'Ibadan': [7.38, 3.93],
  'Abuja': [9.08, 7.40],
  'Port Harcourt': [4.78, 7.00],
  'Accra': [5.60, -0.19],
  'Kumasi': [6.69, -1.62],
  'Abidjan': [5.36, -4.01],
  'Yamoussoukro': [6.83, -5.28],
  'Ouagadougou': [12.37, -1.53],
  'Bamako': [12.64, -8.00],
  'Dakar': [14.76, -17.37],
  'Nouakchott': [18.09, -15.98],
  'Conakry': [9.64, -13.58],
  'Freetown': [8.47, -13.23],
  'Monrovia': [6.29, -10.76],
  'Bissau': [11.85, -15.60],
  'Banjul': [13.45, -16.58],

  // North American expansion
  'Vancouver': [49.28, -123.12],
  'Calgary': [51.05, -114.07],
  'Edmonton': [53.54, -113.49],
  'Winnipeg': [49.90, -97.14],
  'Toronto': [43.65, -79.38],
  'Ottawa': [45.42, -75.70],
  'Detroit': [42.33, -83.05],
  'Chicago': [41.88, -87.63],
  'Milwaukee': [43.04, -87.91],
  'Minneapolis': [44.98, -93.27],
  'St. Louis': [38.63, -90.20],
  'Kansas City': [39.10, -94.58],
  'Denver': [39.74, -104.99],
  'Salt Lake City': [40.76, -111.89],
  'Phoenix': [33.45, -112.07],
  'Las Vegas': [36.17, -115.14],
  'Los Angeles': [34.05, -118.24],
  'San Diego': [32.72, -117.16],
  'San Francisco': [37.77, -122.42],
  'Sacramento': [38.58, -121.49],
  'Portland': [45.52, -122.68],
  'Seattle': [47.61, -122.33],
  'Anchorage': [61.22, -149.90],
  'Dallas': [32.78, -96.81],
  'Houston': [29.76, -95.37],
  'San Antonio': [29.42, -98.49],
  'Austin': [30.27, -97.74],
  'New Orleans': [29.95, -90.07],
  'Memphis': [35.15, -90.05],
  'Nashville': [36.16, -86.78],
  'Atlanta': [33.75, -84.39],
  'Charlotte': [35.23, -80.84],
  'Miami': [25.76, -80.19],
  'Tampa': [27.95, -82.46],
  'Orlando': [28.54, -81.38],
  'Jacksonville': [30.33, -81.66],
  'Savannah': [32.08, -81.09],
  'Charleston': [32.78, -79.93],
  'Richmond': [37.54, -77.44],
  'Washington': [38.91, -77.04],
  'Baltimore': [39.29, -76.61],
  'Pittsburgh': [40.44, -79.99],
  'Cleveland': [41.50, -81.69],
  'Cincinnati': [39.10, -84.51],
  'Indianapolis': [39.77, -86.16],
  'Columbus': [39.96, -82.99],
  'Buffalo': [42.89, -78.88],
  'Albany': [42.65, -73.75],
  'Hartford': [41.76, -72.69],
  'Providence': [41.82, -71.41],
  'Portland': [43.66, -70.26],

  // Central and South American expansion
  'Guatemala City': [14.63, -90.51],
  'San Salvador': [13.69, -89.22],
  'Tegucigalpa': [14.07, -87.19],
  'Managua': [12.11, -86.24],
  'San José': [9.93, -84.09],
  'Bogotá': [4.71, -74.07],
  'Medellín': [6.25, -75.56],
  'Cali': [3.44, -76.52],
  'Barranquilla': [10.96, -74.80],
  'Maracaibo': [10.64, -71.61],
  'Valencia': [10.16, -68.01],
  'Georgetown': [6.80, -58.16],
  'Paramaribo': [5.87, -55.17],
  'Cayenne': [4.93, -52.33],
  'Belém': [-1.46, -48.50],
  'Manaus': [-3.12, -60.02],
  'Fortaleza': [-3.73, -38.53],
  'Recife': [-8.05, -34.90],
  'Brasília': [-15.83, -47.86],
  'Belo Horizonte': [-19.92, -43.94],
  'São Paulo': [-23.55, -46.64],
  'Curitiba': [-25.43, -49.27],
  'Porto Alegre': [-30.03, -51.23],
  'Montevideo': [-34.91, -56.16],
  'Asunción': [-25.30, -57.64],
  'Santa Cruz': [-17.81, -63.18],
  'Sucre': [-19.03, -65.26],
  'Arequipa': [-16.41, -71.54],
  'Trujillo': [-8.11, -79.03],
  'Guayaquil': [-2.17, -79.92],
  'Valparaíso': [-33.05, -71.63],
  'Concepción': [-36.83, -73.05],
  'Mendoza': [-32.89, -68.85],
  'Córdoba': [-31.42, -64.19],
  'Rosario': [-32.94, -60.65],
  'Mar del Plata': [-38.00, -57.56]
};

// Map region names to approximate coordinates [longitude, latitude] (fallback)
const REGION_COORDINATES: Record<string, [number, number]> = {
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
  'Catalonian Hills': [2.17, 41.38],
  'Galicia': [-8.55, 42.88],
  'Edinburgh': [-3.19, 55.95],
  'British Isles': [-3.44, 53.41],
  'Irish Sea': [-5.93, 53.35],
  'Leinster Plain': [-6.26, 53.35],
  'Canterbury Plains': [1.08, 51.28],
  'Oxfordshire': [-1.26, 51.75],

  // Europe - Northern
  'Scandinavia': [18.0686, 59.3293],
  'Stockholm Archipelago': [18.07, 59.33],
  'Norwegian Fjords': [5.32, 60.39],
  'Hamburg Coast': [9.99, 53.55],
  'Brandenburg Plain': [13.41, 52.52],
  'Flanders Fields': [3.13, 50.82],
  'Scheldt Basin': [4.35, 51.22],
  'Zuiderzee Coast': [5.38, 52.63],
  'Iceland': [-21.94, 64.15],
  'Øresund Strait': [12.68, 55.68],

  // Europe - Central/Eastern
  'Central Europe': [19.04, 47.5],
  'Eastern Europe': [21.0122, 52.2297],
  'Vienna Basin': [16.37, 48.21],
  'Bohemian Plateau': [14.44, 50.08],
  'Carpathian Foothills': [22.0, 48.0],
  'Danube Bend': [19.04, 47.79],
  'Vistula River': [21.01, 52.23],
  'Moscow Basin': [37.62, 55.75],
  'Novgorod Woods': [31.28, 58.52],
  'Volga Bend': [44.5, 48.71],
  'Dnieper River Valley': [30.52, 50.45],
  'Transylvania': [23.6, 46.77],
  'Ural and Arctic Europe': [60.0, 67.0],

  // Europe - Mediterranean
  'Venice': [12.3155, 45.4408],
  'Venetian Lagoon': [12.34, 45.44],
  'Po Valley': [11.0, 45.0],
  'Apennine Foothills': [11.26, 43.77],
  'Florence Hills': [11.26, 43.77],
  'Bay of Naples': [14.26, 40.85],
  'Ligurian Coast': [8.95, 44.41],
  'Greece': [23.7275, 37.9838],
  'Athens Basin': [23.73, 37.98],
  'Peloponnesian Hills': [22.0, 37.5],
  'Thessalian Plain': [22.0, 39.5],
  'Thracian Plain': [26.0, 41.5],
  'Bosporus Straits': [29.0, 41.0],
  'Dalmatian Coast': [16.44, 43.51],
  'Crete': [25.13, 35.31],
  'Cyprus': [33.43, 35.13],
  'Rhodes': [28.23, 36.43],

  // North America
  'Valley of Mexico': [-99.13, 19.43],
  'Yucatan Peninsula': [-89.0, 20.0],
  'Yucatán Peninsula': [-89.0, 20.0],
  'Mayan Lowlands': [-90.0, 17.0],
  'Oaxaca Highlands': [-96.73, 17.07],
  'Central America': [-85.0, 12.0],
  'Eastern Seaboard': [-74.0060, 40.7128],
  'Boston Harbor': [-71.06, 42.36],
  'Cape Cod': [-70.2, 41.7],
  'Long Island': [-73.13, 40.79],
  'Hudson River Valley': [-73.95, 41.7],
  'Champlain Valley': [-73.45, 44.5],
  'Delaware River Valley': [-75.16, 39.95],
  'Chesapeake Bay': [-76.0, 37.5],
  'Great Lakes': [-87.6298, 41.8781],
  'Great Lakes Shoreline': [-83.05, 42.33],
  'Cahokia Mounds': [-90.06, 38.66],
  'Mississippi River': [-90.0715, 29.9511],
  'Lower Mississippi Delta': [-90.08, 29.95],
  'Platte River Basin': [-100.0, 41.0],
  'Southwest': [-112.0740, 33.4484],
  'Colorado Plateau': [-111.0, 37.0],
  'Texas Hill Country': [-99.0, 30.0],
  'Gulf Coast Texas': [-95.37, 29.76],
  'California Coast': [-118.2437, 34.0522],
  'Los Angeles Basin': [-118.24, 34.05],
  'San Diego Bay': [-117.16, 32.72],
  'San Francisco Bay': [-122.42, 37.77],
  'Monterey Bay': [-121.89, 36.62],
  'Pacific Coast Ranges': [-122.0, 40.0],
  'Pacific Northwest': [-122.3321, 47.6062],
  'Puget Sound': [-122.33, 47.61],
  'St. Lawrence River': [-71.21, 46.81],
  'Hudson Bay': [-86.0, 60.0],

  // Caribbean
  'The Caribbean': [-69.0, 15.0],
  'Cuba': [-79.0, 22.0],
  'Jamaica': [-77.3, 18.1],
  'Hispaniola': [-71.0, 19.0],
  'Greater Antilles': [-70.0, 18.0],
  'Mosquito Coast': [-83.0, 14.0],
  'Caribbean Coast': [-74.7813, 10.9685],

  // South America
  'Amazon Basin': [-60.0217, -3.1190],
  'Amazon Delta': [-50.0, -0.5],
  'Manaus Region': [-60.02, -3.12],
  'Orinoco Delta': [-61.0, 9.0],
  'Guyana Highlands': [-61.0, 5.0],
  'Andes Mountains': [-71.5430, -33.4489],
  'Cajamarca Highlands': [-77.04, -12.05],
  'Cuzco Valley': [-71.97, -13.52],
  'Lake Titicaca Basin': [-69.0, -16.0],
  'Quito Plateau': [-78.47, -0.18],
  'Potosí Region': [-65.75, -19.58],
  'Pampas': [-58.3816, -34.6037],
  'Pampas Grasslands': [-58.38, -34.6],
  'Rio de Janeiro Bay': [-43.2, -22.91],
  'São Paulo Plateau': [-46.64, -23.55],
  'Chilean Coast': [-70.64, -33.45],
  'Altiplano': [-68.0, -16.5],
  'Tierra del Fuego': [-68.3, -54.8],

  // Africa
  'North Africa': [3.0588, 36.7538],
  'Nile Delta': [31.2357, 30.0444],
  'Nile Valley': [32.0, 25.0],
  'Alexandria Coast': [29.92, 31.2],
  'Thebes Valley': [32.65, 25.7],
  'Nubian Corridor': [32.0, 22.0],
  'Sahara Desert': [10.0, 20.0],
  'Central Sahara': [10.0, 20.0],
  'Tunisian Sahel': [10.64, 35.83],
  'Fez Plateau': [-5.0, 34.03],
  'Rif Coast': [-3.0, 35.2],
  'West Africa': [-1.5247, 12.3714],
  'Timbuktu Basin': [-3.01, 16.78],
  'Niger Bend': [0.0, 16.0],
  'Cape Coast': [-1.24, 5.11],
  'Gold Coast Savanna': [-1.0, 7.0],
  'Ivory Coast': [-5.0, 6.8],
  'Lagos Coastal Belt': [3.4, 6.45],
  'Ashanti Forest': [-1.62, 6.69],
  'Ibo Plateau': [7.5, 6.5],
  'Sahelian Scrublands': [-2.0, 14.0],
  'East Africa': [36.8219, -1.2921],
  'Congo River Bend': [18.0, -1.0],
  'Lake Victoria Basin': [33.0, -1.0],
  'Serengeti Plain': [34.8, -2.33],
  'Swahili Coast': [39.67, -4.06],
  'Zambezi Floodplain': [28.0, -15.0],
  'Limpopo Valley': [29.0, -23.0],
  'Kalahari Basin': [23.0, -22.0],
  'Highlands of Madagascar': [47.5, -19.0],
  'Southern Africa': [28.0473, -26.2041],

  // Middle East
  'Mesopotamia': [44.3661, 33.3152],
  'Babylon Region': [44.42, 32.54],
  'Diyala Valley': [44.8, 34.0],
  'Tigris–Euphrates Confluence': [47.45, 31.0],
  'Jerusalem Hills': [35.22, 31.78],
  'Bekaa Valley': [35.9, 33.85],
  'Cilician Plain': [35.32, 36.8],
  'Anatolia': [32.86, 39.92],  // Central Turkey
  'Anatolian Plateau': [32.86, 39.92],  // Central Turkey
  'Western Anatolia': [28.0, 39.0],  // Western Turkey
  'Eastern Anatolia': [41.0, 39.5],  // Eastern Turkey
  'Cappadocia': [34.8, 38.6],  // Central Anatolia
  'Levant': [35.2137, 31.7683],
  'Arabian Peninsula': [46.6753, 24.7136],
  'Hejaz Mountains': [40.5, 24.0],
  'Hejaz Interior': [40.5, 23.0],
  'Empty Quarter': [50.0, 20.0],
  'Persian Gulf': [50.5577, 26.0667],
  'Fars Province': [52.53, 29.61],
  'Isfahan Basin': [51.67, 32.65],
  'Shiraz Valley': [52.53, 29.61],

  // Central/South Asia
  'Delhi Region': [77.21, 28.61],
  'Punjab Plains': [74.34, 31.55],
  'Kashmir Valley': [75.0, 34.0],
  'Harappa Basin': [72.87, 30.63],
  'Sindh River Delta': [67.0, 24.86],
  'Gangetic Plain': [80.95, 26.85],
  'Varanasi Basin': [82.97, 25.32],
  'Ganges River': [78.9629, 20.5937],
  'Coromandel Coast': [80.27, 13.08],
  'Malabar Coast': [75.8, 11.25],
  'Western Ghats': [77.0, 11.0],
  'Deccan Plateau': [78.4867, 17.3850],
  'Karnataka Plateau': [76.0, 14.0],
  'Kandy Plateau': [80.64, 7.29],
  'Sundarbans Delta': [89.0, 22.0],
  'Tibetan Plateau': [91.13, 29.65],
  'Kazakh Steppes': [71.4, 51.17],
  'Ferghana Valley': [71.78, 40.38],
  'Samarkand Region': [66.98, 39.66],
  'Transoxiana': [64.0, 40.0],
  'Mongolian Steppes': [103.85, 46.86],
  'Gobi Desert': [105.0, 42.0],
  'Altai Mountains': [88.0, 49.0],
  'Central Asia': [71.4389, 51.1694],

  // East Asia
  'North China Plain': [116.4074, 39.9042],
  'Beijing Basin': [116.41, 39.9],
  'Yellow River Valley': [112.45, 34.68],
  'Yangtze River': [121.4737, 31.2304],
  'Yangtze Delta': [121.47, 31.23],
  'Yangtze Gorges': [110.0, 30.0],
  'Pearl River Delta': [113.26, 23.13],
  'Manchurian Plain': [125.0, 45.0],
  'Korean Peninsula': [127.0, 37.5],
  'Han River Valley': [126.98, 37.57],
  'Gyeongju Basin': [129.22, 35.84],
  'Japan': [139.6503, 35.6762],
  'Edo Plain': [139.69, 35.68],
  'Kyoto Basin': [135.77, 35.01],
  'Nara Uplands': [135.8, 34.69],
  'Inland Sea Coast': [133.0, 34.0],
  'Kyushu Island': [130.0, 33.0],
  'Hokkaido': [142.0, 43.0],
  'Western Siberia': [73.0, 58.0],
  'Siberia': [105.0, 60.0],

  // Southeast Asia
  'Southeast Asia': [106.8650, 10.8231],
  'Chao Phraya Basin': [100.5, 13.75],
  'Irrawaddy Valley': [95.0, 20.0],
  'Mekong River Basin': [105.0, 12.0],
  'Red River Delta': [105.85, 21.03],
  'Tonle Sap Basin': [104.0, 13.0],
  'Strait of Malacca': [100.0, 2.5],
  'Sumatra Highlands': [101.0, 0.0],
  'Java Sea': [110.0, -6.0],
  'East Java Coast': [112.75, -7.25],
  'West Java Coast': [106.85, -6.21],
  'Luzon Highlands': [121.0, 16.0],

  // Oceania
  'Australia': [133.7751, -25.2744],
  'Sydney Basin': [151.21, -33.87],
  'Murray River Valley': [143.0, -35.0],
  'New Zealand': [174.7633, -36.8485],
  'New Guinea Highlands': [143.0, -6.0],
  'Sepik River Basin': [142.0, -4.0],
  'Indonesia': [106.8456, -6.2088],
  'Fiji Islands': [178.0, -18.0],
  'Society Islands': [-149.4, -17.65],
  'Big Island Highlands': [-155.5, 19.5],
  'Azores': [-25.67, 37.74],

  // Default fallback
  'default': [0, 0]
};

const REGION_COLORS: Record<string, string> = {
  'Europe': '#4F46E5',
  'North America': '#059669',
  'South America': '#DC2626',
  'MENA': '#D97706',
  'Sub-Saharan Africa': '#7C3AED',
  'South Asia': '#0891B2',
  'East Asia': '#DB2777',
  'Oceania': '#65A30D'
};

const CityMapGlobe: React.FC<CityMapProps> = ({ isOpen, onClose, currentGameYear = -3000, playerLocation }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const worldDataRef = useRef<any>(null);
  const [selectedCity, setSelectedCity] = useState<CityNode | null>(null);
  const [currentYear, setCurrentYear] = useState(currentGameYear);
  const [isPlaying, setIsPlaying] = useState(false);
  // Initialize rotation to center on player location
  const initialRotation = useMemo(() => {
    if (playerLocation) {
      const coords = REGION_COORDINATES[playerLocation] || REGION_COORDINATES['default'];
      // D3 rotation is [-longitude, -latitude, 0] to center a point
      return [-coords[0], -coords[1], 0] as [number, number, number];
    }
    return [0, 0, 0] as [number, number, number];
  }, [playerLocation]);

  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]); // Start with full globe view
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [scale, setScale] = useState(0.3); // Start zoomed out
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'zooming' | 'rotating' | 'completed'>('idle');
  const [showCityPanel, setShowCityPanel] = useState(false);
  const [hasCompletedInitialAnimation, setHasCompletedInitialAnimation] = useState(false);

  // Get current allegiance for a city based on year
  const getAllegiance = useCallback((allegianceHistory: { [year: number]: string } | undefined, currentYear: number) => {
    if (!allegianceHistory) return null;

    const years = Object.keys(allegianceHistory)
      .map(Number)
      .sort((a, b) => a - b);

    // Find the most recent allegiance that started before or at the current year
    let currentAllegiance = null;
    for (const year of years) {
      if (year <= currentYear) {
        currentAllegiance = allegianceHistory[year];
      } else {
        break;
      }
    }
    return currentAllegiance;
  }, []);

  // Process cities data
  const cityNodes = useMemo(() => {
    const nodes: CityNode[] = [];

    // Process all cities from CITIES_DATA
    Object.entries(CITIES_DATA).forEach(([mapArea, cities]) => {
      cities.forEach(city => {
        // First try to get exact city coordinates
        const cityCoords = CITY_COORDINATES[city.name];

        // If no exact match, try fallback to region coordinates
        const regionCoords = REGION_COORDINATES[mapArea];

        if (cityCoords) {
          // Use exact coordinates (lat, lng format)
          const allegiance = getAllegiance(city.allegianceHistory, currentYear);
          nodes.push({
            id: `${mapArea}-${city.name}`,
            name: city.name,
            mapArea,
            coordinates: [cityCoords[1], cityCoords[0]], // Convert to [lng, lat] for D3
            foundingYear: city.foundingYear,
            declineYear: city.declineYear,
            zone: mapArea,
            region: mapArea,
            isActive: currentYear >= city.foundingYear &&
                     (!city.declineYear || currentYear <= city.declineYear),
            importance: Math.log((city.populationPeak || 10000) / 1000),
            allegiance,
            allegianceHistory: city.allegianceHistory,
            economicFocus: city.economicFocus
          });
        } else if (regionCoords && regionCoords[0] !== 0 && regionCoords[1] !== 0) {
          // Use region coordinates with small random offset, but skip default [0,0]
          const offset = 2;
          const lon = regionCoords[0] + (Math.random() - 0.5) * offset;
          const lat = regionCoords[1] + (Math.random() - 0.5) * offset;

          const allegiance = getAllegiance(city.allegianceHistory, currentYear);
          nodes.push({
            id: `${mapArea}-${city.name}`,
            name: city.name,
            mapArea,
            coordinates: [lon, lat],
            foundingYear: city.foundingYear,
            declineYear: city.declineYear,
            zone: mapArea,
            region: mapArea,
            isActive: currentYear >= city.foundingYear &&
                     (!city.declineYear || currentYear <= city.declineYear),
            importance: Math.log((city.populationPeak || 10000) / 1000),
            allegiance,
            allegianceHistory: city.allegianceHistory,
            economicFocus: city.economicFocus
          });
        }
        // Skip cities that would end up at [0,0] coordinates
      });
    });

    return nodes;
  }, [currentYear, getAllegiance]);

  // Filter active cities
  const activeCities = useMemo(() => {
    return cityNodes.filter(city => city.isActive);
  }, [cityNodes]);

  // Get unique factions currently visible
  const currentFactions = useMemo(() => {
    const factions = new Map<string, { color: string; count: number }>();
    activeCities.forEach(city => {
      if (city.allegiance && FACTION_ICONS[city.allegiance]) {
        const faction = FACTION_ICONS[city.allegiance];
        if (factions.has(city.allegiance)) {
          const existing = factions.get(city.allegiance)!;
          existing.count++;
        } else {
          factions.set(city.allegiance, { color: faction.color, count: 1 });
        }
      }
    });
    return Array.from(factions.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10); // Show top 10 factions
  }, [activeCities]);

  // Directional navigation: find nearest city in each direction
  const findNearestCityInDirection = useCallback((direction: 'north' | 'south' | 'east' | 'west') => {
    if (!selectedCity) return null;

    const currentCoords = selectedCity.coordinates; // [lng, lat]
    const candidates = activeCities.filter(city => city.id !== selectedCity.id);

    let bestCity: CityNode | null = null;
    let bestDistance = Infinity;

    candidates.forEach(city => {
      const cityCoords = city.coordinates; // [lng, lat]
      const latDiff = cityCoords[1] - currentCoords[1]; // latitude difference
      const lngDiff = cityCoords[0] - currentCoords[0]; // longitude difference

      let isValidDirection = false;

      switch (direction) {
        case 'north':
          isValidDirection = latDiff > 0 && Math.abs(latDiff) > Math.abs(lngDiff);
          break;
        case 'south':
          isValidDirection = latDiff < 0 && Math.abs(latDiff) > Math.abs(lngDiff);
          break;
        case 'east':
          isValidDirection = lngDiff > 0 && Math.abs(lngDiff) > Math.abs(latDiff);
          break;
        case 'west':
          isValidDirection = lngDiff < 0 && Math.abs(lngDiff) > Math.abs(latDiff);
          break;
      }

      if (isValidDirection) {
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestCity = city;
        }
      }
    });

    return bestCity;
  }, [selectedCity, activeCities]);

  // Navigate to city in direction
  const navigateToDirection = useCallback((direction: 'north' | 'south' | 'east' | 'west') => {
    const targetCity = findNearestCityInDirection(direction);
    if (targetCity) {
      // Animate rotation to new city
      const targetRotation: [number, number, number] = [
        -targetCity.coordinates[0],
        -targetCity.coordinates[1],
        0
      ];

      setIsAnimating(true);
      let progress = 0;
      const duration = 1000;

      const animateRotation = () => {
        progress += 50;
        const t = Math.min(progress / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        const currentRot = rotation;
        const newRotation: [number, number, number] = [
          currentRot[0] + (targetRotation[0] - currentRot[0]) * eased,
          currentRot[1] + (targetRotation[1] - currentRot[1]) * eased,
          0
        ];
        setRotation(newRotation);

        if (t < 1) {
          setTimeout(animateRotation, 50);
        } else {
          setSelectedCity(targetCity);
          setIsAnimating(false);
        }
      };

      animateRotation();
    }
  }, [findNearestCityInDirection, rotation]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!showCityPanel || isAnimating) return;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          navigateToDirection('north');
          break;
        case 'ArrowDown':
          event.preventDefault();
          navigateToDirection('south');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          navigateToDirection('west');
          break;
        case 'ArrowRight':
          event.preventDefault();
          navigateToDirection('east');
          break;
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [isOpen, showCityPanel, isAnimating, navigateToDirection]);

  // Opening animation sequence: full globe -> zoom to nearest city -> show panel
  useEffect(() => {
    console.log('Opening animation check:', {
      isOpen,
      isAnimating,
      activeCitiesCount: activeCities.length,
      hasCompletedInitialAnimation,
      playerLocation
    });
    if (!isOpen || isAnimating || activeCities.length === 0 || hasCompletedInitialAnimation) return;

    console.log('Active cities:', activeCities.map(c => ({ name: c.name, coords: c.coordinates })).slice(0, 5));

    const nearestCity = (() => {
      if (playerLocation) {
        // Get player coordinates from REGION_COORDINATES
        let playerCoords = REGION_COORDINATES[playerLocation];
        console.log('Player location:', playerLocation, 'Coords:', playerCoords);

        // If exact match not found, try to find a partial match
        if (!playerCoords) {
          const regionKeys = Object.keys(REGION_COORDINATES);
          const partialMatch = regionKeys.find(key =>
            key.toLowerCase().includes(playerLocation.toLowerCase()) ||
            playerLocation.toLowerCase().includes(key.toLowerCase())
          );
          if (partialMatch) {
            playerCoords = REGION_COORDINATES[partialMatch];
            console.log('Found partial match:', partialMatch, 'Coords:', playerCoords);
          }
        }

        if (!playerCoords || (playerCoords[0] === 0 && playerCoords[1] === 0)) {
          console.log('No valid coordinates found for', playerLocation, '- finding closest region name match');
          // Instead of using first city, use a default Mediterranean location
          playerCoords = [28.0, 39.0]; // Near Turkey/Anatolia as a better default
        }

        // Convert to [lng, lat] format for comparison
        const playerLng = playerCoords[0];
        const playerLat = playerCoords[1];

        // Find the actual nearest city by distance
        let nearestCity: CityNode | null = null;
        let minDistance = Infinity;

        activeCities.forEach(city => {
          // Calculate distance using simple Euclidean distance (good enough for finding nearest)
          const cityLng = city.coordinates[0];
          const cityLat = city.coordinates[1];
          const distance = Math.sqrt(
            Math.pow(cityLng - playerLng, 2) +
            Math.pow(cityLat - playerLat, 2)
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestCity = city;
          }
        });

        console.log('Selected nearest city:', nearestCity?.name, 'at distance:', minDistance);
        console.log('Top 5 nearest cities:', activeCities
          .map(c => ({
            name: c.name,
            distance: Math.sqrt(
              Math.pow(c.coordinates[0] - playerLng, 2) +
              Math.pow(c.coordinates[1] - playerLat, 2)
            )
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5)
        );

        return nearestCity || activeCities[0]; // Still need a fallback
      }
      // If no player location, pick a city near the center of the old world
      const defaultCoords = [28.0, 39.0]; // Mediterranean center
      return activeCities.reduce((closest, city) => {
        const dist = Math.sqrt(
          Math.pow(city.coordinates[0] - defaultCoords[0], 2) +
          Math.pow(city.coordinates[1] - defaultCoords[1], 2)
        );
        const closestDist = Math.sqrt(
          Math.pow(closest.coordinates[0] - defaultCoords[0], 2) +
          Math.pow(closest.coordinates[1] - defaultCoords[1], 2)
        );
        return dist < closestDist ? city : closest;
      }, activeCities[0])
    })();

    if (!nearestCity) return;

    setIsAnimating(true);
    setAnimationPhase('zooming');

    // Phase 1: Zoom in while showing full globe (2 seconds)
    const zoomAnimation = () => {
      let progress = 0;
      const zoomDuration = 2000;
      const startScale = 0.3;
      const endScale = 1.0;

      const zoomInterval = setInterval(() => {
        progress += 50;
        const t = Math.min(progress / zoomDuration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // Ease out cubic

        const newScale = startScale + (endScale - startScale) * eased;
        setScale(newScale);

        if (t >= 1) {
          clearInterval(zoomInterval);
          setAnimationPhase('rotating');

          // Phase 2: Rotate to center on nearest city (1.5 seconds)
          setTimeout(() => {
            const targetRotation: [number, number, number] = [
              -nearestCity.coordinates[0], // longitude
              -nearestCity.coordinates[1], // latitude
              0
            ];

            let rotProgress = 0;
            const rotateDuration = 1500;

            const rotateInterval = setInterval(() => {
              rotProgress += 50;
              const rt = Math.min(rotProgress / rotateDuration, 1);
              const rEased = 1 - Math.pow(1 - rt, 3);

              const currentRot = rotation;
              const newRotation: [number, number, number] = [
                currentRot[0] + (targetRotation[0] - currentRot[0]) * rEased,
                currentRot[1] + (targetRotation[1] - currentRot[1]) * rEased,
                0
              ];
              setRotation(newRotation);

              if (rt >= 1) {
                clearInterval(rotateInterval);
                setAnimationPhase('completed');

                // Phase 3: Select city and show panel (0.5 second delay)
                setTimeout(() => {
                  setSelectedCity(nearestCity);
                  setShowCityPanel(true);
                  setIsAnimating(false);
                  setHasCompletedInitialAnimation(true);
                }, 500);
              }
            }, 50);
          }, 200);
        }
      }, 50);
    };

    // Start animation after a brief delay
    setTimeout(zoomAnimation, 500);
  }, [isOpen, activeCities, playerLocation, isAnimating, hasCompletedInitialAnimation]);

  // Load world data once
  useEffect(() => {
    if (!worldDataRef.current) {
      d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(data => {
        worldDataRef.current = data;
      });
    }
  }, []);

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

    // Draw ocean
    g.append('path')
      .datum({ type: 'Sphere' })
      .attr('class', 'ocean')
      .attr('d', path as any)
      .attr('fill', '#0a1929')
      .attr('stroke', '#1e3a5f')
      .attr('stroke-width', 2);

    // Draw graticule
    const graticule = d3.geoGraticule().step([20, 20]);
    g.append('path')
      .datum(graticule())
      .attr('class', 'graticule')
      .attr('d', path as any)
      .attr('fill', 'none')
      .attr('stroke', '#1e3a5f')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.3);


    // Draw actual world map from TopoJSON data
    const countries = topojson.feature(worldDataRef.current, worldDataRef.current.objects.countries) as any;

    g.selectAll('.land')
      .data(countries.features)
      .enter().append('path')
      .attr('class', 'land')
      .attr('d', path as any)
      .attr('fill', '#1a2f4a')
      .attr('stroke', '#2a4f7a')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.5);

    // Draw cities - only show cities on the visible (front) side of the globe
    const visibleCities = activeCities.filter(city => {
      const projected = projection(city.coordinates);
      if (!projected) return false;

      // Check if city is on the visible side of the globe using geoDistance
      // rotation[0] is longitude, rotation[1] is latitude of center
      const centerPoint = [-rotation[0], -rotation[1]]; // Center of visible hemisphere
      const cityPoint = city.coordinates; // [lng, lat]

      // If distance is > 90 degrees (π/2 radians), city is on the back side
      const distance = d3.geoDistance(centerPoint, cityPoint);
      return distance <= Math.PI / 2;
    });

    // City points with faction colors
    g.selectAll('.city')
      .data(visibleCities)
      .enter().append('circle')
      .attr('class', 'city')
      .attr('cx', d => projection(d.coordinates)?.[0] || 0)
      .attr('cy', d => projection(d.coordinates)?.[1] || 0)
      .attr('r', d => 2 + Math.sqrt(d.importance))
      .attr('fill', d => {
        // Use faction color if city has allegiance, otherwise use region color
        if (d.allegiance && FACTION_ICONS[d.allegiance]) {
          return FACTION_ICONS[d.allegiance].color;
        }
        return REGION_COLORS[d.zone] || '#64748B';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .attr('opacity', d => d.isActive ? 0.9 : 0.4)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedCity(d);
        setShowCityPanel(true);
      })
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', (d as any).importance + 6)
          .attr('stroke-width', 2);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d => 2 + Math.sqrt((d as any).importance))
          .attr('stroke-width', 0.5);
      });

    // City labels for important cities
    g.selectAll('.city-label')
      .data(visibleCities.filter(c => c.importance > 3 && scale > 0.8))
      .enter().append('text')
      .attr('class', 'city-label')
      .attr('x', d => (projection(d.coordinates)?.[0] || 0) + 5)
      .attr('y', d => (projection(d.coordinates)?.[1] || 0) - 5)
      .text(d => d.name)
      .attr('font-size', '10px')
      .attr('fill', '#fff')
      .attr('opacity', d => d.isActive ? 1 : 0.4)
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
      .style('pointer-events', 'none');

    // Highlight circle for selected city
    if (selectedCity) {
      const selectedProjected = projection(selectedCity.coordinates);
      if (selectedProjected) {
        // Check if selected city is visible
        const centerPoint = [-rotation[0], -rotation[1]];
        const distance = d3.geoDistance(centerPoint, selectedCity.coordinates);

        if (distance <= Math.PI / 2) {
          g.append('circle')
            .attr('class', 'city-highlight')
            .attr('cx', selectedProjected[0])
            .attr('cy', selectedProjected[1])
            .attr('r', 15)
            .attr('fill', 'none')
            .attr('stroke', '#fbbf24')
            .attr('stroke-width', 3)
            .attr('opacity', 0.8)
            .style('pointer-events', 'none');

          // Pulsing animation
          g.append('circle')
            .attr('class', 'city-highlight-pulse')
            .attr('cx', selectedProjected[0])
            .attr('cy', selectedProjected[1])
            .attr('r', 15)
            .attr('fill', 'none')
            .attr('stroke', '#fbbf24')
            .attr('stroke-width', 2)
            .attr('opacity', 0.6)
            .style('pointer-events', 'none')
            .transition()
            .duration(2000)
            .ease(d3.easeSinInOut)
            .attr('r', 25)
            .attr('opacity', 0)
            .on('end', function() {
              // Restart the pulse
              d3.select(this)
                .attr('r', 15)
                .attr('opacity', 0.6)
                .transition()
                .duration(2000)
                .ease(d3.easeSinInOut)
                .attr('r', 25)
                .attr('opacity', 0);
            });
        }
      }
    }

  }, [activeCities, isOpen, rotation, scale, selectedCity, worldDataRef.current]);

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

  // Auto-rotate to player location on mount
  useEffect(() => {
    if (playerLocation && isOpen) {
      const coords = REGION_COORDINATES[playerLocation];
      if (coords) {
        setRotation([-coords[0], -coords[1], 0]);
      }
    }
  }, [playerLocation, isOpen]);

  // Animation
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentYear(prev => {
        const next = prev + 10;
        if (next > 2024) {
          setIsPlaying(false);
          return 2024;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-4">
            <Globe className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold text-white">Cities of the World</h2>
              <p className="text-slate-400">
                {activeCities.length} active cities • {currentFactions.length} empires • {currentYear < 0 ? `${Math.abs(currentYear)} BCE` : `${currentYear} CE`}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Controls */}
        <div className="px-6 py-3 border-b border-slate-700 flex items-center gap-4 bg-slate-800/50">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-lg ${isPlaying ? 'bg-red-600' : 'bg-green-600'} text-white`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <input
            type="range"
            min={-3000}
            max={2024}
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="flex-1"
          />

          <span className="text-white font-mono min-w-[100px] text-center">
            {currentYear < 0 ? `${Math.abs(currentYear)} BCE` : `${currentYear} CE`}
          </span>

          <div className="flex items-center gap-2">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-2 bg-slate-700 rounded hover:bg-slate-600">
              <ZoomOut className="w-4 h-4 text-white" />
            </button>
            <span className="text-white w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-2 bg-slate-700 rounded hover:bg-slate-600">
              <ZoomIn className="w-4 h-4 text-white" />
            </button>
            <button onClick={() => { setScale(1); setRotation([0, 0, 0]); }} className="p-2 bg-slate-700 rounded hover:bg-slate-600 ml-2">
              <Home className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex relative">
          {/* Slide-in Detail Panel on Left */}
          <div
            className={`absolute left-0 top-0 bottom-0 z-20 bg-slate-900/98 border-r border-slate-600 overflow-y-auto transition-all duration-300 ease-in-out ${
              selectedCity && showCityPanel ? 'w-[36rem]' : 'w-0'
            }`}
          >
            {selectedCity && showCityPanel && (
              <div className="w-[36rem]">
                <div className="sticky top-0 z-30 bg-slate-900/95 border-b border-slate-700 p-4 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white">{selectedCity.name}</h2>
                  <button
                    onClick={() => {
                      setSelectedCity(null);
                      setShowCityPanel(false);
                    }}
                    className="p-1 hover:bg-slate-800 rounded transition-colors"
                    aria-label="Close panel"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <CityDetailPanel
                  cityName={selectedCity.name}
                  mapArea={selectedCity.mapArea}
                  foundingYear={selectedCity.foundingYear}
                  declineYear={selectedCity.declineYear}
                  region={selectedCity.zone}
                  isEmbedded={true}
                />
              </div>
            )}
          </div>

          {/* Globe Display */}
          <div className="flex-1 relative">
            <svg
              ref={svgRef}
              className="w-full h-full cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />

            <div className="absolute bottom-4 left-4 bg-slate-800/90 rounded-lg p-3 text-xs text-slate-300">
              <p>Drag to rotate • Scroll to zoom • Click cities for details</p>
            </div>

            {/* Faction Legend */}
            {currentFactions.length > 0 && (
              <div className="absolute top-4 right-4 bg-slate-800/95 rounded-lg p-4 max-w-xs shadow-xl border border-slate-700">
                <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
                  <Flag className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Active Empires</h3>
                  <span className="text-xs text-slate-400 ml-auto">
                    {currentYear < 0 ? `${Math.abs(currentYear)} BCE` : `${currentYear} CE`}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {currentFactions.map(([name, data]) => {
                    const factionIcon = FACTION_ICONS[name];
                    const Icon = factionIcon?.icon;
                    return (
                      <div key={name} className="flex items-center gap-2 text-xs hover:bg-slate-700/50 p-1 rounded transition-colors">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 border border-white/20"
                          style={{ backgroundColor: data.color }}
                        />
                        {Icon && <Icon className="w-3 h-3 text-slate-400" />}
                        <span className="text-slate-300 truncate flex-1">
                          {name.replace('/', ' / ')}
                        </span>
                        <span className="text-slate-500 text-[10px]">{data.count}</span>
                      </div>
                    );
                  })}
                </div>
                {currentFactions.length === 10 && (
                  <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-700">
                    Showing top 10 empires by city count
                  </div>
                )}
              </div>
            )}

            {/* Prompt to select city when none selected */}
            {!selectedCity && (
              <div className="absolute top-4 left-4 bg-slate-800/90 rounded-lg p-4 max-w-sm">
                <div className="flex items-center gap-3 text-slate-300">
                  <Info className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">
                    Click on any city to view detailed information
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityMapGlobe;