-- Primary Sources Database Schema for Supabase
-- Run this in your Supabase SQL editor

-- Create custom types
CREATE TYPE era_type AS ENUM (
  'prehistoric', 'ancient', 'classical', 'medieval', 
  'early_modern', 'industrial', 'modern', 'contemporary'
);

CREATE TYPE culture_zone_type AS ENUM (
  'ancient_egypt', 'ancient_greece', 'ancient_rome', 'ancient_china', 'ancient_india',
  'ancient_mesopotamia', 'byzantine', 'islamic', 'european', 'near_eastern', 
  'east_asian', 'south_asian', 'southeast_asian', 'african', 'american', 
  'mesoamerican', 'oceanic', 'global'
);

CREATE TYPE document_type AS ENUM (
  'legal', 'literary', 'religious', 'philosophical', 'historical',
  'scientific', 'economic', 'personal', 'governmental', 'military',
  'medical', 'technical', 'agricultural', 'artistic', 'exploratory'
);

-- Main primary sources table
CREATE TABLE primary_sources (
  -- Core Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT UNIQUE NOT NULL,
  
  -- Basic Metadata
  title TEXT NOT NULL,
  author TEXT,
  translator TEXT,
  original_date TEXT, -- "1215", "c. 500 BCE", "14th century"
  publication_date DATE,
  
  -- Classification
  era era_type NOT NULL,
  culture_zone culture_zone_type NOT NULL,
  document_type document_type NOT NULL,
  language TEXT DEFAULT 'English',
  original_language TEXT,
  
  -- Geographic Context
  regions TEXT[] NOT NULL,
  coordinates POINT,
  
  -- Content
  description TEXT NOT NULL,
  text_content TEXT NOT NULL,
  text_format TEXT DEFAULT 'markdown',
  page_count INTEGER,
  word_count INTEGER,
  
  -- Storage URLs (will be R2 presigned URLs)
  pdf_url TEXT,
  thumbnail_url TEXT,
  images JSONB DEFAULT '[]',
  
  -- Keywords & Topics
  keywords TEXT[] NOT NULL,
  topics TEXT[] DEFAULT '{}',
  people TEXT[] DEFAULT '{}',
  places TEXT[] DEFAULT '{}',
  
  -- Educational Metadata
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  reading_time_minutes INTEGER,
  curriculum_tags TEXT[] DEFAULT '{}',
  
  -- Source Attribution
  archive_url TEXT,
  archive_identifier TEXT,
  license TEXT DEFAULT 'public_domain',
  attribution TEXT,
  
  -- System Fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  is_processed BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX idx_ps_era ON primary_sources(era);
CREATE INDEX idx_ps_culture ON primary_sources(culture_zone);
CREATE INDEX idx_ps_document_type ON primary_sources(document_type);
CREATE INDEX idx_ps_keywords ON primary_sources USING GIN(keywords);
CREATE INDEX idx_ps_regions ON primary_sources USING GIN(regions);
CREATE INDEX idx_ps_topics ON primary_sources USING GIN(topics);
CREATE INDEX idx_ps_people ON primary_sources USING GIN(people);
CREATE INDEX idx_ps_places ON primary_sources USING GIN(places);
CREATE INDEX idx_ps_identifier ON primary_sources(identifier);
CREATE INDEX idx_ps_archive_id ON primary_sources(archive_identifier);

-- Full text search
ALTER TABLE primary_sources ADD COLUMN search_vector tsvector;

CREATE OR REPLACE FUNCTION primary_sources_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.author, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.text_content, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER primary_sources_search_update 
BEFORE INSERT OR UPDATE ON primary_sources 
FOR EACH ROW EXECUTE FUNCTION primary_sources_search_trigger();

CREATE INDEX idx_ps_search ON primary_sources USING GIN(search_vector);

-- User saved sources
CREATE TABLE user_saved_sources (
  user_id TEXT NOT NULL,
  source_id UUID REFERENCES primary_sources(id) ON DELETE CASCADE,
  saved_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  PRIMARY KEY (user_id, source_id)
);

-- Source keywords with weights
CREATE TABLE source_keywords (
  source_id UUID REFERENCES primary_sources(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  weight FLOAT DEFAULT 1.0,
  context TEXT,
  PRIMARY KEY (source_id, keyword)
);

-- View tracking
CREATE TABLE source_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES primary_sources(id) ON DELETE CASCADE,
  user_id TEXT,
  viewed_at TIMESTAMP DEFAULT NOW(),
  duration_seconds INTEGER,
  action TEXT -- 'view', 'download_pdf', 'save', 'cite'
);

-- Enable Row Level Security
ALTER TABLE primary_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_views ENABLE ROW LEVEL SECURITY;

-- Policies for public read access
CREATE POLICY "Public sources are viewable by everyone" 
ON primary_sources FOR SELECT 
USING (true);

CREATE POLICY "Keywords are viewable by everyone" 
ON source_keywords FOR SELECT 
USING (true);

-- User-specific policies
CREATE POLICY "Users can manage their own saved sources" 
ON user_saved_sources FOR ALL 
USING (user_id = current_user);

CREATE POLICY "Users can track their own views" 
ON source_views FOR INSERT 
WITH CHECK (user_id = current_user OR user_id IS NULL);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_source_view_count(source_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE primary_sources 
  SET view_count = view_count + 1 
  WHERE id = source_uuid;
END;
$$ LANGUAGE plpgsql;