-- ============= ENUMS =============
CREATE TYPE public.editorial_article_type AS ENUM ('news','notice','report','plan','analysis','minutes','other');
CREATE TYPE public.editorial_task_type AS ENUM ('generate','edit','summarize','proofread','expand','shorten','normalize_tone');
CREATE TYPE public.editorial_tone AS ENUM ('formal','neutral','friendly','concise','detailed');
CREATE TYPE public.editorial_session_status AS ENUM ('draft','composing','reviewing_images','ready','exported','archived');
CREATE TYPE public.editorial_image_review AS ENUM ('suggested','approved','rejected');
CREATE TYPE public.editorial_image_quality AS ENUM ('unrated','good','broken','needs_replacement');

-- ============= TABLES =============
CREATE TABLE public.editorial_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  article_type public.editorial_article_type NOT NULL DEFAULT 'news',
  task_type public.editorial_task_type NOT NULL DEFAULT 'generate',
  tone public.editorial_tone NOT NULL DEFAULT 'formal',
  status public.editorial_session_status NOT NULL DEFAULT 'draft',
  brief TEXT NOT NULL DEFAULT '',
  current_content TEXT NOT NULL DEFAULT '',
  category_code TEXT,
  assignment_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.editorial_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.editorial_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'link',
  label TEXT,
  url TEXT,
  storage_path TEXT,
  raw_text TEXT,
  fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.editorial_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.editorial_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL DEFAULT '',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.editorial_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.editorial_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  alt_text TEXT NOT NULL DEFAULT '',
  paragraph_anchor TEXT,
  review_status public.editorial_image_review NOT NULL DEFAULT 'suggested',
  quality_status public.editorial_image_quality NOT NULL DEFAULT 'unrated',
  source TEXT NOT NULL DEFAULT 'generated',
  prompt TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.editorial_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.editorial_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  format TEXT NOT NULL DEFAULT 'docx',
  storage_path TEXT,
  file_name TEXT NOT NULL,
  approved_image_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============= INDEXES =============
CREATE INDEX idx_editorial_sessions_user ON public.editorial_sessions(user_id, updated_at DESC);
CREATE INDEX idx_editorial_sources_session ON public.editorial_sources(session_id);
CREATE INDEX idx_editorial_versions_session ON public.editorial_versions(session_id, version_number DESC);
CREATE INDEX idx_editorial_images_session ON public.editorial_images(session_id);
CREATE INDEX idx_editorial_images_review ON public.editorial_images(session_id, review_status);
CREATE INDEX idx_editorial_images_quality ON public.editorial_images(session_id, quality_status);
CREATE INDEX idx_editorial_exports_session ON public.editorial_exports(session_id);

-- ============= RLS =============
ALTER TABLE public.editorial_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_sources  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_exports  ENABLE ROW LEVEL SECURITY;

-- sessions
CREATE POLICY "own ed_sessions select" ON public.editorial_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ed_sessions insert" ON public.editorial_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ed_sessions update" ON public.editorial_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own ed_sessions delete" ON public.editorial_sessions FOR DELETE USING (auth.uid() = user_id);

-- sources
CREATE POLICY "own ed_sources select" ON public.editorial_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ed_sources insert" ON public.editorial_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ed_sources update" ON public.editorial_sources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own ed_sources delete" ON public.editorial_sources FOR DELETE USING (auth.uid() = user_id);

-- versions
CREATE POLICY "own ed_versions select" ON public.editorial_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ed_versions insert" ON public.editorial_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ed_versions delete" ON public.editorial_versions FOR DELETE USING (auth.uid() = user_id);

-- images
CREATE POLICY "own ed_images select" ON public.editorial_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ed_images insert" ON public.editorial_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ed_images update" ON public.editorial_images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own ed_images delete" ON public.editorial_images FOR DELETE USING (auth.uid() = user_id);

-- exports
CREATE POLICY "own ed_exports select" ON public.editorial_exports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ed_exports insert" ON public.editorial_exports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ed_exports delete" ON public.editorial_exports FOR DELETE USING (auth.uid() = user_id);

-- ============= TRIGGERS (updated_at) =============
CREATE TRIGGER trg_editorial_sessions_updated_at
  BEFORE UPDATE ON public.editorial_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_editorial_images_updated_at
  BEFORE UPDATE ON public.editorial_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============= STORAGE BUCKETS =============
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('editorial-files','editorial-files', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('editorial-images','editorial-images', false, 20971520, ARRAY['image/png','image/jpeg','image/webp','image/gif']::text[])
ON CONFLICT (id) DO NOTHING;

-- editorial-files policies (path = {user_id}/{session_id}/...)
CREATE POLICY "ed_files own select" ON storage.objects FOR SELECT
  USING (bucket_id = 'editorial-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ed_files own insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'editorial-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ed_files own update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'editorial-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ed_files own delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'editorial-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- editorial-images policies
CREATE POLICY "ed_images own select" ON storage.objects FOR SELECT
  USING (bucket_id = 'editorial-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ed_images own insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'editorial-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ed_images own update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'editorial-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ed_images own delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'editorial-images' AND auth.uid()::text = (storage.foldername(name))[1]);