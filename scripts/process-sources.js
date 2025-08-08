#!/usr/bin/env node

/**
 * Process Primary Sources
 * Extracts text from PDFs and prepares metadata for database insertion
 */

const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');

// Source metadata mapping
const sourceMetadata = {
  // Ancient Egypt
  'bookofdeadpapyru00budgrich': {
    title: 'The Book of the Dead (Papyrus of Ani)',
    author: 'Unknown',
    era: 'ancient',
    culture_zone: 'ancient_egypt',
    document_type: 'religious',
    original_date: 'c. 1250 BCE',
    regions: ['Egypt', 'Thebes', 'Nile Valley'],
    keywords: ['afterlife', 'Osiris', 'mummy', 'spells', 'judgment', 'Ani', 'papyrus'],
    topics: ['death rituals', 'mythology', 'magic', 'immortality'],
    people: ['Osiris', 'Isis', 'Anubis', 'Thoth', 'Ra', 'Ani'],
    places: ['Thebes', 'Memphis', 'Nile', 'Duat'],
    difficulty_level: 3
  },
  'taleofshipwrecke00good': {
    title: 'The Tale of the Shipwrecked Sailor',
    author: 'Unknown',
    era: 'ancient',
    culture_zone: 'ancient_egypt',
    document_type: 'literary',
    original_date: 'c. 2000-1700 BCE',
    regions: ['Egypt', 'Red Sea', 'Nubia'],
    keywords: ['shipwreck', 'sailor', 'serpent', 'island', 'adventure'],
    topics: ['literature', 'adventure', 'mythology'],
    people: ['The Sailor', 'The Serpent'],
    places: ['Red Sea', 'Island of the Serpent'],
    difficulty_level: 2
  },
  'maximsofptahhotep00ptu': {
    title: 'The Maxims of Ptahhotep',
    author: 'Ptahhotep',
    era: 'ancient',
    culture_zone: 'ancient_egypt',
    document_type: 'philosophical',
    original_date: 'c. 2375-2350 BCE',
    regions: ['Egypt', 'Memphis'],
    keywords: ['wisdom', 'ethics', 'vizier', 'governance', 'maxims'],
    topics: ['philosophy', 'ethics', 'governance', 'education'],
    people: ['Ptahhotep', 'Pharaoh Djedkare'],
    places: ['Memphis'],
    difficulty_level: 3
  },
  
  // Ancient Greece
  'historiesofhero01hero': {
    title: 'The Histories',
    author: 'Herodotus',
    era: 'classical',
    culture_zone: 'ancient_greece',
    document_type: 'historical',
    original_date: 'c. 440 BCE',
    regions: ['Greece', 'Persia', 'Egypt', 'Scythia'],
    keywords: ['Persian Wars', 'Marathon', 'Thermopylae', 'Xerxes', 'ethnography'],
    topics: ['history', 'warfare', 'culture', 'geography'],
    people: ['Xerxes', 'Leonidas', 'Darius', 'Themistocles', 'Croesus'],
    places: ['Athens', 'Sparta', 'Persepolis', 'Marathon', 'Thermopylae'],
    difficulty_level: 3
  },
  'historyofpelopon00thucuoft': {
    title: 'History of the Peloponnesian War',
    author: 'Thucydides',
    era: 'classical',
    culture_zone: 'ancient_greece',
    document_type: 'historical',
    original_date: 'c. 431 BCE',
    regions: ['Greece', 'Athens', 'Sparta', 'Sicily'],
    keywords: ['Athens', 'Sparta', 'Pericles', 'plague', 'democracy', 'war'],
    topics: ['warfare', 'politics', 'democracy', 'strategy'],
    people: ['Pericles', 'Alcibiades', 'Nicias', 'Cleon', 'Brasidas'],
    places: ['Athens', 'Sparta', 'Syracuse', 'Pylos', 'Amphipolis'],
    difficulty_level: 4
  },
  'hesiodworkscall00hesi': {
    title: 'Works and Days',
    author: 'Hesiod',
    era: 'ancient',
    culture_zone: 'ancient_greece',
    document_type: 'literary',
    original_date: 'c. 700 BCE',
    regions: ['Greece', 'Boeotia'],
    keywords: ['agriculture', 'seasons', 'justice', 'Pandora', 'mythology'],
    topics: ['farming', 'ethics', 'mythology', 'calendar'],
    people: ['Zeus', 'Prometheus', 'Pandora'],
    places: ['Boeotia', 'Mount Helicon'],
    difficulty_level: 2
  },
  
  // Ancient Rome
  'caesarsgallicwa00caes': {
    title: 'Commentaries on the Gallic War',
    author: 'Julius Caesar',
    era: 'classical',
    culture_zone: 'ancient_rome',
    document_type: 'military',
    original_date: '58-50 BCE',
    regions: ['Gaul', 'Germania', 'Britannia', 'Rome'],
    keywords: ['Caesar', 'Gaul', 'Vercingetorix', 'legion', 'conquest'],
    topics: ['military strategy', 'conquest', 'politics', 'ethnography'],
    people: ['Julius Caesar', 'Vercingetorix', 'Ambiorix', 'Ariovistus'],
    places: ['Alesia', 'Rhine', 'Britannia', 'Helvetii'],
    difficulty_level: 3
  },
  'historiesofcorn01taci': {
    title: 'The Histories',
    author: 'Tacitus',
    era: 'classical',
    culture_zone: 'ancient_rome',
    document_type: 'historical',
    original_date: 'c. 100-110 CE',
    regions: ['Rome', 'Germania', 'Judaea'],
    keywords: ['Year of Four Emperors', 'Vespasian', 'civil war', 'empire'],
    topics: ['imperial history', 'civil war', 'politics', 'military'],
    people: ['Vespasian', 'Vitellius', 'Otho', 'Galba', 'Titus'],
    places: ['Rome', 'Jerusalem', 'Germania', 'Batavia'],
    difficulty_level: 4
  },
  'marcusporciuscato00cato': {
    title: 'De Agri Cultura',
    author: 'Cato the Elder',
    era: 'classical',
    culture_zone: 'ancient_rome',
    document_type: 'agricultural',
    original_date: 'c. 160 BCE',
    regions: ['Rome', 'Italy'],
    keywords: ['farming', 'slaves', 'wine', 'olives', 'estate management'],
    topics: ['agriculture', 'economics', 'slavery', 'rural life'],
    people: ['Cato the Elder'],
    places: ['Rome', 'Campania', 'Sabinum'],
    difficulty_level: 2
  },
  
  // Ancient China
  'artofwarsuntzu00sunt': {
    title: 'The Art of War',
    author: 'Sun Tzu',
    era: 'ancient',
    culture_zone: 'ancient_china',
    document_type: 'military',
    original_date: 'c. 5th century BCE',
    regions: ['China', 'Wu State'],
    keywords: ['strategy', 'tactics', 'deception', 'warfare', 'leadership'],
    topics: ['military strategy', 'philosophy', 'leadership'],
    people: ['Sun Tzu', 'King Helü of Wu'],
    places: ['Wu', 'Chu'],
    difficulty_level: 2
  },
  'analectsconfuciu00conf': {
    title: 'The Analects',
    author: 'Confucius',
    era: 'classical',
    culture_zone: 'ancient_china',
    document_type: 'philosophical',
    original_date: 'c. 475-221 BCE',
    regions: ['China', 'Lu State'],
    keywords: ['Confucius', 'ren', 'li', 'virtue', 'filial piety', 'junzi'],
    topics: ['ethics', 'governance', 'education', 'social harmony'],
    people: ['Confucius', 'Mencius', 'Yan Hui'],
    places: ['Lu', 'Qufu'],
    difficulty_level: 3
  },
  
  // Medieval sources
  'anglosaxonchroni00gile': {
    title: 'The Anglo-Saxon Chronicle',
    author: 'Various scribes',
    era: 'medieval',
    culture_zone: 'european',
    document_type: 'historical',
    original_date: '9th-12th centuries',
    regions: ['England', 'Britain', 'Wessex'],
    keywords: ['Alfred', 'Vikings', 'Normans', '1066', 'chronicle'],
    topics: ['English history', 'Viking invasions', 'Norman Conquest'],
    people: ['Alfred the Great', 'William the Conqueror', 'Harold Godwinson'],
    places: ['Winchester', 'London', 'York', 'Hastings'],
    difficulty_level: 3
  },
  'travelsofmarcopo00polouoft': {
    title: 'The Travels of Marco Polo',
    author: 'Marco Polo',
    era: 'medieval',
    culture_zone: 'global',
    document_type: 'exploratory',
    original_date: 'c. 1300',
    regions: ['Venice', 'China', 'Central Asia', 'India'],
    keywords: ['Silk Road', 'Kublai Khan', 'Venice', 'trade', 'exploration'],
    topics: ['exploration', 'trade', 'cultural exchange', 'geography'],
    people: ['Marco Polo', 'Kublai Khan', 'Rustichello'],
    places: ['Venice', 'Khanbaliq', 'Silk Road', 'Cathay'],
    difficulty_level: 2
  },
  
  // Add more metadata as needed...
};

