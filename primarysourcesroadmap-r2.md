# Primary Sources Educational System - R2 Implementation Roadmap

## Architecture Overview

### Storage Strategy: Cloudflare R2 + Supabase Hybrid
```
Cloudflare R2:
├── /pdfs/               # Original PDF scans
│   └── {source-id}.pdf
├── /images/             # Extracted images
│   └── {source-id}/
│       └── page-{n}.jpg
└── /thumbnails/         # Cover page thumbnails
    └── {source-id}.jpg

Supabase:
├── primary_sources table (metadata + full text)
├── source_keywords table (many-to-many relationships)
├── user_saved_sources table (user collections)
└── source_annotations table (user notes)
```

## Comprehensive Schema Design

### Primary Sources Table
```sql
CREATE TABLE primary_sources (
  -- Core Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT UNIQUE NOT NULL, -- e.g., "magna-carta-1215"
  
  -- Basic Metadata
  title TEXT NOT NULL,
  author TEXT,
  translator TEXT,
  original_date TEXT, -- "1215", "c. 500 BCE", "14th century"
  publication_date DATE, -- When this edition was published
  
  -- Classification
  era era_type NOT NULL, -- ancient, classical, medieval, early_modern, etc.
  culture_zone culture_zone_type NOT NULL, -- european, east_asian, islamic, etc.
  document_type document_type NOT NULL, -- legal, literary, religious, etc.
  language TEXT DEFAULT 'English',
  original_language TEXT,
  
  -- Geographic Context
  regions TEXT[] NOT NULL, -- ["England", "British Isles", "Western Europe"]
  coordinates POINT, -- For map integration
  
  -- Content
  description TEXT NOT NULL, -- 2-3 sentence summary
  text_content TEXT NOT NULL, -- Full plaintext/markdown
  text_format TEXT DEFAULT 'markdown', -- markdown, plaintext, html
  page_count INTEGER,
  word_count INTEGER,
  
  -- Storage URLs
  pdf_url TEXT, -- R2 presigned URL
  thumbnail_url TEXT, -- Cover page image
  images JSONB DEFAULT '[]', -- Array of page images with captions
  
  -- Keywords & Topics
  keywords TEXT[] NOT NULL, -- ["Magna Carta", "King John", "rights", "law"]
  topics TEXT[] DEFAULT '{}', -- ["constitutional law", "medieval politics"]
  people TEXT[] DEFAULT '{}', -- ["King John", "Archbishop Langton"]
  places TEXT[] DEFAULT '{}', -- ["Runnymede", "Windsor", "London"]
  
  -- Educational Metadata
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5), -- 1=easy, 5=expert
  reading_time_minutes INTEGER,
  curriculum_tags TEXT[] DEFAULT '{}', -- ["AP World History", "Medieval Studies"]
  
  -- Source Attribution
  archive_url TEXT, -- Original Internet Archive URL
  archive_identifier TEXT, -- Internet Archive ID
  license TEXT DEFAULT 'public_domain',
  attribution TEXT,
  
  -- System Fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_ps_era ON primary_sources(era);
CREATE INDEX idx_ps_culture ON primary_sources(culture_zone);
CREATE INDEX idx_ps_keywords ON primary_sources USING GIN(keywords);
CREATE INDEX idx_ps_regions ON primary_sources USING GIN(regions);
CREATE INDEX idx_ps_topics ON primary_sources USING GIN(topics);
CREATE INDEX idx_ps_people ON primary_sources USING GIN(people);
CREATE INDEX idx_ps_places ON primary_sources USING GIN(places);
CREATE INDEX idx_ps_fulltext ON primary_sources USING GIN(to_tsvector('english', text_content));
```

