-- 1. departments table
CREATE TABLE public.departments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own departments select" ON public.departments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own departments insert" ON public.departments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own departments update" ON public.departments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own departments delete" ON public.departments
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_departments_user ON public.departments(user_id);

-- 2. add department_codes to tasks
ALTER TABLE public.tasks
  ADD COLUMN department_codes text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX idx_tasks_department_codes ON public.tasks USING GIN(department_codes);

-- 3. task_contacts table
CREATE TABLE public.task_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  role text,
  phone text,
  email text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own task_contacts select" ON public.task_contacts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own task_contacts insert" ON public.task_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own task_contacts update" ON public.task_contacts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own task_contacts delete" ON public.task_contacts
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_task_contacts_task ON public.task_contacts(task_id);

-- 4. task_attachments table
CREATE TABLE public.task_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own task_attachments select" ON public.task_attachments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own task_attachments insert" ON public.task_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own task_attachments delete" ON public.task_attachments
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_task_attachments_task ON public.task_attachments(task_id);

-- 5. storage bucket for task files (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-files',
  'task-files',
  false,
  26214400, -- 25 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/heic',
    'text/plain',
    'text/csv',
    'application/zip'
  ]
);

-- Storage policies: files stored under {user_id}/{task_id}/{filename}
CREATE POLICY "own task-files select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'task-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own task-files insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'task-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own task-files delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'task-files' AND auth.uid()::text = (storage.foldername(name))[1]);