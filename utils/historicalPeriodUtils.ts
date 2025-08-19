import { HistoricalEra, CulturalZone } from '../types';

// Subdivided historical descriptions to avoid anachronisms
export function getDetailedHistoricalDescription(
    zone: CulturalZone, 
    era: HistoricalEra, 
    year: number
): string {
    // Special handling for Antiquity to avoid anachronisms
    if (era === HistoricalEra.ANTIQUITY) {
        return getAntiquityDescription(zone, year);
    }
    
    // Special handling for Medieval period subdivisions
    if (era === HistoricalEra.MEDIEVAL) {
        return getMedievalDescription(zone, year);
    }
    
    // For other eras, use the default descriptions from HISTORY_GUIDE_DATA
    return null; // Fallback to standard descriptions
}

function getAntiquityDescription(zone: CulturalZone, year: number): string | null {
    switch (zone) {
        case 'EUROPEAN':
            if (year < -753) {
                // Pre-Roman period
                return "This is the age of Bronze Age kingdoms and the flowering of Greek city-states. The Mediterranean is dominated by Phoenician traders and the remnants of Mycenaean civilization, while Celtic tribes control much of the interior.";
            } else if (year < -509) {
                // Roman Kingdom period
                return "Rome is but a small kingdom among many Italian powers. Greek colonies dominate southern Italy and Sicily, while Etruscan city-states control the north. The wider Mediterranean sees the rise of Carthage and the Persian Empire.";
            } else if (year < -27) {
                // Roman Republic period
                return "The Roman Republic expands through Italy and beyond, clashing with Carthage for control of the western Mediterranean. Greek kingdoms descended from Alexander's empire dominate the east, while Celtic and Germanic tribes hold northern Europe.";
            } else {
                // Roman Empire period
                return "The might of the Roman Empire dominates the known world, bringing unparalleled order and engineering marvels. Legions march on stone roads, and classical philosophy and law shape the foundations of Western civilization.";
            }
            
        case 'EAST_ASIAN':
            if (year < -221) {
                // Pre-Qin unification
                return "This is the Warring States period, where rival kingdoms compete for dominance while philosophers like Confucius and Laozi establish schools of thought that will shape civilization for millennia. Bronze gives way to iron as the primary metal.";
            } else if (year < 220) {
                // Qin and Han dynasties
                return "The first unified Chinese empires establish vast territories through sophisticated bureaucracy. The Silk Road begins to connect East and West, while paper, the compass, and other innovations emerge.";
            } else {
                // Three Kingdoms and later
                return "Following the Han dynasty's collapse, rival kingdoms compete for the Mandate of Heaven. Buddhism arrives from India, beginning its transformation of East Asian culture alongside native Confucian and Daoist traditions.";
            }
            
        case 'MENA':
            if (year < -550) {
                // Pre-Persian Empire
                return "Ancient Mesopotamian empires like Assyria and Babylon dominate the region, while Egypt maintains its millennia-old civilization along the Nile. This is an age of cuneiform tablets, ziggurats, and the earliest written laws.";
            } else if (year < -330) {
                // Persian Empire period
                return "The vast Persian Empire stretches from India to Greece, creating the world's first superpower. Zoroastrianism shapes spiritual life while the Royal Road enables unprecedented communication across the empire.";
            } else if (year < 630) {
                // Hellenistic and Sassanid period
                return "Following Alexander's conquests, Hellenistic kingdoms blend Greek and Persian cultures. The region becomes a crossroads between Rome and the East, while Christianity and Judaism spread alongside ancient traditions.";
            }
            break;
            
        case 'SOUTH_ASIAN':
            if (year < -320) {
                // Pre-Mauryan period
                return "The Vedic period gives way to the rise of kingdoms and republics across northern India. This is the age of the Buddha and Mahavira, whose teachings challenge the established Brahmanical order.";
            } else if (year < 320) {
                // Mauryan to Gupta period
                return "Great empires like the Mauryas unite much of the subcontinent, spreading Buddhism as far as Central Asia. This is India's classical age, with remarkable achievements in mathematics, including the concept of zero.";
            } else {
                // Late Antiquity
                return "The Gupta Empire presides over a golden age of Hindu culture, art, and science. Sanskrit literature flourishes while Indian merchants and missionaries spread their culture across Southeast Asia.";
            }
            
        case 'SUB_SAHARAN_AFRICAN':
            if (year < -100) {
                // Early Iron Age
                return "The Bantu expansion continues to spread ironworking and agriculture across central and southern Africa. In the east, the Kingdom of Kush rivals Egypt, while trans-Saharan trade routes begin to develop.";
            } else if (year < 350) {
                // Rise of Aksum
                return "The Kingdom of Aksum emerges as a major trading power, controlling Red Sea commerce between Rome and India. Along the Niger River, the foundations of future West African empires are being laid.";
            } else {
                // Late Antiquity
                return "Aksum adopts Christianity and becomes one of the world's great powers. The Bantu migrations reach southern Africa, while complex societies develop along both coasts through Indian Ocean and Atlantic trade.";
            }
            
        case 'NORTH_AMERICAN_PRE_COLUMBIAN':
            if (year < -500) {
                // Archaic period
                return "Hunter-gatherer societies begin experimenting with agriculture. Along rivers and coasts, semi-sedentary communities develop, trading networks span vast distances, and the first burial mounds appear.";
            } else if (year < 500) {
                // Early Woodland/Formative
                return "The Adena and Hopewell cultures build elaborate earthworks and burial mounds along the Ohio and Mississippi rivers. Agriculture becomes more important, supporting larger, more complex societies.";
            } else {
                // Late Antiquity
                return "Agricultural societies spread across the Eastern Woodlands and Southwest. The foundations of later civilizations like Cahokia are being laid, while extensive trade networks connect diverse cultures.";
            }
            
        case 'SOUTH_AMERICAN':
            if (year < -1000) {
                // Pre-Chavín
                return "Early agricultural societies develop along the Pacific coast and in the Andean highlands. Monumental architecture appears at sites like Caral, among the world's oldest cities.";
            } else if (year < 200) {
                // Chavín to Early Intermediate
                return "The Chavín culture spreads religious and artistic influence across the Andes. On the coast, the Paracas and Nazca cultures create stunning textiles and the famous Nazca lines.";
            } else {
                // Moche and Tiwanaku
                return "Sophisticated regional cultures like the Moche create elaborate irrigation systems and monumental pyramids. In the highlands, Tiwanaku emerges as a major ceremonial and economic center.";
            }
            
        case 'OCEANIA':
            if (year < -1500) {
                // Early Austronesian expansion
                return "Austronesian navigators begin their epic expansion into the Pacific, reaching as far as Fiji and Samoa. In Australia, Aboriginal peoples continue traditions stretching back tens of thousands of years.";
            } else if (year < 0) {
                // Lapita period
                return "The Lapita culture spreads distinctive pottery and agricultural practices across Melanesia and Western Polynesia. Long-distance voyaging connects islands separated by thousands of miles of ocean.";
            } else {
                // Early Polynesian expansion
                return "Polynesian navigators push further into the Pacific, settling remote islands like Hawaii and Easter Island. Their sophisticated knowledge of stars, currents, and wildlife enables voyages across Earth's largest ocean.";
            }
    }
    
    return null;
}