### Supporting Tables
```sql
-- Keyword relationships (for weighted keywords)
CREATE TABLE source_keywords (
  source_id UUID REFERENCES primary_sources(id),
  keyword TEXT NOT NULL,
  weight FLOAT DEFAULT 1.0, -- Importance of this keyword
  context TEXT, -- Where/how it appears
  PRIMARY KEY (source_id, keyword)
);

-- User interactions
CREATE TABLE user_saved_sources (
  user_id TEXT NOT NULL,
  source_id UUID REFERENCES primary_sources(id),
  saved_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  PRIMARY KEY (user_id, source_id)
);

-- Type definitions
CREATE TYPE era_type AS ENUM (
  'prehistoric', 'ancient', 'classical', 'medieval', 
  'early_modern', 'industrial', 'modern', 'contemporary'
);

CREATE TYPE culture_zone_type AS ENUM (
  'european', 'near_eastern', 'east_asian', 'south_asian', 
  'southeast_asian', 'african', 'american', 'oceanic', 'islamic', 'global'
);

CREATE TYPE document_type AS ENUM (
  'legal', 'literary', 'religious', 'philosophical', 'historical',
  'scientific', 'economic', 'personal', 'governmental', 'military'
);
```

## Automated Ingestion Workflow

### Step 1: Source Discovery & Collection

**Option A: Manual Collection (You Do This)**
1. Search Internet Archive for sources
2. Create a CSV/JSON manifest:
```json
{
  "sources": [
    {
      "archive_identifier": "magnacarta00engl",
      "archive_url": "https://archive.org/details/magnacarta00engl",
      "title": "Magna Carta",
      "era": "medieval",
      "culture_zone": "european",
      "regions": ["England", "British Isles"],
      "keywords": ["law", "rights", "King John"]
    }
  ]
}
```

**Option B: Semi-Automated (I Help Process)**
You provide a list of search terms, I generate wget commands:
```bash
# Download from Internet Archive
wget "https://archive.org/download/magnacarta00engl/magnacarta00engl.pdf"
```

### Step 2: Automated Processing Pipeline

```typescript
// scripts/ingestPrimarySource.ts
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as pdfParse from 'pdf-parse';
import * as fs from 'fs';

async function processPrimarySource(config: SourceConfig) {
  // 1. Download PDF from Internet Archive
  const pdfPath = await downloadFromArchive(config.archive_identifier);
  
  // 2. Extract text and metadata
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfData = await pdfParse(pdfBuffer);
  
  // 3. Process text content
  const processedText = await processText(pdfData.text, {
    format: 'markdown',
    cleanOCR: true,
    addParagraphs: true
  });
  
  // 4. Extract keywords using NLP
  const extractedKeywords = await extractKeywords(processedText);
  
  // 5. Upload PDF to R2
  const pdfUrl = await uploadToR2(pdfPath, config.id);
  
  // 6. Generate thumbnail
  const thumbnailUrl = await generateThumbnail(pdfPath);
  
  // 7. Insert metadata to Supabase
  const source = {
    ...config,
    text_content: processedText,
    pdf_url: pdfUrl,
    thumbnail_url: thumbnailUrl,
    word_count: processedText.split(' ').length,
    page_count: pdfData.numpages,
    keywords: [...config.keywords, ...extractedKeywords]
  };
  
  await supabase.from('primary_sources').insert(source);
}
```

### Step 3: R2 Configuration

```javascript
// utils/r2Storage.js
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadPDF(file, key) {
  const command = new PutObjectCommand({
    Bucket: "primary-sources",
    Key: `pdfs/${key}.pdf`,
    Body: file,
    ContentType: "application/pdf",
  });
  
  await R2.send(command);
  
  // Generate presigned URL (valid for 7 days)
  const getCommand = new GetObjectCommand({
    Bucket: "primary-sources",
    Key: `pdfs/${key}.pdf`,
  });
  
  return await getSignedUrl(R2, getCommand, { expiresIn: 604800 });
}
```

## Initial 20 Primary Sources Collection

