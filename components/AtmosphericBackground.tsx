import React, { useEffect, useState, useRef } from 'react';
import { CHARACTER_NAMES } from '../constants/characterData/names';
import { PROFESSIONS } from '../constants/characterData/professions';

// Import Google Font
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
fontLink.rel = 'stylesheet';
if (!document.head.querySelector(`link[href="${fontLink.href}"]`)) {
  document.head.appendChild(fontLink);
}

interface AtmosphericBackgroundProps {
  className?: string;
  showTextOverlay?: boolean;
}

interface HistoricalEntry {
  id: number;
  name: string;
  profession: string;
  location: string;
  years: number;
  year: number;
  colorClass: string;
  text: string;
}

const AtmosphericBackground: React.FC<AtmosphericBackgroundProps> = ({ className = '', showTextOverlay = true }) => {
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [entries, setEntries] = useState<HistoricalEntry[]>([]);
  const [displayedEntries, setDisplayedEntries] = useState<HistoricalEntry[]>([]);
  const [isInitialFill, setIsInitialFill] = useState(true);
  const entryIdCounter = useRef(0);
  const hazeRef = useRef<HTMLDivElement>(null);

  // Historical date ranges for cultural zones
  const getHistoricalDateRange = (zone: string): { start: number; end: number } => {
    const ranges: Record<string, { start: number; end: number }> = {
      'VENETIAN_MEDIEVAL': { start: 1000, end: 1600 },
      'MOORISH_ANDALUS': { start: 711, end: 1492 },
      'BYZANTINE_GREEK': { start: 330, end: 1453 },
      'KHMER_ANGKOR': { start: 802, end: 1431 },
      'FLEMISH_MEDIEVAL': { start: 1200, end: 1600 },
      'CATALAN_MEDIEVAL': { start: 1000, end: 1500 },
      'THAI_AYUTTHAYA': { start: 1351, end: 1767 },
      'MAMLUK_EGYPT': { start: 1250, end: 1517 },
      // Default ranges for broad cultural zones
      'EUROPEAN': { start: -500, end: 1900 },
      'EAST_ASIAN': { start: -1000, end: 1900 },
      'MENA': { start: -3000, end: 1900 },
      'SUB_SAHARAN_AFRICAN': { start: -2000, end: 1900 },
      'SOUTH_ASIAN': { start: -2500, end: 1900 },
      'OCEANIA': { start: -1500, end: 1900 },
      'SOUTH_AMERICAN': { start: -2000, end: 1900 }
    };
    return ranges[zone] || { start: -1000, end: 1900 };
  };

  // Culturally appropriate professions
  const getCulturalProfessions = (zone: string): string[] => {
    const culturalProfessions: Record<string, string[]> = {
      'VENETIAN_MEDIEVAL': ['Merchant', 'Glass Blower', 'Navigator', 'Banker', 'Silk Trader', 'Shipbuilder', 'Gondolier', 'Doge\'s Guard', 'Notary', 'Artist'],
      'MOORISH_ANDALUS': ['Scholar', 'Astronomer', 'Physician', 'Mathematician', 'Calligrapher', 'Poet', 'Architect', 'Irrigation Engineer', 'Judge', 'Translator'],
      'BYZANTINE_GREEK': ['Imperial Guard', 'Courtier', 'Icon Painter', 'Silk Weaver', 'Tax Collector', 'Diplomat', 'Chronicler', 'Patriarch\'s Scribe', 'Theme Strategos', 'Mosaic Artist'],
      'KHMER_ANGKOR': ['Temple Builder', 'Stone Carver', 'Royal Dancer', 'Court Astronomer', 'Rice Master', 'Baray Engineer', 'Sanskrit Scholar', 'Royal Elephant Keeper', 'Silk Producer', 'Bronze Caster'],
      'FLEMISH_MEDIEVAL': ['Cloth Merchant', 'Weaver', 'Dyer', 'Guild Master', 'Banker', 'Brewer', 'Tapestry Maker', 'Goldsmith', 'Furrier', 'Spice Trader'],
      'CATALAN_MEDIEVAL': ['Sea Captain', 'Coral Fisher', 'Cartographer', 'Consul', 'Notary', 'Silversmith', 'Wine Merchant', 'Shipwright', 'Crossbowman', 'Scribe'],
      'THAI_AYUTTHAYA': ['Royal Guard', 'Buddhist Monk', 'Rice Trader', 'Court Musician', 'Elephant Mahout', 'Temple Sculptor', 'Royal Astrologer', 'Silk Weaver', 'Spice Merchant', 'Boat Builder'],
      'MAMLUK_EGYPT': ['Mamluk Warrior', 'Bazaar Merchant', 'Muezzin', 'Scribe', 'Camel Driver', 'Perfumer', 'Coptic Craftsman', 'Nile Boatman', 'Cotton Merchant', 'Physician']
    };
    return culturalProfessions[zone] || [];
  };

  // Historical place names by cultural zone
  const getHistoricalLocations = (zone: string): string[] => {
    const historicalLocations: Record<string, string[]> = {
      'VENETIAN_MEDIEVAL': ['Venetian Lagoon', 'Rialto', 'Murano', 'Burano', 'Torcello', 'Lido', 'Castello', 'Cannaregio', 'Dorsoduro', 'San Marco'],
      'MOORISH_ANDALUS': ['Córdoba', 'Sevilla', 'Granada', 'Toledo', 'Almería', 'Valencia', 'Murcia', 'Málaga', 'Zaragoza', 'Badajoz'],
      'BYZANTINE_GREEK': ['Constantinople', 'Thessalonica', 'Trebizond', 'Nicaea', 'Mystras', 'Antioch', 'Alexandria', 'Ephesus', 'Caesarea', 'Athens'],
      'KHMER_ANGKOR': ['Angkor Thom', 'Yashodharapura', 'Hariharalaya', 'Koh Ker', 'Banteay Srei', 'Preah Vihear', 'Baphuon', 'Ta Prohm', 'Bayon', 'Phnom Bakheng'],
      'FLEMISH_MEDIEVAL': ['Bruges', 'Ghent', 'Antwerp', 'Ypres', 'Brussels', 'Mechelen', 'Leuven', 'Tournai', 'Kortrijk', 'Oudenaarde'],
      'CATALAN_MEDIEVAL': ['Barcelona', 'Valencia', 'Perpignan', 'Girona', 'Tarragona', 'Lleida', 'Tortosa', 'Vic', 'Manresa', 'Montpellier'],
      'THAI_AYUTTHAYA': ['Ayutthaya', 'Lopburi', 'Sukhothai', 'Phitsanulok', 'Nakhon Si Thammarat', 'Chiang Mai', 'Suphan Buri', 'Ratchaburi', 'Phetchaburi', 'Kanchanaburi'],
      'MAMLUK_EGYPT': ['Cairo', 'Alexandria', 'Damascus', 'Aleppo', 'Fustat', 'Damietta', 'Rosetta', 'Asyut', 'Qus', 'Aswan'],
      // Default generic locations for broad zones
      'EUROPEAN': ['London', 'Paris', 'Rome', 'Vienna', 'Madrid', 'Lisbon', 'Amsterdam', 'Prague', 'Warsaw', 'Copenhagen'],
      'EAST_ASIAN': ['Beijing', 'Nanjing', 'Kyoto', 'Seoul', 'Kaifeng', 'Hangzhou', 'Xian', 'Luoyang', 'Edo', 'Kamakura'],
      'MENA': ['Baghdad', 'Damascus', 'Cairo', 'Mecca', 'Jerusalem', 'Isfahan', 'Samarkand', 'Tunis', 'Fez', 'Tripoli'],
      'SUB_SAHARAN_AFRICAN': ['Timbuktu', 'Great Zimbabwe', 'Kilwa', 'Mogadishu', 'Axum', 'Benin City', 'Gao', 'Djenne', 'Mbanza Kongo', 'Gondar'],
      'SOUTH_ASIAN': ['Delhi', 'Agra', 'Varanasi', 'Vijayanagar', 'Madurai', 'Lahore', 'Dhaka', 'Colombo', 'Kathmandu', 'Taxila'],
      'OCEANIA': ['Tonga', 'Samoa', 'Tahiti', 'Hawaii', 'Fiji', 'Easter Island', 'Rarotonga', 'Vanuatu', 'New Zealand', 'Marquesas'],
      'SOUTH_AMERICAN': ['Cusco', 'Machu Picchu', 'Tenochtitlan', 'Tikal', 'Copán', 'Chan Chan', 'Tiwanaku', 'Quito', 'Potosí', 'Cartagena']
    };
    return historicalLocations[zone] || ['Unknown Land'];
  };

  // Get random combat background
  const getCombatBackgrounds = () => [
    '/combat-backgrounds/beach.png',
    '/combat-backgrounds/dense_city.png',
    '/combat-backgrounds/forest.png',
    '/combat-backgrounds/hills.png',
    '/combat-backgrounds/desert.png',
    '/combat-backgrounds/grassland.png',
    '/combat-backgrounds/mountain.png',
    '/combat-backgrounds/deep_ocean.png'
  ];

  const setRandomBackground = () => {
    const backgrounds = getCombatBackgrounds();
    const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setBackgroundImage(randomBg);
  };

  const generateEntry = (): HistoricalEntry => {
    try {
      // Get random cultural zone and era for realistic name/profession pairing
      const zones = ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'SUB_SAHARAN_AFRICAN', 'SOUTH_ASIAN', 'OCEANIA', 'SOUTH_AMERICAN', 'VENETIAN_MEDIEVAL', 'MOORISH_ANDALUS', 'BYZANTINE_GREEK', 'KHMER_ANGKOR', 'FLEMISH_MEDIEVAL', 'CATALAN_MEDIEVAL', 'THAI_AYUTTHAYA', 'MAMLUK_EGYPT'];
      const eras = ['PREHISTORY', 'ANTIQUITY', 'MEDIEVAL', 'RENAISSANCE_EARLY_MODERN', 'INDUSTRIAL_ERA', 'MODERN_ERA'];

    const zone = zones[Math.floor(Math.random() * zones.length)] as keyof typeof PROFESSIONS;
    const era = eras[Math.floor(Math.random() * eras.length)] as keyof typeof PROFESSIONS[typeof zone];

    // Get names from CHARACTER_NAMES using the zone key
    const nameData = CHARACTER_NAMES[zone];
    let firstNames: string[] = [];
    let surnames: string[] = [];

    if (nameData) {
      firstNames.push(...nameData.male, ...nameData.female);
      surnames = nameData.surname || [];
    }

    // Fallback to European names if zone not found
    if (firstNames.length === 0) {
      firstNames.push(...CHARACTER_NAMES.EUROPEAN.male, ...CHARACTER_NAMES.EUROPEAN.female);
      surnames = CHARACTER_NAMES.EUROPEAN.surname || [];
    }

    // Get culturally appropriate professions
    let professions = getCulturalProfessions(zone);

    // If no cultural professions, try to get from PROFESSIONS structure
    if (professions.length === 0) {
      const professionData = PROFESSIONS[zone]?.[era];
      if (professionData) {
        Object.values(professionData).forEach(socialClass => {
          Object.keys(socialClass).forEach(profession => {
            professions.push(profession);
          });
        });
      }
    }

    // Fallback to European Medieval professions if still none found
    if (professions.length === 0) {
      const fallbackData = PROFESSIONS.EUROPEAN?.MEDIEVAL;
      if (fallbackData) {
        Object.values(fallbackData).forEach(socialClass => {
          Object.keys(socialClass).forEach(profession => {
            professions.push(profession);
          });
        });
      }
    }

    // Get historically appropriate locations
    const locations = getHistoricalLocations(zone);

    // Get historically accurate date range
    const dateRange = getHistoricalDateRange(zone);
    const year = Math.floor(Math.random() * (dateRange.end - dateRange.start)) + dateRange.start;

    // Generate full name
    const firstName = firstNames.length > 0 ? firstNames[Math.floor(Math.random() * firstNames.length)] : 'Unknown';
    const surname = surnames.length > 0 ? surnames[Math.floor(Math.random() * surnames.length)] : '';
    const name = surname && surname !== '(No Surname)' ? `${firstName} ${surname}` : firstName;
    const profession = professions.length > 0 ? professions[Math.floor(Math.random() * professions.length)] : 'Traveler';
    const location = locations[Math.floor(Math.random() * locations.length)];
    const years = Math.floor(Math.random() * 60) + 1;
    const yearStr = year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
    const colorClass = `name-color-${Math.floor(Math.random() * 10) + 1}`;

    const text = `<span class="${colorClass}">${name}</span><span class="separator"> :: </span><span class="info-text">${profession} for ${years} years in ${location}, ${yearStr}</span>`;

      return {
        id: entryIdCounter.current++,
        name,
        profession,
        location,
        years,
        year,
        colorClass,
        text
      };
    } catch (error) {
      console.error('Error generating entry:', error);
      // Return a fallback entry if generation fails
      return {
        id: entryIdCounter.current++,
        name: 'Unknown Person',
        profession: 'Traveler',
        location: 'Unknown Land',
        years: 25,
        year: 1000,
        colorClass: 'name-color-1',
        text: '<span class="name-color-1">Unknown Person</span><span class="separator"> :: </span><span class="info-text">Traveler for 25 years in Unknown Land, 1000 CE</span>'
      };
    }
  };

  const prepareInitialEntries = (count = 150) => {
    const newEntries = [];
    for (let i = 0; i < count; i++) {
      newEntries.push(generateEntry());
    }
    setEntries(newEntries);
  };

  // Mouse tracking for atmospheric haze
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (hazeRef.current) {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        hazeRef.current.style.setProperty('--mouse-x', `${x}%`);
        hazeRef.current.style.setProperty('--mouse-y', `${y}%`);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Initialize
  useEffect(() => {
    setRandomBackground();
    prepareInitialEntries();
  }, []);

  // Progressive entry display with fade-in effect
  useEffect(() => {
    if (entries.length > 0 && isInitialFill) {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < entries.length) {
          setDisplayedEntries(prev => [...prev, entries[currentIndex]]);
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsInitialFill(false);
        }
      }, 80); // Add one entry every 80ms for smooth scroll effect

      return () => clearInterval(interval);
    }
  }, [entries, isInitialFill]);

  // Periodic replacement
  useEffect(() => {
    if (!isInitialFill && displayedEntries.length > 0) {
      const interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * displayedEntries.length);
        const newEntry = generateEntry();

        setDisplayedEntries(prev => {
          const updated = [...prev];
          updated[randomIndex] = newEntry;
          return updated;
        });
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isInitialFill, displayedEntries.length]);

  const handleNameClick = (entryId: number) => {
    const newEntry = generateEntry();
    setDisplayedEntries(prev => {
      const updated = [...prev];
      const index = updated.findIndex(entry => entry?.id === entryId);
      if (index !== -1) {
        updated[index] = newEntry;
      }
      return updated;
    });
  };

  return (
    <div className={`atmospheric-background ${className}`}>
      {/* Background Image */}
      <div
        className="background-image"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      {/* Terminal Container - conditionally rendered based on showTextOverlay prop */}
      {showTextOverlay && (
        <div className="terminal-container">
          <div className="terminal-line">
            {displayedEntries.filter(entry => entry && entry.id).map((entry, index) => (
              <span key={entry.id} className="entry-wrapper" onClick={() => handleNameClick(entry.id)}>
                {index > 0 && <span className="separator"> • </span>}
                <span
                  dangerouslySetInnerHTML={{ __html: entry.text || '' }}
                />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Atmospheric Haze */}
      <div className="atmospheric-haze" ref={hazeRef} />

      <style dangerouslySetInnerHTML={{
        __html: `
          .atmospheric-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
          }

          .atmospheric-background .background-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            z-index: 1;
          }

          .atmospheric-background .background-image::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              to top,
              rgba(0, 0, 0, 0.1) 0%,
              rgba(0, 0, 0, 0.4) 20%,
              rgba(0, 0, 0, 0.7) 40%,
              rgba(51, 65, 85, 0.85) 60%,
              rgba(51, 65, 85, 0.95) 80%,
              rgba(51, 65, 85, 1) 100%
            );
          }

          .atmospheric-background .terminal-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            padding: 20px;
            z-index: 2;
            font-family: 'Press Start 2P', 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 13px;
            line-height: 20px;
            letter-spacing: 0.5px;
            mask-image: linear-gradient(
              to bottom,
              rgba(0, 0, 0, 0.01) 0%,
              rgba(0, 0, 0, 0.03) 15%,
              rgba(0, 0, 0, 0.08) 30%,
              rgba(0, 0, 0, 0.2) 50%,
              rgba(0, 0, 0, 0.6) 75%,
              rgba(0, 0, 0, 1) 100%
            );
            -webkit-mask-image: linear-gradient(
              to bottom,
              rgba(0, 0, 0, 0.01) 0%,
              rgba(0, 0, 0, 0.03) 15%,
              rgba(0, 0, 0, 0.08) 30%,
              rgba(0, 0, 0, 0.2) 50%,
              rgba(0, 0, 0, 0.6) 75%,
              rgba(0, 0, 0, 1) 100%
            );
          }

          .atmospheric-background .terminal-line {
            white-space: pre-wrap;
            word-wrap: break-word;
            opacity: 1;
          }

          .atmospheric-background .entry-wrapper {
            display: inline;
            pointer-events: all;
            opacity: 0;
            animation: fadeInEntry 0.8s ease-in-out forwards;
            transition: all 0.3s ease;
            border-radius: 4px;
            padding: 2px 4px;
          }

          .atmospheric-background .entry-wrapper:hover {
            background: rgba(168, 184, 200, 0.3);
            box-shadow:
              0 0 8px rgba(168, 184, 200, 0.8),
              0 0 16px rgba(168, 184, 200, 0.6),
              0 0 24px rgba(168, 184, 200, 0.4);
            transform: scale(1.05);
            opacity: 1 !important;
            filter: brightness(1.6) saturate(1.3) contrast(1.2);
            z-index: 100;
            position: relative;
          }

          @keyframes fadeInEntry {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .atmospheric-background .atmospheric-haze {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 2;
            opacity: 0.3;
            background: radial-gradient(
              400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
              rgba(168, 184, 200, 0.15) 0%,
              rgba(200, 168, 184, 0.1) 25%,
              rgba(184, 200, 168, 0.08) 50%,
              transparent 70%
            );
            transition: background 0.3s ease-out;
          }

          .atmospheric-background .name-color-1 {
            color: #a8b8c8;
            text-shadow: 0 0 4px rgba(168, 184, 200, 0.6);
          }
          .atmospheric-background .name-color-2 {
            color: #c8a8b8;
            text-shadow: 0 0 4px rgba(200, 168, 184, 0.6);
          }
          .atmospheric-background .name-color-3 {
            color: #b8c8a8;
            text-shadow: 0 0 4px rgba(184, 200, 168, 0.6);
          }
          .atmospheric-background .name-color-4 {
            color: #c8b8a8;
            text-shadow: 0 0 4px rgba(200, 184, 168, 0.6);
          }
          .atmospheric-background .name-color-5 {
            color: #b8a8c8;
            text-shadow: 0 0 4px rgba(184, 168, 200, 0.6);
          }
          .atmospheric-background .name-color-6 {
            color: #a8c8b8;
            text-shadow: 0 0 4px rgba(168, 200, 184, 0.6);
          }
          .atmospheric-background .name-color-7 {
            color: #c8c8a8;
            text-shadow: 0 0 4px rgba(200, 200, 168, 0.6);
          }
          .atmospheric-background .name-color-8 {
            color: #c8a8a8;
            text-shadow: 0 0 4px rgba(200, 168, 168, 0.6);
          }
          .atmospheric-background .name-color-9 {
            color: #a8c8a8;
            text-shadow: 0 0 4px rgba(168, 200, 168, 0.6);
          }
          .atmospheric-background .name-color-10 {
            color: #a8a8c8;
            text-shadow: 0 0 4px rgba(168, 168, 200, 0.6);
          }

          .atmospheric-background .info-text {
            color: #cc8844;
            text-shadow: 0 0 4px rgba(204, 136, 68, 0.6), 0 0 8px rgba(204, 136, 68, 0.4);
          }

          .atmospheric-background .separator {
            color: #554433;
            opacity: 0.5;
            text-shadow: 0 0 2px rgba(85, 68, 51, 0.4);
          }

        `
      }} />
    </div>
  );
};

export default AtmosphericBackground;