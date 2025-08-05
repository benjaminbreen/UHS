/**
 * constants/characterData/religions.ts - Defines religious demographics by region for procedural generation.
 */
import { HistoricalEra, CulturalZone, Religion } from '../../types';
import { GEOGRAPHICAL_DATA } from '../../constants/index';
import { ValueNoise } from '../../utils/noise';


// This data is keyed by Region string, which must match the keys in constants/gameData/geography.ts
export const RELIGION_DATA: Partial<Record<CulturalZone, Partial<Record<string, Partial<Record<HistoricalEra, { religion: Religion; weight: number }[]>>>>>> = {
    'EUROPEAN': {
        "British Isles": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Celtic Druidism', weight: 65 }, { religion: 'Roman Polytheism', weight: 30 }, { religion: 'Early Christianity', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Roman Catholicism', weight: 75 }, { religion: 'Celtic Christianity', weight: 15 }, { religion: 'Norse Paganism', weight: 8 }, { religion: 'Judaism', weight: 2 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Protestantism', weight: 60 }, { religion: 'Roman Catholicism', weight: 35 }, { religion: 'Judaism', weight: 3 }, { religion: 'Puritanism', weight: 2 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Protestantism', weight: 65 }, { religion: 'Roman Catholicism', weight: 25 }, { religion: 'Atheism', weight: 8 }, { religion: 'Judaism', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Atheism', weight: 45 }, { religion: 'Protestantism', weight: 35 }, { religion: 'Roman Catholicism', weight: 12 }, { religion: 'Islam', weight: 5 }, { religion: 'Hinduism', weight: 3 } ]
        },
        "France": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Celtic Druidism', weight: 55 }, { religion: 'Roman Polytheism', weight: 40 }, { religion: 'Early Christianity', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Roman Catholicism', weight: 94 }, { religion: 'Judaism', weight: 4 }, { religion: 'Catharism', weight: 2 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Roman Catholicism', weight: 80 }, { religion: 'Protestantism', weight: 15 }, { religion: 'Judaism', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Roman Catholicism', weight: 65 }, { religion: 'Atheism', weight: 25 }, { religion: 'Protestantism', weight: 8 }, { religion: 'Judaism', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Atheism', weight: 50 }, { religion: 'Roman Catholicism', weight: 40 }, { religion: 'Islam', weight: 8 }, { religion: 'Judaism', weight: 2 } ]
        },
        "Iberian Peninsula": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Roman Polytheism', weight: 60 }, { religion: 'Celtic Druidism', weight: 25 }, { religion: 'Judaism', weight: 10 }, { religion: 'Early Christianity', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Sunni Islam', weight: 55 }, { religion: 'Roman Catholicism', weight: 35 }, { religion: 'Judaism', weight: 8 }, { religion: 'Mozarabic Christianity', weight: 2 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Roman Catholicism', weight: 98 }, { religion: 'Conversos', weight: 2 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Roman Catholicism', weight: 92 }, { religion: 'Atheism', weight: 8 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Roman Catholicism', weight: 70 }, { religion: 'Atheism', weight: 27 }, { religion: 'Islam', weight: 3 } ]
        },
        "Italy": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Roman Polytheism', weight: 75 }, { religion: 'Early Christianity', weight: 20 }, { religion: 'Judaism', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Roman Catholicism', weight: 96 }, { religion: 'Judaism', weight: 3 }, { religion: 'Byzantine Christianity', weight: 1 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Roman Catholicism', weight: 95 }, { religion: 'Judaism', weight: 4 }, { religion: 'Protestantism', weight: 1 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Roman Catholicism', weight: 88 }, { religion: 'Atheism', weight: 10 }, { religion: 'Judaism', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Roman Catholicism', weight: 75 }, { religion: 'Atheism', weight: 20 }, { religion: 'Islam', weight: 3 }, { religion: 'Judaism', weight: 2 } ]
        },
        "Germanic Lands": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Germanic Paganism', weight: 85 }, { religion: 'Roman Polytheism', weight: 10 }, { religion: 'Early Christianity', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Roman Catholicism', weight: 92 }, { religion: 'Germanic Paganism', weight: 5 }, { religion: 'Judaism', weight: 3 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Protestantism', weight: 55 }, { religion: 'Roman Catholicism', weight: 42 }, { religion: 'Judaism', weight: 3 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Protestantism', weight: 50 }, { religion: 'Roman Catholicism', weight: 38 }, { religion: 'Judaism', weight: 8 }, { religion: 'Atheism', weight: 4 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Atheism', weight: 45 }, { religion: 'Protestantism', weight: 28 }, { religion: 'Roman Catholicism', weight: 22 }, { religion: 'Islam', weight: 5 } ]
        },
        "Central Europe": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Celtic Druidism', weight: 40 }, { religion: 'Germanic Paganism', weight: 35 }, { religion: 'Roman Polytheism', weight: 20 }, { religion: 'Slavic Paganism', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Roman Catholicism', weight: 85 }, { religion: 'Eastern Orthodoxy', weight: 10 }, { religion: 'Judaism', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Roman Catholicism', weight: 55 }, { religion: 'Protestantism', weight: 35 }, { religion: 'Judaism', weight: 8 }, { religion: 'Eastern Orthodoxy', weight: 2 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Roman Catholicism', weight: 45 }, { religion: 'Protestantism', weight: 25 }, { religion: 'Judaism', weight: 20 }, { religion: 'Eastern Orthodoxy', weight: 5 }, { religion: 'Atheism', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Roman Catholicism', weight: 40 }, { religion: 'Atheism', weight: 35 }, { religion: 'Protestantism', weight: 15 }, { religion: 'Judaism', weight: 8 }, { religion: 'Eastern Orthodoxy', weight: 2 } ]
        },
        "Balkans": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Greek Polytheism', weight: 45 }, { religion: 'Roman Polytheism', weight: 30 }, { religion: 'Early Christianity', weight: 20 }, { religion: 'Thracian Religion', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Eastern Orthodoxy', weight: 60 }, { religion: 'Roman Catholicism', weight: 25 }, { religion: 'Sunni Islam', weight: 12 }, { religion: 'Judaism', weight: 3 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Sunni Islam', weight: 50 }, { religion: 'Eastern Orthodoxy', weight: 35 }, { religion: 'Roman Catholicism', weight: 12 }, { religion: 'Judaism', weight: 3 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Eastern Orthodoxy', weight: 45 }, { religion: 'Sunni Islam', weight: 40 }, { religion: 'Roman Catholicism', weight: 12 }, { religion: 'Judaism', weight: 3 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Eastern Orthodoxy', weight: 40 }, { religion: 'Sunni Islam', weight: 35 }, { religion: 'Roman Catholicism', weight: 15 }, { religion: 'Atheism', weight: 10 } ]
        },
        "Scandinavia": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Norse Paganism', weight: 95 }, { religion: 'Shamanism', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Norse Paganism', weight: 50 }, { religion: 'Roman Catholicism', weight: 50 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Protestantism', weight: 98 }, { religion: 'Roman Catholicism', weight: 2 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Protestantism', weight: 92 }, { religion: 'Atheism', weight: 8 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Atheism', weight: 65 }, { religion: 'Protestantism', weight: 30 }, { religion: 'Islam', weight: 5 } ]
        },
        "Eastern Europe": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Slavic Paganism', weight: 60 }, { religion: 'Germanic Paganism', weight: 25 }, { religion: 'Shamanism', weight: 15 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Eastern Orthodoxy', weight: 70 }, { religion: 'Roman Catholicism', weight: 15 }, { religion: 'Slavic Paganism', weight: 10 }, { religion: 'Judaism', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Eastern Orthodoxy', weight: 65 }, { religion: 'Roman Catholicism', weight: 20 }, { religion: 'Judaism', weight: 10 }, { religion: 'Islam', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Eastern Orthodoxy', weight: 70 }, { religion: 'Roman Catholicism', weight: 12 }, { religion: 'Judaism', weight: 10 }, { religion: 'Atheism', weight: 8 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Atheism', weight: 55 }, { religion: 'Eastern Orthodoxy', weight: 35 }, { religion: 'Roman Catholicism', weight: 5 }, { religion: 'Islam', weight: 3 }, { religion: 'Judaism', weight: 2 } ]
        },
        "Low Countries": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Germanic Paganism', weight: 55 }, { religion: 'Celtic Druidism', weight: 30 }, { religion: 'Roman Polytheism', weight: 15 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Roman Catholicism', weight: 95 }, { religion: 'Judaism', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Protestantism', weight: 60 }, { religion: 'Roman Catholicism', weight: 35 }, { religion: 'Judaism', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Protestantism', weight: 45 }, { religion: 'Roman Catholicism', weight: 40 }, { religion: 'Atheism', weight: 12 }, { religion: 'Judaism', weight: 3 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Atheism', weight: 55 }, { religion: 'Roman Catholicism', weight: 22 }, { religion: 'Protestantism', weight: 18 }, { religion: 'Islam', weight: 5 } ]
        },
        "Greece and Aegean": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Greek Polytheism', weight: 85 }, { religion: 'Early Christianity', weight: 12 }, { religion: 'Judaism', weight: 3 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Eastern Orthodoxy', weight: 92 }, { religion: 'Judaism', weight: 5 }, { religion: 'Sunni Islam', weight: 3 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Eastern Orthodoxy', weight: 75 }, { religion: 'Sunni Islam', weight: 22 }, { religion: 'Judaism', weight: 3 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Eastern Orthodoxy', weight: 88 }, { religion: 'Sunni Islam', weight: 10 }, { religion: 'Judaism', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Eastern Orthodoxy', weight: 85 }, { religion: 'Atheism', weight: 10 }, { religion: 'Sunni Islam', weight: 3 }, { religion: 'Judaism', weight: 2 } ]
        },
    },
    'NORTH_AMERICAN_PRE_COLUMBIAN': {
        "Pacific Coast": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Pacific Coast Shamanism', weight: 50 }, { religion: 'Totemism', weight: 30 }, { religion: 'Animism', weight: 20 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Pacific Coast Shamanism', weight: 45 }, { religion: 'Totemism', weight: 35 }, { religion: 'Potlatch Religion', weight: 20 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Pacific Coast Shamanism', weight: 40 }, { religion: 'Totemism', weight: 30 }, { religion: 'Potlatch Religion', weight: 20 }, { religion: 'Christianity', weight: 10 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 75 }, { religion: 'Pacific Coast Shamanism', weight: 12 }, { religion: 'Totemism', weight: 8 }, { religion: 'Atheism', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 55 }, { religion: 'Atheism', weight: 30 }, { religion: 'Buddhism', weight: 8 }, { religion: 'Pacific Coast Shamanism', weight: 7 } ]
        },
        "Southwest": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Pueblo Religion', weight: 70 }, { religion: 'Shamanism', weight: 20 }, { religion: 'Animism', weight: 10 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Pueblo Religion', weight: 65 }, { religion: 'Kachina Worship', weight: 25 }, { religion: 'Shamanism', weight: 10 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Pueblo Religion', weight: 45 }, { religion: 'Roman Catholicism', weight: 35 }, { religion: 'Kachina Worship', weight: 15 }, { religion: 'Shamanism', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Roman Catholicism', weight: 65 }, { religion: 'Protestantism', weight: 20 }, { religion: 'Pueblo Religion', weight: 10 }, { religion: 'Atheism', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Roman Catholicism', weight: 55 }, { religion: 'Protestantism', weight: 30 }, { religion: 'Atheism', weight: 10 }, { religion: 'Pueblo Religion', weight: 5 } ]
        },
        "Great Plains": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Great Spirit Worship', weight: 60 }, { religion: 'Buffalo Shamanism', weight: 25 }, { religion: 'Vision Quest Traditions', weight: 15 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Great Spirit Worship', weight: 50 }, { religion: 'Sun Dance Religion', weight: 30 }, { religion: 'Buffalo Shamanism', weight: 20 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Great Spirit Worship', weight: 45 }, { religion: 'Sun Dance Religion', weight: 25 }, { religion: 'Buffalo Shamanism', weight: 20 }, { religion: 'Christianity', weight: 10 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 75 }, { religion: 'Great Spirit Worship', weight: 12 }, { religion: 'Sun Dance Religion', weight: 8 }, { religion: 'Atheism', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 70 }, { religion: 'Atheism', weight: 20 }, { religion: 'Great Spirit Worship', weight: 8 }, { religion: 'Sun Dance Religion', weight: 2 } ]
        },
        "Mississippi Valley": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Mississippian Religion', weight: 60 }, { religion: 'Mound Builder Shamanism', weight: 25 }, { religion: 'Ancestral Worship', weight: 15 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Mississippian Religion', weight: 55 }, { religion: 'Cahokia Solar Worship', weight: 30 }, { religion: 'Mound Builder Shamanism', weight: 15 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Mississippian Religion', weight: 35 }, { religion: 'Christianity', weight: 40 }, { religion: 'Cahokia Solar Worship', weight: 15 }, { religion: 'Mound Builder Shamanism', weight: 10 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 85 }, { religion: 'Mississippian Religion', weight: 8 }, { religion: 'Atheism', weight: 7 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 75 }, { religion: 'Atheism', weight: 20 }, { religion: 'Mississippian Religion', weight: 5 } ]
        },
        "Northeast Woodlands": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Iroquois Longhouse Religion', weight: 45 }, { religion: 'Algonquian Shamanism', weight: 35 }, { religion: 'Forest Spirit Worship', weight: 20 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Iroquois Longhouse Religion', weight: 50 }, { religion: 'Algonquian Shamanism', weight: 30 }, { religion: 'Forest Spirit Worship', weight: 20 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Iroquois Longhouse Religion', weight: 25 }, { religion: 'Christianity', weight: 40 }, { religion: 'Algonquian Shamanism', weight: 20 }, { religion: 'Syncretic Christianity', weight: 15 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 80 }, { religion: 'Iroquois Longhouse Religion', weight: 8 }, { religion: 'Judaism', weight: 7 }, { religion: 'Atheism', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 65 }, { religion: 'Atheism', weight: 20 }, { religion: 'Judaism', weight: 10 }, { religion: 'Iroquois Longhouse Religion', weight: 5 } ]
        },
        "Southeast": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Creek Ceremonialism', weight: 45 }, { religion: 'Cherokee Shamanism', weight: 30 }, { religion: 'Southeastern Shamanism', weight: 25 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Creek Ceremonialism', weight: 50 }, { religion: 'Cherokee Shamanism', weight: 30 }, { religion: 'Green Corn Ceremony', weight: 20 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Creek Ceremonialism', weight: 25 }, { religion: 'Christianity', weight: 50 }, { religion: 'Cherokee Shamanism', weight: 15 }, { religion: 'Syncretic Christianity', weight: 10 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 88 }, { religion: 'Creek Ceremonialism', weight: 7 }, { religion: 'Atheism', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 80 }, { religion: 'Atheism', weight: 15 }, { religion: 'Creek Ceremonialism', weight: 5 } ]
        },
        "Arctic and Subarctic": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Inuit Shamanism', weight: 80 }, { religion: 'Arctic Animism', weight: 20 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Inuit Shamanism', weight: 85 }, { religion: 'Arctic Animism', weight: 15 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Inuit Shamanism', weight: 70 }, { religion: 'Arctic Animism', weight: 20 }, { religion: 'Christianity', weight: 10 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 65 }, { religion: 'Inuit Shamanism', weight: 25 }, { religion: 'Arctic Animism', weight: 10 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 70 }, { religion: 'Atheism', weight: 15 }, { religion: 'Inuit Shamanism', weight: 15 } ]
        },
        "Mexico and Central Highlands": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Teotihuacan Religion', weight: 45 }, { religion: 'Mesoamerican Shamanism', weight: 30 }, { religion: 'Olmec Jaguar Worship', weight: 25 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Aztec Polytheism', weight: 55 }, { religion: 'Maya Polytheism', weight: 25 }, { religion: 'Mesoamerican Shamanism', weight: 20 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Roman Catholicism', weight: 70 }, { religion: 'Syncretic Christianity', weight: 20 }, { religion: 'Aztec Polytheism', weight: 10 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Roman Catholicism', weight: 88 }, { religion: 'Syncretic Christianity', weight: 10 }, { religion: 'Atheism', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Roman Catholicism', weight: 75 }, { religion: 'Pentecostalism', weight: 15 }, { religion: 'Atheism', weight: 8 }, { religion: 'Syncretic Christianity', weight: 2 } ]
        },
        "Northern Rockies": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Mountain Spirit Worship', weight: 55 }, { religion: 'Plateau Shamanism', weight: 30 }, { religion: 'Vision Quest Traditions', weight: 15 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Mountain Spirit Worship', weight: 50 }, { religion: 'Plateau Shamanism', weight: 35 }, { religion: 'Guardian Spirit Religion', weight: 15 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Mountain Spirit Worship', weight: 30 }, { religion: 'Christianity', weight: 40 }, { religion: 'Plateau Shamanism', weight: 20 }, { religion: 'Guardian Spirit Religion', weight: 10 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 75 }, { religion: 'Mountain Spirit Worship', weight: 15 }, { religion: 'Atheism', weight: 10 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 65 }, { religion: 'Atheism', weight: 25 }, { religion: 'Mountain Spirit Worship', weight: 10 } ]
        },
        "Atlantic Coast": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Coastal Algonquian Religion', weight: 55 }, { religion: 'Atlantic Shamanism', weight: 25 }, { religion: 'Tidewater Spiritualism', weight: 20 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Coastal Algonquian Religion', weight: 60 }, { religion: 'Atlantic Shamanism', weight: 20 }, { religion: 'Tidewater Spiritualism', weight: 20 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Christianity', weight: 65 }, { religion: 'Coastal Algonquian Religion', weight: 20 }, { religion: 'Atlantic Shamanism', weight: 15 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 80 }, { religion: 'Judaism', weight: 12 }, { religion: 'Atheism', weight: 8 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 60 }, { religion: 'Atheism', weight: 20 }, { religion: 'Judaism', weight: 15 }, { religion: 'Islam', weight: 3 }, { religion: 'Hinduism', weight: 2 } ]
        },
    },
    'SOUTH_AMERICAN': {
        "Andes North": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Chavin Jaguar Cult', weight: 45 }, { religion: 'Andean Shamanism', weight: 35 }, { religion: 'Mountain Spirit Worship', weight: 20 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Inca Sun Worship', weight: 55 }, { religion: 'Andean Shamanism', weight: 25 }, { religion: 'Ancestor Worship', weight: 20 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Roman Catholicism', weight: 65 }, { religion: 'Syncretic Christianity', weight: 20 }, { religion: 'Inca Sun Worship', weight: 15 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Roman Catholicism', weight: 80 }, { religion: 'Syncretic Christianity', weight: 17 }, { religion: 'Atheism', weight: 3 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Roman Catholicism', weight: 65 }, { religion: 'Pentecostalism', weight: 25 }, { religion: 'Atheism', weight: 8 }, { religion: 'Syncretic Christianity', weight: 2 } ]
        },
        "Andes South": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Tiwanaku Sun Worship', weight: 50 }, { religion: 'Andean Shamanism', weight: 30 }, { religion: 'Lake Titicaca Spiritualism', weight: 20 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Inca Sun Worship', weight: 65 }, { religion: 'Andean Shamanism', weight: 20 }, { religion: 'Ancestor Worship', weight: 15 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Roman Catholicism', weight: 70 }, { religion: 'Syncretic Christianity', weight: 18 }, { religion: 'Inca Sun Worship', weight: 12 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Roman Catholicism', weight: 85 }, { religion: 'Syncretic Christianity', weight: 12 }, { religion: 'Atheism', weight: 3 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Roman Catholicism', weight: 70 }, { religion: 'Pentecostalism', weight: 20 }, { religion: 'Atheism', weight: 8 }, { religion: 'Syncretic Christianity', weight: 2 } ]
        },
        "Amazon Basin": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Amazonian Shamanism', weight: 70 }, { religion: 'Forest Spirit Worship', weight: 20 }, { religion: 'River Spirit Worship', weight: 10 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Amazonian Shamanism', weight: 75 }, { religion: 'Forest Spirit Worship', weight: 15 }, { religion: 'River Spirit Worship', weight: 10 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Amazonian Shamanism', weight: 60 }, { religion: 'Roman Catholicism', weight: 25 }, { religion: 'Syncretic Christianity', weight: 15 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Roman Catholicism', weight: 55 }, { religion: 'Amazonian Shamanism', weight: 30 }, { religion: 'Syncretic Christianity', weight: 15 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Roman Catholicism', weight: 50 }, { religion: 'Pentecostalism', weight: 30 }, { religion: 'Amazonian Shamanism', weight: 15 }, { religion: 'Atheism', weight: 5 } ]
        },
        "Gran Chaco and Pampas": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Guarani Shamanism', weight: 60 }, { religion: 'Charrua Religion', weight: 25 }, { religion: 'Pampas Shamanism', weight: 15 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Guarani Shamanism', weight: 65 }, { religion: 'Charrua Religion', weight: 20 }, { religion: 'Pampas Shamanism', weight: 15 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Roman Catholicism', weight: 65 }, { religion: 'Guarani Shamanism', weight: 20 }, { religion: 'Syncretic Christianity', weight: 15 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Roman Catholicism', weight: 80 }, { religion: 'Protestantism', weight: 15 }, { religion: 'Atheism', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Roman Catholicism', weight: 65 }, { religion: 'Pentecostalism', weight: 20 }, { religion: 'Atheism', weight: 12 }, { religion: 'Protestantism', weight: 3 } ]
        },
        "Atlantic Coast": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Tupi Shamanism', weight: 60 }, { religion: 'Coastal Animism', weight: 25 }, { religion: 'Forest Spirit Worship', weight: 15 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Tupi Shamanism', weight: 65 }, { religion: 'Coastal Animism', weight: 20 }, { religion: 'Forest Spirit Worship', weight: 15 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Roman Catholicism', weight: 70 }, { religion: 'Tupi Shamanism', weight: 15 }, { religion: 'Syncretic Christianity', weight: 15 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Roman Catholicism', weight: 75 }, { religion: 'Protestantism', weight: 15 }, { religion: 'Syncretic Christianity', weight: 8 }, { religion: 'Atheism', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Roman Catholicism', weight: 60 }, { religion: 'Pentecostalism', weight: 25 }, { religion: 'Atheism', weight: 10 }, { religion: 'Protestantism', weight: 5 } ]
        },
        "Guiana Shield": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Carib Shamanism', weight: 70 }, { religion: 'Highland Shamanism', weight: 20 }, { religion: 'River Spirit Worship', weight: 10 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Carib Shamanism', weight: 75 }, { religion: 'Highland Shamanism', weight: 15 }, { religion: 'River Spirit Worship', weight: 10 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Carib Shamanism', weight: 35 }, { religion: 'Roman Catholicism', weight: 30 }, { religion: 'Protestantism', weight: 35 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Roman Catholicism', weight: 40 }, { religion: 'Protestantism', weight: 40 }, { religion: 'Carib Shamanism', weight: 20 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Roman Catholicism', weight: 35 }, { religion: 'Protestantism', weight: 35 }, { religion: 'Pentecostalism', weight: 20 }, { religion: 'Carib Shamanism', weight: 10 } ]
        },
        "Patagonia": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Tehuelche Shamanism', weight: 70 }, { religion: 'Patagonian Shamanism', weight: 20 }, { religion: 'Selknam Religion', weight: 10 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Tehuelche Shamanism', weight: 75 }, { religion: 'Patagonian Shamanism', weight: 15 }, { religion: 'Selknam Religion', weight: 10 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Tehuelche Shamanism', weight: 55 }, { religion: 'Roman Catholicism', weight: 35 }, { religion: 'Patagonian Shamanism', weight: 10 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Roman Catholicism', weight: 75 }, { religion: 'Protestantism', weight: 15 }, { religion: 'Tehuelche Shamanism', weight: 10 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Roman Catholicism', weight: 70 }, { religion: 'Atheism', weight: 20 }, { religion: 'Protestantism', weight: 10 } ]
        },
        "Southern Highlands": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Aymara Religion', weight: 60 }, { religion: 'Highland Shamanism', weight: 25 }, { religion: 'Ancestor Worship', weight: 15 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Aymara Religion', weight: 45 }, { religion: 'Inca Sun Worship', weight: 35 }, { religion: 'Highland Shamanism', weight: 20 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Roman Catholicism', weight: 65 }, { religion: 'Syncretic Christianity', weight: 25 }, { religion: 'Aymara Religion', weight: 10 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Roman Catholicism', weight: 80 }, { religion: 'Syncretic Christianity', weight: 17 }, { religion: 'Atheism', weight: 3 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Roman Catholicism', weight: 70 }, { religion: 'Pentecostalism', weight: 20 }, { religion: 'Atheism', weight: 8 }, { religion: 'Syncretic Christianity', weight: 2 } ]
        },
        "Llanos and Orinoco": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Llanos Shamanism', weight: 60 }, { religion: 'River Spirit Worship', weight: 25 }, { religion: 'Plains Animism', weight: 15 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Llanos Shamanism', weight: 65 }, { religion: 'River Spirit Worship', weight: 20 }, { religion: 'Plains Animism', weight: 15 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Roman Catholicism', weight: 65 }, { religion: 'Llanos Shamanism', weight: 20 }, { religion: 'Syncretic Christianity', weight: 15 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Roman Catholicism', weight: 75 }, { religion: 'Protestantism', weight: 20 }, { religion: 'Atheism', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Roman Catholicism', weight: 65 }, { religion: 'Pentecostalism', weight: 25 }, { religion: 'Atheism', weight: 8 }, { religion: 'Protestantism', weight: 2 } ]
        },
    },
    'MENA': {
        "Nile Valley": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Egyptian Polytheism', weight: 70 }, { religion: 'Greek Polytheism', weight: 15 }, { religion: 'Early Christianity', weight: 10 }, { religion: 'Judaism', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Coptic Christianity', weight: 45 }, { religion: 'Sunni Islam', weight: 50 }, { religion: 'Judaism', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Sunni Islam', weight: 85 }, { religion: 'Coptic Christianity', weight: 12 }, { religion: 'Judaism', weight: 3 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Sunni Islam', weight: 88 }, { religion: 'Coptic Christianity', weight: 10 }, { religion: 'Judaism', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Sunni Islam', weight: 85 }, { religion: 'Coptic Christianity', weight: 12 }, { religion: 'Atheism', weight: 2 }, { religion: 'Judaism', weight: 1 } ]
        },
        "Levant": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Canaanite Religion', weight: 40 }, { religion: 'Judaism', weight: 30 }, { religion: 'Greek Polytheism', weight: 15 }, { religion: 'Early Christianity', weight: 15 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Sunni Islam', weight: 50 }, { religion: 'Eastern Christianity', weight: 30 }, { religion: 'Judaism', weight: 15 }, { religion: 'Shia Islam', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Sunni Islam', weight: 65 }, { religion: 'Eastern Christianity', weight: 25 }, { religion: 'Judaism', weight: 8 }, { religion: 'Druze', weight: 2 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Sunni Islam', weight: 60 }, { religion: 'Eastern Christianity', weight: 25 }, { religion: 'Judaism', weight: 12 }, { religion: 'Druze', weight: 3 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Sunni Islam', weight: 55 }, { religion: 'Judaism', weight: 25 }, { religion: 'Eastern Christianity', weight: 15 }, { religion: 'Druze', weight: 3 }, { religion: 'Atheism', weight: 2 } ]
        },
        "Anatolia": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Greek Polytheism', weight: 45 }, { religion: 'Persian Zoroastrianism', weight: 25 }, { religion: 'Early Christianity', weight: 20 }, { religion: 'Local Anatolian Cults', weight: 10 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Byzantine Christianity', weight: 60 }, { religion: 'Sunni Islam', weight: 35 }, { religion: 'Judaism', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Sunni Islam', weight: 85 }, { religion: 'Eastern Orthodox Christianity', weight: 12 }, { religion: 'Judaism', weight: 3 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Sunni Islam', weight: 92 }, { religion: 'Eastern Orthodox Christianity', weight: 6 }, { religion: 'Judaism', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Sunni Islam', weight: 85 }, { religion: 'Atheism', weight: 8 }, { religion: 'Eastern Orthodox Christianity', weight: 5 }, { religion: 'Alevi Islam', weight: 2 } ]
        },
        "Mesopotamia": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Mesopotamian Polytheism', weight: 60 }, { religion: 'Persian Zoroastrianism', weight: 20 }, { religion: 'Early Christianity', weight: 15 }, { religion: 'Judaism', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Sunni Islam', weight: 65 }, { religion: 'Shia Islam', weight: 20 }, { religion: 'Eastern Christianity', weight: 10 }, { religion: 'Judaism', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Sunni Islam', weight: 60 }, { religion: 'Shia Islam', weight: 30 }, { religion: 'Eastern Christianity', weight: 8 }, { religion: 'Judaism', weight: 2 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Shia Islam', weight: 55 }, { religion: 'Sunni Islam', weight: 35 }, { religion: 'Eastern Christianity', weight: 8 }, { religion: 'Judaism', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Shia Islam', weight: 60 }, { religion: 'Sunni Islam', weight: 30 }, { religion: 'Eastern Christianity', weight: 8 }, { religion: 'Atheism', weight: 2 } ]
        },
        "Maghreb": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Berber Traditional Religion', weight: 50 }, { religion: 'Roman Polytheism', weight: 25 }, { religion: 'Early Christianity', weight: 20 }, { religion: 'Judaism', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Sunni Islam', weight: 85 }, { religion: 'Judaism', weight: 10 }, { religion: 'Christianity', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Sunni Islam', weight: 92 }, { religion: 'Judaism', weight: 6 }, { religion: 'Christianity', weight: 2 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Sunni Islam', weight: 95 }, { religion: 'Judaism', weight: 3 }, { religion: 'Christianity', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Sunni Islam', weight: 96 }, { religion: 'Christianity', weight: 2 }, { religion: 'Judaism', weight: 1 }, { religion: 'Atheism', weight: 1 } ]
        },
        "Arabian Peninsula": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Arabian Polytheism', weight: 70 }, { religion: 'Judaism', weight: 15 }, { religion: 'Christianity', weight: 10 }, { religion: 'Zoroastrianism', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Sunni Islam', weight: 92 }, { religion: 'Shia Islam', weight: 5 }, { religion: 'Judaism', weight: 2 }, { religion: 'Christianity', weight: 1 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Sunni Islam', weight: 95 }, { religion: 'Shia Islam', weight: 4 }, { religion: 'Judaism', weight: 1 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Sunni Islam', weight: 96 }, { religion: 'Shia Islam', weight: 3 }, { religion: 'Christianity', weight: 1 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Sunni Islam', weight: 90 }, { religion: 'Shia Islam', weight: 8 }, { religion: 'Christianity', weight: 1 }, { religion: 'Hinduism', weight: 1 } ]
        },
        "Persian Plateau": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Zoroastrianism', weight: 75 }, { religion: 'Mithraism', weight: 15 }, { religion: 'Manichaeism', weight: 8 }, { religion: 'Judaism', weight: 2 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Sunni Islam', weight: 55 }, { religion: 'Shia Islam', weight: 35 }, { religion: 'Zoroastrianism', weight: 8 }, { religion: 'Judaism', weight: 2 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Shia Islam', weight: 85 }, { religion: 'Sunni Islam', weight: 10 }, { religion: 'Zoroastrianism', weight: 4 }, { religion: 'Judaism', weight: 1 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Shia Islam', weight: 88 }, { religion: 'Sunni Islam', weight: 8 }, { religion: 'Zoroastrianism', weight: 3 }, { religion: 'Bahai Faith', weight: 1 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Shia Islam', weight: 90 }, { religion: 'Sunni Islam', weight: 5 }, { religion: 'Zoroastrianism', weight: 2 }, { religion: 'Bahai Faith', weight: 2 }, { religion: 'Christianity', weight: 1 } ]
        },
        "Caucasus": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Georgian Traditional Religion', weight: 40 }, { religion: 'Armenian Paganism', weight: 30 }, { religion: 'Zoroastrianism', weight: 20 }, { religion: 'Early Christianity', weight: 10 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Georgian Orthodox Christianity', weight: 40 }, { religion: 'Armenian Apostolic Christianity', weight: 30 }, { religion: 'Sunni Islam', weight: 25 }, { religion: 'Judaism', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Georgian Orthodox Christianity', weight: 35 }, { religion: 'Armenian Apostolic Christianity', weight: 25 }, { religion: 'Sunni Islam', weight: 35 }, { religion: 'Shia Islam', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Georgian Orthodox Christianity', weight: 30 }, { religion: 'Armenian Apostolic Christianity', weight: 20 }, { religion: 'Sunni Islam', weight: 35 }, { religion: 'Shia Islam', weight: 10 }, { religion: 'Russian Orthodoxy', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Georgian Orthodox Christianity', weight: 30 }, { religion: 'Sunni Islam', weight: 30 }, { religion: 'Armenian Apostolic Christianity', weight: 15 }, { religion: 'Shia Islam', weight: 15 }, { religion: 'Atheism', weight: 10 } ]
        },
        "Eastern Desert and Red Sea": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Egyptian Polytheism', weight: 55 }, { religion: 'Nubian Traditional Religion', weight: 25 }, { religion: 'Early Christianity', weight: 15 }, { religion: 'Judaism', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Coptic Christianity', weight: 40 }, { religion: 'Sunni Islam', weight: 45 }, { religion: 'Nubian Christianity', weight: 10 }, { religion: 'Judaism', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Sunni Islam', weight: 70 }, { religion: 'Coptic Christianity', weight: 25 }, { religion: 'Judaism', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Sunni Islam', weight: 80 }, { religion: 'Coptic Christianity', weight: 18 }, { religion: 'Judaism', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Sunni Islam', weight: 85 }, { religion: 'Coptic Christianity', weight: 13 }, { religion: 'Atheism', weight: 2 } ]
        },
    },
    'SUB_SAHARAN_AFRICAN': {
        "Sahel": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'West African Traditional Religion', weight: 90 }, { religion: 'Ancestral Worship', weight: 10 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'West African Traditional Religion', weight: 60 }, { religion: 'Sunni Islam', weight: 35 }, { religion: 'Ancestral Worship', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Sunni Islam', weight: 70 }, { religion: 'West African Traditional Religion', weight: 25 }, { religion: 'Syncretic Islam', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Sunni Islam', weight: 80 }, { religion: 'West African Traditional Religion', weight: 15 }, { religion: 'Christianity', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Sunni Islam', weight: 75 }, { religion: 'Christianity', weight: 15 }, { religion: 'West African Traditional Religion', weight: 8 }, { religion: 'Atheism', weight: 2 } ]
        },
        "Upper Guinea": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'West African Traditional Religion', weight: 95 }, { religion: 'Ancestral Worship', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'West African Traditional Religion', weight: 85 }, { religion: 'Sunni Islam', weight: 10 }, { religion: 'Ancestral Worship', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'West African Traditional Religion', weight: 75 }, { religion: 'Sunni Islam', weight: 15 }, { religion: 'Christianity', weight: 10 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'West African Traditional Religion', weight: 45 }, { religion: 'Christianity', weight: 35 }, { religion: 'Sunni Islam', weight: 20 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 45 }, { religion: 'Sunni Islam', weight: 30 }, { religion: 'West African Traditional Religion', weight: 20 }, { religion: 'Atheism', weight: 5 } ]
        },
        "Lower Guinea and Congo Basin": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Central African Traditional Religion', weight: 95 }, { religion: 'Ancestral Worship', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Central African Traditional Religion', weight: 90 }, { religion: 'Ancestral Worship', weight: 10 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Central African Traditional Religion', weight: 70 }, { religion: 'Christianity', weight: 25 }, { religion: 'Ancestral Worship', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 60 }, { religion: 'Central African Traditional Religion', weight: 35 }, { religion: 'Sunni Islam', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 75 }, { religion: 'Central African Traditional Religion', weight: 15 }, { religion: 'Sunni Islam', weight: 8 }, { religion: 'Atheism', weight: 2 } ]
        },
        "Horn of Africa": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Ethiopian Traditional Religion', weight: 50 }, { religion: 'Judaism', weight: 25 }, { religion: 'Early Christianity', weight: 20 }, { religion: 'Ancestral Worship', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Ethiopian Orthodox Christianity', weight: 60 }, { religion: 'Sunni Islam', weight: 25 }, { religion: 'Ethiopian Traditional Religion', weight: 10 }, { religion: 'Ethiopian Judaism', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Ethiopian Orthodox Christianity', weight: 55 }, { religion: 'Sunni Islam', weight: 35 }, { religion: 'Ethiopian Traditional Religion', weight: 8 }, { religion: 'Ethiopian Judaism', weight: 2 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Ethiopian Orthodox Christianity', weight: 50 }, { religion: 'Sunni Islam', weight: 40 }, { religion: 'Protestant Christianity', weight: 8 }, { religion: 'Ethiopian Judaism', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Ethiopian Orthodox Christianity', weight: 45 }, { religion: 'Sunni Islam', weight: 35 }, { religion: 'Protestant Christianity', weight: 15 }, { religion: 'Ethiopian Judaism', weight: 3 }, { religion: 'Atheism', weight: 2 } ]
        },
        "East African Rift": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'East African Traditional Religion', weight: 95 }, { religion: 'Ancestral Worship', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'East African Traditional Religion', weight: 85 }, { religion: 'Sunni Islam', weight: 10 }, { religion: 'Ancestral Worship', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'East African Traditional Religion', weight: 70 }, { religion: 'Sunni Islam', weight: 20 }, { religion: 'Christianity', weight: 10 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'East African Traditional Religion', weight: 45 }, { religion: 'Christianity', weight: 35 }, { religion: 'Sunni Islam', weight: 20 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 50 }, { religion: 'East African Traditional Religion', weight: 25 }, { religion: 'Sunni Islam', weight: 20 }, { religion: 'Atheism', weight: 5 } ]
        },
        "Southern Africa": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Southern African Traditional Religion', weight: 95 }, { religion: 'San Shamanism', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Southern African Traditional Religion', weight: 90 }, { religion: 'San Shamanism', weight: 8 }, { religion: 'Ancestral Worship', weight: 2 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Southern African Traditional Religion', weight: 75 }, { religion: 'Christianity', weight: 20 }, { religion: 'San Shamanism', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 60 }, { religion: 'Southern African Traditional Religion', weight: 35 }, { religion: 'Hinduism', weight: 3 }, { religion: 'Islam', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 75 }, { religion: 'Southern African Traditional Religion', weight: 15 }, { religion: 'Atheism', weight: 5 }, { religion: 'Hinduism', weight: 3 }, { religion: 'Islam', weight: 2 } ]
        },
        "Central Africa": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Central African Traditional Religion', weight: 95 }, { religion: 'Ancestral Worship', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Central African Traditional Religion', weight: 90 }, { religion: 'Ancestral Worship', weight: 10 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Central African Traditional Religion', weight: 75 }, { religion: 'Christianity', weight: 20 }, { religion: 'Sunni Islam', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 55 }, { religion: 'Central African Traditional Religion', weight: 30 }, { religion: 'Sunni Islam', weight: 15 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 70 }, { religion: 'Central African Traditional Religion', weight: 15 }, { religion: 'Sunni Islam', weight: 12 }, { religion: 'Atheism', weight: 3 } ]
        },
        "West African Forests": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Yoruba Traditional Religion', weight: 50 }, { religion: 'Igbo Traditional Religion', weight: 40 }, { religion: 'Ancestral Worship', weight: 10 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Yoruba Traditional Religion', weight: 45 }, { religion: 'Igbo Traditional Religion', weight: 35 }, { religion: 'Sunni Islam', weight: 15 }, { religion: 'Ancestral Worship', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Yoruba Traditional Religion', weight: 35 }, { religion: 'Igbo Traditional Religion', weight: 30 }, { religion: 'Sunni Islam', weight: 20 }, { religion: 'Christianity', weight: 15 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 45 }, { religion: 'Yoruba Traditional Religion', weight: 25 }, { religion: 'Sunni Islam', weight: 20 }, { religion: 'Igbo Traditional Religion', weight: 10 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 60 }, { religion: 'Sunni Islam', weight: 25 }, { religion: 'Yoruba Traditional Religion', weight: 10 }, { religion: 'Atheism', weight: 3 }, { religion: 'Igbo Traditional Religion', weight: 2 } ]
        },
        "Madagascar and Islands": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Malagasy Traditional Religion', weight: 95 }, { religion: 'Ancestral Worship', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Malagasy Traditional Religion', weight: 85 }, { religion: 'Sunni Islam', weight: 10 }, { religion: 'Ancestral Worship', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Malagasy Traditional Religion', weight: 70 }, { religion: 'Christianity', weight: 20 }, { religion: 'Sunni Islam', weight: 10 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 55 }, { religion: 'Malagasy Traditional Religion', weight: 35 }, { religion: 'Sunni Islam', weight: 10 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 70 }, { religion: 'Malagasy Traditional Religion', weight: 20 }, { religion: 'Sunni Islam', weight: 8 }, { religion: 'Atheism', weight: 2 } ]
        },
    },
    'SOUTH_ASIAN': {
        "Indus Valley": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Indus Valley Religion', weight: 60 }, { religion: 'Early Hinduism', weight: 30 }, { religion: 'Buddhism', weight: 10 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Hinduism', weight: 55 }, { religion: 'Sunni Islam', weight: 35 }, { religion: 'Buddhism', weight: 8 }, { religion: 'Sikhism', weight: 2 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Sunni Islam', weight: 65 }, { religion: 'Hinduism', weight: 25 }, { religion: 'Sikhism', weight: 8 }, { religion: 'Buddhism', weight: 2 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Sunni Islam', weight: 70 }, { religion: 'Hinduism', weight: 20 }, { religion: 'Sikhism', weight: 8 }, { religion: 'Christianity', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Sunni Islam', weight: 85 }, { religion: 'Hinduism', weight: 8 }, { religion: 'Christianity', weight: 4 }, { religion: 'Sikhism', weight: 2 }, { religion: 'Atheism', weight: 1 } ]
        },
        "Gangetic Plain": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Early Hinduism', weight: 70 }, { religion: 'Buddhism', weight: 25 }, { religion: 'Jainism', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Hinduism', weight: 65 }, { religion: 'Sunni Islam', weight: 25 }, { religion: 'Buddhism', weight: 8 }, { religion: 'Jainism', weight: 2 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Hinduism', weight: 60 }, { religion: 'Sunni Islam', weight: 35 }, { religion: 'Sikhism', weight: 3 }, { religion: 'Buddhism', weight: 2 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Hinduism', weight: 70 }, { religion: 'Sunni Islam', weight: 25 }, { religion: 'Christianity', weight: 3 }, { religion: 'Sikhism', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Hinduism', weight: 75 }, { religion: 'Sunni Islam', weight: 15 }, { religion: 'Christianity', weight: 5 }, { religion: 'Sikhism', weight: 3 }, { religion: 'Atheism', weight: 2 } ]
        },
        "Deccan Plateau": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Early Hinduism', weight: 80 }, { religion: 'Buddhism', weight: 15 }, { religion: 'Jainism', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Hinduism', weight: 70 }, { religion: 'Sunni Islam', weight: 20 }, { religion: 'Jainism', weight: 8 }, { religion: 'Buddhism', weight: 2 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Hinduism', weight: 65 }, { religion: 'Sunni Islam', weight: 30 }, { religion: 'Jainism', weight: 4 }, { religion: 'Christianity', weight: 1 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Hinduism', weight: 75 }, { religion: 'Sunni Islam', weight: 18 }, { religion: 'Christianity', weight: 5 }, { religion: 'Jainism', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Hinduism', weight: 80 }, { religion: 'Sunni Islam', weight: 12 }, { religion: 'Christianity', weight: 6 }, { religion: 'Atheism', weight: 2 } ]
        },
        "Himalayas and Northeast": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Tibetan Buddhism', weight: 60 }, { religion: 'Bon Religion', weight: 25 }, { religion: 'Hinduism', weight: 15 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Tibetan Buddhism', weight: 70 }, { religion: 'Hinduism', weight: 20 }, { religion: 'Bon Religion', weight: 8 }, { religion: 'Animism', weight: 2 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Tibetan Buddhism', weight: 75 }, { religion: 'Hinduism', weight: 20 }, { religion: 'Animism', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Tibetan Buddhism', weight: 65 }, { religion: 'Hinduism', weight: 25 }, { religion: 'Christianity', weight: 8 }, { religion: 'Animism', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Tibetan Buddhism', weight: 60 }, { religion: 'Hinduism', weight: 25 }, { religion: 'Christianity', weight: 10 }, { religion: 'Atheism', weight: 3 }, { religion: 'Animism', weight: 2 } ]
        },
        "Central India": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Early Hinduism', weight: 75 }, { religion: 'Buddhism', weight: 20 }, { religion: 'Jainism', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Hinduism', weight: 80 }, { religion: 'Sunni Islam', weight: 15 }, { religion: 'Jainism', weight: 4 }, { religion: 'Buddhism', weight: 1 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Hinduism', weight: 75 }, { religion: 'Sunni Islam', weight: 20 }, { religion: 'Jainism', weight: 4 }, { religion: 'Christianity', weight: 1 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Hinduism', weight: 82 }, { religion: 'Sunni Islam', weight: 12 }, { religion: 'Christianity', weight: 4 }, { religion: 'Jainism', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Hinduism', weight: 85 }, { religion: 'Sunni Islam', weight: 8 }, { religion: 'Christianity', weight: 5 }, { religion: 'Atheism', weight: 2 } ]
        },
        "Sri Lanka": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Theravada Buddhism', weight: 70 }, { religion: 'Hinduism', weight: 25 }, { religion: 'Local Spirits Worship', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Theravada Buddhism', weight: 65 }, { religion: 'Hinduism', weight: 30 }, { religion: 'Sunni Islam', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Theravada Buddhism', weight: 60 }, { religion: 'Hinduism', weight: 25 }, { religion: 'Christianity', weight: 10 }, { religion: 'Sunni Islam', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Theravada Buddhism', weight: 65 }, { religion: 'Hinduism', weight: 20 }, { religion: 'Christianity', weight: 10 }, { religion: 'Sunni Islam', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Theravada Buddhism', weight: 70 }, { religion: 'Hinduism', weight: 15 }, { religion: 'Sunni Islam', weight: 8 }, { religion: 'Christianity', weight: 6 }, { religion: 'Atheism', weight: 1 } ]
        },
        "Mainland Southeast Asia": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Theravada Buddhism', weight: 45 }, { religion: 'Hinduism', weight: 30 }, { religion: 'Animism', weight: 20 }, { religion: 'Local Spirits Worship', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Theravada Buddhism', weight: 55 }, { religion: 'Hinduism', weight: 25 }, { religion: 'Animism', weight: 15 }, { religion: 'Sunni Islam', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Theravada Buddhism', weight: 60 }, { religion: 'Hinduism', weight: 20 }, { religion: 'Sunni Islam', weight: 10 }, { religion: 'Christianity', weight: 5 }, { religion: 'Animism', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Theravada Buddhism', weight: 65 }, { religion: 'Christianity', weight: 15 }, { religion: 'Hinduism', weight: 10 }, { religion: 'Sunni Islam', weight: 8 }, { religion: 'Animism', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Theravada Buddhism', weight: 70 }, { religion: 'Christianity', weight: 12 }, { religion: 'Sunni Islam', weight: 10 }, { religion: 'Hinduism', weight: 5 }, { religion: 'Atheism', weight: 3 } ]
        },
        "Maritime Southeast Asia": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Hinduism', weight: 50 }, { religion: 'Buddhism', weight: 30 }, { religion: 'Animism', weight: 20 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Hinduism', weight: 40 }, { religion: 'Buddhism', weight: 25 }, { religion: 'Sunni Islam', weight: 30 }, { religion: 'Animism', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Sunni Islam', weight: 60 }, { religion: 'Hinduism', weight: 20 }, { religion: 'Buddhism', weight: 15 }, { religion: 'Christianity', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Sunni Islam', weight: 70 }, { religion: 'Christianity', weight: 15 }, { religion: 'Hinduism', weight: 10 }, { religion: 'Buddhism', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Sunni Islam', weight: 75 }, { religion: 'Christianity', weight: 12 }, { religion: 'Hinduism', weight: 8 }, { religion: 'Buddhism', weight: 4 }, { religion: 'Atheism', weight: 1 } ]
        },
        "Philippines and Taiwan Strait": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Animism', weight: 70 }, { religion: 'Ancestral Worship', weight: 25 }, { religion: 'Local Spirits Worship', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Animism', weight: 60 }, { religion: 'Sunni Islam', weight: 25 }, { religion: 'Ancestral Worship', weight: 15 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Christianity', weight: 60 }, { religion: 'Sunni Islam', weight: 25 }, { religion: 'Animism', weight: 15 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 85 }, { religion: 'Sunni Islam', weight: 10 }, { religion: 'Animism', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 88 }, { religion: 'Sunni Islam', weight: 8 }, { religion: 'Atheism', weight: 2 }, { religion: 'Buddhism', weight: 1 }, { religion: 'Animism', weight: 1 } ]
        },
    },
    'EAST_ASIAN': {
        "Siberia": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Siberian Shamanism', weight: 80 }, { religion: 'Tengrism', weight: 15 }, { religion: 'Animism', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Siberian Shamanism', weight: 70 }, { religion: 'Tengrism', weight: 20 }, { religion: 'Eastern Orthodox Christianity', weight: 10 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Siberian Shamanism', weight: 50 }, { religion: 'Eastern Orthodox Christianity', weight: 35 }, { religion: 'Tengrism', weight: 15 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Eastern Orthodox Christianity', weight: 60 }, { religion: 'Siberian Shamanism', weight: 30 }, { religion: 'Atheism', weight: 10 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Atheism', weight: 50 }, { religion: 'Eastern Orthodox Christianity', weight: 30 }, { religion: 'Siberian Shamanism', weight: 15 }, { religion: 'Buddhism', weight: 5 } ]
        },
       "Kazakh Steppes": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Tengrism', weight: 70 }, { religion: 'Shamanism', weight: 25 }, { religion: 'Zoroastrianism', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Tengrism', weight: 50 }, { religion: 'Sunni Islam', weight: 40 }, { religion: 'Shamanism', weight: 10 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Sunni Islam', weight: 70 }, { religion: 'Tengrism', weight: 25 }, { religion: 'Shamanism', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Sunni Islam', weight: 75 }, { religion: 'Eastern Orthodox Christianity', weight: 15 }, { religion: 'Tengrism', weight: 10 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Sunni Islam', weight: 65 }, { religion: 'Atheism', weight: 20 }, { religion: 'Eastern Orthodox Christianity', weight: 10 }, { religion: 'Tengrism', weight: 5 } ]
        },
        "Central Asian Oases": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Zoroastrianism', weight: 45 }, { religion: 'Buddhism', weight: 30 }, { religion: 'Tengrism', weight: 20 }, { religion: 'Manichaeism', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Sunni Islam', weight: 60 }, { religion: 'Buddhism', weight: 20 }, { religion: 'Zoroastrianism', weight: 15 }, { religion: 'Tengrism', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Sunni Islam', weight: 85 }, { religion: 'Buddhism', weight: 10 }, { religion: 'Zoroastrianism', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Sunni Islam', weight: 88 }, { religion: 'Eastern Orthodox Christianity', weight: 8 }, { religion: 'Buddhism', weight: 4 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Sunni Islam', weight: 80 }, { religion: 'Atheism', weight: 12 }, { religion: 'Eastern Orthodox Christianity', weight: 6 }, { religion: 'Buddhism', weight: 2 } ]
        },
        "Xinjiang": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Buddhism', weight: 50 }, { religion: 'Zoroastrianism', weight: 25 }, { religion: 'Tengrism', weight: 20 }, { religion: 'Manichaeism', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Buddhism', weight: 40 }, { religion: 'Sunni Islam', weight: 35 }, { religion: 'Tengrism', weight: 20 }, { religion: 'Zoroastrianism', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Sunni Islam', weight: 70 }, { religion: 'Buddhism', weight: 25 }, { religion: 'Tengrism', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Sunni Islam', weight: 80 }, { religion: 'Buddhism', weight: 15 }, { religion: 'Atheism', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Sunni Islam', weight: 75 }, { religion: 'Atheism', weight: 15 }, { religion: 'Buddhism', weight: 8 }, { religion: 'Christianity', weight: 2 } ]
        },
        "Mongolia and Manchuria": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Tengrism', weight: 70 }, { religion: 'Shamanism', weight: 25 }, { religion: 'Buddhism', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Tengrism', weight: 50 }, { religion: 'Tibetan Buddhism', weight: 40 }, { religion: 'Shamanism', weight: 10 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Tibetan Buddhism', weight: 70 }, { religion: 'Tengrism', weight: 25 }, { religion: 'Shamanism', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Tibetan Buddhism', weight: 65 }, { religion: 'Tengrism', weight: 20 }, { religion: 'Atheism', weight: 10 }, { religion: 'Christianity', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Atheism', weight: 45 }, { religion: 'Tibetan Buddhism', weight: 40 }, { religion: 'Tengrism', weight: 10 }, { religion: 'Christianity', weight: 5 } ]
        },
        "North China Plain": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Chinese Traditional Religion', weight: 60 }, { religion: 'Confucianism', weight: 25 }, { religion: 'Taoism', weight: 15 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Chinese Traditional Religion', weight: 50 }, { religion: 'Buddhism', weight: 30 }, { religion: 'Confucianism', weight: 15 }, { religion: 'Taoism', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Chinese Traditional Religion', weight: 45 }, { religion: 'Neo-Confucianism', weight: 35 }, { religion: 'Buddhism', weight: 15 }, { religion: 'Taoism', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Chinese Traditional Religion', weight: 50 }, { religion: 'Neo-Confucianism', weight: 30 }, { religion: 'Buddhism', weight: 15 }, { religion: 'Christianity', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Atheism', weight: 60 }, { religion: 'Chinese Traditional Religion', weight: 25 }, { religion: 'Buddhism', weight: 10 }, { religion: 'Christianity', weight: 5 } ]
        },
        "South China": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Chinese Traditional Religion', weight: 65 }, { religion: 'Taoism', weight: 20 }, { religion: 'Confucianism', weight: 15 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Chinese Traditional Religion', weight: 55 }, { religion: 'Buddhism', weight: 25 }, { religion: 'Confucianism', weight: 15 }, { religion: 'Taoism', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Chinese Traditional Religion', weight: 50 }, { religion: 'Neo-Confucianism', weight: 30 }, { religion: 'Buddhism', weight: 15 }, { religion: 'Christianity', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Chinese Traditional Religion', weight: 55 }, { religion: 'Neo-Confucianism', weight: 25 }, { religion: 'Buddhism', weight: 15 }, { religion: 'Christianity', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Atheism', weight: 55 }, { religion: 'Chinese Traditional Religion', weight: 30 }, { religion: 'Buddhism', weight: 10 }, { religion: 'Christianity', weight: 5 } ]
        },
        "West China and Tibet": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Bon Religion', weight: 60 }, { religion: 'Buddhism', weight: 30 }, { religion: 'Shamanism', weight: 10 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Tibetan Buddhism', weight: 70 }, { religion: 'Bon Religion', weight: 25 }, { religion: 'Shamanism', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Tibetan Buddhism', weight: 85 }, { religion: 'Bon Religion', weight: 12 }, { religion: 'Shamanism', weight: 3 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Tibetan Buddhism', weight: 88 }, { religion: 'Bon Religion', weight: 10 }, { religion: 'Chinese Traditional Religion', weight: 2 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Tibetan Buddhism', weight: 80 }, { religion: 'Atheism', weight: 15 }, { religion: 'Bon Religion', weight: 3 }, { religion: 'Chinese Traditional Religion', weight: 2 } ]
        },
        "Japan": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Shinto', weight: 80 }, { religion: 'Shamanism', weight: 15 }, { religion: 'Ancestor Worship', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Shinto', weight: 50 }, { religion: 'Buddhism', weight: 45 }, { religion: 'Confucianism', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Buddhism', weight: 50 }, { religion: 'Shinto', weight: 40 }, { religion: 'Confucianism', weight: 8 }, { religion: 'Christianity', weight: 2 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Shinto', weight: 60 }, { religion: 'Buddhism', weight: 35 }, { religion: 'Christianity', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Atheism', weight: 55 }, { religion: 'Shinto', weight: 25 }, { religion: 'Buddhism', weight: 18 }, { religion: 'Christianity', weight: 2 } ]
        },
        "Korea": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Korean Shamanism', weight: 60 }, { religion: 'Ancestor Worship', weight: 30 }, { religion: 'Confucianism', weight: 10 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Buddhism', weight: 50 }, { religion: 'Korean Shamanism', weight: 30 }, { religion: 'Confucianism', weight: 20 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Neo-Confucianism', weight: 70 }, { religion: 'Buddhism', weight: 20 }, { religion: 'Korean Shamanism', weight: 10 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Neo-Confucianism', weight: 60 }, { religion: 'Buddhism', weight: 25 }, { religion: 'Christianity', weight: 10 }, { religion: 'Korean Shamanism', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 35 }, { religion: 'Atheism', weight: 30 }, { religion: 'Buddhism', weight: 20 }, { religion: 'Confucianism', weight: 15 } ]
        },
        "Taiwan and Ryukyu": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Austronesian Traditional Religion', weight: 80 }, { religion: 'Animism', weight: 15 }, { religion: 'Ancestor Worship', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Austronesian Traditional Religion', weight: 70 }, { religion: 'Chinese Traditional Religion', weight: 20 }, { religion: 'Buddhism', weight: 10 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Chinese Traditional Religion', weight: 50 }, { religion: 'Buddhism', weight: 30 }, { religion: 'Austronesian Traditional Religion', weight: 15 }, { religion: 'Christianity', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Chinese Traditional Religion', weight: 45 }, { religion: 'Buddhism', weight: 30 }, { religion: 'Christianity', weight: 20 }, { religion: 'Austronesian Traditional Religion', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Chinese Traditional Religion', weight: 40 }, { religion: 'Buddhism', weight: 25 }, { religion: 'Christianity', weight: 20 }, { religion: 'Atheism', weight: 12 }, { religion: 'Austronesian Traditional Religion', weight: 3 } ]
        },
    },
    'OCEANIA': {
        "Australia – Southeast": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Aboriginal Dreamtime', weight: 100 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Aboriginal Dreamtime', weight: 100 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Aboriginal Dreamtime', weight: 95 }, { religion: 'Christianity', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 80 }, { religion: 'Aboriginal Dreamtime', weight: 15 }, { religion: 'Atheism', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 60 }, { religion: 'Atheism', weight: 30 }, { religion: 'Buddhism', weight: 5 }, { religion: 'Aboriginal Dreamtime', weight: 3 }, { religion: 'Islam', weight: 2 } ]
        },
        "Australia – Outback and Center": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Aboriginal Dreamtime', weight: 100 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Aboriginal Dreamtime', weight: 100 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Aboriginal Dreamtime', weight: 100 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Aboriginal Dreamtime', weight: 70 }, { religion: 'Christianity', weight: 30 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 50 }, { religion: 'Aboriginal Dreamtime', weight: 35 }, { religion: 'Atheism', weight: 15 } ]
        },
        "Australia – North and Queensland": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Aboriginal Dreamtime', weight: 100 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Aboriginal Dreamtime', weight: 100 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Aboriginal Dreamtime', weight: 95 }, { religion: 'Christianity', weight: 5 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 70 }, { religion: 'Aboriginal Dreamtime', weight: 25 }, { religion: 'Atheism', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 55 }, { religion: 'Atheism', weight: 25 }, { religion: 'Aboriginal Dreamtime', weight: 15 }, { religion: 'Buddhism', weight: 3 }, { religion: 'Islam', weight: 2 } ]
        },
        "Australia – West and Desert": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Aboriginal Dreamtime', weight: 100 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Aboriginal Dreamtime', weight: 100 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Aboriginal Dreamtime', weight: 98 }, { religion: 'Christianity', weight: 2 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 75 }, { religion: 'Aboriginal Dreamtime', weight: 20 }, { religion: 'Atheism', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 65 }, { religion: 'Atheism', weight: 20 }, { religion: 'Aboriginal Dreamtime', weight: 10 }, { religion: 'Buddhism', weight: 3 }, { religion: 'Islam', weight: 2 } ]
        },
        "New Zealand": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Maori Traditional Religion', weight: 100 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Maori Traditional Religion', weight: 100 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Maori Traditional Religion', weight: 85 }, { religion: 'Christianity', weight: 15 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 75 }, { religion: 'Maori Traditional Religion', weight: 20 }, { religion: 'Atheism', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 50 }, { religion: 'Atheism', weight: 35 }, { religion: 'Maori Traditional Religion', weight: 10 }, { religion: 'Hinduism', weight: 3 }, { religion: 'Buddhism', weight: 2 } ]
        },
        "New Guinea and Melanesia": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Melanesian Traditional Religion', weight: 95 }, { religion: 'Ancestor Worship', weight: 5 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Melanesian Traditional Religion', weight: 95 }, { religion: 'Ancestor Worship', weight: 5 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Melanesian Traditional Religion', weight: 90 }, { religion: 'Christianity', weight: 8 }, { religion: 'Ancestor Worship', weight: 2 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 60 }, { religion: 'Melanesian Traditional Religion', weight: 35 }, { religion: 'Cargo Cults', weight: 5 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 80 }, { religion: 'Melanesian Traditional Religion', weight: 15 }, { religion: 'Cargo Cults', weight: 3 }, { religion: 'Atheism', weight: 2 } ]
        },
        "Polynesia": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Polynesian Traditional Religion', weight: 100 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Polynesian Traditional Religion', weight: 100 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Polynesian Traditional Religion', weight: 85 }, { religion: 'Christianity', weight: 15 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 85 }, { religion: 'Polynesian Traditional Religion', weight: 15 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 80 }, { religion: 'Atheism', weight: 10 }, { religion: 'Polynesian Traditional Religion', weight: 8 }, { religion: 'Mormonism', weight: 2 } ]
        },
        "Micronesia": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Micronesian Traditional Religion', weight: 100 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Micronesian Traditional Religion', weight: 100 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Micronesian Traditional Religion', weight: 80 }, { religion: 'Christianity', weight: 20 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 75 }, { religion: 'Micronesian Traditional Religion', weight: 25 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 85 }, { religion: 'Micronesian Traditional Religion', weight: 10 }, { religion: 'Atheism', weight: 5 } ]
        },
        "Hawaii and Central Pacific": {
            [HistoricalEra.ANTIQUITY]: [ { religion: 'Hawaiian Traditional Religion', weight: 100 } ],
            [HistoricalEra.MEDIEVAL]: [ { religion: 'Hawaiian Traditional Religion', weight: 100 } ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [ { religion: 'Hawaiian Traditional Religion', weight: 70 }, { religion: 'Christianity', weight: 30 } ],
            [HistoricalEra.INDUSTRIAL_ERA]: [ { religion: 'Christianity', weight: 70 }, { religion: 'Hawaiian Traditional Religion', weight: 20 }, { religion: 'Buddhism', weight: 10 } ],
            [HistoricalEra.MODERN_ERA]: [ { religion: 'Christianity', weight: 60 }, { religion: 'Atheism', weight: 20 }, { religion: 'Buddhism', weight: 15 }, { religion: 'Hawaiian Traditional Religion', weight: 3 }, { religion: 'Hinduism', weight: 2 } ]
        },
    }
};

