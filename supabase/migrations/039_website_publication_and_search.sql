-- 039_website_publication_and_search.sql
-- Purpose: idempotent realtime publication setup + full-text search indexes.

-- ---------------------------------------------------------------------------
-- 1) Ensure publication exists
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Idempotent publication entries
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'web_destinations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.web_destinations;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'web_universities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.web_universities;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'web_scholarships'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.web_scholarships;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'web_faqs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.web_faqs;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'web_partners'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.web_partners;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'news_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.news_posts;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'website_courses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.website_courses;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'team_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'testimonials'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonials;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Full-text search generated vectors + indexes
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.web_universities
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce(name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(content_html, '')
    )
  ) STORED;

ALTER TABLE IF EXISTS public.news_posts
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' ||
      coalesce(excerpt, '') || ' ' ||
      coalesce(content, '')
    )
  ) STORED;

ALTER TABLE IF EXISTS public.web_faqs
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce(question, '') || ' ' ||
      coalesce(answer, '') || ' ' ||
      coalesce(category, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_web_universities_search
  ON public.web_universities USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_news_posts_search
  ON public.news_posts USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_web_faqs_search
  ON public.web_faqs USING gin(search_vector);

