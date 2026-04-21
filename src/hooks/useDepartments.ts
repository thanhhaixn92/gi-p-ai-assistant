import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Department {
  id: string;
  user_id: string;
  code: string;
  name: string;
  created_at: string;
}

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || `bp_${Date.now().toString(36)}`;
}

export function useDepartments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["departments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Department[];
    },
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Chưa đăng nhập");
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Tên bộ phận không được trống");
      if (trimmed.length > 80) throw new Error("Tên bộ phận tối đa 80 ký tự");

      const base = slugify(trimmed);
      let code = base;
      // Try a few times to avoid collisions per user
      for (let i = 0; i < 5; i++) {
        const { data: existing } = await supabase
          .from("departments")
          .select("id")
          .eq("user_id", user.id)
          .eq("code", code)
          .maybeSingle();
        if (!existing) break;
        code = `${base}_${i + 2}`;
      }

      const { data, error } = await supabase
        .from("departments")
        .insert({ user_id: user.id, code, name: trimmed })
        .select()
        .single();
      if (error) throw error;
      return data as Department;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Đã thêm bộ phận");
    },
    onError: (e: Error) => toast.error("Thêm bộ phận thất bại", { description: e.message }),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("departments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Đã xoá bộ phận khỏi danh sách");
    },
    onError: (e: Error) => toast.error("Xoá thất bại", { description: e.message }),
  });
}
