import { supabase } from "@/integrations/supabase/client";
import type {
  EditorialSession,
  EditorialSource,
  EditorialVersion,
  EditorialArticleType,
  EditorialTaskType,
  EditorialTone,
  EditorialSessionStatus,
} from "@/types/editorial";

export async function listSessions(): Promise<EditorialSession[]> {
  const { data, error } = await supabase
    .from("editorial_sessions")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EditorialSession[];
}

export async function getSession(id: string): Promise<EditorialSession | null> {
  const { data, error } = await supabase
    .from("editorial_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as EditorialSession) ?? null;
}

export interface CreateSessionInput {
  title: string;
  article_type: EditorialArticleType;
  task_type: EditorialTaskType;
  tone: EditorialTone;
  brief: string;
  category_code?: string | null;
  assignment_code?: string | null;
}

export async function createSession(input: CreateSessionInput): Promise<EditorialSession> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Chưa đăng nhập");
  const { data, error } = await supabase
    .from("editorial_sessions")
    .insert({
      ...input,
      user_id: u.user.id,
      status: "draft" as EditorialSessionStatus,
      current_content: "",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as EditorialSession;
}

export async function updateSession(
  id: string,
  patch: Partial<EditorialSession>
): Promise<void> {
  const { error } = await supabase.from("editorial_sessions").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from("editorial_sessions").delete().eq("id", id);
  if (error) throw error;
}

export async function listSources(sessionId: string): Promise<EditorialSource[]> {
  const { data, error } = await supabase
    .from("editorial_sources")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EditorialSource[];
}

export interface AddSourceInput {
  session_id: string;
  source_type: "link" | "file" | "text";
  label?: string;
  url?: string;
  storage_path?: string;
  raw_text?: string;
}

export async function addSource(input: AddSourceInput): Promise<EditorialSource> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Chưa đăng nhập");
  const { data, error } = await supabase
    .from("editorial_sources")
    .insert({ ...input, user_id: u.user.id })
    .select("*")
    .single();
  if (error) throw error;
  return data as EditorialSource;
}

export async function deleteSource(id: string): Promise<void> {
  const { error } = await supabase.from("editorial_sources").delete().eq("id", id);
  if (error) throw error;
}

export async function listVersions(sessionId: string): Promise<EditorialVersion[]> {
  const { data, error } = await supabase
    .from("editorial_versions")
    .select("*")
    .eq("session_id", sessionId)
    .order("version_number", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EditorialVersion[];
}

export async function snapshotVersion(
  sessionId: string,
  content: string,
  note?: string
): Promise<EditorialVersion> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Chưa đăng nhập");
  const { data: existing, error: e1 } = await supabase
    .from("editorial_versions")
    .select("version_number")
    .eq("session_id", sessionId)
    .order("version_number", { ascending: false })
    .limit(1);
  if (e1) throw e1;
  const next = (existing?.[0]?.version_number ?? 0) + 1;
  const { data, error } = await supabase
    .from("editorial_versions")
    .insert({
      session_id: sessionId,
      user_id: u.user.id,
      version_number: next,
      content,
      note: note ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as EditorialVersion;
}