async function extractTextFromPDF(pdfPath) {
  try {
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdf(dataBuffer);
    return {
      text: data.text,
      pageCount: data.numpages,
      info: data.info
    };
  } catch (error) {
    console.error(`Error extracting text from ${pdfPath}:`, error.message);
    return null;
  }
}

async function processSource(identifier) {
  const pdfPath = path.join(__dirname, '..', 'primary-sources-data', 'pdfs', `${identifier}.pdf`);
  const textPath = path.join(__dirname, '..', 'primary-sources-data', 'text', `${identifier}.txt`);
  const jsonPath = path.join(__dirname, '..', 'primary-sources-data', 'text', `${identifier}.json`);
  
  // Check if PDF exists
  try {
    await fs.access(pdfPath);
  } catch {
    console.log(`  ⚠️  PDF not found: ${identifier}`);
    return null;
  }
  
  console.log(`📄 Processing: ${identifier}`);
  
  // Extract text
  const pdfData = await extractTextFromPDF(pdfPath);
  if (!pdfData) {
    console.log(`  ❌ Failed to extract text`);
    return null;
  }
  
  // Save raw text
  await fs.writeFile(textPath, pdfData.text);
  console.log(`  ✓ Text extracted (${pdfData.pageCount} pages)`);
  
  // Get metadata
  const metadata = sourceMetadata[identifier] || {
    title: identifier,
    era: 'ancient',
    culture_zone: 'global',
    document_type: 'historical',
    regions: ['Unknown'],
    keywords: [],
    difficulty_level: 3
  };
  
  // Calculate reading time (avg 250 words per minute)
  const wordCount = pdfData.text.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 250);
  
  // Create full source object
  const source = {
    identifier,
    ...metadata,
    text_content: pdfData.text.substring(0, 50000), // First 50k chars for now
    page_count: pdfData.pageCount,
    word_count: wordCount,
    reading_time_minutes: readingTime,
    archive_identifier: identifier,
    archive_url: `https://archive.org/details/${identifier}`,
    description: `${metadata.title} - A ${metadata.document_type} document from ${metadata.original_date || 'ancient times'}.`,
    processed_at: new Date().toISOString()
  };
  
  // Save as JSON
  await fs.writeFile(jsonPath, JSON.stringify(source, null, 2));
  console.log(`  ✓ Metadata saved`);
  
  return source;
}

async function main() {
  console.log('🔄 Processing downloaded PDFs...\n');
  
  // Get all PDFs
  const pdfDir = path.join(__dirname, '..', 'primary-sources-data', 'pdfs');
  let files;
  
  try {
    files = await fs.readdir(pdfDir);
  } catch (error) {
    console.error('❌ PDF directory not found. Run download-sources.sh first!');
    process.exit(1);
  }
  
  const pdfFiles = files.filter(f => f.endsWith('.pdf'));
  console.log(`Found ${pdfFiles.length} PDFs to process\n`);
  
  const results = [];
  
  for (const file of pdfFiles) {
    const identifier = file.replace('.pdf', '');
    const source = await processSource(identifier);
    if (source) {
      results.push(source);
    }
    console.log('');
  }
  
  // Save combined manifest
  const manifestPath = path.join(__dirname, '..', 'primary-sources-data', 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(results, null, 2));
  
  console.log('═══════════════════════════════════════');
  console.log(`✅ Processing complete!`);
  console.log(`📊 Processed ${results.length} sources`);
  console.log(`📁 Manifest saved to: primary-sources-data/manifest.json`);
}

main().catch(console.error);