# Primary Sources Educational System - Implementation Roadmap

## Current Approach: Sharded JSON with API Fetching

We're using a hybrid approach that balances performance, simplicity, and scalability:
- **Metadata**: Sharded JSON files (lazy-loaded by era/culture)
- **Full Text**: Fetched from Wikisource/Internet Archive APIs on demand
- **Future Uploads**: Supabase for premium user content

## Phase 1: Core Infrastructure (Weeks 1-2)

### Data Architecture
```
/public/sources/
├── metadata/
│   ├── ancient-near-eastern.json      (~10 sources, ~15KB)
│   ├── classical-european.json        (~10 sources, ~15KB)  
│   ├── medieval-european.json         (~10 sources, ~15KB)
│   ├── medieval-islamic.json          (~10 sources, ~15KB)
│   └── renaissance-european.json      (~10 sources, ~15KB)
└── index.json                         (source IDs and shard mapping)
```

### JSON Structure
```json
{
  "id": "magna-carta",
  "title": "Magna Carta",
  "author": "English Barons",
  "year": 1215,
  "era": "medieval",
  "culturalZones": ["european"],
  "excerpt": "No free man shall be seized or imprisoned...", // 2-3 sentences
  "keywords": ["law", "rights", "england", "king john"],
  "contextualKeywords": [
    {
      "keyword": "law",
      "conditions": {"era": "medieval", "culturalZone": "european"}
    }
  ],
  "wikisourceTitle": "Magna_Carta",
  "citation": {
    "originalPublication": "Runnymede, England, 1215"
  }
}
```

### Service Implementation
```typescript
// services/primarySourceService.ts
class PrimarySourceService {
  private loadedShards = new Map();
  private textCache = new Map(); // IndexedDB wrapper
  
  async getSourcesForContext(era: Era, zone: CulturalZone) {
    const shardName = `${era}-${zone}`.toLowerCase();
    
    if (this.loadedShards.has(shardName)) {
      return this.loadedShards.get(shardName);
    }
    
    const response = await fetch(`/sources/metadata/${shardName}.json`);
    const sources = await response.json();
    this.loadedShards.set(shardName, sources);
    return sources;
  }
  
  async getFullText(source: PrimarySourceMetadata) {
    // Check cache first
    if (this.textCache.has(source.id)) {
      return this.textCache.get(source.id);
    }
    
    // Fetch from Wikisource
    const text = await this.fetchFromWikisource(source.wikisourceTitle);
    this.textCache.set(source.id, text);
    return text;
  }
}
```

### UI Components

#### 1. Keyword Detection
- Scan visible text for matches
- Underline and make clickable
- Show tooltip on hover

#### 2. Primary Source Modal
```typescript
// components/PrimarySourceModal.tsx
- Header: Title, Author, Year
- Tabs: Excerpt | Full Text | Citation
- Actions: Save to Journal | Copy Citation | Close
```

#### 3. Sources Sidebar Tab
```typescript
// components/sidebar/SourcesPanel.tsx
- Filter by current era/region
- Search all metadata
- Recently viewed
- Saved sources
```

### LLM Integration
```typescript
// When generating NPC dialogue
const sources = await getSourcesForContext(era, zone);
const relevantExcerpts = sources
  .filter(s => matchesNPCContext(s, npc))
  .slice(0, 3)
  .map(s => s.excerpt);

const prompt = `
Historical context from primary sources:
${relevantExcerpts.join('\n')}

Generate dialogue for ${npc.name}, a ${npc.profession} in ${year}...
`;
```

### Deliverables for Phase 1
- [ ] 50 sources across 5 shards
- [ ] Service layer with caching
- [ ] Wikisource API integration
- [ ] Keyword detection in game text
- [ ] Primary Source Modal
- [ ] Sources tab in sidebar
- [ ] LLM context injection

## Phase 2: Content Expansion (Weeks 3-6)

### Scale to 200 Sources
- Add 10-15 more shards covering all regions/eras
- Focus on non-Western sources
- Implement quality tiers

### Enhanced Features
- Smart preloading (predict needed shards)
- Related sources algorithm
- Full-text search across all metadata
- Source collections/themes

### Performance Optimization
- Service worker for offline access
- Gzip compression for shards
- Progressive loading states

### New UI Features
- Timeline view of sources
- Map view showing source origins
- Reading progress tracking
- Note-taking on sources

## Phase 3: User Customization (Month 2+)

### Freemium Model
**Free Tier:**
- Access all 200+ public domain sources
- Basic search and filtering
- Save up to 10 favorites

**Premium ($5/month):**
- Upload custom sources (up to 100)
- Advanced keyword mapping
- Create source collections
- Priority caching
- Export citations

**Educational ($50/month):**
- Unlimited custom sources
- Student progress tracking
- Required reading assignments
- Custom scenarios with specific sources
- Classroom management tools

### Technical Implementation
- Add Supabase for user uploads
- PDF text extraction in browser (pdf.js)
- Custom keyword mapping interface
- Share collections publicly/privately

## Integration with World Weaver

The Primary Source System provides critical context for the World Weaver:

### Scenario Generation
When World Weaver creates a scenario, it:
1. Identifies relevant sources by era/region
2. Extracts key historical details from excerpts
3. Incorporates source content into NPC personalities
4. Links sources to quest objectives

### Dynamic Events
Events can be triggered by:
- Reading specific sources
- NPCs referencing source content
- Player actions that contradict historical sources
- Discovery of source-mentioned locations

### Assessment
The Assessment Engine uses sources to:
- Verify historical accuracy of player actions
- Provide feedback with source citations
- Score based on source engagement
- Generate source-based quiz questions

## Migration Notes

### Deprecation Notice
The `primarysourcesroadmap-r2.md` file is now **DEPRECATED**. The R2/S3 storage approach has been replaced with:
- Sharded JSON for metadata (no cloud storage needed)
- Wikisource/IA APIs for full text (no PDF hosting)
- Future Supabase only for user uploads (not core sources)

This approach eliminates infrastructure complexity while maintaining all functionality.

## Success Metrics
- Load time for source metadata: < 200ms
- Full text fetch time: < 1 second
- User engagement: 30% of players read at least one source
- Educational impact: Measurable improvement in historical knowledge
- Technical: Zero infrastructure cost for first 10,000 users

## Implementation Checklist

### Week 1
- [ ] Create initial 5 shards with 10 sources each
- [ ] Implement PrimarySourceService with lazy loading
- [ ] Add Wikisource API integration
- [ ] Set up IndexedDB caching

### Week 2  
- [ ] Build Primary Source Modal component
- [ ] Add keyword detection system
- [ ] Implement Sources sidebar tab
- [ ] Integrate source excerpts into LLM prompts

### Week 3-4
- [ ] Expand to 100 sources across 10 shards
- [ ] Add search and filtering
- [ ] Implement related sources
- [ ] Performance optimization

### Month 2
- [ ] Scale to 200 sources
- [ ] Add premium features framework
- [ ] Implement user upload system
- [ ] Launch freemium model