import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Note, NoteInsert, NoteUpdate } from "@/types/note";
import { toast } from "sonner";

export interface NoteFilters {
  category_code?: string;
  assignment_code?: string;
  search?: string;
  tag?: string;
}

export function useNotes(filters: NoteFilters = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notes", user?.id, filters],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("notes")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (filters.category_code) q = q.eq("category_code", filters.category_code);
      if (filters.assignment_code) q = q.eq("assignment_code", filters.assignment_code);
      if (filters.tag) q = q.contains("tags", [filters.tag]);
      if (filters.search && filters.search.trim()) {
        const s = filters.search.trim().replace(/[%_]/g, "");
        q = q.or(`title.ilike.%${s}%,content.ilike.%${s}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Note[];
    },
  });
}

export function useNote(id?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["note", id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return (data as Note | null) ?? null;
    },
  });
}

export function useAllTags() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["note-tags", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("notes").select("tags");
      if (error) throw error;
      const set = new Set<string>();
      (data ?? []).forEach((r) => (r.tags ?? []).forEach((t: string) => set.add(t)));
      return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
    },
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<NoteInsert, "user_id">) => {
      if (!user) throw new Error("Chưa đăng nhập");
      const { data, error } = await supabase
        .from("notes")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["note-tags"] });
      toast.success("Đã lưu ghi chú");
    },
    onError: (e: Error) => toast.error("Lưu ghi chú thất bại", { description: e.message }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: NoteUpdate }) => {
      const { data, error } = await supabase.from("notes").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["note-tags"] });
    },
    onError: (e: Error) => toast.error("Cập nhật thất bại", { description: e.message }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["note-tags"] });
      toast.success("Đã xoá ghi chú");
    },
    onError: (e: Error) => toast.error("Xoá thất bại", { description: e.message }),
  });
}
