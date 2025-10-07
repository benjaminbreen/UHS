/**
 * Primary Source Service
 * Handles fetching and caching of historical primary sources
 * Uses sharded JSON for metadata and Wikisource/Internet Archive APIs for full text
 */

import { HistoricalEra } from '../types';

// Define CulturalZone type locally to avoid import issues
type CulturalZone = 'EUROPEAN' | 'EAST_ASIAN' | 'MENA' | 'NORTH_AMERICAN_PRE_COLUMBIAN' | 'NORTH_AMERICAN_COLONIAL' | 'OCEANIA' | 'SOUTH_ASIAN' | 'SOUTH_AMERICAN' | 'SUB_SAHARAN_AFRICAN';

export interface PrimarySourceMetadata {
  id: string;
  title: string;
  author: string;
  year: number;
  era: string;
  culturalZones: string[];
  excerpt: string; // Short excerpt (1-2 sentences) for list display
  longExcerpt?: string; // Longer excerpt (~500 words) for modal display
  keywords: string[];
  contextualKeywords?: {
    keyword: string;
    conditions: {
      era?: string;
      culturalZone?: string;
    };
  }[];
  wikisourceTitle?: string;
  wikipediaArticle?: string; // Wikipedia article name for visual/archaeological sources
  internetArchiveId?: string;
  citation: {
    translator?: string;
    originalPublication?: string;
    modernSource?: string;
  };
  isStandard?: boolean; // Marks if this is a standard source for an era/zone combo
  relevanceScore?: number; // Used for search result ranking
  defaultTab?: 'excerpt' | 'fulltext' | 'citation' | 'wikipedia'; // Which tab to show by default
  scholarSearchTerms?: string; // Google Scholar search terms for AI-suggested sources
}

interface ShardData {
  sources: PrimarySourceMetadata[];
}

