/**
 * Holy Site Symbol Selection Logic - Comprehensive religion-based mapping
 * Maps religions to appropriate modular symbol components
 */

import { 
  ZigguratSymbol,
  CathedralSymbol,
  StandingStoneSymbol,
  PyramidSymbol,
  GenericChurchSymbol,
  GenericMosqueSymbol,
  BaroqueChurchSymbol,
  OttomanMosqueSymbol,
  PagodaSymbol,
  MesoamericanPyramidSymbol,
  ShrineSymbol,
  BuddhistTempleSymbol,
  HinduTempleSymbol,
  ShintoShrineSymbol,
  SynagogueSymbol,
  RomanTempleSymbol,
  GreekTempleSymbol,
  SacredGroveSymbol,
  SacredFireSymbol,
  StupaSymbol,
  TotemPoleSymbol,
  AnimistShrineSymbol
} from './index';

export const getHolySiteSymbol = (religion: string, culture?: string, holyPlaceType?: string) => {
  const rel = religion?.toLowerCase() || '';
  const cult = culture?.toUpperCase() || '';
  const placeType = holyPlaceType?.toLowerCase() || '';

  // === SPECIFIC HOLY PLACE TYPES (check first) ===
  if (placeType.includes('spirit house')) {
    return ShrineSymbol; // Thai/Southeast Asian spirit houses
  }
  if (placeType.includes('sacred grove') || placeType.includes('grove')) {
    return SacredGroveSymbol;
  }
  if (placeType.includes('burial mound') || placeType.includes('mound') || placeType.includes('temple mound')) {
    return StandingStoneSymbol;
  }
  if (placeType.includes('stone circle') || placeType.includes('circle') || placeType.includes('standing stones')) {
    return StandingStoneSymbol;
  }

  // Native American specific sites
  if (placeType.includes('kiva') || placeType.includes('great kiva') || placeType.includes('pueblo kiva')) {
    return AnimistShrineSymbol; // Underground ceremonial chambers
  }
  if (placeType.includes('medicine wheel')) {
    return StandingStoneSymbol; // Sacred stone circles
  }
  if (placeType.includes('sun dance') || placeType.includes('dance ground') || placeType.includes('dance circle')) {
    return SacredFireSymbol; // Ceremony grounds with sacred fire
  }
  if (placeType.includes('totem field') || placeType.includes('totem')) {
    return TotemPoleSymbol;
  }
  if (placeType.includes('sweat house') || placeType.includes('ceremonial lodge')) {
    return AnimistShrineSymbol;
  }

  // Polynesian/Oceanic sites
  if (placeType.includes('marae') || placeType.includes('heiau')) {
    return StandingStoneSymbol; // Stone ceremonial platforms
  }
  if (placeType.includes('moai')) {
    return TotemPoleSymbol; // Easter Island statues
  }

  // Asian Buddhist sites
  if (placeType.includes('wat') || placeType.includes('vihara') || placeType.includes('monastery')) {
    return BuddhistTempleSymbol;
  }
  if (placeType.includes('stupa') || placeType.includes('dagoba') || placeType.includes('pagoda')) {
    return StupaSymbol;
  }

  // European megalithic sites
  if (placeType.includes('dolmen') || placeType.includes('megalith')) {
    return StandingStoneSymbol;
  }
  if (placeType.includes('rune stone') || placeType.includes('stone ship')) {
    return StandingStoneSymbol;
  }

  // Islamic sites
  if (placeType.includes('madrasa') || placeType.includes('masjid') || placeType.includes('juma masjid')) {
    return GenericMosqueSymbol;
  }

  // Specific religious buildings
  if (placeType.includes('gurdwara')) {
    return PagodaSymbol; // Sikh temples - distinctive domed architecture
  }
  if (placeType.includes('synagogue')) {
    return SynagogueSymbol;
  }

  // === CHRISTIANITY ===
  // Catholic
  if (rel.includes('roman catholic') || rel.includes('catholic') || rel.includes('papist')) {
    if (cult.includes('EUROPEAN') && rel.includes('baroque')) {
      return BaroqueChurchSymbol;
    }
    return CathedralSymbol;
  }
  
  // Orthodox
  if (rel.includes('orthodox') || rel.includes('byzantine')) {
    return CathedralSymbol;
  }
  
  // Protestant
  if (rel.includes('protestant') || rel.includes('lutheran') || rel.includes('calvin') || 
      rel.includes('puritan') || rel.includes('anglican') || rel.includes('methodist') ||
      rel.includes('baptist') || rel.includes('presbyterian') || rel.includes('pentecostal')) {
    return GenericChurchSymbol;
  }
  
  // Other Christian
  if (rel.includes('coptic') || rel.includes('ethiopian orthodox')) {
    return CathedralSymbol;
  }
  
  if (rel.includes('early christian') || rel.includes('christian') || rel.includes('church') || 
      rel.includes('christ') || rel.includes('cathar') || rel.includes('mozarabic')) {
    return GenericChurchSymbol;
  }
  
  // === ISLAM ===
  if (rel.includes('sunni') || rel.includes('shia') || rel.includes('sufi') ||
      rel.includes('islam') || rel.includes('muslim') || rel.includes('allah') || 
      rel.includes('muhammad') || rel.includes('mosque')) {
    if (cult.includes('MENA') || cult.includes('OTTOMAN') || cult.includes('TURKISH')) {
      return OttomanMosqueSymbol;
    }
    return GenericMosqueSymbol;
  }
  
  // === JUDAISM ===
  if (rel.includes('jewish') || rel.includes('judaism') || rel.includes('hebrew') || 
      rel.includes('synagogue') || rel.includes('torah') || rel.includes('conversos')) {
    return SynagogueSymbol;
  }
  
  // === BUDDHISM ===
  if (rel.includes('theravada buddhism') || rel.includes('tibetan buddhism') || rel.includes('buddhism') ||
      rel.includes('zen') || rel.includes('buddhist') || rel.includes('buddha') ||
      rel.includes('dharma') || rel.includes('sangha')) {
    // Use stupa for South Asian and specific Buddhist contexts
    if (rel.includes('stupa') || rel.includes('dagoba') || rel.includes('chaitya') ||
        rel.includes('vihara') || cult.includes('SOUTH_ASIAN')) {
      return StupaSymbol;
    }
    // Use pagoda for East Asian Buddhism
    if (cult.includes('EAST_ASIAN')) {
      return PagodaSymbol;
    }
    return BuddhistTempleSymbol;
  }
  
  // === HINDUISM ===
  if (rel.includes('hindu') || rel.includes('brahma') || rel.includes('vishnu') || 
      rel.includes('shiva') || rel.includes('krishna') || rel.includes('vedic') ||
      rel.includes('kovil') || rel.includes('devalaya')) {
    return HinduTempleSymbol;
  }
  
  // === OTHER DHARMIC RELIGIONS ===
  if (rel.includes('jain') || rel.includes('jainism')) {
    return HinduTempleSymbol; // Similar architecture
  }

  if (rel.includes('sikh') || rel.includes('sikhism') || rel.includes('gurdwara')) {
    return PagodaSymbol; // Gurdwara - distinctive domed architecture, better than generic church
  }
  
  // === EAST ASIAN RELIGIONS ===
  if (rel.includes('shinto') || rel.includes('kami')) {
    return ShintoShrineSymbol;
  }
  
  if (rel.includes('confucian') || rel.includes('taoist') || rel.includes('dao')) {
    return PagodaSymbol;
  }
  
  // === ANCIENT POLYTHEISM ===
  // Roman
  if (rel.includes('roman polytheism') || rel.includes('roman pagan') || 
      rel.includes('jupiter') || rel.includes('mars') || rel.includes('minerva') ||
      rel.includes('vesta') || rel.includes('roman gods')) {
    return RomanTempleSymbol;
  }
  
  // Greek
  if (rel.includes('greek polytheism') || rel.includes('greek') || rel.includes('hellenic') || 
      rel.includes('zeus') || rel.includes('apollo') || rel.includes('athena') || 
      rel.includes('olymp') || rel.includes('poseidon') || rel.includes('hera')) {
    return GreekTempleSymbol;
  }
  
  // Egyptian
  if (rel.includes('egyptian') || rel.includes('ra') || rel.includes('osiris') || 
      rel.includes('isis') || rel.includes('pharaoh')) {
    return PyramidSymbol;
  }
  
  // Mesopotamian
  if (rel.includes('mesopotamian') || rel.includes('sumerian') || rel.includes('babylon') || 
      rel.includes('assyrian') || rel.includes('marduk') || rel.includes('ishtar')) {
    return ZigguratSymbol;
  }
  
  // Norse/Germanic
  if (rel.includes('norse') || rel.includes('odin') || rel.includes('thor') || 
      rel.includes('viking') || rel.includes('valhalla') || rel.includes('yggdrasil') ||
      rel.includes('asgard') || rel.includes('germanic pagan')) {
    // Vikings used sacred groves and standing stones
    if (rel.includes('grove') || rel.includes('yggdrasil') || rel.includes('tree')) {
      return SacredGroveSymbol;
    }
    return StandingStoneSymbol;
  }
  
  // Celtic
  if (rel.includes('celtic') || rel.includes('druid') || rel.includes('pagan') || 
      rel.includes('wicca') || rel.includes('nature worship')) {
    if (rel.includes('druid') || rel.includes('grove') || rel.includes('tree') || 
        rel.includes('forest') || rel.includes('nature')) {
      return SacredGroveSymbol;
    }
    return StandingStoneSymbol;
  }
  
  // Slavic
  if (rel.includes('slavic pagan')) {
    return SacredGroveSymbol;
  }
  
  // === MESOAMERICAN ===
  if (rel.includes('aztec') || rel.includes('maya') || rel.includes('inca') || 
      rel.includes('quetzalcoatl') || rel.includes('mesoamerican') || 
      rel.includes('teotihuacan') || rel.includes('olmec')) {
    return MesoamericanPyramidSymbol;
  }
  
  // === NATIVE AMERICAN ===
  // Totem religions
  if (rel.includes('totem') || rel.includes('pacific coast shaman') || 
      rel.includes('potlatch')) {
    return TotemPoleSymbol;
  }
  
  // Fire-centered religions
  if (rel.includes('sun dance') || rel.includes('great spirit') || 
      rel.includes('fire keeper') || rel.includes('sacred fire')) {
    return SacredFireSymbol;
  }
  
  // Pueblo/Southwest
  if (rel.includes('pueblo') || rel.includes('kachina') || rel.includes('kiva')) {
    return AnimistShrineSymbol;
  }
  
  // Mound builders
  if (rel.includes('mississippian') || rel.includes('cahokia') || rel.includes('mound builder')) {
    return PyramidSymbol; // Earthen pyramids
  }
  
  // Generic Native American shamanism
  if (rel.includes('iroquois') || rel.includes('algonquian') || rel.includes('cherokee') ||
      rel.includes('creek') || rel.includes('buffalo shaman') || rel.includes('vision quest') ||
      rel.includes('mountain spirit') || rel.includes('forest spirit') || rel.includes('guardian spirit')) {
    return AnimistShrineSymbol;
  }
  
  // Arctic
  if (rel.includes('inuit') || rel.includes('arctic')) {
    return StandingStoneSymbol; // Inukshuk
  }
  
  // === AFRICAN RELIGIONS ===
  if (rel.includes('yoruba traditional religion') || rel.includes('african traditional religion') ||
      rel.includes('west african traditional religion') || rel.includes('central african traditional religion') ||
      rel.includes('east african traditional religion') || rel.includes('southern african traditional religion') ||
      rel.includes('igbo traditional religion') || rel.includes('malagasy traditional religion') ||
      rel.includes('berber traditional religion') || rel.includes('ethiopian traditional religion')) {
    return AnimistShrineSymbol;
  }
  
  // === ZOROASTRIANISM ===
  if (rel.includes('zoroastrianism') || rel.includes('persian zoroastrianism') || rel.includes('ahura mazda') ||
      rel.includes('fire temple') || rel.includes('fire worship')) {
    return SacredFireSymbol;
  }

  // === OTHER RELIGIONS ===
  if (rel.includes('jainism')) {
    return HinduTempleSymbol; // Similar architecture
  }

  if (rel.includes('tengrism') || rel.includes('mongolian')) {
    return AnimistShrineSymbol; // Central Asian shamanic traditions
  }

  if (rel.includes('manichaeism')) {
    return SacredFireSymbol; // Dualistic fire-based religion
  }
  
  // === PACIFIC/OCEANIC ===
  if (rel.includes('polynesian traditional religion') || rel.includes('hawaiian traditional religion') ||
      rel.includes('maori traditional religion') || rel.includes('melanesian traditional religion') ||
      rel.includes('micronesian traditional religion') || rel.includes('austronesian traditional religion')) {
    return TotemPoleSymbol; // Could be tiki statues or marae structures
  }

  if (rel.includes('aboriginal dreamtime')) {
    return StandingStoneSymbol; // Sacred stones and sites
  }
  
  // === CENTRAL ASIAN ===
  if (rel.includes('tengri') || rel.includes('mongolian shaman') || rel.includes('turkic shaman')) {
    return AnimistShrineSymbol;
  }
  
  // === GENERIC CATEGORIES ===
  if (rel.includes('animis') || rel.includes('shaman') || rel.includes('spirit') ||
      rel.includes('ancestor') || rel.includes('local spirits')) {
    return AnimistShrineSymbol;
  }
  
  // === CULTURAL FALLBACKS ===
  if (cult.includes('EUROPEAN')) {
    return GenericChurchSymbol;
  }
  if (cult.includes('MENA') || cult.includes('MIDDLE_EASTERN')) {
    return GenericMosqueSymbol;
  }
  if (cult.includes('EAST_ASIAN')) {
    return PagodaSymbol;
  }
  if (cult.includes('SOUTH_ASIAN')) {
    // Check the actual name for better selection
    if (rel.includes('stupa') || rel.includes('vihara') || rel.includes('dagoba')) {
      return StupaSymbol;
    }
    return HinduTempleSymbol;
  }
  if (cult.includes('MESOAMERICAN') || cult.includes('SOUTH_AMERICAN')) {
    return MesoamericanPyramidSymbol;
  }
  if (cult.includes('AFRICAN')) {
    return AnimistShrineSymbol;
  }
  if (cult.includes('NORTH_AMERICAN')) {
    return SacredFireSymbol;
  }
  if (cult.includes('OCEANIA')) {
    return TotemPoleSymbol;
  }
  
  // === SPECIFIC HOLY SITE TYPES ===
  if (rel.includes('sacred grove') || rel.includes('holy grove') || rel.includes('sacred forest')) {
    return SacredGroveSymbol;
  }
  if (rel.includes('sacred fire') || rel.includes('holy fire') || rel.includes('eternal flame')) {
    return SacredFireSymbol;
  }
  if (rel.includes('stupa') || rel.includes('dagoba') || rel.includes('pagoda')) {
    return StupaSymbol;
  }
  if (rel.includes('totem')) {
    return TotemPoleSymbol;
  }
  
  // Ultimate fallback
  return StandingStoneSymbol;
};