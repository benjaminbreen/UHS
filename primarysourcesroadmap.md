# Primary Sources Educational System Roadmap

## Vision
Create a powerful educational tool that dynamically integrates historical primary sources into gameplay, providing immediate access to authentic historical documents when players encounter relevant keywords, regions, or time periods.

## Core Features
- **Dynamic Keyword Detection**: Underlined keywords/phrases with hover effects
- **Primary Source Modal**: Scrollable text + images + PDF download
- **Journal Integration**: Save sources to sidebar journal for later reference
- **Era-Region Mapping**: Sources linked to specific time periods and locations
- **Dual Format Support**: Plain text/markdown for reading + original PDF scans
- **Scalable Architecture**: Start with 100 sources, scale to 1000+

## Storage Architecture

### Hybrid Approach (Recommended)
```
Supabase (Free Tier):
├── primary_sources table
│   ├── id (uuid)
│   ├── title (text)
│   ├── author (text)
│   ├── era (enum)
│   ├── regions (text[])
│   ├── keywords (text[])
│   ├── description (text)
│   ├── text_content (text) - full plaintext/markdown
│   ├── pdf_url (text) - Vercel static URL
│   ├── images (jsonb) - array of image URLs
│   ├── metadata (jsonb) - date, language, etc.
│   └── created_at (timestamp)
│
└── user_saved_sources table
    ├── user_id (text)
    ├── source_id (uuid)
    └── saved_at (timestamp)

Vercel Static Storage:
├── /public/primary-sources/pdfs/
│   └── [source-id].pdf (original scans)
└── /public/primary-sources/images/
    └── [source-id]/[image-name].jpg
```

### Benefits of This Approach
- Supabase handles metadata, search, and user saves (minimal bandwidth)
- Vercel serves static PDFs/images (generous bandwidth, CDN-cached)
- Fast keyword search via Supabase indexes
- No bandwidth concerns for PDF downloads

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
1. **Database Setup**
   ```sql
   -- Supabase schema
   CREATE TYPE era_type AS ENUM (
     'ancient', 'classical', 'medieval', 'early_modern', 
     'industrial', 'modern', 'contemporary'
   );
   
   CREATE TABLE primary_sources (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     title TEXT NOT NULL,
     author TEXT,
     era era_type NOT NULL,
     regions TEXT[] NOT NULL,
     keywords TEXT[] NOT NULL,
     description TEXT,
     text_content TEXT NOT NULL,
     pdf_url TEXT,
     images JSONB DEFAULT '[]',
     metadata JSONB DEFAULT '{}',
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   CREATE INDEX idx_keywords ON primary_sources USING GIN(keywords);
   CREATE INDEX idx_regions ON primary_sources USING GIN(regions);
   CREATE INDEX idx_era ON primary_sources(era);
   ```

2. **Type Definitions**
   ```typescript
   // types/primarySourceTypes.ts
   interface PrimarySource {
     id: string;
     title: string;
     author?: string;
     era: Era;
     regions: string[];
     keywords: string[];
     description: string;
     textContent: string;
     pdfUrl?: string;
     images?: { url: string; caption?: string }[];
     metadata?: {
       date?: string;
       language?: string;
       sourceArchiveUrl?: string;
     };
   }
   ```

3. **Service Layer**
   ```typescript
   // services/primarySourceService.ts
   - fetchSourcesByEraAndRegion()
   - searchSourcesByKeyword()
   - getSourceById()
   - saveSourceToJournal()
   - getUserSavedSources()
   ```

### Phase 2: UI Components (Week 1-2)
1. **Keyword Detection System**
   ```typescript
   // components/PrimarySourceKeyword.tsx
   - Scan text for keywords
   - Wrap matches in clickable spans
   - Add underline and hover effects
   ```

2. **Primary Source Modal**
   ```typescript
   // components/PrimarySourceModal.tsx
   - Tabbed interface: Text | Images | Original PDF
   - Scrollable markdown renderer
   - Download PDF button
   - Save to Journal button
   - Citation generator
   ```

3. **Sidebar Integration**
   ```typescript
   // components/sidebar/PrimarySources.tsx
   - Era/Region browser
   - Saved sources list
   - Search functionality
   ```

### Phase 3: Content Pipeline (Week 2)
1. **Automated Ingestion Script**
   ```typescript
   // scripts/ingestPrimarySource.ts
   - Input: Internet Archive URL or PDF path
   - Process: Extract text via pdf-parse
   - Clean: Format as markdown
   - Upload: PDF to Vercel, metadata to Supabase
   - Output: Source ID and success status
   ```

2. **Batch Processing**
   ```typescript
   // scripts/batchIngest.ts
   - Read CSV/JSON of source metadata
   - Download from Internet Archive
   - Process each source
   - Generate keyword associations
   - Validate and upload
   ```

