/**
 * constants/characterData/religionClergyRoles.ts
 * Maps religions to their appropriate clergy/religious leader roles
 * Used for generating NPCs at holy sites
 */

export const RELIGION_CLERGY_ROLES: Record<string, string[]> = {
  // Christian denominations
  'Christianity': ['Priest', 'Deacon', 'Monk', 'Nun', 'Acolyte', 'Lay Brother'],
  'Roman Catholicism': ['Priest', 'Bishop', 'Deacon', 'Monk', 'Nun', 'Friar', 'Abbot', 'Acolyte'],
  'Eastern Orthodoxy': ['Priest', 'Deacon', 'Monk', 'Nun', 'Archimandrite', 'Hieromonk', 'Reader'],
  'Byzantine Christianity': ['Priest', 'Deacon', 'Monk', 'Nun', 'Archimandrite', 'Hegumen'],
  'Protestantism': ['Pastor', 'Minister', 'Deacon', 'Elder', 'Preacher', 'Lay Reader'],
  'Puritanism': ['Minister', 'Elder', 'Deacon', 'Lay Preacher'],
  'Celtic Christianity': ['Abbot', 'Monk', 'Hermit', 'Scribe', 'Acolyte'],
  'Early Christianity': ['Bishop', 'Presbyter', 'Deacon', 'Catechumen', 'Reader'],
  'Mozarabic Christianity': ['Priest', 'Deacon', 'Monk', 'Cantor'],
  'Syncretic Christianity': ['Priest', 'Shaman-Priest', 'Healer', 'Acolyte'],
  'Pentecostalism': ['Pastor', 'Evangelist', 'Deacon', 'Prophet', 'Healer'],
  'Catharism': ['Perfecti', 'Credentes', 'Bishop', 'Deacon'],
  
  // Islamic denominations
  'Islam': ['Imam', 'Muezzin', 'Qari', 'Hafiz', 'Islamic Scholar'],
  'Sunni Islam': ['Imam', 'Sheikh', 'Muezzin', 'Qari', 'Mufti', 'Islamic Scholar'],
  'Shia Islam': ['Ayatollah', 'Imam', 'Mullah', 'Mujtahid', 'Seminary Student'],
  'Sufism': ['Sufi Master', 'Dervish', 'Murshid', 'Murid', 'Qawwal'],
  
  // Judaism
  'Judaism': ['Rabbi', 'Cantor', 'Scribe', 'Scholar', 'Shamash', 'Mohel'],
  'Conversos': ['Secret Rabbi', 'Crypto-Jewish Elder', 'Hidden Scholar'],
  
  // Eastern religions
  'Buddhism': ['Monk', 'Nun', 'Abbot', 'Novice', 'Lay Practitioner'],
  'Theravada Buddhism': ['Bhikkhu', 'Bhikkhuni', 'Samanera', 'Upasaka', 'Meditation Teacher'],
  'Mahayana Buddhism': ['Bodhisattva', 'Zen Master', 'Monk', 'Nun', 'Lay Teacher'],
  'Tibetan Buddhism': ['Lama', 'Rinpoche', 'Monk', 'Nun', 'Geshe', 'Khenpo'],
  'Zen Buddhism': ['Roshi', 'Sensei', 'Monk', 'Nun', 'Tenzo'],
  
  'Hinduism': ['Brahmin Priest', 'Pujari', 'Sadhu', 'Guru', 'Temple Keeper', 'Pandit'],
  'Early Hinduism': ['Vedic Priest', 'Rishi', 'Brahmin', 'Ascetic', 'Temple Guardian'],
  'Vedic Religion': ['Hotri', 'Adhvaryu', 'Udgatar', 'Brahmin', 'Rishi'],
  
  'Jainism': ['Jain Monk', 'Jain Nun', 'Acharya', 'Upadhyaya', 'Muni'],
  'Sikhism': ['Granthi', 'Giani', 'Ragi', 'Sevadar', 'Pathis'],
  
  'Confucianism': ['Scholar', 'Master', 'Teacher', 'Ritual Specialist', 'Temple Keeper'],
  'Taoism': ['Taoist Priest', 'Daoshi', 'Fashi', 'Temple Guardian', 'Hermit'],
  'Shinto': ['Kannushi', 'Miko', 'Guji', 'Negi', 'Hafuri'],
  
  // Ancient polytheistic religions
  'Greek Polytheism': ['Oracle', 'Priest of Apollo', 'Priestess of Athena', 'Hierophant', 'Mystagogue', 'Temple Guardian'],
  'Roman Polytheism': ['Pontifex', 'Augur', 'Haruspex', 'Vestal Virgin', 'Flamen', 'Temple Priest'],
  'Egyptian Polytheism': ['High Priest of Ra', 'Priestess of Isis', 'Sem Priest', 'Lector Priest', 'Temple Scribe'],
  'Mesopotamian Religion': ['Ensi', 'Baru', 'Temple Priest', 'Priestess of Ishtar', 'Dream Interpreter'],
  'Norse Paganism': ['Godi', 'Gydja', 'Seidr Practitioner', 'Skald', 'Volva'],
  'Germanic Paganism': ['Priest', 'Priestess', 'Seer', 'Sacred Grove Keeper', 'Rune Master'],
  'Celtic Druidism': ['Archdruid', 'Druid', 'Ovate', 'Bard', 'Grove Keeper'],
  'Slavic Paganism': ['Volkhv', 'Zhrets', 'Vedun', 'Temple Keeper', 'Oracle'],
  'Thracian Religion': ['Orphic Priest', 'Dionysian Priest', 'Oracle', 'Mystery Keeper'],
  
  // Indigenous American religions
  'Aztec Polytheism': ['Tlatoani-Priest', 'Priest of Quetzalcoatl', 'Priestess of Xochiquetzal', 'Temple Guard', 'Sacrificial Priest'],
  'Maya Polytheism': ['Ah Kin', 'Chilam', 'Nacom', 'Vision Serpent Priestess', 'Daykeeper'],
  'Inca Religion': ['Willaq Umu', 'Priest of Inti', 'Mamacona', 'Oracle of Pachacamac', 'Apu Priest'],
  'Pueblo Religion': ['Cacique', 'Kiva Priest', 'Medicine Man', 'Kachina Priest', 'Corn Mother'],
  'Kachina Worship': ['Kachina Priest', 'Kiva Elder', 'Medicine Man', 'Ceremonial Dancer'],
  'Iroquois Longhouse Religion': ['Faithkeeper', 'Clan Mother', 'Longhouse Speaker', 'Medicine Person'],
  'Algonquian Shamanism': ['Shaman', 'Medicine Man', 'Vision Seeker', 'Drum Keeper'],
  'Great Spirit Worship': ['Medicine Man', 'Holy Man', 'Vision Keeper', 'Pipe Bearer'],
  'Sun Dance Religion': ['Sun Dance Chief', 'Medicine Man', 'Sacred Bundle Keeper', 'Vision Seeker'],
  'Buffalo Shamanism': ['Buffalo Shaman', 'Medicine Woman', 'Sacred Hunter', 'Dream Keeper'],
  'Mississippian Religion': ['Sun Priest', 'Mound Keeper', 'Falcon Priest', 'Shell Keeper'],
  'Cahokia Solar Worship': ['Solar Priest', 'Woodhenge Keeper', 'Mound Builder', 'Sky Watcher'],
  'Creek Ceremonialism': ['Micco', 'Medicine Man', 'Fire Keeper', 'Green Corn Priest'],
  'Cherokee Shamanism': ['Didanawisgi', 'Medicine Man', 'Crystal Gazer', 'Plant Healer'],
  'Inuit Shamanism': ['Angakkuq', 'Shaman', 'Spirit Medium', 'Drum Dancer'],
  'Pacific Coast Shamanism': ['Shaman', 'Spirit Dancer', 'Whale Priest', 'Cedar Man'],
  'Totemism': ['Totem Keeper', 'Clan Elder', 'Spirit Carver', 'Story Keeper'],
  'Potlatch Religion': ['Potlatch Chief', 'Gift Master', 'Ceremonial Speaker', 'Wealth Keeper'],
  'Vision Quest Traditions': ['Vision Guide', 'Spirit Teacher', 'Sacred Keeper', 'Dream Walker'],
  'Mountain Spirit Worship': ['Mountain Priest', 'Spirit Walker', 'Stone Keeper', 'Sky Watcher'],
  'Guardian Spirit Religion': ['Spirit Guardian', 'Soul Guide', 'Protector', 'Sacred Keeper'],
  'Forest Spirit Worship': ['Forest Shaman', 'Tree Speaker', 'Green Man', 'Grove Keeper'],
  'Coastal Algonquian Religion': ['Tide Keeper', 'Shell Priest', 'Water Shaman', 'Fish Caller'],
  'Atlantic Shamanism': ['Ocean Shaman', 'Storm Caller', 'Wave Reader', 'Salt Keeper'],
  'Tidewater Spiritualism': ['Water Spirit Medium', 'Marsh Priest', 'River Keeper'],
  
  // African religions
  'Yoruba Religion': ['Babalawo', 'Iyalosha', 'Babalosha', 'Omo Orisha', 'Drummer'],
  'Vodun': ['Houngan', 'Mambo', 'Hounsi', 'La Place', 'Drummer'],
  'Ethiopian Orthodoxy': ['Abuna', 'Priest', 'Deacon', 'Monk', 'Hermit', 'Cantor'],
  'Coptic Christianity': ['Pope', 'Bishop', 'Priest', 'Deacon', 'Monk'],
  'West African Islam': ['Imam', 'Marabout', 'Muezzin', 'Quranic Teacher', 'Sufi Sheikh'],
  'Bantu Traditional Religion': ['Nganga', 'Diviner', 'Rainmaker', 'Ancestor Priest', 'Sacred King'],
  'Khoisan Shamanism': ['Shaman', 'Trance Dancer', 'Healer', 'Rock Art Keeper'],
  'Malagasy Traditional Religion': ['Ombiasy', 'Mpimasy', 'Ancestor Priest', 'Sacred King'],
  'Swahili Syncretism': ['Sheikh', 'Traditional Healer', 'Spirit Medium', 'Mosque Keeper'],
  
  // Southeast Asian religions
  'Khmer Hinduism': ['Brahmin', 'Temple Priest', 'Apsara Instructor', 'Sacred Dancer'],
  'Javanese Hinduism': ['Pedanda', 'Pemangku', 'Temple Guardian', 'Sacred Dancer'],
  'Balinese Hinduism': ['High Priest', 'Temple Priest', 'Water Priest', 'Mask Keeper'],
  'Filipino Animism': ['Babaylan', 'Catalonan', 'Spirit Medium', 'Healer'],
  'Vietnamese Folk Religion': ['Spirit Medium', 'Temple Keeper', 'Fortune Teller', 'Ancestor Priest'],
  
  // Oceanic religions
  'Polynesian Religion': ['Kahuna', 'Ali\'i Priest', 'Navigator Priest', 'Tiki Keeper'],
  'Hawaiian Religion': ['Kahuna Pule', 'Kahuna Nui', 'Heiau Priest', 'Hula Master'],
  'Maori Religion': ['Tohunga', 'Ariki', 'Matakite', 'Kaumatua'],
  'Aboriginal Australian Spirituality': ['Cleverman', 'Songkeeper', 'Dreamtime Elder', 'Sacred Site Guardian'],
  'Melanesian Religion': ['Big Man', 'Sorcerer', 'Mask Keeper', 'Cargo Priest'],
  
  // Central Asian religions
  'Tengriism': ['Kam', 'Shaman', 'Sky Priest', 'Eagle Master', 'Drum Keeper'],
  'Mongolian Shamanism': ['Böö', 'Zairan', 'Sky Father Priest', 'Ovoo Keeper'],
  'Turkic Shamanism': ['Kam', 'Bakshy', 'Ata', 'Fire Keeper'],
  
  // Ancient Near Eastern
  'Zoroastrianism': ['Mobed', 'Dastur', 'Herbad', 'Fire Priest', 'Ervad'],
  'Manichaeism': ['Elect', 'Hearer', 'Teacher', 'Scribe'],
  'Mithraism': ['Pater', 'Heliodromus', 'Miles', 'Leo', 'Corax'],
  
  // Syncretic and modern
  'Baha\'i Faith': ['Hand of the Cause', 'Counselor', 'Auxiliary Board Member', 'Pioneer'],
  'Cao Dai': ['Pope', 'Cardinal', 'Archbishop', 'Priest', 'Student Priest'],
  'Rastafarianism': ['Elder', 'Priest', 'Nyabinghi Drummer', 'Reasoner'],
  
  // Generic fallbacks
  'Animism': ['Shaman', 'Spirit Keeper', 'Medicine Person', 'Sacred Guardian'],
  'Shamanism': ['Shaman', 'Spirit Walker', 'Healer', 'Drum Keeper'],
  'Local Spirits Worship': ['Spirit Priest', 'Guardian', 'Offering Keeper', 'Sacred Watcher'],
  'Ancestral Worship': ['Ancestor Priest', 'Spirit Medium', 'Family Elder', 'Tomb Guardian'],
  'Atheism': ['Philosopher', 'Scholar', 'Teacher', 'Keeper'],
  'Indus Valley Religion': ['Seal Keeper', 'Bath Priest', 'Bull Priest', 'Mother Goddess Priestess'],
  'Green Corn Ceremony': ['Green Corn Chief', 'Fire Keeper', 'Medicine Maker', 'Ceremonial Leader'],
  'Arctic Animism': ['Ice Shaman', 'Seal Priest', 'Aurora Watcher', 'Spirit Caller'],
  'Olmec Jaguar Worship': ['Jaguar Priest', 'Were-Jaguar Shaman', 'Jade Keeper', 'Blood Letter'],
  'Teotihuacan Religion': ['Pyramid Priest', 'Feathered Serpent Priest', 'Obsidian Master', 'Mural Keeper'],
  'Plateau Shamanism': ['Plateau Shaman', 'Vision Guide', 'Salmon Priest', 'Mountain Walker'],
  'Mound Builder Shamanism': ['Mound Keeper', 'Effigy Priest', 'Copper Worker', 'Shell Gorget Keeper'],
  'Southeastern Shamanism': ['Medicine Maker', 'Black Drink Brewer', 'Shell Keeper', 'Fire Tender'],
  
  // Default fallback
  'DEFAULT': ['Priest', 'Acolyte', 'Temple Guardian', 'Sacred Keeper', 'Shrine Attendant']
};

