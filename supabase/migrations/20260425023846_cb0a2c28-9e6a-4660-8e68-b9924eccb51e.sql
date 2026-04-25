-- Bảng cài đặt AI per-user
CREATE TABLE public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  temperature numeric(3,2) NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  tone text NOT NULL DEFAULT 'professional' CHECK (tone IN ('professional','friendly','concise','detailed')),
  max_history integer NOT NULL DEFAULT 20 CHECK (max_history >= 0 AND max_history <= 100),
  custom_system_prompt text NOT NULL DEFAULT '',
  personal_context text NOT NULL DEFAULT '',
  auto_create_tasks boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own ai_settings select" ON public.ai_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ai_settings insert" ON public.ai_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ai_settings update" ON public.ai_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own ai_settings delete" ON public.ai_settings
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_ai_settings_updated_at
  BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_ai_settings_user ON public.ai_settings(user_id);