### Phase 4: Dynamic Integration (Week 2-3)
1. **Keyword Scanner Hook**
   ```typescript
   // hooks/usePrimarySourceKeywords.ts
   - Scan all visible text in UI
   - Cache keyword matches
   - Debounce for performance
   ```

2. **Context-Aware Suggestions**
   ```typescript
   // hooks/usePrimarySourceContext.ts
   - Monitor current era and region
   - Suggest relevant sources
   - Track user engagement
   ```

### Phase 5: Initial Content (Week 3)
First 100 sources organized by priority regions/eras:

#### Medieval Europe (25 sources)
- Magna Carta (1215)
- Chronicle of Fredegar
- Song of Roland
- Domesday Book excerpts
- Letters of Abelard and Heloise

#### Classical Antiquity (20 sources)
- Plato's Republic excerpts
- Caesar's Gallic Wars
- Pliny's Natural History
- Tacitus' Germania
- Homer's Iliad excerpts

#### Early Modern Americas (20 sources)
- Florentine Codex excerpts
- Columbus's letters
- Bartolomé de las Casas writings
- Inca Garcilaso de la Vega
- Popol Vuh excerpts

#### Ancient Near East (15 sources)
- Epic of Gilgamesh
- Code of Hammurabi
- Amarna Letters
- Egyptian Book of the Dead excerpts
- Hittite treaties

#### East Asia (20 sources)
- Analects of Confucius
- Tale of Genji excerpts
- Journey to the West excerpts
- Qing dynasty edicts
- Korean Samguk Sagi excerpts

## Automation Workflow

### Step 1: Source List Preparation
```json
{
  "sources": [
    {
      "title": "Magna Carta",
      "archive_url": "https://archive.org/details/magnacarta00engl",
      "era": "medieval",
      "regions": ["British Isles", "England"],
      "keywords": ["law", "rights", "King John", "barons", "Runnymede"],
      "pages": "1-20"
    }
  ]
}
```

### Step 2: Automated Download & Processing
```bash
# CLI command for batch processing
npm run ingest-sources sources-list.json

# Individual source
npm run ingest-source --url="https://archive.org/..." --era="medieval" --region="England"
```

### Step 3: AI-Assisted Keyword Extraction
```typescript
// Using Claude API for keyword extraction
async function extractKeywords(text: string, context: SourceContext) {
  // Send first 1000 words to Claude
  // Request historical keywords, people, places, concepts
  // Return array of weighted keywords
}
```

## Performance Considerations

### Caching Strategy
- Cache keyword scans per component (5 min TTL)
- Cache source metadata locally (localStorage)
- Lazy load PDF URLs only when needed
- Preload next/previous sources in reading mode

### Bundle Size Management
- Lazy load PrimarySourceModal component
- Dynamic import for PDF viewer
- Compress images to WebP format
- Paginate source lists (20 per page)

## Future Enhancements (Post-Launch)

### Phase 6: Advanced Features
- **Translation Support**: Multiple language versions
- **Audio Narration**: Text-to-speech for accessibility
- **Annotations**: User notes and highlights
- **Sharing**: Social media integration
- **Quizzes**: Auto-generated comprehension questions

### Phase 7: Content Expansion (Ongoing)
- Target: 1000+ sources within 6 months
- Community contributions system
- Partnership with digital libraries
- OCR pipeline for new acquisitions
- Crowdsourced transcription verification

## Success Metrics
- Click-through rate on keywords
- Source saves to journal
- PDF downloads
- Time spent reading sources
- Sources per game session
- User feedback ratings

## Technical Requirements
- Supabase account (free tier sufficient for metadata)
- Vercel deployment (static asset hosting)
- Node.js scripts for automation
- pdf-parse library for text extraction
- Internet Archive API access

## Content Guidelines
- Only public domain sources
- Verify copyright status
- Include proper citations
- Maintain source authenticity
- Provide context when needed
- Flag sensitive content appropriately

## Implementation Timeline
- **Week 1**: Database schema, type definitions, service layer
- **Week 2**: UI components, modal, keyword detection
- **Week 3**: Content pipeline, first 50 sources
- **Week 4**: Testing, optimization, remaining 50 sources
- **Month 2-3**: Expand to 500 sources
- **Month 4-6**: Reach 1000 sources, add advanced features

## Cost Estimates
- Supabase Free Tier: $0 (up to 500MB database, 1GB bandwidth)
- Vercel Static Storage: $0 (100GB bandwidth free)
- Domain/CDN: Included with Vercel
- Total Monthly Cost: $0 for first 10,000 users

## Risk Mitigation
- **Bandwidth Exceeded**: Implement PDF compression, CDN caching
- **Database Limits**: Archive old user saves, optimize queries
- **Copyright Issues**: Strict public domain verification
- **Performance**: Progressive enhancement, lazy loading
- **Content Quality**: Peer review process, version control