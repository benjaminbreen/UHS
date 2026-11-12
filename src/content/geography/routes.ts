/** Trunk routes: the railways and great roads that run between places and
 * across many maps. Each is a list of towns the route served, as longitude
 * and latitude; the line between them is drawn, not surveyed. `from` is the
 * year through traffic began over the whole stretch, `to` the year it ceased.
 *
 * Documented: that the route existed, about when, and which towns it joined.
 * Inferred: the alignment between those towns, and town positions to a few
 * kilometres. */
export type TrunkRoute = {
  id: string;
  name: string;
  /** rail: a railway. road: a made highway for feet, hooves and wheels.
   * motorway: a divided road for motor traffic alone. */
  kind: "rail" | "road" | "motorway";
  from: number;
  to?: number;
  via: readonly (readonly [number, number])[];
};

const r = (id: string, name: string, kind: TrunkRoute["kind"], from: number, via: string, to?: number): TrunkRoute => ({
  id,
  name,
  kind,
  from,
  ...(to !== undefined && { to }),
  via: via.trim().split(/\s+/).map((p) => p.split(",").map(Number) as [number, number]),
});

// Towns that several routes share, so they meet at one point.
const LONDON = "-0.13,51.52", BIRMINGHAM = "-1.90,52.48", RUGBY = "-1.25,52.38", CREWE = "-2.43,53.09",
  WARRINGTON = "-2.60,53.39", PRESTON = "-2.71,53.76", CARLISLE = "-2.93,54.89", YORK = "-1.09,53.96",
  DONCASTER = "-1.13,53.52", NEWCASTLE = "-1.62,54.97", EDINBURGH = "-3.19,55.95", READING = "-0.97,51.46",
  BATH = "-2.36,51.38", BRISTOL = "-2.58,51.45", LEICESTER = "-1.13,52.63";
const NEW_YORK = "-74.01,40.71", PHILADELPHIA = "-75.16,39.95", BALTIMORE = "-76.61,39.29", WASHINGTON = "-77.01,38.90",
  PITTSBURGH = "-80.00,40.44", CHICAGO = "-87.63,41.88", OMAHA = "-95.94,41.26", CHEYENNE = "-104.82,41.14",
  SACRAMENTO = "-121.49,38.58", SAN_FRANCISCO = "-122.42,37.77", LOS_ANGELES = "-118.24,34.05", ALBANY = "-73.76,42.65",
  BUFFALO = "-78.88,42.89", CLEVELAND = "-81.69,41.50", TOLEDO = "-83.54,41.65", KANSAS_CITY = "-94.58,39.10",
  ALBUQUERQUE = "-106.65,35.08", FLAGSTAFF = "-111.65,35.20", BARSTOW = "-117.02,34.90", EL_PASO = "-106.49,31.76",
  TUCSON = "-110.97,32.22", HOUSTON = "-95.37,29.76", NEW_ORLEANS = "-90.07,29.95", SAN_ANTONIO = "-98.49,29.42",
  RENO = "-119.81,39.53", SALT_LAKE = "-111.89,40.76", BOSTON = "-71.06,42.36", NEW_HAVEN = "-72.93,41.31",
  RICHMOND = "-77.44,37.54", SAVANNAH = "-81.09,32.08", SEATTLE = "-122.33,47.61", SPOKANE = "-117.43,47.66",
  BILLINGS = "-108.50,45.78", WHEELING = "-80.72,40.06", CUMBERLAND = "-78.76,39.65", FORT_WAYNE = "-85.14,41.08";
const MOSCOW = "37.62,55.76", PETERSBURG = "30.36,59.93", TVER = "35.90,56.86", VLADIMIR = "40.41,56.13",
  NIZHNY = "44.00,56.33", RYAZAN = "39.74,54.63", SAMARA = "50.15,53.20", CHELYABINSK = "61.40,55.16",
  OMSK = "73.37,54.99", KRASNOYARSK = "92.87,56.01", IRKUTSK = "104.28,52.29", CHITA = "113.50,52.03",
  KHABAROVSK = "135.07,48.48";