### 1. **Magna Carta (1215)**
```json
{
  "identifier": "magna-carta-1215",
  "title": "Magna Carta",
  "author": "English Barons",
  "original_date": "1215",
  "era": "medieval",
  "culture_zone": "european",
  "document_type": "legal",
  "regions": ["England", "British Isles", "Western Europe"],
  "keywords": ["law", "rights", "King John", "barons", "Runnymede", "liberty"],
  "topics": ["constitutional law", "medieval politics", "feudalism"],
  "people": ["King John", "Archbishop Stephen Langton"],
  "places": ["Runnymede", "Windsor", "London"],
  "difficulty_level": 3,
  "archive_identifier": "magnacarta00engl"
}
```

### 2. **Epic of Gilgamesh (c. 2100 BCE)**
```json
{
  "identifier": "epic-gilgamesh-2100bce",
  "title": "The Epic of Gilgamesh",
  "author": "Unknown (Sumerian/Akkadian)",
  "translator": "Andrew George",
  "original_date": "c. 2100 BCE",
  "era": "ancient",
  "culture_zone": "near_eastern",
  "document_type": "literary",
  "regions": ["Mesopotamia", "Sumer", "Akkad"],
  "keywords": ["Gilgamesh", "Enkidu", "immortality", "flood myth", "Uruk"],
  "topics": ["mythology", "friendship", "mortality", "heroism"],
  "people": ["Gilgamesh", "Enkidu", "Utnapishtim", "Ishtar"],
  "places": ["Uruk", "Cedar Forest", "Euphrates"],
  "difficulty_level": 2,
  "archive_identifier": "epicofgilgamesh00unse"
}
```

### 3. **Analects of Confucius (c. 475 BCE)**
```json
{
  "identifier": "analects-confucius-475bce",
  "title": "The Analects",
  "author": "Confucius (Kong Qiu)",
  "translator": "James Legge",
  "original_date": "c. 475 BCE",
  "era": "classical",
  "culture_zone": "east_asian",
  "document_type": "philosophical",
  "regions": ["China", "Lu State", "East Asia"],
  "keywords": ["Confucius", "ren", "li", "virtue", "filial piety", "junzi"],
  "topics": ["ethics", "governance", "education", "social harmony"],
  "people": ["Confucius", "Mencius", "Yan Hui"],
  "places": ["Lu", "Qufu", "Yellow River"],
  "difficulty_level": 3,
  "archive_identifier": "analectsconfuciu00conf"
}
```

### 4. **Code of Hammurabi (c. 1750 BCE)**
```json
{
  "identifier": "code-hammurabi-1750bce",
  "title": "The Code of Hammurabi",
  "author": "Hammurabi, King of Babylon",
  "translator": "L. W. King",
  "original_date": "c. 1750 BCE",
  "era": "ancient",
  "culture_zone": "near_eastern",
  "document_type": "legal",
  "regions": ["Babylon", "Mesopotamia", "Near East"],
  "keywords": ["law", "justice", "eye for eye", "Hammurabi", "stele"],
  "topics": ["legal code", "social hierarchy", "punishment", "commerce"],
  "people": ["Hammurabi", "Shamash"],
  "places": ["Babylon", "Euphrates", "Tigris"],
  "difficulty_level": 2,
  "archive_identifier": "codeofhammurabi00hamm"
}
```

### 5. **Tale of Genji (c. 1010 CE)**
```json
{
  "identifier": "tale-genji-1010",
  "title": "The Tale of Genji",
  "author": "Murasaki Shikibu",
  "translator": "Arthur Waley",
  "original_date": "c. 1010",
  "era": "medieval",
  "culture_zone": "east_asian",
  "document_type": "literary",
  "regions": ["Japan", "Heian-kyō", "East Asia"],
  "keywords": ["Genji", "Heian", "court life", "romance", "poetry"],
  "topics": ["court culture", "Buddhism", "aesthetics", "love"],
  "people": ["Prince Genji", "Murasaki", "Emperor Kiritsubo"],
  "places": ["Heian-kyō", "Kyoto", "Imperial Palace"],
  "difficulty_level": 4,
  "archive_identifier": "taleofgenji00mura"
}
```