export function determineReligion(
    culturalZone: CulturalZone,
    region: string,
    era: HistoricalEra,
    noise: ValueNoise
): string {
    let eraData = RELIGION_DATA[culturalZone]?.[region]?.[era];

    if (!eraData || eraData.length === 0) {
        // Fallback to a broader era definition if specific one not found
        const fallbackEra = era.includes('s') ? HistoricalEra.MODERN_ERA : era > HistoricalEra.RENAISSANCE_EARLY_MODERN ? HistoricalEra.INDUSTRIAL_ERA : HistoricalEra.MEDIEVAL;
        eraData = RELIGION_DATA[culturalZone]?.[region]?.[fallbackEra];
    }
    
    if (!eraData || eraData.length === 0) {
        // Fallback to a major region within the cultural zone if specific one not found
        const fallbackRegionKey = Object.keys(GEOGRAPHICAL_DATA[culturalZone] || {})[0] || 'British Isles';
        eraData = RELIGION_DATA[culturalZone]?.[fallbackRegionKey]?.[era];
    }
    
    if (!eraData || eraData.length === 0) {
        return 'Local Beliefs';
    }
    
    const totalPrevalence = eraData.reduce((sum, religion) => sum + religion.weight, 0);
    if(totalPrevalence === 0) return 'Animist';

    let roll = noise.random() * totalPrevalence;

    for (const entry of eraData) {
        roll -= entry.weight;
        if (roll <= 0) {
            return entry.religion;
        }
    }

    return eraData[eraData.length - 1]?.religion || 'Local Beliefs'; // Final fallback
}