export const trunkRoutes: readonly TrunkRoute[] = [
  // Britain: railways.
  r("liverpool-manchester", "Liverpool and Manchester Railway", "rail", 1830, "-2.98,53.41 -2.63,53.45 -2.24,53.48"),
  r("grand-junction", "Grand Junction Railway", "rail", 1837, `${BIRMINGHAM} -2.12,52.59 -2.12,52.80 ${CREWE} ${WARRINGTON} -2.63,53.45`),
  r("london-birmingham", "London and Birmingham Railway", "rail", 1838, `${LONDON} -0.40,51.66 -0.66,51.80 -0.73,52.00 ${RUGBY} -1.51,52.40 ${BIRMINGHAM}`),
  r("great-western", "Great Western Railway", "rail", 1841, `${LONDON} -0.59,51.51 ${READING} -1.24,51.61 -1.79,51.57 -2.12,51.46 ${BATH} ${BRISTOL}`),
  r("london-brighton", "London and Brighton Railway", "rail", 1841, `${LONDON} -0.10,51.37 -0.17,51.24 -0.14,50.83`),
  r("south-western", "London and South Western Railway", "rail", 1840, `${LONDON} -0.56,51.32 -1.09,51.27 -1.31,51.06 -1.40,50.90`),
  r("great-eastern", "Eastern Counties Railway", "rail", 1849, `${LONDON} 0.47,51.73 0.90,51.89 1.15,52.06 1.30,52.63`),
  r("midland", "Midland Railway", "rail", 1840, `${RUGBY} ${LEICESTER} -1.48,52.92 -1.47,53.38 -1.55,53.80`),
  r("east-coast", "East Coast Main Line", "rail", 1852, `${LONDON} -0.25,52.57 -0.64,52.91 ${DONCASTER} ${YORK} -1.55,54.52 ${NEWCASTLE} -2.00,55.77 ${EDINBURGH}`),
  r("west-coast-north", "Lancaster, Carlisle and Caledonian line", "rail", 1848, `${WARRINGTON} ${PRESTON} -2.80,54.05 ${CARLISLE} -3.67,55.69 -4.25,55.86`),
  // Britain: roads.
  r("dover-road", "Watling Street to Dover", "road", 50, `${LONDON} 0.50,51.39 1.08,51.28 1.31,51.13`),
  r("watling-street", "Watling Street", "road", 60, `${LONDON} -0.34,51.75 -0.99,52.13 -1.30,52.50 -2.64,52.67`),
  r("fosse-way", "Fosse Way", "road", 60, `-3.53,50.72 -2.72,51.00 ${BATH} -1.97,51.72 ${LEICESTER} -0.54,53.23`),
  r("great-north-road", "Great North Road", "road", 1150, `${LONDON} -0.20,51.90 -0.48,52.65 -0.64,52.91 -0.81,53.08 ${DONCASTER} -1.34,53.93 -1.58,54.78 ${NEWCASTLE} -2.00,55.77 ${EDINBURGH}`),
  r("bath-road", "Bath Road", "road", 1200, `${LONDON} -0.59,51.51 ${READING} -1.32,51.40 -1.73,51.42 ${BATH} ${BRISTOL}`),
  r("holyhead-road", "Holyhead Road", "road", 1826, "-2.64,52.67 -2.75,52.71 -3.17,52.97 -3.80,53.09 -4.13,53.23 -4.63,53.31"),
  r("m1", "M1", "motorway", 1959, `-0.25,51.63 -0.42,51.88 -0.90,52.24 -1.20,52.60 -1.25,52.93 -1.40,53.40 -1.55,53.80`),
  r("m6", "M6", "motorway", 1963, `-1.20,52.40 -1.80,52.55 -2.20,53.00 ${WARRINGTON} ${PRESTON} -2.80,54.05 ${CARLISLE}`),
  r("m4", "M4", "motorway", 1971, `-0.40,51.50 ${READING} -1.79,51.57 -2.55,51.52 -3.00,51.59 -3.18,51.48`),

  // United States: railways.
  r("camden-amboy", "New York to Philadelphia line", "rail", 1839, `${NEW_YORK} -74.45,40.49 -74.76,40.22 ${PHILADELPHIA}`),
  r("pw-b", "Philadelphia, Wilmington and Baltimore line", "rail", 1838, `${PHILADELPHIA} -75.55,39.74 ${BALTIMORE} ${WASHINGTON}`),
  r("rf-p", "Richmond, Fredericksburg and Potomac Railroad", "rail", 1843, `${WASHINGTON} -77.46,38.30 ${RICHMOND}`),
  r("central-georgia", "Central of Georgia Railway", "rail", 1843, `${SAVANNAH} -82.90,32.55 -83.63,32.84`),
  r("western-atlantic", "Western and Atlantic Railroad", "rail", 1850, "-84.39,33.75 -84.95,34.25 -85.31,35.05"),
  r("hudson-river", "Hudson River Railroad", "rail", 1851, `${NEW_YORK} -73.93,41.70 ${ALBANY}`),
  r("new-york-central", "New York Central Railroad", "rail", 1853, `${ALBANY} -75.23,43.10 -76.15,43.05 -77.61,43.16 ${BUFFALO}`),
  r("lake-shore", "Lake Shore and Michigan Southern line", "rail", 1853, `${BUFFALO} -80.09,42.13 ${CLEVELAND} ${TOLEDO} -86.25,41.68 ${CHICAGO}`),
  r("baltimore-ohio", "Baltimore and Ohio Railroad", "rail", 1853, `${BALTIMORE} -77.73,39.32 ${CUMBERLAND} -80.02,39.34 ${WHEELING}`),
  r("pennsylvania", "Pennsylvania Railroad", "rail", 1854, `${PHILADELPHIA} -76.31,40.04 -76.88,40.27 -78.39,40.52 ${PITTSBURGH}`),
  r("fort-wayne", "Pittsburgh, Fort Wayne and Chicago Railway", "rail", 1858, `${PITTSBURGH} -81.37,40.80 -82.52,40.76 ${FORT_WAYNE} ${CHICAGO}`),
  r("chicago-northwestern", "Chicago and North Western line", "rail", 1867, `${CHICAGO} -90.19,41.84 -91.67,41.98 -93.62,42.03 ${OMAHA}`),
  r("transcontinental", "Pacific Railroad", "rail", 1869, `${OMAHA} -98.34,40.92 -100.77,41.13 ${CHEYENNE} -105.59,41.31 -107.24,41.79 -109.47,41.53 -111.97,41.22 -112.55,41.62 -115.76,40.83 -117.74,40.97 ${RENO} -120.18,39.33 ${SACRAMENTO} -122.27,37.80`),
  r("southern-pacific", "Sunset Route", "rail", 1883, `${NEW_ORLEANS} ${HOUSTON} ${SAN_ANTONIO} ${EL_PASO} ${TUCSON} -114.62,32.69 ${LOS_ANGELES}`),
  r("northern-pacific", "Northern Pacific Railway", "rail", 1883, `-93.09,44.95 -96.79,46.88 -100.78,46.81 ${BILLINGS} -112.04,46.59 ${SPOKANE} ${SEATTLE}`),
  r("santa-fe", "Atchison, Topeka and Santa Fe Railway", "rail", 1885, `${KANSAS_CITY} -95.69,39.05 -100.02,37.75 -103.54,37.99 -104.44,36.90 ${ALBUQUERQUE} ${FLAGSTAFF} -114.61,34.85 ${BARSTOW} ${LOS_ANGELES}`),
  r("santa-fe-chicago", "Santa Fe line to Chicago", "rail", 1888, `${CHICAGO} -90.37,40.95 -91.32,40.63 ${KANSAS_CITY}`),
  // United States: roads and trails.
  r("boston-post-road", "Boston Post Road", "road", 1673, `${NEW_YORK} ${NEW_HAVEN} -72.68,41.76 -72.59,42.10 -71.80,42.26 ${BOSTON}`),
  r("kings-highway", "King's Highway", "road", 1750, `${NEW_YORK} -74.76,40.22 ${PHILADELPHIA} -75.55,39.74 ${BALTIMORE} -77.04,38.80 ${RICHMOND}`),
  r("national-road", "National Road", "road", 1818, `${CUMBERLAND} -79.72,39.90 -80.25,40.17 ${WHEELING}`),
  r("national-road-west", "National Road", "road", 1839, `${WHEELING} -82.01,39.94 -83.00,39.96 -86.16,39.77 -87.41,39.47 -89.09,38.96`),
  r("santa-fe-trail", "Santa Fe Trail", "road", 1821, "-94.42,39.09 -96.49,38.66 -100.02,37.75 -103.54,37.99 -104.44,36.90 -105.94,35.69", 1880),
  r("oregon-trail", "Oregon Trail", "road", 1843, "-94.42,39.09 -99.00,40.64 -104.55,42.21 -108.90,42.37 -112.43,43.02 -116.20,43.62 -121.18,45.60 -122.61,45.36", 1869),
  r("lincoln-highway", "Lincoln Highway", "road", 1913, `${NEW_YORK} ${PHILADELPHIA} ${PITTSBURGH} ${FORT_WAYNE} -88.08,41.53 -91.67,41.98 ${OMAHA} ${CHEYENNE} ${SALT_LAKE} -114.89,39.25 ${RENO} ${SACRAMENTO} ${SAN_FRANCISCO}`),
  r("route-66", "Route 66", "road", 1926, `${CHICAGO} -89.65,39.80 -90.20,38.63 -93.29,37.21 -95.99,36.15 -97.52,35.47 -101.83,35.22 ${ALBUQUERQUE} ${FLAGSTAFF} ${BARSTOW} ${LOS_ANGELES}`, 1985),
  r("i-95", "Interstate 95", "motorway", 1965, `${BOSTON} -71.41,41.82 ${NEW_HAVEN} ${NEW_YORK} ${PHILADELPHIA} ${BALTIMORE} ${WASHINGTON} ${RICHMOND} -78.88,35.05 ${SAVANNAH} -81.66,30.33 -80.19,25.76`),
  r("i-5", "Interstate 5", "motorway", 1968, `-117.16,32.72 ${LOS_ANGELES} ${SACRAMENTO} -122.39,40.59 -122.68,45.52 ${SEATTLE}`),
  r("i-80", "Interstate 80", "motorway", 1970, `${NEW_YORK} -75.19,40.99 -80.65,41.10 ${TOLEDO} -87.35,41.59 -93.62,41.59 ${OMAHA} ${CHEYENNE} ${SALT_LAKE} ${RENO} ${SACRAMENTO} ${SAN_FRANCISCO}`),
  r("i-10", "Interstate 10", "motorway", 1970, `${LOS_ANGELES} -112.07,33.45 ${TUCSON} ${EL_PASO} ${SAN_ANTONIO} ${HOUSTON} ${NEW_ORLEANS} -88.04,30.69 -81.66,30.33`),
  r("i-90", "Interstate 90", "motorway", 1970, `${BOSTON} ${ALBANY} ${BUFFALO} ${CLEVELAND} ${CHICAGO} -89.40,43.07 -96.73,43.55 -103.23,44.08 ${BILLINGS} -112.53,46.00 ${SPOKANE} ${SEATTLE}`),

  // Russia.
  r("moscow-petersburg-road", "Moscow highway", "road", 1746, `${PETERSBURG} 31.27,58.52 ${TVER} ${MOSCOW}`),
  r("siberian-trakt", "Siberian Route", "road", 1765, `${MOSCOW} ${VLADIMIR} ${NIZHNY} 49.11,55.79 56.25,58.01 60.60,56.84 65.53,57.15 ${OMSK} 84.95,56.49 ${KRASNOYARSK} ${IRKUTSK} 106.45,50.35`),
  r("nikolaev", "Nikolaev Railway", "rail", 1851, `${PETERSBURG} 33.25,58.39 ${TVER} ${MOSCOW}`),
  r("petersburg-warsaw", "St Petersburg to Warsaw Railway", "rail", 1862, `${PETERSBURG} 28.33,57.82 26.53,55.87 25.28,54.69 23.83,53.68 23.15,53.13 21.01,52.23`),
  r("moscow-nizhny", "Moscow to Nizhny Novgorod Railway", "rail", 1862, `${MOSCOW} ${VLADIMIR} ${NIZHNY}`),
  r("moscow-kursk", "Moscow to Kursk Railway", "rail", 1869, `${MOSCOW} 37.62,54.19 36.07,52.97 36.19,51.73 36.23,49.99`),
  r("samara-zlatoust", "Moscow to Chelyabinsk line", "rail", 1892, `${MOSCOW} ${RYAZAN} 45.00,53.20 ${SAMARA} 55.97,54.74 ${CHELYABINSK}`),
  r("west-siberian", "Trans-Siberian Railway", "rail", 1898, `${CHELYABINSK} 65.34,55.44 ${OMSK} 82.92,55.03 ${KRASNOYARSK} 97.00,55.94 ${IRKUTSK}`),
  r("transbaikal", "Trans-Siberian Railway", "rail", 1904, `${IRKUTSK} 104.05,51.65 107.61,51.83 ${CHITA}`),
  r("ussuri", "Ussuri Railway", "rail", 1897, `${KHABAROVSK} 133.71,46.82 131.95,43.80 131.89,43.12`),
  r("amur", "Amur Railway", "rail", 1916, `${CHITA} 121.63,53.74 127.53,50.92 132.94,48.79 ${KHABAROVSK}`),

  // A few great roads elsewhere, and two railways.
  r("royal-road", "Royal Road", "road", -500, "28.04,38.49 31.99,39.65 35.48,38.72 38.32,38.35 41.20,37.07 44.01,36.19 48.26,32.19", -300),
  r("via-appia", "Via Appia", "road", -264, "12.50,41.89 13.25,41.29 14.21,41.11 14.78,41.13 15.80,40.96 17.23,40.47 17.94,40.63"),
  r("via-aemilia", "Via Aemilia", "road", -187, "12.57,44.06 11.34,44.49 10.92,44.65 10.33,44.80 9.69,45.05"),
  r("qhapaq-nan", "Qhapaq Ñan", "road", 1470, "-78.47,-0.18 -79.00,-2.90 -78.50,-7.16 -76.24,-9.93 -75.50,-11.78 -74.22,-13.16 -71.97,-13.53 -70.02,-15.84 -68.15,-16.50", 1650),
  r("grand-trunk-road", "Grand Trunk Road", "road", 1545, "69.17,34.53 71.58,34.01 73.05,33.60 74.34,31.55 76.78,30.38 77.21,28.61 78.01,27.18 80.33,26.45 81.85,25.44 83.00,25.32 85.14,25.59 87.31,23.52 88.36,22.57"),
  r("tokaido", "Tōkaidō", "road", 1601, "139.77,35.68 139.16,35.26 138.38,34.98 137.73,34.71 136.91,35.18 136.62,34.97 135.96,35.02 135.77,35.01"),
  r("tokaido-line", "Tōkaidō Main Line", "rail", 1889, "139.77,35.68 139.16,35.26 138.38,34.98 137.73,34.71 136.91,35.18 136.29,35.31 135.77,35.01 135.50,34.70 135.20,34.69"),
  r("paris-lyon-marseille", "Paris to Marseille line", "rail", 1856, "2.35,48.86 3.57,47.80 5.04,47.32 4.84,45.76 4.89,44.93 4.81,43.95 5.37,43.30"),
];