### 6. **Florentine Codex (1569)**
```json
{
  "identifier": "florentine-codex-1569",
  "title": "Historia General de las Cosas de Nueva España",
  "author": "Bernardino de Sahagún",
  "original_date": "1569",
  "era": "early_modern",
  "culture_zone": "american",
  "document_type": "historical",
  "regions": ["Mexico", "Mesoamerica", "New Spain"],
  "keywords": ["Aztec", "Nahuatl", "conquest", "Tenochtitlan", "codex"],
  "topics": ["Aztec culture", "colonialism", "religion", "daily life"],
  "people": ["Moctezuma", "Cortés", "Sahagún"],
  "places": ["Tenochtitlan", "Tlatelolco", "Lake Texcoco"],
  "difficulty_level": 3,
  "archive_identifier": "florentinecodex00saha"
}
```

### 7. **Book of the Dead (c. 1550 BCE)**
```json
{
  "identifier": "book-dead-1550bce",
  "title": "The Egyptian Book of the Dead",
  "author": "Various scribes",
  "translator": "E. A. Wallis Budge",
  "original_date": "c. 1550 BCE",
  "era": "ancient",
  "culture_zone": "african",
  "document_type": "religious",
  "regions": ["Egypt", "Nile Valley", "North Africa"],
  "keywords": ["afterlife", "Osiris", "mummy", "spells", "judgment"],
  "topics": ["death rituals", "mythology", "magic", "immortality"],
  "people": ["Osiris", "Isis", "Anubis", "Thoth", "Ra"],
  "places": ["Thebes", "Memphis", "Nile", "Duat"],
  "difficulty_level": 3,
  "archive_identifier": "bookofdeadegypti00budg"
}
```

### 8. **Plato's Republic (c. 380 BCE)**
```json
{
  "identifier": "plato-republic-380bce",
  "title": "The Republic",
  "author": "Plato",
  "translator": "Benjamin Jowett",
  "original_date": "c. 380 BCE",
  "era": "classical",
  "culture_zone": "european",
  "document_type": "philosophical",
  "regions": ["Athens", "Greece", "Mediterranean"],
  "keywords": ["justice", "philosopher king", "cave allegory", "forms"],
  "topics": ["political philosophy", "ethics", "education", "ideal state"],
  "people": ["Socrates", "Plato", "Glaucon", "Thrasymachus"],
  "places": ["Athens", "Piraeus", "Academy"],
  "difficulty_level": 4,
  "archive_identifier": "republicplato00plat"
}
```

### 9. **Popol Vuh (c. 1550)**
```json
{
  "identifier": "popol-vuh-1550",
  "title": "Popol Vuh: The Sacred Book of the Maya",
  "author": "K'iche' Maya scribes",
  "translator": "Dennis Tedlock",
  "original_date": "c. 1550",
  "era": "early_modern",
  "culture_zone": "american",
  "document_type": "religious",
  "regions": ["Guatemala", "Maya Highlands", "Mesoamerica"],
  "keywords": ["Maya", "creation myth", "Hero Twins", "Xibalba", "maize"],
  "topics": ["cosmology", "mythology", "origin stories", "ballgame"],
  "people": ["Hunahpu", "Xbalanque", "Seven Macaw", "Kukulkan"],
  "places": ["Xibalba", "Guatemala", "Quiché"],
  "difficulty_level": 3,
  "archive_identifier": "popolvuh00maya"
}
```