class PrimarySourceService {
  private loadedShards = new Map<string, PrimarySourceMetadata[]>();
  private fullTextCache = new Map<string, string>();
  private dbName = 'PrimarySourcesDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initIndexedDB();
  }

  /**
   * Initialize IndexedDB for caching full texts
   */
  private async initIndexedDB(): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not available');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject();
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('fullTexts')) {
          const store = db.createObjectStore('fullTexts', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Get the list of available shard files based on era and zone
   */
  private getShardFiles(era?: HistoricalEra, zone?: CulturalZone): string[] {
    const shards: string[] = [];
    
    // Map cultural zones to their folder names
    const zoneToFolder: Record<string, string> = {
      'EUROPEAN': 'europe',
      'EAST_ASIAN': 'asia',
      'SOUTH_ASIAN': 'asia',
      'MENA': 'mena',
      'NORTH_AMERICAN_PRE_COLUMBIAN': 'north-america',
      'NORTH_AMERICAN_COLONIAL': 'north-america',
      'SOUTH_AMERICAN': 'south-america',
      'SUB_SAHARAN_AFRICAN': 'sub-saharan-africa',
      'OCEANIA': 'oceania'
    };
    
    // Map historical eras to their file suffixes
    const eraToSuffix: Record<string, string> = {
      'PREHISTORY': 'prehistory',
      'ANTIQUITY': 'antiquity',
      'MEDIEVAL': 'medieval',
      'RENAISSANCE_EARLY_MODERN': 'renaissance-early-modern',
      'INDUSTRIAL_ERA': 'industrial',
      'MODERN_ERA': 'modern',
      'FUTURE_ERA': 'future'
    };
    
    // If specific zone and era requested, return that shard
    if (zone && era) {
      const folder = zoneToFolder[zone];
      const suffix = eraToSuffix[era];
      if (folder && suffix) {
        shards.push(`${folder}-${suffix}`);
      }
      return shards;
    }
    
    // If only zone specified, get all eras for that zone
    if (zone) {
      const folder = zoneToFolder[zone];
      if (folder) {
        Object.values(eraToSuffix).forEach(suffix => {
          shards.push(`${folder}-${suffix}`);
        });
      }
      return shards;
    }
    
    // If only era specified, get all zones for that era
    if (era) {
      const suffix = eraToSuffix[era];
      if (suffix) {
        const uniqueFolders = new Set(Object.values(zoneToFolder));
        uniqueFolders.forEach(folder => {
          shards.push(`${folder}-${suffix}`);
        });
      }
      return shards;
    }
    
    // Default: return common shards
    return [
      'europe-medieval',
      'europe-renaissance-early-modern',
      'asia-medieval',
      'mena-medieval',
      'north-america-renaissance-early-modern'
    ];
  }

  /**
   * Get sources for a specific context (era and cultural zone)
   */
  async getSourcesForContext(
    era: HistoricalEra,
    zone: CulturalZone
  ): Promise<PrimarySourceMetadata[]> {
    const shardFiles = this.getShardFiles(era, zone);
    
    let allSources: PrimarySourceMetadata[] = [];
    
    // Load all relevant shards
    for (const shardFile of shardFiles) {
      // Skip if already loaded
      if (!this.loadedShards.has(shardFile)) {
        try {
          const response = await fetch(`/sources/metadata/${shardFile}.json`);
          if (response.ok) {
            const data: ShardData = await response.json();
            this.loadedShards.set(shardFile, data.sources || []);
          }
        } catch (error) {
          console.error(`Error loading shard ${shardFile}:`, error);
        }
      }
      
      // Get sources from this shard
      const shardSources = this.loadedShards.get(shardFile) || [];
      
      // Filter by era and zone
      const filtered = shardSources.filter((source: PrimarySourceMetadata) => {
        const matchesEra = !source.era || source.era === era;
        const matchesZone = !source.culturalZones || 
          source.culturalZones.includes(zone as any);
        
        // Always include sources marked as "standard" for this combo
        const isStandard = source.isStandard && matchesEra && matchesZone;
        
        return isStandard || (matchesEra && matchesZone);
      });
      
      allSources = allSources.concat(filtered);
    }
    
    // Ensure at least one standard source per combo
    const hasStandard = allSources.some(s => s.isStandard);
    if (!hasStandard && allSources.length > 0) {
      // Mark the first source as standard if none exist
      allSources[0].isStandard = true;
    }
    
    return allSources;
  }

  /**
   * Get all loaded sources (from all loaded shards)
   */
  getAllLoadedSources(): PrimarySourceMetadata[] {
    const allSources: PrimarySourceMetadata[] = [];
    this.loadedShards.forEach(sources => {
      allSources.push(...sources);
    });
    return allSources;
  }

  /**
   * Search for sources by keyword with context awareness
   */
  async searchByKeyword(
    keyword: string,
    era?: HistoricalEra,
    zone?: CulturalZone
  ): Promise<PrimarySourceMetadata[]> {
    const searchTerm = keyword.toLowerCase();
    
    // First, ensure all shards are loaded for comprehensive search
    if (keyword.length >= 2) { // Only search if keyword is meaningful
      const allShards = this.getShardFiles();
      for (const shardFile of allShards) {
        if (!this.loadedShards.has(shardFile)) {
          try {
            const response = await fetch(`/sources/metadata/${shardFile}.json`);
            if (response.ok) {
              const data: ShardData = await response.json();
              this.loadedShards.set(shardFile, data.sources || []);
            }
          } catch (error) {
            console.error(`Error loading shard ${shardFile}:`, error);
          }
        }
      }
    }
    
    const results: PrimarySourceMetadata[] = [];
    
    // Search through all loaded sources
    this.loadedShards.forEach(sources => {
      sources.forEach(source => {
        // Calculate relevance score
        let score = 0;
        
        // Search in title (highest weight)
        if (source.title.toLowerCase().includes(searchTerm)) {
          score += 10;
        }
        
        // Search in author
        if (source.author.toLowerCase().includes(searchTerm)) {
          score += 5;
        }
        
        // Search in keywords
        if (source.keywords.some(k => k.toLowerCase().includes(searchTerm))) {
          score += 3;
        }
        
        // Search in contextual keywords
        const matchesContextual = source.contextualKeywords?.some(ck => {
          if (!ck.keyword.toLowerCase().includes(searchTerm)) return false;
          
          // If context provided, boost score for matching context
          if (era || zone) {
            const eraMatches = !ck.conditions.era || ck.conditions.era === era;
            const zoneMatches = !ck.conditions.culturalZone || ck.conditions.culturalZone === zone;
            return eraMatches && zoneMatches;
          }
          return true;
        });
        
        if (matchesContextual) {
          score += 2;
        }
        
        // Search in excerpt (lowest weight)
        if (source.excerpt.toLowerCase().includes(searchTerm)) {
          score += 1;
        }
        
        // Add to results if any match found
        if (score > 0) {
          results.push({ ...source, relevanceScore: score });
        }
      });
    });
    
    // Sort by relevance score
    return results.sort((a, b) => 
      (b.relevanceScore || 0) - (a.relevanceScore || 0)
    );
  }

  /**
   * Get a specific source by ID
   */
  async getSourceById(id: string): Promise<PrimarySourceMetadata | null> {
    const allSources = this.getAllLoadedSources();
    return allSources.find(s => s.id === id) || null;
  }

  /**
   * Clean and parse text to remove metadata and get to actual content
   */
  private cleanSourceText(text: string): string {
    // Remove CSS and style blocks
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/\.mw-parser-output[^}]*}/g, '');
    
    // Remove Wikisource header metadata
    text = text.replace(/←.*?→/g, ''); // Navigation arrows
    text = text.replace(/Versions of.*?include:/gi, '');
    text = text.replace(/sister projects:.*?item\d+/gi, '');
    text = text.replace(/related portals:.*?\n/gi, '');
    
    // Remove common front matter patterns
    text = text.replace(/^.*?Table of Contents.*?\n/gim, '');
    text = text.replace(/^.*?Title Page.*?\n/gim, '');
    text = text.replace(/^.*?Copyright.*?\n/gim, '');
    text = text.replace(/^.*?Library of Congress.*?\n/gim, '');
    text = text.replace(/^.*?Transcriber's Note.*?\n/gim, '');
    
    // Remove Internet Archive metadata
    text = text.replace(/This is a digital copy.*?Google/gs, '');
    text = text.replace(/Digitized by.*?\n/gi, '');
    text = text.replace(/Original from.*?\n/gi, '');
    
    // Find the actual start of content
    // Look for common beginning patterns
    const contentStarters = [
      /^(Chapter|CHAPTER|Book|BOOK|Part|PART)\s+(One|I|1|First)/m,
      /^(Prologue|PROLOGUE|Preface|Introduction)/m,
      /^Here (begins?|beginneth)/mi,
      /^When that/mi, // Canterbury Tales specific
      /^In the beginning/mi,
      /^Once upon/mi,
      /^It was/mi,
      /^The first/mi
    ];
    
    let startIndex = -1;
    for (const pattern of contentStarters) {
      const match = text.match(pattern);
      if (match && match.index !== undefined) {
        startIndex = match.index;
        break;
      }
    }
    
    // If we found a content start, use it
    if (startIndex > 0 && startIndex < text.length / 2) {
      text = text.substring(startIndex);
    }
    
    // Clean up excessive whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/[ \t]+/g, ' ');
    
    // Limit to first ~3000 characters for display
    if (text.length > 3000) {
      text = text.substring(0, 3000) + '\n\n[Text continues...]';
    }
    
    return text.trim();
  }

  /**
   * Fetch full text from Wikisource with improved parsing
   */
  private async fetchFromWikisource(title: string): Promise<string> {
    try {
      // First try to get the raw wikitext which is cleaner
      const wikiTextUrl = `https://en.wikisource.org/w/api.php?` + 
        new URLSearchParams({
          action: 'query',
          titles: title.replace(/_/g, ' '),
          format: 'json',
          origin: '*',
          prop: 'revisions',
          rvprop: 'content',
          rvslots: 'main'
        });

      const wikiResponse = await fetch(wikiTextUrl);
      const wikiData = await wikiResponse.json();
      
      if (wikiData.query && wikiData.query.pages) {
        const pages = Object.values(wikiData.query.pages) as any[];
        if (pages[0] && pages[0].revisions) {
          const wikitext = pages[0].revisions[0].slots.main['*'];
          
          // Clean wikitext markup
          let cleanText = wikitext
            .replace(/\[\[.*?\]\]/g, '') // Remove links
            .replace(/\{\{.*?\}\}/g, '') // Remove templates
            .replace(/'''(.*?)'''/g, '$1') // Remove bold
            .replace(/''(.*?)''/g, '$1') // Remove italic
            .replace(/<.*?>/g, '') // Remove HTML tags
            .replace(/^=+.*?=+$/gm, '') // Remove headers
            .replace(/^\*.*$/gm, '') // Remove lists
            .replace(/\|.*$/gm, ''); // Remove table markup
          
          return this.cleanSourceText(cleanText);
        }
      }
      
      // Fallback to parsed HTML if wikitext fails
      const htmlUrl = `https://en.wikisource.org/w/api.php?` + 
        new URLSearchParams({
          action: 'parse',
          page: title.replace(/_/g, ' '),
          format: 'json',
          origin: '*',
          prop: 'text',
          disabletoc: 'true',
          disableeditsection: 'true'
        });

      const response = await fetch(htmlUrl);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.info);
      }

      // Extract text content and clean HTML
      const htmlContent = data.parse.text['*'];
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Remove ALL the cruft
      const selectorsToRemove = [
        '.mw-editsection',
        '.navbox',
        '.metadata',
        '.ambox',
        '.wst-header',
        '.sisicon',
        '.dabicon',
        '.plainSister',
        '#toc',
        '.toc',
        '.mw-references-wrap',
        '.references',
        'style',
        'script',
        '.noprint',
        '.navigation-not-searchable'
      ];
      
      selectorsToRemove.forEach(selector => {
        doc.querySelectorAll(selector).forEach(el => el.remove());
      });
      
      // Try to find the main content
      const contentSelectors = [
        '.poem',
        '.prose',
        '#mw-content-text',
        '.mw-parser-output'
      ];
      
      let mainContent = '';
      for (const selector of contentSelectors) {
        const element = doc.querySelector(selector);
        if (element && element.textContent) {
          mainContent = element.textContent;
          break;
        }
      }
      
      if (!mainContent) {
        mainContent = doc.body.textContent || '';
      }
      
      return this.cleanSourceText(mainContent);
    } catch (error) {
      console.error('Error fetching from Wikisource:', error);
      throw error;
    }
  }

  /**
   * Fetch full text from Internet Archive
   */
  private async fetchFromInternetArchive(identifier: string): Promise<string> {
    try {
      // Try to get the text file
      const textUrl = `https://archive.org/download/${identifier}/${identifier}_djvu.txt`;
      const response = await fetch(textUrl);
      
      let text = '';
      if (!response.ok) {
        // Try alternate text format
        const altUrl = `https://archive.org/stream/${identifier}/${identifier}_djvu.txt`;
        const altResponse = await fetch(altUrl);
        if (!altResponse.ok) {
          throw new Error('Text not available from Internet Archive');
        }
        text = await altResponse.text();
      } else {
        text = await response.text();
      }
      
      // Internet Archive texts often have page numbers and headers
      // Remove page numbers
      text = text.replace(/^\d+\s*$/gm, '');
      text = text.replace(/^Page \d+.*$/gm, '');
      text = text.replace(/^\[?\d+\]?\s*$/gm, '');
      
      // Remove running headers/footers (repeated lines)
      const lines = text.split('\n');
      const lineFrequency = new Map<string, number>();
      
      // Count line frequencies
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.length > 0 && trimmed.length < 100) {
          lineFrequency.set(trimmed, (lineFrequency.get(trimmed) || 0) + 1);
        }
      });
      
      // Remove lines that appear too frequently (likely headers/footers)
      const filteredLines = lines.filter(line => {
        const trimmed = line.trim();
        const freq = lineFrequency.get(trimmed) || 0;
        return freq < 5; // If a line appears 5+ times, it's probably a header
      });
      
      text = filteredLines.join('\n');
      
      // Apply general cleaning
      return this.cleanSourceText(text);
    } catch (error) {
      console.error('Error fetching from Internet Archive:', error);
      throw error;
    }
  }

  /**
   * Get full text for a source (with caching)
   */
  async getFullText(source: PrimarySourceMetadata): Promise<string> {
    // Check memory cache first
    if (this.fullTextCache.has(source.id)) {
      return this.fullTextCache.get(source.id)!;
    }

    // Check IndexedDB cache
    if (this.db) {
      try {
        const transaction = this.db.transaction(['fullTexts'], 'readonly');
        const store = transaction.objectStore('fullTexts');
        const request = store.get(source.id);
        
        const cachedText = await new Promise<string | null>((resolve) => {
          request.onsuccess = () => {
            const result = request.result;
            if (result && result.text) {
              // Check if cache is less than 30 days old
              const age = Date.now() - result.timestamp;
              if (age < 30 * 24 * 60 * 60 * 1000) {
                resolve(result.text);
                return;
              }
            }
            resolve(null);
          };
          request.onerror = () => resolve(null);
        });

        if (cachedText) {
          this.fullTextCache.set(source.id, cachedText);
          return cachedText;
        }
      } catch (error) {
        console.error('IndexedDB read error:', error);
      }
    }

    // Fetch from API with intelligent fallback
    let fullText: string = '';
    let errors: string[] = [];
    
    // Try Wikisource first (usually cleaner text)
    if (source.wikisourceTitle) {
      try {
        fullText = await this.fetchFromWikisource(source.wikisourceTitle);
        if (fullText && fullText.length > 100) {
          // Good result from Wikisource
        } else {
          throw new Error('Wikisource text too short');
        }
      } catch (error) {
        errors.push(`Wikisource: ${error}`);
        fullText = ''; // Reset
      }
    }
    
    // Try Internet Archive as fallback
    if (!fullText && source.internetArchiveId) {
      try {
        fullText = await this.fetchFromInternetArchive(source.internetArchiveId);
        if (!fullText || fullText.length < 100) {
          throw new Error('Internet Archive text too short');
        }
      } catch (error) {
        errors.push(`Internet Archive: ${error}`);
        fullText = ''; // Reset
      }
    }
    
    // If both failed, try alternate Wikisource title formats
    if (!fullText && source.wikisourceTitle) {
      const alternativeTitles = [
        source.wikisourceTitle.replace(/_/g, ' '),
        source.title.replace(/ /g, '_'),
        source.title
      ];
      
      for (const altTitle of alternativeTitles) {
        if (altTitle !== source.wikisourceTitle) {
          try {
            fullText = await this.fetchFromWikisource(altTitle);
            if (fullText && fullText.length > 100) {
              break;
            }
          } catch (error) {
            // Silent fail for alternatives
          }
        }
      }
    }
    
    // Final fallback: return formatted excerpt
    if (!fullText) {
      const errorInfo = errors.length > 0 ? 
        `\n\n[Technical details: ${errors.join('; ')}]` : '';
      
      fullText = `${source.title}
by ${source.author}
${source.citation.originalPublication || ''}

${source.excerpt}

[Full text not available online. This is an excerpt from the original source.]${errorInfo}`;
    }

    // Cache in memory
    this.fullTextCache.set(source.id, fullText);

    // Cache in IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction(['fullTexts'], 'readwrite');
        const store = transaction.objectStore('fullTexts');
        store.put({
          id: source.id,
          text: fullText,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('IndexedDB write error:', error);
      }
    }

    return fullText;
  }

  /**
   * Get random sources for a given context
   */
  async getRandomSources(
    count: number = 3,
    era?: HistoricalEra,
    zone?: CulturalZone
  ): Promise<PrimarySourceMetadata[]> {
    let sources: PrimarySourceMetadata[];
    
    if (era && zone) {
      sources = await this.getSourcesForContext(era, zone);
    } else {
      sources = this.getAllLoadedSources();
    }
    
    // Shuffle and return requested count
    const shuffled = [...sources].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Get sources most relevant to an NPC based on temporal proximity to their birth year
   * @param npcBirthYear The year the NPC was born
   * @param count Number of sources to return (default 3)
   * @param era Historical era for context
   * @param zone Cultural zone for context
   */
  async getTemporallyRelevantSources(
    npcBirthYear: number,
    count: number = 3,
    era?: HistoricalEra,
    zone?: CulturalZone
  ): Promise<PrimarySourceMetadata[]> {
    let sources: PrimarySourceMetadata[];
    
    // Get sources for the context
    if (era && zone) {
      sources = await this.getSourcesForContext(era, zone);
    } else {
      sources = this.getAllLoadedSources();
    }
    
    // If no sources available, return empty array
    if (sources.length === 0) {
      return [];
    }
    
    // Sort sources by temporal proximity to NPC's birth year
    // Sources from the NPC's lifetime (birth to assumed death ~70 years later) get highest priority
    // Then sources from their parents' generation (30 years before birth)
    // Then sources from their grandparents' generation (60 years before birth)
    const npcDeathYear = npcBirthYear + 70; // Assume 70 year lifespan
    
    const scoredSources = sources.map(source => {
      let score = 0;
      const sourceYear = source.year;
      
      // Highest priority: Sources from NPC's lifetime
      if (sourceYear >= npcBirthYear && sourceYear <= npcDeathYear) {
        score = 1000 - Math.abs(sourceYear - (npcBirthYear + 35)); // Peak relevance at middle age
      }
      // High priority: Sources from just before birth (parents' generation)
      else if (sourceYear >= npcBirthYear - 30 && sourceYear < npcBirthYear) {
        score = 800 - Math.abs(sourceYear - npcBirthYear);
      }
      // Medium priority: Sources from grandparents' generation
      else if (sourceYear >= npcBirthYear - 60 && sourceYear < npcBirthYear - 30) {
        score = 600 - Math.abs(sourceYear - (npcBirthYear - 45));
      }
      // Lower priority: Sources from after NPC's death but same century
      else if (sourceYear > npcDeathYear && sourceYear <= npcDeathYear + 30) {
        score = 400 - Math.abs(sourceYear - npcDeathYear);
      }
      // Lowest priority: All other sources, scored by distance
      else {
        const distance = Math.abs(sourceYear - npcBirthYear);
        score = Math.max(0, 200 - distance / 10);
      }
      
      return { source, score };
    });
    
    // Sort by score (highest first) and return top N
    scoredSources.sort((a, b) => b.score - a.score);
    
    // If we have enough sources, return the most relevant
    const topSources = scoredSources.slice(0, count).map(item => item.source);
    
    // Log for debugging
    console.log(`Selected sources for NPC born ${npcBirthYear}:`, 
      topSources.map(s => `${s.title} (${s.year})`))
    
    return topSources;
  }

  /**
   * Get sources appropriate for ruins from a specific construction period
   * @param constructionYear The year the ruins were built
   * @param culturalZone The cultural zone where the ruins are located
   * @param region The specific region
   * @returns Sources from the construction period
   */
  async getSourcesForRuin(
    constructionYear: number,
    culturalZone: CulturalZone,
    region?: string
  ): Promise<PrimarySourceMetadata[]> {
    // Load all sources for the cultural zone
    const allSources = await this.getSourcesForContext(undefined as any, culturalZone);

    // Filter for sources from the construction period
    // Sources should be from BEFORE or DURING construction
    // We want texts that would have existed when the building was in use
    const relevantSources = allSources.filter(source => {
      // Source must be from before or shortly after construction
      // Allow up to 100 years after construction (building's active period)
      // And up to 500 years before (cultural continuity)
      return source.year <= constructionYear + 100 &&
             source.year >= constructionYear - 500;
    });

    // Sort by closeness to construction date
    relevantSources.sort((a, b) => {
      const aDist = Math.abs(a.year - constructionYear);
      const bDist = Math.abs(b.year - constructionYear);
      return aDist - bDist;
    });

    // Return top 10 most relevant sources
    return relevantSources.slice(0, 10);
  }

  /**
   * Preload sources for a given context
   */
  async preloadContext(era: HistoricalEra, zone: CulturalZone): Promise<void> {
    await this.getSourcesForContext(era, zone);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.fullTextCache.clear();

    if (this.db) {
      const transaction = this.db.transaction(['fullTexts'], 'readwrite');
      const store = transaction.objectStore('fullTexts');
      store.clear();
    }
  }
}

// Export singleton instance
export const primarySourceService = new PrimarySourceService();