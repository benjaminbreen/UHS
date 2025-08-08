/**
 * Primary Source Service
 * Handles fetching, searching, and managing primary sources
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Era, CulturalZone } from '../types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Initialize R2 client (Cloudflare R2 is S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: import.meta.env.VITE_R2_ENDPOINT || '',
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY || '',
  },
});

export interface PrimarySource {
  id: string;
  identifier: string;
  title: string;
  author?: string;
  translator?: string;
  original_date: string;
  publication_date?: string;
  era: string;
  culture_zone: string;
  document_type: string;
  language: string;
  original_language?: string;
  regions: string[];
  coordinates?: { lat: number; lon: number };
  description: string;
  text_content: string;
  text_format: 'markdown' | 'plaintext' | 'html';
  page_count?: number;
  word_count?: number;
  pdf_url?: string;
  thumbnail_url?: string;
  images?: Array<{ url: string; caption?: string }>;
  keywords: string[];
  topics: string[];
  people: string[];
  places: string[];
  difficulty_level: number;
  reading_time_minutes?: number;
  curriculum_tags: string[];
  archive_url?: string;
  archive_identifier?: string;
  license: string;
  attribution?: string;
  is_featured: boolean;
  view_count: number;
}

export interface SearchOptions {
  query?: string;
  era?: Era;
  culture_zone?: CulturalZone;
  regions?: string[];
  keywords?: string[];
  document_type?: string;
  difficulty_level?: number;
  limit?: number;
  offset?: number;
}

class PrimarySourceService {
  /**
   * Search for primary sources by keyword
   */
  async searchByKeyword(keyword: string): Promise<PrimarySource[]> {
    try {
      const { data, error } = await supabase
        .from('primary_sources')
        .select('*')
        .contains('keywords', [keyword])
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching sources by keyword:', error);
      return [];
    }
  }

  /**
   * Get sources by era and region
   */
  async getByEraAndRegion(era: string, region: string): Promise<PrimarySource[]> {
    try {
      const { data, error } = await supabase
        .from('primary_sources')
        .select('*')
        .eq('era', era)
        .contains('regions', [region])
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sources by era and region:', error);
      return [];
    }
  }

  /**
   * Get a single source by ID
   */
  async getById(id: string): Promise<PrimarySource | null> {
    try {
      const { data, error } = await supabase
        .from('primary_sources')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Generate presigned URL for PDF if needed
      if (data && data.archive_identifier) {
        data.pdf_url = await this.getPresignedPdfUrl(data.archive_identifier);
      }

      // Increment view count
      await this.incrementViewCount(id);

      return data;
    } catch (error) {
      console.error('Error fetching source by ID:', error);
      return null;
    }
  }

  /**
   * Full-text search across all sources
   */
  async fullTextSearch(query: string, options: SearchOptions = {}): Promise<PrimarySource[]> {
    try {
      let queryBuilder = supabase
        .from('primary_sources')
        .select('*')
        .textSearch('search_vector', query);

      // Apply filters
      if (options.era) {
        queryBuilder = queryBuilder.eq('era', options.era);
      }
      if (options.culture_zone) {
        queryBuilder = queryBuilder.eq('culture_zone', options.culture_zone);
      }
      if (options.document_type) {
        queryBuilder = queryBuilder.eq('document_type', options.document_type);
      }
      if (options.difficulty_level) {
        queryBuilder = queryBuilder.lte('difficulty_level', options.difficulty_level);
      }

      const { data, error } = await queryBuilder
        .limit(options.limit || 20)
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error performing full-text search:', error);
      return [];
    }
  }

  /**
   * Get featured sources for homepage
   */
  async getFeaturedSources(): Promise<PrimarySource[]> {
    try {
      const { data, error } = await supabase
        .from('primary_sources')
        .select('*')
        .eq('is_featured', true)
        .limit(6);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured sources:', error);
      return [];
    }
  }

  /**
   * Save a source to user's collection
   */
  async saveToUserCollection(userId: string, sourceId: string, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_saved_sources')
        .upsert({
          user_id: userId,
          source_id: sourceId,
          notes,
          saved_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving source to collection:', error);
      return false;
    }
  }

  /**
   * Get user's saved sources
   */
  async getUserSavedSources(userId: string): Promise<PrimarySource[]> {
    try {
      const { data, error } = await supabase
        .from('user_saved_sources')
        .select('*, primary_sources(*)')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

      if (error) throw error;
      return data?.map(item => item.primary_sources) || [];
    } catch (error) {
      console.error('Error fetching user saved sources:', error);
      return [];
    }
  }

  /**
   * Get sources related to current one (by keywords and topics)
   */
  async getRelatedSources(sourceId: string, limit: number = 5): Promise<PrimarySource[]> {
    try {
      // First get the current source
      const { data: currentSource, error: sourceError } = await supabase
        .from('primary_sources')
        .select('keywords, topics, era, culture_zone')
        .eq('id', sourceId)
        .single();

      if (sourceError || !currentSource) return [];

      // Find sources with overlapping keywords or topics
      const { data, error } = await supabase
        .from('primary_sources')
        .select('*')
        .neq('id', sourceId)
        .or(`keywords.ov.{${currentSource.keywords.join(',')}},topics.ov.{${currentSource.topics.join(',')}}`)
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching related sources:', error);
      return [];
    }
  }

  /**
   * Scan text for keywords and return matching sources
   */
  async scanTextForKeywords(text: string): Promise<Map<string, PrimarySource[]>> {
    try {
      // Get all unique keywords from database
      const { data: sources, error } = await supabase
        .from('primary_sources')
        .select('id, identifier, title, keywords');

      if (error || !sources) return new Map();

      const keywordMap = new Map<string, PrimarySource[]>();
      const textLower = text.toLowerCase();

      // Check each source's keywords against the text
      for (const source of sources) {
        for (const keyword of source.keywords) {
          if (textLower.includes(keyword.toLowerCase())) {
            if (!keywordMap.has(keyword)) {
              keywordMap.set(keyword, []);
            }
            keywordMap.get(keyword)?.push(source as PrimarySource);
          }
        }
      }

      return keywordMap;
    } catch (error) {
      console.error('Error scanning text for keywords:', error);
      return new Map();
    }
  }

  /**
   * Generate presigned URL for PDF download
   */
  private async getPresignedPdfUrl(identifier: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: 'primary-sources',
        Key: `pdfs/${identifier}.pdf`,
      });

      // URL valid for 7 days
      const url = await getSignedUrl(r2Client, command, { expiresIn: 604800 });
      return url;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      return '';
    }
  }

  /**
   * Increment view count for analytics
   */
  private async incrementViewCount(sourceId: string): Promise<void> {
    try {
      await supabase.rpc('increment_source_view_count', { source_uuid: sourceId });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }

  /**
   * Track user action (view, download, save, etc.)
   */
  async trackUserAction(
    sourceId: string,
    action: 'view' | 'download_pdf' | 'save' | 'cite',
    userId?: string,
    duration?: number
  ): Promise<void> {
    try {
      await supabase.from('source_views').insert({
        source_id: sourceId,
        user_id: userId || null,
        action,
        duration_seconds: duration || null,
        viewed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking user action:', error);
    }
  }
}

// Export singleton instance
export const primarySourceService = new PrimarySourceService();