### 10. **Ibn Battuta's Rihla (1355)**
```json
{
  "identifier": "ibn-battuta-rihla-1355",
  "title": "The Travels of Ibn Battuta",
  "author": "Ibn Battuta",
  "translator": "H.A.R. Gibb",
  "original_date": "1355",
  "era": "medieval",
  "culture_zone": "islamic",
  "document_type": "historical",
  "regions": ["Morocco", "Middle East", "India", "China"],
  "keywords": ["travel", "pilgrimage", "Mecca", "Delhi Sultanate", "trade"],
  "topics": ["geography", "culture", "Islam", "exploration"],
  "people": ["Ibn Battuta", "Muhammad bin Tughluq"],
  "places": ["Tangier", "Mecca", "Delhi", "Damascus", "Cairo"],
  "difficulty_level": 2,
  "archive_identifier": "travelsofbattuta00batt"
}
```

### 11. **Bhagavad Gita (c. 400 BCE)**
```json
{
  "identifier": "bhagavad-gita-400bce",
  "title": "The Bhagavad Gita",
  "author": "Vyasa (traditional)",
  "translator": "Eknath Easwaran",
  "original_date": "c. 400 BCE",
  "era": "classical",
  "culture_zone": "south_asian",
  "document_type": "religious",
  "regions": ["India", "Kurukshetra", "South Asia"],
  "keywords": ["dharma", "karma", "yoga", "Arjuna", "Krishna", "duty"],
  "topics": ["Hindu philosophy", "ethics", "devotion", "action"],
  "people": ["Krishna", "Arjuna", "Vyasa"],
  "places": ["Kurukshetra", "Hastinapura"],
  "difficulty_level": 4,
  "archive_identifier": "bhagavadgita00vyas"
}
```

### 12. **Columbus's Letter (1493)**
```json
{
  "identifier": "columbus-letter-1493",
  "title": "Letter to the Spanish Sovereigns",
  "author": "Christopher Columbus",
  "original_date": "1493",
  "era": "early_modern",
  "culture_zone": "european",
  "document_type": "personal",
  "regions": ["Caribbean", "Spain", "Americas"],
  "keywords": ["discovery", "Indies", "gold", "natives", "voyage"],
  "topics": ["exploration", "colonization", "first contact"],
  "people": ["Columbus", "Ferdinand", "Isabella"],
  "places": ["Hispaniola", "Cuba", "San Salvador"],
  "difficulty_level": 2,
  "archive_identifier": "letterofcolumbus00colu"
}
```

### 13. **Sundiata Epic (c. 1200s)**
```json
{
  "identifier": "sundiata-epic-1200s",
  "title": "Epic of Sundiata",
  "author": "Mandinka griots",
  "translator": "D.T. Niane",
  "original_date": "c. 1200s",
  "era": "medieval",
  "culture_zone": "african",
  "document_type": "literary",
  "regions": ["Mali", "West Africa", "Mande"],
  "keywords": ["Sundiata", "Mali Empire", "griot", "lion king"],
  "topics": ["founding myth", "heroism", "oral tradition"],
  "people": ["Sundiata Keita", "Sogolon", "Sumanguru"],
  "places": ["Niani", "Kangaba", "Niger River"],
  "difficulty_level": 2,
  "archive_identifier": "sundiataepic00nian"
}
```

### 14. **Tacitus Germania (98 CE)**
```json
{
  "identifier": "tacitus-germania-98",
  "title": "Germania",
  "author": "Tacitus",
  "translator": "Harold Mattingly",
  "original_date": "98 CE",
  "era": "classical",
  "culture_zone": "european",
  "document_type": "historical",
  "regions": ["Germania", "Rhine", "Northern Europe"],
  "keywords": ["Germans", "tribes", "customs", "Romans", "barbarians"],
  "topics": ["ethnography", "military", "culture clash"],
  "people": ["Tacitus", "Arminius"],
  "places": ["Rhine", "Danube", "Black Forest"],
  "difficulty_level": 3,
  "archive_identifier": "germania00taci"
}
```

