import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AITone = "professional" | "friendly" | "concise" | "detailed";

export interface AISettings {
  model: string;
  temperature: number;
  tone: AITone;
  max_history: number;
  custom_system_prompt: string;
  personal_context: string;
  auto_create_tasks: boolean;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  model: "google/gemini-2.5-flash",
  temperature: 0.7,
  tone: "professional",
  max_history: 20,
  custom_system_prompt: "",
  personal_context: "",
  auto_create_tasks: true,
};

export const AI_MODELS: { value: string; label: string; hint: string }[] = [
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", hint: "Cân bằng tốc độ + chất lượng (mặc định, miễn phí đến 13/10/2025)" },
  { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", hint: "Nhanh nhất, rẻ nhất — phù hợp việc đơn giản" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", hint: "Mạnh nhất Gemini — suy luận sâu, ngữ cảnh lớn" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini", hint: "Cân bằng giữa GPT-5 và chi phí" },
  { value: "openai/gpt-5", label: "GPT-5", hint: "Cao cấp nhất, suy luận xuất sắc — đắt hơn" },
  { value: "openai/gpt-5-nano", label: "GPT-5 Nano", hint: "Nhỏ + nhanh, dùng cho tác vụ khối lượng lớn" },
];

export const TONE_OPTIONS: { value: AITone; label: string; desc: string }[] = [
  { value: "professional", label: "Chuyên nghiệp", desc: "Hành chính, trang trọng, súc tích" },
  { value: "friendly", label: "Thân thiện", desc: "Gần gũi, lịch sự, dễ tiếp cận" },
  { value: "concise", label: "Cực ngắn gọn", desc: "Trả lời thẳng, gạch đầu dòng tối giản" },
  { value: "detailed", label: "Chi tiết", desc: "Giải thích đầy đủ, có ví dụ + bối cảnh" },
];

export function useAISettings() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["ai_settings", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AISettings> => {
      if (!user) return DEFAULT_AI_SETTINGS;
      const { data, error } = await supabase
        .from("ai_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return DEFAULT_AI_SETTINGS;
      return {
        model: data.model ?? DEFAULT_AI_SETTINGS.model,
        temperature: typeof data.temperature === "number" ? data.temperature : Number(data.temperature ?? DEFAULT_AI_SETTINGS.temperature),
        tone: (data.tone as AITone) ?? DEFAULT_AI_SETTINGS.tone,
        max_history: data.max_history ?? DEFAULT_AI_SETTINGS.max_history,
        custom_system_prompt: data.custom_system_prompt ?? "",
        personal_context: data.personal_context ?? "",
        auto_create_tasks: data.auto_create_tasks ?? true,
      };
    },
  });

  const mutation = useMutation({
    mutationFn: async (patch: Partial<AISettings>) => {
      if (!user) throw new Error("Chưa đăng nhập");
      const current = query.data ?? DEFAULT_AI_SETTINGS;
      const next = { ...current, ...patch };
      const { error } = await supabase
        .from("ai_settings")
        .upsert(
          { user_id: user.id, ...next },
          { onConflict: "user_id" },
        );
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      qc.setQueryData(["ai_settings", user?.id], next);
    },
  });

  const reset = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Chưa đăng nhập");
      const { error } = await supabase
        .from("ai_settings")
        .upsert(
          { user_id: user.id, ...DEFAULT_AI_SETTINGS },
          { onConflict: "user_id" },
        );
      if (error) throw error;
      return DEFAULT_AI_SETTINGS;
    },
    onSuccess: (next) => {
      qc.setQueryData(["ai_settings", user?.id], next);
    },
  });

  return {
    settings: query.data ?? DEFAULT_AI_SETTINGS,
    isLoading: query.isLoading,
    update: mutation.mutateAsync,
    isSaving: mutation.isPending,
    reset: reset.mutateAsync,
    isResetting: reset.isPending,
  };
}