/**
 * Get clergy roles for a specific religion
 * @param religion The religion name
 * @returns Array of appropriate clergy roles
 */
export function getClergyRoles(religion: string): string[] {
  // First try exact match
  if (RELIGION_CLERGY_ROLES[religion]) {
    return RELIGION_CLERGY_ROLES[religion];
  }
  
  // Try to find partial matches
  const religionLower = religion.toLowerCase();
  for (const [key, roles] of Object.entries(RELIGION_CLERGY_ROLES)) {
    if (key.toLowerCase().includes(religionLower) || religionLower.includes(key.toLowerCase())) {
      return roles;
    }
  }
  
  // Check for broad categories
  if (religionLower.includes('christian')) return RELIGION_CLERGY_ROLES['Christianity'];
  if (religionLower.includes('islam') || religionLower.includes('muslim')) return RELIGION_CLERGY_ROLES['Islam'];
  if (religionLower.includes('buddhis')) return RELIGION_CLERGY_ROLES['Buddhism'];
  if (religionLower.includes('hindu')) return RELIGION_CLERGY_ROLES['Hinduism'];
  if (religionLower.includes('shaman')) return RELIGION_CLERGY_ROLES['Shamanism'];
  if (religionLower.includes('pagan')) return RELIGION_CLERGY_ROLES['Animism'];
  
  // Default fallback
  return RELIGION_CLERGY_ROLES['DEFAULT'];
}