### 15. **Declaration of the Rights of Man (1789)**
```json
{
  "identifier": "rights-of-man-1789",
  "title": "Declaration of the Rights of Man and of the Citizen",
  "author": "French National Assembly",
  "original_date": "1789",
  "era": "early_modern",
  "culture_zone": "european",
  "document_type": "legal",
  "regions": ["France", "Paris", "Western Europe"],
  "keywords": ["liberty", "equality", "revolution", "rights", "citizen"],
  "topics": ["French Revolution", "democracy", "human rights"],
  "people": ["Lafayette", "Mirabeau", "Sieyès"],
  "places": ["Paris", "Versailles"],
  "difficulty_level": 2,
  "archive_identifier": "declarationright00fran"
}
```

### 16. **Kebra Nagast (c. 1300s)**
```json
{
  "identifier": "kebra-nagast-1300s",
  "title": "The Glory of Kings",
  "author": "Ethiopian scribes",
  "translator": "E.A. Wallis Budge",
  "original_date": "c. 1300s",
  "era": "medieval",
  "culture_zone": "african",
  "document_type": "religious",
  "regions": ["Ethiopia", "Horn of Africa"],
  "keywords": ["Solomon", "Sheba", "Menelik", "Ark of Covenant"],
  "topics": ["Ethiopian Christianity", "royal lineage", "mythology"],
  "people": ["Queen of Sheba", "Solomon", "Menelik I"],
  "places": ["Axum", "Jerusalem", "Ethiopia"],
  "difficulty_level": 3,
  "archive_identifier": "kebranagast00ethi"
}
```

### 17. **Nihon Shoki (720 CE)**
```json
{
  "identifier": "nihon-shoki-720",
  "title": "Chronicles of Japan",
  "author": "Prince Toneri",
  "translator": "W.G. Aston",
  "original_date": "720",
  "era": "medieval",
  "culture_zone": "east_asian",
  "document_type": "historical",
  "regions": ["Japan", "Yamato", "East Asia"],
  "keywords": ["emperor", "Shinto", "kami", "Yamato", "chronicle"],
  "topics": ["Japanese mythology", "imperial history", "Buddhism arrival"],
  "people": ["Emperor Jimmu", "Amaterasu", "Prince Shotoku"],
  "places": ["Nara", "Yamato", "Ise"],
  "difficulty_level": 4,
  "archive_identifier": "nihonshoki00tone"
}
```

### 18. **Las Casas Brief Account (1542)**
```json
{
  "identifier": "las-casas-1542",
  "title": "A Short Account of the Destruction of the Indies",
  "author": "Bartolomé de las Casas",
  "original_date": "1542",
  "era": "early_modern",
  "culture_zone": "american",
  "document_type": "historical",
  "regions": ["Caribbean", "Mexico", "Peru", "Spanish Americas"],
  "keywords": ["conquest", "atrocities", "indigenous", "encomienda"],
  "topics": ["colonialism", "human rights", "Spanish conquest"],
  "people": ["Las Casas", "Columbus", "Cortés", "Pizarro"],
  "places": ["Hispaniola", "Cuba", "Peru", "Mexico"],
  "difficulty_level": 3,
  "archive_identifier": "briefaccount00casa"
}
```

### 19. **Upanishads (c. 800 BCE)**
```json
{
  "identifier": "upanishads-800bce",
  "title": "The Principal Upanishads",
  "author": "Various sages",
  "translator": "Juan Mascaró",
  "original_date": "c. 800 BCE",
  "era": "ancient",
  "culture_zone": "south_asian",
  "document_type": "philosophical",
  "regions": ["India", "Ganges Valley", "South Asia"],
  "keywords": ["Brahman", "Atman", "meditation", "self", "consciousness"],
  "topics": ["Hindu philosophy", "metaphysics", "spirituality"],
  "people": ["Yajnavalkya", "Uddalaka"],
  "places": ["Ganges", "Himalayas"],
  "difficulty_level": 5,
  "archive_identifier": "upanishads00masc"
}
```

