/**
 * constants/characterData/religionSymbolMapping.ts
 * Maps religions from religions.ts to appropriate holy site symbols
 */

export const RELIGION_SYMBOL_MAPPING: Record<string, string> = {
  // Christian denominations
  'Christianity': 'christian',
  'Roman Catholicism': 'catholic',
  'Eastern Orthodoxy': 'orthodox',
  'Byzantine Christianity': 'orthodox',
  'Protestantism': 'protestant', 
  'Puritanism': 'protestant',
  'Celtic Christianity': 'celtic christian',
  'Early Christianity': 'early christian',
  'Mozarabic Christianity': 'mozarabic',
  'Syncretic Christianity': 'syncretic christian',
  'Pentecostalism': 'pentecostal',
  'Catharism': 'cathar',
  'Ethiopian Orthodoxy': 'orthodox',
  'Coptic Christianity': 'coptic',
  
  // Islamic denominations
  'Islam': 'islam',
  'Sunni Islam': 'sunni islam',
  'Shia Islam': 'shia islam',
  'Sufism': 'sufi',
  'West African Islam': 'west african islam',
  
  // Judaism
  'Judaism': 'jewish',
  'Conversos': 'jewish', // Hidden Jewish practice
  
  // Buddhism
  'Buddhism': 'buddhist',
  'Theravada Buddhism': 'theravada buddhist',
  'Mahayana Buddhism': 'mahayana buddhist',
  'Tibetan Buddhism': 'tibetan buddhist',
  'Zen Buddhism': 'zen buddhist',
  
  // Hinduism  
  'Hinduism': 'hindu',
  'Early Hinduism': 'early hindu',
  'Vedic Religion': 'vedic',
  'Khmer Hinduism': 'khmer hindu',
  'Javanese Hinduism': 'javanese hindu',
  'Balinese Hinduism': 'balinese hindu',
  
  // Other Dharmic religions
  'Jainism': 'jain',
  'Sikhism': 'sikh',
  
  // East Asian religions
  'Confucianism': 'confucian',
  'Taoism': 'taoist', 
  'Shinto': 'shinto',
  
  // Ancient polytheistic religions
  'Greek Polytheism': 'greek polytheism',
  'Roman Polytheism': 'roman polytheism',
  'Egyptian Polytheism': 'egyptian',
  'Mesopotamian Religion': 'mesopotamian',
  'Norse Paganism': 'norse pagan',
  'Germanic Paganism': 'germanic pagan',
  'Celtic Druidism': 'celtic druid',
  'Slavic Paganism': 'slavic pagan',
  'Thracian Religion': 'thracian',
  
  // Mesoamerican religions
  'Aztec Polytheism': 'aztec',
  'Maya Polytheism': 'maya',
  'Inca Religion': 'inca',
  'Teotihuacan Religion': 'teotihuacan',
  'Olmec Jaguar Worship': 'olmec',
  
  // Native American religions
  'Pueblo Religion': 'pueblo',
  'Kachina Worship': 'kachina',
  'Iroquois Longhouse Religion': 'iroquois',
  'Algonquian Shamanism': 'algonquian shaman',
  'Great Spirit Worship': 'great spirit',
  'Sun Dance Religion': 'sun dance',
  'Buffalo Shamanism': 'buffalo shaman',
  'Mississippian Religion': 'mississippian',
  'Cahokia Solar Worship': 'cahokia solar',
  'Creek Ceremonialism': 'creek ceremonial',
  'Cherokee Shamanism': 'cherokee shaman',
  'Inuit Shamanism': 'inuit shaman',
  'Pacific Coast Shamanism': 'pacific coast shaman',
  'Totemism': 'totem',
  'Potlatch Religion': 'potlatch',
  'Vision Quest Traditions': 'vision quest',
  'Mountain Spirit Worship': 'mountain spirit',
  'Guardian Spirit Religion': 'guardian spirit',
  'Forest Spirit Worship': 'forest spirit',
  'Coastal Algonquian Religion': 'coastal algonquian',
  'Atlantic Shamanism': 'atlantic shaman',
  'Tidewater Spiritualism': 'tidewater spirit',
  'Plateau Shamanism': 'plateau shaman',
  'Mound Builder Shamanism': 'mound builder',
  'Southeastern Shamanism': 'southeastern shaman',
  'Green Corn Ceremony': 'green corn',
  'Arctic Animism': 'arctic animism',
  
  // African religions
  'Yoruba Religion': 'yoruba',
  'Vodun': 'vodun',
  'Bantu Traditional Religion': 'bantu traditional',
  'Khoisan Shamanism': 'khoisan shaman',
  'Malagasy Traditional Religion': 'malagasy traditional',
  'Swahili Syncretism': 'swahili syncretic',
  
  // Southeast Asian religions
  'Filipino Animism': 'filipino animist',
  'Vietnamese Folk Religion': 'vietnamese folk',
  
  // Oceanic religions
  'Polynesian Religion': 'polynesian',
  'Hawaiian Religion': 'hawaiian',
  'Maori Religion': 'maori',
  'Aboriginal Australian Spirituality': 'aboriginal australian',
  'Melanesian Religion': 'melanesian',
  
  // Central Asian religions
  'Tengriism': 'tengri',
  'Mongolian Shamanism': 'mongolian shaman',
  'Turkic Shamanism': 'turkic shaman',
  
  // Ancient Near Eastern
  'Zoroastrianism': 'zoroastrian',
  'Manichaeism': 'manichaean',
  'Mithraism': 'mithraic',
  'Indus Valley Religion': 'indus valley',
  
  // Generic categories
  'Animism': 'animist',
  'Shamanism': 'shaman',
  'Local Spirits Worship': 'local spirits',
  'Ancestral Worship': 'ancestor worship',
  'Atheism': 'secular', // No religious building but might have philosophical schools
  
  // Default
  'DEFAULT': 'shrine'
};

/**
 * Get the appropriate symbol type for a religion
 */
export function getReligionSymbolType(religion: string): string {
  return RELIGION_SYMBOL_MAPPING[religion] || RELIGION_SYMBOL_MAPPING['DEFAULT'];
}