function getMedievalDescription(zone: CulturalZone, year: number): string | null {
    switch (zone) {
        case 'EUROPEAN':
            if (year < 800) {
                // Early Medieval / Dark Ages
                return "Following Rome's collapse, Germanic kingdoms struggle to maintain order. The Byzantine Empire preserves classical knowledge in the east, while in the west, monasteries become islands of literacy in a fragmented world.";
            } else if (year < 1000) {
                // Carolingian and Viking Age
                return "Charlemagne's empire briefly reunites Western Europe before fragmenting again. Viking raiders terrorize coasts and rivers, eventually establishing kingdoms from Iceland to Russia. The feudal system begins to take shape.";
            } else if (year < 1250) {
                // High Medieval
                return "This is the age of crusades, cathedral-building, and the rise of powerful monarchies. Universities emerge in Bologna, Paris, and Oxford, while improved agriculture supports growing towns and trade.";
            } else {
                // Late Medieval
                return "Europe faces crisis with the Black Death, Hundred Years' War, and peasant revolts. Yet this turmoil sparks change: parliamentary government develops, banking houses rise in Italy, and the Renaissance begins to dawn.";
            }
            
        case 'EAST_ASIAN':
            if (year < 960) {
                // Tang dynasty and contemporaries
                return "The cosmopolitan Tang dynasty presides over a golden age of poetry, Buddhism, and international trade. Chang'an is the world's largest city, while Japan's Heian court develops a refined aesthetic culture.";
            } else if (year < 1279) {
                // Song dynasty period
                return "Despite military weakness, the Song dynasty oversees unprecedented economic growth and technological innovation. Paper money, gunpowder weapons, and the printing press transform society.";
            } else {
                // Yuan/Mongol period
                return "The Mongol conquest creates the largest contiguous empire in history, facilitating unprecedented cultural exchange. Marco Polo and Ibn Battuta traverse the Silk Road as East and West are connected like never before.";
            }
            
        case 'MENA':
            if (year < 750) {
                // Early Islamic period
                return "The rapid expansion of Islam creates a vast Caliphate stretching from Spain to Central Asia. The Umayyad dynasty rules from Damascus, blending Arab, Persian, and Byzantine administrative traditions.";
            } else if (year < 1000) {
                // Abbasid golden age
                return "Under the Abbasid Caliphate, Baghdad becomes the world's intellectual capital. The House of Wisdom preserves and expands upon Greek and Indian knowledge while Islamic scholars make groundbreaking discoveries.";
            } else if (year < 1250) {
                // Fragmentation and Crusades
                return "The unified Caliphate fragments into regional powers while Crusaders establish states in the Levant. Despite political turmoil, Islamic culture continues to flourish from Cordoba to Samarkand.";
            } else {
                // Mamluk and early Ottoman period
                return "Turkic military elites dominate the Islamic world. The Mamluks rule Egypt and Syria while the rising Ottoman Empire begins its expansion from Anatolia, eventually becoming Islam's greatest power.";
            }
    }
    
    return null;
}