### 20. **Treaty of Tordesillas (1494)**
```json
{
  "identifier": "tordesillas-1494",
  "title": "Treaty of Tordesillas",
  "author": "Spanish and Portuguese negotiators",
  "original_date": "1494",
  "era": "early_modern",
  "culture_zone": "global",
  "document_type": "legal",
  "regions": ["Spain", "Portugal", "Americas", "Atlantic"],
  "keywords": ["division", "Pope", "meridian", "Brazil", "colonization"],
  "topics": ["international law", "exploration", "papal authority"],
  "people": ["Pope Alexander VI", "Ferdinand", "John II"],
  "places": ["Tordesillas", "Cape Verde", "Brazil"],
  "difficulty_level": 3,
  "archive_identifier": "treatytordesilla00span"
}
```

## Automation Script for Processing

```bash
#!/bin/bash
# scripts/download-sources.sh

# Create directories
mkdir -p ./primary-sources/{pdfs,text,metadata}

# Function to download from Internet Archive
download_source() {
  identifier=$1
  echo "Downloading $identifier..."
  
  # Download PDF
  wget -q "https://archive.org/download/${identifier}/${identifier}.pdf" \
    -O "./primary-sources/pdfs/${identifier}.pdf"
  
  # Download metadata
  wget -q "https://archive.org/metadata/${identifier}" \
    -O "./primary-sources/metadata/${identifier}.json"
  
  echo "✓ Downloaded $identifier"
}

# Process all sources
sources=(
  "magnacarta00engl"
  "epicofgilgamesh00unse"
  "analectsconfuciu00conf"
  # ... etc
)

for source in "${sources[@]}"; do
  download_source "$source"
done

echo "All sources downloaded!"
```

## Implementation Timeline

### Phase 1: Infrastructure (Week 1)
1. **Set up Cloudflare R2 bucket**
   - Create bucket "primary-sources"
   - Generate API credentials
   - Test upload/download

2. **Set up Supabase schema**
   - Create all tables
   - Set up indexes
   - Configure RLS policies

3. **Create ingestion scripts**
   - PDF download automation
   - Text extraction pipeline
   - R2 upload functions

### Phase 2: Initial Content (Week 2)
1. **Process first 20 sources**
   - Download PDFs
   - Extract and clean text
   - Generate metadata
   - Upload to storage

2. **Quality control**
   - Verify text accuracy
   - Check keyword relevance
   - Test search functionality

### Phase 3: UI Components (Week 3)
1. **Keyword detection system**
2. **Primary source modal**
3. **Search interface**
4. **Journal integration**

### Phase 4: Scale to 100+ (Week 4+)
1. **Batch processing pipeline**
2. **Automated quality checks**
3. **User feedback system**

## Cost Analysis

### Cloudflare R2
- **Storage**: $0.015/GB/month
- **Operations**: $0.36 per million requests
- **Bandwidth**: FREE (no egress fees!)
- **100 sources (5GB)**: ~$0.08/month
- **1000 sources (50GB)**: ~$0.75/month

### Supabase (Free Tier)
- **Database**: 500MB (metadata only, sufficient for 10,000+ sources)
- **Bandwidth**: 1GB/month (only serving text, not PDFs)
- **API requests**: 500K/month

### Total Monthly Cost
- **100 sources**: ~$0.08
- **1000 sources**: ~$0.75
- **10,000 sources**: ~$7.50

## Advantages of This Approach

1. **Zero bandwidth costs** - R2 doesn't charge for downloads
2. **Fast global delivery** - Cloudflare's CDN
3. **Clean git repo** - PDFs not in version control
4. **Scalable** - Can handle millions of documents
5. **Cost-effective** - Under $1/month for 1000 sources
6. **API-driven** - Easy automation and updates
7. **Search-optimized** - Full-text search in Supabase